// La prova del computer nel browser (docs/scuola/prova-computer.md): il contatore delle immagini al secondo e i piloti che fanno
// muovere ogni gioco mentre si conta. I piloti usano quello che userebbe un bambino a scuola (la tastiera è accesa, docs/core/tastiera.md)
// e i bersagli dei test; un bersaglio che non c'è non fa niente.

const perc = (v, q) => { const o = v.slice().sort((a, b) => a - b); return o.length ? o[Math.min(o.length - 1, Math.floor(q * o.length))] : 0 }

/**
 * Le immagini al secondo come le vede chi gioca: gli intervalli fra un requestAnimationFrame e l'altro, scartato il `rodaggio`.
 * → { fps, sotto30 (% oltre 34 ms), fermi (oltre 100 ms), dt95 }. `fermo()` chiude prima.
 */
export function contaFotogrammi({ rodaggio, misura }, fermo = () => false) {
  return new Promise(fatto => {
    const dt = []
    let t0 = 0, prima = 0
    const chiudi = () => {
      const somma = dt.reduce((a, b) => a + b, 0)
      fatto({ fps: somma ? Math.round(1000 * dt.length / somma) : 0, sotto30: Math.round(100 * dt.filter(x => x > 34).length / Math.max(1, dt.length)),
              fermi: dt.filter(x => x > 100).length, dt95: Math.round(perc(dt, 0.95)) })
    }
    const giro = t => {
      if (!t0) t0 = t
      if (fermo()) return chiudi()
      if (t - t0 > rodaggio) { if (prima) dt.push(t - prima); prima = t }
      if (t - t0 > rodaggio + misura) return chiudi()
      requestAnimationFrame(giro)
    }
    requestAnimationFrame(giro)
  })
}

const tasto = key => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
}
const tocca = sel => { const el = document.querySelector(sel); if (el) el.click(); return !!el }
// un tocco del mouse in un punto della tela: giù e su, come un clic
function toccaTela(sel, fx, fy) {
  const c = document.querySelector(sel)
  if (!c) return
  const r = c.getBoundingClientRect(), x = r.left + fx * r.width, y = r.top + fy * r.height
  const o = { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0, isPrimary: true }
  c.dispatchEvent(new PointerEvent('pointerdown', o)); c.dispatchEvent(new PointerEvent('pointerup', o))
}

// cosa fa ogni gioco a ogni colpo del pilota (`k` conta i colpi, uno ogni OGNI ms)
const PILOTI = {
  asteroidi: k => { tasto(k % 3 ? 'ArrowRight' : 'ArrowLeft'); tasto('Enter') },                        // punta e spara: colpi ed esplosioni
  'passo-passo': k => { const f = ['Backspace', 'Backspace', 'Backspace', 'ArrowRight', 'ArrowRight', 'ArrowUp', 'Enter', null, null, null]; const t = f[k % f.length]; if (t) tasto(t) },
  // il castello: due torri (senza conto: si misura il disegno) e le ondate, che senza mostri sarebbe una mappa ferma
  castello: () => {
    const td = window.__td, m = td?.motore?.()
    if (m && td.fase.value === 'gioco' && m.torri.length < 2 && m.liberi().length) m.costruisci(td.TAPPE[td.tappaIdx.value].torri[0])
    tocca('[data-azione="chiama-onda"]')
  },
  sotterraneo: k => { if (!tocca('.sot-eroe[data-eroe]')) toccaTela('[data-tela="3d"]', 0.3 + 0.4 * ((k * 37) % 10) / 10, 0.3 + 0.4 * ((k * 53) % 10) / 10) },  // cammina
}
// al massimo (dopo `window.__estremo`): il castello chiama un'ondata dietro l'altra, che si sommano
const AL_MASSIMO = {
  castello: () => { if (!tocca('[data-azione="chiama-prossima"]')) tocca('[data-azione="chiama-onda"]') },
}
export const OGNI = 700

/** Fa muovere il gioco finché non si chiama la funzione che torna: la guida si chiude (si sta misurando il gioco, non la riga), e
    una pausa messa dal gioco da sé (la pagina nascosta un momento) si toglie. */
export function pilota(id, { massimo = false } = {}) {
  let k = 0
  const fai = (massimo && AL_MASSIMO[id]) || PILOTI[id]
  const t = setInterval(() => {
    tocca('[data-guida-spegni]')
    tocca('[data-pausa] [data-azione="riprendi"]')
    try { fai?.(k++) } catch { /* il gioco è cambiato sotto: il prossimo colpo */ }
  }, OGNI)
  return () => clearInterval(t)
}
