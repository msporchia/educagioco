/* LE CUCINE — gli ingredienti, le ricette e i livelli.
   Vedi docs/bancarella/cucina.md. Tutto in centesimi: sono gli euro del gioco,
   non le 🪙. Puro, gira in Node. */

/* `va`: dove si cuoce o si taglia; chi non ce l'ha va dritto sul piatto. `cuoce` e `tiene`
   sono i secondi sul fuoco e quelli prima di bruciare: a bruciare ci si deve impegnare. */
export const INGREDIENTI = {
  pasta:     { emoji: '🍝', nome: 'pasta', il: 'la pasta', va: 'pentola', cuoce: 7, tiene: 45 },
  carne:     { emoji: '🥩', nome: 'carne', il: 'la carne', va: 'padella', cuoce: 5, tiene: 45 },
  uovo:      { emoji: '🥚', nome: 'uovo', il: 'l\'uovo', va: 'padella', cuoce: 3, tiene: 45 },
  insalata:  { emoji: '🥬', nome: 'insalata', il: 'l\'insalata', va: 'tagliere' },
  formaggio: { emoji: '🧀', nome: 'formaggio', il: 'il formaggio', va: 'tagliere' },
  pesce:     { emoji: '🐟', nome: 'pesce', il: 'il pesce', va: 'tagliere' },
  pomodoro:  { emoji: '🍅', nome: 'pomodoro', il: 'il pomodoro', va: 'tagliere' },
  pane:      { emoji: '🍞', nome: 'pane', il: 'il pane' },
  sugo:      { emoji: '🥫', nome: 'sugo', il: 'il sugo' },
  riso:      { emoji: '🍚', nome: 'riso', il: 'il riso' },
  alga:      { emoji: '🌿', nome: 'alga', il: 'l\'alga' },
  impasto:   { emoji: '🫓', nome: 'impasto', il: 'l\'impasto' },
}

/* `emoji` è la chiave del piatto, a schermo si vede la sua foto. Una ricetta può
   contenerne un'altra: il piatto è pronto, e se gli si aggiunge qualcosa cresce. */
const R = (emoji, nome, prezzo, passi, forno) => ({ emoji, nome, prezzo, passi, ...(forno ? { forno } : {}) })
export const RICETTE = [
  R('🥖', 'bruschetta', 300, ['pane', 'pomodoro']),
  R('🥪', 'panino al formaggio', 350, ['pane', 'formaggio']),
  R('🍙', 'riso con l\'alga', 350, ['riso', 'alga']),
  R('🥗', 'insalata col formaggio', 400, ['insalata', 'formaggio']),
  R('🐟🥗', 'pesce con l\'insalata', 500, ['pesce', 'insalata']),
  R('🍣', 'sushi', 550, ['riso', 'pesce']),
  R('🍱', 'sushi con l\'alga', 650, ['riso', 'pesce', 'alga']),
  R('🍝', 'pasta al pomodoro', 650, ['pasta', 'sugo']),
  R('🍝🧀', 'pasta col formaggio', 750, ['pasta', 'sugo', 'formaggio']),
  R('🍝🥩', 'pasta al ragù', 850, ['pasta', 'sugo', 'carne']),
  R('🍳', 'panino con l\'uovo', 450, ['uovo', 'pane']),
  R('🍳🧀', 'frittata col formaggio', 500, ['uovo', 'formaggio']),
  R('🍳🥗', 'insalata con l\'uovo', 550, ['uovo', 'insalata']),
  R('🥪🥩', 'panino con la carne', 550, ['pane', 'carne']),
  R('🥩🥗', 'carne con l\'insalata', 600, ['carne', 'insalata']),
  R('🍔', 'hamburger', 750, ['pane', 'carne', 'insalata']),
  R('🍔🧀', 'hamburger col formaggio', 850, ['pane', 'carne', 'insalata', 'formaggio']),
  R('🍕', 'pizza', 800, ['impasto', 'sugo', 'formaggio'], true),
  R('🍕🥩', 'pizza con la carne', 950, ['impasto', 'sugo', 'formaggio', 'carne'], true),
]
export const ricetteDi = emoji => RICETTE.filter(r => emoji.includes(r.emoji))

/* Gli attrezzi di una cucina si leggono dalle ricette: nessun livello li deve elencare. */
export function attrezziDi(camp) {
  const r = ricetteDi(camp.ricette)
  const tipi = new Set(r.flatMap(x => x.passi.map(k => INGREDIENTI[k].va)).filter(Boolean))
  if (r.some(x => x.forno)) tipi.add('forno')
  return ['pentola', 'padella', 'tagliere', 'forno'].filter(t => tipi.has(t))
}

const BASE = { tappe: 3, articoli: [1, 1], tetto: 1000, tempo: [78, 62] }
// i primi livelli sono a crudo e con tempo da vendere: si impara a muoversi senza fretta (un test misura il margine)
const CALMA = { tempo: [170, 150] }
// due piatti a ordinazione: il totale da chiedere vuole una somma, e in cucina tutto doppio con due appoggi in mezzo
const DUE = { articoli: [2, 2], tetto: 1990, tempo: [95, 75], copie: { tagliere: 1, pentola: 1, padella: 1, forno: 1 }, appoggi: 2 }
// gli ultimi: le ordinazioni scadono prima. La fretta sta nel muoversi: i conti si fanno sempre da fermi
const FRETTA = { ...DUE, tempo: [80, 65] }

const PORTATA_DA = 32        // sei anni e mezzo: sotto, il gioco non si offre
const PORTATA_A = 72         // nove anni e tre quarti

/* La scala della cassa, una riga per gradino: quanti livelli, chi fa i conti (`conto`: prima li fa
   la cassa, poi il resto lo conti tu, poi anche il totale da chiedere), quanto fini sono i prezzi
   (`passo`) e fin dove arrivano le banconote. Quando entra un conto nuovo i prezzi tornano più facili. */
const SCALA_CASSA = [
  [6, 'niente', 100, [500, 1000]],
  [3, 'resto', 100, [1000]],
  [6, 'resto', 50, [1000]],
  [4, 'resto', 10, [1000, 2000]],
  [3, 'tutto', 50, [2000]],
  [3, 'tutto', 10, [2000]],
  [4, 'tutto', 5, [2000, 5000]],
]
const MONETE_DEL_PASSO = { 100: [100, 200, 500], 50: [50, 100, 200, 500], 10: [10, 20, 50, 100, 200, 500], 5: [5, 10, 20, 50, 100, 200, 500] }
const cassaDi = k => {
  let n = 0
  for (const [quanti, conto, passo, paga] of SCALA_CASSA) {
    n += quanti
    if (k >= n) continue
    const banconote = [paga.includes(2000) && 1000, paga.includes(5000) && 2000].filter(Boolean)
    return { conto, passo, paga, monete: [...MONETE_DEL_PASSO[passo], ...banconote] }
  }
  return null
}

/* Il prezzo di un piatto con quel `passo`: euro tondi all'inizio, poi quello del menù, poi coi
   centesimi. Il di più è fisso per piatto: lo stesso piatto costa sempre uguale, a parità di livello. */
const CENTESIMI = { 10: [10, 20, 30, 40], 5: [15, 25, 35, 45] }
export function prezzoDi(r, passo) {
  if (passo >= 100) return Math.max(100, Math.round(r.prezzo / 100) * 100)
  const piu = CENTESIMI[passo]
  if (!piu) return r.prezzo
  return r.prezzo + piu[[...r.emoji].reduce((s, ch) => s + ch.codePointAt(0), 0) % piu.length]
}

/* `piatti`: quanti ce ne sono, e da lì tornano sporchi. Senza, la pila non finisce.
   `copie`: gli attrezzi doppi, `appoggi`: i banconi in mezzo alla stanza.
   `foto`: il piatto che si vede nella scelta. */
const L = (nome, foto, nuovo, ricette, altro = {}) => ({ ...BASE, nome, foto, nuovo, ricette, ...altro })
export const CUCINE = [
  L('Il banco dei panini', '🥪', 'si prende, si taglia, si consegna', ['🥖', '🥪'], CALMA),
  L('L\'orto in tavola', '🥗', 'l\'insalata', ['🥪', '🥗'], CALMA),
  L('Il sushi', '🍣', 'il riso col pesce tagliato', ['🍣', '🍙', '🥖'], CALMA),
  L('Il banco del pesce', '🐟🥗', 'il pesce con l\'insalata', ['🍣', '🐟🥗', '🥗'], CALMA),
  L('Il sushi con l\'alga', '🍱', 'tre cose sullo stesso piatto', ['🍱', '🍣', '🍙'], CALMA),
  L('Il lavello', '🍣', 'i piatti tornano sporchi: vanno lavati', ['🥪', '🥗', '🍣'], { ...CALMA, piatti: 4 }),
  L('La trattoria', '🍝', 'la pentola: la pasta si cuoce', ['🍝', '🥪', '🥖'], { piatti: 4 }),
  L('Formaggio per tutti', '🍝🧀', 'la pasta col formaggio', ['🍝', '🥗', '🍝🧀'], { piatti: 4 }),
  L('La piastra', '🍳', 'la padella: il panino con l\'uovo', ['🥪', '🥗', '🍳'], { piatti: 4 }),
  L('Il panino caldo', '🥪🥩', 'il panino con la carne', ['🍝', '🍳', '🥪🥩'], { piatti: 4 }),
  L('La colazione', '🍳🧀', 'l\'uovo in tre modi', ['🍳', '🍳🧀', '🍳🥗'], { piatti: 4 }),
  L('L\'hamburger', '🍔', 'tre cose da mettere insieme', ['🥪🥩', '🍔', '🥗'], { piatti: 4 }),
  L('Il ragù', '🍝🥩', 'la pasta al ragù', ['🍝', '🍝🧀', '🍝🥩'], { piatti: 4 }),
  L('Il secondo', '🥩🥗', 'la carne con l\'insalata', ['🥩🥗', '🍳🥗', '🍔'], { piatti: 4 }),
  L('Doppio formaggio', '🍔🧀', 'l\'hamburger col formaggio', ['🍔🧀', '🍝🧀', '🍳🧀'], { piatti: 4 }),
  L('La pizzeria', '🍕', 'il forno: la pizza va infornata', ['🍕', '🥗'], { piatti: 4 }),
  L('Pizza e pasta', '🍝🧀', 'due cose lunghe insieme', ['🍕', '🍝', '🍝🧀'], { piatti: 4 }),
  L('Pizza e panini', '🍔', 'tutti i fuochi accesi', ['🍕', '🍔', '🥪'], { piatti: 4 }),
  L('La pizza con la carne', '🍕🥩', 'la padella prima del forno', ['🍕🥩', '🍕', '🥩🥗'], { piatti: 4 }),
  L('Due per volta', '🍝', 'due piatti a ordine, il totale lo batti tu', ['🍝', '🥪', '🥗', '🍳'], { ...DUE, piatti: 5 }),
  L('La tavolata', '🍔', 'due piatti, più carne', ['🍔', '🥪🥩', '🥗', '🍳🥗'], { ...DUE, piatti: 5 }),
  L('Il pranzo della domenica', '🍕', 'due piatti, col forno', ['🍕', '🍝', '🥗', '🍔'], { ...DUE, piatti: 5 }),
  L('Mare e terra', '🍱', 'il sushi coi fuochi accesi', ['🍱', '🍝', '🐟🥗', '🍔'], { ...DUE, piatti: 5 }),
  L('Meno piatti', '🍝🧀', 'ne hai uno di meno', ['🍕', '🍝🧀', '🍔', '🍳🥗'], { ...DUE, piatti: 4 }),
  L('Il servizio veloce', '🍳', 'le ordinazioni scadono prima', ['🍝', '🥗', '🍳', '🍕'], { ...FRETTA, piatti: 5 }),
  L('L\'ora di punta', '🍝🥩', 'più carne sul fuoco', ['🍔', '🍝🥩', '🥩🥗', '🍕'], { ...FRETTA, piatti: 5 }),
  L('La sala piena', '🍔🧀', 'il formaggio dappertutto', ['🍔🧀', '🍝🧀', '🍕', '🍱', '🥗'], { ...FRETTA, piatti: 5 }),
  L('Il gran servizio', '🍕🥩', 'tutti i piatti', RICETTE.map(r => r.emoji), { ...FRETTA, tempo: [90, 75], piatti: 5 }),
  // l'ultima è a tempo: `durata` in secondi, niente cuori, e conta il record (`senzaFine` in data/giochi.js)
  L('Cinque minuti', '🍕🥩', 'quante ordinazioni servi in cinque minuti?', RICETTE.map(r => r.emoji), { ...FRETTA, infinita: true, tappe: Infinity, tempo: [100, 60], piatti: 5, durata: 300 }),
].map((c, k, tutte) => ({ ...c, ...cassaDi(k), id: 'cucina-' + (k + 1), scuola: 'numeri',
                         portata: Math.round(PORTATA_DA + k / (tutte.length - 1) * (PORTATA_A - PORTATA_DA)) }))

/* I secondi che restano, come si leggono: 4:05. */
export function orologio(secondi) {
  const s = Math.max(0, Math.ceil(secondi))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/* la fila che `data/portata.js` si aspetta di ricevere */
export const FILA = CUCINE.map(c => ({ campagna: c.id, portata: c.portata, scuola: c.scuola }))

const intero = (n, max) => (Number.isInteger(n) && n >= 0 ? Math.min(n, max) : 0)
/* La parte del banco che riguarda la cucina: `fatte` sono i livelli vinti. */
export function cucinaPulita(s) {
  const o = s && typeof s === 'object' ? s : {}
  return { fatte: intero(o.fatte, CUCINE.length) }
}

/* Il banco salvato, messo a posto: l'incasso resta, chi giocava prima lo ritrova in cassa. */
export function bancoPulito(salvato, incassato = 0) {
  const s = salvato && typeof salvato === 'object' ? salvato : null
  return { cassa: s && Number.isInteger(s.cassa) && s.cassa >= 0 ? s.cassa : Math.max(0, Math.round(incassato) || 0),
           cucina: cucinaPulita(s && s.cucina) }
}
