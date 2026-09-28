# La roba: eroi, armi, torcia, mercante, curiosità

Chi scende, cosa porta addosso e in tasca, cosa si trova per terra, cosa si
compra e cosa si tocca per vedere che succede. Il codice: `dati/eroi.js`,
`dati/cose.js`, `dati/curiosita.js` e `motore/corsa.js` in
`src/giochi/sotterraneo/`.

## Quattro eroi, e cosa portano

| | vita | braccio | difesa | porta |
|---|---|---|---|---|
| 🛡️ Cavaliere | 18 | 3 | 1 | spade, asce, ferro |
| 🧝 Elfa | 15 | 4 | 1 | spade, archi, stoffa |
| 🧙 Mago | 12 | 5 | 0 | bacchette, stoffa |
| 🧔 Nano | 20 | 3 | 2 | asce, archi, ferro |

- **La scelta cambia i conti, e si legge in numeri e icone**, mai in tratti
  nascosti: un tratto da spiegare in un gioco che non si spiega lo sanno solo
  i grandi.
- **Il costo di un mostro è le sue ossa diviso il tuo braccio**: il braccio
  è la manopola velenosa. La stessa campagna costa 13–33 domande al
  cavaliere e 8–21 al mago, che però sviene molto più spesso. **Nessuno sotto
  braccio 3** (`guastiDegliEroi`): con 2 l'orco costa dodici risposte di
  fila, che non è difficile, è lungo.
- **Le famiglie** (`FAMIGLIE` in `dati/eroi.js`, `famiglia` sulle cose): la
  classe dichiara cosa porta e il motore chiede, senza `if` col nome di un
  eroe. Il limite si vede in tre posti — sulla carta della classe, addosso
  alla cosa («Il mago non impugna le asce», scritto una volta sola in
  `nonLaPorta`), e non impedisce mai di **raccogliere e vendere**.
- **Quello che non ha famiglia lo porta chiunque**: scudi, gioielli,
  pozioni, il panciotto di cuoio, il pugnale.
- **Il bottino predilige la classe, non la garantisce** (`PESO_ALTRUI` = un
  terzo, in `pescaCosa`/`pescaMerce`): a zero un forziere smetterebbe di
  essere una notizia.
- **Si sceglie una volta e resta**, dalla mappa delle discese
  (`DI_PARTENZA`: il cavaliere). `unita/sotterraneo` gioca la campagna con
  tutti e quattro.

## Addosso e in tasca

- **Addosso: la mano, la mano debole, il corpo, il dito. In tasca: sei
  posti** (`TASCHE` in `dati/mondo.js`). Le tasche sono il limite: scegliere
  cosa lasciare per terra è il bivio fatto con le mani.
- **Quattro famiglie d'arma in tre gradini, e a parità di gradino valgono lo
  stesso** — la regola dei due rami del castello: cambia la forma, mai la
  quantità.
- **Al dito va l'unica cosa che non picchia**: vedere più lontano, tornare su
  con più gemme, reggere un colpo in più. Ce n'è uno, quindi si sceglie.
- **Nello zaino le caselle stanno intorno alla figura**, con in pugno l'arma
  vera.

## Due mani

- **Le armi leggere si portano due alla volta**; quelle grosse (spadoni,
  asce, archi, bastoni) dichiarano `mani: 2` in `dati/cose.js`.
- **La mano debole colpisce la metà, arrotondata per eccesso**
  (`attaccoMancino`), e **un'arma a due mani picchia uno più del suo
  gradino** (`LA_MANO_CHE_RESTA`): due leggere valgono la pesante dello
  stesso gradino, fra cose che costano uguale. Si è toccato l'attacco e non
  il prezzo perché le armi si trovano più di quanto si comprino.
  `guastiDelleCose` e `unita/sotterraneo` («due leggere valgono una
  pesante») tengono fermo il conto.
- **I tratti valgono pieni anche a sinistra**: la luce di una lama è la
  stessa copia dell'oggetto.
- **Con un'arma a due mani la casella di sinistra porta la stessa arma in
  ombra e girata**: vuota direbbe che ci si può mettere qualcosa. In scena
  invece l'arma a due mani sta **in mezzo, davanti al corpo**; provata la
  copia sbiadita dall'altro lato: si vedevano due armi.
- **Dove va un'arma raccolta lo decide `postoDellArma`**, provando le
  sistemazioni. Un'arma a due mani sfratta la sinistra, e quello che c'era
  torna in tasca, o per terra se le tasche sono piene.

## Quello che sta per terra si tocca

- **Le gemme si prendono passandoci sopra; tutto il resto va toccato.** Una
  spada entrata nello zaino mentre passavo è una spada che non ho scelto.
- **Una cosa migliore di quella addosso si mette da sé**, e la riga dice il
  guadagno: «Spada ⚔️ +2». Vale anche per quello che si compra. Provato il
  foglio col confronto: tre tocchi per un sì scontato.
- **Peggiore o uguale va in tasca**, e si confronta nello zaino. Quello che
  si toglie **non si perde mai**: torna in tasca o prende il posto per terra
  di quello raccolto. I gioielli restano fuori dall'automatismo quando il dito
  è occupato: fra due anelli c'è un modo di giocare, non un «più forte».
- **Nello zaino una tasca toccata sceglie e basta**: sotto compaiono cosa fa
  e due tasti larghi, «la bevo» e «la lascio per terra».
- **Un forziere aperto è scenografia** e non si tocca più: si mangiava il
  tocco destinato alla roba, e a un forziere ci si ferma accanto, quindi la
  roba non deve nascere sotto di lui.

## La torcia si accende da sé, e finisce

- **Accenderla non è una scelta**: si accende appena presa e non entra nello
  zaino. Brucia sulla corsa (`corsa.torciaResta`), e le altre aspettano alla
  cintura (`corsa.torceInScorta`) e si accendono da sé. **La scorta non ha
  tetto**: provata la torcia per tutta la discesa, e ogni altra torcia
  diventava roba da rifiutare.
- **Dura dodici stanze** (`STANZE_TORCIA`). **L'unità è la stanza, non il
  tempo**: sotto una domanda l'orologio è fermo, e un conto che scorre farebbe
  pagare la luce a chi legge piano. Scendere e risvegliarsi non consumano.
  Dodici è misurato: chi tocca tutto entra in 34 stanze nel pozzo, 36 nelle
  gallerie, 45 nella cisterna, 44 nel fondo, 83 nel labirinto — undici o
  dodici per piano. Una torcia vale un piano.
- **Costa 5 gemme**, appena sotto la boccetta: un piano di luce è una
  comodità, non la sopravvivenza. Il prezzo è l'unica scala su cui sta tutto
  il catalogo.
- **Quanta ne resta si vede**: in basso a sinistra una fiamma che cala nel
  suo lume, con le stanze che restano e le torce di scorta; agli sgoccioli,
  e solo senza scorta, guizza. Senza, il buio arriverebbe come un guasto.
- Una sosta vecchia con `torcia: true` si riprende con una torcia piena.

## Il banco del mercante

- **L'unica stanza senza domande**: qui si spende quello che le domande hanno
  fruttato.
- **Ogni riga dice cosa fa**, non solo il nome («Sbagliare fa meno male»).
  Quello che non ci si può permettere resta visibile e spento: sapere cosa
  c'era è il motivo per tornare.
- **Sotto il banco le proprie tasche, a metà prezzo** (`quantoVale`):
  comprare e rivendere perde metà, quindi non è un modo di fare gemme, ma
  libera le tasche e smaltisce la spada di ieri.
- **Cinque righe su una quarantina di voci** (`pescaMerce`), pesate sul
  prezzo atteso a quella profondità (`prezzoAtteso`, dalla stessa `durezzaDi`
  delle domande); una cosa lontana pesa un decimo e non zero. Con tre righe a
  caso capitava spesso un banco senza niente di utile.
- **Quattro armi con un nome proprio** — la bipenne solare, la spada del
  ladro, il pugnale vampiro, la spada di ghiaccio — stanno fuori dalla scala:
  non picchiano di più, portano un tratto (luce, più gemme, tenere in piedi,
  parare). Nessuna batte lo spadone sul suo terreno.

## Le curiosità

- **Un libro polveroso, una clessidra ferma, un calice**: non servono a
  niente, ed è per quello che ci sono. Un sotterraneo di soli mostri e porte è
  una fila di esercizi con un tema sopra.
- **Una domanda, poi una frase**: il lavoro sono le frasi, una quarantina per
  quando va bene e una quarantina per quando va male (`dati/curiosita.js`).
  Il foglio non si chiude da sé: la battuta resta finché non si è letta.
- **Rispondendo giusto un premio** (gemme, vita, un punto di vita massima, la
  torcia). **Rispondendo storto, metà delle volte niente**; quando succede è
  mite (`MALUS`: 2 di vita o 2–6 gemme). Un malus vero farebbe evitare le
  curiosità. Il costo lo dichiara la singola frase.
- **L'invito dice sempre che può andare male**, prima di rispondere.
- **Due o tre per piano, tre o quattro sui piani grandi**: una ogni tre
  stanze, come i forzieri. Non sono un pedaggio: si passa oltre.

## L'arredo dice che non si tocca

Barili, casse, ossa, bracieri: arredo, **disegnato più spento** delle cose
che rispondono (che hanno un filo di luce dorato). Toccandolo si ottiene una
riga — la prima volta la regola, «quello che si può toccare ha la luce
intorno», poi una battuta. Una cosa che non fa niente e non dice niente si
legge come rotta; una stanza senza arredo è vuota, che è il difetto opposto.
