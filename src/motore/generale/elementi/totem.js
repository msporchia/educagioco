import { Elemento } from '../elemento.js'

/* ═══════════════════════════════════════════════════════════════════
   IL TOTEM — la variabile che si vede

   Riceve lo stesso comando di una leva (`premi`, §8.3 del piano): «un
   verbo per ogni congegno» è stato scartato apposta (§10) — l'aspetto
   lo dà il dato, non il verbo. La differenza è tutta dentro `ricevi`:
   una leva scatta al primo tocco, il totem CONTA. Ogni «premi» sotto la
   soglia alza una tacca; arrivato a `tacche` manda ai suoi collegati,
   una volta sola, esattamente come farebbe una leva.

   IL REGALO, ed è il motivo per cui esiste questa classe e non un
   «ripeti N volte»: `ripeti … finché il totem è a 3` (la condizione
   `almeno:` in generale.js) è già un `for` — ciclo, variabile e
   condizione insieme, senza un blocco nuovo da spiegare a un bambino.
   La variabile non è un numero astratto: è tacche accese, e si vede
   sul campo (`faccia()` consegna quante). */
export class Totem extends Elemento {
  get tipo () { return 'congegno' }
  get em () { return '🗿' }

  constructor (id, d) {
    super(id, d)
    this.tacche = d.tacche || 3
    this.collegata = d.collegata || []
    this.n = 0
    this.mandato = false
  }

  azzera () { this.n = 0; this.mandato = false }

  /* la condizione `almeno:` legge qui: quante tacche sono accese ADESSO
     — il confronto col numero che il piano chiede lo fa la condizione,
     non il totem, che non sa quale soglia gli sta chiedendo qualcuno */
  chiedi (q) {
    if (q === 'almeno') return this.n
    return null
  }

  accetta (cmd) { return cmd === 'premi' }

  ricevi (cmd, chi, ctx) {
    if (cmd !== 'premi') return null
    if (this.mandato) return { esito: 'subito' }
    const N = this.nomeIn(ctx.m)
    this.n++
    if (this.n >= this.tacche) {
      this.mandato = true
      /* stesso principio della leva: il comando arriva al battito
         dopo, dalla coda dei congegni */
      for (const id of this.collegata)
        ctx.m.comandiPendenti.push({ cmd: 'apri', a: id, mittente: this })
      return { esito: 'fatto', dice: `tocco ${N}: arrivo a ${this.n} — scatta`, fatto: `tocca ${N}` }
    }
    return { esito: 'fatto', dice: `tocco ${N}: adesso è a ${this.n} su ${this.tacche}`, fatto: `tocca ${N}` }
  }

  /* IN CELLE, NON UN NUMERO: quante tacche accese e quante in tutto, così
     un pittore le può disegnare — quale disegno è un mestiere di un
     altro. `alone: true`: si nomina in un ordine, non è arredo dipinto
     sul fondale */
  faccia () {
    return [{ che: 'totem', x: this.x, y: this.y, tacche: this.tacche, accese: this.n, alone: true }]
  }

  nomeCollegato (mondo, id) { return ((mondo.livello.nomi || {})[id]) || id }

  scheda (ctx) {
    const m = ctx && ctx.m
    const righe = [`è a ${this.n} su ${this.tacche}`]
    if (this.collegata.length) {
      const frase = this.collegata
        .map(id => `si apre ${m ? this.nomeCollegato(m, id) : id}`)
        .join(', ')
      righe.push(`quando arriva a ${this.tacche}: ${frase}`)
    }
    return righe
  }
}
