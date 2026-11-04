/* ═══════════════════════════════════════════════════════════════════
   DENTRO LA CASA DELLA FATTORIA 3D, COL DITO — docs/fattoria3d/casa.md

   Si entra e la casa non ha fogli per le stanze: quelle da comprare hanno un pavimento accennato e un cartello, sul muro dove si aprirebbe la
   porta o sul bordo con la freccia se è fuori schermo. Il divano girato sta lungo il muro dove la porta ancora non c'è; toccando il cartello si
   apre la domanda del terreno, «Non ora» non costa, «Compra» allarga la casa e il divano si sposta, e lo dice il contadino. Il tasto 🎨 apre la
   striscia della stanza dove si sta: un colore si vede subito e non costa, ✖️ lo toglie, «Compra» paga solo quello che è cambiato. Le finestre
   nuove stanno nel catalogo, con la foto, e si appendono. Senza monete si dice quante ne mancano e niente cambia.
   Il dito è vero (`Input.dispatchTouchEvent`): un `page.click()` non porta i pointer del tocco (docs/core/il-dito.md).
   `node test/esegui.mjs fattoria3d-casa`
   tempo: 25
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli } from '../aiuto/browser.mjs'
import { controlla, stessaLista as uguale, riassunto } from '../aiuto/verifica.mjs'
import { MOBILI, PREZZI_FINITURE, PREZZI_STANZE, STANZE, origine } from '../../src/giochi/fattoria3d/dati/interni.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { coins: 500, settings: { eta: 8, sperimentali: true } })

const cdp = await page.context().newCDPSession(page)
const tocca = async (x, y) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const toccaEl = async sel => { await page.locator(sel).first().scrollIntoViewIfNeeded().catch(() => {}); const r = await page.locator(sel).first().boundingBox(); await tocca(r.x + r.width / 2, r.y + r.height / 2); await attendi(page, 120) }
const m3 = (fn, arg) => page.evaluate(fn, arg)
const monete = () => m3(() => window.__fattoria3d.motore.monete())
const interni = () => m3(() => JSON.parse(JSON.stringify(window.__fattoria3d.motore.s.interni)))
/** Dove cade sullo schermo un punto del pavimento. */
const punto = (x, z) => m3(([x, z]) => { const c = window.__fattoria3d.interni.scena(), r = c.canvas.getBoundingClientRect(), [px, py] = c.proietta({ x, y: 0, z }); return [px + r.left, py + r.top] }, [x, z])
const toccaPavimento = async (x, z) => { const [px, py] = await punto(x, z); await tocca(px, py); await attendi(page, 150) }
const fermo = async () => { await page.waitForFunction(() => window.__fattoria3d.interni.scena().eroe.fermo, null, { timeout: 8000 }); await attendi(page, 500) }
const cartelli = () => m3(() => [...window.__fattoria3d.interni.scena().badge].map(([id, b]) => { const r = b.el.getBoundingClientRect(); return { id, testo: b.el.textContent, visto: b.visto, x: r.left + r.width / 2, y: r.top + r.height / 2, sx: r.left, dx: r.right } }))
const toccaCartello = async id => { const c = (await cartelli()).find(x => x.id === id); await tocca(c.x, c.y); await attendi(page, 200) }

await scegli(page, 'fattoria3d')
await page.waitForSelector('[data-f3="campo"] canvas', { timeout: 10000 })
await page.waitForFunction(() => !!(window.__fattoria3d && window.__fattoria3d.mondo), null, { timeout: 15000 })
await attendi(page, 800)
await m3(() => window.__fattoria3d.interni.entra())
await page.waitForSelector('[data-f3="tela-casa"]', { timeout: 5000 })
await page.waitForFunction(() => !!window.__fattoria3d.interni.scena(), null, { timeout: 15000 })
await attendi(page, 1000)
const { i0, j0 } = origine(STANZE[0])

/* ── le stanze si vendono in scena: niente foglio, un cartello per ogni stanza che confina, tutti sullo schermo ── */
controlla('il foglio delle stanze non c\'è più', await page.locator('[data-f3="apri-pianta"]').count() === 0)
const primi = await cartelli(), largo = page.viewportSize().width
uguale('tre stanze in vendita: ovest, est e dietro', primi.map(c => c.id).sort(), [1, 2, 3])
controlla('ogni cartello dice il prezzo della seconda stanza', primi.every(c => c.testo.includes(`🪙 ${PREZZI_STANZE[1]}`)))
controlla('e si vede tutto, anche quelli delle porte fuori schermo', primi.every(c => c.visto && c.sx >= 0 && c.dx <= largo), JSON.stringify(primi))
controlla('la stanza a ovest ha la freccia a sinistra, quella a est a destra', primi.find(c => c.id === 1).testo.startsWith('←') && primi.find(c => c.id === 2).testo.startsWith('→'))
await scatto(page, 'fattoria3d-casa-in-vendita')

/* ── il divano girato lungo il muro, dove una porta ancora non c'è ── */
await toccaPavimento(i0 + 1.5, j0 + 2.5)
await fermo()
await toccaEl('[data-f3="apri-arreda"]')
await page.waitForSelector('[data-mobile-carta="divano"]', { timeout: 3000 })
await toccaEl('[data-mobile-carta="divano"]')
await page.waitForSelector('[data-f3="mano"]', { timeout: 3000 })
await toccaEl('[data-f3="mano-gira"]')
await tocca(...await punto(i0 + 0.5, j0 + 2.5))
await attendi(page, 200)
uguale('il divano lungo il muro ci sta', await page.locator('[data-f3="mano"]').getAttribute('data-ok'), 'true')
const soldi0 = await monete()
await toccaEl('[data-f3="mano-posa"]')
uguale('si paga posandolo', await monete(), soldi0 - MOBILI.divano.prezzo)
const divano = (await interni()).mobili.find(m => m.tipo === 'divano')
uguale('sta dove l\'ho messo, girato', [divano.i, divano.j, divano.rot], [i0, j0 + 1, 1])

/* ── la stanza nuova si compra col dito, come un lotto ── */
const soldi1 = await monete()
await toccaCartello(1)
await page.waitForSelector('[data-f3="dialogo"]', { timeout: 3000 })
controlla('la domanda è quella del terreno, col prezzo', (await page.locator('[data-f3="dialogo"] [data-scelta="0"]').innerText()).includes(`🪙 ${PREZZI_STANZE[1]}`))
await toccaEl('[data-f3="dialogo"] [data-scelta="1"]')
uguale('«Non ora» non costa e non compra', [await monete(), (await interni()).stanze], [soldi1, [0]])
await attendi(page, 500)
await toccaCartello(1)
await page.waitForSelector('[data-f3="dialogo"]', { timeout: 3000 })
await toccaEl('[data-f3="dialogo"] [data-scelta="0"]')
uguale('«Compra» allarga la casa', [await monete(), (await interni()).stanze], [soldi1 - PREZZI_STANZE[1], [0, 1]])
const spostato = (await interni()).mobili.find(m => m.tipo === 'divano')
controlla('il divano si è tolto dalla porta nuova', spostato.j + 2 < j0 + 2 || spostato.j > j0 + 2 || spostato.i !== i0, JSON.stringify(spostato))
controlla('e lo dice il contadino', /ho spostato: Divano/.test(await page.locator('.f3-fumetto').innerText()))
const dopo = await cartelli()
uguale('il cartello di quella stanza è sparito, ne restano tre', dopo.map(c => c.id).sort(), [2, 3, 4])
controlla('e il prezzo è salito', dopo.every(c => c.testo.includes(`🪙 ${PREZZI_STANZE[2]}`)))

/* ── pavimento e pareti: si provano gratis, si paga solo quello che cambia ── */
await toccaEl('[data-f3="apri-tinte"]')
await page.waitForSelector('[data-f3="tinte"]', { timeout: 3000 })
uguale('la striscia è per la stanza dove sto', await page.locator('[data-f3="tinte"]').getAttribute('data-stanza'), '0')
controlla('i cartelli si tolgono di mezzo', (await cartelli()).every(c => !c.visto))
controlla('finché non cambia niente «Compra» è spento', await page.locator('[data-f3="tinte-compra"].spenta').count() === 1)
const soldi2 = await monete(), prima = (await interni()).finiture[0]
await toccaEl('[data-pavimento="scacchi"]')
uguale('un colore si vede subito', await m3(() => window.__fattoria3d.interni.scena().prova.finitura.pavimento), 'scacchi')
uguale('e non è ancora pagato', [await monete(), (await interni()).finiture[0]], [soldi2, prima])
await toccaEl('[data-f3="tinte-lascia"]')
uguale('✖️ lo toglie senza pagare', [await monete(), (await interni()).finiture[0], await m3(() => window.__fattoria3d.interni.scena().prova)], [soldi2, prima, null])
await toccaEl('[data-f3="apri-tinte"]')
await page.waitForSelector('[data-f3="tinte"]', { timeout: 3000 })
await toccaEl('[data-pavimento="scacchi"]')
await toccaEl('[data-parte="pareti"]')
await toccaEl('[data-pareti="rosa"]')
const prezzo = PREZZI_FINITURE.pavimento + PREZZI_FINITURE.pareti
controlla('il tasto dice la somma', (await page.locator('[data-f3="tinte-compra"]').innerText()).includes(`🪙${prezzo}`))
const striscia = await page.locator('[data-f3="tinte"]').boundingBox()
controlla('la striscia sta nello schermo e la stanza si vede sopra', striscia.x >= 0 && striscia.x + striscia.width <= largo && striscia.y > page.viewportSize().height / 2, JSON.stringify(striscia))
controlla('i tasti sono alti per il dito', (await page.locator('[data-f3="tinte-compra"]').boundingBox()).height >= 44)
await scatto(page, 'fattoria3d-casa-colori')
await toccaEl('[data-f3="tinte-compra"]')
uguale('«Compra» paga pavimento e pareti', [await monete(), (await interni()).finiture[0].pavimento, (await interni()).finiture[0].pareti], [soldi2 - prezzo, 'scacchi', 'rosa'])
controlla('la striscia si chiude', await page.locator('[data-f3="tinte"]').count() === 0)

/* ── le finestre nuove: nel catalogo con la foto, e si appendono ── */
await toccaEl('[data-f3="apri-arreda"]')
await page.waitForSelector('[data-scheda-casa="muro"]', { timeout: 3000 })
await toccaEl('[data-scheda-casa="muro"]')
for (const t of ['finestra-larga', 'finestra-tonda', 'finestra-fiori']) await page.waitForSelector(`[data-mobile-carta="${t}"] img`, { timeout: 8000 })
await scatto(page, 'fattoria3d-casa-finestre')
await toccaEl('[data-mobile-carta="finestra-larga"]')
await page.waitForSelector('[data-f3="mano"]', { timeout: 3000 })
uguale('sulla parete di fondo c\'è posto', await page.locator('[data-f3="mano"]').getAttribute('data-ok'), 'true')
const soldi3 = await monete()
await toccaEl('[data-f3="mano-posa"]')
uguale('la finestra grande è pagata', await monete(), soldi3 - MOBILI['finestra-larga'].prezzo)
controlla('ed è appesa in cima a una stanza', (await interni()).mobili.some(m => m.tipo === 'finestra-larga' && (m.j === j0 || m.j === origine(STANZE[1]).j0)))
await attendi(page, 500)
await scatto(page, 'fattoria3d-casa-finestra-appesa')

/* ── un mobile che non ci sta dice perché ── */
await toccaEl('[data-f3="apri-arreda"]')
await toccaEl('[data-scheda-casa="soggiorno"]')
await page.waitForSelector('[data-mobile-carta="pouf"]', { timeout: 3000 })
await toccaEl('[data-mobile-carta="pouf"]')
await page.waitForSelector('[data-f3="mano"]', { timeout: 3000 })
const porta = await m3(() => { const c = window.__fattoria3d.interni.scena(); c.mano.i = window.__fattoria3d.motore.s.interni.mobili[0].i; c.mano.j = window.__fattoria3d.motore.s.interni.mobili[0].j; c._aggiornaMano(); return c.mano.ok })
uguale('sopra l\'armadio no', porta, false)
controlla('e la riga dice il motivo', /già qualcos/.test(await page.locator('[data-f3="mano-riga"]').innerText()))
await toccaEl('[data-f3="mano-lascia"]')

/* ── senza monete si dice quante ne mancano, e niente cambia ── */
await m3(() => { const { motore } = window.__fattoria3d; motore.borsa.paga(motore.monete() - 3) })
await attendi(page, 200)
await toccaEl('[data-f3="apri-tinte"]')
await page.waitForSelector('[data-f3="tinte"]', { timeout: 3000 })
await toccaEl('[data-pavimento="cotto"]')
await toccaEl('[data-f3="tinte-compra"]')
controlla('la striscia dice quante ne mancano', (await page.locator('[data-f3="tinte-riga"]').innerText()).includes(`🪙${PREZZI_FINITURE.pavimento - 3}`))
uguale('e il pavimento resta quello pagato', (await interni()).finiture[0].pavimento, 'scacchi')
await toccaEl('[data-f3="tinte-lascia"]')
await attendi(page, 300)
await toccaCartello((await cartelli())[0].id)
await page.waitForSelector('[data-f3="dialogo"]', { timeout: 3000 })
await toccaEl('[data-f3="dialogo"] [data-scelta="0"]')
uguale('una stanza senza monete non si compra', (await interni()).stanze, [0, 1])
controlla('e lo dice il contadino', /Ti mancano/.test(await page.locator('.f3-fumetto').innerText()))

controlla('nessun errore JS', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('Fattoria 3D — dentro la casa, col dito')
