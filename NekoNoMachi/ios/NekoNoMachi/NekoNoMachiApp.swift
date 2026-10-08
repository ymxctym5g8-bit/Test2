// NekoNoMachiApp.swift – Einstiegspunkt der App für iPhone, iPad und Mac (Mac Catalyst)
import SwiftUI

@main
struct NekoNoMachiApp: App {
    init() {
        // Ton auch dann abspielen, wenn andere Apps Musik spielen (wird gemischt) – im Hintergrund, nicht auf dem Haupt-Thread
        AudioSessionControl.start()
    }

    var body: some Scene {
        WindowGroup {
            GameView()
                .ignoresSafeArea()
                .statusBarHidden(true)
                .persistentSystemOverlays(.hidden)
                .background(Color(red: 0.62, green: 0.82, blue: 0.92))
                .onAppear {
                    UIApplication.shared.isIdleTimerDisabled = true
                    MacWindow.setup()
                }
        }
        .commands {
            // Nur ein Spielfenster: „Neues Fenster“ ausblenden
            CommandGroup(replacing: .newItem) {}
        }
    }
}

/// Fenstergröße am Mac wie bei der bisherigen Mac-App: startet mit 1280 × 800, mindestens 900 × 600.
enum MacWindow {
    static func setup() {
        #if targetEnvironment(macCatalyst)
        DispatchQueue.main.async {
            for case let scene as UIWindowScene in UIApplication.shared.connectedScenes {
                scene.sizeRestrictions?.minimumSize = CGSize(width: 900, height: 600)
                scene.sizeRestrictions?.maximumSize = CGSize(width: 10000, height: 10000)
                scene.title = "Neko no Machi"
                if #available(macCatalyst 16.0, *) {
                    let frame = scene.effectiveGeometry.systemFrame
                    if frame.width < 1000 || frame.height < 650 {
                        scene.requestGeometryUpdate(.Mac(systemFrame: CGRect(x: frame.minX, y: frame.minY, width: 1280, height: 800)))
                    }
                }
            }
        }
        #endif
    }
}
