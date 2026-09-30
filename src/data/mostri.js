// Chi attacca il castello: chi sono, non come sono disegnati (il disegno
// sta in grafica/castello.js e grafica/mostri/). Immune, non resistente: le
// quattro famiglie (vola, corazzato, ossa, rovo/blatta) e perché, in
// docs/castello/mostri.md.
import { TORRI } from './ops.js'

export const MOSTRI = {
  slime:      { nome: 'Slime',      immune: [], abilita: 'dividi' },
  goblin:     { nome: 'Goblin',     immune: [] },
  pipistrello:{ nome: 'Pipistrello', vola: true, immune: ['bombe', 'ghiaccio'] },
  fantasma:   { nome: 'Fantasma',   vola: true, immune: ['bombe', 'arciere'] },
  ragno:      { nome: 'Ragno',      immune: [] },
  orco:       { nome: 'Orco',       immune: [] },
  scheletro:  { nome: 'Scheletro',  immune: ['magica', 'ghiaccio'], abilita: 'risorge' },
  golem:      { nome: 'Golem',      immune: ['arciere', 'magica'] },
  arpia:      { nome: 'Arpia',      vola: true, immune: ['bombe', 'ghiaccio'] },
  drago:      { nome: 'Drago',      vola: true, immune: ['bombe', 'magica'] },

  lupo:        { nome: 'Lupo',        immune: [] },
  corvo:       { nome: 'Corvo',       vola: true, immune: ['bombe', 'ghiaccio'] },
  rovo:        { nome: 'Rovo',        immune: ['arciere', 'bombe'] },
  verme:       { nome: 'Verme',       immune: [], abilita: 'dividi' },
  blatta:      { nome: 'Blatta',      immune: ['bombe', 'magica'] },
  troll:       { nome: 'Troll',       immune: ['arciere', 'magica'], abilita: 'risorge' },
  corazziere:  { nome: 'Corazziere',  immune: ['arciere', 'magica'] },
  balestriere: { nome: 'Balestriere', immune: [] },
}

export const ELENCO = Object.keys(MOSTRI)

export const IMMUNITA_MAX = 2

// L'unico punto in cui i due mondi si toccano: «bombe» diventa la torre che
// in questo momento si compra con la divisione (l'immunità si scrive con
// l'aspetto della torre, non con l'operazione, che può cambiare).
const torreDi = aspetto => Object.keys(TORRI).find(k => TORRI[k].aspetto === aspetto) || null

export const immuniDi = id => (MOSTRI[id]?.immune || []).map(torreDi).filter(Boolean)
export const feritoDa = (id, k) => !!TORRI[k]?.danno && !immuniDi(id).includes(k)
export const gelabile = id => !(MOSTRI[id]?.immune || []).includes('ghiaccio')
export const firmaImmunita = id => [...(MOSTRI[id]?.immune || [])].sort().join('+') || '—'
export const comune = id => !(MOSTRI[id]?.immune || []).length

// Le regole di una fila di mostri (vedi docs/castello/mostri.md), tutte
// tranne la seconda esenti nel Bosco (`IMPARA_LE_TORRI`): lì si impara cosa
// fa una torre. Una libera si riconosce dai capi a ritmo fisso (`capi`).
export const IMPARA_LE_TORRI = ['bosco']
const esente = t => IMPARA_LE_TORRI.includes(t.campagna) && !t.capi

export function guastiDelleImmunita(tappa) {
  const { mostri = [], torri = [] } = tappa
  const g = []
  for (const m of mostri) if (!MOSTRI[m]) g.push(`mostro sconosciuto: ${m}`)
  if (g.length) return g
  const feriscono = torri.filter(k => TORRI[k]?.danno)
  for (const m of mostri)
    if (!feriscono.some(k => feritoDa(m, k)))
      g.push(`${m} è immune a tutte le torri che la tappa dà (${torri.join(' ')}): quell'ondata non si ferma`)
  if (feriscono.length > 1 && !esente(tappa))
    for (const k of feriscono)
      if (mostri.every(m => feritoDa(m, k)))
        g.push(`nessun mostro è immune a «${TORRI[k].nome}»: da sola vince la tappa`)
  if (torri.includes('add') && mostri.length && !feritoDa(mostri[0], 'add'))
    g.push(`la prima ondata (${mostri[0]}) è immune all'arciere, che è la prima torre che si compra`)
  if (mostri.length > 1)
    for (let i = 0; i < mostri.length; i++) {
      const a = mostri[i], b = mostri[(i + 1) % mostri.length]
      if (comune(a) && comune(b)) continue // due comuni di fila vanno bene
      if (firmaImmunita(a) === firmaImmunita(b))
        g.push(`${a} e ${b} arrivano di fila con le stesse immunità (${firmaImmunita(a)})`)
    }
  return g
}

// Le due abilità: si divide (in `quanti` pezzi, l'energia non cresce: il
// mostro intero ne dava due, i pezzi uno a testa) e risorge (resta a terra
// `dopo` secondi, non camminabile né colpibile, paga l'energia una volta).
// Arrivano in meno (`folla`): tre-quattro bersagli per mostro sono troppe
// frecce al secondo. Vedi docs/castello/mostri.md.
export const ABILITA = {
  dividi:  { emoji: '✂️', nome: 'si divide', che: 'quando cade, si divide in due più piccoli',
             quanti: 2, vita: 1 / 3, taglia: 0.72, folla: 0.4,
             due: { emoji: '✂️✂️', nome: 'si divide due volte',
                    che: 'quando cade si divide in due, e i pezzi si dividono ancora' } },
  risorge: { emoji: '💫', nome: 'si rialza', che: 'la prima volta che cade, si rialza',
             vita: 0.5, dopo: 1.4, folla: 0.7 },
}
export const abilitaDi = id => (MOSTRI[id]?.abilita ? ABILITA[MOSTRI[id].abilita] : null)

// Quante volte si divide chi si divide: due nelle tappe con `divisioni: 2` e
// nelle libere dall'ondata `libere`, mai più di `tetto`. Vedi docs/castello/mostri.md.
export const DIVISIONI = { tetto: 2, libere: 20 }
export function divisioniDi(tappa, o) {
  if (!tappa.abilita) return 0
  if (tappa.capi) return o >= DIVISIONI.libere ? DIVISIONI.tetto : 1
  return Math.min(DIVISIONI.tetto, tappa.divisioni || 1)
}
// I bersagli di un mostro che si divide `d` volte (1 + 2 + 4).
export const bersagliDi = d => {
  let n = 0
  for (let g = 0; g <= d; g++) n += ABILITA.dividi.quanti ** g
  return n
}
// Il segno a schermo: chi si divide due volte ha il suo.
export const segnoDi = (abilita, divisioni = 1) =>
  (abilita === 'dividi' && divisioni > 1 ? ABILITA.dividi.due : ABILITA[abilita])

// Quanti ne arrivano, per chi fa qualcosa: chi si divide due volte a pari
// bersagli con chi si divide una volta (mostri.md).
export function follaDi(abilita, divisioni = 1) {
  if (!abilita) return 1
  if (abilita !== 'dividi') return ABILITA[abilita].folla
  return ABILITA.dividi.folla * bersagliDi(1) / bersagliDi(Math.max(1, divisioni))
}

// Quanta vita porta davvero un mostro, contando quello che fa quando cade.
export function vitaEffettiva(id, divisioni = 1) {
  const a = MOSTRI[id]?.abilita
  if (a === 'dividi') {
    let v = 1
    for (let g = 1; g <= Math.max(1, divisioni); g++)
      v += (ABILITA.dividi.quanti * ABILITA.dividi.vita) ** g
    return v
  }
  if (a === 'risorge') return 1 + ABILITA.risorge.vita
  return 1
}

// Il capo: un mostro solo, con la vita dell'ondata e un decimo (l'area non
// conta contro un bersaglio solo), metà velocità, taglia 2,5. Toglie quattro
// cuori su cinque (misurato: con tre l'ultima ondata non chiedeva niente a
// chi teneva un quarto di energia in tasca). Vedi docs/castello/mostri.md.
export const CAPO = { vita: 1.1, passo: 0.5, taglia: 2.5, cuori: 4, ogni: 10 }

// Un tipo solo per ondata: la scheda parla di *questa* ondata, non di una media.
export const mostroDiOnda = (elenco, onda) => elenco[(Math.max(1, onda) - 1) % elenco.length]

export const mostroLibero = onda => {
  const quanti = Math.min(ELENCO.length, 2 + Math.floor(onda / 3))
  return ELENCO[(Math.max(1, onda) - 1) % quanti]
}

// Le ondate miste: due mostri mescolati, nessuna torre li ferisce tutti e
// due, e almeno due torri toccano l'uno o l'altro (`tieneMista`). Le coppie
// si cercano fra i mostri che la tappa manda già (`coppieDi`), mai scritte a
// mano. Vedi docs/castello/mostri.md.
export const MISTA = { da: 10, ogni: 5, resto: 3, campagne: ['mura', 'palude'] }

function tieneMista(a, b, sparano) {
  const ferisce = k => feritoDa(a, k) || feritoDa(b, k)
  return a !== b &&
    sparano.every(k => !(feritoDa(a, k) && feritoDa(b, k))) &&
    sparano.filter(ferisce).length >= 2 &&
    sparano.some(k => feritoDa(a, k)) && sparano.some(k => feritoDa(b, k))
}

export function coppieDi({ mostri = [], torri = [] }) {
  const sparano = torri.filter(k => TORRI[k]?.danno)
  const ms = [...new Set(mostri)].filter(m => MOSTRI[m])
  const out = []
  for (let i = 0; i < ms.length; i++)
    for (let j = i + 1; j < ms.length; j++)
      if (tieneMista(ms[i], ms[j], sparano)) out.push([ms[i], ms[j]])
  return out
}

export function ondataMista(tappa, o) {
  if (tappa.capi) return o >= MISTA.da && o % MISTA.ogni === MISTA.resto && o % tappa.capi !== 0
  if (!tappa.miste || !Number.isFinite(tappa.ondate)) return false
  return o === (tappa.mista ?? (tappa.capo ? tappa.ondate - 1 : tappa.ondate))
}

// I due mostri dell'ondata `o`, o null: il primo è quello che la fila
// avrebbe mandato comunque (la mista allarga l'ondata, non la cambia).
export function coppiaDellOnda(tappa, o) {
  if (!ondataMista(tappa, o)) return null
  const coppie = tappa.coppie || coppieDi(tappa)
  if (!coppie.length) return null
  const primo = mostroDiOnda(tappa.mostri || [], o)
  const c = coppie.find(x => x.includes(primo)) ||
            coppie[Math.floor(o / MISTA.ogni) % coppie.length]
  return c[1] === primo ? [c[1], c[0]] : c
}

/* Le regole delle miste di una tappa, come `guastiDelleImmunita`:
   l'elenco dei guasti, vuoto se è tutto a posto. `fino` è fin dove
   guardare in una partita infinita (le ondate tarate). */
export function guastiDelleMiste(tappa, fino = tappa.ondate) {
  const g = []
  const sparano = (tappa.torri || []).filter(k => TORRI[k]?.danno)
  const n = Number.isFinite(fino) ? fino : 20
  let quante = 0
  for (let o = 1; o <= n; o++) {
    if (!ondataMista(tappa, o)) continue
    quante++
    const c = coppiaDellOnda(tappa, o)
    if (!c) { g.push(`l'ondata ${o} dovrebbe essere mista, e fra i mostri della tappa non c'è una coppia`); continue }
    if (!tieneMista(c[0], c[1], sparano))
      g.push(`l'ondata ${o} mescola ${c[0]} e ${c[1]}, che non fanno una mista con ${sparano.join(' ')}`)
    if ((tappa.capi && o % tappa.capi === 0) || (tappa.capo && o === tappa.ondate))
      g.push(`l'ondata ${o} è del capo, e non può essere anche mista`)
  }
  if (tappa.miste && !quante) g.push('la tappa dichiara le miste, e nessuna ondata lo è')
  return g
}

/* Le torri che non toccano **nessuno** di un'ondata: per un'ondata di un
   tipo solo sono le sue immunità, per una mista quelle che hanno tutti e
   due — che per la regola della coppia non sono mai una torre che fa
   danno (al massimo il ghiaccio). È la domanda che fa la carta di una
   torre («questa, per chi arriva, serve?»), e chi la fa riceve
   un'ondata, non un mostro. */
export const immuniDellOnda = b =>
  (b ? (b.con ? b.immune.filter(k => b.con.immune.includes(k)) : b.immune) : [])
