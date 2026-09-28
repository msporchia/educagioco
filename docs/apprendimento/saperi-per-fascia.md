# Cosa una fascia dà per scontato — il giro completo

**Questo file è la ricerca, con la fonte accanto a ogni riga.** È stato
applicato a `saperi:` in [`src/data/partenze.js`](../src/data/partenze.js),
**ma non alla lettera**: tre delle decisioni sono state prese diversamente
da come le propone il seguito, e dove il testo dice «la proposta» va letto
sapendo quello che segue.

## Cosa è finito nel codice, e cosa no

**Il criterio è cambiato, ed è la cosa più importante di questo giro.**
Non si spegne quello che a scuola non è ancora stato fatto: si spegne
**quello che non si può insegnare in una carta**. Una domanda su un
concetto nuovo che sta in una riga di spiegazione non è muta — è una
lezione, ed è il mestiere per cui i moduli hanno un `aiuto`. La regola sta
scritta in testa a `partenze.js`, che è dove si decide la prossima volta.

Da lì, le differenze:

| voce | la proposta qui sotto | cosa è stato fatto |
| --- | --- | --- |
| `stima` in `terza` | spegnere | **resta accesa**: le sue tre tipologie hanno già un `aiuto` che insegna («47 sta fra 40 e 50: l'ultima cifra è 7, quindi si va su»), e toglierla toglierebbe una lezione invece di una presa in giro |
| `spazio-mente` e `solidi` in `terza` | gruppo intero | **sottovoci**: `geo:rotazione`, `geo:cubetti`, `geo:sviluppo`, `geo:viste`. Restano accesi la figura allo specchio (seconda), i nomi dei solidi (prima) e il contare le facce, che sono cose che il bambino ha |
| `adattamento` in `prima` e `piccoli` | spegnere | applicato |
| migrazione dei profili | nessuna | **fatta**, in `store/profile.js` (`SAPERI_ARRIVATI`), in base all'età impostata |
| il campo `tiene:` | proposto | **fatto**, con i due controlli in `test/unita/partenze` |

I due ritocchi che le sottovoci costavano sono stati pagati tutti e due:
`test/unita/partenze` adesso legge i moduli di quiz dalla cartella per
sapere quali tipologie esistono e quali gruppi coprono, e `spentoDi` in
`data/quadro.js` guarda anche `c.tipo` — senza, la riga di una sottovoce
spenta finiva sotto «• altro», cioè in un posto dove un grande non la
cerca e da cui non potrebbe rimetterla.

**La misura è stata rifatta col diff vero** (più piccolo di quello
proposto). A 8 anni le classi ammesse passano da 82 a 81 e la varietà
effettiva con la carta tosta da 25,3 a 24,3; a 8,5 da 15,3 a 14,4.
Nessuna fascia scende sotto i 17 moduli vivi su 18 in terza, e l'unico
muto resta `misure`, che lo era già. In `piccoli` e in `prima` non cambia
**niente di misurabile**: l'unica classe di `adattamento` sta a 50 (otto
anni) e a quelle età il suo peso è già nullo — spegnerla lì è una
dichiarazione per il giorno che il catalogo cresce, non un taglio.

## Il fatto da cui si parte

Una bambina di terza elementare si è trovata davanti «Arrotonda 47 alla
decina più vicina», e il concetto di arrotondare a scuola non l'aveva
ancora incontrato. Non è una domanda *difficile*: è una domanda **muta** —
non c'è niente da ragionare, si può solo tirare a caso.

Il meccanismo funziona esattamente come è disegnato. `num:arrotonda` è il
grado 6 di `quiz/moduli/numero.js`, che dichiara `livelli: [0, 12, 25, 38,
56, 75]`: il grado 6 sta a **75**, cioè dieci anni. A otto anni
l'ammissione arriva a `50 + 25 = 75`, quindi la domanda entra — sul bordo
esatto — nella fascia «difficili, ma ce la può fare». Nessun guasto.

Il difetto sta nell'elenco: la fascia `terza` spegne
`['divisioni', 'misure', 'conversioni']` e basta. `stima` — il gruppo che
tiene insieme `num:stima`, `num:arrotonda` e `num:grandezza` — era rimasto
acceso **senza che nessuno l'avesse deciso**.

È lo stesso identico difetto già trovato e sistemato sulla fascia
`piccoli`, dove l'elenco era stato scritto pensando alla matematica di
scuola e *leggere le parole*, *la simmetria* e *le analogie* erano rimaste
accese per omissione. Il commento lungo dentro `partenze.js` lo racconta;
questo giro è quel gesto applicato alle altre tre fasce.

## Come si è misurato

Niente giudizio a occhio. Per ogni fascia si è preso il catalogo intero, si
è applicata la finestra di ammissione della sua età (`finestraDi` in
`quiz/nucleo/classi.js`: 44 punti sotto, 25 sopra) e si è misurato **quanto
pesa ogni gruppo di sapere** con la carta debole, media e tosta — cioè con
la campana vera (`bersaglio` · `bandaPer` · `pesoDi`), non con l'elenco di
cosa esiste. Una riga che esiste può uscire una volta su trenta; una che
pesa il 12 % è quello che il bambino vede davvero.

`npm run quiz:eta` fa la stessa fotografia ma **non sa niente dei saperi
spenti**, ed è esattamente la parte che serviva qui: gli script di questo
giro stanno nello scratchpad della sessione, non in `strumenti/`.

### Cosa arriva oggi a una terza, con la carta tosta

A otto anni, manopola 0.85 (mira 69 ≈ 9,6 anni), sommando per gruppo:

| gruppo | quota dei tiri | la classe più alta che consegna |
| --- | --- | --- |
| deduzione | 13,2 % | 🔎 indizi g5 (75) — *ragionamento, non scuola* |
| area-perimetro | 12,2 % | 🗺️ area e perimetro sulla griglia (69) |
| tempi-verbali | 10,8 % | 🗣️ scegliere il tempo che la frase chiede (75) |
| problemi | 10,1 % | 📝 tre conti di fila (75) |
| lessico | 8,3 % | 📖 i modi di dire (75) |
| orologio | 6,3 % | 🕰️ i minuti, g5 (75) |
| date | 5,9 % | 📅 quanto dura una cosa (63) |
| analisi | 5,1 % | 🔤 soggetto e predicato (69) |
| **spazio-mente** | **4,9 %** | 📐 cubetti nascosti · sviluppo del cubo (75) |
| **stima** | **4,2 %** | 🔢 arrotonda · circa quanto fa · ordine di grandezza (75) |
| moltiplicazioni | 4,0 % | 📝 tre conti coi gruppi (75) |
| **solidi** | **1,4 %** | 📐 nomi · viste dall'alto · contare le facce (56) |

I tre in grassetto sono quelli che il giro propone di spegnere. `stima`
arriva **solo dagli otto anni in su**: a 7,5 la finestra si ferma a 68,75 e
quelle tre classi non entrano affatto. A 8,5 sale al 6,2 %.

## Il criterio: muta contro difficile

Sono due cose diverse e si confondono facilmente.

- **Difficile ma sensato** — il concetto ce l'ha, la domanda è solo tosta.
  *Resta accesa*: è il senso stesso della fascia «difficili, ma ce la può
  fare». Tre conti di fila a otto anni sono faticosi, non muti — sommare e
  sottrarre li sa fare, il salto è tenere il filo.
- **Muta** — il concetto a scuola non gliel'hanno ancora dato, quindi non
  c'è niente da ragionare. *Va spenta.*

Il metro è **il programma della scuola primaria italiana**, non quanto la
domanda sembri difficile. Con due eccezioni dichiarate:

1. **I gruppi di ragionamento** (`materia: 'ragionamento'` in `saperi.js`:
   deduzione, incertezza, insiemi, confronti, analogie, sequenze) non hanno
   una lezione da aver fatto, e `saperi.js` lo dice già: il criterio non si
   applica a loro. `deduzione` è il primo gruppo per peso a otto anni e
   resta acceso.
2. **Quello che la scuola non dà affatto.** È la stessa distinzione di
   `data/portata.js` fra «2×2 a nove anni» e «*dog* a dieci anni»: sapere
   che il leone vive nella savana arriva dai libri illustrati e dai cartoni,
   non da un'ora di geografia. Vale per `ambienti` — vedi sotto, dove il
   programma dice «quarta» e la proposta è comunque di lasciarlo acceso.

### Nota metodologica sulle fonti

**Le Indicazioni Nazionali 2012 non assegnano gli argomenti a singole
classi**: fissano gli obiettivi *al termine della terza* e *al termine
della quinta*
([DM 254/2012](https://www.mim.gov.it/documents/20182/51310/DM+254_2012.pdf)).
Per la classe esatta le fonti sono curricoli verticali di istituti
comprensivi e materiali didattici, citati riga per riga. Dove si
contraddicono è scritto.

## La proposta, riga per riga

### `terza` (8 anni) — tre gruppi da aggiungere

| gruppo | verdetto | perché, e la fonte |
| --- | --- | --- |
| **`stima`** | **spegnere** | Indicazioni 2012, obiettivi **al termine della quinta**: «Stimare il risultato di una operazione». Le Indicazioni 2025 aggiungono lì l'ordine di grandezza: «Utilizzare il concetto di **ordine di grandezza**» e «riconoscere i contesti in cui è appropriato effettuare una stima» ([curricolo IC Liguria-Rozzano che le cita](https://icsliguriarozzano.edu.it/wp-content/uploads/2026/01/CURRICULO-VERTICALE-IN-2025.pdf)). Programmazione **classe quarta** IC Colombo: «Dare stime per il risultato di un'operazione» ([PDF](http://www.iccolombo.it/uploads/programmazioni%20primaria/classi%20quarte/PROGRAMMAZIONE%20MATEMATICA%20CLASSI%204.pdf)). «Controllare la plausibilità di un calcolo» — cioè `num:grandezza` — nelle IN 2012 compare **solo alla secondaria**. |
| **`spazio-mente`** | **spegnere** | Le sue quattro tipologie: **rotazioni = quarta** («Eseguire concretamente rotazioni e traslazioni di oggetti», [IC Lariano](https://comprensivolariano.edu.it/archivio/attachments/article/2452/curricolo%20verticale%20d'istituto%20MATEMATICA.pdf); «Riconoscere ed eseguire traslazioni e rotazioni», [programmazione cl. quarta](https://www.risorsedidattichescuola.it/files/matematica-classe-quarta-programmazione-didattica-annuale.pdf)); **sviluppo del cubo = quinta** ([impariamoinsieme](https://www.impariamoinsieme.com/lo-sviluppo-dei-solidi/)); i **cubetti nascosti** non sono documentati in nessun curricolo, e stanno a 75. L'unico pezzo di seconda è `geo:specchio` — vedi «il gruppo troppo grosso». |
| **`solidi`** | **spegnere** | I **nomi** dei solidi sono di prima-seconda ([IC Alessandria Spinetta](https://www.icalessandriaspinetta.edu.it/wp/wp-content/uploads/2022/09/MATEMATICA-curricolo_verticale_2020_2021.pdf), cl. prima: «Figure geometriche piane e solide»), ma gli altri due terzi del gruppo sono di quinta: **viste dall'alto** — IN 2012, fine quinta: «Riconoscere rappresentazioni piane di oggetti tridimensionali, **identificare punti di vista diversi di uno stesso oggetto (dall'alto, di fronte, ecc.)**»; **contare le facce** — IC Colombo, **classe quinta**: «I solidi: classificazione, spigoli, vertici, facce». |

**E questi restano accesi**, contro l'ipotesi di partenza — sono i casi in
cui la fonte ha ribaltato il sospetto:

| gruppo | perché resta |
| --- | --- |
| `area-perimetro` | Il **concetto** è di terza: IC Lariano e IC Colombo lo elencano fra le conoscenze di classe terza («Il perimetro di un poligono», «L'area di un poligono»). Le domande del gioco sono proprio la forma d'ingresso — contare i quadretti e i passi del bordo — non le formule, che sono di quinta. È «difficile ma sensato», ed è il gruppo più pesante di tutti (12,2 %): spegnerlo sarebbe la correzione più costosa del giro, fatta contro la fonte. |
| `analisi` | Parti del discorso: **terza** ([IC Foscolo](https://www.icfoscolo.org/wp-content/uploads/2022/09/CURRICOLO-VERTICALE-ITALIANO.pdf)); nomi propri e comuni: **seconda**. Solo `gram:soggetto-predicato` (69 ≈ 9,5 anni) è di quarta — ed è già dichiarato quasi lì. |
| `tempi-verbali` | I tempi dell'indicativo sono di **terza**: IC Russi mette «I tempi verbali» fra le conoscenze di classe terza; [Maestra Ilaria](https://maestrailaria0.altervista.org/il-modo-indicativo-classe-3/): in terza «si comincia con il presente insieme al passato prossimo». |
| `orologio` | **Seconda** per ore, mezze, quarti e minuti ([PianetaBambini](https://pianetabambini.it/imparare-leggere-orologio-schede-didattiche-esercizi/): «rivolta ai bambini che frequentano la seconda elementare»); **terza** per la lettura nel nucleo *La misura* ([programmazione cl. terza](https://www.risorsedidattichescuola.it/files/matematica-classe-terza-programmazione-didattica-annuale.pdf)). Il «fra 40 minuti» è di quarta, ma è un conto, non un concetto nuovo. |
| `problemi` | Due operazioni: **terza**. Dati inutili: **terza** («Individuare nel testo di un problema le informazioni superflue, mancanti e nascoste», programmazione cl. terza). I tre conti di fila non sono documentati come soglia a sé, e comunque restano un conto in più, non un concetto in più. |
| `decine` | Valore posizionale fino alle migliaia: **terza** (IC Russi, cl. terza: «fino alle unità di migliaia, avendo consapevolezza del valore posizionale»). |
| `date` · `calendario` | Durata e calendario: **prima-seconda**; IN 2012 fine terza (storia) citano orologio e calendario fra gli strumenti convenzionali. |
| `lessico` | Sinonimi e contrari sono di **prima-seconda** (IC Foscolo: «Riconoscere coppie di sinonimi e contrari molto comuni»). I modi di dire compaiono fra le conoscenze già di prima-seconda-terza in IC Russi; il *senso figurato* formalizzato è di quinta, ma `less:modo-di-dire` non chiede di formalizzarlo. |
| `accenti` · `suoni-difficili` | **Seconda** e **prima**: IC Russi, cl. seconda, testuale: «accenti, monosillabi, elisione, … uso della lettera "h"»; cl. prima: «sci/sce; … gna, gne…; CQU; le doppie». |
| `flessione` · `presente` · `figure` · `simmetria` | Tutti di prima o seconda. |
| `ambienti` · `adattamento` | Vedi sotto: `ambienti` resta per la seconda eccezione al criterio, `adattamento` è di fine terza e a otto anni ci siamo. |
| `moltiplicazioni` | Resta acceso per scelta esplicita della fascia («Moltiplicazioni sì, divisioni no»), e le fonti la confermano. |

### `prima` (6,5 anni) — un gruppo da aggiungere

| gruppo | verdetto | perché, e la fonte |
| --- | --- | --- |
| **`adattamento`** | **spegnere** | «Il corpo dice il posto»: il pelo bianco vuol dire gelo, le zampe palmate l'acqua. È un obiettivo **al termine della classe terza**: IN 2012, *L'uomo i viventi e l'ambiente*, «Riconoscere in altri organismi viventi, **in relazione con i loro ambienti**, bisogni analoghi ai propri». A 6-7 anni non c'è, e oggi vale il **4,9 % dei tiri con la carta tosta**. `saperi.js` lo dichiara già «il gradino sopra» rispetto ad `ambienti`: era rimasto acceso per omissione, esattamente come `stima` in terza. |

E c'è **un candidato che si può prendere solo con una sottovoce**:
`geo:angoli` — «gli angoli: retto, acuto, ottuso», dichiarato 56 (8,5
anni) e ammesso a 6,5 anni, dove vale il 2,1 % dei tiri con la carta
tosta. Il *concetto* di angolo è di terza, ma **classificarli per nome è
di quarta**: [programmazione cl. quarta](https://www.risorsedidattichescuola.it/files/matematica-classe-quarta-programmazione-didattica-annuale.pdf),
testuale, «Distinguere e denominare angoli di varie ampiezze (acuto,
ottuso, retto, piatto, concavo…)»; stessa collocazione in IC Russi, IC
Lariano e IC Spinetta. Spegnere il gruppo `figure` per prenderlo non si
può — porterebbe via «come si chiama questa figura» e «quanti lati ha»,
che a sei anni sono il pane — quindi o si passa dalle sottovoci o si
lascia stare. A 2,1 % la seconda è difendibile.

`ambienti` invece **resta acceso**, e la fonte va contro: i biomi mondiali
(savana, deserto, foresta pluviale, regioni fredde) sono **geografia di
classe quarta** ([IC Brivio](https://www.icbrivio.edu.it/wp-content/uploads/2019/12/geografia-OK.pdf)),
mentre in seconda-terza si lavora sugli ambienti vicini. Si tiene lo stesso
per la **seconda eccezione al criterio**: «dove vive il pinguino» non è
roba che arriva da scuola, e `saperi.js` lo dice già nel commento della
fascia `piccoli` («roba che arriva dai libri illustrati, non dalla scuola»).
Vale la pena però correggere il commento di `ambienti` in `saperi.js`, che
oggi dice «roba di seconda e terza».

### `piccoli` (5 anni) — un gruppo, per nidificazione

| gruppo | verdetto | perché |
| --- | --- | --- |
| **`adattamento`** | **spegnere** | Solo per tenere la scala annidata: `test/unita/partenze` pretende che una fascia spenga tutto quello che spegne la fascia più grande. A cinque anni non cambia niente di visibile — l'unica classe di `adattamento` sta a 50 (otto anni), fuori dalla finestra, e infatti il quadro dei grandi già non la elenca. |

### `quarta` (9,5 anni) — niente, ed è stato verificato

La quarta oggi non spegne nessun sapere, e il giro dice che è giusto così.
A 9,5 anni la finestra arriva a **94**: tutto quello che sta a 95 — i tempi
composti, il passato remoto, il condizionale, il congiuntivo, l'imperativo,
le parole difficili — o è già `difetto: false` in `saperi.js`, o resta fuori
dalla finestra. Le due classi più alte ammesse stanno a **81** (10,5 anni):

- `mis:problema`, i problemi con le misure dentro — le equivalenze sono di
  **quarta** (IC Lariano, cl. quarta: «Passare da un'unità di misura a
  un'altra nell'ambito delle lunghezze, delle misure temporali, delle
  capacità e delle masse»);
- `prob:inutili`, i dati che non servono — di **terza**, consolidato in
  quarta.

Tutte e due in mano a una quarta. E una cosa da tenere a mente prima di
toccarla: **la fascia `quarta` copre da 8,75 anni in su**, cioè anche i
bambini di dieci e undici anni. Quello che si spegnesse lì lo si
spegnerebbe anche a loro.

## Quando il gruppo è troppo grosso

Due delle tre voci di `terza` spengono, insieme a quello che va spento,
anche qualcosa che il bambino ha:

- **`spazio-mente`** porta via `geo:specchio` («la figura allo specchio»),
  che è di prima-seconda. Costo misurato: a otto anni `geo:rotazione` e
  `geo:specchio` valgono insieme il **3,1 % con la carta debole e ~0 % con
  la tosta** — tutto il peso alla carta tosta (4,9 %) è dei due di quinta.
  E `geo:rotazione` sta a 38 (sette anni) mentre le rotazioni sono di
  quarta: quel livello è sbagliato di due anni e mezzo, ed è un difetto di
  taratura, non di elenco.
- **`solidi`** porta via `geo:solidi` (i nomi: cubo, piramide, cilindro),
  che è di prima-seconda. Costo: il gruppo intero vale l'1,4 % dei tiri
  tosti, quindi la perdita è piccola.

E in `prima` c'è un terzo caso, che senza sottovoci **non si può prendere
affatto**: `geo:angoli` dentro `figure`. Lì il gruppo non è «troppo
grosso» — è il gruppo giusto da tenere acceso a sei anni e mezzo, e
l'unica cosa da togliere è una tipologia sola.

La versione precisa esiste, e si scrive con le **sottovoci** — una
tipologia si spegne da sola, `settings.sa` accetta sia il gruppo che la
chiave della tipologia (`store/profile.js`, `saperiSpenti`), e per chi fa
le domande sono la stessa cosa (`Modulo.tipoSpento`):

```js
/* terza */
saperi: ['divisioni', 'misure', 'conversioni', 'stima',
         'geo:rotazione', 'geo:cubetti', 'geo:sviluppo',
         'geo:viste', 'geo:facce'],
/* prima: il suo elenco di oggi, più 'adattamento' e 'geo:angoli' */
```

**Ma oggi costa due ritocchi altrove, ed è il motivo per cui la proposta
principale resta sui gruppi.** Sono stati verificati tutti e due:

1. `test/unita/partenze` diventa **rosso**: il primo controllo del file è
   `p.saperi.filter(s => !CHIAVI_SAPERI.includes(s))`, e `geo:cubetti` non
   è una chiave di `saperi.js`. Andrebbe allargato a «un gruppo di
   `saperi.js` **o** una tipologia dichiarata da un modulo» — il che vuol
   dire far leggere al test il registro dei quiz, che sotto Node non
   esiste (`import.meta.glob`): si può passare da `strumenti/quiz/` o
   caricare i moduli dalla cartella come fa `unita/saperi`.
2. Nel quadro dei grandi la riga finisce sotto un gruppo che si chiama
   **«• altro»**. Misurato: con `sa: { 'num:arrotonda': false }` a otto
   anni il blocco «spenta» viene fuori così —
   `📏 Metri, litri e chili ×7 | • altro (altro) ×1 | ➗ Le divisioni ×1 | 🔁 Le conversioni ×0`.
   La causa è `spentoDi` in `data/quadro.js`, che cerca chi ha spento la
   riga **solo fra i gruppi** (`(sa || []).find(k => spenti.includes(k))`)
   e non guarda `c.tipo`, mentre due righe più su `dove:` lo guarda. Sono
   quattro caratteri, ma è codice in `src/`.

**Per `stima` la sottovoce non serve**, e vale la pena dirlo perché era la
risposta che ci si aspettava: tutte e tre le sue tipologie stanno nello
stesso grado, allo stesso livello (75), e dicono la stessa cosa curricolare
— stimare, arrotondare, riconoscere l'impossibile. Spegnere `num:arrotonda`
lasciando `num:stima` toglierebbe la domanda contestata e terrebbe le due
che le fonti collocano **più in là** (quinta).

## Il diff pronto

Da applicare a [`src/data/partenze.js`](../src/data/partenze.js). Gli
elenchi sono scritti per esteso: applicarlo è meccanico.

### `piccoli`

```js
    saperi: ['moltiplicazioni', 'divisioni', 'misure', 'conversioni', 'decine',
             'stima', 'problemi', 'orologio', 'date', 'area-perimetro', 'solidi',
             'spazio-mente', 'analisi', 'flessione', 'presente', 'tempi-verbali',
             'accenti', 'suoni-difficili',
             'lettura', 'sillabe', 'griglia', 'calendario', 'simmetria',
             'deduzione', 'incertezza', 'insiemi', 'confronti', 'analogie',
             /* «il corpo dice il posto» è un obiettivo di fine terza
                (Indicazioni 2012, «Riconoscere in altri organismi
                viventi, in relazione con i loro ambienti, bisogni
                analoghi ai propri»). Restano accesi «gli ambienti del
                mondo», che è il gradino sotto e non arriva da scuola. */
             'adattamento'],
```

*(28 → 29 voci: aggiunta `'adattamento'` in coda.)*

### `prima`

```js
    saperi: ['moltiplicazioni', 'divisioni', 'misure', 'conversioni', 'decine',
             'stima', 'problemi', 'orologio', 'date', 'area-perimetro', 'solidi',
             'spazio-mente', 'analisi', 'flessione', 'presente', 'tempi-verbali',
             'accenti', 'suoni-difficili', 'adattamento'],
```

*(18 → 19 voci: aggiunta `'adattamento'` in coda.)*

### `terza`

```js
    /* ── E QUESTI TRE SONO ARRIVATI RIFACENDO IL GIRO ──
       L'elenco diceva tre nomi — le divisioni, le misure, le
       conversioni — ed erano stati scritti pensando ai conti in
       colonna. Tutto il resto era rimasto acceso per omissione,
       esattamente com'era successo a quattro anni con la lettura e le
       analogie: a otto anni il gioco chiedeva di arrotondare, di dire
       quanti cubetti stanno dietro a quelli che si vedono e cosa si
       vede guardando un cilindro dall'alto. Sono tre cose che a scuola
       arrivano in quarta e in quinta, e a un bambino di terza non
       arrivano difficili: arrivano mute.

       Quello che NON si spegne è altrettanto deciso: il perimetro e
       l'area contati sui quadretti sono di terza, i tempi
       dell'indicativo sono di terza, le parti del discorso sono di
       terza. La riga sopra dice «Moltiplicazioni sì, divisioni no» e
       resta vera. */
    saperi: ['divisioni', 'misure', 'conversioni',
             'stima', 'spazio-mente', 'solidi'],
```

*(3 → 6 voci.)*

### `quarta`

Invariata: `saperi: []`. Il commento della fascia può però dire **che è
stato verificato**, se no la prossima volta si rifà il giro da capo:

```js
    /* Vuota, e verificato: a 9,5 anni la finestra arriva a 94, e tutto
       quello che sta a 95 — i tempi composti, il passato remoto, il
       condizionale, il congiuntivo, l'imperativo — nasce già spento
       (`difetto: false` in `data/saperi.js`) o resta fuori. Le due
       classi più alte ammesse stanno a 81: i problemi con le misure e
       i dati che non servono, tutti e due in mano a una quarta. E
       questa fascia copre da 8,75 anni in su: quello che si spegne qui
       si spegne anche agli undicenni. */
    saperi: [],
```

### Cosa succede al mazzo, misurato

Nessuna fascia resta senza materiale, e nessun modulo diventa muto:

| fascia | età | classi ammesse (oggi → dopo) | moduli vivi | varietà effettiva, carta tosta |
| --- | --- | --- | --- | --- |
| piccoli | 4,5–5,5 | 12 → 12 · 15 → 15 | 5/18 (invariato) | 11,5 → 11,5 |
| prima | 6–7 | 38 → 38 · 45 → 45 | 12/18 (invariato) | 15,2 → 15,2 |
| terza | 7,5 | 75 → 73 | 17/18 (invariato) | 24,6 → 23,6 |
| terza | 8 | 82 → 79 | 17/18 (invariato) | 25,3 → 23,6 |
| terza | 8,5 | 78 → 75 | 17/18 (invariato) | 15,3 → 14,3 |
| quarta | 9–11 | invariate | 18/18 | invariata |

L'unico modulo muto in terza è `misure`, e lo era già (le misure sono
spente da sempre in quella fascia). `geometria` e `griglia` restano vivi:
alla geometria restano figure, quadrilateri, lati, angoli, simmetria e
piega; alla griglia coordinate, direzioni, mosse, percorsi, area e
perimetro.

A otto anni, con la carta tosta, il 10,5 % che se ne va si ridistribuisce
così: `deduzione` 13,2 → 14,8 %, `area-perimetro` 12,2 → 13,6 %,
`tempi-verbali` 10,8 → 12,0 %, `problemi` 10,1 → 11,3 %.

**Nessun gioco resta senza domande.** I quattro che passano da `src/quiz/`
(Survivors, Dungeon, sotterraneo, corsa) chiamano `domandaPerGioco` senza
filtrare per materia, quindi pescano dallo stesso mazzo; e `classiAmmesse`
ha comunque il ripiego che riapre tutto se l'elenco si svuota. Nessuno dei
tre gruppi compare in un `serve:` di `data/giochi.js` — l'unico gioco che
dipende da un sapere è il laboratorio delle pozioni (`misure` +
`conversioni`), già spento in terza.

**Una sola conseguenza fuori dai quiz**, e non morde: `src/data/calcolo.js`
ha una tappa con `scuola: 'stima'` a portata 60. Spegnere `stima` vuol dire
che quella tappa non si può più tagliare in testa come «già saputa»
(`statoDellaTappa` in `data/portata.js`) — ma a otto anni la mira delle
campagne è `[38, 69]`, quindi quella tappa è già `IN_PORTATA` e non cambia
niente. Nessuna tappa dichiara `scuola: 'solidi'` o `'spazio-mente'`.

## Cosa cambia per chi ha già un profilo

> **Sorpassato: la migrazione è stata fatta.** Sta in `store/profile.js`
> (`SAPERI_ARRIVATI`, dietro il salto di `v` a 7) e scrive **in base
> all'età impostata**. Il ragionamento qui sotto resta valido su un punto
> — riaccendere un sapere al suo difetto cancella la voce, quindi
> l'assenza non si può leggere — e la migrazione lo aggira senza
> indovinare: tocca una chiave **solo nella fascia in cui il difetto è
> nuovo**, dove l'assenza non può essere la traccia di una riaccensione.
> Un profilo senza età vale nove anni, cioè la fascia che non spegne
> niente, e non viene toccato. Il tasto «Rimetti tutto» che compariva da
> solo (la domanda 4) non compare più: dopo la migrazione le eccezioni
> salvate coincidono di nuovo coi difetti.

**Niente, automaticamente.** Le partenze scrivono le eccezioni **una volta
sola**, dentro `creaGiocatore` e su un profilo ancora vuoto
(`store/profile.js`): un bambino creato ieri non riceve nulla. Il suo
`settings.sa` resta `{ divisioni: false, misure: false, conversioni: false }`.

Le tre strade che esistono già per farglielo arrivare, in ordine di costo:

1. **La ✎ della riga**, dentro il quadro dell'età. Il grande apre «Stima e
   arrotondamento», va all'ottavo scatto oltre la tacchetta — «Non ancora
   spiegate» — e la riga si spegne (`fissaSapere`). È il gesto giusto per
   una riga sola.
2. **«Rimetti tutto ai valori di quell'età»**, in fondo al quadro
   (`rimettiAiDifetti`). Riscrive `settings.sa` con `eccezioniDi('terza')`,
   quindi applica la correzione in un colpo — ma butta anche le altre
   eccezioni e tutti i ritocchi.
3. **Spostare l'età attraverso una fascia** (`spostaLEta`): riscrive giochi
   e saperi. Mezzo anno dentro la stessa fascia non riscrive niente.

### Il difetto collaterale, ed è l'unica cosa da decidere

Appena il diff è applicato, **ogni profilo esistente di fascia terza si
ritrova il tasto «Rimetti tutto» in fondo al quadro**, che oggi non ha —
anche se il grande non ha mai toccato niente. Il conto è
`quanteDiverse(sa, difetti.sa)` in `partenze.js`, che confronta le
eccezioni salvate con quelle che l'età scriverebbe **adesso**: tre chiavi
in più nei difetti fanno `perde.sa = 3`, quindi `cambia = true` e il tasto
compare dicendo «3 pezzi di scuola».

Detto in italiano, il cartello dice «perdi 3 pezzi di scuola» mentre
premerlo li **aggiunge** allo spento. Non è un guasto — la funzione conta
differenze, non perdite, ed è la stessa scelta che rende onesto il conto
quando si scende di fascia — ma è una frase storta davanti a un grande.

**Consiglio: non migrare, e non è pigrizia.** In questo repo un salvataggio
non si tocca a cuor leggero, e qui c'è un motivo tecnico preciso:
`accendiSapere(chiave, true)` **cancella** la voce quando coincide col
difetto (`if (si === difettoDi(chiave)) delete s.sa[chiave]`). Quindi un
profilo in cui `stima` è *assente* è **indistinguibile** da uno in cui un
grande ha detto esplicitamente «no, questa gliela lasciamo»: una migrazione
che spegne d'ufficio scavalcherebbe quella scelta senza poterla riconoscere.

Le due alternative pesate e scartate:

- **Migrazione mirata** — riscrivere solo i profili il cui `settings.sa` è
  *esattamente* l'elenco della versione precedente. Vuol dire cablare in
  `profile.js` la lista vecchia di ogni fascia, e sbagliare da qui in
  avanti ogni volta che l'elenco cambia. È il tipo di codice che nessuno
  ricorda di aggiornare.
- **Riscrivere tutti** — ignora la scelta di un grande, che è esattamente
  quello che la ✎ esiste per proteggere.

## Cosa va provato

### Cosa diventa rosso con la proposta sui gruppi

**Niente, ed è il punto.** Provato: la suite unità è verde adesso (100 test)
e resta verde con il diff applicato.

- `test/unita/partenze` — verde. La nidificazione regge (`stima`,
  `spazio-mente` e `solidi` sono già in `prima` e in `piccoli`;
  `adattamento` è aggiunto in tutte e due). I quattro controlli espliciti
  sulla terza (spegne le divisioni, lascia le moltiplicazioni, spegne
  misure e conversioni) restano veri, e `«quarta» non spegne nessun sapere`
  pure. Cambia solo una `nota` stampata: «Terza elementare: 2 giochi e 3
  saperi spenti» diventa 6.
- `test/unita/saperi` — verde, non legge `partenze.js`.
- `test/unita/quadro` — verde. Verificato in Node con le eccezioni nuove:
  a otto anni i blocchi passano da `facili 23 · medie 58 · toste 26 ·
  sotto 2 · spenta 8` a `facili 23 · medie 54 · toste 22 · sotto 2 ·
  spenta 16`, e il controllo che conta più di tutti — «ogni domanda finisce
  sotto un pezzo di scuola, e nel blocco giusto» — non trova buchi a 6, 8 e
  10 anni.
- `test/unita/portata` — verde, non passa `spenti`.

Con la variante a **sottovoci**, invece, `test/unita/partenze` diventa
rosso al primo controllo: vedi «quando il gruppo è troppo grosso».

### Il controllo nuovo, che è il pezzo che manca

Il guasto di oggi non è una riga sbagliata: è **una riga mai scritta**, e i
test non vedono quello che manca. Nessuno dei cento test è in grado di
diventare rosso perché `stima` è rimasta accesa — e non lo sarà nemmeno
domani, per il gruppo che nessuno ha ancora scritto.

La forma che lo rende visibile: **una fascia deve dichiarare non solo cosa
spegne, ma perché tiene acceso il resto.** Un campo nuovo in `PARTENZE`,
`tiene: { <chiave>: '<una riga di motivo>' }`, e due controlli in
`test/unita/partenze`:

```js
/* ── QUELLO CHE UNA FASCIA TIENE ACCESO VA DETTO ──
   Il difetto che questo rende rosso non è una riga sbagliata: è una
   riga MAI SCRITTA — «stima» rimasta accesa in terza perché l'elenco
   era stato pensato per i conti in colonna, e nessuno era più tornato
   a guardare il resto del catalogo. Un test che controlla quello che
   c'è non può vedere quello che manca: bisogna pretendere che ogni
   gruppo abbia un verdetto, spento o motivato che sia.

   Il costo è una trentina di righe scritte una volta. Il guadagno è
   che il giorno che si aggiunge un gruppo a `saperi.js` la fascia dei
   piccoli diventa rossa, e da lì la catena si propaga in su. */

/* 1. i piccoli hanno un verdetto su TUTTO il catalogo */
{
  const p = partenza('piccoli')
  const senza = SAPERI.filter(s => s.difetto !== false)
    .map(s => s.chiave)
    .filter(k => !p.saperi.includes(k) && !p.tiene?.[k])
  uguale('«piccoli» dice di ogni pezzo di scuola se lo spegne o perché no',
         senza.join(',') || '—', '—')
}

/* 2. e ogni fascia più grande motiva quello che riaccende */
for (let i = 1; i < PARTENZE.length; i++) {
  const grande = PARTENZE[i], piccola = PARTENZE[i - 1]
  const muti = piccola.saperi
    .filter(k => !grande.saperi.includes(k) && !grande.tiene?.[k])
  uguale(`«${grande.nome}» dice perché riaccende quello che «${piccola.nome}» spegne`,
         muti.join(',') || '—', '—')
}
```

Quante righe di motivo servono, con questo diff applicato: 5 per `piccoli`
(numeri, lessico, sequenze, ambienti, figure), 10 per `prima`, 13 per
`terza`, 6 per `quarta`. Sono trentaquattro decisioni che **oggi non sono
scritte da nessuna parte**, e scriverle è metà del lavoro di questo giro.

E un controllo più leggero, da mettere accanto — una `nota`, non un rosso,
perché è un segnale e non una regola:

```js
/* le voci ancora accese la cui classe più alta ammessa sta più di un
   anno e mezzo sopra l'età della fascia: non sono guasti, ma è
   l'elenco da rileggere quando si aggiunge un modulo */
```

A otto anni stamperebbe oggi: `lessico · orologio · problemi ·
moltiplicazioni · tempi-verbali` (più i gruppi di ragionamento, che vanno
esclusi). Nessuno dei cinque è un guasto — ma è la lista su cui posare
l'occhio, e `stima` ci sarebbe stata sopra.

### E un controllo che il giro ha fatto a mano

Vale la pena stabilizzarlo, perché è quello che ha impedito di proporre
troppo: **spegnere non deve svuotare**. Alle età delle quattro fasce,
nessun modulo che oggi ha almeno un grado libero deve perderli tutti. In
Node si fa senza browser, caricando i moduli dalla cartella come già fa
`test/unita/saperi`, e in tre righe:

```js
const morti = MODULI.filter(m => m.gradiLiberi(spentiOggi, regole).length > 0 &&
                                 m.gradiLiberi(spentiDopo, regole).length === 0)
```

## Domande aperte

**Risposte, tranne due.** 1 — `stima` non si spegne (criterio nuovo).
2 — sottovoci. 3 — la migrazione si fa. 4 — non si pone più. 5 — il campo
`tiene:` si fa. 8 — la nota in `guide/novita.js` la decide chi possiede
il gioco, e non è stata scritta. Restano aperte la **6** (il livello di
`geo:rotazione`, dichiarato 38 mentre le rotazioni sono di quarta: è un
difetto di taratura indipendente, e adesso quella tipologia è comunque
spenta in terza) e la **7** (la frase su `ambienti` in `saperi.js`).

Sono poste perché si possa rispondere con una parola.

1. **`stima` in terza: si spegne?** L'arrotondamento è l'unica voce del
   giro su cui le fonti si contraddicono (curricoli d'istituto: terza;
   libri di testo italiani e siti didattici: quarta-quinta). Le altre due
   voci dello stesso gruppo — la stima e l'ordine di grandezza — sono di
   quinta senza discussione, e la bambina che l'ha fatto scoprire è in
   terza. — **sì / no**
2. **`spazio-mente` e `solidi`: gruppo intero, o sottovoci?** Il gruppo
   intero si applica oggi e porta via anche «la figura allo specchio» e i
   nomi dei solidi. Le sottovoci sono precise ma costano un test da
   allargare e quattro caratteri in `data/quadro.js`. Con le sottovoci
   entrerebbe anche `geo:angoli` in `prima`, che col gruppo non si può
   prendere affatto. — **gruppo / sottovoci**
3. **Migrazione per i profili esistenti: nessuna, giusto?** La proposta è
   di non toccare i salvataggi e lasciare che la correzione arrivi dalla ✎,
   dal «rimetti tutto» o da un cambio di fascia. — **sì / no**
4. **Il tasto «Rimetti tutto» che compare da solo su tutti i profili di
   terza, dicendo «3 pezzi di scuola»: si accetta?** L'alternativa è
   distinguere in `quanteDiverse` fra «il difetto ha spento qualcosa in
   più» e «il grande ha acceso qualcosa» — ma è codice in `partenze.js`, e
   nel caso in cui si scende di fascia il conto attuale è quello giusto.
   — **si accetta / si distingue**
5. **Il campo `tiene:` e le trentaquattro righe di motivo: si fa?** È il
   pezzo che rende rosso l'errore per omissione, ed è anche il pezzo che
   costa. — **sì / no / più avanti**
6. **`geo:rotazione` sta a 38 (sette anni) e le rotazioni sono di quarta:
   si ritocca il livello?** È un difetto di taratura scoperto per strada,
   indipendente da questo giro; sarebbe un cambio in
   `quiz/moduli/geometria.js` e farebbe muovere
   `docs/livelli-delle-domande.md`. — **adesso / a parte**
7. **Il commento di `ambienti` in `saperi.js` dice «roba di seconda e
   terza», e i biomi mondiali sono geografia di quarta. Si corregge la
   frase** (lasciando il gruppo acceso, che è la decisione giusta per un
   altro motivo)? — **sì / no**
8. **Serve una nota in `guide/novita.js`?** Cambia cosa il gioco chiede ai
   bambini nuovi di sei-otto anni e fa comparire un tasto nella schermata
   dei grandi. La regola del repo è che le notizie le decide chi possiede
   il gioco, quindi la domanda resta qui e non è stata scritta nessuna nota.
   — **sì / no**
