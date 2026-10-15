// Calcoli lunghi e sempre uguali (la geografia delle mappe di inglese e spagnolo), tenuti da parte fra un'apertura
// dell'app e l'altra. Un database tutto suo (`educagioco-calcoli`): non è un salvataggio, quindi non deve finire nei
// backup né nell'esportazione dei grandi, e il service worker non lo tocca (cancella solo le sue cache).
// Una copia vale per la versione dell'app che l'ha fatta: aggiornando si rifà una volta. Non lancia mai e non aspetta
// mai più di un attimo: senza IndexedDB (o lento) si ricalcola, come prima. Vedi docs/core/avvio-e-memoria.md.
const NOME = 'educagioco-calcoli'
const QUESTA = typeof __VERSIONE__ !== 'undefined' ? __VERSIONE__.id : ''
const PAZIENZA = 800

let aperto = null
function apri() {
  if (aperto) return aperto
  aperto = new Promise(ok => {
    if (typeof indexedDB === 'undefined') return ok(null)
    const scaduta = setTimeout(() => ok(null), PAZIENZA)
    try {
      const r = indexedDB.open(NOME, 1)
      r.onupgradeneeded = () => { r.result.createObjectStore('kv') }
      r.onsuccess = () => { clearTimeout(scaduta); ok(r.result) }
      r.onerror = r.onblocked = () => { clearTimeout(scaduta); ok(null) }
    } catch (e) { clearTimeout(scaduta); ok(null) }
  })
  return aperto
}

const richiesta = (db, modo, fn) => new Promise(ok => {
  try {
    const r = fn(db.transaction('kv', modo).objectStore('kv'))
    r.onsuccess = () => ok(r.result)
    r.onerror = () => ok(null)
  } catch (e) { ok(null) }
})

// tutto quello che questa versione ha messo da parte sotto `gruppo`: chiave → valore. Le copie di altre versioni se ne vanno.
export async function leggiCalcoli(gruppo) {
  const db = await apri()
  if (!db) return new Map()
  const dati = new Map()
  const prefisso = `${QUESTA}|${gruppo}|`
  const chiavi = (await richiesta(db, 'readonly', s => s.getAllKeys())) || []
  const vecchie = chiavi.filter(k => typeof k === 'string' && !k.startsWith(`${QUESTA}|`))
  for (const k of chiavi) {
    if (typeof k !== 'string' || !k.startsWith(prefisso)) continue
    const v = await richiesta(db, 'readonly', s => s.get(k))
    if (v != null) dati.set(k.slice(prefisso.length), v)
  }
  for (const k of vecchie) richiesta(db, 'readwrite', s => s.delete(k))
  return dati
}

export async function mettiDaParte(gruppo, chiave, valore) {
  const db = await apri()
  if (db) await richiesta(db, 'readwrite', s => s.put(valore, `${QUESTA}|${gruppo}|${chiave}`))
}
