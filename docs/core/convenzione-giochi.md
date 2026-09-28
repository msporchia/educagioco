# Come è fatto un gioco

La convenzione di `src/giochi/`: le cartelle di un gioco, il manifesto,
dove sta l'avanzamento, i traguardi e i test che un gioco nuovo porta.

- **`src/giochi/` è la casa dei giochi nuovi.** Il calco è
  `src/giochi/codice-segreto/`: chi aggiunge un gioco copia quella
  struttura invece di inventarne un'altra.
- **`src/views/` non è un modello.** I giochi vecchi sono fatti in quattro
  modi diversi (un file da duemila righe, dati sparsi in `src/data/`, un
  campo nel profilo per ognuno): sono il motivo per cui la convenzione
  esiste.

## La regola sola

**Ogni pezzo sa una cosa e non sa le altre.** Un file che deve sapere
insieme che 🐶 vale un pallino verde, che il pallino è un `<div>` di
diciannove pixel e che vincere dà tre monete sono tre file.

```
src/giochi/<nome-gioco>/
  gioco.js     il manifesto: l'UNICA porta verso il resto dell'app
  dati/        dato puro: tabelle, nessuna funzione che gioca
  motore/      il calcolo: classi pure, girano in Node, zero DOM e zero Vue
  scena/       il disegno imperativo: canvas e animazioni, zero regole
  viste/       i componenti Vue di una schermata sola
  Gioco.vue    il coordinatore: mette insieme i pezzi e parla col profilo
  stile.css    l'aspetto, tutto sotto un prefisso suo
```

- **`dati/`** — tabelle e basta (temi, scaglioni, tappe), nessun `import`
  di motore, scena o Vue. **La difficoltà si dichiara qui**: un livello
  nuovo è una riga. Ogni file esporta una `guasti…()` che si controlla da
  sola (chiavi doppie, riferimenti inesistenti, numeri impossibili), e il
  test la fa girare: un dato sbagliato è rosso in un secondo, non una
  schermata bianca su un telefono.
- **`motore/`** — le regole, a classi, **senza schermo**: niente DOM,
  niente Vue, non sa cos'è una moneta. Gira uguale in Node, ed è l'unico
  motivo per cui la difficoltà si **misura** invece di provarla a occhio
  (`motore/banco.js`, il giocatore finto). Il caso si passa da fuori
  (`rnd = Math.random`): una partita si deve poter rifare identica.
- **`scena/`** — quello che il template non sa dire: canvas, coreografie a
  tempo. Classi con `avvia()` e `ferma()` che ricevono l'elemento e **non
  conoscono le regole**: ricevono fatti già decisi (`tipo: 'pieno'`).
- **`viste/`** — una schermata per file, `props` dentro ed `emit` fuori.
  Non toccano il profilo, non chiamano il motore.
- **`Gioco.vue`** — l'unico file del gioco che sa di monete, contatori e
  salvataggi. Tiene lo stato reattivo, sceglie la schermata e salva
  passando da `src/giochi/campagne.js`: se il profilo cambia forma, si
  cambia lì e nessun gioco se ne accorge. **I contatori non si toccano a
  mano**: si usano `segna()` e `segnaBest()` di `src/store/profile.js`.
  Se il gioco ha un orologio, la pausa non si scrive in casa: vedi
  [interfaccia.md](interfaccia.md#la-pausa-una-sola).

## Il manifesto, `gioco.js`

Chiave, nome, icona, componente, quante tappe. È l'unico file che
`App.vue`, la home e la schermata dei grandi importano.

**Un gioco nuovo si registra in due file**: `src/giochi/indice.js`
(manifesti puri, l'ordine è quello delle carte in home) e
`src/giochi/schermate.js` (i `.vue`, letto solo da `App.vue`). Sono due
catene di import diverse: `data/giochi.js` ha bisogno dei nomi, e
importando i `.vue` si tirerebbe dietro mezza applicazione — un anello
di import è un guasto che si presenta mesi dopo.

**Come si presenta in home**, tre campi che vanno insieme:

- `che` — *cosa insegna*, una riga breve (`'euro, centesimi e resto'`).
  Invita, non spiega: se serve una subordinata è troppo lungo (la
  spiegazione va nei traguardi). Non ripete il gruppo, che è già scritto
  sopra la carta.
- `area` — *di cosa parla*: una chiave di `src/data/aree.js`, e decide in
  quale gruppo compare la carta. **Senza, il gioco sparisce dalla home**
  senza dare errore.
- `come` — *che tipo di gioco è* (`domande`, `pensare`, `riflessi`,
  `strategia`, `fare`): una chiave di `MODI` in `aree.js`.

`test/unita/aree.test.mjs` è rosso se `area` o `come` mancano o citano una
chiave che non esiste.

Facoltativi: `tinta` (lo sfondo della carta: i giochi nuovi non hanno una
riga di CSS dedicata) e le bandierine della scala d'età, che non sono
interruttori ma le legge `src/data/partenze.js` quando si aggiunge un
bambino:

- `piccoli: true` — fascia quattro-sei anni: consegna iconica, niente da
  leggere, non si può perdere.
- `grandi: true` — dà per scontato che il bambino legga da solo, o la
  matematica delle classi alte. Né l'uno né l'altro è il caso normale.
- `cresce: true`, accanto a `piccoli` — comincia dai piccoli e non finisce
  lì (Passo passo): le partenze dei grandi non lo spengono, e fin dove
  arriva lo dice la portata delle tappe.

Sbagliarle non dà errore: si vede solo il giorno che un bambino di sei
anni trova in home un gioco che non sa aprire. Gli altri campi letti
dall'età e dai saperi (`posto`, `quiz`, `chiede`, `serve`, `perMerito`,
`sperimentale`) sono spiegati in [`../genitori/`](../genitori/); il blocco
`senzaFine` in [primati.md](primati.md).

## L'avanzamento

**Un gioco non aggiunge un campo suo al profilo.** I giochi vecchi l'hanno
fatto (`td`, `mate`, `calc`, `eng`, `esp`, `mercato`, `lab`, `gen`), e ogni
gioco era una migrazione in più. Qui tutto sta in
`profile.campagne[<chiave>]`, scritto solo da `src/giochi/campagne.js`:

```js
{ tappa: 0, libera: false, stelle: {}, cfg: {} }
```

- `tappa` — quante tappe superate (l'indice della prossima);
- `libera` — la campagna è finita, il gioco libero è aperto;
- `stelle` — il **primato** per tappa, non la somma: rigiocare non gonfia,
  e una partita storta non toglie una stella già presa;
- `cfg` — quello che il bambino ha scelto e va ricordato;
- `aiuti`, `primato`, `primati` — solo in chi ha una scala del 💡
  ([aiuti.md](aiuti.md)) o una sfida senza fine ([primati.md](primati.md)).

La forma la mette a posto chi legge (`progresso(chiave)`): un profilo di
ieri non ha bisogno di migrazioni per un gioco che ieri non c'era.

## I traguardi e l'esperienza

Un gioco **non scrive i suoi traguardi in `data/traguardi.js`** e non
aggiunge la sua riga a `XP_AREA` in `store/progressi.js`: tre posti
lontani, e sbagliarne uno dà un'area a 0/5 nell'albo o un traguardo
impossibile senza che niente diventi rosso. Si presenta il gioco, col
blocco `albo` del manifesto:

```js
albo: {
  area:      { nome, emoji },                    // la famiglia nell'albo
  xp:        m => numero,                        // quanto vale in esperienza
  provato:   m => vero/falso,                    // per il traguardo «Tuttofare»
  materia:   { prefisso, nome, emoji, totale },  // solo se insegna elementi SRS
  traguardi: [{ id, emoji, nome, come, soglie, valore }],
}
```

Li raccoglie `src/giochi/albo.js`, e `data/traguardi.js` e
`store/progressi.js` li accodano senza sapere che gioco sia. L'`id`
dell'area è la chiave del gioco e non si dichiara, così non può divergere.

I `valore:` leggono le misure di tutti (`m.tot`, `m.best`) più le tre di
ogni campagna — `m.tappeDi(chiave)`, `m.stelleDi(chiave)`,
`m.finita(chiave)`. **Nessun gioco aggiunge una misura sua.**

**Le soglie di «Tuttofare» non si alzano** quando arriva un gioco nuovo: la
medaglia si ricalcola, e chi ha l'oro se lo vedrebbe tornare indietro.

## La campagna

L'ingresso di un gioco è una campagna a tappe: facili, poi normali, poi
toste. Una tappa è **lo stesso motore con altri numeri e un altro
vestito**, e cambiare il vestito (disegni, colore) non è decorazione: fa
sembrare il percorso una fila di posti diversi e non la stessa schermata
nove volte.

## I test

Un gioco nuovo porta `test/unita/<nome>.test.mjs`, senza browser, che
prova:

1. **i dati stanno in piedi** — le `guasti…()` non trovano niente,
   `guastiDellAlbo()` e (se c'è `senzaFine`) `guastiDelleSfide()` compresi;
2. **il calcolo è giusto** — soprattutto dove è facile sbagliarsi;
3. **le tappe si vincono** — giocate dal giocatore finto, non a occhio: se
   una tappa la vince solo la fortuna si vede qui;
4. **i traguardi scattano** — a profilo finito si prendono tutti, a
   profilo vuoto nessuno: un traguardo impossibile non si vede altrove.
