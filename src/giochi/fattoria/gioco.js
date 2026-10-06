/* Il manifesto della fattoria (dato puro, calco codice-segreto/). tappe: 0 è onesto: non è una
   campagna, è il prato dove si spende — vedi docs/fattoria/presentazione.md. Lo stato vive in
   src/giochi/campagne.js sotto cfg.stato (quello che torna da Fattoria.serializza()). */
import { PIAZZOLE_INIZIALI } from './dati/mondo.js'

export const CHIAVE = 'fattoria'

export default {
  chiave: CHIAVE,
  nome: 'La fattoria',
  icona: '🚜',
  // invita, non spiega: niente qui dice "compra piazzole, sgombra il bosco"
  che: 'terra da comprare e una casa da arredare',
  area: 'avventure',
  come: 'fare',
  copertina: { fondo: '#9bd46a', disegno: '#c89b5a', scena: 'colline' },
  tappe: 0,

  // Un posto, non un'estremità: piccoli la farebbe sparire ai bambini di nove anni (le partenze la spengono).
  posto: true,

  // La riga sotto il nome, in home: senza tappa/stelle, che per un gioco senza tappe non contano.
  riassunto(av = { tappa: 0, libera: false, stelle: {}, cfg: {} }) {
    const stato = (av.cfg || {}).stato
    if (!stato) return 'un pezzo di terra tutto da riempire'
    const piazzole = Object.keys(stato.piazzole || {}).length
    const cose = (stato.cose || []).length
    const oltre = piazzole - PIAZZOLE_INIZIALI
    const terra = oltre > 0 ? `+${oltre} di terra` : 'terra di partenza'
    return `${terra} · ${cose} cose sistemate`
  },

  // I contatori li muove Gioco.vue con segna()/segnaBest(): fattoriaVarieta e fattoriaVestiti sono
  // primati (mettere e togliere lo stesso non vale doppio), fattoriaOrdini è il gesto che chiude la catena.
  albo: {
    area: { nome: 'La fattoria', emoji: '🚜' },

    // Modesto apposta: non deve diventare la scorciatoia per salire di livello senza fare un esercizio.
    xp: m => m.tot('fattoriaTerre') + m.tot('fattoriaSgomberi')
             + Math.floor(m.tot('fattoriaPosati') / 2) + m.best('fattoriaVarieta')
             // un raccolto vale mezzo punto: è il gesto più ripetuto
             + Math.floor(m.tot('fattoriaRaccolti') / 2) + m.tot('fattoriaRitiri')
             // Un ordine vale due punti: dietro c'è una catena intera, ma l'esperienza vera sta nel livello della fattoria.
             + 2 * m.tot('fattoriaOrdini') + m.best('fattoriaVestiti'),
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
      // la varietà del catalogo (34 voci oggi) tiene basse le soglie alte
      { id: 'fattoria-varieta', emoji: '🎨', nome: 'Un po\' di tutto',
        come: n => `Colleziona ${n} cose diverse`,
        soglie: [8, 20, 32], valore: m => m.best('fattoriaVarieta') },
      // Soglie basse: un raccolto costa tempo vero (dieci minuti), non un tocco.
      { id: 'fattoria-raccolti', emoji: '🌾', nome: 'Buon raccolto',
        come: n => `Raccogli ${n} campi`,
        soglie: [3, 12, 40], valore: m => m.tot('fattoriaRaccolti') },
      // Stesso motivo dei raccolti; la prima soglia è uno, il momento in cui si scopre che la catena ha una fine.
      { id: 'fattoria-ordini', emoji: '🧺', nome: 'Servizio a domicilio',
        come: n => `Consegna ${n} ordini al mercato`,
        soglie: [1, 10, 35], valore: m => m.tot('fattoriaOrdini') },
      // Contano gli addobbi addosso insieme, non i cappelli comprati: l'ultima chiede di vestirne più di una.
      { id: 'fattoria-vestiti', emoji: '🎩', nome: 'Che eleganza',
        come: n => `Metti ${n} addobbi alle tue bestie`,
        soglie: [1, 4, 8], valore: m => m.best('fattoriaVestiti') },
    ],
  },
}
