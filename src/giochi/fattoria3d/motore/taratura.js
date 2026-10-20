/* La scala della fattoria 3D sul metro di docs/apprendimento/calibrazione.md (🪙1 = 10 s di esercizio, 🪙6 al minuto):
   funzioni pure che leggono i dati veri. Le usano `npm run tara:fattoria3d` (che stampa la tabella) e `unita/fattoria3d-taratura`
   (che tiene ferme le promesse). Vedi docs/fattoria3d/livelli.md. */
import { PEZZI, EDIFICI } from '../dati/catalogo.js'
import { COLTURE } from '../dati/colture.js'
import { RICETTE } from '../dati/ricette.js'
import { ANIMALI, PRODOTTI_ANIMALI, LANA } from '../dati/animali.js'
import { ULTIMO, sogliaDi, roba } from '../dati/livelli.js'
import { MONETE_AL_MINUTO, premioDi, tettoDi } from '../dati/ordini.js'

// Le promesse di scala (minuti di esercizio, ms di attesa)
export const TETTO_LIVELLO_2_MIN = 10
export const TETTO_ULTIMO_MIN = 420          // 7 ore (erano 5 e mezza fino ai quindici livelli: telaio, zuccherificio, sartoria e tintoria ne hanno aggiunto un sedicesimo)
export const TETTO_ATTESA_MS = 120_000       // per cosa chiesta, in catena
export const TETTO_PREZZO_SUL_SALTO = 0.65   // un pezzo produttivo non costa più dei due terzi del salto del suo livello

/** Tempo (ms) minimo per avere uno di `k`, coi campi e le bestie in parallelo (quattro tessere per campo) ma ogni macchina
 *  una cottura alla volta: un ingrediente da macchina in più copie costa una cottura per ogni copia. */
export function catenaMs(k, giri = 6) {
  if (giri <= 0) return Infinity
  if (COLTURE[k]) return COLTURE[k].ms
  if (LANA[k]) return LANA[k].ms
  const p = PRODOTTI_ANIMALI[k]
  if (p) { const a = ANIMALI[p.dove]; return a.ms + COLTURE[a.mangia[0]].ms }
  const r = RICETTE[k]
  if (!r) return Infinity
  const pronti = Math.max(...Object.entries(r.ing).map(([i, n]) => catenaMs(i, giri - 1) + (RICETTE[i] ? (n - 1) * RICETTE[i].ms : 0)))
  return pronti + r.ms
}

/** Una riga per livello: monete spese in tutto, minuti equivalenti, cosa si apre, l'attesa più lunga di ciò che apre. */
export function tabellaLivelli() {
  const righe = []
  for (let l = 1; l <= ULTIMO; l++) {
    const r = roba(l), soglia = sogliaDi(l)
    righe.push({
      l, soglia, minuti: soglia / MONETE_AL_MINUTO,
      salto: l > 1 ? soglia - sogliaDi(l - 1) : 0,
      lenta: Math.max(0, ...r.colture.map(c => c.ms), ...r.ricette.map(c => catenaMs(c.id))),
      pezzi: [...r.pezzi, ...r.edifici].map(c => ({ nome: c.nome, prezzo: c.prezzo })),
      colture: r.colture.map(c => ({ nome: c.nome, ms: c.ms })),
      ricette: r.ricette.map(c => ({ nome: c.nome, ms: catenaMs(c.id) })),
    })
  }
  return righe
}

/** I guasti di scala (vuoto se tutto torna). */
export function guastiDellaScala() {
  const g = [], t = tabellaLivelli()
  if (t[1].minuti > TETTO_LIVELLO_2_MIN) g.push(`il livello 2 costa ${t[1].minuti} min di esercizio (tetto ${TETTO_LIVELLO_2_MIN})`)
  const u = t[t.length - 1]
  if (u.minuti > TETTO_ULTIMO_MIN) g.push(`il livello ${u.l} costa ${Math.round(u.minuti)} min di esercizio (tetto ${TETTO_ULTIMO_MIN})`)
  for (const k of [...Object.keys(COLTURE), ...Object.keys(PRODOTTI_ANIMALI), ...Object.keys(RICETTE)])
    if (catenaMs(k) > TETTO_ATTESA_MS) g.push(`${k}: ${Math.round(catenaMs(k) / 1000)} s di attesa in catena (tetto ${TETTO_ATTESA_MS / 1000})`)
  for (const [tipo, c] of [...Object.entries(PEZZI), ...Object.entries(EDIFICI)]) {
    const salto = sogliaDi(c.liv + 1) - sogliaDi(c.liv)
    if ((c.produttivo || EDIFICI[tipo]) && c.prezzo > salto * TETTO_PREZZO_SUL_SALTO) g.push(`${tipo}: costa ${c.prezzo}, più del ${Math.round(TETTO_PREZZO_SUL_SALTO * 100)}% del salto del suo livello (${salto})`)
  }
  for (const k of Object.keys(RICETTE)) if (premioDi({ [k]: 1 }) > tettoDi({ [k]: 1 }) + 1e-9) g.push(`${k}: il premio supera il tetto`)
  // le colture non si accorciano salendo di livello, e le ultime si contano in minuti più che in secondi
  const cs = Object.values(COLTURE).sort((a, b) => a.liv - b.liv)
  for (let i = 1; i < cs.length; i++) if (cs[i].liv > cs[i - 1].liv && cs[i].ms < cs[i - 1].ms) g.push(`${cs[i].nome} matura prima di ${cs[i - 1].nome}, che arriva prima`)
  return g
}
