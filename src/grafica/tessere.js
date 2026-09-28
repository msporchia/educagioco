// Quale tessera va in una cella, e in che verso: vedi docs/core/grafica.md.
// Gira anche in Node (si prova in unita/tessere): niente canvas qui dentro,
// solo "che forma ha questa cella" -> una chiave.

export const VERSI = { N: [0, -1], S: [0, 1], O: [-1, 0], E: [1, 0] }
const ORDINE = ['N', 'S', 'O', 'E']
const CONTRO = { N: 'S', S: 'N', O: 'E', E: 'O' }   // il lato con cui si guarda un vicino

export const chiave = versi => ORDINE.filter(v => versi.includes(v)).join('')

export const riflessa = k => chiave([...k].map(v => (v === 'O' ? 'E' : v === 'E' ? 'O' : v)))

// dentro(x,y): la cella è dello stesso genere (zona o rete: acqua, recinto, binari)
export function collegamenti(dentro, x, y) {
  return chiave(ORDINE.filter(v => dentro(x + VERSI[v][0], y + VERSI[v][1])))
}

// un percorso (fila ordinata) è diverso da un insieme: due passaggi vicini
// non fanno un incrocio. `capi`: da che parte esce la strada a inizio/fine.
export function versiLungo(celle, i, capi = {}) {
  const qui = celle[i]
  const versi = []
  for (const altro of [celle[i - 1], celle[i + 1]]) {
    if (!altro) continue
    if (altro[1] < qui[1]) versi.push('N')
    if (altro[1] > qui[1]) versi.push('S')
    if (altro[0] < qui[0]) versi.push('O')
    if (altro[0] > qui[0]) versi.push('E')
  }
  if (i === 0 && capi.parte) versi.push(capi.parte)
  if (i === celle.length - 1 && capi.arriva) versi.push(capi.arriva)
  return chiave(versi)
}

// tavola: forma -> sprite. Manca? si cerca allo specchio. Null va mostrato: è un buco nella tavola.
export function pezzoPer(tavola, k) {
  if (tavola[k]) return { nome: tavola[k], specchia: false }
  const r = riflessa(k)
  if (tavola[r]) return { nome: tavola[r], specchia: true }
  return null
}

// le nove fette di uno stagno (centro, 4 bordi, 4 angoli): sedici
// combinazioni si riducono a nove, una lingua larga una cella prende il
// bordo di un lato invece di una figura sua (non si nota a questa misura)
export function fettaDi(dentro, x, y) {
  const fuori = ORDINE.filter(v => !dentro(x + VERSI[v][0], y + VERSI[v][1]))
  const ha = v => fuori.includes(v)
  const su = ha('N'), giu = ha('S'), sx = ha('O'), dx = ha('E')
  if (su && sx) return 'angolo-no'
  if (su && dx) return 'angolo-ne'
  if (giu && sx) return 'angolo-so'
  if (giu && dx) return 'angolo-se'
  if (su) return 'bordo-n'
  if (giu) return 'bordo-s'
  if (sx) return 'bordo-o'
  if (dx) return 'bordo-e'
  return 'centro'
}

// bordoOtto guarda anche le diagonali; vedi docs/core/grafica.md per il
// perché delle 47 forme "blob". Chiave: lati mancanti (maiuscole) + angoli
// concavi (minuscole), unite da un trattino ('N-se').
const DIAGONALI = ['NO', 'NE', 'SO', 'SE']
const VERSI_DIAG = { NO: [-1, -1], NE: [1, -1], SO: [-1, 1], SE: [1, 1] }
const FIANCHI = { NO: ['N', 'O'], NE: ['N', 'E'], SO: ['S', 'O'], SE: ['S', 'E'] }

// concavo: i due lati fianco sono dentro ma la diagonale è fuori (dove due corridoi si saldano da dentro)
export function angoliInterni(dentro, x, y) {
  return DIAGONALI.filter(d => {
    const [a, b] = FIANCHI[d]
    if (!dentro(x + VERSI[a][0], y + VERSI[a][1])) return false
    if (!dentro(x + VERSI[b][0], y + VERSI[b][1])) return false
    const [dx, dy] = VERSI_DIAG[d]
    return !dentro(x + dx, y + dy)
  })
}

export function bordoOtto(dentro, x, y) {
  const cardinali = ORDINE.filter(v => !dentro(x + VERSI[v][0], y + VERSI[v][1])).join('')
  const concavi = angoliInterni(dentro, x, y).join('').toLowerCase()
  if (!cardinali && !concavi) return 'centro'
  return cardinali + (cardinali && concavi ? '-' : '') + concavi
}

// un set senza pezzi diagonali ripiega sulla forma a 4 vicini: stesso fettaDi, letto dalla chiave a 8
export function fettaEquivalente(k8) {
  const cardinali = k8.split('-')[0].replace(/[a-z]/g, '')
  const su = cardinali.includes('N'), giu = cardinali.includes('S')
  const sx = cardinali.includes('O'), dx = cardinali.includes('E')
  if (su && sx) return 'angolo-no'
  if (su && dx) return 'angolo-ne'
  if (giu && sx) return 'angolo-so'
  if (giu && dx) return 'angolo-se'
  if (su) return 'bordo-n'
  if (giu) return 'bordo-s'
  if (sx) return 'bordo-o'
  if (dx) return 'bordo-e'
  return 'centro'
}

export function pezzoPerOtto(tavola, k8) {
  if (tavola[k8]) return { nome: tavola[k8], specchia: false }
  return pezzoPer(tavola, fettaEquivalente(k8))
}

// Gli attacchi (Wang tiles): dove passa il bordo, non se passa. Vedi
// docs/core/grafica.md. Lati letti sempre nello stesso verso (N/S da
// sinistra a destra, O/E dall'alto in basso).
export const NESSUN_ATTACCO = '·'

const ribalta = a => (a === 'sx' ? 'dx' : a === 'dx' ? 'sx' : a)   // visto dall'altra parte

export const giraSocket = s => ({ N: s.O, S: ribalta(s.E), O: ribalta(s.S), E: s.N })

export const specchiaSocket = s =>
  ({ N: ribalta(s.N), S: ribalta(s.S), O: s.E, E: s.O })

export function pose(nome, socket) {
  const fuori = []
  const viste = new Set()
  for (const specchia of [false, true]) {
    let s = specchia ? specchiaSocket(socket) : socket
    for (let gira = 0; gira < 4; gira++) {
      const k = ORDINE.map(v => s[v]).join('|')
      if (!viste.has(k)) {
        viste.add(k)
        fuori.push({ nome, gira, specchia, socket: s })
      }
      s = giraSocket(s)
    }
  }
  return fuori
}

export const latiDi = s => chiave(ORDINE.filter(v => s[v] !== NESSUN_ATTACCO))

// due vincoli: la FORMA (apertura verso prima/dopo nel percorso) e
// l'ATTACCO (bordo uguale fra vicini, chiuso verso il prato). opz.versi
// serve alle biforcazioni (due strade che si incontrano in una porta): torna
// null se non si chiude, e va mostrato — manca un pezzo al foglio.
export function componiPercorso(celle, catalogo, opz = {}) {
  const { capi = {}, dentro = () => true, seme = 0, versi = null } = opz
  const inVia = new Set(celle.map(([x, y]) => `${x},${y}`))
  const scelte = new Map()

  const dominio = celle.map(([x, y], i) => {
    const voluti = versi ? versi(x, y) : versiLungo(celle, i, capi)
    const buone = catalogo.filter(p => latiDi(p.socket) === voluti)
    return { x, y, k: `${x},${y}`, voluti, buone }
  })
  const vuoto = dominio.find(d => !d.buone.length)
  if (vuoto) return null

  const combacia = (d, p) => {
    for (const v of ORDINE) {
      const [dx, dy] = VERSI[v]
      const nx = d.x + dx, ny = d.y + dy
      const chi = scelte.get(`${nx},${ny}`)
      if (chi) {
        if (p.socket[v] !== chi.socket[CONTRO[v]]) return false
      } else if (!dentro(nx, ny)) {
        continue                       // fuori dal campo: nessun vincolo
      } else if (!inVia.has(`${nx},${ny}`)) {
        if (p.socket[v] !== NESSUN_ATTACCO) return false   // di là c'è il prato
      }
    }
    return true
  }

  function passo() {
    const resto = dominio.filter(d => !scelte.has(d.k))
    if (!resto.length) return true
    let scelta = null, cand = null   // sempre la casella con meno possibilità: fallisce prima, costa meno
    for (const d of resto) {
      const c = d.buone.filter(p => combacia(d, p))
      if (!cand || c.length < cand.length) { scelta = d; cand = c }
      if (!c.length) break
    }
    const ordinate = cand   // ordine casuale ma deterministico: stesso campo, stessa strada
      .map((p, i) => [caso(scelta.x, scelta.y, seme + i), p])
      .sort((a, b) => a[0] - b[0])
      .map(([, p]) => p)
    for (const p of ordinate) {
      scelte.set(scelta.k, p)
      if (passo()) return true
      scelte.delete(scelta.k)
    }
    return false
  }

  if (!passo()) return null
  return celle.map(([x, y]) => scelte.get(`${x},${y}`))
}

// seme = la posizione: un prato che si rimescola a ogni ridisegno sembra un guasto
export function caso(x, y, k = 0) {
  let n = (x * 374761393 + y * 668265263 + k * 2246822519) | 0
  n = ((n ^ (n >>> 13)) * 1274126177) | 0
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

// la lista può ripetere lo stesso nome: è il modo di dire «questa spunta di rado»
export const variante = (lista, x, y, k = 0) =>
  lista[Math.min(lista.length - 1, Math.floor(caso(x, y, k) * lista.length))]
