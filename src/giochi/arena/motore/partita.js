// La partita dell'arena, senza schermo: niente DOM, niente Vue, e non sa cos'è
// una moneta vera (le «monete di battaglia» sono una valuta solo sua). Gira
// uguale in Node: è l'unico motivo per cui la difficoltà si misura.
// Il caso arriva da fuori (`rnd`), così una partita si rifà identica.
// Le regole e i numeri stanno in `dati/regole.js`; l'IA del nemico in `nemico.js`.
import {
  CAMPO, POSTI, TRUPPE, EDIFICIO_DI, CASTELLO, LIV_MAX, MINIERA_MAX, CRESCITA, AZIONI, MURO, RIPARA,
  RIPOSO, COSTRUZIONE, NEMICI, GIOCATORE, DURATA, BOMBA,
} from '../dati/regole.js'
import { pensaNemico, creaIA } from './nemico.js'

const PASSO = 0.05                       // secondi di una fetta di tempo: la partita avanza a passi fissi
const SGUARDO = 80                       // fin dove una truppa vede un'altra truppa
const MAX_EVENTI = 400
const DIFESA = 190                       // chi è nella sua metà accorre ai nemici entro questa distanza dal suo castello

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
    this.ia = creaIA(rnd)            // la scaletta che il nemico segue
    this.unita = []
    this.lati = {
      io: this.nuovoLato('io', GIOCATORE.moneteAlSecondo, sfida.monete ?? GIOCATORE.iniziali),
      nem: this.nuovoLato('nem', this.nemicoCfg.moneteAlSecondo, sfida.monete ?? GIOCATORE.iniziali),
    }
    this.forza = { io: 1, nem: (this.nemicoCfg.forza ?? 1) * (sfida.forzaNemico ?? 1) }
    this.castelli = ['io', 'nem'].map(lato => this.nuovoCastello(lato))
    this.muri = ['io', 'nem'].map(lato => this.nuovoMuro(lato))
    this.caserme = []                // si parte senza: la prima mossa è costruire la cripta, scegliendo la truppa
  }

  /* ───────── il mondo ───────── */

  casuale(a, b) { return a + Math.floor(this.rnd() * (b - a + 1)) }

  nuovoLato(lato, alSecondo, monete) {
    return { monete, alSecondo, miniera: 1, mosse: 0, bombe: 0, bombaT: BOMBA.ogni, abbattuti: 0, livelli: {} }
  }
  y(lato, y) { return lato === 'io' ? y : CAMPO.H - y }

  nuovoCastello(lato) {
    return { lato, tipo: 'castello', x: CAMPO.corsia, y: this.y(lato, CAMPO.base), hp: CASTELLO.hp, max: CASTELLO.hp, r: CASTELLO.r, liv: 1, cool: 0.5, fl: 0 }
  }
  /* il muro non si costruisce: c'è dall'inizio e, se crolla, resta il cumulo e si ricostruisce riparando */
  nuovoMuro(lato) {
    return { lato, tipo: 'muro', x: CAMPO.corsia, y: this.y(lato, CAMPO.muro), hp: MURO.hp, max: MURO.hp, r: MURO.r, fl: 0, crollato: false }
  }
  nuovaCaserma(lato, id, posto, t) {
    const [x, y] = POSTI[posto]
    const ed = EDIFICIO_DI[id]
    const liv = this.lati[lato].livelli[ed] || 1            // rifatta, riparte dal livello che l'edificio aveva
    const vita = CRESCITA.vitaCaserma(liv)
    return { lato, tipo: 'caserma', id, ed, posto, liv, t, ciclo: t, riposo: 0, x, y: this.y(lato, y), hp: vita, max: vita, r: 16, fl: 0 }
  }

  castello(lato) { return this.castelli.find(c => c.lato === lato) }
  casermeDi(lato) { return this.caserme.filter(c => c.lato === lato) }
  muro(lato) { return this.muri.find(m => m.lato === lato) }
  postiLiberi(lato) {
    return POSTI.map((_, i) => i).filter(i => !this.caserme.some(c => c.lato === lato && c.posto === i))
  }

  /* quello che una truppa può prendere di mira: torri, caserme e — se cammina — muri */
  edificiContro(u) {
    const lato = altro(u.lato)
    const lista = this.castelli.filter(c => c.lato === lato)
    for (const c of this.caserme) if (c.lato === lato) lista.push(c)
    if (!u.vola) for (const m of this.muri) if (m.lato === lato) lista.push(m)
    return lista.filter(viva)
  }

  /* l'ordine dell'assedio: chi cammina sfonda la porta in fondo al ponte, poi tutti le caserme,
     e il castello per ultimo: una lenta agonia, non un lampo */
  obiettivo(u) {
    const lato = altro(u.lato)
    const porta = this.muro(lato)
    if (!u.vola && porta && viva(porta) && !(lato === 'io' ? u.y > porta.y + 4 : u.y < porta.y - 4)) return porta
    let meglio = null, mn = 1e9
    for (const c of this.caserme) if (c.lato === lato && viva(c)) { const d = dist(u, c); if (d < mn) { mn = d; meglio = c } }
    if (meglio) return meglio
    return this.castello(lato)
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
      // la bomba in regalo: una ogni BOMBA.ogni secondi, fino a BOMBA.max in tasca
      if (l.bombe >= BOMBA.max) l.bombaT = BOMBA.ogni
      else if ((l.bombaT -= dt) <= 0) { l.bombe++; l.bombaT += BOMBA.ogni; this.evento({ tipo: 'bombaPronta', lato }) }
    }
    this.squadre(dt)
    for (const u of this.unita) this.muoviUnita(u, dt)
    this.separa()
    for (const c of this.castelli) this.muoviCastello(c, dt)
    this.unita = this.unita.filter(viva)
    for (const e of [...this.muri, ...this.caserme]) {
      if (e.fl > 0) e.fl -= dt
      if (!viva(e) && !e.crollato) {
        this.evento({ tipo: 'crollo', x: e.x, y: e.y, lato: e.lato, che: e.tipo, id: e.id, posto: e.posto })
        this.lati[altro(e.lato)].abbattuti++
        if (e.tipo === 'muro') e.crollato = true            // il cumulo resta, e si ricostruisce riparando
      }
    }
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
      this.schiera(c.lato, c.id, c.x, c.y + (c.lato === 'io' ? -16 : 16), CRESCITA.forza(c.liv), CRESCITA.omini(c.liv, TRUPPE[c.id].n))
    }
  }

  schiera(lato, id, x, y, forza = 1, extra = 0) {
    const k = TRUPPE[id]
    const f = forza * this.forza[lato]
    const n = k.n + extra
    for (let i = 0; i < n; i++) {
      const fila = Math.min(n, 4), dx = (i % 4 - (fila - 1) / 2) * 8
      this.unita.push({
        id, lato, x: x + dx, y: y + Math.floor(i / 4) * 8 * (lato === 'io' ? 1 : -1), hp: k.hp * f, max: k.hp * f, forza: f,
        cool: 0.9, fl: 0, colpo: 0, cammina: false, nasce: 0.8, vola: k.vola, dirY: 0, r: 8, raduno: !k.vola,
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
    // la difesa: nella propria metà si accorre ai nemici che si avvicinano al castello, anche se lontani
    const casa = this.castello(u.lato)
    if (k.bers !== 'torri' && sponda(u.y) === sponda(casa.y)) {
      for (const e of this.unita) {
        if (e.lato === u.lato || !viva(e) || e.nasce > 0.4) continue
        if (k.bers === 'terra' && e.vola) continue
        if (dist(e, casa) > DIFESA || sponda(e.y) !== sponda(casa.y)) continue
        const d = dist(u, e)
        if (d < mn) { mn = d; bers = e }
      }
    }
    if (!bers && k.bers !== 'torri') {
      for (const e of this.unita) {
        if (e.lato === u.lato || !viva(e) || e.nasce > 0.4) continue
        if (k.bers === 'terra' && e.vola) continue
        const d = dist(u, e)
        if (d < mn && d <= SGUARDO) { mn = d; bers = e }
      }
    }
    // nessuna truppa in vista: si va all'obiettivo, nell'ordine dell'assedio
    if (!bers) bers = this.obiettivo(u)
    if (!bers || !viva(bers)) return

    if (dist(u, bers) - (bers.r || 8) <= k.gitt) {
      if (u.cool <= 0) { this.colpisci(u, k, bers); u.cool = k.rate; u.colpo = 0.25 }
      return
    }
    // appena usciti dalla caserma si va sulla strada, poi si marcia in fila (niente tagli in diagonale)
    if (u.raduno && Math.abs(u.x - CAMPO.corsia) < 10) u.raduno = false
    const m = u.raduno && bers.tipo ? { x: CAMPO.corsia, y: u.lato === 'io' ? Math.min(u.y - 4, CAMPO.base - 75) : Math.max(u.y + 4, CAMPO.H - CAMPO.base + 75) } : this.verso(u, bers)
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
      if (d > 0 && d < 8) {
        const s = (8 - d) / 2 / d
        a.x -= dx * s; a.y -= dy * s; b.x += dx * s; b.y += dy * s
      }
    }
  }

  muoviCastello(t, dt) {
    if (t.fl > 0) t.fl -= dt
    if (!viva(t)) return
    if (t.cool > 0) t.cool -= dt
    const c = CRESCITA.castello
    const dmg = CASTELLO.dmg * c.danno(t.liv)
    const rate = CASTELLO.rate / c.cadenza(t.liv)
    const gitt = CASTELLO.gitt + c.gittata(t.liv)
    let bers = null, mn = 1e9
    for (const e of this.unita) {
      if (e.lato === t.lato || !viva(e) || e.nasce > 0.4) continue
      const d = dist(t, e)
      if (d < mn && d <= gitt) { mn = d; bers = e }
    }
    if (bers && t.cool <= 0) {
      const colpo = dmg * (mn <= CASTELLO.difesa ? CASTELLO.vicino : 1)   // sotto casa picchia di più
      this.ferisci(bers, colpo)
      for (const e of this.unita) {
        if (e === bers || e.lato === t.lato || !viva(e)) continue
        if (Math.hypot(e.x - bers.x, e.y - bers.y) <= CASTELLO.splash) this.ferisci(e, colpo * 0.8)
      }
      this.evento({ tipo: 'colpo', da: 'castello', lato: t.lato, x1: t.x, y1: t.y - 12, x2: bers.x, y2: bers.y, scoppio: CASTELLO.splash })
      t.cool = rate
    }
  }

  /* ───────── la fine ───────── */

  vitaBase(lato) { const c = this.castello(lato); return c.hp / c.max }
  punti(lato) { return this.lati[lato].abbattuti + 3 * (1 - this.vitaBase(altro(lato))) }

  controllaFine() {
    if (!viva(this.castello('nem'))) this.fine = 'vinto'
    else if (!viva(this.castello('io'))) this.fine = 'perso'
    else if (this.resto <= 0) {
      // allo scadere vince chi ha fatto più danni: ogni costruzione abbattuta vale uno, il castello tre
      const a = this.punti('io'), b = this.punti('nem')
      this.fine = Math.abs(a - b) < 0.25 ? 'pari' : a > b ? 'vinto' : 'perso'
    }
  }

  /* ───────── le scelte: prezzi e azioni ─────────
     Ogni scelta si paga con monete di battaglia E con un calcolo, ma il
     calcolo lo fa chi sta sopra (la vista): qui si chiede solo «si può?»
     e poi «fallo». `calcoloDi` dice di che tipo e quanto grosso. */

  /* il prezzo di una scelta adesso, o null se non si può fare per ragioni sue */
  prezzo(lato, azione, id) {
    if (azione === 'costruisci') {
      if (!this.truppeAmmesse.includes(id) || this.caserme.some(c => c.lato === lato && c.ed === EDIFICIO_DI[id])) return null
      return this.postiLiberi(lato).length ? TRUPPE[id].costo : null
    }
    if (azione === 'potenzia') {
      const c = this.caserme.find(x => x.lato === lato && x.id === id)
      return c && c.liv < LIV_MAX ? CRESCITA.salita(c.liv) : null
    }
    if (azione === 'bomba') return this.lati[lato].bombe > 0 && this.puntoDellaBomba(lato) ? 0 : null
    if (azione === 'miniera') {
      const m = this.lati[lato].miniera
      return m < MINIERA_MAX ? CRESCITA.miniera.prezzo[m] : null
    }
    if (azione === 'ripara') return this.riparabili(lato).length ? AZIONI.ripara.prezzo : null
    if (azione === 'castello') {
      const t = this.castello(lato)
      return viva(t) && t.liv < LIV_MAX ? CRESCITA.castello.prezzo(t.liv) : null
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
    if (azione === 'bomba') return { op: AZIONI.bomba.op, peso: 5 }
    if (azione === 'castello') return { op: AZIONI.castello.op, peso: 2 + Math.ceil(this.castello(lato).liv / 2) }
    return { op: AZIONI[azione].op, peso: 4 }
  }

  paga(lato, p) { this.lati[lato].monete -= p; this.lati[lato].mosse++ }

  /* ogni azione torna true se è andata */
  fai(lato, azione, id) {
    if (this.fine || !this.puoFare(lato, azione, id)) return false
    const p = this.prezzo(lato, azione, id)
    if (azione === 'costruisci') return this.costruisci(lato, id, p)
    if (azione === 'potenzia') return this.potenzia(lato, id, p)
    if (azione === 'miniera') { this.paga(lato, p); this.lati[lato].miniera++; this.evento({ tipo: 'miniera', lato }); return true }
    if (azione === 'ripara') return this.ripara(lato, p)
    if (azione === 'castello') return this.potenziaCastello(lato, p)
    if (azione === 'bomba') return this.bomba(lato)
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
    lista.sort((a, b) => POSTI[b][1] - POSTI[a][1] || Math.abs(POSTI[a][0] - CAMPO.corsia) - Math.abs(POSTI[b][0] - CAMPO.corsia))   // il più lontano dal fiume, e attaccato al castello
    this.paga(lato, p)
    const c = this.nuovaCaserma(lato, id, lista[0], COSTRUZIONE)
    this.caserme.push(c)
    this.evento({ tipo: 'costruita', lato, id, ed: c.ed, x: c.x, y: c.y })
    return true
  }

  potenzia(lato, id, p) {
    const c = this.caserme.find(x => x.lato === lato && x.id === id)
    this.paga(lato, p)
    c.liv++
    this.lati[lato].livelli[c.ed] = c.liv
    const prima = c.max
    c.max = CRESCITA.vitaCaserma(c.liv)
    c.hp = Math.min(c.max, c.hp + c.max - prima)          // la vita in più arriva subito, come al castello
    this.evento({ tipo: 'potenziata', lato, id, liv: c.liv, x: c.x, y: c.y })
    return true
  }

  /* quello che si può rimettere in sesto: il muro anche se è crollato (il cumulo si ricostruisce) */
  riparabili(lato) {
    return [...this.castelli, ...this.muri, ...this.caserme].filter(e => e.lato === lato && e.hp < e.max && (e.tipo === 'muro' || viva(e)))
  }

  /* la riparazione va alla costruzione messa peggio */
  ripara(lato, p) {
    const e = this.riparabili(lato).sort((a, b) => a.hp / a.max - b.hp / b.max)[0]
    this.paga(lato, p)
    e.hp = Math.min(e.max, e.hp + e.max * RIPARA)
    if (e.tipo === 'muro') e.crollato = false
    this.evento({ tipo: 'cura', lato, x: e.x, y: e.y })
    return true
  }

  /* la bomba è un'ARMA DIFENSIVA: colpisce solo le truppe nemiche che sono entrate nella metà di chi
     la lancia (fra il fiume e il suo castello), nel punto dove sono più fitte (e più vive). Un'arma
     che colpisse ovunque servirebbe a poco: spazzerebbe truppe lontane che non fanno ancora danno.
     Non costa monete: ne arriva una ogni BOMBA.ogni secondi (`BOMBA`). */
  puntoDellaBomba(lato) {
    const meta = (CAMPO.fiume.alto + CAMPO.fiume.basso) / 2
    const nelMioCampo = u => (lato === 'io' ? u.y > meta : u.y < meta)
    const nemici = this.unita.filter(u => u.lato === altro(lato) && viva(u) && nelMioCampo(u))
    let meglio = null, peso = 0
    for (const c of nemici) {
      const p = nemici.reduce((s, u) => s + (Math.hypot(u.x - c.x, u.y - c.y) <= BOMBA.raggio ? Math.min(u.hp, BOMBA.dmg) : 0), 0)
      if (p > peso) { peso = p; meglio = c }
    }
    return meglio ? { x: meglio.x, y: meglio.y, peso } : null
  }

  bomba(lato) {
    const l = this.lati[lato]
    const p = this.puntoDellaBomba(lato)
    if (l.bombe <= 0 || !p) return false
    l.bombe--
    this.lati[lato].mosse++
    for (const u of this.unita) {
      if (u.lato !== altro(lato) || !viva(u)) continue
      if (Math.hypot(u.x - p.x, u.y - p.y) <= BOMBA.raggio) this.ferisci(u, BOMBA.dmg)
    }
    this.evento({ tipo: 'bomba', lato, x: p.x, y: p.y, raggio: BOMBA.raggio })
    return true
  }

  potenziaCastello(lato, p) {
    const t = this.castello(lato)
    this.paga(lato, p)
    t.liv++
    t.max += CRESCITA.castello.vita
    t.hp = Math.min(t.max, t.hp + CRESCITA.castello.vita)
    this.evento({ tipo: 'castello', lato, liv: t.liv, x: t.x, y: t.y })
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
