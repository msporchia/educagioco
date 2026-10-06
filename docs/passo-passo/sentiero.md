# Passo passo — il sentiero senza fine

La modalità che non finisce: posti fatti al momento da
`src/giochi/passo-passo/motore/generatore.js` (prati e pascoli) e
`motore/sagome.js` (i posti con lo zaino), controllati col risolutore.

## Le regole

- **È il finale, e la difficoltà sta sempre in cima**, dal primo sentiero
  all'ultimo. Chi ci arriva ha già dimostrato di sapersela cavare. Provata
  una scala che sale con le partite: non va, rendeva facili proprio i primi
  posti del finale.
- **Mescola solo quello che si è finito** (`INGREDIENTI`): ogni gradino
  **finito** della campagna porta una cosa — una regola del mondo, il cane,
  una carta. Finito e non visto: il gradino in corso si sta imparando.
  «Tutto il mondo» non porta niente di nuovo.
- **Si apre alla fine delle buche** (`TAPPE_PRIME` in `dati/campagna.js`),
  anche se sulla mappa sta in fondo: a sei anni lo zaino è chiuso per età e
  il sentiero no, ed è il posto dove giocare intanto. Chi ha sei anni trova
  prati e pascoli, chi ha finito tutto anche le scatole.
- **La varietà la fa il caso togliendo.** A ogni posto si tira la famiglia
  (`famigliaDi`: prato, cane, ripeti, fino, se — quella appena giocata pesa
  meno) e il posto nasce con tutto quello che la famiglia sa fare, **meno una
  o due cose**:
  - **un prato** ha le quattro regole del mondo meno una o due, e tutte
    quelle rimaste devono servire, dentro un **labirinto di siepi** con
    qualche slargo (`bozzaLabirinto`), la tana lontana e la carota in un
    vicolo. Provato un prato aperto tirato a caso: quasi sempre strada
    dritta, non arrivava mai a dieci frecce;
  - **un pascolo** ha tre pecore sparse e il ghiaccio, meno uno dei due; le
    pecore non partono mai incastrate;
  - **un posto con lo zaino** è una delle forme della fine della campagna
    (`motore/sagome.js`), sempre **a due idee**: due scale in fila, le
    terrazze, il campo arato, la spirale di ghiaccio, le pozze coi massi; col
    fino a i gradini storti, il campo storto, le scale coi pianerottoli; col
    se le colline e il sentiero dei segni.
- **Il fuori è fatto di macchie** (boschetto, stagno, siepe), mai di prato:
  un pezzo d'erba che dalla strada non si raggiunge sembra una strada.

## Il pavimento

Ogni posto ha una soluzione, sempre, e un pavimento misurato **senza**
carota: chi lascia perdere la carota non deve trovare un posto da tre frecce.

| famiglia | pavimento | dove |
|:--|:--|:--|
| prato | strada più corta ≥ 10 frecce | `PAVIMENTO.prato` in `motore/generatore.js` |
| pascolo | ≥ 12 | `PAVIMENTO.cane` |
| zaino | strada scritta freccia per freccia ≥ 12 mosse (8 o 10 dove una mossa è una scivolata o un salto) | `STRADA_MIN` in `motore/sagome.js` |
| zaino | lo zaino tiene ≥ 5 carte (due idee in quattro non stanno) | `ZAINO_MIN` |

## I controlli

- **Prato e pascolo** si tengono solo se il risolutore dice che si vincono
  con la carota (l'osso), che la carota vuole una deviazione, e che tutte le
  regole del posto servono davvero.
- **I posti con lo zaino vanno al contrario**: prima si sceglie il
  programma, poi si scava il posto attorno alla sua strada, e lo si gira e
  specchia a caso. Il motore rigioca tutto e butta il posto se:
  - la scatola non serve (la strada scritta freccia per freccia ci starebbe
    nello zaino);
  - una mossa ingenua vince (frecce nell'ordine sbagliato, colori scambiati,
    un se dimenticato);
  - col fino a **un numero qualunque** al posto del colore vince lo stesso:
    si provano tutti.
- Se il generatore non trova niente, c'è un posto di riserva (`RISERVA`,
  `RISERVA_ZAINO`).

## Monete e record

Un sentiero vinto vale 🪙3, 🪙6 con lo zaino. Stelle non ce ne sono, ma la riga
«si può fare con N frecce» sì. Il record è **quanti sentieri di fila senza
comprare aiuti**: sbagliare non chiude la serie, e nemmeno i due gradini
gratis del 💡; comprarne uno sì. Nemmeno uscire la chiude: la serie si
riprende dalla carta in cima alla mappa ([sosta.md](sosta.md)). Sta sul tasto
della mappa e nella tabella dei primati (vedi `src/giochi/primati.js`).
