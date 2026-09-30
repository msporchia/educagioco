/* L'esempio svolto: prima della domanda vera di una tipologia alleggerita
   si mostra un'ALTRA domanda della stessa tipologia, già risolta, col suo
   «Si fa così». L'aiuto della domanda vera parla spesso dei suoi numeri,
   quindi mostrato prima conterrebbe la risposta. Puro (unita/svolto):
   chi genera lo passa chi chiama. Vedi
   docs/apprendimento/la-domanda.md#lesempio-svolto. */

export const TENTATIVI = 12

const giustaDi = d => d?.risposte?.[d.giusta]

const impronta = r => !r ? '' : r.testo !== undefined ? 't:' + r.testo
  : r.emoji !== undefined ? 'e:' + r.emoji : 's:' + JSON.stringify(r.scena)

// quello che dell'esempio si legge a schermo: la consegna, il soggetto scritto, la risposta giusta e il metodo
export function testiDellEsempio(es) {
  if (!es) return []
  const g = giustaDi(es)
  return [es.testo, es.soggetto?.testo, es.soggetto?.emoji, g?.testo, g?.emoji, es.aiuto]
    .filter(t => t !== undefined && t !== null && String(t).trim()).map(String)
}

const NUMERI = /\d+(?:[.,]\d+)?/g
const numeriIn = testi => new Set(testi.join(' ').match(NUMERI) || [])

const scappa = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// la parola intera, non un pezzo: il 4 non si trova dentro il 40, «re» non si trova dentro «tre»
function contiene(testi, cosa) {
  const c = String(cosa ?? '').trim()
  if (!c) return false
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${scappa(c)}($|[^\\p{L}\\p{N}])`, 'iu')
  return testi.some(t => re.test(t))
}

/* la risposta giusta della vera non compare nell'esempio; a meno che non
   ci compaiano anche tutte le altre: l'elenco dei giorni della settimana
   nomina la giusta, ma non la distingue dai falsi */
export function rivela(testi, vera) {
  const g = giustaDi(vera)
  if (!g) return false
  const c = r => (r.testo !== undefined ? contiene(testi, r.testo)
    : r.emoji !== undefined && testi.some(t => t.includes(r.emoji)))
  if (!c(g)) return false
  const altre = (vera.risposte || []).filter(r => r !== g && (r.testo !== undefined || r.emoji !== undefined))
  return !(altre.length && altre.every(c))
}

const stessaConsegna = (a, b) =>
  a.testo === b.testo && JSON.stringify(a.soggetto || null) === JSON.stringify(b.soggetto || null)

// ripiego: il metodo della vera, solo se non ha numeri e non dice la risposta
export function metodoSenzaNumeri(vera) {
  const aiuto = vera?.aiuto
  if (!aiuto || /\d/.test(aiuto) || rivela([aiuto], vera)) return ''
  return aiuto
}

/* `genera(sorte)` consegna una domanda della stessa classe. Si prova
   `tentativi` volte e si tiene l'esempio che somiglia meno alla vera:
   prima di tutto la sua risposta giusta non sta fra i tasti della vera
   (sarebbe un'esca: «è quella dell'esempio»), poi divide meno numeri; con
   nessun esempio buono si ripiega sul metodo senza numeri, o su niente.
   Torna { esempio } | { metodo } | null. */
export function esempioSvolto({ vera, genera, sorte, tentativi = TENTATIVI }) {
  if (!vera?.aiuto) return null // come prima: senza un «Si fa così» non si inventa niente
  const tasti = new Set((vera.risposte || []).map(impronta))
  const suoi = numeriIn([vera.testo, vera.soggetto?.testo, vera.aiuto,
    ...(vera.risposte || []).map(r => r.testo)].filter(Boolean).map(String))
  let meglio = null
  let comune = Infinity
  for (let i = 0; genera && i < tentativi && comune > 0; i++) {
    let d = null
    try { d = genera(sorte) } catch { d = null }
    if (!d || d.chiave !== vera.chiave || !d.aiuto || !giustaDi(d)) continue
    if (impronta(giustaDi(d)) === impronta(giustaDi(vera)) || stessaConsegna(d, vera)) continue
    const testi = testiDellEsempio(d)
    if (rivela(testi, vera)) continue
    const quanti = (tasti.has(impronta(giustaDi(d))) ? 100 : 0) +
      [...numeriIn(testi)].filter(n => suoi.has(n)).length
    if (quanti < comune) { meglio = d; comune = quanti }
  }
  if (meglio) return { esempio: meglio }
  const metodo = metodoSenzaNumeri(vera)
  return metodo ? { metodo } : null
}

/* il generatore di una classe, dal modulo che l'ha fatta: con la
   tipologia in mano si chiede quella (genera la rispetta sempre, lo
   controlla unita/svolto); un modulo senza tipi si richiede e si scarta
   quello di un'altra chiave */
export function generatoreDi(modulo, grado, chiave) {
  if (!modulo || !chiave || typeof modulo.genera !== 'function') return null
  const g = Math.max(1, Math.round(grado || 1))
  const conTipo = (modulo.tipi || []).some(t => t.chiave === chiave)
  return sorte => (conTipo ? modulo.genera(g, sorte, chiave) : modulo.chiedi(g, sorte))
}

// le parole in più da leggere prima di rispondere: per tempoDiLettura, che non deve dare del frettoloso a chi ha letto
export function daLeggerePrima(prima) {
  if (!prima) return ''
  const es = prima.esempio
  if (!es) return prima.metodo || ''
  return [es.testo, es.soggetto?.testo, giustaDi(es)?.testo, es.aiuto].filter(Boolean).join(' ')
}
