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

**C'è già un secondo prototipo che gli sprite li usa davvero**:
[`fattoria-gfx.html`](fattoria-gfx.html), che invece del set Tiny prende
quello **CC0 di ArMM1998** — l'unica famiglia che avesse la fontana e
l'acqua già pronte. È un file a sé, non una modifica di questo: si aprono
uno accanto all'altro e si guarda quale delle due fattorie è più bella.

Quello che si è imparato costruendolo, e che vale anche se poi si cambia
set:

- **L'atlante su misura costa niente.** Ritagliando dal set solo le tessere
  che servono, l'atlante è **23 KB di PNG, 70 pezzi**, e il prototipo
  intero sta in 65 KB — meno di `fattoria.html` a emoji. Il ritaglio lo fa
  [`atlante-gfx.py`](atlante-gfx.py), che riscrive la riga del base64 dentro
  l'HTML: la sorgente non è versionata, il risultato sì.
- **Le tessere d'erba si scelgono misurandole, non a occhio.** I primi
  tentativi facevano comparire un reticolo di quadrati più chiari su tutto
  lo schermo: due delle quattro tessere avevano dei pixel trasparenti, e le
  altre venivano da due famiglie di verde diverse. Le quattro buone
  condividono lo stesso colore di fondo e hanno il 90% di pixel uguali.
- **La vista sta su pixel interi.** Se scorre a mezzo pixel, fra una
  tessera e l'altra compare una riga, e la nebbia disegna il reticolo delle
  celle. Arrotondare `vista` è tutta la correzione.
- **Uno sprite si appoggia col fondo sul fondo del suo piede.** Una casa
  occupa 4×2 celle per terra ma è alta 5 tessere: il tetto sta *sopra* il
  suo piede, non dentro. Senza questa distinzione i tetti coprono la roba
  che sta dietro.
- **Le ombre non si disegnano.** Questi sprite se la portano già dentro, e
  una seconda ombra sotto si vede subito.

Due cose sono state decise provandolo, e valgono anche per `fattoria.html`:

- **Il confine di quello che è tuo è netto, non sfumato.** La prima
  versione sfumava il buio verso la parte tua: era bello e diceva una
  bugia, perché il confine *è* una riga — di là è tuo, di qua no. Adesso il
  buio cade sul bordo della piazzola, e quello che compreresti è dentro un
  **riquadro tratteggiato** che si vede prima di pagare, ostacoli compresi.
  Il pezzo comprabile è anche meno buio degli altri: è il modo di dire
  «questo, non tutto il bosco» senza scriverlo.
- **Il magazzino è l'elenco di tutto, non di quello che possiedi.** Ogni
  oggetto c'è sempre, e sopra c'è scritto o il prezzo o quanti ne hai.
  **Toccare compra, tenere premuto e tirare piazza** — due gesti, e il
  secondo non passa dal primo. Così c'è un posto solo dove si guarda «cosa
  c'è da avere e a che punto sono», invece di un negozio da una parte e una
  cassapanca dall'altra, che sono la stessa domanda fatta due volte.

- **Quello che tieni in mano non resta anche per terra.** Sembra ovvio
  scritto, ma la prima versione disegnava tutte e due le copie e non si
  capiva quale si stesse spostando.
- **Prendere una cosa sono tre momenti, e si vedono tutti e tre.** *Premi*
  — un anello si riempie sotto il dito, e finché non è pieno non è successo
  niente: si lascia e via. *Preso* — l'anello si chiude, l'oggetto si
  schiarisce e prende un contorno tratteggiato, e da lì è **selezionato**
  anche da fermo. *Tiri* — l'oggetto non segue il dito a caso, **salta di
  cella in cella**, e sotto gli si accende il riquadro di dove finirà,
  verde se ci sta e rosso se no. L'ultimo pezzo non è vezzo: posare alla
  cieca fa sbagliare, e sbagliare qui costa una moneta. Si preme altrove e
  torna tutto com'era.
- **Girare non è ruotare i pixel, è cambiare tessera.** La pixel art
  ruotata si sfarina. Una staccionata si gira perché nel set esiste *la
  stessa staccionata in piedi*, ed è quella che si mette al suo posto —
  quindi la staccionata è **una voce sola che si gira**, non due voci
  diverse nel catalogo. Dove il set non ha la variante, il tasto non
  compare: meglio niente che un tasto che fa una cosa storta.
- **Gli attrezzi stanno appesi all'oggetto**, non in un pannello che copre
  lo schermo: girare una staccionata vuol dire vederla girare, e con un
  pannello davanti non la vedi. Spariscono mentre la stai tirando, che è
  quando sono lontani dal dito e non servono.
- **Provata e buttata: «prima ci va, poi si decide».** Per un giro toccare
  una cosa non apriva il pannello — ci mandava la bambina, e il pannello
  arrivava quando lei era arrivata. Sulla carta reggeva; in mano **distrae
  e basta**, perché fra il tocco e la risposta ci si mette dell'attesa che
  non serve a niente. È scritto qui perché l'idea è di quelle che tornano.
- **Lo zoom è a numeri interi.** Da 1 a 5, col pizzico o la rotella. Non
  per pigrizia: a scala 2,3 la pixel art fa dei pixel larghi due e altri
  tre, e da vicino si vede. Meglio saltare fra misure nette che scivolare
  fra misure sbagliate. Due dettagli che costano un giro di prove se non
  si sanno: si stringe **attorno al punto che stai guardando**, non attorno
  all'angolo della mappa; e la rotella deve fare **passi interi**, perché
  `2 × 1,18` arrotondato fa ancora 2 e non si muoverebbe mai niente.
  Quando lo zoom si allarga al punto che il mondo ci sta tutto, la vista
  lo **centra** invece di incollarlo in alto a sinistra.
- **Watson si accudisce.** Toccandolo si apre il suo stato: pancia, pelo,
  voglia di giocare. Tre bisogni che calano con le **ore vere** — se il
  gioco resta chiuso una settimana, al ritorno ha fame, ed è giusto così —
  e tre gesti che li riempiono. Ma il fondo è **0,15, non zero**: Watson
  non sta mai male. Questo posto è il premio per gli esercizi fatti
  altrove, e un cane che ti fa sentire in colpa se non apri l'app lo
  trasformerebbe nell'ennesimo compito. La nuvoletta sopra la testa è un
  invito, non un rimprovero.

**Gli animali il set non ce li ha, e li generiamo.** In tutti e otto i file
di ArMM1998 non c'è **nessun animale**, nemmeno uno — `NPC_test.png`
compreso, che non è una bestia ma la sagoma nuda del personaggio, cioè la
base da cui vestirne altri. Il primo cane è arrivato da un generatore di
immagini, ed è **Watson**, il bobtail di casa: sta in
[`attori/bobtail.png`](attori/bobtail.png) e nel prototipo gira per il
prato da solo.

**Il formato di un attore è uno solo**, e non è una scelta nostra: è quello
di `character.png`, ed è quello che i generatori restituiscono se glielo si
fa vedere. Una tessera **16 largo × 32 alto**, quattro fotogrammi per riga,
bande a passo 32 — giù, di lato, su. Le pose di lato guardano **a destra**,
la sinistra è la stessa specchiata. Da lì in poi la catena è meccanica:

```bash
python3 poc/attori.py ~/Scaricati/gatto.png gatto --guarda
python3 poc/atlante-gfx.py ~/Scaricati/gfx
```

Il primo comando riporta il foglio alla misura vera — la misura non la
indovina, la ricava dal passo fra le bande scure e verifica che torni —
toglie il fondo e riduce i colori; il secondo lo raccoglie da
`poc/attori/` e lo infila nell'atlante. **Nel gioco non si tocca niente**:
la classe `Attore` non sa chi sta disegnando, e per farlo camminare basta
una riga.

Due trappole trovate scrivendo `attori.py`, che valgono per il prossimo:

- **Il fondo si toglie allagando dai bordi, non per colore.** Watson è
  bianco: cancellando «tutto il bianco» gli si aprivano buchi in mezzo alla
  schiena. Via va solo il bianco che si raggiunge camminando dal bordo.
- **I colori si riducono dopo, non prima.** Ridotti prima, il bianco del
  cane e il bianco della carta diventano lo stesso colore e il danno è già
  fatto.

Per farne generare altri, il riferimento di stile da mettere davanti è
[`scatti/riferimento-stile.png`](scatti/riferimento-stile.png). Mancano
ancora gatto, gallina, papera, mucca, pecora, maiale — e fuori dagli
animali un lampione da giardino e un albero col tronco visibile, che il
set non ha (ci sono solo chiome tonde).

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
