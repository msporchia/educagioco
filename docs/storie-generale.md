# Le storie del Generale

Cinque storie a capitoli, e non sono una quarta campagna. Le tre campagne
(`docs/campagne-generale.md`) insegnano il vocabolario: una tappa, un ordine
nuovo, si sale la scala e alla fine c'è il drago. Fanno il loro lavoro e
restano dove sono.

Queste stanno all'altra estremità, e sono nate da due frasi:

> «C'è qualcosa di molto strano nelle campagne, sono troppo semplici senza
> complicazioni, solo *impara i tasti*.»
>
> «Deve esserci qualcosa che ti impedisce di fare un gameplay banale sempre
> uguale — vai dalla chiave, uccidi il mostro, apri la porta, prendi il
> tesoro.»

La seconda frase è la diagnosi vera, e vale la pena dirla con precisione: il
problema non è che i livelli siano facili. È che **hanno tutti la stessa
forma**, e una forma sola si impara una volta e poi si esegue. Se la domanda
è sempre «come arrivo là in fondo», la risposta è sempre «di lì», e nessun
ordine nuovo cambia questa faccenda.

I dati stanno in `src/data/storie-generale.js`. Le mappe **non ci sono**:
ogni capitolo ha `mappa: null` e le disegnerà un agente per livello, con
`obiettivo` e `varianti` a dirgli cosa deve venir fuori.

## Le due leve, e sono due sole

### 1. La forma dell'obiettivo

Undici forme, e dentro una storia **due capitoli di fila non hanno mai la
stessa** (`verificaStorie()` lo controlla e fallisce se succede). Per come
sono venute, in queste cinque una forma non si ripete mai nemmeno dentro la
stessa storia.

| forma | cosa vuol dire, e cosa cambia |
|---|---|
| **presa** | alla fine quella cosa deve essere addosso a uno dei tuoi. Dove sono, non conta |
| **consegna** | un oggetto deve arrivare in un posto — e chi lo trova quasi mai è chi lo porta |
| **passaggio** | attraversare senza farsi vedere: chi ti vede chiama, e hai perso anche se non ti ha toccato |
| **scorta** | qualcuno che non sa difendersi deve arrivare intero. Tu ci arrivi facile: il problema è lui |
| **esca** | alla meta ci arriva un altro mentre tu ti fai guardare. Farsi vedere è la mossa, non l'errore |
| **apripista** | la strada deve restare aperta per chi passa dopo, e chi apre non passa |
| **sabotaggio** | una cosa deve smettere di funzionare: un tamburo, una scala |
| **resistenza** | restare dove sei finché un fatto succede. L'avversario è il tempo |
| **interdizione** | impedire che l'altro arrivi da qualche parte: si vince stando dove passerà |
| **fuga** | uscire da dove si è entrati, e tutti quanti: chi resta dentro fa perdere |
| **raduno** | unità sparse che devono ritrovarsi, o uno rimasto indietro da riprendere |
| ~~arrivo~~ | *uno dei tuoi arriva sul forziere.* È la forma di quasi tutti i livelli che esistono, e in queste cinque storie **non compare mai**. `verificaStorie()` fallisce se ricompare |

Non è un vestito diverso sulla stessa partita: cambia **cosa conta**. In un
`passaggio` la vittoria si perde nel momento in cui uno ti guarda, e allora
la vista dei nemici diventa la mappa vera. In una `resistenza` non c'è
nessun posto dove andare e la domanda diventa *quanto* invece che *dove*. In
un'`esca` la cosa migliore che puoi fare è farti trovare, ed è l'unico
posto del gioco in cui un ordine si scrive perché fallisca. Stessi nove
ordini, tre mestieri diversi.

### 2. I fili

Quello che un capitolo lascia e un altro eredita. La lanterna presa nel
primo capitolo serve fino al sesto; la porta lasciata aperta nel secondo è
la via di fuga del quinto; la capra che nel quarto fa da esca resta di là
dal crinale, e il quinto capitolo esiste solo per andarla a riprendere.

È l'unica cosa che trasforma una fila di esercizi in una storia, e insegna
una cosa vera che il gioco non dice da nessun'altra parte: **le conseguenze
durano oltre il momento in cui agisci**.

Nei dati è roba controllata, non buone intenzioni. Ogni storia dichiara i
suoi `fili`; ogni capitolo li nomina in `eredita` e in `lascia`, e la
verifica fallisce se un capitolo eredita qualcosa che nessuno prima ha
lasciato, se un filo dichiarato non lo tocca nessuno, o se in una storia non
c'è **almeno un filo che attraversa tre capitoli**.

## Il nemico reagisce, e quindi il diversivo è una mossa

Il gioco sta andando lì: chi viene attaccato o ti vede **chiama**, e chi
sente **accorre**. Da questa sola regola discendono tre cose che in queste
storie contano più degli ordini:

- **combattere non è gratis.** Menare uno vuol dire chiamarne altri tre, e
  la storia della torre porta questa idea fino in fondo togliendo del tutto
  `attacca` dalla cassetta;
- **attirare qualcuno è una mossa**, non un ripiego. Quattro capitoli su
  ventisei hanno la forma `esca`, ed è la forma più frequente di tutte;
- **la luce, il rumore e il movimento sono strumenti.** Nei Fondi le falene
  vanno dove c'è luce, e la lanterna serve a decidere dove *non* si guarda.

## Com'è fatta una storia

Una storia è una fila di capitoli: il primo è aperto, l'n-esimo si apre
quando l'n−1 è superato. Le cinque storie **non si sbloccano fra loro**:
sono cinque porte aperte, e quella di Bibi dev'essere la prima per chi ha
sei anni.

Un capitolo è:

| | |
|---|---|
| **una riga di racconto** | una o due frasi, mai di più |
| **un obiettivo** | detto in una riga, e con la sua **forma** |
| **un concetto** | il gradino della scala, che è quella delle campagne: non se ne inventa una seconda |
| **una cassetta** | cumulativa, come nelle campagne: quello che entra non esce più |
| **eredita / lascia** | i fili che arrivano da prima e quelli che vanno dopo |
| **tre scene** | la stessa situazione con qualcosa di diverso. Si vince superandole tutte e tre |
| **un par** | il piano più corto che le vince tutte e tre. Due stelle se ci stai dentro con un piano solo |
| **una mappa** | ← non c'è: la disegna un agente per livello |

Il vocabolario è quello del motore, nove ordini: `vai`, `prendi`, `apri`,
`attacca`, `aspetta`, `suona`, `pattuglia … finché`, la guardia `se` e la
testa di lista `quando arriva`. Due avvertenze per chi arriva dalle
campagne: il verbo dei segnali qui si chiama **`suona`** e non «chiama»
(è il nome che usa `data/generale.js`), e **`segui` e `difendi` non
esistono** — nessuna di queste storie ne ha bisogno.

Le condizioni sono **solo percettive**: `vedi [x]`, `ho [x]`, `sono a [x]`,
`è arrivato [segnale]`. Nessuno è onnisciente, e da qui discende metà del
disegno: quello che succede fuori dalla vista di un'unità deve passare per
un annuncio, e per questo `suona` + `quando arriva` non sono un'eleganza ma
l'unico modo. È anche la ragione per cui il diversivo funziona: se il nemico
guarda solo quello che vede, farsi vedere apposta da un'altra parte è
un'informazione che gli metti in mano tu.

---

## Storia 1 — La lanterna dei Fondi 🏮

*Quattro che rubano nella miniera sotto il paese, e una lanterna che si
porta dietro tutto.*

Sei capitoli, e il filo è **un oggetto**. La lanterna si prende nel primo e
serve fino all'ultimo, ma non fa mai lo stesso mestiere: due volte su sei è
un guaio invece che un aiuto, perché chi la porta vede e chi la porta **si
vede**. Da quella riga sola esce mezza storia.

In scena: **Tilde** 🏮 la lanternaia (porta la luce, non mena), **Ras** 🗝️
il ferravecchi (l'unico che apre grate e serrature), **Orso** 🪓 il
boscaiolo (lento, e l'unico che rompe qualcosa), **Bea** 🔔 la staffetta
(corre, si fa vedere e sparisce, e non tiene un colpo).

| # | capitolo | la riga di racconto | obiettivo *(forma)* | concetto | eredita → lascia | in scena |
|---|---|---|---|---|---|---|
| 1 | 📦 Il magazzino | La lanterna sta in magazzino da vent'anni e l'olio è nell'altra stanza. Sotto non si scende senza. | lanterna e olio addosso a Tilde — *presa* | la fila | — → **la lanterna** | Tilde |
| 2 | 🪣 Il pozzo | Il pozzo è l'unica via per i Fondi e sopra c'è una grata chiusa. Giù ci scende Ras: la serratura è roba sua. | la lanterna in fondo al pozzo, addosso a Ras — *consegna* | prima quello | lanterna → lanterna (a Ras), **il pozzo aperto** | Ras |
| 3 | 🦋 Le falene | Nella galleria dormono le falene bianche e la luce le chiama tutte. Chi porta la lanterna non passa. Gli altri, al buio, sì. | Bea e Orso dall'altra parte, Ras fermo con le falene addosso — *esca* | se | lanterna → **le falene vanno alla luce** | Ras, Bea, Orso |
| 4 | ⛏️ La frana | Dietro la frana c'è la galleria vecchia. Chi scava non vede quando è passato abbastanza; chi guarda dall'altra parte non sa scavare. | il varco aperto e tutti e quattro di là — *apripista* | il segnale | lanterna, pozzo → **il varco** | tutti e quattro |
| 5 | 🥁 Il tamburo | Gli orchi hanno un tamburo: chi vede qualcosa lo suona e allora arrivano tutti. Finché c'è, di qui non si passa due volte. | il tamburo sfondato, e nessuno dei nostri preso — *sabotaggio* | finché | lanterna, varco, falene → **il tamburo rotto** | Bea, Tilde, Orso |
| 6 | 🏮 Risalire | L'olio è agli sgoccioli. La strada di casa è il pozzo da cui siete scesi, e si esce in quattro o non si esce. | tutti e quattro fuori dalla grata — *fuga* | tutto insieme | lanterna, pozzo, varco, tamburo, falene → — | tutti e quattro |

Il quinto capitolo è quello che vale il progetto: gli orchi sono troppi e si
chiamano fra loro, quindi **la reazione del nemico diventa lo strumento**.
Bea pattuglia il lato di levante *finché vede una guardia* — cioè finché non
si è fatta vedere — Tilde le sta dietro con la lanterna perché anche la luce
dica «sono di là», e Orso arriva al tamburo dalla galleria vecchia con tutto
il tempo che gli serve.

Il passaggio di mano della lanterna fra Tilde e Ras avviene **fra un
capitolo e l'altro**, non dentro una scena: dentro una scena non si posa
niente per terra, perché il verbo non c'è. Vedi *Quello che mancherebbe*.

---

## Storia 2 — Bibi allo stagno 🦆

*Una bambina, una papera e un pezzo di pane.*

Quattro capitoli per chi ha sei anni. Non è una storia corta: è una storia
con altre regole, le stesse che valgono per Nina — dieci parole al massimo
per riga di racconto, niente segnali, niente cicli, niente condizioni, e
alla fine di ogni capitolo **il premio si vede**. Non si perde: una scena
può non riuscire, e allora si riguarda.

E ha comunque i suoi fili, perché a sei anni quelli funzionano meglio di
tutto il resto: il pane del primo capitolo fa venire Bibi nel secondo, la
tiene dietro nel terzo e la fa scendere in acqua nel quarto.

In scena: **Rosa** 👧, **Bibi** 🦆 la papera (non ascolta nessuno, ascolta
il pane), e **Bombo** 🐕 il cane del vicino, che è del livello.

| # | capitolo | la riga di racconto | obiettivo *(forma)* | concetto | eredita → lascia | in scena |
|---|---|---|---|---|---|---|
| 1 | 🥖 Il pane | Rosa ha una papera. La papera si chiama Bibi. Il pane è in cucina. | il pane in mano a Rosa — *presa* | la fila | — → **il pane** | Rosa |
| 2 | 🦆 Bibi | Bibi non ascolta nessuno. Bibi ascolta il pane. | Bibi accanto a Rosa — *raduno* | da vicino | pane → **Bibi viene dietro** | Rosa, Bibi |
| 3 | 🦴 Bombo | Bombo abbaia a tutti. Non abbaia a chi porta l'osso. | Rosa e Bibi dall'altra parte del cortile, e Bombo che non ha abbaiato — *passaggio* | prima quello | pane, Bibi → **il cancello aperto** | Rosa, Bibi |
| 4 | 💦 Lo stagno | Lo stagno è grande. Bibi non l'ha mai visto. Rosa sì. | Bibi nell'acqua, e l'oca che non l'ha fatta scappare — *scorta* | tutto insieme | pane, Bibi, cancello → — | Rosa, Bibi |

Il secondo capitolo è due liste di ordini invece di una, ed è la stessa
mossa della festa di Nina: Rosa si mette dove vuole lei e **aspetta**, Bibi
va dov'è il pane. Il terzo è la chiave e il portone con un vestito nuovo —
Bombo non abbaia a chi **ha addosso** l'osso — e serve a far capire che una
condizione può guardare quello che tieni in mano, non solo dove sei.

---

## Storia 3 — Il nido di Brasa 🥚

*Stavolta il mostro sei tu, e quelli che salgono sono tanti.*

Cinque capitoli dalla parte di chi di solito è l'ostacolo. Non è «la
fortezza degli orchi» con altri nomi: là si difendeva una fortezza fatta di
mura, qui si difende **un uovo**, e i draghi hanno il problema che ha sempre
avuto il nemico — sono pochi, sono grossi, stanno fermi in un posto solo, e
quelli che arrivano sono tanti, piccoli e scelgono loro quando.

In scena: **Brasa** 🐲 la madre (grande e lenta, e nei cunicoli non passa),
**Cenere** 🐉 il draghetto (piccolo, nero, veloce, e non attacca nessuno),
**Fumo** 🦇 il pipistrello (vede lontano al buio, ma non prende e non mena),
**Roccia** 🪨 il guardiano di pietra (non corre e non si stanca).

| # | capitolo | la riga di racconto | obiettivo *(forma)* | concetto | eredita → lascia | in scena |
|---|---|---|---|---|---|---|
| 1 | 🥚 Il primo ladro | Un uomo con un sacco sta salendo al nido. Sulla neve i suoi passi si leggono. | il ladro non arriva al nido — *interdizione* | la fila | — → **la voce in paese** | Brasa |
| 2 | ❄️ Contarli | Adesso sono in tanti e stanno accampati sotto la parete. Prima di decidere bisogna sapere quanti sono. | Cenere attraversa l'accampamento e torna, senza che nessuno lo veda — *passaggio* | se | voce → **il conto** (da qui il loro piano si legge) | Cenere |
| 3 | 🔔 Il richiamo | Le corde stanno in mezzo all'accampamento, e senza corde alla parete non si sale. | le corde al nido, e nessuno dei nostri visto — *esca* | il segnale | conto → **le corde** | Fumo, Cenere, Brasa |
| 4 | 🪜 La scala di legno | Senza corde si sono messi a costruire. La scala è a metà parete e in due notti è finita. | la scala giù — *sabotaggio* | finché | corde → **la scala rotta** | Roccia, Fumo, Cenere |
| 5 | 🌅 La notte del nido | Stanotte vengono tutti e salgono a mani nude. Se il nido regge fino all'alba se ne vanno. | l'uovo ancora nel nido quando è giorno — *resistenza* | tutto insieme | voce, conto, corde, scala → — | tutti e quattro |

Il primo capitolo porta **tre ordini invece di uno**, ed è voluto: `vai`,
`aspetta`, `attacca` sono il gesto della guardia e sono una frase sola —
mettiti dove passerà, stai lì, e quando arriva fermalo. La storia comincia
da lì perché è tutta lì: Brasa dietro a un uomo non lo prende mai.

Il filo lungo è una catena di conseguenze, e si legge senza spiegazioni: hai
fermato il primo ladro, e lui è tornato a valle a raccontare; sono venuti in
sei, e gli hai preso le corde; senza corde si sono messi a costruire una
scala, e gliel'hai buttata giù; l'ultima notte salgono a mani nude, e hanno
una strada sola. **Ogni capitolo è il guaio che ha creato quello prima.**

---

## Storia 4 — La carovana del sale 🧂

*Un carro che va piano, una strada lunga, e nessuno che vale da solo.*

Sei capitoli, e il taglio è: niente è tuo tranne il carro. Non c'è un posto
da prendere e non c'è un nemico da battere — c'è un carico da far arrivare,
e ogni capitolo è un modo diverso di far arrivare qualcosa da qualche parte.
Qui si perde tempo, non vite.

In scena: **nonna Rea** 🧓 (guida il carro, va piano, non mena e non lascia
il carro), **Vito** 🛡️ la scorta (l'unico che regge un colpo e l'unico che
ne dà), **Bugo** 🔧 il carradore (apre sbarre, casse e lucchetti), **Sisa**
🐐 la capra (va dove il carro non va, e corre più di tutti).

| # | capitolo | la riga di racconto | obiettivo *(forma)* | concetto | eredita → lascia | in scena |
|---|---|---|---|---|---|---|
| 1 | 🌅 Si parte all'alba | Il carro parte quando suona la campana, con o senza di te. Il sale è nel magazzino e i tre sono sparsi per il paese. | i tre al carro e i sacchi caricati prima della campana — *raduno* | la fila | — → **il sale** | Rea, Vito, Bugo |
| 2 | 🚧 La sbarra del pedaggio | La sbarra si alza solo dalla garitta, e nella garitta il carro non ci entra. Il gabelliere dorme. | il carro dall'altra parte, e il gabelliere che dorme ancora — *apripista* | da vicino | sale → **la sbarra alzata** | Bugo, Rea, Vito |
| 3 | 🐺 I lupi del passo | Nonna Rea non corre e non mena, e i lupi lo capiscono prima di te. Una capra si è messa dietro al carro. | Rea e il carro al rifugio, interi — *scorta* | se | sale → **Sisa** | tutti e quattro |
| 4 | 🔥 I fuochi del crinale | I briganti sono più di noi e stanno più in alto. Ma guardano dove si muove qualcosa, e Sisa corre più di tutti. | il carro passa sotto il crinale mentre loro guardano di là — *esca* | il segnale | Sisa, sale → **Sisa è rimasta di là** | tutti e quattro |
| 5 | 🧗 Il crinale | Sisa non è tornata. È lassù e i briganti risalgono. Il carro fin là non ci arriva. | tenere l'imbocco finché Sisa è giù — *resistenza* | finché | Sisa → **Sisa è tornata, e conosce il versante** | Vito, Sisa, Bugo |
| 6 | 🥖 Il forno del paese | Il sale è per il forno, e il forno apre all'alba. L'ultimo tratto è quello dove ti aspettano. | i sacchi dentro il forno — *consegna* | tutto insieme | sale, sbarra, Sisa → — | tutti e quattro |

Il filo che conta non è il sale: è **Sisa**. Arriva da sola al terzo
capitolo senza che nessuno la chiami, nel quarto fa da esca e resta di là
dal crinale, il quinto capitolo esiste solo per andarla a riprendere, e
nell'ultimo è quella che sa la scorciatoia. È l'esempio che il papà aveva in
testa — *il compagno salvato nel terzo combatte con te nel quinto* — messo
dove pesa: chi non la riprende finisce la storia in tre.

Il quinto capitolo è anche l'unico posto in cui `pattuglia` non serve a
cercare ma a **coprire**: due imbocchi e un uomo solo, e la larghezza del
giro è una scelta vera (largo copre tanto e di rado, stretto il contrario).

---

## Storia 5 — I prigionieri della torre 🗝️

*Quattro che devono uscire, e nessuno che sappia menare.*

Cinque capitoli con una regola sola, dichiarata in cima e mai tradita:
**nessuno dei quattro sa `attacca`**, e quel verbo non entra in cassetta in
nessun capitolo. Non è una dimenticanza: è il vincolo che rende impossibile
il gameplay banale. Non c'è un mostro da togliere di mezzo — c'è gente che
guarda, e ci si passa in mezzo.

Ed è la storia in cui **non c'è nessun tesoro**. Il primo capitolo serve al
secondo, il secondo lascia aperta la porta con cui si esce nel quinto, e
l'obiettivo di tutta la storia è arrivare al capitolo dopo.

In scena: **Marta** 🪡 la sarta (con un ago apre qualunque serratura),
**Cric** 🐭 il topo (passa sotto le porte e porta cose piccole, non apre
niente), **Nilo** 🪶 il copista (legge i turni delle guardie), **il vecchio
Pero** 🧓 (cammina piano e non si difende, ma sa dov'è ogni cosa).

| # | capitolo | la riga di racconto | obiettivo *(forma)* | concetto | eredita → lascia | in scena |
|---|---|---|---|---|---|---|
| 1 | 🗝️ Sotto la porta | La chiave della cella è appesa nel corridoio, a due passi e dall'altra parte del ferro. Sotto la porta passa solo Cric. | la chiave dentro la cella, in mano a Marta — *consegna* | la fila | — → **la chiave** | Cric, Marta |
| 2 | 🚶 Il turno della guardia | La guardia fa sempre lo stesso giro, e i suoi ordini sono scritti sulla lavagna. Il corridoio è libero per il tempo che ci mette a girarsi. | tutti e quattro oltre il corridoio, senza allarme — *passaggio* | aspetta che | chiave → **la porta di servizio, lasciata aperta** | tutti e quattro |
| 3 | 🧓 Pero | Pero cammina piano e non corre per nessuno. Ma sa dov'è il pozzo, e nessuno di voi lo sa. | Pero arriva alla cucina intero — *scorta* | il segnale | porta → **Pero, e quello che sa** | Pero, Nilo, Marta |
| 4 | 🪣 Il pozzo | Nel pozzo c'è la corda per il muro, e sul pozzo c'è una guardia che non si sposta mai. | la corda in mano a Marta — *esca* | finché | Pero → **la corda** | Nilo, Marta, Cric |
| 5 | 🌙 La porta di servizio | La corda serve per il muro, ma il muro è dopo il cortile. Si esce dalla porta lasciata aperta tre notti fa, e si esce in quattro. | tutti e quattro fuori dalle mura — *fuga* | tutto insieme | porta, corda, Pero → — | tutti e quattro |

Il quarto capitolo contiene l'ordine più strano di tutto il Generale: Nilo
pattuglia il porticato **finché la guardia lo vede**. È l'unico ordine che
si scrive perché fallisca — la condizione d'uscita è essere scoperti — e a
un bambino che ha passato tre capitoli a nascondersi fa lo stesso effetto
che fa `pattuglia` dopo dieci righe uguali: è un rovesciamento, e si
ricorda. La parte che si dimentica è che a Nilo serve anche una strada per
tornare.

Il terzo capitolo è la scorta fatta come va fatta: **Pero non decide
niente**. Nilo va avanti, guarda, e suona «✅ tutto libero»; la lista di
Pero comincia con «quando arriva». Chi fa partire Pero da solo lo fa partire
sempre un momento prima o un momento dopo di quello giusto, ed è
esattamente la lezione dei segnali vista dal lato di chi protegge.

---

## Quello che mancherebbe

Tre cose. **Nessun capitolo le usa**: sono proposte, e finché non esistono
le storie stanno in piedi lo stesso, con la strada più lunga scritta
accanto. Stanno anche nei dati, in `PROPOSTE`.

| proposta | dove servirebbe | cosa costa |
|---|---|---|
| **`lascia [oggetto]`** — posare per terra quello che si ha addosso | Fondi, capitoli 2 e 3: la lanterna passa di mano fra Tilde e Ras, e oggi il passaggio avviene fra un capitolo e l'altro perché dentro la scena non si può fare. Con `lascia`, il terzo capitolo diventa un'altra cosa: la luce si posa dove vuoi tu e chi la posa se ne va al buio | un verbo in più e un'idea nuova (un oggetto può stare a terra e cambiare padrone). Piccolo |
| **`chiudi [x]`** — il gemello di `apri` | Torre 5 e Nido 5, dove chiudere una porta alle spalle di chi ti insegue vale quanto aprirla. Oggi il filo «la porta lasciata aperta» funziona **solo** perché nessuno la può richiudere: è una fortuna, non un disegno | quasi zero come verbo, ma cambia il mondo: se le porte si chiudono, tutti i livelli esistenti vanno riguardati |
| **`attacca` puntato a una cosa** — non un verbo nuovo, un complemento nuovo | Fondi 5 (il tamburo) e Nido 4 (la scala), cioè tutte e due le volte che l'obiettivo è `sabotaggio`. Senza questo, quella forma d'obiettivo non esiste | nessuna parola nuova da imparare, e una forma d'obiettivo in più. È la proposta che conviene di più |

Una quarta cosa, più piccola: le condizioni percettive scritte nei dati
(`vedi`, `ho`, `sono a`, `è arrivato`) includono **`ho [x]`**, che serve al
terzo capitolo di Bibi — Bombo non abbaia a chi ha addosso l'osso. Se nel
motore la guardia sa guardare solo quello che vede, quel capitolo va
riscritto o `ho` va aggiunto: è la condizione più facile da spiegare a sei
anni, e sarebbe un peccato perderla.

## Cosa non c'è

- **Le mappe.** Tutte e ventisei. `senzaMappa()` le elenca; quello che il
  disegnatore deve sapere sta in `obiettivo` (quando è vinta) e in
  `varianti` (cosa cambia fra le tre scene).
- **I par veri.** Quelli scritti sono contati sulla mappa che avevamo in
  testa. Quando la mappa esiste si rimisurano giocandola, come per il
  castello: non si aggiustano a occhio.
- **Le condizioni di sconfitta scritte per esteso.** In un `passaggio` «ti
  hanno visto» è una sconfitta e non un incidente, in una `fuga` lo è
  «qualcuno è rimasto dentro». Oggi stanno dentro la riga di `obiettivo`, in
  italiano; quando la mappa avrà un formato andranno scritte come si scrive
  `sconfitta` in `data/generale.js`.

## I capitoli più deboli

Vanno detti adesso, prima di provarli, perché sono i primi da rifare.

- **Bibi 4 (Lo stagno).** È l'unico capitolo `scorta` di tutta la storia più
  semplice, e la scorta è la forma più difficile che c'è: chiede di pensare a
  qualcuno che non sei tu. A sei anni può reggere solo perché il pericolo è
  un'oca che soffia e il peggio che succede è che Bibi scappa via — se alla
  prova risultasse frustrante, la via d'uscita è togliere l'oca e lasciare
  che il capitolo sia una `consegna` (Bibi allo stagno e basta), accettando
  che la storia finisca con una forma già usata.
- **Fondi 4 (La frana).** È il capitolo del segnale, e il segnale ce l'ha
  anche l'ingranaggio del dungeon: due tappe che raccontano la stessa cosa
  con due arredi diversi. La differenza c'è (là chi apre non vede il ponte,
  qui chi scava non sa quanto manca, e sono due ignoranze diverse) ma è
  sottile, e se giocandolo risultasse un doppione va fuso con il quinto.
- **Sale 1 (Si parte all'alba).** Tre unità nel primo capitolo di una
  storia è tanto, e il `raduno` è la forma con meno tensione di tutte:
  nessuno ti guarda, c'è solo una campana. Regge se e solo se la campana
  stringe davvero; se non stringe è un capitolo di trasporto sacchi.
- **Nido 1 (Il primo ladro).** Porta tre ordini insieme, ed è la scelta più
  esposta del progetto. La difesa è che sono una frase sola e che sono *la*
  frase di quella storia; il rischio è che un bambino che comincia da qui
  (le cinque storie sono tutte aperte) si trovi tre parole nuove in faccia
  al primo capitolo.
- **La forma `esca`, che ricorre quattro volte** su ventisei, più di ogni
  altra. È la forma più bella e la più a rischio: se il motore fa accorrere
  i nemici sempre nello stesso modo, quattro capitoli diventano lo stesso
  capitolo. Il correttivo non sta nelle storie, sta nel motore — chi accorre
  deve accorrere *dove ha visto*, e non tutti insieme.
