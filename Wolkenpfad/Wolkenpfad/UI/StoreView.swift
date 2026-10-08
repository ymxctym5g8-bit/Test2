import SwiftUI

/// Kaufbildschirm: drei Akte einzeln oder die ganze Reise zum Vorzugspreis.
struct StoreView: View {
    @EnvironmentObject private var store: Store
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    VStack(spacing: 8) {
                        Text("Continue the Journey")
                            .font(.system(size: 28, weight: .light, design: .serif))
                            .foregroundColor(Ink.text)
                        Text("Hana finds her grandfather’s wind harp and sets out to mend the fading winds – fifteen new chapters across floating islands, storms, glass lakes and the great harp at the heart of the clouds.")
                            .font(.system(size: 15, design: .serif))
                            .italic()
                            .multilineTextAlignment(.center)
                            .foregroundColor(Ink.soft)
                    }
                    .padding(.top, 8)

                    journeyCard
                    ForEach(Catalog.acts.filter { $0.productID != nil }) { act in
                        actCard(act)
                    }

                    Button {
                        Task { await store.restore() }
                    } label: {
                        Text("Restore Purchases")
                            .font(.system(size: 15, design: .serif))
                            .foregroundColor(Ink.text)
                            .underline()
                    }
                    .padding(.top, 4)
                    Text("One-time purchases · no ads · no subscriptions · shareable with Family Sharing")
                        .font(.system(size: 12, design: .serif))
                        .foregroundColor(Ink.soft)
                        .multilineTextAlignment(.center)
                        .padding(.bottom, 24)
                }
                .padding(.horizontal, 20)
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
            .alert("Wolkenpfad", isPresented: Binding(get: { store.message != nil }, set: { if !$0 { store.message = nil } })) {
                Button("OK") { store.message = nil }
            } message: {
                Text(store.message ?? "")
            }
        }
    }

    private var journeyCard: some View {
        let owned = store.owns(product: Catalog.journeyID) || store.ownsEverything
        return VStack(spacing: 10) {
            Text("BEST VALUE")
                .font(.system(size: 11, weight: .semibold, design: .serif))
                .tracking(2)
                .foregroundColor(Ink.paper)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Capsule().fill(Ink.gold))
            Text("The Complete Journey")
                .font(.system(size: 22, design: .serif))
                .foregroundColor(Ink.text)
            Text("All three acts · Chapters 4–18")
                .font(.system(size: 14, design: .serif))
                .foregroundColor(Ink.soft)
            buyButton(Catalog.journeyID, owned: owned)
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 22, style: .continuous).fill(Color.white.opacity(0.7)))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Ink.gold.opacity(0.6), lineWidth: 1.5))
    }

    private func actCard(_ act: ActInfo) -> some View {
        let owned = store.owns(product: act.productID!)
        return VStack(alignment: .leading, spacing: 8) {
            Text(act.title.uppercased())
                .font(.system(size: 12, weight: .semibold, design: .serif))
                .tracking(2)
                .foregroundColor(Ink.accent)
            Text(act.subtitle)
                .font(.system(size: 19, design: .serif))
                .foregroundColor(Ink.text)
            ForEach(Array(act.chapters), id: \.self) { n in
                Text("\(Catalog.roman(n)) · \(Catalog.chapter(n).title)")
                    .font(.system(size: 14, design: .serif))
                    .foregroundColor(Ink.soft)
            }
            buyButton(act.productID!, owned: owned)
                .frame(maxWidth: .infinity)
                .padding(.top, 4)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 20, style: .continuous).fill(Color.white.opacity(0.55)))
    }

    @ViewBuilder private func buyButton(_ id: String, owned: Bool) -> some View {
        if owned {
            Label("Unlocked", systemImage: "checkmark.circle.fill")
                .font(.system(size: 15, weight: .semibold, design: .serif))
                .foregroundColor(Ink.gold)
                .frame(height: 44)
        } else {
            Button {
                Task { await store.purchase(id) }
            } label: {
                Text(store.price(id).map { "Unlock for \($0)" } ?? "Unlock")
                    .font(.system(size: 16, weight: .semibold, design: .serif))
                    .foregroundColor(Ink.paper)
                    .frame(width: 230, height: 44)
                    .background(Capsule().fill(Ink.accent.opacity(0.9)))
            }
            .disabled(store.busy)
        }
    }
}
