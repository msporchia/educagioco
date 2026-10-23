/* Gli scatti del prototipo dell'appiattimento: per ogni vista, una foto per livello (o per leva) a misura di Note 7, e una tavola
   con le foto affiancate in tmp/scatti/appiattimento-<vista>.png. Serve Vite da sé (niente build), come la scheda del catalogo 3D.

     node poc/appiattimento-3d/scatta.mjs                                   # le quattro viste, alta | bassa di oggi | bassa | bassa+
     node poc/appiattimento-3d/scatta.mjs --viste scontro --livelli alta,bassa
     node poc/appiattimento-3d/scatta.mjs --viste vicino --leve 'mat:lambert,luce:vertice,luce:vertice-intera' --nome leve-luce
                                     # una foto per leva sopra la bassa di oggi: tmp/scatti/appiattimento-leve-luce-vicino.png
     node poc/appiattimento-3d/scatta.mjs --solo                            # solo i file singoli, niente tavola

   Le foto sono a 392×774 CSS a pixel ratio 2 (alta disegna a 1,5, bassa a 1, bassa+ a 0,75: la differenza di nitidezza si vede).
   Il browser è SwiftShader (la CPU fa la GPU, come la misura): gli scatti sono uguali su ogni computer. `CHROME=…` lo forza. */
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SCATTI = resolve(RADICE, 'tmp/scatti')
const args = process.argv.slice(2)
const opz = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d }
const viste = opz('viste', 'scontro,cantina,fuoco,vicino').split(',')
const leve = opz('leve', null)
const voci = leve ? leve.split(',').map(l => ({ id: l.replace(/[^\w+-]+/g, '_'), q: `livello=oggi&leve=${encodeURIComponent(l)}`, nome: l }))
  : opz('livelli', 'alta,oggi,bassa,bassa+').split(',').map(l => ({ id: l.replace('+', 'piu'), q: `livello=${encodeURIComponent(l)}`, nome: l }))
if (leve) voci.unshift({ id: 'oggi', q: 'livello=oggi', nome: 'bassa di oggi' })
const nome = opz('nome', '')
const SCHERMO = { width: 392, height: 774 }
mkdirSync(SCATTI, { recursive: true })

const server = await createServer({ root: RADICE, server: { port: 0, strictPort: false, open: false }, logLevel: 'error' })
await server.listen()
const porta = server.httpServer.address().port
const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
let guasti = 0
try {
  for (const vista of viste) {
    const foto = []
    for (const v of voci) {
      const page = await browser.newPage({ viewport: SCHERMO, deviceScaleFactor: 2 })
      const errori = []
      page.on('pageerror', e => errori.push('errore JS: ' + e.message))
      page.on('console', m => (m.type() === 'error' || /THREE\.WebGLProgram/.test(m.text())) && errori.push('console: ' + m.text().slice(0, 400)))
      await page.goto(`http://localhost:${porta}/poc/appiattimento-3d.html?${v.q}&vista=${vista}&pulito=1`, { waitUntil: 'load', timeout: 90000 })
      await page.waitForFunction(() => window.__prova && window.__prova.pronto, null, { timeout: 120000 })
      // il fuoco: la magia parte adesso, la foto a metà (uguale per tutti)
      if (vista === 'fuoco') { await page.evaluate(() => window.__prova.colpo('fiammata')); await page.waitForTimeout(650) } else await page.waitForTimeout(800)
      const png = await page.screenshot({ timeout: 180000 })
      const conti = await page.evaluate(() => window.__prova.conti())
      const file = resolve(SCATTI, `appiattimento-${nome ? nome + '-' : ''}${vista}-${v.id}.png`)
      writeFileSync(file, png)
      foto.push({ ...v, png, conti })
      console.log(`${vista} ${v.nome}: ${conti.ch} chiamate, ${Math.round(conti.tri / 1000)}k triangoli, ${conti.programmi} shader, dpr ${conti.dpr} → ${file}`)
      if (errori.length) { guasti++; console.log('  ' + [...new Set(errori)].slice(0, 6).join('\n  ')) }
      await page.close()
    }
    if (args.includes('--solo')) continue
    // la tavola: le foto affiancate, il nome sotto
    const page = await browser.newPage({ viewport: { width: SCHERMO.width * foto.length + 8 * (foto.length + 1), height: SCHERMO.height + 40 }, deviceScaleFactor: 2 })
    await page.setContent(`<body style="margin:0;background:#111;display:flex;gap:8px;padding:0 8px;font:700 14px system-ui;color:#eee">${foto.map(f =>
      `<figure style="margin:0;width:${SCHERMO.width}px"><img style="width:${SCHERMO.width}px;height:${SCHERMO.height}px;display:block" src="data:image/png;base64,${f.png.toString('base64')}"><figcaption style="text-align:center;padding:10px 0">${f.nome} · ${f.conti.ch} ch · ${Math.round(f.conti.tri / 1000)}k tri · ${f.conti.programmi} sh</figcaption></figure>`).join('')}</body>`)
    const tavola = resolve(SCATTI, `appiattimento-${nome ? nome + '-' : ''}${vista}.png`)
    await page.screenshot({ path: tavola })
    await page.close()
    console.log(`  la tavola: ${tavola}`)
  }
} finally {
  await browser.close()
  await server.close()
}
if (guasti) { console.log(`${guasti} pagine con errori`); process.exitCode = 1 }
