import SwiftUI

@main
struct WolkenpfadApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.light)
        }
    }
}

struct RootView: View {
    /// Ein Neustart erzeugt eine frische Spielwelt.
    @State private var session = UUID()

    var body: some View {
        GameScreen(onRestart: { session = UUID() })
            .id(session)
            .background(Color(red: 0.99, green: 0.9, blue: 0.82).ignoresSafeArea())
    }
}
