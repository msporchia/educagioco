/* ═══════════════════════════════════════════════════════════════════
   LE BESTIE DI CASA DELLA FATTORIA 3D, COL DITO — docs/fattoria3d/bestie-di-casa.md

   Si apre il menu «Compra» (🛒), la scheda Animali offre tutti gli animali da adottare (razze e compagni); una chiusa dice il livello; una a cui
   mancano le monete lo dice e non cambia niente; con le monete si prende (🪙90 il beagle), arriva in scena e si apre il battesimo: un nome si
   TOCCA (e sotto si può scrivere: «✎ Nome» nel foglio, una parola scritta e «Va bene» la salva). Un tocco vero sulla bestia in scena apre il suo foglio (✕ in alto a destra): tre bisogni, i cibi suoi, una carezza
   gratis che non costa; un cibo dà da mangiare e scala le monete; tenendola premuta la bestia segue il dito (gratis, salvato), e il tocco porta accanto le sue opzioni; a 360 px il foglio
   non scorre di lato e i bottoni sono alti almeno 44 px.
   Il dito è vero (`Input.dispatchTouchEvent`): un `page.click()` non porta i pointer del tocco (docs/core/il-dito.md).
   `node test/esegui.mjs fattoria3d-bestie --niente-build`
   tempo: 40
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 500, settings: { eta: 8, sperimentali: true } })

const cdp = await page.context().newCDPSession(page)
const tocca = async (x, y) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const toccaEl = async sel => { await page.locator(sel).first().scrollIntoViewIfNeeded().catch(() => {}); const r = await page.locator(sel).first().boundingBox(); await tocca(r.x + r.width / 2, r.y + r.height / 2) }
const m3 = (fn, arg) => page.evaluate(fn, arg)
const monete = () => page.evaluate(() => window.__fattoria3d.motore.monete())
const speso = () => page.evaluate(() => window.__fattoria3d.motore.s.esperienza)      // ogni spesa conta come esperienza: non lo sfalsa il regalo di un livello che sale

await scegli(page, 'fattoria3d')
await page.waitForSelector('[data-f3="campo"] canvas', { timeout: 10000 })
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
await attendi(page, 800)

const livello = liv => m3(e => { const { motore, mondo } = window.__fattoria3d; motore.s.esperienza = e; mondo.cambiato() }, sogliaDi(liv))
const apriAnimali = async () => {
  await toccaEl('[data-f3="az-costruisci"]')
  await page.waitForSelector('[data-f3="costruisci-qui"]', { timeout: 3000 })
  await toccaEl('[data-f3="costruisci-qui"] [data-gruppo="fattoria"]')
  await attendi(page, 100)
  await toccaEl('[data-f3="costruisci-qui"] [data-scheda="animali"]')
  await attendi(page, 200)
}

/* ── la scheda Animali offre le bestie, chiuse sotto il livello ── */
await livello(3)
await apriAnimali()
controlla('tutti gli animali da adottare sono nella scheda Animali (le razze e i cinque compagni)', await page.locator('[data-carta^="bestia:"]').count() === 15)
controlla('in vendita dice com\'è fatto, non un nome', /Gatto nero/.test(await page.locator('[data-carta="bestia:golia"]').innerText()) && !/Golia/.test(await page.locator('[data-carta="bestia:golia"]').innerText()))
await toccaEl('[data-carta="bestia:golia"]')
uguale('anche il lucchetto', await page.locator('[data-f3="costruisci-msg"]').innerText(), 'Gatto nero: arriva al livello 14')
await toccaEl('[data-carta="bestia:beagle"]')
controlla('chiuso: dice il livello 15', /livello 15/i.test(await page.locator('[data-f3="costruisci-msg"]').innerText()))
uguale('niente monete spese', await monete(), 500)
await scatto(page, 'fattoria3d-bestie-menu')
await toccaEl('[data-f3="costruisci-qui"] [data-chiudi]')

/* ── con il livello ma senza monete ── */
await livello(15)
await m3(() => { const { motore } = window.__fattoria3d; motore.borsa.paga(motore.monete() - 40) })
await apriAnimali()
controlla('aperto, il beagle costa 🪙90 come in 2D', /90/.test(await page.locator('[data-carta="bestia:beagle"]').innerText()))
await toccaEl('[data-carta="bestia:beagle"]')
controlla('senza monete lo dice e il menu resta', /Servono/.test(await page.locator('[data-f3="costruisci-msg"]').innerText()) && await page.locator('[data-f3="costruisci-qui"]').count() === 1)
uguale('e non cambia niente', await monete(), 40)
uguale('e non l\'hai', await m3(() => window.__fattoria3d.motore.cura.ho('beagle')), false)
await toccaEl('[data-f3="costruisci-qui"] [data-chiudi]')

/* ── si prende ── */
await m3(() => { const { motore } = window.__fattoria3d; motore.borsa.paga(-400) })
const prima = await monete()
await apriAnimali()
await toccaEl('[data-carta="bestia:beagle"]')
await page.waitForSelector('[data-f3="battesimo"]', { timeout: 3000 })
uguale('costa 90 monete', prima - await monete(), 90)
controlla('si apre il battesimo con nomi da toccare', await page.locator('[data-f3="battesimo"] [data-nome]').count() >= 6)
await scatto(page, 'fattoria3d-bestie-battesimo')
await toccaEl('[data-f3="battesimo"] [data-nome="Birba"]')
uguale('il nome scelto è salvato', await m3(() => window.__fattoria3d.motore.cura.nomeDi('beagle')), 'Birba')
await attendi(page, 1500)
controlla('la bestia è in scena', await m3(() => window.__fattoria3d.mondo.compagni.lista.some(c => c.def.id === 'beagle' && c.def.nome === 'Birba')))

/* ── il foglio dice come sta e serve per nome e vestiti: la cura si fa sul prato ── */
const schermoDi = (x, z) => m3(([x, z]) => { const { mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect(), [px, py] = mondo.proietta({ x, y: 0.15, z }); return [r.left + px, r.top + py] }, [x, z])
const apriFoglio = async () => {
  await apriAnimali()
  await toccaEl('[data-carta="bestia:beagle"]')
  await page.waitForSelector('[data-f3="bestia"]', { timeout: 3000 })
}
await apriFoglio()
controlla('la carta di una bestia tua apre il foglio', await page.locator('[data-f3="bestia"]').count() === 1)
controlla('il foglio ha il suo nome', /Birba/.test(await page.locator('[data-f3="bestia-nome"]').innerText()))
uguale('tre bisogni', await page.locator('[data-bisogno]').count(), 3)
uguale('niente gesti nel foglio', await page.locator('[data-f3="bestia"] [data-cibo], [data-f3="bestia"] [data-coccola], [data-azione="carezza"]').count(), 0)
await scatto(page, 'fattoria3d-bestie-foglio')
await toccaEl('[data-f3="bestia"] [data-chiudi]')

/* ── la ciotola: nata con lui, ha fame e chiede, un tocco vero sul prato la apre ── */
const pezzoSulPrato = async (trova, selettore, prove = 8) => {
  const [x, z] = await m3(trova)
  await m3(([x, z]) => { const c = window.__fattoria3d.mondo.camera; c.libera.on = true; c.libera.x = x; c.libera.z = z; c.x = x; c.z = z }, [x, z])
  await attendi(page, 400)
  for (let prova = 0; prova < prove && await page.locator(selettore).count() === 0; prova++) {
    await tocca(...await schermoDi(x, z))
    await attendi(page, 300)
    await page.waitForFunction(() => { const e = window.__fattoria3d.mondo.eroe; return !e.percorso.length && !e.az }, null, { timeout: 15000 })      // la camera lo segue: un secondo tocco, da fermo
    await attendi(page, 300)
  }
}
await m3(() => { const { motore } = window.__fattoria3d; motore.cura.casa.beagle.pancia = 0.2; motore.borsa.paga(-50) })
await attendi(page, 900)
controlla('sulla ciotola c\'è quello che chiede', await page.locator('.f3-badge.fame[data-ciotola="beagle"]').count() === 1)
const CIOTOLA = '[data-f3="attrezzi"][data-tipo="ciotola"]', TINOZZA = '[data-f3="attrezzi"][data-tipo="tinozza"]'
await pezzoSulPrato(() => { const k = window.__fattoria3d.motore.cura.ciotolaDi('beagle'); return [k.i + 0.5, k.j + 0.5] }, CIOTOLA)
controlla('un tocco sulla ciotola porta i cibi accanto', await page.locator(CIOTOLA).count() === 1)
controlla('dice chi ha fame e cosa vorrebbe', /Birba vorrebbe/.test(await page.locator('[data-f3="attrezzi-riga"]').innerText()))
controlla('i cibi sono solo i suoi (cane: osso e bistecca, non carota)', await page.locator('[data-cibo="osso"]').count() === 1 && await page.locator('[data-cibo="carota"]').count() === 0)
uguale('un gettone è quello che chiede', await page.locator(`${CIOTOLA} [data-vuole]`).count(), 1)
await scatto(page, 'fattoria3d-bestie-ciotola')
const m1 = await monete()
const trascina = async (sel, [x, y]) => {
  const r = await page.locator(sel).first().boundingBox()
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await page.mouse.down()
  await page.mouse.move(x, y, { steps: 8 }); await attendi(page, 80); await page.mouse.up(); await attendi(page, 200)
}
await trascina('[data-cibo="osso"]', await schermoDi(...await m3(() => { const k = window.__fattoria3d.motore.cura.ciotolaDi('beagle'); return [k.i + 0.5, k.j + 0.5] })))
uguale('l\'osso trascinato nella ciotola costa 5', m1 - await monete(), 5)
uguale('la ciotola si chiude', await page.locator(CIOTOLA).count(), 0)
await attendi(page, 700)
controlla('corre a mangiare', await m3(() => { const c = window.__fattoria3d.mondo.compagni.lista.find(o => o.def.id === 'beagle'); return !!c.seq }))

/* ── la tinozza: si sceglie, si strofina col dito, si paga alla fine ── */
await m3(() => { const { motore } = window.__fattoria3d; motore.cura.casa.beagle.pelo = 0.3; motore.cura.casa.beagle.pancia = 0.9 })
await pezzoSulPrato(() => { const k = window.__fattoria3d.motore.cura.ciotolaDi('beagle'); return [k.i + 0.5, k.j + 0.5] }, CIOTOLA, 1)
uguale('senza fame la ciotola non si apre', await page.locator(CIOTOLA).count(), 0)
await pezzoSulPrato(() => { const k = window.__fattoria3d.motore.cura.tinozza(); return [k.i + 1, k.j + 1] }, TINOZZA)
controlla('un tocco sulla tinozza mostra chi è sporco, in vignetta', await page.locator('[data-sporca="beagle"]').count() === 1)
await scatto(page, 'fattoria3d-bestie-tinozza')
const mBagno = await monete()
await trascina('[data-sporca="beagle"]', await schermoDi(...await m3(() => { const k = window.__fattoria3d.motore.cura.tinozza(); return [k.i + 1, k.j + 1] })))
await attendi(page, 300)
await page.waitForSelector('[data-f3="bagno"]', { timeout: 3000 })
await page.waitForFunction(() => window.__fattoria3d.mondo.compagni.lista.find(o => o.def.id === 'beagle').inBagno?.dentro, null, { timeout: 15000 })
uguale('si paga solo alla fine', mBagno - await monete(), 0)
await page.mouse.move(180, 400); await page.mouse.down()
for (let k = 0; k < 40 && await page.locator('[data-f3="bagno"]').count(); k++) { await page.mouse.move(k % 2 ? 120 : 260, 400 + (k % 3) * 20, { steps: 2 }); await attendi(page, 30) }
await page.mouse.up()
uguale('il bagno è finito', await page.locator('[data-f3="bagno"]').count(), 0)
uguale('🪙1', mBagno - await monete(), 1)
controlla('è pulito del tutto', await m3(() => window.__fattoria3d.motore.cura.casa.beagle.pelo) === 1)
await m3(() => { const c = window.__fattoria3d.mondo.camera; c.segui() })
await apriFoglio()

/* ── gli addobbi (viste/Addobbi.vue, l'interfaccia unica: docs/core/personalizza.md, docs/fattoria3d/addobbi.md): la bestia grande che gira, si prova
   prima di comprare, ogni colore si paga, un colore tuo si rimette gratis, un set si salva ── */
await page.setViewportSize({ width: 390, height: 844 })
await m3(() => { const { motore } = window.__fattoria3d; motore.borsa.paga(-100) })
await toccaEl('[data-azione="negozio"]')
await page.waitForSelector('[data-f3="addobbi"]', { timeout: 3000 })
controlla('gli addobbi sostituiscono il foglio', await page.locator('[data-f3="bestia"]').count() === 0)
controlla('la ✕ in alto a destra', await page.locator('[data-f3="addobbi"] [data-chiudi]').count() === 1)
uguale('le schede: in testa, sul muso, al collo, sulla schiena, set', await page.locator('[data-f3="addobbi"] [data-prs-scheda]').evaluateAll(l => l.map(b => b.dataset.prsScheda).join()), 'testa,muso,collo,schiena,set')
await page.waitForSelector('[data-f3="addobbi-ritratto"] img', { timeout: 8000 })
const src0 = await m3(() => document.querySelector('[data-f3="addobbi-ritratto"] img').src)
await toccaEl('[data-f3="addobbi"] [data-prs="gira-dx"]')
controlla('girare la cambia di angolo',
  !!await page.waitForFunction(s => { const i = document.querySelector('[data-f3="addobbi-ritratto"] img'); return i && i.src !== s }, src0, { timeout: 5000 }).catch(() => null))
const n0 = await monete(), e0 = await speso()
await toccaEl('[data-f3="addobbi"] [data-addobbo="cappellino"]')
await toccaEl('[data-f3="addobbi"] [data-colore="rosso"]')
await attendi(page, 600)
uguale('provare non costa niente', await monete(), n0)
uguale('e non lo mette', await m3(() => JSON.stringify(window.__fattoria3d.motore.cura.addossoA('beagle'))), '{}')
await scatto(page, 'fattoria3d-bestie-addobbi-prova')
await toccaEl('[data-f3="addobbi"] [data-prs="paga"]')
uguale('«Acquista e indossa» compra il cappellino rosso: 🪙12', await speso() - e0, 12)
uguale('lo porta', await m3(() => window.__fattoria3d.motore.cura.addossoA('beagle').testa), 'cappellino:rosso')
await attendi(page, 500)
// il primo addobbo addosso porta il traguardo «Che eleganza»: un velo da chiudere, poi si continua
if (await page.locator('.velo').count()) { await toccaEl('.velo'); await attendi(page, 500) }
await toccaEl('[data-f3="addobbi"] [data-colore="verde"]')
await attendi(page, 500)
await toccaEl('[data-f3="addobbi"] [data-prs="paga"]')
uguale('il verde si paga di nuovo', await speso() - e0, 24)
await attendi(page, 500)
await toccaEl('[data-f3="addobbi"] [data-colore="rosso"]')
await attendi(page, 500)
uguale('il rosso è tuo: si rimette subito, gratis', await speso() - e0, 24)
uguale('…e lo porta', await m3(() => window.__fattoria3d.motore.cura.addossoA('beagle').testa), 'cappellino:rosso')
await toccaEl('[data-f3="addobbi"] [data-prs-scheda="set"]')
await toccaEl('[data-f3="addobbi"] [data-prs="salva-set"]')
await toccaEl('[data-f3="addobbi"] [data-prs="nome-ok"]')
uguale('il set si salva sulla bestia', await m3(() => JSON.stringify(window.__fattoria3d.motore.cura.vestitiDi('beagle').map(v => [v.posto, v.addobbi.testa]))), '[[0,"cappellino:rosso"]]')
await attendi(page, 1200)
await scatto(page, 'fattoria3d-bestie-addobbi')
await toccaEl('[data-f3="addobbi"] [data-chiudi]')
await page.waitForSelector('[data-f3="bestia"]', { timeout: 3000 })
controlla('la ✕ torna al foglio della bestia', await page.locator('[data-f3="addobbi"]').count() === 0)
await page.setViewportSize({ width: 1280, height: 800 })

/* ── 360 px ── */
await page.setViewportSize({ width: 360, height: 700 })
await attendi(page, 300)
controlla('a 360 px il foglio non scorre di lato', await m3(() => { const f = document.querySelector('[data-f3="bestia"]'); return f.scrollWidth <= f.clientWidth + 1 && document.documentElement.scrollWidth <= window.innerWidth + 1 }))
controlla('i bottoni sono alti almeno 44 px', await m3(() => [...document.querySelectorAll('[data-f3="bestia"] button:not(.f3-chiudi)')].every(b => b.getBoundingClientRect().height >= 44)))
await scatto(page, 'fattoria3d-bestie-360')
await page.setViewportSize({ width: 1280, height: 800 })

/* ── tenere premuto è spostare: gratis, e si salva ── */
const m2 = await monete()
uguale('spostare non è un tasto del foglio', await page.locator('[data-azione="sposta"]').count(), 0)
await toccaEl('[data-f3="bestia"] [data-chiudi]')
const cella = await m3(() => { const { motore, mondo } = window.__fattoria3d, r = mondo.canvas.getBoundingClientRect()
  for (let j = -8; j < 8; j++) for (let i = -8; i < 8; i++) { if (!motore.cellaPropria(i, j) || !motore.libera(i, j)) continue
    const [px, py, v] = mondo.proietta({ x: i + 0.5, y: 0, z: j + 0.5 }); if (v && px > 80 && px < r.width - 80 && py > 150 && py < r.height - 220 && Math.hypot(i + 0.5 - mondo.eroe.x, j + 0.5 - mondo.eroe.z) > 3) return [i, j] }
  return null })
controlla('c\'è una cella libera in vista', !!cella)
const sullaBestia = () => m3(() => { const { mondo } = window.__fattoria3d, c = mondo.compagni.lista.find(o => o.def.id === 'beagle'), r = mondo.canvas.getBoundingClientRect(), [px, py] = mondo.proietta({ x: c.x, y: 0.3, z: c.z }); return [r.left + px, r.top + py] })
const tenuta = () => m3(() => !!window.__fattoria3d.mondo.compagni.lista.find(o => o.def.id === 'beagle').tenuta)
for (let prova = 0; prova < 4 && !await tenuta(); prova++) {                  // cammina: si riprova se il dito l'ha mancata
  const [x, y] = await sullaBestia()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await attendi(page, 700)
  if (!await tenuta()) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await attendi(page, 300); await m3(() => window.__fattoria3d.mondo.attrezzi.chiudi()) }
}
controlla('tenuta premuta si solleva', await tenuta())
{
  const [x, y] = await schermoDi(cella[0] + 0.5, cella[1] + 0.5)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await attendi(page, 150)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await attendi(page, 600)
}
controlla('staccando il dito non è più tenuta, e non si apre niente', !await tenuta() && await page.locator('[data-f3="bestia"]').count() === 0)
uguale('spostare è gratis', await monete(), m2)
uguale('la casa della bestia è lì', String(await m3(() => window.__fattoria3d.motore.cura.casaDi('beagle'))), String(cella))
controlla('e la salva nello stato', await m3(() => JSON.stringify(window.__fattoria3d.motore.serializza().casa.beagle.i) !== undefined))

/* ── il tocco: si gioca, e accanto compaiono le sue opzioni ── */
{
  let aperto = false
  for (let prova = 0; prova < 4 && !aperto; prova++) { await tocca(...await sullaBestia()); await attendi(page, 300); aperto = await page.locator('[data-f3="attrezzi"][data-tipo="opzioni"]').count() === 1 }
  controlla('il tocco porta accanto le opzioni dell\'animale', aperto)
  controlla('fra cui i vestiti e come sta', await page.locator('[data-opzione="vesti"]').count() === 1 && await page.locator('[data-opzione="come"]').count() === 1)
  await scatto(page, 'fattoria3d-bestie-opzioni')
  await toccaEl('[data-opzione="come"]')
  await page.waitForSelector('[data-f3="bestia"]', { timeout: 3000 })
  controlla('«Come sta» apre il foglio e chiude l\'arco', await page.locator('[data-f3="attrezzi"]').count() === 0)
  await toccaEl('[data-f3="bestia"] [data-chiudi]')
}

/* ── un nome scritto, non della lista ── */
await attendi(page, 800)
await apriFoglio()
await toccaEl('[data-azione="nome"]')
await page.waitForSelector('[data-f3="battesimo"]', { timeout: 3000 })
controlla('vuota, «Va bene» non si tocca', await page.locator('[data-azione="scrivi"]').isDisabled())
await toccaEl('[data-f3="battesimo-scrivi"]')
await page.keyboard.type(' Fulmine  Bello ')
await scatto(page, 'fattoria3d-bestie-scrivi')
await toccaEl('[data-azione="scrivi"]')
uguale('il nome scritto è salvato, senza spazi in più', await m3(() => window.__fattoria3d.motore.cura.nomeDi('beagle')), 'Fulmine Bello')
controlla('il battesimo si chiude', await page.locator('[data-f3="battesimo"]').count() === 0)
await attendi(page, 800)
await apriFoglio()
controlla('il foglio dice il nome scritto', /Fulmine Bello/.test(await page.locator('[data-f3="bestia-nome"]').innerText()))
await toccaEl('[data-azione="nome"]')
await page.waitForSelector('[data-f3="battesimo"]', { timeout: 3000 })
uguale('riaperto, la casella lo ripropone', await page.locator('[data-f3="battesimo-scrivi"]').inputValue(), 'Fulmine Bello')
await page.locator('[data-f3="battesimo-scrivi"]').fill('Lampo')
await page.keyboard.press('Enter')
uguale('l\'invio della tastiera salva come «Va bene»', await m3(() => window.__fattoria3d.motore.cura.nomeDi('beagle')), 'Lampo')

/* ── il gatto nero: il nome che portava da sempre sta fra quelli da toccare, e dopo la carta dice quello ── */
await apriAnimali()
await toccaEl('[data-carta="bestia:golia"]')
await page.waitForSelector('[data-f3="battesimo"]', { timeout: 3000 })
await toccaEl('[data-f3="battesimo"] [data-nome="Golia"]')
uguale('Golia si trova fra i nomi', await m3(() => window.__fattoria3d.motore.cura.nomeDi('golia')), 'Golia')
await apriAnimali()
controlla('la carta di uno tuo dice come si chiama', /Golia/.test(await page.locator('[data-carta="bestia:golia"]').innerText()))
await toccaEl('[data-f3="costruisci-qui"] [data-chiudi]')

controlla('nessun errore JS', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('Fattoria 3D — le bestie di casa, col dito')
