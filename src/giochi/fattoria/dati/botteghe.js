/* Le botteghe del paese: i numeri (sorella di dati/mercato.js). Chi chiede cosa sta sulla voce del
   catalogo (posto: {chiede, clienti}). Vedi docs/fattoria/chi-chiede.md per il perché di ogni numero. */
import { CATALOGO } from './catalogo.js'
import { PRODOTTI } from './coltivazioni.js'
import { CLIENTI, premioPer, minutiPer, MONETE_AL_MINUTO } from './mercato.js'

// Quanti pezzi chiede un cliente: due-quattro (uno sarebbe il banco, più di quattro non si conta più a vista).
export const PEZZI_MIN = 2
export const PEZZI_MAX = 4

// Quanto in più del banco, per la stessa roba.
export const PIU_DEL_BANCO = 1.25

// Dopo una consegna il prossimo cliente arriva fra ATTESA_MIN e ATTESA_MAX minuti veri; rifiutare non costa meno.
export const ATTESA_MIN = 10
export const ATTESA_MAX = 20

// La fama: cinque consegne per un bancone in più, fino a tre.
export const CUORI = 5
export const BANCONI_MAX = 3

// Lo stesso conto del banco, per un quarto in più (mai una formula sua, o si scosta al primo ritocco).
export const premioInBottega = (prodotto, n) =>
  Math.round(premioPer({ [prodotto]: n }) * PIU_DEL_BANCO)

// Le voci del catalogo che sono botteghe.
export const POSTI = CATALOGO.filter(v => v.posto)

// Solo i clienti di questa bottega; se nessuno la vuole per mestiere, la chiede uno qualunque di loro.
export function clientiDellaBottega(posto, prodotto) {
  const suoi = ((posto && posto.clienti) || [])
    .map(id => CLIENTI.find(c => c.id === id)).filter(Boolean)
  const vogliono = suoi.filter(c => !c.vuole || c.vuole.includes(prodotto))
  return vogliono.length ? vogliono : suoi
}

export function guastiDelleBotteghe() {
  const g = []
  if (!(PEZZI_MIN >= 1 && PEZZI_MIN <= PEZZI_MAX && PEZZI_MAX <= 8))
    g.push('i pezzi di una bottega non stanno fra uno e uno scomparto')
  if (!(ATTESA_MIN > 0 && ATTESA_MIN <= ATTESA_MAX))
    g.push('l\'attesa del cliente dopo è impossibile')
  if (!(CUORI >= 1 && BANCONI_MAX >= 1)) g.push('la fama non fa crescere niente')
  for (const v of POSTI) {
    const { chiede, clienti } = v.posto
    if (!v.unico) g.push(`${v.id}: una bottega va «unico», se no la seconda non fa niente`)
    if (!Array.isArray(chiede) || !chiede.length) g.push(`${v.id}: non chiede niente`)
    if (!Array.isArray(clienti) || !clienti.length) g.push(`${v.id}: non ha clienti`)
    for (const id of clienti || [])
      if (!CLIENTI.some(c => c.id === id)) g.push(`${v.id}: il cliente «${id}» non esiste`)
    // Il tetto, come al banco: un quarto in più non basta a garantirlo, va ricontrollato sul caso peggiore.
    for (const p of chiede || []) {
      if (!PRODOTTI[p]) continue                  // lo dice guastiDegliSblocchi
      for (let n = PEZZI_MIN; n <= PEZZI_MAX; n++) {
        const reso = premioInBottega(p, n)
        const tempo = MONETE_AL_MINUTO * minutiPer({ [p]: n })
        if (!(reso <= tempo))
          g.push(`${v.id}: ${n} ${p} rendono ${reso} e costano ${tempo} di tempo: troppo`)
      }
    }
  }
  return g
}
