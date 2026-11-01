/* ═══════════════════════════════════════════════════════════════════
   LE SAGOME DEL SOTTERRANEO 3D, FOTOGRAFATE SUL COMPUTER

     npm run anteprime sotterraneo      anche src/giochi/sotterraneo/dati/sagome-fatte.js (il comando: strumenti/anteprime.mjs)
     npm run anteprime sagome           solo le sagome
     ANTEPRIME_DEBUG=1 npm run anteprime sagome   e lascia l'atlante in tmp/scatti/sagome-sotterraneo3d.webp

   La figura piatta di un mostro o di una persona di sopra, dove il modello non si mette (oltre il tetto dei modelli, lontano, un
   modello che si rompe), è la foto del suo modello: ogni modello che il registro può dare (specie, gradi, varianti armate, grossi) e
   ogni persona, dalle otto direzioni, nel respiro, nel colpo e nella caduta (scena3d/sagome-pura.js), in un atlante solo. Il file è
   GENERATO con la firma dell'atlante e quella dei sorgenti dei modelli, che `unita/sotterraneo-sagome` ricalcola.
   Vedi docs/sotterraneo/sagome-3d.md.
   ═══════════════════════════════════════════════════════════════════ */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MOSTRI } from '../src/giochi/sotterraneo/dati/mostri.js'
import { GROSSI } from '../src/giochi/sotterraneo/dati/grossi.js'
import { VARIANTI } from '../src/giochi/sotterraneo/dati/varianti.js'
import { ORDINE_RARITA } from '../src/giochi/sotterraneo/dati/pezzi.js'
import { MODELLI_PERSONE } from '../src/giochi/sotterraneo/dati/persone3d.js'
import { ALTO_DELLA_SPECIE, ALTO_DEL_GROSSO, ALTO_DELLA_PERSONA } from '../src/giochi/sotterraneo/dati/altezze.js'
import { idDi, ALTEZZA } from '../src/giochi/sotterraneo/scena3d/mostri3d/registro.js'
import { SCALA_PERSONE } from '../src/giochi/sotterraneo/scena3d/sagome-pura.js'
import { PERSONAGGI_DI_SOPRA } from '../src/giochi/sotterraneo/dati/missioni.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const FILE_SAGOME = resolve(RADICE, 'src/giochi/sotterraneo/dati/sagome-fatte.js')
const DEBUG = resolve(RADICE, 'tmp/scatti/sagome-sotterraneo3d.webp')
const ALLUNGA = 1 / Math.cos(52 * Math.PI / 180)   // la vista dall'alto delle discese e del mondo (costanti.js)
const R = 24          // pixel della foto per cella in scena: un telefono ne mostra 26 a cella (39 a pixel ratio 1,5), lo sprite di prima 16
const POSTO_MAX = 2.4 * ALLUNGA   // la risoluzione di un grosso è quella delle specie più alte: oltre il tetto, un grosso è raro
const QUALITA = 0.85

/** I modelli da fotografare, ordinati: [{ id, persona, posti, fattore }]. I posti dicono la risoluzione (il più grande vince). */
export function vociDaFotografare() {
  const posti = new Map()
  const metti = (id, a) => { if (id) { if (!posti.has(id)) posti.set(id, new Set()); posti.get(id).add(a) } }
  for (const tipo of Object.keys(MOSTRI)) for (const grado of ORDINE_RARITA)
    for (const variante of [null, ...(VARIANTI[tipo] || []).filter(x => x.nome).map(x => x.chiave)]) metti(idDi({ tipo, grado, variante }), ALTO_DELLA_SPECIE[tipo] * ALLUNGA)
  // un grosso col modello di una specie ha la foto di quella (più piccola: oltre il tetto, un grosso è raro); chi è solo grosso la sua
  for (const g of Object.keys(GROSSI)) { const id = idDi({ grosso: g }); if (id && !posti.has(id)) metti(id, Math.min(POSTO_MAX, ALTO_DEL_GROSSO[g] * ALLUNGA)) }
  const voci = [...posti].map(([id, a]) => ({ id, persona: false, posti: [...a].sort(), fattore: ALTEZZA[id.split('+')[0]] || 1 }))
  for (const m of MODELLI_PERSONE) voci.push({ id: m, persona: true, posti: [ALTO_DELLA_PERSONA[m] * ALLUNGA * (m === 'capitano' ? PERSONAGGI_DI_SOPRA.capitano.scala : SCALA_PERSONE)] })
  return voci.sort((a, b) => (a.persona - b.persona) || (a.id < b.id ? -1 : 1))
}

/** I file da cui viene una sagoma: le pose, il fotografo, il registro e i modelli dei mostri (con le armi delle varianti), le persone, la saldatura, le misure. */
const GIOCO = resolve(RADICE, 'src/giochi/sotterraneo')
const tutti = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? tutti(p) : [p] })
export const fileDelleSagome = () => [
  ...['sagome-pura.js', 'sagome-foto.js', 'mostro3d.js', 'salda3d.js'].map(f => join(GIOCO, 'scena3d', f)),
  ...['mostri3d', 'persone3d', 'eroi3d'].flatMap(d => tutti(join(GIOCO, 'scena3d', d))),
  join(GIOCO, 'dati/altezze.js'),
].filter(f => /\.js$/.test(f)).map(f => relative(GIOCO, f)).sort()
export const firmaSorgenti = () => {
  const h = createHash('sha1')
  for (const f of fileDelleSagome()) h.update(f + '\n' + readFileSync(join(GIOCO, f), 'utf8').replace(/\r\n/g, '\n'))
  h.update(JSON.stringify({ R, QUALITA, POSTO_MAX }))
  return h.digest('hex').slice(0, 12)
}
export const firmaDi = (immagine, sagome) => createHash('sha1').update(immagine).update(JSON.stringify(sagome)).digest('hex').slice(0, 12)

export function scriviSagome({ immagine, normali, largo, alto, sagome, senza }) {
  const righe = Object.entries(sagome).map(([id, s]) => `  ${JSON.stringify(id)}: ${JSON.stringify(s)},`)
  const firma = firmaDi(immagine + normali, sagome)
  writeFileSync(FILE_SAGOME, `/* GENERATO da strumenti/sagome-sotterraneo3d.mjs (\`npm run anteprime sotterraneo\`) — non si scrive a mano.

   Le sagome del Sotterraneo 3D: la figura piatta di ogni modello di mostro e di persona, fotografata dal modello come sta in scena
   (scena3d/sagome-foto.js), in un atlante WebP solo di ${largo}×${alto} (e le sue normali a metà misura, NORMALI): ${Object.keys(sagome).length} modelli, ${Object.values(sagome).reduce((n, s) => n + s.f.length, 0)} foto.
   Per ogni modello \`alto\` e \`largo\` (la sua scatola a riposo, per la misura in scena), \`px\` (pixel della foto per unità del modello) e
   \`f\`: [x, y, w, h, ax, ab] per direzione e per posa (scena3d/sagome-pura.js). Vedi docs/sotterraneo/sagome-3d.md.
   firma: ${firma}
*/

export const FIRMA = '${firma}'
export const SORGENTI = '${firmaSorgenti()}'
export const SENZA = ${JSON.stringify(senza)}
export const LARGO = ${largo}, ALTO = ${alto}

export const SAGOME = {
${righe.join('\n')}
}

export const IMMAGINE = '${immagine}'
export const NORMALI = '${normali}'
`)
}

/** `browser` di Playwright col file costruito. → quello che scrive `scriviSagome` */
export async function fotografaSagome(browser) {
  const { apriGioco, GIOCO: INDIRIZZO } = await import('../test/aiuto/browser.mjs')
  const { page, errori } = await apriGioco(browser, { hash: 'sotterraneo=1&eroe=cavaliere&dpr=1&seme=11', attesa: null, indirizzo: INDIRIZZO })
  await page.waitForFunction(() => !!(window.__anteprime3d && window.__anteprime3d.sagome), null, { timeout: 30000 })
  const voci = vociDaFotografare()
  await page.exposeFunction('__avanzaSagome', id => process.stdout.write(`\r  sagome: ${id}                    `))
  const esito = await page.evaluate(([v, r, q]) => window.__anteprime3d.sagome(v, { R: r, qualita: q, avanza: id => window.__avanzaSagome(id) }), [voci, R, QUALITA])
  process.stdout.write('\n')
  await page.close()
  if (errori.length) console.warn('  errori della pagina:', errori.slice(0, 3).join(' | '))
  if (process.env.ANTEPRIME_DEBUG) { mkdirSync(dirname(DEBUG), { recursive: true }); writeFileSync(DEBUG, Buffer.from(esito.immagine.split(',')[1], 'base64')) }
  return esito
}

/* ── la tavola: `node strumenti/sagome-sotterraneo3d.mjs --tavola [id,id…] [--normali]` mette in fila, modello per modello, le foto
   di dati/sagome-fatte.js (le otto direzioni con le loro pose, a capo quando non stanno) in tmp/scatti/tavola-sagome.png ── */
async function tavola(ids, normali) {
  const { SAGOME, IMMAGINE, NORMALI } = await import('../src/giochi/sotterraneo/dati/sagome-fatte.js')
  const scelti = ids.length ? ids : Object.keys(SAGOME)
  const { apriBrowser } = await import('../test/aiuto/browser.mjs')
  const browser = await apriBrowser()
  const page = await browser.newPage()
  const png = await page.evaluate(async ([voci, src, mezze]) => {
    const img = new Image(); img.src = src; await img.decode()
    const W = 1600, gap = 6
    const fila = voci.map(([id, s]) => {
      const h = Math.max(...s.f.map(f => f[3])), posti = []
      let x = 170, y = 0
      for (const f of s.f) { const w = Math.abs(f[2]); if (x + w > W) { x = 170; y += h + gap } posti.push([x, y]); x += w + gap }
      return { id, f: s.f, posti, alto: y + h + gap }
    })
    const cv = document.createElement('canvas'); cv.width = W; cv.height = fila.reduce((n, r) => n + r.alto, 0) + 10
    const c = cv.getContext('2d'); c.fillStyle = '#3a3330'; c.fillRect(0, 0, cv.width, cv.height); c.font = '13px sans-serif'
    let y = 5
    for (const r of fila) {
      c.fillStyle = '#eee'; c.fillText(r.id, 6, y + 16)
      r.f.forEach((f, i) => {
        const [x, yy] = r.posti[i], w = Math.abs(f[2]), k = mezze ? 0.5 : 1
        c.save(); c.translate(x + (f[2] < 0 ? w : 0), y + yy); if (f[2] < 0) c.scale(-1, 1)
        c.drawImage(img, f[0] * k, f[1] * k, w * k, f[3] * k, 0, 0, w, f[3]); c.restore()
      })
      y += r.alto
    }
    return cv.toDataURL('image/png')
  }, [scelti.map(id => [id, SAGOME[id]]), normali ? NORMALI : IMMAGINE, !!normali])
  await browser.close()
  const esce = resolve(RADICE, 'tmp/scatti/tavola-sagome.png')
  mkdirSync(dirname(esce), { recursive: true })
  writeFileSync(esce, Buffer.from(png.split(',')[1], 'base64'))
  console.log(`${scelti.length} modelli → ${relative(RADICE, esce)}`)
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--tavola')) {
  const i = process.argv.indexOf('--tavola'), dopo = process.argv[i + 1]
  await tavola(dopo && !dopo.startsWith('--') ? dopo.split(',') : [], process.argv.includes('--normali'))
}
