// Le botti da rompere (docs/sotterraneo/paesaggi-3d.md, «Le botti»): una regola del motore SPENTA di difetto (`Corsa.botti`), accesa
// solo dal Sotterraneo 3D; il 2D e il banco non ne hanno, quindi le misure d'equilibrio restano identiche (come `ricomparsa`). Dove
// stanno lo decide il seme della discesa e il piano (puro: `postiDelleBotti`); non sono roba del piano, non bloccano niente e non
// cambiano il generatore. Una botte rotta lascia nel piano un segno già preso (`{ che: 'botte', botte: i, presa: true }`): la
// sosta lo salva da sé con le cose nuove del piano (motore/sosta.js), e rientrando la botte è ancora rotta. Una su cinque lascia
// qualcosa di piccolo (dati/botti.js), per terra come il bottino dei mostri. Metodi di Corsa (`Object.assign` in fondo a corsa.js).
import { percorso } from '../../../motore/passi.js'
import { ROCCIA } from '../dati/mondo.js'
import { BOTTI_PER_PAESAGGIO, PREMI_DELLE_BOTTI } from '../dati/botti.js'
import { paesaggioDi } from '../dati/paesaggi.js'
import { tiroDalSeme } from './bottino.js'
import { ipot } from '../../../motore/conti-uguali.js'   // uguali al bit sui due telefoni (docs/sotterraneo/in-due.md)

// un caso col seme (lo stesso di scena3d/rumore.js), per non toccare quello della discesa
function caso(seme) {
  let a = seme >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SALE = 4111   // distingue i tiri delle botti dagli altri tiri dal seme

// Le botti di un piano. Solo alcune stanze (o, nella grotta, una sola); mai nei corridoi (solo nel suolo delle stanze), mai a meno
// di tre passi da porte, scale, fonte, portale, mai sulla roba né sulla strada fra due di queste cose (il percorso obbligato),
// sempre contro un muro, a gruppetti da 1 a 4 (un magazzino ne ha di più). Lo stesso seme, le stesse botti
export function postiDelleBotti(liv, regola, seme) {
  if (!regola) return []
  const r = caso(seme * 31 + 5)
  const W = liv.largo, id = (x, y) => y * W + x
  const roccia = (x, y) => x < 0 || y < 0 || x >= W || y >= liv.alto || liv.a(x, y) === ROCCIA
  const robe = liv.robe || [], stanze = liv.stanze || []
  const occupate = new Set(robe.map(q => id(q.x, q.y)))
  const passaggi = robe.filter(q => ['porta', 'scala', 'scala-su', 'fonte', 'portale'].includes(q.che))
  for (const s of stanze) for (const p of s.porte || []) passaggi.push(p)
  const lontana = (x, y) => passaggi.every(p => Math.abs(p.x - x) + Math.abs(p.y - y) >= 3)
  const controMuro = (x, y) => roccia(x, y - 1) || roccia(x - 1, y) || roccia(x + 1, y) || roccia(x, y + 1)
  const posti = []
  const scelte = []
  if (regola.accampamento) { if (stanze.length && r() < regola.accampamento) scelte.push(stanze[Math.floor(r() * stanze.length)]) }
  else for (const s of stanze) if (r() < regola.stanze) scelte.push(s)
  for (const s of scelte) {
    const suolo = new Set((s.suolo || []).map(c => id(c.x, c.y)))
    const varchi = passaggi.filter(p => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => suolo.has(id(p.x + dx, p.y + dy))))
    const strada = new Set()
    for (let i = 0; i < varchi.length; i++) for (let j = i + 1; j < varchi.length; j++)
      for (const c of percorso((x, y) => liv.calpestabile(x, y), varchi[i], varchi[j]) || []) strada.add(id(c.x, c.y))
    const libera = (x, y) => suolo.has(id(x, y)) && liv.calpestabile(x, y) && !occupate.has(id(x, y)) && !strada.has(id(x, y)) && lontana(x, y) && controMuro(x, y)
    const gruppi = r() < (regola.magazzino || 0) ? 3 + Math.floor(r() * 2) : 1
    for (let g = 0; g < gruppi; g++) {
      for (let prova = 0; prova < 24; prova++) {
        const c = s.suolo[Math.floor(r() * s.suolo.length)]
        if (!c || !libera(c.x, c.y)) continue
        const quante = 1 + Math.floor(r() * 4)
        const celle = [[c.x, c.y], [c.x + 1, c.y], [c.x - 1, c.y], [c.x, c.y + 1], [c.x, c.y - 1]].filter(([a, b]) => libera(a, b)).slice(0, quante)
        for (const [a, b] of celle) {
          occupate.add(id(a, b))
          posti.push({ x: a, y: b, fx: a + 0.5 + (r() - 0.5) * 0.18, fy: b + 0.45 + (r() - 0.5) * 0.12, giro: r() * 6, scala: 0.92 + r() * 0.16, stanza: s.id })
        }
        break
      }
    }
  }
  return posti
}

// cosa lascia la botte `i` del piano (null quasi sempre): una su `ogni`, poi a caso fra i premi, sempre dal seme
export function premioDellaBotte(seme, piano, i, tabella = PREMI_DELLE_BOTTI) {
  if (tiroDalSeme(SALE, seme, piano, i) >= 1 / tabella.ogni) return null
  const tot = tabella.premi.reduce((s, p) => s + p.peso, 0)
  let u = tiroDalSeme(SALE + 1, seme, piano, i) * tot
  const p = tabella.premi.find(q => (u -= q.peso) < 0) || tabella.premi[0]
  if (p.che === 'gemme') return { che: 'gemme', quante: p.quante[0] + Math.floor(tiroDalSeme(SALE + 2, seme, piano, i) * (p.quante[1] - p.quante[0] + 1)) }
  return { che: 'cosa', cosa: p.cosa }
}

export const MetodiDelleBotti = {
  // le botti del piano di adesso (spenta la regola: nessuna), fatte una volta per piano; quelle col segno nel piano sono rotte
  bottiQui() {
    if (!this.botti || !this.livello) return []
    const liv = this.livello
    if (!liv._botti) {
      const posti = postiDelleBotti(liv, BOTTI_PER_PAESAGGIO[paesaggioDi(this)], (this.seme || 0) * 131 + this.piano * 17 + 3)
      const rotte = new Set(liv.robe.filter(q => q.che === 'botte').map(q => q.botte))
      liv._botti = posti.map((p, i) => ({ ...p, i, rotta: rotte.has(i) }))
    }
    return liv._botti
  },
  // l'eroe rompe la botte `i`, se ce l'ha accanto e se è intera. Lascia il segno nel piano e, una volta su cinque, qualcosa di
  // piccolo per terra. Niente altro: non conta come mostro, tesoro o passo, non tocca vita, energia né esperienza
  rompiBotte(i) {
    const b = this.bottiQui()[i]
    if (!b || b.rotta || this.foglio || this.finita) return null
    if (ipot(b.fx - this.eroe.x, b.fy - this.eroe.y) > 1.9) return null
    b.rotta = true
    this.livello.robe.push({ che: 'botte', x: b.x, y: b.y, botte: i, presa: true })
    const premio = premioDellaBotte(this.seme || 0, this.piano, i)
    if (premio && premio.che === 'gemme') this.posaRoba({ che: 'gemme', em: '💎', quante: premio.quante }, { x: b.x, y: b.y })
    else if (premio) this.posaPezzo(premio.cosa, { x: b.x, y: b.y })
    return { premio }
  },
}
