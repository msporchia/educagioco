// Un mondo è un posto più le creature e le cose che ci si trovano: il
// motore non cambia, cambia chi conta il bambino. Vedi docs/conta/regole.md.
//
// Una specie è { chiave, emoji, uno, tanti, genere, categoria }: `genere`
// serve alla concordanza italiana («quante capre», non «quanti capre»);
// `categoria` ('animali'|'cose') rende possibili le tappe sugli insiemi.

export const MONDI = {
  prato: {
    chiave: 'prato', nome: 'il prato', icona: '🌾', accento: '#65a30d',
    specie: [
      { chiave: 'pecora', emoji: '🐑', uno: 'pecora', tanti: 'pecore', genere: 'f', categoria: 'animali' },
      { chiave: 'capra',  emoji: '🐐', uno: 'capra',  tanti: 'capre',  genere: 'f', categoria: 'animali' },
      { chiave: 'mucca',  emoji: '🐄', uno: 'mucca',  tanti: 'mucche', genere: 'f', categoria: 'animali' },
      { chiave: 'albero', emoji: '🌳', uno: 'albero', tanti: 'alberi', genere: 'm', categoria: 'cose' },
      { chiave: 'fiore',  emoji: '🌷', uno: 'fiore',  tanti: 'fiori',  genere: 'm', categoria: 'cose' },
      { chiave: 'sasso',  emoji: '🪨', uno: 'sasso',  tanti: 'sassi',  genere: 'm', categoria: 'cose' },
    ],
  },
  pollaio: {
    chiave: 'pollaio', nome: 'il pollaio', icona: '🥚', accento: '#ca8a04',
    specie: [
      { chiave: 'gallina', emoji: '🐔', uno: 'gallina', tanti: 'galline', genere: 'f', categoria: 'animali' },
      { chiave: 'pulcino', emoji: '🐤', uno: 'pulcino', tanti: 'pulcini', genere: 'm', categoria: 'animali' },
      { chiave: 'papera',  emoji: '🦆', uno: 'papera',  tanti: 'papere',  genere: 'f', categoria: 'animali' },
      { chiave: 'uovo',    emoji: '🥚', uno: 'uovo',    tanti: 'uova',    genere: 'm', categoria: 'cose' },
      { chiave: 'grano',   emoji: '🌾', uno: 'chicco',  tanti: 'chicchi', genere: 'm', categoria: 'cose' },
      { chiave: 'cesto',   emoji: '🧺', uno: 'cesto',   tanti: 'cesti',   genere: 'm', categoria: 'cose' },
    ],
  },
  stagno: {
    chiave: 'stagno', nome: 'lo stagno', icona: '💧', accento: '#0e9bbd',
    specie: [
      { chiave: 'rana',      emoji: '🐸', uno: 'rana',       tanti: 'rane',        genere: 'f', categoria: 'animali' },
      { chiave: 'pesceStagno', emoji: '🐟', uno: 'pesce',    tanti: 'pesci',       genere: 'm', categoria: 'animali' },
      { chiave: 'tartaruga', emoji: '🐢', uno: 'tartaruga',  tanti: 'tartarughe',  genere: 'f', categoria: 'animali' },
      // quarta bestia apposta: qui vive la tappa dell'inclusione, e tre
      // sole specie animali lascerebbero al motore una scelta sola quando
      // deve cambiare (vedi `sceltaSpecie` in `motore/scena.js`)
      { chiave: 'cigno',     emoji: '🦢', uno: 'cigno',      tanti: 'cigni',       genere: 'm', categoria: 'animali' },
      { chiave: 'foglia',    emoji: '🍃', uno: 'foglia',     tanti: 'foglie',      genere: 'f', categoria: 'cose' },
      { chiave: 'sassoStagno', emoji: '🪨', uno: 'sasso',    tanti: 'sassi',       genere: 'm', categoria: 'cose' },
      { chiave: 'nuvola',    emoji: '☁️', uno: 'nuvola',     tanti: 'nuvole',      genere: 'f', categoria: 'cose' },
    ],
  },
  bosco: {
    chiave: 'bosco', nome: 'il bosco', icona: '🌲', accento: '#166534',
    specie: [
      { chiave: 'volpe',      emoji: '🦊', uno: 'volpe',      tanti: 'volpi',       genere: 'f', categoria: 'animali' },
      { chiave: 'cervo',      emoji: '🦌', uno: 'cervo',      tanti: 'cervi',       genere: 'm', categoria: 'animali' },
      { chiave: 'scoiattolo', emoji: '🐿️', uno: 'scoiattolo', tanti: 'scoiattoli',  genere: 'm', categoria: 'animali' },
      { chiave: 'pino',       emoji: '🌲', uno: 'pino',       tanti: 'pini',        genere: 'm', categoria: 'cose' },
      { chiave: 'fungo',      emoji: '🍄', uno: 'fungo',      tanti: 'funghi',      genere: 'm', categoria: 'cose' },
      { chiave: 'fogliaSecca', emoji: '🍂', uno: 'foglia secca', tanti: 'foglie secche', genere: 'f', categoria: 'cose' },
    ],
  },
  mare: {
    chiave: 'mare', nome: 'il mare', icona: '🌊', accento: '#0369a1',
    specie: [
      { chiave: 'pesceMare', emoji: '🐠', uno: 'pesce',     tanti: 'pesci',     genere: 'm', categoria: 'animali' },
      { chiave: 'polpo',     emoji: '🐙', uno: 'polpo',     tanti: 'polpi',     genere: 'm', categoria: 'animali' },
      { chiave: 'granchio',  emoji: '🦀', uno: 'granchio',  tanti: 'granchi',   genere: 'm', categoria: 'animali' },
      { chiave: 'conchiglia', emoji: '🐚', uno: 'conchiglia', tanti: 'conchiglie', genere: 'f', categoria: 'cose' },
      { chiave: 'corallo',   emoji: '🪸', uno: 'corallo',   tanti: 'coralli',   genere: 'm', categoria: 'cose' },
      { chiave: 'sassoMare', emoji: '🪨', uno: 'sasso',     tanti: 'sassi',     genere: 'm', categoria: 'cose' },
    ],
  },
  // nessuna bestia apposta: è il mondo delle tappe che non parlano di
  // animali, e tenerlo senza ne fa un vestito davvero diverso
  mercato: {
    chiave: 'mercato', nome: 'il mercato', icona: '🧺', accento: '#dc2626',
    specie: [
      { chiave: 'mela',     emoji: '🍎', uno: 'mela',     tanti: 'mele',     genere: 'f', categoria: 'cose' },
      { chiave: 'pera',     emoji: '🍐', uno: 'pera',     tanti: 'pere',     genere: 'f', categoria: 'cose' },
      { chiave: 'carota',   emoji: '🥕', uno: 'carota',   tanti: 'carote',   genere: 'f', categoria: 'cose' },
      { chiave: 'banana',   emoji: '🍌', uno: 'banana',   tanti: 'banane',   genere: 'f', categoria: 'cose' },
      { chiave: 'uva',      emoji: '🍇', uno: 'grappolo', tanti: 'grappoli', genere: 'm', categoria: 'cose' },
      { chiave: 'pomodoro', emoji: '🍅', uno: 'pomodoro', tanti: 'pomodori', genere: 'm', categoria: 'cose' },
    ],
  },
}

export const CHIAVI_MONDI = Object.keys(MONDI)

export const mondo = chiave => MONDI[chiave] || MONDI[CHIAVI_MONDI[0]]

// La faccia con cui un mondo si presenta sulla carta della tappa: la sua
// prima bestia, non il paesaggio — chi sceglie la tappa spesso non legge.
export const facciaDi = chiave => {
  const m = MONDI[chiave]
  if (!m) return '❓'
  return (m.specie.find(s => s.categoria === 'animali') || {}).emoji || m.icona
}

export const specieDi = (m, categoria) =>
  m.specie.filter(s => categoria === 'qualunque' || s.categoria === categoria)

export function guastiDeiMondi(mondi = MONDI) {
  const guasti = []
  const chiaviSpecie = new Map()   // chiave specie → dove l'ho già vista
  for (const [chiave, m] of Object.entries(mondi)) {
    const dove = `mondo "${chiave}"`
    if (!m.nome || !m.icona) guasti.push(`${dove}: senza nome o senza icona`)
    if (!/^#[0-9a-f]{6}$/i.test(m.accento || '')) guasti.push(`${dove}: accento "${m.accento}" non è un colore`)
    if (!Array.isArray(m.specie) || m.specie.length < 3)
      guasti.push(`${dove}: ${m.specie?.length || 0} specie, ne servono almeno tre`)
    const visteQui = new Set()
    for (const s of m.specie || []) {
      const doveS = `${dove}, specie "${s.chiave}"`
      if (!s.emoji || !s.uno || !s.tanti) guasti.push(`${doveS}: senza emoji, "uno" o "tanti"`)
      if (s.genere !== 'm' && s.genere !== 'f')
        guasti.push(`${doveS}: genere "${s.genere}" non è "m" né "f"`)
      if (s.categoria !== 'animali' && s.categoria !== 'cose')
        guasti.push(`${doveS}: categoria "${s.categoria}" non è "animali" né "cose"`)
      if (visteQui.has(s.chiave)) guasti.push(`${doveS}: chiave ripetuta dentro il mondo`)
      visteQui.add(s.chiave)
      // una chiave di specie è un id del gioco, come `en:dog`: non è
      // pensata per ripetersi fra un mondo e l'altro
      if (chiaviSpecie.has(s.chiave))
        guasti.push(`${doveS}: già usata in "${chiaviSpecie.get(s.chiave)}"`)
      else chiaviSpecie.set(s.chiave, chiave)
    }
  }
  return guasti
}
