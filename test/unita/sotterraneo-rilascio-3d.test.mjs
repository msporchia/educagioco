/* ═══════════════════════════════════════════════════════════════════
   CHIUDERE UN RENDERER DAVVERO — docs/sotterraneo/prestazioni-3d-perdite.md

   three appende un ascoltatore di `dispose` a ogni geometria, materiale e
   trama che carica, e `renderer.dispose()` non lo toglie: una cosa tenuta
   in cache da un modulo teneva vivi tutti i renderer chiusi, coi loro
   contesti WebGL. `segui` annota quelli appesi dal renderer mentre lavora,
   `rilascia` li toglie, butta il renderer e perde il contesto. Con un
   renderer finto: niente GPU. E la riserva dei mostri 3D che si sfoltisce
   scendendo di piano.
   ═══════════════════════════════════════════════════════════════════ */
import { BufferGeometry, MeshBasicMaterial, Group } from 'three'
import { creaMostri3d } from '../../src/giochi/sotterraneo/scena3d/mostro3d.js'
import { creaPersone3d } from '../../src/giochi/sotterraneo/scena3d/persona3d.js'
import { segui, rilascia } from '../../src/grafica/rilascio3d.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

// un renderer finto come quello di three: ogni `render` carica le cose della scena e appende il suo ascoltatore
function finto() {
  const r = { buttato: false, perso: false, contestoPerso: false }
  const libera = e => e.target.removeEventListener('dispose', libera)   // come onGeometryDispose di three
  Object.assign(r, {
    render(cose) { for (const c of cose) if (!(c._listeners && c._listeners.dispose && c._listeners.dispose.includes(libera))) c.addEventListener('dispose', libera) },
    dispose() { r.buttato = true },
    forceContextLoss() { r.perso = true },
    getContext: () => ({ isContextLost: () => r.contestoPerso }),
    libera,
  })
  return segui(r)
}
const quanti = o => (o._listeners && o._listeners.dispose ? o._listeners.dispose.length : 0)

// una geometria e un materiale tenuti da un modulo per tutta la pagina, usati da due renderer
const geo = new BufferGeometry(), mat = new MeshBasicMaterial()
const a = finto(), b = finto()
a.render([geo, mat]); a.render([geo, mat])
b.render([geo])
uguale('caricata due volte dallo stesso renderer, un ascoltatore solo', quanti(mat), 1)
uguale('la geometria ha l\'ascoltatore di tutti e due', quanti(geo), 2)
const mio = () => {}
geo.addEventListener('dispose', mio)   // uno appeso fuori da un renderer: non si tocca
rilascia(a)
uguale('chiuso il primo, la geometria tiene solo il secondo e quello di fuori', quanti(geo), 2)
controlla('e non il suo', !geo._listeners.dispose.includes(a.libera))
uguale('il materiale non lo tiene più nessuno', quanti(mat), 0)
controlla('il renderer è buttato e il contesto perso', a.buttato && a.perso)
rilascia(b)
uguale('chiuso anche il secondo, resta quello di fuori', geo._listeners.dispose.join(), String(mio))

// una cosa buttata mentre il renderer vive esce dal suo registro; un contesto già perso non si perde di nuovo
const c = finto(), g2 = new BufferGeometry()
c.render([g2])
uguale('annotata', c.__rilascio.cose.size, 1)
g2.dispose()
uguale('buttata la geometria, il registro la lascia', c.__rilascio.cose.size, 0)
c.contestoPerso = true
rilascia(c)
controlla('col contesto già perso, forceContextLoss non si chiama', c.buttato && !c.perso)

// i metodi del renderer seguito tornano quello che tornavano, e `this` resta il renderer
const d = finto()
d.conta = function () { return this === d ? 7 : 0 }
segui(d)
uguale('un metodo seguito torna il suo valore col suo this', d.conta(), 7)

// i mostri 3D di un piano che non c'è più: la riserva si sfoltisce scendendo (mostro3d.js, `sfoltisci`), con le loro geometrie e lo
// scheletro della pelle; chi è nel piano nuovo, o è ancora preso da un mostro, resta
{
  const scena = new Group(), M = creaMostri3d(scena)
  const ratto = M.idDi({ tipo: 'ratto', grado: 'comune' }), lupo = M.idDi({ tipo: 'lupo', grado: 'comune' })
  M.prepara(ratto, () => {}); M.prepara(lupo, () => {})
  const s = {}
  M.inizia(); M.metti({ tipo: 'lupo' }, s, lupo, { x: 0, z: 0, alto: 1, t: 0, dt: 0.016, trasparenza: 1, morente: 0, bianco: 0, attacco: -1 }); M.chiudi()
  uguale('due modelli in riserva, uno preso dal lupo', M.quante, 2)
  const buttate = []
  scena.traverse(o => { if (o.geometry) o.geometry.addEventListener('dispose', e => buttate.push(e.target)) })
  const quanteRatto = (() => { let n = 0; scena.children[0].traverse(o => { if (o.geometry) n++ }); return n })()
  uguale('piano nuovo senza ratti né lupi: il ratto se ne va, il lupo preso resta', M.sfoltisci(new Set()), 1)
  uguale('ne resta uno', M.quante, 1)
  controlla('le geometrie del ratto buttate', buttate.length > 0 && buttate.length <= quanteRatto, `${buttate.length} su ${quanteRatto}`)
  uguale('e la sua radice è fuori dalla scena', scena.children.length, 1)
  M.inizia(); M.chiudi()   // il lupo non è più preso
  uguale('nel piano del lupo, il lupo resta', M.sfoltisci(new Set([lupo])), 0)
}

// nel mondo di sopra (e sul prato) la riserva si sfoltisce da sé: chi non si vede da `ozio` secondi se ne va (mostri e persone)
{
  const aspetta = ms => new Promise(r => setTimeout(r, ms))
  const scena = new Group(), M = creaMostri3d(scena, { ozio: 0.02 }), P = creaPersone3d(scena, { ozio: 0.02 })
  const lupo = M.idDi({ tipo: 'lupo', grado: 'comune' }), sL = {}, sP = {}
  const passo = (conLupo, conPersona) => {
    M.inizia(); if (conLupo) M.metti({ tipo: 'lupo' }, sL, lupo, { x: 0, z: 0, alto: 1, t: 0, dt: 0.016, trasparenza: 1, morente: 0, bianco: 0, attacco: -1 }); M.chiudi()
    P.inizia(); if (conPersona) P.metti(sP, 'capitano', { x: 1, z: 0, alto: 1.6, eroe: { x: 0, z: 0 }, t: 0, dt: 0.016 }); P.chiudi()
  }
  passo(true, true)
  uguale('il lupo e il capitano in riserva', [M.quante, P.quante].join(), '1,1')
  await aspetta(40); passo(true, true)
  uguale('visti da poco, restano', [M.quante, P.quante].join(), '1,1')
  await aspetta(40); passo(false, false)
  uguale('non visti da più di ozio, se ne vanno', [M.quante, P.quante].join(), '0,0')
  uguale('e la scena è vuota', scena.children.length, 0)
}

riassunto('chiudere un renderer davvero')
