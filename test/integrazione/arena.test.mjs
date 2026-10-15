/* ═══════════════════════════════════════════════════════════════════
   CASTLE BATTLE — IL GIRO COMPLETO, COL DITO

   Il test unitario prova il motore e la campagna; questo dice che **il
   gioco vero sta in piedi nel browser**: si apre dalla home, la mappa
   apre la prima tappa, il campo si dipinge (gli sprite del castello
   arrivano da un foglio che si decodifica dopo), la carta di una piazzola apre
   la scelta fra le truppe della tappa e il campo sta fermo, «i numeri» aprono i
   dettagli, poi il calcolo a tutto schermo (il campo intanto rallenta, non si
   ferma), e rispondere costruisce davvero la caserma con la truppa scelta, che
   nei dettagli si può vendere. Poi
   si esce a metà e la mappa offre la partita, che si riprende con la caserma
   costruita.

   Le tre cose che da fuori non somigliano a un guasto:
   - **il campo vuoto**: un canvas senza figure non dà nessun errore.
   - **i dettagli che non fermano il campo**: nessun errore, ma chi legge con
     calma si ritrova la battaglia cambiata.
   - **la partita ripresa su un altro canvas** (vedi survivors-sosta).
   La battaglia infinita (in cima alla mappa, senza timer, un terreno diverso a ogni volta, con la truppa
   firma del terreno) si prova a parte: chiusa finché la campagna non è finita, poi si apre, si dipinge, la
   nuvoletta mostra le truppe di quel terreno (le bestie cornute in neve e lava), la sosta la ritrova col suo
   terreno, e la volta dopo il terreno è un altro.
   `node test/esegui.mjs arena --niente-build`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scatto, scegli, leggiProfilo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { settings: { eta: 8, sperimentali: true } })

/* ── dalla home alla prima tappa ── */
await scegli(page, 'arena')
await page.waitForSelector('.ar-mappa', { timeout: 8000 })
controlla('la mappa mostra le dodici tappe', await page.locator('[data-tappa]').count() === 12)
controlla('solo la prima è aperta', await page.locator('[data-tappa]:not([disabled])').count() === 1)
controlla('in cima c\'è la battaglia infinita, chiusa finché la campagna non è finita',
          await page.locator('[data-infinita]').count() === 1 && await page.locator('[data-infinita][disabled]').count() === 1)
await scatto(page, 'arena-mappa')

await page.locator('[data-tappa="0"]').click()
await page.waitForSelector('[data-piazzola="0"]', { timeout: 8000 })

/* il campo si dipinge: le figure arrivano dopo, ma entro qualche secondo
   nel canvas c'è più di un colore */
const colori = () => page.evaluate(() => {
  const c = document.querySelector('.ar-tela')
  if (!c || !c.width) return 0
  const x = c.getContext('2d')
  const visti = new Set()
  for (let i = 0; i < 40; i++)
    for (let j = 0; j < 20; j++) {
      const d = x.getImageData(Math.floor(c.width * (i + 0.5) / 40), Math.floor(c.height * (j + 0.5) / 20), 1, 1).data
      visti.add(`${d[0] >> 4},${d[1] >> 4},${d[2] >> 4}`)
    }
  return visti.size
})
let n = 0
for (let t = 0; t < 40 && n < 25; t++) { await attendi(page, 250); n = await colori() }
controlla('il campo è dipinto (non è un canvas vuoto)', n >= 25, `solo ${n} colori`)
await scatto(page, 'arena-campo')

const monete = async () => Number((await page.locator('[data-monete] b').innerText()).trim())
controlla('si parte con qualche moneta di battaglia', await monete() >= 14)
controlla('e c\'è scritto quante ne arrivano al secondo', /\/s/.test(await page.locator('[data-monete]').innerText()))
controlla('si parte senza edifici: sei piazzole libere da toccare, e il castello',
          await page.locator('[data-piazzola]:not([data-variante])').count() === 6 && await page.locator('[data-castello]').count() === 1)
controlla('restano solo ripara e bomba, e il muro non si compra',
          await page.locator('.ar-azioni [data-azione]').count() === 2 &&
          await page.locator('[data-azione="muro"]').count() === 0)

/* ── toccare una piazzola apre la scelta, e il campo sta fermo mentre si sceglie ── */
const orologio = () => page.locator('.ar-hud b').first().innerText()
await page.locator('[data-piazzola="0"]').click()
await page.waitForSelector('[data-scelta="0"]', { timeout: 4000 })
const t0 = await orologio()
await attendi(page, 1600)
uguale('mentre si sceglie il campo sta fermo', await orologio(), t0)
controlla('la scelta mostra le due truppe della prima tappa',
          await page.locator('[data-scelta] [data-variante="scheletri"]').count() === 1 &&
          await page.locator('[data-scelta] [data-variante="guardiano"]').count() === 1)
await scatto(page, 'arena-scelta')

/* ── «i numeri» spiegano, e il campo resta fermo ── */
await page.locator('[data-scelta] [data-dettagli="guardiano"]').click()
await page.waitForSelector('[data-dettagli-aperti]', { timeout: 4000 })
await attendi(page, 800)
uguale('mentre si leggono i dettagli il campo sta fermo', await orologio(), t0)
const testo = await page.locator('[data-dettagli-aperti]').innerText()
controlla('i dettagli dicono com\'è adesso e com\'è al livello dopo, coi numeri',
          /Livello 1/.test(testo) && /Livello 2/.test(testo) && /Una squadra ogni/.test(testo) && /Vita di ogni truppa/.test(testo) && !/%/.test(testo), testo.slice(0, 300))
controlla('e quanto costa, senza dire che conto serve', /6\s*💎/.test(testo) && !/si risolve/.test(testo), testo.slice(0, 200))
await scatto(page, 'arena-dettagli')
await page.locator('[data-procedi]').click()

/* ── una scelta apre il calcolo a tutto schermo ── */
await page.waitForSelector('.ar .qz-tasto', { timeout: 6000 })
const area = await page.locator('.ar').boundingBox()
const velo = await page.locator('.ar .qz-velo').boundingBox()
controlla('il calcolo prende tutto lo schermo', velo.height >= area.height * 0.95 && velo.width >= area.width * 0.95,
          `velo ${Math.round(velo.width)}×${Math.round(velo.height)} su ${Math.round(area.width)}×${Math.round(area.height)}`)
await scatto(page, 'arena-calcolo')

/* si risponde finché la caserma nasce: sbagliare non costa monete, quindi a
   un conto sbagliato si riprova col prossimo */
let costruita = false
for (let giro = 0; giro < 12 && !costruita; giro++) {
  if (!(await page.locator('.ar .qz-tasto').count())) {
    if (await page.locator('[data-piazzola="0"][data-variante]').count() === 1) break
    await page.locator('[data-piazzola="0"]').click().catch(() => {})
    await page.locator('[data-costruisci="guardiano"]').click({ timeout: 4000 }).catch(() => {})
    await page.waitForSelector('.ar .qz-tasto', { timeout: 6000 }).catch(() => {})
  }
  await attendi(page, 450)                           // la finestra cieca del montaggio
  await page.locator('.ar .qz-tasto').nth(giro % 4).click().catch(() => {})
  await attendi(page, 1200)
  await page.waitForSelector('.ar .qz-velo', { state: 'detached', timeout: 12000 }).catch(() => {})
  costruita = await page.locator('[data-piazzola="0"][data-variante="guardiano"]').count() === 1
}
controlla('rispondendo giusto la cripta nasce davvero, con gli opliti', costruita)
if (costruita) {
  // toccata, la caserma mostra l'anello: potenziarla al livello 2, venderla per metà della spesa, i numeri
  await page.locator('[data-piazzola="0"]').click()
  await page.waitForSelector('[data-anello="potenzia"]', { timeout: 4000 })
  controlla('toccata, la caserma mostra l\'anello col livello dopo', /Lv\s*2/.test(await page.locator('[data-anello="potenzia"]').innerText()))
  controlla('e si vende per metà della spesa', /\+3/.test(await page.locator('[data-anello="vendi"]').innerText()))
  await scatto(page, 'arena-anello')
  await page.locator('[data-anello="numeri"]').click()
  await page.waitForSelector('[data-dettagli-aperti]', { timeout: 4000 })
  controlla('«i numeri» aprono i dettagli, col tasto per vendere', await page.locator('[data-vendi]').count() === 1)
  await page.locator('[data-dettagli-aperti] .ar-x').click()
  await page.waitForSelector('[data-dettagli-aperti]', { state: 'detached', timeout: 4000 })
  await page.locator('[data-castello]').click()
  controlla('anche il castello si tocca, e si potenzia dall\'anello', await page.locator('[data-anello="potenzia"]').count() === 1 &&
            await page.locator('[data-anello="vendi"]').count() === 0)
  await page.locator('[data-castello]').click()
}
await scatto(page, 'arena-costruita')

/* ── uscire a metà non butta via la battaglia ── */
for (let t = 0; t < 40; t++) {                         // la sosta si scrive da cinque secondi di partita in su
  const orologio = await page.locator('.ar-hud b').first().innerText()
  const [m, s] = orologio.split(':').map(Number)
  if (m * 60 + s <= 290) break
  await attendi(page, 500)
}
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.ar-mappa', { timeout: 6000 })
let sosta = null
for (let t = 0; t < 20 && !sosta; t++) { await attendi(page, 250); sosta = (await leggiProfilo(page))?.campagne?.arena?.sosta || null }
controlla('uscendo la sosta si scrive nel profilo', !!sosta)
controlla('e la mappa offre di riprendere', await page.locator('[data-ripresa]').count() === 1)
await scatto(page, 'arena-ripresa')

await page.locator('[data-azione="riprendi"]').first().click()
await page.waitForSelector('[data-piazzola="0"]', { timeout: 8000 })
controlla('riprendendo la caserma costruita è ancora lì',
          await page.locator('[data-piazzola="0"][data-variante="guardiano"]').count() === 1)
n = 0
for (let t = 0; t < 40 && n < 25; t++) { await attendi(page, 250); n = await colori() }
controlla('e il campo ripreso si dipinge sul canvas nuovo', n >= 25, `solo ${n} colori`)

/* ── la battaglia infinita ── */
await azzera(page)
await semina(page, { settings: { eta: 8, sperimentali: true, tuttoAperto: true } })
await scegli(page, 'arena')
await page.waitForSelector('.ar-mappa', { timeout: 8000 })
controlla('con i lucchetti tolti la battaglia infinita si apre', await page.locator('[data-infinita]:not([disabled])').count() === 1)
await scatto(page, 'arena-mappa-infinita')

const FIRMA = { bosco: 'pipistrelli', palude: 'lupi', neve: 'golem', lava: 'diavoletto' }
const ultimoTerreno = async () => (await leggiProfilo(page))?.campagne?.arena?.ultimoTerreno
const tempoDelCampo = async () => {
  const [m, s] = (await page.locator('.ar-hud b').first().innerText()).split(':').map(Number)
  return m * 60 + s
}
async function entra(nome) {
  await page.waitForSelector('[data-piazzola="0"]', { timeout: 8000 })
  let colori = 0
  for (let t = 0; t < 40 && colori < 25; t++) { await attendi(page, 250); colori = await (async () => page.evaluate(() => {
    const c = document.querySelector('.ar-tela')
    if (!c || !c.width) return 0
    const x = c.getContext('2d'), visti = new Set()
    for (let i = 0; i < 40; i++) for (let j = 0; j < 20; j++) {
      const d = x.getImageData(Math.floor(c.width * (i + 0.5) / 40), Math.floor(c.height * (j + 0.5) / 20), 1, 1).data
      visti.add(`${d[0] >> 4},${d[1] >> 4},${d[2] >> 4}`)
    }
    return visti.size
  }))() }
  controlla(`${nome}: il campo si dipinge`, colori >= 25, `solo ${colori} colori`)
}
await page.locator('[data-infinita]').click()
await entra('infinita')
let terreno1 = null
for (let t = 0; t < 20 && !terreno1; t++) { await attendi(page, 250); terreno1 = await ultimoTerreno() }
controlla('il terreno si scrive nel profilo, in campagne.arena', Object.keys(FIRMA).includes(terreno1), String(terreno1))
controlla('l\'orologio conta quanto si resiste, non quanto manca', /♾️/.test(await page.locator('.ar-hud').innerText()) && await tempoDelCampo() < 20)
await scatto(page, 'arena-infinita')

/* la nuvoletta di una piazzola libera: le truppe di quel terreno e nessuna firma degli altri */
async function nuvoletta(terreno, posto, nome) {
  await page.locator(`[data-piazzola="${posto}"]`).click()
  await page.waitForSelector(`[data-scelta="${posto}"]`, { timeout: 4000 })
  await attendi(page, 350)                                 // la nuvoletta spunta con un rimbalzo
  const varianti = await page.locator('[data-scelta] [data-variante]').evaluateAll(l => l.map(x => x.getAttribute('data-variante')))
  controlla(`${terreno}: la nuvoletta ha la truppa firma (${FIRMA[terreno]}) e nessuna di quelle degli altri terreni`,
            varianti.includes(FIRMA[terreno]) && Object.entries(FIRMA).every(([t, id]) => t === terreno || !varianti.includes(id)), varianti.join())
  controlla(`${terreno}: le truppe comuni ci sono sempre`, ['scheletri', 'guardiano', 'negromante', 'drago'].every(id => varianti.includes(id)))
  controlla(`${terreno}: le bestie cornute, la tana di neve e lava, solo lì`, varianti.includes('bestie') === (terreno === 'neve' || terreno === 'lava'), varianti.join())
  const largo = await page.locator('[data-scelta]').boundingBox()
  controlla(`${terreno}: la nuvoletta sta nello schermo (va a capo)`, largo.x >= 0 && largo.x + largo.width <= 390, `${Math.round(largo.x)}+${Math.round(largo.width)}`)
  await scatto(page, nome)
}
await nuvoletta(terreno1, 0, 'arena-infinita-scelta')
await page.locator('[data-scelta] [data-costruisci="scheletri"]').click()
await page.waitForSelector('.ar .qz-tasto', { timeout: 6000 })
await page.locator('.ar .qz-tasto').first().click()   // sbagliare non costa niente: la sosta c'è comunque
await attendi(page, 600)

/* si esce a metà: la sosta si scrive col suo terreno, la carta la offre, e una battaglia nuova ha un altro terreno */
for (let t = 0; t < 30 && await tempoDelCampo() < 7; t++) await attendi(page, 500)
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.ar-mappa', { timeout: 6000 })
let sosta2 = null
for (let t = 0; t < 20 && !sosta2; t++) { await attendi(page, 250); sosta2 = (await leggiProfilo(page))?.campagne?.arena?.sosta || null }
controlla('uscendo la sosta della battaglia infinita ha il suo terreno e nessun tempo che resta',
          !!sosta2 && sosta2.chiave === 'infinita' && sosta2.terreno === terreno1 && sosta2.resto === 0, JSON.stringify(sosta2 && { c: sosta2.chiave, t: sosta2.terreno }))
controlla('e la mappa offre di riprendere', await page.locator('[data-ripresa]').count() === 1)
await page.locator('[data-azione="riprendi"]').first().click()
await entra('ripresa')
controlla('riprendendo il terreno e il campo sono gli stessi', await ultimoTerreno() === terreno1 && /♾️/.test(await page.locator('.ar-hud').innerText()))
await attendi(page, 900)                                 // la ripresa nasce in pausa: si tocca per continuare
await page.locator('[data-pausa]').click()
await page.waitForSelector('[data-pausa]', { state: 'detached', timeout: 4000 })
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.ar-mappa', { timeout: 6000 })
await page.locator('[data-infinita]').click()
await page.locator('[data-azione="comincia"]').click()
await entra('seconda')
let terreno2 = terreno1
for (let t = 0; t < 20 && terreno2 === terreno1; t++) { await attendi(page, 250); terreno2 = await ultimoTerreno() }
controlla('la volta dopo il terreno è un altro', Object.keys(FIRMA).includes(terreno2) && terreno2 !== terreno1, `${terreno1} → ${terreno2}`)
await scatto(page, 'arena-infinita-2')
await nuvoletta(terreno2, 1, 'arena-infinita-2-scelta')

/* finché non esce un terreno con le bestie cornute (neve o lava) si ricomincia: serve a guardarle nella nuvoletta */
let terreno3 = terreno2
for (let giro = 0; giro < 6 && terreno3 !== 'neve' && terreno3 !== 'lava'; giro++) {
  await page.click('button[aria-label="indietro"]')
  await page.waitForSelector('.ar-mappa', { timeout: 6000 })
  await page.locator('[data-infinita]').click()
  if (await page.locator('[data-azione="comincia"]').count()) await page.locator('[data-azione="comincia"]').click()
  await entra('altra')
  const prima = terreno3
  for (let t = 0; t < 20 && terreno3 === prima; t++) { await attendi(page, 250); terreno3 = await ultimoTerreno() }
  controlla('anche questa volta il terreno cambia', terreno3 !== prima, `${prima} → ${terreno3}`)
}
if (terreno3 !== terreno2) await nuvoletta(terreno3, 2, 'arena-infinita-bestie')

uguale('nessun errore in console', errori.length, 0)
if (errori.length) nota(errori.slice(0, 3).join(' · '))
await browser.close()
riassunto('arena (browser)')
