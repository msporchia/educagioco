/* ═══════════════════════════════════════════════════════════════════
   LA BACHECA DEL MONDO DI SOPRA, COL DITO — docs/sotterraneo/mondo-aperto-quest.md («Le taglie»)

   Nel Sotterraneo 3D la bacheca di ogni città appende tre fogli per giro: si prende una taglia, si fa, si consegna e
   si riceve la ricompensa in gemme (niente monete, niente esperienza). Qui: la bacheca del villaggio col «?» d'oro
   (c'è una taglia da consegnare), il fumetto con le sue righe e il tetto delle tre in mano, la consegna e le gemme, un
   foglio nuovo che si prende, il diario che le mostra, chi si era perso (si parla, la taglia è fatta), la X della mappa
   (si scava con una domanda: sbagliata si riprova), e il giro del mondo, che conta un ritorno in città solo se prima ci si
   è allontanati. Si tocca come un telefono (`Input.dispatchTouchEvent`).
   Nei test: `[data-bacheca]` (e `data-segno`), `[data-fumetto-di="bacheca"]`, `[data-taglia]` (`data-stato`),
   `[data-taglia-prendi]`, `[data-taglia-consegna]`, `[data-taglie-piene]`, `[data-viandante]`, `[data-scavo]`, `[data-scavo-domanda]`.
   `node test/esegui.mjs sotterraneo-bacheca`
   tempo: 300
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, scatto, attendi, scegli, scegliAvventura, leggiProfilo, mondoPronto, fermoNelMondo, toccaNelMondo,
         nelDialogo } from '../aiuto/browser.mjs'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDO } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { rifaDaId } from '../../src/giochi/sotterraneo/dati/missioni-modelli.js'
import { ilMondo, terraDelMondo, aperturaDi, lontanoDalleCitta, MARGINE_DEL_GIRO } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'

const FATTA = 't:villaggio:esplora-regione:lago:0'         // da consegnare qui
const MAPPA = 't:villaggio:mappa:mulino:0'                  // si scava
const CERCA = 't:villaggio:trova-chi:campi:0'               // si parla
const premio = id => rifaDaId(id).premio.gemme

const m = ilMondo()
const terra = terraDelMondo(m, aperturaDi([]).aperto)
const villaggio = m.citta.find(c => c.chiave === 'villaggio')

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
const cdp = await page.context().newCDPSession(page)
async function tocca(x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await attendi(page, 60)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
// il fumetto si rimette a posto a ogni fotogramma (e sul computer di prova i fotogrammi sono lenti): si tocca quando il bersaglio sta fermo
const toccaIl = async sel => {
  await page.waitForSelector(sel, { timeout: 10000 })
  let b = null
  for (let n = 0; n < 40; n++) {
    const prima = await page.locator(sel).first().boundingBox()
    await attendi(page, 300)
    b = await page.locator(sel).first().boundingBox()
    if (prima && b && Math.abs(prima.x - b.x) < 1 && Math.abs(prima.y - b.y) < 1) break
  }
  await tocca(b.x + b.width / 2, b.y + b.height / 2)
}
const avventura = async () => (await leggiProfilo(page))?.campagne?.sotterraneo?.cfg?.avventure?.cavaliere || {}
const stati = async () => (await avventura()).mondo?.quest?.stati || {}
const alla = async () => {   // l'eroe davanti alla bacheca del villaggio, col fumetto aperto
  await page.evaluate(() => window.__mondo3d.vai('bacheca:villaggio'))
  await attendi(page, 1200)
  await toccaNelMondo(page, '[data-bacheca="villaggio"]', { tocca })
  await page.waitForSelector('[data-fumetto-di="bacheca"] [data-taglia]', { timeout: 30000 })
  await attendi(page, 300)
}
const chiudiFumetto = async () => { await page.evaluate(() => document.querySelector('[data-mondo3d]').click()); await attendi(page, 300) }

await azzera(page)
await semina(page, {
  coins: 300, settings: { sperimentali: true },
  campagne: { sotterraneo: { tappa: 0, libera: false, stelle: {},
    cfg: { mondo: MONDO, eroe: 'cavaliere', avventure: { cavaliere: { tappa: 0, libera: false, stelle: {},
      // tre taglie in mano: una fatta da consegnare, una mappa da scavare, uno da cercare (il tetto)
      missioni: {}, mondo: { giro: 0, parlato: true, quest: { stati: { [FATTA]: 'fatta', [MAPPA]: 'presa', [CERCA]: 'presa' }, fatte: 0 } } } } } } },
})
await scegli(page, 'sotterraneo3d')
await scegliAvventura(page, 'cavaliere')
await mondoPronto(page)
// la bacheca non è uno scontro: i mostri di sopra (la X sta vicino alla tana della regione) si tolgono, li prova integrazione/sotterraneo-mostri-sopra
await page.evaluate(() => window.__mondo3d.senzaMostri())
await attendi(page, 2000)

/* ---------- 1. la bacheca ha il «?» d'oro, e il fumetto le sue righe ---------- */
await page.evaluate(() => window.__mondo3d.vai('bacheca:villaggio'))
await attendi(page, 1500)
uguale('la bacheca del villaggio ha il «?» d\'oro: c\'è una taglia da consegnare', await page.locator('[data-bacheca="villaggio"]').getAttribute('data-segno'), 'consegna')
await alla()
{
  const righe = await page.locator('[data-fumetto-di="bacheca"] [data-taglia]').evaluateAll(els => els.map(e => ({ id: e.dataset.taglia, stato: e.dataset.stato, testo: e.innerText })))
  uguale('sei righe: tre in mano e tre fogli nuovi', righe.length, 6)
  uguale('prima quella da consegnare', righe[0].id, FATTA)
  uguale('…fatta', righe[0].stato, 'fatta')
  uguale('poi le due in corso', righe.filter(r => r.stato === 'presa').map(r => r.id).sort().join(), [MAPPA, CERCA].sort().join())
  uguale('e tre fogli nuovi', righe.filter(r => r.stato === 'offerta').length, 3)
  controlla('la riga dice le gemme', righe[0].testo.includes(`💎 ${premio(FATTA)}`), righe[0].testo)
  uguale('con tre in mano i fogli nuovi non si prendono', await page.locator('[data-taglia-prendi]').count(), 0)
  uguale('e il fumetto lo dice una volta', await page.locator('[data-taglie-piene]').count(), 1)
  uguale('la riga da consegnare ha il suo tasto', await page.locator(`[data-taglia-consegna="${FATTA}"]`).count(), 1)
  await scatto(page, 'sotterraneo-bacheca-fumetto')
}

/* ---------- 2. si consegna: le gemme, niente monete, e il tetto si libera ---------- */
{
  const prima = (await avventura()).roba?.gemme || 0
  const monete = (await leggiProfilo(page))?.coins
  await toccaIl(`[data-taglia-consegna="${FATTA}"]`)
  await page.waitForSelector('[data-avviso-terra]', { timeout: 5000 })
  controlla('l\'avviso dice le gemme', (await page.locator('[data-avviso-terra]').innerText()).includes(`💎 ${premio(FATTA)}`), await page.locator('[data-avviso-terra]').innerText())
  await attendi(page, 600)
  const a = await avventura()
  uguale('le gemme sono sulla roba', (a.roba?.gemme || 0) - prima, premio(FATTA))
  uguale('la taglia è consegnata', a.mondo.quest.stati[FATTA], 'consegnata')
  uguale('e conta', a.mondo.quest.fatte, 1)
  uguale('niente monete', (await leggiProfilo(page))?.coins, monete)
  uguale('la riga se ne va', await page.locator(`[data-taglia="${FATTA}"]`).count(), 1 && 0)
}

/* ---------- 3. due in mano: un foglio nuovo si prende ---------- */
{
  const nuovo = await page.locator('[data-taglia-prendi]').first().getAttribute('data-taglia-prendi')
  await toccaIl('[data-taglia-prendi]')
  await attendi(page, 600)
  uguale('la taglia nuova è in mano', (await stati())[nuovo], 'presa')
  uguale('e la riga dice «in corso»', await page.locator(`[data-taglia="${nuovo}"] [data-taglia-in-corso]`).count(), 1)
  uguale('di nuovo tre in mano: gli altri fogli aspettano', await page.locator('[data-taglia-prendi]').count(), 0)
  await scatto(page, 'sotterraneo-bacheca-in-mano')
}

/* ---------- 4. il diario le mostra ---------- */
{
  await chiudiFumetto()
  await toccaIl('[data-azione="vita"]')
  await toccaIl('[data-scheda="missioni"]')
  await page.waitForSelector('[data-diario]', { timeout: 5000 })
  await attendi(page, 300)
  const ids = await page.locator('[data-diario] [data-sezione="da-fare"] li').evaluateAll(els => els.map(e => e.dataset.missione))
  controlla('il diario ha le tre taglie in mano', ids.includes(MAPPA) && ids.includes(CERCA) && ids.length === 3, ids.join())
  await toccaIl(`[data-diario] [data-missione="${MAPPA}"]`)
  await page.waitForSelector('[data-dettaglio]', { timeout: 3000 })
  await attendi(page, 300)
  const d = await page.locator('[data-dettaglio]').innerText()
  controlla('il dettaglio dice la bacheca, il posto e la ricompensa', /bacheca/i.test(d) && /bosco|mulino/i.test(d) && d.includes(`💎 ${premio(MAPPA)}`), d)
  controlla('e c\'è «segui questa»', await page.locator('[data-dettaglio] [data-azione="segui"]').count() === 1)
  await scatto(page, 'sotterraneo-bacheca-diario')
  // «segui questa»: la freccia azzurra sul bordo, e nella veduta il cerchio sul posto (e le bacheche col loro segno)
  await toccaIl('[data-dettaglio] [data-azione="segui"]')
  await attendi(page, 300)
  uguale('si segue', (await avventura()).segui, MAPPA)
  await toccaIl('[data-diario] [data-chiudi]')
  await attendi(page, 1200)
  uguale('la freccia azzurra della taglia sta sul bordo', await page.locator(`[data-meta-fuori="taglia:${MAPPA}"]`).count(), 1)
  await scatto(page, 'sotterraneo-bacheca-freccia')
  await page.evaluate(() => document.querySelector('[data-casella-barra="mappa"]').click())
  await page.waitForSelector('[data-veduta]', { timeout: 5000 })
  await attendi(page, 2500)
  uguale('nella veduta il cerchio sul posto', await page.locator(`[data-nome-posto="taglia:${MAPPA}"]`).count(), 1)
  uguale('e la bacheca del villaggio col suo segno', await page.locator('[data-nome-posto="bacheca:bacheca:villaggio"]').innerText(), '📜 ?')
  await scatto(page, 'sotterraneo-bacheca-veduta')
  await page.evaluate(() => document.querySelector('[data-casella-barra="mappa"]').click())
  await attendi(page, 500)
}

/* ---------- 5. chi si era perso: si parla, e la taglia è fatta ---------- */
{
  await page.evaluate(id => window.__mondo3d.vai(id), `viandante::${CERCA}`)
  await attendi(page, 1500)
  uguale('il viandante c\'è sul prato', await page.locator(`[data-viandante="${CERCA}"]`).count(), 1)
  await toccaNelMondo(page, `[data-viandante="${CERCA}"]`, { tocca })
  await page.waitForSelector('[data-dialogo]', { timeout: 30000 })
  await scatto(page, 'sotterraneo-bacheca-viandante')
  await nelDialogo(page, '[data-scelta="ciao"]')
  await attendi(page, 600)
  uguale('parlargli fa la taglia', (await stati())[CERCA], 'fatta')
  await page.waitForSelector(`[data-viandante="${CERCA}"]`, { state: 'detached', timeout: 5000 }).catch(() => {})
  uguale('e sparisce dal prato', await page.locator(`[data-viandante="${CERCA}"]`).count(), 0)
}

/* ---------- 6. la X: si scava con una domanda (sbagliando si riprova) ---------- */
{
  await page.evaluate(id => window.__mondo3d.vai(id), `scavo:${MAPPA}`)
  await attendi(page, 1500)
  uguale('la X c\'è sul prato', await page.locator(`[data-scavo="${MAPPA}"]`).count(), 1)
  await toccaNelMondo(page, `[data-scavo="${MAPPA}"]`, { tocca })
  await page.waitForSelector('[data-fumetto-di="scavo"] [data-azione="scava"]', { timeout: 30000 })
  await scatto(page, 'sotterraneo-bacheca-scavo')
  await toccaIl('[data-fumetto-di="scavo"] [data-azione="scava"]')
  await page.waitForSelector('[data-scavo-domanda] .qz-tasto', { timeout: 30000 })
  await attendi(page, 500)
  await page.locator('[data-scavo-domanda] .qz-tasto:not([data-giusta])').first().click()
  await page.waitForSelector('[data-scavo-domanda]', { state: 'detached', timeout: 40000 })
  await attendi(page, 400)
  uguale('sbagliando non si trova niente, e niente si perde', (await stati())[MAPPA], 'presa')
  await toccaNelMondo(page, `[data-scavo="${MAPPA}"]`, { tocca })
  await toccaIl('[data-fumetto-di="scavo"] [data-azione="scava"]')
  await page.waitForSelector('[data-scavo-domanda] .qz-tasto', { timeout: 30000 })
  await attendi(page, 500)
  await page.locator('[data-scavo-domanda] .qz-tasto[data-giusta]').first().click()
  await page.waitForFunction(() => !document.querySelector('[data-scavo-domanda]'), null, { timeout: 40000 })
  await attendi(page, 600)
  uguale('rispondendo giusto la X è scavata', (await stati())[MAPPA], 'fatta')
}

/* ---------- 7. le due fatte si consegnano alla bacheca ---------- */
{
  await page.evaluate(() => window.__mondo3d.vai('bacheca:villaggio'))
  await attendi(page, 1200)
  uguale('la bacheca ha di nuovo il «?» d\'oro', await page.locator('[data-bacheca="villaggio"]').getAttribute('data-segno'), 'consegna')
  await toccaNelMondo(page, '[data-bacheca="villaggio"]', { tocca })
  await page.waitForSelector(`[data-taglia-consegna="${MAPPA}"]`, { timeout: 30000 })
  const prima = (await avventura()).roba?.gemme || 0
  await toccaIl(`[data-taglia-consegna="${MAPPA}"]`)
  await page.waitForSelector(`[data-taglia="${MAPPA}"]`, { state: 'detached', timeout: 5000 })
  await attendi(page, 800)   // il fumetto si rimette a posto
  await toccaIl(`[data-taglia-consegna="${CERCA}"]`)
  await page.waitForSelector(`[data-taglia="${CERCA}"]`, { state: 'detached', timeout: 5000 })
  await attendi(page, 600)
  const a = await avventura()
  uguale('tutte e due consegnate', [a.mondo.quest.stati[MAPPA], a.mondo.quest.stati[CERCA]].join(), 'consegnata,consegnata')
  uguale('le gemme sono la somma', (a.roba?.gemme || 0) - prima, premio(MAPPA) + premio(CERCA))
  uguale('tre consegne in tutto', a.mondo.quest.fatte, 3)
  await scatto(page, 'sotterraneo-bacheca-consegnate')
  await chiudiFumetto()
}

/* ---------- 8. il giro: conta un ritorno in città solo se prima ci si è allontanati ---------- */
{
  const giro = () => page.evaluate(() => window.__mondo3d.giro())
  const salvato = async () => (await avventura()).mondo?.giro
  const cella = (x, y, r = 6) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (terra.passa(x + dx, y + dy)) return { x: x + dx, y: y + dy }; return null }
  const vaiA = async c => { await page.evaluate(([x, z]) => window.__mondo3d.porta(x + 0.5, z + 0.5), [c.x, c.y]); await attendi(page, 500) }
  const g0 = await giro()
  // fuori dalla zona della piazza, ma a meno di raggio + 8 dal centro: passare il confine non vale
  const bordo = cella(villaggio.centro.x + villaggio.raggio + 3, villaggio.centro.y)
  controlla('un posto appena fuori dal confine, non lontano', !!bordo && !lontanoDalleCitta(m, bordo.x, bordo.y))
  await vaiA(bordo); await vaiA({ x: villaggio.partenza.x, y: villaggio.partenza.y }); await vaiA(bordo); await vaiA({ x: villaggio.partenza.x, y: villaggio.partenza.y })
  uguale('entrare e uscire dal confine non fa girare il mondo', await giro(), g0)
  // lontano davvero (davanti alla cripta), e poi di nuovo in piazza: un giro
  const lontano = m.posti.find(p => p.tipo === 'ingresso' && p.chiave === 'altare').accanto
  controlla(`a più di raggio + ${MARGINE_DEL_GIRO} celle`, lontanoDalleCitta(m, lontano.x, lontano.y))
  await vaiA(lontano)
  await vaiA({ x: villaggio.partenza.x, y: villaggio.partenza.y })
  uguale('allontanati e tornati: un giro', await giro(), g0 + 1)
  await vaiA({ x: villaggio.partenza.x + 2, y: villaggio.partenza.y }); await vaiA({ x: villaggio.partenza.x, y: villaggio.partenza.y })
  uguale('girare in piazza non lo fa girare ancora', await giro(), g0 + 1)
  // si salva dopo qualche secondo di gioco (il tempo della scena, che sul computer di prova scorre più piano dell'orologio)
  for (let n = 0; n < 40 && (await salvato()) !== g0 + 1; n++) await attendi(page, 1000)
  uguale('il giro si salva', await salvato(), g0 + 1)
  // il giro nuovo ha fogli nuovi
  await alla()
  const nuovi = await page.locator('[data-fumetto-di="bacheca"] [data-taglia][data-stato="offerta"]').evaluateAll(els => els.map(e => e.dataset.taglia))
  controlla('fogli del giro nuovo', nuovi.length === 3 && nuovi.every(id => id.endsWith(`:${g0 + 1}`)), nuovi.join())
  await scatto(page, 'sotterraneo-bacheca-giro-nuovo')
}

uguale('nessun errore in console', errori.join(' | '), '')
await browser.close()
riassunto('sotterraneo bacheca')
