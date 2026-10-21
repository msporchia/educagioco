// Generato da strumenti/promuovi-3d.mjs da poc/effetti-3d/aure.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Aure: effetti 3D sul mostro, sull'eroe e gli stati che restano addosso. Contratto in tmp/…/brief-fx.md:
// EFFETTI[chiave] = { via, durata, arrivo, crea(ctx) } → { gruppo, aggiorna(t, dt) → bool, libera() }.
// Le coordinate: `a` (mostro) e `da` (eroe / portatore dello stato) danno x e z; i piedi stanno sul pavimento (y = 0).
import { CHI } from './aure-chi.js'
import { ME } from './aure-me.js'
import { STATI } from './aure-stati.js'

export const EFFETTI = { ...CHI, ...ME, ...STATI }

/** Compila gli shader in anticipo: crea ogni effetto in una scena di servizio, la fa compilare dal renderer e libera. */
export function PREPARA (renderer, camera, THREE) {
  if (!renderer || !camera) return
  const scena = new THREE.Scene(), v = new THREE.Vector3(), ctx = { da: v.clone(), a: new THREE.Vector3(1, 0, 0), tinta: new THREE.Color(0xe8742f), seme: 1 }
  const vivi = Object.values(EFFETTI).map(e => { const x = e.crea(ctx); scena.add(x.gruppo); x.aggiorna(Math.min(0.3, e.durata * 0.5), 0.016); return x })
  renderer.compile(scena, camera); vivi.forEach(x => x.libera())
}
