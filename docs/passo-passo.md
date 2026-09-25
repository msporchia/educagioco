[← torna al README](../README.md)

# 🐇 Passo passo

*Il primo gradino della programmazione, per chi non sa ancora leggere — e
poi un cane pastore da far pensare, e i cicli, per chi ha otto anni.* Un
coniglio deve tornare nella sua tana. Il bambino non lo guida col dito: gli scrive una **fila di frecce**,
preme ▶, e il coniglio la esegue dall'inizio alla fine. Se qualcosa va
storto si guarda *quale* freccia era sbagliata, la si cambia, e si riprova.

## Come è fatto

Dall'alto in basso: il posto (una mappa vista dall'alto, in pixel art), la
**fila** delle frecce scritte, i tasti delle frecce, e in fondo ⌫ ▶ 💡. Non
c'è niente da leggere per giocare: le frecce sono disegni, il coniglio è in
testa alla fila, e quello che succede si vede.

- **Si compone toccando, mai trascinando.** Ogni tasto aggiunge una freccia
  dove sta il **cursore** (la sbarra arancione che lampeggia, di partenza in
  fondo). Toccare una tessera sposta il cursore subito dopo di lei, e
  toccarla di nuovo subito prima: è così che si arriva all'inizio. ⌫
  toglie la freccia prima del cursore.
- **È un programma, non un telecomando.** ▶ fa ripartire il coniglio
  **sempre dalla partenza**, e la fila resta dov'è. Mentre corre, la tessera
  che sta eseguendo si accende: sapere *a che punto del programma sono* è la
  cosa più importante che il gioco insegna.
- **Uno sbaglio si vede dov'è.** Se il coniglio sbatte o finisce in acqua,
  la tessera colpevole lampeggia, lui fa la sua scenetta (le stelline in
  testa, o a galla col muso fuori dall'acqua) e torna alla partenza. Il
  cursore si mette subito dopo la tessera sbagliata: un ⌫ la toglie, e la
  freccia giusta entra al suo posto.
- **La parte già vista va veloce.** Al giro dopo, le frecce in testa che
  sono uguali a prima e che allora erano andate bene scorrono tre volte più
  svelte: non si riguardano dieci passi già visti per vedere l'undicesimo.
- **Un programma non finito non è un errore.** Se le frecce finiscono prima
  della tana, il coniglio si ferma dov'è con un fumetto «?»: «e adesso?».
  Resta lì mentre si aggiungono frecce, così si vede da dove si riparte.
- **■ ferma tutto** a metà corsa e rimette il mondo com'era.

Non c'è tempo che stringe, non ci sono vite, non si perde mai: sbagliare fa
riprovare. Nemmeno i suoni puniscono — lo sbaglio è un tonfo morbido — e
nessuna informazione sta solo nel suono: a volume spento il gioco è intero.

## Perché le frecce sono assolute

↑ vuol dire **verso la cima dello schermo**, sempre, comunque sia girato il
coniglio. Non c'è «gira a destra»: le svolte relative chiedono di ruotare
la figura a mente, e a cinque o sei anni quella capacità non c'è ancora. Un
bambino che sbaglia per quel motivo non sta sbagliando il programma, sta
sbagliando la rotazione — e il gioco gli insegnerebbe la cosa sbagliata.

## Le regole del mondo

Valgono **sempre, uguali in ogni livello**: un mondo che in un posto fa una
cosa e in un altro un'altra non si può programmare, si può solo indovinare.
Arrivano una per volta, un gradino per regola, e da lì in poi restano.

| | |
|:--|:--|
| **il prato** | si cammina |
| **gli ostacoli** | albero, cespuglio, sasso: non si entra. Contro di loro (e contro il bordo della mappa) il coniglio sbatte, e la fila si ferma lì |
| **l'acqua** | entrarci è uno splash, e la fila si ferma lì |
| **il salto** | una seconda fila di frecce, arancioni: il coniglio va due celle più in là scavalcando quella in mezzo — l'acqua, il ghiaccio, un ostacolo **basso** (il tronco, la staccionata). Uno alto no: ci si sbatte |
| **il ghiaccio** | entrati sul ghiaccio si continua nella stessa direzione finché qualcosa non ferma (e fermarsi contro un sasso non è un errore), finché il ghiaccio non finisce, o finché si cade in acqua. Scivolando si prende la carota e si entra nella tana |
| **i massi** | camminandoci contro si spingono di una cella. Sul ghiaccio scivolano finché non si fermano; nell'acqua affondano e diventano un **ponte**. Se non possono muoversi, si sbatte |
| **le buche** | a coppie, con l'anello dello stesso colore: si entra da una e si esce dall'altra, e il movimento finisce lì, anche scivolando |
| **le lastre** | rossa col cerchio, blu col quadrato, gialla col triangolo: si camminano come il prato (e come il prato fermano chi scivola), e un masso non ci va sopra. Non fanno niente: servono a **guardarle**, dal gradino del «fino a» in là. La forma c'è per chi i colori non li distingue tutti |
| **le pecore** | nei livelli del cane: quando il cane si ferma sulla riga o sulla colonna di una pecora, a una o due caselle e senza niente di alto in mezzo, lei fa un passo dall'altra parte, e spinge quella che ha davanti — si muovono insieme. Se in fondo alla fila c'è un ostacolo, l'acqua o il bordo, non si muove nessuna; sul ghiaccio scivolano, e nell'acqua non ci vanno. Il cane contro una pecora sbatte |
| **il recinto** | una pecora che ci entra ci resta; il cane non ci entra mai. Quando dentro ci sono tutte, il livello è vinto |

E la **tana**: arrivarci, in qualunque modo e in qualunque momento, vince
subito — le frecce dopo non contano. Per il cane vale lo stesso col
recinto: l'ultima pecora che entra chiude il livello.

Tre cose che le regole non dicevano, e che il gioco ha dovuto decidere:
saltando non si prende la carota che sta **in mezzo** (si prende quello su
cui si mette la zampa) e non si entra nella tana che sta in mezzo — vederci
passare sopra è il modo più chiaro di capire che il salto è lungo due; non
si atterra su un masso (lo si spinge solo camminando); un masso non si
spinge sulla tana, sulla carota o su una buca, che sparirebbero sotto un
sasso.

## Il cane pastore

Dopo le buche, per undici tappe, al posto del coniglio c'è il **bobtail** e al
posto della tana il **recinto**. Le frecce sono le stesse, le regole del
mondo pure — il ghiaccio, l'acqua, i salti — ma la domanda cambia: il cane
non deve andare da nessuna parte, è **la pecora** che deve arrivare. E una
pecora si sposta solo scappando dal cane, quindi la fila si scrive pensando
a dove andrà a finire lei.

- **Si scansa prima.** Il cane si ferma sulla riga o sulla colonna di una
  pecora, a una o due caselle, e lei fa un passo dall'altra parte: non
  aspetta che le arrivi addosso, e il cane la porta da lontano, come un
  cane da pastore vero. Per mandarla a destra il cane le va a sinistra;
  per girarle attorno passa in diagonale, perché fermandosi sulla sua riga
  o sulla sua colonna la spingerebbe. Scappa quando il cane **si ferma**:
  una scivolata lunga sei celle la spaventa solo dove finisce. Vede sopra
  l'acqua e le cose basse, non attraverso un albero, un masso o un'altra
  pecora.
  Era «accanto», all'inizio: con la vista a due caselle (un'idea venuta
  guardando la prima prova, il 25 settembre 2026) il cane non tocca mai
  una pecora, e i posti sono gli stessi — cambia da dove si spinge.
- **Le pecore non sono sassi: una spinge l'altra.** Una pecora che scappa
  e ha davanti un'altra pecora la spinge, e si spostano insieme — una fila
  intera, se c'è: è il gregge che si muove a pezzetti, e il modo di
  riunirlo è proprio questo, mettere le pecore in fila e poi spingerle
  tutte. Se in fondo alla fila c'è un albero, l'acqua o il bordo, non si
  muove nessuna: la prima fa «bee», e il cane che le cammina contro
  sbatte. Sul ghiaccio la testa della fila scivola, e una pecora che
  scivola si ferma contro quella che trova, senza spingerla.
  Era diverso, all'inizio: le pecore si comportavano da massi, una fila
  non si spingeva, e i prati partivano con le pecore già in fila. Il 25
  settembre 2026 le pecore sono diventate un gregge, e i posti prati da
  riunire.
- **Una pecora incastrata ferma la fila.** Una pecora in un angolo, o contro
  un bordo lungo che non ha un «dietro» dove il cane possa mettersi, non si
  recupera più. Il gioco lo sa già (si calcola una volta per livello, dal
  recinto all'indietro) e non lascia il bambino ad aggiungere frecce a una
  partita persa: la fila si ferma lì come contro un albero, la pecora trema
  nel suo angolo, la sua cella pulsa e lampeggia la freccia che ce l'ha
  mandata. È il «posto dove non la puoi recuperare», detto nel momento in
  cui succede.
- **L'osso è la carota del cane**: la seconda stella, e il giro per
  prenderlo è quasi sempre quello che rischia di spaventare la pecora dalla
  parte sbagliata.

**Il cane non è un gradino a parte.** Dopo i primi quattro posti, il suo
gradino rifà le regole che il bambino ha già: il ghiaccio (due volte), la
buca che lo fa sbucare alle spalle della pecora, il fiume che il cane salta
e la pecora no, il masso che diventa il ponte per lei. E poi **torna in ogni
gradino dello zaino**, con la carta di quel gradino: col 🔁 passa lungo una
fila di stalle e le pecore ci scendono una dopo l'altra; col «fino a» le
stalle sono su due corridoi lunghi diversi, e nessun numero va bene per
tutti e due; col ❓ le lastre del corridoio dicono dove c'è una pecora da
spingere in fondo alla sua nicchia, sopra o sotto; e in tutto il mondo ogni
pecora vuole due spinte sul ghiaccio, la seconda data scivolandole dietro.
Con lo zaino la meta non cambia: la fila si ferma quando l'ultima pecora
entra, quindi «ripeti fino a 🏠» per il cane vuol dire «finché il gregge non
è dentro».

Ogni tappa del cane porta le sue **trappole**: la mossa ingenua di quel
posto — passare sotto la pecora per arrivare all'osso, spingerla troppo in
là — che deve fare un pezzo di strada e poi fallire, contro la pecora o con
la pecora incastrata. È lì che si vede dove si è sbagliato, ed è un test a
pretenderlo.

Il gradino sta fra le buche e lo zaino, a portata 44 come «Tutto insieme»:
è il passo dopo per chi ha sei anni e ha finito le buche, e lo zaino a
quell'età resta chiuso. Chi era già più avanti quando è arrivato (il 25
settembre 2026) lo trova aperto alle spalle, e niente di quello che aveva
vinto si richiude: il travaso della fila tiene la tappa raggiunta dov'era
(`riordina` in `dati/campagna.js`).

## Lo zaino e il ripeti

Dopo le buche il mondo smette di crescere e cresce **la lingua**. I gradini
dei grandi portano una carta nuova — per ora 🔁 **ripeti**, dai sette anni e
mezzo — e con la carta lo **zaino**: la fila tiene un numero fisso di carte,
e dopo l'ultima si vedono i posti che restano, tratteggiati.

La strada, scritta freccia per freccia, nello zaino **non ci sta**. Il viale
è lungo cinque passi e lo zaino tiene tre carte: per arrivare bisogna dire
«ripeti 5 volte →», e poi ↓. Il ciclo non è una comodità che si può saltare
scrivendo più frecce: è l'unico modo di farcela, e un test lo pretende da
ogni livello. Lo zaino non è la quarta stella: è un tetto per arrivare.
Oggi ogni zaino è largo quanto la sua soluzione, quindi lì la stella
della strada più corta la dà già la carota.

- **Una scatola.** 🔁 mette una scatola dove sta il cursore, col cursore
  dentro, e sopra le frecce compare la scelta del numero, da 2 a 9. Il
  numero nasce **N**, da scegliere: un valore già scritto si leggerebbe
  come l'unico possibile. ▶ con una N ancora dentro non parte, e riapre la
  scelta che manca.
- **Dentro e fuori.** Le frecce messe col cursore dentro la scatola si
  ripetono; il bordo in fondo alla scatola, toccato, mette il cursore
  subito fuori. Toccare la testa della scatola riapre la scelta del numero.
  ⌫ subito dopo una scatola la toglie intera; in cima al suo corpo toglie
  il 🔁 e lascia le frecce che aveva dentro.
- **A che giro siamo.** Mentre il coniglio corre, la testa della scatola dice
  il giro — «3/5» — e la freccia che sta girando si accende. Se sbatte
  dentro un ciclo il giro resta scritto, arancione: «al sesto giro» è mezza
  soluzione.
- **Scatole dentro scatole.** Un gradino grande è fatto di passi piccoli:
  nelle terrazze e nel campo arato il ciclo sta dentro un altro ciclo.

Le regole del mondo restano tutte: un ciclo di salti per passare il fiume, e
un ciclo sul ghiaccio, dove la stessa freccia fa strade lunghe diverse e il
ciclo va bene lo stesso — a fermare il coniglio ci pensano i sassi. Oltre i
novanta passi al coniglio gira la testa e la fila si ferma: un ciclo che va
avanti e indietro per sempre non è un programma che finisce.

Qui il 💡 non parte dalla strada più corta, che nello zaino non ci sta, ma
dalla **soluzione scritta** nel livello più simile al programma del bambino,
e dice una di quattro cose: qui ci va questa freccia, qui ci va una scatola
(in trasparenza, col suo numero), questa scatola va ripetuta tante volte (la
sua testa pulsa), questa carta è di troppo (⌫ brilla). Se il programma del
bambino è quasi arrivato e il pezzo che manca ci sta sciolto, gli dice
quello, e non lo rimanda indietro.

## Il «fino a», il «se» e tutto il mondo

Lo zaino resta, e la scatola impara due cose nuove. Tutte e due guardano
**per terra**: le lastre colorate.

- **🔁 fino a 🔴** — la testa della scatola, invece di un numero, è un
  colore: si fa un giro, e alla fine di ogni giro il coniglio guarda cosa
  ha sotto i piedi; se è la lastra rossa smette. Almeno un giro sempre: in
  un angolo si è già sul rosso, e «fino al rosso» vuol dire il prossimo.
  Serve dove la **stessa scatola deve fare strade lunghe diverse** — i
  gradini storti, i solchi del campo storto, i lati della spirale che si
  accorciano: un numero va bene una volta sola, ed è la scatola dentro la
  scatola che lo zaino pretende. Nella scelta della testa, sotto i numeri,
  ci sono i colori che quella mappa ha.
- **❓ se 🔵** — una scatola che si fa **una volta o niente**: se il
  coniglio è sulla lastra blu fa quello che ha dentro, se no la salta. Con
  la testa **🔁 fino a 🏠** (ripeti finché non sei a casa) il coniglio legge
  le lastre una per una, e una strada che gira in tre versi — rosso giù,
  blu avanti, giallo su — sta tutta in un programma di sei o otto carte.
  Il «fino a» sa dire quando smettere; da che parte andare dopo, lo sa
  solo il se.

Un giro che non muove il coniglio (un se che non scatta mai, dentro un
«fino a») non cambierà mai quello che ha sotto i piedi: la fila si ferma lì
come quando gli gira la testa, invece di aspettare per sempre.

**Le false piste.** In questi gradini chi sbaglia non sbatte al primo passo
contro un albero: prosegue su una strada che sembrava buona, e finisce in
un fosso, in uno stagno o fermo in un angolo. I gradini storti e i solchi
del campo continuano oltre la lastra rossa, e sotto ci sono i fossi: chi
conta invece di guardare va avanti e ci cade. Nelle colline e nel sentiero
dei segni chi legge un colore al contrario trova una stradina (con i suoi
segni) che porta allo stagno; nel bosco ghiacciato scivola dritto nel buco
del ghiaccio. È lì che si vede *quale* scatola era sbagliata. Il test lo
pretende dalle mosse ingenue di ogni livello: almeno due passi prima di
fermarsi.

L'ultimo gradino, **tutto il mondo**, rimette le regole del mondo insieme
alle scatole: sul ghiaccio sono i sassi a fermare una scatola che gira (la
spirale di ghiaccio si fa con quattro frecce, senza lastre), nell'acqua è
il masso a fare il ponte a ogni giro, nel fiume si ripete un salto finché
non si arriva al sasso rosso, e nel bosco ghiacciato si scivola da un
segnale all'altro leggendoli. Le mappe arrivano a nove per undici: sul
telefono una cella resta sui trenta pixel.

Con lo zaino le tessere della fila sono un poco più piccole (come sugli
schermi bassi): un se dentro un ripeti sono tre scatole in fila, e devono
stare su due righe.

## Le stelle, le monete, gli aiuti

Quattro stelle per tappa, per quattro cose diverse: ⭐ **arrivato** (per il cane:
il gregge nel recinto), ⭐ **con la carota** (l'osso), ⭐ **la strada l'hai
trovata tu** (🧠) e ⭐ **la strada più corta** (🎯). Sul cartello di fine, sotto
ogni stella c'è il disegno di cosa l'ha data: una stella spenta con sotto la
carota dice da sola che rigiocando la si può prendere. La terza la spegne
solo la strada intera comprata col 💡: gli altri aiuti si pagano in monete.

La quarta è arrivare **con la carota** usando meno carte possibile — non
meno celle: una scivolata sul ghiaccio è una freccia sola. Sotto la
stella c'è 🎯 col numero che basta, e chi ne ha usate di più legge coi
due numeri che si poteva fare meglio («si può fare con 7 frecce: tu ne
hai usate 12»); nel sentiero senza fine le stelle non ci sono, ma la
riga sì. Le carte si contano fino a quella che ha portato a casa.
Senza zaino il minimo lo misura il risolutore, ed è esatto; con lo zaino
è la più corta delle soluzioni scritte, e siccome la stella chiede «al
più» chi trova di meglio non perde niente. Che le soluzioni scritte
siano davvero le più corte lo controlla `strumenti/passo-passo/minimi.mjs`,
che cerca il programma più corto coi cicli (scatole fino a sei carte).

Non c'era, all'inizio, e apposta: «arrivarci è arrivarci». È arrivata
perché senza nessun incentivo si vedevano file da quaranta frecce su
posti che se ne chiedono dodici. **Il 💡 porta sempre alla strada più
corta**: se la fila arriva già ma è lunga, il 🔎 dice dove accorciarla,
e chi segue gli aiuti prende anche la quarta — se no il gioco ti
aiuterebbe e poi ti direbbe che si poteva fare meglio.

La carota non serve mai per vincere. Nei primi livelli sta sulla strada,
poi chiede una deviazione, poi una deviazione **pensata**: sul ghiaccio,
dall'altra parte di un buco, al di là della buca giusta.

Una tappa paga le sue monete **una volta sola**, alla prima vittoria (🪙4
nei primi passi, 🪙12 alle buche, da 🪙14 a 🪙20 con lo zaino): il livello
è fisso, e rigiocarlo è ricordarlo, non esercitarsi. Il sentiero senza
fine paga 🪙3 per sentiero, perché lì ogni sentiero è nuovo.

Il 💡 è **una scala**, e ogni tocco scende di un gradino
(`motore/aiuti.js`). I primi due sono **gratis** e non danno la risposta: il
primo aiuta a ragionare — una frase su cosa chiede quel posto, ricavata da
quello che c'è sulla mappa (il ghiaccio, i massi, le buche, lo zaino) e da
leggere al bambino se ancora non legge — il secondo dice **dove** la fila
comincia a sbagliare: il cursore va lì e le frecce dopo si spengono un poco,
ma la freccia giusta non la dice. Poi si paga in monete: **🪙10** la freccia
giusta (tre volte al massimo), mostrata in due posti — **dentro la fila**,
tratteggiata, nel punto dove va, e sulla pulsantiera, col suo tasto che
brilla — e la mette il bambino; **🪙50** e **🪙100** un pezzo di strada
scritto nella fila (un terzo di quello che manca, poi la metà); **🪙200** la
strada intera, che vince ma spegne la terza stella. I pezzi sono quello che
farebbe chi segue il 💡 a occhi chiusi, a partire da dove la fila va bene.
Il prezzo sta sul tasto **prima** di toccarlo, in un bollino con la moneta;
dai 50 in su ci vuole un secondo tocco, e senza monete il bollino si spegne
e non succede niente. Una freccia già pagata e non ancora messa si
riaccende gratis. La scala riparte a ogni ingresso: ogni gradino guarda la
fila di adesso, e la fila riparte vuota. E il 💡 non si spegne mai: premuto
mentre il coniglio corre si accende e aspetta, e il gradino arriva quando il
coniglio si ferma — è proprio mentre lo si vede sbattere che lo si cerca.

## Le tappe

Ventiquattro posti in cinque gradini per i piccoli, undici per il cane
pastore, e ventidue con lo zaino in quattro gradini — quattro di questi
sono ancora del cane.
Ognuno ha la sua forma — un prato,
un bosco, un fiume con le isole, un lago ghiacciato col buco — e ognuno con
il suo piccolo «aha». Le mappe sono scritte a mano, al massimo sette celle
per nove, così stanno intere su un telefono.

| | | frecce |
|:--|:--|:--:|
| **🐾 Primi passi** | *solo frecce: si cammina, si gira attorno, non si entra nell'acqua* | |
| 1. Il prato | la carota sta sulla strada: si scopre che il coniglio fa quello che dice la fila | 3 |
| 2. Il cespuglio | dritti si sbatte: bisogna girarci attorno | 5 |
| 3. Lo stagno | due strade attorno allo stagno, e la carota è su una delle due | 7 |
| 4. Il bosco | un bivio fra gli alberi: la strada corta porta a casa, quella lunga dalla carota | 7 |
| 5. L'orto | la carota è piantata in un buco della fila | 8 |
| **🦘 Il salto** | *il salto scavalca una cella: l'acqua e i tronchi sì, i sassi no* | |
| 6. Il ruscello | si salta, e si atterra sulla carota | 3 |
| 7. Il tronco | il sasso è alto e non si salta, il tronco sì | 6 |
| 8. Il fosso | il fosso è largo due: bisogna trovare la secca in mezzo | 7 |
| 9. L'orto recintato | si salta dentro la staccionata e si salta fuori | 4 |
| 10. I sassi nel fiume | da un'isola all'altra, cambiando direzione | 7 |
| **❄️ Il ghiaccio** | *sul ghiaccio si scivola finché qualcosa non ferma* | |
| 11. Il laghetto ghiacciato | una freccia sola attraversa tutto il lago | 2 |
| 12. Il sasso che frena | per scendere nella colonna giusta ci si ferma contro il sasso | 4 |
| 13. Il ghiaccio rotto | dritti si finisce nel buco; la carota vuole il sasso e il ritorno | 5 |
| 14. Il fiume gelato | la carota si prende solo scendendo nel punto giusto | 5 |
| 15. Il labirinto di ghiaccio | sette frecce e una strada sola: ogni scivolata finisce contro un sasso | 7 |
| 16. La crepa | ci si ferma accanto alla crepa, contro un sasso, e poi la si salta | 6 |
| **🪨 I massi** | *un masso si spinge: sul ghiaccio scivola, nell'acqua fa un ponte* | |
| 17. Il masso | spinto, il masso apre la strada | 7 |
| 18. Il ponte di sasso | niente salti: il masso nell'acqua diventa un ponte | 8 |
| 19. Il masso sul ghiaccio | il masso scivola in fondo e diventa il sasso che ti ferma | 5 |
| 20. Due massi | prima si sposta quello davanti, poi l'altro va nell'acqua | 10 |
| **🕳️ Le buche** | *si entra in una buca e si esce dalla gemella* | |
| 21. Le buche | la siepe non si passa, ma sotto c'è una galleria | 6 |
| 22. La buca nel ghiaccio | la tana è su un'isola, e ci porta la buca in mezzo al lago | 5 |
| 23. Le buche colorate | la rosa porta alla carota, la viola alla tana | 7 |
| 24. Tutto insieme | la staccionata, il masso nel fiume, il lago, la buca | 12 |
| **🐑 Il cane pastore** | *le pecore scappano dal cane: portale tutte nel recinto* | |
| 25. Il primo gregge | il cane parte a tre caselle: la pecora si scansa prima che arrivi, fino al recinto. L'osso chiede un giro che non le passi sotto | 7 |
| 26. Dall'altra parte | per mandarla giù il cane le sta sopra, e per arrivarci le gira attorno in diagonale, mai sulla sua riga | 8 |
| 27. Una spinge l'altra | prima la si mette accanto all'altra, poi si spingono tutte e due: entrano una dietro l'altra | 8 |
| 28. La curva | prima a destra, poi giù: chi la spinge troppo in là la incastra contro il bordo | 15 |
| 29. La pecora sul ghiaccio | scivola finché il sasso non la ferma, proprio sopra il cancello | 8 |
| 30. La galleria | la buca passa sotto la siepe: il cane sbuca alle spalle della pecora | 10 |
| 31. Il guado | due pecore di là dal fiume: il cane lo salta, e dove atterra conta | 10 |
| 32. Il lago gelato | scivolano tutti e due, la pecora fino all'erba e il cane fino al sasso | 11 |
| 33. Riunire il gregge | tre pecore sparse per il prato: in fila, e poi dentro tutte insieme | 17 |
| 34. Il ponte per le pecore | prima il masso nel fosso, poi la pecora sopra il ponte | 16 |
| 35. Il gregge | quattro pecore sparse e un cancello solo: a coppie e a file, fino al recinto | 18 |
| **🔁 Il ripeti** | *nello zaino ci stanno poche carte: una scatola 🔁 ripete quello che ha dentro* | zaino |
| 36. Il viale | una scatola, una freccia, il numero giusto: né sei né quattro | 3 |
| 37. Le stalle | il cane passa lungo il corridoio, e ogni pecora scende nella sua stalla | 2 |
| 38. Lo stagno grande | una scatola per lato, e la carota sta da una parte sola | 4 |
| 39. La scala | due frecce in una scatola, e l'ordine conta: la carota è su un gradino solo | 3 |
| 40. Di sasso in sasso | anche un salto si ripete | 3 |
| 41. Il lago a gradini | la stessa freccia fa una, tre, due caselle, e il ciclo regge | 3 |
| 42. La collina | su e giù: due scatole diverse; la strada di mezzo è più corta ma non si ripete | 6 |
| 43. Le terrazze | una scatola dentro l'altra, e si scende per due strade | 5 |
| 44. Il campo arato | avanti e indietro fra le siepi: quattro scatole dentro una | 9 |
| **🚩 Fino a** | *una scatola che non conta: ripete finché il coniglio non arriva sulla lastra del colore giusto* | zaino |
| 45. I gradini storti | tre gradini diversi sopra i fossi: si va fino al rosso, e si scende | 5 |
| 46. Le stalle a gradini | due corridoi di stalle lunghi diversi: con un numero, uno dei due va storto | 5 |
| 47. Scale e pianerottoli | due colori: la scala fino al rosso, il pianerottolo fino al blu | 7 |
| 48. Il campo storto | i passaggi fra i fossi sono ogni volta in un posto diverso | 9 |
| 49. La spirale | ogni lato più corto del prima, e agli angoli le lastre rosse | 9 |
| **❓ Il se** | *il coniglio guarda cosa ha sotto i piedi, e decide* | zaino |
| 50. Le colline | avanti sempre: sul rosso si scende, sul giallo si sale | 6 |
| 51. Il sentiero dei segni | ogni lastra dice dove andare, in tre versi | 9 |
| 52. Le nicchie | le lastre dicono dove c'è una pecora da spingere in fondo alla sua nicchia, sopra o sotto | 8 |
| **🌍 Tutto il mondo** | *il ghiaccio, i massi, i salti e i segnali, con le scatole* | zaino |
| 53. La spirale di ghiaccio | quattro frecce e a ogni giro il cerchio si stringe: fermano i sassi | 5 |
| 54. Le pozze | a ogni gradino un masso nella pozza, e la stessa scatola lo spinge | 5 |
| 55. Il fiume dei sassi | di sasso in sasso fino al rosso, e un salto giù oltre la siepe | 7 |
| 56. Il lago delle stalle | due spinte a pecora: la seconda gliela dà il cane scivolandole dietro | 7 |
| 57. Il bosco ghiacciato | quattordici scivolate, e un programma solo che legge i segnali | 8 |

La colonna «frecce» è la strada più corta **con la carota**, misurata dal
risolutore; per i livelli con lo zaino è quante carte tiene lo zaino. La regola di ogni gradino **deve servire**, ed è un test a
dirlo: un livello del ghiaccio che si vince anche col ghiaccio trattato da
prato, o uno dei massi che si vince girando attorno al masso, insegnerebbe
un'altra cosa.

## Il sentiero senza fine

Finite le buche si apre il **sentiero senza fine** (sulla mappa sta
subito dopo di loro, e non in fondo: è dei piccoli, e chi non ha ancora
l'età dello zaino gioca lì): livelli fatti al
momento, a caso, e tenuti solo se il risolutore dice che si vincono, che la
strada è lunga quanto il gradino chiede, che la carota vuole una deviazione
e che la regola nuova serve davvero. Ogni due sentieri se ne aggiunge una,
nello stesso ordine della campagna, poi si mescola. Chi ha portato il
gregge nel recinto (l'ultima tappa del cane) trova anche **le pecore**: un
sentiero sì e uno no è un pascolo, con una scala sua — una pecora, poi il
ghiaccio, poi due, e in cima tre pecore sparse da riunire — fatto e
controllato allo stesso modo, e con le pecore
mai incastrate in partenza. Quello che si
migliora è **quanti sentieri di fila si fanno senza comprare aiuti**:
sbagliare non chiude la serie, e nemmeno i due gradini gratis del 💡;
comprarne uno sì. Il record sta sul tasto della mappa e
nella tabella dei primati.

## Cosa allena

La **sequenza** (un programma è una fila di ordini, e l'ordine conta),
l'**esecuzione dall'inizio** (il programma si rifà tutto, non riparte da
dove si è rotto), il **debug** (trovare *quale* ordine è sbagliato, non
ricominciare da zero), e da un certo punto in poi la **pianificazione**:
col ghiaccio una freccia vale molte celle, e bisogna pensare dove ci si
fermerà prima di scriverla.

## Come si scrive un livello

Una mappa è un elenco di righe, un carattere per cella (la legenda sta in
`src/giochi/passo-passo/dati/mondo.js`):

    .  prato      ~  acqua      *  ghiaccio      @  tana      P  partenza
    c  carota     C  carota sul ghiaccio
    m  masso      M  masso sul ghiaccio
    A  albero     B  cespuglio   S  sasso   O  sasso nel ghiaccio   (alti)
    t  tronco     -  staccionata                                    (bassi)
    1 2 3  le buche, a coppie
    p  una pecora   #  il recinto   (un livello con le pecore non ha la tana)

Una tappa dichiara anche il gradino, la `portata` (la scala di tutto il
repo: dal 4 del prato al 44 di «Tutto insieme» e del cane, e dal 46 al
74 con lo zaino), il premio della prima vittoria, la
stagione (è solo il vestito) e `salti: true` se usa la seconda fila di
frecce; quelle del cane anche le `trappole`. Il test `test/unita/passo-passo` fa il resto: controlla che si vinca
con la carota, che la strada giocata dal motore vinca davvero con
quattro stelle, che la regola del gradino serva, e che chi segue soltanto gli aiuti
arrivi a casa.

## Note per i genitori

- **Nessuna parola da leggere**: si gioca senza saper leggere. Il testo
  piccolo sulla mappa e sui cartelli è per chi guarda da sopra la spalla.
- **Non si perde.** Le stelle dicono com'è andata; la tappa si chiude
  quando il coniglio è a casa.
- **Gli aiuti non risolvono**: indicano la prossima freccia, e la mette il
  bambino.
- **Da quattro a sette anni e mezzo, e poi i cicli**: le tappe dei piccoli
  (il cane compreso) vanno dal 4 al 44 della scala delle tappe — a sei anni
  sono aperte tutte,
  a cinque le prime quattordici — e quelle dello zaino dal 46 al 74, cioè
  dai sette anni e mezzo ai dieci. Dietro non c'è un pezzo di scuola, quindi a
  un bambino più grande non si chiude niente: vedi [come l'età decide cosa
  si vede](genitori.md#quanti-anni-ha). Per lo stesso motivo il gioco non si
  spegne a otto anni come i giochi dei piccoli: comincia da lì, ma cresce.
