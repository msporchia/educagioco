/* ═══════════════════════════════════════════════════════════════════
   LA TERRA DI SOPRA, COL DITO VERO

   Le discese del sotterraneo stanno su una mappa da girare a piedi
   (docs/sotterraneo/terra-di-sopra.md). Che da casa si arrivi a ogni
   posto lo dice `unita/sotterraneo-terra`; qui si prova quello che si
   vede solo con un dito: che un tocco sul prato porti l'eroe lì, che una
   strisciata non lo muova, che la vista scorra morbida quando lui arriva
   al bordo, che il fumetto si apra sulla discesa e che una chiusa non
   faccia scendere, che il minatore parli, e che la nebbia si ricordi
   uscendo e rientrando.

   I tocchi sono tocchi (`Input.dispatchTouchEvent` via CDP): il click che
   il dito si lascia dietro è proprio quello che apre il fumetto, e un
   `page.click()` non lo porterebbe.
   `node test/esegui.mjs sotterraneo-terra`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { CELLA, POSTI, MINATORE, MASCHERA } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { SCALA_TERRA as S } from '../../src/giochi/sotterraneo/dati/terra.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 300, settings: { sperimentali: true } })
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-eroe="cavaliere"]', { timeout: 5000 })
await page.click('[data-eroe="cavaliere"]')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 500)

const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  const b = await page.locator(sel).boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const cella = () => page.locator('[data-eroe-terra]').getAttribute('data-cella')
const camera = async () => (await page.locator('[data-terra]').getAttribute('data-camera')).split(',').map(Number)
async function fermo() {
  await page.waitForFunction(() => document.querySelector('[data-eroe-terra]')?.dataset.cammina === '0',
                             null, { timeout: 15000 })
  await attendi(page, 200)
}
const vista = await page.locator('[data-terra]').boundingBox()
// un tocco sul prato lontano dal fumetto: lo chiude e basta
async function chiudiFumetto() {
  const f = await page.locator('[data-fumetto]').boundingBox()
  if (!f) return
  const y = f.y > vista.y + vista.height / 2 ? f.y - 40 : f.y + f.height + 40
  await tocca(vista.x + 30, y)          // sul bordo: in mezzo c'è il posto che l'ha aperto
  await attendi(page, 250)
}
// dove sta sullo schermo il centro di una cella della maschera, con la vista di adesso
async function schermoDi(x, y) {
  const [cx, cy] = await camera()
  return [vista.x + ((x + 0.5) * CELLA - cx) * S, vista.y + ((y + 0.5) * CELLA - cy) * S]
}

/* ---------- 1. si parte da casa, con la vista sull'eroe ---------- */
const casa = await cella()
uguale('si parte fra le case', casa, '17,41')
const eroe = await page.locator('[data-eroe-terra] .sot-ritratto').boundingBox()
controlla('e l\'eroe si vede, dentro lo schermo', eroe && eroe.y > vista.y && eroe.y + eroe.height < vista.y + vista.height,
          JSON.stringify(eroe))
controlla('grande quanto una cella della mappa', Math.abs(eroe.width - 64 * S) < 2, `${eroe.width} px`)
uguale('la prima volta si dice cosa fare', await page.locator('.sot-terra-sotto').innerText().then(t => t.includes('Tocca dove')), true)
await scatto(page, 'terra-avvio')

/* ---------- 2. una strisciata non cammina ---------- */
const [sx, sy] = await schermoDi(17, 36)
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] })
for (let i = 1; i <= 4; i++) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx + 18 * i, y: sy }] })
  await attendi(page, 20)
}
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
await attendi(page, 400)
uguale('strisciando col dito l\'eroe resta dov\'è', await cella(), casa)

/* ---------- 3. il minatore parla ---------- */
uguale('il minatore ha qualcosa da dire', await page.locator('[data-minatore] .sot-tre-punti').count(), 1)
await toccaIl('[data-minatore]')
await page.waitForSelector('[data-fumetto-di="minatore"]', { timeout: 8000 })
const detto = await page.locator('[data-detto]').innerText()
controlla('il minatore dice dove sta la prossima discesa', detto.includes('La scalinata antica') && detto.includes('arco'), detto)
controlla('e di seguire i sassi', detto.includes('sassi'))
{
  const [x, y] = (await cella()).split(',').map(Number)
  controlla('gli si parla da accanto, non addosso', Math.abs(x - MINATORE.piede[0]) >= 2 && Math.abs(y - MINATORE.piede[1]) <= 1,
            `${x},${y}`)
}
controlla('lungo la strada ci sono i sassi che luccicano', await page.locator('[data-sasso]').count() >= 3)
await attendi(page, 300)
await scatto(page, 'terra-minatore')

/* ---------- 4. una discesa chiusa non fa scendere ---------- */
const davanti = await cella()
await tocca(vista.x + vista.width - 40, vista.y + vista.height - 160)
await attendi(page, 300)
uguale('toccando fuori il fumetto si chiude', await page.locator('[data-fumetto]').count(), 0)
uguale('e basta: quel tocco non fa camminare', await cella(), davanti)
await toccaIl('[data-posto="pozzo-di-casa"]')
await page.waitForSelector('[data-fumetto-di="pozzo-di-casa"]', { timeout: 8000 })
const chiusa = await page.locator('[data-chiusa-perche]').innerText()
controlla('la chiusa dice cosa la apre', chiusa.includes('la scalinata antica'), chiusa)
uguale('e non ha il tasto per scendere', await page.locator('[data-fumetto] [data-azione="scendi"]').count(), 0)
controlla('sopra c\'è il velo col lucchetto', await page.locator('[data-chiusa="pozzo-di-casa"] svg').count() === 1)
await attendi(page, 300)
await scatto(page, 'terra-chiusa')
await chiudiFumetto()
await attendi(page, 200)

/* ---------- 5. un tocco sul prato, e l'eroe ci va ---------- */
const meta = [14, 35]
controlla('la meta è prato', MASCHERA[meta[1]][meta[0]] === '.')
const prima = await cella()
await tocca(...await schermoDi(...meta))
await attendi(page, 250)
uguale('l\'eroe si mette in cammino', await page.locator('[data-eroe-terra]').getAttribute('data-cammina'), '1')
await fermo()
uguale('e arriva dove si è toccato', await cella(), meta.join(','))
controlla('partendo da dove era', prima !== meta.join(','))

/* ---------- 6. la vista scorre quando l'eroe arriva al bordo, morbida ---------- */
const [, prima_y] = await camera()
// in cima allo spazio libero, sotto la fascia di sopra: più su della metà, la vista deve seguirlo
const su = (await page.locator('.sot-terra-sopra').boundingBox())?.height || 0
await tocca(vista.x + vista.width / 2, vista.y + su + 30)
const passi = []
for (let i = 0; i < 40; i++) {
  passi.push((await camera())[1])
  if (i === 6) await scatto(page, 'terra-cammina')
  await attendi(page, 50)
}
await fermo()
const [, dopo_y] = await camera()
controlla('la vista è salita con lui', dopo_y < prima_y - 60, `${prima_y} → ${dopo_y}`)
const salti = passi.slice(1).map((v, i) => Math.abs(v - passi[i]))
controlla('a passi piccoli, non a scatti', Math.max(...salti) < 40 && new Set(passi).size > 8,
          `salto massimo ${Math.max(...salti)}, ${new Set(passi).size} posizioni`)
await scatto(page, 'terra-scorre')

/* ---------- 7. si arriva alla scalinata, e il fumetto la apre ---------- */
const cantine = page.locator('[data-discesa="0"]')
for (let giro = 0; giro < 10; giro++) {
  const b = await cantine.boundingBox()
  const x = b.x + b.width / 2, y = b.y + b.height / 2
  if (await cantine.getAttribute('data-trovato') === '1' && y > vista.y + su + 30 && y < vista.y + vista.height - 90) break
  await tocca(Math.max(vista.x + 30, Math.min(vista.x + vista.width - 30, x)), vista.y + su + 40)
  await fermo()
}
uguale('la scalinata si è trovata camminando', await cantine.getAttribute('data-trovato'), '1')
await toccaIl('[data-discesa="0"]')
await page.waitForSelector('[data-fumetto-di="arco"] [data-azione="scendi"]', { timeout: 10000 })
uguale('l\'eroe si ferma ai piedi della scala', await cella(), POSTI.arco.piede.join(','))
const fum = await page.locator('[data-fumetto]').innerText()
controlla('il fumetto dice nome, dritta e piani', fum.includes('La scalinata antica') && fum.includes('si impara la strada')
          && fum.includes('2 piani'), fum)
// niente targhette con disegnini sopra le discese: un pallino per terra davanti a quelle trovate e aperte
uguale('sopra le discese non ci sono icone', await page.locator('[data-posto] .em').count(), 0)
uguale('la discesa trovata ha il suo pallino', await page.locator(`[data-pallino="${await cantine.getAttribute('data-posto')}"]`).count(), 1)
controlla('e il fumetto non ha l\'icona della discesa', !fum.includes('🕯'), fum)
// il tocco che ha aperto il fumetto non lo preme anche: il click arriva una volta sola
await toccaIl('[data-discesa="0"]')
await attendi(page, 500)
uguale('toccando di nuovo la discesa non si scende da soli', await page.locator('.sot-tela').count(), 0)
await scatto(page, 'terra-aperta')

/* ---------- 8. la nebbia si ricorda, uscendo e rientrando ---------- */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte', { timeout: 5000 })
await attendi(page, 600)
const p = await leggiProfilo(page)
const terra = p?.campagne?.sotterraneo?.cfg?.terra
controlla('la terra si scrive nel profilo, sotto la campagna', !!terra && typeof terra.nebbia === 'string',
          JSON.stringify(terra)?.slice(0, 80))
controlla('e il minatore ha già parlato', terra?.parlato === true)
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 500)
uguale('rientrando si è dove ci si era fermati', await cella(), POSTI.arco.piede.join(','))
uguale('la scalinata resta trovata', await page.locator('[data-discesa="0"]').getAttribute('data-trovato'), '1')
uguale('e il minatore non ha più i puntini', await page.locator('[data-minatore] .sot-tre-punti').count(), 0)
await scatto(page, 'terra-nebbia')

/* ---------- 9. e si scende ---------- */
await toccaIl('[data-discesa="0"]')
await page.waitForSelector('[data-fumetto] [data-azione="scendi"]', { timeout: 10000 })
await page.locator('[data-fumetto] [data-azione="scendi"]').click()
await page.waitForSelector('.sot-tela', { timeout: 5000 })
controlla('«scendo» comincia la discesa', (await page.locator('.sot-piede').textContent()).includes('piano 1'))

uguale('nessun errore in console', errori.join(' · '), '')
nota(`la vista è salita di ${Math.round(prima_y - dopo_y)} px della mappa in ${new Set(passi).size} passi`)
await browser.close()
riassunto('la terra di sopra col dito')
