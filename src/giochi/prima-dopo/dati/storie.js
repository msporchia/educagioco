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
   2. **il verso è obbligato**: fra un passo e il suo vicino ci deve
      essere un prima e un dopo veri, non due cose che capitano
      insieme. Due ingredienti in fila (il pomodoro e il formaggio) o
      due vestiti in fila (i pantaloni e la maglietta) si possono
      scambiare senza che la storia perda senso: chi li mette
      nell'ordine «sbagliato» ha ragionato bene e il gioco gli dà
      torto. Quando due passi sono paralleli se ne tiene uno solo e si
      cerca un passo che li segua per forza — il fuoco, il coltello, la
      porta.
   3. non si ripete mai dentro la stessa storia (`guastiDelleStorie` lo
      controlla): un disegno che tornasse due volte potrebbe stare in
      due punti diversi della fila, e la domanda diventerebbe ambigua
      senza che nessuno se ne accorga.
   4. la stessa emoji vuol dire la stessa cosa in tutte le storie: 🔪 è
      «si taglia», 🔥 è «si cuoce», 🥣 è «la ciotola». Un disegno che
      cambia mestiere da una storia all'altra si impara due volte.
   5. c'è su tutti i telefoni: niente emoji arrivate da poco.

   In «causa-effetto» il verso lo dà una convenzione, ed è la stessa in
   tutte e sei: prima la cosa a cui succede (il gelato, il pupazzo, il
   palloncino), poi quello che gliela fa succedere (il sole, lo
   spillo), poi come va a finire. Vale la pena saperlo perché è
   l'unico posto dove il primo passo non viene *prima nel tempo* — il
   sole c'era già — ma prima nel racconto; se una storia nuova la
   rovescia, due storie della stessa categoria insegnano due regole
   diverse.
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
  /* Qui c'era «l'uovo, il bruco, la farfalla»: è vero in natura, ma 🥚 è
     l'uovo di gallina — lo stesso disegno che due righe più su diventa
     un pulcino e in cucina finisce in padella. Un bambino non vede un
     ciclo biologico, vede un uovo di gallina davanti a un bruco.
     Non è stata rimpiazzata: il ricambio ovvio era «il fiore diventa
     mela» (🌸 🍏 🍎), che però chiede di sapere che la mela acerba è
     verde — e chi non lo sa sbaglia a testa o croce. La crescita resta
     di cinque storie, tutte con un verso che non si discute. */
  { chiave: 'bimbo-uomo', nome: 'Il bambino cresce', categoria: 'crescita',
    passi: ['👶', '🧒', '👨'] },
  { chiave: 'bimba-nonna', nome: 'La bambina diventa nonna', categoria: 'crescita',
    passi: ['👧', '👩', '👵'] },
  { chiave: 'girasole', nome: 'Il girasole cresce', categoria: 'crescita',
    passi: ['🌱', '🌿', '🌻'] },

  /* ── trasformazione ── */
  /* c'era «l'uva, la bottiglia, il vino»: la bottiglia non è uno stadio
     dell'uva, è dove il vino finisce — e la storia da raccontare a
     quattro anni non è quella. Il latte che diventa gelato è la stessa
     lezione (una cosa ne diventa un'altra) con tre disegni che si
     riconoscono tutti. */
  { chiave: 'latte-gelato', nome: 'Il latte diventa gelato', categoria: 'trasformazione',
    passi: ['🥛', '🧊', '🍦'] },
  /* il burro non è una tappa verso il formaggio: è un'altra cosa che si
     ricava dallo stesso latte. Al suo posto la mucca, che il latte ce
     l'ha prima. */
  { chiave: 'latte-formaggio', nome: 'Dalla mucca al formaggio', categoria: 'trasformazione',
    passi: ['🐄', '🥛', '🧀'] },
  { chiave: 'grano-pane', nome: 'Il grano diventa pane', categoria: 'trasformazione',
    passi: ['🌾', '🥣', '🍞'] },
  /* il fiocco di neve non viene dal cubetto: era una fila che finiva
     più in là di dove arriva la storia. Adesso ❄️ sta in mezzo per
     quello che è — il freddo che arriva — e il ghiaccio è il risultato.
     Resta segnata ambigua: letta al contrario è il ghiaccio che si
     scioglie, e nelle tappe facili non ci può capitare. */
  { chiave: 'il-freddo-arriva', nome: "L'acqua diventa ghiaccio", categoria: 'trasformazione',
    passi: ['💧', '❄️', '🧊'], ambiguaAlContrario: true },
  { chiave: 'mela-torta', nome: 'La mela diventa torta', categoria: 'trasformazione',
    passi: ['🍎', '🔪', '🥧'] },
  { chiave: 'arancia-succo', nome: "L'arancia diventa succo", categoria: 'trasformazione',
    passi: ['🍊', '🔪', '🧃'] },
  /* stava in "costruzione" come «si scrive un libro», con la matita
     prima del foglio: prendere la matita o prendere il foglio è la
     stessa mossa fatta in due ordini, e chi sceglieva l'altro prendeva
     un errore. Dall'albero alla carta, invece, un verso ce l'ha. */
  { chiave: 'libro', nome: "L'albero diventa carta", categoria: 'trasformazione',
    passi: ['🌳', '📄', '📚'] },

  /* ── routine ── */
  { chiave: 'mattina', nome: 'La mattina prima di uscire', categoria: 'routine',
    passi: ['⏰', '🥣', '🎒', '🏫'] },
  { chiave: 'sera', nome: 'La sera prima di dormire', categoria: 'routine',
    passi: ['🛁', '🪥', '🛏️', '😴'] },
  /* calze, pantaloni, maglietta, giacca: fra i pantaloni e la maglietta
     non c'è nessun prima e nessun dopo — chi si infila prima la
     maglietta ha ragionato bene e prendeva un errore. Restano i due
     passi con un verso vero (le calze prima delle scarpe) e la porta,
     che viene per forza per ultima. */
  { chiave: 'vestirsi', nome: 'Ci si veste per uscire', categoria: 'routine',
    passi: ['🧦', '👟', '🚪'] },
  { chiave: 'lavarsi-mani', nome: 'Ci si lava le mani prima di mangiare', categoria: 'routine',
    passi: ['🚰', '🧼', '🍽️'] },
  /* la luna non è il «dopo» di niente: è la sera, e la sera c'era già
     quando si è aperto il libro. Adesso apre lei, e si finisce dormendo. */
  { chiave: 'favola-buonanotte', nome: 'La favola della buonanotte', categoria: 'routine',
    passi: ['🌙', '📖', '😴'] },
  /* la carta igienica non c'entra niente con la doccia: era finita lì
     perché sta in bagno */
  { chiave: 'doccia', nome: 'La doccia, e poi ci si riveste', categoria: 'routine',
    passi: ['🚿', '🧴', '👕'] },
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

  /* ── costruzione ── */
  /* la gru e il martello erano due modi di dire «si lavora», messi uno
     dopo l'altro senza motivo: ne resta uno */
  { chiave: 'casa', nome: 'Si costruisce la casa', categoria: 'costruzione',
    passi: ['🧱', '🏗️', '🏠'] },
  /* la cassetta degli attrezzi veniva dopo il martello, cioè dopo che
     il martello era già in mano. Al suo posto il fiume, che c'è prima
     di tutto ed è il motivo per cui il ponte si costruisce. */
  { chiave: 'ponte', nome: 'Sul fiume si costruisce il ponte', categoria: 'costruzione',
    passi: ['🌊', '🪵', '🔨', '🌉'] },
  { chiave: 'lettera', nome: 'Si spedisce una lettera', categoria: 'costruzione',
    passi: ['✏️', '✉️', '📮'] },
  /* il gomitolo non diventa un filo con l'ago: è il filo che diventa
     gomitolo, e la sciarpa si fa coi ferri. La lana viene dalla pecora. */
  { chiave: 'sciarpa', nome: 'Dalla pecora la sciarpa', categoria: 'costruzione',
    passi: ['🐑', '🧶', '🧣'] },
  { chiave: 'castello-sabbia', nome: 'Il castello di sabbia', categoria: 'costruzione',
    passi: ['🏖️', '🪣', '🏰'] },
  /* la barchetta di legno era 🪵 🔧 ⛵: la chiave inglese sul legno, e
     una barca a vela alla fine. Al suo posto il pacco, il nastro, il
     regalo — tre disegni che un bambino ha in mano davvero. */
  { chiave: 'regalo', nome: 'Si prepara il regalo', categoria: 'costruzione',
    passi: ['📦', '🎀', '🎁'] },

  /* ── cucina ── */
  { chiave: 'patatine', nome: 'Le patatine fritte', categoria: 'cucina',
    passi: ['🥔', '🔪', '🍳', '🍟'] },
  /* il cupcake non è la torta a metà strada, è un'altra torta più
     piccola. Adesso: il cioccolato, la ciotola, il forno, la torta —
     e non l'uovo, che avrebbe fatto cominciare due storie di cucina
     nello stesso modo (🥚 🔥 …) con due finali buoni tutti e due. */
  { chiave: 'torta-compleanno', nome: 'La torta di compleanno', categoria: 'cucina',
    passi: ['🍫', '🥣', '🔥', '🎂'] },
  { chiave: 'uovo-fritto', nome: "L'uovo fritto", categoria: 'cucina',
    passi: ['🥚', '🔥', '🍳'] },
  /* era il caffè, coi chicchi resi da 🫘 — che su mezzo mondo è un
     fagiolo. Il mais che scoppia è la stessa storia (una cosa dura, il
     fuoco, una cosa da mangiare) e si riconosce senza spiegazioni. */
  { chiave: 'popcorn', nome: 'Il mais diventa popcorn', categoria: 'cucina',
    passi: ['🌽', '🔥', '🍿'] },
  /* il pomodoro e il formaggio andavano sulla pizza insieme: chi li
     invertiva prendeva un errore per niente. Resta il pomodoro, e in
     mezzo ci va il forno. */
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
  /* finiva col panorama 🏞️, come il giro in bicicletta: in «cosa c'era
     prima?» si vedeva la stessa fine per due storie diverse, e l'auto
     era una risposta buona quanto la bici */
  { chiave: 'macchina', nome: 'Il viaggio in macchina fino in montagna', categoria: 'viaggio',
    passi: ['🚗', '⛽', '🏔️'] },
  /* l'ancora non è il prima della nave: è un pezzo della nave, e a
     quattro anni non si sa nemmeno cos'è */
  { chiave: 'nave', nome: 'Il viaggio in nave', categoria: 'viaggio',
    passi: ['🧳', '🚢', '🏝️'] },
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
  /* «cosa viene dopo» fa vedere i primi due passi, «cosa c'era prima»
     gli ultimi due: se due storie qualsiasi condividessero quella
     coppia, la domanda avrebbe due risposte giuste — e il gioco ne
     conterebbe buona una sola. I distrattori vengono dalle altre storie
     della stessa tappa, e una tappa può mescolare tutte le categorie:
     perciò le coppie si controllano fra tutte le storie, non solo
     dentro la stessa categoria. */
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
    /* un'emoji che tornasse due volte nella stessa storia potrebbe stare
       in due punti diversi della fila: è la storia ambigua di cui parla
       il capitolato, ed è per questo che non si ammette mai */
    if (new Set(s.passi).size !== (s.passi || []).length)
      guasti.push(`${dove}: un'emoji ripetuta dentro la stessa storia`)
    const fila = JSON.stringify(s.passi)
    if (sequenzeViste.has(fila))
      guasti.push(`${dove}: stessa fila di passi di "${sequenzeViste.get(fila)}"`)
    else sequenzeViste.set(fila, s.chiave)

    const passi = Array.isArray(s.passi) ? s.passi : []
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
