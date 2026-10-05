# Le torri del castello

Come si compra, quanto costa ogni torre e perché, i due rami a metà scaletta,
chi una torre non colpisce, e il blocchetto dei potenziamenti. I numeri
stanno in `src/data/castello.js` (`CARATTERE`, `CRESCITA`, `RAMI`) e in
`src/data/ops.js` (`TORRI`).

| chiave | torre | operazione | listino | resa | la prima costa | gittata | scoppio |
|---|---|---|---|---|---|---|---|
| `add` | 🏹 arciere | addizione | 0,6 | 1 | 24 ⚡ | 92 | — |
| `sub` | 🔮 magica | sottrazione | 1 | 1,1 | 40 ⚡ | 104 | 42 |
| `mul` | ❄️ ghiaccio | moltiplicazione | 1,6 | 1 | 20 ⚡ | 92 | — |
| `div` | 💣 bombe | divisione | 1,4 | 1,2 | 56 ⚡ | 104 | 38 |

Gittata e scoppio sono in unità del mondo: una cella della carta è larga
35 (420/12). Il raggio non cresce coi livelli.

Salendo cambiano faccia tre volte (`stadi` in `TORRI`, `stadioDi`: livelli
1-3, 4-6, 7-10): 🏹🎯🦅 · 🔮✨🧙 · ❄️🧊⛄ · 💣🧨🚀. Il lavoro fatto deve
vedersi, non restare un numeretto in un angolo.

**La carta della torre non è un'immagine, è lo stesso pittore del campo**
chiamato su una tela piccola (`RitrattoTorre.vue`, e allo stesso modo
`RitrattoMostro.vue`): così la carta con cui si compra e la torre che si
ritrova in campo sono la stessa cosa, compreso il salto di stadio. Prima
c'era un'emoji, e l'emoji mentiva — restava la stessa anche a torre
cresciuta.

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
  vero, sulle carte, vita fermata su un'ondata vera: area, rimbalzi e
  veleno compresi). `misure/castello` tiene la stima del modello (`dpsDi`)
  dentro la regola. Provato coi prezzi uguali: le bombe di livello alto
  valevano otto arcieri e il napalm tredici, e la regola del gioco era
  «costruisci bombe».

  La tabella per torre, ramo e livello, e cosa è stato toccato per
  starci dentro, sta in [resa-delle-torri.md](resa-delle-torri.md).

- **Le bombe non arrivano più lontano della magica, e scoppiano di una
  cella.** Arrivavano a 132 con uno scoppio di 62: quasi quattro celle di
  gittata e quasi due di raggio, e sulle strade a squadra, che si
  ripiegano strette, uno scoppio prendeva due o tre tratti insieme — «fa
  decisamente troppo effetto» (l'utente). Adesso 104 e 38, e il mortaio
  resta la gittata più lunga (×1,25, 130: meno di una cella in più), il
  napalm lo scoppio più largo (×1,15). Sparano più spesso con un colpo
  più piccolo (42 ogni 1,8 s, erano 44 ogni 2,3): con lo scoppio stretto
  un colpo ne prende due invece di tre, e un'ondata di troll — che solo le
  bombe feriscono — a 2,3 s non si fermava a nessuna vita, perché i colpi
  non bastavano per tutti.
- **Salire rende un po' meno per ⚡ che costruire** (vedi
  [taratura.md](taratura.md)): la resa per ⚡ cumulato di una torre salita,
  contro la stessa appena costruita, sta fra 0,72 e 0,94 per tutte e
  quattro, misurata ([resa-delle-torri.md](resa-delle-torri.md)); la stima
  del modello, che il test tiene (0,70–0,97 al livello 4, fino a 0,55 al
  10, e che cali), dice 0,77 · 0,74 · 0,73 per l'arciere.

- **Una torre ad area prende in media due-tre nemici a colpo** (`BERSAGLI`,
  misurato), quindi il suo colpo singolo è più debole di quello dell'arciere
  a parità di prezzo: lo stesso danno spalmato su un gruppo.
- **Tutte salgono con la stessa pendenza, quasi dritta** (`CRESCITA`): un
  livello 7 vale rispetto al suo livello 1 quanto vale l'arciere, se no il
  listino direbbe una cosa al primo gradino e un'altra al decimo, e ogni
  gradino aggiunge più o meno quanto il primo. Ognuna cresce nel suo
  mestiere: l'arciere in cadenza (e un po' in danno), la magica in area, le
  bombe in danno e dal settimo livello con due salve **più piccole**
  (`perSalva` 0,61: la salva doppia a danno pieno era metà del motivo per
  cui le bombe valevano otto arcieri), il ghiaccio nel gelo (`geloDi`). Il
  raggio non cresce (era +4% a gradino): sulle carte una torre alta con un
  terzo di gittata in più copriva metà del campo da sola.
- **Chi compra solo bombe fa meno calcoli e più difficili, chi compra solo
  arcieri di più e più facili**: il piano conta i prezzi delle torri che il
  giocatore modello compra davvero (`sequenzaTorri`, vedi
  [taratura.md](taratura.md)).

## I due rami valgono lo stesso

- **Al quarto gradino** (`RAMI_DA`) la torre sceglie un mestiere fra due
  carte, in ogni tappa che ci arriva (`rami: true`). La scelta non costa un
  calcolo in più: è quello che il calcolo del gradino compra.
- **Una tappa senza rami è una tappa il cui tetto sta sotto il bivio**
  (`cap` < `RAMI_DA`: oggi solo il sentiero, cap 3). La regola è
  dell'utente, e la tengono `misure/castello` e il validatore: una torre che
  sale oltre il terzo gradino senza scegliere niente sale a vuoto. Il Bosco
  una volta ne restava fuori tutto («lì la lezione è ancora salire
  conviene»), e così dal guado alla radice le torri salivano fino al
  settimo gradino senza bivio.
- **Cambia la forma del danno, mai la quantità.** La torre si sceglie
  guardando il listino, il ramo no — si prende al prezzo di un gradino — e se
  uno valesse di più sarebbe un tranello; ed è la condizione perché il
  modello che tara le tappe possa ignorarli.

  | torre | ramo | cosa fa |
  |---|---|---|
  | 🏹 | cecchino / raffica | pochi colpi forti e vede il 30% più lontano / due frecce su due nemici |
  | 🔮 | veleno / catena | colpo più debole e il male che continua / rimbalza sui vicini (metà, poi un quarto) |
  | ❄️ | bufera / brina | gela più largo e più a lungo (raggio ×1,2, durata ×1,4) / raggio stretto (×0,75) ma frena al massimo e rende fragile chi è gelato (+15% di danno da tutte le torri) |
  | 💣 | mortaio / napalm | la gittata più lunga, e pesa / scoppia più largo e lascia bruciare |

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
- **La carta di una torre che l'ondata ignora si attenua**, e basta: niente
  scritta. C'era un «non lo tocca», e diceva due volte quello che la scheda
  del mostro in alto dice già («immune a»). Chi è immune a cosa sta in
  [mostri.md](mostri.md).

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
