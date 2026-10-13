# Le regole

I numeri stanno in `src/giochi/arena/dati/regole.js`, il motore in
`motore/partita.js` (senza schermo, il caso passato da fuori). Qui il perché.

## Il campo: una corsia sola

- **Una corsia, un ponte, al centro.** C'erano due corsie (come Clash Royale):
  tolte perché i nemici finivano «dietro» i muri e le caserme costruiti, e il
  muro, che copre una corsia sola, non serviva a niente sull'altra.
- Il motore conta la corsia in verticale (`y` lungo, `x` di lato), e la scena la
  disegna così, col castello di chi gioca in basso (vedi [grafica.md](grafica.md)).
- **Ogni metà è una cittadella**: il castello e le quattro caserme stretti su un
  lastricato, come la città di Heroes of Might and Magic (l'utente: gli edifici che
  «si sposano e si incastrano su uno sfondo unico»). Fra le cittadelle c'è il campo
  libero e il ponte.
- **Una partita dura 3:00.** Vince chi abbatte il castello nemico; allo scadere chi ha
  fatto più danni (sotto, «La durata»).

## Le caserme: quattro edifici, due truppe ciascuno

- **Gli edifici sono quattro** (`EDIFICI`): la cripta (arcieri | opliti), la tana
  (lupi | pipistrelli), la torre oscura (negromanti | diavoletti), l'antro (golem |
  drago). **Quale truppa, si sceglie costruendo**: l'utente voleva meno caserme e una
  scelta vera («una caserma può fare scheletri arcieri o scheletri opliti, e quando
  parti scegli quale dei due»). Le due truppe di un edificio **costano uguale**: si
  sceglie il mestiere, non il prezzo.
- **Si parte senza caserme**, tutti e due: la prima mossa è la cripta. Così anche la
  prima tappa, che ha solo arcieri e opliti, ha una scelta da fare.
- **Il livello è dell'edificio, una ricerca**: costruire è la pietra, potenziare è lo
  studio. Se una caserma crolla, il posto torna libero e la si rifà **dal livello che
  aveva** (anche scegliendo l'altra truppa): chi perde una caserma è meno svantaggiato
  (l'utente). Il livello (1-10) fa uscire le squadre più spesso
  (`9 / (1 + 0.12·(liv−1))` secondi) e più forti (`1 + 0.25·(liv−1)`); potenziando, la
  vita in più della caserma arriva subito.
- **Il posto lo sceglie il gioco** (`POSTI`, quattro per parte attorno al castello):
  il lato con meno caserme, e dentro il lato il più lontano dal fiume. Niente da
  piazzare col dito.
- **Le truppe sono otto e si distinguono per chi colpiscono, non per quanto
  valgono**: arcieri e negromanti feriscono tutti, opliti, lupi e diavoletti solo chi
  cammina, il golem solo le costruzioni, i pipistrelli e il drago volano e scavalcano
  i muri. Il `guasti…()` di `dati/regole.js` pretende due truppe per edificio allo
  stesso prezzo, chi vola e chi, da terra, ferisce chi vola.
- **Masse, non quattro omini**: le squadre sono grandi (quattro arcieri, sei
  pipistrelli…) con vita e danno divisi in proporzione, e **crescono ogni due livelli**
  in proporzione alla squadra (`CRESCITA.omini`). L'utente: «col tempo una massa di
  persone, non solo 4-5 in giro».

## Vita e danno: chi sta davanti e chi sta dietro

- **Chi colpisce da vicino ha più vita e meno danno, chi tira da lontano il contrario**
  (l'utente), **ma senza esagerare**: chi tira sta nelle retrovie e muore già meno. Per
  squadra, al livello 1: opliti 600 di vita e 40 di danno al secondo, lupi 560 e 50,
  arcieri 180 e 72, negromanti e diavoletti 180 e 29-30 (ad area), pipistrelli 240 e 36.
- **I raggi dei colpi ad area stanno in scala con le figure** (13-15): con le masse fitte
  un raggio di 26-30, quello di quando le figure erano grandi il doppio, prendeva sei
  omini a colpo e il drago spazzava tutto.
- **Si controlla coi duelli** (`npm run tara:arena -- --duelli`): tre squadre per parte in
  campo aperto, senza castelli né porte. Nessuna truppa deve vincerle tutte o perderle
  tutte, e ci dev'essere il giro: gli arcieri fermano pipistrelli e drago, chi colpisce da
  vicino batte arcieri e chi tira ad area, chi tira ad area batte gli arcieri, chi vola
  batte chi colpisce solo a terra. Ultimo giro: arcieri 33%, opliti 50%, lupi 67%,
  pipistrelli 50%, negromanti e diavoletti 33%, drago 83% (costa di più, e chi colpisce
  solo a terra non lo tocca). Il golem non duella: ignora le truppe.

## Come marciano, e l'ordine dell'assedio

- **Appena uscite si va sulla strada** (davanti al castello), poi si marcia in fila:
  prima tagliavano il campo in diagonale verso il ponte e le due file si incrociavano
  (l'utente: «strano che partano da lì e si incrocino»).
- **Una truppa vede un'altra truppa a 80** e la colpisce (la più vicina).
- **Nella propria metà si accorre ai nemici vicini al castello** (entro 190), anche se
  sono più lontani di 80: prima le squadre appena uscite ignoravano chi picchiava il
  castello e partivano verso il ponte.
- **Se non c'è nessuno da colpire si va all'obiettivo, in ordine**: chi cammina sfonda
  la **porta** in fondo al ponte, poi tutti vanno sulle **caserme** (la più vicina), e
  il **castello per ultimo** (`obiettivo()`). L'utente: «una lenta agonia, non un
  flash». Le caserme reggono (700 di vita, più 120 a livello) perché sono il primo
  bersaglio.

## Le scelte che non sono truppe

Costano monete di battaglia e un calcolo, come le caserme.

| scelta | cosa fa | prezzo |
|---|---|---|
| ⛏️ Più monete | +50% di monete al secondo per livello (6 livelli: da ×1 a ×3,5) | 10, 16, 24, 34, 46 |
| 🔧 Ripara | +40% di vita alla costruzione messa peggio, porta compresa (anche crollata) | 6 |
| 🏰 Castello | più danno, cadenza, gittata e vita (+300 per livello, 10 livelli) | 8 → 66 |
| 💣 Bomba | **in regalo** (non si compra): spazza le truppe nemiche più fitte | 0 monete, un calcolo |

- **Il castello è l'unica costruzione che spara.** Prima c'era una torretta
  davanti alla base: tolta (l'utente: «più un potenziamento del castello»), e il
  castello ne ha preso la gittata (175, più 4 per livello) perché da lì deve
  coprire la porta in fondo al ponte.
- **La porta è una sola per parte e non si compra**: c'è dall'inizio, chi cammina la
  colpisce prima del resto, chi vola la scavalca. Se crolla resta il cumulo e **si
  ricostruisce riparando** (la riparazione la cerca per prima). **Provati** due muri
  in fila sulla corsia (uno finiva «dietro» all'altro e non serviva) e poi una
  muraglia attorno all'accampamento con un muro davanti al castello: bocciata,
  «qualcosa sopra il ponte e basta».
- **La miniera conviene presto e lascia scoperti**: è la scelta di strategia
  voluta dall'utente (produrre di più ma non attaccare); la riparazione e il
  castello più forte sono la risposta difensiva che prende tempo.

## La bomba: un regalo, non un acquisto

Ogni 40 secondi ne arriva una a tutti e due (se ne tengono al massimo due). Si lancia
con un calcolo di divisione ma **non costa monete**. **È un'arma difensiva**: colpisce
solo le truppe nemiche entrate nella *tua* metà (fra il fiume e il tuo castello), nel
punto dove sono più fitte e più vive (raggio 95, 700 di danno). Una bomba che colpisse
ovunque servirebbe a poco: spazzerebbe truppe lontane che non fanno ancora danno
(l'utente: «un'arma difensiva non offensiva, altrimenti non serve a nulla»).
Perché in regalo e non da comprare: è il «reset» per quando uno ha una forza
schiacciante e va avanti per inerzia, e chi è già indietro non ha le monete per una
cosa da comprare («non ne esci»). Il nemico la usa quando un ammasso di tue truppe entra nella
sua metà (vedi [nemico.md](nemico.md)); il giocatore finto idem (`motore/banco.js`).

## La durata

Il castello da 4000 (più 300 a livello) cade per ultimo, quindi una partita si decide
in circa due minuti, dopo aver perso caserme e porta. **Allo scadere vince chi ha fatto
più danni** (`punti()`): ogni costruzione abbattuta vale uno, il castello abbattuto tre
(in proporzione alla vita che gli manca); entro un quarto di punto è pari. Col castello
che cade per ultimo, «vince il castello più sano» finiva quasi sempre pari.

## I dettagli («?») e la scelta

- Ogni carta ha un «?». Su una caserma costruita apre `viste/Dettagli.vue` con le righe
  «adesso → livello dopo» di `motore/dettagli.js` (una squadra ogni N secondi, vita e
  danno di ogni truppa, vita della caserma, prezzo), chi colpisce e se vola.
- Su un edificio da costruire apre **la scelta** (`viste/Scelta.vue`): le due truppe una
  accanto all'altra, col prezzo e il calcolo che costano; quella che la tappa non ha
  ancora si vede spenta («arriva più avanti»). Da lì «i numeri» aprono i dettagli.
- **Il campo sta fermo** finché dettagli o scelta sono aperti: servono a confrontare
  con calma.

## Il respiro

Il castello **spara da solo dal primo secondo** e il nemico si costruisce la cripta
dopo un paio di secondi: chi non fa niente resiste una cinquantina di secondi
(misurato dal banco). Il tempo di decidere c'è, poi la base viene sopraffatta.

## Nei test

`[data-caserma=<edificio>]` (con `data-variante=<truppa>` se è costruito),
`[data-scelta=<edificio>]`, `[data-costruisci=<truppa>]`, `[data-dettagli=<truppa|edificio>]`,
`[data-azione=miniera|ripara|castello|bomba]`, `[data-monete]`, `[data-avviso]`,
`[data-tappa=<n>]`, `[data-fine=vinta|persa|pari]`.
