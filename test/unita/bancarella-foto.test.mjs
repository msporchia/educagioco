/* Le foto dei modelli della cucina (`npm run anteprime cucina`, strumenti/anteprime-cucina.mjs): una per piatto,
   ingrediente e attrezzo, WebP quadrati col fondo trasparente; la firma delle foto torna e quella dei modelli pure
   (un modello cambiato vuole le foto rifatte). Vedi docs/bancarella/cucina.md.
   tempo: 1 */
import { FOTO, FIRMA, SORGENTI } from '../../src/data/bancarella-foto.js'
import { CHIAVI, firmaDi, firmaSorgenti } from '../../strumenti/anteprime-cucina.mjs'
import { uguale, stessaLista, controlla, riassunto } from '../aiuto/verifica.mjs'

stessaLista('una foto per ogni cosa (se no: npm run anteprime cucina)', Object.keys(FOTO).sort(), [...CHIAVI].sort())
let totale = 0
for (const uri of Object.values(FOTO)) totale += Buffer.from(String(uri).replace(/^data:image\/webp;base64,/, ''), 'base64').length
controlla(`tutte insieme sotto 250 KB (${Math.round(totale / 1024)} KB)`, totale <= 250 * 1024)
uguale('la firma delle foto torna (il file non si scrive a mano)', FIRMA, firmaDi(FOTO))
uguale('i modelli sono quelli fotografati (se no: npm run anteprime cucina)', SORGENTI, firmaSorgenti())
riassunto('le foto della cucina')
