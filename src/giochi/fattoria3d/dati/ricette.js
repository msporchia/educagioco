/* Le macchine: ogni edificio produttivo ha le sue ricette, un posto di partenza (gli altri si comprano fino a sei: dati/posti.js) e lavora uno alla volta. Le ricette sono quelle
   della fattoria di sempre (src/giochi/fattoria/dati/coltivazioni.js): stesso id, stessi ingredienti, stesse quantità (N → 1), e dal giro G3
   anche gli stessi tempi (minuti veri), lo stesso livello e lo stesso costo del gesto: `...N('id')` li legge da dati/parita2d.js. Una ricetta chiede raccolti (le chiavi di COLTURE),
   prodotti di un'altra macchina (le chiavi di un'altra ricetta) oppure uova e latte (dati/animali.js): è così che nasce la
   catena (grano → farina → pane). `liv` è il livello a cui la ricetta si può fare; dati/livelli.js lo controlla contro quello
   della macchina e degli ingredienti. Gli id delle ricette sono globali: sono le chiavi di `stato.prodotti`. `pezzo` è la faccia
   nell'atlante (come in 2D), `aspetta` quella che un foglio futuro porterà (intanto vale l'emoji).
   La lana (LANA, dati/animali.js) è l'ingrediente del telaio e della sartoria: sta nel contatore `stato.lana`, non in `stato.prodotti`.
   Gli id delle macchine `pasticceria` e `conserviera` sono quelli dei salvataggi: oggi si chiamano Pastificio e Cucina, come in 2D.
   Vedi docs/fattoria3d/merci-e-ricette.md, regole.md e livelli.md. */
import { COLTURE } from './colture.js'
import { numeriRicetta as N } from './parita2d.js'
import { PRODOTTI_ANIMALI, LANA } from './animali.js'
import { RICETTE_FIENILE, RICETTE_PENTOLONE, MANGIMI_SENZA_RICETTA } from './mangime.js'
import { RICETTA_MERENDA, RICETTA_CARAMELLE } from './cortile2.js'
import { RICETTE_PANCETTA as P } from './pancetta.js'

import { POSTI_DI_PARTENZA } from './posti.js'

/** I posti con cui ogni macchina parte: uno (gli altri si comprano fino a sei: dati/posti.js). */
export const FORNO_POSTI = POSTI_DI_PARTENZA

/** Come si chiama, per ogni macchina, il posto dove lavora (la sezione dei posti nel foglio): non tutte hanno un forno. `dentro` è la scritta
    della sezione, `pronto` quella dei pronti. Vedi docs/fattoria3d/merci-e-ricette.md. */
export const LAVORAZIONE = {
  fienile:       { dentro: 'Nel fienile' },
  mulino:        { dentro: 'Alla macina' },
  pasticceria:   { dentro: 'Nel forno' },            // il Pastificio: biscotti, pizza e lasagne al forno
  panificio:     { dentro: 'Nel forno' },
  caseificio:    { dentro: 'Nel paiolo' },
  conserviera:   { dentro: 'Sul fuoco' },
  gelateria:     { dentro: 'Nella gelatiera' },
  telaio:        { dentro: 'Al telaio' },
  zuccherificio: { dentro: 'Nella caldaia' },
  sartoria:      { dentro: 'In sartoria' },
  tintoria:      { dentro: 'Nella tinozza' },
  friggitoria:   { dentro: 'Nella friggitrice' },
  sushi_bar:     { dentro: 'Al banco del sushi' },
  pentolone:     { dentro: 'Nel pentolone' },
}
export const PRONTO_DA_RITIRARE = 'Pronto da ritirare'
/** La scritta della sezione dei posti di una macchina (mai «forno» se non è un forno). */
export const dentroDi = tipo => (LAVORAZIONE[tipo] || {}).dentro || 'Al lavoro'

// Una riga per ricetta; `ms`, `liv` e `costo` sono della 2D (`N`).
export const MACCHINE = {
  fienile: { posti: FORNO_POSTI, ricette: RICETTE_FIENILE },   // il mangime delle bestie: le tre ricette stanno in dati/mangime.js, perché animali.js ne conta il tempo
  mulino: { posti: FORNO_POSTI, ricette: {
    mangime:     { nome: 'Mangime',         emoji: '🐕', pezzo: 'merce_mangime',     mangime: true, ing: { grano: 2 }, ...N('mangime') },     // il cibo di cane e gatto (la 2D lo fa al livello del mulino): i compagni 3D non mangiano ancora (G6), ma il mulino ha subito un lavoro
    farina:      { nome: 'Farina',          emoji: '🥣', pezzo: 'merce_farina',      ing: { grano: 2 }, ...N('farina') },
    pastone:     { nome: 'Pappa di mais',   emoji: '🍲', pezzo: 'merce_pastone',     ing: { mais: 3 }, ...N('pastone') },
  } },
  pasticceria: { posti: FORNO_POSTI, ricette: {          // il Pastificio della 2D
    pasta:       { nome: 'Pasta',           emoji: '🍝', pezzo: 'merce_pasta',       ing: { farina: 2, uova: 1 }, ...N('pasta') },
    biscotti:    { nome: 'Biscotti',        emoji: '🍪', pezzo: 'merce_biscotti',    ing: { farina: 1, burro: 1, zucchero: 1 }, ...N('biscotti') },
    pizza:       { nome: 'Pizza',           emoji: '🍕', pezzo: 'merce_pizza',       ing: { farina: 1, salsa: 1, formaggio: 1 }, ...N('pizza') },
    lasagne:     { nome: 'Lasagne',         emoji: '🍱', pezzo: 'merce_lasagne',     ing: { pasta: 1, salsa: 1, formaggio: 1 }, ...N('lasagne') },
    ravioli_pancetta: P.ravioli_pancetta,                              // solo 3D (dati/pancetta.js)
  } },
  panificio: { posti: FORNO_POSTI, ricette: {
    pane:        { nome: 'Pane',            emoji: '🍞', pezzo: 'merce_pane',        ing: { farina: 2 }, ...N('pane') },
    torta:       { nome: 'Torta',           emoji: '🎂', pezzo: 'merce_torta',       ing: { farina: 2, uova: 1, burro: 1 }, ...N('torta') },
    crostata:    { nome: 'Crostata di fragole', emoji: '🍰', pezzo: 'merce_crostata', ing: { farina: 1, fragola: 1, burro: 1 }, ...N('crostata') },
    merenda:     RICETTA_MERENDA,                          // le fragole al miele (giro G5: il miele è delle arnie)
    panino_pancetta: P.panino_pancetta,                    // solo 3D (dati/pancetta.js)
  } },
  caseificio: { posti: FORNO_POSTI, ricette: {
    burro:       { nome: 'Burro',           emoji: '🧈', pezzo: 'merce_burro',       ing: { latte: 1 }, ...N('burro') },
    formaggio:   { nome: 'Formaggio',       emoji: '🧀', pezzo: 'merce_formaggio',   ing: { latte: 2 }, ...N('formaggio') },
  } },
  conserviera: { posti: FORNO_POSTI, ricette: {          // la Cucina della 2D: dove le colture si incontrano
    salsa:       { nome: 'Salsa di pomodoro', emoji: '🥫', pezzo: 'merce_salsa',     ing: { pomodoro: 2, cipolla: 1, aglio: 1 }, ...N('salsa') },
    polenta:     { nome: 'Polenta e formaggio', emoji: '🍛', pezzo: 'merce_polenta', ing: { mais: 2, formaggio: 1 }, ...N('polenta') },
    minestrone:  { nome: 'Minestrone',      emoji: '🍜', pezzo: 'merce_minestrone',  ing: { patata: 1, carota: 1, cavolfiore: 1 }, ...N('minestrone') },
    conserva:    { nome: 'Conserva d\'orto', emoji: '🥗', pezzo: 'merce_conserva', ing: { melanzana: 1, peperone: 1, zucca: 1 }, ...N('conserva') },
    parmigiana:  { nome: 'Parmigiana di melanzane', emoji: '🥘', aspetta: 'merce_parmigiana', ing: { melanzana: 2, salsa: 1, formaggio: 1 }, ...N('parmigiana') },
    uova_pancetta: P.uova_pancetta,                        // solo 3D (dati/pancetta.js)
  } },
  gelateria: { posti: FORNO_POSTI, ricette: {
    succo:       { nome: 'Succo',           emoji: '🧃', pezzo: 'merce_succo',       ing: { carota: 1, barbabietola: 1 }, ...N('succo') },
    frullato:    { nome: 'Frullato',        emoji: '🥤', pezzo: 'merce_frullato',    ing: { fragola: 2, latte: 1 }, ...N('frullato') },
    gelato:      { nome: 'Gelato',          emoji: '🍨', pezzo: 'merce_gelato',      ing: { latte: 2, zucchero: 1 }, ...N('gelato') },
  } },
  telaio: { posti: FORNO_POSTI, ricette: {               // la lana delle pecore (non c'è cotone: nemmeno in 2D)
    stoffa:      { nome: 'Stoffa',          emoji: '🧵', pezzo: 'merce_stoffa',      ing: { lana: 2 }, ...N('stoffa') },
  } },
  zuccherificio: { posti: FORNO_POSTI, ricette: {
    zucchero:    { nome: 'Zucchero',        emoji: '🧂', pezzo: 'merce_zucchero',    ing: { barbabietola: 2 }, ...N('zucchero') },
    marmellata:  { nome: 'Marmellata',      emoji: '🫙', pezzo: 'merce_marmellata',  ing: { fragola: 2, zucchero: 1 }, ...N('marmellata') },
    caramelle:   RICETTA_CARAMELLE,                         // zucchero e miele (giro G5)
  } },
  sartoria: { posti: FORNO_POSTI, ricette: {
    maglione:    { nome: 'Maglione',        emoji: '🧥', pezzo: 'merce_maglione',    ing: { stoffa: 2 }, ...N('maglione') },
    sciarpa_lana: { nome: 'Sciarpa di lana', emoji: '🧣', pezzo: 'merce_sciarpa_lana', ing: { stoffa: 1, lana: 1 }, ...N('sciarpa_lana') },
    berretto:    { nome: 'Berretto',        emoji: '🧢', pezzo: 'merce_berretto',    ing: { stoffa: 1 }, ...N('berretto') },
  } },
  tintoria: { posti: FORNO_POSTI, ricette: {
    tintura:     { nome: 'Tintura',         emoji: '🧴', pezzo: 'merce_tintura',     ing: { lavanda: 2 }, ...N('tintura') },
    sapone:      { nome: 'Sapone',          emoji: '🧼', pezzo: 'merce_sapone',      ing: { tintura: 1, burro: 1 }, ...N('sapone') },
    sacchetto:   { nome: 'Sacchetto profumato', emoji: '👝', pezzo: 'merce_sacchetto', ing: { lavanda: 2, stoffa: 1 }, ...N('sacchetto') },
    maglione_lavanda: { nome: 'Maglione alla lavanda', emoji: '💜', pezzo: 'merce_maglione_lavanda', ing: { maglione: 1, tintura: 1 }, ...N('maglione_lavanda') },
  } },
  friggitoria: { posti: FORNO_POSTI, ricette: {          // la friggitoria della 2D: col pesce appena pescato (dati/pesca.js)
    patatine:    { nome: 'Patatine',        emoji: '🍟', pezzo: 'merce_patatine',    ing: { patata: 2 }, ...N('patatine') },
    fritto:      { nome: 'Pesce fritto',    emoji: '🍤', pezzo: 'merce_fritto',      ing: { pesce: 1, farina: 1 }, ...N('fritto') },
    arancini:    { nome: 'Arancini',        emoji: '🍙', pezzo: 'merce_arancini',    ing: { riso: 2, formaggio: 1 }, ...N('arancini') },
  } },
  sushi_bar: { posti: FORNO_POSTI, ricette: {            // il sushi bar della 2D: il riso e il pesce, per la bambina
    sushi:       { nome: 'Sushi',           emoji: '🍣', pezzo: 'merce_sushi',       ing: { riso: 1, pesce: 1 }, ...N('sushi') },
    maki:        { nome: 'Maki',            emoji: '🍥', pezzo: 'merce_maki',        ing: { riso: 1, carota: 1, peperone: 1 }, ...N('maki') },
  } },
  pentolone: { posti: FORNO_POSTI, ricette: RICETTE_PENTOLONE },   // il pentolone della 2D: il mangime di anatre, maiali e capre (le quattro ricette stanno in dati/cortile.js)
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
  frittata: 'pasta', passata: 'salsa', cipolleSottOlio: 'salsa', caponata: 'parmigiana',
  gelatoFragola: 'gelato', gelatoCarota: 'gelato', gelatoLavanda: 'gelato', gelatoCrema: 'gelato', yogurt: 'frullato',
}
export const nuovoId = k => (typeof k === 'string' && Object.prototype.hasOwnProperty.call(MERCI_VECCHIE, k)) ? MERCI_VECCHIE[k] : k

/** Una merce qualunque (raccolto, prodotto di una macchina, uova o latte) o null: ha `nome`, `emoji` e `pezzo` (o `aspetta`). */
export const merceDi = k => COLTURE[k] || RICETTE[k] || PRODOTTI_ANIMALI[k] || LANA[k] || MANGIMI_SENZA_RICETTA[k] || null
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
    if (PRODOTTI_ANIMALI[k] || LANA[k] || MANGIMI_SENZA_RICETTA[k]) g.push(`${k}: una ricetta con l'id di un prodotto delle bestie`)
    if (!r.nome || !r.emoji) g.push(`${k}: manca nome o emoji`)
    if (!r.pezzo && !r.aspetta) g.push(`${k}: senza pezzo e senza dire quale aspetta: un'emoji per sempre`)
    if (r.pezzo && r.aspetta) g.push(`${k}: ha il pezzo e aspetta ancora: togli «aspetta»`)
    if (!(r.ms >= 1000)) g.push(`${k}: tempo sotto il secondo`)
    if (r.da && !((RICETTE[r.da] && RICETTE[r.da].mangime && r.mangime && RICETTE[r.da].dove === r.dove) || (MANGIMI_SENZA_RICETTA[r.da] && r.mangime && MANGIMI_SENZA_RICETTA[r.da].dove === r.dove))) g.push(`${k}: fa ${r.da}, che non è un mangime della stessa macchina`)
    if (!(Number.isInteger(r.liv) && r.liv >= 1)) g.push(`${k}: manca il livello`)
    const ing = Object.entries(r.ing)
    if (!ing.length) g.push(`${k}: senza ingredienti`)
    for (const [i, n] of ing) {
      if (!colture[i] && !RICETTE[i] && !PRODOTTI_ANIMALI[i] && !LANA[i]) g.push(`${k}: ingrediente ${i} sconosciuto`)
      if (i === k) g.push(`${k}: è ingrediente di sé stessa`)
      if (!(n >= 1)) g.push(`${k}: quantità di ${i} impossibile`)
    }
  }
  // in un testo «manca 🌾 2» deve dire una cosa sola: nessuna emoji di ripiego è di due merci
  const viste = new Map()
  for (const [k, m] of [...Object.entries(colture), ...Object.entries(PRODOTTI_ANIMALI), ...Object.entries(LANA), ...Object.entries(RICETTE)]) {
    if (m.da) continue                                  // la seconda strada per lo stesso prodotto (foraggio di carote): la faccia è già del prodotto
    if (viste.has(m.emoji)) g.push(`${k} e ${viste.get(m.emoji)}: la stessa emoji ${m.emoji}`)
    viste.set(m.emoji, k)
  }
  for (const [vecchio, nuovo] of Object.entries(MERCI_VECCHIE)) {
    if (RICETTE[vecchio] || colture[vecchio] || PRODOTTI_ANIMALI[vecchio] || LANA[vecchio]) g.push(`${vecchio}: un vecchio id che è anche una merce di oggi`)
    if (!RICETTE[nuovo]) g.push(`${vecchio}: diventa ${nuovo}, che non è una ricetta`)
  }
  for (const [t, m] of Object.entries(MACCHINE)) {
    if (edifici && !edifici[t]) g.push(`${t}: macchina senza edificio`)
    if (!(m.posti >= 1)) g.push(`${t}: nessun posto di partenza`)
    const dentro = (LAVORAZIONE[t] || {}).dentro
    if (!dentro) g.push(`${t}: la sezione dei posti non ha un nome`)
    else if (/forno/i.test(dentro) && !['pasticceria', 'panificio'].includes(t)) g.push(`${t}: «${dentro}» ma non è un forno`)
    if (!Object.keys(m.ricette).length) g.push(`${t}: nessuna ricetta`)
  }
  return g
}
