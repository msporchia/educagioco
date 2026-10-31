# La missione principale: le sette porte

Le discese erano pallini di colore e nient'altro: l'utente, il
13 ottobre 2026, vedeva due verdi e il resto grigio e si chiedeva *«quindi
devo finire le quest? cosa vuol dire la storia? metti una quest che me lo fa
fare»*. La grande storia ([la-grande-storia.md](la-grande-storia.md)) adesso è
una **missione vera, data dal minatore**: «Chiudi le sette porte». Sta in
cima al diario, distinta dalle altre, con una freccina verso la discesa di
adesso; battuto il mostro grosso di una discesa, il capitolo diventa quello
della seguente.

Il codice: `dati/storia.js` (`STORIA`, `CAPITOLI`), `laStoria` in
`motore/storia.js`, `storiaDelDiario` e `discesaDellaStoria` in
`motore/missioni.js`, `viste/Diario.vue`, `viste/FumettoMondo.vue` e `viste/Mondo3d.vue` (il fumetto e la
freccia), `motore/dialoghi.js` (`strada`).

## Cosa è

- **Una missione, sette capitoli**: uno per discesa, nell'ordine della fila.
  Il capitolo di adesso è la prima discesa non finita; ognuno ha `dice` (il
  perché, a parole del minatore: «Laggiù brucia Fiammetta: spegni lei, e la
  fornace tace») e `fatto`. Non ha un premio suo: la ricompensa è la discesa
  stessa (la roba del guardiano e del grosso, [grossi.md](grossi.md)).
- **Non si salva niente**: lo stato viene dalle discese finite
  (`tappe[i].fatta`), quindi chi giocava prima la trova già al punto giusto e
  non c'è un campo nuovo nel profilo.
- **Non è una missione dei personaggi**: non entra nel tetto di tre né nel
  numero delle missioni da consegnare ([missioni.md](missioni.md)), non si prende né si consegna.
  È sempre lì, in cima.
- **Finite le sette**, il
  diario dice che è compiuta e lascia il pozzo senza fondo: da lì in poi le zone
  ([zone.md](zone.md)).

## Il diario

In cima, sotto «La storia», una scheda d'oro: il titolo, «Porta 3 di 7 · La
torre bruciata» e una freccina che pulsa con «Batti Fiammetta, in fondo». Un
tocco apre il dettaglio: il minatore col suo detto, l'icona della discesa
con come arrivarci (`LUOGHI_MONDO`), il mostro da battere, **«segui
questa»** e **«vai alla discesa»** (l'eroe ci va e si apre il fumetto; giù,
dove non si cammina nel mondo, non c'è), e in fondo **le sette porte** una
per una (chiusa col nome del grosso caduto, quella di adesso, le altre «si
aprono dopo la porta di prima»): è qui che si capisce perché una discesa è
chiusa. Titolo e testi non sono nel codice delle viste: vengono da `STORIA`.

## Nel mondo di sopra

- **La freccia azzurra** (quella delle missioni prese, [missioni-freccina.md](missioni-freccina.md))
  porta alla meta, che di difetto è la discesa della storia; «segui questa» su una
  missione presa la sposta (`avventura.segui = 'storia'` riporta la storia, e non decade;
  [mondo-3d-la-meta.md](mondo-3d-la-meta.md)).
- **Il fumetto di una discesa** dice dov'è la storia: «La storia: continua
  qui, in fondo aspetta Re Ossuto» sulla discesa di adesso, «la porta è
  chiusa: Re Ossuto è caduto» su quelle finite, e una discesa chiusa dice cosa
  la apre, **battere il grosso della precedente**, non fare missioni («Si apre
  quando batti Re Ossuto in fondo alla cripta dei re»). Il grigio non è
  chiuso: il pallino grigio vuol dire «ormai sei più forte di tutto, rende
  poco», e il minatore lo dice ([zone.md](zone.md#il-colore-e-la-sentinella)).
- **Il minatore** la dice ogni volta che si apre il suo dialogo (la pagina
  del capitolo, poi la strada); la prima volta si presenta, spiega che sono
  sette porte e la strada la dice la pagina dopo ([dialoghi.md](dialoghi.md)).

## Provato e scartato

- **Una freccia sempre sulla storia, anche con una missione presa**: due cose
  da ricordare insieme; la missione presa è quello che si sta facendo adesso,
  e la storia si sceglie con «segui questa».
- **Un premio a ogni porta**: le gemme e la roba di una discesa sono già il
  premio, e un regalo in più sposterebbe la taratura ([la-grande-storia.md](la-grande-storia.md)).

Nei test: `[data-sezione="storia"]` con `[data-storia]` e
`[data-freccia-storia]` nel diario; il dettaglio
`[data-dettaglio][data-missione="storia"]` con `[data-porte] [data-porta="<discesa>"]`
(`data-stato`: `chiusa`, `adesso`, `avanti`) e `[data-azione="segui"]`,
`[data-azione="vai-da"]`; nel fumetto `[data-storia-qui="adesso" | "chiusa"]`
e `[data-chiusa-perche]`; nel dialogo la riga `[data-storia]`.
`unita/sotterraneo-missioni` (i capitoli, le porte, il diario, la freccia e le
sue precedenze), `unita/sotterraneo-dialoghi` (il minatore),
`integrazione/sotterraneo-missioni` (col dito). Per guardarla senza giocare:
`node strumenti/scatta-app.mjs x --dist --storia 2 --tocca '[data-azione="vita"],[data-scheda="missioni"]'`
([../core/comandi.md](../core/comandi.md)).
