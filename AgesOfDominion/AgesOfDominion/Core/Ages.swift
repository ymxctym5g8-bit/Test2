import Foundation

/// Beschreibung einer der zwölf Epochen.
struct AgeInfo {
    let index: Int
    let name: String
    let era: String
    let description: String
    /// Kosten, um IN diese Epoche aufzusteigen.
    let advanceCost: ResourceBundle
    let researchTime: Double
    /// Architektur des Stadtzentrums in dieser Epoche.
    let townCenterName: String
    let townCenterEmoji: String
    let tint: RGB
}

enum Ages {
    static let count = 12

    static let all: [AgeInfo] = [
        AgeInfo(index: 0, name: "Urzeit", era: "ca. 50 000 v. Chr.",
                description: "Stammeslager, Keulen, Speerwerfer und Mammutjagden.",
                advanceCost: .zero, researchTime: 0,
                townCenterName: "Stammeslager", townCenterEmoji: "🛖", tint: RGB(0.55, 0.42, 0.28)),
        AgeInfo(index: 1, name: "Bronzezeit", era: "ca. 3000 v. Chr.",
                description: "Streitwagen, Bogenschützen und hölzerne Palisaden.",
                advanceCost: ResourceBundle(food: 400, wood: 200), researchTime: 30,
                townCenterName: "Bronzehalle", townCenterEmoji: "🛖", tint: RGB(0.72, 0.52, 0.25)),
        AgeInfo(index: 2, name: "Eisenzeit", era: "ca. 800 v. Chr.",
                description: "Phalanxen, Legionen, Katapulte und die ersten Galeeren.",
                advanceCost: ResourceBundle(food: 600, wood: 300, iron: 150), researchTime: 35,
                townCenterName: "Forum", townCenterEmoji: "🏛️", tint: RGB(0.62, 0.62, 0.66)),
        AgeInfo(index: 3, name: "Mittelalter", era: "ca. 1100 n. Chr.",
                description: "Ritterorden, Trebuchets, Belagerungstürme und Steinburgen.",
                advanceCost: ResourceBundle(food: 800, iron: 350, gold: 250), researchTime: 40,
                townCenterName: "Steinburg", townCenterEmoji: "🏰", tint: RGB(0.55, 0.55, 0.5)),
        AgeInfo(index: 4, name: "Schießpulverzeit", era: "ca. 1550 n. Chr.",
                description: "Musketiere, Kanonen, Kürassiere und Galeonen.",
                advanceCost: ResourceBundle(food: 1000, wood: 300, iron: 500, gold: 400), researchTime: 45,
                townCenterName: "Zitadelle", townCenterEmoji: "🏰", tint: RGB(0.68, 0.6, 0.48)),
        AgeInfo(index: 5, name: "Dampfzeitalter", era: "ca. 1800 n. Chr.",
                description: "Linieninfanterie, Kanonenbatterien, Eisenbahnen und Fabriken.",
                advanceCost: ResourceBundle(food: 1200, wood: 500, iron: 800, gold: 600), researchTime: 50,
                townCenterName: "Rathaus", townCenterEmoji: "🏤", tint: RGB(0.6, 0.35, 0.3)),
        AgeInfo(index: 6, name: "Moderne", era: "ca. 1914 n. Chr.",
                description: "Grabenkämpfe, MG-Nester, erste Panzer und Doppeldecker.",
                advanceCost: ResourceBundle(food: 1400, iron: 1000, gold: 800, strategic: 300), researchTime: 55,
                townCenterName: "Regierungssitz", townCenterEmoji: "🏢", tint: RGB(0.45, 0.45, 0.42)),
        AgeInfo(index: 7, name: "Atomzeitalter", era: "ca. 1945 n. Chr.",
                description: "Panzerverbände, Flugzeugträger, Radar und Atomraketen-Silos.",
                advanceCost: ResourceBundle(food: 1600, iron: 1200, gold: 1000, strategic: 700), researchTime: 60,
                townCenterName: "Kommandozentrale", townCenterEmoji: "🏢", tint: RGB(0.4, 0.48, 0.4)),
        AgeInfo(index: 8, name: "Digitalzeitalter", era: "ca. 2000 n. Chr.",
                description: "Kampfhubschrauber, Raketenwerfer und Spezialeinheiten.",
                advanceCost: ResourceBundle(food: 1800, iron: 1300, gold: 1200, strategic: 1000), researchTime: 60,
                townCenterName: "Datenzentrale", townCenterEmoji: "🏙️", tint: RGB(0.35, 0.45, 0.6)),
        AgeInfo(index: 9, name: "Kybernetik-Ära", era: "ca. 2070 n. Chr.",
                description: "Kampfmechs, Cyborg-Krieger und Drohnenschwärme.",
                advanceCost: ResourceBundle(food: 2000, iron: 1500, gold: 1400, strategic: 1300), researchTime: 65,
                townCenterName: "Kybernetik-Zitadelle", townCenterEmoji: "🏙️", tint: RGB(0.3, 0.55, 0.65)),
        AgeInfo(index: 10, name: "Nano-Ära", era: "ca. 2150 n. Chr.",
                description: "Schwebepanzer, Schutzschilde und Orbitalsatelliten-Schläge.",
                advanceCost: ResourceBundle(food: 2200, iron: 1700, gold: 1600, strategic: 1600), researchTime: 70,
                townCenterName: "Nano-Arkologie", townCenterEmoji: "🌐", tint: RGB(0.4, 0.75, 0.8)),
        AgeInfo(index: 11, name: "Fusionszeitalter", era: "ca. 2300 n. Chr.",
                description: "Titan-Mechs, Plasma-Artillerie und Fusionskreuzer.",
                advanceCost: ResourceBundle(food: 2500, iron: 2000, gold: 2000, strategic: 2000), researchTime: 75,
                townCenterName: "Fusions-Spire", townCenterEmoji: "🛸", tint: RGB(0.7, 0.55, 0.9)),
    ]

    static func info(_ index: Int) -> AgeInfo { all[index.clamped(0, count - 1)] }

    /// Grobe Epochen-Gruppen, wie im Spielkonzept beschrieben.
    static func groupName(_ index: Int) -> String {
        switch index {
        case 0...1: return "Urzeit & Bronzezeit"
        case 2...3: return "Eisenzeit & Mittelalter"
        case 4...5: return "Schießpulver & Dampf"
        case 6...7: return "Moderne & Atomzeitalter"
        case 8: return "Digitalzeitalter"
        default: return "Nano- & Kybernetik-Ära"
        }
    }
}
