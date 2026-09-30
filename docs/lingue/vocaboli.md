# English ed Español: il gioco e i vocaboli

Un gioco solo per due lingue: i modi di chiedere, come si sceglie quello
giusto per una parola, e cosa cambia fra inglese e spagnolo. La pronuncia
sta in [voce.md](voce.md).

## Un gioco, due lingue

- **Lo stesso file per tutte e due** (`src/views/LinguaGame.vue`): stesse
  tredici tappe, stessi otto modi di chiedere. Quello che cambia sta in
  `src/data/lingue.js` — la campagna, il nome, dove segnare i progressi.
  Una terza lingua è tre file di dati e una voce in quella tabella.
- **Le campagne**: `src/data/campagna-inglese.js`,
  `src/data/campagna-spagnolo.js` (la forma comune in
  `src/data/campagna-lingua.js`). I contenuti: `words.js`, `verbi.js`,
  `frasi.js` per l'inglese, `parole-es.js`, `verbi-es.js`, `frasi-es.js`
  per lo spagnolo, `lessico.js` per leggerli (`voceDi`).
- **Le due lingue non si mescolano mai.** Chiavi separate (`en:dog` contro
  `es:perro`), campagne separate nel profilo, contatori separati,
  traguardi separati, e i distrattori di una domanda escono sempre dalla
  stessa lingua. Sapere «gatto» in inglese non vuol dire saperlo in
  spagnolo, e il motore non deve crederlo.
- **Gli id non si rinominano** (`en:dog`, `frase:…`): sono le chiavi dello
  stato del motore, e cambiarli fa tornare una parola «mai vista».
- **Chi giocava prima della campagna** la trova aperta fin dove arrivava
  (`allineaInglese` in `src/store/profile.js`).
- **Una parola giusta vale 🪙1, pagata subito** (`PAGA.parola` in
  `src/data/paghe.js`, lo stesso tasso delle parole dell'inglese a mondi),
  nella campagna e nel gioco libero; ogni dieci giuste un cartello dice
  quante ne sono entrate. Niente premio di tappa e niente moltiplicatore
  di livello: c'erano (`livello × (2 + tappa/2)` alla prima vittoria, una
  di cortesia dopo, `livello` ogni dieci nel libero) e facevano rendere la
  stessa parola il triplo a chi aveva giocato di più altrove
  ([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).
- **Prima le parole che somigliano all'italiano** (`ordine` in
  `LinguaGame.vue`, per bigrammi in comune): sono regali, e cominciare con
  un regalo tiene dentro. Le frasi vanno in fondo.

## I modi di chiedere

Il meccanismo è uno — un bersaglio, alcune risposte, si tocca quella
giusta — e la progressione sta in cosa c'è nel bersaglio e nei bottoni
(`TIPI`, `scegliTipo`, `componi` in `src/data/domande.js`):

| tipo | bersaglio | risposte | quando |
|---|---|---|---|
| guarda | `dog` | sei figure | subito |
| capisci | `dog` | cinque parole italiane | quando la riconosce |
| ascolta | 🎧 | sei figure | quando la riconosce |
| produci | `cane` | cinque parole inglesi | quando la sa |
| ascolta e capisci | 🎧 | cinque parole italiane | quando la sa |
| frase | `where is my teacher` | quattro frasi italiane | subito |
| frase al contrario | `dov'è la mia maestra?` | quattro frasi inglesi | quando la riconosce |
| il buco | `the cat ___ black` | is · are · am · be | quando la riconosce |

- **Il tipo non lo decide la tappa, lo decide la forza di quella parola**
  nel motore (0..1 appena conosciuta, 4+ imparata, la soglia `masterS`).
  Così la difficoltà segue chi gioca invece del calendario.
- **Il testo è una stampella, e si toglie strada facendo.** Chiedere `dog`
  a orecchio il primo giorno è una domanda a caso; mostrarlo scritto per
  sempre vuol dire non allenare mai l'orecchio.
- **Il ripasso arriva quasi sempre senza testo**: una parola imparata esce
  dal giro e torna settimane dopo con la forza ancora alta, quindi a voce
  o partendo dall'italiano.
- **Una parola senza clip non rompe niente**: quel turno si legge e basta,
  e le domande in ascolto per lei non escono (`haVoce`).
- **Due figure della stessa famiglia visiva non stanno nella stessa
  domanda** (`conFamiglia` in `src/data/domande.js`), e due opzioni
  identiche a schermo sarebbero due risposte giuste. La regola sulle
  icone sta in [../prima-dopo/disegni.md](../prima-dopo/disegni.md).

## L'inglese

- **Le frasi inglesi si scrivono senza punto di domanda.** Con il `?`,
  capire che «is this a cat» è una domanda sarebbe guardare l'ultimo
  carattere; senza, bisogna aver capito che in inglese la domanda si fa
  girando il verbo. Il `?` sta solo nelle risposte italiane («questo è un
  gatto» e «questo è un gatto?»), ed è lì la scelta.

## Lo spagnolo

- **È difficile in punti diversi**, e le dritte delle tappe e i **buchi**
  sono lì (dodici buchi su ser/estar, gli altri su articoli, concordanza e
  `tener`):

| | | l'errore che si fa |
|---|---|---|
| **ser / estar** | due verbi per un «essere» | *soy cansado* invece di `estoy cansado` |
| **il genere** | se lo portano dietro articolo e aggettivo | *la casa blanco*, e `la leche`, `el agua` |
| **tener** | fame, sete, freddo e anni si HANNO | *soy hambre* invece di `tengo hambre` |
| **gustar** | funziona al rovescio | *yo gusto el chocolate* invece di `me gusta el chocolate` |

- **I falsi delle frasi sono errori veri**, quelli che si fanno davvero:
  mai frasi che in America latina suonerebbero giuste.
- **Le domande si scrivono con i due segni** (`¿dónde está mamá?`):
  toglierli vorrebbe dire insegnare a scrivere male. Ne segue una regola
  per i dati: **i falsi di una domanda sono domande anche loro**, se no la
  giusta si riconosce dal `¿` (`unita/spagnolo` lo verifica).
- **Lo spagnolo è quello di casa, boliviano**: `papa` e non `patata`,
  `palta`, `durazno`, `frutilla`, `auto`, `celular`, `jugo`, `lentes`. Le
  parole che i bambini sentiranno davvero.

Nei test: `unita/inglese`, `unita/spagnolo`, `integrazione/inglese`,
`integrazione/spagnolo` (una moneta a parola giusta: `[data-monete-prese]`
sul cartello di fine tappa, `[data-nota-monete]` col salvadanaio stanco).

## Formato dei dati

- **Le parole** (`words.js`, `parole-es.js`): ogni voce è
  `[straniero, italiano, emoji, categoria, famiglia?]`. Niente emoji o
  parola ripetuta nella stessa lingua — i distrattori figurati escono
  dalla stessa categoria, e un doppione sarebbe due risposte giuste.
  L'emoji resta vuota (`''`) quando non esiste un'icona che sia
  davvero la cosa, non solo quella che le somiglia di più: quella voce
  semplicemente non esce nelle domande figurate. Il quinto campo,
  `famiglia`, si scrive solo dove due emoji si confondono a colpo
  d'occhio (facce, mestieri): `domande.js` non ne pesca due della
  stessa famiglia nella stessa domanda (`unita/lessico-icone`). Lo
  spagnolo riusa le emoji e le famiglie dell'inglese, voce per voce.
- **I verbi** (`verbi.js`, `verbi-es.js`): `[straniero, italiano,
  emoji]`. L'emoji è nei dati ma il gioco non la mostra ancora —
  accanto alla parola straniera svelerebbe la risposta. I distrattori
  sono altri verbi italiani della stessa lista.
- **Le frasi** (`frasi.js`, `frasi-es.js`): un oggetto per frase, con
  `id`, `tema` (per pescare distrattori affini fra le stesse categorie
  delle parole), `liv` (1 facile · 2 media · 3 tosta, decide in che
  tappa entra), `it` e `en`/`es`, `falsi` (traduzioni sbagliate per le
  domande IT → straniero — errori veri, non frasi solo improbabili),
  `falsiIt` (facoltativo, IT sbagliato per straniero → IT: se manca, i
  distrattori escono dalle altre frasi dello stesso tema) e `buco`
  (facoltativo, la stessa frase con un vuoto da riempire, per la
  grammatica pura). L'inglese scrive `en` senza punto interrogativo
  (vedi sopra); lo spagnolo scrive `¿…?` anche nei `falsi`, se no la
  frase giusta si riconoscerebbe dal segno senza capire niente.
