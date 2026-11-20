// Quello che le schermate della maestra si dividono: copiare, scaricare, le date, l'indirizzo dei bambini.
import { righeDellaLezione, linkDiProva } from './quaderno.js'

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

// una riga per blocco: cosa si chiede e quando si passa al blocco dopo
export const comeSiSvolge = righeDellaLezione

// le iniziali e un colore per ogni nome, sempre lo stesso: i tondi dei bambini nel resoconto, nelle classi e nella diretta
const COLORI = ['#2b59c3', '#2f9e5f', '#c4572f', '#8a4fc0', '#b8861b', '#1f8a9e', '#c2417a', '#5d6d2e']
export const iniziali = nome => String(nome ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('') || '?'
export function coloreDi(nome) {
  let h = 0
  for (const c of String(nome ?? '')) h = (h * 31 + c.codePointAt(0)) >>> 0
  return COLORI[h % COLORI.length]
}

// «Prova la lezione»: la pagina dei bambini accanto a questa, in una scheda nuova, che la fa partire su questo PC
export function provaLezione(l) {
  const pagina = new URL('./index.html', globalThis.location?.href || 'http://localhost/').href
  globalThis.open?.(linkDiProva(l, pagina), '_blank')
}
