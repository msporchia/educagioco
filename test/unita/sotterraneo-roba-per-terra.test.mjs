/* La roba per terra nella discesa in 3D (scena3d/roba-per-terra.js, docs/sotterraneo/anteprime-3d.md): una cosa che ha un modello si
   vede col modello, nella versione semplice (una mesh sola: una chiamata di disegno), lunga LATO_PER_TERRA; chi il modello non ce
   l'ha (le armature, i tre gioielli di base) torna false e cose.js tiene lo sprite. Le copie di uno stesso pezzo condividono la geometria.
   `node test/esegui.mjs sotterraneo-roba-per-terra --niente-build` */
import { Group, Box3, Vector3 } from 'three'
import { creaRobaPerTerra, LATO_PER_TERRA } from '../../src/giochi/sotterraneo/scena3d/roba-per-terra.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const avviso = console.warn
console.warn = () => {}   // il ripiego dei modelli che non si costruiscono lo dice in console: qui non serve
const gruppo = new Group()
const T = creaRobaPerTerra(gruppo)
const mesh = g => { let n = 0; g.traverse(o => { if (o.isMesh) n++ }); return n }

T.inizia()
const con = ['spada', 'ascia@5.m.fuoco', 'arco-corto', 'scudo-legno', 'pozione', 'ampolla-vita', 'torcia', 'chiave', 'pergamena-portale']
const r = con.map((k, i) => ({ che: 'cosa', cosa: k, x: i, y: 0 }))
r.forEach((q, i) => controlla(`${q.cosa}: per terra col suo modello`, T.metti(q, q.cosa, i + 0.5, 0.1, 0.5, 0)))
uguale('uno in scena per ogni cosa', gruppo.children.length, con.length)
for (const [i, g] of gruppo.children.entries()) {
  uguale(`${con[i]}: una mesh sola (la versione semplice)`, mesh(g), 1)
  const d = new Box3().setFromObject(g).getSize(new Vector3())
  // piegato verso la telecamera la scatola dritta cresce un poco: lungo LATO_PER_TERRA prima di piegarlo
  controlla(`${con[i]}: lungo circa ${LATO_PER_TERRA} celle`, Math.max(d.x, d.y, d.z) <= LATO_PER_TERRA * 1.25 && Math.max(d.x, d.y, d.z) >= LATO_PER_TERRA * 0.6, `${d.x.toFixed(2)}×${d.y.toFixed(2)}×${d.z.toFixed(2)}`)
}
for (const k of ['corazza', 'amuleto-rosso', 'medaglione', 'amuleto-osso'])
  controlla(`${k}: senza modello, resta lo sprite`, !T.metti({ che: 'cosa', cosa: k }, k, 0, 0, 0, 0) && !!COSE[k].sprite)
// due spade per terra: la stessa geometria
const altra = { che: 'cosa', cosa: 'spada', x: 9, y: 0 }
T.metti(altra, 'spada', 9.5, 0.1, 0.5, 0)
const geo = g => { let x = null; g.traverse(o => { if (o.isMesh) x = o.geometry }); return x }
controlla('due spade condividono la geometria', geo(gruppo.children[0]) === geo(gruppo.children[gruppo.children.length - 1]))
T.chiudi()
uguale('per il dito: quelle in vista', T.modellati.length, con.length + 1)
// raccolta (o fuori dalla luce): non si mette più, e chiudi la toglie; un piano nuovo svuota
T.inizia()
r.slice(1).forEach((q, i) => T.metti(q, q.cosa, i + 1.5, 0.1, 0.5, 0))
T.chiudi()
uguale('chi non si è messo si toglie dalla scena', gruppo.children.length, con.length - 1)
T.svuota()
uguale('un piano nuovo svuota', gruppo.children.length, 0)
T.via()
console.warn = avviso
riassunto('la roba per terra in 3D')
