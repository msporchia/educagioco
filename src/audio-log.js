// Il registro dell'audio: perché una pronuncia non si sente. Vedi docs/lingue/voce.md.
import { save, flush } from './store/storage.js'
import { aggiungi, testoDi, leggi } from './incidenti.js'
import { acceso, statoContesto } from './audio.js'

const CHIAVE = 'incidenti'   // lo stesso libretto dei guasti: lo leggono i grandi da una parte sola
const RECENTI = 24         // gli ultimi fatti, in memoria: finiscono nella segnalazione col tasto

const recenti = []         // { t, cosa, testo }

const versioneDi = () => (typeof __VERSIONE__ !== 'undefined' ? __VERSIONE__.id : '')

/** Un fatto dell'audio, in memoria: costa niente e dice cosa è successo PRIMA del tasto. */
export function nota (cosa, testo = '') {
  recenti.push({ t: Date.now(), cosa, testo: String(testo).slice(0, 160) })
  if (recenti.length > RECENTI) recenti.shift()
}

export const fattiRecenti = () => recenti.slice()

/** Com'è l'audio adesso, in righe da leggere. Non crea il contesto se non c'è. */
export function istantanea () {
  const c = statoContesto()
  const righe = [
    'suono del gioco: ' + (acceso.value ? 'acceso' : 'spento'),
    c ? `contesto: ${c.stato} · ${c.campionamento} Hz · latenza ${c.latenza}`
      : 'contesto: mai creato (nessun tocco o AudioContext assente)',
  ]
  if (typeof navigator !== 'undefined') righe.push('browser: ' + (navigator.userAgent || '?').slice(0, 140))
  if (typeof document !== 'undefined') righe.push('pagina: ' + (document.visibilityState || '?'))
  return righe
}

/** I fatti recenti come righe «quanti secondi fa · cosa · testo». */
export function righeRecenti (ora = Date.now(), fatti = recenti) {
  return fatti.map(f => `${Math.max(0, Math.round((ora - f.t) / 1000))} s fa · ${f.cosa}${f.testo ? ' · ' + f.testo : ''}`)
}

/** Scrive una voce in archivio. `perche`: 'guasto' (da sé) o 'tasto' («non si sente» premuto). */
export async function segnala (perche, dove, testo, errore = null) {
  try {
    const voce = {
      quando: new Date().toISOString(),
      perche,
      dove,
      testo: errore ? `${testo}: ${testoDi(errore)}` : testo,
      versione: versioneDi(),
      dettagli: [...istantanea(), ...righeRecenti()],
    }
    save(CHIAVE, aggiungi(await leggi(), voce))
    await flush()
  } catch (x) { /* se non si riesce nemmeno a scrivere, pazienza */ }
}

/** Un guasto visto dal codice: resta in memoria e va in archivio. */
export function guasto (dove, testo, errore = null) {
  nota('guasto', testo + (errore ? ': ' + testoDi(errore) : ''))
  return segnala('guasto', dove, testo, errore)
}

