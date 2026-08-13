/* ═══════════════════════════════════════════════════════════════════
   L'INDICE DELLE AZIONI — dal piano scritto all'albero che gira

   L'editor (o il livello) scrive un DATO. Qui quel dato diventa
   l'albero di oggetti che sa eseguirsi, e da lì in poi il dato non
   serve più a nessuno.

   È l'unico posto che conosce tutte le azioni, ed è una tabella:
   aggiungerne una è aggiungere un file e una riga qui. Nessun altro
   file del motore fa più `switch` su un verbo.

   ── LA VIA ──
   Ogni azione si porta dietro dov'era nel piano — `[3]`, `[3,'vero',0]`
   — e serve a una cosa sola: far saltare la vista sulla riga giusta
   quando il piano non regge. Le file che sono un piano a sé (quella di
   un «quando senti», quella di un'azione con un nome) ripartono da capo,
   perché a schermo sono una colonna loro.
   ═══════════════════════════════════════════════════════════════════ */
import { Fila } from './fila.js'
import { Bivio } from './bivio.js'
import { Ripeti } from './ripeti.js'
import { Definizione } from './definizione.js'
import { Vai } from './vai.js'
import { Prendi } from './prendi.js'
import { Posa } from './posa.js'
import { Apri } from './apri.js'
import { Chiudi } from './chiudi.js'
import { Premi } from './premi.js'
import { Attacca } from './attacca.js'
import { Suona } from './suona.js'
import { Parla } from './parla.js'
import { Ascolta } from './ascolta.js'
import { Chiama } from './chiama.js'
import { Aspetta } from './aspetta.js'
import { Azione } from './azione.js'
import { Esito } from './esiti.js'

/* verbo → classe */
export const AZIONI = {
  vai: Vai, prendi: Prendi, posa: Posa, apri: Apri, chiudi: Chiudi, premi: Premi,
  attacca: Attacca, suona: Suona, parla: Parla, quando: Ascolta,
  esegui: Chiama, aspetta: Aspetta,
}

/* blocco → classe. Sono contenitori, e la differenza con un verbo è
   tutta lì: hanno bisogno di sapere come si compila una fila. */
export const STRUTTURE = {
  condizione: Bivio, ripeti: Ripeti, routine: Definizione,
}

/* ── QUELLO CHE NON SI SA FARE ──
   Un piano salvato ieri può nominare un verbo che non esiste più. Non
   si butta e non si finge che vada bene: diventa un'azione che, quando
   tocca a lei, lo dice e passa oltre. */
class Sconosciuta extends Azione {
  constructor (via, come) { super(via); this.come = come }
  esegui (contesto) {
    return this.nonVa(contesto, `«${this.come}»? non so cosa voglia dire`)
  }
}

/* una lista di ordini diventa una `Fila` di azioni */
export function compilaFila (ordini, via = []) {
  return new Fila((ordini || []).map((o, i) => compilaAzione(o, [...via, i])), via)
}

export function compilaAzione (dato, via) {
  if (!dato) return new Sconosciuta(via, '')
  const Classe = dato.blocco ? STRUTTURE[dato.blocco] : AZIONI[dato.verbo]
  if (!Classe) return new Sconosciuta(via, dato.blocco || dato.verbo)
  return Classe.compila(dato, via, compilaFila)
}

export { Fila, Esito }
