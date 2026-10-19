# Il mondo aperto: il generatore

La fase 1 del progetto ([mondo-aperto-fasi.md](mondo-aperto-fasi.md#7-le-fasi)): il mondo di sopra come **dato puro**, da
una scheda e da un seme fisso, che gira in Node senza Vue, three o DOM. Nessuno lo usa ancora: il Sotterraneo di sempre e il
3D di oggi attraversano la terra dipinta (`dati/terra.js`, `terra-mappa.js`, `motore/terra.js`), che non cambia. Quello che
`generaMondoAperto()` restituisce è il **contratto** per le fasi dopo (la vista, il motore aperto, le quest).

- `dati/mondo-aperto.js` — la scheda: seme e firma, regioni, marche, passaggi e le loro regole, città, dungeon coi nomi
  nuovi, chi sta fermo, habitat. Il nome non è `dati/mondo.js`, che tiene già le misure del sotterraneo.
- `motore/mondo-aperto.js` — il generatore; `motore/mondo-aperto-strade.js` — l'A* col costo e i passi da una cella.
- `strumenti/sotterraneo-pianta-mondo.mjs` — la pianta in caratteri e in PNG (`npm run pianta -- --mondo`).

## La scheda

- **160×140 celle, griglia 5×5** (la riga 0 in cima, a nord). L'anello è la distanza a scacchiera dal centro: il villaggio
  (0), otto terre vicine (1), sedici regioni delle marche (2), quattro per marca, ognuna in fila dal suo ingresso verso
  l'angolo dopo, come le pale di un mulino.
- **Una regione** ha `livello` (l'inizio della fascia, larga `LARGA_REGIONE` = 3: anello 1 in 1–6, anello 2 in 6–13),
  `habitat`, `antri` (quanti), e per le sei che vengono dalle terre selvagge `abitanti` e `caporale`. Il livello di una
  regione col dungeon è il livello atteso meno uno (`LIVELLI_ATTESI`); le altre stanno fra le vicine, scritte a mano.
  `difDi`: le domande di una regione sono l'inizio di quelle del dungeon della storia di quel livello.
- **I passaggi** (`PASSAGGI`): fra quali regioni si passa, `ponte` (con il `modello`: arco, travi, passerella) o `valico`.
  Ogni altro confine è chiuso: un fiume senza ponte o una cresta senza valico.
- **Le regole** (`regolaDi`): la marca dà quante discese finite aprono la grata (`apre`: sud e ovest 4, nord 6, est 7) . Un
  passaggio segue la più chiusa delle due regioni, così una marca chiusa resta chiusa da qualunque lato ci si arrivi. **La
  grata c'è solo dove le due regole sono diverse** (`haGrata`): all'ingresso di una marca, fra due marche (sud e ovest, pure con la stessa `apre`) e fra un anello e l'altro (anche se si alza da sola). L'età non
  chiude passaggi. `passaggioAperto(p, { finite })` è la domanda che il gioco farà.
- **Le città** (`CITTA`): la regione, il passaggio che guardano (`verso`), il raggio della zona dei mercanti, i mercanti (le
  chiavi di `dati/mercanti.js`: il banco è per mercante), chi ci sta, il minatore (`minatore`: da quale discesa), le case.
- **I dungeon** (`DUNGEON`): la chiave di sempre, l'indice della campagna (l'abisso −1), il nome nuovo, la regione, il
  monumento e il lotto (`appoggio`: la gobba di roccia, o l'acqua dietro).

### Cosa la geometria ha cambiato del progetto

Le regioni dei dungeon sono quelle della tabella del progetto. I passaggi no, perché la fila non reggeva:

- **Il villaggio ha due ponti, a nord e a sud.** Con un ponte a est la torre (la terza, a est) stava più vicina delle
  cantine (la seconda, a nord-est, in diagonale); con uno a ovest il bosco (la quarta) più vicino della torre.
- **Fra la valle del mulino e il bosco vecchio non c'è ponte**: al bosco si arriva dal lago, il giro lungo.
- **Le marche hanno due ingressi soli**: il ponte del guado (dal bosco al forte, che serve il sud e l'ovest) e il valico
  del nord (dal colle al rifugio). L'est (l'abisso) si apre a storia finita dal valico del passo, accanto al rifugio, e
  dal bosco secco.
- **Il monte delle miniere sta all'angolo nord-ovest**, tre regioni dopo il rifugio, e l'abisso nella landa all'angolo
  sud-est: così le miniere stanno oltre la porta dell'inferno e l'abisso oltre tutto. La vetta dei troll è a metà strada.
- **Due creature delle terre selvagge non sono nel catalogo di oggi** (il tornado, il troll grigio): la gola ha la vespa,
  la vetta il troll con la clava.

## L'algoritmo, passo per passo

1. **Le regioni**: il centro più vicino (quello del villaggio un poco più forte), più un rumore a macchie larghe che storce
   i confini. Il rumore sposta al più di 10 per parte, quindi si conta solo per i centri a meno di 20 dal più vicino.
2. **I siti dei ponti**: per ogni ponte, lungo il confine fra i due centri, otto file dove attorno per sette celle ci sono
   solo le due regioni e il confine va storto di sei al più; si sceglie il più dritto vicino al mezzo e lo si raddrizza.
   Le finestre dei passaggi non si toccano fra loro.
3. **La distanza dal confine** (fino a tre) e con chi si confina: dalle terre selvagge.
4. **Il terreno**: la cornice di roccia; ogni cella che tocca un'altra regione è acqua (fiume, due-quattro celle) o roccia
   (cresta): **fra due regioni non si passa mai se non da un passaggio**. Il tipo lo dà il passaggio; dove non c'è, fiume
   attorno al villaggio e fra due colonne, cresta fra due righe.
5. **I ponti**: al sito il fiume è largo quanto il modello vuole (arco 4, travi 3, passerella 2), il piano due file da riva a
   riva. **I valichi**: sulla cresta, vicino al suo mezzo e a sei celle da una terza regione, un tondo e un corridoio lungo
   la linea fra i due centri. Le celle aperte sono la grata.
6. **Spuntoni** di roccia per habitat (non dove sta una città), **il lago**, **le pozze della palude**; mai a sette celle da
   un passaggio.
7. **Le masse**: di ogni regione resta la massa d'erba più grande (la «principale»); un frammento che tocca l'acqua è un
   isolotto (si vede, non ci si va), gli altri roccia.
8. **Il centro** di ogni regione (la cella più dentro vicino al suo centro) e **la tana** del signore, riservata 7×7.
9. **I lotti** (un rettangolo d'erba principale con un anello libero, più largo davanti): le città (la piazza, la zona dei
   mercanti, le botteghe, il portale gemello, la pietra, la bacheca, il cartello, chi ci sta, il minatore; il forte e il
   rifugio a una dozzina di celle dalla riva del passaggio che guardano); poi gli **ingressi nell'ordine della storia**,
   ognuno almeno `STACCO` (6) passi oltre il dungeon prima e sotto un tetto che lascia spazio a quelli dopo, con la pietra
   davanti; il mulino sulla riva; chi sta fermo vicino al suo posto; gli antri, lontani fra loro e fuori dalle città.
10. **Le strade**: A* dalla piazza a ogni posto (non agli antri: si trovano), dalla piazza di ogni città ai suoi; le strade
    già tracciate costano poco e così si fa una rete; ogni passaggio sta su un sentiero.
11. **Campi e case** (la porta verso la strada più vicina), **il decoro per habitat** (un ingombro sempre con una cella
    libera attorno: non chiude mai una strada), **la quota** (dal prototipo: per habitat, roccia alta, acqua bassa, lotti
    spianati, ponti alla riva più alta).
12. **I guasti** e **la firma** (FNV su terreno, regioni, ponti, varchi, strade, lotti e posti).

## Il risultato

`generaMondoAperto(seme)` dà `{ W, H, seme, firma, ms, guasti, … }` con, cella per cella (`k = y·W + x`): `terreno` (`ERBA`,
`ACQUA`, `ROCCIA`), `reg` (l'indice della regione), `ponte` e `varco` (il passaggio, −1), `strada` (1 sentiero, 2 strada, 3
piazza), `blocco` (1 lotto, 2 ingombro del decoro), `zonaCitta` (1 + l'indice della città), `campo`, `isola`, `quota`. E:
`regioni` (con anello, marca, fascia, dif, centro, tana, `celle`, `area`, `passi` dalla piazza, il dungeon), `passaggi` (con
`celle`, `grata`, `rive`, `apre`, `tappa`, il modello e la quota del ponte), `citta` (centro, raggio, piazza, pozzo, mercanti,
persone, minatore, portale, pietra, bacheca, cartello), `posti` (tutti: `tipo`, `chiave`, il lotto `x y w h`, `piede` dove
sta, `accanto` dove si ferma l'eroe), e per tipo `ingressi`, `pietre`, `antri`, `persone`, `mulino`; `partenza`, `case`,
`campi`, `decoro`, `passi` (da una cella della piazza a tutte), `distanze`, `perTappa`, `calpestabileCon(aperto)`.
`mascheraDelMondo(m, aperto)` fa le righe di `.`/`#` per `creaTerra` di `motore/terra.js`.

## I guasti

Tutti nella lista `guasti`, che per il seme scelto è vuota (il test lo pretende):

- un ponte o un valico senza posto, una città, una bottega, un ingresso, una pietra, un antro, chi sta fermo senza lotto;
- **un posto che non si raggiunge** dalla piazza (con tutto aperto), un passaggio che non porta da una riva all'altra, una
  regione di cui si raggiunge meno del 95%, una regione sotto le 300 celle («un angolo, non una regione»);
- **a ogni punto della storia** (0, 4, 6, 7 discese finite) le regioni raggiunte a piedi con le grate calate devono essere
  esattamente quelle che il grafo dei passaggi aperti dice: una in più è un buco nel confine, una in meno un passaggio rotto;
- **chi sta fermo chiude una strada** (togliendolo si arriverebbe dove ora non si arriva);
- **la fila**: un dungeon non più lontano del prima (a passi); passando un confine fra anelli la regione di fuori non sta
  più in là di quella di dentro (la mediana dei passi delle sue celle); l'anello 2 non almeno 1,6 volte più in là dell'1;
- due posti sullo stesso lotto, o chi si ferma sopra un altro posto; una città con poco spazio.

## Il seme

**Seme 19, firma `02904a7d`**, scelto il 16 ottobre 2026 guardando i fogli di 48 semi (`--semi 1-48`): senza guasti erano
1, 5, 6, 8, 14, 19, 35 e 48. Il 19 ha la fila più regolare (58 · 77 · 95 · 143 · 198 · 208 · 227 · 241 passi, mai meno di
dieci fra due dungeon), le regioni più pari (da 392 a 914 celle d'erba), l'anello 1 a 37–153 passi e il 2 a 121–269.
Si genera in ~0,3 s (misurato in Node; nel telefono da misurare). Gli altri semi danno per lo più un guasto della fila nelle
marche (le miniere non oltre la porta dell'inferno) o una regione schiacciata dalla cornice.

**Chi cambia il generatore o la scheda cambia il mondo dei bambini** e la nebbia salvata non vale più: la firma diventa
rossa in `unita/sotterraneo-mondo`. Si riguarda la pianta (`npm run pianta -- --mondo`), se il seme non regge più se ne
sceglie un altro col foglio, e si scrive la firma nuova in `MONDO_APERTO`. Finché il mondo non è nel gioco, nessuno ha una
nebbia da perdere.

## Come si aggiunge

- **Una regione**: la regola del progetto è che si aggiunge solo fuori (un anello 3, una marca del mare), mai in mezzo. Va
  in `REGIONI_DEL_MONDO` con colonna e riga, la griglia in `MONDO_APERTO` cresce, e i passaggi che la toccano in
  `PASSAGGI`. Ponti solo fra due regioni affiancate (stessa riga o stessa colonna), mai in diagonale.
- **Un passaggio**: una riga in `PASSAGGI`. Se apre una scorciatoia, il test dei punti della storia lo dice.
- **Un posto**: un lotto nel passo 9 col suo `piede` e `accanto`, e una riga nel test; un tipo nuovo vuole il suo colore e
  la sua lettera nella pianta. Un mercante in più in una città: la sua chiave in `CITTA[].mercanti` e la bottega in
  `BOTTEGHE`.

## La pianta

`npm run pianta -- --mondo` stampa la mappa in caratteri (a colori per regione se il terminale li ha, `--colori` per
forzarli, `--senza-caratteri` per toglierla), la legenda, le regioni con la fascia, i passaggi, i passi dei dungeon, le
regioni raggiunte a ogni punto della storia, i guasti e la firma, e scrive `tmp/scatti/mondo-<seme>.png` (`--scala 8` per
ingrandirlo). `--seme N` un altro seme; `--semi 1-48` una riga per seme, un PNG ciascuno e un foglio ogni sedici
(`tmp/scatti/mondo-semi-1-16.png`): è il modo di scegliere il seme. Il PNG si scrive senza browser (`strumenti/png.mjs`).

## Da qui alle fasi dopo

- **Il motore aperto delle terre selvagge** (`aperta.js`) è entrato prima per la parte che fa la mappa (il rumore, le
  regioni, i confini, i valichi, le masse); i mostri (branchi per regione, la tana, l'annuncio) sono stati riscritti sul mondo
  generato nella fase 5: [mondo-aperto-mostri.md](mondo-aperto-mostri.md). Popolarlo non cambia la pianta né la firma.
- **L'A* di `creaTerra`** cerca il nodo migliore scorrendo l'elenco: sui 22 400 celle del mondo una strada lunga costa
  ~10 ms in Node. Da guardare sul telefono con la vista (fase 2).
- **Gli abitanti** delle dieci regioni senza (il foglio di creature d'aperta campagna) e i **livelli** delle regioni sono
  da misurare col banco ([mondo-aperto-progetto.md](mondo-aperto-progetto.md#cosa-va-ricalibrato-non-qui)).

Nei test: `unita/sotterraneo-mondo` (la pianta del seme senza guasti, la firma, lo stesso seme lo stesso mondo, niente
import fuori dal repo, 5×5 e gli anelli, le fasce, i dungeon con le chiavi e i nomi nuovi nelle regioni del progetto e in
fila, ogni posto raggiungibile, a ogni punto della storia solo dove portano i passaggi aperti, la grata solo fra
anelli e marche, i posti che non si pestano, chi sta fermo che non chiude strade, le città coi loro mercanti, le undici
pietre, gli antri, gli anelli che si allontanano, `creaTerra` sulla maschera generata).
