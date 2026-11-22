// La soluzione B della prova del computer (docs/scuola/prova-computer.md): un gioco che su questo PC va a scatti disegna con meno
// pixel. La leva è una sola per tutti: i giochi contano i pixel da `window.devicePixelRatio`, e qui la si abbassa mentre gira quel
// gioco. Il PC se lo ricorda (localStorage, chiave `scuola:pixel`: è del computer, non del bambino).
const CHIAVE = 'scuola:pixel'
export const SCALA_B = 0.6        // i pixel per lato: ~un terzo dei pixel da disegnare
const VERO = (typeof window !== 'undefined' && window.devicePixelRatio) || 1

/** Abbassa (o rimette, con 1) i pixel dei giochi che partono da adesso. */
export function applicaPixel(scala = 1) {
  if (typeof window === 'undefined') return
  const v = VERO * (scala > 0 && scala < 1 ? scala : 1)
  try { Object.defineProperty(window, 'devicePixelRatio', { get: () => v, configurable: true }) } catch { /* il browser non lo lascia: si resta come prima */ }
}

/** { gioco: scala } dei giochi che su questo PC vanno in B. */
export function giochiInB() {
  try { const x = JSON.parse(localStorage.getItem(CHIAVE) || 'null'); return x && typeof x.giochi === 'object' && x.giochi ? x.giochi : {} } catch { return {} }
}
export const scalaDel = gioco => giochiInB()[gioco] || 1

/** Dopo la prova: i giochi che vanno meglio in B (gli altri tornano come sono). */
export function ricordaB(giochi) {
  try { localStorage.setItem(CHIAVE, JSON.stringify({ quando: Date.now(), giochi })) } catch { /* senza archivio: vale finché la pagina è aperta */ }
}
