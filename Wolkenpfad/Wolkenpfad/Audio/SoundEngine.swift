import AVFoundation

/// Kleiner Synthesizer: warme Klangfläche, leiser Wind und glockenartige Töne in D-Pentatonik.
/// Alles wird zur Laufzeit erzeugt – das Projekt braucht keine Audiodateien.
final class SoundEngine {
    static let shared = SoundEngine()

    private struct Voice {
        var freq: Double
        var amp: Double
        var decay: Double
        var delay: Int
        var phase: Double = 0
        var age: Double = 0
        var bell: Bool
        var noise: Bool = false
    }

    private let engine = AVAudioEngine()
    private var source: AVAudioSourceNode?
    private let lock = NSLock()
    private var voices: [Voice] = []
    private var sampleRate: Double = 44_100
    private var time: Double = 0
    private var padPhases: [Double] = [0, 0, 0, 0]
    private var windState: Double = 0
    private var noiseSeed: UInt32 = 22_222
    private var started = false
    private var volume: Double = 1

    var enabled = true {
        didSet {
            lock.lock()
            volume = enabled ? 1 : 0
            lock.unlock()
        }
    }

    /// Akkordfolge der Klangfläche (Frequenzen in Hz).
    private let chords: [[Double]] = [
        [146.83, 220.0, 293.66, 369.99],   // D
        [123.47, 185.0, 246.94, 293.66],   // Hm
        [196.0, 246.94, 293.66, 392.0],    // G
        [164.81, 220.0, 277.18, 329.63],   // A
    ]

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

    // MARK: Öffentliche Klänge

    /// Ton der D-Pentatonik (0 = D4).
    static func note(_ degree: Int) -> Double {
        let scale = [0, 2, 4, 7, 9]
        let octave = Int((Double(degree) / 5).rounded(.down))
        let idx = ((degree % 5) + 5) % 5
        return 293.66 * pow(2, Double(octave * 12 + scale[idx]) / 12)
    }

    func chime(_ degrees: [Int], spacing: Double = 0.12, amp: Double = 0.12) {
        lock.lock()
        for (i, d) in degrees.enumerated() {
            voices.append(Voice(freq: SoundEngine.note(d), amp: amp, decay: 1.6, delay: Int(Double(i) * spacing * sampleRate), bell: true))
        }
        lock.unlock()
    }

    func step() {
        lock.lock()
        voices.append(Voice(freq: 120 + Double.random(in: 0...30), amp: 0.05, decay: 0.05, delay: 0, bell: false, noise: true))
        lock.unlock()
    }

    func click() {
        lock.lock()
        voices.append(Voice(freq: 1400, amp: 0.035, decay: 0.03, delay: 0, bell: false))
        voices.append(Voice(freq: 90, amp: 0.05, decay: 0.06, delay: 0, bell: false, noise: true))
        lock.unlock()
    }

    func settle() {
        lock.lock()
        voices.append(Voice(freq: 73.4, amp: 0.12, decay: 0.35, delay: 0, bell: false))
        voices.append(Voice(freq: 146.8, amp: 0.05, decay: 0.25, delay: 0, bell: true))
        lock.unlock()
    }

    func connect(illusion: Bool) {
        if illusion {
            chime([5, 7, 9, 12, 14], spacing: 0.11, amp: 0.11)
        } else {
            chime([7, 9], spacing: 0.1, amp: 0.09)
        }
    }

    func blocked() {
        chime([-3, -4], spacing: 0.12, amp: 0.06)
    }

    func hint() {
        chime([9, 12], spacing: 0.18, amp: 0.07)
    }

    func ending() {
        let melody = [0, 2, 4, 7, 4, 7, 9, 12, 9, 12, 14, 17, 19]
        chime(melody, spacing: 0.28, amp: 0.1)
        lock.lock()
        for (i, d) in [-5, 0, 4, 7].enumerated() {
            voices.append(Voice(freq: SoundEngine.note(d) / 2, amp: 0.05, decay: 6, delay: Int(Double(i) * 0.05 * sampleRate), bell: false))
        }
        lock.unlock()
    }

    // MARK: Audio-Thread

    private func nextNoise() -> Double {
        noiseSeed = noiseSeed &* 1_664_525 &+ 1_013_904_223
        return Double(noiseSeed >> 8) / Double(1 << 24) * 2 - 1
    }

    private func render(frames: Int, bufferList: UnsafeMutablePointer<AudioBufferList>) {
        let buffers = UnsafeMutableAudioBufferListPointer(bufferList)
        lock.lock()
        defer { lock.unlock() }
        let dt = 1 / sampleRate
        let chordLength = 9.0
        for i in 0..<frames {
            time += dt
            // Klangfläche mit sanftem Überblenden zwischen den Akkorden
            let pos = time / chordLength
            let idx = Int(pos) % chords.count
            let nextIdx = (idx + 1) % chords.count
            let blend = max(0, (pos - Double(Int(pos))) - 0.75) / 0.25
            var pad = 0.0
            for k in 0..<4 {
                let f = chords[idx][k] * (1 - blend) + chords[nextIdx][k] * blend
                padPhases[k] += 2 * .pi * f * dt
                if padPhases[k] > 2 * .pi { padPhases[k] -= 2 * .pi }
                let lfo = 0.6 + 0.4 * sin(time * (0.21 + Double(k) * 0.07) + Double(k))
                pad += sin(padPhases[k]) * lfo
            }
            var s = pad * 0.012
            // Wind: tiefpassgefiltertes Rauschen mit langsamer Welle
            windState += (nextNoise() - windState) * 0.015
            s += windState * 0.05 * (0.5 + 0.5 * sin(time * 0.17))

            var v = 0
            while v < voices.count {
                if voices[v].delay > 0 {
                    voices[v].delay -= 1
                    v += 1
                    continue
                }
                var voice = voices[v]
                voice.age += dt
                let env = min(1, voice.age / 0.006) * exp(-voice.age / voice.decay)
                voice.phase += 2 * .pi * voice.freq * dt
                var x: Double
                if voice.noise {
                    x = nextNoise() * 0.6 + sin(voice.phase) * 0.6
                } else if voice.bell {
                    x = sin(voice.phase) + 0.3 * sin(voice.phase * 2.01) + 0.12 * sin(voice.phase * 3.98)
                } else {
                    x = sin(voice.phase)
                }
                s += x * env * voice.amp
                voices[v] = voice
                v += 1
            }
            let out = Float(tanh(s * volume * 1.4))
            for b in buffers {
                b.mData?.assumingMemoryBound(to: Float.self)[i] = out
            }
        }
        voices.removeAll { $0.delay <= 0 && $0.age > $0.decay * 7 }
    }
}
