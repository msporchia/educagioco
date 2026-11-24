// La cucina a scuola (docs/bancarella/scuola.md): la maestra sceglie da quale a quale livello, il bambino li gioca in fila.
// La forma di una scheda e del suo `tipo`: docs/scuola/giochi.md. Puro: i dati delle cucine, niente store né three.
import { CUCINE } from '../../../data/bancarella-cucine.js'

// chi fa i conti alla cassa, e quanto sono fini i prezzi: come in docs/bancarella/cucina.md («I livelli»)
const CONTI = {
  niente: { nome: 'La cassa dice il resto', breve: 'il resto lo dice la cassa' },
  resto: { nome: 'Il resto lo conti tu', breve: 'il resto lo conti tu' },
  tutto: { nome: 'Totale e resto li conti tu', breve: 'totale e resto li conti tu' },
}
const PREZZI = { 100: 'euro tondi', 50: 'mezzi euro', 10: 'con i centesimi' }

// i livelli da scegliere (Cinque minuti no: è a tempo e conta il record), numerati da 1
export const LIVELLI_CUCINA = CUCINE.filter(c => !c.durata).map((c, k) => ({
  n: k + 1, nome: c.nome, nuovo: c.nuovo, conto: c.conto, prezzi: PREZZI[c.passo],
}))

// i tratti della cassa: livelli di fila con gli stessi conti e gli stessi prezzi, le scelte svelte dell'editor
export const TRATTI_CUCINA = LIVELLI_CUCINA.reduce((tratti, l) => {
  const ultimo = tratti.at(-1)
  if (ultimo && ultimo.conto === l.conto && ultimo.prezzi === l.prezzi) ultimo.a = l.n
  else tratti.push({ da: l.n, a: l.n, conto: l.conto, prezzi: l.prezzi, nome: `${CONTI[l.conto].nome} · ${l.prezzi}` })
  return tratti
}, [])

const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)

// { tipo: 'cucina', da, a }: numeri di livello da 1, da ≤ a, senza chiavi in più (anche contro un link manomesso)
function valido(e) {
  if (!oggetto(e) || e.tipo !== 'cucina') return false
  if (!Object.keys(e).every(k => ['tipo', 'da', 'a'].includes(k))) return false
  return Number.isInteger(e.da) && Number.isInteger(e.a) && e.da >= 1 && e.a <= LIVELLI_CUCINA.length && e.da <= e.a
}

// chi fa i conti nei livelli scelti, in ordine: «il resto lo dice la cassa, poi il resto lo conti tu»
export function contiDi(e) {
  const conti = [...new Set(LIVELLI_CUCINA.slice(e.da - 1, e.a).map(l => l.conto))]
  return conti.map(c => CONTI[c].breve).join(', poi ')
}

// «La cucina · livelli 7-12 · il resto lo conti tu», «La cucina · livello 7 · il resto lo conti tu»
function descrivi(e) {
  if (!valido(e)) return 'Esercizio non valido'
  const quali = e.da === e.a ? `livello ${e.da}` : `livelli ${e.da}-${e.a}`
  return `La cucina · ${quali} · ${contiDi(e)}`
}

export default {
  id: 'cucina',
  nome: 'La cucina',
  nei: 'in cucina',
  spiega: 'Il bambino fa il cuoco: prepara le ordinazioni e alla cassa dà il resto ai clienti, prima aiutato e poi da solo.',
  // l'esercizio concreto, per la maestra che sceglie il gioco: lo mostra per primo, prima di com'è il gioco (`spiega`)
  allena: 'Il resto alla cassa: un conto di «8,50 €» pagato con 5 € + 2 € + 2 €, e il bambino dà 50 centesimi toccando le monete. Nei primi livelli il resto lo dice la cassa ed è in euro tondi; poi lo conta il bambino, i prezzi passano al mezzo euro e ai dieci centesimi, e più avanti anche il totale da chiedere lo batte lui (una somma). Intanto in cucina prepara le ordinazioni.',
  tred: true,
  conta: { tante: 'resti', una: 'un resto', giuste: 'resti giusti', giusta: 'un resto giusto' },
  difficolta: {
    facile: 'Cinque cuori invece di tre, e i clienti aspettano la metà in più: più tempo per cucinare.',
    difficile: 'Due cuori invece di tre, e i clienti aspettano un quarto in meno: bisogna essere svelti.',
  },
  // gli esercizi del catalogo no: solo il suo contenuto
  accetta: () => false,
  tipo: {
    id: 'cucina',
    materia: 'matematica',
    voce: {
      nome: 'La cucina',
      icona: '🍳',
      spiega: 'Uno svago coi soldi: si cucinano le ordinazioni e si dà il resto. Nei primi livelli il resto lo dice la cassa, poi lo conta il bambino. Si sceglie da quale a quale livello; finiti, si ricomincia.',
      base: { tipo: 'cucina', da: 1, a: 6 },
    },
    valido,
    descrivi,
  },
}
