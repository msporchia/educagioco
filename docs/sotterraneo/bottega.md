# I mercanti e la bottega

Le quattro botteghe sul mondo di sopra, cosa portano, i pezzi delle righe dopo
a sovrapprezzo, quanta scelta c'è sul banco e come cambia da un giro all'altro
(il tetto di rarità, i dieci pezzi, i salti e i sogni, il banco che ruota e si
rinnova, comprare senza le caratteristiche, il riacquisto). La finestra da gioco di ruolo dove si compra e
si vende, e lo zaino nella stessa finestra: [bottega-finestra.md](bottega-finestra.md).
Divisa da [roba.md](roba.md) quando ha passato le 250 righe. I banchi sono a
tono col livello dell'eroe ([rarita.md](rarita.md#i-mercanti-a-tono)). Il
codice: `dati/mercanti.js`, `motore/bottega.js`, `motore/storia.js`
(`bancoDelPasso`, `vetrinaDelPasso`, `delPassoDi`), `viste/Bottega.vue` e
`Gioco.vue` (dove i banchi si scrivono nell'avventura).

## I mercanti di sopra

Quattro botteghe sul mondo di sopra, vicino alle case e al carro
(`MERCANTI` in `dati/mercanti.js`; dove stanno:
[mondo-3d.md](mondo-3d.md#chi-sta-dove)). Nelle discese non vende
più nessuno.

| chi | vende | in cima, sempre |
|---|---|---|
| ⚒️ l'armaiolo (il fabbro), sotto la tettoia a sinistra | il ferro: spade, asce, archi, scudi, corazze e giubbe di cuoio; la linguetta «Elmi» ([elmo.md](elmo.md)) | — |
| 🔮 l'incantatrice (`incantatrice`), alla porta della casa di destra | la magia: bacchette e bastoni, vesti di stoffa; la linguetta «Cappelli» ([elmo.md](elmo.md)) | boccetta blu e ampolla delle stelle (l'energia); la pergamena del portale dopo la sua missione ([portale-e-sosta.md](portale-e-sosta.md#la-pergamena-del-portale)) |
| 🌿 l'erborista (la guaritrice), al banco con le erbe | niente di pescato: solo quello che sta sempre in cima | le quattro cure (le grandi dopo qualche discesa finita), torcia |
| 🧺 il rigattiere (il mercante), accanto al carro | anelli, collane (amuleti, medaglione), chiavi: tutti sotto la linguetta «Gioielli» | — e **compra** quello che hai in tasca, e te lo ridà (sotto) |

- **Il fabbro lavora il ferro, lei la magia** (l'utente, 13 ottobre 2026): le armi
  della famiglia `bacchette` e i pezzi di `stoffa` sono solo suoi, e al fabbro
  restano tutte le altre armi, gli scudi, il ferro e il cuoio (`vende.famiglie` e
  `vende.senza` in `dati/mercanti.js`, `vendeLa`). Così il mago ha una bottega per le sue
  tre strade (la spada dal fabbro, bacchetta e scudo e la pura magia da lei più il fabbro
  per lo scudo), l'elfa le sue vesti, e il fabbro non si riempie di pezzi che metà degli eroi
  non porta. **L'energia è sua e non più della guaritrice** (le cure e la torcia restano
  alla guaritrice): una linguetta «Energia» sempre piena, uguale per tutti.
- **A chi non porta la famiglia la linguetta non si mostra** (`schedeDi`): al
  cavaliere e al nano l'incantatrice ha solo «Energia», all'elfa «Vesti» ed «Energia»,
  al mago «Bacchette e bastoni», «Vesti» ed «Energia». Un banco di bacchette a chi non le
  impugna sarebbe una linguetta vuota con la scusa «guarda l'altro».

- **Il posto senza domande**: qui si spende quello che le domande hanno
  fruttato. Quello che non ci si può permettere resta visibile, pieno e coi suoi
  colori (niente trasparenza né grigio: l'utente, 13 ottobre), col prezzo in
  rosso e quanto manca sul tasto: sapere cosa c'era è il motivo per tornare.
- **L'elisir del toro non si compra** (l'utente, 13 ottobre: un buff per sempre è
  un oggetto rarissimo): la guaritrice non lo vende, si trova ([rarita.md](rarita.md#lelisir-del-toro)).
- **Compra solo il rigattiere, a metà prezzo** (`quantoVale`): comprare e
  rivendere perde metà, quindi non è un modo di fare gemme, ma libera le
  tasche. Più botteghe che comprano farebbero di ogni banco un posto dove
  svuotare le tasche; chi non compra dice chi lo fa. Quello che compra lo
  tiene da parte (**Riacquista**, sotto).
- **L'armaiolo, l'incantatrice e il rigattiere portano il passo dopo della storia**
  (`passo` in `dati/mercanti.js`, `bancoDelPasso` in `motore/storia.js`):
  i pezzi della riga con cui si entra nella prossima discesa che mancano
  **e che vendono loro** (la verga e il saio del mago stanno dall'incantatrice, la
  spada e lo scudo dal fabbro; anche la vetrina dei pezzi avanti guarda chi vende cosa),
  e un paio di cose (`altre`) che non costano più di quei pezzi.
  L'erborista pesca a righe (`righe` per discese finite), come prima.
- **I pezzi delle righe dopo si comprano, a un prezzo più alto**
  (`vetrinaDelPasso` in `motore/storia.js`, al più due per casella;
  `sovrapprezzo` in `dati/mercanti.js`): un pezzo `k` righe avanti al passo
  costa `1 + k` volte il prezzo pieno (il doppio, il triplo…), col
  numero vero sotto la casella, e basta: il prezzo alto si legge
  ([dialoghi.md](dialoghi.md#le-scritte)). Chi ha messo da parte le gemme può scendere con un pezzo
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
- **Il prezzo segue la potenza** (l'utente, 9 ottobre: un raro dà più di un comune a parità
  di livello, quindi costa molto di più): al banco un pezzo costa base × livello × `acq` della
  rarità (comune 1, magico 2,6, raro 6, leggendario 14, `dati/pezzi.js`); rivendendo si incassa
  ancora la metà del vecchio valore (`molt`), così la roba che cade non gonfia le gemme.
  Le varianti sono tre per ogni rarità, con abilità diverse.
- **Un pezzo utile costa quanto uno zaino pieno di pozioni** (l'utente, 14 ottobre 2026): un salto vale circa **8 Pozioni da 21** dal livello 6 in giù
  (7,7 · 8,0 · 9,7 · 8,6 · 10,1 ai livelli 6 · 8 · 10 · 12 · 14; più su ai livelli bassi, dove la Pozione ancora non c'è), come il tetto di 8 cure addosso. Il rapporto è
  una regola e non un risultato: **i prezzi della roba non si alzano** (alzarli rende le cure relativamente economiche e chi beve tutto torna favorito: provato, il
  curioso arrivava già a +4/+6 di forza comprando tutti i salti, e il fabbro caro non era la cura). `npm run taratura` lo stampa a ogni giro
  («Quante pozioni costa un pezzo utile») e `--salti` da solo: salto mediano contro la cura più grande già in vendita (`dalla`) e contro la Pozione di mezzo.
  Chi tocca i prezzi delle cure (`dati/cose.js`) o dei salti lo rilegge.
- **Quanto rendono i mostri è la leva dei soldi** (`VALORE_DELLA_POTENZA.gemme` in `dati/livelli.js`, 0,5: prima 1): le gemme di un mostro sono la sua potenza per questo
  numero. **0,5 è il minimo che lascia la cripta sufficiente**: chi esce dalla cripta andando dritto ha 5–8 💎 a 0,25 e la prima arma dell'armaiolo ne costa 9
  (`misure/sotterraneo`, «la prima arma»). Il taglio costa a chi va dritto: a 0,5 le discese «dritte» a 8/10 si vincono il 69 · 56 · 68 · 63 · 63% (cantine · torre · gallerie · labirinto · fondo) contro il 64 e il 65%
  della torre e del fondo a 1, e le altre sopra soglia; il curioso, che ha altre entrate (forzieri, rivendite), resta comunque a +3/+4 di forza. Il giro e i numeri: [risalite.md](risalite.md#il-giro-delle-gemme-14-ottobre-sera).
- **Il tetto di rarità** (l'utente, 12 ottobre 2026: *«il fabbro non venda
  roba leggendaria/epica, quella è appannaggio dei drop: ti permette di
  prendere sempre un'arma tosta per quel livello, ma non super tosta»*): dai
  mercanti **mai un leggendario**, né un pezzo col nome dei mostri grossi
  (`consentito`), **il magico sempre**; i rari solo come salti e sogni (sotto,
  al più `RARI_PER_LINGUETTA`). I leggendari restano dei drop e dei mostri
  grossi. Vale per ogni strada che mette un pezzo sul banco: il pescato
  (comune o magico, `aTono`), la vetrina dei pezzi avanti (comuni), lo scaffale
  (sotto); uno scaffale riletto con un pezzo vietato lo butta. Chi ha già roba
  rara addosso trova pezzi di livello più alto, non di rarità più alta.
- **Dieci pezzi per linguetta** (`PEZZI_PER_LINGUETTA`; prima sei, prima ancora
  tre; l'utente, 12 ottobre: *«la varietà è minima, ti propone tipo 5 armi, danne
  di più»*): ogni linguetta che veste (armi; scudi e armature; gioielli) si
  riempie fino a dieci pezzi in vista, **tutti che migliorano** quello che
  l'eroe ha addosso in quel posto, uno per base prima e poi il resto, a caso. Il
  pescato (il passo e le `altre`) e la vetrina contano fra i dieci; il resto sta
  sullo **scaffale** (`scaffali` in `botteghe`, scritto come i banchi):
  comuni e magici a tono col livello dell'eroe (quello a cui regge l'arma e il
  suo) e, solo se non bastano, di livello più alto, un livello dopo l'altro, fino
  a trovarne che migliorano: con boss e rari addosso il banco non resta mai vuoto
  (l'utente: *«l'armaiolo dovrebbe sempre avere armi, in caso costano troppo»*).
  Sotto `MINIMO_PER_LINGUETTA` (3) una linguetta si rimette in piedi anche a metà
  giro. **Lo scaffale sta fuori da `mercanzia`** (banco e vetrina) **e dentro
  `mercanziaVista`**: lo vede chi apre la bottega, e il giocatore finto delle
  misure (`motore/banco.js`) non lo compra, quindi l'equilibrio non cambia. Un
  pezzo che col livello nuovo non migliora più niente non si mostra, ma resta
  sullo scaffale (e al giro dopo se ne va per primo).
- **Salti e sogni** (l'utente, 13 ottobre: *«ho una roba "rara"… non dovrebbe
  anche a prezzi esorbitanti propormi qualcosa di meglio?»*): ogni linguetta che
  veste ha **sempre almeno due pezzi forti** (`SALTI_MINIMI`, fino a tre: i
  **salti**) e **almeno un sogno** (`SOGNI_MINIMI`, fino a due), anche a chi ha
  addosso roba rara. Un salto alza il posto di almeno un quarto di quanto vale
  adesso e non meno di `SALTO_MINIMO` (`ruoloDi`: `confronto().meglio`); sta da un
  livello fino a sette sopra l'eroe, comune, magico o raro, e può chiedere una
  caratteristica che l'eroe non ha: si compra e va nello zaino, perché **un pezzo si indossa dal suo livello**
  ([livello-dei-pezzi.md](livello-dei-pezzi.md)). Perciò **ogni linguetta ha anche due pezzi che migliorano e si mettono subito** (`completaSubito`, `SUBITO_PER_LINGUETTA`: di basi diverse prima, del livello dell'eroe o fino a due sotto): chi ha le gemme trova sempre qualcosa da mettersi adesso, oltre ai pezzi da tenere per dopo. Un **sogno** è
  un salto di otto livelli o più sopra (`SOGNO_LIVELLI`), raro, il più caro di
  ogni base: il traguardo per cui risparmiare; chi ha già il meglio di quei
  livelli lo trova più su ancora; **costa il doppio** del prezzo vero (`PREZZO_DEL_SOGNO`: esorbitante, un pezzo di otto livelli più su costa già molto). Mai un leggendario. Sono in fondo alla
  linguetta, i salti e poi i sogni, senza segni sulla casella
  ([bottega-finestra.md](bottega-finestra.md)). Basi diverse prima, per usare
  più figure del catalogo ([figure.md](figure.md)).
- **Il banco si rinnova quando non c'è più niente per cui risparmiare** (l'utente,
  13 ottobre): aprendo la bottega (`prepara`) dopo che l'eroe è salito di livello o
  ha cambiato quello che ha addosso (`firmaDelGiudizio`, scritta in `giudicato`),
  una linguetta senza i suoi due pezzi forti e un sogno (`mancaForza`) fa il giro
  come a fine discesa (tre via, tre nuovi); se ce n'è ancora, il banco resta com'è.
  Nei test: salire di un livello non cambia il banco, di dieci sì, e riaperto
  non cambia più.
- **Il banco cambia poco alla volta** (l'utente, 12 ottobre: *«vedo un'arma
  super carina ma non ho ancora i soldi, entro, passo di livello, torno su e non
  c'è più: elimina le 3 più deboli e ne spawna 3 nuove, ma non elimina le
  altre»*): il banco si pesca una volta e si scrive nell'avventura (`botteghe`:
  `banchi`, `scaffali`, `ruota`); **riaprire la bottega non lo cambia** (niente
  slot machine, né uscire a metà per ripescarlo). Cambia solo al giro: finita una
  discesa (vinta, persa o finita la sera nell'abisso) `alGiroNuovo` segna chi deve
  cambiare, e la prima volta che si riapre (`prepara`) per ogni linguetta che
  veste **se ne vanno i tre pezzi più deboli** (`SE_NE_VANNO`) e ne entrano almeno
  tre nuovi, a tono col livello di adesso; gli altri restano, e un pezzo
  desiderato aspetta. **Più debole** è col numero con cui il gioco dice che un
  pezzo migliora (`confronto().meglio`, i `PESI` di `motore/corredo.js`); **per
  primi se ne vanno i pezzi che col livello dell'eroe non migliorano più niente**
  (o che si hanno già), e i pezzi appena andati via non tornano nello stesso giro.
  I pezzi del passo della storia (`delPassoDi`) non si toccano e quelli del giro
  nuovo entrano: chi arriva senza la riga la trova. Se gli acquisti hanno
  lasciato la linguetta sotto i dieci, il giro la riporta a dieci. Un salvataggio
  di prima (solo `banchi`, nessuno scaffale) si rilegge, si riempie, e al giro
  dopo ruota come uno nuovo. L'erborista non veste: il suo banco si ripesca
  intero a ogni giro, come sempre. La vetrina dei pezzi avanti non ruota: si
  ricalcola dal passo e dal livello. **Provato: il banco ripescato intero a
  ogni giro, e i pezzi in più ricalcolati a ogni apertura** (un pezzo diverso a
  ogni livello): il pezzo desiderato spariva.
- **Si compra anche senza le caratteristiche** (l'utente, 12 ottobre: *«anche se
  non ho le stats dovrei poter comunque comprare un oggetto, giusto non te lo
  faccio equipaggiare»*): un pezzo che la classe porta ma di cui manca la
  caratteristica (le armi hanno il requisito, scudi e armature no) si vede col
  lucchetto 🔒, il pannello dice «Serve Intelligenza 6 (hai 5)», e **si compra come
  gli altri e va nello zaino invece che addosso** (`Corredo.prendi`; `compra`
  ferma solo quello che la classe non porta, la verga al cavaliere). Nello zaino
  ha il 🔒 e niente «Indossa» (`Zaino.vue`): si indossa quando la caratteristica
  c'è. Zaino pieno, non si compra, come per tutto. Prima erano «da meritare»
  (9 ottobre) e spenti; ora si comprano, uno per linguetta almeno se ce n'è
  (`DA_MERITARE` = 8 al più, **dietro ai pezzi che si mettono subito**: dal 14 ottobre il livello chiude tutto quello che sta sopra l'eroe, non solo
  la caratteristica; oltre sette livelli sopra se ne cercano solo se i pezzi non bastano a riempire la linguetta). **Il traguardo sta a due punti di caratteristica**
  (`FINESTRA_DEL_TRAGUARDO`, otto livelli sopra quello che l'eroe regge):
  provato senza tetto, un mago di livello 8 vedeva bacchette di livello 37.
- **Riacquista: gli ultimi cinque pezzi venduti** (l'utente, 12 ottobre: *«se
  vendo qualcosa dovrebbe darmi la possibilità di riacquistarlo, mi tiene gli
  ultimi 5 che ho venduto allo stesso prezzo»*): il rigattiere (l'unico che
  compra) tiene da parte i pezzi che l'eroe gli vende e li ridà **allo stesso
  prezzo a cui li ha pagati** (la metà), non a quello del banco: riprendere una
  cosa venduta per sbaglio non costa niente, e non è un modo di fare gemme. Il
  sesto fa uscire il più vecchio (`ULTIMI_VENDUTI`). Stanno nell'avventura
  dell'eroe (`venduti`: `[{ k, prezzo }]`, fuori da `botteghe`, quindi
  sopravvivono al giro) e si vedono nella **linguetta «Riacquista»**, la più
  recente per prima. Riprendere è come comprare: va addosso se è meglio, se no
  in tasca; zaino pieno o gemme che non bastano, niente. **Perché una linguetta
  e non una fila in cima a «Vendi»**: cinque caselle in una griglia da tre per
  riga sono due righe e mezzo sopra le tasche; la linguetta ha le stesse
  caselle e lo stesso pannello col confronto, e a 390 px le tre linguette
  stanno ([bottega-finestra.md](bottega-finestra.md)).
- **Solo roba per l'eroe** (`posso` in `Bottega.banco`, `bancoDelPasso`): né
  in vendita né in vetrina ci sono pezzi di famiglie che l'eroe non porta (la
  verga al cavaliere, l'ascia al mago). Un banco già pescato con roba altrui
  se la vede sostituire con un pezzo della sua famiglia dello stesso gradino
  (stesso grado d'arma o stessa fascia di prezzo), o senza (`soloRobaMia`).
- **Quello che non alza niente non si mostra** (`siMostra` e `sottoAddosso`
  in `motore/bottega.js`), **nemmeno fra i pezzi avanti**: resta pescato ma
  non si vede (un pezzo non ancora reggibile si giudica sul punteggio che darebbe). Né uno scudo con un'arma a due mani in pugno: non si può portare. Una seconda arma leggera con la mano libera alza il braccio, e
  quindi si vede. Regola dell'utente, 8 ottobre: lo scettro accanto al
  bastone magico (⚔️ 3 tutti e due, e più caro perché avanti) «non sembra
  molto interessante»; contano livello, rarità e abilità.
- **Quello che si ha già non si offre**, tranne quello che si consuma; il
  pescato è pezzo unico e se ne va comprandolo, le cure e la torcia no.
- **Le cure arrivano per discese finite e hanno un tetto** ([roba.md](roba.md#le-pozioni)): la guaritrice ha da subito la boccetta, poi la
  pozione (dopo 1), l'ampolla (dopo 3) e l'ampolla maggiore (dopo 5), a prezzo fisso (`dalla` in `dati/cose.js`, `Bottega.sempreDi`);
  l'ampolla della vita non la vende, si trova. Con otto cure in tasca la nona non si compra: la casella dice ✋, il pannello «Al massimo 8
  pozioni: bevine una o buttala, poi torna» e il tasto «hai già 8 pozioni» resta spento. Col riacquisto lo stesso.
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

Nei test: `unita/sotterraneo-pozioni` e `integrazione/sotterraneo-pozioni` (le cure per discese finite, il tetto di otto, `[data-al-tetto]`),
`unita/sotterraneo-roba` (il fabbro e l'incantatrice si dividono la roba: bacchette e stoffa solo da
lei, l'energia da lei, le cure e la torcia dalla guaritrice, le linguette per ogni eroe; il banco porta il passo dopo; sovrapprezzo
dei pezzi avanti; nessun pezzo di famiglie non portate; ogni linguetta con
dieci pezzi che migliorano, mai un leggendario, per i quattro
eroi a ogni discesa e a vari livelli, anche con roba rara addosso; due pezzi
forti e un sogno sempre, il rinnovo solo quando serve; l'elisir fuori dai banchi; comprare
senza le caratteristiche e finire nello zaino; il banco che ruota — tre via,
tre dentro, gli altri restano, i più deboli se ne vanno, il banco riaperto o
riletto è lo stesso, il salvataggio di prima; gli ultimi cinque venduti, allo
stesso prezzo, riletti dall'avventura; ogni linguetta con un pezzo che si mette subito e i pezzi col 🔒 da tenere per dopo) e `integrazione/sotterraneo-bottega-avanti` (la 🔒 sulla casella, «Serve livello N (hai M)» sul pannello e nello zaino, senza tasto per indossarlo) e `misure/sotterraneo` (chi spende avanti
nelle ultime due discese); i bersagli della finestra stanno in
[bottega-finestra.md](bottega-finestra.md).
