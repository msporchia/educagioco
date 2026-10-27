// L'ingresso nella misura del telefono (docs/core/vecchio-telefono-veri.md, «L'ingresso»): il fermo che le altre scene non vedono,
// perché misurano dopo il rodaggio. Da freddo (tela, renderer e scena nuovi) si entra in un piano delle discese o nel mondo di sopra
// e si guardano i primi secondi: il fotogramma più lungo, quanti sopra 100 ms, i programmi di shader al primo disegno e dopo, il
// riscaldamento (`daScaldare`, `scaldato`). Nelle discese poi tre attacchi a riscaldamento finito, o uno solo a mezzo secondo
// (prima che cominci: il caso peggiore), o lo zaino aperto subito. Ogni prova si rifà tre volte da capo: la compilazione cambia da
// un giro all'altro (e il browser tiene da parte gli shader già visti). Con `riscaldamento: false` la stessa cosa a riscaldamento spento.
import { creaSotterraneo3d } from '../../../giochi/sotterraneo/scena3d/indice.js'
import { creaMondo3d } from '../../../giochi/sotterraneo/scena3d/mondo/indice.js'
import { creaAnteprime3d } from '../../../giochi/sotterraneo/scena3d/anteprime3d.js'
import { effettoDelColpo } from '../../../giochi/sotterraneo/dati/effetti.js'
import { COSE } from '../../../giochi/sotterraneo/dati/cose.js'
import { ilMondo, mondoDaSalvato, terraDelMondo, fontaneDi } from '../../../giochi/sotterraneo/motore/mondo-sopra.js'
import { corsaDelloScontro, dprDelGioco } from './discese.js'
import { chiaviDelloZaino } from './zaino.js'
import { nuovaTela, pausa } from './tela.js'

export const LENTO = 100                       // ms: un fotogramma che si vede fermarsi
// il primo, il secondo e il terzo colpo: il colpo dell'eroe con l'arma che ha in mano (quello che il riscaldamento prevede), il mostro, di nuovo l'eroe
const attacchiDi = corsa => { const k = effettoDelColpo(corsa.mano && COSE[corsa.mano] ? COSE[corsa.mano].famiglia : null); return [k, 'mostro', k] }
const TEMPI = {
  normale: { finestra: 3000, scalda: 8000, fra: 1500, dopo: 1300, presto: 500, giri: 3 },
  corto: { finestra: 600, scalda: 1500, fra: 400, dopo: 300, presto: 200, giri: 2 },
}

// i fotogrammi di una scena col suo giro: uno prima (chiesto prima di `avvia`) e uno dopo, con la lettura di un pixel che aspetta la GPU
function registra(gl, conto) {
  let vivo = true, a = 0
  const t0 = performance.now(), px = new Uint8Array(4), f = []
  const inizio = () => { if (!vivo) return; requestAnimationFrame(inizio); a = performance.now() }
  const fine = () => {
    if (!vivo) return
    requestAnimationFrame(fine)
    if (!gl.isContextLost()) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
    const ora = performance.now()
    f.push({ t: ora - t0, l: ora - a, ...conto() })
  }
  requestAnimationFrame(inizio)
  return { f, t: () => performance.now() - t0, parti: () => requestAnimationFrame(fine), ferma: () => { vivo = false } }
}
const piuLungo = l => Math.round(Math.max(0, ...l.map(x => x.l)))
// il più dei programmi nati in un fotogramma (fra uno e il precedente): l'entrata a passi lo tiene a 1-2, il primo disegno intero ne chiedeva 26
const picco = (f, da, a) => { let m = 0; for (let i = 1; i < f.length; i++) if (f[i].t >= da && f[i].t < a) m = Math.max(m, f[i].p - f[i - 1].p); return m }
const fra = (f, da, a) => f.filter(x => x.t >= da && x.t < a)
const finche = async (cond, ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms && !cond()) await pausa(50) }

// un giro nelle discese: lo scontro con 3 mostri del cheat, e dopo l'ingresso gli attacchi (o lo zaino)
async function giroDiscesa(contenitore, s, T) {
  const tela = nuovaTela(contenitore)
  const pittore = creaSotterraneo3d(tela.canvas, { strato: tela.strato, dpr: dprDelGioco(), spegni: s.riscaldamento === false ? ['riscaldamento'] : [], cieca: 320 })
  if (!pittore) { tela.via(); throw new Error('il Sotterraneo 3D non parte') }
  const gl = tela.canvas.getContext('webgl2')
  // `e`: il piano c'è (grafica().ingresso): da lì conta, anche il fotogramma che lo costruisce (l'entrata a passi compila dopo)
  const conto = () => { const g = pittore.grafica(); return { p: g.programmi, d: g.daScaldare || 0, e: g.ingresso ? 1 : 0 } }
  const r = registra(gl, conto)
  let anteprime = null
  try {
    const corsa = corsaDelloScontro(3), ATTACCHI = attacchiDi(corsa)
    pittore.misura(); pittore.mostra({ corsa, orologio: 0, fx: null }); pittore.avvia(); r.parti()
    // il tempo conta dal fotogramma che costruisce il piano (prima la scena aspetta l'atlante): col riscaldamento spento è anche quello
    // che compila tutto e disegna; acceso, i programmi vengono dopo, uno per fotogramma
    await finche(() => r.f.some(x => x.e || x.p > 0), 10000)
    const d0 = r.f.find(x => x.e || x.p > 0), t0 = d0 ? d0.t - 1 : 0   // la fine di quel fotogramma (lui compreso)
    const esito = {}
    if (s.presto) {
      // il colpo a mezzo secondo, prima del riscaldamento (comincia a un secondo): si riprova finché lo scontro non è in scena
      await finche(() => r.t() >= t0 + T.presto, T.presto + 100)
      let p0 = conto().p, da = r.t()
      await finche(() => { const ok = pittore.prova(ATTACCHI[0], 0); if (!ok) { p0 = conto().p; da = r.t() } return ok }, 2000)
      await pausa(T.dopo)
      const dopo = fra(r.f, da, r.t())
      esito.att = [piuLungo(dopo)]; esito.sh = [Math.max(0, conto().p - p0)]
    }
    if (s.zaino) {
      // lo zaino aperto appena entrati: quindici anteprime chieste tutte insieme
      await finche(() => r.t() >= t0 + 200, 300)
      anteprime = creaAnteprime3d()
      for (const k of chiaviDelloZaino(15)) anteprime.chiedi(k)
    }
    await finche(() => r.t() >= t0 + T.finestra, T.finestra + 200)
    const primi = fra(r.f, t0, t0 + T.finestra)
    Object.assign(esito, { max: piuLungo(primi), lenti: primi.filter(x => x.l > LENTO).length, p1: d0 ? d0.p : 0, p3: conto().p, picco: picco(r.f, t0, t0 + T.finestra),
                           daScaldare: Math.max(0, ...r.f.map(x => x.d)) })
    if (!s.presto && !s.zaino) {
      // il riscaldamento finito (o il tetto), poi tre colpi uno dopo l'altro: il fotogramma più lungo dopo ognuno e gli shader nuovi
      await finche(() => r.t() > t0 + 1500 && conto().d === 0, T.scalda)
      const fatto = r.f.find(x => x.t > t0 + 1000 && x.d === 0 && r.f.some(y => y.d > 0 && y.t < x.t))
      esito.scaldato = fatto ? Math.round(fatto.t - t0) : null
      esito.att = []; esito.sh = []
      for (const chiave of ATTACCHI) {
        const p0 = conto().p, da = r.t()
        try { pittore.prova(chiave, 0) } catch (e) { /* un effetto che non c'è */ }
        await pausa(T.dopo)
        esito.att.push(piuLungo(fra(r.f, da, r.t()))); esito.sh.push(Math.max(0, conto().p - p0))
        await pausa(Math.max(0, T.fra - T.dopo))
      }
    }
    return esito
  } finally {
    r.ferma()
    if (anteprime) anteprime.via()
    try { pittore.distruggi() } finally { tela.via() }
  }
}

// un giro nel mondo di sopra: il mondo vero della prima terra, dalla partenza, senza persone né mostri (quelli li mette chi gioca)
async function giroMondo(contenitore, s, T) {
  const tela = nuovaTela(contenitore)
  const m = ilMondo({ terra: 1 })
  const salvato = mondoDaSalvato(m, null, [])
  const v = m.villaggio
  for (let y = v.y; y < v.y + v.h; y++) for (let x = v.x; x < v.x + v.w; x++) salvato.nebbia[y * m.W + x] = 1
  const fontane = fontaneDi(m, terraDelMondo(m))
  const scena = creaMondo3d(tela.canvas, { m, nebbia: salvato.nebbia, fontane, strato: tela.strato, dpr: dprDelGioco(), da: { x: m.partenza.x, y: m.partenza.y },
                                           spegni: s.riscaldamento === false ? ['riscaldamento'] : [], passo: () => {}, dopo: () => {} })
  if (!scena) { tela.via(); throw new Error('il mondo 3D non parte') }
  const gl = tela.canvas.getContext('webgl2')
  const conto = () => { const g = scena.grafica(); return { p: g.programmi, d: g.scaldato ? 0 : 1 } }
  const r = registra(gl, conto)
  try {
    scena.avvia(); r.parti()
    // dal primo disegno; il mondo costruisce i pezzi uno per fotogramma: una finestra più lunga
    await finche(() => r.f.some(x => x.p > 0), 10000)
    const disegnato = r.f.find(x => x.p > 0), t0 = disegnato ? disegnato.t - 1 : 0
    await finche(() => r.t() >= t0 + T.finestra + 1000, T.finestra + 1200)
    const primi = fra(r.f, t0, t0 + T.finestra + 1000)
    return { max: piuLungo(primi), lenti: primi.filter(x => x.l > LENTO).length, p1: disegnato ? disegnato.p : 0, p3: conto().p, picco: picco(r.f, t0, t0 + T.finestra + 1000),
             scaldato: scena.grafica().scaldato ? 1 : 0 }
  } finally {
    r.ferma()
    try { scena.distruggi ? scena.distruggi() : scena.via && scena.via() } finally { tela.via() }
  }
}

/** Le scene: { ingresso: 'discesa' | 'mondo', presto, zaino, riscaldamento }. Ogni giro è da capo; si tengono i valori di ognuno. */
export async function prepara({ contenitore, corto, opz = {} }) {
  const T = { ...(corto ? TEMPI.corto : TEMPI.normale), ...(opz.giri ? { giri: opz.giri } : {}) }   // `opz.giri`: la verifica compatta ne fa uno solo
  return {
    async misura(s) {
      const giri = []
      for (let i = 0; i < T.giri; i++) {
        giri.push(await (s.ingresso === 'mondo' ? giroMondo : giroDiscesa)(contenitore, s, T))
        await pausa(corto ? 50 : 600)
      }
      const di = k => giri.map(g => g[k] ?? null)
      return { tipo: 'ingresso', giri: giri.length, max: di('max'), lenti: di('lenti'), p1: di('p1'), p3: di('p3'), picco: di('picco'), daScaldare: di('daScaldare'),
               scaldato: di('scaldato'), att: giri.every(g => g.att) ? giri.map(g => g.att) : null, sh: giri.every(g => g.sh) ? giri.map(g => g.sh) : null }
    },
    via() {},
  }
}
