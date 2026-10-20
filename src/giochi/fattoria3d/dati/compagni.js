/* I compagni della fattoria 3D: il cane di casa e i gatti che girano per il terreno. Sono vita sulla scena, non regole: non
   costano esperienza, non producono, non si salvano (ripartono vicino alla casa). Qui stanno i dati, il livello a cui arrivano
   e le scelte pure (dove andare, cosa fare) che il disegno (`scena3d/compagni.js`) usa col caso da fuori.
   Vedi docs/fattoria3d/compagni.md. */

// Com'è fatto il contadino: 'contadino' (cappello di paglia) o 'contadina' (trecce, nastro rosa). Niente schermata di scelta.
export const ASPETTO_ERO = 'contadino'

// `liv`: il livello a cui arriva (come `liv` sui pezzi: `roba(liv)` lo raccoglie). Il bobtail e il gatto bianco e nero hanno il nome vero di casa (Watson, Sherlock, Irene) e arrivano per primi (livelli 1-3).
export const COMPAGNI = {
  watson: { nome: 'Watson', tipo: 'cane',  variante: 'bobtail',   liv: 1,  verso: 'Bau!', arrivo: 'Watson è arrivato!' },
  sherlock: { nome: 'Sherlock', tipo: 'gatto', variante: 'bianconero', liv: 2,  verso: 'Prrr…', arrivo: 'Sherlock, il gatto, è arrivato!' },
  irene:   { nome: 'Irene',   tipo: 'gatto', variante: 'calico',     liv: 3,  verso: 'Prrr…', arrivo: 'Irene, la gattina, è arrivata!' },
  pepe:    { nome: 'Pepe',    tipo: 'gatto', variante: 'nero',       liv: 13, verso: 'Prrr…', arrivo: 'Pepe, il gatto nero, è arrivato!' },
}
export const VARIANTI_GATTO = ['bianconero', 'calico', 'nero']

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
// stati del cane: 'sta' 'siede' 'annusa' 'dorme' 'festa' 'segue' 'vaga'; del gatto: 'sta' 'siede' 'lava' 'dorme' 'stiracchia' 'fusa' 'vaga' 'fugge'
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

/** Cosa farà il gatto: `s` = { dormePosto (c'è una panchina/bancarella), vicinoAlCane }. */
export function decidiGatto(s, rnd = Math.random) {
  if (s.vicinoAlCane) return { stato: 'fugge', vai: 'lontano' }
  const r = rnd()
  if (r < 0.25) return { stato: 'vaga', vai: 'attorno' }
  if (r < 0.45) return { stato: 'siede' }
  if (r < 0.62) return { stato: 'lava' }
  if (r < 0.72) return { stato: 'stiracchia' }
  if (r < 0.85) return s.dormePosto ? { stato: 'dorme', vai: 'posto' } : { stato: 'dorme' }
  return { stato: 'sta' }
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
