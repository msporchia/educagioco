/* Lo smistamento degli amici (docs/core/amici.md), senza niente di Cloudflare: così si prova con collegamenti finti.
   Ogni telefono ha UN collegamento e dichiara chi è (`id`, casuale, del bambino) e le chiavi delle sue amicizie (≤ 6). Una chiave
   è di due persone al massimo: il servizio avvisa chi la possiede quando l'altro c'è o se ne va, e inoltra i messaggi di quella
   chiave all'altro. Non legge i messaggi: controlla forma, misura e ritmo. */
export const MAX_BYTE = 512
export const MAX_AL_SECONDO = 20
export const MAX_CHIAVI = 6
export const MAX_COLLEGAMENTI = 3000
export const ID = /^[a-z0-9]{8,32}$/
export const CHIAVE = /^[a-z0-9]{32}$/

/* `soci`: i collegamenti che si sono presentati, [{ ws, id, chiavi }]. Tutte le funzioni tornano cosa mandare e a chi
   (`invii: [{ a, msg }]`), mai niente di Cloudflare. */
const tengono = (soci, chiave) => soci.filter(s => s.chiavi.includes(chiave))
const personeDiverse = soci => new Set(soci.map(s => s.id)).size

/* Un telefono si presenta, o aggiorna le sue chiavi (aggiunge o toglie un'amicizia a collegamento aperto).
   Chi rientra con lo stesso id prende il posto del suo vecchio collegamento (che va chiuso, senza avvisare nessuno).
   Una chiave già tenuta da due altre persone si rifiuta: è di due e basta. */
export function dichiara(soci, ws, id, chiaviChieste) {
  const prima = soci.find(s => s.ws === ws)?.chiavi || []
  const altri = soci.filter(s => s.ws !== ws)
  const sostituiti = altri.filter(s => s.id === id).map(s => s.ws)
  const restano = altri.filter(s => s.id !== id)
  const chiavi = [], rifiutate = []
  for (const c of [...new Set(chiaviChieste)].slice(0, MAX_CHIAVI)) {
    const t = tengono(restano, c)
    if (personeDiverse(t) >= 2) rifiutate.push(c)
    else chiavi.push(c)
  }
  const invii = []
  const presenti = chiavi.filter(c => tengono(restano, c).length)
  invii.push({ a: ws, msg: { t: 'ciao', presenti, rifiutate } })
  for (const c of chiavi.filter(c => !prima.includes(c))) for (const s of tengono(restano, c)) invii.push({ a: s.ws, msg: { t: 'su', chiave: c } })
  for (const c of prima.filter(c => !chiavi.includes(c))) for (const s of tengono(restano, c)) invii.push({ a: s.ws, msg: { t: 'giu', chiave: c } })
  return { chiavi, sostituiti, invii }
}

/* un collegamento si chiude: chi condivideva una sua chiave lo sa */
export function chiudi(soci, ws) {
  const mio = soci.find(s => s.ws === ws)
  if (!mio) return []
  const invii = []
  for (const c of mio.chiavi) for (const s of tengono(soci.filter(x => x.ws !== ws), c)) invii.push({ a: s.ws, msg: { t: 'giu', chiave: c } })
  return invii
}

/* un messaggio per un amico: solo su una chiave che si possiede, e va a chi la possiede insieme a noi */
export function inoltra(soci, ws, chiave, m) {
  const mio = soci.find(s => s.ws === ws)
  if (!mio || !mio.chiavi.includes(chiave) || !m || typeof m !== 'object' || Array.isArray(m)) return []
  return tengono(soci.filter(s => s.ws !== ws), chiave).map(s => ({ a: s.ws, msg: { t: 'da', chiave, m } }))
}

/* un messaggio in arrivo: di testo, piccolo, JSON con un oggetto che ha `k`, e non troppi al secondo. `recenti` sono gli istanti
   (ms) dei messaggi di questo collegamento nell'ultimo secondo; torna i nuovi. */
export function controllaMessaggio(messaggio, recenti, ora) {
  if (typeof messaggio !== 'string' || messaggio.length > MAX_BYTE) return { ok: false, codice: 1009, ragione: 'messaggio troppo grande' }
  const r = recenti.filter(t => ora - t < 1000)
  r.push(ora)
  if (r.length > MAX_AL_SECONDO) return { ok: false, codice: 1008, ragione: 'troppi messaggi' }
  let dato
  try { dato = JSON.parse(messaggio) } catch { return { ok: false, codice: 1003, ragione: 'non è un messaggio' } }
  if (!dato || typeof dato !== 'object' || typeof dato.k !== 'string') return { ok: false, codice: 1003, ragione: 'non è un messaggio' }
  return { ok: true, recenti: r, dato }
}
