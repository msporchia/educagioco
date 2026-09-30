# English a mondi — il libro

Le storie da leggere dell'inglese a mondi: come sono scritte, quando se ne
apre una, quanto pagano e come si controllano. Il resto del progetto sta in
[mondi.md](mondi.md), com'è fatto a schermo in
[mondi-vista.md](mondi-vista.md#il-libro).

## Tre storie per mondo

Ogni mondo ha **tre storie**, con personaggi che tornano (Laura e suo
fratello Leo, il loro amico Tom, il cane Pip: `PERSONAGGI` in
`dati/elenchi.js`). Il proprietario, giocandolo: «il libro carino, ma non lo
rivedo nei livelli successivi», e «una volta che ho risposto non dovrebbe
propormi un'altra storia al posto di sbattermi fuori subito?». Quindi le
storie crescono coi mondi, si aprono lungo l'isola e non solo in fondo, e
dal cartello di fine se ne legge un'altra.

| mondo | pagine | frasi | domande | cosa chiedono |
|---|---|---|---|---|
| prima | 1–2 corte | 6–10 | 3 | un fatto in una frase |
| seconda | 2–3 | 8–15 | 3–4 | chi e cosa su due frasi, «Non si sa» |
| terza | 3 | 10–12 | 4–5 | il perché che si capisce dal tempo, l'ordine |
| quarta, quinta | 3–5 | 15–25 | 4–6 | il perché, l'ordine degli eventi, quello che si capisce senza che sia scritto, vero/falso su più frasi, «Non si sa» |

In quarta e quinta sono **testi veri**: uno dei bambini fa la quinta, e
per lui un racconto di sei frasi non è lettura. Una storia per mondo
almeno si apre **a metà isola**, dopo una tappa di frasi (in quarta e
quinta, che le tappe di frasi non le hanno, dopo una di parole); le
altre più avanti. Lo controlla `unita/inglese-libro`.

Una storia è **scritta a mano** — un inizio, un fatto, una fine — con:

- **variabili** tirate a sorte e coerenti fra loro (il cibo, il posto, il
  tempo, chi fa cosa): non è sempre la stessa storia;
- **frasi a rami** accese da una condizione (se fa caldo giocano in
  giardino, se no in camera);
- **domande in italiano** con risposte in italiano, calcolate dal mondo
  tirato. Le sbagliate sono le versioni che non sono uscite questa volta,
  più quelle scritte in `anche`. «Non si sa» è la risposta quando il testo
  non lo dice: il nonno ha le mucche solo se è lui il contadino.
- **una domanda a scelta ha almeno tre risposte** (con `anche` quando le
  versioni sono due: «cinque / sei» si indovinava una volta su due; il
  controllo lo pretende), il vero/falso ne ha due o tre; **tutte le risposte
  con la maiuscola**, la mette il motore (`domandaIn`);
- **un colpo di scena non si ripete fra storie**: Pip che mangia la torta è
  il giallo di «Chi ha mangiato la torta?», e nelle altre storie mangia
  altro.

## Il formato di una storia

Un file per storia in `dati/capitoli/`, col nome del suo `id`: li raccoglie
da sé `dati/capitoli.js` (`import.meta.glob`), e in Node — dove il glob è
vuoto — il test e lo script leggono la cartella.

```js
export default {
  id, mondo, titolo,
  dopo: 'terza-dove',                               // facoltativo: vedi «Quando si apre»
  variabili: {
    colore: { da: 'colori', fra: ['red', 'blue'] }, // valori di un elenco
    cibo:   { da: 'cibi' },                         // senza fra: tutto il noto alla tappa
    piace:  { fra: [true, false] },                 // valori liberi (anche oggetti con en, it…)
  },
  vincoli: [v => v.cibo.en !== 'cake'],            // facoltativo
  pagine: [                                         // o `frasi: [...]`, che è una pagina sola
    [
      { en: 'He has got {a:colore} hat.', forma: 'has-got' },      // narrazione
      { chi: 'Laura', en: 'Do you like cake, Leo?' },              // una battuta
      { se: v => v.piace, chi: 'Leo', en: 'Yes, I do!' },          // un ramo
      { chi: v => (v.aiuta ? 'mamma' : 'papa'), en: 'Good night!' }, // chi da una variabile
    ],
    [ … ],
  ],
  domande: [
    { testo: 'Che cosa piace a Leo?', risposta: v => v.cibo.ilPl },   // a scelta
    { testo: 'Laura ha un cane?', tipo: 'vf', etichette: ['Sì', 'No'],
      vero: v => (v.cane ? true : null) },                            // null = non si sa
  ],
}
```

Nei modelli: `{x}` è l'inglese, `{x.pl}` il plurale, `{x.campo}` un campo
dell'elenco (o dell'oggetto libero), `{a:x}`/`{A:x}` con l'articolo giusto
(a/an). Le sbagliate sono al massimo tre; una risposta vuota è «Non si
sa». Il testo ha la sua punteggiatura, a differenza delle frasi
componibili. Un tipo di domanda nuovo è una voce di `TIPI_DOMANDA` in
`motore/libro.js`. Le **pagine** si leggono una alla volta; i rami e le
variabili valgono su tutte, e una pagina non resta mai vuota.

**Chi parla lo dice la frase** (`chi`): era prosa di seguito, e non si
capiva chi dicesse cosa. Una frase senza `chi` è narrazione; una con `chi`
sono le parole di **una persona sola** — domanda e risposta sono due
frasi. `chi` è una chiave di `CHI_PARLA` in `dati/elenchi.js` (Laura, Leo,
Tom, Pip, `mamma`, `papa`, `nonna`, `nonno`), che dà anche il nome italiano
da mettere davanti, o una funzione del mondo tirato. Chi racconta di sé al
lettore («Hello! I am Leo. Today is my birthday») è una battuta di quel
personaggio. `racconta` dà per ogni pagina i `blocchi` `{ chi, nome, righe }`:
la narrazione di seguito, e più frasi di fila della stessa persona in una
battuta sola (`blocchiDi`).

Lo script le stampa tutte, come si vedono (una pagina per paragrafo, ogni
battuta a capo col nome):
`node strumenti/inglese/banchi.mjs --capitoli` (o `--capitolo=<id> --max=20`).

## Quando si apre

- **Una storia con `dopo`** si apre quando quella tappa è vinta, come la
  tappa che viene dopo. **Senza `dopo`** vale la tappa prima della 🏁: si
  apre quando la bandiera si può giocare, come il libro di una volta.
  «Sblocca tutti» dei grandi e un mondo passato per età aprono tutto, come
  per le tappe (`storiaAperta` in `motore/storie.js`).
- **Le parole sono quelle note a quella tappa**, non a fine mondo
  (`paroleDelLibro(mondo, tappa)`): una storia a metà isola può usare solo
  le tappe fatte fin lì, e le strutture di prima.
- **Il libro sulla mappa** si apre appena c'è una storia da leggere nel
  mondo; chiuso, dice quale tappa vincere (`cosaServeAlLibro`).

## Quale storia

- Toccato il libro di un mondo, si apre **la prossima storia**: la prima
  non ancora letta fra quelle aperte, nell'ordine in cui si aprono (la
  tappa `dopo`, poi l'`id`); se sono tutte lette, **quella letta da più
  tempo** (`prossimaStoria`).
- **Una storia è letta** quando si arriva al cartello di fine: sta in
  `profile.campagne.inglese.lette = { <id>: <quando> }`, accanto a `vinte`,
  e conta **l'ultima volta** (non la prima, come per le tappe), perché la
  prossima da rileggere è la più vecchia.
- **«Un'altra storia»** (`unAltraStoria`), dal cartello di fine: la prima
  non letta dello stesso mondo; se lì sono tutte lette, la prima non letta
  di un altro mondo aperto, **dal più vicino per anno** (a pari distanza il
  più avanti: da una quinta finita si va alla quarta, non alla prima); se
  non c'è niente di non letto, la meno recente dello stesso mondo, purché
  non sia quella appena letta. Se non c'è niente, il tasto non c'è.

## Le strutture di quarta e quinta

Quarta e quinta non hanno tappe di frasi, ma dichiarano le strutture
dell'anno (`strutture` in `dati/mondi.js`: presente, la *s*, *-ing*, l'ora;
*was / were*, il passato irregolare e in *-ed*). **Il libro è il primo posto
dove le incontrano**, e un bambino di quarta o quinta le fa a scuola:
nei capitoli di quel mondo, e dei mondi dopo, si possono usare
(`formeDelLibro`). Le loro `parole` in `dati/forme.js` sono anche le
parolette che servono a raccontare (*to, with, because, then, every day,
his, her, him, yesterday, last*…), tutte con la loro traduzione in
`dati/glossario.js` o in `data/words.js`. Alle frasi componibili non
cambia niente: `paroleNote` resta com'era.

## Le forme dei verbi

`sconosciute(testo, note, flessioni)` accetta un verbo flesso **solo dove
una struttura del mondo lo ammette**, e solo se la sua base è nota
(`motore/flessioni.js`, `flessione` in `dati/forme.js`):

| forma | struttura | esempi |
|---|---|---|
| `s` | la *s* (quarta) | plays, goes, washes, flies |
| `ing` | *-ing* (quarta) | playing, running, making |
| `ed` | il passato in *-ed* (quinta) | played, danced, cried, clapped |
| `irr` | il passato irregolare (quinta) | went, saw, ate, ran |

- Le forme si **scrivono dalla base** (`flessione`: la *y* che diventa
  *ies*, la *e* che cade, la consonante che raddoppia in una sillaba sola)
  e si ritrovano da lì: una parola a schermo è flessa se è la forma di un
  verbo, mai per somiglianza.
- **Il passato irregolare è una tabella** (`dati/passati.js`), con tutti
  gli irregolari dei verbi noti, non solo quelli che un capitolo usa: un
  irregolare che manca accetterebbe *swimmed*. Da lì anche la trappola
  `passato-in-ed`.
- Oltre ai verbi di `data/verbi.js`, *like*, *do* e *have*
  (`VERBI_DI_STRUTTURA`): arrivano con le forme, e *likes*, *doing*, *had*
  servono.
- **Toccata**, una forma flessa dice la sua base (*went* → «andare (al
  passato)», *playing* → «giocare (-ing: adesso)») e segna la chiave del
  verbo (`verbo:go`), anche per lo SRS (`chiaveDi`). *Cooks* è anche il
  plurale di *cook*: dice tutte e due.

## Le monete

Una domanda giusta paga **🪙4, più uno ogni quattro pagine**
(`pagaDelCapitolo`): 🪙4 fino a tre pagine, 🪙5 da quattro. Misurato a
occhio: una domanda costa ~20 secondi più la lettura che le tocca, ~8
secondi per frase, e le frasi per domanda passano da due (prima) a tre e
mezza (quarta e quinta). Viene 🪙3,6 in prima e ~🪙5 in quinta, e il 🪙4 di
prima era già un po' largo; la storia di quinta da cinque pagine e sei
domande rende 🪙30 in cinque minuti, quello che dice la calibrazione
([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).
Niente premio di fine, niente mezze monete, niente per le sbagliate. I
tocchi a pagamento restano come prima: ogni parola chiesta oltre le
gratuite toglie una domanda.

## Si controlla da sé

`guastiDelCapitolo` in `motore/guasti.js`, su ogni storia e in tutte le
sue varianti: ogni frase si accende, ogni `se` a volte è falso, nessuna
pagina è vuota o lo resta, `dopo` esiste ed è del suo mondo, ogni parola
è nota a quella tappa (con le forme dei verbi ammesse lì) e toccata dice
qualcosa, nessuna frase è sgrammaticata sul numero, ogni domanda si fa e
ha una giusta sola. E chi parla: `chi` è un personaggio di `CHI_PARLA` in
ogni mondo tirato; una battuta con una domanda seguita da *Yes* o *No* sono
due persone; una frase senza `chi` che dice *I, my, we, you…* o sta fra
virgolette è una battuta a cui manca chi. Nei test: `unita/inglese-mondi`
(ogni capitolo) e `unita/inglese-libro` (quante e quanto lunghe, le
pagine, chi parla e i blocchi, quale storia, le forme dei verbi, la paga).
