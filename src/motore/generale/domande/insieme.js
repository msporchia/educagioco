/* ═══════════════════════════════════════════════════════════════════
   OPPURE ed ENTRAMBE — le domande che ne contengono altre

   `vince` e `perde` sono liste, e una lista è sempre stata una **e**:
   ci vogliono tutte. Mancava l'*oppure*, e da lì venivano finali
   assurdi — una lastra che esiste solo per ragioni di sintassi, e un
   capitolo dove chi prende il ladro non vince e non perde, perché il
   suo obiettivo era «o l'uno o l'altro» e non c'era modo di scriverlo.

   ── PERCHÉ UNA DOMANDA E NON UN CAMPO DEL LIVELLO ──
   Perché così vale **ovunque valga una domanda**, non solo in fondo al
   livello: la guardia di un ciclo, i due rami di un bivio, «aspetta
   che». Un campo `vinceOppure:` accanto a `vince:` avrebbe risolto un
   posto solo, e ne avrebbe lasciati quattro indietro. E siccome il
   «non» è già un interruttore che avvolge (`Negata`), da queste due
   nasce anche il resto: `non [oppure A B]` è «né A né B».

       vince: [{ cond: 'oppure', fra: [se.ha(eroe, tesoro),
                                       se.qui(eroe, uscita)] }]

   Si annidano: un `oppure` di `entrambe` è la forma normale di «o hai
   fatto tutte queste, o tutte quelle».

   ── E NON MENTONO SU QUELLO CHE NON SI PUÒ SAPERE ──
   Una domanda può rifiutarsi di rispondere (`NonPossoSaperlo`: il
   portone dall'altra parte della mappa). Qui non si trasforma quel
   rifiuto in un «falso» comodo: si risponde quando **la risposta è
   decisa comunque** — un `oppure` con un ramo vero è vero anche se un
   altro ramo è al buio, e un `entrambe` con un ramo falso è falso lo
   stesso — e negli altri casi si ripropaga il dubbio a chi ha chiesto,
   che è chi decide cosa farne. Per il livello (`chi` è nullo) il dubbio
   non esiste: quello è il mondo guardato dall'alto.
   ═══════════════════════════════════════════════════════════════════ */
import { Domanda, NonPossoSaperlo } from './domanda.js'

class Insieme extends Domanda {
  constructor (fra) { super(null); this.fra = (fra || []).filter(Boolean) }
  /* `compila` riceve il compilatore delle domande INIETTATO, come le
     azioni contenitore ricevono quello delle file: così questo file non
     importa l'indice che lo importa. */
  static compila (c, domandaDa) {
    return new this((c.fra || []).map(q => domandaDa(q)).filter(Boolean))
  }

  /* si valuta solo se si valutano tutte quelle che ha dentro: una
     `fra` vuota non è «sempre vero», è una domanda scritta male */
  valutabile (mondo) {
    return this.fra.length > 0 && this.fra.every(d => d.valutabile(mondo))
  }

  /* l'unica con uno stato è `Passati`, e sta quasi sempre là in fondo:
     chi contiene azzera quello che contiene */
  azzera () { this.fra.forEach(d => d.azzera()) }

  get chiave () { return `${this.parola}(${this.fra.map(d => d.chiave).join(',')})` }

  /* il giro comune: si cerca la risposta che DECIDE — `vero` per
     l'oppure, `falso` per l'entrambe — e i dubbi si mettono da parte
     finché non è chiaro che contano davvero */
  cerca (mondo, chi, decide) {
    let dubbio = null
    for (const d of this.fra) {
      try { if (d.valuta(mondo, chi) === decide) return decide }
      catch (e) {
        if (!(e instanceof NonPossoSaperlo)) throw e
        dubbio = dubbio || e
      }
    }
    if (dubbio) throw dubbio
    return !decide
  }
}

export class Oppure extends Insieme {
  static parola = 'oppure'
  valuta (mondo, chi) { return this.cerca(mondo, chi, true) }
  testo (mondo) { return this.fra.map(d => d.testo(mondo)).join(' oppure ') }
  /* il contrario di «o l'uno o l'altro» si dice in italiano: né, né */
  testoNegato (mondo) { return 'né ' + this.fra.map(d => d.testo(mondo)).join(' né ') }
}

export class Entrambe extends Insieme {
  static parola = 'entrambe'
  valuta (mondo, chi) { return this.cerca(mondo, chi, false) }
  testo (mondo) { return this.fra.map(d => d.testo(mondo)).join(' e ') }
  testoNegato (mondo) { return `non tutte: ${this.testo(mondo)}` }
}
