// Una parola per ogni passo: quando si sbaglia, la storia si mostra
// intera con sotto ogni disegno cosa è, e letta dall'alto in basso quella
// colonna è una frase («Prima il seme, poi si annaffia, infine il
// girasole»). Le didascalie si scrivono come pezzi di quella frase — dopo
// «prima/poi/infine» — minuscole, senza punto, corte. Indicizzate sul
// passo e non sulla storia: vedi docs/prima-dopo/disegni.md.

export const DIDASCALIE = {

  /* ── crescita ── */
  '🌰': 'il seme',
  '🌱': 'il germoglio',
  '🌳': "l'albero",
  '🥚': "l'uovo",
  '🐣': 'si schiude',
  '🐥': 'il pulcino',
  '🐔': 'la gallina',
  '👶': 'il neonato',
  '🧒': 'il bambino',
  '👨': "l'uomo",
  '👧': 'la bambina',
  '👩': 'la signora',
  '👵': 'la nonna',

  /* ── trasformazione ── */
  '🥛': 'il latte',
  '🧊': 'il ghiaccio',
  '🍦': 'il gelato',
  '🐄': 'la mucca',
  '🧀': 'il formaggio',
  '🌾': 'il grano',
  '🥣': "l'impasto",
  '🍞': 'il pane',
  '💧': "l'acqua",
  '❄️': 'il freddo',
  '🍎': 'la mela',
  '🔪': 'si taglia',
  '🥧': 'la torta',
  '🍊': "l'arancia",
  '🧃': 'il succo',
  '📄': 'il foglio',
  '📚': 'i libri',

  /* ── routine ── */
  '🧦': 'i calzini',
  '👟': 'le scarpe',
  '🚪': 'si esce',
  '🚰': "l'acqua del rubinetto",
  '🧼': 'il sapone',
  '🍽️': 'a tavola',
  '🌙': 'la notte',
  '📖': 'la favola',
  '😴': 'si dorme',
  '🍝': 'la pasta',
  '🧽': 'si lava il piatto',

  /* ── causa ed effetto ── */
  '☀️': 'il sole',
  '😢': 'il pianto',
  '⚽': 'il pallone',
  '🪟': 'la finestra',
  '💥': 'si rompe',
  '😱': 'lo spavento',
  '🌧️': 'la pioggia',
  '🌈': "l'arcobaleno",
  '🕯️': 'la candela',
  '🔥': 'il fuoco',
  '💨': 'il fumo',
  '🎈': 'il palloncino',
  '📌': 'lo spillo',
  '⛄': 'il pupazzo di neve',

  /* ── costruzione ── */
  '🧱': 'i mattoni',
  '🏗️': 'si costruisce',
  '🏠': 'la casa',
  '🌊': 'il fiume',
  '🪵': 'le assi',
  '🔨': 'il martello',
  '🌉': 'il ponte',
  '✏️': 'si scrive',
  '✉️': 'la lettera',
  '📮': 'si imbuca',
  '🐑': 'la pecora',
  '🧶': 'la lana',
  '🧣': 'la sciarpa',
  '🏖️': 'la spiaggia',
  '🪣': 'il secchiello',
  '🏰': 'il castello di sabbia',
  '📦': 'la scatola',
  '🎀': 'il fiocco',
  '🎁': 'il regalo',

  /* ── cucina ── */
  '🥔': 'le patate',
  '🍳': 'la padella',
  '🍟': 'le patatine',
  '🌽': 'il mais',
  '🍿': 'i popcorn',
  '🍅': 'il pomodoro',
  '🍕': 'la pizza',
  '🥬': "l'insalata da lavare",
  '🥗': "l'insalata pronta",

  /* ── viaggio ── */
  '🎫': 'il biglietto',
  '🚉': 'la stazione',
  '🚂': 'il treno',
  '🧳': 'la valigia',
  '🚕': 'il taxi',
  '✈️': "l'aereo",
  '🏨': "l'albergo",
  '🚗': 'la macchina',
  '⛺': 'la tenda',
  '⛽': 'il pieno di benzina',
  '🏔️': 'la montagna',
  '🚢': 'la nave',
  '🏝️': "l'isola",
  '🚲': 'la bicicletta',
  '🛣️': 'la strada',
  '🏞️': 'il bosco',

  /* ── le scene disegnate: qui il nome della scena dice già quasi
     tutto, ma `lo-dice` è il passo che le emoji non sapevano
     raccontare, e la didascalia deve dire *cosa* dice ── */

  /* il ginocchio sbucciato */
  'corre-nel-prato': 'corre nel prato',
  'inciampa': 'inciampa nel sasso',
  'ginocchio-sbucciato': 'si è fatta male',
  'il-cerotto': 'il cerotto e la coccola',

  /* il vaso rotto, e detto */
  'palla-in-casa': 'gioca a palla in casa',
  'vaso-rotto': 'il vaso si rompe',
  'lo-dice': 'lo dice alla mamma',
  'si-raccoglie': 'si raccoglie insieme',

  /* dal fango alla doccia */
  'gioca-nel-fango': 'gioca nel fango',
  'sotto-la-doccia': 'sotto la doccia',
  'pulito-e-asciutto': 'pulito e asciutto',

  /* la mattina */
  'si-sveglia': 'si sveglia',
  'la-colazione': 'la colazione',
  'si-prende-lo-zaino': 'si prende lo zaino',
  'a-scuola': 'a scuola',

  /* la sera */
  'la-cena': 'la cena',
  'sbadiglia': 'viene sonno',
  'la-favola': 'la favola',
  'si-dorme': 'si dorme',

  /* si pianta il seme */
  'si-semina': 'si semina',
  'si-annaffia': 'si annaffia',
  'il-germoglio': 'spunta il germoglio',
  'il-girasole': 'il girasole',

  /* il gattino */
  'il-gattino': 'il gattino',
  'il-gatto-mezzo': 'cresce',
  'il-gatto-grande': 'il gatto grande',

  /* la torta */
  'si-impasta': 'si impasta',
  'nel-forno': 'nel forno',
  'la-torta-pronta': 'la torta pronta',

  /* la spremuta */
  'le-arance': 'le arance',
  'si-spreme': 'si spreme',
  'il-bicchiere-pieno': 'il bicchiere pieno',

  /* il gelato caduto */
  'col-gelato': 'ha il gelato',
  'il-gelato-cade': 'il gelato cade',
  'si-divide': "l'altro lo divide",

  /* il litigio */
  'si-litiga': 'si litiga',
  'uno-piange': 'uno piange',
  'lo-presta': "l'altro glielo presta",
  'si-gioca-insieme': 'si gioca insieme',

  /* senza giacca */
  'esce-senza-giacca': 'esce senza giacca',
  'trema-dal-freddo': 'trema dal freddo',
  'con-la-giacca': 'con la giacca sta bene',
}

// La penultima e tutte quelle in mezzo sono «poi»: una storia qui è lunga
// tre o quattro passi, e un ordinale diverso per ognuno sarebbe una
// lezione di grammatica dove serve solo la freccia del tempo.
export function ordinale(i, quanti) {
  if (i === 0) return 'Prima'
  if (i === quanti - 1) return 'Infine'
  return 'Poi'
}

export const didascalia = passo => DIDASCALIE[passo] || ''

export function guastiDelleDidascalie(storie, didascalie = DIDASCALIE) {
  const guasti = []
  const usati = new Set(storie.flatMap(s => s.passi))
  for (const p of usati)
    if (!didascalie[p]) guasti.push(`il passo "${p}" non ha didascalia`)
  for (const p of Object.keys(didascalie))
    if (!usati.has(p)) guasti.push(`la didascalia "${p}" non serve a nessuna storia`)
  return guasti
}
