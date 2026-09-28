// La forma della campagna di una lingua (non i contenuti): tappe
// cumulative con bersaglio/mirate. Vedi docs/lingue/vocaboli.md e
// docs/lingue/README.md; `campagna-inglese.js`/`campagna-spagnolo.js`
// hanno solo i contenuti.
import { NOMI_TIPI } from './domande.js'

export { NOMI_TIPI }

// `T`: le tappe (cats/verbi/frasi, i tipi che `apre`, la dritta).
// `dati`: le tre liste della lingua e le funzioni chiave; le chiavi
// sono la memoria dei bambini, una volta scelte non si cambiano più.
export function creaCampagna(T, dati) {
  const { parole, verbi, frasi, chiaveParola, chiaveVerbo, chiaveFrase } = dati

  const nuoveDi = t => {
    if (t.verbi) return verbi.map(v => chiaveVerbo(v[0]))
    if (t.frasi) return frasi.filter(f => f.liv === t.frasi).map(f => chiaveFrase(f.id))
    return parole.filter(w => t.cats.includes(w[3])).map(w => chiaveParola(w[0]))
  }

  const CAMPAGNA = T.map((t, i) => {
    const nuove = nuoveDi(t)
    const prima = T.slice(0, i).flatMap(nuoveDi)
    const bersaglio = 12 + i * 2
    return {
      i, nome: t.nome, emoji: t.emoji, dritta: t.dritta,
      // scala 0-100 di data/portata.js, dichiarata nei contenuti — senza,
      // la fila risulterebbe alla portata di tutti in silenzio.
      portata: t.portata,
      nuove,
      chiavi: [...prima, ...nuove],        // cumulativa: il vecchio resta come ripasso
      tipi: T.slice(0, i + 1).flatMap(x => x.apre),
      bersaglio,
      mirate: Math.round(bersaglio * 0.45),
    }
  })

  /* Il gioco libero: si apre a campagna finita, non finisce mai, e pesca
     da tutto quello che esiste con ogni tipo di domanda. */
  const LIBERO = {
    i: -1, nome: 'Gioco libero', emoji: '♾️', dritta: '',
    nuove: [],
    chiavi: CAMPAGNA[CAMPAGNA.length - 1].chiavi,
    tipi: NOMI_TIPI,
    bersaglio: Infinity, mirate: 0,
  }

  const tappaDi = i => (i >= 0 && i < CAMPAGNA.length ? CAMPAGNA[i] : LIBERO)

  return { CAMPAGNA, LIBERO, tappaDi }
}
