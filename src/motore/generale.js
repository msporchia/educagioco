/* ═══════════════════════════════════════════════════════════════════
   IL GENERALE — le regole, senza schermo

   Come `motore/battaglia.js`: qui dentro non c'è un contesto 2D, non
   c'è Vue, non c'è un tasto. Ci sono le unità, gli ordini e quello che
   succede quando li si esegue. Gira uguale nel gioco e in Node, ed è
   la ragione per cui i livelli si possono *provare* invece che
   guardare (`test/unita/generale.test.mjs` li gioca tutti).

   IL MODELLO. Il bambino non pilota nessuno: firma ORDINI PERMANENTI
   alle sue unità, come un generale prima della battaglia. Poi guarda.
   Un'unità sa già camminare (ci pensa una BFS): il bambino decide il
   COSA e il QUANDO, mai il COME.

   Non esiste una «IA dei mostri»: c'è UN solo linguaggio di ordini e
   UN solo esecutore. Ogni fazione ha un AUTORE — il giocatore oppure
   il livello. L'esecutore non sa e non gli importa chi ha scritto cosa.

   ── la forma di un ordine ───────────────────────────────────────
   Ogni ordine è VERBO + COMPLEMENTO, senza eccezioni: è la regolarità
   che rende il linguaggio imparabile. E ogni ordine punta a una COSA,
   mai a una direzione — «prendi a nord» non vuol dire niente, e un
   gioco fatto di passi contati insegna a contare i passi.

       { verbo:'vai', complemento:'chiave' }
       { verbo:'prendi', complemento:'chiave' }
       { verbo:'pattuglia', complemento:'3,5', punti:['3,5','9,5'],
         finche:{cond:'vedi', complemento:'eroe'} }
       { verbo:'suona', complemento:'libero' }
       { verbo:'quando', complemento:'libero', allora:[ …altri ordini… ] }

   `quando` non è un'azione: arma un ascolto e passa oltre, e quando
   quel segnale arriva parte una fila nuova. È così che un programma ha
   due punti d'ingresso senza annidare niente.

   ── TRE COSE DIVERSE, TRE FORME DIVERSE ─────────────────────────
   Prima la decisione era un attributo dell'azione — `suona [x] se
   [vedi l'orco]`, col suo gemello `altrimenti` appeso di lato — e
   mescolava due concetti in una riga: chi la leggeva non vedeva né
   l'azione né il bivio. Adesso sono tre forme che non si somigliano:

     l'AZIONE      { verbo, complemento }              si fa
     la DECISIONE  { blocco:'condizione', cond, vero, falso }   sceglie
     l'EVENTO      { verbo:'quando', complemento, allora }  apre un piano

   Un BLOCCO CONDIZIONE è una struttura sua, non un ordine con
   un'aggiunta:

       { blocco:'condizione', cond:{cond:'vedi', complemento:'orco'},
         vero:  [ {verbo:'vai', complemento:'portaSotto'} ],
         falso: [ {verbo:'vai', complemento:'portaSopra'} ] }

   e vale così:
     · la condizione si valuta UNA VOLTA, quando il blocco comincia:
       parte esattamente un ramo, e da lì in poi va fino in fondo (se si
       rivalutasse a ogni passo, un'unità potrebbe partire di là e
       finire di qua a metà strada);
     · ogni ramo è una LISTA PIATTA di ordini, come tutte le altre liste
       del gioco, e si esegue in fila; finita, si passa all'ordine dopo
       il blocco;
     · un ramo può restare VUOTO, e vuol dire «in quel caso non fare
       niente»;
     · niente «altrimenti se» a catena e niente blocchi dentro blocchi:
       un ramo contiene ordini semplici. Se un livello chiede di più, si
       usano i segnali e un secondo script.

   ── quello che ogni verbo accetta ───────────────────────────────
   Ogni cosa del mondo dichiara il suo TIPO (posto, oggetto, porta,
   unita, fazione, segnale, attimo, cella) e ogni verbo dichiara quali
   tipi prende. Da lì discende tutto: «apri la chiave» non si compone
   più, e un ordine di tipo sbagliato — arrivato da un piano salvato o
   da un livello ritoccato — viene RIFIUTATO prima che qualcuno muova
   un passo.

   ── IL RUMORE, cioè il mondo che reagisce ───────────────────────
   Finché i nemici eseguono un piano fisso che non ti riguarda, il tuo
   piano non deve adattarsi a niente: si va dalla chiave, si uccide il
   mostro, si apre la porta. Sempre uguale.

   Perciò un'unità può essere fatta così — e sta scritto nella sua
   scheda, non in un ordine, perché non è una cosa che qualcuno le ha
   detto: è come è fatta lei.

       grida:   'aiuto'   se la attaccano, o se vede un avversario,
                          chiama quel segnale. Una volta sola.
       accorre: 'aiuto'   quando lo sente, molla quello che sta
                          facendo e va DOVE È PARTITO il grido; finito
                          lì, riprende i suoi ordini da dov'era.

   Non è un secondo sistema: il grido è un `suona` e chi accorre ha di
   fatto un `quando senti → vai lì`, con la stessa coda dei segnali e
   le stesse righe di registro. Da qui discendono due cose.

   COMBATTERE NON È PIÙ GRATIS. «Uccidi il mostro» diventa una
   decisione con un prezzo: fai rumore, e da tre stanze più in là
   arriva qualcuno. Ora conta DOVE combatti, QUANDO, e SE.

   E LA REAZIONE DIVENTA UN'ARMA. Se accorrono in modo prevedibile,
   farsi vedere è una mossa: il cavaliere si mostra a nord, le guardie
   lasciano il posto, e la ladra passa a sud mentre il corridoio è
   vuoto. Il segnale del nemico è un segnale come gli altri: l'ordine
   `quando senti [aiuto]` di un'unità tua parte quando grida un orco.
   Non serve nessun costrutto nuovo — serve che il mondo faccia rumore.

   ── i due prerequisiti che restano ──────────────────────────────
   Camminare non è un ordine: `prendi [x]` e `apri [x]` ci vanno da
   soli, perché toccare una cosa lontana e non vedere succedere niente
   non insegna niente a nessuno. Quello che si può ancora sbagliare —
   e che è la lezione — è l'ORDINE dei gesti: il portone non si apre
   senza la chiave in mano, e chi non ha mai visto qualcuno non sa
   dove sia. Sono prerequisiti di stato, non di posizione.
   ═══════════════════════════════════════════════════════════════════ */

/* oltre questi passi la scena è in giro a vuoto: si chiude e lo dice */
export const PASSI_MASSIMI = 300
const DANNO = 1
const VERSO = ['nord', 'est', 'sud', 'ovest']   // serve solo a raccontare dove va

/* ── i segnali ──────────────────────────────────────────────────
   Un segnale ha un NOME, non un colore. «nemico in vista» invece di
   «allarme rosso» è il salto da una variabile chiamata x a una
   chiamata nemicoInVista: dare il nome giusto a un concetto è metà
   del programmare. Il colore resta, ma è la vernice del filo che
   unisce chi manda a chi ascolta. */
export const SEGNALI = {
  nemico:  { nome: 'nemico in vista', em: '👁️', col: '#e0554d' },
  libero:  { nome: 'tutto libero',    em: '✅', col: '#3fb872' },
  aperta:  { nome: 'porta aperta',    em: '🚪', col: '#c9853f' },
  aiuto:   { nome: 'aiuto',           em: '🆘', col: '#e8703f' },
  ora:     { nome: 'al mio segnale',  em: '⭐', col: '#f0c04a' },
  viaLibera: { nome: 'via libera',   em: '⚔️', col: '#3fb872' },
  bottino: { nome: 'tesoro trovato',  em: '💰', col: '#b06be0' },
  chiave:  { nome: 'ho la chiave',    em: '🔑', col: '#4a86e8' },
}
export const ilSegnale = k => SEGNALI[k] || { nome: k, em: '📣', col: '#8b97b4' }

/* ── il vocabolario ─────────────────────────────────────────────
   SI ASTRAE IL COME, NON IL COSA. È il metro per decidere se un verbo
   nuovo può stare più in alto:
     sì — nascondere il MODO di fare una cosa che non è la lezione
          (`vai` fa il pathfinding: girare intorno a un muro non è
          quello che stiamo insegnando)
     sì — riassumere una RIPETIZIONE (`pattuglia` sta per dieci mete
          contate, e che sia un ciclo è proprio la cosa da capire)
     no — fondere DUE INTENZIONI (`apri` non ti porta al portone)
     no — saltare un PREREQUISITO (se la chiave se la prende da sé, il
          secondo livello non insegna più niente)

   Tre gradi nella stessa cassetta, e convivono. Lo stesso livello si
   fa in tutti i modi: il par premia quello corto senza vietare quello
   lungo, e le tre varianti fanno vedere che quello lungo è anche più
   fragile. Perciò `vai` scende di grado da sé — puntato a un posto è
   il gradino basso, puntato a una cosa da fare è quello di mezzo. */
export const VERBI = {
  /* `vai` accetta anche una CELLA QUALSIASI, non solo le cose che hanno
     un nome: «vai lì» dietro quel muro è una mossa legittima, e apre
     soluzioni che il livello non aveva previsto. Ha però un prezzo che
     il bambino scoprirà da solo — una cella è un numero scritto a mano,
     e se nella scena dopo il muro si sposta quel piano cade, mentre
     «vai alla chiave» segue la chiave dovunque sia. */
  vai:       { et: '🚶', cl: 'moto', nome: 'vai a', grado: 1,
               accetta: ['posto', 'oggetto', 'porta', 'unita', 'fazione', 'cella'] },
  prendi:    { et: '🎒', cl: 'azione', nome: 'prendi', grado: 2, accetta: ['oggetto'] },
  apri:      { et: '🔓', cl: 'azione', nome: 'apri', grado: 2, accetta: ['porta'] },
  attacca:   { et: '⚔️', cl: 'azione', nome: 'attacca', grado: 2, accetta: ['unita', 'fazione'] },
  /* NESSUNA UNITÀ È ONNISCIENTE. Prima `aspetta [l'orco]` voleva dire
     «finché non è fuori combattimento», e lo sapeva anche da tre stanze
     più in là senza aver visto niente: era un fatto globale travestito
     da percezione. Adesso si aspetta un SEGNALE — cioè qualcuno che te
     lo dice — oppure un momento. Quello che succede fuori dalla vista
     deve passare per un messaggio, che è anche il modo in cui si
     sincronizzano davvero due che non si vedono. */
  /* ── ASPETTARE UNO STATO, RICEVERE UN MESSAGGIO ──
     Sono due cose diverse e prima si sovrapponevano: «l'eroe aspetta il
     via libera» si poteva dire in tutti e due i modi, e nessuno capiva
     quando serviva l'uno o l'altro. Adesso si distinguono da COSA
     ASCOLTANO. `aspetta` guarda il MONDO e aspetta che cambi — il
     portone che si apre, un momento che passa — e funziona solo su
     quello che l'unità VEDE da dov'è. `quando senti` riceve un
     MESSAGGIO, e funziona a distanza proprio perché non stai
     guardando: ti stanno parlando.
     È la regola dell'onniscienza vista dall'altro lato: quello che
     vedi lo puoi aspettare, quello che non vedi te lo deve dire
     qualcuno. Per questo i segnali qui NON ci sono più. */
  aspetta:   { et: '⏳', cl: 'attesa', nome: 'aspetta', grado: 2,
               accetta: ['attimo', 'porta'] },
  aspettaDiVedere: { et: '👁', cl: 'attesa', nome: 'aspetta di vedere', grado: 3,
                     accetta: ['unita', 'fazione'] },
  suona:     { et: '📣', cl: 'msg', nome: 'suona', grado: 2, accetta: ['segnale'] },
  quando:    { et: '🎬', cl: 'msg', nome: 'quando senti', grado: 3, accetta: ['segnale'] },
  /* il giro di ronda non è una scatola disegnata dal livello: è una
     LISTA DI PUNTI che il bambino tocca sulla mappa, e l'unità li fa in
     fila e ricomincia. Il complemento è il primo punto, `punti` sono
     tutti quanti, `finche` è l'uscita — e senza uscita il giro non
     finisce mai, il che dev'essere detto e non scoperto. */
  /* `vuoleFinche`: l'uscita non è un ornamento, è parte dell'ordine. Un
     giro senza `finche` non finisce mai e gli ordini dopo non partono —
     non è una scelta di stile, è un ciclo infinito, e non dev'essere
     nemmeno componibile. Stessa idea del `vuoleFinche` che l'editor
     delle mappe ha per `aspetta`. */
  pattuglia: { et: '🔁', cl: 'ciclo', nome: 'pattuglia', grado: 3, accetta: ['cella'],
               vuoleFinche: true },
}

export const GRADI = { 1: 'un posto alla volta', 2: 'un compito', 3: 'una strategia' }
export const gradoDi = (v, tipo) => {
  const V = VERBI[v]; if (!V) return 2
  if (v === 'vai') return tipo === 'posto' ? 1 : 2
  return V.grado
}
/* ── i blocchi ──
   Non sono verbi e non stanno in cassetta coi verbi: sono STRUTTURE, e
   ce n'è una sola. Sta qui e non nella vista perché è il motore a
   sapere cosa vuol dire, e la stessa parola la usano il registro e il
   validatore. */
export const BLOCCHI = {
  condizione: { et: '❓', cl: 'scelta', nome: 'condizione',
                che: 'guarda una volta sola, quando ci arriva, e da lì prende ' +
                     'una delle due strade: mai tutte e due, mai nessuna.' },
}
export const eCondizione = o => !!o && o.blocco === 'condizione'
export const RAMI = [
  { ramo: 'vero', nome: 'se è vero', et: '✔' },
  { ramo: 'falso', nome: 'se è falso', et: '✘' },
]
/* la lista di un ramo, sempre una lista anche quando non c'è */
export const ramoDi = (o, r) => (eCondizione(o) && Array.isArray(o[r]) ? o[r] : [])

/* gli ordini che fanno la differenza fra «ce l'ho fatta» e «ho capito»:
   un ciclo, un evento, una decisione. È quello che il profilo conta a
   parte con `avanzati`. */
export const eAvanzato = o => !!o && (eCondizione(o) || o.verbo === 'pattuglia' ||
                                      o.verbo === 'quando' ||
                                      o.verbo === 'aspettaDiVedere' || !!o.finche)

const clona = x => JSON.parse(JSON.stringify(x))

/* ═══════════ il mondo ═══════════ */

const varianteDi = (livello, variante) => {
  if (variante && typeof variante === 'object') return variante
  const v = (livello.varianti || [])[variante || 0]
  if (!v) throw new Error('variante sconosciuta')
  return v
}
const patch = (base, cambi) => ({ ...base, ...(cambi || {}) })

/* creaMondo COPIA tutto quello che poi si mangia giocando: se giocasse
   sul livello, la seconda partita partirebbe da un campo già mangiato e
   nessuno se ne accorgerebbe finché un bambino non rigioca la tappa. */
export function creaMondo(livello, variante) {
  const v = varianteDi(livello, variante)
  const griglia = livello.griglia
  const h = griglia.length, w = griglia[0].length
  const celle = []
  for (let y = 0; y < h; y++) {
    const riga = []
    for (let x = 0; x < w; x++) riga.push({ muro: griglia[y][x] === '#', porta: null })
    celle.push(riga)
  }
  const porte = {}
  for (const k in (livello.porte || {})) {
    const p = patch(livello.porte[k], (v.porte || {})[k])
    porte[k] = { nome: k, x: p.x, y: p.y, chiave: p.chiave || null,
                 aperta: !!p.aperta, iniziale: !!p.aperta }
    celle[p.y][p.x].porta = k
  }
  const posti = {}
  for (const k in (livello.posti || {})) posti[k] = patch(livello.posti[k], (v.posti || {})[k])
  const m = {
    livello, variante: v.nome || '', w, h, celle, porte, posti,
    oggetti: (livello.oggetti || []).map(o => ({ ...patch(o, (v.oggetti || {})[o.nome]), preso: null })),
    segnali: [...(livello.segnali || [])],
    unita: livello.unita.map(u0 => {
      const u = patch(u0, (v.unita || {})[u0.id])
      return { ...u, x0: u.x, y0: u.y, vita: u.vita || 3, vitaMax: u.vita || 3,
               vista: u.vista || 0, viva: true, zaino: [], dir: 2, visti: {},
               ordineOra: null, attesa: null }
    }),
    fili: [], ascolti: [], segnaliMandati: [], pendenti: [],
    passi: 0, finita: false, vinto: false, motivo: '', colpevole: null,
    eventi: [], traccia: [], versioneMappa: 0, colpi: [], allarmi: [],
    mia: Object.keys(livello.fazioni).find(f => livello.fazioni[f].autore === 'giocatore'),
  }
  m.perId = {}
  m.unita.forEach(u => { m.perId[u.id] = u })
  /* le caselle nominabili: un punto di ronda è una cosa a tutti gli
     effetti, solo che non ha un nome. Si contano una volta sola. */
  m.caselle = []
  if (livello.celle)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (!celle[y][x].muro) m.caselle.push(x + ',' + y)
  m.cose = coseDi(m)
  return m
}

const etichetta = (m, k) => ((m.livello.nomi || {})[k]) || k
const vive = m => m.unita.filter(u => u.viva)

/* Quanti dei SUOI sono rimasti sul campo. Non fa perdere la battaglia —
   a volte mandare avanti qualcuno è la mossa giusta — ma costa una
   stella, perché altrimenti l'esca sarebbe gratis e i personaggi
   diventerebbero pezzi di ricambio. */
export const perdute = m => m.unita.filter(u => !u.viva && u.fazione === m.mia).length

/* ── le cose del mondo, ognuna col suo tipo ──
   Il tipo sta nei dati: da lì discende quali verbi la accettano, quali
   condizioni genera, con che icona si vede. Una cosa nuova è una riga. */
function coseDi (m) {
  const c = {}
  const agg = (id, tipo, nome, em) => { if (id != null && !c[id]) c[id] = { id, tipo, nome, em } }
  for (const k in m.porte) agg(k, 'porta', etichetta(m, k), '🚪')
  for (const k in m.posti) agg(k, 'posto', etichetta(m, k), '📍')
  /* l'icona la dichiara l'oggetto: prima erano tutte una chiave, e la
     lanterna del primo capitolo si presentava come un mazzo di chiavi.
     Chi non la dichiara resta una chiave, che è il caso più comune. */
  m.oggetti.forEach(o => agg(o.nome, 'oggetto', etichetta(m, o.nome), o.em || o.emoji || '🔑'))
  m.unita.forEach(u => agg(u.id, 'unita', u.nome || u.id, u.emoji))
  for (const k in m.livello.fazioni) agg(k, 'fazione', etichetta(m, k), '🚩')
  m.segnali.forEach(k => agg(k, 'segnale', ilSegnale(k).nome, ilSegnale(k).em))
  agg('momento', 'attimo', 'un momento', '⏱️')
  return c
}
/* ── le caselle ──
   `"12,10"` è una cosa a tutti gli effetti, solo che non ha un nome — ed
   è esattamente la sua debolezza. Un oggetto lo segui ovunque vada; una
   casella è un numero scritto a mano, e nella scena dopo lì potrebbe
   esserci un muro. Non lo spiega nessuno: si vede. */
const CASELLA = /^(\d+),(\d+)$/
export function laCosa (m, id) {
  const c = (m.cose || {})[id]
  if (c) return c
  /* Una casella libera vale SEMPRE, senza che il livello debba dichiarare
     niente: se il dito può indicarla, l'ordine deve poterla dire. Prima
     serviva un `celle: true` nel livello, e il risultato era che
     l'interfaccia lasciava comporre «vai a 2,10» e poi il motore
     rispondeva «qui non c'è niente che si chiami così» — cioè il gioco
     dava torto a chi aveva fatto esattamente quello che gli era stato
     detto di fare. */
  const q = CASELLA.exec(id || '')
  if (!q) return null
  const x = +q[1], y = +q[2]
  if (!dentro(m, x, y) || m.celle[y][x].muro) return null
  return { id, tipo: 'cella', nome: `la casella (${x},${y})`, em: '⬚', x, y }
}

/* la lista delle cose che il livello mette in gioco: il livello può
   restringerla, ed è così che si dosa la combinatoria per chi ha sei
   anni. Quello che non è in elenco esiste sul campo ma non si nomina. */
const nominabili = m => [
  ...(m.livello.complementi || Object.keys(m.cose)).filter(k => m.cose[k]),
  ...m.caselle,
]

/* quello che un verbo può davvero prendere, qui. Se è vuota, il verbo
   non si offre: meglio una cassetta più piccola di un verbo che non
   porta da nessuna parte. */
export function complementiDi (mondo, verbo) {
  const V = VERBI[verbo]
  if (!V || !mondo || !mondo.cose) return []
  return nominabili(mondo).filter(k => {
    const C = laCosa(mondo, k)
    return C && V.accetta.includes(C.tipo)
  })
}
export const verbiDi = mondo => Object.keys(VERBI).filter(v => complementiDi(mondo, v).length)

/* ── CHI SA COSA ──
   Il filtro ha due dimensioni: verbo × tipo (sopra) e verbo × CHI LO
   ESEGUE (qui). Un'unità dichiara nei dati cosa sa fare (`sa: […]`);
   chi non lo dichiara sa tutto quello che il livello offre. Il
   cavaliere è dentro un'armatura: combatte e aspetta, ma non fruga per
   terra e non scassina. Serve poco come regola in più, serve molto
   come RAGIONE per coordinarsi. */
const saFare = (u, v) => !u || !u.sa || u.sa.includes(v)
export const verbiPer = (mondo, id) =>
  verbiDi(mondo).filter(v => saFare(mondo.perId[id], v))
export const nonSa = (mondo, id) => {
  const u = mondo.perId[id]
  return u && u.sa ? verbiDi(mondo).filter(v => !saFare(u, v)) : []
}

/* ═══════════ le condizioni ═══════════
   Percezione e stato, mai numeri astratti. Ogni condizione nomina UNA
   cosa, con lo stesso `complemento` degli ordini: così la guardia si
   sceglie dalla stessa lista da cui si sceglie il bersaglio. */
export function valuta (m, io, c) {
  if (!c) return true
  const v = grezza(m, io, c)
  return c.non ? !v : v
}
function grezza (m, io, c) {
  const chi = c.complemento
  switch (c.cond) {
    case 'vedi': return vive(m).some(u => u !== io && combacia(u, chi) && vede(m, io, u))
    case 'vivo': return vive(m).some(u => combacia(u, chi))
    case 'hai': {
      const u = c.chi ? m.perId[c.chi] : io
      return !!(u && u.zaino.includes(chi))
    }
    case 'aperta': return !!(m.porte[chi] && m.porte[chi].aperta)
    case 'segnale': return m.segnaliMandati.includes(chi)
    case 'qui': {
      const u = c.chi ? m.perId[c.chi] : io
      const p = m.posti[chi]
      return !!(u && u.viva && p && u.x === p.x && u.y === p.y)
    }
    case 'sempre': return true
    default: return false
  }
}
/* il complemento di una condizione può essere l'id di un'unità o il
   nome di una fazione: «vedi l'orco» e «vedi gli orchi» */
const combacia = (u, chi) => u.viva && (u.id === chi || u.fazione === chi)

/* le condizioni che il livello offre alla guardia `se`. Non si
   inventano: escono dalle stesse cose da cui escono i complementi. Un
   livello può dettarle a mano quando la combinatoria è troppa. */
export function condizioniDi (mondo, io) {
  if (mondo.livello.condizioni) return mondo.livello.condizioni
  const out = []
  for (const k of nominabili(mondo)) {
    const x = mondo.cose[k]
    if (!x || k === io) continue
    const due = cond => out.push({ ...cond }, { ...cond, non: true })
    /* quello che vede adesso, quello che ha addosso, i segnali che le
       sono arrivati. Lo stato di una porta dall'altra parte della mappa
       non è percezione: se serve saperlo, qualcuno deve dirlo. */
    if (x.tipo === 'unita' || x.tipo === 'fazione') due({ cond: 'vedi', complemento: k })
    else if (x.tipo === 'oggetto') due({ cond: 'hai', complemento: k })
    else if (x.tipo === 'segnale') due({ cond: 'segnale', complemento: k })
  }
  return out
}
export const chiaveCond = c => c
  ? [c.cond, c.complemento || '', c.chi || '', c.non ? '!' : ''].join('|') : ''

/* ── UNA CONDIZIONE SI COMPONE COME UN ORDINE ──
   verbo + complemento, la stessa grammatica: `vedi [l'orco]`, `hai [la
   chiave]`, `è aperto [il portone]`. Prima l'interfaccia offriva frasi
   già fatte, col bersaglio deciso dal livello — e una frase fatta non
   si compone, si sceglie. Qui il vocabolario delle condizioni; il
   «non» non è una voce dell'elenco, è un interruttore. */
export const CONDIZIONI = {
  vedi:    { nome: 'vedi', em: '👁' },
  vivo:    { nome: 'è in piedi', em: '❤️' },
  hai:     { nome: 'hai', em: '🎒' },
  aperta:  { nome: 'è aperto', em: '🚪' },
  segnale: { nome: 'hai sentito', em: '📣' },
  qui:     { nome: 'è arrivato a', em: '📍' },
}
/* quello che si può chiedere qui, raggruppato per verbo di condizione.
   Esce dalle stesse cose da cui escono i complementi — e se il livello
   detta le sue condizioni, si raggruppano quelle: la manopola della
   difficoltà resta al livello. */
export function condCompone (mondo, io) {
  const out = []
  for (const c of condizioniDi(mondo, io)) {
    if (!c || !c.cond || c.cond === 'sempre' || !c.complemento) continue
    let g = out.find(x => x.cond === c.cond)
    if (!g) out.push(g = { cond: c.cond, nome: (CONDIZIONI[c.cond] || {}).nome || c.cond,
                           em: (CONDIZIONI[c.cond] || {}).em || '❓', cose: [] })
    if (!g.cose.includes(c.complemento)) g.cose.push(c.complemento)
  }
  return out
}

const valutabile = (mondo, c) => !!(c && c.cond && (
  c.cond === 'sempre' || (c.complemento && !!mondo.cose[c.complemento])))

/* ═══════════ la mappa ═══════════ */
const dentro = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h
export function libera (m, x, y) {
  if (!dentro(m, x, y)) return false
  const c = m.celle[y][x]
  if (c.muro) return false
  if (c.porta && !m.porte[c.porta].aperta) return false
  return true
}
/* Le unità NON si bloccano fra loro: due sulla stessa cella sono
   ammesse (il disegno le sfalsa). Bloccarsi genererebbe stalli finti
   che non hanno niente da insegnare. */

/* BFS: la mappa delle distanze da una cella. È il «sa già camminare». */
export function distanze (m, x0, y0) {
  const d = new Int16Array(m.w * m.h).fill(-1)
  d[y0 * m.w + x0] = 0
  const coda = [[x0, y0]]
  const P = [[0, -1], [1, 0], [0, 1], [-1, 0]]
  let testa = 0
  while (testa < coda.length) {
    const [x, y] = coda[testa++], q = d[y * m.w + x]
    for (const [dx, dy] of P) {
      const nx = x + dx, ny = y + dy
      if (!libera(m, nx, ny)) continue
      if (d[ny * m.w + nx] !== -1) continue
      d[ny * m.w + nx] = q + 1
      coda.push([nx, ny])
    }
  }
  return d
}
function mappaDi (m, u) {
  const k = u.x + ',' + u.y + ',' + m.versioneMappa
  if (u._mk !== k) { u._mk = k; u._md = distanze(m, u.x, u.y) }
  return u._md
}
/* un passo verso (bx,by): si va a ritroso sulla mappa di distanze del
   bersaglio */
function passoVerso (m, u, bx, by) {
  const d = distanze(m, bx, by)
  const qui = d[u.y * m.w + u.x]
  if (qui <= 0) return null
  const P = [[0, -1], [1, 0], [0, 1], [-1, 0]]
  for (const [dx, dy] of P) {
    const nx = u.x + dx, ny = u.y + dy
    if (libera(m, nx, ny) && d[ny * m.w + nx] === qui - 1) return [nx, ny]
  }
  return null
}
/* «vedere» è a distanza di cammino: un muro in mezzo toglie la vista
   senza bisogno di tracciare raggi */
export function vede (m, io, altro) {
  if (!io) return false
  const d = mappaDi(m, io)[altro.y * m.w + altro.x]
  return d >= 0 && d <= (io.vista || 0)
}
const aPortata = (u, t) => !!t && Math.abs(u.x - t.x) + Math.abs(u.y - t.y) <= 1
/* Una porta CHIUSA non si attraversa, quindi la mappa delle distanze non
   ci arriva sopra: la si vede se si vede una casella che le sta
   accanto. Senza questo, chi è appoggiato al portone «non lo vede». */
function vedePorta (m, io, p) {
  const d = mappaDi(m, io), v = io.vista || 0
  return [[p.x, p.y], [p.x + 1, p.y], [p.x - 1, p.y], [p.x, p.y + 1], [p.x, p.y - 1]]
    .some(([x, y]) => dentro(m, x, y) && d[y * m.w + x] >= 0 && d[y * m.w + x] <= v)
}

/* ═══════════ il piano ═══════════
   `piano` è { idUnità: [ordini] }. Il piano completo è quello scritto
   dal livello più quello del giocatore, che ha l'ultima parola sulle
   sue unità. */
export function pianoCompleto (livello, delGiocatore) {
  const p = {}
  for (const nome in livello.fazioni)
    for (const id in (livello.fazioni[nome].ordini || {}))
      p[id] = clona(livello.fazioni[nome].ordini[id])
  for (const id in (delGiocatore || {})) p[id] = clona(delGiocatore[id])
  return p
}
/* le unità di cui il giocatore firma gli ordini: quelle della sua
   fazione che il livello non ha già istruito */
export function mieUnita (livello) {
  const out = []
  for (const nome in livello.fazioni) {
    const fz = livello.fazioni[nome]
    if (fz.autore !== 'giocatore') continue
    livello.unita.filter(u => u.fazione === nome && !(fz.ordini || {})[u.id])
      .forEach(u => out.push(u.id))
  }
  return out
}
/* le unità di cui il giocatore può LEGGERE gli ordini scritti da altri */
export function altruiUnita (livello) {
  const out = []
  for (const nome in livello.fazioni)
    for (const id in (livello.fazioni[nome].ordini || {})) out.push(id)
  return out
}
export const pianoVuoto = livello =>
  Object.fromEntries(mieUnita(livello).map(id => [id, []]))
/* quanti ordini pesa un piano: quelli dentro un `quando` e quelli dentro
   i rami di una condizione contano, se no nascondere una fila dentro un
   evento o dentro un bivio sarebbe gratis. E il blocco stesso pesa uno:
   decidere è una cosa che hai scritto tu. */
export function contaOrdini (piano) {
  let n = 0
  const conta = l => (l || []).forEach(o => {
    n++
    if (eCondizione(o)) { conta(ramoDi(o, 'vero')); conta(ramoDi(o, 'falso')); return }
    if (o && o.allora) conta(o.allora)
  })
  for (const id in (piano || {})) conta(piano[id])
  return n
}
/* tutte le voci di una fila, blocchi compresi e con dentro i loro rami:
   il validatore le guarda una per una */
const tutteLeVoci = l => (l || []).flatMap(o => eCondizione(o)
  ? [o, ...tutteLeVoci(ramoDi(o, 'vero')), ...tutteLeVoci(ramoDi(o, 'falso'))]
  : [o, ...tutteLeVoci(o && o.allora)])

/* ── IL RIFIUTO ──
   Un ordine che l'interfaccia non lascerebbe comporre può arrivare lo
   stesso: da un piano salvato ieri, da un livello ritoccato. Il motore
   non lo esegue e poi spiega — rifiuta il piano prima di cominciare, e
   dice quali ordini non stanno in piedi. */
export function guaiDi (mondo, piano) {
  const out = []
  for (const id in (piano || {})) {
    const u = mondo.perId[id]
    if (!u) { out.push({ unita: id, motivo: `«${id}» non è sul campo` }); continue }
    for (const o of tutteLeVoci(piano[id])) {
      /* ── un blocco non è un ordine ──
         Ha una condizione e due rami, e si controlla per quello che è:
         la condizione deve parlare di qualcosa che c'è, i rami devono
         essere liste, e dentro un ramo non ci va né un altro blocco né
         un `quando` — quello apre un piano nuovo, e un piano nuovo non
         sta dentro un bivio. */
      if (eCondizione(o)) {
        const dove = `${id}: condizione`
        if (!valutabile(mondo, o.cond))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — la condizione parla di una cosa che non c'è` })
        for (const r of ['vero', 'falso'])
          if (o[r] !== undefined && !Array.isArray(o[r]))
            out.push({ unita: id, ordine: o,
                       motivo: `${dove} — il ramo «${r}» non è una lista di ordini` })
        const dentro = [...ramoDi(o, 'vero'), ...ramoDi(o, 'falso')]
        if (dentro.some(eCondizione))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — dentro un ramo non ci va un'altra condizione` })
        if (dentro.some(q => q && q.verbo === 'quando'))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — dentro un ramo non ci va un «quando senti»: ` +
                             'quello è un piano che parte da capo, e sta accanto agli altri' })
        continue
      }
      if (o && o.blocco)
        { out.push({ unita: id, ordine: o, motivo: `${id}: «${o.blocco}» non è un blocco` }); continue }
      const V = VERBI[o && o.verbo]
      const dove = `${id}: ${o && o.verbo}`
      if (!V) { out.push({ unita: id, ordine: o, motivo: `${dove} — non è un verbo` }); continue }
      const C = laCosa(mondo, o.complemento)
      if (!C) {
        out.push({ unita: id, ordine: o, motivo: o.complemento
          ? `${dove} «${o.complemento}» — qui non c'è niente che si chiami così`
          : `${dove} — questo ordine non dice su cosa` })
        continue
      }
      for (const q of (o.punti || []))
        if (!complementiDi(mondo, o.verbo).includes(q))
          out.push({ unita: id, ordine: o, motivo: `${dove} — il punto «${q}» non è sulla mappa` })
      if (!V.accetta.includes(C.tipo))
        out.push({ unita: id, ordine: o, motivo: `${dove} — «${V.nome}» non prende ${C.tipo} («${C.nome}»)` })
      else if (!complementiDi(mondo, o.verbo).includes(o.complemento))
        out.push({ unita: id, ordine: o, motivo: `${dove} — «${C.nome}» non è in gioco in questo livello` })
      if (!saFare(u, o.verbo))
        out.push({ unita: id, ordine: o, motivo: `${dove} — ${u.nome || id} non sa «${V.nome}»` })
      if (o.finche && !valutabile(mondo, o.finche))
        out.push({ unita: id, ordine: o, motivo: `${dove} — la condizione parla di una cosa che non c'è` })
      /* UN ORDINE NON DECIDE. La guardia `se` non esiste più: chi deve
         scegliere fra due strade scrive un blocco condizione, e le due
         cose non si mescolano più in una riga. */
      if (o.se)
        out.push({ unita: id, ordine: o,
                   motivo: `${dove} — un ordine non porta una condizione addosso: ` +
                           'per scegliere fra due strade serve un blocco condizione' })
      /* l'uscita obbligatoria: un giro senza «finché» non finisce mai */
      if (V.vuoleFinche && !valutabile(mondo, o.finche))
        out.push({ unita: id, ordine: o,
                   motivo: `${dove} — «${V.nome}» senza «finché» è un giro che non finisce mai` })
    }
  }
  return out
}

/* ── QUELLO CHE MANCA A UN ORDINE ──
   Non è un guasto di chi ha scritto il livello: è un ordine che il
   bambino sta ancora scrivendo. Serve all'interfaccia per segnare la
   riga e per dire, invece di far partire una scena che non finirà,
   che cosa manca. Una frase sola, in seconda persona. */
export function manca (mondo, o) {
  /* un blocco condizione: gli manca la domanda, o gli manca da dire
     cosa fare. Un ramo vuoto è legittimo — vuol dire «in quel caso non
     fare niente» — ma tutti e due vuoti no: quel blocco non fa niente
     in nessuno dei due casi, e allora non è una decisione. */
  if (eCondizione(o)) {
    if (!valutabile(mondo, o.cond)) return 'la domanda della condizione non è finita'
    if (!ramoDi(o, 'vero').length && !ramoDi(o, 'falso').length)
      return 'i due rami sono vuoti: metti almeno un ordine in uno dei due'
    return ''
  }
  const V = VERBI[o && o.verbo]
  if (!V) return ''
  if (V.vuoleFinche && !valutabile(mondo, o.finche))
    return 'manca il «finché»: senza, il giro non finisce mai e gli ordini dopo non partono'
  if (o.finche && !valutabile(mondo, o.finche)) return 'la condizione del «finché» non è finita'
  if (!laCosa(mondo, o.complemento)) return 'manca il bersaglio'
  return ''
}

/* ═══════════ avviare la scena ═══════════ */
export function avvia (mondo, piano) {
  const m = mondo
  m.piano = piano || {}
  m.passi = 0; m.finita = false; m.vinto = false; m.motivo = ''; m.colpevole = null
  m.segnaliMandati = []; m.pendenti = []; m.eventi = []; m.traccia = []
  m.versioneMappa = 0; m.ascolti = []; m.colpi = []; m.allarmi = []
  for (const k in m.porte) m.porte[k].aperta = m.porte[k].iniziale
  m.oggetti.forEach(o => { o.preso = null })
  m.unita.forEach(u => {
    u.x = u.x0; u.y = u.y0; u.vita = u.vitaMax; u.viva = true; u.zaino = []
    u.ordineOra = null; u._mk = null; u.dir = 2; u.visti = {}; u.attesa = null
    u.gridato = false
  })
  m.fili = m.unita.map(u => nuovoFilo(u.id, m.piano[u.id] || [], 'principale'))
  return m
}
const nuovoFilo = (unita, ordini, nome) => ({
  unita, ordini: ordini || [], nome: nome || 'evento', i: 0, nuovo: true,
  st: {}, finito: false, ordine: null,
  /* dentro quale ramo di un blocco condizione e a che punto di quel ramo:
     null tutte e due quando si sta nella fila di fuori */
  ramo: null, rj: null, rnuovo: false,
})

/* ═══════════ DI CHI SI PUÒ DIRE CHE HA SBAGLIATO ═══════════
   Il VERDETTO di una partita persa deve parlare solo di cose che il
   bambino può cambiare. Un'unità del livello non la comanda lui:
   «l'orco è in attesa di vedere l'eroe e non succederà mai» è vero
   come descrizione e inutile come diagnosi — chi legge non sa cosa
   farci. Lo stesso fatto detto dalla parte della leva diventa «nessuno
   si è mai fatto vedere dall'orco», e la leva è il piano.

   Nel registro l'orco resta soggetto di quello che fa: lì si racconta
   quello che si è visto, ed è giusto così. Qui si giudica, e chi non
   prende ordini dal bambino può comparire solo come OGGETTO di quello
   che è mancato — mai come colpevole. */
const mio = (m, id) => { const u = m.perId[id]; return !!u && u.fazione === m.mia }

/* quello che il piano non ha fatto, letto dal filo di un'unità che il
   bambino non comanda */
function mancato (m, f) {
  return ALLA(mancato0(m, f))
}
function mancato0 (m, f) {
  const u = m.perId[f.unita]
  const chi = (u && (u.nome || u.id)) || 'qualcuno'
  const o = f.ordine || {}
  const C = laCosa(m, o.complemento)
  const N = C ? C.nome : (o.complemento || 'qualcosa')
  switch (o.verbo) {
    case 'aspettaDiVedere':
    case 'attacca':
      return `nessuno si è mai fatto vedere da ${chi}, che sta ancora aspettando`
    case 'aspetta':
      return `nessuno ha mandato «${N}», che ${chi} sta ancora aspettando`
    case 'vai': case 'prendi': case 'apri': case 'pattuglia':
      return `la strada verso ${N} è rimasta chiusa, e da lì non si è mosso più niente`
    default:
      return 'non è più successo niente, e il piano è finito lì'
  }
}

function fine (m, vinto, motivo, colpevole) {
  m.finita = true; m.vinto = vinto; m.motivo = motivo
  m.colpevole = colpevole || m.colpevole || null
  /* Perdere senza un ordine colpevole non aiuta nessuno: si indica
     l'ordine che qualcuno stava eseguendo in quel momento. È il
     fotogramma della rottura — e si cerca solo fra i TUOI, perché un
     ordine che non hai scritto non è un ordine che puoi correggere. */
  if (!vinto && !m.colpevole) {
    const miei = m.unita.filter(z => z.fazione === m.mia)
    const u = miei.find(z => !z.viva && z.ordineOra) || miei.find(z => z.ordineOra)
    if (u && u.ordineOra) m.colpevole = { unita: u.id, i: u.ordineOra.i, filo: u.ordineOra.filo,
                                          ramo: u.ordineOra.ramo || null,
                                          j: u.ordineOra.j ?? null }
    const r = [...m.traccia].reverse().find(x => x.esito === 'no' && mio(m, x.unita))
    if (r) m.colpevole = { unita: r.unita, i: r.i, filo: r.filo, ramo: r.ramo || null,
                           j: r.j ?? null }
  }
  m.eventi.push(vinto ? 'vinta' : 'persa')
}

/* ═══════════ IL RUMORE ═══════════
   Il grido non è un ordine: nessuno l'ha scritto, sta nella scheda
   dell'unità (`grida`). Ma è un `suona` a tutti gli effetti — stessa
   coda, stesso segnale, stessa riga nel registro — e chi lo sente
   (`accorre`) fa un `vai [lì]`. Un solo sistema, non due. */
function chiamaAllarme (m, u, perche) {
  const seg = u && u.grida
  if (!seg || !u.viva || u.gridato) return
  /* UNA VOLTA SOLA. Un grido che riparte a ogni colpo trascinerebbe
     mezza mappa avanti e indietro, e soprattutto renderebbe la
     reazione imprevedibile — che è l'esatto contrario di quello che
     serve perché il diversivo sia una mossa e non una speranza. */
  u.gridato = true
  m.pendenti.push({ seg, da: u.id, x: u.x, y: u.y, rumore: true })
  m.eventi.push('allarme')
  m.allarmi.push({ x: u.x, y: u.y, seg, da: u.id })
  const filo = { nome: 'rumore', i: 0, ordine: { verbo: 'suona', complemento: seg } }
  nota(m, filo, u, 'fa',
       perche === 'colpito' ? `mi stanno addosso: chiamo «${ilSegnale(seg).nome}»`
                            : `ho visto qualcuno: chiamo «${ilSegnale(seg).nome}»`,
       'chiama aiuto')
}
/* chi accorre lascia il posto: i suoi ordini si SOSPENDONO — non si
   buttano — e riprendono quando è arrivato. È lì che sta la falla che
   un piano può sfruttare: non nel fatto che se ne vada, ma in quanto
   tempo ci mette ad andare e a tornare. */
function accorri (m, u, p) {
  const meta = p.x + ',' + p.y
  const gia = m.fili.find(f => f.unita === u.id && f.reazione && !f.finito)
  if (gia) {
    gia.ordini = [{ verbo: 'vai', complemento: meta }]
    gia.i = 0; gia.nuovo = true; gia.st = {}; gia.ramo = null; gia.rj = null
    return
  }
  m.fili.forEach(z => { if (z.unita === u.id && !z.finito) z.sospeso = true })
  const f = nuovoFilo(u.id, [{ verbo: 'vai', complemento: meta }],
                      `accorre a «${ilSegnale(p.seg).nome}»`)
  f.reazione = true
  m.fili.push(f)
}
const riprendi = (m, u) => m.fili.forEach(z => { if (z.unita === u.id) z.sospeso = false })

/* quello che il livello dichiara, detto a parole: serve alla scheda di
   un'unità, perché una reazione che non si può leggere non è una
   regola del mondo, è una sorpresa */
export function reazioniDi (mondo, id) {
  const u = mondo && mondo.perId[id]
  if (!u) return []
  const out = []
  if (u.grida) out.push({ che: 'grida', segnale: u.grida, em: '📣',
    testo: `se lo attaccano, o se vede un avversario, chiama «${ilSegnale(u.grida).nome}»` })
  if (u.accorre) out.push({ che: 'accorre', segnale: u.accorre, em: '🏃',
    testo: `quando sente «${ilSegnale(u.accorre).nome}» lascia il posto e corre dov'è partito` })
  return out
}

/* ═══════════ un passo ═══════════ */
export function passo (m) {
  if (m.finita) return
  m.eventi = []
  m.colpi = []; m.allarmi = []
  if (m.passi >= PASSI_MASSIMI) {
    fine(m, false, 'La scena non finisce più: qualcuno gira a vuoto.')
    return
  }
  m.passi++

  let agisce = false
  for (const f of m.fili.slice()) {
    if (m.finita) break
    if (f.finito || f.sospeso) continue
    const u = m.perId[f.unita]
    if (!u.viva) { f.finito = true; f.ordine = null; continue }
    const r = passoFilo(m, f, u)
    if (f.reazione && f.finito) riprendi(m, u)
    if (r !== 'attesa') agisce = true
  }

  /* i segnali partono a fine passo: così un segnale mandato adesso si
     sente al giro dopo, uguale per tutti. E si dice sempre CHI si
     sveglia: un salto che non si vede è la parte peggiore del goto. */
  if (m.pendenti.length) {
    agisce = true
    const partiti = m.pendenti; m.pendenti = []
    for (const p of partiti) {
      if (!m.segnaliMandati.includes(p.seg)) m.segnaliMandati.push(p.seg)
      const svegli = []
      for (const a of m.ascolti) {
        if (a.segnale !== p.seg) continue
        const u = m.perId[a.unita]
        if (!u || !u.viva) continue
        svegli.push(u.nome || u.id)
        const vecchio = m.fili.find(f => f.ascolto === a)
        if (vecchio) {
          vecchio.i = 0; vecchio.nuovo = true; vecchio.st = {}; vecchio.finito = false
          vecchio.ramo = null; vecchio.rj = null
        }
        else {
          const f = nuovoFilo(a.unita, a.ordini, `quando «${ilSegnale(p.seg).nome}»`)
          f.ascolto = a
          m.fili.push(f)
        }
      }
      /* e chi è FATTO per accorrere: non ha un `quando senti` scritto
         da nessuno, ce l'ha addosso. Il grido dice anche DA DOVE, e
         quello diventa la meta. */
      if (p.rumore) for (const u of vive(m)) {
        if (u.accorre !== p.seg || u.id === p.da) continue
        svegli.push(u.nome || u.id)
        accorri(m, u, p)
      }
      const chi = m.perId[p.da]
      const N = ilSegnale(p.seg).nome
      /* la riga porta il verbo di chi ha suonato: così chi legge la
         traccia sa a quale ordine appartiene */
      const filo = { nome: 'segnali', i: 0, ordine: { verbo: 'suona', complemento: p.seg } }
      if (chi) nota(m, filo, chi, svegli.length ? 'fa' : 'salto',
        svegli.length ? `arriva «${N}»: si sveglia ${[...new Set(svegli)].join(' e ')}`
                      : `arriva «${N}», ma non lo ascolta nessuno`,
        svegli.length ? `manda ${N}` : 'grida nel vuoto')
    }
  }
  if (m.finita) return

  /* quello che si vede si tiene a mente: è la memoria su cui lavora
     `vai [qualcuno]`, e il motivo per cui una ronda serve davvero */
  for (const u of vive(m)) for (const z of vive(m))
    if (z !== u && vede(m, u, z)) {
      u.visti[z.id] = { x: z.x, y: z.y }
      /* e chi è fatto per gridare, grida: vedere un avversario è già
         rumore, non serve che qualcuno gli abbia detto di dirlo */
      if (z.fazione !== u.fazione) chiamaAllarme(m, u, 'visto')
    }

  if (condizioni(m, m.livello.sconfitta)) {
    fine(m, false, m.livello.motivoSconfitta || 'La missione è fallita.'); return
  }
  if (condizioni(m, m.livello.obiettivo)) { fine(m, true, 'Missione compiuta.'); return }

  const attivi = m.fili.filter(f => !f.finito && !f.sospeso)
  const inAscolto = m.ascolti.filter(a => {
    const u = m.perId[a.unita]
    return u && u.viva && !m.fili.some(f => f.ascolto === a && !f.finito)
  })
  if (!attivi.length && !inAscolto.length) {
    /* l'intoppo che si racconta è uno dei TUOI: quello di un'unità del
       livello sarebbe una notizia su cui non si può fare niente */
    const r = [...m.traccia].reverse().find(x => x.esito === 'no' && mio(m, x.unita))
    fine(m, false, 'Gli ordini sono finiti e la missione non è compiuta.' +
      (r ? ` L'ultimo intoppo: ${nomeDi(m, r.unita)} — «${r.testo}».` : ''))
    return
  }
  /* STALLO: se nessuno ha fatto niente, niente potrà più cambiare. Non
     è un ciclo da far girare: è un errore, e va detto — dalla parte di
     chi può rimediare. */
  if (!agisce) {
    const miei = attivi.filter(z => mio(m, z.unita))
    const loro = attivi.filter(z => !mio(m, z.unita))
    const fermi = l => l.some(z => (m.perId[z.unita] || {}).attesa)
    if (miei.length && loro.length && fermi(miei) && fermi(loro)) {
      const f = miei[0]
      fine(m, false, 'Stallo: vi state aspettando a vicenda, e nessuno fa la prima mossa.',
           { unita: f.unita, i: f.i, filo: f.nome, ramo: f.ramo || null, j: f.rj ?? null })
    } else if (miei.length) {
      const f = miei[0]
      const u = m.perId[f.unita]
      const che = f.ordine ? `«${descrivi(m, f.ordine)}»` : 'qualcosa'
      const altri = miei.length > 1 ? ` (e con lui ${miei.length - 1} altro/i)` : ''
      fine(m, false, `Stallo: ${u.nome || u.id} è piantato su ${che} e non succederà mai${altri}.`,
           { unita: f.unita, i: f.i, filo: f.nome, ramo: f.ramo || null, j: f.rj ?? null })
    } else if (loro.length) {
      fine(m, false, `Stallo: ${mancato(m, loro[0])}.`)
    } else {
      const a = inAscolto[0]
      fine(m, false, mio(m, a.unita)
        ? `Stallo: ${nomeDi(m, a.unita)} aspetta «${ilSegnale(a.segnale).nome}», ` +
          'ma non lo manderà più nessuno.'
        : `Stallo: nessuno ha mandato «${ilSegnale(a.segnale).nome}», ` +
          `che ${nomeDi(m, a.unita)} sta ancora aspettando.`)
    }
  }
}
const condizioni = (m, lista) => !!(lista && lista.length) && lista.every(c => valuta(m, null, c))
const nomeDi = (m, id) => (m.perId[id] && (m.perId[id].nome || id)) || id

/* ── un passo di un filo ──
   Il filo tiene DUE segnaposti, e non ne serviranno mai di più: `i` è a
   che punto sta della sua fila, e — se lì c'è un blocco condizione —
   `ramo`/`rj` dicono quale strada ha preso e a che punto è di quella.
   Un blocco dentro un blocco non esiste (lo rifiuta `guaiDi`), quindi
   non c'è nessuna pila da tenere. */
function passoFilo (m, f, u) {
  let giri = 0
  while (giri++ < 40) {
    if (f.i >= f.ordini.length) { f.finito = true; f.ordine = null; u.ordineOra = null; return 'fine' }
    const o = f.ordini[f.i]

    /* ── IL BIVIO SI DECIDE UNA VOLTA SOLA, quando il blocco comincia ──
       Da lì in poi il ramo scelto va fino in fondo. Se si rivalutasse a
       ogni passo, un'unità potrebbe partire di là e finire di qua a metà
       strada — che è proprio la cosa che rende un programma
       imprevedibile. Decidere non costa un battito: si guarda e si parte
       nello stesso istante. */
    if (eCondizione(o)) {
      if (f.nuovo) {
        f.nuovo = false; f.st = {}
        const vero = valuta(m, u, o.cond)
        f.ramo = vero ? 'vero' : 'falso'; f.rj = null
        nota(m, f, u, 'fa',
             `${testoCond(m, o.cond)}? ${vero ? 'sì' : 'no'} — prendo il ramo del ${f.ramo}`,
             'sceglie una strada')
        f.rj = 0; f.rnuovo = true
      }
      const rami = ramoDi(o, f.ramo)
      /* un ramo vuoto vuol dire «in questo caso non fare niente»: non è
         un intoppo, si passa all'ordine dopo il blocco */
      if (f.rj >= rami.length) { f.i++; f.nuovo = true; f.ramo = null; f.rj = null; continue }
      const q = rami[f.rj]
      if (f.rnuovo) { f.rnuovo = false; f.st = {} }
      f.ordine = q
      u.ordineOra = { ordine: q, unita: f.unita, i: f.i, filo: f.nome, ramo: f.ramo, j: f.rj }
      const r = fai(m, f, u, q)
      if (r === 'subito') { f.rj++; f.rnuovo = true; continue }
      if (r === 'fatto' || r === 'salta') { f.rj++; f.rnuovo = true; return 'agisce' }
      if (r === 'attesa') return 'attesa'
      if (r === 'errore') { f.finito = true; f.ordine = null; u.ordineOra = null; return 'agisce' }
      return 'agisce'
    }

    if (f.nuovo) { f.nuovo = false; f.st = {}; f.ramo = null; f.rj = null }
    f.ordine = o
    u.ordineOra = { ordine: o, unita: f.unita, i: f.i, filo: f.nome, ramo: null, j: null }
    const r = fai(m, f, u, o)
    if (r === 'subito') { f.i++; f.nuovo = true; continue }
    if (r === 'fatto' || r === 'salta') { f.i++; f.nuovo = true; return 'agisce' }
    if (r === 'attesa') return 'attesa'
    if (r === 'errore') { f.finito = true; f.ordine = null; u.ordineOra = null; return 'agisce' }
    return 'agisce'
  }
  nota(m, f, u, 'no', 'giro a vuoto fra i miei ordini', 'resta fermo')
  f.finito = true
  return 'agisce'
}

/* ═══════════ IL REGISTRO ═══════════
   Una riga per ordine, in prima persona, con l'esito a colori:
     fa      ho fatto qualcosa
     aspetto sto aspettando, e dico cosa
     no      non ho potuto, e dico perché
     salto   non toccava a me: sono passato oltre

   Ogni riga porta due versioni. `testo` è quello che l'unità pensa — e
   nomina l'ordine. `fatto` è quello che si VEDE da fuori: di un'unità
   coi piani coperti si mostra solo quello, e solo se qualcuno dei tuoi
   la sta guardando. Il registro serve a DEDURRE il piano nemico, non a
   leggerlo. */
const ALLA = t => t
  .replace(/\ba la /g, 'alla ').replace(/\ba il /g, 'al ').replace(/\ba l'/g, "all'").replace(/\ba le /g, 'alle ')
  .replace(/\bdi la /g, 'della ').replace(/\bdi il /g, 'del ').replace(/\bdi l'/g, "dell'")
  .replace(/\bda la /g, 'dalla ').replace(/\bda il /g, 'dal ').replace(/\bda l'/g, "dall'")
function nota (m, f, u, esito, testo, fatto) {
  testo = ALLA(testo); if (fatto) fatto = ALLA(fatto)
  const visto = chiVede(m, u)
  const o = f && f.ordine
  let p = null
  for (let k = m.traccia.length - 1; k >= 0 && k > m.traccia.length - 12; k--)
    if (m.traccia[k].unita === u.id) { p = m.traccia[k]; break }
  if (p && p.testo === testo && p.esito === esito && p.visto === visto) {
    p.n++; p.tFine = m.passi; return
  }
  m.traccia.push({
    passo: m.passi, t: m.passi, tFine: m.passi, n: 1,
    unita: u.id, fazione: u.fazione, emoji: u.emoji,
    verbo: o ? o.verbo : null, complemento: o ? o.complemento : null,
    esito, testo, fatto: fatto || testo, visto,
    filo: f ? f.nome : null, i: f ? f.i : 0,
    /* dentro quale ramo di un blocco condizione siamo, e a che punto del
       ramo: `ramo` senza `j` è la riga della DECISIONE, `ramo` con `j` è
       un ordine dentro quel ramo. Senza nessuno dei due, è un ordine
       della fila di fuori. */
    ramo: (f && f.ramo) || null,
    j: f && f.ramo && Number.isFinite(f.rj) ? f.rj : null,
    /* il MOTIVO è la parte che insegna: c'è solo quando qualcosa non è
       andato, e dice perché proprio quello non è andato */
    ...(esito === 'fa' ? {} : { motivo: testo }),
  })
  if (m.traccia.length > 400) m.traccia.shift()
}
/* chi dei «tuoi» sta guardando questa unità in questo momento */
function chiVede (m, u) {
  if (u.fazione === m.mia) return true
  return vive(m).some(z => z.fazione === m.mia && vede(m, z, u))
}

/* Una strada chiusa non è subito un errore: il portone potrebbe aprirlo
   qualcun altro fra due secondi. L'unità aspetta, e solo se non succede
   niente per un pezzo si arrende dicendo perché. */
function attende (m, f, u, testo, limite) {
  f.st.fermo = (f.st.fermo || 0) + 1
  if (f.st.fermo > (limite || 25)) return guasto(m, f, u, testo)
  u.attesa = testo
  nota(m, f, u, 'aspetto', testo, 'resta fermo')
  return 'attesa'
}
/* Un ordine che non parte NON ferma la scena: ferma quel filo, lo dice,
   e la partita continua. Fermare tutto toglierebbe al bambino la parte
   più utile — vedere cosa succede dopo. */
function guasto (m, f, u, testo) {
  nota(m, f, u, 'no', testo, 'si ferma')
  incolpa(m, f, u)
  return 'errore'
}
/* l'ordine su cui la vista salta quando il piano non regge. Si segna
   solo se è un ordine dei TUOI: mandare il bambino a guardare la riga
   sbagliata di un piano che non ha scritto lui è peggio che non
   mandarlo da nessuna parte. */
function incolpa (m, f, u) {
  if (!m.colpevole && u.fazione === m.mia)
    m.colpevole = { unita: u.id, i: f.i, filo: f.nome, ramo: f.ramo || null, j: f.rj ?? null }
}
function salta (m, f, u, testo, fatto) {
  nota(m, f, u, 'no', testo, fatto || 'resta fermo')
  incolpa(m, f, u)
  return 'salta'
}

/* muove di una cella verso (bx,by) */
function verso (m, u, bx, by) {
  if (u.x === bx && u.y === by) return 'arrivato'
  const p = passoVerso(m, u, bx, by)
  if (!p) return null
  u.dir = p[0] > u.x ? 1 : p[0] < u.x ? 3 : p[1] > u.y ? 2 : 0
  u.x = p[0]; u.y = p[1]; u._mk = null
  m.eventi.push('passo')
  return u.x === bx && u.y === by ? 'arrivato' : 'passo'
}

/* dov'è una cosa, adesso */
function dove (m, u, C) {
  switch (C.tipo) {
    case 'posto': return m.posti[C.id]
    case 'porta': return m.porte[C.id]
    case 'cella': return { x: C.x, y: C.y }
    case 'oggetto': {
      const o = m.oggetti.find(z => z.nome === C.id)
      if (!o) return null
      return o.preso ? (m.perId[o.preso] && m.perId[o.preso].viva ? m.perId[o.preso] : null) : o
    }
    case 'unita': return m.perId[C.id] && m.perId[C.id].viva ? m.perId[C.id] : null
    case 'fazione': {
      const b = vive(m).filter(z => z.fazione === C.id && z !== u)
      if (!b.length) return null
      b.sort((p, q) => mappaDi(m, u)[p.y * m.w + p.x] - mappaDi(m, u)[q.y * m.w + q.x])
      return b[0]
    }
    default: return null
  }
}
const MOBILE = { unita: 1, fazione: 1 }
/* «essere a portata»: sulla cella o attaccati. È la precondizione di
   tutte le azioni, ed è la ragione per cui prima si dice `vai`. */
const arrivato = (m, u, C, t) =>
  MOBILE[C.tipo] || (C.tipo === 'porta' && !m.porte[C.id].aperta)
    ? aPortata(u, t) : (u.x === t.x && u.y === t.y)

function fai (m, f, u, o) {
  const C = laCosa(m, o.complemento)
  if (!C) return salta(m, f, u, o.complemento
    ? `«${o.complemento}»? qui non c'è niente che si chiami così`
    : 'questo ordine non dice su cosa')
  const N = C.nome

  /* il tipo e il mestiere sono già filtrati in cassetta e dal
     validatore: questi controlli sono la rete sotto, e servono a un
     livello scritto a mano che sbaglia */
  const V = VERBI[o.verbo]
  if (!V) return salta(m, f, u, `«${o.verbo}»? non so cosa voglia dire`)
  if (!V.accetta.includes(C.tipo)) return salta(m, f, u, `${N} non si può ${V.nome}`)
  if (!saFare(u, o.verbo)) return salta(m, f, u, `non è il mio mestiere: non so ${V.nome}`)

  switch (o.verbo) {

    case 'vai': {
      let t = dove(m, u, C)
      if (MOBILE[C.tipo]) {
        /* nessuna onniscienza: si va da chi si vede, o dove lo si è
           visto l'ultima volta. Ecco perché serve prima la ronda. */
        if (t && vede(m, u, t)) u.visti[t.id] = { x: t.x, y: t.y }
        else {
          const ric = (t && u.visti[t.id]) || u.visti[C.id] || null
          if (!ric) return salta(m, f, u, `${N}? non so dov'è`, 'si guarda intorno')
          if (aPortata(u, ric) && (!t || !vede(m, u, t)))
            return salta(m, f, u, `${N} non è più qui`, 'si guarda intorno')
          t = ric
        }
      }
      if (!t) return salta(m, f, u, `${N} non c'è più`, 'si guarda intorno')
      if (arrivato(m, u, C, t)) { nota(m, f, u, 'fa', `sono a ${N}`, 'si ferma'); return 'fatto' }
      const r = verso(m, u, t.x, t.y)
      if (r === null) return attende(m, f, u, `non riesco ad arrivare a ${N}: la strada è chiusa`)
      f.st.fermo = 0
      nota(m, f, u, 'fa', `vado a ${N}`, 'va verso ' + VERSO[u.dir])
      return arrivato(m, u, C, t) ? 'fatto' : 'lavora'
    }

    /* ── il giro di ronda ──
       I punti sono quelli scritti nell'ordine, in fila, e alla fine si
       ricomincia. L'uscita è `finche`, e si legge nell'ordine: se non
       c'è, il giro non finisce — non è una sorpresa, è quello che c'è
       scritto. Appena la condizione è vera si smette **e parte l'ordine
       dopo**: è così che «avvista e chiama» e «avvista e attacca»
       diventano due piani diversi senza nessun costrutto nuovo. */
    case 'pattuglia': {
      const punti = puntiDi(m, o)
      if (!punti.length) return salta(m, f, u, 'questo giro non ha punti')
      if (o.finche && valuta(m, u, o.finche)) {
        nota(m, f, u, 'fa', `${testoCond(m, o.finche)}: smetto il giro`, 'si ferma di colpo')
        return 'fatto'
      }
      if (f.st.k == null) f.st.k = tappaPiuVicina(m, u, punti)
      const t = punti[f.st.k]
      const r = verso(m, u, t.x, t.y)
      if (r === null) return attende(m, f, u, 'non riesco a fare il giro: la strada è chiusa')
      if (r === 'arrivato') f.st.k = (f.st.k + 1) % punti.length
      f.st.fermo = 0
      nota(m, f, u, 'fa', `faccio il giro (punto ${f.st.k + 1} di ${punti.length})`,
           'va verso ' + VERSO[u.dir])
      return 'lavora'
    }

    /* ── prendere e aprire CAMMINANO ──
       Prima non lo facevano: un'azione riusciva solo da vicino, e il
       bambino doveva mettere un `vai` davanti. Provato col dito non
       regge — tocchi una cosa lontana, non succede niente, e non si
       capisce perché. Il prerequisito che resta, e che è più vero, non
       è la POSIZIONE ma il POSSESSO: al portone ci si arriva sempre, e
       senza la chiave non si apre lo stesso. */
    case 'prendi': {
      const og = m.oggetti.find(z => z.nome === C.id)
      if (!og) return salta(m, f, u, `${N} non c'è più`)
      if (og.preso === u.id) return 'subito'
      if (og.preso) return salta(m, f, u, `${N} ce l'ha già qualcun altro`)
      if (!aPortata(u, og)) {
        const r = verso(m, u, og.x, og.y)
        if (r === null) return attende(m, f, u, `non riesco ad arrivare a ${N}: la strada è chiusa`)
        f.st.fermo = 0
        nota(m, f, u, 'fa', `vado a prendere ${N}`, 'va verso ' + VERSO[u.dir])
        return 'lavora'
      }
      og.preso = u.id; u.zaino.push(C.id); m.eventi.push('presa')
      nota(m, f, u, 'fa', `presa ${N}`, 'raccoglie qualcosa')
      return 'fatto'
    }

    case 'apri': {
      const pt = m.porte[C.id]
      if (pt.aperta) return 'subito'
      if (!aPortata(u, pt)) {
        const r = verso(m, u, pt.x, pt.y)
        if (r === null) return attende(m, f, u, `non riesco ad arrivare a ${N}: la strada è chiusa`)
        f.st.fermo = 0
        nota(m, f, u, 'fa', `vado ad aprire ${N}`, 'va verso ' + VERSO[u.dir])
        return 'lavora'
      }
      if (pt.chiave && !u.zaino.includes(pt.chiave))
        return salta(m, f, u, `${N} è chiuso a chiave, e ${etichetta(m, pt.chiave)} non ce l'ho`,
                     'spinge il portone')
      pt.aperta = true; m.versioneMappa++; m.unita.forEach(z => { z._mk = null })
      m.eventi.push('apre')
      nota(m, f, u, 'fa', `aperto ${N}`, `apre ${N}`)
      return 'fatto'
    }

    case 'attacca': {
      let t = f.st.bersaglio ? m.perId[f.st.bersaglio] : null
      if (t && !t.viva) t = null
      if (!t) {
        const b = dove(m, u, C)
        if (!b) return 'subito'                       // non c'è più nessuno: fatto
        /* Si attacca chi si VEDE, e gli si resta addosso finché non
           cade. L'inseguimento è una scelta dichiarata di questo
           ordine, non un `vai` mascherato: chi non vede nessuno resta
           in guardia, ed è per questo che prima gli serve una ronda. */
        if (!vede(m, u, b)) return attende(m, f, u, `non vedo ${N} da nessuna parte`, 60)
        t = b; f.st.bersaglio = t.id
      }
      f.st.fermo = 0
      if (aPortata(u, t)) {
        t.vita -= DANNO; m.eventi.push('colpo')
        /* UNO SCONTRO DURA, E SI DEVE VEDERE. Il colpo finisce in una
           lista che si svuota a ogni passo: chi disegna sa chi ha
           menato, chi ha incassato e dov'è successo, e quei battiti
           sono la finestra in cui l'altro corre al forziere. */
        m.colpi.push({ da: u.id, a: t.id, x: t.x, y: t.y,
                       vita: Math.max(0, t.vita), vitaMax: t.vitaMax,
                       mortale: t.vita <= 0 })
        if (t.vita <= 0) {
          t.viva = false; m.eventi.push('morte')
          m.fili.forEach(z => { if (z.unita === t.id) { z.finito = true; z.ordine = null } })
          t.ordineOra = null
          nota(m, f, u, 'fa', `${t.nome || t.id} è caduto`, `abbatte ${t.nome || t.id}`)
          return 'fatto'
        }
        /* menare fa rumore: chi le prende chiama i suoi */
        chiamaAllarme(m, t, 'colpito')
        nota(m, f, u, 'fa', `colpisco ${t.nome || t.id}`, `colpisce ${t.nome || t.id}`)
        return 'lavora'
      }
      const r = verso(m, u, t.x, t.y)
      if (r === null) return attende(m, f, u, `non riesco a raggiungere ${t.nome || t.id}`)
      nota(m, f, u, 'fa', `inseguo ${t.nome || t.id}`, 'va verso ' + VERSO[u.dir])
      return 'lavora'
    }

    case 'suona': {
      m.pendenti.push({ seg: C.id, da: u.id }); m.eventi.push('segnale')
      nota(m, f, u, 'fa', `suono «${N}»`, 'fa un segnale')
      return 'fatto'
    }

    /* `quando` non aspetta: ARMA un ascolto e passa oltre. Così un'unità
       può stare in ascolto di due segnali diversi e il seguito dipende
       da quale arriva — che è tutto il punto del ramo. */
    case 'quando': {
      if (!f.armati) f.armati = {}
      if (!f.armati[C.id]) {
        f.armati[C.id] = true
        m.ascolti.push({ unita: u.id, segnale: C.id, ordini: o.allora || [] })
        nota(m, f, u, 'fa', `sto in ascolto di «${N}»`, 'resta in ascolto')
      }
      return 'subito'
    }

    /* si aspetta uno STATO, e lo si aspetta guardando: se quella cosa
       da qui non si vede, non la si può sapere — e allora il piano
       vuole un messaggio, non un'attesa */
    case 'aspetta': {
      if (C.tipo === 'attimo') { nota(m, f, u, 'fa', 'aspetto un momento', 'resta fermo'); return 'fatto' }
      const pt = m.porte[C.id]
      if (!pt) return salta(m, f, u, `${N} non è una cosa che posso stare a guardare`)
      if (pt.aperta) {
        nota(m, f, u, 'fa', `${N} è aperto: riparto`, 'si rimette in moto')
        return 'fatto'
      }
      if (!vedePorta(m, u, pt))
        return salta(m, f, u, `${N} non lo vedo da qui: non posso sapere quando si apre — ` +
                              'me lo deve dire qualcuno', 'si guarda intorno')
      return attende(m, f, u, `aspetto che ${N} si apra`, 9999)
    }

    case 'aspettaDiVedere': {
      const b = vive(m).find(z => z !== u && (z.id === C.id || z.fazione === C.id) && vede(m, u, z))
      if (b) {
        u.visti[b.id] = { x: b.x, y: b.y }
        nota(m, f, u, 'fa', `eccolo: vedo ${b.nome || b.id}`, 'si volta di scatto')
        return 'fatto'
      }
      return attende(m, f, u, `sto di vedetta: non vedo ${N}`, 9999)
    }

    default:
      return salta(m, f, u, `«${o.verbo}»? non so cosa voglia dire`)
  }
}

/* i punti di un giro: `punti` se c'è, se no il solo complemento */
export function puntiDi (m, o) {
  const ids = (o && o.punti && o.punti.length) ? o.punti : [o && o.complemento]
  return ids.map(id => laCosa(m, id)).filter(c => c && Number.isFinite(c.x))
}
function tappaPiuVicina (m, u, z) {
  const d = mappaDi(m, u)
  let k = 0, best = 1e9
  z.forEach((t, i) => { const q = d[t.y * m.w + t.x]; if (q >= 0 && q < best) { best = q; k = i } })
  return (k + 1) % z.length          // si parte dalla tappa DOPO quella su cui si è
}

/* ═══════════ far girare tutto ═══════════
   È quello che usa il test, ed è quello che usa il gioco quando vuole
   sapere com'è finita senza guardare: stesso mondo, stessi ordini,
   stesso esito. Niente `Math.random` da nessuna parte. */
export function esegui (mondo, ordini) {
  const miei = mieUnita(mondo.livello)
  const piano = Array.isArray(ordini) ? { [miei[0]]: ordini } : (ordini || {})

  const guai = guaiDi(mondo, piano)
  if (guai.length)
    return { vinto: false, motivo: 'Ci sono ordini che non si possono dare: ' + guai[0].motivo,
             passi: 0, traccia: [], rifiutati: guai, mondo }

  avvia(mondo, pianoCompleto(mondo.livello, piano))
  while (!mondo.finita) passo(mondo)
  return { vinto: mondo.vinto, motivo: mondo.motivo, passi: mondo.passi,
           traccia: mondo.traccia, rifiutati: [], colpevole: mondo.colpevole,
           perdute: perdute(mondo), mondo }
}

/* ═══════════ le parole ═══════════
   Le stesse etichette le usano il gioco, il registro e i messaggi del
   motore: una cosa si chiama in un modo solo. */
export function testoCond (mondo, c) {
  if (!c) return '…'
  const N = (mondo.cose[c.complemento] || {}).nome || c.complemento
  let t
  switch (c.cond) {
    case 'vedi': t = `vedi ${N}`; break
    case 'vivo': t = `${N} è in piedi`; break
    case 'hai': t = `hai ${N}`; break
    case 'aperta': t = `${N} è aperto`; break
    case 'segnale': t = `è arrivato «${N}»`; break
    case 'qui': t = `${nomeDi(mondo, c.chi)} è a ${N}`; break
    default: t = 'sempre'
  }
  if (!c.non) return t
  return t.replace(' è in piedi', ' è fuori combattimento').replace(/^vedi /, 'non vedi ')
          .replace(/^hai /, 'non hai ').replace(' è aperto', ' è chiuso')
          .replace(/^è arrivato/, 'non è arrivato').replace(' è a ', ' non è a ')
}
export function descrivi (mondo, o, secco) {
  /* un blocco si legge come la domanda che pone, e — se non si è
     stretti — con le due strade che ne partono */
  if (eCondizione(o)) {
    const testa = `condizione [${testoCond(mondo, o.cond)}]`
    if (secco) return testa
    const via = r => ramoDi(o, r).map(q => descrivi(mondo, q, true)).join(', ') || 'niente'
    return `${testa}: se è vero ${via('vero')}, se è falso ${via('falso')}`
  }
  const V = VERBI[o.verbo]; if (!V) return '?'
  const C = laCosa(mondo, o.complemento)
  return V.nome + ' [' + (C ? C.nome : (o.complemento || '…')) + ']'
}
/* le righe del registro, dalla più vecchia alla più nuova */
export const registro = (mondo, quante) =>
  quante ? mondo.traccia.slice(-quante) : mondo.traccia
