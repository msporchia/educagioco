/* ═══════════════════════════════════════════════════════════════════
   QUANDO LA TARATURA È SBAGLIATA, LO DICE IL BAMBINO

   I livelli delle domande li abbiamo decisi noi, guardando il programma
   delle elementari e usando la testa. Su centosessantadue righe qualcuna
   è sbagliata di sicuro — e non c'è modo di saperlo guardandola: una
   domanda tarata male è formalmente ineccepibile, e il difetto si vede
   solo in chi la riceve.

   Ma il bambino l'ha già detto, giocando. Ogni risposta finisce in
   `store/srs.js` sotto la chiave della tipologia (`quiz/memoria.js`), e
   lì dentro ci sono due numeri che non stava leggendo nessuno: quante
   volte è andata bene e quante male. Da quelli si ricava l'unica cosa
   che serve — *questo gruppo per lui è troppo facile o troppo
   difficile?* — e la si mette in mano a un grande, che decide.

   NON SI RITOCCA DA SOLI, SI CONSIGLIA. Un gioco che si ritara da sé
   sembra intelligente finché non sbaglia: un pomeriggio storto, un
   fratello che ha giocato al posto suo, dieci risposte a caso per
   arrivare in fondo, e il gioco «impara» la cosa sbagliata senza che
   nessuno possa vederlo. Qui il conto si mostra — «ne ha sbagliate 7 su
   10» — e il tasto per ritoccare è quello di sempre, a un dito di
   distanza. Chi guarda decide se quel 7 su 10 vuol dire «troppo
   difficile» o «era stanco».

   LE SOGLIE. Sotto le otto risposte non si dice niente: con quattro
   tiri il caso conta più della taratura. Sopra, due bande larghe e un
   silenzio in mezzo: **meno di metà giuste** è un muro, **più di nove
   su dieci** è un pedaggio che non insegna niente. Fra il 50% e il 90%
   non si consiglia niente, ed è la fascia dove una domanda fa quello
   che deve.
   ═══════════════════════════════════════════════════════════════════ */

/* quante risposte servono prima di dire qualcosa */
export const MINIME = 8
/* sotto questa quota è troppo difficile, sopra l'altra è troppo facile */
export const MURO = 0.5
export const PEDAGGIO = 0.9

/* ── il conto di una chiave ──
   `items` è la mappa del profilo (`state.profile.items`), e una chiave
   che non c'è vuol dire «mai vista»: zero risposte, nessun consiglio. */
export function contoDi(chiavi, items = {}) {
  let ok = 0, err = 0
  for (const c of chiavi) {
    const it = items[c]
    if (!it) continue
    ok += it.ok || 0
    err += it.err || 0
  }
  return { ok, err, quante: ok + err }
}

/* ── il consiglio ──
   `null` quando non c'è niente da dire, che è il caso normale e va
   bene così: una schermata che consiglia qualcosa su ogni riga non
   consiglia niente.

   `verso` è già il gradino da passare a `ritocca()`: −1 se il gruppo va
   abbassato, +1 se va alzato. `detto` è la frase da mostrare, che dice
   **il numero** e non il giudizio — il giudizio lo fa chi legge. */
export function consiglioDa(conto, ritocco = 0) {
  if (!conto || conto.quante < MINIME) return null
  const quota = conto.ok / conto.quante
  if (quota <= MURO && ritocco > -3)
    return { verso: -1, quota, detto: `ne ha sbagliate ${conto.err} su ${conto.quante}` }
  if (quota >= PEDAGGIO && ritocco < 3)
    return { verso: 1, quota, detto: `le indovina quasi tutte (${conto.ok} su ${conto.quante})` }
  return null
}

/* ── comodità per la schermata ──
   Le tipologie di un gruppo le sa `quiz/saperi.js` (`sottoDi`), il
   profilo lo sa lo store: qui si mettono insieme le due cose senza che
   nessuno dei due debba conoscere l'altro. */
export function consiglioPerGruppo({ tipi = [], items = {}, ritocco = 0 } = {}) {
  return consiglioDa(contoDi(tipi.map(t => t.chiave), items), ritocco)
}
