/* LA CUCINA — prova: le stazioni, gli ingredienti, le ricette, poi la cassa di
   sempre. Vedi docs/bancarella/cucina.md. Puro, gira in Node. */

/* `va`: dove si cuoce o si taglia; chi non ce l'ha va dritto sul piatto.
   `cuoce` e `tiene` sono i secondi sul fuoco e quelli prima di bruciare. */
export const INGREDIENTI = {
  pasta:     { emoji: '🍝', nome: 'pasta', va: 'pentola', cuoce: 7, tiene: 6 },
  carne:     { emoji: '🥩', nome: 'carne', va: 'padella', cuoce: 5, tiene: 5 },
  uovo:      { emoji: '🥚', nome: 'uovo', va: 'padella', cuoce: 3, tiene: 4 },
  insalata:  { emoji: '🥬', nome: 'insalata', va: 'tagliere' },
  pane:      { emoji: '🍞', nome: 'pane' },
  formaggio: { emoji: '🧀', nome: 'formaggio' },
  sugo:      { emoji: '🍅', nome: 'sugo' },
  impasto:   { emoji: '🫓', nome: 'impasto' },
}
export const COLPI = 3                 // i tocchi per tagliare
const PIZZA = { cuoce: 8, tiene: 7 }   // nel forno

/* I passi sono in ordine: il piatto si riempie così. */
export const RICETTE = [
  { emoji: '🍝', nome: 'pasta al pomodoro', prezzo: 650, banco: 'cucina', passi: ['pasta', 'sugo'] },
  { emoji: '🥪', nome: 'panino al formaggio', prezzo: 350, banco: 'cucina', passi: ['pane', 'formaggio'] },
  { emoji: '🥗', nome: 'insalata', prezzo: 400, banco: 'cucina', passi: ['insalata', 'formaggio'] },
  { emoji: '🍔', nome: 'hamburger', prezzo: 750, banco: 'cucina', passi: ['pane', 'carne', 'insalata'] },
  { emoji: '🍳', nome: 'uovo col pane', prezzo: 450, banco: 'cucina', passi: ['uovo', 'pane'] },
  { emoji: '🍕', nome: 'pizza', prezzo: 800, banco: 'cucina', passi: ['impasto', 'sugo', 'formaggio'], forno: true },
]
export const ricetteDi = emoji => RICETTE.filter(r => emoji.includes(r.emoji))

const libera = () => ({ fase: 'vuota', t: 0, cosa: '', colpi: 0 })

/* `camp` è una delle cucine di data/bancarella.js. */
export function cucinaNuova(camp) {
  return {
    stazioni: Object.fromEntries((camp?.stazioni || ['pentola']).map(s => [s, libera()])),
    piatti: Array(camp?.quantiPiatti || 2).fill(null),
    ricette: ricetteDi(camp?.ricette || ['🍝', '🥪']),
  }
}

const tempiDi = s => (s.cosa === 'pizza' ? PIZZA : INGREDIENTI[s.cosa])

/* Il tempo passa solo su quello che è sul fuoco: `cuoce` → `pronta` → `scotta`. */
export function avanza(c, dt) {
  for (const s of Object.values(c.stazioni)) {
    if (s.fase !== 'cuoce' && s.fase !== 'pronta') continue
    if (!s.cosa || !tempiDi(s)?.cuoce) continue
    const { cuoce, tiene } = tempiDi(s)
    s.t += dt
    if (s.fase === 'cuoce' && s.t >= cuoce) { s.fase = 'pronta'; s.t -= cuoce }
    if (s.fase === 'pronta' && s.t >= tiene) { s.fase = 'scotta'; s.t = 0 }
  }
  return c
}

// la barra sulla stazione, da 0 a 1
export function quantoStazione(s) {
  const tempi = s.cosa ? tempiDi(s) : null
  if (!tempi?.cuoce) return s.fase === 'taglia' ? s.colpi / COLPI : 0
  return s.fase === 'cuoce' ? s.t / tempi.cuoce : s.fase === 'pronta' ? 1 - s.t / tempi.tiene : 0
}

const iniziaCon = (r, cose) => cose.every((x, i) => r.passi[i] === x)
const cercaRicetta = (c, cose) => c.ricette.find(r => r.passi.length === cose.length && iniziaCon(r, cose))

/* Il piatto `i` prende questa cosa? Un piatto vuoto, se comincia una ricetta;
   uno cominciato, se è il passo dopo. */
function accetta(c, i, cosa) {
  const p = c.piatti[i]
  if (i < 0 || i >= c.piatti.length) return false
  if (!p) return c.ricette.some(r => r.passi[0] === cosa)
  if (p.pronto || p.daInfornare) return false
  return c.ricette.some(r => iniziaCon(r, p.cose) && r.passi[p.cose.length] === cosa)
}

function posaSu(c, i, cosa) {
  if (!accetta(c, i, cosa)) return false
  const p = c.piatti[i] || (c.piatti[i] = { cose: [], pronto: '', daInfornare: false })
  p.cose.push(cosa)
  const r = cercaRicetta(c, p.cose)
  if (r && r.forno) p.daInfornare = true
  else if (r) p.pronto = r.emoji
  return true
}

/* Le mosse: ognuna è un gesto del dito, e torna `true` se è successa. Una mossa
   che non si può fare non cambia niente. */

// un ingrediente preso dalla dispensa e lasciato su una stazione (per nome) o su un piatto (per indice)
export function metti(c, cosa, dove) {
  const ing = INGREDIENTI[cosa]
  if (!ing) return false
  if (typeof dove === 'number') return !ing.va && posaSu(c, dove, cosa)
  const s = c.stazioni[dove]
  if (ing.va !== dove || !s || s.fase !== 'vuota') return false
  c.stazioni[dove] = { ...libera(), fase: dove === 'tagliere' ? 'taglia' : 'cuoce', cosa }
  return true
}

// quello che è pronto su una stazione, rovesciato sul piatto `i`
export function svuota(c, nome, i) {
  const s = c.stazioni[nome]
  if (!s || s.fase !== 'pronta') return false
  if (s.cosa === 'pizza') {
    if (c.piatti[i] || i < 0 || i >= c.piatti.length) return false
    c.piatti[i] = { cose: ['pizza'], pronto: '🍕', daInfornare: false }
  } else if (!posaSu(c, i, s.cosa)) return false
  c.stazioni[nome] = libera()
  return true
}

// una passata di coltello
export function taglia(c) {
  const s = c.stazioni.tagliere
  if (!s || s.fase !== 'taglia') return false
  if (++s.colpi >= COLPI) s.fase = 'pronta'
  return true
}

// la pizza cruda, dal piatto al forno
export function inforna(c, i) {
  const p = c.piatti[i], f = c.stazioni.forno
  if (!p || !p.daInfornare || !f || f.fase !== 'vuota') return false
  c.piatti[i] = null
  c.stazioni.forno = { ...libera(), fase: 'cuoce', cosa: 'pizza' }
  return true
}

// nel bidone: quello che è sulla stazione, o un piatto intero
export function butta(c, nome) {
  const s = c.stazioni[nome]
  if (!s || s.fase === 'vuota') return false
  c.stazioni[nome] = libera()
  return true
}
export function buttaPiatto(c, i) {
  if (!c.piatti[i]) return false
  c.piatti[i] = null
  return true
}

/* Il piatto `i` va al cliente, se è uno di quelli che vuole: libera il posto. */
export function servi(c, i, vuole) {
  const p = c.piatti[i]
  if (!p || !p.pronto || !vuole.includes(p.pronto)) return false
  c.piatti[i] = null
  return true
}

/* Gli ingredienti che servono alle ricette della cucina: la dispensa. */
export const dispensaDi = c => [...new Set(c.ricette.flatMap(r => r.passi))].filter(k => INGREDIENTI[k])
