/* ═══════════════════════════════════════════════════════════════════
   L'ETÀ CHE SI STA GUARDANDO, PRIMA DI SCRIVERLA

   ── DA DOVE VIENE ────────────────────────────────────────────────
   La manopola dei genitori scriveva a ogni tacca, e quando lo
   spostamento cambiava fascia si fermava ad aspettare una conferma che
   compariva **in fondo alla colonna** — cioè, dopo un quadro lungo
   quanto tutto lo schermo, fuori dalla vista. Da sopra si vedeva solo
   una freccia che smetteva di funzionare: si premeva tre volte, non
   succedeva niente, e non c'era niente da leggere.

   ── COS'È ADESSO ─────────────────────────────────────────────────
   La tacca muove **una bozza**, che è un numero e basta: non tocca il
   profilo, e quello che si vede sotto è il quadro di quell'età — cioè
   un'anteprima, che è la cosa che il wizard del primo avvio faceva
   già. Si scrive premendo «Applica», che è anche l'unico punto in cui
   si può dire cosa succede *prima* che succeda.

   ── PERCHÉ IL CONTO LO FA `spostandoLEta` ────────────────────────
   Perché è **la stessa funzione** che poi scrive (`store/profile.js`).
   Se l'anteprima se lo rifacesse per conto suo, direbbe una cosa e il
   salvataggio ne farebbe un'altra — che è peggio di nessuna anteprima.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, watch } from 'vue'
import { spostandoLEta } from '../../data/partenze.js'

/* I quattro argomenti sono **funzioni**, non valori: chi la usa legge
   da un profilo che cambia sotto (si applica, si passa a un altro
   bambino), e un valore copiato una volta sola resterebbe quello di
   prima senza che niente lo dica. */
export function usaBozzaEta ({ eta, giochi = () => ({}), sa = () => ({}),
                               ritocchi = () => ({}), min = 4, max = 12 }) {
  const bozza = ref(eta())

  /* Quando l'età vera cambia — perché si è applicato, o perché si sta
     guardando un altro bambino — la bozza torna ad allinearsi: una
     bozza che sopravvive a chi l'ha generata è una modifica in sospeso
     su un profilo che non è più quello. */
  watch(eta, a => { bozza.value = a })

  const mossa = computed(() => spostandoLEta({
    da: eta(), a: bozza.value ?? eta(),
    giochi: giochi() || {}, sa: sa() || {}, ritocchi: ritocchi() || {},
  }))

  /* `null` è il primo avvio, dove un'età ancora non c'è: lì non c'è
     niente da confrontare e non si applica niente. */
  const cambiata = computed(() =>
    bozza.value != null && eta() != null && bozza.value !== eta())

  function muovi (passo) {
    const ora = bozza.value == null ? min - passo : bozza.value
    const nuova = Math.round((ora + passo) * 2) / 2
    if (nuova < min || nuova > max) return
    bozza.value = nuova
  }

  const annulla = () => { bozza.value = eta() }

  return { bozza, mossa, cambiata, muovi, annulla }
}
