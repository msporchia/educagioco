# I pensieri dell'eroe

Ogni tanto l'eroe pensa ad alta voce, in un fumetto a bolle sopra la testa: come sta e cosa gli piacerebbe avere. È la
guida senza tutorial: una compagnia che ogni tanto dice la cosa giusta, non un tutor. L'utente, 16 ottobre 2026: *«quando
entri in un dungeon e non hai la torcia magari un messaggio… "quanto vorrei avere la torcia"»*, e poi *«suggerirei un po' di
più: "vorrei tanto avere una torcia qui sotto", "mi hanno parlato di una spada dal fabbro"»*.

Il codice: `dati/pensieri.js` (la tabella, le parole della roba, il ritmo), `motore/pensieri.js` (la situazione, la scelta, la
memoria; puro, gira in Node), `Gioco.vue` (giù, e la scelta sopra), `viste/Terra.vue` (il fumetto sopra nel Sotterraneo di sempre) e `viste/Mondo3d.vue` (lo
stesso nel mondo generato del Sotterraneo 3D: le stesse porte `pensa`, `pensiero`, `pensiero-fine`, `trovati`), lo stile in `stile.css`
(`.sot-pensiero`, col tema legno nel 3D).

## Dire cosa, non ordinare

- **Il pensiero nomina la cosa e, se serve, il posto**, come un desiderio o un ricordo: «Vorrei tanto avere una torcia, qui
  sotto», «Mi hanno parlato di un arco nuovo, dal fabbro». Ammessi «vorrei», «sarebbe bello», «mi hanno parlato di…», «ho
  sentito che…», «chissà se…».
- **Mai un ordine né un tono da maestro**: niente «compra», «vai», «devi», «dovresti», «ricordati», niente imperativi.
- **Come sta, non com'è l'oggetto**: il dolore, la stanchezza, il buio, il dito nudo, e cosa gli piacerebbe. Mai un giudizio
  sull'oggetto (una pozione non è «buona»).
- **Su misura della build**: il tipo d'arma è quello della strada dell'eroe ([strade.md](strade.md)), la veste quella che la
  classe porta, lo scudo solo per chi lo usa, l'anello solo se un dito è libero. Mai un pezzo che l'eroe non può portare, che
  non regge (i requisiti, il livello: [livello-dei-pezzi.md](livello-dei-pezzi.md)) o che ha già. Se non c'è niente di sensato
  da dire, si tace.
- **Frasi brevi, da bambino di sei anni**, un po' di ironia e di calore. L'età non cambia le parole (il sotterraneo è per chi
  legge); spegnerli si fa come per tutto il gioco, dall'età o dai giochi (vedi sotto).

| buono | cattivo |
|---|---|
| «Mi fa male tutto… mi ci vorrebbe proprio una pozione.» | «Bevi una pozione!» · «Che buona la pozione che ho nello zaino.» |
| «Ho la tasca piena di gemme e quest'arco non mi basta più: dal fabbro avranno qualcosa di meglio.» | «Hai tante gemme: compra un arco nuovo.» |
| «Dal mercante ho visto un anello… starebbe bene al mio dito.» | «Ricordati che hai due dita libere per gli anelli.» |

### La strada si riconosce

Le strade non sono una scelta nel gioco: `stradaDellEroe` le riconosce da com'è fatto l'eroe (la famiglia e le mani dell'arma in
mano, lo scudo, i nodi dell'albero presi; a pari merito quella della prima famiglia che la classe porta). Da lì: il tipo d'arma
(`TIPI_ARMA`, per famiglia e mani: «una spada», «uno spadone», «un'ascia a due mani», «un arco», «una bacchetta», «un bastone
magico»), chi la vende (bacchette e stoffa l'incantatrice, il resto il fabbro), il prossimo punto delle caratteristiche
(`DIVENTARE`: «più forte», «più svelta») e il prossimo nodo dell'albero della strada. Gli accordi (articoli, aggettivi, «questa
spada», «quest'arco», l'elfa che è «pronta») li fa il motore (`conArticolo`, `questoDi`, `unoDi`, `{o}`), e un test li controlla.

## I pensieri

| id | tono | dove | quando lo pensa |
|---|---|---|---|
| `senza-torcia` | consiglio | giù, entrando | niente torcia accesa e niente alla cintura |
| `torcia-corta` | problema | giù | la torcia accesa ha ancora 2 stanze o meno, e nessuna di scorta |
| `torcia-sopra` | consiglio | sopra | niente torcia (o quasi finita) e nessuna di scorta, le gemme per una, la guaritrice trovata |
| `arma-vecchia` | problema | sopra e giù | le gemme per l'arma della sua strada al livello che regge, e quella in mano è 3 livelli sotto (o le mani vuote); sopra, chi la vende già trovato |
| `veste-vecchia` | consiglio | sopra | lo stesso per la veste della classe (corazza o mantello) |
| `mano-libera` | consiglio | sopra | la strada vuole lo scudo, la mancina è libera, nessuno scudo in tasca, le gemme |
| `posto-libero` | consiglio | sopra | un dito (o il collo) libero, nessun gioiello in tasca, le gemme |
| `tasca-in-piu` | consiglio | sopra | lo zaino quasi pieno e il doppio delle gemme di una tasca |
| `da-mettere` | problema | sopra e giù | nello zaino un pezzo che adesso va addosso ed è meglio (`vaAddosso`) |
| `manca-caratteristica` | consiglio | sopra e giù | nello zaino un pezzo della classe, del suo livello, a cui manca la caratteristica |
| `non-fa-per-me` | consiglio | sopra | nello zaino un pezzo che la classe non porta |
| `zaino-pieno` | consiglio | giù | tutte le tasche piene |
| `zaino-al-mercato` | consiglio | sopra | lo zaino quasi pieno e almeno due cose da vendere |
| `chiave-porta` | consiglio | giù | una chiave in tasca e una porta chiusa già vista |
| `elisir` | consiglio | sopra e giù | un elisir del toro nello zaino |
| `punti-eroe` | consiglio | sopra e giù | punti delle caratteristiche da dare (dice cosa diventerebbe) |
| `punti-abilita` | consiglio | sopra e giù | punti dell'albero (dice il prossimo nodo della strada) |
| `incanto` | consiglio | giù | un incanto che si prepara adesso, e nessuno addosso |
| `mi-fa-male` | problema | giù | vita al 40% o meno, e una cura in tasca |
| `prima-del-grosso` | problema | giù | il grosso sveglio, vita fra 40% e 70%, una cura |
| `letto-a-casa` | problema | giù, anche entrando | vita al 35% o meno, e nessuna cura |
| `gorgoglio` | consiglio | giù | vita al 60% o meno, e una fonte non bevuta già vista |
| `senza-magia` | consiglio | giù | energia al 25% o meno, una pozione blu, almeno un'abilità imparata |
| `senza-cure` | problema | sopra | nessuna cura, le gemme per una, la guaritrice trovata |
| `forziere` | consiglio | giù | un forziere chiuso (non di missione) già visto |

Le soglie stanno in `SOGLIE`. I testi, due o tre per pensiero, girano: la seconda volta si dice l'altro.

## Il ritmo

`RITMO` in `dati/pensieri.js`. Un **giro** è una discesa (la tappa e il seme: ripresa è la stessa, ricominciata un'altra) o la
visita al villaggio dopo di lei.

- **Al più tre pensieri a giro, e due consigli.** Prima i problemi, poi i consigli, nell'ordine della tabella.
- **Cinquanta secondi fra due pensieri** (quattro entrando in un piano: è il momento giusto).
- **Un consiglio una volta a giro**, e in un altro giro solo dopo mezz'ora; **un problema** al più due volte a giro, a quattro
  minuti l'una dall'altra, finché c'è. Lo stesso pensiero mai due volte di fila.
- **Giù**: entrando in un piano dopo 1,2 secondi (il momento `entrata`); il resto dopo 14 secondi del giro, controllando ogni due.
  Il tempo è quello di gioco (fermo in pausa). **Mai con qualcosa aperto o in corso**: uno scontro, un foglio, una domanda, lo
  zaino, la finestra dell'eroe, la mappa grande, un avviso, una festa; se si apre qualcosa, il fumetto se ne va.
- **Sopra**: con l'eroe fermo da tre secondi, senza dialogo, fumetto o avviso; il fumetto se ne va camminando.
- **Il fumetto resta 5,5 secondi.** La memoria (`pensieri` dell'avventura, `cfg.avventure[eroe].pensieri`: nessun campo nuovo nel
  profilo) tiene quando e quante volte è stato detto ogni pensiero, così una discesa ripresa non ridice niente. Il perché del ritmo
  così lento: misurato col banco, in una discesa vera ne escono da uno a tre (la torcia entrando, una ferita, un punto).

## Il fumetto e il tocco

- **Sopra la testa**, sopra la barretta della vita: giù lo posa `Gioco.vue` a ogni fotogramma (`testaDi` del pittore 2D e del 3D),
  dentro il campo, e sotto i piedi se sopra non c'è posto; sopra sta dentro l'eroe che cammina e si sposta di lato per restare
  nello schermo. Le due bolle puntano alla testa. Non copre la barra né i pannelli (sta sotto di loro).
- **Il tema**: quello di sempre nel 2D (carta chiara, filo scuro), legno e ottone col tema legno (il Sotterraneo 3D).
- **Non si tocca**, tranne quando ha un segno: allora il tocco **accende** la cosa giusta per sei secondi (l'anello della guida,
  `data-indicato`: la casella dello zaino, delle pozioni, degli incanti, il livello, il globo dell'energia) e sopra il mercante si
  illumina e l'eroe gli va accanto. Non apre niente: la scoperta resta del bambino. Nel fumetto niente tasti né frecce.
- **Niente costo**, nessuna moneta; non parla mai di una domanda; non tocca le regole (il banco non cambia: `guarda` in
  `motore/banco.js` guarda e basta).

## Spegnerli

Non c'è un interruttore dei genitori per una parte di un gioco ([../genitori/interruttori.md](../genitori/interruttori.md), «Il
quarto non si rifà»), e i pensieri non ne aggiungono uno. Per le prove c'è il cheat `#pensieri=no`. Se servisse davvero, il minimo
sarebbe un'eccezione in `settings.giochi` (`{ 'sotterraneo:pensieri': false }`), da decidere con l'utente.

## Come si aggiunge un pensiero

Una riga in `PENSIERI` (id stabile: è una chiave della memoria), con la sua condizione su un campo della situazione (se manca, si
aggiunge in `situazioneDi`), due testi che rispettano le regole di sopra, l'icona (un'emoji che c'è già, se no `npm run emoji`) e,
se ha senso, il segno. Poi la riga della tabella qui sopra e i casi vero/no in `unita/sotterraneo-pensieri` (§ 2): il test pretende
che ogni pensiero si raggiunga, e il lessico (§ 5) che non ci siano ordini, giudizi, segnaposto rimasti o parole lunghe fuori lista.

Nei test: `[data-pensiero]` con `data-pensiero-id`, `data-tono`, `data-segno` (e `data-sotto="1"` quando sta sotto i piedi); il
segno acceso è `[data-indicato]`. `unita/sotterraneo-pensieri` (la tabella, ogni condizione, ogni classe e strada, gli accordi, il
lessico, il ritmo, le discese del banco), `integrazione/sotterraneo-pensieri` (la torcia entrando nel 2D e nel 3D, sopra la testa e
non addosso, la ripresa che non la ridice, il tocco sopra che illumina la guaritrice; `--scatti` lascia `sotterraneo-pensieri-2d`,
`-3d`, `-sopra`, `-segno`, `-mondo3d`; nel mondo 3D il pensiero dell'arma a mani vuote e il fabbro che si illumina).
