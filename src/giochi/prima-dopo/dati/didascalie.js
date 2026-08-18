/* ═══════════════════════════════════════════════════════════════════
   LE DIDASCALIE — una parola per ogni passo

   Servono a **una cosa sola**: quando una risposta è sbagliata, il
   gioco non si limita più ad accendere un istante la fila giusta —
   fa vedere la storia intera, un passo per riga, e sotto ogni disegno
   ci scrive cos'è. Letta dall'alto in basso quella colonna è una
   frase: «Prima il seme, poi si annaffia, poi il germoglio, infine il
   girasole».

   Perciò le didascalie si scrivono come **pezzi di quella frase**, non
   come titoli: si mettono dopo «prima», «poi», «infine» e devono
   suonare. Minuscole, senza punto, corte — tre parole sono già tante
   in un riquadro largo mezzo telefono.

   ── PERCHÉ SONO IN UN FILE A PARTE, E CHIAVE PER CHIAVE ──
   Un passo è una stringa: o un'emoji o il nome di una scena disegnata
   (`dati/scene.js`). Le didascalie sono indicizzate **sul passo**, non
   sulla storia, per la stessa ragione per cui in `dati/storie.js` c'è
   scritto che la stessa emoji vuol dire la stessa cosa dappertutto: se
   🔪 fosse «si taglia» in una storia e «il coltello» in un'altra, un
   bambino imparerebbe due volte la stessa figura. Un passo, una parola,
   ovunque capiti.

   Il rovescio della medaglia è che la parola deve reggere in tutte le
   storie dove quel passo compare, e ogni tanto si sceglie la meno
   sbagliata: 🍽️ è «a tavola» sia quando è il piatto del pranzo sia
   quando è la fine di «ci si lava le mani».

   Il gioco resta giocabile **senza leggere niente**: qui non si decide
   nessuna risposta, si spiega soltanto — come `frase` dei verbi, è
   roba per chi legge ad alta voce e per i genitori.
   ═══════════════════════════════════════════════════════════════════ */

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

  /* ══ le scene disegnate ══
     Qui il nome della scena dice già quasi tutto, ma non basta
     ricopiarlo: `lo-dice` è il passo che le emoji non sapevano
     raccontare, e la didascalia deve dire *cosa* dice. */

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

/* Le parole che aprono ogni riga della spiegazione. La penultima e
   tutte quelle in mezzo sono «poi»: una storia qui è lunga tre o
   quattro passi, e inventare un ordinale diverso per ognuno («in
   seguito», «dopo ancora») farebbe una lezione di grammatica dove
   serve solo la freccia del tempo. */
export function ordinale(i, quanti) {
  if (i === 0) return 'Prima'
  if (i === quanti - 1) return 'Infine'
  return 'Poi'
}

export const didascalia = passo => DIDASCALIE[passo] || ''

/* Un passo senza didascalia non rompe niente — la riga esce muta — ed è
   proprio per questo che serve un controllo: si nota solo sbagliando
   quella storia lì, in quel punto lì. */
export function guastiDelleDidascalie(storie, didascalie = DIDASCALIE) {
  const guasti = []
  const usati = new Set(storie.flatMap(s => s.passi))
  for (const p of usati)
    if (!didascalie[p]) guasti.push(`il passo "${p}" non ha didascalia`)
  for (const p of Object.keys(didascalie))
    if (!usati.has(p)) guasti.push(`la didascalia "${p}" non serve a nessuna storia`)
  return guasti
}
