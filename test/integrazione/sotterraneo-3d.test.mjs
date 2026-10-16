/* ═══════════════════════════════════════════════════════════════════
   IL SOTTERRANEO 3D, COL DITO — docs/sotterraneo/grafica-3d.md

   Il Sotterraneo 3D è un gioco in prova (`sotterraneo3d`): la sua carta
   c'è solo coi giochi in prova accesi, e il Sotterraneo di sempre resta in
   2D. Qui si entra dalla carta, si sceglie l'eroe e si scende dalla terra
   di sopra (che resta quella del 2D); giù la scena è WebGL (in Chrome
   senza schermo la disegna SwiftShader, lento ma vero) e il motore è lo
   stesso: si cammina, si apre una porta rispondendo, si combatte (una
   risposta sbagliata, una giusta, il mostro che cade), si sale e si scende
   una scala da una sosta scritta in Node — che il 3D riprende come il 2D,
   perché la sosta è una sola. E senza WebGL lo si dice e si esce.
   Si tocca come un telefono (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-3d`
   tempo: 240
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scegliAvventura, scendiNelSotterraneo, scegliAttacco, leggiProfilo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { scrivi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { premioDellaBotte } from '../../src/giochi/sotterraneo/motore/botti.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const g3d = () => page.evaluate(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica())
const tela = page.locator('.sot-tela')
const cellaOra = async () => (await tela.getAttribute('data-eroe')).split(',').map(Number)
// dove cade sullo schermo un punto del mondo (la cella x, y; a quota `su`), in px della pagina
async function schermoDi(x, y, su = 0.05) {
  const [sx, sy] = await page.evaluate(([a, b, c]) => window.__sotterraneo3d.aSchermo(a, c, b), [x, y, su])
  const b = await tela.boundingBox()
  return { x: b.x + sx, y: b.y + sy }
}
const toccaLaCella = async (x, y, su) => { const p = await schermoDi(x + 0.5, y + 0.5, su); await tocca(p.x, p.y) }
// fermo il motore, e ferma la telecamera che lo segue morbida (in SwiftShader un fotogramma è lento: si aspetta un poco di più)
const fermo = async () => {
  await page.waitForFunction(() => { const c = window.__sotterraneo3d && window.__sotterraneo3d.corsa; return c && !(c.strada && c.strada.length) }, null, { timeout: 15000 })
  await attendi(page, 1200)
}
const piede = async () => (await page.locator('.sot-piede').innerText()).replace(/\s+/g, ' ')
// nel campo, fuori dalla mappina in alto a destra e dalla barra in basso
async function dentroIlCampo(p) {
  const b = await tela.boundingBox()
  return p.x > b.x + 20 && p.x < b.x + b.width - 140 && p.y > b.y + 30 && p.y < b.y + b.height - 60
}

/* ---------- 1. la carta solo coi giochi in prova, e si scende dalla terra di sopra ---------- */
await azzera(page)
uguale('coi giochi in prova spenti il Sotterraneo 3D non c\'è', await page.locator('[data-indice="sotterraneo3d"]').count(), 0)
await semina(page, { settings: { sperimentali: true } })
uguale('accesi, la carta c\'è', await page.locator('[data-indice="sotterraneo3d"]').count(), 1)
uguale('e il Sotterraneo di sempre resta', await page.locator('[data-indice="sotterraneo"]').count(), 1)
await scegli(page, 'sotterraneo3d')
await scegliAvventura(page, 'cavaliere')
controlla('la terra di sopra è quella di sempre (2D)', await page.locator('[data-terra]').count() === 1 && await page.locator('[data-tela="3d"]').count() === 0)
// un seme con una porta chiusa a pochi passi dall'arrivo (lo legge chi scende, come `#seme=` dei cheat)
await page.evaluate(() => { location.hash = 'sotterraneo3d&seme=11' })
await scendiNelSotterraneo(page, 0)
await page.waitForSelector('[data-tela="3d"]', { timeout: 10000 })
await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 15000 })
{
  const g = await g3d()
  uguale('giù la discesa si disegna in 3D', g.tre, true)
  uguale('nello scenario della discesa', g.scenario, CAMPAGNA[0].scenario)
  dentro('poche chiamate per fotogramma', g.chiamate, 10, 120)
  nota(`un fotogramma: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli, ${g.figure} figure, pixel ratio ${g.dpr}, ${g.ms} ms (SwiftShader), JS ${g.msJs} ms`)
  controlla('la barra in basso è quella vera', await page.locator('[data-barra="giu"]').count() === 1)
  controlla('e la mappina c\'è', await page.locator('.sot3d-mappina').count() === 1)
}
await scatto(page, 'sotterraneo-3d-giu')

/* ---------- 2. si cammina: un tocco sul pavimento porta l'eroe lì ---------- */
{
  const meta = await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, buona = c.buona()
    const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    const visti = new Map([[da.x + ',' + da.y, 0]]), coda = [da]
    let mig = null
    for (let i = 0; i < coda.length; i++) {
      const q = coda[i], d = visti.get(q.x + ',' + q.y)
      if (d >= 2 && d <= 4 && c.livello.robeSu(q.x, q.y).length === 0 && (!mig || d > mig.d)) mig = { ...q, d }
      if (d >= 4) continue
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = q.x + dx, y = q.y + dy
        if (buona(x, y) && !visti.has(x + ',' + y)) { visti.set(x + ',' + y, d + 1); coda.push({ x, y }) }
      }
    }
    return mig
  })
  controlla('c\'è una cella a qualche passo', !!meta)
  await toccaLaCella(meta.x, meta.y)
  await attendi(page, 300)
  await fermo()
  uguale('l\'eroe è arrivato dove si è toccato', (await cellaOra()).join(), `${meta.x},${meta.y}`)
}

/* ---------- 3. una porta: si tocca, l'eroe ci va, si risponde e si apre ---------- */
{
  // la porta chiusa più vicina per strada; si cammina finché sta nel campo, poi la si tocca
  const porta = () => page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, liv = c.livello
    const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
    const passa = (x, y) => liv.calpestabile(x, y)
    const prima = new Map([[da.x + ',' + da.y, null]]), coda = [da]
    for (let i = 0; i < coda.length; i++) {
      const q = coda[i]
      const p = liv.robe.find(r => r.che === 'porta' && !r.aperta && r.x === q.x && r.y === q.y)
      if (p) { const via = []; for (let k = q.x + ',' + q.y; k; k = prima.get(k)) via.unshift(k.split(',').map(Number)); return { x: p.x, y: p.y, via } }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = q.x + dx, y = q.y + dy
        if (passa(x, y) && !prima.has(x + ',' + y)) { prima.set(x + ',' + y, q.x + ',' + q.y); coda.push({ x, y }) }
      }
    }
    return null
  })
  let p = await porta()
  controlla('nella prima discesa c\'è una porta chiusa', !!p)
  for (let giro = 0; giro < 12 && p; giro++) {
    if (await dentroIlCampo(await schermoDi(p.x + 0.5, p.y + 0.5))) break
    // un passo lungo la strada, il più lontano che sta nel campo (prima della porta)
    let passo = null
    for (const [x, y] of p.via.slice(0, -1)) if (await dentroIlCampo(await schermoDi(x + 0.5, y + 0.5))) passo = [x, y]
    if (!passo) break
    await toccaLaCella(...passo)
    await attendi(page, 300); await fermo()
    p = await porta()
  }
  await scatto(page, 'sotterraneo-3d-verso-la-porta')
  await toccaLaCella(p.x, p.y, 0.6)
  await page.waitForSelector('.sot-foglio .sot-domanda .qz-tasto', { timeout: 15000 })
  controlla('toccata la porta, l\'eroe ci è andato e la porta chiede', (await page.locator('.sot-foglio h2').innerText()).includes('porta'))
  await scatto(page, 'sotterraneo-3d-porta')
  await attendi(page, 400)
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
  await page.waitForFunction(([x, y]) => window.__sotterraneo3d.corsa.livello.robe.some(r => r.che === 'porta' && r.x === x && r.y === y && r.aperta), [p.x, p.y], { timeout: 8000 })
  controlla('rispondendo giusto la porta si apre', true)
}

/* ---------- 4. lo scontro: il motore vero, la scena che lo mette in scena ---------- */
const roba = { v: 1, gemme: 0, zaino: ['pozione'], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
const crescita = { v: 2, esp: sogliaDi(10), forza: 2, destrezza: 0, intelligenza: 0, tempra: 6, albero: {}, caselle: [null, null, null] }
async function entra(hash, avventura = {}) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const a = { tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba, crescita, terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true }, ...avventura }
  await semina(page, { coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: a.tappa, libera: false, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: a } } } } })
  await page.evaluate(h => { location.hash = h }, hash)
}
await entra('sotterraneo3d=1&seme=11&sotterraneo=branco&mostri=2&tipo=ratto,goblin&stanza=sala')
await page.waitForSelector('[data-scontro-3d]', { timeout: 15000 })
await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
await attendi(page, 600)
{
  const g = await g3d()
  uguale('lo scontro sta nella scena (il palco 3D)', g.palco, true)
  uguale('niente palco 2D', await page.locator('.sot-duello').count(), 0)
  uguale('le scritte sopra i due mostri', await page.locator('[data-scontro-3d] [data-mostro]').count(), 2)
  uguale('la fila dei turni c\'è', await page.locator('[data-scontro-3d] [data-fila]').count(), 1)
  dentro('lo scontro costa poco', g.chiamate, 10, 140)
  nota(`nello scontro: ${g.chiamate} chiamate, ${Math.round(g.triangoli / 1000)}k triangoli, ${g.ms} ms`)
  // i combattenti lontani dai muri: l'agio del palco (docs/sotterraneo/grafica-3d.md)
  const agio = await page.evaluate(() => window.__sotterraneo3d.palco.agio)
  nota(`agio del palco: ${agio.map(a => a.toFixed(1)).join(' ')}`)
  controlla('l\'eroe ha almeno una cella d\'agio dai muri', agio[0] >= 1, agio.join())
  // toccare il secondo mostro lo fa bersaglio (dopo i 320 ms ciechi)
  const s = await page.evaluate(() => { const p = window.__sotterraneo3d.palco, s = p.stati[1]; return { x: s.x, z: s.z, alto: s.alto } })
  const pt = await schermoDi(s.x, s.z, s.alto * 0.5)
  await tocca(pt.x, pt.y)
  await attendi(page, 300)
  uguale('toccato nella scena, il secondo è il bersaglio', await page.locator('[data-scontro-3d] [data-mostro][data-bersaglio]').getAttribute('data-i'), '1')
  await scatto(page, 'sotterraneo-3d-scontro')
}
async function rispondi(giusto) {
  await scegliAttacco(page)
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  await attendi(page, 400)
  await page.locator(giusto ? '.sot-domanda .qz-tasto[data-giusta]' : '.sot-domanda .qz-tasto:not([data-giusta])').first().click()
}
const ossa = () => page.evaluate(() => window.__sotterraneo3d.corsa.foglio ? window.__sotterraneo3d.corsa.foglio.campo.map(m => m.ossa) : [])
{
  const prima = await ossa()
  await rispondi(false)
  await page.waitForSelector('[data-scontro-3d][data-racconto]', { timeout: 8000 }).catch(() => {})
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
  uguale('una risposta sbagliata non colpisce', (await ossa()).join(), prima.join())
  // fino a quattro risposte giuste: il ratto cade (la sua figura svanisce nella scena)
  let morti = 0
  for (let n = 0; n < 6 && morti === 0; n++) {
    await rispondi(true)
    await page.waitForSelector('[data-scontro-3d][data-racconto]', { timeout: 8000 }).catch(() => {})
    await attendi(page, 500)
    await scatto(page, 'sotterraneo-3d-colpo')
    await page.waitForFunction(() => !document.querySelector('[data-scontro-3d][data-racconto]'), null, { timeout: 20000 })
    morti = await page.evaluate(() => window.__sotterraneo3d.corsa.livello.robe.filter(r => r.che === 'mostro' && r.morto).length)
    if (!morti) await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 }).catch(() => {})
  }
  controlla('rispondendo giusto un mostro cade', morti >= 1, morti)
  controlla('e la sua figura nella scena svanisce', await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, m = c.livello.robe.find(r => r.che === 'mostro' && r.morto)
    return window.__sotterraneo3d.statoDi(m).morente > 0
  }))
}

/* ---------- 5. la scala che sale e quella che scende, da una sosta scritta in Node ---------- */
{
  const TORRE = CAMPAGNA.findIndex(t => t.chiave === 'torre')
  const r = robaAttesa('cavaliere', TORRE, { gemme: 5 })
  const c = new Corsa(CAMPAGNA[TORRE], { seme: 11, eroe: 'cavaliere', roba: r })
  c.chiaveDelPiano = true
  c.interagisci(c.livello.robe.find(q => q.che === 'scala')); c.scendi()
  const sosta = scrivi(c, TORRE)
  const su = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
  await entra('', { tappa: TORRE, roba: r, sosta })
  await scegli(page, 'sotterraneo3d')
  await page.waitForSelector('[data-pausa]', { timeout: 10000 })   // si rientra già giù, dietro il velo della pausa
  await attendi(page, 500)
  await page.locator('[data-pausa] [data-azione="riprendi"]').click()
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 15000 })
  controlla('la sosta scritta per il 2D si riprende nel 3D: secondo piano', (await piede()).includes('piano 2 di 3'))
  uguale('sulla scala che sale', (await cellaOra()).join(), `${su.x},${su.y}`)
  await toccaLaCella(su.x, su.y, 0.4)
  await page.waitForSelector('[data-azione="sali"]', { timeout: 5000 })
  await page.locator('[data-azione="sali"]').click()
  await attendi(page, 800)
  controlla('salendo si è al primo piano', (await piede()).includes('piano 1 di 3'))
  controlla('e la scena è quella del piano nuovo', (await g3d()).figure > 0)
  await scatto(page, 'sotterraneo-3d-risalito')
  const giu = await page.evaluate(() => { const r = window.__sotterraneo3d.corsa.livello.robe.find(q => q.che === 'scala'); return { x: r.x, y: r.y } })
  await toccaLaCella(giu.x, giu.y, 0.4)
  await page.waitForSelector('[data-azione="scendi"]', { timeout: 8000 })
  await page.locator('[data-azione="scendi"]').click()
  await attendi(page, 800)
  controlla('riscendendo si torna al secondo', (await piede()).includes('piano 2 di 3'))
  // la ✕ salva la sosta: il Sotterraneo di sempre la riprende uguale (la sosta è una sola)
  await page.locator('button[aria-label="indietro"]').first().click()
  await page.waitForSelector('.carte', { timeout: 8000 })
  await attendi(page, 600)
  const p = await leggiProfilo(page)
  uguale('la sosta è nella stessa avventura del Sotterraneo', p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta?.piano, 1)
  uguale('e nessun salvataggio a parte per il 3D', p?.campagne?.sotterraneo3d, undefined)
}

/* ---------- 6. senza WebGL 2 si dice e si esce, senza toccare niente ---------- */
{
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await page.evaluate(() => { location.hash = 'sotterraneo3d&tela=niente' })
  await page.waitForSelector('[data-senza-3d]', { timeout: 8000 })
  const prima = JSON.stringify((await leggiProfilo(page))?.campagne || {})
  await page.locator('[data-senza-3d] [data-azione="esci-3d"]').click()
  await page.waitForSelector('.carte', { timeout: 8000 })
  uguale('senza WebGL il profilo resta com\'era', JSON.stringify((await leggiProfilo(page))?.campagne || {}), prima)
}

/* ---------- 7. i paesaggi solo del 3D: il cheat `#scenario=` veste la discesa (docs/sotterraneo/paesaggi-3d.md) ---------- */
for (const [k, pianta] of [['ghiaccio', 'caverna'], ['tempio', 'costruita']]) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await page.evaluate(h => { location.hash = h }, `sotterraneo3d=1&eroe=cavaliere&seme=11&stanza=grande&luce=stanza&scenario=${k}`)
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 15000 })
  await attendi(page, 800)
  const g = await g3d()
  uguale(`${k}: la scena è nel paesaggio chiesto`, g.scenario, k)
  uguale(`${k}: la famiglia di piante è la sua`, await page.evaluate(() => window.__sotterraneo3d.corsa.livello.pianta), pianta)
  controlla(`${k}: costa poco (chiamate)`, g.chiamate > 10 && g.chiamate < 70, g.chiamate)
  await scatto(page, `sotterraneo-3d-${k}`)
  await page.locator('button[aria-label="indietro"]').first().click()
  await page.waitForSelector('.carte', { timeout: 8000 })
}

/* ---------- 8. la scena sta nella colonna del gioco, a ogni larghezza, e il dito prende la cosa giusta ----------
   La tela si misura sul suo contenitore (il campo), mai sulla finestra: prima, a pixel ratio 1,5, era larga una volta e
   mezza il campo (la scena ingrandita e tagliata, a destra fuori dalla colonna sugli schermi larghi, e il dito fuori posto) */
for (const [w, h] of [[1100, 900], [1861, 1900], [390, 844]]) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await page.setViewportSize({ width: w, height: h })
  await page.evaluate(() => { location.hash = 'sotterraneo3d=0&eroe=cavaliere&seme=11' })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 15000 })
  await attendi(page, 1200)
  const misure = () => page.evaluate(() => {
    const c = document.querySelector('[data-tela="3d"]'), r = c.getBoundingClientRect(), p = c.parentElement.getBoundingClientRect()
    const b = document.querySelector('[data-barra-giu]').getBoundingClientRect()
    return { x: r.x, w: r.width, h: r.height, px: p.x, pw: p.width, ph: p.height, bx: b.x, bw: b.width }
  })
  let m = await misure()
  controlla(`${w}×${h}: la tela è il campo (x e larghezza)`, Math.abs(m.x - m.px) <= 1 && Math.abs(m.w - m.pw) <= 1 && Math.abs(m.h - m.ph) <= 1, JSON.stringify(m))
  controlla(`${w}×${h}: nella stessa colonna della barra`, Math.abs(m.x - m.bx) <= 1 && Math.abs(m.w - m.bw) <= 1, JSON.stringify(m))
  // la scala che sale: il tocco sulla sua figura apre il suo foglio (dal primo piano è «lascio perdere»)
  const su = await page.evaluate(() => { const r = window.__sotterraneo3d.corsa.livello.robe.find(q => q.che === 'scala-su'); return r && { x: r.x, y: r.y } })
  controlla(`${w}×${h}: c'è la scala che sale`, !!su)
  const pt = await schermoDi(su.x + 0.5, su.y + 0.5, 0.5)
  await tocca(pt.x, pt.y)
  await page.waitForSelector('[data-lascio-perdere], [data-azione="sali"]', { timeout: 8000 })
  controlla(`${w}×${h}: il tocco sulla scala prende la scala`, true)
  await page.locator('[data-azione="scorda-no"], [data-azione="dopo"]').first().click()
  await attendi(page, 300)
  // la finestra cambia (un telefono girato, una finestra stretta): la tela la segue
  await page.setViewportSize({ width: Math.round(w * 0.8), height: h })
  await attendi(page, 800)
  m = await misure()
  controlla(`${w}×${h} stretta: la tela segue il campo`, Math.abs(m.x - m.px) <= 1 && Math.abs(m.w - m.pw) <= 1, JSON.stringify(m))
  await scatto(page, `sotterraneo-3d-largo-${w}`)
  await page.locator('button[aria-label="indietro"]').first().click()
  await page.waitForSelector('.carte', { timeout: 8000 })
}

/* ---------- 9. lo scontro da vicino: tutti in vista e il pixel dello sprite netto ----------
   Il pixel dello sprite sta su un numero intero di pixel del disegno (la distanza della telecamera si arrotonda), mai più di
   CAMERA.pixelMassimo: più vicino erano macchie. Tutti i combattenti stanno nella tela, sopra il pannello */
for (const [w, h, n] of [[390, 844, 3], [360, 640, 6]]) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await page.setViewportSize({ width: w, height: h })
  await page.evaluate(q => { location.hash = q }, `sotterraneo3d=2&eroe=elfa&seme=7&stanza=sala&sotterraneo=branco&mostri=${n}&tipo=spirito-fuoco&dpr=1.5`)
  await page.waitForSelector('[data-scontro-3d]', { timeout: 15000 })
  await attendi(page, 4000)   // i combattenti vanno ai loro posti e la telecamera ci arriva morbida
  const g = await g3d()
  dentro(`${w}×${h}: un pixel dello sprite è un numero intero di pixel`, Math.abs(g.pixelSprite - Math.round(g.pixelSprite)), 0, 0.2)
  dentro(`${w}×${h}: e non più di cinque`, g.pixelSprite, 1, 5.2)
  const fuori = await page.evaluate(() => {
    const c = document.querySelector('[data-tela="3d"]').getBoundingClientRect(), p = document.querySelector('[data-pannello3d]').getBoundingClientRect()
    return [...document.querySelectorAll('[data-scontro-3d] [data-mostro], [data-eroe-scontro]')].map(e => e.getBoundingClientRect())
      .filter(r => r.x + r.width / 2 < c.x || r.x + r.width / 2 > c.right || r.bottom < c.y || r.bottom > p.top).length
  })
  uguale(`${w}×${h}: con ${n} mostri tutti in vista sopra il pannello`, fuori, 0)
  nota(`${w}×${h}, ${n} mostri: un pixel dello sprite = ${g.pixelSprite} pixel, ${g.chiamate} chiamate`)
  await scatto(page, `sotterraneo-3d-vicino-${w}`)
  await page.locator('button[aria-label="indietro"]').first().click()
  await page.waitForSelector('.carte', { timeout: 8000 })
}

/* ---------- 10. le botti da rompere col dito (motore/botti.js): si rompe, resta rotta, e una su cinque lascia qualcosa di vero ---------- */
{
  // l'eroe nella stanza della botte `i`, a qualche passo (la stanza accesa tutta, come `#luce=stanza`), coi mostri spenti: qui si prova
  // la botte, non lo scontro. Poi il dito vero: si tocca la botte, l'eroe ci cammina da sé e la rompe
  const nellaStanza = i => page.evaluate(k => {
    const p = window.__sotterraneo3d, c = p.corsa, b = c.bottiQui()[k], liv = c.livello
    // non si tolgono dalla lista (la sosta conta le cose per indice): si spengono
    c.ricomparsa = false
    for (const m of liv.robe) if (m.che === 'mostro') { m.presa = true; m.morto = true; m.sveglio = false }
    const s = liv.stanze.find(q => q.id === b.stanza)
    const libere = s.suolo.filter(q => !liv.robeSu(q.x, q.y).length && !c.bottiQui().some(o => o.x === q.x && o.y === q.y))
    const d = libere.map(q => ({ ...q, d: Math.abs(Math.hypot(q.x - b.x, q.y - b.y) - 3) + (q.y < b.y ? 1 : 0) })).sort((u, v) => u.d - v.d)[0]
    c.eroe = { x: d.x + 0.5, y: d.y + 0.5 }; c.strada = []
    const base = c.aggiornaLuce.bind(c)
    c.aggiornaLuce = () => { base(); for (const [x, y] of liv.celleDellaLuce(s)) { const q = y * liv.largo + x; c.luce.add(q); c.forzaLuce.set(q, 1); c.visto[q] = 1 } }
    c.segnaLaStanza(); c.aggiornaLuce()
    return Math.hypot(d.x - b.x, d.y - b.y)
  }, i)
  const rompiCol = async i => {
    const lontana = await nellaStanza(i)
    await fermo()
    const b = (await page.evaluate(() => window.__sotterraneo3d.botti())).find(q => q.i === i)
    const box = await tela.boundingBox()
    const [sx, sy] = await page.evaluate(([x, z]) => window.__sotterraneo3d.aSchermo(x, 0.3, z), [b.x, b.z])
    // un po' fuori dal centro: il bersaglio è generoso come per le altre cose (MARGINE_DITO)
    await tocca(box.x + sx + 8, box.y + sy - 6)
    await page.waitForFunction(k => window.__sotterraneo3d.botti().find(q => q.i === k).rotta, i, { timeout: 20000 })
    return lontana
  }
  let fatto = false
  for (let seme = 11; seme < 40 && !fatto; seme++) {
    await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
    await page.evaluate(h => { location.hash = h }, `sotterraneo3d=1&eroe=cavaliere&seme=${seme}&scenario=cantine`)
    await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0 && window.__sotterraneo3d.corsa, null, { timeout: 15000 })
    const info = await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; return { seme: c.seme, piano: c.piano, n: c.bottiQui().length } })
    const conPremio = [...Array(info.n).keys()].filter(i => premioDellaBotte(info.seme, info.piano, i))
    const senza = [...Array(info.n).keys()].filter(i => !premioDellaBotte(info.seme, info.piano, i))
    if (!conPremio.length || !senza.length) { await page.locator('button[aria-label="indietro"]').first().click(); await page.waitForSelector('.carte', { timeout: 8000 }); continue }
    fatto = true
    nota(`seme ${info.seme}: ${info.n} botti, con un premio la ${conPremio[0]}`)
    // una botte senza premio: si rompe e basta
    const prima = await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; return { gemme: c.gemme, robe: c.livello.robe.filter(q => (q.che === 'gemme' || q.che === 'cosa') && !q.presa).length } })
    await scatto(page, 'sotterraneo-3d-botte-0')
    const passi = await rompiCol(senza[0])
    controlla('toccata da lontano, l\'eroe ci va e la rompe', passi >= 2, passi)
    await scatto(page, 'sotterraneo-3d-botte-1'); await attendi(page, 250); await scatto(page, 'sotterraneo-3d-botte-2'); await attendi(page, 1200); await scatto(page, 'sotterraneo-3d-botte-3')
    const dopo = await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; return { gemme: c.gemme, robe: c.livello.robe.filter(q => (q.che === 'gemme' || q.che === 'cosa') && !q.presa).length } })
    uguale('la botte vuota non lascia niente', JSON.stringify(dopo), JSON.stringify(prima))
    controlla('e resta a terra a pezzi', (await page.evaluate(k => window.__sotterraneo3d.botti().find(q => q.i === k).pezzi, senza[0])) > 0)
    // quella col premio: per terra c'è qualcosa, e raccolto arriva davvero
    await rompiCol(conPremio[0])
    const preso = await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; const r = c.livello.robe.filter(q => (q.che === 'gemme' || q.che === 'cosa') && !q.presa).pop(); return r && { che: r.che, x: r.x, y: r.y, cosa: r.cosa || null } })
    controlla('la botte col premio lascia qualcosa per terra', !!preso)
    if (preso) {
      const contaPrima = await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; return { gemme: c.gemme, zaino: JSON.stringify(c.zaino || []) + JSON.stringify(c.pozioni ?? '') } })
      await fermo()
      // col dito: si tocca quello che è caduto, l'eroe ci va e lo prende (le gemme camminandoci sopra, la boccetta raccolta)
      await toccaLaCella(preso.x, preso.y, 0.1)
      await page.waitForFunction(([x, y]) => window.__sotterraneo3d.corsa.livello.robe.filter(q => q.x === x && q.y === y && (q.che === 'gemme' || q.che === 'cosa')).every(q => q.presa), [preso.x, preso.y], { timeout: 15000 }).catch(() => {})
      const contaDopo = await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; return { gemme: c.gemme, zaino: JSON.stringify(c.zaino || []) + JSON.stringify(c.pozioni ?? '') } })
      if (preso.che === 'gemme') controlla('le gemme della botte arrivano davvero', contaDopo.gemme > contaPrima.gemme, `${contaPrima.gemme} → ${contaDopo.gemme}`)
      else controlla('la pozione della botte arriva davvero', contaDopo.zaino !== contaPrima.zaino)
      await scatto(page, 'sotterraneo-3d-botte-premio')
      await attendi(page, 500)
    }
    await page.locator('button[aria-label="indietro"]').first().click()
    await page.waitForSelector('.carte', { timeout: 8000 })
  }
  controlla('un seme con le botti, una col premio e una senza', fatto)
}

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('sotterraneo 3d')
