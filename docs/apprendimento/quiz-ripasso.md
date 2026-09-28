# Il ripasso nei quiz

Come le risposte ai quiz si annotano e come spostano la pesca: la banda
stretta di `src/quiz/nucleo/bisogno.js`, le chiavi dei concetti, e le
tipologie. Il motore sotto è [srs.md](srs.md).

## Le chiavi: il concetto, non la domanda

- **Ogni domanda porta la chiave della sua tipologia** (`orto:gn`,
  `gri:perimetro`), e ogni risposta finisce in `store/srs.js` sotto quella
  (`annota` in `quiz/memoria.js` → `answer` di `store/profile.js`). Così il
  ripasso segue *cosa non sa* il bambino, non *quali domande ha visto*.
- **Stesso cassetto di tabelline e parole inglesi** (`profile.items`), e
  tutto quello che lo legge lo fa per prefisso (`en:`, `math:`,
  `pozioni:`…): **un prefisso nuovo si sceglie guardando
  `store/progressi.js`**, dove stanno quelli presi (`verbo:` era già dei
  verbi inglesi).
- **Nessuna materia nuova in `progressi.js`**: una padronanza vuole un
  `totale`, e le tipologie non sono un elenco chiuso di cose da imparare.
- **Gli id non si rinominano**: sono le chiavi dello stato, e cambiarli fa
  tornare una cosa «mai vista».
- `memoria.js` è l'unico file di `src/quiz/` che conosce il profilo, e legge
  `state.profile.items` a mano: `item()` creerebbe centotrenta elementi
  vuoti a ogni pesca.
- **Non si annota** senza `origine` (una domanda fuori dal giro) né dalla
  palestra dei grandi (`gioco: 'prova'`): lì si guarda, non si esercita
  nessuno.

## La banda stretta: 1.5 e 0.5

`bisognoDa` traduce lo stato SRS in quante volte più spesso deve uscire una
tipologia, dentro `BISOGNO = { min: 0.5, max: 1.5 }`: va male → 1.5, saputa
→ 0.5, **mai vista → 1.0** (neutro, non urgente: lo scarto nasce giocando).

- **Perché così poco.** Negli asteroidi il gioco *è* lo studio, e `weight()`
  di `srs.js` va da 0,35 a oltre 7; qui la domanda è il pedaggio di un gioco
  d'avventura, e una partita di sola geometria a chi va male in geometria
  sarebbe una punizione. Con dieci cose in ballo: dal 10% al 15% e al 5%,
  tre a uno fra gli estremi.
- **Si usa la forza, che decade, e mai `isMastered`**: niente esce dal giro,
  niente si dichiara imparato. Il tetto di «saputo» è `masterS`, non la
  forza massima.
- **Non si spegne**: non toglie né aggiunge domande, sposta solo la
  frequenza. Quello che si spegne sono i saperi ([saperi.md](saperi.md)).

## Il conto a due livelli

La classe (modulo, grado) usa la **media** dei bisogni dei suoi tipi, il
tipo il proprio: il prodotto torna lineare. Col fattore pieno tutte e due le
volte il rapporto diventerebbe il quadrato (nove a uno invece di tre) e la
banda non varrebbe più niente.

Il nucleo gira in Node e non importa il profilo: riceve il bisogno come
**funzione passata a mano** (`scelta.js` la prende da `memoria.js`,
`ilBisogno`). Senza, pesca neutro: è così che banco e palestra dei grandi
non ne risentono.

Nei test: `unita/quiz-ripasso` (conta esattamente il tre a uno).

## Le tipologie

La tipologia è l'unità di tutto: la chiave del ripasso, la sottovoce che un
grande spegne o ritocca, la riga di «Come va». Come si dichiarano sta in
[quiz-moduli.md](quiz-moduli.md); cosa danno per scontato (`sa`) in
[saperi.md](saperi.md).
