// Gli effetti: scintille e fumo (particelle vere in scena), il testo che vola, il fumetto sopra l'eroe, i cartelli sulle
// cose (piccoli pezzi di HTML sopra la tela, come in sotterraneo/scena3d/etichette.js), l'albero che cade. Non sanno le regole:
// ricevono fatti già decisi. `vista.proietta(p, extra)` dice dove cade un punto del mondo sullo schermo.
import * as THREE from 'three'
import { mat, FORME } from './modelli.js'
import { tela } from './facce.js'

const geoP = new THREE.BoxGeometry(0.08, 0.08, 0.08)
const geoFumo = new THREE.SphereGeometry(0.16, 6, 5)

export class Effetti {
  constructor(scena, sopra, vista, qualita) {
    this.scena = scena; this.sopra = sopra; this.vista = vista; this.q = qualita
    this.particelle = []
    this.caduti = []
    this.fumetto = null; this.fumettoFine = 0
    this.badges = new Set()
  }

  scoppietta(pos, colore, n = 8, forza = 1.6, su = 2.4) {
    if (!this.q.particelle) return
    for (let k = 0; k < n; k++) {
      const m = new THREE.Mesh(geoP, mat(colore, { emissive: colore, emissiveIntensity: 0.25 }))
      m.position.copy(pos); this.scena.add(m)
      this.particelle.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * forza, su * (0.5 + Math.random() * 0.6), (Math.random() - 0.5) * forza), vita: 0.9 + Math.random() * 0.4 })
    }
  }

  fumata(pos) {
    if (!this.q.particelle) return
    const m = new THREE.Mesh(geoFumo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, fog: true }))
    m.position.copy(pos); this.scena.add(m)
    this.particelle.push({ m, v: new THREE.Vector3(0.15, 0.7, 0.05), vita: 1.8, fumo: true })
  }

  /** Un testo che sale e svanisce, sopra un punto del mondo. `k`: una merce, di cui si disegna la faccia dopo il testo (se non ce
      l'ha, il testo porta già la sua emoji). */
  volo(testo, pos, extra = 1.6, k = null) {
    const [x, y, visto] = this.vista.proietta(pos, extra)
    if (!visto) return
    const el = document.createElement('div'); el.className = 'f3-volo'; el.textContent = testo
    const faccia = k && tela(k, 30)
    if (faccia) { el.append(' ', faccia); el.dataset.merce = k }
    el.style.left = x + 'px'; el.style.top = y + 'px'; this.sopra.appendChild(el)
    setTimeout(() => el.remove(), 1500)
  }

  /** Il fumetto sopra la testa dell'eroe. */
  parla(testo) {
    if (!this.fumetto) { this.fumetto = document.createElement('div'); this.fumetto.className = 'f3-fumetto' }
    this.fumetto.textContent = testo; this.fumetto.hidden = false; this.sopra.appendChild(this.fumetto)
    this.fumettoFine = performance.now() + 2600
  }

  /** Un cartello su una cosa: `imposta(testo, classe)` e `metti(x, y, visto)`. */
  nuovoBadge() {
    const el = document.createElement('div'); el.className = 'f3-badge'; el.hidden = true; this.sopra.appendChild(el)
    const b = {
      el, testo: '',
      imposta(testo, classe = '') {
        if (b.testo === testo + classe) return
        b.testo = testo + classe; el.textContent = testo; el.className = 'f3-badge ' + classe; el.hidden = !testo
      },
      metti(x, y, visto, centrato = false) {
        // a telecamera ferma il cartello sta dov'era: niente scrittura nello stile (il browser rifarebbe lo stile di ogni cartello a ogni fotogramma)
        const pos = `translate(${Math.round(x * 4) / 4}px, ${Math.round(y * 4) / 4}px) translate(-50%, ${centrato ? '-50%' : '-100%'})`
        if (pos !== b.pos) { b.pos = pos; el.style.transform = pos }
        if (visto !== b.visto) { b.visto = visto; el.style.visibility = visto ? 'visible' : 'hidden' }
      },
      togli() { el.remove() },
    }
    return b
  }

  /** Il cartello di un recinto, un pollaio o una stalla: una riga di stato (pronto, ha fame, secondi), il
      pulsante «＋ 🪙 40» che compra una bestia (`sulCompra`, senza conferma). Stessa forma di un badge: `imposta`, `metti`, `togli`;
      in più `bestie(q, povero)`. Il pulsante è l'unica parte che prende il dito: il resto lascia passare il tocco alla tela. */
  nuovoCartello(sulCompra, tipo = '') {
    const el = document.createElement('div'); el.className = 'f3-badge f3-cartello'; el.dataset.f3 = 'cartello-bestie'; el.dataset.pezzo = tipo
    const stato = document.createElement('span'); stato.className = 'stato'; stato.hidden = true
    const riga = document.createElement('div'); riga.className = 'riga'
    const tasto = document.createElement('button'); tasto.type = 'button'; tasto.className = 'compra'; tasto.dataset.f3 = 'compra-bestia'
    tasto.addEventListener('click', e => { e.stopPropagation(); sulCompra() })
    riga.append(tasto); el.append(stato, riga); this.sopra.appendChild(el)
    const b = {
      el, testo: '', chiave: '',
      imposta(testo, classe = '') {
        if (b.testo === testo + classe) return
        b.testo = testo + classe; stato.textContent = testo; stato.className = 'stato ' + classe; stato.hidden = !testo
      },
      bestie(q, povero) {
        const chiave = `${q.pieno}/${q.prezzo}/${povero}`
        if (b.chiave === chiave) return
        b.chiave = chiave
        tasto.hidden = q.pieno; tasto.textContent = q.pieno ? '' : `＋ 🪙 ${q.prezzo}`
        tasto.setAttribute('aria-disabled', povero ? 'true' : 'false'); tasto.classList.toggle('spento', !!povero)
        tasto.setAttribute('aria-label', q.pieno ? '' : `compra una ${q.bestia}`)
        riga.hidden = q.pieno                                  // pieno: niente pulsante, niente riga
      },
      metti(x, y, visto, centrato = false) {
        // a telecamera ferma il cartello sta dov'era: niente scrittura nello stile (il browser rifarebbe lo stile di ogni cartello a ogni fotogramma)
        const pos = `translate(${Math.round(x * 4) / 4}px, ${Math.round(y * 4) / 4}px) translate(-50%, ${centrato ? '-50%' : '-100%'})`
        if (pos !== b.pos) { b.pos = pos; el.style.transform = pos }
        if (visto !== b.visto) { b.visto = visto; el.style.visibility = visto ? 'visible' : 'hidden' }
      },
      togli() { el.remove() },
    }
    return b
  }

  /** Un albero che cade lontano da chi lo abbatte e poi sparisce. */
  cade(a, dallaParte) {
    const col = new THREE.Color().setHSL(0.27 + a.c * 0.05, 0.5, 0.3 + a.c * 0.1)
    const perno = new THREE.Group(), g = new THREE.Group()
    for (const [geo, m] of [[FORME.tronco, mat(0x7a5232)], [FORME.chioma, mat(col.getHex())], [FORME.chioma2, mat(col.getHex())]]) {
      const o = new THREE.Mesh(geo, m); o.castShadow = true; g.add(o)
    }
    g.scale.setScalar(a.s); perno.add(g)
    perno.position.set(a.i + 0.5, 0, a.j + 0.5)
    perno.rotation.y = Math.atan2(a.i + 0.5 - dallaParte.x, a.j + 0.5 - dallaParte.z)
    this.scena.add(perno); this.caduti.push({ perno, g, t: 0 })
    this.scoppietta(new THREE.Vector3(a.i + 0.5, 0.8, a.j + 0.5), 0x3a7a30, 14, 2, 2.5)
  }

  aggiorna(dt, posEroe) {
    for (let n = this.particelle.length - 1; n >= 0; n--) {
      const p = this.particelle[n]; p.vita -= dt
      if (p.vita <= 0) { this.scena.remove(p.m); if (p.fumo) p.m.material.dispose(); this.particelle.splice(n, 1); continue }
      if (!p.fumo) p.v.y -= 7 * dt
      p.m.position.addScaledVector(p.v, dt)
      if (p.fumo) { p.m.scale.multiplyScalar(1 + dt * 0.9); p.m.material.opacity = Math.min(0.6, p.vita / 3) }
      else if (p.m.position.y < 0.05) { p.m.position.y = 0.05; p.v.set(0, 0, 0) }
    }
    for (let n = this.caduti.length - 1; n >= 0; n--) {
      const c = this.caduti[n]; c.t += dt
      c.g.rotation.x = Math.min(1, c.t / 0.7) ** 2 * Math.PI / 2
      if (c.t > 0.7) {
        const k = Math.max(0, 1 - (c.t - 0.7) / 0.35); c.perno.scale.setScalar(k)
        if (k <= 0) { this.scena.remove(c.perno); this.caduti.splice(n, 1) }
      }
    }
    if (this.fumetto && !this.fumetto.hidden) {
      if (performance.now() > this.fumettoFine) this.fumetto.hidden = true
      else { const [x, y] = this.vista.proietta(posEroe, 1.7); this.fumetto.style.left = x + 'px'; this.fumetto.style.top = y + 'px' }
    }
  }

  via() {
    for (const p of this.particelle) this.scena.remove(p.m)
    this.particelle = []
    this.fumetto?.remove()
  }
}
