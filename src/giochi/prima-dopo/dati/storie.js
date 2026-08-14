/* ═══════════════════════════════════════════════════════════════════
   LE STORIE — il contenuto vero di questo gioco

   Ogni storia è una fila di emoji: il seme, il germoglio, l'albero.
   Niente frasi da leggere — quelle stanno in `nome`, e sono per i
   grandi (compaiono piccole, e servono a non fare due volte la stessa
   storia). Un bambino di quattro anni gioca guardando i disegni.

   `categoria` decide dove una storia può capitare: la campagna
   (`dati/campagna.js`) chiede categorie, non storie una per una, così
   una tappa nuova non deve elencare dieci chiavi a mano.

   `ambiguaAlContrario: true` marca le poche storie che, lette al
   contrario, avrebbero comunque un senso (l'acqua che gela è anche il
   ghiaccio che si scioglie). Non sono storie sbagliate — sono storie
   che chiedono già di sapere qual è il verso giusto, e in una tappa
   dove la freccia del tempo deve essere ovvia non ci possono capitare:
   `motore/corsa.js` le esclude dagli scalini «facile».

   Come si sceglie un passo nuovo, in ordine di importanza:
   1. è un disegno intero, riconoscibile in una casella piccola.
   2. non si ripete mai dentro la stessa storia (`guastiDelleStorie` lo
      controlla): un disegno che tornasse due volte potrebbe stare in
      due punti diversi della fila, e la domanda diventerebbe ambigua
      senza che nessuno se ne accorga.
   3. c'è su tutti i telefoni: niente emoji arrivate da poco.
   ═══════════════════════════════════════════════════════════════════ */

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
  { chiave: 'bruco-farfalla', nome: 'Il bruco diventa farfalla', categoria: 'crescita',
    passi: ['🥚', '🐛', '🦋'] },
  { chiave: 'bimbo-uomo', nome: 'Il bambino cresce', categoria: 'crescita',
    passi: ['👶', '🧒', '👨'] },
  { chiave: 'bimba-nonna', nome: 'La bambina diventa nonna', categoria: 'crescita',
    passi: ['👧', '👩', '👵'] },
  { chiave: 'girasole', nome: 'Il girasole cresce', categoria: 'crescita',
    passi: ['🌱', '🌿', '🌻'] },

  /* ── trasformazione ── */
  { chiave: 'uva-vino', nome: "L'uva diventa vino", categoria: 'trasformazione',
    passi: ['🍇', '🍾', '🍷'] },
  { chiave: 'latte-formaggio', nome: 'Il latte diventa formaggio', categoria: 'trasformazione',
    passi: ['🥛', '🧈', '🧀'] },
  { chiave: 'grano-pane', nome: 'Il grano diventa pane', categoria: 'trasformazione',
    passi: ['🌾', '🥣', '🍞'] },
  /* letta al contrario è il ghiaccio che si scioglie: ha senso anche
     così, quindi non può capitare nelle tappe facili */
  { chiave: 'il-freddo-arriva', nome: "L'acqua diventa ghiaccio", categoria: 'trasformazione',
    passi: ['💧', '🧊', '❄️'], ambiguaAlContrario: true },
  { chiave: 'mela-torta', nome: 'La mela diventa torta', categoria: 'trasformazione',
    passi: ['🍎', '🔪', '🥧'] },
  { chiave: 'arancia-succo', nome: "L'arancia diventa succo", categoria: 'trasformazione',
    passi: ['🍊', '🔪', '🧃'] },

  /* ── routine ── */
  { chiave: 'mattina', nome: 'La mattina prima di uscire', categoria: 'routine',
    passi: ['⏰', '🥣', '🎒', '🏫'] },
  { chiave: 'sera', nome: 'La sera prima di dormire', categoria: 'routine',
    passi: ['🛁', '🪥', '🛏️', '😴'] },
  { chiave: 'vestirsi', nome: 'Ci si veste', categoria: 'routine',
    passi: ['🧦', '👖', '👕', '🧥'] },
  { chiave: 'lavarsi-mani', nome: 'Ci si lava le mani prima di mangiare', categoria: 'routine',
    passi: ['🚰', '🧼', '🍽️'] },
  { chiave: 'favola-buonanotte', nome: 'La favola della buonanotte', categoria: 'routine',
    passi: ['📖', '🛏️', '🌙'] },
  { chiave: 'doccia', nome: 'La doccia', categoria: 'routine',
    passi: ['🚿', '🧴', '🧻'] },

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

  /* ── costruzione ── */
  { chiave: 'casa', nome: 'Si costruisce la casa', categoria: 'costruzione',
    passi: ['🧱', '🏗️', '🔨', '🏠'] },
  { chiave: 'ponte', nome: 'Si costruisce il ponte', categoria: 'costruzione',
    passi: ['🪵', '🔨', '🧰', '🌉'] },
  { chiave: 'libro', nome: 'Si scrive un libro', categoria: 'costruzione',
    passi: ['✏️', '📄', '📚'] },
  { chiave: 'sciarpa', nome: 'Si fa la sciarpa', categoria: 'costruzione',
    passi: ['🧶', '🧵', '🧣'] },
  { chiave: 'castello-sabbia', nome: 'Il castello di sabbia', categoria: 'costruzione',
    passi: ['🏖️', '🪣', '🏰'] },
  { chiave: 'barchetta', nome: 'La barchetta di legno', categoria: 'costruzione',
    passi: ['🪵', '🔧', '⛵'] },

  /* ── cucina ── */
  { chiave: 'patatine', nome: 'Le patatine fritte', categoria: 'cucina',
    passi: ['🥔', '🔪', '🍳', '🍟'] },
  { chiave: 'torta-compleanno', nome: 'La torta di compleanno', categoria: 'cucina',
    passi: ['🥚', '🧈', '🧁', '🎂'] },
  { chiave: 'uovo-fritto', nome: "L'uovo fritto", categoria: 'cucina',
    passi: ['🥚', '🔥', '🍳'] },
  { chiave: 'caffe', nome: 'Il caffè', categoria: 'cucina',
    passi: ['🫘', '🔥', '☕'] },
  { chiave: 'pizza', nome: 'La pizza', categoria: 'cucina',
    passi: ['🍅', '🧀', '🍕'] },
  { chiave: 'insalata', nome: "L'insalata", categoria: 'cucina',
    passi: ['🥬', '🔪', '🥗'] },

  /* ── viaggio ── */
  { chiave: 'treno-mare', nome: 'Il viaggio in treno fino al mare', categoria: 'viaggio',
    passi: ['🎫', '🚉', '🚂', '🏖️'] },
  { chiave: 'aereo', nome: "Il viaggio in aereo", categoria: 'viaggio',
    passi: ['🧳', '🚕', '✈️', '🏨'] },
  { chiave: 'campeggio', nome: 'Il campeggio', categoria: 'viaggio',
    passi: ['🚗', '⛺', '🔥', '🌙'] },
  { chiave: 'macchina', nome: 'Il viaggio in macchina', categoria: 'viaggio',
    passi: ['🚗', '⛽', '🏞️'] },
  { chiave: 'nave', nome: 'Il viaggio in nave', categoria: 'viaggio',
    passi: ['⚓', '🚢', '🏝️'] },
  { chiave: 'bici', nome: 'Il giro in bicicletta', categoria: 'viaggio',
    passi: ['🚲', '🛣️', '🏞️'] },
]

/* Ogni categoria deve bastare da sola a riempire una tappa: sotto
   questo numero una tappa che la usa da sola rischierebbe di ripetere
   sempre le stesse due o tre storie. */
export const MINIMO_PER_CATEGORIA = 4

export function guastiDelleStorie(storie = STORIE) {
  const guasti = []
  const chiaviViste = new Set()
  const sequenzeViste = new Map()

  for (const s of storie) {
    const dove = `storia "${s.chiave}"`
    if (chiaviViste.has(s.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    chiaviViste.add(s.chiave)
    if (!s.nome) guasti.push(`${dove}: senza nome`)
    if (!CATEGORIE.includes(s.categoria)) guasti.push(`${dove}: categoria "${s.categoria}" non esiste`)
    if (!Array.isArray(s.passi) || s.passi.length < 3)
      guasti.push(`${dove}: ${s.passi?.length || 0} passi, ne servono almeno 3`)
    /* un'emoji che tornasse due volte nella stessa storia potrebbe stare
       in due punti diversi della fila: è la storia ambigua di cui parla
       il capitolato, ed è per questo che non si ammette mai */
    if (new Set(s.passi).size !== (s.passi || []).length)
      guasti.push(`${dove}: un'emoji ripetuta dentro la stessa storia`)
    const fila = JSON.stringify(s.passi)
    if (sequenzeViste.has(fila))
      guasti.push(`${dove}: stessa fila di passi di "${sequenzeViste.get(fila)}"`)
    else sequenzeViste.set(fila, s.chiave)
  }

  for (const c of CATEGORIE) {
    const n = storie.filter(s => s.categoria === c).length
    if (n < MINIMO_PER_CATEGORIA)
      guasti.push(`categoria "${c}": solo ${n} storie, ne servono almeno ${MINIMO_PER_CATEGORIA}`)
  }

  return guasti
}
