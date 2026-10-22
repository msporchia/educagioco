// L'invio diretto dei resoconti al computer di sviluppo (strumenti/ricevi-log.mjs). Mai errori: o va o dice di no.
// Vedi docs/core/vecchio-telefono-veri.md.
const TIMEOUT_SONDA = 1500
const TIMEOUT_INVIO = 15000

async function conTempo (url, opzioni, ms) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  try { return await fetch(url, { ...opzioni, signal: c.signal, cache: 'no-store' }) } finally { clearTimeout(t) }
}

export async function sondaRicevitore (origin = (typeof location !== 'undefined' ? location.origin : '')) {
  try {
    if (!origin || origin === 'null' || origin.startsWith('file:')) return false
    const r = await conTempo(origin + '/ricevi-log', { method: 'GET' }, TIMEOUT_SONDA)
    if (!r.ok) return false
    const j = await r.json()
    return !!(j && j.ok === true && j.v === 1)
  } catch { return false }
}

// payload: { testo, dati?, agente?, note?, quando? }
export async function mandaAlRicevitore (payload, origin = (typeof location !== 'undefined' ? location.origin : '')) {
  try {
    const r = await conTempo(origin + '/ricevi-log', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
    }, TIMEOUT_INVIO)
    const j = await r.json().catch(() => null)
    if (r.ok && j && j.ok) return { ok: true, file: j.file }
    return { ok: false, errore: (j && j.errore) || `risposta ${r.status}` }
  } catch (e) {
    return { ok: false, errore: e && e.name === 'AbortError' ? 'tempo scaduto' : String((e && e.message) || e) }
  }
}
