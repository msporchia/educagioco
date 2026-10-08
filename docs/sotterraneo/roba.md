# La roba: eroi, armi, torcia, mercanti, curiosità

Chi scende, cosa porta addosso e in tasca, cosa si trova per terra, cosa si
compra sopra e cosa si tocca per vedere che succede. Che la roba resti fra una
discesa e l'altra: [la-roba-che-resta.md](la-roba-che-resta.md). Il codice:
`dati/eroi.js`, `dati/cose.js`, `dati/mercanti.js`, `dati/curiosita.js`,
`motore/corredo.js`, `motore/bottega.js` e `motore/corsa.js` in
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
  tutti e quattro. Ognuno ha la sua roba, nella sua avventura
  ([avventure.md](avventure.md)).

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
- **Nello zaino una tasca toccata sceglie e basta**: sotto compare il
  pannello col confronto e due tasti larghi, «Bevi» (o «Indossa») e «Butta»
  ([La bottega e lo zaino](#la-bottega-e-lo-zaino)).
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
  Dodici è misurato: chi tocca tutto entra in 34 stanze nel pozzo, 36 nella
  grotta, 45 nella scala sommersa, 44 nella miniera, 83 nella botola — undici o
  dodici per piano. Una torcia vale un piano.
- **Costa 5 gemme**, appena sotto la boccetta: un piano di luce è una
  comodità, non la sopravvivenza. Il prezzo è l'unica scala su cui sta tutto
  il catalogo.
- **Quanta ne resta si vede**: il globo d'oro a destra della barra in basso
  cala con le stanze che restano, e la casella 🔥 accanto conta le torce di
  scorta ([barra.md](barra.md)); agli sgoccioli, e solo senza scorta, guizza.
  Senza, il buio arriverebbe come un guasto.
- Una sosta vecchia con `torcia: true` si riprende con una torcia piena.
- **Comprata sopra aspetta alla cintura**, e scendendo se ne accende una:
  sopra non c'è buio da rischiarare.

## I mercanti di sopra

Tre botteghe sulla terra di sopra, vicino alle case e al carro
(`MERCANTI` in `dati/mercanti.js`; dove stanno:
[terra-di-sopra.md](terra-di-sopra.md#i-mercanti)). Nelle discese non vende
più nessuno.

| chi | vende | in cima, sempre |
|---|---|---|
| ⚒️ l'armaiolo, davanti alla casa di sinistra | armi, scudi, armature | — |
| 🌿 l'erborista, davanti alla casa di destra | l'elisir del toro (dalla seconda discesa finita) | boccetta, pozione, ampolla, torcia |
| 🧺 il rigattiere, accanto al carro | anelli, amuleti, chiavi | — e **compra** quello che hai in tasca |

- **Il posto senza domande**: qui si spende quello che le domande hanno
  fruttato. Quello che non ci si può permettere resta visibile e spento, col
  prezzo in rosso e quanto manca sul tasto: sapere cosa c'era è il motivo per
  tornare.
- **Compra solo il rigattiere, a metà prezzo** (`quantoVale`): comprare e
  rivendere perde metà, quindi non è un modo di fare gemme, ma libera le
  tasche. Tre botteghe che comprano farebbero di ogni banco un posto dove
  svuotare le tasche; chi non compra dice chi lo fa.
- **L'armaiolo e il rigattiere portano il passo dopo della storia**
  (`passo` in `dati/mercanti.js`, `bancoDelPasso` in `motore/storia.js`):
  i pezzi della riga con cui si entra nella prossima discesa che mancano,
  e un paio di cose (`altre`) che non costano più di quei pezzi.
  L'erborista pesca a righe (`righe` per discese finite), come prima.
- **I pezzi delle righe dopo si comprano, a un prezzo più alto**
  (`vetrinaDelPasso` in `motore/storia.js`, al più due per casella;
  `sovrapprezzo` in `dati/mercanti.js`): un pezzo `k` righe avanti al passo
  costa `1 + k` volte il prezzo pieno (il doppio, il triplo…), col
  numero vero sotto la casella e «Costa di più: è roba per più giù» nel
  pannello. Chi ha messo da parte le gemme può scendere con un pezzo
  avanti, e non c'è una discesa da finire perché il mercante glielo dia.
  **Perché non un blocco**: «se ho i soldi perché no». Provato: i pezzi
  avanti spenti col lucchetto e «Quando avrai finito…»; l'utente non
  capiva perché con le gemme in tasca non si comprasse lo scettro.
  **Il prezzo è la sola leva**: misurato (`misure/sotterraneo`) un
  giocatore che compra il meglio che può — girando tutto e spendendo ad ogni
  visita, o con 100 e 250 gemme da parte — nelle ultime due discese (botola,
  miniera) resta dov'era: a 6/10 vince 54% e 40% (prima 38% e 43%), a 4/10 8%
  e 5% (prima 3% e 2%); con 100 gemme da parte 75% e 71% a 6/10 (prima 79% e
  74%). Le discese di mezzo si fanno più comode a chi ha tante gemme (a 4/10
  dal 3–12% all'11–29%): è il premio per averle messe da parte. Curve provate
  sul giocatore che gira tutto: ×1,5 per la prima riga e +0,5 a ogni altra
  regalavano la grotta (a 4/10 il 41% contro il 3%), troppo.
- **Il banco non resta mai vuoto**: dietro ai pezzi del passo ci sono quelli
  delle righe dopo, che il bambino vede e può sperare di potersi permettere.
  Un mercante non dice mai «non ho niente per te»; solo a chi ha già tutto
  dice che il resto sta nell'abisso (`[data-banco-vuoto]`).
- **Solo roba per l'eroe** (`posso` in `Bottega.banco`, `bancoDelPasso`): né
  in vendita né in vetrina ci sono pezzi di famiglie che l'eroe non porta (la
  verga al cavaliere, l'ascia al mago). Un banco già pescato con roba altrui
  se la vede sostituire con un pezzo della sua famiglia dello stesso gradino
  (stesso grado d'arma o stessa fascia di prezzo), o senza (`soloRobaMia`).
- **Quello che non alza niente non si mostra** (`sottoAddosso` in
  `motore/bottega.js`): resta pescato ma non si vede. Una seconda arma
  leggera con la mano libera alza il braccio, e quindi si vede.
- **Il banco si pesca una volta per giro** e si scrive in
  nell'avventura (`botteghe`); il giro cambia quando finisce una discesa (vinta, persa o
  finita la sera nell'abisso). Un banco che cambiasse a ogni apertura sarebbe
  una slot machine, e uscire a metà per ripescarlo un trucco.
- **Quello che si ha già non si offre**, tranne quello che si consuma; il
  pescato è pezzo unico e se ne va comprandolo, le cure e la torcia no.
- **Comprato = messo**, come per terra: una cosa migliore va addosso da sé e
  la riga sopra il pannello dice il guadagno. **Lo zaino pieno ferma solo
  quello che non trova posto**, provato prima su una copia (un'arma a due
  mani sfratta anche la mano debole).
- **Appena aperta la bottega non ascolta per 320 ms**: un secondo tocco sul
  mercante, dato mentre l'eroe ci arriva, comprava la riga che ci stava sotto.
- **Quattro armi con un nome proprio** — la bipenne solare, la spada del
  ladro, il pugnale vampiro, la spada di ghiaccio — stanno fuori dalla scala:
  non picchiano di più, portano un tratto (luce, più gemme, tenere in piedi,
  parare). Nessuna batte lo spadone sul suo terreno.
- **Le gemme non diventano monete, mai**: la roba si vende solo in gemme.

## La bottega e lo zaino

`viste/Bottega.vue` e `viste/Zaino.vue`, coi pezzi comuni `Cornice.vue`,
`Addosso.vue`, `Casella.vue`, `Pannello.vue` e `pezzo.js` (gradini, numeri).

- **Una finestra da gioco di ruolo stretta in un telefono**: legno scuro e
  bordo d'oro con quattro angoli, disegnati in CSS e SVG. Dall'alto il
  mercante (ritratto e nome), l'eroe armato con le quattro caselle intorno e
  i numeri accanto (vita, braccio, difesa e le gemme, sempre in vista), le
  linguette, la griglia, il pannello. Scorre solo la griglia. Provato: un
  elenco di voci col bordino, sembrava un modulo da compilare.
- **Le linguette sono del mercante** (`schede` in `dati/mercanti.js`):
  l'armaiolo «Armi» e «Scudi e armature», l'erborista «Pozioni» e «Torce»,
  il rigattiere «Gioielli» e «Vendi». «Vendi» ce l'ha solo chi compra; gli
  altri lo dicono con una battuta. `guastiDeiMercanti` pretende che ogni
  cosa del banco stia sotto una linguetta.
- **Caselle grandi, tre per riga**, col pezzo disegnato e il prezzo sotto. Il
  bordo dice il gradino: grigio comune, azzurro buono, oro raro, arancio le
  quattro armi col nome. Si legge dal prezzo (fino a 12, fino a 22, oltre),
  che cade sui tre gradini delle armi.
- **Un tocco sceglie, il secondo compra** (o il tasto «Compra 💎 N»): il dito
  sbaglia, e un acquisto al primo tocco non si disfa. Un secondo tocco entro
  400 ms (`RIPENSO`) è un dito che ha premuto due volte, e non compra.
- **Il pannello dice numeri, non frasi**: «⚔️ +4 attacco», «❤️ +6 vita». Un
  pezzo che si indossa non ha più la riga sola «⚔️ 3 → 5», che bastava finché
  un pezzo era solo attacco e non regge con più abilità: ha **il confronto
  affiancato**, come in Diablo (`viste/Confronto.vue`).
  - **Due colonne**: «Addosso» (il pezzo che occupa lo stesso posto, col
    disegno piccolo e il nome del colore del suo gradino; «niente» se il posto
    è vuoto, «mano libera» se un'arma va nella mano debole) e «Questo» (il pezzo
    guardato). **Una riga per ogni abilità che almeno uno dei due ha**, coi
    due valori allineati e «—» dove manca: verde con ▲ dove il nuovo è
    meglio, rossa con ▼ dove è peggio, neutra se uguale. In cima la sintesi
    («meglio in 2, peggio in 1», o «uguale»), poi il totale che cambia
    sull'eroe (vita, attacco, difesa prima → dopo).
  - **Il posto giusto**: un anello si confronta col gioiello che hai; un pezzo a
    due mani con arma **e** scudo insieme, e la riga sopra lo dice; un'arma
    nella mano debole vale metà braccio, e lo dice il numero. Un pezzo che
    l'eroe non porta, o che lo scudo non può affiancare a un'arma a due mani,
    non ha confronto: il pannello dice il perché.
  - **I numeri li dà il motore** (`seLoMetto().cambio` in `motore/corredo.js`):
    `toglie` sono i pezzi mandati via, `vecchi` e `nuovi` quanto danno le
    caselle toccate, con le altre a fare da base, così la somma delle righe è
    il totale che cambia. Le parole, le icone e come si scrive il valore stanno
    in `ABILITA` di `viste/pezzo.js`. **Per aggiungere un'abilità** (la
    schivata…) si scrive in `addosso()`, in `ABILITA_CONFRONTATE` e in `ABILITA`:
    un test controlla che le due liste coincidano. A 390 px le tre colonne
    (abilità, prima, dopo) stanno, col testo piccolo ma leggibile.
  La casella dell'eroe dove andrebbe si accende. Sotto, solo le righe che
  servono: «Finisce nello zaino» per quello che non va addosso da sé, il
  perché di chi non lo porta (solo nello zaino: la bottega non lo offre), «Costa di più…» per i
  pezzi avanti.
- **Niente di scelto: parla il mercante**, su una pergamena, con la sua
  battuta (`dice`): voce sua, corta, parole da sette anni, non istruzioni.
  Toccando una casella dell'eroe il pannello dice il pezzo che ha addosso.
- **Lo zaino è la stessa finestra senza mercante**: l'eroe e le caselle, la
  torcia, le sei tasche in griglia, il pannello col confronto e i tasti
  «Indossa» (o «Impugna», «Imbraccia»), «Bevi», «Butta»; su una casella
  addosso «Togli». Si chiude con la ✕ o toccando il campo fuori dalla cornice (e l'eroe ci va). Le regole dello zaino sono quelle di
  prima.

Nei test: `[data-bottega]` (con `data-mercante-aperto`),
`[data-scheda="<linguetta>"]` (con `aria-selected`),
`[data-casella-pezzo="<cosa>"]` (con `data-posso`, `data-gradino` e
`data-avanti`: le righe avanti, dove il prezzo è alto), `[data-vendo="<cosa>"]`, `[data-pannello]` (con
`data-cosa`), `[data-confronto="att|dif|vita|gemme|luce"]` (con
`data-verso`: il totale sull'eroe), `[data-affianca]` col `[data-sintesi]`,
`[data-colonna="addosso|questo"]` (dentro, `[data-pezzo="<cosa>"]` o
`[data-niente]`), `[data-abilita="<campo>"]` (con `data-verso="su|giu|pari"`),
`[data-valore="<campo>-addosso|<campo>-questo"]`, `[data-due-mani]`,
`[data-avanti-costa]`, `[data-non-puoi]`, `[data-azione="compra"]`,
`[data-azione="vendi"]`, `[data-detto-banco]`, `[data-battuta]`,
`[data-chi-compra]`, `[data-banco-vuoto]`, `[data-tasche-vuote]`,
`[data-gemme-bottega]`; nello zaino `[data-zaino]`, `[data-tasca]` (con
`data-cosa`), `[data-azione="usa|butta|riponi|chiudi"]`, `[data-torcia-zaino]`;
in tutte e due `[data-casella="<dove>"]` (con `data-cosa`) e `[data-chiudi]`.
`compraNellaBottega`, `vendiNellaBottega` e `allaLinguettaDi` in
`test/aiuto/browser.mjs`; `unita/sotterraneo-roba` (il confronto riga per riga, la
sovrapprezzo dei pezzi avanti, nessun pezzo di famiglie non portate, il banco mai vuoto, quello che non si
mostra, le linguette),
`integrazione/sotterraneo-mercanti` (col dito: si sceglie, si compra, si
vende, il confronto affiancato, lo zaino che indossa e fa bere),
`integrazione/sotterraneo-confronto` (più abilità: lo spadone contro spada e
scudo, le colonne a 390 px),
`integrazione/sotterraneo-bottega-avanti` (lo scettro una riga avanti: si compra al doppio, e il mago non vede
roba che non porta), `misure/sotterraneo` (chi spende avanti nelle ultime due discese).

## Le curiosità

- **Un libro polveroso, una clessidra ferma, un calice**: non servono a
  niente, ed è per quello che ci sono. Un sotterraneo di soli mostri e porte è
  una fila di esercizi con un tema sopra.
- **Una domanda, poi una frase**: il lavoro sono le frasi, una quarantina per
  quando va bene e una quarantina per quando va male (`dati/curiosita.js`).
  Il foglio non si chiude da sé, ma la battuta non trattiene: un tocco sul
  campo la chiude e porta l'eroe dove si è toccato, come «vado avanti»
  ([../core/interfaccia.md](../core/interfaccia.md#un-tocco-altrove-chiude)).
  Provato a tenerla finché non si premeva il tasto: chi voleva andarsene
  doveva prima cercare «ok».
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
