/* La pesca, senza schermo: funzioni pure che leggono e scrivono una Fattoria3d (`f`) e non sanno di three. Si lancia la lenza in un pezzo
   d'acqua di un lotto tuo, da un molo (le sue celle) o dal porticciolo (le celle libere attorno), entro `PESCA.raggio` celle e nello stesso
   specchio d'acqua; il mare vuole il porticciolo. Ogni lotto d'acqua tuo è un banco: lancia → aspetta `PESCA.ms` → ritira → il banco si ripopola
   per `PESCA.riposoMs`. Tutto a tempo assoluto (`f.ora()`), quindi anche a pagina chiusa. Il perché e i numeri: docs/fattoria3d/geografia-e-pesca.md. */
import { PEZZI } from '../dati/catalogo.js'
import { PESCA, resaDellaPesca } from '../dati/pesca.js'
import { tipoAcqua } from '../dati/biomi.js'
import { chiave, lottoDi } from '../dati/mondo.js'

const QUATTRO = [[1, 0], [-1, 0], [0, 1], [0, -1]]

/** I posti da cui si lancia: ogni molo in mappa (si sta sulle sue celle) e il porticciolo (si sta sulle celle libere attorno). `ingombro`: le sue celle. */
export function postiDiPesca(f) {
  const out = []
  for (const c of f.s.cose) {
    const d = PEZZI[c.tipo]
    if (!d || !(d.molo || c.tipo === 'porticciolo')) continue
    const ingombro = []
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) ingombro.push([c.i + a, c.j + b])
    let sta = ingombro
    if (!d.molo) {
      const fuori = new Map()
      for (const [i, j] of ingombro) for (const [di, dj] of QUATTRO) { const x = i + di, y = j + dj; if (!ingombro.some(([p, q]) => p === x && q === y)) fuori.set(chiave(x, y), [x, y]) }
      sta = [...fuori.values()].filter(([x, y]) => f.libera(x, y) && !f.acqua(x, y))
    }
    out.push({ id: c.id, tipo: c.tipo, ingombro, sta })
  }
  return out
}

/** Le celle d'acqua dello stesso specchio di (i, j) entro `r` celle (a quattro direzioni): chi ci arriva con la lenza. */
function specchioVicino(f, i, j, r) {
  const visti = new Set([chiave(i, j)]), coda = [[i, j]]
  for (let k = 0; k < coda.length; k++) {
    const [x, y] = coda[k]
    for (const [di, dj] of QUATTRO) {
      const nx = x + di, ny = y + dj, kk = chiave(nx, ny)
      if (visti.has(kk) || Math.max(Math.abs(nx - i), Math.abs(ny - j)) > r || !f.acqua(nx, ny)) continue
      visti.add(kk); coda.push([nx, ny])
    }
  }
  return visti
}

/** Da dove si pesca in (i, j)? { sta: [x, y], posto } con la cella più vicina fra quelle da cui si lancia, o null (nessun molo che tocchi quell'acqua entro il raggio). */
export function raggiungi(f, i, j, posti = postiDiPesca(f)) {
  if (!posti.length) return null
  const specchio = specchioVicino(f, i, j, PESCA.raggio + 2)
  let meglio = null
  for (const p of posti) {
    const tocca = p.ingombro.some(([x, y]) => specchio.has(chiave(x, y)) || QUATTRO.some(([di, dj]) => specchio.has(chiave(x + di, y + dj))))
    if (!tocca) continue
    for (const [x, y] of p.sta) {
      const d = Math.hypot(x - i, y - j)
      if (d <= PESCA.raggio && (!meglio || d < meglio.d)) meglio = { sta: [x, y], posto: p.id, d }
    }
  }
  return meglio
}

/** Il banco di un lotto d'acqua: 'calmo' (si può lanciare), 'attesa' (la lenza è in acqua), 'abbocca' (c'è un pesce da ritirare) o 'riposo' (si ripopola). */
export function bancoDi(f, id) {
  const e = f.s.pesca[id], t = f.ora()
  if (!e) return { stato: 'calmo', restoMs: 0 }
  if (e.fine !== null) return t < e.fine ? { stato: 'attesa', restoMs: e.fine - t, i: e.i, j: e.j } : { stato: 'abbocca', restoMs: 0, i: e.i, j: e.j }
  if (e.riposo !== null && t < e.riposo) return { stato: 'riposo', restoMs: e.riposo - t }
  return { stato: 'calmo', restoMs: 0 }
}

const secondi = ms => Math.max(1, Math.ceil(ms / 1000))

/** Cosa succederebbe toccando la cella d'acqua (i, j): { ok: true, azione: 'lancia' | 'ritira' | 'aspetta' | 'riposo', sta, lotto, i, j, mare, resa, secondi }
    oppure un rifiuto { ok: false, motivo } (`non-acqua`, `acqua-non-tua`, `senza-molo`, `serve-porticciolo`, `lontano`). Niente cambia. */
export function provaPesca(f, i, j) {
  if (!f.acqua(i, j)) return { ok: false, motivo: 'non-acqua' }
  const l = lottoDi(i, j)
  if (!f.posseduto(l)) return { ok: false, motivo: 'acqua-non-tua' }
  const mare = tipoAcqua(i, j) === 'mare', porticciolo = f.s.cose.some(c => c.tipo === 'porticciolo')
  const resa = resaDellaPesca({ mare, porticciolo })
  const b = bancoDi(f, l.id)
  if (b.stato === 'attesa') return { ok: true, azione: 'aspetta', lotto: l.id, i: b.i, j: b.j, mare, resa, secondi: secondi(b.restoMs) }
  if (b.stato === 'riposo') return { ok: true, azione: 'riposo', lotto: l.id, mare, resa, secondi: secondi(b.restoMs) }
  const posti = postiDiPesca(f)
  if (!posti.length) return { ok: false, motivo: 'senza-molo' }
  if (mare && !porticciolo) return { ok: false, motivo: 'serve-porticciolo' }
  const ti = b.stato === 'abbocca' ? b.i : i, tj = b.stato === 'abbocca' ? b.j : j          // col pesce all'amo si va al galleggiante, non dove si è toccato
  const r = raggiungi(f, ti, tj, posti)
  if (!r) return { ok: false, motivo: 'lontano' }
  return { ok: true, azione: b.stato === 'abbocca' ? 'ritira' : 'lancia', sta: r.sta, lotto: l.id, i: ti, j: tj, mare, resa, secondi: 0 }
}

/** Lancia la lenza in (i, j): il galleggiante sta lì finché non abbocca. Un rifiuto non cambia niente. */
export function lanciaLenza(f, i, j) {
  const p = provaPesca(f, i, j)
  if (!p.ok) return p
  if (p.azione !== 'lancia') return { ok: false, motivo: p.azione === 'ritira' ? 'da-ritirare' : p.azione, secondi: p.secondi }
  f.s.pesca[p.lotto] = { i, j, fine: f.ora() + PESCA.ms, riposo: null }
  f._evento('lancio', { lotto: p.lotto })
  return { ok: true, lotto: p.lotto, fine: f.s.pesca[p.lotto].fine }
}

/** Ritira il pesce del banco `id`, se abbocca: va in dispensa, il banco si ripopola. */
export function ritiraPesca(f, id) {
  const e = f.s.pesca[id]
  if (!e || bancoDi(f, id).stato !== 'abbocca') return { ok: false, motivo: 'non-abbocca' }
  const p = provaPesca(f, e.i, e.j)
  if (!p.ok) return p
  f.s.prodotti.pesce = (f.s.prodotti.pesce || 0) + p.resa
  f.s.pesca[id] = { i: e.i, j: e.j, fine: null, riposo: f.ora() + PESCA.riposoMs }
  f._evento('pesce', { n: p.resa, mare: p.mare })
  return { ok: true, n: p.resa, mare: p.mare, lotto: id }
}

/** Le lenze in acqua o col pesce all'amo, per la scena: [{ lotto, i, j, stato: 'attesa' | 'abbocca', restoMs }]. */
export function lenzeInAcqua(f) {
  const out = []
  for (const id of Object.keys(f.s.pesca)) { const b = bancoDi(f, id); if (b.stato === 'attesa' || b.stato === 'abbocca') out.push({ lotto: id, i: b.i, j: b.j, stato: b.stato, restoMs: b.restoMs }) }
  return out
}

/** Ripulisce i banchi che hanno finito di riposare (non c'è più niente da ricordare). */
export function ripulisciPesca(f) {
  const t = f.ora()
  for (const [id, e] of Object.entries(f.s.pesca)) if (e.fine === null && (e.riposo === null || e.riposo <= t)) delete f.s.pesca[id]
}

/** Dopo che un molo, il porticciolo o uno stagno è stato spostato o tolto: una lenza che non ha più un molo vicino all'acqua dove sta il galleggiante si ritira da sé, senza pesce. */
export function riesaminaPesca(f) {
  for (const [id, e] of Object.entries(f.s.pesca)) {
    if (e.fine === null) continue
    const tipo = tipoAcqua(e.i, e.j)
    if (!f.acqua(e.i, e.j) || !raggiungi(f, e.i, e.j) || (tipo === 'mare' && !f.s.cose.some(c => c.tipo === 'porticciolo'))) delete f.s.pesca[id]
  }
}
