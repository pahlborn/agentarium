// Temporary input from pahlborn/bis-school-app_src at42b65c1be409f6abffd375592891e2bc593f460d
// Original tests/ios-keychain-diagnostics.swift fullAppChecks address checks only; metadata lines are not source code.
    private static func fullAppChecks() throws {
        let host = "https://big-quest-test.github.io", scope = "probe-evaluation-form"
        func policy(_ active: String, _ frame: String, main: Bool = true, proto: String = "https", originHost: String = "big-quest-test.github.io", port: Int = 0) -> String? {
            BigQuestBridgePolicy.scope(active: URL(string: active), frame: URL(string: frame), mainFrame: main,
                                       originProtocol: proto, originHost: originHost, originPort: port)
        }
        let root = host + "/"
        precondition(BigQuestBridgePolicy.scope(active: URL(string: root)) == scope)
        precondition(policy(root, root) == scope && policy(root, root, port: 443) == scope)
        precondition(policy(host + "/index.html", host + "/index.html") == scope)
        precondition(policy(host + "/probe-evaluation-form/", host + "/probe-evaluation-form/") == scope, "accepted probe stays")
        precondition(policy(root, root, main: false) == nil && policy(root, root, proto: "http") == nil)
        precondition(policy(root, root, originHost: "example.invalid") == nil && policy(root, root, port: 8443) == nil)
        for unsafe in ["https://example.invalid/", host + "/other/", host + "/?next=1", host + "/#fragment", host + "/index.html/x", host + "//",
                       "https://big-quest-test.github.io:8443/", "http://big-quest-test.github.io/", "file:///index.html",
                       "https://user@big-quest-test.github.io/", "https://web.toddleapp.com/"] {
            precondition(BigQuestBridgePolicy.scope(active: URL(string: unsafe)) == nil, unsafe)
            precondition(policy(root, unsafe) == nil, unsafe)
            precondition(policy(unsafe, root) == nil, unsafe)
        }

