/* L'elenco dei traguardi, non il motore: ognuno una grandezza che cresce e
   basta, fino a tre soglie 🥉🥈🥇, letta dal profilo tramite l'oggetto `m`
   (store/progressi.js) — sono RETROATTIVI, vedi docs/core/progressi.md.
   I giochi vecchi sono qui uno per uno; i nuovi (src/giochi/) si accodano
   da soli dal loro manifesto. */
import { AREE_GIOCHI, TRAGUARDI_GIOCHI } from '../giochi/albo.js'

// toglierla quando il generale entra in home: finché è false l'area e i suoi traguardi non esistono per l'albo
export const GENERALE_ATTIVO = true

const AREE_TUTTE = [
  { id: 'mate',     nome: 'Tabelline Asteroidi', emoji: '☄️', classe: 'mate' },
  { id: 'inglese',  nome: 'English',             emoji: '🌐', classe: 'eng' },
  { id: 'spagnolo', nome: 'Español',             emoji: '🇪🇸', classe: 'esp' },
  { id: 'torri',    nome: 'Difendi il Castello', emoji: '🏰', classe: 'td' },
  { id: 'bancarella', nome: 'La bancarella',       emoji: '🛒', classe: 'banco' },
  { id: 'generale', nome: 'Il generale',           emoji: '🎖️', classe: 'gen' },
  { id: 'tutti',    nome: 'Tutti i giochi',      emoji: '🌈', classe: 'tutti' },
]

/* medaglie dei tre gradi, e monete che porta ciascuno */
export const MEDAGLIE = ['🥉', '🥈', '🥇']
export const PREMI = [15, 40, 100]

const TRAGUARDI_TUTTI = [
  // ---------- Tabelline Asteroidi ----------
  // «partiteMath» conta le partite di tutti e due i cieli, quindi la frase non nomina le tabelline
  { id: 'mate-prima', area: 'mate', emoji: '🚀', nome: 'Primo volo',
    come: () => 'Gioca una partita agli Asteroidi',
    soglie: [1], valore: m => m.tot('partiteMath') },
  { id: 'mate-giuste', area: 'mate', emoji: '☄️', nome: 'Cacciatore di asteroidi',
    come: n => `Colpisci ${n} asteroidi giusti`,
    soglie: [50, 250, 1000], valore: m => m.tot('math') },
  { id: 'mate-campagna', area: 'mate', emoji: '🪐', nome: 'Esploratore di pianeti',
    come: n => n === 1 ? 'Supera il primo pianeta' : `Supera ${n} pianeti della campagna`,
    soglie: [1, 5, 10], valore: m => m.tappeMate() },
  { id: 'mate-sicure', area: 'mate', emoji: '✖️', nome: 'Tabelline sicure',
    come: n => `Impara ${n} calcoli sul serio`,
    soglie: [10, 30, 55], valore: m => m.imparati('math:') },
  // vale tutta la tabellina, non un calcolo per volta; scende se non si ripassa (guarda la forza di adesso)
  { id: 'mate-tabelline', area: 'mate', emoji: '⭐', nome: 'Tabelline a memoria',
    come: n => n === 1 ? 'Impara una tabellina intera, tutte e dieci le caselle'
                       : `Impara ${n} tabelline intere`,
    soglie: [1, 5, 10], valore: m => m.tabellineIntere() },
  { id: 'mate-serie', area: 'mate', emoji: '🎯', nome: 'Filotto',
    come: n => `${n} risposte giuste di fila in una partita`,
    soglie: [10, 20, 40], valore: m => m.best('serieMath') },
  { id: 'mate-record', area: 'mate', emoji: '🏆', nome: 'Punteggio da record',
    come: n => `Arriva a ${n} punti in una partita`,
    soglie: [200, 600, 1500], valore: m => m.best('math') },

  // ---------- il calcolo a mente, che sta negli stessi asteroidi ----------
  { id: 'mente-stazioni', area: 'mate', emoji: '🛰️', nome: 'Stazioni orbitali',
    come: n => n === 1 ? 'Supera la prima stazione del calcolo a mente'
                       : `Supera ${n} stazioni del calcolo a mente`,
    soglie: [1, 5, 9], valore: m => m.tappeMente() },
  { id: 'mente-giuste', area: 'mate', emoji: '🧠', nome: 'Conti a mente',
    come: n => `Fai ${n} calcoli a mente giusti`,
    soglie: [50, 250, 1000], valore: m => m.tot('mente') },
  // le strategie che reggono adesso, non i calcoli: come le tabelline intere, scende se non si ripassa
  { id: 'mente-concetti', area: 'mate', emoji: '💡', nome: 'Trucchi in tasca',
    come: n => `Tieni in mano ${n} trucchi di calcolo`,
    soglie: [5, 15, 30], valore: m => m.concettiSaldi() },

  // ---------- English ----------
  { id: 'en-parole', area: 'inglese', emoji: '🔤', nome: 'Vocabolario',
    come: n => `Impara ${n} parole inglesi`,
    soglie: [10, 50, 150], valore: m => m.imparati('en:') },
  { id: 'en-giuste', area: 'inglese', emoji: '💬', nome: 'Chiacchierone',
    come: n => `Rispondi giusto ${n} volte in English`,
    soglie: [50, 250, 1000], valore: m => m.tot('en') },
  { id: 'en-categorie', area: 'inglese', emoji: '🗂️', nome: 'Giro del mondo',
    come: n => `Impara almeno 3 parole in ${n} categorie diverse`,
    soglie: [3, 6, 9], valore: m => m.categorieEn(3) },
  { id: 'en-campagna', area: 'inglese', emoji: '🗺️', nome: 'In viaggio',
    come: n => n === 1 ? 'Supera la prima tappa di English' : `Supera ${n} tappe di English`,
    soglie: [1, 6, 13], valore: m => m.tappeEn() },
  { id: 'verbi-imparati', area: 'inglese', emoji: '🎧', nome: 'Orecchio fino',
    come: n => `Impara ${n} verbi`,
    soglie: [5, 15, 30], valore: m => m.imparati('verbo:') },
  { id: 'verbi-giuste', area: 'inglese', emoji: '🔁', nome: 'Coniugatore',
    come: n => `Rispondi giusto ${n} volte sui verbi`,
    soglie: [30, 150, 500], valore: m => m.tot('verbi') },
  { id: 'frasi-imparate', area: 'inglese', emoji: '💬', nome: 'Chi parla inglese',
    come: n => `Impara ${n} frasi intere`,
    soglie: [5, 25, 80], valore: m => m.imparati('frase:') },
  { id: 'frasi-giuste', area: 'inglese', emoji: '🗣️', nome: 'Botta e risposta',
    come: n => `Rispondi giusto ${n} volte sulle frasi`,
    soglie: [20, 100, 400], valore: m => m.tot('frasi') },

  // ---------- Español ---------- gli stessi traguardi dell'inglese, con id propri: due lingue non si sommano
  { id: 'es-parole', area: 'spagnolo', emoji: '🔤', nome: 'Vocabulario',
    come: n => `Impara ${n} parole spagnole`,
    soglie: [10, 50, 150], valore: m => m.imparati('es:') },
  { id: 'es-giuste', area: 'spagnolo', emoji: '💬', nome: 'Parlantina',
    come: n => `Rispondi giusto ${n} volte in Español`,
    soglie: [50, 250, 1000], valore: m => m.tot('es') },
  { id: 'es-categorie', area: 'spagnolo', emoji: '🗂️', nome: 'Giro del mondo',
    come: n => `Impara almeno 3 parole spagnole in ${n} categorie diverse`,
    soglie: [3, 6, 9], valore: m => m.categorieEs(3) },
  { id: 'es-campagna', area: 'spagnolo', emoji: '🗺️', nome: 'In viaggio',
    come: n => n === 1 ? 'Supera la prima tappa di Español' : `Supera ${n} tappe di Español`,
    soglie: [1, 6, 13], valore: m => m.tappeEs() },
  { id: 'es-verbi', area: 'spagnolo', emoji: '🎧', nome: 'Orecchio fino',
    come: n => `Impara ${n} verbi spagnoli`,
    soglie: [5, 15, 30], valore: m => m.imparati('verbo-es:') },
  { id: 'es-frasi', area: 'spagnolo', emoji: '🗣️', nome: 'Chi parla spagnolo',
    come: n => `Impara ${n} frasi spagnole intere`,
    soglie: [5, 25, 80], valore: m => m.imparati('frase-es:') },
  { id: 'es-frasi-giuste', area: 'spagnolo', emoji: '🔁', nome: 'Botta e risposta',
    come: n => `Rispondi giusto ${n} volte sulle frasi spagnole`,
    soglie: [20, 100, 400], valore: m => m.tot('frasiEs') },
  // l'unico traguardo con un grado solo: quello che il gioco è venuto a fare, parlare con la mamma
  { id: 'es-mamma', area: 'spagnolo', emoji: '💛', nome: 'Ahora hablo con mamá',
    come: () => 'Impara 20 frasi spagnole e supera sei tappe',
    soglie: [1], valore: m => (m.imparati('frase-es:') >= 20 && m.tappeEs() >= 6 ? 1 : 0) },

  // ---------- Difendi il Castello ---------- le soglie sono i confini delle tre campagne, non tre numeri qualsiasi
  { id: 'td-tappe', area: 'torri', emoji: '🗺️', nome: 'La campagna',
    come: n => n === 1 ? 'Supera la prima tappa'
                       : n === 15 ? 'Finisci tutte e quindici le tappe'
                       : `Supera ${n} tappe`,
    soglie: [1, 5, 15], valore: m => m.tappe() },
  { id: 'td-torri', area: 'torri', emoji: '🗼', nome: 'Costruttore',
    come: n => `Costruisci ${n} torri`,
    soglie: [10, 60, 250], valore: m => m.tot('torri') },
  { id: 'td-perfette', area: 'torri', emoji: '⭐', nome: 'Senza sbavature',
    come: n => `Risolvi ${n} operazioni senza un errore`,
    soglie: [5, 30, 120], valore: m => m.tot('perfette') },
  { id: 'td-onda', area: 'torri', emoji: '🌊', nome: 'Resisti!',
    come: n => `Arriva all'ondata ${n} in una partita`,
    soglie: [5, 15, 30], valore: m => m.best('onda') },
  { id: 'td-quattro', area: 'torri', emoji: '➗', nome: 'Le quattro operazioni',
    come: n => n === 4 ? 'Diventa sicuro in tutte e quattro le operazioni'
                       : `Diventa sicuro in ${n} operazioni`,
    soglie: [2, 4], valore: m => m.imparati('op:') },

  // ---------- La bancarella ----------
  { id: 'banco-clienti', area: 'bancarella', emoji: '🧾', nome: 'Bottegaio',
    come: n => `Servi ${n} clienti`,
    soglie: [10, 60, 250], valore: m => m.tot('clienti') },
  { id: 'banco-perfetti', area: 'bancarella', emoji: '✨', nome: 'Resto preciso',
    come: n => `Dai ${n} resti col minor numero di monete`,
    soglie: [5, 30, 120], valore: m => m.tot('restiPerfetti') },
  { id: 'banco-fasce', area: 'bancarella', emoji: '🪙', nome: 'Cassiere provetto',
    come: n => n === 5 ? 'Cavatela con ogni resto, centesimi compresi'
                       : `Diventa sicuro su ${n} tipi di resto`,
    soglie: [2, 4, 5], valore: m => m.imparati('bancarella:') },
  { id: 'banco-giornata', area: 'bancarella', emoji: '🛒', nome: 'Giornata piena',
    come: n => `Servi ${n} clienti prima di chiudere`,
    soglie: [5, 12, 25], valore: m => m.best('clienti') },
  { id: 'banco-mercati', area: 'bancarella', emoji: '🧺', nome: 'Giro di mercato',
    come: n => n === 1 ? 'Finisci la prima giornata di mercato'
                       : `Finisci ${n} giornate di mercato`,
    soglie: [1, 3, 6], valore: m => m.tot('mercati') },
  { id: 'banco-incasso', area: 'bancarella', emoji: '💰', nome: 'Cassa d\'oro',
    come: n => `Incassa ${Math.round(n / 100)} € in tutto`,
    soglie: [10000, 50000, 200000], valore: m => m.tot('incasso') },

  // ---------- Il generale ---------- non quante volte si è indovinato, quante volte ci si è arrivati da soli
  { id: 'gen-livelli', area: 'generale', emoji: '🎖️', nome: 'Sul campo',
    come: n => n === 1 ? 'Supera il primo livello del generale'
                       : `Supera ${n} livelli del generale`,
    soglie: [1, 5, 12], valore: m => m.tot('missioni') },
  // id resta gen-par anche se il par non c'è più: è la chiave del badge salvato nei profili, cambiarla lo azzererebbe
  { id: 'gen-par', area: 'generale', emoji: '🎯', nome: 'Ci sono arrivato da solo',
    come: n => n === 1 ? 'Vinci un livello senza farti svelare niente'
                       : `Vinci ${n} livelli senza farti svelare niente`,
    soglie: [1, 6, 20], valore: m => m.tot('daSolo') },
  // la riga che il gioco è venuto a insegnare: dire una volta sola una cosa che va fatta cento volte
  { id: 'gen-avanzati', area: 'generale', emoji: '🔁', nome: 'Non lo ripeto due volte',
    come: n => n === 1 ? 'Vinci un livello con un ordine che si ripete o che aspetta'
                       : `Vinci ${n} livelli con un ordine di alto livello`,
    soglie: [1, 10, 40], valore: m => m.tot('avanzati') },
  { id: 'gen-stelle', area: 'generale', emoji: '⭐', nome: 'Petto di stelle',
    come: n => `Raccogli ${n} stelle sul campo`,
    soglie: [10, 30, 60], valore: m => m.stelleGen() },
  { id: 'gen-campagna', area: 'generale', emoji: '🏁', nome: 'Generale in capo',
    come: () => 'Finisci tutti i livelli della campagna',
    soglie: [1], valore: m => m.campagnaGen() },

  // ---------- trasversali ----------
  { id: 'all-serie', area: 'tutti', emoji: '🔥', nome: 'Ogni giorno',
    come: n => `Gioca ${n} giorni di fila`,
    soglie: [3, 7, 30], valore: m => m.best('serieGiorni') },
  // le soglie non seguono il numero di giochi: alzarle farebbe retrocedere chi l'oro ce l'ha già (si ricalcola ogni volta)
  { id: 'all-tuttofare', area: 'tutti', emoji: '🌈', nome: 'Tuttofare',
    come: n => `Prova ${n} giochi diversi`,
    soglie: [3, 5, 7], valore: m => m.giochiProvati() },
  { id: 'all-livello', area: 'tutti', emoji: '🎓', nome: 'Si sale',
    come: n => `Arriva al livello ${n}`,
    soglie: [3, 6, 12], valore: m => m.livello() },
  // id di quando stava fra i traguardi della cameretta: cambiarlo consegnerebbe la medaglia una seconda volta
  { id: 'room-monete', area: 'tutti', emoji: '🪙', nome: 'Salvadanaio',
    come: n => `Guadagna ${n} monete in tutto`,
    soglie: [100, 500, 2000], valore: m => m.tot('monete') },
]

const acceso = a => a !== 'generale' || GENERALE_ATTIVO
// i giochi nuovi vanno in fondo, prima dei trasversali (che parlano di tutti i giochi insieme)
const trasversale = a => a.id === 'tutti'
export const AREE = [
  ...AREE_TUTTE.filter(a => acceso(a.id) && !trasversale(a)),
  ...AREE_GIOCHI,
  ...AREE_TUTTE.filter(trasversale),
]
export const TRAGUARDI = [
  ...TRAGUARDI_TUTTI.filter(t => acceso(t.area) && t.area !== 'tutti'),
  ...TRAGUARDI_GIOCHI,
  ...TRAGUARDI_TUTTI.filter(t => t.area === 'tutti'),
]

export const traguardoDi = id => TRAGUARDI.find(t => t.id === id) || null
