// La partita lasciata a metà: uscire non butta via niente. Si scrive quello che
// è successo (le monete, le costruzioni, le truppe in campo, i castelli); le
// regole si rifanno dalla tappa. Non si salva il caso: la partita ripresa
// continua da dov'era ma i dadi che tira il nemico sono altri. Perché e cosa
// si perde: docs/arena/sosta.md.
import { Partita } from './partita.js'
import { TRUPPE, POSTI, BOMBA, TERRENI } from '../dati/regole.js'
import { CAMPAGNA, INFINITA, sfidaDi, sfidaInfinita, livelloValido } from '../dati/campagna.js'

// sale quando un campo cambia significato: un salvataggio di un'altra
// versione si butta e la tappa ricomincia
export const VERSIONE = 5

const num = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max
const intero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max
const r1 = n => Math.round(n * 10) / 10

/* Torna `null` quando non c'è niente da ritrovare: partita finita o appena cominciata.
   `indice` è la tappa; la battaglia infinita (`INFINITA`, senza timer) passa `{ infinita: terreno }`:
   la sua sosta ha la chiave `infinita` e il terreno, e il tempo che resta non c'è (conta `t`). */
export function scrivi(p, indice, livello) {
  const infinita = indice && typeof indice === 'object' ? indice.infinita : null
  if (!p || p.fine || p.t < 5 || !(infinita ? TERRENI.includes(infinita) : CAMPAGNA[indice])) return null
  return {
    v: VERSIONE,
    chiave: infinita ? INFINITA.chiave : CAMPAGNA[indice].chiave,
    livello: livelloValido(livello),
    ...(infinita ? { terreno: infinita } : {}),
    t: r1(p.t), resto: infinita ? 0 : r1(p.resto), pensa: r1(p.pensa),
    lati: { io: { monete: r1(p.lati.io.monete), bombe: p.lati.io.bombe, bombaT: r1(p.lati.io.bombaT) },
            nem: { monete: r1(p.lati.nem.monete), bombe: p.lati.nem.bombe, bombaT: r1(p.lati.nem.bombaT) } },
    miniere: p.miniere.map(m => ({ lato: m.lato, posto: m.posto, liv: m.liv, spesa: m.spesa, hp: Math.round(m.hp), max: m.max })),
    castelli: p.castelli.map(c => ({ lato: c.lato, hp: Math.round(c.hp), max: c.max, liv: c.liv })),
    muri: p.muri.map(m => ({ lato: m.lato, hp: Math.round(m.hp), max: m.max })),
    caserme: p.caserme.map(c => ({ lato: c.lato, id: c.id, posto: c.posto, liv: c.liv, spesa: c.spesa, t: r1(c.t), ciclo: r1(c.ciclo),
                                   riposo: r1(c.riposo), hp: Math.round(c.hp), max: c.max })),
    unita: p.unita.map(u => ({ id: u.id, lato: u.lato, x: Math.round(u.x), y: Math.round(u.y), hp: Math.round(u.hp), max: Math.round(u.max), forza: r1(u.forza) })),
  }
}

/* Torna `{ partita, indice }` pronti da mettere in campo (per la battaglia infinita `indice` è -1 e c'è
   `terreno`), o `null` se il salvataggio non si può leggere: chi chiama butta la sosta e la mappa resta com'è. */
export function leggi(dato, { campagna = CAMPAGNA, rnd = Math.random } = {}) {
  if (!dato || dato.v !== VERSIONE) return null
  try {
    const infinita = dato.chiave === INFINITA.chiave
    if (infinita && !TERRENI.includes(dato.terreno)) return null
    const indice = infinita ? -1 : campagna.findIndex(t => t.chiave === dato.chiave)
    if (indice < 0 && !infinita) return null
    const livello = livelloValido(dato.livello)   // una sosta senza livello è di prima: il medio
    const sfida = infinita ? sfidaInfinita(dato.terreno, livello) : sfidaDi(campagna[indice], livello)
    if (!num(dato.t, 0, 1e5) || !num(dato.resto, 0, 1e4) || !num(dato.pensa, 0, 60)) return null
    for (const lato of ['io', 'nem']) {
      const l = dato.lati?.[lato]
      if (!l || !num(l.monete, 0, 1e6) || !intero(l.bombe, 0, BOMBA.max) || !num(l.bombaT, 0, BOMBA.ogni + 1)) return null
    }
    const p = new Partita({ rnd, sfida })
    p.t = dato.t; p.resto = infinita ? Infinity : dato.resto; p.pensa = dato.pensa
    for (const lato of ['io', 'nem']) {
      p.lati[lato].monete = dato.lati[lato].monete
      p.lati[lato].bombe = dato.lati[lato].bombe
      p.lati[lato].bombaT = dato.lati[lato].bombaT
    }

    if (!Array.isArray(dato.castelli)) return null
    for (const t of dato.castelli) {
      const mio = p.castelli.find(x => x.lato === t.lato)
      if (!mio || !num(t.hp, 0, 1e6) || !num(t.max, 1, 1e6) || t.hp > t.max || !intero(t.liv, 1, 1e3)) return null
      mio.hp = t.hp; mio.max = t.max; mio.liv = t.liv
    }

    if (!Array.isArray(dato.muri)) return null
    for (const m of dato.muri) {
      const mio = p.muri.find(x => x.lato === m.lato)
      if (!mio || !num(m.hp, 0, 1e5) || !num(m.max, 1, 1e5) || m.hp > m.max) return null
      mio.hp = m.hp; mio.max = m.max; mio.crollato = m.hp <= 0
    }

    if (!Array.isArray(dato.caserme) || dato.caserme.length > 2 * POSTI.length) return null
    p.caserme = []
    for (const c of dato.caserme) {
      if (!['io', 'nem'].includes(c.lato) || !TRUPPE[c.id] || !sfida.truppe.includes(c.id) || !intero(c.posto, 0, POSTI.length - 1) ||
          !intero(c.liv, 1, 1e3) || !num(c.spesa, 0, 1e5) || !num(c.t, -1e3, 1e3) || !num(c.ciclo, 0.1, 1e3) || !num(c.riposo, -1e3, 100) ||
          !num(c.hp, 1, 1e5) || !num(c.max, 1, 1e5) || c.hp > c.max) return null
      if (p.caserme.some(x => x.lato === c.lato && x.posto === c.posto)) return null      // due caserme uguali sì, due su una piazzola no
      const nuova = p.nuovaCaserma(c.lato, c.id, c.posto, c.t)
      Object.assign(nuova, { liv: c.liv, spesa: c.spesa, t: c.t, ciclo: c.ciclo, riposo: c.riposo, hp: c.hp, max: c.max })
      p.caserme.push(nuova)
    }

    if (!Array.isArray(dato.miniere) || dato.miniere.length > POSTI.length * 2) return null
    p.miniere = []
    for (const m of dato.miniere) {
      if (!['io', 'nem'].includes(m.lato) || !intero(m.posto, 0, POSTI.length - 1) || !intero(m.liv, 1, 1e3) ||
          !num(m.spesa, 0, 1e5) || !num(m.hp, 1, 1e5) || !num(m.max, 1, 1e5) || m.hp > m.max) return null
      if (p.edificioIn(m.lato, m.posto)) return null                                  // una piazzola, un edificio
      p.miniere.push(Object.assign(p.nuovaMiniera(m.lato, m.posto), { liv: m.liv, spesa: m.spesa, hp: m.hp, max: m.max }))
    }
    p.contaMiniere('io'); p.contaMiniere('nem')

    if (!Array.isArray(dato.unita) || dato.unita.length > 800) return null       // le squadre crescono a ogni livello
    p.unita = []
    for (const u of dato.unita) {
      if (!['io', 'nem'].includes(u.lato) || !TRUPPE[u.id] || !num(u.x, -50, 450) || !num(u.y, -50, 600) ||
          !num(u.hp, 1, 1e5) || !num(u.max, 1, 1e5) || u.hp > u.max || !num(u.forza, 0.1, 100)) return null
      p.unita.push({ id: u.id, lato: u.lato, x: u.x, y: u.y, hp: u.hp, max: u.max, forza: u.forza,
                     cool: 0.5, fl: 0, colpo: 0, cammina: false, nasce: 0, vola: TRUPPE[u.id].vola, dirY: 0, r: 8 })
    }
    p.ia.passo = 99                // la scaletta del nemico non si salva: ripreso, va avanti con la regola di tutti i giorni
    return { partita: p, indice, livello, ...(infinita ? { terreno: dato.terreno } : {}) }
  } catch {
    // un salvataggio storto non porta giù il gioco
    return null
  }
}

/* Cosa scrive la carta in cima alla mappa, senza aprire la partita. */
export function dice(dato, { campagna = CAMPAGNA } = {}) {
  if (!dato || dato.v !== VERSIONE) return null
  if (dato.chiave === INFINITA.chiave) {
    if (!TERRENI.includes(dato.terreno)) return null
    const s = Math.max(0, Math.floor(dato.t))
    return { indice: -1, infinita: true, terreno: dato.terreno, nome: INFINITA.nome, restano: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
             monete: Math.floor(dato.lati?.io?.monete || 0) }
  }
  const indice = campagna.findIndex(t => t.chiave === dato.chiave)
  if (indice < 0) return null
  const s = Math.max(0, Math.ceil(dato.resto))
  return { indice, nome: campagna[indice].nome, restano: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
           monete: Math.floor(dato.lati?.io?.monete || 0) }
}
