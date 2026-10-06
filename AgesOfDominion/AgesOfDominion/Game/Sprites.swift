import SpriteKit

final class UnitSprite: SKNode {
    let base = SKSpriteNode(texture: TextureBank.shared.circle)
    let ring = SKSpriteNode(texture: TextureBank.shared.ring)
    let shadow = SKSpriteNode(texture: TextureBank.shared.glow)
    let icon: SKLabelNode
    let hpBack = SKSpriteNode(color: .black, size: .zero)
    let hpFill = SKSpriteNode(color: .green, size: .zero)
    let carryLabel = emojiLabel("", size: 11)
    let radiusPts: CGFloat
    private var facingSign: CGFloat = 1
    private var lastCarry: ResourceKind?
    private let barWidth: CGFloat

    init(unit: Unit) {
        radiusPts = CGFloat(unit.stats.radius) * tileSize * 1.3
        icon = emojiLabel(unit.stats.emoji, size: radiusPts * 1.45)
        barWidth = max(22, radiusPts * 2)
        super.init()
        let d = radiusPts * 2
        let color = PlayerPalette.sk(unit.owner)

        if unit.isAir {
            shadow.size = CGSize(width: d * 1.1, height: d * 0.7)
            shadow.color = .black
            shadow.colorBlendFactor = 1
            shadow.alpha = 0.35
            shadow.position = CGPoint(x: 8, y: -18)
            shadow.zPosition = -2
            addChild(shadow)
        }
        base.size = CGSize(width: d, height: d)
        base.color = color
        base.colorBlendFactor = 1
        base.alpha = unit.isAnimal ? 0.35 : (unit.isAir ? 0.55 : 0.9)
        base.zPosition = 0
        addChild(base)

        ring.size = CGSize(width: d + 8, height: d + 8)
        ring.color = SKColor(red: 0.4, green: 1, blue: 0.4, alpha: 1)
        ring.colorBlendFactor = 1
        ring.isHidden = true
        ring.zPosition = -1
        addChild(ring)

        icon.zPosition = 1
        addChild(icon)
        if unit.stats.category == .hero {
            let crown = emojiLabel("✨", size: radiusPts * 0.8)
            crown.position = CGPoint(x: radiusPts * 0.8, y: radiusPts * 0.8)
            crown.zPosition = 2
            addChild(crown)
        }

        hpBack.size = CGSize(width: barWidth + 2, height: 5)
        hpBack.position = CGPoint(x: 0, y: radiusPts + 6)
        hpBack.zPosition = 3
        hpBack.alpha = 0.7
        addChild(hpBack)
        hpFill.anchorPoint = CGPoint(x: 0, y: 0.5)
        hpFill.size = CGSize(width: barWidth, height: 3)
        hpFill.position = CGPoint(x: -barWidth / 2, y: radiusPts + 6)
        hpFill.zPosition = 4
        addChild(hpFill)

        carryLabel.position = CGPoint(x: radiusPts * 0.9, y: -radiusPts * 0.6)
        carryLabel.zPosition = 2
        addChild(carryLabel)
    }

    required init?(coder aDecoder: NSCoder) { fatalError() }

    func update(_ u: Unit, selected: Bool, time: Double) {
        position = u.pos.scenePoint
        if u.isAir {
            position.y += 10 + CGFloat(sin(time * 3 + Double(u.id))) * 2
        }
        ring.isHidden = !selected
        let c = cos(u.facing)
        if c > 0.25 { facingSign = -1 } else if c < -0.25 { facingSign = 1 }
        let pulse: CGFloat = u.attackFlash > 0 ? 1.18 : 1
        var bob: CGFloat = 0
        if u.isMoving && !u.isAir { bob = CGFloat(abs(sin(time * 10 + Double(u.id)))) * 2 }
        icon.xScale = facingSign * pulse
        icon.yScale = pulse
        icon.position = CGPoint(x: 0, y: bob)

        let frac = CGFloat(max(0, u.hp / u.maxHP))
        let showBar = selected || frac < 0.999
        hpBack.isHidden = !showBar
        hpFill.isHidden = !showBar
        if showBar {
            hpFill.xScale = frac
            hpFill.color = frac > 0.6 ? .green : (frac > 0.3 ? .yellow : .red)
        }
        let carry = u.carry > 0.5 ? u.carryKind : nil
        if carry != lastCarry {
            lastCarry = carry
            carryLabel.text = carry.map { $0.icon(age: 7) } ?? ""
        }
    }
}

final class BuildingSprite: SKNode {
    let base = SKSpriteNode(texture: TextureBank.shared.rounded)
    let roof = SKSpriteNode(texture: TextureBank.shared.rounded)
    let icon = emojiLabel("", size: 20)
    let nameLabel = SKLabelNode(fontNamed: "Avenir-Heavy")
    let hpBack = SKSpriteNode(color: .black, size: .zero)
    let hpFill = SKSpriteNode(color: .green, size: .zero)
    let scaffold = emojiLabel("🏗️", size: 20)
    let selection: SKShapeNode
    let flag = SKSpriteNode(texture: TextureBank.shared.pixel)
    let extra = SKNode()
    var renderedAge = -1
    let sizePts: CGFloat
    let kind: BuildingKind

    init(building b: Building) {
        kind = b.kind
        sizePts = CGFloat(b.size) * tileSize
        selection = SKShapeNode(rectOf: CGSize(width: sizePts + 6, height: sizePts + 6), cornerRadius: 6)
        super.init()
        base.size = CGSize(width: sizePts - 2, height: sizePts - 2)
        base.colorBlendFactor = 1
        addChild(base)
        roof.size = CGSize(width: sizePts * 0.62, height: sizePts * 0.62)
        roof.colorBlendFactor = 1
        roof.zPosition = 1
        addChild(roof)
        extra.zPosition = 1.5
        addChild(extra)
        icon.fontSize = b.size == 1 ? sizePts * 0.7 : sizePts * 0.45
        icon.zPosition = 2
        addChild(icon)

        nameLabel.fontSize = 10
        nameLabel.fontColor = .white
        nameLabel.position = CGPoint(x: 0, y: -sizePts / 2 - 12)
        nameLabel.zPosition = 3
        nameLabel.isHidden = !(b.kind == .stadtzentrum || b.kind == .wunder)
        addChild(nameLabel)

        flag.size = CGSize(width: 8, height: 6)
        flag.color = PlayerPalette.sk(b.owner)
        flag.colorBlendFactor = 1
        flag.position = CGPoint(x: sizePts / 2 - 7, y: sizePts / 2 - 6)
        flag.zPosition = 3
        if b.size > 1 { addChild(flag) }

        selection.strokeColor = SKColor(red: 0.4, green: 1, blue: 0.4, alpha: 1)
        selection.lineWidth = 2
        selection.fillColor = .clear
        selection.isHidden = true
        selection.zPosition = 5
        addChild(selection)

        let bw = sizePts * 0.8
        hpBack.size = CGSize(width: bw + 2, height: 6)
        hpBack.position = CGPoint(x: 0, y: sizePts / 2 + 6)
        hpBack.zPosition = 6
        hpBack.alpha = 0.7
        addChild(hpBack)
        hpFill.anchorPoint = CGPoint(x: 0, y: 0.5)
        hpFill.size = CGSize(width: bw, height: 4)
        hpFill.position = CGPoint(x: -bw / 2, y: sizePts / 2 + 6)
        hpFill.zPosition = 7
        addChild(hpFill)

        scaffold.fontSize = min(28, sizePts * 0.5)
        scaffold.position = CGPoint(x: sizePts * 0.25, y: -sizePts * 0.2)
        scaffold.zPosition = 4
        addChild(scaffold)
        position = b.center.scenePoint
    }

    required init?(coder aDecoder: NSCoder) { fatalError() }

    func refreshLook(_ b: Building, age: Int) {
        renderedAge = age
        let team = PlayerPalette.rgb(b.owner)
        let tint = Ages.info(age).tint
        switch b.kind {
        case .bauernhof:
            base.color = SKColor(red: 0.55, green: 0.42, blue: 0.2, alpha: 1)
            base.alpha = 0.85
            roof.isHidden = true
            icon.text = ""
            extra.removeAllChildren()
            for dx in [-0.25, 0.25] {
                for dy in [-0.25, 0.25] {
                    let w = emojiLabel("🌾", size: sizePts * 0.32)
                    w.position = CGPoint(x: sizePts * CGFloat(dx), y: sizePts * CGFloat(dy))
                    extra.addChild(w)
                }
            }
        case .mauer:
            base.color = SKColor(rgb: tint.mixed(with: RGB(0.6, 0.6, 0.6), 0.5).mixed(with: team, 0.25))
            roof.isHidden = true
            icon.text = ""
        default:
            base.color = SKColor(rgb: tint.mixed(with: team, 0.35))
            roof.color = SKColor(rgb: tint.scaled(0.75).mixed(with: team, 0.55))
            roof.isHidden = false
            icon.text = BuildingCatalog.emoji(b.kind, age: age)
            extra.removeAllChildren()
            if b.kind == .stadtzentrum || b.kind == .wunder || b.kind == .turm {
                decorate(age: age, team: team)
            }
        }
        nameLabel.text = BuildingCatalog.name(b.kind, age: age)
    }

    /// Ecktürme, Schornsteine oder Antennen – je nach Epoche verändert sich die Silhouette.
    private func decorate(age: Int, team: RGB) {
        let corner = sizePts / 2 - 6
        let deco: String
        switch age {
        case 0...1: deco = "🔥"
        case 2: deco = "🏺"
        case 3...4: deco = "🚩"
        case 5: deco = "💨"
        case 6...7: deco = "📻"
        case 8...9: deco = "📡"
        default: deco = "✨"
        }
        guard kind != .turm else {
            if age >= 6 {
                let l = emojiLabel(deco, size: 10)
                l.position = CGPoint(x: -corner, y: corner)
                extra.addChild(l)
            }
            return
        }
        for (i, p) in [CGPoint(x: -corner, y: corner), CGPoint(x: corner, y: -corner)].enumerated() {
            let l = emojiLabel(deco, size: 12)
            l.position = p
            l.zRotation = CGFloat(i) * 0.2
            extra.addChild(l)
        }
        if age >= 3 {
            for p in [CGPoint(x: -corner, y: -corner), CGPoint(x: corner, y: corner)] {
                let tower = SKSpriteNode(texture: TextureBank.shared.circle)
                tower.size = CGSize(width: 12, height: 12)
                tower.color = SKColor(rgb: Ages.info(age).tint.scaled(0.6).mixed(with: team, 0.4))
                tower.colorBlendFactor = 1
                tower.position = p
                extra.addChild(tower)
            }
        }
    }

    func update(_ b: Building, ownerAge: Int, selected: Bool) {
        if ownerAge != renderedAge { refreshLook(b, age: ownerAge) }
        selection.isHidden = !selected
        let complete = b.isComplete
        alpha = complete ? 1 : 0.55 + 0.4 * CGFloat(b.progress)
        scaffold.isHidden = complete
        let frac = CGFloat(max(0, b.hp / b.maxHP))
        let showBar = selected || frac < 0.999 || !complete
        hpBack.isHidden = !showBar
        hpFill.isHidden = !showBar
        if showBar {
            hpFill.xScale = complete ? frac : CGFloat(b.progress)
            hpFill.color = !complete ? .cyan : (frac > 0.6 ? .green : (frac > 0.3 ? .yellow : .red))
        }
        if b.wonderTimer != nil || b.kind == .stadtzentrum {
            if let t = b.wonderTimer {
                nameLabel.text = "\(BuildingCatalog.name(b.kind, age: ownerAge)) – \(formatTime(max(0, t)))"
            }
        }
    }
}

@MainActor
enum NodeSpriteFactory {
    static func make(_ n: ResourceNode, humanAge: Int) -> SKNode? {
        let node = SKNode()
        let sizePts = CGFloat(n.size) * tileSize
        switch n.style {
        case .farm:
            return nil
        case .tree:
            let trees = ["🌲", "🌳", "🌲", "🌳"]
            let l = emojiLabel(trees[n.variant % 4], size: tileSize * 1.15)
            l.position = CGPoint(x: CGFloat(n.variant - 1) * 2, y: 4)
            node.addChild(l)
        case .berries:
            node.addChild(emojiLabel("🫐", size: tileSize * 0.8))
        case .carcass:
            node.addChild(emojiLabel("🍖", size: tileSize * 0.8))
        case .ironMine, .goldMine, .deposit:
            let base = SKSpriteNode(texture: TextureBank.shared.rounded)
            base.size = CGSize(width: sizePts - 4, height: sizePts - 4)
            base.colorBlendFactor = 1
            let icon: String
            switch n.style {
            case .ironMine:
                base.color = SKColor(red: 0.45, green: 0.45, blue: 0.5, alpha: 1)
                icon = "⛓️"
            case .goldMine:
                base.color = SKColor(red: 0.75, green: 0.62, blue: 0.2, alpha: 1)
                icon = "🪙"
            default:
                base.color = SKColor(red: 0.15, green: 0.15, blue: 0.18, alpha: 1)
                icon = ResourceKind.strategic.icon(age: max(humanAge, ResourceKind.strategicUnlockAge))
            }
            node.addChild(base)
            let rock = emojiLabel("🪨", size: sizePts * 0.45)
            rock.position = CGPoint(x: -sizePts * 0.18, y: -sizePts * 0.12)
            node.addChild(rock)
            let l = emojiLabel(icon, size: sizePts * 0.42)
            l.position = CGPoint(x: sizePts * 0.15, y: sizePts * 0.12)
            node.addChild(l)
        }
        node.position = n.center.scenePoint
        return node
    }
}
