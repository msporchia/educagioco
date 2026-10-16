// I pensieri dell'eroe (docs/sotterraneo/pensieri.md): quello che pensa ad alta voce, ogni tanto, in un fumetto sopra la testa.
// Dice cosa, non ordina: come sta («mi fa male tutto», «che buio») e cosa gli piacerebbe avere («vorrei tanto una torcia»,
// «mi hanno parlato di un arco nuovo, dal fabbro»), su misura dell'eroe e della sua strada. Mai un imperativo, mai un giudizio
// sull'oggetto. Dato puro: ogni pensiero ha la sua condizione sulla situazione (motore/pensieri.js, situazioneDi), i suoi testi
// e il segno che un tocco accende; il ritmo sta in RITMO. Un pensiero nuovo si aggiunge qui, con la sua riga in
// docs/sotterraneo/pensieri.md e i suoi casi in unita/sotterraneo-pensieri.

// `tono`: 'consiglio' (raro e leggero) o 'problema' (c'è qualcosa che non va: viene prima e torna un po' più spesso).
// `dove`: 'giu' (in una discesa) e/o 'sopra' (al villaggio). `quando`: 'entrata' (appena scesi in un piano) e/o 'cammino'
// (mentre si gira, fuori da ogni pannello). `se(s)`: null se no, o un oggetto con `variante` (quale fila di testi), `parole`
// (cosa va al posto dei {segnaposto}) e `segno` (cosa accende il tocco, se non è quello di sempre). `testi`: una fila, o una
// fila per variante. `segno`: 'zaino', 'eroe', 'abilita', 'incanti', 'pozione' (le caselle della barra) o 'mercante:<chiave>'
// (sopra: il mercante si illumina e l'eroe gli va accanto). Nessun segno: il fumetto non si tocca.
//
// I segnaposto (motore/pensieri.js, riempi): {o} la vocale dell'eroe (pronto, pronta); {arma} e {arma_nuova} il tipo d'arma della
// sua strada («un arco», «un arco nuovo»); {questa} l'arma che ha in mano («quest'arco»); {veste}, {veste_nuova}, {questa_veste}
// lo stesso per quello che porta addosso; {dal} il mercante («dal fabbro»); {cosa} un pezzo dello zaino («l'arco lungo»), {lo}
// il suo pronome; {car} una caratteristica («destrezza»), {piu} come si diventa («più svelta»); {abilita} e {incanto} il nome
// di un nodo dell'albero. Una frase che comincia con un segnaposto prende la maiuscola da sé.

// le soglie, in un posto solo (le usano le condizioni e i test)
export const SOGLIE = {
  vitaBassa: 0.4,          // sotto, «mi fa male tutto»
  vitaGrave: 0.35,         // sotto e senza cure, «a casa c'è un letto»
  vitaFonte: 0.6,          // sotto, la fonte vista gorgoglia
  vitaGrosso: 0.7,         // sotto, davanti al grosso sveglio
  energiaBassa: 0.25,
  vecchio: 3,              // livelli: un'arma (o una veste) di tanto sotto quella che l'eroe porterebbe è vecchia
  torciaCorta: 2,          // stanze: la fiamma si fa piccola
  torciaSopra: 3,          // stanze: sopra, una torcia così è già quasi finita
}

/* ── le parole della roba: il tipo d'arma di ogni strada (famiglia e mani, dati/strade.js), la veste di ogni classe, lo scudo e i
   gioielli. `un` è come si dice («un arco»), `nuova` col suo aggettivo accordato; `nome` e `genere` servono al test degli accordi;
   `base` è il pezzo di cui si guarda il prezzo e se l'eroe lo regge (dati/cose.js) ── */
export const TIPI_ARMA = {
  'spade:1': { un: 'una spada', nuova: 'una spada nuova', nome: 'spada', genere: 'f', base: 'spada' },
  'spade:2': { un: 'uno spadone', nuova: 'uno spadone nuovo', nome: 'spadone', genere: 'm', base: 'spadone' },
  'asce:1': { un: 'un\'ascia', nuova: 'un\'ascia nuova', nome: 'ascia', genere: 'f', base: 'scure' },
  'asce:2': { un: 'un\'ascia a due mani', nuova: 'una nuova ascia a due mani', nome: 'ascia', genere: 'f', base: 'ascia' },
  'archi:2': { un: 'un arco', nuova: 'un arco nuovo', nome: 'arco', genere: 'm', base: 'arco-lungo' },
  'bacchette:1': { un: 'una bacchetta', nuova: 'una bacchetta nuova', nome: 'bacchetta', genere: 'f', base: 'verga' },
  'bacchette:2': { un: 'un bastone magico', nuova: 'un bastone magico nuovo', nome: 'bastone', genere: 'm', base: 'bastone-magico' },
}
// la veste della famiglia che la classe porta (dati/eroi.js, porta): il ferro dal fabbro, la stoffa dall'incantatrice
export const TIPI_VESTE = {
  ferro: { un: 'una corazza', nuova: 'una corazza nuova', nome: 'corazza', genere: 'f', base: 'corazza', mercante: 'armaiolo' },
  stoffa: { un: 'un mantello', nuova: 'un mantello nuovo', nome: 'mantello', genere: 'm', base: 'manto', mercante: 'incantatrice' },
}
export const SCUDO = { un: 'uno scudo', nome: 'scudo', genere: 'm', base: 'scudo-legno' }
export const GIOIELLI = {
  dito: { un: 'un anello', nome: 'anello', genere: 'm', base: 'anello-verde' },
  collo: { un: 'un amuleto', nome: 'amuleto', genere: 'm', base: 'amuleto-azzurro' },
}
// chi vende cosa, detto come lo dice un bambino (dati/mercanti.js): le bacchette e la stoffa l'incantatrice, il resto il fabbro
export const MERCANTI_DETTI = {
  armaiolo: { dal: 'dal fabbro' },
  incantatrice: { dal: 'dall\'incantatrice' },
  erborista: { dal: 'dalla guaritrice' },
  rigattiere: { dal: 'dal mercante' },
}
// come si diventa dando un punto a una caratteristica (dati/livelli.js): {o} si accorda con l'eroe
export const DIVENTARE = { forza: 'più forte', destrezza: 'più svelt{o}', intelligenza: 'più sapiente', tempra: 'più robust{o}' }
// l'elfa è una lei: le altre classi sono lui (dati/eroi.js)
export const GENERE_EROE = { elfa: 'f' }

export const PENSIERI = [
  /* ── la luce ── */
  { id: 'senza-torcia', tono: 'consiglio', dove: ['giu'], quando: ['entrata'], icona: '🔥',
    se: s => (!s.torcia.accesa && !s.torcia.scorta ? {} : null),
    testi: ['Vorrei tanto avere una torcia, qui sotto.',
            'Che buio… con una torcia in mano sarebbe tutto un altro posto.',
            'Vedo appena i miei piedi. Ah, se avessi una torcia!'] },
  { id: 'torcia-corta', tono: 'problema', dove: ['giu'], quando: ['cammino'], icona: '🔥',
    se: s => (s.torcia.accesa && s.torcia.resta <= SOGLIE.torciaCorta && !s.torcia.scorta ? {} : null),
    testi: ['La mia torcia si sta spegnendo… e un\'altra non ce l\'ho.',
            'Questa fiamma è sempre più piccola. Ne vorrei una di scorta.'] },
  { id: 'torcia-sopra', tono: 'consiglio', dove: ['sopra'], quando: ['cammino'], icona: '🔥', segno: 'mercante:erborista',
    se: s => {
      if (s.torcia.scorta || s.gemme < s.prezzi.torcia || !s.mercanti.has('erborista')) return null
      if (!s.torcia.accesa) return { variante: 'senza' }
      return s.torcia.resta <= SOGLIE.torciaSopra ? { variante: 'corta' } : null
    },
    testi: {
      senza: ['Ho sentito che la guaritrice vende torce. Laggiù farebbe meno buio.',
              'Laggiù è buio buio… mi piacerebbe tanto avere una torcia.'],
      corta: ['La mia torcia è quasi finita. Dalla guaritrice ne ho viste di nuove.'],
    } },

  /* ── le gemme e la roba della strada ── */
  { id: 'arma-vecchia', tono: 'problema', dove: ['sopra', 'giu'], quando: ['cammino'], icona: '⚔️',
    se: s => {
      const a = s.arma
      if (!a.tipo || !a.vecchia || s.gemme < a.prezzo) return null
      if (s.luogo === 'sopra' && !s.mercanti.has(a.mercante)) return null
      return { variante: a.k ? 'vecchia' : 'mani', parole: { arma: a.tipo.un, arma_nuova: a.tipo.nuova, questa: a.questa, dal: a.dal },
               segno: s.luogo === 'sopra' ? `mercante:${a.mercante}` : null }
    },
    testi: {
      vecchia: ['Ho la tasca piena di gemme e {questa} non mi basta più: {dal} avranno qualcosa di meglio.',
                'Mi hanno parlato di {arma_nuova}, {dal}. Sarebbe proprio bello, con tutte queste gemme.'],
      mani: ['Ho la tasca piena di gemme e le mani vuote. Mi hanno parlato di {arma}, {dal}.',
             'Senza niente in mano mi sento strano. Sarebbe bello avere {arma}.'],
    } },
  { id: 'veste-vecchia', tono: 'consiglio', dove: ['sopra'], quando: ['cammino'], icona: '🛡️',
    se: s => {
      const v = s.veste
      if (!v.tipo || !v.vecchia || s.gemme < v.prezzo || !s.mercanti.has(v.mercante)) return null
      return { variante: v.k ? 'vecchia' : 'niente', parole: { veste: v.tipo.un, veste_nuova: v.tipo.nuova, questa_veste: v.questa, dal: v.dal },
               segno: `mercante:${v.mercante}` }
    },
    testi: {
      vecchia: ['{questa_veste} ha visto giorni migliori. Mi hanno parlato di {veste_nuova}, {dal}.',
                'Sento ogni graffio, con {questa_veste}. Sarebbe bello avere {veste_nuova}.'],
      niente: ['Senza niente addosso, ogni graffio si sente. Mi hanno parlato di {veste}, {dal}.',
               'Mi sento così legger{o}, senza {veste}…'],
    } },
  { id: 'mano-libera', tono: 'consiglio', dove: ['sopra'], quando: ['cammino'], icona: '🛡️', segno: 'mercante:armaiolo',
    se: s => (s.scudo.serve && s.gemme >= s.scudo.prezzo && s.mercanti.has('armaiolo') ? {} : null),
    testi: ['Dal fabbro ho visto uno scudo… la mia mano libera starebbe più tranquilla.',
            'Ho una mano che non fa niente tutto il giorno. Con uno scudo mi sentirei più al sicuro.'] },
  { id: 'posto-libero', tono: 'consiglio', dove: ['sopra'], quando: ['cammino'], icona: '💍', segno: 'mercante:rigattiere',
    se: s => {
      if (!s.mercanti.has('rigattiere') || s.gemme < s.prezzi.gioiello) return null
      if (s.liberi.dito) return { variante: 'dito' }
      return s.liberi.collo ? { variante: 'collo' } : null
    },
    testi: {
      dito: ['Dal mercante ho visto un anello… starebbe bene al mio dito.',
             'Il mio dito è così nudo… sarebbe bello avere un anello.'],
      collo: ['Dal mercante ho visto un amuleto… starebbe bene al mio collo.',
              'Il mio collo è così nudo… mi piacerebbe un amuleto.'],
    } },
  { id: 'tasca-in-piu', tono: 'consiglio', dove: ['sopra'], quando: ['cammino'], icona: '💎', segno: 'zaino',
    se: s => (s.posti >= s.capienza - 1 && s.prezzi.tasca != null && s.gemme >= s.prezzi.tasca * 2 ? {} : null),
    testi: ['Ho tante gemme e uno zaino stretto stretto: una tasca in più sarebbe comoda.'] },

  /* ── lo zaino ── */
  { id: 'da-mettere', tono: 'problema', dove: ['giu', 'sopra'], quando: ['cammino'], icona: '🎁', segno: 'zaino',
    se: s => (s.daMettere ? { parole: { cosa: s.daMettere.detto } } : null),
    testi: ['Nello zaino ho {cosa}, e adesso è proprio della mia misura!',
            'Mi sento abbastanza grande per {cosa} che ho nello zaino.'] },
  { id: 'manca-caratteristica', tono: 'consiglio', dove: ['giu', 'sopra'], quando: ['cammino'], icona: '⭐',
    se: s => (s.mancaCar ? { parole: { cosa: s.mancaCar.detto, lo: s.mancaCar.lo, car: s.mancaCar.car }, segno: s.puntiEroe > 0 ? 'eroe' : null } : null),
    testi: ['Nello zaino ho {cosa}, ma mi servirebbe un po\' più di {car} per tener{lo}.',
            'Ah, se avessi un po\' più di {car}… potrei usare {cosa}.'] },
  { id: 'non-fa-per-me', tono: 'consiglio', dove: ['sopra'], quando: ['cammino'], icona: '🧺', segno: 'mercante:rigattiere',
    se: s => (s.nonPerMe && s.mercanti.has('rigattiere') ? { parole: { cosa: s.nonPerMe.detto } } : null),
    testi: ['Porto in giro {cosa}, e non è roba per me. Il mercante si prende di tutto.',
            'Nello zaino ho {cosa}, ma io non so proprio che farmene.'] },
  { id: 'zaino-pieno', tono: 'consiglio', dove: ['giu'], quando: ['cammino'], icona: '🧺', segno: 'zaino',
    se: s => (s.posti >= s.capienza ? {} : null),
    testi: ['Lo zaino è pieno: quello che trovo resta per terra.',
            'Ancora una cosa e lo zaino scoppia.'] },
  { id: 'zaino-al-mercato', tono: 'consiglio', dove: ['sopra'], quando: ['cammino'], icona: '🧺', segno: 'mercante:rigattiere',
    se: s => (s.posti >= s.capienza - 1 && s.vendibili >= 2 && s.mercanti.has('rigattiere') ? {} : null),
    testi: ['Il mio zaino pesa come un mulo… e il mercante si prende di tutto.',
            'Quanta roba che non uso. Ho sentito che il mercante la paga in gemme.'] },
  { id: 'chiave-porta', tono: 'consiglio', dove: ['giu'], quando: ['cammino'], icona: '🗝️', segno: 'zaino',
    se: s => (s.chiaveEPorta ? {} : null),
    testi: ['Ho una chiave in tasca, e là c\'era una porta chiusa…',
            'Quella porta chiusa… e io con una chiave in tasca.'] },
  { id: 'elisir', tono: 'consiglio', dove: ['giu', 'sopra'], quando: ['cammino'], icona: '🐂', segno: 'zaino',
    se: s => (s.elisir ? {} : null),
    testi: ['Ho un elisir del toro nello zaino. Chissà come mi sentirei, a berlo.',
            'Ho sentito che l\'elisir del toro fa più robusti per sempre.'] },

  /* ── crescere ── */
  { id: 'punti-eroe', tono: 'consiglio', dove: ['giu', 'sopra'], quando: ['cammino'], icona: '⭐', segno: 'eroe',
    se: s => (s.puntiEroe > 0 && s.prossimoPunto ? { parole: { piu: DIVENTARE[s.prossimoPunto] } } : null),
    testi: ['Mi sento pront{o} a diventare {piu}: avrei dei punti da usare.',
            'Sento una forza nuova. Ah, diventare un po\' {piu}…'] },
  { id: 'punti-abilita', tono: 'consiglio', dove: ['giu', 'sopra'], quando: ['cammino'], icona: '✨', segno: 'abilita',
    se: s => (s.puntiAbilita > 0 && s.prossimaAbilita ? { parole: { abilita: s.prossimaAbilita } } : null),
    testi: ['Mi frulla in testa «{abilita}»… avrei un punto da usare.',
            'Ho sentito parlare di «{abilita}». Chissà se sono pront{o}.'] },
  { id: 'incanto', tono: 'consiglio', dove: ['giu'], quando: ['cammino'], icona: '🔮', segno: 'incanti',
    se: s => (s.incanto && !s.incantiAddosso ? { parole: { incanto: s.incanto } } : null),
    testi: ['La magia mi pizzica le dita. Con «{incanto}» addosso mi sentirei più tranquill{o}.',
            'Sento la magia che aspetta… «{incanto}» prima del prossimo mostro sarebbe bello.'] },

  /* ── le ferite ── */
  { id: 'mi-fa-male', tono: 'problema', dove: ['giu'], quando: ['cammino'], icona: '🧪', segno: 'pozione',
    se: s => (s.quota <= SOGLIE.vitaBassa && s.cure > 0 ? {} : null),
    testi: ['Mi fa male tutto… mi ci vorrebbe proprio una pozione.',
            'Ahi, che botte. Per fortuna nello zaino ho una pozione.'] },
  { id: 'prima-del-grosso', tono: 'problema', dove: ['giu'], quando: ['cammino'], icona: '🧪', segno: 'pozione',
    se: s => (s.grossoSveglio && s.quota < SOGLIE.vitaGrosso && s.quota > SOGLIE.vitaBassa && s.cure > 0 ? {} : null),
    testi: ['Quel bestione mi fa paura, e io sono già ammaccat{o}. Mi ci vorrebbe una pozione.',
            'Che bestione… e io ho già qualche livido. Per fortuna ho una pozione.'] },
  { id: 'letto-a-casa', tono: 'problema', dove: ['giu'], quando: ['entrata', 'cammino'], icona: '❤️',
    se: s => (s.quota <= SOGLIE.vitaGrave && s.cure === 0 ? {} : null),
    testi: ['Sono stanc{o} e senza pozioni… lassù la guaritrice mi rimetterebbe in piedi.',
            'Forse a casa c\'è un letto che mi aspetta. E una guaritrice.'] },
  { id: 'gorgoglio', tono: 'consiglio', dove: ['giu'], quando: ['cammino'], icona: '⛲',
    se: s => (s.quota <= SOGLIE.vitaFonte && s.fonteVista ? {} : null),
    testi: ['Sento il gorgoglio della fonte di prima… un sorso mi farebbe stare meglio.',
            'Che sete. Mi è sembrato di vedere una fonte, prima.'] },
  { id: 'senza-magia', tono: 'consiglio', dove: ['giu'], quando: ['cammino'], icona: '🔷', segno: 'zaino',
    se: s => (s.quotaEnergia <= SOGLIE.energiaBassa && s.pozioneBlu && s.abilitaImparate > 0 ? {} : null),
    testi: ['Sono senza magia… e nello zaino ho una pozione blu.'] },
  { id: 'senza-cure', tono: 'problema', dove: ['sopra'], quando: ['cammino'], icona: '🧪', segno: 'mercante:erborista',
    se: s => (s.cure === 0 && s.gemme >= s.prezzi.cura && s.mercanti.has('erborista') ? {} : null),
    testi: ['Non ho nemmeno una pozione, e laggiù i mostri mordono.',
            'Dalla guaritrice ho visto tante pozioni… con una nello zaino mi sentirei più tranquill{o}.'] },

  /* ── il piano ── */
  { id: 'forziere', tono: 'consiglio', dove: ['giu'], quando: ['cammino'], icona: '🎁',
    se: s => (s.forziereVisto ? {} : null),
    testi: ['Chissà cosa c\'è in quel forziere che ho lasciato chiuso.',
            'Quel forziere di prima mi fa l\'occhiolino.'] },
]

export const PENSIERO = Object.fromEntries(PENSIERI.map(p => [p.id, p]))

// Il ritmo: «una compagnia che ogni tanto dice la cosa giusta», non un tutor. I tempi lunghi sono in millisecondi di
// orologio vero (la memoria sopravvive alla ripresa); quelli corti in secondi di gioco (fermo il gioco, fermo il conto)
export const RITMO = {
  nelGiro: 3,                 // pensieri al più in una discesa (o in una visita al villaggio)
  consigliNelGiro: 2,         // e di questi, consigli al più
  problemaNelGiro: 2,         // lo stesso problema, al più, in un giro
  pausa: 50 * 1000,           // fra due pensieri qualsiasi
  pausaEntrata: 4 * 1000,     // entrando in un piano basta meno: è il momento giusto
  ripetiConsiglio: 30 * 60 * 1000,   // un consiglio torna (in un altro giro) solo dopo mezz'ora
  ripetiProblema: 4 * 60 * 1000,     // un problema che resta torna dopo quattro minuti
  // in secondi di gioco
  dura: 5.5,                  // quanto resta il fumetto
  ogni: 2,                    // ogni quanto si guarda se c'è un pensiero
  primoCammino: 14,           // dall'inizio di un giro, prima del primo pensiero «cammino»
  primoEntrata: 1.2,          // entrando, il tempo di vedere dove si è
  primoSopra: 3,              // sopra, l'eroe fermo da tanto prima di pensare
  segno: 6,                   // quanto resta acceso il segno dopo un tocco sul fumetto
}

export const TONI = ['consiglio', 'problema']
export const LUOGHI = ['giu', 'sopra']
export const MOMENTI = ['entrata', 'cammino']
export const SEGNI = ['zaino', 'eroe', 'abilita', 'incanti', 'pozione']
// i mercanti a cui un segno può portare (dati/mercanti.js)
export const SEGNI_MERCANTE = Object.keys(MERCANTI_DETTI)

// cosa non va in un pensiero scritto: per unita/sotterraneo-pensieri (e per chi ne aggiunge uno)
export function guastiDeiPensieri() {
  const g = []
  const visti = new Set()
  for (const p of PENSIERI) {
    if (visti.has(p.id)) g.push(`${p.id}: id doppio`)
    visti.add(p.id)
    if (!TONI.includes(p.tono)) g.push(`${p.id}: tono «${p.tono}»`)
    if (!p.dove.length || p.dove.some(d => !LUOGHI.includes(d))) g.push(`${p.id}: dove`)
    if (!p.quando.length || p.quando.some(q => !MOMENTI.includes(q))) g.push(`${p.id}: quando`)
    if (p.quando.includes('entrata') && !p.dove.includes('giu')) g.push(`${p.id}: si entra solo giù`)
    if (typeof p.se !== 'function') g.push(`${p.id}: senza condizione`)
    if (!p.icona) g.push(`${p.id}: senza icona`)
    const file = Array.isArray(p.testi) ? [p.testi] : Object.values(p.testi || {})
    if (!file.length || file.some(f => !Array.isArray(f) || !f.length)) g.push(`${p.id}: testi`)
    if (p.segno && !SEGNI.includes(p.segno) && !(p.segno.startsWith('mercante:') && SEGNI_MERCANTE.includes(p.segno.slice(9))))
      g.push(`${p.id}: segno «${p.segno}»`)
    if (p.segno && p.segno.startsWith('mercante:') && p.dove.includes('giu')) g.push(`${p.id}: un mercante sta sopra`)
  }
  return g
}
