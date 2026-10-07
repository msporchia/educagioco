// Il giro del mondo e la piazza della bancarella: la strada dell'aereo fra
// due città, e dove stanno i banchi nella piazza con la strada del carretto.
// Puro, gira in Node: i disegni stanno in grafica/bancarella-mondo.js, le
// scelte in docs/bancarella/mappa.md.
import { lunghezza, lungo, giro } from '../asteroidi/rotta.js'

export { lunghezza, lungo, giro }

/* ═══════════ l'aereo ═══════════ */

// se il verso cambia più di così, l'aereo prima gira sul posto
export const GIRA_PRIMA = 0.35

/* L'arco fra due posti: sempre dalla parte di sopra (il cielo è in alto), e
   tanto più alto quanto più è lungo. Lo stesso in andata e in ritorno: la
   rotta tratteggiata fra due città è proprio questa. */
export function arco(a, b, passi = 56) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1
  let nx = dy / d, ny = -dx / d
  if (ny > 0 || (ny === 0 && nx < 0)) { nx = -nx; ny = -ny }
  const alto = Math.min(150, d * 0.26)
  const c = { x: (a.x + b.x) / 2 + nx * alto * 2, y: (a.y + b.y) / 2 + ny * alto * 2 }
  const punti = []
  for (let i = 0; i <= passi; i++) {
    const t = i / passi, u = 1 - t
    punti.push([u * u * a.x + 2 * u * t * c.x + t * t * b.x, u * u * a.y + 2 * u * t * c.y + t * t * b.y])
  }
  return punti
}

// la d di un tratto SVG, dai punti di un arco
export const tratto = punti => punti.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')

/* quanto dura un volo: abbastanza da vederlo, mai un'attesa lunga */
export const durataVolo = l => Math.max(1.2, Math.min(3, l / 240))

/* il verso con cui l'aereo arriva: la tangente dell'arco alla fine */
export function versoFinale(punti) {
  const a = punti[punti.length - 2], b = punti[punti.length - 1]
  return Math.atan2(b[1] - a[1], b[0] - a[0])
}
export function versoIniziale(punti) {
  const a = punti[0], b = punti[1]
  return Math.atan2(b[1] - a[1], b[0] - a[0])
}

/* Il verso a cui l'aereo sta fermo senza aver mai volato: quello della rotta
   che arriva alla sua città, o di quella che parte se è la prima. */
export function versoDiPartenza(posti, k) {
  const p = k > 0 ? arco(posti[k - 1], posti[k]) : posti.length > 1 ? arco(posti[0], posti[1]) : null
  if (!p) return 0
  return k > 0 ? versoFinale(p) : versoIniziale(p)
}

/* quanto è alto l'aereo a metà volo: 0 a terra, 1 al punto più alto
   (serve alla sua ombra e a quanto sembra grosso) */
export const quota = q => Math.sin(Math.PI * Math.max(0, Math.min(1, q)))

/* ═══════════ la piazza ═══════════ */

export const PIAZZA_MAX = 520        // oltre, la piazza resta in mezzo
const CIELO = 214                    // il cielo con il monumento
const PASSO = 138                    // fra un banco e il successivo
const FONDO = 118                    // sotto il primo banco: il cartello
const BANCO = { w: 124, h: 108 }

/* I banchi stanno uno sopra l'altro, a destra e a sinistra di un viale: il
   primo in basso, vicino al cartello da cui si arriva, gli altri su verso il
   monumento. Il carretto sta davanti al banco, sul selciato; si muove solo
   lungo il viale e per piccoli tratti verso il banco (`stradaCarretto`), e a
   quell'altezza non c'è mai un banco di mezzo. */
export function disponiPiazza(W, n, altezzaMin = 0) {
  const w = Math.min(W, PIAZZA_MAX)
  const centro = w / 2
  const scosto = Math.max(84, Math.min(112, w * 0.225))
  const H = Math.max(altezzaMin, CIELO + n * PASSO + FONDO)
  const banchi = []
  for (let k = 0; k < n; k++) {
    const lato = k % 2 === 0 ? -1 : 1
    const x = centro + lato * scosto
    const y = H - FONDO - (k + 1) * PASSO + 26         // il tetto del banco (x è il suo centro)
    banchi.push({ k, lato, x, y, w: BANCO.w, h: BANCO.h,
                  posto: { x: centro + lato * (scosto - 30), y: y + BANCO.h + 20 } })
  }
  const cartello = { x: centro, y: H - FONDO / 2 - 4 }
  const ingresso = { x: centro, y: H - 52 }              // da dove si arriva
  return { W: w, H, centro, banchi, cartello, ingresso, cielo: CIELO }
}

/* La strada del carretto da un punto a un altro: fino al viale, su o giù lungo
   il viale, e dentro verso il posto. A ogni altezza di un posto sotto un banco
   non c'è niente di mezzo. */
export function stradaCarretto(piazza, da, a) {
  const c = piazza.centro
  const p = [[da.x, da.y]]
  const aggiungi = (x, y) => {
    const u = p[p.length - 1]
    if (Math.hypot(u[0] - x, u[1] - y) > 0.5) p.push([x, y])
  }
  aggiungi(c, da.y)
  aggiungi(c, a.y)
  aggiungi(a.x, a.y)
  return p
}

/* quanto dura un tratto del carretto */
export const durataCarretto = l => Math.max(0.45, Math.min(1.7, l / 300))
