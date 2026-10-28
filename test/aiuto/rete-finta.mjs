/* ═══════════════════════════════════════════════════════════════════
   UNA RETE FINTA E CATTIVA, COL TAVOLO VERO DENTRO

   Per provare il gioco in due senza internet e senza aspettare: un
   orologio finto (i minuti passano in un attimo), un servizio che usa
   la logica vera del tavolo (servizio/inoltro/src/tavolo.js, come il
   Durable Object) e un WebSocket finto per i telefoni, con i guasti
   che i telefoni hanno davvero (docs/core/insieme.md, «Le prove»):
   - `taglia(posto)`   il filo cade, e se ne accorgono tutti e due
   - `buco(posto)`     il filo muore senza dirlo a nessuno: niente passa
                       e niente si chiude (il servizio non lo saprà mai)
   - `spegni(posto, ms)` niente rete per un po': il filo muore e i nuovi
                       non si aprono
   - `ferma(posto, ms)` tutto resta in coda per un po' e poi arriva in
                       blocco (la rete che «si pianta»)
   La latenza va da `min` a `max` ms, e ogni direzione di un filo
   consegna in ordine, come TCP.
   ═══════════════════════════════════════════════════════════════════ */
import * as tavolo from '../../servizio/inoltro/src/tavolo.js'

export function orologioFinto() {
  let ora = 0, id = 0
  const timer = new Map()
  return {
    ora: () => ora,
    dopo(ms, f) { timer.set(++id, { quando: ora + Math.max(0, ms), f }); return id },
    ogni(ms, f) { timer.set(++id, { quando: ora + ms, f, ogni: ms }); return id },
    ferma(i) { timer.delete(i) },
    /* fa passare `ms`, scattando i timer in ordine */
    avanti(ms) {
      const fine = ora + ms
      for (;;) {
        let primo = null, chi = 0
        for (const [i, t] of timer) if (t.quando <= fine && (!primo || t.quando < primo.quando || (t.quando === primo.quando && i < chi))) { primo = t; chi = i }
        if (!primo) break
        ora = Math.max(ora, primo.quando)
        if (primo.ogni) primo.quando += primo.ogni
        else timer.delete(chi)
        primo.f()
      }
      ora = fine
    },
  }
}

/* il servizio e i fili. `rnd`: un caso con seme (motore/banco.js `caso`), per una latenza che si può rifare */
export function reteFinta({ orologio, rnd = Math.random, min = 40, max = 160 }) {
  const tavoli = new Map()                     // codice → { dato, fili: Set<filo>, allarme }
  const guasti = new Map()                     // posto → { spentaFino, fermaFino }
  const fili = new Set()
  const conta = { aperti: 0, messaggi: 0, rifiutati: 0 }
  const lat = () => min + rnd() * (max - min)
  const g = posto => guasti.get(posto) || {}
  const spenta = posto => orologio.ora() < (g(posto).spentaFino || 0)

  /* consegna in ordine su una direzione di un filo: `lato` è 'su' (verso il servizio) o 'giu' (verso il telefono) */
  function consegna(filo, lato, f) {
    const quando = Math.max(filo.ultimo[lato], orologio.ora() + lat(), g(filo.posto).fermaFino || 0)
    filo.ultimo[lato] = quando
    orologio.dopo(quando - orologio.ora(), () => { if (!filo.buco) f() })
  }

  const vivi = (t, tranne = null) => [...t.fili].filter(f => f !== tranne && !f.sostituito && !f.chiusoServizio).map(f => ({ ws: f, posto: f.posto }))
  const manda = invii => { for (const { a, msg } of invii) alTelefono(a, JSON.stringify(msg)) }
  const alTelefono = (filo, testo) => { if (!filo.chiusoServizio) consegna(filo, 'giu', () => filo.ws.ricevi(testo)) }
  function armaAllarme(t) {
    orologio.ferma(t.allarme)
    t.allarme = orologio.dopo(tavolo.prossimo(t.dato) - orologio.ora(), () => {
      const r = tavolo.allarme(t.dato, vivi(t), orologio.ora())
      manda(r.invii)
      for (const f of r.chiudi) chiudiDalServizio(f, 4001, 'chiuso')
      if (r.fine) { orologio.ferma(t.allarme); tavoli.delete(t.codice) } else armaAllarme(t)
    })
  }

  /* il servizio chiude un filo: il telefono lo sa (se il filo è vivo) */
  function chiudiDalServizio(filo, codice, ragione) {
    if (filo.chiusoServizio) return
    filo.chiusoServizio = true
    consegna(filo, 'giu', () => filo.ws.chiuso(codice, ragione))
  }

  /* un filo che si chiude dal lato del servizio (per un addio, o perché il telefono l'ha chiuso, o è caduto) */
  function esce(filo, addio = false) {
    const t = tavoli.get(filo.codice)
    if (!t || filo.sostituito || filo.uscito) return
    filo.uscito = true
    const r = tavolo.esce(t.dato, vivi(t, filo), filo.posto, orologio.ora(), { addio })
    filo.chiusoServizio = true
    manda(r.invii)
    if (r.fine) { orologio.ferma(t.allarme); tavoli.delete(t.codice) } else armaAllarme(t)
  }

  function dalTelefono(filo, testo) {
    const t = tavoli.get(filo.codice)
    if (!t || filo.sostituito || filo.chiusoServizio) return
    conta.messaggi++
    const s = tavolo.secchio(filo.secchio, orologio.ora())
    filo.secchio = s.s
    if (!s.ok) { conta.rifiutati++; chiudiDalServizio(filo, 1008, 'troppi messaggi'); return esce(filo) }
    const l = tavolo.leggiMessaggio(testo)
    if (!l.ok) { chiudiDalServizio(filo, l.codice, l.ragione); return esce(filo) }
    if (l.dato.t === 'ping') return alTelefono(filo, '{"t":"pong"}')
    if (l.dato.t === 'addio') { esce(filo, true); return chiudiDalServizio(filo, 1000, 'addio') }
    for (const c of vivi(t, filo)) if (c.posto !== filo.posto) alTelefono(c.ws, testo)
  }

  /* un telefono apre un filo */
  function apri(ws, url) {
    const [, codice, posto] = url.match(/\/tavolo\/([A-Z]{5})\?posto=([a-z0-9]+)/) || []
    const filo = { ws, codice, posto, ultimo: { su: 0, giu: 0 }, buco: false, sostituito: false, chiusoServizio: false, uscito: false, secchio: undefined }
    fili.add(filo)
    ws.filo = filo
    if (spenta(posto)) { orologio.dopo(lat(), () => { ws.errore(); ws.chiuso(1006, '') }); return }
    consegna(filo, 'su', () => {
      if (spenta(posto)) return consegna(filo, 'giu', () => { ws.errore(); ws.chiuso(1006, '') })
      const t = tavoli.get(codice)
      const no = perche => { filo.chiusoServizio = true; consegna(filo, 'giu', () => { ws.aperto(); ws.ricevi(JSON.stringify({ t: 'no', perche })); ws.chiuso(4001, perche) }) }
      if (!t) return no('nessuno')
      const r = tavolo.entra(t.dato, vivi(t), posto, orologio.ora())
      if (r.esito !== 'ok') return no(r.esito)
      for (const v of r.sostituiti) { v.sostituito = true; chiudiDalServizio(v, 4000, 'sostituito') }
      t.fili.add(filo)
      conta.aperti++
      consegna(filo, 'giu', () => ws.aperto())
      alTelefono(filo, JSON.stringify(r.ciao))
      manda(r.invii)
      armaAllarme(t)
    })
  }

  class WebSocketFinto {
    constructor(url) { this.url = url; this.ev = {}; this.stato = 0; apri(this, url) }
    addEventListener(n, f) { (this.ev[n] ||= []).push(f) }
    emetti(n, e) { for (const f of this.ev[n] || []) f(e) }
    aperto() { if (this.stato === 0) { this.stato = 1; this.emetti('open', {}) } }
    ricevi(testo) { if (this.stato === 1) this.emetti('message', { data: testo }) }
    errore() { if (this.stato < 3) this.emetti('error', {}) }
    chiuso(code, reason) { if (this.stato === 3) return; this.stato = 3; this.emetti('close', { code, reason, wasClean: code !== 1006 }) }
    send(testo) {
      if (this.stato !== 1) throw new Error('non aperto')
      const filo = this.filo
      if (filo.buco || spenta(filo.posto)) return
      consegna(filo, 'su', () => dalTelefono(filo, testo))
    }
    close() {
      if (this.stato === 3) return
      const filo = this.filo
      const eraAperto = this.stato === 1
      this.stato = 2
      if (!filo.buco && eraAperto) consegna(filo, 'su', () => { if (!filo.chiusoServizio) esce(filo) })
      orologio.dopo(lat(), () => this.chiuso(1000, ''))
    }
  }

  return {
    WebSocketImpl: WebSocketFinto,
    conta,
    tavoli,
    /* un tavolo nuovo, come `GET /tavolo/nuovo?posto=…` */
    nuovo(postoHost, codice = 'ABCDE') {
      const t = { codice, dato: tavolo.nuovoTavolo(orologio.ora(), postoHost), fili: new Set(), allarme: 0 }
      tavoli.set(codice, t)
      armaAllarme(t)
      return codice
    },
    filiDi: posto => [...fili].filter(f => f.posto === posto && f.ws.stato <= 1),
    /* il filo cade: il telefono lo sa subito o quasi, il servizio pure */
    taglia(posto) {
      for (const f of [...fili].filter(f => f.posto === posto && f.ws.stato <= 1)) {
        f.buco = true
        orologio.dopo(lat(), () => f.ws.chiuso(1006, ''))
        orologio.dopo(lat(), () => esce(f))
      }
    },
    /* il filo muore senza dirlo a nessuno */
    buco(posto) { for (const f of fili) if (f.posto === posto) f.buco = true },
    /* niente rete per `ms`: i fili che c'erano muoiono in silenzio, i nuovi non si aprono */
    spegni(posto, ms) {
      guasti.set(posto, { ...g(posto), spentaFino: orologio.ora() + ms })
      for (const f of fili) if (f.posto === posto) f.buco = true
    },
    /* tutto in coda per `ms`, poi in blocco */
    ferma(posto, ms) { guasti.set(posto, { ...g(posto), fermaFino: orologio.ora() + ms }) },
  }
}
