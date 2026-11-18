// Module rechte - accounts v2 and the rules who sees which child (S11 Stufe 1, P1/P3/P4).
// Pure functions: no screen, no storage, the day is passed in. Tested in Node (tests/module/rechte.test.mjs).
// The app keeps storage, log and display (index.html: grantsExpire, myGrantFor, viewerGrant, myKids).

/* Accounts v2 (S11 Stufe 1, 02.11.): every person has a fixed random ID ("p_..."); parent-child is
   linked by ID only (guardians). The rest of the app still works with login names and the older
   fields role/kinder - derived here once. Admin accounts are not parents (finding B3). */
export function normAccounts(raw){
  if(!raw || !raw.users || raw.version!==2) return raw;
  const byId=new Map(raw.users.map(u=>[u.id,u])), name=id=>byId.get(id)&&byId.get(id).user;
  const users=raw.users.map(u=>Object.assign({},u,{
    role:u.kind==='child'?'student':(u.teacher?'teacher':'parent'), admin:!!u.admin,
    kinder:(u.teacher?[]:(raw.guardians||[]).filter(g=>g.adult===u.id).map(g=>g.child)).map(name).filter(Boolean)
  }));
  return {version:2, users, guardians:raw.guardians||[]};
}

/* A grant is active from its first to its last day (YYYY-MM-DD, inclusive) unless it was ended. */
export const isGrantActive = (g, today) => !g.revokedAt && today >= g.from && today <= g.until;

/* the active grant of one person for a child (grants of that child), else null */
export function activeGrantFor(grants, personId, today) {
  return (grants || []).find((g) => g.grantee === personId && isGrantActive(g, today)) || null;
}

/* marks grants that ran out (once) and returns them, so the app can log each one exactly once */
export function expireGrants(grants, today) {
  const neu = [];
  for (const g of grants || []) if (!g.revokedAt && !g.expiredLogged && today > g.until) { g.expiredLogged = true; neu.push(g); }
  return neu;
}

/* parents see their own children without a grant; teachers never count as parents */
export const isParentOf = (me, kid) => !!me && !!kid && me.role === 'parent' && (me.kinder || []).includes(kid.user);

/* the children a grown-up may see: own children; the test child only for the admin; others only with an
   active grant (grantFor(kid) -> grant or null). Teachers and the admin need a grant for every real child. */
export function visibleKids(users, me, { admin = false, grantFor = () => null } = {}) {
  return (users || []).filter((u) => u.role === 'student' && (u.test ? !!admin : (isParentOf(me, u) || !!grantFor(u))));
}
