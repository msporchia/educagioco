/* ═══════════════════════════════════════════════════════════════════
   LA BACHECA DEL MONDO DI SOPRA, COL DITO — docs/sotterraneo/mondo-aperto-quest.md («Le taglie»),
   mondo-3d-la-meta.md

   perché: la bacheca di sopra col dito: prendere la taglia, consegnare e ricevere le gemme, il diario, «segui questa», la X da scavare con la domanda
   a parte perché: seminato alla prima partita con tre taglie in mano; sotterraneo-sopra-missioni parte dal cavaliere davanti alla torre con le missioni vere, e le taglie in mano gli cambierebbero il diario, il tetto delle tre e la meta: la sua semina non le regge

   Nel Sotterraneo 3D la bacheca di ogni città appende tre fogli per giro: si prende una taglia, si fa, si consegna e
   si riceve la ricompensa in gemme (niente monete, niente esperienza). Qui, con tre taglie in mano (una fatta, una mappa
   da scavare, uno da cercare): la bacheca col «?» d'oro, il fumetto con le sue righe e il tetto delle tre, la consegna e
   le gemme, un foglio nuovo che si prende, il diario che le mostra e «segui questa» (la carta della meta passa alla
   taglia, la freccia sul bordo, il cerchio nella veduta), chi si era perso (si parla, la taglia è fatta), la X della
   mappa (si scava con una domanda), e il giro del mondo, che conta un ritorno in città solo se
   prima ci si è allontanati. Quale meta vince (la storia di difetto, poi la scelta) è unita/sotterraneo-meta-sopra.
   Si tocca come un telefono (`Input.dispatchTouchEvent`).
   Nei test: `[data-bacheca]` (e `data-segno`), `[data-fumetto-di="bacheca"]`, `[data-taglia]` (`data-stato`),
   `[data-taglia-prendi]`, `[data-taglia-consegna]`, `[data-taglie-piene]`, `[data-viandante]`, `[data-scavo]`, `[data-scavo-domanda]`.
   `node test/esegui.mjs sotterraneo-sopra-bacheca`
   tempo: 200
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, scatto, attendi, leggiProfilo, ditoDi } from '../aiuto/browser.mjs'
import { domandaPronta } from '../aiuto/browser.mjs'
import { entraSopra, avventuraDi, vaiETocca, toccaFermo, veduta, nelDialogo } from '../aiuto/sotterraneo-sopra.mjs'
import { controlla, uguale, riassunto, blocco } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { rifaDaId } from '../../src/giochi/sotterraneo/dati/missioni-modelli.js'
import { missioneDi } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { ilMondo, terraDelMondo, lontanoDalleCitta, MARGINE_DEL_GIRO } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'

const FATTA = 't:villaggio:esplora-regione:lago:0'         // da consegnare qui
const MAPPA = 't:villaggio:mappa:mulino:0'                  // si scava
const CERCA = 't:villaggio:trova-chi:campi:0'               // si parla
const premio = id => rifaDaId(id).premio.gemme

const m = ilMondo()
const terra = terraDelMondo(m)
const villaggio = m.citta.find(c => c.chiave === 'villaggio')

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const { tocca } = await ditoDi(page)
const toccaIl = sel => toccaFermo(page, sel, tocca)
const avventura = () => avventuraDi(page)
const stati = async () => (await avventura()).mondo?.quest?.stati || {}
const meta = () => page.locator('[data-meta-carta]').getAttribute('data-meta')
const allaBacheca = () => vaiETocca(page, '[data-bacheca="villaggio"]', 'bacheca:villaggio', tocca, { atteso: '[data-fumetto-di="bacheca"] [data-taglia]' })
const chiudiFumetto = async () => {
  await page.evaluate(() => document.querySelector('[data-mondo3d]').click())
  await page.waitForSelector('[data-fumetto-di]', { state: 'detached', timeout: 3000 }).catch(() => {})
}

await entraSopra(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {},
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 0, libera: false, stelle: {},
      // tre taglie in mano: una fatta da consegnare, una mappa da scavare, uno da cercare (il tetto)
      missioni: {}, mondo: { giro: 0, parlato: true, quest: { stati: { [FATTA]: 'fatta', [MAPPA]: 'presa', [CERCA]: 'presa' }, fatte: 0 } } } } } } },
})

/* ---------- 1. la bacheca ha il «?» d'oro, e il fumetto le sue righe ---------- */
await blocco('la bacheca e il fumetto', async () => {
  uguale('con tre taglie in mano e niente scelto, la meta è la storia', await meta(), 'altare')
  await page.evaluate(() => window.__mondo3d.vai('bacheca:villaggio'))
  await page.waitForSelector('[data-bacheca="villaggio"][data-segno]', { state: 'attached', timeout: 10000 }).catch(() => {})
  uguale('la bacheca del villaggio ha il «?» d\'oro: c\'è una taglia da consegnare', await page.locator('[data-bacheca="villaggio"]').getAttribute('data-segno'), 'consegna')
  await allaBacheca()
  const righe = await page.locator('[data-fumetto-di="bacheca"] [data-taglia]').evaluateAll(els => els.map(e => ({ id: e.dataset.taglia, stato: e.dataset.stato, testo: e.innerText })))
  uguale('sei righe: tre in mano e tre fogli nuovi', righe.length, 6)
  uguale('prima quella da consegnare', righe[0]?.id, FATTA)
  uguale('…fatta', righe[0]?.stato, 'fatta')
  uguale('poi le due in corso', righe.filter(r => r.stato === 'presa').map(r => r.id).sort().join(), [MAPPA, CERCA].sort().join())
  uguale('e tre fogli nuovi', righe.filter(r => r.stato === 'offerta').length, 3)
  controlla('la riga dice le gemme', (righe[0]?.testo || '').includes(`💎 ${premio(FATTA)}`), righe[0]?.testo)
  uguale('con tre in mano i fogli nuovi non si prendono', await page.locator('[data-taglia-prendi]').count(), 0)
  uguale('e il fumetto lo dice una volta', await page.locator('[data-taglie-piene]').count(), 1)
  uguale('la riga da consegnare ha il suo tasto', await page.locator(`[data-taglia-consegna="${FATTA}"]`).count(), 1)
  await scatto(page, 'sotterraneo-bacheca-fumetto')
})

/* ---------- 2. si consegna: le gemme, niente monete, e il tetto si libera ---------- */
await blocco('la consegna', async () => {
  const prima = (await avventura()).roba?.gemme || 0
  const monete = (await leggiProfilo(page))?.coins
  await toccaIl(`[data-taglia-consegna="${FATTA}"]`)
  await page.waitForSelector('[data-avviso-terra]', { timeout: 5000 })
  controlla('l\'avviso dice le gemme', (await page.locator('[data-avviso-terra]').innerText()).includes(`💎 ${premio(FATTA)}`), await page.locator('[data-avviso-terra]').innerText())
  const via = await page.waitForSelector(`[data-taglia="${FATTA}"]`, { state: 'detached', timeout: 3000 }).then(() => true, () => false)
  controlla('la riga se ne va', via)
  const a = await avventura()
  uguale('le gemme sono sulla roba', (a.roba?.gemme || 0) - prima, premio(FATTA))
  uguale('la taglia è consegnata', a.mondo?.quest?.stati?.[FATTA], 'consegnata')
  uguale('e conta', a.mondo?.quest?.fatte, 1)
  uguale('niente monete', (await leggiProfilo(page))?.coins, monete)
})

/* ---------- 3. due in mano: un foglio nuovo si prende ---------- */
await blocco('un foglio nuovo', async () => {
  const nuovo = await page.locator('[data-taglia-prendi]').first().getAttribute('data-taglia-prendi')
  await toccaIl('[data-taglia-prendi]')
  await page.waitForSelector(`[data-taglia="${nuovo}"] [data-taglia-in-corso]`, { timeout: 3000 }).catch(() => {})
  uguale('la taglia nuova è in mano', (await stati())[nuovo], 'presa')
  uguale('e la riga dice «in corso»', await page.locator(`[data-taglia="${nuovo}"] [data-taglia-in-corso]`).count(), 1)
  uguale('di nuovo tre in mano: gli altri fogli aspettano', await page.locator('[data-taglia-prendi]').count(), 0)
  await scatto(page, 'sotterraneo-bacheca-in-mano')
})

/* ---------- 4. il diario le mostra; «segui questa» porta la meta, la freccia e il cerchio sulla taglia ---------- */
await blocco('il diario e «segui questa»', async () => {
  await chiudiFumetto()
  await toccaIl('[data-azione="vita"]')
  await toccaIl('[data-scheda="missioni"]')
  await page.waitForSelector('[data-diario]', { timeout: 5000 })
  const ids = await page.locator('[data-diario] [data-sezione="da-fare"] li').evaluateAll(els => els.map(e => e.dataset.missione))
  controlla('il diario ha le tre taglie in mano', ids.includes(MAPPA) && ids.includes(CERCA) && ids.length === 3, ids.join())
  await toccaIl(`[data-diario] [data-missione="${MAPPA}"]`)
  await page.waitForSelector('[data-dettaglio]', { timeout: 3000 })
  const d = await page.locator('[data-dettaglio]').innerText()
  controlla('il dettaglio dice la bacheca, il posto e la ricompensa', /bacheca/i.test(d) && /bosco|mulino/i.test(d) && d.includes(`💎 ${premio(MAPPA)}`), d)
  uguale('e c\'è «segui questa»', await page.locator('[data-dettaglio] [data-azione="segui"]').count(), 1)
  await scatto(page, 'sotterraneo-bacheca-diario')
  await toccaIl('[data-dettaglio] [data-azione="segui"]')
  await page.waitForSelector('[data-dettaglio] [data-azione="segui"][data-segui-attivo="1"]', { timeout: 3000 }).catch(() => {})
  uguale('si segue', (await avventura()).segui, MAPPA)
  await toccaIl('[data-diario] [data-chiudi]')
  await page.waitForSelector('[data-diario]', { state: 'detached', timeout: 5000 })
  const freccia = await page.waitForSelector(`[data-meta-fuori="taglia:${MAPPA}"]`, { timeout: 5000 }).then(() => true, () => false)
  controlla('la freccia azzurra della taglia sta sul bordo', freccia)
  uguale('«segui questa» sulla taglia: la meta è il suo posto', await meta(), `taglia:${MAPPA}`)
  uguale('col suo nome', await page.locator('[data-meta-carta] [data-meta-nome]').innerText(), missioneDi(MAPPA).titolo)
  await scatto(page, 'sotterraneo-bacheca-freccia')
  await veduta(page, true)
  uguale('nella veduta il cerchio sul posto', await page.locator(`[data-nome-posto="taglia:${MAPPA}"]`).count(), 1)
  uguale('e la bacheca del villaggio col suo segno', await page.locator('[data-nome-posto="bacheca:bacheca:villaggio"]').innerText(), '📜 ?')
  await scatto(page, 'sotterraneo-bacheca-veduta')
  await veduta(page, false)
})

/* ---------- 5. chi si era perso: si parla, e la taglia è fatta ---------- */
await blocco('il viandante', async () => {
  await page.evaluate(id => window.__mondo3d.vai(id), `viandante::${CERCA}`)
  uguale('il viandante c\'è sul prato', await page.locator(`[data-viandante="${CERCA}"]`).count(), 1)
  await vaiETocca(page, `[data-viandante="${CERCA}"]`, `viandante::${CERCA}`, tocca)
  await scatto(page, 'sotterraneo-bacheca-viandante')
  await nelDialogo(page, '[data-scelta="ciao"]')
  const via = await page.waitForSelector(`[data-viandante="${CERCA}"]`, { state: 'detached', timeout: 5000 }).then(() => true, () => false)
  uguale('parlargli fa la taglia', (await stati())[CERCA], 'fatta')
  controlla('e sparisce dal prato', via)
})

/* ---------- 6. la X: si scava con una domanda ----------
   Sbagliando si riprova e non si perde niente: la X risponde con la stessa domanda e la stessa funzione della pietra
   (`rispostoPietra` in viste/Mondo3d.vue), e lo sbaglio, coi suoi secondi di lettura, lo prova la pietra in sotterraneo-sopra-mondo */
await blocco('la X della mappa', async () => {
  await page.evaluate(id => window.__mondo3d.vai(id), `scavo:${MAPPA}`)
  uguale('la X c\'è sul prato', await page.locator(`[data-scavo="${MAPPA}"]`).count(), 1)
  await vaiETocca(page, `[data-scavo="${MAPPA}"]`, `scavo:${MAPPA}`, tocca, { atteso: '[data-fumetto-di="scavo"] [data-azione="scava"]' })
  await scatto(page, 'sotterraneo-bacheca-scavo')
  uguale('toccare la X non la scava ancora', (await stati())[MAPPA], 'presa')
  await toccaIl('[data-fumetto-di="scavo"] [data-azione="scava"]')
  await page.waitForSelector('[data-scavo-domanda] .qz-tasto', { timeout: 30000 })
  await domandaPronta(page)   // i 320 ms ciechi della domanda appena nata
  await page.locator('[data-scavo-domanda] .qz-tasto[data-giusta]').first().click()
  await page.waitForSelector('[data-scavo-domanda]', { state: 'detached', timeout: 40000 })
  uguale('rispondendo giusto la X è scavata', (await stati())[MAPPA], 'fatta')
})

/* ---------- 7. le due fatte si consegnano alla bacheca ---------- */
await blocco('le due consegne', async () => {
  await page.evaluate(() => window.__mondo3d.vai('bacheca:villaggio'))
  await page.waitForSelector('[data-bacheca="villaggio"][data-segno="consegna"]', { state: 'attached', timeout: 5000 }).catch(() => {})
  uguale('la bacheca ha di nuovo il «?» d\'oro', await page.locator('[data-bacheca="villaggio"]').getAttribute('data-segno'), 'consegna')
  await allaBacheca()
  const prima = (await avventura()).roba?.gemme || 0
  await toccaIl(`[data-taglia-consegna="${MAPPA}"]`)
  await page.waitForSelector(`[data-taglia="${MAPPA}"]`, { state: 'detached', timeout: 5000 })
  await toccaIl(`[data-taglia-consegna="${CERCA}"]`)   // il fumetto si rimette a posto: si tocca quando sta fermo
  await page.waitForSelector(`[data-taglia="${CERCA}"]`, { state: 'detached', timeout: 5000 })
  const a = await avventura()
  uguale('tutte e due consegnate', [a.mondo?.quest?.stati?.[MAPPA], a.mondo?.quest?.stati?.[CERCA]].join(), 'consegnata,consegnata')
  uguale('le gemme sono la somma', (a.roba?.gemme || 0) - prima, premio(MAPPA) + premio(CERCA))
  uguale('tre consegne in tutto', a.mondo?.quest?.fatte, 3)
  await scatto(page, 'sotterraneo-bacheca-consegnate')
  await chiudiFumetto()
})

/* ---------- 8. il giro: conta un ritorno in città solo se prima ci si è allontanati ---------- */
await blocco('il giro del mondo', async () => {
  const giro = () => page.evaluate(() => window.__mondo3d.giro())
  const salvato = async () => (await avventura()).mondo?.giro
  const cella = (x, y, r = 6) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (terra.passa(x + dx, y + dy)) return { x: x + dx, y: y + dy }; return null }
  // l'eroe portato lì: si aspetta che la scena l'abbia visto arrivare nella cella (è lì che conta le città), e un paio di fotogrammi
  const vaiA = async c => {
    await page.evaluate(([x, z]) => window.__mondo3d.porta(x + 0.5, z + 0.5), [c.x, c.y])
    await page.waitForFunction(k => document.querySelector('[data-eroe-mondo]')?.dataset.cella === k, `${c.x},${c.y}`, { timeout: 5000 })
    await page.evaluate(() => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(ok)))))
  }
  const piazza = { x: villaggio.partenza.x, y: villaggio.partenza.y }
  const g0 = await giro()
  // fuori dalla zona della piazza, ma a meno di raggio + 8 dal centro: passare il confine non vale (la regola: unita/sotterraneo-quest-modelli)
  const bordo = cella(villaggio.centro.x + villaggio.raggio + 3, villaggio.centro.y)
  controlla('un posto appena fuori dal confine, non lontano', !!bordo && !lontanoDalleCitta(m, bordo.x, bordo.y))
  await vaiA(bordo); await vaiA(piazza); await vaiA(bordo); await vaiA(piazza)
  uguale('entrare e uscire dal confine non fa girare il mondo', await giro(), g0)
  const lontano = m.posti.find(p => p.tipo === 'ingresso' && p.chiave === 'altare').accanto
  controlla(`davanti alla cripta si è a più di raggio + ${MARGINE_DEL_GIRO} celle`, lontanoDalleCitta(m, lontano.x, lontano.y))
  await vaiA(lontano)
  await vaiA(piazza)
  uguale('allontanati e tornati: un giro', await giro(), g0 + 1)
  await vaiA({ x: piazza.x + 2, y: piazza.y }); await vaiA(piazza)
  uguale('girare in piazza non lo fa girare ancora', await giro(), g0 + 1)
  // si salva dopo qualche secondo di gioco (il tempo della scena)
  for (let n = 0; n < 100 && (await salvato()) !== g0 + 1; n++) await attendi(page, 300)
  uguale('il giro si salva', await salvato(), g0 + 1)
  await allaBacheca()
  const nuovi = await page.locator('[data-fumetto-di="bacheca"] [data-taglia][data-stato="offerta"]').evaluateAll(els => els.map(e => e.dataset.taglia))
  controlla('il giro nuovo ha fogli nuovi', nuovi.length === 3 && nuovi.every(id => id.endsWith(`:${g0 + 1}`)), nuovi.join())
  await scatto(page, 'sotterraneo-bacheca-giro-nuovo')
})

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('la bacheca del mondo di sopra')
