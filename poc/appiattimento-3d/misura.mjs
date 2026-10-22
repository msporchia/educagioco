/* Il catalogo del budget sul computer: per ogni scena di SCENE (leve.js) i CONTI, che non dipendono dal carico della macchina
   (chiamate, triangoli, shader in uso, nodi, luci vere, frammenti colorati, luci·frammenti, trame·frammenti, ombra·frammenti: conta.js),
   e i ms del banco solo come ordine di grandezza (il minimo di tre giri, col rumore dichiarato). Poi, sulle scene che il Redmi Note 7
   ha misurato davvero (strumenti/vecchio-telefono/log/redmi-note7-veri-22ott-2.txt, la colonna `tel`), i suoi ms di JS e di GPU accanto.

     node poc/appiattimento-3d/misura.mjs                      # tutte le scene (una ventina di minuti; il carico sposta i ms, non i conti)
     node poc/appiattimento-3d/misura.mjs --gruppi togli,luci   # solo quei gruppi
     node poc/appiattimento-3d/misura.mjs --stima               # niente browser: rifà la tavola dall'ultimo tmp/appiattimento-misura.json
     node poc/appiattimento-3d/misura.mjs --gruppi livelli --profilo   # e dove va il JS, in proporzione (per file e per funzione)

   Serve Vite da sé, Chrome con SwiftShader, lo schermo del Note 7 (392×774 CSS). I ms veri li dà il telefono: la stessa pagina con
   `?telefono=1` (poc/appiattimento-3d.md). */
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { SCENE } from './leve.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const opz = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d }
const FUORI = resolve(RADICE, 'tmp/appiattimento-misura.json')
const gruppi = opz('gruppi', null)

// il log vero: [id, ms, p95, fps, chiamate, kt, primo, sh, js, gpu, deriva]
const LOG = resolve(RADICE, 'strumenti/vecchio-telefono/log/redmi-note7-veri-22ott-2.txt')
const tel = Object.fromEntries(JSON.parse(/DATI (\{.*\})/.exec(readFileSync(LOG, 'utf8'))[1]).r.map(r => [r[0], r]))

let risultati = []
if (args.includes('--stima') && existsSync(FUORI)) risultati = JSON.parse(readFileSync(FUORI, 'utf8')).risultati
else {
  const scene = SCENE.filter(x => !gruppi || gruppi.split(',').includes(x.gruppo))
  const server = await createServer({ root: RADICE, server: { port: 0, strictPort: false, open: false }, logLevel: 'error' })
  await server.listen()
  const porta = server.httpServer.address().port
  const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  try {
    for (const x of scene) {
      const page = await browser.newPage({ viewport: { width: 392, height: 774 }, deviceScaleFactor: 2.75, hasTouch: true })
      const errori = []
      page.on('pageerror', e => errori.push(e.message))
      try {
        await page.goto(`http://localhost:${porta}/poc/appiattimento-3d.html?${x.q}&vista=scontro&pulito=1`, { waitUntil: 'load', timeout: 90000 })
        await page.waitForFunction(() => window.__prova && window.__prova.pronto, null, { timeout: 120000 })
        await page.waitForTimeout(1500)
        const r = await page.evaluate(() => ({ ...window.__prova.banco(10, 3), ...window.__prova.conta() }))
        // `--profilo`: dove va il JS di un fotogramma, in proporzione (il profilatore di Chrome per qualche secondo: le parti non
        // dipendono dal carico quanto i ms); per file e per funzione, tempo proprio
        if (args.includes('--profilo')) {
          const cdp = await page.context().newCDPSession(page)
          await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start')
          await page.waitForTimeout(4000)
          const { profile } = await cdp.send('Profiler.stop')
          const nodi = new Map(profile.nodes.map(n => [n.id, n])), perF = new Map(), perFile = new Map()
          profile.samples.forEach((id, i) => {
            const f = nodi.get(id).callFrame, us = profile.timeDeltas[i] || 0, file = (f.url.split('/').pop() || f.functionName || '?').replace(/\?.*$/, '')
            if (/^\((idle|program|garbage collector)\)$/.test(f.functionName)) return
            const k = `${f.functionName || '(anonima)'} ${file}:${f.lineNumber + 1}`
            perF.set(k, (perF.get(k) || 0) + us); perFile.set(file, (perFile.get(file) || 0) + us)
          })
          const tot = [...perFile.values()].reduce((a, b) => a + b, 0)
          r.profilo = { file: [...perFile].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => [k, Math.round(100 * v / tot)]),
                        funzioni: [...perF].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => [k, Math.round(1000 * v / tot) / 10]) }
          console.log('  JS per file (%):', r.profilo.file.map(([k, v]) => `${k} ${v}`).join(', '))
          console.log('  JS per funzione (%):', r.profilo.funzioni.map(([k, v]) => `${k} ${v}`).join('; '))
        }
        risultati.push({ ...x, ...r })
        console.log(`${x.id.padEnd(50)} ${String(r.ms).padStart(6)} ms ±${r.rumore}% · ${r.ch} ch ${Math.round(r.tri / 1000)}k tri ${r.programmi} sh ${r.nodi} nodi ${r.luciVere} luci · ${r.frammenti}M fr (×${r.sovrapposti}) ${r.luciFrammenti}M luce·fr ${r.trameFrammenti}M trame·fr ${r.ombraFrammenti}M ombra·fr · GL ${r.glDisegni} dis ${r.glProgrammi} prog ${r.glUniform} unif ${r.glTrame} tex ${r.glKB} kB · ${Object.entries(r.famiglie).filter(([, v]) => v).map(([k, v]) => k + ' ' + v).join(' ')}`)
      } catch (e) { console.log(`${x.id}: non regge (${e.message.split('\n')[0]}) ${errori.slice(0, 2).join(' | ')}`) }
      await page.close()
    }
  } finally { await browser.close(); await server.close() }
  mkdirSync(dirname(FUORI), { recursive: true })
  writeFileSync(FUORI, JSON.stringify({ quando: new Date().toISOString(), risultati }, null, 1))
}

// La stima in ms sul Note 7 non si fa qui: una regressione libera su dieci righe rumorose del log dà coefficienti negativi (provato:
// non regge). I costi del telefono letti riga per riga dal log stanno in docs/sotterraneo/appiattimento-3d.md; qui si stampano i conti
// di ogni scena accanto ai ms veri del telefono dove la scena è la stessa, per metterli a confronto a mano.
console.log('\n| scena | chiamate | GL programmi | GL uniform | Mfr | M luce·fr | M ombra·fr | famiglie (Mfr) | Note 7 js | Note 7 gpu |\n|---|---|---|---|---|---|---|---|---|---|')
for (const x of risultati) {
  const t = x.tel && tel[x.tel]
  console.log(`| ${x.nome} | ${x.ch} | ${x.glProgrammi} | ${x.glUniform} | ${x.frammenti} | ${x.luciFrammenti} | ${x.ombraFrammenti} | ${Object.entries(x.famiglie || {}).filter(([, v]) => v).map(([k, v]) => k + ' ' + v).join(', ')} | ${t ? t[8] : ''} | ${t ? t[9] : ''} |`)
}
console.log(`\n${FUORI}`)
