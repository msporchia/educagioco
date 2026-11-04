// Chi viene a bere. A pozione pronta entra a saltelli, il fiasco vola dal
// calderone alle sue mani, beve, e la pozione fa quello che dice il suo nome:
// `EFFETTI`, uno per `effetto` di dati/misure.js. Vedi docs/pozioni/personaggi.md.
import { Group, Mesh, LatheGeometry, CylinderGeometry, Vector2, Vector3, Color, MeshStandardMaterial } from 'three'
import { creaFigura } from './figura.js'
import { suoni } from '../suoni.js'

const ALTO = 3
const CASA = new Vector3(1.8, 0, -0.6)
const FUORI = new Vector3(6.4, 0, -0.4)
const liscio = x => x * x * (3 - 2 * x)
const onda = (t, volte) => Math.sin(t * Math.PI * 2 * volte)

// le mosse: `f` è la figura, `c` dà la mano ai getti di luce
export const EFFETTI = {
  ruggisce: async ({ f, anima, luci, petto }) => anima(1.3, t => {
    const su = Math.min(1, t * 4) * (t > 0.8 ? (1 - t) * 5 : 1)
    f.misura(1 + su * 0.3, 1 + su * 0.05)
    f.piega(onda(t, 16) * 0.03 * su)
    if (t < 0.8) { const a = Math.random() * 6.28; luci(3, { da: petto, sparpaglia: 0.2, verso: [Math.cos(a) * 3, Math.sin(a) * 3, 0.4], caso: 0.5, colore: '#ffb03a', vita: 0.6, misura: 0.16, gravita: 0 }) }
  }),
  sparisce: async ({ f, anima, luci, petto }) => anima(1.5, t => {
    f.trasparenza(t < 0.35 ? 1 - t / 0.35 * 0.96 : t < 0.72 ? 0.04 : 0.04 + (t - 0.72) / 0.28 * 0.96)
    if (t < 0.5) luci(2, { da: petto, sparpaglia: 0.8, verso: [0, 0.8, 0], caso: 1, colore: '#d6e6ff', vita: 0.7, misura: 0.11, gravita: 0 })
  }),
  vola: async ({ f, anima, gocce, x, z }) => anima(1.8, t => {
    f.dove(x + onda(t, 2.4) * 0.35, z, liscio(t) * 6.5)
    f.piega(onda(t, 2.4) * 0.17)
    if (t < 0.7 && Math.random() < 0.4) gocce(1, { da: new Vector3(x, 0.8 + t * 4, z), sparpaglia: 0.5, verso: [0, -0.3, 0], caso: 0.5, colore: '#eaf6ff', vita: 1.2, misura: 0.15, gravita: 0.8 })
  }),
  ride: async ({ f, anima, luci, petto, x, z }) => anima(1.5, t => {
    f.piega(onda(t, 9) * 0.15)
    f.dove(x, z, Math.abs(onda(t, 4.5)) * 0.14)
    if (Math.random() < 0.5) luci(1, { da: petto, sparpaglia: 0.6, verso: [0, 1.6, 0], caso: 1.2, colore: '#ffe05a', vita: 0.7, misura: 0.14, gravita: 0 })
  }),
  forza: async ({ f, anima, gocce, x, z }) => {
    await anima(0.3, t => f.misura(1, 1 - liscio(t) * 0.26))
    await anima(0.34, t => { f.misura(1, 0.74 + Math.min(1, t * 3) * 0.32); f.dove(x, z, Math.sin(t * Math.PI) * 1.5) })
    const piedi = new Vector3(x, 0.08, z + 0.2)
    gocce(26, { da: piedi, sparpaglia: 0.6, verso: [0, 1, 0], caso: 2.6, colore: '#c8a878', vita: 0.7, misura: 0.2, gravita: 3, allarga: 0.6 })
    await anima(0.75, t => f.misura(1 + Math.sin(Math.min(1, t * 2.4) * Math.PI / 2) * 0.16 * (1 - t * 0.4), 1 - Math.max(0, 0.16 - t) + onda(t, 4) * 0.012))
  },
  dorme: async ({ f, anima, luci, petto }) => anima(1.7, t => {
    f.piega(-liscio(Math.min(1, t * 3)) * 0.42 + onda(t, 1.5) * 0.02)
    if (t > 0.25 && Math.random() < 0.18) luci(1, { da: petto.clone().setY(petto.y + 0.8), sparpaglia: 0.15, verso: [0.5, 1.1, 0], caso: 0.2, colore: '#c8bcff', vita: 1.3, misura: 0.2, gravita: 0 })
  }),
  corre: async ({ f, anima, gocce, x, z }) => {
    await anima(1, t => {
      const qui = x - 1.5 + Math.cos(t * Math.PI * 4) * 1.5
      f.dove(qui, z, Math.abs(onda(t, 6)) * 0.1)
      f.piega(Math.sin(t * Math.PI * 4) * 0.22)
      gocce(1, { da: new Vector3(qui, 0.7, z), sparpaglia: 0.4, verso: [0, 0, 0], caso: 0.2, colore: '#ffe05a', vita: 0.3, misura: 0.22, gravita: 0 })
    })
    await anima(0.35, t => { f.dove(x + t * t * 5, z); f.piega(-0.3) })
  },
  parla: async ({ f, anima, luci, petto, x, z }) => anima(1.5, t => {
    f.misura(1, 1 + onda(t, 8) * 0.05)
    f.dove(x, z, Math.abs(onda(t, 3)) * 0.1)
    if (Math.random() < 0.28) luci(1, { da: petto.clone().setY(petto.y + 0.5), sparpaglia: 0.2, verso: [-1.2, 1, 0], caso: 0.6, colore: '#6fe0a0', vita: 0.8, misura: 0.17, gravita: 0 })
  }),
  profuma: async ({ f, anima, luci, x, z }) => anima(1.6, t => {
    f.piega(onda(t, 1.6) * 0.09)
    const a = t * 14
    for (const s of [0, Math.PI]) luci(1, { da: new Vector3(x + Math.cos(a + s) * 1.05, 0.4 + t * 2.3, z + Math.sin(a + s) * 0.6), sparpaglia: 0.04, verso: [0, 0.3, 0], caso: 0.2, colore: '#ff9ccb', vita: 0.8, misura: 0.17, gravita: 0 })
  }),
  gigante: async ({ f, anima, aspetta }) => {
    await anima(0.62, t => f.misura(1 + (Math.floor(t * 3 + 1) / 3 - (1 - t * 3 % 1) * 0.08) * 0.95))
    await aspetta(0.5)
    await anima(0.35, t => f.misura(1.95 - liscio(t) * 0.95))
  },
}

export function creaCliente(scena, trame, eff, { foto, anima, aspetta }) {
  const f = creaFigura(scena, trame, ALTO)
  f.mostra(false)

  // il fiasco col brodo della pozione
  const fiasco = new Group()
  const vetro = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 })
  const pancia = new Mesh(new LatheGeometry([[0, 0], [0.16, 0.01], [0.24, 0.1], [0.23, 0.24], [0.11, 0.36], [0.075, 0.42], [0.075, 0.54]].map(([x, y]) => new Vector2(x, y)), 18), vetro)
  const tappo = new Mesh(new CylinderGeometry(0.08, 0.07, 0.1, 10), new MeshStandardMaterial({ color: 0xb08050, roughness: 0.9 }))
  tappo.position.y = 0.58
  fiasco.add(pancia, tappo)
  fiasco.visible = false
  scena.add(fiasco)

  async function viene({ chi, colore, effetto, partenza }) {
    f.posa(foto[chi])
    f.misura(); f.piega(0); f.trasparenza(1); f.mostra(true)
    // a saltelli: un passo a ogni tocco di terra
    let passi = 0
    await anima(1, t => {
      const e = 1 - (1 - t) ** 2
      f.dove(FUORI.x + (CASA.x - FUORI.x) * e, FUORI.z + (CASA.z - FUORI.z) * e, Math.abs(onda(t, 2.5)) * 0.26)
      f.piega(onda(t, 2.5) * 0.08)
      if (Math.floor(t * 5) > passi) { passi++; suoni.passo() }
    })
    f.dove(CASA.x, CASA.z); f.piega(0)
    suoni.verso(chi)
    await aspetta(0.4)

    // il fiasco vola dal calderone alle mani
    const mani = new Vector3(CASA.x - 0.72, 1.15, CASA.z + 0.3), bocca = new Vector3(CASA.x - 0.34, 1.95, CASA.z + 0.3)
    const tinta = new Color(colore)
    vetro.color.copy(tinta); vetro.emissive = tinta.clone().multiplyScalar(0.35)
    fiasco.visible = true; fiasco.scale.setScalar(1); fiasco.rotation.set(0, 0, 0)
    tappo.visible = true
    suoni.lancio()
    await anima(0.55, t => {
      const e = liscio(t)
      fiasco.position.lerpVectors(partenza, mani, e)
      fiasco.position.y += Math.sin(e * Math.PI) * 1.1
      fiasco.rotation.z = (1 - e) * 6.28
    })
    tappo.visible = false
    await anima(0.2, t => { fiasco.position.lerpVectors(mani, bocca, liscio(t)); fiasco.rotation.z = -liscio(t) * 1.9 })

    // beve, tutto d'un fiato
    suoni.beve()
    await anima(0.95, t => {
      f.piega(liscio(Math.min(1, t * 3)) * -0.14)
      f.misura(1, 1 + onda(t, 4) * 0.018)
      fiasco.rotation.z = -1.9 - t * 0.5
    })
    await anima(0.16, t => { f.piega(-0.14 * (1 - t)); fiasco.scale.setScalar(Math.max(0.001, 1 - t)) })
    fiasco.visible = false
    f.misura(); f.piega(0)
    await aspetta(0.12)

    suoni.effetto(effetto)
    await EFFETTI[effetto]({
      f, anima, aspetta, x: CASA.x, z: CASA.z, petto: new Vector3(CASA.x, 1.3, CASA.z + 0.3),
      luci: (n, o) => eff.luci.emetti(n, o), gocce: (n, o) => eff.gocce.emetti(n, o),
    })
    await aspetta(0.3)
  }

  return { viene, rilascia: () => { f.rilascia(); pancia.geometry.dispose(); tappo.geometry.dispose(); vetro.dispose(); tappo.material.dispose() } }
}
