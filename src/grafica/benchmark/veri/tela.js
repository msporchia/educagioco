// Le cose comuni alle scene dei modelli veri (docs/core/vecchio-telefono-veri.md): una tela a tutto schermo dentro il foglio della
// misura, col suo strato per le scritte, e il contesto WebGL buttato via a scena finita (un telefono ne tiene pochi).
export const pausa = ms => new Promise(r => setTimeout(r, ms))

// i contesti persi dal telefono (non quelli buttati apposta a scena finita) e quelli che tornano, in tutta la prova
export const eventiContesto = { persi: 0, ripresi: 0 }

/** Una tela nuova (e il suo strato di scritte) nel contenitore; `via()` la toglie e libera il contesto. */
export function nuovaTela(contenitore) {
  const casa = document.createElement('div')
  Object.assign(casa.style, { position: 'absolute', inset: '0', overflow: 'hidden' })
  const canvas = document.createElement('canvas')
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' })
  let buttata = false
  canvas.addEventListener('webglcontextlost', () => { if (!buttata) eventiContesto.persi++ })
  canvas.addEventListener('webglcontextrestored', () => { eventiContesto.ripresi++ })
  const strato = document.createElement('div')
  Object.assign(strato.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden' })
  casa.append(canvas, strato)
  contenitore.appendChild(casa)
  const r = casa.getBoundingClientRect()
  return { casa, canvas, strato, W: Math.max(1, Math.round(r.width)), H: Math.max(1, Math.round(r.height)), via() { buttata = true; perdi(canvas); casa.remove() } }
}

/** Il contesto della tela (già creato da chi ci disegna), perso apposta: la memoria della GPU torna subito. */
export function perdi(canvas) {
  try { const gl = canvas.getContext('webgl2'); const e = gl && gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext() } catch (e) { /* già perso */ }
}

/** Aspetta che `cond()` sia vera, al più `ms`; torna se ce l'ha fatta. */
export async function finche(cond, ms) {
  const t0 = performance.now()
  while (performance.now() - t0 < ms) {
    try { if (cond()) return true } catch (e) { /* non ancora */ }
    await pausa(50)
  }
  return false
}

/** Il k-esimo posto attorno all'origine: anelli a 2, 3,5, 5… celle, sei posti nel primo e quattro in più a ogni anello. */
export function posto(k, giro = 0) {
  let anello = 0, primo = 0, quanti = 6
  while (k >= primo + quanti) { primo += quanti; anello++; quanti = 6 + anello * 4 }
  const r = 2 + anello * 1.5, a = ((k - primo) / quanti) * Math.PI * 2 + giro + anello * 0.4
  return { x: Math.sin(a) * r, z: Math.cos(a) * r }
}
