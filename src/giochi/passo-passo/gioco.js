/* ═══════════════════════════════════════════════════════════════════
   PASSO PASSO — IL MANIFESTO

   Un coniglio deve tornare nella sua tana. Il bambino non lo guida col
   dito: gli scrive una **fila di frecce**, preme ▶, e il coniglio la
   esegue dall'inizio alla fine. È il primo gradino della
   programmazione — un programma è una fila di ordini, si esegue da capo,
   e quando qualcosa va storto si guarda *quale* ordine era sbagliato —
   detto a un bambino di cinque anni che non sa leggere.

   Dato puro, come vuole `src/giochi/CONVENZIONE.md`. La cartella:

     dati/     il vocabolario del mondo (le lettere delle mappe, le
               mosse) e la campagna, ventiquattro posti scritti a mano
     motore/   le regole del mondo, il risolutore (la strada più corta,
               gli aiuti, il controllo che un livello insegni la sua
               regola) e il generatore del sentiero senza fine — tutto
               senza schermo, gira in Node
     scena/    la proiezione (i fatti del motore messi in movimento), la
               tela (il disegno) e la regia (l'orologio)
     viste/    la mappa, il campo, la fila, il cartello di fine
     Gioco.vue il coordinatore, l'unico che sa che esistono le monete
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'
import { apriQuaderno, primatoInParole } from '../primati.js'

export const CHIAVE = 'passo'

/* Il sentiero senza fine: livelli fatti al momento e controllati dal
   risolutore, che si apre a campagna finita. Quello che si migliora lì
   è **quanti sentieri di fila si fanno da soli** — la serie si chiude
   quando si chiede un aiuto (o quando si torna alla mappa). Sbagliare
   una fila non la chiude: qui sbagliare è riprovare, non perdere. */
export const SENZA_FINE = {
  nome: 'Il sentiero senza fine',
  icona: '♾️',
  misura: 'fila',
  che: 'quanti sentieri di fila, senza aiuti',
}

export default {
  chiave: CHIAVE,
  nome: 'Passo passo',
  icona: '🐇',
  che: 'dare gli ordini in fila',
  area: 'logica',
  come: 'pensare',
  tappe: QUANTE_TAPPE,
  tinta: '#e6f4d7',
  senzaFine: SENZA_FINE,

  /* per i quattro-sei anni: niente da leggere, e non si perde mai */
  piccoli: true,
  /* …ma non finisce lì: dopo le buche vengono i gradini dello zaino,
     coi cicli, che sono da otto anni. Senza questa riga le partenze dei
     grandi (`data/partenze.js`) lo spegnerebbero a nove anni come si
     spengono i giochi dei piccoli, e a chi ha l'età dei cicli il gioco
     dei cicli non arriverebbe mai */
  cresce: true,

  /* dietro «giochi in prova» finché un grande non decide che è pronto */
  sperimentale: true,

  riassunto(av = { tappa: 0, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if ((av.tappa || 0) >= QUANTE_TAPPE) {
      const record = primatoInParole(apriQuaderno(av), SENZA_FINE.misura)
      return record ? `sentiero senza fine · record ${record}${coda}` : `tutte le tane${coda}`
    }
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  /* ═══════════ quello che il gioco porta all'albo ═══════════
     I contatori li muove `Gioco.vue` con `segna()`/`segnaBest()`:
       ppProve    le file fatte partire col ▶
       ppTane     le volte che il coniglio è arrivato a casa
       ppCarote   le volte che ci è arrivato con la carota
       ppDaSolo   le volte che ci è arrivato senza aiuti
       ppFila     (primato) i sentieri senza fine di fila, senza aiuti */
  albo: {
    area: { nome: 'Passo passo', emoji: '🐇' },

    xp: m => m.tot('ppTane') * 3 + m.stelleDi(CHIAVE) * 4 + m.tappeDi(CHIAVE) * 30,
    provato: m => m.tot('ppProve') > 0 || m.tappeDi(CHIAVE) > 0,

    traguardi: [
      { id: 'pp-tappe', emoji: '🏡', nome: 'Tutti a casa',
        come: n => n === 1 ? 'Porta il coniglio a casa nella prima tappa di Passo passo'
                           : `Supera ${n} tappe di Passo passo`,
        soglie: [1, 10, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'pp-stelle', emoji: '⭐', nome: 'Le stelle del coniglio',
        come: n => `Raccogli ${n} stelle in Passo passo`,
        soglie: [15, 40, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      /* la carota non serve per vincere: prenderla è la deviazione
         pensata, e questo traguardo conta chi se la va a cercare */
      { id: 'pp-carote', emoji: '🥕', nome: 'L\'orto del coniglio',
        come: n => `Porta a casa ${n} carote`,
        soglie: [5, 20, 50], valore: m => m.tot('ppCarote') },
      { id: 'pp-da-solo', emoji: '🧠', nome: 'Ci penso io',
        come: n => `Porta il coniglio a casa ${n} volte senza aiuti`,
        soglie: [5, 20, 60], valore: m => m.tot('ppDaSolo') },
      { id: 'pp-sentiero', emoji: '♾️', nome: 'Il sentiero senza fine',
        come: n => `Fai ${n} sentieri di fila senza aiuti`,
        soglie: [3, 6, 12], valore: m => m.best('ppFila') },
      { id: 'pp-campagna', emoji: '🏁', nome: 'La strada di casa',
        come: () => 'Finisci tutte le tappe di Passo passo',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}
