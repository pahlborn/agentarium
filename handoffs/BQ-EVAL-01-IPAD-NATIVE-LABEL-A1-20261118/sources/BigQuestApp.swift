import SwiftUI
import WebKit

@main
@MainActor
struct BigQuestApp: App {
    var body: some Scene {
        WindowGroup { BigQuestScreen() }
    }
}

@MainActor
private final class BrowserPage: NSObject, ObservableObject, WKScriptMessageHandlerWithReply {
    private var busy = false
    private var catalog: [StandardCatalogEntry]?
    var toddleOpener: (@MainActor () async -> Bool)?
    private let url: URL
    private let persistent: Bool

    init(url: URL, persistent: Bool) {
        self.url = url
        self.persistent = persistent
        super.init()
    }

    lazy var view: WKWebView = {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = persistent ? .default() : .nonPersistent()
        if url.host == "big-quest-test.github.io" {
            configuration.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "bigQuestEvaluation")
            configuration.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "bigQuestDeviceConnection")
        }
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.load(URLRequest(url: url))
        return webView
    }()
    var isEvaluationPage: Bool { BigQuestBridgePolicy.scope(active: view.url) != nil }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard message.webView === view,
              let scope = BigQuestBridgePolicy.scope(active: view.url, frame: message.frameInfo.request.url,
                mainFrame: message.frameInfo.isMainFrame, originProtocol: message.frameInfo.securityOrigin.protocol,
                originHost: message.frameInfo.securityOrigin.host, originPort: message.frameInfo.securityOrigin.port) else {
            replyHandler(nil, KeychainText.text("Ungültiger App-Aufruf.", "Invalid app request.")); return
        }
        if message.name == "bigQuestDeviceConnection" {
            guard let body = message.body as? [String: Any], let action = body["action"] as? String else {
                replyHandler(nil, KeychainText.text("Ungültiger Geräteaufruf.", "Invalid device request.")); return
            }
            switch action {
            case "read":
                let (status, code) = DeviceAccessKey.read(scope: scope)
                if status == errSecItemNotFound { replyHandler(["status": "missing"], nil) }
                else if status == errSecSuccess, let code { replyHandler(["status": "ok", "code": code], nil) }
                else { replyHandler(["status": "error"], nil) }
            case "remember", "forget":
                guard let code = body["code"] as? String, DeviceAccessKey.valid(code) else {
                    replyHandler(nil, KeychainText.text("Ungültiger Geräteaufruf.", "Invalid device request.")); return
                }
                let ok = action == "remember" ? DeviceAccessKey.save(code, scope: scope) : DeviceAccessKey.forget(code, scope: scope)
                replyHandler(["status": ok ? "ok" : "error"], nil)
            default:
                replyHandler(nil, KeychainText.text("Ungültiger Geräteaufruf.", "Invalid device request."))
            }
            return
        }
        guard message.name == "bigQuestEvaluation", let body = message.body as? [String: Any] else {
            replyHandler(nil, KeychainText.text("Ungültiger Formularaufruf.", "Invalid form request.")); return
        }
        if let action = body["action"] as? String {
            switch action {
            case "catalog":
                // The approved catalog is supplied by the web module; native validates, bounds and holds it for the next source request only.
                guard body.count == 2, let parsed = StandardCatalog.parse(body["catalog"]) else {
                    catalog = nil
                    replyHandler(nil, KeychainText.text("Ungültiger Katalog.", "Invalid catalog.")); return
                }
                catalog = parsed
                replyHandler("ok", nil)
            case "toddle":
                guard body.count == 1, !busy, let opener = toddleOpener else {
                    replyHandler(nil, KeychainText.text("Ungültiger Formularaufruf.", "Invalid form request.")); return
                }
                Task {
                    if await opener() { replyHandler("opened", nil) }
                    else { replyHandler(nil, KeychainText.text("Bitte zuerst ein neues, noch leeres Formular im Bereich Schulische Einstufungen öffnen.", "Open a new form in the school assessments section first.")) }
                }
            default:
                replyHandler(nil, KeychainText.text("Ungültiger Formularaufruf.", "Invalid form request."))
            }
            return
        }
        guard !busy, body.count == 1, let source = body["source"] as? String, !source.isEmpty, source.utf8.count <= 48000,
              let approved = catalog else {
            replyHandler(nil, KeychainText.text("Ungültiger Formularaufruf.", "Invalid form request.")); return
        }
        catalog = nil
        busy = true
        Task {
            defer { busy = false }
            do {
                let result = try await ClaudeClient.extractEvaluation(source: source, key: ClaudeKey.read(), catalog: approved)
                replyHandler(try JSONSerialization.jsonObject(with: JSONEncoder().encode(result)), nil)
            } catch { replyHandler(nil, error.localizedDescription) }
        }
    }

}

private struct BrowserPane: UIViewRepresentable {
    let view: WKWebView

    func makeUIView(context: Context) -> WKWebView { view }
    func updateUIView(_ view: WKWebView, context: Context) {}
}

@MainActor
private struct BigQuestScreen: View {
    @StateObject private var bigQuest = BrowserPage(
        url: URL(string: "https://big-quest-test.github.io/")!, persistent: true
    )
    @StateObject private var toddle = BrowserPage(
        url: URL(string: "https://web.toddleapp.com/")!, persistent: false
    )
    @State private var showToddle = false
    @State private var showKey = false
    @State private var evaluationContext: String?
    @State private var error: String?
    @State private var startup: ClaudeKey.Diagnostics?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if let startup {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(KeychainText.text("Schlüsselbund beim Start", "Keychain at startup")).font(.caption.bold())
                        KeychainDiagnosticsView(diagnostics: startup)
                    }
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                BrowserPane(view: bigQuest.view)
            }
                .navigationTitle("Big Quest")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button(KeychainText.text("Claude-Schlüssel", "Claude key")) { showKey = true }
                    }
                }
        }
        .onAppear {
            if startup == nil { startup = ClaudeKey.startupDiagnostics() }
            bigQuest.toddleOpener = { await openToddle() }
        }
        .alert("Evaluation", isPresented: Binding(get: { error != nil }, set: { if !$0 { error = nil } })) { Button("OK") { error = nil } } message: { Text(error ?? "") }
        .sheet(isPresented: $showKey) { ClaudeKeyScreen() }
        .sheet(isPresented: $showToddle) {
            ToddleFieldScreen(page: toddle) { source in
                guard bigQuest.isEvaluationPage, showToddle, let context = evaluationContext else { throw NSError(domain:"BigQuest",code:1,userInfo:[NSLocalizedDescriptionKey:KeychainText.text("Kindzuordnung fehlt.", "The child assignment is missing.")]) }
                let result = try await bigQuest.view.callAsyncJavaScript("return window.bigQuestEvaluationForm?.source(context, transfer, source)", arguments:["context":context,"transfer":UUID().uuidString.lowercased(),"source":source], in:nil, contentWorld:.page) as? String
                guard result == "opened" || result == "saved" else { throw NSError(domain:"BigQuest",code:2,userInfo:[NSLocalizedDescriptionKey:KeychainText.text("Das Formular wurde gewechselt oder ist nicht mehr offen. Bitte in Big Quest erneut „Aus Toddle“ wählen.", "The form changed or is no longer open. Choose “From Toddle” in Big Quest again.")]) }
                showToddle = false
            }
        }
    }

    private func openToddle() async -> Bool {
        let value = try? await bigQuest.view.callAsyncJavaScript("return window.bigQuestEvaluationForm?.context()", arguments: [:], in: nil, contentWorld: .page)
        guard bigQuest.isEvaluationPage, !showToddle, let context = value as? String else { return false }
        evaluationContext = context
        showToddle = true
        return true
    }
}


private struct KeychainDiagnosticsView: View {
    let diagnostics: ClaudeKey.Diagnostics

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(KeychainText.text("Lesen: ", "Read: ") + KeychainText.status(diagnostics.readCode))
            Text("Access Group: " + diagnostics.groupDescription())
        }
        .font(.caption.monospaced())
        .textSelection(.enabled)
    }
}

private struct ClaudeKeyScreen: View {
    @Environment(\.dismiss) private var dismiss
    @State private var key = ""
    @State private var error: String?
    @State private var result: ClaudeKey.SaveResult?

    var body: some View {
        NavigationStack {
            Form {
                SecureField(KeychainText.text("Anthropic-API-Schlüssel", "Anthropic API key"), text: $key)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                Text(KeychainText.text("Der Schlüssel wird nur auf diesem iPad im Schlüsselbund gespeichert.", "The key is stored only in this iPad’s keychain."))
                if let error { Text(error).foregroundStyle(.red) }
                if let result {
                    Text(KeychainText.text("Speichern: ", "Save: ") + KeychainText.status(result.saveCode))
                        .font(.caption.monospaced())
                    KeychainDiagnosticsView(diagnostics: result.diagnostics)
                    Text(result.verified
                         ? KeychainText.text("Gespeichert und durch Zurücklesen bestätigt.", "Saved and verified by reading back.")
                         : KeychainText.text("Speichern nicht bestätigt. Bitte die Codes prüfen.", "Save was not verified. Check the codes."))
                        .foregroundStyle(result.verified ? .green : .red)
                }
                Button(KeychainText.text("Im Schlüsselbund speichern", "Save to keychain")) {
                    error = nil
                    result = nil
                    defer { key = "" }
                    do {
                        result = try ClaudeKey.save(key.trimmingCharacters(in: .whitespacesAndNewlines))
                    } catch {
                        self.error = error.localizedDescription
                    }
                }
                .disabled(key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .navigationTitle(KeychainText.text("Claude-Zugriff", "Claude access"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(KeychainText.text("Fertig", "Done")) { dismiss() }
                }
            }
        }
    }
}

@MainActor
private struct ToddleFieldScreen: View {
    @Environment(\.dismiss) private var dismiss
    let page: BrowserPage
    let onCapture: (String) async throws -> Void
    @State private var error: String?
    @State private var reading = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                BrowserPane(view: page.view).frame(maxHeight: .infinity)
                VStack(alignment: .leading, spacing: 12) {
                    Text(KeychainText.text("Öffne die Evaluation in Toddle. Die erfassten Inhalte werden im Formular angezeigt.", "Open the evaluation in Toddle. The captured content appears in the form."))
                    Button(reading ? KeychainText.text("Wird gelesen …", "Reading …") : KeychainText.text("Evaluation ins Formular übernehmen", "Bring the evaluation into the form")) {
                        Task {
                            reading = true
                            error = nil
                            defer { reading = false }
                            do {
                                let source = try await ToddleField.readSource(from: page.view)
                                try await onCapture(source)
                            }
                            catch { self.error = error.localizedDescription }
                        }
                    }.disabled(reading)
                    if let error { Text(error).foregroundStyle(.red) }
                }.padding()
            }
            .navigationTitle("Toddle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(KeychainText.text("Fertig", "Done")) { dismiss() } }
                ToolbarItem(placement: .navigationBarTrailing) { Button(KeychainText.text("Zurück", "Back")) { page.view.goBack() } }
            }

        }
    }
}
