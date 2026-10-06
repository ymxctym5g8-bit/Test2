import SwiftUI
import SpriteKit

#if os(macOS)
import AppKit

/// SKView, das Maus-, Trackpad- und Tastaturereignisse an die Szene weiterreicht.
final class GameSKView: SKView {
    private var trackingArea: NSTrackingArea?

    override var acceptsFirstResponder: Bool { true }

    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        window?.acceptsMouseMovedEvents = true
        window?.makeFirstResponder(self)
    }

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if let t = trackingArea { removeTrackingArea(t) }
        let t = NSTrackingArea(rect: bounds, options: [.mouseMoved, .activeInKeyWindow, .inVisibleRect], owner: self, userInfo: nil)
        addTrackingArea(t)
        trackingArea = t
    }

    private var gameScene: GameScene? { scene as? GameScene }

    override func mouseDown(with event: NSEvent) {
        window?.makeFirstResponder(self)
        gameScene?.handleMouseDown(event)
    }

    override func mouseDragged(with event: NSEvent) { gameScene?.handleMouseDragged(event) }
    override func mouseUp(with event: NSEvent) { gameScene?.handleMouseUp(event) }
    override func rightMouseDown(with event: NSEvent) {
        window?.makeFirstResponder(self)
        gameScene?.handleRightMouseDown(event)
    }
    override func rightMouseUp(with event: NSEvent) {}
    override func mouseMoved(with event: NSEvent) { gameScene?.handleMouseMoved(event) }
    override func scrollWheel(with event: NSEvent) { gameScene?.handleScroll(event) }
    override func magnify(with event: NSEvent) { gameScene?.handleMagnify(event) }
    override func keyDown(with event: NSEvent) { gameScene?.handleKeyDown(event) }
    override func keyUp(with event: NSEvent) { gameScene?.handleKeyUp(event) }
}

struct GameSceneView: NSViewRepresentable {
    let scene: GameScene

    func makeNSView(context: Context) -> GameSKView {
        let v = GameSKView()
        v.ignoresSiblingOrder = true
        v.preferredFramesPerSecond = 60
        v.presentScene(scene)
        return v
    }

    func updateNSView(_ nsView: GameSKView, context: Context) {}
}
#else
import UIKit

struct GameSceneView: UIViewRepresentable {
    let scene: GameScene

    func makeUIView(context: Context) -> SKView {
        let v = SKView()
        v.ignoresSiblingOrder = true
        v.preferredFramesPerSecond = 60
        v.isMultipleTouchEnabled = true
        v.presentScene(scene)
        return v
    }

    func updateUIView(_ uiView: SKView, context: Context) {}
}
#endif
