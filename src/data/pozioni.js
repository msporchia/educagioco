/* ═══════════════════════════════════════════════════════════════════
   IL LABORATORIO DELLE POZIONI — le misure, ma col gesto giusto.

   La ricetta è scritta in unità GRANDI (0,75 l · 1,4 kg · 0,3 m).
   Gli strumenti del banco sono tarati in unità PICCOLE (ml · g · cm).
   La conversione non è una domanda: è il modo di usare l'attrezzo.

   Tre attrezzi, tre gesti diversi:
     versa   tieni premuto, il liquido sale, molli al punto giusto
     pesa    metti i pesi sul piatto finché non fanno la quantità
     taglia  trascini la lama sul righello e tagli sulla tacca
   ═══════════════════════════════════════════════════════════════════ */

const caso = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const scegli = a => a[Math.floor(Math.random() * a.length)]

/* ---------- le scale, divise per attrezzo ----------
   L'`id` è il nome con cui le tappe della campagna le chiamano, ed è lo
   stesso pezzo di chiave che finisce nel motore di apprendimento. */
export const SCALE = [
  { tipo: 'liquido', da: 'l',  a: 'ml', k: 1000 },
  { tipo: 'liquido', da: 'l',  a: 'cl', k: 100 },
  { tipo: 'liquido', da: 'cl', a: 'ml', k: 10 },
  { tipo: 'polvere', da: 'kg', a: 'g',  k: 1000 },
  { tipo: 'polvere', da: 'hg', a: 'g',  k: 100 },
  { tipo: 'radice',  da: 'm',  a: 'cm', k: 100 },
  { tipo: 'radice',  da: 'm',  a: 'mm', k: 1000 },
  { tipo: 'radice',  da: 'dm', a: 'cm', k: 10 },
  { tipo: 'radice',  da: 'cm', a: 'mm', k: 10 },
].map(s => ({ ...s, id: s.da + '-' + s.a }))

export const SCALA = Object.fromEntries(SCALE.map(s => [s.id, s]))

export const ATTREZZI = {
  liquido: { nome: 'versa',  emoji: '🫗', verbo: 'Versa',  colore: '#4aa3ff' },
  polvere: { nome: 'pesa',   emoji: '⚖️', verbo: 'Pesa',   colore: '#c98adf' },
  radice:  { nome: 'taglia', emoji: '✂️', verbo: 'Taglia', colore: '#5fae4d' },
}

/* ═══════════ LA SCALA DELLE MISURE ═══════════
   Il promemoria appeso al muro del laboratorio. Mostra le unità in fila con
   il ×10 fra uno scalino e l'altro, e accende quelle in gioco — ma NON scrive
   il fattore fra le due: gli scalini vanno contati, che è poi tutto il punto.
   Serve a chi non si ricorda cos'è un hg, non a chi non vuole pensare. */
export const SCALINI = [
  // niente disegnini accanto ai nomi: qualunque icona qui finirebbe per
  // assomigliare a uno degli strumenti sullo scaffale, e si sceglierebbe
  // accoppiando i simboli invece di ragionare sulle unità
  { nome: 'Lunghezza', unita: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'] },
  { nome: 'Massa',     unita: ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'] },
  { nome: 'Capacità',  unita: ['kl', 'hl', 'dal', 'l', 'dl', 'cl', 'ml'] },
]

/* ---------- la dispensa ----------
   Nessun ingrediente può essere un recipiente: 🧪 e 🍯 stavano accanto alla
   dose sulla pergamena ed erano gli stessi disegni del cilindro e del
   misurino sullo scaffale, così l'attrezzo si sceglieva accoppiando le
   figure. Qui dentro ci sono solo bestie, piante e cose del cielo — mai
   qualcosa in cui si possa versare. Lo controlla il test di unità. */
export const INGREDIENTI = [
  // liquidi
  { emoji: '🐉', nome: 'bava di drago',     tipo: 'liquido', colore: '#5ec46a' },
  { emoji: '🐸', nome: 'essenza di rana',   tipo: 'liquido', colore: '#7fd4c1' },
  { emoji: '🌊', nome: 'acqua di sirena',   tipo: 'liquido', colore: '#4aa3ff' },
  { emoji: '🦉', nome: 'sciroppo di gufo',  tipo: 'liquido', colore: '#e2a53a' },
  { emoji: '🩸', nome: 'succo di rapa',     tipo: 'liquido', colore: '#d0455e' },
  { emoji: '🫧', nome: 'schiuma di nuvola', tipo: 'liquido', colore: '#c3d9ef' },
  { emoji: '🍇', nome: 'mosto di strega',   tipo: 'liquido', colore: '#8b5cc4' },
  // polveri
  { emoji: '🌙', nome: 'polvere di luna',   tipo: 'polvere', colore: '#d9defc' },
  { emoji: '⭐', nome: 'stelle tritate',     tipo: 'polvere', colore: '#ffd85e' },
  { emoji: '🍄', nome: 'funghi secchi',     tipo: 'polvere', colore: '#c06a4a' },
  { emoji: '🐚', nome: 'conchiglia pestata', tipo: 'polvere', colore: '#eef1f5' },
  { emoji: '☄️', nome: 'cenere di cometa',  tipo: 'polvere', colore: '#8b8f9a' },
  { emoji: '🌰', nome: 'ghiande macinate',  tipo: 'polvere', colore: '#a97142' },
  // radici e rami
  { emoji: '🌿', nome: 'radice di mandragora', tipo: 'radice', colore: '#4f9e4a' },
  { emoji: '🪵', nome: 'ramo di quercia',      tipo: 'radice', colore: '#a9713c' },
  { emoji: '🦴', nome: 'osso di troll',        tipo: 'radice', colore: '#e8e2d2' },
  { emoji: '🪱', nome: 'verme di palude',      tipo: 'radice', colore: '#d08fa0' },
  { emoji: '🌾', nome: 'stelo dorato',         tipo: 'radice', colore: '#e0c25a' },
]

/* ═══════════ IL COLORE DEL CALDERONE ═══════════
   Media GEOMETRICA dei canali, non aritmetica: è la mescolanza vera, quella
   dei colori che si sporcano fra loro. Giallo e blu fanno verde, rosso e blu
   fanno viola; con la media aritmetica farebbero grigio tutti e due, e un
   bambino che rovescia il giallo nel blu si aspetta il verde.
   La geometrica, a differenza del prodotto secco, non scivola verso il nero
   quando gli ingredienti sono tre. */
export function mescola(colori, vuoto = '#4b3f7d') {
  if (!colori || !colori.length) return vuoto
  const canali = colori.map(h => [1, 3, 5].map(i => Math.max(10, parseInt(h.slice(i, i + 2), 16))))
  const uno = n => Math.round(canali.reduce((p, c) => p * c[n], 1) ** (1 / canali.length))
  return '#' + [0, 1, 2].map(n => uno(n).toString(16).padStart(2, '0')).join('')
}

/* ---------- le pozioni: solo il nome e il colore del calderone ---------- */
export const POZIONI = [
  { nome: 'Pozione del Coraggio',  emoji: '🦁', colore: '#e2603a' },
  { nome: 'Pozione dell\'Invisibilità', emoji: '👻', colore: '#9fb8d4' },
  { nome: 'Elisir di Volo',        emoji: '🪽', colore: '#6ec6ff' },
  { nome: 'Filtro della Risata',   emoji: '😂', colore: '#f2c33d' },
  { nome: 'Pozione della Forza',   emoji: '💪', colore: '#c0453f' },
  { nome: 'Sciroppo dei Sogni',    emoji: '🌜', colore: '#8b7ed8' },
  { nome: 'Elisir di Velocità',    emoji: '⚡', colore: '#ffd400' },
  { nome: 'Pozione Parlante',      emoji: '🗣️', colore: '#4bb37b' },
  { nome: 'Filtro Antipuzza',      emoji: '🌸', colore: '#e58fb8' },
  { nome: 'Pozione del Gigante',   emoji: '🗿', colore: '#8d9aa5' },
]

export const CLIENTI = ['🧙', '🧝', '🧚', '🧛', '🧜', '🦉', '🐈‍⬛', '🐸', '🦇', '🧌', '👽', '🤖']

/* I clienti esigenti — quelli che portano la mancia. Si riconoscono prima di
   cominciare: chi arriva in carrozza vuole la pozione fatta bene. */
export const ESIGENTI = ['👑', '🧞', '🐲', '🦄', '🧙‍♀️', '🎩']

/* ---------- taratura per livello ----------
   Il passo è quello che decide tutto: a passo 0,5 la ricetta dice "1,5 l" e
   basta aggiungere gli zeri; a passo 0,01 dice "2,37 l" e bisogna aver capito
   davvero che il ml è un millesimo. Serve solo al **laboratorio libero**:
   nella campagna il passo lo scrive la tappa, vedi TAPPE. */
export function taratura(lv) {
  return {
    passo:      lv <= 1 ? 50 : lv === 2 ? 25 : lv === 3 ? 10 : lv === 4 ? 5 : 1, // centesimi
    ingredienti: lv <= 2 ? 2 : lv <= 4 ? [2, 3] : 3,
  }
}

/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA — la fila delle tappe

   Di una tappa si scrivono a mano solo le cose che si raccontano: il
   nome, quali conversioni entrano, quanto fine è il passo, quanti
   ingredienti e quanti clienti. **La pazienza no**: quella si calcola
   dal lavoro che la ricetta chiede davvero, perché dipende da quanti
   pesi vanno sul piatto e da quanto è alta la boccia, e a mano si
   sbaglia ogni volta che si tocca un numero.

   L'ordine non è per grandezza del fattore ma per **familiarità
   dell'unità**: `1 kg = 1000 g` un bambino lo sa già, mentre `2,7 hg`
   chiede prima di sapere cos'è un ettogrammo. Quindi le ×1000 vengono
   prima delle ×10, e il gesto nuovo arriva sempre da solo, con la
   conversione più facile della sua famiglia.

   La promessa della campagna, verificata dai test:

     chi sa convertire e non sbaglia consegna la pozione con almeno
     metà del tempo ancora in mano, e arriva in fondo alla tappa senza
     perdere un cuore.
   ═══════════════════════════════════════════════════════════════════ */

export const CUORI = 3, CUORI_MAX = 5

const RACCONTO = [
  { id: 'bilancia', nome: 'La bilancia', emoji: '⚖️',
    dritta: 'La ricetta parla di chili, la bilancia conta in grammi.',
    scale: ['kg-g'], passo: 50, ingredienti: 1, clienti: 5, esigenti: 0 },

  { id: 'peso', nome: 'Il peso giusto', emoji: '🧂',
    dritta: 'Arriva l\'ettogrammo: cento grammi, uno scalino solo sotto il chilo.',
    scale: ['kg-g', 'hg-g'], passo: 25, ingredienti: 2, clienti: 5, esigenti: 1 },

  { id: 'righello', nome: 'Il righello', emoji: '📏',
    dritta: 'Si taglia invece di pesare. Un metro sono cento centimetri.',
    scale: ['m-cm'], passo: 50, ingredienti: 2, clienti: 5, esigenti: 1 },

  { id: 'sarto', nome: 'Il metro da sarto', emoji: '🎗️',
    dritta: 'Roba corta, da millimetri: dieci in un centimetro.',
    scale: ['m-cm', 'cm-mm'], passo: 10, ingredienti: 2, clienti: 6, esigenti: 1 },

  { id: 'caraffa', nome: 'La caraffa', emoji: '🫙',
    dritta: 'Si versa. Un litro sono mille millilitri, come il chilo coi grammi.',
    scale: ['l-ml'], passo: 25, ingredienti: 2, clienti: 6, esigenti: 1 },

  { id: 'boccette', nome: 'Le boccette', emoji: '🧪',
    dritta: 'Il centilitro sta in mezzo: cento in un litro, dieci millilitri l\'uno.',
    scale: ['l-ml', 'l-cl', 'cl-ml'], passo: 10, ingredienti: 2, clienti: 6, esigenti: 2 },

  /* Il salto vero: due ingredienti della stessa pozione chiedono due
     attrezzi diversi, e la testa deve cambiare mestiere a metà ricetta. */
  { id: 'pesoemisura', nome: 'Peso e misura', emoji: '⚖️📏',
    dritta: 'Pesare e tagliare nella stessa pozione. Occhio a decimetri e millimetri.',
    scale: ['kg-g', 'hg-g', 'm-cm', 'm-mm', 'dm-cm'], passo: 10,
    ingredienti: 3, clienti: 6, esigenti: 2 },

  { id: 'calderone', nome: 'Il grande calderone', emoji: '🔮',
    dritta: 'Tutte e nove le conversioni, e i numeri con due decimali.',
    scale: SCALE.map(s => s.id), passo: 5, passoFine: 1,
    ingredienti: 3, clienti: 7, esigenti: 2 },
]

/* ── quanto fine può essere il passo su una certa scala ──
   0,05 dm sarebbero mezzo millimetro, e mezzo millimetro non si taglia: le
   scale ×10 reggono solo i passi larghi. La tappa dice il passo come **tetto
   di finezza**, non come obbligo, e ogni scala scende fin dove può: così una
   tappa fine che contiene anche cm→mm degrada da sola invece di restare
   senza conversioni giocabili. */
export const PASSI = [50, 25, 10, 5, 1]
export const passiDi = scala => PASSI.filter(p => (scala.k * p) % 100 === 0)
export function passoPer(scala, tetto) {
  const buoni = passiDi(scala)
  return buoni.find(p => p <= tetto) ?? buoni[buoni.length - 1]
}

/* Il passo di una tappa cammina dentro la tappa stessa quando c'è un
   `passoFine`: il grande calderone comincia a 0,05 e finisce a 0,01, come la
   giornata di mercato stringe il tempo cliente dopo cliente. */
export function passoAl(tappa, n = 0) {
  if (!tappa.passoFine || tappa.clienti < 2) return tappa.passo
  const q = Math.min(1, n / (tappa.clienti - 1))
  const da = PASSI.indexOf(tappa.passo), a = PASSI.indexOf(tappa.passoFine)
  return PASSI[Math.round(da + (a - da) * q)]
}

export const scaleDi = tappa => tappa.scale.map(id => SCALA[id]).filter(Boolean)

/* Il cliente esigente 👑 — quello che porta la mancia. Ne arriva uno ogni
   tot, e l'ultimo della tappa lo è sempre: la tappa finisce in salita. */
export function esigenteAl(tappa, n) {
  if (!tappa.esigenti) return false
  return (tappa.clienti - 1 - n) % Math.ceil(tappa.clienti / tappa.esigenti) === 0
}

/* ── quanto lavoro chiede una dose, in secondi ──
   Non è un numero a caso: è il tempo di chi sa già cosa fare. Guardare lo
   scaffale e scegliere l'attrezzo, convertire la dose nell'unità
   dell'attrezzo, e poi il gesto — che costa diverso a seconda di quale è:
   mettere sette pesi sul piatto è più lento che trascinare una lama una
   volta sola. */
export const TEMPI = { scelta: 6, pensiero: 8, versa: 4, pesa: 1.2, taglia: 3 }

export function costoDi(ing) {
  const str = ing.attrezzi.find(a => vaBene(a, ing.piccolo)) || ing.attrezzi[0]
  let gesto = TEMPI.taglia
  if (ing.scala.tipo === 'liquido') gesto = TEMPI.versa + 5 * (ing.piccolo / str.cap)
  if (ing.scala.tipo === 'polvere') gesto = TEMPI.pesa * scomponi(ing.piccolo, str.pesi).length + 1
  return TEMPI.scelta + TEMPI.pensiero + gesto
}

/* Quanto respiro dà il cliente: il lavoro della sua ricetta per il margine
   della tappa. Largo all'inizio — chi sta imparando dove si tocca merita di
   guardarsi intorno — e sempre più stretto, fino a restare una sfida vera. */
export const MARGINE_LARGO = 2.4, MARGINE_STRETTO = 1.5, PAZIENZA_MINIMA = 45
export function margineDi(i, quante = RACCONTO.length) {
  if (i < 0) return 1.8                    // laboratorio libero
  const q = quante > 1 ? i / (quante - 1) : 1
  return MARGINE_LARGO + (MARGINE_STRETTO - MARGINE_LARGO) * q
}
/* il pavimento non è generosità: alla prima tappa il tempo se ne va a leggere
   il cartello e a guardarsi intorno, non a convertire */
export const pazienzaDi = (ingredienti, margine) =>
  Math.max(PAZIENZA_MINIMA,
           Math.round(margine * ingredienti.reduce((s, i) => s + costoDi(i), 0)))

/* ── quanto è dura una tappa ──
   Serve a controllare che la campagna salga davvero, e va detto con un
   numero solo perché le leve sono quattro e a occhio si sbaglia. Non è
   però una scala monotona dall'inizio alla fine, ed è voluto: **la
   campagna va a coppie**. La tappa che porta un gesto nuovo riparte coi
   numeri facili — si impara una cosa per volta — e solo la seconda della
   coppia stringe il passo. Il test verifica proprio questo disegno. */
/* la radice, non il rapporto secco: fra 0,5 e 0,01 ci sono cinquanta volte,
   ma non è cinquanta volte più difficile — è un decimale in più da tenere */
export const finezza = passo => Math.sqrt(100 / passo)
export function faticaDi(t) {
  const ing = Array.isArray(t.ingredienti)
    ? (t.ingredienti[0] + t.ingredienti[1]) / 2 : t.ingredienti
  const famiglie = new Set(scaleDi(t).map(s => s.tipo)).size
  return ing * finezza(t.passoFine || t.passo) *
         (1 + 0.35 * (famiglie - 1)) * (1 + 0.08 * (t.scale.length - 1))
}

/* quante dosi chiede una tappa a chi la finisce: è il lavoro vero, e da lì
   escono le monete — una ogni dieci, lo stesso metro di tutti gli altri
   giochi, se no una campagna svaluta le altre */
export const dosatureDi = t =>
  t.clienti * (Array.isArray(t.ingredienti)
    ? (t.ingredienti[0] + t.ingredienti[1]) / 2 : t.ingredienti) + (t.esigenti || 0)
export const premioTappa = i => Math.max(1, Math.round(dosatureDi(TAPPE[i]) / 10))

export const TAPPE = RACCONTO.map((t, i) => ({ ...t, margine: margineDi(i, RACCONTO.length) }))

/* Il laboratorio libero: nessuna tappa, nessuna fine. Le conversioni sono
   tutte e il passo lo dà il motore di apprendimento — è l'unico posto dove
   la difficoltà la decide quanto si sa, e non a che punto del viaggio si è. */
export function laboratorioLibero(lv) {
  const t = taratura(lv)
  return { id: 'libero', nome: 'Laboratorio libero', emoji: '♾️', libero: true,
           scale: SCALE.map(s => s.id), passo: t.passo, ingredienti: t.ingredienti,
           clienti: Infinity, esigenti: 0, margine: margineDi(-1) }
}

/* ═══════════ GLI STRUMENTI ═══════════
   Il punto delicato di tutto il gioco. Se lo strumento è tarato SULLA DOSE
   (una boccia che finisce sempre poco sopra la risposta) allora la scala del
   cursore dà via la risposta da sola: basta fermarsi in cima e non serve aver
   capito niente. Quindi gli strumenti sono un catalogo FISSO, sempre lo stesso,
   e la prima mossa è sceglierne uno.

   Scegliere è già matematica: serve uno strumento abbastanza grande da
   contenere la dose e abbastanza fine da poterla segnare esattamente. Per
   sapere se 0,75 l ci stanno nel cilindro da 500 ml bisogna aver convertito. */

export const STRUMENTI = {
  // capienza e grana in unità base: ml per i liquidi, g per le polveri,
  // mm per le lunghezze. Ogni strumento ha da 10 a 40 tacche, mai di più.
  liquido: [
    { emoji: '🥃', nome: 'misurino',  cap: 50,    grana: 5 },
    { emoji: '🧉', nome: 'bicchiere', cap: 200,   grana: 20 },
    { emoji: '🧪', nome: 'cilindro',  cap: 500,   grana: 50 },
    { emoji: '🫙', nome: 'caraffa',   cap: 2000,  grana: 100 },
    { emoji: '🪣', nome: 'secchio',   cap: 5000,  grana: 250 },
  ],
  polvere: [
    { emoji: '⚗️', nome: 'bilancino', cap: 200,   grana: 1 },
    { emoji: '⚖️', nome: 'bilancia',  cap: 2000,  grana: 5 },
    { emoji: '🏋️', nome: 'stadera',   cap: 20000, grana: 50 },
  ],
  // Le misure di lunghezza sono quelle che un bambino ha in mano davvero: il
  // righello dell'astuccio, la squadra, il metro da sarto della mamma, la
  // corda con un nodo ogni mezzo metro. La «rotella» di prima non diceva
  // niente a nessuno, e il metro si fermava a 1 m — che è poi il numero meno
  // interessante di tutti, perché non c'è niente da convertire.
  radice: [
    { emoji: '📏', nome: 'righello',       cap: 150,   grana: 5 },
    { emoji: '📐', nome: 'squadra',        cap: 300,   grana: 10 },
    { emoji: '🎗️', nome: 'metro da sarto', cap: 2000,  grana: 50 },
    { emoji: '🪢', nome: 'corda annodata', cap: 10000, grana: 500 },
  ],
}

/* quanto vale l'unità piccola della scala nell'unità base dello strumento */
export const BASE = { ml: 1, cl: 10, g: 1, cm: 10, mm: 1 }

/* quanto vale un'unità qualsiasi nella base dello strumento (ml, g, mm) */
const VALE = { ml: 1, cl: 10, dl: 100, l: 1000,
               g: 1, dag: 10, hg: 100, kg: 1000,
               mm: 1, cm: 10, dm: 100, m: 1000 }

/* ═══════════ COME SI LEGGE UN ATTREZZO ═══════════
   La capienza si scrive nell'unità in cui la direbbe una persona: un metro
   da sarto è «fino a 2 m», non «fino a 200 cm». Le tacche invece restano
   nell'unità piccola, quella con cui si dosa. Il cartellino dice quindi due
   unità diverse — «fino a 2 m · tacche da 5 cm» — ed è voluto: fra sapere se
   1,4 m ci stanno e sapere se cadono su una tacca c'è un ×100 da fare, ed è
   tutto il gioco.

   Le unità però restano LE DUE della scala in corso, mai una terza: mentre si
   dosa in cl, un bicchiere «da 200 ml» avrebbe messo in campo tre unità
   diverse in una riga sola, e la conversione da fare sarebbe diventata due. */
export function capienza(str, scala) {
  for (const u of [scala.da, scala.a]) {
    const v = str.cap / VALE[u]
    if (Number.isInteger(v) && v >= 1) return { v, u }
  }
  return { v: str.cap / VALE[scala.a], u: scala.a }
}

const PESI = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]

/* lo strumento visto nell'unità della scala in cui è scritta la ricetta */
export function tara(str, scala) {
  const f = BASE[scala.a]
  if (str.grana % f !== 0) return null            // tacche a mezza unità: inusabile
  const cap = str.cap / f, grana = str.grana / f
  const tacche = Math.round(cap / grana)
  const ogni = tacche <= 12 ? 1 : tacche <= 24 ? 2 : 5
  return { ...str, cap, grana, tacche, etichetta: grana * ogni, unita: scala.a,
           quanto: capienza(str, scala),
           pesi: PESI.filter(p => p >= str.grana && p <= str.cap).map(p => p / f) }
}

/* Gli strumenti sullo scaffale per questa scala. Fuori quelli fuori misura —
   la dose non passa mai le 3 unità grandi, e una corda da 10 m davanti a una
   dose di 2 cm non è una scelta sbagliata, è una scelta che nessuno farebbe;
   sul cartellino poi diventava «fino a 1000 cm», che non lo scrive nessuno.
   Uno di troppo grosso però resta sempre, il più piccolo fra quelli esclusi:
   se andassero bene tutti, scegliere non sarebbe più una domanda. */
export function scaffale(scala) {
  const limite = 30 * scala.k * BASE[scala.a]
  const buoni = STRUMENTI[scala.tipo].filter(s => s.cap <= limite)
  const grosso = STRUMENTI[scala.tipo].find(s => s.cap > limite)
  return [...buoni, ...(grosso ? [grosso] : [])].map(s => tara(s, scala)).filter(Boolean)
}

/* ci si arriva con questo strumento? deve contenere la dose e avere una tacca
   proprio lì sopra */
export const vaBene = (str, dose) => !!str && dose <= str.cap && dose % str.grana === 0

/* ═══════════ generazione ═══════════ */

const mcd = (a, b) => (b ? mcd(b, a % b) : a)
const mcm = (a, b) => a / mcd(a, b) * b

export function generaIngrediente(tappa, scala = scegli(scaleDi(tappa)), passo = tappa.passo) {
  // la scala non regge tutti i passi: 0,25 cm sarebbero 2,5 mm, e mezzo
  // millimetro su un righello non lo si taglia. Il passo della tappa è un
  // tetto, e ogni scala scende fin dove può.
  const grana = passoPer(scala, passo) * scala.k / 100   // distanza fra due risposte
  const attrezzi = scaffale(scala)

  // Si sceglie prima uno strumento e POI la dose fra quelle che quello
  // strumento sa segnare: così esiste sempre almeno una via, e la dose cade
  // ogni volta in un punto diverso della scala invece che sempre in cima.
  let str = null, passoDose = 0, nMax = 0, nMin = 0
  for (let g = 0; g < 24 && !nMax; g++) {
    str = scegli(attrezzi)
    passoDose = mcm(grana, str.grana)
    nMax = Math.min(Math.floor(str.cap / passoDose), Math.floor(3 * scala.k / passoDose))
    nMin = Math.max(1, Math.ceil(10 / passoDose))
    if (nMin > nMax) nMax = 0
  }
  if (!nMax) { passoDose = grana; nMin = 1; nMax = Math.max(1, Math.floor(3 * scala.k / grana)) }

  const piccolo = caso(nMin, nMax) * passoDose
  const grande = piccolo / scala.k
  const ing = scegli(INGREDIENTI.filter(i => i.tipo === scala.tipo))

  return {
    ...ing, scala, grande, piccolo, grana,
    attrezzi, buoni: attrezzi.filter(a => vaBene(a, piccolo)).map(a => a.nome),
    testo: String(grande).replace('.', ',') + ' ' + scala.da,
    chiave: 'pozioni:' + scala.da + '-' + scala.a,
    fatto: false,
  }
}

/* ── un cliente della tappa ──
   `n` è il numero del cliente dentro la tappa: da lì escono il passo (che nel
   grande calderone si stringe strada facendo) e se è uno di quelli esigenti.

   `pesca` è la mano del motore di apprendimento: nel laboratorio libero
   sceglie quale conversione far uscire, in campagna non c'è e le conversioni
   sono quelle della tappa, in ordine sparso. */
export function generaRicetta(tappa, { n = 0, pesca = scegli } = {}) {
  const esigente = esigenteAl(tappa, n)
  const scale = scaleDi(tappa)
  const passo = passoAl(tappa, n)
  const quanti = Array.isArray(tappa.ingredienti) ? caso(...tappa.ingredienti) : tappa.ingredienti
  const n_ing = quanti + (esigente ? 1 : 0)

  const lista = []
  const visti = new Set()
  let guardia = 0
  while (lista.length < n_ing && guardia++ < 200) {
    // l'esigente apre con la conversione appena entrata nella tappa: l'ultima
    // dell'elenco è sempre quella nuova
    const scala = esigente && !lista.length ? scale[scale.length - 1] : pesca(scale)
    const i = generaIngrediente(tappa, scala, passo)
    if (visti.has(i.nome)) continue
    visti.add(i.nome)
    lista.push(i)
  }
  return {
    ...scegli(POZIONI),
    cliente: esigente ? scegli(ESIGENTI) : scegli(CLIENTI),
    esigente, n,
    ingredienti: lista,
    pazienza: pazienzaDi(lista, tappa.margine ?? margineDi(-1)),
  }
}

/* La cifra composta col minor numero di pesi: serve per il bonus e ai test.
   Con i pesi veri (1,2,5,10,…) prendere sempre il più grande dà il minimo. */
export function scomponi(v, disponibili = PESI) {
  const out = []
  let r = v
  for (const p of [...disponibili].sort((a, b) => b - a)) while (r >= p) { out.push(p); r -= p }
  return out
}

export const misura = (v, u) => String(v).replace('.', ',') + ' ' + u
