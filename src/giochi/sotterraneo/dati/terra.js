// La terra di sopra, la parte scritta a mano: quale discesa sta in quale posto della mappa e cosa dicono il
// minatore e il cartello. Dove stanno i posti, dove si cammina e la mappa stessa li dà dati/terra-mappa.js
// (generato). Il criterio delle discese sui posti: docs/sotterraneo/terra-di-sopra.md.
import { ICONE } from './terra-icone.js'
import { ICONE_MONDO } from './icone-mondo.js'

// in fila per strada dal villaggio, la prima la più vicina; l'abisso nel pozzo senza fondo, quello che dicono non
// abbia fondo e il più lontano di tutti (docs/sotterraneo/la-grande-storia.md)
export const POSTO_DI = {
  altare: 'altare',
  cantine: 'arco',
  torre: 'torre',
  gallerie: 'buco',
  cisterna: 'stagno',
  labirinto: 'botola',
  fondo: 'miniera',
  abisso: 'pozzo-vecchio',
}

// l'icona di una discesa (la chiave della tappa, o 'abisso'), non un'emoji: il suo posto ritagliato dalla mappa dipinta; nel
// Sotterraneo 3D (`mondo`) il suo monumento fotografato nel mondo (dati/icone-mondo.js, generato). Le città: solo nel 3D
export const iconaDi = (chiave, mondo = false) => (mondo && ICONE_MONDO[chiave]) || ICONE[POSTO_DI[chiave]] || null

// come il minatore spiega la strada («Le cantine dei goblin: …») sulla mappa dipinta del Sotterraneo di sempre: parte dal villaggio,
// dove sta lui. Il Sotterraneo 3D ha la sua geografia: LUOGHI_MONDO, sotto
export const LUOGHI = {
  altare: 'su per il sentiero dei campi, oltre il mulino, fino all\'altare fra le due colonne: dietro la pietra scende una scala',
  arco: 'fuori dal villaggio verso il bosco, a sinistra, poi su per la strada fino all\'arco di pietra',
  torre: 'su per il sentiero dei campi fino all\'altare, poi a sinistra lungo il prato: la torre, e la porta in basso',
  buco: 'oltre il bosco fino all\'arco, poi a destra: il buco nella roccia con la scaletta',
  stagno: 'oltre il bosco e poi a sinistra, alla riva di sotto dello stagno: da lì si vede la scala che scende sott\'acqua',
  botola: 'oltre il bosco fino in cima, oltre il cartello: la botola di legno nel prato',
  miniera: 'oltre il bosco fino in cima, e poi a destra: la miniera dentro il monte',
  'pozzo-vecchio': 'oltre il bosco fino in cima, e poi a sinistra: il pozzo col tetto d\'ardesia',
}

// La strada nel mondo a percorso del Sotterraneo 3D (docs/sotterraneo/mondo-a-percorso.md): per chiave del dungeon, con la zona dove sta
// (che compare in fondo entrando) e il ponte o il valico che ci porta, mai coi punti cardinali né con destra e sinistra (la strada fa la
// serpentina: la sinistra di chi cammina non è quella dello schermo). Tutte partono dal villaggio, dove stanno il minatore e il capitano.
// Il 2D di sempre tiene LUOGHI: i nomi dei dungeon sono gli stessi, la geografia no
export const LUOGHI_MONDO = {
  altare: 'esci dal cancello e segui la strada maestra nei prati del cimitero: poco dopo c\'è l\'altare fra le colonne, con la scala dietro la pietra',
  cantine: 'nei prati del cimitero, lungo la strada maestra oltre la pietra runica: l\'arco di pietra delle cantine',
  torre: 'oltre il ponte del mulino, nel bosco vecchio: accanto alla strada la torre annerita, con la porta in basso',
  gallerie: 'in fondo al bosco vecchio, oltre la sua pietra runica: la grotta fra le radici',
  cerchio: 'su per la salita della brughiera: i menhir in cerchio accanto alla strada, con la botola in mezzo',
  corvaia: 'in fondo alla brughiera, prima del ponte del guado: il pozzo dei corvi',
  cisterna: 'oltre il ponte del guado, nella palude: dopo la sua pietra runica, la scala che scende nell\'acqua',
  palafitta: 'in fondo alla palude, prima della passerella delle ceneri: la palafitta sull\'acqua',
  labirinto: 'oltre la passerella delle ceneri, nella piana delle ceneri: la botola nel telaio, che fuma',
  fornace: 'in fondo alla piana delle ceneri, prima del valico del passo: la fornace con le fumarole',
  fondo: 'su per il valico del passo, sul monte: dopo la sua pietra runica, la miniera coi binari',
  cava: 'in fondo al monte, prima del ponte sulla gola: la miniera con la brina',
  abisso: 'oltre il ponte sulla gola, nella landa vecchia: il pozzo col tetto d\'ardesia',
  tombe: 'in fondo alla landa vecchia, dove finisce la strada maestra: la tomba nel vento',
}
// la strada di una discesa (la chiave della tappa, o 'abisso'): nel mondo 3D quella del mondo aperto, se no quella della mappa dipinta
export const luogoDi = (chiave, mondo = false) => (mondo ? LUOGHI_MONDO[chiave] : LUOGHI[POSTO_DI[chiave]])

// il pozzo senza fondo prima che l'abisso si apra: si vede, non si scende
export const POZZO_VECCHIO = {
  nome: 'Il pozzo senza fondo', icona: '🕳️',
  dritta: 'dicono che non abbia fondo',
  chiuso: 'Si apre quando hai finito tutte le discese.',
}

// il cartello all'incrocio: le frecce dicono i posti, i nomi delle discese li aggiunge chi le ha trovate
export const FRECCE = [
  { verso: '↖', posti: ['botola', 'pozzo-vecchio'], detto: 'la botola e il pozzo senza fondo' },
  { verso: '↗', posti: ['miniera'], detto: 'la miniera' },
  { verso: '↓', posti: ['buco', 'stagno', 'arco'], detto: 'la grotta, lo stagno, l\'arco e il villaggio' },
]

/* le misure: una cella della mappa (64 px) è grande quanto l'eroe a scala 3 (16 px × 3 = 48 px sullo schermo),
   quindi la mappa si mostra a 3/4. Un pixel del disegno (4 px della mappa) diventa 3 px, come un pixel dell'eroe */
export const SCALA_TERRA = 3 / 4
export const SCALA_EROE = 3
// l'eroe armato un po' più piccolo dei personaggi dipinti: con l'armatura e l'arma a scala 3 li sovrastava (l'utente, 13 ottobre)
export const SCALA_DELL_EROE = 2.5
export const PASSO_TERRA = 9        // celle della maschera al secondo (4,5 celle della mappa)
export const VISTA = 8              // il raggio di quello che si scopre camminando, in celle della maschera
export const LUCE = [5, 8]          // dove la luce attorno all'eroe è piena, e dove finisce
// la telecamera alla Monkey Island: l'eroe sta libero nel mezzo, e la vista scorre quando arriva a questa
// frazione dal bordo; `morbida` è quanto in fretta la vista lo raggiunge (al secondo)
export const BORDO = { x: 0.3, sopra: 0.34, sotto: 0.26 }, MORBIDA = 4.5
