// Il campo a celle (il castello a sprite, in prova): il ponte fra il campo
// a poligoni e gli sprite posati su una griglia. Due misure diverse, non da
// confondere: `CELLA` è la griglia in unità di gioco (non si tocca: sono i
// percorsi che ci si ricalcano), `TESSERA` è quanto vale una casella in
// pixel dello sprite (dipende dal ritaglio del foglio). 420/36 non è
// intero: la griglia sborda apposta (432×792) invece di stringere MONDO,
// che vorrebbe dire ristirare venti mappe e rifare la taratura.
import { MONDO } from '../../../data/castello.js'
import { TESSERA } from './atlante.js'

export { MONDO, TESSERA }

export const CELLA = 36

export const COLONNE = Math.ceil(MONDO.W / CELLA)
export const RIGHE = Math.ceil(MONDO.H / CELLA)

// Da unità di gioco a pixel di sprite: sono uguali finché TESSERA vale 36,
// e questa funzione esiste per quando non varranno più uguali.
export const inSprite = q => q * (TESSERA / CELLA)

export const cellaDi = (x, y) => [Math.floor(x / CELLA), Math.floor(y / CELLA)]
export const centroDi = (cx, cy) => ({ x: (cx + 0.5) * CELLA, y: (cy + 0.5) * CELLA })
export const dentroIlCampo = (x, y) => x >= 0 && x < COLONNE && y >= 0 && y < RIGHE

// Tavolozza → materiale: il foglio ha sette famiglie, le tavolozze sono una
// per tappa (venti) per far vedere il viaggio anche a materiale uguale. La
// sabbia resta ritagliata nell'atlante ma non è usata: la sua strada è
// «sabbia sopra sabbia» e in partita non si distinguerebbe comunque.
export const AMBIENTE_DI = {
  'bosco-chiaro': 'bosco',
  'bosco-guado': 'bosco',
  'bosco-radura': 'bosco',
  'bosco-fitto': 'sterpaglia',
  'bosco-notte': 'sterpaglia',

  grotta: 'pietra',
  miniera: 'pietra',
  fogne: 'palude',
  cripta: 'pietra',
  gola: 'neve',

  cortile: 'sterpaglia',
  camminamento: 'pietra',
  corridoio: 'pietra',
  trono: 'lava',
  bastione: 'neve',

  'palude-alba': 'palude',
  'palude-verde': 'palude',
  'palude-stagno': 'palude',
  'palude-marcio': 'sterpaglia',
  'palude-torce': 'palude',
}

// una tavolozza che non c'è si veste di bosco: un materiale sbagliato si
// guarda, un campo vuoto no
export const materialeDi = tavolozza => AMBIENTE_DI[tavolozza] || 'bosco'
