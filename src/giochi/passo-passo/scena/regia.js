/* ═══════════════════════════════════════════════════════════════════
   LA REGIA — l'orologio della scena

   Tiene il giro dei fotogrammi e fa scorrere il tempo di una proiezione
   (`scena/proiezione.js`): a ogni fotogramma chiede alla proiezione dove
   sta ogni cosa, lo passa alla tela, e avvisa chi guida il gioco di tre
   cose — una battuta è cominciata (per i suoni), il passo che gira è
   cambiato (per la striscia: quale carta, e a che giro sono i cicli), la
   proiezione è finita (per le regole). Non sa cosa voglia dire nessuna
   delle tre.

   ── IL TEMPO È QUELLO DEI FOTOGRAMMI ──────────────────────────────
   Si conta con `requestAnimationFrame`, e il passo più lungo che si
   concede è cinque centesimi: a schermo spento il browser non consegna
   fotogrammi, e il coniglio si ferma dov'è invece di ritrovarsi in
   fondo alla fila al ritorno. È l'orologio che CLAUDE.md chiede di
   fermare a mano quando non è fatto di fotogrammi — qui lo è, e si
   ferma da sé.

   Quando non c'è niente da proiettare il giro continua lo stesso:
   l'acqua scorre, la carota respira, il fumetto del «e adesso?» dondola.
   Un livello fermo che si muove un po' è un posto; uno immobile è una
   figura.
   ═══════════════════════════════════════════════════════════════════ */
import { Tela } from './tela.js'
import { fotogrammaIniziale } from './proiezione.js'

const PASSO_MAX = 0.05

export class Regia {
  constructor(avvisi = {}) {
    this.avvisi = avvisi       // { battuta(b), corrente(i, passo, giri), guasto(), fine(pro, f) }
    this.tela = null
    this.liv = null
    this.pro = null            // la proiezione in corso, o l'ultima finita
    this.chiusa = false        // l'ultima è finita e l'ha già detto
    this.t = 0
    this.orologio = 0
    this.raf = 0
    this.prima = 0
    this.ultimoPasso = -1
    this.guastoDetto = false
  }

  attacca(canvas) {
    if (!canvas) return
    if (!this.tela) this.tela = new Tela(canvas)
    else this.tela.attacca(canvas)
    if (this.liv) this.tela.prepara(this.liv, this.tema)
  }

  prepara(liv, tema) {
    this.liv = liv
    this.tema = tema
    this.pro = null
    this.chiusa = false
    this.ultimoPasso = -1
    if (this.tela) this.tela.prepara(liv, tema)
  }

  /* una proiezione nuova, dall'inizio */
  suona(pro) {
    this.pro = pro
    this.t = 0
    this.chiusa = false
    this.ultimoPasso = -1
    this.guastoDetto = false
  }

  /* ■: si torna al mondo di partenza, com'era prima del ▶ */
  ferma() {
    this.pro = null
    this.chiusa = false
    this.ultimoPasso = -1
  }

  get inCorsa() { return !!this.pro && !this.chiusa }

  avvia() {
    if (this.raf) return
    this.prima = performance.now()
    const giro = ora => {
      this.raf = requestAnimationFrame(giro)
      const dt = Math.min(PASSO_MAX, Math.max(0, (ora - this.prima) / 1000))
      this.prima = ora
      this.avanza(dt)
    }
    this.raf = requestAnimationFrame(giro)
  }

  spegni() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  /* un passo di tempo: separato dal giro perché i test lo possano
     chiamare senza un browser che consegna fotogrammi */
  avanza(dt) {
    this.orologio += dt
    let f
    if (this.pro) {
      const prima = this.t
      this.t += dt
      if (!this.chiusa) {
        for (const b of this.pro.battute)
          if (b.t0 <= this.t && (b.t0 > prima || (prima === 0 && b.t0 === 0)))
            this.avvisi.battuta?.(b)
      }
      f = this.pro.fotogramma(this.t)
      if (!this.chiusa) {
        /* il passo e non la carta: dentro un ciclo la stessa carta torna
           a ogni giro, e il contagiri della scatola deve cambiare lo stesso */
        if (f.passo !== this.ultimoPasso) {
          this.ultimoPasso = f.passo
          this.avvisi.corrente?.(f.corrente, f.passo, f.giri)
        }
        if (f.guasto && !this.guastoDetto) {
          this.guastoDetto = true
          this.avvisi.guasto?.()
        }
        if (this.t >= this.pro.durata) {
          this.chiusa = true
          this.avvisi.fine?.(this.pro, f)
        }
      }
    } else if (this.liv) {
      f = fotogrammaIniziale(this.liv)
      f.t = this.orologio
    }
    if (f && this.tela) this.tela.disegna(f, this.orologio)
    return f
  }
}
