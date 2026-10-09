import SwiftUI

/// Kapitelwahl: Prolog und drei Akte, mit Fortschritt und Kaufstatus.
struct ChapterSelect: View {
    let current: Int
    let onSelect: (Int) -> Void
    let onStore: () -> Void
    @EnvironmentObject private var progress: ChapterProgress
    @EnvironmentObject private var store: Store
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    ForEach(Catalog.acts) { act in
                        actSection(act)
                    }
                    Text("\(progress.completed.count) of \(Catalog.count) chapters complete")
                        .font(.system(size: 13, design: .serif))
                        .foregroundColor(Ink.soft)
                        .frame(maxWidth: .infinity)
                        .padding(.bottom, 20)
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
            }
            .background(Ink.paper.ignoresSafeArea())
            .navigationTitle("Chapters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }.foregroundColor(Ink.text)
                }
            }
        }
    }

    @ViewBuilder private func actSection(_ act: ActInfo) -> some View {
        let owned = act.free || store.unlocked
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(act.title.uppercased())
                        .font(.system(size: 12, weight: .semibold, design: .serif))
                        .tracking(2)
                        .foregroundColor(Ink.accent)
                    Text(act.subtitle)
                        .font(.system(size: 20, design: .serif))
                        .foregroundColor(Ink.text)
                }
                Spacer()
                if !owned {
                    Button(action: onStore) {
                        Label("Unlock", systemImage: "lock.open")
                            .font(.system(size: 14, weight: .semibold, design: .serif))
                            .foregroundColor(Ink.paper)
                            .padding(.horizontal, 14)
                            .frame(height: 34)
                            .background(Capsule().fill(Ink.accent.opacity(0.9)))
                    }
                } else if act.free {
                    Text("Free").font(.system(size: 13, design: .serif)).foregroundColor(Ink.soft)
                }
            }
            ForEach(Array(act.chapters), id: \.self) { n in
                chapterRow(n, owned: owned)
            }
        }
    }

    private func chapterRow(_ n: Int, owned: Bool) -> some View {
        let reached = progress.reached(n), done = progress.completed.contains(n), playable = owned && reached
        return Button {
            if playable { onSelect(n) } else if !owned { onStore() }
        } label: {
            HStack(spacing: 14) {
                Text(Catalog.roman(n))
                    .font(.system(size: 15, weight: n == current ? .semibold : .regular, design: .serif))
                    .foregroundColor(playable ? Ink.text : Ink.soft.opacity(0.6))
                    .frame(width: 46, height: 46)
                    .background(Circle().stroke(n == current ? Ink.accent : Ink.text.opacity(0.22), lineWidth: n == current ? 1.6 : 1))
                Text(Catalog.chapter(n).title)
                    .font(.system(size: 16, design: .serif))
                    .foregroundColor(playable ? Ink.text : Ink.soft.opacity(0.6))
                    .multilineTextAlignment(.leading)
                Spacer()
                Image(systemName: done ? "checkmark.circle.fill" : (!owned ? "lock" : (reached ? "chevron.right" : "circle.dotted")))
                    .foregroundColor(done ? Ink.gold : Ink.soft.opacity(0.7))
            }
            .padding(.vertical, 2)
        }
        .disabled(owned && !reached)
        .accessibilityLabel("Chapter \(n), \(Catalog.chapter(n).title)\(done ? ", complete" : "")\(owned ? "" : ", locked")")
    }
}
