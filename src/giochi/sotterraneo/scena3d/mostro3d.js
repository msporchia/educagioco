// I mostri come modelli 3D (in prova, docs/sotterraneo/mostri-3d.md): al posto dello sprite, il modello che il registro
// (mostri3d/registro.js) dà alla specie. Una riserva di istanze per modello, riusate: a ogni fotogramma `inizia`, una `metti` per
// mostro (lo stato di disegno di cose.js porta la sua istanza finché si vede) e `chiudi` nasconde quelle che nessuno ha preso.
// Il lampo del colpo, la tinta degli stati e lo svanire stanno su copie dei materiali per istanza, accese solo quando servono:
// gli originali restano a chi li anima (il respiro che pulsa, gli occhi). Spento con `#sprite` nell'indirizzo.
import { Group, Box3, Vector3, Color } from 'three'
import { idDi, costruisci, ALTEZZA } from './mostri3d/registro.js'
import { verso } from './tempo.js'
import { studia, saldaTutto, osso, copiaMateriale, tipoFuso, tingiFusa, lampoFuso, copiaLampo } from './salda3d.js'
import { conMosse } from './mostri3d/mosse-anim.js'
import { ACCESI } from './costanti.js'

export const mostri3dAccesi = () => typeof location === 'undefined' || !/[#&?]sprite\b/.test(location.hash + location.search)

// lo stesso rapporto dell'eroe 3D (eroe3d.js): il modello è alto quanto lo sprite che sostituisce per questa frazione
export const ALTEZZA_SPRITE = 0.72
const LARGO_MAX = 1.5                  // celle: un modello largo (le ali, la coda) non esce dal suo posto sul palco
const BIANCO = new Color(1, 1, 1)
const _b = new Box3(), _w = new Vector3()
const liscio = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x) }

/** La scatola delle sole mesh visibili (Box3.setFromObject conta anche le armi di serie spente da `impugna`). */
function misura(g) {
  g.updateMatrixWorld(true)
  const b = new Box3()
  g.traverseVisible(o => { if (o.isMesh && o.geometry) { o.geometry.computeBoundingBox(); _b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); b.union(_b) } })
  return b.isEmpty() ? new Box3(new Vector3(-0.5, 0, -0.5), new Vector3(0.5, 1, 0.5)) : b
}

const saldabili = new Map()   // id → lo studio delle mesh (salda3d.js: chi sta ferma, chi si spegne), uguale per tutte le istanze
function nuovaIstanza(scena, id) {
  const g = costruisci(id)
  if (!g) return null
  try {
    if (!saldabili.has(id)) saldabili.set(id, studia(g))
    if (ACCESI.saldatura) saldaTutto(g, saldabili.get(id), { pelle: ACCESI.pelle })
    g.userData.anima(0)
  } catch (e) { console.warn(`mostri 3D: ${id} non si salda`, e) }   // resta com'è, solo più caro
  const b = misura(g), s = b.getSize(new Vector3())
  // la radice porta dove sta, dove guarda e quanto è grande; `piega` la caduta (anima può muovere il Group del modello)
  const radice = new Group(), piega = new Group(); radice.visible = false; piega.add(g); radice.add(piega); scena.add(radice)
  const mesh = []
  g.traverse(o => { if (o.isMesh && !osso(o)) { o.castShadow = false; mesh.push({ o, orig: o.material, copia: null }) } })   // come l'eroe 3D: niente ombra del cono
  return { id, radice, piega, g, alto: Math.max(0.2, s.y), largo: Math.max(0.2, s.x, s.z), mesh, accese: false, presa: false, chi: null, guasto: false }
}

/** Le copie dei materiali per un'istanza: si accendono quando il lampo, la tinta o lo svanire servono, coi valori vivi dell'originale. */
function tingi(ist, bianco, tinta, forzaTinta, trasparenza) {
  const serve = bianco > 0.001 || forzaTinta > 0.001 || trasparenza < 0.999
  if (!serve) {
    if (ist.accese) { for (const m of ist.mesh) m.o.material = m.orig; ist.accese = false }
    return
  }
  ist.accese = true
  for (const m of ist.mesh) {
    const o = m.orig
    if (Array.isArray(o)) continue
    if (!m.copia) m.copia = copiaMateriale(o)   // un fuso della pelle (salda3d.js) ha i colori nei vertici: lo tinge il suo shader
    const c = m.copia
    m.o.material = c
    if (tipoFuso(o)) tingiFusa(c, forzaTinta > 0.001 ? tinta : null, forzaTinta)
    else if (c.color && o.color) { c.color.copy(o.color); if (forzaTinta > 0.001 && tinta) c.color.lerp(tinta, Math.min(1, forzaTinta)) }
    // il lampo di un fuso largo sta nei vertici: quello dell'originale (una mossa che lo accende), o il bianco del colpo sopra
    if (tipoFuso(o) === 'larga') { if (bianco > 0.001) lampoFuso(c, BIANCO, Math.min(1, bianco), 1, 0.9 * Math.min(1, bianco)); else copiaLampo(o, c) }
    else if (c.emissive && o.emissive) {
      c.emissive.copy(o.emissive); c.emissiveIntensity = o.emissiveIntensity
      if (bianco > 0.001) { c.emissive.lerp(BIANCO, Math.min(1, bianco)); c.emissiveIntensity = o.emissiveIntensity + 0.9 * Math.min(1, bianco) }
    }
    const tr = trasparenza < 0.999
    c.transparent = o.transparent || tr
    c.opacity = (o.opacity ?? 1) * (tr ? trasparenza : 1)
    c.depthWrite = tr ? false : o.depthWrite
    c.visible = o.visible
  }
}

/** `scena`: dove si aggiungono. `quanti()`: quanti al più nello stesso fotogramma (ACCESI.mostri3d). */
export function creaMostri3d(scena, { quanti = () => 12, ozio = 0 } = {}) {
  const riserve = new Map()      // id → [istanze]
  let usate = 0, prossimoOzio = 0
  const modellati = []           // [roba, radice] per il dito, di questo fotogramma

  // chi ha più mosse (dati/mosse.js) ha istanze sue, preparate con le animazioni delle mosse (mostri3d/mosse-anim.js): la riserva
  // è per modello e per elenco di mosse, e il comune resta com'era
  function prendi(s, id, mosse) {
    const chiave = mosse && mosse.length > 1 ? `${id}|${mosse.map(m => m.id).join(',')}` : id
    if (s.m3d && s.m3d.chiave === chiave && !s.m3d.guasto) { s.m3d.presa = true; return s.m3d }
    if (s.m3d) { s.m3d.chi = null; s.m3d = null }
    let lista = riserve.get(chiave)
    if (!lista) riserve.set(chiave, lista = [])
    let ist = lista.find(i => !i.chi && !i.presa)
    if (!ist && nuove >= api.nuovePerFotogramma) return null   // oltre il tetto resta lo sprite per un fotogramma (vedi sotto)
    if (!ist) { nuove++; ist = nuovaIstanza(scena, id); if (!ist) return null; ist.chiave = chiave; ist.mosse = chiave === id ? null : mosse; lista.push(ist) }
    ist.chi = s; ist.presa = true; s.m3d = ist
    return ist
  }

  let nuove = 0
  const api = {
    /**
     * Quanti modelli nuovi al più in un fotogramma (costruirli e saldarli è il JS più caro dell'entrata in un piano: tre scheletri
     * leggendari insieme erano un fotogramma lungo). L'entrata a passi (indice.js) lo mette a uno, finché non si disegna.
     */
    nuovePerFotogramma: Infinity,
    /** Il modello che questa cosa avrebbe (null: resta lo sprite). */
    idDi,
    inizia() { usate = 0; nuove = 0; modellati.length = 0; for (const l of riserve.values()) for (const i of l) i.presa = false },
    /** C'è posto per un altro modello in questo fotogramma? */
    get pieno() { return usate >= quanti() },
    /**
     * Un mostro in scena. `p`: { x, z, alto (dello sprite, in celle), verso: {x, z} chi guardare (o null), t, dt, trasparenza, morente
     * (secondi da quando cade, 0 in piedi), bianco (il lampo), tinta, forzaTinta, attacco (0..1 o -1), mosse (dati/mosse.js), mossa
     * ({ id, p }: la mossa che fa adesso, al posto dell'attacco), annuncio (l'id della mossa annunciata: l'anello a terra) }. Torna
     * l'altezza vera, o -1 se il modello non c'è (e allora si disegna lo sprite).
     */
    metti(r, s, id, p) {
      if (usate >= quanti()) return -1
      const ist = prendi(s, id, p.mosse)
      if (!ist) return -1
      ist.usata = performance.now()
      usate++
      const { radice, piega, g } = ist
      const c = liscio(p.morente / 0.6)   // quanto è già caduto
      try {
        const k0 = (p.alto || 1) * ALTEZZA_SPRITE * (ALTEZZA[id.split('+')[0]] || 1) / ist.alto
        const k = Math.min(k0, LARGO_MAX * Math.max(1, p.alto / 1.6) / ist.largo)
        radice.scale.setScalar(k)
        // le animazioni delle mosse si preparano la prima volta, quando si sa quanto è grande (l'anello e il bagliore ne dipendono);
        // l'icona sopra la testa no: la scrive la vista (viste/MossaAnnunciata.vue)
        if (ist.mosse && !ist.pronte) {
          ist.pronte = true
          try { conMosse(g, { chiave: id }, { scala: k, mosse: ist.mosse, icona: false }) } catch (e) { console.warn(`mostri 3D: ${id} senza mosse`, e) }
        }
        // dove guarda: il bersaglio (l'eroe) un po' girato verso la telecamera, se no di lato come lo sprite; ci si gira in fretta
        // la velocità di adesso (dalle posizioni, smussata): chi cammina guarda dove va
        if (s.px3d != null && p.dt > 0) {
          const q = verso(p.dt, 8)
          s.vx3d = (s.vx3d || 0) + ((p.x - s.px3d) / p.dt - (s.vx3d || 0)) * q
          s.vz3d = (s.vz3d || 0) + ((p.z - s.pz3d) / p.dt - (s.vz3d || 0)) * q
        }
        s.px3d = p.x; s.pz3d = p.z
        let meta
        if (p.verso) { const dx = p.verso.x - p.x, dz = p.verso.z - p.z, l = Math.hypot(dx, dz); if (l > 0.05) meta = Math.atan2(dx, dz + l * 0.45) }
        else if (s.vx3d != null && Math.hypot(s.vx3d, s.vz3d) > 0.2) meta = Math.atan2(s.vx3d, s.vz3d + 0.3)
        else meta = s.specchio ? -0.9 : 0.9
        let d = meta - (s.yaw3d ?? meta); d = Math.atan2(Math.sin(d), Math.cos(d))
        s.yaw3d = (s.yaw3d ?? meta) + d * verso(p.dt, 9)
        radice.rotation.set(0, s.yaw3d, 0)
        // l'idle con la sua fase; chi cade si ferma all'istante della caduta e si rovescia all'indietro, poi sprofonda un poco
        if (!p.morente) s.tCaduta = p.t
        const t = p.morente > 0 ? s.tCaduta : p.t
        const u = g.userData
        if (u.annuncia) u.annuncia(p.annuncio || null)
        u.anima(t + (s.fase3d ??= Math.random() * 7))
        const mossa = p.mossa && u.mosse && u.mosse[p.mossa.id]
        if (mossa) mossa.anima(p.mossa.p)
        else if (p.attacco >= 0 && u.attacca) u.attacca(p.attacco)
        piega.rotation.x = -1.35 * c
        radice.position.set(p.x, (p.y || 0) - 0.12 * ist.alto * k * c, p.z)
        tingi(ist, p.bianco, p.tinta, p.forzaTinta, p.trasparenza)
        radice.visible = p.trasparenza > 0.02
        radice.updateMatrixWorld(true)
      } catch (e) {
        // un modello che si rompe animando: via per sempre, torna lo sprite
        ist.guasto = true; radice.visible = false; ist.chi = null; s.m3d = null; usate--
        console.warn(`mostri 3D: ${id} si rompe animando, resta lo sprite`, e)
        return -1
      }
      if (!p.morente) modellati.push([r, radice])
      return ist.alto * radice.scale.x * (1 - 0.7 * c)
    },
    /**
     * Un'istanza in serbo del modello `id`, nascosta, e i suoi shader chiesti in anticipo con `compila(oggetto)`: quelli suoi e quelli
     * delle copie trasparenti di chi svanisce (docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»). Il primo `metti`
     * la prende. Falso se il modello ne aveva già una, o non c'è. Con `passi(oggetto)` (coda-shader.js, passiDi) non compila: torna i
     * passi, uno per programma, da fare un fotogramma alla volta.
     */
    prepara(id, compila, passi = null) {
      let lista = riserve.get(id)
      if (lista && lista.length) return false
      const ist = nuovaIstanza(scena, id)
      if (!ist) return false
      ist.chiave = id; ist.mosse = null
      if (!lista) riserve.set(id, lista = [])
      lista.push(ist)
      if (passi) {
        // le copie trasparenti si accendono passo per passo (l'istanza è in serbo, nascosta) e si spengono alla fine, se nessuno l'ha presa
        const trasparenti = () => { if (ist.chi) return []; tingi(ist, 0, null, 0, 0.5); return [...passi(ist.radice), () => { if (!ist.chi) tingi(ist, 0, null, 0, 1) }] }
        return [...passi(ist.radice), trasparenti]
      }
      compila(ist.radice)
      tingi(ist, 0, null, 0, 0.5); compila(ist.radice); tingi(ist, 0, null, 0, 1)
      return true
    },
    /** Gli attacchi che i modelli fatti finora dichiarano (`userData.attacco`): per scaldare i loro effetti. */
    attacchi() { const l = []; for (const r of riserve.values()) for (const i of r) if (i.g.userData.attacco) l.push(i.g.userData.attacco); return l },
    /** Nasconde le istanze che nessuno ha preso in questo fotogramma. */
    chiudi() {
      for (const l of riserve.values()) for (const i of l) if (!i.presa) { i.radice.visible = false; if (i.chi) { i.chi.m3d = null; i.chi = null } }
      // `ozio` (s): nel mondo di sopra i mostri vanno e vengono con le zone, e la riserva teneva ogni specie incontrata; chi non si
      // vede da tanto si butta (una volta ogni due secondi si guarda)
      if (ozio && performance.now() > prossimoOzio) {
        prossimoOzio = performance.now() + Math.min(2000, ozio * 500)
        const fino = performance.now() - ozio * 1000
        this.sfoltisci(null, i => (i.usata || 0) > fino)
      }
    },
    modellati,
    /** Dove nascono i colpi a distanza di un mostro (l'`origine` del modello, nel mondo), o null. */
    origine(s, fuori) {
      const ist = s && s.m3d, u = ist && ist.g.userData
      const o = u && (u.origine || (u.attacco && u.attacco.proiettile && u.attacco.proiettile.origine))
      if (!o || !o.getWorldPosition) return null
      o.updateWorldMatrix(true, false)
      return o.getWorldPosition(fuori)
    },
    /** Una mossa del modello (mostri3d/mosse-anim.js): { tipo, durata (s), arrivo (frazione) } o null (chi non ha le mosse, o lo sprite). */
    mossaDi(s, id) { const u = s && s.m3d && s.m3d.g.userData; return (u && u.mosse && u.mosse[id]) || null },
    /** L'attacco che il modello dichiara: { tipo, durata (s), arrivo (frazione), proiettile } o null. */
    attaccoDi(s) { const u = s && s.m3d && s.m3d.g.userData; return (u && u.attacca && u.attacco) || null },
    /** Il petto del modello nel mondo (per gli effetti), o null. */
    petto(s, fuori) {
      const ist = s && s.m3d
      if (!ist) return null
      ist.radice.getWorldPosition(_w)
      return fuori.set(_w.x, ist.alto * ist.radice.scale.x * 0.55, _w.z)
    },
    altezza(s) { const ist = s && s.m3d; return ist ? ist.alto * ist.radice.scale.x : 0 },
    get quante() { let n = 0; for (const l of riserve.values()) n += l.length; return n },
    get visibili() { return usate },
    /**
     * Butta le istanze dei modelli che non sono in `ids` (i mostri del piano nuovo) e che nessuno tiene: le loro geometrie (quelle che
     * nessun'altra istanza usa) e lo scheletro della pelle. I materiali no: buttato l'ultimo, three ricompila il programma al prossimo.
     */
    sfoltisci(ids, resta_ = i => ids.has(i.id)) {
      const via = [], tenute = new Set()
      for (const [k, l] of riserve) {
        const resta = l.filter(i => i.chi || resta_(i))
        for (const i of l) if (!resta.includes(i)) via.push(i)
        if (resta.length) riserve.set(k, resta); else riserve.delete(k)
        for (const i of resta) i.g.traverse(o => { if (o.geometry) tenute.add(o.geometry) })
      }
      for (const i of via) {
        scena.remove(i.radice)
        i.g.traverse(o => { if (o.geometry && !tenute.has(o.geometry)) o.geometry.dispose() })
        if (i.g.userData.scheletro) i.g.userData.scheletro.dispose()
      }
      return via.length
    },
    via() {
      for (const l of riserve.values()) for (const i of l) {
        scena.remove(i.radice)
        for (const m of i.mesh) if (m.copia) m.copia.dispose()
      }
      riserve.clear()
    },
  }
  return api
}
