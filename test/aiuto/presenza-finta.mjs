/* ═══════════════════════════════════════════════════════════════════
   LA PRESENZA DEGLI AMICI SU UNA RETE FINTA E CATTIVA

   Come rete-finta.mjs, ma per il collegamento degli amici: un servizio con
   la logica vera (servizio/inoltro/src/presenza.js) e un WebSocket finto per
   telefono (`ws(chi)`), sull'orologio finto, con gli stessi guasti:
   `taglia(chi)`, `buco(chi)`, `spegni(chi, ms)`, `ferma(chi, ms)`.
   ═══════════════════════════════════════════════════════════════════ */
import { dichiara, chiudi, inoltra, controllaMessaggio } from '../../servizio/inoltro/src/presenza.js'

export function presenzaFinta({ orologio, rnd = Math.random, min = 40, max = 160 }) {
  const soci = [], fili = new Set(), guasti = new Map()
  const conta = { aperti: 0, messaggi: 0, rifiutati: 0 }
  const lat = () => min + rnd() * (max - min)
  const g = chi => guasti.get(chi) || {}
  const spenta = chi => orologio.ora() < (g(chi).spentaFino || 0)

  function consegna(filo, lato, f) {
    const quando = Math.max(filo.ultimo[lato], orologio.ora() + lat(), g(filo.chi).fermaFino || 0)
    filo.ultimo[lato] = quando
    orologio.dopo(quando - orologio.ora(), () => { if (!filo.buco) f() })
  }
  const manda = invii => { for (const { a, msg } of invii) consegna(a, 'giu', () => a.ws.ricevi(JSON.stringify(msg))) }
  function esce(filo) {
    if (filo.finito) return
    filo.finito = true
    manda(chiudi(soci, filo))
    const i = soci.findIndex(s => s.ws === filo)
    if (i >= 0) soci.splice(i, 1)
  }
  function chiudiDalServizio(filo, codice, ragione) {
    if (filo.finito) return
    esce(filo)
    consegna(filo, 'giu', () => filo.ws.chiuso(codice, ragione))
  }

  function dalTelefono(filo, testo) {
    if (filo.finito) return
    if (testo === '{"t":"ping"}') return consegna(filo, 'giu', () => filo.ws.ricevi('{"t":"pong"}'))
    conta.messaggi++
    const c = controllaMessaggio(testo, filo.recenti, orologio.ora())
    if (!c.ok) { conta.rifiutati++; return chiudiDalServizio(filo, c.codice, c.ragione) }
    filo.recenti = c.recenti
    if (c.dato.k === 'dichiaro') {
      const r = dichiara(soci, filo, c.dato.id, c.dato.chiavi)
      for (const vecchio of r.sostituiti) {
        soci.splice(soci.findIndex(s => s.ws === vecchio), 1)
        vecchio.finito = true
        consegna(vecchio, 'giu', () => vecchio.ws.chiuso(1000, 'sostituito'))
      }
      const io = soci.find(s => s.ws === filo)
      if (io) io.chiavi = r.chiavi
      else soci.push({ ws: filo, id: c.dato.id, chiavi: r.chiavi })
      manda(r.invii)
    } else if (c.dato.k === 'a') manda(inoltra(soci, filo, c.dato.chiave, c.dato.m))
  }

  const ws = chi => class WebSocketFinto {
    constructor() {
      this.ev = {}; this.stato = 0
      const filo = this.filo = { ws: this, chi, ultimo: { su: 0, giu: 0 }, buco: false, finito: false, recenti: [] }
      fili.add(filo)
      if (spenta(chi)) { orologio.dopo(lat(), () => { this.emetti('error', {}); this.chiuso(1006, '') }); return }
      consegna(filo, 'su', () => {
        if (spenta(chi)) return consegna(filo, 'giu', () => { this.emetti('error', {}); this.chiuso(1006, '') })
        conta.aperti++
        consegna(filo, 'giu', () => { if (this.stato === 0) { this.stato = 1; this.emetti('open', {}) } })
      })
    }
    addEventListener(n, f) { (this.ev[n] ||= []).push(f) }
    emetti(n, e) { for (const f of this.ev[n] || []) f(e) }
    ricevi(testo) { if (this.stato === 1) this.emetti('message', { data: testo }) }
    chiuso(code, reason) { if (this.stato === 3) return; this.stato = 3; this.emetti('close', { code, reason }) }
    send(testo) {
      if (this.stato !== 1) throw new Error('non aperto')
      if (this.filo.buco || spenta(chi)) return
      consegna(this.filo, 'su', () => dalTelefono(this.filo, testo))
    }
    close() {
      if (this.stato === 3) return
      const eraAperto = this.stato === 1
      this.stato = 2
      if (!this.filo.buco && eraAperto) consegna(this.filo, 'su', () => esce(this.filo))
      orologio.dopo(lat(), () => this.chiuso(1000, ''))
    }
  }

  const di = chi => [...fili].filter(f => f.chi === chi && f.ws.stato <= 1)
  return {
    ws, conta,
    taglia(chi) { for (const f of di(chi)) { f.buco = true; orologio.dopo(lat(), () => f.ws.chiuso(1006, '')); orologio.dopo(lat(), () => esce(f)) } },
    buco(chi) { for (const f of di(chi)) f.buco = true },
    spegni(chi, ms) { guasti.set(chi, { ...g(chi), spentaFino: orologio.ora() + ms }); for (const f of di(chi)) f.buco = true },
    ferma(chi, ms) { guasti.set(chi, { ...g(chi), fermaFino: orologio.ora() + ms }) },
  }
}
