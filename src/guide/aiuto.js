// Gli attrezzi dell'aiuto, chiamabili da dovunque (niente Vue, niente store).

// non si ricava da `location`: vedi docs/genitori/guide.md
export const INDIRIZZO = typeof __INDIRIZZO__ !== 'undefined'
  ? __INDIRIZZO__ : 'https://msporchia.github.io/educagioco/'

export const CHI = 'Marco Sporchia'
export const CODICE = 'https://github.com/msporchia/educagioco'
export const AUTORE = 'https://www.linkedin.com/in/marcosporchia'

export const SEGNALA = 'https://tally.so/r/D4OO1q'

// solo `**questa**` coppia di asterischi: un dato non deve poter contenere HTML
export const inGrassetto = t => String(t)
  .replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')

export function piattaforma () {
  if (typeof navigator === 'undefined') return 'computer'
  const ua = navigator.userAgent || ''
  if (/Android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1) return 'ios'   // iPadOS recente si dichiara Mac
  return 'computer'
}

// `standalone` è il modo di iOS, il media query quello di tutti gli altri
export function installata () {
  if (typeof window === 'undefined') return false
  if (window.navigator?.standalone) return true
  return !!window.matchMedia?.('(display-mode: standalone)')?.matches
      || !!window.matchMedia?.('(display-mode: fullscreen)')?.matches
      || !!window.matchMedia?.('(display-mode: minimal-ui)')?.matches
}

// in localStorage e non fra le impostazioni: non è una scelta, è dove gira il gioco
export function saltaLeSpiegazioni () {
  try { return localStorage.getItem('guide-viste') === '1' } catch { return false }
}

// pura per provarla senza un telefono in mano: vedi docs/genitori/guide.md
export function serveIlNastro ({ dentro, dove, chiuso } = {}) {
  if (dentro || chiuso) return false
  return dove === 'android' || dove === 'ios'
}

// torna sempre un esito invece di lanciare: «ha chiuso il foglio» non è un guasto
export async function condividi ({ url, testo, titolo, file } = {}) {
  const dati = {}
  if (titolo) dati.title = titolo
  if (testo) dati.text = testo
  if (url) dati.url = url
  if (file) dati.files = [file]

  try {
    if (navigator.share && (!file || navigator.canShare?.({ files: [file] }))) {
      await navigator.share(dati)
      return { come: 'condiviso' }
    }
  } catch (e) {
    if (e?.name === 'AbortError') return { come: 'annullato' }
  }

  if (!file) {
    try {
      await navigator.clipboard.writeText(url || testo || '')
      return { come: 'copiato' }
    } catch { /* niente appunti: lo dice chi chiama */ }
  }
  return { come: 'niente' }
}

export function scarica (nome, testo, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([testo], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
