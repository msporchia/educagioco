/* ═══════════════════════════════════════════════════════════════════
   CHI FA LA DOMANDA — il ponte fra un gioco e gli undici moduli.

   Un gioco non nomina mai un modulo. Dice «dammi una domanda tosta di
   italiano» — o non dice nemmeno quello — e riceve una domanda già
   pronta da mostrare:

     const d = domandaPerGioco({ difficolta: 0.6 })
     // { domanda, pittori, modulo, materia, grado }

   Perché non lasciare che il gioco scelga il modulo: perché allora
   Survivors avrebbe dentro l'elenco delle materie, e aggiungere un
   modulo vorrebbe dire aprire i giochi. Qui invece un modulo nuovo si
   presenta da solo — il registro lo raccoglie dalla cartella — e
   compare in tutti i giochi la sera stessa.

   LA DIFFICOLTÀ È UNA SOLA MANOPOLA, da 0 a 1. I moduli hanno gradi
   diversi (cinque, sei), e non è affare del gioco saperlo: 0 è il primo
   grado di qualunque modulo, 1 è l'ultimo. Un gioco che si fa più duro
   alza quel numero e basta.

   SI PESCA UNA CLASSE DI DOMANDE, NON UN MODULO. È la cosa che qui
   dentro conta di più, e per un po' è stata sbagliata. Prima si tirava
   a sorte il modulo (uno su undici) e poi il grado si *calcolava* dalla
   difficoltà: `round(1 + d × (gradi−1))`. Due conseguenze, tutte e due
   brutte. La prima: con le tre fasce di Survivors (0.15 · 0.50 · 0.85)
   il primo e l'ultimo grado di ogni modulo non uscivano mai — l'area,
   il perimetro e il confronto fra i due stanno in cima alla scaletta
   della griglia, e per vederli serviva una carta da 0.8. La seconda:
   una classe di domande valeva quanto il modulo che se la portava
   dietro, quindi un modulo con sei classi le mostrava una alla volta e
   un modulo con una classe sola la mostrava sempre.

   Adesso l'unità è la COPPIA (modulo, grado) — una classe di domande —
   e si pescano tutte insieme con un peso che cala man mano che ci si
   allontana dalla difficoltà chiesta. Perimetro pesa quanto «i
   contrari», i gradi in cima si vedono, e la difficoltà resta una
   manopola: solo che adesso è un centro, non un binario.

   QUELLO CHE IL BAMBINO NON HA MAI FATTO non si chiede. I genitori
   spengono un gruppo o una singola tipologia (`data/saperi.js`, la
   seconda scheda della loro schermata) e da lì in poi quelle domande
   non escono più: dentro un grado si pescano solo le tipologie ancora
   accese, un grado che le perde tutte sparisce, il modulo degrada a un
   grado più facile e se non ne ha nessuno esce dal mazzo. È l'unico
   posto che lo sa — i giochi continuano a chiedere «una domanda» e
   basta.

   IL RIPASSO PESA, MA POCO. Ogni domanda porta la chiave del concetto
   che allena, e da quando le risposte finiscono in `store/srs.js`
   (`quiz/memoria.js`) la pesca non è più cieca: quello che il bambino
   sa meno esce una volta e mezzo, quello che sa bene la metà. La banda
   è stretta apposta e il perché sta in `nucleo/bisogno.js` — qui la
   domanda è il pedaggio di un gioco d'avventura, non la lezione, e una
   partita di sola geometria a chi la geometria non la capisce sarebbe
   una punizione. I giochi non se ne accorgono, che è esattamente il
   motivo per cui la scelta sta qui e non dentro di loro.
   ═══════════════════════════════════════════════════════════════════ */

import { MODULI, perId } from './nucleo/registro.js'
import { sorteQualunque } from './nucleo/sorte.js'
import { classiDi, pescaClasse } from './nucleo/classi.js'
import { ilBisogno } from './memoria.js'
import { saperiSpenti } from '../store/profile.js'

/* Le materie, nell'ordine in cui si presentano. Un gioco può restringere
   il campo (`materie: ['matematica', 'spazio']`), ma non è tenuto a
   conoscerle: senza filtro entrano tutte. */
export const MATERIE = ['italiano', 'matematica', 'spazio', 'tempo', 'logica', 'scienze']

/* da 0..1 al grado di *quel* modulo, che può averne cinque o sei.
   `spenti` sono i saperi che i genitori hanno tolto: se il grado che
   verrebbe fuori li chiede, si scende al grado buono più vicino invece
   di consegnare una domanda che il bambino può solo indovinare.
   È il conto secco, senza banda: serve a chi una classe la vuole
   decisa (`domandaDa`) e al confronto nei test. */
export function gradoPer(modulo, difficolta = 0, spenti = []) {
  const g = Math.max(1, Math.min(modulo.gradi, Math.round(1 + (difficolta || 0) * (modulo.gradi - 1))))
  return spenti.length ? (modulo.gradoVicino(g, spenti) ?? g) : g
}

/* ── le classi di domande fra cui pescare ──
   Una per coppia (modulo, grado), con il peso che le tocca a quella
   difficoltà. Il conto sta in `nucleo/classi.js`, che non importa
   niente e si può quindi provare senza browser: qui si applicano solo
   i filtri di chi chiede. */
export function classiAmmesse({ materie, moduli, spenti = [], difficolta = 0,
                                bisogno = null } = {}) {
  const buoni = moduliAmmessi({ materie, moduli, spenti })
  const restano = classiDi(buoni, { spenti, difficolta, bisogno })
  /* SPENTO TUTTO non si resta senza domande. Finché c'era un modulo che
     non dichiarava niente — la logica, le sequenze — qualcosa restava
     sempre e questa riga non serviva; da quando ogni tipologia sta in un
     gruppo, spegnerli tutti svuota l'elenco, e chi chiama si troverebbe
     un `null` al posto della classe. Un gioco senza domanda è rotto e
     una domanda che il bambino non sa fare no: si torna a pescare fra
     tutte, come già fa `moduliAmmessi` quando resta a mani vuote. */
  return restano.length ? restano : classiDi(buoni, { difficolta, bisogno })
}

/* i moduli fra cui pescare, dati i filtri di chi chiede */
export function moduliAmmessi({ materie, moduli, spenti = [] } = {}) {
  /* Il registro si riempie con `import.meta.glob`, che è di Vite: se
     questo file finisce in un test che gira in Node, la lista è vuota e
     senza questa riga si vedrebbe solo un `undefined` più avanti. */
  if (!MODULI.length) throw new Error(
    'nessun modulo di quiz: `src/quiz/scelta.js` gira solo sotto Vite — ' +
    'in Node importa il modulo che ti serve da `src/quiz/moduli/`')
  let buoni = MODULI
  if (moduli?.length) buoni = buoni.filter(m => moduli.includes(m.id))
  if (materie?.length) buoni = buoni.filter(m => materie.includes(m.materia))
  /* Un modulo che senza quei saperi non ha più un solo grado da
     chiedere — l'orologio a chi le lancette non le legge — esce dal
     mazzo: gli altri hanno gradi liberi e degradano invece di sparire.
     Se restasse vuoto si torna a tutti, perché un gioco senza domande
     è rotto e un gioco con una domanda difficile no. */
  const conSaperi = spenti.length ? buoni.filter(m => m.gradiLiberi(spenti).length) : buoni
  if (conSaperi.length) return conSaperi
  return buoni.length ? buoni : MODULI
}

/* ── la domanda pronta da mostrare ──
   `evita` è l'id del modulo appena uscito: due domande di fila dello
   stesso modulo fanno sembrare il gioco un'interrogazione su una materia
   sola, e con undici moduli non c'è ragione. */
export function domandaPerGioco({
  difficolta = 0, materie, moduli, evita, sorte = sorteQualunque(),
  spenti = saperiSpenti(), bisogno = ilBisogno(),
} = {}) {
  const tutte = classiAmmesse({ materie, moduli, spenti, difficolta, bisogno })
  const senzaLUltimo = evita ? tutte.filter(c => c.modulo.id !== evita) : tutte
  const { modulo, grado } = pescaClasse(sorte, senzaLUltimo.length ? senzaLUltimo : tutte)
  return {
    domanda: modulo.chiedi(grado, sorte, spenti, bisogno),
    pittori: modulo.pittori,
    modulo: modulo.id,
    nome: modulo.nome,
    icona: modulo.icona,
    materia: modulo.materia,
    grado,
  }
}

/* Comodità per chi una materia la vuole per forza (il dungeon che mette
   la stanza di matematica): stessa cosa, con l'id già deciso. */
export function domandaDa(id, { difficolta = 0, sorte = sorteQualunque(),
                                spenti = saperiSpenti(), bisogno = ilBisogno() } = {}) {
  const modulo = perId(id)
  /* anche il modulo chiesto per nome passa dai saperi: se non gli resta
     nessun grado, meglio la domanda di un altro che una muta */
  if (!modulo || !modulo.gradiLiberi(spenti).length)
    return domandaPerGioco({ difficolta, sorte, spenti, bisogno })
  /* il modulo è deciso, la classe no: dentro un modulo solo la banda
     conta ancora di più, se no si vedrebbe sempre lo stesso grado */
  const { grado } = pescaClasse(sorte, classiAmmesse({ moduli: [id], spenti, difficolta, bisogno }))
  return {
    domanda: modulo.chiedi(grado, sorte, spenti, bisogno),
    pittori: modulo.pittori,
    modulo: modulo.id, nome: modulo.nome, icona: modulo.icona,
    materia: modulo.materia, grado,
  }
}
