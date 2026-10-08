// GameView.swift – zeigt das Spiel (HTML/JavaScript im Ordner "web") in einer WebView an
import SwiftUI
import WebKit
import UniformTypeIdentifiers
import AVFoundation
import Photos

struct GameView: UIViewRepresentable {
    func makeCoordinator() -> AudioKeeper { AudioKeeper() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(LocalFileSchemeHandler(), forURLScheme: "neko")
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = .default() // Spielstand (localStorage) bleibt erhalten

        // Dem Spiel mitteilen, dass es als App läuft (blendet z. B. „Beenden“ aus).
        // Am Mac (Mac Catalyst) zusätzlich NEKO_MAC: Tastatur statt Touch-Knöpfe.
        #if targetEnvironment(macCatalyst)
        let flagJS = "window.NEKO_IOS = true; window.NEKO_MAC = true;"
        #else
        let flagJS = "window.NEKO_IOS = true;"
        #endif
        let flag = WKUserScript(source: flagJS, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        config.userContentController.addUserScript(flag)

        // Fotos aus dem Spiel in die Fotos-App speichern
        let saver = PhotoSaver()
        config.userContentController.add(saver, name: "nekoPhoto")

        // In-App-Kauf „Vollversion: Kapitel 4–8“
        let store = StoreBridge()
        config.userContentController.add(store, name: "nekoStore")

        let webView = WKWebView(frame: .zero, configuration: config)
        saver.webView = webView
        store.webView = webView
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.62, green: 0.82, blue: 0.92, alpha: 1)
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        // Kein Hineinzoomen (z. B. beim Antippen der Sprachauswahl)
        webView.scrollView.minimumZoomScale = 1
        webView.scrollView.maximumZoomScale = 1
        webView.scrollView.delegate = context.coordinator
        webView.allowsLinkPreview = false
        if #available(iOS 16.4, *) { webView.isInspectable = true } // Debuggen über Safari → Entwickler

        webView.load(URLRequest(url: URL(string: "neko://app/index.html")!))
        context.coordinator.webView = webView
        #if targetEnvironment(macCatalyst)
        // Tastatur sofort ans Spiel geben, ohne dass man erst ins Fenster klicken muss
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { webView.becomeFirstResponder() }
        #endif
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

/// Hält den Ton am Laufen: nach Anrufen, Siri, Wecker oder wenn die App wieder in den Vordergrund kommt,
/// wird die Audio-Sitzung reaktiviert und das Spiel angewiesen, seinen Ton wieder aufzuwecken.
final class AudioKeeper: NSObject, UIScrollViewDelegate {
    // Zoom sperren: nichts zum Zoomen anbieten und eine eventuelle Vergrößerung sofort zurücknehmen
    func viewForZooming(in scrollView: UIScrollView) -> UIView? { nil }
    func scrollViewDidZoom(_ scrollView: UIScrollView) { if scrollView.zoomScale != 1 { scrollView.setZoomScale(1, animated: false) } }

    weak var webView: WKWebView?
    private var tokens: [NSObjectProtocol] = []

    override init() {
        super.init()
        let nc = NotificationCenter.default
        tokens.append(nc.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] note in
            guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  AVAudioSession.InterruptionType(rawValue: raw) == .ended else { return }
            self?.revive(after: 0.3)
        })
        tokens.append(nc.addObserver(forName: AVAudioSession.mediaServicesWereResetNotification, object: nil, queue: .main) { [weak self] _ in
            self?.revive(after: 0.5, rebuild: true)
        })
        // App geht in den Hintergrund oder wird geschlossen → Ton sofort anhalten
        #if !targetEnvironment(macCatalyst)
        // Am Mac läuft die Musik weiter, wenn ein anderes Programm vorne ist (wie bei jeder Mac-App);
        // angehalten wird erst, wenn das Fenster minimiert oder ausgeblendet wird (didEnterBackground).
        tokens.append(nc.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: .main) { [weak self] _ in
            self?.silence(deactivate: false)
        })
        #endif
        tokens.append(nc.addObserver(forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main) { [weak self] _ in
            self?.silence(deactivate: true)
        })
        tokens.append(nc.addObserver(forName: UIApplication.willTerminateNotification, object: nil, queue: .main) { [weak self] _ in
            self?.silence(deactivate: true)
        })
        tokens.append(nc.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in
            self?.revive(after: 0.2)
        })
        tokens.append(nc.addObserver(forName: UIApplication.willEnterForegroundNotification, object: nil, queue: .main) { [weak self] _ in
            self?.revive(after: 0.2)
        })
    }

    deinit { tokens.forEach { NotificationCenter.default.removeObserver($0) } }

    func silence(deactivate: Bool) {
        webView?.evaluateJavaScript("window.Sound && Sound.sleep && Sound.sleep()", completionHandler: nil)
        if deactivate { AudioSessionControl.deactivate() }
    }

    func revive(after delay: Double, rebuild: Bool = false) {
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            guard UIApplication.shared.applicationState == .active else { return } // nicht im Hintergrund wieder anschalten
            // Nach einem Neustart der Mediendienste ist die Sitzung zurückgesetzt → Kategorie neu setzen
            AudioSessionControl.activate(configure: rebuild) {
                let js = rebuild ? "window.Sound && Sound.rebuild && Sound.rebuild()" : "window.Sound && Sound.wake && Sound.wake()"
                self?.webView?.evaluateJavaScript(js, completionHandler: nil)
            }
        }
    }
}

/// Alle Aufrufe an AVAudioSession laufen auf einer eigenen Hintergrund-Warteschlange –
/// auf dem Haupt-Thread können sie die Oberfläche kurz blockieren („AVAudioSession Hang Risk“).
/// Die Kategorie wird nur gesetzt, solange die Sitzung nicht aktiv ist (beim Start und nach einem Reset).
/// Am Mac (Mac Catalyst) braucht WebKit keine Audio-Sitzung – dort passiert nichts.
enum AudioSessionControl {
    private static let queue = DispatchQueue(label: "nekonomachi.audiosession", qos: .userInitiated)

    /// Beim App-Start: Kategorie „Wiedergabe, mit anderen Apps mischen“ setzen und aktivieren
    static func start() { activate(configure: true, then: nil) }

    static func activate(configure: Bool = false, then done: (() -> Void)?) {
        #if targetEnvironment(macCatalyst)
        if let done { DispatchQueue.main.async(execute: done) }
        #else
        queue.async {
            let session = AVAudioSession.sharedInstance()
            if configure { try? session.setCategory(.playback, mode: .default, options: [.mixWithOthers]) }
            try? session.setActive(true)
            if let done { DispatchQueue.main.async(execute: done) }
        }
        #endif
    }

    static func deactivate() {
        #if !targetEnvironment(macCatalyst)
        queue.async {
            try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
        }
        #endif
    }
}

/// Nimmt das Foto aus dem Spiel entgegen (JPEG als data-URL) und legt es in der Fotos-App ab.
/// Braucht nur die Berechtigung „Fotos hinzufügen“ (NSPhotoLibraryAddUsageDescription).
final class PhotoSaver: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let dataURL = body["data"] as? String,
              let comma = dataURL.firstIndex(of: ","),
              let data = Data(base64Encoded: String(dataURL[dataURL.index(after: comma)...])),
              let image = UIImage(data: data) else { report(false); return }
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { [weak self] status in
            guard status == .authorized || status == .limited else { self?.report(false); return }
            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }) { ok, _ in self?.report(ok) }
        }
    }

    private func report(_ ok: Bool) {
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript("window.nekoPhotoResult && nekoPhotoResult(\(ok ? "true" : "false"))", completionHandler: nil)
        }
    }
}

/// Liefert die Spieldateien aus dem App-Bundle unter neko://app/… aus.
/// So hat das Spiel eine feste Herkunft und der Spielstand wird zuverlässig gespeichert.
final class LocalFileSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root = Bundle.main.resourceURL!.appendingPathComponent("web", isDirectory: true)

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL

        guard file.path.hasPrefix(root.standardizedFileURL.path),
              let data = try? Data(contentsOf: file) else {
            task.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        let headers = ["Content-Type": mime, "Content-Length": String(data.count), "Cache-Control": "no-cache"]
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}
