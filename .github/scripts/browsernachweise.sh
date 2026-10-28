#!/usr/bin/env bash
# AG-CI-NACHWEISE-002 — welche Browsernachweise laufen, und wie.
#
# WARUM. Am 20.10. dauerte der Lauf 2 min 25 s mit zwei Nachweisen. Am 26.10.
# waren es 18 Nachweise, nacheinander, 12 bis 15 Minuten -- auch fuer eine
# Aenderung von sechs Zeilen an `projekte/verzeichnis.json` (#85), die eine
# Pruefaufgabe 15 Minuten aufhielt. Gemessen im Lauf 40362791830 (main,
# 26.10.): 718 s reine Nachweiszeit, davon AG-EVENT-JOURNAL-001 allein 214 s.
#
# WAS SICH AENDERT, UND WAS NICHT.
#  - Auf `main` laufen weiterhin IMMER alle Nachweise. Das bleibt das Netz.
#  - Im Pull Request laufen nur die Nachweise, die die Aenderung beruehren
#    kann (Regeln in `auswahl`). Aendert sich Monitor-Code oder dieser
#    Pruefablauf, laufen alle.
#  - Die Nachweise laufen NACHEINANDER, wie bisher. Gleichzeitig zu viert
#    war im Lauf 40459863327 (PR #87) rot: Auf dem Laeufer wurde jeder
#    Nachweis zwei- bis dreimal langsamer (BALLSPIEL-002 98 s statt 34 s,
#    PLATZ 125 s statt 63 s), und fuenf scheiterten an Zeitablaeufen und
#    Animationen (AG-BLOCK-001, AG-EVENT-JOURNAL-001, AG-MON-ANSTOSS-001,
#    AG-MON-ARCHIV-001, AG-MON-BALLSPIEL-001). Zeitkritisch sind also weit
#    mehr als die zwei, die Zeiten ausdruecklich messen. Lokal auf einem
#    staerkeren Rechner war derselbe Lauf gruen -- das war der Trugschluss.
#    Die Moeglichkeit bleibt ueber NACHWEISE_PARALLEL erhalten, Standard 1.
#    Echte Gleichzeitigkeit braucht einen eigenen Laeufer je Nachweis.
#  - Jede Rueckgabe ausser 0 faellt weiterhin durch, auch die 2 fuer
#    "ungeprueft". Alle Ergebnisse werden gesammelt, nicht beim ersten Fehler
#    abgebrochen. Kein Nachweis ausgewaehlt ist kein Erfolg.
#
# Aufruf:  bash .github/scripts/browsernachweise.sh auswahl <ereignis> [basis] > liste
#          bash .github/scripts/browsernachweise.sh lauf < liste
set -uo pipefail

# Nachweise, die Laufzeiten messen. Wer einen neuen zeitkritischen Nachweis
# anlegt, traegt ihn hier ein.
ZEITKRITISCH="AG-LIVE-LATENCY-001 AG-TEMPO-001"
PARALLEL="${NACHWEISE_PARALLEL:-1}"

alle() { ls previews/*/pruefen.js 2>/dev/null; }

auswahl() {
  local ereignis="${1:-}" basis="${2:-}" geaendert tmp
  if [ "$ereignis" != "pull_request" ] || [ -z "$basis" ]; then
    echo "# Auswahl: alle (Ereignis '$ereignis' -- auf main laufen immer alle)" >&2
    alle; return 0
  fi
  geaendert="$(git diff --name-only "$basis" HEAD)" || {
    echo "# Auswahl: alle (Vergleich mit $basis nicht moeglich)" >&2; alle; return 0; }
  echo "# geaenderte Dateien seit $basis:" >&2
  printf '%s\n' "$geaendert" | sed 's/^/#   /' >&2
  if printf '%s\n' "$geaendert" | grep -qE '^(pilot/github-live/|\.github/workflows/browsernachweise\.yml$|\.github/scripts/browsernachweise\.sh$)'; then
    echo "# Auswahl: alle (Monitor-Code oder Pruefablauf geaendert)" >&2
    alle; return 0
  fi
  tmp="$(mktemp)"
  {
    # Ein geaenderter Nachweis (oder eine Datei in seinem Verzeichnis)
    printf '%s\n' "$geaendert" | sed -n 's#^previews/\([^/]*\)/.*#previews/\1/pruefen.js#p'
    # Das Projektverzeichnis: jeder Nachweis, der `projekte/verzeichnis.json`
    # liest oder nachbildet (am 27.10. acht Stueck). Ein lockereres Muster
    # ("verzeichnis") traf auch Aufnahme-Verzeichnisse und waehlte 14 aus.
    if printf '%s\n' "$geaendert" | grep -q '^projekte/'; then
      grep -lE "projekte/verzeichnis\.json|'projekte'" previews/*/pruefen.js
    fi
  } | sort -u | while read -r n; do [ -e "$n" ] && echo "$n"; done > "$tmp"
  if [ -s "$tmp" ]; then
    echo "# Auswahl: $(wc -l < "$tmp" | tr -d ' ') von $(alle | wc -l | tr -d ' ') Nachweisen" >&2
    cat "$tmp"
  else
    echo "# Auswahl: alle (nichts zuordenbar -- lieber zu viel als zu wenig)" >&2
    alle
  fi
  rm -f "$tmp"
}

einer() {
  # $1 = Pfad zum Nachweis; schreibt Ausgabe und "Rueckgabe Sekunden" nach $NW_DIR
  local n="$1" id start rc
  id="$(basename "$(dirname "$n")")"
  start="$(date +%s)"
  if node "$n" > "$NW_DIR/$id.log" 2>&1; then rc=0; else rc=$?; fi
  echo "$rc $(( $(date +%s) - start ))" > "$NW_DIR/$id.rc"
}

lauf() {
  local liste=() gleichzeitig=() allein=() n id rc sek schlecht=0 t0
  mapfile -t liste
  if [ "${#liste[@]}" -eq 0 ]; then
    echo "::error::kein previews/*/pruefen.js ausgewaehlt"; return 1
  fi
  NW_DIR="$(mktemp -d)"; export NW_DIR
  export -f einer
  for n in "${liste[@]}"; do
    id="$(basename "$(dirname "$n")")"
    case " $ZEITKRITISCH " in
      *" $id "*) allein+=("$n") ;;
      *)         gleichzeitig+=("$n") ;;
    esac
  done
  t0="$(date +%s)"
  echo "Nachweise: ${#liste[@]} · davon zugleich je Runde: $PARALLEL · zeitmessende zuletzt: ${#allein[@]}"
  if [ "${#gleichzeitig[@]}" -gt 0 ]; then
    printf '%s\n' "${gleichzeitig[@]}" | xargs -P "$PARALLEL" -I{} bash -c 'einer "$1"' _ {}
  fi
  for n in "${allein[@]}"; do einer "$n"; done
  # Ausgabe in fester Reihenfolge, je Nachweis eine Gruppe
  for n in "${liste[@]}"; do
    id="$(basename "$(dirname "$n")")"
    if [ -s "$NW_DIR/$id.rc" ]; then read -r rc sek < "$NW_DIR/$id.rc"; else rc=99; sek='?'; fi
    echo "::group::$n ($sek s)"
    cat "$NW_DIR/$id.log" 2>/dev/null || echo "(keine Ausgabe)"
    echo "::endgroup::"
    if [ "$rc" -eq 0 ]; then
      echo "  bestanden : $n ($sek s)"
    else
      echo "::error file=$n::Rückgabe $rc (0 = bestanden, 1 = Abweichung, 2 = ungeprüft, 99 = kein Ergebnis)"
      schlecht=$((schlecht + 1))
    fi
  done
  echo "gelaufen: ${#liste[@]}, davon durchgefallen: $schlecht, Dauer: $(( $(date +%s) - t0 )) s"
  rm -rf "$NW_DIR"
  [ "$schlecht" -eq 0 ]
}

case "${1:-}" in
  auswahl) shift; auswahl "$@" ;;
  lauf)    lauf ;;
  *) echo "Aufruf: $0 auswahl <ereignis> [basis] | lauf" >&2; exit 2 ;;
esac
