# Come si disegna il campo

Fondale e creature sono **dipinti, e presi in prestito**: vengono dai fogli
del castello e del sotterraneo, che sono già nel file unico. Survivors non
aggiunge un byte di immagini. Colpi ed effetti invece sono disegnati in
codice (`scena/campo.js`), come nel castello: nei fogli non ce n'è nessuno,
e lì il vettoriale va meglio.

## Le creature — `scena/figure.js`

- `BESTIARIO` dice quale creatura fa le veci di ogni mostro, **scenario per
  scenario**: la melma è verde nel prato, rosa nella neve, viola nella
  grotta. La faccia cambia, il mostro no: velocità, vita e mole restano
  quelle di `dati/mostri.js`.
- Le figure vengono dal foglio delle figure del castello
  (`castello/dati/figure.js`). Vespa e fungo vengono dall'atlante del
  sotterraneo, che ha pezzi quattro volte più piccoli. Melma, ragno, lupo
  e scorpione **camminano** (di lato e di fronte, dal video di Grok);
  gli altri respirano.
- **La grandezza viene dal raggio del motore** (`GRANDEZZA` × r, sull'area
  del fotogramma più grande della serie). Così respirando la figura non
  cambia taglia, e quello che si vede è quello che colpisce.
- Il castello genera il suo foglio con le sole figure che il suo
  bestiario nomina. Se smette di usarne una, qui sparisce e al suo posto
  si vede una palla: `unita/survivors-terreno` controlla che ogni figura
  nominata qui esista.

## Il fondale — `scena/fondale.js`

- **Un posto è un foglio del terreno del castello**: bosco, palude, neve,
  lava. Il deserto è la neve moltiplicata per un colore sabbia, pixel per
  pixel. Provato col `multiply` del canvas: sugli orli sfumati delle toppe
  prende il colore della tinta, e si vede la griglia.
- **La notte è il bosco di giorno**, e il buio lo mette il campo sopra a
  tutto, con la luce intorno all'eroe (`atmosfera`). Così anche le macchie
  trovate di notte sono al buio.
- Il fondo piatto (toppe, cose per terra, acqua) si dipinge **una volta per
  riquadro** e si tiene (quattordici riquadri). Alberi e massi sono alti:
  li dipinge il campo a ogni fotogramma, in fila coi mostri per
  profondità. Chi passa dietro un albero lo vede trasparente: l'eroe non
  sparisce mai.
- **Il bordo di una macchia** si decide ogni 3 punti di mondo, non per
  toppa. Ogni posto si dipinge intero sul suo strato e si ritaglia con
  quella mappa. Provato a scegliere il posto per toppa: il confine veniva
  a gradini di 40 punti, anche spostando a caso il punto guardato.
- I riquadri si sovrappongono di 2 punti (`BORDO`): senza, fra due resta
  un filo.

## Gli effetti — `scena/campo.js`

Quello che brilla si somma alla luce sotto (`lighter`): scintille dei
colpi, scie delle frecce, comete, fulmine, anelli. La creatura che muore
si schiaccia, s'imbianca e sparisce in uno sbuffo (`morte`, che il motore
mette fra gli effetti con chi e dove). La salita di livello è una colonna
di luce (`luce`). Quando l'eroe è preso lo schermo dà uno scossone, che
dura il primo terzo del lampeggio.

## Cosa manca

- **L'eroe** è l'elfa del sotterraneo (`disegnaEroe` in `figure.js`),
  dal vecchio set 0x72: corre e respira, ma è piccola e di un'altra mano.
  Un'arciera generata apposta, col metodo del video
  (`strumenti/sprite/DA-GENERARE.md`, voce 5), prende il suo posto lì e
  basta. L'arco resta disegnato in codice, perché gira verso il bersaglio.
- **Il deserto e la notte** non hanno un foglio loro: sono neve tinta e
  bosco al buio. Un foglio del deserto (sabbia, cactus, rocce rosse,
  oasi) è il secondo da chiedere.
- Gli **oggetti a terra** (cuore, calamita, cassa) sono ancora disegnati in
  codice.
