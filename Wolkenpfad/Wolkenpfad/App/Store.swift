import Foundation
import StoreKit

/// In-App-Käufe mit StoreKit 2: drei Akte einzeln oder die ganze Reise auf einmal.
/// Käufe sind einmalig (non-consumable) und über die Familienfreigabe teilbar.
@MainActor
final class Store: ObservableObject {
    @Published private(set) var products: [String: Product] = [:]
    @Published private(set) var owned: Set<String>
    @Published private(set) var busy = false
    @Published var message: String?

    private let cacheKey = "wolkenpfad.purchases"
    private var updates: Task<Void, Never>?

    init() {
        // Zwischenspeicher, damit gekaufte Kapitel auch ohne Netz sofort offen sind;
        // beim Start wird er mit den echten Berechtigungen abgeglichen.
        owned = Set(UserDefaults.standard.stringArray(forKey: cacheKey) ?? [])
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                await self?.handle(result)
            }
        }
        Task {
            await loadProducts()
            await refreshEntitlements()
        }
    }

    deinit { updates?.cancel() }

    /// Ist das Kapitel gekauft (oder kostenlos)?
    func owns(chapter n: Int) -> Bool {
        guard let pid = Catalog.act(of: n).productID else { return true }
        return owned.contains(pid) || owned.contains(Catalog.journeyID)
    }

    func owns(product id: String) -> Bool {
        owned.contains(id) || (id != Catalog.journeyID && owned.contains(Catalog.journeyID))
    }

    var ownsEverything: Bool { Catalog.acts.allSatisfy { $0.productID == nil || owns(product: $0.productID!) } }

    func price(_ id: String) -> String? { products[id]?.displayPrice }

    func loadProducts() async {
        do {
            let list = try await Product.products(for: Catalog.productIDs)
            products = Dictionary(uniqueKeysWithValues: list.map { ($0.id, $0) })
        } catch {
            message = "The App Store can’t be reached right now. Please try again later."
        }
    }

    func refreshEntitlements() async {
        var current = Set<String>()
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result, t.revocationDate == nil { current.insert(t.productID) }
        }
        owned = current
        save()
    }

    func purchase(_ id: String) async {
        if products[id] == nil { await loadProducts() }
        guard let product = products[id] else {
            message = "This item isn’t available right now. Please try again later."
            return
        }
        busy = true
        defer { busy = false }
        do {
            switch try await product.purchase() {
            case .success(let verification):
                guard case .verified(let t) = verification else {
                    message = "The purchase couldn’t be verified."
                    return
                }
                owned.insert(t.productID)
                save()
                await t.finish()
                message = "Thank you! The new chapters are waiting for you."
            case .pending:
                message = "Your purchase is waiting for approval."
            case .userCancelled:
                break
            @unknown default:
                break
            }
        } catch {
            message = "The purchase didn’t go through. Please try again."
        }
    }

    func restore() async {
        busy = true
        defer { busy = false }
        try? await AppStore.sync()
        await refreshEntitlements()
        message = owned.isEmpty ? "No previous purchases were found." : "Your purchases have been restored."
    }

    private func handle(_ result: VerificationResult<Transaction>) async {
        guard case .verified(let t) = result else { return }
        if t.revocationDate == nil { owned.insert(t.productID) } else { owned.remove(t.productID) }
        save()
        await t.finish()
    }

    private func save() { UserDefaults.standard.set(Array(owned), forKey: cacheKey) }
}
