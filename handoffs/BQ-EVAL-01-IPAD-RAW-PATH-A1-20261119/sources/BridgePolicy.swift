// Temporary input from pahlborn/bis-school-app_src at42b65c1be409f6abffd375592891e2bc593f460d
// Original ios/BigQuestMVP/ClaudeClient.swift lines148-171; metadata lines are not source code.
enum BigQuestBridgePolicy {
    private static func pageScope(_ address: URL?) -> String? {
        guard let address, address.scheme == "https", address.host == "big-quest-test.github.io",
              address.port == nil || address.port == 443,
              address.user == nil, address.password == nil else { return nil }
        // The complete app root reuses the device-credential scope of the first full-app probe
        // (same origin, same stored device access). Exact root paths only, no query/fragment.
        if address.query == nil, address.fragment == nil, ["/", "/index.html"].contains(address.path) { return "probe-evaluation-form" }
        for scope in ["probe-evaluation-form", "probe-evaluation-local"] {
            if ["/" + scope, "/" + scope + "/", "/" + scope + "/index.html"].contains(address.path) { return scope }
        }
        return nil
    }

    static func scope(active: URL?) -> String? { pageScope(active) }

    static func scope(active: URL?, frame: URL?, mainFrame: Bool, originProtocol: String, originHost: String, originPort: Int) -> String? {
        guard mainFrame, originProtocol == "https", originHost == "big-quest-test.github.io",
              originPort == 0 || originPort == 443,
              let scope = pageScope(frame), scope == pageScope(active) else { return nil }
        return scope
    }
}

