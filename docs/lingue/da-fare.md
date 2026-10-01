# L'inglese a mondi: cosa manca

Sei isole, una per anno della primaria più una dopo, tutte con le tappe di
parole, le tappe di frasi e il libro. Il grafo in [mondi.md](mondi.md), le frasi in
[frasi.md](frasi.md), la vista in [mondi-vista.md](mondi-vista.md). Il
resto, in ordine.

## Le strutture che restano fuori

- **Il passato progressivo** (*while I was reading*) e il discorso
  indiretto (*she said that…*) sono della media: *while* sta solo in frasi
  al presente, *said / told* senza *that* ([strutture.md](strutture.md)).
- **L'alfabeto e lo spelling**: sono suoni, e l'audio non porta
  informazione ([programma.md](programma.md#cosa-non-si-è-aggiunto)).

## Il libro

- **Una serie sola**, «La vecchia mappa» nella sesta isola, con le tre puntate alla
  🏁. Se ai bambini piace: una serie di quarta (al presente), e le puntate
  sparse lungo l'isola con `dopo` ([libro-racconti.md](libro-racconti.md#le-storie-a-puntate)).
- **Le prime tre storie di quarta e quinta** hanno una domanda di tipo
  nuovo ciascuna, non due: dove erano già sei, l'ordine ha preso il posto
  di «Che cosa è successo prima?» ([libro.md](libro.md#le-monete)).

## Le parole che mancano

- Nessuna, per ora: tutte hanno la loro voce (incise il 1° ottobre 2026).
  Una parola nuova vuole `npm run voci` (rete e ffmpeg; se in coda dice
  «non incise», si rilancia): finché non gira, `unita/inglese` è rosso su
  «parole senza clip».

## La mappa

- **Più tappe per mondo, mappa più lunga**: a 390 px la mappa è alta circa
  5200 px (la terza da sola ha tredici tappe). La disposizione regge — il
  test di `unita/inglese-vista` non trova sovrapposizioni a 320/390/520 px —
  ma scorrere fino alla terza è lungo; chi rifà le isole può volere un
  passo verticale più stretto o due colonne per mondo.
- **I disegnini sono ripetuti**: le tappe nuove riusano i ventidue pittori di
  `scena/pittori.js` (i colori e «Di che colore è?» hanno tutti e due i
  pennelli, i numeri tre volte le dita). Mancano, per quello che insegnano:
  saluti (una mano che saluta), giocattoli (un orsetto), la casa e i mobili
  (un letto), i giorni e i mesi (un calendario), che tempo fa (una nuvola),
  i verbi (un omino che corre), i mestieri, i mezzi (un autobus), la città.

## Rimasto dalla vista

- **Le chiavi `forma:`** non appartengono a nessuna materia dell'albo né
  di «Come va»: non falsano nessuna percentuale, ma una struttura saputa
  non si vede da nessuna parte. Se servisse, una materia «Strutture
  inglesi» col totale delle forme che hanno una tappa.
- **La traduzione di una frase intera** non c'è: si toccano le parole una
  per una. Per «riconosci» e «cosa vuol dire» basta; per il libro più
  lungo dei mondi dopo potrebbe servire.
- **Il gioco di prima** resta finché qualcuno l'aveva: quando nessun
  profilo di casa ha più `p.eng.libera` in uso, si può togliere insieme
  alla campagna vecchia (`data/campagna-inglese.js`), tenendo le sue chiavi.

`node strumenti/inglese/banchi.mjs <mondo o tappa>` e `--capitolo=<id>` per
rileggere i banchi; `node test/esegui.mjs inglese-mondi` li controlla tutti.

## Lo spagnolo

Fatto il 1° ottobre 2026 ([spagnolo.md](spagnolo.md)): sei isole, 77 tappe,
610 frasi, 122 concetti e un libro. Il motore è una copia di quello
dell'inglese con la lingua rifatta ([spagnolo-motore.md](spagnolo-motore.md)):
se si corregge un difetto del motore comune, va corretto in due posti. Manca:

- **Il motore comune**: grafo, sessione, formati, grado, mappa e storie sono
  copie identiche; fattorizzarle (un motore che prende i dati di una lingua)
  è il lavoro da fare quando la terza lingua lo chiederà.
- **Parole che le storie chiedono**: `nadar`, `cantar`, `bailar`, `tocar`
  (quarta e sesta), `niño`/`niña` (la quinta ne ha bisogno per «del niño»),
  `para`, `lo`, `Bolivia` e i nomi di luogo, `usted` per dare del lei.
- **Le voci delle frasi** (come l'inglese, sotto).
- **I disegnini della mappa** sono quelli dell'inglese.
- **La campagna di prima** (`p.esp`) non si travasa: chi l'aveva finita
  ricomincia dalle isole, e le sue parole sapute restano sapute (stesse chiavi).

## Le voci delle frasi

Le frasi e i testi dei capitoli non hanno voce: `strumenti/incidi-voci.mjs`
incide solo parole e verbi (`LINGUE` in testa al file), anche per le frasi
del gioco vecchio. Per sentire le frasi componibili bisogna aggiungerle lì
(le frasi di `src/giochi/inglese/dati/frasi.js`, forma lunga e contratta) e
rilanciare `npm run voci`.
