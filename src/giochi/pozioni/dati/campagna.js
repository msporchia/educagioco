// Una scaletta sola, ripetuta per tre famiglie: nove gradini che
// insegnano una cosa nuova per volta. Il perché dei gradini e degli
// aiuti è in docs/pozioni/regole.md.
import { FAMIGLIE, VALE, scrivi } from './misure.js'

// le dosi, per gradino: `in` è dove la ricetta le scrive, i numeri sono
// multipli della grande
const GRADINI = [
  { id: 'banco', aiuto: 'gioco', strumenti: ['P'], scelta: 2, clienti: 4, ingredienti: 1,
    scuola: 'misure',
    nome: f => `Il banco dei ${f.parole.P[1]}`,
    dritta: f => `Scegli l'ingrediente giusto, mettilo ${f.dove} e componi la dose.`,
    dosi: [{ in: 'P', valori: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.5, 2] }] },

  { id: 'grande', aiuto: 'svolto', strumenti: ['P'], scelta: 2, clienti: 4, ingredienti: 1,
    nome: f => `Arriva il ${f.parole.G[0]}`,
    dritta: f => `Un ${f.parole.G[0]} sono ${VALE[f.unita.G] / VALE[f.unita.P]} ${f.parole.P[1]}, e il conto è scritto sopra il banco.`,
    dosi: [{ in: 'G', valori: [1, 2, 3] }] },

  { id: 'grandi', aiuto: 'regola', strumenti: ['P'], scelta: 3, clienti: 5, ingredienti: 1,
    nome: f => `${f.parole.G[1][0].toUpperCase() + f.parole.G[1].slice(1)} interi`,
    dritta: () => 'Stessi numeri, ma il risultato adesso lo trovi tu.',
    dosi: [{ in: 'G', valori: [1, 2, 3, 4, 5] }] },

  { id: 'virgola', aiuto: 'svolto', strumenti: ['P'], scelta: 3, clienti: 4, ingredienti: 1,
    nome: () => 'La virgola',
    dritta: f => `Mezzo ${f.parole.G[0]}, un ${f.parole.G[0]} e mezzo: la virgola si sposta, e il conto è scritto.`,
    dosi: [{ in: 'G', valori: [0.5, 1.5, 2.5, 3.5, 4.5] }] },

  { id: 'virgole', aiuto: '', strumenti: ['P'], scelta: 3, clienti: 5, ingredienti: 2,
    nome: () => 'Virgole senza aiuti',
    dritta: () => 'Adesso la virgola la sposti da solo.',
    dosi: [{ in: 'G', valori: [0.5, 1.5, 2.5, 4.5, 0.2, 0.4, 1.2, 2.5, 3.6] }] },

  { id: 'media', aiuto: 'svolto', strumenti: ['P', 'M'], scelta: 3, clienti: 4, ingredienti: 1,
    nome: f => f.strumenti.M.nome[0].toUpperCase() + f.strumenti.M.nome.slice(1),
    dritta: f => `Tanti ${f.parole.G[1]}: ${f.dove} dei ${f.parole.P[1]} non ci stanno. Questa conta in ${f.parole.M[1]}.`,
    dosi: [{ in: 'G', valori: [6, 8, 10, 12, 15, 20] }] },

  { id: 'miste', aiuto: 'regola', strumenti: ['P', 'M'], scelta: 3, clienti: 5, ingredienti: 2,
    nome: f => `${f.parole.G[1][0].toUpperCase() + f.parole.G[1].slice(1)}, ${f.parole.M[1]} e ${f.parole.P[1]}`,
    dritta: () => 'La ricetta parla in tre unità: leggi bene, e scegli dove misurare.',
    dosi: [{ in: 'G', valori: [6, 8, 12, 15] },
           { in: 'M', valori: [0.3, 0.7, 2.5, 4, 6.5] },
           { in: 'P', valori: [0.3, 0.7, 1.2, 2.5] }] },

  { id: 'inversa', aiuto: 'svolto', strumenti: ['P', 'M'], scelta: 3, clienti: 4, ingredienti: 1,
    nome: () => 'Al contrario',
    dritta: f => `${VALE[f.unita.G] / VALE[f.unita.P] * 6} ${f.parole.P[1]} sulla ricetta, e ${f.dove} dei ${f.parole.P[1]} non ci arrivi: si sale ai ${f.parole.M[1]}.`,
    dosi: [{ in: 'P', valori: [6, 8, 10, 12, 15, 20] }] },

  { id: 'inverse', aiuto: '', strumenti: ['P', 'M'], scelta: 3, clienti: 5, ingredienti: 2,
    nome: () => 'Su e giù per la scala',
    dritta: () => 'Salire o scendere lo decidi tu, senza cartello.',
    dosi: [{ in: 'P', valori: [6, 7, 9, 12, 18] },
           { in: 'M', valori: [2.5, 7, 15] },
           { in: 'G', valori: [0.5, 3, 12] }] },
]

// le due tappe finali: pescano da tutte e tre le famiglie, con le dosi
// dei gradini senza aiuti più (nell'ultima) quelle da magazzino
const FINALI = [
  { id: 'calderone', nome: 'Il grande calderone', emoji: '🔮',
    dritta: 'Pesi, lunghezze e liquidi nella stessa pozione: ogni ingrediente vuole il suo attrezzo.',
    aiuto: '', strumenti: ['P', 'M'], scelta: 4, clienti: 5, ingredienti: 3,
    da: ['grandi', 'virgole', 'miste', 'inverse'], portata: 82 },
  { id: 'maestro', nome: 'Maestro alchimista', emoji: '🏆',
    dritta: 'Tre attrezzi per famiglia, e dosi da magazzino.',
    aiuto: '', strumenti: ['P', 'M', 'G'], scelta: 4, clienti: 6, ingredienti: 3,
    da: ['virgole', 'miste', 'inverse'], portata: 85,
    dosi: [{ in: 'G', valori: [30, 40, 50, 75] },
           { in: 'M', valori: [25, 35, 50] },
           { in: 'P', valori: [3, 4.5, 25] }] },
]

// dove comincia ogni famiglia sulla scala 0-100 (docs/apprendimento/eta-e-portata.md):
// i pesi a sette anni e mezzo (quando le misure entrano a scuola), poi un
// punto e mezzo a gradino
const PORTATA_DA = { massa: 44, lunghezza: 56, capacita: 68 }
const PASSO_PORTATA = 1.5

const unaDose = (f, spec, v) => {
  const unita = f.unita[spec.in]
  const base = Math.round(v * VALE[f.unita.G])
  return { famiglia: f.chiave, unita, base, testo: scrivi(base, unita) }
}

const dosiDi = (f, specs) => specs.flatMap(s => s.valori.map(v => unaDose(f, s, v)))

function tappaDelGradino(f, g, n) {
  return {
    chiave: `${f.chiave}-${g.id}`, famiglie: [f.chiave], gradino: g.id,
    nome: g.nome(f), dritta: g.dritta(f), emoji: f.emoji,
    aiuto: g.aiuto, taglie: g.strumenti,
    strumenti: g.strumenti.map(t => f.strumenti[t].chiave),
    scelta: g.scelta, clienti: g.clienti, ingredienti: g.ingredienti,
    dosi: dosiDi(f, g.dosi),
    portata: PORTATA_DA[f.chiave] + n * PASSO_PORTATA,
    scuola: g.scuola || 'conversioni',
  }
}

function tappaFinale(t) {
  const dosi = FAMIGLIE.flatMap(f => [
    ...GRADINI.filter(g => t.da.includes(g.id)).flatMap(g => dosiDi(f, g.dosi)),
    ...dosiDi(f, t.dosi || []),
  ])
  return {
    chiave: t.id, famiglie: FAMIGLIE.map(f => f.chiave), gradino: t.id,
    nome: t.nome, dritta: t.dritta, emoji: t.emoji,
    aiuto: t.aiuto, taglie: t.strumenti,
    strumenti: FAMIGLIE.flatMap(f => t.strumenti.map(s => f.strumenti[s].chiave)),
    scelta: t.scelta, clienti: t.clienti, ingredienti: t.ingredienti,
    dosi, portata: t.portata, scuola: 'conversioni',
  }
}

export const CAMPAGNA = [
  ...FAMIGLIE.flatMap(f => GRADINI.map((g, n) => tappaDelGradino(f, g, n))),
  ...FINALI.map(tappaFinale),
]

export const QUANTE_TAPPE = CAMPAGNA.length
export const GRADINI_PER_FAMIGLIA = GRADINI.length
export const ID_GRADINI = GRADINI.map(g => g.id)

export const tappa = i => CAMPAGNA[Math.max(0, Math.min(i, CAMPAGNA.length - 1))]

// per la mappa: un blocco per famiglia, più il calderone in fondo
export const BLOCCHI = [
  ...FAMIGLIE.map(f => ({
    chiave: f.chiave, nome: f.nome, emoji: f.emoji,
    dritta: `${f.unita.G}, ${f.unita.M} e ${f.unita.P}`,
    tappe: CAMPAGNA.map((t, i) => ({ ...t, indice: i }))
      .filter(t => t.famiglie.length === 1 && t.famiglie[0] === f.chiave),
  })),
  { chiave: 'calderone', nome: 'Il calderone', emoji: '🔮', dritta: 'tutto insieme',
    tappe: CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.famiglie.length > 1) },
]

// quante dosi chiede una tappa a chi la finisce: è il lavoro vero, da lì
// escono le monete (docs/apprendimento/calibrazione.md)
export const dosiDellaTappa = t => t.clienti * t.ingredienti
export const MONETE_A_DOSE = 3

// Riceve da fuori chi sa dire se una dose si compone (`componibile`, nel
// motore): il dato non importa il motore, ma il test li mette insieme.
export function guastiDellaCampagna(componibile, campagna = CAMPAGNA, strumenti = {}) {
  const g = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} ("${t.chiave}")`
    if (viste.has(t.chiave)) g.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.dritta) g.push(`${dove}: senza nome o senza dritta`)
    if (!['gioco', 'svolto', 'regola', ''].includes(t.aiuto)) g.push(`${dove}: aiuto "${t.aiuto}" sconosciuto`)
    if (!(t.clienti >= 1) || !(t.ingredienti >= 1)) g.push(`${dove}: clienti o ingredienti a zero`)
    if (t.scelta < t.ingredienti + 1) g.push(`${dove}: lo scaffale non ha nemmeno un distrattore`)
    if (!(t.portata >= 0 && t.portata <= 100)) g.push(`${dove}: portata fuori scala`)
    if (i && t.portata < campagna[i - 1].portata) g.push(`${dove}: la portata scende`)
    if (!t.dosi.length) g.push(`${dove}: nessuna dose`)
    const attrezzi = t.strumenti.map(k => strumenti[k]).filter(Boolean)
    if (attrezzi.length !== t.strumenti.length) g.push(`${dove}: un attrezzo non esiste`)
    for (const d of t.dosi) {
      const suoi = attrezzi.filter(a => a.famiglia === d.famiglia)
      if (!suoi.length) { g.push(`${dove}: la dose ${d.testo} non ha attrezzi della sua famiglia`); continue }
      if (!suoi.some(a => componibile(d.base, a)))
        g.push(`${dove}: la dose ${d.testo} non si compone con nessun attrezzo`)
    }
    for (const f of t.famiglie)
      if (!t.dosi.some(d => d.famiglia === f)) g.push(`${dove}: la famiglia ${f} è in scena senza dosi`)
  }
  return g
}
