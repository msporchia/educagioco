/* ═══════════════════════════════════════════════════════════════════
   IL REGISTRO — tutti i moduli che ci sono, senza doverli elencare.

   Un modulo nuovo è un file in `moduli/`: non c'è nessun elenco da
   aggiornare, nessun import da aggiungere, nessun posto dove
   dimenticarsene. È la stessa scelta dei livelli del Generale, che si
   raccolgono dalla cartella, e serve a evitare l'unico guasto che non
   si vede mai: il modulo scritto bene che non compare da nessuna parte.

   `import.meta.glob` è roba di Vite, quindi **questo file vive nel
   browser**. In Node non esplode — resta vuoto — ma non serve a niente:
   chi lavora senza schermo (il banco di prova, il test di unità di un
   gioco) legge la cartella con `fs`, o importa il modulo che gli
   interessa e basta. Se un motore ha bisogno del registro per girare,
   quel motore ha una dipendenza dal browser che non dovrebbe avere.
   ═══════════════════════════════════════════════════════════════════ */

const ORDINE = ['italiano', 'matematica', 'spazio', 'tempo', 'logica', 'scienze']

/* fuori da Vite `import.meta.glob` non esiste: meglio una lista vuota e
   un errore parlante al primo uso che un TypeError senza indirizzo */
let trovati = {}
try { trovati = import.meta.glob('../moduli/*.js', { eager: true }) } catch { trovati = {} }

/* tutti i moduli, in ordine di materia e poi di nome */
export const MODULI = Object.values(trovati)
  .map(m => m.default)
  .filter(Boolean)
  .sort((a, b) =>
    (ORDINE.indexOf(a.materia) - ORDINE.indexOf(b.materia)) || a.nome.localeCompare(b.nome))

export const perId = id => MODULI.find(m => m.id === id)

/* i moduli di una materia — servirà quando un gioco vorrà chiedere
   «qualcosa di italiano» senza sapere cosa c'è */
export const perMateria = materia => MODULI.filter(m => m.materia === materia)

/* un modulo a caso, eventualmente fra certe materie: è così che un
   gioco chiederà «una domanda qualunque» senza citare nessun modulo */
export function qualunque(sorte, { materie } = {}) {
  const buoni = materie ? MODULI.filter(m => materie.includes(m.materia)) : MODULI
  return sorte.uno(buoni)
}
