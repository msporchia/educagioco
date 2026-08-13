/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA — dove si può andare, e chi vede chi

   La geometria del campo, e nient'altro: qui non ci sono ordini, non
   c'è un registro, non c'è chi ha vinto. Ci sono i muri, le porte
   chiuse, la BFS che fa camminare tutti e la regola con cui si decide
   se due si vedono.

   ── VEDERE È CAMMINARE ──────────────────────────────────────────
   La vista si misura a **distanza di cammino**, non in linea d'aria: un
   muro in mezzo toglie la vista senza bisogno di tracciare nessun
   raggio, e una porta chiusa acceca tutti e due i lati perché di lì non
   ci si cammina. È il trucco che fa stare in piedi mezzo gioco con
   venti righe di codice, ed è anche la ragione per cui il **suono** —
   che i muri non li sente — non può misurarsi con questa funzione.
   ═══════════════════════════════════════════════════════════════════ */

/* serve solo a raccontare dove va: «va verso nord» in una riga di
   registro */
export const VERSO = ['nord', 'est', 'sud', 'ovest']
const PASSI = [[0, -1], [1, 0], [0, 1], [-1, 0]]

export const dentro = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h

export function libera (m, x, y) {
  if (!dentro(m, x, y)) return false
  const c = m.celle[y][x]
  if (c.muro) return false
  if (c.porta && !m.porte[c.porta].aperta) return false
  return true
}
/* Le unità NON si bloccano fra loro: due sulla stessa cella sono
   ammesse (il disegno le sfalsa). Bloccarsi genererebbe stalli finti
   che non hanno niente da insegnare. */

/* BFS: la mappa delle distanze da una cella. È il «sa già camminare». */
export function distanze (m, x0, y0) {
  const d = new Int16Array(m.w * m.h).fill(-1)
  d[y0 * m.w + x0] = 0
  const coda = [[x0, y0]]
  let testa = 0
  while (testa < coda.length) {
    const [x, y] = coda[testa++], q = d[y * m.w + x]
    for (const [dx, dy] of PASSI) {
      const nx = x + dx, ny = y + dy
      if (!libera(m, nx, ny)) continue
      if (d[ny * m.w + nx] !== -1) continue
      d[ny * m.w + nx] = q + 1
      coda.push([nx, ny])
    }
  }
  return d
}

/* la mappa delle distanze VISTA DA un'unità, tenuta in cache finché
   non si muove lei e non si muove una porta */
export function mappaDi (m, u) {
  const k = u.x + ',' + u.y + ',' + m.versioneMappa
  if (u._mk !== k) { u._mk = k; u._md = distanze(m, u.x, u.y) }
  return u._md
}

/* un passo verso (bx,by): si va a ritroso sulla mappa di distanze del
   bersaglio */
export function passoVerso (m, u, bx, by) {
  const d = distanze(m, bx, by)
  const qui = d[u.y * m.w + u.x]
  if (qui <= 0) return null
  for (const [dx, dy] of PASSI) {
    const nx = u.x + dx, ny = u.y + dy
    if (libera(m, nx, ny) && d[ny * m.w + nx] === qui - 1) return [nx, ny]
  }
  return null
}

/* «vedere» è a distanza di cammino: un muro in mezzo toglie la vista
   senza bisogno di tracciare raggi */
export function vede (m, io, altro) {
  if (!io) return false
  const d = mappaDi(m, io)[altro.y * m.w + altro.x]
  return d >= 0 && d <= (io.vista || 0)
}

export const aPortata = (u, t) => !!t && Math.abs(u.x - t.x) + Math.abs(u.y - t.y) <= 1

/* Una porta CHIUSA non si attraversa, quindi la mappa delle distanze non
   ci arriva sopra: la si vede se si vede una casella che le sta
   accanto. Senza questo, chi è appoggiato al portone «non lo vede». */
export function vedePorta (m, io, p) {
  const d = mappaDi(m, io), v = io.vista || 0
  return [[p.x, p.y], [p.x + 1, p.y], [p.x - 1, p.y], [p.x, p.y + 1], [p.x, p.y - 1]]
    .some(([x, y]) => dentro(m, x, y) && d[y * m.w + x] >= 0 && d[y * m.w + x] <= v)
}

/* muove di una cella verso (bx,by), e risponde com'è andata:
   'arrivato' | 'passo' | null (la strada è chiusa) */
export function verso (m, u, bx, by) {
  if (u.x === bx && u.y === by) return 'arrivato'
  const p = passoVerso(m, u, bx, by)
  if (!p) return null
  u.dir = p[0] > u.x ? 1 : p[0] < u.x ? 3 : p[1] > u.y ? 2 : 0
  u.x = p[0]; u.y = p[1]; u._mk = null
  m.eventi.push('passo')
  return u.x === bx && u.y === by ? 'arrivato' : 'passo'
}
