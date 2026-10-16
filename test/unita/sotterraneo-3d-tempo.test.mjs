/* Il Sotterraneo 3D va col tempo, non coi fotogrammi (docs/sotterraneo/grafica-3d.md, «Il tempo, non i fotogrammi»).

   Si fa girare il disegno a 60, 120 e 144 fotogrammi al secondo per due secondi simulati, coi pezzi veri (le figure dei
   mostri e dell'eroe di scena3d/cose.js e scena3d/eroe.js, l'affondo di scena3d/racconto.js, la telecamera di
   scena3d/camera.js) e una corsa finta ferma: quante volte cambia lo sprite di un mostro sveglio, di uno che dorme e
   dell'eroe, quanto dura l'affondo, dove arriva la telecamera. Deve venire uguale a ogni frequenza, e lo sprite deve
   cambiare quanto nel 2D (scena/tela.js: 8 al secondo da sveglio, 4 da fermo).
   `node test/esegui.mjs sotterraneo-3d-tempo --niente-build` */
import { Vector3 } from 'three'
import { creaCose } from '../../src/giochi/sotterraneo/scena3d/cose.js'
import { creaEroe, disegnaEroe } from '../../src/giochi/sotterraneo/scena3d/eroe.js'
import { assalto } from '../../src/giochi/sotterraneo/scena3d/racconto.js'
import { creaCamera } from '../../src/giochi/sotterraneo/scena3d/camera.js'
import { controlla, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const niente = () => {}
const figuraFinta = () => {
  const ultimo = new Map()   // cosa → nome dell'ultimo sprite posato
  let eroe = null
  return {
    ultimo, get eroe() { return eroe },
    o() { return { scala: 1, specchio: false, cosa: null } },
    metti(nome, x, y, z, o) { if (o && o.cosa) ultimo.set(o.cosa, nome); else if (!eroe || /-(fermo|corsa)-/.test(nome)) eroe = nome; return 0 },
    alto() { return 1.5 }, largo() { return 1 },
  }
}
const finto = { metti: niente, inizia: niente, chiudi: niente }
const camFinta = { schermo: (x, y, z, p = {}) => { p.x = 0; p.y = 0; return p } }
const luciFinte = { torcia: niente, aggiungi: niente }

function simula(hz, secondi = 2) {
  const sveglio = { che: 'mostro', tipo: 'goblin', x: 3, y: 3, fx: 3.5, fy: 3.5, sveglio: true, ossa: 4, ossaMax: 4, guarda: 'dx' }
  const dorme = { che: 'mostro', tipo: 'scheletro', x: 6, y: 3, fx: 6.5, fy: 3.5, sveglio: false, ossa: 4, ossaMax: 4, guarda: 'dx' }
  const corsa = {
    livello: { robe: [sveglio, dorme], largo: 20, alto: 20, relitti: [], a: () => 1 }, scenario: 'cripta',
    inLuce: () => true, luceDi: () => 2, eroe: { x: 1.5, y: 1.5 }, versoEroe: { dx: 1, dy: 0 }, io: { sprite: 'cavaliere' }, vita: 10, vitaMax: 10,
  }
  const figure = figuraFinta(), figEroe = figuraFinta()
  const cose = creaCose({ figure, aloni: finto, colonne: finto, etichette: finto, camera: camFinta })
  const e = creaEroe()
  const cam = creaCamera(); cam.misura(390, 700, 1050)
  const centro = new Vector3(10, 0, 10)
  let camera = null
  const cambi = { sveglio: 0, dorme: 0, eroe: 0 }, prima = {}
  const dt = 1 / hz
  let t = 0, finito = null
  const bersaglio = { x: 4, z: 1.5 }
  assalto(e, bersaglio, 0.48, 0.19)
  for (let i = 0; i < Math.round(secondi * hz); i++) {
    t += dt
    cose.disegna(corsa, { t, dt, dtScena: dt })
    disegnaEroe(e, corsa, { figure: figEroe, luci: luciFinte, etichette: finto, camera: camFinta, dt, dtScena: dt, t })
    if (e.assalto == null && finito == null) finito = t
    if (t >= 1 && centro.x === 10) centro.set(14, 0, 12)   // a un secondo l'eroe si sposta: la telecamera lo segue
    cam.aggiorna(dt, centro, { t })
    if (!camera && t >= 1.25) camera = cam.camera.position.clone()
    for (const [k, nome] of [['sveglio', figure.ultimo.get(sveglio)], ['dorme', figure.ultimo.get(dorme)], ['eroe', figEroe.eroe]]) {
      if (prima[k] !== undefined && prima[k] !== nome) cambi[k]++
      prima[k] = nome
    }
  }
  return { cambi, affondo: finito, camera }
}

const a = simula(60), b = simula(120), c = simula(144)
for (const [hz, r] of [[60, a], [120, b], [144, c]])
  nota(`${hz} Hz, 2 s: lo sprite del mostro sveglio cambia ${r.cambi.sveglio} volte, di quello che dorme ${r.cambi.dorme}, dell'eroe ${r.cambi.eroe}; l'affondo dura ${r.affondo.toFixed(3)} s; la telecamera a z ${r.camera.z.toFixed(3)}`)
for (const [hz, r] of [[120, b], [144, c]]) {
  for (const k of ['sveglio', 'dorme', 'eroe'])
    dentro(`${hz} Hz: lo sprite (${k}) cambia quanto a 60 Hz`, r.cambi[k], a.cambi[k] - 1, a.cambi[k] + 1)
  dentro(`${hz} Hz: l'affondo dura quanto a 60 Hz`, r.affondo, a.affondo - 1 / 60, a.affondo + 1 / 60)
  dentro(`${hz} Hz: la telecamera, un quarto di secondo dopo, sta dove a 60 Hz`, r.camera.distanceTo(a.camera), 0, 0.12)
}
// quanto nel 2D (scena/tela.js): 8 al secondo da sveglio, 4 da fermo; l'eroe 4 da fermo
dentro('il mostro sveglio cambia sprite come nel 2D (8 al secondo)', a.cambi.sveglio / 2, 6, 9)
dentro('quello che dorme come nel 2D (4 al secondo)', a.cambi.dorme / 2, 2.5, 4.5)
controlla('l\'eroe fermo non frulla (al più 5 al secondo)', a.cambi.eroe / 2 <= 5, a.cambi.eroe)
riassunto('il sotterraneo 3d va col tempo')
