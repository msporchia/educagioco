/* 1 ─ un ordine solo, e la strada la trova lui. Serve a far vedere la
      forma: verbo + cosa, poi ▶.
      SI PRENDE, non ci si arriva: `prendi` cammina da solo fino alla
      cosa e poi la mette nello zaino, quindi resta un ordine solo — ma
      dal primo livello la parola giusta è quella che dice cosa vuoi,
      non dove vuoi mettere i piedi. `vai` c'è lo stesso, e portarci
      l'eroe sopra non fa vincere: è la prima cosa che si impara
      sbagliando, e costa un ▶.

      NIENTE VARIANTI, ED È VOLUTO. Le tre scene servono a far cadere
      un piano che indovina invece di ragionare: qui il piano è «prendi
      il tesoro» e non c'è niente da indovinare — spostare il forziere
      darebbe tre volte la stessa prova. Le varianti cominciano dove
      comincia la possibilità di sbagliare. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

/* Chi c'è in questa storia. Si dichiarano qui una volta, e da qui in
   poi si passano — `fai.prendi(tesoro)`, non `fai.prendi('tesoro')`:
   un refuso diventa un errore subito invece di un ordine che a partita
   avviata non trova niente. */
const eroe = chi.eroe()
const tesoro = cose.tesoro()

export const PRIMO = livello({
  id: 'primo', nome: 'Il primo ordine', idea: 'Un verbo, una cosa, e via',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>.",
  racconto: "Camminare lo sa fare da solo: intorno ai muri ci gira senza che glielo dica nessuno. Tu gli dici <b>cosa</b> fare, non come.",
  aiuti: ['Un ordine è fatto di due cose: un verbo, e la cosa su cui vale.',
          'Stare accanto a una cosa non vuol dire averla.',
          'Guarda i verbi che hai: uno ti porta lì, un altro ti mette la roba nello zaino.'],
  ambiente: 'cortile', prove: 1,

  /* Due corti divise da un muro, con un varco in mezzo. La stanza non ha
     niente da nascondere: la lezione è la forma di un ordine, non la
     mappa — e la strada attorno al muro la trova lui. */
  scena: campo([
    '##|##|##|##|##|##|##|##|##|##|##|##|##',
    '##|..|..|..|..|..|##|..|..|..|..|..|##',
    '##|..|..|..|..|..|##|..|..|..|..|..|##',
    '##|..|..|..|..|..|..|..|..|..|..|..|##',
    '##|..|..|..|..|..|##|..|..|..|..|..|##',
    '##|..|@@|..|..|..|##|..|..|..|T$|..|##',
    '##|##|##|##|##|##|##|##|##|##|##|##|##',
  ], { '@@': eroe, 'T$': tesoro }),

  complementi: ['tesoro'],
  vince: [se.ha(eroe, tesoro)],

  par: 1,
  soluzioni: [{ nome: 'dritto al tesoro', piano: { eroe: [fai.prendi(tesoro)] } }],
})

export default PRIMO
