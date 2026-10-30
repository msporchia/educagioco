/* La fattoria in comune (docs/fattoria3d/in-comune.md): le mosse che cambiano il motore, come si registrano mentre il bambino
   gioca e come si rifà sul proprio telefono la mossa dell'amico. Niente rete e niente schermo: la fila delle mosse la tiene
   comune.js. Il merge è permissivo: una mossa dell'amico che qui non va più non toglie niente a nessuno, e chi l'ha fatta tiene
   quello che aveva preso (il raccolto, il pezzo comprato va nel magazzino). */
import { EDIFICI } from '../dati/catalogo.js'

// i metodi del motore che cambiano la fattoria; `cura.<metodo>` quelli delle bestie di casa
export const MOSSE = [
  'compraLotto', 'disegnaStrada', 'togliStrada', 'compraPezzo', 'mettiPezzo', 'compraEMetti', 'spostaPezzo', 'ruotaPezzo', 'mettiVia',
  'compraEdificio', 'semina', 'raccogliTessera', 'ingrandisciSilo', 'costruisciMagazzino', 'abbatti', 'togliOstacolo', 'tosa', 'nutri', 'nutriBestie',
  'raccogliProdotti', 'compraBestia', 'compraPosto', 'avviaRicettaIn', 'ritiraDa', 'caricaCassa', 'partiMongolfiera', 'consegna',
  'rifiuta', 'consegnaBottega', 'rifiutaBottega', 'lanciaLenza', 'ritiraPesca',
  'cura.compra', 'cura.nutri', 'cura.coccola', 'cura.carezza', 'cura.battezza', 'cura.sposta',
]
const NOTE = new Set(MOSSE)
// un acquisto che qui non va (la cella è presa, l'edificio c'è già): il pezzo pagato va nel magazzino, da mettere
const PEZZO_IN_MAGAZZINO = new Set(['compraEMetti', 'compraEdificio'])

export const MAX_ARGOMENTI = 4
const TETTO_MERCE = 60                 // quanto può ridare una mossa per merce: un raccolto, una macchina che si svuota
const TETTO_ESPERIENZA = 5000          // e quanta esperienza (la terra più cara)
const BORSA_LIBERA = { quante: () => 1e9, paga: () => true }      // la mossa dell'amico l'ha già pagata lui, con le sue monete

const dove = (m, n) => n.startsWith('cura.') ? [m.cura, n.slice(5)] : [m, n]

/* quello che c'è nella fattoria e si può prendere: per vedere cosa ha guadagnato una mossa */
function conto(s) {
  return { m: { ...s.merci }, p: { ...s.prodotti }, l: s.lana || 0, e: s.esperienza || 0, g: { ...s.magazzino } }
}
function guadagni(prima, dopo) {
  const piu = (a, b) => { const o = {}; for (const k of Object.keys(b)) { const d = (b[k] || 0) - (a[k] || 0); if (d > 0) o[k] = d } return o }
  const g = { m: piu(prima.m, dopo.m), p: piu(prima.p, dopo.p), g: piu(prima.g, dopo.g) }
  if (dopo.l > prima.l) g.l = dopo.l - prima.l
  if (dopo.e > prima.e) g.e = dopo.e - prima.e
  for (const k of ['m', 'p', 'g']) if (!Object.keys(g[k]).length) delete g[k]
  return g
}

/* Ascolta il motore: ogni mossa riuscita del bambino diventa `{ n, a, f, i0? }` per `quando` (il nome, gli argomenti, quello che ha
   guadagnato, e il primo id delle cose nuove). `corsia` (0 o 1) tiene separati gli id delle cose: pari per uno, dispari per l'altro,
   così due pezzi messi insieme sui due telefoni non hanno mai lo stesso id. Torna la funzione che smette di ascoltare. */
export function registra(motore, quando, { corsia = 0 } = {}) {
  let fondo = 0                              // un metodo che ne chiama un altro è una mossa sola
  const tolti = []
  for (const n of MOSSE) {
    const [o, nome] = dove(motore, n)
    if (typeof o[nome] !== 'function') continue
    const vero = o[nome]
    const proprio = Object.prototype.hasOwnProperty.call(o, nome)
    o[nome] = function (...a) {
      if (fondo > 0 || motore.rifacendo) return vero.apply(o, a)
      const s = motore.s
      if (s.prossimoId % 2 !== corsia) s.prossimoId++
      const id0 = s.prossimoId, prima = conto(s)
      fondo++
      let r
      try { r = vero.apply(o, a) } finally { fondo-- }
      if (r && r.ok) {
        const mossa = { n, a: JSON.parse(JSON.stringify(a)), f: guadagni(prima, conto(motore.s)) }
        if (motore.s.prossimoId > id0) mossa.i0 = id0
        quando(mossa)
      }
      return r
    }
    tolti.push(() => { if (proprio) o[nome] = vero; else delete o[nome] })
  }
  return () => { for (const t of tolti) t() }
}

/* Una mossa arrivata da fuori: si controlla a forma (viene da un altro telefono) e torna pulita, o null. */
export function mossaInForma(x) {
  if (!x || typeof x !== 'object' || !NOTE.has(x.n) || !Array.isArray(x.a) || x.a.length > MAX_ARGOMENTI) return null
  const a = x.a.filter(v => v === null || ['string', 'number', 'boolean'].includes(typeof v) || (typeof v === 'object' && !Array.isArray(v)))
  if (a.length !== x.a.length) return null
  const tetto = (o, max) => {
    const out = {}
    for (const [k, v] of Object.entries(o && typeof o === 'object' ? o : {})) if (/^[a-z0-9_]{1,24}$/i.test(k) && Number.isFinite(v) && v > 0) out[k] = Math.min(max, Math.floor(v))
    return out
  }
  const f = x.f && typeof x.f === 'object' ? x.f : {}
  const pulita = { n: x.n, a, f: { m: tetto(f.m, TETTO_MERCE), p: tetto(f.p, TETTO_MERCE), g: tetto(f.g, 3) } }
  if (Number.isFinite(f.l) && f.l > 0) pulita.f.l = Math.min(TETTO_MERCE, Math.floor(f.l))
  if (Number.isFinite(f.e) && f.e > 0) pulita.f.e = Math.min(TETTO_ESPERIENZA, Math.floor(f.e))
  if (Number.isInteger(x.i0) && x.i0 > 0 && x.i0 < 1e9) pulita.i0 = x.i0
  return pulita
}

/* Rifà sul motore di questo telefono una mossa dell'amico, già pulita da `mossaInForma`. Senza monete (le ha spese lui) e senza
   contare niente per chi guarda: i contatori sono di chi ha fatto la mossa. Se qui non riesce, il merge permissivo: quello che
   lui aveva preso entra lo stesso, e un pezzo che non trova posto va nel magazzino. Torna { ok, compensata, livello }. */
export function rifai(motore, mossa) {
  const s = motore.s, borsa = motore.borsa, eventi = motore.eventi.length, pid = s.prossimoId
  const [o, nome] = dove(motore, mossa.n)
  motore.borsa = BORSA_LIBERA
  motore.rifacendo = true
  if (mossa.i0 && mossa.i0 > 0) s.prossimoId = mossa.i0
  let r = null
  try { r = typeof o[nome] === 'function' ? o[nome](...mossa.a) : null } catch (e) { r = null }
  finally { motore.borsa = borsa; motore.rifacendo = false }
  s.prossimoId = Math.max(pid, s.prossimoId)
  const nuovi = motore.eventi.splice(eventi)
  const livello = nuovi.filter(e => e.tipo === 'livello').pop() || null
  if (r && r.ok) return { ok: true, compensata: false, livello }
  compensa(motore, mossa)
  return { ok: false, compensata: true, livello: null }
}

function compensa(motore, mossa) {
  const s = motore.s, f = mossa.f || {}
  for (const [k, n] of Object.entries(f.m || {})) if (k in s.merci) s.merci[k] += n
  for (const [k, n] of Object.entries(f.p || {})) s.prodotti[k] = (s.prodotti[k] || 0) + n
  for (const [k, n] of Object.entries(f.g || {})) s.magazzino[k] = (s.magazzino[k] || 0) + n
  if (f.l) s.lana = (s.lana || 0) + f.l
  if (f.e) s.esperienza += f.e
  const tipo = mossa.a[0]
  if (PEZZO_IN_MAGAZZINO.has(mossa.n) && typeof tipo === 'string' && motore.misure(tipo) && !(EDIFICI[tipo] && (s.posseduti[tipo] || motore.nelMagazzino(tipo) > 0)))
    s.magazzino[tipo] = motore.nelMagazzino(tipo) + 1
}
