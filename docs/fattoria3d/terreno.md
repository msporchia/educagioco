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

Una per cella, a istanze (`stato.strade` salva gli id di cella come gli altri; `strada` è una mappa cella → 1 disegnata, 2 di serie). Quelle di
serie sono un incrocio a T davanti ai due edifici e fino alla partenza. **Il bambino le disegna a pennello** (🛣️, 🪙 1 a
pezzo, solo in terreno proprio e non sopra una cosa) e le toglie con 🧽 (gratis, solo quelle sue). **In strada il contadino
va più in fretta** (6,6 contro 4,8) **e il percorso le preferisce** (costano il 55%): disegnarle serve a qualcosa.

## La telecamera

Segue il contadino da sopra, **senza limiti** (distanza di serie 22: si vede una zona intera; il suolo segue la camera e la nebbia nasconde il bordo). Un dito che scorre la **stacca**, ma non oltre 30 celle dal contadino (camera
«libera») e compare «⌖ Torna al contadino»; mandare il contadino da qualche parte la rimette a seguirlo. Due dita (o la rotella) zoomano **da 0,28× a 2,4×** la distanza di base (`ZOOM_MIN`/`ZOOM_MAX` in `dati/mondo.js`: prima 0,55–1,7): da vicino si vedono i disegnini, da lontano la panoramica. Oltre i limiti il dito tira un elastico (`zoomMorbido`, camera.js: un quinto dello scarto) e al rilascio torna dentro. Con la distanza crescono anche `far` della camera e la nebbia (`scalaLontano`, `Mondo3d._nebbiaLontana`), e `near` si stringe da vicino; la finestra d'ombra si restringe fino a 8 celle. Da lontano si vede il bordo dei lotti aperti: il peso resta quello della finestra 9×9 ([mondo-infinito.md](mondo-infinito.md)). Misurato con scatti `--esegui "window.__fattoria3d.mondo.camera.zoom=2.4"`. **Il
contadino corre** quando il percorso supera 9 celle (1,75×). Non c'è più una telecamera «in costruzione»: si costruisce premendo dove si vuole ([scena.md](scena.md)); col pennello delle strade due dita spostano la vista.
