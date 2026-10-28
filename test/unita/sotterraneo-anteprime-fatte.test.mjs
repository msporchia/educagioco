/* Le anteprime del Sotterraneo 3D fotografate sul computer (`npm run anteprime sotterraneo`, strumenti/anteprime-sotterraneo3d.mjs) —
   docs/sotterraneo/anteprime-3d.md, «Fatte sul computer». Il file dati/anteprime-fatte.js è generato: una foto per ogni chiave che il
   gioco può chiedere (tranne il ritratto dell'eroe, che resta vivo), WebP della misura delle viste; la firma delle foto torna e quella
   dei sorgenti dei modelli pure (un modello cambiato vuole le foto rifatte).
   tempo: 3 */
import { ANTEPRIME, FIRMA, SORGENTI, SENZA } from '../../src/giochi/sotterraneo/dati/anteprime-fatte.js'
import { chiaviDaFotografare, firmaDi, firmaSorgenti } from '../../strumenti/anteprime-sotterraneo3d.mjs'
import { MISURE } from '../../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const chiavi = chiaviDaFotografare()
stessaLista('una foto (o il «senza modello») per ogni chiave che il gioco può chiedere (se no: npm run anteprime sotterraneo)',
            [...Object.keys(ANTEPRIME), ...SENZA].sort(), chiavi)
controlla('il ritratto dell\'eroe non c\'è: lo disegna il telefono', !chiavi.some(k => /^(eroe|busto):/.test(k)))

let totale = 0
const storte = []
for (const [k, uri] of Object.entries(ANTEPRIME)) {
  const b = Buffer.from(String(uri).replace(/^data:image\/webp;base64,/, ''), 'base64')
  const vp8x = b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 12, 16) === 'VP8X'
  const lato = vp8x ? `${1 + b.readUIntLE(24, 3)}×${1 + b.readUIntLE(27, 3)}` : null
  if (lato !== (MISURE[k.split(':')[0]] || []).join('×') || b.length > 12 * 1024) storte.push(`${k} ${lato} ${b.length}`)
  totale += b.length
}
stessaLista('ogni foto è un WebP della misura del suo tipo (MISURE), sotto i 12 KB', storte, [])
controlla(`tutte insieme sotto 3,5 MB (${Math.round(totale / 1024)} KB)`, totale <= 3.5 * 1024 * 1024)

uguale('la firma delle foto torna (il file non si scrive a mano)', FIRMA, firmaDi(ANTEPRIME))
uguale('i modelli sono quelli fotografati (se no: npm run anteprime sotterraneo)', SORGENTI, firmaSorgenti())

riassunto('le anteprime fotografate del Sotterraneo 3D')
