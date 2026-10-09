# I dialoghi, e le scritte del gioco

Chi sta fermo sulla terra di sopra si **parla**: il vecchio minatore, i sei
che danno le missioni, i tre mercanti. Prima c'era un fumetto con tutto
dentro e i tasti sotto; l'utente, l'8 ottobre 2026: *«dà un tocco di… sto
controllando il gioco invece di seguirlo»*. Il dialogo fa seguire: chi parla
ha una faccia, dice una cosa alla volta, e le domande da fargli portano alle
stesse azioni di prima. Nello stesso giro le scritte del sotterraneo si sono
asciugate (sotto, «Le scritte») e i nomi difficili sono cambiati («I nomi»).

Il codice: `dati/dialoghi.js` (cosa dice ognuno, per punto della storia),
`motore/dialoghi.js` (le pagine di apertura, le domande, le risposte; gira in
Node), `viste/Dialogo.vue` (il riquadro), `viste/Terra.vue` (`parla`,
`scegli`: chi apre il dialogo e cosa fa ogni scelta), `viste/Ritratto.vue`.

## Com'è fatto

- **In fondo alla mappa**: legno scuro e
  oro come la bottega, il ritratto nel tondo d'oro, il nome, il testo. Sta
  nella fascia in basso che la vista già misura, quindi l'eroe e chi gli
  parla restano visibili sopra. Niente velo: la mappa resta lì.
- **Il testo è a pagine, non scorre**: una o due frasi per pagina (`inPagine`
  spezza le frasi lunghe, al più due frasi e ~120 caratteri), un tocco sul
  testo va avanti, il triangolo d'oro che dondola dice che c'è un'altra
  pagina. Il riquadro del testo è alto sempre uguale: le pagine non ballano.
- **Alla fine le domande**, una sotto l'altra, in quest'ordine: quello che si
  fa per le missioni (consegnare, «Ci penso io» col premio accanto), la sua
  cosa (la bottega, «Dove vado adesso?» del minatore), la storia, e
  **Arrivederci**, sempre ultima. Una risposta riparte dalla prima pagina, e
  la domanda appena fatta non torna nello stesso dialogo.
- **Un tocco altrove chiude**, e fa la sua cosa
  ([../core/interfaccia.md](../core/interfaccia.md#un-tocco-altrove-chiude)):
  il prato fa camminare, un altro personaggio apre il suo dialogo. Niente ✕:
  il dialogo non è un foglio, è un fumetto con più spazio, e «Arrivederci» è
  già la porta. Le scelte che costano (scendere con una discesa a metà,
  lasciar perdere) restano modali come prima: il dialogo non ne ha.
- **Il dito**: aprendo, il riquadro è cieco per 320 ms, e le domande lo sono
  per altri 320 ms da quando compaiono (il tocco che ha girato l'ultima
  pagina, ripetuto d'impazienza, cadrebbe su una scelta). Due tocchi più
  svelti di 180 ms non saltano una pagina senza leggerla.

## Cosa si dice

- **Le missioni prima di tutto**: tornando a cosa fatta lui se ne accorge (la
  frase `ritorno` di ogni missione: «Sento un tintinnio. Sono le chiavi della
  torre?») e la prima domanda è consegnarla; un favore nuovo è la sua
  richiesta, a pagine; uno preso e non fatto lo ricorda con le parole del
  posto («… è ancora laggiù: la torre in rovina, al secondo piano»).
- **Consegnando** dice il grazie, poi una pagina sua col premio («ricevi»,
  le monete quelle pagate davvero: il salvadanaio può tenerne), e se adesso
  ha un altro favore lo chiede subito (la collana porta a Grattanaso). Tasche
  piene: «Fai posto, e torna da me». Prendendo ringrazia con la sua frase
  (`presa`). Non c'è più la riga in fondo «Missione presa»: la dice lui.
- **Il minatore dice sempre la strada**: la prima volta si presenta (due
  pagine: chi è, e che sotto il villaggio qualcosa si è svegliato), poi
  apre con la prossima discesa e come ci si arriva, chi è sotto il livello
  ([la-grande-storia.md](la-grande-storia.md#chi-e-sotto-il-livello-lo-sa-prima-di-scendere)),
  chi ti cerca al villaggio, una pagina per chi. «Dove vado adesso?» torna fra
  le domande dopo un'altra domanda. È il «cosa faccio adesso» per chi gioca
  di rado: lo dice il mondo, non un manuale.
- **La storia cambia andando avanti**: ognuno ha la sua domanda («Cosa si
  dice al pozzo?», «Chi dorme sotto l'altare?») e qualche racconto, ognuno
  valido da un certo numero di discese finite (`da`); vale l'ultimo. Il
  minatore racconta del mostro grosso che aspetta in fondo alla prossima
  discesa, col suo nome e la sua riga ([grossi.md](grossi.md)): chi scende
  sa chi incontrerà. I racconti si tengono legati alle missioni e ai grossi
  (la ragazza manda dal frate, la guardia parla di Fiammetta prima della
  torre): parlare con tutti è un modo di sapere dove andare.
- **I mercanti** salutano con la loro battuta (la stessa del banco) e la
  prima domanda apre la bottega; il mercante ha anche «Ho roba da vendere»,
  che la apre sulla linguetta delle tasche. **Non dicono mai «non ho niente
  per te»**: il banco di chi veste ha sempre qualcosa che migliora
  ([bottega.md](bottega.md)), e una linguetta vuota dice «… niente alla tua
  altezza. Guarda l'altro». Tengono il bambino sperando.
- **Il tono è quello di Diablo, non di una favola buffa**: frasi brevi,
  serie, che mostrano invece di spiegare («Il lucchetto non cede: riprova»,
  non «Per aprire devi rispondere giusto»). Chi parla dice cose del suo
  mondo, mai del gioco (niente «tocca», «tasto», «livello» in bocca a un
  personaggio).

## Le scritte

**Resta solo ciò che non si vede, o che dice cosa fare.** Quello che il
bambino vede da sé (la porta che si apre, il pezzo che va nello zaino, il
prezzo più alto sul cartellino, il forziere che si apre, il piano nuovo che
il piede in basso già dice) non si scrive: toglie spazio e toglie epica.
L'utente, l'8 ottobre: *«a volte non servono, occupano spazio e tolgono
all'epicità»*. Tolti, nel giro dell'8 ottobre: «Costa di più: è roba per
più giù», «Finisce nello zaino», «Ne hai 2», «Ce l'hai addosso», «Te lo pago
la metà» (lo dice il tasto), «🚪 la porta si apre», «🎁 si apre!», «piano
2», «✨ livello 3! un punto da dare» (lo dice la festa), «👑 Re Ossuto è
caduto!», «🏃 scappi — ti graffia» (lo diceva già il tasto), «… per terra»,
«… nello zaino», l'arma messa dallo zaino, «Hai trovato l'erborista!»,
«Missione presa», «Missione compiuta! 🪙 2» (lo dice il dialogo).

Restano, con la voce del gioco: cosa manca per aprire (la scala chiusa, la
discesa sbarrata), una regola che a schermo non si vede (il forziere che
sbagliato non si apre più, quello della missione che si riprova, la torcia
che si spegne o sta per finire, le tasche svuotate svenendo), cosa fare
dopo («👑 … non si rialza più. Torna su a dirlo», «🗝️ La chiave! Ora la
scala si apre»), i numeri che non si leggono altrove (le gemme raccolte, la
vita bevuta, «⚔️ +2» del pezzo indossato) e il nome di un pezzo trovato, col
colore della sua rarità. Le dritte delle discese parlano del posto («due
piani di tombe, e qualcuno che non dorme»), non di come si gioca.

## I nomi

Parole che un bambino conosce: «Badessa» è stata bocciata dall'utente
(*«è italiano? che vuol dire?»*). Cambiano solo i nomi sullo schermo; le
chiavi restano (sono nei salvataggi e negli sprite).

| chiave | prima | adesso |
|---|---|---|
| `badessa` (missione) | la Badessa Grigia | la Dama Grigia |
| `eremita` | l'eremita | il frate (dell'altare) |
| `armaiolo` | l'armaiolo | il fabbro |
| `erborista` | l'erborista | la guaritrice |
| `rigattiere` | il rigattiere | il mercante |
| `panciotto` · `saio` · `manto` | panciotto · saio · manto | giubba di cuoio · tunica · mantello |
| `verga` · `bipenne` | verga · bipenne | bacchetta · ascia doppia |

Nei documenti i personaggi e i pezzi si chiamano ancora con la chiave.

## Provato e scartato

- **Il fumetto coi tasti** (fino all'8 ottobre): tutto insieme, richiesta,
  premio e «ci penso io». Funzionava, ma si leggeva come un pannello di
  controllo.
- **La bottega che si apre toccando il mercante**, senza parlare: un tocco
  in meno, ma l'unico personaggio muto del villaggio. Il dialogo del
  mercante è di una pagina sola, con la bottega come prima domanda.

Nei test: `[data-dialogo="<chi>"]` (con `data-pagina`, `data-pagine`,
`data-ultima` all'ultima), `[data-ritratto-dialogo]`, `[data-dialogo-testo]`
(si tocca per andare avanti), `[data-avanti-pagina]` (il triangolo), la riga
`[data-riga]` con `data-missione` e `data-fase` (`offre`, `aspetta`,
`consegna`, `presa`, `grazie`, `pieno`) o il suo dato: `[data-detto]` (la
strada del minatore), `[data-ti-cerca]`, `[data-sotto-livello]` (con
`data-manca`), `[data-racconto]`, `[data-saluto]`, `[data-premio]`; le
domande `[data-scelte] [data-scelta="<che>"]` (`consegna`, `prendi`,
`bottega`, `vendi`, `strada`, `racconta`, `ciao`), con `data-missione` per
le prime due. `unita/sotterraneo-dialoghi` (i testi stanno in piedi, cosa si
dice aprendo, le domande e il loro ordine, la storia che cambia, il minatore
e la strada, prendere e consegnare, i mercanti),
`integrazione/sotterraneo-dialoghi` (col dito: si apre toccando la ragazza,
un tocco va alla pagina dopo, le domande solo all'ultima, la storia che non
si richiede, «ci penso io» che prende la missione, un tocco sul prato che
chiude e cammina, la consegna col premio, il minatore che si presenta e poi
dice la strada, la guaritrice e il mercante che portano alla bottega);
`nelDialogo` in `test/aiuto/browser.mjs` gira le pagine e sceglie.
