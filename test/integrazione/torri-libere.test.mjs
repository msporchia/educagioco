/* ═══════════════════════════════════════════════════════════════════
   LE QUATTRO PARTITE LIBERE DEL CASTELLO, DAL DITO

   Quello che `unita/castello` non può vedere: che sulla mappa ci siano
   **quattro tasti**, uno per terreno, ognuno col suo record; che
   toccarne uno apra proprio quella libera; che a fine partita il
   record finisca nel quaderno **di quel terreno** e non in quello di
   un altro; e che il record della vecchia partita libera — una sola,
   a strada singola — si ritrovi sotto il bosco senza nessuna
   migrazione.

   `node test/esegui.mjs torri-libere`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, leggiProfilo, attendi } from '../aiuto/browser.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)

/* un bambino che ha finito la campagna, con il record di quando la
   libera era una sola e due regali in tasca */
await semina(page, {
  td: { tappa: 20, libera: true, v: 2 },
  campagne: { torri: { tappa: 0, libera: false, stelle: {}, cfg: {},
                       primato: { best: 21, quando: 5, partite: 3, ultime: [{ v: 21, t: 5 }],
                                  dettagli: { uccisi: 400, torri: 4 } },
                       regali: { frecce: 2 } } },
})

/* in home la riga del castello racconta il record ereditato */
const rigaHome = await page.locator('.carta.td').textContent()
controlla('in home il record di ieri sta sotto il bosco', /radura grande.*21 ondate/i.test(rigaHome), rigaHome)

await page.click('.carta.td')
await page.waitForSelector('.tappe')

const tasti = await page.$$eval('[data-tappa^="libera-"]', bs =>
  bs.map(b => ({ chiave: b.dataset.tappa, testo: b.textContent.replace(/\s+/g, ' ').trim() })))
uguale('sulla mappa ci sono quattro partite libere', tasti.length, 4)
uguale('nell\'ordine dei terreni', tasti.map(t => t.chiave).join(','),
       'libera-bosco,libera-sotterraneo,libera-mura,libera-palude')
const bosco = tasti.find(t => t.chiave === 'libera-bosco')
controlla('il bosco porta il record della vecchia libera', /21 ondate/.test(bosco.testo), bosco.testo)
controlla('e com\'era fatta quella partita', /400 nemici fermati/.test(bosco.testo), bosco.testo)
const mura = tasti.find(t => t.chiave === 'libera-mura')
controlla('le mura non hanno ancora un record', !/record/.test(mura.testo), mura.testo)
controlla('i regali si vedono, una volta per tutte e quattro',
          /2 potenziamenti/.test(await page.locator('[data-regali]').textContent()))

/* si entra nel bastione, e si perde in fretta: nessuna torre, ondata
   chiamata subito, campo a tutta velocità */
await page.click('[data-tappa="libera-mura"]')
await attendi(page, 300)
const dentro = await page.evaluate(() => {
  const T = window.__td
  return { fase: T.fase.value, idx: T.tappaIdx.value, quale: T.liberaScelta.value,
           strade: T.postazioni().length }
})
uguale('la partita è cominciata', dentro.fase, 'gioco')
uguale('ed è una libera', dentro.idx, -1)
uguale('quella delle mura', dentro.quale, 'libera-mura')
await page.evaluate(async () => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.velocita.value = 60
  for (let giro = 0; giro < 400 && T.fase.value === 'gioco'; giro++) {
    if (T.inAttesa.value) T.chiamaOnda()
    await attesa(25)
  }
})
uguale('senza torri il castello cade', await page.evaluate(() => window.__td.fase.value), 'fine')
const cartello = await page.locator('[data-primato]').textContent()
controlla('e il cartello dice del primo risultato su questo terreno',
          /primo risultato/.test(cartello), cartello)

const profilo = await leggiProfilo(page)
const torri = profilo.campagne.torri
controlla('il record è scritto sotto le mura', !!(torri.primati && torri.primati['libera-mura']),
          JSON.stringify(torri.primati))
uguale('con una partita contata', torri.primati['libera-mura'].partite, 1)
uguale('e il record di ieri è ancora lì per il bosco, intatto', torri.primato && torri.primato.best, 21)
controlla('il bosco non ha ancora un quaderno suo', !torri.primati['libera-bosco'])

/* tornati alla mappa, il tasto delle mura porta il suo record e il bosco il suo */
await page.click('.banco .bottone.chiaro')
await page.waitForSelector('[data-tappa="libera-mura"]')
const dopo = await page.$$eval('[data-tappa^="libera-"]', bs =>
  Object.fromEntries(bs.map(b => [b.dataset.tappa, b.textContent.replace(/\s+/g, ' ').trim()])))
controlla('le mura adesso hanno il loro record', /record/.test(dopo['libera-mura']), dopo['libera-mura'])
controlla('e il bosco tiene il suo', /21 ondate/.test(dopo['libera-bosco']), dopo['libera-bosco'])

uguale('nessun errore JS', errori.join(' · '), '')
await browser.close()
riassunto('le quattro partite libere del castello')
