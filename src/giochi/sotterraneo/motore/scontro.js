// Lo scontro a gruppi (docs/sotterraneo/scontro.md): uno contro tanti, a turni, con la fila dell'iniziativa. Sono i metodi di
// Corsa che riguardano il combattimento, tenuti qui perché corsa.js non cresca ancora (`Object.assign(Corsa.prototype, ...)`
// in fondo a corsa.js). Gira in Node. Per la vista l'interfaccia è in docs/sotterraneo/scontro.md, «L'interfaccia per la vista».
//
// Il foglio dello scontro (`Corsa.foglio`, un dato):
//   che: 'scontro'     chi: il bersaglio di adesso      campo: i mostri in campo, nell'ordine dei posti (i morti restano al loro posto)
//   io: gli effetti sull'eroe       pieni: i colpi presi (Testa dura)      tirato: il primo tiro è già partito
//   coda: la fila dei turni (motore/turni.js)     fermate/pericolo: lo stop      apertura: le azioni prima del primo turno
//   turni, colpiti, minaccia, inArrivo, difese: quello che la vista legge (si rifanno in `aggiorna`)
import { COLPO_DEL_MOSTRO, RAGGIO_SCONTRO, MOSTRI_IN_CAMPO, CALMA } from '../dati/mondo.js'
import { MOSTRI } from '../dati/mostri.js'
import { NODI, aGrado, inVita, colpisce, FATTORE_DEL_SALTO } from '../dati/abilita.js'
import { ELEMENTI, STATI, fattoreDi } from '../dati/elementi.js'
import { difeseDi } from '../dati/grossi.js'
import { pericoloDi } from './pericolo.js'
import { nuovaFila, chiAgisce, agisci, togli, prossimi, primaDelSuoProssimo, TURNI_VISIBILI } from './turni.js'

// il mostro grosso occupa due posti del campo, gli altri uno
export const postiDi = m => (m.grosso ? 2 : 1)
export const velocitaDel = m => (m.velocita != null ? m.velocita : (MOSTRI[m.tipo] && MOSTRI[m.tipo].velocita) || 8)

// Le azioni dei mostri: oggi sempre il colpo. Un mostro agisce con «un'azione» (`azione` della sua scheda in dati/mostri.js,
// se manca è il colpo): le abilità dei mostri (chiamare dei sottoposti…) si aggiungono qui. Ogni azione torna un evento
const AZIONI_DEI_MOSTRI = {
  colpo(c, m) { return c.colpoDelMostro(m) },
}

// quanti tagli si sommano al più (Taglio profondo, Ferita aperta, Macello): il sangue è un danno che si costruisce
export const PILE_DEL_SANGUE = 3

const chiaviDegliEffetti = m => {
  const st = m.stati || {}
  return [st.veleno && st.veleno.scambi > 0 && 'veleno', st.sanguina && st.sanguina.scambi > 0 && 'sanguina', st.debole > 0 && 'debole',
          st.fermo > 0 && 'fermo', st.esposto && st.esposto.scambi > 0 && 'esposto', st.rotto && 'rotto'].filter(Boolean)
}

export const MetodiDelloScontro = {
  /* ═══════════ chi entra, chi parte ═══════════ */

  // i mostri vivi entro RAGGIO_SCONTRO dall'eroe, nella stanza di chi ha aperto lo scontro, svegli o no; al più
  // MOSTRI_IN_CAMPO posti, i più vicini (il grosso ne vale due), `m` sempre primo. Nessun rinforzo a scontro aperto
  chiEntra(m) {
    const dove = x => this.livello.stanzaDi(x.casa ? x.casa.x : x.x, x.casa ? x.casa.y : x.y)
    const sua = dove(m)
    const lontano = x => Math.hypot((x.fx != null ? x.fx : x.x + 0.5) - this.eroe.x, (x.fy != null ? x.fy : x.y + 0.5) - this.eroe.y)
    const altri = !sua ? [] : this.livello.robe
      .filter(r => r.che === 'mostro' && !r.morto && r !== m && dove(r) === sua && lontano(r) <= RAGGIO_SCONTRO)
      .sort((a, b) => lontano(a) - lontano(b))
    const campo = []
    let posti = 0
    for (const x of [m, ...altri]) {
      if (posti + postiDi(x) > MOSTRI_IN_CAMPO) break
      campo.push(x)
      posti += postiDi(x)
    }
    return campo
  },

  // il mostro arriva dalla metà dietro il verso in cui l'eroe guarda (`versoEroe`: l'ultimo passo, o dove guarda lo sprite)
  alleSpalle(m) {
    const v = this.versoEroe
    const dx = (m.fx != null ? m.fx : m.x + 0.5) - this.eroe.x, dy = (m.fy != null ? m.fy : m.y + 0.5) - this.eroe.y
    // solo dal cono di 120° dietro, lo specchio della luce: da un fianco l'alone lo fa vedere arrivare (docs/sotterraneo/luce.md)
    const d = Math.hypot(dx, dy), n = Math.hypot(v.dx, v.dy)
    return d > 1e-6 && n > 1e-6 && (v.dx * dx + v.dy * dy) / (d * n) < -0.5
  },

  // `tocco`: l'ha toccato l'eroe (la sorpresa, se dormiva); se no ti ha raggiunto lui (l'agguato, se arriva dalle spalle).
  // `solo`: niente gruppo, solo `m` (chi prova una regola da sola). L'agguato è un colpo di chi arriva, prima di tutto;
  // la sorpresa e il primo tiro mettono il primo turno dell'eroe prima della fila
  scontro(m, { tocco = false, solo = false } = {}) {
    const sorpresa = tocco && !m.sveglio
    const agguato = !tocco && this.alleSpalle(m)
    const campo = solo ? [m] : this.chiEntra(m)
    for (const x of campo) x.sveglio = true
    const primo = sorpresa || this.ha('primoTiro')
    const f = this.foglio = {
      che: 'scontro', chi: m, campo, fermate: 0, pericolo: null, io: {}, pieni: 0, tirato: false, agguato, sorpresa, apertura: [],
      coda: nuovaFila([{ id: 'eroe', lato: 'eroe', velocita: this.velocita, fatti: primo ? -1 : 0 },
                       ...campo.map((x, i) => ({ id: i, lato: 'mostri', velocita: velocitaDel(x) }))]),
    }
    this.pronta = null
    if (agguato) {
      const e = this.colpoDelMostro(m)
      e.agguato = true
      f.apertura.push(e)
      if (e.svenuto) return
      if (!this.vivi(f).length) { this.chiudi(); return }
    }
    const r = this.passaIlTurno(f, f.apertura)
    if (r === 'svenuto') return
    if (r === 'fine') { this.chiudi(); return }
    this.iniziaTurnoEroe(f)
  },

  vivi(f = this.foglio) { return f && f.campo ? f.campo.filter(x => !x.morto) : [] },

  /* ═══════════ il turno dell'eroe ═══════════ */

  // Comincia il turno dell'eroe: gli effetti che contano i suoi turni (la linfa cura, la protezione cala), il bersaglio (lo
  // stesso se è in piedi, se no il più ferito in proporzione), lo stop del pericolo, la domanda. Torna la ragione dello stop
  iniziaTurnoEroe(f) {
    const io = f.io
    if (io.linfa && io.linfa.scambi > 0) {
      this.vita = Math.min(this.vitaMax, this.vita + io.linfa.quanto)
      io.linfa = io.linfa.scambi > 1 ? { ...io.linfa, scambi: io.linfa.scambi - 1 } : null
    }
    if (io.parato > 0) io.parato--
    if (io.intoccabile > 0) io.intoccabile--
    this.bersaglioAuto(f)
    this.aggiorna(f)
    return this.chiediOFerma(f.chi)
  },

  bersaglioAuto(f) {
    if (f.chi && !f.chi.morto && f.campo.includes(f.chi)) return
    const vivi = this.vivi(f)
    if (!vivi.length) return
    const quota = x => x.ossa / (x.ossaMax || x.ossa || 1)
    f.chi = vivi.reduce((a, b) => (quota(b) < quota(a) ? b : a))
  },

  // chi lo vuole cambiare lo tocca: solo uno in campo e in piedi. Torna se è cambiato qualcosa
  scegliBersaglio(m) {
    const f = this.foglio
    if (!f || f.che !== 'scontro' || !f.campo.includes(m) || m.morto) return false
    if (f.chi === m) return true
    const prima = this.rincaroDi(f.chi)
    f.chi = m
    // la domanda cambia con chi si colpisce (un capo chiede di più); un'altra non c'è da rifare
    if (this.chiesta && this.rincaroDi(m) !== prima) this.chiedi('scontro', this.rincaroDi(m))
    this.aggiorna(f)
    return true
  },

  // Chi prenderebbe il colpo (o l'abilità `nodo`) adesso, nell'ordine dei posti: [{ chi, fattore }]. `vicini` il bersaglio e i due
  // accanto fra i vivi; `catena` il bersaglio e poi `salti` altri, ognuno il vivo più vicino (nei posti) all'ultimo colpito, a
  // parità quello dopo, ogni salto FATTORE_DEL_SALTO del precedente; `tutti` tutti i vivi
  colpitiDa(nodo = null, f = this.foglio) {
    if (!f || f.che !== 'scontro') return []
    const vivi = this.vivi(f)
    const i = vivi.indexOf(f.chi)
    if (i < 0) return []
    const forma = (nodo && nodo.forma) || 'uno'
    const presi = x => ({ chi: x, fattore: 1 })
    if (forma === 'tutti') return vivi.map(presi)
    if (forma === 'vicini') return [vivi[i - 1], vivi[i], vivi[i + 1]].filter(Boolean).map(presi)
    if (forma === 'catena') {
      const salti = nodo.salti ? aGrado(nodo, 'salti', this.grado(nodo.id) || 1) : 0
      const toccati = [i]
      let ultimo = i
      for (let k = 1; k <= salti; k++) {
        const liberi = vivi.map((_, j) => j).filter(j => !toccati.includes(j))
        if (!liberi.length) break
        liberi.sort((a, b) => Math.abs(a - ultimo) - Math.abs(b - ultimo) || b - a)
        ultimo = liberi[0]
        toccati.push(ultimo)
      }
      return toccati.map((j, k) => ({ chi: vivi[j], fattore: FATTORE_DEL_SALTO ** k }))
    }
    return [presi(f.chi)]
  },

  // Le difese di un mostro (dati/grossi.js, `difeseDi`): { resiste, teme, immune }, tre liste di chiavi (dati/elementi.js)
  difese(m) { return difeseDi(m) },

  // il fattore dell'elemento di un'abilità contro `m`: 0,5 se lo resiste, 1,5 se lo teme. L'attacco solito (senza nodo) e le
  // abilità che non colpiscono non hanno elemento
  fattoreElemento(m, nodo) { return nodo && colpisce(nodo) ? fattoreDi(this.difese(m), nodo.elemento) : 1 },

  // Gli effetti dell'abilità che questo mostro rifiuta (immunità agli stati): { veleno, debole, fermo, sanguina, stati } dove
  // le prime quattro dicono «non parte» e `stati` elenca le chiavi di STATI da dire a chi legge. Il `debole` che non è di gelo
  // (Rovi, Muro, Grido) non è uno stato che si rifiuta; il fermo del gelo (una prigione) si rifiuta anche per «non gela»
  effettiBloccati(m, nodo) {
    const r = { veleno: false, debole: false, fermo: false, sanguina: false, stati: [] }
    if (!nodo) return r
    const imm = this.difese(m).immune
    if (!imm.length) return r
    const gelo = nodo.elemento === 'gelo'
    if (nodo.veleno) {
      const s = nodo.elemento === 'fuoco' ? 'brucia' : 'avvelena'
      if (imm.includes(s)) { r.veleno = true; r.stati.push(s) }
    }
    if (nodo.debole && gelo && imm.includes('gela')) { r.debole = true; r.stati.push('gela') }
    if (nodo.fermo || nodo.quieto) {
      if (imm.includes('stordisce')) { r.fermo = true; r.stati.push('stordisce') }
      else if (gelo && imm.includes('gela')) { r.fermo = true; if (!r.stati.includes('gela')) r.stati.push('gela') }
    }
    if (nodo.sanguina && imm.includes('sanguina')) { r.sanguina = true; r.stati.push('sanguina') }
    return r
  },

  // Come prende il colpo (o l'abilità) il mostro `x`: { elemento, effetto: 'resiste' | 'teme' | null, rifiutati: [stati] }.
  // È il dato in più per la vista, nell'anteprima (`foglio.colpiti`) e in ogni colpito dell'esito
  comeLaPrende(x, nodo) {
    if (!nodo || !colpisce(nodo)) return { elemento: null, effetto: null, rifiutati: [] }
    const f = this.fattoreElemento(x, nodo)
    return { elemento: nodo.elemento, effetto: f < 1 ? 'resiste' : f > 1 ? 'teme' : null, rifiutati: this.effettiBloccati(x, nodo).stati }
  },

  // quello che la vista legge, rifatto a ogni cambio: la fila dei prossimi sette turni (con chi salterà il suo), chi prenderebbe
  // la scelta preparata, quanto picchia ogni mostro adesso, e la somma dei colpi che arrivano prima del prossimo turno
  aggiorna(f = this.foglio) {
    if (!f || f.che !== 'scontro') return
    const visti = new Map()
    f.turni = prossimi(f.coda, TURNI_VISIBILI).map(id => {
      if (id === 'eroe') return { chi: 'eroe', salta: false }
      const x = f.campo[id], k = visti.get(id) || 0
      visti.set(id, k + 1)
      return { chi: x, salta: ((x.stati || {}).fermo || 0) > k }
    })
    const nodo = this.pronta && NODI[this.pronta] ? NODI[this.pronta] : null
    f.colpiti = this.colpitiDa(nodo, f).map(c => ({ ...c, ...this.comeLaPrende(c.chi, nodo) }))
    f.difese = f.campo.map(x => this.difese(x))
    f.minaccia = this.vivi(f).map(x => ({ chi: x, colpisce: this.botta(x), salta: ((x.stati || {}).fermo || 0) > 0 }))
    f.inArrivo = this.colpiInArrivo(f)
  },

  // la somma dei colpi che arriveranno prima del prossimo turno dell'eroe (la fila li sa): un mostro stordito salta i suoi
  colpiInArrivo(f = this.foglio) {
    if (!f || f.che !== 'scontro') return 0
    const fatti = new Map()
    let somma = 0
    for (const id of primaDelSuoProssimo(f.coda, 'eroe')) {
      const x = f.campo[id]
      const k = fatti.get(id) || 0
      fatti.set(id, k + 1)
      if (!x || x.morto || ((x.stati || {}).fermo || 0) > k) continue
      somma += this.botta(x)
    }
    return somma
  },

  // Lo stop (motore/pericolo.js) si guarda quando tocca all'eroe, sulla somma dei colpi in arrivo; se no la domanda. Torna la ragione
  chiediOFerma(m) {
    const f = this.foglio
    const perche = pericoloDi({ vita: this.vita, vitaMax: this.vitaMax, male: this.colpiInArrivo(f), fermate: f.fermate || 0 })
    // uno stop senza niente da bere né da dove scappare offrirebbe solo «continuo»: non si ferma
    const scelte = this.pozioneGiusta() != null || this.puoScappare()
    if (!perche || !scelte) { this.chiedi('scontro', this.rincaroDi(f.chi || m)); return null }
    f.fermate = (f.fermate || 0) + 1
    f.pericolo = perche
    this.chiesta = null
    return perche
  },

  // le scelte dello stop. «scappo» è `scappa()`; «bevo» è `beviNelPericolo()`; qui si riprende a domandare
  continua() {
    const f = this.foglio
    if (!f || f.che !== 'scontro' || !f.pericolo) return { che: 'niente' }
    f.pericolo = null
    this.chiedi('scontro', this.rincaroDi(f.chi))
    return { che: 'continua' }
  },

  // Bere la pozione rossa costa il turno (docs/sotterraneo/scontro.md): beve quella che berrebbe la 🧪 della barra, poi
  // toccano ai mostri. Torna l'esito del turno (come `rispondi`), o null senza pozioni
  beviNelloScontro() {
    const f = this.foglio
    if (!f || f.che !== 'scontro') return null
    const i = this.pozioneGiusta()
    if (i == null) return null
    f.pericolo = null
    const k = this.zaino[i]
    this.usa(i)
    return this.finisciIlTurno(f, [{ chi: 'eroe', che: 'bevi', cosa: k }], f.chi)
  },
  beviNelPericolo() {
    const f = this.foglio
    if (!f || f.che !== 'scontro' || !f.pericolo) return null
    return this.beviNelloScontro()
  },

  // unico ingresso quando l'eroe risponde alla domanda dello scontro: giusto, parte il colpo (o l'abilità preparata); sbagliato,
  // va a vuoto e l'abilità resta pronta. Poi i turni dei mostri fino a quello dell'eroe (docs/sotterraneo/scontro.md)
  rispostaScontro(_m, giusto) {
    const f = this.foglio
    const bersaglio = f.chi
    return this.finisciIlTurno(f, [giusto ? this.colpoDelEroe(f) : { chi: 'eroe', che: 'sbaglia', bersaglio }], bersaglio)
  },

  // l'eroe ha fatto la sua azione: tocca ai mostri, uno alla volta, finché non torna a lui
  finisciIlTurno(f, azioni, bersaglio) {
    if (!this.vivi(f).length) { this.chiudi(); return this.esitoDello(azioni, bersaglio, { fine: true }) }
    f.coda = agisci(f.coda, 'eroe')
    const r = this.passaIlTurno(f, azioni)
    if (r === 'svenuto') return this.esitoDello(azioni, bersaglio, { svenuto: true })
    if (r === 'fine') { this.chiudi(); return this.esitoDello(azioni, bersaglio, { fine: true }) }
    return this.esitoDello(azioni, bersaglio, { ringhia: this.iniziaTurnoEroe(f) })
  },

  // L'azione dell'eroe quando risponde giusto: sceglie l'abilità preparata (se si può), la paga, ne applica gli effetti a tutti
  // quelli che prende, poi il colpo a ciascuno col suo danno. Prima gli effetti, poi il colpo: Spaccaroccia toglie la difesa al
  // colpo stesso che la toglie. Un'abilità difensiva prende il posto dell'attacco: niente colpo
  colpoDelEroe(f) {
    const bersaglio = f.chi
    const nodo = this.pronta && !this.perchéNonUsi(this.pronta) ? NODI[this.pronta] : null
    const presi = this.colpitiDa(nodo, f)
    if (nodo) {
      this.energia -= nodo.costo
      this.pronta = null
      this.usaAbilita(nodo, presi)
    }
    const colpisceDavvero = !nodo || colpisce(nodo)
    // il primo tiro dell'arco: il primo colpo di ogni scontro ha il suo bonus (e arriva prima della fila: `scontro`)
    let bonus = 1, primoTiro = false
    if (colpisceDavvero && !f.tirato && this.ha('primoTiro')) {
      f.tirato = true
      primoTiro = true
      bonus = 1 + this.sempre('primoTiro') / 100
    }
    const colpiti = []
    if (colpisceDavvero) {
      for (const { chi: x, fattore } of presi) {
        const dato = Math.max(1, Math.round(this.colpo(x, nodo) * fattore * bonus))
        x.ossa -= dato
        const caduto = x.ossa <= 0
        colpiti.push({ chi: x, dato, caduto, effetti: chiaviDegliEffetti(x), fattore, ...this.comeLaPrende(x, nodo) })
        if (caduto) this.muore(f, x)
      }
    }
    // Mano santa: una parte del danno fatto guarisce chi lo fa (anche con l'attacco solito)
    let rubato = 0
    if (colpisceDavvero && this.sempre('ruba') > 0) {
      rubato = Math.min(this.vitaMax - this.vita, Math.round(colpiti.reduce((a, c) => a + c.dato, 0) * this.sempre('ruba') / 100))
      if (rubato > 0) this.vita += rubato
      else rubato = 0
    }
    const volte = nodo ? (aGrado(nodo, 'per', this.grado(nodo.id)) || 1) : 1
    // `presi`: chi prende l'abilità anche se non fa danno (Rovi, Ninna nanna, Grido…), con gli stati che rifiuta: la vista ci posa
    // sopra il suo effetto (viste/racconto.js)
    const presiDa = presi.map(({ chi: x }) => ({ chi: x, rifiutati: nodo ? this.effettiBloccati(x, nodo).stati : [] }))
    return { chi: 'eroe', che: nodo ? 'abilita' : 'attacco', bersaglio, forma: (nodo && nodo.forma) || 'uno', colpiti, presi: presiDa,
             usata: nodo ? { id: nodo.id, nome: nodo.nome, glifo: nodo.glifo, elemento: nodo.elemento } : null, base: this.colpo(bersaglio), volte, primoTiro, rubato }
  },

  muore(f, x) {
    this.cade(x)
    f.coda = togli(f.coda, f.campo.indexOf(x))
  },

  /* ═══════════ il turno dei mostri ═══════════ */

  // I mostri agiscono uno alla volta, nell'ordine della fila, finché non tocca all'eroe. Torna 'svenuto' se l'eroe cade, 'fine'
  // se non c'è più nessuno in piedi (uno specchio può far cadere l'ultimo), niente se si arriva al turno dell'eroe
  passaIlTurno(f, azioni) {
    for (let giri = 0; giri < 1000; giri++) {
      const a = chiAgisce(f.coda)
      if (!a || a.lato === 'eroe') return null
      const x = f.campo[a.id]
      const eventi = this.turnoDelMostro(x)
      azioni.push(...eventi)
      f.coda = x.morto ? togli(f.coda, a.id) : agisci(f.coda, a.id)
      if (eventi.some(e => e.svenuto)) return 'svenuto'
      if (!this.vivi(f).length) return 'fine'
    }
    return null
  },

  // Il turno di un mostro: il veleno brucia (se cade, non agisce), uno stordito salta, se no fa la sua azione. Gli effetti che
  // durano si contano nei turni di chi li porta
  turnoDelMostro(x) {
    const eventi = []
    let st = x.stati || {}
    if (st.veleno && st.veleno.scambi > 0) {
      const dato = st.veleno.quanto
      x.ossa -= dato
      x.stati = st = { ...st, veleno: st.veleno.scambi > 1 ? { ...st.veleno, scambi: st.veleno.scambi - 1 } : null }
      const caduto = x.ossa <= 0
      eventi.push({ chi: x, che: 'veleno', dato, caduto })
      if (caduto) { this.cade(x); return eventi }
    }
    st = x.stati || {}
    // il taglio sanguina: ogni pila perde `quanto`, finché ci sono turni
    if (st.sanguina && st.sanguina.scambi > 0) {
      const dato = st.sanguina.quanto * st.sanguina.pile
      x.ossa -= dato
      x.stati = st = { ...st, sanguina: st.sanguina.scambi > 1 ? { ...st.sanguina, scambi: st.sanguina.scambi - 1 } : null }
      const caduto = x.ossa <= 0
      eventi.push({ chi: x, che: 'sanguina', dato, caduto })
      if (caduto) { this.cade(x); return eventi }
    }
    if (st.fermo > 0) eventi.push({ chi: x, che: 'salta', contro: 'eroe', preso: 0 })
    else {
      const azione = AZIONI_DEI_MOSTRI[(MOSTRI[x.tipo] && MOSTRI[x.tipo].azione) || 'colpo']
      eventi.push(azione(this, x))
    }
    if (x.morto) return eventi
    const ora = x.stati || {}
    if (ora.debole > 0 || ora.fermo > 0 || (ora.esposto && ora.esposto.scambi > 0))
      x.stati = { ...ora, debole: Math.max(0, (ora.debole || 0) - 1), fermo: Math.max(0, (ora.fermo || 0) - 1),
                  ...(ora.gelo ? { gelo: (ora.debole || 0) > 1 || (ora.fermo || 0) > 1 } : {}),
                  ...(ora.esposto ? { esposto: ora.esposto.scambi > 1 ? { ...ora.esposto, scambi: ora.esposto.scambi - 1 } : null } : {}) }
    return eventi
  },

  // Il colpo di un mostro: COLPO_DEL_MOSTRO per (attacco − difesa), almeno 1, qualunque sia la risposta data; poi gli effetti
  // (botta), la schivata, lo scudo che assorbe, lo specchio che rimanda
  colpoDelMostro(x) {
    const f = this.foglio
    const io = f.io
    let male = this.botta(x)
    const pieno = male
    const gelato = (x.stati || {}).debole > 0 && pieno > 0
    if (male > 0) f.pieni = (f.pieni || 0) + 1
    const schiva = male > 0 && this.schivata > 0 && this.rnd() * 100 < this.schivata
    if (schiva) { male = 0; this.dillo('🌀 schivato!') }
    let assorbito = 0
    if (male > 0 && io.scudo > 0) {
      assorbito = Math.min(io.scudo, male)
      io.scudo -= assorbito
      male -= assorbito
    }
    let rimandato = 0
    if (male > 0 && io.specchio) {
      rimandato = Math.round(male * io.specchio)
      io.specchio = 0
      male = 0
      x.ossa -= rimandato
    }
    const evento = { chi: x, che: 'colpo', contro: 'eroe', pieno, preso: male, schivato: schiva, assorbito, rimandato, gelato,
                     salvo: pieno === 0 && io.intoccabile > 0 ? 'intoccabile' : null }
    if (rimandato && x.ossa <= 0) { this.cade(x); evento.caduto = true; return evento }
    this.ferisci(male)
    if (this.vita <= 0 && this.resisti()) this.vita = 1
    if (this.vita <= 0) { this.svieni(); evento.svenuto = true; return evento }
    // Bordo a punte: chi ti colpisce si fa male (una parte di quello che ti toglie, almeno uno)
    const spine = this.sempre('spine')
    if (male > 0 && spine > 0) {
      const dato = Math.max(1, Math.round(male * spine / 100))
      x.ossa -= dato
      evento.spinato = dato
      if (x.ossa <= 0) { this.cade(x); evento.caduto = true }
    }
    return evento
  },

  // il colpo pieno di un mostro, prima degli effetti: COLPO_DEL_MOSTRO × (attacco − difesa), almeno 1
  danno(m) { return Math.max(1, Math.round(COLPO_DEL_MOSTRO * (m.att - this.dif))) },

  // Quanto arriva davvero con un suo colpo, con gli effetti (docs/sotterraneo/abilita.md): stordito e invulnerabile niente; la
  // protezione (parato, o i primi colpi di «Testa dura») dimezza; gelato dimezza ancora; la Parata ne toglie qualcuno. Non tocca
  // niente: lo scudo e lo specchio si consumano in `colpoDelMostro`. È anche il numero detto prima («ti colpisce 3»)
  botta(m) {
    const f = this.foglio && this.foglio.che === 'scontro' ? this.foglio : null
    const io = (f && f.io) || {}
    const st = m.stati || {}
    if (st.fermo > 0 || io.intoccabile > 0) return 0
    let x = this.danno(m)
    if (io.parato > 0 || (f && (f.pieni || 0) < this.sempre('testaDura'))) x = Math.ceil(x / 2)
    if (st.debole > 0) x = Math.floor(x / 2)
    return Math.max(0, x - this.sempre('graffioMeno'))
  },

  /* ═══════════ scappare ═══════════ */

  // il costo della fuga: un colpo solo, quello del mostro più forte in campo, quanti che siano
  costoFuga() {
    const f = this.foglio
    return f && f.che === 'scontro' ? this.vivi(f).reduce((a, x) => Math.max(a, this.botta(x)), 0) : 0
  },
  // se quel colpo farebbe svenire la fuga non si offre: non si obbliga a morire
  puoScappare() { return this.costoFuga() < this.vita },

  // Dopo la fuga la calma vale per tutti quelli che erano in campo (non immunità: chi resta nella stanza se lo ritrova addosso)
  scappa() {
    const f = this.foglio
    if (!f || f.che !== 'scontro') { this.chiudi(); return { che: 'niente' } }
    const preso = this.costoFuga()
    for (const x of this.vivi(f)) { x.calmo = CALMA; x.sveglio = false }
    this.ferisci(preso)   // quanto costa lo dice il tasto, prima; il globo sobbalza: niente avviso dopo
    if (this.vita <= 0) { this.svieni(); return { che: 'svenuto', preso } }
    this.chiudi()
    return { che: 'scappato', preso }
  },

  /* ═══════════ le abilità ═══════════ */

  // L'abilità da usare alla prossima risposta giusta (docs/sotterraneo/abilita.md): un tocco la prepara, un altro la
  // toglie. Si prepara solo se c'è l'energia e l'arma, ed è in una casella; sbagliando resta pronta e non si paga
  prepara(id) {
    const f = this.foglio
    if (!f || f.che !== 'scontro') return false
    if (this.pronta === id || !id) { this.pronta = null; this.aggiorna(f); return true }
    if (this.perchéNonUsi(id)) return false
    this.pronta = id
    this.aggiorna(f)
    return true
  },

  // Cosa farebbe l'abilità adesso, contro questo mostro, coi numeri veri (la riga della scelta nello scontro): «fai 12 di
  // danno · poi 3 a turno per 3 turni». Le difese e le cure non attaccano di più: dicono la riga dell'albero (`fa`)
  descrizione(nodo, m) {
    const g = this.grado(nodo.id) || 1
    const vale = c => aGrado(nodo, c, g)
    const turni = n => `${n} ${n === 1 ? 'turno' : 'turni'}`
    if (!colpisce(nodo)) return nodo.fa(g, this.vitaMax)
    const forma = { tutti: ' a tutti i mostri', vicini: ' a lui e ai due accanto',
                    catena: nodo.salti ? ` e salta su altri ${vale('salti')}` : '' }[nodo.forma] || ''
    const parti = [`fai ${this.colpo(m, nodo)} di danno${forma}`]
    // l'elemento contro questo mostro, e gli stati che non prende: «resiste al fuoco», «non si stordisce»
    const el = this.comeLaPrende(m, nodo)
    if (el.effetto === 'resiste') parti.push(`resiste ${ELEMENTI[el.elemento].a}`)
    else if (el.effetto === 'teme') parti.push(`teme ${ELEMENTI[el.elemento].il}`)
    for (const s of el.rifiutati) parti.push(STATI[s].non)
    const no = this.effettiBloccati(m, nodo)
    if (nodo.seStordito) parti.push('di più su chi è gelato, avvelenato, in fiamme, stordito o sanguina')
    if (nodo.rompe) parti.push('spezza la sua difesa')
    else if (nodo.passa) parti.push(nodo.passa === true || nodo.passa >= 1 ? 'ignora la sua difesa' : 'ignora metà della sua difesa')
    if (nodo.veleno && !no.veleno) parti.push(`poi ${Math.max(1, Math.ceil(this.colpo(m) * this.fattoreElemento(m, nodo) / 2))} a turno per ${turni(vale('veleno'))}`)
    if (nodo.sanguina && !no.sanguina) parti.push(`sanguina per ${turni(vale('sanguina'))}`)
    if (nodo.debole && !no.debole) parti.push(`fa metà danno per ${turni(vale('debole'))}`)
    if (nodo.fermo && !no.fermo) parti.push(`stordito per ${turni(vale('fermo'))}`)
    if (nodo.esposto) parti.push(`subisce il ${vale('esposto')}% in più`)
    if (nodo.quieto && !no.fermo) parti.push('salta il suo prossimo turno')
    if (nodo.capi && !this.èCapo(m)) parti.push('molto di più contro i capi')
    return parti.join(' · ')
  },

  // perché un'abilità delle caselle non si può usare adesso ('' se si può): la riga sul tasto spento
  perchéNonUsi(id) {
    const nodo = NODI[id]
    if (!nodo || nodo.sempre || !this.grado(id)) return 'non la sai'
    if (!this.haLArma(nodo.arma)) return nodo.arma.corto
    if (this.energia < nodo.costo) return 'poca energia'
    return ''
  },

  // L'abilità entra in gioco: gli effetti su tutti quelli che prende (`presi`, da colpitiDa), sull'eroe, la cura. Il colpo lo
  // conta chi chiama. Gli effetti che durano si contano nei turni di chi li porta (il mostro, o l'eroe)
  usaAbilita(nodo, presi) {
    const g = this.grado(nodo.id)
    const io = this.foglio.io
    const vale = c => aGrado(nodo, c, g)
    const sulMostro = (x, base) => {
      x.stati = { ...(x.stati || {}) }
      // chi è immune a uno stato lo rifiuta (il colpo fa il suo danno, l'effetto non parte); l'elemento conta anche nei
      // danni che durano: un mostro che teme il fuoco brucia di più, uno che lo resiste di meno
      const no = this.effettiBloccati(x, nodo)
      const fattore = this.fattoreElemento(x, nodo)
      if (nodo.rompe) x.stati.rotto = true
      if (nodo.veleno && !no.veleno) x.stati.veleno = { quanto: Math.max(1, Math.ceil(base * fattore / 2)), scambi: vale('veleno'), fuoco: nodo.elemento === 'fuoco' }
      if (nodo.debole && !no.debole) x.stati.debole = Math.max(x.stati.debole || 0, vale('debole'))
      // `gelo` dice solo come si disegna (brina e azzurro, non un mostro «fiacco»): non cambia nessun conto
      if (nodo.elemento === 'gelo' && ((nodo.debole && !no.debole) || ((nodo.fermo || nodo.quieto) && !no.fermo))) x.stati.gelo = true
      // stordito salta i suoi prossimi N turni; Freccia mirata ne fa saltare uno
      if (nodo.fermo && !no.fermo) x.stati.fermo = Math.max(x.stati.fermo || 0, vale('fermo'))
      if (nodo.quieto && !no.fermo) x.stati.fermo = Math.max(x.stati.fermo || 0, 1)
      // Radici: bloccato, il mostro è un bersaglio facile per tutto il tempo che resta fermo
      if (nodo.esposto && !no.fermo) x.stati.esposto = { scambi: vale('fermo'), piu: vale('esposto') }
      // un taglio nuovo si somma ai vecchi (fino a tre) e rimette a posto la durata
      if (nodo.sanguina && !no.sanguina) {
        const prima = x.stati.sanguina && x.stati.sanguina.scambi > 0 ? x.stati.sanguina : null
        x.stati.sanguina = { quanto: Math.max(prima ? prima.quanto : 0, Math.max(1, Math.ceil(base * fattore / 4))), scambi: vale('sanguina'),
                             pile: Math.min(PILE_DEL_SANGUE, (prima ? prima.pile : 0) + 1) }
      }
    }
    if (nodo.cura) {
      const c = inVita(vale('cura'), this.vitaMax)   // lo stesso conto della riga dell'albero
      this.vita = Math.min(this.vitaMax, this.vita + c)
      this.dillo(`${nodo.nome}: ❤️ +${c}`)
    }
    if (nodo.scudo) io.scudo = (io.scudo || 0) + inVita(vale('scudo'), this.vitaMax)
    if (nodo.parato) io.parato = Math.max(io.parato || 0, vale('parato'))
    if (nodo.intoccabile) io.intoccabile = Math.max(io.intoccabile || 0, vale('intoccabile'))
    if (nodo.specchio) io.specchio = vale('specchio')
    if (nodo.linfa) io.linfa = { quanto: Math.max(1, Math.round(this.vitaMax / 10)), scambi: vale('linfa') }
    for (const { chi: x } of presi) sulMostro(x, this.colpo(x))
  },

  /* ═══════════ l'esito, per chi guarda ═══════════ */

  // L'esito di un turno dell'eroe: `azioni` in ordine (la sua e quelle dei mostri che hanno agito dopo), con in cima i campi
  // dello scambio come li leggeva il duello (dato, preso, usata, colpiti, veleno…) per la vista di oggi
  esitoDello(azioni, bersaglio, { ringhia = null, fine = false, svenuto = false } = {}) {
    const mia = azioni.find(a => a.chi === 'eroe') || {}
    const suoi = azioni.filter(a => a.chi !== 'eroe')
    const sul = (mia.colpiti || []).find(c => c.chi === bersaglio)
    const dato = sul ? sul.dato : 0
    const colpi = suoi.filter(a => a.che === 'colpo')
    const preso = colpi.reduce((n, a) => n + a.preso, 0)
    const veleno = suoi.filter(a => (a.che === 'veleno' || a.che === 'sanguina') && a.chi === bersaglio).reduce((n, a) => n + a.dato, 0)
    const caduti = [...(mia.colpiti || []).filter(c => c.caduto).map(c => c.chi),
                    ...suoi.filter(a => a.caduto).map(a => a.chi)]
    const detto = {
      dato, preso, veleno, usata: mia.usata || null, colpiti: (mia.colpiti || []).filter(c => c.chi !== bersaglio).length,
      rimandato: colpi.reduce((n, a) => n + (a.rimandato || 0), 0), base: mia.base || 0, volte: mia.volte || 1,
      primoTiro: !!mia.primoTiro, assorbito: colpi.reduce((n, a) => n + (a.assorbito || 0), 0),
      gelato: colpi.some(a => a.gelato), schivato: colpi.some(a => a.schivato),
      salvo: preso > 0 ? null : (colpi.find(a => a.salvo) || {}).salvo || (suoi.some(a => a.che === 'salta') ? 'fermo' : null),
      azioni, caduti, fine, ringhia,
    }
    if (svenuto) return { che: 'svenuto', ...detto }
    if (mia.che === 'bevi') return { che: 'bevuto', ...detto }
    if (sul && sul.caduto) return { che: 'caduto', chi: bersaglio, ...detto, preso: fine ? 0 : preso }
    if (mia.che === 'sbaglia') return { che: 'ferito', quanto: preso, ...detto }
    return { che: 'colpo', restano: this.colpiPer(bersaglio), male: preso, ...detto, schivato: detto.schivato }
  },
}
