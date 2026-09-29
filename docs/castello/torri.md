# Le torri del castello

Come si compra, quanto costa ogni torre e perché, i due rami a metà scaletta,
chi una torre non colpisce, e il blocchetto dei potenziamenti. I numeri
stanno in `src/data/castello.js` (`CARATTERE`, `CRESCITA`, `RAMI`) e in
`src/data/ops.js` (`TORRI`).

| chiave | torre | operazione | listino | resa | la prima costa |
|---|---|---|---|---|---|
| `add` | 🏹 arciere | addizione | 0,6 | 1 | 24 ⚡ |
| `sub` | 🔮 magica | sottrazione | 1 | 1,1 | 40 ⚡ |
| `mul` | ❄️ ghiaccio | moltiplicazione | 0,5 | 1 | 20 ⚡ |
| `div` | 💣 bombe | divisione | 1,4 | 1,2 | 56 ⚡ |

Salendo cambiano faccia tre volte (`stadi` in `TORRI`, `stadioDi`: livelli
1-3, 4-6, 7-10): 🏹🎯🦅 · 🔮✨🧙 · ❄️🧊⛄ · 💣🧨🚀. Il lavoro fatto deve
vedersi, non restare un numeretto in un angolo.

## Si compra toccando il campo

- **Non c'è un banco di bottoni.** Una piazzola vuota chiede che torre
  costruirci (`components/castello/SceltaTorre.vue`), una torre in piedi apre
  la sua scheda (`SchedaTorre.vue`), e il conto sale dal basso nello stesso
  foglio (`Foglio.vue`).
- **Il campo non si ferma mentre si calcola**: il foglio (`Foglio.vue`) si
  appoggia sopra senza restringere la telecamera — al massimo due terzi
  dello schermo, e sopra resta sempre una striscia di campo. Stringere la
  telecamera di quanto il foglio copre è stato provato e tolto: rifare la
  scala di un canvas a ogni tocco stanca l'occhio e il telefono.
- **Dove si può comprare si vede sul campo**: le piazzole respirano quando
  l'energia basta per una torre nuova, le torri hanno il bollino verde quando
  basta per salire.
- **Spostare è trascinare** (`views/castello/trascino.js`): fermo è un tocco
  (apre la scheda), in movimento sposta. Costa 2 ⚡ (vedi
  [taratura.md](taratura.md)).
- **Con due dita** si sposta e si ingrandisce la mappa, un doppio tocco la
  rimette in quadro.

## Il listino: le torri non valgono lo stesso, e non costano lo stesso

- **Il listino moltiplica tutto quello che una torre costa**, costruirla e
  farla salire (`CARATTERE.prezzo`, `listinoDi`). Le torri che arrivano dopo
  nella scuola sono più forti e più care già alla prima pietra: con una bomba
  si fanno due arcieri, o un arciere al livello tre — tre scelte che si
  pesano.
- **Un ⚡ speso rende lo stesso** a parità di livello (`CARATTERE.resa`,
  `resaPerEnergia`), con un premio del 10% per la magica e del 20% per le
  bombe: arrivano dopo e costano di più, e senza premio sarebbero solo più
  scomode. È un dieci-venti per cento e non un per otto perché con le
  immunità nessuna torre da sola vince una tappa.
- **Il numero giusto non si stima, si misura** con `npm run dps` (motore
  vero, vita fermata su un'ondata vera: area, rimbalzi e veleno compresi).
  `unita/castello` tiene la stima del modello (`dpsDi`) dentro la regola.
  Provato coi prezzi uguali: le bombe di livello alto valevano otto arcieri
  e il napalm tredici, e la regola del gioco era «costruisci bombe».

  | bombe, in arcieri per ⚡ | liv. 1 | liv. 4 | liv. 7 | liv. 10 |
  |---|---|---|---|---|
  | a prezzi uguali | 2,8 | 4,2 | 8,2 | 7,9 |
  | col listino | 1,2 | 1,05 | 1,4 | 1,2 |

- **Una torre ad area prende in media due-tre nemici a colpo** (`BERSAGLI`,
  misurato), quindi il suo colpo singolo è più debole di quello dell'arciere
  a parità di prezzo: lo stesso danno spalmato su un gruppo.
- **Tutte salgono con la stessa pendenza** (`CRESCITA`): un livello 7 vale
  rispetto al suo livello 1 quanto vale l'arciere, se no il listino direbbe
  una cosa al primo gradino e un'altra al decimo. Ognuna cresce nel suo
  mestiere: l'arciere in cadenza, la magica in area, le bombe in danno e dal
  settimo livello con due salve **più piccole** (`perSalva` 0,55: la salva
  doppia a danno pieno era metà del motivo per cui le bombe valevano otto
  arcieri), il ghiaccio nel gelo (`geloDi`).
- **Chi compra solo bombe fa meno calcoli e più difficili, chi compra solo
  arcieri di più e più facili**: il piano conta i prezzi delle torri che il
  giocatore modello compra davvero (`sequenzaTorri`, vedi
  [taratura.md](taratura.md)).

## I due rami valgono lo stesso

- **Al quarto gradino** (`RAMI_DA`) la torre sceglie un mestiere fra due
  carte, dal Sotterraneo in poi (`rami: true` sulla tappa). La scelta non
  costa un calcolo in più: è quello che il calcolo del gradino compra. Nel
  Bosco no: lì la lezione è ancora «salire conviene», e un bivio davanti a
  chi non ha capito a cosa serve potenziare è una domanda senza contesto.
- **Cambia la forma del danno, mai la quantità.** La torre si sceglie
  guardando il listino, il ramo no — si prende al prezzo di un gradino — e se
  uno valesse di più sarebbe un tranello; ed è la condizione perché il
  modello che tara le tappe possa ignorarli.

  | torre | ramo | cosa fa |
  |---|---|---|
  | 🏹 | cecchino / raffica | pochi colpi forti e vede il 30% più lontano / due frecce su due nemici |
  | 🔮 | veleno / catena | colpo più debole e il male che continua / rimbalza sui vicini (metà, poi un quarto) |
  | ❄️ | bufera / brina | gela larghissimo / frena di più e rende fragile chi è gelato |
  | 💣 | mortaio / napalm | arriva lontanissimo / scoppia largo e lascia bruciare |

- **Il veleno si scrive in tutto, non al secondo** (`veleno` è il totale
  spalmato su `durata`). Scritto al secondo e contato in tutto, il napalm
  valeva il triplo del mortaio. Un nemico avvelenato di nuovo prima che il
  male finisca non prende due dosi (vale la più forte): chi colpisce più
  spesso della durata avvelena di continuo e basta.
- **La brina è l'unico modo in cui una torre che non ferisce fa male**
  (`fragile`).
- **I rimbalzi della catena contano metà del colpo, poi un quarto** (`BERSAGLI.rimbalzo`),
  e stanno fuori dall'area (che moltiplica colpo e veleno).
- `unita/rami-castello` conta la parità ramo per ramo con la stessa stima
  delle torri; `npm run dps` la misura col motore.

## Una torre non spara a chi le è immune

- **Con solo immuni a tiro resta ferma e non consuma la ricarica** (`agisci`
  in `src/motore/castello/torre.js`), pronta per il primo che può ferire. Il
  ghiaccio soffia solo se c'è qualcuno da gelare.
- **La pastiglia «immune»** (`respinto`) compare su chi viene preso dentro da
  un colpo ad area tirato a un altro.
- **La carta di una torre che l'ondata ignora dice «non lo tocca».** Chi è
  immune a cosa sta in [mostri.md](mostri.md).

## Il blocchetto dei potenziamenti

Il gettone ⬆️ sul campo conta i potenziamenti presi (gradini saliti e regali
della libera); toccandolo si apre un foglio con la ✕ che dice per ogni tipo
di torre quante sono, quanti gradini hanno salito e quanto fanno in più di
una appena costruita («Arcieri ×2 · 6 potenziamenti · fanno +440%»), e sotto
i regali coi loro gradi. Il foglio è `components/castello/Potenziamenti.vue`,
i numeri `blocchettoDi` (dal modello, lo stesso che fa i prezzi; lo tiene
`unita/blocchetto-castello`).

## La chiamata anticipata

La prossima ondata si chiama anche a battaglia in corso, appena quella di
adesso è uscita tutta. Il premio e il suo tetto stanno in
[mostri.md](mostri.md), con il ritmo delle ondate.

Nei test: `[data-azione="potenziamenti"]`, `[data-blocchetto]`,
`[data-blocchetto-torre]`, `[data-blocchetto-regalo]`;
`[data-azione="chiama-prossima"]`.
