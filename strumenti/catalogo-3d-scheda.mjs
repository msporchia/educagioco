/* ═══════════════════════════════════════════════════════════════════
   LA SCHEDA DEL CATALOGO 3D — un PNG contatto con tutti i modelli

   Serve Vite da sé (niente build, niente porta da scegliere), apre
   `strumenti/banco/catalogo-3d.html?scheda=1&gioco=…`, aspetta che le
   anteprime siano pronte e fotografa la pagina intera: un PNG per gioco
   (e uno di tutti) in tmp/scatti/. Dice anche le voci che non si creano.

     npm run catalogo3d:scheda
     npm run catalogo3d:scheda -- --gioco fattoria         # solo quelli
     npm run catalogo3d:scheda -- --larghezza 1400 --pixel 1
     npm run catalogo3d:scheda -- --gioco fattoria --senzacache   # i modelli della fattoria costruiti da capo a ogni voce (confronto con la cache)
     npm run catalogo3d:scheda -- --gioco fattoria --senzacache --senzafondi   # …e nemmeno fusi: i modelli sciolti (confronto con le mesh fuse)
     npm run catalogo3d:scheda -- --q watson --angolo 90 --alto 10 --vicino 1.5 --pixel 2
                                   # da vicino e di fianco: catalogo-3d-<gioco>-<q>-a90.png

   Il browser: `CHROME=…` lo forza (come per i test), altrimenti quello di
   Playwright. Vedi docs/core/catalogo-3d.md.
   ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SCATTI = resolve(RADICE, 'tmp/scatti')
const args = process.argv.slice(2)
const opz = (nome, difetto) => { const i = args.indexOf('--' + nome); return i >= 0 ? args[i + 1] : difetto }
const larghezza = Number(opz('larghezza', 1100)), pixel = Number(opz('pixel', 1))
const gruppi = opz('gioco', null) ? [opz('gioco')] : ['tutti', 'fattoria', 'sotterraneo']
const senzaCache = (args.includes('--senzacache') ? '&senzacache=1' : '') + (args.includes('--senzafondi') ? '&senzafondi=1' : '')
const q = opz('q', ''), vista = ['angolo', 'alto', 'vicino'].filter(k => opz(k, null) != null).map(k => `&${k}=${opz(k)}`).join('')
const coda = (args.includes('--senzacache') ? '-senzacache' : '') + (args.includes('--senzafondi') ? '-senzafondi' : '') + (q ? '-' + q.replace(/[^\w-]+/g, '_') : '') + (opz('angolo', null) != null ? '-a' + opz('angolo') : '')
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
  for (const gioco of gruppi) {
    const page = await browser.newPage({ viewport: { width: larghezza, height: 900 }, deviceScaleFactor: pixel })
    const errori = []
    page.on('pageerror', e => errori.push('errore JS: ' + e.message))
    page.on('console', m => m.type() === 'error' && errori.push('console: ' + m.text()))
    await page.goto(`http://localhost:${porta}/strumenti/banco/catalogo-3d.html?scheda=1&gioco=${gioco}${senzaCache}${q ? '&lato=800&q=' + encodeURIComponent(q) : ''}${vista}`, { waitUntil: 'load', timeout: 90000 })
    await page.waitForFunction(() => window.__catalogo3d && window.__catalogo3d.pronto, null, { timeout: 180000 })
    const { n, falliti, pesi } = await page.evaluate(() => {
      const viste = window.__catalogo3d.voci.filter(v => !document.querySelector(`[data-id="${CSS.escape(v.id)}"]`).hidden)
      return { n: viste.length, falliti: window.__catalogo3d.errori, pesi: viste.map(v => `${v.nome}: ${v.mesh} mesh, ${v.tri} triangoli`) }
    })
    const file = resolve(SCATTI, `catalogo-3d-${gioco}${coda}.png`)
    if (q) {                                     // poche voci: schede grandi, solo la griglia (niente coppie)
      await page.addStyleTag({ content: 'body.contatto .griglia { grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)) }' })
      await page.locator('#griglia').screenshot({ path: file })
    } else await page.screenshot({ path: file, fullPage: true })
    console.log(`${errori.length ? '✗' : '✓'} ${gioco}: ${n} modelli → ${file}`)
    if (q) for (const p of pesi) console.log('   ' + p)              // con --q: quanto pesa ogni voce
    for (const f of falliti) console.log('   non si crea: ' + f)
    for (const e of errori.slice(0, 8)) console.log('   ' + e)
    guasti += falliti.length + errori.length
    await page.close()
  }
} finally {
  await browser.close(); await server.close()
}
process.exit(guasti ? 1 : 0)
