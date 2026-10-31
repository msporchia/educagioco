# La conversione 2D → 3D (`statoDa2D`)

D1 è deciso ([decisioni.md](decisioni.md)): chi ha una fattoria 2D la ritrova nella 3D. Il codice è `src/giochi/fattoria3d/motore/migra.js`, la
prova `test/unita/fattoria3d-migra.test.mjs` (fattorie 2D vere a ogni livello, `fattoriaTipo` 1–99). Voci della tabella: [tecnica-e-salvataggi.md](tecnica-e-salvataggi.md) T1–T3.

## Le regole

1. **Fedele in tutto, imprecisa nei piazzamenti.** Ogni cosa posseduta con un equivalente 3D diventa un pezzo nel `magazzino`, da ripiazzare
   senza pagare. In mappa resta solo il campo di partenza della 3D (è già lì in una fattoria nuova).
2. **Mai monete.** Le monete vengono solo dagli esercizi: la funzione non le tocca né le inventa (un test lo controlla sul profilo e sullo stato).
   Quello che non ha un equivalente non si traduce in prezzo: si conta in `daRegalare`.
3. **Non lancia mai.** Un dato vuoto, guasto o già senza niente da portare torna `null` e la 3D parte da zero. Un'esperienza assurda (> 1e9)
   è un guasto: la ricerca del livello altrimenti non finirebbe.
4. **Il dato 2D non si tocca.** Si rilegge con la `Fattoria` della 2D (i salvataggi vecchi, i campi che mancano) e basta: restano leggibili.
5. **Una volta sola.** Si converte solo se la 3D non ha uno stato suo (`statoDaCaricare`): da quando la 3D salva, il suo stato vince sempre.

## Cosa diventa cosa

| 2D | 3D |
|---|---|
| `orto` (campo) | `campo` (uno è già in mappa, gli altri nel magazzino) |
| macchine: mulino, fienile, panificio, caseificio, telaio, zuccherificio, gelateria, sartoria, tintoria, friggitoria, sushi bar, pentolone | lo stesso edificio, nel magazzino, **uno per tipo**. I **posti della fila comprati** (in mappa `fila`, messe via `fileRiposte`) e **ogni copia in più** diventano posti della sua fila, fino a sei; le copie che non ci stanno sono «da regalare» |
| `pastificio` · `cucina` | `pasticceria` · `conserviera` (gli id 3D sono quelli dei salvataggi; la `pasticceria` 2D è una bottega e non c'entra) |
| `mongolfiera` · `mercato` · `carretto_mercato` | `mongolfiera` · `bancarella` · `trattore` |
| i dieci recinti (ovile, pollaio, stalla, porcile, anatre, capre, conigliera, arnie, alpaca, asini) | il recinto 3D dello stesso mestiere (anche più d'uno), con una bestia dentro |
| `peschiera` | `porticciolo` (uno solo: la pesca ne ha preso il posto allo stesso livello, A1k); le altre copie «da regalare» |
| le botteghe del paese | la bottega 3D (`bottega_*`) con la sua fama (le consegne fatte) |
| i silos (`silo`, `silo_bianco`, `dispensa`) | **gli ingrandimenti** (`silos` della 2D → `silo` della 3D, fino a 18 passi); gli edifici li mette la 3D da sé, quanti ne servono ([../magazzini.md](../magazzini.md)) |
| le 217 decorazioni, le zucche di Halloween | il decoro 3D con lo stesso id (il `recinto` di legno è `recinto_legno`); i fiori e i vasi senza un loro pezzo sono `aiuola` |
| scorte di raccolti (`carote`, `fieno`…) | `merci` (singolare: `carota`, `erba`…) |
| scorte di prodotti, uova, latte, pesce | `prodotti`; la lana il contatore `lana` |
| piazzole comprate | tutta la terra che aveva la 2D in lotti 4×4, col regalo (`lottiPerPiazzole`), i più vicini al quadrato di partenza, solo prato o bosco, sempre confinanti |
| raccolto maturo in un campo · lavoro finito in una macchina | la resa nelle scorte; il lavoro non finito rende gli ingredienti |
| bestie di casa: beagle, coniglio, pappagallo, gatto rosso | in `casa`, col nome, i bisogni a metà; bobtail, gatto bianco e nero e gatto nero sono già i compagni gratis |
| i tartufi (in 3D è la pancetta, un'altra merce: le scorte si perdono, decisione del 22/10/2026) · gli addobbi delle bestie | **`daRegalare`** |

`daRegalare` è un conto `{ 'scorta:tartufi': 4, 'addobbo:cappello': 2, 'cosa:caseificio': 1 }`: non vale monete e non si spende. **Si consegna da
sé**: all'apertura, uno stato con `migrato` più vecchio di `MIGRAZIONE` passa da `ritoccaLaConversione`, che mette nel magazzino, nelle scorte o
in casa tutto quello che nel frattempo ha un equivalente; il resto aspetta. Lo stato porta `migrato: MIGRAZIONE` (oggi 2). Non si portano, e non
c'è niente di pagato dentro: i piazzamenti, gli ordini aperti al banco e ai banconi (il premio arriva alla consegna), il volo in corso (ogni cassa
è già pagata quando la si riempie).

**Una conversione nuova** (un equivalente in più, una cosa che prima non si portava) alza `MIGRAZIONE`: chi era stato convertito prima si ritocca
all'apertura. `ritoccaLaConversione` rilegge la 2D (che non si tocca mai) e prende il più alto fra quello che ha e quello che la 2D gli darebbe
oggi, per i silos e i posti della fila; le cose «da regalare» le consegna. Con `MIGRAZIONE` 2 sono arrivati gli ingrandimenti dei silos, i posti
della fila e le copie delle macchine, le zucche, la peschiera, e tutto ciò che i giri G4–G6 hanno portato (recinti, scorte, bestie) a chi era
stato convertito prima.

## Il livello (1 a 1 dal 22/10/2026, D2)

La 2D ha 70 livelli, la 3D 18: la scala è «in proporzione», `1 + round((L − 1) / 69 · 17)` (2D 10 → 3D 3, 35 → 9, 70 → 18; tutto oltre il 70
sta al 18). L'**esperienza** porta con sé anche la frazione già fatta del livello 2D, sulla banda del livello 3D. Poi il livello **non scende
sotto** quello che serve a tenere ciò che si ha: un edificio o un pezzo produttivo nel magazzino, e le colture che la 2D aveva già aperto
(`reclamati`). Il resto degli sblocchi (ricette, pezzi) li dà il livello, come sempre.
Fatto: `livelloPerProporzione` è l'identità (70 livelli uguali). La terra è tutta quella che aveva la 2D (324 celle di partenza + 36 a piazzola, col regalo del 5%: `lottiPerPiazzole`, 13 lotti nuovi per chi non ne ha comprate), non più «due lotti a piazzola». Il `mangime` del cane ora è un prodotto del mulino 3D e non è più «da regalare».

## L'aggancio

`statoDaCaricare(leggi)` (`leggi` è `scelta` di `src/giochi/campagne.js`) è quello che `onMounted` di `src/giochi/fattoria3d/Gioco.vue` passa al
motore: lo stato della 3D se c'è (ritoccato se viene da una conversione vecchia), se no la conversione della 2D. Quando la 3D salva, il suo stato
sostituisce la conversione. «Ricomincia la fattoria» (Giochi › Avanzate, [../../genitori/giochi.md](../../genitori/giochi.md)) azzera anche
`fattoria3d`, o la conversione tornerebbe a ogni avvio.

## Rifare la conversione (cheat)

`#fattoria3d-da2d` (o il tasto in `/admin`) mette la 3D del bambino attivo nel cestino (`cestinaOra`) e la rifà dalla sua 2D, anche se la 3D
ha già uno stato suo (`statoRifattoDa2D`). **Si usa con un bambino di prova**: la 3D di prima si perde dal gioco, resta solo nel cestino. Se il
bambino non ha una 2D da portare, il gioco lo dice con un avviso e non butta niente.

## Da fare

- Provarla su un salvataggio vero esportato (non solo sulle fattorie tipo).
- I posti della fila comprati per un **recinto** 2D non si portano: in 3D un recinto non ha fila ma bestie da comprare dentro, e un recinto nel
  magazzino non tiene bestie. Da decidere se diventano bestie in più quando il recinto si posa.
- Gli addobbi arrivano quando la 3D li avrà: allora si alza `MIGRAZIONE` e `consegnaIlDovuto` impara la voce `addobbo:`.
- Mostrare la `daRegalare` ai genitori nel quadro; la riga «la tua fattoria è arrivata» per i bambini, da proporre (D16).
