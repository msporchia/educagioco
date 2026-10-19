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
  // la distanza si arrotonda perché un pixel dello sprite stia su un numero intero di pixel dello schermo (nitido, uguale per
  // tutti); `pixelMassimo`: mai più di tanti pixel dello schermo per pixel dello sprite (più vicino sono macchie)
  pixelMassimo: 5,
}

// la luce: senza questi minimi il primo giro era troppo tetro
export const LUCE = {
  esposizione: 1.4,
  ambiente: 2.6,         // l'emisferica, solo dentro quello che si vede (la maschera spegne il resto)
  minimoFigure: 0.32,    // le figure non scendono mai sotto questa frazione del loro colore
  rim: 0.55,             // il contorno caldo che stacca le figure dal fondo
  // nello scontro, da vicino, la normal map finta e il contorno sporcano i colori e ammorbidiscono i bordi: si spengono quasi
  nitidoScontro: { rim: 0.12, rilievo: 0.25, minimo: 0.55 },
  alone: 9, cono: 40,    // la luce dell'eroe: l'alone corto senza ombre e il cono che le fa
  // con la torcia accesa (in proporzione agli sgoccioli): quanto crescono alone e cono, quanto si allungano (celle) e si aprono
  // (radianti), la luce che rimbalza dal pavimento e il chiarore caldo per terra (docs/sotterraneo/grafica-3d.md)
  torcia: { alone: 0.35, cono: 0.5, lungoAlone: 5, lungoCono: 9, apre: 0.3, rimbalzo: 2.5, chiarore: 0.07 },
  ombra: 0.75,           // le ombre non sono mai nere
}

export const ALTO_MURO = 1.25
export const PARAPETTO = 0.32       // un muro con il pavimento a nord sta fra la telecamera e la stanza: basso
// le figure stanno ritte, e la vista dall'alto (52°) le schiaccia di cos 52°: le si allunga di 1/cos, così il pixel dello sprite
// a schermo è quadrato (con 1,3 era alto 0,8 della larghezza: le righe venivano di altezze diverse)
export const ALLUNGA = 1 / Math.cos(52 * Math.PI / 180)
export const PIXEL_CELLA = 16       // i pixel di sprite in una cella (dati/mondo.js, T)

export const N_FUOCHI = 6           // le luci delle torce, dei bracieri, della fonte e del portale: una riserva fissa
export const MAX_LUCI = 8           // quelle che nebbia, polvere e acqua sommano a mano
export const FETTE = 5, POLVERE = 450, SCINTILLE = 1500
export const FIGURE_MAX = 700       // le figure dell'atlante in scena nello stesso fotogramma
export const ALONI_MAX = 96         // i chiarori per terra (rarità, missione, chiave, scala che sale)

import { profilo } from '../../../store/qualita.js'

// il pixel ratio si adatta: parte da `max`, scende a passi se un fotogramma costa più di `lento` ms, risale piano sotto `svelto`
export const DPR = { max: 1.5, min: 0.6, lento: 26, svelto: 15 }   // `max` è quello della fascia alta: le altre lo abbassano (store/qualita.js)

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

// La fascia grafica del telefono (store/qualita.js) decide quali pezzi di ACCESI restano: si riparte dai valori scritti sopra
// (il cheat `&spegni=` e una fascia precedente non si accumulano), poi si spegne quello della fascia e quello chiesto a mano.
const ORIGINALI = { ...ACCESI }
export function applicaFascia(spegniAMano = []) {
  Object.assign(ACCESI, ORIGINALI)
  for (const k of [...profilo('sotterraneo').spegni, ...spegniAMano]) if (k in ACCESI) ACCESI[k] = false
}

// lo scontro: quanto agio vogliono i combattenti dai muri e dalle cose posate, e i posti dei mostri attorno al centro
export const AGIO = 1.2
// le figure ritte sono alte una cella e mezza: a meno di 1,2 celle in profondità una copre l'altra (con 0,85 i tre stavano in pila)
export const POSTI = [[1.0, 0], [1.9, -1.25], [2.0, 1.25], [3.0, 0], [2.9, -2.5], [3.0, 2.5], [4.0, -1.25]]
export const MARGINE_DITO = 44      // px: una cosa si prende anche toccandole vicino
