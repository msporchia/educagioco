/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DI PROVA DEI PROTOTIPI

   I file di `poc/` non sono il gioco: sono cinque pagine HTML autonome
   che servono a capire se un'idea diverte prima di scriverla davvero.
   Non hanno test veri e non devono averne. Hanno però bisogno di una
   cosa sola: la certezza che si aprano senza esplodere.

   Questo script apre un prototipo in Chrome, lo lascia girare qualche
   secondo battendoci sopra qualche tocco a caso, e riporta ogni errore
   di console. In fondo salva uno scatto, che è il modo più rapido di
   accorgersi che «funziona» ma è tutto nero.

     node poc/prova.mjs survivors
     node poc/prova.mjs survivors --secondi 10
     node poc/prova.mjs                       # tutti quelli che ci sono
   ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, basename } from 'node:path'

const QUI = dirname(fileURLToPath(import.meta.url))
const SCATTI = resolve(QUI, 'scatti')
const TELEFONO = { width: 390, height: 844 }

function trovaChrome() {
  if (process.env.CHROME) return process.env.CHROME
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/chromium',
                   '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium'])
    if (existsSync(p)) return p
  return undefined                                  // quello di playwright, se c'è
}

/* Apre un prototipo, ci gioca alla cieca, restituisce quello che è andato storto. */
export async function prova(file, { secondi = 6, tocchi = 12 } = {}) {
  const exe = trovaChrome()
  const browser = await chromium.launch(exe ? { executablePath: exe } : {})
  const page = await browser.newPage({ viewport: TELEFONO, deviceScaleFactor: 2, hasTouch: true })
  const errori = []
  page.on('pageerror', e => errori.push('errore JS: ' + e.message))
  page.on('console', m => m.type() === 'error' && errori.push('console: ' + m.text()))

  await page.goto('file://' + resolve(file))
  await page.waitForTimeout(800)

  /* Tocchi finti sparsi per la pagina: un prototipo che si rompe al primo
     tocco è più comune di uno che si rompe da fermo. */
  for (let i = 0; i < tocchi; i++) {
    const x = 40 + ((i * 97) % (TELEFONO.width - 80))
    const y = 120 + ((i * 173) % (TELEFONO.height - 240))
    await page.mouse.click(x, y).catch(() => {})
    await page.waitForTimeout((secondi * 1000) / tocchi)
  }

  mkdirSync(SCATTI, { recursive: true })
  const nome = basename(file).replace(/\.html$/, '')
  const scatto = resolve(SCATTI, nome + '.png')
  await page.screenshot({ path: scatto })
  await browser.close()
  return { nome, errori, scatto }
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const args = process.argv.slice(2)
  const iS = args.indexOf('--secondi')
  const secondi = iS >= 0 ? Number(args[iS + 1]) : 6
  const filtro = args.filter(a => !a.startsWith('--') && a !== String(secondi))[0]

  const files = readdirSync(QUI)
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .filter(f => !filtro || f.includes(filtro))
    .map(f => resolve(QUI, f))

  if (!files.length) { console.error('nessun prototipo trovato' + (filtro ? ` per «${filtro}»` : '')); process.exit(1) }

  let guasti = 0
  for (const f of files) {
    const r = await prova(f, { secondi })
    if (r.errori.length) {
      guasti++
      console.log(`✗ ${r.nome}`)
      r.errori.slice(0, 8).forEach(e => console.log('   ' + e))
    } else {
      console.log(`✓ ${r.nome}  →  ${r.scatto.replace(QUI + '/', '')}`)
    }
  }
  process.exit(guasti ? 1 : 0)
}
