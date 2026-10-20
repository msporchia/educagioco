/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA 3D, COL DITO — docs/fattoria3d/

   Il test unitario prova le regole; questo dice che **il gioco vero sta in
   piedi nel browser**: è in prova (carta dietro l'interruttore), si apre sul
   prato in WebGL, un pezzo si trascina dalla barra fino alla mappa e si paga al
   rilascio (senza conferme; un rilascio che non va non perde niente), un tocco
   sulla mappa chiude il vassoio, si semina e si raccoglie armando l'azione, un
   albero costa monete e non dà legna, sassi e cespugli si tolgono per una
   moneta, le monete sono quelle vere e il resto (raccolti, terra, alberi, sassi)
   sta nello stato suo e sopravvive a un ricaricamento. Senza
   WebGL 2 si dice e si torna in home.
   Il dito è vero (`Input.dispatchTouchEvent`): un `page.click()` non trascina
   e non porta i pointer del tocco (docs/core/il-dito.md).
   `node test/esegui.mjs fattoria3d --niente-build`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli, leggiProfilo } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { PEZZI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { ANIMALI } from '../../src/giochi/fattoria3d/dati/animali.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 300, settings: { eta: 8, sperimentali: true } })

const cdp = await page.context().newCDPSession(page)
const giu = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
const muovi = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
const su = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
const tocca = async (x, y) => { await giu(x, y); await attendi(page, 60); await su() }
const toccaEl = async sel => { const r = await page.locator(sel).boundingBox(); await tocca(r.x + r.width / 2, r.y + r.height / 2) }
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
controlla('lo vede anche il HUD', /🥕 4/.test(await page.locator('[data-f3="scorte"]').innerText()))
await toccaEl('[data-f3="az-libero"]')

/* ── costruire trascinando: si paga al rilascio, senza conferma; un rilascio che non va non perde niente ── */
await toccaEl('[data-f3="az-costruisci"]')
await page.waitForSelector('[data-f3="vassoio"]')
controlla('il vassoio non ha più «↶ Annulla»', await page.locator('[data-f3="annulla"]').count() === 0)
const prima = await monete()
const carta = await page.locator('[data-carta="campo"]').boundingBox()
const cx = carta.x + carta.width / 2, cy = carta.y + carta.height / 2
await page.evaluate(() => { window.__fattoria3d.mondo.imposta({ vista: 'vicino' }) })
await attendi(page, 1500)
// dove cadrebbe il dito per mettere un campo 2×2 con l'angolo in (i, j): il fantasma sta 1,6 celle sopra il dito
const dito = (i, j) => schermoDi(i + 1, j + 1 + 1.6)
// un posto buono per un campo (dentro il terreno tuo, libero, a schermo sopra il vassoio), il più vicino all'eroe
const posto = await page.evaluate(() => {
  const { motore, mondo } = window.__fattoria3d, e = mondo.eroe, r = mondo.canvas.getBoundingClientRect(), top = document.querySelector('[data-f3="vassoio"]').getBoundingClientRect().top
  const buoni = []
  for (let i = -14; i < 13; i++) for (let j = -12; j < 11; j++) {
    if (!motore.puoMettere('campo', i, j).ok) continue
    const [px, py, v] = mondo.proietta({ x: i + 1, y: 0, z: j + 2.6 })
    if (v && px > 60 && px < r.width - 60 && py > 130 && r.top + py < top - 40) buoni.push({ i, j, d: Math.hypot(i + 1 - e.x, j + 1 - e.z) })
  }
  buoni.sort((a, b) => a.d - b.d)
  return buoni[0]
})
controlla('c\'è un posto libero a schermo per un campo', !!posto)
// 1. su un posto occupato (il campo di partenza) il rilascio non perde niente e non chiede conferme
await trascina([cx, cy], await dito(-5, 0))
await attendi(page, 400)
const rifiutato = await stato()
controlla('un rilascio non valido non cambia niente: né pezzi, né magazzino, né monete', rifiutato.cose.length === 1 && !rifiutato.magazzino.campo && await monete() === prima)
controlla('e non compare nessuna conferma', await page.locator('[data-f3="dialogo"]').count() === 0)
// 2. senza monete il rilascio dice cosa servono e non cambia niente
await page.evaluate(() => { const m = window.__fattoria3d.motore; m.borsa.paga(m.monete() - 5) })
await trascina([cx, cy], await dito(posto.i, posto.j))
await attendi(page, 300)
controlla('senza monete: «Servono 🪙 28», niente cambia', /Servono 🪙 28/.test(await page.locator('.f3-suggerimento span').innerText()) && (await stato()).cose.length === 1 && await monete() === 5)
await page.evaluate(n => { window.__fattoria3d.motore.borsa.paga(-n) }, prima - 5)
// 3. con le monete: si paga e si mette in un gesto, senza dialogo
await attendi(page, 900)       // il profilo si salva a ritardo: si legge dopo
const m0 = await monete()
await trascina([cx, cy], await dito(posto.i, posto.j))
await attendi(page, 500)
await attendi(page, 900)
const costruito = await stato()
uguale('un campo in più sulla mappa', costruito.cose.length, 2)
uguale('il magazzino resta vuoto: compra e mette in un gesto', costruito.magazzino.campo || 0, 0)
controlla('le monete vere sono scese del prezzo', m0 - await monete() === 28, `da ${m0} a ${await monete()}`)
controlla('nessuna conferma d\'acquisto', await page.locator('[data-f3="dialogo"]').count() === 0)
controlla('e niente «↶ Annulla»', await page.locator('[data-f3="annulla"]').count() === 0)
await scatto(page, 'fattoria3d-costruito')
// il campo di prova se ne va (com'era prima), e le monete tornano: lo stato dei test dopo è quello di prima
await page.evaluate(() => { const { motore, mondo } = window.__fattoria3d, c = motore.s.cose[1]; motore.mettiVia(c.id, { gratis: true }); motore.s.magazzino = {}; motore.rimborsa(28); mondo.cambiato() })
await attendi(page, 300)
// 4. una strisciata sulla mappa la sposta ma non chiude il vassoio; un tocco vero sì
await trascina(await schermoDi(0, 3), await schermoDi(0, 5.5))
await attendi(page, 300)
controlla('una strisciata sulla mappa non chiude il vassoio', await page.locator('[data-f3="vassoio"]').count() === 1)
await attendi(page, 600)
const vuota = await page.evaluate(() => {          // una cella tua e libera, a schermo sopra il vassoio, dove un tocco non apre niente
  const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), top = document.querySelector('[data-f3="vassoio"]').getBoundingClientRect().top
  for (let i = -14; i < 14; i++) for (let j = -12; j < 12; j++) {
    if (!motore.libera(i, j) || motore.cellaEdificio[(j + 13) * 32 + (i + 16)] || motore.ostacoloSu(i, j)) continue
    const [px, py, v] = mondo.proietta({ x: i + 0.5, y: 0, z: j + 0.5 })
    if (v && px > 60 && px < r.width - 60 && py > 140 && r.top + py < top - 60) return { x: i + 0.5, z: j + 0.5 }
  }
  return null
})
await tocca(...await schermoDi(vuota.x, vuota.z))
await attendi(page, 400)
controlla('un tocco sulla mappa chiude il vassoio', await page.locator('[data-f3="vassoio"]').count() === 0)
// 5. la ✕ lavora ancora
await toccaEl('[data-f3="az-costruisci"]')
await page.waitForSelector('[data-f3="vassoio"]')
await toccaEl('[data-chiudi]')
await attendi(page, 300)
controlla('la ✕ chiude il vassoio', await page.locator('[data-f3="vassoio"]').count() === 0)

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
// un lotto comprabile che stia bene a schermo (i posti degli edifici nuovi sono a nord: ci cade il tocco su un fantasma)
const lottoNord = await page.evaluate(() => {
  const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect()
  const c = Array.from({ length: 42 }, (_, n) => { const a = n % 7, b = Math.floor(n / 7); return { id: a + '_' + b, a, b, i: -14 + a * 4, j: -12 + b * 4, w: 4, d: 4 } }).filter(l => !motore.posseduto(l) && motore.confina(l)).map(l => ({ l, p: mondo.proietta({ x: l.i + 2, y: 0, z: l.j + 2 }) }))
    .filter(({ l, p }) => p[2] && p[0] > 60 && p[0] < r.width - 60 && p[1] > 110 && p[1] < r.height - 190 && !motore.lottiMancanti('mulino').includes(l.id) && !['mulino', 'panificio', 'conserviera', 'gelateria'].some(t => motore.lottiMancanti(t).includes(l.id)))
  c.sort((u, v) => v.l.j - u.l.j)       // il più a sud: lontano dai fantasmi alti degli edifici
  return c.length ? { i: c[0].l.i + 2, j: c[0].l.j + 2 } : null
})
await tocca(...await schermoDi(lottoNord.i, lottoNord.j))
await page.waitForSelector('[data-f3="dialogo"]', { timeout: 3000 })
controlla('toccare un terreno non tuo apre l\'acquisto', /Terreno/.test(await page.locator('.f3-dialogo h2').innerText()))
await page.locator('[data-scelta="0"]').click()
await attendi(page, 500)
const comprato = await stato()
uguale('il lotto è tuo', Object.keys(comprato.lotti).length, 10)

/* ── i contatori e le monete: l'albo li legge, e lo stato sta nel profilo ── */
await attendi(page, 600)
const profilo = await leggiProfilo(page)
controlla('i contatori sono saliti', profilo.totals.fattoria3dRaccolti === 4 && profilo.totals.fattoria3dAlberi === 1 && profilo.totals.fattoria3dTerre === 1 && profilo.totals.fattoria3dSassi === 1 && profilo.totals.fattoria3dPezzi === 1,
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
const m3 = fn => page.evaluate(fn)
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
controlla('la scelta del seme mostra tutte le dieci colture', await page.locator('[data-seme]').count() === 10)
controlla('una coltura non arrivata è in grigio', await page.locator('[data-seme="lavanda"].bloccato').count() === 1)
await page.locator('[data-seme="lavanda"]').click({ force: true })
await attendi(page, 200)
controlla('toccarla dice il livello', /livello 15/.test(await page.locator('[data-f3="semi-msg"]').innerText()))
controlla('e il foglio resta aperto', await page.locator('[data-f3="semi"]').count() === 1)
await chiudiFoglio()
await toccaEl('[data-f3="az-libero"]')
await toccaEl('[data-f3="az-costruisci"]')
await page.waitForSelector('[data-f3="vassoio"]')
uguale('il vassoio ha tutti i pezzi dei dati e i due strumenti', await page.locator('[data-carta]').count(), Object.keys(PEZZI).length + 2)
controlla('il recinto non è arrivato: carta in grigio col livello', await page.locator('[data-carta="recinto"].bloccata').count() === 1 && /Livello 4/.test(await page.locator('[data-carta="recinto"]').innerText()))
const scorre = await page.evaluate(() => { const c = document.querySelector('.f3-carte'); return [c.scrollWidth, c.clientWidth, document.documentElement.scrollWidth, innerWidth] })
controlla('la barra scorre di lato senza uscire dallo schermo', scorre[0] > scorre[1] && scorre[2] <= scorre[3], JSON.stringify(scorre))
await toccaEl('[data-carta="recinto"]')
await attendi(page, 300)
controlla('toccarla dice il livello e non chiede di comprare', await page.locator('[data-f3="dialogo"]').count() === 0 && /livello 4/.test(await page.locator('.f3-suggerimento span').innerText()))
await chiudiFoglio()

// la pasticceria: posseduta ma chiusa al livello 1, poi aperta
await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.posseduti.pasticceria = true; motore.s.merci.grano = 4; mondo.cambiato() })
await m3(() => window.__fattoria3d.mondo.azioni.fai({ kind: 'edificio', tipo: 'pasticceria' }))
await page.waitForSelector('[data-f3="macchina"][data-macchina="pasticceria"]', { timeout: 3000 })
controlla('il menu della pasticceria porta anche il suo bersaglio', await page.locator('[data-f3="pasticceria"]').count() === 1)
uguale('mostra tutte le ricette della pasticceria', await page.locator('[data-f3="macchina"] [data-ricetta]').count(), Object.values(RICETTE).filter(r => r.dove === 'pasticceria').length)
controlla('una ricetta chiusa dice il livello', /livello 5/.test(await page.locator('[data-f3="macchina"] .ricetta.chiusa').first().innerText()))
await page.locator('[data-ricetta="pane"]').click({ force: true })
await attendi(page, 300)
controlla('toccarla non la fa partire e dice perché', (await stato()).macchine.pasticceria.coda.length === 0 && await page.locator('[data-f3="macchina-msg"]').count() === 1)
await m3(() => { window.__fattoria3d.motore.s.esperienza = 1e6 })
await attendi(page, 600)
await page.locator('[data-ricetta="pane"]').click()
await attendi(page, 300)
const cotto = await stato()
controlla('aperta, la ricetta parte e scala gli ingredienti', cotto.macchine.pasticceria.coda.length === 1 && cotto.merci.grano === 2)
await m3(() => { const m = window.__fattoria3d.motore, o = m.ora; m.ora = () => o() + 60000 })
await attendi(page, 700)
await page.locator('[data-f3="ritira"]').click()
await attendi(page, 300)
uguale('«Ritira tutto» porta il pane in dispensa', (await stato()).prodotti.pane, 1)
await chiudiFoglio()
// il mulino non è stato comprato: toccare il fantasma dice cosa fare; poi, comprato, apre il SUO menu
await m3(() => { const { motore } = window.__fattoria3d; motore.s.esperienza = 0 })
await attendi(page, 300)
await m3(() => window.__fattoria3d.mondo.azioni.fai({ kind: 'edificio', tipo: 'gelateria' }))
await page.waitForSelector('[data-f3="dialogo"]', { timeout: 3000 })
controlla('un edificio chiuso dice il livello', /livello 14/.test(await page.locator('.f3-dialogo p').innerText()))
await page.locator('[data-scelta="0"]').click()
await attendi(page, 200)
await m3(() => { window.__fattoria3d.motore.s.esperienza = 1e6 })
await m3(() => window.__fattoria3d.mondo.azioni.fai({ kind: 'edificio', tipo: 'gelateria' }))
await page.waitForSelector('[data-f3="dialogo"]', { timeout: 3000 })
const mancaTerreno = await m3(() => window.__fattoria3d.motore.lottiMancanti('gelateria').length)
controlla('arrivato il livello, un edificio su terreno non tuo manda al terreno', mancaTerreno > 0 ? /terreno/.test(await page.locator('.f3-dialogo p').innerText()) : true)
await page.locator('[data-scelta]').last().click()
await attendi(page, 200)
await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.posseduti.mulino = true; mondo.cambiato() })
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
// livello alto ma senza bancarella: il tasto c'è e il foglio spiega cosa fare
await m3(() => { const { motore, mondo } = window.__fattoria3d; motore.s.esperienza = 1e6; mondo.cambiato() })
await attendi(page, 600)
controlla('dal livello 2 il tasto del banco c\'è', await page.locator('[data-f3="apri-banco"]').count() === 1)
uguale('e senza bancarella non ha il pallino', await page.locator('[data-f3="banco-pronti"]').count(), 0)
await toccaEl('[data-f3="apri-banco"]')
await page.waitForSelector('[data-f3="banco"]', { timeout: 3000 })
controlla('banco chiuso: il foglio dice di mettere una bancarella', /bancarella/i.test(await page.locator('[data-f3="banco-chiuso"]').innerText()))
uguale('e non mostra ordini', await page.locator('[data-ordine]').count(), 0)
await chiudiFoglio()
controlla('la ✕ chiude il banco', await page.locator('[data-f3="banco"]').count() === 0)

// la bancarella messa sul prato: il banco si riempie
const messa = await m3(() => {
  const { motore, mondo } = window.__fattoria3d; motore.s.magazzino.bancarella = (motore.s.magazzino.bancarella || 0) + 1
  for (let i = -14; i < 14; i++) for (let j = -12; j < 12; j++) if (motore.mettiPezzo('bancarella', i, j).ok) { mondo.pezzi.sincronizza(); mondo.cambiato(); return true }
  return false
})
controlla('una bancarella si mette sul prato', messa)
await attendi(page, 600)
uguale('i posti sono tre', await m3(() => window.__fattoria3d.motore.ordini().length), 3)
// la roba per tutti e tre gli ordini
await m3(() => {
  const { motore, mondo } = window.__fattoria3d
  for (const o of motore.ordini()) for (const c of o.chiede || []) { if (c.prodotto) motore.s.prodotti[c.k] = 9; else motore.s.merci[c.k] = 9 }
  mondo.cambiato()
})
await attendi(page, 600)
controlla('il pallino dice 3 ordini consegnabili', (await page.locator('[data-f3="banco-pronti"]').innerText()).trim() === '3')
await toccaEl('[data-f3="apri-banco"]')
await page.waitForSelector('[data-f3="banco"]', { timeout: 3000 })
uguale('il foglio mostra i tre ordini', await page.locator('[data-ordine]').count(), 3)
uguale('tutti consegnabili', await page.locator('[data-ordine][data-pronto="true"]').count(), 3)
controlla('ogni ordine ha i suoi dischi', await page.locator('[data-ordine="0"] [data-chiede]').count() >= 1)
controlla('il premio è in esperienza, non in monete', /^\+\d+ ⭐$/.test((await page.locator('[data-ordine="0"] [data-f3="premio"]').innerText()).trim()))

// consegnare: l'esperienza sale del premio, la roba scende, il posto si riempie e il contatore avanza
const ordPrima = await m3(() => { const m = window.__fattoria3d.motore, o = m.ordini()[0]; return { xp: m.esperienza(), premio: o.premio, id: o.id, ha: o.chiede.map(c => [c.k, c.prodotto, c.n]) } })
const monetePrima = await monete()
await toccaSu('[data-ordine="0"] [data-f3="consegna"]')
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
uguale('e il tasto è spento', await page.locator('[data-ordine="1"] [data-f3="consegna"]').getAttribute('aria-disabled'), 'true')
const xpPrima = await m3(() => window.__fattoria3d.motore.esperienza())
await toccaSu('[data-ordine="1"] [data-f3="consegna"]')
await attendi(page, 300)
controlla('toccarlo dice cosa manca', /Ti mancano/.test(await page.locator('[data-f3="banco-msg"]').innerText()))
uguale('e non consegna niente', await m3(() => window.__fattoria3d.motore.esperienza()), xpPrima)
uguale('il posto resta occupato', await page.locator('[data-ordine="1"][data-pronto="false"]').count(), 1)

// cambiare: il posto riposa e mostra il conto alla rovescia
await toccaSu('[data-ordine="1"] [data-f3="cambia"]')
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
const unaTessera = () => m3(() => ({ ...window.__fattoria3d.motore.s.merci }))
// senza raccolti da dare: dice cosa serve, la bestia ha ancora fame
await m3(() => { const m = window.__fattoria3d.motore; for (const k of Object.keys(m.s.merci)) m.s.merci[k] = 0 })
await tocca3d(idP)
controlla('senza raccolti la gallina resta affamata', (await bestieDi(idP))[0] === null)
// nutrire: scala i raccolti e la bestia comincia a lavorare
await m3(`window.__fattoria3d.motore.s.merci['${AN.mangia[0]}'] = ${AN.pasti * 5}`)
await tocca3d(idP)
controlla('toccare il pollaio nutre la gallina', (await bestieDi(idP))[0] !== null)
uguale('e il pasto scala dai raccolti', (await unaTessera())[AN.mangia[0]], AN.pasti * 4)
// lavora: toccarlo dice quanto manca e basta; le bestie in più si comprano dal cartello sopra il pollaio (niente dialogo, niente conferma)
await tocca3d(idP)
controlla('toccare il pollaio che lavora non apre dialoghi', await page.locator('[data-f3="dialogo"]').count() === 0)
const cartelloDi = e => page.locator('[data-f3="cartello-bestie"]', { hasText: e })
const compraDa = e => cartelloDi(e).locator('[data-f3="compra-bestia"]')
const scena3 = id => m3(`(() => { const v = window.__fattoria3d.mondo.pezzi.voce(${JSON.stringify(id)}); return v.grp.userData.bestie ? v.grp.userData.bestie.length : v.grp.userData.pecore.length })()`)
await attendi(page, 400)
controlla('il cartello dice quante galline e quanto costa un\'altra', (await cartelloDi('🐔').innerText()).includes(`1/${AN.posti}`) && (await compraDa('🐔').innerText()).includes('🪙 ' + AN.prezzoBestia))
uguale('nella scena c\'è una gallina sola', await scena3(idP), 1)
// senza monete il pulsante è grigio ma risponde, e non compra
await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(m.monete()) })
await attendi(page, 400)
uguale('senza monete il pulsante è spento (aria-disabled)', await compraDa('🐔').getAttribute('aria-disabled'), 'true')
await compraDa('🐔').dispatchEvent('click')
await attendi(page, 300)
uguale('e non compra', (await bestieDi(idP)).length, 1)
await m3(() => { const m = window.__fattoria3d.motore; m.borsa.paga(-1000) })
await attendi(page, 400)
const monP = await monete()
await compraDa('🐔').dispatchEvent('click')
await attendi(page, 400)
uguale('comprarla aggiunge una bestia', (await bestieDi(idP)).length, 2)
uguale('e costa quanto dicono i dati', monP - await monete(), AN.prezzoBestia)
uguale('nella scena le galline sono due', await scena3(idP), 2)
controlla('il cartello conta 2 e il prezzo sale', (await cartelloDi('🐔').innerText()).includes(`2/${AN.posti}`) && (await compraDa('🐔').innerText()).includes('🪙 ' + (AN.prezzoBestia + AN.rincaroBestia)))
// il tempo passa: le uova aspettano, si raccolgono in un gesto, il contatore e il HUD le vedono
await passa(AN.ms + 1000)
await tocca3d(idP)
uguale('raccogliere porta le uova in dispensa (la gallina nutrita)', (await stato()).prodotti.uova, 1)
controlla('le bestie hanno di nuovo fame', (await bestieDi(idP)).every(f => f === null))
await attendi(page, 500)
controlla('il HUD mostra le uova', /🥚/.test(await page.locator('[data-f3="prodotti"]').innerText()))
uguale('il contatore delle uova avanza', ((await leggiProfilo(page)).totals || {}).fattoria3dUova, 1)
// la stalla: il latte
const idS = await mettiCortile('stalla')
controlla('la stalla si mette sul prato', !!idS)
await m3(`window.__fattoria3d.motore.s.merci['${ST.mangia[0]}'] = ${ST.pasti * 3}`)
await tocca3d(idS)
controlla('toccare la stalla nutre la mucca', (await bestieDi(idS))[0] !== null)
await passa(ST.ms + 1000)
await tocca3d(idS)
uguale('raccogliere porta il latte in dispensa', (await stato()).prodotti.latte, 1)
await attendi(page, 500)
uguale('il contatore del latte avanza', ((await leggiProfilo(page)).totals || {}).fattoria3dLatte, 1)
controlla('il HUD mostra anche il latte', /🥛/.test(await page.locator('[data-f3="prodotti"]').innerText()))
// la stalla e il recinto funzionano allo stesso modo: una bestia nel prezzo, le altre dal cartello, fino alla capienza
await compraDa('🐄').dispatchEvent('click')
await attendi(page, 300)
uguale('una seconda mucca dal cartello della stalla', [(await bestieDi(idS)).length, await scena3(idS)].join(), '2,2')
const idR = await mettiCortile('recinto')
controlla('il recinto si mette sul prato', !!idR)
const pecoreDi = id => m3(`window.__fattoria3d.motore.cose.find(c => c.id === ${JSON.stringify(id)}).pecore.map(p => p.eta)`)
uguale('il recinto parte con una pecora sola', (await pecoreDi(idR)).join(), 'adulta')
await attendi(page, 300)
await compraDa('🐑').dispatchEvent('click')
await attendi(page, 300)
uguale('la seconda pecora arriva adulta, anche nella scena', [(await pecoreDi(idR)).join(), await scena3(idR)].join(), 'adulta,adulta,2')
for (let k = 0; k < 4; k++) await compraDa('🐑').dispatchEvent('click')
await attendi(page, 300)
uguale('al tetto le pecore sono quattro e il pulsante sparisce', [(await pecoreDi(idR)).length, await compraDa('🐑').isHidden()].join(), '4,true')
// un pollaio con le bestie non si mette via, e il tetto dei posti vale
const via = await m3(`window.__fattoria3d.motore.mettiVia(${JSON.stringify(idP)})`)
controlla('il pollaio con le bestie non si mette via', via.ok === false && via.motivo === 'ha-le-bestie')

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
