/* La scala della fattoria 3D sul metro di docs/apprendimento/calibrazione.md (🪙1 = 10 s di esercizio, 🪙6 al minuto):
   funzioni pure che leggono i dati veri. Le usano `npm run tara:fattoria3d` (che stampa la tabella) e `unita/fattoria3d-taratura`
   (che tiene ferme le promesse). Vedi docs/fattoria3d/livelli.md. */
import { PEZZI, EDIFICI } from '../dati/catalogo.js'
import { COLTURE } from '../dati/colture.js'
import { RICETTE } from '../dati/ricette.js'
import { ANIMALI, PRODOTTI_ANIMALI, LANA } from '../dati/animali.js'
import { ULTIMO, sogliaDi, roba } from '../dati/livelli.js'
import { COSTI, prezzoDelLotto } from '../dati/regole.js'
import { MONETE_AL_MINUTO, premioDi, tettoDi } from '../dati/ordini.js'

// Le promesse di scala (minuti di esercizio, ms di attesa)
export const TETTO_LIVELLO_2_MIN = 10
export const TETTO_ULTIMO_MIN = 420          // 7 ore (erano 5 e mezza fino ai quindici livelli: telaio, zuccherificio, sartoria e tintoria ne hanno aggiunto un sedicesimo)
export const TETTO_ATTESA_MS = 120_000       // per cosa chiesta, in catena
export const TETTO_PREZZO_SUL_SALTO = 0.65   // un pezzo produttivo non costa più dei due terzi del salto del suo livello

export const LOTTI_DA_VEDERE = [1, 5, 10, 20, 33, 34, 50, 75, 100, 150, 200]     // quali lotti (il n-esimo comprato) stampa la tabella
export const SETTIMANA_MIN = 7 * 30            // una settimana di mezz'ora al giorno: oltre il centesimo lotto si sta più di così a pagarne uno
export const TETTO_ESPERIENZA_LOTTO = 1 / 3    // un lotto dà al più un terzo di tutta la scala dei livelli: la terra cara non salta i livelli

/** Una riga per lotto da vedere: il prezzo, i minuti di esercizio equivalenti, l'esperienza che dà. Il lotto n è il n-esimo comprato oltre i nove di partenza. */
export function tabellaLotti() {
  return LOTTI_DA_VEDERE.map(n => { const prezzo = prezzoDelLotto(n - 1); return { n, prezzo, minuti: prezzo / MONETE_AL_MINUTO, esperienza: Math.min(prezzo, COSTI.lottoEsperienzaMax) } })
}

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
  // il mondo non ha confini ma il prezzo sì: sale a ogni lotto, i primi 33 sono quelli di sempre, il centesimo costa più di una settimana, e nessun lotto salta la scala
  for (let n = 1; n < 400; n++) if (!(prezzoDelLotto(n) > prezzoDelLotto(n - 1))) g.push(`il lotto ${n + 1} non costa più del precedente`)
  if (prezzoDelLotto(99) / MONETE_AL_MINUTO < SETTIMANA_MIN) g.push(`il centesimo lotto costa solo ${Math.round(prezzoDelLotto(99) / MONETE_AL_MINUTO)} minuti di esercizio (almeno ${SETTIMANA_MIN})`)
  if (COSTI.lottoEsperienzaMax > sogliaDi(ULTIMO) * TETTO_ESPERIENZA_LOTTO) g.push(`un lotto dà ${COSTI.lottoEsperienzaMax} di esperienza, più di un terzo della scala (${sogliaDi(ULTIMO)})`)
  for (const k of Object.keys(RICETTE)) if (premioDi({ [k]: 1 }) > tettoDi({ [k]: 1 }) + 1e-9) g.push(`${k}: il premio supera il tetto`)
  // le colture non si accorciano salendo di livello, e le ultime si contano in minuti più che in secondi
  const cs = Object.values(COLTURE).sort((a, b) => a.liv - b.liv)
  for (let i = 1; i < cs.length; i++) if (cs[i].liv > cs[i - 1].liv && cs[i].ms < cs[i - 1].ms) g.push(`${cs[i].nome} matura prima di ${cs[i - 1].nome}, che arriva prima`)
  return g
}
