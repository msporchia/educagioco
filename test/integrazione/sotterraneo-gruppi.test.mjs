/* ═══════════════════════════════════════════════════════════════════
   LO SCONTRO A GRUPPI, COL DITO
   tempo: 300

   (docs/sotterraneo/scontro.md, «La vista»; docs/sotterraneo/scontro-interfaccia.md)
   Uno scontro con più mostri in scena, aperto dal cheat dell'indirizzo che scende da sé nella discesa 3D
   (`#sotterraneo=1&seme=11&sotterraneo=branco&mostri=6`; `&grosso=grumo`, `&agguato=1`, `&sorpresa=1`: docs/core/comandi.md).
   Le figure le disegna la scena (scena3d/), le scritte sopra di loro sono elementi della pagina agganciati alla testa di ognuno
   (`[data-mostro]`, `viste/Scontro3d.vue`), la scelta sta nel pannello in fondo (`[data-pannello3d]`). Un mostro si tocca nella
   scena, sul suo corpo (`palco.stati` + `aSchermo`), non sulla sua scritta. Si prova:
   - sei mostri a 390 px: tutti dentro il campo, in tre colonne e a altezze diverse, ognuno con la sua barra e il nome solo sul
     bersaglio e su chi ha un grado; un bersaglio solo; la fila dei turni di sette figurine con l'eroe in cima;
   - toccare un mostro lo fa bersaglio (non nei primi 320 ms);
   - un'abilità su tutti (il Grido di guerra) accende tutti col contorno e, rispondendo giusto, colpisce tutti; il racconto è un'azione
     alla volta, i mostri scattano nell'ordine della fila (l'assalto nello stato della scena), la scelta torna solo a racconto finito, e
     un tocco lo accorcia (non se ne misura la fretta: in SwiftShader un fotogramma dura mezzo secondo);
   - il mostro grosso sta in scena più alto degli altri e senza coprirli;
   - l'agguato e la sorpresa dicono la loro riga e la fila li racconta;
   - a 320 px i sei mostri stanno nella scena sopra il pannello;
   - gli effetti delle abilità (docs/sotterraneo/scontro-effetti.md): le melme resistono al fulmine e temono il fuoco (il segno sopra già
     prima di rispondere, il numero piccolo o grande col suo «resiste» / «lo teme!»), la palla di fuoco, la catena di fulmini, la
     prigione di ghiaccio e la spallata sono effetti vivi nella scena (`grafica().effetti3d`, non c'è altro da leggere: sono modelli
     WebGL), e il gelo e lo stordimento si vedono addosso come pastiglia del fermo (`[data-stato="fermo"]`). Foto a metà effetto con `--scatti`.
   Si tocca come un bambino (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-gruppi`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, finestraFerma } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'

const TAPPA = 1
const roba = { v: 1, gemme: 0, zaino: ['pozione-piccola', 'pozione'], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
// un cavaliere di livello 12 col Grido di guerra: abbastanza vita per un giro contro sei mostri
const crescita = { v: 2, esp: sogliaDi(12), forza: 1, destrezza: 0, intelligenza: 4, tempra: 0, albero: { grido: 1 }, caselle: ['grido', null, null] }   // l'intelligenza dà l'energia per il Grido (11)

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  await finestraFerma(page)   // la finestra nuova cresce per 160 ms: misurata prima, il tocco cade a lato
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}

// scende nella cripta con lo scontro già aperto (il cheat `#sotterraneo=<tappa>&sotterraneo=branco&…` lo apre da sé, come in sotterraneo-3d)
async function entra(hash, { eroe = 'cavaliere', r = roba, cr = crescita, disegno = true } = {}) {
  // l'indirizzo della prova di prima (`#sotterraneo=…`) aprirebbe il gioco al ricaricamento: si riparte dalla home
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const avventura = { tappa: TAPPA, libera: false, stelle: { 0: 3 }, missioni: {}, roba: r, crescita: cr,
    terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } }
  await semina(page, {
    coins: 300,
    campagne: { sotterraneo: { tappa: TAPPA, libera: false, stelle: { 0: 3 },
      cfg: { mondo: MONDO, eroe, avventure: { [eroe]: avventura } } } },
  })
  await page.evaluate(h => { location.hash = h }, 'sotterraneo=' + TAPPA + '&seme=11&sotterraneo=branco&' + hash)
  await page.waitForSelector('[data-duello]', { timeout: 30000 })
  // entrando gli shader nascono uno per fotogramma e non si disegna: si aspetta il primo disegno (docs/sotterraneo/prestazioni-3d.md);
  // chi guarda la riga dell'apertura (agguato, sorpresa) non aspetta: il racconto parte subito e dura poco
  if (disegno) await page.waitForFunction(() => { const g = window.__sotterraneo3d && window.__sotterraneo3d.grafica(); return g && !g.entrando && g.chiamate > 0 }, null, { timeout: 30000 })
}
// dove cade sullo schermo il corpo di un mostro (a metà altezza), in px della pagina: il tocco sul palco lo prende dalla scena
const tela = () => page.locator('[data-tela="3d"]')
async function corpoDi(i) {
  const [sx, sy, alto] = await page.evaluate(i => { const S = window.__sotterraneo3d, s = S.palco.stati[i], q = S.aSchermo(s.x, (s.alto || 1) * 0.5, s.z); return [q[0], q[1], s.alto || 1] }, i)
  const b = await tela().boundingBox()
  return { x: b.x + sx, y: b.y + sy, alto }
}
async function toccaIlMostro(i) {
  const p = await corpoDi(i)
  await tocca(p.x, p.y)
}
const finitoIlRacconto = () => page.waitForSelector('[data-duello]:not([data-racconto])', { timeout: 20000 })
const scelta = () => page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
const caselle = sel => page.locator(sel).evaluateAll(es => es.map(e => {
  const r = e.getBoundingClientRect()
  return { i: e.dataset.i, x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right }
}))
const palco = () => page.locator('[data-duello]').boundingBox()
// quante colonne verticali fanno i mostri: i centri ordinati, una colonna nuova ogni salto di 30 px
const colonne = ms => [...ms].map(m => m.x + m.w / 2).sort((a, b) => a - b).reduce((n, x, k, v) => (k && x - v[k - 1] > 30 ? n + 1 : n), 1)
const bersagli = () => page.locator('[data-mostro][data-bersaglio]').evaluateAll(es => es.map(e => e.dataset.i))

/* ---------- 1. sei mostri a 390 px ---------- */
await entra('mostri=6')
await scelta()
{
  const ms = await caselle('[data-mostro]')
  uguale('sei mostri in campo', ms.length, 6)
  const p = await palco()
  controlla('tutti dentro il palco, a destra e in alto e in basso',
            ms.every(m => m.x >= p.x - 1 && m.r <= p.x + p.width + 1 && m.y >= p.y - 1 && m.b <= p.y + p.height + 1),
            JSON.stringify(p))
  uguale('in tre colonne verticali, non in file', colonne(ms), 3)
  controlla('i piedi a altezze diverse, niente file orizzontali', new Set(ms.map(m => Math.round(m.b / 12))).size >= 5, JSON.stringify(ms.map(m => Math.round(m.b))))
  uguale('sotto ognuno la sua barra, senza numeri', await page.locator('[data-mostro] [data-vita]').count(), 6)
  controlla('e nessun numero di vita sul palco', !/\d+ ?\/ ?\d+/.test(await page.locator('[data-duello]').innerText()))
  // niente «ti colpisce N» (l'utente, 12 ottobre: basta la barra della vita); il nome, senza articolo, solo sul bersaglio e su chi ha
  // un grado (l'utente, 13 ottobre: sei nomi affollano il palco)
  uguale('niente «ti colpisce N» sul palco', await page.locator('[data-minaccia]').count(), 0)
  const nomi = await page.locator('[data-mostro] [data-nome-mostro]').evaluateAll(es => es.map(e => e.textContent.trim()))
  const conNome = await page.locator('[data-mostro][data-bersaglio], [data-mostro][data-grado]').count()
  controlla('il nome solo sul bersaglio e su chi ha un grado, senza articolo', nomi.length === conNome && nomi.length >= 1 && nomi.length < 6 && nomi.every(t => t && !/^(Un|Uno|Una|Il|Lo|La) /.test(t)), nomi.join(' | '))
  uguale('il bersaglio ha il suo nome', await page.locator('[data-mostro][data-bersaglio] [data-nome-mostro]').count(), 1)
  uguale('un bersaglio solo', (await bersagli()).length, 1)
  uguale('ed è il primo, chi ha aperto lo scontro', (await bersagli())[0], '0')
  const fila = await page.locator('[data-fila] [data-turno]').evaluateAll(es => es.map(e => e.dataset.chi))
  uguale('la fila mostra sette turni', fila.length, 7)
  uguale('e comincia dall\'eroe', fila[0], 'eroe')
  const col = await page.locator('[data-fila]').boundingBox()
  controlla('in una colonna sul bordo destro del palco, in sovrimpressione', col.x > p.x + p.width * 0.8 && col.y >= p.y && col.width < 60,
            JSON.stringify(col))
  uguale('l\'eroe a sinistra, senza il posto del compagno finché il compagno non c\'è', await page.locator('[data-posto-compagno]').count(), 0)
  controlla('la scelta in basso c\'è: attacco e scappa',
            (await page.locator('[data-caselle-abilita] [data-azione]').evaluateAll(es => es.map(e => e.dataset.azione))).join().includes('attacco'))
  await scatto(page, 'gruppi-sei')
}

/* ---------- 2. toccare un mostro lo fa bersaglio (il tocco cade sul suo corpo nella scena) ---------- */
{
  await toccaIlMostro(3)
  await attendi(page, 200)
  uguale('toccato il quarto è lui il bersaglio', (await bersagli()).join(), '3')
  await toccaIlMostro(5)
  await attendi(page, 200)
  uguale('e poi il sesto', (await bersagli()).join(), '5')
}

/* ---------- 3. un colpo su tutti, raccontato un'azione alla volta ---------- */
{
  await toccaIl('[data-abilita="grido"]')
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  uguale('il Grido di guerra prepara tutti: tutti col contorno', await page.locator('[data-mostro][data-colpito]').count(), 6)
  const prima = await page.locator('[data-mostro] [data-vita]').evaluateAll(es => es.map(e => Number(e.dataset.ossa)))
  const fila = await page.locator('[data-fila] [data-turno]').evaluateAll(es => es.map(e => e.dataset.chi))
  const attesi = []
  for (const c of fila.slice(1)) { if (c === 'eroe') break; attesi.push(c) }
  nota(`fila ${fila.join(' ')}: dopo di lui colpiscono ${attesi.join(', ') || 'nessuno'}`)
  // chi scatta (l'assalto nella scena), nell'ordine in cui compare: un campionatore dentro la pagina, perché un colpo dura poco
  await page.evaluate(() => {
    window.__scatti = []
    window.__scattiGiro = setInterval(() => {
      const p = window.__sotterraneo3d && window.__sotterraneo3d.palco
      if (p) p.stati.forEach((s, k) => { if (s.assalto && !window.__scatti.includes(String(k))) window.__scatti.push(String(k)) })
    }, 20)
  })
  await attendi(page, 500)
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
  await page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })
  uguale('a racconto in corso non c\'è la domanda', await page.locator('.sot-domanda').count(), 0)
  uguale('né la scelta è accesa', await page.locator('[data-caselle-abilita][data-pronto]').count(), 0)
  await attendi(page, 350)
  const numeri = await page.locator('[data-cifra]').evaluateAll(es => es.map(e => e.closest('[data-mostro]') ? e.closest('[data-mostro]').dataset.i : 'eroe'))
  controlla('i numeri salgono sui mostri colpiti', numeri.filter(x => x !== 'eroe').length >= 2, numeri.join())
  await scatto(page, 'gruppi-racconto')
  await finitoIlRacconto()
  const dopo = await page.locator('[data-mostro] [data-vita]').evaluateAll(es => es.map(e => Number(e.dataset.ossa)))
  controlla('il Grido ha colpito tutti: la vita di ognuno è scesa (o è caduto)',
            dopo.every((o, i) => o < prima[i]), `${prima.join()} → ${dopo.join()}`)
  const scattati = await page.evaluate(() => { clearInterval(window.__scattiGiro); return window.__scatti })
  const vivi = await page.locator('[data-mostro]:not([data-morto])').count()
  // chi cade sotto il Grido (i mostri della cripta hanno quattro ossa e il Grido ne toglie 3–5) non colpisce: scattano quelli
  // che sono rimasti in piedi, nell'ordine della fila
  const inPiedi = attesi.filter(x => dopo[Number(x)] > 0)
  controlla('i mostri hanno colpito uno alla volta', scattati.length >= Math.min(2, inPiedi.length), `${scattati.join()} (in piedi: ${inPiedi.join()})`)
  const distinti = scattati.filter((x, i) => scattati.indexOf(x) === i)
  uguale('nell\'ordine della fila', distinti.join(), attesi.filter(x => distinti.includes(x)).join())
  await scelta()
  uguale('a racconto finito torna la scelta', await page.locator('[data-caselle-abilita][data-pronto]').count(), 1)
  uguale('con lo stesso numero di mostri in piedi di quelli che si vedono', vivi, await page.locator('[data-mostro]:not([data-morto])').count())
  controlla('i colpiti restano al loro posto (niente salti)', (await caselle('[data-mostro]')).length === 6)
}

/* ---------- 4. un tocco accorcia il racconto ----------
   Uno scontro nuovo e pieno: dopo il Grido del punto 3 i sei di prima sono quasi caduti, e un colpo di spada finisce
   lo scontro — `[data-duello]` sparisce e non c'è più un racconto da accorciare. Con sei nuovi, un colpo solo ne
   colpisce uno, e lo scontro dura. Il cavaliere nudo del test ha poca vita contro sei mostri che colpiscono in fila
   (cade nel racconto): qui ha anche la tempra, e la vita che ne viene. */
await entra('mostri=6', { cr: { ...crescita, tempra: 8 } })
await scelta()
{
  await toccaIl('[data-azione="attacco"]')
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  await attendi(page, 500)
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
  await page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })
  const t0 = Date.now()
  await tocca(195, 400)   // in mezzo alla scena, lontano dai mostri: non sceglie nessun bersaglio, accorcia
  await finitoIlRacconto()
  const ms = Date.now() - t0
  // non si misura la fretta: in SwiftShader un fotogramma dura mezzo secondo, e un racconto accorciato (sei volte più svelto)
  // finisce quasi insieme a uno intero. Si prova che il tocco non lo pianta: finisce, e la scelta torna
  controlla('dopo un tocco il racconto finisce e la scelta torna', ms < 25000, ms + ' ms')
  await scelta()
  uguale('e quel tocco non ha scelto un bersaglio: resta il primo', (await bersagli()).join(), '0')
}

/* ---------- 5. il mostro grosso al centro ---------- */
await entra('mostri=5&grosso=grumo')
await scelta()
{
  const n = await page.locator('[data-mostro]').count()
  const gi = Number(await page.locator('[data-mostro][data-grande]').getAttribute('data-i'))
  const corpi = []
  for (let i = 0; i < n; i++) corpi.push({ i, ...(await corpoDi(i)) })
  const g = corpi[gi], altri = corpi.filter(m => m.i !== gi)
  uguale('con il grosso, cinque in campo', n, 5)
  controlla('il grosso è più alto di tutti gli altri (nella scena)', altri.every(m => g.alto > m.alto), `${g.alto} contro ${altri.map(m => m.alto)}`)
  // chi viene prima sta più vicino all'eroe, il grosso un passo più in là (la sua mole non copre l'eroe: grafica-3d.md, «Lo scontro»)
  controlla('e non copre nessuno: a schermo ogni altro è a più di 40 px dal suo centro',
            altri.every(m => Math.hypot(m.x - g.x, m.y - g.y) > 40), altri.map(m => `${Math.round(m.x - g.x)},${Math.round(m.y - g.y)}`).join(' | '))
  const ms = await caselle('[data-mostro]')
  const p = await palco()
  controlla('tutti dentro il palco', ms.every(m => m.x >= p.x - 1 && m.r <= p.x + p.width + 1 && m.y >= p.y - 1 && m.b <= p.y + p.height + 1))
  uguale('il grosso ha il suo nome sul palco', await page.locator('[data-mostro][data-grande] [data-nome-mostro]').count(), 1)
  await scatto(page, 'gruppi-grosso')
}

/* ---------- 6. tre mostri, a 390 e a 320 ---------- */
await entra('mostri=3')
await scelta()
{
  uguale('tre mostri', await page.locator('[data-mostro]').count(), 3)
  uguale('in due colonne', colonne(await caselle('[data-mostro]')), 2)
  await scatto(page, 'gruppi-tre')
}
await entra('mostri=6')
await scelta()
{
  await page.setViewportSize({ width: 320, height: 640 })
  await attendi(page, 400)
  const p = await palco()
  const ms = await caselle('[data-mostro]')
  controlla('a 320 px il palco sta nella finestra', p.x >= 0 && p.x + p.width <= 320, JSON.stringify(p))
  controlla('e i sei mostri nel palco', ms.every(m => m.x >= p.x - 1 && m.r <= p.x + p.width + 1), JSON.stringify(ms.map(m => [Math.round(m.x), Math.round(m.r)])))
  uguale('la pagina non scorre di lato', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  // i sei mostri nella scena, sopra il pannello della scelta
  const sopra = await page.evaluate(() => document.querySelector('[data-pannello3d]').getBoundingClientRect().top)
  const fuori = []
  for (let i = 0; i < 6; i++) { const c = await corpoDi(i); if (c.x < 0 || c.x > 320 || c.y > sopra) fuori.push(`${i}: ${Math.round(c.x)},${Math.round(c.y)}`) }
  controlla('a 320 px i sei mostri stanno nella scena, sopra il pannello', fuori.length === 0, fuori.join(' | ') + ` (pannello a ${Math.round(sopra)})`)
  await scatto(page, 'gruppi-sei-320')
}

/* ---------- 7. l'agguato e la sorpresa ---------- */
await entra('mostri=3&agguato=1', { disegno: false })
{
  await page.waitForSelector('[data-apertura]', { timeout: 3000 })
  uguale('l\'agguato lo dice', (await page.locator('[data-apertura]').innerText()).trim(), 'Alle spalle!')
  await page.waitForSelector('[data-eroe-scontro] .sot-numero-preso', { timeout: 3000 })   // chi arriva alle spalle colpisce per primo
  await scatto(page, 'gruppi-agguato')
  await finitoIlRacconto()
  uguale('la riga poi sparisce', await page.locator('[data-apertura]').count(), 0)
}
await entra('mostri=2&sorpresa=1', { disegno: false })
{
  await page.waitForSelector('[data-apertura]', { timeout: 3000 })
  controlla('la sorpresa lo dice', /sorpres/i.test(await page.locator('[data-apertura]').innerText()))
  const fila = await page.locator('[data-fila] [data-turno]').evaluateAll(es => es.map(e => e.dataset.chi))
  // il primo turno prima di tutto (docs/sotterraneo/scontro.md, «La sorpresa»). Il secondo di fila no: dipende dalla velocità
  // dell'eroe, che con la destrezza di questo cavaliere è sotto quella dei mostri (`VELOCITA_BASE_EROE`)
  uguale('e il suo primo turno arriva prima di tutto', fila[0], 'eroe')
  await finitoIlRacconto()
}

/* ---------- 8. gli effetti delle abilità: un mago contro tre melme (resistono al fulmine, temono il fuoco) ----------
   Quello che compare durante il racconto dura poco e le foto sotto carico sono lente: un osservatore dentro la pagina
   registra tutto quello che compare (effetti, numeri, scritte, stati), e le prove si fanno su quello. Le foto sono per gli occhi. */
const rispondiGiusto = async () => {
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  await attendi(page, 450)
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
}
const osserva = () => page.evaluate(() => {
  const v = window.__visti = { numeri: [], testi: [], stati: [], titoli: [], effetti3d: 0 }
  const guarda = n => {
    if (n.nodeType !== 1) return
    for (const e of [n, ...n.querySelectorAll('*')]) {
      if (e.dataset && e.dataset.stato) { v.stati.push(e.dataset.stato); v.titoli.push(e.title || '') }
      if (e.classList && e.classList.contains('sot-numero')) { v.numeri.push([...e.classList].find(c => /^sot-numero-/.test(c))); v.testi.push(e.textContent.trim()) }
    }
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(guarda))).observe(document.querySelector('[data-duello]'), { childList: true, subtree: true })
  // gli effetti sono modelli nella scena, non elementi della pagina: la scena dice quanti ne ha vivi (grafica().effetti3d)
  clearInterval(window.__visteGiro)
  window.__visteGiro = setInterval(() => { const g = window.__sotterraneo3d && window.__sotterraneo3d.grafica(); if (g) v.effetti3d = Math.max(v.effetti3d, g.effetti3d) }, 20)
})
const visti = () => page.evaluate(() => { clearInterval(window.__visteGiro); return window.__visti })
const foto = async nome => { try { await scatto(page, nome) } catch { /* il racconto può essere finito: la prova non dipende da questo */ } }
{
  const mago = { eroe: 'mago', r: { ...roba, mano: 'verga' },
    cr: { esp: sogliaDi(16), caselle: ['sfera-di-fuoco', 'catena-di-fulmini', 'prigione-di-ghiaccio'],
      albero: Object.fromEntries(['dardo-di-fuoco', 'fiamma-viva', 'sfera-di-fuoco', 'scudo-arcano', 'fonte-arcana', 'raggio-arcano', 'catena-di-fulmini',
                                  'raggio-di-gelo', 'gelo-profondo', 'scheggia', 'prigione-di-ghiaccio'].map(id => [id, 1])) } }
  await entra('mostri=3&tipo=melma', mago)
  await scelta()
  // la palla di fuoco: prima di rispondere chi teme il fuoco ha il segno sopra; poi vola, scoppia, e chi la teme ha il numero grande
  await toccaIl('[data-abilita="sfera-di-fuoco"]')
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  const teme = await page.locator('[data-segno-pre="teme"]').count()
  controlla('la palla di fuoco: le melme prese temono il fuoco, col segno sopra (prima di rispondere)', teme >= 2, 'segni «teme»: ' + teme)
  uguale('e il segno lo dice a chi lo guarda', (await page.locator('[data-segno-pre="teme"]').first().getAttribute('title')).trim(), 'teme il fuoco')
  await foto('effetti-segni-prima')
  await osserva()
  await rispondiGiusto()
  await page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })
  await attendi(page, 200)
  await foto('effetti-palla-vola')
  await attendi(page, 300)
  await foto('effetti-palla-scoppia')
  await finitoIlRacconto()
  {
    const v = await visti()
    controlla('la palla di fuoco è un effetto vivo nella scena durante il racconto', v.effetti3d >= 1, String(v.effetti3d))
    controlla('chi teme il fuoco: numero grande e «lo teme!»', v.numeri.includes('sot-numero-teme') && v.testi.includes('lo teme!'), v.numeri.join() + ' | ' + v.testi.join())
  }
  // la catena di fulmini: le tre melme resistono (segno prima di rispondere), un lampo salta dall'una all'altra
  // (un altro scontro: il fuoco ne ha già battute)
  await entra('mostri=3&tipo=melma&bis=1', mago)
  await scelta()
  await toccaIl('[data-abilita="catena-di-fulmini"]')
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  uguale('la catena di fulmini: le tre melme resistono al fulmine, col segno', await page.locator('[data-segno-pre="resiste"]').count(), 3)
  uguale('e il segno dice «resiste»', (await page.locator('[data-segno-pre="resiste"]').first().getAttribute('title')).trim(), 'resiste al fulmine')
  await osserva()
  await rispondiGiusto()
  await page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })
  await attendi(page, 150)
  await foto('effetti-catena')
  await attendi(page, 300)
  await foto('effetti-resiste')
  await finitoIlRacconto()
  {
    const v = await visti()
    controlla('la catena di fulmini è un effetto vivo nella scena durante il racconto', v.effetti3d >= 1, String(v.effetti3d))
    controlla('chi resiste al fulmine ha il numero piccolo e la scritta «resiste»', v.numeri.includes('sot-numero-resiste') && v.testi.includes('resiste'), v.numeri.join() + ' | ' + v.testi.join())
  }
  await scelta()
  // il gelo si vede addosso: la prigione di ghiaccio, mentre il mostro è chiuso nel ghiaccio (un altro scontro: l'energia è finita)
  await entra('mostri=3&tipo=melma&bis=2', mago)
  await scelta()
  await toccaIl('[data-abilita="prigione-di-ghiaccio"]')
  await osserva()
  await rispondiGiusto()
  await page.waitForSelector('[data-mostro] [data-stato="fermo"]', { timeout: 6000, state: 'attached' })
  await foto('effetti-gelo')
  await finitoIlRacconto()
  {
    const v = await visti()
    // la pastiglia di gelo è quella del fermo, col fiocco: il testo che dice «chiuso nel ghiaccio» lo scrive il motore, non il racconto
    controlla('il gelato ha la pastiglia del fermo addosso e il blocco di ghiaccio che si forma nella scena',
              v.stati.includes('fermo') && v.effetti3d >= 1, v.stati.join() + ' | ' + v.effetti3d)
  }
}
// uno stordito ha le stelle sopra la testa
{
  const cav = { eroe: 'cavaliere', r: { ...roba, mano: 'spada', mancina: 'scudo-legno' },
    cr: { esp: sogliaDi(12), albero: { 'scudo-alzato': 1, parata: 1, spallata: 1 }, caselle: ['spallata', null, null] } }
  await entra('mostri=2&tipo=goblin', cav)
  await scelta()
  await toccaIl('[data-abilita="spallata"]')
  await osserva()
  await rispondiGiusto()
  await page.waitForSelector('[data-mostro] [data-stato="fermo"]', { timeout: 6000, state: 'attached' })
  await foto('effetti-stordito')
  await finitoIlRacconto()
  const v = await visti()
  controlla('lo stordito ha la pastiglia del fermo addosso, e il colpo il suo urto nella scena', v.stati.includes('fermo') && v.effetti3d >= 1,
            v.stati.join() + ' | ' + v.effetti3d)
}

uguale('nessun errore in pagina', errori.length, 0)
if (errori.length) console.log(errori)
await browser.close()
riassunto('lo scontro a gruppi, col dito')
