# Gli elementi, gli stati e il mago guerriero

Parte di [abilita.md](abilita.md) (l'albero, i punti, l'energia, lo scontro) e dei suoi [rami](abilita-rami.md). Le difese di
ogni mostro: [mostri.md](mostri.md). Il codice: `dati/elementi.js`, `motore/scontro.js` (`fattoreElemento`, `effettiBloccati`,
`comeLaPrende`, `descrizione`, `usaAbilita`), `motore/corredo.js` (`attDelRamo`).

## Gli elementi e le resistenze

Ogni abilità che colpisce ha un **elemento** (`elemento` sul nodo, o sul ramo, o `fisico`): fisico, fuoco, gelo, fulmine,
veleno, sacro (`dati/elementi.js`). Ogni mostro ([mostri.md](mostri.md)) può **resistere** a un elemento (fa metà del danno),
**temerlo** (un danno e mezzo) e **rifiutare uno stato** (non si avvelena, non brucia, non gela, non si stordisce, non
sanguina). Il perché, l'utente, 12 ottobre 2026: «tipi di attacco con mostri che hanno specifiche debolezze e forze,
tipo resistente al fuoco, resistente al veleno, impedisce lo stun»; così scegliere l'abilità giusta per il mostro che si ha
davanti è una scelta e non una gara di numeri.

- **L'attacco solito non ha elemento**: nessuno gli resiste, nessuno lo teme. Così il banco di prova (che attacca soltanto) e
  le misure della storia non cambiano, e un bambino senza energia non trova mai un muro. Le resistenze contano per le abilità.
- **Il colpo** (`Corsa.colpo`): `attacco − difesa`, i bonus in percentuale, per `per`, per il fattore (0,5 · 1,5), almeno 1; il
  fuoco dei pezzi si somma dopo. **I danni che durano** (veleno, fiamme, sangue) seguono lo stesso fattore: chi teme il fuoco
  brucia di più.
- **Un'immunità ferma l'effetto, non il colpo**: il Dardo avvelenato sullo scheletro fa il suo danno e il veleno non parte.
  `statiDelNodo` dice quali stati metterebbe un nodo: il veleno è «avvelena» o, di fuoco, «brucia»; il fermo di un'abilità di
  gelo (la Prigione di ghiaccio) è «gela» e «stordisce» insieme; il `debole` che non è di gelo (Rovi, Muro, Grido: «fa metà del
  danno») non si rifiuta, non è uno stato che qualcuno possa non prendere.
- **Lo dice la scelta**, coi numeri veri (`descrizione`): «fai 3 di danno · resiste al fuoco», «fai 12 di danno · teme la luce
  sacra», «non si stordisce». E lo dà alla vista: `foglio.difese`, e per ogni preso `elemento`, `effetto` e `rifiutati`
  ([scontro.md](scontro.md#linterfaccia-per-la-vista)).
- **La forza** ([forza.md](forza.md)) conta il mostro di riferimento senza difese: neutro apposta, o l'elfa col dardo
  varrebbe meno solo perché lo scheletro non si avvelena.

## Gli stati

Quello nuovo è il **sangue**: `sanguina` (turni). Ogni ferita che sanguina perde `quanto` (un quarto del colpo) a ogni turno
del mostro, e **un taglio nuovo si somma ai vecchi, fino a tre** (`PILE_DEL_SANGUE`): chi colpisce ancora peggiora la
situazione. Scheletro, fantasma, melma e golem non sanguinano. `seStordito` (Alle spalle, Lancia di ghiaccio) conta anche chi
sanguina. Il fuoco resta il `veleno` con `fuoco: true`, per non toccare la vista: il suo «non brucia» è una difesa a parte.

## Il mago guerriero

L'utente vuole che un mago possa diventare **mago guerriero**: la spada e ogni tanto un incantesimo. Il mago ora porta anche le
**spade** (`porta` in `dati/eroi.js`; il requisito di forza è quello di tutti: la spada corta e la spada gli bastano, lo spadone
vuole forza 3, quindi due punti in più; `secondarie` dice che per le spade la pagina non pretende che la forza combaci col
braccio). La bottega gli offre spade da sé, dalle famiglie. Il ramo **Lama arcana** vuole la spada in mano (o nella mancina) e
**colpisce con l'intelligenza** (`arma` e `car` insieme, `attDelRamo`): braccio, punti d'intelligenza e il bonus della spada
intero; l'attacco solito col pezzo in mano resta di forza. Con la spada nella destra e la bacchetta nella mancina restano
possibili Fuoco e Gelo (l'arma del ramo vale anche nella mancina) e le abilità della Lama mischiano le due cose: lama di fuoco,
lama di gelo, falciata, danza arcana. Gli elementi della Lama sono quelli del nodo: la prima è fulmine.

Nei test: `unita/sotterraneo-elementi`.
