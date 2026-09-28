# La scaletta degli asteroidi

Pianeti (tabelline) e stazioni (calcolo a mente) in una fila sola: come è
ordinata, come si supera una tappa, e come il motore sceglie i calcoli.
Il volo infinito e l'astronave stanno in [volo.md](volo.md).

## Una fila sola

- **Niente «quali tabelline vuoi allenare?»**, e niente «tabelline o conti
  a mente?». Sono domande a cui un bambino non sa rispondere (spuntandole
  tutte, ogni tabellina usciva un decimo delle volte). La fila è una, e
  l'ordine è già deciso. (`src/data/asteroidi.js`, `SCALETTA`, `CAPITOLI`)
- **L'ordine è stato fuso una volta, non alterna a turno.** Il perché di
  ogni giunzione è scritto in testa a `src/data/asteroidi.js`. Tre
  criteri, in ordine di autorità:
  1. **i vincoli misurati** — il grafo dei prerequisiti di
     `src/store/calcolo.js` e le tabelline che un concetto moltiplicativo
     dichiara di volere (`tabelline: N`: 4×23 e 56:8 ne vogliono quattro);
  2. **quanti pezzi si tengono a mente** — il `peso` di un concetto
     (1..3), la `durezza` di una tabellina (`src/store/tabelline.js`);
  3. **il ritmo** — a pari peso si alternano i due mestieri.
- **Da «Passa la decina» le tabelline stanno un passo avanti** (due
  pianeti e una stazione): ogni stazione da lì pesa due, e 27+38 sono tre
  passaggi da tenere in testa mentre 7×8 è un fatto solo. All'arrivo di
  ogni stazione che pesa due, le tabelline fatte sono più delle stazioni
  fatte. Provato: l'alternanza a turno dalla tappa 5 alla 16 — la
  tabellina scorreva, la stazione dopo si incagliava.
- **Il Sole apre il capitolo del moltiplicare a mente**: 56:8 è la
  tabellina dell'8 girata, quindi moltiplicare e dividere a mente vengono
  dopo tutte le tabelline insieme.
- **La fila e l'età dicono la stessa cosa.** Il cancello per età legge la
  `portata` voce per voce, e la prima voce troppo avanti chiude la fila.
  Dentro la fila la portata non scende mai più di cinque punti da una
  voce alla dopo. «Due cifre» e «Riporti e prestiti» stanno a 55 e 58: in
  colonna si fanno in seconda, a mente in terza.

La fila, oggi (22 voci):

| | voce | | voce |
|---|---|---|---|
| 🚀 | Fino al dieci | 🟣 | pianeta del 7 |
| 🛰️ | Oltre la decina | 🌗 | Due cifre |
| 🌍 | pianeta del 2 | 🔵 | pianeta dell'8 |
| 🌕 | pianeta del 10 | 🟤 | pianeta del 9 |
| 🌑 | Amici e decine | ☄️ | Riporti e prestiti |
| 🪐 | pianeta del 5 | 💫 | I quasi tondi |
| 🌒 | Due cifre e una | ☀️ | il Sole (tutte le tabelline) |
| 🔴 | pianeta del 3 | 🌠 | Moltiplicare a mente |
| 🟢 | pianeta del 4 | 🛸 | Dividere a mente |
| 🌓 | Passa la decina | 🌌 | Fino a mille |
| 🟡 | pianeta del 6 | ⭐ | La prova |

## Un contatore, un segno

- **Il contatore è uno** (`mate.fila`): quante voci della scaletta sono
  superate. `mate.tappa` e `calc.tappa` restano nel profilo solo come
  **specchio**, ricavati da `sincronizzaAsteroidi`, per chi parla di una
  campagna sola (i traguardi delle tabelline, la mappa dei concetti). Con
  due contatori in mezzo alla fila si vedevano due tappe aperte e una
  chiusa fra loro.
- **Riordinare la fila non vuole migrazioni**: `sincronizzaAsteroidi`
  rilegge la posizione dai due specchi e tiene la più avanzata, quindi al
  massimo si regala qualche tappa.
- **Accanto a una tappa c'è un segno solo: la ⭐ di «superata».** Quello
  che il motore sa sta nei due conti in cima alla mappa (✖️ n/10 le
  tabelline, 🧠 n/12 i trucchi), in «Cosa so», nell'albo e nei traguardi:
  sono numeri che scendono se non si ripassa, mentre una tappa superata
  resta superata. Un solo cartello a fine tappa («Tappa superata!»), un
  solo trionfo a fila finita.
- **Niente interruttore per togliere il calcolo a mente**, e non si
  rimette: un gioco che a seconda di un flag ne è uno o due è due giochi.
  Chi vuole una scaletta più bassa muove l'età.

## I pianeti

| pianeta | tabellina | il trucco che si dice prima di partire |
|---|---|---|
| 🌍 | 2 | il numero raddoppiato: sono tutti i pari |
| 🌕 | 10 | il numero con uno zero in fondo |
| 🪐 | 5 | finiscono per 5 o per 0: è metà del 10 |
| 🔴 | 3 | 3, 6, 9, 12… come una filastrocca |
| 🟢 | 4 | il doppio del doppio |
| 🟡 | 6 | la tabellina del 3 raddoppiata |
| 🟣 | 7 | metà la sai già dai pianeti di prima, girata |
| 🔵 | 8 | il 4 raddoppiato |
| 🟤 | 9 | una decina meno il numero: 9×6 = 60−6 |
| ☀️ | tutte | l'esame: niente di nuovo, tutto insieme |

- **Ogni pianeta porta una tabellina e tiene le precedenti come ripasso.**
  Si supera con un **bersaglio di partita** — tante giuste, di cui un tot
  sulla tabellina nuova (le «mirate») — e paga in monete la prima volta.
- **Otto domande su dieci parlano della tappa** (`QUOTA_TAPPA` 0,8 in
  `src/store/calcolo.js`), le altre sono ripasso. Con meno la tappa era
  un'attesa, con tutto il pool le tabelline di prima si dimenticavano.
  **La quota ha memoria** (`creaMiscela`, `FINESTRA` 5): mai più di una
  domanda fuori tappa ogni cinque, quindi mai due di fila; il boss conta
  come fuori tappa. La stessa domanda non esce mai due volte di seguito.
- **Il boss** (ogni otto domande) arriva dalla tappa dopo: è un assaggio.
  Dove una tappa dopo non c'è (il Sole, il volo, il pianeta prima del
  Sole) `chiaveDelBoss` ripiega sulla casella più tosta di casa, e quella
  **si segna sul motore** — è roba già insegnata.
- L'insieme in lavorazione **gira a turno fra le tabelline in gioco**, e
  `×1` e `×10` stanno in fondo alla scala di difficoltà: sono regole, non
  fatti da mandare a memoria.
- La ⭐ di una tabellina (nei conti in cima, non nella fila) vuol dire
  **tutte e dieci le caselle imparate** secondo la forza *efficace*: una
  tabellina lasciata lì per un mese la perde.

## Le stazioni del calcolo a mente

Le tabelline sono 55 fatti e finiscono; il calcolo a mente no: 27+38 e
68+75 sono la stessa strategia su numeri diversi.

| | stazione | cosa porta |
|---|---|---|
| 🚀 | Fino al dieci | 3+4 · i doppi · 9−4 |
| 🛰️ | Oltre la decina | 8+5 · i quasi doppi · 13−7 |
| 🌑 | Amici e decine | 7+?=10 · 30+40 · 70−30 · 60+?=100 |
| 🌒 | Due cifre e una | 12+6 · 18−6 · 34+20 |
| 🌓 | Passa la decina | 26+7 · 43−7 |
| 🌗 | Due cifre | 23+45 · 68−25 |
| ☄️ | Riporti e prestiti | 27+38 · 52−27 |
| 💫 | I quasi tondi | 47+29 · 63−29 |
| 🌠 | Moltiplicare a mente | 23×10 · 4×30 · 4×23 · 9×14 · 11×24 · 14×5 |
| 🛸 | Dividere a mente | 56:8 · metà di 68 · 120:4 · quante volte ci sta |
| 🌌 | Fino a mille | 350+200 · 650+?=1000 · 240+130 · 497+298 |
| ⭐ | La prova | tutto insieme, come il ☀️ dei pianeti |

- **Una cosa nuova per tappa, e la cosa nuova è un pezzo in più da tenere
  a mente.** Le fasi della luna sono lì per far vedere che è una salita
  sola: 🌒 la decina sta ferma · 🌓 le unità scavalcano · 🌗 due cifre ma
  le colonne non si parlano · ☄️ il riporto · 💫 si arrotonda e si
  aggiusta.
- **Il `?` in mezzo al conto arriva alla terza tappa**, insieme al
  complemento del cento: «quanto manca» è l'operazione girata, non
  «quanto fa».
- **Il ripasso si misura su quanto porta la tappa** e non la supera mai:
  metà di quello che arriva è il concetto nuovo (`poolDi` in
  `src/store/calcolo.js`). Dandogli «tutto quello che avanza», un pool da
  dodici veniva con undici fatti vecchi e il bersaglio non saliva mai.
  `unita/calcolo` difende la quota e l'ordine dei gradini.
- **Il motore segue il fatto dove i casi sono pochi, la strategia dove
  sono infiniti.** `calc:8+5` è un fatto (dopo `calc:` una cifra),
  `calc:somma-riporto` un concetto (una lettera), e ogni domanda ne è
  un'istanza generata al momento.
- **Tre assi di difficoltà**: quale concetto è aperto (un grafo, e le
  tabelline ci stanno dentro — il generatore moltiplica per quelle che il
  bambino sa), quanto è consolidato (la forza efficace: se cala la ⭐
  della stazione si spegne), quanto sono grandi i numeri (la *taglia*,
  ricavata dalla forza: 27+38 appena aperto, 68+75 consolidato).
- **Il grafo dosa, non sbarra**: una stazione aperta si gioca comunque, e
  i prerequisiti deboli entrano come ripasso accanto ai concetti nuovi.
- **I falsi sono gli errori tipici** (`distrattoriDi` in
  `src/data/calcolo.js`): il riporto dimenticato, la sottrazione a colonne
  in valore assoluto, lo zero in meno. Nessuno fuori scala, almeno due
  accanto al giusto, e ogni tanto tutti da una parte — se no scartare gli
  estremi sarebbe una scorciatoia.
- **Il `peso` si vede nel cielo**: meno asteroidi e caduta più lenta. Un
  3+4 arriva fra sei bersagli, un 497+298 fra tre e col doppio del tempo.
- **Il trucco si dice alla seconda volta storta** dello stesso concetto
  nella stessa partita, non alla prima: un cartello a ogni errore diventa
  rumore. Le dritte si rileggono in 📊 Cosa so → 🧠 A mente.

## Cosa so

Dalla mappa e da fine partita, **📊 Cosa so** apre la tavola pitagorica
dei propri progressi: una casella per calcolo, colorata con la forza
efficace. Risponde a «quali calcoli so», non a «com'è andata stasera». È
una pagina di progressi, vestita come l'albo e la mappa (fondo chiaro,
riquadri bianchi); si esce dal tasto della barra. Le tabelline in gioco
hanno i numeri di riga e colonna accesi, le altre caselle restano smorzate.
(`src/components/MappaTabelline.vue`, `src/components/MappaConcetti.vue`)

Nei test: `unita/asteroidi` cammina la fila con un finto bambino (nessuna
tappa prima di quello che le serve, nessuna quando è già saputa),
`unita/calcolo`, `integrazione/campagna-mate`, `integrazione/calcolo`.
