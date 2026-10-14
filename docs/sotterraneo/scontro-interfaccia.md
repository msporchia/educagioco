# Lo scontro a gruppi: l'interfaccia e la vista

La regola dello scontro sta in [scontro.md](scontro.md); qui com'è fatta la vista e cosa le dà il motore. Il codice:
`viste/Scontro.vue` (il palco), `viste/FilaDeiTurni.vue` (la colonna dei turni), `viste/CaselleAbilita.vue` (la scelta in
basso), `viste/Grosso.vue` (la figura del grosso), `viste/campo.js` (dal foglio ai dati della vista, `piazza`: i piedi di ognuno), `viste/racconto.js` (le azioni di un turno, una alla volta), `Gioco.vue` (`nemico`, `scegliColpo`, `scegliIlBersaglio`,
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
- `io` — gli effetti sull'eroe: `parato`, `scudo`, `intoccabile`, `specchio`, `linfa`, `gelato` (un colpo di un mago ti gela: il tuo prossimo colpo fa metà, [varianti.md](varianti.md); l'azione del mostro porta `gelaTe`). `pericolo`, `fermate` — lo stop.
  `stati` di un mostro: `veleno {quanto, scambi, fuoco}` (`fuoco: true` sono fiamme), `sanguina {quanto, scambi, pile}`
  (si somma, fino a tre), `debole`, `fermo`, `esposto {scambi, piu}`, `rotto`; `gelo: true` (solo per disegnare: l'abilità era di gelo); `scambi` conta i turni
  **del mostro**.
- `Corsa`: `rispondi(giusto)`, `prepara(id | null)`, `beviNelloScontro()`, `beviNelPericolo()`, `continua()`, `scappa()`,
  `costoFuga()`, `puoScappare()`, `botta(m)` (il colpo di quel mostro adesso), `danno(m)`, `colpo(m, nodo)`,
  `descrizione(nodo, m)`, `velocita`.
- **L'esito** di `rispondi` e di `beviNelloScontro` (null senza scontro): `azioni` — **in ordine**, da animare una alla volta —
  `caduti`, `fine` (lo scontro si è chiuso), `ringhia` (lo stop che comincia), e in cima i campi di prima (`che`: `colpo`, `ferito`,
  `caduto`, `bevuto`, `svenuto`; `dato`, `preso`, `usata`, `colpiti`, `veleno`, `salvo`, `gelato`, `assorbito`, `schivato`…).
- **Un'azione**: dell'eroe `{ chi: 'eroe', che: 'attacco' | 'abilita' | 'sbaglia' | 'bevi' (con `cosa` e `cura`: il turno non finisce, non ci sono azioni di mostri e la fila non scorre), usata, forma, bersaglio,
  colpiti: [{ chi, dato, caduto, effetti, fattore, elemento, effetto, rifiutati }], presi: [{ chi, rifiutati }], base, volte, primoTiro, rubato }` (`presi`: chi prende
  l'abilità anche se non fa danno, Rovi o Ninna nanna; `rubato`: la vita rimessa da Mano santa; (`sbaglia` porta anche il `bersaglio`, per
  dire «a vuoto» su di lui); di un mostro `{ chi: mostro, che: 'colpo' | 'salta' | 'veleno' | 'sanguina', contro: 'eroe', pieno, preso,
  schivato, assorbito, rimandato, gelato, salvo, agguato, caduto, svenuto, spinato }` (`spinato`: quanto gli ha tolto il
  Bordo a punte; `veleno` e `sanguina` portano `dato`, `caduto`).

## Il palco

- **Il palco è un pezzo di stanza, non una fascia con uno sfondo.** L'utente, 12 ottobre 2026: «è una questione di dimensione del
  mostro rispetto allo spazio sul terreno: ti aspetti le proporzioni di Diablo, dove c'è più terreno, e non è solo un piccolo
  sfondo il terreno». Il fondale è lo scenario vero (`Palco.vue`: parete e pavimento delle stanze), con **la parete ridotta a uno
  zoccolo in cima** (`ZOCCOLO`, 40 px: la striscia della parete a ×2) e **il pavimento che riempie il resto**, disegnato alla
  scala degli sprite (`SCALA_PALCO` = 2: una piastrella è grande quanto le figure che ci stanno sopra, mai ingrandita a parte).
  Il riquadro ha altezza fissa (264 px, 316 da quattro mostri in su: `ALTO_PALCO`) e sta fermo in cima alla finestra (`sticky`):
  su un telefono stretto scorre al più la scelta, mai il fondale.
- **Le figure stanno in piedi sul pavimento, mai sulla parete**, ognuna con un'ombra ovale sotto i piedi. `piazza` (`viste/campo.js`)
  dà a ogni posto il punto dei piedi (`--x`, `--y`); chi sta più in basso è davanti (`z`), chi sta più in alto è appena più
  piccolo (scala ×0,875, a quarti: i pixel restano nitidi) e disegnato prima. Piccoli scarti per posto, ma stabili (non a caso a
  ogni render).
- **L'eroe a sinistra, a metà del pavimento** (l'utente, 13 ottobre: il compagno non c'è, «mettilo al centro»). Quando ci sarà il
  compagno la formazione cambia: l'eroe un po' sopra e il compagno sfalsato sotto, in diagonale ([scontro.md](scontro.md#cosa-resta-fuori-per-dopo)).
- **Niente chiave sui mostri**, né nello scontro né sul campo (l'utente, 13 ottobre): chi ha la chiave della scala lo dice la mappina.
- **I mostri sono in colonne verticali sul lato destro, non in file** (l'utente, 12 ottobre: «sono disposti come statuine su due file,
  è poco realistico»; come i Final Fantasy e i side-view di RPG Maker): due colonne fino a quattro mostri, tre da cinque (fino a sette: quattro, tre e due, `SLOT[7]`); la
  colonna più vicina all'eroe è davanti; dentro una colonna sono uno sopra l'altro e sfalsati a scaletta. I punti sono la tabella
  `SLOT` di `campo.js` (u: 0 vicino all'eroe, 1 in fondo; v: 0 lontano, 1 vicino), tarati perché il «ti colpisce N» di uno non cada
  sull'altro. Uno o due mostri stanno al centro del pavimento. **Il grosso sta davanti e al centro**, gli altri ai lati e dietro (i
  piccoli negli spazi). I posti sono quelli del motore e i consecutivi stanno nella stessa colonna o in colonne accanto, così i
  «vicini» delle forme `vicini` e `catena` lo sono anche nel disegno. `disponi` dice ancora quante «file» (1 o 2, l'altezza) e chi è il grosso.
  Chi cade resta al suo posto e svanisce: niente scatta di posto.
- **La caduta** (`restiDi`, `.sot-a-terra` in `viste/Scontro.vue`): chi cade non svanisce in piedi ma prende il suo pezzo a terra, `<nome>-morto-0` (le pose
  che i fogli dipingono dopo ogni creatura: un cadavere, delle ossa, una pozza, un mucchio di brace o di polvere, secondo la creatura), e se c'è un secondo
  pezzo (`-morto-1`, i resti) lo prende dopo 0,3 secondi; ci resta quasi un secondo e poi svanisce come prima. Non respira, e niente barra della vita.
  Il grosso e chi non ha il pezzo (il pipistrello occhio, le creature di 0x72) svaniscono in piedi com'era. Nei test: `integrazione/sotterraneo-caduta`.
- **Gli sprite hanno una sola scala per tutti** (`SCALA_FIGURE`; i mostri dipinti `TAGLIA` volte l'eroe, a quarti; **il grosso sta in una
  scatola**: alto al più 1,9 eroi e largo al più 3, `ingrandimentoDelGrosso` in `dati/grossi.js`, perché un ragno largo e un negromante alto
  non debordino né restino nani; l'utente, 13 ottobre: Zannaverde e la sua corona troppo grandi). La corona è un terzo della figura. **Lo stesso
  vale sul campo** (`fattoreDelMostro`): le bestie piccole sono piccole come nello scontro, le grosse restano com'erano, un ingrandimento
  non supera i 44 px di larghezza (le caselle sono di 16).
- **Il nome sta solo sul bersaglio e su chi ha un grado** (`[data-nome-mostro]`, senza articolo e piccolo: «Scheletro», «Scheletro mago spettrale»;
  l'utente, 13 ottobre: un nome sopra tutti affollava il palco; il bersaglio lo porta tenue, un grado ha il colore della sua rarità e la figura un
  alone dello stesso colore; il grosso ha il suo nome nella barra in cima) e, se è una variante armata, **l'arma in pugno** (`viste/Creatura.vue`,
  [varianti.md](varianti.md)). Chi ha i passi è di profilo (la posa di lato ferma); gli altri respirano.
- **Sotto ogni mostro la sua barra della vita, senza numeri** (il brivido di non sapere quanto resiste); **sopra «ti colpisce
  N»**, o «salta il turno» se è stordito. Gli stati addosso sono pastiglie piccole (glifo e turni che restano; il testo intero
  sta nel `title`) e cambiano il colore della figura. Chi porta la chiave ha una chiavetta in un angolo.
- **Il bersaglio**: un anello d'oro sotto i piedi; **chi verrà colpito** dalla scelta preparata, un contorno (solo se sono più
  d'uno: per `vicini`, `catena`, `tutti`; più tenue a ogni salto). Anello e contorno si spengono durante il racconto.
- **Toccare un mostro lo fa bersaglio** (`scegliBersaglio`), la scelta qui sotto si rifà coi numeri contro di lui. Il tocco non
  vale nei primi 320 ms dopo l'apertura e dopo ogni racconto (`CIECA`: il click che il dito lascia dietro alla risposta
  atterrerebbe proprio lì, [../core/il-dito.md](../core/il-dito.md)); i mostri sono tasti (`<button>`) larghi almeno 48 px e alti quanto la figura con la sua riga e la sua barra.
- **La fila dei turni** è una colonna di sette figurine sul bordo destro, in sovrimpressione (`FilaDeiTurni.vue`): chi agisce
  adesso in cima, più grande e col bordo d'oro; l'eroe ha il bordo dorato, lo stordito è smorzato con le stelle; il doppio
  turno dell'eroe è lui due volte di fila. Non prende tocchi.
- **Registro serio**: niente emoji tenere, le icone delle abilità sono i glifi di `viste/glifi.js` (anche bere e scappare). Restano
  la corona del grosso (`Grosso.vue`) e le emoji di ripiego di un mostro senza sprite.

## Il racconto di un turno

Il motore risolve tutto dentro `rispondi`; la vista ne racconta le `azioni` una alla volta (`viste/racconto.js`, `fx` reattivo).

- **Prima il fatto, poi il racconto**: le ossa vere sono già scese. Durante il racconto la barra, i caduti e la fila sono quelli di quel
  momento (`fx.ossa`, `fx.morti`, `fx.fila`); a racconto finito torna la verità.
- **Chi agisce scatta, chi prende trema, il numero sale.** L'eroe agisce con l'effetto della
  sua abilità: una famiglia di effetti scelta dai dati (palla di fuoco che scoppia, catena di fulmini, fulmine dal cielo, radici dal
  pavimento, scudo che si forma…), chi subisce ha i suoi segni e i suoi stati — tutto in [scontro-effetti.md](scontro-effetti.md).
  Sbagliare è uno scatto a metà e «a vuoto» sul bersaglio. Sul nome dell'abilità una pillola. I tempi: l'eroe quanto dura il suo effetto
  (~0,5 s l'attacco, mai oltre ~0,8 s), un mostro ~0,45 s, bere ~0,5 s.
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
- **Sotto il palco** restano le pastiglie di quello che protegge l'eroe (scudo, parato…, col testo; quelle degli incanti preparati dal campo portano i passi che restano: [orologio.md](orologio.md#come-si-vede-e-come-si-lancia), e sul primo turno dell'eroe nella fila quello che finisce prima) e la scelta. Spariscono la
  riga «fai N di danno…» dello scambio e il suo graffio: lo dicono i numeri sui mostri.

## La scelta in basso

`CaselleAbilita.vue`, come prima ([abilita.md](abilita.md#nello-scontro)): Attacco, le tre abilità coi numeri veri contro il
bersaglio, **Bevi una pozione** (poi tocca ancora a te; una per turno, e dopo il sorso il tasto è spento e lo dice), la pozione blu, **Scappa via** col suo costo fisso (`costoFuga`; non
offerta se `!puoScappare()`), e sopra la riga rossa dello stop ([pericolo.md](pericolo.md)).

## Nei test

`[data-duello]` (il palco; `data-racconto="in-corso"` mentre si racconta, `data-file` 1|2 = l'altezza, `data-mostri`), `[data-mostro]`
(`data-i` il posto, `data-tipo`, `data-nome`, `data-grande` = la chiave del grosso, `data-bersaglio`, `data-colpito` = il fattore, `data-morto`,
`data-porta-chiave`), dentro `[data-minaccia]` (`data-colpisce`), `[data-vita]` (`data-ossa`), `[data-effetti] [data-stato]`,
`[data-cifra]` (i numeri che salgono); `[data-nome-mostro]` (`data-grado`), `[data-arma-in-mano]`, `[data-eroe-scontro]`, `[data-posto-compagno]` (oggi assente: il compagno non c'è), `[data-abilita-usata]`, `[data-scena]` (gli effetti), `[data-segno]`, `[data-segno-pre]`, `[data-apertura]`,
`[data-fila] [data-turno]` (`data-chi`: `eroe` o il posto), `[data-stati-eroe]`; la scelta `[data-caselle-abilita]`
(`data-pronto`, `data-ferma`), `[data-azione="attacco|bevi-scontro|scappa"]`, `[data-abilita="<id>"]`. `figura grosso`:
`[data-figura-grosso]`. Per aprire uno scontro con più mostri: `#sotterraneo=branco&mostri=6` ([../core/comandi.md](../core/comandi.md)).
`unita/sotterraneo-vista` (disposizione, `piazza`, dati della vista, racconto) e `integrazione/sotterraneo-gruppi` (sei mostri in tre colonne a 390 e
320 px, il bersaglio col dito, il Grido su tutti raccontato in ordine, il grosso, l'agguato e la sorpresa).
