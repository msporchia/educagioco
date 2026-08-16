/* ═══════════════════════════════════════════════════════════════════
   QUALI DOMANDE SI POSSONO FARE, QUI

   Non «cosa risponde una domanda» — quello lo sa la domanda — ma quali
   si offrono al bambino in questa stanza. Non si inventano: escono
   dalle stesse cose da cui escono i bersagli dei verbi, e un livello
   può dettarle a mano quando la combinatoria è troppa per chi ha sei
   anni.

   Qui c'era anche `valuta(mondo, io, c)`, uno `switch` che sapeva com'è
   fatta una porta, com'è fatto uno zaino e cosa vuol dire vedere. Non
   c'è più: ogni domanda si valuta da sé.
   ═══════════════════════════════════════════════════════════════════ */
import { CONDIZIONI } from '../vocabolario.js'
import { domandaDa } from './indice.js'

/* si può valutare? Lo chiede al dato passando dalla domanda che ne
   nasce: un piano salvato ieri può nominare una porta che non c'è più,
   e allora va rifiutato prima di cominciare. */
export function valutabile (mondo, dato) {
  const d = domandaDa(dato)
  return !!d && d.valutabile(mondo)
}

/* le domande che il livello offre */
export function condizioniDi (mondo, io) {
  if (mondo.livello.condizioni) return mondo.livello.condizioni
  const out = []
  for (const k of mondo.nominabili()) {
    const x = mondo.cose[k]
    if (!x || k === io) continue
    const due = cond => out.push({ ...cond }, { ...cond, non: true })
    /* quello che vede adesso, quello che ha addosso, i segnali che le
       sono arrivati. Lo stato di una porta dall'altra parte della mappa
       non è percezione: se serve saperlo, qualcuno deve dirlo. */
    if (x.tipo === 'unita' || x.tipo === 'fazione') due({ cond: 'vedi', complemento: k })
    else if (x.tipo === 'oggetto') due({ cond: 'hai', complemento: k })
    else if (x.tipo === 'segnale') due({ cond: 'segnale', complemento: k })
    /* e per quello che si può sfasciare, se il sabotaggio è riuscito.
       Non è un `else`: una cosa rompibile è quasi sempre anche un
       oggetto che si può avere addosso, e sono due domande diverse.
       Chi non dichiara una `resistenza` non offre niente in più. */
    if (x.rompibile) due({ cond: 'rotto', complemento: k })
  }
  return out
}

/* quello che si può chiedere qui, raggruppato per verbo di domanda:
   l'interfaccia le compone come compone un ordine — verbo, poi cosa */
export function condCompone (mondo, io) {
  const out = []
  for (const c of condizioniDi(mondo, io)) {
    if (!c || !c.cond || c.cond === 'sempre' || !c.complemento) continue
    let g = out.find(x => x.cond === c.cond)
    if (!g) out.push(g = { cond: c.cond, nome: (CONDIZIONI[c.cond] || {}).nome || c.cond,
                           em: (CONDIZIONI[c.cond] || {}).em || '❓', cose: [] })
    if (!g.cose.includes(c.complemento)) g.cose.push(c.complemento)
  }
  return out
}
