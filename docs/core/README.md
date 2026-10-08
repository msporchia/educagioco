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
- [emoji.md](emoji.md) — il font Twemoji dentro il file, `npm run emoji`, la licenza, le trappole
- [grafica.md](grafica.md) — `src/grafica/`: tela, telecamera, pittori, scheletri, sprite e tessere
- [passi.md](passi.md) — `src/motore/passi.js`: celle raggiungibili, percorso, la cella da cui toccare una cosa
- [sprite.md](sprite.md) — gli strumenti degli sprite e il banco `npm run mondo`
- [sprite-a-mano-dal-codice.md](sprite-a-mano-dal-codice.md) — disegnare uno sprite come dato nel codice, quando l'atlante non ce l'ha
- [strumenti.md](strumenti.md) — voci, scatti e clip, icone, la guardia dei commenti
- [convenzione-giochi.md](convenzione-giochi.md) — come è fatto un gioco nuovo in `src/giochi/`
- [home.md](home.md) — la home: il profilo, «riprendi da qui», il carosello delle copertine, l'indice, come la aprono i test
- [interfaccia.md](interfaccia.md) — barra, fogli con la ✕, pausa, schermate verticali, `v-if`, orologi
- [il-dito.md](il-dito.md) — tocco, click fantasma, scorrimento, selezione
- [primati.md](primati.md) — i giochi senza fine e i record
- [ripresa.md](ripresa.md) — uscire non butta via la partita: la sosta, quando si scrive, la carta in cima alla mappa
- [aiuti.md](aiuti.md) — la scala del 💡 a monete
- [guida.md](guida.md) — la guida del primo giro: la riga col 👇 e l'anello, comuni a tutti i giochi
- [da-fare.md](da-fare.md) — le voci aperte che non sono di un gioco solo
- [z-index-dal-codice.md](z-index-dal-codice.md) — la scala degli z-index dei veli
- [aree-dal-codice.md](aree-dal-codice.md) — perché `area` e `come` sono due campi separati in `data/aree.js`

Vedi anche: [`../apprendimento/`](../apprendimento/README.md) (motore di ripasso,
quiz, calibrazione), [`../genitori/`](../genitori/README.md) (la schermata dei
grandi), `test/README.md`, `strumenti/sprite/LEGGIMI.md`, `strumenti/sprite/FORMATO.md`.
