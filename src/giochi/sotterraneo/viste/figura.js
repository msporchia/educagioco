/* ═══════════════════════════════════════════════════════════════════
   UN PEZZO DELL'ATLANTE, DENTRO UNA PAGINA

   Il campo si disegna su canvas, ma **i pannelli sono HTML**: lo zaino,
   la scelta di chi scende, il banco del mercante. Perché lì dentro
   compaia la spada vera invece della sua emoji serve un modo di posare
   uno sprite in un `<div>`, e sta qui.

   Due elementi, non uno: quello di fuori tiene il posto (già
   ingrandito), quello di dentro porta il ritaglio a misura vera e si
   ingrandisce con `transform`. È l'unico modo di scalare senza sapere
   quanto è grande il foglio intero — `background-size` lo chiederebbe, e
   il foglio è un'immagine in base64 che non ha una misura dichiarata da
   nessuna parte.

   `image-rendering: pixelated` non è un vezzo: senza, uno sprite da 16
   px ingrandito quattro volte esce sfocato, e la pixel art sfocata
   sembra un errore di compressione.
   ═══════════════════════════════════════════════════════════════════ */
import { ATLANTE, PEZZI } from '../dati/atlante.js'

export const haFigura = nome => !!(nome && PEZZI[nome])

/* ── la scala dell'interfaccia ──
   Una sola, per tutte le cose e in tutti i pannelli. Chiedere invece
   «grande quanto ci sta» (`alto`) faceva uscire la stessa boccetta ×2
   in una tasca e ×1 in una riga di avviso: a occhio, due icone diverse
   per la stessa cosa. Le figure sono disegnate con le loro proporzioni,
   e quelle vanno rispettate — un medaglione è piccolo perché è un
   medaglione. */
export const SCALA = 2

/* Torna `{ gabbia, pezzo }`, i due oggetti di stile da legare ai due
   elementi. `null` se quel pezzo non c'è: chi chiama mostra l'emoji, che
   è il ripiego di tutto il gioco. */
export function figura(nome, { scala = 3, alto = null } = {}) {
  const p = PEZZI[nome]
  if (!p) return null
  const [x, y, w, h] = p
  /* `alto` chiede «grande quanto ci sta in questa altezza»: serve alle
     caselle, dove una spada lunga e un anello tondo devono stare nello
     stesso quadrato senza che una debordi e l'altro sparisca. */
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
