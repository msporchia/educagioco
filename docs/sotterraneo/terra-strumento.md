# Lo strumento della terra di sopra

`python3 strumenti/sprite/terra-di-sopra.py` fa i due moduli generati della
terra di sopra dal foglietto `strumenti/sprite/sorgenti/sotterraneo/terra-di-sopra.json`:
`dati/terra-mappa.js` (la mappa, la maschera, i posti, chi sta fermo, il
portale gemello) e `dati/terra-icone.js` (le icone delle discese). I moduli
non si toccano: si corregge il foglietto e si rilancia. Come si gioca la
mappa: [terra-di-sopra.md](terra-di-sopra.md). Serve `pillow` con WebP.

## La giunta

Le due metà si toccano a x=1024, e lì il bosco è fitto da una parte e
dall'altra ma non combacia (a sinistra il prato arriva al bordo in due
punti, a destra è bosco ovunque). Lo strumento la cuce nel foglietto
(`giunte`), senza disegnare niente:

- **Una fascia di 128 px attorno alla giunta passa da un pezzo all'altro a
  blocchi da 4 px** (un pixel del disegno), scelti da un rumore a macchie
  larghe ~28 px e ripulito da un filtro mediano. Non per trasparenza: due
  boschi sovrapposti a mezzo tono fanno fantasmi, a blocchi un ciuffo di
  chioma passa all'altro come una macchia di foglie. Oltre il proprio bordo
  ogni metà continua specchiata, così la scelta ha sempre un pixel da dare.
- **Il sentiero che esce dal bordo destro** (a 1147 px dall'alto) si
  collega a quello del villaggio **stendendo un pezzo di sentiero già
  disegnato** (`sentiero.sorgente`, due punti sull'asse della terra battuta,
  col suo bordo d'erba, preso dalla macchia di terra connessa al seme) lungo
  una curva (`sentiero.curva`, quattro punti) fino alla piazza, tirandolo
  di poco più del doppio per coprirla. L'originale si rimette sopra la fascia, che
  se lo mangerebbe. Nessuna pennellata inventata.
- **Si guarda con `--giunta`** (`tmp/terra/giunta-alta.png`, `-bassa`,
  `-sentiero`): a sinistra le due metà a secco, a destra com'è. Difetti
  noti: un sasso della prima metà, tagliato dal bordo, qui si ripete
  specchiato e dà un masso doppio (riquadro [980, 940, 90, 140] sulla
  tela); qualche blocco di chioma ha il bordo rettilineo; il sentiero
  steso è un poco più liscio dell'originale.

## La maschera

- **Nasce da una proposta letta dai colori** (sentiero e prato sì; chiome,
  acqua, roccia, contorni scuri no) e poi si corregge: le case di paglia
  hanno il colore del sentiero, i cespugli quello del prato, e solo l'occhio
  li separa. Il giro:
  1. `--proponi` scrive `tmp/terra/proposta.txt` e dice quante celle
     differiscono dal foglietto;
  2. `--provino` scrive `tmp/terra/provino.png`, la mappa con sopra la
     maschera (rosso dove non si passa), i riquadri dei posti e i piedi (in
     viola il portale gemello);
  3. si corregge la riga nel foglietto, si rilancia lo strumento,
     `npm test` (`unita/sotterraneo-terra`).
- **Lo strumento controlla** che `piede` e `accanto` di minatore, mercanti e
  portale si possano camminare e che nessuno si fermi addosso a chi sta fermo.

## Le icone

- **Un quadrato attorno al `riquadro` del posto**, largo `margine` volte il
  lato più lungo (1,1), rimpicciolito a `lato` (96) e chiuso in un tondo
  pieno fino a `pieno` del raggio (0,72) e sfumato oltre; WebP a `qualita` 80
  (`icone` nel foglietto). Sette icone, sui 29 KB in tutto: un modulo a parte,
  così la home le usa senza tirarsi dietro la mappa da 860 KB.
- **Un ritaglio che non si legge si corregge nel `riquadro`** del posto, che
  è anche il bottone che si tocca: se servisse un ritaglio diverso dal
  bottone, il posto avrà un campo suo.
