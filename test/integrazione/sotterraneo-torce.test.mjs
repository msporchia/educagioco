/* ═══════════════════════════════════════════════════════════════════
   LE TORCE COMPRATE, COL DITO VERO

   Il guasto dell'utente (31 ottobre): al buio sale dal portale, compra
   diciotto torce dalla guaritrice, torna giù dal gemello e resta al buio,
   e non trova da nessuna parte quante ne ha. Il motore riprendeva la sosta
   con le torce alla cintura e nessuna accesa, e una torcia si accendeva da
   sé solo scendendo da capo (docs/sotterraneo/roba.md, «La torcia si
   accende da sé»). Qui il giro: la sosta di un portale al buio, la pagina
   dell'eroe che dice «nessuna torcia» e chi le vende, tre torce comprate,
   la pagina dell'eroe e lo zaino di sopra che le contano alla cintura, il
   gemello che riporta giù con una accesa (il motore, la torcia in mano, il
   cono lungo) e la pagina dell'eroe e lo zaino di giù che lo dicono.
   `node test/esegui.mjs sotterraneo-torce`
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, finestraFerma, mondoPronto, alBancoDi,
         compraNellaBottega, sopraVaDa, senzaPensieri } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { COSE, STANZE_TORCIA } from '../../src/giochi/sotterraneo/dati/cose.js'
import { RAGGIO } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { scrivi, PORTALE as VIA_PORTALE } from '../../src/giochi/sotterraneo/motore/sosta.js'

const roba = { v: 1, gemme: 60, zaino: [], mano: 'spada', mancina: null, corpo: 'corazza', dito: null, torcia: 0, torce: 0 }
// una discesa lasciata dal portale, al buio
const c = new Corsa(CAMPAGNA[0], { seme: 21, eroe: 'cavaliere', roba, rnd: seminato(21) })
const sosta = scrivi(c, 0, { via: VIA_PORTALE })
const COMPRATE = 3

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {},
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 0, libera: false, stelle: {}, missioni: {},
      roba, sosta, mondo: { dove: { portale: true }, parlato: true } } } } } },
})
await senzaPensieri(page)   // senza torcia l'eroe fermo pensa alla guaritrice, e il fumetto prende il tocco
await scegli(page, 'sotterraneo')
await mondoPronto(page)
await attendi(page, 600)

const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  await finestraFerma(page)
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
  await attendi(page, 250)
}
const riga = async sel => page.locator(sel).evaluate(e => ({ n: Number(e.dataset.torce), resta: Number(e.dataset.resta),
                                                             scorta: Number(e.dataset.scorta), testo: e.innerText.replace(/\s+/g, ' ') }))
async function paginaEroe() {
  await toccaIl('[data-azione="eroe-pagina"]')
  await page.waitForSelector('[data-pagina-eroe] [data-torcia-eroe]', { timeout: 5000 })
  await attendi(page, 300)
  return riga('[data-torcia-eroe]')
}
async function chiudi(sel) {
  await toccaIl(`${sel} [data-chiudi]`)
  await page.waitForSelector(sel, { state: 'detached', timeout: 3000 })
  await attendi(page, 300)
}

/* ---------- 1. sopra, senza torce: la pagina dell'eroe dice chi le vende ---------- */
let r = await paginaEroe()
uguale('senza torce la pagina dell\'eroe ne conta zero', r.n, 0)
controlla('e dice che le vende la guaritrice', /nessuna torcia/.test(r.testo) && /guaritrice/.test(r.testo), r.testo)
await scatto(page, 'torce-eroe-nessuna')
await chiudi('[data-pagina-eroe]')

/* ---------- 2. tre torce dalla guaritrice ---------- */
await alBancoDi(page, 'erborista', { tocca, toccaIl })
// la prima la sceglie e la compra col tasto; poi la casella è già scelta, e un tocco su di lei compra di nuovo. Le comprate le
// contano le gemme della bottega, che cambiano subito (il profilo si scrive dopo)
const comprate = async () => (roba.gemme - Number((await page.locator('[data-gemme-bottega]').innerText()).match(/\d+/)[0])) / COSE.torcia.prezzo
await compraNellaBottega(page, 'torcia', { tocca })
for (let i = 0; i < 8 && await comprate() < COMPRATE; i++) {
  await toccaIl('[data-bottega] [data-casella-pezzo="torcia"]')
  await attendi(page, 300)
}
uguale('tre torce comprate', await comprate(), COMPRATE)
await chiudi('[data-bottega]')
await attendi(page, 600)
const dopo = (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.roba
uguale('comprate, aspettano alla cintura nella roba dell\'avventura', `${dopo?.torcia}|${dopo?.torce}`, `0|${COMPRATE}`)

/* ---------- 3. sopra la pagina dell'eroe e lo zaino le contano ---------- */
r = await paginaEroe()
uguale('la pagina dell\'eroe ne conta tre', r.n, COMPRATE)
uguale('tutte alla cintura', `${r.resta}|${r.scorta}`, `0|${COMPRATE}`)
controlla('e dice che scendendo se ne accende una', /3 torce alla cintura/.test(r.testo) && /scendendo/.test(r.testo), r.testo)
await scatto(page, 'torce-eroe-sopra')
await toccaIl('[data-scheda="zaino"]')
await page.waitForSelector('[data-zaino] [data-torcia-zaino]', { timeout: 5000 })
uguale('anche lo zaino di sopra le dice', (await riga('[data-torcia-zaino]')).scorta, COMPRATE)
await chiudi('[data-zaino]')

/* ---------- 4. giù dal gemello: una si accende da sé ---------- */
await sopraVaDa(page, '[data-portale]', 'portale', { tocca, atteso: '[data-fumetto-di="portale"] [data-azione="portale-giu"]' })
await attendi(page, 400)
await toccaIl('[data-fumetto-di="portale"] [data-azione="portale-giu"]')
await page.waitForSelector('[data-tela="3d"]', { timeout: 20000 })
await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0 && !window.__sotterraneo3d.grafica().mondo, null, { timeout: 30000 })
await attendi(page, 1500)
const giu = await page.evaluate(() => {
  const s3 = window.__sotterraneo3d, k = s3.corsa
  return { accesa: k.torciaAccesa, resta: k.torciaResta, scorta: k.torceInScorta, raggio: k.raggioDellaLuce, mano: !!(s3.eroe && s3.eroe.mano) }
})
uguale('tornando giù la torcia è accesa', giu.accesa, true)
uguale('piena', giu.resta, STANZE_TORCIA)
uguale('e le altre alla cintura', giu.scorta, COMPRATE - 1)
controlla('il cono è quello lungo della torcia', giu.raggio > RAGGIO, `${giu.raggio} contro ${RAGGIO}`)
uguale('e la torcia si vede in mano', giu.mano, true)
await scatto(page, 'torce-giu-accesa')

/* ---------- 5. giù la pagina dell'eroe e lo zaino dicono quanta luce resta ---------- */
r = await paginaEroe()
uguale('la pagina dell\'eroe giù: una accesa e due alla cintura', `${r.n}|${r.resta}|${r.scorta}`, `${COMPRATE}|${STANZE_TORCIA}|${COMPRATE - 1}`)
controlla('a parole', r.testo.includes(`ancora ${STANZE_TORCIA} stanze`) && r.testo.includes(`${COMPRATE - 1} alla cintura`), r.testo)
await scatto(page, 'torce-eroe-giu')
await toccaIl('[data-scheda="zaino"]')
await page.waitForSelector('[data-zaino] [data-torcia-zaino]', { timeout: 5000 })
uguale('e lo zaino di giù', (await riga('[data-torcia-zaino]')).resta, STANZE_TORCIA)
await chiudi('[data-zaino]')

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('le torce comprate, col dito')
