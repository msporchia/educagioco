/* ═══════════════════════════════════════════════════════════════════
   ASPETTA — fermarsi finché una domanda non diventa vera

   UN MODO SOLO. C'erano quattro modi di dire la stessa cosa — `aspetta
   di vedere [l'orco]`, `aspetta [il portone]`, `aspetta [un momento]`,
   `aspetta che [vedi l'orco]` — e a chi sta imparando a programmare
   quattro sinonimi non insegnano niente: insegnano che il linguaggio è
   arbitrario. Ne resta uno:

       aspetta che [ …una domanda… ]

   e le altre tre sono la stessa cosa con la domanda giusta dentro:
   `[vedi l'orco]`, `[il portone è aperto]`, `[passa un momento]`. La
   domanda è lo stesso costrutto con cui si decide dove andare in un
   bivio, quindi non è una parola in più da imparare: è quella di prima,
   in un altro posto.

   ── E SI ASPETTA SOLO QUELLO CHE SI VEDE ──
   Il portone dall'altra parte della mappa non lo si può aspettare: non
   perché sia vietato, ma perché non c'è modo di accorgersi che si è
   aperto. Quando la domanda non ha una risposta per chi la fa, lo dice,
   e qui la si racconta — «me lo deve dire qualcuno», che è il modo in
   cui il gioco insegna a cosa servono i segnali.
   ═══════════════════════════════════════════════════════════════════ */
import { Azione } from './azione.js'
import { Esito } from './esiti.js'
import { domandaDa } from '../domande/indice.js'
import { NonPossoSaperlo } from '../domande/domanda.js'

export class Aspetta extends Azione {
  static parola = 'aspetta'
  constructor (via, domanda) { super(via); this.domanda = domanda }
  static compila (dato, via) { return new Aspetta(via, domandaDa(dato.cond)) }

  azzera () {
    super.azzera()
    if (this.domanda && typeof this.domanda.azzera === 'function') this.domanda.azzera()
  }

  esegui (contesto) {
    const { mondo, chi } = contesto
    if (!this.domanda) return this.nonVa(contesto, 'questa attesa non dice cosa aspetta')
    let vero
    try {
      vero = this.domanda.valuta(mondo, chi)
    } catch (nonSo) {
      if (!(nonSo instanceof NonPossoSaperlo)) throw nonSo
      return this.nonVa(contesto, nonSo.perche, 'si guarda intorno')
    }
    if (vero) {
      this.dice(contesto, `${this.domanda.testo(mondo)}: riparto`, 'si rimette in moto')
      return Esito.finito()
    }
    /* senza limite: a fermare una scena che non finisce più ci pensa lo
       stallo, che sa dire anche cosa non arriverà mai */
    return this.aspettando(contesto, `aspetto che [${this.domanda.testo(mondo)}]`, Infinity)
  }
}
