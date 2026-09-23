/* ═══════════════════════════════════════════════════════════════════
   LA FILA DI UNA MACCHINA

   Come in Hay Day: **una macchina lavora un pezzo alla volta e ne tiene
   altri in fila**, così si caricano tre pasti prima di andare a dormire.
   Vale per tutte, recinti compresi — sono macchine, e dar da mangiare
   tre volte alle galline prima di uscire è esattamente il gesto che si
   vuole (`docs/fattoria-albero.md` §8.4).

   ── I POSTI ───────────────────────────────────────────────────────
   Tre di partenza: uno lavora, due aspettano. Ogni ingrandimento ne
   aggiunge uno, fino a sei, e si paga **per macchina** — il secondo
   mulino nasce con i suoi tre posti, non con quelli del primo.

   I pezzi pronti **stanno in fila anche loro** finché non si ritirano:
   occupano il loro posto come il vassoio di Hay Day. È il modo in cui un
   silo pieno arriva, alla lunga, a fermare anche quello che si mette
   dentro — mai quello che sta già lavorando.

   ── I PREZZI ──────────────────────────────────────────────────────
   🪙30 · 50 · 80, e la curva è corta apposta: fanno parte del money pit,
   ma la terza volta costa poco più di un quarto d'ora di esercizi (una
   moneta vale dieci secondi, `CALIBRAZIONE.md`). Un ingrandimento che
   costasse quanto la macchina direbbe «comprane un'altra», che è
   un'altra cosa: due macchine vanno il doppio più svelte, una fila più
   lunga no — lascia solo caricare di più prima di uscire.
   ═══════════════════════════════════════════════════════════════════ */

export const POSTI_DI_PARTENZA = 3
export const POSTI_MASSIMI = 6

/* Il prezzo dell'ingrandimento numero i+1: uno per ogni posto fra i
   tre di partenza e i sei. */
export const PREZZI_DELLA_FILA = [30, 50, 80]

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
   che costasse meno del precedente sarebbe il segno di un numero
   copiato storto, e un bambino lo leggerebbe come «il prossimo è in
   saldo». */
export function guastiDellaFila() {
  const g = []
  if (POSTI_DI_PARTENZA < 1) g.push('una fila senza nemmeno il posto di chi lavora')
  if (POSTI_DI_PARTENZA + PREZZI_DELLA_FILA.length !== POSTI_MASSIMI)
    g.push(`i prezzi sono ${PREZZI_DELLA_FILA.length}, ma fra ${POSTI_DI_PARTENZA}` +
           ` e ${POSTI_MASSIMI} posti gli ingrandimenti sono` +
           ` ${POSTI_MASSIMI - POSTI_DI_PARTENZA}`)
  PREZZI_DELLA_FILA.forEach((p, i) => {
    if (!(Number.isInteger(p) && p > 0)) g.push(`ingrandimento ${i + 1}: prezzo ${p}`)
    if (i && !(p > PREZZI_DELLA_FILA[i - 1]))
      g.push(`ingrandimento ${i + 1}: 🪙${p} non costa più del precedente` +
             ` (🪙${PREZZI_DELLA_FILA[i - 1]})`)
  })
  return g
}
