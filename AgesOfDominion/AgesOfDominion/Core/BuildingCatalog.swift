import Foundation

enum BuildingKind: String, CaseIterable {
    case stadtzentrum, haus, lager, bauernhof, kaserne, stall, werkstatt, hafen, tempel
    case turm, mauer, bahnhof, fabrik, flugplatz, radar, raketensilo, schildgenerator, orbitaluplink, wunder

    var stats: BuildingStats { BuildingCatalog.table[self]! }
}

struct BuildingStats {
    let baseName: String
    let size: Int
    let hp: Double
    let armor: Double
    let cost: ResourceBundle
    let buildTime: Double
    let minAge: Int
    let obsoleteAge: Int?
    let pop: Int
    let dropSite: Bool
    let attack: Double
    let range: Double
    let cooldown: Double
    let sight: Double
    let blocks: Bool
    let needsCoast: Bool
    let maxCount: Int?
    /// Lebenspunkte und Angriff wachsen mit der Epoche des Besitzers.
    let scalesWithAge: Bool
    let description: String
}

enum BuildingCatalog {
    static let table: [BuildingKind: BuildingStats] = [
        .stadtzentrum: BuildingStats(baseName: "Stadtzentrum", size: 3, hp: 1600, armor: 5,
                                     cost: ResourceBundle(food: 200, wood: 400, iron: 100), buildTime: 90,
                                     minAge: 0, obsoleteAge: nil, pop: 10, dropSite: true, attack: 6, range: 6,
                                     cooldown: 2, sight: 10, blocks: true, needsCoast: false, maxCount: 4,
                                     scalesWithAge: true,
                                     description: "Herz der Zivilisation: bildet Arbeiter und Helden aus, erforscht den Epochensprung."),
        .haus: BuildingStats(baseName: "Haus", size: 2, hp: 400, armor: 2,
                             cost: ResourceBundle(wood: 50), buildTime: 18, minAge: 0, obsoleteAge: nil, pop: 8,
                             dropSite: false, attack: 0, range: 0, cooldown: 0, sight: 4, blocks: true,
                             needsCoast: false, maxCount: nil, scalesWithAge: true,
                             description: "+8 Bevölkerung."),
        .lager: BuildingStats(baseName: "Lager", size: 2, hp: 500, armor: 2,
                              cost: ResourceBundle(wood: 100), buildTime: 20, minAge: 0, obsoleteAge: nil, pop: 0,
                              dropSite: true, attack: 0, range: 0, cooldown: 0, sight: 5, blocks: true,
                              needsCoast: false, maxCount: nil, scalesWithAge: true,
                              description: "Abgabestelle für alle Rohstoffe – baue es nahe Wäldern und Minen."),
        .bauernhof: BuildingStats(baseName: "Bauernhof", size: 2, hp: 250, armor: 0,
                                  cost: ResourceBundle(wood: 60), buildTime: 12, minAge: 1, obsoleteAge: nil, pop: 0,
                                  dropSite: false, attack: 0, range: 0, cooldown: 0, sight: 3, blocks: false,
                                  needsCoast: false, maxCount: nil, scalesWithAge: false,
                                  description: "Unerschöpfliche Nahrungsquelle."),
        .kaserne: BuildingStats(baseName: "Kaserne", size: 3, hp: 1000, armor: 3,
                                cost: ResourceBundle(wood: 150), buildTime: 35, minAge: 0, obsoleteAge: nil, pop: 0,
                                dropSite: false, attack: 0, range: 0, cooldown: 0, sight: 5, blocks: true,
                                needsCoast: false, maxCount: nil, scalesWithAge: true,
                                description: "Bildet Infanterie und Fernkämpfer aus."),
        .stall: BuildingStats(baseName: "Stall", size: 3, hp: 1000, armor: 3,
                              cost: ResourceBundle(wood: 175), buildTime: 35, minAge: 1, obsoleteAge: 7, pop: 0,
                              dropSite: false, attack: 0, range: 0, cooldown: 0, sight: 5, blocks: true,
                              needsCoast: false, maxCount: nil, scalesWithAge: true,
                              description: "Bildet Streitwagen und Kavallerie aus."),
        .werkstatt: BuildingStats(baseName: "Belagerungswerkstatt", size: 3, hp: 1000, armor: 3,
                                  cost: ResourceBundle(wood: 200, iron: 50), buildTime: 40, minAge: 1, obsoleteAge: nil,
                                  pop: 0, dropSite: false, attack: 0, range: 0, cooldown: 0, sight: 5, blocks: true,
                                  needsCoast: false, maxCount: nil, scalesWithAge: true,
                                  description: "Baut Rammböcke, Katapulte, Kanonen und Artillerie."),
        .hafen: BuildingStats(baseName: "Hafen", size: 3, hp: 1100, armor: 3,
                              cost: ResourceBundle(wood: 200), buildTime: 40, minAge: 2, obsoleteAge: nil, pop: 0,
                              dropSite: true, attack: 0, range: 0, cooldown: 0, sight: 7, blocks: true,
                              needsCoast: true, maxCount: nil, scalesWithAge: true,
                              description: "Muss an der Küste stehen. Baut Kriegsschiffe."),
        .tempel: BuildingStats(baseName: "Tempel", size: 3, hp: 900, armor: 3,
                               cost: ResourceBundle(wood: 150, gold: 50), buildTime: 40, minAge: 0, obsoleteAge: nil,
                               pop: 0, dropSite: false, attack: 0, range: 0, cooldown: 0, sight: 6, blocks: true,
                               needsCoast: false, maxCount: nil, scalesWithAge: true,
                               description: "Bildet Heiler aus. Einheiten in der Nähe regenerieren."),
        .turm: BuildingStats(baseName: "Turm", size: 2, hp: 700, armor: 6,
                             cost: ResourceBundle(wood: 100, iron: 50), buildTime: 30, minAge: 1, obsoleteAge: nil,
                             pop: 0, dropSite: false, attack: 9, range: 7, cooldown: 1.6, sight: 9, blocks: true,
                             needsCoast: false, maxCount: nil, scalesWithAge: true,
                             description: "Verteidigungsanlage. Ab der Moderne auch gegen Flugzeuge."),
        .mauer: BuildingStats(baseName: "Palisade", size: 1, hp: 500, armor: 8,
                              cost: ResourceBundle(wood: 8), buildTime: 4, minAge: 1, obsoleteAge: nil, pop: 0,
                              dropSite: false, attack: 0, range: 0, cooldown: 0, sight: 2, blocks: true,
                              needsCoast: false, maxCount: nil, scalesWithAge: true,
                              description: "Blockiert den Weg. Bleibt im Platzierungsmodus für ganze Mauerzüge."),
        .bahnhof: BuildingStats(baseName: "Bahnhof", size: 3, hp: 1200, armor: 4,
                                cost: ResourceBundle(wood: 200, iron: 250), buildTime: 45, minAge: 5, obsoleteAge: nil,
                                pop: 0, dropSite: true, attack: 0, range: 0, cooldown: 0, sight: 6, blocks: true,
                                needsCoast: false, maxCount: 3, scalesWithAge: true,
                                description: "Dampfeisenbahn: Abgabestelle und +10 % auf alle Sammelraten (je Bahnhof)."),
        .fabrik: BuildingStats(baseName: "Fabrik", size: 3, hp: 1600, armor: 6,
                               cost: ResourceBundle(iron: 300, gold: 100), buildTime: 50, minAge: 6, obsoleteAge: nil,
                               pop: 0, dropSite: false, attack: 0, range: 0, cooldown: 0, sight: 5, blocks: true,
                               needsCoast: false, maxCount: nil, scalesWithAge: true,
                               description: "Produziert Panzer, Mechs und Schwebepanzer."),
        .flugplatz: BuildingStats(baseName: "Flugplatz", size: 4, hp: 1500, armor: 5,
                                  cost: ResourceBundle(iron: 300, gold: 150, strategic: 100), buildTime: 55, minAge: 6,
                                  obsoleteAge: nil, pop: 0, dropSite: false, attack: 0, range: 0, cooldown: 0,
                                  sight: 8, blocks: true, needsCoast: false, maxCount: nil, scalesWithAge: true,
                                  description: "Startbahn für Jäger, Bomber und Hubschrauber."),
        .radar: BuildingStats(baseName: "Radarstation", size: 2, hp: 600, armor: 4,
                              cost: ResourceBundle(iron: 150, gold: 100), buildTime: 30, minAge: 7, obsoleteAge: nil,
                              pop: 0, dropSite: false, attack: 0, range: 0, cooldown: 0, sight: 22, blocks: true,
                              needsCoast: false, maxCount: nil, scalesWithAge: true,
                              description: "Riesiger Sichtradius."),
        .raketensilo: BuildingStats(baseName: "Atomraketen-Silo", size: 3, hp: 2000, armor: 10,
                                    cost: ResourceBundle(iron: 600, gold: 500, strategic: 400), buildTime: 70, minAge: 7,
                                    obsoleteAge: nil, pop: 0, dropSite: false, attack: 0, range: 0, cooldown: 0,
                                    sight: 5, blocks: true, needsCoast: false, maxCount: 2, scalesWithAge: true,
                                    description: "Baut Atomraketen, die überall auf der Karte einschlagen können."),
        .schildgenerator: BuildingStats(baseName: "Schildgenerator", size: 2, hp: 900, armor: 8,
                                        cost: ResourceBundle(iron: 300, gold: 200, strategic: 300), buildTime: 40,
                                        minAge: 10, obsoleteAge: nil, pop: 0, dropSite: false, attack: 0, range: 0,
                                        cooldown: 0, sight: 7, blocks: true, needsCoast: false, maxCount: nil,
                                        scalesWithAge: true,
                                        description: "Eigene Einheiten und Gebäude im Umkreis von 7 Feldern erleiden 50 % weniger Schaden."),
        .orbitaluplink: BuildingStats(baseName: "Orbital-Uplink", size: 3, hp: 1500, armor: 8,
                                      cost: ResourceBundle(iron: 500, gold: 500, strategic: 600), buildTime: 60,
                                      minAge: 10, obsoleteAge: nil, pop: 0, dropSite: false, attack: 0, range: 0,
                                      cooldown: 0, sight: 6, blocks: true, needsCoast: false, maxCount: 1,
                                      scalesWithAge: true,
                                      description: "Steuert einen Kampfsatelliten: Orbitalschlag alle 90 Sekunden."),
        .wunder: BuildingStats(baseName: "Weltwunder", size: 4, hp: 6000, armor: 10,
                               cost: ResourceBundle(food: 1000, wood: 1000, iron: 1000, gold: 1500), buildTime: 240,
                               minAge: 3, obsoleteAge: nil, pop: 0, dropSite: false, attack: 0, range: 0, cooldown: 0,
                               sight: 8, blocks: true, needsCoast: false, maxCount: 1, scalesWithAge: false,
                               description: "Überdauert es 5 Minuten nach Fertigstellung, gewinnt sein Erbauer."),
    ]

    /// Gebäudenamen wechseln mit der Epoche des Besitzers (die Architektur entwickelt sich mit).
    static func name(_ kind: BuildingKind, age: Int) -> String {
        switch kind {
        case .stadtzentrum: return Ages.info(age).townCenterName
        case .haus:
            return ["Hütte", "Lehmhaus", "Steinhaus", "Fachwerkhaus", "Bürgerhaus", "Mietshaus",
                    "Arbeitersiedlung", "Wohnblock", "Hochhaus", "Wohnturm", "Habitat", "Fusions-Habitat"][age.clamped(0, 11)]
        case .turm:
            return ["Holzturm", "Wachturm", "Steinturm", "Burgturm", "Bastion", "Geschützturm",
                    "Schützengraben-Bunker", "Flak-Bunker", "Raketenstellung", "Laser-Turm", "Plasma-Turm", "Fusions-Bastion"][age.clamped(0, 11)]
        case .mauer:
            if age <= 2 { return "Palisade" }
            if age <= 5 { return "Steinmauer" }
            if age <= 8 { return "Betonwall" }
            return "Energiebarriere"
        case .wunder:
            if age <= 3 { return "Große Kathedrale" }
            if age <= 6 { return "Kristallpalast" }
            if age <= 8 { return "Raumfahrtzentrum" }
            return "Dyson-Monument"
        case .kaserne:
            return age >= 6 ? "Militärbasis" : (age >= 3 ? "Kaserne" : "Kriegerlager")
        case .lager:
            return age >= 5 ? "Depot" : "Lager"
        case .werkstatt:
            return age >= 6 ? "Artilleriewerk" : "Belagerungswerkstatt"
        case .tempel:
            if age >= 9 { return "Kathedrale der Singularität" }
            if age >= 5 { return "Kathedrale" }
            return "Tempel"
        default:
            return kind.stats.baseName
        }
    }

    static func emoji(_ kind: BuildingKind, age: Int) -> String {
        switch kind {
        case .stadtzentrum: return Ages.info(age).townCenterEmoji
        case .haus: return age >= 7 ? "🏬" : (age >= 3 ? "🏠" : "⛺️")
        case .lager: return age >= 5 ? "🏗️" : "📦"
        case .bauernhof: return "🌾"
        case .kaserne: return age >= 6 ? "🪖" : "⚔️"
        case .stall: return "🐴"
        case .werkstatt: return age >= 4 ? "🔩" : "🪚"
        case .hafen: return "⚓️"
        case .tempel: return age >= 5 ? "⛪️" : "🛕"
        case .turm: return age >= 6 ? "🛡️" : "🗼"
        case .mauer: return age >= 9 ? "🟦" : (age >= 3 ? "🧱" : "🪵")
        case .bahnhof: return "🚂"
        case .fabrik: return "🏭"
        case .flugplatz: return "🛬"
        case .radar: return "📡"
        case .raketensilo: return "☢️"
        case .schildgenerator: return "🔰"
        case .orbitaluplink: return "🛰️"
        case .wunder: return age >= 7 ? "🚀" : (age >= 4 ? "🗽" : "🕍")
        }
    }

    static let villagerBuildOrder: [BuildingKind] = [
        .haus, .lager, .bauernhof, .kaserne, .stall, .werkstatt, .hafen, .tempel, .turm, .mauer,
        .stadtzentrum, .bahnhof, .fabrik, .flugplatz, .radar, .raketensilo, .schildgenerator, .orbitaluplink, .wunder,
    ]
}
