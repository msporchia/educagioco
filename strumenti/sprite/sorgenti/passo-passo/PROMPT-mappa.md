# Scheda di prompt — la mappa delle isole di Passo passo

La mappa delle isole (docs/passo-passo/mappa.md) disegnata in codice è
«troppo grezza», e scorrere solo in verticale costringe il cane a tornare
indietro per andare avanti. Si fa come la terra di sopra del sotterraneo
(vedi `../sotterraneo/generati/PROMPT-terra-di-sopra.md`): **un fondale
dipinto** tenuto com'è, più grande dello schermo **nei due versi**, con la
vista che segue il segnalino; il codice ci posa sopra solo le caselle
delle tappe, il segnalino, le stelline, i lucchetti e il fumetto. Le
caselle seguono una strada segnata a mano sul fondale (un foglietto), non
quella che il generatore avrà disegnato a caso.

Due fondali **orizzontali** (1536×1024), **nella stessa chat**, così hanno
una mano sola:

1. `isole_1.png` — la valle dei piccoli: prato, salto, ghiaccio, massi, buche (24 tappe del coniglio) e accanto il pascolo del cane (11 tappe);
2. `isole_2.png` — le terre dello zaino: ripeti, fino a, se, tutto il mondo (21 tappe del coniglio), ognuna con accanto la sua isoletta del cane (3–4 tappe ciascuna).

Al primo prompt si allega la schermata di una partita (`passo-stile.png`, qui accanto; la rifà `test/scatti/passo-grande.png`):
è lo stile del gioco.

## Prompt 1 — la valle dei piccoli

```text
Disegna in pixel art a 16 bit, vista dall'alto a tre quarti, la MAPPA DEL MONDO di un gioco per bambini, come la mappa di Super Mario World: un fondale ORIZZONTALE da 1536×1024 px, ogni pixel del disegno è un quadrato di 4×4 px. La mappa si esplora in tutte e due le direzioni, quindi le cose sono sparse su tutta l'immagine, non in colonna.

Allego una schermata del gioco: è lo STILE (lo stesso prato, gli stessi cespugli, la stessa tana, la stessa luce allegra e i colori pieni). Un coniglietto bianco ci salterà da una tappa all'altra.

CINQUE ISOLE del coniglio nel mare azzurro, unite da ponti di assi di legno, disposte come un sentiero che gira: si parte in basso a sinistra, si va verso destra, si sale, si torna verso sinistra, e si finisce in alto al centro.
1. in basso a sinistra, IL PRATO: erba, fiori, un orto con le carote, la tana del coniglio da cui si parte;
2. in basso a destra, IL SALTO: un ruscello che taglia l'isola, con tronchi e sassi per saltare;
3. a destra in alto, IL GHIACCIO: un lago gelato e un po' di neve, sassi che spuntano dal ghiaccio;
4. in alto a sinistra, I MASSI: grandi massi tondi e un fiumiciattolo con un ponte di sasso;
5. in alto al centro, LE BUCHE: terra smossa con buche dai bordi colorati (rosso, blu, giallo) a coppie; sul bordo un CARTELLO di legno a due frecce senza scritte accanto a una tana più grande: è il bivio.
Al centro della mappa, raggiungibile dalla tana del bivio con un passaggio sotto terra (si vede solo l'uscita, un'altra tana), una SESTA ISOLA più grande e diversa: IL PASCOLO DEL CANE PASTORE, erba più chiara e gialla, staccionate, un ruscello col guado, un laghetto gelato in un angolo, e un grande RECINTO col cancello aperto e un fienile.

Su ogni isola un SENTIERO di terra battuta largo e ben visibile, che serpeggia da un ponte all'altro (sul pascolo, dalla tana al recinto): è lì che metterò le tappe, quindi niente alberi, sassi o staccionate sopra il sentiero.

Il mare fra le isole vive: onde, scogli, un'anatra, ninfee vicino alle rive. Niente animali sulle isole, niente personaggi, niente scritte, niente numeri, nessuna interfaccia, nessuna cornice.
```

Controllo: le sei isole si distinguono a colpo d'occhio e occupano tutta
l'immagine; i sentieri sono continui e liberi; il pascolo non sta in fila
con le altre; niente scritte. Se un sentiero è interrotto o coperto, una
correzione mirata («rifai uguale ma col sentiero libero da un ponte
all'altro»).

## Prompt 2 — le terre dello zaino

```text
Nella stessa mano e alla stessa scala della mappa che hai appena fatto, un secondo fondale ORIZZONTALE da 1536×1024 px: LE TERRE DELLO ZAINO, per i bambini più grandi, un po' più magiche e ordinate della prima. Anche qui la mappa si esplora nelle due direzioni.

QUATTRO ISOLE del coniglio unite da ponti di legno, in un giro: si arriva da una tana in basso a sinistra, si va a destra, si sale, si torna a sinistra.
1. in basso a sinistra, IL RIPETI: colline a terrazze e un viale alberato dritto, file di cose uguali (alberi in fila, stalle in fila);
2. in basso a destra, FINO A: scale e pianerottoli di pietra che salgono, e lastre colorate nel terreno (rosse e blu);
3. in alto a destra, IL SE: colline morbide con cartelli senza scritte e lastre colorate agli incroci;
4. in alto a sinistra, TUTTO IL MONDO: un'isola che mescola tutto — un po' di ghiaccio, massi, un ruscello, lastre colorate — con una spirale di sentiero.
Accanto a OGNUNA delle quattro, staccata nel mare ma vicina, un'ISOLETTA DEL CANE: pascolo chiaro, staccionate, una piccola stalla di legno e una tana; ogni isoletta ha una tana anche sulla sua isola del coniglio, di fronte. Le quattro isolette sono diverse fra loro (una con le stalle in fila, una a gradini, una con le nicchie fra le siepi, una con un laghetto gelato).

Su ogni isola e isoletta un SENTIERO largo e libero (fra i ponti, o dalla tana in giro per l'isoletta). Niente animali, niente personaggi, niente scritte, niente numeri, nessuna cornice.
```

## Com'è andata

- **`isole_1.png` (prompt 1)**: le sei isole ci sono e si riconoscono, i
  sentieri sono continui e quasi tutti liberi. Ma **il giro chiuso non
  segue l'ordine dei capitoli**: i ponti vanno prato–salto–ghiaccio–buche–
  massi–prato, e i massi (il quarto) stanno fra le buche (il quinto) e il
  prato; il pascolo ha in più due ponti, dal prato e dal salto. Si è scelto
  di tenerlo così: un ponte verso un'isola chiusa ha il blocco, e dal
  ghiaccio ai massi si torna giù dal prato. Non si è rigenerato.
- **Il fondale nel gioco** si fa col foglietto `isole.json` e lo strumento
  `strumenti/sprite/isole-passo-passo.py` (`--provino` per guardarlo):
  docs/passo-passo/mappa.md.
- **Due difetti del disegno**, girati attorno nel foglietto: sul pascolo il
  sentiero che scende dalla tana passa dietro il fienile e la staccionata
  (lì non si mettono caselle: un raccordo senza caselle), e sul prato la
  strada della tana e quella dei massi non si toccano (un passaggio
  sull'erba, `"erba": true`). La tana delle buche in cima, che il prompt
  voleva per il bivio, porta allo zaino; il cartello a due frecce resta
  disegno.
- **`isole_2.png` (prompt 2)**: le quattro isole grandi ci sono e si
  riconoscono (ripeti in basso a sinistra con le stalle e il viale, fino a in
  alto a sinistra con rocce, neve e cascata, il se in alto in mezzo con siepi
  e cartelli, tutto il mondo in basso a destra con la spirale attorno al monte
  di cristallo), e c'è la riva con la tana d'arrivo in un angolo. Ma **non è
  un giro, è una catena**: i ponti vanno tutto il mondo–ripeti–fino a–se, con
  una stalla in mezzo fra il fino a e il se (un'isoletta dove il ponte
  passa: è del fondale, non una tappa). Le isolette sono **sei**, non
  quattro: una è il passaggio di cui sopra, quattro pendono da un'isola
  grande e una (a destra in basso) resta senza tappe. Si è tenuto così, e il
  giro è la catena: la sbarra sul ponte del ripeti–tutto il mondo e su quello
  del fino a–se fa il resto.
- **Come si è usato**: foglietto `zaino.json` (docs/passo-passo/mappa.md, «Il
  mondo dello zaino»). Ripeti → l'isoletta con le stalle in fila, se → quella
  di destra in alto, tutto il mondo → quella col lago gelato, fino a → quella
  in basso in mezzo (non ne ha una accanto). Le isolette sono larghe 180 px:
  tre caselle ci stanno solo a zigzag, e si è portato il lato a 48.
- **Due difetti del disegno**, girati attorno nel foglietto. La tana «di
  fronte» sull'isola grande c'è solo per due isolette (quella in cima
  all'isola del se, e quella sull'isolotto di passaggio, che fa da tana al
  fino a): per il ripeti e per tutto il mondo il coniglio sparisce in una
  nuvoletta (`nuvola` nel foglietto), al capo del ponte e sul lato della
  spirale. E le isolette non hanno un sentiero lungo, solo un pezzo di
  sabbia: le tre caselle stanno sull'erba, a zigzag.
- **Il resto di quello che serviva c'è**: un ingresso riconoscibile, i
  capitoli in fila sui ponti, sentieri abbastanza lunghi sulle isole grandi
  (il ripeti ha 8 tappe sul viale e attorno al fienile), nessun sentiero che
  sparisce dietro un edificio. **Se si rigenera**, dire nel prompt che ogni
  isoletta ha un sentiero lungo almeno 180 px e la tana di fronte sull'isola
  grande.
