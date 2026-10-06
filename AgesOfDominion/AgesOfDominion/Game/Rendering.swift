import SpriteKit
import SwiftUI
import CoreGraphics

/// Größe einer Kachel in Szenenpunkten.
let tileSize: CGFloat = 32

enum PlayerPalette {
    static let colors: [RGB] = [
        RGB(0.22, 0.52, 1.0),
        RGB(0.92, 0.22, 0.2),
        RGB(0.22, 0.78, 0.32),
        RGB(0.98, 0.72, 0.12),
    ]
    static let gaia = RGB(0.62, 0.52, 0.4)

    static func rgb(_ index: Int) -> RGB { index >= 0 ? colors[index % colors.count] : gaia }
    static func sk(_ index: Int) -> SKColor { SKColor(rgb: rgb(index)) }
    static func color(_ index: Int) -> Color { Color(rgb: rgb(index)) }
}

extension SKColor {
    convenience init(rgb: RGB, alpha: CGFloat = 1) {
        self.init(red: CGFloat(rgb.r), green: CGFloat(rgb.g), blue: CGFloat(rgb.b), alpha: alpha)
    }
}

extension Color {
    init(rgb: RGB) { self.init(red: rgb.r, green: rgb.g, blue: rgb.b) }
}

extension Vec2 {
    var scenePoint: CGPoint { CGPoint(x: CGFloat(x) * tileSize, y: CGFloat(y) * tileSize) }
}

extension CGPoint {
    var worldVec: Vec2 { Vec2(Double(x / tileSize), Double(y / tileSize)) }
}

enum ImageFactory {
    static func image(width: Int, height: Int, rgba: [UInt8]) -> CGImage? {
        let data = Data(rgba) as CFData
        guard let provider = CGDataProvider(data: data) else { return nil }
        return CGImage(width: width, height: height, bitsPerComponent: 8, bitsPerPixel: 32, bytesPerRow: width * 4,
                       space: CGColorSpaceCreateDeviceRGB(),
                       bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
                       provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent)
    }

    static func draw(width: Int, height: Int, _ body: (CGContext) -> Void) -> CGImage? {
        guard let ctx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0,
                                  space: CGColorSpaceCreateDeviceRGB(),
                                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        body(ctx)
        return ctx.makeImage()
    }

    static func terrainColor(_ t: Terrain) -> RGB {
        switch t {
        case .grass: return RGB(0.36, 0.56, 0.26)
        case .dirt: return RGB(0.55, 0.47, 0.3)
        case .sand: return RGB(0.86, 0.79, 0.56)
        case .shallow: return RGB(0.3, 0.58, 0.72)
        case .water: return RGB(0.14, 0.34, 0.6)
        case .rock: return RGB(0.42, 0.41, 0.4)
        }
    }

    /// Terrain-Bild mit `ppt` Pixeln pro Kachel.
    static func terrainImage(map: GameMap, ppt: Int, seed: UInt64) -> CGImage? {
        let w = map.width * ppt, h = map.height * ppt
        var px = [UInt8](repeating: 255, count: w * h * 4)
        var rng = SeededRandom(seed: seed ^ 0xABCDEF)
        for ty in 0..<map.height {
            for tx in 0..<map.width {
                let i = map.index(tx, ty)
                let t = map.terrain[i]
                let base = terrainColor(t)
                let shade = 0.88 + Double(map.shade[i]) * 0.24
                for py in 0..<ppt {
                    for pxx in 0..<ppt {
                        let n = rng.range(-0.05, 0.05)
                        var c = base.scaled(shade + n)
                        if t.isWater {
                            // Wellenmuster
                            let wave = sin(Double(tx * ppt + pxx) * 0.5 + Double(ty * ppt + py) * 0.9) * 0.04
                            c = c.scaled(1 + wave)
                        }
                        let x = tx * ppt + pxx
                        let y = (map.height - 1 - ty) * ppt + (ppt - 1 - py)
                        let o = (y * w + x) * 4
                        px[o] = UInt8((c.r * 255).clamped(0, 255))
                        px[o + 1] = UInt8((c.g * 255).clamped(0, 255))
                        px[o + 2] = UInt8((c.b * 255).clamped(0, 255))
                        px[o + 3] = 255
                    }
                }
            }
        }
        return image(width: w, height: h, rgba: px)
    }

    static func circle(size: Int, border: CGFloat = 0.12) -> CGImage? {
        draw(width: size, height: size) { ctx in
            let s = CGFloat(size)
            ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
            ctx.fillEllipse(in: CGRect(x: 1, y: 1, width: s - 2, height: s - 2))
            ctx.setStrokeColor(CGColor(red: 0.55, green: 0.55, blue: 0.55, alpha: 1))
            ctx.setLineWidth(s * border)
            let inset = s * border / 2 + 1
            ctx.strokeEllipse(in: CGRect(x: inset, y: inset, width: s - 2 * inset, height: s - 2 * inset))
        }
    }

    static func ring(size: Int, width: CGFloat) -> CGImage? {
        draw(width: size, height: size) { ctx in
            let s = CGFloat(size)
            ctx.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
            ctx.setLineWidth(width)
            ctx.strokeEllipse(in: CGRect(x: width, y: width, width: s - 2 * width, height: s - 2 * width))
        }
    }

    static func roundedRect(size: Int, radius: CGFloat, border: CGFloat) -> CGImage? {
        draw(width: size, height: size) { ctx in
            let s = CGFloat(size)
            let rect = CGRect(x: border / 2, y: border / 2, width: s - border, height: s - border)
            let path = CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil)
            ctx.addPath(path)
            ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
            ctx.fillPath()
            ctx.addPath(path)
            ctx.setStrokeColor(CGColor(red: 0.45, green: 0.45, blue: 0.45, alpha: 1))
            ctx.setLineWidth(border)
            ctx.strokePath()
        }
    }

    static func glow(size: Int) -> CGImage? {
        draw(width: size, height: size) { ctx in
            let s = CGFloat(size)
            let colors = [CGColor(red: 1, green: 1, blue: 1, alpha: 1), CGColor(red: 1, green: 1, blue: 1, alpha: 0)] as CFArray
            if let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 1]) {
                ctx.drawRadialGradient(g, startCenter: CGPoint(x: s / 2, y: s / 2), startRadius: 0,
                                       endCenter: CGPoint(x: s / 2, y: s / 2), endRadius: s / 2, options: [])
            }
        }
    }
}

/// Gemeinsam genutzte Texturen.
@MainActor
final class TextureBank {
    static let shared = TextureBank()
    let circle: SKTexture
    let ring: SKTexture
    let rounded: SKTexture
    let glow: SKTexture
    let pixel: SKTexture

    private init() {
        circle = SKTexture(cgImage: ImageFactory.circle(size: 64)!)
        ring = SKTexture(cgImage: ImageFactory.ring(size: 64, width: 4)!)
        rounded = SKTexture(cgImage: ImageFactory.roundedRect(size: 64, radius: 12, border: 5)!)
        glow = SKTexture(cgImage: ImageFactory.glow(size: 64)!)
        let px = ImageFactory.draw(width: 2, height: 2) { ctx in
            ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
            ctx.fill(CGRect(x: 0, y: 0, width: 2, height: 2))
        }
        pixel = SKTexture(cgImage: px!)
    }
}

@MainActor
func emojiLabel(_ text: String, size: CGFloat) -> SKLabelNode {
    let l = SKLabelNode(text: text)
    l.fontSize = size
    l.verticalAlignmentMode = .center
    l.horizontalAlignmentMode = .center
    return l
}
