// Il sotterraneo vero nella misura del telefono (docs/core/vecchio-telefono-veri.md): la scena delle discese di scena3d/indice.js
// (luci, nebbia, ombra del cono, palco, mostri ed eroe 3D, effetti) su una discesa vera del motore, col cheat dello scontro rifatto
// qui (`sotterraneo=branco&mostri=N&grado=leggendario&corredo=leggendario&stanza=sala`). Ogni scena dice quanti mostri e se partono
// gli attacchi, o che l'eroe passeggia da una stanza all'altra.
import { creaSotterraneo3d } from '../../../giochi/sotterraneo/scena3d/indice.js'
import { DPR } from '../../../giochi/sotterraneo/scena3d/costanti.js'
import { Corsa } from '../../../giochi/sotterraneo/motore/corsa.js'
import { CAMPAGNA } from '../../../giochi/sotterraneo/dati/campagna.js'
import { MOSTRI } from '../../../giochi/sotterraneo/dati/mostri.js'
import { profilo } from '../../../store/qualita.js'
import { vestiLeggendario } from './leggendario.js'
import { nuovaTela, finche } from './tela.js'

// specie diverse, tutte col modello 3D; il grado leggendario porta armi e aloni
const TIPI = ['scheletro', 'goblin', 'orco', 'lupo', 'ragno', 'zombie', 'troll', 'diavoletto'].filter(t => MOSTRI[t])
// gli effetti a ripetizione: le abilità dell'eroe (dati/effetti.js) e, a colpi alterni, l'attacco di un mostro
const COLPI = ['palla', 'fulmine', 'spazzata', 'meteora', 'catena', 'esplode', 'nevicata', 'fiammata']
const OGNI = 700   // ms fra un colpo e l'altro
const SEME = 11

/** Il pixel ratio del Sotterraneo su questo telefono (quello che il gioco darebbe, fermo). */
export const dprDelGioco = () => Math.min(window.devicePixelRatio || 1, DPR.max, profilo('sotterraneo').dprMax)

// la discesa del cheat: la sala (o la stanza più grande), l'eroe nel punto più lontano dai mostri, N mostri attorno e lo scontro aperto
export function corsaDelloScontro(n) {
  const c = new Corsa(CAMPAGNA[1], { seme: SEME, eroe: 'cavaliere', botti: true, copricapi: true })
  vestiLeggendario(c)
  const liv = c.livello
  const s = liv.stanze.find(r => r.forma === 'sala') || liv.stanze.reduce((a, b) => (b.suolo.length > a.suolo.length ? b : a), liv.stanze[0])
  const mostri = liv.robe.filter(r => r.che === 'mostro')
  const lontano = r => mostri.reduce((m, o) => Math.min(m, Math.hypot(o.x - r.x, o.y - r.y)), 99)
  const dove = s.suolo.reduce((b, r) => (lontano(r) > lontano(b) ? r : b), s.suolo[0])
  c.eroe = { x: dove.x + 0.5, y: dove.y + 0.5 }
  c.segnaLaStanza(); c.aggiornaLuce()
  const ex = Math.floor(c.eroe.x), ey = Math.floor(c.eroe.y), stanza = liv.stanzaDi(ex, ey), libere = []
  for (let y = ey - 4; y <= ey + 4; y++) for (let x = ex - 4; x <= ex + 4; x++) {
    if ((x === ex && y === ey) || !liv.calpestabile(x, y) || liv.robeSu(x, y).length) continue
    if (liv.stanzaDi(x, y) !== stanza || Math.hypot(x + 0.5 - c.eroe.x, y + 0.5 - c.eroe.y) > 4.4) continue
    libere.push({ x, y, d: Math.hypot(x - ex, y - ey) })
  }
  libere.sort((a, b) => (a.d - b.d) || (b.x - a.x))
  const fatti = libere.slice(0, n).map(({ x, y }, k) => liv.mostro(TIPI[k % TIPI.length], x, y, { grado: 'leggendario' }))
  if (!fatti.length) throw new Error('nessun posto per i mostri')
  liv.robe.push(...fatti)
  fatti.forEach(m => { m.sveglio = true })
  c.scontro(fatti[0])
  return c
}

// la passeggiata in un piano (gli fps veri): la stessa discesa senza mostri, l'eroe dal centro di una stanza a quello della prossima
export function corsaDellaPasseggiata() {
  const c = new Corsa(CAMPAGNA[1], { seme: SEME, eroe: 'cavaliere', botti: true, copricapi: true })
  vestiLeggendario(c)
  const liv = c.livello
  liv.robe = liv.robe.filter(r => r.che !== 'mostro')
  return c
}
// la prossima stanza: vaiVerso trova la strada, e se non c'è si prova quella dopo
function avanti(corsa, k) {
  const st = corsa.livello.stanze
  for (let i = 1; i <= st.length; i++) {
    const s = st[(k + i) % st.length]
    corsa.vaiVerso({ x: s.cx, y: s.cy }, false)
    if (corsa.strada && corsa.strada.length) return (k + i) % st.length
  }
  return k
}

/**
 * `opz`: { dpr (null: quello del gioco), spegni (pezzi di ACCESI, come `&spegni=`), riaccendi (come `&riaccendi=`: i pezzi che la fascia spegne e qui tornano) }.
 * Le scene: { mostri, colpi, passeggia }. → la famiglia per veri.js: { gl, conti, avvia, scena(s), passo, via, dpr }.
 */
export async function prepara({ contenitore, opz = {} }) {
  const tela = nuovaTela(contenitore)
  const dpr = opz.dpr || dprDelGioco()
  const pittore = creaSotterraneo3d(tela.canvas, { strato: tela.strato, dpr, spegni: opz.spegni || [], riaccendi: opz.riaccendi || [], cieca: 320 })
  if (!pittore) { tela.via(); throw new Error('il sotterraneo non parte (WebGL 2?)') }
  const gl = tela.canvas.getContext('webgl2')
  let corsa = null, quanti = -1, colpi = null, k = 0, passeggia = false, stanza = 0
  const togliColpi = () => { clearInterval(colpi); colpi = null }
  return {
    dpr,
    gl: () => gl,
    tela: tela.canvas,
    avvia: () => pittore.avvia(),
    conti() {
      const g = pittore.grafica()
      return { ch: g.chiamate, tri: g.triangoli, programmi: g.programmi, geo: g.memoria.geometries, tex: g.memoria.textures, mostri3d: g.mostri3d, agg: g.msJs, dis: g.msDisegno }
    },
    scena3d: () => pittore.scena,
    // la passeggiata: il motore muove l'eroe (come il giro di Gioco.vue) e arrivato riparte verso la stanza dopo
    passo(t, dt) {
      if (!passeggia || !corsa) return
      corsa.passo(dt)
      if (!corsa.strada || !corsa.strada.length) stanza = avanti(corsa, stanza)
      pittore.mostra({ corsa, orologio: t, fx: null })
    },
    async scena(s) {
      togliColpi()
      passeggia = !!s.passeggia
      if (passeggia) {
        corsa = corsaDellaPasseggiata(); quanti = -1; stanza = avanti(corsa, 0)
        pittore.misura()
        pittore.mostra({ corsa, orologio: 0, fx: null })
        await finche(() => pittore.grafica().ingresso && !pittore.grafica().entrando, 8000)
      } else if (s.mostri !== quanti || !corsa) {
        corsa = corsaDelloScontro(s.mostri); quanti = s.mostri
        pittore.misura()
        pittore.mostra({ corsa, orologio: 0, fx: null })
        await finche(() => pittore.grafica().mostri3d >= Math.min(s.mostri, 12) && pittore.palco, 8000)
      }
      if (s.colpi) {
        colpi = setInterval(() => {
          const i = k % quanti, chiave = k % 2 ? 'mostro' : COLPI[(k >> 1) % COLPI.length]
          try { pittore.prova(chiave, i) } catch (e) { /* un effetto che non c'è: il racconto fa da sé */ }
          k++
        }, OGNI)
      }
    },
    via() { togliColpi(); try { pittore.distruggi() } finally { tela.via() } },
  }
}
