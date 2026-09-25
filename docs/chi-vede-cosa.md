# Chi vede cosa — la calibrazione delle domande, guardata da fuori

Questo file è **generato**: `npm run quiz:eta`. Si rilancia quando i
bambini crescono, quando si aggiunge un modulo, o quando si sposta un
livello — ed è il modo di vedere l'effetto di quello che si è appena
cambiato, che altrimenti non si vede da nessuna parte.

## Come funziona la calibrazione, in tre righe

1. **Ogni classe di domande dichiara un livello da 0 a 100.** È la sua
   complicazione in assoluto, sulla stessa scala per tutte le materie:
   zero è il primo giorno di materna, cento la fine della primaria,
   dodici punti e mezzo per anno di scuola. Sta in `livelli: [...]`
   dentro ogni modulo, una voce per grado, e l'elenco completo è in
   [`livelli-delle-domande.md`](livelli-delle-domande.md).

2. **L'età di chi gioca diventa una finestra su quella scala**: sedici
   punti sotto (un anno e poco più di roba già saputa, che serve alle
   carte facili e al ripasso) e venti sopra (un anno e mezzo di passo
   avanti). Fuori dalla finestra una domanda non arriva — né i muri né
   le prese in giro. Se dentro la finestra ci sono meno di venti classi
   la finestra **si allarga da sola**, mezzo anno per volta: capita solo
   agli estremi, dove è il mazzo a finire.

3. **La manopola del gioco sceglie il punto della finestra.** Un gioco
   chiede «una domanda facile» (0.15) o «una tosta» (0.85) e non sa chi
   ha davanti: quel numero diventa un punto dentro la finestra di chi
   gioca, e le classi pesano quanto gli sono vicine.

Sopra tutto questo un grande può ritoccare: mezzo anno per volta, su un
gruppo o su una singola tipologia (`‹ gli è difficile · gli è facile ›`
nella schermata dei grandi). E quando il bambino ha già risposto
abbastanza volte, la schermata **consiglia** il ritocco invece di
aspettare che qualcuno se ne accorga.

## La fotografia di adesso

```
══ DOVE STANNO LE DOMANDE ══
   (una riga per anno: quante classi hanno il centro lì)

  4 anni   2 █                    matematica 2
  5 anni   9 █████                matematica 2 · italiano 1 · spazio 1 · tempo 1 · logica 3 · scienze 1
  6 anni  36 ██████████████████   matematica 4 · italiano 14 · spazio 7 · tempo 4 · logica 6 · scienze 1
  7 anni  53 ███████████████████████████ matematica 19 · italiano 17 · spazio 3 · tempo 6 · logica 4 · scienze 4
  8 anni  79 ████████████████████████████████████████ matematica 32 · italiano 19 · spazio 5 · tempo 5 · logica 7 · scienze 11
  9 anni  48 ████████████████████████ matematica 23 · italiano 14 · spazio 3 · tempo 1 · logica 4 · scienze 3
 10 anni  31 ████████████████     matematica 14 · italiano 8 · spazio 2 · tempo 4 · logica 3
 11 anni  12 ██████               matematica 1 · italiano 11

   in tutto: 270 classi da 25 moduli

══ COSA VEDE UN BAMBINO ══

── 4.5 anni ──────────────────────────────────────────────
   ammesse -38–31 (1.0–6.5 anni)  ·  mira -6–31
   34 classi · matematica 5 · italiano 10 · spazio 5 · tempo 4 · logica 8 · scienze 2
   34 nella mira, 1 già alla sua portata
   ┌ carta facile → mira -0 (4.0 anni)
   │ 🦁 12  Dove vive?
   │ 📅 20  Che giorno viene 6 giorni dopo mercoledì?
   ┌ carta media → mira 13 (5.0 anni)
   │ 📐 20  Quale di queste figure è un trapezio?
   │ 🔢 12  Che numero indica la freccia?
   ┌ carta tosta → mira 26 (6.1 anni)
   │ 🗺️ 29  Cosa c'è una casella sotto a 🌵?
   │ 🕰️ 25  Che ora segna?

── 5 anni ──────────────────────────────────────────────
   ammesse -32–38 (1.5–7.0 anni)  ·  mira 1–38
   35 classi · matematica 5 · italiano 10 · spazio 6 · tempo 4 · logica 8 · scienze 2
   34 nella mira, 6 già alla sua portata
   ┌ carta facile → mira 6 (4.5 anni)
   │ 📅 20  Che giorno viene prima di martedì?
   │ ✂️ 25  Quante sillabe ha questa parola?
   ┌ carta media → mira 19 (5.5 anni)
   │ 🔢 12  Che numero indica la freccia?
   │ 📅 20  Che giorno viene dopo lunedì?
   ┌ carta tosta → mira 32 (6.6 anni)
   │ 📅 25  Quale mese viene prima di gennaio?
   │ 🅰️ 25  Che cos'è?

── 5.5 anni ──────────────────────────────────────────────
   ammesse -25–44 (2.0–7.5 anni)  ·  mira 7–44
   53 classi · matematica 10 · italiano 17 · spazio 7 · tempo 5 · logica 11 · scienze 3
   52 nella mira, 6 già alla sua portata
   ┌ carta facile → mira 12 (5.0 anni)
   │ ➡️ 20  Tre figure hanno una cosa in comune. Qual è quella che non c'e
   │ 🅰️ 12  Con che lettera comincia?
   ┌ carta media → mira 25 (6.0 anni)
   │ 🧵 38  Luca era stanchissimo, ___ ha continuato a correre.
   │ 📚 31  Chi compra le mele?
   ┌ carta tosta → mira 38 (7.1 anni)
   │ 🔗 38  Cosa manca? (da dove arriva)
   │ 📖 29  Chi non c'entra?

── 6 anni ──────────────────────────────────────────────
   ammesse -19–50 (2.5–8.0 anni)  ·  mira 13–50
   72 classi · matematica 17 · italiano 24 · spazio 7 · tempo 6 · logica 12 · scienze 6
   66 nella mira, 19 già alla sua portata
   ┌ carta facile → mira 19 (5.5 anni)
   │ 🗺️ 29  Cosa c'è una casella a sinistra di ⭐?
   │ 🍕 39.2  Che parte della barretta è colorata?
   ┌ carta media → mira 32 (6.5 anni)
   │ ✂️ 25  Quante sillabe ha questa parola?
   │ ✂️ 44  Qual è l'intruso: chi non fa rima con «sorella»?
   ┌ carta tosta → mira 44 (7.6 anni)
   │ ✏️ 38  Con che cosa si completa?
   │ 🔗 44  Cosa manca?

── 6.5 anni ──────────────────────────────────────────────
   ammesse -13–56 (3.0–8.5 anni)  ·  mira 19–56
   90 classi · matematica 22 · italiano 28 · spazio 9 · tempo 8 · logica 16 · scienze 7
   84 nella mira, 32 già alla sua portata
   ┌ carta facile → mira 25 (6.0 anni)
   │ 🧵 31  Ieri ha chiesto tre libri sui dinosauri in biblioteca ___ è ap
   │ 🕰️ 25  Che ora segna?
   ┌ carta media → mira 38 (7.0 anni)
   │ 📅 29.4  Quale mese viene dopo giugno?
   │ 💶 38  Hai in mano questi soldi: quanto fanno in tutto?
   ┌ carta tosta → mira 51 (8.1 anni)
   │ ➡️ 56  Cosa viene dopo?
   │ ✏️ 50  Come si scrive?

── 7 anni ──────────────────────────────────────────────
   ammesse -7–63 (3.5–9.0 anni)  ·  mira 26–63
   94 classi · matematica 25 · italiano 28 · spazio 9 · tempo 8 · logica 16 · scienze 8
   76 nella mira, 34 già alla sua portata
   ┌ carta facile → mira 31 (6.5 anni)
   │ 🧵 31  Ieri ha finito tutta la tavoletta ___ è molto goloso di ciocco
   │ 🍕 39.2  Quale frazione è colorata?
   ┌ carta media → mira 44 (7.5 anni)
   │ 🕰️ 38  Che ora segna?
   │ 📝 44  Teo ha 20 uova. Poi ne raccoglie ancora 3. Quante uova ha ades
   ┌ carta tosta → mira 57 (8.6 anni)
   │ ✏️ 56  Come si scrive?
   │ 🔢 60  Senza fare il conto: dove sta il risultato di 54 + 31?

── 7.5 anni ──────────────────────────────────────────────
   ammesse -0–69 (4.0–9.5 anni)  ·  mira 32–69
   109 classi · matematica 31 · italiano 33 · spazio 10 · tempo 9 · logica 17 · scienze 9
   77 nella mira, 52 già alla sua portata
   ┌ carta facile → mira 37 (7.0 anni)
   │ 📐 29  Lungo quale riga si può piegare la figura, in modo che le due 
   │ 🗺️ 29  Cosa c'è due caselle a destra di 🐶?
   ┌ carta media → mira 50 (8.0 anni)
   │ 🗣️ 56  Qual è il passato di «spegnere»?
   │ 🕰️ 56  Quale orologio segna le 4:35?
   ┌ carta tosta → mira 63 (9.1 anni)
   │ 🍕 67.2  Luca ha mangiato 7/11 della torta. Quanta torta è rimasta?
   │ 📊 55.9  Quanti gelati ha venduto il gelataio mercoledì?

── 8 anni ──────────────────────────────────────────────
   ammesse 6–75 (4.5–10.0 anni)  ·  mira 38–75
   120 classi · matematica 34 · italiano 36 · spazio 12 · tempo 10 · logica 19 · scienze 9
   87 nella mira, 67 già alla sua portata
   ┌ carta facile → mira 44 (7.5 anni)
   │ 📅 29  In che stagione cade il 8 gennaio?
   │ 🦁 38  Chi vive qui?
   ┌ carta media → mira 57 (8.5 anni)
   │ 🗣️ 56  Ieri Marta ___ (entrare) in classe.
   │ 🐋 60  Perché lo squalo è un pesce?
   ┌ carta tosta → mira 69 (9.6 anni)
   │ 🍕 69.1  In un recinto ci sono 54 pecore, e 8/9 sono nere. Quante sono 
   │ ⚖️ 73.5  I due piatti pesano uguale. Quanto pesa un 🍍?

── 8.5 anni ──────────────────────────────────────────────
   ammesse 12–81 (5.0–10.5 anni)  ·  mira 44–81
   119 classi · matematica 36 · italiano 36 · spazio 12 · tempo 10 · logica 17 · scienze 8
   65 nella mira, 83 già alla sua portata
   ┌ carta facile → mira 50 (8.0 anni)
   │ 📝 56  Teo ha 28 caramelle e le divide in parti uguali fra 4 cugini. 
   │ 🔎 56  Sono giallo. Mi puoi mangiare. Chi sono?
   ┌ carta media → mira 63 (9.0 anni)
   │ 📝 75  Zoe ha 29 fiori. Ne perde 6, poi ne coglie ancora 4, poi ne re
   │ 🗣️ 63  In quegli anni noi ___ (dire).
   ┌ carta tosta → mira 76 (10.1 anni)
   │ 🗣️ 63  Qual è il futuro di «vedere» con «voi»?
   │ 📝 81  Gigi ha 21 sassi, e 7 sono viola. Ne regala 15. Quanti gliene 

── 9 anni ──────────────────────────────────────────────
   ammesse 19–88 (5.5–11.0 anni)  ·  mira 51–88
   119 classi · matematica 36 · italiano 36 · spazio 12 · tempo 10 · logica 17 · scienze 8
   57 nella mira, 87 già alla sua portata
   ┌ carta facile → mira 56 (8.5 anni)
   │ ✏️ 56  Come si scrive?
   │ ✏️ 50  Come si scrive?
   ┌ carta media → mira 69 (9.5 anni)
   │ 📝 56  Bruno ha 4 astucci di pastelli. In ogni astuccio ci sono 8 pas
   │ 📚 69.6  Quale titolo va bene per tutto il testo?
   ┌ carta tosta → mira 82 (10.6 anni)
   │ ⚖️ 64.8  I due piatti pesano uguale. Quanto pesa una 🧅?
   │ 🧩 63  Ogni volta che è il compleanno della nonna, Ada porta i fiori.

── 9.5 anni ──────────────────────────────────────────────
   ammesse 25–94 (6.0–11.5 anni)  ·  mira 57–94
   117 classi · matematica 36 · italiano 36 · spazio 12 · tempo 9 · logica 16 · scienze 8
   36 nella mira, 97 già alla sua portata
   ┌ carta facile → mira 62 (9.0 anni)
   │ 📚 69.6  Qual è il titolo migliore per questo testo?
   │ 🗺️ 56  Quanti quadretti formano questa figura?
   ┌ carta media → mira 75 (10.0 anni)
   │ 🔢 73.2  Uno di questi conti è sbagliato di sicuro. Quale?
   │ ⚖️ 73.5  Ogni 🍑 pesa 11. Che numero va sul peso col «?» perché la bila
   ┌ carta tosta → mira 88 (11.1 anni)
   │ 🧩 75  Tutti i bufigli sono grufoli. Tutti i grufoli hanno la coda a 
   │ 🍕 62  Quale frazione è più grande?

── 10 anni ──────────────────────────────────────────────
   ammesse 31–100 (6.5–12.0 anni)  ·  mira 63–100
   98 classi · matematica 34 · italiano 30 · spazio 9 · tempo 7 · logica 11 · scienze 7
   33 nella mira, 92 già alla sua portata
   ┌ carta facile → mira 69 (9.5 anni)
   │ 🗣️ 63  Domani voi ___ (servire).
   │ 📏 63  3 q quanti kg sono?
   ┌ carta media → mira 82 (10.5 anni)
   │ 📏 81  Hai una pentola con 1,5 l di brodo: ne versi 2 mestoli da 200 
   │ 📝 81  Nina ha 4 scaffali di libri, comprati 5 giorni fa. In ogni sca
   ┌ carta tosta → mira 94 (11.6 anni)
   │ 🧵 71.1  Potremo entrare in casa ___ trovi le chiavi.
   │ 📐 75  Quale di questi ritagli, piegato, diventa un cubo?

── 10.5 anni ──────────────────────────────────────────────
   ammesse 37–106 (7.0–12.5 anni)  ·  mira 69–106
   95 classi · matematica 34 · italiano 28 · spazio 8 · tempo 7 · logica 11 · scienze 7
   19 nella mira, 91 già alla sua portata
   ┌ carta facile → mira 75 (10.0 anni)
   │ 📏 81  Versi 3 tazze da 200 ml l'una in una pentola: quanti litri ver
   │ 📝 81  Nina ha 2 scatole di biscotti, comprate 5 giorni fa. In ogni s
   ┌ carta media → mira 88 (11.0 anni)
   │ 📏 81  In palestra usi 5 pesetti da 500 g l'uno: quanti kg pesano tut
   │ 🔢 73.2  62 + 56 fa circa quanto?
   ┌ carta tosta → mira 101 (12.1 anni)
   │ 📖 85  Cosa vuol dire «costare un occhio della testa»?
   │ 🗣️ 75  Che tempo è «lui scrive»?

── 11 anni ──────────────────────────────────────────────
   ammesse 44–113 (7.5–13.0 anni)  ·  mira 76–113
   78 classi · matematica 29 · italiano 24 · spazio 6 · tempo 5 · logica 8 · scienze 6
   6 nella mira, 77 già alla sua portata
   ┌ carta facile → mira 81 (10.5 anni)
   │ 🔎 75  Ce ne sono due. Non è grande. Chi sono io?
   │ 📐 75  Quale di questi ritagli, piegato, diventa un cubo?
   ┌ carta media → mira 94 (11.5 anni)
   │ ⚖️ 84.9  Guarda le due bilance. Quante 🍑 pesano come 3 🍉?
   │ 🗣️ 95  Qual è il passato remoto di «decidere» con «tu»?
   ┌ carta tosta → mira 107 (12.6 anni)
   │ 📝 75  Bruno ha 30 libri. Ne presta 15, poi ne compra ancora 2, poi n
   │ 📅 63  Quanti giorni passano dal 26 al 29 maggio?

══ I BUCHI ══
   (non sono guasti: sono le cose da riempire quando servono a qualcuno)

   · 4.5 anni: tutto in salita — solo 1 classi su 34 sono alla sua portata, il mazzo comincia sopra di lui
   · 4.5 anni: scienze solo 2
   · 5 anni: tutto in salita — solo 6 classi su 35 sono alla sua portata, il mazzo comincia sopra di lui
   · 5 anni: scienze solo 2
   · 5.5 anni: tutto in salita — solo 6 classi su 53 sono alla sua portata, il mazzo comincia sopra di lui
   · 11 anni: solo 6 classi nella mira (quelle che vede spesso)

   materie e dove arrivano:
   · matematica   97 classi, da 4.0 a 11.0 anni
   · italiano     84 classi, da 5.0 a 11.6 anni
   · spazio       21 classi, da 5.6 a 10.0 anni
   · tempo        21 classi, da 5.6 a 10.0 anni
   · logica       27 classi, da 5.0 a 10.0 anni
   · scienze      20 classi, da 5.0 a 9.2 anni
```

## Come si legge

- **Dove stanno le domande** conta le classi per anno: è la forma del
  mazzo, e dice dove siamo ricchi e dove poveri. Oggi il picco è a 6-8
  anni, che è dove ci sono i bambini che lo giocano.
- **Cosa vede un bambino** è la cosa vera: la finestra, quante classi ci
  cadono dentro divise per materia, e — soprattutto — **due domande
  vere** per ogni posizione della manopola. Il numero accanto all'icona
  è il livello della classe da cui sono uscite.
- **I buchi** non sono guasti: sono le cose da riempire il giorno che
  servono a qualcuno. Una materia con meno di tre classi a una certa età
  è segnata, perché con due classi il bambino vede sempre la stessa
  domanda.
