/* ═══════════════════════════════════════════════════════════════════
   LE ANTEPRIME DELLA FATTORIA 3D, FOTOGRAFATE SUL COMPUTER

     npm run anteprime                  ricompila e riscrive src/giochi/fattoria3d/dati/anteprime.js
     npm run anteprime -- --niente-build   con il dist/ che c'è (solo se è di questo codice)
     ANTEPRIME_DEBUG=1 npm run anteprime   e lascia i WebP in tmp/scatti/anteprime-fattoria3d/

   Apre la Fattoria 3D nel file costruito e chiede a `Mondo3d.anteprima(tipo, { viva: true })` la foto di ogni pezzo, edificio e
   bestia di casa, col renderer vero (la stessa posa, la stessa luce del telefono); la riduce a 160 px in WebP. Il telefono le legge
   e non ne disegna più nessuna (il crollo dopo «Costruisci»). Il file è GENERATO, con due firme: quella delle foto e quella dei
   sorgenti dei modelli (`SORGENTI`), che un test ricalcola: se un modello cambia e le foto no, è rosso.
   Vedi docs/fattoria3d/scena.md, «Le anteprime».
   ═══════════════════════════════════════════════════════════════════ */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { PEZZI, EDIFICI } from '../src/giochi/fattoria3d/dati/catalogo.js'
import { BESTIE } from '../src/giochi/fattoria3d/dati/bestie.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const FILE_ANTEPRIME = resolve(RADICE, 'src/giochi/fattoria3d/dati/anteprime.js')
const DEBUG = resolve(RADICE, 'tmp/scatti/anteprime-fattoria3d')
export const PIXEL = 160           // la carta le mostra a 72 px CSS: a dpr 2,75 sono 198, a 2 sono 144
const QUALITA = 0.82

/** I tipi fotografati: ogni pezzo, ogni edificio, le bestie di casa (`bestia:<id>`). Il ritratto del contadino dipende dal bambino: resta vivo. */
export const TIPI = [...Object.keys(PEZZI), ...Object.keys(EDIFICI), ...Object.keys(BESTIE).map(id => 'bestia:' + id)]

/** I file da cui viene la faccia di un modello: i creatori, la fusione, la cache, le istanze dei campi, le bestie e la posa delle foto. */
const SCENA = resolve(RADICE, 'src/giochi/fattoria3d/scena3d')
export const fileDeiModelli = () => readdirSync(SCENA)
  .filter(f => /^(modelli.*|bestie-corpo|bestie-puro.*|fondi|cache-modelli|campi-istanze|dal-sotterraneo|anteprime|anteprime-pura)\.js$/.test(f)).sort()
export const firmaSorgenti = () => {
  const h = createHash('sha1')
  for (const f of fileDeiModelli()) h.update(f + '\n' + readFileSync(resolve(SCENA, f), 'utf8').replace(/\r\n/g, '\n'))
  return h.digest('hex').slice(0, 12)
}
export const firmaDi = foto => createHash('sha1').update(JSON.stringify(foto)).digest('hex').slice(0, 12)

export function scriviAnteprime(foto) {
  const righe = Object.entries(foto).map(([k, v]) => `  ${JSON.stringify(k)}: '${v}',`)
  writeFileSync(FILE_ANTEPRIME, `/* GENERATO da strumenti/anteprime-fattoria3d.mjs (\`npm run anteprime\`) — non si scrive a mano.

   Le anteprime delle carte della Fattoria 3D (pezzi, edifici, bestie di casa): il modello vero fotografato sul computer, ${PIXEL}×${PIXEL}
   in WebP, ${Object.keys(foto).length} in tutto. Le legge Mondo3d.anteprima (scena3d/mondo3d.js), a parte dal resto. Vedi docs/fattoria3d/scena.md.
   firma: ${firmaDi(foto)}
*/

export const FIRMA = '${firmaDi(foto)}'
export const SORGENTI = '${firmaSorgenti()}'

export const ANTEPRIME = {
${righe.join('\n')}
}
`)
}

async function fotografa() {
  const { apriBrowser, apriGioco, azzera, semina, scegli } = await import('../test/aiuto/browser.mjs')
  const browser = await apriBrowser()
  const { page, errori } = await apriGioco(browser)
  await azzera(page)
  await semina(page, { coins: 300, settings: { eta: 8, sperimentali: true } })
  await scegli(page, 'fattoria3d')
  await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 30000 })
  if (process.env.ANTEPRIME_DEBUG) mkdirSync(DEBUG, { recursive: true })
  const foto = {}, mancano = []
  for (const t of TIPI) {
    const uri = await page.evaluate(async ([t, lato, qualita]) => {
      const png = await window.__fattoria3d.mondo.anteprima(t, { viva: true })
      if (!png) return null
      const img = new Image(); img.src = png; await img.decode()
      const c = document.createElement('canvas'); c.width = c.height = lato
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'
      g.drawImage(img, 0, 0, lato, lato)
      return c.toDataURL('image/webp', qualita)
    }, [t, PIXEL, QUALITA])
    if (!uri) { mancano.push(t); continue }
    foto[t] = uri
    if (process.env.ANTEPRIME_DEBUG) writeFileSync(resolve(DEBUG, t.replace(':', '-') + '.webp'), Buffer.from(uri.split(',')[1], 'base64'))
  }
  await browser.close()
  if (errori.length) console.warn('  errori della pagina:', errori.slice(0, 3).join(' | '))
  return { foto, mancano }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--niente-build')) {
    const b = spawnSync('npm', ['run', 'build'], { cwd: RADICE, stdio: 'inherit' })
    if (b.status) process.exit(b.status)
  }
  const { foto, mancano } = await fotografa()
  if (mancano.length) { console.error(`senza foto (il modello non c'è o non si disegna): ${mancano.join(', ')}`); process.exit(1) }
  scriviAnteprime(foto)
  const kb = Object.values(foto).reduce((s, u) => s + u.length, 0) / 1024
  console.log(`${Object.keys(foto).length} anteprime, ${Math.round(kb)} KB di testo → ${FILE_ANTEPRIME.slice(RADICE.length + 1)}`)
}
