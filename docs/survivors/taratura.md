# La taratura: i numeri misurati

`dati/taratura.js` è l'unico posto con i numeri del gioco: il motore non
ne ha di suoi. Le tre leve di difficoltà (quanti mostri nascono al
secondo, quanta vita hanno, quanto vanno di fretta) sono funzioni del
tempo; una tappa le moltiplica per i propri `ritmo`, `vigore`, `fretta`.

## L'arco e le gemme

L'arco tira piano di partenza (`cadenza` 0.5s): da fermo l'eroe non sta
dietro a quanti mostri nascono, ed è quello che costringe a muovere il
dito — a far male sono le carte, non l'arco di base.

Una gemma si prende solo a contatto (raggio dell'eroe + 12 pixel): non
c'è più una calamita di base. La carta *Calamita* è l'unico modo di
averne una: la prima copia tira da 55 pixel (poco più del contatto, si
sente ma non cambia come si gioca), ogni copia in più allarga di 35
pixel, fino a 195 a cinque copie — più del vecchio raggio di base (115)
ma meno di dove arrivava la vecchia carta al tetto (307). Prenderla
costa un posto che sarebbe andato a un'arma, e vale la pena solo
potenziandola.

## Gli oggetti a terra e i muri

Gli oggetti compaiono a tempo (più spesso con la marea) e i mostri
grossi (cinghiale, roccia, colosso) ne lasciano uno con probabilità
`daiGrossi`. La cassa è un'offerta di carte intera (una domanda in più
in palio) e ha un tetto a parte, un conto e non un peso: mai nei primi
10 secondi, mai due in campo insieme, non più di una ogni 45 secondi —
senza questo tetto, alla tana le casse arrivavano a quasi un quarto
delle offerte e i livelli (cioè le gemme, cioè l'andare in giro)
contavano di meno. Il banco tiene le offerte extra di una tappa sotto
un terzo.

I muri (una fila di mostri deboli che attraversa lo schermo con un
varco) sono l'altra metà del motivo per cui il dito serve: le gemme
restano dove cadono, i muri costringono a spostarsi per non finirci
dentro.

## La folla, la stazza e la crescita oltre il traguardo

Il tetto della folla in campo sale col tempo: con un tetto fisso, appena
l'arco supera in potenza quanti mostri nascono la partita è decisa (non
può più perdersi). Con il tetto che sale, l'unico modo di reggere è
continuare a far male più in fretta.

Dentro le nove tappe le curve di nascita/vita/fretta salgono in linea
retta (il bambino deve sentire la salita, non subirla). Oltre il
traguardo si moltiplicano: la potenza del giocatore cresce anch'essa in
modo moltiplicativo (una freccia in più moltiplica il fuoco, "mani
veloci" lo moltiplica di nuovo), e solo un'altra crescita moltiplicativa
può starle dietro — misurato: un giocatore che risponde bene passa da 2 a
1300 danni al secondo (seicento volte) in un quarto d'ora; con le vecchie
curve lineari la marea saliva solo sei volte, e dopo il traguardo non si
poteva più perdere (misurato: quindici minuti con 380 mostri intorno e
cinque cuori intatti). La vita cresce più della folla (×1.95 contro
×1.62 per tappa-tipo): è la leva vera, perché cento mostri molli si
spazzano con una magia ad area ma dieci mostri duri no.

La "stazza" (`CFG.stazza`) misura quanto la marea ha impastato i
mostri — non la mole del singolo, ma quanto in là è andata la partita —
e serve perché oltre il traguardo le magie ad area (comete, anello di
fuoco) rispedivano indietro ogni mostro prima che potesse toccare
l'eroe, qualunque fosse la sua vita: misurato, quindici minuti senza mai
un mostro a un braccio di distanza. Dentro le nove tappe la stazza vale
sempre 1 (le tappe restano tarate come prima); oltre il traguardo sale
senza tetto.

## L'esperienza

La soglia di livello (`soglia(l)`) è stata abbassata due volte: quando
le domande sono diventate un prezzo vero (chi sbaglia non prende più la
carta di consolazione) e quando è sparita la calamita di base (una
gemma si prende solo passandoci sopra, quindi chi raccoglie ne prende
circa la metà di prima). La formula attuale tiene invariati gli undici
livelli medi di una tappa per chi raccoglie bene, mentre chi sta al
centro (schiva e basta) ne fa meno di due — prima, con la vecchia
calamita che portava l'esperienza addosso, quel giocatore arrivava
comunque a quasi sei.
