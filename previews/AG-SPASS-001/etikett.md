# Ballbrause

**Übung AG-SPASS-001 — erfundenes Produkt, kein Produktauftrag.**

> **ÜBUNG – erfundenes Produkt, kein echtes Getränk**
>
> ## Ballbrause
>
> *Ballbrause – der prickelnde Volltreffer für deinen Durst.*
>
> **Zutaten (alle erfunden, keine echte Rezeptur):** Torjubelwasser, Elfmeter-Perlen, Flankenzitrus-Aroma, Abseits-Sirup, Nachspielzeit-Essenz.
>
> **Realer Fakt über ein Fremdprodukt (nicht Ballbrause):** Die Orangenlimonade fritz-limo orange enthält laut Hersteller 17 % Fruchtanteil. Quelle: https://fritz-kola.com/products/fritz-limo-orange-0-33-l
>
> **Warnung:** Reines Übungsetikett. Ballbrause existiert nicht und darf weder hergestellt noch getrunken werden.

## Einwand — Argus

Die Angabe von 17 % Fruchtanteil für fritz-limo orange kann trotz klarer Zuordnung auf dem Ballbrause-Etikett als Eigenschaft von Ballbrause missverstanden werden.

Der Einwand wird gemäß Spielregel dokumentiert, nicht umgesetzt.

## Anforderungen — Archibald

1. Das Etikett zeigt den Produktnamen „Ballbrause“ in genau dieser Schreibweise.
2. Das Etikett nennt mindestens eine und höchstens fünf Zutaten, und alle sind erfunden.
3. Das Etikett enthält einen gut sichtbaren Warnhinweis, der mit „Warnung:“ beginnt.

## Prüfung — Sentinel

- PASS — Name exakt „Ballbrause“ als Überschrift vorhanden.
- PASS — Genau fünf Zutaten aufgeführt; alle als erfunden gekennzeichnet und mit Fantasienamen versehen.
- PASS — Gut sichtbarer, fett markierter Warnhinweis beginnt im dargestellten Text mit „Warnung:“.

Reine Prüfung des fertigen Textes; keine Browser-/Geräteabnahme.

## Rückschau — Cadence

Eine automatische Vorabprüfung des Eingabepakets, ob Pflichtdateien wie AGENTS.md und CLAUDE.md in der Leseliste stehen, hätte den gescheiterten ersten Prepare-Lauf und die anschließende Korrekturschleife verhindert.

## Ausführungsbelege

Projekt `ballbrause`, Run `AG-SPASS-001`. Alle Beiträge stammen aus tatsächlichen getrennten Rollenläufen. Lot nahm nicht teil. Atlas koordinierte und stellte die Beiträge zusammen.

| Rolle | Tatsächlicher Lauf | Ergebnis / belegte API-Kosten |
|---|---|---|
| Nova | `/root/nova_ballbrause` | Slogan, 8 Wörter; ChatGPT-Verbrauch nicht separat messbar |
| Scout | `/root/scout_ballbrause` | Herstellerfakt und Link; von Atlas an der Herstellerseite gegengeprüft |
| Archibald | [40108991534](https://github.com/pahlborn/agentarium/actions/runs/40108991534), Session `45681f16-53f4-4776-b628-d7715d1c3a46` | 3 Anforderungen; USD 0.034906 |
| Forge | [40109160860](https://github.com/pahlborn/agentarium/actions/runs/40109160860), Session `91010528-f2c9-4cd1-bc65-104a1b2b8115` | Etikett; USD 0.0569206 |
| Argus | `/root/argus_ballbrause` | Genau ein Einwand |
| Sentinel | `/root/sentinel_ballbrause` | 3 × PASS |
| Cadence | [40109338249](https://github.com/pahlborn/agentarium/actions/runs/40109338249), Session `6c7f0adf-fe36-46fb-ae28-3ba5e27810f9` | Ein Rückschau-Satz; USD 0.034343 |

Claude-API-Summe laut Laufmetadaten: **USD 0.1261696**, innerhalb der freigegebenen USD 0.90. Keine Gesamtkostenbehauptung für ChatGPT oder GitHub. Jeder der drei Modellaufrufe erfolgte einmal. Der erste Archibald-Prepare [40108953720](https://github.com/pahlborn/agentarium/actions/runs/40108953720) scheiterte vor dem Modelljob; dieser wurde übersprungen. Die drei Handback-SHA256 wurden gegen die jeweiligen Laufmetadaten geprüft.

## Monitorgrenze und Abschluss

Die 16 vorgesehenen Kommunikationsübergaben werden einzeln über Issue #2 mit `project_id: ballbrause` und `run_id: AG-SPASS-001` gemeldet; Zuweisungen stehen zusätzlich in eigenen Kommentaren. Ein gespeichertes Ereignis beweist nicht den gezeichneten Ball auf Peters Gerät. Ältere Relay-Transportmeldungen verwenden technisch weiterhin eigene Laufkennungen und teils die generische Forge-Rolle; diese sind kein Rollenbeleg für das Spiel. Die obigen Sessions und getrennten Spielmeldungen sind maßgeblich.

Ergebnisdatei vollständig geliefert, Übung inhaltlich beendet. Kein Produktcode verändert, kein Merge des Übungsergebnisses, keine Kunden-/Geräteabnahme behauptet.
