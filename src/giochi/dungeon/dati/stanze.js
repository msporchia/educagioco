// Le stanze: una promessa (gemme, equipaggiamento, vita) e un prezzo (chi ci
// abita). Il numero di domande non è più dichiarato: lo decide lo scontro
// (vita di chi abita / quanto picchi). I tre piani e il patto del bivio (una
// stanza non deve dominarne un'altra) sono spiegati in COMBATTIMENTO.md.

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

// le file si dividono in tre blocchi il più uguali possibile; l'ultima fila
// di ogni blocco è il suo capo, il guardiano vero è quello dell'ultimo piano
export function pianoDi(riga, quanteFile, quantiPiani = QUANTI_PIANI) {
  const perPiano = quanteFile / quantiPiani
  return Math.min(quantiPiani - 1, Math.floor(riga / perPiano))
}

export function finePiano(piano, quanteFile, quantiPiani = QUANTI_PIANI) {
  return Math.round((piano + 1) * quanteFile / quantiPiani) - 1
}

export const inizioPiano = (piano, quanteFile, quantiPiani = QUANTI_PIANI) =>
  piano <= 0 ? 0 : finePiano(piano - 1, quanteFile, quantiPiani) + 1

export const eFinePiano = (riga, quanteFile, quantiPiani = QUANTI_PIANI) =>
  Array.from({ length: quantiPiani }, (_, p) => finePiano(p, quanteFile, quantiPiani))
    .includes(riga)

// tetto al bottino: il minore fra quanto promette la stanza, quanto il piano
// si può permettere (qui sotto), e quanto la campagna ha aperto finora (sotto)
export const GRADO_DEL_PIANO = [2, 3, 1]

// la lama del drago non si trova nella cantina di casa: ogni scalino apre un grado
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

// il bollino sulla mappa (0..3): dalla stazza di chi abita e da quanto sono toste le domande
export function rischioDi(tipo, difficolta = 1) {
  const s = stanza(tipo)
  if (!s.taglia) return 0
  const dif = Math.min(1, Math.max(0, difficolta))
  const stazza = { serratura: 1, normale: 1.4, grosso: 2.2, guardiano: 3 }[s.taglia] || 1
  return Math.max(1, Math.min(3, Math.round(stazza * 0.6 + dif * 1.4)))
}

// da cosa si pesca fila per fila: si comincia sempre picchiando, la fila
// prima di ogni capo è sempre un fuoco (rifiatare prima di un capo è dovuto)
export const SACCHI = {
  ingresso: ['mostro'],
  presto: ['mostro', 'mostro', 'bivio', 'scrigno'],
  cuore: ['mostro', 'mostro', 'mostro', 'grosso', 'grosso',
          'bivio', 'bivio', 'scrigno', 'fuoco', 'negozio'],
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

// `lascia` (quanto spesso una stanza dà equipaggiamento) vive in taratura.js
// e arriva da fuori perché i dati non si vadano a cercare fra loro
export function guastiDelleStanze(stanze = STANZE, lascia = {}, quantiPiani = QUANTI_PIANI) {
  const guasti = []
  for (const [chiave, s] of Object.entries(stanze)) {
    const dove = `stanza "${chiave}"`
    if (!s.icona || !s.nome || !s.dritta) guasti.push(`${dove}: senza icona, nome o dritta`)
    if (!/^#[0-9a-f]{6}$/i.test(s.colore || '')) guasti.push(`${dove}: colore "${s.colore}" non è un colore`)
    if (!(s.rincaro >= 0 && s.rincaro <= 0.5)) guasti.push(`${dove}: rincaro ${s.rincaro} fuori scala`)
    if (!(s.grado >= 0 && s.grado <= 3)) guasti.push(`${dove}: grado del bottino ${s.grado} fuori scala`)
    if (!s.taglia && s.sfuma) guasti.push(`${dove}: punisce senza avere nessuno dentro`)
    if (s.taglia === 'serratura' && !s.sfuma)
      guasti.push(`${dove}: una serratura che non sfuma non punisce niente`)
  }
  // il patto del bivio (nessuna stanza deve dominarne un'altra): COMBATTIMENTO.md
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
        [durezza(b), durezza(a)],   // costare meno è un pregio
      ]
      if (pregi.every(([x, y]) => x >= y) && pregi.some(([x, y]) => x > y))
        guasti.push(`"${ka}" è meglio di "${kb}" sotto ogni aspetto: il bivio non è una scelta`)
    }

  for (const nome of ['ingresso', 'presto', 'cuore', 'fondo', 'riposo', 'capo', 'fine'])
    if (!SACCHI[nome]?.length) guasti.push(`il sacco "${nome}" è vuoto`)
  for (const [nome, sacco] of Object.entries(SACCHI))
    for (const t of sacco)
      if (!stanze[t]) guasti.push(`il sacco "${nome}" pesca "${t}", che non è una stanza`)
  if (GRADO_DEL_PIANO.length !== quantiPiani)
    guasti.push(`i gradi per piano sono ${GRADO_DEL_PIANO.length}, i piani ${quantiPiani}`)
  if (GRADO_DEL_PIANO.at(-1) >= Math.max(...GRADO_DEL_PIANO.slice(0, -1)))
    guasti.push("l'ultimo piano lascia roba buona quanto i primi: si troverebbe troppo tardi per usarla")
  return guasti
}
