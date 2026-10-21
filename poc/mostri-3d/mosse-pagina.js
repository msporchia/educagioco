// La pagina delle mosse (poc/mosse-3d.html): un mostro di fronte all'eroe, le sue mosse a pulsante, e «a caso come nel gioco».
// Impianto copiato da poc/arena-3d/principale.js (azioni, effetti, colpi, vita); i moduli comuni si importano da ../arena-3d/.
// Il tempo è uno solo (T): ogni posa è una funzione pura di T o di p. Pausa = dt 0.
import * as THREE from 'three'
import { Group, Box3, Vector3, Color, MathUtils } from 'three'
import { creaEroe, posaGuardia } from '../eroi-3d/eroi.js'
import { equipaggia } from '../armi-3d/armi.js'
import { creaDaId } from '../armi-3d/collezione.js'
import { vesti } from '../armature-3d/armature.js'
import { creaPalco } from '../arena-3d/palco.js'
import { COLORI, trovaAbilita, SEGNO_COLPO, PROIETTILE } from '../arena-3d/dati.js'
import { creaDragoGrande, montaSoffio } from './draghi.js'
import { mosseDi, mossaGenerica, ruoloDi, elementoDi, specieDi, scegliMossa, registra, numeriDi, statoIniziale, N_MOSSE, MAX_CURE } from './mosse.js'
import { conMosse } from './mosse-anim.js'

const url = new URLSearchParams(location.search)
const errori = []
const vecchio = console.error
console.error = (...a) => { errori.push(a.map(String).join(' ').slice(0, 300)); vecchio.apply(console, a) }
addEventListener('error', e => errori.push(String(e.message)))
addEventListener('unhandledrejection', e => errori.push('promessa: ' + String(e.reason)))
window.__prova = { ok: false, errori, mosse: {} }
const sicuro = (nome, f) => { try { return f() } catch (e) { errori.push(`${nome}: ${e.stack || e}`); return undefined } }

const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x
const smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x) }
const BIANCO = new Color(1, 1, 1)
const rngSeme = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const rnd = rngSeme(Number(url.get('seme') || 7))
const rr = (a, b) => a + rnd() * (b - a)

// ───────── l'elenco dei mostri: ogni file di zona che esporta una lista di voci { chiave, crea } ─────────
const NOMI_ZONA = { prati: 'Prati', bosco: 'Bosco', brughiera: 'Brughiera', palude: 'Palude', ceneri: 'Ceneri', monte: 'Monte', landa: 'Landa' }
async function leggiElenco () {
  const moduli = import.meta.glob(['./*.js', '!./mosse*.js', '!./draghi*.js', '!./*-base.js', '!./*-grossi.js'])
  const voci = new Map()
  for (const [file, carica] of Object.entries(moduli)) {
    let M; try { M = await carica() } catch (e) { errori.push('carico ' + file + ': ' + e); continue }
    for (const lista of Object.values(M)) {
      if (!Array.isArray(lista) || !lista.length || typeof lista[0].crea !== 'function' || !lista[0].chiave) continue
      for (const v of lista) if (!voci.has(v.chiave)) voci.set(v.chiave, { ...v, gruppo: NOMI_ZONA[v.zona] || (file.includes('mostri.js') ? 'Sotterraneo' : v.zona || file) })
    }
  }
  const L = []
  for (const v of voci.values()) {
    const voce = { ...v }
    const e = { id: v.chiave, nome: v.nome, gruppo: v.gruppo, voce, crea: v.crea, scala: 1, elem: elementoDi(voce) }
    if (v.chiave === 'drago') { e.nome = 'Drago piccolo (soffia)'; e.elem = 'fuoco'; e.crea = () => { const d = v.crea(); montaSoffio(d); return d }; e.gruppo = 'Draghi' }
    if (v.chiave === 'drago-fiero') { e.gruppo = 'Draghi'; e.elem = 'fuoco' }
    L.push(e)
  }
  const elemDrago = { verde: 'veleno', azzurro: 'gelo', rosso: 'fuoco', nero: 'fulmine', oro: 'sacro' }
  for (const c of Object.keys(elemDrago)) L.push({ id: 'drago-' + c, nome: `Drago grande ${c}`, gruppo: 'Draghi', crea: () => creaDragoGrande(c), elem: elemDrago[c], scala: 0.4, voce: { chiave: 'drago-' + c, nome: `Drago grande ${c}`, ruolo: 'superboss', taglia: 'enorme', elemento: elemDrago[c] } })
  for (const e of L) { e.ruolo = ruoloDi(e.voce); e.voce.elemento = e.voce.elemento || e.elem }
  return L
}

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
    dx: 0, dy: 0, dz: 0, rotX: 0, rotZ: 0, rea: { t: 9, dur: 0.34, col: new Color(), dir: nome === 'eroe' ? -1 : 1 }, mats: [], c0: [], e0: [], ei0: [], coloriApplicati: false,
  }
  a.barra = document.createElement('div'); a.barra.className = 'hp'; a.barra.innerHTML = '<i></i><u></u>'
  a.riempi = a.barra.firstChild; sopra.append(a.barra)
  return a
}
const eroeA = nuovoAttore('eroe', XEROE, Math.PI / 2)
const mostroA = nuovoAttore('mostro', XEROE + GAP, -Math.PI / 2)

function misura (att, obj, scala) {
  const prova = new Group(); prova.scale.setScalar(scala); prova.add(obj); prova.updateMatrixWorld(true)
  const b = new Box3().setFromObject(prova), c = b.getCenter(new Vector3()), s = b.getSize(new Vector3())
  prova.remove(obj)
  const th = att.rotY, co = Math.cos(th), si = Math.sin(th)
  att.h = s.y; att.frontZ = b.max.z
  att.off.set(c.x * co + c.z * si, 0, -c.x * si + c.z * co)
  att.pettoY = MathUtils.clamp(c.y, 0.5, 1.8); att.larg = s.z
}
function raccogliMat (att) {
  att.mats.length = 0
  const visti = new Set()
  att.rad.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m && m.emissive && m.color && !visti.has(m)) { visti.add(m); att.mats.push(m) } })
  while (att.c0.length < att.mats.length) { att.c0.push(new Color()); att.e0.push(new Color()); att.ei0.push(0) }
}

function costruisciEroe () {
  const e = creaEroe('cavaliere'); e.updateMatrixWorld(true)
  eroeA.h = new Box3().setFromObject(e).getSize(new Vector3()).y
  sicuro('equipaggia', () => equipaggia(e, { destra: creaDaId('spada-lunga'), sinistra: creaDaId('scudo-rotondo') }))
  sicuro('vesti', () => vesti(e, 'corazza', 2))
  e.traverse(o => { if (o.isMesh) o.castShadow = true })
  eroeA.obj = e; eroeA.sc.add(e); eroeA.pettoY = eroeA.h * 0.58; eroeA.frontZ = 0.35
  raccogliMat(eroeA)
}

let ELENCO = [], PER_ID = new Map()
const S = { mostro: 'drago-rosso', velocita: 1, pausa: false, caso: false, protetto: false, rinforzo: 0 }
let st = statoIniziale()          // lo stato che serve alla scelta (vita del mostro, mosse fatte, rinforzo…)

function costruisciMostro () {
  azzeraAzioni(); tuttiGliStati()
  if (mostroA.obj) mostroA.sc.remove(mostroA.obj)
  const def = PER_ID.get(S.mostro) || ELENCO[0]
  const o = def.crea()
  o.userData.anima?.(0)
  // le mosse: quelle dell'elenco; se l'indirizzo chiede un tipo che il mostro non ha (`mossa=cura`), si aggiunge la generica
  let mosse = mosseDi(def.voce)
  const chiesta = url.get('mossa')
  if (chiesta && ['cura', 'incantesimo', 'urlo', 'attacco-forte'].includes(chiesta) && !mosse.some(m => m.id === chiesta || (m.tipo === chiesta && chiesta !== 'attacco-forte'))) {
    mosse = [...mosse, { ...mossaGenerica(chiesta, def.voce, chiesta), ...(chiesta === 'attacco-forte' ? {} : {}) }].map(m => ({ ...m }))
    mosse.at(-1).provvisoria = true
  }
  conMosse(o, def.voce, { scala: def.scala, mosse })
  o.userData.anima(0)
  o.traverse(m => { if (m.isMesh) m.castShadow = true })
  mostroA.def = def; mostroA.sc.scale.setScalar(def.scala)
  misura(mostroA, o, def.scala)
  mostroA.obj = o; mostroA.sc.add(o)
  mostroA.home.x = XEROE + GAP + mostroA.frontZ
  mostroA.rad.position.copy(mostroA.home)
  raccogliMat(mostroA)
  st = statoIniziale(); st.vitaMax = 100; st.vita = mostroA.hp = 100; mostroA.hp = 100
  const alto = Math.max(mostroA.h, 1.2), destra = mostroA.home.x + mostroA.off.x + Math.min(mostroA.larg * 0.5, 2.3), sinistra = XEROE - 1.5
  palco.inquadra((sinistra + destra) / 2, destra - sinistra, 0.45 + alto * 0.18)
  window.__prova.mosse[def.id] = o.userData.mosseElenco.map(m => m.id)
  pannello.mostra()
}

// ───────── il tempo: azioni, appuntamenti, effetti ─────────
let T = 0
const azioni = [], pendenti = [], fxAttivi = []
const occupato = () => azioni.length > 0 || pendenti.length > 0 || fxAttivi.some(e => e.def.durata !== Infinity)
function azzeraAzioni () { azioni.length = 0; pendenti.length = 0; for (const e of fxAttivi.slice()) liberaFx(e); eroeA.rea.t = mostroA.rea.t = 9; mostroA.obj?.userData.annuncia?.(null) }
function programma (ritardo, fn) { pendenti.push({ t: ritardo, fn }) }
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

function spara (ab, o) {
  const def = ab.def
  const tinta = new Color(o.tinta ?? COLORI[o.elem] ?? COLORI.fisico), tinta2 = tinta.clone().lerp(BIANCO, 0.45)
  const ctx = { da: o.da.clone(), a: o.a.clone(), tinta, tinta2, seme: rr(1, 40), altri: [], scala: o.scala ?? 1 }
  const fx = sicuro('crea ' + ab.id, () => def.crea(ctx)); if (!fx) return null
  scena.add(fx.gruppo)
  const e = { ab, def, fx, t: 0 }
  fxAttivi.push(e)
  sicuro('primo ' + ab.id, () => fx.aggiorna(0, 0))
  if (o.colpisce) programma(def.arrivo || 0, () => colpisci(o.colpisce, { danno: o.danno, elem: o.elem, tinta: o.tinta, scuote: !!def.scuote }))
  return e
}
function liberaFx (e) { const i = fxAttivi.indexOf(e); if (i >= 0) fxAttivi.splice(i, 1); sicuro('libera', () => e.fx.libera()); scena.remove(e.fx.gruppo) }
function aggiornaFx (dt) {
  for (let k = 0; k < fxAttivi.length; k++) {
    const e = fxAttivi[k]; e.t += dt
    let vivo = true
    try { vivo = e.fx.aggiorna(e.t, dt) } catch (x) { errori.push(`${e.ab.id}: ${x.stack || x}`); vivo = false }
    if (e.fx.finito || (e.def.durata !== Infinity && e.t > e.def.durata + 0.15)) vivo = false
    if (vivo === false) { liberaFx(e); k-- }
  }
}
function tuttiGliStati () { for (const e of fxAttivi.filter(e => e.def.durata === Infinity)) liberaFx(e) }

// ───────── colpi, vita, numeri ─────────
const numeri = Array.from({ length: 10 }, () => { const el = document.createElement('div'); el.className = 'num'; el.style.display = 'none'; sopra.append(el); return { el, t: 9, pos: new Vector3() } })
function numero (att, testo, colore) {
  const n = numeri.find(x => x.t >= 1.1) || numeri[0]
  n.t = 0; n.el.textContent = testo; n.el.style.color = colore; n.el.style.display = ''
  petto(att, n.pos); n.pos.y = att.pettoY + att.h * 0.45; n.pos.x += rr(-0.25, 0.25)
}
const hex = c => '#' + c.toString(16).padStart(6, '0')
function colpisci (att, { danno = 14, elem = 'fisico', tinta = null, scuote = false } = {}) {
  const r = att.rea
  r.t = 0; r.dur = scuote ? 0.5 : 0.34; r.scuote = scuote
  r.col.set(att === eroeA && elem === 'fisico' && tinta == null ? 0xff3a2a : tinta ?? (elem === 'fisico' ? 0xf2f5ff : COLORI[elem]))
  raccogliMat(att)
  att.hp = Math.max(att === eroeA ? 1 : 3, att.hp - danno)
  numero(att, '-' + danno, att === eroeA ? '#ff7a6a' : hex(tinta ?? COLORI[elem] ?? 0xffffff))
}
function aggiornaVita (att, dt) {
  att.rea.t += dt
  att.riempi.style.width = (100 * clamp01(att.hp / att.hpMax)) + '%'
}
function applicaTrasformazione (att) {
  const r = att.rea, k = r.t < r.dur ? 1 - r.t / r.dur : 0
  let x = att.dx + r.dir * 0.32 * k * k, y = att.dy, z = att.dz, rotX = att.rotX - 0.22 * k
  if (r.scuote && k > 0) { x += Math.sin(r.t * 70) * 0.09 * k; z += Math.cos(r.t * 63) * 0.07 * k }
  att.rad.position.set(att.home.x + x, att.home.y + y, att.home.z + z)
  att.rad.rotation.set(rotX, att.rotY, att.rotZ)
}
function applicaColori (att) {
  const r = att.rea, k = r.t < r.dur ? Math.pow(1 - r.t / r.dur, 1.4) : 0
  att.coloriApplicati = k > 0.001
  if (!att.coloriApplicati) return
  for (let i = 0; i < att.mats.length; i++) {
    const m = att.mats[i]; att.e0[i].copy(m.emissive); att.ei0[i] = m.emissiveIntensity
    m.emissive.copy(att.e0[i]).lerp(r.col, Math.min(1, k)); m.emissiveIntensity = att.ei0[i] + (0.75 - att.ei0[i]) * k
  }
}
function ripristinaColori (att) {
  if (!att.coloriApplicati) return
  for (let i = 0; i < att.mats.length; i++) { const m = att.mats[i]; m.emissive.copy(att.e0[i]); m.emissiveIntensity = att.ei0[i] }
  att.coloriApplicati = false
}

// ───────── il mostro esegue una mossa ─────────
const stato = { ultima: '', rinforzo: 0 }
const registro = []
const ultima = { id: null, tipo: null, T: -1 }
const dillo = t => { registro.unshift(t); registro.length = Math.min(registro.length, 7); pannello.registro(registro) }
function eseguiMossa (id, { annuncio = false } = {}) {
  const m = mostroA, e = eroeA, u = m.obj.userData, rt = u.mosse[id]
  if (!rt) { errori.push('mossa sconosciuta: ' + id); return null }
  const def = m.def, sc = def.scala || 1
  const eroePetto = () => petto(e, new Vector3())
  const front = m.home.x - m.frontZ
  const dist = Math.max(0.5, front - e.home.x - 0.25)
  const raggio = Math.max(0, front - (e.home.x + 1.0))
  const num = numeriDi(rt, { att: 14, vitaMax: 100, rinforzo: st.rinforzo })
  const danno = Math.round(num.colpo)
  const elemM = def.elem || 'fisico'
  const eventi = []
  for (const ev of rt.eventi) {
    const tt = ev.a * rt.durata
    switch (ev.che) {
      case 'colpo': {
        const proj = rt.proiettile
        if (proj) {
          const P = PROIETTILE[proj.tipo]
          if (proj.tipo === 'soffio') eventi.push([tt + 0.1, () => colpisci(e, { danno, elem: 'fuoco', scuote: true })])
          else if (P) eventi.push([tt, () => {
            const ab = trovaAbilita(P.modulo + '/' + P.chiave)
            const da = proj.origine ? (proj.origine.updateWorldMatrix(true, false), proj.origine.getWorldPosition(new Vector3())) : petto(m, new Vector3())
            const o = { da, a: eroePetto(), elem: P.elem || elemM, tinta: P.tinta, colisce: 0, colpisce: e, danno }
            if (P.su) { piedi(e, o.da); piedi(e, o.a); o.scala = e.h }
            spara(ab, o)
          }])
          else eventi.push([tt, () => colpisci(e, { danno, elem: elemM })])
        } else {
          const [mod, k] = SEGNO_COLPO[rt.colpo] || ['mischia', 'colpo']
          const ab = trovaAbilita(mod + '/' + k), S0 = Math.max(0, tt - (ab.def.arrivo || 0))
          eventi.push([S0, () => spara(ab, { da: petto(m, new Vector3()), a: eroePetto(), elem: elemM, colpisce: e, danno, scala: 1 })])
          if (rt.area) eventi.push([tt, () => { const t2 = trovaAbilita('mischia/terremoto'); if (t2) spara(t2, { da: piedi(m, new Vector3()), a: piedi(e, new Vector3()), elem: 'fisico', scala: 1 }) }])
        }
        break
      }
      case 'cura-fx': eventi.push([tt, () => { const ab = trovaAbilita('aure/cura'); if (ab) spara(ab, { da: piedi(m, new Vector3()), a: piedi(m, new Vector3()), tinta: rt.tinta, scala: Math.max(0.8, m.h * 0.8) }) }]); break
      case 'cura': eventi.push([tt, () => { m.hp = Math.min(m.hpMax, m.hp + num.recupero); st.vita = m.hp; numero(m, '+' + num.recupero, '#8ee36a') }]); break
      case 'incantesimo': eventi.push([tt, () => {
        const ab = trovaAbilita('lancio/' + rt.effetto); if (!ab) { errori.push('effetto sconosciuto ' + rt.effetto); return }
        const da = (rt.origine.updateWorldMatrix(true, false), rt.origine.getWorldPosition(new Vector3()))
        spara(ab, { da, a: eroePetto(), elem: rt.elemento, colpisce: e, danno, scala: 1 })
      }]); break
      case 'urlo': eventi.push([tt, () => { st.rinforzo = (rt.turni ?? 3) + 1; numero(m, 'ATT +' + Math.round((rt.piu ?? 0.25) * 100) + '%', '#ffc83a') }]); break
    }
  }
  avvia(rt.durata + 0.05, t => {
    const p = clamp01(t / rt.durata)
    const r = rt.anima(p, { distanza: dist * 1.25 / sc }) || {}
    m.dx = -raggio * (r.avanza || 0)
    m.dy = (r.dyMondo || 0)
  }, eventi)
  registra(st, rt); ultima.id = id; ultima.tipo = rt.tipo; ultima.T = T
  if (!annuncio) dillo(`${rt.nome} (${rt.tipo})${num.colpo ? ' · danno ' + danno : num.recupero ? ' · +' + num.recupero + ' vita' : ''}`)
  return rt
}

// ───────── «a caso come nel gioco» ─────────
const caso = { fase: 'eroe', t: 0, prossima: null, colpi: 0 }
function aggiornaCaso (dt) {
  if (!S.caso || occupato()) return
  caso.t += dt
  const m = mostroA, u = m.obj.userData
  if (caso.fase === 'eroe') {
    if (!caso.colpito) {   // l'eroe colpisce (appena finito il turno del mostro): la vita del mostro cala
      caso.colpito = true
      const d = Math.round(rr(8, 12)); colpisci(m, { danno: d, elem: 'fisico' }); st.vita = m.hp
      eroeA.hp = Math.max(eroeA.hp, 70)
    }
    if (caso.t < 0.8) return
    st.protetto = S.protetto
    const mosse = u.mosseElenco
    caso.prossima = scegliMossa(mosse, st, rnd, m.def.ruolo)
    u.annuncia(caso.prossima.id)
    caso.fase = 'annuncio'; caso.t = 0; caso.colpito = false
    dillo(`annuncia: ${caso.prossima.nome} · vita ${Math.round(m.hp)}%`)
  } else if (caso.fase === 'annuncio') {
    if (caso.t < 1.3) return
    u.annuncia(null)
    eseguiMossa(caso.prossima.id, { annuncio: true })
    dillo(`${caso.prossima.nome} (${caso.prossima.tipo})`)
    caso.fase = 'eroe'; caso.t = 0
  }
}

// ───────── il fotogramma ─────────
const proiezione = new Vector3()
function disegnaOverlay () {
  const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight
  for (const a of [eroeA, mostroA]) {
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
  sicuro('anima eroe', () => { const u = e.userData; u.anima(T); if (u.animaArmatura) u.animaArmatura(T); posaGuardia(e, T) })
  sicuro('anima mostro', () => m.userData.anima && m.userData.anima(T))
  for (const a of [eroeA, mostroA]) { a.dx = a.dy = a.dz = a.rotX = a.rotZ = 0 }
  aggiornaAzioni(dt); aggiornaFx(dt)
  for (const a of [eroeA, mostroA]) aggiornaVita(a, dt)
  aggiornaCaso(dt)
  for (const n of numeri) n.t += dt
  for (const a of [eroeA, mostroA]) applicaTrasformazione(a)
}
function disegna () {
  applicaColori(eroeA); applicaColori(mostroA)
  renderer.render(scena, cam)
  ripristinaColori(eroeA); ripristinaColori(mostroA)
  disegnaOverlay()
}
function passo (dt) { let r = dt; while (r > 1e-9) { const d = Math.min(r, 1 / 60); fotogramma(d); r -= d } disegna() }
let prima = performance.now()
function giro (ora) {
  const dt = Math.min(0.05, (ora - prima) / 1000); prima = ora
  const dts = S.pausa ? 0 : dt * S.velocita
  sicuro('fotogramma', () => { if (dts > 0) { let r = dts; while (r > 1e-9) { const d = Math.min(r, 1 / 30); fotogramma(d); r -= d } } else fotogramma(0); disegna() })
  requestAnimationFrame(giro)
}

// ───────── il pannello ─────────
const h = (tag, attr = {}, ...figli) => {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(attr)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v) }
  for (const f of figli.flat()) if (f != null) e.append(f)
  return e
}
const ETICHETTA = { comune: 'comune', forte: 'forte', boss: 'boss', superboss: 'super boss' }
const pannello = (() => {
  const sel = h('select', { id: 'sel-mostro' })
  const elenco = h('div', { id: 'mosse' }), info = h('div', { class: 'info', id: 'info' }), log = h('div', { class: 'registro', id: 'registro' })
  const cCaso = h('input', { type: 'checkbox', id: 'caso' }), cProt = h('input', { type: 'checkbox', id: 'protetto' })
  const vita = h('input', { type: 'range', min: '5', max: '100', value: '100', id: 'vita' }), etVita = h('b', {}, '100%')
  const vel = h('input', { type: 'range', min: '0.1', max: '2', step: '0.05', value: '1', id: 'velocita' })
  sel.addEventListener('change', () => scegliMostro(sel.value))
  cCaso.addEventListener('change', () => az.caso(cCaso.checked))
  cProt.addEventListener('change', () => { S.protetto = cProt.checked })
  vita.addEventListener('input', () => az.vita(Number(vita.value)))
  vel.addEventListener('input', () => { S.velocita = Number(vel.value) })
  const generiche = h('div', { class: 'bott' })
  const el = h('aside', { id: 'pannello' },
    h('header', {}, h('b', {}, 'Le mosse dei mostri'), h('button', { onclick: () => az.pannello(false), type: 'button' }, '✕')),
    h('p', { class: 'nota' }, 'Scegli un mostro, premi una mossa. «A caso» applica la regola di scelta del gioco: la vita del mostro cala a ogni colpo dell\'eroe.'),
    h('label', { class: 'riga' }, h('span', {}, 'Mostro'), sel), info, elenco,
    h('p', { class: 'nota' }, 'Prova una mossa che il mostro non ha (generica):'), generiche,
    h('div', { class: 'bott' },
      h('button', { class: 'forte', id: 'b-caso', type: 'button', onclick: () => az.caso(!S.caso) }, 'Mosse a caso come nel gioco')),
    h('label', { class: 'riga' }, h('span', {}, 'Eroe protetto'), cProt),
    h('label', { class: 'riga' }, h('span', {}, 'Vita del mostro'), h('span', { class: 'due' }, vita, etVita)),
    h('label', { class: 'riga' }, h('span', {}, 'Velocità'), vel),
    h('div', { class: 'bott' }, h('button', { type: 'button', onclick: () => az.pausa(!S.pausa) }, 'Pausa / Riprendi'), h('button', { type: 'button', onclick: () => az.passo(0.1) }, 'Passo 0,1 s')),
    log)
  function riempiSelect () {
    sel.textContent = ''
    const gruppi = [['superboss', 'Super boss (3 mosse)'], ['boss', 'Boss (2 mosse)'], ['forte', 'Forti (2 mosse)'], ['comune', 'Comuni (1 mossa)']]
    for (const [r, t] of gruppi) {
      const og = h('optgroup', { label: t })
      for (const d of ELENCO.filter(x => x.ruolo === r)) og.append(h('option', { value: d.id }, `${d.nome} [${d.gruppo}]`))
      if (og.children.length) sel.append(og)
    }
  }
  function mostra () {
    const d = mostroA.def, u = mostroA.obj.userData, rt = u.mosseElenco
    if (sel.value !== d.id) sel.value = d.id
    info.textContent = `${ETICHETTA[d.ruolo]} · ${specieDi(d.voce)} · elemento ${elementoDi(d.voce)} · ${rt.filter(m => !m.provvisoria).length} mosse (attese: ${N_MOSSE[d.ruolo]})`
    elenco.textContent = ''
    for (const m of rt) {
      const b = h('button', { class: 'mossa', 'data-mossa': m.id, type: 'button', onclick: () => az.mossa(m.id), style: `border-left:6px solid ${hex(m.colore)}` },
        h('b', {}, m.nome), h('span', {}, ` ${m.tipo}${m.provvisoria ? ' (generica, in prova)' : ''}`),
        h('small', {}, [m.perche, m.condizione ? 'quando: ' + m.condizione : null, `peso ${m.peso ?? 1}`, m.mod && m.mod !== 1 ? `danno ×${m.mod}` : null, m.attesa && m.attesa !== 1 ? `attesa ×${m.attesa}` : null].filter(Boolean).join(' · ')))
      elenco.append(b)
    }
    generiche.textContent = ''
    for (const t of ['cura', 'incantesimo', 'urlo', 'attacco-forte']) {
      if (t !== 'attacco-forte' && rt.some(m => m.tipo === t)) continue
      generiche.append(h('button', { type: 'button', onclick: () => az.generica(t) }, '+ ' + t))
    }
    vita.value = String(Math.round(mostroA.hp)); etVita.textContent = Math.round(mostroA.hp) + '%'
  }
  return { el, mostra, riempiSelect, registro: l => { log.textContent = ''; for (const r of l) log.append(h('div', {}, r)) }, setVita: v => { vita.value = String(v); etVita.textContent = Math.round(v) + '%' }, caso: on => { cCaso.checked = on; document.getElementById('b-caso')?.classList.toggle('on', on) } }
})()

function scegliMostro (id) {
  S.mostro = id; azzeraAzioni(); sicuro('costruisciMostro', costruisciMostro)
}
const az = {
  mossa: id => { azzeraAzioni(); mostroA.obj.userData.annuncia(null); S.caso && az.caso(false); return sicuro('mossa', () => eseguiMossa(id)) },
  generica: tipo => {
    const def = mostroA.def
    const mosse = [...mosseDi(def.voce), mossaGenerica(tipo, def.voce, tipo + '-prova')].map(m => ({ ...m }))
    mosse.at(-1).provvisoria = true
    const o = def.crea(); if (def.id === 'drago') montaSoffio(o)
    sicuro('rifai', () => {
      azzeraAzioni(); if (mostroA.obj) mostroA.sc.remove(mostroA.obj)
      o.userData.anima?.(0); conMosse(o, def.voce, { scala: def.scala, mosse }); o.userData.anima(0)
      o.traverse(m => { if (m.isMesh) m.castShadow = true })
      mostroA.obj = o; mostroA.sc.add(o); raccogliMat(mostroA); pannello.mostra()
      eseguiMossa(tipo + '-prova')
    })
  },
  caso: on => { S.caso = !!on; caso.fase = 'eroe'; caso.t = 0; pannello.caso(S.caso); if (!S.caso) mostroA.obj?.userData.annuncia(null); else { azzeraAzioni() } },
  vita: v => { mostroA.hp = v; st.vita = v; pannello.setVita(v) },
  pausa: on => { S.pausa = !!on },
  passo: dt => { S.pausa = true; passo(dt) },
  pannello: on => { document.body.classList.toggle('senza-pannello', !on); palco.impostaMargine(on) },
}

// ───────── l'avvio ─────────
document.getElementById('lato').append(pannello.el)
if (url.get('pannello') === 'no') document.body.classList.add('senza-pannello')
if (innerWidth < 760 && !url.has('pannello')) document.body.classList.add('senza-pannello')
addEventListener('resize', () => palco.impostaMargine(!document.body.classList.contains('senza-pannello')))
palco.impostaMargine(!document.body.classList.contains('senza-pannello'))

;(async () => {
  sicuro('costruisciEroe', costruisciEroe)
  ELENCO = await leggiElenco(); PER_ID = new Map(ELENCO.map(m => [m.id, m]))
  // l'ordine: prima quelli con più mosse
  ELENCO.sort((a, b) => N_MOSSE[b.ruolo] - N_MOSSE[a.ruolo])
  pannello.riempiSelect()
  if (url.has('mostro')) S.mostro = url.get('mostro')
  if (!PER_ID.has(S.mostro)) { errori.push('mostro sconosciuto: ' + S.mostro); S.mostro = 'drago-rosso' }
  sicuro('costruisciMostro', costruisciMostro)
  if (url.has('ang')) palco.vista.az = Number(url.get('ang'))
  if (url.has('alt')) palco.vista.el = Number(url.get('alt'))
  if (url.has('zoom')) palco.vista.dist /= Number(url.get('zoom'))
  palco.aggiornaCamera()
  if (url.has('vita')) az.vita(Number(url.get('vita')))
  if (url.get('protetto') === '1') { S.protetto = true; document.getElementById('protetto').checked = true }
  document.getElementById('b-caso') // presente
  window.__mosse = {
    /** per gli scatti: avanza fino a quando il mostro (a caso) comincia una mossa di quel tipo, poi di `extra` secondi. */
    vaiA: (tipo, extra = 0.5, max = 90) => { S.pausa = true; for (let i = 0; i < max * 30 && ultima.tipo !== tipo; i++) passo(1 / 30); ultima.tipo === tipo && passo(extra); return ultima.tipo === tipo },
    /** avanza fino all'annuncio di una mossa di quel tipo (l'icona sul mostro), poi di `extra` secondi. */
    vaiAnnuncio: (tipo, extra = 0.5, max = 90) => { S.pausa = true; for (let i = 0; i < max * 30 && !(caso.fase === 'annuncio' && caso.prossima?.tipo === tipo); i++) passo(1 / 30); passo(extra); return caso.prossima?.tipo === tipo },
    esegui: id => az.mossa(id), passo: dt => passo(dt), caso: on => az.caso(on), pausa: on => az.pausa(on),
    elenco: () => ELENCO.map(m => ({ id: m.id, ruolo: m.ruolo, mosse: mosseDi(m.voce).map(x => x.id) })),
    stato: () => ({ T, hp: [eroeA.hp, mostroA.hp], azioni: azioni.length, effetti: fxAttivi.map(e => e.ab.id), st: JSON.parse(JSON.stringify(st)), errori: errori.slice() }),
  }
  const pausaUrl = url.has('pausa'), tFinale = url.has('t') ? Number(url.get('t')) : null
  if (pausaUrl) az.pausa(true)
  const mossa = url.get('mossa')
  if (url.get('annuncio') && mostroA.obj.userData.mosse[url.get('annuncio')]) mostroA.obj.userData.annuncia(url.get('annuncio'))
  if (url.get('caso') === '1') { az.caso(true) }
  else if (mossa) {
    const rt = mostroA.obj.userData.mosseElenco.find(m => m.id === mossa) || mostroA.obj.userData.mosseElenco.find(m => m.tipo === mossa)
    if (rt) eseguiMossa(rt.id); else errori.push('mossa sconosciuta: ' + mossa)
  }
  if (tFinale != null) passo(tFinale)
  if (pausaUrl || tFinale != null) disegna()
  window.__prova.ok = errori.length === 0
  window.__prova.pronta = true
  requestAnimationFrame(t => { prima = t; giro(t) })
})()
