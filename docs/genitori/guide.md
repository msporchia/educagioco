# Le guide dentro l'applicazione

`src/guide/`: quello che nessuno legge nel README, messo dentro
l'applicazione — le guide per i grandi, il `?` di ogni gioco, i nastri in
home e chi l'ha fatto.

## Due registri, dato puro

`src/guide/contenuti.js`: **`GUIDE`** per i grandi (cos'è, che giochi ci
sono, installare, il codice, l'età, le domande, i progressi, i guasti, chi
l'ha fatto) e **`AIUTI`**, uno per gioco, dietro il `?` della barra. Il
grassetto si scrive `**così**` (`inGrassetto` in `src/guide/aiuto.js`):
dentro un dato non ci va HTML.

- **«Come funziona» sta fuori dal codice dei genitori** (tasto «? Come
  funziona» in fondo alla home). È la regola da non rompere: le prime guide
  le legge chi ha appena ricevuto il link da un'altra famiglia, e dietro il
  tastierino le leggerebbe solo chi non ne ha bisogno. Dallo stesso posto si
  manda il link a qualcuno.
- **Le prime quattro rispondono a chi arriva**: `cose`, `giochi-elenco`,
  `domande`, `chi` — *cos'è*, *chi me l'ha dato*, *cosa ci guadagna*, *dove
  finisce quello che scrivo*. Le manopole vengono dopo: spiegare dove si
  cambia la difficoltà a chi non sa ancora cos'è l'app non serve.
- **L'elenco dei giochi non si scrive a mano**: `giochi-elenco` lo compone
  da `src/data/giochi.js` e `src/data/aree.js`, se no il giorno dopo
  direbbe il falso.
- **Il codice di casa è scritto nelle guide**: `0000`, l'invito a
  cambiarlo, il recupero ([codice.md](codice.md)). Chi riceve il gioco da
  un'altra famiglia non ha nessuno a cui chiederlo. Un test lo controlla, ed
  è `subito`: serve prima di avere un profilo.

## Un registro, due posti

Le guide si leggono dalla schermata «Come funziona» (`src/guide/Guide.vue`)
e dal **velo del primo avvio** (`src/guide/VeloGuide.vue`, tasto «Cos'è
questo gioco? Chi l'ha fatto?» in `src/components/Benvenuto.vue`). Nessuno
dei due ha testi suoi, e la riga dell'elenco la disegna un componente solo
(`src/guide/Elenco.vue`).

Il velo, perché dal primo avvio non si naviga — senza un profilo `App.vue`
monta il benvenuto al posto di tutto — e il nome mezzo scritto deve restare
dov'è. Offre solo le guide **`subito: true`**: quelle che parlano di cose
che esistono prima che esista un bambino.

## Come si scrive un blocco

- **`chiuso: true`** — nasce ripiegato e si apre toccando il titolo. **Se
  serve a fare qualcosa sta fuori, se spiega perché è fatto così sta
  dentro.**
- **`testo`** (paragrafi) e **`collegamenti`** (`[{ url, testo, sotto }]`,
  solo `http(s)`, si vede che portano fuori).
- **`se` nasconde, `dove` ripiega.** Con `dove: 'android'|'ios'|'computer'`
  il blocco c'è sempre, aperto sulla piattaforma che si ha in mano e
  ripiegato sulle altre, e i blocchi `dove` mettono davanti il proprio
  (`src/guide/Blocchi.vue`). Provato `se` per i passi dell'installazione:
  dal computer si vedevano solo i passi del computer, ma al computer ci si
  siede per installarla sul telefono di un figlio. `se` resta dove altrove
  sarebbe **una frase falsa** («✅ è già installato»).

## Il `?` di un gioco

- Un gioco lo mette scrivendo **`guida="<chiave della schermata>"`** sulla
  `Barra`; se in `AIUTI` non c'è quella chiave il tasto non compare — un `?`
  che apre un foglio vuoto è peggio di nessun `?`. Il foglio è
  `src/guide/VeloAiuto.vue`.
- Chi ha un orologio che gira ascolta **`@aiuto`** e si ferma (il tower
  defense e la corsa; `usaPausa` ne dà uno già pronto).
- **Il `?` non si apre mai da solo.** Provato il foglio al primo ingresso di
  un gioco: i bambini lo chiudono per riflesso, e si insegna proprio quello,
  che i cartelli si mandano via. O un tutorial dentro la partita, o il tasto
  e basta.
- **Il posto dove si insegna giocando** è la riga dei primi passi del tower
  defense (`.primi-passi`, `src/views/castello/td.css`): in fondo al campo
  durante la prima partita in assoluto, non blocca niente, non si chiude per
  sbaglio, e dice quello che dal campo non si vede — che le torri si pagano
  coi conti. Sparisce quando la prima torre è in piedi e non torna
  (`settings.guideViste`, per bambino).
- **Il banco di prova le salta** (`saltaLeSpiegazioni`, acceso da
  `apriGioco`): un test rigioca la stessa «prima volta» a ogni giro. Chi
  vuole provarla chiede `apriGioco(browser, { spiegazioni: true })`.

## I nastri in home

`src/guide/Nastri.vue` tiene i cartelli che parlano al grande dalla home:
l'installazione, la versione nuova (il meccanismo è in
[../core/aggiornamento.md](../core/aggiornamento.md)), la posta ([cestino-e-posta.md](cestino-e-posta.md))
e le novità dei bambini ([novita-bambini.md](novita-bambini.md)).

**Il nastro dell'installazione** serve quando `serveIlNastro` (puro, in
`src/guide/aiuto.js`) dice sì a tutte e tre: non è già installata, è un
telefono, non è già stato chiuso. Chi gioca in una scheda e un giorno
svuota la cache crede di aver perso i progressi, e la guida la legge solo
chi la cerca. È pura per provarla senza un telefono in mano: per questo
esiste `apriGioco(browser, { userAgent })`. Toccarlo apre direttamente
quella guida (`daAprire` in `src/guide/stato.js`).

## Indirizzo e firma

- **L'indirizzo pubblico non si legge da `location`** (`INDIRIZZO` in
  `src/guide/aiuto.js`, `__INDIRIZZO__` scritto dal build): in casa il gioco
  arriva dal server di casa, e condividere quell'indirizzo manda a un'altra
  famiglia una pagina che non esiste.
- **Chi l'ha fatto sta in due posti**, nessuno dei due una carta fra i
  giochi: la guida `chi` (senza codice, col rimando al codice sorgente e
  alla licenza) e il piede della schermata dei grandi (`[data-firma]`, in
  fondo perché chi entra lì viene per altro). Gli indirizzi stanno una volta
  sola in `src/guide/aiuto.js`: `CHI`, `CODICE`, `AUTORE`, `SEGNALA`.

Nei test: `[data-azione="guide"]` in home, `[data-guida]` e
`[data-guida-velo]` sulle righe, `[data-apri]` sui blocchi,
`[data-azione="cos-e"|"chiudi-guide"|"torna-guide"]` nel velo,
`[data-azione="manda-link"]`; il `?` è `[data-azione="aiuto"]` sulla barra,
`[data-azione="chiudi-aiuto"]` sul foglio; i nastri
`[data-nastro="installa"|"versione"|"posta"|"novita"]` con
`[data-azione="nastro-installa"|"chiudi-nastro"]`; `[data-firma]`;
`test/unita/guide`.
