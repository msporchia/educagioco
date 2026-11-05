/* ═══════════════════════════════════════════════════════════════════
   LE FOTO DELLA CUCINA DELLA BANCARELLA, FATTE SUL COMPUTER

     npm run anteprime cucina         riscrive src/data/bancarella-foto.js (il comando: strumenti/anteprime.mjs)

   Serve Vite da sé, apre strumenti/banco/foto-cucina.html e prende la foto di ogni piatto, ingrediente e attrezzo
   (fondo trasparente, WebP). Le ordinazioni, il ricettario e le scelte mostrano queste: a schermo si deve riconoscere
   quello che sta nella stanza. Il file è GENERATO, con due firme: quella delle foto e quella dei sorgenti dei modelli,
   che un test ricalcola. Vedi docs/bancarella/cucina.md.
   ═══════════════════════════════════════════════════════════════════ */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RICETTE, INGREDIENTI } from '../src/data/bancarella-cucine.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = resolve(RADICE, 'src/data/bancarella-foto.js')
const SORGENTI = ['src/grafica/cucina3d/cibo.js', 'src/grafica/cucina3d/pezzi.js', 'src/grafica/cucina3d/sala.js', 'src/giochi/fattoria3d/scena3d/creta.js', 'strumenti/banco/foto-cucina.html']
export const PIXEL = 128           // nelle ordinazioni stanno a 62 px CSS, a dpr 2 sono 124
export const CHIAVI = [...RICETTE.map(r => 'piatto:' + r.emoji), ...Object.keys(INGREDIENTI).map(k => 'cosa:' + k),
  ...['pentola', 'padella', 'tagliere', 'forno', 'piatti'].map(k => 'attrezzo:' + k), 'ricettario']

export const firmaSorgenti = () => {
  const h = createHash('sha1')
  for (const f of SORGENTI) h.update(f + '\n' + readFileSync(resolve(RADICE, f), 'utf8').replace(/\r\n/g, '\n'))
  return h.digest('hex').slice(0, 12)
}
export const firmaDi = foto => createHash('sha1').update(JSON.stringify(foto)).digest('hex').slice(0, 12)

export function scriviCucina(foto) {
  const righe = Object.entries(foto).map(([k, v]) => `  ${JSON.stringify(k)}: '${v}',`)
  writeFileSync(FILE, `/* GENERATO da strumenti/anteprime-cucina.mjs (\`npm run anteprime cucina\`) — non si scrive a mano.

   I piatti, gli ingredienti e gli attrezzi della cucina: il modello vero fotografato sul computer, ${PIXEL}×${PIXEL} in WebP,
   ${Object.keys(foto).length} in tutto. Vedi docs/bancarella/cucina.md.
*/

export const FIRMA = '${firmaDi(foto)}'
export const SORGENTI = '${firmaSorgenti()}'

export const FOTO = {
${righe.join('\n')}
}
`)
}

export async function fotografaCucina(browser) {
  const { createServer } = await import('vite')
  const server = await createServer({ root: RADICE, server: { port: 0, strictPort: false, open: false }, logLevel: 'error' })
  await server.listen()
  try {
    const page = await browser.newPage()
    const errori = []
    page.on('pageerror', e => errori.push(e.message))
    await page.goto(`http://localhost:${server.httpServer.address().port}/strumenti/banco/foto-cucina.html?lato=${PIXEL}`, { waitUntil: 'load', timeout: 120000 })
    await page.waitForFunction(() => window.__foto, null, { timeout: 180000 }).catch(() => { throw new Error('foto-cucina: ' + errori.join('; ')) })
    const foto = await page.evaluate(() => window.__foto)
    await page.close()
    return { foto: Object.fromEntries(CHIAVI.filter(n => foto[n]).map(n => [n, foto[n]])), mancano: CHIAVI.filter(n => !foto[n]) }
  } finally { await server.close() }
}
