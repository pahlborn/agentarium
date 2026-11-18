import Foundation
import Security

// Only synthetic values and injected Security operations. No Keychain or API calls.
@main struct KeychainDiagnosticsRegression {
    private static let fakeKey = "sk-ant-synthetic-test-value"
    private static let group = "EXAMPLE.de.bigquest.ipad"

    private final class Mock {
        var calls: [String] = []
        var updateCode = errSecSuccess
        var addCode = errSecSuccess
        var readCode = errSecSuccess
        var readKey: String? = KeychainDiagnosticsRegression.fakeKey
        var readGroup: String? = KeychainDiagnosticsRegression.group
        var probeCode = errSecSuccess
        var probeAccount: String?

        var store: ClaudeKey.Store {
            ClaudeKey.Store(update: { query, values in
                self.calls.append("update")
                precondition(query[kSecAttrAccount as String] as? String == "anthropic")
                precondition(values[kSecValueData as String] is Data)
                return self.updateCode
            }, add: { query in
                let account = query[kSecAttrAccount as String] as! String
                if account.hasPrefix("access-group-diagnostic-") {
                    self.calls.append("probe")
                    self.probeAccount = account
                    precondition(query[kSecValueData as String] as? Data == Data())
                    return (self.probeCode, self.probeCode == errSecSuccess ? [kSecAttrAccessGroup as String: KeychainDiagnosticsRegression.group] : nil)
                }
                self.calls.append("add")
                precondition(account == "anthropic")
                return (self.addCode, nil)
            }, copy: { query in
                self.calls.append("read")
                precondition(query[kSecAttrAccount as String] as? String == "anthropic")
                precondition(query[kSecReturnData as String] as? Bool == true)
                precondition(query[kSecReturnAttributes as String] as? Bool == true)
                var attributes: [String: Any] = [:]
                if let key = self.readKey { attributes[kSecValueData as String] = Data(key.utf8) }
                if let value = self.readGroup { attributes[kSecAttrAccessGroup as String] = value }
                return (self.readCode, self.readCode == errSecSuccess ? attributes : nil)
            }, delete: { query in
                self.calls.append("cleanup")
                precondition(query[kSecAttrAccount as String] as? String == self.probeAccount)
                precondition(query[kSecAttrAccount as String] as? String != "anthropic")
                precondition(query[kSecReturnAttributes as String] == nil)
                return errSecSuccess
            })
        }
    }

    private static func deviceAccessChecks() {
        let scope = "probe-evaluation-form", old = "synthetic-device-access", fresh = "synthetic-new-device-access"
        final class DeviceMock {
            var value: String?
            var writeStatus = errSecSuccess
            var readStatus = errSecSuccess
            var deletes = 0
            var calls = 0
            var store: ClaudeKey.Store {
                let check: ([String: Any]) -> Void = { query in
                    precondition(query[kSecAttrService as String] as? String == "de.bigquest.ipad.device-access")
                    precondition(query[kSecAttrAccount as String] as? String == "probe-evaluation-form")
                    self.calls += 1
                }
                return ClaudeKey.Store(update: { query, values in
                    check(query)
                    if self.value == nil { return errSecItemNotFound }
                    if self.writeStatus == errSecSuccess { self.value = String(data: values[kSecValueData as String] as! Data, encoding: .utf8) }
                    return self.writeStatus
                }, add: { query in
                    check(query)
                    precondition(query[kSecAttrAccessible as String] as? String == kSecAttrAccessibleWhenUnlockedThisDeviceOnly as String)
                    if self.writeStatus == errSecSuccess { self.value = String(data: query[kSecValueData as String] as! Data, encoding: .utf8) }
                    return (self.writeStatus, nil)
                }, copy: { query in
                    check(query)
                    if self.readStatus != errSecSuccess { return (self.readStatus, nil) }
                    guard let value = self.value else { return (errSecItemNotFound, nil) }
                    return (errSecSuccess, [kSecValueData as String: Data(value.utf8)])
                }, delete: { query in
                    check(query); self.deletes += 1; self.value = nil; return errSecSuccess
                })
            }
        }
        let store = DeviceMock()
        precondition(DeviceAccessKey.save(old, scope: scope, store: store.store))
        precondition(DeviceAccessKey.read(scope: scope, store: store.store).1 == old)
        precondition(DeviceAccessKey.save(fresh, scope: scope, store: store.store))
        precondition(DeviceAccessKey.forget(old, scope: scope, store: store.store))
        precondition(store.deletes == 0 && store.value == fresh, "Stale forget must preserve the fresh device access")
        precondition(DeviceAccessKey.forget(fresh, scope: scope, store: store.store))
        precondition(store.deletes == 1 && store.value == nil)
        let failed = DeviceMock()
        failed.writeStatus = errSecMissingEntitlement
        precondition(!DeviceAccessKey.save(old, scope: scope, store: failed.store))
        failed.value = old
        precondition(!DeviceAccessKey.save(old, scope: scope, store: failed.store), "An old matching value cannot hide a failed write")
        failed.readStatus = errSecInteractionNotAllowed
        precondition(!DeviceAccessKey.forget(old, scope: scope, store: failed.store))
        let provider = DeviceMock()
        precondition(!DeviceAccessKey.save("sk-ant-synthetic-only", scope: scope, store: provider.store))
        precondition(provider.calls == 0)

        let app = URL(string: "https://big-quest-test.github.io/probe-evaluation-form/")!
        func allowed(_ frame: URL? = nil, main: Bool = true, proto: String = "https", host: String = "big-quest-test.github.io", port: Int = 0) -> Bool {
            BigQuestBridgePolicy.scope(active: app, frame: frame ?? app, mainFrame: main, originProtocol: proto, originHost: host, originPort: port) == scope
        }
        precondition(allowed() && allowed(port: 443))
        precondition(!allowed(main: false) && !allowed(proto: "http") && !allowed(host: "example.invalid") && !allowed(port: 8443))
        for address in ["https://example.invalid/probe-evaluation-form/", "https://big-quest-test.github.io/other/", "https://big-quest-test.github.io/probe-evaluation-local/", "https://big-quest-test.github.io:8443/probe-evaluation-form/"] {
            precondition(!allowed(URL(string: address)))
        }
    }

    private static func evaluationFallbackChecks() throws {
        // Invented source and model outputs; no API and no school data.
        let criterion = "Invented: explain the solution in Part C with a diagram"
        func checked(_ evidence: String, proposed: String, source: String? = nil) throws -> ClaudeClient.Evaluation {
            let document = ClaudeClient.Evaluation(title: "Invented evaluation", date: "2026-11-18", goal: "", instructions: "", feedback: "",
                criteria: [.init(criterion: criterion, rating: proposed, evidence: evidence)], missing: [])
            let raw = String(data: try JSONEncoder().encode(document), encoding: .utf8)!
            return try ClaudeClient.validateEvaluation(raw: raw, source: source ?? evidence)
        }
        let original = criterion + " M"
        let terminal = try checked(original, proposed: "C"); precondition(terminal.criteria[0].rating == "M", "Part C must not override terminal M")
        let empty = try checked(criterion, proposed: "C"); precondition(empty.criteria[0].rating == "", "No terminal teacher rating stays empty")
        let internalCode = try checked(criterion + " M additional text", proposed: "M"); precondition(internalCode.criteria[0].rating == "", "A rating inside evidence is not terminal")
        for grade in ["RS", "C", "M", "E"] {
            let each = try checked(criterion + " " + grade, proposed: ""); precondition(each.criteria[0].rating == grade)
        }
        precondition(ToddleRubric.terminalRating(criterion: "Invented Part C", evidence: "Invented Part C") == "", "A criterion ending in C is not a grade")
        precondition(ToddleRubric.terminalRating(criterion: "Invented Part C", evidence: "Invented Part C / Invented Part C") == "", "Repeated criterion text does not supply a grade")
        precondition(ToddleRubric.terminalRating(criterion: "Invented Part C", evidence: "Invented Part C / Invented Part C M") == "M", "The terminal grade follows the last complete criterion")
        do {
            _ = try checked(original, proposed: "C", source: "A different invented source")
            preconditionFailure("Unquoted model evidence must be rejected")
        } catch { /* expected */ }
        let source = "Assessment Criteria\n" + criterion + "\nM\nLearning goals\nInvented goal"
        let rubric = try checked(original, proposed: "C", source: source); precondition(rubric.criteria[0].rating == "M", "Original rubric remains authoritative")
    }

    static func main() throws {
        try evaluationFallbackChecks()
        deviceAccessChecks()
        let updated = Mock()
        let success = try ClaudeKey.save(fakeKey, store: updated.store)
        precondition(updated.calls == ["update", "read"])
        precondition(success.saveCode == 0 && success.diagnostics.readCode == 0 && success.verified)
        precondition(success.diagnostics.accessGroup == group)

        let added = Mock()
        added.updateCode = errSecItemNotFound
        let addedResult = try ClaudeKey.save(fakeKey, store: added.store)
        precondition(addedResult.verified)
        precondition(added.calls == ["update", "add", "read"])

        // A failed add must preserve the add's actual status, not the update status.
        let denied = Mock()
        denied.updateCode = errSecItemNotFound
        denied.addCode = errSecMissingEntitlement
        let failed = try ClaudeKey.save(fakeKey, store: denied.store)
        precondition(failed.saveCode == -34018 && failed.diagnostics.readCode == 0 && !failed.verified)
        precondition(denied.calls == ["update", "add", "read"])

        let different = Mock()
        different.readKey = "sk-ant-synthetic-older-value"
        let differentResult = try ClaudeKey.save(fakeKey, store: different.store)
        precondition(!differentResult.verified)

        let unreadable = Mock()
        unreadable.readKey = nil
        let unreadableResult = try ClaudeKey.save(fakeKey, store: unreadable.store)
        precondition(!unreadableResult.verified)

        for code in [errSecItemNotFound, errSecMissingEntitlement, errSecInteractionNotAllowed, OSStatus(-50)] {
            let missing = Mock()
            missing.readCode = code
            missing.readGroup = nil
            let report = ClaudeKey.startupDiagnostics(store: missing.store)
            precondition(report.readCode == code && report.accessGroup == group)
            precondition(missing.calls == ["read", "probe", "cleanup"])
            let savedButUnreadable = Mock()
            savedButUnreadable.readCode = code
            savedButUnreadable.readGroup = nil
            let unverified = try ClaudeKey.save(fakeKey, store: savedButUnreadable.store)
            precondition(unverified.saveCode == 0 && unverified.diagnostics.readCode == code && !unverified.verified)
            precondition(savedButUnreadable.calls == ["update", "read", "probe", "cleanup"])
            for language in ["de-DE", "en-US"] {
                let text = KeychainText.status(code, locale: Locale(identifier: language))
                precondition(text.contains(String(code)) && !text.contains(fakeKey))
            }
            do {
                _ = try ClaudeKey.read(store: missing.store)
                preconditionFailure("Failed Keychain reads must throw")
            } catch {
                precondition(error.localizedDescription.contains(String(code)))
                precondition(!error.localizedDescription.contains(fakeKey))
            }
        }

        let locked = Mock()
        locked.readCode = errSecInteractionNotAllowed
        locked.readGroup = nil
        locked.probeCode = errSecMissingEntitlement
        let unavailable = ClaudeKey.startupDiagnostics(store: locked.store)
        precondition(unavailable.readCode == -25308 && unavailable.accessGroup == nil)
        precondition(locked.calls == ["read", "probe", "cleanup"])
        precondition(unavailable.groupDescription(locale: Locale(identifier: "en-US")).contains("-34018"))

        let invalid = Mock()
        do {
            _ = try ClaudeKey.save("invalid synthetic value", store: invalid.store)
            preconditionFailure("Invalid keys must be rejected before Keychain access")
        } catch { precondition(invalid.calls.isEmpty) }

        for (code, de, enUS) in [
            (OSStatus(-25300), "Nicht gefunden", "Not found"),
            (OSStatus(-34018), "Keine Berechtigung", "Missing entitlement"),
            (OSStatus(-25308), "Gerät gesperrt", "Device locked"),
            (OSStatus(-50), "Sonstiger", "Other"),
        ] {
            precondition(KeychainText.status(code, locale: Locale(identifier: "de-DE")).contains(de))
            precondition(KeychainText.status(code, locale: Locale(identifier: "en-US")).contains(enUS))
        }
        print("EV-1.2 / EV-1.3: synthetic Keychain diagnostics, separate device storage, stale-forget protection and bridge policy passed")
    }
}
