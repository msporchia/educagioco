// I pannelli sono HTML (zaino, scelta dell'eroe, banco): posare uno sprite in un <div> vuole due elementi
// (uno tiene il posto già ingrandito, l'altro porta il ritaglio vero e si ingrandisce con transform), perché
// il foglio è un'immagine in base64 senza misura dichiarata. `pixelated`: senza, uno sprite ingrandito esce sfocato.
import { ATLANTE, PEZZI } from '../dati/atlante.js'

export const haFigura = nome => !!(nome && PEZZI[nome])

// una scala sola per tutte le cose: "grande quanto ci sta" faceva uscire la stessa boccetta a misure diverse
export const SCALA = 2

// torna { gabbia, pezzo }, o null se il pezzo non c'è (chi chiama mostra l'emoji)
export function figura(nome, { scala = 3, alto = null } = {}) {
  const p = PEZZI[nome]
  if (!p) return null
  const [x, y, w, h] = p
  // `alto`: una spada lunga e un anello tondo devono stare nello stesso quadrato senza debordare o sparire
  const s = alto ? Math.max(1, Math.floor(alto / h)) : scala
  return {
    gabbia: { width: `${w * s}px`, height: `${h * s}px` },
    pezzo: {
      width: `${w}px`, height: `${h}px`,
      backgroundImage: `url(${ATLANTE})`,
      backgroundPosition: `${-x}px ${-y}px`,
      imageRendering: 'pixelated',
      transform: `scale(${s})`,
      transformOrigin: 'top left',
    },
  }
}
