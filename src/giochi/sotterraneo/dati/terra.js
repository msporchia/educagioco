// La terra di sopra, la parte scritta a mano: quale discesa sta in quale posto della mappa e cosa dicono il
// minatore e il cartello. Dove stanno i posti, dove si cammina e la mappa stessa li dà dati/terra-mappa.js
// (generato). Il criterio delle discese sui posti: docs/sotterraneo/terra-di-sopra.md.

// le prime vicino a casa, le ultime in cima; l'abisso nel pozzo vecchio, quello che dicono non abbia fondo
export const POSTO_DI = {
  cantine: 'arco',
  pozzo: 'pozzo-di-casa',
  gallerie: 'buco',
  cisterna: 'stagno',
  labirinto: 'botola',
  fondo: 'miniera',
  abisso: 'pozzo-vecchio',
}

// come il minatore spiega la strada («La scalinata antica: …»): parte da casa, dove sta lui
export const LUOGHI = {
  arco: 'su per la strada, sempre dritto, giù per la scala sotto l\'arco di pietra',
  'pozzo-di-casa': 'il pozzo qui dietro, quello dal tetto rosso',
  buco: 'su per la strada e poi a destra, nel buco della roccia con la scaletta',
  stagno: 'su per la strada e poi a sinistra, alla riva di sotto dello stagno: da lì si vede la scala che scende sott\'acqua',
  botola: 'fino in cima, oltre il cartello, la botola di legno nel prato',
  miniera: 'fino in cima e poi a destra, la miniera dentro il monte',
  'pozzo-vecchio': 'fino in cima e poi a sinistra, il pozzo vecchio col tetto d\'ardesia',
}

// il pozzo vecchio prima che l'abisso si apra: si vede, non si scende
export const POZZO_VECCHIO = {
  nome: 'Il pozzo vecchio', icona: '🕳️',
  dritta: 'dicono che non abbia fondo',
  chiuso: 'Si apre quando hai finito tutte le discese.',
}

// il cartello all'incrocio: le frecce dicono i posti, i nomi delle discese li aggiunge chi le ha trovate
export const FRECCE = [
  { verso: '↖', posti: ['botola', 'pozzo-vecchio'], detto: 'la botola e il pozzo vecchio' },
  { verso: '↗', posti: ['miniera'], detto: 'la miniera' },
  { verso: '↓', posti: ['buco', 'stagno', 'arco', 'pozzo-di-casa'], detto: 'la grotta, lo stagno, l\'arco e casa' },
]

/* le misure: una cella della mappa (64 px) è grande quanto l'eroe a scala 3 (16 px × 3 = 48 px sullo schermo),
   quindi la mappa si mostra a 3/4. Un pixel del disegno (4 px della mappa) diventa 3 px, come un pixel dell'eroe */
export const SCALA_TERRA = 3 / 4
export const SCALA_EROE = 3
export const PASSO_TERRA = 9        // celle della maschera al secondo (4,5 celle della mappa)
export const VISTA = 8              // il raggio di quello che si scopre camminando, in celle della maschera
export const LUCE = [5, 8]          // dove la luce attorno all'eroe è piena, e dove finisce
export const SASSI_OGNI = 4
// la telecamera alla Monkey Island: l'eroe sta libero nel mezzo, e la vista scorre quando arriva a questa
// frazione dal bordo; `morbida` è quanto in fretta la vista lo raggiunge (al secondo)
export const BORDO = { x: 0.3, sopra: 0.34, sotto: 0.26 }, MORBIDA = 4.5
