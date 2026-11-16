# Native Journal: prüfen, dann veröffentlichen

Gilt für native Atlas-/Nova-/Scout-/Argus-/Sentinel-Aufträge unter Rulebook1.4§10.
Atlas ist Publisher; die tatsächliche Rolle bleibt Urheber ihrer Statusmeldung.
Lot und bestehende Claude-/Relayverträge bleiben ausgeklammert.

## Verbindlicher Weg

1. Für jeden neuen nativen Ausführungsversuch eine neue Kind-task_id unter einem stabilen parent_id wählen. Die tatsächliche Instanz/Quelle prüfen.
2. Eine JSON-Datei mit phase, binding, events, history und optional note erzeugen.
   binding enthält genau project_id, run_id, task_id, parent_id und role.
   history enthält tatsächlich zurückgelesene GitHub-Kommentarobjekte mit id, created_at, user und body. Alle relevanten Kommentare derselben Aufgabe berücksichtigen; keine erfundenen History-Belege.
3. `node .github/scripts/native-journal.cjs input.json` ausführen.
   Nur Exit0 und erfolgreich geparstes stdout berechtigen diesen Weg zum POST.
   Das gesamte Paket wird vor dem ersten Kommentar geprüft. Keine automatische Datumsreparatur.
4. Ausschließlich die erzeugten comments-Toolargumente sequenziell an das vorhandene verbundene GitHub-Tool geben. Ein Kommentar je Ereignis. Bei Fehler stoppen und den tatsächlichen Zustand klären.
5. Die erstellten Originalkommentare zurücklesen und für spätere Phasen in history aufnehmen.

```js
const checked = await tools.exec_command({
  cmd: "node .github/scripts/native-journal.cjs input.json",
  workdir: "/workspace/agentarium",
  max_output_tokens: 6000
});
if (checked.exit_code !== 0) throw new Error(checked.output);
const plan = JSON.parse(checked.output);
for (const args of plan.comments) {
  const posted = await tools.mcp__codex_apps__github_add_comment_to_issue(args);
  if (posted.isError) throw new Error("POST unbestätigt; Originaljournal abgleichen");
  // Originalkommentar anhand der gelieferten ID zurücklesen.
}
```

Der Beispiel-Arbeitsordner ist durch den tatsächlichen Checkout zu ersetzen.
Keine Ausgabe oder ein laufender Shellprozess ist keine Freigabe zum POST.
Bei unklarer POST-Bestätigung zuerst das Originaljournal vollständig für die
betroffene Aufgabe abgleichen und dieselbe Eingabe mit aktualisierter history
erneut prüfen. Identische vorhandene IDs werden übersprungen; andere Inhalte
unter derselben ID werden abgewiesen. Keine blinde Wiederholung.

## Phasen

- dispatch: genau handoff, assigned von Atlas an die gebundene Rolle.
  Die zurückgegebene instruction ist vollständig in den tatsächlichen Auftrag
  zu übernehmen; sie verlangt eigene started-/End-/Rückgabemeldungen.
- start: genau das echte rollenverfasste started. Der Prüfer verlangt die
  gültige vorhandene Zuweisung an dieselbe Rolle/Parentbindung. Bereits
  begonnene, beendete, geschlossene oder anderweitig gehaltene Versuche werden
  nicht neu gestartet.
- final: eigenes delivered oder tatsächliches aborted, unmittelbar gefolgt
  von contribution an Atlas. Vor fachlicher Ergebnisanalyse veröffentlichen.
  delivered bedeutet Ausführungsende, keine fachliche oder Kundenannahme.
  Ein bereits bestätigtes Ende und noch ausstehender Rückwurf können mit
  derselben Eingabe sicher abgeglichen werden. Fehlende echte Meldungen
  beschaffen/diagnostizieren, niemals erzeugen.

Zwischenstände sind progress, keine endgültige Rückgabe. Administrative
Ereignisse und der bestehende Claude-Kanal sind nicht Phasen dieses Werkzeugs.
Das Werkzeug führt keinen Netzwerkzugriff und keinen Worker aus und erteilt
keine Schreibrechte. Es prüft den tatsächlichen V1-Consumerparser und dessen
Aufgaben-Fold, statt einen zweiten V1-Vertrag zu pflegen. Ändern sich
Quellanker oder Rollenquelle, scheitert der Prüfschritt geschlossen.

## Nachweis und Grenzen

`node .github/scripts/test-native-journal.cjs` führt ausschließlich lokale,
klar synthetische Negativ-/Normalfälle aus. Echte Quellenidentität,
Vollständigkeit der gelieferten History und fachliche Autorität prüft Atlas
zusätzlich; JSON oder ein GitHub-Login allein beweisen keine Agentenidentität.
Der Prüfer ist ein abgesicherter Aufrufweg, keine neue globale Tool-Sperre:
laufende oder andere Chats übernehmen ihn erst nach tatsächlichem Laden und
Verwenden der Anweisung. Keine feste Latenz oder Hintergrundausführung.

Originalbefund, tatsächliche Rollen und Normalpfad:
https://github.com/pahlborn/agentarium/issues/115#issuecomment-6928599304 .
Der dortige Bootstrap ist nur die historische erste Stufe; die zusätzlichen
Bindungs-/Zustandsprüfungen stehen im aktuellen Werkzeug.
