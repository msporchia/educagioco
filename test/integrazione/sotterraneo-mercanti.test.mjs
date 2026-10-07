/* ═══════════════════════════════════════════════════════════════════
   I MERCANTI DI SOPRA, COL DITO VERO

   La roba resta fra una discesa e l'altra, e il mercante è uscito dalle
   discese: tre botteghe sulla terra di sopra (docs/sotterraneo/
   terra-di-sopra.md). Qui il giro intero col dito: toccare un mercante e
   vedere l'eroe andarci e il banco aprirsi, comprare, vendere al
   rigattiere, scendere con la roba comprata, risalire e ritrovarla, e
   alla discesa dopo ritrovarla nello zaino.

   I tocchi sono tocchi (`Input.dispatchTouchEvent` via CDP): il click che
   il dito si lascia dietro è quello che apre il banco, e un
   `page.click()` non lo porterebbe.
   `node test/esegui.mjs sotterraneo-mercanti`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, scendiNelSotterraneo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { MERCANTI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* la nebbia già tolta (384 cifre esadecimali, un bit per cella): i mercanti
   si trovano camminando, e camminare la mappa lo prova `integrazione/
   sotterraneo-terra`. Nello zaino un'ascia da vendere, e le gemme */
const roba = { v: 1, gemme: 60, zaino: ['ascia'], mano: null, mancina: null, corpo: null, dito: null,
               torcia: 0, torce: 0 }
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {},
    cfg: { eroe: 'cavaliere', roba, terra: { nebbia: 'f'.repeat(384), dove: [17, 41], parlato: true } } } },
})
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 500)

const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const cella = () => page.locator('[data-eroe-terra]').getAttribute('data-cella')
const gemme = async () => Number((await page.locator('[data-roba-sopra]').innerText()).match(/💎 (\d+)/)[1])
async function alBanco(chi) {
  // il mercante può stare fuori dallo schermo: si cammina verso di lui finché non si vede, poi lo si tocca.
  // Un tocco verso di lui può già prenderlo (e il banco si apre all'arrivo): allora basta così, o il tocco
  // dopo cadrebbe sul banco aperto e comprerebbe la riga che ci sta sotto
  const aperto = async () => (await page.locator('[data-chiudi]').count()) > 0
  for (let giro = 0; giro < 8 && !(await aperto()); giro++) {
    const v = await page.locator('[data-terra]').boundingBox()
    const b = await page.locator(`[data-mercante="${chi}"]`).boundingBox()
    const x = b.x + b.width / 2, y = b.y + b.height / 2
    const dentro = x > v.x + 20 && x < v.x + v.width - 20 && y > v.y + 140 && y < v.y + v.height - 120
    if (dentro) await toccaIl(`[data-mercante="${chi}"]`)
    else await tocca(Math.max(v.x + 30, Math.min(v.x + v.width - 30, x)), Math.max(v.y + 160, Math.min(v.y + v.height - 140, y)))
    await page.waitForFunction(() => document.querySelector('[data-eroe-terra]')?.dataset.cammina === '0',
                               null, { timeout: 15000 })
    await attendi(page, 200)
  }
  await page.waitForSelector('[data-chiudi]', { timeout: 10000 })
  await attendi(page, 250)
}

async function chiudiBanco() {
  await toccaIl('[data-chiudi]')
  await page.waitForSelector('[data-chiudi]', { state: 'detached', timeout: 3000 })
}

/* ---------- 1. i mercanti stanno sulla mappa ---------- */
uguale('sulla terra di sopra ci sono tre mercanti', await page.locator('[data-mercante]').count(), 3)
controlla('e la carta di chi scende dice le gemme', (await gemme()) === 60, String(await gemme()))
await scatto(page, 'mercanti-mappa-erborista')

/* ---------- 2. l'erborista: ci si va, e si compra ---------- */
await alBanco('erborista')
{
  const [x, y] = (await cella()).split(',').map(Number)
  uguale('l\'eroe si è fermato accanto all\'erborista', `${x},${y}`, MERCANTI.erborista.accanto.join(','))
}
controlla('il banco ha le pozioni', await page.locator('[data-merce="pozione"]').count() === 1)
controlla('e chi compra la roba lo dice', (await page.locator('[data-chi-compra]').innerText()).includes('rigattiere'))
await toccaIl('[data-merce="pozione"]')
await attendi(page, 300)
controlla('comprata, il banco lo dice', (await page.locator('[data-detto-banco]').innerText()).includes('Pozione'))
await scatto(page, 'mercanti-banco-erborista')
await chiudiBanco()
uguale('e le gemme sono scese del suo prezzo', await gemme(), 60 - COSE.pozione.prezzo)

/* ---------- 3. il rigattiere: si vende ---------- */
await alBanco('rigattiere')
await scatto(page, 'mercanti-banco-rigattiere')
controlla('il rigattiere mostra le tasche', await page.locator('[data-vendo="ascia"]').count() === 1)
await toccaIl('[data-vendo="ascia"]')
await attendi(page, 300)
uguale('venduta, l\'ascia non c\'è più', await page.locator('[data-vendo="ascia"]:visible').count(), 0)
await chiudiBanco()
const dopo = 60 - COSE.pozione.prezzo + COSE.ascia.prezzo / 2
uguale('e le gemme sono salite di metà del suo prezzo', await gemme(), dopo)
await scatto(page, 'mercanti-mappa-rigattiere')

/* ---------- 4. l'armaiolo si vede anche lui ---------- */
await alBanco('armaiolo')
controlla('l\'armaiolo ha il suo banco', await page.locator('[data-merce]').count() >= 3)
uguale('e non compra: dice chi lo fa', await page.locator('[data-chi-compra]').count(), 1)
await chiudiBanco()
await scatto(page, 'mercanti-mappa-armaiolo')

/* ---------- 5. si scende con la roba comprata ---------- */
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 500)
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('.sot-centrale', { timeout: 3000 })
uguale('nello zaino c\'è la pozione comprata sopra', await page.locator('[data-tasca][data-cosa="pozione"]').count(), 1)
await page.locator('[data-azione="chiudi"]').click()
await attendi(page, 200)

/* ---------- 6. si risale, e la roba è ancora lì ---------- */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 400)
const p = await leggiProfilo(page)
const su = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.roba
controlla('la roba è nel profilo, nell\'avventura del cavaliere', !!su && su.zaino.includes('pozione'), JSON.stringify(su))
uguale('con le gemme di prima', su && su.gemme, dopo)
await page.locator('[data-azione="scorda"]').click()
await attendi(page, 300)
uguale('lasciata perdere la discesa, la roba resta', await gemme(), dopo)

/* ---------- 7. e alla discesa dopo si ritrova ---------- */
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 500)
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('.sot-centrale', { timeout: 3000 })
uguale('la discesa dopo ritrova la pozione', await page.locator('[data-tasca][data-cosa="pozione"]').count(), 1)
await attendi(page, 400)   // il foglio entra con un'animazione: la foto la aspetta
await scatto(page, 'mercanti-zaino-ritrovato')

uguale('nessun errore in console', errori.join(' · '), '')
nota(`gemme: 60 → ${60 - COSE.pozione.prezzo} (pozione) → ${dopo} (ascia venduta)`)
await browser.close()
riassunto('i mercanti di sopra col dito')
