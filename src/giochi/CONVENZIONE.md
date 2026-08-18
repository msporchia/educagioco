# Come è fatto un gioco

Questa cartella è la casa dei giochi scritti con la convenzione nuova. Il
primo è `codice-segreto/`: **è il calco**, e chi ne aggiunge uno copia quella
struttura invece di inventarne un'altra.

I giochi vecchi stanno ancora in `src/views/` e sono fatti in altri quattro
modi diversi: un file solo da duemila righe, i dati sparsi in `src/data/`, un
campo dedicato nel profilo per ognuno. Non è un modello da seguire — è il
motivo per cui questa convenzione esiste.

## La regola sola

**Ogni pezzo sa una cosa e non sa le altre.** Se un file ha bisogno di sapere
insieme che 🐶 vale un pallino verde *e* che quel pallino è un `<div>` di
diciannove pixel *e* che vincere dà tre monete, quel file è tre file.

## La struttura

```
src/giochi/<nome-gioco>/
  gioco.js          il manifesto: l'UNICA porta verso il resto dell'app
  dati/             dato puro: tabelle, nessuna funzione che gioca
  motore/           il calcolo: classi pure, girano in Node, zero DOM e zero Vue
  scena/            il disegno imperativo: canvas e animazioni, zero regole
  viste/            i componenti Vue di una schermata sola
  Gioco.vue         il coordinatore: mette insieme i pezzi e parla col profilo
  stile.css         l'aspetto, tutto sotto un prefisso suo
```

### `gioco.js` — il manifesto

Chiave, nome, icona, componente, quante tappe. È l'unico file che `App.vue`,
la home e la schermata dei genitori importano: aggiungere un gioco non deve
voler dire mettere le mani in cinque file dell'applicazione.

**Come si presenta in home**, e sono tre campi che vanno insieme:

- `che` — *cosa insegna*, in una riga breve (`'euro, centesimi e resto'`).
  Sta sulla carta sotto il nome, quindi invita e non spiega: se serve una
  subordinata è troppo lungo, e il posto di quella spiegazione sono i
  traguardi. Non ci va il nome del gruppo — il gruppo sta scritto sopra la
  carta, e ripeterlo (`'logica: dedurre…'`) ruba mezza riga.
- `area` — *di cosa parla*, e decide **in quale gruppo compare la carta**:
  una delle chiavi di `src/data/aree.js`. Senza, il gioco non finisce in
  nessun gruppo e **sparisce dalla home** senza dare errore.
- `come` — *che tipo di gioco è* (`domande`, `pensare`, `riflessi`,
  `strategia`, `fare`): una delle chiavi di `MODI`, sempre in `aree.js`.

`test/unita/aree.test.mjs` diventa rosso se uno dei due manca o cita una
chiave che non esiste. Facoltativi: `tinta` (lo sfondo della carta, che i
giochi nuovi portano con sé perché non hanno una riga di CSS dedicata) e
le **due estremità della scala**, `piccoli: true` e `grandi: true`.

`piccoli` mette l'etichetta per la fascia dei quattro-sei anni: consegna
iconica, niente da leggere, non si può perdere. `grandi` dice il
contrario — questo gioco dà per scontato che il bambino legga da solo, o
la matematica delle classi alte. Chi non dichiara né l'uno né l'altro sta
in mezzo, ed è il caso normale.

Non sono interruttori: le legge `src/data/partenze.js`, che al momento in
cui un bambino si aggiunge accende il set giusto senza che nessuno debba
tenere a mano un elenco di cosa va bene a che età. Sbagliarle non dà
errore da nessuna parte — si vede solo il giorno che un bambino di sei
anni si trova in home un gioco che non sa aprire, o non trova quello che
saprebbe giocare.

### `dati/` — il dato

Tabelle e basta: temi, scaglioni di difficoltà, tappe. Nessun `import` di
motore, scena o Vue. **La difficoltà si dichiara qui**, non si sparge nel
codice: chi vuole un livello nuovo aggiunge una riga.

Ogni file di dati esporta anche una funzione `guasti…()` che si controlla da
sola — chiavi doppie, riferimenti a roba che non esiste, numeri impossibili —
e il test unitario la fa girare. Un dato sbagliato deve diventare rosso in un
secondo, non una schermata bianca sul telefono di un bambino.

### `motore/` — il calcolo

Le regole del gioco, a classi, **senza schermo**: non tocca un elemento del
DOM, non importa Vue, non sa cosa sia una moneta. Gira uguale nel browser e in
Node, e questo è l'unico motivo per cui la difficoltà si può *misurare*
invece di provarla a occhio (vedi `motore/banco.js`, il giocatore finto).

Il caso si passa da fuori (`rnd = Math.random`): una partita si deve poter
rifare identica, o il test racconta ogni volta una storia diversa.

### `scena/` — il disegno

Quello che il template non sa esprimere: un canvas, una coreografia a tempo,
un pezzo che vola da un punto a un altro. Classi con `avvia()` e `ferma()`,
che ricevono l'elemento su cui lavorare e **non conoscono le regole**: chi
disegna riceve fatti già decisi (`tipo: 'pieno'`), non li calcola.

### `viste/` — i componenti

Una schermata per file, `props` in ingresso ed `emit` in uscita. Non toccano
il profilo, non chiamano il motore: ricevono quello che devono mostrare.

### `Gioco.vue` — il coordinatore

L'unico file del gioco che sa che esistono le monete, i contatori e
l'avanzamento salvato. Tiene lo stato reattivo, decide quale schermata è in
scena, e passa da `src/giochi/campagne.js` per salvare. Se domani il profilo
cambia forma, si cambia lì e nessun gioco se ne accorge.

## L'avanzamento

Un gioco **non aggiunge un campo suo al profilo**. I giochi vecchi l'hanno
fatto — `td`, `mate`, `calc`, `eng`, `esp`, `mercato`, `lab`, `gen`: otto
campi che dicono la stessa cosa in otto posti — e ogni gioco nuovo era una
migrazione in più. Qui si passa da `src/giochi/campagne.js`, che tiene tutto
sotto `profile.campagne[<chiave>]` con una forma sola:

```js
{ tappa: 0, libera: false, stelle: {}, cfg: {} }
```

`tappa` è quante tappe sono state superate (l'indice della prossima),
`stelle` è il primato per tappa, `cfg` è quello che il bambino ha scelto e
va ricordato (la difficoltà del gioco libero, per dire).

## I traguardi e l'esperienza

Un gioco **non scrive i propri traguardi in `data/traguardi.js`** e non aggiunge
la propria riga a `XP_AREA` in `store/progressi.js`. Nei giochi vecchi quelle
tre cose stanno in tre posti lontani fra loro, e sbagliarne una dà un'area a
0/5 nell'albo o un traguardo che nessuno può prendere — senza che niente
diventi rosso.

Qui è **il gioco a presentarsi**, con un blocco `albo` nel manifesto:

```js
albo: {
  area:      { nome, emoji },                    // la famiglia nell'albo
  xp:        m => numero,                        // quanto vale in esperienza
  provato:   m => vero/falso,                    // per il traguardo «Tuttofare»
  materia:   { prefisso, nome, emoji, totale },  // solo se insegna elementi SRS
  traguardi: [{ id, emoji, nome, come, soglie, valore }],
}
```

Li raccoglie `src/giochi/albo.js`, e `data/traguardi.js` e `store/progressi.js`
li accodano ai propri senza sapere che gioco sia. L'`id` dell'area è la chiave
del gioco e non si dichiara: così non può essere diversa da quella con cui il
gioco si registra altrove.

Le misure che i `valore:` leggono sono quelle di tutti (`m.tot`, `m.best`) più
le tre che ogni campagna ha per forza — `m.tappeDi(chiave)`,
`m.stelleDi(chiave)`, `m.finita(chiave)` — che leggono `profile.campagne` e
valgono uguali per qualunque gioco nuovo. Nessun gioco aggiunge una misura sua.

**Le soglie di «Tuttofare» non si alzano** quando arriva un gioco nuovo: la
medaglia mostrata si ricalcola ogni volta, e chi ha l'oro se lo vedrebbe
tornare indietro sotto gli occhi.

## La campagna

L'ingresso di un gioco è una campagna a tappe, come il castello: si comincia
da una fila di partite facili, poi normali, poi toste. Una tappa non è un
livello nuovo del motore — è **lo stesso motore con altri numeri e un altro
vestito**. Cambiare il vestito a ogni tappa (altri disegni, altro colore) non
è decorazione: è quello che fa sembrare un percorso una fila di posti diversi
invece della stessa schermata nove volte.

## I test

Un gioco nuovo porta un test di unità che gira senza browser
(`test/unita/<nome>.test.mjs`) e prova tre cose:

1. **i dati stanno in piedi** — le funzioni `guasti…()` non trovano niente,
   `guastiDellAlbo()` compreso
2. **il calcolo è giusto** — soprattutto i casi in cui è facile sbagliarsi
3. **le tappe si vincono** — giocate davvero dal giocatore finto, non a occhio
4. **i traguardi scattano** — a profilo finito si prendono tutti, a profilo
   vuoto nessuno. Un traguardo che nessuno può prendere non si vede da
   nessuna parte, e senza questo controllo non se ne accorge nessuno

Se una tappa la vince solo la fortuna, si vede qui e non dal muso lungo di un
bambino.
