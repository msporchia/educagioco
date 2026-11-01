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
   cono lungo) e la pagina dell'eroe e lo zaino di giù che lo dicono. Poi la torcia appesa a un muro: accesa, fa
   luce; toccata, l'eroe ci va sotto e diventa la sua, e sul muro resta la staffa vuota.
   `node test/esegui.mjs sotterraneo-torce`
   tempo: 420
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

/* ---------- 6. la torcia appesa: fa luce sul muro, la si tocca, l'eroe ci va sotto e diventa la sua ----------
   (docs/sotterraneo/luce.md, «Le torce appese»). Si scende al buio nelle cantine col seme 1, che al primo piano ne ha una, a tre celle */
await page.evaluate(() => { location.hash = '' })
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba, mondo: { parlato: true } } } } } },
})
await page.evaluate(() => { location.hash = 'sotterraneo=1&seme=1&stanza=appesa&pensieri=no' })
await page.waitForSelector('[data-tela="3d"]', { timeout: 40000 })
await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
await attendi(page, 3000)
const appesa = () => page.evaluate(() => {
  const s3 = window.__sotterraneo3d, c = s3.corsa, t = c.torciaAppesa, tutte = c.livello.torce || []
  const q = tutte.find(x => x.prendi)
  let scala = null
  s3.scena.traverse(o => { if (o.isInstancedMesh && o.userData.elemento3d === 'arredo' && o.material && o.material.vertexColors && o.count === 1 && scala == null) { const m = new o.matrix.constructor(); o.getMatrixAt(0, m); scala = Math.round(Math.hypot(m.elements[0], m.elements[1], m.elements[2]) * 100) / 100 } })
  return { appesa: !!t, x: q && q.x, y: q && q.y, luce: !!q && c.luce.has(q.y * c.livello.largo + q.x), sotto: !!q && c.luce.has((q.y + 1) * c.livello.largo + q.x),
           accesa: c.torciaAccesa, resta: c.torciaResta, scala }
})
let a = await appesa()
uguale('al buio, nel primo piano c\'è una torcia appesa da prendere', a.appesa, true)
uguale('e l\'eroe è al buio', a.accesa, false)
controlla('fa luce: il suo muro e la cella sotto sono accesi', a.luce && a.sotto, JSON.stringify(a))
controlla('appesa si vede il suo modello nella staffa', a.scala > 0, String(a.scala))
await scatto(page, 'torce-appesa')
// un tocco sulla torcia (la cella di muro): l'eroe va sotto, e la stacca
{
  const tela = page.locator('[data-tela="3d"]'), b = await tela.boundingBox()
  const [sx, sy] = await page.evaluate(([x, y]) => window.__sotterraneo3d.aSchermo(x + 0.5, 0.8, y + 1), [a.x, a.y])
  await tocca(b.x + sx, b.y + sy)
  for (let i = 0; i < 20 && (await appesa()).appesa; i++) await attendi(page, 400)
}
a = await appesa()
uguale('toccata, l\'eroe ci va sotto e la prende', a.appesa, false)
uguale('e diventa la sua torcia, accesa e piena', `${a.accesa}|${a.resta}`, `true|${STANZE_TORCIA}`)
uguale('sul muro resta la staffa vuota', a.scala, 0)
await scatto(page, 'torce-appesa-presa')
r = await paginaEroe()
uguale('la pagina dell\'eroe la conta', `${r.n}|${r.resta}`, `1|${STANZE_TORCIA}`)
await chiudi('[data-pagina-eroe]')

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('le torce comprate e quella appesa, col dito')
