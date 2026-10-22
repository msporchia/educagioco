/* La scala della fattoria 3D sul metro di docs/apprendimento/calibrazione.md (🪙1 = 10 s di esercizio, 🪙6 al minuto): funzioni pure che
   leggono i dati veri. Le usano `npm run tara:fattoria3d` (che stampa la tabella) e `unita/fattoria3d-taratura` (che tiene ferme le promesse).
   Dal 22/10/2026 la scala è quella della 2D (70 livelli, prezzi, tempi in minuti): qui si misura che la 3D non se ne scosti, tranne dove
   deve (la pesca, la terra: docs/fattoria3d/livelli.md, parita/decisioni.md). Vedi docs/fattoria3d/livelli.md. */
import { PEZZI, EDIFICI } from '../dati/catalogo.js'
import { COLTURE } from '../dati/colture.js'
import { RICETTE } from '../dati/ricette.js'
import { ANIMALI, PRODOTTI_ANIMALI, LANA } from '../dati/animali.js'
import { ULTIMO, sogliaDi, roba, SCARTO_DELLA_PESCA, livelloDellaRicetta } from '../dati/livelli.js'
import { COSTI, PECORE, TERRA, prezzoDelLotto } from '../dati/regole.js'
import { PESCA } from '../dati/pesca.js'
import { MONETE_AL_MINUTO, premioDi, tettoDi } from '../dati/ordini.js'
import { attesaDelMangime } from '../dati/mangime.js'
import { coltura2d, ricetta2d, voce2d, bestia2d, livelloRicetta, msDaMinuti, sogliaDi2D, ULTIMO_2D, LIVELLO_PESCA, SCOMPARTO_BASE, SCOMPARTO_PIU, costoIngrandimento } from '../dati/parita2d.js'
import { postiPerMerce, prezzoDelPasso } from '../dati/silos.js'

// Le promesse di scala (minuti di esercizio, ms di attesa): quelle della 2D
export const TETTO_LIVELLO_2_MIN = 45        // il livello 2 della 2D: 260 monete, 43 minuti
export const TETTO_ULTIMO_MIN = 12150        // il 70 della 2D: ~202 ore di esercizio, contando solo la spesa (la pesca lo sposta di poche monete, vedi SCARTO_DELLA_PESCA)
export const TETTO_ATTESA_MS = 60 * 60000    // per cosa chiesta, in catena: un'ora (la più lunga della 2D è il maglione alla lavanda, 53 minuti)
export const TETTO_PREZZO_SUL_SALTO = 0.65   // un pezzo produttivo non costa più dei due terzi del salto del suo livello

export const LOTTI_DA_VEDERE = [1, 5, 10, 15, 20, 25, 30, 35, 40, 50, 75, 100]     // quali lotti (il n-esimo comprato) stampa la tabella
export const SETTIMANA_MIN = 7 * 30            // una settimana di mezz'ora al giorno: oltre il centesimo lotto si sta più di così a pagarne uno
export const TETTO_ESPERIENZA_LOTTO = 1 / 3    // un lotto dà al più un terzo di tutta la scala dei livelli: la terra cara non salta i livelli

/** Una riga per lotto da vedere: il prezzo, i minuti di esercizio equivalenti, l'esperienza che dà e le celle di terra che si hanno dopo. Il lotto n è il n-esimo comprato oltre i nove di partenza. */
export function tabellaLotti() {
  return LOTTI_DA_VEDERE.map(n => {
    const prezzo = prezzoDelLotto(n - 1)
    return { n, prezzo, minuti: prezzo / MONETE_AL_MINUTO, esperienza: Math.min(prezzo, COSTI.lottoEsperienzaMax), celle: (TERRA.lottiDiPartenza + n) * TERRA.celleLotto, piazzole2D: (TERRA.lottiDiPartenza + n) * TERRA.celleLotto / TERRA.cellePiazzola }
  })
}

/** Tempo (ms) minimo per avere uno di `k`, coi campi e le bestie in parallelo (un campo rende un raccolto) ma ogni macchina
 *  una cottura alla volta: un ingrediente da macchina in più copie costa una cottura per ogni copia. */
export function catenaMs(k, giri = 6) {
  if (giri <= 0) return Infinity
  if (COLTURE[k]) return COLTURE[k].ms
  if (LANA[k]) return LANA[k].ms
  const p = PRODOTTI_ANIMALI[k]
  if (p && p.ms) return p.ms                                                    // il pesce: un ciclo del banco (dati/pesca.js)
  if (p) { const a = ANIMALI[p.dove]; return a.ms + attesaDelMangime(a.mangia[0], a.pasti) }      // il suo tempo più il mangime che mangia (raccolti insieme, poi tante cotture quante i pasti)
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

/** Il confronto con la 2D, voce per voce (T21): la 3D non ha numeri suoi dove la 2D ne ha uno. Vuoto se tutto torna. */
export function guastiDiParita() {
  const g = []
  for (const [k, c] of Object.entries(COLTURE)) {
    const d = coltura2d(k)
    if (!d) { g.push(`${k}: nella 2D non c'è (dati/parita2d.js COLTURA)`); continue }
    if (c.ms !== msDaMinuti(d.minuti)) g.push(`${k}: matura in ${c.ms / 60000} min e in 2D in ${d.minuti}`)
    if (c.liv !== (d.liv || 1)) g.push(`${k}: arriva al ${c.liv} e in 2D al ${d.liv || 1}`)
    if (c.raccolta !== (d.raccolta || 0)) g.push(`${k}: raccoglierla costa ${c.raccolta} e in 2D ${d.raccolta || 0}`)
  }
  for (const [id, r] of Object.entries(RICETTE)) {
    const d = ricetta2d(id)
    if (!d) { g.push(`${id}: nella 2D non c'è`); continue }
    if (r.ms !== msDaMinuti(d.minuti)) g.push(`${id}: ci mette ${r.ms / 60000} min e in 2D ${d.minuti}`)
    if (r.liv !== livelloRicetta(id)) g.push(`${id}: arriva al ${r.liv} e in 2D al ${livelloRicetta(id)}`)
    if ((r.costo || 0) !== (d.costo || 0)) g.push(`${id}: costa ${r.costo || 0} e in 2D ${d.costo || 0}`)
  }
  for (const [tipo, c] of [...Object.entries(PEZZI), ...Object.entries(EDIFICI)]) {
    const v = voce2d(tipo)
    if (!v) continue                                                              // solo 3D (bacheca, passerella, molo, porticciolo): dichiarati a mano
    if (c.prezzo !== v.prezzo) g.push(`${tipo}: costa ${c.prezzo} e in 2D ${v.prezzo}`)
  }
  for (const [tipo, A] of Object.entries(ANIMALI)) {
    const d = bestia2d(tipo)
    if (A.ms !== msDaMinuti(d.minuti)) g.push(`${tipo}: ci mette ${A.ms / 60000} min e in 2D ${d.minuti}`)
    if ((A.costo || 0) !== (d.costo || 0)) g.push(`${tipo}: un pasto costa ${A.costo || 0} e in 2D ${d.costo || 0}`)
  }
  const lana = bestia2d('recinto')
  if (PECORE.laneMs !== msDaMinuti(lana.minuti) || PECORE.costo !== lana.costo) g.push('le pecore non fanno la lana come l\'ovile della 2D')
  if (ULTIMO !== ULTIMO_2D) g.push(`i livelli sono ${ULTIMO} e in 2D ${ULTIMO_2D}`)
  for (let l = 1; l <= ULTIMO + 2; l++) if (sogliaDi(l) !== sogliaDi2D(l) + (l > LIVELLO_PESCA ? SCARTO_DELLA_PESCA : 0)) g.push(`la soglia del livello ${l} non è quella della 2D`)
  if (SCOMPARTO_BASE !== 8 || SCOMPARTO_PIU !== 2) g.push('gli scomparti non sono quelli della 2D')
  for (let n = 0; n < 8; n++) if (prezzoDelPasso(n) !== costoIngrandimento(n) || postiPerMerce(n) !== 8 + 2 * n) g.push(`l'ingrandimento ${n + 1} non è quello della 2D`)
  return g
}

/** I guasti di scala (vuoto se tutto torna). */
export function guastiDellaScala() {
  const g = [], t = tabellaLivelli()
  if (t[1].minuti > TETTO_LIVELLO_2_MIN) g.push(`il livello 2 costa ${t[1].minuti} min di esercizio (tetto ${TETTO_LIVELLO_2_MIN})`)
  const u = t[t.length - 1]
  if (u.minuti > TETTO_ULTIMO_MIN) g.push(`il livello ${u.l} costa ${Math.round(u.minuti)} min di esercizio (tetto ${TETTO_ULTIMO_MIN})`)
  for (const k of [...Object.keys(COLTURE), ...Object.keys(PRODOTTI_ANIMALI), ...Object.keys(RICETTE)])
    if (catenaMs(k) > TETTO_ATTESA_MS) g.push(`${k}: ${Math.round(catenaMs(k) / 60000)} min di attesa in catena (tetto ${TETTO_ATTESA_MS / 60000})`)
  for (const [tipo, c] of [...Object.entries(PEZZI), ...Object.entries(EDIFICI)]) {
    const salto = sogliaDi(c.liv + 1) - sogliaDi(c.liv)
    if ((c.produttivo || EDIFICI[tipo]) && c.prezzo > salto * TETTO_PREZZO_SUL_SALTO) g.push(`${tipo}: costa ${c.prezzo}, più del ${Math.round(TETTO_PREZZO_SUL_SALTO * 100)}% del salto del suo livello (${salto})`)
  }
  // il mondo non ha confini ma il prezzo sì: sale a ogni lotto, il centesimo costa più di una settimana, e nessun lotto salta la scala
  for (let n = 1; n < 400; n++) if (!(prezzoDelLotto(n) > prezzoDelLotto(n - 1))) g.push(`il lotto ${n + 1} non costa più del precedente`)
  if (prezzoDelLotto(99) / MONETE_AL_MINUTO < SETTIMANA_MIN) g.push(`il centesimo lotto costa solo ${Math.round(prezzoDelLotto(99) / MONETE_AL_MINUTO)} minuti di esercizio (almeno ${SETTIMANA_MIN})`)
  if (COSTI.lottoEsperienzaMax > sogliaDi(ULTIMO) * TETTO_ESPERIENZA_LOTTO) g.push(`un lotto dà ${COSTI.lottoEsperienzaMax} di esperienza, più di un terzo della scala (${sogliaDi(ULTIMO)})`)
  for (const k of Object.keys(RICETTE)) if (premioDi({ [k]: 1 }) > tettoDi({ [k]: 1 }) + 1e-9) g.push(`${k}: il premio supera il tetto`)
  // la pesca prende il posto della peschiera: stesso livello, e un banco dà un pesce ogni quindici minuti come lei
  for (const k of ['molo', 'molo_v', 'porticciolo']) if (PEZZI[k].liv !== LIVELLO_PESCA) g.push(`${k}: la pesca arriva al ${PEZZI[k].liv} e la peschiera della 2D al ${LIVELLO_PESCA}`)
  if (PESCA.ms + PESCA.riposoMs !== msDaMinuti(ricetta2d('pesce').minuti)) g.push('un banco non dà un pesce ogni quindici minuti come la peschiera della 2D')
  if (livelloDellaRicetta('fritto') < LIVELLO_PESCA || livelloDellaRicetta('sushi') < LIVELLO_PESCA) g.push('una ricetta col pesce arriva prima della pesca')
  g.push(...guastiDiParita())
  return g
}
