# La scena: perché la strada è disegnata così

`scena/pista.js` disegna una scena già decisa (`Partita.scena()`): non
sa cos'è un esercizio, quanto valga un moltiplicatore o perché la
truppa cresca, sa solo dove va messo un pixel.

## Quanta vista prende la strada

Nel prototipo la strada occupava il 40% della vista (il resto prato e
cielo), cioè il contrario di dove guarda chi gioca: i tre cancelli fra
cui scegliere stavano schiacciati in una fascia larga due dita. Tre
leve mosse insieme portano la strada al 57% (misurato su un telefono da
390×732):

- `ORIZZONTE` — il cielo si prende un settimo dello schermo e basta.
- `LARGHEZZA` — la corsia è larga più di un terzo dello schermo: la
  strada al piede del giocatore esce apposta dai bordi (la banchina non
  serve a niente).
- `STRETTA` — quanto in fretta le cose rimpiccioliscono con la
  distanza, dimezzata rispetto al prototipo: una prospettiva più dolce
  tiene la strada larga anche lontano, e i cancelli restano leggibili
  da quaranta metri (tutto il tempo che si ha per decidere).

Oltre non si va allargando ancora la corsia: a `LARGHEZZA` 0.42 i
cancelli laterali escono dallo schermo.

Larghezza della corsia e larghezza della strada sono due numeri
diversi (`BORDO`): la strada deve uscire dai bordi, ma la corsia di
destra no, o l'ultima fila della truppa ci finirebbe sopra tagliata.

La foschia in fondo alla strada non è decorazione: sotto l'orizzonte,
dove la strada è ancora stretta, restano due cunei di verde che
l'occhio legge come «il gioco è un nastrino in mezzo a un campo» — la
prospettiva da sola non li toglie (è geometria), la foschia sì.

Il contorno a lato strada (alberi, lampioni, cactus...) arriva fino
all'orizzonte e non a 150 metri: fermato prima lasciava una fascia di
prato vuota che si leggeva come una montagna.

## I cancelli e i mostri

Solo il cancello su cui si sta decidendo è leggibile (`c.attivo`); il
successivo si intravede appena — sei numeri in fila sono confusione, non
scelta. Un cancello si dissolve negli ultimi due metri prima di
attraversarlo: alto un terzo di schermo coprirebbe la truppa proprio
nell'istante in cui il bambino vuole vedere quanto è cresciuta. Tre
cancelli sono disegnati identici (un solo colore): il verde/rosso di
prima rispondeva alla domanda da solo. L'oro resta diverso perché non
dice quanto vale, dice che lì ci si ferma.

Il mostro mostra tanti simboli quanti gliene restano (fino a cinque, di
più si sovrappongono in una macchia); il boss è uno solo e grosso.

Il traguardo è un arco (pali + striscione), non una striscia a terra
vista di scorcio: a terra sarebbe alta tre pixel e invisibile.

## La truppa

I soldati si dispongono per grado dal centro ai lati (i più forti in
mezzo, come una formazione vera, non in fila d'attesa) e per riga si
prendono le caselle più centrali di una griglia piena, invece di
riempire da sinistra — altrimenti con pochi soldati la truppa correva
tutta addossata a un bordo della corsia. Ogni riga si centra sulle
colonne che occupa davvero, non sulla colonna centrale della griglia
intera, o con un numero di soldati che non riempie tutta la riga lo
schieramento risulterebbe storto.

Un soldato è disegnato (non un'emoji) perché il colore deve dire quanto
vale: è l'unica cosa che questo gioco chiede di leggere guardando per
terra.
