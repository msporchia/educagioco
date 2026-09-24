[← torna al README](../README.md)

# 🐇 Passo passo

*Il primo gradino della programmazione, per chi non sa ancora leggere — e
poi i cicli, per chi ha otto anni.* Un coniglio deve tornare nella sua
tana. Il bambino non lo guida col dito: gli scrive una **fila di frecce**,
preme ▶, e il coniglio la esegue dall'inizio alla fine. Se qualcosa va
storto si guarda *quale* freccia era sbagliata, la si cambia, e si riprova.

È un gioco **in prova**: si vede solo con «giochi in prova» acceso nella
pagina dei grandi.

## Come è fatto

Dall'alto in basso: il posto (una mappa vista dall'alto, in pixel art), la
**fila** delle frecce scritte, i tasti delle frecce, e in fondo ⌫ ▶ 💡. Non
c'è niente da leggere per giocare: le frecce sono disegni, il coniglio è in
testa alla fila, e quello che succede si vede.

- **Si compone toccando, mai trascinando.** Ogni tasto aggiunge una freccia
  dove sta il **cursore** (la sbarra arancione che lampeggia, di partenza in
  fondo). Toccare una tessera sposta il cursore subito dopo di lei; toccare
  il coniglio in testa lo porta all'inizio; ⌫ toglie la freccia prima del
  cursore.
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

E la **tana**: arrivarci, in qualunque modo e in qualunque momento, vince
subito — le frecce dopo non contano.

Tre cose che le regole non dicevano, e che il gioco ha dovuto decidere:
saltando non si prende la carota che sta **in mezzo** (si prende quello su
cui si mette la zampa) e non si entra nella tana che sta in mezzo — vederci
passare sopra è il modo più chiaro di capire che il salto è lungo due; non
si atterra su un masso (lo si spinge solo camminando); un masso non si
spinge sulla tana, sulla carota o su una buca, che sparirebbero sotto un
sasso.

## Lo zaino e il ripeti

Dopo le buche il mondo smette di crescere e cresce **la lingua**. I gradini
dei grandi portano una carta nuova — per ora 🔁 **ripeti**, dai sette anni e
mezzo — e con la carta lo **zaino**: la fila tiene un numero fisso di carte,
e dopo l'ultima si vedono i posti che restano, tratteggiati.

La strada, scritta freccia per freccia, nello zaino **non ci sta**. Il viale
è lungo cinque passi e lo zaino tiene tre carte: per arrivare bisogna dire
«ripeti 5 volte →», e poi ↓. Il ciclo non è una comodità che si può saltare
scrivendo più frecce: è l'unico modo di farcela, e un test lo pretende da
ogni livello. **Non è un par**: le stelle restano le stesse tre, e usare meno
carte del necessario non vale niente di più.

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

## Le stelle, le monete, gli aiuti

Tre stelle per tappa, per tre cose diverse: ⭐ **arrivato**, ⭐ **con la
carota**, ⭐ **senza aiuti**. Sul cartello di fine, sotto ogni stella c'è il
disegno di cosa l'ha data: una stella spenta con sotto la carota dice da
sola che rigiocando la si può prendere. Non c'è un numero di mosse da
battere: arrivarci è arrivarci.

La carota non serve mai per vincere. Nei primi livelli sta sulla strada,
poi chiede una deviazione, poi una deviazione **pensata**: sul ghiaccio,
dall'altra parte di un buco, al di là della buca giusta.

Una tappa paga le sue monete **una volta sola**, alla prima vittoria (🪙4
nei primi passi, 🪙12 alle buche, 🪙14 e 🪙16 con lo zaino): il livello è fisso, e rigiocarlo è
ricordarlo, non esercitarsi. Il sentiero senza fine paga 🪙3 per sentiero,
perché lì ogni sentiero è nuovo.

Il 💡 **non dice la soluzione** (con lo zaino, vedi sopra). Trova il pezzo più lungo della fila che va
ancora bene, ci mette il cursore, e mostra la freccia giusta in due posti:
**dentro la fila**, tratteggiata, nel punto dove va, e sulla pulsantiera,
col suo tasto che brilla. La mette il bambino, toccando l'una o l'altro. Le
frecce dopo il cursore, se ci sono, si spengono un poco. Il tasto dice
**prima** di essere toccato cosa costa — un ⭐ col meno sopra — e una volta
speso, gli aiuti di quel giro sono gratis. E non si spegne mai: premuto
mentre il coniglio corre si accende e aspetta, e il consiglio arriva quando
il coniglio si ferma — è proprio mentre lo si vede sbattere che lo si
cerca.

## Le tappe

Ventiquattro posti in cinque gradini per i piccoli, e otto con lo zaino.
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
| **🔁 Il ripeti** | *nello zaino ci stanno poche carte: una scatola 🔁 ripete quello che ha dentro* | zaino |
| 25. Il viale | una scatola, una freccia, il numero giusto: né sei né quattro | 3 |
| 26. Lo stagno grande | una scatola per lato, e la carota sta da una parte sola | 4 |
| 27. La scala | due frecce in una scatola, e l'ordine conta: la carota è su un gradino solo | 3 |
| 28. Di sasso in sasso | anche un salto si ripete | 3 |
| 29. Il lago a gradini | la stessa freccia fa una, tre, due caselle, e il ciclo regge | 3 |
| 30. La collina | su e giù: due scatole diverse; la strada di mezzo è più corta ma non si ripete | 6 |
| 31. Le terrazze | una scatola dentro l'altra, e si scende per due strade | 5 |
| 32. Il campo arato | avanti e indietro fra le siepi: quattro scatole dentro una | 9 |

La colonna «frecce» è la strada più corta **con la carota**, misurata dal
risolutore; per i livelli con lo zaino è quante carte tiene lo zaino. La regola di ogni gradino **deve servire**, ed è un test a
dirlo: un livello del ghiaccio che si vince anche col ghiaccio trattato da
prato, o uno dei massi che si vince girando attorno al masso, insegnerebbe
un'altra cosa.

## Il sentiero senza fine

Finite le tappe dei piccoli si apre il **sentiero senza fine** (sulla mappa
sta subito dopo le buche, e non in fondo: è il loro, e chi non ha ancora
l'età dello zaino gioca lì): livelli fatti al
momento, a caso, e tenuti solo se il risolutore dice che si vincono, che la
strada è lunga quanto il gradino chiede, che la carota vuole una deviazione
e che la regola nuova serve davvero. Ogni due sentieri se ne aggiunge una,
nello stesso ordine della campagna, poi si mescola. Quello che si
migliora è **quanti sentieri di fila si fanno senza aiuti**: sbagliare non
chiude la serie, chiedere il 💡 sì. Il record sta sul tasto della mappa e
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

Una tappa dichiara anche il gradino, la `portata` (la scala di tutto il
repo: dal 4 del prato al 44 di «Tutto insieme», e dal 46 al 58 con lo
zaino), il premio della prima vittoria, la
stagione (è solo il vestito) e `salti: true` se usa la seconda fila di
frecce. Il test `test/unita/passo-passo` fa il resto: controlla che si vinca
con la carota, che la strada giocata dal motore vinca davvero con tre
stelle, che la regola del gradino serva, e che chi segue soltanto gli aiuti
arrivi a casa.

## Note per i genitori

- **Nessuna parola da leggere**: si gioca senza saper leggere. Il testo
  piccolo sulla mappa e sui cartelli è per chi guarda da sopra la spalla.
- **Non si perde.** Le stelle dicono com'è andata; la tappa si chiude
  quando il coniglio è a casa.
- **Gli aiuti non risolvono**: indicano la prossima freccia, e la mette il
  bambino.
- **Da quattro a sette anni e mezzo, e poi i cicli**: le tappe dei piccoli
  vanno dal 4 al 44 della scala delle tappe — a sei anni sono aperte tutte,
  a cinque le prime quattordici — e quelle dello zaino dal 46 al 58, cioè
  dai sette anni e mezzo in su. Dietro non c'è un pezzo di scuola, quindi a
  un bambino più grande non si chiude niente: vedi [come l'età decide cosa
  si vede](genitori.md#quanti-anni-ha). Per lo stesso motivo il gioco non si
  spegne a otto anni come i giochi dei piccoli: comincia da lì, ma cresce.
