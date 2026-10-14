# La roba: eroi, armi, torcia, mercanti, curiosità

Chi scende, cosa porta addosso e in tasca, cosa si trova per terra, cosa si
compra sopra e cosa si tocca per vedere che succede. Che la roba resti fra una
discesa e l'altra: [la-roba-che-resta.md](la-roba-che-resta.md). Il codice:
`dati/eroi.js`, `dati/cose.js`, `dati/mercanti.js`, `dati/curiosita.js`,
`motore/corredo.js`, `motore/bottega.js` e `motore/corsa.js` in
`src/giochi/sotterraneo/`. L'eroe che sale di livello: [livelli.md](livelli.md);
la roba con livello e rarità: [rarita.md](rarita.md).

## Quattro eroi, e cosa portano

| | vita | braccio | difesa | porta |
|---|---|---|---|---|
| 🛡️ Cavaliere | 18 | 3 | 1 | spade, asce, ferro |
| 🧝 Elfa | 15 | 4 | 1 | spade, archi, stoffa |
| 🧙 Mago | 12 | 5 | 0 | bacchette, spade, stoffa |
| 🧔 Nano | 20 | 3 | 2 | asce, archi, ferro |

- **Il mago porta anche le spade** (il mago guerriero, [abilita-elementi.md](abilita-elementi.md#il-mago-guerriero)): la
  bacchetta resta la sua arma, la spada gli serve per la Lama arcana e vuole forza come per tutti (`secondarie` in
  `dati/eroi.js`: la pagina non pretende che la forza combaci col braccio).
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
- **Un'arma vuole la sua caratteristica** (forza per spade e asce, destrezza
  per gli archi, intelligenza per le bacchette): sotto il requisito non si
  indossa, e l'attacco cresce con quella caratteristica
  ([livelli.md](livelli.md#i-requisiti-delle-armi)). **Ogni pezzo si indossa anche solo dal suo livello** (14 ottobre: sotto si
  compra e si raccoglie, ma sta nello zaino col 🔒): [livelli.md](livelli.md#un-pezzo-si-indossa-dal-suo-livello).
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
- **Le pozioni uguali stanno in una tasca sola** (l'utente, 9 ottobre: sei posti
  sono pochi con tutto quello che cade): «Pozione ×3» è un posto, e così si portano
  più tipi (le cure per la vita, la blu per l'energia), le cure al più otto ([Le pozioni](#le-pozioni)). **Solo le pozioni**
  (`impilabile` in `motore/corredo.js`: cure, energia, l'elisir); ogni altro pezzo, anche
  due spade uguali, ha il suo posto; le torce non vanno in tasca. Lo zaino resta una lista di
  chiavi, una per pezzo: i posti si contano e si mostrano raggruppando (`tascheDello`).
- **Le tasche in più si comprano con le gemme**, dallo zaino (sopra e giù), una alla
  volta: `prezzoTasca` cresce in linea retta (30, 60, 90…), fino a otto in più
  (`TASCHE_EXTRA_MAX`), e restano all'eroe (`crescita.tasche`). La forza non ne dà più (dal 13 ottobre;
  quelle che dava a un salvataggio di prima gli restano, come comprate: [livelli.md](livelli.md#le-quattro-caratteristiche)).
  Nei test: `unita/sotterraneo-zaino`, `[data-azione="piu-posto"]` sullo zaino.
- **Quattro famiglie d'arma in tre gradini, e a parità di gradino e di mani valgono lo
  stesso** — la regola dei due rami del castello: cambia la forma, mai la
  quantità. Le armi a una mano ci sono a ogni gradino per ogni famiglia che le ha: la sciabola, la scure e la mannaia
  si sono aggiunte per le strade con lo scudo ([strade.md](strade.md)).
- **Al dito va l'unica cosa che non picchia**: vedere più lontano, tornare su
  con più gemme, reggere un colpo in più. Ce n'è uno, quindi si sceglie.
- **Nello zaino le caselle stanno intorno alla figura**, con in pugno l'arma
  vera.

## Due mani

- **Le armi leggere si portano due alla volta**; quelle grosse (spadoni,
  asce, archi, bastoni) dichiarano `mani: 2` in `dati/cose.js`.
- **La mano debole colpisce la metà, arrotondata per eccesso**
  (`attaccoMancino`), e **un'arma a due mani vale quella a una mano più la mano
  che ti toglie** (l'utente, 13 ottobre: nel bastone non vedeva vantaggi, e la
  mano libera valeva un punto solo): la difesa dello scudo del suo gradino e
  livello contata come attacco, due a una (`PESO_DELLA_DIFESA` in `dati/cose.js`).
  A una mano 1 · 2 · 3 nei tre gradini, a due mani 3 · 6 · 9 (a livello 1; ogni cinque
  livelli l'arma sale di uno, e a due mani, ogni quindici, di altri due come lo scudo). Misurato col banco, strada per strada
  ([strade.md](strade.md#cosa-insegnano-le-misure)): due mani e scudo pareggiano fra due e tre;
  due leggere valgono meno, la seconda mano vale la metà. Si è toccato l'attacco e non
  il prezzo perché le armi si trovano più di quanto si comprino. `guastiDelleCose` e
  `unita/sotterraneo` tengono fermo il conto, `unita/sotterraneo-strade` a ogni gradino.
  L'attacco di un'arma comune, prima → dopo (`npm run sotterraneo -- --armi --contro <commit>`), a livello 1 · 11 · 31:

  | | una mano | due mani |
  |---|---|---|
  | primo gradino | 1 · 3 · 7 | 2 → **3** · 4 → **5** · 8 → **13** |
  | secondo | 2 · 4 · 8 | 3 → **6** · 5 → **8** · 9 → **16** |
  | terzo | 3 · 5 · 9 | 4 → **9** · 6 → **11** · 10 → **19** |

- **Il bastone** (bacchette a due mani) **ha un potere suo, da mago puro**: l'energia
  delle abilità torna del 50% più in fretta (`ricarica`: ogni risposta giusta a un mostro
  vale 1,5 invece di 1 verso i 2,5 che fanno un punto, `RICARICA_DEL_BASTONE`). Dieci
  risposte giuste: sei punti di energia invece di quattro. Lo dice il pannello del pezzo
  («🔷 +50% ricarica», `ABILITA` in `viste/pezzo.js`) e lo scelgono gli altri solo per
  il peso che gli dà `PESI`. Ce l'ha ogni arma fatta con `arma('bacchette', …, 2)`.
- **I tratti valgono pieni anche a sinistra**: la luce di una lama è la
  stessa copia dell'oggetto.
- **Con un'arma a due mani la casella di sinistra porta la stessa arma in
  ombra e girata**: vuota direbbe che ci si può mettere qualcosa. In scena
  l'arma a due mani sta **di lato, come quella a una mano** (`dati/impugna.js`):
  in mezzo davanti al corpo copriva la faccia (l'utente, 14 ottobre, con l'arco);
  provata la copia sbiadita dall'altro lato: si vedevano due armi.
- **Le figure delle armi guardano tutte nello stesso verso**: in mano
  all'eroe la lama sta in su e l'impugnatura in basso, le armi da tiro con la
  pancia (dell'arco, dell'arco della balestra) a destra, dove guarda l'eroe;
  `arma` in `scena/tela.js` le specchia soltanto quando l'eroe guarda a
  sinistra. Una figura girata male sul foglio si raddrizza **nel foglietto**
  (`specchia` sul pezzo: la balestra), mai con una trasformazione nel codice; e
  un vuoto chiuso (fra l'arco e la corda, l'occhio di una chiave, un anello)
  si toglie col `buchi` del pezzo (`strumenti/sprite/FORMATO.md`). Mazza e
  martello hanno la loro figura: erano il pugnale 0x72.
- **Un arco si tiene al fianco, non davanti alla faccia** (l'utente, 14 ottobre: la balestra era «tenuta male»): `dati/impugna.js` dice
  dove sta ogni arma in mano, una volta per il campo (`scena/tela.js`) e per il ritratto (`viste/Armato.vue`). Gli archi stanno in piedi
  accanto al corpo, con la corda appena fuori dal viso e il centro all'altezza della mano; l'arco corto è alto 17 pixel sui 28
  dell'eroe, il lungo 24 (la `misura` nel foglietto). La balestra (`tiene: 'orizzontale'`) è girata nel foglietto, piccola (12×10) e
  bassa, davanti al petto: più su copre gli occhi, e l'eroe è quasi tutta testa. La spada e il resto non sono cambiati. Lo scontro non
  disegna l'arma dell'eroe. La tavola per giudicarlo: `node strumenti/sotterraneo-armi.mjs`; il test `unita/sotterraneo-impugna`.
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
- **Il forziere veste il posto** (una regola sola): legno e ferro nelle cantine (quattro disegni), pietra e ferro freddo nella cripta (tre,
  fra cui `cripta-forziere`), ferro e brace nella fornace (due), uno a caso dal numero che il piano gli dà (`pelle`, un numero: lo scenario
  sceglie il disegno, come i relitti). **Non dice cosa c'è dentro**: una pelle che promettesse la rarità mentirebbe una volta su due (il forziere dà
  un pezzo uno scontro su tre, se no una pozione o una torcia). **Il forziere d'oro è solo quello di una missione**
  ([missioni-bersaglio.md](missioni-bersaglio.md)); aperto, tutti diventano lo stesso forziere pixel (`forziere-aperto`).
- **Le gemme per terra dicono quanto valgono dal colore**: sotto sei la moneta che gira; da sei in su una gemma, blu (6–11), verde (12–23), viola
  (24–47), rossa (48 e più) (`SOGLIE_DELLE_GEMME`, `dati/tessere.js`). Il numero cresce con la discesa e col livello (`valoreDelLivello`), quindi in fondo sono
  quasi tutte rosse. Le due pozioni dipinte che non facevano niente (`pozione-nera`, `pozione-viola`: la viola è il doppione dell'Ampolla, e di
  stati da curare l'eroe non ne ha) sono state tolte.

## Le pozioni

Cinque cure, ognuna con la sua cura e il suo prezzo **fissi**: non crescono col livello (l'utente, 14 ottobre: «già 18 è una cura ridicola
se ho 50 vite»; si aggiungono stadi più grandi man mano che l'eroe sale) e a ogni stadio costa di più ogni punto di vita, così la grande
non è mai la più conveniente (`guastiDelleCose`). Le chiavi `pozione-piccola`, `pozione`, `pozione-grande` sono rimaste (id di salvataggio).

| | cura | prezzo, a livello 1 · 6 · 12 · 20 | gemme per punto | sul banco della guaritrice | vita dell'eroe atteso lì |
|---|---|---|---|---|---|
| 🧪 Boccetta | 8 | 8 | 1,0 | da subito | 13–20 |
| 🧪 Pozione | 14 | 21 | 1,5 | dopo 1 discesa finita | 22–30 |
| 🍷 Ampolla | 30 | 75 | 2,5 | dopo 3 | 44–56 |
| 🍷 Ampolla maggiore | 50 | 200 | 4,0 | dopo 5 | 53–66 |
| 🍷 Ampolla della vita | tutta la vita | non si compra (rivenduta 60) | — | mai: si trova | — |

Il resto (il rapporto fra una spada e le pozioni, quando arrivano le grandi, l'ampolla della vita, il tetto di otto, la scelta di quale bere, il
giocatore finto): [pozioni.md](pozioni.md).

## La torcia si accende da sé, e finisce

- **Accenderla non è una scelta**: si accende appena presa e non entra nello
  zaino. Brucia sulla corsa (`corsa.torciaResta`), e le altre aspettano alla
  cintura (`corsa.torceInScorta`) e si accendono da sé. **La scorta non ha
  tetto**: provata la torcia per tutta la discesa, e ogni altra torcia
  diventava roba da rifiutare.
- **Dura dodici stanze** (`STANZE_TORCIA`). **L'unità è la stanza, non il
  tempo** (e nemmeno i passi dell'orologio del gioco, [orologio.md](orologio.md)): sotto una domanda l'orologio è fermo, e un conto che scorre farebbe
  pagare la luce a chi legge piano. Scendere e risvegliarsi non consumano.
  Dodici è misurato: chi tocca tutto entra in 34 stanze nel pozzo, 36 nella
  grotta, 45 nella scala sommersa, 44 nella miniera, 83 nella botola — undici o
  dodici per piano. Una torcia vale un piano.
- **Costa 5 gemme**, appena sotto la boccetta: un piano di luce è una
  comodità, non la sopravvivenza. Il prezzo è l'unica scala su cui sta tutto
  il catalogo.
- **Cosa fa vedere la torcia**: allunga il cono di luce davanti all'eroe
  (6,2 celle contro 3,2) e allarga l'alone attorno; la stanza non si accende
  tutta e dietro c'è sempre ombra; all'ultima stanza il cono si accorcia
  ([luce.md](luce.md)).
- **Quanta ne resta si vede** nella scena (il buio che si stringe), nello
  zaino per esteso («ancora 7 stanze, e 1 alla cintura»), e agli sgoccioli,
  solo senza scorta, una riga in mezzo al campo («Torcia sta per finire:
  ancora due stanze»). Senza, il buio arriverebbe come un guasto. Nella
  barra in basso non c'è più: il globo di destra è l'esperienza
  ([barra.md](barra.md)).
- **I pezzi ⏳ allungano la torcia**: una torcia nuova dura le sue dodici
  stanze più quelle dei pezzi (`stanzeTorcia`).
- Una sosta vecchia con `torcia: true` si riprende con una torcia piena.
- **Comprata sopra aspetta alla cintura**, e scendendo se ne accende una:
  sopra non c'è buio da rischiarare.

## I mercanti e la bottega

Le quattro botteghe della terra di sopra (il fabbro lavora il ferro, l'incantatrice la magia), cosa vendono, i pezzi avanti a
sovrapprezzo, il banco che cambia a ogni giro ([bottega.md](bottega.md)), la finestra
da gioco di ruolo con le caselle e il confronto affiancato, lo zaino nella stessa
finestra: [bottega-finestra.md](bottega-finestra.md). La
roba con livello e rarità: [rarita.md](rarita.md).

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
- **Una o due per piano, a ogni misura** (anche nell'abisso e nelle zone: il
  piano è sempre `generaPiano`). Erano due o tre, tre o quattro sui piani
  grandi; il 12/10/2026: «non ne metterei troppe, lasciamo che si divertano
  di più a combattere». Non sono un pedaggio: si passa oltre.

## L'arredo dice che non si tocca

Barili, casse, ossa, lanterne: arredo, **disegnato più spento** delle cose
che rispondono, che sono disegnate come sono, senza contorno. Provato un
filo di luce dorato intorno a quello che si tocca: sfasava la figura, e lo
spento dell'arredo basta già. Toccandolo si ottiene una riga — la prima
volta la regola («questo non si tocca: è arredamento, per questo è più
spento»), poi una battuta. Una cosa che non fa niente e non dice niente si
legge come rotta; una stanza senza arredo è vuota, che è il difetto opposto.
