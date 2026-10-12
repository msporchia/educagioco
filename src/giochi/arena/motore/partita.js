// La partita dell'arena, senza schermo: niente DOM, niente Vue, e non sa cos'è
// una moneta vera (le «monete di battaglia» sono una valuta solo sua). Gira
// uguale in Node: è l'unico motivo per cui la difficoltà si misura.
// Il caso arriva da fuori (`rnd`), così una partita si rifà identica.
// Le regole e i numeri stanno in `dati/regole.js`; l'IA del nemico in `nemico.js`.
import {
  CAMPO, POSTI, TRUPPE, BASE, TORRI, LIV_MAX, MINIERA_MAX, CRESCITA, AZIONI, MURO, RIPARA,
  RIPOSO, COSTRUZIONE, AVVIO, NEMICI, GIOCATORE, DURATA,
} from '../dati/regole.js'
import { pensaNemico } from './nemico.js'

const PASSO = 0.05                       // secondi di una fetta di tempo: la partita avanza a passi fissi
const SGUARDO = 80                       // fin dove una truppa vede un'altra truppa
const MAX_EVENTI = 400

export const altro = lato => (lato === 'io' ? 'nem' : 'io')
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const viva = e => e.hp > 0
const sponda = y => (y < CAMPO.fiume.alto ? -1 : y > CAMPO.fiume.basso ? 1 : 0)   // -1 sopra, 1 sotto, 0 nell'acqua

export class Partita {
  /* `sfida`: { nemico: 'normale' | {moneteAlSecondo, pensa, forza}, durata, monete, truppe, forzaNemico }.
     `registra`: tiene gli eventi per la scena (un banco di prova non li vuole). */
  constructor({ rnd = Math.random, sfida = {}, registra = false } = {}) {
    this.rnd = rnd
    this.registraEventi = registra
    this.eventi = []
    this.durata = sfida.durata ?? DURATA
    this.nemicoCfg = typeof sfida.nemico === 'object' ? sfida.nemico : { ...NEMICI[sfida.nemico || 'normale'] }
    this.truppeAmmesse = sfida.truppe || Object.keys(TRUPPE)
    this.t = 0
    this.resto = this.durata
    this.fine = null
    this.pensa = 2.5
    this.unita = []
    this.lati = {
      io: this.nuovoLato('io', GIOCATORE.moneteAlSecondo, sfida.monete ?? GIOCATORE.iniziali),
      nem: this.nuovoLato('nem', this.nemicoCfg.moneteAlSecondo, sfida.monete ?? GIOCATORE.iniziali),
    }
    this.forza = { io: 1, nem: (this.nemicoCfg.forza ?? 1) * (sfida.forzaNemico ?? 1) }
    this.torri = []
    for (const lato of ['io', 'nem']) {
      this.torri.push(this.nuovaTorre(lato, 'p', CAMPO.torretta), this.nuovaTorre(lato, 're', CAMPO.base))
    }
    this.muri = ['io', 'nem'].map(lato => this.nuovoMuro(lato, 0))
    this.caserme = []
    for (const lato of ['io', 'nem']) this.caserme.push(this.nuovaCaserma(lato, BASE, 6, AVVIO))
  }

  /* ───────── il mondo ───────── */

  casuale(a, b) { return a + Math.floor(this.rnd() * (b - a + 1)) }

  nuovoLato(lato, alSecondo, monete) {
    return { monete, alSecondo, miniera: 1, mosse: 0 }
  }
  y(lato, y) { return lato === 'io' ? y : CAMPO.H - y }

  nuovaTorre(lato, tipo, y) {
    const k = TORRI[tipo]
    return { lato, tipo, x: CAMPO.corsia, y: this.y(lato, y), hp: k.hp, max: k.hp, r: k.r, liv: 1, cool: 0.5, fl: 0 }
  }
  nuovoMuro(lato, fila) {
    return { lato, tipo: 'muro', fila, x: CAMPO.corsia, y: this.y(lato, CAMPO.muri[fila]), hp: MURO.hp, max: MURO.hp, r: MURO.r, fl: 0 }
  }
  nuovaCaserma(lato, id, posto, t) {
    const [x, y] = POSTI[posto]
    const vita = CRESCITA.vitaCaserma(1)
    return { lato, tipo: 'caserma', id, posto, liv: 1, t, ciclo: t, riposo: 0, x, y: this.y(lato, y), hp: vita, max: vita, r: 16, fl: 0 }
  }

  torretta(lato) { return this.torri.find(t => t.lato === lato && t.tipo === 'p') }
  re(lato) { return this.torri.find(t => t.lato === lato && t.tipo === 're') }
  casermeDi(lato) { return this.caserme.filter(c => c.lato === lato) }
  muriDi(lato) { return this.muri.filter(m => m.lato === lato) }
  postiLiberi(lato) {
    return POSTI.map((_, i) => i).filter(i => !this.caserme.some(c => c.lato === lato && c.posto === i))
  }

  /* quello che una truppa può prendere di mira: torri, caserme e — se cammina — muri */
  edificiContro(u) {
    const lato = altro(u.lato)
    const lista = this.torri.filter(t => t.lato === lato)
    for (const c of this.caserme) if (c.lato === lato) lista.push(c)
    if (!u.vola) for (const m of this.muri) if (m.lato === lato) lista.push(m)
    return lista.filter(viva)
  }

  /* ───────── gli eventi, per la scena ───────── */

  evento(e) {
    if (!this.registraEventi) return
    this.eventi.push(e)
    if (this.eventi.length > MAX_EVENTI) this.eventi.splice(0, this.eventi.length - MAX_EVENTI)
  }
  prendiEventi() { const e = this.eventi; this.eventi = []; return e }

  /* ───────── il tempo ───────── */

  avanza(dt) {
    let resto = dt
    while (resto > 1e-9 && !this.fine) {
      const d = Math.min(PASSO, resto)
      this.fetta(d)
      resto -= d
    }
  }

  fetta(dt) {
    this.t += dt
    this.resto -= dt
    for (const lato of ['io', 'nem']) {
      const l = this.lati[lato]
      l.monete += dt * l.alSecondo * CRESCITA.miniera.resa(l.miniera)
    }
    this.squadre(dt)
    for (const u of this.unita) this.muoviUnita(u, dt)
    this.separa()
    for (const t of this.torri) this.muoviTorre(t, dt)
    this.unita = this.unita.filter(viva)
    for (const e of [...this.muri, ...this.caserme]) {
      if (e.fl > 0) e.fl -= dt
      if (!viva(e)) this.evento({ tipo: 'crollo', x: e.x, y: e.y, lato: e.lato, che: e.tipo, id: e.id })
    }
    this.muri = this.muri.filter(viva)
    this.caserme = this.caserme.filter(viva)
    pensaNemico(this, dt)
    this.controllaFine()
  }

  squadre(dt) {
    for (const c of this.caserme) {
      if (c.riposo > 0) c.riposo -= dt
      c.t -= dt
      if (c.t > 0) continue
      c.ciclo = CRESCITA.squadraOgni(c.liv)
      c.t += c.ciclo
      this.schiera(c.lato, c.id, c.x, c.y + (c.lato === 'io' ? -16 : 16), CRESCITA.forza(c.liv))
    }
  }

  schiera(lato, id, x, y, forza = 1) {
    const k = TRUPPE[id]
    const f = forza * this.forza[lato]
    for (let i = 0; i < k.n; i++) {
      const dx = (i - (k.n - 1) / 2) * 14
      this.unita.push({
        id, lato, x: x + dx, y: y + (i % 2) * 5, hp: k.hp * f, max: k.hp * f, forza: f,
        cool: 0.9, fl: 0, colpo: 0, cammina: false, nasce: 0.8, vola: k.vola, dirY: 0, r: 8,
      })
    }
    this.evento({ tipo: 'squadra', lato, id, x, y })
  }

  /* ───────── le truppe ───────── */

  ferisci(bersaglio, dmg) {
    bersaglio.hp = Math.max(0, bersaglio.hp - dmg)
    bersaglio.fl = 0.1
  }

  colpisci(att, k, bersaglio) {
    this.ferisci(bersaglio, k.dmg * (att.forza || 1))
    this.evento({ tipo: 'colpo', da: att.id || att.tipo, lato: att.lato, x1: att.x, y1: att.y, x2: bersaglio.x, y2: bersaglio.y, scoppio: k.splash })
    if (!k.splash) return
    for (const e of this.unita) {
      if (e === bersaglio || e.lato === att.lato || !viva(e)) continue
      if (k.bers === 'terra' && e.vola) continue
      if (Math.hypot(e.x - bersaglio.x, e.y - bersaglio.y) <= k.splash) this.ferisci(e, k.dmg * 0.8 * (att.forza || 1))
    }
  }

  /* dove andare: i volanti dritti; chi cammina passa dal ponte, che è uno solo */
  verso(u, b) {
    if (u.vola) return b
    const { alto, basso } = CAMPO.fiume, px = CAMPO.corsia
    const mia = sponda(u.y), sua = sponda(b.y)
    if (mia === 0) return { x: px, y: u.dirY > 0 ? basso + 8 : alto - 8 }
    if (sua === 0 || sua === mia) return b
    u.dirY = sua
    const ay = u.dirY < 0 ? basso + 12 : alto - 12            // l'imbocco, fuori dall'acqua
    const prima = u.dirY < 0 ? u.y > ay - 1 : u.y < ay + 1
    if (prima && Math.hypot(u.x - px, u.y - ay) > 5) return { x: px, y: ay }
    return { x: px, y: u.dirY < 0 ? alto - 8 : basso + 8 }
  }

  muoviUnita(u, dt) {
    const k = TRUPPE[u.id]
    if (u.fl > 0) u.fl -= dt
    if (u.colpo > 0) u.colpo -= dt
    u.cammina = false
    if (u.nasce > 0) { u.nasce -= dt; return }
    if (u.cool > 0) u.cool -= dt

    let bers = null, mn = 1e9
    if (k.bers !== 'torri') {
      for (const e of this.unita) {
        if (e.lato === u.lato || !viva(e) || e.nasce > 0.4) continue
        if (k.bers === 'terra' && e.vola) continue
        const d = dist(u, e)
        if (d < mn && d <= SGUARDO) { mn = d; bers = e }
      }
    }
    if (!bers) {
      mn = 1e9
      for (const t of this.edificiContro(u)) {
        const d = dist(u, t)
        if (d < mn) { mn = d; bers = t }
      }
    }
    if (!bers) return

    if (dist(u, bers) - (bers.r || 8) <= k.gitt) {
      if (u.cool <= 0) { this.colpisci(u, k, bers); u.cool = k.rate; u.colpo = 0.25 }
      return
    }
    const m = this.verso(u, bers)
    const dx = m.x - u.x, dy = m.y - u.y, n = Math.hypot(dx, dy) || 1
    const v = Math.min(k.vel * dt, n)
    u.x += (dx / n) * v
    u.y += (dy / n) * v
    u.cammina = true
  }

  separa() {
    const u = this.unita
    for (let i = 0; i < u.length; i++) for (let j = i + 1; j < u.length; j++) {
      const a = u[i], b = u[j]
      if (a.vola !== b.vola) continue
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy)
      if (d > 0 && d < 12) {
        const s = (12 - d) / 2 / d
        a.x -= dx * s; a.y -= dy * s; b.x += dx * s; b.y += dy * s
      }
    }
  }

  muoviTorre(t, dt) {
    if (t.fl > 0) t.fl -= dt
    if (!viva(t)) return
    if (t.cool > 0) t.cool -= dt
    const k = TORRI[t.tipo], c = CRESCITA.torretta, davanti = t.tipo === 'p'
    const dmg = k.dmg * (davanti ? c.danno(t.liv) : 1)
    const rate = k.rate / (davanti ? c.cadenza(t.liv) : 1)
    const gitt = k.gitt + (davanti ? c.gittata(t.liv) : 0)
    let bers = null, mn = 1e9
    for (const e of this.unita) {
      if (e.lato === t.lato || !viva(e) || e.nasce > 0.4) continue
      const d = dist(t, e)
      if (d < mn && d <= gitt) { mn = d; bers = e }
    }
    if (bers && t.cool <= 0) {
      this.ferisci(bers, dmg)
      this.evento({ tipo: 'colpo', da: 'torre', lato: t.lato, x1: t.x, y1: t.y - 12, x2: bers.x, y2: bers.y, scoppio: 0 })
      t.cool = rate
    }
  }

  /* ───────── la fine ───────── */

  corone(lato) { return this.torri.filter(t => t.lato === altro(lato) && !viva(t)).length }
  vitaTorri(lato) { return this.torri.filter(t => t.lato === lato).reduce((s, t) => s + t.hp / t.max, 0) }

  controllaFine() {
    if (!viva(this.re('nem'))) this.fine = 'vinto'
    else if (!viva(this.re('io'))) this.fine = 'perso'
    else if (this.resto <= 0) {
      const a = this.corone('io'), b = this.corone('nem')
      if (a !== b) this.fine = a > b ? 'vinto' : 'perso'
      else {
        const va = this.vitaTorri('io'), vb = this.vitaTorri('nem')
        this.fine = Math.abs(va - vb) < 0.05 ? 'pari' : va > vb ? 'vinto' : 'perso'
      }
    }
  }

  /* ───────── le scelte: prezzi e azioni ─────────
     Ogni scelta si paga con monete di battaglia E con un calcolo, ma il
     calcolo lo fa chi sta sopra (la vista): qui si chiede solo «si può?»
     e poi «fallo». `calcoloDi` dice di che tipo e quanto grosso. */

  /* il prezzo di una scelta adesso, o null se non si può fare per ragioni sue */
  prezzo(lato, azione, id) {
    if (azione === 'costruisci') {
      if (!this.truppeAmmesse.includes(id) || this.caserme.some(c => c.lato === lato && c.id === id)) return null
      return this.postiLiberi(lato).length ? TRUPPE[id].costo : null
    }
    if (azione === 'potenzia') {
      const c = this.caserme.find(x => x.lato === lato && x.id === id)
      return c && c.liv < LIV_MAX ? CRESCITA.salita(c.liv) : null
    }
    if (azione === 'miniera') {
      const m = this.lati[lato].miniera
      return m < MINIERA_MAX ? CRESCITA.miniera.prezzo[m] : null
    }
    if (azione === 'muro') return AZIONI.muro.prezzo
    if (azione === 'ripara') return this.riparabili(lato).length ? AZIONI.ripara.prezzo : null
    if (azione === 'torretta') {
      const t = this.torretta(lato)
      return t && viva(t) && t.liv < LIV_MAX ? CRESCITA.torretta.prezzo(t.liv) : null
    }
    return null
  }

  puoFare(lato, azione, id) {
    const p = this.prezzo(lato, azione, id)
    return p !== null && this.lati[lato].monete >= p
  }

  /* di che calcolo si tratta: l'operazione e un «peso» da 1 a 10 che la vista
     traduce nella grandezza dei numeri */
  calcoloDi(lato, azione, id) {
    if (azione === 'costruisci') return { op: TRUPPE[id].op, peso: 1 + Math.ceil(TRUPPE[id].costo / 4) }
    if (azione === 'potenzia') {
      const c = this.caserme.find(x => x.lato === lato && x.id === id)
      return { op: TRUPPE[id].op, peso: Math.min(10, c.liv + 1) }
    }
    if (azione === 'miniera') return { op: AZIONI.miniera.op, peso: 3 + this.lati[lato].miniera }
    if (azione === 'torretta') return { op: AZIONI.torretta.op, peso: 2 + Math.ceil(this.torretta(lato).liv / 2) }
    return { op: AZIONI[azione].op, peso: azione === 'ripara' ? 4 : 3 }
  }

  paga(lato, p) { this.lati[lato].monete -= p; this.lati[lato].mosse++ }

  /* ogni azione torna true se è andata */
  fai(lato, azione, id) {
    if (this.fine || !this.puoFare(lato, azione, id)) return false
    const p = this.prezzo(lato, azione, id)
    if (azione === 'costruisci') return this.costruisci(lato, id, p)
    if (azione === 'potenzia') return this.potenzia(lato, id, p)
    if (azione === 'miniera') { this.paga(lato, p); this.lati[lato].miniera++; this.evento({ tipo: 'miniera', lato }); return true }
    if (azione === 'muro') return this.muro(lato, p)
    if (azione === 'ripara') return this.ripara(lato, p)
    if (azione === 'torretta') return this.potenziaTorretta(lato, p)
    return false
  }

  /* il posto lo sceglie il gioco: la corsia con meno caserme, e dentro il più al sicuro */
  costruisci(lato, id, p) {
    const liberi = this.postiLiberi(lato)
    const sx = liberi.filter(i => POSTI[i][0] < CAMPO.W / 2), dx = liberi.filter(i => POSTI[i][0] >= CAMPO.W / 2)
    const nSx = this.caserme.filter(c => c.lato === lato && POSTI[c.posto][0] < CAMPO.W / 2).length
    const nDx = this.caserme.filter(c => c.lato === lato).length - nSx
    let lista = nSx < nDx ? sx : nDx < nSx ? dx : (this.rnd() < 0.5 ? sx : dx)
    if (!lista.length) lista = sx.length ? sx : dx
    lista.sort((a, b) => POSTI[b][1] - POSTI[a][1])                  // il più lontano dal fiume per primo
    this.paga(lato, p)
    const c = this.nuovaCaserma(lato, id, lista[0], COSTRUZIONE)
    this.caserme.push(c)
    this.evento({ tipo: 'costruita', lato, id, x: c.x, y: c.y })
    return true
  }

  potenzia(lato, id, p) {
    const c = this.caserme.find(x => x.lato === lato && x.id === id)
    this.paga(lato, p)
    c.liv++
    c.max = CRESCITA.vitaCaserma(c.liv)
    c.hp = Math.min(c.max, c.hp + 60)
    this.evento({ tipo: 'potenziata', lato, id, liv: c.liv, x: c.x, y: c.y })
    return true
  }

  /* il muro sale nella prima fila libera; se sono in piedi tutte e due, rifà la più malconcia */
  muro(lato, p) {
    this.paga(lato, p)
    const mie = this.muriDi(lato)
    let fila = [0, 1].find(f => !mie.some(m => m.fila === f))
    if (fila === undefined) {
      const peggio = [...mie].sort((a, b) => a.hp / a.max - b.hp / b.max)[0]
      fila = peggio.fila
      this.muri = this.muri.filter(m => m !== peggio)
    }
    const m = this.nuovoMuro(lato, fila)
    this.muri.push(m)
    this.evento({ tipo: 'muro', lato, x: m.x, y: m.y })
    return true
  }

  riparabili(lato) {
    return [...this.torri, ...this.muri, ...this.caserme].filter(e => e.lato === lato && viva(e) && e.hp < e.max)
  }

  /* la riparazione va alla costruzione messa peggio */
  ripara(lato, p) {
    const e = this.riparabili(lato).sort((a, b) => a.hp / a.max - b.hp / b.max)[0]
    this.paga(lato, p)
    e.hp = Math.min(e.max, e.hp + e.max * RIPARA)
    this.evento({ tipo: 'cura', lato, x: e.x, y: e.y })
    return true
  }

  potenziaTorretta(lato, p) {
    const t = this.torretta(lato)
    this.paga(lato, p)
    t.liv++
    t.max += CRESCITA.torretta.vita
    t.hp = Math.min(t.max, t.hp + CRESCITA.torretta.vita)
    this.evento({ tipo: 'torretta', lato, liv: t.liv, x: t.x, y: t.y })
    return true
  }

  /* una caserma che sbaglia il calcolo si riposa: il prezzo è il tempo, mai le monete */
  sbagliata(lato, id) {
    const c = this.caserme.find(x => x.lato === lato && x.id === id)
    if (c) c.riposo = RIPOSO
  }
  inRiposo(lato, id) {
    const c = this.caserme.find(x => x.lato === lato && x.id === id)
    return !!c && c.riposo > 0
  }

  /* monete al secondo di adesso, per dirlo a schermo */
  alSecondo(lato) { const l = this.lati[lato]; return l.alSecondo * CRESCITA.miniera.resa(l.miniera) }
}
