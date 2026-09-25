/* Asteroidi: la nave spazza il cielo e il bambino tocca il sasso con la
   risposta giusta. La clip fa vedere sei colpi di fila — la domanda in
   cima, il sasso giusto che scende, il tocco, l'esplosione — perché uno
   solo non basta a capire che è un ritmo e non un colpo di fortuna.

   Si entra nel pianeta **a cui è arrivato** il profilo finto (`.scaletta .ora`,
   il segno della mappa per «sei qui», pianeta o stazione), non nel primo: al primo pianeta
   scende un sasso alla volta, piano, e il 2×2 non racconta il gioco. Quale sasso è
   quello giusto lo dice il gancio di prova `window.__mate`
   (`asteroidi()`, il campo `ok`) — mai scritto a mano, così la clip
   regge se la miscela delle domande cambia — ma il colpo è **un tocco
   vero** sul sasso, perché il cerchietto dei tocchi lo segni: il gioco
   legge il dito in coordinate dello schermo (`tocca` in `MathGame.vue`,
   `clientX`/`clientY` contro `a.x`/`a.y`), quindi dove sta il sasso è
   dove si tocca.

   Il sasso nasce **sopra il bordo** (`y: -r - off`) ed entra scendendo:
   si aspetta che sia tutto in vista (`IN_VISTA`, sotto la striscia in
   cima), lui e gli altri sassi dell'ondata, e un momento ancora per «mirare», se no si spara a un sasso che
   nel filmato non c'è. La registrazione parte quando il primo sasso è
   già entrato (l'ultimo dei `passi`): i secondi di cielo vuoto
   dell'inizio partita non dicono niente. Sono sei colpi e non tre: con tre il cannone
   finiva a metà degli otto secondi.

   Dipende da `window.__mate` (`fase`, `asteroidi`) e dai selettori
   `.scaletta` e `.scaletta .ora`: se uno cambia forma, è qui che
   va aggiornata la ricetta. */

/* appena sotto la barra in cima, in pixel: il sasso è entrato tutto */
const IN_VISTA = 45
/* quanto si aspettano gli altri sassi dell'ondata, al massimo */
const ASPETTA_GLI_ALTRI = 1250

export default {
  file: 'clip-asteroidi', dove: 'mate', attesa: '.scaletta',
  passi: [['.scaletta .ora', 600],
          async page => page.waitForFunction(margine => window.__mate.asteroidi()
            .some(a => !a.morto && a.y - a.r > margine), IN_VISTA, { timeout: 8000 })],
  /* i sassi di un'ondata entrano sfalsati e piano, e fra un'ondata e
     l'altra passano secondi di cielo vuoto: dodici secondi di gioco
     visti in otto */
  clip: {
    secondi: 12,
    accelera: 1.5,
    async durante (page) {
      const fine = Date.now() + 11200
      /* il sasso giusto, se è tutto in vista: dove sta adesso */
      const bersaglio = () => page.evaluate(margine => {
        const m = window.__mate
        if (m.fase.value !== 'gioco') return null
        const vivi = m.asteroidi().filter(a => !a.morto)
        const a = vivi.find(a => a.ok)
        return a && a.y - a.r > margine
          ? { x: a.x, y: a.y, tutti: vivi.every(v => v.y - v.r > margine) } : null
      }, IN_VISTA)
      for (let colpo = 0; colpo < 6 && Date.now() < fine; colpo++) {
        let dove = null
        while (!dove && Date.now() < fine) {
          dove = await bersaglio()
          if (!dove) await page.waitForTimeout(60)
        }
        if (!dove) break
        /* gli altri sassi dell'ondata, se arrivano presto: la scelta fra
           tre risposte è il gioco, e un sasso solo a schermo non la
           mostra. Ma entrano sfalsati, e aspettarli tutti vuol dire un
           colpo solo in nove secondi. */
        const basta = Date.now() + ASPETTA_GLI_ALTRI
        while (dove && !dove.tutti && Date.now() < basta) {
          await page.waitForTimeout(80)
          dove = await bersaglio()
        }
        await page.waitForTimeout(300)                  // si vede, si mira
        dove = await bersaglio()                        // intanto è sceso
        if (!dove) continue
        await page.mouse.click(dove.x, dove.y)
        await page.waitForTimeout(500)                  // l'esplosione resta a schermo
      }
    },
  },
}
