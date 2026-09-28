# Il nucleo

Come è fatto il repo e come ci si lavora: architettura, archivio, prove,
comandi, pubblicazione, grafica, e le regole comuni a tutti i giochi.

- [architettura.md](architettura.md) — il file unico offline, cosa sta dove in `src/`, chi gioca non disegna
- [archivio.md](archivio.md) — `storage.js`, profili e roster, cosa sta fuori dai profili, le trappole dell'archivio
- [progressi.md](progressi.md) — il livello del profilo, `XP_AREA`, traguardi, togliere un gioco senza abbassare niente
- [sessioni.md](sessioni.md) — quanto ha giocato e a cosa (`store/sessioni.js`)
- [aggiornamento.md](aggiornamento.md) — «c'è una versione nuova», «cerca aggiornamenti», il service worker
- [guasti.md](guasti.md) — gli incidenti, `ripara()`, cosa guardare quando qualcosa va storto
- [test.md](test.md) — la cadenza delle prove, le cartelle, le regole per scrivere un test
- [tempi-dei-test.md](tempi-dei-test.md) — quanto costano le prove, e le regole che ne vengono
- [comandi.md](comandi.md) — tutti i comandi, cosa riscrivono, i banchi di prova, la roba generata, i cheat
- [pubblicare.md](pubblicare.md) — GitHub Pages, il server di casa, il numero di versione
- [grafica.md](grafica.md) — `src/grafica/`: tela, telecamera, pittori, scheletri, sprite e tessere
- [sprite.md](sprite.md) — gli strumenti degli sprite e il banco `npm run mondo`
- [strumenti.md](strumenti.md) — voci, scatti e clip, icone, la guardia dei commenti
- [convenzione-giochi.md](convenzione-giochi.md) — come è fatto un gioco nuovo in `src/giochi/`
- [interfaccia.md](interfaccia.md) — barra, fogli con la ✕, pausa, schermate verticali, `v-if`, orologi
- [il-dito.md](il-dito.md) — tocco, click fantasma, scorrimento, selezione
- [primati.md](primati.md) — i giochi senza fine e i record
- [aiuti.md](aiuti.md) — la scala del 💡 a monete
- [da-fare.md](da-fare.md) — le voci aperte che non sono di un gioco solo

Vedi anche: [`../apprendimento/`](../apprendimento/README.md) (motore di ripasso,
quiz, calibrazione), [`../genitori/`](../genitori/README.md) (la schermata dei
grandi), `test/README.md`, `strumenti/sprite/LEGGIMI.md`, `strumenti/sprite/FORMATO.md`.
