/* ═══════════════════════════════════════════════════════════════════
   LE FOTO DEGLI INGREDIENTI DELLE POZIONI, FATTE SUL COMPUTER

     npm run anteprime pozioni        riscrive src/giochi/pozioni/dati/anteprime.js (il comando: strumenti/anteprime.mjs)

   Serve Vite da sé, apre strumenti/banco/foto-ingredienti.html e prende la foto di ogni modello di
   `scena3d/ingredienti3d.js` (fondo trasparente, WebP). Il telefono le legge e non ne costruisce nessuno:
   una pelle fine costa un secondo sul computer. Il file è GENERATO, con due firme: quella delle foto e quella
   dei sorgenti dei modelli, che un test ricalcola. Vedi docs/pozioni/regole.md.
   ═══════════════════════════════════════════════════════════════════ */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { INGREDIENTI } from '../src/giochi/pozioni/dati/misure.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = resolve(RADICE, 'src/giochi/pozioni/dati/anteprime.js')
const SORGENTI = ['src/giochi/pozioni/scena3d/ingredienti3d.js', 'src/giochi/fattoria3d/scena3d/creta.js', 'strumenti/banco/foto-ingredienti.html']
export const PIXEL = 160           // sul banco stanno a ~70 px CSS, a dpr 2 sono 140
export const NOMI = INGREDIENTI.map(i => i.nome)

export const firmaSorgenti = () => {
  const h = createHash('sha1')
  for (const f of SORGENTI) h.update(f + '\n' + readFileSync(resolve(RADICE, f), 'utf8').replace(/\r\n/g, '\n'))
  return h.digest('hex').slice(0, 12)
}
export const firmaDi = foto => createHash('sha1').update(JSON.stringify(foto)).digest('hex').slice(0, 12)

export function scriviPozioni(foto) {
  const righe = Object.entries(foto).map(([k, v]) => `  ${JSON.stringify(k)}: '${v}',`)
  writeFileSync(FILE, `/* GENERATO da strumenti/anteprime-pozioni.mjs (\`npm run anteprime pozioni\`) — non si scrive a mano.

   Gli ingredienti delle pozioni: il modello vero fotografato sul computer, ${PIXEL}×${PIXEL} in WebP, ${Object.keys(foto).length} in tutto.
   Vedi docs/pozioni/regole.md.
*/

export const FIRMA = '${firmaDi(foto)}'
export const SORGENTI = '${firmaSorgenti()}'

export const ANTEPRIME = {
${righe.join('\n')}
}
`)
}

export async function fotografaPozioni(browser) {
  const { createServer } = await import('vite')
  const server = await createServer({ root: RADICE, server: { port: 0, strictPort: false, open: false }, logLevel: 'error' })
  await server.listen()
  try {
    const page = await browser.newPage()
    await page.goto(`http://localhost:${server.httpServer.address().port}/strumenti/banco/foto-ingredienti.html?lato=${PIXEL}`, { waitUntil: 'load', timeout: 120000 })
    await page.waitForFunction(() => window.__foto, null, { timeout: 180000 })
    const foto = await page.evaluate(() => window.__foto)
    await page.close()
    return { foto: Object.fromEntries(NOMI.filter(n => foto[n]).map(n => [n, foto[n]])), mancano: NOMI.filter(n => !foto[n]) }
  } finally { await server.close() }
}
