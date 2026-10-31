/* Chi chiede: il banco della bancarella e i suoi ordini (dato puro; le regole stanno in motore/ordini.js).
   Niente si vende: un ordine consegnato paga ESPERIENZA, mai monete, e mai più del tempo che costa (🪙6 al minuto). Il premio è quello della 2D
   (`premioPer` di src/giochi/fattoria3d/da2d/dati/mercato.js: 6 di base e 2 per ogni gesto, più il 20% per fase): con i tempi in minuti veri il conto
   «metà del tempo» di prima avrebbe pagato sei volte tanto una lasagna, e le consegne avrebbero mangiato la scala dei livelli.
   Non c'è un elenco di ordini: si compongono da colture e ricette vere (`livello` dice cosa si può chiedere).
   Vedi docs/fattoria3d/ordini.md. */
import { COLTURE } from './colture.js'
import { RICETTE } from './ricette.js'
import { PRODOTTI_ANIMALI, LANA, msDelProdotto } from './animali.js'
import { livelloDellaColtura, livelloDellaRicetta } from './livelli.js'
import { sullaScalaDellaDueD, RIPOSO_MIN, msDaMinuti, coltura2d } from './parita2d.js'
import { premioPer as premioPer2D, premioDelPezzo as premioDelPezzo2D } from '../da2d/dati/mercato.js'

// Il paese: chi passa al banco. Nessuno chiede una cosa sola per mestiere: il banco è per tutti.
export const CLIENTI = [
  { id: 'nonna',      nome: 'La nonna',        emoji: '👵' },
  { id: 'fornaio',    nome: 'Il fornaio',      emoji: '🥖' },
  { id: 'maestra',    nome: 'La maestra',      emoji: '🍎' },
  { id: 'cuoco',      nome: 'Il cuoco',        emoji: '👨‍🍳' },
  { id: 'postino',    nome: 'Il postino',      emoji: '📮' },
  { id: 'pescatore',  nome: 'Il pescatore',    emoji: '🎣' },
  { id: 'giardiniere', nome: 'Il giardiniere', emoji: '🌻' },
  { id: 'sindaco',    nome: 'Il sindaco',      emoji: '🎩' },
  { id: 'bidello',    nome: 'Il bidello',      emoji: '🧹' },
  { id: 'veterinaria', nome: 'La veterinaria', emoji: '🩺' },
]
export const clienteDi = id => CLIENTI.find(c => c.id === id) || CLIENTI[0]

// Gli ordini aperti insieme crescono col livello: una bacheca piena di bigliettini. [dal livello, posti]; il premio resta quello di sempre.
export const POSTI_PER_LIVELLO = [[1, 3], [5, 4], [8, 5], [11, 6], [14, 8]].map(([da, posti]) => [sullaScalaDellaDueD(da), posti])       // i livelli erano scritti sulla scala vecchia (18): stesso punto del percorso sulla scala della 2D
export const POSTI_MAX = POSTI_PER_LIVELLO[POSTI_PER_LIVELLO.length - 1][1]
/** Quanti ordini si aprono insieme a questo livello (non scende mai: il livello non scende). */
export const POSTI = livello => POSTI_PER_LIVELLO.reduce((n, [da, posti]) => (livello >= da ? posti : n), POSTI_PER_LIVELLO[0][1])
export const LIVELLO_BANCO = 2         // il livello della bacheca e della bancarella: da lì il banco chiede
export const PEZZI_DEL_BANCO = ['bacheca', 'bancarella']   // i pezzi che aprono il banco: basta averne uno in mappa (la bacheca è il pezzo vero, la bancarella resta per chi l'ha già)
export const RIPOSO_MS = msDaMinuti(RIPOSO_MIN)    // un ordine rifiutato lascia il posto vuoto per cinque minuti, come in 2D
export const CHIEDE_MAX = 3            // al più tre cose diverse in un ordine
export const QUANTI_RACCOLTI = [1, 4]  // quantità di un raccolto: da 1 a 4
export const QUANTI_PRODOTTI = [1, 2]  // quantità di un prodotto: 1 o 2

// 🪙6 = un minuto di esercizio ([calibrazione]): il cambio con cui si controlla che un ordine non renda più del tempo che costa.
export const MONETE_AL_MINUTO = 6
// (il premio non è più una frazione del tetto: è quello della 2D, e sta sempre sotto il tetto, vedi `guastiDegliOrdini`)
export const FRAZIONE_DEL_TETTO = 0.5

/** Il tempo (ms) per avere uno di questi: un raccolto matura, un prodotto è la ricetta più i suoi ingredienti. */
export function msDi(k, giri = 5) {
  if (COLTURE[k]) return COLTURE[k].ms
  if (PRODOTTI_ANIMALI[k]) return msDelProdotto(k)      // uova e latte: ingredienti, mai chiesti da soli
  if (LANA[k]) return LANA[k].ms                         // la lana: un'altra tosa (l'ingrediente del telaio, mai chiesta da sola)
  const r = RICETTE[k]
  if (!r || giri <= 0) return Infinity
  return r.ms + Object.entries(r.ing).reduce((n, [i, q]) => n + q * msDi(i, giri - 1), 0)
}
export const livelloDi = k => COLTURE[k] ? livelloDellaColtura(k) : livelloDellaRicetta(k)
export const eProdotto = k => !!RICETTE[k] && !COLTURE[k]

export const minutiDi = chiede => Object.entries(chiede).reduce((n, [k, q]) => n + q * msDi(k), 0) / 60000
/** Il tetto in esperienza di un ordine: quel che vale il tempo che costa. */
export const tettoDi = chiede => MONETE_AL_MINUTO * minutiDi(chiede)
/** Una merce 3D come la chiama la 2D: il raccolto è il prodotto del campo (`carota` → `carote`), una ricetta il suo prodotto (`foraggio_carote` → `foraggio`). */
const prodotto2D = k => COLTURE[k] ? coltura2d(k).da : ((RICETTE[k] && (RICETTE[k].premioCome || RICETTE[k].da)) || k)
/** Quanto rende un pezzo di quella merce, senza la base (la mongolfiera paga così, pezzo per pezzo): la formula della 2D. */
export const premioDelPezzo = k => premioDelPezzo2D(prodotto2D(k))
/** L'esperienza che rende un ordine: quella della 2D, sempre un intero, almeno 1. */
export const premioDi = chiede => Math.max(1, premioPer2D(Object.fromEntries(Object.entries(chiede).map(([k, n]) => [prodotto2D(k), n]))))
/** Il colore del biglietto: rosa se chiede un prodotto delle macchine, giallo se è una cosa sola (un ordine facile, il primo che
    si impara), verde se sono più raccolti. Lo usano il foglio degli ordini e i foglietti sulla bacheca in scena. */
export const tipoDelOrdine = chiede => {
  const k = Object.keys(chiede)
  return k.some(eProdotto) ? 'rosa' : k.length === 1 ? 'giallo' : 'verde'
}
/** Da che livello si può chiedere: il più alto fra le cose chieste (e almeno il banco). */
export const livelloDelOrdine = chiede => Math.max(LIVELLO_BANCO, ...Object.keys(chiede).map(livelloDi))

/** La veterinaria (C32): è l'unica che chiede il mangime, come in 2D (`vuole` di src/giochi/fattoria3d/da2d/dati/mercato.js: mangime, pastone, becchime,
    foraggio, beverone, pastura). In 3D i nomi sono quelli del cortile: il mangime del mulino, la pappa di mais, becchime e foraggio del fienile,
    verdure lesse, pastone e verdura fresca del pentolone. Gli altri clienti non li chiedono mai (`chiedibili`). */
export const VETERINARIA_VUOLE = ['mangime', 'pastone', 'becchime', 'foraggio', 'beverone', 'zuppa', 'pastura']
/** I mangimi che la veterinaria può chiedere a questo livello (solo ciò che si fa davvero). */
export const mangimiPerLaVeterinaria = livello => VETERINARIA_VUOLE.filter(k => RICETTE[k] && Number.isFinite(livelloDi(k)) && livelloDi(k) <= livello && Number.isFinite(msDi(k)))

/** Cosa si può chiedere a questo livello: { raccolti: [chiavi], prodotti: [chiavi] } (solo ciò che si fa davvero). */
export function chiedibili(livello) {
  const ok = k => Number.isFinite(livelloDi(k)) && livelloDi(k) <= livello
  /* il mangime (erba medica, becchime, foraggio: `mangime: true`) lo mangiano le bestie: lo chiede solo la veterinaria (`mangimiPerLaVeterinaria`), mai gli altri clienti né la mongolfiera */
  return { raccolti: Object.keys(COLTURE).filter(k => ok(k) && !COLTURE[k].mangime), prodotti: Object.keys(RICETTE).filter(k => ok(k) && !RICETTE[k].mangime) }
}

export function guastiDegliOrdini() {
  const g = []
  if (new Set(CLIENTI.map(c => c.id)).size !== CLIENTI.length) g.push('due clienti con lo stesso id')
  if (CLIENTI.length < 8 || CLIENTI.length > 10) g.push(`i clienti sono ${CLIENTI.length}: da 8 a 10`)
  for (const c of CLIENTI) if (!c.nome || !c.emoji) g.push(`${c.id}: manca nome o emoji`)
  if (CLIENTI.length <= POSTI_MAX) g.push('i clienti non bastano a riempire il banco')
  for (let l = 1; l <= 40; l++) if (!(POSTI(l) >= 1) || POSTI(l) < POSTI(l - 1 || 1)) g.push(`i posti al livello ${l} non crescono`)
  if (!(MONETE_AL_MINUTO === 6)) g.push('il cambio è 🪙6 al minuto (calibrazione)')
  if (!(FRAZIONE_DEL_TETTO > 0 && FRAZIONE_DEL_TETTO <= 1)) g.push('la frazione del tetto sta fra 0 e 1')
  for (const k of [...Object.keys(COLTURE), ...Object.keys(RICETTE)]) {
    if (!Number.isFinite(msDi(k)) || !Number.isFinite(livelloDi(k))) g.push(`${k}: tempo o livello non calcolabile`)
  }
  // al livello del banco si deve poter chiedere: almeno due raccolti, e nessun prodotto prima delle macchine
  const b = chiedibili(LIVELLO_BANCO)
  if (b.raccolti.length < 1) g.push(`al livello ${LIVELLO_BANCO} non c'è nessun raccolto da chiedere`)
  if (b.prodotti.length) g.push(`al livello ${LIVELLO_BANCO} si chiedono già prodotti: ${b.prodotti.join(', ')}`)
  // ogni cosa fattibile si può chiedere da sola, con premio dentro il tetto
  for (const k of [...Object.keys(COLTURE), ...Object.keys(RICETTE)]) {
    const chiede = { [k]: 1 }
    if (premioDi(chiede) > tettoDi(chiede) + 1e-9) g.push(`${k}: il premio supera il tetto`)
    if (!(premioDi(chiede) >= 1)) g.push(`${k}: il premio non è un intero positivo`)
  }
  return g
}
