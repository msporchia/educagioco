// Il materiale dei sassi: uno standard di three con quattro cose in più, decise da fuori
// come uniformi (niente ricompilazioni): le vene che brillano (lava, luci di un disco,
// la spia di una bomba), il bordo acceso controluce, la brina del gelo e il rosso dello sbaglio.
// L'attributo `brace` c'è in ogni geometria dei sassi (0 dove non brilla niente).
import { MeshStandardMaterial, Color } from 'three'

export const BRACE_FISSA = 0, BRACE_CATENA = 1

function patch(s, u) {
  Object.assign(s.uniforms, u)
  s.vertexShader = s.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float brace;\nvarying float vBrace;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBrace = brace;')
  s.fragmentShader = s.fragmentShader
    .replace('#include <common>', `#include <common>
varying float vBrace;
uniform vec3 uBraceCol, uBordo;
uniform float uBraceK, uBraceModo, uT, uGelo, uRosso;`)
    .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.62, .82, .95), .5 * uGelo);`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  float rim = pow(1. - clamp(dot(normal, normalize(vViewPosition)), 0., 1.), 2.5);
  float c = step(.001, vBrace);
  if (uBraceModo < .5) totalEmissiveRadiance += uBraceCol * vBrace * uBraceK;
  else totalEmissiveRadiance += diffuseColor.rgb * 3. * c * uBraceK * step(0., sin(uT * 6. - vBrace * 40.));
  totalEmissiveRadiance += uBordo * rim;
  totalEmissiveRadiance += vec3(.35, .75, 1.2) * rim * uGelo;
  totalEmissiveRadiance += vec3(2.2, .22, .16) * uRosso * (.35 + .65 * rim);
}`)
}

// un materiale nuovo per ogni sasso in scena: le uniformi sono sue, il programma è di tutti
export function materialeSasso() {
  const m = new MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.08, envMapIntensity: 0.45 })
  const u = {
    uBraceCol: { value: new Color(0, 0, 0) }, uBraceK: { value: 0 }, uBraceModo: { value: 0 },
    uT: { value: 0 }, uBordo: { value: new Color(0, 0, 0) }, uGelo: { value: 0 }, uRosso: { value: 0 },
  }
  m.userData.u = u
  m.onBeforeCompile = s => patch(s, u)
  m.customProgramCacheKey = () => 'sasso3d'
  return m
}
