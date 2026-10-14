# -*- coding: utf-8 -*-
"""Aus der fertigen Seite das Artefakt machen: Ein Artefakt bekommt sein
   Dokumentgerüst von der Plattform, also fliegen <!doctype>, <html>, <head>
   und <body> heraus — der Rest bleibt Zeichen für Zeichen derselbe."""
import io, re, sys

s = io.open('agentarium-fertig.html', encoding='utf-8').read()
kopf = s[s.index('<title>'):s.index('</head>')]
# viewport-fit gehört beim Artefakt als eigenes Meta dazu, nicht als
# viewport-Angabe: die setzt die Plattform selbst.
kopf = re.sub(r'<meta name="viewport"[^>]*>\n?', '', kopf)
kopf = kopf.replace('</title>',
    '</title>\n<meta name="claude:viewport-fit-sides" content="cover">', 1)
leib = s[s.index('<body>') + 6:s.index('</body>')]
io.open('agentarium-artifact.html', 'w', encoding='utf-8').write(
    kopf.rstrip() + '\n' + leib.strip() + '\n')
print('Artefakt:', len(kopf) + len(leib), 'Zeichen')
