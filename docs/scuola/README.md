# La scuola

Educagioco in classe: un'app a parte per le maestre e una per i PC dei
bambini, costruite dallo stesso `main` ma pubblicate con un tag loro.
Niente monete né avanzamento, e sul PC del bambino non resta niente: la
maestra prepara una lezione, la avvia, i bambini entrano con un codice e
giocano ai giochi veri limitati alla lezione, e alla fine lei ha il resoconto.

- [progetto.md](progetto.md) — cosa fa, il giro di una lezione, le scelte e cosa non c'è
- [architettura.md](architettura.md) — le due pagine, i sostituti, la build, la pipeline col tag, il service worker di casa
- [lezione.md](lezione.md) — la lezione a blocchi: cosa si chiede, in che gioco, quando si passa al blocco dopo (da solo o «Avanti tutti»), in tondo
- [protocollo.md](protocollo.md) — il servizio: la lezione sul Durable Object, le richieste, i messaggi, i limiti, le 3 ore
- [esercizi.md](esercizi.md) — cosa può scegliere la maestra, come si pescano le domande, come si racconta una risposta
- [quaderno.md](quaderno.md) — cosa tiene il PC della maestra: classi, lezioni, storico, il file da salvare e il link di una lezione, i primi passi (prima la classe, poi la lezione), il percorso di «Nuova lezione» e il pannello con «Avanti tutti»
- [editor.md](editor.md) — l'editor della lezione a blocchi e a passi, e la scelta del gioco a carosello col video del gioco vero (`npm run anteprime scuola`)
- [giochi.md](giochi.md) — i giochi veri: una cartella per gioco in `src/scuola/giochi/`, la scheda, i sostituti, la vista, i parametri, la risposta
- [bambini.md](bambini.md) — le schermate del bambino, il nome dalla lista, cosa succede quando la rete cade
- [prova-computer.md](prova-computer.md) — la prova di un PC della classe, dal link della maestra: ogni gioco vero con un pilota, base e al massimo, le immagini al secondo, la grafica sgranata (B) che il PC si ricorda, il resoconto in un invio
- [ripieghi.md](ripieghi.md) — quando qualcosa non va: la lezione cambiata a metà, un bambino solo, il codice della maestra a tempo, il tasto «Maestra» sul PC, «Senza lezione» senza internet, le pagine che si riaprono senza rete

Nei test: le unità `unita/scuola-*` (i bersagli e cosa provano stanno in ogni file sopra) e, nel browser,
`integrazione/scuola` (`node test/esegui.mjs scuola`, che costruisce `dist-scuola/`): le due pagine costruite in due
contesti di Chrome, col servizio in locale (`test/aiuto/servizio-scuola.mjs`, la logica vera di `lezione.js`). La maestra
crea dai tasti la classe e una lezione a due blocchi (la tabellina del 2 a schede fino a 2 giuste, poi gli Asteroidi
finché lo dice lei), avvia, e il bambino entra col codice e il suo nome; due schede giuste, il passaggio, un colpo negli
Asteroidi che arriva nel pannello (senza 3D, una scheda), i ripieghi dal pannello e dal tasto «Maestra», «Avanti tutti»
una volta (lui era già al blocco della maestra), «Chiudi lezione» e il resoconto per blocco. `integrazione/scuola-senza-rete`
prova le pagine che si riaprono senza rete e «Senza lezione» ([ripieghi.md](ripieghi.md)). Alla fine la pagina dei bambini ha IndexedDB vuoto e in
localStorage solo chiavi `scuola:*`.
