# La bottega del mercante (in prova)

Il laboratorio rifatto come una bottega: si ordina al mercante a gettoni
contati, e il banco è in 3D. Per ora sono tre tappe di prova accanto alla campagna, che
resta quella di [regole.md](regole.md). Il motore sta in
`src/giochi/pozioni/motore/bottega.js`, i numeri in `dati/bottega.js`, il
disegno in `scena3d/`, la vista in `viste/Mercante.vue`.

## Il gioco

- **Una pozione ha tanti ingredienti** (da due a quattro, delle tre
  famiglie), e ognuno ha il suo misurino con la tacca d'oro dove arriva la
  dose. La pergamena dice per ognuno quanto c'è e quanto ne serve,
  nell'unità della ricetta.
- **Il listino del mercante**: quattro targhette per ingrediente, ognuna
  con quanto c'è nell'ampolla e il prezzo. Si ricomprano quante volte si
  vuole. **Niente figure che suggeriscano quanto**: provato con le
  ampolle in fila sul bancone, grandi quanto la roba, e si somigliavano
  tutte (non si capiva che erano diverse) o, più diverse, davano la
  risposta senza leggere. Quanto c'è lo dice solo la targhetta.
- **Si fa un ordine**: due o tre targhette (`ordine` della tappa), anche
  di ingredienti diversi, poi «Ordina». Si paga tutto, il mercante porta
  le ampolle sul bancone (tutte uguali, con la targhetta) e le versa una
  alla volta, nell'ordine scritto. Ordinare più ampolle insieme vuol dire
  fare la somma prima di vederla: è lì che si ragiona.
- **Le grandi costano meno al chilo** (`PEZZI`, `PREZZO`): 1 kg 4 gettoni,
  5 hg 3, 1 hg 1. Così conviene sempre «la più grande che ci sta», ma per
  sapere cosa ci sta bisogna sapere a cosa corrisponde l'etichetta: è la
  conversione, al servizio di una scelta (come sommare monete diverse).
  Il giocatore finto goloso fa sempre il minimo (`giocaGoloso`, nel test).
- **Il trucco del mercante** (`gemelli`): spesso la stessa quantità sta sul
  bancone due volte, scritta in due unità, e una costa un gettone in più.
  Chi riconosce che «5 hg» e «500 g» sono la stessa cosa risparmia.
- **Il mercante scrive come gli pare**: l'etichetta è di solito in
  un'unità diversa da quella della ricetta (`etichetta`).
- **Oltre la tacca trabocca**: quell'ampolla è pagata e persa, il
  misurino resta dov'era, e attorno alla sua base resta una macchia; le
  altre dell'ordine si versano lo stesso. **Prima di ordinare ancora si
  pulisce**: un gettone a macchia (`PULIZIA`), una per misurino
  traboccato. Il perché arriva a fine consegna, coi numeri di quel
  momento (cosa vale l'ampolla, quanto c'era, quanto faceva, quanto
  mancava), e la spugna si può usare solo dopo la barra di lettura (la
  stessa attesa dei quiz).
- **Le stelle dicono quanto si è speso**, non quante volte si è sbagliato:
  tre al minimo, due fino a tre gettoni in più, una comunque
  (`stelle`). Alla fine, se si è speso di più, si dice il modo più
  economico ingrediente per ingrediente (`piuEconomico`).
- **I gettoni sono della pozione**, non le monete del bambino: il
  bilancio è il minimo più il margine della tappa, e se finisce si va in
  rosso e la pozione si finisce lo stesso. Le monete vere sono
  `MONETE_A_DOSE` (tre) per ogni ingrediente finito senza traboccare:
  comprare tante ampolle piccole non rende di più.

## Le regole del banchetto

- **Il pezzo piccolo divide la dose e tutti gli altri pezzi**: è quello che
  rende ogni dose componibile da qualunque punto. Provato senza (0,1 e
  0,25 sullo stesso banco): resta un avanzo che nessuna ampolla copre.
- Quattro ampolle: il piccolo, due più grandi che ci stanno, e il gemello
  o un altro pezzo qualunque (anche più grande della dose: un'esca vera
  solo a misurino quasi pieno).
- `ottimo` cerca il minimo con le ampolle del banchetto (si ricompra a
  volontà); il test lo confronta con la forza bruta. Il minimo non dipende
  da come si raggruppano gli ordini.

## Le tappe di prova

| tappa | ingredienti | margine | quanto manca | ricetta | ampolle per ordine |
|---|---|---|---|---|---|
| Dal mercante | 2 (pesi e liquidi) | 8 | sì | in unità grande | 2 |
| Il mercante furbo | 3 | 5 | sì | in unità grande | 3 |
| Gettoni contati | 4 | 2 | no | anche in g, cm, ml | 3 |

All'inizio il margine è largo; «quanto manca» fa la sottrazione al posto
del bambino, e nell'ultima la si fa da sé. Si vedono sulla mappa solo coi
giochi in prova accesi; il trucco `#pozioni=mercante&prova=2` le apre
comunque. Non stanno nella campagna: niente sosta, niente stelle sulla
mappa.

## Cosa va al motore di apprendimento

Ogni ampolla comprata con l'etichetta in un'unità diversa da quella della
ricetta conta come una conversione (`pozioni:dl-l`): giusta se ci stava,
sbagliata se è traboccata. Una scelta che ci sta ma costa di più resta una
conversione giusta.

## Il disegno

**Chi gioca non disegna**: `Mercante.vue` passa a `imposta()` una scena già
decisa (misurini col livello e i pezzi, le macchie, i colori nel
calderone) e chiede le animazioni (`ordine`, `pulisci`, `festa`), che
tornano una promessa. Ogni voce dell'ordine dice già com'è andata (il
motore ha deciso tutto quando si è ordinato); mentre la scena le suona la
scena nuova aspetta (`occupa`), e **la pergamena segue il mercante**: un
misurino cambia numero solo quando la sua ampolla è versata, se no il
risultato si legge prima di vederlo.

- **Il tavolo**: muro di mattoni con gli scaffali, calderone di ghisa sul
  fuoco (bolle, vapore, luce che trema), i misurini in fila davanti, il
  bancone del mercante in basso, vuoto finché non arriva la consegna (lì
  sopra sta il cartello dei messaggi). Sotto la tela, in HTML, il listino
  e l'ordine, vicino al pollice.
- **I misurini** (`vasi.js`): vetro, tacca d'oro, dentro il liquido, la
  polvere col suo mucchietto o la radice a pezzi impilati (si vedono i
  pezzi comprati). Pochi misurini stanno larghi e crescono.
- **La consegna** (`ampolle.js`): fiasco, barattolo, radice coricata sui
  pioli, tutti della stessa misura; la targhetta porta il testo, e basta.
- **Le animazioni**: le ampolle scendono sul bancone; una alla volta
  volano ad arco, si piegano e versano (la radice si raddrizza e scivola
  nel vetro); traboccando la schiuma esce dal bordo e cola, la radice
  sporge e cade; a fine consegna i misurini arrivati alla tacca si versano
  nel calderone, che cambia colore (prima no: un'ampolla di troppo deve
  traboccare da un misurino ancora pieno); la spugna gira su ogni macchia;
  alla fine il calderone sbuffa del suo colore.
- **La telecamera** inquadra tutta la larghezza, e sposta la mira finché
  il bordo basso dello schermo cade sul bordo del bancone: in piedi avanza
  muro sopra, dove sta la pergamena.
- Senza WebGL la vista lo dice e offre «riprova».

## Il dito

Un tocco fermo (sotto i 16 px) sulla tela chiede cosa c'è sotto: un
misurino sceglie il suo listino (o, se ha la macchia attorno, pulisce), la
macchia pulisce. Una riga della pergamena sceglie il listino; una
targhetta va nell'ordine, un posto dell'ordine toccato la toglie.

## Da fare

- Il cliente che beve la pozione e quello che succede (il gigante che
  cresce): oggi la fine è lo sbuffo del calderone.
- Decidere se la bottega prende il posto del banco nella campagna, e con
  che scaletta.

Nei test: `unita/pozioni-bottega`; `[data-prova]` sulla mappa,
`.pz-mercante[data-fase]` (`ordina`·`macchia`·`finita`), `[data-tela]`,
`[data-gettoni]`, `[data-voce]`, `[data-listino]`, `[data-targhetta]`,
`[data-ordine]`, `[data-posto]`, `[data-azione="ordina"|"pulisci"]`,
`[data-esito][data-codice]` (`aiuto`·`giusto`·`trabocca`), `[data-righe]`
nel cartello di fine; `window.__poz.aggiungi(i, k)`, `.togliVoce(n)`,
`.ordina()`, `.scegli(i)`, `.pulisci()`.
