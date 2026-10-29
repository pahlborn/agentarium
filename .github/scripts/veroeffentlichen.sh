#!/usr/bin/env bash
# AG-CI-NACHWEISE-003, B1 — veroeffentlicht wird nur, was vollstaendig geprueft ist.
#
# WARUM. Pages baute bis zum 28.10. direkt aus `main` (Zweigquelle). Jeder
# Merge stand damit sofort auf Peters iPad, auch wenn der volle Lauf der
# Browsernachweise auf `main` danach rot wurde. Deshalb musste alles VOR dem
# Merge vollstaendig geprueft sein. Konzept und Review: Issue #89.
#
# DIE REGEL, und nur diese: Veroeffentlicht wird ein Commit K von `main`, wenn
# es einen GRUENEN Lauf "Browsernachweise" (push auf main) zu einem Commit G
# gibt, der auf `main` liegt, und G und K in allen GEPRUEFTEN Pfaden gleich
# sind. Geprueft sind genau die Pfade, die den Lauf auf `main` ausloesen
# (`on.push.paths` in browsernachweise.yml; hier daraus gelesen, nicht
# abgeschrieben). Was K darueber hinaus aendert, prueft dieser Lauf ohnehin nie.
#
# Automatisch ist K immer der aktuelle Kopf von `main` und nur vorwaerts: Ein
# schon veroeffentlichter oder aelterer Stand wird nicht noch einmal
# veroeffentlicht. Von Hand (workflow_dispatch) darf K auch aelter sein --
# das ist der Rueckrollweg, und fuer ihn gilt dieselbe Regel.
#
# Solange Pages noch aus dem Zweig baut, tut dieser Ablauf nichts.
#
# Aufruf im Workflow: bash .github/scripts/veroeffentlichen.sh entscheiden
#   Umgebung: REPO, EREIGNIS, EINGABE_SHA (nur von Hand), GH_TOKEN
#   Schreibt los/sha/grund nach $GITHUB_OUTPUT.
# Lokal nur zum Nachsehen: PAGES_ART=workflow ueberschreibt die Abfrage.
set -euo pipefail

WF=".github/workflows/browsernachweise.yml"
QUELLEN_UMGEBUNG="agentarium-pages-source"

fehler() { echo "::error::$*" >&2; exit 1; }

ausgabe() {
  local los="$1" sha="$2" grund="$3"
  echo "Entscheidung: los=$los sha=${sha:-–} — $grund"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    { echo "los=$los"; echo "sha=$sha"; echo "gruen=${g:-}"; echo "grund=$grund"; } >> "$GITHUB_OUTPUT"
  fi
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    echo "### Veröffentlichen: $( [ "$los" = ja ] && echo "ja, \`${sha:0:7}\`" || echo nein )" >> "$GITHUB_STEP_SUMMARY"
    echo "$grund" >> "$GITHUB_STEP_SUMMARY"
  fi
  exit 0
}

# Die gepruefen Pfade aus `on.push.paths` des Nachweislaufs, als Pfadangaben
# fuer `git diff`: 'previews/**' -> 'previews/', Dateien bleiben Dateien.
gepruefte_pfade() {
  awk '
    /^on:/            { on = 1; next }
    on && /^[^ ]/     { on = 0 }
    on && /^  push:/  { push = 1; next }
    on && /^  [a-z_]+:/ && !/^  push:/ { push = 0 }
    push && /^    paths:/ { pfade = 1; next }
    push && pfade && /^      - / { gsub(/^      - |'\''|"/, ""); sub(/\*\*$/, ""); print; next }
    push && pfade && !/^      / { pfade = 0 }
  ' "$WF"
}

# Gibt es einen gruenen Nachweislauf (push auf main), dessen Commit auf main
# liegt und in den gepruefen Pfaden mit $1 uebereinstimmt? Gibt dessen SHA aus.
gruen_fuer() {
  local k="$1" g laeufe
  shift
  local pfade=("$@")
  laeufe="$(gh api --paginate "repos/$REPO/actions/workflows/browsernachweise.yml/runs?branch=main&event=push&status=success&per_page=50" \
             --jq '.workflow_runs[].head_sha')" || return 2
  while read -r g; do
    [ -n "$g" ] || continue
    git cat-file -e "$g^{commit}" 2>/dev/null || continue
    git merge-base --is-ancestor "$g" origin/main || continue
    if git diff --quiet "$g" "$k" -- "${pfade[@]}"; then echo "$g"; return 0; fi
  done <<< "$laeufe"
  return 1
}

# deploy-pages bezeichnet einen Einsatz mit dem Ereignis-SHA, nicht notwendig
# mit dem ausgecheckten Quellstand. Deshalb eigener Herkunftsbeleg, erst NACH
# erfolgreichem Deploy angelegt: Quell-SHA, gruenes G, Artefakt, Lauf und
# Ereignis-SHA getrennt. Nur dessen bestaetigter Erfolg zaehlt; ein Versuch
# (pending/failed) darf nie eine Wiederholung als "schon veroeffentlicht" sperren.
veroeffentlicht() {
  local daten zeit id sha quelle schema artefakt lauf zustand
  daten="$(gh api --paginate "repos/$REPO/deployments?environment=$QUELLEN_UMGEBUNG&per_page=100" \
    --jq '.[] | [.created_at, .id, .sha, .payload.source_sha, .payload.schema, .payload.artifact_id, .payload.run_id] | @tsv')" || return 2
  while IFS=$'\t' read -r zeit id sha quelle schema artefakt lauf; do
    [ -n "$id" ] || continue
    zustand="$(gh api "repos/$REPO/deployments/$id/statuses?per_page=1" --jq '.[0].state // "pending"')" || return 2
    [ "$zustand" = success ] || continue
    [[ "$sha" =~ ^[a-f0-9]{40}$ && "$sha" = "$quelle" && "$schema" = agentarium.pages-source.v1 && "$artefakt" =~ ^[0-9]+$ && "$lauf" =~ ^[0-9]+$ ]] || return 2
    echo "$sha"; return 0
  done < <(printf '%s\n' "$daten" | sort -r)
}

belegen() {
  local id
  # Eingaben kommen nur aus dem erfolgreichen, gepinnten Build/Deploy-Job.
  python3 - <<'PY' | gh api --method POST "repos/$REPO/deployments" --input - --jq .id > "$RUNNER_TEMP/pages-source-id"
import json, os
print(json.dumps({"ref": os.environ["SHA"], "environment": "agentarium-pages-source",
    "auto_merge": False, "required_contexts": [], "production_environment": False,
    "description": "Erfolgreich ausgelieferten Quellstand und Artefakt belegen",
    "payload": {"schema": "agentarium.pages-source.v1", "source_sha": os.environ["SHA"],
        "evidence_sha": os.environ["GRUEN_SHA"], "event_sha": os.environ["EVENT_SHA"],
        "run_id": os.environ["GITHUB_RUN_ID"], "artifact_id": os.environ["ARTEFAKT_ID"]}}))
PY
  id="$(cat "$RUNNER_TEMP/pages-source-id")"
  [[ "$id" =~ ^[0-9]+$ ]] || fehler "Herkunftsbeleg ohne Deployment-ID"
  gh api --method POST "repos/$REPO/deployments/$id/statuses" \
    -f state=success -F auto_inactive=false -f environment_url="$URL" \
    -f log_url="$GITHUB_SERVER_URL/$REPO/actions/runs/$GITHUB_RUN_ID" >/dev/null
}

entscheiden() {
  local art pfade=() k g veroeff rc p
  art="${PAGES_ART:-$(gh api "repos/$REPO/pages" --jq .build_type)}" || fehler "Pages-Einstellung nicht lesbar"
  if [ "$art" != "workflow" ]; then
    ausgabe nein "" "Pages baut noch aus dem Zweig ('$art'), dieser Ablauf ist noch nicht zuständig."
  fi
  mapfile -t pfade < <(gepruefte_pfade)
  if [ "${#pfade[@]}" -eq 0 ]; then
    echo "::error::keine geprüften Pfade aus $WF gelesen"; exit 1
  fi
  # Nicht unterstuetzte Glob-Syntax darf den geprueften Satz nicht verengen.
  for p in "${pfade[@]}"; do
    [[ -n "$p" && "$p" != *\** && "$p" != *\?* && "$p" != *\!* && "$p" != *\[* ]] || fehler "nicht unterstuetzter Pruefpfad: $p"
  done
  echo "geprüfte Pfade: ${pfade[*]}"
  git fetch -q --no-tags origin main:refs/remotes/origin/main || fehler "main nicht aktualisierbar"

  if [ "$EREIGNIS" = "workflow_dispatch" ]; then
    k="$(git rev-parse --verify -q "${EINGABE_SHA:-}^{commit}")" ||
      ausgabe nein "" "Eingabe '${EINGABE_SHA:-}' ist kein Commit."
    git merge-base --is-ancestor "$k" origin/main ||
      ausgabe nein "" "$k liegt nicht auf main."
  else
    k="$(git rev-parse origin/main)"
    veroeff="$(veroeffentlicht)" || fehler "Erfolgreicher Quellstand nicht verlaesslich lesbar"
    if [ -z "$veroeff" ]; then
      ausgabe nein "$k" "Noch kein bestaetigter Quellbeleg; erste Veroeffentlichung von Hand mit SHA ausloesen."
    fi
    if [ "$veroeff" = "$k" ]; then
      ausgabe nein "$k" "Der Kopf von main ist schon veröffentlicht."
    fi
    git cat-file -e "$veroeff^{commit}" 2>/dev/null || fehler "Bestaetigter Quellstand fehlt im Git-Verlauf"
    git merge-base --is-ancestor "$veroeff" "$k" ||
      ausgabe nein "$k" "Kein Vorwaertsschritt gegenueber dem bestaetigten Quellstand ${veroeff:0:7}."
  fi

  if g="$(gruen_fuer "$k" "${pfade[@]}")"; then
    ausgabe ja "$k" "In den geprüften Pfaden gleich dem grünen Nachweislauf zu ${g:0:7}."
  else
    rc=$?
    [ "$rc" -eq 1 ] || fehler "Gruene Nachweislaeufe nicht lesbar"
  fi
  ausgabe nein "$k" "Kein grüner Nachweislauf mit gleichen geprüften Pfaden — warte auf den Volllauf."
}

case "${1:-}" in
  entscheiden) entscheiden ;;
  pfade) gepruefte_pfade ;;
  belegen) belegen ;;
  *) echo "Aufruf: $0 entscheiden | pfade | belegen" >&2; exit 2 ;;
esac
