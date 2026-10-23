// L'eroe come modello 3D (in prova): al posto dello sprite, uno dei quattro personaggi di `eroi3d/` (cavaliere, elfa, mago, nano) con
// le armi dell'inventario in mano. `disegnaEroe` (eroe.js) gli passa lo stato (dove sta, dove guarda, se cammina, se assalta, il lampo
// della ferita o della cura, la trasparenza del portale) e lui muove i perni. Spento con `#eroe2d` nell'indirizzo: torna lo sprite.
import { Vector3, Color, Group, Box3 } from 'three'
import { creaEroe, posaMarcia, posaColpo, posaGuardia, CHIAVI } from './eroi3d/eroi.js'
import { equipaggia } from './eroi3d/armi.js'
import { vesti, TIPI } from './eroi3d/armature.js'
import { copri } from './eroi3d/copricapi.js'
import { dotazioneDi } from './anteprime3d-pura.js'
import { creaPezzo, vestiFigura, indossaGioiello } from './roba3d.js'
import { studia, saldaTutto, osso, copiaMateriale, lampoFuso } from './salda3d.js'
import { ACCESI } from './costanti.js'

export const eroe3dAcceso = () => typeof location === 'undefined' || !/[#&?]eroe2d\b/.test(location.hash + location.search)

// quanto è alto il personaggio rispetto allo sprite che sostituisce (le colonne dei sotterranei arrivano più o meno lì)
const ALTEZZA_SPRITE = 0.72
const ROSSO = new Color(1, 0.18, 0.12), VERDE = new Color(0.3, 1, 0.55)
const _v = new Vector3()
// quale figura e quale modello per quale oggetto stanno in roba3d.js (docs/sotterraneo/roba-3d.md): li usano anche le anteprime

/**
 * Veste un eroe 3D (`creaEroe`) con la roba: `roba` = { mano, mancina, corpo, collo, testa } (chiavi degli oggetti). La stessa per l'eroe in scena
 * e per le anteprime (anteprime3d.js). → `togli()`.
 */
export const vestiEroe = (g, roba = {}) => vestiDotazione(g, dotazioneDi(roba))

/** Lo stesso con la dotazione già decisa (`dotazioneDi`: i pezzi 3D, l'armatura col pregio, la collana). → `togli()`. */
export function vestiDotazione(g, d) {
  // in mano l'alone è più piccolo che da solo nella casella: addosso all'eroe copriva la faccia
  const destra = creaPezzo(d.destra, { scalaAlone: 0.8 }), sinistra = creaPezzo(d.sinistra, { scalaAlone: 0.8 })
  const togliArma = equipaggia(g, { destra, sinistra })
  // la veste della figura (il modulo vesti) o l'armatura di sempre col pregio della rarità
  const togliCorpo = !d.corpo ? null
    : (d.corpo.figura && vestiFigura(g, d.corpo.figura)) || (TIPI.includes(d.corpo.tipo) ? vesti(g, d.corpo.tipo, d.corpo.pregio) : null)
  const togliCollo = d.collo ? indossaGioiello(g, d.collo) : null
  const collana = togliCollo && togliCollo.gruppo
  // le fiamme e i bagliori delle armi vive vanno animati (da soli sono enormi), e gli aloni della rarità
  g.userData.armiAnima = [destra, sinistra, collana].filter(a => a && (a.userData.anima || a.userData.animaAlone))
  // il copricapo della casella `testa` (docs/sotterraneo/elmo.md); `#testa=elmo-cornuto` nell'indirizzo resta la prova, e vince sulla casella
  const prova = (/[#&?]testa=([\w-]+)/.exec(typeof location === 'undefined' ? '' : location.hash + location.search) || [])[1]
  const idTesta = prova || (d.testa && d.testa.id) || null
  let togliTesta = null
  try { togliTesta = idTesta ? copri(g, idTesta) : null } catch (e) { togliTesta = null }   // un modello che non c'è: resta quello di serie
  return () => { togliArma(); g.userData.armiAnima = null; if (togliCorpo) togliCorpo(); if (togliCollo) togliCollo(); if (togliTesta) togliTesta() }
}

/** Ogni istanza ha i suoi materiali (il lampo cambia l'emissivo di uno solo); torna l'elenco per tingerli. */
function clonaMateriali(radice) {
  const nuovi = new Map(), lista = []
  radice.traverse(o => {
    if (!o.isMesh || osso(o)) return
    const m = o.material
    if (!m || Array.isArray(m)) return
    if (!nuovi.has(m)) {
      const c = copiaMateriale(m); nuovi.set(m, c)   // un fuso della pelle si porta dietro il suo shader
      if (c.emissive) lista.push({ m: c, e: c.emissive.clone(), ei: c.emissiveIntensity, tr: c.transparent, op: c.opacity })   // un materiale senza luce propria (i gioielli) non lampeggia
    }
    o.material = nuovi.get(m)
    o.castShadow = false                                 // l'ombra del cono è per le pareti; l'eroe non ne fa (come lo sprite)
  })
  return lista
}

/** Le pose di un fotogramma: la guardia di fondo, la marcia se cammina, il colpo (0..1) se assalta, e quello che si anima da sé. */
export function posa(g, t, cammina, colpo) {
  posaGuardia(g, t * 0.12)
  if (cammina) posaMarcia(g, t * 0.9)
  if (colpo != null) posaColpo(g, colpo)
  if (g.userData.anima) g.userData.anima(t * 0.12)
  if (g.userData.animaArmatura) g.userData.animaArmatura(t * 0.12)
  if (g.userData.armiAnima) for (const w of g.userData.armiAnima) {
    if (w.userData.anima) w.userData.anima(t * 0.12)
    if (w.userData.animaAlone) w.userData.animaAlone(t)
  }
}

// L'eroe vestito si salda come i mostri (salda3d.js): vestito di tutto erano ~130 chiamate di disegno, la voce più cara dello scontro
// (docs/sotterraneo/prestazioni-3d.md). Chi si muove lo dicono le pose stesse, provate su ~90 s di guardia (i gesti ogni 5-8 s), a
// passi alterni con la marcia, e col colpo; le mesh ferme si saldano, e il resto va nella pelle. Gli indici valgono per lo stesso
// eroe con la stessa roba. `pelle` falso: solo la saldatura (le misure di prima).
const saldabili = new Map()
export function saldaEroe(g, chiave, { pelle = true } = {}) {
  posa(g, 0, false, null)   // la prima posa aggiunge pezzi (il mago): gli indici si contano dopo
  g.traverse(o => { o.castShadow = false })   // come fa poi clonaMateriali: l'eroe non fa ombra, e chi la faceva non resta a sé
  if (!saldabili.has(chiave)) {
    const prove = { anima: t => posa(g, t, (t * 7) % 2 > 1, null), attacca: p => posaColpo(g, p) }   // sopra la posa di adesso, come in aggiorna
    if (saldabili.size > 40) saldabili.clear()
    saldabili.set(chiave, studia(g, prove, { prove: 240, passo: 3.1 }))
  }
  saldaTutto(g, saldabili.get(chiave), { ombre: true, pelle })
}

/** `scena`: dove si aggiunge. Torna `{ aggiorna(...), toglie() }`. */
export function creaEroe3d(scena) {
  const radice = new Group(); radice.visible = false; scena.add(radice)
  let chiave = null, g = null, tinte = [], altezza = 1, firma = '', ultimaTinta = ''

  function monta(corsa) {
    firma = ''; equipa(corsa)
    // l'altezza vera, cappello compreso: il mago è più alto del cavaliere e non deve sbucare sopra le colonne
    altezza = new Box3().setFromObject(g).getSize(new Vector3()).y || 1
    if (typeof window !== 'undefined') (window.__eroe3dAltezze = window.__eroe3dAltezze || {})[chiave] = altezza
  }

  function equipa(corsa) {
    const f = `${corsa.mano || ''}|${corsa.mancina || ''}|${corsa.corpo || ''}|${corsa.collo || ''}|${corsa.testa || ''}`
    if (f === firma) return
    firma = f
    // saldato, l'eroe non si sveste più pezzo per pezzo: si rifà da capo (le geometrie e i materiali di serie stanno in cache)
    if (g) {
      radice.remove(g)
      g.traverse(o => { if (o.userData.saldata) o.geometry.dispose() })
      if (g.userData.scheletro) g.userData.scheletro.dispose()
      for (const t of tinte) t.m.dispose()
    }
    g = creaEroe(chiave); radice.add(g)
    vestiEroe(g, corsa)
    try { if (ACCESI.saldatura) saldaEroe(g, `${chiave}|${f}`, { pelle: ACCESI.pelle }) } catch (e) { console.warn('eroe 3D: non si salda', e) }   // resta com'è, solo più caro
    tinte = clonaMateriali(g)
    ultimaTinta = ''
  }

  return {
    get altezza() { return altezza },
    /** Un passo. `p`: { x, z, trasparenza, dt, t, alto } con `alto` quanto è alto lo sprite che sostituisce (per la scala). */
    aggiorna(e, corsa, { x, z, y = 0, trasparenza, dt, alto }) {
      const nuova = CHIAVI.includes(corsa.io && corsa.io.sprite) ? corsa.io.sprite : 'cavaliere'
      if (nuova !== chiave) { chiave = nuova; monta(corsa) } else equipa(corsa)
      radice.visible = trasparenza > 0.02
      const k = (alto || 1.4) * ALTEZZA_SPRITE / altezza
      radice.scale.setScalar(k)
      radice.position.set(x, y, z)
      g.rotation.y = Math.atan2(e.lx, e.lz)
      posa(g, e.t, e.cammina, e.assalto ? Math.min(1, e.assalto.t / Math.max(0.01, e.assalto.picco)) : null)
      // il lampo
      const rosso = Math.min(1, e.colpito * 2), verde = Math.min(1, e.cura * 1.2)
      const tinta = `${rosso.toFixed(2)}|${verde.toFixed(2)}|${trasparenza.toFixed(2)}`
      if (tinta !== ultimaTinta) {
        ultimaTinta = tinta
        for (const t of tinte) {
          // un fuso largo della pelle ha l'emissivo nei vertici: il lampo glielo dà il suo shader (salda3d.js)
          if (rosso > 0) { if (!lampoFuso(t.m, ROSSO, rosso, 1, rosso * 0.9)) { t.m.emissive.copy(t.e).lerp(ROSSO, rosso); t.m.emissiveIntensity = t.ei + rosso * 0.9 } }
          else if (verde > 0) { if (!lampoFuso(t.m, VERDE, verde * 0.8, 1, verde * 0.7)) { t.m.emissive.copy(t.e).lerp(VERDE, verde * 0.8); t.m.emissiveIntensity = t.ei + verde * 0.7 } }
          else if (!lampoFuso(t.m, null, 0)) { t.m.emissive.copy(t.e); t.m.emissiveIntensity = t.ei }
          const tr = trasparenza < 1
          t.m.transparent = t.tr || tr; t.m.opacity = tr ? t.op * trasparenza : t.op
        }
        // gli aloni della rarità svaniscono con lui (il portale)
        if (g.userData.armiAnima) for (const w of g.userData.armiAnima) if (w.userData.aloneUniformi) w.userData.aloneUniformi.uIntensita.value = trasparenza
      }
      radice.updateMatrixWorld(true)
    },
    /** Non si disegna (la veduta dall'alto, uno scontro che lo disegna altrove). */
    nascondi() { radice.visible = false },
    /** Dov'è la mano sinistra nel mondo (per la torcia). */
    manoSinistra(fuori) {
      const b = g && g.userData.bracci[0]
      if (!b) return null
      b.localToWorld(_v.set(0, -0.3, 0.04))
      return fuori ? fuori.copy(_v) : _v.clone()
    },
    toglie() { scena.remove(radice) },
  }
}
