/* ═══════════════════════════════════════════════════════════════════
   LA FILA DI UNA MACCHINA

   Come in Hay Day: **una macchina lavora un pezzo alla volta, e con la
   fila ne tiene altri che aspettano**, così si caricano tre pasti prima
   di andare a dormire. Vale per tutte, recinti compresi — sono
   macchine, e dar da mangiare tre volte alle galline prima di uscire è
   esattamente il gesto che si vuole (`docs/fattoria-albero.md` §8.4).

   ── I POSTI ───────────────────────────────────────────────────────
   **Uno di partenza**: quello che lavora, e nessuno che aspetta. Gli
   altri si comprano uno alla volta, fino a sei, e si pagano **per
   macchina** — il secondo mulino nasce col suo posto solo, non con
   quelli del primo.

   Erano tre, e la fila arrivava regalata: il gesto «carico tre pasti e
   vado» c'era dal primo mulino, senza che nessuno l'avesse mai
   desiderato. Deciso da lui il 24 settembre 2026: di base un posto, e
   gli altri si pagano sempre di più. La fila è autonomia, e
   l'autonomia si compra.

   I pezzi pronti **stanno in fila anche loro** finché non si ritirano:
   occupano il loro posto come il vassoio di Hay Day. È il modo in cui un
   silo pieno arriva, alla lunga, a fermare anche quello che si mette
   dentro — mai quello che sta già lavorando.

   ── I PREZZI RADDOPPIANO ──────────────────────────────────────────
   🪙20 · 40 · 80 · 160 · 320: ogni posto costa il doppio di quello
   prima. È l'unica curva esponenziale della fattoria, e
   `CALIBRAZIONE.md` le vieta per una ragione che qui non vale: senza un
   tetto, una curva che raddoppia chiede alla decima volta un prezzo da
   settimane, mentre le monete arrivano sempre allo stesso ritmo. Questa
   si ferma al quinto posto comprato, e il quinto costa meno di un'ora di
   esercizi.

   Raddoppiare vuol dire che il primo posto è quasi regalato (tre
   minuti di esercizi) e gli ultimi sono una scelta: il sesto costa più
   di quasi tutte le macchine, e chi vuole andare più svelto fa meglio a
   comprarne un'altra — due macchine vanno il doppio, una fila lunga no,
   lascia solo caricare di più prima di uscire. Il tetto delle due ore
   lo controlla `guastiDellaFila`: chi un giorno alzasse `POSTI_MASSIMI`
   se ne accorge prima dei bambini.

   Un salvataggio di prima non ha niente da migrare: `fila` sulla cosa
   conta gli ingrandimenti **comprati**, e restano tutti — valgono un
   posto a testa sopra quello di partenza, e ognuno era costato almeno
   quanto costa adesso. Una fila caricata quando i posti erano tre può
   essere più lunga dei posti di oggi: lavora fino in fondo e si ritira,
   e solo dopo si torna ai posti pagati (`unita/coda-fattoria`).
   ═══════════════════════════════════════════════════════════════════ */

export const POSTI_DI_PARTENZA = 1
export const POSTI_MASSIMI = 6

/* Il primo posto in più costa questo, e ognuno dopo il doppio. */
export const PRIMO_POSTO = 20
export const RINCARO_DELLA_FILA = 2

/* Il prezzo dell'ingrandimento numero i+1, uno per ogni posto fra
   quello di partenza e i sei. Si ricava dai numeri qui sopra, così la
   curva si legge dove si decide e non va ricopiata. */
export const PREZZI_DELLA_FILA = Array.from(
  { length: POSTI_MASSIMI - POSTI_DI_PARTENZA },
  (_, i) => PRIMO_POSTO * RINCARO_DELLA_FILA ** i)

/* Sopra le due ore di esercizi non ci va niente (`CALIBRAZIONE.md`, la
   scala delle spese): 🪙720, a dieci secondi la moneta. */
const DUE_ORE = 720

/* Quanti posti ha una fila ingrandita `n` volte. Un numero storto da un
   salvataggio (negativo, oltre il tetto, non un numero) si legge come
   il più vicino che abbia senso: un posto in meno sarebbe roba chiusa
   fuori, uno in più un regalo che nessuno ha pagato. */
export function postiDellaFila(n = 0) {
  const k = Math.max(0, Math.min(PREZZI_DELLA_FILA.length, Math.floor(n) || 0))
  return POSTI_DI_PARTENZA + k
}

/* Quanto costa il prossimo ingrandimento, o `null` se è già al tetto. */
export function prezzoDellaFila(n = 0) {
  const k = Math.max(0, Math.floor(n) || 0)
  return k < PREZZI_DELLA_FILA.length ? PREZZI_DELLA_FILA[k] : null
}

/* I conti che devono stare in piedi. La curva **sale**: un ingrandimento
   che costasse meno del precedente direbbe a un bambino «il prossimo è
   in saldo». E nessun posto costa più di due ore di esercizi: è il
   controllo che una curva che raddoppia deve passare a ogni ritocco. */
export function guastiDellaFila() {
  const g = []
  if (POSTI_DI_PARTENZA < 1) g.push('una fila senza nemmeno il posto di chi lavora')
  if (!(POSTI_MASSIMI > POSTI_DI_PARTENZA)) g.push('una fila che non si può allungare')
  PREZZI_DELLA_FILA.forEach((p, i) => {
    if (!(Number.isInteger(p) && p > 0)) g.push(`ingrandimento ${i + 1}: prezzo ${p}`)
    if (i && !(p > PREZZI_DELLA_FILA[i - 1]))
      g.push(`ingrandimento ${i + 1}: 🪙${p} non costa più del precedente` +
             ` (🪙${PREZZI_DELLA_FILA[i - 1]})`)
    if (p > DUE_ORE)
      g.push(`ingrandimento ${i + 1}: 🪙${p} sono più di due ore di esercizi`)
  })
  return g
}
