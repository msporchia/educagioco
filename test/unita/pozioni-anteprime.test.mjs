/* Le foto degli ingredienti delle pozioni (`npm run anteprime pozioni`, strumenti/anteprime-pozioni.mjs): una per
   ingrediente, WebP quadrati col fondo trasparente; la firma delle foto torna e quella dei modelli pure (un modello
   cambiato vuole le foto rifatte). Vedi docs/pozioni/regole.md.
   tempo: 1 */
import { ANTEPRIME, FIRMA, SORGENTI } from '../../src/giochi/pozioni/dati/anteprime.js'
import { PERSONAGGI } from '../../src/giochi/pozioni/dati/misure.js'
import { NOMI, PIXEL, PIXEL_FIGURE, firmaDi, firmaSorgenti } from '../../strumenti/anteprime-pozioni.mjs'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

stessaLista('una foto per ogni ingrediente e personaggio (se no: npm run anteprime pozioni)', Object.keys(ANTEPRIME).sort(), [...NOMI].sort())
let totale = 0
const storte = []
for (const [k, uri] of Object.entries(ANTEPRIME)) {
  const b = Buffer.from(String(uri).replace(/^data:image\/webp;base64,/, ''), 'base64')
  const vp8x = b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 12, 16) === 'VP8X'
  const lato = vp8x ? [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)] : null
  const figura = PERSONAGGI.includes(k), giusto = figura ? PIXEL_FIGURE : PIXEL
  if (!lato || lato[0] !== giusto || lato[1] !== giusto || !(b[20] & 0x10) || b.length > (figura ? 40 : 16) * 1024) storte.push(`${k} ${lato} ${b.length}`)
  totale += b.length
}
stessaLista(`ogni foto è un WebP quadrato col fondo trasparente, ingredienti ${PIXEL} sotto i 16 KB e figure ${PIXEL_FIGURE} sotto i 40`, storte, [])
controlla(`tutte insieme sotto 400 KB (${Math.round(totale / 1024)} KB)`, totale <= 400 * 1024)
uguale('la firma delle foto torna (il file non si scrive a mano)', FIRMA, firmaDi(ANTEPRIME))
uguale('i modelli sono quelli fotografati (se no: npm run anteprime pozioni)', SORGENTI, firmaSorgenti())
riassunto('le foto degli ingredienti delle pozioni')
