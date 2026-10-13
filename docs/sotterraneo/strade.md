# Le strade: tre modi di giocare ogni classe

13 ottobre 2026. L'utente: «dare un senso un po' a tutte le caratteristiche dell'eroe». Ogni caratteristica serve a qualcosa
([livelli.md](livelli.md#le-quattro-caratteristiche)), le armi a due mani valgono la mano che tolgono ([roba.md](roba.md#due-mani))
e ogni classe ha **tre strade**, approvate dall'utente, ognuna giocabile e nessuna inutile. Una strada è un modo di costruire
la stessa classe: l'arma e lo scudo, dove vanno i punti, quali rami dell'albero. Non è una scelta nel gioco: è un dato
(`dati/strade.js`) che il banco gioca (`motore/strade.js`) per misurare che nessuna domini e nessuna crolli.

## Le dodici strade

| classe | strada | arma e mano debole | punti (su otto) | albero |
|---|---|---|---|---|
| 🧙 Mago | **guerriero** | spada + scudo | forza 2 · intelligenza 2 · destrezza 2 · tempra 2 | Lama arcana (poche magie toste), scudo e fonte arcani |
| | **bacchetta** | bacchetta + scudo | intelligenza 3 · forza 2 · destrezza 2 · tempra 1 | Fuoco, e lo scudo e la fonte arcani |
| | **pura magia** | bastone a due mani | intelligenza 3 · destrezza 2 · tempra 3 | Arcano (gli scudi magici), il dardo e la sfera di fuoco |
| 🛡️ Cavaliere | **baluardo** | spada + scudo | forza 4 · tempra 3 · destrezza 1 | Scudo, poi la Lama |
| | **spadone** | spadone o ascia a due mani | forza 5 · tempra 2 · destrezza 1 | Lama e Furia |
| | **paladino** | spada + scudo | forza 3 · tempra 3 · destrezza 1 · intelligenza 1 | Giuramento (preghiera, luce sacra) |
| 🧝 Elfa | **arciera** | arco | destrezza 4 · tempra 2 · forza 2 | Arco e Bosco |
| | **lama leggera** | spada + scudo | destrezza 4 · forza 2 · tempra 2 | Lame (la schivata, tanti colpi) |
| | **Luna** | spada + scudo | destrezza 4 · intelligenza 1 · tempra 2 · forza 1 | Luna, e le cure del Bosco |
| 🧔 Nano | **difensore** | ascia + scudo | forza 4 · tempra 3 · destrezza 1 | Pietra, poi l'Ascia |
| | **ascia doppia** | ascia a due mani | forza 5 · tempra 2 · destrezza 1 | Ascia e Fucina (il berserker) |
| | **runico** | ascia + scudo | forza 3 · destrezza 2 · tempra 2 · intelligenza 1 | Fucina, le rune |

I punti sono un giro come `COME_LI_DA`: il banco li dà in quell'ordine e la regola del bilanciamento ([livelli.md](livelli.md#la-regola-del-bilanciamento))
decide quando serve un altro. La roba è la riga della classe nella storia (`PASSI` in `dati/storia.js`) con l'arma della strada
al posto della sua, all'ultimo gradino che si trova (`filaDellaStrada`), lo scudo che la strada vuole e niente scudo con due mani;
i pezzi dei grossi ci sono, ma non le loro armi (cambierebbero la strada).

## Come si gioca una strada

```bash
npm run sotterraneo -- --strada mago                       # le tre strade di una classe, discesa per discesa
npm run sotterraneo -- --strada tutte --livelli 3,5,8 --sintesi   # una riga per strada: vittorie a 8·6·4/10, domande, svenimenti, vita
npm run sotterraneo -- --strada cavaliere:spadone --scheda         # com'è fatto l'eroe di quella strada entrando in ogni discesa
npm run sotterraneo -- --strada mago:pura --punti intelligenza,destrezza   # lo stesso con un altro giro dei punti
npm run sotterraneo -- --strada cavaliere:spadone --mani 1         # la stessa strada con arma a una mano e scudo (--mani 2: a due)
```

Il banco di una strada vincola quello che si indossa (`Corredo.vincoloDelBanco`): il gioco propone un pezzo migliore e la
strada lo rifiuta se è di un'altra (una bacchetta al mago guerriero). Gioca come sempre: due abilità forti a scontro, la cura sotto
la metà della vita. **Si misura a livello atteso più 3, 5 e 8**: coi mostri di adesso (i branchi raddoppiati, non ancora tarati)
a livello atteso quasi ogni discesa è un muro e le strade non si distinguono.

## Come stanno (40 partite per cella, media delle sette discese)

Vittorie a 8/10 · 6/10 · 4/10, domande per discesa a 8/10, svenimenti.

| strada | livello +3 | livello +5 | livello +8 |
|---|---|---|---|
| cavaliere: baluardo | 47 · 27 · 11, 32 dom. | 79 · 62 · 34, 34 | 94 · 80 · 69, 34 |
| cavaliere: spadone | 45 · 25 · 13, 22 | 71 · 53 · 25, 25 | 93 · 77 · 45, 26 |
| cavaliere: paladino | 41 · 20 · 13, 42 | 78 · 53 · 24, 46 | 95 · 79 · 52, 42 |
| elfa: arciera | 92 · 63 · 31, 44 | 98 · 80 · 52, 41 | 100 · 96 · 73, 38 |
| elfa: lama leggera | 82 · 56 · 23, 48 | 98 · 81 · 51, 47 | 100 · 98 · 81, 41 |
| elfa: Luna | 73 · 41 · 19, 50 | 95 · 70 · 34, 48 | 100 · 93 · 69, 43 |
| mago: guerriero | 21 · 14 · 4, 26 | 38 · 23 · 8, 34 | 75 · 43 · 20, 43 |
| mago: bacchetta | 23 · 14 · 4, 25 | 39 · 26 · 9, 30 | 71 · 48 · 20, 38 |
| mago: pura magia | 28 · 16 · 5, 28 | 48 · 30 · 15, 32 | 79 · 53 · 24, 32 |
| nano: difensore | 74 · 39 · 15, 41 | 90 · 74 · 42, 37 | 100 · 92 · 71, 34 |
| nano: ascia doppia | 61 · 42 · 20, 22 | 81 · 62 · 39, 24 | 98 · 81 · 58, 24 |
| nano: runico | 64 · 33 · 17, 43 | 88 · 73 · 40, 40 | 100 · 90 · 71, 35 |

Il bersaglio è dentro la classe, non fra le classi: a 6/10 le tre strade di una classe stanno entro venti punti e la peggiore vale
almeno il 60% della migliore (`misure/sotterraneo-strade`). Fra le classi il mago sta molto sotto: è la taratura dei mostri, che è dopo.
Le domande per discesa dicono la forma: le strade a due mani chiudono lo scontro in meno turni (22–26 domande), le strade con lo scudo
ne fanno di più e restano in piedi (vita a fine scontro 55–75%).

## Cosa insegnano le misure

- **La destrezza e la forza valgono quanto l'altra, la tempra meno, l'intelligenza poco** (un punto per caratteristica a una strada
  intera, +5 livelli, 8/10): cavaliere destrezza 82, forza 79, tempra 57, intelligenza 43; mago (bacchetta) destrezza 69, intelligenza 34,
  tempra 32, forza 25. La velocità nella fila dei turni (6 più uno e mezzo a punto) è una leva forte, e per il mago, che a metà
  strada ha poco altro, la più forte. Ogni strada ha quindi una parte di punti in destrezza; senza (il mago guerriero e quello con la
  bacchetta, all'inizio) restavano a 25 contro i 45 della pura magia, che ne ha due su otto. **Resta da decidere se la destrezza non vale troppo**
  (`VELOCITA_PER_DESTREZZA` in `motore/turni.js`, non toccata: l'iniziativa è del 13 ottobre).
- **L'intelligenza di una classe che non lancia tanto non rende**: «un po' di intelligenza» (paladino, Luna, runico) vuol dire un
  punto su otto. Con due su otto il paladino perdeva venti punti (66 contro 81). Il globo di energia sale di tre a punto, e per il cavaliere
  il banco ne usa due forti a scontro in ogni caso.
- **La seconda arma non vale uno scudo.** La Lama leggera, con la spada e una seconda spada nella mancina (la metà del braccio), a +3
  stava a 63 contro i 92 dell'arciera: una mano debole che vale mezza arma vale meno di uno scudo del gradino. La strada tiene lo scudo,
  e la mancina con la seconda arma resta una regola del gioco ma non è una strada.
- **Le armi a una mano dei gradini alti non c'erano.** Il baluardo restava a un gradino sotto (`spada` al posto dello spadone), il
  difensore del nano a un'accetta (l'ascia e l'ascia doppia sono a due mani). Si sono aggiunte tre armi a una mano (`dati/cose.js`):
  la **sciabola** (spada, terzo gradino), la **scure** (ascia, secondo) e la **mannaia** (ascia, terzo), alle stesse regole di prezzo e forza
  delle altre; le figure sono prese in prestito da quelle dell'ascia e della spada (`ascia-05`, `ascia-06`, `spada-13`), una per pezzo.
  Manca ancora una bacchetta a una mano di secondo gradino (la strada «bacchetta» usa la verga fino alla grotta) e un bastone di terzo.
- **Due mani contro mano e scudo**: stessi punti e stesso albero, un'arma a due mani contro una a una mano e lo scudo (`--mani`), a +5
  livelli, vittorie a 8/10 · 6/10:

| | a una mano e scudo | a due mani, difesa vale 1 | 2 (scelto) | 3 |
|---|---|---|---|---|
| cavaliere, spadone | 73 · 59 | 68 · 50 | 71 · 53 | 76 · 57 |
| nano, ascia doppia | 89 · 73 | 77 · 60 | 81 · 62 | 87 · 68 |
| mago, pura magia | 51 · 34 | 44 · 29 | 48 · 30 | 48 · 33 |

  L'attacco di un'arma a due mani è quello a una mano più la difesa dello scudo del gradino e del livello, contata come attacco
  (`PESO_DELLA_DIFESA`): a uno sta sotto di cinque, sette o dodici punti, a tre pareggia. Si tiene due, il cambio con cui il gioco sceglieva
  già i pezzi (`PESI` in `motore/corredo.js`: una difesa vale due di attacco), che sta da due a otto punti sotto la parità
  ([roba.md](roba.md#due-mani)) e non sposta la taratura più del necessario.

## Difesa e vita

Dell'eroe atteso a ogni livello (con la roba della storia e la crescita del banco, `--numeri 1,3,5,8,12,16,20,30`), prima → dopo il 13 ottobre:

| | 5 | 12 | 20 | 30 |
|---|---|---|---|---|
| cavaliere, vita | 57 → 61 | 93 → 103 | 142 → 162 | 201 → 233 |
| cavaliere, difesa | 6 → 6 | 9 → 9 | 15 → 14 | 19 → 16 |
| elfa, vita | 50 → 52 | 84 → 88 | 128 → 136 | 182 → 196 |
| elfa, difesa | 6 → 6 | 7 → 9 | 13 → 15 | 17 → 20 |
| mago, vita | 49 → 50 | 88 → 89 | 136 → 144 | 189 → 209 |
| mago, difesa | 6 → 5 | 8 → 6 | 15 → 11 | 20 → 15 |
| nano, vita | 51 → 44 | 94 → 90 | 138 → 134 | 192 → 190 |
| nano, difesa | 7 → 5 | 8 → 8 | 14 → 12 | 18 → 16 |

Il nano a livello 5 portava la Mazza di Grumo e lo scudo di Fiammetta (pezzi dei grossi) al posto dell'ascia, che picchiava meno; adesso
l'ascia a due mani vale di più e resta, e con lei se ne vanno la vita e la difesa di quei due (attacco 7 → 12). La difesa del mago cala perché il
banco non gli dà più tempra per la difesa, e la forza non la alza. Chi vuole la difesa la prende dove sta: nella forza (una ogni quattro
punti), nello scudo, nell'armatura.

## Nei test

`unita/sotterraneo-strade`: le dodici strade stanno in piedi (arma che la classe porta, nodi della classe e dell'arma della strada,
la roba di ogni discesa si indossa coi punti che la strada dà), il vincolo del banco, ogni strada si gioca una discesa senza guasti, la
regola delle due mani a ogni gradino e a livello alto, il bastone (dieci risposte giuste: quattro punti di energia con la bacchetta, sei
col bastone). `misure/sotterraneo-strade` (un minuto): le tre strade di ogni classe stanno vicine a +5 livelli.
