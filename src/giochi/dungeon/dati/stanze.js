/* ═══════════════════════════════════════════════════════════════════
   LE STANZE — cosa può esserci a un bivio, e su che piano

   Una stanza è una promessa e un prezzo. La promessa è quello che dà
   (gemme, equipaggiamento, vita), il prezzo è **chi ci trovi dentro**:
   se una strada promette di più, ci abita qualcosa di più grosso.
   È la regola che tiene in piedi tutto il gioco — senza, scegliere la
   strada sarebbe come tirare un dado, e il bivio non sarebbe una scelta.

     taglia    che ossa ha chi ci abita (vedi TAGLIE in mostri.js)
     rincaro   quanto si alza la difficoltà della domanda, oltre a
               quella che porta già la profondità
     grado     fin dove può arrivare il bottino che lascia
     sfuma     sbagliando non si perde vita: si perde il tesoro
     ricchezza quanto rende, in gemme relative (0 = non dà gemme)

   ── COSA È CAMBIATO, E PERCHÉ ──
   Prima una stanza dichiarava `chiede: 2` — due risposte giuste e si
   passava, sempre e per tutti. Adesso non c'è più nessun numero di
   domande scritto da nessuna parte: **quante ne costa una stanza lo
   decide lo scontro**, cioè la vita di chi ci abita diviso quanto
   picchi tu. La stessa stanza costa cinque risposte a chi ci arriva
   con lo spadino e due a chi ha trovato la lama del drago, ed è
   esattamente il motivo per cui vale la pena andarsela a cercare.

   ── I TRE PIANI ──
   Una discesa è lunga e si divide in tre. Non è una decorazione: è la
   regola che dice **dove cade il bottino buono**.

     piano 1   si fa la mano, si trova l'equipaggiamento di base
     piano 2   è dove cade la roba migliore, perché è ancora presto
               per usarla per un piano intero
     piano 3   niente armi nuove: cure, gemme e il guardiano

   Se la lama del drago cadesse a due stanze dalla fine, non sarebbe un
   premio: sarebbe un cartello che dice «avresti potuto». In fondo a
   ogni piano c'è un guardiano di piano, e prima un fuoco: si arriva a
   un capo sempre potendo rifiatare.
   ═══════════════════════════════════════════════════════════════════ */

export const QUANTI_PIANI = 3

export const STANZE = {
  mostro: {
    icona: '⚔️', nome: 'Un mostro', colore: '#e0644f', taglia: 'normale',
    dritta: 'Ti sbarra la strada. Picchialo finché non cade.',
    rincaro: 0, grado: 1, sfuma: false, ricchezza: 1, scappabile: true,
  },
  grosso: {
    icona: '🐲', nome: 'Un mostro grosso', colore: '#c2352a', taglia: 'grosso',
    dritta: 'Tanta vita e picchia forte. Ma lascia roba buona.',
    rincaro: 0.18, grado: 2, sfuma: false, ricchezza: 3, scappabile: true,
  },
  capo: {
    icona: '💀', nome: 'Il capo del piano', colore: '#ff7ad9', taglia: 'guardiano',
    dritta: 'Chiude il piano. Grosso, e lascia il meglio che c\'è.',
    rincaro: 0.22, grado: 3, sfuma: false, ricchezza: 2, scappabile: false,
  },
  scrigno: {
    icona: '🎁', nome: 'Uno scrigno chiuso', colore: '#f0b429', taglia: 'serratura',
    /* niente combattimento: una domanda sola, tosta, e o si apre o
       resta chiuso. È la strada che non costa vita ma che si può
       sbagliare per intero */
    dritta: 'Niente da combattere: una domanda sola, ma tosta. Se sbagli non si apre.',
    rincaro: 0.3, grado: 3, sfuma: true, ricchezza: 2.5, scappabile: false,
  },
  fuoco: {
    icona: '🔥', nome: 'Un fuoco da campo', colore: '#ff8a3d', taglia: null,
    dritta: 'Nessuna domanda: ci si cura o ci si allena, una cosa sola.',
    rincaro: 0, grado: 0, sfuma: false, ricchezza: 0, scappabile: false,
  },
  negozio: {
    icona: '🏪', nome: 'Un mercante', colore: '#4fb3e0', taglia: null,
    dritta: 'Nessuna domanda: si spendono le gemme raccolte.',
    rincaro: 0, grado: 0, sfuma: false, ricchezza: 0, scappabile: false,
  },
  bivio: {
    icona: '❓', nome: 'Una stranezza', colore: '#a06fe0', taglia: null,
    dritta: 'Nessuna domanda: si decide e basta. Può andare bene o male.',
    rincaro: 0, grado: 0, sfuma: false, ricchezza: 0.5, scappabile: false,
  },
  boss: {
    icona: '👑', nome: 'Il guardiano', colore: '#ffd23f', taglia: 'guardiano',
    dritta: 'Il padrone di casa. Le domande più difficili del dungeon.',
    rincaro: 0.3, grado: 0, sfuma: false, ricchezza: 0, scappabile: false,
  },
}

export const CHIAVI_STANZE = Object.keys(STANZE)

export const stanza = tipo => STANZE[tipo] || STANZE.mostro

/* ── i piani ──
   Le file si dividono in tre blocchi il più uguali possibile. L'ultima
   fila di ogni blocco è il suo capo; il guardiano vero è quello
   dell'ultimo piano. */
export function pianoDi(riga, quanteFile, quantiPiani = QUANTI_PIANI) {
  const perPiano = quanteFile / quantiPiani
  return Math.min(quantiPiani - 1, Math.floor(riga / perPiano))
}

/* l'ultima fila di ogni piano: quella dove c'è il capo */
export function finePiano(piano, quanteFile, quantiPiani = QUANTI_PIANI) {
  return Math.round((piano + 1) * quanteFile / quantiPiani) - 1
}

export const inizioPiano = (piano, quanteFile, quantiPiani = QUANTI_PIANI) =>
  piano <= 0 ? 0 : finePiano(piano - 1, quanteFile, quantiPiani) + 1

export const eFinePiano = (riga, quanteFile, quantiPiani = QUANTI_PIANI) =>
  Array.from({ length: quantiPiani }, (_, p) => finePiano(p, quanteFile, quantiPiani))
    .includes(riga)

/* Fin dove può arrivare il bottino trovato qui: il minore fra tre
   tetti — quello che promette la stanza, quello che il piano si può
   permettere, e quello che la campagna ha aperto finora. */
export const GRADO_DEL_PIANO = [2, 3, 1]

/* ── il terzo tetto: la campagna ──
   La lama del drago non si trova nella cantina di casa. Senza questa
   riga il bottino migliore usciva già alla prima tappa, e le otto dopo
   non avevano più niente di nuovo da mostrare: si arrivava in fondo
   alla cantina con lo stesso equipaggiamento con cui si arriva in
   fondo al covo, e la campagna diventava nove volte la stessa discesa
   con le facce cambiate. Adesso ogni scalino apre un grado. */
export const GRADO_DELLO_SCALINO = [2, 3, 3]

export const gradoDelLivello = (livello = 0) =>
  GRADO_DELLO_SCALINO[Math.min(Math.floor(Math.max(0, livello) / 3), GRADO_DELLO_SCALINO.length - 1)]

export function gradoBottino(tipo, piano, livello = 99) {
  const promesso = stanza(tipo).grado
  if (!promesso) return 0
  return Math.min(promesso,
                  GRADO_DEL_PIANO[Math.min(piano, GRADO_DEL_PIANO.length - 1)],
                  gradoDelLivello(livello))
}

/* Il bollino sulla mappa: da 0 (nessuna domanda) a 3 (il guardiano).
   Serve al bambino per scegliere la strada **prima** di entrarci.
   Adesso che la stanza non dichiara più quante risposte chiede, il
   bollino si ricava dalle due cose che rendono dura una strada davvero:
   quanto è grosso chi ci abita e quanto sono toste le sue domande. */
export function rischioDi(tipo, difficolta = 1) {
  const s = stanza(tipo)
  if (!s.taglia) return 0
  const dif = Math.min(1, Math.max(0, difficolta))
  const stazza = { serratura: 1, normale: 1.4, grosso: 2.2, guardiano: 3 }[s.taglia] || 1
  return Math.max(1, Math.min(3, Math.round(stazza * 0.6 + dif * 1.4)))
}

/* ── da cosa si pesca, fila per fila ──
   Il dungeon non è una fila di mostri: si comincia sempre picchiando
   (così si impara cosa si deve fare), poi si apre. La fila prima di
   ogni capo è **sempre** un fuoco — arrivare a un capo senza aver
   potuto rifiatare non è difficile, è ingiusto. */
export const SACCHI = {
  ingresso: ['mostro'],
  presto: ['mostro', 'mostro', 'bivio', 'scrigno'],
  cuore: ['mostro', 'mostro', 'mostro', 'grosso', 'grosso',
          'bivio', 'bivio', 'scrigno', 'fuoco', 'negozio'],
  /* il terzo piano non offre più equipaggiamento nuovo: si spinge
     verso il guardiano, e quello che si trova serve ad arrivarci vivi */
  fondo: ['mostro', 'mostro', 'grosso', 'grosso', 'bivio', 'fuoco', 'negozio'],
  riposo: ['fuoco'],
  capo: ['capo'],
  fine: ['boss'],
}

export function saccoDellaRiga(riga, quanteFile, quantiPiani = QUANTI_PIANI) {
  if (riga === 0) return 'ingresso'
  if (riga === quanteFile - 1) return 'fine'
  const piano = pianoDi(riga, quanteFile, quantiPiani)
  if (riga === finePiano(piano, quanteFile, quantiPiani)) return 'capo'
  if (riga === finePiano(piano, quanteFile, quantiPiani) - 1) return 'riposo'
  if (riga === 1) return 'presto'
  return piano === quantiPiani - 1 ? 'fondo' : 'cuore'
}

/* `lascia` — quanto spesso una stanza dà equipaggiamento — vive in
   `taratura.js`, ma senza non si può giudicare se una strada conviene:
   il capo rende meno gemme del mostro grosso e lascia sempre qualcosa.
   Arriva da fuori perché i dati non si vadano a cercare fra loro. */
export function guastiDelleStanze(stanze = STANZE, lascia = {}, quantiPiani = QUANTI_PIANI) {
  const guasti = []
  for (const [chiave, s] of Object.entries(stanze)) {
    const dove = `stanza "${chiave}"`
    if (!s.icona || !s.nome || !s.dritta) guasti.push(`${dove}: senza icona, nome o dritta`)
    if (!/^#[0-9a-f]{6}$/i.test(s.colore || '')) guasti.push(`${dove}: colore "${s.colore}" non è un colore`)
    if (!(s.rincaro >= 0 && s.rincaro <= 0.5)) guasti.push(`${dove}: rincaro ${s.rincaro} fuori scala`)
    if (!(s.grado >= 0 && s.grado <= 3)) guasti.push(`${dove}: grado del bottino ${s.grado} fuori scala`)
    /* una stanza che non ha nessuno dentro non può punire, e una che
       ha un mostro deve pur costare qualcosa */
    if (!s.taglia && s.sfuma) guasti.push(`${dove}: punisce senza avere nessuno dentro`)
    if (s.taglia === 'serratura' && !s.sfuma)
      guasti.push(`${dove}: una serratura che non sfuma non punisce niente`)
  }
  /* ── IL PATTO DEL BIVIO ──
     Una stanza non deve **dominarne** un'altra: non deve cioè costare
     meno e insieme rendere di più sotto ogni aspetto. Non è un
     ordinamento unico — il mostro grosso rende più gemme del capo, il
     capo lascia sempre equipaggiamento, lo scrigno non fa male ma può
     andare a vuoto — ed è giusto che non lo sia: se una strada fosse
     meglio di un'altra sotto tutti i punti di vista, il bivio non
     sarebbe più una scelta e la mappa si potrebbe percorrere a occhi
     chiusi. Questa è la regola su cui sta in piedi tutto il gioco, e si
     scolla senza che si veda a schermo: per questo va provata.

     La durezza mette insieme le tre cose che rendono cara una strada:
     chi ci abita, quanto sono toste le sue domande, e se sbagliare
     manda tutto a monte. */
  const stazze = { serratura: 1, normale: 1.4, grosso: 2.2, guardiano: 3 }
  const durezza = s => stazze[s.taglia] + s.rincaro * 3 + (s.sfuma ? 1.5 : 0)
  const paganti = Object.entries(stanze).filter(([, s]) => s.ricchezza > 0 && s.taglia)
  for (const [ka, a] of paganti)
    for (const [kb, b] of paganti) {
      if (ka === kb) continue
      const pregi = [
        [a.ricchezza, b.ricchezza],
        [a.grado, b.grado],
        [lascia[ka] ?? 0, lascia[kb] ?? 0],
        [durezza(b), durezza(a)],          // costare meno è un pregio
      ]
      if (pregi.every(([x, y]) => x >= y) && pregi.some(([x, y]) => x > y))
        guasti.push(`"${ka}" è meglio di "${kb}" sotto ogni aspetto: il bivio non è una scelta`)
    }

  for (const nome of ['ingresso', 'presto', 'cuore', 'fondo', 'riposo', 'capo', 'fine'])
    if (!SACCHI[nome]?.length) guasti.push(`il sacco "${nome}" è vuoto`)
  for (const [nome, sacco] of Object.entries(SACCHI))
    for (const t of sacco)
      if (!stanze[t]) guasti.push(`il sacco "${nome}" pesca "${t}", che non è una stanza`)
  /* il terzo piano non deve poter offrire armi nuove: è la regola
     «il bottino buono cade presto», e vive in GRADO_DEL_PIANO */
  if (GRADO_DEL_PIANO.length !== quantiPiani)
    guasti.push(`i gradi per piano sono ${GRADO_DEL_PIANO.length}, i piani ${quantiPiani}`)
  if (GRADO_DEL_PIANO.at(-1) >= Math.max(...GRADO_DEL_PIANO.slice(0, -1)))
    guasti.push("l'ultimo piano lascia roba buona quanto i primi: si troverebbe troppo tardi per usarla")
  return guasti
}
