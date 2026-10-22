/* La fattoria 3D «tipo»: una fattoria già giocata del livello chiesto, costruita con lo stesso motore e una borsa infinita, già in moto
   (campi a stadi diversi, macchine con qualcosa da ritirare e qualcosa al lavoro). Il cheat `#fattoria3d-tipo=N` la mette al posto di
   quella del bambino attivo. Deterministica: nessun Math.random, la stessa ora dà la stessa fattoria. Vedi docs/fattoria3d/livelli.md. */
import { Fattoria3d } from './fattoria3d.js'
import { PEZZI, EDIFICI } from '../dati/catalogo.js'
import { COLTURE } from '../dati/colture.js'
import { RICETTE, TIPI_DI_MACCHINA } from '../dati/ricette.js'
import { lottoDaChiave } from '../dati/mondo.js'
import { sogliaDi, livelloDelPezzo, livelloDellaColtura, livelloDellaRicetta } from '../dati/livelli.js'

export const LIVELLI_TIPO = [3, 10, 20, 30, 50, 70]          // gli stessi della 2D (docs/fattoria3d/livelli.md)
export const LIVELLO_MAX = 99
export const borsaInfinita = () => ({ quante: () => Infinity, paga: () => true })

const LOTTI_MAX = 60                       // i giri di ricerca per un pezzo
const TERRA_MAX = liv => 24 + 5 * Math.min(liv, 20)          // i lotti che una fattoria di quel livello ha comprato al più
const DECORI = ['aiuola', 'panchina', 'fontana', 'pozzo', 'spaventapasseri', 'tavolo', 'passerella', 'ponte']
const FRAZIONI = [2, 0.4, 0.8]             // quanto è cresciuto il campo k, in tempi di maturazione: maturo, giovane, a metà
const dalCentro = (x, y) => (x.a * x.a + x.b * x.b) - (y.a * y.a + y.b * y.b) || x.a - y.a || x.b - y.b

/** Quanti pezzi di un tipo ci sono a quel livello: i campi crescono col livello, il resto è uno. */
const quanti = (tipo, liv) => tipo === 'campo' ? Math.min(10, 2 + Math.floor(liv / 2)) : tipo === 'aiuola' ? 3 : 1

export function fattoriaTipo(livello, { ora = Date.now() } = {}) {
  const liv = Math.max(1, Math.min(LIVELLO_MAX, livello | 0))
  let t = ora - 3600000                    // un'ora fa: il tempo si muove a mano, poi torna a quello vero
  let seme = 12345
  const rnd = () => { seme = (seme * 1664525 + 1013904223) >>> 0; return seme / 4294967296 }          // il caso, ma sempre lo stesso
  const f = new Fattoria3d({ borsa: borsaInfinita(), ora: () => t, rnd })
  f.s.esperienza = sogliaDi(liv)           // il livello è quello chiesto, e le porte sono già aperte

  const presi = new Set()                  // le celle dei pezzi messi: attorno a ognuno ne resta una libera, per camminare
  const sta = (d, i, j) => {
    for (let a = -1; a <= d.w; a++) for (let b = -1; b <= d.d; b++) if (presi.has(`${i + a},${j + b}`)) return false
    return true
  }
  const cerca = tipo => {
    const d = PEZZI[tipo] || EDIFICI[tipo]
    for (let giro = 0; giro < LOTTI_MAX; giro++) {
      for (const l of [...f.propri].map(lottoDaChiave).sort(dalCentro)) {
        for (let j = l.j; j < l.j + l.d; j++) for (let i = l.i; i < l.i + l.w; i++) {
          if (sta(d, i, j) && f.puoMettere(tipo, i, j).ok) return [i, j]
        }
      }
      if (Object.keys(f.s.lotti).length >= TERRA_MAX(liv)) return null          // un pezzo che non ci sta (la riva che non c'è) non compra mezzo mondo
      const nuovo = f.lottiComprabili().slice().sort(dalCentro)[0]
      if (!nuovo || !f.compraLotto(nuovo.id).ok) return null
    }
    return null
  }
  const metti = tipo => {
    const posto = cerca(tipo)
    if (!posto) return null
    const r = f.compraEMetti(tipo, posto[0], posto[1])
    if (!r.ok) return null
    const d = PEZZI[tipo] || EDIFICI[tipo]
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) presi.add(`${posto[0] + a},${posto[1] + b}`)
    return r.cosa
  }

  // le cose che lavorano prima (campi, bestie, macchine), poi le decorazioni; solo quelle che il livello ha aperto
  const aperti = tabella => Object.keys(tabella).filter(k => livelloDelPezzo(k) <= liv)
  const campi = f.s.cose.filter(c => c.tipo === 'campo')          // il campo vuoto di partenza ci sta già
  for (const tipo of [...aperti(EDIFICI), ...aperti(PEZZI).filter(k => PEZZI[k].produttivo)]) {
    for (let k = 0; k < quanti(tipo, liv); k++) { const c = metti(tipo); if (c && tipo === 'campo') campi.push(c) }
  }
  for (const tipo of ['bancarella', 'bacheca', 'trattore', 'porticciolo', ...DECORI, 'stagno', 'laghetto']) {
    if (!PEZZI[tipo] || livelloDelPezzo(tipo) > liv) continue
    for (let k = 0; k < quanti(tipo, liv); k++) metti(tipo)
  }

  // la dispensa piena: le colture aperte e i prodotti di ogni ricetta
  const aperte = Object.keys(COLTURE).filter(k => livelloDellaColtura(k) <= liv)
  for (const k of aperte) f.s.merci[k] = 12
  f.s.lana = 6
  for (const r of Object.keys(RICETTE)) f.s.prodotti[RICETTE[r].da || r] = 4

  // i campi: uno maturo, uno giovane, uno a metà, con colture diverse tra quelle aperte
  campi.forEach((c, k) => {
    const col = aperte[k % aperte.length]
    if (!f.semina(c.id, col).ok) return
    const t0 = ora - FRAZIONI[k % FRAZIONI.length] * COLTURE[col].ms
    c.tile = c.tile.map(() => t0)
  })

  // le macchine: le ricette aperte più corte, messe in coda un'ora fa (le corte sono pronte, le lunghe stanno ancora cuocendo)
  for (const tipo of TIPI_DI_MACCHINA) {
    if (!f.s.posseduti[tipo]) continue
    const ric = Object.keys(RICETTE).filter(id => RICETTE[id].dove === tipo && livelloDellaRicetta(id) <= liv).sort((a, b) => RICETTE[a].ms - RICETTE[b].ms)
    for (const id of ric.slice(0, f.postiDi(tipo))) f.avviaRicettaIn(tipo, id)
  }
  t = ora
  f.tick()

  f.s.esperienza = sogliaDi(liv)           // costruire ha speso, e speso fa salire: il livello resta quello chiesto
  f.eventi = []
  f.ora = Date.now
  f.borsa = null                           // la borsa vera la mette il chiamante
  return f
}
