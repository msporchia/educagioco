// Se il telefono sa disegnare in WebGL 2: si chiede senza caricare three (Gioco.vue lo chiede prima, e il file di three si
// scarica solo se serve). Il contesto di prova si butta subito. Come in sotterraneo/scena3d/webgl.js.
export function haWebGL2() {
  if (typeof document === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2')
    const si = !!gl && !gl.isContextLost()
    if (gl) { const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext() }
    return si
  } catch (e) { return false }
}
