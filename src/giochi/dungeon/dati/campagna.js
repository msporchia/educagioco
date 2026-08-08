/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA — nove discese, in tre scalini

   L'ingresso al gioco non è «scegli la difficoltà»: è una scala che
   scende. Prima tre cantine corte per imparare la strada, poi le
   gallerie, poi il fondo — e la difficoltà non la sceglie il bambino,
   gliela porta il viaggio.

   Una tappa è **lo stesso dungeon con altri numeri e un altro
   vestito**: tre manopole e un ambiente di `mostri.js`.

     file      quante file ha la discesa, cioè quanto è lunga. Si
               dividono in tre piani (vedi `stanze.js`)
     dif       LA MANOPOLA DELLA PROFONDITÀ: da quanto sono difficili le
               domande della **prima fila** a quanto lo sono quelle
               davanti al guardiano (0..1, come vuole `quiz/scelta.js`).
               Fra i due estremi si sale in linea retta fila per fila —
               il conto è `difficoltaDi()`, qui sotto, ed è l'unico che
               c'è. Scendere si deve sentire: `RAMPA_MINIMA` dice di
               quanto la seconda deve staccare la prima.
     premio    le monete vere di fine tappa, moltiplicate per le stelle

   Non c'è più nessun `cuori`: la vita è dell'eroe, non della tappa, e
   cresce con le tappe portate a casa (`dati/eroe.js`).

   ── PERCHÉ SONO LUNGHE COSÌ ──
   Erano da sei a quattordici file. Adesso sono il triplo, e non è una
   manopola girata a caso: **è la condizione perché il bottino esista**.
   Una discesa in cui la spada trovata combattendo si usa per due
   stanze non ha un bottino, ha una notifica; il divertimento sta nel
   vedere l'eroe diventare forte e poi *giocarci*, e per giocarci serve
   strada davanti. Tre piani sono la lunghezza minima perché una cosa
   trovata in fondo al primo si porti in giro per due.

   Questo manda all'aria il conto delle domande per tappa ereditato dal
   castello (là una tappa dichiara quanti esercizi costa, e trenta è il
   tetto oltre il quale è un compito). Qui il numero di domande **non è
   più l'input**: è quello che risulta da come combatti e da come ti
   equipaggi, e chi si potenzia bene ne fa meno. Il ragionamento per
   esteso, con quello che si perde a fare così, sta in `taratura.js`
   sotto `DOMANDE` e in `COMBATTIMENTO.md`.

   Le domande diventano più difficili in due modi insieme, e questo è il
   punto: **scendendo** (la profondità alza `dif`) e **scegliendo**
   (una stanza ricca rincara). Un bambino che gioca prudente vede
   sempre domande un po' più facili di uno che va a caccia di scrigni,
   e le vede tutte e due nella stessa tappa.

   Finite le nove, si apre la **discesa senza fondo**: è l'unico posto
   dove la profondità si sceglie a mano, perché è quella che uno si va a
   prendere, non quella che gli capita.
   ═══════════════════════════════════════════════════════════════════ */

import { QUANTI_PIANI } from './stanze.js'

export const SCALINI = [
  /* la dritta sta su una riga sola accanto al nome: se è lunga, sul
     telefono viene tagliata e non dice più niente */
  { chiave: 'cantine', nome: 'Le cantine', icona: '🕯️', dritta: 'corte: si impara la strada' },
  { chiave: 'gallerie', nome: 'Le gallerie', icona: '🪨', dritta: 'più lunghe, e si picchia sul serio' },
  { chiave: 'fondo', nome: 'Il fondo', icona: '🐉', dritta: 'spedizioni: si scende e non si torna su' },
]

/* Di quanto le domande del fondo devono staccare quelle dell'ingresso.
   Sotto questa soglia la discesa è lunga uguale ma piatta, e scendere
   non si sente: il controllo dei dati la fa rispettare a tutte. */
export const RAMPA_MINIMA = 0.2

export const CAMPAGNA = [
  /* ── scalino 1: le cantine ── */
  { chiave: 'cantina', nome: 'La cantina', ambiente: 'cantina', scalino: 'cantine',
    file: 18, dif: [0, 0.25], premio: 3,
    racconto: 'Una botola in giardino, e sotto una scala che non finisce.' },
  { chiave: 'cripta', nome: 'La cripta', ambiente: 'cripta', scalino: 'cantine',
    file: 21, dif: [0.05, 0.35], premio: 3,
    racconto: 'Ossa impilate con ordine. Qualcuna si muove.' },
  { chiave: 'grotta', nome: 'La grotta', ambiente: 'grotta', scalino: 'cantine',
    file: 24, dif: [0.1, 0.45], premio: 4,
    racconto: 'Gocce, echi e un battito d\'ali sopra la testa.' },

  /* ── scalino 2: le gallerie ── */
  { chiave: 'fungaia', nome: 'La fungaia', ambiente: 'fungaia', scalino: 'gallerie',
    file: 27, dif: [0.2, 0.55], premio: 5,
    racconto: 'Funghi alti come te, e qualcosa che striscia fra i gambi.' },
  { chiave: 'fogne', nome: 'Le fogne', ambiente: 'fogne', scalino: 'gallerie',
    file: 30, dif: [0.25, 0.6], premio: 5,
    racconto: 'Acqua nera fino alle caviglie. Meglio non guardare cosa nuota.' },
  { chiave: 'fucina', nome: 'La fucina', ambiente: 'fucina', scalino: 'gallerie',
    file: 33, dif: [0.3, 0.7], premio: 6,
    racconto: 'Fa caldo. Qualcuno, laggiù, batte il martello.' },

  /* ── scalino 3: il fondo ──
     Qui una discesa non si fa più in una manciata di stanze: sono
     spedizioni, e l'equipaggiamento trovato per strada serve tutto. */
  { chiave: 'ghiacciaia', nome: 'La ghiacciaia', ambiente: 'ghiacciaia', scalino: 'fondo',
    file: 36, dif: [0.35, 0.8], premio: 7,
    racconto: 'Il fiato si vede. Le pareti sono di ghiaccio vecchio.' },
  { chiave: 'tana', nome: 'La tana', ambiente: 'tana', scalino: 'fondo',
    file: 39, dif: [0.4, 0.9], premio: 8,
    racconto: 'Ossa spolpate e un odore che non promette niente di buono.' },
  { chiave: 'covo', nome: 'Il covo del drago', ambiente: 'covo', scalino: 'fondo',
    file: 42, dif: [0.45, 1], premio: 10,
    racconto: 'In fondo si vede una luce arancione. Non è una torcia.' },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappa = indice =>
  CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]

export const scalino = chiave => SCALINI.find(s => s.chiave === chiave) || SCALINI[0]

export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)

/* ── la discesa senza fondo ──
   Tre profondità, e la difficoltà non è un numero da 0 a 1 sullo
   schermo: è «quanto scendi». Vive solo qui, fuori dalla campagna,
   perché è quella che ci si va a prendere. */
export const LIBERE = [
  { chiave: 'corta', nome: 'una corsa', icona: '🕯️', file: 21, dif: [0.1, 0.5], premio: 2 },
  { chiave: 'lunga', nome: 'una discesa', icona: '🪨', file: 33, dif: [0.3, 0.75], premio: 3 },
  { chiave: 'abisso', nome: "l'abisso", icona: '🐉', file: 45, dif: [0.5, 1], premio: 5 },
]

export const PREDEFINITA = 'lunga'

/* Una tappa del gioco libero: la profondità scelta più un ambiente
   scelto. Ha la stessa forma di una tappa della campagna, così il
   motore non sa nemmeno di stare giocando fuori dalla campagna. */
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

  /* due tappe di fila con lo stesso vestito non sono due posti diversi */
  for (let i = 1; i < campagna.length; i++)
    if (campagna[i].ambiente === campagna[i - 1].ambiente)
      guasti.push(`tappa ${i + 1}: stesso ambiente della precedente`)

  /* LA CAMPAGNA È UNA SALITA. Non basta che ogni tappa stia in piedi:
     devono diventare più dure, o sono nove volte la stessa. Il metro è
     grezzo apposta — quante file per quanto sono difficili le domande —
     e non deve mai scendere. */
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
  /* Il minimo sono tre piani da quattro file: sotto, un piano è
     ingresso-riposo-capo e non resta niente da scegliere, cioè i piani
     diventano una scritta. Il massimo tiene conto di come si gioca
     davvero: quarantacinque file sono già una serata, e una discesa
     che non si finisce in una seduta non la finisce nessuno. */
  if (!(t.file >= QUANTI_PIANI * 4 && t.file <= 45)) guasti.push(`${dove}: ${t.file} file`)
  /* le file si devono dividere in piani interi, o l'ultimo piano nasce
     lungo la metà degli altri e il terzo atto non è un terzo atto */
  if (t.file % QUANTI_PIANI) guasti.push(`${dove}: ${t.file} file non si dividono in ${QUANTI_PIANI} piani`)
  if (t.cuori !== undefined)
    guasti.push(`${dove}: dichiara "cuori", ma la vita adesso è dell'eroe (dati/eroe.js)`)
  if (!Array.isArray(t.dif) || t.dif.length !== 2) guasti.push(`${dove}: la difficoltà non è una coppia`)
  else {
    const [a, b] = t.dif
    if (!(a >= 0 && b <= 1)) guasti.push(`${dove}: difficoltà ${a}..${b} fuori da 0..1`)
    if (!(b > a)) guasti.push(`${dove}: la difficoltà non cresce scendendo (${a}..${b})`)
    /* una discesa lunga con la stessa domanda dall'inizio alla fine è
       lunga e basta: scendere si deve sentire */
    else if (b - a < RAMPA_MINIMA)
      guasti.push(`${dove}: scendere non si sente (${a}..${b}, ne serve ${RAMPA_MINIMA})`)
  }
  return guasti
}

/* La difficoltà della domanda in una stanza: quanto si è scesi, più il
   rincaro di quella stanza. È **l'unico posto** in cui si decide quanto
   è tosta una domanda, e sta nei dati apposta: chi vuole un dungeon più
   gentile cambia due numeri e non apre il motore. */
export function difficoltaDi(t, riga, rincaro = 0) {
  const [a, b] = t.dif
  const profondita = t.file > 1 ? Math.min(1, Math.max(0, riga / (t.file - 1))) : 1
  return Math.min(1, Math.max(0, a + (b - a) * profondita + rincaro))
}
