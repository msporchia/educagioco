/* I numeri delle regole che non stanno altrove: quanto costa muovere, i tempi delle pecore (la mongolfiera ha i suoi numeri in dati/mongolfiera.js).
   Il perché di ognuno è in docs/fattoria3d/regole.md. Niente si vende: il verso è sempre monete → cose. */
export const COSTI = {
  spostare: 1,        // un pezzo spostato o rimesso nel magazzino: la fattoria non è un tavolino dove si sposta per ore
  strada: 1,          // a pezzo
  lottoBase: 40,      // il primo lotto comprato
  lottoRincaro: 20,   // ogni lotto già comprato in più (oltre quelli di partenza)
  lottoOltre: 32,     // dal 34° lotto comprato il rincaro lineare non basta più: si somma un termine quadratico (il mondo non ha confini, il prezzo sì)
  lottoQuadro: 2,     // monete per il quadrato dei lotti comprati oltre `lottoOltre`
  lottoEsperienzaMax: 680,   // quanta esperienza dà un lotto al massimo (il prezzo dell'ultimo lotto storico): la terra cara non salta i livelli
  albero: 3,          // un colpo d'ascia: tre monete (30 s di esercizio); la legna non c'è, il prato si libera e basta
  ostacolo: 1,        // un sasso o un cespuglio tolto
}

/** Il prezzo del lotto che si compra dopo averne comprati `k` (oltre ai nove di partenza): 40, 60, 80… fino a 680 come prima, poi cresce
    col quadrato. Oltre il centesimo costa più di una settimana di esercizio: il mondo si auto-limita. */
export function prezzoDelLotto(k) {
  const n = Math.max(0, Math.floor(k))
  return COSTI.lottoBase + COSTI.lottoRincaro * n + COSTI.lottoQuadro * Math.max(0, n - COSTI.lottoOltre) ** 2
}

export const PECORE = {
  laneMs: 25000,      // quanto ci mette la lana a rifarsi dal pasto (un numero da prova)
  mangia: ['foraggio'],   // come l'ovile della 2D: un foraggio per la lana (il mangime del fienile, non un raccolto)
  pastiPerLana: 1,    // pezzi di foraggio che una tosata vuole per rifarla: dopo la tosa ha fame, come le galline
  max: 4,             // per recinto
  pastiPerCrescere: 2,   // pezzi di foraggio per far crescere un agnello
  pastiPerNascere: 2,    // e per far nascere il prossimo
}

export function guastiDelleRegole() {
  const g = []
  for (const [k, v] of Object.entries(COSTI)) if (!(v >= 0)) g.push(`costo ${k} negativo`)
  for (let k = 1; k < 300; k++) if (!(prezzoDelLotto(k) > prezzoDelLotto(k - 1) && Number.isFinite(prezzoDelLotto(k)))) g.push(`il prezzo del lotto ${k} non sale`)
  if (prezzoDelLotto(32) !== 680) g.push('i primi 33 lotti non costano più come prima')
  if (!(PECORE.max >= 2)) g.push('un recinto deve poter tenere almeno due pecore')
  if (!(PECORE.laneMs >= 1000)) g.push('la lana ricresce in meno di un secondo')
  return g
}
