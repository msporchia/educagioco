# Le regole del laboratorio

Come è fatto il laboratorio delle pozioni: il mercante, gli strumenti, la
scaletta, gli sbagli e cosa va al motore di apprendimento. Il gioco sta in
`src/giochi/pozioni/`, secondo la convenzione dei giochi nuovi
([../core/convenzione-giochi.md](../core/convenzione-giochi.md)). Il motore
è `motore/bottega.js`, i numeri `dati/bottega.js` e `dati/campagna.js`.

## Il gioco

- **Una tappa è una pozione col suo nome** («Elisir di Volo»), e si fa in due
  metà: la spesa, qui, e il procedimento ([procedimento.md](procedimento.md)).
- **Una pozione ha tanti ingredienti** (da due a quattro), e ognuno ha il suo
  strumento col segno d'oro dove arriva la dose. La pergamena dice quanto c'è e
  quanto ne serve, nell'unità della ricetta.
- **Il listino del mercante** è un rotolo aperto fin dall'inizio, che dopo un
  ordine si riapre con «Dal mercante»:
  tutti gli ingredienti della ricetta insieme, quattro targhette a testa
  (quantità e prezzo). Le ampolle si ricomprano quante volte si vuole.
- **Sul listino c'è solo quello che serve**: provato con un ingrediente
  intruso da riconoscere, faceva solo confusione. La scelta è fra le ampolle,
  non fra gli ingredienti.
- **Sul listino niente figure che suggeriscano quanto**: provato con le
  ampolle in fila sul bancone: uguali non si capiva che erano diverse, diverse
  davano la risposta senza leggere. Lì quanto c'è lo dice solo la targhetta.
  **Una volta comprate si vedono a misura reale**: è il momento di capire cosa
  si è ordinato, e cosa si è sbagliato.
- **Si fa un ordine**: due o tre targhette (`ordine`), anche di ingredienti
  diversi, poi «Ordina». Si paga tutto, il mercante porta le ampolle sul
  bancone e le versa una alla volta, nell'ordine scritto.
  Più ampolle insieme vuol dire fare la somma prima di vederla.
- **Le grandi costano meno al chilo** (`PEZZI`, `PREZZI`): 1 kg 4 gettoni,
  5 hg 3, 1 hg 1. Conviene sempre «la più grande che ci sta», ma per sapere
  cosa ci sta bisogna sapere a cosa corrisponde l'etichetta, come quando si
  sommano monete diverse.
- **Il trucco del mercante** (`gemelli`): spesso la stessa quantità sta sul
  listino due volte, in due unità, e una costa un gettone in più. Chi
  riconosce che «5 hg» e «500 g» sono la stessa cosa risparmia.
- **Oltre il segno d'oro trabocca**: quell'ampolla è pagata e persa, lo
  strumento resta dov'era, e le altre dell'ordine si versano lo stesso. **Quello
  che resta sul tavolo dipende dalla roba**: il liquido fa una pozza, la polvere un
  mucchio opaco, la radice cade intera (una radice non fa acqua, e sul cartello è
  «Troppo lungo!»). **Prima di ordinare ancora si mette a posto**: «Pulisci»,
  «Spazza» o «Togli», un gettone a strumento (`PULIZIA`).
- **La borsa si vede sempre**: «Hai speso 7 su 23», con la barra e il pezzo
  a strisce dell'ordine in preparazione.

## Senza fretta e senza cuori

- **Il tempo non è un avversario**: niente pazienza del cliente, niente
  cuori, niente ⏸. **La tappa si finisce sempre**: se i gettoni finiscono si
  va in rosso, e la pozione si fa lo stesso. Provato: la pazienza che scende,
  i cuori e la mancia del cliente esigente: con una barra che calava sopra
  un cartello da leggere, si imparava a non leggere.
- **Le stelle dicono quanto si è speso**, non quante volte si è sbagliato:
  tre al minimo, due fino a tre gettoni in più, una comunque (`stelle`).
  Alla fine, se si è speso di più, si dice il modo più economico
  ingrediente per ingrediente (`piuEconomico`).
- **I gettoni sono della pozione**, non le monete del bambino: il bilancio è
  il minimo più il `margine` della tappa, largo all'inizio e stretto in fondo.
- **Tre monete per ingrediente finito senza traboccare** (`MONETE_A_DOSE`):
  una dose è una domanda vera, e tante ampolle piccole non rendono di più.
  Si pagano quando si ordina, così uscire mentre il mercante versa non perde
  niente (vedi [../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).

## La scaletta: una cosa nuova per volta

Nove gradini scritti una volta sola e ripetuti per le tre famiglie
(`GRADINI` in `dati/campagna.js`), in multipli dell'unità grande e con `in`
che dice in che unità la ricetta li scrive. **Le chiavi e l'ordine delle
ventinove tappe non cambiano**: sono quelle dei progressi e delle stelle.

| | gradino | la ricetta | il listino | aiuto | margine |
|---|---|---|---|---|---|
| 1 | `banco` | «500 g» | in grammi: niente da convertire | `gioco` | 8 |
| 2 | `grande` | «1 kg» | in grammi | `svolto` | 8 |
| 3 | `grandi` | 2 kg, 5 kg | grammi e chili | `regola` | 6 |
| 4 | `virgola` | 0,5 kg, 1,5 kg | grammi e chili | `svolto` | 6 |
| 5 | `virgole` | le stesse, e 1,2 kg | grammi e chili | niente | 4 |
| 6 | `media` | 8 kg, 12 kg | arrivano gli etti | `svolto` | 6 |
| 7 | `miste` | in tre unità | in tre unità | `regola` | 4 |
| 8 | `inversa` | «6000 g» | chili ed etti: si sale | `svolto` | 5 |
| 9 | `inverse` | su e giù | in tre unità | niente | 3 |

- Poi due tappe finali (`FINALI`): **l'Elisir del Calderone** (le tre famiglie
  nella stessa pozione) e **la Pozione del Maestro**, con le dosi da magazzino.
- **Quanto si dice lo decide la tappa** (`aiuto`): `gioco` il cartello dice
  come si gioca, `svolto` sotto ogni targhetta c'è quanto vale nell'unità
  della ricetta, `regola` accanto all'ingrediente c'è l'uguaglianza («1 kg =
  1000 g»), `''` niente.
- **`manca`**: la pergamena dice quanto manca (la sottrazione la fa il
  gioco). Solo in `inverse` e nelle finali la si fa da sé.
- **La portata sale lungo la fila**: `PORTATA_DA` 44 i pesi (sette anni e
  mezzo, quando le misure entrano a scuola), 56 le lunghezze, 68 i liquidi,
  e un punto e mezzo a gradino (`PASSO_PORTATA`); 82 e 85 le finali.
- `guastiDellaCampagna` controlla che ogni dose si componga.

## Il listino

- **Tre famiglie con la stessa forma**: un'unità grande (G), una di mezzo
  (M), una piccola (P). Non sono la stessa scala: fra chilo e grammo tre
  scalini, fra metro e centimetro due. Il motore conta gli scalini invece
  di darli per scontati (`scalini`).
- **Tutto è in unità base, come intero**: la virgola compare solo a schermo.
- **Il listino parte dai pezzi che fanno davvero la dose** (per 1,2 m: 1 m e
  20 cm; `ottimo` su tutti i pezzi, e a parità di gettoni meno ampolle). Pescati
  a caso una dose chiedeva trentasei ampolle, e da 1 m a 1,2 m restava solo il
  5 cm quattro volte.
- **Il pezzo piccolo divide la dose e tutti gli altri pezzi**: è quello che
  rende ogni dose componibile da qualunque punto. Provato senza (0,1 e 0,25
  sullo stesso banco): resta un avanzo che nessuna ampolla copre.
- **Per le dosi grandi tutto il listino sale di dieci o di cento** (`scalaDi`)
  e i prezzi restano quelli: la fatica sta nelle unità, non nei soldi. Se no
  diventa una bancarella.
- **Il mercante scrive come gli pare**, dentro le unità della tappa
  (`etichette`), di solito non in quella della ricetta (`etichetta`).
- **Due ingredienti della stessa pozione non hanno la stessa quantità**, anche
  scritta in unità diverse.
- `ottimo` cerca il minimo con le ampolle del listino; il test lo confronta
  con la forza bruta. Il minimo non dipende da come si raggruppano gli ordini.
- Il caso arriva da fuori (`rnd`), così una pozione si rifà identica nei test.

## Lo sbaglio

- **Uno sbaglio riporta il conto per intero**, a qualunque gradino: si dice il
  perché *e* come si fa, coi numeri di quel momento (`righe`): cosa vale
  l'ampolla, quanto c'era, quanto faceva, quanto mancava.
- **Dopo un trabocco si sta fermi a leggere**, con la barra che dice quanto
  manca prima della spugna: la stessa attesa dei quiz (`attesaDellEsito`,
  `PONDERA` in `src/quiz/nucleo/domanda.js`).

## Cosa va al motore di apprendimento

- **Ogni ampolla con l'etichetta in un'unità diversa da quella della ricetta
  è una conversione**, sotto la chiave della coppia **nel verso** in cui la si
  è fatta (`chiaveDi`: `pozioni:kg-g` e `pozioni:g-kg` sono due cose diverse da
  sapere): giusta se ci stava, sbagliata se è traboccata. Una scelta che ci
  sta ma costa di più resta una conversione giusta. Le coppie possibili sono
  `CONVERSIONI` in `gioco.js`.
- **Col conto scritto (`svolto`, `gioco`) non si segna niente**: il risultato
  era scritto. Dopo un trabocco su un ingrediente, quell'ingrediente non si
  annota più.

## Il disegno

Il 3D sta in `scena3d/` (three.js). **Chi gioca non disegna**: `Mercante.vue`
passa a `imposta()` una scena già decisa e chiede le animazioni (`ordine`,
`pulisci`, `festa`), che tornano una promessa. Ogni voce dell'ordine dice già
com'è andata; mentre la scena le suona la scena nuova aspetta (`occupa`), e
**la pergamena segue il mercante**: un numero cambia solo quando l'ampolla è
versata, se no il risultato si legge prima di vederlo.

- **Uno strumento per ingrediente, col nome sotto**, e a ingrediente finito
  viene messo via: davanti resta solo quello che serve (uno sporco resta finché
  non si pulisce). Provato uno solo per tipo: due polveri non si misurano sulla
  stessa bilancia.
- **Un'unità non si misura come un'altra** (`vasi.js`): il cilindro graduato
  per i liquidi, la bilancia col quadrante e il piatto per le polveri (il
  mucchio cresce, il piatto cala, la lancetta gira verso l'oro), il metro in
  piedi con la barretta d'oro per le radici (i pezzi comprati salgono uno
  sull'altro).
- **Il calderone parte vuoto** (`banco.js`): il brodo nasce con la prima cosa
  versata, sale e cambia colore (**media geometrica dei canali**,
  `mescola`, perché giallo e blu devono fare verde).
- **La consegna** (`ampolle.js`): fiasco, barattolo, radice sui pioli, a misura
  reale (la radice lunga quanto sarà sul metro), con la targhetta. Una alla volta
  volano, perdono il tappo o il panno, si piegano e versano.
- **Gli ingredienti sono modelli veri, fotografati** (`scena3d/ingredienti3d.js`,
  nella creta della fattoria): il liquido si mostra con da dove viene (la bava
  col drago, il succo con la rapa). Il gioco non li costruisce: legge
  `dati/anteprime.js`, generato da `npm run anteprime pozioni` (un test confronta
  le firme), sulla pergamena, sul rotolo, nell'ordine e sopra il nome di ogni
  strumento. Provato con una versione leggera in scena: 170 ms a modello sul
  computer, fino a 576, quindi secondi sul telefono vecchio; a camera ferma la
  foto si vede uguale. Li guarda il catalogo 3D (`npm run catalogo3d:scheda --
  --gioco pozioni`).
- **Lo sporco sta attorno alla base**: davanti lo coprirebbero le targhette.
- **La telecamera** inquadra tutta la larghezza, e sposta la mira finché il
  bordo basso cade sul bordo del bancone: in piedi avanza muro sopra, dove sta
  la pergamena.
- **Pergamena e rotolo** sono carta vecchia in CSS coi due rulli di legno,
  le targhette cartoncini col buco per lo spago (`stile.css`). Prima in codice:
  dipingerli viene dopo.
- Senza WebGL la vista lo dice e offre «riprova».

## Il manifesto

- **La chiave resta `pozioni`**: è quella con cui i genitori l'hanno acceso o
  spento, e quella dei saperi. L'avanzamento sta in `profile.campagne.pozioni`.
- **I contatori hanno i nomi di sempre** (`misure`, `pozioni`,
  `pozioniPerfette`), così l'albo non torna a zero.
- **`serve: ['misure', 'conversioni']`**: senza, il gioco non è difficile ma
  impossibile, quindi la carta si spegne. `grandi: true`.

## Il dito

Sul rotolo si tocca: una targhetta va nell'ordine, un posto dell'ordine toccato
la toglie, il rotolo si chiude con la ✕. Sulla tela un tocco fermo (sotto i
16 px) su una macchia, o sul suo strumento, pulisce.

Nei test: `unita/pozioni`, `unita/pozioni-sosta`, `integrazione/pozioni`,
`integrazione/pozioni-sosta`; `.carta.gioco[data-gioco="pozioni"]`,
`.pz-tappa[data-tappa]`, `.pz-mercante[data-fase]`
(`banco`·`listino`·`macchia`·`procedimento`·`finita`), `[data-tela]`, `[data-pergamena]`,
`[data-voce]`, `[data-dose]`, `[data-gettoni]`, `[data-listino]`, `[data-merce]`,
`[data-targhetta="i:k"]`, `[data-vale]`, `[data-regola]`, `[data-chiudi]`,
`[data-ordine]`, `[data-posto]`, `[data-azione="mercante"|"ordina"|"pulisci"]`,
`[data-esito][data-codice]` (`aiuto`·`giusto`·`trabocca`), `[data-fine="tappa"]`,
`[data-righe]`, `[data-stelle]`, `[data-monete]`, `[data-nota-monete]`,
`[data-azione="avanti"|"mappa"]`; `window.__poz` (`aggiungi(i, k)`,
`togliVoce(n)`, `ordina()`, `pulisci()`, `salta()`, `bottega`).
