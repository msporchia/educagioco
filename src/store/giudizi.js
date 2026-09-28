// Il quaderno dei giudizi: vedi docs/genitori/come-va.md.
import { ref } from 'vue'
import { load, save, flush } from './storage.js'

const CHIAVE = 'giudizi'
const CHIAVE_ACCESO = 'giudizi-accesi'

const QUANTI = 150   // righe minuscole scritte a mano una alla volta: il tetto è solo per non crescere infinito

// il pacco viaggia nell'indirizzo del modulo Tally: trenta righe stanno sotto i cinquemila caratteri
export const TETTO_INVIO = 30

export const VERDETTI = [
  { id: 'facile', ico: '😴', che: 'troppo facile' },
  { id: 'difficile', ico: '😰', che: 'troppo difficile' },
  { id: 'storta', ico: '🐛', che: 'domanda storta' },
]

export const verdettoDi = id => VERDETTI.find(v => v.id === id) || null

export const giudiziAccesi = ref(false)

// mai il booleano nudo: storage.js scarta un `true` salvato da solo (vedi docs/core/archivio.md)
export async function avviaGiudizi() {
  const c = await load(CHIAVE_ACCESO)
  giudiziAccesi.value = c?.acceso === true
  return giudiziAccesi.value
}

export function accendiGiudizi(si) {
  giudiziAccesi.value = !!si
  save(CHIAVE_ACCESO, { acceso: !!si })
  return flush()
}

// stesso `id` sostituisce, non si accoda: è la stessa domanda, non due giudizi
export function aggiungi(lista, voce, quanti = QUANTI) {
  const prima = Array.isArray(lista) ? lista.filter(v => v && typeof v === 'object') : []
  const senza = voce.id ? prima.filter(v => v.id !== voce.id) : prima
  return [...senza, voce].slice(-quanti)
}

export const leggi = () => load(CHIAVE).then(l => (Array.isArray(l) ? l : []))
export const dimentica = () => { save(CHIAVE, []); return flush() }

export async function annota(voce) {
  const piena = { quando: new Date().toISOString(), ...voce }
  try {
    save(CHIAVE, aggiungi(await leggi(), piena))
    await flush()
  } catch (e) { /* se non si riesce a scrivere un giudizio, pazienza */ }
  return piena
}

// niente caratteri fuori dall'alfabeto: un `·` costa sei caratteri nell'indirizzo
const taglia = (t, quanti) => {
  const s = String(t ?? '').replace(/\s+/g, ' ').trim()
  return s.length > quanti ? s.slice(0, quanti - 1) + '…' : s
}

export function riga(v) {
  const pezzi = [
    v.verdetto || '?',
    v.chi || '?',
    v.gioco || '?',
    [v.modulo, v.grado].filter(x => x !== undefined && x !== '').join(' '),
    v.chiave || '',
    [v.tempo !== undefined ? Math.round(v.tempo) + 's' : '', v.esito || '']
      .filter(Boolean).join(' '),
    taglia(v.testo, 46),
  ]
  return pezzi.filter(p => p !== '').join(' | ')
}

const giorno = q => {
  const d = new Date(q)
  return isNaN(d) ? '?' : d.toLocaleDateString('it', { day: 'numeric', month: 'short' })
}

export function pacco(lista, tetto = TETTO_INVIO) {
  const tutte = Array.isArray(lista) ? lista : []
  if (!tutte.length) return { testo: '', mandati: 0, lasciati: 0 }
  const mandate = tutte.slice(-tetto)
  const lasciati = tutte.length - mandate.length
  const date = [giorno(mandate[0].quando), giorno(mandate[mandate.length - 1].quando)]
  const quando = date[0] === date[1] ? date[0] : `${date[0]} - ${date[1]}`
  const testa = `${mandate.length} giudizi (${quando})` +
    (lasciati ? `, i piu recenti di ${tutte.length}` : '')
  return {
    testo: [testa, ...mandate.map(riga)].join('\n'),
    mandati: mandate.length,
    lasciati,
  }
}
