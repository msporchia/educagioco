/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DELLA RESA — una stanza, quattro personaggi, otto manopole

   Serve a rispondere a una domanda che a occhio nudo, dentro al gioco,
   non si riusciva a rispondere: **il disegno sembra povero, ma per
   colpa di che cosa?** Nel Generale ci sono un motore, dei livelli,
   degli ordini e una campagna; provare una modifica alla luce voleva
   dire aprire una partita, arrivare alla cripta, e intanto tutto il
   resto si muoveva. Qui c'è una stanza sola e niente regole: si accende
   un interruttore per volta e si guarda cosa cambia.

   ── quello che si vede qui è vero ──
   Nessun disegno è rifatto per l'occasione. Il banco importa `creaTela`,
   `PITTORI` e `creaFondale` — gli stessi che usa `CampoLivello.vue` — e
   se ne serve allo stesso modo. È possibile perché in `src/grafica/`
   non c'è un solo import che guardi fuori dalla cartella: né Vue, né il
   motore, né i dati. Se il cavaliere qui viene bello, viene bello anche
   in partita; se qui viene brutto, non c'è impostazione del gioco che
   lo salvi.

   ── il tempo del gioco, non un'animazione finta ──
   La partita vera avanza a **passi discreti** (una cella per volta,
   ogni `vel` millisecondi) mentre il disegno gira a sessanta al
   secondo, e fra un passo e l'altro le figure scivolano. È esattamente
   quello che succede qui: se si copiasse un movimento continuo si
   perderebbe proprio il difetto che si vuole giudicare — il
   pattinamento.
   ═══════════════════════════════════════════════════════════════════ */
import { creaTela } from '../../src/grafica/tela.js'
import { PITTORI } from '../../src/grafica/generale.js'
import { creaFondale } from '../../src/grafica/ambienti.js'
import { NOMI_AMBIENTI } from '../../src/grafica/ambienti/indice.js'
import { PERSONAGGI } from '../../src/grafica/personaggi/indice.js'
import { RESA, accendi } from '../../src/grafica/resa.js'

/* ─────────── la stanza ───────────
   Piccola apposta. Il banco si guarda da vicino, e una mappa grande a
   zoom 3 vuole una tela di scorta da decine di megabyte — proprio il
   conto che `mappa.js` avverte di non fare. Sedici per dieci basta a
   contenere due muri interni, qualche torcia e del buio in mezzo, che
   è tutto quello che serve per giudicare. */
const MAPPA = [
  '################',
  '#..............#',
  '#..............#',
  '#..###....###..#',
  '#..............#',
  '#..............#',
  '#..###....###..#',
  '#..............#',
  '#..............#',
  '################',
]

/* ─────────── chi c'è in scena ───────────
   Quattro, e ognuno risponde a una domanda diversa:
     · due che si rincorrono su corsie opposte — la camminata;
     · uno fermo che aspetta — il respiro e i puntini, cioè se le
       animazioni continue reggono anche da fermi;
     · uno a quattro zampe — perché `bestia` ha uno scheletro suo e
       un difetto della camminata potrebbe non valere per tutti.
   E a turno qualcuno le prende, perché lo stato «colpito» è il
   momento in cui il disegno deve reggere di più. */
const ATTORI = [
  { chi: 'cavaliere', riga: 4, da: 1, a: 14, verso: 1 },
  { chi: 'orco', riga: 5, da: 14, a: 1, verso: -1 },
  { chi: 'lupo', riga: 8, da: 2, a: 13, verso: 1 },
  { chi: 'mago', riga: 2, da: 7, a: 7, verso: 1, fermo: true },
]

const CARDINE = { 1: 'dx', '-1': 'sx' }

/* ═══════════ lo stato del banco ═══════════ */
const S = {
  ambiente: 'cripta',
  /* IL SEME, che è la manopola più importante di questa tornata: la
     cosa da giudicare non è *un* fondale, è la **varianza**. Un
     esemplare alla volta si giudica solo se è bello; scorrendo il seme
     si vede se quattro stanze fatte dalla stessa tavolozza sembrano
     quattro posti o quattro ritagli della stessa fotografia. In
     partita il seme è l'id del livello, quindi una tappa ha per sempre
     la sua faccia. */
  seme: 1,
  zoom: 1,
  vel: 420,
  attore: null,           // se impostato, tutti diventano lui (per guardarne uno)
  /* IL FERMO IMMAGINE, che è più utile di quanto sembri: due
     fotogrammi presi in momenti diversi non si possono confrontare,
     perché fra l'uno e l'altro i personaggi si sono spostati e la
     differenza che si vede non è quella dell'interruttore. Da fermi
     invece cambia una cosa sola. La frazione resta a metà passo
     apposta: è la posa in cui le gambe sono più aperte, cioè quella
     in cui la camminata si giudica. */
  fermo: false,
  frazioneFerma: 0.5,
}

let tela = null, fondale = null, lato = 36, base = 36
const cam = { x: 0, y: 0, mira: { x: 0, y: 0 } }
let attori = [], passi = 0, tPasso = 0
let telaEl = null

/* ═══════════ misure e fondale ═══════════ */
function rifai() {
  if (!telaEl) return
  lato = Math.round(base * S.zoom)
  /* la scala dei pittori è agganciata alla cella, com'è nel gioco:
     `S = latoCella / 20`, che è la convenzione di `corpo.js` */
  tela = creaTela(telaEl, PITTORI, { unita: 420, minimo: lato / 20, massimo: lato / 20 })
  tela.ridimensiona()
  fondale = creaFondale({ mappa: MAPPA, ambiente: S.ambiente, lato, seme: S.seme })
  segnaFondale()
  limita()
}

function segnaFondale() {
  const el = document.getElementById('nota-fondale')
  if (el && fondale)
    el.textContent = `stanza ${fondale.larghezza}×${fondale.altezza} px · ` +
                     `${fondale.memoria} MB · seme ${S.seme} · ` +
                     `dipinta in ${fondale.millisecondi} ms`
}

function limita() {
  if (!tela || !fondale) return
  const { W, H } = tela.misure
  const largo = fondale.larghezza, alto = fondale.altezza
  cam.x = largo <= W ? (largo - W) / 2 : Math.max(0, Math.min(largo - W, cam.x))
  cam.y = alto <= H ? (alto - H) / 2 : Math.max(0, Math.min(alto - H, cam.y))
}

/* ═══════════ il passo ═══════════
   Come in partita: il mondo avanza di una cella per volta, e chi
   disegna si arrangia a coprire il buco. */
function azzera() {
  attori = ATTORI.map((a, i) => ({
    ...a, chi: S.attore || a.chi,
    x: a.da, y: a.riga, px: a.da, py: a.riga,
    dir: a.verso, passo: 0, stato: 'normale', i,
  }))
  passi = 0
  tPasso = performance.now()
}

function unPasso() {
  passi++
  for (const a of attori) {
    a.px = a.x; a.py = a.y
    if (a.fermo) { a.stato = 'attesa'; continue }
    const prossima = a.x + a.dir
    if (prossima > Math.max(a.da, a.a) || prossima < Math.min(a.da, a.a)) a.dir = -a.dir
    a.x += a.dir
    a.passo++
    /* a turno qualcuno mena e qualcuno le prende: sono gli stati in cui
       il disegno è più esposto, e da fermi non si vedrebbero mai */
    const giro = passi % 12
    a.stato = giro === 4 && a.i === 0 ? 'lancia'
            : giro === 5 && a.i === 1 ? 'colpito'
            : giro === 9 && a.i === 2 ? 'colpito'
            : 'normale'
  }
  tPasso = performance.now()
}

/* ═══════════ la scena ═══════════ */
function scena(grezza) {
  const s = []
  const px = c => (c + 0.5) * lato - cam.x
  const py = c => (c + 0.5) * lato - cam.y
  for (const a of attori) {
    const f = grezza
    const x = px(a.px + (a.x - a.px) * f)
    const y = py(a.py + (a.y - a.py) * f)
    s.push({
      che: a.chi, x, y,
      dir: a.fermo ? 'giu' : CARDINE[a.dir],
      passo: a.passo,
      /* è questo il dato che prima non esisteva: quanto manca
         all'arrivo. Senza, `corpo.js` può solo contare le celle */
      frazione: f,
      stato: a.stato,
    })
  }
  return s
}

/* ═══════════ il giro ═══════════ */
let ultimoFps = performance.now(), fotogrammi = 0, speso = 0

function giro() {
  requestAnimationFrame(giro)
  if (!tela || !fondale) return
  const ora = performance.now()
  if (!S.fermo && ora - tPasso >= S.vel) unPasso()
  const grezza = S.fermo ? S.frazioneFerma : Math.min(1, (ora - tPasso) / S.vel)

  /* la camera insegue il primo attore, ma solo se la stanza non ci sta
     tutta: a zoom 1 sedici celle ci stanno, e una camera che si muove
     senza bisogno è solo mal di mare */
  const { W, H } = tela.misure
  if (fondale.larghezza > W || fondale.altezza > H) {
    const eroe = attori[0]
    cam.mira.x = (eroe.x + 0.5) * lato - W / 2
    cam.mira.y = (eroe.y + 0.5) * lato - H / 2
    cam.x += (cam.mira.x - cam.x) * 0.08
    cam.y += (cam.mira.y - cam.y) * 0.08
  }
  limita()

  /* il fondale si ricopia a ogni fotogramma: è un `drawImage` solo,
     ritagliato dalla stanza già dipinta. È anche la prova che il
     doppio caching che il campo fa oggi non serviva a niente. */
  tela.dipingiFondale(p => fondale.mostra(p.ctx, cam.x, cam.y, W, H))

  /* la luce si chiede in coordinate della **mappa**, e i pittori
     lavorano in coordinate dello schermo: la camera è la differenza */
  const luce = (x, y) => fondale.luce.in(x + cam.x, y + cam.y)
  /* IL CRONOMETRO SUL DISEGNO, e non solo gli fps. Gli fps da soli
     mentono per omissione: sono inchiodati a sessanta dal vsync
     finché c'è margine, quindi dicono «tutto bene» sia che un
     fotogramma costi due millisecondi sia che ne costi quindici — e
     la differenza fra i due è tutto quello che si vuole sapere prima
     di accendere una miglioria. Il millesimo speso qui dentro invece
     si muove appena si aggiunge lavoro. */
  const t0 = performance.now()
  tela.disegna(scena(grezza), ora / 1000, luce)
  speso += performance.now() - t0

  fotogrammi++
  if (ora - ultimoFps >= 500) {
    const fps = Math.round(fotogrammi * 1000 / (ora - ultimoFps))
    const ms = (speso / fotogrammi).toFixed(2)
    document.getElementById('fps').textContent = `${fps} fps · ${ms} ms`
    fotogrammi = 0; speso = 0; ultimoFps = ora
  }
}

/* ═══════════ i comandi ═══════════ */
const INTERRUTTORI = [
  ['grana', 'grana del pavimento', 'lastre in scala con chi ci cammina sopra, invece di lastroni larghi il doppio'],
  ['ombraMuri', 'i muri fanno ombra', 'i blocchi smettono di sembrare rettangoli incollati sul pavimento'],
  ['materia', 'materia (grana)', 'la figura smette di essere carta colorata ritagliata'],
  ['dettaglio', 'densità di dettaglio (solo il cavaliere)', 'chiodi, orli, giunture, graffi: la prova contro i «quattro cerchi»'],
  ['camminata', 'camminata continua', 'le gambe si muovono mentre si scivola, invece di scattare all\'arrivo'],
  ['luce', 'luce sui personaggi', 'dorati nella pozza della torcia, blu notte fuori'],
  ['ombra', 'ombra orientata', 'si allunga dalla parte opposta alla fiamma, e sfuma'],
  ['volume', 'volume', 'gradienti invece di campiture piatte'],
]

/* quali interruttori toccano il terreno invece dei personaggi */
const DEL_FONDALE = new Set(['grana', 'ombraMuri'])

function costruisciComandi() {
  const dove = document.getElementById('interruttori')
  for (const [chiave, nome, spiega] of INTERRUTTORI) {
    const l = document.createElement('label')
    l.className = 'sw'
    l.innerHTML = `<input type="checkbox" data-flag="${chiave}">
                   <span><b>${nome}</b><i>${spiega}</i></span>`
    l.querySelector('input').addEventListener('change', e => {
      accendi({ [chiave]: e.target.checked })
      /* la stanza è dipinta una volta sola su una tela di scorta: chi
         cambia il terreno deve chiedere che venga ridipinta, se no si
         continua a guardare quella di prima */
      if (DEL_FONDALE.has(chiave)) rifai()
    })
    dove.appendChild(l)
  }
}

function tutti(acceso) {
  for (const [chiave] of INTERRUTTORI) accendi({ [chiave]: acceso })
  document.querySelectorAll('#interruttori input').forEach(i => { i.checked = acceso })
  rifai()
}

function riempiScelte() {
  const amb = document.getElementById('ambiente')
  for (const n of NOMI_AMBIENTI) {
    const o = document.createElement('option')
    o.value = n; o.textContent = n
    if (n === S.ambiente) o.selected = true
    amb.appendChild(o)
  }
  const att = document.getElementById('attore')
  for (const n of PERSONAGGI) {
    const o = document.createElement('option')
    o.value = n; o.textContent = n
    att.appendChild(o)
  }
}

export function avvia() {
  telaEl = document.getElementById('tela')
  costruisciComandi()
  riempiScelte()
  /* Le quattro che hanno passato l'esame partono **accese**: la
     domanda «quanto vale ognuna?» ha già avuto risposta, e adesso
     quello che serve è guardare da dove si è arrivati e giudicare
     cosa manca ancora. Il «prima» resta a un clic. */
  tutti(true)

  document.getElementById('ambiente').addEventListener('change', e => {
    S.ambiente = e.target.value; rifai()
  })
  document.getElementById('attore').addEventListener('change', e => {
    S.attore = e.target.value || null; azzera()
  })
  document.getElementById('seme').addEventListener('input', e => {
    S.seme = +e.target.value; rifai()
  })
  document.getElementById('zoom').addEventListener('input', e => {
    S.zoom = +e.target.value
    document.getElementById('nota-zoom').textContent =
      `${S.zoom.toFixed(1)}× · cella ${Math.round(base * S.zoom)} px · ` +
      `personaggio alto ~${Math.round(base * S.zoom * 22 / 20)} px`
    rifai()
  })
  document.getElementById('vel').addEventListener('input', e => { S.vel = +e.target.value })
  document.getElementById('tutto').addEventListener('click', () => tutti(true))
  document.getElementById('niente').addEventListener('click', () => tutti(false))
  document.getElementById('fermo').addEventListener('click', e => {
    S.fermo = !S.fermo
    e.target.textContent = S.fermo ? 'riparti' : 'ferma'
  })

  window.addEventListener('resize', () => { rifai() })

  rifai()
  azzera()
  document.getElementById('zoom').dispatchEvent(new Event('input'))
  giro()
}

/* comodo da console per provare una combinazione senza cliccare */
window.__banco = { RESA, accendi, S, azzera, rifai }
