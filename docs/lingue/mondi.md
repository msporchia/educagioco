# English a mondi — il progetto

Stato: **i primi due mondi si giocano** (29 settembre 2026): motore, dati e
vista. La carta English apre la mappa del tesoro; com'è fatta la vista sta in
[mondi-vista.md](mondi-vista.md), cosa manca in [da-fare.md](da-fare.md).

Sostituisce la campagna in fila di `data/campagna-inglese.js`, dove ogni
tappa portava 42–73 parole nuove e le frasi arrivavano solo all'undicesima:
un blocco mnemonico. Lo spagnolo segue dopo, con lo stesso motore.

## I mondi, non una fila

L'inglese non si monta tutto su sé stesso, quindi la campagna è un **grafo di
mondi** (come Duolingo): ogni mondo insegna un pezzo, e finire certi mondi ne
apre altri. Proposta di partenza (da rifinire costruendola):

| mondo | insegna | parole | si apre dopo |
|---|---|---|---|
| Che cos'è | *it is a …*, *is it …?*, colori, numeri, plurale | animali, colori, 1–10, scuola | — |
| Io e le mie cose | *I like / I don't like*, *have got / has got*, *this is my* | cibo, famiglia, vestiti, corpo | Che cos'è |
| Dove? | *there is / there are*, *where is*, in/on/under… | casa, giocattoli | Che cos'è |
| Cosa sai fare | *can / can't / can you?* | verbi di movimento, sport | Che cos'è |
| La mia giornata | presente con I/you/we, *at* + ora | giorni, verbi di ogni giorno | Io e le mie cose |
| Lui e lei | la *s* della terza persona, *does / doesn't* | mestieri, luoghi | La mia giornata |
| Adesso | *am / is / are + -ing* | mezzi, verbi | La mia giornata |
| Ieri | *was / were*, passato in *-ed* e irregolari | luoghi, verbi | Lui e lei o Adesso |

Ogni mondo ha poche tappe da **8–10 parole nuove + una struttura**, e una 🏁
in fondo. In fondo alla mappa c'è la prova finale.

**La mappa è una mappa del tesoro**: il grafo come quello della mappa del
sotterraneo, su filigrana di pergamena, sentieri tratteggiati, e per ogni
tappa un disegnino stilizzato di quello che insegna. Si disegna con i pittori
(niente emoji come figura principale, vedi `docs/core/grafica.md`).

**Ogni tappa ha un grado di «imparato» da 0 a 10**, calcolato dalla forza
SRS delle sue parole, frasi e strutture (`store/srs.js`): non è un numero da
tenere a mano, e **cala col tempo da solo** come cala la forza. A schermo la
tappa si riempie e, quando scende, sbiadisce. Riprendere una tappa scesa a 8
**riparte dalle domande di quel grado** (i formati adatti a quella forza, le
voci più deboli prima), non da capo. Un grado calato non richiude niente.

Le parole dei dati che non entrano in nessuna tappa stanno nel **📦 cassetto**
del mondo della loro categoria: facoltativo, si apre a tappa vinta, e si gioca
coi formati delle parole di oggi. Nessuna chiave sparisce.

## I formati, decisi dalla forza

Le parole tengono la scala di oggi (figura → ascolto → capisci → produci). Le
frasi salgono di un gradino a ogni punto di forza:

1. **Riconosci** — la frase inglese e quattro italiane (`fraseIt` di oggi).
2. **Cosa vuol dire** — anche qui le italiane sbagliate ricalcano le trappole
   della grammatica («è un cane» / «è un cane?»).
3. **Scegli** — la frase italiana e quattro inglesi: la giusta e tre trappole.
4. **Componi**, a gradini:
   - **completa**: la frase c'è già con dei buchi, le tessere servono solo per
     i buchi;
   - **monta**: solo le tessere giuste, da mettere in ordine;
   - **scegli e monta**: il banco con le parole trappola (una, poi due, poi tre).

Le tessere si **toccano** e vanno in fila, si ritoccano e tornano nel banco:
niente trascinamento. La punteggiatura non è una tessera: la fila mette da sé
la maiuscola e il `?`.

**Forma lunga prima, contratta dopo**: le prime tappe di ogni struttura usano
*it is*, *do not*; le successive *it's*, *don't*. Sono accettate sempre tutte e
due. *Have got* resta, come a scuola.

## Le trappole sono il dato

Una tabella di **errori tipici per struttura** genera le frasi sbagliate, ognuna
col suo perché in una riga (sotto i 70 caratteri): *it is* al posto di *is it*
nella domanda, *she play*, *does he likes*, *I not like*, *a hat red*, *three
dog*, *the* davanti a un nome generico, *he/she*, *have/has*, *can to*, *goed*…
Le trappole scritte a mano (parole vicine: *pen/pencil*) si aggiungono alla
frase, non sono obbligatorie. Le opzioni sbagliate di «scegli», il buco di
«completa» e le tessere in più di «componi» vengono tutte dalle stesse
trappole: una scrittura, tutti i formati.

Una frase componibile ha: `id`, mondo e tappa, `forma` (la struttura), `it`,
`en`, `varianti` accettate, `trappole` a mano, `niente` (regole da non
applicare perché qui darebbero una frase giusta). Le frasi di oggi tengono il
loro `id` (è la chiave SRS).

La chiave **`forma:<id>`** registra le risposte sulla struttura: una forma
debole fa uscire più spesso la sua trappola e ripesca le sue frasi nei mondi
dopo. Una frase composta giusta conta come ripasso delle sue parole **già
scadute** (solo quelle). Uno sbaglio su una parola vicina pesa sulla parola,
uno di grammatica sulla frase e sulla forma.

## Il libro a capitoli

Ogni mondo ha un **mini capitolo di un libro**, con personaggi che tornano
(Laura, Leo, Tom, un cagnolino). Il capitolo è **scritto a mano** — un inizio,
un fatto, una fine — con:

- **variabili** tirate a sorte e coerenti fra loro (il cibo, il posto, il
  tempo, chi è amico di chi);
- **frasi a rami** accese da una condizione (se c'è vento il cappello vola, e
  lo riporta il cane *oppure* Leo);
- **domande in italiano** con risposte in italiano, calcolate dal mondo tirato,
  ognuna con la sua condizione. Le sbagliate sono le versioni che non sono
  uscite questa volta. «Non si sa» è una risposta quando il testo non lo dice.

Usa solo le strutture dei mondi già fatti. Cresce coi mondi: da 4 frasi e una
domanda (fatti in una frase) a 12–15 frasi e tre o quattro domande (chi/cosa
su due frasi, il perché, l'ordine degli eventi, quello che si capisce senza
che sia scritto, vero/falso su più frasi).

## Toccare una parola per sapere cosa vuol dire

Ogni parola inglese a schermo (frase, tessera, capitolo) si tocca e mostra la
traduzione per un paio di secondi.

- **Gratis 3 volte in tutto** finché la parola è nuova (forza bassa).
- Dopo, toccarla fa sì che **quella domanda non paghi**, e lo dice subito
  sull'indicatore delle monete, prima di rispondere. Non costa monete.
- La parola chiesta conta come **non saputa** nello SRS: non si rafforza anche
  se poi la risposta è giusta.
- Nel capitolo, ogni parola chiesta oltre le gratuite toglie il guadagno di
  **una** domanda, non di tutte.

## Sbagliare

Niente si perde, nemmeno alla 🏁: l'errore si spiega (il perché della trappola
più «Si fa così», la regola della struttura) e si aspetta, come nelle domande
del sotterraneo (`docs/apprendimento/la-domanda.md`).

## Chi ha già giocato

Riparte da zero nella fila nuova, ma **le parole sapute restano sapute**: le
chiavi `en:` e `frase:` non si rinominano, quindi le prime tappe le passa in
fretta. Il gioco libero resta a chi l'aveva: «Il gioco di prima», in fondo
alla mappa, per chi aveva finito la campagna vecchia. La campagna vecchia è un
indice in `p.eng` e non si tocca; la nuova sta sotto un nome suo
(`campagne.inglese`), quindi un travaso non serve ([mondi-vista.md](mondi-vista.md#il-posto-del-gioco)).

## Estendibile

Aggiungere varietà vuol dire aggiungere dati, mai toccare il motore:

- un capitolo è un file in una cartella, raccolto da sé (come i moduli di quiz);
- gli elenchi di personaggi, cibi, posti, oggetti sono in comune, con la loro
  traduzione e il mondo da cui sono noti: una parola nuova arricchisce tutti i
  capitoli che la possono pescare;
- un errore tipico nuovo è una riga della tabella delle trappole;
- un tipo di domanda nuovo si scrive una volta e lo usano tutti i capitoli.

**Un test solo controlla tutto**, anche quello che nascerà: una sola risposta
giusta per domanda, ogni ramo raggiungibile, nessuna trappola uguale alla
giusta o a una variante, ogni parola nota nel suo mondo, ogni perché sotto i 70
caratteri. **Uno script stampa** i banchi generati e un capitolo in tutte le
sue varianti, per rileggerli in blocco.

---

# Com'è costruito

Quello che segue è il progetto diventato codice: dove sta cosa, le scelte
prese costruendolo dove il progetto non diceva abbastanza, e l'interfaccia
che la vista userà.

## Dove sta cosa

Tutto in `src/giochi/inglese/`, con la convenzione dei giochi nuovi
([../core/convenzione-giochi.md](../core/convenzione-giochi.md)): `dati/`
sono tabelle, `motore/` gira in Node e non sa di monete né di schermo.
`gioco.js`, `Gioco.vue`, `viste/` e `scena/` sono in [mondi-vista.md](mondi-vista.md).

| file | cosa tiene |
|---|---|
| `dati/mondi.js` | il grafo: i nove mondi, le tappe dei primi due, le categorie dei cassetti, `CHIAVE` |
| `dati/forme.js` | le strutture (`forma:<id>`): parole di struttura e «Si fa così» |
| `dati/trappole.js` | la tabella degli errori tipici, una riga per errore |
| `dati/frasi/<mondo>.js` | le frasi componibili di un mondo (elencate in `dati/frasi.js`) |
| `dati/capitoli/<mondo>.js` | un capitolo del libro per file (raccolti da `dati/capitoli.js`) |
| `dati/elenchi.js` | personaggi, animali, colori, cibi… con le forme italiane |
| `dati/contrazioni.js`, `dati/glossario.js` | forma lunga ↔ contratta; le parole di struttura toccate |
| `motore/testo.js` | parole, contrai/espandi, `accetta`, la fila in bella |
| `motore/lessico.js` | che cos'è una parola (nome, colore, pronome…), plurali, `traduci` |
| `motore/grafo.js` | mondi garantiti, parole note a una tappa, voci di una tappa, cassetto |
| `motore/trappole.js` | le operazioni della tabella, `trappoleDi`, `scegliTrappole` |
| `motore/formati.js` | da una frase tutti i formati (`costruisci`) e il giudizio (`giudica`) |
| `motore/grado.js` | il grado 0–10 e `ripresa` |
| `motore/sessione.js` | una partita a una tappa, alla 🏁 o al cassetto |
| `motore/tocchi.js` | la parola da toccare |
| `motore/mappa.js` | aperto, vinto, finito; `statoMappa` |
| `motore/libro.js` | il libro: variabili, rami, domande |
| `motore/guasti.js` | i controlli su ogni frase e ogni capitolo |

Lo script `node strumenti/inglese/banchi.mjs` stampa i banchi: tutte le
frasi, un mondo (`che-cose`), una tappa, una frase (`m-pen`), o i capitoli
in tutte le varianti (`--capitoli`, `--capitolo=il-picnic --max=20`).

## Le scelte prese costruendolo

Dove il progetto lasciava una scelta aperta, o una cosa scritta sopra non
stava in piedi nel codice, si è presa la variante più vicina:

- **L'avanzamento sta in `profile.campagne.inglese`**, con la forma comune
  (`tappa`, `libera`, `stelle`, `cfg`) più `vinte: { <id tappa>: <quando> }`.
  Il grafo non è una fila, quindi un indice non basta: `tappa` resta il
  numero di tappe vinte (lo leggono le misure dell'albo) e `libera` vuol
  dire prova finale vinta. `p.eng` non si tocca.
- **Il conto dei tocchi gratis sta sull'elemento SRS della parola**
  (`items['en:dog'].tocchi`): è di quella parola, e un contatore per parola
  altrove sarebbe un secondo elenco che cresce.
- **Ogni parola toccata conta come non saputa**, anche con i tocchi gratis:
  il gratis riguarda la paga, non lo SRS. Per una parola nuova (forza 0–1)
  un errore in più non sposta niente.
- **Le parole di struttura** (`is`, `the`, `do`…, `dati/glossario.js`) non
  hanno una chiave SRS sua: si imparano con la forma, e toccarle è sempre
  gratis e non segna niente.
- **Il formato lo decide la forza, e basta**: 0 riconosci, 1 cosa vuol dire,
  2 scegli, 3 completa, 4 monta, 5–6 scegli e monta. La forza si ferma a 6,
  quindi «una, poi due, poi tre» tessere trappola diventa: una a 5, due a 6,
  **tre a 6 quando anche la forma è a 6** (`tessereInPiu`).
- **Riconosci e cosa vuol dire** differiscono nelle sbagliate: la prima
  prende l'italiano di altre frasi della tappa, la seconda quello delle
  trappole che hanno un senso in italiano (la domanda girata «è un cane?»,
  mio/tuo, lui/lei, il «non» tolto), e riempie con le altre frasi.
- **La tabella delle trappole è fatta di righe che nominano
  un'operazione** (`fa`, coi parametri in `con`). Un errore che somiglia a
  uno che c'è è una riga (`can-to` è `inserisci` con `to` dopo `can`); un
  errore di specie nuova è un'operazione nuova in `motore/trappole.js`.
  Ogni riga porta un `esempio` e il test lo rifà: le righe dei mondi che
  non ci sono ancora (can to, she play, does he likes, goed) sono già
  provate.
- **Su cosa pesa uno sbaglio** lo dice la riga (`pesa`): le trappole di
  grammatica su frase e forma (la forma della riga, o quella della frase),
  le parole vicine sulla parola. Aver preso in «riconosci» l'italiano di
  un'altra frase pesa solo sulla frase.
- **Le parole vicine si generano da sole** (`parola-vicina`: un nome o un
  colore della frase scambiato con uno della stessa categoria già noto) e
  riempiono quando le trappole di grammatica non bastano; quelle scritte a
  mano nella frase (`trappole: [{ en, it, perche, parola }]`) escono prima.
- **Contratta o lunga lo dice la tappa** (`contratta: true`), non la
  struttura: la prima tappa di una forma è lunga, le dopo contratte. Le
  frasi nei dati sono sempre lunghe.
- **Il «?» nelle opzioni inglesi non c'è** (la regola di
  [vocaboli.md](vocaboli.md): la domanda si riconosce dall'ordine); lo
  mette la fila composta, con la maiuscola (`inBella`, `rigaInBella`).
- **Il mondo da cui una parola degli elenchi è nota non si scrive**: lo
  ricava il grafo (`paroleNote`), così una parola che entra in una tappa
  arriva da sola a tutti i capitoli che la possono pescare.
- **I mondi 3–9 sono già nel grafo, senza tappe**: la mappa li può
  disegnare «in arrivo» e le categorie di `words.js` hanno già il loro
  cassetto. Scelte: gli aggettivi (`j`) a «Che cos'è», sport e giocattoli
  (`g`) e i verbi a «Cosa sai fare», natura (`w`) e mezzi (`t`) ad
  «Adesso»; le parole di struttura (`q`) non hanno cassetto. «Lui e lei o
  Adesso» si scrive `dopoUno`, e le parole note dopo un «o» sono quelle
  comuni ai due rami. La prova finale è un mondo (`prova-finale`).
- **Il cassetto si apre alla prima tappa vinta del mondo.**
- **Il grado** è `floor(10 × media(min(forza, 4) / 4))` su parole, frasi e
  forma della tappa; la 🏁 fa la media di tutto il mondo.
- **La sessione**: il primo giro passa ogni voce una volta, dalla più
  debole (a pari forza le parole prima delle frasi); poi pesca col picker
  di `store/srs.js`. Finisce a `min(20, voci + 4)` risposte giuste, e
  sbagliando non si perde niente. Alla 🏁 il primo giro è di 16. Tre frasi
  di una forma debole (forza < 2) dei mondi già fatti entrano nel giro.
- **Gli `id` nuovi cominciano con `m-`**; dove la frase c'era già in
  `data/frasi.js` si è tenuto il suo `id`, e il test pretende che sia la
  stessa frase (`e-cat-1`, `d-like-pizza`, `e-have-dog`…).
- **La portata delle tappe** (12–23) è scritta ma nessuno la legge ancora.

## Il libro: il formato di un capitolo

```js
export default {
  id, mondo, titolo,
  variabili: {
    colore: { da: 'colori', fra: ['red', 'blue'] }, // valori di un elenco
    cibo:   { da: 'cibi' },                         // senza fra: tutto il noto del mondo
    piace:  { fra: [true, false] },                 // valori liberi
  },
  vincoli: [v => v.cibo.en !== 'cake'],            // facoltativo
  frasi: [
    { en: 'He has got {a:colore} hat.', forma: 'has-got' },
    { se: v => v.piace, en: 'Yes, I do!' },         // un ramo
  ],
  domande: [
    { testo: 'Che cosa piace a Leo?', risposta: v => v.cibo.ilPl },   // a scelta
    { testo: 'Laura ha un cane?', tipo: 'vf', etichette: ['Sì', 'No'],
      vero: v => (v.cane ? true : null) },                            // null = non si sa
  ],
}
```

Nei modelli: `{x}` è l'inglese, `{x.pl}` il plurale, `{x.campo}` un campo
dell'elenco, `{a:x}`/`{A:x}` con l'articolo giusto (a/an). Le sbagliate
sono le risposte degli altri mondi possibili più quelle in `anche`, al
massimo tre; una risposta vuota è «Non si sa». Il testo del capitolo ha la
sua punteggiatura, a differenza delle frasi componibili. Un tipo di
domanda nuovo è una voce di `TIPI_DOMANDA` in `motore/libro.js`.

## L'interfaccia per la vista

Tutto puro; la vista tiene lo stato reattivo e scrive il profilo.

**La mappa.** `c = progresso(CHIAVE)` (da `giochi/campagne.js`), poi
`statoMappa(c, forzaDi)` → per mondo `{ id, nome, insegna, dopo, dopoUno,
pronto, aperto, finito, tappe: [{ id, nome, disegno, bandiera, aperta,
vinta, grado }], cassetto: { aperto, chiavi } }`, con `forzaDi =
strengthOf` di `store/profile.js`. `disegno` è il nome del disegnino della
tappa per i pittori.

**Una partita.**
```js
const s = new Sessione({ tappa: tappaDi(id) /* o cassettoDi(mondo) */,
                         itemDi: item, haVoce: p => haVoce(p, 'en') })
const d = s.prossima()                    // la domanda
const t = new Tocchi({ itemDi: item })    // uno per domanda
t.tocca('dog')                            // { it, gratis, chiave }: se !gratis, «questa non paga»
const e = s.rispondi(d, risposta, { tocchi: t })
e.registra.forEach(r => answer(r.chiave, { correct: r.correct }))
if (e.paga) …                             // quanto, lo decide la vista (calibrazione.md)
if (s.finita) segnaVinta(c, id)           // vero la prima volta: il premio grosso
```
- `d.genere === 'parola'`: è il turno di `data/domande.js` di sempre
  (`d.tipo`, `d.domanda`, `d.opzioni`); si risponde con l'opzione toccata.
- `d.genere === 'frase'`: `d.formato` è `riconosci`, `senso` o `scegli`
  (con `d.opzioni`: si risponde con l'opzione), oppure `completa`, `monta`,
  `scegliMonta` (con `d.tessere` `{ id, testo }`, e per `completa` anche
  `d.righe`, fatte di `{ testo }` e `{ buco: n }`: si risponde con gli id
  delle tessere nell'ordine della fila, per `completa` nell'ordine dei
  buchi). `rigaInBella(d, ids)` è la fila come va scritta a schermo;
  `d.domanda` è `{ testo, lingua: 'en' | 'it' }`.
- L'esito sbagliato porta `perche` (una riga, o null se lo sbaglio non è
  una trappola nota), `siFa` (la regola della forma) e `giustaEra`.

**Il capitolo.** `CAPITOLI` da `dati/capitoli.js`, `capitoliDi(CAPITOLI,
mondo)`, poi `capitolo(cap)` → `{ titolo, righe: [{ en }], domande: [{
testo, opzioni: [{ testo, giusta }], giusta }] }`. Un `Tocchi` per tutto il
capitolo; una domanda giusta paga quando si risponde, finché
`domandeCheLPagano(giuste, t.aPagamento)` supera quelle già pagate.

Nei test: `unita/inglese-mondi`, senza browser. La vista e i suoi bersagli
`data-…`: [mondi-vista.md](mondi-vista.md#nei-test).
