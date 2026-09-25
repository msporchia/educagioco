# Scheda di prompt — una bestia di casa

Il metodo è quello di `PROMPT-edificio.md` e `PROMPT-merce.md`: un'immagine
allegata, «nello stesso stile e nella stessa disposizione di questa», e la
scheda che dice il resto. Una bestia di casa è un *attore*: cammina per il
prato, si vede da tre lati, e il gioco ne usa **dodici figure e non una di
più**.

## Perché questa scheda è stata riscritta

La prima versione faceva allegare `cane-bobtail.jpeg` e chiedeva otto
bande — ferme, di corsa, annusa, dorme, felice — dicendo «contano la 1, la
3 e la 5». Guardando i fotogrammi che l'atlante spedisce davvero
(settembre 2026) si sono visti quattro difetti, e tre venivano da lì:

- **il bobtail «di fronte» è una fila di facce.** La prima banda di quei
  fogli non è una camminata, sono le espressioni (lingua fuori,
  occhiolino, occhi chiusi): il cane che scende verso lo schermo è una
  testa senza corpo che cambia faccia a ogni passo. Vale anche per il
  beagle e per i tre gatti, che vengono dallo stesso stampo;
- **i buchi nel muso** sono la scacchiera finta dipinta dentro il JPEG:
  il grigio chiaro della scacchiera è il grigio del pelo bianco in ombra,
  e lo scontorno che allaga dai bordi ci entra dentro;
- **le bande si mescolano**: il pappagallo «di spalle» mostra la faccia in
  due fotogrammi su quattro;
- **stili diversi**: il coniglio non ha il contorno scuro che hanno tutti
  gli altri, e le taglie non tornano (i gatti alti quanto i cani).

Chiedere pose in più non è gratis: il generatore divide il foglio fra
tutte, ognuna viene più piccola, e le bande da scartare sono proprio
quelle che finiscono per sbaglio nel ritaglio.

## Cosa usa il gioco, e basta

`Attore.disegna` in `scena/tela.js`:
`fr = cammina ? 1 + ((passo * 6) | 0) % 3 : 0`. Cioè, per ognuno dei tre
versi:

| colonna | fotogramma | quando |
|---|---|---|
| 1 | **fermo** — quattro zampe a terra | la bestia sta ferma |
| 2 | **passo A** — un paio di zampe avanti | camminata, in giro |
| 3 | **passaggio** — zampe raccolte sotto il corpo | 2 → 3 → 4 → 2 … |
| 4 | **passo B** — l'altro paio avanti | |

Tre versi: **di fronte** (verso lo schermo), **di lato rivolto a destra**
(la sinistra è lo stesso disegno specchiato dal gioco), **di spalle**.
Tre righe per quattro colonne: **dodici figure**. È lo stesso schema del
bambino di ArMM1998, che cammina così da sempre.

Il rimbalzo del cappellino (`BOB` in `dati/animali.js`) dà per scontato
che nei due passi (colonne 2 e 4) il corpo stia **un pixel più in basso**
che nel passaggio — di fronte e di spalle; di lato no. Il prompt lo chiede,
così `BOB` resta vero senza rimisurarlo.

## Cosa allegare

**`riferimento-bestia.png`**, qui accanto: 1536×1024, trasparente, il
bambino di `armm1998/character.png` ingrandito ×8 esattamente nella
griglia che si chiede — tre righe, quattro colonne, piedi allineati. È lo
stile del mondo (quello che cammina accanto alle bestie) e la disposizione
già fatta: si copia meglio di come si spiega.

Per il **bobtail** allegare anche una foto del cane di casa: è quello che
si guarda più severamente, e un orecchio sbagliato lo vede chi lo vede
tutti i giorni.

Dal secondo animale in poi si può allegare **l'ultimo foglio venuto bene**
(il primo è `cane-bobtail.png`) al posto del bambino (è la regola delle merci): stessa taglia, stessa
tavolozza, e il generatore non è tentato di disegnare una persona.

## Il prompt

La parte fissa non si ritocca; si cambia solo il blocco fra parentesi
quadre, preso dalla tabella sotto.

> Disegna una tavola di sprite in pixel art **nello stesso stile e nella
> stessa disposizione dell'immagine allegata**: stessa vista dall'alto a
> tre quarti, stesso contorno scuro di un pixel tutto attorno alla figura,
> stessa luce da in alto a sinistra, colori piatti con al massimo due toni
> d'ombra, niente sfumature, niente anti-aliasing. Il bambino
> dell'immagine serve solo come modello di stile e di disposizione: **non
> va disegnato**.
>
> L'animale è **[descrizione]**. Misure in pixel del disegno: **[misure]**.
> Ogni pixel del disegno è un quadrato pieno di **8×8 px** dell'immagine.
>
> Il foglio è **1536×1024 px**, su un **fondo magenta pieno e uniforme
> (#FF00FF)** in tutta l'immagine. Una griglia di
> **3 righe × 4 colonne**, una figura per cella, centrata. **Solo queste
> dodici figure**: nessuna altra posa, nessuna espressione, nessuna
> variante, nessuna riga in più.
>
> - Riga 1: l'animale **esattamente di fronte**, che cammina dritto verso
> chi guarda: il muso al centro della figura, le zampe anteriori davanti,
> il corpo quasi tutto nascosto dietro la testa e il petto. Non di tre
> quarti e non di lato: è la riga 3 vista dall'altra parte.
> - Riga 2: l'animale **di lato, rivolto a destra**.
> - Riga 3: l'animale **di spalle**, che si allontana.
>
> In ogni riga le quattro colonne sono: (1) **fermo**, quattro zampe a
> terra; (2) **passo**: la zampa anteriore destra e la posteriore sinistra
> avanti; (3) **passaggio**: zampe raccolte sotto il corpo; (4) **passo**:
> la zampa anteriore sinistra e la posteriore destra avanti. È un ciclo di
> camminata che si ripete 2-3-4-2-3-4. Di fronte e di spalle, nelle
> colonne 2 e 4 il corpo è **un pixel più in basso** che nella 3; di lato
> il corpo resta alla stessa altezza e si muovono solo le zampe.
>
> **È lo stesso animale in tutte e dodici le figure**: stessa taglia,
> stesse macchie negli stessi posti, stessa faccia. Nella stessa riga le
> quattro figure hanno **la stessa larghezza del corpo e i piedi sulla
> stessa linea**: cambia solo la posizione delle zampe. La faccia è
> tranquilla e uguale in tutte: bocca chiusa o appena aperta, occhi aperti.
>
> Sotto ogni figura una **piccola ombra ovale di un solo grigio neutro**,
> come quella del bambino: bordi a scalini, nessuna sfumatura. Fuori dalla
> figura e dalla sua ombra c'è solo il magenta: **nessuna scacchiera,
> nessun alone, nessun bagliore, nessuna trasparenza**. Il magenta non
> compare mai dentro l'animale, e il contorno scuro lo chiude tutto
> attorno, senza aperture.
> Nessun salto e nessuna corsa: in ogni figura almeno due zampe toccano terra.
>
> **NESSUNA PAROLA SCRITTA, da nessuna parte**: né etichette, né numeri,
> né frecce, né simboli (cuori, note, stelline, gocce).
> Le figure non si toccano fra loro.

### Le bestie

Le misure sono **in pixel del gioco**, ombra esclusa, e stanno
attorno a quella del bambino (16 di larghezza, 22 di altezza): si
scrivono nel prompt così come sono. Sono una proposta ragionata sulle
proporzioni vere, non un numero misurato: dopo il primo foglio si
confrontano accanto al bambino (`npm run mondo`) e si corregge qui.

| sprite | [descrizione] | [misure] |
|---|---|---|
| `cane-bobtail` | un bobtail (Old English Sheepdog) adulto: testa, collo, petto e zampe anteriori bianchi, corpo grigio ardesia dalle spalle in giù come un mantello; pelo lungo a ciocche dritte (non riccioli) che scende sulla fronte, ma gli occhi si vedono sempre; naso nero grande; orecchie nascoste nel pelo; niente coda | di fronte 18×18, di lato 26×18, di spalle 16×18 |
| `cane-beagle` | un beagle tricolore: sella nera sulla schiena, testa e fianchi fulvi, muso, petto, zampe e punta della coda bianchi; orecchie lunghe e morbide che pendono ai lati della testa; coda dritta all'insù | di fronte 14×15, di lato 22×15, di spalle 12×15 |
| `gatto-tuxedo` | un gatto bianco e nero: corpo, testa e coda neri, muso dal naso in giù, petto e zampe bianchi; orecchie a punta, coda lunga alzata | di fronte 12×14, di lato 22×13, di spalle 11×14 |
| `gatto-nero` | un gatto tutto nero, con riflessi grigio-blu sul dorso e gli occhi gialli; orecchie a punta, coda lunga alzata | come il tuxedo |
| `gatto-giallo` | un gatto rosso tigrato: arancio con strisce arancio scuro, petto e muso crema; orecchie a punta, coda lunga alzata a strisce | come il tuxedo |
| `coniglio` | un coniglio bianco con macchie marroni, orecchie lunghe dritte, coda a batuffolo bianca. **Non cammina, saltella**: (2) raccolto pronto a saltare, (3) allungato in aria, (4) atterra con le zampe davanti | di fronte 9×14, di lato 16×12, di spalle 9×13 (orecchie comprese) |
| `pappagallo` | un'ara rossa che cammina per terra: corpo e testa rossi, ali chiuse con una fascia gialla e le punte blu, coda lunga rossa e blu, becco chiaro ricurvo. **Ondeggia** a ogni passo con le ali sempre chiuse | di fronte 11×16, di lato 18×16 (coda compresa), di spalle 11×16 |

Il pappagallo non vola e non apre le ali: a terra cammina, e un'ala
aperta in un fotogramma solo è una posa in più che il gioco non sa dove
mettere.

## Il primo giro: `cane-bobtail.png`

Il primo foglio uscito da questa scheda (25 settembre 2026) ha sbagliato
tre cose, e le righe del prompt qui sopra che le dicono sono state
rinforzate dopo:

- **la riga «di fronte» era di tre quarti**, e tre figure su quattro
  erano di nuovo la vista di lato; una era un salto con tutte le zampe
  in aria. Righe 2 e 3 giuste;
- **il grigio del mantello usciva semitrasparente** (alfa ~227), e **le
  ombre avevano alfa zero** (si vedono nell'anteprima, che ignora l'alfa,
  e nel gioco spariscono). Il foglio era arrivato su fondo pieno e lo
  scontorno l'aveva fatto un secondo passaggio, che ha scambiato per
  fondo il grigio del pelo e l'ombra. `alone: 128` nel foglietto rimedia
  al mantello, non all'ombra.

**Da qui il fondo magenta, e niente seconda passata.** Il fondo
trasparente chiesto al generatore arriva spesso pieno lo stesso, e
toglierlo con un altro attrezzo vuol dire lasciar decidere a un attrezzo
che non conosce il foglio cosa sia fondo: su un cane bianco e grigio
sbaglia proprio lì. Un fondo di una tinta che l'animale non ha lo toglie
`atlante.py` da sé (`fondo`, allagando dai bordi: dentro il contorno non
entra mai), e un foglio che arriva così non va toccato. Il magenta, e non
il verde o il bianco: nessuna di queste bestie lo porta addosso, e
l'interno rosa delle orecchie del coniglio sta dentro il contorno, dove
l'allagamento non arriva. Attenzione solo al rosso del pappagallo, che
deve restare rosso e non rosa.

Il foglio misurava 1248×832 invece di 1536×1024 (stesse proporzioni) e
senza una griglia di pixel regolare: la scala si trova a occhio.

## Come si guarda se è venuto bene

Prima di scrivere il foglietto, e senza pietà: rigenerare costa un
minuto, un foglio storto nel gioco resta per mesi.

1. **Dodici figure, tre righe per quattro.** Una riga in più, una posa
   diversa, un simbolo: si rigenera.
2. **La riga 1 ha il corpo**, non solo la testa.
3. **La riga 3 è di spalle in tutte e quattro**: nessuna faccia.
4. **Stesse macchie in tutte e dodici** (il coniglio del primo giro aveva
   la macchia che si spostava nell'ultimo fotogramma).
5. **Il contorno scuro c'è**, tutto attorno.
6. **Il fondo è magenta pieno**, uno solo, fino ai bordi: niente
   scacchiera, niente sfumature del fondo, niente seconda passata.
7. **Nessuna sacca di magenta chiusa dentro la sagoma** (fra le zampe,
   fra la coda e il corpo): l'allagamento parte dai bordi e lì non
   arriva. Se c'è, si toglie con un `cancella` nel foglietto.
8. **In movimento**: nel banco (`npm run mondo` → guida) la camminata non
   scatta e i piedi non saltano girandosi.

## Dopo il foglio

1. **Il nome dello sprite non cambia**: `cane-bobtail` resta
   `cane-bobtail`, perché è la chiave dei salvataggi (chi l'ha comprato
   deve ritrovarselo). Il foglio vecchio va in `../non-usati/`, il nuovo
   prende il suo posto (`cane-bobtail.png` + `cane-bobtail.json`, che
   è anche il calco del foglietto per i prossimi).
2. **Il foglietto**: `fondo: [255, 0, 255]` (o `"auto"` se il magenta è
   uscito d'un'altra sfumatura), `ombra: true` solo se il generatore ha
   fatto l'ombra **scurendo il magenta** invece che grigia, `tipo:
   "bestia"`, il campo
   `prompt` **copiato adesso** (generatore, data, immagini allegate, testo
   intero col blocco riempito), e un fotogramma per nome come in
   `coniglio.json` — nessun generatore rispetta la griglia al pixel.
   Con gli 8×8 rispettati è `foglio: [192, 128]`, `cella: [1, 1]`; se
   no la scala si trova **guardandolo accanto al bambino**, non a
   tavolino. **I quattro fotogrammi di un verso con la stessa `cella` e
   la stessa riga dei piedi**: il gioco centra ogni fotogramma sulla sua
   larghezza e lo appoggia sul suo fondo, quindi un ritaglio largo un
   pixel in più fa ballare la bestia di mezzo pixel a ogni passo.
3. **Gli agganci** si ricalibrano: la testa del cane nuovo non sta dove
   stava quella vecchia (`npm run mondo` → «i ritagli» → agganci).
4. `python3 strumenti/sprite/atlante.py fattoria`, poi
   `node test/esegui.mjs atlanti fattoria` e **il bobtail si mostra** —
   prima lui, poi gli altri.
