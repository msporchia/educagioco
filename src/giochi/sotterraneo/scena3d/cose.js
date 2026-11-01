// La roba del piano in 3D, a ogni fotogramma: per ogni cosa del motore (corsa.livello.robe) la sua figura dell'atlante, scelta
// come la sceglie il gioco (dati/tessere.js `PEZZO_DI`), il chiarore per terra di chi lo chiede e i segni scritti sopra. La roba da
// raccogliere che ha un modello si vede col modello (roba-per-terra.js), non con lo sprite. Si vede quello che il motore dice
// (`luceDi`): nel ricordo la roba ferma, mai i mostri.
// I mostri hanno uno stato di disegno (dove stanno smussati, il lampo del colpo, lo scatto, la caduta), che il palco muove; i più
// vicini all'eroe hanno il modello 3D (mostro3d.js, docs/sotterraneo/mostri-3d.md), gli altri la sagoma del modello (sagome.js,
// docs/sotterraneo/sagome-3d.md), nella stessa posa e dalla stessa parte.
import { Color } from 'three'
import { SCENARI, SCENARIO, PEZZO_DI } from '../dati/tessere.js'
import { BERSAGLIO, PORTA, PAVIMENTO } from '../dati/mondo.js'
import { MOSTRI } from '../dati/mostri.js'
import { COSE } from '../dati/cose.js'
import { GROSSI } from '../dati/grossi.js'
import { ALTO_DELLA_SPECIE, ALTO_DEL_GROSSO, GRANDEZZA_DELLA_SPECIE, GRANDEZZA_DEL_GROSSO } from '../dati/altezze.js'
import { versoDellaPorta } from '../scena/muri.js'
import { SCALA_SU } from '../scena/scala-su.js'
import { posaDi } from './pianta.js'
import { esc, barretta } from './etichette.js'
import { ALLUNGA } from './costanti.js'
import { verso } from './tempo.js'
import { muoviAssalto } from './racconto.js'
import { mosseDi } from '../dati/mosse.js'
import { idDi, ALTEZZA } from './mostri3d/registro.js'
import { giraIlMostro } from './mostro3d.js'
import { ACCANTO } from './sagome.js'
import { scalaDelModello } from './sagome-pura.js'

// i colori pronti una volta: a ogni fotogramma non si legge una stringa
const AURA = { magico: new Color('#6f8dff'), raro: new Color('#ffd23f'), leggendario: new Color('#ff9a2e') }
const ROSSO = new Color('#e0644f'), ORO = new Color('#f0c24a'), CHIARO = new Color('#ffe2a0'), CALDO = new Color('#ffd278')
const ROSA = new Color(BERSAGLIO.colore)
const TINTE_GROSSI = Object.fromEntries(Object.entries(GROSSI).map(([k, g]) => [k, new Color(g.tinta || '#e0644f')]))
// le cose che si toccano: come `toccabile` del motore, ma basta averle viste (ci si va anche al buio); i mostri solo nella luce
const liscio = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x) }
export const DA_TOCCARE = ['porta', 'forziere', 'curiosita', 'fonte', 'scala', 'scala-su', 'cosa', 'gemme', 'portale', 'mostro']

// `apre(r)`: una porta o un forziere si è appena aperto (lo dice il motore): chi chiama ci mette le scintille
// `mostri3d`: la riserva dei modelli (mostro3d.js) o null; `sagome`: le sagome dei modelli (sagome.js) per chi non ha il modello;
// `vicino()`: dove sta l'eroe disegnato, per scegliere chi ha il modello; `perTerra`: i modelli della roba per terra (roba-per-terra.js) o null
export function creaCose({ figure, aloni, macchie = null, colonne, etichette, camera, apre = null, mostri3d = null, sagome = null, vicino = null, perTerra = null }) {
  const stati = new WeakMap()
  const visibili = []   // i mostri da disegnare in questo fotogramma (riusato): prima si sceglie chi ha il modello, poi si disegna
  const punto = { x: 0, y: 0 }
  let foglio = null   // lo scontro di adesso: la mossa annunciata (foglio.minaccia) accende l'anello a terra
  let livello = null  // il piano di adesso: cambiato, le copie della roba per terra del piano di prima si tolgono
  const annunciata = r => { const mi = foglio && foglio.minaccia && foglio.minaccia.find(x => x.chi === r); return mi && mi.mossa ? mi.mossa.id : null }
  const stato = r => {
    let s = stati.get(r)
    if (!s) { s = { r, x: r.fx ?? r.x + 0.5, z: r.fy ?? r.y + 0.5, t: Math.random(), flash: 0, assalto: null, morente: 0, meta: null, alto: 1, specchio: false }; stati.set(r, s) }
    return s
  }
  // un segno scritto sopra (x, z) a quota `alto` (in celle), spostato di `dy` px
  const sopra = (x, alto, z, chiave, html, attr, dy = 0) => {
    camera.schermo(x, alto, z, punto)
    etichette.metti(punto.x, punto.y + dy, chiave, html, attr)
  }

  const tinta3 = [0, 0, 0]
  function mostro(r, s, t, luce, inCampo, fx, verso3d) {
    const scheda = MOSTRI[r.tipo] || {}
    const morto = inCampo >= 0 && fx && fx.attivo ? !!fx.morti[inCampo] : r.morto
    // il posto (dati/altezze.js): quanto è alto, allungato per la vista di adesso, e la grandezza per chiarori e macchia; i grossi respirano
    let posto, scala
    if (r.grosso) {
      if (!ALTO_DEL_GROSSO[r.grosso]) return
      const respiro = 1 + 0.035 * Math.sin(t * (r.sveglio ? 5 : 2.2))
      posto = ALTO_DEL_GROSSO[r.grosso] * respiro; scala = (GRANDEZZA_DEL_GROSSO[r.grosso] || 1) * respiro
    } else {
      const m = r.missione ? BERSAGLIO.scala : 1
      posto = (ALTO_DELLA_SPECIE[r.tipo] || 1) * m; scala = (GRANDEZZA_DELLA_SPECIE[r.tipo] || 1) * m
    }
    posto *= ALLUNGA
    // chi cade si rovescia (il modello, o la sua sagoma) e svanisce
    let trasparenza = 1
    if (morto) {
      s.morente += s.dtScena
      trasparenza = Math.max(0, 1 - Math.max(0, s.morente - 1.1) / 0.8)
      if (trasparenza <= 0) return
    }
    const x = s.x + (s.dx || 0) + (s.flash > 0 ? (Math.random() - 0.5) * 0.08 : 0), z = s.z + (s.dz || 0) + 0.1
    s.alto = posto * 0.72
    s.in3d = false; s.inSagoma = false
    const a = s.assalto, att = s.attacco3d
    let p = -1
    if (a && att) p = a.t < a.picco ? att.arrivo * a.t / a.picco : att.arrivo + (1 - att.arrivo) * Math.min(1, (a.t - a.picco) / Math.max(0.01, a.dur - a.picco))
    const verso3 = inCampo >= 0 || r.sveglio ? verso3d : null
    // il modello 3D, se questo mostro l'ha avuto
    if (s.vuole3d && s.id3d && mostri3d) {
      // chi ha più mosse (dati/mosse.js): la mossa che fa adesso al posto dell'attacco, e quella annunciata mentre l'eroe sceglie
      const mosse = r.caporale || r.signore || r.grosso ? mosseDi(r) : null
      const mossa = att && att.mossa ? { id: att.mossa, p } : null
      const annuncio = inCampo >= 0 && !morto && !(fx && fx.attivo) && mosse ? annunciata(r) : null
      const alto = mostri3d.metti(r, s, s.id3d, { x, z: z - 0.1, alto: posto, verso: verso3, t: s.t, dt: s.dtScena, trasparenza,
        morente: morto ? s.morente : 0, bianco: s.flash * 1.4, tinta: s.tinta3d, forzaTinta: s.forzaTinta3d || 0, attacco: mossa ? -1 : p, mosse, mossa, annuncio })
      if (alto >= 0) { s.alto = alto; s.in3d = true }
    }
    // se no la sagoma del modello: la stessa posa, dalla stessa parte, alla stessa misura (finché l'atlante non c'è, niente)
    if ((!s.in3d || ACCANTO) && s.id3d && sagome && sagome.ha(s.id3d)) {
      const sc = sagome.scatola(s.id3d)
      const k = scalaDelModello(sc.alto, sc.largo, posto, ALTEZZA[s.id3d.split('+')[0]] || 1)
      const yaw = s.in3d ? s.yaw3d : giraIlMostro(s, { x, z: z - 0.1, verso: verso3, dt: s.dtScena })
      const dx = s.in3d ? ACCANTO : 0
      const caduto = morto ? liscio(s.morente / 0.6) : 0
      if (!morto) s.tCaduta = s.t
      const ft = s.forzaTinta3d || 0, tinge = ft > 0.001 && s.tinta3d
      if (tinge) { tinta3[0] = s.tinta3d.r * ft * 0.6; tinta3[1] = s.tinta3d.g * ft * 0.6; tinta3[2] = s.tinta3d.b * ft * 0.6 }
      if (sagome.metti(s.id3d, { x: x + dx, z: z - 0.1, k, yaw, t: (morto ? s.tCaduta : s.t) + (s.fase3d ??= Math.random() * 7), attacco: att && att.mossa ? -1 : p,
        arrivo: sc.att ? sc.att[0] : 0.5, haColpo: !!sc.att, caduto, bianco: s.flash * 1.3, tinta: tinge ? tinta3 : null, trasparenza, cosa: morto ? null : r })) {
        if (!s.in3d) { s.alto = sc.alto * k * (1 - 0.7 * caduto); s.inSagoma = true }
        if (sc.att && !s.attaccoSagoma) s.attaccoSagoma = { arrivo: sc.att[0], durata: sc.att[1], tipo: sc.att[2], proiettile: sc.att[3] ? { tipo: sc.att[3] } : null }
      }
    }
    if (macchie) macchie.metti(x, z - 0.1, 0.36 * Math.min(2.5, scala), trasparenza)
    if (morto || inCampo >= 0) return
    // i chiarori: chi conta (un capo, la chiave, una missione) ha l'alone rosso; il grado il suo colore; il bersaglio il rosa
    if (scheda.capo || r.chiave || r.missione) aloni.metti(x, z - 0.1, 0.55 * scala, ROSSO, r.sveglio ? 0.45 + 0.2 * Math.sin(t * 7) : 0.25)
    if (r.grado && AURA[r.grado]) aloni.metti(x, z - 0.1, 0.6 * scala, AURA[r.grado], 0.45 + 0.15 * Math.sin(t * 3 + x))
    if (r.missione) aloni.metti(x, z - 0.1, 1.05 * scala, ROSA, 0.4 + 0.25 * Math.sin(t * 2.2))
    if (r.grosso) aloni.metti(x, z, 1.1 * scala, TINTE_GROSSI[r.grosso] || ROSSO, r.sveglio ? 0.5 : 0.3)
    if (r.caporale) aloni.metti(x, z - 0.1, 0.5, ORO, 0.5)
    // i segni sopra la testa
    const corona = r.missione || r.grosso
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
      if (perTerra && perTerra.metti(r, r.cosa, x, y, z, 0.35 * Math.sin(t * 1.3 + r.x + r.y))) return
      // una cosa senza sprite (i copricapi: docs/sotterraneo/elmo.md) si vede con la sua emoji, sospesa sul chiarore; il
      // dito la prende lo stesso (dito.js: la più vicina sullo schermo)
      if (!nome && c.em) sopra(x, 0.3 + y, z, `c|${c.em}`, () => `<span class="em sot3d-cosa">${esc(c.em)}</span>`, { cosa: r.cosa })
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
      foglio = palco && corsa.foglio && corsa.foglio.che === 'scontro' ? corsa.foglio : null
      visibili.length = 0
      if (perTerra) { if (liv !== livello) { perTerra.svuota(); livello = liv } perTerra.inizia() }
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
          muoviAssalto(s, dtScena)   // lo scatto del racconto (racconto.js): prima nessuno lo muoveva, e il mostro stava fermo
          if (!s.assalto) s.attacco3d = null
          if (inCampo < 0) s.specchio = r.guarda === 'sx'
          const k = Math.floor(s.z) * liv.largo + Math.floor(s.x)
          const inLuce = corsa.inLuce(k)
          if (r.morto && inCampo < 0 && !(s.morente > 0 && s.morente < 1.9)) continue
          if (inCampo < 0 && !inLuce) continue   // un mostro si vede solo nella luce di adesso (docs/sotterraneo/luce.md)
          s.inCampo = inCampo; s.luce = inLuce ? 2 : 1
          visibili.push(s)
          continue
        }
        if (r.morto && r.che !== 'fonte') continue
        if (r.che === 'relitto') continue
        const luce = corsa.luceDi(r.x, r.y)
        if (!luce) continue
        roba(r, t, sc, corsa, luce)
      }
      // i mostri: chi ha il modello 3D sono i più vicini all'eroe (quelli dello scontro per primi), fino al tetto di ACCESI.mostri3d
      const e = vicino && vicino()
      for (const s of visibili) if (s.id3d === undefined) s.id3d = idDi(s.r)   // la specie, il grado e la variante non cambiano
      if (mostri3d) {
        mostri3d.inizia()
        for (const s of visibili) {
          s.vuole3d = !!s.id3d
          s.d3d = s.inCampo >= 0 ? -1 : e ? (s.x - e.x) ** 2 + (s.z - e.z) ** 2 : 0
        }
        visibili.sort((a, b) => a.d3d - b.d3d)   // `metti` dice di no oltre il tetto: i lontani hanno la sagoma
      }
      const fx = palco && palco.fx
      for (const s of visibili) mostro(s.r, s, t, s.luce, s.inCampo, fx, e)
      if (mostri3d) mostri3d.chiudi()
      if (perTerra) perTerra.chiudi()
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
