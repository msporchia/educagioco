// Chi pesa nella fattoria 3D (docs/core/vecchio-telefono-elementi.md): la scena di veri/fattoria.js (la fattoria tipo del livello 10,
// le opzioni della fascia, il degrado fermo) con gli elementi accesi o spenti come chiede la scena (`mondo.spenti`). Speciali: `ombra`
// (quella del sole, se la fascia la tiene) e `nebbia` (spenta come fa il gioco: lontanissima). `opz.qualita`: le leve (i ciuffi spenti).
import { Mondo3d } from '../../../giochi/fattoria3d/scena3d/mondo3d.js'
import { fattoriaTipo, borsaInfinita } from '../../../giochi/fattoria3d/motore/tipo.js'
import { qualitaIniziale } from '../../../giochi/fattoria3d/dati/qualita.js'
import { fasciaAttiva } from '../../../store/qualita.js'
import { nuovaTela, pausa } from './tela.js'
import { SCENE_ELEMENTI } from './elementi-dati.js'
import { LIVELLO } from './fattoria.js'

const UI = new Proxy({}, { get: () => () => null })

export async function prepara({ contenitore, opz = {} }) {
  const tela = nuovaTela(contenitore)
  const sopra = document.createElement('div')
  Object.assign(sopra.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden', opacity: '0' })
  tela.casa.appendChild(sopra)
  let mondo = null
  try {
    const motore = fattoriaTipo(LIVELLO)
    motore.borsa = borsaInfinita()
    mondo = new Mondo3d({ canvas: tela.canvas, sopra, motore, ui: UI, qualita: { ...qualitaIniziale(fasciaAttiva()), ...(opz.qualita || {}) }, stagione: null })
  } catch (e) { tela.via(); throw e }
  mondo.degradoFermo = true
  const fog = mondo.scena.fog, vicino = fog.near, lontano = fog.far, ombra = mondo.sole.castShadow
  let pronta = false
  return {
    dpr: mondo.renderer.getPixelRatio(),
    gl: () => mondo.renderer.getContext(),
    tela: tela.canvas,
    scena3d: () => mondo.scena,
    avvia: () => mondo.avvia(),
    conti() { const i = mondo.renderer.info; return { ch: i.render.calls, tri: i.render.triangles, programmi: (i.programs || []).length, geo: i.memory.geometries, tex: i.memory.textures } },
    async scena(s) {
      if (!pronta) {
        pronta = true
        const mesh = () => { let n = 0; mondo.scena.traverse(o => { if (o.isMesh) n++ }); return n }
        for (let prima = -1, giri = 0; giri < 15; giri++) { const n = mesh(); if (n === prima) break; prima = n; await pausa(300) }
      }
      const su = new Set(s.accesi)
      mondo.spenti.clear()
      for (const k of SCENE_ELEMENTI.fat.elementi) if (!su.has(k)) mondo.spenti.add(k)
      if (mondo.sole.castShadow !== (ombra && su.has('ombra'))) { mondo.sole.castShadow = ombra && su.has('ombra'); mondo.ombraSporca = true }
      fog.near = su.has('nebbia') ? vicino : 1e6; fog.far = su.has('nebbia') ? lontano : 2e6
    },
    via() { try { mondo.via(); mondo.renderer.dispose() } finally { tela.via() } },
  }
}
