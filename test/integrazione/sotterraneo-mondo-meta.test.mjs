/* ═══════════════════════════════════════════════════════════════════
   LA META DEL MONDO DI SOPRA, COL DITO — docs/sotterraneo/mondo-3d-la-meta.md

   Alla prima partita nel Sotterraneo 3D la carta in cima dice dove
   andare (la cripta dei re, con la sua icona) e quanti passi mancano;
   per terra la scia di luci azzurre e il velo di nuvole aperto lungo la
   strada, che non entra nella nebbia salvata. Nella veduta d'insieme la
   meta c'è anche sotto le nuvole, e toccarla è «portami lì»; il tasto
   della carta ferma l'eroe. «Portami lì» porta davanti alla cripta e ne
   apre il fumetto; da un prato dove sulla strada c'è un mostro, si
   ferma quando il mostro compare. Il cartello dice quale freccia porta
   alla meta. Si tocca come un telefono (`Input.dispatchTouchEvent`).
   `node test/esegui.mjs sotterraneo-mondo-meta`
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, scatto, attendi, mondoPronto, fermoNelMondo, toccaNelMondo } from '../aiuto/browser.mjs'
import { seminaIlSotterraneo } from '../aiuto/sotterraneo-semina.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { ilMondo, postiDi, terraDelMondo, aperturaDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { campoVersoLaMeta } from '../../src/giochi/sotterraneo/motore/meta-sopra.js'
import { riprendiMondo, alSicuro } from '../../src/giochi/sotterraneo/motore/aperta.js'
import { SOPRA } from '../../src/giochi/sotterraneo/dati/mondo-aperto-mostri.js'

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
const terra = terraDelMondo(m, aperturaDi([]).aperto)
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
  const ic = await carta('.sot3d-meta-icona').boundingBox(), tasto = await carta('[data-azione="portami"]').boundingBox()
  controlla('l\'icona si legge (almeno 44 px)', ic.width >= 44 && ic.height >= 44, `${ic.width}×${ic.height}`)
  controlla('e il tasto si prende col dito (almeno 44 px)', tasto.height >= 44 && tasto.width >= 44, `${tasto.width}×${tasto.height}`)
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

/* ---------- 2. la veduta: la meta sotto le nuvole, e toccarla è «portami lì»; il tasto la ferma ---------- */
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
  await page.waitForSelector('[data-meta-carta][data-guidato="1"]', { timeout: 5000 })
  controlla('toccata la meta, la veduta si chiude e l\'eroe ci va', await page.locator('[data-eroe-mondo]').getAttribute('data-cammina') === '1')
  await attendi(page, 1500)
  uguale('mentre si va il tasto dice «fermati»', (await carta('[data-azione="portami"]').innerText()).includes('fermati'), true)
  await toccaIl('[data-meta-carta] [data-azione="portami"]')
  await fermoNelMondo(page)
  uguale('toccato, l\'eroe si ferma', await page.locator('[data-meta-carta]').getAttribute('data-guidato'), '0')
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

/* ---------- 4. «portami lì» porta davanti alla cripta e ne apre il fumetto ---------- */
{
  await page.evaluate(() => window.__mondo3d.senzaMostri())
  await toccaIl('[data-meta-carta] [data-azione="portami"]')
  await page.waitForSelector('[data-fumetto-di="altare"]', { timeout: 150000 })   // SwiftShader: l'eroe ci arriva piano
  const [x, y] = await cella()
  controlla('l\'eroe è davanti alla cripta', Math.hypot(x - cripta.accanto.x, y - cripta.accanto.y) <= 1.5, `${x},${y}`)
  uguale('e il fumetto ha «scendo»', await page.locator('[data-fumetto-di="altare"] [data-azione="scendi"]').count(), 1)
  uguale('i passi dicono che si è arrivati', await carta('[data-meta-passi]').innerText(), 'sei arrivato')
  uguale('la cripta adesso è trovata davvero', await page.locator('[data-posto="altare"]').getAttribute('data-trovato'), '1')
  await scatto(page, 'sotterraneo-meta-arrivato')
}

/* ---------- 5. con un mostro sulla strada, «portami lì» si ferma quando compare ---------- */
{
  // un prato a qualche passo da un mostro che dorme, fuori dal suo cerchio, da dove la strada verso la cripta gli passa accanto
  const st = riprendiMondo({ mondo: m, eroe: 'cavaliere', giro: 0, salvato: null })
  let da = null
  for (const q of st.mostri) {
    if (da || q.sveglio || !Number.isFinite(campo.passi(Math.floor(q.fx), Math.floor(q.fy)))) continue
    for (let dy = -16; dy <= 16 && !da; dy++) for (let dx = -16; dx <= 16 && !da; dx++) {
      const x = Math.floor(q.fx) + dx, y = Math.floor(q.fy) + dy, d = Math.hypot(x + 0.5 - q.fx, y + 0.5 - q.fy)
      if (d < SOPRA.vista + 3 || d > SOPRA.vista + 6 || !terra.passa(x, y) || alSicuro(m, x + 0.5, y + 0.5)) continue
      const via = campo.strada({ x, y })
      if (via && Math.min(...via.map(v => Math.hypot(v.x + 0.5 - q.fx, v.y + 0.5 - q.fy))) < 2) da = { x, y, i: q.i }
    }
  }
  controlla('c\'è un prato così', !!da)
  await entra()
  await page.evaluate(([x, y]) => window.__mondo3d.porta(x + 0.5, y + 0.5), [da.x, da.y])
  await attendi(page, 2500)
  controlla('da lì il mostro non si vede ancora', !(await page.evaluate(() => window.__mondo3d.mostri().map(q => q.i))).includes(da.i))
  await toccaIl('[data-meta-carta] [data-azione="portami"]')
  await page.waitForFunction(() => document.querySelector('[data-meta-carta]')?.dataset.guidato === '0' || window.__mondo3d.inScontro(), null, { timeout: 120000 })
  const fermo = await page.locator('[data-meta-carta]').getAttribute('data-fermato').catch(() => null)
  controlla('si è fermato per il mostro (o il mostro l\'ha preso)', fermo === 'mostro' || await page.evaluate(() => window.__mondo3d.inScontro()), fermo)
  const [x, y] = await cella()
  controlla('prima di arrivare alla cripta', Math.hypot(x - cripta.accanto.x, y - cripta.accanto.y) > 3, `${x},${y}`)
  if (fermo === 'mostro') controlla('e lo dice', /mostro sulla strada/.test(await page.locator('[data-avviso-terra]').innerText().catch(() => '')))
  await scatto(page, 'sotterraneo-meta-mostro')
}

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('la meta del mondo di sopra')
