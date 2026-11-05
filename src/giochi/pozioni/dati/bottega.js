// La bottega del mercante: le ampolle a prezzo e la pulizia. Le regole
// in docs/pozioni/regole.md.

// I pezzi che il mercante vende, in multipli dell'unità grande, e quanti
// gettoni costano: i grandi costano meno al chilo, come al mercato. Per
// le dosi grandi tutto il listino sale di un fattore dieci o cento
// (`scala`) e i prezzi restano piccoli: la fatica sta nelle unità, non nei
// soldi. Il più piccolo divide tutti gli altri, così ogni dose si compone.
export const PEZZI = [0.05, 0.1, 0.2, 0.25, 0.5, 1]
export const PREZZI = [1, 1, 2, 2, 3, 4]

// Le tappe tonde (`tondi` nella campagna): solo 1, 2, 5 e 10 di qualcosa, sempre
// interi nell'unità della ricetta, così la testa sta sulla conversione.
export const TONDI = [0.1, 0.2, 0.5, 1]
export const PREZZI_TONDI = [1, 2, 3, 4]

export const AMPOLLE_A_ORDINE = 5   // quante ampolle ci stanno in un ordine
export const SPEDIZIONE = 1         // gettoni a ordine: comprare una cosa per volta non conviene
export const PULIZIA = 1            // gettoni per pulire una macchia (una per misurino traboccato)
export const PASTICCIO = 1          // gettoni per un'azione sbagliata del procedimento
