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

  4 anni   3 ██                   matematica 2 · logica 1
  5 anni   8 ████                 matematica 2 · italiano 1 · spazio 1 · tempo 1 · logica 2 · scienze 1
  6 anni  30 ███████████████      matematica 1 · italiano 11 · spazio 7 · tempo 4 · logica 6 · scienze 1
  7 anni  34 █████████████████    matematica 7 · italiano 11 · spazio 3 · tempo 6 · logica 4 · scienze 3
  8 anni  40 ████████████████████ matematica 8 · italiano 12 · spazio 5 · tempo 5 · logica 7 · scienze 3
  9 anni  19 ██████████           matematica 5 · italiano 8 · spazio 1 · tempo 1 · logica 4
 10 anni  25 █████████████        matematica 8 · italiano 6 · spazio 4 · tempo 4 · logica 3
 11 anni  11 ██████               italiano 11

   in tutto: 170 classi da 18 moduli

══ COSA VEDE UN BAMBINO ══

── 4.5 anni ──────────────────────────────────────────────
   ammesse -38–31 (1.0–6.5 anni)  ·  mira -6–25
   30 classi · matematica 3 · italiano 8 · spazio 5 · tempo 4 · logica 8 · scienze 2
   23 nella mira, 2 già alla sua portata
   ┌ carta facile → mira -1 (3.9 anni)
   │ 🦁 12  Dove vive?
   │ 📅 20  Che giorno viene 6 giorni dopo mercoledì?
   ┌ carta media → mira 10 (4.8 anni)
   │ 📐 25  Che angolo è questo?
   │ 🦁 25  Dove vive?
   ┌ carta tosta → mira 21 (5.6 anni)
   │ 📖 25  Qual è il contrario di «notte»?
   │ 🔎 25  Cresco nell'orto. Mi puoi mangiare. Chi sono?

── 5 anni ──────────────────────────────────────────────
   ammesse -32–38 (1.5–7.0 anni)  ·  mira 1–32
   31 classi · matematica 3 · italiano 8 · spazio 6 · tempo 4 · logica 8 · scienze 2
   28 nella mira, 7 già alla sua portata
   ┌ carta facile → mira 5 (4.4 anni)
   │ 📅 20  Che giorno viene prima di martedì?
   │ ✂️ 25  Quante sillabe ha questa parola?
   ┌ carta media → mira 16 (5.3 anni)
   │ 🔢 12  Che numero indica la freccia?
   │ 📅 20  Che giorno viene dopo lunedì?
   ┌ carta tosta → mira 27 (6.1 anni)
   │ 🦁 25  Dove vive?
   │ 🅰️ 29  Che cos'è?

── 5.5 anni ──────────────────────────────────────────────
   ammesse -25–44 (2.0–7.5 anni)  ·  mira 7–38
   45 classi · matematica 6 · italiano 13 · spazio 7 · tempo 5 · logica 11 · scienze 3
   29 nella mira, 7 già alla sua portata
   ┌ carta facile → mira 11 (4.9 anni)
   │ ➡️ 12  Tre figure hanno una cosa in comune. Qual è quella che non c'e
   │ 🅰️ 12  Con che lettera comincia?
   ┌ carta media → mira 22 (5.8 anni)
   │ 📐 25  Quanti lati ha questa figura?
   │ 📅 20  Che giorno viene 6 giorni prima di domenica?
   ┌ carta tosta → mira 33 (6.6 anni)
   │ 🔗 25  Cosa manca? (da dove arriva)
   │ 📏 38  Con che cosa misuri quanto è alta una porta di casa?

── 6 anni ──────────────────────────────────────────────
   ammesse -19–50 (2.5–8.0 anni)  ·  mira 13–44
   54 classi · matematica 7 · italiano 18 · spazio 7 · tempo 6 · logica 12 · scienze 4
   44 nella mira, 21 già alla sua portata
   ┌ carta facile → mira 18 (5.4 anni)
   │ 🔎 12  È azzurro. È una stella. Chi sono io?
   │ 🗺️ 33  🚗 parte da B2 e fa ↓→↓ : dove arriva?
   ┌ carta media → mira 29 (6.3 anni)
   │ ➡️ 38  Tre figure hanno una cosa in comune. Qual è quella che non c'e
   │ ✂️ 25  Quante sillabe ha questa parola?
   ┌ carta tosta → mira 39 (7.1 anni)
   │ 🕰️ 38  Che ora segna?
   │ 🔤 25  Qual è il plurale di «gomma»?

── 6.5 anni ──────────────────────────────────────────────
   ammesse -13–56 (3.0–8.5 anni)  ·  mira 19–50
   70 classi · matematica 11 · italiano 22 · spazio 9 · tempo 8 · logica 16 · scienze 4
   47 nella mira, 29 già alla sua portata
   ┌ carta facile → mira 24 (5.9 anni)
   │ 📐 27.9  Come si chiama questa figura?
   │ 📏 38  Con che cosa misuri quanto pesa un bambino di otto anni?
   ┌ carta media → mira 35 (6.8 anni)
   │ 🦁 50  Tre di questi vivono nel mare. Chi no?
   │ 🔢 41.6  Dove va il 55?
   ┌ carta tosta → mira 46 (7.6 anni)
   │ ➡️ 25  Cosa viene dopo?
   │ 🅰️ 29  Che cos'è?

── 7 anni ──────────────────────────────────────────────
   ammesse -7–63 (3.5–9.0 anni)  ·  mira 26–57
   70 classi · matematica 11 · italiano 22 · spazio 9 · tempo 8 · logica 16 · scienze 4
   50 nella mira, 30 già alla sua portata
   ┌ carta facile → mira 30 (6.4 anni)
   │ 📐 27.9  Quale di queste figure è un triangolo?
   │ 🅰️ 29  Che cos'è?
   ┌ carta media → mira 41 (7.3 anni)
   │ 🔢 56  55 + 33 fa circa quanto?
   │ 🔎 56  Volo. Sono grande. Chi sono?
   ┌ carta tosta → mira 52 (8.1 anni)
   │ 📝 38  Teo ha 4 figurine. Poi ne vince ancora 4. Quante figurine ha a
   │ 🔗 38  Cosa manca? (chi mangia cosa)

── 7.5 anni ──────────────────────────────────────────────
   ammesse -0–69 (4.0–9.5 anni)  ·  mira 32–63
   78 classi · matematica 13 · italiano 25 · spazio 10 · tempo 9 · logica 17 · scienze 4
   41 nella mira, 44 già alla sua portata
   ┌ carta facile → mira 36 (6.9 anni)
   │ 🗺️ 25  In che casella è 🐟?
   │ 🔢 25  Che numero sta esattamente in mezzo fra 48 e 58?
   ┌ carta media → mira 47 (7.8 anni)
   │ 📐 56  Cosa si vede guardando questo solido di fianco?
   │ 📏 56  Quanto pesa, circa, un'automobile?
   ┌ carta tosta → mira 58 (8.6 anni)
   │ 🗺️ 63  Quanto è lungo il bordo arancione?
   │ 🕰️ 56  Quale orologio segna le 7:45?

── 8 anni ──────────────────────────────────────────────
   ammesse 6–75 (4.5–10.0 anni)  ·  mira 38–69
   86 classi · matematica 14 · italiano 28 · spazio 12 · tempo 10 · logica 18 · scienze 4
   47 nella mira, 50 già alla sua portata
   ┌ carta facile → mira 43 (7.4 anni)
   │ 📅 29  In che stagione cade il 8 gennaio?
   │ 🦁 25  Dove vive?
   ┌ carta media → mira 54 (8.3 anni)
   │ 📐 56  Come si chiama questo solido?
   │ ➡️ 56  Cosa viene dopo?
   ┌ carta tosta → mira 64 (9.1 anni)
   │ 🗺️ 56  Quanti quadretti formano questa figura?
   │ 🧩 63  Ogni volta che il forno è acceso, Sara mette il grembiule. Ogg

── 8.5 anni ──────────────────────────────────────────────
   ammesse 12–81 (5.0–10.5 anni)  ·  mira 44–75
   84 classi · matematica 15 · italiano 27 · spazio 13 · tempo 10 · logica 16 · scienze 3
   39 nella mira, 61 già alla sua portata
   ┌ carta facile → mira 49 (7.9 anni)
   │ 📝 38  Zoe ha 6 caramelle. Poi ne compra ancora 3. Quante caramelle h
   │ 🔤 56  Che parte del discorso è «corre»?
   ┌ carta media → mira 60 (8.8 anni)
   │ 📝 75  Zoe ha 29 fiori. Ne perde 6, poi ne coglie ancora 4, poi ne re
   │ 🔤 56  Che parte del discorso è «mare»?
   ┌ carta tosta → mira 71 (9.6 anni)
   │ 📐 75  Quale di questi ritagli, piegato, diventa un cubo?
   │ 🗺️ 56  Quanti quadretti formano questa figura?

── 9 anni ──────────────────────────────────────────────
   ammesse 19–88 (5.5–11.0 anni)  ·  mira 51–82
   84 classi · matematica 15 · italiano 27 · spazio 13 · tempo 10 · logica 16 · scienze 3
   39 nella mira, 62 già alla sua portata
   ┌ carta facile → mira 55 (8.4 anni)
   │ ✏️ 56  Come si scrive?
   │ ✏️ 50  Come si scrive?
   ┌ carta media → mira 66 (9.3 anni)
   │ 📝 56  Nina ha 4 astucci di pastelli. In ogni astuccio ci sono 8 past
   │ 🗺️ 56  Quanti quadretti formano questa figura?
   ┌ carta tosta → mira 77 (10.1 anni)
   │ 🔗 56  Cosa manca?
   │ 📅 63  Quanti giorni passano dal 14 al 24 settembre?

── 9.5 anni ──────────────────────────────────────────────
   ammesse 25–94 (6.0–11.5 anni)  ·  mira 57–88
   83 classi · matematica 15 · italiano 27 · spazio 13 · tempo 9 · logica 16 · scienze 3
   23 nella mira, 69 già alla sua portata
   ┌ carta facile → mira 61 (8.9 anni)
   │ 🗣️ 63  Qual è il futuro di «chiamare» con «lui»?
   │ ➡️ 38  Tre figure hanno una cosa in comune. Qual è quella che non c'e
   ┌ carta media → mira 72 (9.8 anni)
   │ ✏️ 50  Come si scrive?
   │ 🗺️ 63  Quanto è lungo il bordo arancione?
   ┌ carta tosta → mira 83 (10.6 anni)
   │ 📏 75  Chi è più lungo: 3 cm o 9 mm?
   │ 📝 75  Milo ha 37 fiori. Ne perde 6, poi ne coglie ancora 8, poi ne r

── 10 anni ──────────────────────────────────────────────
   ammesse 31–100 (6.5–12.0 anni)  ·  mira 63–94
   65 classi · matematica 14 · italiano 21 · spazio 10 · tempo 7 · logica 11 · scienze 2
   22 nella mira, 60 già alla sua portata
   ┌ carta facile → mira 68 (9.4 anni)
   │ 🔤 56  Che parte del discorso è «canta»?
   │ 🗣️ 75  Tanti anni fa io ___ (lavare).
   ┌ carta media → mira 79 (10.3 anni)
   │ 📏 81  2 pacchi da 200 g: quanti kg pesano in tutto?
   │ ✂️ 38  Qual è la sillabazione giusta di «bagno»?
   ┌ carta tosta → mira 89 (11.1 anni)
   │ 🗺️ 81  Quale figura ha il bordo lungo uguale a questa, ma un numero d
   │ 📏 81  Hai una bottiglia da 2,5 l e versi 3 bicchieri da 250 ml l'uno

── 10.5 anni ──────────────────────────────────────────────
   ammesse 37–106 (7.0–12.5 anni)  ·  mira 69–100
   64 classi · matematica 14 · italiano 21 · spazio 9 · tempo 7 · logica 11 · scienze 2
   15 nella mira, 62 già alla sua portata
   ┌ carta facile → mira 74 (9.9 anni)
   │ 🔢 70.3  79 + 48 fa circa quanto?
   │ 🗺️ 75  Quale figura ha il bordo lungo uguale a questa, ma un numero d
   ┌ carta media → mira 85 (10.8 anni)
   │ 🔢 70.3  Uno di questi conti è sbagliato di sicuro. Quale?
   │ 🕰️ 75  Che ora sarà fra 40 minuti?
   ┌ carta tosta → mira 96 (11.6 anni)
   │ 📏 75  Metti in ordine dal più piccolo al più grande: 4,5 mm, 9 km, 5
   │ 🗣️ 75  Qual è il presente di «preferire» con «io»?

── 11 anni ──────────────────────────────────────────────
   ammesse 44–113 (7.5–13.0 anni)  ·  mira 76–107
   52 classi · matematica 12 · italiano 19 · spazio 7 · tempo 5 · logica 8 · scienze 1
   5 nella mira, 51 già alla sua portata
   ┌ carta facile → mira 80 (10.4 anni)
   │ 📖 85  Cosa vuol dire «prendere due piccioni con una fava»?
   │ 🔤 63  I bambini sono ___.
   ┌ carta media → mira 91 (11.3 anni)
   │ 🗣️ 95  Qual è il passato di «leggere»?
   │ 🔎 75  È grande. È un quadrato. Non è viola. Chi sono io?
   ┌ carta tosta → mira 102 (12.1 anni)
   │ 📝 81  Sul tavolo ci sono 9 libri e 13 riviste. Vera prende 7 libri. 
   │ 📖 63  Il canguro ___ sul letto.

══ I BUCHI ══
   (non sono guasti: sono le cose da riempire quando servono a qualcuno)

   · 4.5 anni: tutto in salita — solo 2 classi su 30 sono alla sua portata, il mazzo comincia sopra di lui
   · 4.5 anni: scienze solo 2
   · 5 anni: scienze solo 2
   · 5.5 anni: tutto in salita — solo 7 classi su 45 sono alla sua portata, il mazzo comincia sopra di lui
   · 10 anni: scienze solo 2
   · 10.5 anni: scienze solo 2
   · 11 anni: solo 5 classi nella mira (quelle che vede spesso)
   · 11 anni: scienze solo 1

   materie e dove arrivano:
   · matematica   33 classi, da 4.0 a 10.5 anni
   · italiano     60 classi, da 5.0 a 11.6 anni
   · spazio       21 classi, da 5.6 a 10.5 anni
   · tempo        21 classi, da 5.6 a 10.0 anni
   · logica       27 classi, da 4.0 a 10.0 anni
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
