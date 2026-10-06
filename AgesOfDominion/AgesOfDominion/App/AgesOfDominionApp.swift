import SwiftUI

@main
struct AgesOfDominionApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.dark)
        }
        #if os(macOS)
        .defaultSize(width: 1440, height: 900)
        .commands {
            CommandGroup(replacing: .newItem) {}
        }
        #endif
    }
}

@MainActor
final class AppState: ObservableObject {
    @Published var settings = GameSettings()
    @Published var game: GameController?

    func start() {
        var s = settings
        s.seed = UInt64.random(in: 1...UInt64.max - 1)
        settings = s
        game = GameController(settings: s)
    }

    func restart() {
        game = nil
        start()
    }

    func exitToMenu() {
        game = nil
    }
}

struct RootView: View {
    @StateObject private var state = AppState()

    var body: some View {
        Group {
            if let game = state.game {
                GameScreen(controller: game, onExit: { state.exitToMenu() }, onRestart: { state.restart() })
                    .id(ObjectIdentifier(game))
            } else {
                MainMenuView(settings: $state.settings, onStart: { state.start() })
            }
        }
        #if os(macOS)
        .frame(minWidth: 960, minHeight: 640)
        #endif
    }
}
