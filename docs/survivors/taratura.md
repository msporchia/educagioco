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
averne una. Le copie si alternano (sua richiesta, 8/10/2026): le dispari
allargano il raggio (70, 125, 180 pixel), le pari tirano più forte (×1,5,
poi ×2). Anche piena resta più piccola della calamita trovata a terra
(420, lo schermo intero), che però dura quattro secondi. Prenderla costa
un posto che sarebbe andato a un'arma, e vale la pena solo
potenziandola.

## Il riscaldamento

Nei primi trenta secondi di ogni partita (`CFG.avvio`) nascono metà dei
mostri e tutti camminano a due terzi del passo, e si torna pieni in linea
retta. All'inizio non si ha nessuna carta e un colpo è un cuore su tre:
misurato su chi schiva a sprazzi, senza riscaldamento perdeva un cuore nei
primi trenta secondi quasi una partita su due, con il riscaldamento una su
cinque, e arriva lo stesso al livello 4. Il freno vale al passo e non alla
nascita: provato a fissarlo alla nascita, i mostri nati presto restavano
lenti per tutta la tappa e cambiavano il gioco anche dopo. Provato anche un
quarto delle nascite: si toglievano gemme, e nelle tappe lunghe chi è bravo
arrivava alla piena con un livello in meno. Il ghiacciaio ha perso un po' di
vigore (1.82 → 1.76) per restare dov'era.

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
cinque cuori intatti). La vita cresce più della folla (×2.9 contro
×2.3 per tappa-tipo, la fretta +0.2): è la leva vera, perché cento
mostri molli si spazzano con una magia ad area ma dieci mostri duri no.

Chi gioca bene abbatte i mostri appena nascono, e muore poco dopo aver
finito il mazzo (verso il livello 75): è lì che la marea raggiunge la sua
potenza massima. Quindi quanto dura la parte infinita lo decide quanto in
fretta la marea arriva a quel punto, e servono folla e vita insieme; una
leva da sola sposta poco (provato: la vita fino a ×2.8, o la fretta fino
a +0.4, toglievano due o tre minuti su dodici). Con ×1.95 e ×1.62 chi
risponde a tutto restava in campo dopo il traguardo una dozzina di
minuti; adesso otto.

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
