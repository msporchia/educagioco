# Lo scontro a gruppi

Deciso il 12 ottobre 2026 e **costruito nel motore** (la vista di oggi lo gioca
col duello di sempre; il rifacimento della vista è il lavoro dopo): lo scontro
passa dal duello uno contro uno a **uno contro tanti, a turni, con
l'iniziativa**, alla Final Fantasy. Il perché, con le parole dell'utente: in
una stanza con sei mostri «li devo affrontare uno dietro l'altro… una volta che
ti curi sei a posto e reggi a lungo, averne dieci piccoli non significa niente,
solo più domande». In uno contro tanti il pericolo cresce con il numero dei
mostri, le abilità ad area hanno un senso e la torcia decide chi parte per
primo.

Il codice: `motore/scontro.js` (i metodi dello scontro, attaccati a `Corsa`),
`motore/turni.js` (la fila, pura), `motore/corsa.js` (il resto della discesa),
`motore/corredo.js` (`velocita`, `attDelRamo`), `motore/pericolo.js`,
`dati/mondo.js` (le costanti), `dati/mostri.js` (`velocita`), `dati/abilita.js`
(`forma`, `salti`, `car`). La regola di prima era in [regole.md](regole.md#lo-scontro),
[abilita.md](abilita.md#nello-scontro) e [pericolo.md](pericolo.md): ora rimandano qui.

## Chi entra

- **Lo scontro comincia quando un mostro ti raggiunge o lo tocchi tu.**
- **Entrano tutti i mostri vivi entro `RAGGIO_SCONTRO` (4,5 celle) dall'eroe,
  nella stanza di chi ha aperto lo scontro**, svegli o addormentati (chi dorme
  si sveglia), misurati una volta sola all'inizio. Chi è fuori resta fuori:
  **nessun rinforzo** a scontro aperto. Dividere un gruppo grande è una cosa da
  fare apposta, avvicinandosi piano e con la luce.
- **Al massimo sei posti** (`MOSTRI_IN_CAMPO`): sei figure stanno a 390 px. Se il
  raggio ne prende di più, entrano i più vicini, chi ha aperto lo scontro sempre
  primo. **Il mostro grosso vale due posti** (`postiDi`): con lui, cinque mostri.
- I branchi (il caporale col suo seguito) li fanno i piani nuovi: lo scontro funziona con
  quello che trova. Da solo, per provare una regola: `scontro(m, { solo: true })`.

## Chi parte

- **L'agguato**: se il mostro che ti raggiunge arriva **alle spalle** (dalla
  metà dietro il verso in cui l'eroe guarda, cioè l'ultimo passo fatto:
  `Corsa.verso`, `{ dx, dy }`, o `guarda` se non ha mai camminato),
  colpisce **solo lui, una volta**, prima di tutto (`foglio.agguato`, e
  il colpo è il primo in `foglio.apertura`). Poi si va di iniziativa. Farsi
  prendere alle spalle non conviene mai: entrano gli stessi mostri in ogni
  caso (conta il raggio), e in più si prende un colpo.
- **La sorpresa**: se sei tu a toccare un mostro che dorme, il tuo primo turno
  arriva prima di tutto (`foglio.sorpresa`), con la sua domanda. **Oggi è
  rara**: un mostro si sveglia a sette celle nella sua stanza
  ([regole.md](regole.md#la-stanza-è-il-confine)), quindi quasi sempre lo
  tocchi già sveglio: la sveglia (sette celle) è più lunga del cono di luce
  ([luce.md](luce.md)), quindi non si vede un mostro dormire prima che si
  svegli.
- **L'agguato è il premio dei mostri nell'ombra**: con la luce a cono un mostro
  sveglio fuori luce non va dritto all'eroe, gli arriva alle spalle
  ([luce.md](luce.md#i-mostri-e-lombra)), e «alle spalle» è la metà dietro il
  verso (`versoEroe`). Se risulterà troppo punitivo, un segno che qualcosa si
  muove dietro: visivo, perché col suono spento il gioco deve restare intero.

## L'iniziativa

- **Ognuno ha una velocità** (`velocita`): l'eroe `10 + destrezza` (12 il
  cavaliere, il mago e il nano all'inizio, 14 l'elfa), i mostri quella della
  specie in `dati/mostri.js` (il grosso quella della sua specie):

  | velocità | mostri |
  |---|---|
  | 12–13 | ratto, pipistrello, vespone |
  | 9–10 | goblin, scheletro, fantasma, lupo, serpente |
  | 7–8 | orco, gigante, troll, fungo, granchio |
  | 5–6 | melma, golem |

  L'eroe parte **più veloce della media dei mostri** (l'utente: «l'eroe è alto
  come iniziativa»); il lupo e il serpente a 9 e non a 11 perché con loro la
  grotta non reggeva (vedi «Il bilancio»).
- **Una fila di turni alla Final Fantasy X** (`motore/turni.js`): ogni azione
  fa aspettare `100 / velocita`, agisce chi ha aspettato di meno, a parità
  l'eroe. Niente tempo che scorre, mai: la fila si muove solo agendo.
- **Il doppio turno nasce da sé**: un eroe veloce il doppio di un mostro
  gioca due volte prima di lui. La destrezza diventa la caratteristica del
  ritmo, e i pezzi hanno una cosa in più da dare.
- **La fila si vede**: i prossimi sette turni (`foglio.turni`), in una colonna
  stretta in sovrimpressione sul bordo destro del fondale (non una riga in
  più). Il doppio turno si vede prima che succeda.
- **Gli effetti si contano nei turni di chi li porta**: il veleno brucia al
  turno del mostro avvelenato, lo stordito salta i suoi prossimi N turni, la
  protezione dell'eroe cala ai turni dell'eroe (all'inizio di ognuno: N turni
  dell'eroe anche se ne gioca due di fila).

## Il turno dell'eroe

- **Si sceglie cosa fare**: Attacco, le tre abilità delle caselle, Bevi,
  Scappa (la scelta di oggi, `CaselleAbilita.vue`).
- **Il bersaglio è già scelto**: lo stesso di prima se è in piedi, se no il
  più ferito in proporzione. Toccando un altro mostro lo si cambia
  (`scegliBersaglio`). Prima di rispondere si accendono tutti quelli che il
  colpo prenderà (`foglio.colpiti`).
- **Poi la domanda.** Giusto: il colpo parte e l'abilità si paga. Sbagliato:
  il colpo va a vuoto, l'abilità resta pronta e non costa, il turno è
  passato. Una domanda per turno che colpisce: bere e scappare non ne
  chiedono.
- **Bere costa il turno** (la pozione rossa, `beviNelloScontro`, anche dallo
  stop); la blu come oggi, gratis.
- **Scappare ha un costo fisso**: un colpo solo, del mostro più forte in
  campo, quanti che siano (`costoFuga`, con gli effetti: uno stordito non
  conta). Non si offre se quel colpo farebbe svenire (`puoScappare`).
  L'utente: «non dobbiamo obbligarlo a morire, è un gioco per bambini».
  Dopo, la `CALMA` di oggi vale per tutti quelli che erano in campo.

## Le forme dei colpi

Ogni abilità ha una **forma** (`forma` in `dati/abilita.js`); l'attacco
solito è «uno».

| forma | chi prende | esempio |
|---|---|---|
| `uno` | il bersaglio | Stoccata |
| `vicini` | il bersaglio e i due accanto, fra i vivi nell'ordine dei posti | la palla di fuoco |
| `catena` | il bersaglio, poi salta su altri (`salti`), ogni salto ×0,7 | il fulmine a catena |
| `tutti` | tutti in campo | Grido di guerra, Turbine |

- Gli effetti vanno a tutti quelli presi, col loro danno.
- **Il salto della catena** va sul vivo più vicino, nei posti, all'ultimo
  colpito (a parità quello dopo), mai due volte sullo stesso.
- Le abilità di oggi con `stanza: true` sono diventate `tutti` (solo il
  Grido di guerra), le altre `uno`. Le forme `vicini` e `catena` il motore le sa
  fare subito (provate con abilità finte in `unita/sotterraneo-gruppi`); le
  abilità nuove che le usano arrivano con l'albero più ricco.
- Provato «solo uno» e «solo tutti»: l'utente, «se forziamo area completa/singolo temo che ci perdiamo delle opportunità».

## Il turno dei mostri

- **Un mostro colpisce in base alla difesa, non alla risposta** (l'utente).
  Le risposte servono ad attaccare: sbagliando perdi il turno, e intanto i
  mostri colpiscono lo stesso. Così l'agguato, la difesa e le cure diventano
  scelte: il mago decide se mettere tutto sull'intelligenza o reggere di più.
- **Il colpo**: `COLPO_DEL_MOSTRO` × (attacco − difesa), almeno 1, con gli
  effetti (`danno`, `botta`). La protezione (parato, o i primi colpi di Testa
  dura) lo dimezza una volta sola, il gelo ancora; la Parata ne toglie qualcuno;
  la schivata vale per ogni colpo. Il valore è **0,8**: vedi «Il bilancio».
- **Sotto il mostro**: «ti colpisce 3» (`foglio.minaccia`). Spariscono «se
  sbagli» e il graffio.
- **Uno alla volta, in ordine**, con la sua animazione corta; un tocco la
  accorcia. Il motore li fa tutti dentro `rispondi` e li racconta in
  `esito.azioni`.
- **Un mostro agisce con «un'azione»** (`AZIONI_DEI_MOSTRI` in
  `motore/scontro.js`, `azione` della scheda in `dati/mostri.js`): oggi sempre
  il colpo; il grosso che chiama dei sottoposti si aggiunge lì.

### Le abilità che dipendevano dalla risposta

Riscritte (gli id restano: sono chiavi del salvataggio):

- **`parato`** (Scudo alzato, Danza delle lame): **i colpi presi fanno metà per
  N turni dell'eroe**.
- **`testaDura`** (Testa dura): i primi N colpi di ogni scontro fanno metà.
- **`quieto`** (Freccia mirata): il bersaglio salta il suo prossimo turno.
- **`primoTiro`** (Primo tiro): l'elfa con l'arco **agisce per prima** in
  ogni scontro, prima anche della fila (ma dopo un agguato), e il suo primo
  colpo ha il bonus di danno.
- **Il veleno «anche sbagliando»** brucia al turno del mostro, quindi resta
  vero da sé.
- **`fermo` e `debole`** valgono N turni del mostro (Radici: `esposto` cala con
  lui). **`graffioMeno`** (Parata) toglie N a ogni colpo preso, fino a zero.
- Specchio, scudo, linfa, intoccabile, Ultimo fiato: uguali, contati nei
  turni.

## Le caratteristiche

L'utente vuole che un mago possa diventare **mago guerriero**: la spada e ogni
tanto un incantesimo. Oggi l'attacco viene dall'arma in mano e tutte le
abilità colpiscono con quello. La regola nuova (`attDelRamo`):

- **Un ramo d'arma colpisce con l'attacco della sua arma**: il fuoco e il
  gelo con la bacchetta, anche se la bacchetta sta nella mancina (intera, non
  a metà come la seconda arma: braccio + caratteristica della sua famiglia +
  la bacchetta + corpo e dito). Un mago con la spada in mano e la bacchetta
  nella mancina attacca di spada (forza) e incanta di bacchetta (intelligenza).
  Con l'arma in mano è l'attacco solito.
- **Un ramo senz'arma colpisce con la sua caratteristica** (`car` del ramo):
  Arcano l'intelligenza, Bosco la destrezza, Giuramento e Pietra la forza. Un
  cavaliere col Grido o un mago col Fulmine non dipendono dall'arma che hanno
  in mano; il suo bonus d'attacco però conta ancora (braccio + caratteristica
  del ramo + roba).
- **Cosa fa ognuna**:

| | attacco con | e poi |
|---|---|---|
| Forza | spade, asce, mazze; i rami Giuramento e Pietra | il requisito di armature e scudi pesanti (con la luce nuova o l'albero più ricco) |
| Destrezza | archi; il ramo Bosco | la schivata, **la velocità** |
| Intelligenza | bacchette; il ramo Arcano | l'energia |
| Tempra | — | la vita e la difesa |

- La regola del bilanciamento fra due caratteristiche
  ([livelli.md](livelli.md)) aiuta chi divide i punti, quindi il mago
  guerriero non resta indietro. I requisiti delle armi restano rigidi.
- Il requisito di forza delle armature pesanti dà un uso della forza anche al
  mago ([da-fare.md](da-fare.md)): non è di questo lavoro. La pagina dell'eroe
  non dice ancora la velocità fra le cose che la destrezza cambia.

## Lo stop del pericolo

Come oggi ([pericolo.md](pericolo.md)), con una differenza: si guarda quando
tocca all'eroe, anche al primo turno, e conta **la somma dei colpi che
arriveranno prima del suo prossimo turno** (`colpiInArrivo`: la fila li sa; uno
stordito non conta). Due fermate per scontro al più, la riga rossa sopra la
scelta, le stesse scelte (bevi, scappa, continua). Se un eroe veloce gioca due
volte prima del mostro, la somma è zero.

## Il bilancio

`COLPO_DEL_MOSTRO` vale **0,8** e le velocità sono quelle della tabella qui sopra; come ci si è arrivati, le
misure e cosa resta da guardare: [scontro-bilancio.md](scontro-bilancio.md).

## L'interfaccia per la vista

Per chi rifà `Scontro.vue`, `Palco.vue` e `CaselleAbilita.vue`. Tutto sta in
`Corsa.foglio` (`che: 'scontro'`) e nelle funzioni di `Corsa`; un mostro è l'oggetto
del piano (`ossa`, `ossaMax`, `tipo`, `grosso`, `morto`, `stati`). `foglio.chi` resta
uguale al bersaglio, quindi il duello di oggi funziona.

- `chi` — il bersaglio di adesso; `scegliBersaglio(m)` lo cambia.
- `campo` — i mostri in campo, **nell'ordine dei posti** (per distanza
  all'ingresso, il primo è chi ha aperto lo scontro); chi cade resta al suo posto
  con `morto: true`. `postiDi(m)` (da `motore/scontro.js`): 1, o 2 per il grosso.
- `colpiti` — `[{ chi, fattore }]`: chi prenderebbe la scelta preparata
  (`Corsa.pronta`, `prepara(id)`), o l'attacco; `fattore` 1, o ×0,7 a salto.
- `turni` — `[{ chi: 'eroe' | mostro, salta }]`: i prossimi sette; `salta` per lo stordito.
- `minaccia` — `[{ chi, colpisce, salta }]`: «ti colpisce N» per ogni vivo.
- `inArrivo` — la somma dei colpi prima del prossimo turno (lo stop).
- `apertura` — le azioni prima del primo turno (l'agguato con `agguato: true`,
  i mostri più veloci); `agguato`, `sorpresa` — booleani.
- `io` — gli effetti sull'eroe: `parato`, `scudo`, `intoccabile`, `specchio`,
  `linfa`. `pericolo`, `fermate` — lo stop, come prima. `stati` di un mostro:
  `veleno {quanto, scambi}`, `debole`, `fermo`, `esposto {scambi, piu}`, `rotto`;
  `scambi` conta ora i turni **del mostro**.
- `Corsa`: `rispondi(giusto)`, `prepara(id | null)`, `beviNelloScontro()`,
  `beviNelPericolo()`, `continua()`, `scappa()`, `costoFuga()`, `puoScappare()`,
  `botta(m)` (il colpo di quel mostro adesso), `danno(m)`, `colpo(m, nodo)`,
  `descrizione(nodo, m)`, `velocita`.
- **L'esito** di `rispondi` e di `beviNelloScontro` (null senza scontro):
  `azioni` — **in ordine**, da animare una alla volta — `caduti`, `fine` (lo
  scontro si è chiuso), `ringhia` (lo stop che comincia), e in cima i campi di
  oggi (`che`: `colpo`, `ferito`, `caduto`, `bevuto`, `svenuto`; `dato`, `preso`,
  `usata`, `colpiti`, `veleno`, `salvo`, `gelato`, `assorbito`, `schivato`…).
- **Un'azione**: dell'eroe `{ chi: 'eroe', che: 'attacco' | 'abilita' | 'sbaglia' | 'bevi',
  usata, forma, bersaglio, colpiti: [{ chi, dato, caduto, effetti, fattore }], base, volte,
  primoTiro }`; di un mostro `{ chi: mostro, che: 'colpo' | 'salta' | 'veleno', contro: 'eroe',
  pieno, preso, schivato, assorbito, rimandato, gelato, salvo, agguato, caduto, svenuto }`.

## La vista

- **Il fondale di oggi**, l'eroe a sinistra con **un posto vuoto sotto per il compagno** (in futuro), i mostri a destra in
  due file da tre; il grosso grande al centro. Le file a schermo non sono regole: davanti o dietro non conta (l'utente:
  «aggiunge un'altra complessità a logiche già difficili da calibrare»).
- **Sotto ogni mostro la sua barretta, senza numeri**, e «ti colpisce N». Il bersaglio ha un anello d'oro, chi verrà
  colpito un contorno. **La colonna dei turni** sul bordo destro, le figure piccole, chi agisce adesso più grande.
- Le animazioni di oggi (chi colpisce scatta, i numeri salgono, il glifo vola) per ogni azione; una per ogni abilità e per
  gli stati arriva con l'albero più ricco.

## Le domande

Il tetto resta: **85 risposte obbligate a seduta** (`unita/sotterraneo`): i mostri in gruppo picchiano di più, ma un colpo
ad area ne prende tanti con una domanda sola. Il giocatore finto (`motore/banco.js`) attacca il bersaglio che il motore
sceglie finché non cadono tutti; non usa le abilità, non beve né scappa dentro uno scontro.

## Cosa resta fuori (per dopo)

- **Il compagno dell'eroe**: ogni attore della fila ha un `lato`, quindi è un attore in più; `passaIlTurno` oggi si ferma
  al primo del lato dell'eroe e andrebbe insegnato a lui.
- **Le abilità dei mostri** (il grosso che chiama dei sottoposti): la porta c'è, `AZIONI_DEI_MOSTRI`.
- **Prima e seconda fila**: scartate. **Il segno di chi arriva alle spalle**, se l'agguato risulta troppo duro.
- **Uscire a metà** (la ✕, il portale): la sosta salva i mostri come sono (ossa e stati) e non lo scontro, che si riapre da
  capo, come con il duello.
