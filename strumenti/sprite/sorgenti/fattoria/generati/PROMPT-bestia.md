# Scheda di prompt — una bestia di casa

Il metodo è quello di `PROMPT-edificio.md` e `PROMPT-merce.md`: si
allega **un foglio già fatto bene** e si dice «nello stesso stile e nella
stessa disposizione di questo». Una bestia di casa è un *attore*: cammina,
si vede da tre lati, e i suoi fotogrammi hanno una misura fissa che il
gioco dà per scontata (`dati/atlante.js`: 16×32 di fronte e di spalle,
32×32 di lato, quattro fotogrammi, di lato guarda **a destra**).

## Cosa allegare

`cane-bobtail.jpeg` intero (1071×1008), o `gatto-tuxedo.jpeg`: sono i due
fogli che il foglietto ha letto meglio, e hanno la disposizione che il
prompt chiede di ripetere. Per una bestia che non è né cane né gatto
(coniglio, tartaruga, papera) allegare il cane: la taglia deve essere
quella.

## Il prompt

> Disegna una tavola di sprite in pixel art **nello stesso stile e nella
> stessa disposizione di questa immagine**: stessa misura delle figure,
> stesso numero di righe e di colonne, stesse pose nelle stesse posizioni,
> stesso contorno scuro di un pixel, stessa luce da in alto a sinistra.
>
> L'animale è **[un coniglio bianco con le macchie marroni, le orecchie
> lunghe dritte, la coda a batuffolo]**. È alto quanto il cane della
> tavola allegata: non più grande.
>
> Le righe, dall'alto: (1) di fronte, quattro fotogrammi che camminano;
> (2) di fronte, pose ferme; (3) di spalle, quattro fotogrammi che
> camminano; (4) di spalle, pose ferme; (5) di lato **rivolto a destra**,
> quattro fotogrammi che camminano; (6) di lato che corre; (7) e (8) pose
> singole (annusa, si gratta, dorme, felice). Quello che conta sono le
> righe 1, 3 e 5: le altre possono essere anche vuote.
>
> Fondo **magenta uniforme** (#e0197d) su tutta la tavola, nessuna
> scacchiera, nessuna ombra sotto le zampe, nessun testo. Le figure non
> si toccano fra loro.

## Le misure, spiegate

- Il foglio arriva ingrandito (~63 px per pixel di gioco su 16, cioè
  scala 4 circa) e **non sarà mai già nella misura giusta**: ci pensa il
  foglietto (`foglio: [17, 8]`, `cella: [16, 32]`) e `atlante.py`, come
  per `cane-bobtail.json`. Se il generatore non rispetta la griglia, si
  dichiara ogni fotogramma a sé (vedi `cane-bobtail2.json` e la sua nota:
  la scala si trova **guardandolo accanto agli altri**, non a tavolino).
- **Di lato guarda a destra**: la sinistra è la stessa specchiata. Se
  arriva a sinistra si scrive `specchia: true` sulla banda, come ha fatto
  `cane-bobtail2`.
- **Magenta e non scacchiera**: i fogli di ieri avevano una scacchiera
  finta dentro il JPEG, e `fondo: "auto"` l'ha tolta allagando dai bordi;
  il magenta rende lo scontorno più sicuro e permette `ombra: true` se
  l'ombra arriva lo stesso.
- **La taglia si chiede col paragone**, non in pixel: «alto quanto il
  cane» è l'unica misura che un generatore rispetta.

## Dopo il foglio

1. PNG/JPEG e foglietto accanto, stesso nome (`coniglio.jpeg`,
   `coniglio.json`), con `tipo: "bestia"` e il campo `prompt`.
2. `python strumenti/sprite/atlante.py fattoria` (Python 3.12 con Pillow).
3. Una riga in `ANIMALI` (`dati/animali.js`), i `NOMI`, e i cibi della
   famiglia in `CIBI` (`dati/bisogni.js`), se no `guastiDegliAnimali()`
   protesta. Gli agganci dei cappelli per specie stanno nel foglietto
   (vedi il lavoro sugli agganci).
4. `npm run mondo` per guardarlo camminare accanto agli altri.
