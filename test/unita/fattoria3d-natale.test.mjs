/* Il Natale da comprare (docs/fattoria3d/natale.md): prezzi e livelli degli alberi grandi che crescono con la misura, i pezzi solo 3D di stagione, i modelli che
   si costruiscono con la neve spenta e le lucine che lampeggiano col tempo, in comune fra le copie. Senza browser. `node test/esegui.mjs fattoria3d-natale`
   tempo: 1 */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const { PEZZI } = await import('../../src/giochi/fattoria3d/dati/catalogo.js')
const { NATALE_CREA, creaAlberoNatale } = await import('../../src/giochi/fattoria3d/scena3d/modelli-natale.js')
const { STATICI } = await import('../../src/giochi/fattoria3d/scena3d/statici-istanze.js')

const ALBERI = ['albero_natale', 'albero_natale_alto', 'albero_natale_grande', 'albero_natale_gigante']
const NUOVI = ['albero_natale_alto', 'albero_natale_grande', 'albero_natale_gigante', 'bastoni_zucchero', 'bastoni_zucchero_fila', 'pacchi_regalo', 'ghirlanda_natale', 'renna_natale', 'slitta_natale']

for (const id of NUOVI) {
  const p = PEZZI[id]
  controlla(`${id}: di Natale, nella scheda Feste, solo 3D, non produttivo`, p && p.stagione === 'natale' && p.categoria === 'feste' && !p.produttivo && p.prezzo > 0 && p.liv >= 1)
  controlla(`${id}: ha il suo modello`, typeof NATALE_CREA[id] === 'function')
}
for (let i = 1; i < ALBERI.length; i++) {
  const a = PEZZI[ALBERI[i - 1]], b = PEZZI[ALBERI[i]]
  controlla(`${ALBERI[i]}: più grande, più caro e più in alto di ${ALBERI[i - 1]}`, b.w * b.d > a.w * a.d && b.prezzo > a.prezzo && b.liv > a.liv)
}
controlla('i pezzi piccoli costano meno dell\'albero grande, e arrivano prima', ['bastoni_zucchero', 'pacchi_regalo', 'ghirlanda_natale', 'renna_natale'].every(id => PEZZI[id].prezzo < PEZZI.albero_natale_grande.prezzo && PEZZI[id].liv < PEZZI.albero_natale_grande.liv))
controlla('bastoni e pacchi fermi vanno nel banco delle istanze', ['bastoni_zucchero', 'bastoni_zucchero_fila', 'pacchi_regalo'].every(id => STATICI.has(id)))

for (const id of [...ALBERI, 'ghirlanda_natale', 'renna_natale', 'slitta_natale', 'bastoni_zucchero', 'pacchi_regalo']) {
  const g = (NATALE_CREA[id] || creaAlberoNatale[id])()
  controlla(`${id}: niente neve sopra`, g.userData.senzaNeve === true)
  let tri = 0, mesh = 0; g.traverse(o => { if (o.isMesh) { mesh++; tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 } })
  controlla(`${id}: ${mesh} mesh, ${Math.round(tri)} triangoli, sotto il tetto (8 mesh, 6000 triangoli)`, mesh >= 1 && mesh <= 8 && tri <= 6000)
}

const a = creaAlberoNatale.albero_natale_grande(), b = creaAlberoNatale.albero_natale()
controlla('l\'albero ha le tre luci (rossa, gialla, azzurra) e anima', a.userData.fari && a.userData.fari.r && a.userData.fari.g && a.userData.fari.b && typeof a.userData.anima === 'function')
controlla('le luci sono in comune fra gli alberi di ogni misura (si accendono insieme)', a.userData.fari.r === b.userData.fari.r && a.userData.fari.b === b.userData.fari.b)
a.userData.anima(0); const r0 = a.userData.fari.r.emissiveIntensity, b0 = a.userData.fari.b.emissiveIntensity
a.userData.anima(0.9); const r1 = a.userData.fari.r.emissiveIntensity, b1 = a.userData.fari.b.emissiveIntensity
controlla('lampeggia col tempo: rosse e azzurre cambiano, in senso opposto', r1 !== r0 && b1 !== b0 && Math.sign(r1 - r0) === -Math.sign(b1 - b0))
a.userData.anima(0); controlla('lo stesso istante dà lo stesso valore (conta il tempo, non i fotogrammi)', a.userData.fari.r.emissiveIntensity === r0)
const alto = creaAlberoNatale.albero_natale_gigante().userData.altezza
controlla('il gigante è molto più alto del piccolo', alto > 2.5 * b.userData.altezza, `${alto} contro ${b.userData.altezza}`)

riassunto('Fattoria 3D — il Natale da comprare')
