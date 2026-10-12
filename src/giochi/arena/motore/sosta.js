// La partita lasciata a metà: uscire non butta via niente. Si scrive quello che
// è successo (le monete, le costruzioni, le truppe in campo, le torri); le
// regole si rifanno dalla tappa. Non si salva il caso: la partita ripresa
// continua da dov'era ma i dadi che tira il nemico sono altri. Perché e cosa
// si perde: docs/arena/sosta.md.
import { Partita } from './partita.js'
import { TRUPPE, POSTI, LIV_MAX, MINIERA_MAX } from '../dati/regole.js'
import { CAMPAGNA, sfidaDi } from '../dati/campagna.js'

// sale quando un campo cambia significato: un salvataggio di un'altra
// versione si butta e la tappa ricomincia
export const VERSIONE = 1

const num = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max
const intero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max
const r1 = n => Math.round(n * 10) / 10

/* Torna `null` quando non c'è niente da ritrovare: partita finita o appena cominciata. */
export function scrivi(p, indice) {
  if (!p || p.fine || p.t < 5 || !CAMPAGNA[indice]) return null
  return {
    v: VERSIONE,
    chiave: CAMPAGNA[indice].chiave,
    t: r1(p.t), resto: r1(p.resto), pensa: r1(p.pensa),
    lati: { io: { monete: r1(p.lati.io.monete), miniera: p.lati.io.miniera },
            nem: { monete: r1(p.lati.nem.monete), miniera: p.lati.nem.miniera } },
    torri: p.torri.map(t => ({ lato: t.lato, tipo: t.tipo, hp: Math.round(t.hp), max: t.max, liv: t.liv })),
    muri: p.muri.map(m => ({ lato: m.lato, fila: m.fila, hp: Math.round(m.hp), max: m.max })),
    caserme: p.caserme.map(c => ({ lato: c.lato, id: c.id, posto: c.posto, liv: c.liv, t: r1(c.t), ciclo: r1(c.ciclo),
                                   riposo: r1(c.riposo), hp: Math.round(c.hp), max: c.max })),
    unita: p.unita.map(u => ({ id: u.id, lato: u.lato, x: Math.round(u.x), y: Math.round(u.y), hp: Math.round(u.hp), max: Math.round(u.max), forza: r1(u.forza) })),
  }
}

/* Torna `{ partita, indice }` pronti da mettere in campo, o `null` se il
   salvataggio non si può leggere: chi chiama butta la sosta e la mappa resta com'è. */
export function leggi(dato, { campagna = CAMPAGNA, rnd = Math.random } = {}) {
  if (!dato || dato.v !== VERSIONE) return null
  try {
    const indice = campagna.findIndex(t => t.chiave === dato.chiave)
    if (indice < 0) return null
    const tappa = campagna[indice]
    if (!num(dato.t, 0, 1e4) || !num(dato.resto, 0, 1e4) || !num(dato.pensa, 0, 60)) return null
    for (const lato of ['io', 'nem']) {
      const l = dato.lati?.[lato]
      if (!l || !num(l.monete, 0, 1e6) || !intero(l.miniera, 1, MINIERA_MAX)) return null
    }
    const p = new Partita({ rnd, sfida: sfidaDi(tappa) })
    p.t = dato.t; p.resto = dato.resto; p.pensa = dato.pensa
    for (const lato of ['io', 'nem']) {
      p.lati[lato].monete = dato.lati[lato].monete
      p.lati[lato].miniera = dato.lati[lato].miniera
    }

    if (!Array.isArray(dato.torri)) return null
    for (const t of dato.torri) {
      const mia = p.torri.find(x => x.lato === t.lato && x.tipo === t.tipo)
      if (!mia || !num(t.hp, 0, 1e5) || !num(t.max, 1, 1e5) || t.hp > t.max || !intero(t.liv, 1, LIV_MAX)) return null
      mia.hp = t.hp; mia.max = t.max; mia.liv = t.liv
    }

    if (!Array.isArray(dato.muri) || dato.muri.length > 4) return null
    p.muri = []
    for (const m of dato.muri) {
      if (!['io', 'nem'].includes(m.lato) || ![0, 1].includes(m.fila) || !num(m.hp, 1, 1e5) || !num(m.max, 1, 1e5) || m.hp > m.max) return null
      if (p.muri.some(x => x.lato === m.lato && x.fila === m.fila)) return null
      const nuovo = p.nuovoMuro(m.lato, m.fila)
      nuovo.hp = m.hp; nuovo.max = m.max
      p.muri.push(nuovo)
    }

    if (!Array.isArray(dato.caserme) || dato.caserme.length > 2 * POSTI.length) return null
    p.caserme = []
    for (const c of dato.caserme) {
      if (!['io', 'nem'].includes(c.lato) || !TRUPPE[c.id] || !tappa.truppe.includes(c.id) || !intero(c.posto, 0, POSTI.length - 1) ||
          !intero(c.liv, 1, LIV_MAX) || !num(c.t, -1e3, 1e3) || !num(c.ciclo, 0.1, 1e3) || !num(c.riposo, -1e3, 100) ||
          !num(c.hp, 1, 1e5) || !num(c.max, 1, 1e5) || c.hp > c.max) return null
      if (p.caserme.some(x => x.lato === c.lato && (x.posto === c.posto || x.id === c.id))) return null
      const nuova = p.nuovaCaserma(c.lato, c.id, c.posto, c.t)
      Object.assign(nuova, { liv: c.liv, t: c.t, ciclo: c.ciclo, riposo: c.riposo, hp: c.hp, max: c.max })
      p.caserme.push(nuova)
    }

    if (!Array.isArray(dato.unita) || dato.unita.length > 300) return null
    p.unita = []
    for (const u of dato.unita) {
      if (!['io', 'nem'].includes(u.lato) || !TRUPPE[u.id] || !num(u.x, -50, 450) || !num(u.y, -50, 600) ||
          !num(u.hp, 1, 1e5) || !num(u.max, 1, 1e5) || u.hp > u.max || !num(u.forza, 0.1, 100)) return null
      p.unita.push({ id: u.id, lato: u.lato, x: u.x, y: u.y, hp: u.hp, max: u.max, forza: u.forza,
                     cool: 0.5, fl: 0, colpo: 0, cammina: false, nasce: 0, vola: TRUPPE[u.id].vola, dirY: 0, r: 8 })
    }
    return { partita: p, indice }
  } catch {
    // un salvataggio storto non porta giù il gioco
    return null
  }
}

/* Cosa scrive la carta in cima alla mappa, senza aprire la partita. */
export function dice(dato, { campagna = CAMPAGNA } = {}) {
  if (!dato || dato.v !== VERSIONE) return null
  const indice = campagna.findIndex(t => t.chiave === dato.chiave)
  if (indice < 0) return null
  const s = Math.max(0, Math.ceil(dato.resto))
  return { indice, nome: campagna[indice].nome, restano: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
           monete: Math.floor(dato.lati?.io?.monete || 0) }
}
