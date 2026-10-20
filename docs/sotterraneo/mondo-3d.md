# Il mondo di sopra in 3D

La fase 2 del mondo aperto ([mondo-aperto-fasi.md](mondo-aperto-fasi.md#7-le-fasi)): nel **Sotterraneo 3D** (`sotterraneo3d`, in
prova) la terra di sopra non è più la mappa dipinta ma il mondo generato (seme 19, 160×140 celle, 5×5 regioni ad anelli:
[mondo-aperto-generatore.md](mondo-aperto-generatore.md)) disegnato in WebGL, dal prototipo approvato `poc/mondo-sopra`. Il
Sotterraneo di sempre resta sulla terra dipinta ([terra-di-sopra.md](terra-di-sopra.md)), identico. Dal 19 ottobre ci sono i mostri
di sopra e lo scontro sul prato (la fase 5: [mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md)).

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
| `fontana.js` | la fontana della piazza, dove manca chi cura: vasca, stelo, coppa, e l'acqua che si muove |
| `props-citta.js`, `props-modelli.js` | gli oggetti di scena delle tre città: dove stanno (puro, dalle celle del mondo) e i modelli (barili, carretti, bancarelle, rastrelliere, lanterne, tende, palizzata…) |
| `props-dove.js`, `props-aperto.js` | gli oggetti di scena fuori dalle città e lo scenario degli ingressi: dove stanno (puro: habitat, celle libere, strade, lotti) e le forme (lapidi, rovine, menhir, palafitte, fumarole, carrelli, accampamenti, cartelli…) |
| `natura.js`, `vita.js`, `persone.js`, `trame.js`, `veduta.js` | alberi e decoro a istanze; fumo, spruzzi, faville, fiamme, uccelli; le figure ancorate (anche i mostri); le trame su canvas; la telecamera e la veduta |
| `mostri.js`, `palco.js` | i mostri di sopra a schermo (puro: il cerchio di luce, le figure) e il palco dello scontro posato sul prato ([mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md)) |

`Campagna.vue` sceglie `Mondo3d.vue` con `disegno: '3d'` e la carica a richiesta (il Sotterraneo di sempre non tira dentro three).
`Gioco.vue` passa `mondo`, la veduta (`vedutaSopra`, la casella della mappa nella barra di sopra, `mappaSopra`) e paga la pietra.

## Il salvataggio

- **Il campo `mondo` nell'avventura** (`profile.campagne.sotterraneo.cfg.avventure[eroe].mondo`), accanto a `terra` del 2D che
  non si tocca: `{ nebbia, dove, giro, pietre, parlato, divieti, novita, quest }` (`quest` lo scrive `Gioco.vue`, le taglie: `{ stati, fatte }`). La nebbia è un bit per cella in base64 (3 734
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
  rifugio coi loro mercanti (lo stesso banco, decisione 10: il fabbro del forte apre la bottega del villaggio). Nel forte c'è il
  capitano e la fontana (sotto). La bacheca appende le taglie del giro (fase 6, sotto «La bacheca e le taglie»). Il cartello indica i passaggi della città coi dungeon trovati oltre.
- **I sette dungeon e l'abisso** hanno i monumenti del prototipo (l'altare coi re, l'arco dei goblin, la torre annerita, la
  grotta con le radici e le ragnatele, la scala nel lago, la botola che fuma, la miniera con la brace, il pozzo) e i nomi nuovi.
  Arrivati a uno aperto il monumento si apre e il fumetto è quello di sempre (piani, livello, la storia, le missioni, «scendo»);
  uno chiuso pianta il divieto e dice cosa lo apre. Davanti a uno rosso la sentinella.
- **Si torna** dove si era: risalendo, lasciando perdere o svenuti si è davanti all'ingresso; dal portale accanto al gemello,
  nella città che serve quel dungeon (il villaggio, se quella non si raggiunge).
- **Le grate** dei passaggi fra gli anelli sono modellate: calate finché la storia non le alza, e toccandole dicono perché. **Gli
  antri** si vedono, chiusi (fase 7).

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

## I props fuori dalle città e attorno agli ingressi

Come quelli delle città: il generatore non li conosce (pianta, firma e nebbie salvate restano), `props-dove.js` li deriva a scena
dalle celle (habitat della regione, erba libera, strade, lotti, alberi del decoro) con un caso suo, sempre uguali; `props-aperto.js`
li posa nel cantiere del pezzo (`disegnaPropsAperti`: niente mesh per oggetto, la nebbia li legge dall'`aBase`). Mai su una strada,
un lotto, un campo, un ponte o un valico, davanti a una porta (`riservato`), in una città (e tre celle attorno), nel villaggio, né dentro
un albero (conta la distanza dal decoro che blocca); non cambiano la mappa di blocco. I pezzi lontani non li hanno.

- **Come si scelgono**: per ogni regione fuori dal villaggio la `TABELLA` dell'habitat dice cosa e quanto spesso; a ogni cella una
  prova per tipo, con una macchia di rumore che li raggruppa; prima i grandi (`FORME[tipo].R`, le celle che vogliono libere), poi i
  piccoli negli spazi che restano. `DENSITA` e `PIU_GRANDI` pareggiano le prove che cadono su un albero o una strada. Lungo le strade
  un cartello, un totem (nei posti di pietra) o una pietra miliare, ogni sei celle al meno, col davanti verso la strada.
- **Per habitat**: cimitero (lapidi in fila coi tumuli, croci, cripte basse, il cancello rotto); rovine (arco spezzato, colonne
  spezzate, muretti a secco, macerie); brughiera e colle dei corvi (menhir, cerchi di pietre, tumuli con la porta, erica fiorita);
  bosco, foresta e bosco secco (tronchi caduti, ceppi grandi, funghi giganti, ragnatele fra due rami secchi); lago e palude
  (palafitte, barche rovesciate, canneti, ninfee, pali storti); ceneri (fumarole che fumano, rocce spaccate che brillano, ossa di
  bestia, tridenti piantati); monte e colline (carrelli, binari, travi, mucchi di minerale, argani, ometti di sassi); landa (menhir,
  ossa, croci, tridenti); prati e campi (accampamenti col falò spento e i tronchi per sedersi, carri abbandonati, steccati rotti,
  sacchi, cassette di mele).
- **Gli ingressi** hanno il loro scenario in `SCENARI` (offset dal centro del lotto, che si cercano attorno al posto voluto se cade
  su un albero o una strada): lapidi, croci, cripte e il cancello alla cripta dei re; palizzata, sacchi, teschi e un carro alle
  cantine; travi bruciate e macerie annerite alla torre; ragnatele, bozzoli e funghi alla tana dei ragni; pozze, pali, canneti, ninfee
  e la palafitta alle sale allagate; bracieri accesi, teschi su pali, tridenti, rocce spaccate e terra bruciata alla porta
  dell'inferno; carrello, minerale, travi e lanterna alle miniere; il cerchio di menhir con ossa e croci al pozzo.
- **Costo**: 550 oggetti in tutto il mondo, ~79k triangoli (senza ombra), il pezzo più carico ~7k, solo i materiali che i pezzi
  hanno già (pietra, legno, liscio, luce dove brilla). Misurato (Chrome senza schermo, 390×844): +1 chiamata e +34k triangoli
  davanti alla piazza del villaggio (361k in tutto con gli oggetti delle città), +10/+42k davanti alla cripta, +1/+32k alle sale
  allagate, +3/+21k alla porta dell'inferno, +9/+24k alle miniere, +8/+39k al pozzo.
- **Per cambiarli**: un tipo nuovo è una funzione in `FORME_DISEGNO` (origine a terra, davanti verso +z) e una voce in `FORME` e
  nella `TABELLA` (o nei `SCENARI`); le fumarole e i bracieri mettono fumo, braci e fiamme in `cose` (le fiamme sono al più 24 in
  tutto, tienine pochi per pezzo).

## Il capitano e la fontana

- **Il capitano del forte** è fra le persone fisse (`bersagli` di `Mondo3d.vue`, `PERSONAGGI_DI_SOPRA`): lo sprite della guardia, più
  alto e col suo blu (`scala` e `tinta` dei bersagli, letti da `persone.js`); il posto lo dà il generatore (la città `forte`,
  `persone: ['capitano']`). Ha il «!» finché non ha detto la porta di adesso, quando è la quinta o la sesta; cosa dice:
  [dialoghi.md](dialoghi.md#il-capitano-del-forte).
- **La fontana** sta dove il generatore ha già messo il pozzo (il 2×2 al centro della piazza, un ingombro): non cambia l'output del
  generatore e non aggiunge posti. La regola (`hoLaFontana`, `fontaneDi` in `motore/mondo-sopra.js`) la deriva dai mercanti della
  città: dove manca la guaritrice o l'incantatrice c'è l'acqua al posto del pozzo, e cura vita ed energia insieme, gratis, a chi è salito
  dal portale ([chi-cura.md](chi-cura.md#la-fontana)). Oggi è solo il forte (non ha l'incantatrice). Il modello è
  `scena3d/mondo/fontana.js`, tutto in codice come il kit: vasca bassa di pietra con l'acqua incassata, stelo, coppa alta con quattro
  bocchette; si muovono le quattro cascatelle, il getto in cima, sedici gocce in tiro balistico dalla coppa alla vasca (col tempo del
  gioco, non coi fotogrammi) e gli spruzzi di `vita.js`; i materiali sono i `mobili` del kit, quindi la nebbia la chiude intera come
  gli altri oggetti.
- Si tocca come una cosa (`tipo: 'cosa'`, dopo le persone): l'eroe ci va e si apre un fumetto con «bevo»; sopra, finché serve, il
  richiamo come quello della guaritrice. Bevendo, `Gioco.vue` scrive la sosta a vita ed energia piene (`curaDa('tutto')`) e sopra
  l'eroe salgono i due numeri.

## La bacheca e le taglie

- **Il fumetto della bacheca** (`FumettoMondo.vue`, `f.tipo === 'bacheca'`): una riga per foglio (faccia, titolo, dove, 💎), prima quelle da
  consegnare qui (tasto «consegno», d'oro), poi quelle in corso, poi i tre fogli nuovi («prendo»); con tre taglie in mano i nuovi sono
  spenti e una riga lo dice. La lista scorre dentro il fumetto (44% dell'altezza). `Mondo3d.vue` manda `taglia` (`{ id, azione }`) a
  `azioneMissione` di `Gioco.vue`; le righe le fa `vociDellaBacheca` ([mondo-aperto-quest.md](mondo-aperto-quest.md)).
- **Sul prato, solo a taglia in mano**: chi si era perso (`trova-chi`: una figura dell'atlante, `[data-viandante]`, parlargli fa la
  taglia) e la X della mappa (`[data-scavo]`, un segno ✕ e un fumetto «scavo» che apre una domanda: giusto e si trova, sbagliato e si
  riprova). Il posto lo sceglie `postoSulPrato` (vicino alla tana della regione, sulla strada vera) e non cambia. Sono bersagli nuovi
  di `preparaBersagli`; il generatore e la pianta non cambiano.
- **I segni**: la bacheca ha il «!», il «?» d'oro o il «?» grigio (`segnoDellaBacheca`); in veduta 📜 con lo stesso segno e, per la taglia
  seguita, un cerchio (◎) sul posto; sul bordo la freccia azzurra con la faccia della taglia. «Esplora» si fa da sé quando la nebbia
  scopre il posto (`controllaTaglie`).
- **Il giro** (`giro` in `mondo`) è un ref; conta un ritorno in città solo dopo essersi allontanati più di `raggio + 8` celle (`lontanoDalleCitta`)
  o salendo dal portale. Si salva con il resto del mondo.

## Le pietre del viaggio

Undici: una per città e una davanti a ogni ingresso. Toccata una spenta, una domanda col `dif` del posto (l'inizio del dungeon
che ha davanti, o della regione della città): giusta la runa si accende e paga come giù, sbagliata resta spenta e si riprova
(niente si brucia). Toccata una accesa, il fumetto elenca le altre accese: il viaggio è subito e gratis (un lampo chiaro).

## Le icone dei posti

Le sette discese, l'abisso e le tre città hanno un'icona **fotografata nel mondo 3D**, non ritagliata dalla mappa dipinta.

- **Il comando**: `npm run scatti icone-mondo` (`strumenti/icone-mondo.mjs`, chiamato da `strumenti/scatti.mjs`; non gira con «tutte»,
  solo se nominato; `ICONE_DEBUG=1` lascia i PNG in `tmp/scatti/icone-mondo/`). Apre il file costruito sul mondo, con un profilo
  che ha finito tutte le discese (nessun ingresso porta il divieto), porta la telecamera sul centro di ogni monumento o sulla
  piazza della città, ritaglia, riduce a 112 px, ci mette un tondo sfumato come ai ritagli di prima e scrive
  `dati/icone-mondo.js` (`ICONE_MONDO`, in WebP con perdita, ~4 KB l'una). Si rilancia quando un monumento cambia faccia.
- **L'inquadratura è una per tutti**: finestra quadrata 440 px, inclinazione di serie; i dungeon allo zoom più vicino (0,7) col
  62% centrale del quadro, le città al più lontano (1,5) col 90%. Giorno, ombra del sole, `&nebbia=no`, e `&senzaeroe` (il cheat
  nuovo: l'eroe non si disegna, così la telecamera sta sul monumento e non su di lui) con l'interfaccia nascosta.
- **Il file è generato** e porta la firma del suo contenuto: non si scrive a mano; `unita/sotterraneo-icone-mondo` la ricalcola, e
  controlla che ci sia un'icona per posto, WebP 112×112, sotto i 9 KB l'una.
- **Chi le usa**: `iconaDi(chiave, mondo)` in `dati/terra.js`. Nel Sotterraneo 3D (`mondo` vero) dà la fotografia, nel 2D di sempre
  il ritaglio dipinto (`terra-icone.js`, intatto). Passano `in3d`: il diario (`:mondo`, anche quello dentro una discesa), la scelta
  degli eroi («a metà»), la carta «riprendi» di `Campagna`, la bussola della meta. La **home** non le usa ancora: la sua carta
  «riprendi» viene da `ripresa()` del manifesto del Sotterraneo (2D) e `sotterraneo3d` non ne ha uno
  ([da-fare-3d-e-mondo.md](da-fare-3d-e-mondo.md)). Le icone sono stringhe: la home non importa three, e
  `unita/sotterraneo-icone-mondo` lo prova camminando sulle importazioni statiche.
- **Peso**: ~+60 KB nel file unico (le fotografie in base64, senza three).

## La nebbia

Quello che non si è visto non si disegna, e sopra c'è un velo di nuvole chiare.

- **Due trame del mondo, un texel per cella**: `visto` (filtrata, quattro prese e un rumore: le superfici sfumano a nuvole) e
  `quando` (il tempo della scoperta, senza filtro). Si riscrivono solo quando si scopre, mai a fotogramma.
- **Superfici** (terreno, acqua, piazze, campi): dove non si è visto, la foschia chiara che si muove.
- **Oggetti** (kit unito per pezzo, natura, monumenti, cose mobili, il mondo lontano): il vertex shader legge la cella della base
  (l'istanza, o l'attributo `aBase` del kit) e chiude tutto il pezzo se non si è visto; scoperto, sale dal terreno in 0,7 s.
  L'ombra usa lo stesso innesto: niente sagome bianche, nemmeno d'ombra. Le figure le salta la vista stessa.
- **Il velo**: cartelli di nuvola orizzontali (una InstancedMesh) che svaniscono dove sotto si è visto.
- Si scopre nel raggio di 10 celle (`VISTA_MONDO`). `#…&nebbia=no` la spegne per le foto (e `&senzaeroe` nasconde l'eroe).

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

Dove andare (la carta della meta, «portami lì», le luci e il velo della strada) sta in [mondo-3d-la-meta.md](mondo-3d-la-meta.md); le figure pixel art in un
mondo liscio, ancorate, reggono ma vanno viste sul telefono (mai misurato su uno vero). I mostri: [mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md).

Nei test: `unita/sotterraneo-mondo-props` (gli oggetti delle città: mai su strade, posti o porte, nel loro pezzo, il carattere
di ognuna, le facce dei modelli), `unita/sotterraneo-mondo-aperto-props` (quelli fuori dalle città: pianta e firma invariate, sempre uguali, mai su strade, lotti, città o davanti a una porta, un repertorio per habitat, uno scenario per ingresso, i costi), `unita/sotterraneo-mondo-3d` (i pezzi, la divisione del mondo, le istanze nel loro pezzo, le trame della nebbia, il
dito, i ponti, il cartello), `unita/sotterraneo-mondo-salva` (la nebbia in base64, la prima volta, il gemello per città e il caso
peggiore, le pietre, il minatore, le grate), `integrazione/sotterraneo-mondo` (col dito vero: il mondo e quanto costa,
camminare, la ragazza, la bottega del fabbro, la pietra sbagliata e giusta, la veduta e il tocco lì, scendere nella cripta e
risalire davanti, la nebbia salvata, il gemello nel villaggio; al forte la fontana che richiama e cura, il capitano col «!» e la
quinta porta, il fabbro di sempre), `unita/sotterraneo-quest-modelli` e `integrazione/sotterraneo-bacheca` (le taglie: `[data-bacheca]` con `data-segno`, `[data-fumetto-di="bacheca"]`, `[data-taglia]` con `data-stato`, `[data-taglia-prendi]`, `[data-taglia-consegna]`, `[data-taglie-piene]`, `[data-viandante]`, `[data-scavo]`), `unita/sotterraneo-citta` (il capitano, la sua strada, la regola e il posto della fontana),
`unita/sotterraneo-nomi` (i nomi nuovi in ogni testo). Bersagli: `[data-mondo3d]` (con `data-pronto`, `data-in-veduta`),
`[data-eroe-mondo]` (`data-cella`, `data-cammina`, `data-schermo`), i bersagli `[data-bersaglio]` (`data-vis`, `data-trovato`)
con `[data-personaggio]`, `[data-mercante]` e `data-citta`, `[data-minatore]`, `[data-posto]` (`data-discesa`, `data-abisso`,
`data-aperta`, `data-divieto`), `[data-pietra]` (`data-accesa`), `[data-cartello]`, `[data-bacheca]`, `[data-fontana]` (la città), `[data-portale]`,
`[data-grata]`; `[data-fumetto-di]` (`pietra`, `portale`, `cartello`, `bacheca`, `fontana`, `grata` o la chiave del dungeon) con
`[data-viaggio]`, `[data-nessuna-meta]`, `[data-bacheca-vuota]`, `[data-grata-perche]`, `[data-fontana-dice]` (`data-serve`) e il tasto
`[data-azione="bevi"]`, `[data-richiamo-di="fontana"]`, `[data-cura-fiocco][data-risorsa="tutto"]`, `[data-segno="nuova"]` sul capitano;
`[data-pietra-domanda]`, `[data-scavo-domanda]`, `[data-veduta]`
coi `[data-nome-posto]`, `[data-mondo-attesa]`; `window.__mondo3d` (`vai(chiave)`, `porta(x, z)`, `io`, `giro()`) e
`window.__sotterraneo3d.grafica()` (con `mondo: true`, `pezzi`, `msPezzi`, `veduta`). In `test/aiuto/browser.mjs`:
`mondoPronto`, `fermoNelMondo`, `toccaNelMondo`, `scendiNelMondo` (`scendiNelSotterraneo` lo usa da solo).
