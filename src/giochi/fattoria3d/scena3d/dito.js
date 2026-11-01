// Il dito sulla tela: un tocco fa la cosa (l'eroe ci va), un dito che scorre sposta la mappa, due dita zoomano. Tenere premuto su un
// pezzo lo solleva per spostarlo o metterlo via; tenere premuto su un posto libero del proprio terreno apre il menu «Costruisci qui»; tenere
// premuto su Watson, un gatto o una bestia di casa apre il suo foglio (il tocco breve resta la sua festa);
// col pennello delle strade si disegna; col fantasma del menu parcheggiato lo si trascina o lo si tocca dove va. Soglia di 16 px fra
// tocco e trascinamento (docs/core/il-dito.md).
// Il dito non è un mouse: niente click, solo pointer events. Non sa le regole: chiama il mondo.
import { zoomMorbido, dentroLimiti } from './camera.js'
const SOGLIA = 16, SOGLIA_PREMUTO = 10, ATTESA_PREMUTO = 450

export class Dito {
  constructor(mondo) {
    this.w = mondo; this.canvas = mondo.canvas
    this.punti = new Map()
    this.inizio = null; this.trascina = false; this.lungo = 0
    this.pinch0 = 0; this.zoom0 = 1; this.centroPrima = null
    this.giu = e => this._giu(e); this.muovi = e => this._muovi(e); this.su = e => this._fine(e)
    this.fermaMenu = e => e.preventDefault()
    const c = this.canvas
    c.addEventListener('pointerdown', this.giu); c.addEventListener('pointermove', this.muovi)
    c.addEventListener('pointerup', this.su); c.addEventListener('pointercancel', this.su); c.addEventListener('contextmenu', this.fermaMenu)
    this.rotella = e => { e.preventDefault(); const w = this.w; w.camera.zoom = dentroLimiti(w.camera.zoom * Math.exp(e.deltaY * 0.0015)) }
    c.addEventListener('wheel', this.rotella, { passive: false })
  }
  via() {
    const c = this.canvas; clearTimeout(this.lungo)
    c.removeEventListener('pointerdown', this.giu); c.removeEventListener('pointermove', this.muovi)
    c.removeEventListener('pointerup', this.su); c.removeEventListener('pointercancel', this.su); c.removeEventListener('contextmenu', this.fermaMenu); c.removeEventListener('wheel', this.rotella)
  }

  _centro() { const [a, b] = [...this.punti.values()]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }
  _distanza() { const [a, b] = [...this.punti.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]) }
  get _pennello() { const s = this.w.cmd.strumento; return s === 'strada' || s === 'gomma' ? s : null }

  _giu(e) {
    const w = this.w, { ui } = w
    this.canvas.setPointerCapture(e.pointerId); this.punti.set(e.pointerId, [e.clientX, e.clientY])
    if (this.punti.size === 2) {
      this.pinch0 = this._distanza(); this.zoom0 = w.camera.zoom; this.inizio = null; this.centroPrima = this._centro()
      w.costruzione.tratto = null; w.costruzione.ultimaCella = null; w.costruzione.pennelloDito = null; clearTimeout(this.lungo); return
    }
    this.inizio = { x: e.clientX, y: e.clientY }; this.trascina = false
    clearTimeout(this.lungo)
    if (ui.fogliAperti()) return
    if (w.costruzione.parcheggiato) { this.inizio.parcheggio = true; w.costruzione.prendi(e.clientX, e.clientY); return }          // il fantasma del menu: lo si trascina o si tocca dove va
    if (this._pennello) { w.costruzione.pennello(e.clientX, e.clientY, this._pennello); return }
    const ini = this.inizio, amico = ui.apriBestia && w.bestiaSotto(e.clientX, e.clientY)
    if (amico) {                                        // tenere premuto su una bestia: il suo foglio (come sta, il nome, cosa le serve)
      this.lungo = setTimeout(() => {
        if (this.inizio !== ini || this.trascina || this.punti.size !== 1 || w.costruzione.attivo || ui.fogliAperti()) return
        try { navigator.vibrate && navigator.vibrate(30) } catch (x) { /* niente vibrazione */ }
        ini.menu = true; ui.apriBestia(amico.def.id)
      }, ATTESA_PREMUTO)
      return
    }
    const b = w.bersaglioSotto(e.clientX, e.clientY)
    if (b && b.kind === 'cosa') {                       // tenere premuto su un pezzo lo solleva: si sposta o si mette via
      const c = w.m.cosa(b.id)
      this.lungo = setTimeout(() => {
        if (this.inizio !== ini || this.trascina || this.punti.size !== 1 || w.costruzione.attivo) return
        try { navigator.vibrate && navigator.vibrate(30) } catch (x) { /* niente vibrazione */ }
        ini.lungo = true; w.svuotaCoda(); w.costruzione.inizia(c.tipo, c, ini.x, ini.y)
      }, ATTESA_PREMUTO)
    } else if (!b) {                                    // tenere premuto su un posto libero del terreno tuo: il menu «Costruisci qui»
      const p = w.puntaSuolo(e.clientX, e.clientY); if (!p) return
      const i = Math.floor(p.x), j = Math.floor(p.z)
      if (!w.m.cellaPropria(i, j) || w.m.blocca(i, j) || w.compagni.bersaglio(w._raggio(e.clientX, e.clientY))) return
      this.lungo = setTimeout(() => {
        if (this.inizio !== ini || this.trascina || this.punti.size !== 1 || w.costruzione.attivo || ui.fogliAperti()) return
        try { navigator.vibrate && navigator.vibrate(30) } catch (x) { /* niente vibrazione */ }
        ini.menu = true; w.svuotaCoda(); w.puntoMenu = { i, j, x: p.x, z: p.z }; ui.apriCostruisci(i, j)
      }, ATTESA_PREMUTO)
    }
  }

  _muovi(e) {
    if (!this.punti.has(e.pointerId)) return
    const w = this.w, { ui } = w
    this.punti.set(e.pointerId, [e.clientX, e.clientY])
    if (this.punti.size === 2) {
      w.camera.zoom = Math.max(0.1, Math.min(8, this.zoom0 * this.pinch0 / Math.max(1, this._distanza())))   // fuori dai limiti l'elastico (camera.js)
      if (this._pennello) {                             // col pennello il dito disegna: due dita spostano la vista
        const c = this._centro(), p0 = w.puntaSuolo(this.centroPrima[0], this.centroPrima[1]), p1 = w.puntaSuolo(c[0], c[1])
        if (p0 && p1) w.camera.trascina(p0, p1)
        this.centroPrima = c
      }
      return
    }
    if (!this.inizio) return
    if (w.costruzione.attivo && this.inizio.lungo) return w.costruzione.muovi(e.clientX, e.clientY)
    const d = Math.hypot(e.clientX - this.inizio.x, e.clientY - this.inizio.y)
    if (this.lungo && d > SOGLIA_PREMUTO) { clearTimeout(this.lungo); this.lungo = 0 }
    if (!this.trascina && d > SOGLIA) this.trascina = true
    if (this.inizio.parcheggio) { if (this.trascina) w.costruzione.muovi(e.clientX, e.clientY); return }
    if (this._pennello) { if (!ui.fogliAperti()) w.costruzione.pennello(e.clientX, e.clientY, this._pennello); return }
    if (!this.trascina || ui.fogliAperti()) return
    this._mappa(e)                                      // un dito che scorre sposta la mappa: per andare lontano si tocca poi la meta
  }

  _mappa(e) {
    const w = this.w, prima = this.inizio.u || { x: this.inizio.x, y: this.inizio.y }
    this.inizio.u = { x: e.clientX, y: e.clientY }
    const p0 = w.puntaSuolo(prima.x, prima.y), p1 = w.puntaSuolo(e.clientX, e.clientY)
    if (!p0 || !p1) return
    w.camera.trascina(p0, p1)
  }

  _fine(e) {
    if (!this.punti.has(e.pointerId)) return
    if (this.punti.size === 2) w.camera.zoom = dentroLimiti(w.camera.zoom)    // il pizzico finisce: l'elastico riporta dentro
    this.punti.delete(e.pointerId)
    const w = this.w, su = e.type === 'pointerup'
    clearTimeout(this.lungo); this.lungo = 0
    if (!su) w.costruzione.alzaDito()
    if (!su && w.costruzione.attivo && !w.costruzione.parcheggiato) w.costruzione.annullaTrascinamento()
    if (this.inizio && this.inizio.parcheggio) {                                 // il fantasma del menu: trascinato si rilascia dove si è, toccato va dove si tocca
      if (su) { if (this.trascina) w.costruzione.rilascia(e.clientX, e.clientY); else w.costruzione.tocco(e.clientX, e.clientY) }
      this.inizio = null; return
    }
    if (w.costruzione.attivo && this.inizio && this.inizio.lungo) {              // sollevato tenendo premuto: si rilascia dove si è
      w.costruzione.rilascia(e.clientX, e.clientY); this.inizio = null; return
    }
    if (this.inizio && su) {
      if (this._pennello) w.costruzione.finisciTratto(this._pennello)
      else if (!this.trascina && !this.inizio.menu) w.tocca(e.clientX, e.clientY)
    }
    this.inizio = null
  }
}
