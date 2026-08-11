/* 2 ─ la sequenza per intero. Nasce da sé dalla precondizione: un'azione
      funziona solo se hai la cosa a portata, quindi prima ci vai.

      UNA SCENA SOLA, come la prima: il piano è «chiave, portone,
      tesoro» e non c'è niente da indovinare — spostare la chiave
      cambierebbe la strada, non il ragionamento. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.eroe()
const chiave = cose.chiave()
const portone = cose.porta('portone', 'il portone', { chiave: 'chiave' })
const tesoro = cose.tesoro()

export const CHIAVE = livello({
  id: 'chiave', nome: 'La chiave e il portone', idea: 'Prima la chiave, poi il portone',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. È dietro il portone.",
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

  complementi: ['chiave', 'portone', 'tesoro'],
  vince: [se.ha(eroe, tesoro)],

  par: 3,
  soluzioni: [{ nome: 'chiave, portone, tesoro', piano: { eroe: [
    fai.prendi(chiave), fai.apri(portone), fai.prendi(tesoro),
  ] } }],
})

export default CHIAVE
