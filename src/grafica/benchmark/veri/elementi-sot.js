// Chi pesa nello scontro delle discese (docs/core/vecchio-telefono-elementi.md): la scena di veri/discese.js con 1 mostro e gli
// effetti a ripetizione, e gli elementi accesi o spenti come chiede la scena (`s.accesi`). Gli elementi sono pezzi di ACCESI che la
// scena legge a ogni fotogramma (grafica/elementi3d.js); `ombra` è l'ombra del cono, `normali` le normal map (veri/moltiplica.js).
import { creaSotterraneo3d } from '../../../giochi/sotterraneo/scena3d/indice.js'
import { ACCESI } from '../../../giochi/sotterraneo/scena3d/costanti.js'
import { corsaDelloScontro, dprDelGioco } from './discese.js'
import { leve } from './moltiplica.js'
import { nuovaTela, finche } from './tela.js'
import { SCENE_ELEMENTI } from './elementi-dati.js'

const COLPI = ['palla', 'fulmine', 'spazzata', 'meteora', 'catena', 'esplode', 'nevicata', 'fiammata']
const OGNI = 700

/** Mette gli elementi di `nomi` come dice `accesi` (un Set), sui valori `orig` di ACCESI; gli speciali li fa `speciale(k, acceso)`. */
export function mettiElementi(nomi, accesi, orig, speciale) {
  for (const k of nomi) {
    const su = accesi.has(k)
    if (speciale(k, su)) continue
    if (k in orig) ACCESI[k] = su ? orig[k] : (typeof orig[k] === 'number' ? 0 : false)
  }
}

export async function prepara({ contenitore, opz = {} }) {
  const tela = nuovaTela(contenitore)
  const dpr = opz.dpr || dprDelGioco()
  const pittore = creaSotterraneo3d(tela.canvas, { strato: tela.strato, dpr, spegni: opz.spegni || [], cieca: 320 })
  if (!pittore) { tela.via(); throw new Error('il Sotterraneo 3D non parte (WebGL 2?)') }
  const orig = { ...ACCESI }
  const gl = tela.canvas.getContext('webgl2')
  const lv = leve(pittore.scena)
  const quanti = opz.mostri || 1   // la scala della verifica ne vuole 3 (veri/scala.js)
  const corsa = corsaDelloScontro(quanti)
  pittore.misura()
  pittore.mostra({ corsa, orologio: 0, fx: null })
  // il giro del pittore parte con quello della misura (`avvia`, fra i due requestAnimationFrame di veri.js): i mostri e gli effetti alla prima scena
  let cono = null, conoOmbra = false, pronta = false, k = 0, colpi = 0
  pittore.scena.traverse(o => { if (o.isSpotLight && !cono) cono = o })
  conoOmbra = !!(cono && cono.castShadow)
  const parti = () => setInterval(() => {
    try { pittore.prova(k % 2 ? 'mostro' : COLPI[(k >> 1) % COLPI.length], k % quanti) } catch (e) { /* un effetto che non c'è */ }
    k++
  }, OGNI)
  let senzaNormali = false
  const speciale = (n, su) => {
    if (n === 'ombra') { if (cono) cono.castShadow = su && conoOmbra; return true }
    if (n === 'normali') { if (su && senzaNormali) { lv.ripristina(); senzaNormali = false } else if (!su) { lv.senzaNormali(); senzaNormali = true } return true }
    return false
  }
  return {
    dpr,
    gl: () => gl,
    tela: tela.canvas,
    scena3d: () => pittore.scena,
    conti() { const g = pittore.grafica(); return { ch: g.chiamate, tri: g.triangoli, programmi: g.programmi, geo: g.memoria.geometries, tex: g.memoria.textures } },
    avvia: () => pittore.avvia(),
    async scena(s) {
      if (!pronta) { pronta = true; await finche(() => pittore.grafica().mostri3d >= quanti && pittore.palco, 8000); colpi = parti() }
      mettiElementi(SCENE_ELEMENTI.sot.elementi, new Set(s.accesi), orig, speciale)
    },
    via() {
      clearInterval(colpi); lv.ripristina(); Object.assign(ACCESI, orig)
      try { pittore.distruggi() } finally { tela.via() }
    },
  }
}
