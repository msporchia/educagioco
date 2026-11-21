/* IL CUOCO DELLA CUCINA — chi è, la pelle e i capelli, il grembiule, il cappello, il collo: le scelte del bambino, tutte gratis.
   Vedi docs/bancarella/cuoco.md. Dato puro, senza three: la scena (`grafica/cucina3d/omino.js`) legge da qui i colori.
   Il cuoco si salva come una riga (`chiaveVeste`, «cuoca.ambra.coda.rossi.-.righe.verde.alto.bianco.papillon.giallo»): la stessa
   riga va all'altro telefono in due, e fa da nome alle foto. Gli id non si rinominano: stanno nei salvataggi. */
import { PELLI, COLORI_CAPELLI, TAGLI } from '../grafica/persona/aspetto.js'

const css = c => '#' + c.toString(16).padStart(6, '0')
const tinta = (id, nome, c) => ({ id, nome, c, css: css(c) })

// le stoffe: il grembiule, il cappello e il collo scelgono da qui
export const STOFFE = [
  tinta('blu', 'Blu', 0x2f6f8f), tinta('rosso', 'Rosso', 0xd2402e), tinta('verde', 'Verde', 0x3f9a4a), tinta('giallo', 'Giallo', 0xf2c230),
  tinta('rosa', 'Rosa', 0xf07aa6), tinta('viola', 'Viola', 0x8a5ac0), tinta('arancio', 'Arancio', 0xf08a2a), tinta('azzurro', 'Azzurro', 0x5ab4e8),
  tinta('nero', 'Nero', 0x2a2a30),
]
const BIANCO = tinta('bianco', 'Bianco', 0xfbf7ee)

/* Gli animali: `pelo` il manto, `muso` la bocca e il mento, `dentro` le orecchie, `naso`; `macchie` un secondo colore a chiazze. */
const manto = (id, nome, pelo, muso, dentro, naso, altro = {}) => ({ ...tinta(id, nome, pelo), pelo, muso, dentro, naso, ...altro })
export const ANIMALI = {
  gatto: { nome: 'Gatto', manti: [
    manto('bianconero', 'Bianco e nero', 0x24232a, 0xf6f3ec, 0xe8a0a8, 0xe07a8a, { zampe: 0xf6f3ec, fronte: 0xf6f3ec }),
    manto('tricolore', 'Tricolore', 0xf6f0e4, 0xfffaf2, 0xe8a0a8, 0xe07a8a, { macchie: [0xd9822b, 0x2e2a2a] }),
    manto('rosso', 'Rosso', 0xe08a3a, 0xfbe6c8, 0xf0a8a0, 0xd8707a, { righe: 0xb8601e }),
    manto('grigio', 'Grigio', 0x8d95a0, 0xe6e8ec, 0xe8a0a8, 0x5a5560),
  ] },
  orsetto: { nome: 'Orsetto', manti: [
    manto('marrone', 'Marrone', 0x8a5a34, 0xe0b88a, 0x6a4024, 0x2a1a14),
    manto('miele', 'Miele', 0xd9a050, 0xf6deb0, 0xb07a34, 0x3a2414),
    manto('panda', 'Panda', 0xf6f4ee, 0xffffff, 0x24232a, 0x24232a, { orecchie: 0x24232a, occhiaie: 0x24232a, zampe: 0x24232a }),
    manto('polare', 'Polare', 0xf2f0ea, 0xffffff, 0xd8d2c6, 0x2a2a30),
  ] },
  coniglio: { nome: 'Coniglio', manti: [
    manto('bianco', 'Bianco', 0xf8f6f0, 0xffffff, 0xf4a8b8, 0xf08aa0),
    manto('grigio', 'Grigio', 0xa8a6a8, 0xeeeeee, 0xf0b0bc, 0xe8889a),
    manto('marrone', 'Marrone', 0xa8764a, 0xf0dcc0, 0xf0b0a8, 0xe08890),
    manto('pezzato', 'Pezzato', 0xfaf8f2, 0xffffff, 0xf4a8b8, 0xf08aa0, { macchie: [0x6a4a34] }),
  ] },
}
export const PERSONE = { cuoco: { nome: 'Cuoco', taglio: 'corti' }, cuoca: { nome: 'Cuoca', taglio: 'trecce' } }
export const CHI = [...Object.keys(PERSONE), ...Object.keys(ANIMALI)]
export const nomeDi = chi => (PERSONE[chi] || ANIMALI[chi]).nome
export const animale = v => !!ANIMALI[v.chi]

export const GREMBIULI = [{ id: 'liscio', nome: 'Liscio' }, { id: 'righe', nome: 'A righe' }, { id: 'quadri', nome: 'A quadretti' }, { id: 'pois', nome: 'A pois' }]
export const CAPPELLI = [{ id: 'alto', nome: 'Alto' }, { id: 'basso', nome: 'Basso' }, { id: 'bandana', nome: 'Bandana' }]
export const COLLI = [{ id: 'fazzoletto', nome: 'Fazzoletto' }, { id: 'papillon', nome: 'Papillon' }, { id: 'niente', nome: 'Niente', niente: true }]
// i tagli che il cuoco porta: tutti quelli in comune coi due giochi (grafica/persona/aspetto.js), «Di serie» è quello del cuoco o della cuoca
export const TAGLI_CUOCO = TAGLI
export const DI_SERIE = '-'

/* La veste: ogni campo è un id. `taglio` '-' vuol dire quello di serie; `manto` vale per gli animali. */
const CAMPI = ['chi', 'pelle', 'taglio', 'capelli', 'manto', 'grembiule', 'stoffa', 'cappello', 'colCappello', 'collo', 'colCollo']
export const VESTE_DI_SERIE = Object.freeze({ chi: 'cuoco', pelle: 'dorata', taglio: DI_SERIE, capelli: 'castani', manto: DI_SERIE,
  grembiule: 'liscio', stoffa: 'blu', cappello: 'alto', colCappello: 'bianco', collo: 'fazzoletto', colCollo: 'rosso' })
const COLORI_CAPPELLO = [BIANCO, ...STOFFE]
const ammessi = {
  chi: CHI, pelle: PELLI.map(p => p.id), taglio: [DI_SERIE, ...TAGLI.map(t => t.id)], capelli: COLORI_CAPELLI.map(c => c.id),
  grembiule: GREMBIULI.map(g => g.id), stoffa: STOFFE.map(s => s.id), cappello: CAPPELLI.map(c => c.id), colCappello: COLORI_CAPPELLO.map(c => c.id),
  collo: COLLI.map(c => c.id), colCollo: STOFFE.map(s => s.id),
}

/** Qualunque cosa (una veste, una riga salvata, niente) diventa una veste intera: il campo che non si conosce torna di serie. */
export function vesteInForma(v) {
  const o = typeof v === 'string' ? Object.fromEntries(v.split('.').map((x, i) => [CAMPI[i], x])) : v && typeof v === 'object' ? v : {}
  const fuori = { ...VESTE_DI_SERIE }
  for (const k of CAMPI) if (k !== 'manto' && ammessi[k].includes(o[k])) fuori[k] = o[k]
  const manti = ANIMALI[fuori.chi]?.manti
  fuori.manto = manti ? (manti.some(m => m.id === o.manto) ? o.manto : manti[0].id) : DI_SERIE
  return fuori
}
export const chiaveVeste = v => { const f = vesteInForma(v); return CAMPI.map(k => f[k]).join('.') }
export const CHIAVE_DI_SERIE = chiaveVeste(VESTE_DI_SERIE)

/* I colori della veste, come li vuole la scena: numeri 0xRRGGBB. */
export function coloriDellaVeste(v) {
  const f = vesteInForma(v), stoffa = id => STOFFE.find(s => s.id === id).c
  return {
    pelle: PELLI.find(p => p.id === f.pelle).c, capelli: COLORI_CAPELLI.find(c => c.id === f.capelli).c,
    taglio: f.taglio === DI_SERIE ? (PERSONE[f.chi]?.taglio || 'corti') : f.taglio,
    manto: ANIMALI[f.chi]?.manti.find(m => m.id === f.manto) || null,
    grembiule: stoffa(f.stoffa), cappello: COLORI_CAPPELLO.find(c => c.id === f.colCappello).c, collo: stoffa(f.colCollo),
  }
}

/* ── per Personalizza.vue (docs/core/personalizza.md) ──
   Le schede non cambiano con chi si è (una scelta non cambia le zone sopra): per un animale «Aspetto» ha il pelo al posto di pelle e capelli. */
export const SCHEDE_CUOCO = [
  { id: 'chi', nome: 'Chi è', tipo: 'oggetti' }, { id: 'aspetto', nome: 'Aspetto', tipo: 'oggetti' }, { id: 'grembiule', nome: 'Grembiule', tipo: 'oggetti' },
  { id: 'cappello', nome: 'Cappello', tipo: 'oggetti' }, { id: 'collo', nome: 'Collo', tipo: 'oggetti' },
]
const colori = (lista, dato) => lista.map(c => ({ id: c.id, nome: c.nome, css: c.css, dati: { [dato]: c.id } }))
export function vociDelCuoco(v) {
  const f = vesteInForma(v), bestia = ANIMALI[f.chi]
  const aspetto = bestia
    ? [{ id: 'pelo', scheda: 'aspetto', posto: 'pelo', nome: 'Pelo', tratto: true, dati: { 'data-voce': 'pelo' }, colori: colori(bestia.manti, 'data-manto') }]
    : [{ id: 'pelle', scheda: 'aspetto', posto: 'pelle', nome: 'Pelle', tratto: true, dati: { 'data-voce': 'pelle' }, colori: colori(PELLI, 'data-pelle') },
       { id: 'capelli', scheda: 'aspetto', posto: 'capelli', nome: 'Capelli', tratto: true, nomeForme: 'Taglio', nomeColori: 'Colore', dati: { 'data-voce': 'capelli' },
         forme: [{ id: DI_SERIE, nome: 'Di serie' }, ...TAGLI].map(t => ({ id: t.id, nome: t.nome, dati: { 'data-taglio': t.id } })),
         colori: colori(COLORI_CAPELLI, 'data-capelli') }]
  return [
    ...CHI.map(id => ({ id, scheda: 'chi', posto: 'chi', nome: nomeDi(id), dati: { 'data-chi': id } })),
    ...aspetto,
    ...GREMBIULI.map(g => ({ id: g.id, scheda: 'grembiule', posto: 'grembiule', nome: g.nome, colori: colori(STOFFE, 'data-stoffa'), dati: { 'data-grembiule': g.id } })),
    ...CAPPELLI.map(c => ({ id: c.id, scheda: 'cappello', posto: 'cappello', nome: c.nome, colori: colori(COLORI_CAPPELLO, 'data-colore'), dati: { 'data-cappello': c.id } })),
    ...COLLI.map(c => ({ id: c.id, scheda: 'collo', posto: 'collo', nome: c.nome, ...(c.niente ? { niente: true } : { colori: colori(STOFFE, 'data-colore') }), dati: { 'data-collo': c.id } })),
  ]
}

/** Dalla veste a quello che Personalizza chiama `indossato`, e ritorno. */
export function valoriDellaVeste(v) {
  const f = vesteInForma(v), val = (oggetto, forma = null, colore = null) => ({ oggetto, forma, colore })
  return {
    chi: val(f.chi), pelle: val('pelle', null, f.pelle), capelli: val('capelli', f.taglio, f.capelli), pelo: val('pelo', null, f.manto === DI_SERIE ? null : f.manto),
    grembiule: val(f.grembiule, null, f.stoffa), cappello: val(f.cappello, null, f.colCappello), collo: val(f.collo, null, f.collo === 'niente' ? null : f.colCollo),
  }
}
export function vesteDeiValori(valori, prima) {
  const f = { ...vesteInForma(prima) }, v = valori
  if (v.chi) f.chi = v.chi.oggetto
  if (v.pelle?.colore) f.pelle = v.pelle.colore
  if (v.capelli) { if (v.capelli.forma) f.taglio = v.capelli.forma; if (v.capelli.colore) f.capelli = v.capelli.colore }
  if (v.pelo?.colore) f.manto = v.pelo.colore
  if (v.grembiule) { f.grembiule = v.grembiule.oggetto; if (v.grembiule.colore) f.stoffa = v.grembiule.colore }
  if (v.cappello) { f.cappello = v.cappello.oggetto; if (v.cappello.colore) f.colCappello = v.cappello.colore }
  if (v.collo) { f.collo = v.collo.oggetto; if (v.collo.colore) f.colCollo = v.collo.colore }
  // un animale nuovo parte dal suo primo manto: il manto di un altro animale non gli sta
  if (f.chi !== vesteInForma(prima).chi) f.manto = DI_SERIE
  return vesteInForma(f)
}
