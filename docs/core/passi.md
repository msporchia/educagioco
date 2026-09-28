# Dove si può mettere il piede (`src/motore/passi.js`)

Il pezzo di motore comune a fattoria e sotterraneo: quali celle sono buone e
che strada le unisce. Prima ognuno lo scriveva per conto suo.

## Lo spazio arriva da fuori

Non c'è nessuna mappa qui dentro: chi chiama passa `buona(x, y)`, una
funzione che dice se su quella cella ci si può stare, e questo file non sa
**perché** (roccia, bosco altrui, mostro addormentato) — la stessa scelta di
`grafica/tessere.js`. Lo stesso codice risponde a domande diverse cambiando
solo `buona`: è così che si controlla che un livello sia finibile senza
giocarlo (`raggiungibili`/`siArriva`).

## Perché in ampiezza e non A*

Le griglie sono piccole (qualche migliaio di celle) e i passi costano tutti
uguale: la ricerca in ampiezza dà la strada più corta senza euristiche da
tarare. `TETTO` (50000) non è pignoleria: una `buona` che dice sempre sì
(un errore di segno sui bordi) manderebbe la ricerca a esplorare l'infinito.

Niente diagonali (`PASSI`): su una griglia a tessere una diagonale passa fra
due muri che si toccano per un angolo, e a schermo si vede un personaggio
attraversare la roccia.

## `percorso`: esclusa la partenza, inclusa l'arrivo

`arrivoLibero` serve al caso più comune: la cella d'arrivo è occupata da
quello che si vuole raggiungere (un mostro, un forziere). Con `false` la meta
si attraversa solo per arrivarci, mai per passarci in mezzo.

## `viaVerso`: la cella stessa viene prima, quando si sale

`accanto`/`viaVerso` scelgono la vicina più comoda **per chi arriva** (la più
vicina in linea d'aria), poi verificano che una strada ci sia davvero — «più
vicino» non vuol dire «raggiungibile»: un mostro in un corridoio ha due lati,
e quello più vicino può essere di là.

Quando `sopra` è vero, la cella della meta va **prima** delle vicine e non
ordinata insieme a loro per distanza: ordinata per distanza perde sempre,
perché chi arriva incontra la vicina un passo prima della meta e si ferma
lì. Si è visto sulle monete: il dito le tocca, l'eroe si pianta accanto e
non le raccoglie, perché si prendono camminandoci sopra. Costa fino a
cinque ricerche invece di una, e succede solo al tocco: non si sente su
griglie di qualche migliaio di celle.

## Il resto

`primaLibera` si allarga a cerchi e si ferma al primo posto buono (per
posare un animale comprato o un oggetto caduto): meglio niente che piazzato
dall'altra parte della mappa. `passiFra` misura la distanza **a passi**, non
in linea d'aria: serve a scegliere l'uscita di un livello (la stanza più
lontana da percorrere) e torna `Infinity` se non ci si arriva.
