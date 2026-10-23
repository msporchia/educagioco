/* Le decorazioni della fattoria di sempre portate in 3D (giro G8, parità L20/W7–W14): il verde, i recinti coi cartelli delle colture, il raccolto,
   le case piccole coi lampioni e le bestiole. Dato puro. Nome, prezzo, livello e rincaro arrivano dalla voce 2D con lo stesso id (`VOCE_DECORI` in
   dati/parita2d.js: «gli id dei contenuti non si rinominano», con l'eccezione di `recinto` di legno → `recinto_legno` e di pane, torta, marmellata e latte → `<id>_decoro`, perché in 3D quegli id sono delle pecore e delle merci); qui sta solo ciò che la 2D non può dire: l'ingombro in celle 3D (il foglio 2D ne dava uno ricavato dallo sprite: un albero
   di 2×1 non ha senso in 3D), l'emoji della carta e i vincoli che la 2D non ha (`stagione`, `fiera`, `soloAcqua`, `anfibio`, `riva`). Il disegno è in scena3d/modelli-decori-*.js. Vedi docs/fattoria3d/decorazioni.md. */
import { voce2d, FAMIGLIA_DEL_DECORO } from './parita2d.js'

/** Le schede nuove del menu «Costruisci qui» (le aggiunge catalogo.js a `CATEGORIE`, dopo «Decori»). «Feste» tiene l'albero di Natale (solo in stagione) e le otto
    decorazioni della fiera (solo se le hai: arrivano dalla mongolfiera); la scheda si nasconde quando non ha carte. */
export const SCHEDE_DECORI = {
  verde:    { nome: 'Verde',    emoji: '🌳' },
  fiori:    { nome: 'Fiori',    emoji: '🌸' },
  recinti:  { nome: 'Recinti',  emoji: '🚧' },
  raccolto: { nome: 'Raccolto', emoji: '🧺' },
  case:     { nome: 'Case',     emoji: '🏡' },
  arredo:   { nome: 'Arredo',   emoji: '🪑' },
  acqua:    { nome: 'Acqua',    emoji: '⛲' },
  bestiole: { nome: 'Bestiole', emoji: '🐞' },
  feste:    { nome: 'Feste',    emoji: '🎪' },
}
const FAMIGLIA_EMOJI = { verde: '🌳', recinti: '🚧', raccolto: '🧺', case: '🏡', bestiole: '🐞', fiori: '🌸', arredo: '🪑', acqua: '⛲', feste: '🎪', fiera: '🎪' }
/** La scheda del menu di ogni famiglia 2D (la fiera sta con le feste). */
export const SCHEDA_DELLA_FAMIGLIA = { fiera: 'feste' }

/** id 3D → [larghezza, profondità, emoji?, extra?] (la larghezza è lungo x con `rot` 0, il davanti verso +z). */
const MISURE = {
  // ── il verde (W7) ──
  albero: [1, 1, '🌲'], albero_verde: [1, 1], albero_rosa: [1, 1, '🌸'], melo: [1, 1, '🍎'], topiaria: [1, 1, '🪴'],
  siepe: [2, 1, '🌿'], siepe_tonda: [2, 1, '🌿'], arbusto_largo: [2, 1, '🌿'], arbusto_basso: [1, 1, '🌿'], arbusto_tondo: [1, 1, '🌿'], arbusto_ciuffo: [1, 1, '🌱'],
  radura: [3, 3, '🌼'],        // un prato fiorito piatto: in 2D era «sotto» (ci si cammina); in 3D occupa le sue 9 celle come ogni decoro (deviazione, decorazioni.md)
  fungo: [1, 1, '🍄'], fungo_rosso: [1, 1, '🍄'], ceppo: [1, 1, '🪵'], ceppino: [1, 1, '🪵'], ceppo_ascia: [1, 1, '🪓'],
  tronco: [3, 1, '🪵'], tronco_corto: [1, 1, '🪵'], tronco_su: [1, 1, '🪵'],
  sasso: [1, 1, '🪨'], sassi: [1, 1, '🪨'], masso: [1, 1, '🪨'], sassi_fila: [2, 1, '🪨'], masso_fiorito: [1, 1, '🪨'], sasso_fiorito: [1, 1, '🪨'], roccia: [2, 1, '🪨'],
  // ── i recinti, le pergole, i cartelli delle colture (W10) ──
  staccio: [2, 1, '🚧'], recinto_legno: [2, 1, '🚧'], cancello: [2, 1, '🚪'], ringhiera: [3, 1, '🚧'], colonna: [1, 1, '🏛️'],
  pergola: [2, 2, '🌿'], pergola_fiorita: [2, 2, '🌸'], gazebo: [3, 3, '⛩️'], gazebo_cena: [3, 3, '🍽️'],
  cartello: [1, 1, '🪧'], insegna: [1, 1, '🪧'], bandiera: [1, 1, '🚩'], stendardo: [1, 1, '🚩'],
  cartello_grano: [1, 1, '🌾'], cartello_mais: [1, 1, '🌽'], cartello_carote: [1, 1, '🥕'], cartello_zucche: [1, 1, '🎃'], cartello_erba: [1, 1, '🌿'],
  cartello_pomodori: [1, 1, '🍅'], cartello_patate: [1, 1, '🥔'], cartello_fragole: [1, 1, '🍓'], cartello_melanzane: [1, 1, '🍆'], cartello_peperoni: [1, 1, '🫑'],
  cartello_cavolfiori: [1, 1, '🥦'], cartello_cipolle: [1, 1, '🧅'], cartello_aglio: [1, 1, '🧄'], cartello_barbabietola: [1, 1, '🌱'], cartello_lavanda: [1, 1, '🌸'], cartello_riso: [1, 1, '🍚'],
  // ── il raccolto (W14) ──
  balla_tonda: [1, 1, '🌾'], balla_quadra: [1, 1, '🌾'], balle_fieno: [2, 1, '🌾'], covone: [1, 1, '🌾'],
  cassetta0: [1, 1, '📦'], cassetta1: [1, 1, '📦'], cassetta2: [1, 1, '📦'], cassetta3: [1, 1, '📦'],
  raccolto_grano: [1, 1, '🌾'], raccolto_mais: [1, 1, '🌽'], raccolto_carote: [1, 1, '🥕'], raccolto_zucche: [1, 1, '🎃'], raccolto_erba: [1, 1, '🌿'],
  raccolto_patate: [1, 1, '🥔'], raccolto_cavolfiori: [1, 1, '🥦'], raccolto_pomodori: [1, 1, '🍅'], raccolto_melanzane: [1, 1, '🍆'], raccolto_peperoni: [1, 1, '🫑'],
  raccolto_cipolle: [1, 1, '🧅'], raccolto_aglio: [1, 1, '🧄'], raccolto_fragole: [1, 1, '🍓'],
  cassetta_fragole: [1, 1, '🍓'], cassetta_raccolto: [1, 1, '📦'], cesta_pomodori: [1, 1, '🍅'], cesta_verdure: [1, 1, '🥬'], cesto_agrumi: [1, 1, '🍊'],
  cesto_mele: [1, 1, '🍎'], cassa_mele: [1, 1, '🍎'], barile_mele: [1, 1, '🍎'], barile_frutta: [1, 1, '🍐'], cesta_picnic: [1, 1, '🧺'],
  pane_decoro: [1, 1, '🍞'], panino: [1, 1, '🥖'], torta_decoro: [1, 1, '🍰'], crostatina: [1, 1, '🥧'], marmellata_decoro: [1, 1, '🍯'], latte_decoro: [1, 1, '🥛'], vasetto: [1, 1, '🍯'],
  // ── le case piccole, i forni, i chioschi, i lampioni (W11) ──
  casa: [4, 3, '🏠'], casetta: [2, 2, '🏡'], casetta_lunga: [3, 2, '🏡'], casa_veranda: [4, 3, '🏡'], casa_albero: [3, 3, '🌳'],
  fienile_rosso: [4, 3, '🏚️'], fienile_blu: [3, 3, '🏚️'], torretta: [2, 2, '🏰'], forno: [2, 2, '🔥'], forno_pizza: [2, 2, '🍕'],
  chiosco_rosa: [3, 2, '🎪'], chiosco_azzurro: [3, 2, '🎪'], casotta: [2, 2, '🐔'], serra: [4, 3, '🪴'], tettoia_fieno: [3, 2, '🌾'], capanno: [3, 2, '🛖'],
  lampione: [1, 1, '🏮'], lampione_cesto: [1, 1, '🏮'], lanterna: [1, 1, '🏮'],
  // ── le bestiole (W13) ──
  cuccia: [1, 1, '🐕'], cuccia_grande: [2, 1, '🐕'], casetta_uccelli: [1, 1, '🐦'], casetta_uccelli2: [1, 1, '🐦'], vasca_uccelli: [1, 1, '🐦'], ciotola: [1, 1, '🥣'],
  apiario: [2, 1, '🐝'], alveare: [1, 1, '🐝'], coniglietto: [1, 1, '🐇'], gattino: [1, 1, '🐈'], cucciolo: [1, 1, '🐕'], pulcino: [1, 1, '🐥'],
  uccellino: [1, 1, '🐦'], tartarughe: [1, 1, '🐢'], farfalla: [1, 1, '🦋'], farfalle: [1, 1, '🦋'], coccinella: [1, 1, '🐞'],
  // ── i fiori e i vasi (W8): le forme del verde con altri colori; il bocciolo è l'aiuola, c'era già ──
  fiorellino: [1, 1, '🌼'], germoglio: [1, 1, '🌱'], fiori0: [1, 1, '🌷'], fiori1: [1, 1, '🌼'], fiori2: [1, 1, '💐'], prato_fiorito: [2, 2, '🌼'],
  vaso_f: [1, 1, '🪴'], vaso_p: [1, 1, '🪴'], vaso_a: [1, 1, '🪴'], vaso_tulipani: [1, 1, '🌷'], vaso_margherite: [1, 1, '🌼'], vaso_lavanda: [1, 1, '🌿'],
  vaso_girasoli: [1, 1, '🌻'], girasole_cuore: [1, 1, '🌻'], ortensie_blu: [1, 1, '🌸'], ortensie_rosa: [1, 1, '🌸'], azalea: [1, 1, '🌺'],
  vaso_rosa: [1, 1, '🌹'], vaso_alto: [1, 1, '🏺'], pianta_vaso: [1, 1, '🪴'], fioriera: [2, 1, '🌸'], fioriera_box: [1, 1, '🌷'], fioriera_mista: [2, 1, '💐'],
  cassetta_fiori: [1, 1, '🌼'], cesta_fiori: [1, 1, '💐'], cesto_fiori: [1, 1, '🧺'], carriola: [2, 1, '🌷'], bici: [2, 1, '🚲'], carretto_fiori: [2, 1, '💐'],
  carretto_frutta: [2, 1, '🍎'], palo_rose: [1, 1, '🌹'], arco_rose: [2, 1, '🌹'], fiore_appeso: [1, 1, '🌸'],
  // ── l'arredo (W12) ──
  panchina2: [2, 1, '🪑'], panchina_legno: [2, 1, '🪑'], panchina_bianca: [2, 1, '🪑'], panchina_cuore: [2, 1, '💗'], sedia: [1, 1, '🪑'], sdraio: [1, 1, '🏖️'],
  amaca: [3, 1, '🌴'], altalena: [2, 1, '🎠'], altalena_pergola: [3, 2, '🛋️'], tavolino: [1, 1, '🍵'], bancone: [2, 1, '🏪'], cassa: [1, 1, '📦'], cassa_grande: [1, 1, '📦'],
  barile: [1, 1, '🛢️'], barile2: [1, 1, '🛢️'], barilotto: [1, 1, '🛢️'], sacco: [1, 1, '🛍️'], sacco_iuta: [1, 1, '🛍️'], posta: [1, 1, '📮'], specchio: [1, 1, '🪞'],
  campanelle: [1, 1, '🔔'], girandola: [1, 1, '🎡'], mulinello: [1, 1, '🌬️'], palloncini: [1, 1, '🎈'], festone: [2, 1, '🎉'], lucine: [2, 1, '✨'], paiolo: [1, 1, '🍲'],
  // ── l'acqua (W9): la fontana grande, la cantina e il pozzo coperto stanno sul prato; il mulino sulla riva; le ninfee galleggiano; le canne anche nell'acqua bassa ──
  fontana_grande: [3, 3, '⛲'], cantina: [2, 2, '🍷'], pozzo_coperto: [1, 1, '🪣'],
  mulino_acqua: [3, 3, '🏭', { suAcqua: true, riva: true }],
  ninfee: [1, 1, '🪷', { suAcqua: true, soloAcqua: true }], ninfee_piccole: [1, 1, '🪷', { suAcqua: true, soloAcqua: true }], canne: [1, 1, '🌾', { suAcqua: true, anfibio: true }],
  // ── le feste e la fiera (W15): l'albero di Natale da comprare solo in stagione; la fiera non si compra, si vince dalla mongolfiera (`fiera`) ──
  albero_natale: [1, 1, '🎄', { stagione: 'natale' }],
  fiera_bandierine: [3, 1, '🚩', { fiera: true }], fiera_giostra: [2, 2, '🎠', { fiera: true }], fiera_zucchero_filato: [1, 1, '🍭', { fiera: true }],
  fiera_lanterne: [1, 1, '🏮', { fiera: true }], fiera_barattoli: [2, 1, '🥫', { fiera: true }], fiera_girasole: [1, 1, '🌻', { fiera: true }],
  fiera_spaventapasseri: [1, 1, '🧑‍🌾', { fiera: true }], fiera_palco: [3, 2, '🎺', { fiera: true }],
}
const NOMI = { recinto_legno: 'Recinto di legno', pane_decoro: 'Pane', torta_decoro: 'Torta', marmellata_decoro: 'Marmellata', latte_decoro: 'Bottiglia' }       // il nome della voce 2D è «Recinto»: in 3D «Recinto» è quello delle pecore

/** I pezzi del catalogo 3D per le decorazioni portate. `da2d(tipo)` è quello di catalogo.js (prezzo, rincaro, cresce, liv dalla voce 2D). */
export function pezziDecori(da2d) {
  const out = {}
  for (const [id, [w, d, emoji, extra]] of Object.entries(MISURE)) {
    const famiglia = FAMIGLIA_DEL_DECORO[id], v = voce2d(id)
    if (!famiglia || !v) continue
    out[id] = { nome: NOMI[id] || v.nome, emoji: emoji || FAMIGLIA_EMOJI[famiglia], w, d, ...da2d(id), categoria: SCHEDA_DELLA_FAMIGLIA[famiglia] || famiglia, decoro: true, ...extra }
  }
  return out
}

/** Le decorazioni della 2D che hanno un disegno 3D e quelle che no (per il test di parità e per il documento). */
export const IDS_DECORI = Object.keys(MISURE)
export const guastiDeiDecori = () => {
  const g = []
  for (const id of Object.keys(FAMIGLIA_DEL_DECORO)) if (!MISURE[id]) g.push(`${id}: una decorazione della 2D senza ingombro 3D`)
  for (const id of IDS_DECORI) if (!FAMIGLIA_DEL_DECORO[id]) g.push(`${id}: ha un ingombro e non è nelle famiglie portate`)
  return g
}
