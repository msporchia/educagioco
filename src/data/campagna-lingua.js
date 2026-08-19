/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA DI UNA LINGUA — la forma, non i contenuti.

   English e Spagnolo sono lo stesso gioco con dentro parole diverse:
   una strada di tappe, ognuna porta roba nuova e si tiene dietro la
   vecchia come ripasso, e ogni tappa ha un bersaglio da centrare. Qui
   c'è quella forma, una volta sola; `campagna-inglese.js` e
   `campagna-spagnolo.js` sono solo la tabella dei contenuti e le
   dritte da leggere.

   Due cose crescono lungo la strada, e sono cose diverse:

   1. IL CONTENUTO — animali, cibo, colori... fino alle frasi intere.
   2. IL MODO DI CHIEDERE — `apre` dice quali tipi di domanda si sono
      aperti da quella tappa in poi. Il tipo NON dipende solo dalla
      tappa: dentro i tipi aperti, quello che tocca a una parola
      dipende da quanto quella parola è consolidata (vedi
      `data/domande.js`). Una parola vista ieri si chiede con la
      figura, una saputa da un mese si chiede al contrario.

   `bersaglio` sono le risposte giuste che servono per superare la
   tappa; `mirate` quante di quelle devono essere sulla roba NUOVA.
   Come per le tabelline la seconda è meno della metà della prima: il
   pool propone il nuovo circa una volta su due, e chiedere di più
   trasformerebbe la tappa in un'attesa.
   ═══════════════════════════════════════════════════════════════════ */
import { NOMI_TIPI } from './domande.js'

export { NOMI_TIPI }

/* Costruisce le tappe da una tabella di contenuti.

   `T` è l'elenco delle tappe: ognuna dice cosa porta di nuovo — le
   categorie di parole (`cats`), i verbi (`verbi: true`) o le frasi di
   un livello (`frasi: 1|2|3`) — quali tipi di domanda `apre`, e la
   dritta da leggere quando la si supera.

   `dati` sono le tre liste della lingua e il modo di farne le chiavi
   del motore di apprendimento. Le chiavi sono la memoria dei bambini:
   una volta scelte non si cambiano più. */
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
      /* dove sta la tappa sulla scala 0-100 di `data/portata.js`: la
         dichiarano i contenuti (`campagna-inglese.js`), qui passa e
         basta. Senza questa riga il livello resterebbe nel dato di
         partenza e la fila risulterebbe tutta alla portata di tutti —
         in silenzio, che è il modo peggiore. */
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
