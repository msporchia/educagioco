/* ═══════════════════════════════════════════════════════════════════
   IL MINIMO PER AVERE TEST CHE FALLISCONO DAVVERO

   Niente libreria: servono tre cose sole — dire cosa ci si aspetta,
   raccogliere i guasti, e uscire con codice ≠ 0 se qualcosa non torna.
   Un test che stampa e basta non è un test: nessuno si accorge quando
   smette di funzionare.
   ═══════════════════════════════════════════════════════════════════ */

const guasti = []
let passati = 0

export function controlla(cosa, condizione, dettaglio) {
  if (condizione) { passati++; return true }
  guasti.push(dettaglio ? `${cosa} — ${dettaglio}` : cosa)
  return false
}

/* uguaglianza con il valore sbagliato scritto nel guasto: senza, davanti
   a un test rosso tocca rimettersi a stampare per capire cosa è uscito */
export const uguale = (cosa, avuto, atteso) =>
  controlla(cosa, Object.is(avuto, atteso), `ho ${JSON.stringify(avuto)} invece di ${JSON.stringify(atteso)}`)

export const stessaLista = (cosa, avuto, atteso) =>
  controlla(cosa, JSON.stringify(avuto) === JSON.stringify(atteso),
            `ho ${JSON.stringify(avuto)} invece di ${JSON.stringify(atteso)}`)

export const dentro = (cosa, avuto, min, max) =>
  controlla(cosa, avuto >= min && avuto <= max, `${avuto} è fuori da ${min}..${max}`)

/* nota: si vede solo quando il test passa, per raccontare cosa ha misurato */
export function nota(...parti) { console.log('   ', ...parti) }

export function riassunto(titolo) {
  if (guasti.length) {
    console.log(`\n❌ ${titolo} — ${guasti.length} guasti su ${passati + guasti.length} controlli`)
    guasti.forEach(g => console.log('   ·', g))
    process.exitCode = 1
  } else {
    console.log(`✅ ${titolo} — ${passati} controlli`)
  }
  return guasti.length === 0
}
