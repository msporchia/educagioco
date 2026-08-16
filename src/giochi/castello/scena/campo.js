/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO DI UNA TAPPA, IN TESSERE

   Da una tappa del castello — che è dato puro, e non sa niente di
   sprite — a un elenco di celle da dipingere. Niente canvas qui dentro:
   gira in Node, e infatti `unita/castello-campo` gioca tutte e venti le
   tappe senza aprire niente.

   ── la strada resta una curva, e diventa celle solo per il disegno ──
   Il motore cammina sulla spezzata smussata di `motore/castello/percorso.js`:
   un nemico sta a `d` metri dall'ingresso, una torre spara a chi è a
   meno di tanto. Quella geometria **non si tocca** — cambiarla vorrebbe
   dire rifare `npm run tara`, il validatore e venti mappe. Qui la curva
   si *ricalca* sulla griglia, e il ricalco serve solo a scegliere le
   tessere: il gioco continua a camminare sulla curva vera, che passa
   dentro le celle scelte. Le due cose possono discostarsi di mezza
   cella, ed è quanto una strada disegnata è più larga del filo su cui si
   cammina — cioè invisibile.

   ── perché una rete e non una fila ──
   Metà delle tappe hanno due ingressi, e le due strade **sboccano nella
   stessa porta**: nelle ultime celle si incontrano. Una fila ordinata
   non sa raccontarlo, una rete sì — ogni cella tiene l'insieme dei versi
   da cui la strada entra ed esce, e dove le due si incontrano i versi
   sono tre. È per questo che `componiPercorso` accetta un `versi()`
   invece della sola fila.

   ── quando non si chiude ──
   Il risolutore torna `null` se al foglio manca il pezzo che ci
   vorrebbe, e succede: sette famiglie di tessere, una quindicina di
   pezzi ciascuna, e certe forme non ci sono proprio. In quel caso si
   ripiega su una scelta cella per cella — la forma giusta, gli attacchi
   come vengono — e si **dichiara** (`approssimato`). Un campo che si
   vede storto e lo dice è utile; un campo che nasconde il buco mettendo
   una tessera a caso non lo è.
   ═══════════════════════════════════════════════════════════════════ */
import { Percorso } from '../../../motore/castello/percorso.js'
import { RACCONTO } from '../../../data/campagne-castello.js'
import { postiDi } from '../../../data/castello.js'
import { componiPercorso, pose, latiDi, chiave, variante, caso }
  from '../../../grafica/tessere.js'
import { ATTACCHI, nomiDi, pratiDi } from '../dati/atlante.js'
import { MONDO, CELLA, COLONNE, RIGHE, cellaDi, dentroIlCampo, materialeDi }
  from '../dati/mondo.js'

const VERSI_ORDINE = ['N', 'S', 'O', 'E']
const CONTRO = { N: 'S', S: 'N', O: 'E', E: 'O' }
const PASSI = { N: [0, -1], S: [0, 1], O: [-1, 0], E: [1, 0] }

/* Il catalogo di un materiale: ogni tessera nelle sue pose. Si calcola
   una volta sola per materiale — otto pose per quindici tessere sono
   centoventi oggetti, e rifarli a ogni ridisegno si sente. */
const cataloghi = new Map()
export function catalogoDi(materiale) {
  if (!cataloghi.has(materiale))
    cataloghi.set(materiale, nomiDi(materiale).flatMap(n => pose(n, ATTACCHI[n])))
  return cataloghi.get(materiale)
}

/* ── dalla curva alle celle ──
   Si campiona fitto (un quarto di cella) e si tiene la cella di ogni
   punto. Due accortezze, e sono tutte e due dovute al fatto che una
   curva non sa niente di caselle:
     · **niente salti in diagonale**. Passando dall'angolo di due celle
       il campionamento salta di sbieco, e due celle in diagonale non si
       toccano: la strada si spezzerebbe. Si infila la cella di mezzo.
     · **niente ritorni**. Una curva che rientra nella cella da cui è
       appena uscita non fa un anello, fa un tremolio: si scarta. */
function celleLungo(via) {
  const fuori = []
  const gia = new Set()
  const spingi = (x, y) => {
    const u = fuori[fuori.length - 1]
    if (u && u[0] === x && u[1] === y) return
    fuori.push([x, y])
    gia.add(`${x},${y}`)
  }
  for (const p of via.campiona(CELLA / 4)) {
    const [x, y] = cellaDi(p.x, p.y)
    const u = fuori[fuori.length - 1]
    if (u && u[0] !== x && u[1] !== y) spingi(x, u[1])   // il gomito che manca
    spingi(x, y)
  }
  return fuori
}

/* ── la rete ──
   Ogni cella con i versi da cui la strada la attraversa. I due capi
   guardano fuori: la strada entra dal bordo di sopra ed esce da quello
   di sotto, e un capo che non è sul bordo — capita, perché la porta del
   castello sta un filo dentro — resta un vicolo cieco, che è la verità:
   lì la strada finisce contro il castello. */
function rete(vie) {
  const versi = new Map()
  const dai = (x, y, v) => {
    const k = `${x},${y}`
    if (!versi.has(k)) versi.set(k, new Set())
    if (v) versi.get(k).add(v)
  }
  for (const celle of vie) {
    for (let i = 0; i < celle.length; i++) {
      const [x, y] = celle[i]
      dai(x, y, null)
      const dopo = celle[i + 1]
      if (!dopo) continue
      const v = dopo[1] < y ? 'N' : dopo[1] > y ? 'S' : dopo[0] < x ? 'O' : 'E'
      dai(x, y, v)
      dai(dopo[0], dopo[1], CONTRO[v])
    }
    const [px, py] = celle[0]
    const [ux, uy] = celle[celle.length - 1]
    if (py <= 0) dai(px, py, 'N')
    dai(ux, uy, 'S')
  }
  return versi
}

/* ── fino al bordo, e non un passo prima ──
   Una strada che finisce in mezzo al campo vuole una tessera con un lato
   solo, e un vicolo cieco su questi fogli non c'è: non è una mancanza
   del disegno, è che le strade servono a passarci. Capita sempre in
   fondo — i percorsi finiscono a `y = 0,95` del riquadro, che è una
   cella sopra il bordo di sotto — e potare il mozzicone non funziona: si
   pota la coda, e allora la penultima diventa mozzicone a sua volta,
   finché non resta niente. Una fila si srotola tutta.

   Quindi si allunga, dritto in giù fino al bordo. Quella cella la copre
   il castello, e la strada gli arriva sotto invece di fermarsi due dita
   prima. */
function finoAlBordo(celle) {
  const fuori = celle.slice()
  let [x, y] = fuori[fuori.length - 1]
  while (y < RIGHE - 1) fuori.push([x, ++y])
  return fuori
}

/* ── il ripiego ──
   Quando il catalogo non basta a chiudere tutto, si va cella per cella e
   si prende la posa che **litiga di meno** con quelle già messe: forma
   giusta sempre, attacchi il più possibile. Non è la soluzione, è la
   meno peggio, e quanto sia peggio si conta — `storti`, i giunti dove
   due tessere non si guardano negli occhi.

   Prima qui si pescava a caso fra le pose della forma giusta, e su una
   strada di quaranta celle veniva fuori un campo di gomiti sbagliati che
   sembrava un guasto invece di un limite. Contare i giunti e sceglierli
   costa una riga in più e cambia quello che si vede. */
function ripiego(celle, catalogo, versi, seme) {
  const scelte = new Map()
  for (const [x, y] of celle) {
    const buone = catalogo.filter(p => latiDi(p.socket) === versi(x, y))
    let meglio = null, punti = -1
    buone.forEach((p, i) => {
      let n = 0
      for (const v of VERSI_ORDINE) {
        const [dx, dy] = PASSI[v]
        const chi = scelte.get(`${x + dx},${y + dy}`)
        if (chi && p.socket[v] === chi.socket[CONTRO[v]]) n++
      }
      /* il pareggio lo rompe il posto, non l'ordine del catalogo: due
         celle uguali devono restare uguali a ogni ridisegno */
      const voto = n + caso(x, y, seme + i) * 0.5
      if (voto > punti) { punti = voto; meglio = p }
    })
    if (meglio) scelte.set(`${x},${y}`, meglio)
  }
  return celle.map(([x, y]) => scelte.get(`${x},${y}`) || null)
}

/* ── il fondo ──
   Un materiale ha due o tre terreni pieni. Pescarli in parti uguali
   sembra l'idea giusta e non lo è: si vede una scacchiera di verde
   chiaro e verde scuro, con gli spigoli netti di una griglia — cioè
   esattamente quello che un fondo deve nascondere. Uno solo fa da fondo
   e gli altri **spuntano di rado**: sette caselle su otto sono il primo,
   l'ottava è una delle altre, e a quel punto il prato torna a leggersi
   come un prato con qualcosa dentro.

   Il trucco è già previsto da `variante`, che sceglie da una lista dove
   un nome può comparire più volte: ripetere è il modo di dire «questa
   spunta di rado» senza aggiungere un'altra funzione. */
function prato(materiale, seme) {
  const quali = pratiDi(materiale)
  if (quali.length < 2) return () => quali[0] || null
  const lista = [...Array(11).fill(quali[0]), ...quali.slice(1)]
  return (x, y) => variante(lista, x, y, seme)
}

/* quanti giunti non combaciano, fra celle di strada vicine */
function giuntiStorti(celle, scelte, mappa) {
  const dove = new Map(celle.map(([x, y], i) => [`${x},${y}`, scelte[i]]))
  let storti = 0
  for (const [x, y] of celle) {
    const qui = dove.get(`${x},${y}`)
    if (!qui) continue
    for (const v of ['S', 'E']) {            // una coppia si guarda una volta sola
      const [dx, dy] = PASSI[v]
      const la = dove.get(`${x + dx},${y + dy}`)
      if (la && qui.socket[v] !== la.socket[CONTRO[v]]) storti++
    }
  }
  return storti
}

/* ── il campo ──
   `{ materiale, celle, strada, prato, postazioni, vie, approssimato,
      mancanti }`, tutto già in celle e pronto da dipingere. */
export function campoDi(tappa, quante = postiDi(tappa), seme = 1) {
  const materiale = materialeDi(tappa.ambiente)
  const perc = new Percorso(tappa.forme || tappa.forma, quante, MONDO)
  const vie = perc.vie.map(v => finoAlBordo(celleLungo(v)))
  const mappa = rete(vie)
  const celle = [...mappa.keys()].map(k => k.split(',').map(Number))
  const versi = (x, y) => chiave([...(mappa.get(`${x},${y}`) || [])])

  const catalogo = catalogoDi(materiale)
  const opz = { dentro: dentroIlCampo, versi, seme }
  let scelte = componiPercorso(celle, catalogo, opz)
  const approssimato = !scelte
  if (approssimato) scelte = ripiego(celle, catalogo, versi, seme)

  const strada = celle.map(([x, y], i) => ({ x, y, posa: scelte[i], versi: versi(x, y) }))
  const mancanti = strada.filter(c => !c.posa).map(c => `${c.x},${c.y} ${c.versi}`)
  const storti = approssimato ? giuntiStorti(celle, scelte, mappa) : 0

  return {
    materiale, celle, strada, vie, approssimato, mancanti, storti,
    postazioni: perc.postazioni,
    prato: prato(materiale, seme),
    /* il primo e l'ultimo punto della strada: di là arrivano i mostri, di
       qua c'è la porta. Chi disegna le figure ne ha bisogno e non deve
       ricalcolarsi il percorso. */
    bocche: perc.vie.map(v => v.inizio),
    porta: perc.vie[0].fine,
  }
}

/* Tutte le tappe in fila, così com'è l'ordine in cui si giocano. Passa
   di qui e non dalla vista perché la stessa fila la usa il banco di
   prova, che di viste non ne apre nessuna. */
export const TAPPE = RACCONTO
