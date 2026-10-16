/* ═══════════════════════════════════════════════════════════════════
   LA TAVOLA DEI PAESAGGI — tutti i paesaggi del Sotterraneo 3D, affiancati

   Apre il file costruito (dist/index.html) una volta per paesaggio con
   il cheat `#sotterraneo3d=<discesa>&scenario=<paesaggio>`, l'eroe nella
   stanza più grande accesa tutta (`stanza=grande&luce=stanza`), fotografa
   la sola discesa (senza barre) e mette le foto in una tavola, col nome
   e quanto costa ognuno (chiamate e triangoli). Il criterio: dalla sola
   forma e trama di muri e pavimento si deve capire dov'è, anche in
   piccolo e in grigio (`--grigio`). Nessun test guarda i pixel: questa
   tavola mostra, e il giudizio è di chi guarda.

     npm run build && node strumenti/tavola-paesaggi.mjs
     node strumenti/tavola-paesaggi.mjs --grigio --nome tavola-grigia
     node strumenti/tavola-paesaggi.mjs --solo grotta,miniera --mostri --con '&sotterraneo=branco&mostri=3'
     node strumenti/tavola-paesaggi.mjs --stanza corridoio      # dove non c'è, la prima stanza

   I mostri del piano si tolgono (uno sveglio aprirebbe lo scontro), tranne
   con `--mostri`. `--discesa 2` (l'indice della storia), `--seme 11`, `--larghezza 390`,
   `--aspetta 6000`. Le foto singole restano in tmp/scatti/paesaggi/, la
   tavola è tmp/scatti/<nome>.png; i costi si stampano anche a terminale.
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco } from '../test/aiuto/browser.mjs'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { PAESAGGI } from '../src/giochi/sotterraneo/dati/paesaggi.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const SCATTI = resolve(QUI, '../tmp/scatti')
const FOTO = resolve(SCATTI, 'paesaggi')
const args = process.argv.slice(2)
const opz = (nome, difetto) => { const i = args.indexOf('--' + nome); return i >= 0 ? args[i + 1] : difetto }
const dist = resolve(QUI, '../dist/index.html')
if (!existsSync(dist)) { console.error('manca dist/index.html: prima npm run build'); process.exit(1) }
mkdirSync(FOTO, { recursive: true })

const solo = (opz('solo', '') || '').split(',').filter(Boolean)
const chiavi = Object.keys(PAESAGGI).filter(k => !solo.length || solo.includes(k))
const larghezza = Number(opz('larghezza', 390)), seme = opz('seme', '11'), discesa = opz('discesa', '1')
const stanza = opz('stanza', 'grande'), con = opz('con', ''), nome = opz('nome', 'tavola-paesaggi'), grigio = args.includes('--grigio')

const browser = await apriBrowser()
const foto = []
for (const k of chiavi) {
  const hash = `sotterraneo3d=${discesa}&eroe=cavaliere&stanza=${stanza}&luce=stanza&seme=${seme}&dpr=1&scenario=${k}${con}`
  const { page, errori } = await apriGioco(browser, { viewport: { width: larghezza, height: 844 }, hash, attesa: null, indirizzo: `file://${dist}` })
  await page.waitForTimeout(1500)
  // i mostri via (tranne con `--mostri`): la foto è del posto, e uno che si sveglia apre lo scontro e avvicina la telecamera
  if (!args.includes('--mostri')) await page.evaluate(() => { const c = window.__sotterraneo3d && window.__sotterraneo3d.corsa; if (c) { const r = c.livello.robe; for (let i = r.length - 1; i >= 0; i--) if (r[i].che === 'mostro') r.splice(i, 1) } }).catch(() => {})
  await page.waitForTimeout(Number(opz('aspetta', 6000)))
  const tela = await page.$('[data-tela="3d"]')
  const file = resolve(FOTO, `${k}.png`)
  // il riquadro attorno all'eroe (la telecamera lo tiene in mezzo): il resto è il buio del mai visto
  const b = tela && await tela.boundingBox()
  const alto = b ? Math.min(b.height, b.width * 1.25) : 0
  await page.screenshot({ path: file, ...(b ? { clip: { x: b.x, y: b.y + (b.height - alto) / 2 - b.height * 0.07, width: b.width, height: alto } } : {}) })
  const g = await page.evaluate(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica()).catch(() => null)
  console.log(`${errori.length ? '✗' : '✓'} ${k.padEnd(9)} ${g ? `${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli, ${g.figure} figure, paesaggio ${g.scenario}` : 'niente 3D'}  ${errori.slice(0, 2).join(' · ')}`)
  foto.push({ k, file, g })
  await page.close()
}

// la tavola: le foto in griglia, il nome sotto, in una pagina fotografata
const colonne = Math.min(5, foto.length), lato = 300
const pagina = await browser.newPage({ viewport: { width: colonne * (lato + 8) + 8, height: 400 }, deviceScaleFactor: 1 })
const html = `<html><head><meta charset="utf-8"></head><body style="margin:0;background:#111;font:600 15px system-ui;color:#ddd">
  <div style="display:grid;grid-template-columns:repeat(${colonne},${lato}px);gap:8px;padding:8px">
  ${foto.map(f => `<figure style="margin:0"><img src="data:image/png;base64,${readFileSync(f.file).toString('base64')}" style="width:${lato}px;display:block;${grigio ? 'filter:grayscale(1)' : ''}">
    <figcaption style="padding:4px 2px">${f.k}<span style="float:right;font-weight:400;color:#999">${f.g ? `${f.g.chiamate} ch · ${Math.round(f.g.triangoli / 1000)}k tr` : ''}</span></figcaption></figure>`).join('')}
  </div></body></html>`
const fileHtml = resolve(FOTO, `${nome}.html`)
writeFileSync(fileHtml, html)
await pagina.goto(`file://${fileHtml}`)
await pagina.waitForTimeout(300)
const esce = resolve(SCATTI, `${nome}.png`)
await pagina.screenshot({ path: esce, fullPage: true })
await browser.close()
console.log(`→ ${esce}`)
