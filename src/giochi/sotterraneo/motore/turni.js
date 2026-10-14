// La fila dei turni dello scontro, alla Final Fantasy X (docs/sotterraneo/scontro.md, «L'iniziativa»). Funzioni pure,
// girano in Node. Niente tempo che scorre: ogni azione fa aspettare 100/velocità a chi la fa, e agisce chi ha aspettato
// meno; a parità il lato dell'eroe, poi chi sta prima nell'array. Il doppio turno nasce da sé: un
// eroe veloce il doppio gioca due volte prima di un mostro.
//
// Un attore è { id, lato: 'eroe' | 'mostri', velocita, fatti }: `fatti` sono i turni già giocati. Con `fatti: −1` il
// primo turno arriva a tempo zero, cioè prima di tutta la fila (la sorpresa, il primo tiro). La fila è un array di attori
// e non si cambia mai: ogni funzione ne rende una nuova.

export const ATTESA = 100
export const TURNI_VISIBILI = 7   // quanti ne mostra la colonna a schermo
const EPS = 1e-9

// la velocità dell'eroe: una base di sette e un punto di velocità a punto di destrezza (docs/sotterraneo/scontro.md, «L'iniziativa»): chi ha poca
// destrezza ha meno turni dei mostri normali, e il doppio turno è dell'agile
export const VELOCITA_BASE_EROE = 7
export const VELOCITA_PER_DESTREZZA = 1
export const attesaDi = velocita => ATTESA / Math.max(1, velocita)

// l'istante del prossimo turno di un attore: calcolato dal numero dei turni fatti, non sommando, così due attori che
// cadono sullo stesso istante (20 = 2 × 10 = 4 × 5) si vedono uguali
const quando = a => (a.fatti + 1) * attesaDi(a.velocita)

export function nuovaFila(attori) {
  return attori.map(a => ({ fatti: 0, ...a }))
}

// chi gioca adesso: il più vicino nel tempo, a parità il lato dell'eroe, poi l'ordine. null se la fila è vuota
export function chiAgisce(fila) {
  let meglio = null
  for (const a of fila) {
    if (!meglio) { meglio = a; continue }
    const d = quando(a) - quando(meglio)
    if (d < -EPS || (Math.abs(d) <= EPS && (a.lato === 'eroe' ? 0 : 1) < (meglio.lato === 'eroe' ? 0 : 1))) meglio = a
  }
  return meglio
}

// ha giocato il suo turno: aspetterà ancora 100/velocità
export const agisci = (fila, id) => fila.map(a => (a.id === id ? { ...a, fatti: a.fatti + 1 } : a))
export const togli = (fila, id) => fila.filter(a => a.id !== id)

// gli id dei prossimi `n` turni, in ordine, come andrebbero se nessuno cadesse o cambiasse velocità
export function prossimi(fila, n = TURNI_VISIBILI) {
  const fuori = []
  let f = fila
  while (fuori.length < n && f.length) {
    const a = chiAgisce(f)
    fuori.push(a.id)
    f = agisci(f, a.id)
  }
  return fuori
}

// La fila giocata a vuoto, per misurarla (strumenti/sotterraneo-banco.mjs, `--turni`): nessuno cade, nessuno cambia velocità.
// Torna la sequenza dei primi turni ('E' l'eroe, 'm' un mostro: `fila`) e la quota dei turni dell'eroe che seguono un altro
// turno dell'eroe (`doppi`): il doppio turno, quando il mostro non fa in tempo a rispondere
export function fileGiocata(velocitaEroe, velocitaMostri, turniDellEroe = 120, visibili = 24) {
  let f = nuovaFila([{ id: 'eroe', lato: 'eroe', velocita: velocitaEroe },
                     ...velocitaMostri.map((velocita, i) => ({ id: i, lato: 'mostri', velocita }))])
  const lati = []
  for (let eroe = 0; eroe < turniDellEroe;) {
    const a = chiAgisce(f)
    lati.push(a.lato === 'eroe' ? 'E' : 'm')
    if (a.lato === 'eroe') eroe++
    f = agisci(f, a.id)
  }
  const doppi = lati.reduce((n, x, i) => n + (x === 'E' && lati[i - 1] === 'E' ? 1 : 0), 0) / turniDellEroe
  return { fila: lati.slice(0, visibili).join(''), doppi }
}

// chi agisce dopo che `id` ha giocato adesso e prima che gli torni il turno: i colpi in arrivo, per lo stop del pericolo.
// Se `id` è solo nella fila, nessuno
export function primaDelSuoProssimo(fila, id) {
  if (!fila.some(a => a.id === id) || fila.length < 2) return []
  const fuori = []
  let f = agisci(fila, id)
  for (let guardia = 0; guardia < 1000; guardia++) {
    const a = chiAgisce(f)
    if (a.id === id) break
    fuori.push(a.id)
    f = agisci(f, a.id)
  }
  return fuori
}
