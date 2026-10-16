// Il contesto WebGL 2 e il renderer: il contesto si chiede a mano prima di three, così senza WebGL 2 si torna null in silenzio
// (il gioco dice cosa succede, docs/sotterraneo/grafica-3d.md «Senza WebGL»). Il pixel ratio si adatta (DPR: parte da `max`,
// scende a passi se i fotogrammi costano troppo, risale piano), e si misura quanto costa un fotogramma.
import { WebGLRenderer, VSMShadowMap, ACESFilmicToneMapping } from 'three'
import { DPR, LUCE, ACCESI } from './costanti.js'

export function creaContesto(canvas, { perso, fisso } = {}) {
  let gl = null
  try {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: true, stencil: false, premultipliedAlpha: true, powerPreference: 'high-performance' })
  } catch (e) { gl = null }
  if (!gl || gl.isContextLost()) return null
  let renderer
  try { renderer = new WebGLRenderer({ canvas, context: gl, antialias: false, alpha: false }) } catch (e) { return null }
  renderer.shadowMap.enabled = ACCESI.ombre
  renderer.shadowMap.type = VSMShadowMap   // PCF confronta una texture di profondità filtrata LINEAR: Firefox avvisa (docs/sotterraneo/grafica-3d.md)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = LUCE.esposizione
  renderer.info.autoReset = false   // più passate per fotogramma: si azzera a mano
  const perdi = e => { e.preventDefault(); perso?.() }
  canvas.addEventListener('webglcontextlost', perdi)

  const dprMax = Math.min(window.devicePixelRatio || 1, DPR.max)
  let dpr = fisso || dprMax, dprNuovo = dpr
  let L = 0, A = 0, somma = 0, quanti = 0
  const misure = { chiamate: 0, triangoli: 0, msFotogramma: 0, msJs: 0, msDisegno: 0 }
  return {
    renderer, gl, misure,
    get dpr() { return dpr },
    // la misura del campo (px CSS) e il pixel ratio deciso al fotogramma prima: si cambia PRIMA di disegnare, perché cambiare
    // la tela la svuota, e cambiata dopo il disegno il telefono mostrerebbe un fotogramma vuoto (o quello vecchio, spostato)
    misura(l, a, dopo) {
      if (l === L && a === A && dprNuovo === dpr) return false
      L = l; A = a; dpr = dprNuovo
      renderer.setPixelRatio(dpr); renderer.setSize(l, a, false)
      dopo?.(Math.round(l * dpr), Math.round(a * dpr))
      return true
    },
    // a ogni fotogramma: quanto è costato; ogni quaranta si decide se scendere o salire di pixel ratio
    conta(ms) {
      const i = renderer.info.render
      misure.chiamate = i.calls; misure.triangoli = i.triangles; misure.msFotogramma = ms
      if (fisso) return
      somma += Math.min(ms, 100); quanti++   // un telefono posato non è un fotogramma lento
      if (quanti < 40) return
      const media = somma / quanti
      somma = 0; quanti = 0
      if (media > DPR.lento && dpr > DPR.min) dprNuovo = Math.round(Math.max(DPR.min, dpr - 0.1) * 100) / 100
      else if (media < DPR.svelto && dpr < dprMax) dprNuovo = Math.round(Math.min(dprMax, dpr + 0.05) * 100) / 100
    },
    via() { canvas.removeEventListener('webglcontextlost', perdi); try { renderer.dispose() } catch (e) { /* già andato */ } },
  }
}
