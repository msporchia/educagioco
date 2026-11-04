// La bottega del mercante (in prova): le ampolle a prezzo, la pulizia e
// le tappe di prova. Le regole in docs/pozioni/bottega.md.

// I pezzi che il mercante vende, in multipli dell'unità grande (valgono
// per tutte e tre le famiglie), e quanti gettoni costano: i grandi
// costano meno al chilo, come al mercato. Il più piccolo divide tutti
// gli altri, così ogni dose a passi di 0,05 si compone.
export const PEZZI = [0.05, 0.1, 0.2, 0.25, 0.5, 1]
export const PREZZO = { 0.05: 1, 0.1: 1, 0.2: 2, 0.25: 2, 0.5: 3, 1: 4 }

export const PULIZIA = 1            // gettoni per pulire una macchia (una per misurino traboccato)
export const MONETE_A_DOSE = 3      // un ingrediente finito senza traboccare (docs/apprendimento/calibrazione.md)

// Le dosi, in multipli dell'unità grande, per famiglia
export const DOSI = {
  massa: [0.8, 1, 1.2, 1.5, 2, 2.5],
  lunghezza: [0.6, 0.8, 1.2, 1.5],
  capacita: [0.75, 1, 1.25, 1.5, 2],
}

// Le tappe di prova. `margine` sono i gettoni oltre il minimo; `manca`
// dice sulla pergamena quanto manca (la sottrazione la fa il gioco);
// `gemelli` è il trucco del mercante (la stessa quantità scritta in
// un'altra unità, a un altro prezzo); `ricettaInGrande` scrive la dose
// sempre nell'unità grande; `ordine` quante ampolle si chiedono al mercante
// in una volta.
export const PROVE = [
  { chiave: 'mercante-1', nome: 'Dal mercante', dritta: 'Due ingredienti e gettoni in abbondanza.',
    famiglie: ['massa', 'capacita'], ingredienti: 2, margine: 8, manca: true, ordine: 2,
    gemelli: true, ricettaInGrande: true },
  { chiave: 'mercante-2', nome: 'Il mercante furbo', dritta: 'Tre ingredienti, e il mercante scrive come gli pare.',
    famiglie: ['massa', 'capacita', 'lunghezza'], ingredienti: 3, margine: 5, manca: true, ordine: 3,
    gemelli: true, ricettaInGrande: true },
  { chiave: 'mercante-3', nome: 'Gettoni contati', dritta: 'Quattro ingredienti, quanto manca lo conti tu.',
    famiglie: ['massa', 'capacita', 'lunghezza'], ingredienti: 4, margine: 2, manca: false, ordine: 3,
    gemelli: true, ricettaInGrande: false },
]
