/* ═══════════════════════════════════════════════════════════════════
   LO STATO DELLE AVVENTURE

   Le cinque storie del Generale (`data/storie-generale.js`) sono dati
   fermi: qui c'è quello che di quei dati cambia mentre si gioca — a che
   capitolo si è arrivati, quante stelle si sono prese in ognuno, e i
   FATTI che i capitoli lasciano dietro.

   Due scelte da tenere a mente:

     · **le stelle stanno con la chiave del capitolo**, non col numero.
       Quando arriveranno i rami l'ordine dei capitoli cambierà, e le
       stelle già prese non devono spostarsi con lui;

     · **una porta sola per la domanda «è aperto?»** — `apertoIl()`.
       Oggi risponde con la fila (il capitolo n si apre quando l'n−1 è
       superato), ma se un capitolo dichiara `richiede: ['lanterna']`
       risponde guardando i fatti. Nessuno chiede altrove «n <= tappa»,
       e il giorno dei rami si cambia questa funzione e basta.

   Di profili questo file non sa niente più di quello che gli serve:
   legge e scrive attraverso `storiaProfilo()`, il resto è aritmetica.
   ═══════════════════════════════════════════════════════════════════ */
import { storiaProfilo, persist, flushNow, segna, tuttoAperto, daSolo } from './profile.js'
import { STORIA, STORIE } from '../data/storie-generale.js'

/* ═══════════ leggere ═══════════ */

/* la copia di sola lettura: chi guarda non crea niente nel profilo */
export const statoStoria = id => ({ ...storiaProfilo(id) })

export const superatiIn = id => storiaProfilo(id).capitolo || 0
export const fattiDi = id => [...(storiaProfilo(id).fatti || [])]
export const stelleDi = (id, capitoloId) => storiaProfilo(id).stelle?.[capitoloId] || 0
export const stelleTotali = id =>
  Object.values(storiaProfilo(id).stelle || {}).reduce((n, s) => n + s, 0)

/* aperto o no. È l'unico posto che lo decide — vedi in testa al file. */
export function apertoIl (storiaId, n) {
  const st = STORIA[storiaId]
  const c = st && st.capitoli[n]
  if (!c) return false
  /* il flag dei genitori toglie i lucchetti dappertutto, storie comprese:
     un interruttore solo, in un posto solo */
  if (tuttoAperto()) return true
  /* ▼ il giorno dei rami: un capitolo dirà cosa gli serve, e la risposta
       si legge nei fatti invece che nella fila. I fatti ci sono già. */
  if (Array.isArray(c.richiede) && c.richiede.length)
    return c.richiede.every(f => fattiDi(storiaId).includes(f))
  return n <= superatiIn(storiaId)
}

export const fattoIl = (storiaId, n) => n < superatiIn(storiaId)

/* i capitoli **giocabili adesso**, al plurale di proposito: oggi ne
   torna uno, con i rami ne tornerà più d'uno e chi la usa è già pronto */
export function prossimi (storiaId) {
  const st = STORIA[storiaId]
  if (!st) return []
  return st.capitoli.filter((c, n) => apertoIl(storiaId, n) && !fattoIl(storiaId, n))
}

/* la riga che va sulla carta dell'avventura: «3 di 6», le stelle, e se
   è finita */
export function avanzamento (storiaId) {
  const st = STORIA[storiaId]
  if (!st) return { fatti: 0, quanti: 0, stelle: 0, finita: false, cominciata: false }
  const fatti = Math.min(superatiIn(storiaId), st.capitoli.length)
  return { fatti, quanti: st.capitoli.length, stelle: stelleTotali(storiaId),
           finita: fatti >= st.capitoli.length, cominciata: fatti > 0 || stelleTotali(storiaId) > 0 }
}

export const elencoStorie = () => STORIE.map(s => ({ ...s, ...avanzamento(s.id) }))

/* ═══════════ scrivere ═══════════ */

/* Un fatto è una stringa e basta: «lanterna-presa», «pozzo-aperto».
   Chi lo aggiunge sa cosa vuol dire, chi lo legge — nessuno, per ora —
   lo saprà quando ci sarà da leggerlo. */
export function aggiungiFatto (storiaId, fatto) {
  if (!fatto) return []
  const r = storiaProfilo(storiaId, true)
  if (!r.fatti.includes(fatto)) r.fatti.push(fatto)
  persist()
  return [...r.fatti]
}

/* Un capitolo portato a casa. Stesso metro del resto del Generale — che
   sta scritto una volta sola, in `daSolo()` di `store/profile.js`: due
   stelle a chi ci è arrivato da solo, una a chi ce la fa e basta, e si
   tiene la migliore. I contatori sono quelli di sempre (`missioni`,
   `stelle`, `ordini`, `daSolo`, `avanzati`): un capitolo è una missione
   come le altre, e i traguardi non devono imparare un nome nuovo. */
export function superaCapitolo (storiaId, n, conto = {}) {
  const st = STORIA[storiaId]
  const c = st && st.capitoli[n]
  if (!c) return null
  const r = storiaProfilo(storiaId, true)
  const { ordini = 0, avanzato = false } = conto

  const primaVolta = n + 1 > (r.capitolo || 0)
  r.capitolo = Math.max(r.capitolo || 0, n + 1)

  const solo = daSolo(conto)
  const stelle = solo ? 2 : 1
  const prima = r.stelle[c.id] || 0
  if (stelle > prima) r.stelle[c.id] = stelle

  /* quello che il capitolo lascia dietro entra nei fatti. Oggi serve
     solo a farsi trovare: nessuno lo interroga. */
  for (const l of c.lascia || [])
    if (l && l.filo && !r.fatti.includes(l.filo)) r.fatti.push(l.filo)

  if (primaVolta) segna('missioni')
  if (ordini > 0) segna('ordini', ordini)
  if (solo && prima < 2) segna('daSolo')
  if (stelle > prima) segna('stelle', stelle - prima)
  if (avanzato) segna('avanzati')

  persist()
  flushNow()        // un capitolo si chiude di rado: non deve perdersi
  return { ...r, stelle: stelle }
}

/* ═══════════ ricominciare ═══════════
   L'unica cosa distruttiva del gioco, e distrugge il meno possibile:
   torna a zero il capitolo raggiunto e si buttano i fatti — che sono la
   memoria della strada fatta — ma **le stelle restano**. Rigiocare una
   storia per prendere l'altra strada non deve costare niente, se no
   nessuno la rigioca. */
export function azzeraStoria (storiaId) {
  if (!STORIA[storiaId]) return null
  const r = storiaProfilo(storiaId, true)
  r.capitolo = 0
  r.fatti = []
  persist()
  flushNow()
  return { ...r }
}
