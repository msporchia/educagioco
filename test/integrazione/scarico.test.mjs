/* ═══════════════════════════════════════════════════════════════════
   LO SCARICO DEI GIOCHI, COL SERVICE WORKER VERO

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
   ═══════════════════════════════════════════════════════════════════
   tempo: 300 */
import { join } from 'node:path'
import { apriGioco, apriTelefono, attendi, RADICE, scatto } from '../aiuto/browser.mjs'
import { apriSito } from '../aiuto/sito.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const sito = await apriSito({ cartella: join(RADICE, 'dist-sito') })
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

// un telefono nuovo a ogni prova: lo scarico riparte da zero
async function conTelefono (fai, opzioni) {
  const telefono = await apriTelefono()
  try {
    return await fai(await apriGioco(telefono, { indirizzo: sito.indirizzo, ...opzioni }))
  } finally {
    await telefono.close()
  }
}

/* 1. Il service worker muore a metà, dentro un gioco. Il telefono lo fa quando vuole: passati i cinque minuti di un evento
   (Chrome), per la memoria, per la batteria. Nessun ritorno in primo piano, nessun tocco: deve ripartire da solo */
sito.calmo = 40
await conTelefono(async ({ page }) => {
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
  controlla(`col service worker morto a ${dopo} file dalla fine lo scarico arriva in fondo da solo`,
    await finche(90000, async () => !(await mancano(page))))
  controlla('e neanche finito dentro il gioco si vede niente', !(await page.locator('[data-scarico]').count()))
}, { hash: 'conta', attesa: null })

/* 2. Un file che non risponde: senza un tetto la sua attesa non finisce mai, e con lei tutto quello che viene dopo */
const nomeDi = g => FILE.filter(f => f[2] === g).sort((a, b) => a[1] - b[1])[0][0].slice(2)
const fermo = nomeDi('passo-passo')
sito.calmo = 5
sito.appeso = new RegExp(fermo)
await conTelefono(async ({ page }) => {
  controlla('un file appeso non ferma gli altri', await finche(70000, async () => await mancano(page) === 1))
  sito.appeso = null
  controlla('e quando risponde arriva anche lui, da solo', await finche(120000, async () => !(await mancano(page))))
})

/* 3. Un file che non c'è più: il sito è passato a un'altra versione, e si va a vedere */
const swChiesti = () => sito.richieste.filter(r => r.percorso === '/sw.js').length
const swPrima = swChiesti()
sito.sparito = new RegExp(nomeDi('castello'))
await conTelefono(async ({ page }) => {
  controlla('un file sparito non ferma gli altri', await finche(40000, async () => await mancano(page) === 1))
  await page.waitForSelector('[data-scarico]', { timeout: 5000 })
  controlla('e lo si dice senza allarmi', /riprende da solo/.test(await page.locator('[data-scarico]').innerText()))
  await scatto(page, 'scarico-fermo')
  controlla('e il service worker va a vedere se ce n\'è uno nuovo', await finche(5000, async () => swChiesti() >= swPrima + 2))
  sito.sparito = null
  controlla('e quando torna arriva anche lui', await finche(120000, async () => !(await mancano(page))))
})

/* 4. Un file della base che manca fa cadere la prima installazione, e con lei la registrazione: si rifà da qui.
   Un'immagine e non un file di codice: la home deve aprirsi */
const FUORI_DALLA_HOME = FILE.filter(f => !f[2] && !/\.(js|css|woff2)$/.test(f[0])).sort((a, b) => a[1] - b[1])[0][0].slice(2)
sito.sparito = new RegExp(FUORI_DALLA_HOME)
await conTelefono(async ({ page }) => {
  const fermo = await finche(15000, async () => /riprende da solo/.test(await page.locator('[data-scarico]').innerText({ timeout: 500 }).catch(() => '')))
  controlla('senza la base il service worker non si installa', fermo)
  uguale('e non resta niente di attivo', await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.active), false)
  sito.sparito = null
  controlla('e quando il file torna si installa da solo, giochi compresi', await finche(150000, async () => !(await mancano(page))))
})

/* 5. Nella home: una riga in fondo, non sopra, che si muove a ogni file e non a ogni gioco */
sito.calmo = 40
await conTelefono(async ({ page }) => {
  await page.waitForSelector('[data-scarico]', { timeout: 20000 })
  const visti = new Set()
  await finche(60000, async () => {
    const riga = page.locator('[data-scarico]')
    if (await riga.count()) visti.add(await riga.innerText().catch(() => ''))
    return !(await mancano(page))
  })
  controlla(`la riga si muove mentre scarica (${visti.size} testi diversi)`, visti.size >= 20)
})
sito.calmo = 40
await conTelefono(async ({ page }) => {
  await page.waitForSelector('[data-scarico]', { timeout: 20000 })
  const posto = await page.locator('[data-scarico]').evaluate(el => ({
    fissa: getComputedStyle(el).position === 'fixed', dentroPiede: !!el.closest('.home') }))
  uguale('non galleggia sopra la schermata', posto.fissa, false)
  uguale('sta nella home', posto.dentroPiede, true)
  await page.locator('[data-scarico]').scrollIntoViewIfNeeded()
  await scatto(page, 'scarico-home')
})

await sito.chiudi()
riassunto('Lo scarico dei giochi')
