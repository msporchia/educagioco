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

  /* ── NON È PIÙ IN PROVA, ED È UNA DECISIONE DI PRODOTTO ──
     Stava dietro «i giochi in prova» perché incompleta. Adesso esce allo
     scoperto non perché sia finita, ma perché **prende il posto della
     cameretta**: il money pit dev'essere uno solo — un bambino che può
     spendere le monete in due posti non sceglie, si dimentica dell'altro
     — e fra i due questo è quello che si può far crescere. La cameretta
     passa dall'altra parte del cancello (`views/HomeView.vue`), e i suoi
     salvataggi restano dove sono: nascondere una carta non è cancellare
     niente.
     Quello che manca — gli animali da accudire, i prezzi che nessun
     bambino ha ancora provato — resta da fare con la carta accesa, che è
     l'unico modo per cui qualcuno se ne accorga. */
  tinta: '#f4ecc8',

  /* ── UN POSTO NON SI NASCONDE MAI ──
     `piccoli` e `grandi` sono le due estremità di una scala, e la
     fattoria non sta su nessuna delle due: non è difficile né facile,
     è il prato dove si spende. Dichiararla `piccoli` sarebbe la
     scorciatoia sbagliata — quel flag la farebbe comparire ai bambini
     di quattro anni e **sparire a quelli di nove**, perché le partenze
     dalla terza in su spengono proprio i giochi per i piccolissimi.

     Quindi non è un'estremità: è un `posto`, e un posto non si giudica
     per età. È la stessa cosa che `data/portata.js` dice già dei
     giochi senza campagna — «sono posti, non scalette, e l'assenza
     vuol dire *non si giudica*, non *si nasconde*» — detta dove serve
     anche alle partenze. Un grande può sempre spegnerla a mano come
     tutte le altre carte: quello che questo evita è che gliela
     spegniamo noi. */
  posto: true,

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
       fattoriaRaccolti  campi raccolti, in tutto. Non si conta la
                         semina: chi semina raccoglie, e sarebbe lo
                         stesso numero contato due volte
       fattoriaRitiri    volte che si è ritirato qualcosa dal mulino

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
             + Math.floor(m.tot('fattoriaPosati') / 2) + m.best('fattoriaVarieta')
             /* un raccolto vale mezzo punto: è il gesto che si ripete più
                di tutti, e a punto pieno la fattoria diventerebbe il modo
                più svelto di salire di livello senza fare un esercizio */
             + Math.floor(m.tot('fattoriaRaccolti') / 2) + m.tot('fattoriaRitiri'),
    provato: m => m.tot('fattoriaTerre') + m.tot('fattoriaSgomberi')
                  + m.tot('fattoriaPosati') + m.tot('fattoriaRaccolti') > 0,

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
      /* Le soglie sono basse perché un raccolto costa **tempo vero**: il
         grano ci mette dieci minuti, e chiederne cento vorrebbe dire
         chiedere sedici ore di attesa, cioè un traguardo che si prende
         per anzianità e non per aver giocato. */
      { id: 'fattoria-raccolti', emoji: '🌾', nome: 'Buon raccolto',
        come: n => `Raccogli ${n} campi`,
        soglie: [3, 12, 40], valore: m => m.tot('fattoriaRaccolti') },
    ],
  },
}
