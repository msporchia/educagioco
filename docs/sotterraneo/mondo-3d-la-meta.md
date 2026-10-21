# La meta del mondo di sopra (3D)

Nel Sotterraneo 3D il mondo è grande e coperto di nuvole: alla prima partita si vede solo il villaggio. **Il bambino, anche di
sei anni, deve capire da solo «vado di là»**: in cima la carta della meta dice cosa e quanto, per terra le luci azzurre fanno la
strada vera, e le nuvole si aprono lungo quella strada. Ci si va a piedi: niente cammino automatico, le luci bastano. Il mondo, la
vista e il salvataggio sono in [mondo-3d.md](mondo-3d.md); le freccine sul bordo in [missioni-freccina.md](missioni-freccina.md); la
storia che decide la porta in [la-storia-principale.md](la-storia-principale.md).

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `motore/meta-sopra.js` | puro: quale meta (`metaScelta`), il campo delle distanze (il più corto, per i mostri e il banco), il velo, le luci, i passi detti |
| `motore/strada-sopra.js` | puro: i costi di cammino (strada, erba, vicino ai muri), il campo pesato della scia e il tragitto a tocco (`campoPesato`, `stradaPesata`), la lisciatura che non taglia fuori strada |
| `viste/Mondo3d.vue` | la meta sul mondo (`trovaLaMeta`, `aggiornaMeta`), la carta in cima, la meta nella veduta e sul bordo, la freccia del cartello |
| `scena3d/mondo/scia.js` | le luci per terra (una InstancedMesh) e il fascio sopra la meta |
| `scena3d/mondo/nebbia.js` | il velo della strada nelle trame della nebbia (`apriIlVelo`), che non tocca il bit salvato |
| `dati/dialoghi.js` | `LE_LUCI`, la pagina del minatore e del capitano dopo la strada |

## Quale meta

**Una sola, e la sceglie il bambino** col selettore del diario («segui questa», `avventura.segui`); la meta non si sceglie per
comodità (la più vicina, chi aspetta), così non cambia da sola camminando o finendo una consegna (`metaScelta`):

- **una taglia scelta**: il suo posto (`metaDellaTaglia`: la bacheca dove consegnarla, l'ingresso o la pietra da esplorare, il
  cuore del luogo);
- **una missione scelta**: la sua discesa; fatta, chi l'ha data (col «?» d'oro);
- **la storia**, scelta o **di difetto** quando non è scelto niente: la porta da aprire. Alla prima partita è la cripta dei re.

La scelta vale finché la missione è in mano (presa, o fatta e da consegnare): consegnata decade e torna la storia. Finita la storia
(o ferma per l'età) e niente scelto, non c'è meta né carta. Le freccine d'oro «Hai una consegna per …» e i segni «!»/«?» sopra le
persone restano: dicono che c'è qualcosa, non decidono la meta. La terra dipinta (`viste/Terra.vue`) tiene la sua regola
(`discesaDaSeguire`).

## La strada vera

- **Il campo delle distanze** (`campoVersoLaMeta(terra, meta, stradaDelMondo(m))`): una volta per meta, da lei a ogni cella sulla
  terra (`terraDelMondo`), con le mosse dell'A* di `motore/terra.js` (otto direzioni, √2 in diagonale, mai un angolo tagliato)
  ma con un **costo per cella**. Una decina di millisecondi (a caldo, in Node); poi la strada da qualunque cella è una discesa
  del campo, e i passi una lettura. Senza il terzo parametro è il più corto, quello dei mostri e del banco (`motore/terra.js`
  e il 2D non cambiano).
- **Il costo** (`strada-sopra.js`, `LIVELLI`): strada 1, erba 1,7; sull'erba +5, +1,5, +0,5 a 1, 2, 3 celle da un ostacolo (casa,
  albero, acqua, roccia), sulla strada +0,7 e +0,2. Il tragitto va per la strada e non passa fra due case a meno di tre celle
  se girarci attorno costa poco; **non è mai più lungo di 1,4 volte il più corto più 4 celle** (`LIMITE`, `MARGINE`: se il costo
  forte sfora, si prova uno lieve, poi il più corto). Misurato su 30 coppie: in media 1,21×, al più 1,37×; 88% di celle di
  strada (il più corto 8%), 1% di erba a ridosso di un muro (il più corto 38%). Il cammino a tocco (`vaiA`) usa le stesse regole
  (`stradaPesata`). La lisciatura (`liscia`) taglia solo dove la linea è libera e non costa più della strada.
- **I passi** del campo sono la lunghezza del tragitto scelto, non del più corto; la distanza detta e `data-passi` la seguono.
  Una grata calata la ferma: oltre non c'è strada, e non si indica.
- **Una meta in una zona non caricata** (`metaVicina`): il campo va fin dove la strada maestra è caricata; quando la terra cambia
  (una zona nuova) la meta si rifà da sé, e la scia va avanti a pezzi.
- **La strada si rifà da dove si è** quando cambia la meta, e quando l'eroe è **fermo** a più di quattro celle dalla scia
  (camminando no: la strada non si ricalcola a ogni cella).
- **Detti** come celle, a cinque per volta perché il numero non balli: «a 45 passi», «qui vicino» sotto i dieci, «sei
  arrivato» sotto i tre (`passiDetti`).

## La carta in cima

Nella fascia delle carte in cima (la telecamera la conta: l'eroe sta nello spazio libero sotto): l'icona del posto a 52 px (la
fotografia del monumento, [mondo-3d.md](mondo-3d.md#le-icone-dei-posti), la faccia della taglia, il «?» di chi aspetta), il nome e
i passi. Nessun tasto: non si tocca. C'è anche con la meta in vista; si nasconde durante uno scontro.

## Le luci, il fascio, il velo

- **Le luci azzurre per terra** (`scia.js`): un dischetto ogni 1,6 celle dall'eroe alla meta, cuore chiaro e orlo blu scuro (si
  leggono sull'erba e sulla terra battuta). Un'onda le accende verso la meta, col tempo della scena; quelle già passate non si
  disegnano. Lo stesso azzurro della bussola della meta.
- **Il fascio**: un cono di luce chiara sulla meta, che si vede sopra le nuvole e dalla veduta.
- **Il velo**: le nuvole si aprono lungo la strada (2,5 celle per parte, `celleDelVelo`). **Si disegna, non si salva**: le celle
  entrano nelle due trame della nebbia, non nel bit per cella di `mondo.nebbia` ([mondo-3d.md](mondo-3d.md#la-nebbia)); il velo si
  ricava sempre dalla meta, e «trovato» (il fumetto «Hai trovato…», le icone della veduta, le taglie «esplora») resta quello che
  l'eroe ha visto davvero. Cambiata la strada, le celle del velo mai viste tornano nuvola. Mostri, fumo, pietre accese e portale
  leggono il bit: nel velo non si vedono finché l'eroe non ci arriva.

## La veduta, il bordo, il cartello

- **Nella veduta** la meta c'è anche sotto le nuvole: un'etichetta azzurra «◎ La cripta dei re» che pulsa, sul posto; le luci vi
  si ingrandiscono e fanno la strada tratteggiata. Toccarla è un tocco come gli altri della veduta: la veduta si chiude e l'eroe
  ci va a piedi (arrivato, si apre quello che c'è).
- **Sul bordo**, quando la meta è fuori vista, la bussola azzurra con la sua faccia; toccata, lo stesso.
- **Il cartello** dice, sotto la freccia del passaggio verso la regione della meta, «◎ di qui per la cripta dei re: segui le luci
  azzurre»; se la meta sta da queste parti, «… è da queste parti» (`frecceDelCartello`).
- **Il minatore e il capitano**, dopo la strada a parole, nel 3D aggiungono «Per terra ci sono le luci azzurre: seguile e ci
  arrivi.» (`LE_LUCI`, `dato: 'luci'`).

## Quanto costa

Misurato in Chrome senza schermo (SwiftShader), 390×844, dalla piazza alla prima partita: **+1 chiamata e meno di 100 triangoli**
(una InstancedMesh di quadratini per le luci, un cono aperto per il fascio; nessuna luce vera, niente ombra). Il campo si fa una
volta per meta; il velo riscrive le trame della nebbia solo quando la strada cambia, mai a fotogramma.

## Cosa resta da guardare col dito

- Se sul telefono le luci si leggono bene in pieno sole e sui ciottoli della piazza, e se il fascio si vede abbastanza.
- Se la carta in cima toglie troppo mondo sui telefoni bassi (con la ripresa di una discesa sono due carte).

Nei test: `unita/sotterraneo-meta-sopra` (quale meta: dal selettore, di difetto la storia, nessuna comodità, la scelta che decade;
il campo e la strada: dove si cammina, mai un salto né un angolo tagliato, non oltre il limite sul più corto, sulla strada e lontano dai muri (30 coppie, una mappa a mano con la L, il varco di due celle, il varco largo), i passi, i tempi; il velo
nelle trame, che non tocca il bit e si richiude; le luci; i passi detti) e `integrazione/sotterraneo-mondo-meta` (col dito vero:
la carta col nome, i passi e l'icona di almeno 44 px, senza tasti; la scia e quanto costa; il velo che non trova la cripta per
finta; la veduta con la meta sotto le nuvole e il tocco che manda a piedi; il cartello; la meta che resta la storia con una
missione e una taglia in mano, non cambia camminando, e segue «segui questa» del diario). Bersagli: `[data-meta-carta]`
(`data-meta`: la discesa, `taglia:<id>` o `chi:<bersaglio>`) con `[data-meta-nome]`, `[data-meta-passi]` (`data-passi`) e
`[data-ritaglio]`; nella veduta `[data-nome-posto="meta:<discesa>"]` (o `taglia:<id>`); sul bordo `[data-meta-fuori]`; nel
cartello `[data-freccia-meta]` e `[data-meta-qui]`; `window.__sotterraneo3d.grafica().scia` (quante luci).
