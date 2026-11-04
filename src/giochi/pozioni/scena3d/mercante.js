// Il mercante: sta accanto al calderone e respira. Quando arriva un ordine
// alza il braccio e parla, se trabocca scuote la testa, a pozione fatta
// salta. Non decide niente: fa quello che la scena gli dice.
import { creaFigura } from './figura.js'
import { suoni } from '../suoni.js'

const ALTO = 2.9
const CASA = { x: -2.1, z: -1.6 }

export function creaMercante(scena, trame, { foto, anima }) {
  const f = creaFigura(scena, trame, ALTO)
  f.posa(foto.mercante)
  f.dove(CASA.x, CASA.z)
  let piega = 0, su = 0, gesto = 0

  const salta = (quante, durata) => {
    gesto++
    return anima(durata, t => { su = Math.abs(Math.sin(t * Math.PI * quante)) * 0.34 }).then(() => { su = 0; gesto-- })
  }
  return {
    aggiorna(dt, t) {
      f.misura(1, 1 + Math.sin(t * 1.9) * 0.012)
      f.piega(piega + Math.sin(t * 0.8) * 0.018)
      f.dove(CASA.x, CASA.z, su)
    },
    // il braccio alzato, finché le ampolle non sono sul banco
    async porge(durata) {
      f.posa(foto['mercante-porge'])
      suoni.parla()
      await salta(1, 0.4)
      await anima(durata, () => {})
      f.posa(foto.mercante)
    },
    scuote() {
      suoni.no()
      anima(0.8, t => { piega = Math.sin(t * Math.PI * 5) * 0.09 * (1 - t) }).then(() => { piega = 0 })
    },
    esulta() {
      f.posa(foto['mercante-porge'])
      suoni.evviva()
      salta(3, 1.2).then(() => f.posa(foto.mercante))
    },
    rilascia: () => f.rilascia(),
  }
}
