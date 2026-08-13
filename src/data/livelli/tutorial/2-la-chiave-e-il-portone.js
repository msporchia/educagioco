/* 2 ─ la sequenza per intero. Nasce da sé dalla precondizione: un'azione
      funziona solo se hai la cosa a portata, quindi prima ci vai.

      E LA STESSA PAROLA VALE DUE VOLTE. `apri` qui si dice sul portone
      e sul forziere, che sono due cose che non si somigliano per
      niente: è il primo assaggio di quello che il terzo livello farà
      per bene — una struttura sola, facce diverse (§5 della
      didattica). Chi arriva qui ha aperto un forziere; scoprire che lo
      stesso verbo apre anche un portone non è una regola in più da
      imparare, è una che vale già.

      UNA SCENA SOLA, come la prima: il piano è «chiave, portone,
      tesoro» e non c'è niente da indovinare — spostare la chiave
      cambierebbe la strada, non il ragionamento. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.eroe()
const chiave = cose.chiave()
const portone = cose.porta('portone', 'il portone', { chiave: 'chiave' })
const tesoro = cose.forziere()

export const CHIAVE = livello({
  id: 'chiave', nome: 'La chiave e il portone', idea: 'Prima la chiave, poi il portone',
  dritta: 'Obiettivo: <b>il forziere deve essere aperto</b>. Sta dietro il portone.',
  racconto: "Alla chiave e al portone l'eroe ci va da solo: quello che gli manca, se gli manca, non è la strada.",
  aiuti: ['Un ordine può fallire anche stando nel posto giusto.',
          'Se dice «non ce l\'ho», vuol dire che gli manca un ordine PRIMA di quello.',
          'Tre cose in fila, e l\'ordine in cui le metti è tutto.'],
  ambiente: 'cortile', prove: 1,

  /* le stesse due corti della prima prova, e in mezzo il portone: la
     stanza è già conosciuta, così l'unica cosa nuova è la serratura */
  scena: campo([
    '##|##|##|##|##|##|##|##|##|##|##|##|##',
    '##|..|k1|..|..|..|##|..|..|..|..|..|##',
    '##|..|..|..|..|..|##|..|..|..|..|..|##',
    '##|..|@@|..|..|..|p1|..|..|..|T$|..|##',
    '##|..|..|..|..|..|##|..|..|..|..|..|##',
    '##|..|..|..|..|..|##|..|..|..|..|..|##',
    '##|##|##|##|##|##|##|##|##|##|##|##|##',
  ], { '@@': eroe, 'k1': chiave, 'p1': portone, 'T$': tesoro }),

  /* la stessa roba della prima corte, spostata: è lo stesso posto il
     giorno dopo, e riconoscerlo è metà del motivo per cui la stanza si
     ripete */
  /* tutto sui muri, come nella prima prova: quello che ha un volume
     sta dove l'ingombro è vero */
  scenografia: [
    /* le due bandiere stanno sul muro ai lati del portone, e non è
       decoro: sono il modo più corto di dire «di qui si passa» a chi
       non sa ancora leggere */
    { che: 'bandiera', x: 6, y: 2 }, { che: 'bandiera', x: 6, y: 4 },
    { che: 'albero', x: 3, y: 0 }, { che: 'albero', x: 10, y: 0 },
    { che: 'cespuglio', x: 2, y: 6 }, { che: 'cespuglio', x: 9, y: 6 },
  ],

  complementi: ['chiave', 'portone', 'tesoro'],
  vince: [se.aperto(tesoro)],

  par: 3,
  soluzioni: [{ nome: 'chiave, portone, tesoro', piano: { eroe: [
    fai.prendi(chiave), fai.apri(portone), fai.apri(tesoro),
  ] } }],

  verifiche: {
    /* la lezione, detta al banco: la chiave prima del portone. È il
       solo scambio che deve far cadere il piano — il portone prima del
       forziere lo impone la mappa, non il ragionamento */
    ordineConta: [['prendi chiave', 'apri portone']],
  },
})

export default CHIAVE
