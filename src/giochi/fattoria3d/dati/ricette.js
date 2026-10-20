/* Le macchine: ogni edificio produttivo ha le sue ricette, tre posti nel forno e cuoce uno alla volta. Le ricette sono quelle
   della fattoria di sempre (src/giochi/fattoria/dati/coltivazioni.js): stesso id, stessi ingredienti, stesse quantità (N → 1);
   cambiano solo i tempi, in scala 3D (i minuti della 2D diventano secondi). Una ricetta chiede raccolti (le chiavi di COLTURE),
   prodotti di un'altra macchina (le chiavi di un'altra ricetta) oppure uova e latte (dati/animali.js): è così che nasce la
   catena (grano → farina → pane). `liv` è il livello a cui la ricetta si può fare; dati/livelli.js lo controlla contro quello
   della macchina e degli ingredienti. Gli id delle ricette sono globali: sono le chiavi di `stato.prodotti`. `pezzo` è la faccia
   nell'atlante (come in 2D), `aspetta` quella che un foglio futuro porterà (intanto vale l'emoji).
   Gli id delle macchine `pasticceria` e `conserviera` sono quelli dei salvataggi: oggi si chiamano Pastificio e Cucina, come in 2D.
   Vedi docs/fattoria3d/merci-e-ricette.md, regole.md e livelli.md. */
import { COLTURE } from './colture.js'
import { PRODOTTI_ANIMALI } from './animali.js'

export const FORNO_POSTI = 3

// Una riga per ricetta: i minuti della 2D diventano secondi (`ms`).
export const MACCHINE = {
  mulino: { posti: FORNO_POSTI, ricette: {
    farina:      { nome: 'Farina',          emoji: '🥣', pezzo: 'merce_farina',      ing: { grano: 2 },                       ms: 5000,  liv: 3 },
    pastone:     { nome: 'Pappa di mais',   emoji: '🍲', pezzo: 'merce_pastone',     ing: { mais: 3 },                        ms: 6000,  liv: 3 },
  } },
  pasticceria: { posti: FORNO_POSTI, ricette: {          // il Pastificio della 2D
    pasta:       { nome: 'Pasta',           emoji: '🍝', pezzo: 'merce_pasta',       ing: { farina: 2, uova: 1 },             ms: 7000,  liv: 6 },
    pizza:       { nome: 'Pizza',           emoji: '🍕', pezzo: 'merce_pizza',       ing: { farina: 1, salsa: 1, formaggio: 1 }, ms: 9000, liv: 12 },
    lasagne:     { nome: 'Lasagne',         emoji: '🍱', pezzo: 'merce_lasagne',     ing: { pasta: 1, salsa: 1, formaggio: 1 },  ms: 12000, liv: 12 },
  } },
  panificio: { posti: FORNO_POSTI, ricette: {
    pane:        { nome: 'Pane',            emoji: '🍞', pezzo: 'merce_pane',        ing: { farina: 2 },                      ms: 6000,  liv: 7 },
    torta:       { nome: 'Torta',           emoji: '🎂', pezzo: 'merce_torta',       ing: { farina: 2, uova: 1, burro: 1 },   ms: 8000,  liv: 11 },
    crostata:    { nome: 'Crostata di fragole', emoji: '🍰', pezzo: 'merce_crostata', ing: { farina: 1, fragola: 1, burro: 1 }, ms: 7000, liv: 11 },
  } },
  caseificio: { posti: FORNO_POSTI, ricette: {
    burro:       { nome: 'Burro',           emoji: '🧈', pezzo: 'merce_burro',       ing: { latte: 1 },                       ms: 5000,  liv: 11 },
    formaggio:   { nome: 'Formaggio',       emoji: '🧀', pezzo: 'merce_formaggio',   ing: { latte: 2 },                       ms: 10000, liv: 11 },
  } },
  conserviera: { posti: FORNO_POSTI, ricette: {          // la Cucina della 2D: dove le colture si incontrano
    salsa:       { nome: 'Salsa di pomodoro', emoji: '🥫', pezzo: 'merce_salsa',     ing: { pomodoro: 2, cipolla: 1 },        ms: 6000,  liv: 12 },
    polenta:     { nome: 'Polenta e formaggio', emoji: '🍛', pezzo: 'merce_polenta', ing: { mais: 2, formaggio: 1 },          ms: 8000,  liv: 12 },
    minestrone:  { nome: 'Minestrone',      emoji: '🍜', pezzo: 'merce_minestrone',  ing: { patata: 1, carota: 1, zucca: 1 }, ms: 6000,  liv: 12 },
    parmigiana:  { nome: 'Parmigiana di melanzane', emoji: '🥘', aspetta: 'merce_parmigiana', ing: { melanzana: 2, salsa: 1, formaggio: 1 }, ms: 9000, liv: 13 },
  } },
  gelateria: { posti: FORNO_POSTI, ricette: {
    frullato:    { nome: 'Frullato',        emoji: '🥤', pezzo: 'merce_frullato',    ing: { fragola: 2, latte: 1 },           ms: 5000,  liv: 14 },
    gelato:      { nome: 'Gelato',          emoji: '🍨', pezzo: 'merce_gelato',      ing: { latte: 2, fragola: 1 },           ms: 8000,  liv: 14 },
  } },
}
export const TIPI_DI_MACCHINA = Object.keys(MACCHINE)

// Tutte le ricette in un elenco solo, con la macchina in `dove`: id → { …ricetta, dove }
export const RICETTE = {}
for (const [dove, m] of Object.entries(MACCHINE)) for (const [id, r] of Object.entries(m.ricette)) RICETTE[id] = { ...r, dove }

export const macchinaDi = ric => (RICETTE[ric] || {}).dove || null
/** Gli id di prima della 2D (stato v6): ogni vecchio prodotto vale il suo cugino di mestiere, un pezzo per un pezzo. Chi legge un
    salvataggio, un ordine o un baratto passa da `nuovoId`; gli id di oggi non cambiano. Vedi docs/fattoria3d/merci-e-ricette.md. */
export const MERCI_VECCHIE = {
  farinaMais: 'pastone', popcorn: 'pastone',
  panIntegrale: 'pane', focaccia: 'pane', grissini: 'pane',
  tortaCarote: 'torta', tortaZucca: 'torta', tortaSoffice: 'torta', brioche: 'torta',
  frittata: 'pasta', passata: 'salsa', cipolleSottOlio: 'salsa', caponata: 'parmigiana', marmellata: 'crostata',
  gelatoFragola: 'gelato', gelatoCarota: 'gelato', gelatoLavanda: 'gelato', gelatoCrema: 'gelato', yogurt: 'frullato',
}
export const nuovoId = k => (typeof k === 'string' && Object.prototype.hasOwnProperty.call(MERCI_VECCHIE, k)) ? MERCI_VECCHIE[k] : k

/** Una merce qualunque (raccolto, prodotto di una macchina, uova o latte) o null: ha `nome`, `emoji` e `pezzo` (o `aspetta`). */
export const merceDi = k => COLTURE[k] || RICETTE[k] || PRODOTTI_ANIMALI[k] || null
/** L'emoji di una cosa che sta nella scorta, per i testi (la faccia disegnata è `viste/Faccia.vue`). */
export const emojiDi = k => (merceDi(k) || {}).emoji || '❔'
/** Il pezzo dell'atlante che disegna la merce, o null se aspetta il suo foglio (allora vale l'emoji). */
export const pezzoDi = k => (merceDi(k) || {}).pezzo || null

export function guastiDelleRicette(colture, edifici) {
  const g = []
  const quante = Object.values(MACCHINE).reduce((n, m) => n + Object.keys(m.ricette).length, 0)
  if (quante !== Object.keys(RICETTE).length) g.push('due ricette con lo stesso id in macchine diverse')
  for (const [k, r] of Object.entries(RICETTE)) {
    if (colture[k]) g.push(`${k}: una ricetta con l'id di una coltura`)
    if (PRODOTTI_ANIMALI[k]) g.push(`${k}: una ricetta con l'id di un prodotto delle bestie`)
    if (!r.nome || !r.emoji) g.push(`${k}: manca nome o emoji`)
    if (!r.pezzo && !r.aspetta) g.push(`${k}: senza pezzo e senza dire quale aspetta: un'emoji per sempre`)
    if (r.pezzo && r.aspetta) g.push(`${k}: ha il pezzo e aspetta ancora: togli «aspetta»`)
    if (!(r.ms >= 1000)) g.push(`${k}: tempo sotto il secondo`)
    if (!(Number.isInteger(r.liv) && r.liv >= 1)) g.push(`${k}: manca il livello`)
    const ing = Object.entries(r.ing)
    if (!ing.length) g.push(`${k}: senza ingredienti`)
    for (const [i, n] of ing) {
      if (!colture[i] && !RICETTE[i] && !PRODOTTI_ANIMALI[i]) g.push(`${k}: ingrediente ${i} sconosciuto`)
      if (i === k) g.push(`${k}: è ingrediente di sé stessa`)
      if (!(n >= 1)) g.push(`${k}: quantità di ${i} impossibile`)
    }
  }
  // in un testo «manca 🌾 2» deve dire una cosa sola: nessuna emoji di ripiego è di due merci
  const viste = new Map()
  for (const [k, m] of [...Object.entries(colture), ...Object.entries(PRODOTTI_ANIMALI), ...Object.entries(RICETTE)]) {
    if (viste.has(m.emoji)) g.push(`${k} e ${viste.get(m.emoji)}: la stessa emoji ${m.emoji}`)
    viste.set(m.emoji, k)
  }
  for (const [vecchio, nuovo] of Object.entries(MERCI_VECCHIE)) {
    if (RICETTE[vecchio] || colture[vecchio] || PRODOTTI_ANIMALI[vecchio]) g.push(`${vecchio}: un vecchio id che è anche una merce di oggi`)
    if (!RICETTE[nuovo]) g.push(`${vecchio}: diventa ${nuovo}, che non è una ricetta`)
  }
  for (const [t, m] of Object.entries(MACCHINE)) {
    if (edifici && !edifici[t]) g.push(`${t}: macchina senza edificio`)
    if (!(m.posti >= 1)) g.push(`${t}: nessun posto nel forno`)
    if (!Object.keys(m.ricette).length) g.push(`${t}: nessuna ricetta`)
  }
  return g
}
