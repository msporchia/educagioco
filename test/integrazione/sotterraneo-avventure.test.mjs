/* ═══════════════════════════════════════════════════════════════════
   LE QUATTRO AVVENTURE, COL DITO VERO

   Ogni eroe del sotterraneo ha la sua avventura (docs/sotterraneo/
   avventure.md): roba, discese, nebbia, posto sulla terra di sopra e
   discesa a metà sue. Qui il giro col dito: un profilo di prima (la roba
   una sola per tutti) passa all'avventura del cavaliere; col cavaliere si
   cammina e si lascia a metà il pozzo; si passa al mago, che comincia
   dalla scalinata con lo zaino vuoto e la nebbia nuova; si torna al
   cavaliere e si ritrova tutto, e «riprendi da qui» in home riprende la
   sua discesa.

   I tocchi sono tocchi (`Input.dispatchTouchEvent` via CDP): il click che
   il dito si lascia dietro cadrebbe sulla scheda appena aperta, e un
   `page.click()` non lo porterebbe.
   `node test/esegui.mjs sotterraneo-avventure`
   tempo: 90
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, scendiNelSotterraneo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { PARTENZA } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
/* un profilo di oggi, da prima delle avventure: la scalinata vinta col
   cavaliere, la roba in cfg, la nebbia già tolta */
const roba = { v: 1, gemme: 60, zaino: ['pozione'], mano: 'spada', mancina: null, corpo: 'corazza', dito: null,
               torcia: 0, torce: 0 }
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 },
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
const gemme = async () => Number(((await page.locator('[data-roba-sopra]').innerText()).match(/💎 (\d+)/) || [])[1])
const chiScende = () => page.locator('[data-azione="eroe"]').innerText()
const trovati = () => page.locator('[data-posto][data-trovato="1"]').count()
async function fermo() {
  await page.waitForFunction(() => document.querySelector('[data-eroe-terra]')?.dataset.cammina === '0',
                             null, { timeout: 15000 })
  await attendi(page, 200)
}
// un passo sul prato: in alto a sinistra della vista, lontano dalle carte in cima e in fondo
async function unPasso() {
  const v = await page.locator('[data-terra]').boundingBox()
  await tocca(v.x + 60, v.y + v.height * 0.45)
  await fermo()
}
async function apriLaScelta() {
  await toccaIl('[data-azione="eroe"]')
  await page.waitForSelector('.sot-eroe[data-eroe]', { timeout: 3000 })
  await attendi(page, 250)
}
async function scegliCol(eroe) {
  await toccaIl(`.sot-eroe[data-eroe="${eroe}"]`)
  await page.waitForSelector('.sot-eroe[data-eroe]', { state: 'detached', timeout: 3000 })
  await page.waitForSelector('[data-terra]', { timeout: 5000 })
  await attendi(page, 400)
}

/* ---------- 1. il profilo di prima passa al cavaliere ---------- */
let p = await leggiProfilo(page)
const sot = p?.campagne?.sotterraneo
controlla('la roba è passata all\'avventura del cavaliere', sot?.cfg?.avventure?.cavaliere?.roba?.mano === 'spada',
          JSON.stringify(sot?.cfg)?.slice(0, 120))
uguale('e fuori non c\'è più', sot?.cfg?.roba, undefined)
uguale('il record di fuori resta: una discesa', sot?.tappa, 1)
uguale('le monete restano', p?.coins, 300)
controlla('la carta di chi scende è del cavaliere', (await chiScende()).includes('Cavaliere'))
uguale('con le sue gemme', await gemme(), 60)
uguale('e il pozzo gli è aperto', await page.locator('[data-discesa="1"]').getAttribute('data-aperta'), '1')
const trovatiCav = await trovati()

/* ---------- 2. col cavaliere si cammina, e si lascia a metà il pozzo ---------- */
const casa = await cella()
await unPasso()
controlla('il cavaliere cammina', (await cella()) !== casa, await cella())
await scendiNelSotterraneo(page, 1)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 600)
const campo = await page.locator('.sot-tela').boundingBox()
await tocca(campo.x + campo.width * 0.6, campo.y + campo.height * 0.5)
await attendi(page, 800)
await toccaIl('button[aria-label="indietro"]')
await page.waitForSelector('[data-ripresa]', { timeout: 5000 })
await attendi(page, 300)
const doveCav = await cella()
controlla('il pozzo resta a metà, col cavaliere', (await page.locator('.sot-ripresa .sot-dove').innerText()).includes('Cavaliere'))

/* ---------- 3. le quattro avventure ---------- */
await apriLaScelta()
uguale('quattro schede', await page.locator('.sot-eroe[data-eroe]').count(), 4)
const schedaCav = await page.locator('.sot-eroe[data-eroe="cavaliere"]').innerText()
uguale('quella del cavaliere è cominciata',
       await page.locator('.sot-eroe[data-eroe="cavaliere"]').getAttribute('data-nuova'), '0')
controlla('e dice a che punto è: discese, stelle, gemme', schedaCav.includes('1 di 6') && schedaCav.includes('⭐ 3')
          && schedaCav.includes('💎 60'), schedaCav)
controlla('la roba principale addosso', await page.locator('.sot-eroe[data-eroe="cavaliere"] [data-addosso="spada"]').count() === 1)
controlla('e la discesa a metà', schedaCav.includes('a metà: il pozzo dal tetto rosso'), schedaCav)
// la roba del seme: spada (braccio 2) e corazza (difesa 2) sopra i 18 · 3 · 1 di base del cavaliere
// innerText mette un a capo fra l'icona e il numero: si confronta il testo compatto
const compatto = t => t.replace(/\s+/g, ' ')
controlla('i numeri sono quelli con la roba: ❤️ 18 · ⚔️ 5 · 🛡️ 3',
          compatto(schedaCav).includes('❤️ 18 ⚔️ 5 🛡️ 3') && !compatto(schedaCav).includes('⚔️ 3 '), compatto(schedaCav))
controlla('la spada è in mano al ritratto', await page.locator('.sot-eroe[data-eroe="cavaliere"] .sot-armato [data-in-mano="spada"]').count() === 1)
controlla('la corazza è accanto, in iconcina', await page.locator('.sot-eroe[data-eroe="cavaliere"] [data-addosso="corazza"]').count() === 1)
controlla('l\'elfa nuova ha i numeri di base e le mani vuote',
          compatto(await page.locator('.sot-eroe[data-eroe="elfa"]').innerText()).includes('❤️ 15 ⚔️ 4 🛡️ 1')
          && await page.locator('.sot-eroe[data-eroe="elfa"] [data-in-mano]').count() === 0)
for (const e of ['elfa', 'mago', 'nano']) {
  uguale(`${e}: nuova avventura`, await page.locator(`.sot-eroe[data-eroe="${e}"]`).getAttribute('data-nuova'), '1')
}
await scatto(page, 'avventure-scelta')

/* ---------- 4. il mago comincia da capo ---------- */
await scegliCol('mago')
controlla('la carta di chi scende è del mago', (await chiScende()).includes('Mago'))
uguale('dalla scalinata di casa', await cella(), PARTENZA.piede.join(','))
uguale('con lo zaino vuoto', await gemme(), 0)
uguale('senza discese a metà', await page.locator('[data-ripresa]').count(), 0)
uguale('solo la scalinata è aperta', await page.locator('[data-discesa][data-aperta="1"]').count(), 1)
controlla('e con la nebbia nuova', (await trovati()) < trovatiCav, `${await trovati()} posti trovati contro ${trovatiCav}`)
await scatto(page, 'avventure-mago-terra')
await unPasso()
const doveMago = await cella()

/* ---------- 5. si torna al cavaliere, e c'è tutto ---------- */
await apriLaScelta()
controlla('la scelta segna il mago', await page.locator('.sot-eroe.sot-scelto[data-eroe="mago"]').count() === 1)
await scegliCol('cavaliere')
controlla('la carta di chi scende è del cavaliere', (await chiScende()).includes('Cavaliere'))
uguale('dov\'era rimasto', await cella(), doveCav)
uguale('con le sue gemme', await gemme(), 60)
uguale('con la sua discesa a metà', await page.locator('[data-ripresa]').count(), 1)
uguale('e la sua nebbia', await trovati(), trovatiCav)
p = await leggiProfilo(page)
const av = p?.campagne?.sotterraneo?.cfg?.avventure || {}
uguale('nel profilo il mago ha la sua terra', (av.mago?.terra?.dove || []).join(','), doveMago)
controlla('e non ha la roba del cavaliere', !av.mago?.roba?.mano && !(av.mago?.roba?.gemme > 0), JSON.stringify(av.mago?.roba))
uguale('il cavaliere ha la sua sosta', av.cavaliere?.sosta?.tappa, 1)
uguale('l\'avventura aperta è del cavaliere', p?.campagne?.sotterraneo?.cfg?.eroe, 'cavaliere')

/* ---------- 6. «riprendi da qui» riprende la discesa del cavaliere ---------- */
await attendi(page, 5200)   // sotto i cinque secondi non è una partita (store/sessioni.js)
await toccaIl('button[aria-label="indietro"]')
await page.waitForSelector('.carte', { timeout: 5000 })
uguale('in home si riprende il sotterraneo', await page.locator('[data-riprendi]').getAttribute('data-riprendi'), 'sotterraneo')
await toccaIl('[data-riprendi]')
await page.waitForSelector('.sot-tela', { timeout: 5000 })
controlla('e si torna giù nel pozzo, col cavaliere', (await page.locator('.sot-piede').innerText()).includes('piano 1'))
await page.locator('[data-azione="zaino"]').click()
await page.waitForSelector('.sot-centrale', { timeout: 3000 })
controlla('con la sua pozione in tasca', await page.locator('[data-tasca][data-cosa="pozione"]').count() === 1)

uguale('nessun errore in console', errori.join(' · '), '')
nota(`${trovatiCav} posti trovati dal cavaliere, il mago parte da casa`)
await browser.close()
riassunto('le quattro avventure col dito')
