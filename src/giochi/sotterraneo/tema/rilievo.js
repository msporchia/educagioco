// Il dito del tema «rilievo» (docs/sotterraneo/tema-pannelli.md): un tasto premuto si piega verso il punto toccato, come
// una tavola spinta su un bordo. Solo variabili CSS e un attributo, niente fotogrammi: ascolta i puntatori sulla radice
// del gioco e basta. Niente pieghe al passaggio del mouse (sul telefono non c'è un «sopra»). Spento con
// `prefers-reduced-motion`. Torna la funzione che lo spegne
export const TASTI = '.qz-tasto, .sot-grosso, .sot-scelta, .sot-dialogo-scelta, .pa-foglio .bottone, .pa-esci, .sot-lascia'
const PIEGA = 8        // gradi, al bordo di un tasto premuto

const dentro = (v) => Math.max(-1, Math.min(1, v))

function piega(el, e) {
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return
  const x = dentro(((e.clientX - r.left) / r.width) * 2 - 1)
  const y = dentro(((e.clientY - r.top) / r.height) * 2 - 1)
  el.style.setProperty('--rl-x', (-y * PIEGA).toFixed(1) + 'deg')
  el.style.setProperty('--rl-y', (x * PIEGA).toFixed(1) + 'deg')
  el.setAttribute('data-piega', '')
}
function raddrizza(el) {
  if (!el) return
  el.style.removeProperty('--rl-x')
  el.style.removeProperty('--rl-y')
  el.removeAttribute('data-piega')
}

export function accendiRilievo(radice) {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  let premuto = null
  function giu(e) {
    raddrizza(premuto)
    const el = e.target && e.target.closest ? e.target.closest(TASTI) : null
    premuto = el && radice.contains(el) && !el.disabled ? el : null
    if (premuto) piega(premuto, e)
  }
  function su() { raddrizza(premuto); premuto = null }
  radice.addEventListener('pointerdown', giu, true)
  addEventListener('pointerup', su, true)
  addEventListener('pointercancel', su, true)
  return () => {
    radice.removeEventListener('pointerdown', giu, true)
    removeEventListener('pointerup', su, true)
    removeEventListener('pointercancel', su, true)
    su()
  }
}
