/* ═══════════════════════════════════════════════════════════════════
   LE MISSIONI, COL DITO VERO

   Chi sta sulla terra di sopra dà missioni legate a una discesa, e formano
   un albero (docs/sotterraneo/missioni.md). Qui il giro intero di chi ne
   prende più d'una: sul villaggio due «!» (la ragazza e la guardia) e un «?»
   (il mugnaio, a cui Rosicchione è già stato battuto); si prendono le due
   missioni, e con quella da consegnare sono tre, il tetto: il diario
   (il tasto accanto alla carta dell'eroe) le mostra, e dice che altre
   aspettano; si scende nella torre e in cima c'è il promemoria di ognuna;
   si risale, si consegna Rosicchione e si ricevono le monete (e il
   gioiello); consegnata una, arriva la successiva con il «!» sull'eremita.

   I tocchi sono tocchi (`Input.dispatchTouchEvent` via CDP). Il piano di
   sotto non si gioca: il promemoria si legge appena si arriva, e si risale
   dalla freccia indietro (la discesa resta a metà, col portale).
   `node test/esegui.mjs sotterraneo-missioni`
   tempo: 240
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, leggiProfilo, scendiNelSotterraneo,
         camminaVerso } from '../aiuto/browser.mjs'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { PERSONAGGI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { missioneDi } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'

const DISCESA = CAMPAGNA.findIndex(t => t.chiave === 'torre')
const roba = robaAttesa('cavaliere', DISCESA, { gemme: 5 })
const ROSICCHIONE = missioneDi('rosicchione'), GOBLIN = missioneDi('goblin'), CHIAVI = missioneDi('chiavi')

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)
const ragazza = PERSONAGGI.ragazza
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: DISCESA, libera: false, stelle: { 0: 3, 1: 3 },
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: DISCESA, libera: false, stelle: { 0: 3, 1: 3 },
      // la collana è consegnata, Rosicchione battuto e da riportare, la Badessa mai presa
      missioni: { collana: 'consegnata', rosicchione: 'fatta' }, roba,
      terra: { nebbia: 'f'.repeat(768), dove: ragazza.accanto, parlato: true } } } } },
  },
})
await scegli(page, 'sotterraneo')
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 600)

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
const avventura = async () => (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere || {}
const segni = () => page.locator('[data-personaggio][data-segno]').evaluateAll(
  els => els.map(e => e.dataset.personaggio + e.dataset.segno).sort().join(','))

/* ---------- 1. il villaggio: due «!» e un «?» ---------- */
uguale('sul villaggio: la guardia e la ragazza hanno un favore, il mugnaio aspetta Rosicchione', await segni(), 'guardia!,mugnaio?,ragazza!')
uguale('l\'eremita no: la sua Badessa aspetta che si liberi un posto (il tetto è tre)', await page.locator('[data-personaggio="eremita"]').getAttribute('data-segno'), null)
uguale('il tasto del diario conta le aperte: una in mano e due offerte', await page.locator('[data-diario-n]').innerText(), '3')
await scatto(page, 'missioni-villaggio')

/* ---------- 2. si prendono due missioni ---------- */
await toccaIl('[data-personaggio="ragazza"]')
await page.waitForSelector(`[data-fumetto-di="ragazza"] [data-missione="goblin"][data-fase="offre"]`, { timeout: 8000 })
const chiede = await page.locator('[data-fumetto]').innerText()
controlla('il fumetto dice cosa, dove, il premio e le monete', chiede.includes('Grattanaso') && chiede.includes(CAMPAGNA[DISCESA].nome) &&
          chiede.includes('piano 1') && chiede.includes(`💎 ${GOBLIN.premio.gemme}`) && chiede.includes(`🪙 ${GOBLIN.premio.monete}`), chiede)
await toccaIl('[data-fumetto-di="ragazza"] [data-azione="prendi-missione"]')
await attendi(page, 500)
uguale('presa, il fumetto la ricorda', await page.locator('[data-fumetto-di="ragazza"] [data-missione="goblin"][data-fase="aspetta"]').count(), 1)
uguale('nell\'avventura il goblin è preso', (await avventura()).missioni?.goblin, 'presa')
uguale('la ragazza adesso ha il punto di domanda', await page.locator('[data-personaggio="ragazza"]').getAttribute('data-segno'), '?')

await camminaVerso(page, PERSONAGGI.guardia.accanto, { tocca })
await scatto(page, 'missioni-villaggio-guardia')
await toccaIl('[data-personaggio="guardia"]')
await page.waitForSelector(`[data-fumetto-di="guardia"] [data-missione="chiavi"][data-fase="offre"]`, { timeout: 8000 })
await toccaIl('[data-fumetto-di="guardia"] [data-azione="prendi-missione"]')
await attendi(page, 500)
const dopoDue = (await avventura()).missioni
uguale('e la guardia le sue chiavi: la prima non ha fermato la seconda', dopoDue?.chiavi, 'presa')
uguale('tutte insieme: Rosicchione fatta, il goblin e le chiavi prese', JSON.stringify(Object.entries(dopoDue).sort()),
       JSON.stringify([['chiavi', 'presa'], ['collana', 'consegnata'], ['goblin', 'presa'], ['rosicchione', 'fatta']]))
uguale('adesso tre punti di domanda e nessun «!»', await segni(), 'guardia?,mugnaio?,ragazza?')

/* ---------- 3. il diario ---------- */
await toccaIl('[data-azione="diario"]')
await page.waitForSelector('[data-diario]', { timeout: 5000 })
await attendi(page, 300)
const righe = await page.locator('[data-diario] [data-sezione="da-fare"] li').evaluateAll(
  els => els.map(e => ({ id: e.dataset.missione, stato: e.dataset.stato, testo: e.innerText, ritaglio: !!e.querySelector('[data-ritaglio]') })))
stessaLista('il diario le ha tutte e tre, nell\'ordine della storia', righe.map(r => r.id), ['goblin', 'rosicchione', 'chiavi'])
const ros = righe.find(r => r.id === 'rosicchione'), gob = righe.find(r => r.id === 'goblin')
controlla('Rosicchione è fatta: torna dal mugnaio', ros.stato === 'fatta' && ros.testo.includes('fatta: torna dal mugnaio'), ros.testo)
controlla('il goblin è da fare, con la discesa, il piano e chi lo vuole', gob.stato === 'presa' && gob.testo.includes('da fare') &&
          gob.testo.includes('La torre in rovina, piano 1') && gob.testo.toLowerCase().includes('ragazza del pozzo'), gob.testo)
controlla('ogni riga ha l\'icona ritagliata della discesa', righe.every(r => r.ritaglio))
controlla('il premio è nella riga', ros.testo.includes('Amuleto azzurro') && ros.testo.includes(`🪙 ${ROSICCHIONE.premio.monete}`) && gob.testo.includes(`🪙 ${GOBLIN.premio.monete}`))
controlla('tre in mano, e il diario dice perché non ne arrivano altre', (await page.locator('[data-diario-tetto]').innerText()).includes('3 missioni'))
await scatto(page, 'missioni-diario')
await toccaIl('[data-diario] [data-chiudi]')
await attendi(page, 300)
uguale('si chiude con la ✕', await page.locator('[data-diario]').count(), 0)

/* ---------- 4. giù, il promemoria ---------- */
await scendiNelSotterraneo(page, DISCESA, { scendi: false })
const qui = await page.locator('[data-fumetto] [data-missioni-qui]').innerText()
controlla('prima di scendere il fumetto della torre ricorda le due prese (non quella già fatta)',
          qui.includes('Grattanaso') && qui.includes('piano 1') && qui.includes('chiavi') && qui.includes('piano 3') && !qui.includes('Rosicchione'), qui)
await page.locator('[data-fumetto] [data-azione="scendi"]').click()
await page.waitForSelector('.sot-tela', { timeout: 5000 })
await attendi(page, 900)
const promemoria = await page.locator('[data-promemoria] li').evaluateAll(els => els.map(e => ({ id: e.dataset.missione, dove: e.dataset.dove, testo: e.innerText })))
stessaLista('in cima, una riga per missione, nell\'ordine della storia', promemoria.map(r => r.id), ['goblin', 'rosicchione', 'chiavi'])
controlla('il goblin è su questo piano, e dice cosa cercare', promemoria[0].dove === 'qui' && /Grattanaso.*cerca il mostro con la corona/.test(promemoria[0].testo), promemoria[0].testo)
controlla('Rosicchione è fatto: si ricorda a chi riportarlo', promemoria[1].dove === 'fatta' && /torna dal mugnaio/.test(promemoria[1].testo), promemoria[1].testo)
controlla('le chiavi sono più giù, al terzo piano', promemoria[2].dove === 'sopra' && /il mazzo di chiavi della torre è al terzo piano/.test(promemoria[2].testo), promemoria[2].testo)
controlla('e la discesa è al primo piano', (await page.locator('.sot-piede').textContent()).includes('piano 1'))
await scatto(page, 'missioni-promemoria')

/* ---------- 5. su, e si consegna: le monete ---------- */
await page.locator('button[aria-label="indietro"]').click()
await page.waitForSelector('[data-terra]', { timeout: 5000 })
await attendi(page, 700)
const monete = (await leggiProfilo(page)).coins
const gemmePrima = (await avventura()).roba?.gemme
await camminaVerso(page, PERSONAGGI.mugnaio.accanto, { tocca })
await toccaIl('[data-personaggio="mugnaio"]')
await page.waitForSelector('[data-fumetto-di="mugnaio"] [data-missione="rosicchione"][data-fase="consegna"]', { timeout: 8000 })
await attendi(page, 300)
await scatto(page, 'missioni-consegna')
await toccaIl('[data-fumetto-di="mugnaio"] [data-azione="consegna"]')
await attendi(page, 700)
const a = await avventura()
uguale('consegnata', a.missioni?.rosicchione, 'consegnata')
controlla('il gioiello va addosso o in tasca', a.roba?.dito === 'amuleto-azzurro' || (a.roba?.zaino || []).includes('amuleto-azzurro'), JSON.stringify(a.roba))
uguale('le gemme non cambiano (il premio è il gioiello)', a.roba?.gemme, gemmePrima)
uguale('le monete: il regalo, le domande in più', (await leggiProfilo(page)).coins, monete + ROSICCHIONE.premio.monete)
controlla('e il gioco lo dice', (await page.locator('[data-avviso-terra]').innerText()).includes(`🪙 ${ROSICCHIONE.premio.monete}`))
uguale('consegnata una, si libera un posto: la Badessa ha il suo «!»', await segni(), 'eremita!,guardia?,ragazza?')
uguale('il diario conta di nuovo le aperte: due in mano e una offerta', await page.locator('[data-diario-n]').innerText(), '3')
await scatto(page, 'missioni-fatta')

uguale('nessun errore in console', errori.join(' · '), '')
nota(`le monete di Rosicchione: ${ROSICCHIONE.premio.monete}, del goblin ${GOBLIN.premio.monete}, delle chiavi ${CHIAVI.premio.gemme} gemme`)
await browser.close()
riassunto('le missioni col dito')
