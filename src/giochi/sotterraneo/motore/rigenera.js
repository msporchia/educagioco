// I dungeon che si rigenerano (docs/sotterraneo/dungeon-che-si-rigenerano.md): nel Sotterraneo 3D ogni dungeon ha il livello della sua
// zona, un seme fisso finché non lo si ripulisce e, ripulito, un'altra forma e altri abitanti. Funzioni pure: girano in Node, e
// Gioco.vue le chiama scendendo, riprendendo e chiudendo una discesa. Il Sotterraneo di sempre non le chiama.
import { CAMPAGNA, INDICE_ABISSO, L_ABISSO, guastiDegliAbitanti } from '../dati/campagna.js'
import { MOSTRI } from '../dati/mostri.js'
import { ABITANTI_DI_SOPRA } from '../dati/mondo-aperto-mostri.js'
import { VOLTI, LARGA, PIANI_DELLA_ZONA, PIANI_DELLA_GROTTA, DIF_DELLA_ZONA, forzaDellaZona, spintaDellaZona, zonaDi } from '../dati/zone.js'
import { ZONE_DEL_PERCORSO, DUNGEON_NUOVI, PIANI_DEI_NUOVI, STORIA_DALLA_ZONA, PIU_FORTE, livelloDelDungeon, zonaDelDungeon }
  from '../dati/dungeon-del-mondo.js'

const oggetto = v => !!v && typeof v === 'object' && !Array.isArray(v)
export const indiceDellaChiave = chiave => CAMPAGNA.findIndex(t => t.chiave === chiave)
// i tredici dungeon a forma (l'abisso no: si apre a storia finita e scende senza fine, come oggi)
export const CHIAVI_DEI_DUNGEON = [...CAMPAGNA.map(t => t.chiave), ...Object.keys(DUNGEON_NUOVI)]
const baseDi = chiave => { const i = indiceDellaChiave(chiave); return i >= 0 ? CAMPAGNA[i] : DUNGEON_NUOVI[chiave] || null }

// un numero da una stringa, sempre lo stesso (FNV-1a con un rimescolo in fondo)
function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39)
  return (h ^ (h >>> 15)) >>> 0
}

/* ═══════════ il seme e quante volte è stato rifatto ═══════════ */
// Il seme di una discesa nel mondo: lo stesso finché non la si ripulisce, poi un altro. Da 1 a 99 991, come i semi a caso della Corsa
export const semeDelDungeon = (eroe, chiave, rifatti = 0, terra = 1) =>
  1 + (hash(`${eroe || ''}|${chiave}|${Math.max(0, Math.floor(rifatti) || 0)}|${Math.max(1, Math.floor(terra) || 1)}`) % 99991)

// `mondo.dungeon[chiave] = { rifatti }` dell'avventura (il mondo della terra di adesso): quante volte è stato ripulito. Manca (i
// salvataggi di prima) o storto vuol dire 0
export function rifattiDi(mondo, chiave) {
  const d = oggetto(mondo) && oggetto(mondo.dungeon) && mondo.dungeon[chiave]
  const n = oggetto(d) ? Math.floor(Number(d.rifatti)) : 0
  return Number.isFinite(n) && n > 0 ? n : 0
}
// il mondo con il dungeon `chiave` ripulito una volta in più (un oggetto nuovo: quello salvato non si tocca)
export function conRipulito(mondo, chiave) {
  const m = oggetto(mondo) ? mondo : {}
  const d = oggetto(m.dungeon) ? m.dungeon : {}
  return { ...m, dungeon: { ...d, [chiave]: { ...(oggetto(d[chiave]) ? d[chiave] : {}), rifatti: rifattiDi(m, chiave) + 1 } } }
}

// Ripulito vuol dire: battuto il mostro grosso e usciti dalla scala dell'ultimo piano (la discesa è `vinta`). Salire dal portale non
// chiude la discesa (non arriva qui); lasciar perdere, svenire, uscire con la ✕ non la vincono. `grossoBattuto`, se chi chiama lo
// sa, deve essere vero: la chiave dell'ultima scala ce l'ha il grosso, quindi una discesa vinta l'ha già battuto
export const ripulito = esito => !!esito && esito.vinta === true && esito.grossoBattuto !== false

/* ═══════════ il mazzo della zona ═══════════ */
// Le specie che stanno nella zona del dungeon: gli abitanti dei suoi dungeon (la prima forma) e quelli di sopra dei suoi luoghi,
// e a parte i caporali. Mai un capo
const mazzi = new Map()
export function mazzoDellaZona(zona) {
  if (mazzi.has(zona)) return mazzi.get(zona)
  const z = ZONE_DEL_PERCORSO.find(x => x.zona === zona)
  const mostri = new Set(), caporali = new Set()
  for (const k of z ? z.dungeon : []) { const b = baseDi(k); if (b) { b.mostri.forEach(m => mostri.add(m)); caporali.add(b.caporale) } }
  for (const l of z ? z.luoghi : []) { const a = ABITANTI_DI_SOPRA[l]; if (a) { a.mostri.forEach(m => mostri.add(m)); caporali.add(a.caporale) } }
  const via = k => !MOSTRI[k] || MOSTRI[k].capo
  const m = { mostri: [...mostri].filter(k => !via(k)).sort(), caporali: [...caporali].filter(k => !via(k)).sort() }
  mazzi.set(zona, m)
  return m
}

// le terne che vanno bene per il dungeon: tre del mazzo, almeno uno dei suoi abitanti di sempre (il tema resta), che costano uguale
// (guastiDegliAbitanti), con almeno un caporale che non sta per strada
const terne = new Map()
function terneDi(chiave) {
  if (terne.has(chiave)) return terne.get(chiave)
  const b = baseDi(chiave), m = mazzoDellaZona(zonaDelDungeon(chiave))
  const l = [], M = m.mostri
  for (let i = 0; i < M.length; i++) for (let j = i + 1; j < M.length; j++) for (let k = j + 1; k < M.length; k++) {
    const t = [M[i], M[j], M[k]]
    if (!t.some(x => b.mostri.includes(x))) continue
    if (!m.caporali.some(c => !t.includes(c))) continue
    if (guastiDegliAbitanti(chiave, t, m.caporali.find(c => !t.includes(c))).length) continue
    l.push(t)
  }
  terne.set(chiave, l)
  return l
}

// Gli abitanti della volta `rifatti`: la prima (0) quelli di sempre, poi una terna del mazzo a giro, in un ordine che dipende
// dall'eroe, dal dungeon e dalla terra (mai quella di sempre, mai due volte di fila la stessa); il caporale a giro fra quelli della
// zona, cominciando dal suo, saltando chi sta già per strada
export function abitantiDellaVolta(chiave, rifatti = 0, eroe = '', terra = 1) {
  const b = baseDi(chiave)
  if (!b) return null
  const r = Math.max(0, Math.floor(rifatti) || 0)
  if (!r) return { mostri: [...b.mostri], caporale: b.caporale }
  const stesse = t => t.length === b.mostri.length && t.every(x => b.mostri.includes(x))
  const scelte = terneDi(chiave).filter(t => !stesse(t))
  if (!scelte.length) return { mostri: [...b.mostri], caporale: b.caporale }
  const ordine = scelte.map((t, i) => ({ t, h: hash(`${eroe}|${chiave}|${terra}|${i}`) })).sort((x, y) => x.h - y.h).map(x => x.t)
  const mostri = [...ordine[(r - 1) % ordine.length]]
  const caporali = [b.caporale, ...mazzoDellaZona(zonaDelDungeon(chiave)).caporali.filter(c => c !== b.caporale)].filter(c => !mostri.includes(c))
  return { mostri, caporale: caporali[r % caporali.length] }
}

// il volto della volta `rifatti`: il nome, la dritta e l'annuncio (VOLTI in dati/zone.js); nelle terre dopo ruotato di uno a terra
export function voltoDelDungeon(chiave, rifatti = 0, terra = 1) {
  const v = VOLTI[chiave]
  if (!v || !v.length) return null
  const n = Math.max(0, Math.floor(rifatti) || 0) + Math.max(1, Math.floor(terra) || 1) - 1
  return v[n % v.length]
}

/* ═══════════ i numeri dal livello ═══════════ */
// La forza, la spinta e le domande al livello L: sotto il 12 in linea retta fra le discese della storia ai loro livelli (CAMPAGNA:
// la cripta all'1, la miniera al 10), dal 12 la curva delle zone (dati/zone.js, con la forma della zona per i sette). Più PIU_FORTE
const PUNTI = CAMPAGNA.map(t => ({ livello: t.livello, forza: t.forza || 1, spinta: t.spinta || 0, dif: t.dif }))
export function numeriDelLivello(L, chiave = null) {
  const l = Math.max(1, L)
  let forza, spinta, dif
  if (l >= 12) {
    forza = forzaDellaZona(l, chiave); spinta = spintaDellaZona(l); dif = [...DIF_DELLA_ZONA]
  } else {
    const fine = { livello: 12, forza: forzaDellaZona(12, null), spinta: spintaDellaZona(12), dif: DIF_DELLA_ZONA }
    const p = [...PUNTI, fine]
    let i = 0
    while (i < p.length - 2 && p[i + 1].livello <= l) i++
    const a = p[i], b = p[i + 1], t = Math.max(0, Math.min(1, (l - a.livello) / (b.livello - a.livello)))
    const tra = (x, y, q = 100) => Math.round((x + (y - x) * t) * q) / q
    forza = tra(a.forza, b.forza); spinta = tra(a.spinta, b.spinta, 10); dif = [tra(a.dif[0], b.dif[0]), tra(a.dif[1], b.dif[1])]
  }
  return { forza: Math.round(forza * PIU_FORTE.forza * 100) / 100, spinta: Math.round((spinta + PIU_FORTE.spinta) * 10) / 10, dif }
}

/* ═══════════ la tappa ═══════════ */
// La tappa del dungeon `chiave` nel mondo: `storia` (solo per i sette, la prima volta) la discesa della storia com'è oggi (o, con
// STORIA_DALLA_ZONA, al livello del dungeon); se no la ripetuta: la stessa discesa (paesaggio, forma dei piani, mostro grosso) al
// livello `livello` (di difetto quello del dungeon nella terra), con la potenza come una zona (non tocca storia né stelle), i piani
// delle zone (tre per i nuovi), gli abitanti e il volto della volta. Sempre col seme (`seme`) e con `delMondo` = { chiave, rifatti,
// terra, storia? }, che la sosta scrive per rifarla uguale. null se la chiave non è un dungeon
export function tappaDelMondo(chiave, { eroe = '', rifatti = 0, terra = 1, livello = null, storia = false } = {}) {
  const i = indiceDellaChiave(chiave)
  const b = baseDi(chiave)
  if (!b) return null
  const r = Math.max(0, Math.floor(rifatti) || 0), te = Math.max(1, Math.floor(terra) || 1)
  const seme = semeDelDungeon(eroe, chiave, r, te)
  if (storia && i >= 0) {
    const t = STORIA_DALLA_ZONA
      ? { ...b, livello: livelloDelDungeon(chiave, te), ...numeriDelLivello(livelloDelDungeon(chiave, te)) }
      : b
    return { ...t, seme, delMondo: { chiave, rifatti: r, terra: te, storia: true } }
  }
  const L = Math.max(1, Math.round(Number.isFinite(livello) && livello > 0 ? livello : livelloDelDungeon(chiave, te)))
  const v = voltoDelDungeon(chiave, r, te) || { nome: b.nome, dritta: b.dritta, annuncio: '' }
  const ab = abitantiDellaVolta(chiave, r, eroe, te)
  const piani = i < 0 ? PIANI_DEI_NUOVI : b.piani >= PIANI_DELLA_ZONA ? PIANI_DELLA_GROTTA : PIANI_DELLA_ZONA
  return {
    ...b,
    potenza: L, fascia: [L, L + LARGA - 1], livello: L,
    nome: v.nome, dritta: v.dritta, annuncio: v.annuncio,
    piani, ...numeriDelLivello(L, i >= 0 ? chiave : null),
    mostri: ab.mostri, caporale: ab.caporale,
    seme, delMondo: { chiave, rifatti: r, terra: te },
  }
}

// Il dungeon `chiave` (o l'indice di uno dei sette) per l'avventura `a`: la prima volta delle sette (non ancora finita: l'indice è la
// tappa della storia o dopo) è la storia, le altre e i sei nuovi la ripetuta; `rifatti` da `mondo` (quello della terra di adesso).
// La storia sta nella prima terra: nelle dopo le sette sono ripetute dal primo giro (docs/sotterraneo/terre-successive.md)
export function dungeonDellAvventura(a, chiaveOIndice, { eroe = '', terra = 1, mondo = a && a.mondo } = {}) {
  const chiave = typeof chiaveOIndice === 'number' ? (CAMPAGNA[chiaveOIndice] || {}).chiave : chiaveOIndice
  if (!chiave || !baseDi(chiave)) return null
  const indice = indiceDellaChiave(chiave)
  const storia = indice >= 0 && !(terra > 1) && !(a && Number.isFinite(a.tappa) && indice < a.tappa)
  const rifatti = rifattiDi(mondo, chiave)
  const tappa = tappaDelMondo(chiave, { eroe, rifatti, terra, storia })
  return { chiave, indice: indice >= 0 ? indice : null, storia, rifatti, livello: tappa.livello, zona: zonaDelDungeon(chiave), tappa }
}

// La discesa di una sosta: quella del mondo se la sosta lo dice (`dungeon`, scritto da motore/sosta.js), se no come prima (l'abisso,
// la zona con la sua potenza, la discesa della storia)
export function tappaDellaSosta(dato) {
  if (!dato) return null
  const d = dato.dungeon
  if (oggetto(d) && typeof d.chiave === 'string' && baseDi(d.chiave)) {
    const t = tappaDelMondo(d.chiave, { eroe: dato.eroe, rifatti: d.rifatti, terra: d.terra, livello: dato.potenza, storia: !!d.storia })
    return t
  }
  if (dato.tappa === INDICE_ABISSO) return L_ABISSO
  return Number.isInteger(dato.tappa) ? zonaDi(dato.tappa, dato.potenza) : null
}

// Cosa fa una discesa del mondo finita: `ripulito` (e allora `mondo`, il mondo da scrivere con un rifatti in più) e `storia` (le
// stelle e il capitolo: vinta e senza potenza, cioè la prima volta delle sette). Fuori dal mondo (nessun `delMondo`) mondo è null.
// `mondo` è quello della terra della discesa (`tappa.delMondo.terra`), che chi chiama sceglie
export function dopoLaDiscesa(mondo, tappa, esito) {
  const r = !!(tappa && tappa.delMondo) && ripulito(esito)
  return { ripulito: r, mondo: r ? conRipulito(mondo, tappa.delMondo.chiave) : null, storia: !!(esito && esito.vinta && tappa && !tappa.potenza) }
}

export function guastiDeiDungeon() {
  const g = []
  for (const k of CHIAVI_DEI_DUNGEON) {
    if (!zonaDelDungeon(k)) g.push(`${k}: non sta in nessuna zona`)
    if (!(VOLTI[k] || []).length) g.push(`${k}: senza volti`)
    const b = baseDi(k)
    for (const x of [...b.mostri, b.caporale]) if (!new Set([...mazzoDellaZona(zonaDelDungeon(k)).mostri, ...mazzoDellaZona(zonaDelDungeon(k)).caporali]).has(x))
      g.push(`${k}: "${x}" non sta nella sua zona`)
  }
  for (const [k, t] of Object.entries(DUNGEON_NUOVI)) {
    if (indiceDellaChiave(k) >= 0) g.push(`${k}: è anche una discesa della storia`)
    if (t.chiave !== k) g.push(`${k}: la chiave dentro è "${t.chiave}"`)
    if (!t.nome || !t.icona || !t.dove || !t.dritta || !t.paesaggio) g.push(`${k}: senza nome, icona, dove, dritta o paesaggio`)
    g.push(...guastiDegliAbitanti(k, t.mostri, t.caporale))
    if (zonaDelDungeon(k) !== t.zona) g.push(`${k}: la zona dice ${t.zona}, le zone ${zonaDelDungeon(k)}`)
  }
  const nomi = new Set()
  for (const k of Object.keys(DUNGEON_NUOVI)) for (const v of VOLTI[k] || []) {
    if (!v.nome || !v.dritta || !v.annuncio) g.push(`${k}: un volto senza nome, dritta o annuncio`)
    if (nomi.has(v.nome)) g.push(`due volti si chiamano «${v.nome}»`)
    nomi.add(v.nome)
  }
  return g
}
