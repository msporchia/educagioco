// Dove cade ogni cosa sulla mappa del tesoro: puro, senza canvas, gira in
// Node (test/unita/inglese-vista). Riceve lo stato della mappa
// (motore/mappa.js, statoMappa) e la larghezza, e torna isole, sentieri e
// nodi in pixel CSS. La tela li dipinge, la vista ci mette sopra i tasti.
// Le scelte sono in docs/lingue/mondi.md («La mappa del tesoro»).
import { dado } from '../../../grafica/comune.js'

export const R_TAPPA = 30
export const R_PICCOLO = 22        // il libro e il cassetto
export const PASSO = 104           // da una tappa all'altra, in verticale
const TITOLO = 40                  // il nome del mondo, sopra la sua prima tappa
const SOTTO = 44                   // il nome sotto un nodo, e un po' d'aria
const IN_CIMA = 26
const LATO = 10
// l'onda del sentiero dentro un mondo: si legge come una strada, non come una colonna
const ONDA = [0, 0.85, 0.15, -0.8, -0.1, 0.75, 0.05, -0.85]

// la profondità di un mondo nel grafo: 0 per chi non dipende da nessuno
function profondita(mondi) {
  const per = new Map(mondi.map(m => [m.id, m]))
  const memo = new Map()
  const p = id => {
    if (memo.has(id)) return memo.get(id)
    const m = per.get(id)
    const dip = m ? [...m.dopo, ...(m.dopoUno || [])].filter(d => per.has(d)) : []
    const v = dip.length ? 1 + Math.max(...dip.map(p)) : 0
    memo.set(id, v)
    return v
  }
  mondi.forEach(m => p(m.id))
  return memo
}

// un arco leggermente curvo fra due punti: il verso della curva lo decide il
// caso fisso (dado), così la mappa è la stessa a ogni ridisegno
function sentiero(da, a, seme, battuto, tipo) {
  const mx = (da.x + a.x) / 2, my = (da.y + a.y) / 2
  const dx = a.x - da.x, dy = a.y - da.y
  const lung = Math.hypot(dx, dy) || 1
  const piega = (dado(seme, 7, 3) - 0.5) * 0.45 * lung
  return { da: { x: da.x, y: da.y }, a: { x: a.x, y: a.y },
           ctrl: { x: mx - (dy / lung) * piega, y: my + (dx / lung) * piega }, battuto, tipo }
}

/* `stato`: l'uscita di statoMappa. `extra(mondo)` → { libro: null | { aperto },
   cassetto: null | { aperto } }, deciso dal gioco. */
export function disponi(stato, W, extra = () => ({})) {
  const prof = profondita(stato)
  const file = []
  for (const m of stato) (file[prof.get(m.id)] ||= []).push(m)

  const nodi = [], sentieri = [], isole = [], titoli = []
  const entrata = new Map(), uscita = new Map()
  let y0 = IN_CIMA
  let semeFila = 1

  for (const fila of file.filter(Boolean)) {
    // i mondi con le tappe in mezzo, gli altri ai lati: la strada principale scende dritta
    const ordinati = fila.slice().sort((a, b) => b.tappe.length - a.tappe.length)
    const posti = []
    ordinati.forEach((m, i) => {
      const lato = i % 2 ? 1 : -1
      if (i === 0) posti.push(m)
      else if (lato < 0) posti.unshift(m)
      else posti.push(m)
    })
    const pesi = posti.map(m => (m.pronto ? 2.6 : 1))
    const somma = pesi.reduce((a, b) => a + b, 0)
    const utile = W - 2 * LATO
    let x = LATO
    const colonne = posti.map((m, i) => {
      const larg = utile * pesi[i] / somma
      const c = { m, cx: x + larg / 2, larg }
      x += larg
      return c
    })

    // l'altezza della fila: quella del mondo più lungo
    const altezzaDi = m => {
      if (!m.pronto) return TITOLO + 2 * R_TAPPA + SOTTO
      const ex = extra(m.id) || {}
      const coda = (ex.libro || ex.cassetto) ? PASSO * 0.9 : 0
      return TITOLO + 2 * R_TAPPA + (m.tappe.length - 1) * PASSO + coda + SOTTO
    }
    const alta = Math.max(...posti.map(altezzaDi))

    for (const { m, cx: centro, larg } of colonne) {
      let cx = centro
      const cerchi = []
      const seme = semeFila++
      if (!m.pronto) {
        const y = y0 + alta / 2
        // una colonna stretta sta sul bordo: l'isola si tira dentro, se no la taglia lo schermo
        cx = Math.max(R_TAPPA + 30, Math.min(W - R_TAPPA - 30, cx))
        const n = { chiave: 'mondo:' + m.id, tipo: 'mondo', id: m.id, mondo: m.id, x: cx, y, r: R_TAPPA,
                    disegno: m.disegno, stato: 'arrivo', nome: m.nome, larg }
        nodi.push(n)
        entrata.set(m.id, n); uscita.set(m.id, n)
        cerchi.push({ x: cx, y, r: R_TAPPA + 16 },
                    { x: cx + (dado(seme, 1) - 0.5) * 30, y: y + 26, r: R_TAPPA + 6 },
                    { x: cx + (dado(seme, 2) - 0.5) * 30, y: y - 24, r: R_TAPPA })
        isole.push({ mondo: m.id, cerchi, stato: 'arrivo' })
        titoli.push({ mondo: m.id, nome: m.nome, x: cx, y: y - R_TAPPA - TITOLO / 2 - 4, larg,
                      pronto: false, aperto: false })
        continue
      }
      const A = Math.max(0, Math.min(70, larg / 2 - R_TAPPA - 18))
      const primoY = y0 + TITOLO + R_TAPPA
      let prima = null
      let giaAdesso = false
      m.tappe.forEach((t, i) => {
        const n = {
          chiave: 'tappa:' + t.id, tipo: 'tappa', id: t.id, mondo: m.id,
          x: cx + A * ONDA[i % ONDA.length], y: primoY + i * PASSO, r: R_TAPPA,
          disegno: t.disegno, nome: t.nome, bandiera: t.bandiera, grado: t.grado, larg,
          stato: t.vinta ? 'vinta' : t.aperta ? 'aperta' : 'chiusa',
          adesso: false,
        }
        if (!giaAdesso && t.aperta && !t.vinta) { n.adesso = true; giaAdesso = true }
        nodi.push(n)
        cerchi.push({ x: n.x, y: n.y, r: R_TAPPA + 24 })
        if (prima) {
          sentieri.push(sentiero(prima, n, seme * 31 + i, t.vinta, 'dentro'))
          cerchi.push({ x: (prima.x + n.x) / 2, y: (prima.y + n.y) / 2, r: R_TAPPA + 18 })
        }
        if (i === 0) entrata.set(m.id, n)
        prima = n
      })
      uscita.set(m.id, prima)
      const ex = extra(m.id) || {}
      const coda = [['libro', ex.libro], ['cassetto', ex.cassetto]].filter(([, v]) => v)
      coda.forEach(([tipo, v], k) => {
        const verso = coda.length === 1 ? (prima.x > cx ? -1 : 1) : (k ? 1 : -1)
        const n = { chiave: tipo + ':' + m.id, tipo, id: m.id, mondo: m.id,
                    x: cx + verso * Math.min(58, larg / 2 - R_PICCOLO - 12), y: prima.y + PASSO * 0.9,
                    r: R_PICCOLO, disegno: tipo, stato: v.aperto ? 'aperta' : 'chiusa', larg: larg / 2 }
        nodi.push(n)
        cerchi.push({ x: n.x, y: n.y, r: R_PICCOLO + 20 })
        sentieri.push(sentiero(prima, n, seme * 17 + k, v.aperto, 'spiazzo'))
      })
      isole.push({ mondo: m.id, cerchi, stato: m.aperto ? 'aperto' : 'chiuso' })
      titoli.push({ mondo: m.id, nome: m.nome, x: cx, y: y0 + TITOLO / 2 - 2, larg, pronto: true,
                    aperto: m.aperto })
    }
    y0 += alta + 18
  }

  // fra i mondi: solo dalla fila appena sopra (la prova finale dipende da
  // tutti, ma un filo da ognuno sarebbe una ragnatela)
  for (const m of stato) {
    const p = prof.get(m.id)
    for (const d of [...m.dopo, ...(m.dopoUno || [])]) {
      if (prof.get(d) !== p - 1 || !uscita.has(d) || !entrata.has(m.id)) continue
      sentieri.push(sentiero(uscita.get(d), entrata.get(m.id), p * 97 + d.length, m.aperto, 'fra'))
    }
  }

  return { W, H: Math.ceil(y0 + 10), nodi, sentieri, isole, titoli }
}
