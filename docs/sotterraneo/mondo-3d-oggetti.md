# Il mondo di sopra in 3D: gli oggetti di scena

Barili, lanterne, insegne nel villaggio; lapidi, rovine, menhir, palafitte, fumarole, carrelli fuori; lo scenario attorno a ogni
ingresso. Il generatore non li conosce (la firma e le nebbie salvate non cambiano): si derivano a scena dalle celle, con un caso
proprio, sempre uguali, e si posano nel cantiere del pezzo (`disegnaProps`, `disegnaPropsAperti`: niente mesh per oggetto, la nebbia
li legge dall'`aBase`). Non cambiano la mappa di blocco. Il mondo e i pezzi: [mondo-3d.md](mondo-3d.md).

## Gli oggetti del villaggio

`props-citta.js` (dove stanno, puro) e `props-modelli.js` (i modelli, sotto le 700 facce l'uno). Il villaggio è un ferro di cavallo
aperto a sud e **dalla piazza si devono vedere tutti** ([mondo-a-percorso.md](mondo-a-percorso.md#il-villaggio)):

- **Le botteghe**: un'insegna a palo ai fianchi (moneta, foglia, ferro di cavallo, gemma) e l'arredo ai fianchi e dietro, mai sul
  davanti (il fabbro la ruota di pietra, la rastrelliera e l'incudine; l'erborista scaffali e fiori; la torretta lanterne e vasi).
- **La piazza**: le lanterne lungo il lato delle botteghe e agli angoli, le panche ai due capi che guardano dentro, un tavolo ai capi
  della fila.
- **Le case del fondale**: due o tre cose ai fianchi e dietro (carretti, legna, barili, bucato, fiori), mai verso le botteghe.
- **Sparsi** dietro le botteghe e ai lati, a gruppetti.
- **Mai sul davanti** (dalla piazza in giù, verso la telecamera) se non cose basse e piccole: fiori, vasi, lanterne, panche. Niente
  orti. Mai su una strada, un posto, la cella dove ci si ferma, le zone tenute libere davanti alle botteghe, l'acqua.
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

Nei test: `unita/sotterraneo-mondo-props` (gli oggetti del villaggio: niente prima della zona, sempre uguali, mai su strade, posti o
dove ci si ferma, dentro il villaggio, sul davanti solo cose basse e niente di alto davanti a chi ci sta, niente orti né cose del
forte, le insegne, nel loro pezzo, le facce dei modelli) e `unita/sotterraneo-mondo-aperto-props` (quelli fuori: le celle e le firme
invariate, a blocchi come tutto insieme, nella loro zona, mai su strade, lotti, villaggio, confini o davanti a una porta, un
repertorio per habitat, uno scenario per ognuno dei quattordici ingressi, i costi, la zona che se ne va coi suoi).
