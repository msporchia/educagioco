// Lo schermo acceso mentre si gioca in due (docs/core/insieme.md): un telefono che si spegne da solo ferma la sua copia, e l'altro
// resta ad aspettare. Il permesso lo dà il browser senza chiedere, ma lo toglie a ogni schermo nascosto: si richiede al ritorno.
// Dove non c'è (browser vecchi, il file aperto con doppio click) non succede niente.
export function tieniAcceso() {
  const wl = typeof navigator !== 'undefined' ? navigator.wakeLock : null
  if (!wl || typeof document === 'undefined') return { lascia() {} }
  let blocco = null, finito = false
  const chiedi = () => {
    if (finito || document.hidden || blocco) return
    wl.request('screen').then(b => {
      if (finito) { b.release().catch(() => {}); return }
      blocco = b
      b.addEventListener('release', () => { blocco = null })
    }, () => { /* negato (batteria scarica, pagina non visibile): pazienza */ })
  }
  const tornato = () => { if (!document.hidden) chiedi() }
  document.addEventListener('visibilitychange', tornato)
  chiedi()
  return {
    lascia() {
      finito = true
      document.removeEventListener('visibilitychange', tornato)
      blocco?.release().catch(() => {})
      blocco = null
    },
  }
}
