/* Quando la taratura è sbagliata lo dice il bambino: il conto di ok/err per
   chiave sopra MINIME risposte diventa un consiglio (mai un ritocco da
   solo, vedi docs/apprendimento/la-domanda.md). Le soglie: sotto MURO è
   troppo difficile, sopra PEDAGGIO è troppo facile, in mezzo si tace. */

export const MINIME = 8
export const MURO = 0.5
export const PEDAGGIO = 0.9

// items è state.profile.items; una chiave che non c'è vuol dire «mai vista»
export function contoDi(chiavi, items = {}) {
  let ok = 0, err = 0
  for (const c of chiavi) {
    const it = items[c]
    if (!it) continue
    ok += it.ok || 0
    err += it.err || 0
  }
  return { ok, err, quante: ok + err }
}

// null è il caso normale (una schermata che consiglia su ogni riga non consiglia niente); verso è il gradino per ritocca()
export function consiglioDa(conto, ritocco = 0) {
  if (!conto || conto.quante < MINIME) return null
  const quota = conto.ok / conto.quante
  if (quota <= MURO && ritocco > -3)
    return { verso: -1, quota, detto: `ne ha sbagliate ${conto.err} su ${conto.quante}` }
  if (quota >= PEDAGGIO && ritocco < 3)
    return { verso: 1, quota, detto: `le indovina quasi tutte (${conto.ok} su ${conto.quante})` }
  return null
}

export function consiglioPerGruppo({ tipi = [], items = {}, ritocco = 0 } = {}) {
  return consiglioDa(contoDi(tipi.map(t => t.chiave), items), ritocco)
}
