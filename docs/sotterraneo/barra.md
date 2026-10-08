# La barra in basso

La barra della discesa è quella di Diablo III: il globo rosso della vita a
sinistra, il globo d'oro della luce a destra, in mezzo le caselle, tutto in
una cornice di pietra. L'utente, 8 ottobre: «è tutt'altra cosa e penso si
possa migliorare molto». Prima c'erano tre pezzi sparsi (la vita in cima, la
fiammella in basso a sinistra, il tasto tondo dello zaino a destra); adesso
quello che serve mentre si gioca sta in un posto solo, dove arriva il
pollice. Il codice: `viste/BarraDiSotto.vue`, `viste/Globo.vue`, le regole
`.sot-plancia` e `.sot-globo` in `stile.css`.

**Prima in codice, poi dipinta.** La cornice, le coppe e il vetro sono CSS e
SVG finché l'utente non la approva; allora la si fa dipingere a ChatGPT con
la scheda `strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-barra.md`,
che dice le misure che il codice si aspetta. Il liquido, l'onda e i numeri
restano in codice anche dopo: si muovono.

## Com'è fatta

- **Sta sotto il campo, non sopra**: la tela finisce dove comincia la barra,
  e solo i globi sporgono in su di una decina di pixel. Alta 64 px (più
  l'area sicura in fondo), contro i 96 px dal fondo dove arrivavano lo zaino
  e la fiammella di prima, che però stavano solo negli angoli. Un foglio che
  sale dal basso la copre; la telecamera conta solo la parte di foglio che
  sta sopra la tela (`misuraFoglio` in `Gioco.vue`).
- **I globi** (`--globo`: da 54 px a 74 px, il 18,5% della larghezza): un
  anello di pietra, il vetro scuro, il liquido che si svuota dall'alto con
  due onde a velocità diverse sulla superficie (un'onda sola sembra un nastro
  che scorre), il riflesso in alto a sinistra. Il numero è piccolo, al
  centro, sempre: è quello che si guarda quando conta. Non sono tasti.
- **La vita** cala in mezzo secondo quando si è colpiti, e il globo sobbalza:
  il colpo si vede anche con gli occhi sul mostro. Nel quadro dello scontro
  resta la sua barretta, che è dove si guarda mentre si risponde.
- **La luce** è la torcia (le regole: [roba.md](roba.md#la-torcia-si-accende-da-sé-e-finisce)):
  cala con le stanze, vuoto al buio, e **guizza** agli sgoccioli quando non
  ci sono torce di scorta: l'unico momento in cui chiede di essere guardato.
- **Le caselle**, da sinistra: 🧪 le pozioni col numero (un tocco beve),
  🔥 le torce alla cintura, 🎒 lo zaino con le tasche piene, 📖 il diario
  delle missioni col numero delle aperte, 🗺️ la mappa grande, 💎 le gemme.
  🔥 e 💎 sono contatori, più stretti e senza il bordo chiaro di un tasto.
  Vuota, una casella si spegne in grigio. Attacco e difesa restano in cima,
  accanto al titolo: sono i due numeri che decidono uno scontro.
- **Niente lucchetti per ora**: in Diablo una casella chiusa è una cosa che
  arriverà, e qui oggi non c'è niente che arrivi (le «cose in arrivo» non
  piacciono all'utente). Il lucchetto aspetta le abilità dei livelli.
- **La scanalatura sopra le caselle** è il posto dell'esperienza dell'eroe:
  vuota finché i livelli non ci sono (`esperienza` della barra, `null`).
- **Le coppe che reggono i globi**: pietra, un filo d'oro, due riccioli e un
  rombo d'oro sotto. Niente teste né artigli: devono reggere, non far paura.
- **A 320 px ci sta**: i globi scendono a 59 px e le caselle a una trentina
  di pixel l'una, i contatori un po' meno. La pagina non scorre di lato
  (`overflow-x: clip` sulla barra: le coppe sporgono).

## Le caselle che fanno qualcosa

- **🧪 beve senza aprire lo zaino**: la più piccola pozione che riempie la
  vita, o la più grande se nessuna basta (`pozioneGiusta` in
  `motore/corsa.js`); l'elisir del toro non è una cura e non conta. In piena
  forma non si beve e lo dice («❤️ sei già in piena forma»): un tocco per
  sbaglio non butta una boccetta. Come lo zaino, non si apre durante uno
  scontro: il velo copre la barra.
- **📖 apre lo stesso diario di sopra**, senza «vai da …» (chi aspetta sta
  sopra). Da qui si sceglie anche quale missione segue la freccina
  ([missioni-freccina.md](missioni-freccina.md)).
- **🗺️ apre la mappina grande** al centro del campo, sulla tela
  (`mappaGrande` in `scena/tela.js`); il gioco non si ferma. La chiude un
  tocco sul campo, un foglio che si apre, o la casella stessa.
- **Zaino, diario e mappa grande si chiudono toccando altrove**, e quel tocco
  porta l'eroe dove si è toccato ([../core/interfaccia.md](../core/interfaccia.md#un-tocco-altrove-chiude)).

Nei test: `[data-barra-giu]`; `[data-globo="vita|luce"]` con `data-quota`
(0..1) e `data-guizza`, il numero in `.sot-globo-numero`;
`[data-casella-barra="pozione|torcia|zaino|diario|mappa|gemme"]` con `data-n`;
`[data-azione="bevi"]`, `[data-azione="zaino"]`, `[data-azione="diario-giu"]`,
`[data-azione="mappina"]` (con `aria-pressed`), `[data-gemme-barra]`,
`[data-esperienza]`. `integrazione/sotterraneo-barra` (col dito: i globi, la
luce che cala e guizza, il mostro che colpisce, la pozione dalla casella, il
tocco altrove, le misure a 390 e a 320 px), `unita/sotterraneo-roba` (quale
pozione si beve), `integrazione/sotterraneo` (la luce col cheat di casa).
