/* Il guardaroba del contadino della fattoria 3D: cosa si può indossare, a che livello arriva ogni pezzo speciale, e le scelte pure
   (l'abito di serie, rimettere in forma un abito rotto, il nome «il contadino / la contadina»). Niente three, niente profilo: il
   disegno è in `scena3d/modelli-compagni.js` (`creaContadino`), la vista in `viste/Guardaroba.vue`.
   Un ABITO è un oggetto semplice { persona, cappello, maglia, pantalone, stivali, collo, capelli, pelle } di chiavi stringa.
   La PERSONA (contadino o contadina) non si salva qui: viene dal profilo del bambino (`aspettoDi()`, come nella fattoria di
   sempre) ed è un parametro di ogni funzione. In `profile.campagne.fattoria3d.cfg.abito` stanno i soli capi.
   Vedi docs/fattoria3d/guardaroba.md. */
import { sullaScalaDellaDueD } from './parita2d.js'
import { ASPETTO_ERO } from './compagni.js'
import { PELLI, COLORI_CAPELLI, TAGLI, BARBE } from '../../../grafica/persona/aspetto.js'

export const PERSONE_ABITO = ['contadino', 'contadina']
export const CATEGORIE = ['cappello', 'maglia', 'pantalone', 'stivali', 'collo', 'taglio', 'capelli', 'barba', 'pelle']

/** Le etichette del foglio; il pantalone cambia nome con la persona (salopette / gonna). */
export const ETICHETTE = {
  cappello: { emoji: '👒', nome: 'Cappello' }, maglia: { emoji: '👕', nome: 'Maglia' }, pantalone: { emoji: '👖', nome: 'Salopette', nomeLei: 'Gonna' },
  stivali: { emoji: '🥾', nome: 'Stivali' }, collo: { emoji: '🧣', nome: 'Collo' }, taglio: { emoji: '✂️', nome: 'Taglio' }, capelli: { emoji: '🎨', nome: 'Colore' }, barba: { emoji: '🧔', nome: 'Barba' }, pelle: { emoji: '🖐️', nome: 'Pelle' },
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
  // il taglio e la barba sono in comune col sotterraneo (grafica/persona/aspetto.js, il disegno in capelli3d.js); il colore dei capelli, la pelle idem.
  // Un taglio non ha colore: `c` è 0 e il gettone è la foto. Il colore dei capelli di fantasia si paga.
  taglio: TAGLI.map(t => ({ id: t.id, nome: t.nome, c: 0 })),
  capelli: COLORI_CAPELLI.map(k => ({ id: k.id, nome: k.nome, c: k.c, ...(k.fantasia ? { prezzo: 10 } : {}) })),
  barba: BARBE.map(b => ({ id: b.id, nome: b.nome, c: 0 })),
  pelle: PELLI.map(k => ({ id: k.id, nome: k.nome, c: k.c, css: k.css })),
}

const SERIE = {
  contadino: { cappello: 'paglia', maglia: 'quadri', pantalone: 'blu', stivali: 'marroni', collo: 'fazzoletto-rosso', taglio: 'corti', capelli: 'castani', barba: 'nessuna', pelle: 'dorata' },
  contadina: { cappello: 'paglia', maglia: 'camicetta', pantalone: 'blu', stivali: 'marroni', collo: 'fazzoletto-rosso', taglio: 'trecce', capelli: 'castani', barba: 'nessuna', pelle: 'dorata' },
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

// I capelli di prima erano taglio e colore insieme (`corti-castani`, `trecce-rosa`…): un salvataggio vecchio si legge come taglio + colore.
const LEGACY_CAPELLI = {}
for (const [vecchio, nuovo] of Object.entries({ 'corti-castani': 'castani', 'corti-neri': 'neri', 'corti-biondi': 'biondi', 'corti-rossi': 'rossi', 'trecce-castane': 'castani', 'trecce-bionde': 'biondi',
  'coda-nera': 'neri', 'coda-rossa': 'rossi', 'caschetto-castano': 'castani', 'caschetto-nero': 'neri', 'trecce-rosa': 'rosa', 'coda-azzurra': 'azzurri', 'caschetto-viola': 'viola',
  'corti-blu': 'blu', 'corti-verdi': 'verdi' })) LEGACY_CAPELLI[vecchio] = [vecchio.split('-')[0], nuovo]
const capelliVecchio = id => LEGACY_CAPELLI[id] || null

// ── i pezzi a pagamento (docs/fattoria3d/guardaroba.md): si comprano una volta, restano per sempre nell'armadio ──
export const chiaveCapo = (categoria, id) => categoria + ':' + id
/** L'armadio letto da un salvataggio: { 'cappello:cilindro': true }. Un pezzo che non esiste o è gratis si butta. */
export function armadioInForma(letto) {
  const fuori = {}
  if (!letto || typeof letto !== 'object' || Array.isArray(letto)) return fuori
  for (const k of Object.keys(letto)) {
    const [c, idLetto] = k.split(':'), vecchio = c === 'capelli' && capelliVecchio(idLetto), id = vecchio ? vecchio[1] : idLetto, o = opzione(c, id)
    if (o && o.prezzo && letto[k]) fuori[chiaveCapo(c, id)] = true
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
  let s = salvato && typeof salvato === 'object' ? salvato : {}
  const vecchio = typeof s.capelli === 'string' && capelliVecchio(s.capelli)
  if (vecchio) s = { ...s, taglio: typeof s.taglio === 'string' ? s.taglio : vecchio[0], capelli: vecchio[1] }          // un abito di prima: i capelli erano taglio e colore insieme
  for (const c of CATEGORIE) {
    const opz = opzioniDi(c, p), id = typeof s[c] === 'string' ? s[c] : ''
    const o = opz.find(x => x.id === id)
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
      if (typeof o.c !== 'number') g.push(`${c}/${o.id}: manca il colore (0 se è solo una forma)`)
      if (o.per && !PERSONE_ABITO.includes(o.per)) g.push(`${c}/${o.id}: persona «${o.per}» sconosciuta`)
      if (o.liv !== undefined && !(Number.isInteger(o.liv) && o.liv >= 2)) g.push(`${c}/${o.id}: livello ${o.liv} (da 2 in su)`)
      if (o.prezzo !== undefined && !(Number.isInteger(o.prezzo) && o.prezzo >= 6 && o.prezzo <= 30)) g.push(`${c}/${o.id}: 🪙${o.prezzo} è fuori dalla fascia di una cosetta (6–30)`)
      if (o.prezzo && o.liv) g.push(`${c}/${o.id}: o si compra o arriva col livello, non tutti e due`)
      if (o.stagione && !o.prezzo) g.push(`${c}/${o.id}: un pezzo di festa si compra`)
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
