/* ═══════════════════════════════════════════════════════════════════
   IL SOTTERRANEO IN 3D, COL DITO — docs/sotterraneo/grafica-3d.md

   La carta del sotterraneo c'è per tutti, una sola, anche coi giochi in
   prova spenti. Qui si entra dalla carta, si sceglie l'eroe e si scende dal mondo
   di sopra in 3D (integrazione/sotterraneo-mondo); giù la scena è WebGL (in Chrome
   senza schermo la disegna SwiftShader, lento ma vero) e il motore è lo
   stesso: si cammina, si apre una porta rispondendo, si combatte (una
   risposta sbagliata, una giusta, il mostro che cade), si sale e si scende
   una scala da una sosta scritta in Node. E senza WebGL lo si dice e si esce.
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

/* ---------- 1. una carta sola per tutti, e si scende dal mondo di sopra ---------- */
await azzera(page)
uguale('coi giochi in prova spenti la carta c\'è', await page.locator('[data-indice="sotterraneo"]').count(), 1)
uguale('e non c\'è un secondo sotterraneo', await page.locator('[data-indice="sotterraneo3d"]').count(), 0)
await scegli(page, 'sotterraneo')
await scegliAvventura(page, 'cavaliere')
controlla('sopra c\'è il mondo in 3D', await page.locator('[data-mondo3d]').count() === 1)
// un seme con una porta chiusa a pochi passi dall'arrivo (lo legge chi scende, come `#seme=` dei cheat)
await page.evaluate(() => { location.hash = 'sotterraneo&seme=11' })
await scendiNelSotterraneo(page, 0, { tocca, scendi: false })
// col fumetto dell'ingresso aperto la discesa si scalda (docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»): una tela
// fuori dalla pagina compila il primo piano un programma per fotogramma; scendendo è lei che entra, e l'entrata non ne chiede quasi
await page.waitForFunction(() => window.__sotterraneo3dCaldo && window.__sotterraneo3dCaldo.anticipato.daScaldare === 0, null, { timeout: 60000 }).catch(() => {})
const caldo = await page.evaluate(() => window.__sotterraneo3dCaldo ? window.__sotterraneo3dCaldo.anticipato : null)
controlla('col fumetto aperto la discesa si scalda prima di scendere', !!caldo && caldo.programmi >= 15 && caldo.daScaldare === 0, JSON.stringify(caldo))
await page.click(`[data-fumetto-di="${CAMPAGNA[0].chiave}"] [data-azione="scendi"]`)
await page.waitForSelector('[data-tela="3d"]', { timeout: 10000 })
await page.waitForFunction(() => window.__sotterraneo3d && !window.__sotterraneo3d.grafica().mondo && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 15000 })
{
  const g = await g3d(), ing = await page.evaluate(() => window.__sotterraneo3d.ingresso())
  controlla('scendendo, la tela scaldata è quella della discesa', await page.evaluate(() => window.__sotterraneo3dCaldo === undefined && window.__sotterraneo3d.canvas.isConnected &&
    window.__sotterraneo3d.canvas.nextElementSibling === document.querySelector('[data-tela="3d"]')))
  // restano quelli dell'ombra (quattro, al primo disegno: `compile` non li fa; la fascia bassa non ha ombre) e qualcosa nato disegnando
  controlla('e il primo piano non chiede quasi programmi nuovi', !!caldo && g.programmi - caldo.programmi <= 6, `${caldo && caldo.programmi} → ${g.programmi}`)
  nota(`discesa scaldata: ${caldo && caldo.programmi} programmi prima di scendere, ${g.programmi} giù; fotogrammi prima del disegno ${ing && ing.attesa}, ms ${ing && ing.ms.slice(0, 8).join(',')}, js ${ing && ing.js.slice(0, 8).join(',')}`)
}
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
  await semina(page, { coins: 300,
    campagne: { sotterraneo: { tappa: a.tappa, libera: false, stelle: { 0: 3 }, cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: a } } } } })
  await page.evaluate(h => { location.hash = h }, hash)
}
await entra('sotterraneo=1&seme=11&sotterraneo=branco&mostri=2&tipo=ratto,goblin&stanza=sala')
await page.waitForSelector('[data-scontro-3d]', { timeout: 15000 })
await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
// entrando gli shader nascono uno per fotogramma e non si disegna (docs/sotterraneo/prestazioni-3d.md): si aspetta il primo disegno
await page.waitForFunction(() => { const g = window.__sotterraneo3d && window.__sotterraneo3d.grafica(); return g && !g.entrando && g.chiamate > 0 }, null, { timeout: 20000 })
await attendi(page, 600)
{
  const g = await g3d()
  uguale('lo scontro sta nella scena (il palco 3D)', g.palco, true)
  uguale('niente palco 2D', await page.locator('.sot-duello').count(), 0)
  uguale('le scritte sopra i due mostri', await page.locator('[data-scontro-3d] [data-mostro]').count(), 2)
  uguale('la fila dei turni c\'è', await page.locator('[data-scontro-3d] [data-fila]').count(), 1)
  // coi mostri 3D (docs/sotterraneo/mostri-3d.md, «Quanto costa») ogni modello aggiunge una cinquantina di chiamate: con gli sprite stava sotto 140
  dentro('lo scontro costa poco', g.chiamate, 10, 260)
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
  // gli shader compilati dopo ogni colpo: un colpo non ne compila di nuovi (sull'Adreno è un fermo di 50-300 ms). Si contano i `linkProgram`,
  // non i programmi vivi: un effetto che butta i suoi materiali fa liberare e ricompilare lo stesso programma, e il conto dei vivi non cambia
  await page.evaluate(() => { const P = WebGL2RenderingContext.prototype, o = P.linkProgram; window.__compilati = 0; P.linkProgram = function (x) { window.__compilati++; return o.call(this, x) } })
  const programmi = []
  for (let n = 0; n < 6 && morti === 0; n++) {
    await rispondi(true)
    await page.waitForSelector('[data-scontro-3d][data-racconto]', { timeout: 8000 }).catch(() => {})
    await attendi(page, 500)
    await scatto(page, 'sotterraneo-3d-colpo')
    await page.waitForFunction(() => !document.querySelector('[data-scontro-3d][data-racconto]'), null, { timeout: 20000 })
    programmi.push(await page.evaluate(() => window.__compilati))
    morti = await page.evaluate(() => window.__sotterraneo3d.corsa.livello.robe.filter(r => r.che === 'mostro' && r.morto).length)
    if (!morti) await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 }).catch(() => {})
  }
  controlla('rispondendo giusto un mostro cade', morti >= 1, morti)
  controlla('dopo il primo colpo nessuno shader nuovo', programmi.length < 2 || programmi.slice(1).every(x => x === programmi[0]), programmi.join())
  controlla('e la sua figura nella scena svanisce', await page.evaluate(() => {
    const c = window.__sotterraneo3d.corsa, m = c.livello.robe.find(r => r.che === 'mostro' && r.morto)
    return window.__sotterraneo3d.statoDi(m).morente > 0
  }))
}

/* ---------- 4b. lo stesso scontro nella fascia bassa (docs/sotterraneo/grafica-3d-costi.md): meno luci, il colpo va uguale ---------- */
await entra('sotterraneo=1&seme=11&sotterraneo=branco&mostri=2&tipo=ratto,goblin&stanza=sala&qualita=bassa')
await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
await attendi(page, 600)
{
  const prima = await g3d()
  uguale('bassa: lo scontro sta nella scena', prima.palco, true)
  await rispondi(true)
  await page.waitForSelector('[data-scontro-3d][data-racconto]', { timeout: 8000 }).catch(() => {})
  await attendi(page, 400)
  await page.waitForFunction(() => !document.querySelector('[data-scontro-3d][data-racconto]'), null, { timeout: 20000 })
  const dopo = await g3d()
  controlla('bassa: il pixel ratio non passa 1', dopo.dpr <= 1, dopo.dpr)
  nota(`fascia bassa nello scontro: ${dopo.chiamate} chiamate, ${dopo.programmi} shader, ${dopo.ms} ms`)
}

/* ---------- 4c. tre attacchi contro gli scheletri armati: dopo il primo giro nessuno shader si ricompila (gli effetti tengono i programmi,
   docs/sotterraneo/limiti-3d.md: buttarli faceva ricompilare a ogni colpo, sul telefono 50-300 ms l'uno) ---------- */
// `spegni=parallelo`: come il Redmi Note 7, senza KHR_parallel_shader_compile (l'entrata a passi)
await entra('sotterraneo=1&seme=11&sotterraneo=branco&mostri=3&tipo=scheletro&variante=guerriero,arciere,mago&grado=leggendario&stanza=sala&qualita=bassa&spegni=parallelo')
await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
// il riscaldamento (docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»): finito, il primo attacco trova gli shader pronti
await page.waitForFunction(() => window.__sotterraneo3d.grafica().daScaldare === 0, null, { timeout: 30000 })
{
  // l'entrata e il riscaldamento un programma per fotogramma: prima il primo disegno ne chiedeva 26 insieme (secondi fermi sul telefono)
  const ing = await page.evaluate(() => window.__sotterraneo3d.ingresso())
  controlla('entrando, al più due programmi nuovi per fotogramma', ing.picco <= 2, `picco ${ing.picco}, ${ing.fotogrammi.join('')} (${ing.troppi.join('; ')})`)
  controlla('il primo disegno arriva coi programmi già chiesti', ing.primoDisegno <= 2 && ing.attesa >= 10, `primo disegno +${ing.primoDisegno}, dopo ${ing.attesa} fotogrammi`)
  nota(`entrata a passi: ${ing.attesa} fotogrammi prima del disegno, picco ${ing.picco} programmi per fotogramma, ${(await g3d()).programmi} in tutto`)
}
await page.evaluate(() => { const P = WebGL2RenderingContext.prototype, o = P.linkProgram; window.__compilati = 0; P.linkProgram = function (x) { window.__compilati++; return o.call(this, x) } })
{
  const compilati = []
  for (let n = 0; n < 3; n++) {
    await page.evaluate(() => { const c = window.__sotterraneo3d.corsa; if (c && c.vitaMax) c.vita = c.vitaMax })
    await rispondi(true)
    await page.waitForSelector('[data-scontro-3d][data-racconto]', { timeout: 8000 }).catch(() => {})
    await page.waitForFunction(() => !document.querySelector('[data-scontro-3d][data-racconto]'), null, { timeout: 20000 })
    await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 }).catch(() => {})
    compilati.push(await page.evaluate(() => window.__compilati))
  }
  // un effetto visto la prima volta si compila (una mossa nuova di un mostro): al più qualcuno; buttando i programmi erano 15-19 a giro
  controlla('scheletri armati: dopo il primo attacco quasi nessuno shader compilato', compilati[1] - compilati[0] <= 6 && compilati[2] - compilati[1] <= 6, compilati.join())
  controlla('scaldati gli shader, il primo attacco non ne compila quasi (senza riscaldamento erano una decina)', compilati[0] <= 2, compilati.join())
  nota(`scheletri armati, shader compilati dopo il riscaldamento, attacco per attacco: ${compilati.join(', ')}`)
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
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-pausa]', { timeout: 10000 })   // si rientra già giù, dietro il velo della pausa
  await attendi(page, 500)
  await page.locator('[data-pausa] [data-azione="riprendi"]').click()
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 15000 })
  controlla('la sosta scritta in Node si riprende: secondo piano', (await piede()).includes('piano 2 di 3'))
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
  // la ✕ salva la sosta, nell'avventura del sotterraneo
  await page.locator('button[aria-label="indietro"]').first().click()
  await page.waitForSelector('.carte', { timeout: 8000 })
  await attendi(page, 600)
  const p = await leggiProfilo(page)
  uguale('la sosta è nell\'avventura', p?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere?.sosta?.piano, 1)
}

/* ---------- 6. senza WebGL 2 si dice e si esce, senza toccare niente ---------- */
{
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await page.evaluate(() => { location.hash = 'sotterraneo&tela=niente' })
  await page.waitForSelector('[data-senza-3d]', { timeout: 8000 })
  const prima = JSON.stringify((await leggiProfilo(page))?.campagne || {})
  await page.locator('[data-senza-3d] [data-azione="esci-3d"]').click()
  await page.waitForSelector('.carte', { timeout: 8000 })
  uguale('senza WebGL il profilo resta com\'era', JSON.stringify((await leggiProfilo(page))?.campagne || {}), prima)
}

/* ---------- 7. i paesaggi solo del 3D: il cheat `#scenario=` veste la discesa (docs/sotterraneo/paesaggi-3d.md) ---------- */
for (const [k, pianta] of [['ghiaccio', 'caverna'], ['tempio', 'costruita']]) {
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await page.evaluate(h => { location.hash = h }, `sotterraneo=1&eroe=cavaliere&seme=11&stanza=grande&luce=stanza&scenario=${k}&spegni=mostri3d,eroe`)   // il paesaggio da solo: l'eroe e i mostri 3D (in prova) si misurano a parte
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
  await page.evaluate(() => { location.hash = 'sotterraneo=0&eroe=cavaliere&seme=11' })
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
  await page.evaluate(q => { location.hash = q }, `sotterraneo=2&eroe=elfa&seme=7&stanza=sala&sotterraneo=branco&mostri=${n}&tipo=spirito-fuoco&dpr=1.5`)
  await page.waitForSelector('[data-scontro-3d]', { timeout: 15000 })
  await attendi(page, 6500)   // i combattenti vanno ai loro posti e la telecamera ci arriva morbida (SwiftShader: pochi fotogrammi)
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

/* ── la torcia (docs/sotterraneo/luce.md, «La torcia nel 3D»): accesa, in mano con la fiamma e le spalle in luce; spenta, niente ── */
for (const t of ['accesa', 'spenta']) {
  await entra(`sotterraneo=1&seme=11&stanza=sala&torcia=${t}`)
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.grafica().figure > 0, null, { timeout: 30000 })
  await attendi(page, 1500)
  const r = await page.evaluate(() => {
    const s3 = window.__sotterraneo3d, c = s3.corsa, v = c.versoEroe
    const x = Math.floor(c.eroe.x - v.dx * 2), y = Math.floor(c.eroe.y - v.dy * 2)
    return { accesa: c.torciaAccesa, mano: !!s3.eroe.mano, dietro: c.luceDi(x, y) === 2 }
  })
  uguale(`torcia ${t}: il motore`, r.accesa, t === 'accesa')
  uguale(`torcia ${t}: la torcia in mano`, r.mano, t === 'accesa')
  uguale(`torcia ${t}: due celle alle spalle in luce`, r.dietro, t === 'accesa')
  await scatto(page, `sotterraneo-3d-torcia-${t}`)
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
    await page.evaluate(h => { location.hash = h }, `sotterraneo=1&eroe=cavaliere&seme=${seme}&scenario=cantine`)
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
