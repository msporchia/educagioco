/* Le anteprime della Fattoria 3D fotografate sul computer (`npm run anteprime`, strumenti/anteprime-fattoria3d.mjs) — docs/fattoria3d/scena.md,
   «Le anteprime». Il file dati/anteprime.js è generato: una foto per ogni pezzo, edificio e bestia di casa, WebP quadrati e piccoli;
   la firma delle foto torna (non si tocca a mano) e quella dei sorgenti dei modelli pure (un modello cambiato vuole le foto rifatte).
   tempo: 1 */
import { ANTEPRIME, FIRMA, SORGENTI } from '../../src/giochi/fattoria3d/dati/anteprime.js'
import { TIPI, PIXEL, firmaDi, firmaSorgenti } from '../../strumenti/anteprime-fattoria3d.mjs'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

stessaLista('una foto per ogni pezzo, edificio e bestia di casa (se no: npm run anteprime)', Object.keys(ANTEPRIME).sort(), [...TIPI].sort())

let totale = 0
const storte = []
for (const [k, uri] of Object.entries(ANTEPRIME)) {
  const b = Buffer.from(String(uri).replace(/^data:image\/webp;base64,/, ''), 'base64')
  const vp8x = b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 12, 16) === 'VP8X'
  const lato = vp8x ? [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)] : null
  if (!lato || lato[0] !== PIXEL || lato[1] !== PIXEL || !(b[20] & 0x10) || b.length > 16 * 1024) storte.push(`${k} ${lato} ${b.length}`)
  totale += b.length
}
stessaLista(`ogni foto è un WebP ${PIXEL}×${PIXEL} col fondo trasparente, sotto i 16 KB`, storte, [])
controlla(`tutte insieme sotto 1,3 MB (${Math.round(totale / 1024)} KB)`, totale <= 1.3 * 1024 * 1024)

uguale('la firma delle foto torna (il file non si scrive a mano)', FIRMA, firmaDi(ANTEPRIME))
uguale('i modelli sono quelli fotografati (se no: npm run anteprime)', SORGENTI, firmaSorgenti())

riassunto('le anteprime fotografate della Fattoria 3D')
