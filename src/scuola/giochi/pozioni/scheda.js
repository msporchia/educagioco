/* Le pozioni a scuola (docs/pozioni/scuola.md): la maestra sceglie le famiglie di misure e i gradini, il bambino gioca
   quelle tappe in giro. La forma di una scheda: docs/scuola/giochi.md. Puro: le famiglie dai dati del gioco, niente store
   né three. Le chiavi dei gradini sono quelle di GRADINI (dati/campagna.js): unita/pozioni-scuola dice se cambiano */
import { FAMIGLIE, VALE } from '../../../giochi/pozioni/dati/misure.js'

export const FAMIGLIE_POZIONI = FAMIGLIE.map(f => ({
  chiave: f.chiave, nome: f.nome, icona: f.emoji, unita: `${f.unita.G}, ${f.unita.M} e ${f.unita.P}`,
}))

// i nove gradini, uguali per le tre famiglie: i nomi per una maestra, e un caso concreto (cosa chiede la ricetta, cosa vende il
// mercante, cosa fa il bambino) nelle unità della misura scelta, coi conti veri (2 m sono 200 cm, 2 kg 2000 g): il nome da solo
// non lo dice, e coi pesi soli chi accendeva le lunghezze non vedeva le sue
const num = x => String(Math.round(x * 1000) / 1000).replace('.', ',')
const art = parola => (/^[aeiou]/.test(parola) ? 'gli' : 'i')
function gradiniDi(f) {
  const { G, M, P } = f.unita, [, Gp] = f.parole.G, [, Mp] = f.parole.M, [, Pp] = f.parole.P
  const inP = n => num(n * VALE[G] / VALE[P])     // n unità grandi, nelle piccole
  return [
    { chiave: 'banco', breve: 'stessa unità', nome: 'Stessa unità', spiega: `La ricetta chiede «${inP(0.3)} ${P}», il mercante vende ampolle in ${Pp}: il bambino compra quelle che fanno ${inP(0.3)} ${P}, spendendo poco.` },
    { chiave: 'grande', breve: `${Gp} in ${Pp} col conto`, nome: `Dai ${Gp} ai ${Pp}, col conto scritto`, spiega: `La ricetta dice «2 ${G}», il mercante vende in ${Pp}; sotto ogni targhetta c'è scritto quanto vale. Il bambino compra ${inP(2)} ${P}.` },
    { chiave: 'grandi', breve: `${Gp} in ${Pp}`, nome: `Dai ${Gp} ai ${Pp}, da solo`, spiega: `La ricetta dice «4 ${G}», il listino è in ${Pp} e in ${Gp}, e nessun aiuto: il conto 4 ${G} = ${inP(4)} ${P} lo fa il bambino.` },
    { chiave: 'virgola', breve: 'la virgola col conto', nome: `${Gp.charAt(0).toUpperCase() + Gp.slice(1)} e ${Pp} insieme, col conto scritto`, spiega: `«${inP(1.5)} ${P}» è 1 ${G} e ${inP(0.5)} ${P}, «1,5 ${G}» lo stesso: sotto le targhette c'è il conto.` },
    { chiave: 'virgole', breve: 'la virgola', nome: `${Gp.charAt(0).toUpperCase() + Gp.slice(1)} e ${Pp} insieme, da solo`, spiega: `Le stesse dosi con la virgola, «2,5 ${G}» o «0,4 ${G}», e il conto lo fa il bambino.` },
    { chiave: 'media', breve: `${art(Mp)} ${Mp}`, nome: `Arrivano ${art(Mp)} ${Mp}`, spiega: `La ricetta dice «12 ${G}» e il mercante vende anche a ${Mp} (${M}): il conto è scritto.` },
    { chiave: 'miste', breve: 'tre unità', nome: 'Tre unità insieme, da solo', spiega: `Una dose in ${Gp}, una in ${Mp}, una in ${Pp}: il bambino le porta all'unità del listino da solo.` },
    { chiave: 'inversa', breve: `${Pp} in ${Gp} col conto`, nome: `Dai ${Pp} ai ${Gp}, col conto scritto`, spiega: `La ricetta dice «${inP(6)} ${P}» e il mercante vende a ${Gp}: si sale, servono 6 ${G}. Il conto è scritto.` },
    { chiave: 'inverse', breve: 'su e giù', nome: 'Su e giù, da solo', spiega: 'Ricetta e listino in unità diverse: il bambino decide se salire o scendere, e conta da solo anche quanto manca.' },
  ]
}
/** I gradini detti con le unità di una misura (`massa`, `lunghezza`, `capacita`). */
export const gradiniPer = chiave => gradiniDi(FAMIGLIE.find(f => f.chiave === chiave) || FAMIGLIE[0])
export const GRADINI_POZIONI = gradiniPer('massa')

const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)
const minuscola = s => s.charAt(0).toLowerCase() + s.slice(1)
const inFila = l => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} e ${l.at(-1)}`)
// almeno una, senza doppioni, tutte fra quelle che ci sono
const lista = (l, tutte) => Array.isArray(l) && l.length > 0 && new Set(l).size === l.length &&
  l.every(k => typeof k === 'string' && tutte.some(x => x.chiave === k))

// { tipo: 'pozioni', famiglie: [chiavi di FAMIGLIE], gradini: [chiavi di GRADINI] }; anche contro un link manomesso
function valido(e) {
  if (!oggetto(e) || !Object.keys(e).every(k => ['tipo', 'famiglie', 'gradini'].includes(k))) return false
  return e.tipo === 'pozioni' && lista(e.famiglie, FAMIGLIE_POZIONI) && lista(e.gradini, GRADINI_POZIONI)
}

// una tappa per famiglia e gradino
export const quanteTappe = e => e.famiglie.length * e.gradini.length

// «Le pozioni · i pesi e i liquidi · stessa unità e la virgola col conto · 4 tappe», nell'ordine della campagna (coi nomi brevi)
function descrivi(e) {
  if (!valido(e)) return 'Esercizio non valido'
  const scelte = (tutte, chiavi) => tutte.filter(x => chiavi.includes(x.chiave)).map(x => x.breve || minuscola(x.nome))
  const prima = FAMIGLIE_POZIONI.find(f => e.famiglie.includes(f.chiave)).chiave     // i gradini con le sue unità
  const famiglie = e.famiglie.length === FAMIGLIE_POZIONI.length ? 'pesi, lunghezze e liquidi' : inFila(scelte(FAMIGLIE_POZIONI, e.famiglie))
  const gradini = e.gradini.length === GRADINI_POZIONI.length ? 'tutti i gradini' : inFila(scelte(gradiniPer(prima), e.gradini))
  const n = quanteTappe(e)
  return `Le pozioni · ${famiglie} · ${gradini} · ${n === 1 ? '1 tappa' : `${n} tappe`}`
}

export default {
  id: 'pozioni',
  nome: 'Le pozioni',
  nei: 'nel laboratorio delle pozioni',
  spiega: 'Il bambino prepara pozioni: legge la ricetta («1,5 kg di polvere») e compra dal mercante le ampolle giuste, convertendo le misure.',
  // per la maestra che sceglie il gioco, in un testo solo: cosa allena, un esempio fra «…», come cresce (il carosello mostra questo)
  allena: 'Misure e conversioni: la ricetta chiede «2 kg di polvere», il mercante vende ampolle da 500 g e da 1000 g, e il bambino ordina quelle giuste spendendo meno possibile. Pesi, lunghezze e liquidi, dalla stessa unità alle conversioni con la virgola.',
  tred: true,
  conta: { tante: 'ingredienti', una: 'un ingrediente', giuste: 'ingredienti giusti', giusta: 'un ingrediente giusto' },
  difficolta: {
    facile: 'Più gettoni in tasca: quattro in più del solito per ogni pozione, così si può sbagliare qualche ampolla senza andare in rosso.',
    difficile: 'Gettoni contati: la metà di quelli oltre il minimo, quindi un ordine sprecato costa subito.',
  },
  // gli esercizi del catalogo no: solo il suo contenuto
  accetta: () => false,
  tipo: {
    id: 'pozioni',
    materia: 'matematica',
    voce: {
      nome: 'Le pozioni',
      icona: '⚗️',
      spiega: 'Misure e conversioni: la ricetta chiede «1500 g», il mercante vende a chili ed etti, e il bambino ordina le ampolle giuste. Si scelgono le misure e i gradini, e le loro tappe si fanno in fila.',
      base: { tipo: 'pozioni', famiglie: ['massa'], gradini: ['banco', 'grande', 'grandi'] },
    },
    valido,
    descrivi,
  },
}
