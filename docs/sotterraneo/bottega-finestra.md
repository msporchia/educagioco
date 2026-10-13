# La finestra della bottega e lo zaino

La finestra da gioco di ruolo dove si compra, si vende e si riprende, e lo zaino
nella stessa finestra. I mercanti, cosa vendono e come cambia il banco:
[bottega.md](bottega.md). Il codice: `viste/Bottega.vue`, `viste/Zaino.vue`,
coi pezzi comuni `Cornice.vue`, `Addosso.vue`, `Casella.vue`, `Pannello.vue`,
`Confronto.vue` e `pezzo.js`.

## La bottega e lo zaino

- **Una finestra da gioco di ruolo stretta in un telefono**: legno scuro e
  bordo d'oro con quattro angoli, disegnati in CSS e SVG. Dall'alto il
  mercante (ritratto e nome), l'eroe armato con le quattro caselle intorno e
  i numeri accanto (vita, braccio, difesa e le gemme, sempre in vista), le
  linguette, la griglia, il pannello. Scorre solo la griglia. Provato: un
  elenco di voci col bordino, sembrava un modulo da compilare.
- **Le linguette sono del mercante** (`schede` in `dati/mercanti.js`):
  l'armaiolo «Armi» e «Scudi e armature», l'erborista «Pozioni» e «Torce»,
  il rigattiere «Gioielli», «Vendi» e «Riacquista». «Vendi» e «Riacquista» le ha
  solo chi compra; gli altri lo dicono con una battuta. `guastiDeiMercanti` pretende che ogni
  cosa del banco stia sotto una linguetta.
- **Caselle grandi, tre per riga**, col pezzo disegnato e il prezzo sotto (dieci
  pezzi sono quattro righe: scorre solo la griglia, a 390 px regge). **Cosa è
  meglio di quello che hai addosso si vede a colpo d'occhio**: in alto a sinistra
  una ▲ verde col numero di quanto alza il braccio o la difesa del posto («▲ +3»),
  e per i pezzi da sogno una ★ d'oro (`Casella.vue`, `data-sale`, `data-ruolo`).
  Un pezzo che la classe porta ma di cui manca la caratteristica ha il 🔒 e il
  pannello dice cosa manca; si compra lo stesso e va nello zaino, e il confronto col
  pezzo che hai addosso c'è lo stesso (`seLoMetto(k, { ancora: true })`, con
  `ancora: true` nel risultato). **Una casella che non puoi permetterti, o non ancora,
  si vede piena**, senza trasparenza né grigio (l'utente, 13 ottobre: «non è utile
  ormai»): il perché lo dicono il prezzo in rosso, il 🔒 o la ✋ e il pannello;
  `sot-spenta` resta solo come classe per i test e il cursore. Lo zaino uguale. Il
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
  La casella dell'eroe dove andrebbe si accende. Sotto, solo quello che non
  si vede già: il perché di chi non lo porta (solo nello zaino: la bottega
  non lo offre) e lo scudo che non si imbraccia con un'arma a due mani in
  pugno. Niente «Finisce nello zaino», «Costa di più», «Ne hai 2»: lo dicono
  il confronto, il cartellino e la casella ([dialoghi.md](dialoghi.md#le-scritte)).
- **«Riacquista»** (solo il rigattiere): le ultime cose che l'eroe gli ha venduto,
  la più recente per prima, con le stesse caselle, il prezzo a cui le ha pagate e lo
  stesso pannello col confronto; un tocco sceglie, il secondo (o il tasto «Riacquista
  💎 N») riprende. La scelta si azzera dopo ogni ripresa: i posti dell'elenco
  scalano. Vuota, parla il mercante: «Da parte non ho niente. Se mi vendi
  qualcosa, lo trovi qui.»; la sua battuta, a linguetta aperta: «Le tue cose le tengo
  da parte. Le rivuoi? Allo stesso prezzo.» Niente istruzioni ovvie
  ([dialoghi.md](dialoghi.md#le-scritte)).
- **Si arriva al banco parlando**: toccando il mercante l'eroe ci va e si
  apre il dialogo; la prima domanda («Fammi vedere le armi», «Mi servono pozioni», «Fammi vedere») apre il banco, «Ho roba da vendere» (solo
  il mercante, chiave `rigattiere`) lo apre sulla linguetta delle tasche
  ([dialoghi.md](dialoghi.md)).
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
`[data-non-puoi]`, `[data-azione="compra"]`,
`[data-azione="vendi"]`, `[data-scheda="riacquista"]` con `[data-riacquisto="<cosa>"]`
(`data-posso`) e `[data-azione="riacquista"]`, `[data-riacquisto-vuoto]`, `[data-serve]`
(la nota 🔒 di un pezzo non ancora reggibile), `[data-detto-banco]`, `[data-battuta]`,
`[data-chi-compra]`, `[data-tasche-vuote]`,
`[data-gemme-bottega]`; sulla casella `[data-sale]` (▲ o ★ col numero) e `data-ruolo="salto|sogno"`; nello zaino `[data-zaino]`, `[data-tasca]` (con
`data-cosa`), `[data-azione="usa|butta|riponi|chiudi"]`, `[data-torcia-zaino]`,
`[data-ancora-no]` (la nota 🔒 di un pezzo che l'eroe porta ma non regge ancora; la ✋ `[data-non-puoi]` è per quello che la classe non porta);
in tutte e due `[data-casella="<dove>"]` (con `data-cosa`) e `[data-chiudi]`.
`compraNellaBottega`, `vendiNellaBottega`, `riacquistaNellaBottega` e `allaLinguettaDi` in
`test/aiuto/browser.mjs`; `unita/sotterraneo-roba` (i numeri del confronto abilità per abilità; quello che
non si mostra, le linguette; il resto, i banchi, sta in [bottega.md](bottega.md)),
`integrazione/sotterraneo-mercanti` (col dito: si sceglie, si compra, si
vende, la linguetta «Riacquista», il confronto affiancato, lo zaino che indossa e fa bere),
`integrazione/sotterraneo-riacquisto` (sei venduti e ne restano cinque, si riprende
allo stesso prezzo, l'elenco sopravvive, a 390 px dieci caselle e tre linguette stanno),
`integrazione/sotterraneo-confronto` (più abilità: lo spadone contro spada e
scudo, le colonne a 390 px),
`integrazione/sotterraneo-bottega-avanti` (lo scettro una riga avanti: si compra al doppio, e il mago non vede
roba che non porta), `misure/sotterraneo` (chi spende avanti nelle ultime due discese).
