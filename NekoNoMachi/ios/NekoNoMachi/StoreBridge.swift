// StoreBridge.swift – In-App-Käufe (StoreKit 2):
//   „full“  = Vollversion: Kapitel 4–8
//   „icons“ = Erweiterung „Die Ikonen Japans“: Kapitel 9–16
//
// Das Spiel (JavaScript) schickt über window.webkit.messageHandlers.nekoStore Befehle:
//   { action: "load" }                  → Preise laden und Besitz prüfen
//   { action: "buy", pack: "icons" }    → Kauf eines Pakets starten
//   { action: "restore" }               → Käufe wiederherstellen (AppStore.sync)
// Antworten gehen an window.nekoStore({ owned: {full, icons}, prices: {full, icons}, status, pack?, detail? }).
//
// Produkte in App Store Connect anlegen: Typ „Nicht verbrauchbar“, Produkt-IDs wie unten.
import StoreKit
import WebKit

@MainActor
final class StoreBridge: NSObject, WKScriptMessageHandler {
    /// Paket → Produkt-ID – muss exakt mit App Store Connect, NekoNoMachi.storekit und store.js übereinstimmen
    static let products: [String: String] = [
        "full": "app.nekonomachi.fullversion",
    ]

    /// Optional: Wer die App vor Einführung des Kaufs geladen hat, behält Kapitel 4–8 kostenlos.
    /// Dazu hier die erste Build-Nummer (CFBundleVersion) MIT Kauf eintragen, z. B. 19.
    /// nil = aus. Achtung: In Xcode/TestFlight meldet Apple als Originalversion immer „1.0“ –
    /// zum Testen des Kaufs also auf nil lassen. Gilt nur für die Vollversion.
    static let grandfatherBelowBuild: Int? = nil

    weak var webView: WKWebView?
    private var catalog: [String: Product] = [:]      // Paket → Produkt
    private var owned: [String: Bool] = [:]           // Paket → gekauft
    private var busy = false                          // läuft gerade ein Kauf oder eine Wiederherstellung?
    private var updates: Task<Void, Never>?

    override init() {
        super.init()
        // Käufe, die außerhalb des Kauf-Dialogs abgeschlossen werden: „Kaufen fragen“, Familienfreigabe,
        // ein Kauf auf einem anderen Gerät, Erstattungen – und Käufe, die beim letzten Mal nicht fertig wurden.
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                await self?.handle(result, status: "updated")
            }
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let body = message.body as? [String: Any]
        let action = body?["action"] as? String ?? "load"
        let pack = body?["pack"] as? String ?? "full"
        Task { [weak self] in
            guard let self else { return }
            switch action {
            case "buy": await self.buy(pack: pack)
            case "restore": await self.restore()
            default: await self.load()
            }
        }
    }

    private static func pack(for productID: String) -> String? {
        products.first(where: { $0.value == productID })?.key
    }

    // MARK: - Aktionen

    private func load() async {
        if busy { send(status: "busy"); return }
        // Beim letzten Mal abgebrochene Käufe (App beendet, Netz weg) jetzt abschließen
        for await result in Transaction.unfinished { await handle(result, status: nil) }
        let detail = await fetchProducts()
        await refresh(status: catalog.isEmpty ? "unavailable" : "ready", detail: detail)
    }

    private func buy(pack: String) async {
        if busy { send(status: "busy", pack: pack); return }
        busy = true
        send(status: "busy", pack: pack)
        defer { busy = false }

        let detail = await fetchProducts()
        guard let product = catalog[pack] else { await refresh(status: "unavailable", detail: detail ?? "Paket \(pack) nicht gefunden", pack: pack); return }
        do {
            let result: Product.PurchaseResult
            // Den Kauf-Dialog ausdrücklich im Fenster des Spiels zeigen – ohne diese Angabe
            // erscheint er auf dem iPad (mehrere Fenster) und am Mac nicht immer.
            if #available(iOS 17.0, macCatalyst 17.0, *), let scene = webView?.window?.windowScene {
                result = try await product.purchase(confirmIn: scene)
            } else {
                result = try await product.purchase()
            }
            switch result {
            case .success(let verification):
                await handle(verification, status: "purchased")
            case .pending:
                send(status: "pending", pack: pack)    // z. B. „Kaufen fragen“ – kommt später über Transaction.updates
            case .userCancelled:
                send(status: "cancelled", pack: pack)
            @unknown default:
                send(status: "cancelled", pack: pack)
            }
        } catch {
            send(status: "failed", detail: Self.describe(error), pack: pack)
        }
    }

    private func restore() async {
        if busy { send(status: "busy"); return }
        busy = true
        send(status: "busy")
        defer { busy = false }
        var detail: String?
        do { try await AppStore.sync() } catch { detail = Self.describe(error) } // abgebrochen oder offline – Besitz trotzdem prüfen
        _ = await fetchProducts()
        await refresh(status: "restored", detail: detail)
    }

    // MARK: - Transaktionen

    /// Eine geprüfte Transaktion schaltet ihr Paket sofort frei (oder sperrt bei Erstattung).
    /// Wichtig: nicht nur auf Transaction.currentEntitlements verlassen – direkt nach dem Kauf
    /// taucht der Kauf dort manchmal erst mit Verzögerung auf.
    private func handle(_ result: VerificationResult<Transaction>, status: String?) async {
        switch result {
        case .verified(let tx):
            let pack = Self.pack(for: tx.productID)
            if let pack { owned[pack] = (tx.revocationDate == nil) }
            await tx.finish()
            if let status { send(status: status, pack: pack) }
        case .unverified(let tx, let error):
            // Signatur nicht prüfbar (z. B. manipuliert) → nicht freischalten, aber abschließen
            await tx.finish()
            if status != nil { send(status: "failed", detail: "unverified: \(error)", pack: Self.pack(for: tx.productID)) }
        }
    }

    private func fetchProducts() async -> String? {
        let missing = Self.products.filter { catalog[$0.key] == nil }
        if missing.isEmpty { return nil }
        do {
            let found = try await Product.products(for: Array(missing.values))
            for p in found { if let pack = Self.pack(for: p.id) { catalog[pack] = p } }
            let still = Self.products.filter { catalog[$0.key] == nil }.map(\.value)
            return still.isEmpty ? nil : "Produkt nicht gefunden: " + still.joined(separator: ", ")
        } catch {
            return Self.describe(error)
        }
    }

    // MARK: - Besitz prüfen und ans Spiel melden

    private func refresh(status: String, detail: String? = nil, pack: String? = nil) async {
        var has: [String: Bool] = [:]
        for await result in Transaction.currentEntitlements {
            if case .verified(let tx) = result, tx.revocationDate == nil, let p = Self.pack(for: tx.productID) { has[p] = true }
        }
        if has["full"] != true, let limit = Self.grandfatherBelowBuild,
           case .verified(let app)? = try? await AppTransaction.shared,
           let first = Int(app.originalAppVersion.split(separator: ".").first ?? ""), first < limit {
            has["full"] = true
        }
        // Ein gerade eben geprüfter Kauf bleibt gültig, auch wenn die Liste ihn noch nicht kennt
        for key in Self.products.keys { owned[key] = (has[key] ?? false) || (owned[key] ?? false) }
        send(status: status, detail: detail, pack: pack)
    }

    private func send(status: String, detail: String? = nil, pack: String? = nil) {
        var ownedOut: [String: Bool] = [:]
        for key in Self.products.keys { ownedOut[key] = owned[key] ?? false }
        var prices: [String: String] = [:]
        for (key, p) in catalog { prices[key] = p.displayPrice }
        var info: [String: Any] = ["owned": ownedOut, "prices": prices, "status": status]
        if let pack { info["pack"] = pack }
        if let detail { info["detail"] = detail }
        guard let data = try? JSONSerialization.data(withJSONObject: info),
              let json = String(data: data, encoding: .utf8) else { return }
        webView?.evaluateJavaScript("window.nekoStore && nekoStore(\(json))", completionHandler: nil)
    }

    private static func describe(_ error: Error) -> String {
        if let e = error as? StoreKitError {
            switch e {
            case .networkError: return "network"
            case .userCancelled: return "cancelled"
            case .notAvailableInStorefront: return "storefront"
            case .notEntitled: return "notEntitled"
            default: return "storekit: \(e)"
            }
        }
        if let e = error as? Product.PurchaseError { return "purchase: \(e)" }
        return "\(error)"
    }
}
