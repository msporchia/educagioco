/* ═══════════════════════════════════════════════════════════════════
   I MONDI — dove si conta

   Un mondo è un vestito: un posto (il prato, il pollaio...) più le
   creature e le cose che ci si trovano dentro. Il motore non cambia mai:
   cambia chi conta il bambino. È lo stesso principio dei temi del
   Codice Segreto — nove vestiti diversi per lo stesso gioco — applicato
   qui a dodici tappe.

   Una specie è `{ chiave, emoji, uno, tanti, genere, categoria }`:

     chiave      l'id, univoco in tutto il gioco (non solo nel mondo)
     emoji       il disegno, grande e toccabile
     uno, tanti  come si legge («una capra», «tre capre») — per la
                 striscia scritta piccola sotto la consegna iconica
     genere      'm' | 'f', e serve a scrivere in italiano: senza,
                 «quante» resta incollato addosso a tutti e viene fuori
                 «Quante alberi ci sono?». La frase la legge un genitore
                 ad alta voce, e domani sarà la voce incisa: una
                 concordanza sbagliata in un gioco che insegna si sente.
     categoria   'animali' | 'cose'

   La categoria è quello che rende possibili le tappe sugli insiemi
   (`quantiDi`, `insieme`, `inclusione`): «quanti animali in tutto»
   ha senso solo se nella scena c'è anche qualcosa che animale non è.
   Un mondo che deve ospitare quelle tappe vuole **almeno due specie
   animali e due specie di cose** — lo controlla `guastiDellaCampagna`,
   che sa quale verbo chiede cosa (vedi `verbi.js`).

   Il mercato non ha nessuna specie animale apposta: è il mondo per le
   tappe che non parlano di animali (`piuUno`, `unisci`), e tenerlo
   senza bestie è quello che lo rende un vestito diverso dagli altri
   invece di un prato con la frutta.
   ═══════════════════════════════════════════════════════════════════ */

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
      /* la quarta bestia dello stagno non è un vezzo: è lì che sta la
         tappa dell'inclusione, e un mondo con tre sole specie animali
         lascia al motore una scelta sola quando deve cambiare — vedi
         `sceltaSpecie` in `motore/scena.js` */
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
  /* nessuna bestia apposta: è il mondo delle tappe che non parlano di
     animali, e tenerlo senza ne fa un vestito davvero diverso */
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

/* La faccia con cui un mondo si presenta sulla carta della tappa: la sua
   prima bestia, non il paesaggio. Chi sceglie la tappa non sa leggere, e
   guarda solo quella: «🌾» sopra «Il primo gregge» gli promette del grano
   dove invece ci sono pecore. Il mercato, che bestie non ne ha apposta,
   resta col suo cesto. */
export const facciaDi = chiave => {
  const m = MONDI[chiave]
  if (!m) return '❓'
  return (m.specie.find(s => s.categoria === 'animali') || {}).emoji || m.icona
}

/* Le specie di una categoria dentro un mondo: quello che il generatore
   pesca per costruire una scena. */
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
      /* la chiave di una specie è un id del gioco, come `en:dog` in
         inglese: non è pensata per ripetersi fra un mondo e l'altro */
      if (chiaviSpecie.has(s.chiave))
        guasti.push(`${doveS}: già usata in "${chiaviSpecie.get(s.chiave)}"`)
      else chiaviSpecie.set(s.chiave, chiave)
    }
  }
  return guasti
}
