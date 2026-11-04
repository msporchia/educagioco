/* Il conto puro di una carta trascinata nella fila, senza Vue: che gesto è,
   quali sono i posti e su quale cade il dito. Vedi docs/passo-passo/zaino.md. */
import { SCARTO_DITO, SCARTO_MOUSE } from '../../fattoria3d/viste/dito-soglie.js'

/* da quanto un dito fermo, che poi si muove, vuole trascinare in qualunque verso (ms) */
export const TENUTO_MS = 160
/* fuori dalla fila di tanto, la carta torna al suo posto */
const FUORI = 44

/* `fermo`, `scorri` o `trascina`: di lato si trascina, su e giù si scorre —
   ma solo se la fila scorre e il dito non si era fermato sulla carta */
export function gestoDelDito({ dx, dy, ms = 0, mouse = false, puoScorrere = true }) {
  if (Math.hypot(dx, dy) <= (mouse ? SCARTO_MOUSE : SCARTO_DITO)) return 'fermo'
  if (mouse || !puoScorrere || ms >= TENUTO_MS || Math.abs(dx) > Math.abs(dy)) return 'trascina'
  return 'scorri'
}

/* la scatola più interna che contiene il posto `p`, o null */
export function scatolaDi(nodi, p) {
  for (const n of nodi) {
    if (n.che === 'mossa' || p <= n.i || p > n.fine) continue
    return scatolaDi(n.corpo, p) ?? n.i
  }
  return null
}

/* i posti che si vedono nella fila, come { p, x, y }: ai due lati di ogni
   carta e di ogni scatola, sul + delle scatole e sul primo posto libero */
export function puntiDellaFila(radice) {
  const l = []
  const metti = (p, x, r) => l.push({ p, x, y: r.top + Math.min(r.height, 44) / 2 })
  for (const el of radice.querySelectorAll('[data-tessera]')) {
    const r = el.getBoundingClientRect(), i = Number(el.dataset.tessera)
    metti(i, r.left, r)
    metti(i + 1, r.right, r)
  }
  for (const el of radice.querySelectorAll('[data-scatola]')) {
    const r = el.getBoundingClientRect(), i = Number(el.dataset.scatola)
    const coda = el.querySelector(':scope > [data-coda]')
    const t = el.querySelector(':scope > [data-testa]').getBoundingClientRect()
    metti(i, r.left, t)
    metti(i + 1, t.right, t)
    if (coda) {
      const c = coda.getBoundingClientRect()
      metti(Number(coda.dataset.coda) + 1, r.right, c)
    }
  }
  for (const el of radice.querySelectorAll('[data-bocca]')) {
    const r = el.getBoundingClientRect()
    metti(Number(el.dataset.bocca), (r.left + r.right) / 2, r)
  }
  const libero = radice.querySelector('[data-libero]')
  if (libero) {
    const r = libero.getBoundingClientRect()
    metti(Number(libero.dataset.libero), (r.left + r.right) / 2, r)
  }
  return l
}

/* il posto più vicino al dito (`scatola`: il riquadro della fila), o null se
   il dito è uscito. Dentro la carta presa, da `da` a `fine`, non si cade */
export function postoSotto(x, y, scatola, punti, da, fine) {
  if (x < scatola.left - FUORI || x > scatola.right + FUORI || y < scatola.top - FUORI || y > scatola.bottom + FUORI) return null
  let meglio = null, d = Infinity
  for (const q of punti) {
    if (q.p > da && q.p <= fine) continue
    const qui = Math.hypot(q.x - x, (q.y - y) * 1.6)   // una riga sopra è più lontana di una carta accanto
    if (qui < d) { d = qui; meglio = q.p }
  }
  return meglio
}
