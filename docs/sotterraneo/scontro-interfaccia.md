# Lo scontro a gruppi: l'interfaccia e la vista

La regola dello scontro sta in [scontro.md](scontro.md); qui com'è fatta la vista e cosa le dà il motore. Il codice:
`viste/Scontro.vue` (il palco), `viste/FilaDeiTurni.vue` (la colonna dei turni), `viste/CaselleAbilita.vue` (la scelta in
basso), `viste/Grosso.vue` (la figura del grosso), `viste/campo.js` (dal foglio ai dati della vista, la disposizione dei
mostri), `viste/racconto.js` (le azioni di un turno, una alla volta), `Gioco.vue` (`nemico`, `scegliColpo`, `scegliIlBersaglio`,
`mostra`), `stile-scontro.css`.

## L'interfaccia del motore

Tutto sta in `Corsa.foglio` (`che: 'scontro'`) e nelle funzioni di `Corsa`; un mostro è l'oggetto del piano (`ossa`,
`ossaMax`, `tipo`, `grosso`, `morto`, `stati`). `foglio.chi` è il bersaglio.

- `chi` — il bersaglio di adesso; `scegliBersaglio(m)` lo cambia.
- `campo` — i mostri in campo, **nell'ordine dei posti** (per distanza all'ingresso, il primo è chi ha aperto lo scontro); chi
  cade resta al suo posto con `morto: true`. `postiDi(m)` (da `motore/scontro.js`): 1, o 2 per il grosso.
- `colpiti` — `[{ chi, fattore }]`: chi prenderebbe la scelta preparata (`Corsa.pronta`, `prepara(id)`), o l'attacco;
  `fattore` 1, o ×0,7 a salto.
- `turni` — `[{ chi: 'eroe' | mostro, salta }]`: i prossimi sette; `salta` per lo stordito.
- `minaccia` — `[{ chi, colpisce, salta }]`: «ti colpisce N» per ogni vivo.
- `inArrivo` — la somma dei colpi prima del prossimo turno (lo stop).
- `apertura` — le azioni prima del primo turno (l'agguato con `agguato: true`, i mostri più veloci); `agguato`, `sorpresa` — booleani.
- `difese` — **le difese dei mostri in campo**, una per posto di `campo` (stesso indice, anche per chi è caduto):
  `{ resiste: [elementi], teme: [elementi], immune: [stati] }`, chiavi di `dati/elementi.js` (`ELEMENTI`, `STATI`: nome, glifo,
  tinta, «non si avvelena»); per un mostro solo `Corsa.difese(m)`. Con una scelta preparata ogni preso in `colpiti` porta
  anche `elemento`, `effetto` (`'resiste'`, `'teme'` o `null`) e `rifiutati` (gli stati che non prenderà): la vista può dire
  «resiste al fuoco» prima di rispondere. `descrizione(nodo, m)` lo dice già a parole.
- `io` — gli effetti sull'eroe: `parato`, `scudo`, `intoccabile`, `specchio`, `linfa`. `pericolo`, `fermate` — lo stop.
  `stati` di un mostro: `veleno {quanto, scambi, fuoco}` (`fuoco: true` sono fiamme), `sanguina {quanto, scambi, pile}`
  (si somma, fino a tre), `debole`, `fermo`, `esposto {scambi, piu}`, `rotto`; `scambi` conta i turni
  **del mostro**.
- `Corsa`: `rispondi(giusto)`, `prepara(id | null)`, `beviNelloScontro()`, `beviNelPericolo()`, `continua()`, `scappa()`,
  `costoFuga()`, `puoScappare()`, `botta(m)` (il colpo di quel mostro adesso), `danno(m)`, `colpo(m, nodo)`,
  `descrizione(nodo, m)`, `velocita`.
- **L'esito** di `rispondi` e di `beviNelloScontro` (null senza scontro): `azioni` — **in ordine**, da animare una alla volta —
  `caduti`, `fine` (lo scontro si è chiuso), `ringhia` (lo stop che comincia), e in cima i campi di prima (`che`: `colpo`, `ferito`,
  `caduto`, `bevuto`, `svenuto`; `dato`, `preso`, `usata`, `colpiti`, `veleno`, `salvo`, `gelato`, `assorbito`, `schivato`…).
- **Un'azione**: dell'eroe `{ chi: 'eroe', che: 'attacco' | 'abilita' | 'sbaglia' | 'bevi', usata, forma, bersaglio,
  colpiti: [{ chi, dato, caduto, effetti, fattore, elemento, effetto, rifiutati }], base, volte, primoTiro, rubato }` (`rubato`: la vita rimessa da Mano santa; (`sbaglia` porta anche il `bersaglio`, per
  dire «a vuoto» su di lui); di un mostro `{ chi: mostro, che: 'colpo' | 'salta' | 'veleno' | 'sanguina', contro: 'eroe', pieno, preso,
  schivato, assorbito, rimandato, gelato, salvo, agguato, caduto, svenuto, spinato }` (`spinato`: quanto gli ha tolto il
  Bordo a punte; `veleno` e `sanguina` portano `dato`, `caduto`).

## Il palco

- **Il fondale è lo scenario vero** (`Palco.vue`: parete e pavimento delle stanze). Il riquadro ha altezza fissa (244 px, 292 con
  due file) e sta fermo in cima alla finestra (`sticky`): su un telefono stretto scorre al più la scelta, mai il fondale.
- **L'eroe a sinistra**, con **un posto vuoto sotto per il compagno** (un ovale tratteggiato, discreto, senza scritta: il compagno
  è per dopo, [scontro.md](scontro.md#cosa-resta-fuori-per-dopo)).
- **I mostri a destra**, su una griglia a sei colonne dove ognuno ne prende due (`disponi` in `viste/campo.js`): fino a tre una
  fila sola, più grandi; da quattro due file (2+2, 3+2, 3+3, nell'ordine dei posti, la seconda centrata). **Il grosso sta al
  centro e occupa le due file**, gli altri ai lati, prima in basso. Chi cade resta al suo posto e svanisce: niente scatta di
  posto. Le file a schermo non sono regole: davanti o dietro non conta.
- **Gli sprite hanno una scala intera** (pixel nitidi), scelta sulla larghezza del palco: fino a 5 con un mostro solo, 3 in due
  file, 2 a 320 px e di fianco al grosso. A 320 px la riga della minaccia si accorcia a «colpisce N».
- **Sotto ogni mostro la sua barra della vita, senza numeri** (il brivido di non sapere quanto resiste); **sopra «ti colpisce
  N»**, o «salta il turno» se è stordito. Gli stati addosso sono pastiglie piccole (glifo e turni che restano; il testo intero
  sta nel `title`) e cambiano il colore della figura. Chi porta la chiave ha una chiavetta in un angolo.
- **Il bersaglio**: un anello d'oro sotto i piedi; **chi verrà colpito** dalla scelta preparata, un contorno (solo se sono più
  d'uno: per `vicini`, `catena`, `tutti`; più tenue a ogni salto). Anello e contorno si spengono durante il racconto.
- **Toccare un mostro lo fa bersaglio** (`scegliBersaglio`), la scelta qui sotto si rifà coi numeri contro di lui. Il tocco non
  vale nei primi 320 ms dopo l'apertura e dopo ogni racconto (`CIECA`: il click che il dito lascia dietro alla risposta
  atterrerebbe proprio lì, [../core/il-dito.md](../core/il-dito.md)); i mostri sono tasti (`<button>`) alti quanto la loro cella.
- **La fila dei turni** è una colonna di sette figurine sul bordo destro, in sovrimpressione (`FilaDeiTurni.vue`): chi agisce
  adesso in cima, più grande e col bordo d'oro; l'eroe ha il bordo dorato, lo stordito è smorzato con le stelle; il doppio
  turno dell'eroe è lui due volte di fila. Non prende tocchi.
- **Registro serio**: niente emoji tenere, le icone delle abilità sono i glifi di `viste/glifi.js` (anche bere e scappare). Restano
  la corona del grosso (`Grosso.vue`) e le emoji di ripiego di un mostro senza sprite.

## Il racconto di un turno

Il motore risolve tutto dentro `rispondi`; la vista ne racconta le `azioni` una alla volta (`viste/racconto.js`, `fx` reattivo).

- **Prima il fatto, poi il racconto**: le ossa vere sono già scese. Durante il racconto la barra, i caduti e la fila sono quelli di quel
  momento (`fx.ossa`, `fx.morti`, `fx.fila`); a racconto finito torna la verità.
- **Chi agisce scatta, chi prende trema, il numero sale.** L'eroe da vicino si fa sotto, da lontano (arco, bacchetta) lancia: il
  glifo dell'abilità, del colore del suo ramo, vola verso ognuno dei colpiti, la catena in sequenza (~0,17 s fra un salto e il
  prossimo). Uno scudo o una cura non colpiscono: un alone. Sbagliare è uno scatto a metà e «a vuoto» sul bersaglio. Sul nome
  dell'abilità una pillola. I tempi: l'eroe ~0,6 s, un mostro ~0,45 s, bere ~0,5 s.
- **I mostri uno dopo l'altro**, nell'ordine della fila: il colpo (scatta, l'eroe incassa «−N», il globo sobbalza), «schivato»,
  «parato», il turno saltato («stordito»), il veleno che brucia, lo specchio che torna al mostro. La fila scorre a ogni turno
  finito, chi cade ne esce.
- **Un tocco accorcia** (il resto va sei volte più in fretta). **La domanda e la scelta dopo compaiono a racconto finito**: nel
  frattempo la scelta c'è già, spenta (`ferma`), perché il fondale non salti; a racconto finito si rimonta e i 320 ms ciechi
  ripartono. La riga rossa dello stop compare allora.
- **Lo scontro resta a schermo finché l'ultimo colpo non è raccontato**, anche se è l'ultimo mostro o l'eroe è svenuto (`Gioco.vue`
  tiene l'ultima vista), poi il foglio che segue.
- **L'apertura**: l'agguato («Alle spalle!»), la sorpresa («Li hai sorpresi!», «Lo hai sorpreso!» con uno solo) e i mostri più
  veloci che colpiscono prima del primo turno si raccontano come un turno, con la riga che resta fino alla fine.
- **Sotto il palco** restano le pastiglie di quello che protegge l'eroe (scudo, parato…, col testo) e la scelta. Spariscono la
  riga «fai N di danno…» dello scambio e il suo graffio: lo dicono i numeri sui mostri.

## La scelta in basso

`CaselleAbilita.vue`, come prima ([abilita.md](abilita.md#nello-scontro)): Attacco, le tre abilità coi numeri veri contro il
bersaglio, **Bevi una pozione** (costa il turno, lo dice), la pozione blu, **Scappa via** col suo costo fisso (`costoFuga`; non
offerta se `!puoScappare()`), e sopra la riga rossa dello stop ([pericolo.md](pericolo.md)).

## Nei test

`[data-duello]` (il palco; `data-racconto="in-corso"` mentre si racconta, `data-file` 1|2, `data-mostri`), `[data-mostro]`
(`data-i` il posto, `data-tipo`, `data-nome`, `data-grande` = la chiave del grosso, `data-bersaglio`, `data-colpito` = il fattore, `data-morto`,
`data-porta-chiave`), dentro `[data-minaccia]` (`data-colpisce`), `[data-vita]` (`data-ossa`), `[data-effetti] [data-stato]`,
`[data-cifra]` (i numeri che salgono); `[data-eroe-scontro]`, `[data-posto-compagno]`, `[data-abilita-usata]`, `[data-dardo]`, `[data-apertura]`,
`[data-fila] [data-turno]` (`data-chi`: `eroe` o il posto), `[data-stati-eroe]`; la scelta `[data-caselle-abilita]`
(`data-pronto`, `data-ferma`), `[data-azione="attacco|bevi-scontro|scappa"]`, `[data-abilita="<id>"]`. `figura grosso`:
`[data-figura-grosso]`. Per aprire uno scontro con più mostri: `#sotterraneo=branco&mostri=6` ([../core/comandi.md](../core/comandi.md)).
`unita/sotterraneo-vista` (disposizione, dati della vista, racconto) e `integrazione/sotterraneo-gruppi` (sei mostri a 390 e
320 px, il bersaglio col dito, il Grido su tutti raccontato in ordine, il grosso, l'agguato e la sorpresa).
