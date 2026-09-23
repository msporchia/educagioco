/* ═══════════════════════════════════════════════════════════════════
   L'AGGIORNAMENTO, CON UN SITO VERO E UN SERVICE WORKER VERO

   «So che c'è una versione nuova e il telefono non la prende.» Il gioco
   aveva un sacco di meccanismi automatici, e quando non andavano non si
   vedeva niente: nessun errore, solo la data vecchia in fondo alla home.
   Qui si fanno succedere, uno alla volta, i giorni storti che da `file://`
   non esistono — il service worker, la cache del browser che si tiene la
   pagina dieci minuti come la fa tenere GitHub Pages, la rete lenta — e
   si guarda che il gioco arrivi alla versione giusta lo stesso.

   Il sito è `aiuto/sito.mjs`, e `pubblica()` mette in linea una versione
   nuova senza ricompilare. Le versioni hanno date nel 2099, così sono
   sempre più nuove di quella appena costruita. Il browser è un
   `apriTelefono()` e non un `apriBrowser()`: un profilo su disco, perché
   quello in incognito la pagina da otto megabyte non se la tiene, e il
   guasto da rifare è proprio la pagina vecchia che il telefono si tiene.

   Quello che si prova, in ordine:
   1. da `file://` il tasto non c'è — non c'è nessun sito a cui chiedere;
   2. «cerca aggiornamenti» con la stessa versione dice che è già l'ultima;
   3. riaperta subito dopo una pubblicazione la pagina è ancora la vecchia
      (la cache del browser), e **il nastro se ne accorge lo stesso** —
      prima taceva, perché guardava il service worker e non la pagina;
   4. il nastro aggiorna davvero;
   5. il nastro **non dice il falso**: pagina già nuova, service worker che
      si aggiorna alle sue spalle, e niente nastro;
   6. **la rete lenta**, il caso per cui il tasto esiste: pagine che
      arrivano dopo quattro secondi, service worker nuovo che non arriva,
      e dopo il tasto riparte comunque la versione nuova;
   7. il service worker nuovo non si mette in casa la pagina vecchia che
      il browser si teneva da parte;
   8. senza la pagina il service worker nuovo non si installa, e la copia
      di prima resta intera;
   9. il sito muto si dice, e «Riprova» riprova;
   10. quello che arriva dalla rete nella cache non entra — né la pagina
       veloce, né quella lenta, né una coda nell'indirizzo — e manifest e
       icone non si richiedono al sito «per la volta dopo»: la cache la
       scrivono l'installazione e il tasto.
   ═══════════════════════════════════════════════════════════════════ */
import { apriTelefono, apriGioco, scatto } from '../aiuto/browser.mjs'
import { apriSito } from '../aiuto/sito.mjs'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const sito = await apriSito()
const telefono = await apriTelefono()

const PRIMA = { ...sito.versione }
const versione = (lettera, giorno) =>
  ({ id: `2099.10.${giorno}.0900-${lettera}`, etichetta: `${Number(giorno)} ottobre alle 09:00` })
const B = versione('b', '01'), C = versione('c', '02'), D = versione('d', '03')
const E = versione('e', '04'), F = versione('f', '05'), G = versione('g', '06')
const cassettoDi = v => 'educagioco-' + v.id

try {
  /* ══════════ 1. da file:// il tasto non c'è ══════════ */
  {
    const { page } = await apriGioco(telefono)
    controlla('da file:// «cerca aggiornamenti» non c\'è: non c\'è un sito a cui chiedere',
      !(await page.isVisible('[data-azione="cerca-versione"]')))
    await page.close()
  }

  const { page, errori } = await apriGioco(telefono, { indirizzo: sito.indirizzo })
  const cdp = await page.context().newCDPSession(page)
  const svuotaLaCacheDelBrowser = () => cdp.send('Network.clearBrowserCache')

  const scritta = () => page.evaluate(() => document.querySelector('.versione')?.textContent || '')
  const dice = async v => (await scritta()).includes(v.etichetta)
  const nastro = () => page.isVisible('[data-nastro="versione"]')
  const arriva = (selettore, timeout = 10000) =>
    page.waitForSelector(selettore, { timeout }).then(() => true, () => false)
  const ripartita = (timeout = 30000) =>
    page.waitForEvent('load', { timeout }).then(() => true, () => false)
  /* riaprire l'app come la riapre un telefono: da un'altra pagina, e non
     con la ricarica — che per il browser è un'altra cosa, e rivaluta la
     pagina col sito invece di prenderla dalla sua cache */
  const riapri = async (coda = '') => {
    await page.goto('about:blank')
    await page.goto(sito.indirizzo + coda)
    await page.waitForSelector('.carte', { timeout: 15000 })
  }
  /* Il service worker si aggiorna quando decide il browser — dopo una
     navigazione, con un ritardo suo — e una prova che aspetta il browser
     è una prova che a volte guarda il vuoto: è successo, e il giro intero
     aveva chiesto `sw.js` una volta sola. Quindi lo si chiede, e si
     aspetta che abbia finito. Torna come è finita: `activated`,
     `redundant` (installazione fallita), `uguale` (niente di nuovo: o non
     c'era, o il browser è arrivato prima), `errore` (`sw.js` non arriva). */
  const aggiornaIlServiceWorker = () => page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration()
    try { await reg.update() } catch (e) { return 'errore' }
    const w = reg.installing || reg.waiting
    if (!w) return 'uguale'
    return new Promise(ok => {
      const guarda = () => ['activated', 'redundant'].includes(w.state) && ok(w.state)
      w.addEventListener('statechange', guarda); guarda()
    })
  })
  /* e ha finito di cambiare quando resta una cache sola, quella della sua
     versione: all'attivazione le altre se ne vanno. Si guarda da qui e
     non con `waitForFunction`, che una funzione `async` non la aspetta —
     una promessa è sempre «vera», e il controllo passava senza guardare */
  const assestato = async v => {
    for (let i = 0; i < 150; i++) {
      const k = await page.evaluate(() => caches.keys())
      if (k.length === 1 && k[0] === cassettoDi(v)) return true
      await page.waitForTimeout(100)
    }
    return false
  }
  const nuovo = esito => ['activated', 'uguale'].includes(esito)
  /* le foto dei fogli aspettano che il velo sia entrato: la dissolvenza
     dura 0,18 s, e su un sito locale ogni passo ne dura meno — una foto
     presa prima mostra il foglio trasparente sopra le carte */
  const fotoDelFoglio = async nome => { await page.waitForTimeout(350); await scatto(page, nome) }
  const chiestoAlSito = async da => {
    for (let i = 0; i < 50; i++) {
      if (sito.richieste.slice(da).some(r => r.percorso === '/versione.json')) return true
      await page.waitForTimeout(100)
    }
    return false
  }

  /* ══════════ dal sito il service worker prende casa ══════════ */
  controlla('il service worker tiene la pagina',
    await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null,
                               { timeout: 15000 }).then(() => true, () => false))
  controlla('in fondo alla home c\'è «cerca aggiornamenti»',
    await page.isVisible('[data-azione="cerca-versione"]'))
  controlla('appena aperta chiede al sito che versione ha', await chiestoAlSito(0))
  await page.waitForTimeout(300)
  controlla('e con la stessa versione il nastro tace', !(await nastro()))
  await page.locator('[data-azione="cerca-versione"]').scrollIntoViewIfNeeded()
  await scatto(page, 'aggiornamento-piede')

  /* ══════════ 2. è già l'ultima ══════════ */
  await page.click('[data-azione="cerca-versione"]')
  controlla('con la stessa versione dice che è già l\'ultima',
    await arriva('[data-aggiorna][data-fase="gia"]'))
  await fotoDelFoglio('aggiornamento-gia')
  await page.click('[data-aggiorna] [data-chiudi]')
  controlla('la ✕ chiude il foglio', !(await page.isVisible('[data-aggiorna]')))

  /* ══════════ 3. pubblicata, e riaperta con la pagina di prima ══════════
     È il caso di tutti i giorni: si pubblica, si riapre l'app, e la
     pagina al sito non la chiede nemmeno — GitHub Pages ha detto di
     tenerla dieci minuti. */
  sito.pubblica(B)
  {
    const da = sito.richieste.length
    await riapri()
    controlla('riaperta subito, la pagina non si chiede nemmeno al sito',
      !sito.richieste.slice(da).some(r => r.percorso === '/' && r.modo === 'navigate'))
  }
  controlla('ed è ancora quella di prima', await dice(PRIMA), await scritta())
  controlla('il nastro se ne accorge lo stesso', await arriva('[data-nastro="versione"]'))
  controlla('e dice di quando è la nuova', (await page.evaluate(() =>
    document.querySelector('[data-nastro="versione"]')?.textContent || '')).includes(B.etichetta))
  await scatto(page, 'aggiornamento-nastro')

  /* ══════════ 4. il nastro aggiorna davvero ══════════
     A gocce, per guardare il foglio mentre conta: il totale deve
     arrivare da `versione.json` — la lunghezza che dichiara il sito è
     quella compressa, e con quella la barra non arriverebbe mai in fondo. */
  {
    sito.goccia = 60
    const dopo = ripartita()
    await page.click('[data-azione="aggiorna"]')
    controlla('mentre scarica il foglio conta i megabyte', await arriva('[data-scaricati]'))
    const conto = await page.evaluate(() => document.querySelector('[data-scaricati]')?.textContent || '')
    controlla('e sa quanti sono in tutto', /\d+,\d di \d+,\d MB/.test(conto), conto)
    await fotoDelFoglio('aggiornamento-scarico')
    sito.goccia = 0
    controlla('il nastro scarica e riparte', await dopo)
    await page.waitForSelector('.carte', { timeout: 15000 })
    controlla('e ripartita è la nuova', await dice(B), await scritta())
  }

  /* ══════════ 5. il nastro non dice il falso ══════════
     La pagina arriva fresca dalla rete, e alle sue spalle il service
     worker si aggiorna: è il momento in cui il nastro si accendeva, e
     ricaricando non cambiava niente. */
  sito.pubblica(C)
  await svuotaLaCacheDelBrowser()
  await riapri()
  controlla('senza la cache del browser la pagina arriva già nuova', await dice(C), await scritta())
  {
    const esito = await aggiornaIlServiceWorker()
    controlla('il service worker nuovo si installa dietro', nuovo(esito), esito)
  }
  controlla('e prende casa', await assestato(C))
  await page.waitForTimeout(400)
  controlla('e il nastro tace: la pagina è già quella', !(await nastro()))

  /* ══════════ 6. la rete lenta ══════════
     Le pagine arrivano dopo quattro secondi — più della pazienza del
     service worker, che ne dà due e mezzo — e il service worker nuovo
     non arriva proprio. Prima, qui, «Ricarica» tornava sulla copia di
     prima. La cache del browser si svuota a «riparto», così la ricarica
     deve passare dalla rete lenta o dalla cache del service worker, e
     nella cache del service worker c'è solo quello che ci ha messo il
     tasto. */
  sito.pubblica(D)
  sito.swFermo = true
  await riapri()
  controlla('riaperta, è ancora quella di prima', await dice(C), await scritta())
  controlla('il nastro sa della nuova', await arriva('[data-nastro="versione"]'))
  sito.lento = 4000
  /* da qui in poi la pagina D è scaricata: chi la chiede di nuovo al sito
     la sta riscaricando (il passo 7 lo conta) */
  let dopoIlTasto = 0
  {
    const dopo = ripartita()
    await page.click('[data-azione="cerca-versione"]')
    const riparto = await arriva('[data-aggiorna][data-fase="pronta"]', 20000)
    dopoIlTasto = sito.richieste.length
    await svuotaLaCacheDelBrowser()
    controlla('scaricata e controllata, dice «riparto»', riparto)
    controlla('riparte', await dopo)
    await page.waitForSelector('.carte', { timeout: 15000 })
    controlla('con la rete lenta e il service worker vecchio, ripartita è la nuova',
      await dice(D), await scritta())
    /* la pagina buona sta sotto i nomi giusti, e non ne resta una seconda
       copia da otto megabyte sotto l'indirizzo da cui l'ha scaricata */
    const chiavi = await page.evaluate(async () => {
      const tutte = []
      for (const k of await caches.keys())
        for (const q of await (await caches.open(k)).keys()) tutte.push(q.url)
      return tutte
    })
    controlla('e nelle cache non resta una copia sotto l\'indirizzo del tasto',
      !chiavi.some(u => u.includes('?aggiorna=')), chiavi.join(' '))
  }
  sito.lento = 0
  sito.swFermo = false

  /* ══════════ 7. il service worker non si prende la pagina vecchia ══════════
     La cache del browser ha la pagina D, fresca per altri dieci minuti.
     Si pubblica E e il service worker si aggiorna: senza `no-cache` si
     metterebbe in casa D, e da lì in poi, con la rete lenta, a ogni
     apertura tornerebbe D senza che niente lo dica. */
  /* ed è anche il momento di guardare la cosa che su una rete lenta vale
     di più: il service worker della D arriva adesso — o appena tolto il
     blocco, subito dopo il passo 6 — e la pagina gliel'ha già lasciata il
     tasto. Sette megabyte e mezzo una volta sola, non due: dal tasto in
     poi, nessuno chiede più la pagina al sito se non per aprirla. */
  /* la cache del service worker di una versione tiene la pagina di quale? */
  const tiene = (cassetto, v) => page.evaluate(async ({ nome, id }) => {
    const r = await caches.match('./', { cacheName: nome })
    return r ? (await r.text()).includes(`"${id}"`) : false
  }, { nome: cassettoDi(cassetto), id: v.id })

  await riapri()
  {
    const esito = await aggiornaIlServiceWorker()
    controlla('tolto il blocco, arriva il service worker della D', nuovo(esito), esito)
  }
  controlla('e prende casa', await assestato(D))
  uguale('installandosi, non riscarica la pagina che il tasto gli ha lasciato',
    sito.richieste.slice(dopoIlTasto)
      .filter(r => r.percorso === '/' && r.modo === 'cors' && !r.coda).length, 0)

  sito.pubblica(E)
  {
    const esito = await aggiornaIlServiceWorker()
    controlla('si pubblica la E, e il service worker si aggiorna', nuovo(esito), esito)
  }
  controlla('e prende casa', await assestato(E))
  controlla('tenendo la pagina nuova, non quella che si teneva il browser', await tiene(E, E))

  /* ══════════ 8. senza la pagina non si installa ══════════ */
  sito.pubblica(F)
  sito.rotto = true
  uguale('senza la pagina il service worker nuovo non si installa',
    await aggiornaIlServiceWorker(), 'redundant')
  controlla('e resta quello di prima, con la sua copia intera', await tiene(E, E))
  sito.rotto = false

  /* ══════════ 9. il sito muto, e «Riprova» ══════════ */
  sito.muto = true
  await page.click('[data-azione="cerca-versione"]')
  controlla('senza sito il foglio dice che non risponde', await arriva('[data-aggiorna][data-fase="muto"]'))
  controlla('e offre di riprovare', await page.isVisible('[data-aggiorna] [data-azione="riprova"]'))
  await fotoDelFoglio('aggiornamento-muto')
  sito.muto = false
  {
    const dopo = ripartita()
    await page.click('[data-aggiorna] [data-azione="riprova"]')
    controlla('col sito tornato, «Riprova» scarica e riparte', await dopo)
    await page.waitForSelector('.carte', { timeout: 15000 })
    controlla('sull\'ultima pubblicata', await dice(F), await scritta())
  }

  /* ══════════ 10. quello che arriva dalla rete, nella cache non entra ══════════
     La cache di una versione la scrivono l'installazione e il tasto, e
     nessun altro. Il service worker ci provava anche lui, dopo ogni
     risposta presa dalla rete, e non ci riusciva quasi mai: il `clone()`
     arrivava quando la pagina si era già presa il corpo, e riusciva solo
     dove la risposta non la voleva nessuno — la pagina arrivata oltre la
     pazienza, e il rinfresco di manifest e icone. È stato tolto
     (`vite.config.js`), e qui si guarda che resti tolto: si pubblica la G
     col service worker fermo, la si apre veloce, lenta e con una coda
     nell'indirizzo, e nelle cache deve restare esattamente quello che
     c'era. */
  const tutteLeChiavi = () => page.evaluate(async () => {
    const tutte = []
    for (const k of await caches.keys())
      for (const q of await (await caches.open(k)).keys()) {
        const u = new URL(q.url)
        tutte.push(`${k} ${u.pathname}${u.search}`)
      }
    return tutte.sort()
  })
  {
    const esito = await aggiornaIlServiceWorker()
    controlla('prima si assesta il service worker della F', nuovo(esito), esito)
  }
  controlla('e prende casa', await assestato(F))
  const primaDellaG = await tutteLeChiavi()
  sito.swFermo = true
  sito.pubblica(G)

  /* veloce: la G arriva dalla rete in tempo, ed è lei che si vede */
  await svuotaLaCacheDelBrowser()
  {
    const da = sito.richieste.length
    await riapri()
    controlla('veloce, la G arriva dalla rete', await dice(G), await scritta())
    controlla('e nella cache resta la F', await tiene(F, F))
    uguale('manifest e icone li dà la cache, e al sito non si richiedono «per la volta dopo»',
      sito.richieste.slice(da).filter(r => /\.(webmanifest|png|svg)$/.test(r.percorso)).length, 0)
  }

  /* lenta, e con una coda: risponde la cache, e la G che arriva dopo non
     deve entrarci — né al posto della F, né come copia sua sotto `?via=`.
     Si guarda solo quando la G è arrivata davvero, cioè quando il `put`
     di prima ci riusciva: prima si guarderebbe il vuoto */
  sito.lento = 4000
  await svuotaLaCacheDelBrowser()
  {
    const partita = Date.now()
    await riapri('?via=lenta')
    controlla('lenta, risponde la cache: la F', await dice(F), await scritta())
    await page.waitForTimeout(Math.max(0, partita + sito.lento + 2500 - Date.now()))
    controlla('e la G arrivata dopo non ci entra', await tiene(F, F))
  }
  sito.lento = 0

  /* e una `fetch` qualunque, che la cache non ha: va al sito, e basta */
  await page.evaluate(() => fetch('./?prova=x').then(r => r.text()))
  stessaLista('dopo tutto questo, nelle cache c\'è quello che c\'era prima della G',
    await tutteLeChiavi(), primaDellaG)
  sito.swFermo = false

  const js = errori.filter(e => e.startsWith('errore JS'))
  uguale('nessun errore di JavaScript', js.length, 0)
  js.slice(0, 5).forEach(e => nota('·', e))
  nota(`${sito.richieste.length} richieste al sito finto`)
} finally {
  await telefono.close()
  await sito.chiudi()
}

riassunto('l\'aggiornamento, dal sito')
