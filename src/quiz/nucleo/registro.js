/* Tutti i moduli in moduli/, raccolti dalla cartella (nessun elenco da
   aggiornare). `import.meta.glob` è di Vite: questo file vive solo nel
   browser, e chi lavora senza schermo importa il modulo che gli interessa. */

const ORDINE = ['italiano', 'matematica', 'spazio', 'tempo', 'logica', 'scienze']

// fuori da Vite import.meta.glob non esiste: meglio una lista vuota che un TypeError senza indirizzo
let trovati = {}
try { trovati = import.meta.glob('../moduli/*.js', { eager: true }) } catch { trovati = {} }

// in ordine di materia e poi di nome
export const MODULI = Object.values(trovati)
  .map(m => m.default)
  .filter(Boolean)
  .sort((a, b) =>
    (ORDINE.indexOf(a.materia) - ORDINE.indexOf(b.materia)) || a.nome.localeCompare(b.nome))

export const perId = id => MODULI.find(m => m.id === id)

export const perMateria = materia => MODULI.filter(m => m.materia === materia)

export function qualunque(sorte, { materie } = {}) {
  const buoni = materie ? MODULI.filter(m => materie.includes(m.materia)) : MODULI
  return sorte.uno(buoni)
}
