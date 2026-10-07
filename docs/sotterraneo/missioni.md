# Le missioni dei personaggi

Sulla terra di sopra, in posti che hanno un senso, stanno persone che
chiedono un favore legato a una discesa precisa: *«la collana della nonna è
al primo piano della scalinata»*. Danno un motivo per scendere che non sia
«giù senza fine». Decise dall'utente il 7 ottobre 2026 con la grande storia
([la-grande-storia.md](la-grande-storia.md)). Il codice:
`dati/missioni.js` (chi, cosa, dove, il premio), `motore/missioni.js` (lo
stato, il segno, prendere e consegnare, dove sta la cosa nel piano),
`viste/Missione.vue` (il pezzo di fumetto), `viste/Terra.vue` (chi sta
fermo), `motore/corsa.js` (`posaLeMissioni`).

## Chi le dà, e dove sta

Dove sta lo dice il foglietto (`personaggi`, con `piede` e `accanto` come i
mercanti: [terra-strumento.md](terra-strumento.md)). Non si attraversano e
non chiudono la strada a nessuno (`unita/sotterraneo-terra`).

| chi | dove | piede · accanto | missioni |
|---|---|---|---|
| la ragazza del pozzo | al pozzo del villaggio, dove si beve | [49, 36] · [51, 36] | la collana della nonna |
| il mugnaio | sotto il mulino, sul sentiero dei campi | [54, 22] · [56, 22] | Rosicchione |
| l'eremita | davanti all'altare fra le colonne | [58, 9] · [60, 9] | la Badessa Grigia |
| la guardia | sul prato davanti alla torre | [45, 9] · [47, 9] | le chiavi della torre, Zannagrigia |
| il pescatore | sulla riva dello stagno | [10, 23] · [12, 23] | Chela, la canna d'oro |
| il boscaiolo | dove il sentiero entra nel bosco, accanto al carretto | [21, 26] · [19, 26] | l'ascia di suo padre |
| il vecchio minatore | nel villaggio, dove parte la strada per il bosco | [40, 36] · [42, 36] | la lanterna del nonno |

- **Figure disegnate in codice** (`RAGAZZA`, `MUGNAIO`, `EREMITA`,
  `GUARDIA`, `PESCATORE`, `BOSCAIOLO` in `viste/pixel.js`) finché non
  arrivano gli sprite: `<sprite>-fermo-0` nell'atlante (`ragazza-fermo-0`…)
  si usa da solo, come per il minatore. I prompt sono nella scheda
  `PROMPT-terra-di-sopra.md`.
- **Il minatore** indica sempre la strada; la sua missione sta sotto la
  frase, nello stesso fumetto.

## Le missioni

| missione | chi | discesa · piano | tipo | premio |
|---|---|---|---|---|
| La Badessa Grigia (un fantasma) | l'eremita | la cripta dell'altare · 2 | sconfiggi | 💎 12 |
| La collana della nonna | la ragazza | la scalinata antica · 1 | trova | 💎 15 |
| Rosicchione (un ratto) | il mugnaio | la torre · 2 | sconfiggi | amuleto azzurro |
| Il mazzo di chiavi della torre | la guardia | la torre · 3 | trova | 💎 20 |
| L'ascia di suo padre | il boscaiolo | la grotta · 4 | trova | 💎 25 |
| Chela, il granchio gigante | il pescatore | la scala sommersa · 2 | sconfiggi | anello d'ambra |
| La canna d'oro | il pescatore | la scala sommersa · 3 | trova | 💎 25 |
| Zannagrigia (un lupo) | la guardia | la botola · 2 | sconfiggi | 💎 30 |
| La lanterna del nonno | il minatore | la miniera · 3 | trova | teschio del cercatore |

## Le regole

- **Una per volta** (`proposta` in `motore/missioni.js`, decisa dall'utente
  il 7 ottobre: *«le missioni dovrebbe proporne una per volta, adeguata al suo
  livello»*). Per avventura una sola missione è proposta, e solo il suo
  personaggio ha il segno: gli altri salutano. Una vista di tante «!» insieme,
  anche lontane dal punto della storia, non diceva dove andare. La regola, in
  quest'ordine: **1.** una fatta, da consegnare; **2.** una presa e non ancora
  fatta (finché non è consegnata non se ne propone un'altra); **3.** una
  nuova: fra le non cominciate, con la discesa aperta e non oltre la prima
  discesa non ancora finita, quella della discesa più avanti, e a pari discesa
  il piano più in alto. Chi ne ha saltata una la ritrova solo quando di più
  adatte non ce ne sono (e solo quella proposta si può prendere:
  `prendi(…, tappe)`). Il perché della presa che blocca: un bambino capisce
  «finisco questa, poi ne arriva un'altra», e il minatore gli dice chi lo
  aspetta se l'ha scordato.
- **Ogni discesa ne ha almeno una** (`guastiDelleMissioni`); chi ne ha per una
  discesa ancora chiusa non ne parla affatto.
- **Il minatore dice chi ti cerca**: indicando la strada aggiunge una frase
  («La ragazza del pozzo ha un favore da chiederti», «… aspetta ancora: la
  collana della nonna», «… ti aspetta: quello che ti ha chiesto l'hai
  fatto»), se la missione proposta non è la sua (`chiTiCerca`).
- **Sono facoltative e non bloccano la storia**: la discesa si vince anche
  senza, e una missione presa resta presa finché non la si fa (ferma solo le altre missioni).
- **Il segno sopra la testa**: «!» d'oro ha una missione nuova da darti, «?»
  l'hai presa e lui l'aspetta (se l'hai già fatta, il fumetto dice «ecco
  qua»). Presa e non ancora fatta, il fumetto la ricorda con discesa e piano.
- **Trova**: nel piano giusto c'è un forziere d'oro con sopra, che
  galleggia, la faccia della cosa. Toccandolo il foglio ne dice il nome e
  chiede una domanda; **sbagliando resta chiuso e si riprova**, come una
  porta (un forziere normale si perde per sempre: questo no, la missione
  non si brucia). La cosa non entra nello zaino: è fatta.
- **Sconfiggi**: nel piano giusto c'è un mostro del bestiario col nome e
  la corona, più duro di quelli del suo piano (le ossa del guardiano del
  piano o una volta e mezza le sue, e un colpo in più: `PIU_DURO`). Battuto
  è fatta.
- **Dove sta**: in una stanza che non è l'ingresso, la scala o il portale,
  scelta da un caso suo (seme del piano e nome della missione): il caso
  della discesa non si sposta e rientrando la cosa è nello stesso posto.
  Non nasce dal seme del piano: la sosta la tiene fra le cose nuove, e una
  missione presa sopra mentre la discesa è a metà (passando dal portale)
  compare riprendendo.
- **Il premio è in gemme o in un gioiello, mai in monete**: le monete si
  guadagnano rispondendo ([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).
  Un premio da impugnare o da indossare salterebbe un passo della storia,
  e `guastiDelleMissioni` lo rifiuta, come più di 40 gemme. Il gioiello va
  al dito se è libero, se no in tasca; a tasche piene la consegna aspetta.
- **Lo stato è dell'avventura**: `cfg.avventure[eroe].missioni`,
  `{ [id]: 'presa' | 'fatta' | 'consegnata' }`; la forma non è cambiata con
  la regola «una per volta»: un'avventura con più missioni prese insieme le
  propone comunque una alla volta (le fatte, poi le prese nell'ordine della
  storia). Quello fatto giù sta nella
  Corsa (`missioniFatte`, anche nella sosta) e passa nell'avventura a ogni
  salvataggio. Ogni eroe ha le sue.

Nei test: `unita/sotterraneo-storia` (il segno, prendere due volte, il
forziere al piano giusto, sbagliare e riprovare, la sosta, il mostro col
nome più duro, la missione presa a discesa a metà, la consegna in gemme e
in un gioiello, le tasche piene, mai monete; `proposta`: una sola a ogni
punto della storia, la successiva dopo la consegna, uno stato di prima con
più missioni prese, la frase del minatore), `integrazione/sotterraneo-missioni`
(col dito: il «!» della ragazza e nessun altro, il fumetto, «ci penso io», giù al primo
piano della scalinata, il forziere d'oro, la risposta, su dal portale, il
«?» già da presa, «ecco qua», le gemme nella roba, le monete ferme e il «!»
della successiva sull'eremita). Sulla mappa
`[data-personaggio="<chi>"]` con `data-segno` (`!` o `?`), il fumetto
`[data-fumetto-di="<chi>"]` con `[data-missione="<id>"][data-fase]`
(`offre`, `aspetta`, `consegna`, `saluto`), la frase del minatore
`[data-ti-cerca]`,
`[data-azione="prendi-missione"]`, `[data-azione="consegna"]`; il segno del
minatore `[data-minatore] [data-segno]`; giù il foglio del forziere
`[data-missione="<id>"]`.
