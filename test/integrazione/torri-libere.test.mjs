/* ═══════════════════════════════════════════════════════════════════
   LE QUATTRO PARTITE LIBERE DEL CASTELLO, DAL DITO

   Quello che `misure/castello` non può vedere: che sulla mappa ci siano
   **quattro tasti**, uno per terreno, ognuno col suo record; che
   toccarne uno apra proprio quella libera; che a fine partita il
   record finisca nel quaderno **di quel terreno** e non in quello di
   un altro; e che il record della vecchia partita libera — una sola,
   a strada singola — si ritrovi sotto il bosco senza nessuna
   migrazione.

   `node test/esegui.mjs torri-libere`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, semina, leggiProfilo, attendi, scatto, scegli, difendi, fumettoDel } from '../aiuto/browser.mjs'
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
const rigaHome = await page.locator('.carta.gioco[data-gioco="torri"]').textContent()
controlla('in home il record di ieri sta sotto il bosco', /radura grande.*21 ondate/i.test(rigaHome), rigaHome)

await scegli(page, 'torri')
await page.waitForSelector('.tappe')

// sul regno le libere sono i quattro torrioni; il record lo dice il fumetto
const chiavi = await page.$$eval('[data-tappa^="libera-"]', bs => bs.map(b => b.dataset.tappa))
const tasti = []
for (const chiave of chiavi) tasti.push({ chiave, testo: await fumettoDel(page, `[data-tappa="${chiave}"]`) })
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
await difendi(page, '[data-tappa="libera-mura"]')
await attendi(page, 300)
const dentro = await page.evaluate(() => {
  const T = window.__td
  return { fase: T.fase.value, idx: T.tappaIdx.value, quale: T.liberaScelta.value,
           strade: T.postazioni().length }
})
uguale('la partita è cominciata', dentro.fase, 'gioco')
uguale('ed è una libera', dentro.idx, -1)
uguale('quella delle mura', dentro.quale, 'libera-mura')
await scatto(page, 'torri-libere-bastione')   // il campo: l'anello che si attraversa
/* si perde in fretta: **un** arciere — senza nemmeno una torre il gioco
   non manda l'ondata, aspetta il bambino — poi ondate chiamate appena
   si può, campo a tutta velocità. Un regalo in sospeso blocca la
   chiamata (`chiamaOnda` lo riapre invece di mandare i mostri), quindi
   si prende il primo che capita. `daOnda` spinge il contatore delle
   ondate, per fingere una partita lunga senza giocarla. */
const perdi = (daOnda = 0) => page.evaluate(async daOnda => {
  const attesa = ms => new Promise(r => setTimeout(r, ms))
  const T = window.__td
  T.scegliTorre('add')
  T.operazioneFinita({ errori: 0, ms: 900 })   // il conto, pagato senza tastiera
  await attesa(100)
  T.velocita.value = 60
  if (daOnda) T.hud.onda = daOnda
  for (let giro = 0; giro < 600 && T.fase.value === 'gioco'; giro++) {
    if (T.regaloAperto.value) T.prendiRegalo('frecce')
    if (T.inAttesa.value) T.chiamaOnda()
    await attesa(25)
  }
  return { fase: T.fase.value, onda: T.hud.onda, cuori: T.hud.cuori, torri: T.hud.torri,
           monete: T.monete.prese }
}, daOnda)
/* il contatore si spinge a tre: da quando le libere si aprono coi
   comuni, la prima ondata del bastione è un orco che le due torri di
   apertura feriscono tutte e due, e la taratura gli dà la vita che
   reggono due torri — un arciere solo cade alla prima, il record è
   zero, e un record zero il tasto non lo scrive */
const caduta = await perdi(3)
uguale('con un arciere solo il castello cade', caduta.fase, 'fine', JSON.stringify(caduta))
/* il conto dell'arciere si è pagato quando la torre è salita, anche in una
   partita persa: niente monete a ondate rette (docs/apprendimento/calibrazione.md) */
uguale('un conto senza errori, tre monete', caduta.monete, 3)
uguale('e il cartello di fine le dice', await page.locator('[data-monete-prese]').first().innerText(), '+3 🪙')
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
const dopo = {}
for (const chiave of chiavi) dopo[chiave] = await fumettoDel(page, `[data-tappa="${chiave}"]`)
controlla('le mura adesso hanno il loro record', /record/.test(dopo['libera-mura']), dopo['libera-mura'])
controlla('e il bosco tiene il suo', /21 ondate/.test(dopo['libera-bosco']), dopo['libera-bosco'])

/* ── il record si aggiorna subito, senza uscire e rientrare ──
   Si gioca il bosco, che ha il record ereditato di 21, e si batte:
   l'ondata la si spinge a mano a 30 prima che il castello cada, così
   la partita finisce a 29 superate. Tornati in mappa **senza
   ricaricare** il tasto del bosco deve dire 29, non 21 — e la home,
   che racconta il record più recente, deve dire lo stesso. */
await difendi(page, '[data-tappa="libera-bosco"]')
await attendi(page, 300)
const cadutaBosco = await perdi(30)
uguale('anche nel bosco il castello cade', cadutaBosco.fase, 'fine')
uguale('a un\'ondata oltre la trentesima', cadutaBosco.onda >= 30, true)
const cartelloBosco = await page.locator('[data-primato]').textContent()
controlla('e il cartello festeggia il record', /record/i.test(cartelloBosco), cartelloBosco)
await page.click('.banco .bottone.chiaro')
await page.waitForSelector('[data-tappa="libera-bosco"]')
await page.locator('[data-tappa="libera-bosco"]').click()
await scatto(page, 'torri-libere-mappa')      // il torrione del bosco col suo record
const subito = await page.locator('[data-fumetto]').textContent()
const nuovo = `${cadutaBosco.onda - 1} ondate`
controlla(`il tasto del bosco dice subito il record nuovo (${nuovo})`, subito.includes(nuovo), subito)
controlla('e non più quello di ieri', !/21 ondate/.test(subito), subito)
await page.click('button[aria-label="indietro"]')
await page.waitForSelector('.carta.gioco[data-gioco="torri"]')
const rigaDopo = await page.locator('.carta.gioco[data-gioco="torri"]').textContent()
controlla('e la home racconta il record appena fatto', rigaDopo.includes(nuovo), rigaDopo)

uguale('nessun errore JS', errori.join(' · '), '')
await browser.close()
riassunto('le quattro partite libere del castello')
