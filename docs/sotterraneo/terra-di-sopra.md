# La terra di sopra

Le discese non si scelgono da un elenco: si raggiungono a piedi su una mappa
grande (la «terra di sopra»), nella nebbia, e chi le cerca ha qualcuno che
gli indica la strada; nel villaggio stanno i mercanti. Il codice:
`viste/Terra.vue` (la mappa, la vista, il dito, il fumetto, i mercanti, chi apre il dialogo),
`motore/terra.js` (strada e nebbia, gira in Node), `dati/terra.js` (quale
discesa sta dove, cosa dicono minatore e cartello), `dati/mercanti.js` (chi
vende cosa), `dati/terra-mappa.js` (generato). `viste/Campagna.vue` ci mette
sopra la discesa a metà; chi scende (nome, livello, «Cambia eroe») sta nella pagina dell'eroe, non sulla mappa.

## La mappa

- **Due metà accostate**, 2048×1536 (32×24 celle da 64 px): a sinistra
  `generati/mappa_sotterraneo.png` (il prompt 1 della scheda
  `PROMPT-terra-di-sopra.md`: le discese di una volta, il cartello), a
  destra `mappa_sotterraneo_2.png` (il prompt 6: il villaggio in basso, il
  fiume col mulino e il ponte, i campi, e in cima una torre in rovina e un
  altare di pietra, che sono diventati discese). Le due immagini non si ritoccano: le
  accosta lo strumento (`compone`), e il codice di gioco vede una tela sola.
- **Le strade ci sono già**: il codice non ricompone la mappa a tessere, ci
  posa sopra solo quello che cambia (il divieto delle chiuse, chi indica e
  chi chiede, nebbia, eroe).
- **Entra nel file unico in WebP senza perdita** (colori a passo 12, ~2,2 MB,
  37 dB): nessun pixel si scosta di più di 6 su 255 dal sorgente. La fa lo
  strumento dal foglietto ([terra-strumento.md](terra-strumento.md)): il
  modulo non si tocca. Il perché: [../core/grafica.md](../core/grafica.md#fedeli-ai-sorgenti).
- **La scala: una cella della mappa è grande quanto un personaggio.** I
  personaggi sono a scala 3 come nel sotterraneo (16 px × 3 = 48 px), quindi
  la mappa si mostra a 3/4 (`SCALA_TERRA`): un pixel del disegno (4 px della
  mappa) diventa 3 px dello schermo, come un pixel del personaggio. L'eroe
  armato è a 2,5 (`SCALA_DELL_EROE`, 40 px): a 3, con l'armatura e l'arma,
  sovrastava i personaggi dipinti. Su un telefono da 390
  px si vedono otto celle in larghezza: la mappa è quattro schermi per uno e
  mezzo. `image-rendering: pixelated`. I pixel del disegno non stanno su una
  griglia esatta, e a 3/4 il vicino più prossimo li rende di larghezza un po'
  diversa; il filtro morbido, provato, sfoca (misure in
  [../core/grafica.md](../core/grafica.md#fedeli-ai-sorgenti)). La scala 1 con
  l'eroe a scala 4 darebbe pixel regolari, ma restringe il campo di un quarto
  e le prove del dito (`sotterraneo-terra`, `-missioni`, `-avventure`)
  contano sulla vista di adesso.
- **La giunta** fra le due metà la cuce lo strumento, senza disegnare
  niente: [terra-strumento.md](terra-strumento.md#la-giunta).

## La vista, alla Monkey Island

- **La vista non si trascina**: segue l'eroe. Lui sta libero nel mezzo, e
  quando arriva a `BORDO` dal bordo (30% di lato, 34% in cima, 26% in fondo
  dello spazio libero) la vista si sposta quel tanto che basta; ci arriva
  morbida (`MORBIDA`, un'esponenziale), mai a scatti.
- **Toccare vicino al bordo è il modo di esplorare**: l'eroe ci va, la vista
  gli scorre dietro e mostra il pezzo dopo; il tocco seguente va più in là.
- **All'avvio la vista è sull'eroe**, senza scorrere: lui a metà dello
  spazio libero.
- **Le carte in cima e in fondo** (la discesa a metà, gli avvisi e il dialogo) coprono la
  mappa: la vista le misura (`ResizeObserver`), tiene l'eroe nello spazio
  libero, e la mappa può scorrere fin sotto di loro, così il suo bordo non
  resta mai nascosto.
- **Il DOM si sposta a mano**, un `translate3d` per fotogramma sul mondo e
  sull'eroe: Vue ridisegna solo quando cambia qualcosa che si vede.

## Dove si cammina: la maschera

- **Una griglia di celle da 32 px della mappa** (64×48), una riga di testo
  per fila: `.` si cammina, `#` no. Sta nel foglietto, si legge e si
  corregge a mano. Le prime 32 colonne sono la metà di sinistra com'era; le
  altre sono scritte a occhio sulla metà nuova (il colore da solo non basta:
  l'erba all'ombra e la terra scura finiscono fra i no).
- **Nasce da una proposta letta dai colori** e poi si corregge a occhio: il
  giro con lo strumento sta in [terra-strumento.md](terra-strumento.md#la-maschera).
- **L'eroe trova la strada da solo**: A* a otto direzioni, in diagonale solo
  se le due celle di lato sono libere (non taglia l'angolo di una casa), poi
  lisciata dove si vede dritto, così non cammina a scaletta.
- **Un tocco dove non si arriva** (l'acqua, il bosco, un posto chiuso fra le
  staccionate) porta alla cella raggiungibile più vicina in linea d'aria.
- **Il minatore e i mercanti stanno fermi** e non gli si passa attraverso
  (`ostacoli`); per parlargli ci si ferma `accanto`, due celle più in là, o le
  due figure si mangiano a vicenda. Lo strumento controlla che `piede` e
  `accanto` si possano camminare e che nessuno si fermi addosso a chi sta
  fermo.
- **Nella metà nuova**: il fiume si passa solo sul ponte (righe 23 e 24,
  colonne 45-50), le case, la torre e l'altare non si attraversano (ci si
  arriva davanti), la piazza di terra battuta sì, e il pozzo da cui si beve
  no. Ogni cella dove si cammina si raggiunge da casa, tranne i piedi di chi
  sta fermo (`unita/sotterraneo-terra` lo conta).
- **Chi sta fermo non chiude la strada a nessuno**: togliendolo si arriva
  solo dove sta lui (`unita/sotterraneo-terra`). Provato il rigattiere in
  fondo al passaggio largo una cella fra il carretto e i cespugli: lo
  chiudeva, e adesso sta accanto al carretto, sul lato della piazza.
- **Una strisciata non cammina**: oltre i 16 px il tocco non conta, e si
  agisce sul `click`, non sul `pointerup` ([../core/il-dito.md](../core/il-dito.md)).

## Le discese sui posti

Le aperture sono otto: sette discese più l'abisso. Il criterio: **si parte
dal villaggio e le discese stanno in fila per strada**, la prima la più
vicina; l'abisso nel pozzo che dicono non abbia fondo, il posto più
lontano (`POSTO_DI` in `dati/terra.js`). Quale discesa sta dove, la sua
forma e perché: [la-grande-storia.md](la-grande-storia.md#le-discese).

| discesa | posto | passi da casa |
|---|---|---|
| La cripta dell'altare (`altare`) | la scala dietro l'altare fra le colonne, in cima a destra | 35 |
| La scalinata antica (`cantine`) | la scala sotto l'arco di pietra, oltre il bosco | 42 |
| La torre in rovina (`torre`) | la porta in basso della torre, in cima a destra | 45 |
| La grotta della scaletta (`gallerie`) | il buco nella roccia con la scaletta | 48 |
| La scala sommersa (`cisterna`) | la scala dentro lo stagno | 53 |
| La botola segreta (`labirinto`) | la botola nel prato, in cima a sinistra | 57 |
| La miniera abbandonata (`fondo`) | la miniera dentro il monte | 58 |
| l'abisso | il pozzo vecchio d'ardesia, in cima a sinistra | 64 |

- **Meno pozzi**: il pozzo dal tetto rosso è tornato disegno; i pozzi come
  discesa sono poco intuitivi (l'utente).
- **Il nome dice cosa c'è disegnato**, in italiano semplice; «Si apre
  quando finisci …» lo riscrive in minuscolo, quindi deve reggere anche in
  mezzo a una frase; `dove` lo mette in mezzo a quella del minatore («sotto
  la torre non duri»).
- **Le scale in acqua si prendono da dove si vede l'apertura**: alla scala
  sommersa si arriva dalla riva sud (`piede` [7, 24]), mai dall'alto
  (`unita/sotterraneo-terra`).
- **Si parte nel villaggio**, sulla piazza fra le case della metà di destra
  (`partenza` [52, 36]). Chi giocava prima della mappa si ritrova scoperto il
  posto delle discese già fatte.
- **Una discesa trovata e aperta ha un pallino per terra davanti
  all'ingresso** (al centro del bordo basso di `ingresso` nel foglietto,
  `.sot-segno-posto`), del colore che dice quanto è forte per l'eroe (grigio,
  verde, arancio, rosso: [zone.md](zone.md#il-pallino-e-la-sentinella)), e
  pulsante per la prossima da fare o per la zona appena nata. Davanti a una rossa
  sta la sentinella, e non si scende.
  Provato un anello attorno all'ingresso: copriva il disegno. Niente
  targhette né emoji sopra le discese; la chiusa tiene il 🔒 nel fumetto.
- **Toccando una discesa trovata l'eroe ci va e si apre il fumetto** sopra
  (sotto, se sopra non c'è posto; la vista scorre se esce): nome, dritta,
  piani, stelle e «scendo»; dell'abisso il piano più giù toccato. Toccare il
  prato col fumetto aperto lo chiude, e l'eroe parte verso dove si è toccato
  ([../core/interfaccia.md](../core/interfaccia.md#un-tocco-altrove-chiude)). Prima lo chiudeva e
  basta: per andarsene servivano due tocchi.
- **Una chiusa dice cosa la apre** («Si apre quando batti Re Ossuto in fondo
  alla cripta dell'altare»: il grosso della discesa prima, non una missione:
  [la-storia-principale.md](la-storia-principale.md)), senza tasto; chiusa per
  l'età non promette niente. Quella dove la storia continua lo dice nel fumetto.
- **Una chiusa ha il disegno pulito**: niente velo né lucchetto. Quando
  l'eroe ci va (tocco alla discesa chiusa, arrivato ai suoi piedi) **si
  pianta un cartello di divieto** davanti all'ingresso: un paletto di legno
  con un disco rosso e la barra bianca, disegnato in codice (`DIVIETO` in
  `viste/pixel.js`, scala 2), all'angolo sinistro del bordo basso di
  `ingresso` perché l'eroe, che aspetta al centro, non lo copra. Il fumetto
  dice cosa la apre. **Il cartello resta piantato finché la discesa non si
  apre**: sta in `cfg.avventure[<eroe>].terra.divieti`, e una discesa aperta
  lo perde da sola. Provato il ritaglio di una mappa sbarrata chiesta a
  ChatGPT (`mappa_sotterraneo_chiusa.png`): non è mai arrivata, e il
  divieto in codice costa meno e non sposta niente del disegno.
- **Con una discesa a metà**, scenderne un'altra avverte prima
  (`[data-chiede]`), come nell'elenco di prima.

## Chi indica la strada

- **Il vecchio minatore**, nel villaggio dove parte la strada per il bosco:
  toccato, si parla ([dialoghi.md](dialoghi.md)) e dice dov'è la prossima
  discesa aperta («La cripta dell'altare: su per il sentiero dei campi, oltre
  il mulino, fino all'altare fra le due colonne…»); finite le sette, racconta
  la zona appena nata, col «!» sopra la testa finché non l'ha detta, e dice
  le zone verdi ([zone.md](zone.md#la-notizia)). Finché non ha parlato ha i puntini sopra la testa, e la prima
  volta si presenta. Se la roba è sotto quella attesa per la prossima,
  lo dice ([la-grande-storia.md](la-grande-storia.md#chi-e-sotto-il-livello-lo-sa-prima-di-scendere)).
- **Chi dà le missioni** sta fermo dove ha senso (la ragazza al pozzo del
  villaggio, il mugnaio al mulino, l'eremita all'altare, la guardia alla
  torre, il pescatore allo stagno, il boscaiolo al margine del bosco), col
  segno sopra la testa: [missioni.md](missioni.md).
- **Il cartello all'incrocio**: tre frecce, coi posti; accanto ai posti i
  nomi delle discese già trovate.
- **Una missione presa si ricorda dal bordo**: una freccia azzurra col ritaglio
  della discesa, dello stesso stampo di quella d'oro delle consegne, che le cede la
  precedenza ([missioni-freccina.md](missioni-freccina.md)).
- **Niente sassi che luccicano**: c'erano, uno ogni quattro passi fino
  alla prossima discesa; tolti il 7 ottobre 2026 perché sembravano cose da
  raccogliere e distraevano (l'utente). La strada la dicono le persone e il
  cartello.
- **Il minatore, i mercanti e i sei delle missioni sono dipinti**
  (`sopra-personaggi-1.png` e `-2.png`, ChatGPT, 13 ottobre 2026; la
  provenienza è nei foglietti): ognuno ha `<nome>-fermo-0` e
  `<nome>-saluta-0` nell'atlante, con le chiavi di `dati/mercanti.js` e
  `dati/missioni.js` (`armaiolo`, `incantatrice`, `erborista`, `rigattiere`, `ragazza`,
  `mugnaio`, `eremita`, `guardia`, `pescatore`, `boscaiolo`, `minatore`), e
  `viste/Terra.vue` li prende da soli. Stanno alla scala dell'eroe (il corpo
  dell'eroe è alto 19 pixel; loro 21–26, la guardia con la lancia 26) e si
  disegnano col pezzo **nitido** (`docs/core/sprite.md`): a 22 pixel un viso
  dipinto sarebbe una macchia, ridotto a schermo da 200 resta un viso. Fermo e
  saluta hanno lo **stesso rettangolo, centrato sul piede**: passando
  dall'uno all'altro i piedi non si spostano anche se il braccio sporge.
- **Il minatore è quello del secondo foglio**: ha le due pose giuste e la
  stessa mano di ragazza e boscaiolo. Quello del primo (stesso personaggio,
  nella seconda posa mostra una bussola invece di salutare) è fuori
  dall'atlante: la posa sta nel foglietto, nelle note, per quando servirà la
  bussola della mappa.
- **Chi sta fermo saluta**: alza la mano per 1,4 secondi quando l'eroe gli si
  avvicina (entro sei celle della maschera; si riarma solo dopo che l'eroe si
  è allontanato oltre nove) e quando gli si parla (all'apertura del
  dialogo), poi torna fermo. Il tempo è quello dei fotogrammi, non un
  `setTimeout`: a schermo spento non scorre. Il «!» d'oro sopra la testa e il
  nome (nel dialogo) non cambiano. All'avvio chi sta vicino a dove si parte
  saluta subito, ed è il benvenuto.
- **Le figure di `viste/pixel.js` restano come ripiego** (`MINATORE`,
  `ARMAIOLO`, `ERBORISTA`, `RIGATTIERE`, `RAGAZZA`…): se un pezzo mancasse
  dall'atlante il personaggio sarebbe un vuoto cliccabile, e `unita/creature`
  controlla che ogni `<nome>-fermo-0` e `-saluta-0` ci sia. `GUARDIA` serve
  comunque a `SENTINELLA`.

## I mercanti

Quattro personaggi fermi nel villaggio, nella metà di destra, ognuno davanti al
suo banco o alla sua porta (`mercanti` nel foglietto, `MERCANTI` in `dati/terra-mappa.js`);
chi vende cosa e perché sta in [bottega.md](bottega.md#i-mercanti-di-sopra).

| chi | dove | piede · accanto |
|---|---|---|
| l'armaiolo | davanti all'incudine sotto la tettoia, a sinistra della piazza | [41, 42] · [39, 42] |
| l'erborista | davanti al banco con le boccette e i mazzi d'erbe, sotto la piazza | [50, 43] · [48, 43] |
| l'incantatrice | accanto alla porta della casa di destra, nel suo giardino fra le staccionate | [56, 40] · [54, 40] |
| il rigattiere | accanto al carretto di cianfrusaglie, in fondo a destra | [54, 43] · [52, 43] |

- **Si toccano come il minatore**: l'eroe ci va, si ferma `accanto`, e
  arrivato si parla; la prima domanda apre il banco ([dialoghi.md](dialoghi.md)). Il banco
  sta al centro, si chiude con la ✕ in alto a destra o toccando fuori, e quel
  tocco passa alla mappa (dopo i 320 ms ciechi dell'apertura).
- **Si trovano nella nebbia** come i posti: finché la loro cella non si è
  vista sono prato (non si toccano). Trovati, si vedono: niente riga.
- **Stanno a pochi passi da dove si parte**, intorno alla piazza: sul
  telefono se ne vedono due alla volta.
- **Sono dipinti**, come il minatore: `armaiolo-fermo-0`, `erborista-fermo-0`,
  `rigattiere-fermo-0` e le pose `-saluta-0` (qui sopra, «Chi indica la
  strada»). Il fabbro è robusto con il martello, la guaritrice ha il cappuccio
  verde e le boccette, il mercante il cappello viola e il sacco.
- **L'incantatrice ha una figura provvisoria**: la guaritrice con la tonalità del verde
  ruotata al viola (`tinta` nel foglietto di `sopra-personaggi-1`, `ritinge_in` in `atlante.py`:
  [FORMATO.md](../../strumenti/sprite/FORMATO.md)), cappuccio viola, grembiule chiaro, la boccetta in mano.
  Il terzo foglio dei personaggi (prompt 9 di `PROMPT-terra-di-sopra.md`) porta la sua figura vera, con altri nove
  che il gioco non ha: arrivato, si toglie la `tinta` e le sue due pose si ritagliano dal foglio nuovo.
- **Sta alla porta della casa di destra**, nel suo giardino: non ha un banco da tenere e la casa è l'unica
  vicino alla piazza senza nessuno davanti. Il posto dove si ferma l'eroe è nello stesso giardino. Provato [57, 41],
  proprio sotto la porta: lasciava senza uscita la cella dietro di lei (`unita/sotterraneo-terra`).
- **Sulla mappa non c'è la carta di chi scende.** C'era in fondo (ritratto,
  livello, armatura e «cambio»): il livello sta sulla barra in basso,
  i numeri, i tratti della roba e «Cambia eroe» nella pagina dell'eroe
  ([livelli.md](livelli.md#la-pagina-delleroe)), che si apre dal globo, e la
  mappa arriva fino alla barra. Era una fascia che toglieva una mano di
  campo e diceva due volte quello che la barra dice già.
- **L'eroe che cammina tiene in mano l'arma che ha addosso**, e lo scudo
  dall'altra parte, come nella scelta delle avventure: è `viste/Armato.vue`
  con la posa e il fotogramma del passo.
- **Il banco si pesca per avventura**: porta il passo dopo della storia di
  quell'eroe ([la-grande-storia.md](la-grande-storia.md)), e i banchi già
  pescati stanno nella sua avventura.

## Chi cura

La guaritrice cura la vita e l'incantatrice l'energia, gratis, a chi è salito dal portale; chiamano con un fumetto sopra la testa
finché serve. Tutto in [chi-cura.md](chi-cura.md).

## Il portale gemello

- **Con una discesa lasciata dal portale, nel villaggio c'è un portale**
  (`PORTALE` nel foglietto: `piede` [51, 38], sul piazzale accanto al pozzo
  da cui si beve, fra l'armaiolo e l'erborista; `accanto` [49, 38]). È il
  gemello di quello nel piano ([regole.md](portale-e-sosta.md#il-portale-e-luscita)), lo stesso
  disegno (`viste/Portale.vue` su `scena/portale.js`), a pixel della scala
  dell'eroe, con un bagliore morbido che i pixel non hanno.
- **Salendo dal portale si sbuca `accanto` a lui**. Toccandolo ci si va, e il
  fumetto dice dove riporta, col ritaglio della discesa: «Ti riporta giù: la
  scalinata antica, piano 1, dove eri» e «torno giù», che riprende la sosta
  esattamente dov'era.
- **C'è finché c'è la sosta, e solo se si è salita dal portale** (`via:
  'portale'`, o l'abisso risalito per la sera): uscire con la ✕ non lascia un
  gemello, e rientrando si è già giù ([regole.md](portale-e-sosta.md#il-portale-e-luscita)).
  Non è un ostacolo, e si trova nella nebbia come i mercanti. La carta in cima
  («torno giù da dove ero», «lascio perdere») segue la stessa sosta.

## Le icone delle discese

Dove una discesa compare in piccolo (la carta della discesa a metà, la
scelta delle avventure, il fumetto del gemello, «riprendi da qui» in home)
c'è il suo posto ritagliato dalla mappa, non un'emoji: un 🕳️ non diceva
quale pozzo. Come si fanno: [terra-strumento.md](terra-strumento.md#le-icone).

## La nebbia

- **Nero dove non si è mai stati, scuro dove si è stati, pieno attorno a
  te.** Un sotterraneo tutto illuminato è una piantina; vale anche sopra.
- **A nuvole, non a quadretti**: ogni cella vista buca il nero con una
  nuvoletta sfumata spostata un poco a caso, su una tela a un quarto che il
  browser stira sfumando.
- **Si scopre camminando** (`VISTA`, otto celle attorno all'eroe), e un
  posto è trovato quando se ne vede il cuore: lo dice una riga in fondo
  («Hai trovato la scalinata antica!»). Un posto nel buio è prato come il resto.
- **Si ricorda per avventura** ([avventure.md](avventure.md)), in
  `cfg.avventure[<eroe>].terra`: `{ nebbia, dove, parlato, divieti }`, la
  nebbia un bit per cella in esadecimale (768 caratteri); un codice della
  mappa larga la metà (384) si rimette a sinistra (`LARGHEZZE_VECCHIE`), uno
  che non torna è nebbia nuova. Un eroe nuovo parte dal villaggio.

Nei test: `[data-terra]` (la vista, con `data-camera`), `[data-eroe-terra]`
(con `data-cella` e `data-cammina`), `[data-posto]` (con `data-discesa` o
`data-abisso`, `data-aperta`, `data-trovato`), `[data-divieto="<posto>"]` (il
cartello di divieto delle chiuse), `[data-minatore]`, `[data-cartello]`, `[data-fumetto]`
(con `data-fumetto-di`), `[data-azione="scendi"]`, `[data-detto]`,
`[data-chiusa-perche]`, `[data-avviso-terra]`, il dialogo di chi sta fermo in
[dialoghi.md](dialoghi.md), `[data-pallino="<posto>"]` (il
pallino, con `data-colore`; la sentinella e i colori in [zone.md](zone.md)), `[data-sotto-livello]` (nel fumetto di una discesa), `[data-mercante="<chi>"]`, `data-saluta` (1 mentre alza la mano) su `[data-minatore]`, `[data-mercante]` e `[data-personaggio]`,
`[data-personaggio="<chi>"]` (con `data-segno`, [missioni.md](missioni.md)), `[data-portale]` (il gemello) col suo fumetto
`[data-fumetto-di="portale"]` e `[data-azione="portale-giu"]`, `[data-ritaglio]`
(l'icona ritagliata, nella carta in cima, nel fumetto, nella scelta e in
home); nella bottega e nello zaino quelli di
[bottega-finestra.md](bottega-finestra.md#la-bottega-e-lo-zaino);
`unita/sotterraneo-terra` (anche: il portale gemello raggiungibile, chi sta
fermo non chiude la strada), `unita/sotterraneo-avventure` (un'icona per
discesa), `integrazione/sotterraneo-terra`, `integrazione/sotterraneo-mercanti`,
`integrazione/sotterraneo-portale`, `integrazione/sotterraneo-missioni`, e
`scendiNelSotterraneo` e `camminaVerso` (per la strada vera, toccando il punto
più avanti che si vede) in `test/aiuto/browser.mjs`.
