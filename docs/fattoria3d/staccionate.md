# Le staccionate e i cancelli

Il secondo strato del terreno personalizzabile (il primo sono le [strade](terreno.md#le-strade-tipi-e-bordi), il terzo sarà l'acqua disegnabile):
un pennello che si trascina, cinque **tipi** che si aprono col livello, e il **cancello**, il pezzo da cui si passa. I dati sono in
`dati/staccionate.js` (puri), le regole in `motore/fattoria3d.js` («le staccionate e i cancelli»), il disegno in `scena3d/staccionate.js`.

## Cosa si fa

Dalla barra del pennello (🛣️ Strada · 🚧 Staccionata · 🚪 Cancello · 🧽 Gomma; la stessa scheda «Strade» del menu Costruisci) si scrive col dito
sulla mappa, solo in terreno proprio e sopra una cella vuota (o su una strada tua: un cancello su una strada è il caso più bello).

| tipo | 🪙 a pezzo | livello |
|---|--:|--:|
| legno basso | 2 | 2 |
| filo e pali | 2 | 5 |
| steccato bianco | 3 | 8 |
| siepe | 4 | 12 |
| muretto di sassi | 6 | 17 |

Il metro è la calibrazione (🪙 1 = dieci secondi di esercizio): come le strade, più si apre tardi più costa, e la cella più cara (muretto con cancello,
🪙 9) è quattro minuti e mezzo di esercizio ogni tre celle. Un tasto chiuso dice «🔒 N» e, toccato, «Si apre al livello N»; il livello nuovo lo dice nell'avviso.

- **Una staccionata sta in una cella** intera, non su un lato fra due celle: blocca quella cella come un pezzo, e il percorso la gira. Così il passo resta
  una griglia di celle libere o no (`libera`), uguale per il contadino, i compagni e la pesca, e niente cambia in `percorso.js`.
- **Il cancello è lo stesso pezzo, ma ci si cammina in mezzo** (`libera` dice sì, `blocca` — il costruire — dice no). Si fa **su un pezzo che c'è già**
  (🚪, 🪙 3 in più, il tipo è quello del pezzo) e si disegna con l'anta aperta, per far vedere che si passa. Sul cancello, il pennello 🚧 dello stesso tipo lo
  rifà pezzo (gratis, se non chiude niente); di un altro tipo lo ridipinge e resta cancello. Un pezzo di un altro tipo, ridisegnato sopra, si ridipinge e si paga il nuovo.
- **La gomma** toglie la staccionata (o il cancello) e, sotto, la strada: prima l'una, poi l'altra. Gratis e senza rimborso, come per le strade.

## La regola di chi resta chiuso

*Una staccionata non chiude mai il passo.* Prima di posare un pezzo il motore conta le celle raggiungibili a piedi dal contadino
(`raggiungibili`, in `percorso.js`: stesse regole del percorso, otto direzioni senza tagliare gli angoli) con e senza quella cella. Se la cella
**taglierebbe fuori qualcosa** (una cella che prima si raggiungeva, o l'ultimo lato da cui si tocca un pezzo, un edificio o la casa), **il pezzo diventa da sé un
cancello** e costa come tale; la barra dice «l'ultimo pezzo è un cancello, così non resti chiuso». Quindi:

- un recinto si chiude sempre, ma l'ultimo pezzo ha il cancello; un edificio circondato su tutti i lati ha un lato da cui si entra;
- il contadino non resta murato dentro (né fuori): né col pennello né a mano, perché anche il cancello che torna pezzo si rifiuta se chiuderebbe (`motivo: 'chiude'`);
- sotto i piedi del contadino non si posa un pezzo (a meno che non sia un cancello);
- i compagni (Watson, i gatti) escono da soli se si trovano su una cella che diventa non libera: l'hanno sempre fatto;
- **qualunque pasticcio si toglie con la gomma**, gratis: la regola non serve a proteggere da tutto, solo a non mettere nessuno in una stanza senza porta.

Resta fuori (come prima) chi si chiude da sé con i *pezzi* (un campo e un edificio messi in modo da fare un muro): non è una staccionata e la gomma non li tocca.

## Come si lega

`dati/tessere.js`, `viciniDi` come per le strade, con `unisce` = **stesso tipo**: un palo al centro della cella e un mezzo tratto verso ogni vicina dello stesso tipo
(un cancello si lega come un pezzo). Dritti, angoli e T nascono da soli; una cella sola o l'estremo di una fila ha il suo palo; due tipi diversi affiancati non si
toccano (un palo ciascuno, niente tratto in mezzo). Il disegno è fatto di sole **scatole e sfere** istanziate con un colore per istanza (due banchi, tutti i tipi insieme): il filo è
una scatola sottile, la siepe sono sfere schiacciate, il muretto scatole grigie di tinte diverse. Capacità in `CAPACITA_STACCIONATE`; non si disegna fuori dalla finestra di lotti
(`limiti.md`, `istanze.md`: sono due draw call fisse, il peso cresce solo coi triangoli: ~12 scatole per cella di filo/legno, ~40 per un tratto di muretto).

## Il salvataggio

`stato.staccionate`: `{ idCella: 'legno' }`, o `'legno.c'` se è un cancello (`codiceStaccionata`). Senza cambiare versione (come `aspettoStrade`): uno stato di prima
non ce l'ha e non ha niente; un tipo che non c'è più si butta alla lettura (`normalizza`), e una cella che non è più tua, o dove ora c'è un pezzo, l'acqua o un ostacolo, si butta
nel costruttore (le staccionate si rileggono dopo i lotti e i pezzi). Nessuna perdita per chi non ha mai usato il pennello: la lista è vuota.

Nella fattoria in comune i tre metodi (`disegnaStaccionata`, `mettiCancello`, `togliStaccionata`) sono mosse come le strade: un metodo nuovo che cambia la fattoria va in `MOSSE` di `motore/registro.js`, se no l'amico non lo vede e la sua fotografia lo cancella ([in-comune.md](in-comune.md)).

## Come si aggancia l'acqua (lo strato che manca)

Lo stesso schema (le sei voci di [terreno.md](terreno.md#gli-strati-del-terreno-come-si-aggancia-uno-strato-nuovo)); qui cosa cambia per l'acqua disegnabile:

1. **Dati**: `dati/acqua.js` con i tipi (laghetto, fiume, canale…), `prezzo`, `liv`, codice `tipo` salvato come `stato.acqua` (`{ idCella: 'fiume' }`), lettura che butta ciò che non capisce.
2. **Motore**: `this.acquaDisegnata = new Map()` (cella → tipo). **Non scriverla in `cellaAcqua`** (quella è degli stagni/laghetti costruiti, con id di pezzo e il ponte sopra): `acqua(i, j)`
   e `_bloccaSenzaAcqua` devono dire sì anche per `acquaDisegnata.has(k)` — come ora dicono sì per i laghetti naturali — così blocca il passo e il costruire, e il ponte/la passerella
   ci vanno sopra come sugli stagni (`cellaPasso`). Disegnare acqua su una staccionata, una strada o una cella con roba: o si rifiuta (`occupato`), o si toglie ciò che sta sopra gratis
   (come `_occupa` fa per le strade sotto uno stagno: `strada.delete(k)`; fare lo stesso con `this.staccionata.delete(k)`, cioè *i cancelli si perdono sotto l'acqua*). Il costruttore
   rilegge l'acqua dopo i pezzi e butta quella sotto una cosa.
3. **Le paperelle solo sull'acqua**: le paperelle sono pezzi/bestie del cortile; il vincolo «sta solo su una cella d'acqua» si controlla dove si posano (`mettiPezzo`, `compraEMetti`:
   `d.acqua` è già una proprietà del catalogo per gli stagni — per le paperelle serve una proprietà simile, es. `suAcqua: true`, che richiede `acqua(i, j)` su tutte le celle). Le paperelle **già
   piazzate altrove** quando si introduce la regola, e quelle sull'acqua che il bambino **toglie**, tornano nel magazzino: una passata in `normalizza`/nel costruttore (`s.cose` con `suAcqua`
   su una cella non d'acqua → `s.magazzino[tipo]++` e la cosa via dalla mappa), la stessa che serve a un'acqua cancellata con la gomma (`togliAcqua` rimette nel magazzino le paperelle che restano all'asciutto, come
   `_togliSenzaPagare` fa per i sassi). È un conto, non una perdita.
4. **Vicini**: `viciniDi(aspettoAcqua, (a, b) => a.tipo === b.tipo, i, j)`; il lato `vuoto` è la riva (il bordo di sabbia/erba come per il bordo strada), i lati `unito` si fondono. Un fiume
   è un'acqua con `unisce` solo lungo la corrente se si vuole una direzione; di base basta lo stesso tipo.
5. **Scena**: una classe `AcquaDisegnata` gemella di `Staccionate` (un banco per tipo di fondo, la riva dai vicini, `ridisegna()` che azzera i `count`), creata in `terreno.js` accanto a
   `Staccionate` dentro `el('acqua', …)`, e chiamata da `ridisegnaStrade()` (che già ridisegna strade e staccionate a ogni `Mondo3d.cambiato()`).
6. **Il passo**: `libera` non cambia (l'acqua blocca già); un'acqua che taglia in due il terreno deve rispettare la stessa regola di chi resta chiuso: `_tagliaFuori(k, da)` è già generale
   (si chiama con la cella chiusa), e per l'acqua «l'ultimo pezzo» non diventa un cancello ma un **ponte** (o si rifiuta con `chiude`). Da decidere con Marco.
7. **Pennello**: un altro strumento in `STRUMENTI` (`dati/carte.js`), un'altra fila di tasti in `BarraStrade.vue`, un altro `gesto` in `costruzione.js:pennello` e in `dito.js:_pennello`.

## Nei test

`[data-strumento="staccionata"]`, `[data-strumento="cancello"]`, `[data-f3="staccionate-tipi"]` (i tasti hanno `data-staccionata`); unità `unita/fattoria3d-staccionate`
(dati, vicini, motore, la regola di chi resta chiuso, salvataggi), il giro col dito in `integrazione/fattoria3d`.

Provato e scartato: staccionate sui **lati** fra due celle (il motore del passo è a celle; un lato sarebbe stato un secondo grafo da tenere uguale ovunque camminino compagni, bestie e contadino);
rifiutare il pezzo che chiude (il bambino non capisce perché «non si può»: meglio farlo cancello da sé, che si vede).
