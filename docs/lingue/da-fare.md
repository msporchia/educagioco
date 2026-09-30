# L'inglese a mondi: cosa manca

Un mondo per anno di scuola, tutti e cinque con le tappe di parole, le
tappe di frasi e il libro. Il grafo in [mondi.md](mondi.md), le frasi in
[frasi.md](frasi.md), la vista in [mondi-vista.md](mondi-vista.md). Il
resto, in ordine.

## Le strutture che restano fuori

- **Il passato progressivo** (*while I was reading*) e il discorso
  indiretto (*she said that…*) sono della media: *while* sta solo in frasi
  al presente, *said / told* senza *that* ([strutture.md](strutture.md)).
- **How much is it?** aspetta i soldi (qui sotto).

## Il libro

- **Una serie sola**, «La vecchia mappa» in quinta, con le tre puntate alla
  🏁. Se ai bambini piace: una serie di quarta (al presente), e le puntate
  sparse lungo l'isola con `dopo` ([libro-racconti.md](libro-racconti.md#le-storie-a-puntate)).
- **Le prime tre storie di quarta e quinta** hanno una domanda di tipo
  nuovo ciascuna, non due: dove erano già sei, l'ordine ha preso il posto
  di «Che cosa è successo prima?» ([libro.md](libro.md#le-monete)).

## Le parole che mancano

- **I soldi della quinta**: *money, coin, price, cheap, expensive* non sono
  in `data/words.js`. Una tappa «Al negozio» li vuole, con *how much is it?*
  fra le strutture.
- **Le parole aggiunte il 30 settembre 2026 non hanno ancora la voce**: i
  dodici mesi (*January … December*), *sixty, seventy, eighty, ninety*, i
  verbi *say, tell, hear, wait, drive* e le parole delle storie *suddenly,
  treasure, voice*.
  Va lanciato `npm run voci` (vuole rete e ffmpeg; se in coda dice «non
  incise», si rilancia lo stesso comando): finché non gira, `unita/inglese`
  è rosso su «parole senza clip». Il gioco regge comunque: l'audio non
  porta informazione.

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
- **Un mondo passato** ha solo una riga sotto il nome («già fatto a
  scuola: da ripassare»): la pergamena potrebbe dirlo anche lei.

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
- **La prova finale** è ancora un mondo senza tappe.

`node strumenti/inglese/banchi.mjs <mondo o tappa>` e `--capitolo=<id>` per
rileggere i banchi; `node test/esegui.mjs inglese-mondi` li controlla tutti.

## Lo spagnolo

Stesso motore, dati suoi: un grafo di mondi con le difficoltà dello
spagnolo (ser/estar, il genere, tener, gustar: vedi
[vocaboli.md](vocaboli.md#lo-spagnolo)), le sue forme (`forma-es:`, da
scegliere guardando `store/progressi.js`), la sua tabella di trappole e le
sue contrazioni (`del`, `al`). Oggi il motore è scritto per l'inglese in
quattro punti: `motore/lessico.js` (i pronomi, i verbi, i plurali, le cose
che non si contano), `motore/grammatica.js`, le operazioni di
`motore/trappole.js` e `dati/contrazioni.js`; vanno resi per lingua prima di
cominciare. Il `¿…?` è una regola dei dati spagnoli: le trappole di una
domanda devono essere domande anche loro.

## Le voci delle frasi

Le frasi e i testi dei capitoli non hanno voce: `strumenti/incidi-voci.mjs`
incide solo parole e verbi (`LINGUE` in testa al file), anche per le frasi
del gioco vecchio. Per sentire le frasi componibili bisogna aggiungerle lì
(le frasi di `src/giochi/inglese/dati/frasi.js`, forma lunga e contratta) e
rilanciare `npm run voci`.
