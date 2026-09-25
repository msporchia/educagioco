/* Conta gli animali: la tappa 0, «Il primo gregge», giocata per intero —
   quattro domande vere, ognuna con la sua risposta contata davvero, e il
   cartello di fine tappa con le stelle. Niente da leggere, niente da
   indovinare: è il gioco più semplice dell'applicazione, e la clip deve
   mostrare esattamente questo.

   La risposta giusta **non si scrive mai a mano**: per il verbo
   «quanti» (`motore/scena.js`, `genQuanti`) i gettoni in scena sono
   *tutti* bersaglio — nessun intruso, un solo gruppo — quindi il numero
   giusto è semplicemente quanti `.ct-gettone` ci sono nel DOM in quel
   momento. Lo si conta a runtime e si cerca fra i tasti `.ct-cifra`
   quello il cui testo coincide: se un giorno «quanti» guadagnasse dei
   distrattori, o le opzioni cambiassero forma, il conto non
   tornerebbe più e la clip lo direbbe restando ferma su una domanda.

   La tappa 0 è scelta apposta: è quella di cui CLAUDE.md dice che
   «mette in campo fino a cinque cose e sceglie la specie da sé» — un
   solo gruppo, mai un intruso, mai un'attesa (`piuUno`/`stessi` hanno un
   tempo morto voluto che qui non serve) — e le sue quattro `partite`
   finiscono dentro il tempo della clip, arrivando al cartello
   `.ct-cartello` di `viste/Finale.vue`.

   `profilo` porta `campagne.conta.tappa` già a 1 e `best.serieConta`
   già a 3 **prima** di giocare: senza, la tappa che qui si rigioca e il
   filotto di quattro risposte di fila sarebbero i primi in assoluto per
   quelle chiavi, e il cartello globale dei traguardi
   (`components/Traguardo.vue`, montato in `App.vue`) si aprirebbe sopra
   tutto — è il conto di `store/progressi.js` (`tappeDi`, che legge
   proprio `campagne.conta.tappa`, non un contatore a parte), scoperto
   registrando la prima versione di questa clip: bastava finire *una*
   tappa mai fatta prima per veder comparire «Supera 6 tappe di Conta
   gli animali» in mezzo alla scena. Vedi come `passo.mjs` evita lo
   stesso guasto sulla sua campagna. */
const TAPPA = 0

export default {
  file: 'clip-conta', dove: 'conta', attesa: '.ct-tappe',
  profilo: p => {
    p.campagne = { ...p.campagne, conta: { tappa: 1, libera: false, stelle: {}, cfg: {} } }
    p.best = { ...p.best, serieConta: 3 }
    return p
  },
  passi: [[`.ct-tappa[data-tappa="${TAPPA}"]`, 900]],
  clip: {
    secondi: 8,
    async durante (page) {
      await page.waitForTimeout(400)                    // la prima domanda si legge
      for (let i = 0; i < 4; i++) {
        const n = await page.locator('.ct-gettone').count()
        if (!n) break                                    // niente da contare: fermarsi qui
        const testi = await page.locator('.ct-cifra').allTextContents()
        const idx = testi.findIndex(t => t.trim() === String(n))
        if (idx < 0) break                                // le opzioni non hanno il numero giusto
        await page.waitForTimeout(550)                    // il tempo di contare uno per uno
        await page.locator('.ct-cifra').nth(idx).click()
        await page.waitForTimeout(600)                    // il suono, la moneta, la domanda dopo
      }
      await page.waitForSelector('.ct-cartello', { timeout: 2500 }).catch(() => {})
      await page.waitForTimeout(1200)                     // le stelle si leggono
    },
  },
}
