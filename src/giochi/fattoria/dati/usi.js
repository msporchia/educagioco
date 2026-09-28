/* A cosa serve una roba del granaio, tutte le uscite: bisogni.js ne vede tre e non può importare
   la quarta (gli ordini) senza chiudere un anello — vedi docs/fattoria/catena.md. */
import { PRODOTTI } from './coltivazioni.js'
import { serveA as ciotolaEMacchine } from './bisogni.js'
import { CLIENTI } from './mercato.js'
import { CATALOGO } from './catalogo.js'

export function serveA(prodotto) {
  const usi = ciotolaEMacchine(prodotto)
  // Solo chi la chiede per mestiere: la nonna e il bottegaio prendono tutto, e non contano qui.
  for (const c of CLIENTI)
    if ((c.vuole || []).includes(prodotto))
      usi.push({ che: 'ordine', emoji: c.emoji, nome: c.nome })
  // Le botteghe del paese: elenco chiuso, dice dove portarla.
  for (const v of CATALOGO)
    if (v.posto && v.posto.chiede.includes(prodotto))
      usi.push({ che: 'bottega', emoji: '🏪', nome: v.nome, la: !!v.la })
  return usi
}

export function guastiDegliUsi() {
  const g = []
  // Una roba che non serve a niente riempie uno scomparto (8 posti) per sempre.
  for (const id of Object.keys(PRODOTTI))
    if (!serveA(id).length) g.push(`${id}: non serve a niente, e occuperebbe un posto per sempre`)
  for (const id of Object.keys(PRODOTTI))
    for (const u of serveA(id))
      if (!u.nome || !u.emoji) g.push(`${id} → ${u.che}: un uso senza nome o senza faccia`)
  return g
}
