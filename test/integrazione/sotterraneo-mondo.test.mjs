/* ═══════════════════════════════════════════════════════════════════
   IL MONDO DI SOPRA IN 3D, COL DITO — docs/sotterraneo/terra-di-sopra.md
   («Il mondo in 3D») e docs/sotterraneo/grafica-3d.md

   Nel Sotterraneo 3D la terra di sopra è il mondo generato (seme 19),
   disegnato in WebGL: non c'è più la mappa dipinta. Qui si entra, si
   guarda quanto costa, si cammina col dito, si parla alla ragazza del
   pozzo toccandola, si apre la bottega del fabbro, si accende la pietra
   del villaggio con una domanda, si apre la veduta d'insieme e un tocco
   lì manda l'eroe a piedi, si scende nella cripta dei re e si risale
   lasciandola perdere: si torna davanti al suo ingresso, con la nebbia e
   la pietra salvate. Con la sosta del portale il gemello sta nel
   villaggio. Si tocca come un telefono (`Input.dispatchTouchEvent`).
   `node test/esegui.mjs sotterraneo-mondo`
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scegliAvventura, leggiProfilo, mondoPronto,
         fermoNelMondo, toccaNelMondo, nelDialogo, scendiNelSotterraneo, lasciaLaDiscesa } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { scrivi, PORTALE as VIA_PORTALE } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { ilMondo, postiDi, terraDelMondo, aperturaDi } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const m = ilMondo()
const terra = terraDelMondo(m, aperturaDi([]).aperto)
// una cella dove si cammina, a qualche passo da (x, y) verso (dx, dy)
const cellaVerso = (x, y, dx, dy) => { for (let k = 6; k >= 3; k--) for (const s of [0, 1, -1, 2, -2]) { const c = { x: x + dx * k + dy * s, y: y + dy * k + dx * s }; if (terra.passa(c.x, c.y)) return c } return null }
const g3d = () => page.evaluate(() => window.__sotterraneo3d.grafica())
const cella = async () => (await page.locator('[data-eroe-mondo]').getAttribute('data-cella')).split(',').map(Number)
// dove cade a schermo un punto del mondo (in celle, a terra), in px della pagina
async function schermoDi(x, z, su = 0) {
  const p = await page.evaluate(([a, b, c]) => { const s = window.__sotterraneo3d; const q = s.aSchermo(a, s.quota(a, b) + c, b); return [q.x, q.y] }, [x, z, su])
  const b = await page.locator('[data-mondo3d]').boundingBox()
  return { x: b.x + p[0], y: b.y + p[1] }
}

/* ---------- 1. si entra: il mondo in 3D, non la terra dipinta, e quanto costa ---------- */
await azzera(page)
await semina(page, { settings: { sperimentali: true } })
await scegli(page, 'sotterraneo3d')
await scegliAvventura(page, 'cavaliere')
await mondoPronto(page)
await attendi(page, 2500)
uguale('sopra c\'è il mondo in 3D', await page.locator('[data-mondo3d]').count(), 1)
uguale('e non la terra dipinta', await page.locator('[data-terra]').count(), 0)
{
  const g = await g3d()
  uguale('lo disegna il mondo di sopra', g.mondo, true)
  controlla('i nove pezzi attorno al villaggio', g.pezzi.length === 9, g.pezzi.join())
  dentro('sotto le 150 chiamate', g.chiamate, 10, 150)
  dentro('sotto i 400 mila triangoli', g.triangoli, 1000, 400000)
  nota(`dal villaggio: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli, ${g.figure} figure, un pezzo in ${g.msPezzi} ms (SwiftShader)`)
}
await scatto(page, 'sotterraneo-mondo-villaggio')

/* ---------- 2. si cammina: un tocco sul prato porta l'eroe lì ---------- */
{
  const [x0, y0] = await cella()
  const meta = cellaVerso(x0, y0, 0, 1)
  const p = await schermoDi(meta.x + 0.5, meta.y + 0.5)
  await tocca(p.x, p.y)
  await attendi(page, 300)
  await fermoNelMondo(page)
  const [x1, y1] = await cella()
  controlla('l\'eroe è arrivato dove si è toccato', Math.hypot(x1 - meta.x, y1 - meta.y) <= 1, `${x0},${y0} → ${x1},${y1} (toccato ${meta.x},${meta.y})`)
}

/* ---------- 3. le persone vincono sul prato: toccata, la ragazza del pozzo parla ---------- */
await toccaNelMondo(page, '[data-personaggio="ragazza"]', { tocca })
await page.waitForSelector('[data-dialogo="ragazza"]', { timeout: 60000 })
controlla('toccata la ragazza, si apre il suo dialogo', true)
await scatto(page, 'sotterraneo-mondo-ragazza')
await nelDialogo(page, '[data-scelta="ciao"]')

/* ---------- 4. il fabbro: si va da lui e si apre la bottega ---------- */
await toccaNelMondo(page, '[data-mercante="armaiolo"][data-citta="villaggio"]', { tocca })
await page.waitForSelector('[data-dialogo="armaiolo"]', { timeout: 60000 })   // SwiftShader: l'eroe ci arriva piano
await nelDialogo(page, '[data-scelta="bottega"]')
await page.waitForSelector('[data-bottega][data-mercante-aperto="armaiolo"]', { timeout: 8000 })
controlla('la bottega del fabbro si apre', true)
await scatto(page, 'sotterraneo-mondo-bottega')
await page.click('[data-bottega] [data-chiudi]')
await attendi(page, 500)

/* ---------- 5. la pietra del villaggio: si accende con una domanda, e risponderle giusto paga ---------- */
{
  await toccaNelMondo(page, '[data-pietra="villaggio"]', { tocca })
  await page.waitForSelector('[data-pietra-domanda] .qz-tasto', { timeout: 30000 })
  await scatto(page, 'sotterraneo-mondo-pietra-domanda')
  await attendi(page, 500)
  await page.locator('[data-pietra-domanda] .qz-tasto:not([data-giusta])').first().click()
  // sbagliando la domanda resta a dire il perché e come si fa, il tempo di leggerlo (quiz/Domanda.vue)
  await page.waitForSelector('[data-pietra-domanda]', { state: 'detached', timeout: 40000 })
  await attendi(page, 400)
  uguale('sbagliando la pietra resta spenta', await page.locator('[data-pietra="villaggio"]').getAttribute('data-accesa'), '0')
  await toccaNelMondo(page, '[data-pietra="villaggio"]', { tocca })
  await page.waitForSelector('[data-pietra-domanda] .qz-tasto', { timeout: 30000 })
  await attendi(page, 500)
  await page.locator('[data-pietra-domanda] .qz-tasto[data-giusta]').first().click()
  await page.waitForSelector('[data-pietra="villaggio"][data-accesa="1"]', { timeout: 8000 })
  controlla('rispondendo giusto la pietra si accende', true)
  await page.waitForSelector('[data-fumetto-di="pietra"]', { timeout: 8000 })
  controlla('e dice che da sola non porta ancora da nessuna parte', await page.locator('[data-fumetto-di="pietra"] [data-nessuna-meta]').count() === 1)
  await scatto(page, 'sotterraneo-mondo-pietra')
}

/* ---------- 6. la veduta d'insieme: dalla barra, costa poco, e un tocco lì manda l'eroe a piedi ---------- */
{
  await page.evaluate(() => document.querySelector('[data-casella-barra="mappa"]').click())
  await page.waitForSelector('[data-veduta]', { timeout: 5000 })
  await attendi(page, 3000)
  const g = await g3d()
  uguale('la veduta è accesa', g.veduta, true)
  dentro('nella veduta sotto le 100 chiamate', g.chiamate, 5, 100)
  nota(`la veduta: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli`)
  controlla('il nome del villaggio nella veduta', await page.locator('[data-nome-posto="citta:villaggio"]').count() === 1)
  await scatto(page, 'sotterraneo-mondo-veduta')
  const [x0, y0] = await cella()
  const meta = cellaVerso(x0, y0, 0, 1)
  const p = await schermoDi(meta.x + 0.5, meta.y + 0.5)
  await tocca(p.x, p.y)
  await attendi(page, 500)
  uguale('toccando, la veduta si chiude', await page.locator('[data-veduta]').count(), 0)
  await fermoNelMondo(page)
  const [x1, y1] = await cella()
  controlla('e l\'eroe ci è andato a piedi', Math.hypot(x1 - meta.x, y1 - meta.y) <= 1.5, `${x0},${y0} → ${x1},${y1} (toccato ${meta.x},${meta.y})`)
}

/* ---------- 7. la cripta dei re: si tocca l'ingresso, si scende in 3D, si lascia perdere e si torna davanti ---------- */
{
  await scendiNelSotterraneo(page, 0, { tocca })
  await page.waitForSelector('[data-tela="3d"]', { timeout: 15000 })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0 && !window.__sotterraneo3d.grafica().mondo, null, { timeout: 20000 })
  uguale('giù è la discesa 3D di sempre', (await g3d()).scenario, CAMPAGNA[0].scenario)
  await lasciaLaDiscesa(page)
  await mondoPronto(page)
  await attendi(page, 1500)
  const ing = postiDi(m, 'ingresso').find(p => p.chiave === 'altare')
  const [x, y] = await cella()
  controlla('risalendo si è davanti all\'ingresso della cripta', Math.hypot(x - ing.accanto.x, y - ing.accanto.y) <= 2, `${x},${y}`)
  const p = await leggiProfilo(page)
  const mo = p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.mondo
  uguale('la nebbia del mondo è salvata in base64 (un bit per cella)', mo?.nebbia?.length, 3734)
  controlla('e la pietra accesa resta accesa', (mo?.pietre || []).includes('villaggio'))
  uguale('il campo del 2D non si tocca', p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.terra, undefined)
  await scatto(page, 'sotterraneo-mondo-ritorno')
}

/* ---------- 8. salendo dal portale il gemello sta nella città che serve quel dungeon ---------- */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 11, eroe: 'cavaliere' })
  const sosta = scrivi(c, 0, { via: VIA_PORTALE })
  const p = await leggiProfilo(page)
  const a = { ...p.campagne.sotterraneo.cfg.avventure.cavaliere, sosta, mondo: { ...p.campagne.sotterraneo.cfg.avventure.cavaliere.mondo, dove: { portale: true } } }
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await semina(page, { settings: { sperimentali: true }, campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {}, cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: a } } } } })
  await scegli(page, 'sotterraneo3d')
  await mondoPronto(page)
  await attendi(page, 1500)
  uguale('il gemello sta nel villaggio', await page.locator('[data-portale][data-citta="villaggio"]').count(), 1)
  const port = postiDi(m, 'portale').find(q => q.citta === 'villaggio')
  const [x, y] = await cella()
  uguale('e l\'eroe ci sbuca accanto', `${x},${y}`, `${port.accanto.x},${port.accanto.y}`)
  await toccaNelMondo(page, '[data-portale]', { tocca })
  await page.waitForSelector('[data-fumetto-di="portale"] [data-azione="portale-giu"]', { timeout: 20000 })
  controlla('toccato, il portale riporta giù', true)
  await scatto(page, 'sotterraneo-mondo-portale')
}

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('sotterraneo mondo')
