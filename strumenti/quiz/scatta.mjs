/* ═══════════════════════════════════════════════════════════════════
   LO SCATTO DI UNA PALESTRA — l'occhio, dove il banco non arriva.

   `banco.mjs` dice se un modulo è giusto; questo dice se si vede. Apre
   la pagina di prova, tocca «fammi una domanda», e salva uno scatto —
   che è l'unico modo di accorgersi che una griglia è illeggibile a 118
   pixel, che due figure si vedono uguali, o che la parola di cui si
   chiedono le sillabe non è scritta da nessuna parte (successo tutto).

     node strumenti/quiz/scatta.mjs orologio
     node strumenti/quiz/scatta.mjs orologio /tmp/mio.png
     node strumenti/quiz/scatta.mjs orologio --piccolo

   `--piccolo` scatta a 320×480, che è il telefono vecchio di casa: è la
   misura dove la scheda si rompeva per prima — le quattro figure da
   specchiare finivano sotto il bordo dello schermo, e non c'era modo di
   arrivarci. Di suo lo scatto dice anche quanto è alta la scheda, e si
   lamenta se è più alta dello schermo.

   Vuole il server acceso (`npm run quiz`, porta 5199): da `file://` il
   browser non carica i moduli.
   ═══════════════════════════════════════════════════════════════════ */

import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const QUI = dirname(fileURLToPath(import.meta.url))
const SCATTI = resolve(QUI, '../../poc/scatti')
const PORTA = process.env.PORTA_QUIZ || 5199
const TELEFONO = { width: 390, height: 844 }
const VECCHIO = { width: 320, height: 480 }

const argomenti = process.argv.slice(2)
const piccolo = argomenti.includes('--piccolo')
const [nome, file] = argomenti.filter(a => a !== '--piccolo')
if (!nome) {
  console.error('uso: node strumenti/quiz/scatta.mjs <modulo> [file.png] [--piccolo]')
  process.exit(1)
}
mkdirSync(SCATTI, { recursive: true })
const schermo = piccolo ? VECCHIO : TELEFONO
const esce = file || resolve(SCATTI, `quiz-${nome}${piccolo ? '-piccolo' : ''}.png`)

const exe = process.env.CHROME ||
  ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => existsSync(p))
const browser = await chromium.launch(exe ? { executablePath: exe } : {})
const page = await browser.newPage({ viewport: schermo, deviceScaleFactor: 2, hasTouch: true })

const errori = []
page.on('pageerror', e => errori.push('errore JS: ' + e.message))
page.on('console', m => {
  if (m.type() !== 'error') return
  const t = m.text()
  /* la favicon il browser la chiede sempre e noi non ce l'abbiamo */
  if (t.includes('favicon') || t.includes('Failed to load resource')) return
  errori.push('console: ' + t)
})
page.on('response', r => r.status() >= 400 && !r.url().includes('favicon') && errori.push(`${r.status()} ${r.url()}`))

await page.goto(`http://localhost:${PORTA}/poc/quiz-${nome}.html`)
await page.waitForTimeout(700)
await page.click('.via').catch(() => errori.push('non trovo il tasto «fammi una domanda»'))
await page.waitForTimeout(900)
await page.screenshot({ path: esce })

/* Quanto è alta la scheda: la domanda che l'occhio si fa per prima su
   uno schermo piccolo è «ci sta tutta?», e questa risposta non richiede
   di guardare il PNG. */
const misura = await page.evaluate(() => {
  const carta = document.querySelector('.quiz-carta')
  if (!carta) return null
  return { alta: Math.round(carta.getBoundingClientRect().height), schermo: window.innerHeight }
}).catch(() => null)
await browser.close()

if (misura && misura.alta > misura.schermo)
  errori.push(`la scheda è alta ${misura.alta}px su uno schermo di ${misura.schermo}: si dovrà scorrere`)

console.log(errori.length
  ? `✗ ${nome}\n  ` + errori.slice(0, 6).join('\n  ')
  : `✓ ${nome}  →  ${esce}` +
    (misura ? `  (scheda ${misura.alta}px su ${misura.schermo})` : ''))
process.exit(errori.length ? 1 : 0)
