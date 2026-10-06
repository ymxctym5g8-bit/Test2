import Foundation

enum UnitCategory: Int, CaseIterable {
    case villager, infantry, ranged, cavalry, siege, armor, air, naval, hero, support, animal

    var name: String {
        switch self {
        case .villager: return "Arbeiter"
        case .infantry: return "Infanterie"
        case .ranged: return "Fernkampf"
        case .cavalry: return "Kavallerie"
        case .siege: return "Belagerung"
        case .armor: return "Panzer/Mech"
        case .air: return "Luftwaffe"
        case .naval: return "Marine"
        case .hero: return "Held"
        case .support: return "Heiler"
        case .animal: return "Tier"
        }
    }

    static let military: [UnitCategory] = [.infantry, .ranged, .cavalry, .siege, .armor, .air, .naval, .hero]
    static let landMilitary: [UnitCategory] = [.infantry, .ranged, .cavalry, .siege, .armor, .hero]
}

enum MovementType {
    case land, naval, hover, air
}

/// Ziel-Klassen für die Kontermatrix (Einheiten-Kategorien + Gebäude).
enum TargetClass: Hashable {
    case unit(UnitCategory)
    case building
}

struct UnitStats {
    let name: String
    let emoji: String
    let age: Int
    let line: String
    let category: UnitCategory
    let producer: BuildingKind
    let hp: Double
    let attack: Double
    let armor: Double
    let range: Double
    let cooldown: Double
    let speed: Double
    let sight: Double
    let cost: ResourceBundle
    let trainTime: Double
    let pop: Int
    let movement: MovementType
    let canHitAir: Bool
    let airOnly: Bool
    let buildingOnly: Bool
    let splash: Double
    let bonus: [TargetClass: Double]
    let heal: Double
    let radius: Double
    let obsoleteAge: Int?
    let description: String

    var isRanged: Bool { range > 1.2 }
    var isMilitary: Bool { UnitCategory.military.contains(category) }
}

enum UnitKind: String, CaseIterable {
    // Arbeiter & Helden
    case arbeiter
    case stammeshaeuptling, ordensmeister, feldmarschall, general, cyberKommandant, fusionsAvatar
    // Infanterie
    case keulenkrieger, bronzekrieger, legionaer, langschwertkaempfer, cyborgKrieger
    case speertraeger, hoplit, pikenier
    // Fernkampf
    case speerwerfer, bogenschuetze, langbogenschuetze, musketier, linieninfanterie
    case grabenschuetze, sturmsoldat, spezialeinheit, nanoInfanterist
    case mgSchuetze, panzerabwehrtrupp, flakTrupp
    // Kavallerie
    case streitwagen, reiter, ritter, kuerassier, husar
    case berittenerBogenschuetze, dragoner
    // Belagerung
    case rammbock, belagerungsturm
    case katapult, trebuchet, kanone, feldartillerie, haubitze, raketenwerfer, plasmaArtillerie
    // Panzer / Mechs
    case landschiff, kampfpanzer, flakpanzer, kampfmech, schwebepanzer, titanMech
    // Luft
    case doppeldecker, jagdflugzeug, kampfjet, kampfdrohne, fusionsjaeger
    case bomber, kampfhubschrauber, fusionskreuzer
    // Marine
    case galeere, galeone, dampffregatte, schlachtschiff, raketenkreuzer, flugzeugtraeger
    // Heiler
    case schamane, priester, sanitaeter, nanoHeiler
    // Wildtiere (Gaia)
    case mammut, hirsch

    var stats: UnitStats { UnitCatalog.table[self]! }
}

enum UnitCatalog {
    static let table: [UnitKind: UnitStats] = build()

    // swiftlint:disable:next function_body_length
    private static func build() -> [UnitKind: UnitStats] {
        var t: [UnitKind: UnitStats] = [:]

        func add(_ kind: UnitKind, _ name: String, _ emoji: String, age: Int, line: String,
                 _ cat: UnitCategory, at producer: BuildingKind,
                 hp: Double, atk: Double, armor: Double = 0, range: Double = 0.7, cd: Double = 1.5,
                 speed: Double, sight: Double = 7, cost: ResourceBundle, time: Double, pop: Int = 1,
                 move: MovementType = .land, hitsAir: Bool = false, airOnly: Bool = false,
                 buildingOnly: Bool = false, splash: Double = 0, bonus: [TargetClass: Double] = [:],
                 heal: Double = 0, radius: Double = 0.32, obsolete: Int? = nil, _ desc: String) {
            t[kind] = UnitStats(name: name, emoji: emoji, age: age, line: line, category: cat, producer: producer,
                                hp: hp, attack: atk, armor: armor, range: range, cooldown: cd, speed: speed,
                                sight: sight, cost: cost, trainTime: time, pop: pop, movement: move,
                                canHitAir: hitsAir || airOnly, airOnly: airOnly, buildingOnly: buildingOnly,
                                splash: splash, bonus: bonus, heal: heal, radius: radius,
                                obsoleteAge: obsolete, description: desc)
        }
        typealias R = ResourceBundle
        let vsCav: [TargetClass: Double] = [.unit(.cavalry): 2.2, .unit(.hero): 1.3]
        let vsInf: [TargetClass: Double] = [.unit(.infantry): 1.5, .unit(.ranged): 1.4, .unit(.villager): 1.5]
        let vsArmor: [TargetClass: Double] = [.unit(.armor): 2.6, .unit(.naval): 1.6, .building: 1.3]
        let vsAir: [TargetClass: Double] = [.unit(.air): 2.5]

        // ---------- Arbeiter ----------
        add(.arbeiter, "Arbeiter", "🧑‍🌾", age: 0, line: "arbeiter", .villager, at: .stadtzentrum,
            hp: 40, atk: 3, cd: 1.5, speed: 1.4, sight: 5, cost: R(food: 50), time: 10,
            bonus: [.unit(.animal): 3], "Sammelt Rohstoffe, errichtet und repariert Gebäude, jagt Wild.")

        // ---------- Helden ----------
        add(.stammeshaeuptling, "Stammeshäuptling", "👑", age: 1, line: "held", .hero, at: .stadtzentrum,
            hp: 320, atk: 18, armor: 3, cd: 1.2, speed: 1.8, sight: 8, cost: R(food: 300, wood: 150), time: 30,
            radius: 0.38, "Held: Verstärkt Einheiten in der Nähe um 20 % Angriff.")
        add(.ordensmeister, "Ordensmeister", "🤴", age: 3, line: "held", .hero, at: .stadtzentrum,
            hp: 650, atk: 32, armor: 8, cd: 1.2, speed: 2.4, sight: 9, cost: R(food: 400, gold: 300), time: 35,
            radius: 0.4, "Held: Gepanzerter Anführer der Ritterorden.")
        add(.feldmarschall, "Feldmarschall", "🎖️", age: 5, line: "held", .hero, at: .stadtzentrum,
            hp: 750, atk: 40, armor: 8, range: 6, cd: 1.5, speed: 2.6, sight: 10,
            cost: R(food: 500, gold: 450), time: 40, radius: 0.4, "Held: Strategisches Genie des Dampfzeitalters.")
        add(.general, "General", "⭐️", age: 7, line: "held", .hero, at: .stadtzentrum,
            hp: 950, atk: 55, armor: 12, range: 7, cd: 1.4, speed: 2.8, sight: 11,
            cost: R(food: 600, gold: 600, strategic: 200), time: 45, radius: 0.42, "Held: Kommandiert Panzerverbände.")
        add(.cyberKommandant, "Cyber-Kommandant", "🦸", age: 9, line: "held", .hero, at: .stadtzentrum,
            hp: 1500, atk: 85, armor: 16, range: 7, cd: 1.2, speed: 3.0, sight: 12,
            cost: R(food: 700, gold: 700, strategic: 500), time: 50, radius: 0.45, "Held: Kybernetisch vernetzter Feldherr.")
        add(.fusionsAvatar, "Fusions-Avatar", "🌟", age: 11, line: "held", .hero, at: .stadtzentrum,
            hp: 2600, atk: 140, armor: 22, range: 8, cd: 1.2, speed: 3.2, sight: 13, cost: R(food: 900, gold: 900, strategic: 900), time: 60, hitsAir: true, radius: 0.5, "Held: Avatar reiner Fusionsenergie.")

        // ---------- Infanterie (Nahkampf) ----------
        add(.keulenkrieger, "Keulenkrieger", "🪓", age: 0, line: "nahkampf", .infantry, at: .kaserne,
            hp: 55, atk: 7, cd: 1.4, speed: 1.5, cost: R(food: 40, wood: 15), time: 12, "Billiger Nahkämpfer der Urzeit.")
        add(.bronzekrieger, "Bronzekrieger", "⚔️", age: 1, line: "nahkampf", .infantry, at: .kaserne,
            hp: 80, atk: 9, armor: 2, cd: 1.4, speed: 1.5, cost: R(food: 50, wood: 20, iron: 10), time: 13,
            "Krieger mit Bronzeschwert und Schild.")
        add(.legionaer, "Legionär", "🛡️", age: 2, line: "nahkampf", .infantry, at: .kaserne,
            hp: 115, atk: 11, armor: 3, cd: 1.3, speed: 1.5, cost: R(food: 55, iron: 30), time: 14,
            "Disziplinierter Schwertkämpfer der Eisenzeit.")
        add(.langschwertkaempfer, "Langschwertkämpfer", "🗡️", age: 3, line: "nahkampf", .infantry, at: .kaserne,
            hp: 145, atk: 15, armor: 4, cd: 1.3, speed: 1.5, cost: R(food: 60, iron: 35, gold: 15), time: 15,
            obsolete: 6, "Schwer gepanzerter Nahkämpfer des Mittelalters.")
        add(.cyborgKrieger, "Cyborg-Krieger", "🦾", age: 9, line: "nahkampf", .infantry, at: .kaserne,
            hp: 420, atk: 48, armor: 14, cd: 1.0, speed: 2.0, cost: R(food: 120, iron: 80, strategic: 40), time: 18,
            "Kybernetischer Nahkämpfer mit Monofilament-Klingen.")

        add(.speertraeger, "Speerträger", "🔱", age: 1, line: "speer", .infantry, at: .kaserne,
            hp: 70, atk: 7, armor: 1, range: 0.9, cd: 1.5, speed: 1.5, cost: R(food: 40, wood: 30), time: 12,
            bonus: vsCav, "Konter gegen Streitwagen und Reiter.")
        add(.hoplit, "Hoplit (Phalanx)", "🔱", age: 2, line: "speer", .infantry, at: .kaserne,
            hp: 105, atk: 9, armor: 4, range: 0.9, cd: 1.5, speed: 1.4, cost: R(food: 50, wood: 25, iron: 20), time: 13,
            bonus: vsCav, "Phalanx-Kämpfer – starr, gepanzert, tödlich gegen Kavallerie.")
        add(.pikenier, "Pikenier", "🔱", age: 3, line: "speer", .infantry, at: .kaserne,
            hp: 125, atk: 11, armor: 4, range: 1.0, cd: 1.5, speed: 1.4, cost: R(food: 55, wood: 30, iron: 20), time: 13,
            bonus: [.unit(.cavalry): 2.6, .unit(.hero): 1.5], obsolete: 6, "Lange Piken gegen Ritter und Kürassiere.")

        // ---------- Fernkampf ----------
        add(.speerwerfer, "Speerwerfer", "🪃", age: 0, line: "fern", .ranged, at: .kaserne,
            hp: 35, atk: 5, range: 4, cd: 1.8, speed: 1.5, cost: R(food: 35, wood: 30), time: 13,
            "Wirft Speere aus sicherer Entfernung.")
        add(.bogenschuetze, "Bogenschütze", "🏹", age: 1, line: "fern", .ranged, at: .kaserne,
            hp: 42, atk: 6, range: 5, cd: 1.7, speed: 1.5, cost: R(food: 35, wood: 40), time: 13,
            "Klassischer Bogenschütze.")
        add(.langbogenschuetze, "Langbogenschütze", "🏹", age: 3, line: "fern", .ranged, at: .kaserne,
            hp: 55, atk: 9, armor: 1, range: 6.5, cd: 1.7, speed: 1.5, cost: R(food: 40, wood: 50, gold: 10), time: 14,
            "Enorme Reichweite.")
        add(.musketier, "Musketier", "💂", age: 4, line: "fern", .ranged, at: .kaserne,
            hp: 85, atk: 17, armor: 2, range: 5.5, cd: 2.4, speed: 1.4, cost: R(food: 50, iron: 30, gold: 25), time: 15,
            "Schießpulver ändert alles.")
        add(.linieninfanterie, "Linieninfanterie", "💂", age: 5, line: "fern", .ranged, at: .kaserne,
            hp: 110, atk: 21, armor: 3, range: 6, cd: 2.0, speed: 1.5, cost: R(food: 55, iron: 35, gold: 25), time: 15,
            "Salvenfeuer in geschlossener Linie.")
        add(.grabenschuetze, "Grabenschütze", "🪖", age: 6, line: "fern", .ranged, at: .kaserne,
            hp: 130, atk: 23, armor: 4, range: 7, cd: 1.6, speed: 1.5, cost: R(food: 60, iron: 40, gold: 20), time: 15,
            "Infanterist der Grabenkämpfe.")
        add(.sturmsoldat, "Sturmsoldat", "🪖", age: 7, line: "fern", .ranged, at: .kaserne,
            hp: 160, atk: 28, armor: 5, range: 7, cd: 1.2, speed: 1.6, cost: R(food: 65, iron: 45, gold: 25), time: 15,
            "Mit Sturmgewehr ausgerüstet.")
        add(.spezialeinheit, "Spezialeinheit", "🥷", age: 8, line: "fern", .ranged, at: .kaserne,
            hp: 210, atk: 36, armor: 7, range: 7.5, cd: 1.1, speed: 1.8, cost: R(food: 80, iron: 50, gold: 40), time: 16,
            "Elitesoldat des Digitalzeitalters.")
        add(.nanoInfanterist, "Nano-Infanterist", "🧑‍🚀", age: 10, line: "fern", .ranged, at: .kaserne,
            hp: 340, atk: 52, armor: 12, range: 8, cd: 1.0, speed: 2.0, cost: R(food: 100, iron: 60, strategic: 50), time: 17, hitsAir: true, "Nanoanzug, Railgun, trifft auch Flieger.")
        add(.mgSchuetze, "MG-Schütze", "🎯", age: 6, line: "mg", .ranged, at: .kaserne,
            hp: 120, atk: 8, armor: 3, range: 7, cd: 0.35, speed: 1.2, cost: R(food: 70, iron: 60, gold: 20), time: 17,
            bonus: vsInf, "Mäht Infanterie und Kavallerie nieder.")
        add(.panzerabwehrtrupp, "Panzerabwehrtrupp", "🚀", age: 7, line: "pak", .ranged, at: .kaserne,
            hp: 120, atk: 42, armor: 3, range: 7, cd: 3, speed: 1.4, cost: R(food: 70, iron: 50, gold: 40), time: 17,
            bonus: vsArmor, "Bazookas gegen Panzer und Schiffe.")
        add(.flakTrupp, "Flugabwehrtrupp", "📡", age: 6, line: "flak", .ranged, at: .kaserne,
            hp: 110, atk: 22, armor: 3, range: 8, cd: 1.2, speed: 1.4, cost: R(food: 60, iron: 60, gold: 20), time: 16, airOnly: true, bonus: vsAir, "Holt Flugzeuge vom Himmel.")

        // ---------- Kavallerie ----------
        add(.streitwagen, "Streitwagen", "🛞", age: 1, line: "reiter", .cavalry, at: .stall,
            hp: 120, atk: 9, armor: 1, cd: 1.5, speed: 2.4, sight: 8, cost: R(food: 60, wood: 60), time: 16,
            pop: 2, radius: 0.42, "Schneller Wagen der Bronzezeit.")
        add(.reiter, "Reiter", "🐎", age: 2, line: "reiter", .cavalry, at: .stall,
            hp: 145, atk: 11, armor: 2, cd: 1.4, speed: 2.8, sight: 8, cost: R(food: 70, iron: 40), time: 16,
            pop: 2, radius: 0.42, "Leichte Kavallerie.")
        add(.ritter, "Ritter", "🏇", age: 3, line: "reiter", .cavalry, at: .stall,
            hp: 210, atk: 15, armor: 5, cd: 1.4, speed: 2.6, sight: 8, cost: R(food: 70, iron: 50, gold: 60), time: 18,
            pop: 2, radius: 0.44, "Schwer gepanzerter Ordensritter.")
        add(.kuerassier, "Kürassier", "🏇", age: 4, line: "reiter", .cavalry, at: .stall,
            hp: 240, atk: 19, armor: 6, cd: 1.4, speed: 2.7, sight: 8, cost: R(food: 75, iron: 55, gold: 65), time: 18,
            pop: 2, radius: 0.44, "Brustpanzer und Pallasch.")
        add(.husar, "Husar", "🐎", age: 5, line: "reiter", .cavalry, at: .stall,
            hp: 260, atk: 22, armor: 5, cd: 1.3, speed: 3.0, sight: 9, cost: R(food: 80, iron: 50, gold: 60), time: 17,
            pop: 2, radius: 0.44, obsolete: 7, "Letzte Blüte der Kavallerie des 18./19. Jahrhunderts.")
        add(.berittenerBogenschuetze, "Berittener Bogenschütze", "🏹", age: 2, line: "berittenfern", .cavalry, at: .stall,
            hp: 100, atk: 7, armor: 1, range: 5, cd: 1.8, speed: 2.7, sight: 8, cost: R(food: 60, wood: 50, iron: 20),
            time: 17, pop: 2, radius: 0.42, "Schnelle Plänkler zu Pferd.")
        add(.dragoner, "Dragoner", "🐎", age: 5, line: "berittenfern", .cavalry, at: .stall,
            hp: 190, atk: 19, armor: 3, range: 5, cd: 2.2, speed: 2.7, sight: 9, cost: R(food: 75, iron: 40, gold: 50),
            time: 17, pop: 2, radius: 0.42, obsolete: 7, "Berittene Musketenschützen.")

        // ---------- Belagerung ----------
        add(.rammbock, "Rammbock", "🪵", age: 1, line: "ramme", .siege, at: .werkstatt,
            hp: 220, atk: 28, armor: 6, range: 0.8, cd: 2.5, speed: 1.0, cost: R(wood: 160, iron: 20), time: 22,
            pop: 2, buildingOnly: true, bonus: [.building: 1.4], radius: 0.48, "Bricht Tore und Palisaden.")
        add(.belagerungsturm, "Belagerungsturm", "🗼", age: 3, line: "ramme", .siege, at: .werkstatt,
            hp: 480, atk: 42, armor: 8, range: 0.8, cd: 2.5, speed: 0.9, cost: R(wood: 220, iron: 60), time: 26,
            pop: 3, buildingOnly: true, bonus: [.building: 1.5], radius: 0.55, obsolete: 5,
            "Rollender Turm gegen Burgmauern.")
        add(.katapult, "Katapult", "☄️", age: 2, line: "artillerie", .siege, at: .werkstatt,
            hp: 120, atk: 38, armor: 2, range: 7.5, cd: 4, speed: 0.85, sight: 9, cost: R(wood: 160, iron: 60), time: 24,
            pop: 3, splash: 0.8, radius: 0.48, "Schleudert Felsbrocken.")
        add(.trebuchet, "Trebuchet", "☄️", age: 3, line: "artillerie", .siege, at: .werkstatt,
            hp: 150, atk: 70, armor: 3, range: 9, cd: 5, speed: 0.75, sight: 9, cost: R(wood: 220, iron: 60, gold: 60), time: 26,
            pop: 3, splash: 1.0, radius: 0.52, "Zerschmettert Steinburgen.")
        add(.kanone, "Kanone", "💣", age: 4, line: "artillerie", .siege, at: .werkstatt,
            hp: 180, atk: 70, armor: 4, range: 8, cd: 3.5, speed: 0.9, sight: 9, cost: R(wood: 120, iron: 120, gold: 80), time: 25,
            pop: 3, splash: 0.6, radius: 0.48, "Bronzekanone mit Kugelmunition.")
        add(.feldartillerie, "Kanonenbatterie", "💣", age: 5, line: "artillerie", .siege, at: .werkstatt,
            hp: 220, atk: 90, armor: 5, range: 9, cd: 3.2, speed: 1.0, sight: 9, cost: R(wood: 100, iron: 150, gold: 100), time: 25,
            pop: 3, splash: 1.0, radius: 0.5, "Gezogene Feldkanonen.")
        add(.haubitze, "Haubitze", "💣", age: 6, line: "artillerie", .siege, at: .werkstatt,
            hp: 260, atk: 120, armor: 6, range: 11, cd: 3.5, speed: 1.0, sight: 9, cost: R(iron: 180, gold: 120, strategic: 40),
            time: 26, pop: 3, splash: 1.3, radius: 0.5, "Steilfeuer über die Gräben.")
        add(.raketenwerfer, "Raketenwerfer", "🚀", age: 8, line: "artillerie", .siege, at: .werkstatt,
            hp: 320, atk: 145, armor: 8, range: 12, cd: 3.2, speed: 1.8, sight: 10, cost: R(iron: 200, gold: 150, strategic: 100),
            time: 26, pop: 3, splash: 1.6, radius: 0.52, "Mehrfachraketenwerfer.")
        add(.plasmaArtillerie, "Plasma-Artillerie", "🔆", age: 11, line: "artillerie", .siege, at: .werkstatt,
            hp: 520, atk: 270, armor: 14, range: 14, cd: 3.2, speed: 1.6, sight: 11, cost: R(iron: 300, gold: 250, strategic: 250),
            time: 30, pop: 4, splash: 2.0, radius: 0.6, "Verdampft ganze Kompanien.")

        // ---------- Panzer / Mechs ----------
        add(.landschiff, "Landschiff Mk. I", "🚜", age: 6, line: "panzer", .armor, at: .fabrik,
            hp: 460, atk: 34, armor: 10, range: 5, cd: 2.2, speed: 1.0, sight: 7, cost: R(iron: 200, gold: 60, strategic: 60),
            time: 28, pop: 3, radius: 0.55, "Erster Panzer – durchbricht die Grabenlinien.")
        add(.kampfpanzer, "Kampfpanzer", "🚜", age: 7, line: "panzer", .armor, at: .fabrik,
            hp: 600, atk: 55, armor: 13, range: 6, cd: 2.4, speed: 2.0, sight: 8, cost: R(iron: 220, gold: 80, strategic: 100),
            time: 28, pop: 3, radius: 0.58, "Rückgrat der Panzerverbände.")
        add(.flakpanzer, "Flakpanzer", "📡", age: 7, line: "flakpanzer", .armor, at: .fabrik,
            hp: 380, atk: 38, armor: 9, range: 9, cd: 1.0, speed: 2.0, sight: 10, cost: R(iron: 160, gold: 80, strategic: 80), time: 24, pop: 3, airOnly: true, bonus: vsAir, radius: 0.52,
            "Mobile Flugabwehr.")
        add(.kampfmech, "Kampfmech", "🤖", age: 9, line: "panzer", .armor, at: .fabrik,
            hp: 850, atk: 72, armor: 16, range: 6.5, cd: 2.0, speed: 1.6, sight: 9, cost: R(iron: 250, gold: 100, strategic: 160), time: 30, pop: 4, hitsAir: true, radius: 0.62, "Zweibeiniger Kampfläufer.")
        add(.schwebepanzer, "Schwebepanzer", "🛸", age: 10, line: "panzer", .armor, at: .fabrik,
            hp: 760, atk: 82, armor: 14, range: 7, cd: 1.8, speed: 2.8, sight: 9, cost: R(iron: 240, gold: 120, strategic: 180), time: 28, pop: 4, move: .hover, radius: 0.6,
            "Gleitet über Land und Wasser.")
        add(.titanMech, "Titan-Mech", "👾", age: 11, line: "panzer", .armor, at: .fabrik,
            hp: 1700, atk: 150, armor: 22, range: 8, cd: 2.0, speed: 1.3, sight: 10, cost: R(iron: 400, gold: 200, strategic: 300), time: 36, pop: 6, hitsAir: true, splash: 0.8, radius: 0.8,
            "Ein wandelnder Festungsturm.")

        // ---------- Luftwaffe ----------
        add(.doppeldecker, "Doppeldecker", "🛩️", age: 6, line: "jaeger", .air, at: .flugplatz,
            hp: 150, atk: 12, armor: 2, range: 4, cd: 1.0, speed: 4.0, sight: 10, cost: R(wood: 80, iron: 80, strategic: 60), time: 22, pop: 2, move: .air, hitsAir: true, radius: 0.4,
            "Wendiger Jäger des Ersten Weltkriegs.")
        add(.jagdflugzeug, "Jagdflugzeug", "✈️", age: 7, line: "jaeger", .air, at: .flugplatz,
            hp: 250, atk: 26, armor: 4, range: 4.5, cd: 1.0, speed: 5.0, sight: 11, cost: R(iron: 120, gold: 40, strategic: 80), time: 22, pop: 2, move: .air, hitsAir: true, radius: 0.42, "Luftüberlegenheitsjäger.")
        add(.kampfjet, "Kampfjet", "✈️", age: 8, line: "jaeger", .air, at: .flugplatz,
            hp: 330, atk: 40, armor: 6, range: 5, cd: 1.0, speed: 6.0, sight: 12, cost: R(iron: 140, gold: 60, strategic: 120), time: 22, pop: 2, move: .air, hitsAir: true, radius: 0.44, "Überschall-Mehrzweckjet.")
        add(.kampfdrohne, "Kampfdrohne", "🛰️", age: 9, line: "jaeger", .air, at: .flugplatz,
            hp: 300, atk: 46, armor: 6, range: 5.5, cd: 0.9, speed: 6.0, sight: 12, cost: R(iron: 120, gold: 60, strategic: 130), time: 18, pop: 2, move: .air, hitsAir: true, radius: 0.4, "Autonome Jagddrohne.")
        add(.fusionsjaeger, "Fusionsjäger", "🌠", age: 11, line: "jaeger", .air, at: .flugplatz,
            hp: 520, atk: 75, armor: 10, range: 6, cd: 0.8, speed: 7.0, sight: 13, cost: R(iron: 180, gold: 100, strategic: 200), time: 22, pop: 3, move: .air, hitsAir: true, radius: 0.45, "Fusionsgetriebener Jäger.")
        add(.bomber, "Bomber", "🛫", age: 7, line: "bomber", .air, at: .flugplatz,
            hp: 420, atk: 150, armor: 5, range: 1.2, cd: 5, speed: 3.6, sight: 10,
            cost: R(iron: 180, gold: 100, strategic: 120), time: 30, pop: 3, move: .air, splash: 1.6,
            bonus: [.building: 1.4], radius: 0.5, "Flächenbombardement gegen Bodenziele.")
        add(.kampfhubschrauber, "Kampfhubschrauber", "🚁", age: 8, line: "heli", .air, at: .flugplatz,
            hp: 360, atk: 48, armor: 6, range: 6, cd: 1.6, speed: 3.6, sight: 10,
            cost: R(iron: 150, gold: 80, strategic: 120), time: 24, pop: 3, move: .air,
            bonus: [.unit(.armor): 1.8], radius: 0.48, "Panzerjäger der Lüfte.")
        add(.fusionskreuzer, "Fusionskreuzer", "🚀", age: 11, line: "bomber", .air, at: .flugplatz,
            hp: 1300, atk: 300, armor: 14, range: 3, cd: 4.5, speed: 2.6, sight: 12,
            cost: R(iron: 350, gold: 250, strategic: 350), time: 40, pop: 6, move: .air, splash: 2.2,
            bonus: [.building: 1.4], radius: 0.75, "Fliegende Festung des Fusionszeitalters.")

        // ---------- Marine ----------
        add(.galeere, "Galeere", "🚣", age: 2, line: "kriegsschiff", .naval, at: .hafen,
            hp: 220, atk: 10, armor: 2, range: 5, cd: 2.0, speed: 1.8, sight: 8, cost: R(wood: 150, iron: 30), time: 22,
            pop: 2, move: .naval, radius: 0.55, "Ruderkriegsschiff.")
        add(.galeone, "Galeone", "⛵", age: 4, line: "kriegsschiff", .naval, at: .hafen,
            hp: 420, atk: 24, armor: 4, range: 7, cd: 2.4, speed: 1.9, sight: 9, cost: R(wood: 220, iron: 60, gold: 60),
            time: 26, pop: 3, move: .naval, splash: 0.4, radius: 0.6, "Breitseiten-Segelschiff.")
        add(.dampffregatte, "Dampffregatte", "🚢", age: 5, line: "kriegsschiff", .naval, at: .hafen,
            hp: 560, atk: 36, armor: 6, range: 8, cd: 2.4, speed: 2.1, sight: 9, cost: R(wood: 120, iron: 160, gold: 80),
            time: 26, pop: 3, move: .naval, splash: 0.6, radius: 0.62, "Panzerschiff unter Dampf.")
        add(.schlachtschiff, "Schlachtschiff", "🚢", age: 6, line: "kriegsschiff", .naval, at: .hafen,
            hp: 950, atk: 80, armor: 10, range: 12, cd: 3.5, speed: 1.8, sight: 11, cost: R(iron: 300, gold: 150, strategic: 120),
            time: 34, pop: 5, move: .naval, splash: 1.0, radius: 0.75, "Schwimmende Artillerie.")
        add(.raketenkreuzer, "Raketenkreuzer", "🛳️", age: 9, line: "kriegsschiff", .naval, at: .hafen,
            hp: 1150, atk: 100, armor: 12, range: 13, cd: 3.0, speed: 2.4, sight: 12, cost: R(iron: 320, gold: 180, strategic: 220), time: 34, pop: 5, move: .naval, hitsAir: true, splash: 1.0, radius: 0.75,
            "Lenkwaffen gegen Luft- und Bodenziele.")
        add(.flugzeugtraeger, "Flugzeugträger", "🛳️", age: 7, line: "traeger", .naval, at: .hafen,
            hp: 1600, atk: 55, armor: 10, range: 14, cd: 1.6, speed: 1.4, sight: 14, cost: R(iron: 450, gold: 250, strategic: 250), time: 45, pop: 6, move: .naval, hitsAir: true, radius: 0.9,
            "Startet Trägerflugzeuge gegen alles in Reichweite.")

        // ---------- Heiler ----------
        add(.schamane, "Schamane", "🪶", age: 0, line: "heiler", .support, at: .tempel,
            hp: 35, atk: 0, range: 4, cd: 1, speed: 1.4, cost: R(food: 60, wood: 30), time: 16, heal: 3,
            "Heilt verwundete Stammesgenossen.")
        add(.priester, "Priester", "🙏", age: 3, line: "heiler", .support, at: .tempel,
            hp: 60, atk: 0, range: 5, cd: 1, speed: 1.4, cost: R(food: 60, gold: 60), time: 18, heal: 6,
            "Heilt und stärkt die Moral.")
        add(.sanitaeter, "Sanitäter", "🧑‍⚕️", age: 6, line: "heiler", .support, at: .tempel,
            hp: 110, atk: 0, range: 5, cd: 1, speed: 1.6, cost: R(food: 70, gold: 50), time: 18, heal: 9,
            "Feldsanitäter.")
        add(.nanoHeiler, "Nano-Heiler", "💉", age: 10, line: "heiler", .support, at: .tempel,
            hp: 220, atk: 0, range: 6, cd: 1, speed: 2.0, cost: R(food: 80, gold: 80, strategic: 40), time: 18, heal: 16,
            "Repariert Fleisch und Stahl mit Nanobots.")

        // ---------- Wildtiere ----------
        add(.mammut, "Mammut", "🦣", age: 0, line: "tier", .animal, at: .stadtzentrum,
            hp: 380, atk: 10, armor: 1, range: 0.9, cd: 2.4, speed: 0.9, sight: 5, cost: .zero, time: 0, pop: 0,
            radius: 0.6, "Gefährliche Beute – liefert 500 Nahrung.")
        add(.hirsch, "Hirsch", "🦌", age: 0, line: "tier", .animal, at: .stadtzentrum,
            hp: 30, atk: 0, cd: 2.0, speed: 1.8, sight: 5, cost: .zero, time: 0, pop: 0,
            radius: 0.35, "Scheue Beute – liefert 150 Nahrung.")
        return t
    }

    /// Alle Einheiten, die ein Gebäude in der gegebenen Epoche ausbilden kann.
    /// Pro Einheitenlinie wird nur die modernste verfügbare Variante angezeigt.
    static func trainable(at producer: BuildingKind, age: Int) -> [UnitKind] {
        var bestPerLine: [String: UnitKind] = [:]
        var order: [String] = []
        for kind in UnitKind.allCases {
            let s = kind.stats
            guard s.producer == producer, s.category != .animal, s.age <= age else { continue }
            if let obs = s.obsoleteAge, age >= obs { continue }
            if let existing = bestPerLine[s.line] {
                if existing.stats.age < s.age { bestPerLine[s.line] = kind }
            } else {
                bestPerLine[s.line] = kind
                order.append(s.line)
            }
        }
        return order.compactMap { bestPerLine[$0] }
    }
}

/// Kontermatrix: Angreifer-Kategorie gegen Ziel-Klasse.
enum CombatRules {
    static func multiplier(_ attacker: UnitCategory, _ target: TargetClass) -> Double {
        switch (attacker, target) {
        case (.infantry, .unit(.cavalry)): return 1.15
        case (.infantry, .unit(.siege)): return 1.6
        case (.infantry, .unit(.armor)): return 0.45
        case (.infantry, .building): return 0.5
        case (.ranged, .unit(.infantry)): return 1.2
        case (.ranged, .unit(.armor)): return 0.5
        case (.ranged, .building): return 0.25
        case (.cavalry, .unit(.ranged)): return 1.5
        case (.cavalry, .unit(.siege)): return 1.7
        case (.cavalry, .unit(.armor)): return 0.4
        case (.cavalry, .building): return 0.45
        case (.siege, .building): return 3.0
        case (.siege, .unit(.naval)): return 1.5
        case (.armor, .unit(.infantry)): return 1.4
        case (.armor, .unit(.ranged)): return 1.3
        case (.armor, .unit(.cavalry)): return 1.7
        case (.armor, .building): return 1.3
        case (.air, .unit(.armor)): return 1.3
        case (.air, .unit(.naval)): return 1.3
        case (.air, .building): return 1.2
        case (.naval, .unit(.naval)): return 1.25
        case (.naval, .building): return 1.4
        case (.villager, .building): return 0.3
        case (.hero, .building): return 0.8
        default: return 1.0
        }
    }
}
