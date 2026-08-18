/* ═══════════════════════════════════════════════════════════════════
   QUELLO CHE SI PUÒ METTERE NELLA FATTORIA

   Dato puro. Ogni voce dice **cosa si vede** (`pezzo`, un nome
   dell'atlante), **quanto occupa per terra** (`piede`, in celle) e
   **quanto costa**. Nient'altro: come si disegna lo sa `scena/`, se si
   può posare lì lo sa `motore/`.

   ── IL PIEDE NON È LA FIGURA ──────────────────────────────────────
   Una casa occupa 4×2 celle per terra ma è alta cinque tessere: il
   tetto sta **sopra** il suo piede, non dentro. Tenere separate le due
   cose è quello che permette a un personaggio di passare dietro il
   tetto e davanti al muro. Senza la distinzione i tetti coprono la roba
   che sta dietro, e la scena si appiattisce.

   ── E QUASI SEMPRE SI RICAVA ──────────────────────────────────────
   Il piede si scriveva a mano, voce per voce, e finché le voci erano
   trenta andava bene. Adesso sono dieci volte tante — l'atlante è
   cresciuto di tre fogli — e trecento numeri copiati a mano sono
   trecento occasioni di scriverne uno storto, che a schermo si presenta
   come un albero che si può attraversare o un lampione che occupa mezzo
   prato. Quindi il ripiego lo **misura il disegno** (`piedeDalDisegno`),
   e si scrive solo quando la misura non basta:

     · **largo** = quanto è largo lo sprite, arrotondato in celle. Non
       c'è niente da decidere: quello che si vede è quello che occupa.
     · **profondo** = 1, tranne per le cose larghe **e** alte, che sono
       gli edifici: quelli hanno un fianco, e un fianco è profondo.

   Sulle trentadue voci scritte a mano di prima la regola ne ricava
   trenta identiche. Le due che sbaglia sono l'orto e la radura, che
   sono **terreno** e non oggetti — il loro piede è quanta terra
   occupano, non quanto disegno c'è — e infatti sono le due che il piede
   se lo dichiarano.

   ── `giri` — GIRARE NON È RUOTARE ─────────────────────────────────
   La pixel art ruotata si sfarina. Una staccionata si gira perché nel
   set esiste *la stessa staccionata in piedi*, ed è quella tessera che
   si mette al posto dell'altra. Quindi la staccionata è **una voce sola
   che si gira**, non due voci diverse. Dove il set non ha la variante,
   `giri` non c'è e il gioco non offre il tasto: meglio niente che un
   tasto che fa una cosa storta.

   ── `sotto` — CHI STA PER TERRA ───────────────────────────────────
   Un orto, un'aiuola, dei fiori sono *terreno*, non oggetti: vanno
   disegnati sotto tutto il resto, se no un fiore alto tre pixel finisce
   davanti a una casa perché è più in basso nello schermo.

   ── `campo`, `macchina`, `silo` — CHI LAVORA ──────────────────────
   Tre voci su quattro sono arredamento; queste no, si toccano e **fanno
   qualcosa**. Il campo si semina, la macchina trasforma, il silo allarga
   il granaio. Qui si dichiara solo *che* lo fanno; cosa ci cresce e
   quanto ci vuole sta in `dati/coltivazioni.js`, e le regole nel motore.
   Tenerli separati è la ragione per cui aggiungere una coltura è una
   riga di tabella e non un giro dentro al catalogo.

   ── `stati` — UNA MACCHINA CHE SI LEGGE DA LONTANO ────────────────
   Un recinto è una macchina come il mulino (stessi verbi: avvia,
   aspetta, ritira) con una cosa in più: **si vede in che stato è senza
   aprirlo**. Il foglio degli animali disegna ogni specie sei volte, e
   `stati` dice quale pezzo va con quale momento —

     calmo   com'è quando non lo si sta guardando: è il ritratto della
             voce, quello che si vede nel baule
     fame    ferma, e vuole da mangiare (il fumetto è disegnato dentro
             lo sprite, quindi non ce ne vuole un altro sopra)
     mangia  ha appena cominciato
     felice  a metà
     dorme   quasi fatta
     pronto  c'è da raccogliere

   Chi sceglie fra questi è il motore (`aspettoDellaCosa`), che è
   l'unico che sa che ora è. Qui c'è solo l'elenco dei nomi — e il
   motivo per cui l'elenco sta nel catalogo è che i pezzi che esistono
   davvero li sa il catalogo, non il motore.
   ═══════════════════════════════════════════════════════════════════ */
import { PEZZI, TESSERA } from './atlante.js'
import { ricetteDi, SILI } from './coltivazioni.js'

/* Il piede che si ricava dal disegno, e il ragionamento sta in testa al
   file. Chi non ci si ritrova scrive `piede` nella sua riga e vince lui:
   questo è un ripiego buono, non una legge. */
export function piedeDalDisegno(pezzo) {
  const p = PEZZI[pezzo]
  if (!p) return [1, 1]
  const largo = Math.max(1, Math.round(p[2] / TESSERA))
  return [largo, largo >= 3 && p[3] / TESSERA >= 2.5 ? 2 : 1]
}

const V = (id, pezzo, nome, prezzo, extra) =>
  ({ id, pezzo, nome, prezzo, piede: piedeDalDisegno(pezzo), ...extra })

/* ── `zona` E `apri` — DOVE STA E QUANDO ARRIVA ───────────────────
   Ogni linguetta dice due cose in più di sé.

   **`zona`** è la metà del baule in cui vive: `lavoro` (i campi, le
   macchine, i silos, i recinti degli animali — le cose che *fanno*
   qualcosa) o `bello` (tutto il resto: alberi, fiori, panchine, case).
   Sono duecento voci, e senza questa divisione la carriola sta in mezzo
   al pollaio: chi cerca il mulino deve passare in rassegna il vivaio.

   Quando arriva una decorazione **non si dichiara**: tutte quelle
   della zona `bello` stanno in una fila sola, ordinata per prezzo, e ne
   escono due o tre per livello (`dati/livelli.js`). Sono quasi
   duecento, ed è la ricchezza che rende lungo il gioco — a secchiate
   diventano una lista, a gocce sono la ragione per cui si torna.

   **`liv`** sulla singola riga vince su tutto, e ce l'hanno solo le
   poche che *lavorano*: mulino, silos, i cinque recinti. Lì il momento
   in cui arrivano è una decisione di gioco, non un conto sui prezzi.

   ── `cresce` E `unico` — LE COPIE ─────────────────────────────────
   Quello che **produce** rincara a ogni copia (`cresce`), perché due
   conigliere fanno il doppio della lana e il campo numero cinque vale
   quanto il primo: a prezzo fisso l'unica strategia sarebbe riempire il
   prato di recinti uguali. Il conto sta in `prezzoDellaVoce`, ed è
   lineare — mai esponenziale (`CALIBRAZIONE.md`).

   I silos invece sono **`unico`**: due silos dello stesso tipo non
   contengono niente di più (la capienza è del *tipo*, e si compra
   ingrandendo), quindi il secondo non si vende affatto. Un oggetto che
   si può comprare due volte e la seconda non fa niente è peggio di uno
   che non si può comprare.

── `cresce` — QUELLO CHE RINCARA A OGNI COPIA ───────────────────
   Un pezzo di terra rincara già (`prezzoPiazzola` in `dati/mondo.js`),
   e per lo stesso motivo deve rincarare **il campo**: è la cosa che
   moltiplica tutto il resto — più campi vuol dire più raccolto per
   volta — e a prezzo fisso il decimo campo costa come il primo mentre
   vale molto di più. Senza rincaro l'unica strategia è comprare campi
   finché c'è terra, e il gioco finisce lì.

   Il rincaro è più dolce di quello della terra (1,38 lì contro 1,45
   qui, ma la terra parte da 45 e il campo da 22): i primi due o tre
   restano una spesa da pomeriggio, il sesto è una decisione. Chi non
   dichiara `cresce` costa sempre uguale — una panchina è una panchina,
   e ce ne stanno dieci senza che nessuna valga meno. */
export const RINCARO = 0.6

/* Quanto costa la prossima copia di una cosa, avendone già `quante`.
   Vale sia per quelle in mappa sia per quelle nel baule: sono la stessa
   cosa comprata, e uno che mette via i campi per ricomprarli a prezzo
   di listino avrebbe trovato il modo di non pagare il rincaro.

   Il rincaro è **lineare** (`base · (1 + n · cresce)`), non geometrico:
   22, 35, 48, 61, 74… La prima versione moltiplicava per 1,45 a ogni
   copia, ed era la stessa curva esponenziale bocciata sugli
   ingrandimenti del silo — il decimo campo sarebbe costato 🪙770, due
   ore di esercizi, mentre vale quanto il primo. Il metro sta in
   `CALIBRAZIONE.md`: le monete si guadagnano sempre allo stesso ritmo,
   quindi lo sforzo per una copia in più deve crescere piano. */
export function prezzoDellaVoce(v, quante = 0) {
  if (!v) return 0
  if (!v.cresce || !(quante > 0)) return v.prezzo
  return Math.round(v.prezzo * (1 + quante * v.cresce))
}

/* I sei ritratti di un recinto, dal nome della specie. Si scrive così e
   non sei volte a mano per lo stesso motivo per cui gli stadi di una
   coltura si scrivono con una funzione: sei nomi ricopiati cinque volte
   sono trenta occasioni di sbagliarne uno, e uno sbagliato è un recinto
   che sparisce in un certo momento della giornata e in nessun altro. */
const RECINTO = specie => Object.fromEntries(
  ['calmo', 'fame', 'mangia', 'felice', 'dorme', 'pronto']
    .map(q => [q, `recinto_${specie}_${q}`]))

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

  /* ── I CAMPI ──────────────────────────────────────────────────────
     L'orto era in mezzo ai fiori ed era **solo un disegno**: due celle
     di terra mossa che non facevano niente. È lo stesso id e lo stesso
     prezzo — chi ne aveva già uno se lo ritrova coltivabile, senza
     migrazioni — ma adesso si semina, e da quando c'è il foglio dei
     campi il disegno è l'aiuola vera invece di una tessera di terra.

     Il mulino costa più di trenta pappe comprate, e questo è voluto: la
     catena deve **dare un motivo per spendere**, non essere il modo di
     smettere di spendere. Si ripaga solo a chi coltiva per giorni.

     Le aiuole nude e i cartelli non coltivano niente: sono arredo che
     viene dallo stesso foglio, e servono a far sembrare un orto anche
     il pezzo di terra che non è un campo. */
  { chiave: 'campi', zona: 'lavoro', nome: 'Campi', icona: '🌾', voci: [
    V('orto',          'campo_vuoto',       'Campo',             22,
      { sotto: true, campo: true, piede: [2, 2], cresce: RINCARO }),
    V('mulino',        'mulino_vento',      'Mulino',           150, { macchina: 'mulino', liv: 3, cresce: RINCARO }),
    V('silo',          'silo_rosso',        'Silo del raccolto', 120, { silo: 'terra', unico: true }),
    V('silo_bianco',   'silo_bianco',       'Silo della stalla', 120, { silo: 'stalla', liv: 4, unico: true }),
  ] },

  /* ── IL CORTILE ───────────────────────────────────────────────────
     Cinque recinti, e non sono arredo: sono macchine (`stati` in testa
     al file, le ricette in `dati/coltivazioni.js`). Costano molto più di
     tutto il resto perché sono la fine della catena — prima il campo,
     poi il fieno, poi la stalla — e perché quello che rendono non si
     compra da nessuna parte.

     Il piede è scritto e non ricavato: un recinto è largo quattro celle
     e ne occupa **tre** di profondità, non due. È l'unico posto della
     fattoria dove si cammina *dentro* qualcosa, e due celle
     lascerebbero l'ultima fila di staccionata calpestabile. */
  { chiave: 'cortile', zona: 'lavoro', nome: 'Cortile', icona: '🐄', voci: [
    V('conigliera',    'recinto_conigli_calmo', 'Conigliera',    95,
      { macchina: 'conigliera', stati: RECINTO('conigli'), piede: [4, 3], liv: 5, cresce: RINCARO }),
    V('pollaio',       'recinto_galline_calmo', 'Pollaio',      130,
      { macchina: 'pollaio', stati: RECINTO('galline'), piede: [4, 3], liv: 8, cresce: RINCARO }),
    V('ovile',         'recinto_pecore_calmo',  'Ovile',        190,
      { macchina: 'ovile', stati: RECINTO('pecore'), piede: [4, 3], liv: 12, cresce: RINCARO }),
    V('stalla',        'recinto_mucche_calmo',  'Stalla',       220,
      { macchina: 'stalla', stati: RECINTO('mucche'), piede: [4, 3], liv: 18, cresce: RINCARO }),
    V('porcile',       'recinto_maiali_calmo',  'Porcile',      260,
      { macchina: 'porcile', stati: RECINTO('maiali'), piede: [4, 3], liv: 26, cresce: RINCARO }),
  ] },

  /* ── LE BESTIOLINE ────────────────────────────────────────────────
     Quello che sta *attorno* agli animali e non lavora: la cuccia, i
     nidi, la ciotola, e i due conigli di ceramica che non mangiano
     niente. Stanno qui e non nel cortile perché il cortile è la fine
     della catena e dev'essere leggibile in un colpo — cinque recinti,
     tutti che fanno qualcosa. Un gattino di ceramica in mezzo a cinque
     macchine è la cosa che fa toccare quello sbagliato. */
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

  /* Lo stagno e le ninfee erano qui, sono stati tolti — **si vendeva un
     disegno, non uno specchio d'acqua** — e adesso tornano, ma come
     quello che sono: una pozza disegnata, non l'acqua vera. L'acqua vera
     si dipinge (`dipingi` nel motore, `dati/terreni.js`) e si raccorda
     da sé; questi sono laghetti da giardino, larghi due celle, che a
     nessuno viene in mente di accostare. */
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
    V('staccio',       'staccionata',       'Staccionata',        6, { giri: [
      { pezzo: 'staccionata', piede: [2, 1] },     // sdraiata
      { pezzo: 'palo',        piede: [1, 2] },     // in piedi
    ] }),
    V('recinto',       'recinto',           'Recinto',            8),
    /* Il cancello da solo non voleva dire niente e non si vendeva: è un
       pezzo di raccordo, e il pittore che sa comporre una staccionata
       non c'è ancora. Torna in vendita perché con `recinto` accanto un
       cancello **si compone col dito**, che è il modo in cui questo
       gioco fa tutto il resto. */
    V('cancello',      'cancello',          'Cancello',          12),
    V('ringhiera',     'ringhiera',         'Ringhiera',          9),
    V('colonna',       'colonna',           'Colonna',           11),
    V('pergola',       'pergola_bianca',    'Pergola',           40),
    V('pergola_fiorita', 'pergola_fiorita', 'Pergola fiorita',   45),
    V('gazebo',        'gazebo',            'Gazebo',            70),
    V('gazebo_cena',   'gazebo_cena',       'Gazebo con tavolo', 95),
    V('cartello',      'cartello',          'Cartello',          10),
    V('insegna',       'insegna',           'Insegna',           14),
    /* I cinque cartelli del foglio dei campi. Stanno con le insegne e
       non coi campi: sono legno piantato per terra, non terra lavorata —
       e nella linguetta dei campi facevano numero fra quattro cose che
       lavorano davvero. */
    V('cartello_grano', 'cartello_grano',   'Cartello grano',     6),
    V('cartello_mais', 'cartello_mais',     'Cartello mais',      6),
    V('cartello_carote', 'cartello_carote', 'Cartello carote',    6),
    V('cartello_zucche', 'cartello_zucche', 'Cartello zucche',    6),
    V('cartello_erba', 'cartello_erba',     'Cartello erba',      6),
    /* Una bandiera sola, e non due. I quattro pezzi sono i **quattro
       fotogrammi della stessa bandiera che sventola**. Il terzo si
       chiamava `bandiera_asta`, e quel nome è precisamente quello che
       aveva fatto finire in negozio la stessa cosa due volte a due
       prezzi diversi: adesso si chiama `bandiera2`, che è quello che è.

       È animata, e non lo era: i quattro ritagli erano larghi 34, 32, 36
       e uno mancava del tutto, e siccome chi disegna centra lo sprite
       sul piede (`posa` in `scena/tela.js`) farli girare avrebbe mosso
       **il palo** invece del drappo. Adesso sono tutti 32×32 col palo
       nelle stesse colonne, misurato sul passo vero del foglio, e il
       palo sta fermo. L'ordine è quello in cui stanno sul foglio, ed è
       un'onda che scorre lungo il drappo.

       ⚠ Questo elenco e il campo `anima` del foglietto dicono la stessa
       cosa in due posti: `scena/tela.js` legge **questo**, il banco degli
       sprite legge quello. Vanno tenuti d'accordo a mano — non si
       leggono a vicenda, e uno solo dei due acceso non dà nessun errore:
       la bandiera resta ferma in gioco, o si muove solo nel banco. */
    V('bandiera',      'bandiera0',         'Bandiera',          10, {
      anima: ['bandiera0', 'bandiera1', 'bandiera2', 'bandiera_tesa'] }),
    V('stendardo',     'bandiera_stemma',   'Stendardo',         10),
  ] },

  { chiave: 'case', zona: 'bello', nome: 'Case', icona: '🏚️', voci: [
    /* una voce sola che si gira: davanti c'è la porta, dietro il muro
       cieco. Erano due voci di catalogo, ed era la stessa casa. */
    V('casa',          'casa',              'Casa',             120, { giri: [
      { pezzo: 'casa',       piede: [5, 2] },     // il davanti, con la porta
      { pezzo: 'casa_retro', piede: [5, 2] },     // il dietro
    ] }),
    V('casetta',       'casetta',           'Casetta',           55),
    V('casetta_lunga', 'casetta_tetto_lungo', 'Casa lunga',        70),
    V('casa_veranda',  'casetta_con_veranda', 'Casa e veranda',    90),
    V('casa_albero',   'casa_albero',       'Casa sull\'albero', 110),
    V('fienile',       'fienile0',          'Fienile',          150),
    V('fienile_rosso', 'fienile_rosso',     'Fienile rosso',    160),
    V('fienile_blu',   'fienile_tetto_blu', 'Fienile blu',      140),
    V('torretta',      'torre_rotonda',     'Torretta',         100),
    V('forno',         'forno_legna',       'Forno a legna',     75),
    V('forno_pizza',   'forno_pizza',       'Forno a cupola',    85),
    V('chiosco_rosa',  'dehors_rosa',       'Chiosco rosa',      80),
    V('chiosco_azzurro', 'dehors_azzurro',  'Chiosco azzurro',   80),
    V('mercato',       'mercato',           'Mercato',           40),
    V('carretto_mercato', 'carretto_mercato', 'Carretto',          32),
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

  /* Si chiamava «Banco», che diceva dov'era finita la roba e non cos'è.
     Qui sta quello che **viene dai campi** e si mette in giro: cassette,
     ceste, balle di fieno, e lo spaventapasseri che le guarda. */
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

export const CATALOGO = CATEGORIE.flatMap(c => c.voci)
export const PER_ID = Object.fromEntries(CATALOGO.map(v => [v.id, v]))

/* Le tre funzioni che reggono una voce sconosciuta senza esplodere. Un
   salvataggio di ieri può contenere un id che oggi non c'è più — è già
   successo, con il `palo` diventato una staccionata girata — e il gioco
   deve continuare a disegnare tutto il resto. */
export const versoDi = cosa => (cosa && cosa.g) || 0

export function piedeDi(cosa, v = PER_ID[cosa && cosa.id]) {
  if (!v) return [1, 1]
  return v.giri ? v.giri[versoDi(cosa) % v.giri.length].piede : v.piede
}

export function pezzoDi(cosa, v = PER_ID[cosa && cosa.id]) {
  if (!v) return null
  return v.giri ? v.giri[versoDi(cosa) % v.giri.length].pezzo : v.pezzo
}

export const puoGirare = v => !!(v && v.giri && v.giri.length > 1)

/* La voce che *è* quella macchina («mulino», «pollaio»): serve a chi
   deve nominarla — «3 🌾 nel mulino» — partendo da una ricetta, che la
   macchina la conosce per mestiere e non per id. Oggi i due coincidono,
   ma coincidono per caso, e chi un giorno vendesse due mulini diversi
   scoprirebbe la differenza da un nome sbagliato in un foglio. */
export const laMacchina = quale => CATALOGO.find(v => v.macchina === quale) || null

/* Le quattro domande che si fanno a una cosa in mappa per sapere se,
   oltre a stare lì, **lavora**. Si chiedono all'id perché chi le chiede
   ha in mano una `cosa` del salvataggio, non una voce di catalogo. */
export const eCampo = cosa => !!(cosa && (PER_ID[cosa.id] || {}).campo)
export const macchinaDi = cosa => (PER_ID[cosa && cosa.id] || {}).macchina || null
/* Il silo dice **quale** dei due è (`'terra'`, `'stalla'`): è la
   stessa parola che i prodotti si scrivono addosso in
   `dati/coltivazioni.js`, ed è tutto il legame che c'è fra una cosa in
   mappa e la roba che ci sta dentro. */
export const siloDi = cosa => (PER_ID[cosa && cosa.id] || {}).silo || null
export const eSilo = cosa => !!siloDi(cosa)
export const statiDi = cosa => (PER_ID[cosa && cosa.id] || {}).stati || null

/* ── SI PARTE DA ZERO ─────────────────────────────────────────────
   Niente. Nemmeno una panchina. C'era una fattoria di partenza già
   arredata, e sembrava una buona idea — «aprire su un prato vuoto non
   dice niente» — ma regalava tredici oggetti che nessuno aveva
   comprato, in un gioco che è tutto lì: guadagnare fuori e spendere
   qui. La prima panchina messa giù vale perché è costata. */
export const PARTENZA = []

export function guastiDelCatalogo() {
  const g = []
  const visti = new Set()
  for (const v of CATALOGO) {
    if (visti.has(v.id)) g.push(`id doppio nel catalogo: ${v.id}`)
    visti.add(v.id)
    if (!PEZZI[v.pezzo]) g.push(`${v.id}: la tessera «${v.pezzo}» non è nell'atlante`)
    if (!(v.prezzo > 0)) g.push(`${v.id}: prezzo impossibile`)
    if (!Array.isArray(v.piede) || v.piede.length !== 2 || v.piede.some(n => n < 1))
      g.push(`${v.id}: piede impossibile`)
    for (const nome of v.anima || [])
      if (!PEZZI[nome]) g.push(`${v.id}: il fotogramma «${nome}» non è nell'atlante`)
    for (const giro of v.giri || []) {
      if (!PEZZI[giro.pezzo]) g.push(`${v.id}: il giro «${giro.pezzo}» non è nell'atlante`)
      if (!Array.isArray(giro.piede) || giro.piede.length !== 2)
        g.push(`${v.id}: un giro senza piede`)
    }
    if (v.giri && v.giri.length < 2)
      g.push(`${v.id}: un solo giro non è un giro — meglio niente tasto`)
    /* Un campo si calpesta: è terra lavorata, non un mobile. Senza
       `sotto` una bestia non potrebbe attraversarlo e il bambino
       vedrebbe il cane girargli attorno senza capire perché. */
    if (v.campo && !v.sotto)
      g.push(`${v.id}: un campo va sotto, se no non ci si cammina sopra`)
    /* Una macchina senza ricette è un oggetto che si tocca e non fa
       niente: a schermo è un tasto rotto, ed è il tipo di guasto che
       nessuno segnala perché sembra una cosa da comprare più tardi. */
    if (v.macchina && !ricetteDi(v.macchina).length)
      g.push(`${v.id}: la macchina «${v.macchina}» non ha nessuna ricetta`)
    /* Uno stato che l'atlante non ha è **muto**: `drawImage` con un
       argomento non finito torna senza disegnare e senza lanciare,
       quindi il recinto sparisce in un certo momento della giornata e in
       nessun altro, e in console non c'è niente. */
    for (const [quale, nome] of Object.entries(v.stati || {}))
      if (!PEZZI[nome]) g.push(`${v.id}: lo stato «${quale}» non è nell'atlante`)
    if (v.stati && !v.macchina)
      g.push(`${v.id}: ha degli stati e non è una macchina — non li vedrebbe nessuno`)
    /* Un ritratto che non è uno degli stati vuol dire che nel baule si
       compra una cosa e in mappa ne compare un'altra. */
    if (v.stati && !Object.values(v.stati).includes(v.pezzo))
      g.push(`${v.id}: il ritratto «${v.pezzo}» non è fra i suoi stati`)
  }
  const cat = new Set()
  for (const c of CATEGORIE) {
    if (cat.has(c.chiave)) g.push(`categoria doppia: ${c.chiave}`)
    cat.add(c.chiave)
    if (!c.voci.length) g.push(`categoria vuota: ${c.chiave}`)
  }
  /* `animali` è una linguetta che `viste/Roba.vue` aggiunge da sé — le
     bestie di casa — e una categoria di catalogo che si chiamasse così la
     coprirebbe: si aprirebbe il baule e al posto dei cani ci sarebbero
     delle panchine. (`granaio` era la seconda, e non lo è più: il
     raccolto si guarda toccando un silo.) */
  if (cat.has('animali'))
    g.push('la categoria «animali» è già una linguetta del baule')
  for (const p of PARTENZA)
    if (!PER_ID[p.id]) g.push(`la fattoria di partenza cita «${p.id}», che non è in catalogo`)
  /* I due silos si citano a vicenda — la voce dice in che famiglia è, e
     la famiglia dice qual è la sua voce — e un legame storto vorrebbe
     dire roba che non entra in nessun silo, o un silo che si costruisce
     e non serve a niente. Nessuno dei due si vede provando a occhio. */
  for (const [fam, si] of Object.entries(SILI)) {
    const v = PER_ID[si.cosa]
    if (!v) g.push(`il silo «${fam}» cita «${si.cosa}», che non è in catalogo`)
    else if (v.silo !== fam) g.push(`${si.cosa}: dice di essere il silo «${v.silo}», non «${fam}»`)
  }
  for (const v of CATALOGO)
    if (v.silo && !SILI[v.silo]) g.push(`${v.id}: è il silo «${v.silo}», che non esiste`)
  return g
}
