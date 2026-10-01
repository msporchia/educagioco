/* Tutti i capitoli del libro, raccolti dalla cartella capitoli/ (nessun
   elenco da aggiornare), come i moduli di quiz. `import.meta.glob` è di
   Vite: in Node la lista è vuota, e chi lavora senza schermo (il test, lo
   script) legge la cartella da sé. */
let trovati = {}
try { trovati = import.meta.glob('./capitoli/*.js', { eager: true }) } catch { trovati = {} }

export const CAPITOLI = Object.values(trovati).map(m => m.default).filter(Boolean)
  .sort((a, b) => a.id.localeCompare(b.id))
