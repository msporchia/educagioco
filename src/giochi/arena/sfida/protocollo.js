// La sfida in due di Castle Battle, la parte che è solo del gioco (docs/arena/multigiocatore.md): cos'è una mossa, l'impronta
// che dice se le due copie sono la stessa partita, e la proposta di chi crea. Il resto (il filo, il lockstep, la trattativa)
// è comune a tutti i giochi e sta in src/insieme/ (docs/core/insieme.md).

/* Si alza quando cambia qualcosa che le due copie devono fare uguale e che la firma delle regole non vede (il motore, le mosse):
   due telefoni con versioni diverse non partono, invece di separarsi a metà. */
export const VERSIONE_SFIDA = 2

const AZIONI = ['costruisci', 'potenzia', 'vendi', 'miniera', 'ripara', 'castello', 'bomba', 'sbagliata']

const intero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max
/* una mossa com'è nel messaggio: [azione, chi, dove]; chi e dove, se ci sono, sono una truppa o una piazzola */
export function mossaValida(m) {
  if (!Array.isArray(m) || m.length < 1 || m.length > 3) return false
  const [azione, chi, dove] = m
  if (!AZIONI.includes(azione)) return false
  if (chi !== undefined && chi !== null && typeof chi !== 'string' && !intero(chi, 0, 20)) return false
  if (typeof chi === 'string' && chi.length > 20) return false
  if (dove !== undefined && dove !== null && !intero(dove, 0, 20)) return false
  return true
}

/* L'impronta: poche cifre che riassumono la partita (monete, vita di castelli e muri, caserme, truppe e dove stanno). Si confronta
   con una tolleranza: uno scarto da ultima cifra non è una partita diversa, e se è l'inizio di una vera divergenza cresce da sé
   fino a superarla (allora si riallinea). I conteggi (caserme, livelli, truppe) invece devono essere uguali. */
const VOCI = 17
const TOLLERANZA = 0.02                       // relativa; più 1 in assoluto
const ESATTE = new Set([0, 7, 8, 9, 10, 11, 12])    // fine, caserme, livelli delle caserme, numero di truppe
export function improntaDi(p) {
  const v = [p.fine ? 1 : 0]
  for (const l of ['io', 'nem']) v.push(p.lati[l].monete)
  for (const l of ['io', 'nem']) v.push(p.castelli.find(c => c.lato === l).hp)
  for (const l of ['io', 'nem']) v.push(p.muri.find(m => m.lato === l).hp)
  for (const l of ['io', 'nem']) v.push(p.caserme.filter(c => c.lato === l).length)
  for (const l of ['io', 'nem']) v.push(p.caserme.filter(c => c.lato === l).reduce((s, c) => s + c.liv, 0))
  for (const l of ['io', 'nem']) v.push(p.unita.filter(u => u.lato === l).length)
  for (const l of ['io', 'nem']) v.push(p.unita.filter(u => u.lato === l).reduce((s, u) => s + u.hp, 0))
  for (const l of ['io', 'nem']) v.push(p.unita.filter(u => u.lato === l).reduce((s, u) => s + u.y, 0))
  return v
}
export function impronteSimili(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== VOCI || b.length !== VOCI) return false
  return a.every((x, i) => (ESATTE.has(i) ? x === b[i] : Math.abs(x - b[i]) <= 1 + TOLLERANZA * Math.max(Math.abs(x), Math.abs(b[i]))))
}

/* chi propone e chi accetta. Decide l'host: il terreno e quanto corrono le monete; in due non c'è un nemico, quindi nessuno ha un
   vantaggio o uno svantaggio. Che le regole siano le stesse lo controlla la versione (src/insieme/incontro.js). */
export const RITMO_MONETE = { min: 0.05, max: 1.5 }
/* Le monete sono tarate per un campo fermo mentre si calcola: un'azione costava circa `AZIONE_A_CAMPO_FERMO` secondi di gioco.
   In due il campo corre anche mentre si risponde (l'utente: «ogni bambino ci mette 10 secondi a domanda»), quindi per avere le
   stesse monete a ogni azione la crescita si divide per il tempo in più: 2,5 / (2,5 + secondi a risposta). Lo sceglie chi crea la stanza. */
export const AZIONE_A_CAMPO_FERMO = 2.5
export const ritmoPer = secondiARisposta => AZIONE_A_CAMPO_FERMO / (AZIONE_A_CAMPO_FERMO + secondiARisposta)
export const proponi = ({ seme, terreno, ritmoMonete = ritmoPer(10) }) => ({ seme, terreno, ritmoMonete })
/* null se la proposta va bene, se no il perché */
export function accetta(proposta, { terreni }) {
  if (!proposta || typeof proposta !== 'object') return 'proposta'
  if (!Number.isInteger(proposta.seme) || !terreni.includes(proposta.terreno)) return 'proposta'
  if (!(proposta.ritmoMonete >= RITMO_MONETE.min && proposta.ritmoMonete <= RITMO_MONETE.max)) return 'proposta'
  return null
}
