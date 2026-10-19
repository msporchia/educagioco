# Il mondo di sopra in 3D

La fase 2 del mondo aperto ([mondo-aperto-fasi.md](mondo-aperto-fasi.md#7-le-fasi)): nel **Sotterraneo 3D** (`sotterraneo3d`, in
prova) la terra di sopra non è più la mappa dipinta ma il mondo generato (seme 19, 160×140 celle, 5×5 regioni ad anelli:
[mondo-aperto-generatore.md](mondo-aperto-generatore.md)) disegnato in WebGL, dal prototipo approvato `poc/mondo-sopra`. Il
Sotterraneo di sempre resta sulla terra dipinta ([terra-di-sopra.md](terra-di-sopra.md)), identico. Mostri sopra non ce ne
sono ancora (la fase 5): il mondo si gira, si scende nei sette dungeon e si torna.

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `viste/Mondo3d.vue` | la vista: l'eroe che cammina, chi sta dove, il dito, i dialoghi, il fumetto, le pietre, la veduta, il salvataggio. Le stesse porte di `Terra.vue` verso `Campagna.vue`, più `mondo`, `risposta`, `veduta` |
| `viste/FumettoMondo.vue` | quello che dice il fumetto: un ingresso, una pietra, il portale, il cartello, la bacheca, una grata chiusa |
| `motore/mondo-sopra.js` | puro: il mondo tenuto una volta, i passaggi aperti per la storia, la nebbia in base64, la prima volta, il portale nella città giusta, le pietre e il viaggio, il cartello |
| `scena3d/mondo/indice.js` | la porta verso la vista: lo stato `S` da disegnare, i pezzi costruiti e buttati, il giro di ogni fotogramma, `grafica()` |
| `pezzi.js`, `dito.js`, `suolo.js` | puri: il mondo a pezzi di 32×28 celle; i bersagli del dito; l'altezza del terreno e dei ponti, il caso e il rumore |
| `vesti.js` | quello che tutti i materiali hanno: il vento, l'ombra delle nuvole, la nebbia (superficie o oggetto intero) |
| `nebbia.js` | le due trame della nebbia e il velo di nuvole |
| `terreno.js`, `acqua.js`, `lontano.js` | il terreno di un pezzo (e la gonna che chiude le fessure), il fuori mappa, le piazze, i campi; l'acqua e il cielo; il mondo a dettaglio basso |
| `kit.js`, `ponti.js`, `monumenti.js` | case, botteghe, pozzo, mulino; ponti, grate, staccionate, cartello, bacheca, campo del minatore, antri; gli otto ingressi, la pietra del viaggio, il portale gemello |
| `props-citta.js`, `props-modelli.js` | gli oggetti di scena delle tre città: dove stanno (puro, dalle celle del mondo) e i modelli (barili, carretti, bancarelle, rastrelliere, lanterne, tende, palizzata…) |
| `natura.js`, `vita.js`, `persone.js`, `trame.js`, `veduta.js` | alberi e decoro a istanze; fumo, spruzzi, faville, fiamme, uccelli; le figure ancorate; le trame su canvas; la telecamera e la veduta |

`Campagna.vue` sceglie `Mondo3d.vue` con `disegno: '3d'` e la carica a richiesta (il Sotterraneo di sempre non tira dentro
three). `Gioco.vue` passa `mondo`, la veduta (`vedutaSopra`, la casella della mappa nella barra di sopra, `mappaSopra`) e
paga la risposta giusta di una pietra.

## Il salvataggio

- **Il campo `mondo` nell'avventura** (`profile.campagne.sotterraneo.cfg.avventure[eroe].mondo`), accanto a `terra` del 2D che
  non si tocca: `{ nebbia, dove, giro, pietre, parlato, divieti, novita }`. La nebbia è un bit per cella in base64 (3 734
  caratteri); un codice che non torna è nebbia nuova. `dove` è `{ x, y }`, o `{ portale: true }` salendo dal portale.
- **Stessa chiave del Sotterraneo, per ora.** La chiave `sotterraneo3d` separata e «porta qui il tuo eroe» sono la fase 9
  (decisione 2 dell'utente): il campo `mondo` è lo stesso nei due casi, quindi quando arriva la chiave nuova si sposta l'avventura
  intera e basta. Oggi una discesa finita nel 3D vale anche nel 2D, come prima del mondo.
- **La prima volta** si vede la piazza; chi ha già finito delle discese ritrova scoperte le strade fino a loro e accese le loro
  pietre (la tabella del travaso di [mondo-aperto-dati.md](mondo-aperto-dati.md)). `MONDO` non sale.
- Si salva arrivando, scoprendo (al più ogni tre secondi), accendendo una pietra, viaggiando e uscendo.

## La vista e la veduta

- **La telecamera** sta a 52°, vede almeno 15 celle in largo e 18 in profondo, segue l'eroe morbida e lo tiene a metà dello
  spazio libero fra le carte in cima e in fondo (`copri`, misurate come sulla terra dipinta); col dialogo aperto si allontana
  un poco. La rotella avvicina e allontana.
- **La veduta d'insieme** è la casella «mappa grande» della barra di sopra: sale fino al mondo intero, coi nomi delle città, dei
  dungeon trovati e delle regioni viste, le pietre (✦ quelle accese) e il segno «tu». Un tocco manda l'eroe lì a piedi e la
  telecamera torna a seguirlo; un tocco su una pietra accesa, stando accanto a un'altra accesa, è il viaggio.
- **Sempre giorno**: il sole con un'ombra sola (una mappa 2048 che segue l'eroe), il cielo con le nuvole, il vento su erba e
  chiome, il fumo dai camini, la ruota del mulino che gira.

## Il dito

- **Una persona vince sul prato**: per ogni persona, posto e cosa toccabile c'è un elemento HTML sopra la tela, posato a ogni
  fotogramma sul suo rettangolo a schermo (le persone almeno 72×96 px, sopra i posti); un tocco sul prato entro una cella e
  mezza dai piedi di qualcuno è un tocco su di lui (`dito.js`).
- Si agisce sul `click`; oltre i 16 px il tocco diventa un trascinare e l'eroe insegue il dito; il mouse conta solo a tasto
  premuto; un tocco nuovo annulla la meta. L'A* è quello di `motore/terra.js` sulla maschera generata coi passaggi aperti.

## Chi sta dove

- **Le figure ancorate** (la strada A): le figure dell'atlante delle discese (`scena3d/figure.js`, con `contorno`) col filo scuro
  attorno, la luce di taglio dal lato del sole, un'ombra morbida a contatto e l'ombra vera; le persone a scala 1,25 dell'eroe.
  Chi saluta, i segni sopra la testa, chi cura e il richiamo sono quelli della terra dipinta.
- **Le città**: il villaggio coi quattro mercanti, la ragazza, il minatore (sale al rifugio dopo la sesta porta); il forte e il
  rifugio coi loro mercanti (lo stesso banco, decisione 10). Il capitano non c'è ancora (non ha lo sprite né dialoghi: fase 4).
  La bacheca c'è, vuota (le taglie sono la fase 6). Il cartello indica i passaggi della città coi dungeon trovati oltre.
- **I sette dungeon e l'abisso** hanno i monumenti del prototipo (l'altare coi re, l'arco dei goblin, la torre annerita, la
  grotta con le radici e le ragnatele, la scala nel lago, la botola che fuma, la miniera con la brace, il pozzo) e i nomi nuovi.
  Arrivati a uno aperto il monumento si apre e il fumetto è quello di sempre (piani, livello, la storia, le missioni, «scendo»);
  uno chiuso pianta il divieto e dice cosa lo apre. Davanti a uno rosso la sentinella.
- **Si torna** dove si era: risalendo, lasciando perdere o svenuti si è davanti all'ingresso; dal portale accanto al gemello,
  nella città che serve quel dungeon (il villaggio, se quella non si raggiunge).
- **Le grate** dei passaggi fra gli anelli sono modellate: calate finché la storia non le alza, e toccandole dicono
  perché.
- **Gli antri** si vedono, chiusi (fase 7).

## Gli oggetti delle città

Il mondo generato non li conosce (la firma della pianta e le nebbie salvate non cambiano): `props-citta.js` li deriva a scena da
case, botteghe, piazza e strade con un caso suo (seme del mondo e indice della città), sempre uguali. Stanno su celle libere
di erba entro la città: mai su una strada, un posto, il davanti di una porta, le zone `riservato` davanti alle botteghe né
nell'acqua; non cambiano la mappa di blocco (stanno ai margini, a una cella dal muro). Si posano nel cantiere del pezzo
(`disegnaProps`, tutto unito per materiale: nessuna mesh in più per oggetto, la nebbia li legge dall'`aBase`) e ogni modello è
sotto le 700 facce. Le fiaccole e i bracieri accendono le fiamme di `vita.js` (`cose.fuochi`, al più otto per città).

- **Tutte**: un'insegna a palo per bottega (moneta, foglia, ferro di cavallo, gemma), l'arredo di ogni bottega (il fabbro la
  ruota di pietra, la rastrelliera e un'incudine; l'erborista scaffali e fiori), lanterne o torce attorno alla piazza,
  panche, tavoli con le panche, bancarelle con la tendina a righe, due o tre cose ai fianchi di ogni casa, mai sul davanti.
- **Il villaggio** (campi, carretti, fiori): orti con lo steccato, carretti col fieno, balle, cassette di fiori e vasi, bucato
  steso, botti e sacchi, lanterne a palo.
- **Il forte del guado** (palizzate, rastrelliere, tende): la palizzata attorno con i varchi alle strade, tende coniche,
  rastrelliere d'armi, manichini, bandiere, torce con la fiamma, casse.
- **Il rifugio del passo** (legna, pellicce, bracieri): cataste e ceppi con l'ascia, stanghe di pellicce, bracieri accesi,
  sacchi e botti; non ha case, quindi molto sta sparso nei prati vicino alle botteghe.
- **Per cambiarli**: il carattere sta in `MENU` (pesi, massimi, quanti sparsi), l'arredo delle botteghe in `ARREDO`; un
  modello nuovo è una funzione in `MODELLI` (origine a terra, davanti verso +z, larghezza lungo x) e, se è largo più di una
  cella, una voce in `LARGHE`. Misurato (Chrome senza schermo, davanti alla piazza del villaggio): +3 chiamate e +23k triangoli
  rispetto al villaggio spoglio.

## Le pietre del viaggio

Undici: una per città e una davanti a ogni ingresso. Toccata una spenta, una domanda col `dif` del posto (l'inizio del dungeon
che ha davanti, o della regione della città): giusta la runa si accende e paga come giù, sbagliata resta spenta e si riprova
(niente si brucia). Toccata una accesa, il fumetto elenca le altre accese: il viaggio è subito e gratis (un lampo chiaro).

## La nebbia

Quello che non si è visto non si disegna, e sopra c'è un velo di nuvole chiare.

- **Due trame del mondo, un texel per cella**: `visto` (filtrata, quattro prese e un rumore: le superfici sfumano a nuvole) e
  `quando` (il tempo della scoperta, senza filtro). Si riscrivono solo quando si scopre, mai a fotogramma.
- **Superfici** (terreno, acqua, piazze, campi): dove non si è visto, la foschia chiara che si muove.
- **Oggetti** (kit unito per pezzo, natura, monumenti, cose mobili, il mondo lontano): il vertex shader legge la cella della base
  (l'istanza, o l'attributo `aBase` del kit) e chiude tutto il pezzo se non si è visto; scoperto, sale dal terreno in 0,7 s.
  L'ombra usa lo stesso innesto: niente sagome bianche, nemmeno d'ombra. Le figure le salta la vista stessa.
- **Il velo**: cartelli di nuvola orizzontali (una InstancedMesh) che svaniscono dove sotto si è visto.
- Si scopre nel raggio di 10 celle (`VISTA_MONDO`). `#…&nebbia=no` la spegne per le foto.

## Quanto costa

Il mondo si disegna **a pezzi** di 32×28 celle (`pezzi.js`): i nove attorno all'eroe si costruiscono uno per fotogramma (dal più
vicino; 15–60 ms l'uno in SwiftShader) e si buttano a due pezzi di distanza. Un pezzo ha il terreno a due vertici per cella e il
kit unito per materiale; la natura è una InstancedMesh per tipo, riempita coi pezzi costruiti a ogni cambio. Dove non c'è un
pezzo vicino c'è il mondo lontano (`lontano.js`: il terreno a un vertice per cella a pezzi, alberi a cono, case a scatola, niente
ombra), che è anche tutta la veduta, dove l'ombra non si rifà.

Misurato in Chrome senza schermo (SwiftShader: chiamate e triangoli contano, i ms no), 390×844, pixel ratio 1:

| | chiamate | triangoli (con l'ombra) |
|---|---|---|
| dalla piazza del villaggio | 119 | 311k |
| davanti alla cripta dei re | 105 | 242k |
| la veduta d'insieme | 60 | 260k |

Provato e tolto: la natura a figure piene nei campi (cavoli a tre sfere, frutti a sfere: 460k triangoli) e il terreno lontano
in un pezzo solo (disegnato anche sotto i pezzi vicini). Il degrado a scalini non c'è; il pixel ratio si adatta come giù.

## Cosa manca

- I nomi nuovi stanno sopra; giù il titolo della discesa e le frasi del minatore e dei capitoli dicono ancora la geografia della
  mappa dipinta (fase 8).
- Il gemello sta nella città giusta, ma la guarigione gratis è di chi c'è (al rifugio non c'è il fabbro); la fontana che cura
  dove manca la guaritrice non c'è ancora (fase 4).
- La freccina verso la missione dice la direzione sul bordo, non la strada vera ([missioni-freccina.md](missioni-freccina.md)).
- Le figure restano pixel art in un mondo liscio: ancorate reggono, da vedere sul telefono. Mai misurato su un telefono vero.

Nei test: `unita/sotterraneo-mondo-props` (gli oggetti delle città: mai su strade, posti o porte, nel loro pezzo, il carattere
di ognuna, le facce dei modelli), `unita/sotterraneo-mondo-3d` (i pezzi, la divisione del mondo, le istanze nel loro pezzo, le trame della nebbia, il
dito, i ponti, il cartello), `unita/sotterraneo-mondo-salva` (la nebbia in base64, la prima volta, il gemello per città e il caso
peggiore, le pietre, il minatore, le grate), `integrazione/sotterraneo-mondo` (col dito vero: il mondo e quanto costa,
camminare, la ragazza, la bottega del fabbro, la pietra sbagliata e giusta, la veduta e il tocco lì, scendere nella cripta e
risalire davanti, la nebbia salvata, il gemello nel villaggio). Bersagli: `[data-mondo3d]` (con `data-pronto`, `data-in-veduta`),
`[data-eroe-mondo]` (`data-cella`, `data-cammina`, `data-schermo`), i bersagli `[data-bersaglio]` (`data-vis`, `data-trovato`)
con `[data-personaggio]`, `[data-mercante]` e `data-citta`, `[data-minatore]`, `[data-posto]` (`data-discesa`, `data-abisso`,
`data-aperta`, `data-divieto`), `[data-pietra]` (`data-accesa`), `[data-cartello]`, `[data-bacheca]`, `[data-portale]`,
`[data-grata]`; `[data-fumetto-di]` (`pietra`, `portale`, `cartello`, `bacheca`, `grata` o la chiave del dungeon) con
`[data-viaggio]`, `[data-nessuna-meta]`, `[data-bacheca-vuota]`, `[data-grata-perche]`; `[data-pietra-domanda]`, `[data-veduta]`
coi `[data-nome-posto]`, `[data-mondo-attesa]`; `window.__mondo3d` (`vai(chiave)`, `porta(x, z)`, `io`) e
`window.__sotterraneo3d.grafica()` (con `mondo: true`, `pezzi`, `msPezzi`, `veduta`). In `test/aiuto/browser.mjs`:
`mondoPronto`, `fermoNelMondo`, `toccaNelMondo`, `scendiNelMondo` (`scendiNelSotterraneo` lo usa da solo).
