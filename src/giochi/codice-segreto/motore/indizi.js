/* ═══════════════════════════════════════════════════════════════════
   IL CUORE — da un tentativo ai due numeri

   È tutto il gioco, in venti righe: quanti disegni sono giusti al posto
   giusto (`pieni`) e quanti ci sono ma stanno altrove (`vuoti`).

   Il conteggio dei doppioni è il punto in cui questo gioco si sbaglia
   sempre. La regola: prima si contano i pieni e si tolgono di mezzo, poi
   i vuoti si cercano solo fra quello che resta, consumando ogni disegno
   una volta sola. Così `pieni + vuoti` non supera mai la lunghezza del
   codice, e due 🐶 nel tentativo non prendono due pallini se nel codice
   il 🐶 è uno solo.

   Nessun DOM, nessun Vue, nessuna moneta: gira uguale nel browser e in
   Node, ed è per questo che si può provare davvero.
   ═══════════════════════════════════════════════════════════════════ */

export function confronta(codice, tentativo) {
  let pieni = 0
  const restoCodice = [], restoTentativo = []
  for (let i = 0; i < codice.length; i++) {
    if (codice[i] === tentativo[i]) pieni++
    else { restoCodice.push(codice[i]); restoTentativo.push(tentativo[i]) }
  }
  let vuoti = 0
  for (const simbolo of restoTentativo) {
    const dove = restoCodice.indexOf(simbolo)
    if (dove >= 0) { vuoti++; restoCodice.splice(dove, 1) }
  }
  return { pieni, vuoti }
}

/* ═══════════════════════ la spiegazione, passo per passo ═══════════════════════

   Un bambino di sei anni non legge un regolamento: la prima partita si
   apre con un esempio che si muove. Da dove vengono i pallini lo decide
   il calcolo — qui — e chi anima (`scena/dimostrazione.js`) non deve
   saperne niente: riceve fatti già decisi. Così la spiegazione non può
   raccontare una regola diversa da quella che il gioco applica davvero.

   L'ordine è quello in cui si guarda: prima i pieni, poi i vuoti, poi il
   niente. Ogni disegno del codice si consuma una volta sola, esattamente
   come in `confronta()`.

     { tipo: 'pieno',  prova: 0, seg: 0 }   combacia in colonna
     { tipo: 'vuoto',  prova: 1, seg: 2 }   c'è, ma sta nella casella 2
     { tipo: 'niente', prova: 2 }           non c'è da nessuna parte     */
export function passiSpiegazione(codice, tentativo) {
  const passi = []
  const presi = new Set()

  for (let i = 0; i < tentativo.length; i++)
    if (codice[i] === tentativo[i]) {
      passi.push({ tipo: 'pieno', prova: i, seg: i })
      presi.add(i)
    }
  for (let i = 0; i < tentativo.length; i++) {
    if (codice[i] === tentativo[i]) continue
    const seg = codice.findIndex((s, k) =>
      s === tentativo[i] && !presi.has(k) && codice[k] !== tentativo[k])
    if (seg >= 0) { passi.push({ tipo: 'vuoto', prova: i, seg }); presi.add(seg) }
    else passi.push({ tipo: 'niente', prova: i })
  }
  return passi
}
