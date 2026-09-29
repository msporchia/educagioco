# L'inglese a mondi: cosa manca

Il motore e i dati dei primi due mondi ci sono
([mondi.md](mondi.md#comè-costruito)); il resto, in ordine.

## La vista

- **`src/giochi/inglese/`**: `gioco.js` (il manifesto, chiave `inglese`),
  `Gioco.vue`, `viste/` e `scena/`, sulla convenzione
  ([../core/convenzione-giochi.md](../core/convenzione-giochi.md)).
  L'interfaccia da usare è in [mondi.md](mondi.md#linterfaccia-per-la-vista).
- **La mappa del tesoro**: il grafo come la mappa del sotterraneo, su
  pergamena, sentieri tratteggiati, un disegnino per tappa (il campo
  `disegno` di `dati/mondi.js` ne dà il nome) fatto coi pittori, niente
  emoji come figura. La tappa si riempie col grado e sbiadisce quando
  scende; i mondi senza tappe si vedono «in arrivo».
- **Le schermate**: le opzioni, la fila di tessere da toccare (niente
  trascinamento), il capitolo con le sue domande, il «perché» e il «Si fa
  così» dopo uno sbaglio con l'attesa di `docs/apprendimento/la-domanda.md`,
  la parola da toccare con l'avviso sull'indicatore delle monete prima di
  rispondere.
- **Le monete**: il motore dice solo `paga`. Quanto vale una domanda, una
  tappa vinta la prima volta e un capitolo si decide con
  [../apprendimento/calibrazione.md](../apprendimento/calibrazione.md).
- **Il posto della vista nuova**: al posto di `views/LinguaGame.vue` per
  l'inglese (lo spagnolo resta sul vecchio finché non ha i suoi mondi), e
  il **travaso** da `p.eng` — si pubblica insieme alla mappa nuova, mai
  prima. Il gioco libero resta a chi l'aveva.
- **L'età**: la `portata` delle tappe è scritta ma `data/portata-giochi.js`
  non la legge ancora.
- **I bersagli dei test** (`data-…`) e il test di integrazione
  (`test/integrazione/inglese-mondi`), da scrivere in mondi.md alla riga
  «Nei test».
- **L'albo**: la materia «Frasi inglesi» in `store/progressi.js` ha
  `totale: FRASI.length` delle frasi vecchie, ma conta tutte le chiavi
  `frase:`. Le frasi nuove (`m-…`) la farebbero passare il cento per
  cento: il totale va rifatto sull'unione delle due liste quando la vista
  comincia a segnarle. Stesso discorso per le chiavi `forma:`, che non
  appartengono a nessuna materia.

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
