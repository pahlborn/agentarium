// Temporary excerpt from pahlborn/bis-school-app_src at 05ad69f1b35f3a473531ca38f75f9b569a8b505e
// Original ios/BigQuestMVP/ClaudeClient.swift lines 255-280; metadata is not original code.
enum ClaudeClient {
    private struct Response: Decodable {
        struct Content: Decodable {
            let type: String
            let text: String?
        }
        let stop_reason: String?
        let content: [Content]
    }

    struct Evaluation: Codable {
        struct Criterion: Codable {
            var criterion: String
            var rating: String
            var evidence: String
            var standard: String?
        }
        var title: String
        var date: String
        var goal: String
        var instructions: String
        var feedback: String
        var criteria: [Criterion]
        var missing: [String]
    }


// Temporary excerpt from pahlborn/bis-school-app_src at 05ad69f1b35f3a473531ca38f75f9b569a8b505e
// Original ios/BigQuestMVP/ClaudeClient.swift lines 290-385; metadata is not original code.
    static func evaluationSchema(catalog: [StandardCatalogEntry]?) -> [String: Any] {
        let string: [String: Any] = ["type": "string"]
        let codes = (catalog ?? []).map(\.code) + ["none"]
        let standardProperty: [String: Any] = catalog == nil ? [:] : ["standard": ["type": "string", "enum": codes]]
        let itemRequired: [String] = ["criterion", "rating", "evidence"] + (catalog == nil ? [] : ["standard"])
        let itemProperties: [String: Any] = ["criterion": string, "rating": string, "evidence": string].merging(standardProperty) { _, new in new }
        let schema: [String: Any] = [
            "type": "object", "additionalProperties": false,
            "required": ["title", "date", "goal", "instructions", "feedback", "criteria", "missing"],
            "properties": [
                "title": string, "date": string, "goal": string, "instructions": string, "feedback": string,
                "criteria": ["type": "array", "items": [
                    "type": "object", "additionalProperties": false,
                    "required": itemRequired,
                    "properties": itemProperties
                ]],
                "missing": ["type": "array", "items": string]
            ]
        ]
        return schema
    }

    // Deterministic validation, also exercised by the existing Swift CI without a provider.
    static func validateEvaluation(raw: String, source: String, catalog: [StandardCatalogEntry]? = nil) throws -> Evaluation {
        guard var result = try? JSONDecoder().decode(Evaluation.self, from: Data(raw.utf8)),
              result.criteria.count <= 60, result.missing.count <= 20 else {
            throw MVPError.message("Claude lieferte kein gültiges Evaluationsformular.")
        }
        if let catalog {
            // Check the raw model answer first: a rubric replacement below must not hide an invalid code.
            let allowed = Set(catalog.map(\.code) + ["none"])
            guard result.criteria.allSatisfy({ $0.standard.map(allowed.contains) == true }) else {
                throw MVPError.message("Claude lieferte einen Bereich außerhalb des freigegebenen Katalogs.")
            }
        }
        // Exact-criterion assignment hints only; positional model codes are never carried over.
        var hints: [String: String] = [:]
        var hintConflicts = Set<String>()
        for row in result.criteria {
            guard let code = row.standard else { continue }
            let key = squash(row.criterion)
            if let previous = hints[key], previous != code { hintConflicts.insert(key) }
            hints[key] = code
        }
        let rubric = ToddleRubric.extract(source)
        if let rubric = rubric {
            // Replace ambiguous model ratings with evidence-backed original grading.
            result.criteria = rubric.rows.map {
                Evaluation.Criterion(criterion: $0.criterion, rating: $0.rating, evidence: $0.evidence,
                                     standard: hintConflicts.contains($0.criterion) ? nil : hints[$0.criterion])
            }
            if rubric.complete {
                result.missing.removeAll { warning in
                    let w = warning.lowercased()
                    return (w.contains("kriter") && (w.contains("rating") || w.contains("einstuf")
                        || w.contains("bewertungsstuf") || w.contains("zuordn")))
                        || (w.contains("code") && w.contains("isoliert"))
                }
            }
        }
        let normalized = source.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.joined(separator: " ")
        for index in result.criteria.indices {
            let row = result.criteria[index]
            let evidence = row.evidence.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.joined(separator: " ")
            let criterion = row.criterion.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.joined(separator: " ")
            guard !criterion.isEmpty, !evidence.isEmpty, normalized.contains(evidence), evidence.contains(criterion),
                  ["", "RS", "C", "M", "E"].contains(row.rating) else {
                throw MVPError.message("Eine Kriterienzuordnung ist durch den Quelltext nicht belegt. Bitte die Quelle prüfen.")
            }
            if rubric == nil {
                // A model's rating is never authoritative. Only an original terminal
                // code after the quoted criterion is a grade in this fallback.
                result.criteria[index].rating = ToddleRubric.terminalRating(criterion: criterion, evidence: evidence)
            } else if !row.rating.isEmpty {
                let words = evidence.components(separatedBy: CharacterSet.alphanumerics.inverted)
                guard words.contains(row.rating) else {
                    throw MVPError.message("Eine Einstufung ist im Quellenbeleg nicht enthalten.")
                }
            }
        }
        if catalog == nil {
            // Legacy responses never carry an unvalidated assignment.
            for index in result.criteria.indices { result.criteria[index].standard = nil }
        }
        return result
    }

    private static func squash(_ text: String) -> String {
        text.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.joined(separator: " ")
    }

    static func catalogPrompt(_ catalog: [StandardCatalogEntry]) -> String {
        "\nFor every criterion set standard to exactly one code from the approved list below, or none if no area clearly fits. standard is only an assignment hint; it never changes criterion, rating or evidence.\nApproved codes:\n"
            + catalog.map { "- \($0.code): \($0.en) (\($0.subject))" }.joined(separator: "\n")
    }


// Temporary excerpt from pahlborn/bis-school-app_src at 05ad69f1b35f3a473531ca38f75f9b569a8b505e
// Original ios/BigQuestMVP/ClaudeClient.swift lines 447-531; metadata is not original code.
enum ToddleRubric {
    static func terminalRating(criterion: String, evidence: String) -> String {
        guard let criterionRange = evidence.range(of: criterion, options: .backwards),
              !evidence[criterionRange.upperBound...].trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let match = evidence.range(of: #"(?:^|[^\p{L}\p{N}])(RS|C|M|E)$"#, options: .regularExpression) else { return "" }
        return String(evidence[match]).components(separatedBy: CharacterSet.alphanumerics.inverted).filter { !$0.isEmpty }.last ?? ""
    }
    struct Criterion {
        var criterion: String
        var rating: String
        var evidence: String
    }
    struct Result {
        var rows: [Criterion]
        var complete: Bool
    }
    private static let codes: Set<String> = ["RS", "C", "M", "E"]
    private static func clean(_ s: String) -> String {
        s.split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
    }
    private static func label(_ line: String, _ wanted: String) -> Bool {
        line.caseInsensitiveCompare(wanted) == .orderedSame
    }
    private static func heading(_ line: String) -> Bool {
        if line == "-" || line == "–" || line == "—" { return true }
        if ["Standards", "Assessment Criteria", "Learning goals"].contains(where: { label(line, $0) }) { return true }
        let letters = line.unicodeScalars.filter { CharacterSet.letters.contains($0) }
        return letters.count >= 6 && letters.allSatisfy { !CharacterSet.lowercaseLetters.contains($0) }
    }
    private static func splitRated(_ text: String) -> (String, String)? {
        let p = clean(text)
        if codes.contains(p) { return ("", p) }
        guard let last = p.lastIndex(of: " ") else { return nil }
        let grade = String(p[p.index(after: last)...])
        guard codes.contains(grade) else { return nil }
        return (String(p[..<last]), grade)
    }
    static func extract(_ source: String) -> Result? {
        let lines = source.components(separatedBy: .newlines).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        guard let begin = lines.firstIndex(where: { label($0, "Assessment Criteria") }),
              begin+1 < lines.count,
              let end = lines[(begin+1)...].firstIndex(where: { label($0, "Your response") }), end > begin else { return nil }
        let section = Array(lines[(begin+1)..<end])
        let exactSection = clean(section.joined(separator: " "))
        var rows: [Criterion] = []
        var pending: [String] = []
        var gradeCount = 0
        for raw in section {
            let line = clean(raw)
            if line.isEmpty { continue }
            if heading(line) { pending.removeAll(); continue }
            if let (prefix, grade) = splitRated(line) {
                gradeCount += 1
                let criterion = clean((pending+[prefix]).joined(separator: " "))
                let evidence = criterion + " " + grade
                if criterion.count >= 20 && exactSection.contains(evidence)
                    && !rows.contains(where: { $0.criterion == criterion }) {
                    rows.append(Criterion(criterion: criterion, rating: grade, evidence: evidence))
                }
                pending.removeAll()
            } else {
                pending.append(line)
            }
        }
        // Visual fallback must also be verbatim in the original Assessment Criteria section.
        if let visual = lines.firstIndex(where: { label($0, "Visible rubric criterion and rating in the same row:") }) {
            for raw in lines[(visual+1)...] {
                guard let (criterion, grade) = splitRated(raw), criterion.count >= 20,
                      exactSection.contains(criterion) else { continue }
                if let i = rows.firstIndex(where: { $0.criterion == criterion }) {
                    if rows[i].rating != grade { rows[i].rating = ""; rows[i].evidence = criterion }
                } else {
                    rows.append(Criterion(criterion: criterion, rating: grade, evidence: criterion+" "+grade))
                }
            }
        }
        let trailing = clean(pending.joined(separator: " "))
        if trailing.count >= 20 && !rows.contains(where: { $0.criterion == trailing }) {
            rows.append(Criterion(criterion: trailing, rating: "", evidence: trailing))
        }
        let complete = !rows.isEmpty && gradeCount == rows.filter { !$0.rating.isEmpty }.count
            && rows.allSatisfy { !$0.rating.isEmpty }
        return Result(rows: rows, complete: complete)
    }
}
