/* ═══════════════════════════════════════════════════════════════════
   LA SCENA DEL SOTTERRANEO A OGNI LARGHEZZA — UNA MISURA DA GUARDARE
   (docs/sotterraneo/grafica-3d.md)
   perché: la scena 3D del sotterraneo a tre larghezze fino a 1861×1900: tela uguale al campo, dentro la colonna della barra, tocco sulla scala giusto, pixel dello sprite su un numero intero e combattenti sopra il pannello
   a parte perché: costa una scena accesa per larghezza e non sta nel giro (era una parte di integrazione/sotterraneo-discesa); sotterraneo-sopra-barra misura i pannelli sui globi, non la tela

   La tela si misura sul suo contenitore (il campo), mai sulla finestra: prima, a pixel ratio 1,5, era larga una volta e mezza
   il campo (la scena ingrandita e tagliata, a destra fuori dalla colonna sugli schermi larghi, e il dito fuori posto). A tre
   larghezze, fino a 1861 × 1900: la tela è il campo, sta nella colonna della barra, il tocco sulla scala prende la scala, e
   stringendo la finestra la tela la segue. Poi lo scontro da vicino a due telefoni: il pixel dello sprite su un numero intero di
   pixel del disegno (mai più di CAMERA.pixelMassimo) e tutti i combattenti in vista sopra il pannello. Costa una scena accesa per
   larghezza e la telecamera che arriva morbida: non sta nel giro dei test (era una parte di integrazione/sotterraneo-discesa).
   `node test/integrazione/sotterraneo-3d-larghezze-misura.test.mjs`
   tempo: 200
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, ditoDi } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { profiloDelSotterraneo, schermoDi, scendiColCheat } from '../aiuto/sotterraneo-discesa.mjs'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const { tocca } = await ditoDi(page)
await semina(page, profiloDelSotterraneo({ tappa: 1, avventura: {
  crescita: { v: 2, esp: sogliaDi(10), forza: 2, destrezza: 0, intelligenza: 0, tempra: 6, albero: {}, caselle: [null, null, null] } } }))
const g3d = () => page.evaluate(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica())

/* ---------- la scena sta nella colonna del gioco, a ogni larghezza, e il dito prende la cosa giusta ---------- */
for (const [w, h] of [[1100, 900], [1861, 1900], [390, 844]]) {
  await page.setViewportSize({ width: w, height: h })
  await scendiColCheat(page, 'sotterraneo=0&eroe=cavaliere&seme=11')
  await attendi(page, 1200)
  const misure = () => page.evaluate(() => {
    const c = document.querySelector('[data-tela="3d"]'), r = c.getBoundingClientRect(), p = c.parentElement.getBoundingClientRect()
    const b = document.querySelector('[data-barra-giu]').getBoundingClientRect()
    return { x: r.x, w: r.width, h: r.height, px: p.x, pw: p.width, ph: p.height, bx: b.x, bw: b.width }
  })
  let m = await misure()
  controlla(`${w}×${h}: la tela è il campo (x e larghezza)`, Math.abs(m.x - m.px) <= 1 && Math.abs(m.w - m.pw) <= 1 && Math.abs(m.h - m.ph) <= 1, JSON.stringify(m))
  controlla(`${w}×${h}: nella stessa colonna della barra`, Math.abs(m.x - m.bx) <= 1 && Math.abs(m.w - m.bw) <= 1, JSON.stringify(m))
  // la scala che sale: il tocco sulla sua figura apre il suo foglio (dal primo piano è «lascio perdere»)
  const su = await page.evaluate(() => { const r = window.__sotterraneo3d.corsa.livello.robe.find(q => q.che === 'scala-su'); return r && { x: r.x, y: r.y } })
  controlla(`${w}×${h}: c'è la scala che sale`, !!su)
  const pt = await schermoDi(page, su.x + 0.5, su.y + 0.5, 0.5)
  await tocca(pt.x, pt.y)
  await page.waitForSelector('[data-lascio-perdere], [data-azione="sali"]', { timeout: 8000 }).catch(() => {})
  uguale(`${w}×${h}: il tocco sulla scala prende la scala`, await page.locator('[data-lascio-perdere], [data-azione="sali"]').count() > 0, true)
  await attendi(page, 400)
  await page.locator('[data-azione="scorda-no"], [data-azione="dopo"]').first().click()
  // la finestra cambia (un telefono girato, una finestra stretta): la tela la segue
  await page.setViewportSize({ width: Math.round(w * 0.8), height: h })
  await attendi(page, 800)
  m = await misure()
  controlla(`${w}×${h} stretta: la tela segue il campo`, Math.abs(m.x - m.px) <= 1 && Math.abs(m.w - m.pw) <= 1, JSON.stringify(m))
  await scatto(page, `sotterraneo-3d-largo-${w}`)
}

/* ---------- lo scontro da vicino: tutti in vista e il pixel dello sprite netto ---------- */
for (const [w, h, n] of [[390, 844, 3], [360, 640, 6]]) {
  await page.setViewportSize({ width: w, height: h })
  await scendiColCheat(page, `sotterraneo=2&eroe=elfa&seme=7&stanza=sala&sotterraneo=branco&mostri=${n}&tipo=spirito-fuoco&dpr=1.5`, { pronto: false })
  await page.waitForSelector('[data-scontro-3d]', { timeout: 15000 })
  await attendi(page, 6500)   // i combattenti vanno ai loro posti e la telecamera ci arriva morbida
  const g = await g3d()
  dentro(`${w}×${h}: un pixel dello sprite è un numero intero di pixel`, Math.abs(g.pixelSprite - Math.round(g.pixelSprite)), 0, 0.2)
  dentro(`${w}×${h}: e non più di cinque`, g.pixelSprite, 1, 5.2)
  const fuori = await page.evaluate(() => {
    const c = document.querySelector('[data-tela="3d"]').getBoundingClientRect(), p = document.querySelector('[data-pannello3d]').getBoundingClientRect()
    return [...document.querySelectorAll('[data-scontro-3d] [data-mostro], [data-eroe-scontro]')].map(e => e.getBoundingClientRect())
      .filter(r => r.x + r.width / 2 < c.x || r.x + r.width / 2 > c.right || r.bottom < c.y || r.bottom > p.top).length
  })
  uguale(`${w}×${h}: con ${n} mostri tutti in vista sopra il pannello`, fuori, 0)
  nota(`${w}×${h}, ${n} mostri: un pixel dello sprite = ${g.pixelSprite} pixel, ${g.chiamate} chiamate`)
  await scatto(page, `sotterraneo-3d-vicino-${w}`)
}

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('la scena del sotterraneo a ogni larghezza (misura)')
