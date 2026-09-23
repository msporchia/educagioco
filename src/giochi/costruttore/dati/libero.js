/* ═══════════════════════════════════════════════════════════════════
   IL CANTIERE LIBERO — dove non ordina nessuno

   Un cantiere grande e vuoto, con tutti i blocchi e tutti i colori, e i
   progetti dei livelli da riprendere dalla cassetta. Non si vince e non
   paga: è il posto dove un progetto scritto per il re diventa il
   castello che si voleva fare, ed è il motivo per tornare quando i
   livelli sono finiti — collezionare quello che si è scritto e usarlo.

   Non è una tappa: non sta in `LIVELLI`, non conta nelle stelle e non
   sposta la campagna. Si apre finito il primo capitolo, quando i blocchi
   per costruire qualcosa di grande ci sono già tutti.
   ═══════════════════════════════════════════════════════════════════ */
import { CHIAVI_COLORI } from './colori.js'

export const APRE_DOPO = 6      // quante tappe servono: il capitolo del cantiere

export const LIBERO = {
  chiave: 'libero', nome: 'Il cantiere libero', icona: '🏗️', libero: true,
  chi: { emoji: '👷', nome: 'Il capomastro' },
  racconto: 'Qui non ordina nessuno: costruisci quello che vuoi. I progetti che hai scritto nei livelli li riprendi dalla cassetta.',
  prova: 'libero',
  ordini: [{ nome: 'il cantiere', robot: [1, 10], mappa: [
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
    '##################',
    '##################',
  ] }],
  cassetta: ['vai', 'metti', 'ripeti', 'finche', 'se', 'assegna', 'progetti'],
  posti: ['sotto', 'giu-destra', 'giu-sinistra'],
  colori: CHIAVI_COLORI,
  misure: true,
  aiuti: [
    'Qui si costruisce quello che si vuole: una casa, un castello, una piramide a colori.',
    'Dalla cassetta, sotto «dai tuoi altri cantieri», riprendi i progetti che hai già scritto nei livelli.',
    'Un progetto può chiamare un altro progetto: una casa fatta di muri, un villaggio fatto di case.',
  ],
}
