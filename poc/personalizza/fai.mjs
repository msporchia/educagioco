/* ═══════════════════════════════════════════════════════════════════
   IL MOCK DI PERSONALIZZA — fotografa le pose e compone mock.html

     node poc/personalizza/fai.mjs              # fotografa (se manca la cache) e compone
     node poc/personalizza/fai.mjs --foto       # rifà le foto anche se ci sono
     node poc/personalizza/fai.mjs --foto --lato 320   # foto più grandi (280 di difetto), --qualita 0.8 (0.72)

   1. Le foto: serve Vite da sé e apre studio.html, che costruisce i modelli veri del gioco per ogni posa di scenari.js e li
      fotografa da otto lati. Il contadino e gli eroi vengono dal ramo `develop` (hanno «Chi sei», taglio e barba), estratto con
      `git archive` in tmp/sorgente-develop/ se non c'è (`--develop <ramo>` per un altro); il beagle e gli addobbi da questo ramo
      (gli addobbi hanno i colori solo qui). La cache sta in tmp/personalizza-foto.json.
   2. I gettoni degli addobbi sono le foto che il gioco già fa (src/giochi/fattoria3d/dati/anteprime.js, `addobbo:<id>:<colore>`).
   3. Compone mock.html da mock.sorgente.html: al posto di <!--SCENARI--> e <!--FOTO--> mette scenari.js e le foto, così il file
      è uno solo e si apre col doppio click o sul telefono, senza rete.
   ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '../..')
const args = process.argv.slice(2)
const opz = (nome, difetto) => { const i = args.indexOf('--' + nome); return i >= 0 ? args[i + 1] : difetto }
const CACHE = resolve(RADICE, 'tmp/personalizza-foto.json')
const SVILUPPO = resolve(RADICE, 'tmp/sorgente-develop')

await import('./scenari.js')
const { SCENARI } = globalThis

async function fotografa() {
  if (!existsSync(resolve(SVILUPPO, 'src'))) {
    const ramo = opz('develop', 'develop')
    console.log(`estraggo src/ di «${ramo}» in tmp/sorgente-develop/`)
    mkdirSync(SVILUPPO, { recursive: true })
    execSync(`git archive ${ramo} src | tar -x -C "${SVILUPPO}"`, { cwd: RADICE, stdio: 'inherit' })
  }
  const server = await createServer({
    root: RADICE, configFile: false, logLevel: 'error', optimizeDeps: { entries: ['poc/personalizza/studio.html'] },
    resolve: { alias: { '@sviluppo': resolve(SVILUPPO, 'src'), '@principale': resolve(RADICE, 'src') } },
    server: { port: 0, strictPort: false, open: false, fs: { allow: [RADICE] } },
  })
  await server.listen()
  const porta = server.httpServer.address().port
  const browser = await chromium.launch({
    ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  })
  try {
    const page = await browser.newPage({ viewport: { width: 400, height: 400 } })
    const errori = []
    page.on('pageerror', e => errori.push('errore JS: ' + e.message))
    page.on('console', m => m.type() === 'error' && errori.push('console: ' + m.text()))
    const q = `lato=${opz('lato', 280)}&qualita=${opz('qualita', 0.72)}${opz('solo', '') ? '&solo=' + opz('solo') : ''}`
    await page.goto(`http://localhost:${porta}/poc/personalizza/studio.html?${q}`, { waitUntil: 'load', timeout: 120000 })
    await page.waitForFunction(() => (window.__studio && window.__studio.pronto) || null, null, { timeout: 600000, polling: 1000 })
    const esito = await page.evaluate(() => window.__studio)
    for (const e of [...esito.errori, ...errori].slice(0, 20)) console.log('  ✗ ' + e)
    console.log(`${Object.keys(esito.foto).length} pose fotografate`)
    mkdirSync(dirname(CACHE), { recursive: true })
    writeFileSync(CACHE, JSON.stringify(esito.foto))
  } finally {
    await browser.close(); await server.close()
  }
}

if (args.includes('--foto') || !existsSync(CACHE)) await fotografa()
const foto = JSON.parse(readFileSync(CACHE, 'utf8'))

// i gettoni degli addobbi: le anteprime che il gioco già fa
const anteprime = readFileSync(resolve(RADICE, 'src/giochi/fattoria3d/dati/anteprime.js'), 'utf8')
const oggettiFoto = {}
for (const s of Object.values(SCENARI)) for (const o of Object.values(s.oggetti)) {
  if (o.foto !== 'addobbo') continue
  for (const f of o.forme || []) for (const c of f.colori || []) {
    const k = `addobbo:${f.id}:${c.id}`, m = anteprime.match(new RegExp(`"${k}": '([^']+)'`))
    if (m) oggettiFoto[k] = m[1]
    else console.log(`  ✗ manca l'anteprima ${k}`)
  }
}

const sorgente = readFileSync(resolve(QUI, 'mock.sorgente.html'), 'utf8')
const scenari = readFileSync(resolve(QUI, 'scenari.js'), 'utf8')
const conta = (t, s) => t.split(s).length - 1
if (conta(sorgente, '<!--SCENARI-->') !== 1 || conta(sorgente, '<!--FOTO-->') !== 1) throw new Error('mock.sorgente.html: servono un <!--SCENARI--> e un <!--FOTO--> e uno solo')
const fuori = sorgente
  .replace('<!--SCENARI-->', () => `<script>\n${scenari}</script>`)
  .replace('<!--FOTO-->', () => `<script>window.FOTO = ${JSON.stringify(foto)};\nwindow.FOTO_OGGETTI = ${JSON.stringify(oggettiFoto)};</script>`)
const dove = resolve(QUI, 'mock.html')
writeFileSync(dove, fuori)
console.log(`→ ${dove} (${(statSync(dove).size / 1e6).toFixed(1)} MB)`)

// `--scatti`: fotografa mock.html come su un telefono (390×844) in tmp/scatti/personalizza-<scenario>[-<tema>][-<tocchi>].png.
// `--tocca 'Cappelli,Cilindro'` tocca in fila i bottoni con quel testo (o aria-label) prima dello scatto; `--solo fattoria` uno solo, `--tema scuro` in un altro tema.
if (args.includes('--scatti')) {
  const SCATTI = resolve(RADICE, 'tmp/scatti')
  mkdirSync(SCATTI, { recursive: true })
  const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) })
  const tocchi = (opz('tocca', '') || '').split(',').filter(Boolean)
  try {
    for (const scenario of ['fattoria', 'sotterraneo', 'animali']) {
      if (opz('solo', '') && opz('solo') !== scenario) continue
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })
      const errori = []
      page.on('pageerror', e => errori.push(e.message))
      await page.goto('file://' + dove)
      const scheda = { fattoria: 'Contadina', sotterraneo: 'Eroe', animali: 'Cane' }[scenario]
      await page.click(`[data-mock="scenario"]:text-is("${scheda}")`)
      if (opz('tema', '')) await page.click(`[data-mock="tema"]:text-is("${opz('tema')}")`)
      for (const t of tocchi) {
        const b = page.locator(`#foglio button:text-is("${t}"), #foglio button[aria-label="${t}"], #foglio button:has(b:text-is("${t}")), #foglio button:has-text("${t}")`).first()
        if (await b.count()) await b.click(); else console.log(`  ✗ ${scenario}: niente da toccare «${t}»`)
      }
      const file = resolve(SCATTI, `personalizza-${scenario}${opz('tema', '') ? '-' + opz('tema') : ''}${tocchi.length ? '-' + tocchi.join('-').replace(/[^\w-]+/g, '_') : ''}.png`)
      await page.screenshot({ path: file })
      console.log(`${errori.length ? '✗ ' + errori.join('; ') + ' ' : ''}→ ${file}`)
      await page.close()
    }
  } finally { await browser.close() }
}
