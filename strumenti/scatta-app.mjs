/* ═══════════════════════════════════════════════════════════════════
   UNO SCATTO DELL'APPLICAZIONE — per guardare quello che si è scritto.

   Apre l'app servita da Vite su una schermata precisa (l'indirizzo
   `#torri`, `#survivors`, …), fa qualche tocco se glielo si chiede, e
   salva un PNG. Serve a chi scrive un gioco e non ha uno schermo:
   scrivere duemila righe di Vue senza mai guardarle è il modo più
   sicuro di consegnare una schermata nera.

     npx vite --port 5201 --strictPort &            # una porta tua
     node strumenti/scatta-app.mjs survivors --porta 5201
     node strumenti/scatta-app.mjs survivors --tocca ".carta.tappa" --attesa 900

   `--tocca` accetta più selettori separati da virgola: si toccano in
   fila, aspettando `--attesa` fra l'uno e l'altro. Un selettore che non
   c'è viene detto e non ferma lo scatto.
   ═══════════════════════════════════════════════════════════════════ */

import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const QUI = dirname(fileURLToPath(import.meta.url))
const SCATTI = resolve(QUI, '../tmp/scatti')
const TELEFONO = { width: 390, height: 844 }

const args = process.argv.slice(2)
const opz = (nome, difetto) => {
  const i = args.indexOf('--' + nome)
  return i >= 0 ? args[i + 1] : difetto
}
const dove = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') !== true)
if (!dove) { console.error('uso: node strumenti/scatta-app.mjs <schermata> [--porta 5173] [--tocca sel,sel] [--attesa 700]'); process.exit(1) }

const porta = opz('porta', '5173')
const attesa = Number(opz('attesa', 700))
const tocchi = (opz('tocca', '') || '').split(',').map(s => s.trim()).filter(Boolean)
mkdirSync(SCATTI, { recursive: true })
const esce = opz('file', resolve(SCATTI, `${dove}.png`))

const exe = process.env.CHROME ||
  ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => existsSync(p))
const browser = await chromium.launch(exe ? { executablePath: exe } : {})
const page = await browser.newPage({ viewport: TELEFONO, deviceScaleFactor: 2, hasTouch: true })

const errori = []
page.on('pageerror', e => errori.push('errore JS: ' + e.message))
page.on('console', m => {
  if (m.type() !== 'error') return
  const t = m.text()
  if (t.includes('favicon') || t.includes('Failed to load resource')) return
  errori.push('console: ' + t)
})

await page.goto(`http://localhost:${porta}/#${dove}`)
await page.waitForTimeout(1200)                 // l'app aspetta il profilo

for (const sel of tocchi) {
  const el = await page.$(sel)
  if (!el) { console.log(`   (niente da toccare per «${sel}»)`); continue }
  await el.click().catch(e => errori.push(`tocco fallito su ${sel}: ${e.message}`))
  await page.waitForTimeout(attesa)
}

await page.screenshot({ path: esce })
await browser.close()

console.log(errori.length
  ? `✗ ${dove}  →  ${esce}\n  ` + errori.slice(0, 8).join('\n  ')
  : `✓ ${dove}  →  ${esce}`)
process.exit(errori.length ? 1 : 0)
