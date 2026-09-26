/* ═══════════════════════════════════════════════════════════════════
   IL CASTELLO A SPRITE, GIOCATO

   Il gioco `castello` è il tower defense vero con un'altra pelle
   (`src/giochi/castello/scena/pelle.js`). Le regole le provano già
   `unita/castello` e `integrazione/torri`; qui si prova quello che la
   pelle può rompere:

     · la carta compare in home coi giochi in prova accesi, e apre la
       mappa delle tappe di sempre;
     · il motore ha **le piazzole della carta**, cioè quelle dipinte sul
       fondale — se fossero altre, il dito toccherebbe una pietra e la
       torre nascerebbe sul prato — e un tocco vero su una di loro apre
       il foglio;
     · una torre si costruisce, l'ondata parte e i mostri camminano;
     · il campo si vede, e non è il ripiego a tinta unita: la scena
       vestita ha colori che il ripiego non ha;
     · nessun errore in console, in tre vestiti diversi.

   Con `--scatti` lascia una foto per vestito (`castello-sprite-*`).
   `node test/esegui.mjs castello-sprite`
   tempo: 60
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { TAPPE, MONDO } from '../../src/data/castello.js'
import { cartaDi, percorsoDi } from '../../src/giochi/castello/motore/carta.js'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, { settings: { sperimentali: true } })

/* ---------- 1. la carta, e la mappa ---------- */
const carta = page.locator('.carta.gioco[data-gioco="castello"]')
controlla('la carta è in home coi giochi in prova accesi', await carta.count() === 1)
await carta.click()
await page.waitForSelector('.tappe', { timeout: 5000 })
controlla('la barra dice che è il castello a sprite',
          (await page.locator('.barra-app .dove').textContent()).includes('sprite'))

/* le cose da fare dentro la pagina: si gioca col gancio dei test del
   tower defense, lo stesso di `integrazione/torri` */
const costruisci = (tipo) => page.evaluate(async tipo => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.scegliTorre(tipo)
  await attesa(80)
  const tasti = [...document.querySelectorAll('.tastiera button')]
  T.op.value.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso).click())
  await attesa(200)
  return T.torri().length
}, tipo)

/* quanto del canvas è colorato come un vestito e non come il suo
   ripiego: si contano i colori diversi su una griglia di campioni — il
   ripiego è una tinta sola, e un canvas nero ne ha una sola anche lui */
const colori = () => page.evaluate(() => {
  const c = document.querySelector('.campo canvas')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  const visti = new Set()
  for (let i = 0; i < d.length; i += 4 * 97) visti.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`)
  return visti.size
})

/* i cartelli dei traguardi (una torre costruita, trenta conti senza
   errori) coprono il campo: si chiudono come li chiude un bambino, e
   solo per la foto — il campo sotto intanto è fermo, e va bene */
async function togliCartelli() {
  for (let i = 0; i < 6 && await page.locator('.velo .cartello').count(); i++) {
    await page.locator('.velo').first().click()
    await attendi(page, 350)
  }
}

/* ---------- 2. una partita nel bosco ---------- */
nota('il bosco')
await page.evaluate(() => window.__td.inizia(0))
await attendi(page, 900)

const attese = percorsoDi(cartaDi(TAPPE[0])).percorso.posti
  .map(([fx, fy]) => [Math.round(fx * MONDO.W), Math.round(fy * MONDO.H)])
const motore = (await page.evaluate(() => window.__td.postazioni().map(p => [p.x, p.y])))
  .map(([x, y]) => [Math.round(x), Math.round(y)])
uguale('il motore ha le piazzole della carta', JSON.stringify(motore), JSON.stringify(attese))

/* un tocco vero sulla prima piazzola: dal mondo allo schermo con la
   telecamera del campo, e il foglio deve chiedere che torre */
const dove = await page.evaluate(() => {
  const T = window.__td
  const p = T.postazioni()[0]
  const q = T.versoLoSchermo(p.x, p.y)
  const r = document.querySelector('.campo canvas').getBoundingClientRect()
  return { x: r.left + q.x, y: r.top + q.y }
})
await page.mouse.click(dove.x, dove.y)
await attendi(page, 300)
uguale('toccata la piazzola, il foglio chiede che torre',
       await page.evaluate(() => window.__td.foglio.value && window.__td.foglio.value.che), 'costruisci')

uguale('la torre si costruisce', await costruisci('add'), 1)
controlla('ed è nata sulla piazzola toccata', await page.evaluate(() => {
  const T = window.__td, t = T.torri()[0], p = T.postazioni()[0]
  return Math.hypot(t.x - p.x, t.y - p.y) < 2
}))

const cammino = await page.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.chiamaOnda()
  T.velocita.value = 3
  const fine = Date.now() + 5000
  while (!T.nemici().length && Date.now() < fine) await attesa(100)
  const prima = T.nemici().length ? T.nemici()[0].d : null
  await attesa(1200)
  const dopo = T.nemici().length ? Math.max(...T.nemici().map(n => n.d)) : null
  return { onda: T.hud.onda, prima, dopo, uccisi: T.hud.uccisi }
})
controlla('l\'ondata parte', cammino.onda >= 1, JSON.stringify(cammino))
controlla('e i mostri camminano', cammino.prima != null &&
          (cammino.dopo > cammino.prima || cammino.uccisi > 0), JSON.stringify(cammino))
const nelBosco = await colori()
controlla('il campo è vestito, non una tinta sola', nelBosco > 60, `${nelBosco} colori`)
await togliCartelli()
await scatto(page, 'castello-sprite-bosco')

/* ---------- 3. gli altri vestiti ----------
   Il sotterraneo si veste di lava e le mura di neve (`VESTITO_DI`): due
   immagini diverse da decodificare, e due carte diverse da comporre. */
for (const [i, nome] of [[TAPPE.findIndex(t => t.campagna === 'sotterraneo'), 'lava'],
                         [TAPPE.findIndex(t => t.campagna === 'mura'), 'neve']]) {
  nota(`${TAPPE[i].nome}, vestito di ${nome}`)
  await page.evaluate(i => window.__td.inizia(i), i)
  await attendi(page, 900)
  const n = await page.evaluate(() => window.__td.postazioni().length)
  uguale(`${TAPPE[i].nome}: le piazzole della tappa`, n, TAPPE[i].posti)
  await costruisci('add')
  await costruisci('sub')
  await page.evaluate(async () => {
    const T = window.__td
    T.chiamaOnda()
    T.velocita.value = 3
    await new Promise(r => setTimeout(r, 2500))
  })
  const quanti = await colori()
  controlla(`${TAPPE[i].nome}: il campo è vestito`, quanti > 60, `${quanti} colori`)
  await togliCartelli()
  await attendi(page, 600)
  await scatto(page, `castello-sprite-${nome}`)
}

controlla('nessun errore in console', errori.length === 0, errori.join(' · '))
await browser.close()
riassunto('il castello a sprite, giocato')
