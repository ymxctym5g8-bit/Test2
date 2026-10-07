import AVFoundation

/// Synthesizer und Musik-Sequenzer. Alles wird zur Laufzeit erzeugt –
/// das Projekt braucht keine Audiodateien.
///
/// Jedes Kapitel hat ein eigenes Stück: Akkordfolge, Arpeggio-Figur, Bass,
/// Klangfläche und eine auskomponierte Melodie, die nur jeden zweiten
/// Durchgang erklingt, damit die Musik ruhig im Hintergrund bleibt.
final class SoundEngine {
    static let shared = SoundEngine()

    enum Timbre { case sine, bell, piano, ocarina, musicBox, bass, pad, noise }

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

    func start() {
        guard !started else { return }
        started = true
        do {
            try AVAudioSession.sharedInstance().setCategory(.ambient, options: [.mixWithOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Audio-Session: \(error)")
        }
        let output = engine.outputNode.inputFormat(forBus: 0)
        sampleRate = output.sampleRate > 0 ? output.sampleRate : 44_100
        guard let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 2) else { return }
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

    /// Startet das Stück zur Stimmung eines Kapitels ("day", "evening", "night").
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

    static func song(for theme: String) -> Song {
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
        let bar = (eighthCounter / 8) % 16
        let step = eighthCounter % 8
        let chord = s.chords[bar % s.chords.count]
        let tones = chord + chord.map { $0 + 12 }

        // Arpeggio
        let idx = s.arpeggio[step % s.arpeggio.count]
        let note = tones[min(idx, tones.count - 1)] + s.arpOctave
        let arpAmp = s.arpTimbre == .musicBox ? 0.045 : 0.05
        voices.append(Voice(freq: SoundEngine.freq(note), amp: arpAmp * (step == 0 ? 1.25 : 1), attack: 0.004, hold: 0,
                            decay: s.arpTimbre == .musicBox ? 0.9 : 1.1, timbre: s.arpTimbre, music: true))

        // Bass und Klangfläche
        if step == 0 || (s.bassEveryHalf && step == 4) {
            voices.append(Voice(freq: SoundEngine.freq(chord[0] - 12), amp: 0.07, attack: 0.01, hold: 0, decay: 1.6,
                                timbre: .bass, music: true))
        }
        if step == 0 {
            for n in chord.prefix(3) {
                voices.append(Voice(freq: SoundEngine.freq(n), amp: 0.012 * s.padLevel, attack: 1.2, hold: eighth * 7,
                                    decay: 1.4, timbre: .pad, music: true))
            }
        }

        // Melodie in der zweiten Hälfte des 16-Takte-Bogens
        if bar >= 8 {
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

    func chime(_ degrees: [Int], spacing: Double = 0.12, amp: Double = 0.12) {
        lock.lock()
        for (i, d) in degrees.enumerated() {
            voices.append(Voice(freq: SoundEngine.note(d), amp: amp, attack: 0.005, hold: 0, decay: 1.6, timbre: .bell,
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
        add(Voice(freq: 73.4, amp: 0.12, attack: 0.005, hold: 0, decay: 0.35, timbre: .sine))
        add(Voice(freq: 146.8, amp: 0.05, attack: 0.005, hold: 0, decay: 0.25, timbre: .bell))
    }

    func plate() {
        add(Voice(freq: 61.7, amp: 0.14, attack: 0.01, hold: 0, decay: 0.8, timbre: .sine))
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
                if voice.timbre == .ocarina { inc *= 1 + 0.006 * sin(2 * .pi * 5.2 * voice.age) * min(1, voice.age * 3) }
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
