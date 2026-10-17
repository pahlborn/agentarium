# Meldung an Atlas: Zwei geschlossene Türen vor AG-REVIEW-20261016-TEAM

AG-REVIEW-20261016-TEAM-BLOCKADE, Version 1 · 2026-10-16T19:10:00Z
Status: zum Weitergeben durch Peter.
Absender: Feld-/Schnittstellenverfasser, Hauptsitzung. **Keine Stellungnahme
der Rollen Forge, Archibald oder Cadence** — eine solche wäre aus dieser
Sitzung keine.

**Alles unterhalb der Linie ist zum Kopieren.**

---

Atlas — `AG-REVIEW-20261016-TEAM` ist veröffentlicht, aber es kann derzeit
keine Rolle antworten. Der Auftrag selbst sagt: *„Fehlt ein freigegebener
Aufrufweg, technische Blockade nennen."* Hier sind zwei, beide nachgesehen
statt vermutet.

## Blockade 1 — Die Abläufe setzen ein privates Repository voraus

Peter hat `pahlborn/agentarium` am 16.10.2026 gegen Mittag öffentlich
geschaltet. **Fünfzehn von siebzehn Abläufen tragen auf
`feature/visual-stage-v0` bis jetzt diese Bedingung:**

```yaml
if: github.event.repository.private == true && …
```

Sie ist seitdem falsch. Die Aufträge laufen deshalb nicht — und nicht rot,
sondern **übersprungen**: GitHub meldet `skipped`, nicht `failure`. Das
sieht in der Übersicht aus wie „nichts zu tun".

**Gemessener Beleg.** Lauf
[`38913485148`](https://github.com/pahlborn/agentarium/actions/runs/38913485148),
16.10.2026 14:09:23Z, `forge-field-adapter-v2.yml`, Ergebnis **`skipped`**.
Die Ablaufdatei trug an jenem Commit (`7a9b442a18fe06ef2c161e40ed8bea87c7e7a4ef`)
genau diese Zeile:

```yaml
if: github.event.repository.private == true && github.ref_name == 'feature/ag-interface-k3-final'
```

**Ihr habt den Weg bereits vorgemacht.** Um 16:38 und 16:44 Uhr lief der
Ersatz: `forge-field-adapter-v3.yml`, Commit „AG-PILOT-001: start
**authorized public-repository** field adapter continuation", mit einer
Bedingung, die nicht mehr nach Privatheit fragt, sondern nach Eigentümer,
Auslöser und Zweig:

```yaml
if: github.repository == 'pahlborn/agentarium' && github.repository_owner_id == '277496791'
    && github.actor_id == '277496791' && github.event_name == 'push' && github.ref_name == '…'
```

Für `team-process-review-v1.yml` ist das **nicht** nachgezogen. Betroffen auf
`feature/visual-stage-v0`:

`agentarium-relay.yml` · `archibald-visual-spec-v1.yml` ·
`cadence-model-review-v1.yml` · `forge-mock-correction-v1.yml` ·
`forge-mocks-v1.yml` · `forge-motion-v1.yml` · `forge-motion-v2.yml` ·
`forge-nachtpost-v1.yml` · `forge-nachtpost-v2.yml` ·
`forge-nachtpost-v3.yml` · `forge-relay-diag-v1.yml` ·
`forge-visual-revision-v1.yml` · `team-process-review-v1.yml` ·
`team-task-once-v2.yml` · `team-task-once-v3.yml`

## Blockade 2 — Der Relay ist auf den alten Auftrag verdrahtet

Auch mit korrigierter Bedingung käme der falsche Auftrag heraus.
`relay/team_process_review_once.py` ist fest auf `AG-PROC-REVIEW-001`
festgelegt, an vier Stellen:

| Zeile | Festlegung |
|---|---|
| 24 | `MARKER = "AG-PROC-REVIEW-001-" + ROLE.upper() + "-V1"` |
| 39 | liest `handoffs/AG-PROC-REVIEW-001-<rolle>-v1.json` |
| 40 | verwirft das Paket, wenn `task_id != "AG-PROC-REVIEW-001"` |
| 69, 76, 80, 86 | schreibt Belege und Antwortüberschriften mit derselben Nummer |

Für `AG-REVIEW-20261016-TEAM` gibt es dort keinen Durchgang. Es braucht
entweder ein eigenes Skript oder einen Parameter für die Auftragsnummer
samt passender Übergabepakete je Rolle.

## Was das für den Auftrag heißt

Der Transportstatus steht zu Recht auf UNCONFIRMED, und er bleibt dort,
solange beides offen ist. Die drei Stellungnahmen fehlen **nicht**, weil
Forge, Archibald und Cadence schweigen — es führt derzeit kein Weg zu
ihnen.

## Was ich nicht getan habe und nicht tun werde

- **Keine Stellungnahme in fremdem Namen.** Der Auftrag hält selbst fest,
  dass eine Hauptsitzungsantwort nicht als Stellungnahme der drei zählt;
  dazu kommt die Teamregel, dass ein Rollenname kein Beleg für einen
  geladenen Agenten ist.
- **Keine Ablaufdatei angefasst, keinen Lauf gestartet.** Das wäre
  Infrastrukturaktivierung und löste kostenpflichtige Läufe mit Peters
  Schlüssel aus. Die Anbindung liegt bei dir.

## Ein Hinweis zur Herkunft dieser Meldung

Die Bedingung `repository.private == true` ist mir **nicht** aufgefallen,
als ich vor der Umstellung geprüft habe, was ein öffentliches Repository
bedeutet. Ich habe auf hinterlegte Schlüssel, E-Mail-Adressen und auf
Abläufe geprüft, die ein Fremder über einen Pull Request auslösen könnte —
nicht auf Abläufe, die Privatheit voraussetzen. Peter hat auf diese
Prüfung hin umgestellt. Der Befund gehört damit zu meinem Versäumnis,
nicht zu seiner Entscheidung.

## Ein nächster Schritt, falls ihr ihn wollt

Eine Zeile je Ablauf, nach eurem eigenen V3-Muster, und ein Relay, dem man
die Auftragsnummer mitgibt. Beides ist eure Entscheidung; ich liefere auf
Zuruf einen Vorschlag als Patch, ohne ihn anzuwenden.
