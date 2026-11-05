/* LE CUCINE — gli ingredienti, le ricette, i livelli e gli attrezzi da comprare.
   Vedi docs/bancarella/cucina.md. Tutto in centesimi: sono gli euro del gioco,
   non le 🪙. Puro, gira in Node. */

/* `va`: dove si cuoce o si taglia; chi non ce l'ha va dritto sul piatto. `cuoce` e `tiene`
   sono i secondi sul fuoco e quelli prima di bruciare: a bruciare ci si deve impegnare. */
export const INGREDIENTI = {
  pasta:     { emoji: '🍝', nome: 'pasta', va: 'pentola', cuoce: 7, tiene: 45 },
  carne:     { emoji: '🥩', nome: 'carne', va: 'padella', cuoce: 5, tiene: 45 },
  uovo:      { emoji: '🥚', nome: 'uovo', va: 'padella', cuoce: 3, tiene: 45 },
  insalata:  { emoji: '🥬', nome: 'insalata', va: 'tagliere' },
  formaggio: { emoji: '🧀', nome: 'formaggio', va: 'tagliere' },
  pesce:     { emoji: '🐟', nome: 'pesce', va: 'tagliere' },
  pane:      { emoji: '🍞', nome: 'pane' },
  sugo:      { emoji: '🍅', nome: 'sugo' },
  riso:      { emoji: '🍚', nome: 'riso' },
  alga:      { emoji: '🌿', nome: 'alga' },
  impasto:   { emoji: '🫓', nome: 'impasto' },
}

/* `emoji` è la chiave del piatto, a schermo si vede la sua foto. Una ricetta può
   contenerne un'altra: il piatto è pronto, e se gli si aggiunge qualcosa cresce. */
const R = (emoji, nome, prezzo, passi, forno) => ({ emoji, nome, prezzo, banco: 'cucina', passi, ...(forno ? { forno } : {}) })
export const RICETTE = [
  R('🥖', 'bruschetta', 300, ['pane', 'sugo']),
  R('🥪', 'panino al formaggio', 350, ['pane', 'formaggio']),
  R('🍙', 'riso con l\'alga', 350, ['riso', 'alga']),
  R('🥗', 'insalata col formaggio', 400, ['insalata', 'formaggio']),
  R('🐟🥗', 'pesce con l\'insalata', 500, ['pesce', 'insalata']),
  R('🍣', 'sushi', 550, ['riso', 'pesce']),
  R('🍱', 'sushi con l\'alga', 650, ['riso', 'pesce', 'alga']),
  R('🍝', 'pasta al pomodoro', 650, ['pasta', 'sugo']),
  R('🍝🧀', 'pasta col formaggio', 750, ['pasta', 'sugo', 'formaggio']),
  R('🍝🥩', 'pasta al ragù', 850, ['pasta', 'sugo', 'carne']),
  R('🍳', 'uovo col pane', 450, ['uovo', 'pane']),
  R('🍳🧀', 'uovo col formaggio', 500, ['uovo', 'formaggio']),
  R('🍳🥗', 'uovo con l\'insalata', 550, ['uovo', 'insalata']),
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

export const CUCINA_BANCO = { nome: 'La cucina', icona: '🍝', colore: '#b5472f', tenda: '#f0a58f', legno: '#a9713c' }
const BASE = { conto: 'resto', cucina: true, tappe: ['cucina', 'cucina', 'cucina'], passo: 50, articoli: [1, 1],
               tetto: 1000, paga: [1000], copie: 0, monete: [50, 100, 200, 500], tempo: [78, 62] }
// i primi livelli sono a crudo, e con tempo da vendere: si impara a muoversi senza fretta
const CALMA = { tempo: [120, 100] }
// due piatti a cliente: il totale si batte, si paga coi 20 €
const DUE = { conto: 'tutto', articoli: [1, 2], tetto: 1900, paga: [2000], monete: [50, 100, 200, 500, 1000], tempo: [95, 75] }
const FRETTA = { ...DUE, fuocoAcceso: true }

/* `piatti`: quanti ce ne sono, e da lì tornano sporchi. Senza, la pila non finisce.
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
  L('La piastra', '🍳', 'la padella: l\'uovo col pane', ['🥪', '🥗', '🍳'], { piatti: 4 }),
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
  L('Il fuoco non si ferma', '🍳', 'i fornelli vanno anche mentre conti', ['🍝', '🥗', '🍳', '🍕'], { ...FRETTA, piatti: 5 }),
  L('L\'ora di punta', '🍝🥩', 'più carne sul fuoco', ['🍔', '🍝🥩', '🥩🥗', '🍕'], { ...FRETTA, piatti: 5 }),
  L('La sala piena', '🍔🧀', 'il formaggio dappertutto', ['🍔🧀', '🍝🧀', '🍕', '🍱', '🥗'], { ...FRETTA, piatti: 4 }),
  L('Il gran servizio', '🍕🥩', 'tutti i piatti del ricettario', RICETTE.map(r => r.emoji), { ...FRETTA, tempo: [105, 85], piatti: 4 }),
].map((c, k) => ({ ...c, id: 'cucina-' + (k + 1) }))
export const cucinaIdx = k => -2 - k
export const eCucina = i => i <= -2

/* Gli attrezzi da comprare: uno in più di ognuno, i piatti a uno a uno. `da`: il
   primo livello dove servono, prima non si vedono. */
const primoCon = t => CUCINE.findIndex(c => attrezziDi(c).includes(t))
export const ATTREZZI = [
  { che: 'tagliere', nome: 'Il secondo tagliere', emoji: '🔪', prezzo: 2500, quanti: 1, da: primoCon('tagliere') },
  { che: 'pentola', nome: 'La seconda pentola', emoji: '🍲', prezzo: 3000, quanti: 1, da: primoCon('pentola') },
  { che: 'piatti', nome: 'Un piatto in più', emoji: '🍽️', prezzo: 1500, quanti: 4, da: CUCINE.findIndex(c => c.piatti) },
  { che: 'padella', nome: 'La seconda padella', emoji: '🍳', prezzo: 4000, quanti: 1, da: primoCon('padella') },
  { che: 'forno', nome: 'Il secondo forno', emoji: '🔥', prezzo: 7000, quanti: 1, da: primoCon('forno') },
]

const intero = (n, max) => (Number.isInteger(n) && n >= 0 ? Math.min(n, max) : 0)
/* La parte del banco che riguarda la cucina: `fatte` sono i livelli vinti, gli altri quanti se ne sono comprati. */
export function cucinaPulita(s) {
  const o = s && typeof s === 'object' ? s : {}
  return { fatte: intero(o.fatte, CUCINE.length), ...Object.fromEntries(ATTREZZI.map(a => [a.che, intero(o[a.che], a.quanti)])) }
}

/* Il banco dopo l'acquisto, o `null` se non si può. */
export function compraAttrezzo(b, che) {
  const a = ATTREZZI.find(x => x.che === che)
  if (!a || b.cucina[che] >= a.quanti || a.prezzo > b.cassa || a.da > b.cucina.fatte) return null
  return { ...b, cassa: b.cassa - a.prezzo, cucina: { ...b.cucina, [che]: b.cucina[che] + 1 } }
}
