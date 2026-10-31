/* ═══════════════════════════════════════════════════════════════════
   LO STOP DELLO SCONTRO, COL DITO VERO

   Quando l'eroe rischia di cadere (docs/sotterraneo/pericolo.md) lo
   scontro si ferma all'inizio del suo turno, prima della domanda: una riga
   rossa sopra la scelta di sempre (attacco, bevi, scappa). Lo stop conta la
   SOMMA dei colpi che arrivano prima del suo prossimo turno
   (docs/sotterraneo/scontro.md, «Lo stop del pericolo»), quindi qui, nella
   scalinata (un mago al livello 10 non è rosso: `coloreNellaStoria`) e con
   sei mostri leggendari addosso (`#sotterraneo=branco&mostri=6&grado=leggendario`, docs/core/comandi.md)
   e due pozioni in tasca:
   - lo stop scatta già al primo turno, al posto della domanda, con la
     ragione «duro»; per i primi 320 ms i tasti non sentono il tocco;
   - «continuo» (l'attacco) toglie lo stop e fa partire la domanda, senza
     costare vita; con una risposta giusta i mostri colpiscono e, a un colpo
     dal cadere, compare il secondo stop («ultimo»), mai di più;
   - «bevi» alza la vita e consuma una pozione, ma non costa il turno (i mostri
     non colpiscono): se la vita ora basta lo stop sparisce e si domanda, se
     no resta con «bevi» spento (una pozione per turno) e il turno dopo si
     può bere ancora;
   - in un altro scontro «scappo via» dallo stop esce, col suo costo fisso.
   Lo scontro è quello 3D: la scelta sta nel pannello in fondo (`[data-pannello3d]`), sopra c'è la scena con le scritte
   dei mostri (`[data-scontro-3d]`). Si entra dal cheat dell'indirizzo, che scende da sé (`#sotterraneo=1&…`).
   Si tocca come un bambino (`Input.dispatchTouchEvent` via CDP).
   `node test/esegui.mjs sotterraneo-pericolo`
   tempo: 200
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, finestraFerma }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { LIVELLI_ATTESI } from '../../src/giochi/sotterraneo/dati/storia.js'
import { forzaDi } from '../../src/giochi/sotterraneo/motore/forza.js'
import { coloreNellaStoria } from '../../src/giochi/sotterraneo/motore/zone.js'

const TAPPA = 1   // la scalinata
const EROE = 'mago'   // il più fragile: coi punti non dati, sei mostri pesano
const roba = { v: 1, gemme: 0, zaino: ['pozione-piccola', 'pozione-grande'], mano: null, mancina: null, corpo: null,
               dito: null, torcia: 0, torce: 0 }
// il mago di livello 9 senza punti in tempra ha 29 vita contro un giro di 22 (dal 30/10 i comuni della scalinata picchiano piano: sei e
// leggendari invece di cinque; e la pozione grande, perché la normale dopo un giro non basta più): lo stop «duro» (vita ≤ 2 giri) c'è, e dopo un giro
// (16 di vita persa) c'è quello «ultimo» (vita ≤ 1 giro). Con più vita il primo stop non scatta (a livello 10 con otto punti ne ha 76)
const crescita = { esp: sogliaDi(9), tempra: 0 }
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

// un mago nella scalinata, con sei mostri addosso e la prima scelta davanti
async function entra() {
  // l'indirizzo della prova di prima (`#sotterraneo=…`) aprirebbe il gioco al ricaricamento: si riparte dalla home
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search))
  await azzera(page)
  await page.setViewportSize({ width: 390, height: 844 })
  const avventura = { tappa: TAPPA, libera: false, stelle: { 0: 3 }, missioni: {}, roba, crescita, mondo: { parlato: true } }
  await semina(page, {
    coins: 300,
    campagne: { sotterraneo: { tappa: TAPPA, libera: false, stelle: { 0: 3 },
      cfg: { mondo: MONDO, eroe: EROE, avventure: { [EROE]: avventura } } } },
  })
  await page.evaluate(() => { location.hash = 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=6&grado=leggendario' })
  await page.waitForSelector('[data-pannello3d] [data-caselle-abilita]', { timeout: 40000 })
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
  controlla('lo scontro è ancora lì, col suo pannello', await page.locator('[data-scontro-3d]').count() === 1 && await page.locator('[data-pannello3d]').count() === 1)
  uguale('con i mostri in vista', await page.locator('[data-mostro]').count(), 6)
  await scatto(page, 'pericolo')
}
await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 3000 })
await scatto(page, 'pericolo-pronto')

// continuo: si torna a domandare
{
  const vita1 = await numeroDel('vita')
  uguale('prima di scegliere la vita è quella dell\'inizio', vita1, vita0)
  await toccaIl('[data-caselle-abilita] [data-azione="attacco"]')
  await page.waitForSelector('[data-pannello3d] .sot-domanda', { timeout: 5000 })
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

// bevi: la vita sale della cura e basta (nessun colpo), una pozione in meno, lo stop sparisce perché ora la vita basta; il turno è ancora suo
{
  const v = await numeroDel('vita'), n = await pozioni()
  await toccaIl('[data-azione="bevi-scontro"]')
  // con due stadi in tasca bere apre la scelta (viste/ScegliPozione.vue): nello scontro dice che poi tocca ancora a te
  await page.waitForSelector('[data-scegli-pozione][data-pronto]', { timeout: 3000 })
  controlla('la scelta dice che poi tocca ancora a te', /tocca ancora a te/.test(await page.locator('[data-scegli-pozione]').innerText()))
  // il numero che sale dura poco e un fotogramma in SwiftShader è lento: un osservatore dentro la pagina lo ricorda appena compare
  await page.evaluate(() => {
    window.__cure = []
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return
      for (const e of [n, ...n.querySelectorAll('*')]) if (e.classList && e.classList.contains('sot-numero-cura')) window.__cure.push(e.textContent.trim())
    }))).observe(document.body, { childList: true, subtree: true })
  })
  await toccaIl('[data-azione="bevi-questa"][data-cosa="pozione-grande"]')
  await page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })
  await scatto(page, 'pericolo-bevuto-racconto')
  await finito()
  uguale('il sorso si vede: il numero che sale', (await page.evaluate(() => window.__cure))[0], '+30')
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 5000 })
  uguale('«bevi» consuma una pozione', await pozioni(), n - 1)
  uguale('la vita è salita della cura, senza i colpi dei mostri', await numeroDel('vita'), v + 30)
  uguale('ora la vita basta: lo stop sparisce', await stop().count(), 0)
  uguale('e lo scontro è aperto con la sua scelta', await page.locator('[data-pannello3d] [data-caselle-abilita]').count(), 1)
  uguale('una pozione sola per turno: «bevi» è spento', await page.locator('[data-azione="bevi-scontro"]').isDisabled(), true)
  controlla('e dice perché', /una per turno/.test(await page.locator('[data-azione="bevi-scontro"]').innerText()))
  await scatto(page, 'pericolo-bevuto')
  // il turno è ancora suo: attacca, i mostri colpiscono, e al turno dopo si beve di nuovo
  await rispondiGiusto()
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 8000 })
  uguale('il turno dopo «bevi» è acceso', await page.locator('[data-azione="bevi-scontro"]').isDisabled(), false)
  nota(`vita ${v} → ${v + 30} bevendo → ${await numeroDel('vita')} dopo i colpi del turno`)
}

/* ---------- 1b. il sorso non basta: lo stop resta ---------- */
await entra()
await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
{
  const v = await numeroDel('vita'), n = await pozioni()
  uguale('lo stop è lì', await stop().getAttribute('data-perche'), 'duro')
  await toccaIl('[data-azione="bevi-scontro"]')
  await page.waitForSelector('[data-scegli-pozione][data-pronto]', { timeout: 3000 })
  await toccaIl('[data-azione="bevi-questa"][data-cosa="pozione-piccola"]')
  await page.waitForSelector('[data-duello][data-racconto]', { timeout: 8000 })
  await finito()
  await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 5000 })
  uguale('una pozione in meno', await pozioni(), n - 1)
  uguale('la vita è salita di 8, senza colpi', await numeroDel('vita'), v + 8)
  uguale('non basta ancora: lo stop resta', await stop().getAttribute('data-perche'), 'duro')
  controlla('e dice che hai bevuto e cosa puoi fare', /puoi scappare o continuare/.test(await page.locator('[data-ringhio-bevuto]').innerText()))
  uguale('«bevi» è spento', await page.locator('[data-azione="bevi-scontro"]').isDisabled(), true)
  uguale('«scappo via» c\'è ancora', await page.locator('[data-azione="scappa"]:not([disabled])').count(), 1)
  uguale('niente domanda', await page.locator('.sot-domanda').count(), 0)
  await scatto(page, 'pericolo-dopo-sorso')
  await toccaIl('[data-caselle-abilita] [data-azione="attacco"]')
  await page.waitForSelector('[data-pannello3d] .sot-domanda', { timeout: 5000 })
  uguale('«continuo» toglie lo stop', await stop().count(), 0)
}

/* ---------- 2. «scappo via» dallo stop ---------- */
await entra()
await page.waitForSelector('[data-caselle-abilita][data-pronto]', { timeout: 20000 })
uguale('lo stop è lì', await stop().count(), 1)
{
  const v = await numeroDel('vita')
  const costo = Number(((await page.locator('[data-azione="scappa"] small').innerText()).match(/\d+/) || [0])[0])
  // i mostri del cheat nascono dentro lo scontro e non hanno mai fatto un passo: il motore dà loro il posto al primo passo e lì azzera la
  // calma che la fuga appena data (muoviUnMostro, `fx == null`). In una discesa vera chi arriva allo scontro ha già camminato: gli si dà il posto
  await page.evaluate(() => { for (const m of window.__sotterraneo3d.corsa.livello.robe) if (m.che === 'mostro' && m.fx == null) { m.fx = m.x + 0.5; m.fy = m.y + 0.5; m.casa = { x: m.x, y: m.y }; m.calmo = 0 } })
  await toccaIl('[data-azione="scappa"]')
  await page.waitForSelector('[data-scontro-3d]', { state: 'detached', timeout: 15000 })
  uguale('scappando lo scontro si chiude', await page.locator('[data-ringhio], [data-scontro-3d]').count(), 0)
  // il numero del globo scende a poco a poco (in SwiftShader più piano): si legge quando si è fermato
  let ora = await numeroDel('vita')
  for (let i = 0; i < 20; i++) { await attendi(page, 500); const n = await numeroDel('vita'); if (n === ora) break; ora = n }
  uguale('col costo fisso detto sul tasto', ora, v - costo)
  uguale('le pozioni non si toccano', await pozioni(), 2)
}

uguale('nessun errore in pagina', errori.length, 0)
if (errori.length) console.log(errori)
await browser.close()
riassunto('lo stop dello scontro, col dito')
