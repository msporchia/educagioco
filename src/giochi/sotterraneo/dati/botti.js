// Le botti da rompere (docs/sotterraneo/paesaggi-3d.md, «Le botti»): un passatempo come in Diablo, solo nel Sotterraneo 3D.
// Quante ne ha ogni paesaggio e cosa lasciano. Dato puro: lo leggono il motore (motore/botti.js) e il disegno (scena3d/botti.js).

// quanto hanno senso in ogni paesaggio. `stanze`: la probabilità che una stanza ne abbia; `magazzino`: che una di quelle sia un
// magazzino (più gruppi); `accampamento`: una stanza sola in tutto il piano (la grotta: un vecchio accampamento); `legno`: la
// tinta (nuove, vecchie e grigie, marce e muschiose). Il ghiaccio, la neve, l'inferno e la fornace non ne hanno: lì non c'entrano
export const BOTTI_PER_PAESAGGIO = {
  cantine: { stanze: 0.25, magazzino: 0.3, legno: '#b08a60' },
  miniera: { stanze: 0.22, magazzino: 0.25, legno: '#a07a52' },
  palude: { stanze: 0.12, magazzino: 0, legno: '#6a6a40', muschio: true },
  cripta: { stanze: 0.06, magazzino: 0, legno: '#7a7268' },
  tempio: { stanze: 0.06, magazzino: 0, legno: '#6a7a72', muschio: true },
  grotta: { accampamento: 0.5, legno: '#8a6e50' },
}

// cosa lascia una botte rotta: una su `ogni` lascia qualcosa di piccolo e basilare, mai roba da mettersi addosso. Il tiro nasce
// dal seme, dal piano e dalla botte (rompere e riaprire non lo rifà). Da ricalibrare coi giocatori tipo prima di accenderle nel
// gioco normale (docs/sotterraneo/da-fare.md)
export const PREMI_DELLE_BOTTI = {
  ogni: 5,
  premi: [
    { che: 'cosa', cosa: 'pozione-piccola', peso: 1 },   // la pozione più piccola del gioco
    { che: 'gemme', quante: [1, 2], peso: 1 },          // uno o due diamantini
  ],
}
