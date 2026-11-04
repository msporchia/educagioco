// Una scaletta sola, ripetuta per tre famiglie: nove gradini che
// insegnano una cosa nuova per volta, ognuno una pozione col suo nome. Il
// perché dei gradini è in docs/pozioni/regole.md.
import { FAMIGLIE, POZIONI, VALE, scrivi } from './misure.js'

// quali azioni ci sono sul tavolo, a quel `procedimento`: una in più per volta
const AZIONI_DEL = { 1: ['versa', 'mescola'], 2: ['versa', 'mescola', 'scalda'], 3: ['pesta', 'versa', 'mescola', 'scalda'],
                     4: ['pesta', 'versa', 'mescola', 'scalda', 'diluisci'], 5: ['pesta', 'versa', 'mescola', 'scalda', 'diluisci'] }

// `dosi`: `in` è dove la ricetta le scrive, i numeri sono multipli della
// grande. `etichette`: in che unità il mercante scrive il listino.
// `margine`: i gettoni oltre il minimo. `procedimento`: quanto è ricco il
// passo dopo la spesa (motore/procedimento.js). `casa`: qualcosa c'è già. `manca`: la pergamena fa la
// sottrazione. `ordine`: quante ampolle si chiedono in una volta.
const GRADINI = [
  { id: 'banco', aiuto: 'gioco', ingredienti: 2, procedimento: 1, ordine: 2, margine: 8, manca: true, etichette: ['P'],
    scuola: 'misure',
    dritta: () => 'Ordina dal listino le ampolle che fanno la dose.',
    dosi: [{ in: 'P', valori: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.5, 2] }] },

  { id: 'grande', aiuto: 'svolto', ingredienti: 2, procedimento: 2, ordine: 2, margine: 8, manca: true, etichette: ['P'],
    dritta: f => `Un ${f.parole.G[0]} sono ${VALE[f.unita.G] / VALE[f.unita.P]} ${f.parole.P[1]}: sotto ogni targhetta c'è quanto vale.`,
    dosi: [{ in: 'G', valori: [1, 2, 3] }] },

  { id: 'grandi', aiuto: 'regola', ingredienti: 3, procedimento: 3, ordine: 3, margine: 6, manca: true, etichette: ['P', 'G'],
    dritta: () => 'Stessi numeri, ma il conto adesso lo fai tu.',
    dosi: [{ in: 'G', valori: [1, 2, 3, 4, 5] }] },

  { id: 'virgola', aiuto: 'svolto', ingredienti: 3, procedimento: 3, ordine: 3, margine: 6, manca: true, etichette: ['P', 'G'],
    dritta: f => `Mezzo ${f.parole.G[0]}, un ${f.parole.G[0]} e mezzo: sotto ogni targhetta c'è quanto vale.`,
    dosi: [{ in: 'G', valori: [0.5, 1.5, 2.5, 3.5, 4.5] }] },

  { id: 'virgole', aiuto: '', ingredienti: 3, procedimento: 3, casa: true, ordine: 3, margine: 4, manca: true, etichette: ['P', 'G'],
    dritta: () => 'Adesso la virgola la sposti da solo.',
    dosi: [{ in: 'G', valori: [0.5, 1.5, 2.5, 4.5, 0.2, 0.4, 1.2, 3.6] }] },

  { id: 'media', aiuto: 'svolto', ingredienti: 3, procedimento: 4, ordine: 3, margine: 6, manca: true, etichette: ['M', 'P', 'G'],
    dritta: f => `Tanti ${f.parole.G[1]}: il mercante li vende anche a ${f.parole.M[1]}.`,
    dosi: [{ in: 'G', valori: [6, 8, 10, 12, 15, 20] }] },

  { id: 'miste', aiuto: 'regola', ingredienti: 3, procedimento: 4, ordine: 3, margine: 4, manca: true, etichette: ['M', 'P', 'G'],
    dritta: () => 'La ricetta parla in tre unità: leggi bene, e fai i conti.',
    dosi: [{ in: 'G', valori: [6, 8, 12, 15] },
           { in: 'M', valori: [0.3, 0.7, 2.5, 4, 6.5] },
           { in: 'P', valori: [0.3, 0.7, 1.2, 2.5] }] },

  { id: 'inversa', aiuto: 'svolto', ingredienti: 3, procedimento: 4, ordine: 3, margine: 5, manca: true, etichette: ['G', 'M'],
    dritta: f => `${VALE[f.unita.G] / VALE[f.unita.P] * 6} ${f.parole.P[1]} sulla ricetta, e il mercante vende a ${f.parole.G[1]}: si sale.`,
    dosi: [{ in: 'P', valori: [6, 8, 10, 12, 15, 20] }] },

  { id: 'inverse', aiuto: '', ingredienti: 3, procedimento: 5, casa: true, ordine: 3, margine: 3, manca: false, etichette: ['G', 'M', 'P'],
    dritta: () => 'Salire o scendere lo decidi tu, e quanto manca lo conti tu.',
    dosi: [{ in: 'P', valori: [6, 7, 9, 12, 18] },
           { in: 'M', valori: [2.5, 7, 15] },
           { in: 'G', valori: [0.5, 3, 12] }] },
]

// le due tappe finali: pescano da tutte e tre le famiglie, con le dosi
// dei gradini senza aiuti più (nell'ultima) quelle da magazzino
const FINALI = [
  { id: 'calderone', nome: 'Elisir del Calderone', emoji: '🔮', colore: '#8b5cc4',
    dritta: 'Pesi, lunghezze e liquidi nella stessa pozione.',
    aiuto: '', ingredienti: 4, ordine: 3, margine: 3, procedimento: 5, casa: true, manca: false, etichette: ['G', 'M', 'P'],
    da: ['grandi', 'virgole', 'miste', 'inverse'], portata: 82 },
  { id: 'maestro', nome: 'Pozione del Maestro', emoji: '🏆', colore: '#e6b53c',
    dritta: 'Dosi da magazzino, e gettoni contati.',
    aiuto: '', ingredienti: 4, ordine: 3, margine: 2, procedimento: 5, casa: true, manca: false, etichette: ['G', 'M', 'P'],
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

const comune = t => ({ aiuto: t.aiuto, ingredienti: t.ingredienti, ordine: t.ordine, procedimento: t.procedimento, casa: !!t.casa, azioni: AZIONI_DEL[t.procedimento], margine: t.margine,
                       manca: t.manca, etichette: t.etichette, gemelli: t.etichette.length > 1 })

function tappaDelGradino(f, g, n) {
  const [nome, emoji, colore] = POZIONI[f.chiave][n]
  return {
    chiave: `${f.chiave}-${g.id}`, famiglie: [f.chiave], gradino: g.id,
    nome, dritta: g.dritta(f), emoji, colore, ...comune(g),
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
    nome: t.nome, dritta: t.dritta, emoji: t.emoji, colore: t.colore, ...comune(t),
    dosi, portata: t.portata, scuola: 'conversioni',
  }
}

export const CAMPAGNA = [
  ...FAMIGLIE.flatMap(f => GRADINI.map((g, n) => tappaDelGradino(f, g, n))),
  ...FINALI.map(tappaFinale),
]

export const QUANTE_TAPPE = CAMPAGNA.length

/* Il calderone senza fondo: non è una tappa, sta in fondo alla mappa. Una pozione
   dopo l'altra sui dosaggi delle finali, che crescono; i gettoni avanzati passano
   alla pozione dopo, e si smette andando in rosso. Vedi docs/pozioni/procedimento.md. */
export const INFINITA = { chiave: 'infinita', nome: 'Il calderone senza fondo', emoji: '♾️', scorta: 6,
                          dritta: 'Una pozione dopo l\'altra, finché bastano i gettoni: quelli che avanzano passano alla prossima.' }
const TUTTE_LE_POZIONI = Object.values(POZIONI).flat()

// `n`: quante ne sono già state fatte. `pozione`: [nome, emoji, colore], per rimettere quella di una sosta
export function giroInfinito(n, pozione = null, rnd = Math.random) {
  const base = CAMPAGNA.at(n < 6 ? -2 : -1)
  const [nome, emoji, colore] = pozione || TUTTE_LE_POZIONI[Math.floor(rnd() * TUTTE_LE_POZIONI.length)]
  const procedimento = Math.min(5, 3 + Math.floor(n / 2))
  return { ...base, chiave: INFINITA.chiave, nome, emoji, colore, giro: n, margine: 0, ingredienti: n < 3 ? 3 : 4,
           procedimento, azioni: AZIONI_DEL[procedimento], casa: n % 2 === 1 }
}
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

// un ingrediente finito senza traboccare (docs/apprendimento/calibrazione.md)
export const MONETE_A_DOSE = 3
// un passo del procedimento fatto giusto al primo colpo: è una lettura, non un conto
export const MONETE_A_PASSO = 1

// Riceve da fuori chi sa dire se una dose si compone (`siCompone`, nel
// motore): il dato non importa il motore, ma il test li mette insieme.
export function guastiDellaCampagna(siCompone, campagna = CAMPAGNA) {
  const g = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} ("${t.chiave}")`
    if (viste.has(t.chiave)) g.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.dritta) g.push(`${dove}: senza nome o senza dritta`)
    if (!['gioco', 'svolto', 'regola', ''].includes(t.aiuto)) g.push(`${dove}: aiuto "${t.aiuto}" sconosciuto`)
    if (!(t.ingredienti >= 1) || !(t.ordine >= 1)) g.push(`${dove}: ingredienti o ordine a zero`)
    if (!(t.procedimento >= 1 && t.procedimento <= 5)) g.push(`${dove}: procedimento fuori misura`)
    if (!(t.margine >= 0)) g.push(`${dove}: margine sotto zero`)
    if (!(t.portata >= 0 && t.portata <= 100)) g.push(`${dove}: portata fuori scala`)
    if (i && t.portata < campagna[i - 1].portata) g.push(`${dove}: la portata scende`)
    if (!t.dosi.length) g.push(`${dove}: nessuna dose`)
    for (const d of t.dosi) if (!siCompone(d, t)) g.push(`${dove}: la dose ${d.testo} non si compone`)
    for (const f of t.famiglie)
      if (!t.dosi.some(d => d.famiglia === f)) g.push(`${dove}: la famiglia ${f} è in scena senza dosi`)
  }
  return g
}
