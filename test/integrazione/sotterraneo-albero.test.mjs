/* ═══════════════════════════════════════════════════════════════════
   LA PAGINA DELL'ALBERO DELLE ABILITÀ, COL DITO

   (docs/sotterraneo/abilita.md, «Il tech-tree più largo»)
   Quattro rami per classe, sette medaglioni a ramo: si guarda un ramo alla
   volta, toccando il suo stendardo, e nessuno sborda a 390 px. Un mago
   guerriero (spada nella destra, bacchetta nella mancina) vede la Lama
   arcana, che vuole la spada e picchia con l'intelligenza; due nodi nella
   stessa riga sono una scelta; il medaglione toccato dice l'elemento e chi
   prende il colpo; un punto dato accende il nodo. La pagina si apre dal mondo
   di sopra (il globo dell'eroe nella barra), dove si entra dalla carta.
   `node test/esegui.mjs sotterraneo-albero --scatti`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, mondoPronto } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { RAMI } from '../../src/giochi/sotterraneo/dati/abilita.js'

const roba = { v: 1, gemme: 40, zaino: ['pozione'], mano: 'spada', mancina: 'verga', corpo: 'manto', dito: null, torcia: 12, torce: 0 }
// un mago guerriero del livello 12: i primi tre nodi di tre rami già imparati, un punto ancora da dare
const albero = { 'dardo-di-fuoco': 1, 'fiamma-viva': 1, 'sfera-di-fuoco': 1, 'scudo-arcano': 1, 'fonte-arcana': 1, 'lama-incantata': 1, incanto: 1, 'lama-di-fuoco': 1, 'falciata-arcana': 1 }
const avventura = { tappa: 1, libera: false, stelle: { 0: 3 }, missioni: {}, roba,
  mondo: { parlato: true },
  crescita: { v: 2, esp: sogliaDi(12), forza: 1, destrezza: 0, intelligenza: 4, tempra: 0, albero, caselle: ['sfera-di-fuoco', 'lama-incantata', 'scudo-arcano'] } }

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
await semina(page, {
  coins: 300,
  campagne: { sotterraneo: { tappa: 1, libera: false, stelle: { 0: 3 },
    cfg: { mondo: MONDO, eroe: 'mago', avventure: { mago: avventura } } } },
})
await scegli(page, 'sotterraneo')
await mondoPronto(page)
await attendi(page, 600)

const cdp = await page.context().newCDPSession(page)
async function toccaIl(sel) {
  await page.locator(sel).first().scrollIntoViewIfNeeded()   // l'albero scorre dentro la sua cornice
  const b = await page.locator(sel).first().boundingBox()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await attendi(page, 250)
}

await toccaIl('[data-azione="eroe-pagina"]')
await page.waitForSelector('[data-pagina-eroe]', { timeout: 3000 })
await toccaIl('[data-scheda="abilita"]')
await page.waitForSelector('[data-pagina-abilita]', { timeout: 3000 })
await attendi(page, 300)

/* ---------- 1. quattro stendardi, un ramo alla volta ---------- */
const rami = await page.locator('[data-azione="ramo"]').evaluateAll(es => es.map(e => e.dataset.ramoScheda))
uguale('quattro stendardi per il mago', rami.join(), RAMI.mago.map(r => r.chiave).join())
uguale('i rami sono fuoco, gelo, arcano e lama arcana', rami.length, 4)
uguale('si apre quello dove c\'è qualcosa da fare, uno solo alla volta', await page.locator('[data-ramo]').count(), 1)
uguale('e ha le sue cinque righe', await page.locator('[data-ramo] [data-riga]').count(), 5)
uguale('sette nodi', await page.locator('[data-ramo] [data-azione="nodo"]').count(), 7)
const righe = await page.locator('[data-ramo] [data-riga]').evaluateAll(es => es.map(e => e.querySelectorAll('[data-azione="nodo"]').length))
uguale('un nodo, un nodo, due, due, uno: due righe fra cui scegliere', righe.join(), '1,1,2,2,1')
await scatto(page, 'albero-aperto')

/* ---------- 2. la Lama arcana: la spada, e l'intelligenza ---------- */
await toccaIl('[data-azione="ramo"][data-ramo-scheda="lama-arcana"]')
uguale('toccando lo stendardo si apre il ramo', await page.locator('[data-ramo]').getAttribute('data-ramo'), 'lama-arcana')
controlla('vuole la spada', /spada/.test(await page.locator('[data-ramo] .sot-ramo-arma').innerText()))
controlla('e colpisce con l\'intelligenza', /intelligenza/.test(await page.locator('[data-ramo] [data-car]').innerText()))
uguale('con la spada in mano il ramo non è «manca»', await page.locator('[data-ramo] .sot-ramo-arma.sot-manca').count(), 0)
await scatto(page, 'albero-lama-arcana')

/* ---------- 3. un nodo toccato dice l'elemento e chi prende il colpo ---------- */
await toccaIl('[data-nodo="falciata-arcana"]')
{
  const d = page.locator('[data-nodo-dettaglio]')
  uguale('il riquadro è quello del nodo', await d.getAttribute('data-nodo'), 'falciata-arcana')
  uguale('dice l\'elemento', await d.locator('[data-elemento]').getAttribute('data-elemento'), 'fulmine')
  controlla('e chi prende il colpo', /due accanto/.test(await d.locator('[data-chi]').innerText()), await d.innerText())
  controlla('e con cosa picchia', /intelligenza/.test(await d.locator('[data-con]').innerText()))
}
await toccaIl('[data-azione="ramo"][data-ramo-scheda="arcano"]')
await toccaIl('[data-nodo="catena-di-fulmini"]')
controlla('la catena dice che salta sugli altri', /salta/.test(await page.locator('[data-nodo-dettaglio] [data-chi]').innerText()))
await scatto(page, 'albero-catena')

/* ---------- 4. un punto dato accende il nodo ---------- */
await toccaIl('[data-azione="ramo"][data-ramo-scheda="gelo"]')
await toccaIl('[data-nodo="raggio-di-gelo"]')
uguale('un punto da dare', await page.locator('p[data-punti-abilita]').getAttribute('data-n'), '2')
uguale('prima il nodo è pronto', await page.locator('[data-azione="nodo"][data-nodo="raggio-di-gelo"]').getAttribute('data-stato'), 'pronto')
await toccaIl('[data-azione="impara"]')
uguale('poi è preso', await page.locator('[data-azione="nodo"][data-nodo="raggio-di-gelo"]').getAttribute('data-stato'), 'preso')
uguale('e il punto si spende', await page.locator('p[data-punti-abilita]').getAttribute('data-n'), '1')
uguale('una riga più giù si apre: i due nodi della riga dopo sono pronti o aspettano il livello',
       await page.locator('[data-azione="nodo"][data-nodo="gelo-profondo"]').getAttribute('data-stato'), 'pronto')

/* ---------- 5. a 390 px niente sborda ---------- */
for (const r of rami) {
  await toccaIl(`[data-azione="ramo"][data-ramo-scheda="${r}"]`)
  const m = await page.evaluate(() => {
    const a = document.querySelector('[data-albero]')
    return { pagina: document.documentElement.scrollWidth, larga: window.innerWidth, albero: a.scrollWidth, visibile: a.clientWidth }
  })
  controlla(`${r}: la pagina non scorre di lato`, m.pagina <= m.larga + 1 && m.albero <= m.visibile + 1, JSON.stringify(m))
  // tutti i medaglioni stanno dentro la larghezza dello schermo
  const fuori = await page.locator('[data-ramo] [data-azione="nodo"]').evaluateAll(es =>
    es.filter(e => { const b = e.getBoundingClientRect(); return b.left < -1 || b.right > window.innerWidth + 1 }).map(e => e.dataset.nodo))
  uguale(`${r}: nessun medaglione fuori schermo`, fuori.join(), '')
}
await scatto(page, 'albero-fine')

uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
riassunto('la pagina dell\'albero delle abilità')
