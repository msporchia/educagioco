/* ═══════════════════════════════════════════════════════════════════
   AZIONE — la classe base di tutto quello che si fa

   Prima c'era UN `switch` di trecento righe (`fai()`) e un esecutore che
   teneva due segnaposti a mano. Funzionava e non cresceva: un blocco
   dentro un blocco non ci stava — non per didattica, ma perché non
   c'era dove metterlo — e ogni verbo nuovo era un `case` in più dentro
   il posto che deve conoscere tutti gli altri.

   Adesso ogni cosa che si fa è una CLASSE, e vale un contratto solo:

       esegui(contesto) → un Esito

   Un passo, non l'azione intera: chi cammina fa **una cella** e risponde
   «non ho finito». Chi contiene un'azione non sa cosa sia — la esegue e
   guarda l'esito — quindi un contenitore nuovo funziona con i verbi che
   ci sono già, e un verbo nuovo funziona dentro i contenitori che ci
   sono già.

   ── UN'AZIONE COMPILATA NON GUARDA PIÙ IL PIANO ─────────────────
   L'editor (o il livello) scrive un DATO: `{verbo:'vai',
   complemento:'chiave'}`. Quel dato serve a costruire l'azione e poi
   non serve più. Non è pignoleria — un'azione che rilegge il piano
   mentre gira può cambiare sotto i piedi di chi la sta eseguendo, e il
   piano è un oggetto reattivo che appartiene alla vista.

   Perciò **compilare è un mestiere della classe**: ognuna dichiara con
   `static compila(dato, via, fila)` quali campi le servono. `fila` è la
   funzione che compila una lista e le viene INIETTATA — così un
   contenitore costruisce quello che ha dentro senza sapere cosa ci
   finirà, e l'indice dei verbi non deve conoscere i contenitori.

   ── E SI RACCONTA DA SÉ ─────────────────────────────────────────
   Il registro non sa cosa sia un `vai`: riceve due frasi già scritte.
   `penso` è quello che l'unità pensa, in prima persona, e nomina le
   cose. `siVede` è quello che si osserva da fuori — di un'unità nemica
   il bambino riceve solo questo, e solo se qualcuno dei suoi la sta
   guardando. È la regola che rende il registro uno strumento per
   DEDURRE il piano nemico invece di leggerlo.

   ── E NON HA UNO SCRATCHPAD ─────────────────────────────────────
   Niente `st`: ogni azione dichiara i campi che le servono e li rimette
   a posto in `azzera()`. Un sacco generico appeso a ogni azione era
   l'eredità del vecchio esecutore, dove lo stato non aveva un posto suo
   perché l'ordine era un dato inerte. Adesso ce l'ha.
   ═══════════════════════════════════════════════════════════════════ */
import { Esito } from './esiti.js'

export class Azione {
  /* `via` è dove stava nel piano da cui è nata — `[3]`, `[3,'vero',0]`.
     Non serve a eseguire: serve a far saltare la vista sulla riga
     giusta quando il piano non regge. È un'etichetta, non un
     riferimento: il piano può anche sparire. */
  constructor (via) {
    this.via = via || []
    this.attese = 0
  }

  /* ── LA PAROLA, che NON è un tag di smistamento ──
     Il dispatch lo fa la classe: nessuno guarda più «se il verbo è
     vai». Questa stringa è la chiave nel vocabolario, e serve a due
     cose sole, tutte e due dati scritti nel livello: `sa: ['vai']`, che
     toglie un verbo dalla cassetta di un personaggio, e `nonRiesce:
     { prendi: '…' }`, che glielo fa fallire parlando. */
  static parola = null
  get parola () { return this.constructor.parola }

  /* dal dato all'azione. Chi non ha niente da estrarre non la riscrive. */
  static compila (dato, via, fila) { return new this(via) }

  /* un passo */
  esegui (contesto) { return Esito.finitoSubito() }

  /* si riparte da capo: lo stato di UN GIRO si butta. Lo chiama chi
     contiene, prima di eseguire un'azione che ricomincia — dentro un
     ciclo capita a ogni giro. */
  azzera () { this.attese = 0 }

  /* le azioni che contiene: la fila di un ciclo, i due rami di un
     bivio. Serve a chi deve girare l'albero senza sapere cos'è. */
  figli () { return [] }

  /* ── le quattro voci con cui un'azione si racconta ──
     Il registro vuole sapere anche DOVE stava chi parla, per accendere
     la riga giusta a schermo: la via ce l'ha addosso, e la passa lui. */
  dice (contesto, penso, siVede) {
    contesto.registro.fatto(contesto, this, penso, siVede)
  }
  nonVa (contesto, penso, siVede) {
    contesto.registro.nonSiPuo(contesto, this, penso, siVede)
    return Esito.finito()
  }
  siRompe (contesto, penso) {
    contesto.registro.siFerma(contesto, this, penso)
    return Esito.rotto()
  }
  /* ── ASPETTARE NON È FALLIRE, MA NON PER SEMPRE ──
     Una strada chiusa può aprirsi fra due battiti: qualcun altro sta
     andando ad aprire quel portone. Si aspetta, e solo se non succede
     niente per un pezzo ci si arrende dicendo perché. Chi aspetta una
     cosa che dipende da un altro (un segnale, una porta) aspetta senza
     limite: lì a fermare la scena ci pensa lo stallo. */
  aspettando (contesto, penso, quanto = 25) {
    if (++this.attese > quanto) return this.siRompe(contesto, penso)
    contesto.chi.attesa = penso
    contesto.registro.aspetta(contesto, this, penso)
    return Esito.inAttesa()
  }
}
