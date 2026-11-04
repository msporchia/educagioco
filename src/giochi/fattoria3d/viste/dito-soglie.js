/* Da quanto in là un tocco smette di essere un tocco: lo stesso metro per il prato e per il baule
   (una distanza vera, non la somma dei due lati) — vedi docs/core/il-dito.md. */
export const SCARTO_DITO = 16
export const SCARTO_MOUSE = 6

const FANTASMA_MS = 450, FANTASMA_PX = 40
/** Il click che il dito si lascia dietro, a chi sta sotto quando si alza: non deve premere quello che c'era sotto la cosa appena chiusa. */
export function zittisciIlFantasma(x, y) {
  const t0 = performance.now(), smetti = () => removeEventListener('click', zitto, true)
  const zitto = ev => {
    if (performance.now() - t0 > FANTASMA_MS) return smetti()
    if (Math.hypot(ev.clientX - x, ev.clientY - y) > FANTASMA_PX) return
    ev.stopPropagation(); ev.preventDefault(); smetti()
  }
  addEventListener('click', zitto, true)
  setTimeout(smetti, FANTASMA_MS + 20)
}
