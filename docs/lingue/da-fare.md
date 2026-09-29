# L'inglese a mondi: cosa manca

I primi due mondi si giocano: motore e dati in [mondi.md](mondi.md#comè-costruito),
la vista in [mondi-vista.md](mondi-vista.md). Il resto, in ordine.

## Rimasto dalla vista

- **L'età**: la `portata` delle tappe è scritta ma nessuno la legge. Chi
  decide se la carta English si offre (`TAPPE_DEL_GIOCO.inglese` in
  `data/portata-giochi.js`) guarda ancora le tappe della campagna vecchia,
  e le tappe dei mondi non hanno un cancello per età. Da decidere se i
  mondi ne vogliono uno (il grafo si apre per merito, come il costruttore)
  o se basta la carta.
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

## I mondi 3–8 e la prova finale

«Dove?», «Cosa sai fare», «La mia giornata», «Lui e lei», «Adesso»,
«Ieri»: nel grafo ci sono già (con le loro categorie per il cassetto), ma
senza tappe. Per ognuno: le tappe in `dati/mondi.js` (8–10 parole nuove più
una forma), le forme in `dati/forme.js`, le frasi in `dati/frasi/<mondo>.js`
(e una riga in `dati/frasi.js`), un capitolo in `dati/capitoli/`, e le righe
delle trappole che mancano. Le righe di `can-to`, `terza-senza-s`,
`does-con-s` e `passato-in-ed` ci sono già; per i verbi alla terza persona
e al passato servirà quasi certamente un'operazione nuova che riconosca i
verbi oltre a `data/verbi.js` (dove `like` non c'è). Il capitolo cresce coi
mondi: fino a 12–15 frasi e tre o quattro domande (il perché, l'ordine
degli eventi, quello che si capisce senza che sia scritto). In fondo, la
prova finale.

`node strumenti/inglese/banchi.mjs <mondo>` e `--capitolo=<id>` per
rileggere i banchi; `node test/esegui.mjs inglese-mondi` li controlla tutti.

## Lo spagnolo

Stesso motore, dati suoi: un grafo di mondi con le difficoltà dello
spagnolo (ser/estar, il genere, tener, gustar: vedi
[vocaboli.md](vocaboli.md#lo-spagnolo)), le sue forme (`forma-es:`, da
scegliere guardando `store/progressi.js`), la sua tabella di trappole e le
sue contrazioni (`del`, `al`). Oggi il motore è scritto per l'inglese in
tre punti: `motore/lessico.js` (i pronomi, i verbi, i plurali), le
operazioni di `motore/trappole.js` e `dati/contrazioni.js`; vanno resi
per lingua prima di cominciare. Il `¿…?` è una regola dei dati spagnoli:
le trappole di una domanda devono essere domande anche loro.

## Le voci da incidere

Le parole dei primi due mondi vengono tutte da `data/words.js` e hanno già
la loro clip. Le frasi e i testi dei capitoli no: `strumenti/incidi-voci.mjs`
incide solo parole e verbi (`LINGUE` in testa al file), anche per le frasi
del gioco vecchio. Per sentire le frasi componibili bisogna aggiungerle lì
(le frasi di `src/giochi/inglese/dati/frasi.js`, forma lunga e contratta) e
rilanciare `npm run voci`, che vuole rete e ffmpeg — se in coda dice «non
incise», si rilancia lo stesso comando. Ogni parola nuova che i mondi 3–8
aggiungono a `words.js` vuole lo stesso giro. Senza clip il gioco regge
comunque: l'audio non porta informazione.
