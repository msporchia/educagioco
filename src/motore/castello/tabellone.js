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
    this.resto = 0
  }

  get cuori() { return this.stato.cuori }
  get onda() { return this.stato.onda }
  get energia() { return this.stato.energia }

  /* ── l'energia ── */
  paga(quanto) { this.stato.energia = Math.max(0, this.stato.energia - quanto) }
  /* L'energia a schermo è sempre un numero intero, ma quello che si
     incassa può non esserlo: un nemico che arriva in un'ondata più
     piccola (chi si divide, chi si rialza) vale un pezzo in più. I
     pezzi si mettono da parte e si pagano quando fanno un punto intero,
     così in fondo all'ondata torna esattamente quello che il modello
     conta. */
  incassa(quanto) {
    this.resto = (this.resto || 0) + quanto
    const intero = Math.floor(this.resto + 1e-9)
    this.resto -= intero
    this.stato.energia += intero
    return intero
  }

  /* `piu` è il regalo «vena d'energia» della partita libera: arriva da
     fuori perché qui non si sa niente dei regali — si sa contare.
     `quanti` è quanti nemici vale chi è caduto: un capo vale l'ondata,
     il pezzo di uno che si è diviso ne vale una parte */
  perNemico(piu = 0, quanti = 1) { return this.incassa(CFG.perNemico * quanti + (piu || 0)) }
  /* il premio di fine ondata, doppio se non è passato nessuno */
  perOnda(pulita) { return this.incassa(CFG.fineOnda + (pulita ? CFG.ondataPulita : 0)) }
  /* chi la chiama prima si prende il premio: la fretta è una scelta che
     rende, non un obbligo. Quanto, lo decide chi chiama (è il tempo
     risparmiato, vedi `premioDellaFretta`) */
  perFretta(premio) { return this.incassa(premio) }

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
