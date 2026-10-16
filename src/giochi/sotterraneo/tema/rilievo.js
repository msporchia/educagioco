// Il dito del tema «rilievo» (docs/sotterraneo/tema-pannelli.md): un tasto premuto si piega verso il punto toccato,
// come una lastra spinta su un bordo; col mouse si piega anche passandoci sopra, e la tavola della domanda e le
// finestre girano appena (la parallasse). Solo variabili CSS e un attributo, niente fotogrammi: ascolta i puntatori
// sulla radice del gioco e basta. Spento con `prefers-reduced-motion`. Torna la funzione che lo spegne
export const TASTI = '.qz-tasto, .sot-grosso, .sot-scelta, .sot-casella, .sot-cella, .sot-scheda, .sot-linguetta, ' +
  '.sot-dialogo-scelta, .sot-car-piu, .sot-zoccolo, .sot-chiudi, .pa-foglio .bottone, .pa-esci, .sot-lascia'
const TAVOLE = '.qz-carta, .sot-cornice, .sot-fine'
const PIEGA = 8        // gradi, al bordo di un tasto premuto
const PIEGA_SOPRA = 5  // passandoci col mouse
const GIRA = 2.5       // gradi della tavola sotto il mouse: di più, e il testo smette di leggersi dritto

const dentro = (v) => Math.max(-1, Math.min(1, v))

function piega(el, e, quanto) {
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return
  const x = dentro(((e.clientX - r.left) / r.width) * 2 - 1)
  const y = dentro(((e.clientY - r.top) / r.height) * 2 - 1)
  el.style.setProperty('--rl-x', (-y * quanto).toFixed(1) + 'deg')
  el.style.setProperty('--rl-y', (x * quanto).toFixed(1) + 'deg')
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
  let premuto = null, sopra = null, tavola = null
  const tasto = (e) => {
    const el = e.target && e.target.closest ? e.target.closest(TASTI) : null
    return el && radice.contains(el) && !el.disabled ? el : null
  }
  function giu(e) {
    raddrizza(premuto)
    premuto = tasto(e)
    if (premuto) piega(premuto, e, PIEGA)
  }
  function su() {
    if (premuto && premuto !== sopra) raddrizza(premuto)
    premuto = null
  }
  // il dito non ha «sopra»: solo il mouse piega passando, e gira la tavola
  function muovi(e) {
    if (e.pointerType !== 'mouse') return
    const el = tasto(e)
    if (sopra && sopra !== el && sopra !== premuto) raddrizza(sopra)
    sopra = el
    if (el && el !== premuto) piega(el, e, PIEGA_SOPRA)
    const t = e.target && e.target.closest ? e.target.closest(TAVOLE) : null
    if (tavola && tavola !== t) raddrizza(tavola)
    tavola = t && radice.contains(t) ? t : null
    if (tavola) piega(tavola, e, GIRA)
  }
  function via() { raddrizza(sopra); raddrizza(tavola); sopra = tavola = null }
  radice.addEventListener('pointerdown', giu, true)
  addEventListener('pointerup', su, true)
  addEventListener('pointercancel', su, true)
  radice.addEventListener('pointermove', muovi, { passive: true })
  radice.addEventListener('pointerleave', via)
  return () => {
    radice.removeEventListener('pointerdown', giu, true)
    removeEventListener('pointerup', su, true)
    removeEventListener('pointercancel', su, true)
    radice.removeEventListener('pointermove', muovi)
    radice.removeEventListener('pointerleave', via)
    raddrizza(premuto); via()
  }
}
