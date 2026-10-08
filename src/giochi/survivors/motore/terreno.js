// Il terreno: il mondo senza bordi diviso in riquadri, ognuno con zero,
// uno o due ostacoli (un bosco, un mucchio di rocce, uno stagno) che non
// si attraversano. Tutto si ricava dal seme e dalla posizione, quindi
// non si salva niente e la stessa tappa ha sempre la stessa carta.
// Le regole: docs/survivors/terreno.md.
import { terrenoDi, TIPI_OSTACOLO } from '../dati/terreno.js'

export const RIQUADRO = 480
// un ostacolo resta così lontano dal bordo del suo riquadro: fra due
// ostacoli vicini passano sempre due colossi affiancati, e nessun
// recinto si chiude
const MARGINE = 56
const LIBERO = 250           // intorno al punto di partenza niente ostacoli
const ZONA = 1500            // quanto è larga una zona (fitta o aperta)
const GENERE = 2600          // quanto è larga una zona di un genere (laghi, boschi, montagne)
const MACCHIA = 1100         // quanto è larga una macchia di un altro posto
const QUALE = 3000           // ogni quanto cambia il posto che fa le macchie
const SOGLIA_MACCHIA = 0.675 // più è alta, più le macchie sono rare
const CASA = 900             // intorno alla partenza si è nel posto della tappa
// da quanto lontano si comincia a girare intorno: il pilota del banco
// (un bambino vede lo stagno) da lontano, un mostro solo quando ci sbatte
export const ATTENZIONE = { occhio: 30, muso: 4 }

/* il caso ripetibile: stesso posto, stesso numero */
export function caso(i, j, k = 0, s = 0) {
  let x = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263)
        ^ Math.imul(k | 0, 1442695041) ^ Math.imul(s | 0, 1103515245)
  x = Math.imul(x ^ x >>> 13, 1274126177)
  return ((x ^ x >>> 16) >>> 0) / 4294967296
}

/* un rumore liscio fra 0 e 1: le zone sfumano una nell'altra */
export function rumore(x, y, s = 0) {
  const i = Math.floor(x), j = Math.floor(y)
  const fx = x - i, fy = y - j
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
  const a = caso(i, j, 0, s), b = caso(i + 1, j, 0, s)
  const c = caso(i, j + 1, 0, s), d = caso(i + 1, j + 1, 0, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

export function semeDi(testo = '') {
  let h = 2166136261
  for (let i = 0; i < testo.length; i++) h = Math.imul(h ^ testo.charCodeAt(i), 16777619)
  return h >>> 0
}

export class Terreno {
  constructor(scenario, seme = 1) {
    this.scenario = scenario
    this.regola = terrenoDi(scenario)
    this.seme = seme | 0
    this.cache = new Map()
    this.trovati = []
  }

  // quanto è fitta la zona qui, fra 0 (aperta) e 1 (fitta): il rumore
  // stretto in una fascia, così fra un prato aperto e un posto pieno di
  // ostacoli il passaggio si vede
  zona(x, y) {
    const z = rumore(x / ZONA, y / ZONA, this.seme + 7)
    return Math.max(0, Math.min(1, (z - 0.4) / 0.22))
  }

  // il posto qui: quello della tappa, o quello di una macchia. Il bordo
  // si sfrangia con un rumore più fine, così non è un cerchio
  bioma(x, y) {
    const macchie = this.regola.macchie
    if (!macchie?.length) return this.scenario
    const casa = Math.max(0, 1 - Math.hypot(x, y) / CASA) * 0.5
    // i rumori fini girano di traverso: dritti, le loro forme seguono la
    // griglia e la macchia ha buchi rettangolari
    const u = x * 0.8 + y * 0.6, v = y * 0.8 - x * 0.6
    const m = 0.75 * rumore(x / MACCHIA, y / MACCHIA, this.seme + 21)
            + 0.25 * rumore(u / 280, v / 280, this.seme + 22)
            + 0.07 * rumore(v / 45, u / 45, this.seme + 24) - casa
    if (m < SOGLIA_MACCHIA) return this.scenario
    const q = rumore(x / QUALE, y / QUALE, this.seme + 23)
    return macchie[Math.min(macchie.length - 1, Math.floor(q * 1.6 * macchie.length - 0.3 * macchie.length))] ||
           macchie[0]
  }

  // di che genere è la zona: 0 laghi, 1 boschi, 2 montagne (il tipo che
  // ci esce quattro volte più spesso degli altri)
  genere(x, y) {
    const g = rumore(x / GENERE, y / GENERE, this.seme + 11)
    return g < 0.43 ? 0 : g < 0.57 ? 1 : 2
  }

  riquadro(i, j) {
    const chiave = i * 65536 + j
    let r = this.cache.get(chiave)
    if (r) return r
    if (this.cache.size > 800) this.cache.clear()
    r = this.componi(i, j)
    this.cache.set(chiave, r)
    return r
  }

  componi(i, j) {
    const s = this.seme, S = RIQUADRO
    const cx = (i + 0.5) * S, cy = (j + 0.5) * S
    const z = this.zona(cx, cy)
    const genere = TIPI_OSTACOLO[this.genere(cx, cy)]
    const bioma = this.bioma(cx, cy)
    // quanti li decide la tappa (è una manopola di difficoltà), di che
    // tipo il posto: una macchia di neve nel prato ha gli ostacoli radi del prato
    const regola = terrenoDi(bioma)
    const attesi = this.regola.ostacoli * (0.12 + 2.4 * z)
    let quanti = Math.floor(attesi) + (caso(i, j, 1, s) < attesi % 1 ? 1 : 0)
    quanti = Math.min(2, quanti)
    const ostacoli = []
    for (let k = 0; k < quanti; k++) {
      const c = (n) => caso(i, j, 10 + k * 10 + n, s)
      const tipo = this.pesca(c(0), genere, regola)
      let rx, ry
      if (tipo === 'acqua') { rx = 70 + c(1) * 70; ry = rx * (0.62 + c(2) * 0.2) }
      else if (tipo === 'bosco') { rx = 50 + c(1) * 80; ry = rx * (0.45 + c(2) * 0.45) }
      else {
        // le montagne: una cresta lunga e stretta, di traverso o in piedi
        rx = 120 + c(1) * 64; ry = 34 + c(2) * 22
        if (c(6) < 0.5) [rx, ry] = [ry, rx]
      }
      const x = i * S + MARGINE + rx + c(3) * (S - 2 * (MARGINE + rx))
      const y = j * S + MARGINE + ry + c(4) * (S - 2 * (MARGINE + ry))
      // un ostacolo prende il posto del suo centro (un abete innevato al
      // bordo di una macchia di neve, anche se un piede sta nel prato)
      const o = { tipo, x, y, rx, ry, bioma: this.bioma(x, y), seme: Math.floor(c(5) * 1e9) }
      if (Math.hypot(x, y) - Math.max(rx, ry) < LIBERO) continue
      if (ostacoli.some(p => Math.hypot(p.x - o.x, p.y - o.y) <
                              Math.max(p.rx, p.ry) + Math.max(rx, ry) + 2 * MARGINE)) continue
      ostacoli.push(o)
    }
    return { i, j, zona: z, ostacoli }
  }

  pesca(q, genere, regola = this.regola) {
    const tipi = regola.tipi
    const peso = k => (tipi[k] || 0) * (k === genere ? 4 : 1)
    let tot = 0
    for (const k of TIPI_OSTACOLO) tot += peso(k)
    let s = q * tot
    for (const k of TIPI_OSTACOLO) { s -= peso(k); if (s <= 0 && tipi[k]) return k }
    return TIPI_OSTACOLO.find(k => tipi[k]) || 'rocce'
  }

  // gli ostacoli dei nove riquadri intorno a (x, y): un ostacolo non
  // esce dal suo riquadro, quindi basta. L'elenco si riusa: chi lo
  // legge non lo tiene.
  vicini(x, y) {
    const out = this.trovati
    out.length = 0
    const i0 = Math.floor(x / RIQUADRO), j0 = Math.floor(y / RIQUADRO)
    for (let j = j0 - 1; j <= j0 + 1; j++)
      for (let i = i0 - 1; i <= i0 + 1; i++)
        for (const o of this.riquadro(i, j).ostacoli) out.push(o)
    return out
  }

  // quelli che toccano un rettangolo (chi disegna lo schermo)
  dentro(x0, y0, x1, y1) {
    const out = []
    for (let j = Math.floor(y0 / RIQUADRO); j <= Math.floor(y1 / RIQUADRO); j++)
      for (let i = Math.floor(x0 / RIQUADRO); i <= Math.floor(x1 / RIQUADRO); i++)
        for (const o of this.riquadro(i, j).ostacoli)
          if (o.x + o.rx > x0 && o.x - o.rx < x1 && o.y + o.ry > y0 && o.y - o.ry < y1) out.push(o)
    return out
  }

  libero(x, y, r = 0) {
    for (const o of this.vicini(x, y)) {
      const dx = (x - o.x) / (o.rx + r), dy = (y - o.y) / (o.ry + r)
      if (dx * dx + dy * dy < 1) return false
    }
    return true
  }

  // rimette fuori un cerchio entrato in un ostacolo, lungo il raggio
  // dell'ellisse: torna true se l'ha spostato
  spingiFuori(c, r = 0) {
    let mosso = false
    for (const o of this.vicini(c.x, c.y)) {
      const ax = o.rx + r, ay = o.ry + r
      const dx = c.x - o.x, dy = c.y - o.y
      const q = Math.sqrt((dx / ax) ** 2 + (dy / ay) ** 2)
      if (q >= 1) continue
      if (q < 1e-6) { c.x = o.x + ax; mosso = true; continue }
      c.x = o.x + dx / q
      c.y = o.y + dy / q
      mosso = true
    }
    return mosso
  }

  // la direzione (ux, uy) corretta per girare intorno agli ostacoli
  // davanti: chi punta dritto contro un'ellisse ne prende la tangente.
  // Torna [ux, uy], di lunghezza uno.
  aggira(x, y, r, ux, uy, attenzione = ATTENZIONE.occhio) {
    let hx = ux, hy = uy
    for (const o of this.vicini(x, y)) {
      const ax = o.rx + r + attenzione, ay = o.ry + r + attenzione
      const dx = x - o.x, dy = y - o.y
      const q = Math.sqrt((dx / ax) ** 2 + (dy / ay) ** 2)
      if (q >= 1) continue
      // la normale dell'ellisse qui (il gradiente)
      let nx = dx / (ax * ax), ny = dy / (ay * ay)
      const nl = Math.hypot(nx, ny) || 1
      nx /= nl; ny /= nl
      const verso = hx * nx + hy * ny
      if (verso >= 0) continue                 // se ne sta già andando
      let tx = hx - nx * verso, ty = hy - ny * verso
      let tl = Math.hypot(tx, ty)
      if (tl < 0.25) {                         // dritto contro il centro: un lato a caso, sempre lo stesso
        const lato = (o.seme & 1) ? 1 : -1
        tx = -ny * lato; ty = nx * lato; tl = 1
      }
      tx /= tl; ty /= tl
      const w = Math.min(1, (1 - q) * 3)
      hx = hx + (tx - hx) * w; hy = hy + (ty - hy) * w
      const hl = Math.hypot(hx, hy) || 1
      hx /= hl; hy /= hl
    }
    return [hx, hy]
  }
}
