/* ═══════════════════════════════════════════════════════════════════
   IL TABELLONE — i cinque numeri della partita, e chi li muove.

   Cuori, ondata, uccisi, torri, energia. Sono l'unica cosa che il
   motore scrive fuori da sé: chi lo crea gli passa un oggetto — nel
   gioco è l'HUD reattivo di Vue, nel simulatore un oggetto qualunque —
   e se lo ritrova aggiornato senza copiare niente.

   Sta in una classe sua perché l'energia è la valuta di tutto il gioco
   e le regole che la muovono sono poche e vanno lette in fila: si paga
   quello che si compra (mai sotto zero), si incassa per ogni nemico
   fermato, per ogni ondata finita — di più se non è passato nessuno — e
   per la fretta di chi chiama l'ondata subito.

   Quello che NON fa: non sa i prezzi. Il prezzo lo dice chi compra.
   ═══════════════════════════════════════════════════════════════════ */
import { CFG } from '../../data/castello.js'

export class Tabellone {
  constructor(stato) { this.stato = stato }

  /* una partita da capo */
  azzera(partenza) {
    const s = this.stato
    s.cuori = CFG.cuori; s.onda = 0; s.uccisi = 0; s.torri = 0; s.energia = partenza
  }

  get cuori() { return this.stato.cuori }
  get onda() { return this.stato.onda }
  get energia() { return this.stato.energia }

  /* ── l'energia ── */
  paga(quanto) { this.stato.energia = Math.max(0, this.stato.energia - quanto) }
  incassa(quanto) { this.stato.energia += quanto; return quanto }

  perNemico() { return this.incassa(CFG.perNemico) }
  /* il premio di fine ondata, doppio se non è passato nessuno */
  perOnda(pulita) { return this.incassa(CFG.fineOnda + (pulita ? CFG.ondataPulita : 0)) }
  /* chi la chiama subito si prende il bonus: la fretta è una scelta che
     rende, non un obbligo */
  perFretta() { return this.incassa(CFG.bonusPronti) }

  /* ── il resto del tabellone ── */
  ondaNuova() { return ++this.stato.onda }
  torreNuova() { this.stato.torri++ }
  ucciso() { this.stato.uccisi++ }
  /* torna `true` se il castello è caduto */
  cuoreVia() { return --this.stato.cuori <= 0 }

  /* una fotografia, e il modo di rimetterla a posto */
  foto() { return { ...this.stato } }
  riprendi(f) { Object.assign(this.stato, f) }
}
