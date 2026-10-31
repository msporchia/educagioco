/* ═══════════════════════════════════════════════════════════════════
   LA FRECCINA VERSO LA MISSIONE, COL DITO VERO

   Chi gioca poco spesso non si ricorda cosa aveva preso tre giorni fa
   (docs/sotterraneo/missioni.md, «La freccina»). Giù, attorno all'eroe,
   una freccina punta verso la missione presa e non ancora fatta: il
   forziere d'oro se sta su questo piano, la scala se è più in basso. Sul
   mondo di sopra le consegne pronte hanno il loro «?» d'oro
   sul bordo, e la freccia azzurra verso la meta sta accanto (non la
   sostituisce più: la meta, la carta e la scia le prova
   `integrazione/sotterraneo-mondo-meta`).

   La direzione non si crede al gioco: si misura sullo schermo. Il piano
   nasce dal seme (`#seme=`, lo stesso generatore gira qui in Node e dice
   dove stanno hero, forziere e scala), e la punta della freccina deve
   cadere sulla retta che va dall'eroe alla cosa (nella scena 3D il punto
   sullo schermo lo dà `aSchermo`).
   `node test/esegui.mjs sotterraneo-rotta`
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, sopraVaDa, mondoPronto }
  from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { presePer, PRESA, FATTA, rotta } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
// al livello atteso della torre: due gradini sotto la guardia non fa scendere (docs/sotterraneo/zone.md)

const indiceDi = chiave => CAMPAGNA.findIndex(t => t.chiave === chiave)
const TORRE = indiceDi('torre'), CANTINE = indiceDi('cantine')
const DISCESE = TORRE + 1   // tutte le discese fino alla torre sono finite o aperte
const roba = robaAttesa('cavaliere', TORRE, { gemme: 5 })
// la forza dell'eroe atteso è sotto il livello (docs/sotterraneo/forza.md): due livelli in più perché la torre non abbia la sentinella
const crescita = crescitaAttesa('cavaliere', TORRE + 2)

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
// il forziere sta nella stanza più lontana dall'arrivo (docs/sotterraneo/missioni.md, «Dove sta»): il più vicino fra i
// semi provati è a una dozzina di celle, fuori dallo schermo, e la freccina serve proprio a questo
const forziere = scegliIlPiano('cantine', 'collana', 'qui', [4, 20])
const alla_scala = scegliIlPiano('torre', 'chiavi', 'scala', [4, 40])
controlla('c\'è un piano della scalinata con la collana non troppo lontana', !!forziere)
controlla('e uno della torre con la scala a pochi passi', !!alla_scala)

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

const profilo = missioni => ({
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: DISCESE, libera: false, stelle: { 0: 3, 1: 3, 2: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: DISCESE, libera: false,
      stelle: { 0: 3, 1: 3, 2: 3 }, missioni, roba, crescita,
      mondo: { parlato: true } } } } } },
})

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
const gradi = (da, a) => Math.atan2(a.y - da.y, a.x - da.x) * 180 / Math.PI
// la differenza fra due angoli, in gradi, da 0 a 180
const scarto = (a, b) => Math.abs(((a - b + 540) % 360) - 180)

/* Dove cade sulla pagina la cosa del piano (in celle, a terra), e dove stanno l'attacco della freccina (l'origine della sua rotazione,
   attorno all'eroe) e la sua punta: la scena 3D dà il punto sullo schermo (`aSchermo`) */
async function geometria(cosa) {
  const tela = page.locator('[data-tela="3d"]')
  const b = await tela.boundingBox()
  const [sx, sy] = await page.evaluate(([x, y]) => window.__sotterraneo3d.aSchermo(x, 0.05, y), [cosa.x, cosa.y])
  const anello = await page.locator('[data-rotta]').boundingBox()
  const punta = await page.locator('[data-rotta] i').boundingBox()
  return { anello: { x: anello.x, y: anello.y }, verso: { x: b.x + sx, y: b.y + sy },
           punta: { x: punta.x + punta.width / 2, y: punta.y + punta.height / 2 } }
}
// la discesa 3D è pronta: la tela, e la scena con le sue figure
const giuPronto = async () => {
  await page.waitForSelector('[data-tela="3d"]', { timeout: 20000 })
  await page.waitForFunction(() => window.__sotterraneo3d && window.__sotterraneo3d.corsa && window.__sotterraneo3d.grafica().figure > 0 && !window.__sotterraneo3d.grafica().mondo, null, { timeout: 30000 })
}
// dal mondo di sopra, con il seme del piano, alla discesa `i`
async function giu(seme, i) {
  await mondoPronto(page)
  await page.evaluate(s => { location.hash = 'sotterraneo&seme=' + s + '&torcia=accesa&dpr=1' }, seme)
  const chiave = CAMPAGNA[i].chiave
  await sopraVaDa(page, `[data-posto="${chiave}"]`, 'ingresso:' + chiave, { atteso: `[data-fumetto-di="${chiave}"] [data-azione="scendi"]` })
  await attendi(page, 300)
  await page.click(`[data-fumetto-di="${chiave}"] [data-azione="scendi"]`)
  await giuPronto()
}

/* ---------- 1. giù, verso il forziere d'oro della collana ---------- */
await semina(page, profilo({ collana: 'presa' }))
await scegli(page, 'sotterraneo')
await giu(forziere.seme, CANTINE)
await page.waitForSelector('[data-rotta]', { state: 'attached', timeout: 5000 })
await attendi(page, 500)
uguale('la freccina c\'è, e segue la collana', await page.locator('[data-rotta]').getAttribute('data-missione-rotta'), 'collana')
uguale('il forziere è su questo piano: «qui»', await page.locator('[data-rotta]').getAttribute('data-verso'), 'qui')
controlla('la riga in cima dice di cercare il forziere d\'oro',
          (await page.locator('[data-promemoria] li[data-segui]').innerText()).includes('cerca il forziere d\'oro'))
{
  const g = await geometria(forziere.r)
  const voluto = gradi(g.anello, g.verso)
  dentro('la freccina guarda il forziere (scarto in gradi)', scarto(Number(await page.locator('[data-rotta]').getAttribute('data-gradi')), voluto), 0, 2)
  dentro('e la sua punta sta sulla stessa retta, attorno all\'eroe', scarto(gradi(g.anello, g.punta), voluto), 0, 4)
  const lontano = Math.hypot(g.punta.x - g.anello.x, g.punta.y - g.anello.y)
  dentro('a pochi passi dall\'eroe, non sul bordo dello schermo', lontano, 30, 90)
  nota(`forziere a ${forziere.r.distanza.toFixed(1)} celle, a ${Math.round(voluto)}°; la punta a ${Math.round(gradi(g.anello, g.punta))}°`)
}
uguale('non intralcia il dito: la freccina non prende i tocchi',
       await page.locator('[data-rotta]').evaluate(e => getComputedStyle(e).pointerEvents), 'none')
await scatto(page, 'rotta-forziere')

// il foglio aperto la nasconde (non c'entra col campo), e il velo della pausa non la lascia in mezzo
await page.click('button[aria-label="pausa"]')
await attendi(page, 400)
await page.click('[data-pausa] [data-azione="esci"]')
await page.waitForSelector('.carte', { timeout: 5000 })
await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))   // senza il cheat dell'indirizzo, che ricaricando riscende

/* ---------- 2. giù, la missione è più in basso: la freccina punta alla scala ---------- */
await semina(page, profilo({ chiavi: 'presa' }))
await scegli(page, 'sotterraneo')   // il profilo seminato non ha la sosta di prima
await giu(alla_scala.seme, TORRE)
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
  const g = await geometria(dove)
  const voluto = gradi(g.anello, g.verso)
  // la scala è a trentatré celle, fuori dallo schermo: la prospettiva schiaccia la profondità e la direzione sullo schermo si scosta di
  // qualche grado da quella della mappa (a otto celle, il forziere, resta dentro i due); la freccina dice la direzione, non la strada
  dentro('la freccina guarda la scala (scarto in gradi)', scarto(Number(await page.locator('[data-rotta]').getAttribute('data-gradi')), voluto), 0, 8)
  dentro('e la sua punta sta sulla stessa retta', scarto(gradi(g.anello, g.punta), voluto), 0, 8)
  uguale('la scala non si è ancora vista (la nebbia non conta)',
         alla_scala.c.visto[scala.y * alla_scala.c.livello.largo + scala.x], 0)
  nota(`scala a ${alla_scala.r.distanza.toFixed(1)} celle, a ${Math.round(voluto)}°`)
}
await scatto(page, 'rotta-scala')

// una cosa aperta (lo zaino) nasconde la freccina: è dentro il campo, non sopra un foglio
await page.click('[data-azione="zaino"]')
await page.waitForSelector('[data-zaino]', { timeout: 3000 })
uguale('con lo zaino aperto la freccina non c\'è', await page.locator('[data-rotta]').count(), 0)
await page.click('[data-azione="chiudi"]')
await attendi(page, 300)
uguale('e chiuso torna', await page.locator('[data-rotta]').count(), 1)

/* ---------- 3. sopra: chi aspetta una consegna ha il «?» d'oro sul bordo ---------- */
await page.click('button[aria-label="pausa"]')
await attendi(page, 400)
await page.click('[data-pausa] [data-azione="esci"]')
await page.waitForSelector('.carte', { timeout: 5000 })
await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))   // senza il cheat dell'indirizzo, che ricaricando riscende
await semina(page, profilo({ badessa: 'fatta', rosicchione: 'presa' }))
await scegli(page, 'sotterraneo')
await mondoPronto(page)
await attendi(page, 600)
uguale('chi aspetta la consegna è lontano: il «?» d\'oro sul bordo', await page.locator('[data-consegna-fuori="eremita"]').count(), 1)
await scatto(page, 'rotta-consegna-fuori')

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('la freccina verso la missione, giù, e la consegna sul bordo sopra')
