/* ⚠ FUORI DALLA FILA — NON INSEGNA UN PROBLEMA, INSEGNA UN'ABITUDINE
      Questo livello chiede di prendere una chiave che *forse* servirà.
      Ma con tre verbi e nessuna struttura per decidere, la mossa giusta
      si ricava **senza guardare la situazione**: prendi tutto quello
      che trovi, apri tutte le porte, e vinci sempre. Non è un problema
      da risolvere — è una regola di prudenza, e imparare a essere
      prudenti non è imparare a programmare. Peggio: è la stessa
      abitudine che i livelli dopo devono smontare, perché lì «faccio
      tutto comunque» è esattamente la mossa che deve perdere.
      Perché diventi un problema servono due cose che oggi non ci sono:
      il **bivio** già in mano (per poter *decidere* invece di
      cautelarsi) e le **ombre sui posti possibili** (per sapere che il
      tesoro *può* finire dietro il portone, senza vedere dove sia
      finito). Con quelle due, la stessa stanza diventa «guarda dove può
      essere, e prendi la chiave solo se ti serve». Senza, resta questo.
      Il file resta qui, fuori da `LIVELLI`: la stanza è buona, è la
      lezione che manca.

   ── QUELLO CHE PROVAVA A INSEGNARE ──
      Stesso vocabolario e stesso mondo
      del livello prima — una chiave, un portone, un tesoro: quello che
      cambia è DOVE finisce il tesoro, e la lezione è tutta lì.

      Il tesoro sta a volte in una piazza aperta, dove ci si arriva senza
      niente in mano, e a volte in una cella chiusa dietro il portone. Il
      piano però si firma PRIMA di sapere in quale delle due battaglie si
      finisce (§1 della didattica), e allora la mossa giusta è quella che
      di solito sembra sprecata: **prendere la chiave anche quando non si
      vede a cosa serva**. Costa un ordine; non prenderla costa la
      battaglia, ma solo in due volte su tre — cioè abbastanza spesso da
      far male e abbastanza di rado da sembrare sfortuna.

      È il primo livello in cui un ordine si scrive per una situazione
      che POTREBBE capitare invece che per quella che si vede. Chi lo
      capisce qui ha in mano il motivo per cui esistono le scene.

      ── PERCHÉ NON È IL LIVELLO CHE VOLEVAMO ──
      Doveva insegnare un'altra cosa: nominare la cosa (`prendi [il
      tesoro]`) invece di puntare la casella dov'era la volta scorsa
      (`vai [8,1]`). Quella tesi in questo gioco **non è dimostrabile**,
      ed è già scritto nella settima prova del tutorial: da quando
      `prendi` e `apri` camminano da soli, una fila di mete esplicite non
      è più una tentazione per nessuno, e infatti il `vai` a una cella si
      può togliere dal piano sbagliato senza cambiarne l'esito. Un
      livello che promette una lezione e ne dimostra un'altra è il
      difetto per cui «La fortezza» è stata tolta dal tutorial: qui la
      promessa è stata riscritta su quello che il livello prova davvero.
      Il seguito sta in `docs/generale-didattica.md`, §12. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.eroe()
const chiave = cose.chiave()
const portone = cose.porta('portone', 'il portone', { chiave: 'chiave' })
const tesoro = cose.tesoro()

/* due posti per la chiave, due per il tesoro: ogni battaglia ne riempie
   uno per coppia, l'altro resta pavimento. La chiave si sposta soltanto
   perché non la si impari a memoria — quello che decide la battaglia è
   dove finisce il TESORO. */
const postoChiave = cose.segnaposto()
const postoTesoro = cose.segnaposto()

const SALA = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|k1|..|..|..|..|..|t1|##|..|..|##',
  '##|..|..|..|..|..|..|..|..|##|..|..|##',
  '##|..|@@|..|..|..|..|..|k2|p1|..|t2|##',
  '##|..|..|..|..|..|..|..|..|##|..|..|##',
  '##|..|..|..|..|..|..|..|..|##|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
], { '@@': eroe, k1: postoChiave, k2: postoChiave, t1: postoTesoro, t2: postoTesoro, p1: portone })

export const CHIAVE_FORSE = livello({
  id: 'parole-chiave-forse', nome: 'La chiave che forse non serve',
  idea: 'Un piano si firma prima di sapere quale battaglia tocca',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>.",
  racconto: "Il tesoro non sta sempre nello stesso posto: a volte è in mezzo alla piazza, a volte dietro il portone chiuso, e <b>cambia a ogni battaglia</b>. La chiave invece si trova sempre, prima ancora di sapere se servirà.",
  aiuti: ['Guarda dove può finire il tesoro: non è sempre lo stesso posto.',
          'Un ordine che oggi sembra sprecato domani è quello che ti salva.',
          'Prendere la chiave non costa niente, anche quando sembra non servire.'],
  ambiente: 'cortile', prove: 3,

  scena: SALA,
  complementi: ['chiave', 'portone', 'tesoro'],
  verbi: ['vai', 'prendi', 'apri'],
  vince: [se.ha(eroe, tesoro)],

  varianti: [
    { nome: 'la chiave a ponente, il tesoro nella piazza aperta',
      metti: { k1: chiave, t1: tesoro } },
    { nome: 'la chiave a levante, il tesoro nella cella chiusa',
      metti: { k2: chiave, t2: tesoro } },
    { nome: 'la chiave a ponente, il tesoro ancora nella cella chiusa',
      metti: { k1: chiave, t2: tesoro } },
  ],

  par: 3,
  soluzioni: [
    { nome: 'la chiave prima, sempre', piano: { eroe: [
      fai.prendi(chiave), fai.apri(portone), fai.prendi(tesoro),
    ] } },
    /* FRAGILE, ED È LA MOSSA PIÙ NATURALE DEL GIOCO: andare dritti a
       quello che si vuole. `prendi` cammina da solo, quindi nella
       battaglia in cui il tesoro è nella piazza aperta questo piano
       vince con UN ordine solo — ed è proprio per questo che è una
       tentazione. Nelle altre due l'eroe arriva davanti al portone e lì
       si ferma: non ha la chiave, e non è più il momento di andare a
       prenderla. */
    { nome: 'dritto al tesoro', fragile: true, piano: { eroe: [
      fai.prendi(tesoro),
    ] } },
  ],

  verifiche: {
    /* la chiave PRIMA del portone: è la sequenza del tutorial, e qui
       torna dentro un livello dove non è ovvio che serva affatto */
    ordineConta: [['prendi chiave', 'apri portone']],
  },
})

export default CHIAVE_FORSE
