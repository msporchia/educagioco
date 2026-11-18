/* GLI ASTEROIDI LIMITATI DA FUORI

   A scuola MathGame riceve `limite` (`{ tabelline: [9] }`) e gioca una tappa finta: solo quelle tabelline, tutti e dieci
   i fatti, il bersaglio che non arriva mai (niente nave madre, hangar, stella). Senza limite la tappa finta non c'è e
   casa resta com'è. Vedi docs/asteroidi/scuola.md.
   `node test/esegui.mjs asteroidi-limite --niente-build` */
import { tappaDelLimite, tabellineDel } from '../../src/motore/asteroidi/limite.js'
import { chiaviDelle, leggi } from '../../src/store/tabelline.js'
import { createPicker } from '../../src/store/srs.js'
import { fattoriDi } from '../../src/data/tabelline.js'
import { cieloDi } from '../../src/data/asteroidi.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

console.log('\nSENZA LIMITE: CASA')
for (const [cosa, l] of [['null', null], ['niente', undefined], ['vuoto', {}], ['nessuna tabellina', { tabelline: [] }],
  ['fuori dalle dieci', { tabelline: [0, 11, 2.5, '9'] }]]) controlla(`${cosa}: nessuna tappa finta`, tappaDelLimite(l) === null)

console.log('\nLA TABELLINA DEL 9')
{
  const v = tappaDelLimite({ tabelline: [9] })
  uguale('è un pianeta (il gioco non chiede conti a mente)', v.tipo, 'pianeta')
  stessaLista('solo il 9', v.T.tabelle, [9])
  uguale('il bersaglio non arriva mai: niente nave madre né premi', v.T.bersaglio, Infinity)
  uguale('niente centri «mirati»', v.T.mirate, 0)
  uguale('niente tabellina nuova (il pool non fa il cuore di chi comincia)', v.T.nuova, null)
  uguale('il cielo del pianeta del 9', cieloDi(v), 'marte')
  const chiavi = chiaviDelle(v.T.tabelle)
  uguale('dieci fatti', chiavi.length, 10)
  controlla('tutti col 9 dentro', chiavi.every(k => fattoriDi(k).includes(9)))
  stessaLista('dal per 1 al per 10', chiavi.map(k => fattoriDi(k).find(n => n !== 9) ?? 9).sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  // il pool è tutto: il picker di MathGame (tre giuste di fila e il fatto riposa) li fa uscire tutti, e nient'altro
  const picker = createPicker({ getItem: k => leggi({}, k), useTime: true, pausaDopo: 3 })
  const usciti = new Set()
  for (let i = 0; i < 200; i++) { const k = picker.pick(chiavi); usciti.add(k); picker.afterAnswer(k, true) }
  uguale('in una partita escono tutti e dieci', usciti.size, 10)
  controlla('e solo quelli', [...usciti].every(k => chiavi.includes(k)))
}

console.log('\nPIÙ TABELLINE')
{
  stessaLista('in ordine e senza doppioni', tabellineDel({ tabelline: [7, 3, 7] }), [3, 7])
  const v = tappaDelLimite({ tabelline: [7, 3] })
  uguale('il cielo della più alta', cieloDi(v), cieloDi({ tipo: 'pianeta', i: 6 }))
  uguale('3 × 7 è un fatto solo: diciannove', chiaviDelle(v.T.tabelle).length, 19)
  uguale('la tabellina dell\'1 non ha pianeta: il cielo di partenza', cieloDi(tappaDelLimite({ tabelline: [1] })), 'cintura')
}

riassunto('gli Asteroidi limitati')
