/* «Leonardo ti ha superato» in home (docs/core/amici-nei-giochi.md): una riga per il sorpasso segnato quando è arrivata la sua
   bacheca, col suo pallino e il gioco; niente per chi ho già ripreso, per un amico senza nome o per un gioco che non vedo.
   Toccarla apre il gioco, e tornati in home la riga non c'è più. I sorpassi sono già salvati sul telefono, come dopo una
   lettura: il servizio non serve. `node test/esegui.mjs amici-sorpassi --niente-build` */
import { apriBrowser, apriGioco, semina, seminaAmici, amicoDiProva, attendi, scatto, GIOCATORE } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ugualeJ = (cosa, a, b) => uguale(cosa, JSON.stringify(a), JSON.stringify(b))

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await page.addInitScript(() => { globalThis.__SERVIZIO_SFIDE__ = 'http://127.0.0.1:9' })
const veri = () => errori.filter(e => !/WebSocket connection|Failed to load resource|net::ERR|ERR_/.test(e))

const mate = (tappa, record) => ({ mate: { posti: tappa ? { '': tappa } : {}, primati: record ? { '': record } : {} } })
const K = l => l.repeat(32)
const righe = () => page.$$eval('[data-sorpasso]', l => l.map(e => ({ gioco: e.dataset.gioco, testo: e.textContent.replace(/\s+/g, ' ').trim() })))

await semina(page, { mate: { tappa: 0, fila: 3, libera: false }, settings: { eta: 9 } })
await seminaAmici(page, [
  amicoDiProva('a', 'leonardo1', 'Leonardo', { giochi: mate(5, 0) }),
  amicoDiProva('b', 'melody001', 'Melody', { giochi: mate(2, 0) }),     // mi aveva superato, ma l'ho ripresa
  amicoDiProva('c', null, '', { giochi: mate(9, 0) }),                    // mai incontrato: senza nome
], undefined, { sorpassi: [
  { chiave: K('b'), gioco: 'mate', tipo: 'tappa' },
  { chiave: K('c'), gioco: 'mate', tipo: 'tappa' },
  { chiave: K('a'), gioco: 'mate', tipo: 'tappa' },
] })
await page.waitForSelector('[data-sorpasso]')
await attendi(page, 300)
const r = await righe()
uguale('una riga sola: chi è davvero davanti e ha un nome', r.length, 1)
controlla('Leonardo, col suo pallino e il gioco', r[0]?.gioco === 'mate' && r[0].testo === 'LLeonardo ti ha superato☄️ Asteroidi', JSON.stringify(r))
await scatto(page, 'amici-sorpasso-home')

await page.click('[data-sorpasso]')
await page.waitForSelector('[data-rotta] [data-tappa]')
controlla('toccarla porta al gioco, dove si vede chi è davanti', /Leonardo è 2 tappe più avanti di te/.test(await page.textContent('[data-amico-davanti]')))
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carte')
await attendi(page, 300)
uguale('tornati in home, è detto', (await righe()).length, 0)
const salvati = await page.evaluate(chiave => new Promise(ok => {
  const r = indexedDB.open('giochi-bambini', 1)
  r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').get(chiave); q.onsuccess = () => ok(q.result?.sorpassi) }
}), 'amici:' + GIOCATORE)
ugualeJ('e non resta nell\'archivio (gli altri, mai detti, se ne vanno col gioco aperto)', salvati, [])

/* un record battuto, in un gioco che non si vede: niente */
await seminaAmici(page, [amicoDiProva('a', 'leonardo1', 'Leonardo', { giochi: { survivors: { posti: { '': 2 }, primati: { '': 500 } } } })],
  undefined, { sorpassi: [{ chiave: K('a'), gioco: 'survivors', tipo: 'record' }] })
await semina(page, { mate: { tappa: 0, fila: 3, libera: false }, campagne: { survivors: { tappa: 2, primato: { best: 300, quando: 1, partite: 1, ultime: [] } } },
  settings: { eta: 9, giochi: { survivors: false } } })
await attendi(page, 600)
uguale('un gioco spento dai grandi non ha riga', (await righe()).length, 0)

uguale('nessun errore in console', veri().length, 0, veri().join('\n'))
await browser.close()
riassunto('amici: «ti ha superato» in home')
