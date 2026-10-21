/* ═══════════════════════════════════════════════════════════════════
   LA META DEL MONDO DI SOPRA, COL DITO — docs/sotterraneo/mondo-3d-la-meta.md

   Alla prima partita nel Sotterraneo 3D la carta in cima dice dove
   andare (la cripta dei re, con la sua icona) e quanti passi mancano;
   per terra la scia di luci azzurre e il velo di nuvole aperto lungo la
   strada, che non entra nella nebbia salvata. Nella veduta d'insieme la
   meta c'è anche sotto le nuvole, e toccarla manda l'eroe a piedi. Il
   cartello dice quale freccia porta alla meta. La meta la sceglie solo
   il diario («segui questa»), di difetto la storia: con una missione e
   una taglia in mano resta la storia, e non cambia camminando.
   Si tocca come un telefono (`Input.dispatchTouchEvent`).
   `node test/esegui.mjs sotterraneo-mondo-meta`
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scegli, scatto, attendi, mondoPronto, toccaNelMondo } from '../aiuto/browser.mjs'
import { seminaIlSotterraneo, campagnaSeminata } from '../aiuto/sotterraneo-semina.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { ilMondo, postiDi, terraDelMondo } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { campoVersoLaMeta } from '../../src/giochi/sotterraneo/motore/meta-sopra.js'
import { missioneDi } from '../../src/giochi/sotterraneo/dati/missioni.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
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
const m = ilMondo()
const terra = terraDelMondo(m)
const cripta = postiDi(m, 'ingresso').find(p => p.chiave === 'altare')
const campo = campoVersoLaMeta(terra, cripta.accanto)
const cella = async () => (await page.locator('[data-eroe-mondo]').getAttribute('data-cella')).split(',').map(Number)
const carta = sel => page.locator(`[data-meta-carta] ${sel}`)
async function entra() {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await seminaIlSotterraneo(page, { finite: 0, gioco: 'sotterraneo3d' })
  await mondoPronto(page)
  await attendi(page, 2000)
}

/* ---------- 1. alla prima partita la carta in cima dice cosa e quanto ---------- */
await entra()
{
  uguale('la meta è la cripta dei re', await page.locator('[data-meta-carta]').getAttribute('data-meta'), 'altare')
  uguale('col suo nome', await carta('[data-meta-nome]').innerText(), 'La cripta dei re')
  const passi = Number(await carta('[data-meta-passi]').getAttribute('data-passi'))
  const [x, y] = await cella()
  dentro('e i passi della strada vera', passi, Math.floor(campo.passi(x, y)) - 1, Math.ceil(campo.passi(x, y)) + 1)
  controlla('detti al bambino', /^a \d+ passi$/.test(await carta('[data-meta-passi]').innerText()), await carta('[data-meta-passi]').innerText())
  const ic = await carta('.sot3d-meta-icona').boundingBox()
  controlla('l\'icona si legge (almeno 44 px)', ic.width >= 44 && ic.height >= 44, `${ic.width}×${ic.height}`)
  uguale('niente «portami lì»: per terra ci sono già le luci', await page.locator('[data-azione="portami"]').count(), 0)
  uguale('l\'icona è la cripta fotografata', await carta('[data-ritaglio]').count(), 1)
  const g = await page.evaluate(() => window.__sotterraneo3d.grafica())
  controlla('per terra c\'è la scia di luci', g.scia > 10, g.scia)
  dentro('e il conto resta sotto le 150 chiamate', g.chiamate, 10, 150)
  dentro('e i 400 mila triangoli', g.triangoli, 1000, 400000)
  nota(`con la scia: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli, ${g.scia} luci`)
  // il velo della strada si vede ma non si salva: la cripta non è «trovata», e la nebbia salvata non ha la sua strada
  uguale('la cripta non è trovata per finta', await page.locator('[data-posto="altare"]').getAttribute('data-trovato'), '0')
  uguale('e nel bit della nebbia (quello che si salva) la sua strada non c\'è', await page.evaluate(([x, z]) => window.__sotterraneo3d.visto(x, z), [cripta.accanto.x + 0.5, cripta.accanto.y + 0.5]), false)
  await scatto(page, 'sotterraneo-meta-carta')
}

/* ---------- 2. la veduta: la meta sotto le nuvole, e un tocco lì manda l'eroe a piedi ---------- */
{
  await page.evaluate(() => document.querySelector('[data-casella-barra="mappa"]').click())
  await page.waitForSelector('[data-veduta]', { timeout: 5000 })
  await attendi(page, 3000)
  uguale('nella veduta la meta c\'è, anche non trovata', await page.locator('[data-nome-posto="meta:altare"]').count(), 1)
  controlla('col suo nome', (await page.locator('[data-nome-posto="meta:altare"]').innerText()).includes('La cripta dei re'))
  uguale('e il segno «tu»', await page.locator('[data-nome-posto="eroe"]').count(), 1)
  await scatto(page, 'sotterraneo-meta-veduta')
  await toccaIl('[data-nome-posto="meta:altare"]')
  await page.waitForSelector('[data-veduta]', { state: 'detached', timeout: 5000 })
  const va = await page.waitForSelector('[data-eroe-mondo][data-cammina="1"]', { state: 'attached', timeout: 5000 }).then(() => true, () => false)
  controlla('toccata la meta, la veduta si chiude e l\'eroe ci va a piedi', va)
}

/* ---------- 3. il cartello del villaggio dice quale freccia porta alla meta ---------- */
{
  await page.evaluate(() => window.__mondo3d.vai(window.__mondo3d.bersagli().find(b => b.ruolo === 'cartello' && b.citta === 'villaggio').chiave))
  await attendi(page, 1500)
  await toccaNelMondo(page, '[data-cartello="villaggio"]', { tocca })
  await page.waitForSelector('[data-fumetto-di="cartello"]', { timeout: 30000 })
  uguale('una freccia sola porta alla meta', await page.locator('[data-fumetto-di="cartello"] [data-freccia-meta]').count(), 1)
  controlla('e lo dice con le luci', /cripta dei re: segui le luci azzurre/.test(await page.locator('[data-freccia-meta]').innerText()))
  await scatto(page, 'sotterraneo-meta-cartello')
}

/* ---------- 4. la meta la sceglie il diario: di difetto la storia, poi quella scelta, e non cambia camminando ---------- */
{
  const GIU = 'rosicchione'                      // il mugnaio, nella torre: la «più vicina» di prima, non la cripta
  const TAGLIA = 't:villaggio:mappa:mulino:0'    // la X nel mulino
  const c = campagnaSeminata({ finite: 0, eroe: 'cavaliere', missioni: { [GIU]: 'presa' } })
  Object.assign(c.cfg.avventure.cavaliere, { mondo: { giro: 0, parlato: true, quest: { stati: { [TAGLIA]: 'presa' }, fatte: 0 } } })
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await semina(page, { coins: 300, settings: { sperimentali: true }, campagne: { sotterraneo: c } })
  await scegli(page, 'sotterraneo3d')
  await mondoPronto(page)
  await page.evaluate(() => window.__mondo3d.senzaMostri())
  await attendi(page, 2000)
  const meta = () => page.locator('[data-meta-carta]').getAttribute('data-meta')
  uguale('con una missione e una taglia in mano, niente scelto: la storia', await meta(), 'altare')
  await page.evaluate(() => window.__mondo3d.vai('ingresso:torre'))
  await attendi(page, 2500)
  uguale('e non cambia andando davanti alla torre', await meta(), 'altare')
  const segui = async id => {
    await toccaIl('[data-azione="vita"]')
    await page.waitForSelector('[data-scheda="missioni"]', { timeout: 5000 })
    await toccaIl('[data-scheda="missioni"]')
    await page.waitForSelector(`[data-diario] [data-missione="${id}"]`, { timeout: 5000 })
    await attendi(page, 300)
    await toccaIl(`[data-diario] [data-missione="${id}"]`)
    await page.waitForSelector('[data-dettaglio] [data-azione="segui"]', { timeout: 5000 })
    await attendi(page, 300)
    await toccaIl('[data-dettaglio] [data-azione="segui"]')
    await attendi(page, 300)
    await toccaIl('[data-diario] [data-chiudi]')
    await page.waitForSelector('[data-diario]', { state: 'detached', timeout: 5000 })
    await attendi(page, 1200)
  }
  await segui(GIU)
  uguale('«segui questa» sulla missione: la meta è la sua discesa', await meta(), 'torre')
  controlla('con la scia', (await page.evaluate(() => window.__sotterraneo3d.grafica().scia)) > 0)
  await page.evaluate(() => window.__mondo3d.vai('ingresso:altare'))
  await attendi(page, 2500)
  uguale('e resta quella anche davanti alla cripta', await meta(), 'torre')
  await segui(TAGLIA)
  uguale('«segui questa» sulla taglia: la meta è il suo posto', await meta(), `taglia:${TAGLIA}`)
  uguale('col suo nome', await carta('[data-meta-nome]').innerText(), missioneDi(TAGLIA).titolo)
  await scatto(page, 'sotterraneo-meta-scelta')
}

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('la meta del mondo di sopra')
