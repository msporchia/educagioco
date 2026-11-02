/* Il guardaroba del contadino della fattoria 3D: cosa si può indossare, a che livello arriva ogni pezzo speciale, e le scelte pure
   (l'abito di serie, rimettere in forma un abito rotto, il nome «il contadino / la contadina»). Niente three, niente profilo: il
   disegno è in `scena3d/modelli-compagni.js` (`creaContadino`), la vista in `viste/Guardaroba.vue`.
   Un ABITO è un oggetto semplice { persona, cappello, maglia, pantalone, stivali, collo, capelli, pelle } di chiavi stringa.
   La PERSONA (contadino o contadina) non si salva qui: viene dal profilo del bambino (`aspettoDi()`, come nella fattoria di
   sempre) ed è un parametro di ogni funzione. In `profile.campagne.fattoria3d.cfg.abito` stanno i soli capi.
   Vedi docs/fattoria3d/guardaroba.md. */
import { sullaScalaDellaDueD } from './parita2d.js'
import { ASPETTO_ERO } from './compagni.js'

export const PERSONE_ABITO = ['contadino', 'contadina']
export const CATEGORIE = ['cappello', 'maglia', 'pantalone', 'stivali', 'collo', 'capelli', 'pelle']

/** Le etichette del foglio; il pantalone cambia nome con la persona (salopette / gonna). */
export const ETICHETTE = {
  cappello: { emoji: '👒', nome: 'Cappello' }, maglia: { emoji: '👕', nome: 'Maglia' }, pantalone: { emoji: '👖', nome: 'Salopette', nomeLei: 'Gonna' },
  stivali: { emoji: '🥾', nome: 'Stivali' }, collo: { emoji: '🧣', nome: 'Collo' }, capelli: { emoji: '✂️', nome: 'Capelli' }, pelle: { emoji: '🖐️', nome: 'Pelle' },
}

// `per`: solo di una persona (senza = di tutte e due). `liv`: il livello a cui arriva (senza = subito, gratis). `prezzo`: 🪙 per averlo, una volta sola
// (senza = gratis). `stagione`: si compra solo in quella festa (comprato resta). `c`: il colore, `forma`/`motivo`: il pezzo.
const CAT = {
  cappello: [
    { id: 'paglia', nome: 'Paglia', forma: 'paglia', c: 0xe9c96e },
    { id: 'berretto', nome: 'Berretto', emoji: '🧢', forma: 'berretto', c: 0x3d68b8 },
    { id: 'tesa', nome: 'Tesa larga', emoji: '🤠', forma: 'tesa', c: 0xb88a52 },
    { id: 'fascia', nome: 'Fascia e fiore', emoji: '🌸', forma: 'fascia', c: 0xe86f9a, per: 'contadina' },
    { id: 'cowboy', nome: 'Cowboy', emoji: '🤠', forma: 'cowboy', c: 0x7a4a26, liv: sullaScalaDellaDueD(6) },
    { id: 'bandana', nome: 'Bandana', emoji: '🏴‍☠️', forma: 'bandana', c: 0xd2392e, prezzo: 8 },
    { id: 'cilindro', nome: 'Cilindro', emoji: '🎩', forma: 'cilindro', c: 0x26262e, prezzo: 18 },
    { id: 'corona', nome: 'Corona', emoji: '👑', forma: 'corona', c: 0xe0b030, liv: sullaScalaDellaDueD(14) },
    { id: 'babbo', nome: 'Berretto di Natale', emoji: '🎅', forma: 'babbo', c: 0xc8281e, prezzo: 12, stagione: 'natale' },
    { id: 'strega', nome: 'Cappello da strega', emoji: '🧙', forma: 'strega', c: 0x3a2a5a, prezzo: 12, stagione: 'halloween' },
    { id: 'niente', nome: 'Nessuno', emoji: '🚫', forma: 'niente', c: 0 },
  ],
  maglia: [
    { id: 'quadri', nome: 'A quadri', motivo: 'quadri', c: 0xd9503f, per: 'contadino' },
    { id: 'blu', nome: 'Blu', motivo: 'liscia', c: 0x3f78c8, per: 'contadino' },
    { id: 'maglione', nome: 'Maglione', emoji: '🧶', motivo: 'maglione', c: 0x5f9a56, per: 'contadino' },
    { id: 'gilet', nome: 'Gilet da festa', emoji: '🎩', motivo: 'festa', c: 0x8a2f4a, per: 'contadino', liv: sullaScalaDellaDueD(10) },
    { id: 'tuta', nome: 'Tuta da lavoro', emoji: '🧑‍🔧', motivo: 'liscia', c: 0xe0802a, per: 'contadino', prezzo: 10 },
    { id: 'camicetta', nome: 'Camicetta', motivo: 'liscia', c: 0xf3e3c0, per: 'contadina' },
    { id: 'pois', nome: 'A pois', motivo: 'pois', c: 0xf0b8c8, per: 'contadina' },
    { id: 'grembiule', nome: 'Grembiule', motivo: 'grembiule', c: 0x9ad0c8, per: 'contadina' },
    { id: 'festa', nome: 'Abito da festa', emoji: '👗', motivo: 'festa', c: 0x8a4aa8, per: 'contadina', liv: sullaScalaDellaDueD(10) },
    { id: 'fiori', nome: 'Abito a fiori', emoji: '🌼', motivo: 'pois', c: 0xf6d36a, per: 'contadina', prezzo: 12 },
    { id: 'hawaiana', nome: 'Camicia a fiori', emoji: '🌺', motivo: 'pois', c: 0x29a3a3, prezzo: 12 },
    { id: 'natale', nome: 'Maglione di Natale', emoji: '🎄', motivo: 'natale', c: 0xc0302c, prezzo: 14, stagione: 'natale' },
  ],
  pantalone: [
    { id: 'blu', nome: 'Blu', c: 0x3d68b8 }, { id: 'verde', nome: 'Verde', c: 0x4a8a4a },
    { id: 'marrone', nome: 'Marrone', c: 0x8a5a30 }, { id: 'rosso', nome: 'Rosso', c: 0xb8443a },
    { id: 'giallo', nome: 'Giallo', c: 0xd8a830 },
    { id: 'nero', nome: 'Nero', c: 0x2a2a32, prezzo: 8 }, { id: 'viola', nome: 'Viola', c: 0x7a4aa8, prezzo: 8 },
    { id: 'rosa', nome: 'Rosa', c: 0xe486a8, prezzo: 8 },
  ],
  stivali: [
    { id: 'marroni', nome: 'Marroni', c: 0x6a4426 }, { id: 'gialli', nome: 'Gialli', c: 0xe0b020 },
    { id: 'rossi', nome: 'Rossi', c: 0xc03030 }, { id: 'verdi', nome: 'Verdi', c: 0x3f7a4a },
    { id: 'neri', nome: 'Neri', c: 0x2a2a30 }, { id: 'dorati', nome: 'Dorati', emoji: '✨', c: 0xc9a227, liv: sullaScalaDellaDueD(12) },
    { id: 'bianchi', nome: 'Bianchi', c: 0xf0f0ee, prezzo: 8 }, { id: 'azzurri', nome: 'Azzurri', c: 0x4aa8d8, prezzo: 8 },
    { id: 'argento', nome: 'Argento', emoji: '🥈', c: 0xc4cad2, liv: sullaScalaDellaDueD(18) },
  ],
  collo: [
    { id: 'fazzoletto-rosso', nome: 'Fazzoletto rosso', forma: 'fazzoletto', c: 0xd2392e },
    { id: 'fazzoletto-blu', nome: 'Fazzoletto blu', forma: 'fazzoletto', c: 0x3b6fc0 },
    { id: 'fazzoletto-giallo', nome: 'Fazzoletto giallo', forma: 'fazzoletto', c: 0xe0b030 },
    { id: 'sciarpa', nome: 'Sciarpa', forma: 'sciarpa', c: 0x4a8a4a },
    { id: 'sciarpa-azzurra', nome: 'Sciarpa azzurra', forma: 'sciarpa', c: 0x4aa8d8, prezzo: 8 },
    { id: 'sciarpa-natale', nome: 'Sciarpa di Natale', emoji: '🧣', forma: 'sciarpa', c: 0xc8281e, righe: 0xf6f3ee, prezzo: 8, stagione: 'natale' },
    { id: 'sciarpa-oro', nome: 'Sciarpa dorata', emoji: '✨', forma: 'sciarpa', c: 0xd8b030, liv: sullaScalaDellaDueD(16) },
    { id: 'papillon', nome: 'Papillon', emoji: '🎀', forma: 'papillon', c: 0x22222a, per: 'contadino', liv: sullaScalaDellaDueD(9) },
    { id: 'scialle', nome: 'Scialle', emoji: '🧵', forma: 'scialle', c: 0xb85a8a, per: 'contadina', liv: sullaScalaDellaDueD(9) },
    { id: 'niente', nome: 'Niente', emoji: '🚫', forma: 'niente', c: 0 },
  ],
  capelli: [
    { id: 'corti-castani', nome: 'Corti castani', stile: 'corti', colore: 'castani', c: 0x6b4423, per: 'contadino' },
    { id: 'corti-neri', nome: 'Corti neri', stile: 'corti', colore: 'neri', c: 0x2a2220, per: 'contadino' },
    { id: 'corti-biondi', nome: 'Corti biondi', stile: 'corti', colore: 'biondi', c: 0xd8b050, per: 'contadino' },
    { id: 'corti-rossi', nome: 'Corti rossi', stile: 'corti', colore: 'rossi', c: 0xb8502a, per: 'contadino' },
    { id: 'corti-blu', nome: 'Corti blu', stile: 'corti', colore: 'blu', c: 0x3d78d8, per: 'contadino', prezzo: 10 },
    { id: 'corti-verdi', nome: 'Corti verdi', stile: 'corti', colore: 'verdi', c: 0x4aa84a, per: 'contadino', prezzo: 10 },
    { id: 'trecce-castane', nome: 'Trecce castane', stile: 'trecce', colore: 'castani', c: 0x7a4a26, per: 'contadina' },
    { id: 'trecce-bionde', nome: 'Trecce bionde', stile: 'trecce', colore: 'biondi', c: 0xd8b050, per: 'contadina' },
    { id: 'coda-nera', nome: 'Coda nera', stile: 'coda', colore: 'neri', c: 0x2a2220, per: 'contadina' },
    { id: 'coda-rossa', nome: 'Coda rossa', stile: 'coda', colore: 'rossi', c: 0xb8502a, per: 'contadina' },
    { id: 'caschetto-castano', nome: 'Caschetto castano', stile: 'caschetto', colore: 'castani', c: 0x7a4a26, per: 'contadina' },
    { id: 'caschetto-nero', nome: 'Caschetto nero', stile: 'caschetto', colore: 'neri', c: 0x2a2220, per: 'contadina' },
    { id: 'trecce-rosa', nome: 'Trecce rosa', stile: 'trecce', colore: 'rosa', c: 0xe86f9a, per: 'contadina', prezzo: 10 },
    { id: 'coda-azzurra', nome: 'Coda azzurra', stile: 'coda', colore: 'azzurri', c: 0x4aa8d8, per: 'contadina', prezzo: 10 },
    { id: 'caschetto-viola', nome: 'Caschetto viola', stile: 'caschetto', colore: 'viola', c: 0x8a4aa8, per: 'contadina', prezzo: 10 },
  ],
  pelle: [
    { id: 'chiara', nome: 'Chiara', c: 0xf8d8bc, css: '#f8d8bc' }, { id: 'dorata', nome: 'Dorata', c: 0xf5c9a2, css: '#f5c9a2' },
    { id: 'ambra', nome: 'Ambra', c: 0xd9a272, css: '#d9a272' }, { id: 'bruna', nome: 'Bruna', c: 0xa8754a, css: '#a8754a' },
    { id: 'scura', nome: 'Scura', c: 0x6e4630, css: '#6e4630' },
  ],
}

const SERIE = {
  contadino: { cappello: 'paglia', maglia: 'quadri', pantalone: 'blu', stivali: 'marroni', collo: 'fazzoletto-rosso', capelli: 'corti-castani', pelle: 'dorata' },
  contadina: { cappello: 'paglia', maglia: 'camicetta', pantalone: 'blu', stivali: 'marroni', collo: 'fazzoletto-rosso', capelli: 'trecce-castane', pelle: 'dorata' },
}

const NOMI = {
  contadino: { nome: 'contadino', il: 'il contadino', al: 'al contadino', del: 'del contadino', dal: 'dal contadino' },
  contadina: { nome: 'contadina', il: 'la contadina', al: 'alla contadina', del: 'della contadina', dal: 'dalla contadina' },
}

// ── la persona, dal profilo ──
const LEI = new Set(['bambina', 'principessa', 'ladra']), LUI = new Set(['bimbo', 'cavaliere', 'mago'])
/** Contadino o contadina, dal personaggio che il bambino ha scelto nel profilo (`aspettoDi()`: 'bambina' | 'bimbo'). Quello che non si
    riconosce ripiega su `ASPETTO_ERO`. Mai un'eccezione. */
export function personaDi(aspetto, seNiente = ASPETTO_ERO) {
  if (LEI.has(aspetto)) return 'contadina'
  if (LUI.has(aspetto)) return 'contadino'
  return PERSONE_ABITO.includes(seNiente) ? seNiente : 'contadino'
}
const persona = p => (PERSONE_ABITO.includes(p) ? p : 'contadino')

/** «contadino» | «il contadino» | «al contadino» | «del contadino» | «dal contadino» (e le forme di lei). `chi`: 'contadino'|'contadina'. */
export function nomeDelContadino(chi, forma = 'il') {
  const n = NOMI[persona(chi && chi.persona ? chi.persona : chi)]
  return n[forma] || n.il
}

// ── il catalogo ──
export const opzioniDi = (categoria, chi) => (CAT[categoria] || []).filter(o => !o.per || o.per === persona(chi))
export const opzione = (categoria, id) => (CAT[categoria] || []).find(o => o.id === id) || null
export const etichettaDi = (categoria, chi) => { const e = ETICHETTE[categoria]; return persona(chi) === 'contadina' && e.nomeLei ? { ...e, nome: e.nomeLei } : e }
/** Un pezzo è libero se non ha `liv` o se il livello l'ha raggiunto. */
export const sbloccato = (o, livello) => !o || !o.liv || (livello | 0) >= o.liv

// ── i pezzi a pagamento (docs/fattoria3d/guardaroba.md): si comprano una volta, restano per sempre nell'armadio ──
export const chiaveCapo = (categoria, id) => categoria + ':' + id
/** L'armadio letto da un salvataggio: { 'cappello:cilindro': true }. Un pezzo che non esiste o è gratis si butta. */
export function armadioInForma(letto) {
  const fuori = {}
  if (!letto || typeof letto !== 'object' || Array.isArray(letto)) return fuori
  for (const k of Object.keys(letto)) {
    const [c, id] = k.split(':'), o = opzione(c, id)
    if (o && o.prezzo && letto[k]) fuori[k] = true
  }
  return fuori
}
/** Com'è un pezzo per chi lo guarda: 'libero' (gratis), 'mio' (a pagamento e comprato), 'in-vendita', 'fuori-stagione' (non si compra ora) o 'bloccato' (livello). */
export function statoDelPezzo(categoria, o, { livello = 99, armadio = {}, stagione = '' } = {}) {
  if (!sbloccato(o, livello)) return 'bloccato'
  if (!o.prezzo) return 'libero'
  if (armadio[chiaveCapo(categoria, o.id)]) return 'mio'
  return o.stagione && o.stagione !== stagione ? 'fuori-stagione' : 'in-vendita'
}
/** Le scelte da mostrare: quelle di una festa solo in quella festa o se le hai già. */
export const scelteDi = (categoria, chi, { armadio = {}, stagione = '' } = {}) =>
  opzioniDi(categoria, chi).filter(o => !o.stagione || o.stagione === stagione || armadio[chiaveCapo(categoria, o.id)])
/** Quanto costa l'abito: i pezzi a pagamento che non hai già, [{ categoria, ...pezzo }]. Mai un'eccezione. */
export function daComprare(abito, armadio = {}) {
  const fuori = []
  for (const c of CATEGORIE) {
    const o = opzione(c, abito && abito[c])
    if (o && o.prezzo && !armadio[chiaveCapo(c, o.id)]) fuori.push({ categoria: c, ...o })
  }
  return fuori
}
export const abitoDiSerie = chi => ({ persona: persona(chi), ...SERIE[persona(chi)] })

/** Vero se l'abito è intero e ogni pezzo esiste per la sua persona. Non lancia mai. */
export function valida(abito) {
  try {
    if (!abito || typeof abito !== 'object' || !PERSONE_ABITO.includes(abito.persona)) return false
    return CATEGORIE.every(c => opzioniDi(c, abito.persona).some(o => o.id === abito[c]))
  } catch (e) { return false }
}

/**
 * Rimette in forma qualunque cosa sia stata salvata (un abito rotto, vecchio, incompleto, `null`) per `chi` (la persona dal profilo):
 * ogni capo che non esiste per lei si cambia con quello di colore uguale (i capelli), o con quello di serie. Non lancia mai e
 * non guarda il livello (un pezzo già indossato resta). Tornano solo capi più la persona: lo si può dare a `creaContadino`.
 */
export function normalizzaAbito(salvato, chi) {
  const p = persona(chi), serie = SERIE[p], fuori = {}
  const s = salvato && typeof salvato === 'object' ? salvato : {}
  for (const c of CATEGORIE) {
    const opz = opzioniDi(c, p), id = typeof s[c] === 'string' ? s[c] : ''
    let o = opz.find(x => x.id === id)
    if (!o && c === 'capelli') { const vecchio = opzione('capelli', id); if (vecchio) o = opz.find(x => x.colore === vecchio.colore) }
    fuori[c] = (o || opz.find(x => x.id === serie[c])).id
  }
  return { persona: p, ...fuori }
}

/** I soli capi, da salvare (la persona non si salva). */
export const capiDi = abito => { const o = {}; for (const c of CATEGORIE) o[c] = abito[c]; return o }
/** Una stringa per la cache dei modelli e per confrontare due abiti. */
export const chiaveAbito = abito => [persona(abito && abito.persona), ...CATEGORIE.map(c => abito && abito[c])].join('|')

/** Il contrario di `chiaveAbito`: dalla stringa all'abito (rimesso in forma, mai un'eccezione). */
export function abitoDaChiave(chiave) {
  const [p, ...resto] = String(chiave || '').split('|'), abito = {}
  CATEGORIE.forEach((c, i) => { abito[c] = resto[i] })
  return normalizzaAbito(abito, p)
}

/** Cambia un capo se esiste per la persona e il livello lo permette; altrimenti torna l'abito com'era. */
export function vesti(abito, categoria, id, livello = 99) {
  const o = opzioniDi(categoria, abito.persona).find(x => x.id === id)
  if (!o || !sbloccato(o, livello)) return abito
  return { ...abito, [categoria]: id }
}

/** I pezzi speciali che arrivano a questo livello (o prima): [{ categoria, ...pezzo }]. `soloQuesto`: quelli che arrivano proprio ora. Per `roba(l)`. */
export function abitiAl(livello, soloQuesto = false) {
  const l = Math.max(1, livello | 0), fuori = []
  for (const c of CATEGORIE) for (const o of CAT[c]) if (o.liv && (soloQuesto ? o.liv === l : o.liv <= l)) fuori.push({ categoria: c, ...o })
  return fuori.sort((a, b) => a.liv - b.liv)
}

export function guastiDegliAbiti() {
  const g = []
  for (const c of CATEGORIE) {
    const visti = new Set()
    for (const o of CAT[c]) {
      if (!o.id || !o.nome) g.push(`${c}: un pezzo senza id o nome`)
      if (visti.has(o.id)) g.push(`${c}: «${o.id}» due volte`)
      visti.add(o.id)
      if (typeof o.c !== 'number') g.push(`${c}/${o.id}: manca il colore`)
      if (o.per && !PERSONE_ABITO.includes(o.per)) g.push(`${c}/${o.id}: persona «${o.per}» sconosciuta`)
      if (o.liv !== undefined && !(Number.isInteger(o.liv) && o.liv >= 2)) g.push(`${c}/${o.id}: livello ${o.liv} (da 2 in su)`)
      if (o.prezzo !== undefined && !(Number.isInteger(o.prezzo) && o.prezzo >= 6 && o.prezzo <= 30)) g.push(`${c}/${o.id}: 🪙${o.prezzo} è fuori dalla fascia di una cosetta (6–30)`)
      if (o.prezzo && o.liv) g.push(`${c}/${o.id}: o si compra o arriva col livello, non tutti e due`)
      if (o.stagione && !o.prezzo) g.push(`${c}/${o.id}: un pezzo di festa si compra`)
      if (c === 'capelli' && !(o.stile && o.colore && o.per)) g.push(`${c}/${o.id}: servono stile, colore e persona`)
      if (c === 'pelle' && !/^#[0-9a-f]{6}$/i.test(o.css || '')) g.push(`pelle/${o.id}: manca il colore css (la faccia)`)
    }
    for (const p of PERSONE_ABITO) {
      const n = opzioniDi(c, p).length
      if (n < 3 || n > 14) g.push(`${c}: ${n} scelte per ${p} (da 3 a 14)`)
      if (!opzioniDi(c, p).some(o => !o.liv)) g.push(`${c}: per ${p} niente di libero`)
    }
  }
  for (const p of PERSONE_ABITO) {
    for (const c of CATEGORIE) {
      const o = opzioniDi(c, p).find(x => x.id === SERIE[p][c])
      if (!o) g.push(`la serie di ${p}: ${c} «${SERIE[p][c]}» non esiste`)
      else if (o.liv || o.prezzo) g.push(`la serie di ${p}: ${c} «${o.id}» non è gratis`)
    }
    if (!valida(abitoDiSerie(p))) g.push(`l'abito di serie di ${p} non è valido`)
  }
  for (const c of ['cappello', 'collo']) if (!CAT[c].some(o => o.id === 'niente')) g.push(`${c}: manca «niente»`)
  return g
}
