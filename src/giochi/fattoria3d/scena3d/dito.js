// Il dito sulla tela: un tocco fa la cosa (l'eroe ci va), un dito che scorre sposta la mappa, due dita zoomano (e in costruzione
// la spostano), tenere premuto su un pezzo lo solleva per spostarlo o metterlo via, e in costruzione si riprende un pezzo
// trascinandolo o si disegna la strada a pennello. Soglia di 16 px fra tocco e trascinamento (docs/core/il-dito.md).
// Il dito non è un mouse: niente click, solo pointer events. Non sa le regole: chiama il mondo.
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
  }
  via() {
    const c = this.canvas; clearTimeout(this.lungo)
    c.removeEventListener('pointerdown', this.giu); c.removeEventListener('pointermove', this.muovi)
    c.removeEventListener('pointerup', this.su); c.removeEventListener('pointercancel', this.su); c.removeEventListener('contextmenu', this.fermaMenu)
  }

  _centro() { const [a, b] = [...this.punti.values()]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }
  _distanza() { const [a, b] = [...this.punti.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]) }
  get _pennello() { const s = this.w.cmd.strumento; return s === 'strada' || s === 'gomma' ? s : null }

  _giu(e) {
    const w = this.w, { cmd, ui } = w
    this.canvas.setPointerCapture(e.pointerId); this.punti.set(e.pointerId, [e.clientX, e.clientY])
    if (this.punti.size === 2) {
      this.pinch0 = this._distanza(); this.zoom0 = w.camera.zoom; this.inizio = null; this.centroPrima = this._centro()
      w.costruzione.tratto = null; w.costruzione.ultimaCella = null; clearTimeout(this.lungo); return
    }
    this.inizio = { x: e.clientX, y: e.clientY }; this.trascina = false
    clearTimeout(this.lungo)
    if (ui.fogliAperti()) return
    if (cmd.costruendo) {
      if (this._pennello) w.costruzione.pennello(e.clientX, e.clientY, this._pennello)
      else { const b = w.bersaglioSotto(e.clientX, e.clientY); this.inizio.cand = b && b.kind === 'cosa' ? w.m.cosa(b.id) : null }
      return
    }
    const b = w.bersaglioSotto(e.clientX, e.clientY)
    if (b && b.kind === 'cosa') {                       // tenere premuto su un pezzo lo solleva: si sposta o si mette via
      const ini = this.inizio, c = w.m.cosa(b.id)
      this.lungo = setTimeout(() => {
        if (this.inizio !== ini || this.trascina || this.punti.size !== 1 || w.costruzione.attivo) return
        try { navigator.vibrate && navigator.vibrate(30) } catch (x) { /* niente vibrazione */ }
        ini.lungo = true; w.svuotaCoda(); w.costruzione.inizia(c.tipo, c, ini.x, ini.y)
      }, ATTESA_PREMUTO)
    }
  }

  _muovi(e) {
    if (!this.punti.has(e.pointerId)) return
    const w = this.w, { cmd, ui } = w
    this.punti.set(e.pointerId, [e.clientX, e.clientY])
    if (this.punti.size === 2) {
      w.camera.zoom = Math.max(0.55, Math.min(1.7, this.zoom0 * this.pinch0 / Math.max(1, this._distanza())))
      if (cmd.costruendo) {                             // due dita che scorrono spostano la vista
        const c = this._centro(), p0 = w.puntaSuolo(this.centroPrima[0], this.centroPrima[1]), p1 = w.puntaSuolo(c[0], c[1])
        if (p0 && p1) { cmd.pan.x -= p1.x - p0.x; cmd.pan.z -= p1.z - p0.z }
        this.centroPrima = c
      }
      return
    }
    if (!this.inizio) return
    if (w.costruzione.attivo && this.inizio.lungo) return w.costruzione.muovi(e.clientX, e.clientY)
    const d = Math.hypot(e.clientX - this.inizio.x, e.clientY - this.inizio.y)
    if (this.lungo && d > SOGLIA_PREMUTO) { clearTimeout(this.lungo); this.lungo = 0 }
    if (!this.trascina && d > SOGLIA) this.trascina = true
    if (cmd.costruendo) {
      if (this._pennello) return w.costruzione.pennello(e.clientX, e.clientY, this._pennello)
      if (w.costruzione.attivo) w.costruzione.muovi(e.clientX, e.clientY)
      else if (this.trascina && this.inizio.cand) w.costruzione.inizia(this.inizio.cand.tipo, this.inizio.cand, e.clientX, e.clientY)
      else if (this.trascina) this._mappa(e)
      return
    }
    if (!this.trascina || ui.fogliAperti()) return
    this._mappa(e)                                      // un dito che scorre sposta la mappa: per andare lontano si tocca poi la meta
  }

  _mappa(e) {
    const w = this.w, prima = this.inizio.u || { x: this.inizio.x, y: this.inizio.y }
    this.inizio.u = { x: e.clientX, y: e.clientY }
    const p0 = w.puntaSuolo(prima.x, prima.y), p1 = w.puntaSuolo(e.clientX, e.clientY)
    if (!p0 || !p1) return
    if (w.cmd.costruendo) { w.cmd.pan.x -= p1.x - p0.x; w.cmd.pan.z -= p1.z - p0.z; return }
    w.camera.trascina(p0, p1)
  }

  _fine(e) {
    if (!this.punti.has(e.pointerId)) return
    this.punti.delete(e.pointerId)
    const w = this.w, { cmd } = w, su = e.type === 'pointerup'
    clearTimeout(this.lungo); this.lungo = 0
    if (!su && w.costruzione.attivo) w.costruzione.annullaTrascinamento()
    if (w.costruzione.attivo && this.inizio && this.inizio.lungo) {              // sollevato tenendo premuto: si rilascia dove si è
      w.costruzione.rilascia(e.clientX, e.clientY); this.inizio = null; return
    }
    if (cmd.costruendo && this.inizio && su) {
      if (w.costruzione.attivo) w.costruzione.rilascia(e.clientX, e.clientY)
      else if (this._pennello) w.costruzione.finisciTratto(this._pennello)
      else if (!this.trascina) w.tocca(e.clientX, e.clientY)
    } else if (this.inizio && !this.trascina && su) w.tocca(e.clientX, e.clientY)
    this.inizio = null
  }
}
