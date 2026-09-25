/* Il Dungeon a bivi: si entra in una stanza con un mostro, arriva la
   domanda che decide lo scontro, e rispondendo giusto si vede il colpo
   andare a segno — la barra vita che scende. È il gioco che rende più
   visibile la promessa del quiz nei giochi nuovi — «la domanda È il
   passaggio» — quindi la clip deve mostrare proprio quel giro: stanza →
   domanda → colpo (e a volte il mostro cade lì per lì: capita, con
   mostri deboli, e va benissimo).

   La risposta giusta la dice la pagina: `quiz/Domanda.vue` segna il suo
   tasto con `data-giusta` (a schermo non si vede). Si tocca quello, e
   solo quello: una clip che sbaglia fa vedere quattro secondi di attesa
   e un mostro che morde, cioè il contrario di quello che deve mostrare.

   Una domanda è «nuova» quando nessun tasto ha ancora il suo colore
   (`giusta`/`sbagliata`/`spenta`): `Domanda.vue` non si rimonta da un
   colpo all'altro, quindi i tasti ci sono già e aspettarne la comparsa
   non direbbe niente — è il colore che si spegne quando arriva quella
   dopo. Poi si lascia un momento per leggerla (`LEGGE`), e si tocca.

   Dipende da: `.dng-tappa[data-tappa]` (la mappa), `.dng-stanza.dng-aperta`
   con `data-tipo="mostro"` (non uno scrigno: lì una domanda sola, e la
   clip vuole il giro dei colpi), `.qz-tasto[data-giusta]` e le sue tre
   classi. Se uno di questi cambia forma, la clip resta sulla domanda
   senza rispondere: è lì che si guarda. */

/* quanto si guarda una domanda prima di rispondere: più della finestra
   cieca di `Domanda.vue` (320 ms), e abbastanza da leggerla in un video */
const LEGGE = 1100

export default {
  file: 'clip-dungeon', dove: 'dungeon', attesa: '.dng-tappe',
  passi: [['.dng-tappa[data-tappa="0"]', 900]],
  clip: {
    secondi: 8,
    async durante (page) {
      const fine = Date.now() + 7000
      await page.waitForTimeout(250)                  // la mappa si vede, poi si tocca
      const mostro = page.locator('.dng-stanza.dng-aperta[data-tipo="mostro"]').first()
      const stanza = (await mostro.count()) ? mostro : page.locator('.dng-stanza.dng-aperta').first()
      await stanza.click({ timeout: 3000 }).catch(() => {})

      while (Date.now() < fine) {
        /* la domanda nuova: c'è il tasto giusto, e nessun colore ancora */
        const nuova = await page.waitForFunction(() =>
          document.querySelector('.qz-tasto[data-giusta]') &&
          !document.querySelector('.qz-tasto.giusta, .qz-tasto.sbagliata, .qz-tasto.spenta'),
          null, { timeout: Math.max(100, fine - Date.now()) }).then(() => true, () => false)
        if (!nuova) break                             // il mostro è caduto, o il tempo è finito
        await page.waitForTimeout(LEGGE)
        await page.locator('.qz-tasto[data-giusta]').click({ timeout: 1000 }).catch(() => {})
      }
    },
  },
}
