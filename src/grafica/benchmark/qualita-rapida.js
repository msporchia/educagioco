// La misura di un secondo (docs/core/vecchio-telefono.md, «La fascia»): quattro delle prove del benchmark (le stesse shader,
// scritte in WebGL nudo perché three non si carichi in home) su una tela fuori pagina, e un pezzo di JS. Un telefono non cambia da
// una volta all'altra: il risultato si tiene (store/qualita.js). Le soglie vengono dai tre log veri: Redmi Note 7 = 52 punti,
// iPhone 12 Pro Max = 23, Pixel 9a = 19 (somma dei ms di lavoro delle quattro prove).
import { salvaMisura, serveMisura, VERSIONE_MISURA } from '../../store/qualita.js'

export const SOGLIE = { media: 28, bassa: 40, jsLento: 100 }   // punti da qui in su: media, bassa; un JS lento (Redmi ≈117) scende di una fascia

const VERT = `#version 300 es
in vec2 p; in float dim; uniform float uPx; uniform float uPunti; out vec2 vU;
void main(){ vU = p * .5 + .5; gl_PointSize = dim * uPx; gl_Position = vec4(p, 0., 1.); }`
const fragPieno = n => `#version 300 es
precision mediump float; in vec2 vU; uniform float uT; uniform float uA; out vec4 o;
void main(){ vec2 u = vU * 3.; float v = 0.;
  for (int i = 0; i < ${n}; i++) { u = vec2(sin(u.y * 1.7 + uT), cos(u.x * 1.3 - uT)) * 1.1 + u * 0.5; v += sin(u.x * u.y); }
  o = vec4(fract(v), fract(v * 2.), fract(v * 3.), uA); }`
const fragPunti = `#version 300 es
precision mediump float; out vec4 o;
void main(){ float d = length(gl_PointCoord - .5) * 2.; if (d > 1.) discard; o = vec4(1., .55 + .3 * d, .2, pow(1. - d, 1.6) * .35); }`

const mediana = v => v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)] || 0
const pausa = () => new Promise(r => setTimeout(r, 0))

function programma(gl, frag) {
  const pr = gl.createProgram()
  for (const [t, s] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, frag]]) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); gl.attachShader(pr, x) }
  gl.bindAttribLocation(pr, 0, 'p'); gl.bindAttribLocation(pr, 1, 'dim'); gl.linkProgram(pr)
  return pr
}

// una prova: `giro(t)` disegna un fotogramma; ritorna la mediana dei ms di disegno + attesa della GPU (lettura di un pixel)
async function prova(gl, canvas, dpr, giro, scalda = 80, misura = 120) {
  canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr); gl.viewport(0, 0, canvas.width, canvas.height)
  const px = new Uint8Array(4), ms = [], t0 = performance.now()
  for (let t = 0; ; t = performance.now() - t0) {
    if (document.hidden) throw new Error('scheda nascosta')   // un telefono posato o un'altra app: la misura non vale
    if (t > scalda + misura) break
    const a = performance.now()
    giro(t / 1000); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
    if (t > scalda) ms.push(performance.now() - a)
    if (performance.now() - a > 400) throw new Error('fotogramma troppo lungo')   // il telefono sta facendo altro: non è lui
    await pausa()
  }
  return mediana(ms)
}

function jsRapido() {   // un quarto della prova del benchmark: calcolo, oggetti da allocare e ordinare
  const t = performance.now(); let s = 0
  for (let i = 0; i < 1e6; i++) s += Math.sin(i * 0.001) * Math.sqrt(i + 1)
  const a = []; for (let i = 0; i < 37500; i++) a.push({ x: Math.cos(i) * 1000, y: i })
  a.sort((p, q) => p.x - q.x)
  return Math.round(performance.now() - t + (s === 1 ? 1 : 0))
}

export const fasciaDa = (punti, js) => {
  let f = punti >= SOGLIE.bassa ? 2 : punti >= SOGLIE.media ? 1 : 0
  if (js >= SOGLIE.jsLento) f = Math.min(2, f + 1)
  return ['alta', 'media', 'bassa'][f]
}

// null se non c'è WebGL 2; altrimenti { fascia, punti, dettaglio, js, quando, gpu, dpr, v }
export async function misuraRapida() {
  const canvas = document.createElement('canvas')
  let gl = null
  try { gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'high-performance' }) } catch (e) { gl = null }
  if (!gl) return null
  const buf = gl.createBuffer(), dimBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const uni = (pr, n) => gl.getUniformLocation(pr, n)
  const pieno = n => { const pr = programma(gl, fragPieno(n)); return { pr, t: uni(pr, 'uT'), a: uni(pr, 'uA') } }
  const leggero = pieno(4), pesante = pieno(40), strato = pieno(2), punti = programma(gl, fragPunti)
  const quadro = (P, alfa) => (t) => { gl.useProgram(P.pr); gl.uniform1f(P.t, t); gl.uniform1f(P.a, alfa); gl.drawArrays(gl.TRIANGLES, 0, 3) }
  const d = {}
  gl.disable(gl.BLEND)
  gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.DYNAMIC_DRAW); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.disableVertexAttribArray(1)
  d.pieno = await prova(gl, canvas, 1.5, quadro(leggero, 1))
  d.pesante = await prova(gl, canvas, 1, quadro(pesante, 1))
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  const otto = quadro(strato, 0.15)
  d.strati = await prova(gl, canvas, 1, t => { for (let i = 0; i < 8; i++) otto(t + i) })
  // le scintille: 500 punti additivi da 80 px, riscritti a ogni fotogramma (come un'esplosione)
  const N = 500, pos = new Float32Array(N * 2), dim = new Float32Array(N).fill(80)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
  gl.bindBuffer(gl.ARRAY_BUFFER, dimBuf); gl.bufferData(gl.ARRAY_BUFFER, dim, gl.STATIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0)
  const ptsBuf = gl.createBuffer()
  d.scintille = await prova(gl, canvas, 1.5, t => {
    for (let i = 0; i < N; i++) { pos[i * 2] = Math.cos(i * 2.4 + t * 2) * (i % 9) / 11; pos[i * 2 + 1] = Math.sin(i * 1.7 + t * 2) * (i % 11) / 14 }
    gl.useProgram(punti); gl.uniform1f(uni(punti, 'uPx'), 1.5)
    gl.bindBuffer(gl.ARRAY_BUFFER, ptsBuf); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, dimBuf); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.POINTS, 0, N)
  })
  const e = gl.getExtension('WEBGL_debug_renderer_info')
  const gpu = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'
  try { gl.getExtension('WEBGL_lose_context')?.loseContext() } catch (x) { /* pazienza */ }
  const punteggio = Math.round((d.pieno + d.pesante + d.strati + d.scintille) * 10) / 10
  const js = jsRapido()
  return { fascia: fasciaDa(punteggio, js), punti: punteggio, dettaglio: Object.fromEntries(Object.entries(d).map(([k, v]) => [k, +v.toFixed(1)])),
    js, quando: Date.now(), gpu, dpr: window.devicePixelRatio || 1, v: VERSIONE_MISURA }
}

let incorso = null
// la misura, se serve (o se `forza`): la salva e dice la fascia. Mai due insieme, mai col telefono posato.
export function assicuraFascia({ forza = false } = {}) {
  if (incorso) return incorso
  if (!forza && (!serveMisura() || (navigator.webdriver && !window.__qualitaMisura))) return Promise.resolve(null)   // i test non ne vogliono
  incorso = (async () => {
    try { const m = await misuraRapida(); if (m) await salvaMisura(m); return m } catch (e) { return null } finally { incorso = null }
  })()
  return incorso
}
