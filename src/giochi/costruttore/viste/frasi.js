/* ═══════════════════════════════════════════════════════════════════
   COME SI LEGGE UNA RIGA

   Ogni istruzione diventa una **frase con delle caselle**: «vai [→ a
   destra] [3]», «[h] diventa [h + 1]», «ripeti · smetti quando [qui
   c'è il terreno]». Il bambino non scrive mai codice: tocca le caselle.
   Le parole stanno qui, una volta sola, perché le leggono tre posti —
   la riga, la pulsantiera che la propone, e il test che controlla che
   ogni blocco abbia la sua frase.
   ═══════════════════════════════════════════════════════════════════ */
import { colore } from '../dati/colori.js'

export const ICONE = {
  vai: '🚶', metti: '🧱', ripeti: '🔁', finche: '🔁', se: '❓', assegna: '📝',
  prendi: '✋', posa: '📥', aspetta: '⏳', sempre: '♾️', pausa: '⏸️',
}

export const VERSI_IN_PAROLE = { destra: '→ a destra', sinistra: '← a sinistra', su: '↑ su', giu: '↓ giù' }
/* nel porto il robot prende e posa di fianco a sé: la freccia dice da
   che parte */
export const LATI_PRENDI = { su: '↑ da sopra', giu: '↓ da sotto', sinistra: '← da sinistra', destra: '→ da destra' }
export const LATI_POSA = { su: '↑ sopra', giu: '↓ sotto', sinistra: '← a sinistra', destra: '→ a destra' }
/* dove si legge: la freccia sola, perché sta dentro una casella */
export const FRECCE = { su: '↑', giu: '↓', sinistra: '←', destra: '→', mano: '✋' }
/* dove va un mattone: sotto i piedi (e ci si sale), o dove andrà il piede */
export const POSTI_IN_PAROLE = {
  sotto: '↓ sotto i piedi', 'giu-destra': '↘ in basso a destra', 'giu-sinistra': '↙ in basso a sinistra',
}
export const DOVE_IN_PAROLE = {
  sotto: '↓ sotto i piedi', 'giu-destra': '↘ in basso a destra', 'giu-sinistra': '↙ in basso a sinistra',
  destra: '→ a destra', sinistra: '← a sinistra', sopra: '↑ sopra la testa',
  /* il porto, dall'alto */
  su: '↑ sopra', giu: '↓ sotto', mano: '✋ in mano',
}
export const COSE_IN_PAROLE = {
  vuoto: 'il vuoto', mattone: 'un mattone', terreno: 'il terreno', acqua: 'l\'acqua',
  pieno: 'qualcosa', bordo: 'il bordo',
  cassa: 'una cassa', niente: 'niente', libero: 'posto per passare', cliente: 'un cliente',
  biglietto: 'un biglietto', bancone: 'il bancone', scaffale: 'uno scaffale', cassone: 'un cassone',
  nastro: 'il nastro', muro: 'il muro', mare: 'il mare', camion: 'un camion', strada: 'la strada',
}
/* «una cassa rossa», «un cassone rosso»: il colore si accorda */
const AL_FEMMINILE = { rosso: 'rossa', giallo: 'gialla', bianco: 'bianca', grigio: 'grigia', nero: 'nera' }
export const CONFRONTI_IN_PAROLE = { '<': 'è minore di', '=': 'è uguale a', '>': 'è maggiore di' }

/* un numero, come si vede nella casella: la N è quello che resta da
   scegliere */
export function numeroInParole(e) {
  if (!e || e.vuoto) return 'N'
  if (typeof e === 'string') return (colore(e) || {}).nome || e
  if (typeof e.n === 'number') return String(e.n)
  if (typeof e.v === 'string') return e.v
  if (e.leggi) return `📖 ${FRECCE[e.leggi] || '?'}`
  if (e.op) return `${numeroInParole(e.a)} ${e.op === '-' ? '−' : e.op} ${numeroInParole(e.b)}`
  return '?'
}

export function condizioneInParole(c) {
  if (!c) return '…?'
  if (c.tipo === 'confronta')
    return `${numeroInParole(c.a)} ${CONFRONTI_IN_PAROLE[c.cmp] || c.cmp} ${numeroInParole(c.b)}`
  const cosa = c.colore && ['mattone', 'cassa', 'cassone', 'camion'].includes(c.cosa)
    ? `${COSE_IN_PAROLE[c.cosa]} ${nomeDelColore(c.colore, c.cosa === 'cassa')}` : (COSE_IN_PAROLE[c.cosa] || c.cosa)
  return `${DOVE_IN_PAROLE[c.dove] || c.dove} ${c.c === false ? 'non c\'è' : 'c\'è'} ${cosa}`
}

/* il colore di una domanda: scritto («rossa», se è una cassa), o il nome
   di chi lo porta, o quello che il robot legge */
function nomeDelColore(c, femminile) {
  if (typeof c === 'string') return femminile ? (AL_FEMMINILE[c] || (colore(c) || {}).nome || c) : ((colore(c) || {}).nome || c)
  return numeroInParole(c)
}

/* un numero che nomina una lavagnetta (o una misura) si disegna come
   la lavagnetta che è, non come una cifra */
export const nominaQualcosa = e => !!e && (typeof e.v === 'string' || !!e.leggi || (e.op && (nominaQualcosa(e.a) || nominaQualcosa(e.b))))

/* quello che in una riga resta da scegliere: la N di un numero, il ?
   di un colore, i puntini di una domanda. Un conto vale da scegliere se
   ne manca un pezzo. */
export const daScegliere = e => !e || !!e.vuoto || (!!e.op && (daScegliere(e.a) || daScegliere(e.b)))
const passi = e => (e && e.n === 1 ? 'passo' : 'passi')

/* La casella di un colore: un quadratino se è un colore scritto, il
   nome se è una misura o una lavagnetta che lo porta, un ? se è da
   scegliere. */
function casellaColore(campo, valore) {
  if (typeof valore === 'string')
    return { campo, tipo: 'colore', mostra: '', colore: valore, etichetta: `colore ${(colore(valore) || {}).nome}` }
  if (valore && typeof valore.v === 'string')
    return { campo, tipo: 'colore', mostra: valore.v, lavagnetta: true, etichetta: `colore ${valore.v}` }
  return { campo, tipo: 'colore', mostra: '?', manca: true, etichetta: 'colore da scegliere' }
}

/* I pezzi di una riga: testo e caselle. Una casella dice che campo
   cambia (`campo`), che genere di scelta apre (`tipo`) e cosa mostra. */
export function pezzi(i, programma) {
  switch (i.tipo) {
    case 'vai': return [
      { testo: 'vai' },
      { campo: 'verso', tipo: 'verso', mostra: VERSI_IN_PAROLE[i.verso] || '?', manca: !VERSI_IN_PAROLE[i.verso] },
      { campo: 'quanto', tipo: 'numero', mostra: numeroInParole(i.quanto), numero: i.quanto,
        lavagnetta: nominaQualcosa(i.quanto), manca: daScegliere(i.quanto) },
      { testo: passi(i.quanto) },
    ]
    /* «metti» e basta: il mattone lo dice l'icona, il colore il
       quadratino — la frase intera («metti un mattone ↓ sotto i piedi
       rosso») su un telefono andava a capo a metà */
    case 'metti': return [
      { testo: 'metti' },
      { campo: 'dove', tipo: 'posto', mostra: POSTI_IN_PAROLE[i.dove || 'sotto'] },
      casellaColore('colore', i.colore),
    ]
    case 'prendi': return [
      { testo: 'prendi' },
      { campo: 'lato', tipo: 'lato', mostra: LATI_PRENDI[i.lato] || '?', manca: !LATI_PRENDI[i.lato] },
    ]
    case 'posa': return [
      { testo: 'posa' },
      { campo: 'lato', tipo: 'lato', mostra: LATI_POSA[i.lato] || '?', manca: !LATI_POSA[i.lato] },
    ]
    case 'aspetta': return [
      { testo: 'aspetta che' },
      { campo: 'cond', tipo: 'cond', mostra: condizioneInParole(i.cond), manca: !i.cond },
    ]
    case 'sempre': return [{ testo: 'ripeti per sempre' }]
    case 'pausa': return [{ testo: 'aspetta un turno' }]
    case 'ripeti': return [
      { testo: 'ripeti' },
      { campo: 'volte', tipo: 'numero', mostra: numeroInParole(i.volte), numero: i.volte,
        lavagnetta: nominaQualcosa(i.volte), manca: daScegliere(i.volte) },
      { testo: 'volte' },
    ]
    case 'finche': return [
      { testo: 'ripeti · smetti quando' },
      { campo: 'cond', tipo: 'cond', mostra: condizioneInParole(i.cond), manca: !i.cond },
    ]
    case 'se': return [
      { testo: 'se' },
      { campo: 'cond', tipo: 'cond', mostra: condizioneInParole(i.cond), manca: !i.cond },
    ]
    /* il valore di una lavagnetta è di qualunque specie: un numero, un
       conto, un nome — e nel porto un colore, o quello che si legge */
    case 'assegna': return [
      { campo: 'nome', tipo: 'lavagnetta', mostra: i.nome || '?', lavagnetta: !!i.nome, manca: !i.nome },
      { testo: 'diventa' },
      typeof i.valore === 'string'
        ? { campo: 'valore', tipo: 'valore', mostra: '', colore: i.valore, etichetta: `colore ${(colore(i.valore) || {}).nome}` }
        : { campo: 'valore', tipo: 'valore', mostra: numeroInParole(i.valore), numero: i.valore,
            lavagnetta: nominaQualcosa(i.valore), manca: daScegliere(i.valore) },
    ]
    case 'chiama': {
      const p = ((programma && programma.progetti) || []).find(q => q.id === i.progetto)
      if (!p) return [{ testo: 'progetto che non c\'è più' }]
      const tipi = p.tipi || {}
      return [
        { testo: p.nome, progetto: true },
        ...(p.misure || []).flatMap((m, k) => {
          const a = (i.argomenti || [])[k]
          return [
            { testo: m, misura: true },
            tipi[m] === 'colore'
              ? casellaColore(`argomenti.${k}`, a)
              : { campo: `argomenti.${k}`, tipo: 'numero', mostra: numeroInParole(a), numero: a,
                  lavagnetta: nominaQualcosa(a), manca: daScegliere(a) },
          ]
        }),
      ]
    }
    default: return [{ testo: i.tipo }]
  }
}

export const iconaDi = (i, programma) => {
  if (i.tipo === 'chiama') {
    const p = ((programma && programma.progetti) || []).find(q => q.id === i.progetto)
    return p ? p.icona : '❔'
  }
  return ICONE[i.tipo] || '•'
}

/* I blocchi della pulsantiera, in gruppi. `blocco` è la chiave di
   `rigaNuova` in `motore/modifica.js`; i progetti si aggiungono da chi
   monta, perché sono del bambino e non del livello.

   **Una scelta che conta non ha un valore di comodo.** «Vai» sono due
   tasti, uno per verso, e «metti» tre, uno per posto: con un tasto solo
   e «a destra» già scritto dentro, sembrava che a destra fosse l'unico
   posto dove andare — l'ha visto il papà al primo giro. I numeri invece
   nascono **N**, da scegliere, e la scelta si apre da sola. */
export const GRUPPI = [
  { nome: 'Camminare', blocchi: [
    { blocco: 'vai', verso: 'destra', esempio: 'vai → a destra N passi' },
    { blocco: 'vai', verso: 'sinistra', esempio: 'vai ← a sinistra N passi' },
  ] },
  { nome: 'Costruire', blocchi: [
    { blocco: 'metti', dove: 'sotto', esempio: 'metti un mattone ↓ sotto i piedi', nota: 'e ci sale sopra' },
    { blocco: 'metti', dove: 'giu-destra', esempio: 'metti un mattone ↘ in basso a destra', nota: 'dove andrà il piede' },
    { blocco: 'metti', dove: 'giu-sinistra', esempio: 'metti un mattone ↙ in basso a sinistra', nota: 'dove andrà il piede' },
  ] },
  { nome: 'Ripetere', blocchi: [
    { blocco: 'ripeti', esempio: 'ripeti N volte' },
    { blocco: 'finche', esempio: 'ripeti · smetti quando …' },
  ] },
  { nome: 'Decidere', blocchi: [{ blocco: 'se', esempio: 'se … allora' }] },
  { nome: 'Lavagnette', blocchi: [{ blocco: 'assegna', esempio: '[ ] diventa N' }] },
]

/* La cassetta del porto. Le frecce sono quattro per tre gesti — dodici
   tasti — e in fila come i blocchi del cantiere sarebbero un elenco da
   scorrere: stanno su una riga per gesto (`fila`), ognuno con la sua
   freccia. Un tasto per freccia resta la regola: la scelta si fa qui,
   e la riga nasce già con il suo verso, senza un verso di comodo. */
const quattro = (blocco, parole) => ['su', 'giu', 'sinistra', 'destra'].map(l => ({
  blocco, [blocco === 'vai' ? 'verso' : 'lato']: l, freccia: FRECCE[l], esempio: `${blocco} ${parole[l]}`,
}))
export const GRUPPI_PORTO = [
  { nome: 'Camminare', fila: true, blocchi: quattro('vai', { su: '↑ su N passi', giu: '↓ giù N passi', sinistra: '← a sinistra N passi', destra: '→ a destra N passi' }) },
  { nome: 'Prendere di fianco', fila: true, blocchi: quattro('prendi', LATI_PRENDI) },
  { nome: 'Posare di fianco', fila: true, blocchi: quattro('posa', LATI_POSA) },
  { nome: 'Ripetere', blocchi: [
    { blocco: 'ripeti', esempio: 'ripeti N volte' },
    { blocco: 'finche', esempio: 'ripeti · smetti quando …' },
    { blocco: 'sempre', esempio: 'ripeti per sempre', nota: 'finché la giornata non finisce' },
  ] },
  { nome: 'Aspettare', blocchi: [
    { blocco: 'aspetta', esempio: 'aspetta che …', nota: 'intanto il porto lavora' },
    { blocco: 'pausa', esempio: 'aspetta un turno', nota: 'quando non c\'è niente da fare' },
  ] },
  { nome: 'Decidere', blocchi: [{ blocco: 'se', esempio: 'se … allora' }] },
  { nome: 'Lavagnette', blocchi: [{ blocco: 'assegna', esempio: '[ ] diventa …' }] },
]

/* le figurine per i progetti, e il nome che suggeriscono */
export const ICONE_PROGETTI = [
  ['🏛️', 'colonna'], ['🗼', 'torre'], ['🧱', 'muro'], ['🌳', 'albero'], ['🏠', 'casa'],
  ['🪜', 'scala'], ['➖', 'riga'], ['🌉', 'ponte'], ['🔺', 'tetto'], ['⬛', 'quadrato'],
  ['🌸', 'fiore'], ['⭐', 'stella'], ['🚪', 'porta'], ['🏰', 'castello'], ['🔷', 'forma'], ['🎁', 'regalo'],
  ['🔎', 'cerca'], ['📦', 'carica'], ['🚚', 'consegna'], ['↩️', 'torna'],
]
/* niente «n» fra i nomi proposti: la N è già il numero da scegliere, e
   una lavagnetta con lo stesso nome farebbe due cose diverse con una
   lettera sola */
export const NOMI_MISURE = ['alta', 'larga', 'lunga', 'quanti', 'lato']
export const NOMI_LAVAGNETTE = ['h', 'conta', 'quanti', 'l', 'passi', 'quante', 'colore', 'voglio']
