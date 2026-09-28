# I livelli della fattoria

Da dove viene l'esperienza, come sono fatte le soglie, cosa arriva quando
e come si prende. Il codice è `dati/livelli.js` e `viste/Livelli.vue`.

## L'esperienza

- **Le monete spese qui dentro**, più **le consegne** (banco, botteghe,
  mongolfiera) e **le bestie di casa rimesse a posto**. Non i raccolti, non
  i minuti, non le partite. Spendere è il gesto che tiene in piedi tutto,
  e le monete vengono solo dagli esercizi: il livello è tempo di studio
  riletto. Le consegne ne sono la seconda sorgente perché un mercato che
  non paga niente non è un mercato; si sommano, e il livello resta tempo.
- **Non scende mai**, nemmeno mettendo via quello che si è comprato.
- **Serve a non vendere duecento cose dal primo minuto**: in undici
  linguette, il campo che fa partire la catena stava in mezzo a novanta
  cespugli.

## Le soglie

- **Il passo è una formula, non una tabella**:
  `1,25 · (8·(n-1)² + 200·(n-1))` (`SOGLIA_A`, `SOGLIA_B`, `ALLUNGA`),
  così i livelli non finiscono mai: chi ha giocato per mesi ha ancora un
  gradino davanti.
- **Il passo minimo sta sopra tutta l'attrezzatura di partenza** (campo e
  silo 🪙142): con un passo piccolo bastavano loro a far scattare tre
  livelli. Il livello 2 chiede un secondo campo e qualche giro di semina e
  raccolto: **il tempo di capire come gira**.
- **La roba di un livello non paga il livello dopo.** Ogni salto è il passo
  di sempre più quello che costa comprare **una volta** la roba produttiva
  che quel livello apre, bestie comprese e decorazioni escluse
  (`costoDelLivello`). Provato senza: si costruiva quello che era appena
  arrivato ed eri già al livello dopo — un bersaglio che si sposta mentre
  lo si insegue, e schermate piene di cose mai usate. Il resto del salto
  si fa giocando.
- **Una fattoria col metro vecchio si riapre al livello che aveva**
  (`soglie` nel salvataggio, `livelloVecchioPer`, `SOGLIE_ORA`).
- In esercizi, contando solo la spesa (🪙6 al minuto): il livello 2 sono
  45 minuti, il 10 undici ore, il 30 cinquantasei, l'ultimo duecento.
  Le consegne ne fanno una parte, quindi il tempo vero è meno, spalmato su
  mesi.
- **Nessun tappo** («per salire devi aver provato le ricette nuove»): chi
  accumula monete e le spende tutte insieme salta avanti, ed è una scelta
  sua.

## Cosa arriva quando

- **Ogni livello dà poco**: una cosa che lavora quando la catena lo
  permette, e due o tre decorazioni (`DECORI_PER_LIVELLO`) in una fila
  sola **ordinata per prezzo** — il vaso da quattro monete al secondo
  livello, la casa sull'albero dopo mesi. Una voce nuova si infila dove la
  mette il suo prezzo, senza elenchi a mano. Le linguette del baule si
  aprono da sé con la loro prima voce.
- **Una cosa produttiva per livello, non tre ogni tanto.** Un livello che
  dà tre cose da costruire si paga da sé, e uno che ne porta una è più
  divertente di un regalo enorme ogni tanto. Lo permette il fatto che una
  coltura può arrivare prima della bocca, perché la chiede il banco (sceso
  al livello 2 apposta). Restano insieme solo le coppie che la catena lega
  davvero: il mulino col silo della stalla, il telaio con la dispensa.
- **Cosa arriva lo dicono le cose stesse** (`liv` su voce, coltura,
  animale, ricetta, linguetta): `roba(liv)` lo raccoglie girando le tabelle
  vere. Un elenco scritto due volte si scosta.
- **I nomi dei livelli stanno sulla cosa, non sul numero** (`NOMI` in
  `dati/livelli.js`, e `nomeDi`): a ogni spostamento sarebbe toccato
  riscriverli tutti. L'ordine di `NOMI` è la precedenza quando due cose
  arrivano insieme; le ricette contano («La pizza»).
- **Fra due cose che lavorano non passano più di cinque o sei livelli**
  fino alla fine del catalogo: senza, chi ha imparato la catena riceve
  solo decorazioni e il gioco smette di insegnare (è il buco che le
  botteghe e la mongolfiera grande sono venute a chiudere).

Le cose che lavorano, livello per livello (rifatta dal codice con `roba` e
`sogliaDi`; se diverge, vince il codice):

```
  1  ⭐0      campo, silo del raccolto, grano      30  ⭐19382   barbabietola
  2  ⭐260    mercato                              31  ⭐20222   zuccherificio
  3  ⭐580    bobtail                              33  ⭐22192   pomodori (zuppa d'orto)
  4  ⭐970    mulino, silo della stalla            34  ⭐23092   gelateria
  5  ⭐1560   carote                               35  ⭐24252   gatto rosso
  6  ⭐1900   fienile                              36  ⭐25267   mensa
  7  ⭐2410   conigliera                           37  ⭐26427   pastificio · 38 biscotti
  8  ⭐2885   carretto del vicino                  39  ⭐28667   melanzane, peperoni
  9  ⭐3317   pollaio                              40  ⭐29687   capre
 10  ⭐3867   gatto bianco e nero                  42  ⭐32067   sartoria
 11  ⭐4382   mais                                 43  ⭐33397   merceria
 12  ⭐4842   coniglio                             44  ⭐34737   cipolle, aglio
 13  ⭐5407   erba medica                          45  ⭐35857   arnie · 46 pizza
 14  ⭐5907   ovile                                47  ⭐38457   alpaca · 48 lasagne, sciarpa
 15  ⭐6617   beagle                               49  ⭐41167   pappagallo
 16  ⭐7247   dispensa, telaio                     50  ⭐42507   fragole · 51 marmellata
 17  ⭐8097   panificio                            52  ⭐45007   asini · 53 frullato
 18  ⭐8857   stalla                               54  ⭐47942   lavanda
 19  ⭐9677   gatto nero                           55  ⭐49262   tintoria · 56 berretto
 20  ⭐10372  caseificio                           57  ⭐52262   peschiera
 21  ⭐11212  pasticceria                          58  ⭐54002   friggitoria
 22  ⭐12052  patate, cavolfiori                   60  ⭐57122   riso · 61 arancini
 23  ⭐12732  pentolone                            62  ⭐60022   sushi bar · 63 maki
 24  ⭐13582  stagno delle anatre                  66           la mongolfiera grande
 25  ⭐14542  cucina                               69  ⭐71142   l'ultima cosa del catalogo
 26  ⭐15492  mongolfiera
 27  ⭐16502  zucche                               (~200 ore di esercizi, contando solo la spesa)
 28  ⭐17282  porcile
 29  ⭐18342  osteria
```

## I premi si vanno a prendere

- **Il livello apre, il bambino prende.** Quello che arriva a un livello si
  preme nella pagina dei livelli, e da lì sta nel baule. **Prendere non
  regala niente**: apre la voce, che si compra con le monete come tutto il
  resto. Provato l'arrivo da solo: il livello sale spendendo, cioè sempre
  in mezzo a un acquisto, e il foglio della festa spezzava il gesto dal
  baule al prato; e un premio che compare è una riga di elenco, uno che si
  preme è una cosa che ci si va a prendere.
- **Salire passa una riga d'avviso** e accende sul gettone ⭐ **un pallino
  che dice quanti premi aspettano**, finché non sono presi tutti.
- **La pagina mostra due livelli**: quello di adesso a quadratini (presi
  con la spunta, da prendere accesi e pulsanti) e quello dopo in grigio col
  lucchetto, con quanto manca. Provata la scaletta intera di tredici
  righe: nomi di cose mai viste, e in mezzo l'unica riga su cui si poteva
  fare qualcosa.
- La chiave di un premio è **tipo più id** (`chiaveDi`): una coltura e una
  voce possono chiamarsi uguale. Chi arriva da una fattoria senza premi
  trova già preso quello che il suo livello aveva aperto: il contrario
  sarebbe la propria roba tolta e restituita a rate.
- Le voci delle feste e della fiera non sono premi di livello: arrivano con
  la stagione e con la mongolfiera.
- La regola sta nel motore: `posa()`, `compra()`, `seminaCampo()` e
  `compraBestia()` rifiutano quello che non è arrivato (`'non-sbloccato'`)
  o il doppione di un silo (`'ne-hai-gia'`).

## Guardare un livello alto senza giocarlo

- **`#fattoria=40`** nell'indirizzo alza la fattoria a quel livello, e non
  la fa mai scendere. I premi dei livelli passati li prende da sé e lascia
  da prendere quelli del livello a cui porta: la situazione esatta di chi
  ci è arrivato spendendo.
- **`#fattoria-tipo=30`** mette al posto della fattoria del bambino attivo
  una **già giocata** di quel livello, costruita col motore
  (`motore/tipo.js`) come la farebbe chi gioca con ordine — il giardino in
  cima, campi e silos, macchine, recinti, il paese in fondo, una cella
  d'erba attorno a tutto — e già in moto: campi a metà e pronti, macchine
  con qualcosa da ritirare, silos pieni, clienti al banco e in bottega, la
  mongolfiera a terra. Porta dritto dentro la fattoria e si somma alle
  monete (`#fattoria-tipo=30&monete=2000`). **Il profilo di prima va nel
  cestino** («Cancellati di recente»), ma sul server di casa la fattoria
  che si butta è quella vera: si usa con un bambino di prova.
- Tutti e due stanno nella pagina `#admin`, con `#stagione=`
  ([stagioni.md](stagioni.md)). Prove:
  `unita/fattoria-tipo` (la fattoria sta in piedi a ogni livello) e
  `integrazione/fattoria-tipo` (la strada dall'indirizzo).
