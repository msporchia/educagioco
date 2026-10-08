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
- **La stanza del mercante ha il portale** (più sotto, «Il portale»): il
  mercante sta sopra ([terra-di-sopra.md](terra-di-sopra.md#i-mercanti)), e
  il portale porta da lui. Stessa pesca e nessun tiro in più, così il piano
  nasce uguale a prima; la stanza non ha porta, la strada di casa non si
  paga. Vale anche nell'abisso. Provato: una seconda fonte al posto del
  mercante; l'utente ha voluto il portale alla Diablo.

## Quanto costa una discesa, in domande

Misurato dal banco, una discesa per riga col seme del banco e la roba con cui
ci si entra secondo la storia (`robaAttesa`, il cavaliere: [la-grande-storia.md](la-grande-storia.md);
il numero balla da un seme all'altro: serve a leggere la forbice, non a
confrontare due tappe):

| discesa | piani | solo il guardiano | tutto il piano |
|---|---|---|---|
| La cripta dell'altare | 2 | 14 | 26 |
| La scalinata antica | 2 | 22 | 99 |
| La torre in rovina | 3 | 35 | 82 |
| La grotta della scaletta | 5 | 48 | 76 |
| La scala sommersa | 3 | 43 | 89 |
| La botola segreta | 3 | 58 | 172 |
| La miniera abbandonata | 4 | 39 | 142 |

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

## Le tre luci e la mappina

Nero = mai stato. Scuro e freddo = ricordato. Pieno e caldo = lo stai
guardando. Un sotterraneo tutto illuminato è una piantina, e su una piantina
non c'è niente da esplorare. La piantina c'è — la **mappina** in alto a
destra — e mostra solo il visto più tre punti: dove sei, la scala, chi ha la
chiave.

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

- **I mostri dormono finché non entri nella loro stanza, e smettono appena
  esci.** Uno che insegue per tutto il piano farebbe una fuga continua, uno
  fermo un percorso a ostacoli: così il corridoio è sicuro e la soglia è una
  decisione.
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

Nei test: `unita/sotterraneo` (le sette discese col giocatore finto e la roba di
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
