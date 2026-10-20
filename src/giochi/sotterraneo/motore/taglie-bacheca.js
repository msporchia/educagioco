// La bacheca col mondo davanti, senza schermo (docs/sotterraneo/mondo-aperto-quest.md, «Le taglie»): quali taglie appende una bacheca per
// (eroe, giro, città) guardando il mondo a percorso (motore/mondo-percorso.js: basta lo scheletro, nessuna zona caricata), le righe che
// mostra, il segno sopra di lei, e il posto sul prato del viandante e della X. Lo stato e le consegne stanno in motore/taglie.js. Gira in Node (unita/sotterraneo-quest-modelli).
import { CAMPAGNA } from '../dati/campagna.js'
import { MOSTRI } from '../dati/mostri.js'
import { rifaDaId, idDi, casoDa, hash, modelloAcceso, CACCE, COSE_PERSE, PER_BACHECA, TETTO_TAGLIE, MOTORI } from '../dati/missioni-modelli.js'
import { taglieInMano } from './taglie.js'

const statoDi = (stati, id) => (stati && typeof stati === 'object' ? stati[id] || null : null)
const FATTA = 'fatta'

/* ═══════════ chi serve quali posti ═══════════ */
// Ogni posto del mondo è servito dalla città più vicina: con una città sola, il villaggio serve tutti i luoghi (dalla loro tana), le pietre
// delle zone e i quattordici ingressi
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
export function cittaPiuVicina(m, p) {
  let meglio = null
  for (const c of m.citta) { const d = dist(p, c.centro); if (!meglio || d < meglio.d) meglio = { c, d } }
  return meglio.c.chiave
}
const tanaO = r => r.tana || { x: r.cx, y: r.cy }
export const regioniServite = (m, citta) => m.regioni.filter(r => r.chiave !== 'villaggio' && cittaPiuVicina(m, tanaO(r)) === citta)
const centroDi = p => ({ x: Math.floor(p.x + p.w / 2), y: Math.floor(p.y + p.h / 2) })

/* ═══════════ cosa appende una bacheca ═══════════ */
// `ctx`: { m, eroe, giro, tappe: [{ chiave, aperta }], stati, visto(x, y), raggiunge(x, y) } — visto e raggiunge di difetto dicono
// «non visto» e «raggiungibile». Niente si chiude più: `raggiunge` non va dato con la terra delle zone caricate, che direbbe «no» a
// tutto quello che è lontano
const tutti = () => true
export function candidati(citta, ctx) {
  const { m, tappe = [], giro = 0, eroe = '' } = ctx
  const visto = ctx.visto || (() => false), raggiunge = ctx.raggiunge || tutti
  const l = []
  const aggiungi = (modello, param) => { if (modelloAcceso(modello)) l.push({ modello, param }) }
  const regioni = regioniServite(m, citta).filter(r => raggiunge(tanaO(r).x, tanaO(r).y))
  const aperta = k => { const t = tappe.find(x => x.chiave === k); return !!(t && t.aperta) }
  for (const c of m.citta) if (c.chiave !== citta && raggiunge(c.pietra.accanto.x, c.pietra.accanto.y)) aggiungi('consegna', c.chiave)
  for (const r of regioni) {
    if (!visto(tanaO(r).x, tanaO(r).y)) aggiungi('esplora-regione', r.chiave)
    aggiungi('trova-chi', r.chiave)
    aggiungi('mappa', r.chiave)
  }
  // gli ingressi: da trovare tutti tranne l'abisso; nei sette della storia aperti anche la caccia, il mostro col nome e la cosa smarrita
  for (const p of m.posti.filter(x => x.tipo === 'ingresso' && x.indice !== -1)) {
    if (cittaPiuVicina(m, p) !== citta) continue
    const c = centroDi(p)
    if (!visto(c.x, c.y) && raggiunge(p.accanto.x, p.accanto.y)) aggiungi('esplora-ingresso', p.chiave)
    if (!(p.indice >= 0) || !aperta(p.chiave)) continue
    const t = CAMPAGNA.find(x => x.chiave === p.chiave)
    for (const s of Object.keys(CACCE[p.chiave] || {})) aggiungi('caccia', `${p.chiave}.${s}`)
    for (const s of t.mostri) if (!MOSTRI[s].capo) aggiungi('mostro', `${p.chiave}.${s}`)
    aggiungi('recupera', `${p.chiave}.${hash(`${eroe}|${giro}|${p.chiave}`) % COSE_PERSE.length}`)
  }
  // le pietre delle zone (quella del villaggio si vede da sé): il parametro è la zona
  for (const p of m.posti.filter(x => x.tipo === 'pietra' && x.zona && x.chiave.startsWith('zona:'))) {
    if (cittaPiuVicina(m, { x: p.x, y: p.y }) !== citta) continue
    const c = centroDi(p)
    if (!visto(c.x, c.y) && raggiunge(p.accanto.x, p.accanto.y)) aggiungi('esplora-pietra', p.zona)
  }
  if (MOTORI['mostri-sopra']) {
    for (const r of regioni) {
      for (const s of r.abitanti || []) aggiungi('caccia-aperta', `${r.chiave}.${s}`)
      if (r.caporale) aggiungi('signore', r.chiave)
      if (r.abitanti) aggiungi('tana', r.chiave)
    }
  }
  return l
}

const FAMIGLIA = modello => (modello.startsWith('esplora') ? 'esplora' : modello)
// I fogli di (eroe, giro, città): sempre gli stessi finché il mondo non cambia sotto (una regione vista, una discesa aperta). Si
// mescola con un caso seminato e se ne prendono PER_BACHECA, uno per famiglia di modelli finché si può, e poi gli altri
export function bachecaDi(citta, ctx) {
  const rnd = casoDa(`${ctx.eroe || ''}|${ctx.giro || 0}|${citta}`)
  const l = candidati(citta, ctx)
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [l[i], l[j]] = [l[j], l[i]] }
  const scelti = [], famiglie = new Set()
  for (const c of l) if (scelti.length < PER_BACHECA && !famiglie.has(FAMIGLIA(c.modello))) { scelti.push(c); famiglie.add(FAMIGLIA(c.modello)) }
  for (const c of l) if (scelti.length < PER_BACHECA && !scelti.includes(c)) scelti.push(c)
  return scelti.map(c => rifaDaId(idDi(citta, c.modello, c.param, ctx.giro || 0))).filter(Boolean)
}

// Le righe che la bacheca di una città mostra: quelle da consegnare qui, quelle in mano che portano a questa bacheca, e le nuove
// da prendere (non ancora toccate). `piene`: le tre in mano ci sono già, le nuove si vedono ma non si prendono
export function vociDellaBacheca(citta, ctx) {
  const stati = ctx.stati || {}
  const voce = (t, stato, azione) => ({ id: t.id, titolo: t.titolo, em: t.em, dove: t.dove, gemme: t.premio.gemme, stato, azione, nota: t.nota || '', tipo: t.tipo })
  const miei = taglieInMano(stati).filter(t => t.consegnaA === citta)
  const righe = []
  for (const t of miei) {
    const st = statoDi(stati, t.id)
    // una consegna portata a destinazione si dà qui, in un colpo; le altre aspettano di essere fatte (o si consegnano, fatte)
    if (st === FATTA || t.tipo === 'consegna') righe.push(voce(t, 'fatta', 'consegna'))
    else righe.push(voce(t, 'presa', null))
  }
  const piene = taglieInMano(stati).length >= TETTO_TAGLIE
  for (const t of bachecaDi(citta, ctx)) if (!statoDi(stati, t.id)) righe.push({ ...voce(t, 'offerta', piene ? null : 'prendi'), piena: piene })
  return righe
}

// Il segno sopra la bacheca, come sopra un personaggio: «?» d'oro che pulsa (c'è da consegnare), «!» (c'è un foglio da prendere),
// «?» grigio (hai preso qualcosa qui e non è ancora fatto), niente
export function segnoDellaBacheca(citta, ctx) {
  const v = vociDellaBacheca(citta, ctx)
  if (v.some(x => x.stato === 'fatta')) return 'consegna'
  if (v.some(x => x.stato === 'offerta' && x.azione)) return 'nuova'
  if (v.some(x => x.stato === 'presa')) return 'attesa'
  return null
}

/* ═══════════ dove stanno il viandante e la X ═══════════ */
// Un posto per taglia, sul prato, scelto con un caso suo (stesso id, stesso posto) vicino alla tana del luogo: la cella dove si cammina del
// luogo più vicina al punto voluto (ogni erba di una zona si raggiunge dalla sua strada: il generatore toglie quella che no). `terra` è
// quella del mondo (motore/terra.js); se la zona del luogo non è mai stata caricata non c'è ancora, e torna null: la scena chiede di nuovo
// quando la zona si carica. Torna { piede, accanto } o null
export function postoSulPrato(m, terra, t) {
  const ri = m.regioni.findIndex(x => x.chiave === t.regione)
  const r = m.regioni[ri]
  if (!r || r.chiave === 'villaggio') return null
  const rnd = casoDa(t.id + '|posto'), o = tanaO(r)
  const dx = Math.round((rnd() - 0.5) * 12), dy = Math.round((rnd() - 0.5) * 12)
  const voglio = { x: Math.max(1, Math.min(m.W - 2, o.x + dx)), y: Math.max(1, Math.min(m.H - 3, o.y + dy)) }
  const va = (x, y) => x >= 0 && y >= 0 && x < m.W && y < m.H && terra.passa(x, y) && m.reg[y * m.W + x] === ri && !m.strada[y * m.W + x]
  let c = null
  for (let d = 0; d <= 14 && !c; d++) for (let j = -d; j <= d && !c; j++) for (let i = -d; i <= d; i++) {
    if (Math.max(Math.abs(i), Math.abs(j)) !== d || !va(voglio.x + i, voglio.y + j)) continue
    c = { x: voglio.x + i, y: voglio.y + j }; break
  }
  if (!c) return null
  const accanto = terra.passa(c.x, c.y + 1) ? { x: c.x, y: c.y + 1 } : c
  return { piede: c, accanto }
}

