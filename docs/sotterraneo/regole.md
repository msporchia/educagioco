# Le regole della discesa

Come si scende, quanto costa, chi ti viene addosso, come si combatte, come si
sviene e come si lascia una discesa a metà. La roba (eroi, armi, torcia,
mercante, curiosità) sta in [roba.md](roba.md); il fondo senza fine in
[abisso.md](abisso.md).

Il codice: `src/giochi/sotterraneo/` — `dati/campagna.js` (le sei tappe),
`dati/mondo.js` (passi e tempi), `dati/mostri.js` (`BRANCO`),
`motore/corsa.js` (la discesa), `motore/livello.js` (il piano),
`motore/banco.js` (il giocatore finto che scende davvero).

## La scala e il guardiano

- **La scala è chiusa, e la chiave ce l'ha un guardiano.** I mostri si
  aggirano tutti, quindi senza questa regola si scenderebbe senza una
  domanda: il minimo per scendere è battere il guardiano, il resto è
  facoltativo. La scala ha una grata col lucchetto finché la chiave non è
  presa.
- **Chi porta la chiave lo dichiara la tappa, non il caso** (`guardianoDi`):
  è l'unica cosa del sotterraneo che non si può aggirare.
- **I segni sopra le porte non mentono mai** (`SEGNI` in `dati/cose.js`):
  💀 guardia, 💎 roba buona, 🏪 mercante, ⛲ acqua. La pelle della porta
  ripete il segno col disegno (`dati/tessere.js`). Un segno che promette a
  vuoto diventa decorazione, e tornare indietro diventa una penitenza invece
  di una scelta.
- **Le porte chiudono la stanza, non il varco.** Si sbarrano *tutti* i varchi
  di una stanza, e una risposta li apre tutti: il pedaggio resta uno. Provato
  a chiuderne uno solo: il 💀 si scavalcava dall'altra parte, e dove due
  corridoi si affiancano si passava accanto al battente.
- **Le stanze premio (mercante, fonte, forzieri) si pescano fra le foglie**,
  quelle con un collegamento solo, così non diventano un casello. Prima di
  sbarrarne una si cammina fino alla scala: se non ci si arriva, la stanza
  resta aperta e senza segno.

## Quanto costa una discesa, in domande

Misurato dal banco, una discesa per riga col seme del banco (il numero balla
da un seme all'altro: serve a leggere la forbice, non a confrontare due
tappe):

| discesa | piani | solo il guardiano | tutto il piano |
|---|---|---|---|
| Le cantine | 2 | 14 | 25 |
| Il pozzo | 3 | 38 | 82 |
| Le gallerie | 3 | 40 | 70 |
| La cisterna | 4 | 54 | 88 |
| Il labirinto | 3 | 25 | 102 |
| Il fondo | 4 | 28 | 97 |

- **La forbice è il punto**: se «tutto» costasse quanto «il minimo» non ci
  sarebbe niente da scegliere.
- **Il tetto è una seduta: 85 risposte obbligate.** Oltre è un compito, e
  `unita/sotterraneo` diventa rosso (anche per ognuno dei quattro eroi).
- **Il patto del banco**: rispondendo bene otto volte su dieci si arriva in
  fondo tutte le volte.
- **Stanze per piano: da quattro a sedici** (il labirinto ne ha sedici
  invece di otto). La forma del piano (`misura`, `giri` 2..4) la controlla
  `guastiDellaCampagna`, che pretende anche che ogni tappa chieda più della
  precedente.

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
  fascia in fondo ricalibrava anche le cantine, e la cisterna passava da 36 a
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
  con loro spariva il motivo di cercare una fonte o un mercante. Il conto vero
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

- **Svenendo ci si risveglia all'ingresso**, con metà gemme, mezza vita
  (almeno 6) e i mostri tornati a casa loro (`rimettiInPiedi`). Il cartello
  dice che le gemme in tasca non ci sono più, ma quello che si ha addosso sì.
- **Le occasioni sono contate: quattro più una per piano**
  (`SVENIMENTI_IN_REGALO` + `piani`, da sei nelle cantine a otto nel fondo).
  All'ultima si risale, la tappa non è superata e si rigioca da capo. Il
  cartello dice sempre quante ne restano. Senza tetto la discesa si vinceva
  anche rispondendo giusto quattro volte su dieci.
- **Il numero è misurato**, venti discese per tappa: a otto su dieci si
  arriva in fondo diciotto volte su venti o più; a sei su dieci circa metà;
  a quattro su dieci quasi mai, salvo nelle cantine, che devono perdonare.
  Con tre in regalo cadeva anche chi risponde bene. Le vite degli eroi sono
  tarate con questo tetto (vedi [roba.md](roba.md)).
- **Le stelle** (`stelleDella`): tre senza svenire, due con uno, una con di
  più.

## Fra una discesa e l'altra non resta niente

Dentro una discesa l'equipaggiamento scende con te; fra una e l'altra si
riparte nudi. Restano la campagna (discese superate, stelle) e le monete. Un
equipaggiamento che persiste vuole un'economia — dove si ripara, cosa si
rivende, come non rendere l'ultima discesa una passeggiata — e quella è un
altro gioco; se un giorno la si vuole, si cambia in `dati/campagna.js`.
L'abisso non rompe la regola: è una discesa sola che non finisce.

## Lasciare a metà, e fermarsi

- **Si esce e si riprende** (`motore/sosta.js`, un paio di chilobyte): la
  mappa offre in cima «piano 2 di 3 · ❤️ 14 · 💎 37 — torno giù da dove
  ero». Il piano non si salva, **si rifà dal seme**; si salva ciò che è
  *successo* — chi è caduto, cosa si è aperto, cosa sta per terra, la mappa
  girata.
- **Riprendendo, i mostri sono al loro posto**, come dopo uno svenimento:
  riaprire con l'orco addosso fa pentire di aver ripreso.
- **Si salva sempre**, anche dopo due passi: quello che si perde in una
  discesa appena cominciata è la mappa girata al buio, che è metà del gioco.
- **Formato cambiato, salvataggio non letto**: si ricomincia la discesa.
  `VERSIONE` sale quando un campo *cambia significato*, non per un campo in
  più con un ripiego ovvio. Una partita persa è un dispiacere, una ripresa
  con campi che non tornano è un gioco rotto.
- **Il ⏸ ferma senza uscire** (la pausa comune:
  [../core/interfaccia.md](../core/interfaccia.md#la-pausa-una-sola)); il velo
  dice «piano 2 di 3 · ❤️ 14». Il cartello di un traguardo ferma la discesa.
  Davanti a una domanda il ⏸ non c'è.

Nei test: `unita/sotterraneo` (le sei tappe col giocatore finto, i quattro
eroi, le soglie qui sopra), `unita/sotterraneo-sosta`,
`integrazione/sotterraneo` (`.sot-tappa[data-tappa="0"]` sulla mappa).
