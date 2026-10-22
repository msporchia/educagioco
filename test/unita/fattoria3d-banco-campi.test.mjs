/* Il banco dei campi (scena3d/campi-istanze.js): le piante di tutti i campi in una InstancedMesh per forma, e ogni campo ne ha la sua
   fetta. Prova che il banco disegna ESATTAMENTE quello che disegnerebbe un campo da solo (stesse matrici nel mondo, stessi colori),
   anche spostato e girato, che un campo nascosto o tolto sparisce, e che la capienza cresce. Senza browser.
   `node test/esegui.mjs fattoria3d-banco-campi`
   tempo: 1 */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const M = await import('../../src/giochi/fattoria3d/scena3d/modelli.js')
const { BancoCampi } = await import('../../src/giochi/fattoria3d/scena3d/campi-istanze.js')
const { alleggeriOmbre } = await import('../../src/giochi/fattoria3d/scena3d/ottimizza.js')

const sposta = (g, x, z, rot) => { g.position.set(x, 0, z); g.rotation.y = rot; g.updateMatrixWorld(true) }
const riga = (m, i, W) => {
  const t = new THREE.Matrix4(); m.getMatrixAt(i, t); if (W) t.premultiply(W)
  return [...t.elements, ...m.instanceColor.array.subarray(i * 3, i * 3 + 3)].map(x => String(Math.round(x * 500) / 500 + 0)).join()
}
/** Le matrici nel mondo e i colori di tutte le istanze di una forma, come lista di stringhe (per confrontare). */
const dalCampoSolo = (g, nome) => {
  const m = g.userData.grano.parti[nome]?.mesh, a = []
  if (!m) return a
  for (let i = 0; i < m.count; i++) a.push(riga(m, i, g.matrixWorld))
  return a
}
const dalBanco = (banco, g, nome) => {
  const m = banco.mesh[nome], a = [], f = (banco.fette[nome] || []).find(x => x.g === g)
  if (!m || !f) return a
  for (let i = f.da; i < f.da + f.n; i++) a.push(riga(m, i))
  return a
}
const stesse = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])

/* ══════════ 1. identico al campo da solo ══════════ */
{
  const scena = new THREE.Scene(), banco = new BancoCampi(scena)
  const prove = [['grano', 7, 3, 5, 0], ['mais', 12, 9, 2, 1], ['pomodoro', 5, -4, 8, 3], ['lavanda', 3, 11, 11, 2], ['cipolla', 9, 20, 0, 0], ['riso', 2, 0, 20, 1], ['zucca', 8, 6, 6, 2]]
  const crescita = [1, 0.6, 0.2, -1]
  let uguali = 0, totale = 0
  const campi = prove.map(([coltura, seme, x, z, rot]) => {
    const solo = M.creaCampo(seme), g = M.creaCampo(seme)
    scena.add(g); sposta(solo, x, z, rot * Math.PI / 2); sposta(g, x, z, rot * Math.PI / 2)
    alleggeriOmbre(g); banco.adotta(g)
    M.aggiornaCampo(solo, crescita, 1.3, coltura, true); M.aggiornaCampo(g, crescita, 1.3, coltura, true)
    return { solo, g, coltura }
  })
  banco.aggiorna()
  for (const { solo, g } of campi) for (const nome of Object.keys(solo.userData.grano.parti)) {
    totale++
    if (stesse(dalCampoSolo(solo, nome), dalBanco(banco, g, nome))) uguali++
  }
  uguale('ogni forma di ogni campo (7 colture, spostati e girati) è identica a quella del campo da solo', uguali, totale)
  controlla('…e le piante non sono più figlie del gruppo del campo', campi.every(({ g }) => !g.children.some(o => o.isInstancedMesh)))
  const mesh = scena.children.filter(o => o.isInstancedMesh)
  controlla('una mesh per forma, per tutti i campi (≤ 17 in tutto)', mesh.length > 0 && mesh.length <= 17 && new Set(mesh.map(o => o.geometry)).size === mesh.length, `${mesh.length}`)
  controlla('…e ognuna disegna solo quanto serve (count = somma delle fette)', Object.entries(banco.mesh).every(([n, m]) => m.count === banco.fette[n].reduce((s, f) => s + f.n, 0) && m.visible === (m.count > 0)))
  // il dito: l'istanza è di quel campo
  const f0 = banco.fette.foglia[0], m0 = banco.mesh.foglia
  controlla('campoDi: l\'istanza dà il suo campo', banco.campoDi(m0, f0.da) === f0.g && banco.campoDi(m0, f0.da + f0.n - 1) === f0.g && banco.campoDi(m0, 99999) === null)

  /* ══════════ 2. un campo mosso si ripone nel mondo ══════════ */
  const c = campi[0].g
  controlla('un campo fermo non è «mosso»', M.campoMosso(c) === false)
  sposta(c, 30, 30, 1); controlla('uno spostato lo è', M.campoMosso(c) === true)
  M.aggiornaCampo(c, crescita, 1.3, 'grano', true); banco.aggiorna()
  controlla('…e dopo la posa non lo è più', M.campoMosso(c) === false)
  const solo = M.creaCampo(7); sposta(solo, 30, 30, 1); M.aggiornaCampo(solo, crescita, 1.3, 'grano', true)
  controlla('spostato, le istanze seguono (identiche a un campo da solo nello stesso posto)', Object.keys(solo.userData.grano.parti).every(n => stesse(dalCampoSolo(solo, n), dalBanco(banco, c, n))))

  /* ══════════ 3. nascosto, tolto ══════════ */
  const tot = () => Object.values(banco.mesh).reduce((s, m) => s + m.count, 0)
  const prima = tot()
  campi[1].g.visible = false; banco.aggiorna()
  controlla('un campo nascosto non si disegna', tot() < prima && !Object.values(banco.fette).some(fs => fs.some(f => f.g === campi[1].g)))
  campi[1].g.visible = true; banco.aggiorna(); uguale('…e tornato visibile ricompare', tot(), prima)
  banco.lascia(campi[2].g); banco.aggiorna()
  controlla('un campo tolto sparisce dal banco', tot() < prima && campi[2].g.userData.grano.banco === null)

  /* ══════════ 4. la capienza cresce ══════════ */
  const prima2 = banco.mesh.filo ? banco.mesh.filo.instanceMatrix.count : 0
  for (let i = 0; i < 40; i++) { const g = M.creaCampo(i + 1); scena.add(g); sposta(g, i * 3, 40, 0); banco.adotta(g); M.aggiornaCampo(g, [1, 1, 1, 1], 0, 'grano', false) }
  banco.aggiorna()
  const f = banco.mesh.filo
  controlla('con 40 campi in più la mesh si rifà più grande e li tiene tutti', f.instanceMatrix.count >= f.count && f.count > prima2, `${prima2} → ${f.instanceMatrix.count}`)
  controlla('…senza lasciare mesh doppie in scena', scena.children.filter(o => o.isInstancedMesh).length === Object.keys(banco.mesh).length)
  banco.via(); controlla('via() toglie tutto', scena.children.filter(o => o.isInstancedMesh).length === 0 && banco.campi.size === 0)
}
riassunto('Fattoria 3D — il banco dei campi')
