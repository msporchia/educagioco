/* La fattoria in comune sul telefono (docs/fattoria3d/in-comune.md): si apre solo online, dalla fotografia del servizio più le
   mosse dopo di lei; poi le proprie mosse partono man mano e quelle dell'amico arrivano ogni tre secondi, rifatte qui nell'ordine
   in cui arrivano (motore/registro.js). Uscendo si lascia la fotografia, e il telefono ne tiene una copia: se sul servizio la
   fattoria è scaduta, la copia la rimette in piedi. Gli amici sono un di più: niente qui dà errori al resto del gioco. */
import { load, save, flush } from '../../store/storage.js'
import { dati } from '../../store/amici.js'
import { scambiaComune } from '../../amici/rete.js'
import { Fattoria3d } from './motore/fattoria3d.js'
import { registra, rifai, mossaInForma } from './motore/registro.js'

export const OGNI = 3000                 // ms fra una lettura e l'altra mentre si gioca
export const PRESTO = 400                // ms dopo una mossa propria: si manda, raccogliendo quelle fatte di fila
const FOTO_OGNI = 40                     // giri (due minuti): una fotografia anche senza uscire, se non c'è niente in viaggio
const PREFISSO = 'fattoria3d-comune:'
const MAX_PER_GIRO = 20

/* gli amici con cui si può avere una fattoria in comune: quelli che hanno un nome (incontrati online almeno una volta) */
export const amiciPerComune = () => dati.attivo ? dati.amici.filter(a => a.nome) : []
export const nomeDellAmico = chiave => (dati.amici.find(a => a.chiave === chiave) || {}).nome || 'il tuo amico'

/* Apre la fattoria in comune dell'amicizia `chiave`. Torna una `Sessione` col motore pronto, o lancia con la frase da dire. */
export async function apriComune({ chiave, borsa, ora = Date.now, opzioni } = {}) {
  if (!dati.attivo) throw new Error('Gli amici sono spenti.')
  const mio = dati.id
  let copia = null
  try { copia = await load(PREFISSO + chiave) } catch (e) { /* niente copia */ }
  const r = await scambiaComune(chiave, mio, { dopo: -1 }, opzioni)
  if (r === undefined) throw new Error('Per la fattoria in comune serve internet.')
  if (r === null) throw new Error('Questa fattoria in comune è già di altri due.')
  let base = null, seq = 0
  if (r.foto) { base = r.foto.stato; seq = r.foto.seq }
  else if (copia && copia.stato) { base = copia.stato; seq = Number.isInteger(copia.seq) ? copia.seq : 0 }
  const motore = new Fattoria3d({ stato: base, borsa, ora })
  for (const x of r.mosse) {
    if (x.s <= seq) continue
    const m = mossaInForma(x.m)
    if (m) rifai(motore, m)
    seq = x.s
  }
  motore.prendiEventi()                  // aprendo non si conta niente: quello che è successo prima è già contato da chi l'ha fatto
  const s = new Sessione({ chiave, mio, motore, seq, corsia: r.corsia === 1 ? 1 : 0, opzioni })
  if (!r.foto && r.ultimo === 0 && !r.mosse.length) await s.giro({ foto: true })       // una fattoria nuova (o scaduta): la prima fotografia
  return s
}

export class Sessione {
  constructor({ chiave, mio, motore, seq, corsia, opzioni }) {
    Object.assign(this, { chiave, mio, motore, seq, corsia, opzioni })
    this.coda = []                       // le mie mosse da mandare
    this.inViaggio = false
    this.giri = 0
    this.timer = 0; this.presto = 0
    this.alCambio = () => {}             // ({ mosse: [{ n, livello }], ricarica }) quando arriva qualcosa dall'amico
    this.smetti = null
  }

  avvia() {
    this.smetti = registra(this.motore, m => {
      this.coda.push(m)
      clearTimeout(this.presto)
      this.presto = setTimeout(() => this.giro().catch(() => {}), PRESTO)
    }, { corsia: this.corsia })
    this.timer = setInterval(() => this.giro().catch(() => {}), OGNI)
  }

  /* manda le mie mosse (o la fotografia, se non c'è niente in viaggio) e rifà quelle arrivate */
  async giro({ foto = false, keepalive = false } = {}) {
    if (this.inViaggio) return
    this.inViaggio = true
    try {
      const mosse = this.coda.splice(0, MAX_PER_GIRO)
      this.giri++
      const conFoto = !mosse.length && !this.coda.length && (foto || this.giri % FOTO_OGNI === 0)
      const r = await scambiaComune(this.chiave, this.mio, { dopo: this.seq, mosse, foto: conFoto ? { seq: this.seq, stato: this.motore.serializza() } : null }, { ...this.opzioni, keepalive })
      if (!r) { this.coda.unshift(...mosse); return }           // senza rete si riprova al giro dopo; di due già pieno, pazienza
      if (r.foto) return this.alCambio({ mosse: [], ricarica: true })     // l'amico è andato troppo avanti: si riparte dalla fotografia
      const arrivate = []
      for (const x of r.mosse) {
        if (x.s <= this.seq) continue
        this.seq = x.s
        if (x.id === this.mio) continue                       // le mie, già fatte qui
        const m = mossaInForma(x.m)
        if (!m) continue
        const esito = rifai(this.motore, m)
        arrivate.push({ n: m.n, livello: esito.livello })
      }
      if (arrivate.length) this.alCambio({ mosse: arrivate, ricarica: false })
      if (this.coda.length) setTimeout(() => this.giro().catch(() => {}), 0)
    } finally { this.inViaggio = false }
  }

  /* la copia sul telefono: { seq, stato } */
  ricorda({ subito = false } = {}) {
    save(PREFISSO + this.chiave, { seq: this.seq, stato: this.motore.serializza() })
    if (subito) flush()
  }

  /* uscendo: le mosse rimaste e la fotografia, poi niente più */
  async chiudi() {
    clearInterval(this.timer); clearTimeout(this.presto)
    this.smetti?.(); this.smetti = null
    this.ricorda({ subito: true })
    this.inViaggio = false
    await this.giro({ keepalive: true }).catch(() => {})
    await this.giro({ foto: true, keepalive: true }).catch(() => {})
  }
}

/* le parole di una mossa dell'amico, per l'avviso sopra la scena */
const DETTI = {
  semina: 'ha seminato', raccogliTessera: 'ha raccolto', compraEMetti: 'ha costruito', mettiPezzo: 'ha messo un pezzo', compraEdificio: 'ha costruito',
  spostaPezzo: 'ha spostato un pezzo', ruotaPezzo: 'ha girato un pezzo', compraLotto: 'ha comprato un lotto di terra', abbatti: 'ha abbattuto un albero',
  togliOstacolo: 'ha tolto un sasso', disegnaStrada: 'ha fatto una strada', avviaRicettaIn: 'ha acceso una macchina', ritiraDa: 'ha ritirato dalle macchine',
  nutri: 'ha dato da mangiare alle pecore', nutriBestie: 'ha dato da mangiare alle bestie', raccogliProdotti: 'ha raccolto uova e latte', tosa: 'ha tosato le pecore',
  caricaCassa: 'ha caricato la mongolfiera', consegna: 'ha consegnato un ordine', 'cura.coccola': 'ha coccolato una bestia', 'cura.carezza': 'ha fatto una carezza',
  'cura.nutri': 'ha dato la ciotola',
}
export const dettoDellaMossa = n => DETTI[n] || 'lavora nella fattoria'
/* le mosse che cambiano il terreno: la scena lo ridisegna tutto */
export const TERRA = new Set(['compraLotto', 'abbatti', 'togliOstacolo', 'disegnaStrada', 'togliStrada', 'lanciaLenza', 'ritiraPesca'])
