/* ═══════════════════════════════════════════════════════════════════
   DOMANDA — quello che si può chiedere al mondo

   La stessa mossa delle azioni, dall'altra parte: `valuta(m, io, c)` era
   uno `switch` su `c.cond` che sapeva com'è fatta una porta, com'è
   fatto uno zaino e cosa vuol dire vedere. Adesso ogni domanda è una
   classe e risponde da sé:

       valuta(mondo, chi) → vero o falso
       testo(mondo)       → come si legge («vedi l'orco»)

   Le due cose stanno insieme apposta. Prima la risposta era in
   `condizioni.js` e la frase in `parole.js`, e la seconda volta che si
   è aggiunta una domanda una delle due è rimasta indietro: si leggeva
   «vedi undefined». Chi aggiunge una domanda scrive tutte e due, o non
   compila.

   ── IL VINCOLO CHE TIENE IN PIEDI IL GIOCO ──────────────────────
   Si può chiedere solo quello che si VEDE da dove si è, o che si ha
   addosso, o che ci è stato detto. Lo stato di una porta dall'altra
   parte della mappa non è percezione — e se serve saperlo, qualcuno
   deve mandarlo a dire. Nessuna domanda di questa famiglia deve
   rispondere con un fatto globale travestito da percezione.
   ═══════════════════════════════════════════════════════════════════ */
/* ── QUANDO UNA DOMANDA NON HA UNA RISPOSTA PER TE ──
   «Il portone è aperto?» non è né vero né falso per chi il portone non
   lo vede da dove sta: è una cosa che non può sapere. Rispondere
   «falso» sarebbe una bugia comoda, e rispondere «vero» pure —
   sarebbe onniscienza, che è esattamente quello che questo gioco non
   vuole.
   Perciò si lancia, e chi ha fatto la domanda decide: chi aspetta dice
   «me lo deve dire qualcuno» e si ferma, un ciclo continua a girare,
   un bivio non ha un ramo giusto da prendere. È la regola del gioco
   scritta in un punto solo invece che dimenticata in undici. */
export class NonPossoSaperlo extends Error {
  constructor (perche) { super(perche); this.perche = perche }
}

export class Domanda {
  /* `di` è la cosa di cui si parla: l'id di un'unità, di una schiera,
     di un oggetto, di una porta, di un segnale. Sempre lo stesso
     `complemento` degli ordini, così la guardia di un ciclo si sceglie
     dalla stessa lista da cui si sceglie il bersaglio di un verbo. */
  constructor (di) { this.di = di }

  /* la chiave nel vocabolario delle domande (`CONDIZIONI`): serve
     all'interfaccia per raggrupparle, non a smistare niente qui */
  static parola = null
  get parola () { return this.constructor.parola }

  valuta (mondo, chi) { return false }
  testo (mondo) { return '…' }

  /* il nome leggibile della cosa di cui parla: lo usano quasi tutte */
  nomeDi (mondo) { return (mondo.cose[this.di] || {}).nome || this.di }

  /* si può valutare? Solo se parla di una cosa che in questa stanza
     esiste. Un piano salvato ieri può nominare una porta che non c'è
     più, e allora il piano va rifiutato prima di cominciare. */
  valutabile (mondo) { return !!this.di && !!mondo.cose[this.di] }

  /* come si riconosce uguale a un'altra: due domande sono la stessa se
     chiedono la stessa cosa della stessa cosa */
  get chiave () { return `${this.parola}|${this.di || ''}` }

  /* quasi nessuna domanda ha uno stato — l'unica che ce l'ha conta i
     battiti (`Passati`). Chi la contiene la rimette a zero quando
     ricomincia, e per tutte le altre non fa niente. */
  azzera () {}
}

/* ═══════════════════════════════════════════════════════════════════
   NEGATA — «non» non è una voce dell'elenco, è un interruttore

   Invece di raddoppiare ogni domanda con la sua gemella al contrario,
   se ne avvolge una. Chi la scrive non deve sapere cosa avvolge, e una
   domanda nuova nasce già negabile.
   ═══════════════════════════════════════════════════════════════════ */
export class Negata extends Domanda {
  constructor (dentro) { super(dentro.di); this.dentro = dentro }
  get parola () { return this.dentro.parola }
  valuta (mondo, chi) { return !this.dentro.valuta(mondo, chi) }
  valutabile (mondo) { return this.dentro.valutabile(mondo) }
  get chiave () { return this.dentro.chiave + '|!' }
  /* il contrario si dice in italiano, non con un «non» davanti a tutto:
     «non vedi l'orco», ma «il portone è chiuso» e «l'orco è fuori
     combattimento». Ogni domanda sa come si rovescia la sua frase. */
  testo (mondo) { return this.dentro.testoNegato(mondo) }
}

/* la forma negata di scorta, per chi non ne dichiara una sua */
Domanda.prototype.testoNegato = function (mondo) { return `non ${this.testo(mondo)}` }
