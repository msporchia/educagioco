/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA — IL MANIFESTO

   Dato puro, come vuole `src/giochi/CONVENZIONE.md`: non importa Vue, non
   importa il profilo. Il calco è sempre `codice-segreto/`, con la stessa
   struttura di cartella (`dati/`, `motore/`, `scena/`, `viste/`,
   `Gioco.vue`). Le regole vere stanno in `motore/fattoria.js`: qui c'è
   solo la carta d'identità e quello che il gioco porta all'albo.

   ── PERCHÉ NIENTE TAPPE ───────────────────────────────────────────
   Ogni altro gioco nuovo è una campagna: una fila di partite via via più
   toste, e `tappe` dice quante. La fattoria non lo è — è deciso così
   (vedi la nota di progetto del 15 agosto 2026): è il posto dove si
   *spende* quello che si guadagna esercitandosi negli altri giochi, un
   prato libero che cresce comprando terra e si riempie decorando. Non
   c'è una partita da vincere né un ordine in cui va fatto, quindi
   `tappe: 0` è onesto — dire «tappe: 1» solo per avere un numero
   diverso da zero sarebbe inventare una campagna che non esiste.
   Restano comunque `libera`/`cfg` di `src/giochi/campagne.js`: è
   l'unico posto sanzionato dove il profilo può tenere lo stato della
   fattoria (piazzole, cose, bosco, magazzino — quello che torna da
   `Fattoria.serializza()`), e ci sta sotto `cfg.stato`.
   ═══════════════════════════════════════════════════════════════════ */
import { PIAZZOLE_INIZIALI } from './dati/mondo.js'

export const CHIAVE = 'fattoria'

export default {
  chiave: CHIAVE,
  nome: 'La fattoria',
  icona: '🚜',
  /* invita, non spiega: niente qui dentro dice «compra piazzole,
     sgombra il bosco» — quello lo scopre chi apre il gioco */
  che: 'terra da comprare e una casa da arredare',
  area: 'avventure',
  come: 'fare',
  tappe: 0,

  /* Dietro «i giochi in prova» finché non è finita. Senza questo flag la
     carta comparirebbe in home a tutti — e il gioco oggi è incompleto:
     manca il pittore del terreno, mancano gli animali da accudire, e
     l'equilibrio dei prezzi non l'ha ancora provato nessun bambino. Un
     gioco a metà che si può aprire è peggio di un gioco che non c'è. */
  sperimentale: true,
  tinta: '#f4ecc8',

  /* La riga sotto il nome, in home. `av` è il record di
     `src/giochi/campagne.js` — qui senza `tappa`/`stelle`, che per un
     gioco senza tappe non vogliono dire niente: quello che conta è
     `cfg.stato`, il salvataggio della fattoria stessa. */
  riassunto(av = { tappa: 0, libera: false, stelle: {}, cfg: {} }) {
    const stato = (av.cfg || {}).stato
    if (!stato) return 'un pezzo di terra tutto da riempire'
    const piazzole = Object.keys(stato.piazzole || {}).length
    const cose = (stato.cose || []).length
    const oltre = piazzole - PIAZZOLE_INIZIALI
    const terra = oltre > 0 ? `+${oltre} di terra` : 'terra di partenza'
    return `${terra} · ${cose} cose sistemate`
  },

  /* ═══════════ quello che il gioco porta all'albo ═══════════
     I contatori li muove `Gioco.vue` con `segna()`/`segnaBest()`:
       fattoriaTerre     piazzole comprate, in tutto
       fattoriaSgomberi  pezzi di bosco sgomberati, in tutto
       fattoriaPosati    cose messe giù per la prima volta — non conta
                         chi si sposta, quello è già suo
       fattoriaVarieta   (primato) quanti tipi diversi si sono posseduti
                         insieme, fra mappa e magazzino — `tipiPosseduti`

     Non c'è un contatore per gli animali: nel catalogo di oggi
     (`dati/catalogo.js`) non ce ne sono — solo terreno, recinti, case e
     arredo. Se arriveranno, un contatore dedicato si aggiunge allora. */
  albo: {
    area: { nome: 'La fattoria', emoji: '🚜' },

    /* Modesto apposta: la fattoria spende le monete guadagnate altrove,
       non deve diventare la scorciatoia per salire di livello. Niente
       bonus grosso da campagna finita — qui non ce n'è una — quindi
       un'azione vale un punto, non trenta. */
    xp: m => m.tot('fattoriaTerre') + m.tot('fattoriaSgomberi')
             + Math.floor(m.tot('fattoriaPosati') / 2) + m.best('fattoriaVarieta'),
    provato: m => m.tot('fattoriaTerre') + m.tot('fattoriaSgomberi')
                  + m.tot('fattoriaPosati') > 0,

    traguardi: [
      { id: 'fattoria-terre', emoji: '🌱', nome: 'Il prato cresce',
        come: n => `Compra ${n} pezzi di terra`,
        soglie: [5, 15, 30], valore: m => m.tot('fattoriaTerre') },
      { id: 'fattoria-sgomberi', emoji: '🪓', nome: 'Bosco sgombro',
        come: n => `Sgombra ${n} pezzi di bosco`,
        soglie: [5, 20, 50], valore: m => m.tot('fattoriaSgomberi') },
      { id: 'fattoria-posati', emoji: '🧺', nome: 'Casa dolce casa',
        come: n => `Sistema ${n} cose nella fattoria`,
        soglie: [10, 40, 120], valore: m => m.tot('fattoriaPosati') },
      /* la varietà del catalogo (34 voci oggi) tiene basse le soglie
         alte: prenderle tutte non deve chiedere di comprare due case */
      { id: 'fattoria-varieta', emoji: '🎨', nome: 'Un po\' di tutto',
        come: n => `Colleziona ${n} cose diverse`,
        soglie: [8, 20, 32], valore: m => m.best('fattoriaVarieta') },
    ],
  },
}
