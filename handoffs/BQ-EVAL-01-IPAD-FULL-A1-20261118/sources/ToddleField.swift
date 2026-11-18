import Foundation
import WebKit

enum ToddleField {
    // Captures rendered text only. No table semantics, account state or network endpoints.
    static let evaluationScript = #"""
    (() => {
      if (location.origin !== 'https://web.toddleapp.com') return { error: 'origin' };
      const rendered = element => {
        if (!element || !element.getClientRects().length) return false;
        for (let parent = element; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (parent.hidden || parent.hasAttribute('inert') || style.display === 'none' ||
              style.visibility !== 'visible' || Number(style.opacity) === 0) return false;
        }
        return true;
      };
      const dialogs = [...document.querySelectorAll('[role="dialog"], dialog[open]')].filter(rendered);
      // Nested dialogs are normal. A hit test identifies the foreground view.
      const hits = document.elementsFromPoint(innerWidth / 2, innerHeight / 2);
      const hitDialogs = dialogs.filter(dialog => hits[0] && dialog.contains(hits[0]));
      const front = hitDialogs.find(dialog => !hitDialogs.some(other => other !== dialog && dialog.contains(other)));
      const roots = dialogs.filter(dialog => !dialogs.some(other => other !== dialog && other.contains(dialog)));
      let scope;
      if (front) scope = roots.find(root => root.contains(front)) || front;
      else if (roots.length === 1) scope = roots[0];
      else if (!roots.length) scope = document.querySelector('main, [role="main"]');
      if (!scope || !rendered(scope)) return {error: 'scope'};
      const lines = [];
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || parent.closest('script, style, noscript, input, textarea, select, button, nav, [role="navigation"], [contenteditable="true"]') || !rendered(parent)) continue;
        const ariaHidden = parent.closest('[aria-hidden="true"]');
        // Some overlays mark an ancestor aria-hidden while their active nested dialog stays visible.
        if (ariaHidden && !(front && front.contains(parent) && ariaHidden.contains(front))) continue;
        const text = node.textContent.replace(/\s+/g, ' ').trim();
        if (text) lines.push(text);
      }
      // A rubric level may be in a button/select next to the criterion text.
      // Do not collect general controls: only an unambiguous SAME visible row,
      // with the criterion left of its single, explicitly rendered grade.
      const code = /^(?:RS|C|M|E)$/;
      const grades = [...scope.querySelectorAll('*')].filter(el => {
        if (!rendered(el) || el.closest('script,style,noscript,nav,[role="navigation"],[aria-hidden="true"]')) return false;
        if (el.children.length && !el.matches('input,select')) return false;
        const value = el.matches('input,select') ? el.value : (el.textContent || '').trim() || (el.getAttribute('aria-label') || '').trim();
        return code.test(String(value || '').trim());
      });
      const rubricStart = lines.findIndex(x => x.toLowerCase() === 'assessment criteria');
      const rubricEnd = lines.findIndex((x,i) => i > rubricStart && x.toLowerCase() === 'your response');
      const rubricText = rubricStart >= 0 && rubricEnd > rubricStart
        ? lines.slice(rubricStart + 1, rubricEnd).join(' ').replace(/\s+/g,' ').trim()
        : '';
      const pairs = [];
      if (grades.length <= 96) for (const grade of grades) {
        const rating = grade.matches('input,select') ? grade.value.trim()
          : (grade.textContent || '').trim() || (grade.getAttribute('aria-label') || '').trim();
        const gradeRect = grade.getBoundingClientRect();
        for (let row = grade.parentElement; row && row !== scope; row = row.parentElement) {
          if (row.getBoundingClientRect().height > 260) break;
          if (grades.filter(g => row.contains(g)).length !== 1) break;
          const words = [], nearby = [];
          const textNodes = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
          while (textNodes.nextNode()) {
            const n = textNodes.currentNode, parent = n.parentElement;
            if (!parent || !rendered(parent) || parent.closest('script,style,noscript,button,input,textarea,select,nav,[role="navigation"],[aria-hidden="true"]')
                || grades.some(g => g.contains(parent))) continue;
            const value = n.textContent.replace(/\s+/g, ' ').trim();
            if (!value || code.test(value)) continue;
            words.push(value);
            const range = document.createRange();
            range.selectNodeContents(n);
            const rect = range.getBoundingClientRect();
            if (rect.width > 0 && rect.right <= gradeRect.left + 8
                && rect.bottom >= gradeRect.top && rect.top <= gradeRect.bottom) nearby.push(value);
          }
          const criterion = words.join(' ').replace(/\s+/g, ' ').trim();
          if (criterion.length >= 30 && criterion.length <= 700 && rubricText.includes(criterion) && nearby.length
              && !pairs.some(p => p.row === row || p.text === criterion)) {
            pairs.push({row, text: criterion, rating});
            break;
          }
        }
      }
      // The appended pair is derived only from observed DOM content, never
      // from visual order or model inference. Missing/ambiguous ratings stay empty.
      if (pairs.length) {
        lines.push('Visible rubric criterion and rating in the same row:');
        for (const pair of pairs) lines.push(pair.text + ' ' + pair.rating);
      }
      const text = lines.join('\n');
      if (!text || !/Learning intentions|Learning experience description|Assessment|Evaluation/i.test(text)) return {error: 'content'};
      if (new TextEncoder().encode(text).length > 48000) return {error: 'size'};
      return {text};
    })()
    """#

    @MainActor
    static func readSource(from view: WKWebView) async throws -> String {
        let url = view.url
        guard url?.scheme == "https", url?.host == "web.toddleapp.com" else {
            throw MVPError.message("Öffne die gewünschte Evaluation in Toddle.")
        }
        let result = try await view.evaluateJavaScript(evaluationScript)
        guard view.url == url else {
            throw MVPError.message("Die Seite hat sich während des Lesens geändert. Bitte erneut lesen.")
        }
        guard let data = result as? [String: Any], let text = data["text"] as? String,
              !text.isEmpty, text.utf8.count <= 48000 else {
            throw MVPError.message("Der Text der Evaluation konnte nicht erfasst werden. Bitte die geöffnete Ansicht prüfen.")
        }
        return text
    }
}
