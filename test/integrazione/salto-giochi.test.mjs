/* ═══════════════════════════════════════════════════════════════════
   IL TASTO «SALTA» DENTRO I GIOCHI: PAGA, MA NON SPORCA IL RESTO

   perché: il «salta» dentro ogni gioco paga ma non cambia ripasso, contatori e record, letto dal profilo su disco prima e dopo
   a parte perché: parte da una semina in archivio senza rifare il giro in ogni gioco; salto prova la leva e la domanda comune, qui sono i giochi (potrebbe riceverlo)

   Ogni gioco che fa domande ha il suo «⏭️ salta», e in ognuno vale la
   stessa regola: la partita va avanti e paga come se avesse risposto bene
   (le monete salgono), ma **il resto del profilo non cambia** — né il
   ripasso (`items`), né i contatori e i record (`totals`, `best`). Si prova
   guardando il profilo su disco prima e dopo il salto, gioco per gioco: un
   salto che si limitasse a chiamare «la risposta giusta» passerebbe da
   tutti i controlli di schermo e annoterebbe e conterebbe.
   Qui i giochi il cui salto non passa da un motore provato a parte; quelli
   che ce l'hanno (inglese, pozioni, prima e dopo, codice segreto: la tappa
   saltata fino in fondo, le monete, niente ripasso) li prova `unita/salto`.
   La leva si accende da `#admin` (`salto`); qui si scrive in archivio
   come farebbe il tocco, per non rifare il giro in ogni gioco.
   Il sotterraneo, che vuole un piano e una porta, sta in
   `salto-sotterraneo`. Vedi docs/core/comandi.md.
   `node test/esegui.mjs salto-giochi --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, leggiProfilo }
  from '../aiuto/browser.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const browser = await apriBrowser()
const { page, errori } = await apriGioco(browser)
await azzera(page)

/* accende la leva come la accenderebbe #admin: la stessa chiave, lo stesso oggetto */
async function accendiLaLeva() {
  await page.evaluate(() => new Promise((ok, ko) => {
    const r = indexedDB.open('giochi-bambini', 1)
    r.onerror = () => ko(new Error('IndexedDB non si apre'))
    r.onsuccess = () => {
      const tx = r.result.transaction('kv', 'readwrite')
      tx.objectStore('kv').put({ acceso: true }, 'tasto-salta')
      tx.oncomplete = ok
      tx.onerror = () => ko(new Error('scrittura fallita'))
    }
  }))
}
/* il profilo senza quello che si muove da sé e senza le monete, che un salto paga: il ripasso, i contatori, i record;
   e a parte il salvadanaio, che un salto riempie come una giusta */
const leggi = async () => {
  const p = (await leggiProfilo(page)) || {}
  const { monete, ...totals } = p.totals || {}          // quanto è entrato nel salvadanaio sale col salto, come le monete
  return { foto: JSON.stringify({ items: p.items || {}, totals, best: p.best || {} }), soldi: p.coins || 0 }
}
/* dopo il salto: si aspetta che le monete salgano (il gioco le scrive quando chiude il conto), poi si fotografa il resto */
const dopoIlSalto = async soldiPrima => {
  let ora = await leggi()
  for (let k = 0; k < 15 && ora.soldi <= soldiPrima; k++) { await attendi(page, 200); ora = await leggi() }
  return ora
}
const salta = page.locator('[data-azione="salta"]')
/* si riparte da zero, con la leva accesa e un profilo di quell'età */
async function nuovo(profilo = { settings: { eta: 8 } }) {
  await azzera(page)
  await accendiLaLeva()
  await semina(page, profilo)
}
async function tornaInHome() {
  await page.evaluate(() => history.replaceState(null, '', location.pathname))
  await page.reload()
  await page.waitForSelector('.carte', { timeout: 10000 })
}

/* ---------- 1. asteroidi ---------- */
await nuovo()
await scegli(page, 'mate')
await page.waitForFunction(() => window.__mate, null, { timeout: 5000 })
await page.evaluate(() => window.__mate.inizia(0))
await page.waitForFunction(() => window.__mate.fase.value === 'gioco', null, { timeout: 5000 })
await attendi(page, 500)
{
  controlla('asteroidi: il tasto c\'è', await salta.isVisible())
  const prima = await leggi()
  await salta.click()
  await page.waitForFunction(() => window.__mate.hud.giuste > 0, null, { timeout: 3000 }).catch(() => {})
  uguale('asteroidi: il sasso giusto è dato per centrato', await page.evaluate(() => window.__mate.hud.giuste), 1)
  uguale('asteroidi: senza punti', await page.evaluate(() => window.__mate.hud.punti), 0)
  uguale('asteroidi: senza filotto', await page.evaluate(() => window.__mate.hud.serie), 0)
  const dopo = await dopoIlSalto(prima.soldi)
  controlla('asteroidi: le monete sono salite', dopo.soldi > prima.soldi, `${prima.soldi} → ${dopo.soldi}`)
  uguale('asteroidi: ripasso e contatori intatti', dopo.foto, prima.foto)
}

/* ---------- 2. castello ---------- */
await nuovo()
await scegli(page, 'torri')
await page.waitForSelector('.tappe')
await page.evaluate(() => window.__td.inizia(0))
await attendi(page, 800)
await page.evaluate(() => window.__td.scegliTorre('add'))
await page.waitForSelector('.tastiera button', { timeout: 3000 })
{
  controlla('castello: il conto ha il suo tasto', await salta.isVisible())
  const primo = await leggi(), prima = primo.foto
  await salta.click()
  await page.waitForFunction(() => window.__td.op.value === null, null, { timeout: 3000 }).catch(() => {})
  uguale('castello: il conto si chiude', await page.evaluate(() => window.__td.op.value), null)
  controlla('castello: e la torre c\'è', await page.evaluate(() => window.__td.torri().length) === 1)
  /* la torre è costruita davvero, e `totals.torri` conta le torri in piedi, non le risposte: sale di uno.
     Tutto il resto del profilo resta com'era. */
  const ultimo = await dopoIlSalto(primo.soldi)
  controlla('castello: le monete sono salite', ultimo.soldi > primo.soldi, `${primo.soldi} → ${ultimo.soldi}`)
  const dopo = JSON.parse(ultimo.foto), era = JSON.parse(prima)
  uguale('castello: le torri costruite sono una', dopo.totals.torri, (era.totals.torri || 0) + 1)
  dopo.totals.torri = era.totals.torri
  uguale('castello: ripasso e contatori intatti', JSON.stringify(dopo), JSON.stringify(era))
}

/* ---------- 3. bancarella ---------- */
await nuovo()
await scegli(page, 'bancarella')
await page.waitForSelector('[data-cucine]', { timeout: 5000 })
await page.click('[data-cucina-n="1"]')
await page.waitForFunction(() => !window.__shop.cambio.value, null, { timeout: 5000 })
await page.evaluate(() => { const S = window.__shop; S.momento.value = 'cassa' })
{
  const inFila = () => page.evaluate(() => window.__shop.coda.value.length)
  const prima = await leggi()
  const quanti = await inFila()
  controlla('bancarella: la cassa ha il suo tasto', await salta.isVisible())
  await salta.click()
  await page.waitForFunction(n => window.__shop.coda.value.length < n || !!window.__shop.cambio.value, quanti,
                             { timeout: 4000 })
  uguale('bancarella: nessun cliente servito', await page.evaluate(() => window.__shop.hud.serviti), 0)
  const dopo = await dopoIlSalto(prima.soldi)
  controlla('bancarella: le monete sono salite', dopo.soldi > prima.soldi, `${prima.soldi} → ${dopo.soldi}`)
  uguale('bancarella: ripasso e contatori intatti', dopo.foto, prima.foto)
}

/* ---------- 4. conta gli animali ---------- */
await nuovo({ settings: { eta: 5 } })
await scegli(page, 'conta')
await page.locator('.ct-tappa[data-tappa="0"]').click()
await page.waitForSelector('.ct-scena', { timeout: 5000 })
await attendi(page, 500)
{
  const prima = await leggi()
  controlla('conta: la domanda ha il suo tasto', await salta.isVisible())
  await salta.click()
  const dopo = await dopoIlSalto(prima.soldi)
  controlla('conta: le monete sono salite', dopo.soldi > prima.soldi, `${prima.soldi} → ${dopo.soldi}`)
  uguale('conta: ripasso e contatori intatti', dopo.foto, prima.foto)
}

await tornaInHome()
uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
nota('asteroidi, castello, bancarella, conta')
riassunto('il tasto salta dentro i giochi — paga, ma non sporca il resto')
