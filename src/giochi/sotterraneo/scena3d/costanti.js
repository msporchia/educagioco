// I numeri del sotterraneo in 3D: telecamera, luce, misure dei pezzi. Il perché di ognuno sta in
// docs/sotterraneo/grafica-3d.md (i valori vengono dal prototipo approvato, poc/sotterraneo-luce.md). Dato puro.

// la telecamera: non si dà la distanza ma quanto si vuole vedere (almeno `celle` in largo e in profondo attorno
// all'eroe); la distanza viene dalla forma dello schermo. Provati 55°/~6 celle e 43°/~8 celle: troppo addosso
export const CAMERA = {
  inclinazione: 52,      // gradi sotto l'orizzonte
  fov: 34,               // apertura verticale
  celle: 15,             // quante celle si vedono almeno, in largo e in profondo
  celleScontro: 9.5,     // nello scontro la telecamera si avvicina
  guarda: 0.35,          // il punto guardato: poco sopra il pavimento
  zoomMin: 0.7, zoomMax: 1.4,   // il pizzico e la rotella
}

// la luce: senza questi minimi il primo giro era troppo tetro
export const LUCE = {
  esposizione: 1.4,
  ambiente: 2.6,         // l'emisferica, solo dentro quello che si vede (la maschera spegne il resto)
  minimoFigure: 0.32,    // le figure non scendono mai sotto questa frazione del loro colore
  rim: 0.55,             // il contorno caldo che stacca le figure dal fondo
  alone: 9, cono: 40,    // la torcia dell'eroe: l'alone corto senza ombre e il cono che le fa
  ombra: 0.75,           // le ombre non sono mai nere
}

export const ALTO_MURO = 1.25
export const PARAPETTO = 0.32       // un muro con il pavimento a nord sta fra la telecamera e la stanza: basso
export const ALLUNGA = 1.3          // le figure stanno ritte: lo schiacciamento della vista dall'alto lo ripaga questo
export const PIXEL_CELLA = 16       // i pixel di sprite in una cella (dati/mondo.js, T)

export const N_FUOCHI = 6           // le luci delle torce, dei bracieri, della fonte e del portale: una riserva fissa
export const MAX_LUCI = 8           // quelle che nebbia, polvere e acqua sommano a mano
export const FETTE = 5, POLVERE = 450, SCINTILLE = 1500
export const FIGURE_MAX = 700       // le figure dell'atlante in scena nello stesso fotogramma
export const ALONI_MAX = 96         // i chiarori per terra (rarità, missione, chiave, scala che sale)

// il pixel ratio si adatta: parte da `max`, scende a passi se un fotogramma costa più di `lento` ms, risale piano sotto `svelto`
export const DPR = { max: 1.5, min: 0.6, lento: 26, svelto: 15 }

// Il punto unico dove si spegne un pezzo (docs/sotterraneo/grafica-3d.md, «Quanto costa»): oggi tutto acceso, una qualità
// sola. Un domani un telefono che non regge si aggiusta qui, senza cercare i pezzi nei file
export const ACCESI = {
  ombre: true,       // l'ombra del cono (una passata sola)
  nebbia: true, polvere: true, scintille: true, fiamme: true,
  acqua: true,       // lo shader dell'acqua (fontana e pozze); spento resta un piano scuro
  post: true,        // il passaggio finale (vignetta, colore, grana, scossa); spento si disegna dritto sullo schermo
  botti: true,       // le botti di decoro
  arredo: true,      // l'arredo modellato del paesaggio (scena3d/arredo3d.js)
}

// lo scontro: quanto agio vogliono i combattenti dai muri e dalle cose posate, e i posti dei mostri attorno al centro
export const AGIO = 1.2
export const POSTI = [[1.0, 0], [1.7, -0.85], [1.8, 0.85], [2.6, 0.05], [2.4, -1.4], [2.5, 1.5], [3.3, 0]]
export const MARGINE_DITO = 44      // px: una cosa si prende anche toccandole vicino
