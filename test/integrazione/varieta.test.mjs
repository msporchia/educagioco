/* ═══════════════════════════════════════════════════════════════════
   LA VARIETÀ A MONETE — col dito, dalla home al cartello di fine

   I conti stanno in `unita/varieta`. Qui si prova quello che solo il
   gioco costruito può dire: che il registro delle sessioni arrivi fino
   alla carta in home, che la pagina dei grandi scriva davvero nel
   profilo, e che dentro un gioco il premio cali — con la scritta
   piccola che lo dice senza fermare la partita.

   Il registro si semina come lo scriverebbe l'app (`sessioni:<id>`,
   fuori dal profilo), con partite finte di oggi: aspettare venti minuti
   veri non è una prova, è una pausa pranzo.

   `node test/esegui.mjs varieta`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi, scatto, semina, leggiProfilo,
         GIOCATORE, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const MIN = 60
/* un minuto fa: una partita di oggi anche a mezzanotte e mezza */
const registro = voci => page.evaluate(([chi, voci]) => new Promise((ok, ko) => {
  const r = indexedDB.open('giochi-bambini', 1)
  r.onerror = () => ko(new Error('IndexedDB non si apre'))
  r.onsuccess = () => {
    const tx = r.result.transaction('kv', 'readwrite')
    tx.objectStore('kv').put({ voci: voci.map(v => ({ ...v, t: Date.now() - 60000 })) },
                             'sessioni:' + chi)
    tx.oncomplete = ok
    tx.onerror = () => ko(new Error('scrittura fallita'))
  }
}), [GIOCATORE, voci])

await registro([
  { g: 'survivors', s: 25 * MIN },   // a metà
  { g: 'sotterraneo', s: 45 * MIN },     // finite
  { g: 'conta', s: 25 * MIN },       // a metà: è il gioco che si gioca sotto
])
/* conta tenuto in casa contro l'età, e gli asteroidi consigliati */
await semina(page, { settings: { giochi: { conta: true }, sa: {},
                                 varieta: { consigliati: { mate: true } } } })
await attendi(page, 400)

/* ── 1. la home ── */
const salvadanaio = k => page.locator(`.carta.gioco[data-gioco="${k}"] [data-salvadanaio]`)
const segno = async k => (await salvadanaio(k).count()) ? salvadanaio(k).getAttribute('data-salvadanaio') : null
uguale('Survivors, 25 minuti oggi: salvadanaio a metà', await segno('survivors'), 'meta')
uguale('il sotterraneo, 45 minuti: vuoto', await segno('sotterraneo'), 'vuoto')
uguale('gli asteroidi consigliati: ×2', await segno('mate'), 'doppio')
controlla('e la carta lo scrive', (await salvadanaio('mate').innerText()).includes('🪙×2'))
controlla('Survivors dice quanto resta a metà',
          /a metà · ancora 15′/.test(await salvadanaio('survivors').innerText()),
          await salvadanaio('survivors').innerText())
uguale('un gioco non ancora aperto oggi non dice niente', await segno('codice'), null)
uguale('la fattoria non paga, e non ha salvadanaio', await segno('fattoria'), null)
await scatto(page, 'varieta-home')

/* ── 2. i grandi ── */
await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.waitForSelector('.schede', { timeout: 5000 })
await page.click('.schede button[data-scheda="giochi"]')
await page.waitForSelector('[data-varieta]', { timeout: 5000 })

uguale('la riga Oggi dice che il sotterraneo è finito',
       await page.locator('[data-varieta-oggi="sotterraneo"]').getAttribute('data-fase'), 'vuoto')
controlla('con i minuti', (await page.locator('[data-varieta-oggi="sotterraneo"]').innerText()).includes('45′'))
await page.click('[data-varieta-oggi="sotterraneo"] [data-azione="ridai-tempo"]')
await attendi(page, 200)
uguale('«Ridai tempo» lo riporta pieno',
       await page.locator('[data-varieta-oggi="sotterraneo"]').getAttribute('data-fase'), 'pieno')
uguale('e il tasto sparisce',
       await page.locator('[data-varieta-oggi="sotterraneo"] [data-azione="ridai-tempo"]').count(), 0)

await page.click('[data-varieta-soglia="pieno"] [data-varieta-passo="su"]')
controlla('la soglia sale di cinque minuti',
          (await page.locator('[data-varieta-soglia="pieno"] b').innerText()).includes('25'))
await page.click('[data-varieta-gioco="survivors"] [data-tetto="libero"]')
await page.click('[data-consiglia="inglese"]')
await page.click('[data-flag="dormienti"]')
await attendi(page, 500)
await scatto(page, 'varieta-grandi')

const p = await leggiProfilo(page)
const v = p?.settings?.varieta || {}
uguale('nel profilo: la soglia nuova', v.pieno, 25)
uguale('Survivors senza tetto', v.giochi?.survivors, 'libero')
uguale('English consigliato', v.consigliati?.inglese, true)
uguale('i dormienti accesi', v.dormienti, true)
controlla('e il tempo ridato al sotterraneo', (v.ridato?.s?.sotterraneo || 0) >= 45 * MIN, JSON.stringify(v.ridato))
/* i dormienti accesi non devono accendere tutto: questo bambino gioca da oggi */

await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte .carta.gioco', { timeout: 5000 })
await attendi(page, 300)
uguale('in home, Survivors senza tetto non ha più salvadanaio', await segno('survivors'), null)
uguale('il sotterraneo, ridato, non dice niente (è pieno come stamattina)', await segno('sotterraneo'), null)
uguale('English consigliato ha il suo ×2', await segno('inglese'), 'doppio')

/* ── 3. un gioco che paga: Conta, a metà ── */
const monete = async () => (await leggiProfilo(page))?.coins || 0
await attendi(page, 500)
const prima = await monete()
await scegli(page, 'conta')
await page.waitForSelector('.ct-tappa[data-tappa="0"]', { timeout: 5000 })
await page.waitForSelector('[data-varieta-avviso]', { timeout: 5000 })
controlla('entrando a metà, la scritta piccola lo dice',
          (await page.locator('[data-varieta-avviso]').innerText()).includes('metà'))
uguale('senza velo e senza pausa: il dito ci passa attraverso',
       await page.locator('[data-varieta-avviso]').evaluate(e => getComputedStyle(e).pointerEvents), 'none')

await page.click('.ct-tappa[data-tappa="0"]')
for (let n = 0; n < 8; n++) {
  if (await page.locator('.ct-velo').count()) break
  await page.waitForSelector('.ct-cifra:not([disabled])', { timeout: 8000 })
  const quanti = await page.locator('.ct-gettone').count()
  const giusta = page.locator('.ct-cifra', { hasText: new RegExp(`^${quanti}$`) })
  if (await giusta.count()) await giusta.first().click()
  else await page.locator('.ct-cifra').first().click()
  await attendi(page, 700)
}
await page.waitForSelector('.ct-velo', { timeout: 8000 })
const nota1 = page.locator('[data-nota-monete]')
controlla('il cartello di fine dice il premio ridotto', await nota1.count() === 1)
const frase = (await nota1.count()) ? await nota1.innerText() : ''
nota('cartello:', frase)
controlla('4 → 2, e perché', /4 → 2/.test(frase) && frase.includes('stanco'), frase)
await scatto(page, 'varieta-fine-tappa')
/* Il salvadanaio non si confronta coi numeri esatti: la prima tappa
   accende anche un traguardo, che paga per conto suo e non passa dalla
   varietà (non lo dà un gioco). Che il filtro tolga davvero lo prova
   `unita/varieta`; qui basta che la tappa sia stata pagata e contata. */
await attendi(page, 500)
const entrate = (await monete()) - prima
nota('entrate', entrate, '🪙 (premio ridotto più l\'eventuale traguardo)')
controlla('le monete della tappa sono arrivate', entrate >= 2, String(entrate))
uguale('e le quattro risposte contate', (await leggiProfilo(page))?.totals?.contate, 4)

uguale('nessun errore in console', errori.length, 0)
errori.slice(0, 4).forEach(e => nota('·', e))

await page.close()
await browser.close()
riassunto('la varietà a monete, col dito')
