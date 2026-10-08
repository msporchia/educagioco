/* ═══════════════════════════════════════════════════════════════════
   LA FRECCINA VERSO LA MISSIONE, COL DITO VERO

   Chi gioca poco spesso non si ricorda cosa aveva preso tre giorni fa
   (docs/sotterraneo/missioni.md, «La freccina»). Giù, attorno all'eroe,
   una freccina punta verso la missione presa e non ancora fatta: il
   forziere d'oro se sta su questo piano, la scala se è più in basso. Sulla
   terra di sopra, sul bordo, un'altra azzurra col ritaglio della discesa
   porta alla discesa della missione; le consegne pronte hanno la
   precedenza, col loro «?» d'oro.

   La direzione non si crede al gioco: si misura sullo schermo. Il piano
   nasce dal seme (`#seme=`, lo stesso generatore gira qui in Node e dice
   dove stanno hero, forziere e scala), e la punta della freccina deve
   cadere sulla retta che va dall'eroe alla cosa.
   `node test/esegui.mjs sotterraneo-rotta`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scendiNelSotterraneo, lasciaLaDiscesa }
  from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { T } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { PARTENZA } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { presePer, PRESA, FATTA, rotta } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'

const indiceDi = chiave => CAMPAGNA.findIndex(t => t.chiave === chiave)
const TORRE = indiceDi('torre'), CANTINE = indiceDi('cantine')
const DISCESE = TORRE + 1   // tutte le discese fino alla torre sono finite o aperte
const roba = robaAttesa('cavaliere', TORRE, { gemme: 5 })

/* ── il piano: un seme dove la cosa non sta troppo vicina né troppo lontana dall'eroe, così si vede la freccina ── */
function scegliIlPiano(chiave, missione, voluto, [min, max]) {
  const i = indiceDi(chiave)
  let meglio = null
  for (let seme = 1; seme < 300; seme++) {
    const c = new Corsa(CAMPAGNA[i], { seme, eroe: 'cavaliere', roba, missioni: presePer({ [missione]: PRESA }, chiave) })
    const r = rotta(c)
    if (r && r.verso === voluto && r.distanza > min && r.distanza < max && (!meglio || r.distanza < meglio.r.distanza))
      meglio = { seme, c, r }
  }
  return meglio
}
const forziere = scegliIlPiano('cantine', 'collana', 'qui', [4, 9])
const alla_scala = scegliIlPiano('torre', 'chiavi', 'scala', [4, 40])
controlla('c\'è un piano della scalinata con la collana a pochi passi', !!forziere)
controlla('e uno della torre con la scala a pochi passi', !!alla_scala)

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const profilo = (missioni, dove = PARTENZA.piede) => ({
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: DISCESE, libera: false, stelle: { 0: 3, 1: 3, 2: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: DISCESE, libera: false,
      stelle: { 0: 3, 1: 3, 2: 3 }, missioni, roba,
      terra: { nebbia: 'f'.repeat(768), dove, parlato: true } } } } } },
})

const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
async function toccaIl(sel) {
  const b = await page.locator(sel).first().boundingBox()
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const gradi = (da, a) => Math.atan2(a.y - da.y, a.x - da.x) * 180 / Math.PI
// la differenza fra due angoli, in gradi, da 0 a 180
const scarto = (a, b) => Math.abs(((a - b + 540) % 360) - 180)

/* Dove cade sulla pagina l'eroe (la tela lo scrive), e dove cadrebbe una cosa del piano `c` in celle */
async function geometria(c, cosa) {
  const tela = page.locator('.sot-tela')
  const b = await tela.boundingBox()
  const [sx, sy] = (await tela.getAttribute('data-eroe-schermo')).split(',').map(Number)
  const scala = Number(await tela.getAttribute('data-scala')) * T
  const eroe = { x: b.x + sx, y: b.y + sy }
  const verso = { x: eroe.x + (cosa.x - c.eroe.x) * scala, y: eroe.y + (cosa.y - c.eroe.y) * scala }
  const punta = await page.locator('[data-rotta] i').boundingBox()
  return { eroe, verso, punta: { x: punta.x + punta.width / 2, y: punta.y + punta.height / 2 }, scala }
}

/* ---------- 1. giù, verso il forziere d'oro della collana ---------- */
await semina(page, profilo({ collana: 'presa' }))
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await page.evaluate(s => { location.hash = 'seme=' + s }, forziere.seme)
await scendiNelSotterraneo(page, CANTINE)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await page.waitForSelector('[data-rotta]', { state: 'attached', timeout: 5000 })
await attendi(page, 500)
uguale('la freccina c\'è, e segue la collana', await page.locator('[data-rotta]').getAttribute('data-missione-rotta'), 'collana')
uguale('il forziere è su questo piano: «qui»', await page.locator('[data-rotta]').getAttribute('data-verso'), 'qui')
controlla('la riga in cima dice di cercare il forziere d\'oro',
          (await page.locator('[data-promemoria] li[data-segui]').innerText()).includes('cerca il forziere d\'oro'))
{
  const g = await geometria(forziere.c, forziere.r)
  const anello = { x: g.eroe.x, y: g.eroe.y - 0.25 * g.scala }
  const voluto = gradi(g.eroe, g.verso)
  dentro('la freccina guarda il forziere (scarto in gradi)', scarto(Number(await page.locator('[data-rotta]').getAttribute('data-gradi')), voluto), 0, 2)
  dentro('e la sua punta sta sulla stessa retta, attorno all\'eroe', scarto(gradi(anello, g.punta), voluto), 0, 4)
  const lontano = Math.hypot(g.punta.x - anello.x, g.punta.y - anello.y)
  dentro('a pochi passi dall\'eroe, non sul bordo dello schermo', lontano, 30, 90)
  nota(`forziere a ${forziere.r.distanza.toFixed(1)} celle, a ${Math.round(voluto)}°; la punta a ${Math.round(gradi(anello, g.punta))}°`)
}
uguale('non intralcia il dito: la freccina non prende i tocchi',
       await page.locator('[data-rotta]').evaluate(e => getComputedStyle(e).pointerEvents), 'none')
await scatto(page, 'rotta-forziere')

// il foglio aperto la nasconde (non c'entra col campo), e il velo della pausa non la lascia in mezzo
await page.click('button[aria-label="pausa"]')
await attendi(page, 400)
await page.click('[data-pausa] [data-azione="esci"]')
await page.waitForSelector('.carte', { timeout: 5000 })

/* ---------- 2. giù, la missione è più in basso: la freccina punta alla scala ---------- */
await semina(page, profilo({ chiavi: 'presa' }))
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })   // il profilo seminato non ha la sosta di prima
await page.evaluate(s => { location.hash = 'seme=' + s }, alla_scala.seme)
await scendiNelSotterraneo(page, TORRE)
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await page.waitForSelector('[data-rotta]', { state: 'attached', timeout: 5000 })
await attendi(page, 500)
uguale('la freccina segue le chiavi', await page.locator('[data-rotta]').getAttribute('data-missione-rotta'), 'chiavi')
uguale('sono al terzo piano: «scala»', await page.locator('[data-rotta]').getAttribute('data-verso'), 'scala')
controlla('la riga in cima dice di scendere: «al terzo piano: scendi»',
          /è al terzo piano: scendi/.test(await page.locator('[data-promemoria] li[data-segui]').innerText()),
          await page.locator('[data-promemoria]').innerText())
{
  const scala = alla_scala.c.livello.robe.find(r => r.che === 'scala')
  const dove = { x: scala.x + 0.5, y: scala.y + 0.5 }
  const g = await geometria(alla_scala.c, dove)
  const anello = { x: g.eroe.x, y: g.eroe.y - 0.25 * g.scala }
  const voluto = gradi(g.eroe, g.verso)
  dentro('la freccina guarda la scala (scarto in gradi)', scarto(Number(await page.locator('[data-rotta]').getAttribute('data-gradi')), voluto), 0, 2)
  dentro('e la sua punta sta sulla stessa retta', scarto(gradi(anello, g.punta), voluto), 0, 4)
  uguale('la scala non si è ancora vista (la nebbia non conta)',
         alla_scala.c.visto[scala.y * alla_scala.c.livello.largo + scala.x], 0)
  nota(`scala a ${alla_scala.r.distanza.toFixed(1)} celle, a ${Math.round(voluto)}°`)
}
await scatto(page, 'rotta-scala')

// una cosa aperta (lo zaino) nasconde la freccina: è dentro il campo, non sopra un foglio
await page.click('[data-azione="zaino"]')
await page.waitForSelector('.sot-centrale', { timeout: 3000 })
uguale('con lo zaino aperto la freccina non c\'è', await page.locator('[data-rotta]').count(), 0)
await page.click('[data-azione="chiudi"]')
await attendi(page, 300)
uguale('e chiuso torna', await page.locator('[data-rotta]').count(), 1)

// senza nessuna missione di questa discesa, niente freccina: lasciando perdere si riparte da capo
await lasciaLaDiscesa(page)

/* ---------- 3. sopra: una missione presa, la freccia azzurra sul bordo ---------- */
await semina(page, profilo({ rosicchione: 'presa' }))
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 600)
uguale('niente consegne da fare: la freccia d\'oro non c\'è', await page.locator('[data-consegna-fuori]').count(), 0)
uguale('la freccia azzurra c\'è, e va alla torre', await page.locator('[data-meta-fuori]').getAttribute('data-meta-fuori'), 'torre')
controlla('stesso stampo dell\'altra, e col ritaglio della discesa',
          await page.locator('.sot-bussola.sot-bussola-meta [data-ritaglio]').count() === 1)
controlla('il colore è azzurro e non d\'oro',
          await page.locator('.sot-bussola-meta b').evaluate(e => getComputedStyle(e).backgroundColor) === 'rgb(127, 208, 255)')
{
  const v = await page.locator('[data-terra]').boundingBox()
  const b = await page.locator('[data-meta-fuori]').boundingBox()
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2
  controlla('sta dentro lo schermo, sul bordo', cx > v.x && cx < v.x + v.width && cy > v.y && cy < v.y + v.height,
            `${cx},${cy}`)
}
await scatto(page, 'rotta-sopra')
const prima = await page.locator('[data-eroe-terra]').getAttribute('data-cella')
await toccaIl('[data-meta-fuori]')
await page.waitForFunction(p => document.querySelector('[data-eroe-terra]')?.dataset.cella !== p, prima, { timeout: 5000 })
uguale('toccandola l\'eroe ci va', await page.locator('[data-eroe-terra]').getAttribute('data-cammina'), '1')
await page.waitForSelector('[data-fumetto-di="torre"]', { timeout: 30000 })
controlla('e arrivato si apre il fumetto della discesa, con «scendo»',
          await page.locator('[data-fumetto-di="torre"] [data-azione="scendi"]').count() === 1)
uguale('vicino alla torre la freccia non serve più', await page.locator('[data-meta-fuori]').count(), 0)

/* ---------- 4. una consegna da fare ha la precedenza ---------- */
await semina(page, profilo({ badessa: 'fatta', rosicchione: 'presa' }))
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 600)
uguale('chi aspetta la consegna è lontano: il «?» d\'oro sul bordo', await page.locator('[data-consegna-fuori="eremita"]').count(), 1)
uguale('e la freccia azzurra non c\'è', await page.locator('[data-meta-fuori]').count(), 0)

/* ---------- 5. niente missioni prese: niente freccia ---------- */
await semina(page, profilo({ badessa: 'consegnata' }))
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 600)
uguale('senza missioni prese né da consegnare, il bordo è libero',
       await page.locator('[data-meta-fuori], [data-consegna-fuori]').count(), 0)

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('la freccina verso la missione, giù e sopra')
