// Il turno raccontato, in scena: lo stesso `fx` che la vista vera legge (viste/racconto.js) accende qui scatti, colpi, scintille,
// lampi e scosse. L'eroe scatta in tre tempi (carica, affondo che arriva all'`arrivo` dell'effetto, ritorno: dati/effetti.js), il
// mostro coi tempi del racconto; il colpo che arriva fa scintille nel colore dell'elemento, un lampo, il mostro bianco, una
// scossa e un fermo-immagine; scudi e cure fanno una bolla; le magie volano (`volo`) o cadono dall'alto (`alto`) con la loro luce.
// I numeri che salgono e le barre li scrive la vista (viste/Scontro3d.vue): qui solo quello che si disegna.
// Con gli effetti 3D (effetti3d/gestore.js, docs/sotterraneo/mostri-3d.md) l'abilità dell'eroe è l'effetto del prototipo con la
// stessa chiave, i mostri col modello 3D attaccano con la loro posa (`attacca`) e chi tira lancia il suo proiettile dall'`origine`;
// dove un effetto 3D non c'è, resta quello di prima (scintille e luci).
import { Color, Vector3 } from 'three'
import { schedaDi, motoDell } from '../dati/effetti.js'
import { TEMPI } from '../viste/racconto.js'
import { effettoDi, segnoDi, auraDi, SEGNO_COLPO, PROIETTILE } from './effetti3d/gestore.js'

// un affondo: un passo indietro per caricare, lo scatto fin quasi a toccarlo (arriva al `picco`), il ritorno al suo posto
export function assalto(chi, contro, dur, picco = dur * 0.5, quanto = 1) {
  const dx = contro.x - chi.x, dz = contro.z - chi.z, l = Math.hypot(dx, dz) || 1
  const k = Math.max(0.15, l - 0.7) / l * quanto
  chi.assalto = { t: 0, dur: Math.max(dur, picco + 0.12), picco: Math.max(0.06, picco), dx: dx * k, dz: dz * k }
}
// di quanto è spostato adesso chi sta assaltando (scrive `dx`, `dz` sullo stato)
export function muoviAssalto(chi, dt) {
  const a = chi.assalto
  chi.dx = 0; chi.dz = 0
  if (!a) return
  a.t += dt
  if (a.t >= a.dur) { chi.assalto = null; return }
  const carica = a.picco * 0.3
  let k
  if (a.t < carica) k = -0.18 * Math.sin(Math.PI * a.t / carica)
  else if (a.t < a.picco) { const u = (a.t - carica) / (a.picco - carica); k = u * u * (3 - 2 * u) }
  else { const u = (a.t - a.picco) / (a.dur - a.picco); k = 1 - u * u * (3 - 2 * u) }
  chi.dx = a.dx * k; chi.dz = a.dz * k
}

// `S`: la scena (eroe, stato dei mostri, scintille, luci, anelli, e i numeri della scossa), `vede(x, z)`: se lì si vede
export function creaRacconto(S) {
  const visti = {}
  let ultimaScena = 0, ultimoScuote = 0, tinta = '#e6ebf6'
  const proiettili = []
  const c = new Color()
  // le azioni dell'eroe di questo turno, in fila (Gioco.vue le annuncia tutte quando il racconto si costruisce): ognuna parte quando
  // l'eroe si muove per lei; `in3d` l'azione di adesso, se il suo effetto lo disegna il 3D
  const coda = []
  let annunciate = 0, in3d = null, ultimoMostro = null
  const v1 = new Vector3(), v2 = new Vector3()
  const altoEroe = () => (S.eroe.alto || 1.4) * 0.72   // il modello è alto così rispetto allo sprite (eroe3d.js); lo sprite si conta uguale
  const pettoEroe = out => { const d = S.eroe.disegnato || S.eroe; return out.set(d.x, altoEroe() * 0.58, d.z) }
  const piediDi = (v, out) => out.set(v.x + (v.dx || 0), 0, v.z + (v.dz || 0))
  const altoDi = v => (v.in3d ? v.alto : (v.alto || 1) * 0.72)
  const pettoDi = (v, out) => (S.mostri3d && v.in3d && S.mostri3d.petto(v, out)) || out.set(v.x + (v.dx || 0), Math.max(0.4, altoDi(v) * 0.55), v.z + (v.dz || 0))
  // l'effetto 3D dell'abilità dell'eroe, su tutti quelli che prende: il bersaglio per primo
  function lancia3d(k) {
    const E = S.effetti3d
    if (!E || !k || !k.effetto) return false
    const sc = schedaDi(k.effetto), def = effettoDi(k.effetto, sc.via)
    if (!def) return false
    const stati = (k.presi || []).map(chi => { const r = S.campo && S.campo.includes(chi) ? chi : null; return r && S.stato ? S.stato(r) : null }).filter(Boolean)
    const b = k.bersaglio && S.stato ? S.stato(k.bersaglio) : stati[0]
    const altri = stati.filter(x => x !== b)
    const tinta = new Color(k.luce || '#e6ebf6')
    let o
    if (sc.via === 'su-me') o = { da: piediDi(S.eroe.disegnato || S.eroe, v1), a: b ? piediDi(b, v2) : piediDi(S.eroe.disegnato || S.eroe, v2), scala: altoEroe() }
    else if (!b) return false
    else if (sc.via === 'su-chi') o = { da: piediDi(S.eroe.disegnato || S.eroe, v1), a: piediDi(b, v2), altri: altri.map(x => piediDi(x, new Vector3())), scala: Math.max(0.8, altoDi(b)) }
    else {
      const d = S.eroe.disegnato || S.eroe
      pettoEroe(v1); v1.x += Math.sign(b.x - d.x || 1) * 0.3; v1.y += 0.15
      o = { da: v1, a: pettoDi(b, v2), altri: altri.map(x => pettoDi(x, new Vector3())), scala: Math.max(0.75, Math.min(1.6, altoDi(b) / 1.5)) }
    }
    o.tinta = tinta
    if (!E.lancia(def, o)) return false
    in3d = { corpo: sc.corpo, segno: sc.segno, fino: S.tempo + (sc.dura || 600) / 1000 + 0.4, bersaglio: b }
    return true
  }
  const posizioneDi = chi => {
    if (chi === 'eroe' || chi == null) return S.eroe
    const r = S.campo && S.campo[chi]
    return r ? S.stato(r) : null
  }
  function impatto(v, forza = 1, colore = '#e6ebf6') {
    v.flash = 1
    const e = S.eroe, dx = v.x - e.x, dz = v.z - e.z, l = Math.hypot(dx, dz) || 1
    c.set(colore)
    S.scintille.emetti(v.x - dx / l * 0.2, 0.6, v.z + 0.1, Math.round(50 * forza), { forza: 3.4 * forza, su: 2, vita: 0.5, taglia: 0.1, tinta: c })
    S.luci.lampo.color.copy(c); S.luci.lampo.position.set(v.x - dx / l * 0.3, 0.8, v.z + 0.2); S.luci.lampo.intensity = 18 * forza
    S.fermo = Math.max(S.fermo, 0.07 * forza)
    S.scossa = Math.min(1, S.scossa + 0.35 * forza)
  }
  function ferito() {
    const e = S.eroe
    // il segno del colpo del mostro sull'eroe, in 3D: quello della sua posa d'attacco (un morso, una zampata, un fendente)
    if (S.effetti3d && ultimoMostro && S.tempo - ultimoMostro.t < 0.6 && !ultimoMostro.proiettile) {
      const def = segnoDi(SEGNO_COLPO[ultimoMostro.tipo] || 'colpo')
      if (def) S.effetti3d.lancia(def, { da: pettoDi(ultimoMostro.v, v1), a: pettoEroe(v2), elem: 'fisico', scala: 1 })
    }
    e.colpito = 0.35; S.scossa = Math.min(1, S.scossa + 0.45); S.rosso = 1; S.fermo = Math.max(S.fermo, 0.07)
    S.luci.lampo.color.set(0xff6040); S.luci.lampo.position.set(e.x, 0.8, e.z + 0.3); S.luci.lampo.intensity = 14
    S.scintille.emetti(e.x, 0.6, e.z + 0.1, 30, { forza: 2.4, su: 1.6, vita: 0.45, taglia: 0.07 })
  }
  function bolla(colore) { S.anelli.bolla.material.color.set(colore); S.tBolla = 0 }
  function effetto(chi, tipo) {
    const e = S.eroe
    if (chi === 'eroe') {
      // l'azione che parte adesso: la prima della fila che si muove così (la parata di un colpo del mostro non ne consuma una)
      if (coda.length && coda[0].moto === tipo) { S.colpoEroe = coda.shift(); in3d = null; if (S.colpoEroe.che !== 'bevi' && S.colpoEroe.che !== 'sbaglia') lancia3d(S.colpoEroe) }
      const k = S.colpoEroe || {}
      const b = k.bersaglio && S.stato(k.bersaglio)
      const arrivo = (k.arrivo || 190) / 1000, dura = Math.min(0.86, (k.dura || 480) / 1000)
      // la torcia prende il colore del colpo finché dura (rossa col fuoco, azzurra col gelo, bianca l'acciaio)
      if (k.luce) { S.luci.tinta.set(k.luce); S.luci.tTinta = dura }
      if (tipo === 'scatta' && b) assalto(e, b, dura, arrivo)
      else if (tipo === 'tira' && b) { assalto(e, b, Math.min(dura, 0.45), Math.max(0.1, arrivo * 0.5), 0.22); S.scintille.emetti(e.x, 0.9, e.z + 0.1, 16, { forza: 0.8, su: 0.6, vita: 0.4, caldo: 0.2, taglia: 0.06, tinta: c.set(k.luce || '#ffffff') }) }
      else if (tipo === 'gira') { e.gira = 0.5; S.scintille.emetti(e.x, 0.5, e.z, 40, { forza: 3, su: 0.3, vita: 0.4, caldo: 0.2, taglia: 0.06, tinta: c.set(k.luce || '#e6ebf6') }) }
      else if (tipo === 'vuoto' && b) { assalto(e, b, 0.34); S.scintille.emetti(b.x, 0.5, b.z, 8, { forza: 1, su: 0.5, vita: 0.3, caldo: 0.2, taglia: 0.05, tinta: c.set('#9a9a9a') }) }
      else if (tipo === 'colpito') ferito()
      else if (tipo === 'cura') { e.cura = 1.2; bolla('#7dffa0'); aura3d('cura', '#7dffa0', 0); S.scintille.emetti(e.x, 0.3, e.z, 40, { forza: 0.6, su: 2.2, vita: 0.9, caldo: 0.2, taglia: 0.06, tinta: c.set('#7dffa0') }) }
      else if (tipo === 'protegge') { bolla(k.luce || '#8ac8ff'); S.scintille.emetti(e.x, 0.6, e.z, 40, { forza: 1.6, su: 0.4, vita: 0.6, caldo: 0.2, taglia: 0.06, tinta: c.set('#8ac8ff') }) }
      return
    }
    const v = posizioneDi(Number(chi))
    if (!v) return
    if (tipo === 'scatta') {
      // col modello 3D: la sua posa d'attacco (mostro3d.js la legge da `attacco3d`), che arriva quando il racconto fa incassare
      // l'eroe; prima dell'arrivo la carica è stretta nel passo del racconto, dopo va coi suoi tempi
      const att = S.mostri3d && v.in3d && S.mostri3d.attaccoDi(v)
      if (att) {
        const picco = TEMPI.passo / 1000, dur = Math.max(TEMPI.mostro / 1000, picco + (1 - att.arrivo) * att.durata)
        const proj = att.proiettile
        assalto(v, e, dur, picco, proj ? 0.12 : 1)
        v.attacco3d = { arrivo: att.arrivo }
        ultimoMostro = { v, tipo: att.tipo, proiettile: !!proj, t: S.tempo }
        const P = proj && PROIETTILE[proj.tipo], def = P && S.effetti3d && effettoDi(P.chiave)
        if (def) {
          const su = !!P.su
          const da = su ? piediDi(S.eroe.disegnato || e, v1) : (S.mostri3d.origine(v, v1) || pettoDi(v, v1))
          const a = su ? piediDi(S.eroe.disegnato || e, v2) : pettoEroe(v2)
          S.effetti3d.lancia(def, { da, a, elem: P.elem, tinta: P.tinta, scala: su ? altoEroe() : 1 })
        }
      } else { assalto(v, e, TEMPI.mostro / 1000, TEMPI.passo / 1000); ultimoMostro = null }
    }
    else if (tipo === 'colpito') impatto(v, 1, tinta)
    else if (tipo === 'colpito-forte') impatto(v, 1.6, tinta)
    else if (tipo === 'colpito-debole') impatto(v, 0.5, tinta)
    else if (tipo === 'stordito') S.scintille.emetti(v.x, (v.alto || 1) + 0.2, v.z, 14, { forza: 0.8, su: 0.6, vita: 0.6, caldo: 0.2, taglia: 0.05, tinta: c.set('#ffe36a') })
  }
  // un'aura 3D sull'eroe (lo scudo, la cura…): true se c'è
  function aura3d(corpo, colore, ritardo) {
    const def = S.effetti3d && auraDi(corpo === 'colonna' ? 'preghiera' : corpo)
    if (!def) return false
    const d = S.eroe.disegnato || S.eroe
    return !!S.effetti3d.lancia(def, { da: piediDi(d, v1), a: piediDi(d, v2), tinta: new Color(colore || '#8ac8ff'), scala: altoEroe(), attesa: ritardo })
  }
  function scena(s) {
    tinta = s.tinta || '#e6ebf6'
    // l'abilità di adesso la disegna il 3D: il suo corpo e il suo segno ci sono già; le aure sull'eroe e i segni in più (lo teme,
    // resiste) sono effetti 3D a sé; il resto come prima
    if (in3d && S.tempo < in3d.fino) {
      if (s.corpo === in3d.corpo || s.corpo === in3d.segno) return
      if (s.a === 'eroe' && aura3d(s.corpo, s.tinta, (s.ritardo || 0) / 1000)) return
      const def = segnoDi(s.corpo), b = S.stato && S.campo && S.campo[s.a] ? S.stato(S.campo[s.a]) : null
      if (def && b && S.effetti3d.lancia(def, { da: pettoEroe(v1), a: pettoDi(b, v2), tinta: new Color(tinta), scala: s.piu ? 1.3 : 1, attesa: (s.ritardo || 0) / 1000 })) return
    }
    const t0 = S.tempo + (s.ritardo || 0) / 1000
    proiettili.push({ s, t0, partito: false, t: 0, dur: 0, da: null, a: null, y0: null, tinta: new Color(tinta) })
  }
  return {
    // un colpo dell'eroe sta per partire: verso chi, coi tempi e il colore dell'effetto (dati/effetti.js)
    colpo(a, modo) {
      const sc = schedaDi(modo.effetto)
      // un turno nuovo: le azioni si annunciano tutte insieme quando il racconto si costruisce
      const ora = typeof performance !== 'undefined' ? performance.now() : 0
      if (ora - annunciate > 80) coda.length = 0
      annunciate = ora
      const che = a.che === 'bevi' || a.che === 'sbaglia' ? a.che : 'agisce'
      const k = { bersaglio: a.bersaglio, arrivo: sc.arrivo, dura: sc.dura, luce: modo.luce, effetto: modo.effetto, che,
                  presi: ((a.presi && a.presi.length ? a.presi : a.colpiti) || []).map(x => x.chi),
                  moto: che === 'bevi' ? 'cura' : che === 'sbaglia' ? 'vuoto' : motoDell(modo.effetto) }
      coda.push(k)
      S.colpoEroe = coda[0]
    },
    leggi(fx) {
      for (const chi of Object.keys(fx.effetto)) { const e = fx.effetto[chi]; if (!e || visti[chi] === e.n) continue; visti[chi] = e.n; effetto(chi, e.tipo) }
      for (const s of fx.scene) if (s.id > ultimaScena) { ultimaScena = s.id; scena(s) }
      if (fx.scuote && fx.scuote !== ultimoScuote) { ultimoScuote = fx.scuote; S.scossa = Math.min(1, S.scossa + 0.8) }
    },
    // i proiettili delle abilità: partono al loro ritardo, volano con una scia nel colore dell'elemento e la loro luce
    aggiorna(dt) {
      for (let i = proiettili.length - 1; i >= 0; i--) {
        const p = proiettili[i]
        if (!p.partito) {
          if (S.tempo < p.t0) continue
          p.partito = true
          const s = p.s, a = posizioneDi(s.a === 'eroe' ? 'eroe' : s.a)
          if (!a) { proiettili.splice(i, 1); continue }
          p.a = { x: a.x, z: a.z }
          if (s.modo === 'volo') { const d = posizioneDi(s.da === 'eroe' ? 'eroe' : s.da) || S.eroe; p.da = { x: d.x, z: d.z }; p.dur = Math.max(0.12, s.durata / 1000 * 0.6) }
          else if (s.modo === 'alto') { p.da = { x: a.x, z: a.z }; p.y0 = 3.2; p.dur = Math.max(0.12, s.durata / 1000 * 0.5) }
          else {
            S.scintille.emetti(a.x, 0.5, a.z, s.piu ? 60 : 30, { forza: s.piu ? 3 : 1.8, su: 1.6, vita: 0.6, caldo: 0.3, taglia: 0.08, tinta: p.tinta })
            S.luci.magia.color.copy(p.tinta); S.luci.magia.position.set(a.x, 1, a.z + 0.3); S.luci.magia.intensity = 10
            proiettili.splice(i, 1); continue
          }
        }
        p.t += dt
        const k = Math.min(1, p.t / p.dur)
        const x = p.da.x + (p.a.x - p.da.x) * k, z = p.da.z + (p.a.z - p.da.z) * k
        const y = p.y0 != null ? p.y0 + (0.6 - p.y0) * k : 0.7 + Math.sin(k * Math.PI) * 0.4
        S.scintille.emetti(x, y, z, 3, { forza: 0.4, su: 0.2, vita: 0.35, caldo: 0.2, taglia: 0.09, tinta: p.tinta })
        S.luci.magia.color.copy(p.tinta); S.luci.magia.position.set(x, y + 0.2, z + 0.2); S.luci.magia.intensity = 8
        if (k >= 1) { S.scintille.emetti(x, y, z, 30, { forza: 2.2, su: 1.2, vita: 0.5, caldo: 0.2, taglia: 0.08, tinta: p.tinta }); proiettili.splice(i, 1) }
      }
    },
    svuota() { proiettili.length = 0; coda.length = 0; in3d = null },
    // per le prove e gli scatti (window.__sotterraneo3d.prova): l'eroe usa l'effetto `chiave` sul mostro `i` dello scontro, o il mostro
    // `i` attacca l'eroe (`chiave` 'mostro'); nessun numero cambia, è solo il disegno
    prova(chiave, i = 0, luce = '#e8742f') {
      const r = S.campo && S.campo[i]
      if (!r) return false
      if (chiave === 'mostro') { effetto(String(i), 'scatta'); setTimeout(() => effetto('eroe', 'colpito'), TEMPI.passo); return true }
      const sc = schedaDi(chiave)
      S.colpoEroe = { bersaglio: r, presi: [r], effetto: chiave, luce, arrivo: sc.arrivo, dura: sc.dura, che: 'agisce', moto: motoDell(chiave) }
      coda.length = 0; coda.push(S.colpoEroe)
      effetto('eroe', S.colpoEroe.moto)
      return !!in3d
    },
  }
}
