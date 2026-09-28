# La grafica

Cosa c'è in `src/grafica/` e le regole per disegnare: la tela e la
telecamera, i pittori, gli scheletri dei personaggi, gli sprite e le
tessere.

## La regola di fondo

**Chi gioca non disegna.** Una view passa a `tela.disegna()` la lista delle
cose in scena (`{ che: 'torre', x, y, tipo, lv }`); una figura nuova è una
riga in `PITTORI`, mai un `ctx.arc` dentro il gioco. E in `grafica/` non
entrano energia e prezzi: solo fatti già decisi (`potenziabile: true`).

## I pezzi

- **`tela.js`** — canvas, sfondo in cache, ordinamento per profondità, e la
  **telecamera**: un mondo dichiara misure e scala, e la tela lo incornicia
  dove c'è posto. È così che il castello resta lo stesso su ogni schermo.
- **`geometria.js`** — i tracciati: l'unico posto dove gioco e disegno
  devono essere d'accordo su dove passa la strada.
- **`castello.js`** — i pittori, nella tabella `PITTORI`.
- **`spazio.js`** — il cielo degli asteroidi (nave, pianeta, sassi, raggi):
  riceve `danno: 0.5`, non sa che esistano le vite.
- **`corpo.js`** — **lo scheletro**: `persona()` per chi cammina su due
  gambe, `bestia()` per tutti gli altri. Chi lo usa scrive una *scheda di
  dati* e si ritrova ombra, respiro, lampo bianco della botta e
  ribaltamento da ko senza chiederli. Le schede stanno in tre cassetti:
  - `personaggi/` — il Generale;
  - `castello/corpi-mostri.js` — il tower defense;
  - `bestiario/` — il dungeon: venti creature viste **grandi e di fronte**,
    dove la paura la fa la forma e mai il macabro, con l'`ingombro` che le
    tiene dentro il riquadro.
- **`coriandoli.js`** — la festa. Dentro Vue si usa da `giochi/Festa.vue`,
  non si monta a mano.

**Un mostro del dungeon non è un'emoji.** Le emoji le disegna il telefono:
hanno lo stile di Apple in mezzo a uno schermo disegnato a mano, non si
tingono dell'ambiente e non tremano quando le colpisci.

**Un'icona si mette solo se aderisce perfettamente, se no si mette il
testo**: il vocabolario delle emoji è chiuso, e la domanda diventa «quale
somiglia di più» invece di «come si dice». Due icone della stessa famiglia
visiva non compaiono mai nella stessa domanda.

## Gli sprite e le tessere

Per disegnare con fogli di figure invece che coi poligoni:

- **`atlante.js`** — un foglio di figure e come si posano: il piede, lo
  specchio, la scala intera. Gli atlanti li genera
  `strumenti/sprite/atlante.py` (vedi [sprite.md](sprite.md)).
- **`tessere.js`** — *quale* tessera va in una cella, ricavata dai vicini
  (strade, pozze, recinti). Niente canvas: gira in Node e si prova in
  `unita/tessere`.
- **Una strada vuole etichette, non un sì/no per lato.** La seconda metà di
  `tessere.js` tratta il bordo come un'etichetta — *dove* passa, non *se*
  passa (`·`, `c`, `sx`, `dx`): sono le *Wang tiles*. `componiPercorso`
  sceglie le tessere come si risolve un sudoku. Gli attacchi non si
  dichiarano: li **misura** dal foglio `strumenti/sprite/terreni.py`, che
  misura anche la griglia dall'alfa a ogni giro.
- **Il calco da guardare** è `giochi/sotterraneo/scena/tela.js`. La forma
  dei muri però viene da `scena/muri.js`: a tre quarti la faccia di un muro
  non è il bordo di una zona, è una cella intera che si vede da una parte
  sola (la regola sta in [`../sotterraneo/`](../sotterraneo/README.md)).

## Le misure

- **La scala sta nella trasformazione del contesto** (`dpr × scala`, una
  volta per fotogramma), e da lì in poi tutto è in pixel dello sprite. Chi
  la moltiplica riga per riga prima o poi la moltiplica due volte, ed è
  invisibile a figura piccola.
- **Un mondo a tessere vuole ingrandimenti interi**, se no gli sprite si
  sfrangiano. Quando il campo è più largo dello schermo e la scala intera
  taglierebbe la mappa, si tiene intera **la cella in pixel dello
  schermo**, non la scala (`giochi/castello/scena/tela.js`).
