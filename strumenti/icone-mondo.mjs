/* ═══════════════════════════════════════════════════════════════════
   LE ICONE DEI POSTI, FOTOGRAFATE NEL MONDO 3D

     npm run scatti icone-mondo        riscrive src/giochi/sotterraneo/dati/icone-mondo.js
     ICONE_DEBUG=1 npm run scatti icone-mondo   e lascia i PNG in tmp/scatti/icone-mondo/

   Apre il Sotterraneo 3D sul mondo di sopra (profilo con tutte le discese finite, così nessun ingresso porta il divieto),
   porta la telecamera su ogni monumento e su ogni città con **la stessa inquadratura per tutti** (quadrata, tondo sfumato, zoom e
   inclinazione fissi, sole di giorno, nebbia di mappa spenta `&nebbia=no`, l'eroe nascosto `&senzaeroe`), ritaglia il
   quadro e lo riduce a 112 px in WebP. Il file di dati è GENERATO (con la sua firma): non si scrive a mano.
   Chi lo usa non carica three: sono solo stringhe (docs/sotterraneo/mondo-3d.md, «Le icone dei posti»).
   ═══════════════════════════════════════════════════════════════════ */
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { campagnaSeminata } from '../test/aiuto/sotterraneo-semina.mjs'
import { INGRESSI_DEL_MONDO } from '../src/giochi/sotterraneo/dati/mondo-aperto.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const FILE_ICONE = resolve(RADICE, 'src/giochi/sotterraneo/dati/icone-mondo.js')
const DEBUG = resolve(RADICE, 'tmp/scatti/icone-mondo')

// L'inquadratura: uguale per tutti. Il lato della finestra è quadrato; lo zoom è quello della rotella (0,7 il più vicino,
// 1,5 il più lontano); `su` sposta il centro (in celle) se un monumento esce storto
export const LATO = 440            // px della finestra (e dello scatto)
export const PIXEL = 112           // lato dell'icona
const QUADRO = {
  dungeon: { zoom: 0.7, su: 0, parte: 0.62 },   // `parte`: quanto del quadro si tiene, dal centro
  citta: { zoom: 1.5, su: 0, parte: 0.9 },
}
const QUALITA = 0.82

// I posti: i quattordici ingressi per chiave (`ingresso:<chiave>` nel mondo: le sette discese, l'abisso e i sei nuovi), il villaggio
export const CHIAVI_DUNGEON = Object.keys(INGRESSI_DEL_MONDO)
export const CHIAVI_CITTA = ['villaggio']

export const firmaDi = icone => createHash('sha1').update(JSON.stringify(icone)).digest('hex').slice(0, 12)

export function scriviIcone(icone) {
  const righe = Object.entries(icone).map(([k, v]) => `  ${JSON.stringify(k)}: '${v}',`)
  writeFileSync(FILE_ICONE, `/* GENERATO da strumenti/icone-mondo.mjs (\`npm run scatti icone-mondo\`) — non si scrive a mano.

   Le icone dei posti del mondo di sopra in 3D, fotografate dai monumenti e dalle città del mondo vero: ${CHIAVI_DUNGEON.length} ingressi e
   ${CHIAVI_CITTA.length} città, ${PIXEL}×${PIXEL} in WebP. Chi le legge (iconaDi in dati/terra.js, nel Sotterraneo 3D) non carica three.
   Il Sotterraneo di sempre tiene i suoi ritagli dipinti (dati/terra-icone.js). Vedi docs/sotterraneo/mondo-3d.md.
   firma: ${firmaDi(icone)}
*/

export const FIRMA = '${firmaDi(icone)}'

export const ICONE_MONDO = {
${righe.join('\n')}
}
`)
}

// aspetta che la scena abbia costruito i pezzi attorno alla telecamera (uno per fotogramma) e che non ne arrivino più
async function pezziFermi(page) {
  let prima = '', uguali = 0
  for (let i = 0; i < 80 && uguali < 4; i++) {
    await page.waitForTimeout(250)
    const ora = await page.evaluate(() => window.__sotterraneo3d.grafica().pezzi.join(','))
    uguali = ora === prima ? uguali + 1 : 0
    prima = ora
  }
}

/* `browser` di Playwright, `gioco` l'indirizzo del file, `profilo` il profilo finto di scatti.mjs. Torna le icone. */
export async function fotografaIcone({ browser, gioco, profilo }) {
  const p = structuredClone(profilo)
  p.campagne = { ...p.campagne, sotterraneo: campagnaSeminata({ finite: CHIAVI_DUNGEON.filter(k => INGRESSI_DEL_MONDO[k].indice >= 0).length }) }
  p.settings = { ...p.settings, sperimentali: true }
  const page = await browser.newPage({ viewport: { width: LATO, height: LATO }, deviceScaleFactor: 2 })
  await page.addInitScript(x => {
    try {
      localStorage.setItem('giocatori', JSON.stringify([{ id: 'g1', nome: 'Anna' }]))
      localStorage.setItem('ultimo-giocatore', JSON.stringify('g1'))
      localStorage.setItem('profilo:g1', JSON.stringify(x))
    } catch (e) { /* lo dirà lo scatto */ }
  }, p)
  const errori = []
  page.on('pageerror', e => errori.push(e.message))
  await page.goto(gioco + '#sotterraneo3d=mondo&eroe=cavaliere&nebbia=no&senzaeroe&dpr=2')
  await page.waitForSelector('[data-mondo3d][data-pronto="1"]', { timeout: 30000 })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.pronto, null, { timeout: 30000 })
  // niente interfaccia sopra la scena: solo la tela
  await page.addStyleTag({ content: 'body { visibility: hidden !important } canvas { visibility: visible !important }' })
  // le carte in cima e in fondo non coprono niente: il quadro è tutto della scena
  await page.evaluate(() => { window.__sotterraneo3d.copri(0, 0) })
  // dove sta ogni posto (celle del mondo): il centro del lotto dell'ingresso, la piazza della città
  const dove = await page.evaluate(([dungeon, citta]) => {
    const M = window.__mondo3d, r = {}
    for (const b of M.bersagli()) if (b.ruolo === 'ingresso' && dungeon.includes(b.k)) r[b.k] = { x: b.lotto.x + b.lotto.w / 2, z: b.lotto.y + b.lotto.h / 2 }
    for (const c of M.m.citta) if (citta.includes(c.chiave)) r[c.chiave] = { x: c.piazza.x + c.piazza.w / 2, z: c.piazza.y + c.piazza.h / 2 }
    return r
  }, [CHIAVI_DUNGEON, CHIAVI_CITTA])

  if (process.env.ICONE_DEBUG) mkdirSync(DEBUG, { recursive: true })
  const icone = {}
  for (const k of [...CHIAVI_DUNGEON, ...CHIAVI_CITTA]) {
    const d = dove[k]
    if (!d) throw new Error(`nel mondo non c'è il posto «${k}»`)
    const q = QUADRO[CHIAVI_CITTA.includes(k) ? 'citta' : 'dungeon']
    await page.evaluate(([x, z, zoom]) => {
      window.__mondo3d.porta(x, z)
      window.__sotterraneo3d.zoom = zoom
    }, [d.x, d.z + q.su, q.zoom])
    await page.waitForTimeout(500)
    await pezziFermi(page)
    await page.waitForTimeout(900)          // la telecamera arriva e l'ombra si posa
    const png = await page.locator('[data-mondo3d] canvas').first().screenshot({ type: 'png' })
    if (process.env.ICONE_DEBUG) writeFileSync(resolve(DEBUG, k + '.png'), png)
    icone[k] = await page.evaluate(async ([b64, lato, qualita, parte]) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + b64
      await img.decode()
      const lati = Math.min(img.width, img.height) * parte
      const c = document.createElement('canvas')
      c.width = c.height = lato
      const g = c.getContext('2d')
      g.imageSmoothingQuality = 'high'
      g.drawImage(img, (img.width - lati) / 2, (img.height - lati) / 2, lati, lati, 0, 0, lato, lato)
      // un tondo sfumato ai bordi, come i ritagli dipinti: dove si mostrano (stile.css) il tondo è già nell'immagine
      const m = g.createRadialGradient(lato / 2, lato / 2, lato * 0.34, lato / 2, lato / 2, lato / 2)
      m.addColorStop(0, '#000f'); m.addColorStop(1, '#0000')
      g.globalCompositeOperation = 'destination-in'
      g.fillStyle = m
      g.fillRect(0, 0, lato, lato)
      return c.toDataURL('image/webp', qualita)
    }, [png.toString('base64'), PIXEL, QUALITA, q.parte])
    console.log(`  icona ${k.padEnd(10)} ${Math.round(icone[k].length * 0.75 / 102.4) / 10} KB`)
  }
  await page.close()
  if (errori.length) console.warn('  errori della pagina:', errori.slice(0, 3).join(' | '))
  return icone
}
