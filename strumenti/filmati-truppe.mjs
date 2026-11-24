/* I filmatini delle truppe di Castle Battle, una per una e senza il campo attorno: per vedere se il passo, le ali e il colpo
   reggono, a 60 fotogrammi al secondo e a velocità vera.

     node strumenti/filmati-truppe.mjs <cartella> [truppa…]

   Per ogni truppa un `<truppa>.mp4`: in alto quella di chi gioca che va a destra, sotto quella del nemico che va a sinistra
   (specchiata, col suo foglio), per tre secondi alla sua velocità, poi ferma, poi colpisce col suo ritmo. Il terreno ha dei ciuffi
   fermi: un piede che scivola si vede lì. Posa, cadenza e saltello vengono da `andatura()` di `scena/figure.js`, la stessa del
   gioco; la misura è quella di un telefono largo 390 (`m()` di `scena/campo.js`), con sei pixel per punto: il doppio di un
   telefono, per vedere bene. Serve ffmpeg.
   Docs: docs/arena/grafica.md, «Il passo». */
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { apriBrowser, RADICE } from '../test/aiuto/browser.mjs'
import { andatura, SCALA, DIPINTE, RISOLUZIONE } from '../src/giochi/arena/scena/figure.js'
import { ATLANTE } from '../src/giochi/arena/dati/truppe-dipinte.js'
import { TRUPPE } from '../src/giochi/arena/dati/regole.js'

const [cartella, ...scelte] = process.argv.slice(2)
if (!cartella) { console.error('uso: node strumenti/filmati-truppe.mjs <cartella> [truppa…]'); process.exit(1) }
mkdirSync(cartella, { recursive: true })

const FPS = 60, K = 6
const S = 390 / 276                                   // `s` di campo.js su un telefono largo 390 (LARGO_MINIMO 276)
const M = S / 0.85 * 0.5 * 1.2                        // `m(1)` di campo.js: ZOOM 0.5, le truppe ×1,2
const scala = id => SCALA[id] / RISOLUZIONE * M       // da pixel dell'atlante a punti, come `figura()` di campo.js
const CAMMINA = 3, FERMA = 0.6, DURATA = 6.5
const MARGINE = 35                                    // in punti

// la strada che fa, e un po' di margine ai lati per chi è largo o sputa fuoco; pari, per ffmpeg
const largo = id => 2 * Math.round((CAMMINA * TRUPPE[id].vel * M + 2 * MARGINE) / 2)
// una corsia è alta quanto la posa più alta, più il volo, più un po' di terreno sotto i piedi
const corsia = id => Math.ceil(Math.max(...[0, 1, 2, 3].map(n => DIPINTE[`io:${id}:${n}`][3])) * scala(id)
  + (TRUPPE[id].vola ? 16 * M : 0) + 18)

/* dove sta e cosa fa una truppa al tempo t: come `truppa()` di campo.js, ma su una corsia sola */
function stato(id, lato, t) {
  const k = TRUPPE[id], verso = lato === 'io' ? 1 : -1, LARGO = largo(id)
  const strada = Math.min(t, CAMMINA) * k.vel * M
  const x = LARGO / 2 - verso * (CAMMINA * k.vel * M) / 2 + verso * strada
  const cammina = t < CAMMINA
  const dopo = t - CAMMINA - FERMA                     // da qui colpisce ogni `rate`, e il colpo dura 0.25 come in partita.js
  const colpo = dopo >= 0 ? dopo % k.rate : -1
  const inColpo = colpo >= 0 && colpo < 0.25
  const a = andatura(id, lato, t, { cammina, colpo: inColpo, vola: k.vola, vel: k.vel }, 0)
  const alto = k.vola ? (14 + Math.sin(t * 2.6 + x * 0.05) * 2) * M : 0
  // in campo il colpo spinge verso il nemico, che per chi gioca sta in su: qui la corsia è di lato, e lo scatto va in avanti
  const scatto = inColpo ? Math.sin((0.25 - colpo) / 0.25 * Math.PI) * 4 * M : 0
  const [sx, sy, w, h, centro] = DIPINTE[a.fg]
  return { x: x + verso * scatto, salto: a.salto * M + alto, vola: k.vola, sx, sy, w, h, centro, sc: scala(id), specchia: lato === 'nem' }
}

const browser = await apriBrowser({ file: RADICE })
const page = await browser.newPage()
await page.setContent('<canvas></canvas>')
await page.evaluate(async ({ atlante, K }) => {
  const im = new Image(); im.src = atlante; await im.decode()
  const cv = document.querySelector('canvas')
  window.disegna = (corsie, W, C) => {
    if (cv.width !== W * K) cv.width = W * K
    if (cv.height !== 2 * C * K) cv.height = 2 * C * K
    const H = 2 * C
    const c = cv.getContext('2d')
    c.setTransform(K, 0, 0, K, 0, 0)
    c.fillStyle = '#5d7d3c'; c.fillRect(0, 0, W, H)
    // i ciuffi fermi: un piede che scivola si vede contro di loro
    c.fillStyle = '#4c6a30'
    for (let x = 7; x < W; x += 23) for (let r = 0; r < corsie.length; r++) {
      const y = r * C + C - 10 + ((x * 7) % 7)
      c.fillRect(x, y, 3, 2); c.fillRect(x + 1, y - 2, 1, 2)
    }
    for (const [r, f] of corsie.entries()) {
      const y = r * C + C - 8
      c.fillStyle = r ? '#ff5a4d' : '#3d8bff'; c.globalAlpha = f.vola ? 0.45 : 0.75
      c.beginPath(); c.ellipse(f.x, y, 7 * f.m * (f.vola ? 0.7 : 1), 2.6 * f.m, 0, 0, 7); c.fill(); c.globalAlpha = 1
      c.save(); c.translate(f.x, y - f.salto); if (f.specchia) c.scale(-1, 1)
      c.drawImage(im, f.sx, f.sy, f.w, f.h, -f.centro * f.sc, -f.h * f.sc, f.w * f.sc, f.h * f.sc)
      c.restore()
    }
    return cv.toDataURL('image/png').split(',')[1]
  }
}, { atlante: ATLANTE, K })

for (const id of scelte.length ? scelte : Object.keys(SCALA)) {
  const file = resolve(cartella, `${id}.mp4`)
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', file], { stdio: ['pipe', 'inherit', 'inherit'] })
  const fatto = new Promise((ok, ko) => ff.on('close', c => c ? ko(new Error(`ffmpeg: ${c}`)) : ok()))
  for (let n = 0; n < DURATA * FPS; n++) {
    const t = n / FPS
    const corsie = ['io', 'nem'].map(lato => ({ ...stato(id, lato, t), m: M }))
    const png = await page.evaluate(([c, w, h]) => window.disegna(c, w, h), [corsie, largo(id), corsia(id)])
    if (!ff.stdin.write(Buffer.from(png, 'base64'))) await new Promise(ok => ff.stdin.once('drain', ok))
  }
  ff.stdin.end()
  await fatto
  console.log(`  ${file}`)
}
await browser.close()
