// La roba del piano in 3D, a ogni fotogramma: per ogni cosa del motore (corsa.livello.robe) la sua figura dell'atlante, scelta
// come la sceglie il 2D (dati/tessere.js `PEZZO_DI`, dati/fotogrammi.js, dati/grossi.js), il chiarore per terra di chi lo
// chiede e i segni scritti sopra. Si vede quello che il motore dice (`luceDi`): nel ricordo la roba ferma, mai i mostri.
// I mostri hanno uno stato di disegno (dove stanno smussati, il lampo del colpo, lo scatto, la caduta), che il palco muove.
import { Color } from 'three'
import { PEZZI } from '../dati/atlante.js'
import { SCENARI, SCENARIO, PEZZO_DI } from '../dati/tessere.js'
import { BERSAGLIO, PORTA, PAVIMENTO } from '../dati/mondo.js'
import { MOSTRI } from '../dati/mostri.js'
import { COSE } from '../dati/cose.js'
import { MANI } from '../dati/varianti.js'
import { GROSSI, figuraDelGrosso, spriteDelGrosso } from '../dati/grossi.js'
import { fotogrammaDi, quantiFotogrammi } from '../dati/fotogrammi.js'
import { fattoreDelMostro } from '../viste/campo.js'
import { versoDellaPorta } from '../scena/muri.js'
import { SCALA_SU } from '../scena/scala-su.js'
import { posaDi } from './pianta.js'
import { esc, barretta } from './etichette.js'
import { PIXEL_CELLA, ALLUNGA } from './costanti.js'
import { verso } from './tempo.js'

// i colori pronti una volta: a ogni fotogramma non si legge una stringa
const AURA = { magico: new Color('#6f8dff'), raro: new Color('#ffd23f'), leggendario: new Color('#ff9a2e') }
const ROSSO = new Color('#e0644f'), ORO = new Color('#f0c24a'), CHIARO = new Color('#ffe2a0'), CALDO = new Color('#ffd278')
const ROSA = new Color(BERSAGLIO.colore)
const TINTE_GROSSI = Object.fromEntries(Object.entries(GROSSI).map(([k, g]) => [k, new Color(g.tinta || '#e0644f')]))
// le cose che si toccano: come `toccabile` del motore, ma basta averle viste (ci si va anche al buio); i mostri solo nella luce
export const DA_TOCCARE = ['porta', 'forziere', 'curiosita', 'fonte', 'scala', 'scala-su', 'cosa', 'gemme', 'portale', 'mostro']

// `apre(r)`: una porta o un forziere si è appena aperto (lo dice il motore): chi chiama ci mette le scintille
export function creaCose({ figure, aloni, colonne, etichette, camera, apre = null }) {
  const stati = new WeakMap()
  const punto = { x: 0, y: 0 }
  const stato = r => {
    let s = stati.get(r)
    if (!s) { s = { x: r.fx ?? r.x + 0.5, z: r.fy ?? r.y + 0.5, t: Math.random(), flash: 0, assalto: null, morente: 0, meta: null, alto: 1, specchio: false }; stati.set(r, s) }
    return s
  }
  // un segno scritto sopra (x, z) a quota `alto` (in celle), spostato di `dy` px
  const sopra = (x, alto, z, chiave, html, attr, dy = 0) => {
    camera.schermo(x, alto, z, punto)
    etichette.metti(punto.x, punto.y + dy, chiave, html, attr)
  }

  function mostro(r, s, t, luce, inCampo, fx) {
    const scheda = MOSTRI[r.tipo] || {}
    const morto = inCampo >= 0 && fx && fx.attivo ? !!fx.morti[inCampo] : r.morto
    let nome, scala = 1
    if (r.grosso) {
      const F = figuraDelGrosso(r.grosso)
      if (!F) return
      nome = spriteDelGrosso(F, inCampo >= 0 ? 'scontro' : r.sveglio, (t * 8) | 0)
      scala = F.k * (1 + 0.035 * Math.sin(t * (r.sveglio ? 5 : 2.2)))
      s.dipinto = F.dipinto
    } else {
      const passi = !scheda.unaPosa && quantiFotogrammi(scheda.sprite, 'corsa') > 0
      const corre = s.corre && passi
      const posa = corre || (passi && (r.sveglio || scheda.fermoDaiPassi) && inCampo < 0) ? 'corsa' : 'fermo'
      // i fotogrammi al secondo del 2D (scena/tela.js): 8 da sveglio o di corsa, 1,5 i passi di chi dorme, 4 il respiro. `s.t` è in
      // secondi: prima cresceva di 6 al secondo e qui si moltiplicava ancora, e i mostri giravano 48 pose al secondo
      const fr = (s.t * (corre || r.sveglio ? 8 : posa === 'corsa' ? 1.5 : 4)) | 0
      nome = fotogrammaDi(scheda.sprite, posa, inCampo >= 0 && passi && !corre ? 0 : fr)
      const p = PEZZI[nome]
      scala = (r.missione ? BERSAGLIO.scala : 1) * fattoreDelMostro(r.tipo, p ? p[3] : 16, p ? p[2] : 0)
    }
    // chi cade ha i suoi pezzi a terra (uno o due, docs/core/creature.md), chi non li ha svanisce in piedi
    let trasparenza = 1
    if (morto) {
      s.morente += s.dtScena
      const resti = !r.grosso && [0, 1].map(i => `${scheda.sprite}-morto-${i}`).filter(n => PEZZI[n])
      if (resti && resti.length) nome = resti[s.morente > 0.3 && resti[1] ? 1 : 0]
      trasparenza = Math.max(0, 1 - Math.max(0, s.morente - 1.1) / 0.8)
      if (trasparenza <= 0) return
    }
    const x = s.x + (s.dx || 0) + (s.flash > 0 ? (Math.random() - 0.5) * 0.08 : 0), z = s.z + (s.dz || 0) + 0.1
    const specchio = s.specchio
    const o = figure.o()
    o.scala = scala; o.specchio = specchio; o.bianco = s.flash * 2.5; o.trasparenza = trasparenza; o.cosa = morto ? null : r
    figure.metti(nome, x, 0, z, o)
    s.nome = nome   // per le prove: lo sprite di adesso
    s.alto = figure.alto(nome, scala)
    // l'arma in pugno di una variante (dati/varianti.js, `MANI`): sulla sua mano, in proporzione
    const mano = MANI[r.tipo], corpo = PEZZI[nome], arma = r.arma && PEZZI[r.arma]
    if (mano && corpo && arma && !morto) {
      const k = mano.k * corpo[3] / arma[3], lato = specchio ? -1 : 1
      const ax = x + (mano.x - 0.5) * corpo[2] * lato / PIXEL_CELLA * scala
      const ay = ((1 - mano.y) * corpo[3] - 0.32 * arma[3] * k) / PIXEL_CELLA * ALLUNGA * scala
      o.scala = scala * k; o.cosa = null
      figure.metti(r.arma, ax, Math.max(0, ay), z + 0.02, o)
    }
    if (morto || inCampo >= 0) return
    // i chiarori: chi conta (un capo, la chiave, una missione) ha l'alone rosso; il grado il suo colore; il bersaglio il rosa
    if (scheda.capo || r.chiave || r.missione) aloni.metti(x, z - 0.1, 0.55 * scala, ROSSO, r.sveglio ? 0.45 + 0.2 * Math.sin(t * 7) : 0.25)
    if (r.grado && AURA[r.grado]) aloni.metti(x, z - 0.1, 0.6 * scala, AURA[r.grado], 0.45 + 0.15 * Math.sin(t * 3 + x))
    if (r.missione) aloni.metti(x, z - 0.1, 1.05 * scala, ROSA, 0.4 + 0.25 * Math.sin(t * 2.2))
    if (r.grosso) aloni.metti(x, z, 1.1 * scala, TINTE_GROSSI[r.grosso] || ROSSO, r.sveglio ? 0.5 : 0.3)
    if (r.caporale) aloni.metti(x, z - 0.1, 0.5, ORO, 0.5)
    // i segni sopra la testa
    const corona = r.missione || (r.grosso && !s.dipinto)
    const nomeSopra = (r.missione || r.grosso) && luce === 2 ? r.nome : ''
    const q = r.ossa < r.ossaMax ? Math.max(0, r.ossa / r.ossaMax) : -1
    const chiave = `m|${corona ? 1 : 0}|${nomeSopra}|${r.sveglio ? 1 : 0}|${r.caporale ? 1 : 0}|${q < 0 ? '' : Math.round(q * 20)}`
    if (corona || nomeSopra || !r.sveglio || r.caporale || q >= 0) {
      sopra(x, s.alto + 0.05, z, chiave, () =>
        (nomeSopra ? `<b class="sot3d-nome">${esc(nomeSopra)}</b>` : '') + (corona ? '<span class="em">👑</span>' : '') +
        (r.caporale ? '<i class="sot3d-galloni"></i>' : '') + (!r.sveglio ? '<span class="em sot3d-sonno">💤</span>' : '') +
        (q >= 0 ? barretta(q) : ''), { mostro: r.tipo, sveglio: r.sveglio ? '1' : '0' })
    }
  }

  function roba(r, t, sc, corsa, luce) {
    const liv = corsa.livello
    if (r.che === 'porta' || r.che === 'forziere') {
      const s = stato(r), aperta = !!(r.aperta || r.aperto)
      if (s.aperta === false && aperta && apre) apre(r)
      s.aperta = aperta
    }
    let nome = null, x = r.x + 0.5, z = r.y + 0.5, y = 0, scala = 1
    if (r.che === 'arredo') {
      nome = r.pezzo
      const posa = posaDi(r.pezzo)
      if (posa === 'appeso') { z = r.y + 0.06; y = 0.16 } else if (posa === 'contro') z = r.y + 0.22
    } else if (r.che === 'scala-su') {
      nome = SCALA_SU
      aloni.metti(x, z, 0.7, CHIARO, 0.25 + 0.1 * Math.sin(t * 2))
    } else if (r.che === 'cosa') {
      const c = COSE[r.cosa] || {}
      nome = c.sprite
      y = 0.08 + Math.sin(t * 2.6 + (r.x + r.y)) * 0.06
      aloni.metti(x, z, 0.36, CALDO, 0.3)
      if (AURA[c.rarita]) aloni.metti(x, z, 0.75, AURA[c.rarita], 0.5 + 0.15 * Math.sin(t * 3 + x))
      if (c.rarita === 'leggendario') colonne.metti(x, z, 0.32, 5, AURA.leggendario, 0.45 + 0.15 * Math.sin(t * 2.5))
    } else if (r.che === 'porta') {
      if (r.aperta) return
      const verso = versoDellaPorta((a, b) => liv.a(a, b) !== PAVIMENTO && liv.a(a, b) !== PORTA, r.x, r.y)
      nome = PEZZO_DI.porta(r, t, sc, { verso })
    } else if (r.che === 'scala') nome = PEZZO_DI.scala(r, t, sc, { chiusa: !corsa.chiaveDelPiano })
    else if (PEZZO_DI[r.che]) nome = PEZZO_DI[r.che](r, t, sc, {})
    if (r.che === 'forziere' && r.missione && !r.aperto) {
      scala = BERSAGLIO.scala
      aloni.metti(x, z, 1.05, ROSA, 0.4 + 0.25 * Math.sin(t * 2.2))
      const alto = figure.alto(nome, scala) + 0.35 + Math.sin(t * 2.4) * 0.05
      sopra(x, alto, z, `f|${luce === 2 ? r.nome : ''}`, () => `<span class="em sot3d-cerca">${esc(r.em || '')}</span>` + (luce === 2 ? `<b class="sot3d-nome">${esc(r.nome)}</b>` : ''), { missione: r.missione })
    }
    if (!nome) return
    const tocca = DA_TOCCARE.includes(r.che) && r.che !== 'arredo'
    const o = figure.o()
    o.scala = scala; o.cosa = tocca ? r : null
    figure.metti(nome, x, y, z, o)
  }

  return {
    stato,
    // `palco`: { campo, fx } nello scontro (i mostri in campo si vedono anche fuori dal cono, e cadono raccontati); `salta(r)`:
    // le cose che disegna qualcun altro (la fontana e il portale modellati)
    disegna(corsa, { t, dt, dtScena, palco = null, salta = null }) {
      const liv = corsa.livello
      const sc = SCENARI[corsa.scenario] || SCENARI[SCENARIO]
      const campo = palco ? palco.campo : null
      for (const r of liv.robe) {
        if (r.presa) continue
        if (salta && salta(r)) continue
        if (r.che === 'mostro') {
          const inCampo = campo ? campo.indexOf(r) : -1
          const s = stato(r)
          s.dtScena = dtScena
          // fuori dal palco il mostro sta dove lo mette il motore; dentro, il palco lo porta al suo posto
          if (s.meta) { const k = verso(dtScena, 5); s.x += (s.meta.x - s.x) * k; s.z += (s.meta.z - s.z) * k; s.corre = Math.hypot(s.meta.x - s.x, s.meta.z - s.z) > 0.08 }
          else { const nx = r.fx ?? r.x + 0.5, nz = r.fy ?? r.y + 0.5; s.corre = Math.hypot(nx - s.x, nz - s.z) > 0.002 && r.sveglio; s.x = nx; s.z = nz }
          s.t += dtScena; s.flash = Math.max(0, s.flash - dt * 7)
          if (inCampo < 0) s.specchio = r.guarda === 'sx'
          const k = Math.floor(s.z) * liv.largo + Math.floor(s.x)
          const inLuce = corsa.inLuce(k)
          if (r.morto && inCampo < 0 && !(s.morente > 0 && s.morente < 1.9)) continue
          if (inCampo < 0 && !inLuce) continue   // un mostro si vede solo nella luce di adesso (docs/sotterraneo/luce.md)
          mostro(r, s, t, inLuce ? 2 : 1, inCampo, palco && palco.fx)
          continue
        }
        if (r.morto && r.che !== 'fonte') continue
        if (r.che === 'relitto') continue
        const luce = corsa.luceDi(r.x, r.y)
        if (!luce) continue
        roba(r, t, sc, corsa, luce)
      }
      // i relitti con uno sprite: coi piedi in fondo alla loro ultima cella, come l'arredo
      for (const q of liv.relitti || []) {
        if (!q.pezzo) continue
        let luce = 0
        for (let j = 0; j < q.h; j++) for (let i = 0; i < q.w; i++) luce = Math.max(luce, corsa.luceDi(q.x + i, q.y + j))
        if (luce) figure.metti(q.pezzo, q.x + q.w / 2, 0, q.y + q.h - 0.5, figure.o())
      }
    },
  }
}
