/* 5 ─ LO STAGNO. L'esame, e come tutti gli esami non porta niente di
      nuovo: porta insieme le tre cose imparate una per volta.

        · il pane si prende e si POSA, e dove lo posi va la papera (2)
        · il cane si LASCIA PASSARE, e per farlo bisogna prima averlo
          visto passare (3)
        · e si torna indietro da soli, perché la papera deve RESTARE
          dov'è mentre tu te ne vai (3 e 4)

      La strada per lo stagno passa dal cortile di Bombo, e lo stagno è
      oltre il cancello. Non c'è un ordine che non si sia già scritto.

      ── E FINISCE COL PREMIO CHE SI VEDE ──
      Non «superato»: Bibi in acqua. È la regola di tutta la campagna,
      ed è l'unica cosa che a sei anni vale davvero la fatica. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const rosa = chi.nostro('rosa', 'Rosa', { corpo: 'principessa', emoji: '👧', vista: 7 })

const pane = cose.pane()
const stagno = cose.posto('stagno', 'lo stagno')
const legnaia = cose.posto('legnaia', 'la legnaia')
const abbaio = cose.segnale('abbaio', 'un abbaio', { em: '🐕', col: '#c9603f' })

const bibi = chi.terzo('bibi', 'Bibi', { corpo: 'papera', emoji: '🦆', vista: 4, vita: 4,
  schiera: 'cortile', schieraNome: 'quelli del cortile',
  fa: [fai.ripeti([fai.vai(pane)], se.caduto('bibi'))] })

/* lo stesso cane del terzo capitolo, con lo stesso giro: chi l'ha
   giocato riconosce il passo e sa già cosa guardare */
const bombo = fa => chi.nemico('bombo', 'Bombo', { corpo: 'lupo', emoji: '🐕',
  vista: 3, vita: 8, grida: 'abbaio',
  schiera: 'cortile', schieraNome: 'quelli del cortile', fa })
/* ── IL GIRO STA TUTTO DI LÀ, ED È LA CHIAVE DEL LIVELLO ──
   Bombo va e viene fra il centro del cortile e il fondo di levante, e
   **non arriva mai dalla parte della legnaia**. Da lì viene che «non lo
   vedo più» vuol dire una cosa sola: è in fondo. Se il suo giro
   arrivasse anche di qua, sparire vorrebbe dire due cose — è andato, o
   sta tornando — e nessuna attesa potrebbe distinguerle: il livello
   diventerebbe fortuna. La sosta in fondo è la finestra per passare. */
const giro = [fai.vai('11,3'), fai.aspettaUnPo(5), fai.vai('5,3')]
const bomboDa = quale => bombo([fai.ripeti(
  quale === 0 ? giro
  : quale === 1 ? [fai.vai('5,3'), ...giro]
  : [fai.aspettaUnPo(2), ...giro],
  se.caduto('rosa'))])

/* IL CORTILE, LO STAGNO OLTRE IL CANCELLO — la fascia di mezzo è di
   Bombo, come al terzo capitolo; a mezzogiorno c'è il cancello, e
   dietro il cancello lo stagno. */
const CORTILE = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|P$|LG|BB|..|..|..|..|..|..|..|..|##',
  '##|##|##|##|..|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|..|..|..|..|..|CN|##',
  '##|##|##|##|..|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|..|..|..|..|..|..|##',
  '##|##|##|##|##|##|..|..|ST|..|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
], { 'P$': pane, LG: [legnaia, rosa], BB: bibi, CN: cose.segnaposto(), ST: stagno })

export const LO_STAGNO = livello({
  id: 'cortile-stagno', nome: 'Lo stagno', idea: 'Tutto insieme, e la papera in acqua',
  dritta: "Obiettivo: <b>Bibi nello stagno, e Rosa a casa</b>. Se Bombo abbaia, Bibi scappa via.",
  racconto: "Lo stagno è in fondo, e per arrivarci si attraversa il cortile di Bombo. Bibi non l'ha mai visto. Tu sì.",
  aiuti: ['Niente di nuovo: il pane, il cane, e tornare a casa.',
          'Il cane si lascia passare, e per sapere che è passato bisogna prima averlo visto.',
          'Il pane si posa dove vuoi che vada lei — anche se tu poi te ne vai.'],
  ambiente: 'cortile',

  scena: CORTILE,
  segnali: [abbaio],
  complementi: ['pane', 'stagno', 'legnaia', 'bombo', 'bibi'],
  verbi: ['vai', 'prendi', 'posa', 'aspetta'],
  condizioni: [se.vedi('bombo'), se.nonVedi('bombo'), se.qui(bibi, stagno)],

  /* come al terzo capitolo: la papera resta in acqua, Rosa torna a
     casa. È la ragione per cui il pane va posato e non tenuto. */
  vince: [se.qui(bibi, stagno), se.qui(rosa, legnaia)],
  perde: [se.sentito(abbaio)],
  motivoSconfitta: 'Bombo ha abbaiato, e Bibi è scappata via.',
  mostraNemici: true,

  varianti: [
    { nome: 'Bombo viene verso di te', metti: { CN: bomboDa(0) } },
    { nome: 'Bombo è in fondo al cortile', metti: { CN: bomboDa(1) } },
    { nome: 'Bombo si è appena fermato', metti: { CN: bomboDa(2) } },
  ],

  soluzioni: [
    { nome: 'lo lascio passare, poi lo stagno', piano: { rosa: [
      fai.prendi(pane),
      fai.aspettaDiVedere('bombo'),
      fai.aspettaChe(se.nonVedi('bombo')),
      fai.vai(stagno), fai.posa(pane), fai.vai(legnaia),
    ] } },

    { nome: 'conto fino a sei', fragile: true, piano: { rosa: [
      fai.prendi(pane),
      fai.aspettaUnPo(6),
      fai.vai(stagno), fai.posa(pane), fai.vai(legnaia),
    ] } },
  ],

  verifiche: {
    nonInFila: true,
    senza: ['pane'],
    ordineConta: [['vai stagno', 'posa pane']],
  },
})

export default LO_STAGNO
