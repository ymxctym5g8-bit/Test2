import Foundation

/// Fokus, der bei jedem Epochensprung gewählt wird und den Technologiebaum
/// dauerhaft prägt.
enum DoctrineFocus: Int, CaseIterable {
    case military, economy, sacred

    var title: String {
        switch self {
        case .military: return "Militärische Doktrin"
        case .economy: return "Wirtschaftsaufschwung"
        case .sacred: return "Sakrale Wunder"
        }
    }

    var icon: String {
        switch self {
        case .military: return "⚔️"
        case .economy: return "💰"
        case .sacred: return "🕍"
        }
    }
}

/// Alle dauerhaften Boni eines Spielers.
struct Modifiers {
    var attack: [UnitCategory: Double] = [:]
    var hp: [UnitCategory: Double] = [:]
    var armor: [UnitCategory: Double] = [:]
    var speed: [UnitCategory: Double] = [:]
    var range: [UnitCategory: Double] = [:]
    var trainSpeed: [UnitCategory: Double] = [:]
    var gather: [ResourceKind: Double] = [:]
    var unitCost: Double = 1
    var buildingCost: Double = 1
    var buildingCostByKind: [BuildingKind: Double] = [:]
    var buildSpeed: Double = 1
    var buildingHP: Double = 1
    var regen: Double = 0
    var higherAgeBonus: Double = 0
    var heroAura: Double = 1
    var popBonus: Int = 0
    var towerAttack: Double = 1
    var healPower: Double = 1
    var passiveIncome = ResourceBundle()
    var carryBonus: Double = 0
    var damageTaken: Double = 1
    var bonusVsArmorAir: Double = 0
    var wonderSpeed: Double = 1

    func attackMult(_ c: UnitCategory) -> Double { attack[c] ?? 1 }
    func hpMult(_ c: UnitCategory) -> Double { hp[c] ?? 1 }
    func armorBonus(_ c: UnitCategory) -> Double { armor[c] ?? 0 }
    func speedMult(_ c: UnitCategory) -> Double { speed[c] ?? 1 }
    func rangeBonus(_ c: UnitCategory) -> Double { range[c] ?? 0 }
    func trainSpeedMult(_ c: UnitCategory) -> Double { trainSpeed[c] ?? 1 }
    func gatherMult(_ r: ResourceKind) -> Double { gather[r] ?? 1 }
    func costMult(for building: BuildingKind) -> Double { buildingCost * (buildingCostByKind[building] ?? 1) }

    mutating func mulAttack(_ cats: [UnitCategory], _ f: Double) { for c in cats { attack[c] = attackMult(c) * f } }
    mutating func mulHP(_ cats: [UnitCategory], _ f: Double) { for c in cats { hp[c] = hpMult(c) * f } }
    mutating func addArmor(_ cats: [UnitCategory], _ v: Double) { for c in cats { armor[c] = armorBonus(c) + v } }
    mutating func mulSpeed(_ cats: [UnitCategory], _ f: Double) { for c in cats { speed[c] = speedMult(c) * f } }
    mutating func addRange(_ cats: [UnitCategory], _ v: Double) { for c in cats { range[c] = rangeBonus(c) + v } }
    mutating func mulTrain(_ cats: [UnitCategory], _ f: Double) { for c in cats { trainSpeed[c] = trainSpeedMult(c) * f } }
    mutating func mulGather(_ kinds: [ResourceKind], _ f: Double) { for r in kinds { gather[r] = gatherMult(r) * f } }
    mutating func mulBuildingCost(_ kind: BuildingKind, _ f: Double) { buildingCostByKind[kind] = (buildingCostByKind[kind] ?? 1) * f }
}

struct DoctrinePerk {
    let age: Int
    let focus: DoctrineFocus
    let name: String
    let description: String
    let apply: (inout Modifiers) -> Void
}

enum DoctrineCatalog {
    private static let mil = UnitCategory.military
    private static let all = ResourceKind.allCases

    /// Die drei Wahlmöglichkeiten beim Aufstieg in `age` (1...11).
    static func choices(forAge age: Int) -> [DoctrinePerk] {
        perks.filter { $0.age == age }.sorted { $0.focus.rawValue < $1.focus.rawValue }
    }

    static let perks: [DoctrinePerk] = [
        // ---- Bronzezeit ----
        DoctrinePerk(age: 1, focus: .military, name: "Kriegerkaste",
                     description: "+10 % Angriff für Infanterie und Fernkampf, Kaserne bildet 20 % schneller aus.") {
            $0.mulAttack([.infantry, .ranged], 1.1); $0.mulTrain([.infantry, .ranged], 1.2)
        },
        DoctrinePerk(age: 1, focus: .economy, name: "Ackerbau",
                     description: "+15 % Nahrung, Bauernhöfe 25 % billiger.") {
            $0.mulGather([.food], 1.15); $0.mulBuildingCost(.bauernhof, 0.75)
        },
        DoctrinePerk(age: 1, focus: .sacred, name: "Ahnenkult",
                     description: "Gebäude +20 % LP, Einheiten regenerieren 0,5 LP/s.") {
            $0.buildingHP *= 1.2; $0.regen += 0.5
        },
        // ---- Eisenzeit ----
        DoctrinePerk(age: 2, focus: .military, name: "Phalanx-Drill",
                     description: "+2 Rüstung für Infanterie, +10 % LP für alle Militäreinheiten.") {
            $0.addArmor([.infantry], 2); $0.mulHP(mil, 1.1)
        },
        DoctrinePerk(age: 2, focus: .economy, name: "Bergbau",
                     description: "+20 % Sammelrate für Eisen und Gold.") {
            $0.mulGather([.iron, .gold], 1.2)
        },
        DoctrinePerk(age: 2, focus: .sacred, name: "Tempelweihe",
                     description: "Heiler heilen 50 % stärker, Tempel 30 % billiger.") {
            $0.healPower *= 1.5; $0.mulBuildingCost(.tempel, 0.7)
        },
        // ---- Mittelalter ----
        DoctrinePerk(age: 3, focus: .military, name: "Ritterorden",
                     description: "Kavallerie +20 % LP und +10 % Angriff.") {
            $0.mulHP([.cavalry], 1.2); $0.mulAttack([.cavalry], 1.1)
        },
        DoctrinePerk(age: 3, focus: .economy, name: "Handelsgilden",
                     description: "+10 % auf alle Sammelraten, Gebäude 15 % billiger.") {
            $0.mulGather(all, 1.1); $0.buildingCost *= 0.85
        },
        DoctrinePerk(age: 3, focus: .sacred, name: "Glaubenseifer",
                     description: "+30 % Schaden gegen Einheiten aus höheren Epochen – der Mut der Unterlegenen.") {
            $0.higherAgeBonus += 0.3
        },
        // ---- Schießpulverzeit ----
        DoctrinePerk(age: 4, focus: .military, name: "Artilleriedoktrin",
                     description: "Belagerung +20 % Angriff und +1 Reichweite.") {
            $0.mulAttack([.siege], 1.2); $0.addRange([.siege], 1)
        },
        DoctrinePerk(age: 4, focus: .economy, name: "Kolonialhandel",
                     description: "+5 % alle Sammelraten und dauerhaft +1 Gold pro Sekunde.") {
            $0.mulGather(all, 1.05); $0.passiveIncome[.gold] += 1
        },
        DoctrinePerk(age: 4, focus: .sacred, name: "Kathedralenbau",
                     description: "Wunder 25 % billiger, Gebäude +15 % LP.") {
            $0.mulBuildingCost(.wunder, 0.75); $0.buildingHP *= 1.15
        },
        // ---- Dampfzeitalter ----
        DoctrinePerk(age: 5, focus: .military, name: "Generalstab",
                     description: "Alle Militäreinheiten +10 % Angriff, Ausbildung 15 % schneller.") {
            $0.mulAttack(mil, 1.1); $0.mulTrain(mil, 1.15)
        },
        DoctrinePerk(age: 5, focus: .economy, name: "Industrialisierung",
                     description: "+20 % auf alle Sammelraten, Gebäude werden 25 % schneller errichtet.") {
            $0.mulGather(all, 1.2); $0.buildSpeed *= 1.25
        },
        DoctrinePerk(age: 5, focus: .sacred, name: "Pilgerströme",
                     description: "Dauerhaft +1,5 Gold und +1 Nahrung pro Sekunde.") {
            $0.passiveIncome[.gold] += 1.5; $0.passiveIncome[.food] += 1
        },
        // ---- Moderne ----
        DoctrinePerk(age: 6, focus: .military, name: "Grabenkrieg",
                     description: "Infanterie und Fernkampf +3 Rüstung, Türme +25 % Angriff.") {
            $0.addArmor([.infantry, .ranged], 3); $0.towerAttack *= 1.25
        },
        DoctrinePerk(age: 6, focus: .economy, name: "Fließband",
                     description: "Alle Einheiten 15 % billiger.") {
            $0.unitCost *= 0.85
        },
        DoctrinePerk(age: 6, focus: .sacred, name: "Märtyrertum",
                     description: "+25 % Schaden gegen höhere Epochen, alle Einheiten +10 % LP.") {
            $0.higherAgeBonus += 0.25; $0.mulHP(UnitCategory.allCases, 1.1)
        },
        // ---- Atomzeitalter ----
        DoctrinePerk(age: 7, focus: .military, name: "Blitzkrieg",
                     description: "Panzer und Luftwaffe +15 % Tempo und +10 % Angriff.") {
            $0.mulSpeed([.armor, .air], 1.15); $0.mulAttack([.armor, .air], 1.1)
        },
        DoctrinePerk(age: 7, focus: .economy, name: "Wirtschaftswunder",
                     description: "+15 % alle Sammelraten, +20 Bevölkerungslimit.") {
            $0.mulGather(all, 1.15); $0.popBonus += 20
        },
        DoctrinePerk(age: 7, focus: .sacred, name: "Heilige Allianz",
                     description: "Regeneration +1,5 LP/s, Heiler +50 %.") {
            $0.regen += 1.5; $0.healPower *= 1.5
        },
        // ---- Digitalzeitalter ----
        DoctrinePerk(age: 8, focus: .military, name: "Präzisionsschläge",
                     description: "+1,5 Reichweite für Fernkampf und Belagerung, +15 % Schaden gegen Panzer und Luft.") {
            $0.addRange([.ranged, .siege], 1.5); $0.bonusVsArmorAir += 0.15
        },
        DoctrinePerk(age: 8, focus: .economy, name: "Globalisierung",
                     description: "Dauerhaft +1 pro Sekunde auf Nahrung, Holz, Eisen und Gold.") {
            for r in [ResourceKind.food, .wood, .iron, .gold] { $0.passiveIncome[r] += 1 }
        },
        DoctrinePerk(age: 8, focus: .sacred, name: "Kulturelle Hegemonie",
                     description: "Wunder-Countdown läuft 30 % schneller, Gebäude +20 % LP.") {
            $0.wonderSpeed *= 1.3; $0.buildingHP *= 1.2
        },
        // ---- Kybernetik ----
        DoctrinePerk(age: 9, focus: .military, name: "Kybernetische Verstärkung",
                     description: "Alle Militäreinheiten +20 % LP.") {
            $0.mulHP(mil, 1.2)
        },
        DoctrinePerk(age: 9, focus: .economy, name: "Automatisierung",
                     description: "Arbeiter tragen +5 und werden 50 % schneller ausgebildet.") {
            $0.carryBonus += 5; $0.mulTrain([.villager], 1.5)
        },
        DoctrinePerk(age: 9, focus: .sacred, name: "Transhumanismus",
                     description: "Regeneration +2 LP/s, Helden +50 % LP.") {
            $0.regen += 2; $0.mulHP([.hero], 1.5)
        },
        // ---- Nano ----
        DoctrinePerk(age: 10, focus: .military, name: "Schwarmdoktrin",
                     description: "Militär 15 % billiger und 20 % schneller ausgebildet.") {
            $0.unitCost *= 0.85; $0.mulTrain(mil, 1.2)
        },
        DoctrinePerk(age: 10, focus: .economy, name: "Nanofabrikation",
                     description: "Gebäude 30 % billiger und 50 % schneller errichtet.") {
            $0.buildingCost *= 0.7; $0.buildSpeed *= 1.5
        },
        DoctrinePerk(age: 10, focus: .sacred, name: "Göttlicher Schild",
                     description: "Alle eigenen Einheiten und Gebäude erleiden 15 % weniger Schaden.") {
            $0.damageTaken *= 0.85
        },
        // ---- Fusion ----
        DoctrinePerk(age: 11, focus: .military, name: "Totale Dominanz",
                     description: "+20 % Angriff für alle, Heldenaura doppelt so stark.") {
            $0.mulAttack(mil, 1.2); $0.heroAura *= 2
        },
        DoctrinePerk(age: 11, focus: .economy, name: "Post-Knappheit",
                     description: "+25 % alle Sammelraten, +2 von jedem Rohstoff pro Sekunde.") {
            $0.mulGather(all, 1.25); for r in ResourceKind.allCases { $0.passiveIncome[r] += 2 }
        },
        DoctrinePerk(age: 11, focus: .sacred, name: "Apotheose",
                     description: "Wunder 40 % billiger, +25 % Schaden gegen höhere Epochen, +10 % LP.") {
            $0.mulBuildingCost(.wunder, 0.6); $0.higherAgeBonus += 0.25; $0.mulHP(UnitCategory.allCases, 1.1)
        },
    ]
}
