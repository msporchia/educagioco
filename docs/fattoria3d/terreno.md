# Il terreno della fattoria 3D

Il mondo, i lotti da comprare, il recinto, gli alberi, le strade e la telecamera. I dati sono in `dati/mondo.js`, `dati/lotti.js` e
`dati/biomi.js` (puri), le regole in `motore/fattoria3d.js`, il disegno in `scena3d/terreno.js`. **Il mondo non ha confini**:
come e perché in [mondo-infinito.md](mondo-infinito.md); i laghetti in [laghi.md](laghi.md).

## Lotti senza confini

Il mondo è fatto di lotti da 4×4 con coordinate intere `(a, b)` qualunque. Se ne hanno nove all'inizio, il quadrato 3×3 nel mezzo
(`LOTTI_INIZIALI`); **qualunque lotto che confina** (4 direzioni, `confina`) con uno proprio si compra, così il terreno resta
d'un pezzo. Il prezzo è quello della terra della 2D contato sulle celle ([livelli.md](livelli.md) «La terra»); sale a ogni lotto e si auto-limita (`prezzoLotto`, `prezzoDelLotto`: [mondo-infinito.md](mondo-infinito.md)).

- **Dentro il terreno proprio tutto si può mettere dappertutto**: campi, recinti, bancarelle, fontane, strade. Niente zone, salvo
  **l'acqua** dei laghetti, e quella degli stagni che il bambino costruisce (solo ponte e passerella). **Anche gli edifici unici** (mulino,
  panificio…) sono pezzi liberi: si costruiscono dal menu e si mettono dove si vuole, senza posti fissi né fantasmi sul prato ([edifici-liberi.md](edifici-liberi.md)).
- **Fuori dal terreno proprio non si cammina**: `blocca()` dice di sì a ogni cella di un lotto non tuo, e `percorso.js` non ci passa.
  **Un tocco su un lotto non tuo apre l'acquisto** (anche su un albero che sta lì), senza messaggi sul «fuori zona»; se il
  lotto non confina dice «Compra prima un terreno che confina con questo». Un tocco più in là dell'anello di due lotti
  attorno ai tuoi non apre niente.
- Il cartello `🪙 40` compare solo sui lotti acquistabili vicini al contadino (o tutti quelli della finestra, in costruzione); un
  laghetto, un lago, il mare o la spiaggia lo dice: «🪙 N · 🏞️ laghetto», «🏞️ lago», «🌊 mare», «🏖️ spiaggia».
- **I biomi**: prato (~66%), bosco (~14%, alberi più fitti), laghetto (~21%: lotti con un lago naturale, [laghi.md](laghi.md)) nella fascia di mezzo (a da 0 a 7); i 42 lotti storici sono sempre prato. **A ovest (a ≤ −2) c'è il mare**, con la
  costa e la spiaggia al lotto a = −1, **a est (a ≥ 8) i laghi grandi**: fatti di celle e non di lotti, e si pescano ([geografia-e-pesca.md](geografia-e-pesca.md)).

## Il recinto basso

Un recinto di legno corre lungo ogni lato di un lotto proprio che confina con uno non proprio (`ricostruisciRecinti`, a istanze:
pali e travi, solo nella finestra). Si rifà a ogni acquisto. I lotti non comprati hanno un velo scuro sul prato (`ridisegnaLotti`).

## Gli alberi

Gli alberi di un lotto sono sempre gli stessi (`generaLotto`): «l'albero numero 32» è lo stesso a ogni avvio, e i tagliati si salvano
come interi (`stato.tagliati`). Nei lotti storici sono quelli di prima: tre tentativi per lotto, tranne dove sta una strada, un posto
di edificio, il campo di partenza o la partenza del contadino (`celleRiservate`); negli altri nascono dalle coordinate (il bosco ne ha
tanti). Si creano solo per i lotti aperti (i tuoi e due attorno). Tutti si abbattono nel terreno proprio.

- Toccare un albero nel terreno proprio: il contadino lo raggiunge, alza l'**ascia** (quattro colpi), l'albero cade lontano
  da lui; il colpo costa **🪙 3** (`COSTI.albero`) e non dà niente (non c'è legna); la cella torna libera. Senza monete
  l'ascia non si alza e il contadino dice «Per tagliare un albero servono 🪙 3». Il motore decide (`abbatti`), la scena disegna
  (`togliAlbero`, `Effetti.cade`).
- Ogni albero è un'istanza di tre mesh (tronco e due chiome): abbatterlo è azzerare l'istanza.

## I sassi e i cespugli

Il cespuglio è quello del Sotterraneo (tre macchie tonde un po' storte, `dal-sotterraneo.js:geometriaCespuglio`), a istanze come prima: lo stesso verde per istanza, la stessa cella-id. La casa di scena (4×3) è la casa di legno del Sotterraneo, con il camino che fuma ([scena.md](scena.md)).

Pochi per lotto (2–5 sul prato, 1–3 in bosco e laghetto, `dati/ostacoli.js`), sempre gli stessi, **anche dopo aver comprato il lotto**: un lotto appena tuo non è
vuoto, ma nemmeno un campo minato (mai due vicini, mai sulle strade di serie, sui vecchi posti degli edifici (`POSTI_STORICI`: nei lotti storici restano riservati perché i numeri sono chiavi di salvataggio), sul campo e sulla
partenza, sul fienile e la casa, sull'acqua, né sotto un albero; i lotti stretti fra edifici ne hanno meno). Bloccano il costruire e il
passo come un albero (`bloccoFisso`). Si toccano nel terreno proprio: il contadino arriva, si china (gesto breve) e **🪙 1** li toglie
(`togliOstacolo`; evento `sasso`, contatore `fattoria3dSassi`). L'id di salvataggio è la **cella** (`idCella(i, j)`), non l'ordine:
`stato.ostacoli` salva i tolti, e un edificio nuovo non fa scorrere gli altri. Un salvataggio con un pezzo o una strada
sopra un sasso toglie il sasso da sé, gratis. Un tocco su un sasso in un lotto non tuo apre l'acquisto del lotto, come un
albero. Il dito è largo: oltre al raggio sul disegno basta la cella (`bersaglioSotto`).

## Le strade

Una per cella, a istanze (vedi sotto: tipi e bordi; `stato.strade` salva gli id di cella come gli altri; `strada` è una mappa cella → 1 disegnata, 2 di serie). Quelle di
serie sono un incrocio a T davanti ai due edifici e fino alla partenza. **Il bambino le disegna a pennello** (🛣️, 🪙 1 a
pezzo, solo in terreno proprio e non sopra una cosa) e le toglie con 🧽 (gratis, solo quelle sue). **In strada il contadino
va più in fretta** (6,6 contro 4,8) **e il percorso le preferisce** (costano il 55%): disegnarle serve a qualcosa.

### Le strade: tipi e bordi

Una strada è un **tipo** (il fondo) più un **bordo** (la cornice); il bambino li sceglie nella barra del pennello, due file di tasti, e il
prezzo di una cella è la somma dei due. Si apre tutto col livello (un tasto chiuso dice «🔒 N» e, toccato, «Si apre al livello N»); un livello che
apre una strada lo dice nell'avviso («strade nuove (Ghiaia)»). I dati puri sono in `dati/strade.js`; il metro è la calibrazione (🪙 1 = dieci secondi
di esercizio: la cella più cara, mattoni + ciottolini o steccato, costa 🪙 8, quattro minuti ogni tre celle, a livello 20 e oltre).

| tipo | 🪙 | livello | | bordo | 🪙 in più | livello |
|---|--:|--:|---|---|--:|--:|
| terra battuta (quella di sempre) | 1 | 1 | | nessuno | 0 | 1 |
| ghiaia | 2 | 3 | | erba alta (una frangia che sfuma sul prato, più ciuffi) | 1 | 2 |
| ciottoli bianchi | 3 | 7 | | cordolo | 1 | 5 |
| lastricato | 4 | 12 | | ciottolini (una fila di sassolini chiari) | 2 | 10 |
| mattoni | 6 | 20 | | steccato (basso, di legno) | 2 | 15 |

- **Il bordo si calcola dai vicini** (`dati/tessere.js`, `viciniDi`): due strade dello **stesso tipo** affiancate si **uniscono** (niente bordo fra loro,
  neanche se hanno bordi diversi); la cornice sta solo sui lati che toccano il prato, più un pezzo negli **angoli rientranti** (due lati uniti e la diagonale
  vuota). Fra **due tipi diversi** il confine è netto, senza bordo né dall'una né dall'altra (scelta: due cornici affiancate sarebbero un muretto doppio; se serve un confine, si disegna un tipo in mezzo).
- **Ridipingere**: sopra una strada tua di un altro aspetto si disegna di nuovo e si paga il nuovo (il vecchio non si rimborsa). Quelle di serie non si ridipingono.
  La gomma toglie tutto allo stesso modo, gratis.
- **Il disegno** (`scena3d/strade-bordate.js`): un banco di istanze per tipo (una texture a canvas per tipo, che ripetuta cella per cella si cuce da sola) e uno
  per ogni pezzo di bordo; la variazione dei sassi e dell'erba viene da `caso(i, j, sale)`, la stessa a ogni ridisegno. Il peso non cresce con la fattoria:
  la finestra di lotti e le capacità (`CAPACITA_STRADE`) lo limitano, e fuori dalla finestra non si disegna niente (`limiti.md`).
- **Il salvataggio**: `stato.strade` resta la lista degli id delle celle; `stato.aspettoStrade` dice solo chi non è di base (`{ id: 'ghiaia.cordolo' }`).
  Niente cambio di versione: uno stato di prima non ce l'ha e ogni sua strada è terra senza bordo, come si vedeva; un tipo che non esiste più, o una cella che
  non è più strada, si butta alla lettura (`normalizza`).
- **Il passo non cambia**: ogni tipo vale quanto la strada di prima (6,6 contro 4,8, percorso al 55%); sono belle da vedere, non più veloci.

### Gli strati del terreno (come si aggancia uno strato nuovo)

Un terreno personalizzabile è una pila di strati, ognuno una **mappa cella → aspetto** nel motore e un **banco di istanze** nella scena; i vicini si
chiedono tutti alla stessa funzione. Per uno strato nuovo (staccionata, acqua disegnabile):

1. **Dati puri** in `dati/<strato>.js` come `dati/strade.js`: i tipi con `nome`, `prezzo`, `liv`; un codice che si salva (`tipo.variante`) con la sua
   lettura che butta ciò che non capisce.
2. **Motore** (`motore/fattoria3d.js`): una `Map` cella → aspetto come `strada` + `aspettoStrade`, un `disegna…(i, j, { tipo, … })` che controlla livello, spazio libero
   e monete (`_spendi`: la spesa dà esperienza), un `togli…`, e in `serializza`/`normalizza` un campo di stato come `aspettoStrade` (senza cambiare versione, se è solo un campo in più).
3. **Vicini**: `viciniDi(aspettoDi, unisce, i, j)` con le due funzioni dello strato. `unisce` decide cosa si fonde (stesso tipo; per le staccionate stesso tipo
   *e* una sull'altra in linea, i cancelli come aspetto a parte che il passo lascia passare); `lati` e `angoli` dicono dove va un pezzo.
   Una staccionata sta sui **lati** fra celle, non dentro: dallo stesso `lati[s]` si ricava il bordo condiviso con `s < 2` (nord ed est) per non contarlo due volte.
4. **Scena**: una classe come `StradeBordate` (un banco per pezzo, `ridisegna()` che azzera i `count` e rimette tutto, `CAPACITA_…` come tetto), creata in `terreno.js` dentro `el('…')` e ridisegnata
   da `ridisegnaStrade()` (o da una sua gemella chiamata da `Mondo3d.cambiato()`). L'acqua fra due celle dello stesso tipo si unisce come la strada (`unisce`: stesso tipo), e la riva è il lato `vuoto`.
5. **Dove si vede**: il passo (`blocca`, `sullaStrada`) lo decide il motore, mai la scena; un'acqua disegnata deve dirlo a `cellaAcqua` come gli stagni (le strade ci sparivano già sotto).
6. **Test**: come `unita/fattoria3d-strade` (dati, vicini, motore, salvataggi di prima).

## La telecamera

Segue il contadino da sopra, **senza limiti** (distanza di serie 22: si vede una zona intera; il suolo segue la camera e la nebbia nasconde il bordo). Un dito che scorre la **stacca**, ma non oltre 30 celle dal contadino (camera
«libera») e compare «⌖ Torna al contadino»; mandare il contadino da qualche parte la rimette a seguirlo. Due dita zoomano. **Il
contadino corre** quando il percorso supera 9 celle (1,75×). Non c'è più una telecamera «in costruzione»: si costruisce premendo dove si vuole ([scena.md](scena.md)); col pennello delle strade due dita spostano la vista.

**Nei test**: `[data-f3="barra-strade"]`, `[data-f3="strade-tipi"]` e `[data-f3="strade-bordi"]` (i tasti hanno `data-tipo` e `data-bordo`), `[data-strumento]`, `[data-f3="strade-fatto"]`; unità `unita/fattoria3d-strade`.

Provati e scartati: sassi scuri e radi (sembravano bernoccoli), frangia d'erba rigida con la base scura (si staccava dal prato). Due trappole del disegno: **mai una scala negativa** sulle istanze (specchiare una frangia la rende nera: la normale si rovescia) e **mai `DoubleSide` per i fili d'erba** (lo stesso: si raddoppiano i triangoli); i pixel trasparenti di una tela sono neri e sporcano i bordi, quindi la frangia è una `DataTexture` col verde rimesso a mano.
