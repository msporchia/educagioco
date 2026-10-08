# I mercanti e la bottega

Le tre botteghe sulla terra di sopra, cosa portano, i pezzi delle righe dopo
a sovrapprezzo, la finestra da gioco di ruolo dove si compra e si vende, e
lo zaino nella stessa finestra. Divisa da [roba.md](roba.md) quando ha
passato le 250 righe. I banchi sono a tono col livello dell'eroe
([rarita.md](rarita.md#i-mercanti-a-tono)). Il codice: `dati/mercanti.js`,
`motore/bottega.js`, `motore/storia.js` (`bancoDelPasso`, `vetrinaDelPasso`),
`viste/Bottega.vue`, `viste/Zaino.vue` e i pezzi comuni.

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
- **Quello che non alza niente non si mostra** (`siMostra` e `sottoAddosso`
  in `motore/bottega.js`), **nemmeno fra i pezzi avanti**: resta pescato ma
  non si vede. Una seconda arma leggera con la mano libera alza il braccio, e
  quindi si vede. Regola dell'utente, 8 ottobre: lo scettro accanto al
  bastone magico (⚔️ 3 tutti e due, e più caro perché avanti) «non sembra
  molto interessante»; contano livello, rarità e abilità.
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
  parare). Nessuna batte lo spadone sul suo terreno. Sono basi come le altre:
  possono uscire magiche o rare, e allora hanno anche le loro abilità.
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
  bordo e l'aura dicono la rarità, coi colori di Diablo: bianco comune, blu
  magico, giallo raro, arancio-oro leggendario ([rarita.md](rarita.md)).
  Provato prima: il bordo diceva il gradino letto dal prezzo (grigio,
  azzurro, oro, arancio le quattro armi col nome); con la rarità i colori
  sono suoi.
- **Un tocco sceglie, il secondo compra** (o il tasto «Compra 💎 N»): il dito
  sbaglia, e un acquisto al primo tocco non si disfa. Un secondo tocco entro
  400 ms (`RIPENSO`) è un dito che ha premuto due volte, e non compra.
- **Il pannello dice numeri, non frasi**: «⚔️ +4 attacco», «❤️ +6 vita». Un
  pezzo che si indossa non ha più la riga sola «⚔️ 3 → 5», che bastava finché
  un pezzo era solo attacco e non regge con più abilità: ha **il confronto
  affiancato**, come in Diablo (`viste/Confronto.vue`).
  - **Due cartellini affiancati, come in Diablo**: «Addosso» (il pezzo, o i
    due pezzi, che occupano lo stesso posto; «niente» se il posto è vuoto,
    «mano libera» se un'arma va nella mano debole) e «Questo» (il pezzo
    guardato). Ognuno col disegno piccolo, il nome del colore della sua
    rarità, che cos'è, il livello e la rarità, e sotto i suoi numeri e le sue
    abilità («⚔️ +4 attacco», «🌀 9% schivata»). **Provato: una tabella riga
    per riga** (attacco|attacco, difesa|difesa, con ▲▼ e la sintesi «meglio in
    2, peggio in 1»): con le abilità due pezzi con effetti diversi non si
    confrontavano più, e l'utente ha chiesto i cartellini.
  - **Sopra, una riga sola: il netto se lo metti** («SE LO METTI ⚔️ +2 🛡️ −1
    ❤️ −3»), verde dove sale e rosso dove scende; senza cambi, «se lo metti,
    non cambia niente».
  - **Una mano o due si dice chiaro quando cambiano**: «A due mani: lo scudo
    borchiato torna nello zaino» (e la sua difesa si perde nel netto), «A una
    mano: l'altra mano resta libera per uno scudo».
  - **Il posto giusto**: un anello si confronta col gioiello che hai; un pezzo a
    due mani con arma **e** scudo insieme; un'arma nella mano debole vale
    metà braccio, e lo dice il numero. Un pezzo che l'eroe non porta, o che
    lo scudo non può affiancare a un'arma a due mani, non ha confronto: il
    pannello dice il perché.
  - **I numeri li dà il motore** (`seLoMetto().cambio` in `motore/corredo.js`):
    `toglie` sono i pezzi mandati via, `vecchi` e `nuovi` quanto danno le
    caselle toccate, con le altre a fare da base. Le parole, le icone e come
    si scrive il valore stanno in `ABILITA` di `viste/pezzo.js`. **Per
    aggiungere un'abilità**: [rarita.md](rarita.md#le-abilità). A 390 px i due
    cartellini stanno, col testo piccolo ma leggibile.
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
`[data-casella-pezzo="<cosa>"]` (con `data-posso`, `data-rarita` e
`data-avanti`: le righe avanti, dove il prezzo è alto), `[data-vendo="<cosa>"]`, `[data-pannello]` (con
`data-cosa`), `[data-confronto="att|dif|vita|gemme|luce"]` (con
`data-verso`: il netto sull'eroe, dentro `[data-confronto-tutto]`), `[data-affianca]`,
`[data-colonna="addosso|questo"]` (i cartellini; dentro, `[data-pezzo="<cosa>"]` o
`[data-niente]`, e i numeri `[data-valore="<campo>-addosso|<campo>-questo"]` col
valore in `data-n`), `[data-due-mani]`, `[data-storia]`,
`[data-avanti-costa]`, `[data-non-puoi]`, `[data-azione="compra"]`,
`[data-azione="vendi"]`, `[data-detto-banco]`, `[data-battuta]`,
`[data-chi-compra]`, `[data-banco-vuoto]`, `[data-tasche-vuote]`,
`[data-gemme-bottega]`; nello zaino `[data-zaino]`, `[data-tasca]` (con
`data-cosa`), `[data-azione="usa|butta|riponi|chiudi"]`, `[data-torcia-zaino]`;
in tutte e due `[data-casella="<dove>"]` (con `data-cosa`) e `[data-chiudi]`.
`compraNellaBottega`, `vendiNellaBottega` e `allaLinguettaDi` in
`test/aiuto/browser.mjs`; `unita/sotterraneo-roba` (i numeri del confronto abilità per abilità, la
sovrapprezzo dei pezzi avanti, nessun pezzo di famiglie non portate, il banco mai vuoto, quello che non si
mostra, le linguette),
`integrazione/sotterraneo-mercanti` (col dito: si sceglie, si compra, si
vende, il confronto affiancato, lo zaino che indossa e fa bere),
`integrazione/sotterraneo-confronto` (più abilità: lo spadone contro spada e
scudo, le colonne a 390 px),
`integrazione/sotterraneo-bottega-avanti` (lo scettro una riga avanti: si compra al doppio, e il mago non vede
roba che non porta), `misure/sotterraneo` (chi spende avanti nelle ultime due discese).
