/* ═══════════════════════════════════════════════════════════════════
   L'OCCHIO SULLA CORSA — come si guarda dentro una discesa

   La discesa sta in uno `shallowRef` apposta: renderla reattiva in
   profondità vorrebbe dire un proxy su ogni cella del piano, sessanta
   volte al secondo. Il prezzo è che **niente di quello che succede là
   dentro sveglia Vue** — la vita che cala, le gemme che si spendono, la
   merce che passa dal banco allo zaino — e la sveglia è un contatore a
   parte (`tic`), che batte quando cambia qualcosa che si vede.

   Un `computed` scritto a mano che si dimentica quella riga non dà
   nessun errore: si ferma, e basta. E c'è un modo più insidioso di
   dimenticarsela, che è quello che è successo davvero: leggere il tic in
   un computed e poi **derivarne un altro da quello**. `corsa.foglio` è
   sempre lo stesso oggetto finché il foglio è lo stesso, e un computed
   che rivaluta e ritorna un valore identico non sveglia chi dipende da
   lui — così la merce del mercante restava quella di prima mentre le
   gemme scendevano: si comprava, si vendeva, e la lista non si muoveva
   di una riga. Le tasche da vendere sì, perché quelle il tic lo
   leggevano; era l'asimmetria che si vedeva a schermo.

   Perciò qui dentro non si scrive più un `computed` a mano.
   `occhio(corsa, tic)` ne fa uno che il tic lo legge **per conto suo** e
   che riceve la discesa già pronta: la riga che ci si dimenticava non
   c'è più da scrivere.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'

/* `vuoto` è quello che si vede quando non c'è nessuna discesa in corso:
   una lista vuota dove la schermata scorre delle righe, `null` dove
   guarda un oggetto solo. */
export function occhio(corsa, tic) {
  return (leggi, vuoto = null) => computed(() => {
    tic.value
    const c = corsa.value
    return c ? leggi(c) : vuoto
  })
}
