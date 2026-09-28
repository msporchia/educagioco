// Quanti disegni sono giusti al posto giusto (`pieni`) e quanti ci sono ma
// altrove (`vuoti`). Il conteggio dei doppioni è dove questo tipo di gioco
// si sbaglia sempre: vedi docs/codice-segreto/regole.md.
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

// I passi della spiegazione senza parole (`scena/dimostrazione.js`): prima
// i pieni, poi i vuoti, poi il niente, ogni disegno del codice consumato
// una volta sola — la stessa regola di `confronta`.
//   { tipo: 'pieno',  prova: 0, seg: 0 }   combacia in colonna
//   { tipo: 'vuoto',  prova: 1, seg: 2 }   c'è, ma sta nella casella 2
//   { tipo: 'niente', prova: 2 }           non c'è da nessuna parte
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
