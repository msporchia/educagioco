/* ═══════════════════════════════════════════════════════════════════
   IL TASTO «SALTA»: LA LEVA DI #admin, LA DOMANDA COMUNE, E DENTRO I GIOCHI

   perché: la leva di #admin (spenta di partenza, del telefono) e il «salta» della domanda comune che passa alla domanda dopo; dentro ogni gioco che lo ha nella sua vista il salto paga ma non cambia ripasso, contatori e record, letto dal profilo su disco prima e dopo
   a parte perché: i motori col salto suo (inglese, pozioni, prima e dopo, codice segreto) li prova `unita/salto`; il sotterraneo, che vuole un piano e una porta, `sotterraneo-porte-scale`


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
   La leva si accende da `#admin` (il primo blocco la tocca davvero); nei
   giochi si scrive in archivio come farebbe il tocco, per non rifare il
   giro in ogni gioco.
   Il sotterraneo, che vuole un piano e una porta, sta in
   `sotterraneo-porte-scale`. Vedi docs/core/comandi.md.
   `node test/esegui.mjs integrazione/salto-giochi --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco, azzera, semina, attendi, scegli, leggiProfilo, domandaPronta }
  from '../aiuto/browser.mjs'
import { grandi } from '../aiuto/genitori.mjs'
import { chiudiTraguardi } from '../aiuto/traguardi.mjs'
import { controlla, uguale, nota, riassunto, blocco } from '../aiuto/verifica.mjs'

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

/* ═══════════ 0. la leva di #admin, e la domanda comune ═══════════
   Serve a chi sviluppa, per passare le domande senza pensare alle risposte. La leva sta in `#admin`, spenta di partenza,
   del telefono e non di un bambino; accesa, la Domanda comune (`quiz/Domanda.vue`), raggiunta dal banco di prova dei grandi,
   ha un «⏭️ salta» che la dà per giusta e passa alla domanda dopo. */
await blocco('la leva e la domanda comune', async () => {
  await page.evaluate(() => { location.hash = 'admin' })
  await page.waitForSelector('[data-admin]', { timeout: 5000 })
  const leva = page.locator('[data-azione="tasto-salta"]')
  controlla('la leva c\'è in #admin', await leva.count() === 1)
  controlla('di partenza è spenta', await page.locator('[data-azione="tasto-salta"].acceso').count() === 0)
  const { entra, apriBlocco } = grandi(page)
  // dalla pagina dei trucchi a una domanda del quadro dei grandi: senza il #admin nell'indirizzo, si ricarica
  async function apriProva() {
    await tornaInHome()
    await entra()
    await page.click('[data-scheda="bambini"]')
    await page.waitForSelector('[data-manopola] .quadro', { timeout: 5000 })
    if (!(await apriBlocco('medie'))) return false
    await page.locator('[data-manopola] [data-apri="medie"] .prova').first().click()
    await page.waitForSelector('.qz-tasto', { timeout: 5000 })
    await domandaPronta(page)   // la finestra cieca del montaggio
    return true
  }
  controlla('si arriva a una domanda dal banco dei grandi', await apriProva())
  uguale('spenta, la domanda non ha nessun «salta»', await page.locator('[data-azione="salta"]').count(), 0)
  await page.evaluate(() => { location.hash = 'admin' })
  await page.waitForSelector('[data-admin]', { timeout: 5000 })
  await leva.click()
  controlla('toccata si accende', await page.locator('[data-azione="tasto-salta"].acceso').count() === 1)
  await leggiProfilo(page)   // l'archivio ha scritto
  await page.reload()
  await page.waitForSelector('[data-admin]', { timeout: 10000 })
  controlla('ricaricando resta accesa: è del telefono', await page.locator('[data-azione="tasto-salta"].acceso').count() === 1)
  controlla('si arriva di nuovo a una domanda', await apriProva())
  const tasto = page.locator('.qz-carta [data-azione="salta"]')
  controlla('accesa, la domanda ha il suo «salta»', await tasto.isVisible())
  await tasto.click()
  await page.waitForSelector('[data-saltata]', { timeout: 2000 })
  controlla('la risposta si accende come giusta', await page.locator('.qz-tasto.giusta').count() > 0)
  uguale('e non si salta due volte: il tasto sparisce', await page.locator('.qz-carta [data-azione="salta"]').count(), 0)
  await page.waitForFunction(() => !document.querySelector('[data-saltata]'), null, { timeout: 5000 })
  controlla('si passa a una domanda nuova, che ha di nuovo il suo tasto',
            await page.waitForSelector('.qz-carta [data-azione="salta"]', { timeout: 3000 }).then(() => true, () => false))
})

/* ---------- 1. asteroidi ---------- */
await nuovo()
await scegli(page, 'mate')
await page.waitForFunction(() => window.__mate, null, { timeout: 5000 })
await page.evaluate(() => window.__mate.inizia(0))
await page.waitForFunction(() => window.__mate.fase.value === 'gioco', null, { timeout: 5000 })
await page.waitForSelector('[data-azione="salta"]', { state: 'visible', timeout: 3000 }).catch(() => {})
{
  controlla('asteroidi: il tasto c\'è', await salta.isVisible())
  const prima = await leggi()
  await chiudiTraguardi(page)   // il cartello di un traguardo (la prima partita) copre il tasto
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
await page.waitForFunction(() => window.__td.fase.value === 'gioco' && window.__td.postazioni().length > 0, null, { timeout: 5000 })
await page.evaluate(() => window.__td.scegliTorre('add'))
await page.waitForSelector('.tastiera button', { timeout: 3000 })
{
  controlla('castello: il conto ha il suo tasto', await salta.isVisible())
  const primo = await leggi(), prima = primo.foto
  await chiudiTraguardi(page)   // il cartello di un traguardo (la prima partita) copre il tasto
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
  await chiudiTraguardi(page)   // il cartello di un traguardo (la prima partita) copre il tasto
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
await page.waitForSelector('[data-azione="salta"]', { state: 'visible', timeout: 3000 }).catch(() => {})
{
  const prima = await leggi()
  controlla('conta: la domanda ha il suo tasto', await salta.isVisible())
  await chiudiTraguardi(page)   // il cartello di un traguardo (la prima partita) copre il tasto
  await salta.click()
  const dopo = await dopoIlSalto(prima.soldi)
  controlla('conta: le monete sono salite', dopo.soldi > prima.soldi, `${prima.soldi} → ${dopo.soldi}`)
  uguale('conta: ripasso e contatori intatti', dopo.foto, prima.foto)
}

await tornaInHome()
uguale('nessun errore in console', errori.join(' · '), '')
await browser.close()
nota('la leva, la domanda comune; asteroidi, castello, bancarella, conta')
riassunto('il tasto salta: la leva, la domanda comune, e dentro i giochi')
