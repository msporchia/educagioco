# Il mondo di sopra in 3D

Nel **Sotterraneo 3D** (`sotterraneo3d`, in prova) la terra di sopra non è la mappa dipinta ma il **mondo a percorso** (seme 8,
504×300 celle, sette zone in serpentina dal villaggio: [mondo-a-percorso.md](mondo-a-percorso.md), il generatore e il suo
contratto in [mondo-aperto-generatore.md](mondo-aperto-generatore.md)) disegnato in WebGL. Il Sotterraneo di sempre resta sulla
terra dipinta ([terra-di-sopra.md](terra-di-sopra.md)), identico. Il motore di sopra (il mondo tenuto, la terra, la nebbia, le
pietre, il salvato) è in [mondo-sopra-contratto.md](mondo-sopra-contratto.md); i mostri di sopra a schermo in
[mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md); dove andare in [mondo-3d-la-meta.md](mondo-3d-la-meta.md); gli
oggetti di scena (del villaggio e fuori) in [mondo-3d-oggetti.md](mondo-3d-oggetti.md).

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `viste/Mondo3d.vue` | la vista: l'eroe che cammina, chi sta dove, il dito, i dialoghi, il fumetto, le pietre, la veduta, il cartello della zona, il salvataggio. Le stesse porte di `Terra.vue` verso `Campagna.vue`, più `mondo`, `risposta`, `veduta`; la prop `dungeon` (i tredici dungeon di `Gioco.vue`) |
| `viste/FumettoMondo.vue` | quello che dice il fumetto: un ingresso, una pietra, il portale, il cartello, la bacheca, la fontana, la porta delle terre |
| `scena3d/mondo/indice.js` | la porta verso la vista: lo stato `S` da disegnare, **le zone caricate attorno all'eroe**, i pezzi costruiti e buttati, il giro di ogni fotogramma, `grafica()` |
| `pezzi.js`, `dito.js`, `suolo.js` | puri: il mondo a pezzi di 32×28 celle e cosa ci sta (dallo scheletro e dalle zone caricate); i bersagli del dito (e le persone vicine che si dividono lo spazio); l'altezza del terreno e dei ponti, con le celle mai caricate lette dalla loro base |
| `vesti.js` | quello che tutti i materiali hanno: il vento, l'ombra delle nuvole, la nebbia, la trama dei pezzi costruiti (`uPezzi`) |
| `nebbia.js` | le due trame della nebbia e il velo di nuvole |
| `terreno.js`, `acqua.js`, `lontano.js` | il terreno di un pezzo (con la gonna e le normali che combaciano), il fuori mappa, la piazza, i campi; l'acqua e il cielo; il mondo a dettaglio basso |
| `kit.js`, `ponti.js`, `monumenti.js` | case, botteghe, pozzo, mulino; ponti dei confini, staccionate, cartello, bacheca, campo del minatore; i quattordici ingressi, le pietre (del villaggio e di zona), la porta delle terre, il portale gemello |
| `fontana.js` | la fontana della piazza, dove manca chi cura (oggi in nessuna città: il villaggio li ha tutti e due) |
| `props-citta.js`, `props-dove.js`, `props-aperto.js`, `props-modelli.js` | gli oggetti di scena: [mondo-3d-oggetti.md](mondo-3d-oggetti.md) |
| `natura.js`, `vita.js`, `persone.js`, `trame.js`, `veduta.js` | alberi e decoro a istanze, per pezzo; fumo, spruzzi, faville, fiamme, uccelli; le figure ancorate (anche i mostri); le trame su canvas; la telecamera e la veduta |
| `mostri.js`, `palco.js` | i mostri di sopra a schermo e il palco dello scontro ([mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md)) |

`Campagna.vue` sceglie `Mondo3d.vue` con `disegno: '3d'` e la carica a richiesta (il Sotterraneo di sempre non tira dentro three).
`Gioco.vue` passa `mondo`, la veduta (`vedutaSopra`, la casella «mappa grande» della barra di sopra) e i tredici dungeon
(`dungeonDelMondo`, [dungeon-che-si-rigenerano.md](dungeon-che-si-rigenerano.md)), e paga la pietra.

## Le zone e i pezzi

- **La scena carica le zone** (`caricaZona` del generatore): quella dove sta l'eroe subito, le due accanto quando i pezzi vicini sono
  fatti, **una per fotogramma**; le altre si scaricano (le celle restano scritte, le liste se ne vanno). Una zona accanto aspetta che
  l'eroe sia fermo, o che arrivi a 60 celle dal confine: sul telefono una zona sono 0,2–0,6 s, e da fermi non si sente. Un salto (la
  pietra, il risveglio, le prove) carica subito la zona d'arrivo (`caricaQui`). La vista lo sa da `zone(k, caricata)` e rifà la
  terra dove si cammina (`terraDelMondo`); i mostri seguono da soli ([mondo-sopra-contratto.md](mondo-sopra-contratto.md)).
- **Un pezzo** (32×28 celle, 16×11 nel mondo) si costruisce solo quando le sue zone fra quelle attorno all'eroe sono caricate; oltre
  una cresta, le celle di una zona mai caricata si disegnano dalla base pura (`baseDi`: niente laghi interni, niente decoro). Si butta
  a due pezzi dall'eroe, o quando una delle sue zone si carica o si scarica (`ancoraUguale`). I nove attorno all'eroe uno per
  fotogramma, il più vicino prima; le istanze della natura e gli oggetti di scena sono del pezzo e se ne vanno con lui.
- **Il lontano** (`lontano.js`) viene dallo scheletro e dalla base, senza zone caricate: il terreno a un vertice ogni due celle (a
  pezzi per la vista vicina, spenti sotto quelli costruiti; a blocchi di 4×4 pezzi per la veduta), gli alberi a cono dall'habitat del
  luogo, case e posti a scatola, i ponti a tavola. Quando una zona si carica la prima volta i suoi pezzi lontani si rifanno, e vedono il
  lago e le rocce. Provato e tolto: i soli blocchi con lo scarto per pixel sotto i pezzi vicini (lo scarto spegne il test di
  profondità anticipato: il disegno costava il doppio); il terreno con le normali dei soli triangoli del pezzo (a ogni giunta una riga
  scura: ora vengono dalle altezze attorno, uguali per due pezzi accanto).

## Il salvataggio

Il campo `mondo` nell'avventura (`profile.campagne.sotterraneo.cfg.avventure[eroe].mondo`), accanto a `terra` del 2D che non si
tocca: `{ firma, nebbia, dove, giro, pietre, parlato, divieti, novita, sopra, quest, dungeon }` (`quest` lo scrive `Gioco.vue`, le
taglie; `dungeon` i dungeon rifatti, `motore/rigenera.js`). Lo legge `mondoDaSalvato` e lo scrive `mondoDaSalvare`
([mondo-sopra-contratto.md](mondo-sopra-contratto.md)): la nebbia è un bit per cella in base64 (25 200 caratteri), e una firma
diversa (i salvataggi del mondo ad anelli) vuol dire il travaso. **Il villaggio si vede tutto da subito**: la vista ne scopre le
celle aprendo il mondo. Si salva arrivando, scoprendo (al più ogni tre secondi), accendendo una pietra, viaggiando e uscendo.

## La vista e la veduta

- **La telecamera** sta a 52°, vede almeno 15 celle in largo e 18 in profondo, segue l'eroe morbida e lo tiene a metà dello spazio
  libero fra le carte in cima e in fondo (`copri`); col dialogo aperto si allontana un poco. La rotella avvicina e allontana.
- **Nel villaggio** si allontana e si ferma in mezzo alla fila: larga quanto chi ci sta (i mercanti, la ragazza, il capitano, il
  minatore, la bacheca e il cartello) più cinque celle, così **dalla partenza si vedono tutti senza girare**, e chi sta ai capi non
  finisce sotto le bussole del bordo. Due persone vicine a schermo si dividono il rettangolo a metà fra i piedi (`spartisciPersone`):
  il tocco va a ognuno, non a chi sta sopra nel DOM.
- **La veduta d'insieme** (la casella «mappa grande»): il mondo intero su uno schermo largo, su un telefono in piedi una fascia di
  220 celle centrata dove si è, **che scorre col dito**, nello spazio libero fra le carte. Ci sono i nomi delle zone viste (grandi, col
  loro colore e i livelli) e della prima dopo (tratteggiata: «di là»), dei luoghi visti, del villaggio, dei dungeon trovati, le pietre
  (✦ quelle accese), le bacheche, la meta e il segno «tu». Un tocco manda l'eroe lì a piedi; un tocco su una pietra accesa, stando
  accanto a un'altra accesa, è il viaggio.
- **Entrando in una zona** il cartello grande in alto (`[data-annuncio-zona]`): il nome, il luogo e i livelli, col colore della zona,
  per 3,4 secondi; e la riga in fondo col colore per questo eroe (`annuncioDi`). Tornando al villaggio, «qui sei al sicuro».
- **Sempre giorno**: il sole con un'ombra sola (una mappa 2048 che segue l'eroe), il cielo, il vento, il fumo dai camini, la ruota.

## Il dito

- **Una persona vince sul prato**: per ogni persona, posto e cosa toccabile c'è un elemento HTML sopra la tela, posato a ogni
  fotogramma sul suo rettangolo (le persone almeno 72×96 px dove c'è spazio, sopra i posti); un tocco sul prato entro una cella e
  mezza dai piedi di qualcuno è un tocco su di lui (`dito.js`).
- Si agisce sul `click`; oltre i 16 px il tocco diventa un trascinare e l'eroe insegue il dito (nella veduta il mondo scorre); il
  mouse conta solo a tasto premuto; un tocco nuovo annulla la meta. L'A* è quello di `motore/terra.js` sulle celle scritte.

## Chi sta dove

- **Le figure ancorate**: le figure dell'atlante delle discese col filo scuro, la luce di taglio dal lato del sole, l'ombra a
  contatto e quella vera; le persone a scala 1,25 dell'eroe. Chi saluta, i segni sopra la testa, chi cura e il richiamo sono quelli
  della terra dipinta.
- **Il villaggio, l'unica città** (la pianta fissa, un ferro di cavallo aperto a sud): i quattro mercanti davanti alle loro botteghe
  col banco verso la piazza, la ragazza del pozzo, il capitano (venuto dal forte), il minatore col suo campo, la bacheca, il cartello
  (una freccia: la strada maestra), la pietra, il portale gemello quando c'è la sosta; dietro le case del fondale senza porta, agli
  angoli gli alberi. Niente campi, orti né bucato. La piazza è un rettangolo di ciottoli col cordolo, aperto verso il cancello.
- **Fuori**: chi sta fermo vicino al posto delle sue missioni (l'eremita, la guardia, il boscaiolo, il pescatore, il mugnaio), il
  mulino sulla riva del fiume con la ruota dal lato dell'acqua (`verso`), le case e i campi dei prati.
- **I quattordici ingressi** hanno i loro monumenti: i sette del prototipo e l'abisso (l'altare coi re, l'arco dei goblin, la torre
  annerita, la grotta con le radici, la scala nel lago, la botola che fuma, la miniera con la brace, il pozzo) e i sei nuovi, coi
  props che c'erano e tutti in codice: **il cerchio di pietre** (sette menhir col muschio e la botola in mezzo, che si apre e
  brilla), **il pozzo dei corvi** (il pozzo di pietra scura col tetto nero e i corvi appollaiati), **la palafitta** (la capanna sui
  pali nello stagno, la scaletta, la botola nel ballatoio), **la fornace** (il forno a cupola col camino, le fumarole, la porta di
  ferro che si alza sul fuoco), **la cava gelata** (la miniera con la brina, i ghiaccioli e i cristalli azzurri), **le tombe del
  vento** (il mausoleo col frontone, la lastra che scorre, le bandiere strappate). Arrivati a uno aperto il monumento si apre e il
  fumetto è quello di sempre (piani, livello, la storia, le missioni, «scendo»), coi dati della lista dei tredici di `Gioco.vue`; uno
  chiuso pianta il divieto e dice cosa lo apre. **Davanti a uno rosso la sentinella**, anche per i sei nuovi: è il colore della forza
  dell'eroe sul livello del dungeon, come giù.
- **Nessuna grata**: i confini fra le zone (un fiume col ponte ad arco o la passerella, una cresta col valico) sono sempre aperti; i
  ponti vengono da `m.confini`. Gli antri non ci sono più.
- **La porta delle terre**, in fondo alla landa: un arco di pietra con le rune; aperta (`S.terre`, la scrive chi fa le terre), le
  rune brillano e dentro gira un velo chiaro. Il fumetto dice cosa la apre; passarla è delle terre successive.
- **Si torna** dove si era: risalendo, lasciando perdere o svenuti si è davanti all'ingresso; dal portale accanto al gemello del
  villaggio.

## Il capitano, la fontana, la bacheca

- **Il capitano** sta nel villaggio fra le persone fisse (`PERSONAGGI_DI_SOPRA`): lo sprite della guardia, più alto e col suo blu
  (`scala` e `tinta` dei bersagli, letti da `persone.js`). Ha il «!» finché non ha detto la porta di adesso, quando è la quinta o la
  sesta; cosa dice: [dialoghi.md](dialoghi.md#il-capitano-del-forte).
- **La fontana** prende il posto del pozzo dove in città manca la guaritrice o l'incantatrice (`hoLaFontana`, `fontaneDi`): cura vita ed
  energia insieme, gratis, a chi è salito dal portale ([chi-cura.md](chi-cura.md#la-fontana)). Il villaggio le ha tutte e due: oggi
  non c'è. Il modello (`fontana.js`) e il tocco (una cosa, il fumetto con «bevo», il richiamo) restano pronti.
- **La bacheca**: il fumetto con una riga per foglio (prima da consegnare, poi in corso, poi i tre nuovi; con tre in mano i nuovi sono
  spenti), le righe da `vociDellaBacheca` ([mondo-aperto-quest.md](mondo-aperto-quest.md)), `taglia` (`{ id, azione }`) verso
  `azioneMissione` di `Gioco.vue`. Sul prato, solo a taglia in mano, chi si era perso (`[data-viandante]`) e la X della mappa
  (`[data-scavo]`, una domanda), al posto di `postoSulPrato`. I segni («!», «?» d'oro, «?» grigio: `segnoDellaBacheca`), in veduta 📜 e il
  cerchio della taglia seguita. **Il giro** conta un ritorno al villaggio solo dopo essersi allontanati più di `raggio + 8` celle, o
  salendo dal portale.

## Le pietre del viaggio

Otto: quella del villaggio (sei sassi ritti attorno alla pietra con la runa) e **una al mezzo di ogni zona**, accanto alla strada
maestra: una lastra alta sullo zoccolo tondo con le rune incise sul davanti, che si accendono, e tre sassi attorno. Toccata una
spenta, una domanda col `dif` della zona: giusta la runa si accende e paga come giù, sbagliata resta spenta e si riprova. Da una
accesa si va al villaggio sempre e alle altre accese (il viaggio è subito e gratis, un lampo chiaro).

## Le icone dei posti

I quattordici ingressi e il villaggio hanno un'icona **fotografata nel mondo 3D**: `npm run scatti icone-mondo`
(`strumenti/icone-mondo.mjs`; `ICONE_DEBUG=1` lascia i PNG in `tmp/scatti/icone-mondo/`) apre il file costruito con un profilo
che ha finito le sette discese, porta la telecamera su ogni monumento (zoom 0,7, il 62% del quadro) e sul centro della piazza (1,5,
il 90%), ritaglia, riduce a 112 px col tondo sfumato e scrive `dati/icone-mondo.js` (WebP, ~6 KB l'una, ~85 KB in tutto), che porta
la firma del suo contenuto e non si scrive a mano. Si rilancia quando un monumento cambia faccia. Le legge `iconaDi(chiave, mondo)`
di `dati/terra.js` (nel 2D i ritagli dipinti); la home non importa three.

## La nebbia

Quello che non si è visto non si disegna, e sopra c'è un velo di nuvole chiare: due trame del mondo, un texel per cella (`visto`
filtrata, `quando` senza filtro), riscritte solo quando si scopre. Le superfici sfumano a nuvole; gli oggetti si leggono alla cella
della loro base e salgono dal terreno in 0,7 s; l'ombra usa lo stesso innesto. Si scopre nel raggio di 10 celle (`VISTA_MONDO`).
`#…&nebbia=no` la spegne per le foto (e `&senzaeroe` nasconde l'eroe).

## Quanto costa

Chrome senza schermo (SwiftShader: chiamate e triangoli contano, i ms no), 390×844, pixel ratio 1, il 20 ottobre, dopo la scena sul
percorso; e il vecchio telefono (`strumenti/vecchio-telefono.mjs`, fascia bassa, 4 core, CPU ×5, [../core/vecchio-telefono.md](../core/vecchio-telefono.md)):
il banco della tela ferma (20 disegni) e il tempo di una zona.

| | chiamate | triangoli | banco (vecchio telefono) |
|---|---|---|---|
| dalla piazza del villaggio | 109–115 | 312–328k | 487 ms |
| davanti alla cripta dei re (la fila bassa) | 91–94 | 301–336k | 356 ms |
| davanti alla palafitta (la fila di mezzo) | 64–75 | 266–326k | 339 ms |
| davanti alla cava gelata (la fila alta) | 74–75 | 279–287k | 333 ms |
| la veduta d'insieme | 31–34 | 204–212k | 521 ms |

- **Il villaggio costa meno di prima** in chiamate (115 contro 119) a parità di triangoli, pur visto tutto intero: niente campi, orti
  né forte. La veduta è scesa da 106 chiamate (il lontano un pezzo per chiamata) a 34 coi blocchi.
- **Una zona** si carica in 45–100 ms in SwiftShader e **180–580 ms sul vecchio telefono** (la brughiera la più lenta): un fotogramma
  solo, e da fermi o vicino al confine (sopra). Il prossimo passo, se si sente sul Note 7: `caricaZona` in un worker.
- **Partire** costa lo scheletro, le due zone attorno alla partenza (`ilMondo`) e il lontano dalla base di tutto il mondo (~0,1 s in
  Node): sul telefono si vede «La terra si prepara…».
- Il villaggio sul vecchio telefono è il posto più caro (si vede tutto, con l'ombra di tutto): da guardare sul Note 7 col contatore.

## Cosa manca

- **I mostri e la bacheca** stanno sul percorso col motore di sopra (B, [mondo-sopra-contratto.md](mondo-sopra-contratto.md)): la vista
  non è cambiata (`creaMostriSopra`, `vociDellaBacheca`); se il motore non li sa mettere su una mappa, la vista resta senza mostri e lo
  dice nella console, e il resto si gioca.
- **Aspetta le terre (E)**: `S.terre` (la porta aperta) e passarla; la tinta della terra in `vesti.js`.
- **Il mondo ad anelli è stato tolto** (il generatore, la prima metà della scheda, il motore di prima, la sua pianta e il suo test).
- Le figure pixel art in un mondo liscio vanno viste sul telefono.

Nei test: `unita/sotterraneo-mondo-3d` (i pezzi su 504×300, le zone caricate e i pezzi che le aspettano, i carichi che rifanno un
pezzo, le celle non caricate dalla base, le istanze nel loro pezzo, la nebbia, il dito, i ponti dei confini, il cartello),
`unita/sotterraneo-mondo-props` e `unita/sotterraneo-mondo-aperto-props` ([mondo-3d-oggetti.md](mondo-3d-oggetti.md)),
`unita/sotterraneo-icone-mondo`, `unita/catalogo-3d-sotterraneo`, `integrazione/sotterraneo-mondo` (col dito vero: dalla partenza
tutti quelli del villaggio a schermo e ognuno toccato lui, il costo, niente grate, i quattordici ingressi con la zona, le otto pietre;
camminare, la ragazza, la bottega del fabbro, la pietra sbagliata e giusta, la veduta e il tocco lì, scendere nella cripta e risalire
davanti, la nebbia salvata con la firma, il gemello nel villaggio, il capitano col «!» nel villaggio e nessuna fontana; un salto nella
palude che carica le sue zone, il cartello della zona, il costo e il tempo di una zona). Bersagli: `[data-mondo3d]` (`data-pronto`,
`data-in-veduta`), `[data-eroe-mondo]` (`data-cella`, `data-cammina`, `data-schermo`), i bersagli `[data-bersaglio]` (`data-vis`,
`data-trovato`) con `[data-personaggio]`, `[data-mercante]` e `data-citta`, `[data-minatore]`, `[data-posto]` (`data-zona`,
`data-discesa`, `data-abisso`, `data-aperta`, `data-divieto`), `[data-pietra]` (`data-accesa`, `data-zona` per quelle di zona),
`[data-cartello]`, `[data-bacheca]`, `[data-fontana]`, `[data-portale]`, `[data-terre]`; `[data-fumetto-di]` (`pietra`, `portale`,
`cartello`, `bacheca`, `fontana`, `terre` o la chiave del dungeon) con `[data-viaggio]`, `[data-nessuna-meta]`, `[data-bacheca-vuota]`,
`[data-terre-dice]` (`data-aperta`), `[data-fontana-dice]` (`data-serve`) e il tasto `[data-azione="bevi"]`,
`[data-richiamo-di="fontana"]`, `[data-cura-fiocco][data-risorsa="tutto"]`, `[data-segno="nuova"]` sul capitano; la bacheca
(`integrazione/sotterraneo-bacheca`): `[data-bacheca]` con `data-segno`, `[data-taglia]` con `data-stato`, `[data-taglia-prendi]`,
`[data-taglia-consegna]`, `[data-taglie-piene]`, `[data-viandante]`, `[data-scavo]`; `[data-annuncio-zona]` (`data-zona`), `[data-pietra-domanda]`,
`[data-scavo-domanda]`, `[data-veduta]` coi `[data-nome-posto]` (`zona:<chiave>`, `regione:<chiave>`, `citta:villaggio`, …),
`[data-mondo-attesa]`; `window.__mondo3d` (`vai(chiave)` porta l'eroe davanti a un bersaglio e ne carica la zona, `porta(x, z)`, `io`,
`giro()`) e `window.__sotterraneo3d.grafica()` (con `mondo: true`, `pezzi`, `msPezzi`, `veduta`, `zona`, `zone`, `msZone`). In
`test/aiuto/browser.mjs`: `mondoPronto`, `fermoNelMondo`, `toccaNelMondo`, `scendiNelMondo` (davanti all'ingresso, anche per chiave;
`scendiNelSotterraneo` lo usa da solo).
