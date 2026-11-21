/* La guida di Castle Battle (docs/core/come-si-gioca.md): il passo dal quadro di quello che c'è, puro. Una caserma costruita e
   una potenziata, fatte da quando la guida è accesa; un conto sbagliato riporta indietro da sé, e il riposo lascia correre il campo.
   `node test/esegui.mjs arena-guida`
   tempo: 1 */
import { guidaDiArena, BERSAGLI } from '../../src/giochi/arena/motore/guida.js'
import { controlla, uguale as ug, riassunto } from '../aiuto/verifica.mjs'
const uguale = (n, a, b) => ug(n, JSON.stringify(a), JSON.stringify(b))

const q = (x = {}) => ({ scelta: null, anello: null, libera: 0, caserme: [], ...x })
const caserma = (posto, x = {}) => ({ posto, puoi: true, riposa: false, ...x })

/* ── costruire ── */
uguale('niente aperto: indica la piazzola libera', guidaDiArena(q({ libera: 2 })).dove, BERSAGLI.piazzola(2))
uguale('la nuvoletta aperta: indica la truppa meno cara che si può pagare', guidaDiArena(q({ scelta: ['scheletri', 'guardiano'] })).dove, BERSAGLI.costruisci('scheletri'))
uguale('la nuvoletta aperta ma niente da pagare: torna alla piazzola', guidaDiArena(q({ scelta: [], libera: 1 })).dove, BERSAGLI.piazzola(1))
uguale('il calcolo aperto: tace', guidaDiArena(q({ domanda: true })), null)
uguale('la scheda dei numeri aperta: tace', guidaDiArena(q({ dettagli: true })), null)
uguale('richiamata con caserme già in piedi: fa costruire lo stesso', guidaDiArena(q({ libera: 4, caserme: [caserma(0), caserma(1)] })).dove, BERSAGLI.piazzola(4))

/* ── potenziare ── */
uguale('costruita: indica la caserma', guidaDiArena(q({ costruita: true, caserme: [caserma(3)] })).dove, BERSAGLI.piazzola(3))
uguale('niente posto né 💎 per costruire: passa a potenziare', guidaDiArena(q({ libera: null, caserme: [caserma(5)] })).dove, BERSAGLI.piazzola(5))
uguale('l\'anello sulla caserma: indica ⬆️', guidaDiArena(q({ costruita: true, anello: 3, caserme: [caserma(3)] })).dove, BERSAGLI.potenzia)
uguale('l\'anello su una caserma che non si può potenziare: indica quella che si può',
       guidaDiArena(q({ costruita: true, anello: 1, caserme: [caserma(1, { puoi: false }), caserma(3)] })).dove, BERSAGLI.piazzola(3))
const senza = guidaDiArena(q({ libera: null, vuote: 3 }))
uguale('piazzole libere ma niente 💎: aspetta i 💎, e il campo corre', [senza.dove, senza.aspetta], [BERSAGLI.monete, true])
const attesa = guidaDiArena(q({ costruita: true, caserme: [caserma(3, { puoi: false, attesa: true })] }))
uguale('la caserma nuova e i 💎 che mancano per ⬆️: aspetta i 💎', [attesa.dove, attesa.aspetta], [BERSAGLI.monete, true])
const riposo = guidaDiArena(q({ costruita: true, caserme: [caserma(3, { puoi: false, riposa: true })] }))
uguale('un conto sbagliato al potenziamento: aspetta sulla caserma, e il campo corre', [riposo.dove, riposo.aspetta, !!riposo.fine], [BERSAGLI.piazzola(3), true, false])

/* ── la fine ── */
const fine = guidaDiArena(q({ costruita: true, potenziata: true, caserme: [caserma(3)] }))
uguale('costruita e potenziata: il passo finale, senza anello', [fine.fine, fine.dove], [true, null])
controlla('una caserma che non sale più (o non al livello 1): finisce dopo la caserma', guidaDiArena(q({ costruita: true, caserme: [caserma(3, { puoi: false })] })).fine === true)
controlla('la battaglia infinita non promette un tempo', !/tempo/.test(guidaDiArena(q({ costruita: true, potenziata: true, infinita: true })).testo))

const tutti = [q(), q({ scelta: ['scheletri'] }), q({ costruita: true, caserme: [caserma(0)] }), q({ costruita: true, anello: 0, caserme: [caserma(0)] }),
               q({ costruita: true, caserme: [caserma(0, { puoi: false, riposa: true })] }), q({ costruita: true, potenziata: true })]
controlla('ogni passo ha un testo corto (si legge a 7 anni)', tutti.every(x => guidaDiArena(x).testo.length <= 90))

riassunto('la guida di Castle Battle')
