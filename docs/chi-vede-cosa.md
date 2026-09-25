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
  7 anni  52 ██████████████████████████ matematica 19 · italiano 17 · spazio 3 · tempo 6 · logica 4 · scienze 3
  8 anni  75 ██████████████████████████████████████ matematica 32 · italiano 22 · spazio 5 · tempo 5 · logica 8 · scienze 3
  9 anni  44 ██████████████████████ matematica 23 · italiano 12 · spazio 3 · tempo 1 · logica 5
 10 anni  35 ██████████████████   matematica 17 · italiano 8 · spazio 2 · tempo 4 · logica 4
 11 anni  15 ████████             matematica 3 · italiano 11 · logica 1

   in tutto: 268 classi da 24 moduli

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
   73 classi · matematica 17 · italiano 26 · spazio 7 · tempo 6 · logica 13 · scienze 4
   67 nella mira, 19 già alla sua portata
   ┌ carta facile → mira 19 (5.5 anni)
   │ 🗺️ 29  Cosa c'è una casella a sinistra di ⭐?
   │ 🍕 39.2  Che parte della barretta è colorata?
   ┌ carta media → mira 32 (6.5 anni)
   │ ✂️ 25  Quante sillabe ha questa parola?
   │ ✂️ 50  Qual è la sillaba che manca?
   ┌ carta tosta → mira 44 (7.6 anni)
   │ ✏️ 38  Con che cosa si completa?
   │ 🔗 44  Cosa manca?

── 6.5 anni ──────────────────────────────────────────────
   ammesse -13–56 (3.0–8.5 anni)  ·  mira 19–56
   89 classi · matematica 22 · italiano 30 · spazio 9 · tempo 8 · logica 16 · scienze 4
   83 nella mira, 32 già alla sua portata
   ┌ carta facile → mira 25 (6.0 anni)
   │ 🧵 31  Stamattina ha voluto tre maglioni uno sopra l'altro ___ è molt
   │ 🕰️ 25  Che ora segna?
   ┌ carta media → mira 38 (7.0 anni)
   │ 📅 29.4  Quale mese viene dopo giugno?
   │ 💶 38  Hai in mano questi soldi: quanto fanno in tutto?
   ┌ carta tosta → mira 51 (8.1 anni)
   │ ➡️ 56  Cosa viene dopo?
   │ ✏️ 50  Come si scrive?

── 7 anni ──────────────────────────────────────────────
   ammesse -7–63 (3.5–9.0 anni)  ·  mira 26–63
   92 classi · matematica 25 · italiano 30 · spazio 9 · tempo 8 · logica 16 · scienze 4
   74 nella mira, 34 già alla sua portata
   ┌ carta facile → mira 31 (6.5 anni)
   │ 🧵 31  Ieri ha nascosto la macchinina preferita sotto il letto ___ è 
   │ 📐 27.9  Quale di queste figure è un pentagono?
   ┌ carta media → mira 44 (7.5 anni)
   │ 🕰️ 38  Che ora segna?
   │ 📝 44  Teo ha 20 uova. Poi ne raccoglie ancora 3. Quante uova ha ades
   ┌ carta tosta → mira 57 (8.6 anni)
   │ ✏️ 56  Come si scrive?
   │ 🔢 60  Senza fare il conto: dove sta il risultato di 54 + 31?

── 7.5 anni ──────────────────────────────────────────────
   ammesse -0–69 (4.0–9.5 anni)  ·  mira 32–69
   104 classi · matematica 31 · italiano 33 · spazio 10 · tempo 9 · logica 17 · scienze 4
   72 nella mira, 52 già alla sua portata
   ┌ carta facile → mira 37 (7.0 anni)
   │ 📐 38  Quale è la stessa figura solo girata, e non allo specchio?
   │ 📏 38  Con che cosa misuri quanto pesa un gatto?
   ┌ carta media → mira 50 (8.0 anni)
   │ 🧵 38  Leggendo questa frase, cosa ci aspettavamo che succedesse?
   │ 📚 56.5  Di chi parla «Lei»?
   ┌ carta tosta → mira 63 (9.1 anni)
   │ 📊 63  Quanti cesti di limoni 🍋 in più ha raccolto il nonno rispetto
   │ 🗺️ 63  Quanto è lungo il bordo arancione?

── 8 anni ──────────────────────────────────────────────
   ammesse 6–75 (4.5–10.0 anni)  ·  mira 38–75
   115 classi · matematica 34 · italiano 36 · spazio 12 · tempo 10 · logica 19 · scienze 4
   82 nella mira, 65 già alla sua portata
   ┌ carta facile → mira 44 (7.5 anni)
   │ 📅 29.4  Quale mese viene dopo gennaio?
   │ 🦁 50  Tre di questi vivono nella savana. Chi no?
   ┌ carta media → mira 57 (8.5 anni)
   │ 🧵 69  Quale frase ha senso?
   │ 🗣️ 56  Qual è il passato di «piangere»?
   ┌ carta tosta → mira 69 (9.6 anni)
   │ 📐 75  Quanti cubetti mancano per riempire la scatola?
   │ 🍕 55.2  Quale frazione è colorata?

── 8.5 anni ──────────────────────────────────────────────
   ammesse 12–81 (5.0–10.5 anni)  ·  mira 44–81
   116 classi · matematica 38 · italiano 36 · spazio 12 · tempo 10 · logica 17 · scienze 3
   63 nella mira, 79 già alla sua portata
   ┌ carta facile → mira 50 (8.0 anni)
   │ 📝 63  In ogni sacchetto ci sono 5 caramelle. Teo compra 4 sacchetti,
   │ 📖 63  Il nonno ___ seduto sulla riva.
   ┌ carta media → mira 63 (9.0 anni)
   │ ➡️ 56  Cosa viene dopo?
   │ 📝 63  Gigi ha 18 mele. Ne regala 7, poi ne raccoglie ancora 2. Quant
   ┌ carta tosta → mira 76 (10.1 anni)
   │ 🧵 71.1  Ci iscriveremo anche noi ___ restano ancora posti liberi.
   │ 📐 75  Quale di questi ritagli, piegato, diventa un cubo?

── 9 anni ──────────────────────────────────────────────
   ammesse 19–88 (5.5–11.0 anni)  ·  mira 51–88
   117 classi · matematica 39 · italiano 36 · spazio 12 · tempo 10 · logica 17 · scienze 3
   57 nella mira, 84 già alla sua portata
   ┌ carta facile → mira 56 (8.5 anni)
   │ ✏️ 56  Come si scrive?
   │ 📏 56  Quanto contiene, circa, una brocca d'acqua?
   ┌ carta media → mira 69 (9.5 anni)
   │ 📝 75  Zoe ha 23 pastelli. Ne regala 10, poi ne compra ancora 2, poi 
   │ 🍕 69.1  Carla ha mangiato 1/12 della crostata. Quanta crostata è rimas
   ┌ carta tosta → mira 82 (10.6 anni)
   │ ⚖️ 64.8  I due piatti pesano uguale. Quanto pesa una 🧅?
   │ 📏 81  Per un esperimento di scienze usi 6 provette da 30 ml l'una: q

── 9.5 anni ──────────────────────────────────────────────
   ammesse 25–94 (6.0–11.5 anni)  ·  mira 57–94
   116 classi · matematica 40 · italiano 36 · spazio 12 · tempo 9 · logica 16 · scienze 3
   37 nella mira, 93 già alla sua portata
   ┌ carta facile → mira 62 (9.0 anni)
   │ 📚 63.2  Qual è il titolo migliore per questo testo?
   │ 🗺️ 63  Quanto è lungo il bordo arancione?
   ┌ carta media → mira 75 (10.0 anni)
   │ 📝 75  In ogni cestino ci sono 6 uova. Lea compra 2 cestini, poi ne t
   │ 📊 72.9  I gusti di gelato scelti dai bambini. Qual è la moda, cioè il 
   ┌ carta tosta → mira 88 (11.1 anni)
   │ 📝 81  Bruno ha 6 anni e 24 figurine. Ne regala 8. Quante gliene rest
   │ 💶 85  Le uova: 6 uova a 1,92 € oppure 10 uova a 2,80 €. Cosa convien

── 10 anni ──────────────────────────────────────────────
   ammesse 31–100 (6.5–12.0 anni)  ·  mira 63–100
   98 classi · matematica 39 · italiano 30 · spazio 9 · tempo 7 · logica 11 · scienze 2
   36 nella mira, 86 già alla sua portata
   ┌ carta facile → mira 69 (9.5 anni)
   │ 🧵 82.5  Leggi bene: cosa comunica «mentre» qui?
   │ 🍕 55.2  Carla taglia una pizza in 5 fette uguali e ne mangia una. Brun
   ┌ carta media → mira 82 (10.5 anni)
   │ 📝 75  In ogni astuccio ci sono 2 pastelli. Vera compra 2 astucci, po
   │ ⚖️ 84.9  Le due bilance sono in pari. Quanto pesa una 🐔?
   ┌ carta tosta → mira 94 (11.6 anni)
   │ 🔎 79.3  Giulia, Gabriele e Lucia sono in fila, ma non in quest'ordine.
   │ 🗣️ 95  Qual è il futuro di «gestire» con «noi»?

── 10.5 anni ──────────────────────────────────────────────
   ammesse 37–106 (7.0–12.5 anni)  ·  mira 69–106
   95 classi · matematica 39 · italiano 28 · spazio 8 · tempo 7 · logica 11 · scienze 2
   23 nella mira, 88 già alla sua portata
   ┌ carta facile → mira 75 (10.0 anni)
   │ 🕰️ 75  Che ora segna?
   │ 📅 63  Quanti giorni passano dal 5 al 29 aprile?
   ┌ carta media → mira 88 (11.0 anni)
   │ 💶 81  3 kg di mele costano 6,33 €. Quanto costano 9 kg di mele?
   │ 📐 75  Quale di questi ritagli, piegato, diventa un cubo?
   ┌ carta tosta → mira 101 (12.1 anni)
   │ 📝 81  Lea ha 11 anni e 17 conchiglie. Ne perde 7. Quante gliene rest
   │ 💶 81  6 uova costano 2,34 €. Quanto costano 12 uova?

── 11 anni ──────────────────────────────────────────────
   ammesse 44–113 (7.5–13.0 anni)  ·  mira 76–113
   78 classi · matematica 34 · italiano 24 · spazio 6 · tempo 5 · logica 8 · scienze 1
   12 nella mira, 75 già alla sua portata
   ┌ carta facile → mira 81 (10.5 anni)
   │ 🧩 75  Tutti i murgoli sono sbrisi. Tutti gli sbrisi hanno le orecchi
   │ 📏 81  Riempi 3 borracce da 200 ml l'una per la gita: quanti litri po
   ┌ carta media → mira 94 (11.5 anni)
   │ 🗣️ 75  Fra poco tu ___ (lavorare).
   │ 📝 81  Lea ha 5 anni e 11 fiori. Ne perde 8. Quanti gliene restano?
   ┌ carta tosta → mira 107 (12.6 anni)
   │ 💶 94  Compri 4 caramelle da 0,70 € l'una. C'è l'offerta «Prendi 4, p
   │ 📏 81  Hai una scatola di pesetti da 3 kg: per allenarti ne usi 4 da 

══ I BUCHI ══
   (non sono guasti: sono le cose da riempire quando servono a qualcuno)

   · 4.5 anni: tutto in salita — solo 1 classi su 34 sono alla sua portata, il mazzo comincia sopra di lui
   · 4.5 anni: scienze solo 2
   · 5 anni: tutto in salita — solo 6 classi su 35 sono alla sua portata, il mazzo comincia sopra di lui
   · 5 anni: scienze solo 2
   · 5.5 anni: tutto in salita — solo 6 classi su 53 sono alla sua portata, il mazzo comincia sopra di lui
   · 10 anni: scienze solo 2
   · 10.5 anni: scienze solo 2
   · 11 anni: scienze solo 1

   materie e dove arrivano:
   · matematica  102 classi, da 4.0 a 11.5 anni
   · italiano     85 classi, da 5.0 a 11.6 anni
   · spazio       21 classi, da 5.6 a 10.0 anni
   · tempo        21 classi, da 5.6 a 10.0 anni
   · logica       31 classi, da 5.0 a 11.0 anni
   · scienze       8 classi, da 5.0 a 8.0 anni
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
