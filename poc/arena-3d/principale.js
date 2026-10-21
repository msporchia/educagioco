// L'arena di prova del Sotterraneo 3D: eroi, armi, armature, copricapi, mostri ed effetti, tutti animati e da far attaccare.
// Autonoma: importa solo i moduli di poc/. Il tempo è uno solo (T, in secondi di simulazione): ogni posa è una funzione pura di T
// o del tempo di un'azione; gli effetti hanno il loro orologio. Pausa = dt 0 (le pose si ripetono uguali), Passo = dt a mano.
import * as THREE from 'three'
import { Group, Box3, Vector3, Color, MathUtils } from 'three'
import { creaEroe, posaColpo, posaGuardia } from '../eroi-3d/eroi.js'
import { equipaggia } from '../armi-3d/armi.js'
import { creaDaId, perId } from '../armi-3d/collezione.js'
import { vesti } from '../armature-3d/armature.js'
import { copri } from '../copricapi-3d/copricapi.js'
import { creaPalco } from './palco.js'
import { creaPannello } from './pannello.js'
import { COLORI, ELEM_ARMA, MODULI, ABILITA, trovaAbilita, elementoStandard, elencoMostri, SEGNO_COLPO, PROIETTILE } from './dati.js'

// ───────── errori e parametri ─────────
const url = new URLSearchParams(location.search)
const errori = []
const vecchio = console.error
console.error = (...a) => { errori.push(a.map(String).join(' ').slice(0, 300)); vecchio.apply(console, a) }
addEventListener('error', e => errori.push(String(e.message)))
addEventListener('unhandledrejection', e => errori.push('promessa: ' + String(e.reason)))
window.__prova = { ok: false, errori }
const sicuro = (nome, f) => { try { return f() } catch (e) { errori.push(`${nome}: ${e.stack || e}`); return undefined } }

const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x
const smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x) }
const bump = (t, a, b, c, d) => smooth((t - a) / (b - a)) * (1 - smooth((t - c) / (d - c)))   // sale in [a,b], resta fino a c, scende in [c,d]
const verso = (r, x, y, z, k) => { r.x += (x - r.x) * k; r.y += (y - r.y) * k; r.z += (z - r.z) * k }
const BIANCO = new Color(1, 1, 1)
const rnd = (a, b) => a + Math.random() * (b - a)

// ───────── lo stato scelto ─────────
const S = {
  eroe: 'cavaliere', arma: 'spada-lunga', scudo: 'scudo-rotondo', armatura: 'corazza', pregio: '2', copricapo: 'serie',
  mostro: 'scheletro', mArma: '', mScudo: '', effettoArma: 'auto', abilita: 'taglio', elemento: 'auto', statoSu: 'mostro', variante: '',
  velocita: 1, pausa: false, fila: false, duello: false, armaTipo: 'spada',
}
const MOSTRI = elencoMostri(), MOSTRI_PER_ID = new Map(MOSTRI.map(m => [m.id, m]))

// ───────── palco e attori ─────────
const palco = creaPalco(document.getElementById('palco'))
const { scena, cam, renderer } = palco
const sopra = document.getElementById('sopra')

const XEROE = -1.5, GAP = 2.8
function nuovoAttore (nome, x, rotY) {
  const rad = new Group(); rad.rotation.order = 'YXZ'; rad.position.set(x, 0, 0); rad.rotation.y = rotY; scena.add(rad)
  const sc = new Group(); rad.add(sc)
  const a = {
    nome, rad, sc, obj: null, home: new Vector3(x, 0, 0), rotY, hpMax: 100, hp: 100, h: 1.4, frontZ: 0.4, off: new Vector3(), pettoY: 0.8,
    dx: 0, dy: 0, dz: 0, rotX: 0, rotZ: 0,
    rea: { t: 9, dur: 0.34, col: new Color(), scuote: false, dir: nome === 'eroe' ? -1 : 1 },
    mats: [], c0: [], e0: [], ei0: [], morte: 0, rinasce: 9, ferma: 0, def: null,
  }
  // la barra della vita e il nome, in HTML sopra la tela
  a.barra = document.createElement('div'); a.barra.className = 'hp'; a.barra.innerHTML = '<i></i>'
  a.riempi = a.barra.firstChild; sopra.append(a.barra)
  return a
}
const eroeA = nuovoAttore('eroe', XEROE, Math.PI / 2)
const mostroA = nuovoAttore('mostro', XEROE + GAP, -Math.PI / 2)

/** Misura un oggetto (nel suo spazio, senza il genitore): altezza, centro e quanto sporge davanti (+z). */
function misura (att, obj, scala) {
  const prova = new Group(); prova.scale.setScalar(scala); prova.add(obj); prova.updateMatrixWorld(true)
  const b = new Box3().setFromObject(prova), c = b.getCenter(new Vector3()), s = b.getSize(new Vector3())
  prova.remove(obj)
  const th = att.rotY, co = Math.cos(th), si = Math.sin(th)
  att.h = s.y; att.frontZ = b.max.z
  att.off.set(c.x * co + c.z * si, 0, -c.x * si + c.z * co)          // dove sta il centro rispetto ai piedi, in mondo
  att.pettoY = MathUtils.clamp(c.y, 0.5, 1.8)
  att.larg = s.z
}

function raccogliMat (att) {
  att.mats.length = 0
  const visti = new Set()
  att.rad.traverse(o => {
    if (!o.isMesh) return
    for (const m of [].concat(o.material)) if (m && m.emissive && m.color && !visti.has(m)) { visti.add(m); att.mats.push(m) }
  })
  while (att.c0.length < att.mats.length) { att.c0.push(new Color()); att.e0.push(new Color()); att.ei0.push(0) }
}

// ───────── costruire l'eroe ─────────
function animaArmi (e, t) {
  const pa = e.userData.perniArmi; if (!pa) return
  for (const p of Object.values(pa)) { const a = p.children[0]; if (a && a.userData.anima) a.userData.anima(t) }
}
function costruisciEroe () {
  azzeraAzioni()
  if (eroeA.obj) eroeA.sc.remove(eroeA.obj)
  const e = creaEroe(S.eroe)
  e.updateMatrixWorld(true)
  const nudo = new Box3().setFromObject(e); eroeA.h = nudo.getSize(new Vector3()).y
  const arma = S.arma ? creaDaId(S.arma) : null, scudo = S.scudo ? creaDaId(S.scudo) : null
  S.armaTipo = arma ? arma.userData.tipo : 'nessuna'
  // l'arco si tende con la sinistra: va in quella mano e lo scudo resta a casa
  const [destra, sinistra] = S.armaTipo === 'arco' ? [null, arma] : [arma, scudo]
  sicuro('equipaggia', () => equipaggia(e, { destra, sinistra }))
  if (S.armatura !== 'nessuna') sicuro('vesti', () => vesti(e, S.armatura, Number(S.pregio)))
  if (S.copricapo !== 'serie') sicuro('copri', () => copri(e, S.copricapo))
  e.traverse(o => { if (o.isMesh) o.castShadow = true })
  eroeA.obj = e; eroeA.sc.add(e)
  const c = new Box3().setFromObject(e)
  eroeA.pettoY = eroeA.h * 0.58; eroeA.off.set(0, 0, 0); eroeA.frontZ = 0.35
  eroeA.def = { elem: 'fisico' }
  raccogliMat(eroeA)
}

// ───────── costruire il mostro ─────────
function costruisciMostro () {
  azzeraAzioni()
  tuttiGliStati(true)
  if (mostroA.obj) mostroA.sc.remove(mostroA.obj)
  const def = MOSTRI_PER_ID.get(S.mostro) || MOSTRI[0]
  const o = def.crea()
  o.userData.anima?.(0)
  o.traverse(m => { if (m.isMesh) m.castShadow = true })
  mostroA.def = def; mostroA.sc.scale.setScalar(def.scala)
  misura(mostroA, o, def.scala)
  mostroA.obj = o; mostroA.sc.add(o)
  mostroA.home.x = XEROE + GAP + mostroA.frontZ
  mostroA.rad.position.copy(mostroA.home)
  raccogliMat(mostroA)
  impugnaMostro()
  const alto = Math.max(mostroA.h, 1.2), destra = mostroA.home.x + mostroA.off.x + Math.min(mostroA.larg * 0.5, 2.3), sinistra = XEROE - 1.5
  palco.inquadra((sinistra + destra) / 2, destra - sinistra, 0.45 + alto * 0.18)
}
function impugnaMostro () {
  const u = mostroA.obj && mostroA.obj.userData; if (!u || !u.impugna) return
  const arma = v => v === '' ? undefined : (v === 'nessuna' || v === 'nessuno') ? null : creaDaId(v)
  sicuro('impugna', () => u.impugna(arma(S.mArma), arma(S.mScudo)))
  raccogliMat(mostroA)
}
const variantiMostro = () => { const u = mostroA.obj && mostroA.obj.userData; return u && u.attacchi ? Object.keys(u.attacchi) : [] }

// ───────── il tempo: azioni, appuntamenti, effetti ─────────
let T = 0
const azioni = [], pendenti = [], fxAttivi = []
const occupato = () => azioni.length > 0 || pendenti.length > 0 || fxAttivi.some(e => e.def.durata !== Infinity) || eroeA.morte > 0 || mostroA.morte > 0
function azzeraAzioni () { azioni.length = 0; pendenti.length = 0; for (const e of fxAttivi.filter(e => e.def.durata !== Infinity)) liberaFx(e); eroeA.rea.t = mostroA.rea.t = 9 }
function programma (ritardo, fn) { pendenti.push({ t: ritardo, fn }) }
/** Un'azione: pose per `durata` secondi e appuntamenti [t, fn] in ordine di tempo. */
function avvia (durata, posa, eventi = []) { const a = { t: 0, durata, posa, ev: eventi.slice().sort((x, y) => x[0] - y[0]), i: 0 }; azioni.push(a); return a }
function aggiornaAzioni (dt) {
  for (let k = 0; k < azioni.length; k++) {
    const a = azioni[k]; a.t += dt
    while (a.i < a.ev.length && a.ev[a.i][0] <= a.t + 1e-9) sicuro('evento', a.ev[a.i++][1])
    sicuro('posa', () => a.posa(Math.min(a.t, a.durata)))
    if (a.t >= a.durata) { azioni.splice(k, 1); k-- }
  }
  for (let k = 0; k < pendenti.length; k++) { const p = pendenti[k]; p.t -= dt; if (p.t <= 1e-9) { pendenti.splice(k, 1); k--; sicuro('pendente', p.fn) } }
}

function petto (att, out) { return out.set(att.rad.position.x + att.off.x, att.pettoY, att.rad.position.z + att.off.z) }
function piedi (att, out) { return out.set(att.rad.position.x + att.off.x, 0, att.rad.position.z + att.off.z) }
const vP = new Vector3(), vQ = new Vector3()

/** Lancia un effetto. o: { da, a, elem | tinta, scala, portatore, colpisce, danno, scuote, cura } */
function spara (ab, o) {
  const def = ab.def
  const tinta = new Color(o.tinta ?? COLORI[o.elem] ?? COLORI.fisico), tinta2 = tinta.clone().lerp(BIANCO, 0.45)
  const ctx = { da: o.da.clone(), a: o.a.clone(), tinta, tinta2, seme: rnd(1, 40), altri: [], scala: o.scala ?? 1 }
  const fx = sicuro('crea ' + ab.id, () => def.crea(ctx)); if (!fx) return null
  scena.add(fx.gruppo)
  const e = { ab, def, fx, t: 0, portatore: o.portatore || null }
  fxAttivi.push(e)
  sicuro('primo ' + ab.id, () => fx.aggiorna(0, 0))
  if (o.colpisce) programma(def.arrivo || 0, () => colpisci(o.colpisce, { danno: o.danno, elem: o.elem, tinta: o.tinta, scuote: !!def.scuote }))
  if (o.cura) programma(def.durata * 0.4, () => cura(o.cura, o.cura === eroeA ? 25 : 25))
  return e
}
function liberaFx (e) {
  const i = fxAttivi.indexOf(e); if (i >= 0) fxAttivi.splice(i, 1)
  sicuro('libera', () => e.fx.libera()); scena.remove(e.fx.gruppo)
}
function aggiornaFx (dt) {
  for (let k = 0; k < fxAttivi.length; k++) {
    const e = fxAttivi[k]; e.t += dt
    let vivo = true
    try { vivo = e.fx.aggiorna(e.t, dt) } catch (x) { errori.push(`${e.ab.id}: ${x.stack || x}`); vivo = false }
    if (e.fx.finito || (e.def.durata !== Infinity && e.t > e.def.durata + 0.15)) vivo = false
    if (vivo === false) { liberaFx(e); k-- }
  }
}
function tuttiGliStati (subito) {
  for (const e of fxAttivi.filter(e => e.def.durata === Infinity)) { if (subito) liberaFx(e); else sicuro('spegni', () => e.fx.spegni && e.fx.spegni()) }
}

// ───────── colpi, vita, numeri ─────────
const numeri = Array.from({ length: 12 }, () => { const el = document.createElement('div'); el.className = 'num'; el.style.display = 'none'; sopra.append(el); return { el, t: 9, pos: new Vector3() } })
function numero (att, testo, colore) {
  const n = numeri.find(x => x.t >= 1.1) || numeri[0]
  n.t = 0; n.el.textContent = testo; n.el.style.color = colore; n.el.style.display = ''
  petto(att, n.pos); n.pos.y = att.pettoY + att.h * 0.45; n.pos.x += rnd(-0.25, 0.25)
}
const hex = c => '#' + c.toString(16).padStart(6, '0')
function colpisci (att, { danno = Math.round(rnd(12, 30)), elem = 'fisico', tinta = null, scuote = false } = {}) {
  const r = att.rea
  r.t = 0; r.dur = scuote ? 0.5 : 0.34; r.scuote = scuote
  const rossa = att === eroeA && (elem === 'fisico' && tinta == null)
  r.col.set(rossa ? 0xff3a2a : tinta ?? (elem === 'fisico' ? 0xf2f5ff : COLORI[elem]))
  raccogliMat(att)
  att.hp = Math.max(S.duello ? 0 : 1, att.hp - danno); att.ferma = 0
  numero(att, '-' + danno, att === eroeA ? '#ff7a6a' : hex(tinta ?? COLORI[elem] ?? 0xffffff))
  if (att.hp <= 0 && !att.morte) att.morte = 0.0001
}
function cura (att, n) { att.hp = Math.min(att.hpMax, att.hp + n); numero(att, '+' + n, '#8ee36a') }

function aggiornaVita (att, dt) {
  att.rea.t += dt
  if (att.morte > 0) {
    att.morte += dt
    if (att.morte > 2.1) { att.morte = 0; att.hp = att.hpMax; att.rinasce = 0 }
  } else if (!S.duello) { att.ferma += dt; if (att.hp < att.hpMax && att.ferma > 1.5) att.hp = Math.min(att.hpMax, att.hp + 40 * dt) }
  att.rinasce += dt
  att.riempi.style.width = (100 * clamp01(att.hp / att.hpMax)) + '%'
}
/** Rinculo, scossa, caduta, rinascita: scrive la posizione e l'inclinazione del Group dell'attore. */
function applicaTrasformazione (att) {
  const r = att.rea, k = r.t < r.dur ? 1 - r.t / r.dur : 0
  let x = att.dx + r.dir * 0.32 * k * k, y = att.dy, z = att.dz, rotX = att.rotX - 0.22 * k, rotZ = att.rotZ, s = 1
  if (r.scuote && k > 0) { x += Math.sin(r.t * 70) * 0.09 * k; z += Math.cos(r.t * 63) * 0.07 * k; y += Math.abs(Math.sin(r.t * 50)) * 0.05 * k }
  if (att.morte > 0) {
    const c = smooth(att.morte / 0.7), fine = smooth((att.morte - 1.0) / 0.5)
    rotX -= 1.45 * c; y -= att.h * 0.18 * c; x += r.dir * 0.5 * c; s = 1 - 0.99 * fine
  } else if (att.rinasce < 0.4) s = 0.01 + 0.99 * smooth(att.rinasce / 0.4)
  att.rad.position.set(att.home.x + x, att.home.y + y, att.home.z + z)
  att.rad.rotation.set(rotX, att.rotY, rotZ); att.rad.scale.setScalar(s)
}
const bianco = new Color()
/** Prima del rendering: il lampo del colpo (emissivo) e la tinta degli stati; dopo si rimette tutto. */
function applicaColori (att) {
  const r = att.rea, k = r.t < r.dur ? Math.pow(1 - r.t / r.dur, 1.4) : 0
  let tinte = null
  for (const e of fxAttivi) if (e.portatore === att && e.fx.tintaCorpo && e.fx.forzaTinta > 0) (tinte ??= []).push(e.fx)
  att.coloriApplicati = k > 0.001 || !!tinte
  if (!att.coloriApplicati) return
  for (let i = 0; i < att.mats.length; i++) {
    const m = att.mats[i]; att.c0[i].copy(m.color); att.e0[i].copy(m.emissive); att.ei0[i] = m.emissiveIntensity
    if (tinte) for (const f of tinte) m.color.lerp(f.tintaCorpo, Math.min(1, f.forzaTinta))
    if (k > 0.001) { m.emissive.copy(att.e0[i]).lerp(r.col, Math.min(1, k)); m.emissiveIntensity = att.ei0[i] + (0.75 - att.ei0[i]) * k }
  }
}
function ripristinaColori (att) {
  if (!att.coloriApplicati) return
  for (let i = 0; i < att.mats.length; i++) { const m = att.mats[i]; m.color.copy(att.c0[i]); m.emissive.copy(att.e0[i]); m.emissiveIntensity = att.ei0[i] }
  att.coloriApplicati = false
}

// ───────── pose dell'eroe ─────────
function gambeInMarcia (e, passo, k) { const s = Math.sin(passo * 9) * k; e.userData.gambe[0].rotation.x = s * 0.7; e.userData.gambe[1].rotation.x = -s * 0.7 }
const effettoArmaDi = () => {
  if (S.effettoArma !== 'auto') return trovaAbilita(S.effettoArma)
  const a = S.arma ? perId(S.arma) : null, el = a ? ELEM_ARMA[a.elemento] : 'fisico'
  const A = (m, k) => trovaAbilita(m + '/' + k)
  if (!a) return A('mischia', 'urto')
  switch (a.famiglia) {
    case 'spada': return A('mischia', ['pugnale', 'stocco'].includes(a.id) ? 'affondo' : ['due-mani', 'claymore', 'spada-leggendaria'].includes(a.id) ? 'croce' : 'taglio')
    case 'ascia': return A('mischia', a.id === 'bipenne' ? 'spazzata' : a.id === 'ascia-vichinga' ? 'croce' : 'taglio')   // un'ascia taglia, non martella
    case 'arco': return A('lancio', a.id === 'balestra' ? 'quadrello' : el === 'fuoco' ? 'freccia-fuoco' : el === 'veleno' ? 'freccia-veleno' : 'freccia')
    default: return A('lancio', el === 'fuoco' || el === 'veleno' ? 'palla' : el === 'gelo' ? 'scheggia' : el === 'sacro' ? 'luce' : 'dardo')
  }
}
const elemArmaDi = () => { const a = S.arma ? perId(S.arma) : null; return a ? ELEM_ARMA[a.elemento] : 'fisico' }

/** L'eroe usa l'effetto `ab` con la posa adatta. `tipo`: 'mischia' (scatto e fendente), 'arco', 'lancio' (alza la staffa), 'su-me' (braccia in alto) o 'stato' (niente posa). */
function eroeAgisce (ab, elem, tipo, danno) {
  const e = eroeA, def = ab.def, B = mostroA
  const bers = !['su-me', 'stato', 'su-chi'].includes(def.via) || def.via === 'su-chi'
  const lancia = (da, a, extra = {}) => {
    const ctx = { da, a, elem, scala: tipo === 'arco' ? 0.8 : 1, danno, ...extra }
    switch (def.via) {
      case 'su-me': piedi(e, ctx.da); piedi(B, ctx.a); ctx.scala = e.h; if (/cura|preghiera|colonna/.test(ab.chiave)) ctx.cura = e; break
      case 'su-chi': piedi(e, ctx.da); piedi(B, ctx.a); ctx.scala = Math.max(0.8, B.h); ctx.colpisce = B; break
      case 'stato': { const c = S.statoSu === 'eroe' ? e : B; piedi(c, ctx.da); piedi(c, ctx.a); ctx.scala = Math.max(0.8, c.h); ctx.portatore = c; break }
      default: ctx.colpisce = B; if (tipo !== 'arco') ctx.scala = MathUtils.clamp(B.h / 1.5, 0.75, 1.6)
    }
    if (def.via === 'stato') { const c = ctx.portatore; for (const x of fxAttivi.filter(x => x.portatore === c && x.def.durata === Infinity)) sicuro('spegni', () => x.fx.spegni()) }
    return spara(ab, ctx)
  }
  const mano = (out) => { out.copy(petto(e, out)); out.x += 0.3; out.y = e.pettoY + 0.15; return out }
  if (tipo === 'stato') { lancia(piedi(e, new Vector3()), piedi(B, new Vector3())); return }
  if (tipo === 'mischia') {
    const raggio = Math.max(0, B.home.x - B.frontZ - (e.home.x + 0.75)) , tHit = 0.42, S0 = Math.max(0, tHit - (def.arrivo || 0))
    avvia(1.0, t => {
      const p = t < 0.3 ? smooth(t / 0.3) : t < 0.42 ? 1 - smooth((t - 0.3) / 0.12) : 0
      posaGuardia(e.obj, T); posaColpo(e.obj, p)
      const dx = raggio * (smooth(t / 0.3) * (1 - smooth((t - 0.62) / 0.33)))
      e.dx = dx; e.rotX = 0.1 * bump(t, 0.25, 0.4, 0.42, 0.6)
      gambeInMarcia(e.obj, t, dx > 0.02 && dx < raggio - 0.02 ? 1 : 0.25 * bump(t, 0, 0.3, 0.62, 0.95))
    }, [[S0, () => lancia(mano(vP).clone(), petto(B, vQ).clone())]])
    return
  }
  if (tipo === 'arco') {
    const tR = 0.64
    avvia(1.25, t => {
      const e0 = e.obj, u = e0.userData, [bs, bd] = u.bracci, pa = u.perniArmi, k = bump(t, 0, 0.5, tR, tR + 0.28), c = smooth((t - tR) / 0.08) * (1 - smooth((t - tR - 0.08) / 0.3))
      posaGuardia(e0, T)
      verso(bs.rotation, -1.5, 0, 0.05, k)
      if (pa && pa.sinistra) pa.sinistra.rotation.x += (1.5 - pa.sinistra.rotation.x) * k
      verso(bd.rotation, -1.2 + 0.25 * smooth((t - tR) / 0.1), 0.6, -0.5, k)
      u.busto.rotation.y += (-0.25 - u.busto.rotation.y) * k
      e.dx = -0.12 * c
    }, [[tR, () => lancia(mano(vP).clone(), petto(B, vQ).clone())]])
    return
  }
  // lancio o su-me: alza la staffa (o le braccia) e scaglia
  const tc = tipo === 'su-me' ? 0.4 : 0.38
  avvia(Math.max(1.0, tc + 0.55), t => {
    const u = e.obj.userData, [bs, bd] = u.bracci, k = bump(t, 0, tc * 0.9, tc + 0.2, tc + 0.6), spinta = bump(t, tc - 0.08, tc, tc + 0.05, tc + 0.25)
    posaGuardia(e.obj, T)
    const pd = u.perniArmi && u.perniArmi.destra
    if (tipo === 'su-me') { verso(bd.rotation, -2.7, 0, -0.35, k); verso(bs.rotation, -2.7, 0, 0.35, k) }
    else {
      verso(bd.rotation, -0.95 - 0.45 * spinta, 0, -0.1, k); verso(bs.rotation, -1.0 - 0.3 * spinta, 0, 0.55, k)
      if (pd && pd.children[0] && pd.children[0].userData.famiglia === 'staffa') pd.rotation.x = pd.userData.rx0 + (1.45 + 0.3 * spinta) * k   // la staffa punta in avanti e in alto
    }
    u.busto.rotation.x = -0.12 * k + 0.12 * spinta; e.dx = 0.25 * spinta
  }, [[tc, () => lancia(mano(vP).clone(), petto(B, vQ).clone())]])
}

function eroeAttaccaArma () {
  const ab = effettoArmaDi(), el = S.effettoArma === 'auto' || elemArmaDi() !== 'fisico' ? elemArmaDi() : elementoStandard(ab)
  const tipo = S.armaTipo === 'arco' ? 'arco' : (S.armaTipo === 'bacchetta') ? 'lancio' : 'mischia'
  const via = ab.def.via
  // se si forza un effetto da lancio con un'arma da mischia la posa è quella del lancio, e viceversa
  const t2 = tipo === 'arco' ? 'arco' : via === 'vicino' && tipo !== 'lancio' ? 'mischia' : (via === 'vicino' ? 'mischia' : (tipo === 'mischia' ? 'lancio' : tipo))
  eroeAgisce(ab, el, t2, Math.round(rnd(14, 30)))
  return ab.id
}
function eroeAbilita (chiave, elem) {
  const ab = trovaAbilita(chiave); if (!ab) { errori.push('abilità sconosciuta: ' + chiave); return null }
  const el = elem && elem !== 'auto' ? elem : elementoStandard(ab)
  const via = ab.def.via
  const tipo = via === 'vicino' ? 'mischia' : via === 'su-me' ? 'su-me' : via === 'stato' ? 'stato' : 'lancio'
  eroeAgisce(ab, el, tipo, Math.round(rnd(12, 32)))
  return ab.id
}

// ───────── il mostro attacca ─────────
const fantasia = { t: 0 }
function mostroAttacca (variante, danno = Math.round(rnd(8, 22))) {
  const m = mostroA, e = eroeA, u = m.obj.userData, def = m.def
  const att = (variante && u.attacchi && u.attacchi[variante]) || u.attacco
  const dragone = !!u.attacchi
  const eroePetto = () => petto(e, new Vector3())
  const elemM = def.elem || 'fisico'
  const sc = def.scala || 1
  const front = m.home.x - m.frontZ
  if (!u.attacca || !att) {                                   // mostro senza attacco proprio: un balzo qualunque
    const raggio = Math.max(0, front - (e.home.x + 1.0))
    avvia(0.8, t => { const k = bump(t, 0.1, 0.4, 0.45, 0.75); m.dx = -raggio * k; m.rotX = 0.35 * bump(t, 0.3, 0.45, 0.5, 0.7); m.dy = 0.15 * Math.sin(Math.PI * clamp01(t / 0.8)) },
      [[0.3, () => spara(trovaAbilita('mischia/colpo'), { da: petto(m, new Vector3()), a: eroePetto(), elem: 'fisico', colpisce: e, danno, scala: 1 })]])
    return 'generico'
  }
  const dur = att.durata, tHit = att.arrivo * dur, proj = att.proiettile
  const raggio = Math.max(0, front - (e.home.x + 1.0)) * (dragone ? 0.55 : 1)
  const dist = Math.max(0.5, front - e.home.x - 0.25)
  const eventi = []
  if (proj) {
    const P = PROIETTILE[proj.tipo]
    if (proj.tipo === 'soffio') eventi.push([tHit + 0.1, () => colpisci(e, { danno, elem: 'fuoco', scuote: true })])
    else if (P) {
      const ab = trovaAbilita(P.modulo + '/' + P.chiave)
      eventi.push([tHit, () => {
        const da = proj.origine ? (proj.origine.updateWorldMatrix(true, false), proj.origine.getWorldPosition(new Vector3())) : petto(m, new Vector3())
        const o = { da, a: eroePetto(), elem: P.elem || elemM, tinta: P.tinta ?? (def.tinta && P.chiave === 'palla' ? def.tinta : undefined), colpisce: e, danno }
        if (P.su) { piedi(e, o.da); piedi(e, o.a); o.scala = e.h; o.tinta = def.tinta ?? undefined }
        if (P.chiave === 'massi') { o.scala = 1 }
        spara(ab, o)
      }])
    } else eventi.push([tHit, () => colpisci(e, { danno, elem: elemM })])
  } else {
    const [mod, k] = SEGNO_COLPO[att.tipo] || ['mischia', 'colpo']
    const ab = trovaAbilita(mod + '/' + k), S0 = Math.max(0, tHit - (ab.def.arrivo || 0))
    eventi.push([S0, () => spara(ab, { da: petto(m, new Vector3()), a: eroePetto(), elem: elemM, colpisce: e, danno, scala: 1 })])
  }
  avvia(dur + 0.05, t => {
    const p = clamp01(t / dur)
    sicuro('attacca', () => u.attacca(p, variante || undefined, { distanza: dist * 1.25 / sc }))
    if (!proj) m.dx = -raggio * bump(p, 0, 0.35, 0.65, 1)
  }, eventi)
  return att.tipo
}

// ───────── il duello ─────────
const duello = { turno: 0, attesa: 0.3 }
const POOL = ['mischia/taglio', 'mischia/croce', 'mischia/affondo', 'mischia/urto', 'mischia/spazzata', 'mischia/turbine', 'mischia/radici', 'mischia/terremoto', 'mischia/onda', 'mischia/fiammata',
  'lancio/palla', 'lancio/dardo', 'lancio/scheggia', 'lancio/lancia', 'lancio/falce', 'lancio/fascio', 'lancio/catena', 'lancio/fulmine', 'lancio/luce', 'lancio/meteora', 'lancio/pioggia', 'lancio/massi', 'lancio/brace', 'lancio/nevicata',
  'aure/esplode', 'aure/rogo', 'aure/blocco', 'aure/sonno']
const SE = ['aure/scudo', 'aure/sfera', 'aure/pietra', 'aure/cura', 'aure/preghiera', 'aure/specchio', 'aure/muro', 'lancio/colonna']
const STATI = ['avvelenato', 'in-fiamme', 'gelato', 'stordito', 'sanguina', 'bloccato', 'fiacco', 'senza-difesa']
const scegli1 = l => l[Math.floor(Math.random() * l.length)]
function mossaEroe () {
  const r = Math.random()
  if (r < 0.42) return eroeAttaccaArma()
  if (r < 0.84) { const ab = trovaAbilita(scegli1(POOL)); return eroeAbilita(ab.id, 'auto') }
  if (r < 0.92) { const ab = trovaAbilita(scegli1(SE)); return eroeAbilita(ab.id, 'auto') }
  const prima = S.statoSu; S.statoSu = 'mostro'; const id = eroeAbilita(scegli1(STATI), 'auto'); S.statoSu = prima; return id
}
function aggiornaDuello (dt) {
  if (!S.duello) return
  if (occupato()) return
  duello.attesa -= dt
  if (duello.attesa > 0) return
  duello.attesa = 0.55
  if (duello.turno % 2 === 0) mossaEroe()
  else { const v = variantiMostro(); mostroAttacca(v.length ? scegli1(v) : undefined) }
  duello.turno++
}
function aggiornaMorti () {
  // quando uno dei due muore, l'altro resta in piedi; alla rinascita si riparte con la vita piena e senza stati
  if ((eroeA.morte > 2.1 || mostroA.morte > 2.1)) tuttiGliStati(true)
  if (S.duello && (eroeA.morte > 0 || mostroA.morte > 0)) { eroeA.hp = Math.max(eroeA.hp, 0); }
}

// ───────── la fila delle animazioni del mostro ─────────
const fila = { i: 0, attesa: 0.5 }
function aggiornaFila (dt) {
  if (!S.fila || S.duello || occupato()) return
  fila.attesa -= dt; if (fila.attesa > 0) return
  fila.attesa = 1.0
  const v = variantiMostro()
  const nome = v.length ? v[fila.i++ % v.length] : undefined
  if (nome) { S.variante = nome; pannello.sync({ varianti: null }) }
  mostroAttacca(nome)
}

// ───────── il fotogramma ─────────
const proiezione = new Vector3()
function disegnaOverlay () {
  const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight
  for (const a of [eroeA, mostroA]) {
    const visibile = S.duello || a.hp < a.hpMax
    a.barra.style.display = visibile ? '' : 'none'
    if (!visibile) continue
    proiezione.set(a.rad.position.x + a.off.x, a.h * (a.nome === 'mostro' ? 1.1 : 1.05) + 0.35, a.rad.position.z + a.off.z).project(cam)
    a.barra.style.transform = `translate(${((proiezione.x + 1) / 2 * w).toFixed(1)}px, ${((1 - proiezione.y) / 2 * h).toFixed(1)}px) translate(-50%, -50%)`
  }
  for (const n of numeri) {
    if (n.t >= 1.1) { if (n.el.style.display !== 'none') n.el.style.display = 'none'; continue }
    proiezione.copy(n.pos); proiezione.y += n.t * 0.9; proiezione.project(cam)
    n.el.style.transform = `translate(${((proiezione.x + 1) / 2 * w).toFixed(1)}px, ${((1 - proiezione.y) / 2 * h).toFixed(1)}px) translate(-50%, -50%) scale(${(0.85 + 0.5 * Math.min(1, n.t * 6)).toFixed(2)})`
    n.el.style.opacity = String(clamp01((1.1 - n.t) * 2.2))
  }
}
function fotogramma (dt) {
  T += dt
  const e = eroeA.obj, m = mostroA.obj
  // pose di base (idle), poi le azioni le coprono
  sicuro('anima eroe', () => { const u = e.userData; u.anima(T); if (u.animaArmatura) u.animaArmatura(T); if (u.animaCopricapo) u.animaCopricapo(T); animaArmi(e, T); posaGuardia(e, T) })
  for (const p of Object.values(e.userData.perniArmi || {})) { if (p.userData.rx0 === undefined) p.userData.rx0 = p.rotation.x; p.rotation.x = p.userData.rx0 }
  sicuro('anima mostro', () => m.userData.anima && m.userData.anima(T))
  for (const a of [eroeA, mostroA]) { a.dx = a.dy = a.dz = a.rotX = a.rotZ = 0 }
  aggiornaAzioni(dt)
  aggiornaFx(dt)
  for (const a of [eroeA, mostroA]) aggiornaVita(a, dt)
  aggiornaDuello(dt); aggiornaFila(dt)
  for (const n of numeri) n.t += dt
  for (const a of [eroeA, mostroA]) applicaTrasformazione(a)
}
function disegna () {
  applicaColori(eroeA); applicaColori(mostroA)
  renderer.render(scena, cam)
  ripristinaColori(eroeA); ripristinaColori(mostroA)
  disegnaOverlay()
}
/** Avanza di `dt` secondi di simulazione a passi di 1/60 (gli effetti a particelle vogliono passi piccoli). */
function passo (dt) { let r = dt; while (r > 1e-9) { const d = Math.min(r, 1 / 60); fotogramma(d); r -= d } disegna() }

let prima = performance.now()
function giro (ora) {
  const dt = Math.min(0.05, (ora - prima) / 1000); prima = ora
  const dts = S.pausa ? 0 : dt * S.velocita
  sicuro('fotogramma', () => { if (dts > 0) { let r = dts; while (r > 1e-9) { const d = Math.min(r, 1 / 30); fotogramma(d); r -= d } } else fotogramma(0); disegna() })
  requestAnimationFrame(giro)
}

// ───────── le azioni per il pannello e per i test ─────────
const EROE_CHIAVI = new Set(['eroe', 'arma', 'scudo', 'armatura', 'pregio', 'copricapo'])
function scegli (o) {
  let ricostruisciE = false, ricostruisciM = false, impugna = false
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue
    S[k] = typeof S[k] === 'boolean' ? !!v : (k === 'velocita' ? Number(v) : String(v))
    if (EROE_CHIAVI.has(k)) ricostruisciE = true
    if (k === 'mostro') ricostruisciM = true
    if (k === 'mArma' || k === 'mScudo') impugna = true
  }
  if ('arma' in o && S.arma && perId(S.arma) == null) { errori.push('arma sconosciuta: ' + S.arma); S.arma = '' }
  if (ricostruisciE) sicuro('costruisciEroe', costruisciEroe)
  if (ricostruisciM) { S.variante = ''; sicuro('costruisciMostro', costruisciMostro) }
  else if (impugna) impugnaMostro()
  if (ricostruisciM) { const v = variantiMostro(); S.variante = v[0] ?? '' }
  sincronizza()
}
function sincronizza () {
  const u = mostroA.obj && mostroA.obj.userData
  pannello.sync({ impugna: !!(u && u.impugna), varianti: variantiMostro() })
}
const az = {
  scegli,
  eroeAttacca: () => sicuro('eroeAttacca', eroeAttaccaArma),
  mostroAttacca: v => sicuro('mostroAttacca', () => mostroAttacca(v || (S.variante || undefined))),
  abilita: (c, el) => sicuro('abilita', () => eroeAbilita(c, el ?? S.elemento)),
  togliStati: () => tuttiGliStati(false),
  duello: on => { S.duello = !!on; duello.turno = 0; duello.attesa = 0.3; document.getElementById('b-duello').classList.toggle('on', S.duello); if (!S.duello) for (const a of [eroeA, mostroA]) { a.hp = a.hpMax } },
  pausa: on => { S.pausa = !!on; document.getElementById('b-pausa').textContent = S.pausa ? '▶' : '⏸' },
  passo: dt => { S.pausa = true; document.getElementById('b-pausa').textContent = '▶'; passo(dt) },
  pannello: on => { document.body.classList.toggle('senza-pannello', on === undefined ? undefined : !on); palco.impostaMargine(!document.body.classList.contains('senza-pannello')) },
  vista: () => palco.ripristina(),
}

// ───────── la pagina ─────────
const pannello = creaPannello({ S, az, mostri: MOSTRI })
document.getElementById('lato').append(pannello.el)
const barra = document.getElementById('barra')
const bott = (id, t, f, title) => { const b = document.createElement('button'); b.id = id; b.textContent = t; b.title = title || t; b.addEventListener('click', f); barra.append(b); return b }
bott('b-arma', 'Attacca', () => az.eroeAttacca(), 'Attacca con l\'arma')
bott('b-mostro', 'Mostro', () => az.mostroAttacca(), 'Il mostro attacca')
bott('b-duello', 'Duello', () => az.duello(!S.duello))
bott('b-pausa', '⏸', () => az.pausa(!S.pausa), 'Pausa / riprendi')
bott('b-passo', 'Passo', () => az.passo(1 / 30), 'Un fotogramma (1/30 s)')
bott('b-pann', '☰', () => az.pannello(document.body.classList.contains('senza-pannello')), 'Pannello')

// stato iniziale da indirizzo
const dalUrl = {}
for (const [k, p] of [['eroe', 'eroe'], ['arma', 'arma'], ['scudo', 'scudo'], ['copricapo', 'copricapo'], ['mostro', 'mostro'], ['mArma', 'armamostro'], ['mScudo', 'scudomostro'], ['elemento', 'elemento'], ['effettoArma', 'effetto'], ['statoSu', 'statosu']]) if (url.has(p)) dalUrl[k] = url.get(p)
if (url.has('armatura')) { const [t, g] = url.get('armatura').split(':'); dalUrl.armatura = t; if (g) dalUrl.pregio = g }
if (url.has('pregio')) dalUrl.pregio = url.get('pregio')
if (url.has('vel')) dalUrl.velocita = url.get('vel')
const DI_SERIE = { cavaliere: ['spada-lunga', 'scudo-rotondo', 'corazza'], elfa: ['arco-elfico', '', 'panciotto'], mago: ['bastone-fuoco', '', 'manto'], nano: ['ascia-nano', 'scudo-nanico', 'corazza'] }
{ const d = DI_SERIE[dalUrl.eroe || S.eroe]; if (d) { if (!('arma' in dalUrl)) S.arma = d[0]; if (!('scudo' in dalUrl)) S.scudo = d[1]; if (!('armatura' in dalUrl)) S.armatura = d[2] } }
Object.assign(S, dalUrl); S.velocita = Number(S.velocita)
if (url.get('pannello') === 'no') document.body.classList.add('senza-pannello', 'senza-barra')
if (innerWidth < 760 && !url.has('pannello')) document.body.classList.add('senza-pannello')
addEventListener('resize', () => palco.impostaMargine(!document.body.classList.contains('senza-pannello')))
palco.impostaMargine(!document.body.classList.contains('senza-pannello'))

sicuro('costruisciEroe', costruisciEroe)
if (S.mostro && !MOSTRI_PER_ID.has(S.mostro)) { errori.push('mostro sconosciuto: ' + S.mostro); S.mostro = 'scheletro' }
sicuro('costruisciMostro', costruisciMostro)
{ const v = variantiMostro(); S.variante = v[0] ?? '' }
sincronizza()
if (url.has('ang')) palco.vista.az = Number(url.get('ang'))
if (url.has('alt')) palco.vista.el = Number(url.get('alt'))
if (url.has('zoom')) palco.vista.dist /= Number(url.get('zoom'))
palco.aggiornaCamera()
for (const a of [eroeA, mostroA]) { a.riempi.style.width = '100%' }

// compila gli shader degli effetti una volta sola, per non avere scatti al primo uso
sicuro('prepara', () => import('../effetti-3d/aure.js').then(M => M.PREPARA && M.PREPARA(renderer, cam, THREE)).catch(() => {}))

window.__arena = {
  eroeAttacca: () => az.eroeAttacca(),
  mostroAttacca: v => az.mostroAttacca(v),
  abilita: (c, el) => az.abilita(c, el),
  scegli: o => scegli(o),
  passo: dt => passo(dt),
  duello: on => az.duello(on),
  pausa: on => az.pausa(on),
  colpisci: (chi, danno, elem) => colpisci(chi === 'eroe' ? eroeA : mostroA, { danno, elem: elem || 'fuoco' }),
  stato: () => ({ T, S: { ...S }, hp: [eroeA.hp, mostroA.hp], azioni: azioni.length, effetti: fxAttivi.map(e => e.ab.id), errori: errori.slice() }),
  elenco: () => ({ mostri: MOSTRI.map(m => m.id), abilita: [...ABILITA.keys()] }),
}

const pausaUrl = url.has('pausa')
if (pausaUrl) az.pausa(true)
const azione = url.get('azione'), tFinale = url.has('t') ? Number(url.get('t')) : null
if (azione) {
  const [cosa, ...resto] = azione.split(':'), arg = resto.join(':')
  if (cosa === 'attacca-arma') az.eroeAttacca()
  else if (cosa === 'abilita') az.abilita(arg, S.elemento)
  else if (cosa === 'attacca-mostro') az.mostroAttacca(arg || undefined)
  else if (cosa === 'duello') az.duello(true)
  else errori.push('azione sconosciuta: ' + azione)
}
if (tFinale != null) { if (pausaUrl) passo(tFinale); else if (azione) passo(tFinale); }
if (pausaUrl || tFinale != null) disegna()
window.__prova.ok = errori.length === 0
requestAnimationFrame(t => { prima = t; giro(t) })
