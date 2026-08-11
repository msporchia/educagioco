/* ═════ LA MINIERA ═════
   Terra battuta, binari che attraversano la stanza, muri tenuti su
   dalle travi. Insieme al tappeto del trono è l'unico pavimento con
   una **direzione**: i binari dicono da dove si viene e dove si va.

   Il legname è di due tagli — uno più fresco, uno più stagionato — e
   dove le travi hanno ceduto si vede prima la roccia franata, poi un
   vecchio rivestimento di mattoni più in profondità: la miniera non è
   la prima cosa scavata in quel punto. Lo stesso crollo affiora nella
   terra battuta come ghiaia e mattonelle perdute.

   I cristalli sono rari apposta — se ce n'è uno ogni due celle non
   sono più un tesoro, sono un motivo decorativo. */
import { legno, roccia, mattoni, binari, pietraia, mattonelle } from '../materiali/pattern.js'

export const MINIERA = {
  nome: 'La miniera',

  mura: [
    legno('#8a6640', '#543b24'),
    legno('#836142', '#4d3a26', { seme: 4, quanto: 0.22 }),
    /* i montanti ora chiedono il permesso corso per corso, come le
       assi: questa voce, travi marce sul bordo del crollo, è anche la
       prova che il contratto è chiuso — se un montante uscisse dal suo
       pezzo lascerebbe un buco nero appena fuori dal blocco */
    legno('#6a4a2c', '#3a2a18', { modo: 'marcio', dove: 'crollo', quanto: 0.18, seme: 6 }),
    roccia('#6b6053', '#433a2f', { modo: 'frantumata', dove: 'crollo', quanto: 0.16, seme: 3 }),
    mattoni('#7a5c42', '#4a3826', { dove: 'crollo', quanto: 0.08, seme: 5 }),
  ],

  suolo: [
    binari('#5a4a38', '#43372a'),
    pietraia('#544334', '#3c3226', { dove: 'crollo', quanto: 0.14, seme: 4 }),
    mattonelle('#5c4a3a', '#40342a', { dove: 'crollo', quanto: 0.08, seme: 2 }),
  ],

  campi: { crollo: 4.5, polvere: 7 },

  /* più chiara di quanto verrebbe da pensare: una miniera è buia, ma
     un pavimento di terra scuro sotto un `buio` alto diventa un vuoto
     marrone in cui non si vede né il binario né dove finisce la
     stanza. La luce la fanno le torce, il pavimento deve solo
     restituirla. */
  fondo: ['#514231', '#372c20'],
  chiazze: ['#7a6449', '#2a2119'],
  terra: '#6f5740', sasso: '#8a7f6e', muschio: '#4a6b4a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  giunto: '#1e1710',
  cristallo: '#7fd8e0',
  luce: '#ffca7a', fiamma: '#ffa63c', buio: 0.3, torce: true,

  varianti: ['liscio', 'liscio', 'polvere', 'detriti', 'screpolato', 'ombra'],

  dettagli: [['ciottoli', 2.3, 'crollo'], ['assi', 3.6, 'polvere'],
             ['cristalli', 4, 'crollo'], ['crepe', 5, 'crollo']],
}
