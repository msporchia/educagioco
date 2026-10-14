/* ═══════════════════════════════════════════════════════════════════
   LA TAVOLA DELLE ARMI IN PUGNO — i quattro eroi con ogni aspetto degli archi (e una spada e un bastone, per
   controllo), come si tengono sul campo e nella pagina dell'eroe. Per giudicare a occhio dove sta l'arma
   rispetto al corpo e alla faccia (docs/sotterraneo/roba.md, «le figure delle armi»).

     npm run build && node strumenti/sotterraneo-armi.mjs                      # tmp/armi/campo.png e pagina.png
     node strumenti/sotterraneo-armi.mjs --nome prima                          # tmp/armi/prima-campo.png …
     node strumenti/sotterraneo-armi.mjs --eroi elfa,nano --armi balestra,spada

   Apre dist/index.html con `#sotterraneo=roba&mano=<chiave>` (Gioco.vue, `corredoDaProva`): solo quell'arma in pugno,
   anche a chi non la porterebbe. Lo scontro non disegna l'arma: non c'è.
   ═══════════════════════════════════════════════════════════════════ */

import { apriBrowser, apriGioco } from '../test/aiuto/browser.mjs'
import { COSE, chiaveDelPezzo } from '../src/giochi/sotterraneo/dati/cose.js'
import { ASPETTI } from '../src/giochi/sotterraneo/dati/aspetti.js'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const QUI = dirname(fileURLToPath(import.meta.url))
const USCITA = resolve(QUI, '../tmp/armi')
const dist = resolve(QUI, '../dist/index.html')
if (!existsSync(dist)) { console.error(`manca ${dist}: prima npm run build`); process.exit(1) }

const args = process.argv.slice(2)
const opz = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d }
const nome = opz('nome', '')
const eroi = opz('eroi', 'cavaliere,elfa,mago,nano').split(',')
const AMPIO = 90    // il riquadro attorno all'eroe, in pixel dello schermo

// una chiave che dà quell'aspetto: il pezzo di base se lo ha, se no il primo livello e la prima rarità che lo scelgono
function chiaveDi(base, sprite) {
  if (COSE[base] && COSE[base].sprite === sprite) return base
  for (const rar of ['comune', 'magico', 'raro'])
    for (let l = 1; l < 80; l++) {
      let k
      try { k = chiaveDelPezzo(base, l, rar, rar === 'comune' ? [] : ['att']) } catch (e) { continue }
      if (COSE[k] && COSE[k].sprite === sprite) return k
    }
  return null
}

const armi = []
for (const base of ['arco-corto', 'arco-lungo', 'balestra'])
  for (const a of ASPETTI[base]) armi.push({ nome: a.sprite, chiave: chiaveDi(base, a.sprite) })
armi.push({ nome: 'arco-della-luna', chiave: 'arco-lungo@9.u.arco-della-luna' })
armi.push({ nome: 'spada', chiave: 'spada' }, { nome: 'bastone-magico', chiave: 'bastone-magico' })
const scelte = opz('armi', '').split(',').filter(Boolean)
const elenco = armi.filter(a => a.chiave && COSE[a.chiave] && (!scelte.length || scelte.includes(a.nome) || scelte.includes(a.chiave)))

mkdirSync(USCITA, { recursive: true })
const browser = await apriBrowser()
const foto = { campo: {}, pagina: {} }
const errori = []

for (const eroe of eroi) for (const a of elenco) {
  const hash = `sotterraneo=roba&eroe=${eroe}&giu=1&seme=7&stanza=sala&luce=stanza&mano=${encodeURIComponent(a.chiave)}`
  const { page, errori: e } = await apriGioco(browser, { hash, attesa: null, indirizzo: `file://${dist}` })
  await page.waitForSelector('canvas', { timeout: 10000 })
  await page.waitForTimeout(1500)
  const c = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })
  const clip = { x: Math.max(0, c.x - AMPIO / 2), y: c.y - AMPIO / 2 - 8, width: AMPIO, height: AMPIO }
  foto.campo[`${eroe}|${a.nome}`] = (await page.screenshot({ clip })).toString('base64')
  await page.click('[data-azione="eroe-pagina"]').catch(x => e.push('pagina eroe: ' + x.message))
  await page.waitForTimeout(500)
  const rit = await page.$('[data-pagina-eroe] .sot-eroe-ritratto')
  const b = rit && await rit.boundingBox()   // un po' più largo del riquadro: l'arma esce dal ritratto
  if (b) foto.pagina[`${eroe}|${a.nome}`] = (await page.screenshot({ clip: { x: Math.max(0, b.x - 6), y: b.y, width: b.width + 22, height: b.height } })).toString('base64')
  errori.push(...e)
  await page.close()
}

// una pagina sola con le foto in griglia (righe: le armi, colonne: gli eroi), fotografata
for (const vista of ['campo', 'pagina']) {
  const lato = vista === "campo" ? 240 : 190
  const righe = elenco.map(a => `<div class="r"><b>${a.nome}</b>` +
    eroi.map(h => `<span><img src="data:image/png;base64,${foto[vista][`${h}|${a.nome}`] || ''}" width="${lato}"></span>`).join('') + '</div>').join('')
  const html = `<style>body{margin:0;background:#222;color:#ddd;font:12px sans-serif}.r{display:flex;align-items:center;border-bottom:1px solid #444}
    .r>b{width:110px;padding-left:6px}.r>span{padding:2px}img{image-rendering:pixelated;display:block}.t{display:flex;padding-left:110px;height:18px}.t>i{width:${lato + 4}px;font-style:normal;padding-left:6px}</style>
    <div class="t">${eroi.map(h => `<i>${h}</i>`).join('')}</div>${righe}`
  const p = await browser.newPage({ viewport: { width: 120 + eroi.length * (lato + 4), height: 40 } })
  await p.setContent(html)
  await p.waitForTimeout(300)
  const file = resolve(USCITA, `${nome ? nome + '-' : ''}${vista}.png`)
  await p.screenshot({ path: file, fullPage: true })
  await p.close()
  console.log(`✓ ${vista}  →  ${file}`)
}
await browser.close()
if (errori.length) { console.log('✗ ' + [...new Set(errori)].slice(0, 6).join('\n  ')); process.exit(1) }
