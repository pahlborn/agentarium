// Temporary excerpt from pahlborn/bis-school-app_src at 05ad69f1b35f3a473531ca38f75f9b569a8b505e
// Original tests/ios-keychain-diagnostics.swift lines 119-226; metadata is not original code.
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

        // Generated generic catalog, including a no-quest entry. No provider call, no credential.
        func entry(_ i: Int, quest: Bool = true) -> [String: Any] {
            ["code": "S-\(i)", "subject": "subject-\(i % 5)", "de": "Synthetischer Eintrag \(i)", "en": "Synthetic entry \(i)", "quest": quest]
        }
        let raw: [[String: Any]] = (1...15).map { entry($0, quest: $0 != 3) }
        guard let catalog = StandardCatalog.parse(raw) else { preconditionFailure("Valid synthetic catalog must parse") }
        precondition(catalog.count == 15 && catalog.contains { $0.code == "S-3" && !$0.hasQuest })
        var noneCode = entry(1); noneCode["code"] = "none"
        var noQuestField = entry(1); noQuestField["quest"] = nil
        var spaced = entry(1); spaced["code"] = "S 1"
        var tooLong = entry(1); tooLong["de"] = String(repeating: "x", count: 301)
        let rejected: [Any?] = [nil, [[String: Any]](), raw + [entry(1)], (1...65).map { entry($0) }, [noneCode], [noQuestField], [spaced], [tooLong], "text"]
        for value in rejected { precondition(StandardCatalog.parse(value) == nil, "Malformed or duplicate catalog metadata must be rejected") }

        let schema = ClaudeClient.evaluationSchema(catalog: catalog)
        let items = ((schema["properties"] as! [String: Any])["criteria"] as! [String: Any])["items"] as! [String: Any]
        let standardSchema = (items["properties"] as! [String: Any])["standard"] as! [String: Any]
        let enumValues = standardSchema["enum"] as! [String]
        precondition(Set(enumValues) == Set(catalog.map(\.code) + ["none"]) && enumValues.count == catalog.count + 1, "Every catalog entry, including no-quest, plus none")
        precondition((items["required"] as! [String]).contains("standard"))
        let legacyItems = ((ClaudeClient.evaluationSchema(catalog: nil)["properties"] as! [String: Any])["criteria"] as! [String: Any])["items"] as! [String: Any]
        precondition((legacyItems["properties"] as! [String: Any])["standard"] == nil)

        let criterion = "Invented: explain the solution in Part C with a diagram"
        func encoded(_ standard: String?, rating: String = "M", evidence: String? = nil) throws -> String {
            let document = ClaudeClient.Evaluation(title: "Invented evaluation", date: "2026-11-18", goal: "", instructions: "", feedback: "",
                criteria: [.init(criterion: criterion, rating: rating, evidence: evidence ?? criterion + " M", standard: standard)], missing: [])
            return String(data: try JSONEncoder().encode(document), encoding: .utf8)!
        }
        func rejects(_ answer: String, source: String? = nil) -> Bool {
            do { _ = try ClaudeClient.validateEvaluation(raw: answer, source: source ?? criterion + " M", catalog: catalog); return false }
            catch { return true }
        }
        let rubricSource = "Assessment Criteria\n" + criterion + "\nM\nLearning goals\nInvented goal"
        let valid = try ClaudeClient.validateEvaluation(raw: encoded("S-3"), source: criterion + " M", catalog: catalog)
        precondition(valid.criteria[0].standard == "S-3" && valid.criteria[0].rating == "M" && valid.criteria[0].evidence == criterion + " M", "No-quest code accepted; source grade and evidence preserved")
        let noneValidated = try ClaudeClient.validateEvaluation(raw: encoded("none"), source: criterion + " M", catalog: catalog)
        precondition(noneValidated.criteria[0].standard == "none")
        let encodedUnlisted = try encoded("Z-NOT-LISTED")
        let encodedMissing = try encoded(nil)
        let encodedWrongCase = try encoded("s-3")
        let encodedEmpty = try encoded("")
        precondition(rejects(encodedUnlisted) && rejects(encodedMissing) && rejects(encodedWrongCase) && rejects(encodedEmpty), "Out-of-list or missing code is never a silent success")
        precondition(rejects("{}") && rejects("not json"))
        precondition(rejects(encodedUnlisted, source: rubricSource), "Invalid code is rejected before rubric replacement")
        let replaced = try ClaudeClient.validateEvaluation(raw: encoded("S-3", rating: "E"), source: rubricSource, catalog: catalog)
        precondition(replaced.criteria[0].rating == "M" && replaced.criteria[0].standard == "S-3", "Rubric grade wins; exact-criterion hint survives")
        let differentSource = "Assessment Criteria\nInvented: a different long criterion for this test\nM\nLearning goals\nInvented goal"
        let different = try ClaudeClient.validateEvaluation(raw: encoded("S-3"), source: differentSource, catalog: catalog)
        precondition(different.criteria[0].standard == nil && different.criteria[0].rating == "M", "A hint for another criterion is not carried over positionally")
        let blank = try ClaudeClient.validateEvaluation(raw: encoded("S-3", rating: "C", evidence: criterion), source: criterion, catalog: catalog)
        precondition(blank.criteria[0].rating == "" && blank.criteria[0].standard == "S-3", "Blank source grade stays blank; Part C is not a grade")
        let legacy = try ClaudeClient.validateEvaluation(raw: encoded("Z-ANY"), source: criterion + " M")
        precondition(legacy.criteria[0].standard == nil && legacy.criteria[0].rating == "M", "Legacy validation never passes an unvalidated assignment")
        precondition(ClaudeClient.catalogPrompt(catalog).contains("S-3") && !ClaudeClient.catalogPrompt(catalog).contains("x-api"))
    }

    static func main() throws {
        try evaluationFallbackChecks()
        try fullAppChecks()
