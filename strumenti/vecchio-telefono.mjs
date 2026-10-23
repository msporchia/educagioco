// Un vecchio telefono (il Redmi Note 7 della bambina: il metro di paragone) imitato sul computer, per misurare i giochi 3D
// dove scattano e provare come degradarli. Quattro leve: lo schermo e il pixel ratio del telefono (393×851 a 2,75), la CPU
// rallentata (`Emulation.setCPUThrottlingRate`), una zavorra sulla GPU (un'altra pagina che disegna a vuoto: la GPU del
// computer è un'altra cosa, così la si fa più lenta) o in alternativa SwiftShader (`--gpu sw`, la CPU fa la GPU).
// Le leve si tarano sul log della misura fatta sul telefono vero (zona dei grandi → «Misura questo telefono», poi «Copia»),
// vedi docs/core/vecchio-telefono.md:
//
//   node strumenti/vecchio-telefono.mjs calibra --log telefono.txt      # il log copiato dal telefono (la riga DATI basta); `--prova` non salva
//   node strumenti/vecchio-telefono.mjs benchmark                       # la stessa misura sul computer, con la taratura salvata
//   node strumenti/vecchio-telefono.mjs benchmark --contro telefono.txt # e il confronto riga per riga col telefono
//   node strumenti/vecchio-telefono.mjs benchmark --veri [--contro veri.txt] [--solo sot-,tri-]   # la misura coi modelli veri
//   node strumenti/vecchio-telefono.mjs benchmark --veri --solo elementi   # chi pesa, un elemento alla volta (`--solo elementi-sot` una scena sola)
//     (docs/core/vecchio-telefono-veri.md); con `--contro` un log coi modelli veri la sceglie da sé (e la sua fascia); `--qualita bassa`
//     forza la fascia grafica; `--foto f.png` la schermata del resoconto
//   node strumenti/vecchio-telefono.mjs 'sotterraneo3d=1&dpr=2' --dist  # fotogrammi di un gioco, con la taratura salvata
//   node strumenti/vecchio-telefono.mjs 'mate3d=3&volo' --tocca 200,500 --secondi 20
//   node strumenti/vecchio-telefono.mjs 'sotterraneo3d' --cpu 1,3,6 --zavorra 0,4   # una riga per ogni combinazione
//
// Senza taratura le leve partono da una stima (CPU ×3, zavorra 0) e lo strumento lo dice. `--esegui '<espressione>'` la fa
// nella pagina dopo l'apertura (per scatenare le esplosioni), `--tocca x,y` tocca lì ogni due secondi, `--dist file` apre un
// altro file costruito; l'espressione può definire `window.__extra = () => …` e il risultato si stampa sotto la riga.
// `--ritmo '<istruzioni>' --ogni 2500` le rifà nella pagina ogni tanti ms (un attacco dello scontro dopo l'altro), `--fasi
// '<espressione>'` dà un nome a ogni fotogramma (una riga per nome: 'racconto' / 'fermo'); `--spegni ombre,nebbia` fa una riga per
// ogni pezzo spento in più (`&spegni=` del Sotterraneo 3D, `-` è nessuno). `--scontro` è il Sotterraneo 3D in uno scontro: un attacco
// giusto ogni `--ogni` ms (3000), le righe «fermo» e «racconto», e sotto ognuna il banco della tela da ferma (`banco()`, ms senza i
// 60 Hz). Lo scontro: docs/core/vecchio-telefono.md, «Lo scontro». `--profilo 15` stampa le 15 funzioni che tengono di più il filo
// principale (il profilatore di Chrome, tempo proprio) e le voci senza JS («(program)»: stili, impaginazione, disegno della pagina);
// `--traccia 15` le 15 voci della traccia di Chrome (devtools.timeline) che durano di più sul filo principale, in ms a fotogramma
// (le voci si annidano: «RunTask» contiene le altre), e quelle del filo che compone e disegna la pagina. Il pixel ratio dei giochi si adatta da sé: per vedere il costo vero a una risoluzione, il cheat `&dpr=N`.
// `--per 'folla=0,8,16'` fa una riga per ogni valore aggiunto all'indirizzo (`&folla=0`, `&folla=8`…: quanti personaggi, quanti edifici);
// `--banco 20` stampa sotto ogni riga il banco della tela (`banco(20)`: ms senza i 60 Hz) con chiamate, triangoli e JS della scena, per
// il Sotterraneo 3D (discese e mondo di sopra) e la Fattoria 3D. I limiti misurati così: docs/sotterraneo/limiti-3d.md, docs/fattoria3d/limiti.md.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { spawnSync } from 'node:child_process'

const QUI = dirname(fileURLToPath(import.meta.url))
const PROFILO = resolve(QUI, 'vecchio-telefono/profilo.json')
const SCHERMO = { width: 392, height: 774 }, PIXEL = 2.75   // il Redmi Note 7 visto da Chrome (la misura del 19/10: 392×774)
const UA = 'Mozilla/5.0 (Linux; Android 10; Redmi Note 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const STIMA = { cpu: 3, zavorra: 0 }
const SCALINI = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256]

const argv = process.argv.slice(2)
const opz = (n, d = null) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d }
const lista = (n, d) => String(opz(n, d)).split(',').map(Number)
const primo = argv[0]
if (!primo || primo.startsWith('--')) { console.error("uso: node strumenti/vecchio-telefono.mjs calibra --log file | benchmark [--contro file] | '<cheat>' [--dist file] [--cpu 6] [--zavorra 4] [--gpu sw|hw] [--secondi 15] [--tocca x,y] [--esegui expr]"); process.exit(1) }
const gpuModo = opz('gpu', 'sw')   // SwiftShader su pochi core (--core 4) somiglia al Note 7 sui pixel; 'hw' è la GPU vera, troppo forte (serve la zavorra)
const ARGOMENTI = gpuModo === 'sw' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  : ['--use-gl=angle', '--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist']
const leggiProfilo = () => existsSync(PROFILO) ? JSON.parse(readFileSync(PROFILO, 'utf8')) : {}

// `--core N`: lo strumento (e quindi Chrome e il suo SwiftShader) gira su N core soltanto, con `taskset`: è la leva sulla GPU senza
// toccare il sistema. Di difetto il valore tarato (profilo.json); `--core 0` li lascia tutti. Chi lancia con `taskset` da sé va bene lo stesso.
{
  const voluti = Number(opz('core', (leggiProfilo()[gpuModo] || {}).core || 0))
  if (voluti > 0 && !process.env.VT_CORE) {
    const r = spawnSync('taskset', ['-c', `0-${voluti - 1}`, process.execPath, ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, VT_CORE: String(voluti) } })
    if (r.error) console.error('taskset non c\'è: si va avanti su tutti i core (la GPU emulata sarà più veloce del vero)')
    else process.exit(r.status ?? 1)
  }
}

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
// lo scontro del Sotterraneo 3D: si sceglie l'attacco e, quando c'è la domanda, si tocca la risposta giusta; il racconto è in corso
// finché c'è `[data-racconto]` (viste/Scontro3d.vue). L'eroe non sviene (la vita torna piena): si misura il disegno, non lo scontro
const ATTACCO = `const c = window.__sotterraneo3d && window.__sotterraneo3d.corsa; if (c && c.vitaMax) c.vita = c.vitaMax
  const a = document.querySelector('[data-caselle-abilita] [data-azione="attacco"]'); if (a) a.click()
  setTimeout(() => { const g = document.querySelector('.sot-domanda .qz-tasto[data-giusta]'); if (g) g.click() }, 700)`
const FASI_SCONTRO = `document.querySelector('[data-racconto]') ? 'racconto' : (window.__sotterraneo3d && window.__sotterraneo3d.palco ? 'fermo' : 'fuori')`
const mediana = v => v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)]

// la misura dell'app (zona dei grandi → «Misura questo telefono»): `solo` = gli id da fare, `js` compreso; ritorna { dati, log }
// `veri`: la prova coi modelli veri (gli inizi degli id in `solo`), che dura qualche minuto e sul computer rallentato di più
// `qualita`: la fascia grafica forzata col cheat `&qualita=` (quella del telefono, se il log la dice)
// `raffredda`: i ms di pausa fra un gruppo e l'altro della prova coi modelli veri (null: quella dell'app)
async function bancoUna(b, cpu, K, solo = null, corto = false, veri = false, qualita = null, raffredda = null) {
  process.env.DIST = resolve(opz('dist', 'dist/index.html'))
  const { apriGioco } = await import('../test/aiuto/browser.mjs')
  const hog = await zavorra(b, K)
  const { page } = await apriGioco(b, { viewport: SCHERMO, pixel: PIXEL, attesa: null, indirizzo: 'file://' + process.env.DIST, userAgent: UA, ...(qualita ? { hash: `qualita=${qualita}` } : {}) })
  await page.addInitScript(([so, co, ra]) => { window.__benchmarkSolo = so; window.__benchmarkCorto = co; if (ra != null) window.__benchmarkRaffredda = ra }, [solo, corto, raffredda])
  await page.reload(); await page.waitForSelector('[data-azione="grandi"]', { timeout: 20000 })
  await page.click('[data-azione="grandi"]'); await page.waitForSelector('.tastierino')
  for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
  // la misura sta in Impostazioni, nella tendina «Avanzate» (nasce chiusa)
  await page.click('[data-scheda="impostazioni"]')
  await page.evaluate(() => document.querySelectorAll('details.tendina').forEach(d => { d.open = true }))
  await page.waitForSelector('[data-azione="benchmark"]')
  const s = await page.context().newCDPSession(page)
  if (cpu > 1) await s.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  await page.click('[data-azione="benchmark"]'); await page.click(veri ? '[data-azione="benchmark-veri"]' : '[data-azione="benchmark-avvia"]')
  await page.waitForSelector('[data-benchmark-log]', { timeout: veri ? 3600000 : 600000, state: 'attached' })
  const dati = await page.evaluate(v => (v ? window.__benchmarkVeri : window.__benchmarkFluidita), veri), log = await page.inputValue('[data-benchmark-log]')
  if (opz('foto')) { await page.screenshot({ path: resolve(opz('foto')) }); console.log(`la schermata del resoconto: ${opz('foto')}`) }   // `--foto file.png`
  await page.close(); await hog?.close()
  return { dati, log }
}
const dellaRiga = (dati, id) => (dati.risultati || dati.r || []).find(r => (r.id || r[0]) === id)
const msDi = (dati, id) => { const r = dellaRiga(dati, id); return r ? (r.ms ?? r[1]) : null }
// la riga DATI di un log copiato dal telefono
function leggiLog(file) {
  const m = /DATI (\{.*\})/.exec(readFileSync(resolve(file), 'utf8'))
  if (!m) { console.error(`${file}: non trovo la riga DATI`); process.exit(1) }
  return JSON.parse(m[1])
}
async function calibra() {
  const b = await apri()
  console.log(`GPU del computer: ${await renderer(b)}  (--gpu ${gpuModo})`)
  const lg = opz('log') ? leggiLog(opz('log')) : null
  const t = opz('telefono')
  const tel = lg ? { js: lg.js, gpu: msDi(lg, 'pieno-1.5') }
    : t ? Object.fromEntries(t.split(',').map(x => x.split('=')).map(([k, v]) => [k, Number(v)])) : null
  // un log coi modelli veri non ha la prova dei pixel: la CPU si tara sul suo `js`, la zavorra su una sua scena (`--scena`, di
  // difetto «pixel ratio 1», lo scontro con 3 mostri: una scena vera, con le luci e la nebbia del gioco)
  const veri = !!(lg && lg.k === 'veri'), scena = opz('scena', 'px-1')
  if (veri) { tel.gpu = msDi(lg, scena); console.log(`log coi modelli veri: la CPU sulla prova JS, la zavorra sulla scena ${scena} (${tel.gpu ?? '?'} ms sul telefono)`) }
  const soloCpu = veri && typeof tel.gpu !== 'number'
  if (!tel || !tel.js || (!tel.gpu && !soloCpu)) { await b.close(); console.error('serve --log <file> (il log copiato dal telefono) oppure --telefono js=…,gpu=… (gpu = ms della prova «pixel, shader leggero, dpr 1,5»)'); process.exit(1) }
  const { dati: fatti } = await bancoUna(b, 1, 0, ['js', 'pieno-1.5'])
  console.log(`il computer, a vuoto: js ${fatti.js} ms, pixel (dpr 1,5) ${msDi(fatti, 'pieno-1.5')} ms — telefono: js ${tel.js} ms, pixel ${tel.gpu ?? '?'} ms`)
  // il rallentamento non è lineare e la misura balla: si prova, si corregge, e si tiene il tentativo che ci è andato più vicino
  let cpu = Math.min(30, Math.max(1, tel.js / fatti.js)), migliore = { cpu, errore: Infinity }
  for (let giro = 0; giro < 5; giro++) {
    const { dati } = await bancoUna(b, cpu, 0, ['js'])
    const errore = Math.abs(dati.js - tel.js) / tel.js
    console.log(`CPU ×${cpu.toFixed(2)} → js ${dati.js} ms (telefono ${tel.js})`)
    if (errore < migliore.errore) migliore = { cpu, errore }
    if (errore < 0.08) break
    cpu = Math.min(30, Math.max(1, cpu * (1 + 0.7 * (tel.js / dati.js - 1))))   // a metà strada: smorza l'oscillare
  }
  cpu = migliore.cpu
  let K = soloCpu ? ((leggiProfilo()[gpuModo] || {}).zavorra || 0) : 0, meglio = Infinity
  for (const k of soloCpu ? [] : SCALINI) {
    // coi modelli veri la scena gira con la CPU appena tarata (lo scontro ha il suo JS), senza la pausa che raffredda
    const { dati } = veri ? await bancoUna(b, cpu, k, [scena], false, true, lg.f, 0) : await bancoUna(b, 1, k, ['pieno-1.5'])
    const ms = msDi(dati, veri ? scena : 'pieno-1.5')
    console.log(`zavorra ${k} → ${veri ? scena : 'pixel nativi'} ${ms} ms (telefono ${tel.gpu})`)
    if (Math.abs(ms - tel.gpu) < meglio) { meglio = Math.abs(ms - tel.gpu); K = k }
    if (ms >= tel.gpu) break
  }
  if (!soloCpu && !veri && K === 0 && msDi(fatti, 'pieno-1.5') > tel.gpu) console.log('attenzione: la GPU del computer è già più lenta del telefono (--gpu sw ha senso solo se la zavorra non basta)')
  await b.close()
  // `--prova`: dice la taratura senza salvarla (profilo.json lo usano anche le altre misure)
  if (argv.includes('--prova')) { console.log(`\ntaratura (${gpuModo}), NON salvata: CPU ×${cpu.toFixed(2)}, zavorra ${K}`); return }
  const p = leggiProfilo(); p[gpuModo] = { cpu: +cpu.toFixed(2), zavorra: K, ...(process.env.VT_CORE ? { core: Number(process.env.VT_CORE) } : {}), telefono: tel }
  writeFileSync(PROFILO, JSON.stringify(p, null, 2) + '\n')
  console.log(`\ntarato (${gpuModo}): CPU ×${cpu.toFixed(2)}, zavorra ${K} — salvato in strumenti/vecchio-telefono/profilo.json`)
  console.log('controllo: `benchmark --contro <log>` mette a confronto tutte le prove; dove non tornano la taratura è solo approssimata')
}

// la misura dell'app sul computer rallentato, e (con --contro) riga per riga contro un log del telefono
async function benchmark() {
  const salvato = leggiProfilo()[gpuModo]
  const cpu = Number(opz('cpu', salvato ? salvato.cpu : STIMA.cpu)), K = Number(opz('zavorra', salvato ? salvato.zavorra : STIMA.zavorra))
  if (!salvato && !opz('cpu') && !opz('zavorra')) console.log(`NON TARATO: CPU ×${STIMA.cpu} e zavorra ${STIMA.zavorra} sono stime (calibra --log …)`)
  const tel = opz('contro') ? leggiLog(opz('contro')) : null
  // la prova coi modelli veri: chiesta, o quella del log del telefono (docs/core/vecchio-telefono-veri.md)
  const veri = argv.includes('--veri') || !!(tel && tel.k === 'veri')
  const solo = opz('solo') ? opz('solo').split(',') : null
  const qualita = opz('qualita') || (tel && tel.f) || null   // la fascia del telefono, perché le scene siano le stesse
  const b = await apri()
  console.log(`computer rallentato: CPU ×${cpu}, zavorra ${K}, GPU ${await renderer(b)} (--gpu ${gpuModo}); ${veri ? 'coi modelli veri, qualche minuto (rallentato, anche mezz\'ora)' : 'circa un minuto'}…`)
  if (qualita) console.log(`fascia grafica: ${qualita}`)
  const { dati, log } = await bancoUna(b, cpu, K, solo, false, veri, qualita)
  await b.close()
  console.log('\n' + log)
  if (tel) {
    const p95Di = (d, id) => { const r = dellaRiga(d, id); return r ? (r.p95 ?? (typeof r[2] === 'number' && r.length > 5 ? r[2] : null)) : null }
    console.log(`\nconfronto (ms di lavoro${veri ? ', e p95' : ''}): prova | computer | telefono | rapporto`)
    const perGruppo = {}
    for (const r of dati.risultati) {
      const t = msDi(tel, r.id), c = r.ms ?? r.tot
      if (typeof t !== 'number' || r.errore || r.salta || c == null) continue
      const pc = r.p95, pt = p95Di(tel, r.id)
      console.log(`  ${r.id.padEnd(20)} ${String(c).padStart(6)} ${String(t).padStart(7)}   ×${(c / t).toFixed(2)}` +
        (veri && pc != null && pt ? `    p95 ${String(pc).padStart(6)} ${String(pt).padStart(7)}   ×${(pc / pt).toFixed(2)}` : '') +
        (veri && r.js != null ? `    computer js ${r.js} gpu ${r.gpu}` : ''))
      if (veri) (perGruppo[r.gruppo] = perGruppo[r.gruppo] || []).push(c / t)
    }
    // coi modelli veri: il rapporto medio per gruppo, per vedere quale parte del gioco l'imitazione sbaglia
    for (const [g, l] of Object.entries(perGruppo)) console.log(`  gruppo ${g.padEnd(12)} rapporto medio ×${(l.reduce((x, y) => x + y, 0) / l.length).toFixed(2)} su ${l.length} scene`)
    if (dati.js && tel.js) console.log(`  ${'js'.padEnd(20)} ${String(dati.js).padStart(6)} ${String(tel.js).padStart(7)}   ×${(dati.js / tel.js).toFixed(2)}`)
    console.log('rapporto vicino a 1 = il computer rallentato somiglia al telefono; lontano = quella parte non è imitata bene')
  }
}

async function misura() {
  const dist = resolve(opz('dist', 'dist/index.html'))
  if (!existsSync(dist)) { console.error(`manca ${dist}: prima npm run build`); process.exit(1) }
  const salvato = leggiProfilo()[gpuModo]
  const cpus = lista('cpu', salvato ? salvato.cpu : STIMA.cpu), zavs = lista('zavorra', salvato ? salvato.zavorra : STIMA.zavorra)
  if (!salvato && !opz('cpu') && !opz('zavorra')) console.log(`NON TARATO: CPU ×${STIMA.cpu} e zavorra ${STIMA.zavorra} sono stime (calibra --telefono js=…,gpu=…)`)
  const tocca = opz('tocca') ? opz('tocca').split(',').map(Number) : null, secondi = Number(opz('secondi', 15))
  const scontro = argv.includes('--scontro')
  const esegui = opz('esegui') || (scontro ? 'new Promise(r => setTimeout(r, 5000)).then(() => { window.__extra = () => window.__sotterraneo3d.banco(30) })' : null)
  const ritmo = opz('ritmo') || (scontro ? ATTACCO : null), ogni = Number(opz('ogni', scontro ? 3000 : 2500))
  const fasi = opz('fasi') || (scontro ? FASI_SCONTRO : null)
  const spegni = opz('spegni') ? opz('spegni').split(',') : [null]
  const per = opz('per') ? (([k, v]) => v.split(',').map(x => `${k}=${x}`))(opz('per').split('=')) : [null]
  const banco = Number(opz('banco', 0))
  process.env.DIST = dist
  const { apriGioco } = await import('../test/aiuto/browser.mjs')
  const b = await apri()
  console.log(`telefono ${SCHERMO.width}×${SCHERMO.height} a ${PIXEL}, GPU: ${await renderer(b)} (--gpu ${gpuModo}), ${secondi} s per riga`)
  console.log('  CPU  zavorra   fps   p50   p95   p99  >33ms  >50ms  note')
  for (const cpu of cpus) for (const K of zavs) for (const sp of spegni) for (const pv of per) {
    const hog = await zavorra(b, K)
    const hash = (sp && sp !== '-' ? `${primo}&spegni=${sp.replace(/\+/g, ',')}` : primo) + (pv ? `&${pv}` : '')
    const { page } = await apriGioco(b, { viewport: SCHERMO, pixel: PIXEL, hash, attesa: null, indirizzo: 'file://' + dist, userAgent: UA })
    const adatta = []
    page.on('console', m => /pixel ratio/.test(m.text()) && adatta.push(m.text().replace(/^\[spazio3d\] /, '')))
    await page.addInitScript(fasi => {
      const fase = fasi ? new Function(`try { return String(${fasi}) } catch (e) { return '?' }`) : () => ''
      window.__dt = []; window.__fa = []; window.__ft = []; window.__lunghi = []; let u = 0
      ;(function f(t) { if (u) { window.__dt.push(t - u); window.__fa.push(fase()); window.__ft.push(t) } u = t; requestAnimationFrame(f) })(0)
      // i fotogrammi lunghi del filo principale (Long Animation Frames: più di 50 ms fra JS, stili, impaginazione e disegno della pagina)
      try {
        new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lunghi.push({ t: e.startTime, d: e.duration, js: e.renderStart ? e.renderStart - e.startTime : e.duration,
          stili: e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0,
          chi: e.scripts.map(x => [`${x.invoker} ${x.sourceFunctionName || ''}`.trim(), x.duration]) }) }).observe({ type: 'long-animation-frame', buffered: false })
      } catch (e) { /* un Chrome vecchio non li ha */ }
    }, fasi)
    await page.reload()
    await page.waitForTimeout(3500)
    const s = await page.context().newCDPSession(page)
    if (cpu > 1) await s.send('Emulation.setCPUThrottlingRate', { rate: cpu })
    if (esegui) await page.evaluate(esegui)
    // il banco della tela e i conti della scena (Sotterraneo 3D, discese o mondo; Fattoria 3D), se l'espressione non ha lasciato il suo
    if (banco) await page.evaluate(n => {
      if (window.__extra) return
      window.__extra = () => {
        const f = window.__fattoria3d && window.__fattoria3d.mondo, s = window.__sotterraneo3d
        if (f) { const g = f.statistiche(), c = f.conteggi(); return { banco: f.banco(n), chiamate: g.calls, triangoli: g.triangoli, js: +g.cpu.toFixed(2), mesh: c.mesh, ombre: c.ombre, degrado: g.livello } }
        if (!s) return null
        const g = s.grafica()
        return { banco: s.banco(n), chiamate: g.chiamate, triangoli: g.triangoli, js: g.msJs, ...(g.mostri3d != null ? { mostri3d: g.mostri3d } : {}), ...(g.persone3d ? { persone3d: g.persone3d.visibili } : {}), ...(g.mondo ? { mostri: g.mostri } : {}) }
      }
    }, banco)
    await s.send('Performance.enable')
    const metriche = async () => Object.fromEntries((await s.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]))
    const m0 = await metriche()
    const profilo = Number(opz('profilo', 0))
    if (profilo) { await s.send('Profiler.enable'); await s.send('Profiler.setSamplingInterval', { interval: 500 }); await s.send('Profiler.start') }
    const traccia = Number(opz('traccia', 0))
    if (traccia) await b.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'gpu', 'cc', 'viz'] })
    if (ritmo) await page.evaluate(([r, o]) => { const f = new Function(r); f(); setInterval(f, o) }, [ritmo, ogni])
    await page.evaluate(() => { window.__dt.length = 0; window.__fa.length = 0; window.__ft.length = 0; window.__lunghi.length = 0 })
    for (let t = 0; t < secondi; t += 2) {
      if (tocca) await page.mouse.click(tocca[0] + (t % 4 ? 80 : -80), tocca[1] + (t % 6) * 30)
      await page.waitForTimeout(2000)
    }
    const [tutti, fa, ft, lunghi] = await page.evaluate(() => [window.__dt, window.__fa, window.__ft, window.__lunghi])
    // la fase di un fotogramma lungo: quella del fotogramma disegnato subito dopo
    const faseA = t => { const i = ft.findIndex(x => x >= t); return fa[i < 0 ? fa.length - 1 : i] }
    const m1 = await metriche()
    const prof = profilo ? (await s.send('Profiler.stop')).profile : null
    const tr = traccia ? JSON.parse((await b.stopTracing()).toString()).traceEvents : null
    const g = await page.evaluate(() => { try { return (window.__sotterraneo3d?.grafica || window.__mate?.grafica)?.() } catch (e) { return null } })
    const nota = [pv || '', sp && sp !== '-' ? `spegni ${sp}` : '', g && g.dpr ? `dpr ${g.dpr}` : '', g && g.chiamate ? `${g.chiamate} chiamate` : '', g && g.triangoli ? `${g.triangoli} tri` : '',
      adatta.length ? `si adatta: ${adatta[adatta.length - 1]}` : ''].filter(Boolean).join(', ')
    const nomi = fasi ? [...new Set(fa)].sort() : ['']
    for (const nome of nomi) {
      const dt = fasi ? tutti.filter((_, i) => fa[i] === nome) : tutti
      const p = q => dt.slice().sort((a, c) => a - c)[Math.min(dt.length - 1, Math.floor(q * dt.length))] || 0
      const somma = dt.reduce((a, c) => a + c, 0)
      const lenti = x => dt.filter(d => d > x).length
      console.log(`  ×${String(cpu).padEnd(4)} ${String(K).padEnd(7)} ${(1000 * dt.length / (somma || 1)).toFixed(0).padStart(4)} ${p(.5).toFixed(0).padStart(5)} ${p(.95).toFixed(0).padStart(5)} ${p(.99).toFixed(0).padStart(5)} ${String(lenti(33)).padStart(6)} ${String(lenti(50)).padStart(6)}  ${fasi ? `[${nome}: ${dt.length}] ` : ''}${nota}`)
      const l = lunghi.filter(x => !fasi || faseA(x.t) === nome)
      if (l.length) {
        const media = k => (l.reduce((a, c) => a + c[k], 0) / l.length).toFixed(0)
        const chi = new Map(); for (const x of l) for (const [k, d] of x.chi) chi.set(k, (chi.get(k) || 0) + d)
        const primi = [...chi].sort((a, c) => c[1] - a[1]).slice(0, 4).map(([k, d]) => `${k.slice(0, 60)} ${(d / l.length).toFixed(0)}`).join('; ')
        console.log(`        filo lungo (> 50 ms) in ${l.length} fotogrammi: ${media('d')} ms in media (JS ${media('js')}, stili e impaginazione ${media('stili')}); ${primi}`)
      }
    }
    // il filo principale, in ms a fotogramma (tutte le fasi insieme): il JS, gli stili e l'impaginazione del DOM
    const filo = k => ((m1[k] - m0[k]) * 1000 / Math.max(1, tutti.length)).toFixed(1)
    console.log(`        filo principale a fotogramma: compiti ${filo('TaskDuration')} ms, JS ${filo('ScriptDuration')}, stili ${filo('RecalcStyleDuration')}, impaginazione ${filo('LayoutDuration')}`)
    if (tr) {
      // i fili per nome (CrRendererMain il principale, Compositor quello che compone), e quanto dura ogni voce completa (ph X)
      const nomi = new Map(tr.filter(e => e.ph === 'M' && e.name === 'thread_name').map(e => [`${e.pid}:${e.tid}`, e.args.name]))
      const per = new Map()
      for (const e of tr) if (e.ph === 'X' && e.dur) { const f = nomi.get(`${e.pid}:${e.tid}`) || '?'; const k = `${f} ${e.name}`; per.set(k, (per.get(k) || 0) + e.dur) }
      for (const [k, us] of [...per].filter(([k]) => /^(CrRendererMain|Compositor|VizCompositorThread|CrGpuMain)/.test(k)).sort((a, c) => c[1] - a[1]).slice(0, traccia))
        console.log(`        ${(us / 1000 / Math.max(1, tutti.length)).toFixed(2).padStart(6)} ms/fot.  ${k.slice(0, 100)}`)
    }
    if (prof) {
      // il tempo proprio di ogni funzione: i campioni sono nodi dell'albero, `timeDeltas` quanto è durato ognuno
      const nodi = new Map(prof.nodes.map(n => [n.id, n])), tempo = new Map()
      prof.samples.forEach((id, i) => { const f = nodi.get(id).callFrame, k = `${f.functionName || '(anonima)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`; tempo.set(k, (tempo.get(k) || 0) + (prof.timeDeltas[i] || 0)) })
      const tot = [...tempo.values()].reduce((a, c) => a + c, 0)
      for (const [k, us] of [...tempo].sort((a, c) => c[1] - a[1]).slice(0, profilo)) console.log(`        ${(100 * us / tot).toFixed(1).padStart(5)}%  ${(us / 1000 / Math.max(1, tutti.length)).toFixed(2).padStart(6)} ms/fot.  ${k.slice(0, 110)}`)
    }
    const extra = await page.evaluate(() => { try { return window.__extra?.() } catch (e) { return null } })   // l'espressione di --esegui può lasciare `window.__extra`: cosa stampare in più
    if (extra != null) console.log('        ' + JSON.stringify(extra))
    await page.close(); await hog?.close()
  }
  await b.close()
  console.log('p50/p95/p99 sono ms fra due fotogrammi (16 = 60 fps, 33 = 30 fps); liscio se p95 sta sotto i 20, a scatti sopra i 33')
}

if (primo === 'calibra') await calibra(); else if (primo === 'benchmark') await benchmark(); else await misura()
