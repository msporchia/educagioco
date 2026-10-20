/* La logica di una amicizia fra due telefoni (docs/core/amici.md), senza niente di Cloudflare: così si prova con collegamenti finti.
   Una `Coppia` ha due posti; chi entra dice chi è (`id`, casuale, del bambino) e se è lo stesso di uno già dentro (un collegamento
   caduto che ritorna) prende il suo posto. Il servizio inoltra e basta: non legge i messaggi, controlla solo forma e misura. */
export const MAX_BYTE = 512
export const MAX_AL_SECONDO = 20
export const ID = /^[a-z0-9]{8,32}$/
export const CHIAVE = /^[a-z0-9]{32}$/

/* `soci`: i collegamenti dentro, [{ id, ws }]. Chi entra con un id già dentro prende il suo posto (il vecchio si chiude);
   altrimenti c'è posto se sono meno di due. */
export function ammetti(soci, id) {
  const i = soci.findIndex(s => s.id === id)
  if (i >= 0) return { esito: 'sostituisce', vecchio: soci[i] }
  if (soci.length >= 2) return { esito: 'piena' }
  return { esito: 'nuovo' }
}

export const altroDi = (soci, ws) => soci.find(s => s.ws !== ws) || null

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
  return { ok: true, recenti: r }
}
