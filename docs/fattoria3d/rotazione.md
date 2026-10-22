# Ruotare i pezzi (e gli edifici)

Un pezzo o un edificio si gira di **un quarto di giro alla volta** (90°), attorno al centro della sua impronta. Prima (W6 di
[parita/mondo-e-stagioni.md](parita/mondo-e-stagioni.md)) i pezzi stavano come nascevano e gli edifici guardavano tutti verso +z.

## Come funziona

- **Lo stato.** Una cosa può avere `rot` (0–3, quarti di giro); assente vuol dire 0. Niente `VERSIONE_STATO` nuova: un vecchio stato
  non ha la chiave e si legge dritto. `normalizza` (`motore/stato.js`) tiene `rot` solo se è un intero e il tipo si gira
  (`rotLetta`: 9 → 1, `'2'`/NaN/oggetti → 0, mai un'eccezione); un campo con `rot` nello stato lo butta.
- **Cosa si gira** (`ruotabile` in `dati/rotazione.js`): tutto tranne il campo (quadrato, non ha un davanti), l'acqua (stagno,
  laghetto), i pezzi calpestabili (ponte, passerella, molo, molo girato: hanno già la versione girata, e la quota di chi ci cammina
  dipende dal lato lungo) e il porticciolo (sta sulla riva).
- **L'ingombro segue.** `motore.misure(tipo, rot)` scambia `w` e `d` se `rot` è dispari (`misureGirate`, in cache); `misureCosa(c)` lo
  fa per una cosa in mappa. `puoMettere`, `puoCompraEMettere`, `compraEMetti`, `mettiPezzo` e `spostaPezzo` hanno un `rot`;
  `_occupa`/`_libera` e chi misura una cosa (compagni.js per la panchina, `postoLibero` dei vicini, `celleDiServizio`) leggono `misureCosa`.
- **Girare costa come spostare** (🪙 1, `COSTI.spostare`); girare e spostare insieme costano una moneta sola; stesso posto e stessa
  rotazione non costano niente. Un pezzo nuovo si gira prima di pagarlo, gratis. Messo via nel magazzino, torna dritto.
- **`ruotaPezzo(id)`** (motore): gira di un quarto tenendo fermo il centro. A mezza cella si arrotonda «in fuori» (così quattro quarti
  di giro tornano dov'erano), se lì non ci sta si prova l'altro verso; se non ci sta per niente resta com'è, non paga e dice
  `occupato` (o `fuori-terreno`, `non-ruotabile`).
- **Il davanti gira** (`DAVANTI`): un edificio con `rot` 0 si serve dal lato +z, 1 dal +x, 2 dal −z, 3 dal −x; se il davanti è murato si
  serve dalla cornice, come prima. Il disegno è girato con `grp.rotation.y = rot · π/2` attorno al centro dell'impronta (il modello ha
  l'origine al centro); il fumo di un edificio gira col gruppo.

## Il gesto

Il pezzo da girare è **in mano**: sia il fantasma parcheggiato dal menu «Costruisci qui», sia un pezzo già messo sollevato tenendolo
premuto (0,45 s). Mentre è in mano, in basso a destra sopra la fascia «metti via» compare il tasto **↻** (64 px, arancio): **un tocco
con un secondo dito** (o, col fantasma parcheggiato, un tocco normale) gira il fantasma di un quarto attorno al suo centro, che resta
sotto il dito; al rilascio si costruisce o si sposta già girato (l'avviso dice «Girato»). Il tasto non c'è per i pezzi che non si girano.

Il tasto è un `<button>` sopra la tela, quindi un secondo dito non disturba il tocco che tiene il pezzo (la tela guarda i suoi
pointer); reagisce al `pointerdown`, non al `click` (un click arriverebbe dopo il rilascio e il pezzo non sarebbe più in mano).

## Cosa non c'è

- Il rovesciamento ⇄ della 2D (specchio): in 3D un pezzo girato di 180° guarda dall'altra parte, lo specchio non servirebbe a niente.
- Gli snapshot dei vicini (`dati/vicini.js`) non portano la rotazione: una fattoria visitata mostra i pezzi dritti.
- Un pezzo con una bestia dentro (recinto, pollaio, stalla) o un campo che cresce si può girare: non lo si mette via ma lo si muove già.

## Nei test

`unita/fattoria3d-rotazione` (cosa si gira, misure girate, ingombro che segue, rifiuto senza costo, quattro giri tornano dritti, stato e
vecchi stati, `normalizza` con valori sporchi, il gruppo che gira, il davanti, il fantasma e il tasto), `integrazione/fattoria3d` (blocco
«ruotare»: pressione lunga, secondo dito sul tasto, rilascio). Bersagli: `[data-f3="ruota"]` (con `data-rot`).
