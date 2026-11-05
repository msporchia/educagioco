/* ═══════════════════════════════════════════════════════════════════
   I DISEGNI DI CASTLE BATTLE, FATTI A MONTE

     npm run disegni:arena            (fa anche la build, per le due schermate)

   In partita non si disegna niente che si possa preparare: la CPU ha già le truppe. Questo strumento apre un browser su una pagina
   vuota e ci fa girare `arena-disegni/pagina.js`, che scrive:

   - `sorgenti/arena/schemi/terreno-<chiave>.png`, i terreni disegnati col programma: sono le immagini del gioco finché non c'è il
     dipinto, e l'allegato delle schede di ChatGPT (voce 8 di DA-GENERARE.md);
   - `src/giochi/arena/dati/opere-disegnate.js`, l'atlante di castelli, porte, ponti, miniere e stendardi, con la firma dei sorgenti:
     `unita/arena` dice se è vecchio;
   - `sorgenti/arena/schemi/partita.png` e `scelta.png`, due schermate da allegare.

   Poi lancia `terreni-arena.py`, che fa `dati/terreni-pronti.js`. Perché e come: docs/arena/grafica.md.
   ═══════════════════════════════════════════════════════════════════ */
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { apriBrowser } from '../../test/aiuto/browser.mjs'
import { firmaDisegni } from './arena-disegni/firma.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(QUI, '../..')
const SCHEMI = resolve(QUI, 'sorgenti/arena/schemi')
const MODULO = resolve(REPO, 'src/giochi/arena/dati/opere-disegnate.js')
const TERRENI = ['bosco', 'palude', 'neve', 'lava']
mkdirSync(SCHEMI, { recursive: true })

function lancia(comando, ...args) {
  const r = spawnSync(comando, args, { cwd: REPO, stdio: 'inherit' })
  if (r.status) process.exit(r.status)
}

const uscita = await build({
  configFile: false, logLevel: 'warn', root: REPO,
  build: { write: false, minify: false, lib: { entry: resolve(QUI, 'arena-disegni/pagina.js'), formats: ['iife'], name: 'Disegni' } },
})
const codice = (Array.isArray(uscita) ? uscita[0] : uscita).output[0].code

lancia('npx', 'vite', 'build', '--logLevel', 'warn')        // apriBrowser vuole la build, e le due schermate pure
const browser = await apriBrowser()
const page = await browser.newPage()
await page.setContent('<!doctype html><title>disegni</title>')
await page.addScriptTag({ content: codice })
for (const k of TERRENI) {
  const dati = await page.evaluate(chiave => window.Disegni.terreno(chiave), k)
  writeFileSync(resolve(SCHEMI, `terreno-${k}.png`), Buffer.from(dati.split(',')[1], 'base64'))
  console.log(`  terreno ${k}`)
}
const { pezzi, url } = await page.evaluate(() => window.Disegni.opere())
await browser.close()
writeFileSync(MODULO, `/* GENERATO da strumenti/sprite/disegni-arena.mjs: non si tocca a mano.
   Castelli, porte, ponti, miniere e stendardi di Castle Battle, disegnati a monte (docs/arena/grafica.md). PEZZI: nome →
   [x, y, largo, alto], e le miniere anche centro e piede, come le caserme. Se c'è il dipinto vince lui. */
export const FIRMA = '${firmaDisegni()}'
export const PEZZI = {
${Object.keys(pezzi).sort().map(n => `  '${n}': ${JSON.stringify(pezzi[n])},`).join('\n')}
}
export const ATLANTE = '${url}'
`)
console.log(`  ${relative(REPO, MODULO)}: ${Object.keys(pezzi).length} pezzi, ${Math.round(url.length / 1024)} KB`)

lancia('python3', 'strumenti/sprite/terreni-arena.py')
lancia('npx', 'vite', 'build', '--logLevel', 'warn')
const scatta = (cheat, file, ...altro) => lancia('node', 'strumenti/scatta-app.mjs', cheat, '--dist', '--file', resolve(SCHEMI, file), ...altro)
scatta('arena=neve&battaglia=25', 'partita.png', '--aspetta', '1500', '--attesa', '2600')
scatta('arena=lava&battaglia=0&vuota', 'scelta.png', '--aspetta', '2600', '--tocca', '[data-piazzola="2"]', '--attesa', '800')
