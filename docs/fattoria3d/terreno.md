# Il terreno della fattoria 3D

Il mondo, i lotti da comprare, il recinto, gli alberi, le strade e la telecamera. I dati sono in `dati/mondo.js` e
`dati/alberi.js` (puri, con le loro `guasti…()`), le regole in `motore/fattoria3d.js`, il disegno in `scena3d/terreno.js`.

## Una griglia di lotti

Il mondo è una griglia di celle (`I0`, `J0`, `GW`, `GH`; si cammina in `LIM`) divisa in **7×6 lotti da 4×4**. Se ne
hanno nove all'inizio, il quadrato 3×3 nel mezzo (`LOTTI_INIZIALI`); gli altri 33 si comprano. **Si compra solo un
lotto che confina** con uno proprio (`confina`), così il terreno resta d'un pezzo. Il prezzo sale a ogni lotto
(`prezzoLotto`, [regole.md](regole.md)).

- **Dentro il terreno proprio tutto si può mettere dappertutto**: campi, recinti, bancarelle, fontane, strade. Niente
  zone. I soli posti speciali sono quelli dei due edifici unici (`EDIFICI` in `dati/catalogo.js`), dentro il quadrato di
  partenza: si vedono come fantasmi e si comprano da lì.
- **Fuori dal terreno proprio non si cammina**: `blocca()` dice di sì a ogni cella di un lotto non tuo, e `percorso.js`
  non ci passa. **Un tocco su ciò che sta lì apre l'acquisto di quel lotto** (anche un albero), senza messaggi sul
  «fuori zona»; se il lotto non confina dice di comprare prima quelli vicini.
- Il cartello `🪙 40` compare solo sui lotti acquistabili vicini all'eroe (o tutti, in costruzione).

## Il recinto basso

Un recinto di legno corre lungo ogni lato di un lotto proprio che confina con uno non proprio o con il bordo del
mondo (`ricostruisciRecinti`, a istanze: pali e travi). Si rifà a ogni acquisto. I lotti non comprati hanno un velo
scuro sul prato (`ridisegnaLotti`).

## Gli alberi

Gli alberi sono sempre gli stessi (`generaAlberi`, un caso col seme): «l'albero numero 32» è lo stesso a ogni avvio, e i
tagliati si salvano come numeri (`stato.tagliati`). Tre per lotto, tranne dove sta una strada, un posto di edificio, il
campo di partenza o la partenza dell'eroe (`celleRiservate`); **fuori dal mondo c'è il bosco**, che non si abbatte.

- Toccare un albero nel terreno proprio: l'eroe lo raggiunge, alza l'**ascia** (quattro colpi), l'albero cade lontano
  da lui; il colpo costa **🪙 3** (`COSTI.albero`) e non dà niente (non c'è legna); la cella torna libera. Senza monete
  l'ascia non si alza e l'eroe dice «Per tagliare un albero servono 🪙 3». Il motore decide (`abbatti`), la scena disegna
  (`togliAlbero`, `Effetti.cade`).
- Ogni albero è un'istanza di tre mesh (tronco e due chiome): abbatterlo è azzerare l'istanza.

## I sassi e i cespugli

Il cespuglio è quello del Sotterraneo (tre macchie tonde un po' storte, `dal-sotterraneo.js:geometriaCespuglio`), a istanze come prima: lo stesso verde per istanza, la stessa cella-id. La casa di scena (4×3) è la casa di legno del Sotterraneo, con il camino che fuma ([scena.md](scena.md)).

Pochi per lotto (2–5, `dati/ostacoli.js`), sempre gli stessi, **anche dopo aver comprato il lotto**: un lotto appena tuo non è
vuoto, ma nemmeno un campo minato (mai due vicini, mai sulle strade di serie, sui posti degli edifici, sul campo e sulla
partenza, sul fienile e la casa, né sotto un albero; i lotti stretti fra edifici ne hanno meno). Bloccano il costruire e il
passo come un albero (`bloccoFisso`). Si toccano nel terreno proprio: l'eroe arriva, si china (gesto breve) e **🪙 1** li toglie
(`togliOstacolo`; evento `sasso`, contatore `fattoria3dSassi`). L'id di salvataggio è la **cella** (`idx(i, j)`), non l'ordine:
`stato.ostacoli` salva i tolti, e un edificio nuovo non fa scorrere gli altri. Un salvataggio con un pezzo o una strada
sopra un sasso toglie il sasso da sé, gratis. Un tocco su un sasso in un lotto non tuo apre l'acquisto del lotto, come un
albero. Il dito è largo: oltre al raggio sul disegno basta la cella (`bersaglioSotto`).

## Le strade

Una per cella, a istanze (`stato.strade` salva gli indici, `strada[k]`: 0 niente, 1 disegnata, 2 di serie). Quelle di
serie sono un incrocio a T davanti ai due edifici e fino alla partenza. **Il bambino le disegna a pennello** (🛣️, 🪙 1 a
pezzo, solo in terreno proprio e non sopra una cosa) e le toglie con 🧽 (gratis, solo quelle sue). **In strada l'eroe
va più in fretta** (6,6 contro 4,8) **e il percorso le preferisce** (costano il 55%): disegnarle serve a qualcosa.

## La telecamera

Segue l'eroe da sopra (distanza di serie 22: si vede una zona intera). Un dito che scorre la **stacca** (camera
«libera») e compare «⌖ Torna all'eroe»; mandare l'eroe da qualche parte la rimette a seguirlo. Due dita zoomano. **Il
contadino corre** quando il percorso supera 9 celle (1,75×). In costruzione la telecamera si alza e inquadra attorno
all'eroe («Vicino») o tutto il terreno proprio («Tutto»), con due dita si sposta.
