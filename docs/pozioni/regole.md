# Le regole del laboratorio

Come è fatto il laboratorio delle pozioni: gli attrezzi, la scaletta, gli
aiuti, gli sbagli e cosa va al motore di apprendimento. Il gioco sta in
`src/giochi/pozioni/`, secondo la convenzione dei giochi nuovi
([../core/convenzione-giochi.md](../core/convenzione-giochi.md)).

## Gli attrezzi: la scelta è il gioco

- **Un attrezzo conta in una unità sola, e arriva fin lì**
  (`src/giochi/pozioni/dati/misure.js`). La ricetta parla come le pare
  («1,5 kg», «35 hg», «6000 g»): si legge l'unità, si sceglie un attrezzo
  su cui la dose ci sta, e si traduce nell'unità in cui quell'attrezzo
  conta. Qualunque attrezzo su cui la dose si compone va bene.
- **Tre famiglie con la stessa forma**: un'unità grande (G), una di mezzo
  (M), una piccola (P), e un attrezzo per taglia (`TAGLIE`):

| taglia | conta nella | arriva a | pesi · lunghezze · liquidi |
|---|---|---|---|
| P | piccola | 5 grandi | bilancia da cucina (g) · metro a nastro (cm) · caraffa graduata (ml) |
| M | media | 20 grandi | bilancia del mercato (hg) · corda a spanne (dm) · brocca a bicchieri (dl) |
| G | grande | 100 grandi | bilancia del magazzino (kg) · rotella da cantiere (m) · botte (l) |

  Non sono la stessa scala: fra chilo e grammo tre scalini, fra metro e
  centimetro due — il centimetro è quello del righello. Il motore conta
  gli scalini invece di darli per scontati (`scalini` in
  `src/giochi/pozioni/motore/misura.js`).
- **I limiti sono il motivo di scegliere**: otto chili sulla bilancia dei
  grammi non ci stanno, e la tappa in cui arriva la bilancia degli etti
  esiste per far capire che quando i chili sono tanti si sale di unità.
- **Il pezzo più piccolo divide tutti gli altri**, ed è intero nell'unità
  dell'attrezzo (`guastiDelleMisure`): è la condizione perché «prendi
  sempre il pezzo più grande» componga ogni dose che ci sta (`scomponi`) e
  perché «ci sta» voglia dire solo «nel limite e multiplo del pezzo
  piccolo» (`componibile`). Un peso da mezzo etto su una bilancia che conta
  in etti è un attrezzo che non si legge.
- **Fra uno scalino e l'altro c'è sempre un ×10**, se no «conta gli
  scalini» è una bugia.
- **Tutto è in unità base, come intero**: la virgola compare solo a
  schermo (`inUnita`, `scrivi`).
- **Niente disegnini che accoppiano**: nessun ingrediente è un recipiente
  (erano 🧪 e 🍯, uguali agli attrezzi, e l'attrezzo si sceglieva
  accoppiando le figure), e «quanto è grande» si dice a parole con una cosa
  che si ha in mano (`QUANTO_E`: un pacco di zucchero, una spanna, un
  bicchiere), non con un'icona.
- **Il tipo dell'ingrediente dice il gesto**: la polvere si pesa, il
  liquido si versa, la radice si taglia — ed è la prima cosa da sapere.

## La ricetta e lo scaffale

- **Sullo scaffale ci sono ingredienti che non c'entrano** (`scelta` ≥
  ingredienti + 1): la prima cosa da fare è leggere, come alla bancarella.
- **Due ingredienti della stessa ricetta non hanno mai la stessa dose**, e
  la dose non è mai quella della ricetta di prima: la stessa cifra due
  volte di fila sembra un gioco rotto (`generaRicetta`, `evita`).
- Il caso arriva da fuori (`rnd`), così una ricetta si rifà identica nei test.

## La scaletta: una cosa nuova per volta

Nove gradini scritti una volta sola e ripetuti per le tre famiglie
(`GRADINI` in `src/giochi/pozioni/dati/campagna.js`), in multipli
dell'unità grande e con `in` che dice in che unità la ricetta li scrive:

| | gradino | cosa chiede | aiuto |
|---|---|---|---|
| 1 | `banco` | «500 g»: scegli, posa, componi | `gioco` (come si gioca) |
| 2 | `grande` | «1 kg» sulla bilancia dei grammi | `svolto` |
| 3 | `grandi` | 2 kg, 5 kg | `regola` |
| 4 | `virgola` | 0,5 kg, 1,5 kg | `svolto` |
| 5 | `virgole` | le stesse, e 1,2 kg | niente |
| 6 | `media` | 8 kg, 12 kg: sulla bilancia dei grammi non ci stanno | `svolto`, e «usa la bilancia del mercato» |
| 7 | `miste` | la ricetta parla in tre unità | `regola` |
| 8 | `inversa` | «6000 g», e si sale agli etti | `svolto` |
| 9 | `inverse` | su e giù per la scala | niente |

- Poi due tappe finali (`FINALI`): **il grande calderone** (le tre famiglie
  nella stessa pozione) e **maestro alchimista**, l'unica con **tre
  attrezzi per famiglia** e le dosi da magazzino — nove attrezzi sul banco
  vanno bene a chi è esperto, non prima. Ventinove tappe in tutto
  (`CAMPAGNA`, `BLOCCHI` per la mappa).
- **Mai due attrezzi nuovi nella stessa tappa**, e fino alla penultima mai
  più di due per famiglia.
- **Ogni «senza aiuti» viene dopo il suo «svolto»**, e al sesto gradino
  l'attrezzo piccolo non ci arriva davvero.
- **La portata sale lungo la fila**: `PORTATA_DA` 44 i pesi (sette anni e
  mezzo, quando le misure entrano a scuola), 56 le lunghezze, 68 i liquidi,
  e un punto e mezzo a gradino (`PASSO_PORTATA`); 82 e 85 le finali.
- `guastiDellaCampagna` controlla che ogni dose si componga con gli
  attrezzi della sua tappa, e che ogni famiglia in scena abbia dosi.

## Gli aiuti, e lo sbaglio

- **Quanto si dice lo decide la tappa** (`aiuto`): `gioco` (come si
  gioca), `svolto` (il conto intero col risultato), `regola` (solo
  l'uguaglianza), `''` niente. Prima di prendere si parla della prossima
  dose della ricetta, così il cartello si legge guardando la pergamena
  (`aiuto` in `src/giochi/pozioni/motore/partita.js`).
- **Il conto svolto dice il gesto, sulla dose che si ha in mano**
  (`spiegazione`): l'uguaglianza sempre dalla grande alla piccola («1 kg =
  1000 g»), gli scalini, il verso e la catena («1,5 → 15 → 150 → 1500 g»).
  Sugli interi «aggiungi 3 zeri», perché a chi legge «2 kg» la virgola non
  si vede; al contrario si tolgono gli zeri se ci sono tutti, se no la
  virgola va a sinistra.
- **Dove l'attrezzo piccolo non ci arriva il cartello lo dice prima di
  posare** (`consigliato`, `consiglia`: «usa la bilancia del mercato, che
  conta in hg»).
- **Uno sbaglio riporta il conto svolto per intero**, a qualunque gradino:
  si dice il perché *e* come si fa. Ogni sbaglio ha le sue parole
  (`perche`): l'ingrediente che non è nella ricetta, la polvere nella
  caraffa («la polvere si pesa, non si versa»), l'attrezzo troppo piccolo
  («arriva fino a 5 kg»), la dose che non cade sul segno, troppo o poco.
- **Dopo un esito si sta fermi a leggere**, con la barra che dice quanto
  manca: la stessa attesa dei quiz (`attesaDellEsito`, `PONDERA` in
  `src/quiz/nucleo/domanda.js`).
- **Troppo o poco** svuota l'attrezzo e lo lascia lì; un attrezzo sbagliato
  rimette l'ingrediente in mano.

## Senza fretta e senza cuori

- **Il tempo non è un avversario**: niente pazienza del cliente, niente
  cuori, niente ⏸ (un ⏸ dove non scorre niente è un tasto che non fa
  niente). **La tappa si finisce sempre**, e a cambiare sono le stelle:
  tre senza sbagli, due con uno sbaglio ogni quattro dosi al massimo, una
  comunque (`stellePer`). Provato: la pazienza che scende, i cuori e la
  mancia 👑 del cliente esigente — con una barra che calava sopra un
  cartello da leggere, si imparava a non leggere.
- **Tre monete per dose azzeccata al primo colpo** (`MONETE_A_DOSE`): una
  dose è una domanda vera, letta e ragionata. Una dose sbagliata non paga
  (vedi [../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).
  Le monete le sa solo `Gioco.vue`.

## Cosa va al motore di apprendimento

- **Conta il primo tentativo** di ogni dose che chiede una conversione,
  sotto la chiave della coppia di unità **nel verso** in cui la si è fatta
  (`chiaveDi`: `pozioni:kg-g` e `pozioni:g-kg` sono due cose diverse da
  sapere). Le coppie possibili sono `CONVERSIONI` in
  `src/giochi/pozioni/gioco.js`.
- **Le dosi col conto svolto non si segnano**: il risultato era scritto.
  Dopo il primo sbaglio su una dose non si annota più niente, e la dose
  giusta arrivata dopo gli sbagli non si segna come saputa.

## Il calderone

Ogni dose azzeccata ci finisce dentro, gli ingredienti restano a galla a
dire cosa è già fatto, e il brodo prende il colore mescolato: **media
geometrica dei canali** (`mescola`), perché giallo e blu devono fare verde
e la media aritmetica farebbe grigio. Non conta niente: serve a far vedere
che quella dose è servita a qualcosa.

## Il manifesto

- **La chiave resta `pozioni`**: è quella con cui i genitori l'hanno
  acceso o spento, e quella dei saperi. L'avanzamento sta in
  `profile.campagne.pozioni` e riparte da capo sulla campagna nuova.
- **I contatori hanno i nomi di sempre** (`misure`, `pozioni`,
  `pozioniPerfette`), così l'albo non torna a zero.
- **`serve: ['misure', 'conversioni']`**: senza, il gioco non è difficile
  ma impossibile, quindi la carta si spegne. `grandi: true`.

## Il dito

L'ingrediente si trascina dallo scaffale all'attrezzo; se il dito si stacca
senza essersi mosso è un tocco, l'ingrediente resta in mano e si posa
toccando l'attrezzo. Il click fantasma dopo un trascinamento si ingoia (vedi
[../core/il-dito.md](../core/il-dito.md)).

Nei test: `unita/pozioni` (gioca tutte le tappe), `integrazione/pozioni`
(un trascinamento vero, `touchStart`·`touchMove`·`touchEnd` via CDP);
`.carta.gioco[data-gioco="pozioni"]`, `.pz-tappa[data-tappa]`,
`.pz-banco[data-fase]` (`scaffale`·`inMano`·`dosa`), `[data-voce]`,
`[data-dose]`, `.pz-ingrediente[data-ingrediente]`, `[data-strumento]`,
`[data-pezzo]`, `[data-lettura]`, `[data-azione="conferma"|"togli"|"svuota"|"riponi"]`,
`[data-esito][data-codice]`, `[data-spiegazione]`, `[data-aiuto][data-livello]`,
`[data-consiglio]`, `[data-procedimento]`, `[data-fine="tappa"]`,
`[data-stelle]`, `[data-monete]`, `[data-azione="avanti"|"mappa"]`.
