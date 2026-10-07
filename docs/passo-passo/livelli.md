# Passo passo — come si scrive un livello

La mappa, i campi di una tappa, le misure di oggi e cosa controlla il banco.
La campagna sta in `src/giochi/passo-passo/dati/campagna.js`, che in testa
spiega i campi; il banco è `test/unita/passo-passo`.

## La mappa

Un elenco di righe, un carattere per cella (legenda in `dati/mondo.js`):

    .  prato      ~  acqua      *  ghiaccio      @  tana      P  partenza
    c  carota     C  carota sul ghiaccio
    m  masso      M  masso sul ghiaccio
    A  albero     B  cespuglio   S  sasso   O  sasso nel ghiaccio   (alti)
    t  tronco     -  staccionata                                    (bassi)
    1 2 3  le buche, a coppie
    r u g  le lastre (rossa, blu, gialla)
    p  una pecora   #  il recinto   (un livello con le pecore non ha la tana)

- **La carota e il masso hanno due lettere, un albero una sola**: sotto
  la carota o il masso il terreno conta per le regole (si scivola o no),
  sotto un albero no — un albero non lo attraversa nessuno.
- **Un livello è un posto, non una stanza.** Ognuno ha la sua forma (un
  prato, un bivio nel bosco, un fiume con le isole, un lago ghiacciato col
  buco), il fuori non è sempre un rettangolo pieno, e il `racconto` dice il
  piccolo «aha» che il livello esiste per far scoprire.
- **Misure**: al massimo sette per nove per i piccoli (stanno intere su un
  telefono), fino a nove per undici con lo zaino.

## I campi di una tappa

- **`scalino`** — il gradino. La regola del gradino **deve servire**: un
  livello del ghiaccio che si vince col ghiaccio trattato da prato insegna
  un'altra cosa.
- **`portata`** — la scala di tutto il repo (vedi
  [../apprendimento/eta-e-portata.md](../apprendimento/eta-e-portata.md)):
  dal 4 del prato al 44 di «Tutto insieme» e del cane, dal 46 al 74 con lo
  zaino. **44 e non 45 apposta**: la mira di un bambino di sei anni arriva a
  44, e un punto in più chiudeva l'ultima tappa (e il sentiero dietro) proprio
  a chi ha l'età giusta. Nessuna tappa dichiara `scuola`: dietro non c'è un
  pezzo di programma, e la testa della fila non si taglia mai.
- **`premio`** — monete della prima vittoria, una volta sola; sale col
  gradino perché sale il tempo che il livello chiede (vedi
  [stelle-e-aiuti.md](stelle-e-aiuti.md)).
- **`salti: true`** — accende la seconda fila di frecce. Solo dove serve:
  una fila di tasti inutili è una fila di tasti da provare a caso.
- **`trappole`** — solo nei livelli del cane: le mosse ingenue, che non devono
  vincere e devono fare un pezzo di strada prima di fermarsi.
- **stagione** — solo il vestito.
- **Con lo zaino**: `carte` (i tasti oltre alle frecce, es. `['ripeti']`),
  `zaino` (quante carte tiene la fila), `soluzioni` scritte con
  `programma()`, `ripeti()`, `se()`, e `fragili` (vedi [zaino.md](zaino.md)).

Quanto è lunga la strada più corta e se la regola serve **non si scrive nel
livello**: lo misura il risolutore.

## Cosa controlla il banco

Il **risolutore** (`motore/risolutore.js`) è una ricerca in ampiezza: lo
stato è piccolo, e basta. Lo stesso motore dà gli aiuti (la prossima freccia
giusta) e fa i sentieri senza fine. `test/unita/passo-passo` pretende:

- che ogni livello si vinca con la carota, e che la strada giocata dal
  motore vinca davvero con quattro stelle;
- che la regola del gradino serva (`serveLaRegola`), e con lo zaino che serva
  la carta (`serveLaCarta`) e che nessuna `fragili` prenda la carota;
- che chi segue soltanto gli aiuti arrivi a casa;
- che le `trappole` del cane falliscano dopo un pezzo di strada, che le mosse
  ingenue dello zaino facciano almeno due passi prima di fermarsi, e che il
  cane torni nei gradini dello zaino.

Le soluzioni scritte più corte le verifica `strumenti/passo-passo/minimi.mjs`,
che nei gradini del «fino a» e del «se» cerca anche un programma che stia
nello zaino **senza la carta del gradino**: se c'è, il livello insegna a
contare, non la carta (le nicchie di prima si vincevano con 🔁8(→ ← →),
perché passando avanti e indietro il cane spingeva la pecora fino in
fondo dal corridoio; oggi la stalla è fuori dalla sua vista). Il banco non
lo lancia: una ricerca così vuole minuti.

## Quando la fila cambia

- **Le stelle stanno sotto l'indice della tappa** (la forma di tutte le
  campagne, `src/giochi/campagne.js`): inserire una tappa in mezzo senza
  travaso sposta le stelle sul livello sbagliato.
- **Ogni fila giocata resta scritta in `FILE`** (`dati/campagna.js`), l'ultima
  è `FILA_ATTUALE`, e il profilo dice quale conosce (`cfg.fila`). `riordina`
  rimette le stelle per chiave.
- **La tappa raggiunta resta la stessa tappa**: chi era allo zaino resta allo
  zaino, e un gradino nuovo gli si apre alle spalle. È il contrario del
  costruttore (vedi [../costruttore/campagna.md](../costruttore/campagna.md)): un livello che ieri c'era
  e oggi è chiuso è la cosa che non deve succedere.
- **`TAPPE_PRIME`** è la fine delle buche (l'indice della prima tappa del
  cane): lì si apre il sentiero del coniglio e lì si fermano i traguardi di
  prima — una soglia che si allunga con la campagna farebbe tornare
  d'argento l'oro di chi le aveva finite tutte.
- **`cfg.eredita` è un cursore come `tappa`**: se la fila cambia si travasa
  con lei (in `Gioco.vue`, accanto a `riordina`).

### Le tappe in coda

Le tappe nuove del cane si aggiungono **in fondo a `CAMPAGNA`**, dopo
l'ultima del coniglio: gli indici di prima non cambiano, quindi non serve
una fila nuova in `FILE` né un travaso (`FILE[4]` si allunga e basta).
Messe in mezzo, finivano sotto `cfg.eredita` di chi era già più avanti, e
si sarebbero aperte già fatte.

- **Sulla mappa vanno nella loro isola** (`motore/strade.js` le riconosce
  dalle pecore e dallo scalino), dopo quelle che c'erano; la strada del
  cane va di isola in isola, non per indice. Un'isola di una valle dipinta
  (anche un'isoletta dello zaino) vuole la sua casella in più nel foglietto
  (`"caselle"`), e si rilancia lo strumento ([mappa.md](mappa.md#il-foglietto-e-lo-strumento)).
- **`FINE_STRADA`** è la fine della strada del coniglio: lì la campagna è
  finita («tutte le tane», `libera`), e lì si ferma il cursore. Le tappe in
  coda non lo muovono (`postoNelCursore`, il `posto` di `completa`), se no
  il cane portava la riga della home, i traguardi e l'esperienza in fondo
  alla fila. I gradini del sentiero si contano finiti fino a lì.
- **Una tappa fatta resta aperta**: le stalle a gradini vinte prima che nel
  ripeti arrivassero il cortile e il pettine non si chiudono.
- Gli scalini in fila, la portata e il premio si controllano fino a
  `FINE_STRADA` e lungo la strada del cane.

## Le due strade

La campagna resta una fila sola (le stelle sotto l'indice), ma sulla mappa
le strade sono due ([mappa.md](mappa.md)). Le ricava `motore/strade.js`
dai dati, senza elenchi scritti a mano:

- **una tappa con le pecore nella mappa è del cane**, le altre del
  coniglio. Il coniglio è la **strada maestra**: tutte le sue tappe in fila.
- **Il cane è un ramo**: le sue tappe di uno scalino fanno un'isola, che
  parte da una tana sulla strada del coniglio (l'`attacco`): la prima tappa
  del coniglio dello stesso scalino, quella che insegna la carta (il viale,
  i gradini storti, le colline, la spirale di ghiaccio); se lo scalino è
  tutto del cane, l'ultima del coniglio prima di lui (la fine delle buche).

Chi apre cosa:

- **il coniglio**: fatta la tappa del coniglio prima. Non chiede mai il cane.
- **il cane**: fatta la tappa del cane prima, **e** fatta la tappa del
  coniglio da cui si apre la sua tana. Il primo gregge si apre alla fine
  delle buche, come prima; le stalle quando c'è il gregge e il viale.
- **fatta** vuol dire con almeno una stella, o sotto il cursore di prima.
- **Quello che il cursore di prima apriva resta aperto**: alla prima
  apertura il gioco scrive `cfg.eredita` (la `tappa` di quel momento), e
  tutto fino a lì resta aperto e conta come fatto. Il cursore `tappa`
  continua a salire con `completa()` (al massimo), e lo leggono il sentiero,
  i traguardi, l'esperienza e la riga della home; le aperture no.
- **L'età e i grandi valgono su tutte e due**: `chiusaPerEta` vince su tutto,
  e una tappa che l'età dà per passata è aperta comunque.
- **Il ▶ a fine partita resta sulla strada che si sta facendo**
  (`prossima`): il coniglio va avanti sulla strada maestra; il cane va
  avanti nella sua isola, e finita l'isola torna sulla strada maestra alla
  tappa dopo la tana. Al bivio, con la strada maestra chiusa dall'età, il
  ramo. Davanti allo zaino chiuso o in fondo, il sentiero: quello del cane
  dopo una tappa del cane, se è aperto, se no quello del coniglio.
- **La campagna è finita quando è finita la strada del coniglio**
  (`FINE_STRADA`, vedi sopra): la riga della home dice «tutte le tane». Il
  cane conta per le stelle.
- **Il sentiero del cane si apre** solo a pascolo finito (il gregge vinto):
  un gradino si conta finito dalla sua ultima tappa, non dalla dopo.

Il cane non insegna niente che serva al coniglio dopo: le sue carte e le
cose del mondo che usa le ha già portate il coniglio, e
`unita/passo-passo-strade` lo pretende.

## Le tappe di oggi

La colonna «frecce» è la strada più corta **con la carota**, misurata dal
risolutore; per i livelli con lo zaino è quante carte tiene lo zaino.

| | | frecce |
|:--|:--|:--:|
| **🐾 Primi passi** | *solo frecce* | |
| 1. Il prato | la carota sta sulla strada | 3 |
| 2. Il cespuglio | dritti si sbatte: bisogna girarci attorno | 5 |
| 3. Lo stagno | due strade, e la carota è su una delle due | 7 |
| 4. Il bosco | la strada corta porta a casa, la lunga dalla carota | 7 |
| 5. L'orto | la carota è in un buco della fila | 8 |
| **🦘 Il salto** | *l'acqua e i tronchi sì, i sassi no* | |
| 6. Il ruscello | si salta, e si atterra sulla carota | 3 |
| 7. Il tronco | il sasso non si salta, il tronco sì | 6 |
| 8. Il fosso | largo due: bisogna trovare la secca | 7 |
| 9. L'orto recintato | si salta dentro la staccionata e fuori | 4 |
| 10. I sassi nel fiume | da un'isola all'altra | 7 |
| **❄️ Il ghiaccio** | *si scivola finché qualcosa non ferma* | |
| 11. Il laghetto ghiacciato | una freccia attraversa tutto il lago | 2 |
| 12. Il sasso che frena | ci si ferma contro il sasso | 4 |
| 13. Il ghiaccio rotto | dritti si finisce nel buco | 5 |
| 14. Il fiume gelato | la carota solo scendendo nel punto giusto | 5 |
| 15. Il labirinto di ghiaccio | ogni scivolata finisce contro un sasso | 7 |
| 16. La crepa | ci si ferma accanto alla crepa, poi la si salta | 6 |
| **🪨 I massi** | *sul ghiaccio scivola, nell'acqua fa un ponte* | |
| 17. Il masso | spinto, apre la strada | 7 |
| 18. Il ponte di sasso | il masso nell'acqua diventa un ponte | 8 |
| 19. Il masso sul ghiaccio | scivola e diventa il sasso che ti ferma | 5 |
| 20. Due massi | prima quello davanti, poi l'altro nell'acqua | 10 |
| **🕳️ Le buche** | *si entra in una buca e si esce dalla gemella* | |
| 21. Le buche | sotto la siepe c'è una galleria | 6 |
| 22. La buca nel ghiaccio | la buca porta all'isola della tana | 5 |
| 23. Le buche colorate | la rosa alla carota, la viola alla tana | 7 |
| 24. Tutto insieme | staccionata, masso nel fiume, lago, buca | 12 |
| **🐑 Il cane pastore** | *portale tutte nel recinto* | |
| 25. Il primo gregge | la pecora si scansa prima che arrivi | 7 |
| 26. Dall'altra parte | le gira attorno in diagonale | 8 |
| 27. Una spinge l'altra | accanto, poi tutte e due insieme | 8 |
| 28. La curva | chi la spinge troppo in là la incastra | 15 |
| 29. La pecora sul ghiaccio | scivola fino al sasso sopra il cancello | 8 |
| 30. La galleria | il cane sbuca alle spalle della pecora | 10 |
| 31. Il guado | il cane salta il fiume, e dove atterra conta | 10 |
| 32. Il lago gelato | la pecora fino all'erba, il cane fino al sasso | 11 |
| 33. Riunire il gregge | tre pecore sparse: in fila, poi dentro | 17 |
| 34. Il ponte per le pecore | prima il masso nel fosso, poi la pecora | 16 |
| 35. Il gregge | quattro pecore e un cancello solo | 18 |
| **🔁 Il ripeti** | *una scatola ripete quello che ha dentro* | zaino |
| 36. Il viale | il numero giusto: né sei né quattro | 3 |
| 37. Le stalle | ogni pecora scende nella sua stalla | 2 |
| 38. Lo stagno grande | una scatola per lato | 4 |
| 39. La scala | due frecce in una scatola, e l'ordine conta | 3 |
| 40. Di sasso in sasso | anche un salto si ripete | 3 |
| 41. Il lago a gradini | la stessa freccia fa una, tre, due caselle | 3 |
| 42. La collina | due scatole diverse | 6 |
| 43. Le terrazze | una scatola dentro l'altra | 5 |
| 44. Il campo arato | quattro scatole dentro una | 9 |
| **🚩 Fino a** | *ripete finché non arriva sulla lastra giusta* | zaino |
| 45. I gradini storti | fino al rosso, e si scende | 5 |
| 46. Le stalle a gradini | due corridoi lunghi diversi | 5 |
| 47. Scale e pianerottoli | la scala fino al rosso, il pianerottolo fino al blu | 7 |
| 48. Il campo storto | i passaggi ogni volta in un posto diverso | 9 |
| 49. La spirale | ogni lato più corto, agli angoli il rosso | 9 |
| **❓ Il se** | *guarda cosa ha sotto i piedi, e decide* | zaino |
| 50. Le colline | sul rosso si scende, sul giallo si sale | 6 |
| 51. Il sentiero dei segni | ogni lastra dice dove andare | 9 |
| 52. Le nicchie | il cane entra nella nicchia sopra o sotto | 8 |
| **🌍 Tutto il mondo** | *ghiaccio, massi, salti e segnali, con le scatole* | zaino |
| 53. La spirale di ghiaccio | quattro frecce, fermano i sassi | 5 |
| 54. Le pozze | la stessa scatola spinge un masso a ogni gradino | 5 |
| 55. Il fiume dei sassi | fino al rosso, e un salto oltre la siepe | 7 |
| 56. Il lago delle stalle | la seconda spinta scivolandole dietro | 7 |
| 57. Il bosco ghiacciato | quattordici scivolate, un programma che legge i segnali | 8 |
| **🐕 In coda: le isolette del cane** | *ognuna nell'isola del suo scalino* | zaino |
| 58. Il cortile (🔁) | due file di stalle ad angolo: una scatola per lato | 4 |
| 59. Il pettine (🔁) | entra nel vicolo, esci, avanti di due | 5 |
| 60. Il pettine storto (🚩) | i vicoli non sono in fila: fino al rosso | 5 |
| 61. I vicoli (🚩) | giù fino al blu, su fino al rosso | 7 |
| 62. Il sentiero del gregge (❓) | le lastre dicono la strada, le pecore stanno ai lati | 9 |
| 63. Le nicchie fonde (❓) | il rosso è fondo due, il blu uno | 10 |
| 64. Le gallerie (🌍) | dentro e fuori dalla buca, poi giù per il guado gelato | 5 |
| 65. Gli steccati (🌍) | fino al rosso, e si salta lo steccato | 4 |
