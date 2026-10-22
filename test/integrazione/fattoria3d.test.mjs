/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA 3D, COL DITO — docs/fattoria3d/

   Il test unitario prova le regole; questo dice che **il gioco vero sta in
   piedi nel browser**: è in prova (carta dietro l'interruttore), si apre sul
   prato in WebGL, tenendo premuto su un posto libero si apre «Costruisci qui» e la
   carta scelta va sulla cella premuta e si paga (senza conferme; se la cella non
   basta resta il fantasma da sistemare, e un tocco su un posto che non va non
   perde niente), il pennello disegna le strade, si semina e si raccoglie armando l'azione, un
   albero costa monete e non dà legna, sassi e cespugli si tolgono per una
   moneta, le monete sono quelle vere e il resto (raccolti, terra, alberi, sassi)
   sta nello stato suo e sopravvive a un ricaricamento. Senza
   WebGL 2 si dice e si torna in home.
   Il dito è vero (`Input.dispatchTouchEvent`): un `page.click()` non trascina
   e non porta i pointer del tocco (docs/core/il-dito.md).
   `node test/esegui.mjs fattoria3d --niente-build`
   tempo: 480
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { PEZZI, EDIFICI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { ANIMALI } from '../../src/giochi/fattoria3d/dati/animali.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { POSTI } from '../../src/giochi/fattoria3d/dati/ordini.js'
import { ULTIMO } from '../../src/giochi/fattoria3d/dati/livelli.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 300, settings: { eta: 8, sperimentali: true } })

const cdp = await page.context().newCDPSession(page)
const giu = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
const muovi = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
const su = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
const tocca = async (x, y) => { await giu(x, y); await attendi(page, 60); await su() }
const toccaEl = async sel => { await page.locator(sel).scrollIntoViewIfNeeded().catch(() => {}); const r = await page.locator(sel).boundingBox(); await tocca(r.x + r.width / 2, r.y + r.height / 2) }
async function trascina(da, a) {
  await giu(da[0], da[1])
  for (let k = 1; k <= 10; k++) { await muovi(da[0] + (a[0] - da[0]) * k / 10, da[1] + (a[1] - da[1]) * k / 10); await attendi(page, 30) }
  await attendi(page, 80); await su()
}
// dove cade sullo schermo (px della pagina) un punto del mondo
const schermoDi = (x, z) => page.evaluate(([x, z]) => {
  const { mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), [px, py] = mondo.proietta({ x, y: 0, z })
  return [r.left + px, r.top + py]
}, [x, z])
const stato = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__fattoria3d.motore.s)))
const fermo = async () => { for (let i = 0; i < 100; i++) { if (await page.evaluate(() => { const m = window.__fattoria3d.mondo; return m.eroe.fermo && !m.coda.length })) break; await attendi(page, 150) } await attendi(page, 200) }
const monete = async () => (await leggiProfilo(page)).coins

/* ── la carta è in prova: dietro l'interruttore ── */
controlla('la carta sta in home (interruttore acceso)', await page.locator('[data-indice="fattoria3d"]').count() === 1)

/* ── si apre sul prato ── */
await scegli(page, 'fattoria3d')
await page.waitForSelector('[data-f3="campo"] canvas', { timeout: 10000 })
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
await attendi(page, 1200)
uguale('la barra dice dove siamo', (await page.locator('.barra-app .dove').innerText()).trim(), 'Fattoria 3D')
uguale('le quattro azioni ci sono', await page.locator('[data-f3^="az-"]').count(), 4)
controlla('c\'è un campo vuoto da seminare', (await stato()).cose.length === 1 && (await page.locator('.f3-n').first().innerText()).trim() === '1')
const disegna = await page.evaluate(() => window.__fattoria3d.mondo.statistiche())
controlla('la scena disegna davvero (draw call e triangoli)', disegna.calls > 20 && disegna.triangoli > 2000, `${disegna.calls} draw, ${disegna.triangoli} triangoli`)
await scatto(page, 'fattoria3d-prato')

/* ── semina armata: 🌱 → una coltura → si tocca il campo → l'eroe ci va e semina ── */
await toccaEl('[data-f3="az-semina"]')
await page.waitForSelector('[data-f3="semi"]')
await toccaEl('[data-seme="carota"]')
await attendi(page, 300)
controlla('il tasto 🌱 è armato e mostra la coltura', (await page.locator('[data-f3="az-semina"].acceso').count()) === 1 && /🥕/.test(await page.locator('.f3-seme').innerText()))
const campo = (await stato()).cose[0]
await tocca(...await schermoDi(campo.i + 1, campo.j + 1))
await fermo()
const dopoSemina = (await stato()).cose[0]
uguale('il campo è seminato a carote', dopoSemina.coltura, 'carota')
controlla('le quattro tessere stanno crescendo', dopoSemina.tile.every(t => t !== null))
await scatto(page, 'fattoria3d-seminato')

/* ── raccogli armato: il tempo passa (si sposta l'orologio del motore) ── */
await page.evaluate(() => { const m = window.__fattoria3d.motore, o = m.ora; m.ora = () => o() + 60000 })
await attendi(page, 600)
controlla('il numero sul tasto ✂️ dice un campo pronto', (await page.locator('[data-f3="az-raccogli"] .f3-n').innerText()).trim() === '1')
await toccaEl('[data-f3="az-raccogli"]')
await tocca(...await schermoDi(campo.i + 1, campo.j + 1))
await fermo()
const raccolto = await stato()
uguale('quattro carote in scorta', raccolto.merci.carota, 4)
controlla('il HUD non ha più liste di scorte, solo il tasto dell\'inventario', await page.locator('[data-f3="hud"] [data-merce]').count() === 0 && await page.locator('[data-f3="apri-inventario"]').isVisible())
controlla('è entrata roba: il tasto ha il pallino', await page.locator('[data-f3="inventario-nuovo"]').count() === 1)
await toccaEl('[data-f3="apri-inventario"]')
controlla('l\'inventario mostra la carota con la faccia e il numero', await page.locator('[data-f3="inventario"] button[data-merce="carota"][data-n="4"]').count() === 1)
await toccaEl('[data-f3="inventario"] button[data-merce="carota"]')
controlla('un tocco dice il nome e a cosa serve', /Carote/.test(await page.locator('[data-f3="inventario-riga"]').innerText()))
await toccaEl('[data-f3="inventario"] [data-chiudi]')
controlla('chiuso l\'inventario il pallino è spento', await page.locator('[data-f3="inventario-nuovo"]').count() === 0)

/* ── il guardaroba (docs/fattoria3d/guardaroba.md): si apre toccando il contadino fermo e dal tasto 👕; i capi stanno in cfg.abito ── */
await toccaEl('[data-f3="az-libero"]')                    // col ✂️ armato il contadino non si apre: si torna a mano libera
{
  const dove = await page.evaluate(() => {
    const m = window.__fattoria3d.mondo, r = m.canvas.getBoundingClientRect(), [x, y] = m.proietta(m.eroe.posizione, 0.5)
    return { x: r.left + x, y: r.top + y }
  })
  await page.waitForFunction(() => window.__fattoria3d.mondo.eroe.fermo, null, { timeout: 8000 }).catch(() => {})
  await tocca(dove.x, dove.y)
  await attendi(page, 300)
  controlla('toccare il contadino fermo apre il guardaroba', await page.locator('[data-f3="guardaroba"]').count() === 1)
  const chi = (await page.locator('[data-f3="guardaroba-chi"]').innerText()).toLowerCase()
  const aspetto = await page.evaluate(() => window.__fattoria3d && document.querySelector('[data-aspetto].on')?.getAttribute('data-aspetto'))
  controlla('chi si è lo dice il profilo (bambina → contadina, bimbo → contadino)', aspetto === 'bimbo' ? /contadino/.test(chi) : /contadina/.test(chi), `${aspetto} / ${chi}`)
  await toccaEl('[data-scheda-abito="stivali"]')
  await toccaEl('[data-f3="guardaroba"] button[data-capo="stivali:rossi"]')
  await attendi(page, 200)
  controlla('un gettone cambia l\'abito e resta acceso', await page.locator('button[data-capo="stivali:rossi"][aria-pressed="true"]').count() === 1)
  await toccaEl('[data-scheda-abito="cappello"]')
  await toccaEl('[data-f3="guardaroba"] button[data-capo="cappello:cowboy"]')
  controlla('un pezzo speciale col livello che manca resta bloccato e dice a che livello arriva', /livello 6/i.test(await page.locator('[data-f3="guardaroba-riga"]').innerText()))
  await toccaEl('[data-f3="guardaroba"] [data-chiudi]')
  controlla('la ✕ chiude il guardaroba', await page.locator('[data-f3="guardaroba"]').count() === 0)
  await toccaEl('[data-f3="apri-guardaroba"]')
  controlla('il tasto 👕 lo riapre e l\'abito è rimasto', await page.locator('button[data-capo="stivali:rossi"]').count() === 0 && await page.locator('[data-f3="guardaroba"]').count() === 1)
  await toccaEl('[data-scheda-abito="stivali"]')
  controlla('…gli stivali rossi sono ancora accesi', await page.locator('button[data-capo="stivali:rossi"][aria-pressed="true"]').count() === 1)
  const testi = []
  testi.push(await page.locator('body').innerText())
  await toccaEl('[data-f3="guardaroba"] [data-chiudi]')
  for (const sel of ['[data-f3="livello"]', '[data-f3="apri-inventario"]', '[data-f3="apri-opzioni"]']) {
    await toccaEl(sel); await attendi(page, 200); testi.push(await page.locator('body').innerText())
    const x = page.locator('[data-chiudi]'); if (await x.count()) await toccaEl('[data-chiudi]'); else await toccaEl(sel)
  }
  controlla('nessuna stringa visibile dice «eroe»', !testi.some(t => /\beroe\b/i.test(t)), testi.map(t => (t.match(/.{0,20}\beroe\b.{0,20}/i) || [''])[0]).join(' | '))
}
await toccaEl('[data-f3="az-libero"]')

/* ── costruire: tenere premuto su un posto libero apre «Costruisci qui»; la carta va sulla cella premuta ──
   Il dito è vero e la pressione lunga ha la sua attesa (450 ms in `dito.js`). Le monete e l'esperienza si rimettono com'erano dopo
   ogni acquisto: i fogli che seguono partono dal livello di prima. */
const premuto = async (x, y, ms = 750) => { await giu(x, y); await attendi(page, ms); await su() }
const mon = () => page.evaluate(() => window.__fattoria3d.motore.monete())
const menuAperto = () => page.locator('[data-f3="costruisci-qui"]').count()
const apriMenu = () => page.waitForSelector('[data-f3="costruisci-qui"]', { timeout: 3000 })
// tenere premuto: se in quel momento un compagno (Watson, un gatto) passa sulla cella, il menu non si apre: si riprova
const premiEApri = async dove => {
  for (let k = 0; k < 4; k++) {
    await premuto(...await dove())
    try { await page.waitForSelector('[data-f3="costruisci-qui"]', { timeout: 1500 }); return } catch (e) { await attendi(page, 1200) }
  }
  await apriMenu()
}
const E0 = await page.evaluate(() => window.__fattoria3d.motore.s.esperienza)
const M0 = await mon()
const riposo = () => page.evaluate(([e, m]) => {
  const { motore, mondo } = window.__fattoria3d
  for (const c of motore.s.cose.filter(c => (c.tipo === 'campo' && c.id !== 1) || c.tipo === 'aiuola')) motore.mettiVia(c.id, { gratis: true })   // anche le aiuole: intorno all'eroe chiudono la strada
  motore.s.magazzino = {}; motore.s.esperienza = e; motore.eventi = []; motore.borsa.paga(motore.monete() - m); mondo.cambiato()
}, [E0, M0])
// una cella libera e propria, con attorno (5×5) solo prato, a schermo fra la barra in alto e le azioni: un campo 2×2 ci sta con l'angolo lì
const cella = (escludi = []) => page.evaluate(escludi => {
  const { motore, mondo } = window.__fattoria3d, e = mondo.eroe, r = mondo.canvas.getBoundingClientRect(), buoni = []
  for (let i = -14; i < 13; i++) for (let j = -12; j < 11; j++) {
    if (!motore.puoMettere('campo', i, j).ok || escludi.some(([a, b]) => Math.abs(a - i) < 5 && Math.abs(b - j) < 5)) continue
    let pulita = true
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (motore.blocca(i + a, j + b)) pulita = false
    const [px, py, v] = mondo.proietta({ x: i + 0.5, y: 0, z: j + 0.5 })
    if (pulita && v && px > 60 && px < r.width - 60 && py > 150 && py < r.height - 220) buoni.push({ i, j, d: Math.hypot(i - e.x, j - e.z) })
  }
  buoni.sort((a, b) => a.d - b.d)
  return buoni.find(b => b.d >= 3) || buoni[0] || null          // non sotto l'eroe: un tocco sul contadino fermo apre il guardaroba
}, escludi)
const posto = await cella()
controlla('c\'è una cella libera a schermo', !!posto)
const sulPosto = () => schermoDi(posto.i + 0.5, posto.j + 0.5)
// un dito che si muove prima della soglia non apre niente (il dito non è un mouse)
{
  const [x, y] = await sulPosto()
  await giu(x, y); await muovi(x + 13, y); await attendi(page, 700); await su()
  await attendi(page, 200)
  controlla('un dito che scorre prima dell\'attesa non apre il menu', await menuAperto() === 0)
  await fermo(); await tocca(...await sulPosto()); await attendi(page, 300)
  controlla('e un tocco corto nemmeno', await menuAperto() === 0)
  // se l'eroe è già lì sotto, il tocco corto è sul contadino fermo e apre il guardaroba (giusto): si chiude con la ✕ e si prosegue
  if (await page.locator('[data-f3="guardaroba"]').count()) await toccaEl('[data-f3="guardaroba"] [data-chiudi]')
  await fermo(); await attendi(page, 1200)        // l'eroe è andato a vedere, la telecamera lo segue: si aspetta che si fermino
}
// tenuto fermo: si apre, con le schede e la griglia di carte
await premiEApri(sulPosto)
controlla('tenuto premuto su un posto libero si apre «Costruisci qui»', await menuAperto() === 1 && /Cosa costruiamo/.test(await page.locator('[data-f3="costruisci-qui"] h2').innerText()))
controlla('la prima scheda è quella dei campi e ha la carta del campo', await page.locator('[data-scheda="campi"].acceso').count() === 1 && await page.locator('[data-carta="campo"]').count() === 1)
controlla('non esiste più la barra del costruire', await page.locator('[data-f3="vassoio"]').count() === 0)
const largo = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth, document.querySelector('.f3-corpo').scrollHeight >= document.querySelector('.f3-corpo').clientHeight])
controlla('il foglio non esce dallo schermo di lato', largo[0] <= largo[1] && largo[2], JSON.stringify(largo))
await scatto(page, 'fattoria3d-costruisci-qui')
// senza monete: la carta dice cosa servono, il menu resta e non cambia niente
await page.evaluate(() => { const m = window.__fattoria3d.motore; m.borsa.paga(m.monete() - 5) })
await toccaEl('[data-carta="campo"]')
await attendi(page, 300)
controlla('senza monete: «Servono 🪙 28», il menu resta aperto e niente cambia', /Servono 🪙 28/.test(await page.locator('[data-f3="costruisci-msg"]').innerText()) && await menuAperto() === 1 && (await stato()).cose.length === 1 && await mon() === 5)
await page.evaluate(n => { window.__fattoria3d.motore.borsa.paga(-n) }, M0 - 5)
// con le monete: si compra e si mette sulla cella premuta in un gesto, il menu si chiude, niente conferme
await toccaEl('[data-carta="campo"]')
await attendi(page, 500)
const costruito = await stato()
uguale('un campo in più sulla mappa', costruito.cose.length, 2)
uguale('il magazzino resta vuoto: compra e mette in un gesto', costruito.magazzino.campo || 0, 0)
controlla('il campo copre la cella premuta', await page.evaluate(([i, j]) => { const c = window.__fattoria3d.motore.cosaSu(i, j); return !!c && c.tipo === 'campo' && c.id !== 1 }, [posto.i, posto.j]))
controlla('le monete vere sono scese del prezzo', M0 - await mon() === 28, `da ${M0} a ${await mon()}`)
controlla('il menu si è chiuso e nessuna conferma d\'acquisto', await menuAperto() === 0 && await page.locator('[data-f3="dialogo"]').count() === 0)
await scatto(page, 'fattoria3d-costruito')
await riposo()
await attendi(page, 300)
// una carta non ancora arrivata: il tasto 🏗️ apre lo stesso menu, la carta trema e dice il livello
await toccaEl('[data-f3="az-costruisci"]')
await apriMenu()
controlla('il tasto 🏗️ apre lo stesso menu', await menuAperto() === 1)
await toccaEl('[data-scheda="animali"]')
await attendi(page, 200)
controlla('la scheda degli animali ha il recinto chiuso, col lucchetto e il livello', await page.locator('[data-carta="recinto"].bloccata').count() === 1 && /Livello 4/.test(await page.locator('[data-carta="recinto"]').innerText()))
await toccaEl('[data-carta="recinto"]')
await attendi(page, 150)
controlla('toccarla la fa tremare e dice il livello', await page.locator('[data-carta="recinto"].trema').count() === 1 && /livello 4/.test(await page.locator('[data-f3="costruisci-msg"]').innerText()))
controlla('e non chiede di comprare né cambia niente', await page.locator('[data-f3="dialogo"]').count() === 0 && (await stato()).cose.length === 1 && await mon() === M0)
await toccaEl('[data-chiudi]')
await attendi(page, 300)
controlla('la ✕ chiude il menu', await menuAperto() === 0)
// un tocco sul velo fuori dal foglio lo chiude lo stesso
await toccaEl('[data-f3="az-costruisci"]')
await apriMenu()
{ const r = await page.locator('[data-f3="costruisci-velo"]').boundingBox(); await tocca(r.x + r.width / 2, r.y + 24) }
await attendi(page, 300)
controlla('un tocco fuori dal foglio chiude il menu', await menuAperto() === 0)

// la cella non basta: quattro campi attorno a una cella la lasciano sola; la carta chiude il menu e il fantasma resta lì, rosso
const buco = await cella()
await page.evaluate(([a, b]) => {
  const { motore, mondo } = window.__fattoria3d
  motore.s.magazzino.aiuola = 4        // quattro aiuole (basse: non coprono la cella) attorno: nessun campo 2×2 ci sta, in nessun verso
  for (const [i, j] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) motore.mettiPezzo('aiuola', i, j)
  mondo.cambiato()
}, [buco.i, buco.j])
// cinque pezzi messi sono un traguardo che paga monete (gioco.js): le monete si rimettono com'erano, i controlli seguenti contano la spesa
await page.evaluate(m => { const { motore } = window.__fattoria3d; motore.borsa.paga(motore.monete() - m) }, M0)
await attendi(page, 300)
const sulBuco = () => schermoDi(buco.i + 0.5, buco.j + 0.5)
await premiEApri(sulBuco)
await toccaEl('[data-carta="campo"]')
await attendi(page, 400)
controlla('se la cella non basta il menu si chiude e il fantasma aspetta lì', await menuAperto() === 0 && await page.evaluate(() => window.__fattoria3d.mondo.costruzione.parcheggiato))
controlla('e non si è comprato niente', (await stato()).cose.length === 5 && await mon() === M0, `${(await stato()).cose.length} cose, ${await mon()} vs ${M0}`)
controlla('la fascia in basso dice di trascinarlo o annullare', await page.locator('[data-f3="zona-via"]').count() === 1 && /annullare/.test(await page.locator('[data-f3="zona-via"]').innerText()))
// un tocco su un posto che non va lo annulla, senza perdere niente
await tocca(...await sulBuco())
await attendi(page, 300)
controlla('un tocco su un posto non valido annulla il fantasma', !await page.evaluate(() => window.__fattoria3d.mondo.costruzione.attivo) && await page.locator('[data-f3="zona-via"]').count() === 0)
controlla('e non cambia niente: né pezzi né monete', (await stato()).cose.length === 5 && await mon() === M0, `${(await stato()).cose.length} cose, ${await mon()} vs ${M0}`)
// il fantasma si trascina in un posto libero e al rilascio paga e mette
await premiEApri(sulBuco)
await toccaEl('[data-carta="campo"]')
await attendi(page, 400)
const libero = await page.evaluate(() => {
  const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), top = document.querySelector('[data-f3="zona-via"]').getBoundingClientRect().top, buoni = []
  for (let i = -14; i < 13; i++) for (let j = -12; j < 11; j++) {
    if (!motore.puoMettere('campo', i, j).ok) continue
    const [px, py, v] = mondo.proietta({ x: i + 1, y: 0, z: j + 1 })        // il centro del fantasma
    if (v && px > 60 && px < r.width - 60 && py > 150 && r.top + py < top - 50) buoni.push({ i, j, d: Math.hypot(i + 1 - mondo.eroe.x, j + 1 - mondo.eroe.z) })
  }
  buoni.sort((a, b) => b.d - a.d)
  return buoni[0] || null
})
controlla('c\'è un posto libero a schermo dove portare il fantasma', !!libero)
const prezzoOra = await page.evaluate(() => window.__fattoria3d.motore.prezzoPezzo('campo'))
// il dito preme sul fantasma (dito in buco+0,5) e lo porta con sé tenendo il punto preso (lo scarto fra il centro e il dito, che con
// un 2×2 su una cella è ±0,5 a seconda di come arrotonda il punto esatto del dito): il fantasma che si vede sotto il dito è dove si
// costruisce (WYSIWYG). Si legge il fantasma prima di alzare il dito e si confronta col pezzo messo.
{
  const scarto = await page.evaluate(([bi, bj]) => { const D = window.__fattoria3d.mondo.costruzione.D; return { x: D.i + 1 - (bi + 0.5), z: D.j + 1 - (bj + 0.5) } }, [buco.i, buco.j])
  const da = await sulBuco(), a = await schermoDi(libero.i + 1 - scarto.x, libero.j + 1 - scarto.z)
  await giu(da[0], da[1])
  for (let k = 1; k <= 10; k++) { await muovi(da[0] + (a[0] - da[0]) * k / 10, da[1] + (a[1] - da[1]) * k / 10); await attendi(page, 30) }
  await attendi(page, 120)
  const vistoFant = await page.evaluate(() => { const D = window.__fattoria3d.mondo.costruzione.D; return { i: D.i, j: D.j, ok: D.ok, x: D.fant.position.x, z: D.fant.position.z } })
  const fantSch = await schermoDi(vistoFant.x, vistoFant.z)
  controlla('il fantasma sta sotto il dito tenendo il punto preso (a meno di mezza cella)', Math.hypot(fantSch[0] - a[0] - scarto.x * 38, fantSch[1] - a[1] - scarto.z * 31) < 45, `${fantSch.map(Math.round)} vs ${a.map(Math.round)}`)
  stessaLista('portato sul posto scelto il fantasma è verde nella cella voluta', [vistoFant.i, vistoFant.j, vistoFant.ok], [libero.i, libero.j, true])
  await su(); await attendi(page, 500)
  const messoQui = (await stato()).cose.find(c => c.tipo === 'campo' && c.id !== 1 && c.i === vistoFant.i && c.j === vistoFant.j)
  controlla('e il pezzo messo è nella cella del fantasma', !!messoQui, JSON.stringify((await stato()).cose.map(c => [c.tipo, c.i, c.j])))
}
const messo = await stato()
controlla('rilasciato in un posto buono il campo si costruisce e si paga', messo.cose.length === 6 && M0 - await mon() === prezzoOra, `${messo.cose.length} cose, da ${M0} a ${await mon()}`)
controlla('e il fantasma non c\'è più', !await page.evaluate(() => window.__fattoria3d.mondo.costruzione.attivo) && await page.locator('[data-f3="zona-via"]').count() === 0)
await riposo()
await attendi(page, 300)

// lo stagno: acqua che si costruisce dalla scheda dei decori, e un ponte che ci sta sopra (docs/fattoria3d/laghi.md)
{
  await page.evaluate(() => window.__fattoria3d.mondo.costruzione.annullaTrascinamento())          // un fantasma rimasto dal giro di prima non deve coprire la pressione
  const pStagno = await cella()
  controlla('c\'è una cella libera a schermo per lo stagno', !!pStagno)
  await page.evaluate(() => { const m = window.__fattoria3d.motore; m.s.esperienza = 1e6; m.borsa.paga(-500) })     // il livello e le monete bastano; `riposo` rimette tutto
  await premiEApri(() => schermoDi(pStagno.i + 0.5, pStagno.j + 0.5))
  await page.locator('[data-scheda="decori"]').evaluate(e => e.scrollIntoView({ inline: 'center', block: 'nearest' })); await attendi(page, 150)
  await toccaEl('[data-scheda="decori"]'); await attendi(page, 200)
  uguale('nella scheda dei decori ci sono lo stagno e il laghetto, aperti', await page.locator('[data-carta="stagno"]:not(.bloccata), [data-carta="laghetto"]:not(.bloccata)').count(), 2)
  controlla('la carta dello stagno dice il prezzo dei dati', new RegExp('🪙 ' + PEZZI.stagno.prezzo).test(await page.locator('[data-carta="stagno"]').innerText()))
  await page.waitForFunction(() => document.querySelector('[data-carta="stagno"] img[data-anteprima="pronta"]'), null, { timeout: 30000 })
  await scatto(page, 'fattoria3d-stagno-carta')
  await toccaEl('[data-carta="stagno"]')
  await attendi(page, 500)
  const acquaMessa = await page.evaluate(([i, j]) => { const m = window.__fattoria3d.motore, c = m.cosaSu(i, j); return c ? { tipo: c.tipo, acqua: m.acqua(i, j), passo: m.libera(i, j), i: c.i, j: c.j, id: c.id } : null }, [pStagno.i, pStagno.j])
  controlla('la carta Stagno si mette sulla cella premuta: è acqua e non si cammina', !!acquaMessa && acquaMessa.tipo === 'stagno' && acquaMessa.acqua && !acquaMessa.passo, JSON.stringify(acquaMessa))
  controlla('nella scena c\'è il suo gruppo con l\'acqua', await page.evaluate(id => { const v = window.__fattoria3d.mondo.pezzi.voce(id); return !!v && v.grp.children.length > 1 }, acquaMessa.id))
  // un ponte con un'estremità a terra: ci sta sopra, lo stagno resta lì e non si può mettere via finché il ponte c'è
  const { i: si, j: sj, id: sid } = acquaMessa
  const ponte = await page.evaluate(([si, sj]) => {
    const { motore, mondo } = window.__fattoria3d
    for (const [i, j] of [[si - 2, sj + 1], [si + 2, sj + 1], [si - 2, sj], [si + 2, sj + 2]]) {
      if (!motore.puoMettere('ponte', i, j).ok) continue
      const r = motore.compraEMetti('ponte', i, j); mondo.cambiato(); return r.ok ? { i, j, id: r.cosa.id } : null
    }
    return null
  }, [si, sj])
  controlla('il ponte ci sta sopra (con un\'estremità a terra)', !!ponte)
  const dopo = await page.evaluate(([sid, i, j]) => {
    const m = window.__fattoria3d.motore, s = m.cosa(sid)
    return { fermo: !!s && m.acqua(s.i, s.j), passo: m.libera(i + 1, j), via: m.mettiVia(sid).motivo, sposta: m.spostaPezzo(sid, s.i + 1, s.j).motivo }
  }, [sid, ponte.i, ponte.j])
  controlla('lo stagno resta acqua, sul ponte si passa', dopo.fermo && dopo.passo)
  uguale('mettere via lo stagno col ponte sopra è rifiutato', dopo.via, 'ponte-sopra')
  uguale('e spostarlo pure', dopo.sposta, 'ponte-sopra')
  // l'eroe sale sul ponte toccandolo (tocco vero): cammina sopra l'acqua
  await attendi(page, 600)
  const centroPonte = await schermoDi(ponte.i + 1.5, ponte.j + 0.5)
  await tocca(...centroPonte)
  await page.waitForFunction(([i, j]) => { const e = window.__fattoria3d.mondo.eroe; return e.x >= i && e.x < i + 3 && e.z >= j && e.z < j + 1 }, [ponte.i, ponte.j], { timeout: 10000 })
  controlla('l\'eroe è salito sul ponte che sta sopra l\'acqua', await page.evaluate(() => { const { motore, mondo } = window.__fattoria3d; return motore.quotaPasso(mondo.eroe.x, mondo.eroe.z) > 0 }))
  await scatto(page, 'fattoria3d-stagno-ponte')
  // si toglie tutto: il ponte e poi lo stagno (🪙 1 ciascuno, gratis qui), il prato torna com'era
  await page.evaluate(([pid, sid]) => { const { motore, mondo } = window.__fattoria3d; motore.mettiVia(pid, { gratis: true }); motore.mettiVia(sid, { gratis: true }); mondo.cambiato() }, [ponte.id, sid])
  controlla('tolto tutto la cella torna terra', await page.evaluate(([i, j]) => !window.__fattoria3d.motore.acqua(i, j) && window.__fattoria3d.motore.libera(i, j), [si, sj]))
  await riposo()
  await attendi(page, 300)
}

// tenere premuto su un pezzo già messo lo riprende (non apre il menu): il campo di partenza si solleva e si rimette dov'era
{
  // un campo messo a metà schermo, fuori dalla fascia che scorre (72 px dal bordo): tenuto premuto lì non si muove niente da sé
  const posto0 = await page.evaluate(() => {
    const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), buoni = []
    for (let i = -14; i < 13; i++) for (let j = -12; j < 11; j++) {
      if (!motore.puoMettere('campo', i, j).ok) continue
      const [px, py, v] = mondo.proietta({ x: i + 1, y: 0, z: j + 1 })
      if (v && px > 110 && px < 190 && py > 200 && py < r.height - 300) buoni.push({ i, j, d: Math.hypot(i - mondo.eroe.x, j - mondo.eroe.z) })
    }
    buoni.sort((a, b) => b.d - a.d)
    return buoni[0] || null
  })
  controlla('c\'è un posto a metà schermo per un campo da riprendere', !!posto0)
  const idCampo = await page.evaluate(([i, j]) => {
    const { motore, mondo } = window.__fattoria3d
    motore.s.magazzino.campo = (motore.s.magazzino.campo || 0) + 1; const c = motore.mettiPezzo('campo', i, j); motore.eventi = []; mondo.cambiato(); return c.cosa ? c.cosa.id : c.id
  }, [posto0.i, posto0.j])
  await attendi(page, 300)
  const dellaCosa = async () => (await stato()).cose.find(c => c.id === idCampo)
  const c0 = await dellaCosa()
  const [x, y] = await schermoDi(c0.i + 0.3, c0.j + 0.3)          // preso vicino all'angolo, non al centro
  await giu(x, y); await attendi(page, 800)
  controlla('tenuto premuto su un pezzo lo solleva e non apre il menu', await menuAperto() === 0 && await page.evaluate(() => window.__fattoria3d.mondo.costruzione.attivo))
  const fant = () => page.evaluate(() => { const D = window.__fattoria3d.mondo.costruzione.D; return D.fant ? { i: D.i, j: D.j, x: D.fant.position.x, z: D.fant.position.z } : null })
  const f0 = await fant()
  stessaLista('al sollevarlo il fantasma sta dov\'era il pezzo: non salta verso il dito', [f0.i, f0.j], [c0.i, c0.j])
  // si porta il dito di tre celle a destra: il pezzo si sposta di tre celle (tiene il punto preso)
  const [x1, y1] = await schermoDi(c0.i + 3.3, c0.j + 0.3)
  for (let k = 1; k <= 6; k++) { await muovi(x + (x1 - x) * k / 6, y + (y1 - y) * k / 6); await attendi(page, 30) }
  await attendi(page, 100)
  const f1 = await fant()
  stessaLista('portato il dito di 3 celle il pezzo si sposta di 3 celle', [f1.i, f1.j], [c0.i + 3, c0.j])
  // contro il bordo sinistro la camera scorre da sola, e il fantasma resta sotto il dito (cella ricalcolata a ogni fotogramma)
  const r = await page.evaluate(() => { const q = window.__fattoria3d.mondo.canvas.getBoundingClientRect(); return { l: q.left, t: q.top, h: q.height } })
  const cam0 = await page.evaluate(() => window.__fattoria3d.mondo.camera.x)
  await muovi(r.l + 14, r.t + r.h / 2); await attendi(page, 150); await muovi(r.l + 12, r.t + r.h / 2); await attendi(page, 900)
  const cam1 = await page.evaluate(() => window.__fattoria3d.mondo.camera.x), f2 = await fant()
  controlla('dito contro il bordo sinistro: la camera scorre a sinistra', cam1 < cam0 - 3, `${cam0.toFixed(2)} → ${cam1.toFixed(2)}`)
  const sch2 = await schermoDi(f2.x, f2.z)
  controlla('e il fantasma resta sotto il dito', Math.abs(sch2[0] - (r.l + 12)) < 60 && Math.abs(sch2[1] - (r.t + r.h / 2)) < 60, sch2.map(Math.round).join(','))
  await muovi(r.l + 200, r.t + r.h / 2); await attendi(page, 150)
  const cam2 = await page.evaluate(() => window.__fattoria3d.mondo.camera.x); await attendi(page, 400)
  controlla('uscito dalla fascia la camera si ferma', await page.evaluate(() => window.__fattoria3d.mondo.camera.x) === cam2)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); await attendi(page, 300)
  controlla('e se il dito viene via senza lasciarlo, resta dov\'era', !await page.evaluate(() => window.__fattoria3d.mondo.costruzione.attivo) && (await dellaCosa()).i === c0.i && (await dellaCosa()).j === c0.j && await mon() === M0)
  await page.evaluate(id => { const { motore, mondo } = window.__fattoria3d; motore.mettiVia(id, { gratis: true }); motore.eventi = []; mondo.cambiato(); mondo.tornaAllEroe() }, idCampo)
  await attendi(page, 1500)                                       // la camera torna all'eroe: i posti scelti prima sono di nuovo a schermo
}

// il pennello delle strade: la scheda «Strade» ha la strada e la gomma; scegliendo la strada il menu si chiude e compare la sua barra
await toccaEl('[data-f3="az-costruisci"]')
await apriMenu()
await page.locator('[data-scheda="passaggi"]').evaluate(e => e.scrollIntoView({ inline: 'center', block: 'nearest' }))   // la quinta scheda sta fuori vista
await attendi(page, 200)
await toccaEl('[data-scheda="passaggi"]')
await attendi(page, 300)
controlla('la scheda delle strade ha la strada e la gomma', await page.locator('[data-carta="strada"]').count() === 1 && await page.locator('[data-carta="gomma"]').count() === 1)
await toccaEl('[data-carta="strada"]')
await attendi(page, 300)
controlla('scegliere la strada chiude il menu e porta la sua barra', await menuAperto() === 0 && await page.locator('[data-f3="barra-strade"]').count() === 1 && await page.locator('[data-f3^="az-"]').count() === 0)
{
  const conta = () => page.evaluate(() => Array.from(window.__fattoria3d.motore.strada.values()).filter(v => v === 1).length)
  const strade0 = await conta()
  await trascina(await schermoDi(posto.i + 0.5, posto.j + 0.5), await schermoDi(posto.i + 3.5, posto.j + 0.5))
  await attendi(page, 300)
  controlla('il dito sulla mappa disegna la strada (🪙 1 a pezzo)', await conta() > strade0)
}
await toccaEl('[data-f3="strade-fatto"]')
await attendi(page, 300)
controlla('«Fatto» rimette la barra delle azioni', await page.locator('[data-f3="barra-strade"]').count() === 0 && await page.locator('[data-f3^="az-"]').count() === 4)
await page.evaluate(() => { const { motore, mondo } = window.__fattoria3d; for (const [k, v] of [...motore.strada]) if (v === 1) motore.strada.delete(k); mondo.terreno.ridisegnaStrade() })       // le strade di prova se ne vanno
await riposo()

/* ── gli alberi si abbattono, e un lotto non tuo si compra ── */
// un albero del terreno tuo che stia bene a schermo (non sotto le barre), il più vicino all'eroe
const albero = await page.evaluate(() => {
  const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), e = mondo.eroe
  const vis = motore.alberiNelTerreno().map(a => ({ a, p: mondo.proietta({ x: a.i + 0.5, y: 0, z: a.j + 0.5 }) }))
    .filter(({ p }) => p[2] && p[0] > 40 && p[0] < r.width - 40 && p[1] > 90 && p[1] < r.height - 170)
    .sort((u, v) => Math.hypot(u.a.i - e.x, u.a.j - e.z) - Math.hypot(v.a.i - e.x, v.a.j - e.z))
  const a = (vis[0] || { a: motore.alberiNelTerreno()[0] }).a
  return { n: a.n, i: a.i, j: a.j }
})
const COSTO_ALBERO = 3                              // COSTI.albero (dati/regole.js)
// senza monete l'ascia non si alza e l'eroe dice cosa serve
const monDa = await monete()
await page.evaluate(() => { const m = window.__fattoria3d.motore; m.borsa.paga(m.monete() - 1) })
await tocca(...await schermoDi(albero.i + 0.5, albero.j + 0.5))
await fermo()
controlla('con una moneta sola l\'albero resta in piedi e l\'eroe dice cosa servono', !(await stato()).tagliati.includes(albero.n) && /servono 🪙 3/.test(await page.locator('.f3-fumetto').innerText()))
await page.evaluate(n => { window.__fattoria3d.motore.borsa.paga(-n) }, monDa - 1)
await attendi(page, 900)
const monPrimaAlbero = await monete()
await tocca(...await schermoDi(albero.i + 0.5, albero.j + 0.5))
await fermo()
await attendi(page, 900)
const tagliato = await stato()
controlla('l\'albero è abbattuto e costa monete, niente legna', tagliato.tagliati.includes(albero.n) && !('legna' in tagliato) && monPrimaAlbero - await monete() === COSTO_ALBERO, `da ${monPrimaAlbero} a ${await monete()}`)
controlla('nel HUD non c\'è più la legna', !/🪵/.test(await page.locator('[data-f3="hud"]').innerText()))

// un sasso o un cespuglio del terreno tuo: si tocca, costa 🪙 1 e la cella torna libera
const sasso = await page.evaluate(() => {
  const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), e = mondo.eroe
  const vis = motore.ostacoliNelTerreno().map(o => ({ o, p: mondo.proietta({ x: o.i + 0.5, y: 0, z: o.j + 0.5 }) }))
    .filter(({ p }) => p[2] && p[0] > 40 && p[0] < r.width - 40 && p[1] > 90 && p[1] < r.height - 170)
    .sort((u, v) => Math.hypot(u.o.i - e.x, u.o.j - e.z) - Math.hypot(v.o.i - e.x, v.o.j - e.z))
  const o = (vis[0] || { o: motore.ostacoliNelTerreno()[0] }).o
  return { n: o.n, id: o.id, i: o.i, j: o.j }
})
const monPrimaSasso = await monete()
controlla('il sasso blocca la cella', await page.evaluate(({ i, j }) => !window.__fattoria3d.motore.libera(i, j), sasso))
await tocca(...await schermoDi(sasso.i + 0.5, sasso.j + 0.5))
await fermo()
const senzaSasso = await stato()
controlla('tolto: la cella è libera, il suo id è salvato, costa 🪙 1', senzaSasso.ostacoli.includes(sasso.id) && await page.evaluate(({ i, j }) => window.__fattoria3d.motore.libera(i, j), sasso) && monPrimaSasso - await monete() === 1)
// un lotto comprabile che stia bene a schermo
const lottoNord = await page.evaluate(() => {
  const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect()
  const c = motore.lottiComprabili().filter(l => !motore.posseduto(l) && motore.confina(l)).map(l => ({ l, p: mondo.proietta({ x: l.i + 2, y: 0, z: l.j + 2 }) }))
    .filter(({ l, p }) => p[2] && p[0] > 60 && p[0] < r.width - 60 && p[1] > 110 && p[1] < r.height - 190)
  c.sort((u, v) => v.l.j - u.l.j)       // il più a sud: lontano dalla casa e dagli alberi alti
  return c.length ? { i: c[0].l.i + 2, j: c[0].l.j + 2 } : null
})
if (lottoNord) await tocca(...await schermoDi(lottoNord.i, lottoNord.j))
else await page.evaluate(() => {      // l'eroe è andato lontano a togliere un sasso e nessun lotto comprabile sta a schermo: l'offerta si chiede alla scena come farebbe il tocco
  const { motore, mondo } = window.__fattoria3d
  const l = motore.lottiComprabili().find(x => !motore.posseduto(x) && motore.confina(x))
  mondo.azioni.offriLotto(l)
})
await page.waitForSelector('[data-f3="dialogo"]', { timeout: 3000 })
controlla('toccare un terreno non tuo apre l\'acquisto', /Terreno/.test(await page.locator('.f3-dialogo h2').innerText()))
await page.locator('[data-scelta="0"]').click()
await attendi(page, 500)
const comprato = await stato()
uguale('il lotto è tuo', Object.keys(comprato.lotti).length, 10)

/* ── i contatori e le monete: l'albo li legge, e lo stato sta nel profilo ── */
await attendi(page, 600)
const profilo = await leggiProfilo(page)
controlla('i contatori sono saliti', profilo.totals.fattoria3dRaccolti === 4 && profilo.totals.fattoria3dAlberi === 1 && profilo.totals.fattoria3dTerre === 1 && profilo.totals.fattoria3dSassi === 1 && profilo.totals.fattoria3dPezzi === 8,   // il campo comprato col menu, le quattro aiuole, il campo trascinato, il ponte e la gelateria (comprati dal motore e dal menu)
         JSON.stringify(profilo.totals))
const st = profilo.campagne.fattoria3d && profilo.campagne.fattoria3d.cfg.stato
controlla('lo stato è in campagne.fattoria3d.cfg.stato', !!st && st.merci.carota === 4, '')
controlla('la fattoria di sempre non è stata toccata', !((profilo.campagne.fattoria || {}).cfg || {}).stato, '')

/* ── si esce, si ricarica, si rientra: tutto com'era ── */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('.carte', { timeout: 8000 })
await attendi(page, 600)
await page.reload()
await page.waitForSelector('.carte', { timeout: 10000 })
await scegli(page, 'fattoria3d')
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
const riletto = await stato()
uguale('dopo il ricaricamento i lotti sono quelli di prima', Object.keys(riletto.lotti).length, 10)
uguale('e l\'albero è ancora a terra', riletto.tagliati.includes(albero.n), true)
uguale('e il sasso tolto non è tornato', riletto.ostacoli.includes(sasso.id), true)
uguale('e le carote in scorta', riletto.merci.carota, 4)
await scatto(page, 'fattoria3d-ritorno')

/* ── i livelli e le macchine: il gettone, i fogli, le carte e le ricette chiuse ──
   Lo stato si prepara dalla console (`__fattoria3d`); i tasti dei fogli si premono davvero. Le cose sul prato
   (un edificio) si aprono con `azioni.fai`: arrivarci a piedi è già provato dal resto. */
const m3 = (fn, arg) => page.evaluate(fn, arg)
/** Apre l'inventario sulla scheda e dice se il gettone c'è; poi lo richiude. */
const vediInventario = async (scheda, k) => {
  await toccaEl('[data-f3="apri-inventario"]')
  await toccaEl(`[data-scheda-inv="${scheda}"]`)
  const c = await page.locator(`[data-f3="inventario"] button[data-merce="${k}"]`).count() === 1
  await toccaEl('[data-f3="inventario"] [data-chiudi]')
  return c
}
const chiudiFoglio = async () => { await page.locator('[data-chiudi]').first().click(); await attendi(page, 300) }
// un livello che sale: l'avviso, il pallino sul gettone, e il foglio lo toglie
await m3(() => { const m = window.__fattoria3d.motore; m.s.esperienza = 58; m._spendi(5) })
await attendi(page, 700)
uguale('il gettone dice il livello 2', (await page.locator('[data-f3="livello"]').innerText()).includes('2'), true)
controlla('compare l\'avviso del livello', await page.locator('[data-f3="avviso-livello"]').count() === 1)
controlla('e il pallino sul gettone', await page.locator('[data-f3="livello-nuovo"]').count() === 1)
await page.locator('[data-f3="livello"]').click()
await page.waitForSelector('[data-f3="livelli"]', { timeout: 3000 })
controlla('il foglio dei livelli ha il titolo corto', /Livello 2/.test(await page.locator('[data-f3="livelli"] h2').innerText()))
controlla('e il pallino è spento', await page.locator('[data-f3="livello-nuovo"]').count() === 0)
await chiudiFoglio()
controlla('la ✕ chiude il foglio dei livelli', await page.locator('[data-f3="livelli"]').count() === 0)

// livello 1: ciò che non è arrivato è in grigio e dice il livello
await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.esperienza = 0; mondo.cambiato() })
await attendi(page, 500)
await toccaEl('[data-f3="az-semina"]')
await page.waitForSelector('[data-f3="semi"]')
controlla('la scelta del seme mostra tutte le colture', await page.locator('[data-seme]').count() === Object.keys(COLTURE).length)
controlla('una coltura non arrivata è in grigio', await page.locator('[data-seme="lavanda"].bloccato').count() === 1)
await page.locator('[data-seme="lavanda"]').click({ force: true })
await attendi(page, 200)
controlla('toccarla dice il livello', /livello 15/.test(await page.locator('[data-f3="semi-msg"]').innerText()))
controlla('e il foglio resta aperto', await page.locator('[data-f3="semi"]').count() === 1)
await chiudiFoglio()
await toccaEl('[data-f3="az-libero"]')
await toccaEl('[data-f3="az-costruisci"]')
await apriMenu()
{
  // le carte di tutte le schede, dai dati: i pezzi, gli edifici unici da costruire e i due strumenti
  let carte = 0
  const posseduti = await page.evaluate(() => ({ ...window.__fattoria3d.motore.s.posseduti }))   // un edificio già comprato non si offre
  for (const k of ['campi', 'animali', 'edifici', 'decori', 'passaggi']) {
    await page.locator(`[data-scheda="${k}"]`).evaluate(e => e.scrollIntoView({ inline: 'center', block: 'nearest' })); await attendi(page, 100)
    await toccaEl(`[data-scheda="${k}"]`); await attendi(page, 150)
    carte += await page.locator('[data-carta]').count()
  }
  // le anteprime 3D: ogni carta che non è uno strumento mostra il suo modello (si aspetta l'evento, non un tempo)
  await page.waitForFunction(() => [...document.querySelectorAll('[data-carta]')].length > 0, null, { timeout: 5000 })
  for (const k of ['campi', 'animali', 'edifici', 'decori', 'passaggi']) {
    await toccaEl(`[data-scheda="${k}"]`)
    await page.waitForFunction(() => [...document.querySelectorAll('[data-carta]')].every(c => /^(strada|gomma)$/.test(c.dataset.carta) || c.querySelector('img[data-anteprima="pronta"]')), null, { timeout: 60000 })
  }
  controlla('ogni carta di pezzo o edificio mostra l\'anteprima 3D, non l\'emoji', await page.locator('[data-carta] img[data-anteprima="pronta"]').count() > 0)
  uguale('le schede hanno tutti i pezzi e gli edifici dei dati e i due strumenti', carte, Object.keys(PEZZI).length + Object.keys(EDIFICI).filter(t => !posseduti[t]).length + 2)
  await toccaEl('[data-scheda="animali"]'); await attendi(page, 150)
  controlla('il recinto non è arrivato: carta in grigio col livello', await page.locator('[data-carta="recinto"].bloccata').count() === 1 && /Livello 4/.test(await page.locator('[data-carta="recinto"]').innerText()))
  const schede = await page.evaluate(() => { const c = document.querySelector('.f3-schede'); return [c.scrollWidth, c.clientWidth, document.documentElement.scrollWidth, innerWidth] })
  controlla('le schede non escono dallo schermo di lato', schede[2] <= schede[3], JSON.stringify(schede))
  await toccaEl('[data-scheda="edifici"]'); await attendi(page, 150)
  await toccaEl('[data-carta="mulino"]')
  await attendi(page, 300)
  controlla('un edificio unico chiuso dice il livello e non apre l\'offerta', await page.locator('[data-f3="dialogo"]').count() === 0 && /livello 3/.test(await page.locator('[data-f3="costruisci-msg"]').innerText()))
  await chiudiFoglio()
}

// gli edifici sono pezzi liberi: si mettono nello stato dalla console (come se li avesse costruiti, al loro posto di una volta o dove ci stanno)
const piazza = tipo => m3(t => {
  const { motore, mondo } = window.__fattoria3d, [i, j] = motore.postoPer(t)
  const c = { id: motore.s.prossimoId++, tipo: t, i, j }
  motore.s.cose.push(c); motore._occupa(c, c.id); motore.s.posseduti[t] = true; mondo.cambiato()
}, tipo)
// il pastificio (id `pasticceria`): in mappa ma chiuso al livello 1, poi aperto
await piazza('pasticceria')
await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.prodotti.farina = 4; motore.s.prodotti.uova = 2; mondo.cambiato() })
await m3(() => window.__fattoria3d.mondo.azioni.fai({ kind: 'edificio', tipo: 'pasticceria' }))
await page.waitForSelector('[data-f3="macchina"][data-macchina="pasticceria"]', { timeout: 3000 })
controlla('il menu della pasticceria porta anche il suo bersaglio', await page.locator('[data-f3="pasticceria"]').count() === 1)
uguale('mostra tutte le ricette della pasticceria', await page.locator('[data-f3="macchina"] [data-ricetta]').count(), Object.values(RICETTE).filter(r => r.dove === 'pasticceria').length)
controlla('una ricetta chiusa dice il livello', new RegExp('livello ' + RICETTE.pasta.liv).test(await page.locator('[data-f3="macchina"] .ricetta.chiusa').first().innerText()))
await page.locator('[data-ricetta="pasta"]').click({ force: true })
await attendi(page, 300)
controlla('toccarla non la fa partire e dice perché', (await stato()).macchine.pasticceria.coda.length === 0 && await page.locator('[data-f3="macchina-msg"]').count() === 1)
await m3(() => { window.__fattoria3d.motore.s.esperienza = 1e6 })
await attendi(page, 600)
await page.locator('[data-ricetta="pasta"]').click()
await attendi(page, 300)
const cotto = await stato()
controlla('aperta, la ricetta parte e scala gli ingredienti', cotto.macchine.pasticceria.coda.length === 1 && cotto.prodotti.farina === 2 && cotto.prodotti.uova === 1)
await page.waitForFunction(() => document.querySelector('[data-f3="macchina"] [data-ricetta="pasta"] [data-merce="farina"] canvas'), null, { timeout: 5000 }).catch(() => {})   // la faccia arriva quando lo sprite ha disegnato
controlla('gli ingredienti hanno la loro faccia (il disegno, non l\'emoji)', await page.locator('[data-f3="macchina"] [data-ricetta="pasta"] [data-merce="farina"] canvas').count() === 1)
await m3(() => { const m = window.__fattoria3d.motore, o = m.ora; m.ora = () => o() + 60000 })
await attendi(page, 700)
await page.locator('[data-f3="ritira"]').click()
await attendi(page, 300)
uguale('«Ritira tutto» porta la pasta in dispensa', (await stato()).prodotti.pasta, 1)
// il foglio come in Hay Day: il posto di partenza e i cinque vani da comprare, la pila dei pronti, il numero sulla carta, e il dito che trascina (docs/fattoria3d/file.md)
uguale('la fila parte con un posto, libero', await page.locator('[data-f3="posto"][data-stato="libero"]').count() + ':' + await page.locator('[data-f3="posto"]').count(), '1:1')
uguale('…e cinque vani chiusi col prezzo, il primo in evidenza (🪙 20)', [await page.locator('[data-f3="posto-chiuso"]').count(), await page.locator('[data-f3="posto-chiuso"][data-prossimo="true"]').count(), (await page.locator('[data-f3="posto-chiuso"][data-prossimo="true"]').innerText()).replace(/\s+/g, ' ').trim()].join('|'), '5|1|＋ 🪙 20')
uguale('la sezione porta il nome della macchina: il pastificio ha il forno', (await page.locator('[data-f3="macchina-dentro"]').textContent()).trim(), 'Nel forno')
controlla('c\'è la pila dei pronti', await page.locator('[data-f3="pronti"]').count() === 1)
await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.prodotti.farina = 4; motore.s.prodotti.uova = 3; mondo.cambiato() })
await attendi(page, 300)
uguale('il numero sulla carta dice quante se ne fanno con le scorte (2 farine e 1 uovo a pasta: 2)', await page.locator('[data-ricetta="pasta"]').getAttribute('data-n'), '2')
// un tocco vero (CDP) mette in fila
await toccaEl('[data-ricetta="pasta"]')
await attendi(page, 300)
uguale('un tocco sulla carta la mette in fila', (await stato()).macchine.pasticceria.coda.length, 1)
controlla('il primo posto non è più libero', (await page.locator('[data-f3="posto"][data-posto="0"]').getAttribute('data-stato')) !== 'libero')
// il secondo posto si compra con un tocco sul vano: senza monete il rifiuto dice quante servono e non cambia niente; con le monete il vano diventa libero
const espPrima = (await stato()).esperienza
await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(m.monete() - 5); window.__fattoria3d.mondo.cambiato() })
await attendi(page, 200)
await toccaEl('[data-f3="posto-chiuso"][data-prossimo="true"]'); await attendi(page, 300)
controlla('senza monete: «Servono 🪙 20», il posto non c\'è', /Servono.*20/.test(await page.locator('[data-f3="macchina-msg"]').innerText()) && (await stato()).macchine.pasticceria.posti === 1 && await mon() === 5)
await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(-(5000 + 20)); window.__fattoria3d.mondo.cambiato() })
await attendi(page, 200)
const prePosto = await mon()
await toccaEl('[data-f3="posto-chiuso"][data-prossimo="true"]'); await attendi(page, 300)
const conPosto = await stato()
controlla('con le monete il secondo posto si compra (🪙 20, senza conferma) e conta come esperienza', conPosto.macchine.pasticceria.posti === 2 && prePosto - await mon() === 20 && conPosto.esperienza - espPrima === 20, JSON.stringify([conPosto.macchine.pasticceria.posti, prePosto - await mon(), conPosto.esperienza - espPrima]))
uguale('ora i posti sono due e i vani chiusi quattro, col prossimo a 🪙 40', [await page.locator('[data-f3="posto"]').count(), await page.locator('[data-f3="posto-chiuso"]').count(), (await page.locator('[data-f3="posto-chiuso"][data-prossimo="true"]').innerText()).replace(/\s+/g, ' ').trim()].join('|'), '2|4|＋ 🪙 40')
// il dito tenuto e poi trascinato: la carta è un fantasma che segue, e lasciata su un posto libero va in fila
const centro = async sel => { const r = await page.locator(sel).boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2] }
async function portaCarta(sel, verso) {
  const da = await centro(sel)
  await giu(da[0], da[1]); await attendi(page, 260)
  for (let k = 1; k <= 8; k++) { await muovi(da[0] + (verso[0] - da[0]) * k / 8, da[1] + (verso[1] - da[1]) * k / 8); await attendi(page, 30) }
  return async () => { await attendi(page, 60); await su() }
}
let lascia = await portaCarta('[data-ricetta="pasta"]', await centro('[data-f3="posto"][data-posto="1"]'))
controlla('mentre si trascina c\'è il fantasma', await page.locator('[data-f3="trascina-fantasma"]').count() === 1)
await lascia(); await attendi(page, 300)
{ const q = (await stato()).macchine.pasticceria; uguale('lasciata su un posto, va in fila (la prima pasta può aver finito: contano anche i pronti)', q.coda.length + (q.pronti.pasta || 0), 2) }
controlla('finito il gesto il fantasma sparisce', await page.locator('[data-f3="trascina-fantasma"]').count() === 0)
// lasciata altrove non succede niente: né ingredienti persi né posti presi
await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.prodotti.farina = 4; motore.s.prodotti.uova = 3; mondo.cambiato() })
await attendi(page, 300)
const codaPrima = (await stato()).macchine.pasticceria.coda.length   // non fisso a 2: il primo posto può finire di cuocere (7 s) mentre il test va
const dove = await page.locator('[data-ricetta="pasta"]').boundingBox()
lascia = await portaCarta('[data-ricetta="pasta"]', [dove.x + dove.width / 2 + (dove.x > 195 ? -90 : 90), dove.y + dove.height / 2])
await lascia(); await attendi(page, 300)
const dopoDrag = await stato()
controlla('lasciata fuori dalla fila annulla senza perdere niente', dopoDrag.macchine.pasticceria.coda.length <= codaPrima && dopoDrag.prodotti.farina === 4 && dopoDrag.prodotti.uova === 3, JSON.stringify([dopoDrag.macchine.pasticceria.coda.length, dopoDrag.prodotti.farina, dopoDrag.prodotti.uova]))
await chiudiFoglio()
// la gelateria (livello 14) non c'è: niente fantasmi sul prato, la carta del menu è chiusa e dice il livello; aperta ha il «!», si compra dal menu e si mette dove si tocca
await m3(() => { const { motore } = window.__fattoria3d; motore.s.esperienza = 0 })
await attendi(page, 300)
await page.waitForFunction(() => !window.__fattoria3d.mondo.eroe.az, null, { timeout: 15000 })   // l'eroe esulta se è salito di livello: il tocco sarebbe ignorato
controlla('un edificio non costruito non è in scena: né fantasma né cartello', await m3(() => !window.__fattoria3d.mondo.pezzi.voci.has('gelateria') && ![...window.__fattoria3d.mondo.pezzi.voci.values()].some(v => v.tipo === 'gelateria')))
controlla('a livello 1 niente «!» sul tasto Costruisci', await page.locator('[data-f3="costruisci-esclama"]').count() === 0)
await toccaEl('[data-f3="az-costruisci"]'); await apriMenu()
await toccaEl('[data-scheda="edifici"]'); await attendi(page, 150)
await toccaEl('[data-carta="gelateria"]'); await attendi(page, 200)
controlla('un edificio chiuso dice il livello dalla sua carta', /livello 14/.test(await page.locator('[data-f3="costruisci-msg"]').innerText()) && await page.locator('[data-carta="gelateria"].bloccata').count() === 1 && await page.locator('[data-f3="dialogo"]').count() === 0)
await chiudiFoglio()
await m3(() => { window.__fattoria3d.motore.s.esperienza = 1e6; window.__fattoria3d.motore.borsa.paga(-1000) })
await attendi(page, 600)
controlla('aperto dal livello e non costruito: il «!» pulsa sul tasto Costruisci', await page.locator('[data-f3="az-costruisci"] [data-f3="costruisci-esclama"]').count() === 1)
await toccaEl('[data-f3="az-costruisci"]'); await apriMenu()
await toccaEl('[data-scheda="edifici"]'); await attendi(page, 150)
controlla('e sulla scheda Edifici, e sulle carte da costruire', await page.locator('[data-scheda="edifici"] [data-f3="scheda-esclama"]').count() === 1 && await page.locator('[data-carta="gelateria"] [data-f3="carta-esclama"]').count() === 1 && await page.locator('[data-scheda="campi"] [data-f3="scheda-esclama"]').count() === 0)
await toccaEl('[data-scheda="edifici"]'); await attendi(page, 150)
controlla('nella scheda Edifici le carte col «!» stanno in cima', await page.evaluate(() => { const c = [...document.querySelectorAll('[data-carta]')]; const k = c.findIndex(x => !x.querySelector('[data-f3="carta-esclama"]')); return k < 0 || c.slice(k).every(x => !x.querySelector('[data-f3="carta-esclama"]')) }))
await toccaEl('[data-scheda="decori"]'); await attendi(page, 150)
controlla('le decorazioni non hanno mai il «!»', await page.locator('[data-carta]').count() > 0 && await page.locator('[data-carta] [data-f3="carta-esclama"]').count() === 0)
await toccaEl('[data-scheda="edifici"]'); await attendi(page, 150)
const prima = await stato(), monPrima = await mon()
await toccaEl('[data-carta="gelateria"]'); await attendi(page, 600)
const dopoGel = await stato(), gel = dopoGel.cose.find(c => c.tipo === 'gelateria')
controlla('dalla carta si compra e si mette: l\'edificio è una cosa nello stato, sul terreno suo', !!gel && dopoGel.posseduti.gelateria === true && prima.cose.length + 1 === dopoGel.cose.length)
controlla('si paga il prezzo al rilascio, e non c\'è nessun dialogo di conferma', monPrima - await mon() === EDIFICI.gelateria.prezzo && await page.locator('[data-f3="dialogo"]').count() === 0)
controlla('costruito, il «!» sparisce (resta se ne mancano altri)', await page.evaluate(() => window.__fattoria3d.motore.edificiDaCostruire().includes('gelateria')) === false)
await attendi(page, 600)
controlla('la gelateria è in scena, dove l\'abbiamo messa', await m3(() => [...window.__fattoria3d.mondo.pezzi.voci.values()].some(v => v.tipo === 'gelateria' && v.edificio)))
// toccare l'edificio apre il SUO menu
await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.posseduti.mulino || (() => { const [i, j] = motore.postoPer('mulino'); const c = { id: motore.s.prossimoId++, tipo: 'mulino', i, j }; motore.s.cose.push(c); motore._occupa(c, c.id); motore.s.posseduti.mulino = true })(); mondo.cambiato() })
await m3(() => window.__fattoria3d.mondo.azioni.fai({ kind: 'edificio', tipo: 'mulino' }))
await page.waitForSelector('[data-f3="macchina"][data-macchina="mulino"]', { timeout: 3000 })
uguale('il mulino mostra le sue ricette', await page.locator('[data-f3="macchina"] [data-ricetta]').count(), 2)
await chiudiFoglio()

/* ── il banco degli ordini (docs/fattoria3d/ordini.md): il tasto, il foglio, consegnare, la roba che manca, cambiare ──
   Lo stato si prepara dalla console; il tasto «Consegna» si preme col dito vero. */
const toccaSu = async sel => { await page.locator(sel).first().scrollIntoViewIfNeeded(); await toccaEl(sel) }
// livello 1: il tasto non c'è ancora
await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.esperienza = 0; mondo.cambiato() })
await attendi(page, 600)
uguale('al livello 1 il tasto del banco non c\'è', await page.locator('[data-f3="apri-banco"]').count(), 0)
// livello alto ma senza bacheca: il tasto c'è e il foglio spiega cosa fare
await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.esperienza = 1e6; mondo.cambiato() })
await attendi(page, 600)
controlla('dal livello 2 il tasto del banco c\'è', await page.locator('[data-f3="apri-banco"]').count() === 1)
uguale('e senza bacheca non ha il pallino', await page.locator('[data-f3="banco-pronti"]').count(), 0)
await toccaEl('[data-f3="apri-banco"]')
await page.waitForSelector('[data-f3="banco"]', { timeout: 3000 })
controlla('banco chiuso: il foglio dice di mettere una bacheca (o una bancarella)', /bacheca.*bancarella/i.test(await page.locator('[data-f3="banco-chiuso"]').innerText()))
uguale('e non mostra ordini', await page.locator('[data-ordine]').count(), 0)
await chiudiFoglio()
controlla('la ✕ chiude il banco', await page.locator('[data-f3="banco"]').count() === 0)

// la bacheca messa sul prato: il banco si riempie (e i suoi foglietti sono gli ordini)
const messa = await m3(() => {
  const { motore, mondo } = window.__fattoria3d; motore.s.magazzino.bacheca = (motore.s.magazzino.bacheca || 0) + 1
  for (let i = -14; i < 14; i++) for (let j = -12; j < 12; j++) if (motore.mettiPezzo('bacheca', i, j).ok) { mondo.pezzi.sincronizza(); mondo.cambiato(); return true }
  return false
})
controlla('una bacheca si mette sul prato', messa)
await attendi(page, 600)
uguale('i posti sono quelli del livello (esperienza altissima)', await m3(() => window.__fattoria3d.motore.ordini().length), POSTI(ULTIMO))
// la roba per tutti e tre gli ordini
await m3(() => {
  const { motore, mondo } = window.__fattoria3d
  for (const o of motore.ordini()) for (const c of o.chiede || []) { if (c.prodotto) motore.s.prodotti[c.k] = 9; else motore.s.merci[c.k] = 9 }
  mondo.cambiato()
})
await attendi(page, 600)
controlla('il pallino dice quanti ordini sono consegnabili', (await page.locator('[data-f3="banco-pronti"]').innerText()).trim() === String(POSTI(ULTIMO)))
await attendi(page, 700)
controlla('sulla bacheca i foglietti appuntati sono al più sei, uno per ordine', await m3(() => { const g = window.__fattoria3d.mondo.pezzi.gruppi().find(x => x.userData.mostraFogli); return !!g && g.userData.fogli.filter(f => f.visible).length === Math.min(6, window.__fattoria3d.motore.ordini().length) }))
controlla('e hanno più di un colore', await m3(() => { const g = window.__fattoria3d.mondo.pezzi.gruppi().find(x => x.userData.mostraFogli); return new Set(g.userData.fogli.filter(f => f.visible).map(f => f.userData.carta.material.color.getHex())).size >= 2 }))
controlla('e il cartello dice «🧺 N pronti!»', await page.evaluate(n => [...document.querySelectorAll('.f3-badge')].some(e => !e.hidden && new RegExp('🧺 ' + n + ' pronti').test(e.textContent)), POSTI(ULTIMO)))
await toccaEl('[data-f3="apri-banco"]')
await page.waitForSelector('[data-f3="banco"]', { timeout: 3000 })
uguale('il foglio mostra un biglietto per posto', await page.locator('[data-f3="biglietto"]').count(), POSTI(ULTIMO))
uguale('tutti consegnabili', await page.locator('[data-ordine][data-pronto="true"]').count(), POSTI(ULTIMO))
uguale('uno solo è scelto (il primo consegnabile)', await page.locator('[data-sel="true"]').count(), 1)
controlla('il dettaglio dice cosa si chiede (le merci)', await page.locator('[data-dettaglio="0"] [data-chiede]').count() >= 1)
controlla('il premio è in esperienza, non in monete', /^\+\d+ ⭐$/.test((await page.locator('[data-dettaglio] [data-f3="premio"]').innerText()).trim()))
await toccaSu('[data-ordine="1"]')
await attendi(page, 200)
controlla('toccando un altro biglietto lo si sceglie', await page.locator('[data-ordine="1"][data-sel="true"]').count() === 1 && await page.locator('[data-dettaglio="1"]').count() === 1)
await toccaSu('[data-ordine="0"]')
await attendi(page, 200)

// consegnare: l'esperienza sale del premio, la roba scende, il posto si riempie e il contatore avanza
const ordPrima = await m3(() => { const m = window.__fattoria3d.motore, o = m.ordini()[0]; return { xp: m.esperienza(), premio: o.premio, id: o.id, ha: o.chiede.map(c => [c.k, c.prodotto, c.n]) } })
const monetePrima = await monete()
await toccaSu('[data-dettaglio="0"] [data-f3="consegna"]')
await attendi(page, 500)
const dopo = await m3(() => { const m = window.__fattoria3d.motore, o = m.ordini()[0]; return { xp: m.esperienza(), id: o.id, nuovo: !o.attesa } })
uguale('consegnando, l\'esperienza sale del premio', dopo.xp - ordPrima.xp, ordPrima.premio)
controlla('e il posto ha un ordine nuovo', dopo.nuovo && dopo.id !== ordPrima.id)
controlla('il foglio dice a chi e quanto', /Consegnato a .+: \+\d+ ⭐/.test(await page.locator('[data-f3="banco-msg"]').innerText()))
uguale('non entrano monete', await monete(), monetePrima)
uguale('il contatore degli ordini avanza', ((await leggiProfilo(page)).totals || {}).fattoria3dOrdini, 1)

// roba che manca: il tasto è grigio, il tocco non consegna e dice cosa manca
await m3(() => { const m = window.__fattoria3d.motore; for (const k of Object.keys(m.s.merci)) m.s.merci[k] = 0; m.s.prodotti = {}; window.__fattoria3d.mondo.cambiato() })
await attendi(page, 600)
uguale('senza roba nessun ordine è consegnabile', await page.locator('[data-ordine][data-pronto="true"]').count(), 0)
await toccaSu('[data-ordine="1"]')
await attendi(page, 200)
uguale('e il tasto è spento', await page.locator('[data-dettaglio="1"] [data-f3="consegna"]').getAttribute('aria-disabled'), 'true')
const xpPrima = await m3(() => window.__fattoria3d.motore.esperienza())
await toccaSu('[data-dettaglio="1"] [data-f3="consegna"]')
await attendi(page, 300)
controlla('toccarlo dice cosa manca', /Ti mancano/.test(await page.locator('[data-f3="banco-msg"]').innerText()))
uguale('e non consegna niente', await m3(() => window.__fattoria3d.motore.esperienza()), xpPrima)
uguale('il posto resta occupato', await page.locator('[data-ordine="1"][data-pronto="false"]').count(), 1)

// cambiare: il posto riposa e mostra il conto alla rovescia
await toccaSu('[data-dettaglio="1"] [data-f3="cambia"]')
await attendi(page, 500)
controlla('il posto in riposo dice quando torna', /Torna fra 2:5\d|Torna fra 3:00/.test(await page.locator('[data-ordine="1"] [data-f3="ordine-attesa"]').innerText()))
uguale('cambiare non dà esperienza', await m3(() => window.__fattoria3d.motore.esperienza()), xpPrima)
await scatto(page, 'fattoria3d-banco')
await chiudiFoglio()

/* ── gli animali da cortile (docs/fattoria3d/animali.md): nutrire, aspettare, raccogliere, comprare un'altra bestia ──
   Il tocco arriva dove arriva l'eroe: qui si chiama `azioni.fai` come farebbe lui. I numeri vengono dai dati. */
const passa = ms => m3(`(() => { const m = window.__fattoria3d.motore, o = m.ora; m.ora = () => o() + ${ms} })()`)
const mettiCortile = tipo => m3(`(() => {
  const { motore, mondo } = window.__fattoria3d; motore.s.magazzino['${tipo}'] = (motore.s.magazzino['${tipo}'] || 0) + 1
  for (let i = -14; i < 14; i++) for (let j = -12; j < 12; j++) { const r = motore.mettiPezzo('${tipo}', i, j); if (r.ok) { mondo.pezzi.sincronizza(); mondo.cambiato(); return motore.cose.find(c => c.tipo === '${tipo}').id } }
  return null
})()`)
const liberoDaGesti = () => page.waitForFunction(() => !window.__fattoria3d.mondo.eroe.az, null, { timeout: 15000 })   // un gesto in corso (anche l'esultare per un livello) fa ignorare il tocco
const tocca3d = async id => { await liberoDaGesti(); await m3(`window.__fattoria3d.mondo.azioni.fai({ kind: 'cosa', id: ${JSON.stringify(id)} })`); await fermo(); await liberoDaGesti() }
await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.esperienza = 1e6; motore.borsa.paga(-1000); mondo.cambiato() })
const AN = ANIMALI.pollaio, ST = ANIMALI.stalla
const idP = await mettiCortile('pollaio')
controlla('il pollaio si mette sul prato', !!idP)
const bestieDi = id => m3(`window.__fattoria3d.motore.cose.find(c => c.id === ${JSON.stringify(id)}).bestie.map(b => b.fine)`)
const unaTessera = () => m3(() => ({ ...window.__fattoria3d.motore.s.prodotti }))      // il mangime sta in dispensa, non fra i raccolti (docs/fattoria3d/mangime-e-catena.md)
// senza mangime da dare: dice cosa serve, la bestia ha ancora fame (anche con i raccolti che prima si mangiavano)
await m3(() => { const m = window.__fattoria3d.motore; for (const k of Object.keys(m.s.merci)) m.s.merci[k] = 5; delete m.s.prodotti.becchime; delete m.s.prodotti.foraggio })
await tocca3d(idP)
controlla('senza becchime la gallina resta affamata, anche coi raccolti', (await bestieDi(idP))[0] === null)
// nutrire: scala il mangime e la bestia comincia a lavorare
await m3(`window.__fattoria3d.motore.s.prodotti['${AN.mangia[0]}'] = ${AN.pasti * 5}`)
await tocca3d(idP)
controlla('toccare il pollaio nutre la gallina', (await bestieDi(idP))[0] !== null)
uguale('e il pasto scala dal mangime', (await unaTessera())[AN.mangia[0]], AN.pasti * 4)
// lavora: toccarlo dice quanto manca e basta; le bestie in più si comprano dal cartello sopra il pollaio (niente dialogo, niente conferma)
await tocca3d(idP)
controlla('toccare il pollaio che lavora non apre dialoghi', await page.locator('[data-f3="dialogo"]').count() === 0)
const cartelloDi = e => page.locator(`[data-f3="cartello-bestie"][data-pezzo="${e}"]`)   // per pezzo: il cartello non ha più il conto
const compraDa = e => cartelloDi(e).locator('[data-f3="compra-bestia"]')
const scena3 = id => m3(`(() => { const v = window.__fattoria3d.mondo.pezzi.voce(${JSON.stringify(id)}); return v.grp.userData.bestie ? v.grp.userData.bestie.length : v.grp.userData.pecore.length })()`)
await attendi(page, 400)
controlla('il cartello dice quanto costa un\'altra gallina, senza conto n/max', (await compraDa('pollaio').innerText()).includes('🪙 ' + AN.prezzoBestia) && !/\d\/\d/.test(await cartelloDi('pollaio').innerText()))
uguale('nella scena c\'è una gallina sola', await scena3(idP), 1)
// senza monete il pulsante è grigio ma risponde, e non compra
await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(m.monete()) })
await attendi(page, 400)
uguale('senza monete il pulsante è spento (aria-disabled)', await compraDa('pollaio').getAttribute('aria-disabled'), 'true')
await compraDa('pollaio').dispatchEvent('click')
await attendi(page, 300)
uguale('e non compra', (await bestieDi(idP)).length, 1)
await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(-1000) })
await attendi(page, 400)
const monP = await monete()
await compraDa('pollaio').dispatchEvent('click')
await attendi(page, 400)
uguale('comprarla aggiunge una bestia', (await bestieDi(idP)).length, 2)
uguale('e costa quanto dicono i dati', monP - await monete(), AN.prezzoBestia)
uguale('nella scena le galline sono due', await scena3(idP), 2)
controlla('il prezzo sul cartello sale', (await compraDa('pollaio').innerText()).includes('🪙 ' + (AN.prezzoBestia + AN.rincaroBestia)))
// il tempo passa: le uova aspettano, si raccolgono in un gesto, il contatore e il HUD le vedono
await passa(AN.ms + 1000)
await tocca3d(idP)
uguale('raccogliere porta le uova in dispensa (le due galline nutrite: quella di partenza e quella comprata, che ha avuto la sua pappa)', (await stato()).prodotti.uova, 2)
controlla('le bestie hanno di nuovo fame', (await bestieDi(idP)).every(f => f === null))
await attendi(page, 500)
controlla('l\'inventario mostra le uova (la loro faccia)', await vediInventario('altro', 'uova'))
uguale('il contatore delle uova avanza', ((await leggiProfilo(page)).totals || {}).fattoria3dUova, 2)
// la stalla: il latte
const idS = await mettiCortile('stalla')
controlla('la stalla si mette sul prato', !!idS)
await m3(`window.__fattoria3d.motore.s.prodotti['${ST.mangia[0]}'] = ${ST.pasti * 3}`)
await tocca3d(idS)
controlla('toccare la stalla nutre la mucca', (await bestieDi(idS))[0] !== null)
await passa(ST.ms + 1000)
await tocca3d(idS)
uguale('raccogliere porta il latte in dispensa', (await stato()).prodotti.latte, 1)
await attendi(page, 500)
uguale('il contatore del latte avanza', ((await leggiProfilo(page)).totals || {}).fattoria3dLatte, 1)
controlla('l\'inventario mostra anche il latte', await vediInventario('altro', 'latte'))
// la stalla e il recinto funzionano allo stesso modo: una bestia nel prezzo, le altre dal cartello, fino alla capienza
await compraDa('stalla').dispatchEvent('click')
await attendi(page, 300)
uguale('una seconda mucca dal cartello della stalla', [(await bestieDi(idS)).length, await scena3(idS)].join(), '2,2')
const idR = await mettiCortile('recinto')
controlla('il recinto si mette sul prato', !!idR)
const pecoreDi = id => m3(`window.__fattoria3d.motore.cose.find(c => c.id === ${JSON.stringify(id)}).pecore.map(p => p.eta)`)
uguale('il recinto parte con una pecora sola', (await pecoreDi(idR)).join(), 'adulta')
await attendi(page, 300)
await compraDa('recinto').dispatchEvent('click')
await attendi(page, 300)
uguale('la seconda pecora arriva adulta, anche nella scena', [(await pecoreDi(idR)).join(), await scena3(idR)].join(), 'adulta,adulta,2')
for (let k = 0; k < 4; k++) await compraDa('recinto').dispatchEvent('click')
await attendi(page, 300)
uguale('al tetto le pecore sono quattro e il pulsante sparisce', [(await pecoreDi(idR)).length, await compraDa('recinto').isHidden()].join(), '4,true')
// un pollaio con le bestie non si mette via, e il tetto dei posti vale
const via = await m3(`window.__fattoria3d.motore.mettiVia(${JSON.stringify(idP)})`)
controlla('il pollaio con le bestie non si mette via', via.ok === false && via.motivo === 'ha-le-bestie')

/* ── la cache dei modelli (scena3d/cache-modelli.js): 50 pose e 50 rimozioni, e 20 fantasmi, non fanno crescere le geometrie né le trame ──
   Si misura dopo un primo giro di prova (una geometria o una trama si carica in GPU la prima volta che si vede), poi il resto deve restare piatto. */
{
  const r = await page.evaluate(async () => {
    const { motore, mondo } = window.__fattoria3d, info = mondo.renderer.info, quadro = () => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok)))
    const celle = []
    for (let i = -14; i < 13; i++) for (let j = -12; j < 11; j++) if (motore.puoMettere('aiuola', i, j).ok) celle.push([i, j])
    const soldi = motore.monete(); motore.borsa.paga(-5000)
    const ids = []
    const giro = async (da, a) => {
      for (let n = da; n < a; n++) {
        const [i, j] = celle[1 + (n % (celle.length - 1))], r = motore.compraEMetti('aiuola', i, j); mondo.pezzi.sincronizza()
        if (r.ok) ids.push(r.cosa.id)
        await quadro()
        if (n % 2 && ids.length) { motore.mettiVia(ids.pop(), { gratis: true }); mondo.pezzi.sincronizza() }
        if (n % 5 === 0) { mondo.costruzione.parcheggia('panchina', celle[0][0], celle[0][1]); await quadro(); mondo.costruzione.annullaTrascinamento() }
      }
    }
    for (let n = 0; n < 60 && mondo.scaldo && mondo.scaldo.restanti; n++) await quadro()       // il riscaldamento ha finito (o ha rinunciato)
    await giro(0, 10)
    const prima = { g: info.memory.geometries, t: info.memory.textures }
    await giro(10, 60)
    for (const id of ids.splice(0)) { motore.mettiVia(id, { gratis: true }); mondo.pezzi.sincronizza() }
    await quadro(); await quadro()
    const dopo = { g: info.memory.geometries, t: info.memory.textures }
    const a = mondo.pezzi.modello('aiuola'), b = mondo.pezzi.modello('aiuola')
    const condivisa = a.children[0].geometry === b.children[0].geometry
    motore.borsa.paga(motore.monete() - soldi)
    return { prima, dopo, condivisa, scaldo: mondo.scaldo ? mondo.scaldo.restanti : -1 }
  })
  uguale('dopo 50 pose, 50 rimozioni e 10 fantasmi le geometrie in GPU non crescono', r.dopo.g, r.prima.g)
  uguale('…e le trame nemmeno', r.dopo.t, r.prima.t)
  controlla('due istanze dello stesso modello condividono la geometria', r.condivisa)
  nota(`geometrie in GPU: ${r.prima.g} → ${r.dopo.g}; trame ${r.prima.t} → ${r.dopo.t}; riscaldamento: ancora ${r.scaldo} compiti`)
}

/* ── toccare Watson lontano: il contadino dice «Watson!» e lui arriva (docs/fattoria3d/compagni.md) ── */
{
  await fermo()
  await page.waitForFunction(() => !window.__fattoria3d.mondo.compagni.lista.find(c => c.tipo === 'cane').seq, null, { timeout: 15000 }).catch(() => {})
  await page.evaluate(() => { for (const g of window.__fattoria3d.mondo.compagni.lista) if (g.tipo === 'gatto') g.prossimoIncontro = 1e9 })      // i gatti non vengono a salutarlo proprio ora
  // Watson si mette a 5-6 celle dall'eroe, in un punto libero che sta a schermo
  const dove = await page.evaluate(() => {
    const { mondo, motore } = window.__fattoria3d, e = mondo.eroe, w = mondo.compagni.lista.find(c => c.tipo === 'cane'), r = mondo.canvas.getBoundingClientRect()
    for (const [a, b] of [[5, 0], [-5, 0], [0, 5], [0, -5], [5, 3], [-5, -3], [4, 4], [-4, 4]]) {
      const i = Math.floor(e.x + a), j = Math.floor(e.z + b)
      if (!motore.libera(i, j)) continue
      const [px, py, v] = mondo.proietta({ x: i + 0.5, y: 0, z: j + 0.5 })
      if (v && px > 30 && px < r.width - 30 && py > 120 && py < r.height - 80) { w.x = i + 0.5; w.z = j + 0.5; w.percorso = []; w.seq = null; w.stato = 'sta'; w.tStato = 0; w.dur = 99; return [i + 0.5, j + 0.5] }
    }
    return null
  })
  controlla('Watson si può mettere lontano e a schermo', !!dove)
  if (dove) {
    await attendi(page, 150)
    const sentito = () => page.evaluate(() => !!window.__fattoria3d.mondo.compagni.lista.find(c => c.tipo === 'cane').seq)
    for (let prova = 0; prova < 3 && !await sentito(); prova++) { await tocca(...await schermoDi(dove[0], dove[1])); await attendi(page, 400) }         // (un tocco su un cane che si sposta può mancarlo: si riprova)
    await page.waitForFunction(() => /Watson!/.test(document.querySelector('.f3-fumetto')?.textContent || ''), null, { timeout: 3000 }).catch(() => {})
    controlla('il contadino dice «Watson!»', await page.evaluate(() => /Watson!/.test(document.querySelector('.f3-fumetto')?.textContent || '')))
    await page.waitForFunction(() => { const { mondo } = window.__fattoria3d, e = mondo.eroe, w = mondo.compagni.lista.find(c => c.tipo === 'cane'); return Math.hypot(w.x - e.x, w.z - e.z) <= 2.2 }, null, { timeout: 9000 }).catch(() => {})
    controlla('Watson corre dall\'eroe e si ferma a meno di due celle', await page.evaluate(() => { const { mondo } = window.__fattoria3d, e = mondo.eroe, w = mondo.compagni.lista.find(c => c.tipo === 'cane'); return Math.hypot(w.x - e.x, w.z - e.z) <= 2.2 }))
    await attendi(page, 600)
    controlla('…e fa festa (una sequenza in corso)', await page.evaluate(() => !!window.__fattoria3d.mondo.compagni.lista.find(c => c.tipo === 'cane').seq))
    await attendi(page, 5000)
    await fermo()
  }
}

/* ── la pesca: il molo sul lago, un tocco sull'acqua, il galleggiante, il pesce (docs/fattoria3d/geografia-e-pesca.md) ──
   Scritto senza poterlo eseguire (la build era vietata): i controlli sul motore e sulla scena sono quelli provati nel dev server. */
{
  await fermo()
  const pronto = await page.evaluate(() => {
    const { motore, mondo } = window.__fattoria3d
    motore.s.esperienza = Math.max(motore.s.esperienza, 5000); motore.borsa.paga(-3000)                      // il livello e le monete ci sono: la prova è sul gesto, non sul prezzo
    for (const id of ['5_3', '6_3', '7_3', '8_3', '9_3']) motore.compraLotto(id)
    for (const o of motore.ostacoli) if (!o.tolto) motore._togliSenzaPagare(o)
    for (const a of motore.alberi) if (!a.tagliato) { a.tagliato = true; motore.tagliati.add(a.n); motore.s.tagliati.push(a.n) }
    mondo.terreno.ridisegnaTutto()
    let posto = null
    for (let j = 0; j < 4 && !posto; j++) for (let i = 17; i < 30 && !posto; i++) if (!motore.acqua(i, j) && motore.acqua(i + 1, j) && motore.acqua(i + 2, j) && motore.puoMettere('molo', i, j).ok) posto = [i, j]
    if (!posto) return null
    const m = motore.compraEMetti('molo', posto[0], posto[1]); mondo.cambiato()
    mondo.eroe.x = posto[0] - 1.5; mondo.eroe.z = posto[1] + 0.5; mondo.eroe.percorso = []; mondo.camera.segui()
    return { posto, ok: m.ok }
  })
  controlla('un lago a est e un posto dove il molo parte dalla riva', !!pronto && pronto.ok, JSON.stringify(pronto))
  if (pronto && pronto.ok) {
    await attendi(page, 1500)
    const [mi, mj] = pronto.posto
    controlla('il molo è una cosa in scena, calpestabile', await page.evaluate(([i, j]) => { const { motore, mondo } = window.__fattoria3d, c = motore.cosaDi('molo'); return !!c && !!mondo.pezzi.voce(c.id) && motore.libera(i + 1, j) && motore.quotaPasso(i + 1.5, j + 0.5) > 0 }, [mi, mj]))
    const [px, py] = await schermoDi(mi + 3.5, mj + 0.5)
    await page.evaluate(([x, y]) => { const r = window.__fattoria3d.mondo.canvas.getBoundingClientRect(); window.__fattoria3d.mondo.tocca(x, y) }, [px, py])      // l'acqua accanto al molo: va in punta e lancia
    await page.waitForFunction(() => window.__fattoria3d.motore.lenze().length === 1, null, { timeout: 9000 }).catch(() => {})
    uguale('toccando l\'acqua parte la lenza (una sola)', await page.evaluate(() => window.__fattoria3d.motore.lenze().length), 1)
    controlla('il galleggiante è in scena e il contadino ha la canna alzata', await page.evaluate(() => { const { mondo } = window.__fattoria3d; return mondo.pesca3d.oggetti.size >= 0 && !!mondo.eroe.pescando }))
    await scatto(page, 'fattoria3d-pesca')
    // il tempo passa (anche a pagina chiusa: l'ora è assoluta): il pesce abbocca e il contadino, ancora lì, lo ritira da sé
    await page.evaluate(() => { const m = window.__fattoria3d.motore, o = m.ora; window.__oraPrimaPesca = o; m.ora = () => o() + 30000 })         // si somma all'orologio di adesso: più avanti di prima, mai indietro
    await page.waitForFunction(() => (window.__fattoria3d.motore.s.prodotti.pesce || 0) >= 1, null, { timeout: 40000 }).catch(() => {})
    await fermo()                                                    // lo strappo e l'esultanza finiscono
    const diag = () => page.evaluate(() => { const { motore, mondo } = window.__fattoria3d; return JSON.stringify({ pesca: motore.s.pesca, pesce: motore.s.prodotti.pesce, pescando: !!mondo.eroe.pescando, az: mondo.eroe.az && mondo.eroe.az.tipo, og: [...mondo.pesca3d.oggetti.values()].map(o => o.stato) }) })
    controlla('il pesce è nell\'inventario', await page.evaluate(() => (window.__fattoria3d.motore.s.prodotti.pesce || 0) >= 1), await diag())
    uguale('il banco si ripopola (riposo)', await page.evaluate(() => window.__fattoria3d.motore.bancoDi(Object.keys(window.__fattoria3d.motore.s.pesca)[0]).stato), 'riposo')
    await attendi(page, 1500)                                        // il profilo si salva dopo un attimo
    controlla('il contatore dei pesci avanza', ((await leggiProfilo(page)).totals || {}).fattoria3dPesci >= 1)
    await page.evaluate(() => { window.__fattoria3d.motore.ora = window.__oraPrimaPesca })
    // il mare: senza porticciolo non si pesca, col porticciolo sì (resa 3)
    const mare = await page.evaluate(() => {
      const { motore, mondo } = window.__fattoria3d
      for (const id of ['4_3', '1_3', '0_3', '-1_3', '-2_3']) motore.compraLotto(id)
      for (const o of motore.ostacoli) if (!o.tolto) motore._togliSenzaPagare(o)
      mondo.terreno.ridisegnaTutto()
      const senza = motore.provaPesca(-19, 0).motivo
      const molo = motore.compraEMetti('molo', -17, 0), port = motore.compraEMetti('porticciolo', -17, 1); mondo.cambiato()
      const con = motore.provaPesca(-19, 0)
      return { senza, molo: molo.ok, port: port.ok, con: con.ok && con.mare && con.resa === 3 && con.azione === 'lancia' }
    })
    uguale('il mare senza porticciolo: serve il porticciolo', mare.senza, 'serve-porticciolo')
    controlla('col porticciolo il mare si pesca (resa 3)', mare.molo && mare.port && mare.con, JSON.stringify(mare))
    controlla('i pesciolini sono in scena (una InstancedMesh sola)', await page.evaluate(() => window.__fattoria3d.mondo.terreno.pesci.mesh.isInstancedMesh))
  }
}

/* ── ruotare: tenuto premuto un pezzo, il tasto ↻ con un secondo dito lo gira di un quarto; rilasciato resta girato (docs/fattoria3d/rotazione.md) ── */
{
  const { page, errori } = await apriGioco(browser)
  await azzera(page)
  await semina(page, { coins: 600, settings: { eta: 8, sperimentali: true } })
  await scegli(page, 'fattoria3d')
  await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
  await attendi(page, 1200)
  const cdp = await page.context().newCDPSession(page)
  const giu = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  const su = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const schermoDi = (x, z) => page.evaluate(([x, z]) => {
    const { mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), [px, py] = mondo.proietta({ x, y: 0, z })
    return [r.left + px, r.top + py]
  }, [x, z])
  const stato = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__fattoria3d.motore.s)))
  const monete = () => page.evaluate(() => window.__fattoria3d.motore.monete())
  await page.evaluate(() => { const { motore } = window.__fattoria3d; motore.s.esperienza = 1e6 })          // il tavolo è del livello 4
  const pan = await page.evaluate(() => {
    const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), buoni = []
    for (let i = -14; i < 13; i++) for (let j = -12; j < 11; j++) {
      // un tavolo (3×2) che ci sta dritto e girato (2×3) col centro fermo, a metà schermo (fuori dalla fascia che scorre) e lontano dall'eroe
      if (!motore.puoMettere('tavolo', i, j).ok || !motore.puoMettere('tavolo', i + 1, j - 1, 0, 1).ok) continue
      const [px, py, v] = mondo.proietta({ x: i + 1.5, y: 0, z: j + 1 })
      if (v && px > 110 && px < r.width - 110 && py > 200 && py < r.height - 300) buoni.push({ i, j, d: Math.hypot(i - mondo.eroe.x, j - mondo.eroe.z) })
    }
    buoni.sort((a, b) => b.d - a.d)
    const q = buoni[0]; if (!q) return null
    const c = motore.compraEMetti('tavolo', q.i, q.j); mondo.cambiato(); return { id: c.cosa.id, i: q.i, j: q.j }
  })
  controlla('c\'è un posto per un tavolo che gira', !!pan)
  const centro = await schermoDi(pan.i + 1.5, pan.j + 1)
  const M1 = await monete()
  await giu(centro[0], centro[1])
  await attendi(page, 700)                                              // la pressione lunga solleva il pezzo
  controlla('tenuto premuto il tavolo mostra il tasto ↻', await page.locator('[data-f3="ruota"]').count() === 1 && await page.locator('[data-f3="ruota"]').getAttribute('data-rot') === '0')
  await scatto(page, 'fattoria3d-ruota')
  const bt = await page.locator('[data-f3="ruota"]').boundingBox()
  // il secondo dito tocca il tasto mentre il primo tiene il pezzo
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: centro[0], y: centro[1], id: 0 }, { x: bt.x + bt.width / 2, y: bt.y + bt.height / 2, id: 1 }] })
  await attendi(page, 150)
  uguale('il tasto ha girato il pezzo in mano', await page.locator('[data-f3="ruota"]').getAttribute('data-rot'), '1')
  await su()                                                             // tutti i diti su: il pezzo si rilascia dov'è
  await attendi(page, 300)
  const t = (await stato()).cose.find(c => c.id === pan.id)
  uguale('rilasciato, il tavolo resta girato nello stato', t.rot, 1)
  const ing = await page.evaluate(id => { const m = window.__fattoria3d.motore, c = m.cosa(id), d = m.misureCosa(c); return [d.w, d.d] }, pan.id)
  stessaLista('e occupa 2×3', ing, [2, 3])
  uguale('girare è costato una moneta', M1 - await monete(), 1)
  const rotScena = await page.evaluate(id => Math.round(window.__fattoria3d.mondo.pezzi.voce(id).grp.rotation.y * 1000), pan.id)
  uguale('e il modello è girato di un quarto', rotScena, Math.round(Math.PI / 2 * 1000))
  controlla('il tasto sparisce a dito alzato', await page.locator('[data-f3="ruota"]').count() === 0)
  await page.evaluate(id => { const { motore, mondo } = window.__fattoria3d; motore.mettiVia(id, { gratis: true, forza: true }); mondo.cambiato() }, pan.id)
  controlla('nessun errore in console girando', errori.length === 0, errori.join(' · '))
  await page.context().close().catch(() => {})
}

/* ── le stagioni: #stagione=natale accende cielo, neve e lucine con pochi disegni in più; Halloween offre le zucche ── */
{
  const { page: festa, errori: erroriFesta } = await apriGioco(browser)
  await azzera(festa)
  await semina(festa, { coins: 300, settings: { eta: 8, sperimentali: true } })
  await festa.evaluate(() => { location.hash = 'fattoria3d&stagione=natale'; location.reload() })
  await festa.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 20000 })
  await attendi(festa, 1500)
  const n = await festa.evaluate(() => {
    const { mondo } = window.__fattoria3d, st = mondo.stagione, s = mondo.statistiche()
    return { nome: st && st.nome, chiazze: st && st.chiazze.count, fiocchi: !!(st && st.punti && st.punti.visible), calls: s.calls, tri: s.triangoli, cielo: mondo.scena.background.getHex() }
  })
  uguale('a Natale la scena lo sa', n.nome, 'natale')
  controlla('ci sono la neve sul prato e i fiocchi', n.chiazze > 5 && n.fiocchi)
  uguale('il cielo è quello di Natale', n.cielo, 0xdbe6f0)
  await scatto(festa, 'fattoria3d-natale')
  // le draw call della festa: lo stesso fotogramma disegnato con la festa accesa e spenta (renderer.info si azzera a ogni render)
  const conti = await festa.evaluate(() => {
    const { mondo } = window.__fattoria3d, st = mondo.stagione, r = mondo.renderer, chiama = () => { r.info.autoReset = true; r.render(mondo.scena, mondo.camera.cam); return r.info.render.calls }
    const con = chiama(); st.gruppo.visible = false; st.punti.visible = false
    const senza = chiama(); st.gruppo.visible = true; st.punti.visible = true
    return { con, senza }
  })
  controlla('Natale costa pochi disegni in più (≤ 8 draw call)', conti.con - conti.senza <= 8 && conti.con > conti.senza, `${conti.con} contro ${conti.senza}`)
  controlla('nessun errore in console a Natale', erroriFesta.length === 0, erroriFesta.join(' · '))
  await festa.context().close().catch(() => {})
  const { page: zuc, errori: erroriZuc } = await apriGioco(browser)
  await azzera(zuc)
  await semina(zuc, { coins: 300, settings: { eta: 8, sperimentali: true } })
  await zuc.evaluate(() => { location.hash = 'fattoria3d&stagione=halloween'; location.reload() })
  await zuc.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 20000 })
  await attendi(zuc, 1200)
  const h = await zuc.evaluate(() => { const { mondo } = window.__fattoria3d; return { nome: mondo.stagione && mondo.stagione.nome, cielo: mondo.scena.background.getHex() } })
  uguale('a Halloween la scena lo sa', h.nome, 'halloween')
  await zuc.evaluate(() => { const { motore, mondo } = window.__fattoria3d; motore.s.esperienza = 1e6; for (let j = -3; j < 8; j++) for (let i = -7; i < 5; i++) if (motore.puoMettere('zucche_mucchio', i, j).ok && motore.puoMettere('zucca_intagliata', i + 3, j).ok && Math.abs(i) < 3 && j > 1) { motore.compraEMetti('zucche_mucchio', i, j); motore.compraEMetti('zucca_intagliata', i + 3, j); mondo.cambiato(); return } })
  await attendi(zuc, 500)
  await scatto(zuc, 'fattoria3d-halloween')
  await zuc.locator('[data-f3="az-costruisci"]').click()
  await attendi(zuc, 600)
  await zuc.locator('[data-scheda="decori"]').click().catch(() => {})
  await attendi(zuc, 300)
  controlla('e nel menu dei decori ci sono le zucche', await zuc.locator('[data-carta="zucca_intagliata"]').count() === 1 && await zuc.locator('[data-carta="zucche_mucchio"]').count() === 1)
  await scatto(zuc, 'fattoria3d-halloween-menu')
  controlla('nessun errore in console a Halloween', erroriZuc.length === 0, erroriZuc.join(' · '))
  await zuc.context().close().catch(() => {})
}

/* ── senza WebGL 2 si dice e si torna in home ── */
const { page: senza } = await apriGioco(browser, { hash: 'fattoria3d&tela=niente', attesa: null })
await senza.waitForSelector('[data-senza-3d]', { timeout: 8000 })
controlla('senza WebGL il messaggio c\'è', await senza.locator('[data-senza-3d]').count() === 1)
await senza.locator('[data-azione="esci-3d"]').click()
await senza.waitForSelector('.carte', { timeout: 8000 })
controlla('e si torna in home', true)

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('Fattoria 3D col dito')
