/* ═══════════════════════════════════════════════════════════════════
   L'INDICE DELLE DOMANDE — dal dato all'oggetto

   Un livello scrive `se.vedi('orchi')`, cioè `{cond:'vedi',
   complemento:'orchi'}`: un dato, che si può salvare, rileggere e
   disegnare in un editor. Qui quel dato diventa l'oggetto che sa
   rispondere.

   È l'unico posto che conosce tutte le domande, ed è una tabella:
   aggiungerne una è aggiungere un file e una riga qui, come per i
   pittori in `grafica/`. Nessun altro file del motore fa più `switch`
   su `cond`.
   ═══════════════════════════════════════════════════════════════════ */
import { Negata } from './domanda.js'
import { Vedi } from './vedi.js'
import { Vivo } from './vivo.js'
import { Ha } from './ha.js'
import { Aperta } from './aperta.js'
import { Premuto } from './premuto.js'
import { Almeno } from './almeno.js'
import { Sentito } from './sentito.js'
import { Qui } from './qui.js'
import { Sempre } from './sempre.js'
import { Passati } from './passati.js'

export const DOMANDE = {
  vedi: Vedi, vivo: Vivo, hai: Ha, aperta: Aperta,
  premuto: Premuto, almeno: Almeno, segnale: Sentito, qui: Qui, sempre: Sempre,
  /* l'unica che non guarda il mondo ma sé stessa: conta i battiti, ed è
     quello che rende scrivibile «aspetta un po'» senza un verbo nuovo */
  passati: Passati,
}

/* dal dato all'oggetto. `null` se il dato non dice niente: chi chiama
   decide se è un guasto (un piano che nomina una domanda che non
   esiste) o un'assenza legittima (un ciclo senza uscita, che il
   validatore rifiuta a parte). */
export function domandaDa (c) {
  if (!c) return null
  if (c instanceof Object && typeof c.valuta === 'function') return c   // già compilata
  const Classe = DOMANDE[c.cond]
  if (!Classe) return null
  const d = Classe.compila ? Classe.compila(c) : new Classe(c.complemento)
  return c.non ? new Negata(d) : d
}

/* una lista di domande — le condizioni di vittoria e di sconfitta di un
   livello — che vale solo se ci sono tutte */
export const tutteVere = (domande, mondo) =>
  !!(domande && domande.length) && domande.every(d => d.valuta(mondo, null))
