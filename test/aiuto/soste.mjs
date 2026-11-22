/* ═══════════════════════════════════════════════════════════════════
   LA PARTITA LASCIATA A METÀ, NEL BROWSER (docs/core/ripresa.md)

   Ogni gioco la prova coi suoi gesti, ma i passi attorno sono gli stessi
   dappertutto: ← e la carta `[data-ripresa]` in cima alla mappa, «riprendi»,
   la pagina che sparisce e si ricarica, una tappa nuova che chiede prima
   (`[data-chiede]`), «lascio perdere». Stanno qui una volta, con le attese
   giuste: il gioco rimanda le scritture di 350 ms e la sosta si guarda
   quando è scritta, non nell'istante dopo il tocco.
   ═══════════════════════════════════════════════════════════════════ */
import { leggiProfilo } from './browser.mjs'

/* Aspetta che `fa()` dia un valore che va bene a `ok`, al più `ms`; torna l'ultimo valore letto, così il controllo dopo
   dice cosa c'era davvero. Un'attesa, non un controllo: chi la usa confronta il valore con `uguale`. */
export async function finche(fa, ok = v => !!v, ms = 5000, passo = 100) {
  const fine = Date.now() + ms
  let v = await fa()
  while (!ok(v) && Date.now() < fine) {
    await new Promise(r => setTimeout(r, passo))
    v = await fa()
  }
  return v
}

/* Gli attrezzi di un gioco: `entra()` porta dalla home alla sua mappa, `chiave` è la sua voce in `profile.campagne`.
   `alla` è quello che si aspetta dopo ← (la mappa del gioco). */
export function soste(page, { entra, chiave, alla }) {
  const carta = () => page.locator('[data-ripresa]')
  const testo = async () => (await carta().first().textContent()).replace(/\s+/g, ' ').trim()
  return {
    carta,
    // il testo della carta, aspettandola: dopo ← la mappa la disegna un attimo dopo
    async cartaDice() {
      await page.waitForSelector('[data-ripresa]', { timeout: 5000 })
      return testo()
    },
    quanteCarte: () => carta().count(),
    async esci() {
      await page.click('button[aria-label="indietro"]')
      await page.waitForSelector(alla, { timeout: 5000 })
    },
    async riprendi() {
      await page.click('[data-ripresa] [data-azione="riprendi"]')
    },
    // «lascio perdere»: la carta se ne va (un fotogramma dopo il tocco)
    async scorda() {
      await page.click('[data-ripresa] [data-azione="scorda"]')
      await page.waitForSelector('[data-ripresa]', { state: 'detached', timeout: 3000 })
    },
    // un'altra tappa toccata con una sosta in corso chiede prima; `scelta`: 'riprendi-invece' o 'comincia'
    async chiede(tocca, scelta) {
      await (typeof tocca === 'function' ? tocca() : page.click(tocca))
      await page.waitForSelector('[data-chiede]', { timeout: 3000 })
      if (scelta) await page.click(`[data-chiede] [data-azione="${scelta}"]`)
    },
    /* la pagina che sparisce (il telefono in tasca, l'app chiusa): `pagehide` scrive subito quello che era in coda, poi si
       ricarica e si torna alla mappa. Si aspetta la sosta scritta, non un tempo: `scritta` dice com'è quella giusta */
    async ricarica(scritta = s => !!s) {
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
      await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
      await this.sosta(scritta)
      await page.reload()
      await page.waitForSelector('.carte', { timeout: 10000 })
      await entra()
    },
    /* la sosta com'è sul disco, aspettando che sia quella attesa (al più `ms`): l'archivio scrive 350 ms dopo, e con altri
       test accanto anche di più. Torna quella che c'è, per il controllo dopo */
    sosta: (attesa = () => true, ms = 5000) =>
      finche(async () => ((await leggiProfilo(page))?.campagne?.[chiave]?.sosta) ?? null, attesa, ms, 50),
    // le monete scritte nel profilo: `leggiProfilo` aspetta da sé la scrittura rimandata dei 350 ms
    monete: async () => (await leggiProfilo(page))?.coins || 0,
  }
}
