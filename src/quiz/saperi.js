/* ═══════════════════════════════════════════════════════════════════
   LE SOTTOVOCI DI UN GRUPPO DI SAPERE — il ponte fra i moduli e la
   schermata dei genitori.

   `data/saperi.js` elenca i gruppi grossi («Accenti e apostrofi») e i
   moduli dichiarano le tipologie che ci stanno dentro (l'accento,
   l'apostrofo, la lettera h, l'accento tonico). Le due parti non si
   conoscono apposta: un modulo nuovo porta le sue tipologie e compare
   nel dettaglio la sera stessa, senza che nessuno vada ad aggiornare un
   elenco a mano.

   Qualcuno però deve pur metterle insieme per disegnarle, e quel
   qualcuno è questo file. Sta qui e non in `data/` per una ragione
   sola: il registro dei moduli è fatto con `import.meta.glob`, quindi
   gira solo sotto Vite. `data/saperi.js` invece lo legge anche
   `store/profile.js`, che deve funzionare ovunque — se le sottovoci
   stessero là, il profilo si porterebbe dietro tutti i moduli di quiz.

   Lo usa solo `GenitoriView`. Chi fa le domande non ne ha bisogno: per
   `quiz/scelta.js` un gruppo spento e una tipologia spenta sono la
   stessa cosa, due chiavi nella stessa lista.

   Da qui passa anche l'ESEMPIO, che è la stessa domanda per il verso
   contrario: `nucleo/esempi.js` sa ricavare da una chiave i moduli che
   la citano e generarne una domanda vera. Il conto sta là perché là non
   c'è nessun `import` e quindi si può provare in Node; qui si aggiunge
   solo il registro.
   ═══════════════════════════════════════════════════════════════════ */

import { MODULI } from './nucleo/registro.js'
import { sorteQualunque } from './nucleo/sorte.js'
import { sorgentiDi, esempioDi as esempioFra } from './nucleo/esempi.js'


/* le tipologie che un gruppo si porta dietro, nell'ordine in cui i
   moduli le dichiarano — che è l'ordine della scaletta, cioè dal facile
   al difficile. `dove` è il modulo che la fa: non si mostra, ma serve a
   capire chi ha dichiarato cosa quando qualcosa non torna.

   Ognuna porta anche **l'età a cui serve**, che è la cosa che mancava
   per poterla giudicare: i gradi in cui esce, e da che età a che età
   quelle domande hanno senso (`nucleo/classi.js`). Una tipologia che
   esce a più gradi ha un intervallo e non un numero — «le ore intere»
   stanno al grado 1 e ricompaiono al 4 — e dirlo con due numeri è
   l'unico modo onesto: uno solo sarebbe una media che non corrisponde a
   nessuna domanda vera. */
export function sottoDi(gruppo) {
  const fuori = []
  for (const m of MODULI)
    for (const t of m.tipi)
      if (t.sa.includes(gruppo)) {
        const gradi = Object.keys(t.gradi).map(Number).filter(g => t.gradi[g] > 0).sort((a, b) => a - b)
        const livelli = gradi.map(g => m.livelloDelTipo(t, g))
        fuori.push({
          chiave: t.chiave, nome: t.nome, dove: m.id,
          icona: m.icona, modulo: m.nome,
          gradi,
          da: livelli.length ? Math.min(...livelli) : 0,
          a: livelli.length ? Math.max(...livelli) : 0,
        })
      }
  return fuori
}

/* tutte le tipologie di tutti i moduli, per chi deve controllare che
   non ne resti nessuna senza gruppo */
export const TIPI = MODULI.flatMap(m => m.tipi.map(t => ({ ...t, dove: m.id })))

/* ── provare una voce prima di spegnerla ──
   `siPuoProvare` è quello che la schermata guarda per decidere se
   mostrare il tasto: `divisioni` non passa da nessun modulo (vive nel
   castello) e per quella carta il tasto non deve esserci. */
export const siPuoProvare = chiave => sorgentiDi(MODULI, chiave).length > 0
export const esempioDi = (chiave, sorte = sorteQualunque()) => esempioFra(MODULI, chiave, sorte)
