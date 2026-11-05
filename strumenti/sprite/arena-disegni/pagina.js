// Quello che gira nel browser di `strumenti/sprite/disegni-arena.mjs`: disegna a monte, col programma, tutto ciò che in partita è solo
// un'immagine (docs/arena/grafica.md). Il gioco non importa questo file.
import { SCENE, PEZZI as VESTITI } from '../../../src/giochi/castello/dati/vestiti.js'
import { TERRENI } from '../../../src/giochi/arena/dati/regole.js'
import { ambiente } from '../../../src/giochi/arena/scena/ambienti.js'
import { dipingi, hex } from './terreno.js'
import { disegnaPonte, disegnaPorta, disegnaMiniera, disegnaRuderiMiniera, stendardo } from './opere.js'

const LARGO = 1024
const K = 2                                  // px dell'atlante per unità del mondo: la porta e il ponte
const KM = 128 / 70                          // la miniera: come le caserme, la piazzola è larga 128 px
const ROCCIA = ['#5a5260', '#8a8290', '#bcb4c0']   // la miniera è uguale dappertutto: sul terreno scuro deve staccare
const FOTOGRAMMI = 4, PERIODO = 2 * Math.PI / 4.2
export const PEZZO = { x: -225, y: 0, w: 810, h: 540 }

export const terreno = chiave => dipingi(chiave, PEZZO, 2).toDataURL('image/png')

function tela(w, h, fai) {
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w); cv.height = Math.ceil(h)
  fai(cv.getContext('2d'))
  return cv
}

/* il castello della squadra di chi gioca, blu anche negli stendardi (il nemico è lo stesso col blu fatto rosso), e il prato dipinto ai
   suoi piedi prende il colore del posto: il foglio è del bosco del castello a torri, e qui il bosco non c'è */
function castello(img, a) {
  const [sx, sy, w, h] = VESTITI.bosco.castello
  return tela(w, h, c => {
    c.drawImage(img, sx, sy, w, h, 0, 0, w, h)
    const d = c.getImageData(0, 0, w, h), p = d.data, terra = a.terra.map(hex)
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i], g = p[i + 1], b = p[i + 2]
      if (r > g + 60 && r > b + 60) { p[i] = Math.round(b * 0.8); p[i + 1] = Math.round(g * 1.1); p[i + 2] = r }
      else if (g > r + 14 && g > b + 14) {
        const t = terra[Math.min(terra.length - 1, Math.floor((r + g + b) / 765 * terra.length * 1.4))]
        p[i] = t[0]; p[i + 1] = t[1]; p[i + 2] = t[2]
      }
    }
    c.putImageData(d, 0, 0)
  })
}

const porta = (a, hp) => tela(70 * K, 36 * K, c => disegnaPorta(c, { x: 35 * K, y: 30 * K, S: K, lato: 'io', hp, max: 100, pietra: a.ponte.pietra }))
const ponte = a => tela(64 * K, 74 * K, c => disegnaPonte(c, { x0: 6 * K, x1: 58 * K, y0: 4 * K, y1: 70 * K, m: v => v * K * 0.706, colori: a.ponte }))
const miniera = stadio => tela(150, 190, c => disegnaMiniera(c, { x: 75, piede: 176, u: v => v * KM, stadio, lato: 'io', ora: 1.2, sasso: ROCCIA }))
const rudere = () => tela(150, 120, c => disegnaRuderiMiniera(c, { x: 75, piede: 106, u: v => v * KM, sasso: ROCCIA }))
const bandiera = (verso, i) => tela(16 * K, 14 * K, c => stendardo(c, (verso > 0 ? 2 : 14) * K, 14 * K, 13 * K, 11 * K, '#3d8bff', i * PERIODO / FOTOGRAMMI, verso))

/* l'atlante: { pezzi, url }. Di ogni pezzo [x, y, largo, alto]; le miniere hanno in più il centro e il piede, come le caserme */
export async function opere() {
  const img = new Image()
  await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = SCENE.bosco })
  const figure = []
  for (const k of TERRENI) {
    const a = ambiente(k)
    figure.push([`castello:${k}`, castello(img, a)], [`ponte:${k}`, ponte(a)],
                [`porta:${k}:intera`, porta(a, 100)], [`porta:${k}:rotta`, porta(a, 30)], [`porta:${k}:crollata`, porta(a, 0)])
  }
  figure.push(['miniera:1', miniera(1), 75, 176], ['miniera:2', miniera(2), 75, 176], ['miniera:rudere', rudere(), 75, 106])
  for (let i = 0; i < FOTOGRAMMI; i++) figure.push([`stendardo:d:${i}`, bandiera(1, i)], [`stendardo:s:${i}`, bandiera(-1, i)])
  figure.sort((p, q) => q[1].height - p[1].height)
  const pezzi = {}
  let x = 0, y = 0, alto = 0
  for (const [nome, cv, cx, piede] of figure) {
    if (x + cv.width > LARGO) { x = 0; y += alto + 2; alto = 0 }
    pezzi[nome] = cx === undefined ? [x, y, cv.width, cv.height] : [x, y, cv.width, cv.height, cx, piede]
    x += cv.width + 2; alto = Math.max(alto, cv.height)
  }
  const atlante = tela(LARGO, y + alto, c => { for (const [nome, cv] of figure) c.drawImage(cv, pezzi[nome][0], pezzi[nome][1]) })
  return { pezzi, url: atlante.toDataURL('image/webp', 0.95) }
}
