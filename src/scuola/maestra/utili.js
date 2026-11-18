// Quello che le schermate della maestra si dividono: copiare, scaricare, le date, l'indirizzo dei bambini.
import { descrivi } from '../comune/esercizi.js'
import { misura } from './quaderno.js'

// dal disco (file://) la pagina non sa dove sta il sito: si dice quello pubblicato
export const indirizzoBambini = () => (/^https?:/.test(globalThis.location?.protocol || '')
  ? new URL('./', location.href).href : 'https://msporchia.github.io/educagioco/scuola/')

export const paginaMaestra = () => String(globalThis.location?.href || '').split('#')[0]

export async function copia(testo) {
  try { await navigator.clipboard.writeText(testo); return true } catch { return false }
}

export function scarica(nome, contenuto, tipo) {
  const url = URL.createObjectURL(new Blob([contenuto], { type: tipo }))
  const a = Object.assign(document.createElement('a'), { href: url, download: nome })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export const giorno = ms => new Date(ms).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
export const ora = ms => new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

export const comeSiSvolge = l => `${descrivi(l.obiettivo.esercizio)} · ${misura(l.obiettivo)}`
export const seHaiFinito = l => (l.dopo ? `Se hai finito: ${descrivi(l.dopo)}` : 'Niente «se hai finito»')
