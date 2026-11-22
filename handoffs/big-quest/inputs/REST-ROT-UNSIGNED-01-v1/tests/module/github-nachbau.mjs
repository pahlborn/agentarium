// Nachgebauter GitHub-Server fuer die Tests des Moduls github (Stufe 3a, Teil 1). Kein Netz: nur 127.0.0.1.
// Bildet genau den benutzten Teil der GitHub-REST-API nach (Stand der Doku "2022-11-28"):
//   GET    /repos/{o}/{r}/contents/{pfad}?ref=main   Datei (base64, sha) oder Ordner (Liste mit sha); 404; ETag + 304
//   PUT    /repos/{o}/{r}/contents/{pfad}            anlegen (ohne sha; vorhanden -> 422) oder ersetzen (sha passt, sonst 409)
//   DELETE /repos/{o}/{r}/contents/{pfad}            mit sha; fehlt -> 404; sha passt nicht -> 409
//   GET    /repos/{o}/{r}/git/trees/{sha}?recursive=1  Baum eines Ordners (jeder Baum bleibt unter seiner sha abrufbar)
// Jede Anfrage braucht "Authorization: Bearer <token>", sonst 401.
//
//   const n = await githubNachbau({ token, repos: ['o/r'] });  n.basis, n.zaehler, n.log, n.stoerung(...), n.dateien(repo), n.schliessen()
//   stoerung({ status, header, methode, pfad, anzahl, abbruch }) - die naechsten passenden Anfragen bekommen diese Antwort
//   (ohne Wirkung) bzw. die Verbindung bricht ab (abbruch: true -> fetch wirft).

import http from 'node:http';
import crypto from 'node:crypto';

const sha1 = (t) => crypto.createHash('sha1').update(t).digest('hex');
const blobSha = (text) => sha1('blob ' + Buffer.byteLength(text) + '\0' + text);
/* wie api.github.com: Browser duerfen fragen und ETag/Limit-Angaben lesen */
const CORS = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'ETag, Retry-After, X-RateLimit-Remaining, X-RateLimit-Reset' };

export async function githubNachbau({ token, repos = ['pahlborn/bis-school-app-testdaten'], zweig = 'main' } = {}) {
  const daten = new Map(repos.map((r) => [r, new Map()]));      // repo -> Map(pfad -> text)
  const baeume = new Map();                                        // sha -> [{ path, type, sha }] (rekursiv, relativ)
  const zaehler = { anfragen: 0, unveraendert: 0, je: {}, baum: 0, ordner: 0 };
  const log = [];
  const stoerungen = [];

  /* Baum eines Ordners: sha ueber die sortierten Eintraege, rekursiv; merkt sich jeden Baum */
  function baum(dateien, ordner) {
    const vor = ordner ? ordner + '/' : '';
    const kinder = new Map();
    for (const [p, text] of dateien) {
      if (!p.startsWith(vor)) continue;
      const rest = p.slice(vor.length), i = rest.indexOf('/');
      if (i < 0) kinder.set(rest, { type: 'blob', sha: blobSha(text) });
      else if (!kinder.has(rest.slice(0, i))) kinder.set(rest.slice(0, i), { type: 'tree' });
    }
    if (!kinder.size) return null;
    const liste = [];
    for (const name of [...kinder.keys()].sort()) {
      const k = kinder.get(name);
      if (k.type === 'tree') {
        const unter = baum(dateien, vor + name);
        liste.push({ path: name, type: 'tree', sha: unter.sha });
        for (const e of unter.eintraege) liste.push({ ...e, path: name + '/' + e.path });
      } else liste.push({ path: name, type: 'blob', sha: k.sha });
    }
    const sha = sha1('tree ' + liste.filter((e) => !e.path.includes('/')).map((e) => e.type + ' ' + e.path + ' ' + e.sha).join('\n'));
    baeume.set(sha, liste);
    return { sha, eintraege: liste };
  }

  function antwort(res, status, body, header = {}) {
    const text = body === undefined ? '' : JSON.stringify(body);
    res.writeHead(status, { 'content-type': 'application/json', ...CORS, ...header });
    res.end(text);
  }
  function mitEtag(req, res, body) {
    const etag = 'W/"' + sha1(JSON.stringify(body)) + '"';
    if (req.headers['if-none-match'] === etag) { zaehler.unveraendert++; res.writeHead(304, { ...CORS, etag }); res.end(); return; }
    antwort(res, 200, body, { etag });
  }

  const server = http.createServer((req, res) => {
    let roh = '';
    req.on('data', (c) => { roh += c; });
    req.on('end', () => {
      if (req.method === 'OPTIONS') {   // Vorabfrage des Browsers, zaehlt nicht
        res.writeHead(204, { ...CORS, 'access-control-allow-methods': 'GET, PUT, DELETE', 'access-control-allow-headers': 'Authorization, Content-Type, If-None-Match, X-GitHub-Api-Version', 'access-control-max-age': '600' });
        res.end();
        return;
      }
      zaehler.anfragen++;
      zaehler.je[req.method] = (zaehler.je[req.method] || 0) + 1;
      const url = new URL(req.url, 'http://x');
      log.push({ methode: req.method, url: req.url, header: { ...req.headers }, body: roh });
      const s = stoerungen.find((x) => x.anzahl > 0 && (!x.methode || x.methode === req.method) && (!x.pfad || decodeURIComponent(url.pathname).includes(x.pfad)));
      if (s) {
        s.anzahl--;
        if (s.abbruch) { req.socket.destroy(); return; }
        return antwort(res, s.status, { message: 'gestoert' }, s.header || {});
      }
      if (req.headers.authorization !== 'Bearer ' + token) return antwort(res, 401, { message: 'Bad credentials' });
      const m = /^\/repos\/([^/]+\/[^/]+)\/(contents|git\/trees)\/?(.*)$/.exec(url.pathname);
      if (!m || !daten.has(m[1])) return antwort(res, 404, { message: 'Not Found' });
      const dateien = daten.get(m[1]);
      const p = m[3].split('/').map(decodeURIComponent).join('/');
      if (p.split('/').some((t) => t === '..' || t === '.')) return antwort(res, 400, { message: 'bad path' });

      if (m[2] === 'git/trees') {
        if (req.method !== 'GET') return antwort(res, 404, { message: 'Not Found' });
        zaehler.baum++;
        const t = baeume.get(p);
        if (!t) return antwort(res, 404, { message: 'Not Found' });
        const liste = url.searchParams.get('recursive') ? t : t.filter((e) => !e.path.includes('/'));
        return mitEtag(req, res, { sha: p, tree: liste.map((e) => ({ ...e, mode: e.type === 'tree' ? '040000' : '100644' })), truncated: false });
      }

      if (req.method === 'GET') {
        if ((url.searchParams.get('ref') || zweig) !== zweig) return antwort(res, 404, { message: 'No commit found for the ref' });
        if (dateien.has(p)) {
          const text = dateien.get(p);
          return mitEtag(req, res, { type: 'file', encoding: 'base64', name: p.split('/').pop(), path: p, sha: blobSha(text), size: Buffer.byteLength(text), content: Buffer.from(text, 'utf8').toString('base64').replace(/(.{60})/g, '$1\n') });
        }
        const b = baum(dateien, p);
        if (!b) return antwort(res, 404, { message: 'Not Found' });
        zaehler.ordner++;
        const liste = b.eintraege.filter((e) => !e.path.includes('/')).map((e) => ({ type: e.type === 'tree' ? 'dir' : 'file', name: e.path, path: (p ? p + '/' : '') + e.path, sha: e.sha }));
        return mitEtag(req, res, liste);
      }

      let body;
      try { body = JSON.parse(roh); } catch { return antwort(res, 400, { message: 'Problems parsing JSON' }); }
      if ((body.branch || zweig) !== zweig) return antwort(res, 404, { message: 'Branch not found' });
      if (typeof body.message !== 'string' || !body.message) return antwort(res, 422, { message: 'message missing' });
      if (req.method === 'PUT') {
        if (typeof body.content !== 'string') return antwort(res, 422, { message: 'content missing' });
        const text = Buffer.from(body.content, 'base64').toString('utf8');
        if (dateien.has(p)) {
          if (body.sha === undefined) return antwort(res, 422, { message: 'Invalid request.\n\n"sha" wasn\'t supplied.' });
          if (body.sha !== blobSha(dateien.get(p))) return antwort(res, 409, { message: `${p} does not match ${body.sha}` });
          dateien.set(p, text);
          return antwort(res, 200, { content: { path: p, sha: blobSha(text) }, commit: { sha: sha1('c' + zaehler.anfragen) } });
        }
        if (body.sha !== undefined) return antwort(res, 422, { message: 'sha does not match' });
        dateien.set(p, text);
        return antwort(res, 201, { content: { path: p, sha: blobSha(text) }, commit: { sha: sha1('c' + zaehler.anfragen) } });
      }
      if (req.method === 'DELETE') {
        if (!dateien.has(p)) return antwort(res, 404, { message: 'Not Found' });
        if (typeof body.sha !== 'string') return antwort(res, 422, { message: '"sha" wasn\'t supplied.' });
        if (body.sha !== blobSha(dateien.get(p))) return antwort(res, 409, { message: 'sha does not match' });
        dateien.delete(p);
        return antwort(res, 200, { content: null, commit: { sha: sha1('c' + zaehler.anfragen) } });
      }
      return antwort(res, 404, { message: 'Not Found' });
    });
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return {
    basis: 'http://127.0.0.1:' + server.address().port,
    zaehler, log,
    dateien: (repo = repos[0]) => daten.get(repo),
    stoerung(s) { stoerungen.push({ anzahl: 1, ...s }); },
    stoerungenLeeren() { stoerungen.length = 0; },
    schliessen: () => new Promise((ok) => { server.closeAllConnections?.(); server.close(() => ok()); }),
  };
}
