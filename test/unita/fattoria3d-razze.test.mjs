/* Le razze di cane e di gatto della fattoria 3D (docs/fattoria3d/adozioni.md): il catalogo si adotta, ogni razza si costruisce, ha i piedi a terra, un ingombro
   da cane o da gatto, un numero di triangoli che regge (le bambine ci tengono: niente forme povere) e un aspetto diverso dalle altre (colori nei vertici).
   `node test/esegui.mjs fattoria3d-razze`
   tempo: 1 */
import { controlla, uguale, dentro, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const { misure, posaGatto, creaGatto } = await import('../../src/giochi/fattoria3d/scena3d/modelli-compagni.js')
const { creaBestia, posaBeagle, RAZZE_CANE } = await import('../../src/giochi/fattoria3d/scena3d/modelli-bestie.js')
const { BESTIE, CURATI, comeCompagno, guastiDelleBestie, adottabili } = await import('../../src/giochi/fattoria3d/dati/bestie.js')
const { COMPAGNI, VARIANTI_GATTO } = await import('../../src/giochi/fattoria3d/dati/compagni.js')
const { formaDi, AGGANCI } = await import('../../src/giochi/fattoria3d/scena3d/modelli-addobbi.js')

const g = guastiDelleBestie()
controlla('i dati delle bestie non hanno guasti', !g.length, g.join(' · '))
const cani = Object.entries(BESTIE).filter(([, b]) => b.tipo === 'cane'), gatti = Object.entries(BESTIE).filter(([, b]) => b.tipo === 'gatto')
controlla('ogni razza di cane ha il suo corpo (RAZZE_CANE)', cani.every(([, b]) => RAZZE_CANE[b.variante]))
controlla('ogni mantello di gatto è conosciuto da creaGatto', gatti.every(([, b]) => VARIANTI_GATTO.includes(b.variante)))
controlla('non ci sono due animali con lo stesso nome di razza', new Set(adottabili().map(a => a.nome)).size === adottabili().length)

// un'impronta dei colori: la somma dei colori nei vertici o del colore del materiale, per pezzo
const impronta = g => {
  let h = 0
  g.traverse(o => {
    if (!o.isMesh || o.userData.colpo !== undefined && o.visible === false) return
    const c = o.geometry.attributes.color
    if (c) for (let i = 0; i < c.count; i += 7) h += c.getX(i) * 3 + c.getY(i) * 5 + c.getZ(i) * 11
    else if (o.material && o.material.color) h += o.material.color.r * 3 + o.material.color.g * 5 + o.material.color.b * 11
  })
  return Math.round(h * 100)
}

const viste = new Map()
for (const [id, b] of Object.entries(BESTIE).filter(([, b]) => b.tipo === 'cane' || b.tipo === 'gatto')) {
  const c = creaBestia(comeCompagno(id)), posa = b.tipo === 'cane' ? posaBeagle : posaGatto
  for (const stato of ['sta', 'siede', 'dorme', 'vaga', 'festa', 'lava']) posa(c, { stato, t: 0.7, fase: 1.3, vel: stato === 'vaga' ? 0.6 : 0, p: 0.5 })
  posa(c, { stato: 'sta', t: 0.4 })
  const m = misure(c)
  dentro(`${id}: i piedi a terra`, m.sotto, -0.03, 0.04)
  if (b.tipo === 'cane') { dentro(`${id}: è lungo come un cane`, m.lunghezza, 0.7, 1.4); dentro(`${id}: non è alto più del contadino`, m.altezza, 0.4, 0.9) }
  else { dentro(`${id}: lungo come un gatto`, m.lunghezza, 0.9, 1.6); dentro(`${id}: alto come un gatto`, m.altezza, 0.3, 0.9) }
  dentro(`${id}: abbastanza triangoli per essere bello e pochi per il telefono`, m.triangoli, b.tipo === 'cane' ? 2500 : 4000, 20000)
  controlla(`${id}: nessun numero sbagliato nei vertici`, (() => { let ok = true; c.traverse(o => { if (o.isMesh) for (const v of o.geometry.attributes.position.array) if (!Number.isFinite(v)) ok = false }); return ok })())
  uguale(`${id}: l'aggancio degli addobbi è quello giusto (cane col beagle, gatto col gatto)`, formaDi(c), b.tipo === 'cane' ? 'beagle' : 'gatto')
  controlla(`${id}: ha la forma degli addobbi`, !!AGGANCI[formaDi(c)])
  viste.set(id, impronta(c))
}
for (const id of Object.keys(CURATI).filter(k => COMPAGNI[k].tipo === 'gatto')) viste.set(id, impronta(creaGatto(COMPAGNI[id].variante)))
const doppi = [...viste.entries()].filter(([a, h], i, l) => l.some(([b, k], j) => j !== i && k === h)).map(([a]) => a)
controlla('nessun due animali ha lo stesso mantello (colori diversi)', !doppi.length, doppi.join(', '))

riassunto('Fattoria 3D — le razze di cani e gatti')
