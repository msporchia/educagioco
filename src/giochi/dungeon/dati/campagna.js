// Nove discese in tre scalini: la difficoltà (0..1, `quiz/scelta.js`) sale in
// linea retta da `dif[0]` (prima fila) a `dif[1]` (davanti al guardiano),
// vedi `difficoltaDi()`. Perché le discese sono lunghe (tre piani) e il
// numero di domande non è l'input: docs/dungeon/regole.md, COMBATTIMENTO.md.
import { QUANTI_PIANI } from './stanze.js'

export const SCALINI = [
  // la dritta sta su una riga sola: sul telefono viene tagliata se è lunga
  { chiave: 'cantine', nome: 'Le cantine', icona: '🕯️', dritta: 'corte: si impara la strada' },
  { chiave: 'gallerie', nome: 'Le gallerie', icona: '🪨', dritta: 'più lunghe, e si picchia sul serio' },
  { chiave: 'fondo', nome: 'Il fondo', icona: '🐉', dritta: 'spedizioni: si scende e non si torna su' },
]

// sotto questa soglia scendere non si sente (discesa lunga ma piatta)
export const RAMPA_MINIMA = 0.2

// portata: scala 0-100 di data/portata.js. Niente `scuola` qui: quello che
// insegna questa campagna non lo dà nessuna scuola, si taglia solo in alto.
export const CAMPAGNA = [
  /* ── scalino 1: le cantine ── */
  { chiave: 'cantina', nome: 'La cantina', ambiente: 'cantina', scalino: 'cantine',
    portata: 18,
    file: 18, dif: [0, 0.25], premio: 3,
    racconto: 'Una botola in giardino, e sotto una scala che non finisce.' },
  { chiave: 'cripta', nome: 'La cripta', ambiente: 'cripta', scalino: 'cantine',
    portata: 22,
    file: 21, dif: [0.05, 0.35], premio: 3,
    racconto: 'Ossa impilate con ordine. Qualcuna si muove.' },
  { chiave: 'grotta', nome: 'La grotta', ambiente: 'grotta', scalino: 'cantine',
    portata: 26,
    file: 24, dif: [0.1, 0.45], premio: 4,
    racconto: 'Gocce, echi e un battito d\'ali sopra la testa.' },

  /* ── scalino 2: le gallerie ── */
  { chiave: 'fungaia', nome: 'La fungaia', ambiente: 'fungaia', scalino: 'gallerie',
    portata: 38,
    file: 27, dif: [0.2, 0.55], premio: 5,
    racconto: 'Funghi alti come te, e qualcosa che striscia fra i gambi.' },
  { chiave: 'fogne', nome: 'Le fogne', ambiente: 'fogne', scalino: 'gallerie',
    portata: 42,
    file: 30, dif: [0.25, 0.6], premio: 5,
    racconto: 'Acqua nera fino alle caviglie. Meglio non guardare cosa nuota.' },
  { chiave: 'fucina', nome: 'La fucina', ambiente: 'fucina', scalino: 'gallerie',
    portata: 46,
    file: 33, dif: [0.3, 0.7], premio: 6,
    racconto: 'Fa caldo. Qualcuno, laggiù, batte il martello.' },

  // ── scalino 3: il fondo — spedizioni, non più una manciata di stanze
  { chiave: 'ghiacciaia', nome: 'La ghiacciaia', ambiente: 'ghiacciaia', scalino: 'fondo',
    portata: 58,
    file: 36, dif: [0.35, 0.8], premio: 7,
    racconto: 'Il fiato si vede. Le pareti sono di ghiaccio vecchio.' },
  { chiave: 'tana', nome: 'La tana', ambiente: 'tana', scalino: 'fondo',
    portata: 62,
    file: 39, dif: [0.4, 0.9], premio: 8,
    racconto: 'Ossa spolpate e un odore che non promette niente di buono.' },
  { chiave: 'covo', nome: 'Il covo del drago', ambiente: 'covo', scalino: 'fondo',
    portata: 66,
    file: 42, dif: [0.45, 1], premio: 10,
    racconto: 'In fondo si vede una luce arancione. Non è una torcia.' },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappa = indice =>
  CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]

export const scalino = chiave => SCALINI.find(s => s.chiave === chiave) || SCALINI[0]

export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)

// la discesa senza fondo: qui la profondità si sceglie a mano, non capita
export const LIBERE = [
  { chiave: 'corta', nome: 'una corsa', icona: '🕯️', file: 21, dif: [0.1, 0.5], premio: 2 },
  { chiave: 'lunga', nome: 'una discesa', icona: '🪨', file: 33, dif: [0.3, 0.75], premio: 3 },
  { chiave: 'abisso', nome: "l'abisso", icona: '🐉', file: 45, dif: [0.5, 1], premio: 5 },
]

export const PREDEFINITA = 'lunga'

// stessa forma di una tappa della campagna: il motore non sa che è libera
export function tappaLibera(chiaveProfondita, chiaveAmbiente) {
  const p = LIBERE.find(l => l.chiave === chiaveProfondita) ||
            LIBERE.find(l => l.chiave === PREDEFINITA)
  return { ...p, chiave: `libera-${p.chiave}`, nome: p.nome,
           ambiente: chiaveAmbiente, scalino: null, racconto: '', libera: true }
}

export function guastiDellaCampagna(campagna = CAMPAGNA, ambienti, libere = LIBERE) {
  const guasti = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} ("${t.chiave}")`
    if (viste.has(t.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.racconto) guasti.push(`${dove}: senza nome o senza racconto`)
    if (ambienti && !ambienti[t.ambiente]) guasti.push(`${dove}: l'ambiente "${t.ambiente}" non esiste`)
    if (!SCALINI.some(s => s.chiave === t.scalino)) guasti.push(`${dove}: lo scalino "${t.scalino}" non esiste`)
    guasti.push(...guastiDiUnaDiscesa(t, dove))
    if (!(t.premio > 0)) guasti.push(`${dove}: premio ${t.premio}`)
  }
  for (const l of libere) guasti.push(...guastiDiUnaDiscesa(l, `profondità "${l.chiave}"`))

  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1]))
    guasti.push('gli scalini non sono in fila: una tappa facile viene dopo una tosta')
  for (const s of SCALINI)
    if (!campagna.some(t => t.scalino === s.chiave))
      guasti.push(`lo scalino "${s.chiave}" non ha nemmeno una tappa`)

  for (let i = 1; i < campagna.length; i++)
    if (campagna[i].ambiente === campagna[i - 1].ambiente)
      guasti.push(`tappa ${i + 1}: stesso ambiente della precedente`)

  // la campagna è una salita: ogni tappa deve pesare (file × difficoltà) più della precedente
  const peso = t => t.file * (t.dif[0] + t.dif[1])
  for (let i = 1; i < campagna.length; i++)
    if (peso(campagna[i]) <= peso(campagna[i - 1]))
      guasti.push(`tappa ${i + 1} ("${campagna[i].chiave}") non è più dura di quella prima`)
  if (campagna[0].dif[0] !== 0)
    guasti.push('la prima tappa deve cominciare dalle domande più facili che ci sono')
  if (campagna.at(-1).dif[1] !== 1)
    guasti.push("l'ultima tappa deve arrivare alle domande più difficili che ci sono")
  return guasti
}

function guastiDiUnaDiscesa(t, dove) {
  const guasti = []
  // minimo 3 piani da 4 file (sotto, un piano è ingresso-riposo-capo e basta); max 45 (una serata)
  if (!(t.file >= QUANTI_PIANI * 4 && t.file <= 45)) guasti.push(`${dove}: ${t.file} file`)
  if (t.file % QUANTI_PIANI) guasti.push(`${dove}: ${t.file} file non si dividono in ${QUANTI_PIANI} piani`)
  if (t.cuori !== undefined)
    guasti.push(`${dove}: dichiara "cuori", ma la vita adesso è dell'eroe (dati/eroe.js)`)
  if (!Array.isArray(t.dif) || t.dif.length !== 2) guasti.push(`${dove}: la difficoltà non è una coppia`)
  else {
    const [a, b] = t.dif
    if (!(a >= 0 && b <= 1)) guasti.push(`${dove}: difficoltà ${a}..${b} fuori da 0..1`)
    if (!(b > a)) guasti.push(`${dove}: la difficoltà non cresce scendendo (${a}..${b})`)
    else if (b - a < RAMPA_MINIMA)
      guasti.push(`${dove}: scendere non si sente (${a}..${b}, ne serve ${RAMPA_MINIMA})`)
  }
  return guasti
}

// unico posto che decide quanto è tosta una domanda: quanto si è scesi + il rincaro della stanza
export function difficoltaDi(t, riga, rincaro = 0) {
  const [a, b] = t.dif
  const profondita = t.file > 1 ? Math.min(1, Math.max(0, riga / (t.file - 1))) : 1
  return Math.min(1, Math.max(0, a + (b - a) * profondita + rincaro))
}
