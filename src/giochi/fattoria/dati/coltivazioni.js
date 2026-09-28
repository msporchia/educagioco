/* Dato puro sulla catena della fattoria: colture, ricette, merci, silos. Le regole stanno in
   motore/fattoria.js. Vedi docs/fattoria/catena.md, campi-e-silos.md e regole.md. */

import { PEZZI } from './atlante.js'

// Un minuto in millisecondi: i tempi qui sotto sono in minuti veri.
export const MINUTO = 60000

// Il rosso è dei campi, il bianco è degli animali, la dispensa è delle botteghe (silo: …).
// pezzo è la faccia in dati/atlante.js, aspetta quella che arriverà — vedi docs/fattoria/sprite.md.
export const PRODOTTI = {
  // dai campi — il silo del raccolto
  grano:   { nome: 'Grano',   emoji: '🌾', silo: 'terra', pezzo: 'raccolto_grano' },
  mais:    { nome: 'Mais',    emoji: '🌽', silo: 'terra', pezzo: 'raccolto_mais' },
  carote:  { nome: 'Carote',  emoji: '🥕', silo: 'terra', pezzo: 'raccolto_carote' },
  zucche:  { nome: 'Zucche',  emoji: '🎃', silo: 'terra', pezzo: 'raccolto_zucche' },
  fieno:   { nome: 'Fieno',   emoji: '🌿', silo: 'terra', pezzo: 'raccolto_erba' },
  patate:     { nome: 'Patate',     emoji: '🥔', silo: 'terra', pezzo: 'raccolto_patate' },
  cavolfiori: { nome: 'Cavolfiori', emoji: '🥦', silo: 'terra', pezzo: 'raccolto_cavolfiori' },
  pomodori:   { nome: 'Pomodori',   emoji: '🍅', silo: 'terra', pezzo: 'raccolto_pomodori' },
  melanzane:  { nome: 'Melanzane',  emoji: '🍆', silo: 'terra', pezzo: 'raccolto_melanzane' },
  peperoni:   { nome: 'Peperoni',   emoji: '🫑', silo: 'terra', pezzo: 'raccolto_peperoni' },
  cipolle:    { nome: 'Cipolle',    emoji: '🧅', silo: 'terra', pezzo: 'raccolto_cipolle' },
  aglio:      { nome: 'Aglio',      emoji: '🧄', silo: 'terra', pezzo: 'raccolto_aglio' },
  fragole:    { nome: 'Fragole',    emoji: '🍓', silo: 'terra', pezzo: 'raccolto_fragole' },
  lavanda:    { nome: 'Lavanda',    emoji: '💐', silo: 'terra', pezzo: 'raccolto_lavanda' },
  barbabietola: { nome: 'Barbabietola', emoji: '🍠', silo: 'terra', pezzo: 'raccolto_barbabietola' },
  riso:         { nome: 'Riso',         emoji: '🍚', silo: 'terra', pezzo: 'raccolto_riso' },
  // mangime:true è il cibo delle bestie (recinto o ciotola): la mongolfiera non lo chiede.
  becchime: { nome: 'Becchime', emoji: '🌰', silo: 'stalla', mangime: true, pezzo: 'merce_becchime' },
  foraggio: { nome: 'Foraggio', emoji: '🥬', silo: 'stalla', mangime: true, pezzo: 'balla_fieno_tonda' },
  zuppa:    { nome: 'Zuppa',    emoji: '🥘', silo: 'stalla', mangime: true, pezzo: 'merce_zuppa' },
  beverone: { nome: 'Beverone', emoji: '🪣', silo: 'stalla', mangime: true, pezzo: 'cassetta_raccolto' },
  pastura:  { nome: 'Pastura',  emoji: '🍃', silo: 'stalla', mangime: true, pezzo: 'cesta_verdure' },
  fiori:    { nome: 'Fiori',    emoji: '🌼', silo: 'stalla', mangime: true, pezzo: 'cesto_fiori_misti0' },
  // quello che mangiano il cane e il gatto di casa: esce dal mulino
  mangime: { nome: 'Mangime', emoji: '🥣', silo: 'stalla', mangime: true, pezzo: 'merce_mangime' },
  pastone: { nome: 'Pastone', emoji: '🍲', silo: 'stalla', mangime: true, pezzo: 'merce_pastone' },
  merenda: { nome: 'Merenda', emoji: '🥧', silo: 'stalla', pezzo: 'cesta_picnic' },
  /* e quello che danno */
  uova:    { nome: 'Uova',    emoji: '🥚', silo: 'stalla', pezzo: 'merce_uova' },
  latte:   { nome: 'Latte',   emoji: '🥛', silo: 'stalla', pezzo: 'latte' },
  tartufi: { nome: 'Tartufi', emoji: '🍄', silo: 'stalla', pezzo: 'merce_tartufi' },
  lana:    { nome: 'Lana',    emoji: '🧶', silo: 'stalla', pezzo: 'merce_lana' },
  miele:   { nome: 'Miele',   emoji: '🍯', silo: 'stalla', pezzo: 'merce_miele' },
  pesce:   { nome: 'Pesce',   emoji: '🐟', silo: 'stalla', pezzo: 'merce_pesce' },
  concime: { nome: 'Concime', emoji: '💩', silo: 'stalla', pezzo: 'sacco' },

  // La dispensa (silo: 'bottega') tiene quello che esce dalle botteghe — vedi campi-e-silos.md e sprite.md.
  stoffa: { nome: 'Stoffa', emoji: '🧵', silo: 'bottega', pezzo: 'merce_stoffa' },
  farina: { nome: 'Farina', emoji: '🌾', silo: 'bottega', pezzo: 'merce_farina' },
  pane:   { nome: 'Pane',   emoji: '🍞', silo: 'bottega', pezzo: 'merce_pane' },
  // Era anche un addobbo sulla schiena, sospeso con gli altri (un'emoji di maglione non sta su una bestia).
  maglione: { nome: 'Maglione', emoji: '🧥', silo: 'bottega', pezzo: 'merce_maglione' },
  burro:     { nome: 'Burro',     emoji: '🧈', silo: 'bottega', pezzo: 'merce_burro' },
  formaggio: { nome: 'Formaggio', emoji: '🧀', silo: 'bottega', pezzo: 'merce_formaggio' },
  torta:     { nome: 'Torta',     emoji: '🎂', silo: 'bottega', pezzo: 'merce_torta' },
  tintura:   { nome: 'Tintura',   emoji: '🫙', silo: 'bottega', pezzo: 'merce_tintura' },
  maglione_lavanda: { nome: 'Maglione alla lavanda', emoji: '💜', silo: 'bottega',
                      pezzo: 'merce_maglione_lavanda' },
  sapone:    { nome: 'Sapone',    emoji: '🧼', silo: 'bottega', pezzo: 'merce_sapone' },

  minestrone: { nome: 'Minestrone', emoji: '🍜', silo: 'bottega', pezzo: 'merce_minestrone' },
  salsa:     { nome: 'Salsa',     emoji: '🥫', silo: 'bottega', pezzo: 'merce_salsa' },
  conserva:  { nome: 'Conserva d\'orto', emoji: '🥗', silo: 'bottega', pezzo: 'merce_conserva' },
  polenta:   { nome: 'Polenta',   emoji: '🍛', silo: 'bottega', pezzo: 'merce_polenta' },
  crostata:  { nome: 'Crostata',  emoji: '🍰', silo: 'bottega', pezzo: 'merce_crostata' },
  sacchetto: { nome: 'Sacchetto profumato', emoji: '👝', silo: 'bottega', pezzo: 'merce_sacchetto' },

  zucchero:   { nome: 'Zucchero',   emoji: '🧂', silo: 'bottega', pezzo: 'merce_zucchero' },
  caramelle:  { nome: 'Caramelle',  emoji: '🍬', silo: 'bottega', pezzo: 'merce_caramelle' },
  marmellata: { nome: 'Marmellata', emoji: '🫙', silo: 'bottega', pezzo: 'merce_marmellata' },
  succo:      { nome: 'Succo',      emoji: '🧃', silo: 'bottega', pezzo: 'merce_succo' },
  gelato:     { nome: 'Gelato',     emoji: '🍨', silo: 'bottega', pezzo: 'merce_gelato' },
  frullato:   { nome: 'Frullato',   emoji: '🥤', silo: 'bottega', pezzo: 'merce_frullato' },
  pasta:      { nome: 'Pasta',      emoji: '🍝', silo: 'bottega', pezzo: 'merce_pasta' },
  biscotti:   { nome: 'Biscotti',   emoji: '🍪', silo: 'bottega', pezzo: 'merce_biscotti' },
  pizza:      { nome: 'Pizza',      emoji: '🍕', silo: 'bottega', pezzo: 'merce_pizza' },
  lasagne:    { nome: 'Lasagne',    emoji: '🍱', silo: 'bottega', pezzo: 'merce_lasagne' },
  // sciarpa_lana e non sciarpa: sciarpa è già l'addobbo comprato (dati/addobbi.js, sospeso).
  sciarpa_lana: { nome: 'Sciarpa di lana', emoji: '🧣', silo: 'bottega',
                  pezzo: 'merce_sciarpa_lana' },
  berretto:   { nome: 'Berretto',   emoji: '🧢', silo: 'bottega', pezzo: 'merce_berretto' },
  patatine:   { nome: 'Patatine',   emoji: '🍟', silo: 'bottega', pezzo: 'merce_patatine' },
  fritto:     { nome: 'Fritto',     emoji: '🍤', silo: 'bottega', pezzo: 'merce_fritto' },
  arancini:   { nome: 'Arancini',   emoji: '🍙', silo: 'bottega', pezzo: 'merce_arancini' },
  sushi:      { nome: 'Sushi',      emoji: '🍣', silo: 'bottega', pezzo: 'merce_sushi' },
  maki:       { nome: 'Maki',       emoji: '🍥', silo: 'bottega', pezzo: 'merce_maki' },
}

// I sette stati di una coltura (i riquadri del foglio, in fila): il primo sono i semi per terra,
// non il campo vuoto (campo_vuoto nel catalogo) — vedi campi-e-silos.md.
const CRESCE = coltura => Array.from({ length: 7 }, (_, i) => `campo_${coltura}${i}`)

// semina/raccolta sono monete, minuti tempo vero, resa quanti prodotti — vedi unita/coltivazioni.
// liv è quando la coltura si sblocca; la bocca che la mangia arriva entro tre livelli, mai insieme.
export const COLTURE = [
  // L'erba medica non è cibo per nessuno: serve solo al fienile.
  {
    id: 'erba', liv: 13, nome: 'Erba medica', emoji: '🌿',
    semina: 0, raccolta: 1, minuti: 4, resa: 1, da: 'fieno',
    stadi: CRESCE('erba'),
  },
  {
    id: 'grano', liv: 1, nome: 'Grano', emoji: '🌾',
    semina: 0, raccolta: 1, minuti: 5, resa: 1, da: 'grano',
    stadi: CRESCE('grano'),
  },
  {
    id: 'carote', liv: 5, nome: 'Carote', emoji: '🥕',
    semina: 0, raccolta: 1, minuti: 6, resa: 1, da: 'carote',
    stadi: CRESCE('carote'),
  },
  {
    id: 'mais', liv: 11, nome: 'Mais', emoji: '🌽',
    semina: 0, raccolta: 2, minuti: 8, resa: 1, da: 'mais',
    stadi: CRESCE('mais'),
  },
  // La più lenta e la più cara: l'unica che i maiali cercano.
  {
    id: 'zucche', liv: 27, nome: 'Zucche', emoji: '🎃',
    semina: 0, raccolta: 2, minuti: 10, resa: 1, da: 'zucche',
    stadi: CRESCE('zucche'),
  },

  {
    id: 'patate', liv: 22, nome: 'Patate', emoji: '🥔',
    semina: 0, raccolta: 1, minuti: 7, resa: 1, da: 'patate',
    stadi: CRESCE('patate'),
  },
  {
    id: 'cavolfiori', liv: 22, nome: 'Cavolfiori', emoji: '🥦',
    semina: 0, raccolta: 1, minuti: 9, resa: 1, da: 'cavolfiori',
    stadi: CRESCE('cavolfiori'),
  },
  {
    id: 'pomodori', liv: 33, nome: 'Pomodori', emoji: '🍅',
    semina: 0, raccolta: 2, minuti: 8, resa: 1, da: 'pomodori',
    stadi: CRESCE('pomodori'),
  },
  {
    id: 'melanzane', liv: 39, nome: 'Melanzane', emoji: '🍆',
    semina: 0, raccolta: 2, minuti: 9, resa: 1, da: 'melanzane',
    stadi: CRESCE('melanzane'),
  },
  {
    id: 'peperoni', liv: 39, nome: 'Peperoni', emoji: '🫑',
    semina: 0, raccolta: 1, minuti: 7, resa: 1, da: 'peperoni',
    stadi: CRESCE('peperoni'),
  },
  {
    id: 'cipolle', liv: 44, nome: 'Cipolle', emoji: '🧅',
    semina: 0, raccolta: 1, minuti: 6, resa: 1, da: 'cipolle',
    stadi: CRESCE('cipolle'),
  },
  {
    id: 'aglio', liv: 44, nome: 'Aglio', emoji: '🧄',
    semina: 0, raccolta: 1, minuti: 12, resa: 1, da: 'aglio',
    stadi: CRESCE('aglio'),
  },
  {
    id: 'fragole', liv: 50, nome: 'Fragole', emoji: '🍓',
    semina: 0, raccolta: 1, minuti: 11, resa: 1, da: 'fragole',
    stadi: CRESCE('fragole'),
  },

  {
    id: 'lavanda', liv: 54, nome: 'Lavanda', emoji: '💐',
    semina: 0, raccolta: 1, minuti: 9, resa: 1, da: 'lavanda',
    stadi: CRESCE('lavanda'),
  },

  // Le due colture dell'albero nuovo: ognuna con la propria bottega ad aspettarla.
  {
    id: 'barbabietola', liv: 30, nome: 'Barbabietola', emoji: '🍠',
    semina: 0, raccolta: 1, minuti: 10, resa: 1, da: 'barbabietola',
    stadi: CRESCE('barbabietola'),
  },
  {
    id: 'riso', liv: 60, nome: 'Riso', emoji: '🍚',
    semina: 0, raccolta: 1, minuti: 12, resa: 1, da: 'riso',
    stadi: CRESCE('riso'),
  },
]

export const PER_COLTURA = Object.fromEntries(COLTURE.map(c => [c.id, c]))

// Una ricetta sta in una macchina (dove); senza quell'oggetto in mappa non si può fare.
// liv è quando compare (ripiego: il livello della macchina) — vedi docs/fattoria/catena.md e macchine.md.
export const RICETTE = [
  // il mulino: la ciotola di casa
  {
    id: 'mangime', nome: 'Mangime', emoji: '🥣', dove: 'mulino',
    prende: { grano: 2 }, costo: 1, minuti: 4, da: 'mangime', resa: 1,
  },
  // col mais, non col mulino: è la ricetta per cui esiste liv
  {
    id: 'pastone', nome: 'Pastone', emoji: '🍲', dove: 'mulino', liv: 11,
    prende: { mais: 3 }, costo: 1, minuti: 6, da: 'pastone', resa: 1,
  },

  // il fienile: il mangime del cortile
  {
    id: 'foraggio_carote', nome: 'Foraggio di carote', emoji: '🥬',
    dove: 'fienile', liv: 6,
    prende: { carote: 2 }, costo: 0, minuti: 5, da: 'foraggio', resa: 1,
  },
  {
    id: 'becchime', nome: 'Becchime', emoji: '🌰', dove: 'fienile', liv: 9,
    prende: { grano: 2 }, costo: 0, minuti: 4, da: 'becchime', resa: 1,
  },
  {
    id: 'foraggio', nome: 'Foraggio d\'erba', emoji: '🥬', dove: 'fienile', liv: 13,
    prende: { fieno: 2 }, costo: 0, minuti: 5, da: 'foraggio', resa: 1,
  },
  {
    id: 'zuppa', nome: 'Zuppa di zucca', emoji: '🥘', dove: 'pentolone', liv: 27,
    prende: { zucche: 2 }, costo: 0, minuti: 6, da: 'zuppa', resa: 1,
  },

  // i recinti: il mangime diventa roba
  {
    id: 'uova', nome: 'Uovo', emoji: '🥚', dove: 'pollaio',
    prende: { becchime: 2 }, costo: 1, minuti: 8, da: 'uova', resa: 1,
  },
  {
    id: 'latte', nome: 'Latte', emoji: '🥛', dove: 'stalla',
    prende: { foraggio: 2 }, costo: 1, minuti: 10, da: 'latte', resa: 1,
  },
  // L'ovile ne chiede uno solo: costa il doppio, chiede la metà.
  {
    id: 'lana', nome: 'Lana', emoji: '🧶', dove: 'ovile',
    prende: { foraggio: 1 }, costo: 1, minuti: 8, da: 'lana', resa: 1,
  },
  {
    id: 'lana_angora', nome: 'Lana d\'angora', emoji: '🧶', dove: 'conigliera',
    prende: { foraggio: 2 }, costo: 1, minuti: 14, da: 'lana', resa: 1,
  },
  {
    id: 'tartufi', nome: 'Tartufo', emoji: '🍄', dove: 'porcile',
    prende: { zuppa: 2 }, costo: 1, minuti: 20, da: 'tartufi', resa: 1,
  },

  // L'orto, e le cinque bocche nuove: ricette a due colture (mai una sola) — vedi catena.md.

  // il fienile dell'orto
  {
    id: 'beverone', nome: 'Beverone', emoji: '🪣', dove: 'pentolone', liv: 23,
    prende: { patate: 2, cavolfiori: 1 }, costo: 1, minuti: 4, da: 'beverone', resa: 1,
  },
  // La seconda strada per la zuppa dei maiali.
  {
    id: 'zuppa_orto', nome: 'Zuppa d\'orto', emoji: '🥘', dove: 'pentolone', liv: 33,
    prende: { pomodori: 2 }, costo: 0, minuti: 4, da: 'zuppa', resa: 1,
  },
  {
    id: 'pastura', nome: 'Pastura', emoji: '🍃', dove: 'pentolone', liv: 39,
    prende: { melanzane: 2, peperoni: 1 }, costo: 0, minuti: 5, da: 'pastura', resa: 1,
  },
  // Cipolle e aglio lasciati fiorire per le api, invece di raccoglierli.
  {
    id: 'fiorume', nome: 'Fiorume', emoji: '🌼', dove: 'fienile', liv: 44,
    prende: { cipolle: 1, aglio: 1 }, costo: 0, minuti: 4, da: 'fiori', resa: 1,
  },
  // L'unico anello che si chiude: il concime degli asini torna al prato — vedi catena.md.
  {
    id: 'fiorume_concime', nome: 'Prato fiorito', emoji: '🌼', dove: 'fienile', liv: 52,
    prende: { concime: 1, fieno: 1 }, costo: 0, minuti: 5, da: 'fiori', resa: 1,
  },

  // il panificio: la seconda pappa di casa
  {
    id: 'merenda', nome: 'Fragole al miele', emoji: '🥧', dove: 'panificio', liv: 50,
    prende: { fragole: 2, miele: 1 }, costo: 1, minuti: 6, da: 'merenda', resa: 1,
  },

  // i cinque recinti nuovi — le anatre fanno l'uovo con un campo in meno, non più a buon mercato.
  {
    id: 'uova_anatra', nome: 'Uova d\'anatra', emoji: '🥚', dove: 'anatre',
    prende: { beverone: 1 }, costo: 1, minuti: 6, da: 'uova', resa: 1,
  },
  // Le capre si accontentano di una pastura sola: più lente, ma meno spazio.
  {
    id: 'latte_capra', nome: 'Latte di capra', emoji: '🥛', dove: 'capre',
    prende: { pastura: 1 }, costo: 1, minuti: 12, da: 'latte', resa: 1,
  },
  {
    id: 'miele', nome: 'Miele', emoji: '🍯', dove: 'arnie',
    prende: { fiori: 2 }, costo: 1, minuti: 12, da: 'miele', resa: 1,
  },
  // Come l'ovile, ma più svelto: la stessa efficienza pagata prima.
  {
    id: 'lana_alpaca', nome: 'Lana d\'alpaca', emoji: '🧶', dove: 'alpaca',
    prende: { foraggio: 1 }, costo: 1, minuti: 5, da: 'lana', resa: 1,
  },
  {
    id: 'concime', nome: 'Concime', emoji: '💩', dove: 'asini',
    prende: { becchime: 2 }, costo: 1, minuti: 10, da: 'concime', resa: 1,
  },

  // Le botteghe: l'albero a più fasi, in dispensa — vedi docs/fattoria/catena.md.

  // il telaio: la stoffa
  {
    id: 'stoffa', nome: 'Stoffa', emoji: '🧵', dove: 'telaio', liv: 16,
    prende: { lana: 2 }, costo: 1, minuti: 8, da: 'stoffa', resa: 1,
  },

  // il mulino macina la farina, il panificio la cuoce
  {
    id: 'farina', nome: 'Farina', emoji: '🌾', dove: 'mulino', liv: 17,
    prende: { grano: 2 }, costo: 1, minuti: 5, da: 'farina', resa: 1,
  },
  {
    id: 'pane', nome: 'Pane', emoji: '🍞', dove: 'panificio', liv: 17,
    prende: { farina: 2 }, costo: 1, minuti: 6, da: 'pane', resa: 1,
  },

  // la sartoria: il maglione
  {
    id: 'maglione', nome: 'Maglione', emoji: '🧥', dove: 'sartoria', liv: 42,
    prende: { stoffa: 2 }, costo: 2, minuti: 10, da: 'maglione', resa: 1,
  },

  // il caseificio: il latte si sdoppia in burro (ingrediente) e formaggio (pappa e ingrediente).
  {
    id: 'burro', nome: 'Burro', emoji: '🧈', dove: 'caseificio', liv: 20,
    prende: { latte: 1 }, costo: 1, minuti: 5, da: 'burro', resa: 1,
  },
  {
    id: 'formaggio', nome: 'Formaggio', emoji: '🧀', dove: 'caseificio', liv: 20,
    prende: { latte: 2 }, costo: 0, minuti: 10, da: 'formaggio', resa: 1,
  },

  // la torta: prende da tre catene diverse; non è una pappa, riempie la voglia di giocare.
  {
    id: 'torta', nome: 'Torta', emoji: '🎂', dove: 'panificio', liv: 20,
    prende: { farina: 2, uova: 1, burro: 1 }, costo: 2, minuti: 8, da: 'torta', resa: 1,
  },

  // la tintoria: la catena più lunga (sei fasi). Il maglione alla lavanda è una merce, non un addobbo.
  {
    id: 'tintura', nome: 'Tintura', emoji: '🫙', dove: 'tintoria', liv: 55,
    prende: { lavanda: 2 }, costo: 1, minuti: 5, da: 'tintura', resa: 1,
  },
  {
    id: 'maglione_lavanda', nome: 'Maglione alla lavanda', emoji: '💜',
    dove: 'tintoria', liv: 55,
    prende: { maglione: 1, tintura: 1 }, costo: 1, minuti: 6,
    da: 'maglione_lavanda', resa: 1,
  },
  {
    id: 'sapone', nome: 'Sapone', emoji: '🧼', dove: 'tintoria', liv: 55,
    prende: { tintura: 1, burro: 1 }, costo: 1, minuti: 5, da: 'sapone', resa: 1,
  },
  // La seconda bocca della lavanda: la confluenza più corta fra colore e filo.
  {
    id: 'sacchetto', nome: 'Sacchetto profumato', emoji: '👝',
    dove: 'tintoria', liv: 55,
    prende: { lavanda: 2, stoffa: 1 }, costo: 1, minuti: 5, da: 'sacchetto', resa: 1,
  },

  // La cucina: dove le colture si incontrano, tutte a confluenza — vedi catena.md.
  {
    id: 'minestrone', nome: 'Minestrone', emoji: '🍜', dove: 'cucina', liv: 25,
    prende: { patate: 1, carote: 1, cavolfiori: 1 }, costo: 1, minuti: 6,
    da: 'minestrone', resa: 1,
  },
  // La polenta lega il mais al caseificio: troppo cara per una ciotola, va al banco.
  {
    id: 'polenta', nome: 'Polenta e formaggio', emoji: '🍛', dove: 'cucina', liv: 25,
    prende: { mais: 2, formaggio: 1 }, costo: 1, minuti: 8, da: 'polenta', resa: 1,
  },
  {
    id: 'conserva', nome: 'Conserva d\'orto', emoji: '🥗', dove: 'cucina', liv: 39,
    prende: { melanzane: 1, peperoni: 1, zucche: 1 }, costo: 1, minuti: 7,
    da: 'conserva', resa: 1,
  },
  // Il soffritto: le tre colture che al banco andavano solo crude.
  {
    id: 'salsa', nome: 'Salsa di pomodoro', emoji: '🥫', dove: 'cucina', liv: 44,
    prende: { pomodori: 2, cipolle: 1, aglio: 1 }, costo: 1, minuti: 6,
    da: 'salsa', resa: 1,
  },

  {
    id: 'crostata', nome: 'Crostata di fragole', emoji: '🍰',
    dove: 'panificio', liv: 50,
    prende: { farina: 1, fragole: 1, burro: 1 }, costo: 2, minuti: 7,
    da: 'crostata', resa: 1,
  },

  // L'albero nuovo: ogni ricetta arriva con la bocca che la mangia; liv si scrive solo quando
  // l'ingrediente arriva più tardi della macchina (guastiDegliSblocchi lo pretende).

  // lo zuccherificio: al 31, dopo la barbabietola
  {
    id: 'zucchero', nome: 'Zucchero', emoji: '🧂', dove: 'zuccherificio',
    prende: { barbabietola: 2 }, costo: 1, minuti: 6, da: 'zucchero', resa: 1,
  },
  {
    id: 'caramelle', nome: 'Caramelle', emoji: '🍬', dove: 'zuccherificio', liv: 46,
    prende: { zucchero: 1, miele: 1 }, costo: 1, minuti: 6, da: 'caramelle', resa: 1,
  },
  {
    id: 'marmellata', nome: 'Marmellata', emoji: '🫙', dove: 'zuccherificio', liv: 51,
    prende: { fragole: 2, zucchero: 1 }, costo: 1, minuti: 8, da: 'marmellata', resa: 1,
  },

  // la gelateria: al 34, con lo zucchero appena arrivato
  {
    id: 'succo', nome: 'Succo', emoji: '🧃', dove: 'gelateria',
    prende: { carote: 1, barbabietola: 1 }, costo: 1, minuti: 4, da: 'succo', resa: 1,
  },
  {
    id: 'gelato', nome: 'Gelato', emoji: '🍨', dove: 'gelateria',
    prende: { latte: 2, zucchero: 1 }, costo: 2, minuti: 8, da: 'gelato', resa: 1,
  },
  {
    id: 'frullato', nome: 'Frullato', emoji: '🥤', dove: 'gelateria', liv: 53,
    prende: { fragole: 2, latte: 1 }, costo: 1, minuti: 5, da: 'frullato', resa: 1,
  },

  // il pastificio: al 37, con la pasta che apre la bottega
  {
    id: 'pasta', nome: 'Pasta', emoji: '🍝', dove: 'pastificio',
    prende: { farina: 2, uova: 1 }, costo: 1, minuti: 7, da: 'pasta', resa: 1,
  },
  {
    id: 'biscotti', nome: 'Biscotti', emoji: '🍪', dove: 'pastificio', liv: 38,
    prende: { farina: 1, burro: 1, zucchero: 1 }, costo: 1, minuti: 6, da: 'biscotti', resa: 1,
  },
  {
    id: 'pizza', nome: 'Pizza', emoji: '🍕', dove: 'pastificio', liv: 46,
    prende: { farina: 1, salsa: 1, formaggio: 1 }, costo: 2, minuti: 9, da: 'pizza', resa: 1,
  },
  {
    id: 'lasagne', nome: 'Lasagne', emoji: '🍱', dove: 'pastificio', liv: 48,
    prende: { pasta: 1, salsa: 1, formaggio: 1 }, costo: 2, minuti: 12, da: 'lasagne', resa: 1,
  },

  // la sartoria: le due ultime ricette, tessute con la stessa stoffa del maglione
  {
    id: 'sciarpa_lana', nome: 'Sciarpa di lana', emoji: '🧣', dove: 'sartoria', liv: 48,
    prende: { stoffa: 1, lana: 1 }, costo: 1, minuti: 6, da: 'sciarpa_lana', resa: 1,
  },
  {
    id: 'berretto', nome: 'Berretto', emoji: '🧢', dove: 'sartoria', liv: 56,
    prende: { stoffa: 1 }, costo: 1, minuti: 5, da: 'berretto', resa: 1,
  },

  // la peschiera: un settimo recinto del cortile, arrivato tardi
  {
    id: 'pesce', nome: 'Pesce', emoji: '🐟', dove: 'pesci',
    prende: { becchime: 2 }, costo: 1, minuti: 15, da: 'pesce', resa: 1,
  },

  // la friggitoria: al 58, col pesce appena pescato
  {
    id: 'patatine', nome: 'Patatine', emoji: '🍟', dove: 'friggitoria',
    prende: { patate: 2 }, costo: 1, minuti: 5, da: 'patatine', resa: 1,
  },
  {
    id: 'fritto', nome: 'Fritto', emoji: '🍤', dove: 'friggitoria',
    prende: { pesce: 1, farina: 1 }, costo: 1, minuti: 7, da: 'fritto', resa: 1,
  },
  {
    id: 'arancini', nome: 'Arancini', emoji: '🍙', dove: 'friggitoria', liv: 61,
    prende: { riso: 2, formaggio: 1 }, costo: 1, minuti: 9, da: 'arancini', resa: 1,
  },

  // il sushi bar: al 62, l'ultima bottega dell'albero
  {
    id: 'sushi', nome: 'Sushi', emoji: '🍣', dove: 'sushi_bar',
    prende: { riso: 1, pesce: 1 }, costo: 2, minuti: 8, da: 'sushi', resa: 1,
  },
  {
    id: 'maki', nome: 'Maki', emoji: '🍥', dove: 'sushi_bar', liv: 63,
    prende: { riso: 1, carote: 1, peperoni: 1 }, costo: 1, minuti: 6, da: 'maki', resa: 1,
  },
]

export const PER_RICETTA = Object.fromEntries(RICETTE.map(r => [r.id, r]))

// liv è il livello della fattoria; senza, torna tutte le ricette (per i controlli e gli strumenti).
export const ricetteDi = (dove, liv = null) =>
  RICETTE.filter(r => r.dove === dove && (liv === null || (r.liv || 1) <= liv))

// Il magazzino è piccolo (8 posti), condiviso e si ingrandisce pagando — vedi docs/fattoria/campi-e-silos.md.
// vuoto è la frase di un silo costruito ma non ancora riempito (viste/Granaio.vue).
export const SILI = {
  terra:  { cosa: 'silo',        nome: 'Silo del raccolto', emoji: '🌾',
            vuoto: 'quello che raccogli nei campi' },
  stalla: { cosa: 'silo_bianco', nome: 'Silo della stalla',  emoji: '🥛',
            vuoto: 'la roba degli animali' },
  // Il terzo, per quello che esce dalle botteghe: arriva al 16 col telaio.
  bottega: { cosa: 'dispensa',   nome: 'Dispensa',           emoji: '📦', la: true,
             vuoto: 'quello che esce dalle botteghe' },
}

// Uno scomparto per merce, non posti condivisi — il perché sta in docs/fattoria/campi-e-silos.md.
export const SCOMPARTO_BASE = 8
export const SCOMPARTO_PIU = 2

// livello è quante volte il silo è stato ingrandito: zero è appena costruito.
export const postiPerMerce = livello =>
  SCOMPARTO_BASE + SCOMPARTO_PIU * Math.max(0, livello | 0)

// Anche gli scomparti vuoti: sono l'invito a coltivare altro.
export const merciDi = famiglia =>
  Object.keys(PRODOTTI).filter(k => PRODOTTI[k].silo === famiglia)

// Logaritmica e non esponenziale: le monete arrivano sempre allo stesso ritmo — vedi campi-e-silos.md.
export const costoIngrandimento = livello =>
  Math.round((40 + 130 * Math.log(1 + Math.max(0, livello | 0))) / 5) * 5

// Sconosciuto vuol dire nessun silo: come si comporta un prodotto tolto dalla tabella.
export const siloDelProdotto = prodotto => (PRODOTTI[prodotto] || {}).silo || null

// Il contrario di serveA() (dati/bisogni.js): qui come si ottiene quello che manca, per il consiglio.
export function comeSiFa(prodotto) {
  const modi = []
  for (const c of COLTURE)
    if (c.da === prodotto)
      modi.push({ che: 'coltura', id: c.id, emoji: c.emoji, nome: c.nome,
                  minuti: c.minuti, resa: c.resa })
  for (const r of RICETTE)
    if (r.da === prodotto)
      modi.push({ che: 'ricetta', dove: r.dove, prende: r.prende,
                  minuti: r.minuti, resa: r.resa, emoji: r.emoji, nome: r.nome })
  return modi
}

// Niente marcisce: fermo a 1, e non va oltre. Il massimo con zero regge un orologio tornato indietro.
export function quantoCresciuto(da, minuti, ora = Date.now()) {
  if (!da || !(minuti > 0)) return 1
  return Math.max(0, Math.min(1, (ora - da) / (minuti * MINUTO)))
}

// L'ultimo è il maturo, e ci si arriva solo a crescita finita.
export function stadioDi(coltura, quanto) {
  const st = (coltura && coltura.stadi) || []
  if (!st.length) return null
  if (quanto >= 1) return st[st.length - 1]
  const q = Math.max(0, Math.min(0.999, quanto))
  return st[Math.floor(q * (st.length - 1))]
}

// Arrotondato per eccesso: "fra 154 secondi" non è una cosa che si dice a un bambino.
export function minutiCheMancano(da, minuti, ora = Date.now()) {
  const q = quantoCresciuto(da, minuti, ora)
  if (q >= 1) return 0
  return Math.max(1, Math.ceil((1 - q) * minuti))
}

// N → 1, mai N → M: è quanto costa capire, non bilanciamento — vedi docs/fattoria/catena.md.
export const RESA = 1

// La profondità massima di una catena, in un posto solo (prima era copiata in quattro file) — vedi catena.md.
export const PROFONDITA = 8

// Infinity se non si produce entro il tetto: un guasto per una merce vera, l'unica risposta per un anello.
export function profonditaDi(prodotto, giri = PROFONDITA) {
  if (giri <= 0 || !PRODOTTI[prodotto]) return Infinity
  let min = Infinity
  for (const c of COLTURE) if (c.da === prodotto) min = Math.min(min, 1)
  for (const r of RICETTE) {
    if (r.da !== prodotto) continue
    let n = 1
    for (const k of Object.keys(r.prende || {})) n = Math.max(n, 1 + profonditaDi(k, giri - 1))
    min = Math.min(min, n)
  }
  return min
}

export function guastiDelleColture() {
  const g = []
  // Con due passi di margine: al tetto esatto il conto torna Infinity alla prossima ricetta senza dirlo.
  for (const p of Object.keys(PRODOTTI)) {
    const n = profonditaDi(p)
    if (!Number.isFinite(n))
      g.push(`${p}: non si produce in nessun modo entro ${PROFONDITA} passaggi — un anello, o PROFONDITA è bassa`)
    else if (n > PROFONDITA - 2)
      g.push(`${p}: la sua catena è lunga ${n} passaggi, troppo vicina al tetto (${PROFONDITA}) — alza PROFONDITA`)
  }
  for (const c of COLTURE)
    if (c.resa !== RESA)
      g.push(`${c.id}: rende ${c.resa} e non ${RESA} — un campo dà una cosa sola`)
  for (const r of RICETTE)
    if (r.resa !== RESA)
      g.push(`${r.id}: rende ${r.resa} e non ${RESA} — N → 1, mai N → M`)
  const visti = new Set()
  for (const c of COLTURE) {
    if (visti.has(c.id)) g.push(`coltura doppia: ${c.id}`)
    visti.add(c.id)
    if (!PRODOTTI[c.da]) g.push(`${c.id}: rende «${c.da}», che non è un prodotto`)
    if (!(c.minuti > 0)) g.push(`${c.id}: tempo impossibile`)
    if (!(c.resa >= 1)) g.push(`${c.id}: non rende niente`)
    if (!(c.semina >= 0) || !(c.raccolta >= 0)) g.push(`${c.id}: prezzo impossibile`)
    // Almeno due stadi (seminato e maturo), se no la crescita non si vedrebbe.
    if (!Array.isArray(c.stadi) || c.stadi.length < 2)
      g.push(`${c.id}: meno di due stadi — la crescita non si vedrebbe`)
    // Uno stadio che l'atlante non ha è muto: drawImage non disegna e non lancia, e non c'è niente in console.
    for (const s of c.stadi || [])
      if (s && !PEZZI[s]) g.push(`${c.id}: lo stadio «${s}» non è nell'atlante`)
    // aspetta è il prefisso dei sette riquadri: il giorno che il primo c'è, la riga va aggiornata.
    if (c.aspetta && PEZZI[`${c.aspetta}0`])
      g.push(`${c.id}: aspetta «${c.aspetta}0…», che nell'atlante c'è già — prendi i suoi stadi`)
  }
  const idRicette = new Set()
  for (const r of RICETTE) {
    if (idRicette.has(r.id)) g.push(`ricetta doppia: ${r.id}`)
    idRicette.add(r.id)
    if (!PRODOTTI[r.da]) g.push(`${r.id}: fa «${r.da}», che non è un prodotto`)
    if (!(r.resa >= 1)) g.push(`${r.id}: non rende niente`)
    if (!(r.minuti > 0)) g.push(`${r.id}: tempo impossibile`)
    for (const k of Object.keys(r.prende || {})) {
      if (!PRODOTTI[k]) g.push(`${r.id}: prende «${k}», che non è un prodotto`)
      if (!(r.prende[k] >= 1)) g.push(`${r.id}: prende una quantità impossibile di ${k}`)
    }
    if (!Object.keys(r.prende || {}).length)
      g.push(`${r.id}: non prende niente — sarebbe una fonte di roba dal nulla`)
  }
  // Un prodotto senza silo non si potrebbe raccogliere: quantoCiSta risponderebbe zero per sempre.
  for (const [id, pr] of Object.entries(PRODOTTI)) {
    if (!SILI[pr.silo]) g.push(`${id}: sta in un silo che non esiste («${pr.silo}»)`)
    // Un pezzo che l'atlante non ha è muto come uno stadio storto: resta un fumetto vuoto.
    if (pr.pezzo && !PEZZI[pr.pezzo])
      g.push(`${id}: il pezzo «${pr.pezzo}» non è nell'atlante`)
    // aspetta è quello che un foglio futuro porterà: il giorno che c'è, la riga va aggiornata.
    if (pr.aspetta && PEZZI[pr.aspetta])
      g.push(`${id}: aspetta «${pr.aspetta}», che nell'atlante c'è già — scrivilo come pezzo`)
    if (!pr.pezzo && !pr.aspetta)
      g.push(`${id}: senza pezzo e senza dire quale aspetta — un'emoji per sempre`)
  }
  if (!(SCOMPARTO_BASE > 0)) g.push('uno scomparto da zero non tiene niente')
  if (!(SCOMPARTO_PIU > 0)) g.push('un ingrandimento che non aggiunge niente non si paga')
  // Ogni silo deve avere almeno una merce, se no è un edificio che resta vuoto per sempre.
  for (const fam of Object.keys(SILI))
    if (!merciDi(fam).length) g.push(`il silo «${fam}» non tiene nessuna merce`)
  // Uno scomparto deve reggere almeno un raccolto intero.
  for (const c of COLTURE)
    if (c.resa > SCOMPARTO_BASE)
      g.push(`${c.id}: rende ${c.resa}, più di uno scomparto vuoto (${SCOMPARTO_BASE})`)
  // Il prezzo deve salire: uno che scende farebbe convenire aspettare.
  for (let l = 0; l < 6; l++)
    if (!(costoIngrandimento(l + 1) > costoIngrandimento(l)))
      g.push(`l'ingrandimento numero ${l + 2} non costa più del precedente`)
  return g
}
