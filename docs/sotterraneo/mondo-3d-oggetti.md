# Il mondo di sopra in 3D: gli oggetti di scena

Barili, lanterne, insegne nel villaggio; lapidi, rovine, menhir, palafitte, fumarole, carrelli fuori; lo scenario attorno a ogni
ingresso. Il generatore non li conosce (la firma e le nebbie salvate non cambiano): si derivano a scena dalle celle, con un caso
proprio, sempre uguali, e si posano nel cantiere del pezzo (`disegnaProps`, `disegnaPropsAperti`: niente mesh per oggetto, la nebbia
li legge dall'`aBase`). Non cambiano la mappa di blocco. Il mondo e i pezzi: [mondo-3d.md](mondo-3d.md). Il segno delle tane: [sotto](#la-tana).

## Gli oggetti del villaggio

`props-citta.js` (dove stanno, puro) e `props-modelli.js` (i modelli, sotto le 700 facce l'uno). Il villaggio è una piazza tonda
con le botteghe a ventaglio e **dalla piazza si devono vedere tutti** ([mondo-a-percorso.md](mondo-a-percorso.md#il-villaggio)):

- **Le botteghe**: un'insegna a palo ai fianchi (moneta, foglia, ferro di cavallo, gemma) e l'arredo ai fianchi e dietro, mai sul
  davanti (il fabbro la ruota di pietra, la rastrelliera e l'incudine; l'erborista scaffali e fiori; la torretta lanterne e vasi).
- **Il bordo della piazza**: le lanterne tutto attorno, le panche sul davanti e due tavoli ai fianchi, girati verso il pozzo (un
  oggetto di una cella guarda in qualunque verso).
- **Le case**: due o tre cose ai fianchi e dietro (carretti, legna, barili, bucato, fiori), mai dal lato della porta.
- **Sparsi** dietro le botteghe e ai lati, a gruppetti.
- **L'orto** solo nel suo angolo della pianta (`villaggio.orto`, un lotto): le aiuole con lo steccato in file da due celle.
- **Mai sul davanti** (sotto il rettangolo della piazza, verso la telecamera) se non cose basse e piccole: fiori, vasi, lanterne,
  panche, l'orto; **mai niente di alto davanti a chi ci sta** (fino a quattro celle a sud del suo piede). Mai su una strada, un
  posto, la cella dove ci si ferma, le zone tenute libere davanti alle botteghe, l'acqua.
- **Prima che la zona del villaggio sia caricata, niente**: le celle non sono scritte. Poi si tengono (le celle restano).
- **Per cambiarli**: il carattere sta in `MENU` (pesi, massimi, quanti sparsi), l'arredo in `ARREDO`; un modello nuovo è una funzione in
  `MODELLI` (origine a terra, davanti verso +z, larghezza lungo x) e, se è largo più di una cella, una voce in `LARGHE`. I modelli del
  forte e del rifugio (palizzate, tende, pellicce, bracieri) restano nel catalogo, senza città che li usi.

## Gli oggetti fuori dal villaggio

`props-dove.js` (dove stanno, puro) e `props-aperto.js` (le forme). **Per zona caricata** (`propsDellaZona`, al fotogramma dopo il
carico): dalle sole celle della zona e dal suo decoro, quindi la stessa zona dà gli stessi oggetti da sola o con tutte (il test lo
prova), e se la zona si scarica se ne vanno. Mai su una strada, un lotto, un campo, un ponte o un valico, davanti a una porta
(`riservato`), nel villaggio (e tre celle attorno), **su un confine fra due zone** (a meno di 7 celle d'arco dal confine, e 3 dalle
celle del ponte o del valico: lì si vede che il terreno cambia), né dentro un albero del decoro.

- **Come si scelgono**: la `TABELLA` dell'habitat del luogo della cella dice cosa e quanto spesso; a ogni cella una prova per tipo,
  con una macchia di rumore che li raggruppa; prima i grandi (`FORME[tipo].R`), poi i piccoli. `DENSITA` (3,5: era 5 sul mondo ad
  anelli, dove le zone avevano meno erba libera) e `PIU_GRANDI` pareggiano le prove che cadono su un albero o una strada. Lungo le
  strade un cartello, un totem o una pietra miliare, ogni sei celle al meno, col davanti verso la strada.
- **Per habitat**: cimitero (lapidi coi tumuli, croci, cripte basse, il cancello rotto); rovine (archi spezzati, colonne, muretti,
  macerie); brughiera (menhir, cerchi di pietre, tumuli, erica); bosco, foresta, secco (tronchi, ceppi, funghi giganti, ragnatele);
  lago e palude (palafitte, barche, canneti, ninfee, pali); ceneri (fumarole, rocce spaccate, ossa, tridenti); monte e roccia (carrelli,
  binari, travi, minerale, argani, ometti di sassi); landa (menhir, ossa, croci, tridenti); prati e campi (accampamenti, carri, recinti,
  sacchi, cassette di mele).
- **Gli ingressi** hanno il loro scenario in `SCENARI` (per chiave quando il monumento è di un altro dungeon: `scenarioDi`): lapidi e
  cripte alla cripta dei re; palizzata, sacchi e teschi alle cantine; travi bruciate alla torre; ragnatele e bozzoli alla tana; pozze,
  pali e canneti alle sale allagate; bracieri e tridenti alla porta dell'inferno; carrello e minerale alle miniere; i menhir al pozzo
  senza fondo; e i sei nuovi: tumuli, erica e menhir al **cerchio di pietre**, ossa, pali e teschi al **pozzo dei corvi**, canneti,
  pali e una barca alla **palafitta**, fumarole e bracieri alla **fornace**, carrello, minerale e argano alla **cava gelata**, tombe,
  croci e colonne rotte alle **tombe del vento**.
- **Costo**: ~4 700 oggetti in tutto il mondo (~830k triangoli senza ombra), ma si disegnano solo nei pezzi vicini: il più carico ~12k.
  Solo i materiali che i pezzi hanno già (pietra, legno, liscio, luce dove brilla). Il cimitero ha le lapidi a metà di prima (0,016):
  davanti alla pietra dei prati si andava a 434k triangoli.
- **Per cambiarli**: un tipo nuovo è una funzione in `FORME_DISEGNO` (origine a terra, davanti verso +z), una voce in `FORME` e nella
  `TABELLA` (o nei `SCENARI`); fumarole e bracieri mettono fumo, braci e fiamme in `cose` (le fiamme al più 24 in tutto).

## La tana

Ogni luogo ha una **tana** (la cella `tana` della pianta: ci stanno il signore e le sue guardie, [mondo-aperto-mostri.md](mondo-aperto-mostri.md))
e oggi ha un **segno che si riconosce**: così una taglia «ripulisci la tana» o «il signore della regione» porta in un posto che si
vede. Tre cose, tutte derivate a scena (la pianta e la sua firma non cambiano, la mappa di blocco nemmeno):

- **Il segno**: un cerchio di 6–11 pezzi attorno al cuore, a 1,2–3 celle (passo 1b di `propsDellaZona`; la ricetta per famiglia di
  habitat in `props-tana-dati.js`, le forme nuove in `props-aperto.js`). Ogni pezzo sta sulla sua cella buona (erba, mai strada, ponte,
  acqua, campo, lotto o ingresso, mai sul confine fra due zone), dentro il quadrato di 7×7 che il generatore riserva alla tana
  (`celleDelleTane`: lì, e solo lì, anche sul `riservato`); se non cade lì si prova un poco più in qua. Il giro del cerchio lo dà la
  cella della tana (sempre lo stesso). Solo nelle zone caricate, come ogni oggetto. Portano `tana: <luogo>` e non fanno parte della
  `TABELLA`: il test del repertorio per habitat li salta.
- **La macchia**: terra battuta di 3–4 celle dal bordo storto sotto e attorno, **più scura** al cuore (`forzaDellaTana`, letta da
  `pesiDellaCella` in `terreno.js`: il peso della terra oltre l'1 dice «scura» e il fragment la scurisce, niente attributo in più).
  È nella pianta, non nella zona: si vede anche dal terreno lontano.
- **La vita**: il fumo del focolare e le braci e le fiamme della fossa portano il nome del luogo (`.tana` sulla sorgente): quando il
  signore è morto (`signoriMorti` di `stato`, `signoreVivo`) la scena non li emette più (`S.taneSpente`). La tana resta com'è: è un
  posto, non un mostro. Anche i dischi accesi della fossa di braci diventano cenere: portano il `segno` della tana nel cantiere
  (`metti(…, { segno })`, che la mesh unita ricorda in `userData.segni` come vertici), e la scena ne ricolora i vertici
  (`spegniLeBraci` in `indice.js`) senza rifare il pezzo; un giro nuovo che rimette il signore li riaccende. Le ossa e il resto
  restano.

| famiglia (habitat) | il segno |
|---|---|
| prato (prati, campi, frutteto, cimitero, rovine) | un focolare spento: cenere e un filo di fumo, un cerchio di cinque tratti di sassi, ossa e un teschio su palo; il cimitero ha anche una croce storta, le rovine delle macerie |
| bosco (bosco, foresta, secco) | tre ragnatele fra due rami secchi, con bozzoli appesi, due bozzoli per terra, ossa |
| brughiera | cinque pietre erette in cerchio, ossa fra l'erica, un teschio |
| palude (palude, lago) | un nido di fango col cratere e le uova, quattro mazzi di canne spezzate, due pozze, ossa |
| ceneri | una fossa di braci accese (con scintille e fiamme), terra bruciata, travi annerite, una roccia spaccata, ossa |
| monte (monte, roccia) | due carcasse di bestie, un mucchio di pietre e due ometti, ossa |
| landa | quattro croci storte, ossa e un teschio, un ometto |

Costa circa 1 270 triangoli a tana (30k in tutto il mondo, ma se ne vede una per volta) e nessuna chiamata in più: le forme vanno nel
cantiere del pezzo. **Davanti a una tana** (`node strumenti/scatta-app.mjs 'sotterraneo=mondo&eroe=cavaliere&dpr=1&nebbia=no' --dist --tana
bosco --senza-mostri`): bosco 91 → 90 chiamate e 401,8k → 406,6k triangoli, ceneri 68 → 70 e 253,2k → 255,1k, landa 76 → 75 e 322,4k →
324,5k; il cimitero col dito 82 chiamate, 379k. Il bosco è già oltre i 400k senza la tana: il limite lo sfiora il decoro, non il segno.
**Nella veduta** c'è un teschio 💀 (`[data-nome-posto="tana:<luogo>"]`) quando la cella del cuore è stata vista (la stessa regola della
taglia «esplora»), grigio e più chiaro se il signore è morto; il salvato ricorda i signori morti (`signori` in `inSalvo`), quindi anche di una zona lontana mai
rivista il teschio è già spento (nuovo giro: i signori tornano).

Nei test: `unita/sotterraneo-tane-segno` (ogni tana ha il suo segno, sempre lo stesso, mai su strada, acqua, ingresso, lotto, nel suo
quadrato, la pianta invariata, un segno per famiglia, la macchia, i signori dove il segno li aspetta, il fumo che si spegne col signore)
e `integrazione/sotterraneo-mondo-tana` (col dito: nessuna tana nella veduta di chi parte, il costo davanti a una, il teschio dopo
averla vista, grigio col signore morto).

Nei test: `unita/sotterraneo-mondo-props` (gli oggetti del villaggio: niente prima della zona, sempre uguali, mai su strade, posti o
dove ci si ferma, dentro il villaggio, sul davanti solo cose basse e niente di alto davanti a chi ci sta, l'orto nel suo angolo, niente cose del
forte, le insegne, nel loro pezzo, le facce dei modelli) e `unita/sotterraneo-mondo-aperto-props` (quelli fuori: le celle e le firme
invariate, a blocchi come tutto insieme, nella loro zona, mai su strade, lotti, villaggio, confini o davanti a una porta, un
repertorio per habitat, uno scenario per ognuno dei quattordici ingressi, i costi, la zona che se ne va coi suoi).
