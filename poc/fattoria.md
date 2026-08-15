# La fattoria — stato del lavoro

*Aggiornato il 15 agosto 2026. Il prototipo è `poc/fattoria.html`, si apre
col doppio click. Questo file dice cosa c'è già, cosa manca e cosa è stato
deciso — così chi riprende in mano la cosa fra due settimane non deve
rileggere mille righe di codice per capire a che punto era.*

## A cosa serve

**Dare un posto dove spendere le monete.** Le monete si guadagnano negli
altri giochi facendo esercizi; la fattoria è dove finiscono. Non contiene
matematica e non deve contenerne: è la ricompensa, non un'altra lezione.

Il modello è **Hay Day**, non Farmville: non si semina e non si aspetta il
raccolto. Si **espande il terreno**, si **sgombra il bosco** per far posto, e
si mette la propria roba dove si vuole.

## Cosa c'è già

- **Terreno che si espande** in tutte le direzioni. Intorno alla parte tua
  c'è il selvatico, con il cartello del prezzo piantato sopra; il prezzo sale
  a ogni pezzo comprato. Il prato è identico ovunque e il bosco è lo stesso
  prato sotto una nebbia sfumata: il confine non è un posto dove cambia
  qualcosa, e la fattoria non sembra una tabella.
- **Ostacoli da sgombrare** — alberi, ceppi, sassi, funghi. Si tolgono
  pagando monete, e **rendono più di quanto costano**: sgombrare finanzia
  l'espansione invece di frenarla. È la struttura di Hay Day senza le sue tre
  valute.
- **Catalogo di oggetti** in categorie (piante, recinti, acqua, casette,
  animali, decorazioni), che si trascinano sulla mappa e si spostano tenendo
  premuto — un anellino si riempie prima di staccare l'oggetto, se no la
  fattoria si smonta per sbaglio a ogni tocco.
- **Magazzino**: quello che rimetti via non sparisce e non ti rimborsa niente
  — entra in magazzino e da lì si ripiazza gratis quante volte vuoi.
- **Animali** che camminano da soli evitando oggetti e monete, e ai quali si
  dà da mangiare toccandoli e trascinando sopra quello che compare.
- **Staccionata continua** sul perimetro, con gli angoli chiusi, e nessun
  recinto dove due pezzi tuoi confinano.
- **Spostare costa una monetina**, e ripiazzare dal magazzino pure. Non serve
  a fare cassa: serve perché questo posto resti la *ricompensa* per gli
  esercizi fatti altrove, e non un tavolino dove si passa il pomeriggio a
  spostare avanti e indietro la stessa panchina. Rimettere una cosa
  esattamente dov'era è gratis, e chi è a zero non resta bloccato — la
  fattoria sta ferma finché non guadagna altre monete giocando.
- Salvataggio in `localStorage` (chiave `poc-fattoria`), tasto ↺ per
  ricominciare.

## Cosa manca

### 1. Gli sprite veri
Il prototipo è ancora a **emoji**, e si vede. La ricerca è già stata fatta e
sta in [`SPRITE.md`](SPRITE.md): tre pacchetti **CC0** della serie *Tiny* di
Kenney (Tiny Farm, Tiny Town) più *Tiny Creatures* di Clint Bellanger, tutti
16×16 top-down, **~30 KB in totale una volta incorporati in base64** — cioè
compatibili con il vincolo dell'HTML unico offline. Mancano cane, gatto,
fontana e lampione: vanno disegnati o cercati altrove.

La ricerca è stata rifatta una seconda volta cercando apposta fuori da
Kenney, e ha chiuso una domanda: **l'acqua e la fontana esistono già** (nel
Roguelike/RPG di Kenney la prima, nello Zelda-like CC0 di ArMM1998 la
seconda, perfino animata), ma **in stili che con la serie Tiny non stanno
insieme** — contorno, palette e ombre sono diversi e il confine si vede.
**Cane e gatto dall'alto in stile Tiny non esistono proprio**, in nessuna
famiglia CC0 trovata. Quindi la scelta è in blocco: o Tiny più tre o quattro
tessere disegnate a mano, o si cambia famiglia tutta insieme. Dettagli e
prove in `SPRITE.md`.

Il lavoro non è solo «cambiare le immagini»: cambia la forma dei dati
(`CATALOGO`, `OSTACOLI`), serve la scelta della tessera di staccionata in
base ai vicini (dritto / angolo / T / fine), e `imageSmoothingEnabled = false`
per non impastare i pixel. Dettagli in `SPRITE.md`.

### 2. Diventare l'unico posto dove si spendono le monete
Decisione presa: **la fattoria sostituisce la cameretta**, che va eliminata.
Non è una riga di codice — questi sono i pezzi da smontare o migrare:

- **Il profilo**: `pets` (animali adottati, con nome, pasti e accessori),
  `casa` (i quattro posti), `accessori` (le capsule uscite), `owned` e
  `layout` (gli oggetti comprati e come stanno sulle mensole). Sono
  **salvataggi veri di bambini veri**: o si migrano in oggetti della fattoria,
  o si accetta di perderli — e va deciso apposta, non per omissione.
- **Le schermate**: `views/CamerettaView.vue`, `components/Stanza.vue`,
  `SchedaAnimale.vue`, `Negozio.vue`, `Sorprese.vue`, `PetSprite.vue` e le
  sagome.
- **I dati**: `data/pets.js`, `data/capsule.js`, `data/shop.js`.
- **L'albo**: i traguardi della cameretta in `data/traguardi.js` e la sua riga
  in `XP_AREA` (`store/progressi.js`). Occhio alle soglie di «Tuttofare», che
  non devono abbassarsi sotto gli occhi di chi ha già l'oro.
- **I test**: `test/unita/animali.test.mjs`,
  `test/integrazione/animali.test.mjs`, e i pezzi di `app.test.mjs` e
  `genitori.test.mjs` che passano dalla cameretta.
- **La documentazione**: `docs/cameretta.md`, i richiami in `README.md` e
  `LEGGIMI.md`.

Prima di toccare qualsiasi cosa qui, la fattoria deve aver superato la prova
dei bambini: si smonta una stanza che funziona solo quando c'è qualcosa di
meglio, già in piedi.

### 3. Le cose piccole viste negli scatti
- Un oggetto piazzato sul bordo si **sovrappone alla staccionata** invece di
  starle dietro (il fuoco, in basso).
- La fattoria appena aperta è **vuota al centro**: la prima cosa che si vede
  è un prato senza niente. Servirebbe un paio di cose già piazzate, per far
  capire cosa si può fare.
- Gli animali **non producono ancora niente** in modo visibile abbastanza da
  invogliare a nutrirli.
- Manca lo **zoom**: su una fattoria grande si scorre soltanto.

## Le decisioni prese, e perché

- **Niente matematica qui.** C'era un «abbatti l'albero con un esercizio»: è
  stato tolto. Se non hai monete, non abbatti — le monete si guadagnano
  giocando agli altri giochi. L'aggancio didattico vive lì, non qui.
- **Niente attese a ore, niente energia, niente amici, niente mercatino.**
  Sono i pezzi di Hay Day che servono a far pagare le persone, e qui non
  c'è niente da far pagare.
- **Non si perde mai niente**: nessun rimborso, ma nemmeno nessuna
  distruzione. Quello che hai comprato resta tuo, in mappa o in magazzino.
- **Gli sprite non si scaricano a caso**: servono licenze CC0 e peso
  compatibile con un HTML unico. Vedi `SPRITE.md`.

## Come si prova

```bash
node poc/prova.mjs fattoria          # Chrome, tocchi a caso, errori di console
node poc/prova.mjs fattoria --secondi 10
```

Lo scatto finisce in `poc/scatti/fattoria.png` e **va guardato**: è il modo
più rapido di accorgersi che «funziona» ma è tutto vuoto.
