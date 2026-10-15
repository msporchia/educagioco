// Un lavoratore del banco parallelo (vedi banco-parallelo.mjs): gioca le partite di una fetta di semi
// e rimanda i conteggi. Stesse partite, stessi semi: il risultato non dipende da chi le gioca.
import { parentPort } from 'node:worker_threads'
import { gioca } from '../src/giochi/arena/motore/banco.js'

parentPort.on('message', ({ da, a, seme, sfida, pilota, limite }) => {
  const r = { vinte: 0, perse: 0, pari: 0, secondi: 0 }
  for (let i = da; i < a; i++) {
    const g = gioca({ seme: seme + i * 7919, sfida, pilota, limite })
    if (g.fine === 'vinto') r.vinte++; else if (g.fine === 'perso') r.perse++; else r.pari++
    r.secondi += g.secondi
  }
  parentPort.postMessage(r)
})
