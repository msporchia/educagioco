// Quello che la scena dei mostri di sopra aggiunge al motore (motore/aperta.js), senza toccarlo (docs/sotterraneo/mondo-aperto-mostri.md,
// «La scena»): lo scontro lasciato con la ✕ e com'è ripreso, il passo dell'eroe che va a toccare un mostro, e il conto delle taglie della
// bacheca (caccia aperta, signore, tana) dai mostri caduti. Le forze di sopra stanno in motore/forze-sopra.js. Puro: gira in Node.
import { esitoDelloScontro, taglieDaContare as contaLeTaglie, tanaDi, spaziDi } from './aperta.js'
import { taglieDaContare as cacceAperte, taglieDaBattere } from './taglie.js'
import { rifaDaId } from '../dati/missioni-modelli.js'
import { POSTI_SUL_PALCO } from './palco.js'
import { SOPRA } from '../dati/mondo-aperto-mostri.js'

// Gioco.vue chiede questo file a richiesta: quello che gli
// serve del motore passa da qui
export { apriLoScontro, esitoDelloScontro, raccogliDaTerra, cittaDelRisveglio } from './aperta.js'

/* ═══════════ lo scontro lasciato con la ✕ ═══════════
   Uscire non butta la partita (docs/core/ripresa.md), ma non è nemmeno una fuga gratis: lo scontro si chiude come una fuga senza il
   graffio (i morti restano morti, chi resta tiene le sue ferite, la roba e l'esperienza presa restano), e chi resta si ricorda dov'era.
   Rientrando i rimasti stanno accanto all'eroe, svegli, con le loro ferite: lo scontro si riapre da sé, al primo passo del motore */

// la foto dello scontro al suo inizio (o a metà): chi è in campo e le sue ossa, e dove sta l'eroe. È quello che si salva in
// `mondo.sopra.scontro` quando lo scontro si apre: se il telefono si spegne in mezzo, rientrando si ricomincia da qui
export function fotoDelloScontro(corsa) {
  const d = corsa.dalMondo || { x: 0, y: 0 }
  const campo = corsa.livello.robe.filter(r => r.che === 'mostro' && r.mondo != null && !r.morto).map(r => [r.mondo, Math.max(1, r.ossa)])
  return campo.length ? { campo, x: Math.floor(d.x), y: Math.floor(d.y) } : null
}

// la ✕ in mezzo allo scontro: lo chiude come una fuga (o com'è finito, se è già finito: svenuto resta svenuto). Torna l'esito di
// esitoDelloScontro e la foto di chi resta (null se non resta nessuno)
export function lasciaLoScontro(stato, corsa, { terra = null } = {}) {
  if (corsa.foglio && corsa.foglio.che === 'scontro') corsa.chiudi()
  const foto = fotoDelloScontro(corsa)
  const esito = esitoDelloScontro(stato, corsa, { terra })
  return { esito, scontro: esito.come === 'scappato' ? foto : null }
}

// rientrando: i rimasti dello scontro lasciato tornano accanto all'eroe (x, y), svegli e con le loro ferite, sulle celle della loro
// zona dove possono camminare; chi nel frattempo è morto o non c'è più (la sua zona buttata) resta com'è. Torna quanti ne ha rimessi
export function rimettiLoScontro(stato, scontro) {
  if (!scontro || !Array.isArray(scontro.campo) || !Number.isInteger(scontro.x) || !Number.isInteger(scontro.y)) return 0
  const m = stato.mondo, { casa } = spaziDi(m)
  let n = 0, k = 0
  for (const v of scontro.campo) {
    if (!Array.isArray(v)) continue
    const q = stato.mostri[v[0]]
    if (!q || q.morto) continue
    let dove = null
    for (; k < POSTI_SUL_PALCO.length * 2 && !dove; k++) {
      const [dx, dy] = POSTI_SUL_PALCO[k % POSTI_SUL_PALCO.length]
      const x = scontro.x + dx * (k < POSTI_SUL_PALCO.length ? 1 : -1), y = scontro.y + dy
      if (x >= 0 && y >= 0 && x < m.W && y < m.H && casa[y * m.W + x] === q.zona) dove = { x, y }
    }
    if (!dove) continue
    q.fx = dove.x + 0.5; q.fy = dove.y + 0.5
    q.ossa = Math.max(1, Math.min(q.scheda.ossaMax, Number(v[1]) || q.scheda.ossaMax))
    q.sveglio = true; q.calmo = 0
    n++
  }
  return n
}

/* ═══════════ il tocco su un mostro ═══════════ */
// toccato un mostro lontano, l'eroe gli va incontro: la cella da cui toccarlo (la sua, o accanto se non ci si cammina) o null
export function doveToccare(q, passa) {
  const x = Math.floor(q.fx), y = Math.floor(q.fy)
  if (passa(x, y)) return { x, y }
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) if (passa(x + dx, y + dy)) return { x: x + dx, y: y + dy }
  return null
}
export const abbastanzaVicino = (q, x, y) => Math.hypot(q.fx - x, q.fy - y) <= SOPRA.tocco

/* ═══════════ le taglie della bacheca ═══════════ */
// Cosa fanno i mostri caduti in uno scontro (`uccisi` dell'esito, le taglie del motore) alle taglie in mano (`stati`, mondo.quest e le
// missioni insieme): le caccie aperte contano (`conti[id]`, da sommare a quelli di prima), e a `quanti` sono fatte; il signore della
// regione caduto fa la sua; la tana è fatta quando il branco del signore è tutto a terra. Torna { conti, fatte }
export function taglieDelloScontro(uccisi, { stati = {}, conti = {}, stato = null } = {}) {
  const nuovi = {}, fatte = []
  const fai = id => { if (!fatte.includes(id)) fatte.push(id) }
  const viste = new Set()
  for (const t of uccisi || []) {
    for (const q of cacceAperte(stati, t.specie, t.regione)) {
      if (viste.has(q.id)) continue
      viste.add(q.id)
      const c = rifaDaId(q.id)
      const n = (conti[q.id] || 0) + contaLeTaglie(uccisi, { specie: c.specie, regione: c.regione })
      nuovi[q.id] = Math.min(q.quanti, n)
      if (n >= q.quanti) fai(q.id)
    }
    if (t.signore) for (const id of taglieDaBattere(stati, 'signore', t.regione)) fai(id)
  }
  if (stato) for (const r of new Set((uccisi || []).map(t => t.regione))) {
    const tana = tanaDi(stato, r)
    if (!tana || tana.branco == null) continue
    if ((stato.branchi[tana.branco] || []).every(i => !stato.mostri[i] || stato.mostri[i].morto)) for (const id of taglieDaBattere(stati, 'tana', r)) fai(id)
  }
  return { conti: nuovi, fatte }
}
