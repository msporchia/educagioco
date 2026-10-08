# Le regole della discesa

Come si scende, quanto costa, chi ti viene addosso, come si combatte, come si
sviene, cosa ci si porta dietro, il portale e come si lascia una discesa a metà. La roba
(eroi, armi, torcia, i mercanti di sopra, curiosità) sta in [roba.md](roba.md);
il fondo senza fine in [abisso.md](abisso.md).

Il codice: `src/giochi/sotterraneo/` — `dati/campagna.js` (le sette discese, [la-grande-storia.md](la-grande-storia.md)),
`dati/mondo.js` (passi e tempi), `dati/mostri.js` (`BRANCO`),
`motore/corsa.js` (la discesa), `motore/livello.js` (il piano),
`motore/corredo.js` (la roba che resta), `motore/banco.js` (il giocatore
finto che scende davvero, e fa la spesa sopra).

## La scala e il guardiano

- **La scala è chiusa, e la chiave ce l'ha un guardiano.** I mostri si
  aggirano tutti, quindi senza questa regola si scenderebbe senza una
  domanda: il minimo per scendere è battere il guardiano, il resto è
  facoltativo. La scala ha una grata col lucchetto finché la chiave non è
  presa.
- **Chi porta la chiave lo dichiara la tappa, non il caso** (`guardianoDi`):
  è l'unica cosa del sotterraneo che non si può aggirare.
- **I segni sopra le porte non mentono mai** (`SEGNI` in `dati/cose.js`):
  💀 guardia, 💎 roba buona, ⛲ acqua. La pelle della porta
  ripete il segno col disegno (`dati/tessere.js`). Un segno che promette a
  vuoto diventa decorazione, e tornare indietro diventa una penitenza invece
  di una scelta.
- **Le porte chiudono la stanza, non il varco.** Si sbarrano *tutti* i varchi
  di una stanza, e una risposta li apre tutti: il pedaggio resta uno. Provato
  a chiuderne uno solo: il 💀 si scavalcava dall'altra parte, e dove due
  corridoi si affiancano si passava accanto al battente.
- **Le stanze premio (il portale, la fonte, i forzieri) si pescano fra le foglie**,
  quelle con un collegamento solo, così non diventano un casello. Prima di
  sbarrarne una si cammina fino alla scala: se non ci si arriva, la stanza
  resta aperta e senza segno.
- **In ogni piano, dove si compare, c'è la scala che sale**: si risale
  dove si era scesi e il piano di sopra è com'era
  ([scala-che-sale.md](scala-che-sale.md)).
- **La stanza del mercante ha il portale** (più sotto, «Il portale»): il
  mercante sta sopra ([terra-di-sopra.md](terra-di-sopra.md#i-mercanti)), e
  il portale porta da lui. Stessa pesca e nessun tiro in più, così il piano
  nasce uguale a prima; la stanza non ha porta, la strada di casa non si
  paga. Vale anche nell'abisso. Provato: una seconda fonte al posto del
  mercante; l'utente ha voluto il portale alla Diablo.

## Quanto costa una discesa, in domande

Misurato dal banco, una discesa per riga col seme del banco e la roba con cui
ci si entra secondo la storia (`robaAttesa` e il livello atteso, il cavaliere: [la-grande-storia.md](la-grande-storia.md);
il numero balla da un seme all'altro: serve a leggere la forbice, non a
confrontare due tappe):

| discesa | piani | solo il guardiano | tutto il piano |
|---|---|---|---|
| La cripta dell'altare | 2 | 15 | 26 |
| La scalinata antica | 2 | 15 | 59 |
| La torre in rovina | 3 | 21 | 60 |
| La grotta della scaletta | 5 | 44 | 69 |
| La scala sommersa | 3 | 36 | 78 |
| La botola segreta | 3 | 62 | 201 |
| La miniera abbandonata | 4 | 60 | 167 |

- **La forbice è il punto**: se «tutto» costasse quanto «il minimo» non ci
  sarebbe niente da scegliere.
- **Il tetto è una seduta: 85 risposte obbligate.** Oltre è un compito, e
  `unita/sotterraneo` diventa rosso (anche per ognuno dei quattro eroi).
- **Il patto del banco**: rispondendo bene otto volte su dieci, con la roba
  che ci si porta dietro, si arriva in fondo quasi tutte le volte.
- **Stanze per piano: da quattro a sedici** (la scalinata e la botola ne
  hanno sedici, la cripta e la grotta quattro). La forma del piano
  (`misura`, o `largo` e `alto`; `giri` 2..4) la controlla
  `guastiDellaCampagna`, che pretende anche che ogni tappa chieda più della
  precedente.

## Le monete

- **🪙1 a risposta giusta, pagato nel momento in cui si risponde**
  (`PAGA.mossa` in `src/data/paghe.js`): nelle sette discese come
  nell'abisso, anche in una discesa persa o rifatta. A fine discesa il
  cartello dice il totale (`[data-monete-prese]`) e quanto ha tolto il
  salvadanaio (`[data-nota-monete]`); una discesa ripresa conta solo le
  monete di quest'ultima volta, perché le altre sono già in tasca.
- **Niente premio di tappa**: c'era, `premio × stelle` (🪙30–100 a
  discesa vinta), e non aveva rapporto con le domande che la discesa
  chiedeva — la miniera pagava come la scalinata a parità di stelle.
- **Una e non tre**: qui la domanda è la mossa (porte, mostri, forzieri),
  un centinaio in una discesa da venti minuti. A 🪙3 una discesa
  renderebbe il doppio dell'ora della calibrazione
  ([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md));
  a 🪙1 rende quanto prima il premio pieno.

## La luce, la torcia e la mappina

Nero = mai stato. Scuro e freddo = ricordato. Pieno e caldo = lo stai
guardando. Un sotterraneo tutto illuminato è una piantina, e su una piantina
non c'è niente da esplorare. La piantina c'è — la **mappina** in alto a
destra — e mostra solo il visto più tre punti: dove sei, la scala, chi ha la
chiave. La 🗺️ della barra in basso la apre grande ([barra.md](barra.md)).

- **Senza torcia si vede un cerchio attorno all'eroe, anche dentro una
  stanza** (`RAGGIO` 2,3 celle, `aggiornaLuce` in `motore/corsa.js`): la stanza
  non si accende tutta, porte, forzieri, roba e arredo compaiono quando ci si è
  vicini, il resto resta nella penombra del visto, e la scena è visibilmente
  più buia (`Tela.buio`: il cerchio si spegne piano ai bordi). **Con la torcia
  la stanza si accende intera e in corridoio si vede lontano** (`RAGGIO_TORCIA`
  6,2), nessun velo. Il perché: con la stanza che si accende da sé la torcia
  serviva solo nei corridoi, cioè non contava.
- **L'ultima stanza della torcia** (`torciaResta` ≤ 1 e niente alla cintura):
  il raggio scende a 4,2 (`RAGGIO_SGOCCIOLI`), la stanza non si accende più
  tutta e il cerchio trema (solo disegno: il motore resta deterministico, il
  banco non lo sente). Si nota senza un avviso in più. Con una torcia alla
  cintura non si stringe: la prossima si accende da sé.
- **La sveglia dei mostri non dipende dalla luce, ma da sveglio un mostro si
  vede sempre** (`occhi` e `inLuce` in `Corsa`, anche fuori dal raggio e al
  buio, e si può toccare). Così non c'è colpo preso da un buio in cui non
  potevi vedere: lo vedi arrivare, ed è più lento di te. Con la torcia lo vedi
  dormire da lontano; al buio lo vedi quando si è già svegliato. Provato: mostri
  che si svegliano solo se li vede la luce (mezzo secondo dopo che entrano nel
  raggio): senza torcia il gioco diventava **più facile** (la botola da 62 a 39
  risposte obbligate, la miniera da 60 a 40, il cavaliere a 6/10 nelle cantine da
  7 a 13 vinte su 20), il buio premiava invece di costare. Legata alla distanza
  (sette celle, la stanza di prima) i numeri tornano quelli di prima.
- **Contare le stanze (`stanzeViste`, la torcia che brucia, le missioni) non
  dipende dalla luce**: è l'eroe a entrarci.
- **Misurato**: il banco gioca a torcia spenta, quindi le tabelle di
  [la-grande-storia.md](la-grande-storia.md) non si muovono (domande per
  discesa uguali, il cavaliere a 6/10 con la roba attesa 7 · 11 · 7 · 8 · 5 · 9
  prima e 9 · 11 · 7 · 7 · 5 · 9 dopo, dentro il caso). Quello che la torcia
  cambia è il vedere, non il costo in risposte; costa 5 gemme a piano
  (l'erborista ne ha sempre, i pipistrelli e i fantasmi ne lasciano una ogni dieci
  morti circa), contro 6–16 gemme a piano che esce il giro minimo: la
  comodità adesso pesa. Sullo schermo, campioni accesi della tela nella stanza
  dell'ingresso: 21 500 con la torcia, 9 800 all'ultima stanza, 4 500 senza.

## Chi ci abita: il branco a fasce

`BRANCO` è una **scaletta di fasce**: la profondità sceglie la fascia, il
caso la faccia. Dentro una fascia i mostri costano le stesse risposte e
picchiano quasi uguale; scendendo cambia *quanto è dura*, fra una stanza e
l'altra *chi trovi*.

| fascia | chi | a mani nude |
|---|---|---|
| 1 | ratto · pipistrello | una risposta |
| 2 | goblin · melma · fantasma | due |
| 3 | scheletro · fungo · vespone | tre o quattro |
| 4 | orco · lupo · serpente · granchio | da quattro a sei |
| 5 | golem | sette — solo nell'abisso |

Fuori dalla scaletta i due **capi**, gigante e troll: li mette la tappa.
Nell'abisso ogni posto ha un branco suo, preso da queste fasce (vedi
[abisso.md](abisso.md#il-posto-cambia-scendendo)).

- **Dentro una fascia si cambia forma, non quantità**: il serpente ha poche
  ossa e morde forte, il granchio para e lascia scudi, la melma è lenta e fa
  poco male. Due costi diversi nella stessa fascia sarebbero una lotteria.
- **Il passo di discesa è una costante** (`PASSO_DEL_BRANCO`, con un `min`
  sulla lunghezza). Provato a derivarlo da `BRANCO.length`: aggiungere una
  fascia in fondo ricalibrava anche la scalinata, e la scala sommersa passava da 36 a
  58 risposte obbligate.
- **La faccia si sceglie dallo stesso tiro della fascia** (cifre alte la
  fascia, basse la faccia). Un `rnd()` in più sposta stanze, porte e forzieri
  di tutto il piano, e il banco confronterebbe due sotterranei.
- **Il bottino è della fascia, non della faccia**: cambia cosa si trova, non
  quanto spesso.

## Camminare col dito

Si tocca dove si vuole andare; lo spazio percorribile lo sa
`src/motore/passi.js`. **Verso una cosa si va con `viaVerso()`, non con
`accanto()`**: `accanto()` sceglie la cella più comoda in linea d'aria, che
non sempre si raggiunge, e il gioco diceva «di là non si passa» a tocchi
possibilissimi.

## La stanza è il confine

- **I mostri dormono finché non ti avvicini nella loro stanza (a meno di
  sette celle, `SVEGLIA`), e smettono appena esci.** Uno che insegue per tutto
  il piano farebbe una fuga continua, uno fermo un percorso a ostacoli: così il
  corridoio è sicuro e la soglia è una decisione. La luce non c'entra
  ([La luce](#la-luce-la-torcia-e-la-mappina)).
- **Sono più lenti di te** (`PASSO_MOSTRO` 3,1 celle al secondo contro
  `PASSO_EROE` 5,4, in `dati/mondo.js`), e dopo una fuga c'è `CALMA`: tre
  secondi. Scappare deve funzionare sempre: si scappa uscendo, non con un
  bottone.
- **Scappare costa un graffio**: quello che prenderesti rispondendo bene.
  Gratis era la mossa migliore del gioco. Il numero sta scritto sul tasto.

## Lo scontro

- **Un mostro picchia sempre.** Rispondendo bene si para e resta un graffio,
  metà del colpo: `(attacco del mostro − la tua difesa) / 2`; sbagliando
  arriva tutto. Senza il graffio le pozioni restavano in fondo allo zaino, e
  con loro spariva il motivo di cercare una fonte o l'erborista. Il conto vero
  diventa la **lunghezza della battaglia**: con l'arma buona il gigante cade
  in quattro risposte e otto graffi, a mani nude il doppio.
- **Si dice prima**: «ti graffia 2 · se sbagli 4» sotto il mostro. **Si
  racconta dopo**: «⚔️ gli hai tolto 8 · ti ha graffiato 3». Il graffio ha un
  suono suo, sordo e breve: col suono dell'errore chi aveva risposto giusto
  credeva di aver sbagliato.
- **Lo scontro è una modale al centro** e la scena resta ferma (`.sot-velo`,
  `.sot-modale` in `stile.css`); il velo non si chiude toccandolo: da uno
  scontro si esce rispondendo o scappando. Provato un foglio dal basso:
  compariva dove non si guardava, e la telecamera si spostava da sola.
- **Con uno scontro aperto lo zaino non si apre**: si beve fra un mostro e
  l'altro.
- Misurato: chi corre dritto alla scala sviene una o due volte per discesa,
  chi gira e raccoglie quasi mai.

## Svenire, e il fondo degli svenimenti

- **Svenendo ci si risveglia all'ingresso**, con mezza vita (almeno 6), i
  mostri tornati a casa loro (`rimettiInPiedi`), **metà delle gemme e le
  tasche vuote; quello che si ha addosso resta sempre.** È la regola nata
  nell'abisso, portata nelle sette discese da quando la roba resta: senza, le
  tasche piene di pozioni rialzavano chi risponde male una volta di più.
  Il cartello lo dice prima di «riprovo».
- **Le occasioni sono contate: due più una per piano**
  (`SVENIMENTI_IN_REGALO` + `piani`, da quattro nella cripta a sette nella
  grotta; erano quattro in regalo quando si ripartiva nudi). All'ultima si
  risale con quello che si ha addosso, la tappa non è superata e si rigioca
  da capo. Il cartello dice sempre quante ne restano.
- **Le stelle** (`stelleDella`): tre senza svenire, due con uno, una con di
  più.

## Fra una discesa e l'altra la roba resta

Quello che si ha addosso, nelle tasche e le gemme scende e risale con
l'avventuriero, e le gemme si spendono sopra, dai mercanti. Le regole, le
discese che contano sulla roba e la misura dell'equilibrio:
[la-roba-che-resta.md](la-roba-che-resta.md). Ogni eroe ha la sua avventura
(roba, discese, sosta): [avventure.md](avventure.md).

## Il portale, l'uscita e la sosta

Lasciare una discesa a metà (il portale, la ✕, «lascio perdere»), riprenderla
nel punto esatto e cosa si salva: [portale-e-sosta.md](portale-e-sosta.md).
In due righe: **il portale porta su al villaggio e il gemello riporta giù; la
✕ non è un portale** — porta in home, e rientrando si è già giù.

Nei test: `unita/sotterraneo` (§ «la torcia conta»: la luce senza, con e agli sgoccioli, la sveglia dei mostri),
`integrazione/sotterraneo-luce` (i pixel accesi della tela con, senza e agli sgoccioli; `--scatti` lascia le tre foto),
`unita/sotterraneo-scala-su` (la scala che sale e il bersaglio lontano: [scala-che-sale.md](scala-che-sale.md)),
`unita/sotterraneo` (le sette discese col giocatore finto e la roba di
chi ci arriva, i quattro eroi, le soglie qui sopra), `unita/sotterraneo-roba`
(la roba fra due discese, lo svenimento, la sosta, il portale al posto del
mercante, i banchi del passo), `unita/sotterraneo-storia` (la tabella, chi la
dà, le missioni: [la-grande-storia.md](la-grande-storia.md), [missioni.md](missioni.md)), `unita/sotterraneo-sosta` (la ripresa esatta cosa per
cosa, il peso, il portale), `misure/sotterraneo` (la tabella della storia),
`integrazione/sotterraneo` (ci si arriva con `scendiNelSotterraneo`: la mappa
sta in [terra-di-sopra.md](terra-di-sopra.md)), `integrazione/sotterraneo-portale`
(col dito: porta, mostro ferito, portale, erborista, ritorno nel punto esatto,
la ✕ che porta in home e «riprendi da qui» che riprende giù, senza gemello). Il foglio del
portale: `[data-azione="portale"]`; la tela dice `data-eroe`, `data-eroe-schermo` e `data-scala` per toccare
una cella.
