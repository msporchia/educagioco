// Il campo di una tappa, in tessere: da una tappa (curva 0-1) a un elenco
// di celle da dipingere. La geometria del motore non si tocca (il gioco
// continua a camminare sulla curva vera): la curva si ricalca sulla griglia
// solo per scegliere le tessere. Con due bocche che sboccano nella stessa
// porta serve una rete e non una fila (ogni cella tiene l'insieme dei versi
// da cui la strada passa). Se il catalogo non basta si ripiega cella per
// cella e si dichiara (`approssimato`), invece di nascondere il buco.
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

// Il catalogo di un materiale, calcolato una volta sola: rifarlo a ogni
// ridisegno si sente.
const cataloghi = new Map()
export function catalogoDi(materiale) {
  if (!cataloghi.has(materiale))
    cataloghi.set(materiale, nomiDi(materiale).flatMap(n => pose(n, ATTACCHI[n])))
  return cataloghi.get(materiale)
}

// Dalla curva alle celle: niente salti in diagonale (si infila la cella di
// mezzo, o la strada si spezzerebbe) e niente ritorni (un tremolio, non un anello).
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

// Ogni cella con i versi da cui la strada la attraversa. I due capi
// guardano fuori (bordo di sopra e di sotto); un capo non sul bordo resta
// un vicolo cieco, ed è la verità (la strada finisce contro il castello).
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

// Una strada che finisce in mezzo al campo vorrebbe una tessera con un
// lato solo, che su questi fogli non c'è (le strade servono a passarci):
// si allunga dritto in giù fino al bordo, dove la copre il castello.
function finoAlBordo(celle) {
  const fuori = celle.slice()
  let [x, y] = fuori[fuori.length - 1]
  while (y < RIGHE - 1) fuori.push([x, ++y])
  return fuori
}

// Quando il catalogo non basta: cella per cella, la posa che litiga di
// meno con quelle già messe (forma giusta sempre, attacchi il più
// possibile). Non è la soluzione, è la meno peggio (`storti` la conta).
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
      // il pareggio lo rompe il posto, non l'ordine del catalogo: due
      // celle uguali restano uguali a ogni ridisegno
      const voto = n + caso(x, y, seme + i) * 0.5
      if (voto > punti) { punti = voto; meglio = p }
    })
    if (meglio) scelte.set(`${x},${y}`, meglio)
  }
  return celle.map(([x, y]) => scelte.get(`${x},${y}`) || null)
}

// Un fondo pescato in parti uguali fra due-tre terreni si vede come una
// scacchiera: uno solo fa da fondo, gli altri spuntano di rado (7 su 8).
function prato(materiale, seme) {
  const quali = pratiDi(materiale)
  if (quali.length < 2) return () => quali[0] || null
  const lista = [...Array(11).fill(quali[0]), ...quali.slice(1)]
  return (x, y) => variante(lista, x, y, seme)
}

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
    bocche: perc.vie.map(v => v.inizio),
    porta: perc.vie[0].fine,
  }
}

// tutte le tappe in fila: passa di qui (non dalla vista) perché la stessa
// fila la usa il banco di prova
export const TAPPE = RACCONTO
