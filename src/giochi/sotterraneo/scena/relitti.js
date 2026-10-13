// I relitti e l'acqua disegnati in codice (docs/sotterraneo/piani-caverne.md). Sono provvisori: i relitti che non hanno uno sprite
// nell'atlante (macerie, crolli, rocce, travi, stalagmiti, un carro rovesciato, binari divelti) e le pozze d'acqua si
// disegnano qui a pixel interi, con i colori di pietra dello scenario (dati/relitti.js, TINTE_RELITTI); vanno dipinti, e quando
// ci saranno i pezzi basterà metterli nell'atlante e nominarli in RELITTI al posto del `disegno`. Niente stato: un disegno è
// una funzione dei suoi dati e dello scenario, e si tiene in una tela a parte (`sprite`) invece di rifarlo a ogni fotogramma.
// `ctx` lavora in pixel di sprite, come tutta la scena.
import { T } from '../dati/mondo.js'
import { TINTE_RELITTI } from '../dati/relitti.js'
import { sorteDi } from './muri.js'

const tela = new Map()

// una tela fuori schermo, disegnata una volta e poi incollata; in Node (i test) non si disegna mai niente
function sprite(chiave, w, h, disegna) {
  let c = tela.get(chiave)
  if (!c) {
    c = document.createElement('canvas')
    c.width = w; c.height = h
    const g = c.getContext('2d')
    g.imageSmoothingEnabled = false
    disegna(g)
    tela.set(chiave, c)
  }
  return c
}

const px = (g, x, y, colore) => { g.fillStyle = colore; g.fillRect(Math.round(x), Math.round(y), 1, 1) }
// un numero fisso in 0..1 per pixel e seme: lo stesso disegno si rivede sempre uguale. `variante` (0..2) cambia il disegno di
// uno stesso relitto da un posto all'altro, senza cambiarlo mai fra un fotogramma e l'altro
let variante = 0
const caso = (x, y, seme) => (sorteDi(x, y, seme + variante * 17) % 1000) / 1000

// un'ellisse di pietra, luce da in alto a sinistra: chiara sopra, scura sotto e a destra, il filo sul bordo basso
function sasso(g, cx, cy, rx, ry, t, seme) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry
    const d = nx * nx + ny * ny + (caso(x, y, seme) - 0.5) * 0.34
    if (d >= 1) continue
    const luce = -nx * 0.45 - ny * 0.85 + (caso(x, y, seme + 1) - 0.5) * 0.3
    let c = luce > 0.32 ? t.chiaro : luce < -0.3 ? t.scuro : t.medio
    if (d > 0.8) c = (nx + ny > 0.2) ? t.filo : (luce > 0 ? t.chiaro : t.medio)
    px(g, x, y, c)
  }
}

const ombra = (g, cx, cy, rx, ry) => {
  g.fillStyle = 'rgba(0,0,0,.34)'
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill()
}

// una trave: un segmento spesso `s` pixel, scuro sotto e chiaro sopra
function trave(g, x0, y0, x1, y1, s, t, seme) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n
    for (let k = 0; k < s; k++) px(g, x, y + k, k === 0 ? '#8a6a45' : k === s - 1 ? t.filo : t.legno)
    if (caso(Math.round(x), Math.round(y), seme) > 0.82) px(g, x, y + 1, t.filo)   // un nodo del legno
  }
}

const PITTORI = {
  roccia: (g, t) => { ombra(g, 8, 13.5, 7, 2); sasso(g, 7.5, 8.5, 6.6, 5.6, t, 11); sasso(g, 12.5, 11, 2.8, 2.4, t, 12) },

  macerie: (g, t) => {
    ombra(g, 8, 12, 7.5, 2)
    const pezzi = [[4, 10, 3.6, 2.6], [11, 10.2, 3.8, 2.8], [7.5, 8, 4, 3.2], [5, 6.4, 2.6, 2.2], [10.4, 6.8, 2.8, 2.4], [8, 4.6, 2.2, 1.8]]
    pezzi.forEach(([cx, cy, rx, ry], i) => sasso(g, cx, cy, rx, ry, t, 20 + i))
    px(g, 1, 12, t.medio); px(g, 14, 12, t.scuro); px(g, 2, 11, t.chiaro)
  },

  crollo: (g, t, v) => {
    if (v) {   // in piedi: un cumulo lungo due celle
      ombra(g, 8, 28, 7.5, 2)
      const m = [[8, 24, 6, 3.6], [5, 19, 3.6, 3], [11, 20, 4, 3.2], [8, 14, 5, 3.4], [5, 9, 3, 2.6], [11, 8, 3.4, 2.8], [8, 4.6, 3, 2.4]]
      m.forEach(([cx, cy, rx, ry], i) => sasso(g, cx, cy, rx, ry, t, 30 + i))
      return
    }
    ombra(g, 16, 12, 15, 2)
    const m = [[6, 9.5, 5, 3.6], [14, 9, 4.5, 3.2], [22, 9.6, 5.2, 3.6], [27, 10.4, 3.2, 2.4], [10, 5.6, 3.6, 3], [19, 5.4, 4, 3.2], [25, 6.4, 2.6, 2.2], [3, 11.2, 2.2, 1.6]]
    m.forEach(([cx, cy, rx, ry], i) => sasso(g, cx, cy, rx, ry, t, 40 + i))
  },

  trave: (g, t, v) => {
    if (v) {
      ombra(g, 8, 28, 7, 2)
      trave(g, 4, 5, 6, 26, 3, t, 51); trave(g, 11, 3, 9, 25, 3, t, 52); trave(g, 3, 14, 13, 17, 3, t, 53)
      return
    }
    ombra(g, 16, 11, 14, 2)
    trave(g, 2, 9, 29, 6, 3, t, 54); trave(g, 4, 5, 27, 10, 3, t, 55)
    sasso(g, 26, 10, 2.6, 2, t, 56)
  },

  // un cono di pietra che sale dal pavimento, con un fratello più piccolo accanto
  stalagmite: (g, t) => {
    ombra(g, 8, 20, 6.5, 1.8)
    const cono = (cx, base, alto, largo, seme) => {
      for (let y = 0; y < alto; y++) {
        const f = y / alto, m = largo * Math.pow(f, 0.85) + 0.4
        for (let x = Math.floor(cx - m); x <= Math.ceil(cx + m); x++) {
          const nx = (x + 0.5 - cx) / m
          if (Math.abs(nx) > 1) continue
          const c = nx < -0.35 ? t.chiaro : nx > 0.3 ? t.scuro : t.medio
          px(g, x, base - alto + y, Math.abs(nx) > 0.82 && nx > 0 ? t.filo : (caso(x, y, seme) > 0.9 ? t.scuro : c))
        }
      }
    }
    cono(11.5, 20, 11, 3, 61); cono(6.5, 20, 19, 4.2, 62)
  },

  // un carro da miniera rovesciato: la cassa a ruote in su, il carico sparso accanto
  carro: (g, t) => {
    ombra(g, 16, 16, 15, 2)
    // la cassa, vista dal fondo: il bordo chiaro in alto, i due pannelli scuri
    for (let y = 4; y < 14; y++) for (let x = 4; x < 26; x++) {
      const bordo = y === 4 || x === 4 || x === 25
      px(g, x, y, y === 13 ? t.filo : bordo ? t.chiaro : (y < 7 ? t.ferro : y > 11 ? t.scuro : t.medio))
    }
    for (let y = 6; y < 13; y++) { px(g, 15, y, t.filo); px(g, 14, y, t.scuro) }
    // le ruote, in aria
    for (const cx of [8, 22]) for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      const d = Math.hypot(i, j)
      if (d > 3.4) continue
      px(g, cx + i, 4 + j, d > 2.6 ? t.filo : d < 1 ? t.chiaro : t.ferro)
    }
    // il carico caduto: pezzi scuri sul pavimento
    for (const [cx, cy, r] of [[28, 13, 2.4], [26, 15, 1.8], [30, 15, 1.6], [3, 15, 1.4]]) sasso(g, cx, cy, r, r * 0.8, { ...t, medio: t.scuro, chiaro: t.medio }, 70 + cx)
  },

  // binari divelti: due ferri storti con le traversine rotte
  binari: (g, t) => {
    ombra(g, 16, 12, 14, 1.8)
    for (const x of [4, 11, 19, 26]) trave(g, x, 8 + (x % 3), x + 2, 11, 2, t, 80 + x)
    const ferro = (x0, y0, x1, y1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n
        px(g, x, y, t.chiaro); px(g, x, y + 1, t.ferro); px(g, x, y + 2, t.filo)
      }
    }
    ferro(1, 6, 18, 5); ferro(18, 5, 24, 1); ferro(3, 10, 30, 11); ferro(16, 8, 28, 3)
  },
}

// le misure dei sprite: larghezza × altezza in pixel, per verso (`v` = in piedi, lungo due celle)
const MISURE = {
  roccia: [16, 16], macerie: [16, 14], crollo: [32, 14], trave: [32, 13], stalagmite: [16, 22], carro: [32, 18], binari: [32, 14],
}
const MISURE_IN_PIEDI = { crollo: [16, 30], trave: [16, 30] }

// disegna il relitto `r` ({ x, y, w, h, disegno, v }) dello scenario `scenario`: la base sul fondo della sua ultima riga, centrato
export function dipingiRelitto(ctx, r, scenario, alfa = 1) {
  const t = TINTE_RELITTI[scenario] || TINTE_RELITTI.cantine
  const [w, h] = (r.v && MISURE_IN_PIEDI[r.disegno]) || MISURE[r.disegno]
  variante = sorteDi(r.x, r.y, 9) % 3
  const c = sprite(`${r.disegno}|${scenario}|${r.v ? 'v' : 'h'}|${variante}`, w, h, g => PITTORI[r.disegno](g, t, !!r.v))
  const x = Math.round((r.x + r.w / 2) * T - w / 2), y = (r.y + r.h) * T - h
  const prima = ctx.globalAlpha
  if (alfa !== 1) ctx.globalAlpha = prima * alfa
  ctx.drawImage(c, x, y)
  if (alfa !== 1) ctx.globalAlpha = prima
}

export const DISEGNATI = Object.keys(PITTORI)

// Una cella d'acqua: azzurro scuro con le onde chiare che scorrono piano, il bordo più scuro dove la riva è terra (a nord la riva
// è alta come un muro basso: tre righe); `riva` dice quali lati toccano terra ({ n, s, o, e }).
export function dipingiAcqua(ctx, x, y, riva, t, alfa = 1) {
  const prima = ctx.globalAlpha
  ctx.globalAlpha = prima * alfa
  const px0 = x * T, py0 = y * T
  ctx.fillStyle = '#17394e'
  ctx.fillRect(px0, py0, T, T)
  ctx.fillStyle = '#1f4f6b'
  ctx.fillRect(px0, py0 + 3, T, T - 6)
  // le onde: due righe corte per cella, sempre le stesse, che scorrono sul posto
  const h = sorteDi(x, y, 5)
  for (let k = 0; k < 2; k++) {
    const dx = Math.floor(((t * 2.2 + (h >>> (k * 5)) % 16) % 16))
    const dy = 4 + ((h >>> (8 + k * 4)) % 8)
    ctx.fillStyle = k ? 'rgba(130,200,230,.30)' : 'rgba(190,230,245,.38)'
    ctx.fillRect(px0 + dx, py0 + dy, Math.min(5, T - dx), 1)
    if (dx > T - 5) ctx.fillRect(px0, py0 + dy, 5 - (T - dx), 1)
  }
  ctx.fillStyle = '#0b1c28'
  if (riva.n) ctx.fillRect(px0, py0, T, 3)
  if (riva.s) ctx.fillRect(px0, py0 + T - 1, T, 1)
  if (riva.o) ctx.fillRect(px0, py0, 1, T)
  if (riva.e) ctx.fillRect(px0 + T - 1, py0, 1, T)
  ctx.fillStyle = 'rgba(160,215,235,.35)'   // la schiuma sulla riva
  if (riva.n) ctx.fillRect(px0, py0 + 3, T, 1)
  if (riva.s) ctx.fillRect(px0, py0 + T - 2, T, 1)
  if (riva.o) ctx.fillRect(px0 + 1, py0, 1, T)
  if (riva.e) ctx.fillRect(px0 + T - 2, py0, 1, T)
  ctx.globalAlpha = prima
}
