// La scala del mondo di sopra (veri/scala.js, docs/core/vecchio-telefono-veri.md): il mondo vero della prima terra dalla partenza (il
// villaggio), con 4 persone e 3 mostri finti attorno all'eroe (mondo/folla-prova.js), e gli elementi accesi o spenti come chiede la
// scena. Speciali: `ombra` (quella del sole), `foschia` (la nebbia di three), `normali` (veri/normali.js).
import { creaMondo3d } from '../../../giochi/sotterraneo/scena3d/mondo/indice.js'
import { personeFinte, mostriFinti } from '../../../giochi/sotterraneo/scena3d/mondo/folla-prova.js'
import { ACCESI } from '../../../giochi/sotterraneo/scena3d/costanti.js'
import { ilMondo, mondoDaSalvato, terraDelMondo, fontaneDi } from '../../../giochi/sotterraneo/motore/mondo-sopra.js'
import { dprDelGioco } from './discese.js'
import { normali } from './normali.js'
import { nuovaTela, finche } from './tela.js'
import { ELEMENTI_SCALA } from './scala.js'
import { mettiElementi } from './elementi-sot.js'

const SPECIE = ['lupo', 'goblin', 'scheletro']

export async function prepara({ contenitore, opz = {} }) {
  const tela = nuovaTela(contenitore)
  const m = ilMondo({ terra: 1 })
  const salvato = mondoDaSalvato(m, null, [])
  const v = m.villaggio
  for (let y = v.y; y < v.y + v.h; y++) for (let x = v.x; x < v.x + v.w; x++) salvato.nebbia[y * m.W + x] = 1
  let api = null
  const passo = (dt, t) => { if (api) api.S.mostri = mostriFinti(3, SPECIE, api.S.io.x, api.S.io.z, t) }
  api = creaMondo3d(tela.canvas, { m, nebbia: salvato.nebbia, fontane: fontaneDi(m, terraDelMondo(m)), strato: tela.strato, dpr: dprDelGioco(),
                                   da: { x: m.partenza.x, y: m.partenza.y }, spegni: opz.spegni || [], riaccendi: opz.riaccendi || [], passo, dopo: () => {} })
  if (!api) { tela.via(); throw new Error('il mondo 3D non parte') }
  api.S.persone = personeFinte(4, api.S.io.x, api.S.io.z)
  const orig = { ...ACCESI }
  const scena = api.scena, fog = scena.fog
  let sole = null
  scena.traverse(o => { if (o.isDirectionalLight && !sole) sole = o })
  const soleOmbra = !!(sole && sole.castShadow)
  const lv = normali(scena)
  let pronta = false
  const speciale = (n, su) => {
    if (n === 'ombra') { if (sole) sole.castShadow = su && soleOmbra; return true }
    if (n === 'foschia') { scena.fog = su ? fog : null; return true }
    if (n === 'normali') { if (su) lv.ripristina(); else lv.senzaNormali(); return true }
    return false
  }
  return {
    dpr: dprDelGioco(),
    gl: () => tela.canvas.getContext('webgl2'),
    tela: tela.canvas,
    scena3d: () => scena,
    conti() { const g = api.grafica(); return { ch: g.chiamate, tri: g.triangoli, programmi: g.programmi, geo: g.memoria.geometries, tex: g.memoria.textures, agg: g.msJs, dis: g.msDisegno } },
    avvia: () => api.avvia(),
    async scena(s) {
      // la prima volta: i pezzi attorno all'eroe si costruiscono uno per fotogramma
      if (!pronta) { pronta = true; await finche(() => api.pronto, 10000); await new Promise(r => setTimeout(r, 1500)) }
      mettiElementi(ELEMENTI_SCALA.sopra, new Set(s.accesi), orig, speciale)
    },
    via() {
      lv.ripristina(); scena.fog = fog; Object.assign(ACCESI, orig)
      try { api.distruggi() } finally { tela.via() }
    },
  }
}
