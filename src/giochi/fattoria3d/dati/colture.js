/* Le sedici colture: come si chiama, a che livello si semina (`liv`), quanto ci mette a maturare (`ms`) e quanto costa raccoglierle (`raccolta`,
   🪙 a campo) sono quelli della fattoria di sempre: li legge da dati/parita2d.js, mai scritti qui (docs/fattoria3d/livelli.md). Come appare nel
   campo (altezza, colori, frutto) è del disegno, scena3d/modelli.js. `pezzo` è la faccia nell'atlante della 2D (docs/fattoria3d/merci-e-ricette.md).
   Un campo ha quattro tessere ma rende un raccolto solo, come uno della 2D (docs/fattoria3d/parita/decisioni.md, D12). */
import { COLTURA, coltura2d, msDaMinuti } from './parita2d.js'

const COLTURE_GREZZE = {
  grano:     { nome: 'Grano',      emoji: '🌾', pezzo: 'raccolto_grano' },
  carota:    { nome: 'Carote',     emoji: '🥕', pezzo: 'raccolto_carote' },
  mais:      { nome: 'Mais',       emoji: '🌽', pezzo: 'raccolto_mais' },
  pomodoro:  { nome: 'Pomodori',   emoji: '🍅', pezzo: 'raccolto_pomodori' },
  patata:    { nome: 'Patate',     emoji: '🥔', pezzo: 'raccolto_patate' },
  zucca:     { nome: 'Zucche',     emoji: '🎃', pezzo: 'raccolto_zucche' },
  cavolfiore:{ nome: 'Cavolfiori', emoji: '🥦', pezzo: 'raccolto_cavolfiori' },
  cipolla:   { nome: 'Cipolle',    emoji: '🧅', pezzo: 'raccolto_cipolle' },
  aglio:     { nome: 'Aglio',      emoji: '🧄', pezzo: 'raccolto_aglio' },
  fragola:   { nome: 'Fragole',    emoji: '🍓', pezzo: 'raccolto_fragole' },
  barbabietola: { nome: 'Barbabietola', emoji: '🍠', pezzo: 'raccolto_barbabietola' },
  peperone:  { nome: 'Peperoni',   emoji: '🫑', pezzo: 'raccolto_peperoni' },
  melanzana: { nome: 'Melanzane',  emoji: '🍆', pezzo: 'raccolto_melanzane' },
  lavanda:   { nome: 'Lavanda',    emoji: '💐', pezzo: 'raccolto_lavanda' },
  riso:      { nome: 'Riso',       emoji: '🍚', pezzo: 'raccolto_riso' },
  // L'erba medica non è cibo per nessuno e non la chiede nessuno (`mangime: true`): serve solo al fienile, dove diventa foraggio. Come in 2D è la più
  // svelta (4 minuti contro i 6 delle carote), quindi sta fuori dalla regola «chi arriva dopo matura dopo» (motore/taratura.js).
  erba:      { nome: 'Erba medica', emoji: '🌿', pezzo: 'raccolto_erba', mangime: true },
}
/** Le colture 3D con i numeri della 2D: `ms` (minuti veri), `liv`, `raccolta` (🪙 per raccogliere un campo), `semina` (🪙 per seminarlo, oggi sempre 0). */
export const COLTURE = Object.fromEntries(Object.entries(COLTURE_GREZZE).map(([k, c]) => {
  const d = coltura2d(k)
  return [k, { ...c, ms: msDaMinuti(d.minuti), liv: d.liv || 1, raccolta: d.raccolta || 0, semina: d.semina || 0 }]
}))
export const CHIAVI_COLTURE = Object.keys(COLTURE)
export const TESSERE = 4          // un campo è fatto di quattro tessere; il campo intero rende un raccolto, come in 2D (motore: `raccogliTessera`)

export function guastiDelleColture() {
  const g = []
  for (const [k, c] of Object.entries(COLTURE)) {
    if (!c.nome || !c.emoji) g.push(`${k}: manca nome o emoji`)
    if (typeof c.pezzo !== 'string' || !c.pezzo) g.push(`${k}: manca il pezzo dell'atlante (la faccia)`)
    if (!(c.ms >= 60000)) g.push(`${k}: tempo sotto il minuto`)
    if (!(Number.isInteger(c.liv) && c.liv >= 1)) g.push(`${k}: manca il livello`)
    if (!COLTURA[k]) g.push(`${k}: non dice chi è nella 2D (dati/parita2d.js)`)
    if (!(c.raccolta >= 0 && c.semina >= 0)) g.push(`${k}: costo del gesto negativo`)
  }
  for (const k of Object.keys(COLTURA)) if (!COLTURE[k]) g.push(`${k}: nella tabella della 2D ma non tra le colture`)
  return g
}
