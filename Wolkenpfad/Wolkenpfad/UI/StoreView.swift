import SwiftUI

/// Kaufbildschirm: ein einziger Kauf schaltet die ganze Reise frei.
struct StoreView: View {
    @EnvironmentObject private var store: Store
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    VStack(spacing: 10) {
                        Image(systemName: "wind")
                            .font(.system(size: 30, weight: .light))
                            .foregroundColor(Ink.accent)
                        Text("The Full Journey")
                            .font(.system(size: 30, weight: .light, design: .serif))
                            .foregroundColor(Ink.text)
                        Text("Hana finds her grandfather’s wind harp and sets out to mend the fading winds – across floating islands, storms, glass lakes and ruins, up to the great harp at the heart of the clouds.")
                            .font(.system(size: 15, design: .serif))
                            .italic()
                            .multilineTextAlignment(.center)
                            .foregroundColor(Ink.soft)
                    }
                    .padding(.top, 8)

                    VStack(alignment: .leading, spacing: 16) {
                        ForEach(Catalog.acts.filter { !$0.free }) { act in
                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(act.title.uppercased()) · \(act.subtitle)")
                                    .font(.system(size: 12, weight: .semibold, design: .serif))
                                    .tracking(1.5)
                                    .foregroundColor(Ink.accent)
                                ForEach(Array(act.chapters), id: \.self) { n in
                                    Text("\(n) · \(Catalog.chapter(n).title)")
                                        .font(.system(size: 14, design: .serif))
                                        .foregroundColor(Ink.text)
                                }
                            }
                        }
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 22, style: .continuous).fill(Color.white.opacity(0.6)))
                    .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Ink.gold.opacity(0.5), lineWidth: 1.2))

                    if store.unlocked {
                        Label("The whole journey is yours", systemImage: "checkmark.circle.fill")
                            .font(.system(size: 17, weight: .semibold, design: .serif))
                            .foregroundColor(Ink.gold)
                            .frame(height: 52)
                    } else {
                        Button {
                            Task { await store.purchase() }
                        } label: {
                            VStack(spacing: 2) {
                                Text("Unlock all \(Catalog.paidChapters) chapters")
                                    .font(.system(size: 17, weight: .semibold, design: .serif))
                                Text(store.price ?? "…")
                                    .font(.system(size: 14, design: .serif))
                                    .opacity(0.9)
                            }
                            .foregroundColor(Ink.paper)
                            .frame(maxWidth: 300)
                            .frame(height: 60)
                            .background(Capsule().fill(Ink.accent.opacity(0.92)))
                        }
                        .disabled(store.busy)
                    }

                    Button {
                        Task { await store.restore() }
                    } label: {
                        Text("Restore Purchase")
                            .font(.system(size: 15, design: .serif))
                            .foregroundColor(Ink.text)
                            .underline()
                    }
                    Text("One purchase · no ads · no subscriptions · Family Sharing")
                        .font(.system(size: 12, design: .serif))
                        .foregroundColor(Ink.soft)
                        .multilineTextAlignment(.center)
                        .padding(.bottom, 24)
                }
                .padding(.horizontal, 22)
            }
            .background(Ink.paper.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }.foregroundColor(Ink.text)
                }
            }
            .overlay {
                if store.busy {
                    ProgressView().padding(24).background(RoundedRectangle(cornerRadius: 16).fill(Ink.paper))
                }
            }
            .alert(Catalog.appName, isPresented: Binding(get: { store.message != nil }, set: { if !$0 { store.message = nil } })) {
                Button("OK") { store.message = nil }
            } message: {
                Text(store.message ?? "")
            }
        }
    }
}
