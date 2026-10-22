/* La fattoria 3D tipo, senza browser: `#fattoria3d-tipo=N` mette una fattoria già giocata di quel livello. Deve essere una fattoria che
   il gioco avrebbe potuto produrre da sé: livello quello chiesto, niente di non ancora aperto, niente sovrapposto, già in moto, e si
   rilegge com'era. `node test/esegui.mjs fattoria3d-tipo`
   tempo: 1 */
import { fattoriaTipo, LIVELLI_TIPO, LIVELLO_MAX } from '../../src/giochi/fattoria3d/motore/tipo.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { PEZZI, EDIFICI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { livelloDelPezzo, sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { chiave } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const T0 = 1770000000000

for (const liv of [1, ...LIVELLI_TIPO, LIVELLO_MAX]) {
  const di = `al livello ${liv}`
  const f = fattoriaTipo(liv, { ora: T0 })
  f.ora = () => T0
  uguale(`il livello è quello chiesto ${di}`, f.livello(), Math.min(liv, f.livello()))
  controlla(`l'esperienza è la soglia ${di}`, f.esperienza() === sogliaDi(liv))
  controlla(`nessun evento in sospeso ${di}`, f.eventi.length === 0)

  // niente di non ancora aperto, né in mappa né nel magazzino
  for (const c of f.s.cose) controlla(`${c.tipo} è aperto ${di}`, livelloDelPezzo(c.tipo) <= liv, `sta a ${livelloDelPezzo(c.tipo)}`)
  for (const t of Object.keys(f.s.magazzino)) controlla(`${t} nel magazzino è aperto ${di}`, livelloDelPezzo(t) <= liv)

  // niente si sovrappone e tutto sta sulla terra propria
  const occupate = new Set()
  for (const c of f.s.cose) {
    const d = PEZZI[c.tipo] || EDIFICI[c.tipo]
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) {
      const k = chiave(c.i + a, c.j + b)
      controlla(`${c.tipo} ${c.id} non ne copre un altro ${di}`, !occupate.has(k) || !!d.suAcqua || !!d.calpestabile)
      occupate.add(k)
      controlla(`${c.tipo} ${c.id} sta sulla terra propria ${di}`, f.cellaPropria(c.i + a, c.j + b))
    }
  }

  // c'è quello che lavora e il livello ha aperto
  uguale(`ci sono dei campi ${di}`, f.s.cose.some(c => c.tipo === 'campo'), true)
  for (const t of Object.keys(EDIFICI)) if (livelloDelPezzo(t) <= liv && t !== 'mongolfiera' || liv >= 10) controlla(`${t} posseduto ${di}`, !!f.s.posseduti[t] || livelloDelPezzo(t) > liv, 'manca in mappa')

  // già in moto: un campo maturo e uno che cresce (dal livello 3 in su)
  if (liv >= 3) {
    controlla(`un campo è maturo ${di}`, f.daFare().raccogli > 0)
    controlla(`un campo cresce ${di}`, f.s.cose.some(c => c.tipo === 'campo' && !f.campoMaturo(c) && !f.campoVuoto(c)))
  }

  // si rilegge com'era
  const s = f.serializza()
  const g = new Fattoria3d({ stato: s, borsa: { quante: () => 0, paga: () => false }, ora: () => T0 })
  uguale(`si rilegge com'era ${di}`, JSON.stringify(g.serializza()), JSON.stringify(s))

  // la stessa ora dà la stessa fattoria
  const h = fattoriaTipo(liv, { ora: T0 })
  uguale(`è deterministica ${di}`, JSON.stringify(h.serializza()), JSON.stringify(fattoriaTipo(liv, { ora: T0 }).serializza()))
}

// livelli assurdi: si tengono nel campo
uguale('livello 0 vale 1', fattoriaTipo(0, { ora: T0 }).esperienza(), sogliaDi(1))
uguale('livello 500 vale il massimo', fattoriaTipo(500, { ora: T0 }).esperienza(), sogliaDi(LIVELLO_MAX))

riassunto('fattoria 3D tipo')
