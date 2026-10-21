/* ═══════════════════════════════════════════════════════════════════
   LA VISTA DEL MONDO DI SOPRA COL DITO — docs/sotterraneo/mondo-3d-telecamera.md

   Come nella fattoria: un dito che oltre i 16 px scorre sposta la vista
   e l'eroe resta dov'è; due dita zoomano (e il pizzico non è un tocco);
   un tocco cammina; mandato l'eroe da qualche parte, o col tasto «torna
   all'eroe», la vista torna a seguirlo. Col mouse a tasto premuto lo
   stesso, e la rotella zooma. Si tocca come un telefono
   (`Input.dispatchTouchEvent`, id diversi per le dita).
   `node test/esegui.mjs sotterraneo-mondo-vista`
   tempo: 480
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scegli, scegliAvventura, mondoPronto, fermoNelMondo, attendi, scatto, toccaNelMondo } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { ilMondo, terraDelMondo, zonaDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
const dita = async (type, punti) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: punti.map(([x, y], id) => ({ x, y, id })) })
async function tocca(x, y) { await dita('touchStart', [[x, y]]); await attendi(page, 60); await dita('touchEnd', []) }
// un dito da (x0, y0) a (x1, y1) in `n` passi, poi si alza
async function trascina(x0, y0, x1, y1, n = 8) {
  await dita('touchStart', [[x0, y0]])
  for (let i = 1; i <= n; i++) { await dita('touchMove', [[x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]]); await attendi(page, 30) }
  await dita('touchEnd', [])
  await attendi(page, 150)
}
// due dita: dal centro (cx, cy) a distanza `d0` una dall'altra fino a `d1`, in orizzontale
async function pizzica(cx, cy, d0, d1, n = 8) {
  await dita('touchStart', [[cx - d0 / 2, cy], [cx + d0 / 2, cy]])
  for (let i = 1; i <= n; i++) { const d = d0 + (d1 - d0) * i / n; await dita('touchMove', [[cx - d / 2, cy], [cx + d / 2, cy]]); await attendi(page, 30) }
  await dita('touchEnd', [])
  await attendi(page, 200)
}
const cam = () => page.evaluate(() => { const c = window.__sotterraneo3d.cam; return { libera: c.libera.on, lx: c.libera.x, lz: c.libera.z, x: c.camera.position.x, z: c.camera.position.z, zoom: c.zoom, larghi: c.celleInLargo, lim: c.limitiZoom } })
// un punto del campo che non sta sotto una carta o un fumetto (lì il dito non sposta la vista): lungo la riga `y`, il più vicino a `x`
const puntoLibero = (x, y) => page.evaluate(([x0, y0]) => {
  for (let d = 0; d < 400; d += 10) for (const x1 of [x0 + d, x0 - d]) {
    const e = document.elementFromPoint(x1, y0)
    if (e && !e.closest('.sot-terra-sopra > *, .sot-terra-sotto > *, [data-fumetto], .sot-foglio, [data-torna-eroe]')) return x1
  }
  return x0
}, [x, y])
const cella = async () => (await page.locator('[data-eroe-mondo]').getAttribute('data-cella')).split(',').map(Number)

/* ---------- 1. si entra, la vista segue l'eroe ---------- */
await azzera(page)
await semina(page, { settings: { sperimentali: true } })
await scegli(page, 'sotterraneo3d')
await scegliAvventura(page, 'cavaliere')
await mondoPronto(page)
await attendi(page, 2500)
const b = await page.locator('[data-mondo3d]').boundingBox()
const cx = b.x + b.width / 2, cy = b.y + b.height * 0.55
let c0 = await cam()
controlla('di norma la vista segue l\'eroe', !c0.libera)
controlla('e non c\'è il tasto «torna all\'eroe»', await page.locator('[data-torna-eroe]').count() === 0)
nota(`schermo ${Math.round(b.width)}×${Math.round(b.height)}: ${c0.larghi.toFixed(1)} celle in largo a zoom ${c0.zoom}, limiti ${c0.lim.min}–${c0.lim.max.toFixed(2)}`)
dentro('a zoom 1 si vedono almeno 15 celle in largo', c0.larghi, 15, 30)
await scatto(page, 'sotterraneo-mondo-vista-normale')

/* ---------- 2. un dito che scorre sposta la vista, l'eroe resta fermo ---------- */
const eroe0 = await cella()
{ const x = await puntoLibero(cx + 80, cy); await trascina(x, cy, x - 160, cy) }
await attendi(page, 600)
{
  const c = await cam()
  controlla('la vista si è staccata', c.libera)
  controlla('e si è spostata verso destra (il dito è andato a sinistra)', c.x - c0.x > 3, `${c0.x.toFixed(1)} → ${c.x.toFixed(1)}`)
  uguale('l\'eroe è rimasto dov\'era', (await cella()).join(), eroe0.join())
  uguale('e non cammina', await page.locator('[data-eroe-mondo]').getAttribute('data-cammina'), '0')
  await page.waitForSelector('[data-torna-eroe]', { timeout: 5000 })
  controlla('compare «torna all\'eroe»', true)
  await scatto(page, 'sotterraneo-mondo-vista-trascinata')
}

/* ---------- 3. un tocco nella vista spostata: l'eroe cammina e la vista lo riprende ---------- */
{
  const terra = terraDelMondo(ilMondo())
  // un prato a qualche passo, lontano da chi sta fermo (vicino a una persona o alla bacheca il tocco è un'altra cosa)
  const gente = await page.evaluate(() => window.__mondo3d.bersagli().map(q => q.accanto))
  const io = await page.evaluate(() => window.__mondo3d.io)
  let meta = null, voto = 0   // il prato più lontano da chi sta fermo, fra quelli a 3–6 passi che si vedono nel campo
  for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) {
    const c = { x: Math.floor(io.x) + dx, y: Math.floor(io.z) + dz }, r = Math.hypot(dx, dz)
    if (r < 3 || r > 6 || !terra.passa(c.x, c.y)) continue
    const d = Math.min(...gente.map(g => Math.hypot(g.x - c.x, g.y - c.y)))
    if (d > voto) { voto = d; meta = c }
  }
  controlla('c\'è un prato lontano da tutti (almeno 2 passi)', voto >= 2, String(voto))
  const p = await page.evaluate(([x, z]) => { const s = window.__sotterraneo3d; const q = s.aSchermo(x + 0.5, s.quota(x + 0.5, z + 0.5), z + 0.5); return [q.x, q.y] }, [meta.x, meta.y])
  await tocca(b.x + p[0], b.y + p[1])
  await attendi(page, 400)
  controlla('toccando il prato la vista torna a seguire l\'eroe', !(await cam()).libera)
  await fermoNelMondo(page)
  const e1 = await cella()
  controlla('e l\'eroe ha camminato', Math.hypot(e1[0] - eroe0[0], e1[1] - eroe0[1]) >= 1, `${eroe0} → ${e1}`)
  void terra
}

/* ---------- 4. «torna all'eroe» ---------- */
// verso est, e se il bordo del mondo lo impedisce verso ovest
for (const verso of [-1, 1]) {
  const x = await puntoLibero(cx - verso * 90, cy)
  await trascina(x, cy, x + verso * 180, cy)
  if (await page.locator('[data-torna-eroe]').count()) break
}
await page.waitForSelector('[data-torna-eroe]', { timeout: 5000 })
controlla('di nuovo staccata', (await cam()).libera)
const eroe1 = await cella()
await page.click('[data-torna-eroe]')
await attendi(page, 600)
controlla('il tasto riporta la vista all\'eroe', !(await cam()).libera)
controlla('e sparisce', await page.locator('[data-torna-eroe]').count() === 0)
uguale('senza muovere l\'eroe', (await cella()).join(), eroe1.join())

/* ---------- 5. il pizzico zooma, e non è un tocco ---------- */
{
  const prima = await cam()
  await pizzica(cx, cy, 240, 120)   // le dita si avvicinano: la telecamera si allontana
  const lontano = await cam()
  controlla('avvicinando le dita si allontana', lontano.zoom > prima.zoom + 0.1, `${prima.zoom} → ${lontano.zoom}`)
  controlla('e si vedono più celle', lontano.larghi > prima.larghi + 1, `${prima.larghi.toFixed(1)} → ${lontano.larghi.toFixed(1)}`)
  dentro('ma al più 28 in largo', lontano.larghi, 1, 28.5)
  uguale('il pizzico non ha fatto camminare l\'eroe', (await cella()).join(), eroe1.join())
  controlla('né staccato la vista', !lontano.libera)
  await pizzica(cx, cy, 80, 600)    // si allargano molto: ci si avvicina fino al minimo
  const vicino = await cam()
  controlla('allargando le dita ci si avvicina', vicino.zoom < lontano.zoom)
  uguale('e si ferma al minimo', vicino.zoom, vicino.lim.min)
  await pizzica(cx, cy, 300, 20)    // e al massimo
  const max = await cam()
  uguale('stringendo molto si ferma al massimo', max.zoom, max.lim.max)
  dentro('con al più ~28 celle in largo', max.larghi, 15, 29)
  await attendi(page, 800)
  await scatto(page, 'sotterraneo-mondo-vista-zoom-massimo')
  // lo zoom si ricorda finché si resta nel mondo: un tocco e una camminata non lo cambiano
  await page.evaluate(() => { window.__sotterraneo3d.zoom = 1.1 })
  await attendi(page, 300)
  uguale('lo zoom resta dov\'è', (await cam()).zoom, 1.1)
}

/* ---------- 6. col mouse: a tasto premuto si trascina, la rotella zooma ---------- */
{
  const prima = await cam()
  const mx = await puntoLibero(cx + 60, cy)
  await page.mouse.move(mx, cy)
  await page.mouse.down()
  for (let i = 1; i <= 8; i++) { await page.mouse.move(mx - i * 15, cy + i * 4); await attendi(page, 30) }
  await page.mouse.up()
  await attendi(page, 500)
  const dopo = await cam()
  controlla('il mouse a tasto premuto sposta la vista', dopo.libera && Math.hypot(dopo.x - prima.x, dopo.z - prima.z) > 2, `${prima.x.toFixed(1)},${prima.z.toFixed(1)} → ${dopo.x.toFixed(1)},${dopo.z.toFixed(1)}`)
  await page.mouse.move(cx + 100, cy - 60)   // senza tasto premuto no
  await attendi(page, 300)
  const fermo = await cam()
  controlla('senza tasto non sposta nulla', Math.abs(fermo.x - dopo.x) < 0.2 && Math.abs(fermo.z - dopo.z) < 0.2)
  await page.mouse.wheel(0, 300)
  await attendi(page, 300)
  controlla('la rotella zooma', (await cam()).zoom > 1.1, `${(await cam()).zoom}`)
  await page.click('[data-torna-eroe]')
  await attendi(page, 400)
}

/* ---------- 7. la vista lontana dall'eroe: le zone dell'eroe restano, e quelle di dove si guarda si caricano ---------- */
{
  const m = ilMondo()
  const zonaEroe = await page.evaluate(() => { const io = window.__mondo3d.io, m = window.__mondo3d.m; return window.__mondo3d.m.zonaCaricata.map((c, k) => c ? k : -1).filter(k => k >= 0) })
  const prima = await page.evaluate(() => window.__sotterraneo3d.grafica().pezzi)
  // lontano quanto si può: 40 celle in una direzione, a pezzi: ogni giro del dito sposta di un pezzo di schermo
  { const x = await puntoLibero(cx + 140, cy); for (let i = 0; i < 4; i++) await trascina(x, cy, x - 280, cy, 6) }
  await attendi(page, 2500)
  const c = await cam()
  const eroe = await page.evaluate(() => ({ x: window.__mondo3d.io.x, z: window.__mondo3d.io.z }))
  dentro('la vista è a non più di 40 celle dall\'eroe', Math.hypot(c.lx - eroe.x, c.lz - eroe.z), 0, 40.5)
  const dopo = await page.evaluate(() => ({ zone: window.__mondo3d.m.zonaCaricata.map((v, k) => v ? k : -1).filter(k => k >= 0), pezzi: window.__sotterraneo3d.grafica().pezzi, chiamate: window.__sotterraneo3d.grafica().chiamate }))
  const kEroe = zonaDi(m, Math.floor(eroe.x), Math.floor(eroe.z))
  controlla('la zona dell\'eroe resta caricata', dopo.zone.includes(kEroe), `eroe ${kEroe}, caricate ${dopo.zone}`)
  controlla('i pezzi attorno a dove si guarda si costruiscono', dopo.pezzi.some(p => !prima.includes(p)), `${prima} → ${dopo.pezzi}`)
  dentro('niente più di 12 pezzi', dopo.pezzi.length, 1, 12)
  dentro('sotto le 150 chiamate', dopo.chiamate, 10, 150)
  nota(`vista spostata: ${dopo.pezzi.length} pezzi, ${dopo.chiamate} chiamate, zone ${dopo.zone} (eroe nella ${kEroe}) (zone di prima ${zonaEroe})`)
  await scatto(page, 'sotterraneo-mondo-vista-lontana')
  uguale('l\'eroe non si è mosso', (await cella()).join(), eroe1.join())
  await page.click('[data-torna-eroe]')
  await attendi(page, 500)
}

/* ---------- 8. un tocco su una persona resta un tocco: l'eroe va da lei e la vista lo segue ---------- */
{
  await toccaNelMondo(page, '[data-personaggio="ragazza"]', { tocca })   // porta la vista da lei, poi la tocca
  await page.waitForFunction(() => document.querySelector('[data-eroe-mondo]')?.dataset.cammina === '1' || document.querySelector('[data-dialogo], [data-fumetto]'), null, { timeout: 8000 })
  controlla('un tocco sulla ragazza fa agire l\'eroe (cammina, o parla se è già lì)', true)
  const segue = await page.waitForFunction(() => !window.__sotterraneo3d.cam.libera.on, null, { timeout: 15000 }).then(() => true, () => false)
  controlla('e la vista lo segue', segue)
}

controlla('nessun errore', errori.length === 0, errori.join(' | '))
await browser.close()
riassunto('la vista del mondo di sopra col dito')
