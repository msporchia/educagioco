/* Le macchine: ogni edificio produttivo ha le sue ricette, tre posti nel forno e cuoce uno alla volta. Una ricetta chiede
   raccolti (le chiavi di COLTURE), prodotti di un'altra macchina (le chiavi di un'altra ricetta) oppure uova e latte (dati/animali.js): è così che nasce la
   catena (grano → farina → pane integrale). `liv` è il livello a cui la ricetta si può fare; dati/livelli.js lo controlla
   contro quello della macchina e degli ingredienti. Gli id delle ricette sono globali: sono le chiavi di `stato.prodotti`.
   Vedi docs/fattoria3d/regole.md e livelli.md. */
import { PRODOTTI_ANIMALI } from './animali.js'

export const FORNO_POSTI = 3

export const MACCHINE = {
  pasticceria: { posti: FORNO_POSTI, ricette: {
    pane:        { nome: 'Pane',            emoji: '🍞', ing: { grano: 2 },                ms: 6000,  liv: 5 },
    popcorn:     { nome: 'Popcorn',         emoji: '🍿', ing: { mais: 2 },                 ms: 8000,  liv: 5 },
    pizza:       { nome: 'Pizza',           emoji: '🍕', ing: { pomodoro: 2, grano: 1 },   ms: 12000, liv: 6 },
    tortaCarote: { nome: 'Torta di carote', emoji: '🍰', ing: { carota: 2, grano: 1 },     ms: 10000, liv: 8 },
    tortaZucca:  { nome: 'Torta di zucca',  emoji: '🥧', ing: { zucca: 2, grano: 1 },      ms: 14000, liv: 8 },
    tortaSoffice: { nome: 'Torta soffice',  emoji: '🎂', ing: { uova: 2, farina: 1 },       ms: 12000, liv: 6 },
    frittata:    { nome: 'Frittata',        emoji: '🍳', ing: { uova: 2, cipolla: 1 },      ms: 10000, liv: 9 },
  } },
  mulino: { posti: FORNO_POSTI, ricette: {
    farina:      { nome: 'Farina',          emoji: '🥣', ing: { grano: 2 },                ms: 5000,  liv: 3 },
    farinaMais:  { nome: 'Farina di mais',  emoji: '🌽', ing: { mais: 2 },                 ms: 6000,  liv: 3 },
  } },
  panificio: { posti: FORNO_POSTI, ricette: {
    panIntegrale: { nome: 'Pane integrale', emoji: '🥖', ing: { farina: 2 },               ms: 8000,  liv: 7 },
    focaccia:    { nome: 'Focaccia',        emoji: '🫓', ing: { farina: 2, patata: 1 },     ms: 10000, liv: 7 },
    grissini:    { nome: 'Grissini',        emoji: '🥨', ing: { farinaMais: 2 },            ms: 9000,  liv: 7 },
    brioche:     { nome: 'Brioche',         emoji: '🥐', ing: { farina: 2, uova: 1, latte: 1 }, ms: 12000, liv: 9 },
  } },
  conserviera: { posti: FORNO_POSTI, ricette: {
    passata:     { nome: 'Passata',         emoji: '🥫', ing: { pomodoro: 3 },              ms: 10000, liv: 12 },
    marmellata:  { nome: 'Marmellata',      emoji: '🍯', ing: { fragola: 3 },               ms: 12000, liv: 12 },
    cipolleSottOlio: { nome: 'Cipolle sott\'olio', emoji: '🫙', ing: { cipolla: 3 },        ms: 12000, liv: 12 },
    caponata:    { nome: 'Caponata',        emoji: '🍲', ing: { melanzana: 2, cipolla: 1 }, ms: 14000, liv: 13 },
  } },
  gelateria: { posti: FORNO_POSTI, ricette: {
    gelatoFragola: { nome: 'Gelato alla fragola', emoji: '🍨', ing: { fragola: 2 },         ms: 12000, liv: 14 },
    gelatoCarota:  { nome: 'Gelato di carote',    emoji: '🍦', ing: { carota: 2, grano: 1 }, ms: 12000, liv: 14 },
    gelatoLavanda: { nome: 'Gelato alla lavanda', emoji: '💜', ing: { lavanda: 2 },         ms: 14000, liv: 15 },
    gelatoCrema:   { nome: 'Gelato alla crema',   emoji: '🍧', ing: { latte: 2, uova: 1 },    ms: 14000, liv: 14 },
  } },
  caseificio: { posti: FORNO_POSTI, ricette: {
    formaggio:   { nome: 'Formaggio',       emoji: '🧀', ing: { latte: 2 },                 ms: 14000, liv: 11 },
    burro:       { nome: 'Burro',           emoji: '🧈', ing: { latte: 2 },                 ms: 10000, liv: 11 },
    yogurt:      { nome: 'Yogurt alla fragola', emoji: '🥣', ing: { latte: 1, fragola: 1 }, ms: 12000, liv: 11 },
  } },
}
export const TIPI_DI_MACCHINA = Object.keys(MACCHINE)

// Tutte le ricette in un elenco solo, con la macchina in `dove`: id → { …ricetta, dove }
export const RICETTE = {}
for (const [dove, m] of Object.entries(MACCHINE)) for (const [id, r] of Object.entries(m.ricette)) RICETTE[id] = { ...r, dove }

export const macchinaDi = ric => (RICETTE[ric] || {}).dove || null
/** L'emoji di una cosa che sta nella scorta: un raccolto, un prodotto di una macchina o delle bestie (per i dischi degli ingredienti). */
export const emojiDi = (k, colture) => (colture[k] || RICETTE[k] || PRODOTTI_ANIMALI[k] || {}).emoji || '❔'

export function guastiDelleRicette(colture, edifici) {
  const g = []
  const quante = Object.values(MACCHINE).reduce((n, m) => n + Object.keys(m.ricette).length, 0)
  if (quante !== Object.keys(RICETTE).length) g.push('due ricette con lo stesso id in macchine diverse')
  for (const [k, r] of Object.entries(RICETTE)) {
    if (colture[k]) g.push(`${k}: una ricetta con l'id di una coltura`)
    if (PRODOTTI_ANIMALI[k]) g.push(`${k}: una ricetta con l'id di un prodotto delle bestie`)
    if (!r.nome || !r.emoji) g.push(`${k}: manca nome o emoji`)
    if (!(r.ms >= 1000)) g.push(`${k}: tempo sotto il secondo`)
    if (!(Number.isInteger(r.liv) && r.liv >= 1)) g.push(`${k}: manca il livello`)
    const ing = Object.entries(r.ing)
    if (!ing.length) g.push(`${k}: senza ingredienti`)
    for (const [i, n] of ing) {
      if (!colture[i] && !RICETTE[i] && !PRODOTTI_ANIMALI[i]) g.push(`${k}: ingrediente ${i} sconosciuto`)
      if (RICETTE[i] && RICETTE[i].dove === r.dove) g.push(`${k}: ${i} esce dalla stessa macchina`)
      if (!(n >= 1)) g.push(`${k}: quantità di ${i} impossibile`)
    }
  }
  for (const [t, m] of Object.entries(MACCHINE)) {
    if (edifici && !edifici[t]) g.push(`${t}: macchina senza edificio`)
    if (!(m.posti >= 1)) g.push(`${t}: nessun posto nel forno`)
    if (!Object.keys(m.ricette).length) g.push(`${t}: nessuna ricetta`)
  }
  return g
}
