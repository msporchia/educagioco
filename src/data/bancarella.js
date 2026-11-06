/* LA BANCARELLA — i soldi e le ordinazioni: chi paga cosa, e con che resto.
   Le cucine stanno in bancarella-cucine.js. Vedi docs/bancarella/cucina.md. */

import { listinoDi } from './bancarella-cucine.js'

export const TAGLI = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]  // centesimi
export const euro = c => (c / 100).toFixed(2).replace('.', ',') + ' €'

const caso = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const scegli = a => a[Math.floor(Math.random() * a.length)]
const mescola = a => {
  const m = [...a]
  for (let i = m.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[m[i], m[j]] = [m[j], m[i]]
  }
  return m
}

export const ORDINI_PER_TAPPA = 3   // quante ordinazioni in lista a ogni giro

/* `conto`: niente · totale · resto · tutto. Con `niente` la cassa dice il resto e lo si
   compone; con `resto` si conta a mente; con `tutto` si batte anche il totale. */
export const chiedeIlTotale = c => c === 'totale' || c === 'tutto'
export const chiedeIlResto = c => c === 'resto' || c === 'tutto'

/* Quanto rende un'ordinazione, secondo `conto` (docs/apprendimento/calibrazione.md).
   Una che scade non paga niente. */
export const MONETE_CLIENTE = { niente: 2, totale: 3, resto: 3, tutto: 4 }
export const premioCliente = camp => MONETE_CLIENTE[(camp && camp.conto) || 'niente']

/* Che cosa tocca al giro `n` di un livello: il tempo si stringe da un giro all'altro. */
export function tappaDi(camp, n) {
  const [primo, ultimo] = camp.tempo
  const tempo = camp.infinita ? Math.max(ultimo, primo - n * 3)
    : Math.round(primo + (ultimo - primo) * (camp.tappe > 1 ? n / (camp.tappe - 1) : 1))
  return { n, i: n, camp, tempo, passo: camp.passo, articoli: camp.articoli, monete: camp.monete, tetto: camp.tetto, paga: camp.paga,
           conto: camp.conto, chiediTotale: chiedeIlTotale(camp.conto), chiediResto: chiedeIlResto(camp.conto) }
}

/* Che cosa si sta imparando: l'elemento non è la cifra ma il pezzo più piccolo
   che serve per comporla. */
export const FASCE = [
  { id: 'euro',      passo: 100, nome: 'euro tondi' },
  { id: 'mezzi',     passo: 50,  nome: 'mezzi euro' },
  { id: 'decine',    passo: 10,  nome: 'decine di centesimi' },
  { id: 'cinquine',  passo: 5,   nome: 'cinque centesimi' },
  { id: 'centesimi', passo: 1,   nome: 'centesimi' },
]
export const fasciaDi = cent => FASCE.find(f => cent % f.passo === 0) || FASCE[FASCE.length - 1]
export const chiaveResto = cent => 'bancarella:' + fasciaDi(cent).id

/* Con cosa si paga: come farebbe una persona. La banconota più piccola che basta, ogni tanto quella
   dopo, mai cinquanta euro per un panino; oppure due banconote, 10 € + 5 € per 12 €; oppure, se il
   conto ha i centesimi, l'euro tondo sopra il totale (5 € + 2 € + 2 € per 8,50 €). `paga` del livello
   dice fin dove si arriva. Ogni pezzo deve servire (`serveTutto`): 10 + 2 + 1 per 12 € non lo dà nessuno. */
const BANCONOTE = [500, 1000, 2000, 5000]
const SPEZZA = { 2000: [1000, 1000], 1000: [500, 500], 500: [200, 200, 100] }
const somma = pezzi => pezzi.reduce((s, v) => s + v, 0)
export const serveTutto = (pezzi, totale) => somma(pezzi) - Math.min(...pezzi) < totale
function comeSiPaga(totale, paga) {
  const tetto = Math.max(...paga)
  const buono = m => m.length > 1 && m.length <= 3 && somma(m) <= tetto && serveTutto(m, totale)
  const tasca = totale % 100 ? scomponi(Math.ceil(totale / 100) * 100, [100, 200, ...BANCONOTE]) : []
  if (buono(tasca) && Math.random() < 0.35) return tasca
  const carta = scomponi((Math.floor(totale / 500) + 1) * 500, BANCONOTE)
  if (buono(carta) && Math.random() < 0.5) return carta
  const [giusta, dopo] = BANCONOTE.filter(p => p > totale && p <= tetto)
  const nota = dopo && dopo <= totale * 4 && Math.random() < 0.25 ? dopo : giusta
  return buono(SPEZZA[nota] ?? []) && Math.random() < 0.2 ? SPEZZA[nota] : [nota]
}

/* I piatti di un'ordinazione, sotto il `tetto` del livello: si tira a sorte e si riprova
   invece di scegliere guardando quanto resta, che prenderebbe sempre i più economici. */
function piattiDi(t, piatti) {
  const quanti = Math.min(caso(t.articoli[0], t.articoli[1]), piatti.length)
  const costa = p => p.reduce((s, a) => s + a.prezzo, 0)
  for (let prova = 0; prova < 40; prova++) {
    const p = mescola(piatti).slice(0, quanti)
    if (costa(p) <= t.tetto) return p
  }
  return [...piatti].sort((a, b) => a.prezzo - b.prezzo).slice(0, quanti)
}

/* Un'ordinazione del giro: i piatti, chi paga e con che resto. */
export function nuovoOrdine(t, piatti) {
  const prezzi = listinoDi(t.camp)
  const listino = piatti.map(p => ({ emoji: p.emoji, nome: p.nome, prezzo: prezzi[p.emoji] }))
  const articoli = piattiDi(t, listino)
  const totale = articoli.reduce((s, a) => s + a.prezzo, 0)
  const pagaCon = comeSiPaga(totale, t.paga), paga = pagaCon.reduce((n, v) => n + v, 0)
  const resto = paga - totale
  // con un piatto solo il totale è già scritto sul prezzo: da battere c'è solo una somma
  return { articoli, totale, paga, resto, chiediTotale: t.chiediTotale && articoli.length > 1, chiediResto: t.chiediResto,
           pagaCon, monete: t.monete, pazienza: t.tempo + 20 * (articoli.length - 1),
           chiave: chiaveResto(resto), minimo: scomponi(resto, t.monete).length }
}

/* Il minimo di pezzi per comporre una cifra: coi tagli dell'euro il più
   grande possibile a ogni passo dà davvero il minimo. */
export function scomponi(cent, disponibili = TAGLI) {
  const out = []
  let r = cent
  for (const t of [...disponibili].sort((a, b) => b - a)) while (r >= t) { out.push(t); r -= t }
  return out
}

/* La tastiera della cassa: si scrive `4` o `4,30`, come sta scritto sul
   cartellino. Regole e non disegno: vivono qui e non nella schermata. */
export function centesimiScritti(testo) {
  const s = String(testo == null ? '' : testo).trim()
  if (!s || s === ',') return null
  const [e, c = ''] = s.split(',')
  if (c.length > 2 || !/^\d*$/.test(e) || !/^\d*$/.test(c)) return null
  return (Number(e || 0) * 100) + Number((c + '00').slice(0, 2))
}

/* quello che si può ancora scrivere: due cifre dopo la virgola, una virgola
   sola, e non si comincia con una fila di zeri */
export function scriviCifra(testo, tasto) {
  const s = String(testo || '')
  if (tasto === '⌫') return s.slice(0, -1)
  if (tasto === ',') return s.includes(',') ? s : (s || '0') + ','
  const [e, c] = s.split(',')
  if (c != null) return c.length >= 2 ? s : s + tasto
  if (e.length >= 4) return s
  return e === '0' ? tasto : s + tasto
}
