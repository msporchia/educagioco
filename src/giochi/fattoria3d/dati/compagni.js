/* I compagni della fattoria 3D: il cane di casa e i gatti che girano per il terreno. Sono vita sulla scena, non regole: non
   costano esperienza, non producono, non si salvano (ripartono vicino alla casa). Qui stanno i dati, il livello a cui arrivano
   e le scelte pure (dove andare, cosa fare) che il disegno (`scena3d/compagni.js`) usa col caso da fuori.
   Vedi docs/fattoria3d/compagni.md. */

import { ANIMALI_2D } from './parita2d.js'

// Il ripiego quando il profilo non dice se è contadino o contadina: di solito lo dice `personaDi(aspettoDi())` (dati/abiti.js, docs/fattoria3d/guardaroba.md).
export const ASPETTO_ERO = 'contadino'

// `liv`: il livello a cui arriva (come `liv` sui pezzi: `roba(liv)` lo raccoglie). Pepe, il gatto nero, arriva dove arriva il gatto nero della 2D (19); gli altri tre no: sono gli animali di casa e arrivano per primi. Il bobtail e il gatto bianco e nero hanno il nome vero di casa (Watson, Sherlock, Irene) e arrivano per primi (livelli 1-3).
export const COMPAGNI = {
  watson: { nome: 'Watson', tipo: 'cane',  variante: 'bobtail',   liv: 1,  verso: 'Bau!', arrivo: 'Watson è arrivato!' },
  sherlock: { nome: 'Sherlock', tipo: 'gatto', variante: 'bianconero', liv: 2,  verso: 'Prrr…', arrivo: 'Sherlock, il gatto, è arrivato!' },
  irene:   { nome: 'Irene',   tipo: 'gatto', variante: 'calico',     liv: 3,  verso: 'Prrr…', arrivo: 'Irene, la gattina, è arrivata!' },
  pepe:    { nome: 'Pepe',    tipo: 'gatto', variante: 'nero',       liv: ANIMALI_2D['gatto-nero'].liv, verso: 'Prrr…', arrivo: 'Pepe, il gatto nero, è arrivato!' },
}
export const VARIANTI_GATTO = ['bianconero', 'calico', 'nero', 'rosso']       // `rosso` non è un compagno gratis: è il gatto che si compra (dati/bestie.js)

/** I compagni che ci sono a questo livello (o prima), nell'ordine di arrivo. `soloQuesto`: quelli che arrivano proprio ora. */
export function compagniAl(livello, soloQuesto = false) {
  const l = Math.max(1, livello | 0)
  return Object.entries(COMPAGNI).map(([id, c]) => ({ id, ...c })).filter(c => soloQuesto ? c.liv === l : c.liv <= l).sort((a, b) => a.liv - b.liv)
}

/** Il centro di una cella e il suo contrario. */
export const centroCella = (i, j) => [i + 0.5, j + 0.5]
export const cellaDi = (x, z) => [Math.floor(x), Math.floor(z)]

/**
 * Una cella libera attorno a `centro` ([x, z] del mondo), fra `rMin` e `rMax` celle, scelta col caso `rnd`.
 * `evita`: elenco di [x, z, raggio] da cui stare lontani. Prima si prova a caso, poi si cerca a tappeto: torna null solo
 * se attorno non c'è proprio niente. Non esce mai su una cella che `libera` rifiuta.
 */
export function scegliMeta({ libera, centro, rMin = 1, rMax = 4, rnd = Math.random, evita = [] }) {
  const buona = (i, j) => libera(i, j) && !evita.some(([x, z, r]) => Math.hypot(i + 0.5 - x, j + 0.5 - z) < r)
  for (let n = 0; n < 24; n++) {
    const a = rnd() * Math.PI * 2, r = rMin + rnd() * (rMax - rMin)
    const i = Math.floor(centro[0] + Math.cos(a) * r), j = Math.floor(centro[1] + Math.sin(a) * r)
    if (buona(i, j)) return [i, j]
  }
  let meglio = null, d0 = Infinity
  const R = Math.ceil(rMax) + 2
  const ci = Math.floor(centro[0]), cj = Math.floor(centro[1])
  for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) {
    const d = Math.hypot(a, b)
    if (d < rMin - 0.5 || d > rMax + 1.5 || !buona(ci + a, cj + b)) continue
    if (d < d0) { d0 = d; meglio = [ci + a, cj + b] }
  }
  return meglio
}

/** La cella libera più vicina a (x, z), anche lontana (quando ci si trova sotto un pezzo appena messo). */
export function cellaLiberaVicina(libera, x, z, raggioMax = 14) {
  const ci = Math.floor(x), cj = Math.floor(z)
  let meglio = null, d0 = Infinity
  for (let a = -raggioMax; a <= raggioMax; a++) for (let b = -raggioMax; b <= raggioMax; b++) {
    const d = Math.hypot(a, b)
    if (d < d0 && libera(ci + a, cj + b)) { d0 = d; meglio = [ci + a, cj + b] }
  }
  return meglio
}

// ── cosa fa il cane / il gatto adesso ──
// stati del cane: 'sta' 'siede' 'annusa' 'dorme' 'festa' 'segue' 'vaga' (e quelli delle sequenze: alza zampa rotola salta riporta starnuta gira mano sbadiglia incontra); del gatto: 'sta' 'siede' 'lava' 'dorme' 'stiracchia' 'fusa' 'vaga' 'fugge' (e struscia rotola miao volta incontra)
export const DURATA = {
  siede: [4, 9], sta: [2, 4], annusa: [3, 6], dorme: [9, 18], festa: [2.2, 2.2], lava: [5, 9], stiracchia: [2.2, 3], fusa: [2.5, 2.5],
}
export const durataDi = (stato, rnd = Math.random) => { const d = DURATA[stato] || [2, 3]; return d[0] + rnd() * (d[1] - d[0]) }

/**
 * Cosa farà il cane. `s`: { dist (dal contadino), eroeFermo, eroeLavora, eroeInattivo (secondi) }.
 * Torna { stato, vai? } con `vai`: 'eroe' | 'campo' | 'attorno' | undefined (resta dov'è).
 */
export function decidiCane(s, rnd = Math.random) {
  if (s.dist > 7) return { stato: 'segue', vai: 'eroe', fretta: true }
  if (!s.eroeFermo && s.dist > 3.2) return { stato: 'segue', vai: 'eroe' }
  if (s.eroeLavora) return s.dist > 2.8 ? { stato: 'segue', vai: 'eroe' } : { stato: 'siede' }
  const r = rnd()
  if (r < 0.3) return { stato: 'siede' }
  if (r < 0.55) return { stato: 'annusa', vai: 'campo' }
  if (r < 0.7) return { stato: 'sta' }
  if (r < 0.8) return { stato: 'vaga', vai: 'attorno' }
  return s.eroeInattivo > 15 ? { stato: 'dorme' } : { stato: 'siede' }
}

/** Cosa farà il gatto: `s` = { dormePosto (c'è una panchina/bancarella) }. Il cane non lo fa più scappare: l'incontro è `incontroGattoCane`. */
export function decidiGatto(s, rnd = Math.random) {
  const r = rnd()
  if (r < 0.25) return { stato: 'vaga', vai: 'attorno' }
  if (r < 0.45) return { stato: 'siede' }
  if (r < 0.62) return { stato: 'lava' }
  if (r < 0.72) return { stato: 'stiracchia' }
  if (r < 0.85) return s.dormePosto ? { stato: 'dorme', vai: 'posto' } : { stato: 'dorme' }
  return { stato: 'sta' }
}

// ── quando ci premi (docs/fattoria3d/compagni.md): sequenze di passi, scelte pure ──
// Un passo: { stato, dur, sub?, guarda?: 'eroe'|'altro'|'via', ev?: [[secondi, nome]] } oppure { va: { r: [min, max], corsa?, verso?: 'cane'|'lontano' } }.
// I nomi degli eventi li esegue `Compagni._evento`: bau bau2 bauP cuori raffica hrr ciu zzz prrr miao mrr posa.
export const SOGLIA_RICHIAMO = 2.5                 // celle: oltre, il contadino chiama Watson
export const INTERAZIONI_CANE = ['festa', 'zampa', 'rotola', 'salta', 'riporta', 'starnuta', 'gira', 'sbadiglia']
export const CAREZZE_PER_SONNO = 6, FINESTRA_CAREZZE = 10

/** L'interazione di Watson all'arrivo: mai la stessa di `ultima`. */
export function scegliInterazioneCane(ultima, rnd = Math.random) {
  const m = INTERAZIONI_CANE.filter(i => i !== ultima)
  return m[Math.min(m.length - 1, Math.floor(rnd() * m.length))]
}

const APERTURA = dur => ({ stato: 'festa', dur, guarda: 'eroe', ev: [[0, 'bau'], [0.25, 'cuori']] })   // scodinzola e «Bau!»: la base, sempre in apertura
/** I passi di una festa di Watson (da 2 a ~4 secondi): la base scodinzolante e poi la sua interazione. */
export function sequenzaCane(id) {
  const g = 'eroe'
  switch (id) {
    case 'zampa': return [APERTURA(0.9), { stato: 'zampa', dur: 2.6, guarda: g, ev: [[0.7, 'bauP'], [0.9, 'cuori']] }]
    case 'rotola': return [APERTURA(0.9), { stato: 'rotola', dur: 3.1, guarda: g, ev: [[0.9, 'cuori'], [1.5, 'raffica'], [2.1, 'hrr']] }]
    case 'salta': return [APERTURA(0.8), { stato: 'salta', dur: 2.4, guarda: g, ev: [[0.2, 'bau2'], [1.5, 'cuori']] }]
    case 'riporta': return [APERTURA(0.8), { stato: 'riporta', dur: 3.0, guarda: g, ev: [[1.5, 'posa'], [1.7, 'bau'], [1.9, 'cuori']] }]
    case 'starnuta': return [APERTURA(0.8), { stato: 'starnuta', dur: 2.6, guarda: g, ev: [[0.9, 'ciu'], [1.9, 'bau']] }]
    case 'gira': return [APERTURA(0.8), { stato: 'gira', dur: 3.1, giri: 2, ev: [[2.5, 'bau']] }]
    case 'sbadiglia': return [APERTURA(0.8), { stato: 'mano', dur: 1.0, guarda: g, ev: [[0.5, 'cuori']] }, { stato: 'sbadiglia', dur: 2.0, guarda: g, ev: [[0.5, 'hrr']] }]
    default: return [{ ...APERTURA(3.2), ev: [[0, 'bau'], [0.25, 'cuori'], [1.7, 'bau'], [1.9, 'cuori']] }]
  }
}
/** Il richiamo: alza la testa e corre dall'eroe (poi si aggiunge la festa). */
export const sequenzaRichiamo = () => [{ stato: 'alza', dur: 0.4, guarda: 'eroe' }, { va: { r: [1.0, 1.9], corsa: true } }]
/** Dopo la carezza numero 6: si siede contento e si addormenta. */
export const sequenzaSonno = rnd => [{ stato: 'siede', dur: 1.2, guarda: 'eroe', ev: [[0, 'cuori']] },
  { stato: 'dorme', dur: durataDi('dorme', rnd), ev: [[0.4, 'zzz'], [4, 'zzz'], [8, 'zzz']] }]
/** Toccato mentre dorme: si sveglia con uno sbadiglio. */
export const sequenzaSveglia = () => [{ stato: 'sbadiglia', dur: 2.2, guarda: 'eroe', ev: [[0.4, 'hrr']] }]

/** Conta le carezze ravvicinate: dopo `CAREZZE_PER_SONNO` Watson si addormenta contento. Torna { n, ultimo, dorme }. */
export function carezzaCane(prec, ora) {
  const n = prec && ora - prec.ultimo <= FINESTRA_CAREZZE ? prec.n + 1 : 1
  return n >= CAREZZE_PER_SONNO ? { n: 0, ultimo: ora, dorme: true } : { n, ultimo: ora, dorme: false }
}

// Com'è ogni gatto quando ci premi: [si avvicina, resta qui a fare le fusa, si volta, fa una cosa buffa]. Sherlock composto, Irene giocosa, Pepe schivo.
export const INDOLE_GATTO = {
  bianconero: [0.60, 0.20, 0.12, 0.08],
  calico:     [0.55, 0.15, 0.10, 0.20],
  nero:       [0.40, 0.20, 0.30, 0.10],
}
const INDOLE_COMUNE = [0.55, 0.20, 0.15, 0.10]
/** La risposta di un gatto al tocco: 'avvicina' | 'fusaQui' | 'volta' | 'buffo'. `distanza` dall'eroe: già vicino, l'avvicinarsi si fa in una cella. */
export function scegliRispostaGatto(distanza, rnd = Math.random, variante = null) {
  const p = INDOLE_GATTO[variante] || INDOLE_COMUNE
  const r = rnd()
  if (r < p[0]) return 'avvicina'
  if (r < p[0] + p[1]) return 'fusaQui'
  if (r < p[0] + p[1] + p[2]) return 'volta'
  return 'buffo'
}
/** I passi della risposta del gatto. `vicino`: è già a un passo dall'eroe. Sherlock si siede composto a 1,5 celle, gli altri si strusciano; Irene ogni tanto si rotola. */
export function sequenzaGatto(risposta, variante, vicino, rnd = Math.random) {
  const g = 'eroe'
  if (risposta === 'avvicina') {
    const composto = variante === 'bianconero'
    const passi = vicino && !composto ? [] : [{ va: { r: composto ? [1.4, 1.7] : [0.8, 1.3] } }]
    if (composto) passi.push({ stato: 'siede', dur: 3.0, guarda: g, ev: [[0.4, 'prrr'], [0.9, 'cuori']] })
    else {
      passi.push({ stato: 'struscia', dur: 3.0, guarda: g, ev: [[0.2, 'prrr'], [0.7, 'cuori'], [1.8, 'cuori']] })
      if (variante === 'calico' && rnd() < 0.5) passi.push({ stato: 'rotola', dur: 2.2, guarda: g, ev: [[0.7, 'cuori']] })
    }
    return passi
  }
  if (risposta === 'fusaQui') return [{ stato: 'fusa', dur: 3.2, guarda: g, ev: [[0.3, 'prrr'], [1.0, 'cuori']] }]
  if (risposta === 'volta') return [{ stato: 'stiracchia', dur: 2.4, guarda: g, ev: [[1.0, 'mrr']] }, { stato: 'volta', dur: 1.6, guarda: 'via' }]
  return rnd() < 0.5 ? [{ stato: 'miao', dur: 2.2, guarda: g, ev: [[0.5, 'miao']] }] : [{ stato: 'rotola', dur: 2.6, guarda: g, ev: [[0.8, 'cuori']] }]
}
/** Il contadino chiama il gatto per nome? Solo se sta fermo e il gatto è oltre la soglia del richiamo (come per Watson); altrimenti il gatto risponde e basta. */
export const chiamaIlGatto = (distanza, eroeFermo) => !!eroeFermo && distanza > SOGLIA_RICHIAMO
/** Il gatto chiamato per nome: prima alza la testa e guarda il contadino (0,4–0,8 s, le orecchie verso di lui), poi risponde a modo suo con la
    stessa `risposta` della sua indole. Non è un obbligo: Pepe può voltarsi e non venire. Chi si avvicina cammina, non corre. */
export const sequenzaGattoChiamato = (risposta, variante, rnd = Math.random) =>
  [{ stato: 'sta', dur: 0.4 + rnd() * 0.4, guarda: 'eroe' }, ...sequenzaGatto(risposta, variante, false, rnd)]
/** Un gatto che dorme sul suo posto si sveglia stiracchiandosi e resta lì. */
export const sequenzaGattoSopra = () => [{ stato: 'stiracchia', dur: 2.4, guarda: 'eroe', ev: [[1.0, 'mrr']] }, { stato: 'dorme', dur: 7 }]

export const DIST_INCONTRO = 2.5
/**
 * Un gatto e Watson si trovano vicini (`dist` in celle): ogni tanto si salutano, quasi mai il gatto scappa. `prossimo`: il tempo
 * prima del quale non si riprova (per gatto). Torna { esito: null | 'struscia' | 'zampata' | 'lecca' | 'fuga', prossimo }.
 */
export function incontroGattoCane({ dist, ora, prossimo = 0 }, rnd = Math.random) {
  if (dist > DIST_INCONTRO || ora < prossimo) return { esito: null, prossimo }
  if (rnd() >= 0.35) return { esito: null, prossimo: ora + 5 }
  const r = rnd(), dopo = ora + 25 + rnd() * 15
  if (r < 0.1) return { esito: 'fuga', prossimo: dopo }
  return { esito: r < 0.4 ? 'struscia' : r < 0.7 ? 'zampata' : 'lecca', prossimo: dopo }
}
/** I passi dell'incontro: quelli del gatto (ognuno dice cosa fa il cane in `cane`) e quelli del cane che finisce. */
export function sequenzaIncontro(esito) {
  const a = { stato: 'incontra', sub: 'annusa', dur: 1.7, guarda: 'altro', cane: { sub: 'annusa', dur: 2.0 } }
  const va = { va: { r: [0.6, 1.0], verso: 'cane' } }
  if (esito === 'struscia') return [va, a, { stato: 'incontra', sub: 'struscia', dur: 2.4, guarda: 'altro', ev: [[0.3, 'prrr'], [0.7, 'cuori']], cane: { sub: 'scodinzola', dur: 2.7 } }]
  if (esito === 'zampata') return [va, a, { stato: 'incontra', sub: 'zampata', dur: 1.4, guarda: 'altro', ev: [[0.5, 'mrr']], cane: { sub: 'scodinzola', dur: 1.7 } }, { va: { r: [2.5, 4], verso: 'lontano' } }]
  return [va, a, { stato: 'incontra', sub: 'infastidito', dur: 1.6, guarda: 'altro', cane: { sub: 'lecca', dur: 1.9 } }, { stato: 'lava', dur: 3.5 }]
}

/** Una cella libera il cui centro sta fra `rMin` e `rMax` da `centro`, scelta a caso (se non c'è, `scegliMeta` cerca più in là). */
export function scegliMetaAttorno({ libera, centro, rMin, rMax, rnd = Math.random, evita = [] }) {
  const buone = [], R = Math.ceil(rMax) + 1, ci = Math.floor(centro[0]), cj = Math.floor(centro[1])
  for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) {
    const i = ci + a, j = cj + b, d = Math.hypot(i + 0.5 - centro[0], j + 0.5 - centro[1])
    if (d >= rMin && d <= rMax && libera(i, j) && !evita.some(([x, z, r]) => Math.hypot(i + 0.5 - x, j + 0.5 - z) < r)) buone.push([i, j])
  }
  if (buone.length) return buone[Math.min(buone.length - 1, Math.floor(rnd() * buone.length))]
  return scegliMeta({ libera, centro, rMin, rMax: rMax + 1, rnd, evita })
}

export function guastiDeiCompagni() {
  const g = []
  const liv = new Set()
  for (const [id, c] of Object.entries(COMPAGNI)) {
    if (!c.nome || !c.verso || !c.arrivo) g.push(`${id}: manca nome, verso o arrivo`)
    if (!['cane', 'gatto'].includes(c.tipo)) g.push(`${id}: tipo sconosciuto «${c.tipo}»`)
    if (c.tipo === 'gatto' && !VARIANTI_GATTO.includes(c.variante)) g.push(`${id}: variante «${c.variante}» sconosciuta`)
    if (c.tipo === 'cane' && c.variante !== 'bobtail') g.push(`${id}: l'unico cane è il bobtail`)
    if (!(c.liv >= 1)) g.push(`${id}: livello ${c.liv} (da 1 in su)`)
    if (liv.has(c.liv)) g.push(`${id}: due compagni arrivano al livello ${c.liv}`)
    liv.add(c.liv)
  }
  if (!['contadino', 'contadina'].includes(ASPETTO_ERO)) g.push(`ASPETTO_ERO «${ASPETTO_ERO}» sconosciuto`)
  return g
}
