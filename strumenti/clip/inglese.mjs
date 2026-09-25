/* English: si tocca la figura giusta, e il riquadro diventa verde prima
   che arrivi la domanda dopo — è quel verde («l'esito visibile») a dire
   che il gioco ha capito la risposta, non solo che è cambiata la scritta.

   `profilo` riporta `campagne.eng.tappa` a zero: il profilo finto di
   `scatti.mjs` ha già superato le prime tappe, e da lì in poi i turni
   sono parole scritte — la prima tappa è invece «tocca la figura», sei
   riquadri con un'icona sola, il turno più chiaro da far vedere in pochi
   secondi (vedi `test/integrazione/inglese.test.mjs`, dove la prima
   tappa è proprio questa).

   Si entra dal primo `.tappa:not(.chiusa)` e si gioca dal gancio di
   prova `window.__lingua`: la risposta giusta si legge da
   `g.turno.value.opzioni` (mai scritta a mano — l'ordine delle opzioni è
   mescolato a ogni turno) e si tocca il bottone vero,
   `.scelta[data-i="<indice>"]`, invece di chiamare `rispondi()` a mano,
   perché è il tocco quello che accende il verde. Tre turni, con una
   pausa per leggere la domanda e una per lasciar vedere l'esito.

   Dipende da `window.__lingua` (`fase`, `turno`) e dai selettori
   `.mappa`, `.tappa:not(.chiusa)`, `.scelta[data-i]`: se uno cambia
   forma, è qui che va aggiornata la ricetta. */
export default {
  file: 'clip-inglese', dove: 'inglese', attesa: '.mappa',
  profilo: p => { p.eng = { tappa: 0, libera: false }; return p },
  passi: [['.tappa:not(.chiusa)', 900]],
  clip: {
    secondi: 8,
    async durante (page) {
      for (let turno = 0; turno < 3; turno++) {
        const idx = await page.evaluate(() => {
          const g = window.__lingua
          if (!g || g.fase.value !== 'gioco' || !g.turno.value) return -1
          return g.turno.value.opzioni.findIndex(o => o.giusta)
        })
        if (idx < 0) break
        await page.waitForTimeout(500)              // un momento per leggere/guardare
        await page.locator(`.scelta[data-i="${idx}"]`).click({ timeout: 2000 }).catch(() => {})
        await page.waitForTimeout(750)              // il verde resta a schermo
      }
    },
  },
}
