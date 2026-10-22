# La guida della fattoria 3D

Il `?`, il primo giro e «E adesso?». Per bambini da 4 a 12 anni: frasi corte, la manina per chi non legge, e dopo un «non si può» il perché e come si fa.
La 2D ha le stesse cose con altri nomi ([../fattoria/regole.md](../fattoria/regole.md)); i contratti comuni sono in [../core/guida.md](../core/guida.md) e [../genitori/guide.md](../genitori/guide.md).

## Il `?`

`<Barra guida="fattoria3d">` e la voce `AIUTI.fattoria3d` di `src/guide/contenuti.js`: i tocchi (tocca, 🌱/✂️ armati, tenere premuto per costruire e spostare), le prime cose, cosa serve e dove si fa, banco e mongolfiera, «Cosa allena». Non si apre mai da solo.
La chiave deve essere il nome della schermata (`schermate.js`: `fattoria3d`); un test (`unita/guide`) lo controlla.

## Il primo giro

`motore/guida.js`, pura: dal quadro di quello che c'è (campi vuoti/maturi/che crescono, modo, foglio aperto, primo raccolto fatto) dice `{ testo, dove, mano }` o null. Si legge lo schermo, non un copione.
La riga è `giochi/Guida.vue`, l'anello e la manina li accende `usaGuida` (comune). I passi: 🌱 Semina → il grano nel foglio dei semi → tocca il campo → «il grano cresce» → ✂️ Raccogli → tocca il campo → 🏗 Costruisci (il primo raccolto è il traguardo: il campo tornato vuoto può aspettare).

- **Serve solo a chi non ha fatto niente** (`servePrimoGiro`: nessuna spesa, nessun raccolto o prodotto in scorta), si decide una volta all'apertura. Se si esce a metà e la scorta è ancora vuota, ricomincia dal passo giusto.
- **Finisce** al primo raccolto più un'occhiata al menu «Costruisci qui», o alla prima spesa (`primoGiroFinito`), e lo ricorda in `profile.campagne.fattoria3d.cfg.guida = { finita: true }`: «Ricomincia la fattoria» azzera la campagna e la guida torna.
- **Il banco di prova la salta** (`saltaLeSpiegazioni`): `apriGioco(browser, { spiegazioni: true })` la rimette.
- **Dove sta la riga**: sopra la barra delle azioni; con un foglio aperto che la coprirebbe (semi, «Costruisci qui») sta in alto (`.f3-guida.su`). Con un foglio che la guida non conosce (macchina, banco…) tace.
- Provato: la riga come tutorial a più passi numerati — non regge a chi fa le cose in un altro ordine (docs/core/guida.md).

## «E adesso?» e il consiglio

`motore/consiglio.js`, puro, torna `{ testo, azione, etichetta }`; `azione.che` è una di `FORME`: `semina`, `raccogli`, `macchina`, `costruisci`, `banco`, `livelli`, `home` (o null: c'è solo da aspettare, niente tasto).

- **`cosaFaccioAdesso(motore)`** il tasto 🧭 in alto a destra: campo maturo → roba pronta in una macchina → ordine consegnabile → prodotti delle bestie → campo vuoto → edificio aperto e pagabile → secondo campo → ricetta possibile → «si aspetta, fra N secondi» → «le monete si guadagnano negli altri giochi» (porta in home).
- **`comeAvere(motore, merce)`** risale la catena da sola: un raccolto → campo/semina/aspetta; un prodotto delle bestie → il pezzo, il mangime che manca; una ricetta → la macchina (da costruire, o da aprire), poi gli ingredienti che mancano, ricorsivamente (6 giri). Non ancora aperto: dice il livello e porta ai livelli.
- **Sotto un «non si può»**: macchina, banco e mongolfiera, quando manca roba, mostrano il passo e il tasto sotto il messaggio (`ConsiglioRiga.vue`, prop `consiglio`, evento `consiglio`); `Gioco.vue` (`facciConsiglio`) chiude il foglio e porta dov'è. Gli altri rifiuti (monete, livello, posto) dicono ancora solo il perché (`scena3d/detti.js`).
- Il tasto «Costruisci» non evidenzia ancora la carta giusta nel menu: il testo nomina l'edificio.
- Nessun suono: la guida è tutta testo e anello.

## Nei test

`[data-azione="aiuto"]` il `?` (foglio: `[data-azione="chiudi-aiuto"]`); `[data-guida-riga]` la riga del primo giro, `[data-indicato]` (`="mano"`) l'anello, `.f3-guida` (`.su` in alto); `[data-f3="apri-consiglio"]` il tasto «E adesso?», `[data-f3="consiglio"]` il foglio, `[data-f3="consiglio-riga"]` / `consiglio-testo` / `consiglio-fai` (`data-azione` = `che`) il passo col tasto, anche sotto `macchina-msg`, `banco-msg`, `mongolfiera-msg`.
Unità: `unita/fattoria3d-guida` (passi, catena, ogni ricetta ha un consiglio); integrazione: `integrazione/fattoria3d-guida`.

## Da fare

- Provare il primo giro con un bambino di 4–6 anni e su un telefono vero (la manina copre un poco la scritta del tasto).
- «🌳 Come si fa» (I3): la 3D non ha ancora `dati/albero.js` né `usi.js`; vanno portati dalla 2D (`src/giochi/fattoria/dati/albero.js`, `usi.js`) e agganciati a inventario, macchina e banco.
- Consiglio anche per i rifiuti «niente monete» e «livello» dei fogli (oggi solo il perché).
