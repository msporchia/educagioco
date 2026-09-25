/* La bancarella: due clienti serviti da cima a fondo — si prende dalle
   ceste quello che hanno chiesto, poi si posano le monete sul piatto una
   alla volta finché il resto non è quello giusto, e se ne vanno contenti.

   Si entra nella prima giornata (`.giornata:not(.chiusa)`, sempre
   aperta): è la più semplice della campagna, quella dove la cassa somma
   ancora da sola — le giornate col totale da battere sulla tastiera o
   col resto a mente vengono dopo, e per questa clip servirebbero solo
   passi in più senza aggiungere niente da vedere. Arrivare al banco
   scrive `cambio.value` per un secondo e mezzo fisso (il cartello della
   tappa, vedi `apriTappa` in `BancarellaGame.vue`), e SUBITO dopo il
   primo cliente saluta ("Buongiorno!") per un altro secondo e poco più
   prima di dire cosa vuole (`alBanco`, lo stesso file): due tempi morti
   che nessun tocco della ricetta accorcia. Si aspettano tutti e due PRIMA
   di registrare — dentro `passi`, che `scatti.mjs` non riprende — così la
   clip comincia già col cliente che chiede, e il primo tocco arriva entro
   mezzo secondo dal primo fotogramma invece che dopo un cartello e un
   saluto guardati a vuoto.

   Si gioca dal gancio di prova `window.__shop`, come in
   `test/integrazione/bancarella.test.mjs`: cosa chiede il cliente si
   legge da `S.cliente.value.articoli` (mai scritto a mano) e si tocca la
   cesta vera, `.cesta[data-em="<emoji>"]`. Il resto si dà **una moneta
   alla volta ricalcolata dal vero**: si rilegge `S.manca.value` (quanto
   resta da dare adesso, non quanto si era calcolato all'inizio) e si
   chiede a `S.scomponi` — la stessa funzione che il gioco usa per
   giudicare se il resto è minimo — solo il taglio più grande che serve
   *ora*, poi lo si tocca sul vero scomparto del cassetto,
   `.scomparto[data-v="<valore>"]`. Ricalcolare a ogni giro invece di
   fare tutta la lista in un colpo solo e poi tirarla via a memoria è la
   guardia: se un tocco non fosse arrivato a segno (il dito, un ritardo,
   un client che nel frattempo è cambiato) il giro dopo legge di nuovo
   `manca` e chiede di nuovo la moneta giusta, invece di continuare a
   offrirne una che il piatto non aspetta più.

   Il secondo cliente si serve allo stesso modo, dalla stessa funzione:
   la coda va avanti da sola (`prossimo()`, 900 ms dopo aver pagato) e la
   ricetta rilegge `S.cliente.value` invece di portarsi dietro quello di
   prima — è così che si vede il ritmo di un banco vero, non solo un
   cliente isolato.

   Dipende da `window.__shop` (`cliente`, `momento`, `manca`, `scomponi`)
   e dai selettori `.giornate`, `.giornata:not(.chiusa)`, `.cesta[data-em]`,
   `.scomparto[data-v]`: se uno cambia forma, è qui che va aggiornata la
   ricetta. */

async function servi (page) {
  const emoji = await page.evaluate(() => {
    const S = window.__shop
    return S.cliente.value ? S.cliente.value.articoli.flatMap(a => Array(a.quanti).fill(a.emoji)) : []
  })
  for (const em of emoji) {
    await page.locator(`.cesta[data-em="${em}"]`).click({ timeout: 2000 }).catch(() => {})
    await page.waitForTimeout(320)              // una cesta alla volta, ritmo umano
  }
  await page.waitForFunction(() => window.__shop.momento.value === 'cassa',
    null, { timeout: 4000 }).catch(() => {})
  await page.waitForTimeout(500)                 // lo scontrino si legge

  // il resto, un taglio alla volta: ogni giro rilegge `manca` dallo stato
  // vero invece di fidarsi di un conto fatto all'inizio (vedi sopra)
  for (let i = 0; i < 6; i++) {
    const v = await page.evaluate(() => {
      const S = window.__shop
      if (!S.cliente.value || S.momento.value !== 'cassa' || S.manca.value <= 0) return 0
      return S.scomponi(S.manca.value, S.cliente.value.monete)[0] || 0
    })
    if (!v) break
    await page.locator(`.scomparto[data-v="${v}"]`).first().click({ timeout: 2000 }).catch(() => {})
    await page.waitForTimeout(360)              // una moneta alla volta
  }
}

export default {
  file: 'clip-bancarella', dove: 'bancarella', attesa: '.giornate',
  // 1500 ms di cartello + ~1150 di saluto prima che il cliente dica cosa
  // vuole (`apriTappa`/`alBanco` in `BancarellaGame.vue`): si aspettano
  // qui, fuori dalla registrazione.
  passi: [['.giornata:not(.chiusa)', 2700]],
  clip: {
    secondi: 9,
    async durante (page) {
      await servi(page)
      await page.waitForTimeout(900)             // il cliente ringrazia e lascia il posto

      // il secondo cliente: la coda è già avanzata da sola nell'attesa qui
      // sopra (`prossimo()`, 900 ms dopo il pagamento)
      await servi(page)
      await page.waitForTimeout(500)
    },
  },
}
