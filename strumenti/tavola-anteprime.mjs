/* ═══════════════════════════════════════════════════════════════════
   LA TAVOLA DELLE ANTEPRIME 3D — la roba, gli eroi e i mostri come li
   vedono lo zaino, le botteghe, il ritratto e la fila dei turni del
   Sotterraneo 3D (docs/sotterraneo/anteprime-3d.md)

   Apre il file costruito nel Sotterraneo 3D, chiede al servizio delle
   anteprime (`window.__anteprime3d`) tutte le chiavi e le mette in una
   tavola col nome sotto; quelle che tornano null (niente modello: resta
   lo sprite) sono segnate. Stampa quanto ci mette ad averle tutte: il
   costo dello zaino pieno in SwiftShader (i ms non dicono niente del
   telefono, l'ordine di grandezza sì).

     npm run build && node strumenti/tavola-anteprime.mjs
     node strumenti/tavola-anteprime.mjs --solo roba          # roba, eroi, mostri
     node strumenti/tavola-anteprime.mjs --solo rarita        # ogni arma, scudo e gioiello comune, magico, raro, e i leggendari (gli aloni)
     node strumenti/tavola-anteprime.mjs --eroe mago --scala 2
     node strumenti/tavola-anteprime.mjs --chiavi arma:ascia-lava,busto:nano:accetta:scudo-nanico:-

   La tavola è tmp/scatti/<nome>.png (`--nome`, di difetto tavola-anteprime); `--aspetta 6000` i ms
   prima di chiedere (la discesa che si accende non entra nella misura).
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco } from '../test/aiuto/browser.mjs'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { COSE, chiaveDelPezzo } from '../src/giochi/sotterraneo/dati/cose.js'
import { ABILITA_DEI_PEZZI, UNICI } from '../src/giochi/sotterraneo/dati/pezzi.js'
import { MOSTRI } from '../src/giochi/sotterraneo/dati/mostri.js'
import { GROSSI } from '../src/giochi/sotterraneo/dati/grossi.js'
import { chiaveDellaCosa, chiaveDellEroe, chiaveDelMostro, EROI } from '../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const SCATTI = resolve(QUI, '../tmp/scatti')
const args = process.argv.slice(2)
const opz = (nome, difetto) => { const i = args.indexOf('--' + nome); return i >= 0 ? args[i + 1] : difetto }
const dist = resolve(QUI, '../dist/index.html')
if (!existsSync(dist)) { console.error('manca dist/index.html: prima npm run build'); process.exit(1) }
mkdirSync(SCATTI, { recursive: true })

const eroe = opz('eroe', 'cavaliere'), solo = opz('solo', 'roba,eroi,mostri').split(','), scala = Number(opz('scala', 1))
const nome = opz('nome', 'tavola-anteprime')
let voci = []
if (opz('chiavi')) voci = opz('chiavi').split(',').map(k => ({ k, n: k }))
else {
  if (solo.includes('roba')) {
    for (const [k, c] of Object.entries(COSE)) {
      const t = chiaveDellaCosa({ chiave: k }, eroe)
      voci.push({ k: t, n: k, sprite: !t && c.dove })
      if (c.dove === 'corpo') for (const r of ['m.vita', 'r.vita.dif']) voci.push({ k: chiaveDellaCosa({ chiave: `${k}@5.${r}` }, eroe), n: `${k} ${r[0]}` })
    }
  }
  if (solo.includes('rarita')) {
    // le figure e gli aloni (docs/sotterraneo/roba-3d.md): ogni base comune, magica e rara al livello 6, poi i pezzi col nome
    for (const [k, c] of Object.entries(COSE)) {
      if (!['mano', 'mancina', 'collo', 'dito'].includes(c.dove)) continue
      const ab = Object.keys(ABILITA_DEI_PEZZI).filter(a => ABILITA_DEI_PEZZI[a].dove.includes(c.dove))
      for (const [r, a, n] of [['comune', [], 'c'], ['magico', ab.slice(0, 1), 'm'], ['raro', ab.slice(1, 3), 'r']])
        voci.push({ k: chiaveDellaCosa({ chiave: chiaveDelPezzo(k, 6, r, a) }, eroe), n: `${k} ${n}` })
    }
    for (const [u, v] of Object.entries(UNICI)) voci.push({ k: chiaveDellaCosa({ chiave: chiaveDelPezzo(v.base, 9, v.rarita, [], u) }, eroe), n: u })
  }
  if (solo.includes('eroi')) {
    const roba = { cavaliere: ['spada@9.u.zanna-del-drago', 'scudo-ferro@6.r.dif.vita', 'corazza', 'medaglione@4.m.vita'], elfa: ['arco-lungo', null, 'manto@3.m.vita', 'amuleto-azzurro@5.r.vita.dif'],
                   mago: ['bastone-magico@4.m.fuoco', null, 'saio', null], nano: ['ascia', 'scudo-leone', 'corazza@5.r.vita.dif', null] }
    for (const e of EROI) {
      const [mano, mancina, corpo, collo] = roba[e]
      voci.push({ k: chiaveDellEroe(e, { mano, mancina, corpo, collo }), n: e }, { k: chiaveDellEroe(e, { mano, mancina, corpo, collo }, 'busto'), n: `${e} busto` })
    }
  }
  if (solo.includes('mostri')) {
    for (const t of Object.keys(MOSTRI)) voci.push({ k: chiaveDelMostro({ tipo: t }), n: t })
    for (const g of Object.keys(GROSSI)) voci.push({ k: chiaveDelMostro({ grosso: g }), n: g })
  }
  voci = voci.filter(v => v.k || v.sprite)
}

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser, { viewport: { width: 390, height: 844 }, hash: `sotterraneo3d=1&eroe=${eroe}&dpr=1&seme=11`,
                                                     attesa: null, indirizzo: `file://${dist}` })
await page.waitForFunction(() => !!window.__anteprime3d, null, { timeout: 30000 })
// la discesa si accende prima: la misura è quella di uno zaino aperto a scena già in piedi (`--aspetta`, ms)
await page.waitForTimeout(Number(opz('aspetta', 6000)))
const chiavi = [...new Set(voci.map(v => v.k).filter(Boolean))]
const esito = await page.evaluate(async ks => {
  const t0 = performance.now()
  const urls = await Promise.all(ks.map(k => window.__anteprime3d.chiedi(k)))
  const ms = performance.now() - t0
  // le anteprime sono tele di questa pagina: per la tavola diventano data:
  const dati = urls.map(u => (u ? u.toDataURL('image/png') : null))
  return { ms, urls: Object.fromEntries(ks.map((k, i) => [k, dati[i]])), stato: window.__anteprime3d.stato() }
}, chiavi)
const nulle = chiavi.filter(k => !esito.urls[k])
console.log(JSON.stringify(esito.stato)); console.log(`${chiavi.length} anteprime in ${Math.round(esito.ms)} ms (${Math.round(esito.stato.ms)} ms a disegnarle, ${(esito.stato.ms / Math.max(1, esito.stato.disegnate)).toFixed(1)} ms l'una); null: ${nulle.length ? nulle.join(' ') : 'nessuna'}`)
if (errori.length) console.log('errori: ' + errori.slice(0, 3).join(' · '))

const lato = Math.round(110 * scala), colonne = 8
const pagina = await browser.newPage({ viewport: { width: colonne * (lato + 6) + 6, height: 400 }, deviceScaleFactor: 1 })
const html = `<html><head><meta charset="utf-8"></head><body style="margin:0;background:radial-gradient(#2d3047,#0c0e17);font:600 11px system-ui;color:#ddd">
  <div style="display:grid;grid-template-columns:repeat(${colonne},${lato}px);gap:6px;padding:6px">
  ${voci.map(v => { const u = v.k && esito.urls[v.k]; return `<figure style="margin:0;background:#0006;border-radius:6px">${u ? `<img src="${u}" style="width:${lato}px;height:${lato}px;object-fit:contain;display:block">`
    : `<div style="width:${lato}px;height:${lato}px;display:grid;place-items:center;color:#f88">sprite</div>`}<figcaption style="padding:2px 4px;overflow:hidden;white-space:nowrap">${v.n}</figcaption></figure>` }).join('')}
  </div></body></html>`
const fileHtml = resolve(SCATTI, `${nome}.html`)
writeFileSync(fileHtml, html)
await pagina.goto(`file://${fileHtml}`)
await pagina.waitForTimeout(300)
const esce = resolve(SCATTI, `${nome}.png`)
await pagina.screenshot({ path: esce, fullPage: true })
await browser.close()
console.log(`→ ${esce}`)
