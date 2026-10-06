import SwiftUI

enum Theme {
    static let gold = Color(red: 0.95, green: 0.78, blue: 0.36)
    static let panel = Color(red: 0.08, green: 0.09, blue: 0.12).opacity(0.86)
    static let panelLight = Color(red: 0.16, green: 0.17, blue: 0.22).opacity(0.92)
    static let border = Color(red: 0.95, green: 0.78, blue: 0.36).opacity(0.35)
    static let text = Color(red: 0.94, green: 0.92, blue: 0.86)
    static let dim = Color(red: 0.94, green: 0.92, blue: 0.86).opacity(0.6)

    static func focusColor(_ f: DoctrineFocus) -> Color {
        switch f {
        case .military: return Color(red: 0.85, green: 0.3, blue: 0.25)
        case .economy: return Color(red: 0.95, green: 0.75, blue: 0.25)
        case .sacred: return Color(red: 0.55, green: 0.45, blue: 0.95)
        }
    }
}

struct PanelBackground: ViewModifier {
    var padding: CGFloat = 8
    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Theme.panel))
            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(Theme.border, lineWidth: 1))
    }
}

extension View {
    func panel(padding: CGFloat = 8) -> some View { modifier(PanelBackground(padding: padding)) }
}

struct HPBar: View {
    let fraction: Double
    var height: CGFloat = 6

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.black.opacity(0.6))
                Capsule()
                    .fill(fraction > 0.6 ? Color.green : (fraction > 0.3 ? Color.yellow : Color.red))
                    .frame(width: geo.size.width * CGFloat(max(0, min(1, fraction))))
            }
        }
        .frame(height: height)
    }
}
