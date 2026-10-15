// La partita lasciata a metà: uscire non butta via niente. Si scrive quello che
// è successo (soli, piante, zombi, quelli che devono ancora arrivare); le regole
// si rifanno dalla tappa. Un salvataggio che non torna si butta e la mappa resta
// com'è. Perché e cosa si perde: docs/core/ripresa.md.
import { Partita } from './partita.js'
import { PIANTE } from '../dati/piante.js'
import { ZOMBI } from '../dati/zombi.js'
import { CAMPO } from '../dati/regole.js'
import { CAMPAGNA, sfidaDi } from '../dati/campagna.js'

// sale quando un campo cambia significato: un salvataggio di un'altra versione si butta
export const VERSIONE = 1

const num = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max
const intero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max
const r1 = n => Math.round(n * 10) / 10

/* `null` quando non c'è niente da ritrovare: finita o appena cominciata. */
export function scrivi(p, indice) {
  if (!p || p.fine || p.t < 5 || !CAMPAGNA[indice]) return null
  return {
    v: VERSIONE, chiave: CAMPAGNA[indice].chiave,
    t: r1(p.t), soli: Math.floor(p.soli), usati: p.usati, prossimoSole: r1(p.prossimoSole),
    cd: Object.fromEntries(Object.entries(p.cd).map(([k, n]) => [k, r1(n)])),
    carretti: { ...p.carretti },
    piante: p.piante.map(x => ({ id: x.id, c: x.c, r: x.r, vita: r1(x.vita), tempo: r1(x.tempo) })),
    zombi: p.zombi.map(z => ({ tipo: z.tipo, c: z.c, y: Math.round(z.y), vita: z.vita, lento: r1(z.lento) })),
    arrivi: p.arrivi.map(a => ({ t: r1(a.t), col: a.col, tipo: a.tipo })),
    totale: p.totale,
  }
}

/* `{ partita, indice }` pronti da mettere in campo, o `null`. */
export function leggi(dato, { campagna = CAMPAGNA, rnd = Math.random } = {}) {
  if (!dato || dato.v !== VERSIONE) return null
  try {
    const indice = campagna.findIndex(t => t.chiave === dato.chiave)
    if (indice < 0) return null
    const tappa = campagna[indice]
    const p = new Partita({ sfida: sfidaDi(tappa), rnd })
    if (!num(dato.t, 0, 1e4) || !num(dato.soli, 0, 1e5) || !intero(dato.usati, 0, CAMPO.colonne) || !num(dato.prossimoSole, 0, 100)) return null
    p.t = dato.t; p.soli = dato.soli; p.usati = dato.usati; p.prossimoSole = dato.prossimoSole

    for (const id of tappa.piante) {
      const n = dato.cd?.[id]
      if (!num(n, 0, 100)) return null
      p.cd[id] = n
    }
    for (const c of p.corsie) p.carretti[c] = !!dato.carretti?.[c]

    if (!Array.isArray(dato.piante) || dato.piante.length > CAMPO.colonne * CAMPO.righe) return null
    p.piante = []
    for (const x of dato.piante) {
      if (!tappa.piante.includes(x.id) || !p.corsie.includes(x.c) || !intero(x.r, CAMPO.rigaMin, CAMPO.righe - 1) ||
          !num(x.vita, 0.01, PIANTE[x.id].vita) || !num(x.tempo, 0, 100) || p.cella(x.c, x.r)) return null
      p.piante.push({ id: x.id, c: x.c, r: x.r, vita: x.vita, tempo: x.tempo })
    }

    if (!Array.isArray(dato.zombi) || dato.zombi.length > 200) return null
    p.zombi = []
    for (const z of dato.zombi) {
      if (!ZOMBI[z.tipo] || !p.corsie.includes(z.c) || !num(z.y, -100, CAMPO.righe * CAMPO.cella) ||
          !num(z.vita, 0.01, ZOMBI[z.tipo].vita) || !num(z.lento, 0, 10)) return null
      p.zombi.push({ tipo: z.tipo, c: z.c, y: z.y, vita: z.vita, lento: z.lento })
    }

    if (!Array.isArray(dato.arrivi) || dato.arrivi.length > 200 || !intero(dato.totale, 1, 400)) return null
    p.arrivi = []
    for (const a of dato.arrivi) {
      if (!ZOMBI[a.tipo] || !p.corsie.includes(a.col) || !num(a.t, 0, 1e4)) return null
      p.arrivi.push({ t: a.t, col: a.col, tipo: a.tipo })
    }
    p.totale = dato.totale
    return { partita: p, indice }
  } catch {
    return null     // un salvataggio storto non porta giù il gioco
  }
}

/* Cosa scrive la carta in cima alla mappa, senza aprire la partita. */
export function dice(dato, { campagna = CAMPAGNA } = {}) {
  if (!dato || dato.v !== VERSIONE) return null
  const indice = campagna.findIndex(t => t.chiave === dato.chiave)
  if (indice < 0) return null
  const restano = (dato.arrivi?.length || 0) + (dato.zombi?.length || 0)
  return { indice, nome: campagna[indice].nome, restano, soli: Math.floor(dato.soli || 0) }
}
