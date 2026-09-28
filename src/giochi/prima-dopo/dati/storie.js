// Le storie: ogni storia è una fila di passi, e un passo è una stringa
// (un'emoji o il nome di una scena disegnata, `dati/scene.js`) — il
// motore non guarda mai dentro. `categoria` decide dove una storia può
// capitare (la campagna chiede categorie, non storie una per una).
// `ambiguaAlContrario: true` marca le storie che lette al contrario
// avrebbero comunque senso: `motore/corsa.js` le esclude dagli scalini
// facili. Le regole per scriverne una nuova, e le combinazioni scartate:
// docs/prima-dopo/disegni.md.

export const CATEGORIE = [
  'crescita', 'trasformazione', 'routine', 'causa-effetto',
  'costruzione', 'cucina', 'viaggio',
]

export const STORIE = [
  /* ── crescita ── */
  { chiave: 'seme-albero', nome: 'Il seme diventa albero', categoria: 'crescita',
    passi: ['🌰', '🌱', '🌳'] },
  { chiave: 'uovo-gallina', nome: "L'uovo diventa gallina", categoria: 'crescita',
    passi: ['🥚', '🐣', '🐥', '🐔'] },
  { chiave: 'bimbo-uomo', nome: 'Il bambino cresce', categoria: 'crescita',
    passi: ['👶', '🧒', '👨'] },
  { chiave: 'bimba-nonna', nome: 'La bambina diventa nonna', categoria: 'crescita',
    passi: ['👧', '👩', '👵'] },
  { chiave: 'si-pianta-il-seme', nome: 'Si pianta il seme', categoria: 'crescita',
    disegnata: true,
    passi: ['si-semina', 'si-annaffia', 'il-germoglio', 'il-girasole'] },
  { chiave: 'il-gattino', nome: 'Il gattino diventa grande', categoria: 'crescita',
    disegnata: true,
    passi: ['il-gattino', 'il-gatto-mezzo', 'il-gatto-grande'] },

  /* ── trasformazione ── */
  { chiave: 'latte-gelato', nome: 'Il latte diventa gelato', categoria: 'trasformazione',
    passi: ['🥛', '🧊', '🍦'] },
  { chiave: 'latte-formaggio', nome: 'Dalla mucca al formaggio', categoria: 'trasformazione',
    passi: ['🐄', '🥛', '🧀'] },
  { chiave: 'grano-pane', nome: 'Il grano diventa pane', categoria: 'trasformazione',
    passi: ['🌾', '🥣', '🍞'] },
  { chiave: 'il-freddo-arriva', nome: "L'acqua diventa ghiaccio", categoria: 'trasformazione',
    passi: ['💧', '❄️', '🧊'], ambiguaAlContrario: true },
  { chiave: 'mela-torta', nome: 'La mela diventa torta', categoria: 'trasformazione',
    passi: ['🍎', '🔪', '🥧'] },
  { chiave: 'arancia-succo', nome: "L'arancia diventa succo", categoria: 'trasformazione',
    passi: ['🍊', '🔪', '🧃'] },
  { chiave: 'libro', nome: "L'albero diventa carta", categoria: 'trasformazione',
    passi: ['🌳', '📄', '📚'] },

  /* ── routine ── */
  { chiave: 'la-mattina', nome: 'La mattina, dalla sveglia alla scuola', categoria: 'routine',
    disegnata: true,
    passi: ['si-sveglia', 'la-colazione', 'si-prende-lo-zaino', 'a-scuola'] },
  { chiave: 'la-sera', nome: 'La sera, fino al sonno', categoria: 'routine',
    disegnata: true,
    passi: ['la-cena', 'sbadiglia', 'la-favola', 'si-dorme'] },
  { chiave: 'vestirsi', nome: 'Ci si veste per uscire', categoria: 'routine',
    passi: ['🧦', '👟', '🚪'] },
  { chiave: 'lavarsi-mani', nome: 'Ci si lava le mani prima di mangiare', categoria: 'routine',
    passi: ['🚰', '🧼', '🍽️'] },
  { chiave: 'favola-buonanotte', nome: 'La favola della buonanotte', categoria: 'routine',
    passi: ['🌙', '📖', '😴'] },
  { chiave: 'pranzo', nome: 'Il pranzo, dal piatto al lavandino', categoria: 'routine',
    passi: ['🍽️', '🍝', '🍎', '🧽'] },

  /* ── causa-effetto ── */
  { chiave: 'gelato-sole', nome: 'Il gelato si scioglie al sole', categoria: 'causa-effetto',
    passi: ['🍦', '☀️', '💧', '😢'] },
  { chiave: 'pallone-finestra', nome: 'Il pallone rompe la finestra', categoria: 'causa-effetto',
    passi: ['⚽', '🪟', '💥', '😱'] },
  { chiave: 'pioggia-arcobaleno', nome: "Dopo la pioggia arriva l'arcobaleno", categoria: 'causa-effetto',
    passi: ['🌧️', '☀️', '🌈'] },
  { chiave: 'candela', nome: 'La candela si spegne', categoria: 'causa-effetto',
    passi: ['🕯️', '🔥', '💨'] },
  { chiave: 'palloncino', nome: 'Il palloncino scoppia', categoria: 'causa-effetto',
    passi: ['🎈', '📌', '💥'] },
  { chiave: 'pupazzo-si-scioglie', nome: 'Il pupazzo di neve si scioglie', categoria: 'causa-effetto',
    passi: ['⛄', '☀️', '💧'] },
  { chiave: 'ginocchio', nome: 'Il ginocchio sbucciato', categoria: 'causa-effetto',
    disegnata: true,
    passi: ['corre-nel-prato', 'inciampa', 'ginocchio-sbucciato', 'il-cerotto'] },
  { chiave: 'vaso', nome: 'Il vaso rotto, e detto', categoria: 'causa-effetto',
    disegnata: true,
    passi: ['palla-in-casa', 'vaso-rotto', 'lo-dice', 'si-raccoglie'] },
  { chiave: 'dal-fango-alla-doccia', nome: 'Dal fango alla doccia', categoria: 'causa-effetto',
    disegnata: true,
    passi: ['gioca-nel-fango', 'sotto-la-doccia', 'pulito-e-asciutto'] },
  { chiave: 'gelato-caduto', nome: 'Il gelato caduto', categoria: 'causa-effetto',
    disegnata: true,
    passi: ['col-gelato', 'il-gelato-cade', 'si-divide'] },
  { chiave: 'litigio', nome: 'Il litigio che finisce bene', categoria: 'causa-effetto',
    disegnata: true,
    passi: ['si-litiga', 'uno-piange', 'lo-presta', 'si-gioca-insieme'] },
  { chiave: 'senza-giacca', nome: 'Esce senza giacca', categoria: 'causa-effetto',
    disegnata: true,
    passi: ['esce-senza-giacca', 'trema-dal-freddo', 'con-la-giacca'] },

  /* ── costruzione ── */
  { chiave: 'casa', nome: 'Si costruisce la casa', categoria: 'costruzione',
    passi: ['🧱', '🏗️', '🏠'] },
  { chiave: 'ponte', nome: 'Sul fiume si costruisce il ponte', categoria: 'costruzione',
    passi: ['🌊', '🪵', '🔨', '🌉'] },
  { chiave: 'lettera', nome: 'Si spedisce una lettera', categoria: 'costruzione',
    passi: ['✏️', '✉️', '📮'] },
  { chiave: 'sciarpa', nome: 'Dalla pecora la sciarpa', categoria: 'costruzione',
    passi: ['🐑', '🧶', '🧣'] },
  { chiave: 'castello-sabbia', nome: 'Il castello di sabbia', categoria: 'costruzione',
    passi: ['🏖️', '🪣', '🏰'] },
  { chiave: 'regalo', nome: 'Si prepara il regalo', categoria: 'costruzione',
    passi: ['📦', '🎀', '🎁'] },

  /* ── cucina ── */
  { chiave: 'patatine', nome: 'Le patatine fritte', categoria: 'cucina',
    passi: ['🥔', '🔪', '🍳', '🍟'] },
  { chiave: 'la-torta', nome: 'La torta di compleanno', categoria: 'cucina',
    disegnata: true,
    passi: ['si-impasta', 'nel-forno', 'la-torta-pronta'] },
  { chiave: 'la-spremuta', nome: "La spremuta d'arancia", categoria: 'cucina',
    disegnata: true,
    passi: ['le-arance', 'si-spreme', 'il-bicchiere-pieno'] },
  { chiave: 'uovo-fritto', nome: "L'uovo fritto", categoria: 'cucina',
    passi: ['🥚', '🔥', '🍳'] },
  { chiave: 'popcorn', nome: 'Il mais diventa popcorn', categoria: 'cucina',
    passi: ['🌽', '🔥', '🍿'] },
  { chiave: 'pizza', nome: 'La pizza', categoria: 'cucina',
    passi: ['🍅', '🔥', '🍕'] },
  { chiave: 'insalata', nome: "L'insalata", categoria: 'cucina',
    passi: ['🥬', '🔪', '🥗'] },

  /* ── viaggio ── */
  { chiave: 'treno-mare', nome: 'Il viaggio in treno fino al mare', categoria: 'viaggio',
    passi: ['🎫', '🚉', '🚂', '🏖️'] },
  { chiave: 'aereo', nome: "Il viaggio in aereo", categoria: 'viaggio',
    passi: ['🧳', '🚕', '✈️', '🏨'] },
  { chiave: 'campeggio', nome: 'Il campeggio', categoria: 'viaggio',
    passi: ['🚗', '⛺', '🔥', '🌙'] },
  { chiave: 'macchina', nome: 'Il viaggio in macchina fino in montagna', categoria: 'viaggio',
    passi: ['🚗', '⛽', '🏔️'] },
  { chiave: 'nave', nome: 'Il viaggio in nave', categoria: 'viaggio',
    passi: ['🧳', '🚢', '🏝️'] },
  { chiave: 'bici', nome: 'Il giro in bicicletta', categoria: 'viaggio',
    passi: ['🚲', '🛣️', '🏞️'] },
]

// Ogni categoria deve bastare da sola a riempire una tappa: sotto questo
// numero una tappa che la usa da sola rischia di ripetere sempre le
// stesse due o tre storie.
export const MINIMO_PER_CATEGORIA = 4

export function guastiDelleStorie(storie = STORIE, scene = null) {
  const guasti = []
  const chiaviViste = new Set()
  const sequenzeViste = new Map()
  // «e poi?» guarda i primi due passi, «e prima?» gli ultimi due: se due
  // storie condividessero quella coppia la domanda avrebbe due risposte
  // giuste. I distrattori vengono da tutte le storie della tappa (che può
  // mescolare categorie), quindi le coppie si controllano fra tutte.
  const iniziViste = new Map()
  const fineViste = new Map()

  for (const s of storie) {
    const dove = `storia "${s.chiave}"`
    if (chiaviViste.has(s.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    chiaviViste.add(s.chiave)
    if (!s.nome) guasti.push(`${dove}: senza nome`)
    if (!CATEGORIE.includes(s.categoria)) guasti.push(`${dove}: categoria "${s.categoria}" non esiste`)
    if (!Array.isArray(s.passi) || s.passi.length < 3)
      guasti.push(`${dove}: ${s.passi?.length || 0} passi, ne servono almeno 3`)
    if (new Set(s.passi).size !== (s.passi || []).length)
      guasti.push(`${dove}: un'emoji ripetuta dentro la stessa storia`)
    const fila = JSON.stringify(s.passi)
    if (sequenzeViste.has(fila))
      guasti.push(`${dove}: stessa fila di passi di "${sequenzeViste.get(fila)}"`)
    else sequenzeViste.set(fila, s.chiave)

    const passi = Array.isArray(s.passi) ? s.passi : []

    // una storia è disegnata tutta o niente: mezza fila di vignette e
    // mezza di emoji sarebbe la peggiore delle due
    if (scene) for (const passo of passi) {
      const disegnato = Object.prototype.hasOwnProperty.call(scene, passo)
      if (s.disegnata && !disegnato)
        guasti.push(`${dove}: il passo "${passo}" non è una scena che esiste`)
      if (!s.disegnata && disegnato)
        guasti.push(`${dove}: usa la scena "${passo}" ma non si dichiara disegnata`)
    }

    if (passi.length >= 3) {
      const inizio = JSON.stringify(passi.slice(0, 2))
      if (iniziViste.has(inizio))
        guasti.push(`${dove}: comincia come "${iniziViste.get(inizio)}" — «e poi?» avrebbe due risposte`)
      else iniziViste.set(inizio, s.chiave)

      const fine = JSON.stringify(passi.slice(-2))
      if (fineViste.has(fine))
        guasti.push(`${dove}: finisce come "${fineViste.get(fine)}" — «e prima?» avrebbe due risposte`)
      else fineViste.set(fine, s.chiave)
    }
  }

  for (const c of CATEGORIE) {
    const n = storie.filter(s => s.categoria === c).length
    if (n < MINIMO_PER_CATEGORIA)
      guasti.push(`categoria "${c}": solo ${n} storie, ne servono almeno ${MINIMO_PER_CATEGORIA}`)
  }

  return guasti
}
