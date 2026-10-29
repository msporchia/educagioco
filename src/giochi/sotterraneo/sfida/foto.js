// La fotografia della discesa in due (docs/sotterraneo/in-due.md): tutto quello che cambia mentre si gioca, il mondo e gli alleati, col
// caso a che punto è. La manda l'host quando le due copie si separano (src/insieme/lockstep.js), e servirà per riprendere una
// discesa il giorno dopo. Il piano non si rifà dal seme come nella sosta: si fotografa intero, scontro aperto compreso.
import { fotoDi, rimettiDa } from '../../../insieme/grafo.js'
import { Livello } from '../motore/livello.js'

const CLASSI = { Livello }
// della discesa non si fotografano: il caso (lo si rimette dal suo stato), chi agisce adesso, una memoria che si rifà da sé
const FUORI = ['rnd', 'persona', 'persone', '_vie']

export function fotoDellaDiscesa(corsa) {
  const mondo = {}
  for (const k of Object.keys(corsa)) if (!FUORI.includes(k) && typeof corsa[k] !== 'function' && k !== 'inMotore') mondo[k] = corsa[k]
  return { ...fotoDi({ mondo, persone: corsa.persone }, { classi: CLASSI }), caso: corsa.rnd.stato() }
}

// la discesa `corsa` torna com'era nella fotografia; `locale`: l'alleato di chi guarda (quello che la vista legge)
export function rimettiLaDiscesa(corsa, foto, locale = 0) {
  if (!foto || !Array.isArray(foto.n) || !Number.isInteger(foto.caso)) throw new Error('fotografia storta')
  const { mondo, persone } = rimettiDa(foto, { classi: CLASSI })
  if (!mondo || !Array.isArray(persone) || !persone.length) throw new Error('fotografia storta')
  // le azioni della vista (sfida/vista.js) sono funzioni sull'istanza: restano
  for (const k of Object.keys(corsa)) if (!FUORI.includes(k) && !(k in mondo) && typeof corsa[k] !== 'function' && k !== 'inMotore') delete corsa[k]
  Object.assign(corsa, mondo)
  corsa._vie = undefined
  corsa.persone = persone
  corsa.persona = persone[locale] || persone[0]
  corsa.rnd.stato(foto.caso)
  // lo scontro di tutti: lo stato di ognuno nello scontro (`io`) torna a essere quello di chi agisce (motore/in-due.js)
  for (const p of persone) {
    const f = p.foglio
    if (f && f.ioDi) Object.defineProperty(f, 'io', { get: () => f.ioDi[corsa.indiceDi()], enumerable: true, configurable: true })
  }
}
