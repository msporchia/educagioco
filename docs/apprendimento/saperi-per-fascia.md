# Cosa una fascia dà per scontato

La ricerca dietro `saperi:` e `tiene:` delle quattro fasce di
`src/data/partenze.js`: il criterio, il verdetto per fascia con la fonte
accanto, e cosa resta aperto. Le regole generali sono in [saperi.md](saperi.md).

## Il criterio

**Si spegne quello che non si può insegnare in una carta**, non quello che a
scuola non è ancora stato fatto (la regola in testa a `partenze.js`). Da
distinguere:

- **difficile ma sensato** — il concetto c'è, la domanda è tosta: resta
  accesa (tre conti di fila a otto anni sono faticosi, non muti);
- **muta** — il concetto manca e una riga non lo colma: si spegne;
- **nuova ma spiegabile in una riga** — resta accesa e si insegna
  nell'`aiuto` (l'arrotondamento: «47 sta fra 40 e 50…»).

Il metro è il programma della primaria italiana, con due eccezioni: i gruppi
di ragionamento (`materia: 'ragionamento'`: deduzione, incertezza, insiemi,
confronti, analogie, sequenze) non hanno una lezione da aver fatto; e quello
che la scuola non dà affatto (`ambienti`: dove vive il pinguino arriva dai
cartoni) non si giudica col programma.

**Le fonti.** Le Indicazioni Nazionali 2012 non assegnano gli argomenti alle
classi: fissano obiettivi a fine terza e fine quinta
([DM 254/2012](https://www.mim.gov.it/documents/20182/51310/DM+254_2012.pdf)).
Per la classe esatta si usano curricoli verticali d'istituto e programmazioni
annuali, citati riga per riga; dove si contraddicono è scritto.

**Come si misura.** Non a occhio: per ogni fascia si applica la finestra di
ammissione (`finestraDi`) e si pesa ogni gruppo con la campana vera
(`bersaglio` · `bandaPer` · `pesoDi`) alla carta debole, media e tosta. Una
riga che esiste può uscire una volta su trenta; una che pesa il 12% è quello
che il bambino vede. `npm run quiz:eta` non sa niente dei saperi spenti.

## `piccoli` (5 anni, «non va ancora a scuola»)

Spegne tutto quello che spegne «prima» (la scala è annidata, e
`unita/partenze` lo pretende), più la lettura e quello che a quattro anni non
c'è: `lettura`, `sillabe`, `griglia`, `calendario`, `simmetria`, `deduzione`,
`incertezza`, `insiemi`, `confronti`, `analogie`, `bilance`, `dati`,
`comprensione`. **Tiene**: numeri, figure, lessico (i contrari), sequenze,
ambienti — roba dei libri illustrati, non della scuola.

## `prima` (6,5 anni, «prima o seconda»)

Legge ancora a fatica: spegne tabelline e divisioni, misure e conversioni,
decine, stima, problemi scritti, orologio, date, area e perimetro, solidi,
spazio mentale, la grammatica (analisi, flessione, presente, tempi verbali,
accenti, suoni difficili), frazioni, denaro, decimali e `adattamento`.

- **`adattamento` spento**: «il corpo dice il posto» è un obiettivo di fine
  terza (IN 2012, *L'uomo i viventi e l'ambiente*: «Riconoscere in altri
  organismi viventi, in relazione con i loro ambienti, bisogni analoghi ai
  propri»). Valeva il 4,9% dei tiri con la carta tosta.
- **`ambienti` acceso** anche se i biomi mondiali sono geografia di quarta
  ([IC Brivio](https://www.icbrivio.edu.it/wp-content/uploads/2019/12/geografia-OK.pdf)):
  è la seconda eccezione al criterio.
- **`geo:angoli`** (retto, acuto, ottuso; dichiarato 56) è ammesso e vale il
  2,1% dei tiri tosti. Il concetto di angolo è di terza, **classificarli per
  nome è di quarta** ([programmazione cl. quarta](https://www.risorsedidattichescuola.it/files/matematica-classe-quarta-programmazione-didattica-annuale.pdf):
  «Distinguere e denominare angoli di varie ampiezze»; così IC Russi, IC
  Lariano, IC Spinetta). Si prenderebbe solo a sottovoce (spegnere
  `figure` porterebbe via i nomi delle figure): non è stato spento, vedi
  [da-fare.md](da-fare.md).

## `terza` (8 anni)

Spegne `divisioni`, `misure`, `conversioni`, `decimali` e **a sottovoci**
`geo:rotazione`, `geo:cubetti`, `geo:sviluppo`, `geo:viste`.

| voce | verdetto | perché, e la fonte |
| --- | --- | --- |
| `stima` | **accesa** | stimare e l'ordine di grandezza sono di fine quinta (IN 2012; IN 2025, [curricolo IC Liguria-Rozzano](https://icsliguriarozzano.edu.it/wp-content/uploads/2026/01/CURRICULO-VERTICALE-IN-2025.pdf)), le stime di un'operazione di quarta ([IC Colombo](http://www.iccolombo.it/uploads/programmazioni%20primaria/classi%20quarte/PROGRAMMAZIONE%20MATEMATICA%20CLASSI%204.pdf)); ma le sue tipologie hanno un `aiuto` che insegna in una riga, e toglierla toglierebbe una lezione. Sull'arrotondamento le fonti si contraddicono (curricoli: terza; libri e siti: quarta-quinta) |
| `spazio-mente` | **metà**: via rotazioni e cubetti | rotazioni = quarta ([IC Lariano](https://comprensivolariano.edu.it/archivio/attachments/article/2452/curricolo%20verticale%20d'istituto%20MATEMATICA.pdf), [programmazione cl. quarta](https://www.risorsedidattichescuola.it/files/matematica-classe-quarta-programmazione-didattica-annuale.pdf)); sviluppo del cubo = quinta ([impariamoinsieme](https://www.impariamoinsieme.com/lo-sviluppo-dei-solidi/)); i cubetti nascosti non sono in nessun curricolo e stanno a 75. Resta `geo:specchio`, di seconda |
| `solidi` | **metà**: via le viste dall'alto | i nomi sono di prima-seconda ([IC Alessandria Spinetta](https://www.icalessandriaspinetta.edu.it/wp/wp-content/uploads/2022/09/MATEMATICA-curricolo_verticale_2020_2021.pdf)); viste dall'alto = fine quinta (IN 2012: «identificare punti di vista diversi di uno stesso oggetto»). Contare le facce (IC Colombo, quinta) resta acceso |
| `area-perimetro` | accesa | il concetto è di terza (IC Lariano, IC Colombo); le domande contano quadretti e passi, non formule. È il gruppo più pesante (12,2% dei tiri tosti) |
| `analisi` | accesa | parti del discorso di terza ([IC Foscolo](https://www.icfoscolo.org/wp-content/uploads/2022/09/CURRICOLO-VERTICALE-ITALIANO.pdf)); `gram:soggetto-predicato` (69) è di quarta ed è già dichiarato lì |
| `tempi-verbali` | accesa | i tempi dell'indicativo sono di terza (IC Russi; [Maestra Ilaria](https://maestrailaria0.altervista.org/il-modo-indicativo-classe-3/)) |
| `orologio` | accesa | ore, mezze, quarti e minuti in seconda ([PianetaBambini](https://pianetabambini.it/imparare-leggere-orologio-schede-didattiche-esercizi/)), lettura nel nucleo *La misura* in terza ([programmazione cl. terza](https://www.risorsedidattichescuola.it/files/matematica-classe-terza-programmazione-didattica-annuale.pdf)) |
| `problemi` | accesa | due operazioni e dati superflui sono di terza (programmazione cl. terza) |
| `decine` | accesa | valore posizionale fino alle migliaia: terza (IC Russi) |
| `date`, `calendario` | accese | prima-seconda; IN 2012 fine terza citano orologio e calendario |
| `lessico` | accesa | sinonimi e contrari di prima-seconda (IC Foscolo); i modi di dire non chiedono di formalizzare il senso figurato |
| `accenti`, `suoni-difficili` | accese | seconda e prima (IC Russi) |
| `adattamento` | accesa | obiettivo di fine terza: a otto anni ci siamo |
| `moltiplicazioni` | accesa | è la riga che dà il nome alla fascia |

Quanto pesava ogni gruppo a otto anni con la carta tosta (manopola 0,85,
mira ≈ 9,6 anni), prima delle sottovoci: deduzione 13,2% · area-perimetro
12,2 · tempi-verbali 10,8 · problemi 10,1 · lessico 8,3 · orologio 6,3 ·
date 5,9 · analisi 5,1 · spazio-mente 4,9 · stima 4,2 (non entra a 7,5
anni, 6,2 a 8,5) · moltiplicazioni 4,0 · solidi 1,4. Di `spazio-mente`,
rotazione e specchio insieme pesano il 3,1% con la carta debole e ~0 con la
tosta: il peso tosto è tutto dei due di quinta.

Misurato dopo: a otto anni le classi ammesse passano da 82 a 81 e la varietà
effettiva con la carta tosta da 25,3 a 24,3 (a 8,5 anni da 15,3 a 14,4); in
`piccoli` e `prima` non cambia niente di misurabile. Nessuna fascia scende sotto i 17
moduli vivi su 18 (l'unico muto in terza è `misure`, che lo era già). Nessun
gioco resta senza domande: i quattro di `src/quiz/` pescano dallo stesso
mazzo, e `classiAmmesse` riapre tutto se l'elenco si svuota.

## `quarta` (9,5 anni, «quarta o quinta»)

Non spegne niente, ed è verificato: a 9,5 anni la finestra arriva a 94, e
quello che sta a 95 (tempi composti, passato remoto, condizionale,
congiuntivo, imperativo) nasce già spento (`difetto: false`) o resta fuori.
Le classi più alte ammesse stanno a 81: `mis:problema` (equivalenze di
quarta, IC Lariano) e `prob:inutili` (di terza). **Copre da 8,75 anni in
su**: quello che si spegne qui si spegne anche agli undicenni.

## Già fatto

La migrazione dei profili esistenti (`SAPERI_ARRIVATI` in
`store/profile.js`, in base all'età: tocca una chiave solo nella fascia in
cui il difetto è nuovo, perché riaccendere al difetto cancella la voce e
l'assenza non si può leggere; un profilo senza età vale nove anni e non si
tocca), il campo `tiene:` coi suoi due controlli in `unita/partenze`, e
`spentoDi` in `data/quadro.js` che guarda anche `c.tipo` (senza, una
sottovoce spenta finiva sotto «• altro»). Le domande ancora aperte sono in
[da-fare.md](da-fare.md).
