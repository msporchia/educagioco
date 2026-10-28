// Il mondo di sopra vero negli fps veri (docs/core/vecchio-telefono-veri.md, «Gli fps veri»): la scena di scena3d/mondo/indice.js sul
// mondo della prima terra, con la fascia del telefono. Due scene: l'eroe che gira per il villaggio con le sue persone (scopre attorno a
// sé come camminando), e lo scontro sul prato davanti alla tana di un luogo, aperto come lo apre il gioco (motore/aperta.js e il palco di
// sopra, scena3d/mondo/palco.js) coi colpi a ripetizione. I mostri che girano fuori dallo scontro qui non ci sono.
import { creaMondo3d } from '../../../giochi/sotterraneo/scena3d/mondo/indice.js'
import { ilMondo, mondoDaSalvato, terraDelMondo, fontaneDi, VISTA_MONDO, PASSO_MONDO } from '../../../giochi/sotterraneo/motore/mondo-sopra.js'
import { zonaDi } from '../../../giochi/sotterraneo/motore/mondo-percorso.js'
import { popolaMondo, apriLoScontro } from '../../../giochi/sotterraneo/motore/aperta.js'
import { PERSONAGGI_DI_SOPRA } from '../../../giochi/sotterraneo/dati/missioni.js'
import { dprDelGioco } from './discese.js'
import { nuovaTela, finche } from './tela.js'

const COLPI = ['palla', 'fulmine', 'spazzata', 'meteora', 'mostro']
const OGNI = 700
const MOSTRI_PRATO = 3

// le persone del villaggio come le mette Mondo3d.vue (preparaBersagli): il modello è quello dello sprite, il capitano ha il suo
function personeDi(m) {
  const l = []
  for (const p of [...m.persone, ...m.villaggio.persone]) {
    const d = PERSONAGGI_DI_SOPRA[p.chiave]
    if (!d) continue
    l.push({ chiave: `personaggio::${p.chiave}`, modello: p.chiave === 'capitano' ? 'capitano' : d.sprite, pezzo: `${d.sprite}-fermo-0`, fermo: `${d.sprite}-fermo-0`,
             saluto: `${d.sprite}-saluta-0`, x: p.piede.x + 0.5, z: p.piede.y + 0.5, specchio: false, scala: d.scala || null, tinta: d.tinta || null, saluta: false })
  }
  return l
}

/** Le scene: { dove: 'villaggio' | 'prato' }; `opz.antialias: false` il mondo senza antialias. */
export async function prepara({ contenitore, opz = {} }) {
  const tela = nuovaTela(contenitore)
  const m = ilMondo({ terra: 1 }), terra = terraDelMondo(m)
  const salvato = mondoDaSalvato(m, null, [])
  const v = m.villaggio, centro = { x: v.x + v.w / 2, z: v.y + v.h / 2 }, raggio = Math.max(2, Math.min(v.w, v.h) / 2 - 1.5)
  let dove = null, ang = 0, colpi = null, k = 0
  // il giro del villaggio: un cerchio attorno alla piazza alla velocità del gioco, scoprendo attorno come camminando
  const passo = dt => {
    if (dove !== 'villaggio' || !scena) return
    ang += dt * PASSO_MONDO / raggio
    const io = scena.S.io
    io.x = centro.x + Math.cos(ang) * raggio; io.z = centro.z + Math.sin(ang) * raggio
    io.verso = { dx: -Math.sin(ang), dy: Math.cos(ang) }
    scena.S.inCammino = true
    scena.scopri(io.x, io.z, VISTA_MONDO)
  }
  const scena = creaMondo3d(tela.canvas, { m, nebbia: salvato.nebbia, fontane: fontaneDi(m, terra), strato: tela.strato, dpr: dprDelGioco(), antialias: opz.antialias,
                                           da: { x: Math.floor(centro.x), y: Math.floor(centro.z) }, passo, dopo: () => {} })
  if (!scena) { tela.via(); throw new Error('il mondo 3D non parte (WebGL 2?)') }
  scena.S.persone = personeDi(m)
  const gl = tela.canvas.getContext('webgl2')
  const togliColpi = () => { clearInterval(colpi); colpi = null }
  const zonaPronta = io => { const z = zonaDi(m, Math.floor(io.x), Math.floor(io.z)); return z < 0 || !!m.zonaCaricata[z] }

  return {
    dpr: dprDelGioco(),
    gl: () => gl,
    tela: tela.canvas,
    avvia: () => scena.avvia(),
    scena3d: () => scena.scena,
    conti() {
      const g = scena.grafica()
      return { ch: g.chiamate, tri: g.triangoli, programmi: g.programmi, geo: g.memoria.geometries, tex: g.memoria.textures, agg: g.msJs, dis: g.msDisegno }
    },
    async scena(s) {
      togliColpi()
      dove = s.dove
      await finche(() => scena.pronto, 15000)
      if (dove !== 'prato') return
      // davanti alla tana del primo luogo che ne ha una: la zona si carica, lo stato dei mostri nasce, e il branco più vicino apre lo scontro
      const R = m.regioni.find(q => q.tana && q.chiave !== 'villaggio')
      if (!R) throw new Error('nessuna tana nel mondo')
      const io = scena.S.io
      io.x = R.tana.x + 0.5; io.z = R.tana.y + 5; scena.S.inCammino = false
      scena.scopri(io.x, io.z, VISTA_MONDO)
      await finche(() => zonaPronta(io) && scena.palcoSopra, 15000)
      if (!scena.palcoSopra) throw new Error('il palco di sopra non c\'è')
      const stato = popolaMondo({ mondo: m, eroe: 'cavaliere', giro: 1 })
      const vivi = stato.lista.filter(q => !q.morto)
      if (!vivi.length) throw new Error('nessun mostro attorno alla tana')
      const lontano = q => Math.hypot(q.fx - io.x, q.fy - io.z)
      const chi = vivi.reduce((a, b) => (lontano(b) < lontano(a) ? b : a))
      const campo = vivi.filter(q => q.zona === chi.zona).sort((a, b) => Math.hypot(a.fx - chi.fx, a.fy - chi.fy) - Math.hypot(b.fx - chi.fx, b.fy - chi.fy))
        .slice(0, MOSTRI_PRATO).map(q => q.i)
      const corsa = apriLoScontro(stato, { chi: chi.i, campo }, { eroe: 'cavaliere', copricapi: true })
      scena.palcoSopra.apri({ io, passa: (x, y) => terra.passa(x, y), daDove: i => ({ x: stato.mostri[i].fx, z: stato.mostri[i].fy }), corsa })
      scena.palcoSopra.pittore.mostra({ corsa, orologio: 0, fx: null })
      colpi = setInterval(() => {
        try { scena.palcoSopra.pittore.prova(COLPI[k % COLPI.length], k % campo.length) } catch (e) { /* un effetto che non c'è */ }
        k++
      }, OGNI)
    },
    via() {
      togliColpi()
      try { if (scena.palcoSopra) scena.palcoSopra.chiudi(); scena.distruggi ? scena.distruggi() : scena.via && scena.via() } finally { tela.via() }
    },
  }
}
