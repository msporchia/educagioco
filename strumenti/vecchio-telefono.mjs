// Un vecchio telefono (il Redmi Note 7 della bambina: il metro di paragone) imitato sul computer, per misurare i giochi 3D
// dove scattano e provare come degradarli. Quattro leve: lo schermo e il pixel ratio del telefono (393×851 a 2,75), la CPU
// rallentata (`Emulation.setCPUThrottlingRate`), una zavorra sulla GPU (un'altra pagina che disegna a vuoto: la GPU del
// computer è un'altra cosa, così la si fa più lenta) o in alternativa SwiftShader (`--gpu sw`, la CPU fa la GPU).
// Le leve si tarano sul telefono vero con una misura sola (strumenti/vecchio-telefono/benchmark.html), vedi docs/core/comandi.md:
//
//   node strumenti/vecchio-telefono.mjs calibra --telefono js=620,gpu=48     # i due numeri letti sul telefono
//   node strumenti/vecchio-telefono.mjs calibra                              # senza numeri: la misura del computer
//   node strumenti/vecchio-telefono.mjs 'sotterraneo3d=1&dpr=2' --dist      # fotogrammi, con la taratura salvata
//   node strumenti/vecchio-telefono.mjs 'mate3d=3&volo' --tocca 200,500 --secondi 20
//   node strumenti/vecchio-telefono.mjs 'sotterraneo3d' --cpu 1,3,6 --zavorra 0,4   # una riga per ogni combinazione
//
// Senza taratura le leve partono da una stima (CPU ×6, zavorra 4) e lo strumento lo dice. `--esegui '<espressione>'` la fa
// nella pagina dopo l'apertura (per scatenare le esplosioni), `--tocca x,y` tocca lì ogni due secondi, `--dist file` apre un
// altro file costruito. Il pixel ratio dei giochi si adatta da sé: per vedere il costo vero a una risoluzione, il cheat `&dpr=N`.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const QUI = dirname(fileURLToPath(import.meta.url))
const PROFILO = resolve(QUI, 'vecchio-telefono/profilo.json')
const BANCO = 'file://' + resolve(QUI, 'vecchio-telefono/benchmark.html#auto')
const SCHERMO = { width: 393, height: 851 }, PIXEL = 2.75   // il Redmi Note 7: 1080×2340
const UA = 'Mozilla/5.0 (Linux; Android 10; Redmi Note 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const STIMA = { cpu: 6, zavorra: 4 }
const SCALINI = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256]

const argv = process.argv.slice(2)
const opz = (n, d = null) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d }
const lista = (n, d) => String(opz(n, d)).split(',').map(Number)
const primo = argv[0]
if (!primo || primo.startsWith('--')) { console.error("uso: node strumenti/vecchio-telefono.mjs calibra [--telefono js=…,gpu=…] | '<cheat>' [--dist file] [--cpu 6] [--zavorra 4] [--gpu hw|sw] [--secondi 15] [--tocca x,y] [--esegui expr]"); process.exit(1) }
const gpuModo = opz('gpu', 'hw')
const ARGOMENTI = gpuModo === 'sw' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  : ['--use-gl=angle', '--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist']
const leggiProfilo = () => existsSync(PROFILO) ? JSON.parse(readFileSync(PROFILO, 'utf8')) : {}

async function apri() {
  const exe = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync)
  return chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ARGOMENTI })
}
async function renderer(b) {
  const p = await b.newPage()
  const r = await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'nessun WebGL' })
  await p.close(); return r
}
// la zavorra: una pagina a parte che riempie la GPU di lavoro inutile (K schermi pieni con uno shader pesante a ogni fotogramma)
async function zavorra(b, K) {
  if (!K) return null
  const p = await b.newPage({ viewport: SCHERMO, deviceScaleFactor: PIXEL })
  await p.setContent('<canvas id=c></canvas>')
  await p.evaluate(K => {
    const c = document.getElementById('c'); c.width = 1080; c.height = 2340
    const gl = c.getContext('webgl2', { alpha: false, antialias: false })
    const prog = gl.createProgram()
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); gl.attachShader(prog, x) }
    sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }')
    sh(gl.FRAGMENT_SHADER, `#version 300 es
precision mediump float; uniform float t; out vec4 o;
void main(){ vec2 u = gl_FragCoord.xy * 0.003; float v = 0.;
  for (int i = 0; i < 160; i++) { u = vec2(sin(u.y * 1.7 + t), cos(u.x * 1.3 - t)) * 1.1 + u * 0.5; v += sin(u.x * u.y); }
  o = vec4(fract(v), fract(v * 2.), fract(v * 3.), 1.); }`)
    gl.linkProgram(prog); gl.useProgram(prog)
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const l = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0)
    const ut = gl.getUniformLocation(prog, 't'), px = new Uint8Array(4)
    gl.viewport(0, 0, 1080, 2340)
    ;(function f(t) { for (let i = 0; i < K; i++) { gl.uniform1f(ut, t * 0.001 + i); gl.drawArrays(gl.TRIANGLES, 0, 3) } gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); requestAnimationFrame(f) })(0)
  }, K)
  return p
}
async function telefono(b, { cpu, K }) {
  const p = await b.newPage({ viewport: SCHERMO, deviceScaleFactor: PIXEL, hasTouch: true, isMobile: true, userAgent: UA })
  const s = await p.context().newCDPSession(p)
  if (cpu > 1) await s.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  return { p, hog: await zavorra(b, K) }
}
const mediana = v => v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)]

async function bancoUna(b, cpu, K) {
  const { p, hog } = await telefono(b, { cpu, K })
  await p.goto(BANCO)
  await p.waitForFunction(() => window.__misura, null, { timeout: 120000 })
  const r = await p.evaluate(() => window.__misura)
  await p.close(); await hog?.close()
  return r
}
async function calibra() {
  const b = await apri()
  console.log(`GPU del computer: ${await renderer(b)}  (--gpu ${gpuModo})`)
  const fatti = await bancoUna(b, 1, 0)
  console.log(`il computer, a vuoto: js ${fatti.js} ms, gpu ${fatti.gpu} ms (${fatti.pixel} pixel)`)
  const t = opz('telefono')
  if (!t) { await b.close(); console.log('senza i numeri del telefono non c\'è taratura: apri strumenti/vecchio-telefono/benchmark.html sul telefono e rilancia con --telefono js=…,gpu=…'); return }
  const tel = Object.fromEntries(t.split(',').map(x => x.split('=')).map(([k, v]) => [k, Number(v)]))
  // il rallentamento non è lineare e la misura balla: si prova, si corregge, e si tiene il tentativo che ci è andato più vicino
  let cpu = Math.min(30, Math.max(1, tel.js / fatti.js)), migliore = { cpu, errore: Infinity }
  for (let giro = 0; giro < 5; giro++) {
    const r = await bancoUna(b, cpu, 0)
    const errore = Math.abs(r.js - tel.js) / tel.js
    console.log(`CPU ×${cpu.toFixed(2)} → js ${r.js} ms (telefono ${tel.js})`)
    if (errore < migliore.errore) migliore = { cpu, errore }
    if (errore < 0.08) break
    cpu = Math.min(30, Math.max(1, cpu * (1 + 0.7 * (tel.js / r.js - 1))))   // a metà strada: smorza l'oscillare
  }
  cpu = migliore.cpu
  let K = 0, meglio = Infinity
  for (const k of SCALINI) {
    const r = await bancoUna(b, 1, k)
    console.log(`zavorra ${k} → gpu ${r.gpu} ms (telefono ${tel.gpu})`)
    if (Math.abs(r.gpu - tel.gpu) < meglio) { meglio = Math.abs(r.gpu - tel.gpu); K = k }
    if (r.gpu >= tel.gpu) break
  }
  if (K === 0 && fatti.gpu > tel.gpu) console.log('attenzione: la GPU del computer è già più lenta del telefono (--gpu sw ha senso solo se la zavorra non basta)')
  await b.close()
  const p = leggiProfilo(); p[gpuModo] = { cpu: +cpu.toFixed(2), zavorra: K, telefono: tel }
  writeFileSync(PROFILO, JSON.stringify(p, null, 2) + '\n')
  console.log(`\ntarato (${gpuModo}): CPU ×${cpu.toFixed(2)}, zavorra ${K} — salvato in strumenti/vecchio-telefono/profilo.json`)
}

async function misura() {
  const dist = resolve(opz('dist', 'dist/index.html'))
  if (!existsSync(dist)) { console.error(`manca ${dist}: prima npm run build`); process.exit(1) }
  const salvato = leggiProfilo()[gpuModo]
  const cpus = lista('cpu', salvato ? salvato.cpu : STIMA.cpu), zavs = lista('zavorra', salvato ? salvato.zavorra : STIMA.zavorra)
  if (!salvato && !opz('cpu') && !opz('zavorra')) console.log(`NON TARATO: CPU ×${STIMA.cpu} e zavorra ${STIMA.zavorra} sono stime (calibra --telefono js=…,gpu=…)`)
  const tocca = opz('tocca') ? opz('tocca').split(',').map(Number) : null, secondi = Number(opz('secondi', 15))
  const esegui = opz('esegui')
  process.env.DIST = dist
  const { apriGioco } = await import('../test/aiuto/browser.mjs')
  const b = await apri()
  console.log(`telefono ${SCHERMO.width}×${SCHERMO.height} a ${PIXEL}, GPU: ${await renderer(b)} (--gpu ${gpuModo}), ${secondi} s per riga`)
  console.log('  CPU  zavorra   fps   p50   p95   p99  >33ms  >50ms  note')
  for (const cpu of cpus) for (const K of zavs) {
    const hog = await zavorra(b, K)
    const { page } = await apriGioco(b, { viewport: SCHERMO, pixel: PIXEL, hash: primo, attesa: null, indirizzo: 'file://' + dist, userAgent: UA })
    const adatta = []
    page.on('console', m => /pixel ratio/.test(m.text()) && adatta.push(m.text().replace(/^\[spazio3d\] /, '')))
    await page.addInitScript(() => { window.__dt = []; let u = 0; (function f(t) { if (u) window.__dt.push(t - u); u = t; requestAnimationFrame(f) })(0) })
    await page.reload()
    await page.waitForTimeout(3500)
    const s = await page.context().newCDPSession(page)
    if (cpu > 1) await s.send('Emulation.setCPUThrottlingRate', { rate: cpu })
    if (esegui) await page.evaluate(esegui)
    await page.evaluate(() => { window.__dt.length = 0 })
    for (let t = 0; t < secondi; t += 2) {
      if (tocca) await page.mouse.click(tocca[0] + (t % 4 ? 80 : -80), tocca[1] + (t % 6) * 30)
      await page.waitForTimeout(2000)
    }
    const dt = await page.evaluate(() => window.__dt)
    const g = await page.evaluate(() => { try { return (window.__sotterraneo3d?.grafica || window.__mate?.grafica)?.() } catch (e) { return null } })
    const p = q => dt.slice().sort((a, c) => a - c)[Math.min(dt.length - 1, Math.floor(q * dt.length))] || 0
    const somma = dt.reduce((a, c) => a + c, 0)
    const lenti = x => dt.filter(d => d > x).length
    const nota = [g && g.dpr ? `dpr ${g.dpr}` : '', g && g.chiamate ? `${g.chiamate} chiamate` : '', g && g.triangoli ? `${g.triangoli} tri` : '',
      adatta.length ? `si adatta: ${adatta[adatta.length - 1]}` : ''].filter(Boolean).join(', ')
    console.log(`  ×${String(cpu).padEnd(4)} ${String(K).padEnd(7)} ${(1000 * dt.length / (somma || 1)).toFixed(0).padStart(4)} ${p(.5).toFixed(0).padStart(5)} ${p(.95).toFixed(0).padStart(5)} ${p(.99).toFixed(0).padStart(5)} ${String(lenti(33)).padStart(6)} ${String(lenti(50)).padStart(6)}  ${nota}`)
    await page.close(); await hog?.close()
  }
  await b.close()
  console.log('p50/p95/p99 sono ms fra due fotogrammi (16 = 60 fps, 33 = 30 fps); liscio se p95 sta sotto i 20, a scatti sopra i 33')
}

if (primo === 'calibra') await calibra(); else await misura()
