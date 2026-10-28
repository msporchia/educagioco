// La fattoria 3D vera nella misura del telefono (docs/core/vecchio-telefono-veri.md): la scena di scena3d/mondo3d.js su una fattoria
// «tipo» del livello 10 (motore/tipo.js, deterministica), con le opzioni della fascia del telefono e il degrado fermo, più le prove di
// stress del gioco (`mondo.stress`: edifici e recinti con le bestie, che non si salvano). La festa ha un mondo suo (Natale).
import { Mondo3d } from '../../../giochi/fattoria3d/scena3d/mondo3d.js'
import { fattoriaTipo, borsaInfinita } from '../../../giochi/fattoria3d/motore/tipo.js'
import { qualitaIniziale } from '../../../giochi/fattoria3d/dati/qualita.js'
import { fasciaAttiva } from '../../../store/qualita.js'
import { nuovaTela, pausa } from './tela.js'

export const LIVELLO = 10

// le porte verso la vista: nessun foglio aperto, nessuna zona dove lasciare, il resto non fa niente
const UI = new Proxy({}, { get: () => () => null })

/** `opz.stagione`: 'natale' | 'halloween' | null; `opz.livello` (di difetto LIVELLO); `opz.degrado`: il degrado del gioco acceso (gli fps veri). Le scene: { edifici, pollai, stalle }. */
export async function prepara({ contenitore, opz = {} }) {
  const tela = nuovaTela(contenitore)
  const sopra = document.createElement('div')
  Object.assign(sopra.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden', opacity: '0' })
  tela.casa.appendChild(sopra)
  let mondo = null
  try {
    const motore = fattoriaTipo(opz.livello || LIVELLO)
    motore.borsa = borsaInfinita()   // la fattoria tipo esce senza borsa: la mette chi gioca (Gioco.vue)
    mondo = new Mondo3d({ canvas: tela.canvas, sopra, motore, ui: UI, qualita: qualitaIniziale(fasciaAttiva()), stagione: opz.stagione || null })
  } catch (e) { tela.via(); throw e }
  mondo.degradoFermo = !opz.degrado
  return {
    dpr: mondo.renderer.getPixelRatio(),
    gl: () => mondo.renderer.getContext(),
    tela: tela.canvas,
    scena3d: () => mondo.scena,
    avvia: () => mondo.avvia(),
    conti() {
      const i = mondo.renderer.info
      return { ch: i.render.calls, tri: i.render.triangles, programmi: (i.programs || []).length, geo: i.memory.geometries, tex: i.memory.textures }
    },
    async scena(s) {
      mondo.stress(null, 0)
      if (s.edifici) mondo.stress('edifici', s.edifici)
      if (s.pollai) mondo.stress('pollaio', s.pollai)
      if (s.stalle) mondo.stress('stalla', s.stalle)
      // i pezzi nuovi si costruiscono nei fotogrammi che seguono: si aspetta che il conto delle mesh si fermi
      const mesh = () => { let n = 0; mondo.scena.traverse(o => { if (o.isMesh) n++ }); return n }
      for (let prima = -1, giri = 0; giri < 15; giri++) { const n = mesh(); if (n === prima) break; prima = n; await pausa(300) }
    },
    via() { try { mondo.via(); mondo.renderer.dispose() } finally { tela.via() } },
  }
}
