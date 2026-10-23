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
- [avvio-e-memoria.md](avvio-e-memoria.md) — quanto ci mette ad aprirsi il file e quanta memoria d'immagini tiene (`strumenti/misura-avvio.mjs`)
- [tempi-dei-test.md](tempi-dei-test.md) — quanto costano le prove, e le regole che ne vengono
- [comandi.md](comandi.md) — tutti i comandi, cosa riscrivono, i banchi di prova, la roba generata, i cheat
- [pubblicare.md](pubblicare.md) — GitHub Pages, il server di casa, il numero di versione
- [emoji.md](emoji.md) — il font Twemoji dentro il file, `npm run emoji`, la licenza, le trappole
- [grafica.md](grafica.md) — `src/grafica/`: tela, telecamera, pittori, scheletri, sprite e tessere
- [passi.md](passi.md) — `src/motore/passi.js`: celle raggiungibili, percorso, la cella da cui toccare una cosa
- [catalogo-3d.md](catalogo-3d.md) — la pagina con tutti i modelli 3D e il gioco che li usa (`npm run catalogo3d`), il formato `VOCI`, chi mantiene cosa
- [sprite.md](sprite.md) — gli strumenti degli sprite e il banco `npm run mondo`
- [creature.md](creature.md) — le creature dipinte in un catalogo solo (`sorgenti/creature/`): fotogrammi, passi dai video, `giochi`, come le prendono il sotterraneo e il castello, come se ne aggiunge una
- [creature-catalogo-1.md](creature-catalogo-1.md), [creature-catalogo-2.md](creature-catalogo-2.md) — il catalogo descritto, generato dal JSON: com'è fatta ogni creatura, elemento, come combatte, dove sta bene, tenuta o scartata
- [sprite-a-mano-dal-codice.md](sprite-a-mano-dal-codice.md) — disegnare uno sprite come dato nel codice, quando l'atlante non ce l'ha
- [vecchio-telefono.md](vecchio-telefono.md) — il Redmi Note 7 come metro dei giochi 3D: come lo si imita sul computer, come si calibra, come si misura
- [vecchio-telefono-veri.md](vecchio-telefono-veri.md) — la misura coi modelli veri dei giochi sul telefono: le scene, il limite, i colli di bottiglia, il resoconto in più invii
- [vecchio-telefono-elementi.md](vecchio-telefono-elementi.md) — chi pesa, un elemento alla volta: le scene smontate (pavimento, muri, luci, nebbia, mostri…), la tabella, le leve semplici della fascia bassa
- [amici.md](amici.md) — la lista di amici per tutta l'app: un legame fra due persone con chiave sua, codice breve a scadenza, spenta di base e chiesta ai grandi, presenza e inviti
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
