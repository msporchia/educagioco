# La meta del mondo di sopra (3D)

Nel Sotterraneo 3D il mondo è grande (160×140 celle) e coperto di nuvole: alla prima partita si vede solo il tondo della
piazza. **Il bambino, anche di sei anni, deve capire da solo «vado di là»**: in cima la carta della meta dice cosa e
quanto, per terra le luci azzurre fanno la strada vera, le nuvole si aprono lungo quella strada, e «portami lì» ci
porta con un tocco. Il mondo, la vista e il salvataggio sono in [mondo-3d.md](mondo-3d.md); le freccine sul bordo in
[missioni-freccina.md](missioni-freccina.md); la storia che decide la porta in [la-storia-principale.md](la-storia-principale.md).

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `motore/meta-sopra.js` | puro: il campo delle distanze dalla meta, la strada da qualunque cella, le celle del velo, le luci, i passi detti |
| `viste/Mondo3d.vue` | quale meta (`trovaLaMeta`), la carta in cima, «portami lì» (`portami`), il fermo per i mostri, la meta nella veduta, la freccia del cartello |
| `scena3d/mondo/scia.js` | le luci per terra (una InstancedMesh) e il fascio sopra la meta |
| `scena3d/mondo/nebbia.js` | il velo della strada nelle trame della nebbia (`apriIlVelo`), che non tocca il bit salvato |
| `dati/dialoghi.js` | `LE_LUCI`, la pagina del minatore e del capitano dopo la strada |

## Quale meta

Una sola alla volta, nell'ordine delle bussole (le stesse regole di [missioni-freccina.md](missioni-freccina.md)):

1. **chi aspetta una consegna** (la persona più vicina): la carta ha il «?» d'oro;
2. **la taglia seguita** col «segui questa» del diario: la bacheca dove consegnarla, l'ingresso o la pietra da esplorare, o il
   cuore della regione;
3. **la discesa**: quella della missione presa più vicina, o la porta della storia (`discesaDaSeguire`). Alla prima partita è
   la cripta dei re, a una cinquantina di passi dal villaggio.

Finita la storia senza missioni non c'è meta, e la carta non c'è.

## La strada vera

- **Il campo delle distanze** (`campoVersoLaMeta`): una volta per meta, le distanze da lei a ogni cella sulla terra coi passaggi
  aperti dalla storia (`terraDelMondo`), con le regole dell'A* di `motore/terra.js` (otto direzioni, √2 in diagonale, mai un
  angolo tagliato). Pochi millisecondi; poi la strada da qualunque cella è una discesa del campo, e i passi sono una lettura.
  Lunga quanto quella dell'A* (il test lo misura). Una grata calata la ferma: oltre non c'è strada, e non si indica.
- **La strada si rifà da dove si è** quando cambia la meta, e quando l'eroe è **fermo** a più di quattro celle dalla scia
  (camminando no: la strada non si ricalcola a ogni cella).
- **I passi** sono celle (un passo per cella), detti a cinque per volta perché il numero non balli: «a 45 passi», «qui vicino»
  sotto i dieci, «sei arrivato» sotto i tre (`passiDetti`).

## La carta in cima

Sopra il mondo, nella fascia delle carte in cima (la telecamera la conta: l'eroe sta nello spazio libero sotto): l'icona del
posto a 52 px (la fotografia del monumento di [mondo-3d.md](mondo-3d.md#le-icone-dei-posti), la faccia della taglia, il «?» di
chi aspetta), il nome, i passi, e il tasto **«👣 portami lì»** (48 px). C'è sempre, anche con la meta in vista: la freccia sul
bordo dice da che parte, la carta dice cosa e quanto. Si nasconde durante uno scontro.

## «Portami lì»

- **L'eroe cammina lungo la scia**, la stessa spezzata che si vede (lisciata come i passi dell'A*): non lascia mai le luci.
  Arrivato si apre quello che c'è, come toccandolo: il fumetto della discesa con «scendo», la bacheca, chi aspetta.
- **Toccato mentre si cammina dice «✋ fermati»** e ferma l'eroe; un tocco sul prato o su qualcuno fa come sempre e annulla la
  meta (le regole del dito: [../core/il-dito.md](../core/il-dito.md)).
- **Si ferma da sé quando compare un mostro** che alla partenza non si vedeva (entra nel cerchio di luce,
  [mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md)): decide il bambino, «Un mostro sulla strada! Affrontalo, o tocca
  «portami lì» per andare avanti». Ritoccato, i mostri già visti non lo fermano più. Un mostro sveglio che arriva addosso apre
  lo scontro come sempre.
- **Non costa niente**: è camminare. Nessuna domanda, nessuna moneta.

## Le luci e il fascio

- **Le luci azzurre per terra** (`scia.js`): un dischetto ogni 1,6 celle dalla cella dell'eroe alla meta, cuore chiaro e orlo
  blu scuro (si leggono sull'erba e sulla terra battuta). Un'onda le accende una dopo l'altra verso la meta, col tempo della
  scena e non coi fotogrammi; quelle già passate non si disegnano. Lo stesso azzurro della bussola della meta.
- **Il fascio**: un cono di luce chiara sulla meta, che si vede sopra le nuvole e dalla veduta.
- Nella veduta le luci si ingrandiscono tre volte e fanno la strada tratteggiata dal villaggio alla meta.

## Il velo della strada

**Le nuvole si aprono lungo la strada fino alla meta** (2,5 celle per parte, `celleDelVelo`): il bambino vede dove va la strada
e la meta in fondo, e il mondo non è più un tondo tagliato nel bianco.

- **Si disegna, non si salva.** Le celle del velo entrano nelle due trame della nebbia (vista, e il tempo da cui gli oggetti
  salgono), non nel bit per cella che si salva in `mondo.nebbia` ([mondo-3d.md](mondo-3d.md#la-nebbia)). Perché: il velo si
  ricava sempre dalla meta, quindi non c'è niente da ricordare; «trovato» (il fumetto «Hai trovato…», le icone della veduta, le
  taglie «esplora») resta quello che l'eroe ha visto davvero; le nebbie salvate e la firma della pianta non cambiano.
- **Cambiata la strada**, le celle del velo di prima che nessuno ha visto davvero tornano nuvola. Una cella del velo scoperta
  camminando tiene il suo tempo: quello che c'è sopra non risale.
- I mostri, il fumo, le pietre accese e il portale leggono il bit: nel velo non si vedono finché l'eroe non ci arriva.
- `mondoNuovo` invece salva come viste le strade fino alle discese **già finite** (il travaso): quelle l'eroe le ha fatte davvero.

## La veduta d'insieme

La meta c'è anche sotto le nuvole: un'etichetta azzurra «◎ La cripta dei re» che pulsa, sul posto (al posto del nome della discesa,
se trovata). **Toccarla è «portami lì»**: la veduta si chiude e l'eroe parte. Restano il segno «tu», le città, i dungeon trovati, le
pietre, le bacheche. Anche la bussola della meta sul bordo, toccata, è «portami lì».

## Il cartello e il minatore

- **Il cartello** dice, sotto la freccia che porta verso la meta, «◎ di qui per la cripta dei re: segui le luci azzurre», sulla
  riga azzurra; se la meta sta nella regione della città, una riga «… è da queste parti». La freccia è quella del passaggio da cui
  si arriva alla regione della meta (`frecceDelCartello`, `regioni`).
- **Il minatore e il capitano**, dopo la strada a parole (`LUOGHI_MONDO`, coi ponti e le regioni, mai i punti cardinali), nel 3D
  aggiungono una pagina: «Per terra ci sono le luci azzurre: seguile e ci arrivi. Se ti perdi, tocca «portami lì» in alto, e ti ci
  porto io.» (`LE_LUCI`, `dato: 'luci'`).

## Quanto costa

Misurato in Chrome senza schermo (SwiftShader), 390×844, dalla piazza del villaggio alla prima partita: **+1 chiamata e meno di
100 triangoli** (134 chiamate, 382k triangoli in tutto, con 32 luci), stesso tempo a fotogramma. Le luci sono una InstancedMesh di
quadratini (due triangoli), il fascio un cono aperto; nessuna luce vera, niente ombra. Il campo si fa una volta per meta; il velo
riscrive le trame della nebbia solo quando la strada cambia, mai a fotogramma.

## Cosa resta da guardare col dito

- Se sul telefono le luci si leggono bene in pieno sole e sui ciottoli della piazza, e se il fascio si vede abbastanza.
- Se la carta in cima toglie troppo mondo sui telefoni bassi (con la ripresa di una discesa sono due carte).
- Se un bambino piccolo usa «portami lì» per tutto e non esplora più: in quel caso la leva è il velo (più stretto), non togliere il
  tasto.

Nei test: `unita/sotterraneo-meta-sopra` (il campo e la strada: dove si cammina, mai un salto né un angolo tagliato, lunga quanto
l'A*, le grate che la fermano; il velo nelle trame, che non tocca il bit e si richiude; le luci; i passi detti) e
`integrazione/sotterraneo-mondo-meta` (col dito vero: la carta col nome, i passi e l'icona di almeno 44 px, la scia e quanto costa,
il velo che non trova la cripta per finta; la veduta con la meta sotto le nuvole e il tocco lì; «fermati»; il cartello; «portami lì»
fino al fumetto della cripta; il fermo per un mostro sulla strada). Bersagli: `[data-meta-carta]` (`data-meta`, `data-guidato`,
`data-fermato="mostro"`) con `[data-meta-nome]`, `[data-meta-passi]` (`data-passi`), `[data-ritaglio]` e il tasto
`[data-azione="portami"]`; nella veduta `[data-nome-posto="meta:<discesa>"]` (o `taglia:<id>`); nel cartello `[data-freccia-meta]` e
`[data-meta-qui]`; `window.__sotterraneo3d.grafica().scia` (quante luci).
