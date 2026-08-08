/* ═══════════════════════════════════════════════════════════════════
   LA MACCHINA DELLE SORPRESE

   Sei serie di accessori da mettere addosso agli animali. Una capsula per
   volta, dalla serie a cui si è arrivati; finita una serie si apre la
   successiva, e il prezzo sale. È il pozzo senza fondo dove finiscono le
   monete che avanzano: completarle tutte costa più di quindici volte
   l'intero negozio della cameretta.

   Due regole che valgono più di qualsiasi bilanciamento:

   1. NIENTE DOPPIONI. La capsula pesca fra i pezzi della serie che ancora
      mancano, quindi esce sempre qualcosa di nuovo. È la sorpresa
      dell'ovetto, non una slot machine: si paga per l'attesa di scoprire
      QUALE pezzo, mai per il rischio di buttare via le monete.
   2. LA PRIMA È OFFERTA DALLA CASA. Una macchina di cui non hai mai visto
      l'effetto non la provi; vedere un cappello comparire su Watson vale
      più di qualsiasi spiegazione.

   Aggiungere una serie è aggiungere una riga qui sotto: nessun'altra parte
   del gioco va toccata.
   ═══════════════════════════════════════════════════════════════════ */

/* Dove si può portare qualcosa. Un posto per accessorio, quattro per
   animale: così vestirne tre diversi ha senso e vale la pena averne tanti. */
export const POSTI = [
  { k: 'testa',   nome: 'In testa' },
  { k: 'occhi',   nome: 'Sugli occhi' },
  { k: 'collo',   nome: 'Al collo' },
  { k: 'schiena', nome: 'Sulla schiena' },
]

export const SERIE = [
  {
    id: 'sport', nome: 'Sportivi', emoji: '🏅', costo: 30,
    pezzi: [
      { e: '🧢', nome: 'Cappellino',   posto: 'testa' },
      { e: '⛑️', nome: 'Caschetto',    posto: 'testa' },
      { e: '🥽', nome: 'Occhialini',   posto: 'occhi' },
      { e: '🕶️', nome: 'Occhiali neri', posto: 'occhi' },
      { e: '🥇', nome: 'Medaglia d\'oro',     posto: 'collo' },
      { e: '🥈', nome: 'Medaglia d\'argento', posto: 'collo' },
      { e: '🥉', nome: 'Medaglia di bronzo',  posto: 'collo' },
      { e: '🎽', nome: 'Pettorina',    posto: 'collo' },
      { e: '🎒', nome: 'Zainetto',     posto: 'schiena' },
      { e: '⚽', nome: 'Pallone',      posto: 'schiena' },
      { e: '🏀', nome: 'Palla a spicchi', posto: 'schiena' },
      { e: '🏓', nome: 'Racchetta',    posto: 'schiena' },
    ],
  },
  {
    id: 'spazio', nome: 'Spaziali', emoji: '🚀', costo: 55,
    pezzi: [
      { e: '🪐', nome: 'Saturno',      posto: 'testa' },
      { e: '⭐', nome: 'Stellina',     posto: 'testa' },
      { e: '🌀', nome: 'Vortice',      posto: 'testa' },
      { e: '👓', nome: 'Occhiali tondi', posto: 'occhi' },
      { e: '☄️', nome: 'Cometa',       posto: 'collo' },
      { e: '🧭', nome: 'Bussola',      posto: 'collo' },
      { e: '🔦', nome: 'Torcia',       posto: 'collo' },
      { e: '🛰️', nome: 'Satellite',    posto: 'schiena' },
      { e: '🌠', nome: 'Stella cadente', posto: 'schiena' },
      { e: '🎇', nome: 'Fuochi',       posto: 'schiena' },
      { e: '🪄', nome: 'Bacchetta',    posto: 'schiena' },
      { e: '🌌', nome: 'Galassia',     posto: 'schiena' },
    ],
  },
  {
    id: 'mare', nome: 'Mare', emoji: '🌊', costo: 85,
    pezzi: [
      { e: '🐚', nome: 'Conchiglia',   posto: 'testa' },
      { e: '🌊', nome: 'Onda',         posto: 'testa' },
      { e: '⚓', nome: 'Ancora',       posto: 'testa' },
      { e: '🦀', nome: 'Granchietto',  posto: 'testa' },
      { e: '🤿', nome: 'Maschera',     posto: 'occhi' },
      { e: '🐡', nome: 'Pesce palla',  posto: 'collo' },
      { e: '🪸', nome: 'Corallo',      posto: 'collo' },
      { e: '🪼', nome: 'Medusa',       posto: 'collo' },
      { e: '🐙', nome: 'Polpo',        posto: 'schiena' },
      { e: '🐬', nome: 'Delfino',      posto: 'schiena' },
      { e: '🦈', nome: 'Pinna',        posto: 'schiena' },
      { e: '⛵', nome: 'Barchetta',    posto: 'schiena' },
    ],
  },
  {
    id: 'festa', nome: 'Festa', emoji: '🎉', costo: 120,
    pezzi: [
      { e: '🎩', nome: 'Cilindro',     posto: 'testa' },
      { e: '👑', nome: 'Corona',       posto: 'testa' },
      { e: '🎓', nome: 'Tocco',        posto: 'testa' },
      { e: '🤠', nome: 'Cappello da cowboy', posto: 'testa' },
      { e: '🎭', nome: 'Mascherina',   posto: 'occhi' },
      { e: '🎀', nome: 'Fiocco',       posto: 'collo' },
      { e: '📿', nome: 'Collana',      posto: 'collo' },
      { e: '🔔', nome: 'Campanello',   posto: 'collo' },
      { e: '🎗️', nome: 'Nastro',       posto: 'collo' },
      { e: '🎊', nome: 'Coriandoli',   posto: 'schiena' },
      { e: '🪅', nome: 'Pignatta',     posto: 'schiena' },
      { e: '🎁', nome: 'Regalo',       posto: 'schiena' },
    ],
  },
  {
    id: 'bosco', nome: 'Bosco', emoji: '🍂', costo: 170,
    pezzi: [
      { e: '🍄', nome: 'Fungo',        posto: 'testa' },
      { e: '🍁', nome: 'Foglia',       posto: 'testa' },
      { e: '🌻', nome: 'Girasole',     posto: 'testa' },
      { e: '🌺', nome: 'Fiore',        posto: 'testa' },
      { e: '🦋', nome: 'Farfalla',     posto: 'occhi' },
      { e: '🌰', nome: 'Ghianda',      posto: 'collo' },
      { e: '🍀', nome: 'Quadrifoglio', posto: 'collo' },
      { e: '🌿', nome: 'Rametto',      posto: 'collo' },
      { e: '🦉', nome: 'Gufetto',      posto: 'schiena' },
      { e: '🐝', nome: 'Ape',          posto: 'schiena' },
      { e: '🐌', nome: 'Lumaca',       posto: 'schiena' },
      { e: '🪺', nome: 'Nido',         posto: 'schiena' },
    ],
  },
  {
    id: 'notte', nome: 'Notte', emoji: '🌙', costo: 230,
    pezzi: [
      { e: '🌙', nome: 'Lunetta',      posto: 'testa' },
      { e: '🎃', nome: 'Zucca',        posto: 'testa' },
      { e: '🕯️', nome: 'Candelina',    posto: 'testa' },
      { e: '👻', nome: 'Fantasmino',   posto: 'testa' },
      { e: '💫', nome: 'Stelline',     posto: 'occhi' },
      { e: '🔮', nome: 'Sfera',        posto: 'collo' },
      { e: '🗝️', nome: 'Chiavetta',    posto: 'collo' },
      { e: '🧿', nome: 'Occhio turco', posto: 'collo' },
      { e: '💎', nome: 'Diamante',     posto: 'collo' },
      { e: '🦇', nome: 'Pipistrello',  posto: 'schiena' },
      { e: '☁️', nome: 'Nuvoletta',    posto: 'schiena' },
      { e: '🕸️', nome: 'Ragnatela',    posto: 'schiena' },
    ],
  },
]

export const TUTTI = SERIE.flatMap(s => s.pezzi)

export const serieDi = id => SERIE.find(s => s.id === id) || null
export const pezzoDi = e => TUTTI.find(p => p.e === e) || null
export const postoDi = e => pezzoDi(e)?.posto || null
export const serieDelPezzo = e => SERIE.find(s => s.pezzi.some(p => p.e === e)) || null

/* i pezzi di una serie che ancora non si hanno */
export const mancanti = (s, avuti) => s.pezzi.filter(p => !avuti.includes(p.e))

/* Estrae un pezzo a caso. La sorgente casuale si può passare da fuori,
   altrimenti il test non potrebbe essere lo stesso due volte di fila. */
export const estrai = (lista, rnd = Math.random) =>
  lista[Math.min(lista.length - 1, Math.floor(rnd() * lista.length))]

/* quanto costa completare una serie, e quanto costa arrivare in fondo */
export const costoSerie = s => s.costo * s.pezzi.length
export const costoTotale = () => SERIE.reduce((n, s) => n + costoSerie(s), 0)
