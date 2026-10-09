import AVFoundation

/// Synthesizer und Musik-Sequenzer. Alles wird zur Laufzeit erzeugt –
/// das Projekt braucht keine Audiodateien.
///
/// Jedes Kapitel hat ein eigenes Stück: Akkordfolge, Arpeggio-Figur, Bass,
/// Klangfläche und eine auskomponierte Melodie, die nur jeden zweiten
/// Durchgang erklingt, damit die Musik ruhig im Hintergrund bleibt.
final class SoundEngine {
    static let shared = SoundEngine()

    enum Timbre { case sine, bell, piano, ocarina, musicBox, bass, pad, noise, koto, flute, taiko }

    private struct Voice {
        var freq: Double
        var amp: Double
        var attack: Double
        var hold: Double
        var decay: Double
        var timbre: Timbre
        var delay: Int = 0
        var phase: Double = 0
        var age: Double = 0
        var music: Bool = false
    }

    struct Song {
        let bpm: Double
        let chords: [[Int]]                 // MIDI-Noten pro Takt
        let arpeggio: [Int]                 // Indizes in Akkord + Oktave, 8 Achtel
        let arpTimbre: Timbre
        let arpOctave: Int
        let melody: [[(Int, Int)]]          // pro Takt: (MIDI-Note oder 0 = Pause, Länge in Achteln)
        let melodyTimbre: Timbre
        let bassEveryHalf: Bool
        let padLevel: Double
        /// Achtel pro Takt (6 = Walzer im 3/4-Takt).
        var stepsPerBar = 8
        /// Bass pro Achtel: Halbtöne über dem Grundton oder −1 für Pause (nil = Standardmuster).
        var bassPattern: [Int]? = nil
        /// Achtel, auf denen die Taiko schlägt, und in jedem wievielten Takt.
        var taiko: [Int] = []
        var taikoEvery = 1
        /// Ab welchem Takt des 16-Takte-Bogens die Melodie einsetzt.
        var melodyFrom = 8

        /// Dasselbe Stück in anderer Tonart, anderem Tempo und mit anderen Instrumenten.
        func variant(transpose t: Int, bpm newBpm: Double, arp: Timbre, melody: Timbre, from: Int? = nil) -> Song {
            var s = Song(bpm: newBpm, chords: chords.map { $0.map { $0 + t } }, arpeggio: arpeggio, arpTimbre: arp, arpOctave: arpOctave,
                         melody: self.melody.map { bar in bar.map { ($0.0 > 0 ? $0.0 + t : 0, $0.1) } }, melodyTimbre: melody,
                         bassEveryHalf: bassEveryHalf, padLevel: padLevel)
            s.stepsPerBar = stepsPerBar
            s.bassPattern = bassPattern
            s.taiko = taiko
            s.taikoEvery = taikoEvery
            s.melodyFrom = from ?? melodyFrom
            return s
        }
    }

    private let engine = AVAudioEngine()
    private var source: AVAudioSourceNode?
    private let lock = NSLock()
    private var voices: [Voice] = []
    private var sampleRate: Double = 44_100
    private var time: Double = 0
    private var windState: Double = 0
    private var noiseSeed: UInt32 = 22_222
    private var started = false
    private var volume: Double = 1
    private var musicGain: Double = 0
    private var musicTarget: Double = 0

    // Sequenzer-Zustand (nur unter `lock`)
    private var song: Song?
    private var eighthCounter = 0
    private var sampleInEighth: Double = 0

    var enabled = true {
        didSet {
            lock.lock()
            volume = enabled ? 1 : 0
            lock.unlock()
        }
    }

    /// Eigene Queue: Audio-Session aktivieren und Engine starten blockiert und
    /// darf deshalb nicht auf dem Haupt-Thread laufen.
    private let setupQueue = DispatchQueue(label: "wolkenpfad.audio.setup", qos: .userInitiated)

    func start() {
        guard !started else { return }
        started = true
        setupQueue.async { [self] in
            setUpEngine()
        }
    }

    private func setUpEngine() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.ambient, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("Audio-Session: \(error)")
        }
        let output = engine.outputNode.inputFormat(forBus: 0)
        let rate = output.sampleRate > 0 ? output.sampleRate : 44_100
        lock.lock()
        sampleRate = rate
        lock.unlock()
        guard let format = AVAudioFormat(standardFormatWithSampleRate: rate, channels: 2) else { return }
        let node = AVAudioSourceNode { [unowned self] _, _, frameCount, bufferList -> OSStatus in
            self.render(frames: Int(frameCount), bufferList: bufferList)
            return noErr
        }
        source = node
        engine.attach(node)
        engine.connect(node, to: engine.mainMixerNode, format: format)
        engine.mainMixerNode.outputVolume = 0.85
        do {
            try engine.start()
        } catch {
            print("Audio-Engine: \(error)")
        }
    }

    // MARK: - Musik

    /// Startet das Stück zur Stimmung eines Kapitels ("day", "evening", "night", "town", "satoyama", "fuji").
    func playMusic(theme: String) {
        let s = SoundEngine.song(for: theme)
        lock.lock()
        song = s
        eighthCounter = 0
        sampleInEighth = 0
        musicGain = 0
        musicTarget = 1
        voices.removeAll { $0.music }
        lock.unlock()
    }

    /// Musik leiser stellen, z. B. für das Finale.
    func duckMusic(_ level: Double) {
        lock.lock()
        musicTarget = level
        lock.unlock()
    }

    /// Stücke der 18 Kapitel: sechs Grundstücke, je Kapitel in eigener Tonart, eigenem Tempo und eigener Farbe.
    static func song(for theme: String) -> Song {
        switch theme {
        case "attic": return base("night").variant(transpose: 8, bpm: 60, arp: .musicBox, melody: .piano)
        case "mist": return base("satoyama").variant(transpose: -2, bpm: 62, arp: .musicBox, melody: .flute)
        case "grassvale": return base("day").variant(transpose: 2, bpm: 86, arp: .koto, melody: .ocarina, from: 0)
        case "mill": return base("town").variant(transpose: -2, bpm: 88, arp: .piano, melody: .ocarina)
        case "storm": return base("evening").variant(transpose: -3, bpm: 56, arp: .piano, melody: .flute)
        case "glasslake": return base("fuji").variant(transpose: 0, bpm: 68, arp: .musicBox, melody: .flute)
        case "bellflower": return base("night").variant(transpose: 3, bpm: 62, arp: .musicBox, melody: .musicBox)
        case "giant": return base("satoyama").variant(transpose: -5, bpm: 58, arp: .koto, melody: .ocarina)
        case "sunbeam": return base("evening").variant(transpose: 3, bpm: 70, arp: .koto, melody: .ocarina)
        case "bridgeworks": return base("town").variant(transpose: 0, bpm: 104, arp: .koto, melody: .piano)
        case "skygarden": return base("fuji").variant(transpose: 2, bpm: 88, arp: .koto, melody: .flute)
        case "ruins": return base("night").variant(transpose: -2, bpm: 54, arp: .koto, melody: .flute)
        case "echo": return base("evening").variant(transpose: -5, bpm: 56, arp: .musicBox, melody: .musicBox)
        case "heart": return base("satoyama").variant(transpose: 4, bpm: 76, arp: .musicBox, melody: .flute, from: 0)
        case "horizon": return base("day").variant(transpose: 0, bpm: 80, arp: .piano, melody: .ocarina, from: 0)
        default: return base(theme)
        }
    }

    private static func base(_ theme: String) -> Song {
        switch theme {
        case "evening":
            // Abendfluss – d-Moll/dorisch, Okarina über wiegendem Klavier
            return Song(
                bpm: 66,
                chords: [[50, 53, 57, 64], [46, 50, 53, 57], [53, 57, 60, 64], [48, 52, 55, 60],
                         [43, 50, 53, 58], [45, 52, 55, 60], [46, 50, 53, 57], [45, 49, 52, 57]],
                arpeggio: [0, 2, 1, 3, 2, 4, 3, 2], arpTimbre: .piano, arpOctave: 0,
                melody: [[(81, 4), (79, 2), (77, 2)], [(74, 6), (0, 2)], [(77, 3), (79, 1), (81, 2), (84, 2)], [(81, 8)],
                         [(82, 3), (81, 1), (79, 2), (77, 2)], [(76, 4), (77, 2), (79, 2)], [(81, 3), (77, 1), (76, 2), (74, 2)], [(73, 6), (0, 2)]],
                melodyTimbre: .ocarina, bassEveryHalf: false, padLevel: 0.9)
        case "town":
            // Ziegeldächer im Wind – D-Dur-Walzer, Klavier mit Streicherfläche
            return Song(
                bpm: 96,
                chords: [[50, 54, 57, 62], [47, 50, 54, 59], [43, 50, 55, 59], [45, 52, 57, 61],
                         [42, 49, 54, 57], [47, 50, 54, 59], [40, 47, 52, 55], [45, 49, 52, 57]],
                arpeggio: [-1, 2, 3, -1, 2, 3], arpTimbre: .piano, arpOctave: 0,
                melody: [[(74, 2), (78, 2), (76, 1), (74, 1)], [(71, 4), (74, 2)], [(79, 3), (78, 1), (76, 2)], [(76, 4), (0, 2)],
                         [(78, 2), (81, 2), (78, 2)], [(74, 4), (71, 2)], [(76, 2), (79, 2), (78, 1), (76, 1)], [(73, 4), (0, 2)]],
                melodyTimbre: .piano, bassEveryHalf: false, padLevel: 0.8,
                stepsPerBar: 6, bassPattern: [0, -1, -1, -1, -1, -1], melodyFrom: 0)
        case "satoyama":
            // Reisfelder am Morgen – D-Pentatonik, Flöte über Koto, ab und zu eine Taiko
            return Song(
                bpm: 72,
                chords: [[50, 57, 62, 64], [45, 52, 57, 59], [40, 52, 55, 59], [50, 57, 62, 64],
                         [45, 52, 57, 59], [43, 50, 55, 59], [40, 52, 55, 59], [50, 57, 62, 64]],
                arpeggio: [0, -1, 2, 1, 3, -1, 4, 2], arpTimbre: .koto, arpOctave: 12,
                melody: [[(74, 4), (76, 2), (79, 2)], [(81, 6), (79, 2)], [(76, 4), (74, 2), (71, 2)], [(74, 8)],
                         [(81, 3), (83, 1), (81, 2), (79, 2)], [(79, 4), (76, 4)], [(76, 3), (74, 1), (71, 2), (69, 2)], [(74, 8)]],
                melodyTimbre: .flute, bassEveryHalf: false, padLevel: 0.8,
                bassPattern: [0, -1, -1, -1, 7, -1, -1, -1], taiko: [0], taikoEvery: 2, melodyFrom: 0)
        case "fuji":
            // Der weiße Gipfel – E-Pentatonik, aufsteigende Koto, Taiko und Flöte
            return Song(
                bpm: 80,
                chords: [[40, 47, 52, 59], [45, 52, 57, 61], [47, 54, 59, 64], [42, 49, 54, 57],
                         [40, 47, 52, 59], [47, 54, 59, 64], [37, 49, 52, 59], [42, 49, 54, 57]],
                arpeggio: [0, 1, 2, 3, 4, 5, 6, 7], arpTimbre: .koto, arpOctave: 12,
                melody: [[(76, 2), (78, 2), (81, 4)], [(81, 2), (83, 2), (85, 4)], [(83, 6), (81, 2)], [(78, 8)],
                         [(88, 4), (85, 2), (83, 2)], [(83, 4), (81, 2), (78, 2)], [(85, 3), (83, 1), (81, 2), (78, 2)], [(78, 4), (76, 4)]],
                melodyTimbre: .flute, bassEveryHalf: false, padLevel: 1,
                bassPattern: [0, -1, -1, -1, 0, -1, 7, -1], taiko: [0, 4, 6], melodyFrom: 0)
        case "night":
            // Laternenlied – a-Moll-Wiegenlied auf der Spieluhr
            return Song(
                bpm: 58,
                chords: [[45, 52, 57, 60], [41, 53, 57, 64], [48, 55, 60, 64], [43, 55, 59, 62],
                         [45, 52, 57, 60], [50, 53, 57, 60], [40, 52, 57, 59], [40, 52, 56, 59]],
                arpeggio: [4, 5, 6, 7, 6, 5, 4, 5], arpTimbre: .musicBox, arpOctave: 12,
                melody: [[(88, 2), (84, 2), (81, 2), (84, 2)], [(89, 4), (88, 2), (86, 2)], [(84, 2), (88, 2), (91, 4)], [(86, 8)],
                         [(88, 2), (84, 2), (81, 2), (84, 2)], [(86, 4), (84, 2), (83, 2)], [(81, 3), (83, 1), (84, 2), (83, 2)], [(80, 8)]],
                melodyTimbre: .musicBox, bassEveryHalf: false, padLevel: 1.3)
        default:
            // Der Samen – F-Dur, ruhige Klavier-Arpeggien
            return Song(
                bpm: 76,
                chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59],
                         [46, 50, 53, 57], [48, 52, 55, 60], [45, 48, 52, 55], [50, 53, 57, 60]],
                arpeggio: [0, 1, 2, 3, 4, 3, 2, 1], arpTimbre: .piano, arpOctave: 0,
                melody: [[(72, 3), (69, 1), (67, 2), (65, 2)], [(64, 4), (0, 2), (62, 2)], [(65, 3), (64, 1), (62, 2), (60, 2)], [(64, 6), (0, 2)],
                         [(62, 3), (65, 1), (69, 2), (70, 2)], [(72, 4), (67, 4)], [(69, 3), (67, 1), (64, 2), (62, 2)], [(65, 8)]],
                melodyTimbre: .piano, bassEveryHalf: true, padLevel: 0.7)
        }
    }

    private static func freq(_ midi: Int) -> Double { 440 * pow(2, Double(midi - 69) / 12) }

    /// Wird auf dem Audio-Thread zu jedem Achtel aufgerufen (unter `lock`).
    private func sequencerTick(_ s: Song) {
        let eighth = 60 / s.bpm / 2
        let steps = max(1, s.stepsPerBar)
        let bar = (eighthCounter / steps) % 16
        let step = eighthCounter % steps
        let chord = s.chords[bar % s.chords.count]
        let tones = chord + chord.map { $0 + 12 }

        // Arpeggio (−1 = Pause)
        let idx = s.arpeggio[step % s.arpeggio.count]
        if idx >= 0 {
            let note = tones[min(idx, tones.count - 1)] + s.arpOctave
            let arpAmp = s.arpTimbre == .musicBox ? 0.045 : (s.arpTimbre == .koto ? 0.04 : 0.05)
            let decay = s.arpTimbre == .musicBox ? 0.9 : (s.arpTimbre == .koto ? 0.7 : 1.1)
            voices.append(Voice(freq: SoundEngine.freq(note), amp: arpAmp * (step == 0 ? 1.25 : 1), attack: 0.004, hold: 0,
                                decay: decay, timbre: s.arpTimbre, music: true))
        }

        // Bass und Klangfläche
        if let pattern = s.bassPattern {
            let off = pattern[step % pattern.count]
            if off >= 0 {
                voices.append(Voice(freq: SoundEngine.freq(chord[0] - 12 + off), amp: 0.07, attack: 0.01, hold: 0, decay: 1.4,
                                    timbre: .bass, music: true))
            }
        } else if step == 0 || (s.bassEveryHalf && step == 4) {
            voices.append(Voice(freq: SoundEngine.freq(chord[0] - 12), amp: 0.07, attack: 0.01, hold: 0, decay: 1.6,
                                timbre: .bass, music: true))
        }
        if step == 0 {
            for n in chord.prefix(3) {
                voices.append(Voice(freq: SoundEngine.freq(n), amp: 0.012 * s.padLevel, attack: 1.2, hold: eighth * Double(steps - 1),
                                    decay: 1.4, timbre: .pad, music: true))
            }
        }

        // Taiko
        if s.taiko.contains(step) && bar % max(1, s.taikoEvery) == 0 {
            voices.append(Voice(freq: 72, amp: step == 0 ? 0.16 : 0.1, attack: 0.002, hold: 0, decay: 0.32,
                                timbre: .taiko, music: true))
        }

        // Melodie (Standard: zweite Hälfte des 16-Takte-Bogens)
        if bar >= s.melodyFrom {
            var pos = 0
            for (n, len) in s.melody[(bar - 8) % s.melody.count] {
                if pos == step && n > 0 {
                    let dur = Double(len) * eighth
                    switch s.melodyTimbre {
                    case .ocarina:
                        voices.append(Voice(freq: SoundEngine.freq(n), amp: 0.055, attack: 0.08, hold: dur * 0.75, decay: 0.35,
                                            timbre: .ocarina, music: true))
                    case .musicBox:
                        voices.append(Voice(freq: SoundEngine.freq(n), amp: 0.06, attack: 0.003, hold: 0, decay: 1.4,
                                            timbre: .musicBox, music: true))
                    case .flute:
                        voices.append(Voice(freq: SoundEngine.freq(n), amp: 0.05, attack: 0.07, hold: dur * 0.85, decay: 0.3,
                                            timbre: .flute, music: true))
                    default:
                        voices.append(Voice(freq: SoundEngine.freq(n), amp: 0.065, attack: 0.004, hold: 0, decay: max(0.8, dur * 1.2),
                                            timbre: .piano, music: true))
                    }
                }
                pos += len
            }
        }
    }

    // MARK: - Geräusche

    /// Ton der D-Pentatonik (0 = D4).
    static func note(_ degree: Int) -> Double {
        let scale = [0, 2, 4, 7, 9]
        let octave = Int((Double(degree) / 5).rounded(.down))
        let idx = ((degree % 5) + 5) % 5
        return 293.66 * pow(2, Double(octave * 12 + scale[idx]) / 12)
    }

    private func add(_ v: Voice) {
        lock.lock()
        voices.append(v)
        lock.unlock()
    }

    /// Lautstärke der Glockenspiel-Effekte (Verbindung, Druckplatte, Hinweis, Finale) relativ zur Musik.
    private let chimeLevel = 0.4

    func chime(_ degrees: [Int], spacing: Double = 0.12, amp: Double = 0.12) {
        lock.lock()
        for (i, d) in degrees.enumerated() {
            voices.append(Voice(freq: SoundEngine.note(d), amp: amp * chimeLevel, attack: 0.008, hold: 0, decay: 1.6, timbre: .bell,
                                delay: Int(Double(i) * spacing * sampleRate)))
        }
        lock.unlock()
    }

    func step() {
        add(Voice(freq: 120 + Double.random(in: 0...30), amp: 0.05, attack: 0.003, hold: 0, decay: 0.05, timbre: .noise))
    }

    func click() {
        add(Voice(freq: 1400, amp: 0.035, attack: 0.002, hold: 0, decay: 0.03, timbre: .sine))
        add(Voice(freq: 90, amp: 0.05, attack: 0.002, hold: 0, decay: 0.06, timbre: .noise))
    }

    func settle() {
        add(Voice(freq: 73.4, amp: 0.08, attack: 0.005, hold: 0, decay: 0.35, timbre: .sine))
        add(Voice(freq: 146.8, amp: 0.03, attack: 0.005, hold: 0, decay: 0.25, timbre: .bell))
    }

    func plate() {
        add(Voice(freq: 61.7, amp: 0.08, attack: 0.01, hold: 0, decay: 0.8, timbre: .sine))
        chime([2, 4, 7, 9], spacing: 0.09, amp: 0.08)
    }

    func rumble() {
        add(Voice(freq: 48, amp: 0.12, attack: 0.3, hold: 0.8, decay: 0.8, timbre: .noise))
        add(Voice(freq: 55, amp: 0.08, attack: 0.3, hold: 0.8, decay: 0.8, timbre: .sine))
    }

    func connect(illusion: Bool) {
        if illusion {
            chime([5, 7, 9, 12, 14], spacing: 0.11, amp: 0.11)
        } else {
            chime([7, 9], spacing: 0.1, amp: 0.09)
        }
    }

    func blocked() { chime([-3, -4], spacing: 0.12, amp: 0.06) }

    func hint() { chime([9, 12], spacing: 0.18, amp: 0.07) }

    func ending() {
        duckMusic(0.25)
        let melody = [0, 2, 4, 7, 4, 7, 9, 12, 9, 12, 14, 17, 19]
        chime(melody, spacing: 0.28, amp: 0.1)
        lock.lock()
        for (i, d) in [-5, 0, 4, 7].enumerated() {
            voices.append(Voice(freq: SoundEngine.note(d) / 2, amp: 0.05, attack: 0.4, hold: 2, decay: 4, timbre: .pad,
                                delay: Int(Double(i) * 0.05 * sampleRate)))
        }
        lock.unlock()
    }

    // MARK: - Audio-Thread

    private func nextNoise() -> Double {
        noiseSeed = noiseSeed &* 1_664_525 &+ 1_013_904_223
        return Double(noiseSeed >> 8) / Double(1 << 24) * 2 - 1
    }

    private func render(frames: Int, bufferList: UnsafeMutablePointer<AudioBufferList>) {
        let buffers = UnsafeMutableAudioBufferListPointer(bufferList)
        lock.lock()
        defer { lock.unlock() }
        let dt = 1 / sampleRate
        for i in 0..<frames {
            time += dt
            if let s = song {
                let eighthSamples = sampleRate * 60 / s.bpm / 2
                if sampleInEighth <= 0 {
                    sequencerTick(s)
                    eighthCounter += 1
                    sampleInEighth += eighthSamples
                }
                sampleInEighth -= 1
            }
            musicGain += (musicTarget - musicGain) * 0.00003

            // Wind: tiefpassgefiltertes Rauschen mit langsamer Welle
            windState += (nextNoise() - windState) * 0.015
            var sfx = windState * 0.035 * (0.5 + 0.5 * sin(time * 0.17))
            var music = 0.0

            var v = 0
            while v < voices.count {
                if voices[v].delay > 0 {
                    voices[v].delay -= 1
                    v += 1
                    continue
                }
                var voice = voices[v]
                voice.age += dt
                let a = min(1, voice.age / voice.attack)
                let env = voice.age < voice.hold ? a : a * exp(-(voice.age - voice.hold) / voice.decay)
                var inc = voice.freq * dt
                switch voice.timbre {
                case .ocarina: inc *= 1 + 0.006 * sin(2 * .pi * 5.2 * voice.age) * min(1, voice.age * 3)
                case .flute: inc *= 1 + 0.005 * sin(2 * .pi * 5 * voice.age) * min(1, max(0, voice.age - 0.2) * 3)
                case .koto: inc *= 1 + 0.012 * exp(-voice.age * 25)
                case .taiko: inc *= 1 + 1.2 * exp(-voice.age * 28)
                default: break
                }
                voice.phase += 2 * .pi * inc
                if voice.phase > 2000 * .pi { voice.phase -= 2000 * .pi }
                let ph = voice.phase
                let x: Double
                switch voice.timbre {
                case .noise: x = nextNoise() * 0.6 + sin(ph) * 0.6
                case .bell: x = sin(ph) + 0.3 * sin(ph * 2.01) + 0.12 * sin(ph * 3.98)
                case .piano:
                    let k = exp(-voice.age * 4)
                    x = sin(ph) + 0.35 * k * sin(2 * ph) + 0.12 * k * sin(3 * ph) + 0.05 * sin(4 * ph) * k
                case .ocarina: x = sin(ph) + 0.08 * sin(2 * ph) + nextNoise() * 0.015
                case .musicBox:
                    x = sin(ph) + 0.45 * exp(-voice.age * 7) * sin(4 * ph) + 0.18 * exp(-voice.age * 12) * sin(6.8 * ph)
                case .bass: x = sin(ph) + 0.25 * sin(2 * ph)
                case .pad: x = sin(ph) * 0.7 + 0.3 * sin(ph * 1.003 + sin(voice.age * 0.7))
                case .sine: x = sin(ph)
                case .koto:
                    x = sin(ph) + 0.5 * exp(-voice.age * 6) * sin(2 * ph) + 0.28 * exp(-voice.age * 10) * sin(3 * ph)
                        + 0.12 * exp(-voice.age * 16) * sin(5 * ph)
                case .flute: x = sin(ph) + 0.12 * sin(2 * ph) + nextNoise() * 0.04
                case .taiko: x = sin(ph) * 1.2 + nextNoise() * 0.9 * exp(-voice.age * 40)
                }
                if voice.music { music += x * env * voice.amp } else { sfx += x * env * voice.amp }
                voices[v] = voice
                v += 1
            }
            let mixed = sfx + music * musicGain
            let out = Float(tanh(mixed * volume * 1.4))
            for b in buffers {
                b.mData?.assumingMemoryBound(to: Float.self)[i] = out
            }
        }
        voices.removeAll { v in
            guard v.delay <= 0 else { return false }
            return v.age > v.hold + v.decay * 7 + v.attack
        }
    }
}
