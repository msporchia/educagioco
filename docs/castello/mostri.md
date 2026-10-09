# I mostri e le ondate del castello

Chi è immune a cosa e perché, le regole che una fila di mostri deve
rispettare, le ondate miste, le abilità, il capo e il ritmo delle ondate. I
mostri stanno in `src/data/mostri.js`, le file delle tappe in
`src/data/campagne-castello.js`.

## Immune, non resistente

- **Un mostro dichiara le torri che non lo toccano affatto** (`immune`):
  zero danno, niente veleno, niente gelo. Provata la resistenza (un terzo del
  danno): un terzo di una torre otto volte più forte è ancora tanto, e la
  regola del gioco era «costruisci bombe». Provata anche la debolezza
  (danno doppio): «il Golem, debole alle bombe» un bambino lo legge al
  contrario, e l'informazione che cambia la mossa è quale torre **non**
  serve.
- **Al massimo due immunità per mostro** (`IMMUNITA_MAX`). Con tre, fantasma
  e drago avevano una torre sola che li feriva e nessuna che li frenava: un
  indovinello, non una scelta. Il gelo li prende tutti e due.
- **Di base tutte le torri fanno effetto.** Goblin, orco, ragno, lupo,
  balestriere, slime e verme sono **comuni** (`immune: []`, `comune`): li
  ferisce tutto, e slime e verme restano speciali per l'abilità. Provato con
  un'immunità a tutti: non c'era più niente di normale da cui distinguere
  l'eccezione, e ogni tappa chiedeva la torre giusta dalla prima ondata.

| mostro | immune a |
|---|---|
| pipistrello, arpia, corvo (volano) | 💣 ❄️ |
| fantasma (vola) | 💣 🏹 |
| drago (vola) | 💣 🔮 |
| golem, troll, corazziere (corazzati) | 🏹 🔮 |
| scheletro | 🔮 ❄️ |
| rovo | 🏹 💣 |
| blatta | 💣 🔮 |
| goblin, orco, ragno, lupo, balestriere, slime, verme | — (comuni) |

- **L'immunità non si accende e non si spegne per tappa**: è com'è fatto il
  mostro, quindi a decidere è **la fila** della tappa (chi manda, in che
  ordine). Nel commento accanto a ogni fila, ondata per ondata, le torri che
  quel mostro lascia fuori; il «—» è un comune.
- **La figura dice l'immunità** (`src/giochi/castello/scena/bestiario.js`,
  uno per i quattro vestiti del castello): al bambino serve capire
  che torre mettergli davanti, non chi è. Vocabolario corto, uguale in tutti
  i vestiti — una figura che fa due mostri li fa con le stesse immunità
  (`unita/castello-bestiario`):

  | figura | immune a |
  |---|---|
  | ali o volo (🪽) | 💣, e chi ha le ali di un animale anche ❄️ |
  | trasparente (👻, i fantasmi) | 🏹 |
  | drago (🐉) | 💣 🔮 |
  | pietra o guscio (🪨) | 🏹 🔮 |
  | fuoco vivo (🔥) | 🔮 🏹 (lo apre solo lo scoppio) |
  | ossa (💀) | 🔮 ❄️ |
  | un groviglio (🌿) | 💣 🏹 |
  | tutti gli altri (🐾) | nessuna: sono i comuni |
- **Lo stendardo lo dice prima** (`components/castello/Stendardo.vue`, vedi
  sotto «Lo stendardo e la scheda»), con le torri sbarrate; la scheda del
  mostro dice «non lo toccano» e quali usare, e
  nella scelta della torre la carta sbagliata si attenua, senza scritte.
  Come si comporta una torre davanti a un immune sta in
  [torri.md](torri.md). **Le emoji sbarrate sono grigie, non del colore
  della torre**: colorare vuol dire indicare, e qui il segno è l'opposto
  — contro quel mostro la torre non serve — e il grigio più la barra
  restano leggibili anche a chi i colori li distingue male.

## Le regole di una fila

Scritte una volta in `guastiDelleImmunita` (`data/mostri.js`), controllate da
`strumenti/valida-percorsi.mjs` e da `unita/immunita-castello`:

1. **ogni mostro si può ferire** con almeno una torre della tappa — se no è
   un'ondata che non si ferma qualunque cosa si faccia;
2. **ogni torre che ferisce ha un mostro immune** nella fila: nessuna torre,
   da sola, vince la tappa. **Il Bosco è esente** (`IMPARA_LE_TORRI`): è
   dove si impara cosa fa una torre, e una tappa di goblin e slime che tutte
   feriscono è quello che serve. Dal Sotterraneo in poi, e nelle quattro
   libere (anche quella del bosco), la regola torna: dove i comuni
   l'avrebbero rotta la fila ha preso un immune in più, dopo l'apertura (la
   miniera il pipistrello, le fogne il fantasma, il guado della Palude il
   rovo);
3. **la prima ondata la ferisce l'arciere**, la torre che si compra per
   prima e costa meno;
4. **due ondate di fila non hanno le stesse immunità** (due comuni sì): chi
   ha costruito bene per questa deve ripensare per la prossima.

**E l'apertura** (`coperturaApertura` in `data/castello.js`): le prime
otto ondate (`APERTURA_COPRE`, o tutte se la tappa è più corta) le
feriscono le torri con cui apre il giocatore modello, **ognuna dalla sua
strada**, con le bocche insieme quando scendono insieme. All'inizio le
risorse non bastano per essere variegati: con quattro ondate coperte, alla
quinta arrivava un mostro che le prime due torri non toccano, e il bambino
doveva allargarsi proprio quando serviva salire. Quindi le file si aprono
coi comuni, e dove una tappa ha tre specialisti che vogliono tre torri
diverse la fila **si allunga coi comuni** finché l'ultimo arriva nono (la
sala del trono, il torrione, il pantano). Un comune è l'unico mostro che può
stare due volte nella stessa fila. `APERTURA_CORTA` è il registro delle
tappe che non ci arrivano, col perché, ed è **vuoto**: `unita/immunita-castello`
pretende che dica il vero nei due versi. Nelle libere la fila la dispone
`filaCheRegge` (vedi [libere.md](libere.md)).

**La taratura spiana la vita mostro per mostro** (vedi
[taratura.md](taratura.md)): un golem che solo le bombe aprono ha meno vita
di un pipistrello, e non è un errore.

## Le ondate miste

- **Due tipi mescolati nella stessa fila** (`MISTA`, `coppiaDellOnda`,
  `ondataMista`): nessuna torre li ferisce tutti e due, e almeno due torri
  toccano l'uno o l'altro (`tieneMista`) — una torre sola non basta. È la
  domanda dopo quella dell'ondata di un tipo solo.
- **Le coppie si cercano fra i mostri che la tappa manda già** (`coppieDi`),
  mai scritte a mano; `guastiDelleMiste` le controlla.
- **Nelle libere** una su cinque dalla decima (13ª, 18ª, 23ª…), mai sul capo.
- **Nella campagna una sola**, in fondo alle tappe di Mura e Palude più
  lunghe di otto ondate (mai dentro le prime `APERTURA_COPRE`), e **con una
  coppia che le torri del piano feriscono già dalla sua strada**
  (`mistaDelPiano` in `data/castello.js`): se chiedesse una torre in più
  proprio in fondo, la tappa farebbe meno conti di quelli che promette (il
  torrione ne faceva 23 invece di 30). Per questo è l'ultima ondata o quella
  prima, e il canneto, le isole e il guado della Palude non ce l'hanno.
- **Metà e metà**, alternati, con la `folla` di ciascuno; energia e numero
  come un'ondata normale, una vita sola per tutti e due.
- **Il secondo tipo sta in `con`** (`bestiaDi` in `motore/castello/ondate.js`),
  e stendardo e scheda disegnano due ritratti con **due righe di immunità**:
  fuse direbbero «tutte sbarrate».
- La taratura le spiana **per ondata**, come il capo (`chiDi` → `'mista'`);
  il giocatore modello le tratta come bisogni (vedi
  [taratura.md](taratura.md)).

## Abilità e capo

- **Le abilità** (`ABILITA`, accese con `abilita` dal Sotterraneo in poi e
  sempre nelle libere): slime e verme si dividono in due più piccoli quando
  cadono (`dividi`), scheletro e troll si rialzano una volta con metà vita
  (`risorge`). Nel Bosco no: lì si impara che cosa tocca chi, e una seconda
  regola nella stessa tappa sarebbe troppo.
- **Quelle ondate arrivano in meno e più distanziate** (`folla`: 0,4 per chi
  si divide, 0,7 per chi si rialza): tre bersagli per mostro sono troppe
  frecce al secondo, e coi vermi a ondata intera la taratura non trovava una
  vita abbastanza bassa. Ognuno paga di più: l'energia di un'ondata non
  cambia mai (il tabellone mette da parte le frazioni).
- **Più avanti chi si divide si divide due volte** (`divisioniDi`,
  `DIVISIONI` in `data/mostri.js`): i pezzi di uno slime si dividono
  ancora, e i pezzi dei pezzi no — al massimo quattro in fondo, più i due
  di mezzo, con un terzo e poi un nono della vita. È la domanda dopo quella
  della divisione semplice (quale torre tiene una fila che raddoppia due
  volte), quindi arriva quando la prima è imparata: nelle tappe che
  dichiarano `divisioni: 2` — dalla terza di Mura e Palude (il corridoio,
  la sala del trono, il torrione; le isole, il pantano, la foce) — e nelle
  libere dall'ondata 20 (`DIVISIONI.libere`). Il tetto è `DIVISIONI.tetto`,
  due: una terza generazione riempirebbe la strada di coriandoli.
- **Chi si divide due volte arriva ancora più rado, a pari bersagli**
  (`follaDi`): sette bersagli per mostro invece di tre, quindi tre settimi
  della `folla` di chi si divide una volta (0,17), e l'intervallo cresce
  allo stesso modo. La paga si spartisce a ogni divisione: l'energia
  dell'ondata è quella di sempre.
- **La taratura la conta da sé** perché gioca il motore vero: nelle tappe
  con `divisioni: 2` la vita di quelle ondate esce dalla bisezione come
  tutte le altre. Oltre la tabella delle libere (dalla 21ª) la vita riparte
  da chi si divideva una volta sola, e `caricoDi` la corregge perché
  l'ondata porti la stessa vita di prima e non la metà (arriva in meno).
- **Lo dice la scheda, a parole**: «quando cade si divide in due, e i pezzi
  si dividono ancora» (`[data-scheda-abilita][data-divisioni="2"]`); sul
  medaglione resta solo il dato (`[data-abilita="dividi"][data-divisioni="2"]`).
- **Il capo** (`CAPO`): un mostro solo, grande due volte e mezzo, lento, con
  la vita dell'ondata e un decimo; ogni dieci ondate nelle libere, in fondo
  all'ultima tappa di ogni campagna (`capo: true`). Paga come l'ondata, e se
  arriva toglie quattro cuori. Nelle libere lo devono ferire almeno due torri
  (`capiAperti`, vedi [libere.md](libere.md)).

## Il ritmo delle ondate

- **L'ondata parte quando la chiami**, o da sola dopo l'attesa della tappa
  (`attesaDi`: da `CFG.attesaLarga` 45 s nella prima a `attesaStretta` 20
  nell'ultima). Il conto alla rovescia **scorre solo a mani ferme**: con
  un'operazione aperta si ferma, e riparte da capo quando la si chiude. La
  matematica non è mai sotto cronometro, lo è solo lo stare a guardare.
- **La fretta** (`CFG.fretta`, `premioDellaFretta`): chi chiama prima si
  prende `perSecondo` 0,12 ⚡ per ogni secondo risparmiato, fino a `tetto`
  6. La prossima si chiama anche a battaglia in corso, appena quella di
  adesso è uscita tutta. **Il modello non la conta**: le tappe sono tarate
  su chi si prende il suo tempo, e la fretta è un cuscinetto per chi
  rischia. `misure/castello` tiene il tetto a due acquisti per tappa: se
  valesse di più diventerebbe un obbligo.
- **Le ondate si chiudono una per una** (`aperte` nella battaglia), non a
  campo pulito.
- **⏩** manda il campo a velocità doppia o tripla
  (`components/castello/GettoniCampo.vue`). La pausa è quella comune a tutti
  i giochi (`giochi/pausa.js`).
- **Da che bocca**: sta in [campagne.md](campagne.md).

## Lo stendardo e la scheda

- **Lo stendardo** è rosso, appeso al bordo destro del campo, dove ci sono
  solo alberi: non ruba posto alle piazzole ed è **sempre in vista**, anche
  in battaglia (prima c'era una striscia bianca in cima, bocciata: «è
  brutto»). Un medaglione d'oro per ondata, col mostro, quanti (×28, la
  freccia della bocca dove sono due) e le torri a cui è immune, sbarrate.
  In battaglia il primo è chi è in campo («in campo», bordo rosso); fra
  un'ondata e l'altra chi parte col tasto (bordo d'oro). Il capo ha il
  medaglione d'oro pieno e il cartiglio «il capo». Ne mostra tre; la
  linguetta «+N ▾» apre le altre (il campo ne chiede sei, `prossime(6)`).
- **Niente icone da indovinare** sul medaglione e nella scheda: né la
  forbice di chi si divide, né una tartaruga per chi è lento. Restano solo
  le torri, che sono quelle del gioco; il resto è scritto.
- **La scheda** (`SchedaGrande.vue`) si apre toccando un medaglione e
  ferma il campo (`usaPausa`, come il regalo). Il mostro sta grande su un
  palco e cammina girandosi — di lato verso destra, di fronte, verso
  sinistra — col pittore `palco` (`giochi/castello/scena/pittori.js`): chi
  ha i passi di `cammino.py` cammina, gli altri respirano e saltellano.
  Sotto: l'ondata e quanti ne arrivano (o ne restano), la vita, se vola,
  «non lo toccano» con le torri sbarrate e «usa» con quelle che lo
  feriscono fra le torri della tappa, e cosa fa quando cade (`che` di
  `ABILITA`). Nelle miste i due mostri affiancati, ognuno con le sue righe.
- `.riga` esiste anche nel foglio globale (una fila di bottoni centrata):
  la scheda la rimette a sinistra. Provato prima con una classe che si
  chiamava `fa`: è la radice della fattoria, e la riga usciva su una fascia
  verde scura.

Nei test: sullo stendardo `[data-stendardo]`, sul medaglione
`[data-onda-preavviso]` (o `[data-in-campo]` per chi è in campo),
`[data-immune]`, `[data-abilita]`, `[data-divisioni]`, `[data-capo]`,
`[data-mista]`, `[data-immune-con]`, la linguetta
`[data-azione="altre-ondate"]`; sulla scheda `[data-scheda-grande]`,
`[data-scheda-mista]`, `[data-scheda-immune]`, `[data-scheda-abilita]` (con
`[data-divisioni]`), `[data-azione="chiudi-scheda"]`;
`[data-azione="chiama-prossima"]`. `integrazione/torri-figure` apre la
scheda di chi è in campo e guarda che la riga dell'abilità non abbia un
fondo suo.
