/* ═══════════════════════════════════════════════════════════════════
   LE PAROLE — come si legge un ordine che non è ancora stato eseguito

   Serve a chi ha in mano il DATO e non l'azione: l'editor, mentre il
   bambino compone una riga che non è mai partita, e i messaggi che
   parlano di un piano invece che di una partita.

   ── E NON RISCRIVE NIENTE ──
   Qui c'era uno `switch` su `cond` che ricomponeva le frasi delle
   domande: la stessa frase in due posti, e alla domanda successiva uno
   dei due sarebbe rimasto indietro — si sarebbe letto «vedi undefined»,
   come già successe. È esattamente il difetto per cui `valuta` e
   `testo` stanno nello stesso file. Adesso si compila al volo e si
   chiede a lei: una domanda sa dirsi da sé, e questo file la ascolta.
   ═══════════════════════════════════════════════════════════════════ */
import { VERBI, eCondizione, eRipeti, eRoutine, ramoDi, corpoDi } from './vocabolario.js'
import { domandaDa } from './domande/indice.js'

/* una domanda scritta come dato, letta in italiano */
export function testoCond (mondo, dato) {
  const domanda = domandaDa(dato)
  return domanda ? domanda.testo(mondo) : '…'
}

/* un ordine scritto come dato, letto in italiano. `secco` è per quando
   sta dentro un'altra frase e non c'è spazio per i suoi rami. */
export function descrivi (mondo, o, secco) {
  if (eCondizione(o)) {
    const testa = `condizione [${testoCond(mondo, o.cond)}]`
    if (secco) return testa
    const via = r => ramoDi(o, r).map(q => descrivi(mondo, q, true)).join(', ') || 'niente'
    return `${testa}: se è vero ${via('vero')}, se è falso ${via('falso')}`
  }
  if (eRipeti(o)) {
    const testa = `ripeti [smetti quando ${testoCond(mondo, o.finche)}]`
    if (secco) return testa
    return `${testa}: ${corpoDi(o).map(q => descrivi(mondo, q, true)).join(', ') || 'niente'}`
  }
  if (eRoutine(o)) return `azione «${o.nome}»`
  const V = VERBI[o && o.verbo]
  if (!V) return '?'
  if (V.vuoleCond && o.cond) return `${V.nome} [${testoCond(mondo, o.cond)}]`
  const cosa = mondo.laCosa(o.complemento)
  return V.nome + ' [' + (cosa ? cosa.nome : (o.complemento || '…')) + ']'
}
