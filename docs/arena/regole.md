# Le regole

I numeri stanno in `src/giochi/arena/dati/regole.js`, il motore in
`motore/partita.js` (senza schermo, il caso passato da fuori). Qui il perché.

## Il campo: una corsia sola

- **Una corsia, un ponte, al centro.** C'erano due corsie (come Clash Royale):
  tolte perché i nemici finivano «dietro» i muri e le caserme costruiti, e il
  muro, che copre una corsia sola, non serviva a niente sull'altra.
- Il motore conta la corsia in verticale (`y` lungo, `x` di lato), e la scena la
  disegna così, col castello di chi gioca in basso (vedi [grafica.md](grafica.md)).
- **Una partita dura 2:30.** Vince chi abbatte il castello nemico; allo scadere
  chi ha il castello più sano (entro il 5% è pari).

## Le truppe e le caserme

- Una **caserma** manda la sua truppa da sola ogni `9 / (1 + 0.12·(liv−1))`
  secondi; il livello (1-10) alza anche vita e danno (`1 + 0.25·(liv−1)`).
  Si parte con quella degli scheletri; le altre si **costruiscono** (8–16
  monete) su un posto che sceglie il gioco (il lato con meno caserme, e il
  posto più al sicuro): niente da piazzare col dito.
- **Le truppe sono otto e si distinguono per chi colpiscono, non per quanto
  valgono**: arcieri e negromanti ferirono tutti, guardiano e lupi solo chi
  cammina, il golem solo le costruzioni, i pipistrelli e il drago volano e
  scavalcano i muri. Il `guasti…()` di `dati/regole.js` pretende che ci sia
  almeno chi vola e almeno chi, da terra, ferisce chi vola.
- Le caserme **crollano** (hanno vita, 300 + 60 per livello): il posto torna
  libero e si può ricostruire (si riparte dal livello 1). Una partita a
  caserme che nessuno può rompere sarebbe una gara di soldi.

## Le scelte che non sono truppe

Costano monete di battaglia e un calcolo, come le caserme.

| scelta | cosa fa | prezzo |
|---|---|---|
| ⛏️ Più monete | +30% di monete al secondo per livello (6 livelli) | 10, 16, 24, 34, 46 |
| 🔧 Ripara | +40% di vita alla costruzione messa peggio, muro compreso (anche crollato) | 6 |
| 🏰 Castello | più danno, cadenza, gittata e vita (10 livelli) | 8 → 66 |

- **Il castello è l'unica costruzione che spara.** Prima c'era una torretta
  davanti alla base: tolta (l'utente: «più un potenziamento del castello»), e il
  castello ne ha preso la gittata (150, più 4 per livello) perché da lì deve
  coprire il muro sul ponte. La carta usa la torre del castello (a tre stadi,
  per livello), non un'emoji.
- **Il muro è uno solo per parte e non si compra**: c'è dall'inizio, chi
  cammina lo colpisce prima del resto, chi vola lo scavalca. Se crolla resta il
  cumulo e **si ricostruisce riparando** (la riparazione lo cerca per primo).
  Con due muri uno finiva «dietro» all'altro e non serviva a niente.
- **La miniera conviene presto e lascia scoperti**: è la scelta di strategia
  voluta dall'utente (produrre di più ma non attaccare); la riparazione e il
  castello più forte sono la risposta difensiva che prende tempo.

## Il respiro

Il castello **spara da solo dal primo secondo** e il nemico parte con una
caserma e un muro: chi non fa niente resiste una cinquantina di secondi (misurato
dal banco), e nei primi nove nessuna squadra è ancora uscita. Il tempo di
decidere la strategia c'è, poi la base viene sopraffatta.

## Nei test

`[data-caserma=<truppa>]`, `[data-azione=miniera|ripara|castello]`,
`[data-monete]`, `[data-avviso]`, `[data-tappa=<n>]`, `[data-fine=vinta|persa|pari]`.
