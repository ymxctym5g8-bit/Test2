import Foundation
import StoreKit

/// In-App-Kauf mit StoreKit 2: ein einmaliger Kauf (non-consumable) schaltet alle Kapitel
/// nach dem Prolog frei. Über die Familienfreigabe teilbar.
@MainActor
final class Store: ObservableObject {
    @Published private(set) var product: Product?
    @Published private(set) var unlocked: Bool
    @Published private(set) var busy = false
    @Published var message: String?

    private let cacheKey = "echoes.fullJourney"
    private var updates: Task<Void, Never>?

    init() {
        // Zwischenspeicher, damit die Kapitel auch ohne Netz sofort offen sind;
        // beim Start wird er mit den echten Berechtigungen abgeglichen.
        unlocked = UserDefaults.standard.bool(forKey: cacheKey)
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                await self?.handle(result)
            }
        }
        Task {
            await loadProduct()
            await refreshEntitlements()
        }
    }

    deinit { updates?.cancel() }

    /// Ist das Kapitel spielbar (kostenlos oder gekauft)?
    func owns(chapter n: Int) -> Bool { Catalog.act(of: n).free || unlocked }

    /// Lokalisierter Preis, sobald das Produkt geladen ist.
    var price: String? { product?.displayPrice }

    func loadProduct() async {
        do {
            product = try await Product.products(for: Catalog.productIDs).first
        } catch {
            message = "The App Store can’t be reached right now. Please try again later."
        }
    }

    func refreshEntitlements() async {
        var owned = false
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result, t.productID == Catalog.fullJourneyID, t.revocationDate == nil { owned = true }
        }
        setUnlocked(owned)
    }

    func purchase() async {
        if product == nil { await loadProduct() }
        guard let product else {
            message = "The journey isn’t available right now. Please try again later."
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
                setUnlocked(true)
                await t.finish()
                message = "Thank you! Every chapter of the journey is now open."
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
        message = unlocked ? "Your purchase has been restored." : "No previous purchase was found."
    }

    private func handle(_ result: VerificationResult<Transaction>) async {
        guard case .verified(let t) = result else { return }
        if t.productID == Catalog.fullJourneyID { setUnlocked(t.revocationDate == nil) }
        await t.finish()
    }

    private func setUnlocked(_ value: Bool) {
        unlocked = value
        UserDefaults.standard.set(value, forKey: cacheKey)
    }
}
