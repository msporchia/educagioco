/* ═══════════════════════════════════════════════════════════════════
   LO SCARICO DEI GIOCHI, COL SERVICE WORKER VERO

   perché: lo scarico dei giochi col service worker vero, che si pianta a metà (worker morto, file muto o mancante) e deve arrivare in fondo da solo
   a parte perché: unico a servire dist-sito/ con aiuto/sito.mjs; scuola-senza-rete serve dist-scuola/, un'altra app

   «Si pianta a metà, soprattutto dentro un gioco.» Il service worker del
   sito spezzato scarica i giochi quando la pagina glielo chiede, e la
   pagina lo chiedeva solo all'avvio e al ritorno in primo piano: dentro
   un gioco non succede né l'uno né l'altro. Qui, con `dist-sito/` servito
   da `aiuto/sito.mjs`, si fanno succedere i tre modi di fermarsi e si
   guarda che lo scarico arrivi in fondo **senza che nessuno tocchi
   niente**:

   1. il service worker muore a metà, col bambino dentro un gioco;
   2. un file non risponde e non dà nemmeno errore;
   3. un file non c'è (il sito è già passato alla versione dopo);
   4. non arriva un file della base, e l'installazione cade.

   E che l'informazione stia al suo posto: in fondo alla home, che si
   muove a ogni file, e mai dentro un gioco. Vedi docs/core/aggiornamento.md.

   Il tempo. La pagina richiede dopo 20 s di silenzio (`src/scarico.js`):
   il suo orologio è finto (`clock.install`, scorre da sé) e, tolto il
   guasto, si salta avanti del silenzio, che per la pagina è vero. Il
   service worker ha l'orologio vero: il tetto di un file appeso (30 s) si
   aspetta davvero, e quella prova gira su un sito suo, accanto alle altre.
   ═══════════════════════════════════════════════════════════════════ */
import { join } from 'node:path'
import { apriGioco, apriTelefono, attendi, RADICE, scatto } from '../aiuto/browser.mjs'
import { apriSito } from '../aiuto/sito.mjs'
import { blocco, controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const CARTELLA = join(RADICE, 'dist-sito')
const sito = await apriSito({ cartella: CARTELLA })
const elenco = await (await fetch(sito.indirizzo + 'sw.js')).text()
const FILE = JSON.parse(/const FILE = (\[.*\])\s+\/\//.exec(elenco)[1])
const percorsi = FILE.map(f => '/' + f[0].slice(2))

// quanti file del sito non sono ancora in cassa
const mancano = page => page.evaluate(async percorsi => {
  const nomi = await caches.keys()
  if (!nomi.length) return percorsi.length
  const avute = new Set((await (await caches.open(nomi[nomi.length - 1])).keys()).map(r => new URL(r.url).pathname))
  return percorsi.filter(p => !avute.has(p)).length
}, percorsi)

async function finche (quanto, condizione) {
  for (const fine = Date.now() + quanto; Date.now() < fine;) {
    if (await condizione()) return true
    await new Promise(ok => setTimeout(ok, 250))
  }
  return false
}

const riga = page => page.locator('[data-scarico]').innerText({ timeout: 500 }).catch(() => '')

/* Il silenzio che fa richiedere la pagina: 20 s, il doppio dopo ogni richiesta a vuoto (`pausaDopo` di src/scarico.js).
   Il salto fa scattare una volta il controllo dei 5 s, a silenzio pieno */
const silenzio = (page, aVuoto = 0) => page.clock.fastForward(20000 * 2 ** aVuoto + 1000)

// un telefono nuovo a ogni prova: lo scarico riparte da zero. L'orologio della pagina è finto e scorre da sé
async function conTelefono (dove, fai, opzioni) {
  const telefono = await apriTelefono()
  try {
    await telefono.clock.install()
    return await fai(await apriGioco(telefono, { indirizzo: dove.indirizzo, ...opzioni }))
  } finally {
    await telefono.close()
  }
}

const nomeDi = g => FILE.filter(f => f[2] === g).sort((a, b) => a[1] - b[1])[0][0].slice(2)

/* 2. Un file che non risponde: senza un tetto la sua attesa non finisce mai, e con lei tutto quello che viene dopo.
   Il tetto sta nel service worker, a orologio vero (30 s più il file a 10 KB/s): il file più piccolo di un gioco, e un
   sito suo, così gira insieme alle altre prove */
const piuPiccolo = FILE.filter(f => f[2]).sort((a, b) => a[1] - b[1])[0][0].slice(2)
const appeso = (async () => {
  const suo = await apriSito({ cartella: CARTELLA })
  suo.calmo = 5
  suo.appeso = new RegExp(piuPiccolo)
  try {
    await blocco('un file appeso', () => conTelefono(suo, async ({ page }) => {
      controlla('un file appeso non ferma gli altri', await finche(70000, async () => await mancano(page) === 1))
      suo.appeso = null
      // passato il tetto l'operaio lo lascia, e la riga lo dice
      controlla('il file appeso ha un tetto', await finche(60000, async () => /riprende da solo/.test(await riga(page))))
      // mentre era appeso la pagina ha già richiesto una volta, a vuoto: la pausa dopo è doppia
      await silenzio(page, 1)
      controlla('e quando risponde arriva anche lui, da solo', await finche(30000, async () => !(await mancano(page))))
    }))
  } finally {
    await suo.chiudi()
  }
})()

/* 1. Il service worker muore a metà, dentro un gioco. Il telefono lo fa quando vuole: passati i cinque minuti di un evento
   (Chrome), per la memoria, per la batteria. Nessun ritorno in primo piano, nessun tocco: deve ripartire da solo */
sito.calmo = 40
await blocco('il service worker muore', () => conTelefono(sito, async ({ page }) => {
  const dentro = await finche(10000, () => page.locator('.carte').count().then(n => !n))
  controlla('si è dentro un gioco', dentro)
  controlla('dentro un gioco non si vede niente dello scarico', !(await page.locator('[data-scarico]').count()))
  const partito = await finche(30000, async () => await mancano(page) < percorsi.length - 150)
  controlla('lo scarico è partito', partito)
  const sessione = await page.context().newCDPSession(page)
  await sessione.send('ServiceWorker.enable')
  await sessione.send('ServiceWorker.stopAllWorkers')
  const dopo = await mancano(page)
  await attendi(page, 1500)
  sito.calmo = 5
  await silenzio(page)
  controlla(`col service worker morto a ${dopo} file dalla fine lo scarico arriva in fondo da solo`,
    await finche(30000, async () => !(await mancano(page))))
  controlla('e neanche finito dentro il gioco si vede niente', !(await page.locator('[data-scarico]').count()))
}, { hash: 'conta', attesa: null }))

/* 3. Un file che non c'è più: il sito è passato a un'altra versione, e si va a vedere */
const swChiesti = () => sito.richieste.filter(r => r.percorso === '/sw.js').length
const swPrima = swChiesti()
sito.calmo = 5
sito.sparito = new RegExp(nomeDi('castello'))
await blocco('un file sparito', () => conTelefono(sito, async ({ page }) => {
  controlla('un file sparito non ferma gli altri', await finche(40000, async () => await mancano(page) === 1))
  await page.waitForSelector('[data-scarico]', { timeout: 5000 })
  controlla('e lo si dice senza allarmi', /riprende da solo/.test(await page.locator('[data-scarico]').innerText()))
  await scatto(page, 'scarico-fermo')
  controlla('e il service worker va a vedere se ce n\'è uno nuovo', await finche(5000, async () => swChiesti() >= swPrima + 2))
  sito.sparito = null
  await silenzio(page)
  controlla('e quando torna arriva anche lui', await finche(30000, async () => !(await mancano(page))))
}))

/* 4. Un file della base che manca fa cadere la prima installazione, e con lei la registrazione: si rifà da qui.
   Un'immagine e non un file di codice: la home deve aprirsi */
const FUORI_DALLA_HOME = FILE.filter(f => !f[2] && !/\.(js|css|woff2)$/.test(f[0])).sort((a, b) => a[1] - b[1])[0][0].slice(2)
sito.sparito = new RegExp(FUORI_DALLA_HOME)
await blocco('la base monca', () => conTelefono(sito, async ({ page }) => {
  const fermo = await finche(15000, async () => /riprende da solo/.test(await riga(page)))
  controlla('senza la base il service worker non si installa', fermo)
  uguale('e non resta niente di attivo', await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.active), false)
  sito.sparito = null
  await silenzio(page)
  controlla('e quando il file torna si installa da solo, giochi compresi', await finche(60000, async () => !(await mancano(page))))
}))

/* 5. Nella home: una riga in fondo, non sopra, che si muove a ogni file e non a ogni gioco. Venti testi diversi lo
   provano: la fine dello scarico non aggiunge niente */
sito.calmo = 40
await blocco('la riga in home', () => conTelefono(sito, async ({ page }) => {
  await page.waitForSelector('[data-scarico]', { timeout: 20000 })
  const posto = await page.locator('[data-scarico]').evaluate(el => ({
    fissa: getComputedStyle(el).position === 'fixed', dentroPiede: !!el.closest('.home') }))
  uguale('non galleggia sopra la schermata', posto.fissa, false)
  uguale('sta nella home', posto.dentroPiede, true)
  await page.locator('[data-scarico]').scrollIntoViewIfNeeded()
  await scatto(page, 'scarico-home')
  const visti = new Set()
  await finche(30000, async () => {
    const testo = await riga(page)
    if (testo) visti.add(testo)
    return visti.size >= 20 || !(await mancano(page))
  })
  controlla(`la riga si muove mentre scarica (${visti.size} testi diversi)`, visti.size >= 20)
}))

await appeso
await sito.chiudi()
riassunto('Lo scarico dei giochi')
