# English a mondi — il libro

Le storie da leggere dell'inglese a mondi: come sono scritte, quando se ne
apre una, quanto pagano e come si controllano. Come si racconta di più in
quarta e quinta — le parole della storia, le domande «chi», «frase» e
«ordine», le storie a puntate — sta in [libro-racconti.md](libro-racconti.md);
com'è fatto a schermo in [libro-vista.md](libro-vista.md); il resto del
progetto in [mondi.md](mondi.md).

## Tre storie per mondo

Ogni mondo ha **almeno tre storie**, con personaggi che tornano (Laura e suo
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
| quarta, quinta | 3–5 | 15–25 | 4–6 | il perché, l'ordine degli eventi, chi l'ha detto, la frase che lo dice, quello che si capisce senza che sia scritto, «Non si sa» |

In quarta e quinta sono **testi veri**, e **racconti**: un narratore, un
problema, un fatto che cambia le cose, un finale, e i dialoghi dove
servono. Uno dei bambini fa la quinta, e per lui un racconto di sei frasi
non è lettura; dopo aver letto le prime, il giudizio fu «le storie sono
estremamente limitate». Una storia per mondo almeno si apre **a metà
isola**, dopo una tappa di frasi; le altre più avanti. Lo controlla
`unita/inglese-libro`.

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
  il giallo di «Chi ha mangiato la torta?», gli occhiali sulla testa sono
  della maestra, la voce di notte è il pappagallo della nonna.

## Il formato di una storia

Un file per storia in `dati/capitoli/`, col nome del suo `id`: li raccoglie
da sé `dati/capitoli.js` (`import.meta.glob`), e in Node — dove il glob è
vuoto — il test e lo script leggono la cartella. Quello che più puntate
hanno in comune sta in `dati/capitoli/serie/`, che non è un capitolo.

```js
export default {
  id, mondo, titolo,
  dopo: 'terza-dove',                               // facoltativo: vedi «Quando si apre»
  nuove: ['suddenly', 'school'],                    // facoltativo: vedi libro-racconti.md
  serie: 'la-vecchia-mappa', puntata: 2,            // facoltativo: una storia a puntate
  variabili: {
    colore: { da: 'colori', fra: ['red', 'blue'] }, // valori di un elenco
    cibo:   { da: 'cibi' },                         // senza fra: tutto il noto alla tappa
    piace:  { fra: [true, false] },                 // valori liberi (anche oggetti con en, it…)
  },
  vincoli: [v => v.cibo.en !== 'cake'],            // facoltativo
  pagine: [                                         // o `frasi: [...]`, che è una pagina sola
    [
      { riassunto: true, en: 'Last time …' },                      // «Nella puntata prima…»
      { en: 'He has got {a:colore} hat.', forma: 'has-got' },      // narrazione
      { id: 'torta', chi: 'Laura', en: 'Do you like cake, Leo?' }, // una battuta, con un nome
      { se: v => v.piace, chi: 'Leo', en: 'Yes, I do!' },          // un ramo
      { chi: v => (v.aiuta ? 'mamma' : 'papa'), en: 'Good night!' }, // chi da una variabile
    ],
    [ … ],
  ],
  domande: [
    { testo: 'Che cosa piace a Leo?', risposta: v => v.cibo.ilPl },   // a scelta
    { testo: 'Laura ha un cane?', tipo: 'vf', etichette: ['Sì', 'No'],
      vero: v => (v.cane ? true : null) },                            // null = non si sa
    { tipo: 'chi', frase: 'torta' },                                  // chi l'ha detto?
    { tipo: 'frase', testo: 'Che cosa chiede Laura?', frase: 'torta' }, // tocca la frase
    { tipo: 'ordine', fatti: ['Prima', v => `Poi ${v.cibo.it}`, 'Alla fine'] }, // metti in ordine
  ],
}
```

Nei modelli: `{x}` è l'inglese, `{x.pl}` il plurale, `{x.campo}` un campo
dell'elenco (o dell'oggetto libero), `{a:x}`/`{A:x}` con l'articolo giusto
(a/an). Le sbagliate sono al massimo tre; una risposta vuota è «Non si
sa». Il testo ha la sua punteggiatura, a differenza delle frasi
componibili. Un tipo di domanda nuovo è una voce di `TIPI_DOMANDA` in
`motore/libro.js`. Le **pagine** si leggono una alla volta; i rami e le
variabili valgono su tutte, e una pagina non resta mai vuota. L'`id` di una
frase serve solo alle domande che ci rimandano.

**Chi parla lo dice la frase** (`chi`): era prosa di seguito, e non si
capiva chi dicesse cosa. Una frase senza `chi` è narrazione; una con `chi`
sono le parole di **una persona sola** — domanda e risposta sono due
frasi. `chi` è una chiave di `CHI_PARLA` in `dati/elenchi.js` (Laura, Leo,
Tom, Pip, `mamma`, `papa`, `nonna`, `nonno`, e chi serve a una storia:
`maestra`, `dottore`, `contadino`, `pappagallo`…), che dà anche il nome
italiano da mettere davanti, o una funzione del mondo tirato. Chi racconta
di sé al lettore («Hello! I am Leo. Today is my birthday») è una battuta di
quel personaggio. Una voce che il giallo non deve ancora svelare ha il suo
nome (`voce`, «Una voce»): il nome a schermo non deve dire chi è.
`racconta` dà per ogni pagina i `blocchi` `{ chi, nome, righe }`: la
narrazione di seguito, e più frasi di fila della stessa persona in una
battuta sola (`blocchiDi`).

Lo script le stampa tutte, come si vedono (una pagina per paragrafo, ogni
battuta a capo col nome, le parole della storia col segno °, le domande di
ogni tipo): `node strumenti/inglese/banchi.mjs --capitoli` (o
`--capitolo=<id> --max=20`).

## Quando si apre

- **Una storia con `dopo`** si apre quando quella tappa è vinta, come la
  tappa che viene dopo. **Senza `dopo`** vale la tappa prima della 🏁: si
  apre quando la bandiera si può giocare, come il libro di una volta.
  «Sblocca tutti» dei grandi e un mondo passato per età aprono tutto, come
  per le tappe (`storiaAperta` in `motore/storie.js`), tranne l'ordine
  delle puntate: la puntata 2 vuole la 1 letta, sempre.
- **Le parole sono quelle note a quella tappa**, non a fine mondo
  (`paroleDelLibro(mondo, tappa)`), più le parole della storia
  ([libro-racconti.md](libro-racconti.md#le-parole-della-storia)).
- **Il libro sulla mappa** si apre appena c'è una storia da leggere nel
  mondo; chiuso, dice quale tappa vincere (`cosaServeAlLibro`).

## Quale storia

- Toccato il libro di un mondo, si apre **la prossima storia**: la prima
  non ancora letta fra quelle aperte, nell'ordine in cui si aprono (la
  tappa `dopo`, poi l'`id`; le puntate di una serie in fila); se sono
  tutte lette, **quella letta da più tempo** (`prossimaStoria`).
- **Una storia è letta** quando si arriva al cartello di fine: sta in
  `profile.campagne.inglese.lette = { <id>: <quando> }`, accanto a `vinte`,
  e conta **l'ultima volta** (non la prima, come per le tappe), perché la
  prossima da rileggere è la più vecchia.
- **«Un'altra storia»** (`unAltraStoria`), dal cartello di fine: la prima
  non letta dello stesso mondo; se lì sono tutte lette, la prima non letta
  di un altro mondo aperto, **dal più vicino per anno** (a pari distanza il
  più avanti: da una quinta finita si va alla quarta, non alla prima); se
  non c'è niente di non letto, la meno recente dello stesso mondo, purché
  non sia quella appena letta. Mai un'altra puntata della stessa serie:
  quella il cartello la offre a parte, «Puntata 2 →». Se non c'è niente, il
  tasto non c'è.

## Le strutture di quarta e quinta

Quarta e quinta hanno le loro tappe di frasi ([strutture.md](strutture.md)),
e dichiarano anche le strutture dell'anno (`strutture` in `dati/mondi.js`).
**Il libro le sa dalla prima pagina del mondo** (`formeDelLibro`): una
storia a metà isola può usare *went* prima della tappa «Sono andato al
castello», perché un bambino di quarta o quinta le fa a scuola, e una
storia che le usa solo dopo la loro tappa racconterebbe metà anno al
presente. Le parole delle strutture (*to, with, because, then, said, when,
than*…) sono note alla tappa che le insegna, o dall'inizio del mondo se sono
fra le `parole` di una forma dichiarata.

Le storie si aprono dopo una tappa di frasi, così hanno le parole di quella
struttura da note: *said* in «Una voce nella notte» (dopo «Ha detto
ciao»), *when* e *bigger than* nell'ultima puntata della «Vecchia mappa»
(alla 🏁). Una parola di una struttura che arriva più avanti si usa come
parola della storia, fra le `nuove`.

## Le forme dei verbi

`sconosciute(testo, note, flessioni)` accetta un verbo flesso **solo dove
una struttura del mondo lo ammette**, e solo se la sua base è nota
(`motore/flessioni.js`, `flessione` in `dati/forme.js`):

| forma | struttura | esempi |
|---|---|---|
| `s` | la *s* (quarta) | plays, goes, washes, flies |
| `ing` | *-ing* (quarta) | playing, running, making |
| `ed` | il passato in *-ed* (quinta) | played, danced, cried, clapped |
| `irr` | il passato irregolare (quinta) | went, saw, ate, ran, said |
| `er`, `est` | i paragoni (quinta) | bigger, the biggest ([strutture.md](strutture.md#le-forme-flesse-nelle-frasi)) |

- Le forme si **scrivono dalla base** (`flessione`: la *y* che diventa
  *ies*, la *e* che cade, la consonante che raddoppia in una sillaba sola)
  e si ritrovano da lì: una parola a schermo è flessa se è la forma di un
  verbo, mai per somiglianza.
- **Il passato irregolare è una tabella** (`dati/passati.js`), con tutti
  gli irregolari dei verbi noti e di quelli del 📦 che una storia può usare
  (*heard, drove, fell, sat*…): un irregolare che manca accetterebbe
  *swimmed*. Da lì anche la trappola `passato-in-ed`.
- Oltre ai verbi di `data/verbi.js`, *like*, *do* e *have*
  (`VERBI_DI_STRUTTURA`): arrivano con le forme, e *likes*, *doing*, *had*
  servono.
- **Toccata**, una forma flessa dice la sua base (*went* → «andare (al
  passato)», *playing* → «giocare (-ing: adesso)») e segna la chiave del
  verbo (`verbo:go`), anche per lo SRS (`chiaveDi`). *Cooks* è anche il
  plurale di *cook*: dice tutte e due.

## Le monete

Una domanda giusta paga **🪙4, più uno ogni quattro pagine**
(`pagaDelCapitolo`): 🪙4 fino a tre pagine, 🪙5 da quattro, di qualunque
tipo sia. Misurato a occhio: una domanda costa ~20 secondi più la lettura
che le tocca, ~8 secondi per frase, e le frasi per domanda passano da due
(prima) a tre e mezza (quarta e quinta). Viene 🪙3,6 in prima e ~🪙5 in
quinta; la storia di quinta da cinque pagine e sei domande rende 🪙30 in
cinque minuti, quello che dice la calibrazione
([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).
Per questo **le domande restano sei al più** anche dove si è aggiunto un
tipo nuovo: nelle storie che ne avevano già sei, l'ordine ha preso il posto
di «Che cosa è successo prima?». Niente premio di fine, niente mezze
monete, niente per le sbagliate. I tocchi a pagamento restano come prima:
ogni parola chiesta oltre le gratuite toglie una domanda; le parole della
storia sono sempre gratis.

## Si controlla da sé

`guastiDelCapitolo` in `motore/guasti.js`, su ogni storia e in tutte le
sue varianti: ogni frase si accende, ogni `se` a volte è falso, nessuna
pagina è vuota o lo resta, `dopo` esiste ed è del suo mondo, ogni parola
è nota a quella tappa (con le forme dei verbi ammesse lì) o è una parola
della storia, e toccata dice qualcosa; nessuna frase è sgrammaticata sul
numero, ogni domanda si fa e ha una giusta sola. E chi parla: `chi` è un
personaggio di `CHI_PARLA` in ogni mondo tirato; una battuta con una
domanda seguita da *Yes* o *No* sono due persone; una frase senza `chi` che
dice *I, my, we, you…* o sta fra virgolette è una battuta a cui manca chi.
Le regole delle parole della storia, dei tre tipi nuovi e delle puntate
(e `guastiDelleSerie`) sono in [libro-racconti.md](libro-racconti.md#si-controlla-da-sé).
Nei test: `unita/inglese-mondi` (ogni capitolo) e `unita/inglese-libro`
(quante e quanto lunghe, le pagine, chi parla e i blocchi, quale storia, le
forme dei verbi, la paga, le parole della storia, i tipi nuovi, le puntate).
