# -*- coding: utf-8 -*-
"""Die Agentarium-Schicht. Sie erzeugt keine eigene Grafik: Sie bewegt
   dieselben Wirbel, die in Resonanz die Hand erzeugt. Ein Ball ist ein Kern,
   der unterwegs ist."""
import datetime
import io, json, os

# Name, Farbe (0..1), Platz auf der Uhr, Abstand von der Mitte, Rolle,
# Vorgabeplattform, Weise des Arbeitens, technische Kennung, Geltungsbereich,
# Verbote, Auftrag.
#
# ACHT SPIELER AUF DEM KREIS, gleichmäßig, alle 45 Grad, um 22,5 Grad
# gedreht. Dadurch sitzt niemand bei 90 Grad: Unten klafft eine Lücke von
# einer vollen Teilung, und dort steht Peter — knapp außerhalb (1,16).
# Der Kreis ist dort offen, wo der Mensch steht; nichts kommt herein oder
# geht hinaus außer durch ihn. Das ist euer eigener Satz als Geometrie.
#
# KENNUNG, BEREICH UND VERBOTE sind nicht erfunden: Sie stehen in
# relay/role-routing.json (`technical_id`, `scope`, `forbidden`). Wo das
# Feld dort fehlt, steht hier nichts — eine leere Angabe ist ehrlicher als
# eine ausgedachte. Der Auftragssatz ist aus
# governance/AG-ENGAGEMENT-001-team-brief-v1.md gekürzt.
#
# Die Plattform bestimmt den Platz AUSDRÜCKLICH NICHT. Welches Modell eine
# Aufgabe bekommt, wird je Aufgabe gewählt und steht am Ereignis.
AGENTEN = [
  ('peter',     0.11, 180, 1.28, 'Auftraggeber',  'mensch',  '', '', [], [],
   'Entscheidet. Ohne ihn wird nichts zusammengeführt und nichts veröffentlicht.'),
  ('nova',      0.86,  22.5, 1.00, 'Vision',        'chatgpt', 'erfinden',
   'create-vision-with-nova', ['vision', 'experience', 'vision_drift'],
   ['code', 'merge', 'publish', 'approve_release'],
   'Erlebnis und Vision entwickeln; eigene Vorschläge und Rückfragen erwünscht.'),
  ('atlas',     0.15,  67.5, 1.00, 'Orchestrator',  'chatgpt', '',
   'operate-as-atlas', [], [],
   'Koordiniert, aktiviert und motiviert. Routet Gegenfragen und gibt Antworten zurück; '
   'offene Klärung wird nicht durch eine erfundene Antwort ersetzt.'),
  ('cadence',   0.60, 112.5, 1.00, 'Prozess',       'claude',  'ordnen',
   'process-agent', ['process_maintenance', 'process_improvement'], [],
   'Hält den Prozess instand und verbessert ihn; erkennt doppelte Arbeit.'),
  ('scout',     0.41, 157.5, 1.00, 'Recherche',     'chatgpt', 'holen',
   'build-research-knowledge', [], [],
   'Baut Wissen auf. Sortiert Fundstücke aus und revidiert Regeln an Gegenbeispielen.'),
  ('forge',     0.02, 202.5, 1.00, 'Entwicklung',   'claude',  'bauen',
   'coding-agent', ['implementation'], [],
   'Baut. Meldet technische Abhängigkeiten selbst, statt sie zu umgehen.'),
  ('sentinel',  0.34, 247.5, 1.00, 'Qualität',      'chatgpt', 'takten',
   'qa-agent-sentinel', [], [],
   'Stellt Fehler nach, prüft Regressionen und benennt die Grenzen der Prüfung.'),
  ('archibald', 0.50, 292.5, 1.00, 'Spezifikation', 'claude',  'schaerfen',
   'spec-agent', ['specification'], [],
   'Macht Anforderungen prüfbar und verlangt unterscheidbare Ergebnisse.'),
  ('argus',     0.73, 337.5, 1.00, 'Review',        'chatgpt', 'pruefen',
   'review-agent-argus', [], [],
   'Hinterfragt aktiv, auch scheinbar Harmloses; liefert Gegenbeispiele statt Meinungen.'),
]

# ====================================================================
# DIE MAPPINGTABELLE
#
# Sie ist die einzige Quelle: Aus ihr kommt das Verhalten UND die Legende
# im Bild. Eine Art zu ändern ändert beides mit einem Griff; eine veraltete
# Legende ist damit unmöglich.
#
# Das Gesetz in einem Satz, damit man es lernen kann:
#
#     Nur Beschlossenes bleibt. Verkehr verblasst. Offenes hinterlässt nichts.
#
# Die drei Zustände werden von ZWEI verschiedenen Trägern gehalten, und das
# ist nicht Umstand, sondern Befund:
#
#   abgabe    ob die Nachricht in den Niederschlag schreibt — die Schicht,
#             die nicht vergeht. 1 oder 0, nichts dazwischen.
#   nachhall  wie lange ihre Fäden IM MEDIUM weiterleben, nachdem sie
#             angekommen ist. Sekunden. Das Medium vergeht von selbst.
#
# Warum zwei Träger und nicht ein Helligkeitswert: nachgemessen in fünf
# Läufen. Der Niederschlag hat genau zwei stabile Ausgänge, null und für
# immer. Das Verblassen teilt ihn bei 76 von 255; unterhalb zieht es 6 von
# 255 je Sekunde ab, also ist dort in acht Sekunden alles fort, ganz egal
# welche Halbwertszeit daneben steht — oberhalb zieht es nichts ab und es
# vergeht nie. Eine Übergabe mit Abgabe 0,35 landete bei 225 und blieb ewig,
# mit 0,12 bei 79 und fror einen Punkt über der Kante ein, mit 0,05 war sie
# nach 15 s auf null. Ein mittleres Band im Shader habe ich gebaut und wieder
# ausgebaut: Sein sanfter Abzug liegt unter dem 8-Bit-Boden und rundet auf
# null, und auf dem Weg nach unten frisst es auch das, was bleiben soll — ein
# Beschluss stand nach 50 s bei 90 statt bei 246.
# Die Helligkeit kann die Dauerhaftigkeit nicht tragen, weil sie schon die
# Stärke trägt. Zwei Bedeutungen, eine Anzeige.
#
#   bleibt     abgabe 4 — schreibt in den Niederschlag.
#              Die 4 ist gemessen: Solange das Medium selbst mitschrieb,
#              genügte 1 (es kam auf 246 von 255). Als das Leck geschlossen
#              war, trugen die Nachrichten die Schicht allein — und ein
#              Beschluss kam nur noch auf 32 und war nach 20 s bei 3, weil er
#              die Schwelle 76 nie erreichte. Dazu kommt die Aufnahmebremse
#              der Fläche: Wo schon Farbe liegt, nimmt sie bis zu 92 % weniger
#              an, damit das Bild nicht zuläuft. Ein Beschluss muss also
#              kräftiger auftragen als ein einzelner Faden — und mehr Fäden
#              mitbringen, siehe Knoten.
#   verblasst  abgabe 0, nachhall lang — war sichtbar da, dünnt aus, ist
#              dann fort. Geschichte, die nichts hinterlässt.
#              Die Dauer war erst 8 bis 13 Sekunden. Bei drei Strängen war
#              das Geschichte; bei sieben parallelen Strängen wurde daraus
#              ein Vorhang aus farbigen Fäden, der den Ablauf verdeckte
#              statt ihn zu erzählen. Jetzt 3,0 bis 3,8 Sekunden — immer
#              noch das Drei- bis Vierfache von „hinterlässt nichts"
#              (0,8 bis 1,1 s), also trägt die Unterscheidung weiter.
#              Die Lehre: Eine Dauer, die bei kleiner Last richtig ist,
#              ist bei großer Last ein Vorhang. Sichtbarkeit muss sich an
#              der dichtesten Stelle bewähren, nicht an der ruhigsten.
#   nichts     abgabe 0, nachhall kurz — nur solange die Nachricht fliegt.
#
# Der goldene Ball ist DIE AUFGABE, und sie wird weitergespielt: Peter wirft
# sie an, und jede Übergabe spielt denselben Ball weiter. Damit man trotzdem
# sieht, wer spielt, hat der weitergespielte Ball einen goldenen Kern und
# einen Saum in der Farbe dessen, der ihn wirft. Peters erster Wurf ist ganz
# golden und am größten — er ist der Anstoß.
#
# ARBEIT: Wer einen Ball bekommt, arbeitet. Sichtbar wird das als ein kleiner,
# langsam kreisender Wirbel an seinem Platz — in Resonanz ist Kreisen die
# Geste, mit der etwas entsteht; hier kreist der Agent selbst. Er hört auf,
# sobald er etwas von sich gibt. Arbeit hinterlässt nichts, solange sie
# dauert: Erst ihr Ergebnis schreibt.
#
# gestalt   pfeil  = Strang mit hellem Kopf und zwei Barten, zeigt Richtung
#           wurf   = ein Ergebnis mit Masse; läuft nach dem Ankommen weiter
#           gegen  = der Faden dreht quer weg, der Wirbel dreht dagegen
#           bersten= zerspringt in Funken
# ====================================================================
ARTEN = {
  # Art            Niederschlag  Nachhall  Gestalt          Kraft Tempo
  'request':       dict(abgabe=0.0, nachhall=3.8,  gestalt='sonne',   kraft=0.95, tempo=0.55,
                        gross=1.0, was='Peter wirft den goldenen Ball an'),
  'handoff':       dict(abgabe=0.0, nachhall=3.2,  gestalt='sonne',   kraft=0.72, tempo=0.85,
                        gross=0.48, was='Ein Stück vom Ball wird abgeworfen'),
  'answer':        dict(abgabe=0.0, nachhall=3.0,  gestalt='pfeil',   kraft=0.62, tempo=1.2,
                        was='Antwort auf eine Rückfrage'),
  'contribution':  dict(abgabe=0.0, nachhall=3.0,  gestalt='wurf',    kraft=0.62, tempo=1.0,
                        was='Beitrag zurückgegeben'),
  'proposal':      dict(abgabe=0.0, nachhall=3.6,  gestalt='wurf',    kraft=0.68, tempo=1.0,
                        was='Vorschlag, noch nicht beschlossen'),
  'recommendation':dict(abgabe=0.0, nachhall=3.6,  gestalt='wurf',    kraft=0.64, tempo=1.0,
                        was='Empfehlung, noch nicht beschlossen'),

  'question':      dict(abgabe=0.0, nachhall=0.9,  gestalt='pfeil',   kraft=0.45, tempo=1.5,
                        was='Rückfrage, noch unbeantwortet'),
  'objection':     dict(abgabe=0.0, nachhall=1.1,  gestalt='gegen',   kraft=0.85, tempo=1.5,
                        was='Widerspruch aus dem Review'),
  'change_request':dict(abgabe=0.0, nachhall=1.1,  gestalt='gegen',   kraft=0.70, tempo=1.3,
                        was='Änderung verlangt'),
  'defect':        dict(abgabe=0.0, nachhall=0.8,  gestalt='bersten', kraft=0.90, tempo=1.8,
                        was='Fehler gefunden'),
  'open_state':    dict(abgabe=0.0, nachhall=0.9,  gestalt='pfeil',   kraft=0.38, tempo=0.6,
                        was='etwas bleibt offen'),

  # Ein Stop ist keine Nachricht, die fliegt - er ist ein Zustand, der
  # eintritt. Deshalb eine eigene Gestalt: Er bekommt eine Zeile in der
  # Liste und ein Schild am Platz, aber keinen Flug und keine Spur.
  'stop':          dict(abgabe=0.0, nachhall=0.0,  gestalt='zustand', kraft=0.0, tempo=1.0,
                        was='Ein Stop: der Betroffene kann nicht weiter'),
  'resume':        dict(abgabe=0.0, nachhall=0.0,  gestalt='zustand', kraft=0.0, tempo=1.0,
                        was='Der Stop ist aufgehoben'),

  'artifact':      dict(abgabe=4.0, nachhall=2.6,  gestalt='wurf',    kraft=0.95, tempo=0.9,
                        was='Ergebnis geliefert: Epics, Stories, Code'),
  'decision':      dict(abgabe=4.0, nachhall=2.6,  gestalt='wurf',    kraft=1.00, tempo=0.8,
                        was='Peter entscheidet'),
  'test_result':   dict(abgabe=4.0, nachhall=2.4,  gestalt='wurf',    kraft=0.80, tempo=1.1,
                        was='Prüfung bestanden'),
  'review_result': dict(abgabe=4.0, nachhall=2.4,  gestalt='wurf',    kraft=0.80, tempo=1.1,
                        was='Review abgeschlossen'),
}

SKRIPT = """
<script>
(function () {
  /* ====================================================================
     AGENTARIUM — die Kommunikation eines Agententeams, sichtbar gemacht.

     Die Maschine darunter ist Resonanz, unverändert: ein Medium aus
     14 000 Fäden, Wirbel, die es mitnehmen, und ein Niederschlag, der nur
     dort liegen bleibt, wo wirklich Resonanz war.

     Was hier dazukommt, ist allein die Quelle der Anregung. In Resonanz
     war es eine Hand. Hier ist es ein Team.

     Das Gesetz, und es ist das Wichtigste an dieser Fassung:

         Nur Beschlossenes bleibt. Verkehr verblasst. Offenes hinterlässt
         nichts.

     Vorher blieben Wirbel stehen, und niemand wusste, warum. Das war kein
     Darstellungsfehler, sondern ein fehlendes Gesetz: Es gab keinen Grund,
     an dem man ablesen konnte, weshalb etwas da war. Jetzt gibt es einen,
     und er steht in der Mappingtabelle — einer Tabelle, nicht im Code
     verstreut. Die Legende im Bild wird daraus erzeugt und kann deshalb
     nicht veralten.
     ==================================================================== */

  var AGENTEN = __AGENTEN__;
  var ARTEN = __ARTEN__;
  /* Mehrere Stücke auf derselben Bühne. Das war von Anfang an die
     Aufgabe — „je nachdem umschaltbar auf Protokolldaten" —, und es ist
     zugleich die Probe aufs Exempel: Wenn dieselbe Maschine ohne eine
     einzige Änderung ein anderes Stück spielt, ist sie wirklich agnostisch
     und wartet nur noch auf echte Daten. */
  /* DIE FASSUNG.

     Sie ist DIESELBE Nummer wie die der veröffentlichten Seite — kein
     zweiter Zähler, denn zwei liefen garantiert auseinander. Sie wird vor
     jeder Veröffentlichung erhöht, und die Veröffentlichung meldet
     anschließend ihre eigene Nummer zurück; gehen die beiden auseinander,
     fällt es sofort auf.

     Der Bauzeitpunkt kommt beim Bauen aus der Uhr. Von Hand gepflegte
     Datumsangaben sind nach der zweiten Änderung falsch. */
  var FASSUNG = '41', GEBAUT = '__GEBAUT__';

  /* DIE BETRIEBSART. Sie kommt aus den Daten; fehlt sie, gilt `demo`.
     Alles, was sich zwischen Prototyp und Produktivbetrieb unterscheidet,
     hängt an dieser einen Stelle — Selbststart, Neubeginn, welche Knöpfe
     es gibt, was die Uhr zeigt. */
  var MODUS = 'demo';
  var MODI = {
    demo:   { wort: 'Demo',   start: 1, neu: 1, vorn: 1,
              was: 'Spielt ein aufgezeichnetes Stück, beginnt danach von vorn.' },
    archiv: { wort: 'Archiv', start: 0, neu: 0, vorn: 1,
              was: 'Rückblick auf eine Aufzeichnung. Startet auf Knopfdruck, läuft einmal durch.' },
    live:   { wort: 'Live',   start: 0, neu: 0, vorn: 0,
              was: 'Wartet auf einen Strom von außen. Kein Selbststart, kein Neubeginn.' }
  };
  function modus() { return MODI[MODUS] || MODI.demo; }

  /* Ist ein Strom angeschlossen? Heute nie — es gibt noch keine
     Schnittstelle. Die Zeile steht trotzdem hier, weil alles, was von ihr
     abhängt, schon jetzt richtig sein soll: Ein Knopf, der nichts tun kann,
     wird nicht angezeigt. */
  var verbunden = false;

  var STUECKE = __STUECKE__;
  var stueckNr = 0;
  var STUECK = STUECKE[0];

  var nachName = {};
  AGENTEN.forEach(function (a) { nachName[a.name] = a; });

  /* Die Heimat jedes Agenten: ein Platz auf einem Ring. Er bleibt, auch wenn
     der Agent schweigt — damit man lernt, wer wo wohnt. */
  function W() { return window.__feld.W; }
  function H() { return window.__feld.H; }

  /* Die Mitte des KREISES ist nicht die Mitte des Bildes.
     Unten gedrängt standen Peter, Atlas und Cadence auf engem Raum — drei
     Namen in einem Viertel, während oben Platz war. Jetzt sitzt Peter
     links auf halber Höhe und der Kreis wandert nach rechts; die Lücke im
     Ring liegt bei 180 Grad, also genau ihm zugewandt.
     Das kostet die Symmetrie und gewinnt zwei Dinge: Luft zwischen allen
     Plätzen, und eine Komposition, die nicht aus der Mitte heraus gebaut
     ist. Beides ist eine Zeile — mitteVersatz zurück auf 0, und alles
     steht wieder, wie es stand. */
  /* DREI ORTE STATT ZWEI.

     Peters Einwand, und er ist der richtige: „Ich glaube, das Produkt muss
     aus dem Kreis wandern. Es steht ja auch in GitHub, das ist eine
     externe Komponente." Stimmt — der Kreis ist das TEAM. Was im Kreis
     liegt, gehört zum Team; eine Ablage, die außerhalb liegt und von außen
     gelesen wird, gehört dort nicht hinein.

     Also drei Orte von links nach rechts:

       PETER      wer es will     — am Spielfeldrand, außen
       DER KREIS  wer es baut     — die Mitte
       DIE ABLAGE was gebaut ist  — außen rechts, eingerahmt

     Dafür wandert der Kreis aus der Rechtslage zurück in die Mitte und
     wird etwas kleiner; sonst ist rechts kein Platz. Das nimmt Peters
     frühere Bitte („Kreis etwas außermittig nach rechts") zurück — ihr
     Grund war die Enge zwischen Peter, Atlas und Cadence, und die bleibt
     behoben, weil Peter mit 1,28 Radien weiterhin deutlich außen steht.
     Beides sind einzelne Zahlen und in einer Zeile wieder umzustellen. */
  /* DAS FELD RICHTET SICH NACH DEM PLATZ, DEN ES HAT.

     Vorher saß der Kreis bei einem festen Anteil der Breite und wusste
     nichts davon, dass links eine Liste steht und rechts zwei Tafeln. Auf
     einem breiten Schirm ging das gut, auf dem iPad überlagerte sich
     beides — Peters Befund. Ein fester Anteil ist eben kein Maß für freien
     Platz.

     Also wird gerechnet: Links beginnt das Band hinter der Liste, rechts
     endet es vor den Tafeln. In dieses Band passt ein Kreis vom Radius R,
     und zwar genau dann, wenn 2,34 R hineingehen — 1,28 R für Peter, der
     außerhalb steht, und 1,0 R für die andere Seite. Die Höhe deckelt
     zusätzlich.

     Die Liste ist im Hochformat schmaler als im Querformat; dieselbe Regel
     steht in den Stilangaben, und beide müssen übereinstimmen. */
  /* EIN TELEFON IST KEIN KLEINES IPAD.

     Gemessen über fünfzehn Fenstermaße: iPad, MacBook, HD, iMac und
     ultrabreit stehen sauber — kaputt waren nur die Telefone, und dort
     zweierlei. Hoch stieß die Liste unten links gegen den Block unten
     rechts und gegen die Knöpfe; quer ragten zwei Agentennamen in die
     rechte Spalte. Der Grund ist derselbe: Die Aufteilung reserviert
     links eine Listenspalte und rechts eine Textspalte, und auf 375
     Pixeln bleibt dazwischen kein Band übrig. `Math.max(56, …)` hat das
     verdeckt — der Boden gewann gegen das, was hineinpasst, und der Ring
     wurde größer als sein Platz.

     Also auf dem Telefon eine andere Aufteilung statt gequetschter
     gleicher: Der Ring nimmt die ganze Breite und sitzt mittig, die
     Liste rutscht nach unten über die Knöpfe, und der Stand unten rechts
     entfällt — er ist ohnehin der Block, der den Aufgabenzähler ein
     zweites Mal zeigt. */
  /* Wie tief der rechte Block reicht -- gemessen, nicht geschaetzt. Vor
     dem ersten Zeichnen ist er leer; dann gilt ein Ersatzwert, und beim
     naechsten Durchlauf stimmt die echte Hoehe. */
  function kopfUnten() {
    var e = document.getElementById('agRechts');
    if (!e) return 150;
    var u = e.getBoundingClientRect().bottom;
    return u > 20 ? u : 150;
  }
  function schmal() { return W() < 560; }                      /* Telefon hoch */
  function flach()  { return H() < 460 && W() < 1000; }        /* Telefon quer */
  function klein()  { return schmal() || flach(); }

  function listeBreite() {
    if (klein()) return Math.min(W() * 0.60, 230);
    return H() > W() ? Math.min(W() * 0.34, 240)
                     : Math.min(W() * 0.42, 330);
  }
  function bandL() {
    /* Quer steht die Marke oben links UND der Ring reicht bis an den
       linken Rand -- gemessen lag "sentinel" unter der Marke. Auf dem
       Schreibtisch haelt die Listenspalte diesen Platz frei; quer muss
       das die Marke selbst tun. Hoch ist der Ring tief genug unten, da
       genuegen 12 Pixel. */
    if (flach()) return Math.min(W() * 0.22, 160);
    return klein() ? 12 : listeBreite() + 18;
  }
  function bandR() {
    /* Rechts stehen drei Dinge übereinander: Kopf, Produkt, Stand der
       Arbeit. Sie teilen sich eine Spalte, und die muss breit genug für
       den längsten Projekttitel sein. Auf dem Telefon gibt es diese
       Spalte nicht — dort steht der Kopf über dem Feld, nicht daneben. */
    if (schmal()) return W() - 12;
    if (flach())  return W() - Math.min(W() * 0.24, 190);
    return W() - Math.min(W() * 0.30, 340);
  }
  function ringR() {
    var breit = bandR() - bandL(),
        /* Der Ring ist flachgedrückt: `heimat` rechnet die Höhe mit
           R * 0.92. Deshalb steht hier /0.92 — zweimal habe ich ihn beim
           Messen als Kreis gerechnet und einen Fehler gemeldet, den es
           nicht gab. */
        /* Wieviel Luft der Kopf braucht, haengt davon ab, WO er steht --
           und WIE HOCH er ist. Erst stand hier eine feste 150. Dann wurden
           Produkt und Stand zu einem Block zusammengelegt, der Block wurde
           hoeher, und auf dem Telefon standen wieder Namen darunter. Eine
           geratene Zahl ist beim naechsten Inhalt wieder falsch, also wird
           der Block gefragt. */
        hoch = schmal() ? (H() * 0.48 - (kopfUnten() + 18)) / 0.92
             : flach()  ? (H() * 0.50 - 60)  / 0.92
                        : (H() * 0.44 - 48)  / 0.92,
        passt = Math.min(breit / 2.34, hoch);
    /* KEIN Boden, der den Platz sprengt. Vorher stand hier
       Math.max(56, …): Auf 375 Pixeln passten 50, gesetzt wurden 56, und
       der Ring lief aus seinem Band. Ein Mindestmaß darf nie gegen das
       gewinnen, was hineinpasst. */
    return Math.max(klein() ? 30 : 56, passt);
  }

  function mx() {
    return klein() ? (bandL() + bandR()) / 2 : bandL() + ringR() * 1.28;
  }
  function my() {
    return schmal() ? H() * 0.48 : flach() ? H() * 0.50 : H() * 0.44;
  }

  function heimat(a) {
    var w = a.winkel * Math.PI / 180;
    var R = ringR() * (a.nah || 1);
    return [mx() + Math.cos(w) * R, my() + Math.sin(w) * R * 0.92];
  }

  var baelle = [];

  /* ==================================================== DIE ERWARTUNG ===
     Wer den Ball bekommt, macht sich bereit — kurz vorher, nicht erst beim
     Ankommen. Er schwillt an, und das Feld um ihn zieht sich zusammen:
     Aufmerksamkeit, bevor etwas da ist.

     Der Vorbehalt ist der wichtigere Teil: NUR, WENN DAS ZIEL FESTSTEHT.
     Geht eine Nachricht an niemanden — im Stück ist das der letzte
     `open_state`, „Kein Abschluss" —, macht sich niemand bereit. Eine
     Erwartung ohne Empfänger wäre eine Behauptung über die Zukunft, und
     davon hat dieses Bild keine. */
  var erwartung = {};

  function erwartungSchritt(dt) {
    for (var n in erwartung) {
      var Z = erwartung[n], A = nachName[n];
      Z.s -= dt * 2.4;                       /* klingt von selbst ab */
      if (Z.s <= 0 || !A) { delete erwartung[n]; weiterSagen(n, 0); continue; }
      weiterSagen(n, Z.s);
      /* Das Feld zieht sich zusammen: Fäden von außen nach innen, kurz,
         immer enger, je näher der Ball kommt. Dieselbe Richtung wie beim
         Einsturz — aber dort endet etwas, hier beginnt es, und der
         Unterschied steht im Ton: Einsturz ist hell und schnell, Erwartung
         ist leise und wird dichter. */
      var p0 = heimat(A);
      var r0 = Math.min(W(), H()) * (0.085 - 0.045 * Z.s);
      for (var k = 0; k < 3; k++) {
        var w = Math.random() * 6.2832;
        window.__feld.strang(p0[0] + Math.cos(w) * r0, p0[1] + Math.sin(w) * r0,
          -Math.cos(w) * 120 * Z.s, -Math.sin(w) * 120 * Z.s,
          0.10 + 0.16 * Z.s, 0.30 + 0.2 * Math.random(), A.farbe, 0);
      }
    }
  }

  /* Der Name schwillt an. Das Maß kommt von der Erwartung selbst, damit
     Anschwellen und Zusammenziehen dasselbe sagen. */
  function weiterSagen(name, s) {
    if (!ring.children.length) return;
    for (var i = 0; i < AGENTEN.length; i++) {
      if (AGENTEN[i].name !== name) continue;
      var e = ring.children[i];
      if (!e) return;
      if (s > 0.02) {
        e.style.transform = 'translate(-50%,-50%) scale(' +
          (1 + 0.30 * s).toFixed(3) + ')';
        e.classList.add('faengt');
      } else {
        e.style.transform = 'translate(-50%,-50%)';
        e.classList.remove('faengt');
      }
      return;
    }
  }

  /* ====================================================== DIE SCHLEUSE ==
     Drei der acht Agenten laufen auf Claude Code, fünf auf ChatGPT, einer
     ist ein Mensch — bindend festgelegt in relay/role-routing.json. Das ist
     keine Nebensache: Eine Nachricht zwischen den Lagern geht über eine
     Schnittstelle. Sie kostet Zeit, sie kostet Geld, und sie kann
     scheitern. Innerhalb eines Lagers nicht.

     Die Schleuse ist deshalb kein Ort, sondern ein Ereignis: Sie entsteht
     dort, wo die Bahn die Grenze quert, und nur dann. Zwei Backen quer zur
     Fahrt, der Ball schlägt hindurch. Hätte ich die Lager räumlich
     getrennt und eine feste Naht gezogen, sähe jede Nachricht so aus, als
     käme sie von weit her — auch die, die im eigenen Lager bleibt. */
  function quert(a, b) {
    var x = nachName[a], y = nachName[b];
    return !!(x && y && x.platt !== y.platt);
  }

  function schleuse(b, x, y, gx, gy) {
    var L = Math.hypot(gx, gy) || 1, ex = gx / L, ey = gy / L;
    for (var s = -1; s <= 1; s += 2) {
      for (var k = 0; k < 7; k++) {
        var d2 = (13 + k * 7) * s;
        window.__feld.strang(x - ey * d2, y + ex * d2,
          -ex * 55 * (1 - k / 9), -ey * 55 * (1 - k / 9),
          0.44 - k * 0.04, 0.45 + 0.3 * Math.random(), b.ton, 0);
      }
    }
    window.__feld.austreiben(x, y, b.ton, 2, 0);
  }

  /* Wie lange ein Wurf fliegt — und zwar so, dass er ANKOMMT, bevor der
     Empfänger handelt.

     Der Befund, der dazu geführt hat: Seit Peter links steht, ist seine
     Strecke zu Atlas 509 px lang; bei Tempo 0,55 („eine Aufgabe hat
     Masse") sind das 3,56 Sekunden. In V1 verteilt Atlas aber schon bei
     t=3 weiter. Der Ball war also noch in der Luft, während der Empfänger
     ihn bereits weitergab — eine Unmöglichkeit, und sie entstand nicht aus
     den Daten, sondern aus meiner Anordnung.

     Die Flugzeit richtet sich deshalb nach dem nächsten Ereignis des
     Empfängers: Sie wird so weit gekürzt, dass 0,4 Sekunden Luft bleiben.
     Die Daten geben den Takt, nicht die Geometrie — und wer die Plätze
     verschiebt, verschiebt damit nie die Kausalität. */
  function flugdauer(E, m, p0, z0) {
    var d = Math.max(0.9, Math.hypot(z0[0]-p0[0], z0[1]-p0[1]) / (260 * m.tempo));
    if (!E.an) return d;
    for (var i = 0; i < STUECK.ereignisse.length; i++) {
      var N = STUECK.ereignisse[i];
      if (N.t <= E.t || N.von !== E.an) continue;
      var luft = (N.t - E.t) - 0.4;
      if (luft < d) d = Math.max(0.45, luft);
      break;
    }
    return d;
  }

  function wirf(E) {
    var A = nachName[E.von], B = nachName[E.an] || A;
    var p = heimat(A), z = heimat(B);
    var m = ARTEN[E.art] || ARTEN.handoff;
    /* Widerspruch, Änderung und Fehler treffen die Sache, nicht die Person
       — solange eine Sache auf dem Tisch liegt. Liegt nichts dort, gehen
       sie wie bisher an den Platz des Empfängers; es gibt dann ja nichts,
       worauf sie sich beziehen könnten. */
    var aufTisch = (m.gestalt === 'gegen' || m.gestalt === 'bersten') && tisch.length;
    var zielNr = tisch.length - 1;
    if (aufTisch) {
      /* Gegen WAS richtet sich der Widerspruch? Steht `prueft` oder
         `ersetzt` in den Daten, gegen genau das. Sonst gegen das neueste
         auf dem Tisch — in V2 ist das in hundert Prozent der Fälle eine
         Rateentscheidung. */
      var ziel = E.prueft || E.ersetzt || '';
      var gefunden = -1;
      if (ziel) {
        for (var qt = 0; qt < tisch.length; qt++)
          if (tisch[qt].artefakt === ziel) { gefunden = qt; break; }
      }
      if (gefunden < 0) {
        if (tisch.length > 1) ratVermerk('gegen');
      } else zielNr = gefunden;
      z = tischOrt(zielNr);
    }

    /* Ein Stück wird vom Ball abgeworfen, also startet es am Ball und nicht
       am Namensschild dessen, der es wirft. Das ist der sichtbare
       Unterschied zwischen „noch ein Ball" und „ein Stück von DEM Ball". */
    var gross = m.gross || 1;
    if (m.gestalt === 'sonne' && derBall && derBall.bei === E.von) {
      p = ballOrt();
      /* Zurück an den, der sie angeworfen hat: Dann fliegt der Ball selbst,
         nicht ein Stück. */
      if (E.an === derBall.ursprung) { E = Object.create(E); E.gross = 0.92; derBall = null; }
    }
    baelle.push({
      x: p[0], y: p[1], zx: z[0], zy: z[1],
      u: 0, dauer: flugdauer(E, m, p, z),
      ton: A.farbe, tonZ: B.farbe,
      kraft: m.kraft,
      abgabe: m.abgabe,
      nachhall: m.nachhall,
      /* Die Größe steht im Ereignis, nicht in der Art: Sie ist die Zeit,
         die im Stück an der Aufgabe gearbeitet wird (3 bis 70 Sekunden),
         als Wurzel genommen, damit die FLÄCHE des Balls der Dauer folgt
         und nicht sein Durchmesser. Ein 70-Sekunden-Auftrag soll nicht
         zehnmal so groß aussehen wie ein 7-Sekunden-Auftrag. */
      gross: (E.gross != null ? E.gross : gross),
      kommando: E.kommando || '',
      modell: E.modell || '',
      tokens: E.tokens || null, kosten: E.kosten || 0,
      quelle: E.quelle || '',
      /* Die Aufgaben-ID muss MITFLIEGEN. Ohne diese Zeile kam sie nie beim
         Empfänger an: `arbeitAn` liest sie vom Ball, und der trug sie
         nicht. Gemessen — in V2 mit vollständigen Bezügen blieben acht
         Rateentscheidungen bei „welcher Auftrag endet" stehen, obwohl in
         den Daten für jede ein `erledigt` stand. Die Felder waren da, die
         Übergabe fehlte. */
      aufgabe: E.aufgabe || '',
      ganz: (m.gestalt === 'sonne' && (E.gross != null ? E.gross : gross) > 0.85),
      gegen:   m.gestalt === 'gegen',
      wurf:    m.gestalt === 'wurf' || m.gestalt === 'sonne',
      bersten: m.gestalt === 'bersten',
      sonne:   m.gestalt === 'sonne',
      folgen: E.folgen || 1,
      aufTisch: !!aufTisch, zielNr: zielNr,
      quert: quert(E.von, E.an), durch: 0,
      /* Hereingeworfen oder zurückgegeben: beides quert den Spielfeldrand. */
      einwurf: (nachName[E.von] && nachName[E.von].nah > 1.1) ||
               (nachName[E.an] && nachName[E.an].nah > 1.1),
      art: E.art, text: E.text, von: E.von, an: E.an, kern: null, ende: 0, kopf: 0
    });
    /* Der Einsatz. Atlas sitzt am ersten Pult, und ein Konzertmeister
       zeigt an, wer dran ist — bevor der Ton kommt, nicht danach. Also
       ein kurzer Strich von seinem Platz in die Richtung dessen, der
       gleich spielt. Nur von ihm, nur bei einer Übergabe: Sonst wäre es
       eine Verzierung an jeder Nachricht statt einer Geste von einem. */
    if (E.von === 'atlas' && m.gestalt === 'sonne') {
      var ap = heimat(nachName.atlas);
      var ex = z[0] - ap[0], ey = z[1] - ap[1], el = Math.hypot(ex, ey) || 1;
      for (var q = 0; q < 9; q++) {
        var ff = q / 9, ll = Math.min(W(), H()) * 0.075 * (0.3 + ff);
        window.__feld.strang(ap[0] + ex / el * ll, ap[1] + ey / el * ll,
          ex / el * 320, ey / el * 320,
          0.30 * (1 - ff * 0.6), 0.28 + 0.14 * Math.random(),
          nachName.atlas.farbe, 0);
      }
    }

    /* Beim ABSENDER sieht man jetzt, dass etwas von ihm weggeht. Peter hat
       beobachtet, Scout und Nova bekämen Bälle und gäben nichts zurück.
       Sie geben sehr wohl — Nova liefert in V2 vier Vorschläge —, aber ein
       Ergebnis fliegt als Wurf und nicht als Ball, und am Platz des
       Absenders passierte bisher gar nichts. */
    if (m.gestalt === 'wurf' || m.gestalt === 'sonne') {
      var sx0 = z[0] - p[0], sy0 = z[1] - p[1], sl0 = Math.hypot(sx0, sy0) || 1;
      for (var qq = 0; qq < 11; qq++) {
        var fq = qq / 11, rq0 = Math.min(W(), H()) * 0.050 * (0.25 + fq);
        window.__feld.strang(p[0] + sx0 / sl0 * rq0, p[1] + sy0 / sl0 * rq0,
          sx0 / sl0 * 260, sy0 / sl0 * 260,
          (0.26 + 0.26 * m.kraft) * (1 - fq * 0.55),
          0.30 + 0.16 * Math.random(), A.farbe, 0);
      }
    }

    stromZeile(E, m);
    melden(E.von, E.an, E.art, E.text, m);
  }

  /* Eine Nachricht ist kein Punkt, der fliegt, sondern eine Spur, die
     entsteht. Drei Dinge aus Resonanz tragen sie:

       Strang     der Faden, den sie unterwegs legt — ihre Bahn
       Strömung   der Sog, den sie hinterlässt; das Medium läuft ihr nach
       Knoten     das Ankommen: ein Lichtpunkt dort, wo sie landet

     Und sie ist ein Pfeil, nicht ein Streifen. Dafür sorgen zwei Dinge:
     Der Faden wird nach hinten dünner und kürzer, und am Kopf laufen zwei
     kurze Barten nach hinten weg. Damit ist die Richtung ablesbar, ohne
     dass irgendwo eine Pfeilspitze gezeichnet werden müsste — es sind
     dieselben Fäden wie überall. */
  function ballSchritt(b, dt) {
    if (!b.kern) {
      b.kern = window.__feld.kern(b.x, b.y);
      b.kern.fest = 0;
      b.lx = b.x; b.ly = b.y;
    }
    var K = b.kern;
    var vorher = b.u;
    b.u += dt / b.dauer;
    var u = Math.min(1, b.u);
    var e = u * u * (3 - 2 * u);
    var x = b.x + (b.zx - b.x) * e, y = b.y + (b.zy - b.y) * e;
    var bogen = Math.sin(u * Math.PI);
    var ton = b.ton + (b.tonZ - b.ton) * e;

    /* Geworfen heißt: im Bogen. Alles andere hier läuft auf der Sehne von
       Platz zu Platz, und das ist für eine Nachricht richtig — sie wird
       zugestellt. Eine Aufgabe wird geworfen, und der Bogen ist der
       Unterschied, den man ohne Erklärung sieht. Er geht quer zur Flugrichtung
       und immer zur oberen Seite: nach oben geworfen, von der Schwere
       heruntergeholt. */
    if (b.sonne) {
      var ax = b.zx - b.x, ay = b.zy - b.y, aL = Math.hypot(ax, ay) || 1;
      var qx2 = ay / aL, qy2 = -ax / aL;
      if (qy2 > 0) { qx2 = -qx2; qy2 = -qy2; }
      /* Ein Einwurf von draußen fliegt höher als eine Weitergabe im Feld —
         er muss über den Rand. Peters Wurf bekommt deshalb den doppelten
         Bogen. */
      var hub = bogen * aL * (b.einwurf ? 0.42 : 0.22);
      x += qx2 * hub; y += qy2 * hub;
    }

    /* --- unterwegs: Strang, Strömung, Pfeilkopf ----------------------- */
    /* Kurz vor dem Ankommen: Der Empfänger macht sich bereit. Nur beim
       Ball, und nur wenn jemand ihn auch bekommt — sonst zuckte bei jeder
       der 34 Nachrichten jemand, und aus Aufmerksamkeit würde Zappeln. */
    if (b.sonne && b.an && b.an !== b.von && nachName[b.an] && !b.ende) {
      var vor = Math.min(0.45, b.dauer * 0.30) / b.dauer;
      if (b.u > 1 - vor) {
        var st = Math.min(1, (b.u - (1 - vor)) / vor);
        var Z = erwartung[b.an] || (erwartung[b.an] = { s: 0 });
        if (st > Z.s) Z.s = st;
      }
    }

    /* Die Grenze liegt auf halbem Weg: Dort ist das Tor. */
    if (b.quert && !b.durch && b.u >= 0.5) {
      b.durch = 1;
      schleuse(b, x, y, b.zx - b.x, b.zy - b.y);
    }

    if (vorher < 1) {
      var gx = (x - b.lx) / Math.max(dt, 1e-4), gy = (y - b.ly) / Math.max(dt, 1e-4);
      var tempo = Math.hypot(gx, gy);

      /* --------------------------------------------- Der Sonnenball ---
         Er legt keinen Faden. Ein Faden hat in Resonanz einen Schweif in
         Bewegungsrichtung, und der Wirbel zieht ihn in die Länge — am
         Abwurfort wurde daraus ein goldener Igel statt eines Wurfs, weil
         der Ball dort noch fast steht und der Wirbel schon dreht. Korn
         hat keinen Schweif. Also ist der Ball von vorn bis hinten Korn:
         ein Kopf, der mit ihm fliegt, und ein Schweif, der abkühlt. */
      if (b.sonne && tempo > 1) {
        var rad = Math.min(W(), H()) * 0.019 * b.gross;

        /* Drei Schalen, weil eine Sonne drei hat — und weil eine einzige
           Schale im Abzug als lose Körnerwolke erschien statt als Körper.
           Was einen Körper macht, ist der Rand nach innen: weiß in der
           Mitte, golden im Leib, amber am Saum.

           Die Hitzen sind am Shader abgelesen, nicht geschätzt. Weiß wird
           ab Glut 0,62, und Glut ist `hz * 0,80 + (hl - 0,45) * 0,55`; mit
           hl = 0,70 heißt das: Hitze 0,88 gibt den weißglühenden Kern,
           0,70 den goldenen Leib, 0,48 den amberfarbenen Saum.

           Die Punkte bekommen fast KEINE Geschwindigkeit mit (0,15 statt
           1,0). Das ist der Unterschied zwischen einer Kugel und einem
           Kometen: Mit voller Fluggeschwindigkeit flogen sie dem Ball
           voraus und zogen sich über die halbe Strecke auseinander — im
           Abzug ein goldenes Band quer durchs Bild. Der Ball bewegt sich
           nicht, weil seine Punkte fliegen, sondern weil er in jedem Bild
           an der neuen Stelle neu gesetzt wird. Was vom letzten Bild noch
           liegt, ist von selbst sein Schweif. */
        var mit = 0.15;
        window.__feld.sonne(x, y, gx * mit, gy * mit, rad * 0.38, 0.88, 0.115, 0, 26);
        window.__feld.sonne(x, y, gx * mit, gy * mit, rad,        0.70, 0.115, 0, 70);
        /* Der Saum trägt die Farbe dessen, der wirft — bei Peters erstem
           Wurf ist das ohnehin Gold (0,11), bei einer Übergabe sieht man
           daran, wer gerade spielt. Der Kern bleibt immer golden: Es ist
           dieselbe Aufgabe. */
        window.__feld.sonne(x, y, gx * mit, gy * mit, rad * 1.75, 0.48,
          b.gross < 1 ? b.ton : 0.115, 0, 34);
        window.__feld.stroemung(x, y, gx * 0.85, gy * 0.85, dt);
        b.lx = x; b.ly = y;
      }

      if (!b.sonne && tempo > 1) {
        var weg = Math.hypot(x - b.lx, y - b.ly);
        /* Der Strang wird entlang der zurückgelegten Strecke gelegt, nicht
           je Bild einmal — sonst reißt er bei niedriger Bildrate auf. */
        var n = Math.min(14, Math.max(1, Math.round(weg / 7)));
        /* Ein Widerspruch läuft nicht geradeaus: Sein Faden dreht quer zur
           Fahrt weg, und der Wirbel dreht ohnehin dagegen. */
        var qx = b.gegen ? -gy * 0.42 : 0, qy = b.gegen ? gx * 0.42 : 0;
        /* Wie viel von der Fluggeschwindigkeit der Faden mitnimmt. Das ist
           nicht Geschmack, sondern der Unterschied zwischen einer Bahn und
           einer Wolke: Nachgemessen war die Spur einer Übergabe nach zehn
           Sekunden auf Helligkeit 8 herunter — nicht weil die Fäden starben
           (sie leben elf Sekunden), sondern weil sie mit dem vollen Schwung
           der Nachricht davonflogen und sich über das ganze Feld verteilten.
           Was als Geschichte lesbar bleiben soll, muss liegen bleiben. */
        /* 0,30 liess die Spur liegen, damit sie als Bahn lesbar bleibt.
           Bei sieben Strängen häuft sich das an denselben Stellen. Mit
           0,55 zieht sie sich mehr in die Länge und löst sich schneller
           ins Feld auf, ohne dass die Bahn verlorengeht. */
        var zug = b.nachhall > 2 ? 0.55 : 1.0;
        for (var i = 0; i < n; i++) {
          var f = (i + 1) / n;
          var sx = b.lx + (x - b.lx) * f + (Math.random() - 0.5) * 4;
          var sy = b.ly + (y - b.ly) * f + (Math.random() - 0.5) * 4;
          window.__feld.strang(sx, sy,
            (gx * zug + qx) * (0.80 + 0.3 * Math.random()),
            (gy * zug + qy) * (0.80 + 0.3 * Math.random()),
            /* Hinten dünn, vorn hell: der Pfeil. */
            /* Zwei Verjüngungen, und sie meinen Verschiedenes:
                 (0,30 + 0,70 f) über den Abschnitt DIESES Bildes — das ist
                 der Pfeil, hinten dünn, vorn hell.
                 (0,30 + 0,70 (1-u)) über die GANZE Bahn — die Spur wird zum
                 Ziel hin schwächer, weil dort der Knoten das Ankommen sagt.
               Ohne die zweite staut sich die Spur am Ankunftsort: Der Ball
               wird dort langsamer (die Bahn ist weich ein- und ausgeblendet),
               also fallen viele Bilder auf wenige Pixel, und jedes legt
               seinen hellsten Abschnitt. Im Abzug waren das Flügel an
               Forge, Sentinel und Nova — mehr Masse als die Nachricht
               selbst. */
            (0.12 + 0.34 * b.kraft) * (0.30 + 0.70 * f)
              * (0.30 + 0.70 * (1 - u)) * (0.55 + 0.45 * bogen),
            /* Und hier hängt der zweite Zustand: Wie lange der Faden lebt,
               ist die Dauer, die die Nachricht sichtbar bleibt, nachdem sie
               vorbei ist. Ein Verkehrsfaden hält elf Sekunden und dünnt
               aus — das ist Geschichte. Eine Frage hält eine. */
            (0.30 + 0.70 * f) * b.nachhall,
            ton, b.abgabe);
        }

        /* Der Kopf: zwei kurze Barten nach hinten, wie bei einem Pfeil.
           Beim Sonnenball nicht — ein Körper hat keine Pfeilspitze. */
        b.kopf -= dt;
        if (b.kopf <= 0) {
          b.kopf = 0.085;
          var ri = Math.atan2(gy, gx), L = 13 + 15 * b.kraft;
          for (var s = -1; s <= 1; s += 2) {
            var w2 = ri + Math.PI + s * 0.62;
            for (var k = 0; k < 5; k++) {
              var g2 = (k + 1) / 5;
              window.__feld.strang(
                x + Math.cos(w2) * L * g2, y + Math.sin(w2) * L * g2,
                gx * 0.55 + Math.cos(w2) * 40, gy * 0.55 + Math.sin(w2) * 40,
                (0.30 + 0.45 * b.kraft) * (1 - g2 * 0.55),
                /* Die Barten sind der Kopf, nicht die Spur: Sie müssen kurz
                   leben, sonst wird aus dem Pfeil ein breites Band. */
                0.30 + 0.30 * (1 - g2),
                ton, b.abgabe);
            }
          }
        }
        window.__feld.stroemung(x, y, gx * 0.85, gy * 0.85, dt);
      }
      b.lx = x; b.ly = y;
    }

    /* --- der Wirbel: was die Nachricht im Feld anrichtet ---------------
       Er war zu groß und zu schnell: Bei neun Agenten und mehreren
       Nachrichten gleichzeitig verrührten sich die Bahnen zu einem Brei,
       in dem keine Nachricht mehr zu verfolgen war. Jetzt ist er klein
       genug, dass der Pfeil die Hauptsache bleibt, und langsam genug, dass
       man seinen Umlauf sieht statt nur ein Flimmern. */
    K.x = x; K.y = y;
    K.ton = ton;
    K.hell = 0.35 + 0.5 * b.kraft;
    K.r = Math.min(W(), H()) * (0.013 + 0.021 * b.kraft) * (b.sonne ? 0.55 : 1);
    K.om = (b.gegen ? -1 : 1) * (1.7 + 3.1 * b.kraft) * (0.35 + 0.65 * bogen)
         * (b.sonne ? 0.06 : 1);
    /* Die Stärke bleibt voll — auch für den Ball, und das ist wichtig:
       `wach`, die globale Wachheit, mit der JEDER Faden im Bild multipliziert
       wird, folgt der stärksten Wirbelstärke. Ein Versuch, den Ball auf 0,05
       zu setzen, damit er das Feld nicht aufrührt, hat deshalb das ganze
       Bild auf 5 % Helligkeit gestellt — der Ball war kaum zu sehen, und
       ich hielt es für zu wenig Körner.
       Dass er nicht aufrührt, steht eine Zeile höher: Es ist die DREHUNG,
       die das Feld verwirbelt, nicht die Stärke. */
    K.s = Math.max(K.s, b.kraft * (0.26 + 0.34 * bogen));

    /* --- das Ankommen: der Knoten -------------------------------------- */
    if (b.u >= 1 && !b.ende) {
      b.ende = 1;
      /* Der Knoten ist das Ankommen. Was dort geschrieben wird, hängt an
         der Abgabe; wie lange er im Medium leuchtet, am Nachhall. */
      var schreibend = b.abgabe > 0;
      window.__feld.knoten(b.zx, b.zy,
        (0.34 + 0.40 * b.kraft) * (schreibend ? 1.0 : 0.62),
        b.tonZ, b.abgabe,
        /* Nicht Zierde: Die Fläche nimmt an einer Stelle, wo schon Farbe
           liegt, bis zu 92 % weniger an. Was bleiben soll, braucht deshalb
           VIELE Fäden, nicht nur helle. */
        schreibend ? 110 : 14,
        Math.min(4.2, 0.6 + 0.30 * b.nachhall));

      /* Und beim Aufschlag der Aufgabe: Der Ball platzt nicht, er sinkt ein.
         Ein letzter, großer Körper, der in die Matrix eintaucht. */
      if (b.sonne)
        window.__feld.sonne(b.zx, b.zy, 0, 0,
          Math.min(W(), H()) * 0.050, 0.78, 0.115, 0, 75);

      /* Aus einer Nachricht wird mehreres: Eine kleine Explosion, für jede
         Folge ein eigener kurzer Pfeil. Das ist der Augenblick, in dem aus
         einem Gedanken mehrere Epics werden — und er ist der einzige im
         Stück, der sich nicht aus der Bahn ergibt, sondern aus dem, was
         danach kam. Die Zahl steht in den Daten: caused_by. */
      if (b.folgen > 1)
        window.__feld.austreiben(b.zx, b.zy, b.tonZ,
          Math.min(7, b.folgen), b.abgabe);

      /* Novas Vorschlag schärft den Umriss des Produkts. Datenfeld: ein
         Ereignis von `nova` der Art `proposal`. */
      if (b.von === 'nova' && b.art === 'proposal') visionen++;

      /* Ein Fehler zerspringt. Er hinterlässt nichts — aber man sieht ihn. */
      if (b.bersten && window.__funkeAn) window.__funkeAn(b.zx, b.zy, b.tonZ);

      /* Der Ball ist angekommen: Jetzt arbeitet, wer ihn hat. */
      if (b.sonne) arbeitAn(b.an, b.text, b.kommando, b.modell, b);
      /* Ein ganzer Ball bleibt liegen — der Empfänger HAT jetzt die
         Aufgabe. Ein abgeworfenes Stück wird aufgenommen und ist weg: Es
         ist Arbeit daran, nicht die Aufgabe selbst. */
      if (b.ganz)
        derBall = { bei: b.an, ursprung: derBall ? derBall.ursprung : b.von,
                    t: 0, kommando: b.kommando };

      /* Ein Treffer auf dem Tisch lässt das Stück dort beben. */
      if (b.aufTisch && tisch.length) {
        var tn = Math.min(b.zielNr != null ? b.zielNr : tisch.length - 1,
                          tisch.length - 1);
        tisch[tn].beben = 1;
        tisch[tn].zurueck = 5.0;
        if (window.__funkeAn) window.__funkeAn(b.zx, b.zy, b.tonZ);
      }

      /* Nur was gilt, drückt den Wirbel über die Schwelle. Unter ihr
         schreibt die Maschine nicht — das ist dieselbe Schwelle, die in
         Resonanz entscheidet, ob ein Zug Farbe lässt.

         DIE DECKELUNG IST NICHT KOSMETIK, sie behebt einen Fehler, der
         lange unbemerkt mitlief. `abgabe` ist ein Maß dafür, wieviel eine
         Nachricht im Niederschlag HINTERLÄSST. Hier wurde dieselbe Zahl
         ein zweites Mal benutzt, nämlich als Wirbelstärke — und das ging
         gut, solange sie 1,0 war.

         Dann musste die Abgabe auf 4,0, weil `bleibt` sonst im Nichts
         verschwand (gemessen: drei von 255 statt zweihundert). Damit
         stieg, ohne dass es jemand wollte, die Wirbelstärke still von
         0,92 auf 2,42 — das Zweieinhalbfache. Und die Wirbelstärke ist
         nicht irgendeine Zahl: Die Wachheit des ganzen Feldes folgt dem
         größten Wirbel und multipliziert die Deckkraft JEDES Fadens. Nach
         jedem angenommenen Ergebnis stand deshalb das halbe Bild in
         Strähnen.

         Peters Befund dazu: „Mir bleiben hier wieder zu viele Haare,
         Fäden stehen, das war schon mal anders, oder?" Ja, war es — bis
         zu dem Commit, der die Abgabe vervierfacht hat.

         Die Lehre ist allgemeiner als der Fall: Eine Zahl, die zwei Dinge
         zugleich steuert, lässt sich für das eine nicht ändern, ohne das
         andere mitzuverstellen. Die Deckelung trennt die beiden wieder —
         der Niederschlag bekommt seine 4,0, der Wirbel seine 0,92. */
      if (b.abgabe > 0)
        K.s = Math.max(K.s, 0.42 + 0.50 * Math.min(1, b.abgabe));

      /* Der Wurf: Ein Ergebnis bleibt beim Empfänger nicht stehen. Es trägt
         seinen Schwung weiter und pflügt in das Feld, das schon da ist —
         genau der Wurf, den in Resonanz ein unvollendeter Kreis auslöst. */
      if (b.wurf) {
        var dx = b.zx - b.x, dy = b.zy - b.y, L2 = Math.hypot(dx, dy) || 1;
        K.dvx = dx / L2 * (120 + 190 * b.kraft);
        K.dvy = dy / L2 * (120 + 190 * b.kraft);
        K.fest = 0;
      }
    }

    /* Nach dem Ankommen: Was nichts hinterlässt, löst sich auch als Wirbel
       auf. Sonst stünde da weiter etwas, wofür es keinen Grund gibt — und
       genau das war der Befund. */
    if (b.ende && b.abgabe === 0) K.s *= Math.exp(-4.5 * dt);

    /* Der Wirbel ist nicht die Nachricht und auch nicht ihre Spur: Er ist
       das Werkzeug, mit dem sie etwas anrichtet. Wenn sie durch ist, ist er
       fort — sonst stünde da weiter etwas, wofür es keinen Grund gibt. Das
       war der Befund: „Sie verbleiben, aber niemand weiß warum." */
    var nachlauf = b.wurf ? 0.15 : (b.abgabe > 0 ? 0.8 : 0.3);
    if (b.u >= 1 + nachlauf) {
      if (b.abgabe === 0) { K.s = 0; K.fest = 0; }
      return false;
    }
    return true;
  }

  /* ======================================================== DER BALL ====
     Es gibt EINEN Ball. Er wird aufgenommen und weitergegeben, und solange
     ihn jemand hat, liegt er sichtbar an seinem Platz.

     Dreizehn fliegende Bälle waren falsch gelesen. Richtig ist, was in den
     Daten steht: Peter wirft die Aufgabe EINMAL an, und alle zwölf
     Übergaben danach gehen von Atlas aus. Einer hält sie, die anderen
     bekommen Stücke.

     Warum es überhaupt mehr als einen fliegenden Körper gibt, steht auch
     dort: E02 und E03 verlassen Atlas in derselben Sekunde, an Nova und an
     Scout. Die Arbeit gabelt sich. Ein Ball kann nicht an zwei Orten sein —
     also wird von ihm abgeworfen, statt dass er selbst fliegt. Jedes Stück
     ist knapp halb so groß, der Ball bleibt ganz: Wer delegiert, gibt die
     Aufgabe nicht ab, er gibt Arbeit daran ab.

     Zurück geht er nur an den, der ihn angeworfen hat — dann ist die
     Aufgabe wieder dort, wo sie herkam. Im Stück ist das E30, Atlas an
     Peter: „Ergebnis und verbleibende Grenzen zur Abnahme." */
  var derBall = null;      /* { bei, ursprung, t } */

  function ballOrt() {
    if (!derBall) return null;
    var p = heimat(nachName[derBall.bei]);
    /* Etwas neben dem Namen, damit er nicht darunter liegt. */
    var zm = Math.atan2(my() - p[1], mx() - p[0]);
    var d = Math.min(W(), H()) * 0.055;
    return [p[0] + Math.cos(zm) * d, p[1] + Math.sin(zm) * d];
  }

  function ballSchrittRuhend(dt) {
    if (!derBall) return;
    derBall.t += dt;
    var o = ballOrt(), rad = Math.min(W(), H()) * 0.021
          * (1 + 0.09 * Math.sin(derBall.t * 1.1));
    /* Derselbe Körper wie im Flug, nur ohne Fahrt: drei Schalen, weiß-
       glühender Kern, goldener Leib, amberfarbener Saum. Er atmet langsam —
       eine Aufgabe, die wartet, ist nicht tot. */
    window.__feld.sonne(o[0], o[1], 0, 0, rad * 0.38, 0.88, 0.115, 0, 20);
    window.__feld.sonne(o[0], o[1], 0, 0, rad,        0.70, 0.115, 0, 52);
    window.__feld.sonne(o[0], o[1], 0, 0, rad * 1.75, 0.48, 0.115, 0, 26);

  }

  /* ===================================================== DER EINSTURZ ===
     Ein vierter Ausgang, und er fehlte dem Gesetz.

       bleibt      schreibt in den Niederschlag.
       verblasst   vergeht an Ort und Stelle — Geschichte.
       nichts      war nur, solange es flog.
       VERWORFEN   wird weggerissen. Es vergeht nicht, es wird genommen.

     Der Unterschied ist nicht Geschmack: Verblassen heißt, etwas hat
     gegolten und ist jetzt vorbei. Verworfen heißt, es hat nie gegolten —
     und das soll man nicht als langsames Nachlassen lesen, sondern als
     Einsturz. Die Fäden fahren von außen nach innen auf einen Punkt zu,
     dort wird es einen Augenblick hell, und dann ist nichts mehr.

     Resonanz kann das von sich aus: Ein Wirbelkern verschluckt, was ihm zu
     nahe kommt. Hier ist es dieselbe Bewegung, nur ohne Wirbel. */
  function einsturz(x, y, ton) {
    for (var k = 0; k < 26; k++) {
      var w = Math.random() * 6.2832;
      var r = Math.min(W(), H()) * (0.030 + 0.030 * Math.random());
      var v = 150 + 170 * Math.random();
      window.__feld.strang(x + Math.cos(w) * r, y + Math.sin(w) * r,
        -Math.cos(w) * v, -Math.sin(w) * v,
        0.30 + 0.22 * Math.random(), 0.30 + 0.18 * Math.random(), ton, 0);
    }
    /* Der letzte Augenblick: hell, winzig, kurz — und ohne Abgabe. Was
       verworfen wird, hinterlässt nichts, auch nicht den Schrecken. */
    window.__feld.knoten(x, y, 0.85, ton, 0, 12, 0.30);
  }

  /* ====================================================== DER TISCH =====
     Die Mitte war leer, und das war eine verpasste Stelle: Ein Ring aus
     Plätzen hat eine Mitte, und in einem Team ist das keine Zierde, sondern
     der Tisch, auf den man legt, was geprüft werden soll.

     Was dort geschieht, steht nicht neben dem Gesetz, sondern vollendet es:

       Ein Ergebnis wird auf den Tisch gelegt und schreibt dort NICHTS —
       es ist geliefert, aber noch nicht angenommen.
       Widerspruch, Änderungswunsch und Fehler fliegen nicht mehr zum
       Platz des Empfängers, sondern auf den Tisch. Sie treffen die Sache,
       nicht die Person. Der Knoten beim Aufschlag trägt trotzdem die Farbe
       dessen, der antworten muss — man sieht also beides.
       Erst eine bestandene Prüfung oder ein abgeschlossenes Review nimmt
       das älteste Stück ab, und DANN schreibt es, in die Mitte, für immer.

     Damit wächst in der Mitte, was durch die Prüfung gegangen ist, und
     ringsherum liegt, was die Einzelnen beigetragen haben. Im Stück sind
     das vier Stücke auf dem Tisch (E08, E13, E25, E26) und zwei Abnahmen
     (E28 Prüfung bestanden, E29 Review abgeschlossen). */
  var tisch = [];
  var TISCH_MAX = 3;

  function tischOrt(i) {
    /* Weiter außen als früher: In der Mitte wächst jetzt das Produkt, und
       der Tisch ist der Ort DAVOR — man legt etwas hin, damit es dazu
       kommen darf. */
    var R = Math.min(W(), H()) * 0.135;
    var w = i * 2.0944 - 1.5708;
    return [mx() + Math.cos(w) * R, my() + Math.sin(w) * R * 0.9];
  }

  function hinlegen(ton, text, gearbeitet, artefakt, version, aufgabe) {
    var S0 = { ton: ton, text: text || '', t: 0, arbeit: gearbeitet || 0,
               artefakt: artefakt || '', version: version || '',
               aufgabe: aufgabe || '',
               w: Math.random() * 6.2832, beben: 0 };
    tisch.push(S0);

    /* Ins Register. Trägt das Stück dieselbe Kennung ein zweites Mal, ist
       die ältere Fassung ERSETZT — und genau das sieht man sonst nirgends:
       eine v2 ist der Beweis, dass nachgearbeitet wurde. */
    if (artefakt) {
      for (var r0 = 0; r0 < register.length; r0++)
        if (register[r0].kennung === artefakt && register[r0].zustand !== 'ersetzt')
          register[r0].zustand = 'ersetzt';
    }
    var eintrag = { kennung: artefakt || '', version: version || '',
                    ton: ton, zustand: 'prüfung', text: text || '',
                    von: '', t: zeit };
    S0.eintrag = eintrag;
    register.push(eintrag);
    while (register.length > 40) register.shift();
    /* Mehr als drei liest niemand mehr. Das älteste rutscht herunter —
       und es schreibt dabei nichts: Was nie angenommen wurde, hinterlässt
       nichts. Das ist dieselbe Regel wie überall. */
    while (tisch.length > TISCH_MAX) {
      var W2 = tisch.shift(), o2 = tischOrt(0);
      if (W2.eintrag && W2.eintrag.zustand === 'prüfung')
        W2.eintrag.zustand = 'verworfen';
      einsturz(o2[0], o2[1], W2.ton);
    }
  }

  /* ===================================================== DAS PRODUKT ====
     Alles fließt — Bälle, Arbeit, Prüfung, Abnahme —, und bisher lag am
     Ende ein heller Fleck in der Mitte. Ein Fleck ist kein Ergebnis. Es
     wurde nichts GEBAUT.

     Jede Abnahme setzt deshalb einen eigenen Baustein, an seinem eigenen
     Platz, in der Farbe dessen, der ihn gemacht hat. Die Plätze liegen auf
     einer Spirale von innen nach außen: Das erste Angenommene steht in der
     Mitte, jedes weitere legt sich darum. Nach vier Abnahmen sieht man
     vier Teile, nach zwanzig eine kleine Stadt.

     Dass sie bleibt, ist dasselbe Gesetz wie zuvor — nur hat es jetzt eine
     Gestalt statt eines Flecks: Was angenommen wurde, IST das Produkt.
     Und am Ausklang vergeht auch sie, denn dann ist das Stück vorbei und
     die Bühne wird für das nächste geräumt. */
  var produkt = 0;

  /* DAS PRODUKT STEHT AUF EINEM BODEN, IN EINER REIHE.

     Vorher lagen die Bausteine auf einer Spirale nach dem goldenen Winkel
     — mathematisch schön, aber es blieb eine Streuung: Jedes Teil ragte
     für sich nach oben, und nichts sagte, dass sie zusammengehören. Peters
     Befund war richtig: „Es hängt so zwischendrin und niemand weiß, was es
     bedeutet."

     Ein Produkt steht auf etwas. Also eine Grundlinie und darauf eine
     Reihe, die nach beiden Seiten wächst. Erst dadurch wird aus Höhe eine
     SILHOUETTE — und eine Silhouette erkennt man als Ding, auch wenn man
     nicht weiß, was es ist. Bei NACHTPOST, einer Stadt aus Lichtgebäuden,
     ist das keine Metapher, sondern die Sache selbst. */
  /* DAS PRODUKT IST SCHRIFT UND EIN BALKEN — SONST NICHTS.

     Peter, wörtlich: „Ich wollte nur die Schrift und einen einfachen
     horizontalen Fortschrittsbalken."

     Das ist zugleich die Antwort auf die Fäden, die dort immer wieder
     standen: Umriss, Rahmen und Gebäude waren aus Fäden gebaut, also konnte
     dort auch Fadenwerk stehenbleiben. Schrift und Balken sind HTML. Sie
     können nicht fusseln, sie überlagern nichts, und sie sind auf jedem
     Schirm lesbar.

     Was von der Ablage bleibt, ist `bausteine`: die Liste der angenommenen
     Stücke. Sie wird gezählt, nicht gezeichnet. */
  var visionen = 0;

  function abnehmen(prueft, version) {
    if (!tisch.length) return;
    /* Sagt die Prüfung, WAS sie bewertet, wird genau das abgenommen — und
       wenn die Daten auch eine Fassung nennen, muss sie stimmen. Sonst das
       älteste, und das wird vermerkt. In beiden Stücken ist diese
       Entscheidung zu hundert Prozent mehrdeutig. */
    var i = -1;
    if (prueft) {
      for (var q = 0; q < tisch.length; q++)
        if (tisch[q].artefakt === prueft &&
            (!version || !tisch[q].version || tisch[q].version === version)) {
          i = q; break;
        }
    }
    if (i < 0) {
      if (tisch.length > 1) ratVermerk('abnahme');
      i = 0;
    }
    var S = tisch.splice(i, 1)[0];
    if (S.eintrag) S.eintrag.zustand = 'angenommen';
    /* Abgenommen wird dort, wo auch geprüft wird: in der Mitte. */
    var o = [mx(), my()];
    produkt++;
    window.__feld.knoten(o[0], o[1], 0.80, S.ton, 4.0, 110, 1.6);
    window.__feld.austreiben(o[0], o[1], S.ton, 4, 0);
    bausteine.push({ ton: S.ton });

    /* Die Beschriftung des Produkts. Sie steht nicht dauernd da — sie
       leuchtet im Augenblick der Abnahme auf und verebbt wieder, wie alles
       andere hier auch. Was bleibt, ist der Baustein; was vergeht, ist die
       Nachricht darüber. Genau diese Trennung ist das Gesetz. */
    if (S.text) {
      var e = document.createElement('div');
      e.className = 'agWerk';
      e.style.left = o[0] + 'px';
      e.style.top = (o[1] - Math.min(W(), H()) * 0.165) + 'px';
      /* Der Text hell und neutral, nur das Wort „angenommen" in der Farbe
         dessen, der es gemacht hat. Im ersten Versuch war alles in seiner
         Farbe — bei den dunkleren Tönen war es dann nicht zu lesen, und
         eine Beschriftung, die man nicht lesen kann, ist Dekoration. */
      e.innerHTML = '<u style="color:' + hex(S.ton) + '">angenommen</u>' +
                    '<span>' + S.text + '</span>';
      werkEl.appendChild(e);
      setTimeout(function () { if (e.parentNode) e.remove(); }, 8600);
      while (werkEl.children.length > 3) werkEl.removeChild(werkEl.firstChild);
    }
  }

  var werkEl = document.getElementById('agWerk'),
      werkNameEl = document.getElementById('agWerkName');

  var bausteine = [];

  /* Der Balken füllt sich mit dem, was angenommen ist, gemessen am
     Umfang aus den Daten (`umfang`). Fehlt der, zeigt er die bloße Zahl
     und behauptet keine Vollständigkeit — ein Balken ohne bekanntes Ganzes
     wäre eine Erfindung. */
  function produktSchritt(dt) {
    /* Das Fertige leuchtet erst ab der vierten Stufe auf, nicht ab der
       ersten Sekunde — sonst strahlt es, während daneben noch gearbeitet
       wird. Über fünf Sekunden, nicht über neun. */
    var glanz = ausklang
      ? Math.max(0, Math.min(1, (AUSKLANG_DAUER - ausklang - 6) / 5)) : 0;


    /* Eröffnet gegen abgeschlossen — dieselbe Einheit auf beiden Seiten.
       Der Nenner wächst im Lauf, und das ist richtig so. */
    /* EIN BLOCK STATT ZWEIER, DIE DASSELBE SAGEN.

       Peter: „ich wuensche mir eine zusammenfassung der informationen,
       welche wichtig ist um zu erkennen, wie weit das projekt gediehen
       ist. aus produkt wurde irgendetwas gebastelt ohne ruecksicht auf
       das, was bereits vorhanden ist."

       Der Vorwurf trifft: Ich habe das Produkt oben rechts gebaut, ohne
       den Stand unten rechts zu beachten, der schon da war. Beide zeigten
       denselben Aufgabenzaehler, der eine als Zahl, der andere als Zahl
       UND als Balken. Jetzt steht alles einmal, in dieser Reihenfolge:
       was es ist, wie weit, wovon wieviel, woraus es besteht. */
    var offen = 0, blockiert = 0;
    for (var nq in arbeit) { var Sq = arbeit[nq]; if (Sq && !Sq.aus) offen += Sq.liste.length; }
    for (var bq in stopper) blockiert++;
    var ganz = aufgabenAuf,
        teil = ganz ? Math.min(1, aufgabenZu / ganz) : 0,
        schl = (STUECK.titel || STUECK.projekt || '') + '|' +
               aufgabenZu + '|' + ganz + '|' + (glanz > 0.25) + '|' +
               offen + '|' + tisch.length + '|' + blockiert + '|' +
               bausteine.length + '|' + register.length + '|' +
               register.map(function (r) { return r.zustand; }).join('');

    /* Kein `left` mehr. Diese Zeile stammte aus der Fassung, in der das
       Produkt unten in der Mitte stand — seit dem Umzug nach rechts oben
       setzte sie sich gegen das `right` der Stilregel durch (bei gesetzter
       Breite gewinnt `left`), und der Block stand 259 Pixel zu weit links.
       Gemessen, nicht vermutet: rechter Rand bei 921 statt 1180. Er sah
       plausibel genug aus, dass es mir nicht auffiel. */
    werkNameEl.classList.add('auf');
    werkNameEl.classList.toggle('hell', glanz > 0.25);

    if (werkNameEl.__schl !== schl) {
      werkNameEl.__schl = schl;
      /* Das Register: woraus das Produkt besteht. Die jüngsten zuerst,
         höchstens sechs — mehr liest niemand im Vorbeigehen, und beim
         Zeigen wächst der Block ohnehin. */
      var reg = '', zuletzt = register.slice(-6).reverse();
      if (zuletzt.length) {
        reg = '<div class="wReg">';
        zuletzt.forEach(function (r) {
          reg += '<div class="wZeile z-' + r.zustand + '">' +
                 '<u style="color:' + hex(r.ton) + '">' +
                 (r.kennung || 'ohne Kennung') + '</u>' +
                 (r.version ? '<i>' + r.version + '</i>' : '') +
                 '<s>' + r.zustand + '</s></div>';
        });
        if (register.length > 6)
          reg += '<div class="wMehr">und ' + (register.length - 6) +
                 ' weitere</div>';
        reg += '</div>';
      }

      /* Die Aufschluesselung. Striche statt Kurve: Jeder Strich ist ein
         Stueck Arbeit, und man kann sie zaehlen. Eine Kurve wuerde
         glaetten, was gerade nicht glatt ist. */
      var reihe = function (k, zahl, kl) {
        var s = '<div class="wAufZ"><u>' + k + '</u><b>' + zahl + '</b><i>';
        for (var q = 0; q < Math.min(zahl, 18); q++)
          s += '<s class="' + kl + '"></s>';
        return s + '</i></div>';
      };
      werkNameEl.innerHTML =
        /* 1. Was es ist */
        '<div class="wTitel">' + (STUECK.titel || STUECK.projekt || '') + '</div>' +
        /* 2. Wie weit */
        '<div class="wBalken"><span style="width:' +
          (teil * 100).toFixed(1) + '%"></span></div>' +
        '<div class="wZahl">' +
          (ganz ? aufgabenZu + ' von ' + ganz + ' Aufgaben erledigt'
                : 'noch keine Aufgabe eröffnet') + '</div>' +
        /* 3. Wovon wieviel */
        '<div class="wAuf">' +
          reihe('offen', offen, 'sOffen') +
          reihe('prüfung', tisch.length, 'sTisch') +
          reihe('blockiert', blockiert, 'sStop') +
          reihe('fertig', bausteine.length, 'sFertig') +
        '</div>' +
        /* 4. Woher und was das Konzept behauptet */
        '<div class="wOrt">' + (STUECK.ablage || 'extern') +
          (STUECK.umfang ? ' · laut Konzept ' + STUECK.umfang : '') + '</div>' +
        /* 5. Woraus es besteht */
        reg;
    }
  }

  function tischSchritt(dt) {
    for (var i = 0; i < tisch.length; i++) {
      var S = tisch[i], o = tischOrt(i);
      S.t += dt; S.w += 0.75 * dt;
      S.beben = Math.max(0, S.beben - dt * 2.2);
      /* Getroffen heißt: zurück zur Nacharbeit. Ein Stück, gegen das ein
         Widerspruch oder ein Fehler steht, liegt nicht mehr zur Abnahme —
         es ist beim Autor. Also geht es nach fünf Sekunden vom Tisch, und
         die Mitte wird wieder dunkel. Vorher stand dort siebzig Sekunden
         lang Licht, weil nichts das Stück je heruntergenommen hat außer
         einer Abnahme, die erst bei t=92 kommt. */
      if (S.zurueck != null) {
        S.zurueck -= dt;
        if (S.zurueck <= 0) {
          einsturz(o[0], o[1], S.ton);
          tisch.splice(i, 1); i--; continue;
        }
      }
      /* Auf dem Rückweg wird es blasser — man sieht es gehen. */
      var ab = S.zurueck != null ? Math.max(0, S.zurueck / 5.0) : 1;
      var r = Math.min(W(), H()) * (0.030 + 0.010 * Math.sin(S.t * 0.9))
            * (1 + S.beben * 0.55);
      /* Ein Ding auf dem Tisch dreht sich langsam und gleichmäßig — anders
         als Arbeit, die atmet, und anders als ein Ball, der fliegt. Sechs
         Punkte, damit es als Rund gelesen wird und nicht als Kreisel. */
      for (var s = 0; s < 6; s++) {
        var w = S.w + s * 1.0472;
        window.__feld.strang(
          o[0] + Math.cos(w) * r, o[1] + Math.sin(w) * r,
          -Math.sin(w) * r * 0.9, Math.cos(w) * r * 0.9,
          (0.34 + 0.30 * S.beben) * ab, 0.42 + 0.16 * Math.random(), S.ton, 0);
      }
    }
  }

  /* ===================================================== DER STOPPER ====
     Wer fragt, wartet. Das ist die Verzögerung, und sie steht messbar in
     den Daten: Nova fragt bei t=8, Peter entscheidet bei t=13 — fünf
     Sekunden. Archibald fragt bei t=36, Scout antwortet bei t=50 —
     vierzehn. Atlas fragt bei t=66, Peter entscheidet bei t=73 — sieben.

     Der Stopper sitzt deshalb beim FRAGENDEN, nicht beim Gefragten: Der
     Gefragte kann weiterarbeiten, der Fragende nicht.

     Dargestellt als Ring, der GEGEN die Arbeit dreht und dabei stockt —
     nicht als dunkler Fleck, denn diese Maschine kann kein Schwarz malen,
     sie addiert nur Licht. Was blockiert, muss sich also durch BEWEGUNG
     zeigen: gegenläufig und ruckend gegen das gleichmäßige Kreisen.

     Das letzte Ereignis des Stücks ist ein `open_state` von Atlas und
     heißt wörtlich „Kein Abschluss". Sein Stopper wird nie aufgelöst — er
     steht bis zum Ausklang. Das ist nicht gebaut, das ist eure Lage. */
  /* WIE OFT WIRD GERATEN. Jede Faustregel, die greift, obwohl mehr als
     eine Möglichkeit offen stand, wird hier gezählt. Steht die Zahl bei
     null, hat die Darstellung nichts erfunden — dann tragen die Daten ihre
     Bezüge selbst. */
  var geraten = { auftrag: 0, abnahme: 0, gegen: 0, antwort: 0, gesamt: 0 };

  /* DER EHRLICHE NENNER. Aufgaben, die eröffnet wurden, gegen Aufgaben, die
     abgeschlossen wurden — beide Seiten in derselben Einheit, beide aus dem
     laufenden Geschehen gezählt. Vorher stand im Balken „4 von 21": vier
     Abnahmeereignisse gegen einundzwanzig Storyideen. */
  var aufgabenAuf = 0, aufgabenZu = 0;

  /* DAS REGISTER. Woraus das Produkt besteht: Kennung, Fassung, Zustand.
     Es lebt von `artefakt` und `version` in den Daten; fehlen sie, steht
     hier, dass es sie nicht gibt — erfunden wird nichts. */
  var register = [];
  function ratVermerk(was) { geraten[was]++; geraten.gesamt++; }
  function ratNull() {
    geraten.auftrag = geraten.abnahme = geraten.gegen =
      geraten.antwort = geraten.gesamt = 0;
  }

  var stopper = {};

  /* Die Klassen eines Stops. Jede hat ein Wort, eine Farbe und einen Satz,
     der sagt, was sie bedeutet — und was sie wieder auflöst. Die Farbe ist
     nicht Geschmack: Eine fachliche Blockade löst sich durch eine Antwort,
     ein technischer Ausfall nicht. Wer das verwechselt, wartet auf etwas,
     das nicht kommt. */
  var STOPPKLASSEN = {
    technisch:     { wort: 'Technik',     farbe: '#C45C66',
                     was: 'Der Agent antwortet nicht. Löst sich nicht durch Zuwarten im Projekt, sondern erst, wenn die Umgebung wieder läuft.' },
    budget:        { wort: 'Kanal zu',    farbe: '#C9A227',
                     was: 'Der Zugang zum Modell ist geschlossen — kein Guthaben, Grenze erreicht oder gesperrt. Es fließt nichts, und es kostet auch nichts.' },
    abhaengigkeit: { wort: 'wartet',      farbe: '#8FA3C0',
                     was: 'Wartet auf eine Antwort oder Zuarbeit aus dem Team.' },
    freigabe:      { wort: 'Freigabe',    farbe: '#9A7FB8',
                     was: 'Wartet auf eine Entscheidung, die ein Mensch treffen muss.' },
    mensch:        { wort: 'Mensch',      farbe: '#D0B089',
                     was: 'Wartet auf den Auftraggeber.' },
    unbekannt:     { wort: 'Stop',        farbe: '#7F8FA8',
                     was: 'Angehalten; die Daten nennen keinen Grund.' }
  };

  function stopperAn(name, grund, klasse) {
    if (!nachName[name]) return;
    var k = (klasse && STOPPKLASSEN[klasse]) ? klasse : 'unbekannt';
    stopper[name] = { t: 0, w: Math.random() * 6.2832, grund: grund || '',
                      klasse: k, seit: zeit, frage: arguments[3] || '' };
  }
  function stopperAus(name) {
    if (stopper[name]) delete stopper[name];
    if (stoppEl.__wer === name) stoppWeg();
  }

  /* Die Farben der Klassen stehen als Hexwert da, weil sie im Text
     auftauchen; die Maschine rechnet mit Farbtönen. Einmal umrechnen. */
  var STOPPTON = { technisch: 0.98, budget: 0.115, abhaengigkeit: 0.60,
                   freigabe: 0.76, mensch: 0.09, unbekannt: 0.58 };
  function stoppTon(k) {
    return STOPPTON[k] != null ? STOPPTON[k] : STOPPTON.unbekannt;
  }

  function stopperSchritt(dt) {
    for (var name in stopper) {
      var S = stopper[name], A = nachName[name], q = heimat(A);
      S.t += dt;
      /* Ruckend: Der Ring steht meist still und springt dann ein Stück.
         Gleichmäßiges Drehen läse sich als Arbeit. */
      var takt = S.t % 1.15;
      if (takt < 0.17) S.w -= dt * 4.2;
      var r = Math.min(W(), H()) * 0.034;
      /* Die Farbe kommt von der KLASSE, nicht vom Agenten. Ein Ausfall ist
         keine Eigenschaft dessen, den er trifft. */
      var ton = stoppTon(S.klasse);
      for (var k = 0; k < 4; k++) {
        var w = S.w + k * 1.5708;
        window.__feld.strang(q[0] + Math.cos(w) * r, q[1] + Math.sin(w) * r,
          Math.sin(w) * r * 0.5, -Math.cos(w) * r * 0.5,
          0.14, 0.45 + 0.2 * Math.random(), ton, 0);
      }
      /* Technischer Ausfall: Der Platz flackert, statt gleichmäßig zu
         stocken. Kanal zu: ein durchgestrichener Weg nach außen — es geht
         nichts mehr hinaus. Beides unterscheidet sich schon aus dem
         Augenwinkel von einem bloßen Warten. */
      if (S.klasse === 'technisch' && Math.random() < 0.22) {
        for (var f = 0; f < 5; f++) {
          var wf = Math.random() * 6.2832, df = r * (0.3 + Math.random());
          window.__feld.strang(q[0] + Math.cos(wf) * df, q[1] + Math.sin(wf) * df,
            Math.cos(wf) * 80, Math.sin(wf) * 80,
            0.26, 0.18 + 0.12 * Math.random(), ton, 0);
        }
      } else if (S.klasse === 'budget') {
        var zm = Math.atan2(my() - q[1], mx() - q[0]);
        for (var g = 0; g < 3; g++) {
          var fg = (g - 1) * r * 0.55;
          window.__feld.strang(
            q[0] + Math.cos(zm + 1.5708) * fg, q[1] + Math.sin(zm + 1.5708) * fg,
            Math.cos(zm) * 70, Math.sin(zm) * 70,
            0.20, 0.5, ton, 0);
        }
      }
    }
  }

  /* ====================================================== DIE ARBEIT ====
     Zwischen Ankommen und Antworten verging im Bild bisher nichts, obwohl im
     Team genau dort die Zeit vergeht. Wer einen Ball bekommt, arbeitet — und
     das ist ein eigener Zustand, kein Effekt.

     Sichtbar wird er als kleiner, langsam kreisender Wirbel am Platz des
     Agenten. Das ist mit Absicht Resonanz' eigene Geste: Dort entsteht
     etwas, indem man kreist, und zwar nur, solange man kreist. Hier kreist
     der Agent selbst.

     Er hört auf, sobald er etwas von sich gibt — oder nach 28 Sekunden, denn
     ein Stück, in dem jemand für immer arbeitet, gibt es nicht. Und: Arbeit
     hinterlässt NICHTS, solange sie dauert (Abgabe 0). Erst ihr Ergebnis
     schreibt. Das ist dasselbe Gesetz, nur von der anderen Seite gesehen. */
  var arbeit = {};

  /* MEHRERE AUFTRÄGE GLEICHZEITIG, als Ringe ineinander.

     Vorher hielt `arbeit[name]` genau einen Auftrag: Ein zweiter überschrieb
     den ersten, und der Ring sah aus wie vorher. Bei drei Strängen fiel das
     nie auf; im Lastmaterial sind 14 Aufträge gleichzeitig offen auf acht
     Agenten. Das Bild log also genau über das, was ein Team auszeichnet.

     Warum Ringe und nicht „dichter und schneller": Schneller wäre nicht
     ehrlich. Ein Modell arbeitet mit drei Aufträgen nicht schneller als mit
     einem — es arbeitet an dreien. Also drei Ringe, jeder mit eigener Bahn
     und eigener Drehzahl, und man zählt sie. */
  /* Was ein Auftrag verbraucht hat. Summiert je Rolle, solange das Stück
     läuft; beim Stückwechsel auf null. */
  var verbrauch = {};

  function arbeitAn(name, auftrag, kommando, modell, b) {
    if (!nachName[name]) return;
    var S = arbeit[name];
    if (!S || S.aus) { S = arbeit[name] = { t: 0, liste: [] }; }
    aufgabenAuf++;
    S.liste.push({
      auftrag: auftrag || '', kommando: kommando || '',
      modell: modell || MOTOR[nachName[name].platt] || '',
      tokens: (b && b.tokens) || null, kosten: (b && b.kosten) || 0,
      quelle: (b && b.quelle) || '',
      /* Die Aufgaben-ID, wenn die Daten eine mitbringen. Sie bleibt über
         den ganzen Auftrag stabil und ist der Schlüssel, mit dem sich
         später sagen lässt, WELCHE Arbeit endet. */
      aufgabe: (b && b.aufgabe) || '',
      w: Math.random() * 6.2832, t: 0, beginn: zeit
    });
    /* Alle Aufträge bleiben in der Liste. Vorher flog der älteste
       hinaus, sobald mehr als vier offen waren — mitsamt seiner
       Buchführung, lautlos. Gezeichnet werden trotzdem höchstens vier
       Ringe; mehr liest niemand. */
  }

  /* Was beendet welchen Auftrag? Den ältesten offenen — wer liefert, wird
     das los, was am längsten liegt. Erst wenn keiner mehr offen ist, hört
     die Arbeit ganz auf. */
  function auftragFertig(name, aufgabe) {
    var S = arbeit[name];
    if (!S || S.aus) return;
    /* Sagen die Daten, WELCHE Aufgabe erledigt ist, wird genau die
       geschlossen — und die übrigen laufen sichtbar weiter. Sagen sie es
       nicht, endet der älteste offene, und das wird als Rateentscheidung
       vermerkt, sofern es überhaupt etwas zu wählen gab. */
    var i = -1;
    if (aufgabe) {
      for (var q = 0; q < S.liste.length; q++)
        if (S.liste[q].aufgabe === aufgabe) { i = q; break; }
    }
    if (i < 0) {
      if (S.liste.length > 1) ratVermerk('auftrag');
      i = 0;
    }
    var L = S.liste.splice(i, 1)[0];
    aufgabenZu++;
    stromErledigt(name);
    /* Auch ein Auftrag OHNE Kostenangabe wird gezählt — getrennt. Sonst
       ließe sich später nicht unterscheiden, ob nichts verbraucht wurde
       oder nichts übermittelt wurde. Das ist die Regel aus dem Regelwerk
       des Teams: „Fehlende Werte sind nicht null Tokens." */
    if (L) {
      var V0 = verbrauch[name] || (verbrauch[name] =
                 { kosten: 0, aus: 0, n: 0, ohne: 0, zeit: 0, fertig: 0,
                   quelle: '' });
      if (V0.ohne == null) V0.ohne = 0;
      if (!L.kosten) V0.ohne++;
      /* WIE LANGE HAT ES GEDAUERT. Kein neues Datenfeld: Die Spanne liegt
         zwischen dem Ereignis, das den Auftrag vergibt, und dem, mit dem
         derselbe Agent liefert — beides `t`-Werte. `L.beginn` hielt den
         Anfang schon fest, weil die Anzeige „arbeitet · 00:14" davon lebt;
         bisher wurde die Zahl beim Erledigen weggeworfen. */
      L.dauer = Math.max(0, zeit - (L.beginn || zeit));
      V0.zeit = (V0.zeit || 0) + L.dauer;
      V0.fertig = (V0.fertig || 0) + 1;
    }
    /* Erledigt heißt: jetzt steht fest, was es gekostet hat. Die Zahl
       erscheint am Platz des Agenten und verebbt — wie alles hier. */
    if (L && L.kosten) {
      var V = verbrauch[name];
      if (!V.quelle) V.quelle = L.quelle;
      V.kosten += L.kosten; V.n++;
      if (L.tokens) V.aus += L.tokens.aus || 0;
      var A2 = nachName[name], o2 = heimat(A2);
      var e2 = document.createElement('div');
      e2.className = 'agKosten' + (L.quelle === 'geschaetzt' ? ' geschaetzt' : '');
      e2.style.left = o2[0] + 'px';
      e2.style.top = (o2[1] - 17) + 'px';
      e2.style.color = hex(A2.farbe);
      e2.textContent = mmss(L.dauer) + ' · ' +
        (L.tokens ? (L.tokens.aus > 999
          ? (L.tokens.aus / 1000).toFixed(1) + 'k' : L.tokens.aus) + ' tok · ' : '') +
        'USD ' + L.kosten.toFixed(4);
      document.getElementById('agKostenEbene').appendChild(e2);
      setTimeout(function () { if (e2.parentNode) e2.remove(); }, 16000);
    }
    else if (L) {
      /* Ohne Kostenangabe trotzdem die Dauer. Sie hängt an keinem
         übermittelten Wert, sondern an zwei Zeitstempeln — die gibt es
         immer, wenn es das Ereignis gibt. */
      var A3 = nachName[name], o3 = heimat(A3);
      var e3 = document.createElement('div');
      e3.className = 'agKosten nurZeit';
      e3.style.left = o3[0] + 'px';
      e3.style.top = (o3[1] - 17) + 'px';
      e3.style.color = hex(A3.farbe);
      e3.textContent = mmss(L.dauer) + ' · keine Kostenangabe';
      document.getElementById('agKostenEbene').appendChild(e3);
      setTimeout(function () { if (e3.parentNode) e3.remove(); }, 16000);
    }
    if (!S.liste.length) arbeitAus(name);
  }

  /* Sekunden als mm:ss, aber unter einer Minute nur als Sekunden — „00:14"
     liest sich bei kurzen Aufträgen wie eine Uhrzeit, „14 s" wie eine
     Dauer. */
  function mmss(sek) {
    sek = Math.round(sek || 0);
    if (sek < 60) return sek + ' s';
    return Math.floor(sek / 60) + ':' + ('0' + (sek % 60)).slice(-2) + ' min';
  }
  var MOTOR = { chatgpt: 'ChatGPT', claude: 'Claude Code', mensch: 'Mensch' };
  /* Nicht wegschalten, sondern verklingen lassen. Ein Ring, der mitten im
     Bild ausgeht, liest sich als Fehler; einer, der über anderthalb
     Sekunden dünner wird, liest sich als Fertigwerden. */
  function arbeitAus(name) {
    var S = arbeit[name];
    if (S && !S.aus) S.aus = 1.6;
    else if (!S) delete arbeit[name];
  }

  /* Bereitschaft: Wer nichts zu tun hat, ist nicht weg. Ein sehr leiser,
     langsamer Puls an seinem Platz — gerade so viel, dass man ihn bemerkt,
     wenn man hinsieht, und nicht, wenn man es nicht tut.
     Die Hitze liegt mit Absicht unter 0,20: Das ist die Schwelle, ab der
     Resonanz von selbst Korn aussät und daraus Funken sprühen. Darüber
     wäre Bereitschaft kein Warten mehr, sondern Betrieb. */
  var bereitUhr = 0;
  /* DER KOMET.

     Peters Bild: „Ab und zu darf ein Komet den Bildschirm überqueren. Er
     kommt aus dem Universum und kreuzt nur kurz unsere Bahn."

     Er gehört keinem Agenten, trägt keine Nachricht und hinterlässt nichts
     im Niederschlag — er ist das Einzige im Stück, das von außerhalb der
     Sache kommt. Deshalb auch eine eigene Farbe, kühl und niemandem
     zugeordnet, und eine Bahn, die nicht auf die Mitte zeigt: Er kreuzt,
     er besucht nicht.

     Sichtbar wird er allein durch Fahrt. Ein Strang wird als Linie von der
     alten zur neuen Lage gezeichnet; wer schnell ist, zieht einen Strich.
     Das ist derselbe Mechanismus, an dem ich mir einmal einen unsichtbaren
     Rahmen gebaut habe, hier aber genau richtig. */
  var kometen = [], kometUhr = 0;

  function kometSaeen() {
    var w = W(), h = H();
    /* Von einer der vier Seiten herein, schräg, und wieder hinaus. */
    var seite = Math.floor(Math.random() * 4),
        x, y, gx, gy,
        schnell = 260 + Math.random() * 220;
    if (seite === 0) { x = -40; y = h * Math.random(); gx = 1; gy = Math.random() - 0.5; }
    else if (seite === 1) { x = w + 40; y = h * Math.random(); gx = -1; gy = Math.random() - 0.5; }
    else if (seite === 2) { x = w * Math.random(); y = -40; gx = Math.random() - 0.5; gy = 1; }
    else { x = w * Math.random(); y = h + 40; gx = Math.random() - 0.5; gy = -1; }
    var L = Math.hypot(gx, gy) || 1;
    kometen.push({ x: x, y: y, vx: gx / L * schnell, vy: gy / L * schnell,
                   t: 0, lebt: 2.2 + Math.random() * 1.6 });
  }

  function kometSchritt(dt) {
    kometUhr -= dt;
    if (kometUhr <= 0) { kometSaeen(); kometUhr = 3.5 + Math.random() * 5; }
    for (var i = kometen.length - 1; i >= 0; i--) {
      var K2 = kometen[i];
      K2.t += dt;
      K2.x += K2.vx * dt; K2.y += K2.vy * dt;
      if (K2.t > K2.lebt || K2.x < -120 || K2.x > W() + 120 ||
          K2.y < -120 || K2.y > H() + 120) { kometen.splice(i, 1); continue; }
      /* Ein- und ausblenden, damit er nicht am Rand erscheint und
         verschwindet, sondern auftaucht und vergeht. */
      var f = Math.min(1, K2.t / 0.4, (K2.lebt - K2.t) / 0.7);
      if (f <= 0) continue;
      /* ÜBER DIE STRECKE SÄEN, NICHT JE BILD.

         Der erste Versuch setzte Kopf und Schweif einmal pro Bild an der
         aktuellen Lage ab. Auf dem Prüfrechner mit wenigen Bildern je
         Sekunde wurde daraus eine Punktreihe mit Lücken — und auf einem
         schnellen Gerät ein dichter Strich. Das Aussehen hing also an der
         Bildrate, nicht am Kometen.

         Jetzt wird die seit dem letzten Bild zurückgelegte Strecke
         abgeschritten und alle paar Pixel ein Faden gesetzt. Damit sieht er
         überall gleich aus. */
      var sx2 = K2.x - K2.vx * dt, sy2 = K2.y - K2.vy * dt;
      var str = Math.hypot(K2.x - sx2, K2.y - sy2);
      var wie = Math.max(1, Math.min(40, Math.round(str / 7)));
      for (var s2 = 0; s2 <= wie; s2++) {
        var z2 = s2 / wie;
        var hx2 = sx2 + (K2.x - sx2) * z2, hy2 = sy2 + (K2.y - sy2) * z2;
        window.__feld.strang(
          hx2 + (Math.random() - 0.5) * 5, hy2 + (Math.random() - 0.5) * 5,
          K2.vx * 0.55, K2.vy * 0.55,
          (0.14 + 0.18 * z2) * f, 0.45 + 0.3 * Math.random(), 0.55, 0);
      }
      /* Der Kopf, am vorderen Ende der Strecke. */
      window.__feld.sonne(K2.x, K2.y, K2.vx * 0.3, K2.vy * 0.3,
        Math.min(W(), H()) * 0.004, 0.62 * f, 0.55, 0, 4);
    }
  }

  function bereitschaft(dt) {
    bereitUhr += dt;

    /* DAS UNIVERSUM IST IMMER DA.
       Vorher hing es an Scouts laufender Arbeit — und die dauert in V1
       ganze SIEBEN von 120 Sekunden (Auftrag t=3, Lieferung t=10). Der
       Zufluss war 113 Sekunden lang aus, und das sah aus, als gäbe es
       draußen nichts. Ein Ort hört aber nicht auf zu bestehen, wenn gerade
       niemand hinsieht. Die fernen Punkte liegen deshalb dauernd da, nur
       sehr blass; was beim Arbeiten dazukommt, ist der ZUG hinein. */
    for (var u = 0; u < AGENTEN.length; u++) {
      var AS = AGENTEN[u];
      if (AS.weise !== 'holen') continue;
      var ps = heimat(AS), a0 = Math.atan2(ps[1] - my(), ps[0] - mx());
      for (var q0 = 0; q0 < 5; q0++) {
        var wq = a0 + (Math.random() - 0.5) * 2.5;
        var cq = Math.cos(wq), sq = Math.sin(wq);
        var tq = Math.min(
          Math.abs(cq) > 1e-3 ? 0.42 * W() / Math.abs(cq) : 1e9,
          Math.abs(sq) > 1e-3 ? 0.46 * H() / Math.abs(sq) : 1e9);
        var rq = tq * (0.72 + 0.5 * Math.random());
        window.__feld.strang(mx() + cq * rq, my() + sq * rq, 0, 0,
          0.045 + 0.05 * Math.random(), 1.0 + 0.8 * Math.random(),
          AS.farbe, 0);
      }
    }

    for (var i = 0; i < AGENTEN.length; i++) {
      var A = AGENTEN[i];
      if (arbeit[A.name]) continue;
      var ph = bereitUhr * 0.85 + i * 0.7;
      var s = 0.5 + 0.5 * Math.sin(ph);
      /* Im Ausklang zeigen alle ihre Rufbereitschaft AKTIV: Der Puls läuft
         weiter geöffnet statt nur im Scheitel, und er trägt mehr Licht. Das
         Team wartet nicht ab, es steht bereit. */
      if (s < (rufbereit ? 0.26 : 0.58)) continue;
      /* Drei Punkte auf einem winzigen Kreis statt einem: Ein einzelner
         Punkt im Scheitel eines Pulses war bei Cadence mit 0,01 gemessen —
         also nicht da. Die Hitze bleibt trotzdem unter 0,20, denn das ist
         die Schwelle, ab der Resonanz von selbst Korn aussät; darüber wäre
         Bereitschaft kein Warten mehr, sondern Betrieb. */
      var q = heimat(A), r = Math.min(W(), H()) * 0.015;
      for (var c = 0; c < 3; c++) {
        var w = bereitUhr * 0.45 + i + c * 2.0944;
        window.__feld.strang(q[0] + Math.cos(w) * r, q[1] + Math.sin(w) * r,
          -Math.sin(w) * r * 0.8, Math.cos(w) * r * 0.8,
          (rufbereit ? 0.125 : 0.085) + 0.095 * s,
          0.9 + 0.4 * Math.random(), A.farbe, 0);
      }
    }
  }

  /* ================================================ WER GERADE ARBEITET ==
     Peters Beobachtung: „Manchmal wartet man auf Aktion und es kommt
     nichts, weil wahrscheinlich ein Agent arbeitet und alle warten auf die
     Beendigung dieser."

     Nachgemessen trifft das für V1 vollständig zu: Alle 31 Sekunden
     Totzeit (26 % des Stücks) fallen in eine Spanne, in der jemand
     arbeitet. Es war also nie Stillstand — man konnte es nur nicht lesen,
     weil die Ringe am Platz des Arbeitenden dasselbe Gewicht hatten wie
     alles andere im Bild.

     Also wird es gesagt, an seinem Platz und mit der Zeit dazu. Die Daten
     dafür liegen schon vor: `liste[0].beginn` ist die Sekunde, in der der
     Auftrag ankam; `zeit` ist jetzt. Und je länger die Pause anhält, desto
     deutlicher steht es da — eine lange Wartezeit ist kein Fehler des
     Bildes, sie ist der Befund. */
  var tunEl = document.getElementById('agTun'), tunStill = 0;

  /* Ein Schild am Platz des Blockierten: das Wort der Klasse, und
     darunter die Dauer. Antippen zeigt den Grund — auf einem iPad gibt es
     kein Zeigen mit der Maus, also muss beides gehen. */
  var stoppSchildEl = document.getElementById('agStoppSchilder'),
      stoppEl = document.getElementById('agStopp');

  function stoppZeigen() {
    var h = '';
    for (var n in stopper) {
      var S = stopper[n], A = nachName[n];
      if (!A) continue;
      var K = STOPPKLASSEN[S.klasse] || STOPPKLASSEN.unbekannt,
          o = heimat(A), sek = Math.max(0, Math.round(zeit - S.seit));
      h += '<div class="agStoppS" data-wer="' + n + '" style="left:' + o[0] +
           'px;top:' + (o[1] - 34) + 'px;color:' + K.farbe + '">' +
           K.wort + '<b>' + (sek < 60 ? sek + ' s'
             : Math.floor(sek / 60) + ':' + ('0' + (sek % 60)).slice(-2) + ' min') +
           '</b></div>';
    }
    if (h !== stoppSchildEl.__h) {
      stoppSchildEl.__h = h;
      stoppSchildEl.innerHTML = h;
      Array.prototype.forEach.call(
        stoppSchildEl.querySelectorAll('.agStoppS'), function (el) {
          var n = el.getAttribute('data-wer');
          el.addEventListener('mouseenter', function () { stoppGrund(n); });
          el.addEventListener('mouseleave', stoppWeg);
          el.addEventListener('click', function (ev) {
            ev.stopPropagation();
            if (stoppEl.__wer === n) stoppWeg(); else stoppGrund(n);
          });
        });
    }
  }

  function stoppGrund(n) {
    var S = stopper[n], A = nachName[n];
    if (!S || !A) return;
    var K = STOPPKLASSEN[S.klasse] || STOPPKLASSEN.unbekannt, o = heimat(A);
    stoppEl.__wer = n;
    stoppEl.innerHTML =
      '<b style="color:' + K.farbe + '">' + K.wort + '</b>' +
      '<i>' + A.name + ' · ' + A.rolle + '</i>' +
      '<p>' + (S.grund || 'Die Daten nennen keinen Grund.') + '</p>' +
      '<small>' + K.was + '</small>';
    stoppEl.classList.add('auf');
    var b = stoppEl.getBoundingClientRect();
    stoppEl.style.left = Math.max(10, Math.min(W() - b.width - 10,
                                               o[0] - b.width / 2)) + 'px';
    stoppEl.style.top = Math.max(10, o[1] - b.height - 46) + 'px';
  }
  function stoppWeg() { stoppEl.classList.remove('auf'); stoppEl.__wer = null; }

  /* Im Live-Betrieb ohne angeschlossenen Strom sagt das Feld genau das.
     Ein leeres Bild, das aussieht wie ein ruhiges Projekt, wäre die
     gefährlichste Anzeige von allen — siehe Funktionsmatrix 2a.3. */
  function liveHinweis() {
    var e = document.getElementById('agLive');
    if (!e) return;
    var an = (MODUS === 'live');
    e.classList.toggle('auf', an);
    if (an) e.innerHTML =
      '<b>Live — keine Verbindung</b>' +
      '<span>Es ist kein Strom angeschlossen. Dieses Feld zeigt nicht ein ' +
      'ruhiges Projekt, sondern gar keines. Sobald eine Schnittstelle ' +
      'liefert, läuft es an; einen Selbststart gibt es hier nicht.</span>' +
      (window.__agActivity ? window.__agActivity.hinweis() : '');
  }

  function tunZeigen(dt) {
    tunStill += dt;
    var h = '', n;
    for (n in arbeit) {
      var S = arbeit[n], A = nachName[n];
      if (!A || S.aus || !S.liste.length) continue;
      var sek = Math.max(0, zeit - S.liste[0].beginn),
          o = heimat(A),
          lang = tunStill > 4.5,
          mm = ('0' + Math.floor(sek / 60)).slice(-2),
          ss = ('0' + Math.floor(sek % 60)).slice(-2);
      h += '<div class="agTut auf' + (lang ? ' lang' : '') +
           '" style="left:' + o[0] + 'px;top:' + (o[1] + 34) +
           'px;color:' + hex(A.farbe) + '">arbeitet · ' + mm + ':' + ss +
           (S.liste.length > 1 ? ' · ' + S.liste.length + ' Aufträge' : '') +
           (lang ? '<b>die anderen warten</b>' : '') + '</div>';
    }
    if (h !== tunEl.__h) { tunEl.innerHTML = h; tunEl.__h = h; }
  }

  function arbeitSchritt(dt) {
    for (var name in arbeit) {
      var A = nachName[name], S = arbeit[name];
      S.t += dt;
      /* Hier stand eine Deckelung auf 28 Sekunden. Sie ist weg, und zwar
         gemessen: In V2 liegt die mittlere Auftragsdauer bei 40 Sekunden,
         der längste gelieferte Auftrag bei 352. Der Deckel war also kein
         Notfall-Riegel, sondern traf den Normalfall — und er maß `S.t`,
         das Alter der SITZUNG, nicht das des Auftrags, riss also auch
         frisch angekommene Aufträge mit. Schlimmer noch: Nach dem
         Abräumen buchte die spätere Lieferung nichts mehr, weder Kosten
         noch Eintrag. In V1 traf das vier Lieferungen, in V2 neun.
         Ein Auftrag endet jetzt, wenn er geliefert wird, oder mit dem
         Stück. Läuft er ewig, dann weil die Daten ihn nie abschließen —
         und das soll man sehen, nicht wegräumen. */
      var staerke = 1;
      if (S.aus) {
        S.aus -= dt;
        if (S.aus <= 0) { delete arbeit[name]; continue; }
        staerke = S.aus / 1.6;
      }
      var p = heimat(A);
      /* Der Kreis wird enger und weiter — so atmet die Arbeit, statt zu
         laufen wie ein Zeiger. */
      var atem = 0.5 + 0.5 * Math.sin(S.t * 2.4);
      var grund = Math.min(W(), H()) * 0.026;

      /* Ein Ring je offenem Auftrag, von innen nach außen. Jeder dreht
         etwas anders schnell — sonst sähen drei Ringe aus wie ein dicker,
         und man könnte sie nicht zählen. */
      for (var q = 0; q < Math.min(S.liste.length, 4); q++) {
        var L = S.liste[q];
        L.t += dt;
        L.w += (1.1 - q * 0.17) * dt;
        var r = grund * (0.68 + q * 0.46)
              * (1 + 0.09 * Math.sin(L.t * 1.25 + q));
        for (var s = 0; s < 2; s++) {
          var w = L.w + s * Math.PI;
          window.__feld.strang(
            p[0] + Math.cos(w) * r, p[1] + Math.sin(w) * r,
            -Math.sin(w) * r * 0.9, Math.cos(w) * r * 0.9,
            (0.40 + 0.22 * atem) * staerke,
            0.38 + 0.16 * Math.random(), A.farbe, 0);
        }
      }

      /* Der Herzschlag der Arbeit: Etwa jede anderthalb Sekunden ein kurzer
         Knoten in der Mitte. Ohne ihn ist das Kreisen gleichförmig, und
         gleichförmig liest man als Verzierung statt als Tätigkeit. */
      S.schlag = (S.schlag || 0) - dt;
      if (S.schlag <= 0 && !S.aus) {
        S.schlag = 1.5;
        window.__feld.knoten(p[0], p[1], 0.62, A.farbe, 0, 10, 0.75);
      }

      /* ================= DIE WEISE DER ÜBRIGEN ROLLEN ==================
         Bis hierher kreisten sechs von acht gleich. Das Bild sagte damit
         „Arbeit ist Arbeit", und das stimmt nicht: Prüfen ist nicht Bauen,
         und Ordnen ist nicht Hinterfragen. Jede Weise unten ist aus dem
         abgeleitet, was die Rolle im Team TUT — nicht aus dem, was hübsch
         aussieht. */

      /* Argus prüft, und Prüfen heißt HINGEHEN. Sein Ring sitzt nicht an
         seinem Platz, sondern an dem Stück, das auf dem Tisch liegt — er
         arbeitet an der Sache, nicht an sich. Liegt nichts dort, bleibt er
         sitzen; es gibt dann nichts zu prüfen. */
      if (A.weise === 'pruefen' && !S.aus && tisch.length) {
        var zo = tischOrt(tisch.length - 1);
        var rz = Math.min(W(), H()) * 0.046;
        for (var z1 = 0; z1 < 2; z1++) {
          var wz = S.t * 1.5 + z1 * Math.PI;
          window.__feld.strang(zo[0] + Math.cos(wz) * rz, zo[1] + Math.sin(wz) * rz,
            -Math.sin(wz) * rz * 1.1, Math.cos(wz) * rz * 1.1,
            0.30, 0.4 + 0.2 * Math.random(), A.farbe, 0);
        }
      }

      /* Sentinel prüft WIEDERHOLT. Also ein Takt statt eines Kreises: Alle
         1,1 Sekunden ein kurzer Strich, immer derselbe, immer wieder —
         und jedes Mal ein Stück weitergedreht, damit man sieht, dass es
         Durchgänge sind und nicht ein Stillstand. */
      if (A.weise === 'takten' && !S.aus) {
        S.takt = (S.takt || 0) - dt;
        if (S.takt <= 0) {
          S.takt = 1.1;
          S.durchgang = (S.durchgang || 0) + 0.7;
          var rt = Math.min(W(), H()) * 0.040;
          for (var k2 = 0; k2 < 9; k2++) {
            var ft = k2 / 9;
            var wt = S.durchgang;
            window.__feld.strang(
              p[0] + Math.cos(wt) * rt * (0.2 + ft * 0.9),
              p[1] + Math.sin(wt) * rt * (0.2 + ft * 0.9),
              Math.cos(wt) * 95, Math.sin(wt) * 95,
              0.42 * (1 - ft * 0.5), 0.3 + 0.2 * Math.random(), A.farbe, 0);
          }
        }
      }

      /* Forge BAUT, also wächst etwas. Was er legt, bleibt stehen und wird
         mehr, solange er arbeitet — eine kleine Struktur, die sich auffüllt
         und beim Liefern verschwindet. Der Unterschied zum Produkt in der
         Mitte: Dieses hier ist noch nicht angenommen, es ist Baustelle. */
      if (A.weise === 'bauen' && !S.aus) {
        S.hoch = Math.min(1, (S.hoch || 0) + dt * 0.055);
        var rb = Math.min(W(), H()) * 0.040;
        for (var k3 = 0; k3 < 3; k3++) {
          var wb = Math.random() * 6.2832;
          var db = rb * Math.sqrt(Math.random()) * (0.3 + 0.7 * S.hoch);
          window.__feld.strang(p[0] + Math.cos(wb) * db, p[1] + Math.sin(wb) * db,
            0, 0, 0.13 + 0.16 * S.hoch, 0.9 + 0.5 * Math.random(), A.farbe, 0);
        }
      }

      /* Archibald macht UNTERSCHEIDBAR. Also zwei Bögen, die sich
         voneinander wegdrehen — aus einem wird zweierlei, und man sieht
         die Lücke dazwischen. */
      if (A.weise === 'schaerfen' && !S.aus) {
        var rs2 = Math.min(W(), H()) * 0.034;
        var sp = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(S.t * 0.8));
        for (var se = -1; se <= 1; se += 2) {
          for (var k4 = 0; k4 < 4; k4++) {
            var ws = S.t * 0.5 + se * sp + k4 * 0.22 * se;
            window.__feld.strang(p[0] + Math.cos(ws) * rs2, p[1] + Math.sin(ws) * rs2,
              -Math.sin(ws) * rs2 * se, Math.cos(ws) * rs2 * se,
              0.30, 0.35 + 0.2 * Math.random(), A.farbe, 0);
          }
        }
      }

      /* Cadence ORDNET. Ein völlig gleichmäßiger Ring, ohne Atem und ohne
         Herzschlag — das Metronom im Bild. Die Regelmäßigkeit IST die
         Aussage; alles andere hier atmet. */
      if (A.weise === 'ordnen' && !S.aus) {
        var rc = Math.min(W(), H()) * 0.036;
        for (var k5 = 0; k5 < 4; k5++) {
          var wc = S.t * 0.9 + k5 * 1.5708;
          window.__feld.strang(p[0] + Math.cos(wc) * rc, p[1] + Math.sin(wc) * rc,
            -Math.sin(wc) * rc * 0.8, Math.cos(wc) * rc * 0.8,
            0.26, 0.42, A.farbe, 0);
        }
      }

      /* --- Scout: Er greift nach außen. ---------------------------------
         Seine Fäden entstehen JENSEITS DES BILDRANDES und laufen auf
         seinen Platz zu. Das ist die einzige Stelle, an der etwas von
         außerhalb des Rahmens kommt — und genau das ist der Punkt: Der
         Rahmen ist nicht die Welt. Es gibt eine Wissenswelt dahinter, und
         Recherche heißt, von dort etwas hereinzuholen.
         Die Hitze bleibt unter 0,20, der Schwelle, ab der Resonanz von
         selbst Korn aussät: Was hereingeholt wird, soll ankommen und nicht
         unterwegs funken. */
      if (A.weise === 'holen' && !S.aus) {
        var aus0 = Math.atan2(p[1] - my(), p[0] - mx());

        /* 1. DAS DRAUSSEN IST DA, auch bevor jemand hinlangt.
           Ein paar sehr blasse, stillstehende Punkte weit außerhalb des
           Kreises — kein Zufluss, ein Ort. Vorher war das Universum nur
           ein Strom, der anfing, wenn Scout arbeitete; etwas, das erst
           entsteht, wenn man hineingreift, ist kein Universum, sondern
           ein Hahn. */
        for (var u0 = 0; u0 < 7; u0++) {
          var wu = aus0 + (Math.random() - 0.5) * 2.3;
          var cu = Math.cos(wu), su = Math.sin(wu);
          var tu = Math.min(
            Math.abs(cu) > 1e-3 ? 0.5 * W() / Math.abs(cu) : 1e9,
            Math.abs(su) > 1e-3 ? 0.5 * H() / Math.abs(su) : 1e9);
          var rr2 = tu * (0.62 + 0.55 * Math.random());
          window.__feld.strang(W() / 2 + cu * rr2, H() / 2 + su * rr2, 0, 0,
            0.05 + 0.08 * Math.random(), 0.8 + 0.6 * Math.random(),
            A.farbe, 0);
        }

        /* 2. NEUN STATT DREI, und über eine breitere Front: Recherche ist
           kein Faden, sie ist ein Zug. */
        for (var g = 0; g < 9; g++) {
          var wk = aus0 + (Math.random() - 0.5) * 2.1;
          var cw = Math.cos(wk), sw = Math.sin(wk);
          /* Zwei Grenzen der Maschine, in die ich beide gelaufen bin:
             Resonanz sammelt ein, was weiter als 18 % vor dem Rand liegt;
             und ein verankerter Faden verliert seine Geschwindigkeit mit
             etwa 5 je Sekunde, kommt also nur rund v/5 weit. Also knapp
             hinter dem sichtbaren Rand beginnen und schnell hereinkommen. */
          var tm = Math.min(
            Math.abs(cw) > 1e-3 ? 0.42 * W() / Math.abs(cw) : 1e9,
            Math.abs(sw) > 1e-3 ? 0.46 * H() / Math.abs(sw) : 1e9);
          var raus = 25 + 85 * Math.random();
          var qx = mx() + cw * (tm + raus), qy = my() + sw * (tm + raus);
          var dx = p[0] - qx, dy = p[1] - qy, dl = Math.hypot(dx, dy) || 1;
          var v0 = 1000 + 700 * Math.random();
          window.__feld.strang(qx, qy, dx / dl * v0, dy / dl * v0,
            0.19, 2.2 + 1.0 * Math.random(), A.farbe, 0);
        }

        /* 3. ES KOMMT AN. Vorher bremsten die Fäden irgendwo aus; ein Fund
           hat aber einen Augenblick, in dem er da ist. */
        S.fund = (S.fund || 0) - dt;
        if (S.fund <= 0) {
          S.fund = 0.55 + 0.5 * Math.random();
          /* 4. UND NICHT ALLES ÜBERLEBT. Euer Konzept sagt es selbst:
             „Ein eindrucksvolles Rezept ohne nachvollziehbare Grundlage
             wird verworfen." Jeder vierte Fund stürzt unterwegs ein,
             statt anzukommen — mit derselben Bewegung wie ein verworfenes
             Tischstück, damit man es wiedererkennt. */
          if (Math.random() < 0.26) {
            var wf = aus0 + (Math.random() - 0.5) * 1.3;
            var df = Math.min(W(), H()) * (0.10 + 0.14 * Math.random());
            einsturz(p[0] + Math.cos(wf) * df, p[1] + Math.sin(wf) * df, A.farbe);
          } else {
            window.__feld.knoten(p[0], p[1], 0.58, A.farbe, 0, 12, 0.6);
          }
        }
      }

      /* --- Nova: Sie bringt hervor. -------------------------------------
         Ihre Punkte kommen nirgends her. Sie stehen still, sind plötzlich
         da und vergehen wieder — kein Zufluss, kein Weg, keine Herkunft.
         Und ab und zu verdichtet sich einer zu einem hellen Knoten: eine
         Vision. Das Gegenteil von Scouts Bewegung, mit Absicht. */
      if (A.weise === 'erfinden' && !S.aus) {
        /* Zwölf Punkte auf 0,135 statt fünf auf 0,095: zu wenig und zu eng,
           um als Sphäre gelesen zu werden, in der etwas entstehen kann. */
        var rr0 = Math.min(W(), H()) * 0.135;
        for (var g2 = 0; g2 < 12; g2++) {
          var w3 = Math.random() * 6.2832, d3 = rr0 * Math.sqrt(Math.random());
          window.__feld.strang(p[0] + Math.cos(w3) * d3, p[1] + Math.sin(w3) * d3,
            0, 0, 0.07 + 0.14 * Math.random(),
            1.4 + 1.1 * Math.random(), A.farbe, 0);
        }
        /* Eine Vision ENTSTEHT, sie erscheint nicht. Vorher sprang alle
           zwei bis vier Sekunden ein fertiger Knoten irgendwo hin — das
           las sich als Blinken, nicht als Einfall. Jetzt verdichtet sich
           eine Stelle über anderthalb Sekunden: Die Punkte ringsum ziehen
           zu ihr hin und werden heller, und erst dann steht sie da. */
        if (!S.traum || S.traum.t > 1.9) {
          var wv = Math.random() * 6.2832, dv = rr0 * (0.25 + 0.6 * Math.random());
          S.traum = { x: p[0] + Math.cos(wv) * dv,
                      y: p[1] + Math.sin(wv) * dv, t: 0 };
        }
        var T = S.traum; T.t += dt;
        var reif = Math.min(1, T.t / 1.4);
        for (var g3 = 0; g3 < 4; g3++) {
          var w5 = Math.random() * 6.2832;
          var d5 = Math.min(W(), H()) * 0.055 * (1 - reif * 0.75);
          window.__feld.strang(T.x + Math.cos(w5) * d5, T.y + Math.sin(w5) * d5,
            -Math.cos(w5) * 70 * reif, -Math.sin(w5) * 70 * reif,
            0.12 + 0.34 * reif, 0.35 + 0.25 * Math.random(), A.farbe, 0);
        }
        if (T.t > 1.4 && !T.da) {
          T.da = 1;
          /* Da ist sie. Hell, kurz — und sie hinterlässt nichts: Eine Idee
             ist noch kein Ergebnis. Dasselbe Gesetz wie überall. */
          window.__feld.knoten(T.x, T.y, 0.88, A.farbe, 0, 22, 1.2);
          window.__feld.austreiben(T.x, T.y, A.farbe, 3, 0);
        }
      }

      /* Und das Medium dreht mit: Die Arbeit rührt ihren eigenen kleinen
         Wirbel, ohne dafür einen Kern zu belegen — die sind für Bälle da.

         Aber schwach, und das ist der Unterschied zwischen Arbeiten und
         Chaos: Das Strömungsfeld klingt über anderthalb Sekunden ab und
         nimmt bei jedem Bild den gestrichenen Wert an. Wer also fünfzehn
         Sekunden lang mit 150 px/s hineinstreicht, baut dort einen
         stehenden Strudel, der alles Vorbeikommende mitreißt — gemessen
         war Nova nach 15 s elfmal so hell wie Archibald nach zweien, und
         der einzige Unterschied war die Dauer. Arbeit soll nach zwei
         Sekunden aussehen wie nach fünfzehn: Sie ist dieselbe Tätigkeit. */
      /* Gar keine Strömung mehr. Der Tisch streicht auch keine und bleibt
         deshalb sauber; die Arbeit braucht sie ebensowenig, um als Drehung
         gelesen zu werden — sie hat ihren Atem und ihren Herzschlag. */
    }
    /* Am Ring sieht man es auch ohne hinzusehen: Wer arbeitet, leuchtet. */
    if (ring.children.length) {
      for (var i = 0; i < AGENTEN.length; i++) {
        var e = ring.children[i];
        if (!e) continue;
        var W2 = arbeit[AGENTEN[i].name];
        var an = !!(W2 && !W2.aus);
        if (e.__an !== an) { e.__an = an; e.classList.toggle('arbeitet', an); }
      }
    }
  }

  /* ===================================================== DER AUSKLANG ===
     Wenn alles gesagt ist, kommt das Feld zur Ruhe — und zwar ganz, bis
     zurück zum Anfang: ein Team, das seine Bereitschaft pulsiert und auf
     eine Aufgabe wartet.

     Eine Feststellung dazu, die aus den Daten kommt und nicht aus dem
     Bild: Die Ruhe kann NICHT an der Rückgabe des Balls hängen. Atlas gibt
     ihn bei t=100 an Peter zurück (E30, „Ergebnis und verbleibende Grenzen
     zur Entscheidung"), aber danach geht es weiter — Nova fragt (E31),
     zwei neue Aufträge gehen hinaus (E32, E33), und das letzte Ereignis
     heißt wörtlich „Kein Abschluss". Euer Stück endet mit Absicht offen.
     Also beginnt der Ausklang am Ende der Liste, nicht an der Rückgabe.

     Dass auch der Niederschlag vergeht, ist kein Bruch des Gesetzes,
     sondern sein Ende: „Bleibt" gilt für die Dauer eines Stücks. Wenn das
     Stück aus ist, wird die Bühne geräumt — sonst könnte es nie wieder
     von vorn beginnen. */
  var ausklang = 0;

  /* Der Ablauf des Ausklangs. Jede Zeile feuert einmal, in dieser
     Reihenfolge — vorher setzte alles im selben Bild ein, und danach
     geschah sechsundzwanzig Sekunden lang nichts mehr. */
  var AUSKLANG_DAUER = 18;
  var AUSKLANG_PLAN = [
    [0,  'arbeit'],   /* die Arbeit hört auf          */
    [2,  'tisch'],    /* der Tisch räumt sich         */
    [4,  'feld'],     /* das Feld beginnt zu vergehen */
    [6,  'werk'],     /* das Fertige leuchtet auf     */
    [9,  'ruf'],      /* alle treten in Rufbereitschaft */
    [11, 'liste']     /* die Liste verblasst          */
  ];
  var ausklangStufe = 0, rufbereit = 0;

  function ausklangStufen() {
    var ver = AUSKLANG_DAUER - ausklang;
    while (ausklangStufe < AUSKLANG_PLAN.length &&
           ver >= AUSKLANG_PLAN[ausklangStufe][0]) {
      var was = AUSKLANG_PLAN[ausklangStufe++][1];

      if (was === 'arbeit') {
        for (var n1 in arbeit) { var S1 = arbeit[n1]; if (!S1.aus) S1.aus = 2.4; }

      } else if (was === 'tisch') {
        /* Gestaffelt, nicht auf einmal: Das älteste geht zuerst zurück. */
        for (var i1 = 0; i1 < tisch.length; i1++)
          if (tisch[i1].zurueck == null) tisch[i1].zurueck = 2.5 + i1 * 1.2;

      } else if (was === 'feld') {
        /* Der Niederschlag vergeht. Das kann nur die Maschine; die Schicht
           hier hat keinen Zugriff auf die Fläche. Laut werden, wenn der
           Hahn fehlt — genau das ist einmal passiert, und die höfliche
           Prüfung hat den Ausfall verschluckt. */
        if (window.__abklingen) window.__abklingen(10);
        else if (window.console) console.error('__abklingen fehlt');
        /* Ruhe ist nicht Dunkelheit: Ein Boden unter der Wachheit hält das
           Fertige sichtbar, während die Wirbel auslaufen. */
        if (window.__wachHalten) window.__wachHalten(0.42, AUSKLANG_DAUER);
        else if (window.console) console.error('__wachHalten fehlt');

      } else if (was === 'ruf') {
        rufbereit = 1;

      } else if (was === 'liste') {
        eckeEl.classList.add('ausklang');
      }
    }
  }

  function ausklangBeginnen() {
    if (ausklang) return;
    ausklang = AUSKLANG_DAUER;
    ausklangStufe = 0; rufbereit = 0;
    /* Die Stopper BLEIBEN. Was blockiert war, liegt im Rückstand — es
       verschwindet nicht, nur weil das Stück zu Ende ist. Dass danach neu
       begonnen wird, ist genau das: Sie werden aufgegriffen. */
    /* Der Niederschlag verblasst über sechzehn Sekunden statt für immer zu
       bleiben. Das kann nur die Maschine; die Schicht hier hat keinen
       Zugriff auf die Fläche. */
    /* Laut werden, wenn der Hahn fehlt. Genau das ist einmal passiert:
       `window.__abklingen` wurde aufgerufen, war aber nie definiert, weil
       der Patch, der ihn einbaute, abgebrochen war. Die höfliche Prüfung
       `if (window.__abklingen)` hat den Ausfall verschluckt — das Stück
       lief weiter, nur ging das Licht nie aus. */
    if (window.__abklingen) window.__abklingen(16);
    else if (window.console) console.error('__abklingen fehlt — Ausklang ohne Wirkung');

    /* Ruhe ist nicht Dunkelheit. Solange der Ausklang läuft, hält ein Boden
       unter der Wachheit das Fertige sichtbar, während die Wirbel selbst
       auslaufen. Der Hahn sitzt in der Maschine; von hier aus wird er nur
       gestellt. */
    if (window.__wachHalten) window.__wachHalten(0.42, 26);
    else if (window.console) console.error('__wachHalten fehlt — Ausklang dunkel');

    /* DER BALL BLEIBT, WO ER IST.

       Vorher wurde er am Ende zu Peter zurückgeworfen. Das war eine
       Behauptung, die die Daten nicht decken: In V1 heißt das letzte
       Ereignis wörtlich „Kein Abschluss", und in V2 bleiben sechs Aufgaben
       offen. Ein Ball, der trotzdem heimkommt, erzählt von einer
       Ablieferung, die nicht stattgefunden hat.

       Er liegt jetzt dort, wo das Stück ihn gelassen hat — bei dem, der
       zuletzt die Aufgabe hatte. Kommt er in den Daten zurück (in V1 ist
       das E30, Atlas an Peter), liegt er bei Peter, und auch das steht dann
       in den Daten und nicht in meiner Regie. */
  }

  /* ======================================================== DIE ARBEIT ==
     Wieviel ist noch zu tun? Die Frage ist beantwortbar, aber nicht aus
     einer Zahl in den Daten — die Ereignisse sind das Geschehen, nicht der
     Plan. Vier Größen lassen sich jederzeit aus ihnen ablesen, und alle
     vier bewegen sich ständig:

       offen        vergeben und noch nicht geliefert
       prüfung      geliefert und noch nicht angenommen (auf dem Tisch)
       blockiert    wartet auf eine Antwort (Stopper)
       fertig       angenommen — das sind die Bausteine in der Mitte

     Dass der Vorrat auch WÄCHST, ist kein Kunstgriff: Ein Change Request
     bringt Arbeit herein, ein Widerspruch schickt ein Stück zurück. Nur
     die Abnahme verkleinert ihn.

     Der Umfang (V1: vier Stories, V2: 21 Storyideen) steht in eurem
     Konzeptpapier und kommt als Datenfeld mit. Fehlt er, zeigt der Stand
     nur die vier Größen und behauptet keine Vollständigkeit. */
  /* Der Block unten rechts ist ENTFALLEN. Er zeigte dieselben vier
     Groessen und denselben Aufgabenzaehler wie der Block oben rechts --
     zwei Anzeigen, die nahezu dasselbe aussagten. Die vier Groessen stehen
     jetzt im einen Block oben; unten rechts bleiben nur die Knoepfe.
     Der Umfang aus dem Konzept steht dort als das, was er ist: eine
     Angabe aus dem Papier, kein Messwert. */

  /* -------------------------------------------------------- Das Stück */
  /* `laeuft` beginnt nur im Demo-Modus auf wahr. In allen anderen wartet
     das Stück — im Archiv auf den Knopf, im Live-Betrieb auf Daten. */
  var zeit = 0, naechstes = 0, laeuft = true, tempo = 1;

  function schritt(dt) {
    if (laeuft) {
      zeit += dt * tempo;
      while (naechstes < STUECK.ereignisse.length &&
             STUECK.ereignisse[naechstes].t <= zeit) {
          var E = STUECK.ereignisse[naechstes++];
        /* Was beendet die Arbeit? Nicht alles, was jemand von sich gibt.
           Eine Rückfrage beendet sie nicht — man fragt und arbeitet weiter;
           ein Widerspruch und ein gemeldeter Fehler auch nicht. Was sie
           beendet, ist, dass etwas Gewichtiges herausgeht: ein Ergebnis
           (Wurf) oder die weitergegebene Aufgabe (Ball).
           Im ersten Lauf endete sie bei jedem Ereignis, und Nova hörte nach
           fünf Sekunden auf zu arbeiten, weil sie eine Frage gestellt
           hatte. */
        var mE = ARTEN[E.art];
        if (mE && (mE.gestalt === 'wurf' || mE.gestalt === 'sonne'))
          auftragFertig(E.von, E.erledigt || E.aufgabe);
        /* Ein geliefertes Ergebnis kommt auf den Tisch; eine bestandene
           Prüfung und ein abgeschlossenes Review nehmen das älteste ab. */
        if (E.art === 'artifact') {
          /* Wie lange wurde daran gearbeitet? Der letzte Auftrag an den
             Lieferanten, der noch offen ist — dieselbe Zahl, die auch die
             Ballgröße bestimmt hat. */
          var AW = arbeit[E.von];
          hinlegen(nachName[E.von].farbe, E.text,
                   (AW && AW.liste.length) ? (zeit - AW.liste[0].beginn) : 0,
                   E.artefakt, E.version, E.aufgabe);
        }
        if (E.art === 'test_result' || E.art === 'review_result')
          abnehmen(E.prueft, E.version);
        /* Wer fragt oder etwas offen lässt, ist ab jetzt blockiert. Wer
           eine Antwort oder eine Entscheidung BEKOMMT, ist es nicht mehr. */
        if (E.art === 'question' || E.art === 'open_state')
          stopperAn(E.von, E.text, E.klasse || 'abhaengigkeit', E.id);
        if (E.art === 'answer' || E.art === 'decision') {
          /* Beantwortet die Antwort eine BESTIMMTE Frage, wird auch nur
             deren Blockade gelöst. Ohne `antwortet_auf` die des
             Empfängers — bisher die einzige Möglichkeit. */
          var zf = E.antwortet_auf || '';
          var S2 = stopper[E.an];
          if (!zf || !S2 || !S2.frage || S2.frage === zf) stopperAus(E.an);
        }
        /* Ein ausdrücklicher Stop trifft den EMPFÄNGER — er ist der, der
           nicht weiterkann. Ein `resume` hebt ihn auf. */
        if (E.art === 'stop' || E.art === 'resume') {
          if (E.art === 'stop') stopperAn(E.an || E.von, E.text, E.klasse);
          else stopperAus(E.an || E.von);
          /* Kein Flug: Ein Stop kommt nicht von einem Agenten zum anderen,
             er trifft einen. In die Liste gehört er trotzdem — er ist das,
             was gerade geschieht. */
          stromZeile(E, ARTEN[E.art]);
          tunStill = 0;
          continue;
        }
        wirf(E);
        tunStill = 0;        /* es ist etwas passiert — die Pause ist aus */
      }
      if (naechstes >= STUECK.ereignisse.length) {
        if (!ausklang && zeit > STUECK.dauer + 3) ausklangBeginnen();
        if (ausklang) {
          ausklang -= dt;
          ausklangStufen();
          kometSchritt(dt);
          /* Der Ball bleibt jetzt liegen, statt sich aufzulösen. Vorher
             verschwand er in den letzten vier Sekunden — das war falsch:
             Eine erledigte Aufgabe ist nicht weg, sie ist ABGELIEFERT, und
             sie liegt beim Auftraggeber. Das Bild endet also mit dreierlei:
             dunkles Feld, Ball bei Peter, leuchtendes Produkt. */

          /* Von vorn beginnt nur, wer von vorn beginnen darf. Im Archiv
             und im Live-Betrieb bleibt das Bild stehen, wie es ist — dort
             gäbe es nichts, wohin zurück. */
          if (ausklang <= 0 && !modus().neu) { ausklang = 0.0001; laeuft = false; }
          if (ausklang <= 0) {                   /* von vorn */
            ausklang = 0; zeit = 0; naechstes = 0; visionen = 0;
            ausklangStufe = 0; rufbereit = 0;
            eckeEl.classList.remove('ausklang');
            kometen.length = 0; kometUhr = 0;
            for (var nn2 in arbeit) delete arbeit[nn2];
            for (var ns in stopper) delete stopper[ns];
            tisch.length = 0; derBall = null; baelle.length = 0;
            bausteine.length = 0; produkt = 0; werkEl.innerHTML = '';
            register.length = 0; aufgabenAuf = 0; aufgabenZu = 0;
            ratNull();
            rufeEl.innerHTML = '';
          }
        }
      }
    }
    for (var i = baelle.length - 1; i >= 0; i--)
      if (!ballSchritt(baelle[i], dt)) baelle.splice(i, 1);
    arbeitSchritt(dt);
    erwartungSchritt(dt);
    produktSchritt(dt);
    stopperSchritt(dt);
    liveHinweis();
    knoepfeSetzen();
    stoppZeigen();
    tunZeigen(dt);
    bereitschaft(dt);
    rollenWechseln(dt);
    aktivitaetZeigen();
    motorenZeigen();
    ballSchrittRuhend(dt);
    tischSchritt(dt);
    uhrZeigen();
  }
  window.__agSchritt = schritt;
  /* Messsonde. Nur zum Nachmessen im Browser, nicht fürs Bild. */
  window.__agStand = function () {
    return { zeit: zeit, ausklang: ausklang, naechstes: naechstes,
             ereignisse: STUECK.ereignisse.length, dauer: STUECK.dauer,
             bausteine: bausteine.length, visionen: visionen,
             aufgabenAuf: aufgabenAuf, aufgabenZu: aufgabenZu,
             register: register.length,
             bandL: bandL(), bandR: bandR(), ringR: ringR(),
             geraten: geraten.gesamt, ratEinzeln: {
               auftrag: geraten.auftrag, abnahme: geraten.abnahme,
               gegen: geraten.gegen, antwort: geraten.antwort },
             ball: derBall ? derBall.bei : null,
             still: tunStill,
             arbeiten: (function () { var r = [];
               for (var n in arbeit) if (!arbeit[n].aus && arbeit[n].liste.length)
                 r.push(n + ':' + arbeit[n].liste.length);
               return r; })() };
  };

  /* ------------------------------------------------- Was man dazu liest */
  /* Der Projektname gehört zu den DATEN, nicht in den Code: Dieselbe Bühne
     soll morgen ein anderes Projekt zeigen, ohne dass jemand etwas
     umschreibt. Steht kein `projekt` im Stück, bleibt die Zeile leer.
     Die Beschreibung kommt auf Antippen, nicht als Tooltip — auf einem
     iPad gibt es kein Darüberfahren. */
  /* Oben rechts, wo der Projektname steht, wird das Projekt auch gewählt.
     Ein Name, der schon dasteht, ist der natürliche Ort dafür — ein eigener
     Knopf unten wäre eine zweite Stelle für dieselbe Sache gewesen.
     Ein Tippen klappt das Blatt auf: welche Stücke es gibt, welches läuft,
     und was es ist. Ein zweites Tippen schließt es wieder. */
  var projektEl = document.getElementById('agProjekt'),
      kopfEl = document.getElementById('agKopf'),
      wasEl = document.getElementById('agWas');

  /* DIE KNÖPFE WERDEN AUS DEM MODUS ABGELEITET. Von Hand gesetzt gäbe es
     früher oder später eine Live-Ansicht mit einem „Von vorn"-Knopf, der
     nichts tut — und das ist schlimmer als kein Knopf, weil es Vertrauen
     kostet. */
  function knoepfeSetzen() {
    var M = modus();
    var v = document.getElementById('agVorn');
    if (v) v.style.display = M.vorn ? '' : 'none';
    /* „Halt" braucht etwas, das läuft. Im Live-Betrieb ohne Verbindung
       gibt es das nicht, also gibt es den Knopf auch nicht — dieselbe
       Regel wie bei „Von vorn". Ein Knopf, der nichts tut, kostet mehr als
       er nützt. */
    var hl = document.getElementById('agHalt');
    if (hl) {
      var kann = (MODUS !== 'live') || verbunden;
      hl.style.display = kann ? '' : 'none';
      hl.textContent = laeuft ? (MODUS === 'live' ? 'Anhalten' : 'Halt')
                              : (MODUS === 'archiv' && zeit === 0 ? 'Starten'
                                                                  : 'Weiter');
    }
    document.body.setAttribute('data-modus', MODUS);
    document.body.setAttribute('data-gross',
      schmal() ? 'telefon-hoch' : (flach() ? 'telefon-quer' : 'weit'));
    /* Wie hoch die Knopfleiste WIRKLICH ist, statt einer Zahl im
       Stylesheet. Auf dem Telefon bricht sie um, und dann stimmt jede
       feste Zahl nicht mehr -- 52 Pixel waren fuer eine Reihe gemessen,
       zwei Reihen schoben die Liste in die Knoepfe. Gemessen wird nach
       dem Umbruch, also im naechsten Bild. */
    setTimeout(function () {
      var tst = document.getElementById('agTasten');
      if (!tst) return;
      var hoehe = Math.round(tst.getBoundingClientRect().height);
      if (hoehe > 0)
        document.documentElement.style.setProperty('--agTastenH', hoehe + 'px');
    }, 0);
  }

  /* Umschalten. Der Modus gehört zum PROJEKT, also wird er dort gewählt,
     wo man das Projekt wählt. */
  function modusSetzen(m) {
    if (!MODI[m]) return;
    MODUS = m;
    zurueckAufAnfang();
    laeuft = !!modus().start;
    kopfSetzen();
    knoepfeSetzen();
    aktivitaetModus();
  }

  /* Der lokale Aktivitaets-Eingang (activity-input.js) ist eigenstaendig und
     nur im Live-Modus mit ausdruecklicher Freigabe aktiv. Er bekommt nur den
     Modus und die Namensschilder; er ruft weder arbeitAn() noch
     auftragFertig() und beruehrt keine Zaehler. */
  function aktivitaetModus() {
    if (window.__agActivity) window.__agActivity.modus(MODUS);
  }
  function aktivitaetZeigen() {
    if (!window.__agActivity) return;
    var n = [];
    for (var i = 0; i < AGENTEN.length; i++) n.push(AGENTEN[i].name);
    window.__agActivity.render(window.performance ? performance.now() : Date.now(),
                               ring.children, n);
  }

  function kopfSetzen() {
    projektEl.textContent = STUECK.projekt || '';
    /* Beim Zeigen auf den Namen steht da, was BALL heißt und welche
       Fassung läuft. Im Ruhezustand ist es weg — der Monitor soll das Feld
       zeigen, nicht seine eigenen Angaben. */
    var fe = document.getElementById('agFassung');
    if (fe) fe.innerHTML =
      'BALL — Bio-Agent &amp; LLM Logistics<br>' +
      'Agentarium ist die sichtbare Welt des Teams; BALL die Orchestrierung ' +
      'dahinter: Aufgaben, Zustände und Übergaben zwischen Mensch und ' +
      'LLM-Agenten.<br><b>Fassung ' + FASSUNG + ' &middot; ' + GEBAUT + '</b>';
    var h = '';
    if (STUECKE.length > 1) {
      h += '<ul class="wProjekte">';
      STUECKE.forEach(function (S, i) {
        h += '<li' + (i === stueckNr ? ' class="hier"' : '') +
             ' data-nr="' + i + '">' + (S.projekt || S.titel || ('Stück ' + (i+1))) +
             '</li>';
      });
      h += '</ul>';
    }
    if (STUECK.titel && STUECK.titel !== STUECK.projekt)
      h += '<p class="wTitel">' + STUECK.titel + '</p>';
    if (STUECK.beschreibung) h += '<p>' + STUECK.beschreibung + '</p>';

    h += '<ul class="wModi">';
    ['demo', 'archiv', 'live'].forEach(function (m) {
      h += '<li' + (m === MODUS ? ' class="hier"' : '') + ' data-modus="' + m +
           '">' + MODI[m].wort + '</li>';
    });
    h += '</ul><p class="wModusWas">' + modus().was + '</p>';

    wasEl.innerHTML = h;
    projektEl.classList.add('fragbar');
  }

  /* ANZEIGE UND AUSWAHL SIND DASSELBE DING.

     Vorher stand der Projektname im Kopf rechts oben UND oeffnete dort die
     Auswahl, waehrend links die Marke lag; Peter: „Projektauswahl davon
     trennen und diese vermengen mit der Projektanzeige rechts oben."

     Der Zuhoerer haengt deshalb am ganzen Block, nicht am Namen: Was
     anzeigt, welcher Lauf laeuft, ist auch das, womit man ihn wechselt.
     GENAU EIN Zuhoerer — ein zweiter am Namen wuerde sich selbst aufheben,
     weil der Klick nach oben durchlaeuft und zweimal umschaltete. */
  kopfEl.addEventListener('click', function () {
    tastenZeigen();
    wasEl.classList.toggle('auf');
  });
  wasEl.addEventListener('click', function (e) {
    /* Die Betriebsart zuerst: Sie steht im selben Blatt wie die Projekte,
       und ein Klick darauf soll das Blatt nicht schließen. */
    var lm = e.target.closest ? e.target.closest('li[data-modus]') : null;
    if (lm) { modusSetzen(lm.getAttribute('data-modus'));
              wasEl.classList.add('auf'); return; }
    var li = e.target.closest ? e.target.closest('li[data-nr]') : null;
    if (li) {
      var nr = +li.getAttribute('data-nr');
      if (nr !== stueckNr) { stueckNr = nr; STUECK = STUECKE[nr];
                             kopfSetzen(); zurueckAufAnfang(); }
      /* NACH DER WAHL GEHT DAS BLATT ZU.
         Vorher blieb es offen, mit der Begruendung „man liest noch".
         Peter: „wenn ein projekt ausgewaehlt wurde, ist das schliessen des
         fensters eher muehsam." Wer gewaehlt hat, ist fertig -- und das
         Gewaehlte steht danach im Kopf, wo man es ohnehin sieht. */
      wasEl.classList.remove('auf');
      return;
    }
    wasEl.classList.remove('auf');
  });

  /* Und ein Tippen irgendwo sonst schliesst es auch. Vorher ging es nur
     ueber ein zweites Tippen auf genau den Kopf zurueck -- auf einem
     Telefon ein kleines Ziel. */
  document.addEventListener('click', function (e) {
    if (!wasEl.classList.contains('auf')) return;
    if (wasEl.contains(e.target) || kopfEl.contains(e.target)) return;
    wasEl.classList.remove('auf');
  }, true);

  var uhr  = document.getElementById('agUhr'),
      ring = document.getElementById('agRing'),
      laeuftEl = document.getElementById('agLaeuft'),
      eckeEl   = document.getElementById('agEcke'),
      rufeEl   = document.getElementById('agRufe');

  var ZUSTAND = [
    ['bleibt',    'bleibt',
      function (a) { return a.abgabe > 0; }],
    ['verblasst', 'verblasst',
      function (a) { return a.abgabe === 0 && a.nachhall > 3; }],
    ['nichts',    'hinterlässt nichts',
      function (a) { return a.abgabe === 0 && a.nachhall <= 3; }]
  ];
  function zustandVon(m) {
    for (var i = 0; i < ZUSTAND.length; i++) if (ZUSTAND[i][2](m)) return ZUSTAND[i];
    return ZUSTAND[2];
  }

  /* Oben links steht GENAU EINE Sache: was offen ist.
     Zwei Listen übereinander waren verwirrend, und der Grund war nicht die
     Anordnung — beide SAHEN aus wie dasselbe Ding, also suchte das Auge
     einen Zusammenhang, den es nicht gibt. Das eine ist ein Zustand (was
     offen ist), das andere ein Ereignis (was gerade geschah). */
  /* DIE LISTE IST EIN STROM, kein Zustand.

     Vorher standen dort nur die offenen Aufträge — und in V1 sind selten
     mehr als zwei oder drei gleichzeitig offen. Sie wuchs nicht, weil es
     nichts zu wachsen gab. „Endlos fortsetzen" heißt aber: jedes Ereignis
     bekommt eine Zeile, die neueste unten, und was oben hinausrückt, ist
     vorbei.

     Die offenen Aufträge sind darin trotzdem zu erkennen: Sie tragen ihr
     Kommando und bleiben hell, bis geliefert ist. Alles andere steht
     blasser da — es ist schon geschehen. Damit sagt eine Liste zwei Dinge
     zugleich, was zuvor zwei Listen gebraucht hat. */
  var strom = [], stromNr = 0;

  function stromZeile(E, m) {
    var A = nachName[E.von], B = nachName[E.an];
    if (!A) return;
    var auftrag = (m.gestalt === 'sonne' && E.an && E.an !== E.von);
    var e = document.createElement('div');
    e.className = 'agAuf' + (auftrag ? ' offen' : ' tat');
    e.__nr = ++stromNr;
    e.__wer = E.an; e.__auftrag = auftrag;
    var zu = zustandVon(m);
    e.innerHTML = auftrag
      ? ('<u style="color:' + hex(B.farbe) + '">' + (E.kommando || '') +
         '</u> <b style="color:' + hex(B.farbe) + '">' + E.an + '</b>' +
         (E.modell ? ' <i class="agMotor">' + E.modell + '</i>' : '') +
         '<br><span>' + E.text + '</span>')
      : ('<u style="color:' + hex(A.farbe) + '">' + E.von + '</u>' +
         (B ? ' <b style="color:' + hex(B.farbe) + '">→ ' + E.an + '</b>' : '') +
         ' <s class="z-' + zu[0] + '">' + E.art + '</s>' +
         '<br><span>' + E.text + '</span>');
    laeuftEl.appendChild(e);
    strom.push(e);
    /* Vier. Vorher waren es sechzehn, weil die Liste über den ganzen
       Schirm lief; jetzt hängt sie unter dem Kopf und soll dort aufhören,
       wo man im Vorbeigehen noch mitliest. Der älteste fällt oben weg. */
    var zeilen = klein() ? 2 : 4;
    while (strom.length > zeilen) { var w = strom.shift(); if (w.parentNode) w.remove(); }
  }

  /* Wenn ein Auftrag erledigt ist, hört seine Zeile auf, hell zu sein. */
  function stromErledigt(name) {
    for (var i = strom.length - 1; i >= 0; i--) {
      if (strom[i].__auftrag && strom[i].__wer === name &&
          strom[i].classList.contains('offen')) {
        strom[i].classList.remove('offen');
        strom[i].classList.add('tat');
        return;
      }
    }
  }

  function laeuftZeigen() { }

  /* Der Verlauf ist keine Liste mehr. Was geschieht, sagt sich DORT, wo es
     geschieht: eine kurze Beschriftung am Empfänger, nach außen
     geschrieben, die nach sieben Sekunden vergeht — wie alles andere hier
     auch. Damit steht der Text IM Bild statt daneben. */
  function melden(von, an, art, text, m) {
    var A = nachName[an] || nachName[von];
    if (!A || !nachName[von]) return;
    var o = heimat(A);
    var e = document.createElement('div');
    e.className = 'agRuf';
    var zm = Math.atan2(o[1] - my(), o[0] - mx());
    e.style.left = (o[0] + Math.cos(zm) * 30) + 'px';
    e.style.top  = (o[1] + Math.sin(zm) * 30) + 'px';
    e.style.transform = 'translate(' +
      (Math.cos(zm) > 0.25 ? '0' : (Math.cos(zm) < -0.25 ? '-100%' : '-50%')) +
      ',' + (Math.sin(zm) > 0 ? '0' : '-100%') + ')';
    e.style.textAlign = Math.cos(zm) < -0.25 ? 'right' : 'left';
    var zu = zustandVon(m);
    e.innerHTML = '<u style="color:' + hex(nachName[von].farbe) + '">' +
                  von + '</u> <s class="z-' + zu[0] + '">' + art + '</s>' +
                  '<br><span>' + text + '</span>';
    rufeEl.appendChild(e);
    /* Nach außen schreiben ist richtig, solange außen Platz ist. Seit der
       Kreis nach rechts gewandert ist, stehen Nova, Argus und Archibald
       dicht am Bildrand — ihre Beschriftungen liefen hinaus und waren
       abgeschnitten. Also nach dem Setzen nachmessen und hereinholen; die
       Richtung bleibt, nur der Rand gewinnt. */
    var k = e.getBoundingClientRect();
    /* Rechts ist nicht am Bildrand Schluss, sondern dort, wo die Spalte mit
       Kopf, Produkt und Stand beginnt. Vorher stand hier `W() - 10`, und
       eine Beschriftung von Archibald legte sich quer über den Produkttitel
       — im Bild nachgesehen. */
    if (k.right > bandR() + 10) {
      e.style.transform = e.style.transform.replace(/translate\([^,]+,/,
        'translate(-100%,');
      e.style.textAlign = 'right';
      e.style.left = Math.min(o[0] - 30, bandR() + 8) + 'px';
    } else if (k.left < bandL() - 12) {
      /* Links ist nicht bei null zu Ende, sondern dort, wo die Liste
         aufhört. Genau das war Peters zweiter Befund: Beschriftungen
         liefen in die Liste hinein und beide waren unlesbar. */
      e.style.transform = e.style.transform.replace(/translate\([^,]+,/,
        'translate(0,');
      e.style.textAlign = 'left';
      e.style.left = Math.max(o[0] + 30, bandL() - 10) + 'px';
    }
    var k2 = e.getBoundingClientRect();
    if (k2.bottom > H() - 8)
      e.style.top = (parseFloat(e.style.top) - (k2.bottom - (H() - 8))) + 'px';
    setTimeout(function () { if (e.parentNode) e.remove(); }, 7400);
    while (rufeEl.children.length > 7) rufeEl.removeChild(rufeEl.firstChild);
  }

  function hex(h) {
    var r = [0, 2/3, 1/3].map(function (o) {
      var v = Math.abs(((h + o) % 1) * 6 - 3) - 1;
      v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v);
    });
    return 'rgb(' + r.map(function (v) { return Math.round(90 + v * 165); }).join(',') + ')';
  }
  function uhrZeigen() {
    /* Im Live-Betrieb läuft die Uhr der Wirklichkeit, ohne Deckel. In den
       anderen Betriebsarten die Zeit des Stücks, und die endet mit ihm. */
    if (MODUS === 'live') {
      var d = new Date();
      uhr.textContent = ('0' + d.getHours()).slice(-2) + ':' +
                        ('0' + d.getMinutes()).slice(-2) + ':' +
                        ('0' + d.getSeconds()).slice(-2);
      return;
    }
    var s = Math.floor(Math.min(zeit, STUECK.dauer));
    uhr.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
  }

  var GESTALT = {
    pfeil:   'Pfeil mit Strömung, Knoten beim Ankommen',
    wurf:    'Wurf — läuft weiter und pflügt ins Feld',
    gegen:   'Pfeil, der quer wegdreht; Wirbel dreht dagegen',
    bersten: 'zerspringt in Funken',
    sonne:   'ein Stück vom goldenen Ball — der Empfänger arbeitet dann'
  };

  /* Die Legende hat zwei Teile, und der Unterschied ist wichtig:

     Der erste Teil wird aus der Mappingtabelle ERZEUGT — fünfzehn
     Nachrichtenarten, ihr Zustand, ihre Gestalt, ihre Dauer. Er kann nicht
     veralten, weil er dieselbe Quelle hat wie das Verhalten.

     Der zweite Teil ist von Hand geschrieben: Ball, Arbeit, Tisch, Stopper,
     Schleuse, Einsturz. Die stehen nicht in der Tabelle, weil sie keine
     Nachrichtenarten sind, sondern Zustände und Vorgänge. Genau deshalb
     fehlten sie zuerst in der Legende, obwohl ich behauptet hatte, sie
     könne nicht veralten. Sie konnte — nur nicht an der Stelle, auf die
     ich geachtet hatte. */
  var legende = document.getElementById('agGesetz');
  (function legendeBauen() {
    /* Der Name zuerst. „BALL" steht im Leitmotiv groß da und war im
       ganzen Vorrat nirgends aufgelöst — siebenmal in den Anforderungen,
       einmal im Team-Brief, zweimal in alten Mustern, immer ohne
       Erklärung. Ein tragender Begriff, der nur in einem Gespräch lebt,
       ist verloren, sobald das Gespräch vorbei ist. Peters Fassung vom
       11. Oktober, wörtlich übernommen. */
    var h = '<h4>Der Name</h4>' +
            '<p class="gSatz"><b>BALL</b> — Bio-Agent &amp; LLM Logistics.</p>' +
            '<table>' +
            zeile('Agentarium', 'die sichtbare Welt des Teams', '') +
            zeile('BALL', 'die Orchestrierung dahinter: Aufgaben, Zustände ' +
                  'und Übergaben zwischen Mensch und LLM-Agenten', '') +
            zeile('der Ball', 'die Frage, die man im Bild sieht: ' +
                  '„Bei wem liegt gerade der Ball?"', '') +
            '</table>' +
            '<h4>Das Gesetz</h4>' +
            '<p class="gSatz">Nur Beschlossenes <b>bleibt</b>. ' +
            'Verkehr <b>verblasst</b>. Offenes <b>hinterlässt nichts</b>. ' +
            'Verworfenes <b>stürzt ein</b>.</p>';
    ZUSTAND.forEach(function (Z) {
      var zeilen = Object.keys(ARTEN).filter(function (k) { return Z[2](ARTEN[k]); });
      if (!zeilen.length) return;
      h += '<h4 class="z-' + Z[0] + '">' + Z[1] + '</h4><table>';
      zeilen.forEach(function (k) {
        var m = ARTEN[k];
        h += '<tr><td class="gArt">' + k + '</td><td class="gWas">' + m.was +
             '</td><td class="gRes">' + GESTALT[m.gestalt] +
             '</td><td class="gDau">' +
             (m.abgabe > 0 ? 'Niederschlag' : Math.round(m.nachhall) + ' s') +
             '</td></tr>';
      });
      h += '</table>';
    });

    h += '<h4>Was sonst noch im Feld ist</h4><table>' +
      zeile('Der Ball', 'die Aufgabe selbst',
            'liegt bei dem, der sie hat; jede Übergabe wirft ein Stück ab. ' +
            'Die Größe ist die Zeit, die daran gearbeitet wird.') +
      zeile('Arbeit', 'jemand ist beschäftigt',
            'ein atmender Ring mit Herzschlag. Beginnt, wenn ein Ballstück ' +
            'ankommt; endet, wenn ein Ergebnis oder die Aufgabe weitergeht — ' +
            'eine Rückfrage beendet sie nicht.') +
      zeile('Der Tisch', 'was geprüft wird',
            'in der Mitte, gleichmäßig drehend. Liegt dort und schreibt nichts. ' +
            'Erst die Abnahme schreibt, und zwar in die Mitte.') +
      zeile('Stopper', 'jemand wartet',
            'ein Ring, der gegen die Arbeit dreht und stockt. Er sitzt beim ' +
            'FRAGENDEN, nicht beim Gefragten.') +
      zeile('Schleuse', 'die Plattformgrenze',
            'zwei Backen quer zur Fahrt, auf halbem Weg. Nur dort, wo eine ' +
            'Nachricht von ChatGPT nach Claude geht oder umgekehrt.') +
      zeile('Einsturz', 'verworfen',
            'die Fäden fahren nach innen auf einen Punkt, kurz hell, dann ' +
            'nichts. Nicht dasselbe wie Verblassen: Verblasstes hat gegolten.') +
      zeile('Funken', 'aus einem wird mehreres',
            'verzweigt eine Nachricht, zerspringt sie beim Ankommen — für ' +
            'jede Folge ein eigener Pfeil. Die Zahl steht in den Daten.') +
      '</table>';

    h += '<h4>Wer wo läuft</h4><table>';
    AGENTEN.forEach(function (a) {
      h += '<tr><td class="gArt">' + a.name + '</td>' +
           '<td class="gWas">' + a.rolle + '</td>' +
           '<td class="gRes">' + ({mensch: 'Mensch', chatgpt: 'ChatGPT',
             claude: 'Claude Code'}[a.platt] || a.platt) + '</td>' +
           '<td class="gDau">' + ({holen: 'holt von außen',
             erfinden: 'erzeugt aus nichts'}[a.weise] || '') + '</td></tr>';
    });
    h += '</table>';

    h += '<h4>Was die Darstellung raten musste</h4>' +
         '<p class="gFuss" id="agRaten"></p>';

    /* Die Betriebsarten. Dies hier ist ein PROTOTYP: Er spielt ein
       abgeschlossenes Stück und beginnt danach von vorn. Im Produktivbetrieb
       gäbe es kein Ende und nichts, wohin zurück — und das ändert mehr als
       die Knöpfe. Die ausführliche Fassung steht in
       previews/AG-VISUAL-005-funktionsmatrix-v1.md. */
    h += '<h4>Betriebsarten</h4>' +
         '<p class="gSatz">Was hier läuft, ist ein <b>Prototyp</b>: ein ' +
         'abgeschlossenes Stück mit bekanntem Ende, das danach von vorn ' +
         'beginnt. Im <b>Produktivbetrieb</b> gibt es beides nicht.</p>' +
         '<table>' +
         zeile('Von vorn', 'fällt weg — es gäbe nichts, wohin zurück', '') +
         zeile('Halt', 'hält die ANSICHT an, nicht das Projekt. Ereignisse ' +
               'laufen weiter auf und holen beim Fortsetzen nach', '') +
         zeile('Uhr', 'läuft ohne Deckel; heute endet sie bei der Dauer ' +
               'des Stücks', '') +
         zeile('Ausklang', 'bei Leerlauf statt am Ende der Liste, und ohne ' +
               'Neubeginn', '') +
         zeile('Flugdauer', 'muss aus Entfernung und Tempo kommen. Heute ' +
               'sieht sie dem nächsten Zug des Empfängers VORAUS — das ' +
               'ist live nicht möglich', '') +
         zeile('Umfang', 'ändert sich im Lauf; der Balken braucht dann ' +
               'einen wandernden Nenner', '') +
         '</table>';

    h += '<p class="gFuss">Die Nachrichtenarten oben sind aus der ' +
         'Mappingtabelle erzeugt, aus der auch das Verhalten kommt — sie ' +
         'können nicht veralten. Alles darunter ist von Hand geschrieben.</p>';

    function zeile(a, b, c) {
      return '<tr><td class="gArt">' + a + '</td><td class="gWas">' + b +
             '</td><td class="gRes" colspan="2">' + c + '</td></tr>';
    }
    legende.innerHTML = h;
  })();

  /* Die Namen am Ring — ruhig, und sie verschwinden nicht. */
  function ringZeichnen() {
    /* DIE BESCHRIFTUNG HAENGT AM RING, NICHT AN EINER FESTEN ZAHL.

     Gemessen mit einer Pruefung, die mir bis heute fehlte -- ob sich
     Beschriftungen GEGENSEITIG decken: Auf dem iPad hochkant taten sie es
     in 10 von 14 Stichproben, auf dem iPhone in 6 von 14, im Querformat
     nie. Immer traf es die langen ROLLENWOERTER ("Spezifikation",
     "Qualitaet"), nie die Namen -- hochkant ist der Ring kleiner, die
     Woerter bleiben gleich lang. Die Woerter sind Peters Texte und
     bleiben, also haengt jetzt die Schriftgroesse am Radius. */
    var gr = Math.max(9, Math.min(14, ringR() / 13));
    document.documentElement.style.setProperty('--agNameGr', gr.toFixed(2) + 'px');
    ring.innerHTML = '';
    AGENTEN.forEach(function (a, i) {
      var p = heimat(a), e = document.createElement('div');
      e.className = 'agName' + (a.nah && a.nah > 1.05 ? ' agDraussen' : '');
      e.style.left = p[0] + 'px'; e.style.top = p[1] + 'px';
      e.style.color = hex(a.farbe);
      e.textContent = a.name;
      e.__rolle = 0;
      /* Das Schild ins Band klemmen. Peter steht mit 1,28 Radien genau auf
         der linken Kante; sein Schild ist um seinen Platz ZENTRIERT und
         ragte deshalb zur Hälfte in die Liste. Gemessen auf drei
         Schirmgrößen, auf allen dreien derselbe Treffer.
         Geklemmt wird das Schild, nicht der Kreis: Ein kleinerer Kreis
         kostete auf jedem Gerät Platz, damit ein einziges Wort passt. Die
         Fäden kommen weiterhin von seinem wirklichen Platz. */
      e.__klemm = 1;
      e.style.pointerEvents = 'auto';
      (function (A, el) {
        var ort = function () { return heimat(A); };
        el.addEventListener('mouseenter', function () { steckbrief(A, ort()); });
        el.addEventListener('mouseleave', steckWeg);
        el.addEventListener('click', function (ev) {
          ev.stopPropagation();
          if (steckEl.classList.contains('auf') && steckEl.__wer === A.name) steckWeg();
          else { steckEl.__wer = A.name; steckbrief(A, ort()); }
        });
      })(a, e);
      /* Jeder Name atmet, und der Wechsel Name <-> Rolle fällt in die
         DUNKELSTE Stelle dieses Atems. Dadurch ist der Umschlag nicht zu
         sehen — man sieht nur, dass das Schild aufatmet und beim Hellwerden
         etwas anderes dasteht. Dafür muss der Puls je Agent so versetzt
         sein, dass sein Tal auf seinen eigenen Umschlagzeitpunkt fällt.
         Umschlag bei (Uhr + i·1,6) mod 16 = 12 bzw. 0; Pulsdauer 4 s, also
         teilt 4 beide Zeitpunkte. */
      e.style.animationDelay = (-((((12 - i * 1.6) % 4) + 4) % 4)).toFixed(2) + 's';
      ring.appendChild(e);
      /* Nachmessen und hereinholen, erst wenn das Schild im Dokument steht
         — vorher hat es keine Breite. */
      var k = e.getBoundingClientRect(), halb = k.width / 2;
      if (k.left < bandL() + 4)
        e.style.left = (bandL() + halb + 4) + 'px';
      else if (k.right > bandR() - 4)
        e.style.left = (bandR() - halb - 4) + 'px';
    });
  }

  /* Der Name allein sagt niemandem, wer das ist. Also wechselt er sich mit
     der Rolle ab — versetzt, damit nicht neun Schilder gleichzeitig
     umspringen; das sähe nach Maschine aus statt nach Atmen.

     Der Wechsel geht nicht über ein Ausblenden, sondern durch das Feld: Die
     Schrift läuft auseinander und wieder zusammen (Sperrung von 0,2 auf
     0,8 em), und im Augenblick des Umschlags werden an diesem Platz ein
     paar Fäden in der Farbe des Agenten gelegt. So sieht es aus, als würde
     das Wort im Medium neu gegossen, statt ausgetauscht zu werden. */
  var rolleUhr = 0;
  /* Einblendbar, nicht dauernd: Welches Modell gerade an welcher Aufgabe
     sitzt, ist eine Frage, die man STELLT — und wenn sie beantwortet ist,
     soll sie das Bild nicht weiter belegen. Darum ein Schalter und keine
     ständige Beschriftung. */
  var motorAn = false, motorEl = document.getElementById('agMotoren');

  function motorenZeigen() {
    if (!motorAn) { if (motorEl.children.length) motorEl.innerHTML = ''; return; }
    motorEl.__h = null;          /* Verbrauch ändert sich laufend */
    var h = '';
    AGENTEN.forEach(function (A) {
      var S = arbeit[A.name], o = heimat(A);
      var txt = (S && !S.aus && S.liste.length) ? S.liste[0].modell
              : (MOTOR[A.platt] || '');
      if (!txt) return;
      /* Modell UND Verbrauch an einem Schalter: Es ist dieselbe Frage —
         die nach der Maschine dahinter. Zwei Schalter für eine Frage
         wären zwei Stellen, an denen man suchen muss.
         Der Verbrauch steht nur da, wenn es ihn gibt; eine Null wäre eine
         Behauptung über etwas, das noch nicht stattgefunden hat. */
      /* DIE ZAHL STEHT DAUERHAFT, und wo keine ist, steht warum.

         Peters Wunsch: „Token könnten sogar permanent unter dem LLM
         stehen. Wenn keine Kosten übermittelt werden, kann man das auch
         entsprechend mit einem Kennzeichen visualisieren."

         Vier Fälle, und sie sind nicht dasselbe:

           Zahlen da            ~USD 0.2172 · 14.8k tok
           teils übermittelt    dieselbe Zeile + „2 ohne Angabe"
           nichts übermittelt   keine Angabe
           noch nichts getan    noch kein Verbrauch

         Die beiden letzten sind der Grund für den Aufwand: „keine Angabe"
         heißt, es ist gearbeitet und nichts gemeldet worden — das darf
         nicht wie Null aussehen. Eine Gesamtsumme steht hier bewusst
         nirgends; solange eine Lücke offen ist, wäre jede Summe eine
         Behauptung. Beides steht so im Regelwerk des Teams
         (AG-COST-UI-001). */
      var V = verbrauch[A.name], zus = '';
      if (A.platt === 'mensch') {
        zus = '';
      } else if (V && V.n) {
        zus = '<em>' + (V.quelle === 'geschaetzt' ? '~' : '') +
              'USD ' + V.kosten.toFixed(4) +
              (V.aus ? ' · ' + (V.aus > 999 ? (V.aus / 1000).toFixed(1) + 'k'
                                            : V.aus) + ' tok' : '') +
              '</em>' +
              /* Die Zeit auf eine EIGENE Zeile. Zusammen in einer Zeile war
                 die Angabe so breit, dass sich die Schilder benachbarter
                 Agenten überlappten — im Bild nachgesehen, bei einem Radius
                 von 261 Pixeln liegen die Plätze rund 200 auseinander, die
                 Zeile war 330 breit. */
              '<em>' + (V.fertig ? mmss(V.zeit) + ' in ' + V.fertig +
                          (V.fertig === 1 ? ' Auftrag' : ' Aufträgen') : '') +
              (V.ohne ? ' · ' + V.ohne + ' ohne Kostenangabe' : '') + '</em>';
      } else if (V && V.ohne) {
        /* Gearbeitet, aber nichts übermittelt. Die ZEIT gibt es trotzdem —
           sie hängt an Zeitstempeln, nicht an einer Meldung. */
        zus = '<em class="luecke">keine Kostenangabe' +
              (V.fertig ? ' · ' + mmss(V.zeit) + ' in ' + V.fertig +
                          (V.fertig === 1 ? ' Auftrag' : ' Aufträgen') : '') +
              '</em>';
      } else {
        zus = '<em class="leer">noch kein Verbrauch</em>';
      }
      h += '<div class="agMot' + ((S && !S.aus) ? ' tut' : '') +
           '" style="left:' + o[0] + 'px;top:' + (o[1] + 18) + 'px;color:' +
           hex(A.farbe) + '">' + txt + zus + '</div>';
    });
    /* DER STATUS DER KOSTENBASIS, und er verschwindet nicht.

       K07 aus AG-MOCK-COMPARE-001 verlangt, eine unvollständige Basis nicht
       wie eine vollständige aussehen zu lassen. Peter verlangt, sie
       trotzdem zu zeigen: „Wir dürfen nur die Anzeige nicht verschwinden
       lassen, sonst denkt man eher an einen Fehler."

       Also bleibt sie und sagt, was sie ist — wörtlich die Formulierung aus
       AG-COST-UI-001, mit der Zahl dazu. Gezählt wird aus den Daten des
       laufenden Stücks, nicht geschätzt. */
    var belegt = 0, gesamt = 0, laufen = 0;
    for (var vn in verbrauch) {
      belegt += verbrauch[vn].n || 0;
      gesamt += (verbrauch[vn].n || 0) + (verbrauch[vn].ohne || 0);
    }
    /* Laufende Aufträge haben noch NICHTS gemeldet. Sie zählen deshalb
       gegen die Vollständigkeit, nicht erst, wenn sie ohne Angabe enden.
       Im ersten Versuch stand mitten im Stück „Kosten vollständig erfasst",
       während vier Agenten noch arbeiteten — also genau die Zusicherung,
       gegen die K07 geschrieben ist, nur eine Stunde zu früh. */
    for (var an in arbeit)
      if (!arbeit[an].aus) laufen += arbeit[an].liste.length;

    var ganz = gesamt > 0 && belegt === gesamt && laufen === 0;
    h += '<div class="agBasis' + (ganz ? '' : ' luecke') + '">' +
         (gesamt === 0 && !laufen ? 'noch keine erledigten Aufträge'
          : ganz ? 'Kosten vollständig erfasst · ' + belegt + ' Aufträge'
          : 'Kosten noch nicht vollständig erfasst · ' + belegt + ' von ' +
            gesamt + ' erledigt belegt' +
            (laufen ? ' · ' + laufen + ' noch offen' : '')) +
         '</div>';

    if (motorEl.__h !== h) { motorEl.__h = h; motorEl.innerHTML = h; }
  }

  /* Die Eigenschaften eines Agenten — beim Daraufzeigen, beim Antippen auf
     dem iPad. Alles darin kommt aus euren Dateien: Kennung, Bereich und
     Verbote aus relay/role-routing.json, der Auftragssatz aus dem
     Team-Brief. Wo dort nichts steht, steht hier nichts: Eine leere Angabe
     ist ehrlicher als eine ausgedachte. */
  var steckEl = document.getElementById('agSteck');

  function steckbrief(A, p0) {
    var MOT = { mensch: 'Mensch', chatgpt: 'ChatGPT', claude: 'Claude Code' };
    var h = '<b style="color:' + hex(A.farbe) + '">' + A.name + '</b>' +
            '<i>' + A.rolle + '</i>';
    if (A.kennung) h += '<code>' + A.kennung + '</code>';
    h += '<p>' + A.auftrag + '</p><dl>';
    h += '<dt>läuft auf</dt><dd>' + (MOT[A.platt] || A.platt) + '</dd>';
    if (A.bereich && A.bereich.length)
      h += '<dt>Bereich</dt><dd>' + A.bereich.join(' · ') + '</dd>';
    if (A.verbote && A.verbote.length)
      h += '<dt class="nein">verboten</dt><dd class="nein">' +
           A.verbote.join(' · ') + '</dd>';
    var V = verbrauch[A.name];
    if (V && V.n) {
      h += '<dt>verbraucht</dt><dd>' + V.n + ' Aufträge · ' +
           (V.aus > 999 ? (V.aus / 1000).toFixed(1) + 'k' : V.aus) +
           ' Token · USD ' + V.kosten.toFixed(4) + '</dd>';
      /* Die Herkunft der Zahl steht dabei. Erfundenes muss sich als
         erfunden zu erkennen geben — sonst steht es morgen neben Belegtem
         in derselben Spalte, und niemand weiß mehr, welches welches ist. */
      if (V.quelle === 'geschaetzt')
        h += '<dt class="schaetz">Herkunft</dt><dd class="schaetz">' +
             'geschätzt — kein belegter Providerwert</dd>';
    }
    h += '</dl>';
    steckEl.innerHTML = h;
    /* Zur Bildmitte hin öffnen, damit das Blatt nie über den Rand läuft. */
    var links = p0[0] > W() / 2;
    steckEl.style.left = (links ? (p0[0] - 18) : (p0[0] + 18)) + 'px';
    steckEl.style.top = p0[1] + 'px';
    steckEl.style.transform = 'translate(' + (links ? '-100%' : '0') + ',-50%)';
    steckEl.classList.add('auf');
  }
  function steckWeg() { steckEl.classList.remove('auf'); }

  function rollenWechseln(dt) {
    rolleUhr += dt;
    if (!ring.children.length) return;
    for (var i = 0; i < AGENTEN.length; i++) {
      var e = ring.children[i], A = AGENTEN[i];
      if (!e) continue;
      /* 12 Sekunden Name, 4 Sekunden Rolle, je Agent um 1,6 s versetzt —
         versetzt, damit nicht neun Schilder gleichzeitig umspringen. */
      var ph = (rolleUhr + i * 1.6) % 16;
      var soll = (ph > 12) ? 1 : 0;
      if (e.__rolle === soll) continue;
      e.__rolle = soll;
      e.textContent = soll ? A.rolle : A.name;
      /* Die Rolle ist das laengere Wort und bekommt deshalb eine Stufe
         weniger. Nicht der Name wird kleiner -- der ist kurz. */
      e.classList.toggle('rolleDa', !!soll);
      /* Neu klemmen: „AUFTRAGGEBER" ist deutlich breiter als „PETER", also
         passt eine Lage, die für das eine Wort stimmt, für das andere
         nicht. Beim ersten Versuch wurde nur einmal beim Aufbau geklemmt —
         und das Schild rutschte beim Umschlag wieder in die Liste. */
      e.style.left = heimat(A)[0] + 'px';
      var kk = e.getBoundingClientRect(), hb = kk.width / 2;
      if (kk.left < bandL() + 4) e.style.left = (bandL() + hb + 4) + 'px';
      else if (kk.right > bandR() - 4) e.style.left = (bandR() - hb - 4) + 'px';
      e.classList.remove('agGuss');
      void e.offsetWidth;                    /* Animation neu anstoßen */
      e.classList.add('agGuss');
      var q = heimat(A), r = Math.min(W(), H()) * 0.022;
      for (var c = 0; c < 7; c++) {
        var w = Math.random() * 6.2832, d2 = r * Math.sqrt(Math.random());
        window.__feld.strang(q[0] + Math.cos(w) * d2, q[1] + Math.sin(w) * d2,
          Math.cos(w) * 26, Math.sin(w) * 26,
          0.16, 0.6 + 0.4 * Math.random(), A.farbe, 0);
      }
    }
  }
  window.__agRing = ringZeichnen;
  setTimeout(ringZeichnen, 60);
  /* Beim Drehen aendert sich die Aufteilung, nicht nur die Groesse: Aus
     einem Telefon hoch wird ein Telefon quer. Also auch die Knoepfe und
     das Groessenmerkmal am Koerper neu setzen -- vorher wurde nur der Ring
     neu gezeichnet, und `data-gross` blieb auf dem Stand vom Start. */
  window.addEventListener('resize', function () {
    setTimeout(function () { ringZeichnen(); knoepfeSetzen(); }, 120);
  });

  document.getElementById('agHalt').addEventListener('click', function () {
    laeuft = !laeuft;
    knoepfeSetzen();     /* die Aufschrift haengt am Modus, nicht am Knopf */
  });
  function zurueckAufAnfang() {
    zeit = 0; naechstes = 0; ausklang = 0; baelle.length = 0;
    visionen = 0;
    for (var n1 in arbeit) delete arbeit[n1];
    for (var n2 in stopper) delete stopper[n2];
    for (var n3 in erwartung) { weiterSagen(n3, 0); delete erwartung[n3]; }
    tisch.length = 0; derBall = null;
    bausteine.length = 0; produkt = 0; ratNull();
    register.length = 0; aufgabenAuf = 0; aufgabenZu = 0;
    werkEl.innerHTML = ''; rufeEl.innerHTML = '';
    laeuftEl.innerHTML = ''; strom.length = 0;
    for (var vk in verbrauch) delete verbrauch[vk];
    document.getElementById('agKostenEbene').innerHTML = '';
    tunEl.innerHTML = ''; tunEl.__h = null; tunStill = 0;
    stoppSchildEl.innerHTML = ''; stoppSchildEl.__h = null; stoppWeg();
    if (window.__abklingen) window.__abklingen(0);
    if (window.__wachHalten) window.__wachHalten(0, 0);
    if (window.__flaecheLeeren) window.__flaecheLeeren();
  }

  if (STUECK.modus && MODI[STUECK.modus]) MODUS = STUECK.modus;
  laeuft = !!modus().start;
  kopfSetzen();
  knoepfeSetzen();
  aktivitaetModus();

  /* Der Hinweis „Du darfst mitrühren" stammt aus Resonanz, wo er den
     ganzen Zweck benennt. Hier ist das Mitrühren eine Zugabe, nicht die
     Sache — und er steht genau dort, wo Peters Beschriftungen hinlaufen.
     Also geht er nach zwölf Sekunden von selbst. */
  setTimeout(function () {
    var h = document.getElementById('hinweis');
    if (h) h.style.opacity = '0';
  }, 12000);

  /* „Was geschieht" ist ein Knopf wie die anderen: Er schaltet die Liste
     ab und wieder an. Angeschaltet ist der Grundzustand — wer das Feld
     nackt sehen will, schaltet sie weg. */
  (function () {
    var k = document.getElementById('agListe'),
        ecke = document.getElementById('agEcke'), an = true;
    k.addEventListener('click', function () {
      tastenZeigen();
      an = !an;
      k.classList.toggle('an', an);
      ecke.classList.toggle('leise', !an);
    });
  })();

  /* Berühren hellt auf, wie Zeigen — nur hört es von selbst wieder auf.
     Ohne das wäre die Regel am iPad, wo es kein Zeigen gibt, wirkungslos. */
  (function () {
    ['agKopf', 'agWerkName'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', function (ev) {
        ev.stopPropagation();
        el.classList.add('lesen');
        clearTimeout(el.__ab);
        el.__ab = setTimeout(function () { el.classList.remove('lesen'); }, 6000);
      });
    });
  })();

  document.getElementById('agVorn').addEventListener('click', function () {
    zurueckAufAnfang();
  });
  /* Die Knöpfe verschwinden nach drei Sekunden Ruhe und kommen bei jeder
     Bewegung zurück. Auf einem iPad gibt es kein Darüberfahren, also zählt
     dort die Berührung — das erste Antippen holt sie, das zweite bedient
     sie. Solange eine Tafel offen ist, bleiben sie da; sonst könnte man
     sie nicht mehr schließen. */
  var tasten = document.getElementById('agTasten'), tastenUhr = null;

  function tastenZeigen() {
    tasten.classList.remove('leise');
    if (tastenUhr) clearTimeout(tastenUhr);
    tastenUhr = setTimeout(function () {
      if (legende.classList.contains('auf')) return;   /* Tafel offen */
      if (document.getElementById('agWas').classList.contains('auf')) return;
      tasten.classList.add('leise');
    }, 3000);
  }
  window.addEventListener('pointerdown', function () { steckWeg(); });
  ['pointermove', 'pointerdown', 'wheel', 'keydown'].forEach(function (n) {
    window.addEventListener(n, tastenZeigen, { passive: true });
  });
  tastenZeigen();

  document.getElementById('agMotor').addEventListener('click', function () {
    tastenZeigen();
    motorAn = !motorAn;
    this.classList.toggle('an', motorAn);
    motorEl.__h = null;
    motorenZeigen();
  });
  /* Beim Öffnen frisch gerechnet: Wie oft hat eine Faustregel gegriffen,
     obwohl mehr als eine Möglichkeit offen stand? Steht da null, tragen die
     Daten ihre Bezüge selbst — dann ist nichts erfunden. */
  function ratenZeigen() {
    var e = document.getElementById('agRaten');
    if (!e) return;
    if (!geraten.gesamt) {
      e.innerHTML = 'Bisher <b>kein einziges Mal</b>. Die Daten tragen ihre ' +
        'Bezüge selbst — welche Aufgabe endet, welches Ergebnis geprüft wird ' +
        'und worauf sich ein Widerspruch bezieht, steht darin.';
      return;
    }
    var t = [];
    if (geraten.auftrag) t.push(geraten.auftrag + '&times; welcher Auftrag endet');
    if (geraten.abnahme) t.push(geraten.abnahme + '&times; welches Ergebnis abgenommen wird');
    if (geraten.gegen) t.push(geraten.gegen + '&times; worauf sich ein Widerspruch bezieht');
    if (geraten.antwort) t.push(geraten.antwort + '&times; welche Frage beantwortet wird');
    e.innerHTML = '<b>' + geraten.gesamt + '&times;</b> seit Beginn des Stücks: ' +
      t.join(' · ') + '. Gezählt wird nur, wenn überhaupt mehr als eine ' +
      'Möglichkeit offen stand. Mit durchgängigen Aufgaben- und ' +
      'Artefakt-Bezügen in den Daten (<i>aufgabe</i>, <i>erledigt</i>, ' +
      '<i>artefakt</i>, <i>version</i>, <i>prueft</i>, <i>antwortet_auf</i>) ' +
      'fiele diese Zahl auf null.';
  }

  document.getElementById('agLeg').addEventListener('click', function () {
    tastenZeigen();
    var auf = legende.classList.toggle('auf');
    if (auf) ratenZeigen();
    this.textContent = auf ? 'Zu' : 'Gesetz';
  });
})();
</script>"""

def bauen(quelle, ziel, stueck):
    s = io.open(quelle, encoding='utf-8').read()
    agenten = [dict(name=a[0], farbe=a[1], winkel=a[2], nah=a[3], rolle=a[4],
                    platt=a[5], weise=(a[6] or 'kreisen'),
                    kennung=a[7], bereich=a[8], verbote=a[9], auftrag=a[10])
               for a in AGENTEN]
    if isinstance(stueck, dict):
        stueck = [stueck]
    # Der Bauzeitpunkt kommt aus der Uhr, nicht aus einer gepflegten Zeile.
    # Von Hand gepflegte Datumsangaben sind nach der zweiten Aenderung falsch.
    # EIN TAGESDATUM IST KEIN ZEITSTEMPEL.
    # Peter, zuerst zu den Dokumenten, dann hier: an einem Tag entstehen
    # mehrere Fassungen, und dann sagt das Datum nicht, welche man vor sich
    # hat. ISO 8601 mit Uhrzeit und Zone, wie im Fassungsregister.
    gebaut = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ')
    sk = (SKRIPT.replace('__AGENTEN__', json.dumps(agenten))
                .replace('__ARTEN__', json.dumps(ARTEN))
                .replace('__GEBAUT__', gebaut)
                .replace('__STUECKE__', json.dumps(stueck, ensure_ascii=False)))
    # Der lokale Aktivitaets-Eingang bleibt eine eigene Datei und wird beim
    # Bauen eingebettet, damit das gebaute Feld in sich geschlossen ist.
    akt = io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               'activity-input.js'), encoding='utf-8').read()
    if not akt.strip():
        raise ValueError('activity-input.js ist leer')
    akt = '<script>\n' + akt.replace('</script', '<\\/script') + '\n</script>\n'
    s = s.replace('</body>', akt + sk + '\n</body>')
    io.open(ziel, 'w', encoding='utf-8').write(s)
    return len(s)
