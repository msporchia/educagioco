/* Il Sotterraneo 3D va col tempo, non coi fotogrammi (docs/sotterraneo/grafica-3d.md, «Il tempo, non i fotogrammi»).

   Si fa girare il disegno a 60, 120 e 144 fotogrammi al secondo per due secondi simulati, coi pezzi veri (le sagome dei
   mostri di scena3d/cose.js, il passo dell'eroe di scena3d/eroe.js, l'affondo di scena3d/racconto.js, la telecamera di
   scena3d/camera.js) e una corsa finta ferma: quante volte cambia la posa della sagoma di un mostro sveglio e di uno che dorme
   (il respiro fotografato, scena3d/sagome-pura.js), il passo dell'eroe, quanto dura l'affondo, dove arriva la telecamera. Deve
   venire uguale a ogni frequenza, e il respiro deve cambiare quanto dice PASSO_RESPIRO.
   `node test/esegui.mjs sotterraneo-3d-tempo --niente-build` */
import { Vector3 } from 'three'
import { creaCose } from '../../src/giochi/sotterraneo/scena3d/cose.js'
import { creaEroe, disegnaEroe } from '../../src/giochi/sotterraneo/scena3d/eroe.js'
import { assalto } from '../../src/giochi/sotterraneo/scena3d/racconto.js'
import { creaCamera } from '../../src/giochi/sotterraneo/scena3d/camera.js'
import { posaDi, direzioneDi, PASSO_RESPIRO } from '../../src/giochi/sotterraneo/scena3d/sagome-pura.js'
import { controlla, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const niente = () => {}
const figuraFinta = () => ({ o() { return { scala: 1, specchio: false, cosa: null } }, metti() { return 0 }, alto() { return 1.5 }, largo() { return 1 } })
// le sagome finte: ogni modello c'è, e si segna la posa (direzione e fotogramma) che ogni mostro avrebbe adesso
const sagomeFinte = () => {
  const ultimo = new Map()
  return {
    ultimo, ha: () => true, scatola: () => ({ alto: 1, largo: 1, att: [0.5, 0.6, 'colpo', null] }),
    metti(id, p) { ultimo.set(p.cosa, `${direzioneDi(p.yaw)}.${posaDi(p)}`); return true },
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
  const figure = figuraFinta(), figEroe = figuraFinta(), sagome = sagomeFinte()
  const cose = creaCose({ figure, sagome, aloni: finto, colonne: finto, etichette: finto, camera: camFinta })
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
    for (const [k, nome] of [['sveglio', sagome.ultimo.get(sveglio)], ['dorme', sagome.ultimo.get(dorme)], ['eroe', e.passo]]) {
      if (prima[k] !== undefined && prima[k] !== nome) cambi[k]++
      prima[k] = nome
    }
  }
  return { cambi, affondo: finito, camera }
}

const a = simula(60), b = simula(120), c = simula(144)
for (const [hz, r] of [[60, a], [120, b], [144, c]])
  nota(`${hz} Hz, 2 s: la posa della sagoma del mostro sveglio cambia ${r.cambi.sveglio} volte, di quello che dorme ${r.cambi.dorme}, il passo dell'eroe ${r.cambi.eroe}; l'affondo dura ${r.affondo.toFixed(3)} s; la telecamera a z ${r.camera.z.toFixed(3)}`)
for (const [hz, r] of [[120, b], [144, c]]) {
  for (const k of ['sveglio', 'dorme', 'eroe'])
    dentro(`${hz} Hz: la posa (${k}) cambia quanto a 60 Hz`, r.cambi[k], a.cambi[k] - 1, a.cambi[k] + 1)
  dentro(`${hz} Hz: l'affondo dura quanto a 60 Hz`, r.affondo, a.affondo - 1 / 60, a.affondo + 1 / 60)
  dentro(`${hz} Hz: la telecamera, un quarto di secondo dopo, sta dove a 60 Hz`, r.camera.distanceTo(a.camera), 0, 0.12)
}
// il respiro fotografato: un fotogramma ogni PASSO_RESPIRO secondi, sveglio o addormentato (il modello respira da sé); il passo dell'eroe
const attesi = 2 / PASSO_RESPIRO
dentro(`il mostro sveglio cambia posa una volta ogni ${PASSO_RESPIRO} s`, a.cambi.sveglio, Math.floor(attesi) - 1, Math.ceil(attesi) + 1)
dentro(`quello che dorme pure`, a.cambi.dorme, Math.floor(attesi) - 1, Math.ceil(attesi) + 1)
controlla('l\'eroe fermo non frulla (il passo al più 5 al secondo)', a.cambi.eroe / 2 <= 5 && a.cambi.eroe > 0, a.cambi.eroe)
riassunto('il sotterraneo 3d va col tempo')
