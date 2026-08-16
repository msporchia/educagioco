/* ═══════════════════════════════════════════════════════════════════
   CHI CAMMINA NELLA FATTORIA

   Il bambino, il cane, domani una gallina: dove sta, verso dove va, e
   la strada che sta facendo. Stava dentro `scena/tela.js` — cioè una
   **regola di gioco dentro il disegno** — e da lì conosceva una cosa
   sola, «è terra mia»: bastava a non far sparire un cane nel bosco, e
   non bastava a tenerlo fuori dalle case, che infatti attraversava.

   ── LO SPAZIO ARRIVA DA FUORI ─────────────────────────────────────
   Qui dentro non c'è nessuna mappa. Chi chiama passa `buona(x, y)` —
   in gioco è `Fattoria.calpestabile` — e questa classe non sa
   **perché** una cella non va bene: se c'è una casa, se è acqua, se è
   bosco di nessuno. È la stessa scelta di `src/motore/passi.js`, che
   fa il lavoro vero (la strada più corta, in ampiezza) e da cui qui si
   prendono `percorso()` e `accanto()`.

   ── SI CAMMINA A CELLE, NON IN LINEA D'ARIA ───────────────────────
   Prima si puntava dritti alla meta e si tirava una riga: con una casa
   in mezzo, la riga ci passava dentro. Adesso la meta diventa una fila
   di celle vicine, e la si percorre una alla volta — è **la stessa
   posizione frazionaria di prima**, quindi il passo resta fluido e chi
   disegna non si accorge di niente.

   La posizione è in celle (`14.5` è il centro della cella 14): lo zoom
   cambia mentre si gioca, e un mondo misurato in pixel andrebbe
   riscalato ogni volta.
   ═══════════════════════════════════════════════════════════════════ */
import { percorso, accanto } from '../../../motore/passi.js'

/* Quanto lontano si sposta, in celle, chi gira per il prato per conto
   suo. Poche: un cane che attraversa mezza fattoria a ogni sosta
   sembra che stia scappando, non che stia bighellonando. */
export const RAGGIO_VAGO = 4

/* Quante mete si provano prima di lasciar perdere il giro di adesso.
   Serve un tetto perché una bestia chiusa in un recinto piccolo
   pescherebbe per sempre celle dall'altra parte dello steccato. */
const PROVE = 12

export class Camminatore {
  constructor(cx, cy, opz = {}) {
    this.x = cx + 0.5
    this.y = cy + 0.5
    this.verso = 'giu'
    this.passo = 0                    // la fase dell'animazione, in secondi camminati
    this.meta = null                  // il centro della cella verso cui si sta andando
    this.strada = []                  // le celle che restano dopo quella
    this.velocita = opz.velocita || 3.4     // celle al secondo
    this.vaga = opz.vaga || 0               // ogni quanti secondi si sposta da sé
    /* Il caso arriva da fuori come in tutti i motori di casa: una
       passeggiata si deve poter rifare identica in un test. */
    this.sorte = opz.sorte || Math.random
    this.attesa = 1 + this.sorte() * 3
  }

  get cella() { return { x: this.x | 0, y: this.y | 0 } }

  /* Quello che serve a chi disegna: sta camminando o è fermo. */
  get cammina() { return !!this.meta }

  fermati() { this.meta = null; this.strada = [] }

  /* ── dove si vuole andare ──
     Torna `false` quando non c'è strada, e allora **non ci si muove**:
     fermi è meglio che dentro un muro.

     Se sulla meta non si può stare — si tocca la fontana, il cane deve
     raggiungere il bambino che è lui stesso su una cella occupata — si
     punta alla cella buona più vicina: accostarsi è quello che si
     voleva, e non muoversi affatto sembrerebbe un tocco andato perso. */
  vaiA(cx, cy, buona) {
    if (!buona) {                     // senza spazio dichiarato: la vecchia riga dritta
      this.strada = []
      this.meta = { x: cx + 0.5, y: cy + 0.5 }
      return true
    }
    const da = this.cella
    const mira = buona(cx, cy) ? { x: cx, y: cy } : accanto(buona, { x: cx, y: cy }, da)
    if (!mira) return false
    const strada = percorso(buona, da, mira)
    if (!strada) return false
    this.strada = strada
    this.meta = null
    this.avanti()
    return true
  }

  /* Il passo dopo, se c'è. */
  avanti() {
    const c = this.strada.shift()
    this.meta = c ? { x: c.x + 0.5, y: c.y + 0.5 } : null
    return !!this.meta
  }

  /* ── il tempo che passa ──
     Si consuma `velocita * dt` lungo la strada, non fino alla prima
     cella e basta: a velocità alta o con un fotogramma lungo un passo
     starebbe stretto in un giro, e la bestia rallenterebbe agli angoli
     invece di girarli. */
  muovi(dt, buona) {
    if (!this.meta && !this.avanti()) { this.vagabonda(dt, buona); return }
    let resto = this.velocita * dt
    this.passo += dt
    while (this.meta && resto > 0) {
      const dx = this.meta.x - this.x, dy = this.meta.y - this.y
      const d = Math.hypot(dx, dy)
      if (Math.abs(dx) > Math.abs(dy)) this.verso = dx > 0 ? 'lato' : 'sinistra'
      else if (dy) this.verso = dy > 0 ? 'giu' : 'su'
      if (d > resto) {
        this.x += dx / d * resto
        this.y += dy / d * resto
        return
      }
      this.x = this.meta.x; this.y = this.meta.y
      resto -= d
      this.avanti()
    }
  }

  /* ── girare per il prato ──
     Ogni tanto ci si sceglie una meta da sé. Si provano poche celle
     vicine e si prende la prima dove si può stare **e dove si arriva
     davvero**: se lo steccato è chiuso si resta dentro invece di
     attraversarlo, che è tutta la differenza con la regola di prima. */
  vagabonda(dt, buona) {
    if (!this.vaga) return
    this.attesa -= dt
    if (this.attesa > 0) return
    this.attesa = this.vaga * (0.6 + this.sorte())
    const c = this.cella, lato = RAGGIO_VAGO * 2 + 1
    for (let prova = 0; prova < PROVE; prova++) {
      const x = c.x + ((this.sorte() * lato) | 0) - RAGGIO_VAGO
      const y = c.y + ((this.sorte() * lato) | 0) - RAGGIO_VAGO
      if (x === c.x && y === c.y) continue
      if (buona && !buona(x, y)) continue
      if (this.vaiA(x, y, buona)) return
    }
  }
}
