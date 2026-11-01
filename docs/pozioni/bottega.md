# La bottega del mercante (in prova)

Il laboratorio rifatto come una bottega: si compra a gettoni contati, e il
banco è in 3D. Per ora sono tre tappe di prova accanto alla campagna, che
resta quella di [regole.md](regole.md). Il motore sta in
`src/giochi/pozioni/motore/bottega.js`, i numeri in `dati/bottega.js`, il
disegno in `scena3d/`, la vista in `viste/Mercante.vue`.

## Il gioco

- **Una pozione ha tanti ingredienti** (da due a quattro, delle tre
  famiglie), e ognuno ha il suo misurino con la tacca d'oro dove arriva la
  dose. La pergamena dice per ognuno quanto c'è e quanto ne serve,
  nell'unità della ricetta.
- **Il mercante vende ampolle a prezzo**: quattro per ingrediente, sul
  bancone. Si tocca un'ampolla, si paga, e finisce nel suo misurino. Le
  ampolle si ricomprano quante volte si vuole.
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
- **Oltre la tacca trabocca**: l'ampolla è pagata e persa, il misurino
  resta dov'era, e attorno alla sua base resta una macchia. **Prima di
  comprare ancora si pulisce**, e la spugna costa un gettone (`PULIZIA`).
  Il perché arriva subito, coi numeri di quel momento (cosa vale
  l'ampolla, quanto c'era, quanto faceva, quanto mancava), e la spugna si
  può usare solo dopo la barra di lettura (la stessa attesa dei quiz).
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
  volontà); il test lo confronta con la forza bruta.

## Le tappe di prova

| tappa | ingredienti | margine | quanto manca | ricetta |
|---|---|---|---|---|
| Dal mercante | 2 (pesi e liquidi) | 8 | sì | in unità grande |
| Il mercante furbo | 3 | 5 | sì | in unità grande |
| Gettoni contati | 4 | 2 | no | anche in g, cm, ml |

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
decisa (misurini col livello e i pezzi, i cartellini già scritti, la
macchia, i colori nel calderone) e chiede le animazioni, che tornano una
promessa. Mentre una gira, la scena nuova aspetta (`occupa`): il banchetto
non cambia sotto un'ampolla in volo.

- **Il tavolo**: muro di mattoni con gli scaffali, calderone di ghisa sul
  fuoco (bolle, vapore, luce che trema), i misurini in fila davanti, il
  bancone del mercante in basso, vicino al pollice.
- **I misurini** (`vasi.js`): vetro, tacca d'oro, dentro il liquido, la
  polvere col suo mucchietto o la radice a pezzi impilati (si vedono i
  pezzi comprati). Pochi misurini stanno larghi e crescono.
- **Le ampolle** (`ampolle.js`): fiasco, barattolo, radice coricata sui
  pioli, più grandi quando c'è più roba (la grandezza vera si vede anche
  senza leggere); il cartellino porta il testo e il prezzo nel gettone.
- **Le animazioni**: l'ampolla vola ad arco, si piega e versa (la radice
  si raddrizza e scivola nel vetro); traboccando la schiuma esce dal
  bordo e cola, la radice sporge e cade; il misurino pieno si versa nel
  calderone, che cambia colore; la spugna gira sulla macchia; alla fine il
  calderone sbuffa del suo colore.
- **La telecamera** inquadra tutta la larghezza, e sposta la mira finché
  il bordo basso dello schermo cade sul bordo del bancone: in piedi avanza
  muro sopra, dove sta la pergamena.
- Senza WebGL la vista lo dice e offre «riprova».

## Il dito

Un tocco fermo (sotto i 16 px) chiede alla scena cosa c'è sotto: un'ampolla
la compra, un misurino lo sceglie (o, se ha la macchia attorno, pulisce),
la macchia pulisce. Una riga della pergamena sceglie l'ingrediente.

## Da fare

- Il cliente che beve la pozione e quello che succede (il gigante che
  cresce): oggi la fine è lo sbuffo del calderone.
- Decidere se la bottega prende il posto del banco nella campagna, e con
  che scaletta.

Nei test: `unita/pozioni-bottega`; `[data-prova]` sulla mappa,
`.pz-mercante[data-fase]` (`compra`·`macchia`·`finita`), `[data-tela]`,
`[data-gettoni]`, `[data-voce]`, `[data-esito][data-codice]`
(`aiuto`·`giusto`·`trabocca`), `[data-azione="pulisci"]`, `[data-righe]`
nel cartello di fine; `window.__poz.compra(k)`, `.scegli(i)`, `.pulisci()`.
