// Dove si può mettere il piede, e come ci si arriva: vedi docs/core/passi.md.
export const PASSI = [[1, 0], [-1, 0], [0, 1], [0, -1]]   // niente diagonali: attraverserebbero un angolo di muro

const chiave = (x, y) => x + ',' + y

const TETTO = 50000   // una `buona` che dice sempre sì manderebbe la ricerca a esplorare l'infinito

export function raggiungibili(buona, da, tetto = TETTO) {
  const visti = new Set()
  if (!buona(da.x, da.y)) return visti
  const coda = [da]
  visti.add(chiave(da.x, da.y))
  for (let i = 0; i < coda.length && visti.size < tetto; i++) {
    const q = coda[i]
    for (const [dx, dy] of PASSI) {
      const x = q.x + dx, y = q.y + dy, k = chiave(x, y)
      if (visti.has(k) || !buona(x, y)) continue
      visti.add(k)
      coda.push({ x, y })
    }
  }
  return visti
}

export const siArriva = (buona, da, a, tetto = TETTO) =>
  raggiungibili(buona, da, tetto).has(chiave(a.x, a.y))

// esclusa la partenza, inclusa l'arrivo; null se non c'è strada. arrivoLibero:
// vedi docs/core/passi.md (la meta occupata da un mostro/forziere)
export function percorso(buona, da, a, { tetto = TETTO, arrivoLibero = true } = {}) {
  if (da.x === a.x && da.y === a.y) return []
  const meta = chiave(a.x, a.y)
  const passabile = (x, y) =>
    (!arrivoLibero && x === a.x && y === a.y) || buona(x, y)
  if (!passabile(a.x, a.y)) return null

  const prima = new Map()
  const visti = new Set([chiave(da.x, da.y)])
  const coda = [da]
  for (let i = 0; i < coda.length && visti.size < tetto; i++) {
    const q = coda[i]
    for (const [dx, dy] of PASSI) {
      const x = q.x + dx, y = q.y + dy, k = chiave(x, y)
      if (visti.has(k) || !passabile(x, y)) continue
      visti.add(k)
      prima.set(k, q)
      if (k === meta) {
        const strada = []
        let p = { x, y }
        while (p) {
          strada.push({ x: p.x, y: p.y })
          p = prima.get(chiave(p.x, p.y))
        }
        strada.pop()                       // la cella di partenza non è un passo
        return strada.reverse()
      }
      coda.push({ x, y })
    }
  }
  return null
}

// la vicina più comoda per chi arriva, non la prima in ordine di lettura.
// `sopra`: vale anche stare sulla cella stessa (una scala sì, un mostro no)
export function accanto(buona, meta, da, { sopra = false } = {}) {
  const scelte = sopra ? [[0, 0], ...PASSI] : PASSI
  let meglio = null
  for (const [dx, dy] of scelte) {
    const x = meta.x + dx, y = meta.y + dy
    if (!buona(x, y)) continue
    const d = Math.abs(x - da.x) + Math.abs(y - da.y)
    if (!meglio || d < meglio.d) meglio = { x, y, d }
  }
  return meglio ? { x: meglio.x, y: meglio.y } : null
}

// prova le vicine buone dalla più comoda e torna la prima a cui una strada
// c'è DAVVERO (non solo la più vicina in linea d'aria). Quando si sale, la
// cella della meta va prima delle altre e non ordinata con loro per
// distanza, se no si perde sempre: vedi docs/core/passi.md.
export function viaVerso(buona, meta, da, { sopra = false, tetto = TETTO } = {}) {
  const scelte = PASSI
    .map(([dx, dy]) => ({ x: meta.x + dx, y: meta.y + dy }))
    .filter(p => buona(p.x, p.y))
    .sort((a, b) => (Math.abs(a.x - da.x) + Math.abs(a.y - da.y)) -
                    (Math.abs(b.x - da.x) + Math.abs(b.y - da.y)))
  if (sopra && buona(meta.x, meta.y)) scelte.unshift({ x: meta.x, y: meta.y })
  for (const p of scelte) {
    if (p.x === da.x && p.y === da.y) return { dove: p, strada: [] }
    const strada = percorso(buona, da, p, { tetto })
    if (strada) return { dove: p, strada }
  }
  return null
}

export function primaLibera(buona, da, raggio = 6) {
  if (buona(da.x, da.y)) return { x: da.x, y: da.y }
  for (let r = 1; r <= raggio; r++)
    for (let dx = -r; dx <= r; dx++)
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        const x = da.x + dx, y = da.y + dy
        if (buona(x, y)) return { x, y }
      }
  return null
}

export function passiFra(buona, da, a, tetto = TETTO) {
  const strada = percorso(buona, da, a, { tetto })
  return strada ? strada.length : Infinity
}
