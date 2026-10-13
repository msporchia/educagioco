/* ═══════════════════════════════════════════════════════════════════
   LO STOP DELLO SCONTRO, COL DITO VERO

   Quando l'eroe rischia di cadere (docs/sotterraneo/pericolo.md) lo
   scontro si ferma all'inizio del suo turno, prima della domanda: una riga
   rossa sopra la scelta di sempre (attacco, bevi, scappa). Lo stop conta la
   SOMMA dei colpi che arrivano prima del suo prossimo turno
   (docs/sotterraneo/scontro.md, «Lo stop del pericolo»), quindi qui, nella
   scalinata (un mago al livello 10 non è rosso: `coloreNellaStoria`) e con
   cinque mostri addosso (`#sotterraneo=branco&mostri=5`, docs/core/comandi.md)
   e due pozioni in tasca:
   - lo stop scatta già al primo turno, al posto della domanda, con la
     ragione «duro»; per i primi 320 ms i tasti non sentono il tocco;
   - «continuo» (l'attacco) toglie lo stop e fa partire la domanda, senza
     costare vita; con una risposta giusta i mostri colpiscono e, a un colpo
     dal cadere, compare il secondo stop («ultimo»), mai di più;
   - «bevi» alza la vita, consuma una pozione, costa il turno (i mostri
     colpiscono) e la battaglia riprende;
   - in un altro scontro «scappo via» dallo stop esce, col suo costo fisso.
   Si tocca come un bambino (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-pericolo`
   tempo: 150
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scendiNelSotterraneo , finestraFerma }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { LIVELLI_ATTESI } from '../../src/giochi/sotterraneo/dati/storia.js'
import { forzaDi } from '../../src/giochi/sotterraneo/motore/forza.js'
import { coloreNellaStoria } from '../../src/giochi/sotterraneo/motore/zone.js'

const TAPPA = 1   // la scalinata
const EROE = 'mago'   // il più fragile: coi punti non dati, cinque mostri pesano
const roba = { v: 1, gemme: 0, zaino: ['pozione-piccola', 'pozione'], mano: null, mancina: null, corpo: null,
               dito: null, torcia: 0, torce: 0 }
// la tempra dà vita e difesa: senza, il mago di livello 10 ha 14 vita e cinque mostri della scalinata gliene tolgono più di
// quaranta in un giro, quindi cade al primo colpo senza passare dallo stop «ultimo». Con otto punti ne ha 44 contro un giro
// da una trentina: lo stop «duro» (vita ≤ 2 giri) c'è, e dopo un giro c'è quello «ultimo» (vita ≤ 1 giro). Con meno punti
// cade, con più il secondo stop non scatta (provato da 4 a 12)
const crescita = { esp: sogliaDi(10), tempra: 8 }
// il pallino della discesa non deve essere rosso (la sentinella non fa scendere): lo dice la forza (docs/sotterraneo/forza.md)
const colore = coloreNellaStoria(LIVELLI_ATTESI[TAPPA], forzaDi(EROE, roba, crescita))
controlla('la scalinata non è rossa per questo eroe', colore !== 'rosso', colore)

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
const numeroDel = async tipo => Number((await page.locator(`[data-globo="${tipo}"] .sot-globo-numero`).textContent()) || 0)
const pozioni = async () => Number(await page.locator('[data-casella-barra="pozione"]').getAttribute('data-n'))
const stop = () => page.locator('[data-ringhio]')
const finito = () => page.waitForSelector('[data-duello]:not([data-racconto])', { timeout: 20000 })

// un mago nella scalinata, con cinque mostri addosso e la prima scelta davanti
async function entra() {
  // l'indirizzo della prova di prima (`#sotterraneo=…`) aprirebbe il gioco al ricaricamento: si riparte dalla home
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  const avventura = { tappa: TAPPA, libera: false, stelle: { 0: 3 }, missioni: {}, roba, crescita,
    terra: { nebbia: 'f'.repeat(768), dove: [55, 11], parlato: true } }
  await semina(page, {
    coins: 300, settings: { sperimentali: true },
    campagne: { sotterraneo: { tappa: TAPPA, libera: false, stelle: { 0: 3 },
      cfg: { mondo: MONDO, eroe: EROE, avventure: { [EROE]: avventura } } } },
  })
  await scegli(page, 'sotterraneo')
  await page.waitForSelector('[data-terra]', { timeout: 5000 })
  await page.evaluate(() => { location.hash = 'seme=11&sotterraneo=branco&mostri=5' })
  await scendiNelSotterraneo(page, TAPPA)
  await page.waitForSelector('.sot-velo-scontro [data-caselle-abilita]', { timeout: 10000 })
}
// scegliere un colpo e rispondere giusto: i mostri colpiscono, poi tocca a lui
async function rispondiGiusto() {
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 8000 })
  await toccaIl('[data-caselle-abilita] [data-azione="attacco"]')
  await page.waitForSelector('.sot-domanda .qz-tasto', { timeout: 8000 })
  await attendi(page, 500)
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
  await page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })
  await finito()
}

/* ---------- 1. lo stop, e «bevi» ---------- */
await entra()
const vita0 = await numeroDel('vita')
uguale('e due pozioni sulla casella', await pozioni(), 2)
{
  // il tocco cieco per primo: appena il racconto finisce la scelta si rimonta e per 320 ms non sente il tocco. Si aspetta quel
  // momento nella pagina stessa (un fotogramma alla volta) e si tocca subito: letti in due passi, la finestra si chiuderebbe in mezzo
  const cieco = await page.evaluate(() => new Promise(fine => {
    const t0 = performance.now()
    const guarda = () => {
      const b = document.querySelector('[data-caselle-abilita]:not([data-ferma]):not([data-pronto]) [data-azione="bevi-scontro"]')
      if (b) { b.click(); fine(true) } else if (performance.now() - t0 > 15000) fine(false)
      else requestAnimationFrame(guarda)
    }
    guarda()
  }))
  controlla('si vede la finestra cieca, dopo il racconto', cieco)
  await attendi(page, 80)
  uguale('un tocco subito non sceglie niente', await stop().count(), 1)
  uguale('né beve', await pozioni(), 2)
  uguale('lo stop scatta già al primo turno, con la ragione «duro»', await stop().getAttribute('data-perche'), 'duro')
  uguale('al posto della domanda', await page.locator('.sot-domanda').count(), 0)
  uguale('nella stessa scelta di sempre, con bere e scappare', await page.locator('[data-caselle-abilita] [data-azione="attacco"], [data-caselle-abilita] [data-azione="bevi-scontro"], [data-caselle-abilita] [data-azione="scappa"]').evaluateAll(es => es.map(e => e.dataset.azione).join()),
         'attacco,bevi-scontro,scappa')
  controlla('l\'avviso è generico, senza nome di mostro', /Attenzione/.test(await stop().innerText()))
  controlla('e dice i colpi che arrivano, tutti insieme', /ti toglie \d+/.test(await stop().innerText()), await stop().innerText())
  controlla('lo scontro è ancora lì, modale', await page.locator('.sot-velo-scontro').count() === 1)
  uguale('con i mostri in vista', await page.locator('[data-mostro]').count(), 5)
  await scatto(page, 'pericolo')
}
await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 3000 })
await scatto(page, 'pericolo-pronto')

// continuo: si torna a domandare
{
  const vita1 = await numeroDel('vita')
  uguale('prima di scegliere la vita è quella dell\'inizio', vita1, vita0)
  await toccaIl('[data-caselle-abilita] [data-azione="attacco"]')
  await page.waitForSelector('.sot-velo-scontro .sot-domanda', { timeout: 5000 })
  uguale('«continuo» toglie lo stop', await stop().count(), 0)
  uguale('e non costa vita', await numeroDel('vita'), vita1)
  await attendi(page, 500)
  await page.locator('.sot-domanda .qz-tasto[data-giusta]').first().click()
  // il turno si racconta; poi la scelta torna, e a un colpo dal cadere c'è il secondo stop (mai un terzo)
  await page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })
  uguale('a racconto in corso lo stop non c\'è ancora', await stop().count(), 0)
  await finito()
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 8000 })
  controlla('i mostri hanno colpito', (await numeroDel('vita')) < vita1, `${vita1} → ${await numeroDel('vita')}`)
  uguale('un colpo pieno e cade: secondo stop «ultimo»', await stop().getAttribute('data-perche'), 'ultimo')
}

// bevi: la vita sale, una pozione in meno, costa il turno (i mostri colpiscono), si riprende
{
  const v = await numeroDel('vita'), n = await pozioni()
  await toccaIl('[data-azione="bevi-scontro"]')
  await page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })
  await finito()
  await page.waitForSelector('[data-caselle-abilita]', { timeout: 5000 })
  await attendi(page, 300)
  uguale('«bevi» consuma una pozione', await pozioni(), n - 1)
  controlla('lo stop è passato (due al più per scontro)', (await stop().count()) === 0)
  uguale('e la battaglia riprende: lo scontro è aperto con la sua scelta', await page.locator('.sot-velo-scontro [data-caselle-abilita]').count(), 1)
  nota(`vita ${v} → ${await numeroDel('vita')} (bevuta e subito i colpi)`)
  await scatto(page, 'pericolo-bevuto')
}

/* ---------- 2. «scappo via» dallo stop ---------- */
await entra()
await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 3000 })
uguale('lo stop è lì', await stop().count(), 1)
{
  const v = await numeroDel('vita')
  const costo = Number(((await page.locator('[data-azione="scappa"] small').innerText()).match(/\d+/) || [0])[0])
  await toccaIl('[data-azione="scappa"]')
  await page.waitForSelector('.sot-velo-scontro', { state: 'detached', timeout: 5000 })
  uguale('scappando lo scontro si chiude', await page.locator('[data-ringhio], .sot-velo-scontro').count(), 0)
  uguale('col costo fisso detto sul tasto', await numeroDel('vita'), v - costo)
  uguale('le pozioni non si toccano', await pozioni(), 2)
}

uguale('nessun errore in pagina', errori.length, 0)
if (errori.length) console.log(errori)
await browser.close()
riassunto('lo stop dello scontro, col dito')
