<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO — tutto quello che è PIXEL, e niente altro

   Qui dentro sta il mestiere del disegno: la tela, il fondale, la
   camera, quanto è grande una cella, l'interpolazione fra un passo e
   quello dopo, il dito che trascina. Fuori di qui non se ne parla
   più — chi gioca dice COSA c'è in scena, questo file dice DOVE
   finisce sullo schermo.

   È la stessa divisione che il resto del progetto ha già fra
   `motore/` e `grafica/`, portata un gradino più in su: prima stava
   tutta dentro `GeneraleGame.vue`, e ogni tocco su un ordine
   rientrava nel giro del disegno perché erano lo stesso file.

   ── il patto con chi lo usa ─────────────────────────────────────
   ENTRA (props): il mondo com'è adesso, il livello, quanto dura un
   passo, i giri di ronda da far vedere (come liste di NOMI, non di
   pixel), i bersagli accesi, e chi sono i miei.
   ESCE: `tocca` con la casella toccata — cosa voglia dire toccarla
   lo sa il gioco, non il campo.
   SI COMANDA (defineExpose): `misura`, `disegna`, `inquadraSu`,
   `mostraTutto`, `azzera`, `animaPasso`, `puntoDi`.

   ── quanto si vede, e chi lo decide ──
   La stanza si guarda con due dita o coi due tasti in un angolo, fra
   un minimo in cui **ci sta tutta** e un massimo di due volte. La
   vista non insegue nessuno: al via si allarga per far vedere l'intera
   mappa, e da lì sta ferma. Inseguire l'unità di turno faceva
   scattare la mappa a ogni passo, e si perdeva proprio il filo di
   quello che si stava guardando.

   `mondo` è un oggetto grosso e mutabile e non è reattivo: si guarda
   attraverso `tic`, che batte a ogni passo. È la stessa scelta del
   castello, e vale identica qui dentro.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, watch, nextTick } from 'vue'
import { ilSegnale, laCosa, distanze } from '../../motore/generale.js'
import { cerchio } from './segni.js'
import { creaTela } from '../../grafica/tela.js'
import { PITTORI, OGGETTI } from '../../grafica/generale.js'
import { creaFondale } from '../../grafica/ambienti.js'

const props = defineProps({
  /* IL MONDO ARRIVA COME FUNZIONE, non come oggetto. Non è un vezzo: il
     gioco lo ricrea da capo a ogni scena, e una prop si aggiorna al
     prossimo disegno — cioè un attimo dopo. In quell'attimo qui si
     azzererebbe l'animazione del mondo di prima. Chiedendolo si ha
     sempre quello di adesso. */
  mondoOra: { type: Function, default: () => null },
  liv: { type: Object, required: true },
  vel: { type: Number, default: 180 },
  tic: { type: Number, default: 0 },          // batte a ogni passo: rinfresca le pastiglie
  /* i giri di ronda da mostrare, detti come li dice il piano:
     `{ punti: [nomi], ora }`. Da nome a pixel ci pensa questo file. */
  giri: { type: Array, default: () => [] },
  bersagli: { type: Array, default: () => [] },
  mirando: { type: Boolean, default: false },  // si sta scegliendo un bersaglio
  mie: { type: Array, default: () => [] },     // le unità del giocatore
  /* chi ha la scheda aperta: la sua roba si annota sul campo, quella
     degli altri no. Una targhetta su ogni guardia era rumore addosso
     alla mappa — il nome di una cosa si legge quando l'hai chiesta. */
  aperta: { type: String, default: '' },
})
const emit = defineEmits(['tocca'])

const telaEl = ref(null)
const altoCampo = ref('36vh')
const grande = ref(false)                      // la mappa è più larga della finestra?
const camK = ref(0)                            // batte quando la vista si sposta
const sottoIlDito = ref(null)                  // la casella accesa prima di staccare il dito

let tela = null, fondale = null, lato = 26
let prec = {}, andature = {}, animT0 = 0
/* quando ogni forziere si è spalancato: serve solo a far durare il
   momento, e si butta a ogni scena nuova (`azzera`) — se no una cassa
   già aperta in una battaglia riparte con la seconda già finita */
const apertoDa = {}
const cam = { x: 0, y: 0 }
const mondo = () => props.mondoOra()

/* ═══════════ l'ingrandimento ═══════════
   `lato` è sempre `latoBase * zoom`: la misura la decide `misura()`
   guardando la finestra, e lo zoom è quello che ci mette sopra chi
   guarda con due dita. Tenerli separati serve a non perdere la misura
   giusta — a zoom 1 si torna esattamente a com'era, sempre.

   ── perché lo zoom ha un tetto, e perché il tetto cambia ──
   Il fondale è una tela di scorta grande quanto **tutta la mappa**
   (`mappa.js`), e la sua memoria cresce col quadrato dello zoom: una
   30×18 a lato 36 sta su undici mega, la stessa a zoom 2 su
   quarantacinque. È il conto che `mappa.js` avverte di non fare, e su
   un telefono è il modo più diretto per far chiudere la scheda.

   Quindi il tetto non è un numero fisso ma **quello che ci sta in un
   tetto di memoria**: una stanza piccola si può guardare da vicino,
   una grande un po' meno. Il conto sta in `zoomMassimo()`. */
const TETTO_FONDALE = 22 * 1048576        // byte: il fondale non passa di qui
let latoBase = 26, zoom = 1

function zoomMassimo () {
  if (!mondo()) return 1
  const dpr = Math.min(2, window.devicePixelRatio || 1)   // `creaFondale` lo cappa a 2
  const perCella = latoBase * latoBase * dpr * dpr * 4
  const z = Math.sqrt(TETTO_FONDALE / (mondo().w * mondo().h * perCella))
  /* Due tetti, e vince il più basso. Il primo è la memoria (sopra). Il
     secondo è il senso: a cella doppia un personaggio è alto ottanta
     pixel e in uno schermo di telefono ci stanno cinque caselle — più
     in là non si sta guardando meglio, si sta guardando un dettaglio
     senza sapere più dove si è. */
  return Math.max(1, Math.min(2, z))
}

/* ── e fin dove ci si allontana ──
   Fino a **vedere tutta la stanza, e non oltre**: una volta che la
   mappa ci sta tutta, allontanarsi ancora aggiunge solo bande vuote
   attorno e rimpicciolisce le figure per niente.

   Per le mappe che già ci stanno il minimo è 1, cioè la misura decisa
   da `misura()`: lì non c'è nessuna vista d'insieme da guadagnare.
   Per quelle grandi si scende sotto 1, ma la cella non va mai sotto i
   diciotto pixel — più piccola di così un orco e una cassa tornano la
   stessa macchia, che è il motivo per cui `misura()` non scende sotto
   i trentadue in partenza. */
function zoomMinimo () {
  if (!mondo() || !tela) return 1
  const { W, H } = tela.misure
  if (!W || !H) return 1
  const staTutta = Math.min(W / (mondo().w * latoBase), H / (mondo().h * latoBase))
  return Math.max(18 / latoBase, Math.min(1, staTutta))
}

/* ═══════════ misurare ═══════════ */
async function misura () {
  if (!telaEl.value || !mondo()) return
  const largo = telaEl.value.parentElement.getBoundingClientRect().width
  if (!largo) return
  /* La cella non scende mai sotto i venti pixel: meglio una mappa da
     trascinare che dei personaggi grandi come una briciola. Deciso il
     lato, il campo si stringe sulla mappa invece di lasciare due bande
     nere — tranne quando la mappa è più alta di quanto ci sta. */
  const massimo = Math.max(150, Math.round(window.innerHeight * 0.4))
  /* LA CELLA NON SI RIMPICCIOLISCE PER FAR STARE LA MAPPA. Le mappe
     delle storie sono 30×18: farcele stare tutte in un telefono voleva
     dire celle da venti pixel, e a venti pixel un orco e una cassa sono
     la stessa macchia grigia. La grafica è tarata su 36; sotto i 32 non
     si scende mai. Se la mappa non ci sta, **si scorre** — il
     trascinamento e le frecce sul bordo esistono apposta. */
  const sta = Math.floor(Math.min(largo / mondo().w, massimo / mondo().h))
  /* ── E NON SI RIMPICCIOLISCE PER FAR STARE LA MAPPA ──
     C'era un `intera: true` che lo faceva: scendeva fino a 22 pixel per
     cella pur di mostrare tutto. Il prezzo non era la leggibilità — era
     che chi scriveva i livelli disegnava mappe piccole per stare dentro
     quel vincolo. Le mappe grandi si trascinano: è quello che il campo
     sa fare da sempre, ed è anche quello che rende un piano lungo, cioè
     un lavoro invece di un gesto. */
  latoBase = sta >= 36 ? Math.min(46, sta)   // ci sta comoda: si prende quello che c'è
       : sta >= 32 ? sta                 // ci sta di misura: meglio tutta che da scorrere
       : 36                              // non ci sta: si legge e si scorre
  lato = Math.round(latoBase * zoom)   // i limiti si applicano sotto, quando la tela c'è
  /* l'altezza del campo resta quella della mappa **a zoom 1**: se
     crescesse con l'ingrandimento, avvicinarsi spingerebbe giù gli
     ordini e la fila dei comandi, e si starebbe zoomando la pagina
     invece della stanza */
  altoCampo.value = Math.min(massimo, mondo().h * latoBase) + 'px'
  await nextTick()
  if (!telaEl.value) return
  const r = telaEl.value.parentElement.getBoundingClientRect()
  grande.value = mondo().w * lato > r.width + 1 || mondo().h * lato > r.height + 1
  tela = creaTela(telaEl.value, PITTORI, { unita: 420, minimo: lato / 20, massimo: lato / 20 })
  tela.ridimensiona()
  /* IL SEME È L'ID DELLA TAPPA, e non la variante: le tre scene di un
     capitolo devono sembrare **lo stesso posto** con le cose spostate,
     se no rigiocare non è rigiocare, è un'altra mappa. Da qui esce
     dove sta ogni chiazza di materiale, e resta fermo per sempre:
     quello con la pozzanghera è quello con la pozzanghera. */
  /* i limiti si possono chiedere solo adesso: `zoomMinimo` guarda la
     tela, che un attimo fa non era ancora stata misurata */
  const z = Math.max(zoomMinimo(), Math.min(zoomMassimo(), zoom))
  if (z !== zoom) {
    zoom = z; lato = Math.round(latoBase * zoom)
    tela = creaTela(telaEl.value, PITTORI, { unita: 420, minimo: lato / 20, massimo: lato / 20 })
    tela.ridimensiona()
  }
  zoomOra.value = zoom
  /* la griglia la dice il mondo, non il livello: da quando una scena
     può ridisegnare la stanza, «com'è fatta» dipende dalla variante che
     si sta giocando */
  fondale = creaFondale({ mappa: (mondo() && mondo().campo.griglia) || [],
                          suoli: (mondo() && mondo().campo.suoli) || {},
                          muri: (mondo() && mondo().campo.muri) || {},
                          arredi: (mondo() && mondo().campo.arredi) || {},
                          ambiente: props.liv.ambiente, lato, seme: props.liv.id })
  latoFondale = lato
  limita(); rifaiFondale()
}

/* A che misura di cella è dipinta la stanza che abbiamo in cassaforte.
   Durante un pinch resta indietro rispetto a `lato`, ed è la differenza
   fra i due a dire di quanto va tirata (vedi `mostra` in `mappa.js`). */
let latoFondale = 26

/* La stanza nuova alla misura giusta. Costa quanto dipingere tutta la
   mappa, quindi non si chiama durante il gesto ma quando le dita si
   staccano. */
function ridipingiStanza () {
  if (!mondo() || !props.liv || lato === latoFondale) return
  /* la griglia la dice il mondo, non il livello: da quando una scena
     può ridisegnare la stanza, «com'è fatta» dipende dalla variante che
     si sta giocando */
  fondale = creaFondale({ mappa: (mondo() && mondo().campo.griglia) || [],
                          suoli: (mondo() && mondo().campo.suoli) || {},
                          muri: (mondo() && mondo().campo.muri) || {},
                          arredi: (mondo() && mondo().campo.arredi) || {},
                          ambiente: props.liv.ambiente, lato, seme: props.liv.id })
  latoFondale = lato
  tela = creaTela(telaEl.value, PITTORI, { unita: 420, minimo: lato / 20, massimo: lato / 20 })
  tela.ridimensiona()
  limita(); rifaiFondale()
}
function limita () {
  if (!telaEl.value || !mondo() || !tela) return
  const { W, H } = tela.misure
  const largo = mondo().w * lato, alto = mondo().h * lato
  cam.x = largo <= W ? (largo - W) / 2 : Math.max(0, Math.min(largo - W, cam.x))
  cam.y = alto <= H ? (alto - H) / 2 : Math.max(0, Math.min(alto - H, cam.y))
  camK.value++
}
function rifaiFondale () {
  if (!tela || !fondale) return
  const { W, H } = tela.misure
  /* l'unica cosa che questo file «disegna» è ricopiare la finestra del
     fondale che ambienti.js ha già dipinto: nessun tracciato, nessun
     colore deciso qui */
  tela.dipingiFondale(p => fondale.mostra(p.ctx, cam.x, cam.y, W, H, lato / latoFondale))
}
/* ═══════════ tutta la stanza sott'occhio ═══════════
   Quando il piano parte, quello che conta non è vedere bene: è **vedere
   tutto**. Il piano si giudica guardando le unità muoversi insieme, e
   una scena che gira mentre metà mappa sta fuori dallo schermo non si
   può giudicare — non si capisce nemmeno perché è andata storta.

   Quindi si scende all'ingrandimento minimo, che è per costruzione
   quello in cui la mappa ci sta tutta. Chi vuole tornare vicino ha due
   dita e due tasti. */
function mostraTutto () {
  if (!tela || !mondo()) return
  const z = zoomMinimo()
  if (Math.abs(z - zoom) < 0.01) return
  zoom = z
  lato = Math.round(latoBase * zoom)
  const r = telaEl.value.getBoundingClientRect()
  grande.value = mondo().w * lato > r.width + 1 || mondo().h * lato > r.height + 1
  limita()
  ridipingiStanza()
  zoomOra.value = zoom
}

function inquadraSu (u) {
  if (!u || !tela || !mondo()) return
  const { W, H } = tela.misure
  if (mondo().w * lato <= W && mondo().h * lato <= H) return
  cam.x = (u.x + 0.5) * lato - W / 2
  cam.y = (u.y + 0.5) * lato - H / 2
  limita(); rifaiFondale()
}
/* dove sta una cella sullo schermo: serve ai test per toccare il
   bersaglio come lo tocca un dito */
function puntoDi (x, y) {
  const r = telaEl.value.getBoundingClientRect()
  return { x: r.left + (x + 0.5) * lato - cam.x, y: r.top + (y + 0.5) * lato - cam.y }
}

/* ═══════════ un passo, e l'animazione che ci sta in mezzo ═══════════
   Chi fa camminare il mondo è il gioco; qui si tiene solo la memoria
   di DOV'ERANO, che è quello che serve per farli scivolare invece di
   farli saltare. */
function azzera () {
  prec = {}; andature = {}; animT0 = 0
  for (const k in apertoDa) delete apertoDa[k]
  scordaVignette()          // una scena nuova non eredita le parole di quella prima
  if (!mondo()) return
  mondo().unita.forEach(u => { prec[u.id] = { x: u.x, y: u.y }; andature[u.id] = 0 })
}
function animaPasso (fai) {
  if (!mondo()) return
  mondo().unita.forEach(u => { prec[u.id] = { x: u.x, y: u.y } })
  fai()
  mondo().unita.forEach(u => {
    if (prec[u.id] && (prec[u.id].x !== u.x || prec[u.id].y !== u.y)) andature[u.id]++
  })
  animT0 = performance.now()
}
/* riavvolgere non è camminare: si riparte da fermi, senza scivolata */
function fermaAnimazione () {
  if (!mondo()) return
  mondo().unita.forEach(u => { prec[u.id] = { x: u.x, y: u.y } })
  animT0 = 0
}

/* ═══════════ chi è fuori campo ═══════════
   Su una mappa che non ci sta tutta, la domanda è sempre la stessa:
   «e quello dov'è finito?». La minimappa la rispondeva coprendo un
   angolo del campo — cioè nascondendo proprio le caselle che stavi
   guardando. Queste stanno sul bordo, non coprono niente, e dicono da
   che parte è ognuno: si toccano e la vista ci salta sopra. */
const FRECCE = { sx: '◀', dx: '▶', su: '▲', giu: '▼' }
const fuoriCampo = computed(() => {
  props.tic; camK.value
  if (!mondo() || !tela || !grande.value) return []
  const { W, H } = tela.misure
  const out = []
  for (const u of mondo().unita) {
    if (!u.eInPiedi()) continue
    const x = (u.x + 0.5) * lato - cam.x, y = (u.y + 0.5) * lato - cam.y
    if (x >= 6 && x <= W - 6 && y >= 6 && y <= H - 6) continue
    const dir = x < 6 ? 'sx' : x > W - 6 ? 'dx' : y < 6 ? 'su' : 'giu'
    out.push({ id: u.id, em: u.emoji, mio: props.mie.includes(u.id), freccia: FRECCE[dir],
               x: Math.max(16, Math.min(W - 16, x)), y: Math.max(14, Math.min(H - 14, y)) })
  }
  return out
})
const vaiSu = id => { const u = mondo() && mondo().perId[id]; if (u) inquadraSu(u) }

/* ═══════════ la scena ═══════════ */
const CARDINE = ['su', 'dx', 'giu', 'sx']

/* ── FIN DOVE ARRIVA QUALCUNO IN N PASSI ──
   La stessa BFS che fa camminare tutto il gioco (`mappa.js`), chiesta
   qui per disegnare: le caselle che stanno entro `quanti` passi da
   dove sta. Vale per la vista di una guardia e per il cerchio di una
   lanterna, che si misurano nello stesso modo — a cammino, con i muri
   che allontanano invece di tagliare in linea retta.
   È il punto in cui il disegno smette di approssimare: prima era un
   cerchio, e un cerchio sopra una siepe prometteva una guardia che
   vede di là. Adesso quello che si vede a schermo È quello che il
   motore calcola. */
/* ── COSA TIENE IN MANO, E SE HA LE MANI VUOTE ──
   Quello che uno ha raccolto si vede addosso a lui, non solo nella
   scheda: una ladra senza i suoi pugnali è disarmata e si riconosce
   a colpo d'occhio, e quando li ritrova si riconosce anche quello. Le
   armi hanno la precedenza — se porta una chiave e una spada, in mano
   si disegna la spada — e `disarmato` spegne l'arma di serie del
   personaggio, che è il modo di raccontare che gliel'hanno portata via.
   Il numero che conta lo tiene il motore (`Unita.arma`): qui si
   racconta soltanto. */
function manoDi (m, u) {
  let pittore = null
  for (const id of (u.zaino || [])) {
    const cosa = m.cose[id]
    if (!cosa) continue
    const nome = cosa.pittore || id
    if (!OGGETTI.includes(nome)) continue
    if (cosa.d && cosa.d.arma) return { pittore: nome, disarmato: false }
    if (!pittore) pittore = nome
  }
  const base = u.armaBase
  return { pittore, disarmato: !!base && base.danno <= 0 }
}

function celleEntro (m, da, quanti) {
  if (!(quanti > 0) || da.x == null) return []
  const d = distanze(m, da.x, da.y)
  const out = []
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const q = d[y * m.w + x]
    if (q >= 0 && q <= quanti)
      out.push({ x: (x + 0.5) * lato - cam.x, y: (y + 0.5) * lato - cam.y })
  }
  return out
}
function scena () {
  const s = []
  const m = mondo()
  if (!m) return s
  const px = c => (c + 0.5) * lato - cam.x
  const py = c => (c + 0.5) * lato - cam.y
  /* ── IL RENDER INTERROGA ──
     `faccia()` di un `Elemento` risponde in CELLE, non in pixel — se
     rispondesse in pixel il motore saprebbe di uno schermo e
     smetterebbe di girare in Node. Qui, e solo qui, si passa dall'uno
     all'altro: è l'unico punto in cui questo file e il motore si
     parlano attraverso un descrittore invece che attraverso un ciclo
     scritto a mano per ogni famiglia. */
  const proietta = d => ({ ...d, x: px(d.x), y: py(d.y) })
  /* ── LA SCENOGRAFIA ──
     Casse, botti, ragnatele, carrelli: roba che il livello dichiara in
     `scenografia` e che **non è in gioco**. Non passa da `creaMondo`,
     quindi il motore non la conosce: non si prende, non si nomina in un
     ordine, non compare fra i bersagli. Serve a una cosa sola — che una
     stanza non sia un rettangolo vuoto — e si disegna per prima, sotto
     tutto il resto. */
  /* ── E STA INDIETRO ──
     Non basta che non sia in gioco: deve anche non SEMBRARLO. Una
     cassa dipinta accanto a un forziere da aprire, tutte e due a
     colori pieni, sono due inviti identici — e uno dei due è falso.
     Il velo la manda un passo indietro; il `fiato` che la tela mette
     sotto alle cose vere (`alone`, `grafica/tela.js`) la porta un passo
     avanti. Un livello può ritoccarlo scrivendo `velo` nella sua voce
     di scenografia, ma il valore giusto è quasi sempre questo. */
  /* ── E LA LISTA LA DÀ IL CAMPO, NON IL LIVELLO ──
     Perché nel mezzo è successo qualcosa: quello che il livello ha
     scritto è passato da `campo.js`, che ne ha tolto i mobili (una
     botte su una casella di muro è un arredo, e si disegna col
     pavimento sotto) e ci ha aggiunto quello che l'ambiente si è messo
     in casa da sé — ragnatele negli angoli, torce di scena,
     pozzanghere. Chi ce l'ha messa non deve vedersi. */
  for (const d of ((m.campo && m.campo.scenografia) || props.liv.scenografia || []))
    s.push({ velo: 0.42, ...d, x: px(d.x), y: py(d.y) })
  /* le zone di ronda e i posti che hanno un nome: macchie sul pavimento.
     ── E LA META SI VEDE CHE È LA META ──
     Un posto che l'obiettivo nomina («l'eroe deve arrivare a…») è
     verde, gli altri gialli. Un livello dove bisogna TORNARE da
     qualche parte lo diceva solo la riga scritta sotto la scena, e chi
     aveva appena preso il tesoro si ritrovava una partita che non
     finiva senza capire cosa mancasse: il posto dove finisce la
     missione dev'essere una cosa che si vede sulla mappa. */
  const mete = new Set((m.livello.vince || [])
    .filter(c => c && c.cond === 'qui' && c.complemento).map(c => c.complemento))
  /* ── SI DISEGNA DOVE FINISCE LA MISSIONE, E NIENT'ALTRO ──
     Prima si accendeva un quadratino su OGNI posto, e il campo si
     riempiva di caselle tratteggiate che promettevano qualcosa: «il
     sentiero di mezzogiorno», «l'aia», «l'imbocco». Ma un posto non è
     un obiettivo — quasi sempre è solo un'ancora che serve al livello
     per scrivere una condizione, e disegnarla vuol dire dire al
     bambino «vai lì» quando nessuno gliel'ha chiesto. Peggio: fa
     sembrare il gioco una caccia ai puntini, che è l'opposto di
     scrivere un piano.
     Resta solo quello che sta in `vince`: quello sì dev'essere una
     cosa che si vede, se no la missione finisce senza che si capisca
     dove. Le ancore invece fanno il loro mestiere in silenzio. */
  for (const k of mete) {
    if (k === 'tesoro' || !m.posti[k]) continue
    s.push({ che: 'ronda', strato: -1, colore: '#3fb872',
             celle: [{ x: px(m.posti[k].x), y: py(m.posti[k].y) }] })
  }
  /* ── LA LUCE, DOV'È ADESSO ──
     Una lanterna non è un oggetto come gli altri: cambia chi vede chi,
     e chi la porta se la tira dietro. Il cerchio si chiede al mondo con
     la stessa domanda che usa il motore (`luce()` su ogni cosa,
     `Mondo.illuminato`), così quello che si vede a schermo e quello che
     conta in partita non possono scollarsi. Caldo, e sotto tutto: è
     terreno illuminato, non un'insidia. */
  for (const k in m.cose) {
    const luce = typeof m.cose[k].luce === 'function' ? m.cose[k].luce(m) : null
    if (!luce || luce.da.x == null) continue
    s.push({ che: 'vista', strato: -1, colore: '#ffd88a', lato,
             celle: celleEntro(m, luce.da, luce.raggio.limite) })
  }
  /* quello che i nemici vedono: è l'informazione che serve a scrivere il
     piano, e va vista prima di premere ▶.
     ── E AL BUIO VEDONO MENO ──
     Il raggio è quello che il motore userebbe ADESSO
     (`limiteVista`), non il numero scritto nella scheda: con un tetto
     in gioco erano due cose diverse, e il cerchio rosso prometteva una
     guardia cieca là dove il motore ne aveva una che ci vede. L'anello
     esterno, pallido, è l'altra metà della regola — **fin lì ti vede
     se porti la luce** — ed è la sola parte insidiosa della lanterna:
     va letta sulla mappa prima di scoprirla a proprie spese. */
  m.unita.filter(u => u.eInPiedi() && u.fazione !== m.mia && u.vista)
    .forEach(u => {
      const ora = u.limiteVista(m, null)
      /* più spento, non più trasparente: il pittore l'alfa se la
         attacca da sé (`colore + '2e'`), e un colore che se la porta
         già scritta diventa una stringa che non è un colore */
      if (ora < u.vista)
        s.push({ che: 'vista', strato: -1, colore: '#7a3a34', lato,
                 celle: celleEntro(m, u, u.vista) })
      s.push({ che: 'vista', strato: -1, colore: '#ff7a6a', lato,
               celle: celleEntro(m, u, ora) })
      /* ── E SI DICE CHE COS'È, MA SOLO A CHI LO CHIEDE ──
         Una macchia rossa sul terreno non si spiega da sé: la prima
         domanda di chi l'ha vista è stata «e quelli cosa sono?». Ma una
         targhetta appiccicata addosso a ogni guardia, sempre, è rumore
         sopra la mappa — e grossa quanto il resto delle scritte lo è il
         doppio. Compare quando quella guardia la tocchi: la scheda si
         apre di là e il campo dice qui che cos'è quel rosso. */
      if (ora > 0 && props.aperta === u.id)
        s.push({ che: 'targhetta', strato: 2, testo: 'vede fin qui', em: '👁',
                 lato: lato * 0.66, x: px(u.x), y: py(u.y) - lato * 0.95 })
    })
  if (m.posti.tesoro)
    s.push({ che: 'forziere', x: px(m.posti.tesoro.x), y: py(m.posti.tesoro.y),
             apertura: m.vinto ? 1 : 0 })
  /* sinonimi: il nome che sta bene in una frase non è sempre quello del
     file che lo disegna — «l'osso» si dice al singolare, il pittore si
     chiama `ossa` perché disegna un mucchietto */
  const ALTRI_NOMI = { osso: 'ossa', olio: 'botte', chiavetta: 'chiave',
                       lanternina: 'lanterna', bottino: 'gemma' }
  /* OGNI COSA HA LA SUA FACCIA, E SI CHIEDE A `m.cose` — TUTTE INSIEME.
     Qui c'erano due giri separati, uno per `m.porte` e uno per
     `m.oggetti`: un terzo elenco, `m.cose`, non lo guardava nessuno —
     ed è lì che `allestimento.js` mette anche le leve e i totem («LE
     COSE DEL CAMPO, TUTTE NELLO STESSO ELENCO», niente cassetti per
     famiglia). Il rimedio non è un terzo giro per i congegni: è
     smettere di sapere che esistono le famiglie e chiedere a ognuna la
     sua `faccia()` — porte, posti, leve, totem e oggetti sono già
     tutti lì dentro (`allestimento.js` li aggiunge tutti a `cose`).
     Un posto non ha niente da dire (`Posto` non sovrascrive `faccia`),
     un «cartellino» (un'unità, una fazione: `cartellino()` in
     `allestimento.js`) non è nemmeno un `Elemento` e non ha `faccia`
     affatto — da qui il controllo prima di chiamarla. */
  const conSinonimo = d => (OGGETTI.includes(d.che) ? d
    : { ...d, che: ALTRI_NOMI[d.che] || 'chiave' })

  /* ── UN FORZIERE NON SI APRE DI SCATTO ──
     Le altre porte hanno un'apertura che è un fatto — o è aperta o no,
     e il battente di legno è binario per scelta. Il forziere invece è
     l'unico disegno del gioco che sia un MOMENTO (`grafica/oggetti/
     forziere.js`): coperchio, lampo, quattordici gemme, e tutto vive
     su un tempo che va da 0 a 1. Se gli si passa 1 di colpo, quel
     tempo non lo vede nessuno — si vede solo l'ultimo fotogramma, che
     è esattamente quello che si vedeva prima che il tesoro si aprisse.
     Qui si tiene solo l'ISTANTE in cui è scattato, e il resto è una
     sottrazione: il motore non sa che esiste un orologio, e la fine
     della partita non aspetta la fine dell'animazione. */
  const momento = (k, d) => {
    if (d.che !== 'porta' || d.stile !== 'forziere') return d
    if (!d.apertura) { delete apertoDa[k]; return d }
    if (!apertoDa[k]) apertoDa[k] = performance.now()
    return { ...d, apertura: Math.min(1.4, (performance.now() - apertoDa[k]) / 900) }
  }

  for (const k in m.cose) {
    const cosa = m.cose[k]
    if (typeof cosa.faccia !== 'function') continue
    cosa.faccia().forEach(d => s.push(proietta(conSinonimo(momento(k, d)))))
  }
  /* ── UN FORZIERE NON SE NE VA: SI APRE ──
     Da quando il tesoro si prende invece di calpestarlo è un oggetto
     come gli altri, e `Oggetto.faccia()` fa sparire dalla mappa chi è
     stato preso: giusto per una chiave che finisce nello zaino,
     sbagliato per una cassa — non se la infila in tasca nessuno. Resta
     dov'era, aperta e vuota, e il colpo d'occhio dice «qui è già
     passato qualcuno». Il giro qui sopra l'ha già saltata (presa ⇒
     `faccia()` vuota): questo secondo giro, piccolo apposta, la
     ridisegna da sola. */
  m.oggetti.forEach(o => {
    if (!o.preso) return
    /* per id, non per nome: `nome` adesso è quello che si legge in una
       frase («il tesoro»), e come chiave non vale più niente */
    if ((o.pittore || ALTRI_NOMI[o.id] || o.id) === 'forziere')
      s.push({ che: 'forziere', x: px(o.x), y: py(o.y), apertura: 1 })
  })
  /* ── I BERSAGLI, COL LORO NOME ADDOSSO ──
     Il quadratino giallo diceva «qui puoi toccare» e basta: il nome
     stava nell'elenco dall'altra parte dello schermo, e l'abbinamento
     lo doveva fare il bambino — «la strada sotto la prima corte» quale
     dei tre sarà? Su una mappa con tre posti nominati è un rebus, e su
     un livello a due bivi diventa impossibile.
     Il nome va scritto SUL bersaglio: si legge dove serve, e non c'è
     niente da tenere a mente. */
  props.bersagli.forEach(b => {
    s.push({ che: 'ronda', strato: 1, colore: '#ffd24a',
             celle: [{ x: px(b.x), y: py(b.y) }] })
    if (b.nome) s.push({ che: 'targhetta', strato: 2, testo: b.nome, em: b.em,
                         x: px(b.x), y: py(b.y) - lato * 0.52, lato })
  })
  if (sottoIlDito.value)
    s.push({ che: 'ronda', strato: 1, colore: '#ffffff',
             celle: [{ x: px(sottoIlDito.value.x), y: py(sottoIlDito.value.y) }] })

  const t01 = animT0 ? Math.min(1, (performance.now() - animT0) / props.vel) : 1
  for (const u of m.unita) {
    const p0 = prec[u.id] || u
    const x = px(p0.x + (u.x - p0.x) * t01), y = py(p0.y + (u.y - p0.y) * t01)
    const r = ultimaRiga(u.id)
    /* UNO SCONTRO DURA E SI DEVE VEDERE. Il motore dice chi ha menato
       e chi ha incassato in questo battito (`mondo.colpi`): chi mena
       tira, chi incassa incassa, e quei battiti sono la finestra in
       cui l'altro corre al forziere. Senza, una battaglia da otto
       colpi era otto volte la stessa figura ferma. */
    const c = (m.colpi || []).find(z => z.a === u.id)
    const mena = (m.colpi || []).some(z => z.da === u.id)
    /* `corpo` è come si disegna, e da lì viene anche la faccina. Si
       chiamava `chi`, e quando il nome è cambiato questa riga ha
       continuato a chiedere il vecchio: non trovandolo ripiegava
       sull'orco, e in partita l'eroe era un orco. Il ripiego resta —
       un personaggio senza corpo deve pur disegnarsi — ma adesso è
       l'ultima spiaggia, non la regola. */
    const mano = manoDi(m, u)
    s.push({ che: u.corpo || u.chi || 'orco', x, y, dir: CARDINE[u.dir] || 'giu',
             passo: andature[u.id] || 0, mano: mano.pittore, disarmato: mano.disarmato,
             /* ── UN ORDINE CHE NON RIESCE NON È UNA FERITA ──
                Il rosso di `errore` è lo stesso registro visivo della
                botta, e su un cane che non riesce ad arrivare — perché
                la gabbia è ancora chiusa — si legge come «sta morendo».
                Ma quello non è un guasto: è uno che **riprova**, e il
                fumetto dell'attesa lo dice per quello che è. Il rosso
                resta solo a chi ha finito la fila senza riuscirci, cioè
                a un ordine che non tornerà più. */
             stato: !u.eInPiedi() ? 'ko'
                  : c ? 'colpito'
                  : mena ? 'lancia'
                  : r && r.esito === 'aspetto' ? 'attesa'
                  : r && r.esito === 'no' ? (u.eImpegnata() ? 'attesa' : 'errore')
                  : 'normale' })
  }
  return s
}
const ultimaRiga = id => {
  const m = mondo()
  if (!m.traccia.length) return null
  for (let k = m.traccia.length - 1; k >= 0; k--) {
    const r = m.traccia[k]
    if (r.unita === id && r.tFine >= m.passi - 1) return r
  }
  return null
}
function disegna () {
  if (!tela || !mondo()) return
  tela.disegna(scena(), performance.now() / 1000)
}

/* ── quello che il canvas non dice ──
   La vita che cala e il grido che parte sono numeri, non figure: qui
   diventano due pastiglie sopra la tela, come le frecce di chi è
   fuori campo. La barra compare solo a chi le ha prese: una fila di
   barre piene sopra la testa di tutti sarebbe rumore. */
const soprala = computed(() => {
  props.tic; camK.value
  const m = mondo()
  if (!m || !tela) return { vite: [], gridi: [] }
  const px = c => (c + 0.5) * lato - cam.x
  const py = c => (c + 0.5) * lato - cam.y
  const feriti = new Set((m.colpi || []).map(z => z.a))
  return {
    vite: m.unita.filter(u => u.eInPiedi() && u.vita < u.vitaMax)
      .map(u => ({ id: u.id, x: px(u.x), y: py(u.y) - lato * 0.52,
                   q: Math.max(0, u.vita) / u.vitaMax,
                   mio: u.fazione === m.mia, ora: feriti.has(u.id) })),
  }
})

/* ── LE VIGNETTE DEI SEGNALI ──
   Un segnale è la cosa più importante che succede in questo gioco e
   l'unica che non si vedeva: finiva nel registro, cioè dietro un
   tasto, e a schermo restava un personaggio che si ferma un battito
   senza motivo. Adesso chi suona ha sopra la testa un fumetto con
   **quello che ha detto**, parola per parola, e chi guarda la scena
   capisce il livello senza aprire niente.

   Vivono più di un battito, e per questo stanno qui e non in
   `soprala`: `mondo.allarmi` è quello che è successo in QUESTO passo e
   si svuota al prossimo, ma un fumetto che compare e sparisce in
   quattro decimi non lo legge nessuno. Si tengono da parte, si
   proiettano a ogni tic (la mappa si trascina sotto di loro) e se ne
   vanno da sole. */
const DURATA_VIGNETTA = 1800
let contaVign = 0
/* Cambiando tappa si riparte da lontano. L'ingrandimento è un modo di
   guardare *questa* stanza, non una preferenza: portarselo dietro
   vorrebbe dire aprire la tappa dopo già dentro un angolo, senza
   sapere che c'è dell'altro fuori dallo schermo. */
watch(() => props.liv && props.liv.id, () => { zoom = 1; pizzico = null; dita.clear() })

const vignette = ref([])
const scordaVignette = () => { vignette.value = [] }
watch(() => props.tic, () => {
  const m = mondo()
  for (const a of (m && m.allarmi) || []) {
    const s = ilSegnale(a.seg)
    const v = { k: ++contaVign, cx: a.x, cy: a.y, em: s.em, nome: s.nome, col: s.col }
    vignette.value = [...vignette.value, v]
    setTimeout(() => { vignette.value = vignette.value.filter(z => z !== v) }, DURATA_VIGNETTA)
  }
})
/* e restano DENTRO il campo: chi parla dall'ultima colonna avrebbe il
   fumetto mezzo tagliato dal bordo, e chi parla dalla prima riga se lo
   vedrebbe uscire di sopra. Si spinge dentro invece di sparire — la
   coda non punta più esattamente alla testa, ma le parole si leggono,
   e le parole sono il motivo per cui il fumetto esiste. La larghezza
   si stima dal testo: misurarla vorrebbe dire aspettare il render. */
const largoDi = v => 34 + v.nome.length * 5.8
const fumetti = computed(() => {
  props.tic; camK.value
  if (!tela || !telaEl.value) return []
  const W = telaEl.value.clientWidth
  return vignette.value.map(v => {
    const m = largoDi(v) / 2 + 3
    return { ...v,
      x: Math.max(m, Math.min(W - m, (v.cx + 0.5) * lato - cam.x)),
      y: Math.max(lato * 0.9, (v.cy + 0.5) * lato - cam.y - lato * 0.7) }
  })
})

/* ── i giri di ronda, da nomi a pixel ──
   Sono chip e trattini messi SOPRA la tela, non disegni: il giro si
   legge prima di premere ▶, e correggerlo vuol dire spostare un punto. */
const giriInPixel = computed(() => {
  props.tic; camK.value
  if (!mondo() || !tela) return []
  return props.giri.map(g => ({
    ora: g.ora,
    p: g.punti.map(id => laCosa(mondo(), id)).filter(Boolean)
      .map(c => ({ x: (c.x + 0.5) * lato - cam.x, y: (c.y + 0.5) * lato - cam.y })),
  })).filter(g => g.p.length)
})
/* un trattino da un punto all'altro: lunghezza e angolo, e basta */
const tratto = (a, b) => ({
  left: a.x + 'px', top: a.y + 'px',
  width: Math.hypot(b.x - a.x, b.y - a.y) + 'px',
  transform: `rotate(${Math.atan2(b.y - a.y, b.x - a.x)}rad)`,
})

/* ═══════════ due dita ═══════════
   Avvicinarsi è la cosa che cambia di più come si vede il gioco: le
   figure sono alte poco più di una cella, e a cella piccola metà del
   disegno che c'è non arriva all'occhio.

   ── il gesto non ruba il tocco ──
   Il patto che regge tutto il campo è che **toccare una casella è
   dare un ordine**. Quindi il secondo dito non è «un tocco in più»:
   appena arriva, il primo smette di essere un tocco e diventa gesto,
   e alzando le dita non parte nessun ordine. Senza questa regola,
   ogni pinch finirebbe per spostare un'unità.

   ── attorno a che cosa si ingrandisce ──
   Attorno al punto in mezzo alle dita, non al centro dello schermo:
   si stringe su quello che si sta guardando, ed è l'unico modo in cui
   il gesto «tiene» sotto le dita invece di scappare via. */
const dita = new Map()
let pizzico = null

const centroDita = () => {
  const [a, b] = [...dita.values()]
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }
}

function apriPizzico () {
  const c = centroDita()
  if (c.d < 24) return                       // due dita troppo vicine: misura inaffidabile
  const r = telaEl.value.getBoundingClientRect()
  pizzico = { d0: c.d, z0: zoom,
              // dove sta, nella mappa, il punto che sta sotto le dita:
              // è quello che deve restare fermo mentre si stringe
              mx: (cam.x + c.x - r.left) / lato,
              my: (cam.y + c.y - r.top) / lato }
  giu = null                                 // il trascinamento lascia il posto al gesto
  sottoIlDito.value = null
}

function muoviPizzico () {
  if (!pizzico || dita.size < 2) return
  const c = centroDita()
  const r = telaEl.value.getBoundingClientRect()
  zoom = Math.max(zoomMinimo(), Math.min(zoomMassimo(), pizzico.z0 * (c.d / pizzico.d0)))
  lato = Math.round(latoBase * zoom)
  /* il punto di prima torna sotto le dita di adesso: è questo che fa
     sembrare che si stia muovendo la stanza e non la telecamera */
  cam.x = pizzico.mx * lato - (c.x - r.left)
  cam.y = pizzico.my * lato - (c.y - r.top)
  grande.value = mondo().w * lato > r.width + 1 || mondo().h * lato > r.height + 1
  limita(); rifaiFondale()
}

function chiudiPizzico () {
  pizzico = null
  ridipingiStanza()      // la stanza torna nitida alla misura nuova
  zoomOra.value = zoom
}

/* ═══════════ i due tasti ═══════════
   Il pinch è un gesto che **si scopre**, e chi non lo scopre non sa
   nemmeno che si poteva. Due tasti in un angolo lo dicono, e sono
   anche l'unico modo di avvicinarsi con un mouse — sul computer di
   dita ce n'è una sola.

   Restano piccoli e in un angolo apposta: la cosa da fare sul campo è
   toccare le caselle, e un comando che si vede troppo si prende la
   mano che serviva agli ordini. E spariscono del tutto dove non c'è
   niente da ingrandire, invece di stare lì grigi. */
const PASSO_ZOOM = 0.5
const zoomOra = ref(1)                    // solo per i tasti: `zoom` non è reattivo
/* i tasti non compaiono dove non c'è niente da fare: una stanza che ci
   sta tutta e che non si può ingrandire non ha bisogno di comandi */
const siZooma = computed(() => { camK.value; return zoomMassimo() - zoomMinimo() > 0.05 })
const puoiPiu = computed(() => { zoomOra.value; camK.value; return zoom < zoomMassimo() - 0.01 })
const puoiMeno = computed(() => { zoomOra.value; camK.value; return zoom > zoomMinimo() + 0.01 })

function cambiaZoom (verso) {
  const z = Math.max(zoomMinimo(), Math.min(zoomMassimo(), +(zoom + verso * PASSO_ZOOM).toFixed(2)))
  if (z === zoom) return
  const { W, H } = tela.misure
  /* si ingrandisce attorno al **centro di quello che si sta
     guardando**, non attorno all'angolo della mappa: com'è per il
     pinch, il punto in mezzo allo schermo resta dov'è */
  const mx = (cam.x + W / 2) / lato, my = (cam.y + H / 2) / lato
  zoom = z
  lato = Math.round(latoBase * zoom)
  cam.x = mx * lato - W / 2
  cam.y = my * lato - H / 2
  const r = telaEl.value.getBoundingClientRect()
  grande.value = mondo().w * lato > r.width + 1 || mondo().h * lato > r.height + 1
  limita()
  ridipingiStanza()
  zoomOra.value = zoom
}
/* ── la mappa si trascina; il tocco resta il tocco (soglia 9px) ── */
let giu = null
const cellaDi = e => {
  const r = telaEl.value.getBoundingClientRect()
  return { x: Math.floor((cam.x + e.clientX - r.left) / lato),
           y: Math.floor((cam.y + e.clientY - r.top) / lato) }
}
function ditoGiu (e) {
  dita.set(e.pointerId, { x: e.clientX, y: e.clientY })
  telaEl.value.setPointerCapture(e.pointerId)
  if (dita.size === 2) { apriPizzico(); return }
  if (dita.size > 2) return                  // un terzo dito non aggiunge niente
  giu = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, mosso: 0 }
  if (props.mirando) sottoIlDito.value = cellaDi(e)
}
function ditoMuovi (e) {
  if (dita.has(e.pointerId)) dita.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pizzico) { muoviPizzico(); return }
  if (!giu) return
  const dx = e.clientX - giu.x, dy = e.clientY - giu.y
  giu.mosso = Math.max(giu.mosso, Math.abs(dx) + Math.abs(dy))
  if (props.mirando) { sottoIlDito.value = cellaDi(e); return }
  if (giu.mosso < 9) return
  cam.x = giu.cx - dx; cam.y = giu.cy - dy
  limita(); rifaiFondale()
}
function ditoSu (e) {
  dita.delete(e.pointerId)
  /* finito un pinch, il dito rimasto **non** ricomincia a trascinare e
     soprattutto non dà un ordine: si aspetta che se ne vadano tutti.
     Alzarne uno solo e vedere partire un'unità sarebbe la sorpresa
     peggiore che questo campo possa fare. */
  if (pizzico) { if (dita.size < 2) chiudiPizzico(); giu = null; return }
  if (!giu) return
  if (giu.mosso < 9 || props.mirando) emit('tocca', cellaDi(e))
  sottoIlDito.value = null
  giu = null
}

defineExpose({ misura, disegna, inquadraSu, mostraTutto, azzera, animaPasso, fermaAnimazione, puntoDi })
</script>

<template>
  <section class="campo" :style="{ height: altoCampo }">
    <canvas ref="telaEl" @pointerdown="ditoGiu" @pointermove="ditoMuovi"
            @pointerup="ditoSu" @pointercancel="ditoSu"></canvas>
    <!-- avvicinarsi si può fare con due dita, ma due dita non si
         vedono: questi due lo dicono, e su un computer sono l'unico
         modo. Stanno in un angolo e spariscono dove non servono. -->
    <div v-if="siZooma" class="lente">
      <button aria-label="allontana" :disabled="!puoiMeno" @click="cambiaZoom(-1)">−</button>
      <button aria-label="avvicina" :disabled="!puoiPiu" @click="cambiaZoom(1)">+</button>
    </div>
    <slot></slot>
    <!-- chi è fuori campo: una freccia sul bordo, che non copre
         niente. Si tocca e la vista ci salta sopra. -->
    <b v-for="f in fuoriCampo" :key="'f' + f.id" class="fuori" :class="{ mio: f.mio }"
       :style="{ left: f.x + 'px', top: f.y + 'px' }" @click="vaiSu(f.id)">
      {{ f.freccia }}{{ f.em }}</b>
    <!-- i giri di ronda: i punti numerati e il tratto che li unisce -->
    <div class="giri" aria-hidden="true">
      <template v-for="(g, k) in giriInPixel" :key="k">
        <i v-for="(q, j) in g.p.slice(0, -1)" :key="'t' + j" class="tratto"
           :class="{ ora: g.ora }" :style="tratto(q, g.p[j + 1])"></i>
        <i v-if="g.p.length > 2" class="tratto" :class="{ ora: g.ora }"
           :style="tratto(g.p[g.p.length - 1], g.p[0])"></i>
        <b v-for="(q, j) in g.p" :key="'p' + j" class="punto" :class="{ ora: g.ora }"
           :style="{ left: q.x + 'px', top: q.y + 'px' }">{{ cerchio(j) }}</b>
      </template>
    </div>
    <!-- lo scontro mentre dura: la vita che cala e il grido che
         parte. Sono i due fatti che rendono il tempo una risorsa —
         finché quei due si menano, l'altra corre al forziere. -->
    <div class="scontro" aria-hidden="true">
      <i v-for="v in soprala.vite" :key="'v' + v.id" class="vita"
         :class="{ mio: v.mio, ora: v.ora }" :style="{ left: v.x + 'px', top: v.y + 'px' }">
        <u :style="{ width: Math.round(v.q * 100) + '%' }"></u></i>
      <b v-for="v in fumetti" :key="v.k" class="grido"
         :style="{ left: v.x + 'px', top: v.y + 'px', '--tinta': v.col }">
        <i>{{ v.em }}</i>{{ v.nome }}</b>
    </div>
  </section>
</template>

<style scoped>
.campo { flex:0 0 auto; height:36vh; min-height:180px; position:relative; overflow:hidden;
         background:#0d1424 }
.campo canvas { display:block; width:100%; height:100%; touch-action:none }
/* le frecce di chi è fuori campo: stanno sul bordo e non coprono la
   mappa, che è il motivo per cui hanno preso il posto della minimappa */
.lente { position:absolute; right:6px; top:6px; display:flex; flex-direction:column; gap:4px; z-index:4 }
.lente button {
  width:30px; height:30px; padding:0; border-radius:8px; border:1px solid #ffffff26;
  background:#0e1626cc; color:#dbe9ff; font:700 17px/1 system-ui; cursor:pointer;
}
.lente button:disabled { opacity:.32; cursor:default }
.fuori { position:absolute; transform:translate(-50%,-50%); display:flex; align-items:center;
         gap:1px; height:24px; padding:0 6px; border-radius:12px; font-size:12px;
         background:#0f1726d9; color:#ffd8d3; box-shadow:0 0 0 1.5px #e0554d99; cursor:pointer }
.fuori.mio { color:#dbe9ff; box-shadow:0 0 0 1.5px #6aa6ff99 }

/* ── i giri di ronda disegnati sopra la mappa ── */
.giri { position:absolute; inset:0; pointer-events:none }
.giri .tratto { position:absolute; height:3px; margin-top:-1.5px; transform-origin:0 50%;
                background:repeating-linear-gradient(90deg,#3fd0b0 0 6px,transparent 6px 11px);
                opacity:.85 }
.giri .tratto.ora { background:repeating-linear-gradient(90deg,#ffd24a 0 6px,transparent 6px 11px) }
.giri .punto { position:absolute; width:20px; height:20px; margin:-10px 0 0 -10px; border-radius:50%;
               background:#0f1726cc; color:#7ff0d0; font-size:13px; line-height:20px;
               text-align:center; font-weight:900; box-shadow:0 0 0 2px #3fd0b0 }
.giri .punto.ora { color:#2a2000; background:var(--giallo); box-shadow:0 0 0 2px #fff }

/* ── lo scontro che dura ──
   la barra della vita compare solo a chi le ha prese, e lampeggia nel
   battito in cui incassa: così otto colpi si contano guardando */
.scontro { position:absolute; inset:0; pointer-events:none }
.scontro .vita { position:absolute; width:26px; height:5px; margin:-2px 0 0 -13px;
                 border-radius:3px; background:#0b1220cc; box-shadow:0 0 0 1px #00000066;
                 overflow:hidden; display:block }
.scontro .vita u { display:block; height:100%; background:#e0554d; transition:width .18s }
.scontro .vita.mio u { background:#3fd0b0 }
.scontro .vita.ora { box-shadow:0 0 0 2px #fff8 }
/* ── il fumetto di chi parla ──
   Piccolo, con la coda che punta a chi l'ha detto, e del colore del
   segnale: due ronde che dicono due cose diverse non si confondono.
   `white-space:nowrap` perché una vignetta che va a capo su una mappa
   larga dieci celle copre mezzo campo. */
.scontro .grido { position:absolute; transform:translate(-50%,-100%); display:flex;
                  align-items:center; gap:3px; padding:2px 7px; border-radius:11px;
                  background:#0f1726ee; color:#fff; font-size:10.5px; font-weight:900;
                  white-space:nowrap; box-shadow:0 0 0 1.5px var(--tinta,#8b97b4);
                  animation:grido 1.8s ease-out forwards }
.scontro .grido i { font-style:normal; font-size:11px }
.scontro .grido::after { content:''; position:absolute; left:50%; top:100%; margin-left:-4px;
                         border:4px solid transparent; border-top-color:#0f1726ee }
@keyframes grido { from { transform:translate(-50%,-70%) scale(.5); opacity:0 }
                   12% { transform:translate(-50%,-105%) scale(1.06); opacity:1 }
                   22% { transform:translate(-50%,-100%) scale(1); opacity:1 }
                   82% { transform:translate(-50%,-100%) scale(1); opacity:1 }
                   to { transform:translate(-50%,-115%) scale(.96); opacity:0 } }
</style>
