/* Dato puro: cosa si vede (pezzo), quanto occupa (piede), quanto costa. Come si disegna sta in scena/,
   se si può posare sta in motore/. piede si ricava dal disegno (piedeDalDisegno); girare/rovesciare
   e stati dei recinti — vedi docs/fattoria/come-si-tocca.md e macchine.md. */
import { PEZZI, TESSERA, VOCI } from './atlante.js'
import { ricetteDi, SILI } from './coltivazioni.js'
import { FINESTRE } from './stagioni.js'

// Il piede ricavato dal disegno; chi non ci si ritrova scrive piede nella sua riga e vince lui.
export function piedeDalDisegno(pezzo) {
  const p = PEZZI[pezzo]
  if (!p) return [1, 1]
  const largo = Math.max(1, Math.round(p[2] / TESSERA))
  return [largo, largo >= 3 && p[3] / TESSERA >= 2.5 ? 2 : 1]
}

// la/plurale: il genere del nome, dichiarato — non si ricava ("nel conigliera", "nel arnie" erano
// frasi storte che nessun test trova). Usati da motore/consiglio.js.
const V = (id, pezzo, nome, prezzo, extra) =>
  ({ id, pezzo, nome, prezzo, piede: piedeDalDisegno(pezzo), ...extra })

// zona: 'lavoro' o 'bello' (le due metà del baule); liv vince su tutto, solo per chi lavora.
// cresce: rincara a ogni copia (lineare, mai esponenziale); unico: un silo in più non conterrebbe di più.

// Il campo rincara come un pezzo di terra: senza, l'unica strategia sarebbe riempire il prato di campi.
export const RINCARO = 0.6

// Rincaro lineare (base·(1+n·cresce)), non geometrico — vedi docs/fattoria/campi-e-silos.md.
export function prezzoDellaVoce(v, quante = 0) {
  if (!v) return 0
  if (!v.cresce || !(quante > 0)) return v.prezzo
  return Math.round(v.prezzo * (1 + quante * v.cresce))
}

// I ritratti di un recinto: chi non ce l'ha mostra il calmo — vedi docs/fattoria/macchine.md.
const RECINTO = specie => Object.fromEntries(
  ['calmo', 'fame', 'mangia', 'felice', 'dorme', 'pronto'].map(q => {
    const suo = `recinto_${specie}_${q}`
    return [q, PEZZI[suo] ? suo : `recinto_${specie}_calmo`]
  }))

export const CATEGORIE = [
  { chiave: 'verde', zona: 'bello', nome: 'Verde', icona: '🌳', voci: [
    V('albero',        'albero',            'Albero',            18),
    V('albero_verde',  'albero_verde',      'Albero grande',     28),
    V('albero_rosa',   'albero_rosa',       'Albero rosa',       28),
    V('melo',          'melo',              'Melo',              32),
    V('topiaria',      'topiaria',          'Topiaria',          24),
    V('siepe',         'siepe',             'Siepe',              8),
    V('siepe_tonda',   'siepe_tonda',       'Siepe tonda',        8),
    V('arbusto_largo', 'arbusto10',         'Macchia',            7),
    V('arbusto_basso', 'arbusto14',         'Macchia bassa',      7),
    V('arbusto_tondo', 'arbusto3',          'Cespuglietto',       5),
    V('arbusto_ciuffo', 'arbusto21',        'Ciuffo',             4),
    V('radura',        'radura',            'Radura',            12, { sotto: true, piede: [3, 3] }),
    V('fungo',         'fungo0',            'Funghetti',          4),
    V('fungo_rosso',   'fungo1',            'Fungo rosso',        4),
    V('ceppo',         'ceppo0',            'Ceppo',              5),
    V('ceppino',       'ceppo',             'Ceppino',            4),
    V('ceppo_ascia',   'moncone_ascia',     'Ceppo con ascia',    9),
    V('tronco',        'tronco',            'Tronco',             8),
    V('tronco_corto',  'tronco_corto',      'Tronchetto',         5),
    V('tronco_su',     'tronco_verticale',  'Tronco in piedi',    6),
    V('sasso',         'sasso',             'Sasso',              3),
    V('sassi',         'sassi',             'Sassolini',          3),
    V('masso',         'sasso_giardino2',   'Masso',              5),
    V('sassi_fila',    'sasso_giardino9',   'Sassi in fila',      6),
    V('masso_fiorito', 'sasso_fiorito2',    'Masso fiorito',      9),
    V('sasso_fiorito', 'sasso_fiorito7',    'Sasso fiorito',      6),
    V('roccia',        'roccia_muschiosa',  'Roccia',             6),
  ] },

  { chiave: 'fiori', zona: 'bello', nome: 'Fiori', icona: '🌸', voci: [
    V('fiori0',        'fiori0',            'Fiorellini',         4, { sotto: true }),
    V('fiori1',        'fiori1',            'Fiori bianchi',      4, { sotto: true }),
    V('fiori2',        'fiori2',            'Fioritura',          5, { sotto: true }),
    V('fiorellino',    'fiorellino0',       'Un fiore',           3, { sotto: true }),
    V('prato_fiorito', 'palude_fiorita',    'Prato fiorito',      5, { sotto: true }),
    V('boccio',        'boccio_rosa',       'Bocciolo',           3),
    V('germoglio',     'pianta_germoglio',  'Germoglio',          3),
    V('vaso_f',        'vaso_fiore',        'Vaso fiorito',       6),
    V('vaso_p',        'vaso_pianta',       'Vaso alto',          7),
    V('vaso_a',        'vaso_azzurro',      'Vaso azzurro',       6),
    V('vaso_tulipani', 'vaso_tulipani',     'Tulipani',           8),
    V('vaso_margherite', 'vaso_margherite', 'Margherite',         8),
    V('vaso_lavanda',  'vaso_lavanda',      'Lavanda',            9),
    V('vaso_girasoli', 'vaso_girasoli0',    'Girasoli',          10),
    V('girasole_cuore', 'vaso_girasoli_cuore', 'Girasole a cuore', 9),
    V('ortensie_blu',  'vaso_ortensie_blu', 'Ortensie blu',      11),
    V('ortensie_rosa', 'vaso_ortensie_rosa', 'Ortensie rosa',    11),
    V('azalea',        'vaso_azalea0',      'Azalea',             9),
    V('vaso_rosa',     'vaso_fiori_rosa',   'Vaso rosa',         10),
    V('vaso_alto',     'vaso_piedistallo',  'Vaso a colonna',    10),
    V('pianta_vaso',   'pianta_vaso2',      'Pianta in vaso',     5),
    V('fioriera',      'fioriera',          'Fioriera',           9),
    V('fioriera_box',  'fioriera_box0',     'Cassetta fiorita',  10),
    V('fioriera_mista', 'fioriera_mista',   'Fioriera mista',    12),
    V('cassetta_fiori', 'cassetta_fiori0',  'Cassetta di fiori',  9),
    V('cesta_fiori',   'cesta_fiori_grande', 'Cesta di fiori',   12),
    V('cesto_fiori',   'cesto_fiori_misti0', 'Cestino di fiori',  8),
    V('carriola',      'carriola_fiori',    'Carriola fiorita',  16),
    V('bici',          'bici_fiori',        'Bici fiorita',      22),
    V('carretto_fiori', 'carretto_fiori0',  'Carro di fiori',    26),
    V('carretto_frutta', 'carretto_frutta',  'Carro di frutta',   26),
    V('palo_rose',     'palo_rampicante',   'Palo rampicante',   12),
    V('arco_rose',     'arco_rose',         'Arco di rose',      34),
    V('fiore_appeso',  'ciondolo_fiore',    'Fiore appeso',       7),
  ] },

  // Il lavoro: campi, macchine, silos e recinti in una linguetta sola — vedi docs/fattoria/macchine.md.
  { chiave: 'campi', zona: 'lavoro', nome: 'Il lavoro', icona: '🌾', voci: [
    V('orto',          'campo_vuoto',       'Campo',             22,
      { sotto: true, campo: true, piede: [2, 2], cresce: RINCARO }),
    V('mulino',        'mulino_vento',      'Mulino',           150, { macchina: 'mulino', liv: 4, cresce: RINCARO }),
    V('silo',          'silo_rosso',        'Silo del raccolto', 120, { silo: 'terra', unico: true }),
    // Il carretto del vicino: era una decorazione — vedi docs/fattoria/chi-chiede.md.
    V('carretto_mercato', 'carretto',       'Carretto del vicino', 32,
      { vicino: true, liv: 8, unico: true }),
    // La bancarella del mercato: era una decorazione — vedi docs/fattoria/chi-chiede.md.
    V('mercato',       'bancarella',        'Mercato',            40,
      { mercato: true, liv: 2, unico: true }),
    // La mongolfiera: due facce (a terra / partita) — vedi docs/fattoria/chi-chiede.md.
    V('mongolfiera',   'mongolfiera',       'Mongolfiera',       250,
      { mongolfiera: true, liv: 26, unico: true, la: true, piede: [3, 2],
        partita: { pezzo: 'mongolfiera_partita' } }),
    // Insieme al mulino, non dopo: il mangime deve avere subito dove finire.
    V('silo_bianco',   'silo_bianco',       'Silo della stalla', 120, { silo: 'stalla', liv: 4, unico: true }),

    // Le botteghe e il terzo silo: l'albero a più fasi — vedi docs/fattoria/catena.md e sprite.md.
    V('dispensa',      'dispensa',          'Dispensa',         120,
      { silo: 'bottega', liv: 16, unico: true, la: true }),
    V('telaio',        'telaio',            'Telaio',           170,
      { macchina: 'telaio', liv: 16, cresce: RINCARO }),
    // panificio e non forno: forno è già la decorazione "Forno a legna".
    V('panificio',     'panificio',         'Panificio',        180,
      { macchina: 'panificio', liv: 17, cresce: RINCARO }),
    // pentolone: il genere si dichiara (la: true) — vedi la nota su la/plurale in testa al file.
    V('pentolone',     'pentolone',         'Pentolone',        150,
      { macchina: 'pentolone', liv: 23, cresce: RINCARO }),
    V('caseificio',    'caseificio',        'Caseificio',       200,
      { macchina: 'caseificio', liv: 20, cresce: RINCARO }),
    V('sartoria',      'sartoria',          'Sartoria',         250,
      { macchina: 'sartoria', liv: 42, cresce: RINCARO, la: true }),
    V('tintoria',      'tintoria',          'Tintoria',         300,
      { macchina: 'tintoria', liv: 55, cresce: RINCARO, la: true }),
    V('cucina',        'cucina',            'Cucina',           210,
      { macchina: 'cucina', liv: 25, cresce: RINCARO, la: true }),

    // L'albero nuovo: cinque botteghe in più — vedi docs/fattoria/macchine.md.
    V('zuccherificio', 'zuccherificio',     'Zuccherificio',    230,
      { macchina: 'zuccherificio', liv: 31, cresce: RINCARO }),
    V('gelateria',     'gelateria',         'Gelateria',        240,
      { macchina: 'gelateria', liv: 34, cresce: RINCARO, la: true }),
    V('pastificio',    'pastificio',        'Pastificio',       260,
      { macchina: 'pastificio', liv: 37, cresce: RINCARO }),
    V('friggitoria',   'friggitoria',       'Friggitoria',      300,
      { macchina: 'friggitoria', liv: 58, cresce: RINCARO, la: true }),
    V('sushi_bar',     'sushi_bar',         'Sushi bar',        340,
      { macchina: 'sushi_bar', liv: 62, cresce: RINCARO }),

    // Le botteghe del paese: chiedono da un elenco chiuso — vedi docs/fattoria/chi-chiede.md.
    V('pasticceria',   'pasticceria',       'Pasticceria',      180,
      { liv: 21, unico: true, la: true, posto: {
        chiede: ['torta', 'burro', 'uova', 'latte', 'merenda', 'crostata',
                 'biscotti', 'gelato', 'frullato', 'marmellata', 'caramelle'],
        clienti: ['pasticcera', 'maestra'] } }),
    V('osteria',       'rosticceria',       'Osteria',          220,
      { liv: 29, unico: true, la: true, posto: {
        chiede: ['pane', 'formaggio', 'minestrone', 'polenta', 'tartufi', 'salsa',
                 'conserva', 'pasta', 'pizza', 'lasagne', 'patatine', 'fritto',
                 'arancini', 'sushi', 'maki'],
        clienti: ['oste', 'cuoco', 'pizzaiolo', 'sushi'] } }),
    V('mensa',         'mensa',             'Mensa della scuola', 200,
      { liv: 36, unico: true, la: true, posto: {
        chiede: ['pane', 'succo', 'latte', 'carote', 'fragole', 'minestrone',
                 'pasta', 'biscotti', 'frullato', 'gelato'],
        clienti: ['maestra', 'bidello'] } }),
    V('merceria',      'merceria',          'Merceria',         240,
      { liv: 43, unico: true, la: true, posto: {
        chiede: ['lana', 'stoffa', 'maglione', 'maglione_lavanda', 'sciarpa_lana',
                 'berretto', 'sacchetto', 'sapone'],
        clienti: ['sarta', 'lavandaia'] } }),

    // Il cortile: fienile e cinque recinti, in fila dopo i campi — vedi docs/fattoria/macchine.md.

    // Il fienile: era una decorazione — vedi docs/fattoria/catena.md.
    V('fienile',       'fienile0',          'Fienile',         150,
      { macchina: 'fienile', liv: 6, cresce: RINCARO }),
    V('conigliera',    'recinto_conigli_calmo', 'Conigliera',    95,
      { macchina: 'conigliera', stati: RECINTO('conigli'), piede: [4, 3], liv: 7, cresce: RINCARO,
        la: true }),
    V('pollaio',       'recinto_galline_calmo', 'Pollaio',      130,
      { macchina: 'pollaio', stati: RECINTO('galline'), piede: [4, 3], liv: 9, cresce: RINCARO }),
    V('ovile',         'recinto_pecore_calmo',  'Ovile',        190,
      { macchina: 'ovile', stati: RECINTO('pecore'), piede: [4, 3], liv: 14, cresce: RINCARO }),
    V('stalla',        'recinto_mucche_calmo',  'Stalla',       220,
      { macchina: 'stalla', stati: RECINTO('mucche'), piede: [4, 3], liv: 18, cresce: RINCARO,
        la: true }),
    V('porcile',       'recinto_maiali_calmo',  'Porcile',      260,
      { macchina: 'porcile', stati: RECINTO('maiali'), piede: [4, 3], liv: 28, cresce: RINCARO }),

    // Le cinque bocche dell'orto — vedi docs/fattoria/macchine.md e coltivazioni.js.
    V('stagno_anatre', 'recinto_anatre_calmo',  'Stagno delle anatre', 240,
      { macchina: 'anatre', stati: RECINTO('anatre'), piede: [4, 3], liv: 24, cresce: RINCARO }),
    V('recinto_capre', 'recinto_capre_calmo',   'Recinto delle capre', 280,
      { macchina: 'capre', stati: RECINTO('capre'), piede: [4, 3], liv: 40, cresce: RINCARO }),
    // Arnie e non apiario: l'apiario è già la decorazione qui sotto.
    V('arnie',         'recinto_api_calmo',     'Arnie',               300,
      { macchina: 'arnie', stati: RECINTO('api'), piede: [4, 3], liv: 45, cresce: RINCARO,
        la: true, plurale: true }),
    V('recinto_alpaca', 'recinto_alpaca_calmo', 'Recinto degli alpaca', 330,
      { macchina: 'alpaca', stati: RECINTO('alpaca'), piede: [4, 3], liv: 47, cresce: RINCARO }),
    V('recinto_asini', 'recinto_asini_calmo',   'Recinto degli asini', 355,
      { macchina: 'asini', stati: RECINTO('asini'), piede: [4, 3], liv: 52, cresce: RINCARO }),

    // La peschiera: il settimo recinto, senza foglio ancora (aspetta) — vedi docs/fattoria/da-fare.md.
    V('peschiera',      'recinto_anatre_calmo', 'Peschiera',      360,
      { macchina: 'pesci', stati: RECINTO('anatre'),
        piede: [4, 3], liv: 57, cresce: RINCARO, la: true, aspetta: 'recinto_pesci_calmo' }),
  ] },


  // Le bestioline: attorno agli animali, non nel cortile (che dev'essere leggibile in un colpo).
  { chiave: 'bestiole', zona: 'bello', nome: 'Bestioline', icona: '🐰', voci: [
    V('cuccia',        'cuccia0',           'Cuccia',            20),
    V('cuccia_grande', 'cuccia_grande',     'Cuccia grande',     28),
    V('casetta_uccelli', 'casetta_uccelli_tetto_rosso', 'Nido rosso',        14),
    V('casetta_uccelli2', 'casetta_uccelli_tetto_verde', 'Nido verde',        14),
    V('vasca_uccelli', 'vasca_uccelli',     'Vaschetta',         12),
    V('ciotola',       'ciotola0',          'Ciotola',            4),
    V('apiario',       'apiario',           'Apiario',           30),
    V('alveare',       'alveare',           'Alveare',           16),
    V('coniglietto',   'coniglio0',         'Coniglietto',        8),
    V('gattino',       'gatto0',            'Gattino',            8),
    V('cucciolo',      'cane_cucciolo0',    'Cucciolo',           9),
    V('pulcino',       'pulcino0',          'Pulcino',            6),
    V('uccellino',     'uccellino_verde',   'Uccellino',          5),
    V('tartarughe',    'tartarughe',        'Tartarughe',        10),
    V('farfalla',      'farfalla0',         'Farfalla',           3),
    V('farfalle',      'farfalle0',         'Farfalle',           4),
    V('coccinella',    'coccinella0',       'Coccinella',         3),
  ] },

  // Laghetti da giardino: non è l'acqua vera, che si dipinge (motore/fattoria.js, dati/terreni.js).
  { chiave: 'acqua', zona: 'bello', nome: 'Acqua', icona: '💧', voci: [
    /* la fontana è animata: i fotogrammi girano da soli */
    V('fontana',       'fontana0',          'Fontana',           60,
      { anima: ['fontana0', 'fontana1', 'fontana2'] }),
    V('fontana_grande', 'fontana_grande0',  'Fontana grande',    85,
      { anima: ['fontana_grande0', 'fontana_grande1',
                'fontana_grande2', 'fontana_grande3'] }),
    V('cantina',       'pozzo',             'Cantina',           40),
    V('pozzo',         'pozzo_giardino0',   'Pozzo',             45),
    V('pozzo_coperto', 'pozzo_coperto',     'Pozzo coperto',     50),
    V('mulino_acqua',  'mulino_acqua',      'Mulino ad acqua',  120),
    V('laghetto',      'laghetto0',         'Laghetto',          26, { sotto: true }),
    V('stagno',        'stagno',            'Stagno',            30, { sotto: true }),
    V('ninfee',        'ninfea_grande0',    'Ninfee',             5, { sotto: true }),
    V('ninfee_piccole', 'ninfee',           'Ninfee piccole',     4, { sotto: true }),
    V('canne',         'canna_palude0',     'Canne di palude',    5),
    V('ponte',         'ponte',             'Ponte',             30),
  ] },

  { chiave: 'recinti', zona: 'bello', nome: 'Recinti', icona: '🚧', voci: [
    V('staccio',       'staccionata',       'Staccionata',        6, { vedute: [
      { pezzo: 'staccionata', piede: [2, 1] },     // sdraiata
      { pezzo: 'palo',        piede: [1, 2] },     // in piedi
    ] }),
    V('recinto',       'recinto',           'Recinto',            8),
    // Il cancello si compone col dito insieme al recinto.
    V('cancello',      'cancello',          'Cancello',          12),
    V('ringhiera',     'ringhiera',         'Ringhiera',          9),
    V('colonna',       'colonna',           'Colonna',           11),
    V('pergola',       'pergola_bianca',    'Pergola',           40),
    V('pergola_fiorita', 'pergola_fiorita', 'Pergola fiorita',   45),
    V('gazebo',        'gazebo',            'Gazebo',            70),
    V('gazebo_cena',   'gazebo_cena',       'Gazebo con tavolo', 95),
    V('cartello',      'cartello',          'Cartello',          10),
    V('insegna',       'insegna',           'Insegna',           14),
    // I cinque cartelli del foglio dei campi: legno piantato per terra, non terra lavorata.
    V('cartello_grano', 'cartello_grano',   'Cartello grano',     6),
    V('cartello_mais', 'cartello_mais',     'Cartello mais',      6),
    V('cartello_carote', 'cartello_carote', 'Cartello carote',    6),
    V('cartello_zucche', 'cartello_zucche', 'Cartello zucche',    6),
    V('cartello_erba', 'cartello_erba',     'Cartello erba',      6),
    // E gli otto dell'orto: un cartello non è il permesso di seminare, è legno.
    V('cartello_pomodori', 'cartello_pomodori', 'Cartello pomodori', 6),
    V('cartello_patate', 'cartello_patate',   'Cartello patate',    6),
    V('cartello_fragole', 'cartello_fragole', 'Cartello fragole',   6),
    V('cartello_melanzane', 'cartello_melanzane', 'Cartello melanzane', 6),
    V('cartello_peperoni', 'cartello_peperoni', 'Cartello peperoni', 6),
    V('cartello_cavolfiori', 'cartello_cavolfiori', 'Cartello cavoli', 6),
    V('cartello_cipolle', 'cartello_cipolle', 'Cartello cipolle',   6),
    V('cartello_aglio', 'cartello_aglio',     'Cartello aglio',     6),
    // Bandiera animata: quattro fotogrammi con lo stesso palo fermo (misurati sul foglio).
    V('bandiera',      'bandiera0',         'Bandiera',          10, {
      anima: ['bandiera0', 'bandiera1', 'bandiera2', 'bandiera_tesa'] }),
    V('stendardo',     'bandiera_stemma',   'Stendardo',         10),
  ] },

  { chiave: 'case', zona: 'bello', nome: 'Case', icona: '🏚️', voci: [
    // una voce sola che si gira: davanti la porta, dietro il muro cieco
    V('casa',          'casa',              'Casa',             120, { vedute: [
      { pezzo: 'casa',       piede: [5, 2] },     // il davanti, con la porta
      { pezzo: 'casa_retro', piede: [5, 2] },     // il dietro
    ] }),
    V('casetta',       'casetta',           'Casetta',           55),
    V('casetta_lunga', 'casetta_tetto_lungo', 'Casa lunga',        70),
    V('casa_veranda',  'casetta_con_veranda', 'Casa e veranda',    90),
    V('casa_albero',   'casa_albero',       'Casa sull\'albero', 110),
    V('fienile_rosso', 'fienile_rosso',     'Fienile rosso',    160),
    V('fienile_blu',   'fienile_tetto_blu', 'Fienile blu',      140),
    V('torretta',      'torre_rotonda',     'Torretta',         100),
    V('forno',         'forno_legna',       'Forno a legna',     75),
    V('forno_pizza',   'forno_pizza',       'Forno a cupola',    85),
    V('chiosco_rosa',  'dehors_rosa',       'Chiosco rosa',      80),
    V('chiosco_azzurro', 'dehors_azzurro',  'Chiosco azzurro',   80),
    // Il mercato era qui: sta con la catena, qualche riga più su.
    V('casotta',       'pollaio',           'Casotta',           60),
    V('serra',         'serra',             'Serra',             90),
    V('tettoia_fieno', 'tettoia_fieno',     'Tettoia',           45),
    V('capanno',       'stalla',            'Capanno',           95),
    V('lampione',      'lampione0',         'Lampione',          18),
    V('lampione_cesto', 'lampione_cesto',   'Lampione fiorito',  26),
    V('lanterna',      'lanterna_muro',     'Lanterna',          10),
  ] },

  { chiave: 'arredo', zona: 'bello', nome: 'Arredo', icona: '🪑', voci: [
    V('panchina',      'panchina',          'Panchina',          14),
    V('panchina2',     'panchina2',         'Panchina 2',        14),
    V('panchina_legno', 'panchina_legno',   'Panchina di legno', 12),
    V('panchina_bianca', 'panchina_bianca', 'Panchina bianca',   16),
    V('panchina_cuore', 'panchina_cuore',   'Panchina a cuore',  18),
    V('sedia',         'sedia0',            'Sedia',              6),
    V('sdraio',        'sdraio',            'Sdraio',            12),
    V('amaca',         'amaca',             'Amaca',             22),
    V('altalena',      'altalena',          'Altalena',          30),
    V('altalena_pergola', 'altalena_pergola', 'Dondolo',           45),
    V('tavolo',        'tavolo',            'Tavolino',           9),
    V('tavolino',      'tavolino_bevande',  'Tavolino da tè',     9),
    V('bancone',       'bancone',           'Bancone',           16),
    V('cassa',         'cassa',             'Cassa',              7),
    V('cassa_grande',  'cassa_grande0',     'Cassa grande',       9),
    V('barile',        'barile',            'Barile',             7),
    V('barile2',       'barile2',           'Barile fiorito',     9),
    V('barilotto',     'barile_legno0',     'Barilotto',          6),
    V('sacco',         'sacco',             'Sacco',              5),
    V('sacco_iuta',    'sacco_iuta',        'Sacco di iuta',      6),
    V('posta',         'cassetta_posta0',   'Posta',             10),
    V('specchio',      'specchio_giardino', 'Specchio',           9),
    V('campanelle',    'campanelle_vento',  'Campanelle',         8),
    V('girandola',     'mulino_vento_giocattolo0', 'Girandola',   7, {
      anima: ['mulino_vento_giocattolo0', 'mulino_vento_giocattolo1',
              'mulino_vento_giocattolo2'] }),
    V('mulinello',     'mulino_giardino0',  'Mulinello',         20, {
      anima: ['mulino_giardino0', 'mulino_giardino1', 'mulino_giardino2'] }),
    V('palloncini',    'palloncini',        'Palloncini',        12),
    V('festone',       'festone_bandierine', 'Festone',          10),
    V('lucine',        'filo_lucine',       'Filo di lucine',    14),
    V('paiolo',        'calderone0',        'Paiolo',             8, {
      anima: ['calderone0', 'calderone1'] }),
  ] },

  // Le feste: stagione: è una chiave di FINESTRE — vedi docs/fattoria/stagioni.md.
  { chiave: 'feste', zona: 'bello', nome: 'Feste', icona: '🎉', stagionale: true, voci: [
    V('zucche_halloween', 'campo_zucche6',  'Zucche di Halloween', 9,
      { sotto: true, piede: [2, 2], stagione: 'halloween' }),
    V('teschio',       'teschio',           'Teschio',            6, { stagione: 'halloween' }),
    V('albero_natale', 'albero_verde',      'Albero con le lucine', 24,
      { stagione: 'natale', luci: true }),
  ] },

  // La fiera: non si compra, si vince (fiera: true) — vedi docs/fattoria/chi-chiede.md.
  { chiave: 'fiera', zona: 'bello', nome: 'La fiera', icona: '🎪', fiera: true, voci: [
    V('fiera_bandierine', 'fiera_bandierine', 'Bandierine della fiera', 30,
      { fiera: true }),
    V('fiera_giostra', 'fiera_giostra',     'Giostrina',          30,
      { fiera: true, la: true }),
    V('fiera_zucchero_filato', 'fiera_zucchero_filato', 'Zucchero filato', 30,
      { fiera: true }),
    V('fiera_lanterne', 'fiera_lanterne',   'Lanterne di carta',  30,
      { fiera: true, plurale: true, la: true }),
    V('fiera_barattoli', 'fiera_barattoli', 'Tiro al barattolo',  30,
      { fiera: true }),
    V('fiera_girasole', 'fiera_girasole',   'Girasole di legno',  30,
      { fiera: true }),
    V('fiera_spaventapasseri', 'fiera_spaventapasseri', 'Spaventapasseri in festa', 30,
      { fiera: true }),
    V('fiera_palco',   'fiera_palco',       'Palco della banda',  30,
      { fiera: true }),
  ] },

  // Quello che viene dai campi e si mette in giro.
  { chiave: 'raccolto', zona: 'bello', nome: 'Raccolto', icona: '🥕', voci: [
    V('spaventapasseri', 'spaventapasseri', 'Spaventapasseri',   24),
    V('balla_tonda',   'balla_fieno_tonda', 'Balla di fieno',     7),
    V('balla_quadra',  'balla_fieno_quadrata0', 'Balla quadrata', 7),
    V('balle_fieno',   'balle_fieno_gruppo', 'Balle di fieno',   12),
    V('covone',        'pagliaio0',         'Covone',             6),
    V('cassetta0',     'cassetta0',         'Cassetta gialla',    8),
    V('cassetta1',     'cassetta1',         'Cassetta verde',     8),
    V('cassetta2',     'cassetta2',         'Cassetta rossa',     8),
    V('cassetta3',     'cassetta3',         'Cassetta mais',      8),
    V('raccolto_grano', 'raccolto_grano',   'Cassa di grano',     9),
    V('raccolto_mais', 'raccolto_mais',     'Cassa di mais',      9),
    V('raccolto_carote', 'raccolto_carote', 'Cassa di carote',    9),
    V('raccolto_zucche', 'raccolto_zucche', 'Cassa di zucche',    9),
    V('raccolto_erba', 'raccolto_erba',     'Cassa di erba',      9),
    // Le otto casse dell'orto: costano 9 come le altre, perché si compra la cassa e non il raccolto.
    V('raccolto_patate', 'raccolto_patate', 'Cassa di patate',    9),
    V('raccolto_cavolfiori', 'raccolto_cavolfiori', 'Cassa di cavoli', 9),
    V('raccolto_pomodori', 'raccolto_pomodori', 'Cassa di pomodori', 9),
    V('raccolto_melanzane', 'raccolto_melanzane', 'Cassa di melanzane', 9),
    V('raccolto_peperoni', 'raccolto_peperoni', 'Cassa di peperoni', 9),
    V('raccolto_cipolle', 'raccolto_cipolle', 'Cassa di cipolle',  9),
    V('raccolto_aglio',  'raccolto_aglio',    'Cassa di aglio',    9),
    V('raccolto_fragole', 'raccolto_fragole', 'Cassa di fragole',  9),
    V('cassetta_fragole', 'cassetta_fragole', 'Fragole',            9),
    V('cassetta_raccolto', 'cassetta_raccolto', 'Cassetta piena',     8),
    V('cesta_pomodori', 'cesta_pomodori',   'Cesta di pomodori',  9),
    V('cesta_verdure', 'cesta_verdure',     'Cesta di verdure',   9),
    V('cesto_agrumi',  'cesto_agrumi',      'Cesto di agrumi',    9),
    V('cesto_mele',    'cesto_mele',        'Cesto di mele',      9),
    V('cassa_mele',    'cassa_mele',        'Cassa di mele',      8),
    V('barile_mele',   'barile_mele',       'Barile di mele',     9),
    V('barile_frutta', 'barile_frutta',     'Barile di frutta',   9),
    V('cesta_picnic',  'cesta_picnic',      'Cesta da picnic',   14),
    V('pane',          'pane',              'Pane',               5),
    V('panino',        'panino',            'Panino',             4),
    V('torta',         'torta0',            'Torta',              8),
    V('crostatina',    'crostatina',        'Crostatina',         6),
    V('marmellata',    'marmellata0',       'Marmellata',         5),
    V('latte',         'latte',             'Bottiglia',          5),
    V('vasetto',       'vasetto_legno',     'Vasetto',            4),
  ] },
]

// Le tre metà del baule (lavoro/decorazioni/animali): vive qui perché sono anche i tre tondi in alto.
export const ANIMALI_ZONA = 'animali'
export const ZONE = [
  { chiave: 'lavoro', nome: 'La fattoria', icona: '🌾' },
  { chiave: 'bello', nome: 'Decorazioni', icona: '🌸' },
  { chiave: ANIMALI_ZONA, nome: 'Animali', icona: '🐕' },
]

export const CATALOGO = CATEGORIE.flatMap(c => c.voci)
export const PER_ID = Object.fromEntries(CATALOGO.map(v => [v.id, v]))

// Da un nome di pezzo alla voce che lo contiene (il catalogo cita i pezzi, non i gruppi).
const VOCE_DEL_PEZZO = {}
for (const v of VOCI)
  for (const fotogrammi of Object.values(v.pose || {}))
    for (const nome of fotogrammi) VOCE_DEL_PEZZO[nome] = v

// Un pezzo che l'atlante non conosce non gira e non si specchia.
const quartiDelPezzo = nome => (VOCE_DEL_PEZZO[nome] || {}).giri || 1
const specchioDelPezzo = nome => (VOCE_DEL_PEZZO[nome] || {}).specchia !== false
const ribaltaDelPezzo = nome => (VOCE_DEL_PEZZO[nome] || {}).ribalta !== false

// giri e ribalta sono due domande indipendenti — vedi docs/fattoria/come-si-tocca.md.
function giriPossibili(v) {
  const q = v.quarti != null ? v.quarti : quartiDelPezzo(v.pezzo)
  if (q !== 4) return [0]
  const ribalta = v.ribalta != null ? v.ribalta : ribaltaDelPezzo(v.pezzo)
  return ribalta ? [0, 1, 2, 3] : [0, 1]
}

// vedute vale quante ne ha (girare cambia disegno); altrimenti quanti giri regge il disegno.
export function quantiVersi(v) {
  if (!v) return 1
  return v.vedute ? v.vedute.length : giriPossibili(v).length
}

export const puoGirare = v => quantiVersi(v) > 1
export const puoSpecchiare = v =>
  !!v && (v.specchio != null ? v.specchio : specchioDelPezzo(v.pezzo))

// Regge un id sconosciuto (un salvataggio di ieri) senza esplodere.
export const versoDi = cosa => (cosa && cosa.g) || 0

// Piede, giro e specchio insieme: lo specchio non cambia l'ingombro, il giro dispari sì.
export function assettoDi(cosa, v = PER_ID[cosa && cosa.id]) {
  if (!v) return { pezzo: null, piede: [1, 1], giro: 0, specchio: false }
  const specchio = puoSpecchiare(v) && !!(cosa && cosa.m)
  if (v.vedute) {
    const q = v.vedute[versoDi(cosa) % v.vedute.length]
    return { pezzo: q.pezzo, piede: q.piede, giro: 0, specchio }
  }
  // g è quale verso, non quanti quarti: un modulo sbagliato metterebbe la siepe a gambe per aria.
  const possibili = giriPossibili(v)
  const giro = possibili[versoDi(cosa) % possibili.length]
  const [largo, profondo] = v.piede
  return {
    pezzo: v.pezzo,
    piede: giro % 2 ? [profondo, largo] : [largo, profondo],
    giro,
    specchio,
  }
}

export const piedeDi = (cosa, v = PER_ID[cosa && cosa.id]) => assettoDi(cosa, v).piede
export const pezzoDi = (cosa, v = PER_ID[cosa && cosa.id]) => assettoDi(cosa, v).pezzo

// La voce che è quella macchina, per nominarla ("nel mulino") partendo da una ricetta.
export const laMacchina = quale => CATALOGO.find(v => v.macchina === quale) || null

// Le quattro domande che dicono se una cosa in mappa lavora.
export const eCampo = cosa => !!(cosa && (PER_ID[cosa.id] || {}).campo)
export const macchinaDi = cosa => (PER_ID[cosa && cosa.id] || {}).macchina || null
// Il silo dice quale dei due è: la stessa parola che i prodotti si scrivono addosso.
export const siloDi = cosa => (PER_ID[cosa && cosa.id] || {}).silo || null
export const eSilo = cosa => !!siloDi(cosa)

// Il carretto: non è una macchina né un silo, la terza cosa che apre un foglio.
export const eVicino = cosa => !!(PER_ID[cosa && cosa.id] || {}).vicino

// La bancarella: come il carretto, ma chiede invece di prendere.
export const eMercato = cosa => !!(PER_ID[cosa && cosa.id] || {}).mercato
// La mongolfiera: la terza cosa che chiede.
export const eMongolfiera = cosa => !!(PER_ID[cosa && cosa.id] || {}).mongolfiera
// Una bottega del paese: torna il posto (non un sì/no), perché chi tocca vuole sapere cosa chiede.
export const postoDi = cosa => (PER_ID[cosa && cosa.id] || {}).posto || null
export const statiDi = cosa => (PER_ID[cosa && cosa.id] || {}).stati || null

// Si parte da zero: una fattoria arredata regalava cose mai comprate, in un gioco che è spendere.
export const PARTENZA = []

export function guastiDelCatalogo() {
  const g = []
  const visti = new Set()
  for (const v of CATALOGO) {
    if (visti.has(v.id)) g.push(`id doppio nel catalogo: ${v.id}`)
    visti.add(v.id)
    if (!PEZZI[v.pezzo]) g.push(`${v.id}: la tessera «${v.pezzo}» non è nell'atlante`)
    // Una voce che aspetta il suo disegno va aggiornata il giorno che il pezzo c'è.
    if (v.aspetta && PEZZI[v.aspetta])
      g.push(`${v.id}: aspetta «${v.aspetta}», che nell'atlante c'è già — scrivilo come pezzo`)
    // La seconda faccia della mongolfiera (partita) vale come la prima.
    if (v.partita) {
      if (!PEZZI[v.partita.pezzo])
        g.push(`${v.id}: la faccia «partita» (${v.partita.pezzo}) non è nell'atlante`)
      if (v.partita.aspetta && PEZZI[v.partita.aspetta])
        g.push(`${v.id}: aspetta «${v.partita.aspetta}», che nell'atlante c'è già — scrivilo come pezzo`)
    }
    if (!(v.prezzo > 0)) g.push(`${v.id}: prezzo impossibile`)
    if (!Array.isArray(v.piede) || v.piede.length !== 2 || v.piede.some(n => n < 1))
      g.push(`${v.id}: piede impossibile`)
    for (const nome of v.anima || [])
      if (!PEZZI[nome]) g.push(`${v.id}: il fotogramma «${nome}» non è nell'atlante`)
    for (const veduta of v.vedute || []) {
      if (!PEZZI[veduta.pezzo]) g.push(`${v.id}: la veduta «${veduta.pezzo}» non è nell'atlante`)
      if (!Array.isArray(veduta.piede) || veduta.piede.length !== 2)
        g.push(`${v.id}: una veduta senza piede`)
    }
    if (v.vedute && v.vedute.length < 2)
      g.push(`${v.id}: una veduta sola non è un giro — meglio niente tasto`)
    // giri era il nome di vedute: nell'atlante generato vuol dire altro (quanti quarti regge).
    if (v.giri != null)
      g.push(`${v.id}: «giri» adesso si chiama «vedute» (e nell'atlante vuol dire altro)`)
    // Un piede dichiarato a mano può sbagliare la profondità dopo lo scambio del giro.
    if (puoGirare(v) && !v.vedute && (v.piede[0] < 1 || v.piede[1] < 1))
      g.push(`${v.id}: gira, e il suo piede non regge lo scambio`)
    // Un campo va sotto, se no non ci si cammina sopra.
    if (v.campo && !v.sotto)
      g.push(`${v.id}: un campo va sotto, se no non ci si cammina sopra`)
    // Una macchina senza ricette è un tasto rotto.
    if (v.macchina && !ricetteDi(v.macchina).length)
      g.push(`${v.id}: la macchina «${v.macchina}» non ha nessuna ricetta`)
    // Uno stato che l'atlante non ha è muto: il recinto sparisce in certi momenti senza errore.
    for (const [quale, nome] of Object.entries(v.stati || {}))
      if (!PEZZI[nome]) g.push(`${v.id}: lo stato «${quale}» non è nell'atlante`)
    if (v.stati && !v.macchina)
      g.push(`${v.id}: ha degli stati e non è una macchina — non li vedrebbe nessuno`)
    // Un ritratto che non è fra gli stati: in baule si compra una cosa, in mappa ne compare un'altra.
    if (v.stati && !Object.values(v.stati).includes(v.pezzo))
      g.push(`${v.id}: il ritratto «${v.pezzo}» non è fra i suoi stati`)
    if (v.stagione && !FINESTRE[v.stagione])
      g.push(`${v.id}: la stagione «${v.stagione}» non è in FINESTRE`)
  }
  const cat = new Set()
  for (const c of CATEGORIE) {
    if (cat.has(c.chiave)) g.push(`categoria doppia: ${c.chiave}`)
    cat.add(c.chiave)
    if (!c.voci.length) g.push(`categoria vuota: ${c.chiave}`)
    // Una linguetta stagionale tiene solo voci stagionali e viceversa.
    for (const v of c.voci)
      if (!!v.stagione !== !!c.stagionale)
        g.push(`${v.id}: ${v.stagione ? 'è stagionale' : 'non è stagionale'} e sta in «${c.chiave}»`)
    // Stessa regola per la fiera.
    for (const v of c.voci)
      if (!!v.fiera !== !!c.fiera)
        g.push(`${v.id}: ${v.fiera ? 'è della fiera' : 'non è della fiera'} e sta in «${c.chiave}»`)
    if (c.fiera && c.stagionale) g.push(`${c.chiave}: fiera e stagionale insieme`)
  }
  // 'animali' è una linguetta che viste/Roba.vue aggiunge da sé: una categoria omonima la coprirebbe.
  if (cat.has('animali'))
    g.push('la categoria «animali» è già una metà del baule')
  for (const p of PARTENZA)
    if (!PER_ID[p.id]) g.push(`la fattoria di partenza cita «${p.id}», che non è in catalogo`)
  // I due silos si citano a vicenda: un legame storto lascerebbe roba senza silo, o un silo inutile.
  for (const [fam, si] of Object.entries(SILI)) {
    const v = PER_ID[si.cosa]
    if (!v) g.push(`il silo «${fam}» cita «${si.cosa}», che non è in catalogo`)
    else if (v.silo !== fam) g.push(`${si.cosa}: dice di essere il silo «${v.silo}», non «${fam}»`)
  }
  for (const v of CATALOGO)
    if (v.silo && !SILI[v.silo]) g.push(`${v.id}: è il silo «${v.silo}», che non esiste`)
  return g
}
