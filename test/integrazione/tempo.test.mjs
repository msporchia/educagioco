/* ═══════════════════════════════════════════════════════════════════
   QUANTO HA GIOCATO — la catena intera, col dito

   Il registro delle sessioni (`store/sessioni.js`) ha i suoi conti
   provati in Node; quello che solo un browser può dire è se **la
   sessione si apre e si chiude davvero** quando un bambino entra in un
   gioco e ne esce. È l'unico pezzo che nessun test puro può vedere,
   perché sta in `App.vue` — e se si staccasse, il registro resterebbe
   vuoto per sempre senza che niente diventi rosso.

   Le tre cose:
     · entrare in un gioco e uscirne scrive una riga, col gioco giusto;
     · una schermata che non è un gioco (le impostazioni, l'albo) non
       conta come tempo di gioco;
     · quello che si è scritto arriva fino al grafico dei grandi.

   `node test/esegui.mjs tempo`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, attendi, scatto, GIOCATORE } from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* Il registro sta in archivio sotto `sessioni:<id>`, **fuori dai
   profili**: si rilegge da lì e non chiamando il modulo — la pagina è
   il file unico costruito, dove i sorgenti non esistono più — e questo
   è anche il modo di accorgersi se qualcuno lo spostasse dentro il
   profilo senza dirlo. */
const registro = () => page.evaluate(chi => new Promise((ok, ko) => {
  const r = indexedDB.open('giochi-bambini', 1)
  r.onerror = () => ko(new Error('IndexedDB non si apre'))
  r.onsuccess = () => {
    const g = r.result.transaction('kv', 'readonly').objectStore('kv').get('sessioni:' + chi)
    g.onsuccess = () => ok(g.result?.voci || [])
    g.onerror = () => ko(new Error('lettura fallita'))
  }
}), GIOCATORE)

/* ── 1. una partita vera ──
   Cinque secondi è la soglia sotto la quale una sessione non si scrive
   (`MINIMA`): un tocco di passaggio non è una partita. Se ne aspettano
   sei, e non è tempo buttato — è il controllo che quella soglia esista
   davvero. */
await page.goto(page.url().split('#')[0] + '#fattoria')
await page.waitForTimeout(6200)
await page.evaluate(() => { location.hash = '#home' })
await page.waitForTimeout(900)

const dopoUna = await registro()
uguale('uscendo dal gioco si è scritta una riga', dopoUna.length, 1)
uguale('e dice a cosa ha giocato', dopoUna[0]?.g, 'fattoria')
controlla('per quanto', dopoUna[0]?.s >= 5, `${dopoUna[0]?.s}s`)
controlla('e da quando', dopoUna[0]?.t > 0)

/* ── 2. le impostazioni non sono un gioco ──
   Un genitore che passa dieci minuti a tarare le domande non deve
   comparire come dieci minuti di gioco di suo figlio. */
await page.evaluate(() => { location.hash = '#albo' })
await page.waitForTimeout(6200)
await page.evaluate(() => { location.hash = '#home' })
await page.waitForTimeout(900)
uguale('l\'albo non conta come tempo di gioco', (await registro()).length, 1)

/* ── 3. e il tocco di passaggio nemmeno ──
   Aprire un gioco e uscire subito capita dieci volte di fila mentre si
   sceglie: righe da due secondi renderebbero il registro illeggibile. */
await page.evaluate(() => { location.hash = '#conta' })
await page.waitForTimeout(900)
await page.evaluate(() => { location.hash = '#home' })
await page.waitForTimeout(900)
uguale('due secondi di gioco non sono una partita', (await registro()).length, 1)

/* ── 4. e arriva fino al grafico ── */
await page.click('[data-azione="grandi"]')
await page.waitForSelector('.tastierino', { timeout: 5000 })
for (const c of '0000') await page.click(`.tasto >> text="${c}"`)
await page.waitForSelector('.carte', { timeout: 5000 })
await page.click('.schede button[data-scheda="comeva"]')
await page.waitForSelector('[data-tempo]', { timeout: 5000 })
await attendi(page, 400)

const totale = await page.locator('[data-tempo-totale]').innerText()
controlla('il totale di oggi non è zero', /\d+s|\d+m/.test(totale), totale)
controlla('e la fattoria è nella classifica',
          await page.locator('[data-tempo-gioco="fattoria"]').count() > 0)

/* le sette barre della settimana ci sono tutte, vuote comprese: un
   grafico che salta i giorni senza partite mente sulla forma */
await page.click('[data-tempo-modo="settimana"]')
await attendi(page, 300)
uguale('sette giorni, vuoti compresi',
       await page.locator('[data-tempo] .colonna').count(), 7)
await scatto(page, 'tempo-di-gioco')

uguale('nessun errore in console', errori.length, 0, errori.join('\n'))
nota('sei secondi di attesa sono la soglia sotto cui una sessione non si scrive')
await browser.close()
riassunto('quanto ha giocato')
