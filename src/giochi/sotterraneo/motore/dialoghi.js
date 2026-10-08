// I dialoghi della terra di sopra, senza schermo (docs/sotterraneo/dialoghi.md): cosa dice un personaggio quando ci
// si parla, a pagine, e quali domande gli si possono fare alla fine. Le pagine dipendono da dove si è nella storia
// (le discese finite) e dalle sue missioni. Gira in Node; lo mostra viste/Dialogo.vue, lo usa viste/Terra.vue.
// Una pagina è { testo, dato?, missione?, fase?, manca? }: `dato` dice ai test (e allo stile) che riga è.
// `ctx` è { stati, tappe, abisso, eroe, roba, annuncio }: lo stato delle missioni, le tappe dell'avventura, se l'abisso è
// aperto, chi scende e la sua roba contata (schedaConLaRoba), per la frase di chi è sotto il livello; e, finita la
// storia, la zona che si è svegliata (motore/zone.js, docs/sotterraneo/zone.md).
import { DIALOGHI, ARRIVEDERCI, DOVE_VADO, perOra } from '../dati/dialoghi.js'
import { missioneDi, premioDetto } from '../dati/missioni.js'
import { cosaDice, chiTiCerca, titoloDi, inFrase } from './missioni.js'
import { GROSSI, GROSSO_DELLA_DISCESA } from '../dati/grossi.js'
import { LUOGHI, POSTO_DI } from '../dati/terra.js'
import { COSE } from '../dati/cose.js'
import { mercanteDi } from '../dati/mercanti.js'
import { dettoDelLivello } from './storia.js'

export const finiteDi = tappe => (tappe || []).filter(t => t.fatta).length
const maiuscola = s => s.charAt(0).toUpperCase() + s.slice(1)
const PIANI = ['', 'primo', 'secondo', 'terzo', 'quarto', 'quinto']

// Una frase lunga va a pagine: una o due frasi per pagina, che il riquadro non scorra mai
export function inPagine(testo, max = 120) {
  const frasi = String(testo || '').split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÚÈÉ«])/).filter(Boolean)
  const pagine = []
  for (const f of frasi) {
    const ultima = pagine.at(-1)
    if (ultima && ultima.n < 2 && ultima.testo.length + 1 + f.length <= max) { ultima.testo += ' ' + f; ultima.n++ }
    else pagine.push({ testo: f, n: 1 })
  }
  return pagine.map(p => p.testo)
}

/* ═══════════ il minatore: la strada, e cosa c'è laggiù ═══════════ */

// «cosa faccio adesso»: la prossima discesa e la strada, chi è sotto il livello, chi ti cerca al villaggio
export function strada(ctx) {
  const t = (ctx.tappe || []).find(x => x.adesso)
  const pagine = []
  const z = ctx.annuncio && (ctx.tappe || []).find(x => x.chiave === ctx.annuncio.chiave)
  if (z) {
    // finita la storia il minatore racconta la zona che si è svegliata, e dove sta
    for (const testo of inPagine(ctx.annuncio.detto)) pagine.push({ testo, dato: 'annuncio' })
    pagine.push({ testo: `${z.nome}: ${LUOGHI[POSTO_DI[z.chiave]]}.`, dato: 'detto' })
  } else if (t) {
    pagine.push({ testo: `${t.nome}: ${LUOGHI[POSTO_DI[t.chiave]]}.`, dato: 'detto' })
    const s = !t.fatta && ctx.roba && ctx.eroe ? dettoDelLivello(ctx.eroe, ctx.roba, t, t.indice) : null
    if (s) pagine.push({ testo: s.detto, dato: 'sotto-livello', manca: s.manca })
  } else if (ctx.abisso) {
    pagine.push({ testo: `Le sette discese le hai fatte tutte. Resta l'abisso: ${LUOGHI[POSTO_DI.abisso]}.`, dato: 'detto' })
  } else {
    pagine.push({ testo: 'Le discese aperte le hai fatte tutte. Tornaci quando vuoi: là sotto cambia sempre.', dato: 'detto' })
  }
  for (const r of chiTiCerca(ctx.stati, ctx.tappe)) pagine.push({ testo: r, dato: 'ti-cerca' })
  return pagine
}

// il mostro grosso che aspetta in fondo alla prossima discesa: chi gioca sa chi incontrerà prima di scendere
function laggiuDalMinatore(ctx) {
  const t = (ctx.tappe || []).find(x => (ctx.annuncio ? x.chiave === ctx.annuncio.chiave : x.adesso))
  const g = t ? GROSSI[GROSSO_DELLA_DISCESA[t.chiave]] : null
  if (g) return [`In fondo, ${t.dove}, aspetta ${g.nome}.`, g.dice, 'Ha lui la chiave dell\'ultima scala: se cade, la discesa è tua.']
  if (ctx.abisso) return ['Il pozzo vecchio non ha fondo. Ogni cinque piani qualcuno di grosso fa la guardia.',
                          'Nessuno è mai tornato a dire cosa c\'è in fondo. Forse perché un fondo non c\'è.']
  return ['Per ora hai visto quello che c\'era da vedere. Ma là sotto le stanze cambiano: tornaci.']
}

/* ═══════════ le missioni, dette da chi le dà ═══════════ */

const nomeDiscesa = (ctx, chiave) => ((ctx.tappe || []).find(t => t.chiave === chiave) || {}).nome || ''

function dellaMissione(v, ctx) {
  const m = v.missione
  if (v.fase === 'offre') return inPagine(m.dice).map(testo => ({ testo, missione: m.id, fase: 'offre' }))
  if (v.fase === 'consegna') return [{ testo: m.ritorno, missione: m.id, fase: 'consegna' }]
  const dove = `${nomeDiscesa(ctx, m.discesa).toLowerCase()}, al ${PIANI[m.piano + 1] || m.piano + 1 + '°'} piano`
  return [{ testo: `${maiuscola(inFrase(titoloDi(m)))} è ancora laggiù: ${dove}. Io aspetto.`, missione: m.id, fase: 'aspetta' }]
}

/* ═══════════ quello che si dice ═══════════ */

// Quando ci si avvicina: la presentazione la prima volta (il minatore), poi le missioni (prima quello che hai fatto
// per lui, poi quello che ti chiede, poi quello che aspetta), poi il saluto. Il minatore dice sempre anche la strada
export function apertura(chi, ctx, { primaVolta = false } = {}) {
  const d = DIALOGHI[chi] || {}
  const pagine = []
  if (chi === 'minatore' && primaVolta) for (const testo of d.presentazione || []) pagine.push({ testo })
  if (chi === 'minatore') pagine.push(...strada(ctx))
  for (const v of cosaDice(chi, ctx.stati, ctx.tappe).voci) pagine.push(...dellaMissione(v, ctx))
  if (!pagine.length) {
    const s = perOra(d.saluti, finiteDi(ctx.tappe))
    // i mercanti salutano con la loro battuta (dati/mercanti.js), la stessa del banco
    const m = !s && mercanteDi(chi) && mercanteDi(chi).dice
    if (s) pagine.push({ testo: s.testo, dato: 'saluto' })
    else if (m) pagine.push({ testo: m, dato: 'saluto' })
  }
  return pagine
}

// le domande da fare, nell'ordine: quello che si fa per le missioni, la sua cosa (la bottega, la strada), la storia,
// e arrivederci. `chieste`: quelle già fatte in questo dialogo, che non tornano (arrivederci sì, sempre)
export function scelte(chi, ctx, chieste = new Set()) {
  const d = DIALOGHI[chi] || {}
  const s = []
  for (const v of cosaDice(chi, ctx.stati, ctx.tappe).voci) {
    const m = v.missione
    const premio = premioDetto(m.premio)
    if (v.fase === 'consegna')
      s.push({ che: 'consegna', missione: m.id, testo: m.tipo === 'trova' ? 'Ecco qua' : 'Non darà più fastidio', premio })
  }
  const nuove = cosaDice(chi, ctx.stati, ctx.tappe).voci.filter(v => v.fase === 'offre')
  for (const v of nuove)
    s.push({ che: 'prendi', missione: v.missione.id, premio: premioDetto(v.missione.premio),
             testo: nuove.length > 1 ? `Ci penso io: ${inFrase(titoloDi(v.missione))}` : 'Ci penso io' })
  if (d.bottega) s.push({ che: 'bottega', testo: d.bottega })
  if (d.vendi) s.push({ che: 'vendi', testo: d.vendi })
  if (chi === 'minatore' && !chieste.has('strada')) s.push({ che: 'strada', testo: DOVE_VADO })
  if (!chieste.has('racconta') && (chi === 'minatore' || perOra(d.racconti, finiteDi(ctx.tappe))))
    s.push({ che: 'racconta', testo: d.domanda })
  s.push({ che: 'ciao', testo: ARRIVEDERCI })
  return s
}

// la risposta a una domanda che non fa niente se non parlare: la storia, o la strada
export function risposta(chi, che, ctx) {
  if (che === 'strada') return strada(ctx)
  if (che !== 'racconta') return []
  if (chi === 'minatore') return laggiuDalMinatore(ctx).map(testo => ({ testo, dato: 'racconto' }))
  const r = perOra((DIALOGHI[chi] || {}).racconti, finiteDi(ctx.tappe))
  return r ? r.pagine.map(testo => ({ testo, dato: 'racconto' })) : []
}

// accettato un favore: lui ringrazia, e la strada la ricorda la freccina
export function dopoLaPresa(chi, id) {
  const d = DIALOGHI[chi] || {}
  return [{ testo: d.presa || 'Conto su di te.', missione: id, fase: 'presa' }]
}

// consegnata: il grazie, e quello che si riceve (le monete sono quelle pagate davvero: il salvadanaio può tenerne).
// Se adesso ha un altro favore da chiederti, lo chiede subito: `ctx` è quello di dopo la consegna
export function dopoLaConsegna(chi, id, esito, ctx) {
  const m = missioneDi(id)
  if (!m || !esito) return []
  if (esito.esito === 'pieno') return [{ testo: 'Hai le tasche piene. Fai posto, e torna da me.', missione: id, fase: 'pieno' }]
  if (esito.esito !== 'consegnata') return []
  const pagine = inPagine(m.grazie).map(testo => ({ testo, missione: id, fase: 'grazie' }))
  const p = m.premio
  const parti = []
  if (p.gemme) parti.push(`💎 ${p.gemme}`)
  if (p.cosa && COSE[p.cosa]) parti.push(COSE[p.cosa].nome)
  if (esito.monete) parti.push(`🪙 ${esito.monete}`)
  if (parti.length) pagine.push({ testo: parti.join(' · '), dato: 'premio', missione: id })
  for (const v of cosaDice(chi, ctx.stati, ctx.tappe).voci) if (v.fase === 'offre') pagine.push(...dellaMissione(v, ctx))
  return pagine
}

