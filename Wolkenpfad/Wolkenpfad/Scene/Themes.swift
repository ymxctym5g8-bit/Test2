import UIKit
import SceneKit

extension UIColor {
    /// Farbe aus 0xRRGGBB.
    convenience init(hex: UInt32, alpha: CGFloat = 1) {
        self.init(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
                  blue: CGFloat(hex & 0xFF) / 255, alpha: alpha)
    }
}

/// Ober- und Seitenfarbe eines Blockmaterials.
struct MaterialColors {
    let top: UIColor
    let side: UIColor
    init(_ top: UInt32, _ side: UInt32) {
        self.top = UIColor(hex: top)
        self.side = UIColor(hex: side)
    }
}

/// Stimmung eines Kapitels im Ghibli-Stil: Himmel, Licht, Wolken, Kulisse, Teilchen, Materialien und Musik.
struct Theme {
    enum Particle { case petals, leaves, motes, seeds, spores, dust, rain, letters, butterflies, goldmotes, dragonflies }

    let name: String
    let sky: [UIColor]
    let sun: UIColor
    let sunIntensity: CGFloat
    let ambient: UIColor
    let ambientIntensity: CGFloat
    let cloudLight: UIColor
    let cloudShadow: UIColor
    let cloudWarmShadow: UIColor
    let particle: Particle
    let particleRate: CGFloat
    /// Sterne und Mond statt Sonne.
    let stars: Bool
    /// Helle Schrift für dunkle Kapitel.
    let night: Bool
    let fireflies: Float
    let lanternBoost: CGFloat
    /// Gemalte ferne Kulisse (siehe Art.backdrop).
    let backdrop: String
    /// Luftperspektive: ferne Blöcke verblassen in dieser Farbe.
    let haze: UIColor?
    let lightning: Bool
    /// Musikstück (SoundEngine.song(for:)).
    let song: String
    /// Baumart des großen Baums im Finale.
    let treeVariant: Int
    /// Stärke der Pinseltupfer auf den Blöcken.
    let brush: CGFloat
    let palette: [String: MaterialColors]

    func colors(_ material: String) -> MaterialColors {
        palette[material] ?? Theme.basePalette[material] ?? Theme.basePalette["stone"]!
    }

    // MARK: Grundpalette – verwitterter Stein, Moos, warmes Holz, Grünspan

    static let basePalette: [String: MaterialColors] = [
        "grass": MaterialColors(0x74B04E, 0xB89C76), "moss": MaterialColors(0x6E9E58, 0xA99F88),
        "stone": MaterialColors(0xE3D7BC, 0xCDBFA2), "stonedark": MaterialColors(0xA69A88, 0x9D9180),
        "rock": MaterialColors(0x9A8C7C, 0x928474), "rockdark": MaterialColors(0x6F6862, 0x655E59),
        "wood": MaterialColors(0xAD7D54, 0x936644), "teal": MaterialColors(0x6FA89A, 0x6FA89A),
        "tealdark": MaterialColors(0x4E8478, 0x4E8478), "tealtop": MaterialColors(0xA9D3BE, 0x6FA89A),
        "water": MaterialColors(0x6FB1D6, 0xB89C76), "raft": MaterialColors(0xA67650, 0x8C6242),
        "gate": MaterialColors(0xC7553F, 0xB84A36), "light": MaterialColors(0xFFE9A8, 0xFFD98A),
        "glass": MaterialColors(0xCFEAF2, 0xA9D3E4), "ghost": MaterialColors(0xBFD6FF, 0x9FB8F2),
        "cloud": MaterialColors(0xF8F8FC, 0xDDE2EE), "petal": MaterialColors(0x8FA8F0, 0x6F86D8),
        "brass": MaterialColors(0xD9A85A, 0xB88A44),
    ]

    private static func make(_ name: String, sky: [UInt32], sun: UInt32, sunI: CGFloat = 1100, ambient: UInt32, ambI: CGFloat = 520,
                             clouds: (UInt32, UInt32, UInt32) = (0xFFFCF0, 0xA9BCD8, 0xEEC4AA),
                             particle: Particle, rate: CGFloat = 2.2, stars: Bool = false, night: Bool = false,
                             fireflies: Float = 3, lantern: CGFloat = 1, backdrop: String, haze: UInt32? = nil,
                             lightning: Bool = false, song: String, tree: Int = 0, brush: CGFloat = 1,
                             palette: [String: MaterialColors] = [:]) -> Theme {
        Theme(name: name, sky: sky.map { UIColor(hex: $0) }, sun: UIColor(hex: sun), sunIntensity: sunI,
              ambient: UIColor(hex: ambient), ambientIntensity: ambI,
              cloudLight: UIColor(hex: clouds.0), cloudShadow: UIColor(hex: clouds.1), cloudWarmShadow: UIColor(hex: clouds.2),
              particle: particle, particleRate: rate, stars: stars, night: night, fireflies: fireflies, lanternBoost: lantern,
              backdrop: backdrop, haze: haze.map { UIColor(hex: $0) }, lightning: lightning, song: song, treeVariant: tree,
              brush: brush, palette: palette)
    }

    // MARK: Die Kapitel

    static func named(_ n: String?) -> Theme {
        switch n {
        // ---------------- Prolog
        case "river":       // Das Lied des Flusses – warmer Abend
            return make("river", sky: [0x5E6FB8, 0xC9A3C8, 0xFFD3A8, 0xF7A77E, 0xD8857E], sun: 0xFFC890, sunI: 1000,
                        ambient: 0x9C8FB8, ambI: 480, clouds: (0xFFE8D6, 0xB28FBF, 0xF2A08C), particle: .leaves,
                        backdrop: "hills", haze: 0xE8B6A4, song: "evening", tree: 3, brush: 1.2,
                        palette: ["grass": MaterialColors(0x86A84E, 0xC09A78), "stone": MaterialColors(0xEED5BC, 0xD9B79E)])
        case "lanterns":    // Der Turm der Laternen – Mondnacht
            return make("lanterns", sky: [0x0E1636, 0x1F2F5E, 0x3B4F86, 0x5E6A9E, 0x7A6E98], sun: 0x9EB2FF, sunI: 650,
                        ambient: 0x5C6098, ambI: 430, clouds: (0x9EA8D6, 0x4D4D85, 0x6A528C), particle: .motes, rate: 4,
                        stars: true, night: true, fireflies: 9, lantern: 2.2, backdrop: "islands", haze: 0x2C3466,
                        song: "night", tree: 4, brush: 1.1,
                        palette: ["grass": MaterialColors(0x4E8A62, 0x7E7690), "stone": MaterialColors(0xB9B6CC, 0x9C98B4),
                                  "stonedark": MaterialColors(0x6E6A8E, 0x625E80), "rock": MaterialColors(0x5E5A7E, 0x585474)])
        // ---------------- Akt I: Der Ruf des Himmels
        case "attic":       // Das Summen im Dachboden – goldener Staub im späten Licht
            return make("attic", sky: [0x6E5A78, 0xB98A86, 0xF2C59A, 0xF6D9B0, 0xE8C9A6], sun: 0xFFD9A0, sunI: 1050,
                        ambient: 0xA08A88, ambI: 470, clouds: (0xFFEBD2, 0xC3A0A6, 0xF0B890), particle: .dust, rate: 5,
                        lantern: 1.5, backdrop: "village", haze: 0xEBC4A0, song: "attic", tree: 3, brush: 1.3,
                        palette: ["wood": MaterialColors(0x9C6A44, 0x7E5236), "stone": MaterialColors(0xEFE2C8, 0xD8C6A6),
                                  "stonedark": MaterialColors(0x8E765E, 0x7C664F), "grass": MaterialColors(0x7FA05A, 0xA88A64),
                                  "teal": MaterialColors(0xB58A4E, 0xB58A4E), "tealdark": MaterialColors(0x8A6438, 0x8A6438),
                                  "tealtop": MaterialColors(0xE2C287, 0xB58A4E)])
        case "mist":        // Der erste Schritt in den Nebel – Morgendunst und leuchtende Sporen
            return make("mist", sky: [0x8FAFC4, 0xC2D6DC, 0xE6ECE6, 0xEFE4D8, 0xD9D2CE], sun: 0xFFF2DE, sunI: 900,
                        ambient: 0xB4C2CC, ambI: 600, clouds: (0xFFFFFF, 0xC4D2DC, 0xE6D6CF), particle: .spores, rate: 3,
                        fireflies: 2, backdrop: "mistislands", haze: 0xDDE6E6, song: "mist", tree: 1, brush: 0.9,
                        palette: ["grass": MaterialColors(0x8DB27A, 0xBFB5A0), "stone": MaterialColors(0xE6E2D6, 0xCFCABC),
                                  "cloud": MaterialColors(0xFBFBFE, 0xE2E8F0)])
        case "grassvale":   // Das Tal der flüsternden Gräser – heller, windiger Mittag
            return make("grassvale", sky: [0x3F8FE0, 0x7FC2EE, 0xE9F4E4, 0xF3EDC8, 0xE1E6B8], sun: 0xFFF4D6, sunI: 1200,
                        ambient: 0xAAC2CF, ambI: 520, particle: .seeds, rate: 3, backdrop: "rollinghills", haze: 0xDDEBD2,
                        song: "grassvale", tree: 0, brush: 1.2,
                        palette: ["grass": MaterialColors(0x9CC45A, 0xC2A574), "moss": MaterialColors(0x86B256, 0xB0A486),
                                  "stone": MaterialColors(0xEDE3C4, 0xD6C8A4)])
        case "mill":        // Die Mühle der vergessenen Briefe – Herbstocker
            return make("mill", sky: [0x5D86C2, 0xA7C3DA, 0xF2DEB6, 0xEDBF86, 0xD99A6E], sun: 0xFFD9A8, sunI: 1050,
                        ambient: 0xA89A9E, ambI: 500, clouds: (0xFFF4E2, 0xB4AEC8, 0xF0B88E), particle: .letters, rate: 1.4,
                        backdrop: "windmills", haze: 0xE8C8A2, song: "mill", tree: 3, brush: 1.3,
                        palette: ["grass": MaterialColors(0xC4A456, 0xB28A64), "moss": MaterialColors(0x8E9E58, 0xA0927A),
                                  "stone": MaterialColors(0xE8D6B4, 0xD0BA94), "wood": MaterialColors(0x9A6A42, 0x7E5434)])
        case "storm":       // Der Sturm zieht auf – melancholischer Himmelssturm
            return make("storm", sky: [0x2E3448, 0x4A5068, 0x6E7086, 0x8E8794, 0xA39A9E], sun: 0xB8C4D8, sunI: 720,
                        ambient: 0x6C7690, ambI: 520, clouds: (0xB8BCC8, 0x585E74, 0x7A6E7E), particle: .rain, rate: 60,
                        night: true, fireflies: 1, lantern: 1.6, backdrop: "stormclouds", haze: 0x5E6478, lightning: true,
                        song: "storm", tree: 0, brush: 1.1,
                        palette: ["grass": MaterialColors(0x4F7E54, 0x7C7064), "moss": MaterialColors(0x4C7450, 0x77705F),
                                  "stone": MaterialColors(0xA8A69E, 0x8E8C86), "wood": MaterialColors(0x6E5440, 0x5C4434),
                                  "stonedark": MaterialColors(0x6E6C70, 0x626066)])
        // ---------------- Akt II: Die Suche nach dem Licht
        case "glasslake":   // Der See aus Glas – barfuß auf dem Himmel
            return make("glasslake", sky: [0x7FC8D8, 0xB6E2E4, 0xF6EEF0, 0xF7D5DE, 0xE9C3D6], sun: 0xFFF6EE, sunI: 1150,
                        ambient: 0xB8CCE0, ambI: 600, clouds: (0xFFFFFF, 0xB8D2E2, 0xF0C8D4), particle: .motes, rate: 2.5,
                        backdrop: "underlands", haze: 0xEAF0F2, song: "glasslake", tree: 2, brush: 0.8,
                        palette: ["stone": MaterialColors(0xF4E6E8, 0xE2CCD2), "stonedark": MaterialColors(0xC8B0C2, 0xB89EB4),
                                  "glass": MaterialColors(0xD4F0F4, 0xAFDCE6), "grass": MaterialColors(0x8CC8A0, 0xD6BCB8)])
        case "bellflower":  // Die Stadt der Glockenblumen – violetter Abend
            return make("bellflower", sky: [0x2B2F6A, 0x5A5AA0, 0xA88FC8, 0xE9B8C8, 0xF2CFC0], sun: 0xD8C8FF, sunI: 850,
                        ambient: 0x7A78B4, ambI: 520, clouds: (0xE4D8F4, 0x7A6EA8, 0xD69CB8), particle: .motes, rate: 4,
                        night: true, fireflies: 6, lantern: 1.8, backdrop: "bellhills", haze: 0x6A64A4, song: "bellflower",
                        tree: 4, brush: 1.0,
                        palette: ["grass": MaterialColors(0x5E9A86, 0x8C80A4), "stone": MaterialColors(0xD8D0E6, 0xBCB0D2),
                                  "petal": MaterialColors(0x8EA8FF, 0x6C84E0), "wood": MaterialColors(0x8C6A6E, 0x74565C)])
        case "giant":       // Der schlafende Riese – moosige Hochebene
            return make("giant", sky: [0x4C8FCF, 0x96C6E2, 0xE4EFD8, 0xE9E2BC, 0xCFD9AE], sun: 0xFFF0D2, sunI: 1100,
                        ambient: 0xA4BCC4, ambI: 540, particle: .seeds, rate: 2, backdrop: "titans", haze: 0xD6E4CE,
                        song: "giant", tree: 7, brush: 1.4,
                        palette: ["grass": MaterialColors(0x6FA84C, 0x8C8466), "moss": MaterialColors(0x5E9A4E, 0x8A8A70),
                                  "stone": MaterialColors(0xC9C6AE, 0xB0AC94), "rock": MaterialColors(0x7E826E, 0x747864)])
        case "sunbeam":     // Der Irrgarten aus Sonnenstrahlen – Sonnenuntergang
            return make("sunbeam", sky: [0x4B4A8E, 0xC46F8E, 0xF59A7A, 0xFBC77E, 0xFBE3A8], sun: 0xFFC48A, sunI: 1150,
                        ambient: 0xB088A0, ambI: 470, clouds: (0xFFE2C4, 0xC0789A, 0xF89A74), particle: .goldmotes, rate: 3,
                        backdrop: "sunset", haze: 0xF4B08C, song: "sunbeam", tree: 3, brush: 1.1,
                        palette: ["stone": MaterialColors(0xF2D6BC, 0xDDB49C), "stonedark": MaterialColors(0xB4848C, 0xA07480),
                                  "grass": MaterialColors(0xA4A256, 0xC69878), "light": MaterialColors(0xFFF0B4, 0xFFD48A)])
        case "bridgeworks": // Die alte Brückenbauerin – Werkstatt in der Dämmerung
            return make("bridgeworks", sky: [0x5B78A8, 0xA4B6CC, 0xEBD3B2, 0xE8B27E, 0xC98A6A], sun: 0xFFD4A0, sunI: 1050,
                        ambient: 0xA2989E, ambI: 500, clouds: (0xFFF0DC, 0xA8AAC4, 0xEEAE86), particle: .dust, rate: 3,
                        lantern: 1.6, backdrop: "bridges", haze: 0xDEBC9E, song: "bridgeworks", tree: 3, brush: 1.2,
                        palette: ["wood": MaterialColors(0xA0704A, 0x845A3A), "teal": MaterialColors(0xC9964E, 0xC9964E),
                                  "tealdark": MaterialColors(0x9C703A, 0x9C703A), "tealtop": MaterialColors(0xEAC88A, 0xC9964E)])
        // ---------------- Akt III: Das Herz des Himmels
        case "skygarden":   // Der Aufstieg zum Himmelsgarten – dünne Luft, kräftige Farben
            return make("skygarden", sky: [0x1F4FB0, 0x3D7FE0, 0x8CC8F0, 0xF0E0F0, 0xF8D0E8], sun: 0xFFFFFF, sunI: 1250,
                        ambient: 0x9CB4E6, ambI: 560, clouds: (0xFFFFFF, 0x8EA8E0, 0xF4B8D6), particle: .butterflies, rate: 1.2,
                        fireflies: 4, backdrop: "gardenpeaks", haze: 0xC8DCF4, song: "skygarden", tree: 2, brush: 1.0,
                        palette: ["grass": MaterialColors(0x58C266, 0xC8A27C), "moss": MaterialColors(0x4CB060, 0xA89C86),
                                  "stone": MaterialColors(0xFBEFE0, 0xE8D2BE), "petal": MaterialColors(0xFF9ACB, 0xE877AE)])
        case "ruins":       // Die Ruinen des ersten Sturms – bleicher Stein und Grünspan
            return make("ruins", sky: [0x7E93A8, 0xB4C2C8, 0xE6E2D6, 0xDCCFB8, 0xC4B8A4], sun: 0xFFF0DA, sunI: 1000,
                        ambient: 0xA8B0B4, ambI: 560, clouds: (0xFAF6EC, 0xA8B2BC, 0xDCC0A8), particle: .dust, rate: 2.5,
                        backdrop: "ruinspires", haze: 0xD8D4C8, song: "ruins", tree: 7, brush: 1.3,
                        palette: ["stone": MaterialColors(0xE4DDCC, 0xCCC2AC), "stonedark": MaterialColors(0xA8A090, 0x968E80),
                                  "teal": MaterialColors(0x6FA898, 0x6FA898), "tealtop": MaterialColors(0xA6D2C2, 0x6FA898),
                                  "grass": MaterialColors(0x8AA866, 0xB4A68A)])
        case "echo":        // Das Echo der Vergangenheit – leuchtende Erinnerungen in der Nacht
            return make("echo", sky: [0x121A3E, 0x24356E, 0x3F5C96, 0x6E7FB0, 0x9C94C0], sun: 0xB4C8FF, sunI: 700,
                        ambient: 0x606EA4, ambI: 470, clouds: (0xA8B4E4, 0x48508C, 0x7A6CA4), particle: .motes, rate: 5,
                        stars: true, night: true, fireflies: 5, lantern: 2, backdrop: "aurora", haze: 0x28346A,
                        song: "echo", tree: 4, brush: 1.0,
                        palette: ["grass": MaterialColors(0x4E8C78, 0x787096), "stone": MaterialColors(0xB8BEDA, 0x9CA2C4),
                                  "stonedark": MaterialColors(0x6A6E96, 0x5E628A), "ghost": MaterialColors(0xC4DCFF, 0x9EBCF4)])
        case "heart":       // Das Herz der Wolken – Perlmutt in Rosa, Türkis, Lavendel und Ocker
            return make("heart", sky: [0x9FD6D8, 0xCDE6EE, 0xF4E8F2, 0xF2D2E2, 0xE4C8E6], sun: 0xFFF4EC, sunI: 1150,
                        ambient: 0xC4BCE0, ambI: 600, clouds: (0xFFFFFF, 0xC8C0E4, 0xF4C8D8), particle: .petals, rate: 2.5,
                        fireflies: 4, backdrop: "harpclouds", haze: 0xF0E2EE, song: "heart", tree: 2, brush: 0.8,
                        palette: ["stone": MaterialColors(0xF6DEE2, 0xE6C2CC), "stonedark": MaterialColors(0xC8A8C8, 0xB494B8),
                                  "teal": MaterialColors(0x7ECCC6, 0x7ECCC6), "tealdark": MaterialColors(0x5CAAA8, 0x5CAAA8),
                                  "tealtop": MaterialColors(0xB4E8E2, 0x7ECCC6), "rock": MaterialColors(0xB8A0C4, 0xA890B8),
                                  "brass": MaterialColors(0xE8C27A, 0xD0A65E), "grass": MaterialColors(0x9CCC9A, 0xE0BCC4)])
        case "horizon":     // Ein neuer Horizont – goldenes Licht
            return make("horizon", sky: [0x5E9BD8, 0xA9D1EC, 0xFBEFC8, 0xFBD58E, 0xF6B87A], sun: 0xFFDCA0, sunI: 1250,
                        ambient: 0xB4AEB8, ambI: 520, clouds: (0xFFF6E0, 0xB0B8D8, 0xF8C08E), particle: .goldmotes, rate: 3.5,
                        fireflies: 6, backdrop: "goldenvalley", haze: 0xF6D6A8, song: "horizon", tree: 2, brush: 1.2,
                        palette: ["grass": MaterialColors(0x8CBE52, 0xC8A274), "stone": MaterialColors(0xF6E4C0, 0xE2C89E),
                                  "light": MaterialColors(0xFFE6A0, 0xFFC870)])
        // ---------------- Prolog, Kapitel I (Standard)
        default:            // Der Samen des Waldes – später Nachmittag, riesige Kumuluswolken
            return make("meadow", sky: [0x4F8FD6, 0x8CC0E8, 0xF5EBCF, 0xF8D3A6, 0xE6B39A], sun: 0xFFE9C4, sunI: 1150,
                        ambient: 0xA8B4D0, ambI: 520, particle: .seeds, rate: 2.5, backdrop: "cumulus", haze: 0xEBD9C4,
                        song: "day", tree: 2, brush: 1.3)
        }
    }
}

// MARK: - Materialien und Kulissen

extension Art {
    private static var materialCache: [String: [SCNMaterial]] = [:]

    private static func seed(_ s: String) -> UInt64 { s.utf8.reduce(1469598103934665603) { ($0 ^ UInt64($1)) &* 1099511628211 } }

    /// Materialien für einen Würfel in SceneKits Reihenfolge: vorne, rechts, hinten, links, oben, unten.
    static func blockMaterials(_ name: String, theme: Theme) -> [SCNMaterial] {
        let key = name + "|" + theme.name
        if let m = materialCache[key] { return m }
        let c = theme.colors(name), sd = seed(key), b = theme.brush
        let dabs = Int(80 * b), strength = 0.1 * b
        var top = mat(painted(c.top, seed: sd, dabs: dabs, strength: strength))
        var side = mat(painted(c.side, seed: sd &+ 1, dabs: dabs, strength: strength))
        switch name {
        case "grass", "moss":
            top = mat(painted(c.top, seed: sd, dabs: Int(110 * b), strength: 0.15 * b))
        case "wood", "raft":
            top = mat(painted(c.top, seed: sd, dabs: dabs, strength: strength, stripes: true))
            side = mat(painted(c.side, seed: sd &+ 1, dabs: dabs, strength: strength, stripes: true))
        case "teal", "brass":
            top = mat(painted(c.top, seed: sd, dabs: 40, strength: strength, dots: true))
            side = mat(painted(c.side, seed: sd &+ 1, dabs: 40, strength: strength, dots: true))
        case "tealtop":
            top = mat(painted(c.top, seed: sd, dabs: 30, strength: strength, emblem: true))
            side = mat(painted(c.side, seed: sd &+ 1, dabs: 40, strength: strength, dots: true))
        case "tealdark":
            side = mat(painted(c.side, seed: sd &+ 1, dabs: 40, strength: strength, dots: true))
        case "gate":
            top = mat(painted(c.top, seed: sd, dabs: 30, emblem: true))
            side = mat(painted(c.side, seed: sd &+ 1, dabs: 30, emblem: true))
            side.emission.contents = UIColor(red: 0.18, green: 0.04, blue: 0.02, alpha: 1)
        case "water":
            top = mat(painted(c.top, seed: sd, dabs: 30, strength: 0.18))
            top.emission.contents = UIColor(red: 0.1, green: 0.18, blue: 0.24, alpha: 1)
        case "light":       // Lichtbrücke: leuchtend, halb durchsichtig
            top = mat(painted(c.top, seed: sd, dabs: 30, strength: 0.12), lighting: .constant)
            side = mat(painted(c.side, seed: sd &+ 1, dabs: 30, strength: 0.12), lighting: .constant)
            top.transparency = 0.9; side.transparency = 0.7
        case "glass":       // Glassee: spiegelnd, durchscheinend
            top = mat(painted(c.top, seed: sd, dabs: 16, strength: 0.08), lighting: .phong)
            side = mat(painted(c.side, seed: sd &+ 1, dabs: 16, strength: 0.08), lighting: .phong)
            for m in [top, side] {
                m.specular.contents = UIColor.white
                m.shininess = 60
                m.transparency = 0.78
                m.fresnelExponent = 1.6
            }
        case "ghost":       // Erinnerungsblöcke: geisterhaft leuchtend
            top = mat(painted(c.top, seed: sd, dabs: 24, strength: 0.15), lighting: .constant)
            side = mat(painted(c.side, seed: sd &+ 1, dabs: 24, strength: 0.15), lighting: .constant)
            top.transparency = 0.72; side.transparency = 0.5
        case "cloud":
            top = mat(painted(c.top, seed: sd, dabs: 60, strength: 0.06))
            side = mat(painted(c.side, seed: sd &+ 1, dabs: 60, strength: 0.08))
            top.emission.contents = UIColor(white: 0.12, alpha: 1)
        case "petal":
            top.emission.contents = c.top.withAlphaComponent(1).multiplied(0.25)
            side.emission.contents = c.side.multiplied(0.2)
        default: break
        }
        let bottom = mat(theme.colors("rockdark").side)
        let result = [side, side, side, side, top, bottom]
        materialCache[key] = result
        return result
    }

    /// Ferne, gemalte Kulisse eines Kapitels (transparent, unten weich auslaufend).
    static func backdrop(_ name: String, theme: Theme) -> UIImage {
        let size = CGSize(width: 1024, height: 512)
        var rng = Rand(seed(name))
        let haze = theme.haze ?? theme.sky[3]
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let c = ctx.cgContext
            func col(_ base: UIColor, _ t: CGFloat) -> UIColor { base.mixed(with: haze, t) }
            func hill(_ base: CGFloat, _ amp: CGFloat, _ color: UIColor, _ phase: CGFloat, _ freq: CGFloat) {
                let path = CGMutablePath()
                path.move(to: CGPoint(x: 0, y: 512))
                for i in 0...64 {
                    let x = CGFloat(i) * 16
                    path.addLine(to: CGPoint(x: x, y: base - amp * (0.6 * sin(x / 1024 * .pi * freq + phase) + 0.4 * sin(x / 1024 * .pi * freq * 2.3 + phase * 1.7))))
                }
                path.addLine(to: CGPoint(x: 1024, y: 512)); path.closeSubpath()
                color.setFill(); c.addPath(path); c.fillPath()
            }
            func puff(_ x: CGFloat, _ y: CGFloat, _ r: CGFloat, _ light: UIColor, _ shadow: UIColor) {
                shadow.setFill(); c.fillEllipse(in: CGRect(x: x - r + r * 0.12, y: y - r + r * 0.18, width: r * 2, height: r * 2))
                light.setFill(); c.fillEllipse(in: CGRect(x: x - r * 1.02, y: y - r * 1.04, width: r * 1.9, height: r * 1.9))
            }
            func cumulus(_ cx: CGFloat, _ base: CGFloat, _ w: CGFloat, _ rows: Int, _ light: UIColor, _ shadow: UIColor) {
                for row in 0..<rows {
                    let y = base - CGFloat(row) * w * 0.16, half = w * (0.5 - CGFloat(row) * 0.4 / CGFloat(rows))
                    for _ in 0..<6 { puff(cx + CGFloat(rng.range(-1, 1)) * half, y, w * CGFloat(rng.range(0.12, 0.2)) * (1 - CGFloat(row) * 0.05), light, shadow) }
                }
            }
            func island(_ cx: CGFloat, _ cy: CGFloat, _ w: CGFloat, _ top: UIColor, _ rock: UIColor, falls: Bool = false) {
                rock.setFill()
                c.move(to: CGPoint(x: cx - w, y: cy)); c.addLine(to: CGPoint(x: cx + w, y: cy)); c.addLine(to: CGPoint(x: cx + w * 0.2, y: cy + w * 1.2)); c.closePath(); c.fillPath()
                top.setFill()
                for k in 0..<5 { let bx = cx - w * 0.8 + CGFloat(k) * w * 0.4; c.fillEllipse(in: CGRect(x: bx - w * 0.26, y: cy - w * 0.32, width: w * 0.52, height: w * 0.4)) }
                if falls { UIColor.white.withAlphaComponent(0.6).setFill(); c.fill(CGRect(x: cx + w * 0.45, y: cy + w * 0.1, width: w * 0.05, height: w * 1.6)) }
            }
            func windmill(_ x: CGFloat, _ y: CGFloat, _ s: CGFloat, _ color: UIColor) {
                color.setFill()
                c.move(to: CGPoint(x: x - 8 * s, y: y)); c.addLine(to: CGPoint(x: x + 8 * s, y: y)); c.addLine(to: CGPoint(x: x + 5 * s, y: y - 36 * s)); c.addLine(to: CGPoint(x: x - 5 * s, y: y - 36 * s)); c.closePath(); c.fillPath()
                for k in 0..<4 {
                    let a = CGFloat(k) * .pi / 2 + 0.4
                    c.saveGState(); c.translateBy(x: x, y: y - 36 * s); c.rotate(by: a)
                    c.fill(CGRect(x: 0, y: -3 * s, width: 30 * s, height: 6 * s)); c.restoreGState()
                }
            }
            let light = theme.cloudLight, shadow = theme.cloudShadow
            switch name {
            case "hills":
                hill(300, 50, col(UIColor(hex: 0x8C7AA8), 0.4), 0.5, 2.2)
                hill(350, 40, col(UIColor(hex: 0x7C8E5A), 0.3), 1.6, 3)
                UIColor(hex: 0xFFD8A8, alpha: 0.7).setFill(); c.fill(CGRect(x: 0, y: 392, width: 1024, height: 6))
                hill(420, 30, col(UIColor(hex: 0x6C7E4A), 0.2), 2.4, 4)
            case "islands":
                for _ in 0..<5 { island(CGFloat(rng.range(80, 940)), CGFloat(rng.range(200, 360)), CGFloat(rng.range(30, 70)), col(UIColor(hex: 0x3A5068), 0.3), col(UIColor(hex: 0x2A3050), 0.3)) }
                for _ in 0..<14 { UIColor(hex: 0xFFD98A, alpha: 0.9).setFill(); c.fill(CGRect(x: CGFloat(rng.range(80, 940)), y: CGFloat(rng.range(190, 350)), width: 3, height: 3)) }
            case "village":
                cumulus(780, 260, 340, 5, light, shadow)
                island(360, 360, 220, col(UIColor(hex: 0x7FA05A), 0.3), col(UIColor(hex: 0x8E765E), 0.3))
                for k in 0..<7 {
                    let x = 200 + CGFloat(k) * 46 + CGFloat(rng.range(-8, 8)), y: CGFloat = 330
                    col(UIColor(hex: 0xF2E4CC), 0.3).setFill(); c.fill(CGRect(x: x, y: y, width: 30, height: 20))
                    col(UIColor(hex: 0xA0524A), 0.35).setFill()
                    c.move(to: CGPoint(x: x - 6, y: y)); c.addLine(to: CGPoint(x: x + 15, y: y - 16)); c.addLine(to: CGPoint(x: x + 36, y: y)); c.closePath(); c.fillPath()
                }
                windmill(560, 340, 1.3, col(UIColor(hex: 0x8E765E), 0.3))
            case "mistislands":
                for k in 0..<6 { island(CGFloat(80 + k * 170) + CGFloat(rng.range(-30, 30)), CGFloat(rng.range(240, 380)), CGFloat(rng.range(40, 90)), col(UIColor(hex: 0x9CB49A), 0.7), col(UIColor(hex: 0x9C9AA6), 0.7)) }
            case "rollinghills":
                cumulus(300, 250, 300, 4, light, shadow)
                hill(330, 46, col(UIColor(hex: 0x9CC46A), 0.35), 0.3, 2)
                hill(380, 36, col(UIColor(hex: 0x86B256), 0.2), 1.9, 3.2)
                for _ in 0..<30 { col(UIColor(hex: 0x5E8E40), 0.2).setFill(); let x = CGFloat(rng.range(0, 1024)); c.fillEllipse(in: CGRect(x: x, y: CGFloat(rng.range(360, 420)), width: 18, height: 12)) }
            case "windmills":
                for k in 0..<4 {
                    let x = CGFloat(140 + k * 250) + CGFloat(rng.range(-30, 30)), y = CGFloat(rng.range(260, 360))
                    island(x, y, 70, col(UIColor(hex: 0xC4A456), 0.4), col(UIColor(hex: 0x9C8268), 0.4))
                    windmill(x, y - 12, 1.1, col(UIColor(hex: 0x7E5434), 0.4))
                }
            case "stormclouds":
                for k in 0..<5 { cumulus(CGFloat(100 + k * 210), CGFloat(rng.range(260, 330)), 320, 4, col(UIColor(hex: 0x8C90A2), 0.2), col(UIColor(hex: 0x4A4E62), 0.2)) }
                UIColor(white: 0.85, alpha: 0.18).setStroke(); c.setLineWidth(2)
                for _ in 0..<60 { let x = CGFloat(rng.range(0, 1024)), y = CGFloat(rng.range(200, 480)); c.move(to: CGPoint(x: x, y: y)); c.addLine(to: CGPoint(x: x - 8, y: y + 40)); c.strokePath() }
            case "underlands":
                // ferne Landschaft tief unten, durch den Dunst gesehen
                let fields = [0xA8C88C, 0xC8D6A0, 0xE0D0A8, 0x98BC92, 0xD4C0A0] as [UInt32]
                for k in 0..<40 {
                    col(UIColor(hex: fields[k % 5]), 0.55).setFill()
                    c.fill(CGRect(x: CGFloat(rng.range(0, 980)), y: CGFloat(rng.range(330, 470)), width: CGFloat(rng.range(40, 120)), height: CGFloat(rng.range(10, 26))))
                }
                col(UIColor(hex: 0x8CC8E0), 0.5).setStroke(); c.setLineWidth(6)
                c.move(to: CGPoint(x: 0, y: 420)); c.addCurve(to: CGPoint(x: 1024, y: 380), control1: CGPoint(x: 300, y: 340), control2: CGPoint(x: 700, y: 480)); c.strokePath()
            case "bellhills":
                hill(330, 40, col(UIColor(hex: 0x3E4A86), 0.3), 0.8, 2.4)
                for _ in 0..<9 {
                    let x = CGFloat(rng.range(40, 980)), y = CGFloat(rng.range(270, 340)), h = CGFloat(rng.range(50, 110))
                    col(UIColor(hex: 0x2E3A6A), 0.3).setStroke(); c.setLineWidth(3)
                    c.move(to: CGPoint(x: x, y: y + h)); c.addQuadCurve(to: CGPoint(x: x + 20, y: y), control: CGPoint(x: x - 20, y: y + h * 0.4)); c.strokePath()
                    UIColor(hex: 0x9CB8FF, alpha: 0.85).setFill(); c.fillEllipse(in: CGRect(x: x + 6, y: y - 4, width: 30, height: 26))
                    UIColor(hex: 0xFFF0B0, alpha: 0.9).setFill(); c.fillEllipse(in: CGRect(x: x + 17, y: y + 14, width: 7, height: 7))
                }
            case "titans":
                for k in 0..<3 {
                    let x = CGFloat(150 + k * 350), y = CGFloat(rng.range(300, 340))
                    col(UIColor(hex: 0x6E9A62), 0.45 + CGFloat(k) * 0.1).setFill()
                    c.fillEllipse(in: CGRect(x: x - 160, y: y - 70, width: 320, height: 180))      // Körper
                    c.fillEllipse(in: CGRect(x: x + 90, y: y - 110, width: 110, height: 100))     // Kopf
                    col(UIColor(hex: 0x4E7848), 0.5).setStroke(); c.setLineWidth(3)
                    c.addArc(center: CGPoint(x: x + 140, y: y - 64), radius: 10, startAngle: 0.2, endAngle: .pi - 0.2, clockwise: false); c.strokePath()
                }
            case "sunset":
                let sun = CGPoint(x: 512, y: 380)
                for k in stride(from: 5, through: 1, by: -1) {
                    UIColor(hex: 0xFFE0A0, alpha: 0.12).setFill()
                    c.fillEllipse(in: CGRect(x: sun.x - CGFloat(k) * 46, y: sun.y - CGFloat(k) * 46, width: CGFloat(k) * 92, height: CGFloat(k) * 92))
                }
                UIColor(hex: 0xFFF2C8).setFill(); c.fillEllipse(in: CGRect(x: sun.x - 50, y: sun.y - 50, width: 100, height: 100))
                for k in 0..<4 { cumulus(CGFloat(120 + k * 260), CGFloat(rng.range(330, 380)), 220, 2, col(UIColor(hex: 0xFFC8A0), 0.1), col(UIColor(hex: 0xC0789A), 0.1)) }
            case "bridges":
                for k in 0..<3 { island(CGFloat(120 + k * 390), CGFloat(rng.range(280, 340)), 70, col(UIColor(hex: 0x8CA060), 0.4), col(UIColor(hex: 0x8E765E), 0.4)) }
                col(UIColor(hex: 0x6E5034), 0.4).setStroke(); c.setLineWidth(3)
                for k in 0..<2 {
                    let x1 = CGFloat(190 + k * 390), x2 = x1 + 250, y: CGFloat = 300
                    c.move(to: CGPoint(x: x1, y: y)); c.addQuadCurve(to: CGPoint(x: x2, y: y), control: CGPoint(x: (x1 + x2) / 2, y: y + 40)); c.strokePath()
                    for t in stride(from: CGFloat(0.1), to: 1, by: 0.1) { let x = x1 + (x2 - x1) * t; c.move(to: CGPoint(x: x, y: y + 40 * 4 * t * (1 - t) * 0.5)); c.addLine(to: CGPoint(x: x, y: y + 8 + 40 * 4 * t * (1 - t) * 0.5)); c.strokePath() }
                }
            case "gardenpeaks":
                for k in 0..<6 {
                    let x = CGFloat(80 + k * 170) + CGFloat(rng.range(-20, 20)), top = CGFloat(rng.range(120, 260))
                    col(UIColor(hex: 0x4CA060), 0.35).setFill()
                    c.move(to: CGPoint(x: x - 46, y: 512)); c.addLine(to: CGPoint(x: x - 18, y: top)); c.addLine(to: CGPoint(x: x + 18, y: top)); c.addLine(to: CGPoint(x: x + 46, y: 512)); c.closePath(); c.fillPath()
                    for _ in 0..<6 { UIColor(hex: [0xFF9ACB, 0xFFE07A, 0xFFFFFF][Int(rng.next() * 3)], alpha: 0.85).setFill(); c.fillEllipse(in: CGRect(x: x + CGFloat(rng.range(-20, 20)), y: top + CGFloat(rng.range(0, 120)), width: 7, height: 7)) }
                }
            case "ruinspires":
                for k in 0..<7 {
                    let x = CGFloat(60 + k * 150) + CGFloat(rng.range(-20, 20)), h = CGFloat(rng.range(120, 260))
                    col(UIColor(hex: 0xB8B0A0), 0.45).setFill(); c.fill(CGRect(x: x, y: 420 - h, width: 34, height: h))
                    c.fill(CGRect(x: x - 8, y: 420 - h - 10, width: 50, height: 12))
                    if k % 2 == 0 { c.addArc(center: CGPoint(x: x + 90, y: 420 - h * 0.6), radius: 56, startAngle: .pi, endAngle: 0, clockwise: false); col(UIColor(hex: 0xB8B0A0), 0.45).setStroke(); c.setLineWidth(12); c.strokePath() }
                }
            case "aurora":
                let bands: [(UInt32, CGFloat)] = [(0x7CFFC8, 120), (0x9CB4FF, 170), (0xD49CFF, 210)]
                for (hex, y) in bands {
                    UIColor(hex: hex, alpha: 0.18).setStroke(); c.setLineWidth(46)
                    c.move(to: CGPoint(x: 0, y: y)); for x in stride(from: 0, through: 1024, by: 32) { c.addLine(to: CGPoint(x: CGFloat(x), y: y + 30 * sin(CGFloat(x) / 140 + y))) }
                    c.strokePath()
                }
                for k in 0..<4 { island(CGFloat(140 + k * 250), CGFloat(rng.range(330, 380)), 60, col(UIColor(hex: 0x24305E), 0.2), col(UIColor(hex: 0x1A2248), 0.2)) }
            case "harpclouds":
                cumulus(512, 360, 700, 5, light, shadow)
                // riesige Harfe in den Wolken
                col(UIColor(hex: 0xE8C27A), 0.35).setStroke(); c.setLineWidth(10)
                c.move(to: CGPoint(x: 380, y: 400)); c.addQuadCurve(to: CGPoint(x: 640, y: 120), control: CGPoint(x: 330, y: 160)); c.addLine(to: CGPoint(x: 660, y: 400)); c.strokePath()
                c.setLineWidth(2)
                for k in 0..<9 { let x = CGFloat(420 + k * 26); c.move(to: CGPoint(x: x, y: 400)); c.addLine(to: CGPoint(x: x, y: 330 - CGFloat(k) * 22)); c.strokePath() }
            case "goldenvalley":
                hill(330, 40, col(UIColor(hex: 0x9CB45A), 0.35), 0.6, 2)
                hill(380, 30, col(UIColor(hex: 0x86A84A), 0.25), 2.2, 3)
                for k in 0..<9 {
                    let x = 280 + CGFloat(k) * 52, y = CGFloat(392) + CGFloat(rng.range(-6, 6))
                    col(UIColor(hex: 0xF8E8C8), 0.2).setFill(); c.fill(CGRect(x: x, y: y, width: 26, height: 16))
                    col(UIColor(hex: 0xB85A40), 0.25).setFill(); c.move(to: CGPoint(x: x - 5, y: y)); c.addLine(to: CGPoint(x: x + 13, y: y - 13)); c.addLine(to: CGPoint(x: x + 31, y: y)); c.closePath(); c.fillPath()
                    UIColor(hex: 0xFFE07A, alpha: 0.9).setFill(); c.fill(CGRect(x: x + 10, y: y + 5, width: 5, height: 5))
                }
                windmill(760, 380, 1.4, col(UIColor(hex: 0x8E6A44), 0.3))
            default: // ferne schwebende Inseln mit Wasserfällen über sanften Hügeln
                island(170, 280, 64, col(UIColor(hex: 0x76A256), 0.45), col(UIColor(hex: 0x98907E), 0.45), falls: true)
                island(900, 340, 44, col(UIColor(hex: 0x76A256), 0.55), col(UIColor(hex: 0x98907E), 0.55), falls: true)
                hill(430, 26, col(UIColor(hex: 0x86AE6E), 0.45), 1.1, 3)
            }
            // weich nach unten auslaufen
            let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                               colors: [UIColor(white: 1, alpha: 0).cgColor, UIColor(white: 1, alpha: 1).cgColor] as CFArray, locations: [0, 1])!
            c.setBlendMode(.destinationOut)
            c.drawLinearGradient(g, start: CGPoint(x: 0, y: 410), end: CGPoint(x: 0, y: 512), options: [])
        }
    }

    // MARK: Teilchenbilder

    static func seedFluff() -> UIImage {
        UIGraphicsImageRenderer(size: CGSize(width: 32, height: 32)).image { ctx in
            let c = ctx.cgContext
            UIColor(white: 1, alpha: 0.85).setStroke(); c.setLineWidth(1)
            for k in 0..<10 {
                let a = CGFloat(k) / 10 * .pi * 2
                c.move(to: CGPoint(x: 16, y: 16)); c.addLine(to: CGPoint(x: 16 + cos(a) * 11, y: 16 + sin(a) * 11)); c.strokePath()
            }
            UIColor(white: 1, alpha: 0.95).setFill(); c.fillEllipse(in: CGRect(x: 14, y: 14, width: 4, height: 4))
        }
    }

    static func raindrop() -> UIImage {
        UIGraphicsImageRenderer(size: CGSize(width: 8, height: 48)).image { ctx in
            let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                               colors: [UIColor(white: 1, alpha: 0).cgColor, UIColor(white: 0.95, alpha: 0.7).cgColor] as CFArray, locations: [0, 1])!
            ctx.cgContext.drawLinearGradient(g, start: CGPoint(x: 4, y: 0), end: CGPoint(x: 4, y: 48), options: [])
        }
    }

    static func letterPaper() -> UIImage {
        UIGraphicsImageRenderer(size: CGSize(width: 40, height: 30)).image { ctx in
            let c = ctx.cgContext
            UIColor(hex: 0xF6EEDA).setFill(); c.fill(CGRect(x: 2, y: 2, width: 36, height: 26))
            UIColor(hex: 0xB89A70).setStroke(); c.setLineWidth(1.2)
            c.move(to: CGPoint(x: 2, y: 2)); c.addLine(to: CGPoint(x: 20, y: 16)); c.addLine(to: CGPoint(x: 38, y: 2)); c.strokePath()
            UIColor(hex: 0xC9463F).setFill(); c.fillEllipse(in: CGRect(x: 17, y: 13, width: 6, height: 6))
        }
    }

    static func butterfly(_ color: UIColor) -> UIImage {
        UIGraphicsImageRenderer(size: CGSize(width: 40, height: 32)).image { ctx in
            let c = ctx.cgContext
            color.withAlphaComponent(0.35).setFill(); c.fillEllipse(in: CGRect(x: 0, y: 0, width: 40, height: 32))
            color.setFill()
            c.fillEllipse(in: CGRect(x: 6, y: 6, width: 14, height: 12)); c.fillEllipse(in: CGRect(x: 20, y: 6, width: 14, height: 12))
            c.fillEllipse(in: CGRect(x: 9, y: 16, width: 10, height: 9)); c.fillEllipse(in: CGRect(x: 21, y: 16, width: 10, height: 9))
            UIColor(white: 1, alpha: 0.9).setFill(); c.fill(CGRect(x: 19, y: 8, width: 2, height: 17))
        }
    }
}

extension UIColor {
    func mixed(with other: UIColor, _ t: CGFloat) -> UIColor {
        var r1: CGFloat = 0, g1: CGFloat = 0, b1: CGFloat = 0, a1: CGFloat = 0, r2: CGFloat = 0, g2: CGFloat = 0, b2: CGFloat = 0, a2: CGFloat = 0
        getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
        other.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)
        return UIColor(red: r1 + (r2 - r1) * t, green: g1 + (g2 - g1) * t, blue: b1 + (b2 - b1) * t, alpha: a1 + (a2 - a1) * t)
    }

    func multiplied(_ f: CGFloat) -> UIColor {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        getRed(&r, green: &g, blue: &b, alpha: &a)
        return UIColor(red: r * f, green: g * f, blue: b * f, alpha: a)
    }
}
