/* GLI ASTEROIDI LIMITATI DA FUORI

   A scuola MathGame riceve `limite` (`{ tabelline: [9] }`) e gioca una tappa finta: solo quelle tabelline, tutti e dieci
   i fatti, il bersaglio che non arriva mai (niente nave madre, hangar, stella). Senza limite la tappa finta non c'è e
   casa resta com'è. Vedi docs/asteroidi/scuola.md.
   `node test/esegui.mjs asteroidi-limite --niente-build` */
import { tappaDelLimite, tabellineDel, gruppiDel, ritoccoDifficolta, formaDel, menteDel } from '../../src/motore/asteroidi/limite.js'
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

console.log('\nA GRUPPI, CON LE LORO INTENSITÀ')
{
  // «tanto l'8, un po' di ripasso del 3, 4, 5 e 6»: quattro domande dell'8 per una del ripasso, sparse
  const v = tappaDelLimite({ gruppi: [{ tabelline: [8], volte: 4 }, { tabelline: [3, 4, 5, 6], volte: 1 }] })
  stessaLista('le tabelline in gioco sono tutte quelle dei gruppi', v.T.tabelle, [3, 4, 5, 6, 8])
  const giri = Array.from({ length: 50 }, () => v.prossime())
  uguale('in cinquanta domande, quaranta dall\'8', giri.filter(g => g.length === 1 && g[0] === 8).length, 40)
  controlla('e mai cinque dell\'8 di fila', !giri.map(g => (g[0] === 8 ? 'x' : '-')).join('').includes('xxxxx'))
  stessaLista('un gruppo storto si butta, il resto resta', gruppiDel({ gruppi: [{ tabelline: [12] }, { tabelline: [2], volte: 0 }] }),
    [{ tabelline: [2], volte: 1, modo: 'prodotto' }])
  stessaLista('la forma di prima vale un gruppo solo', gruppiDel({ tabelline: [9] }), [{ tabelline: [9], volte: 1, modo: 'prodotto' }])
}

console.log('\nIL NUMERO NASCOSTO (9 × ? = 63)')
{
  uguale('senza modo, il risultato com\'era', tappaDelLimite({ tabelline: [9] }).modo, 'prodotto')
  uguale('un modo sconosciuto vale il risultato', gruppiDel({ tabelline: [9], modo: 'boh' })[0].modo, 'prodotto')
  const v = tappaDelLimite({ gruppi: [{ tabelline: [8], volte: 1, modo: 'nascosto' }, { tabelline: [3], volte: 1, modo: 'prodotto' }] })
  const giri = Array.from({ length: 10 }, () => { const t = v.prossime(); return `${t[0]}${v.modo}` })
  controlla('il modo segue il gruppo appena uscito', giri.every(g => g === '8nascosto' || g === '3prodotto') && new Set(giri).size === 2, giri.join(' '))
  uguale('nascosto: sempre nascosto', formaDel('nascosto', 0.1), 'nascosto')
  stessaLista('misti: metà e metà', [formaDel('misti', 0.2), formaDel('misti', 0.7)], ['prodotto', 'nascosto'])
}

console.log('\nLA DIFFICOLTÀ')
{
  stessaLista('Normale, o niente, non ritocca nulla: è com\'è a casa', [ritoccoDifficolta('normale'), ritoccoDifficolta(undefined)], [{}, {}])
  const f = ritoccoDifficolta('facile'), d = ritoccoDifficolta('difficile')
  controlla('Facile: più vite e sassi più lenti (cadono in più tempo)', f.vite > 3 && f.cadutaSec > 10)
  controlla('Difficile: meno vite e sassi più veloci', d.vite < 3 && d.cadutaSec < 10)
  uguale('Facile: vite', f.vite, 4); uguale('Difficile: vite', d.vite, 2)
  controlla('le vite non passano il tetto di scorta del gioco (5)', f.vite <= 5)
  controlla('la difficoltà non cambia la tappa finta', tappaDelLimite({ tabelline: [9], difficolta: 'difficile' }).T.tabelle[0] === 9)
}

console.log('\nIL CALCOLO A MENTE')
{
  uguale('niente concetti buoni: niente calcolo', menteDel({ mente: { concetti: ['boh'] } }), null)
  const solo = tappaDelLimite({ mente: { concetti: ['somma-10', 'meno-10'] } })
  uguale('il calcolo solo è una stazione', solo.tipo, 'mente')
  stessaLista('coi concetti scelti tutti nuovi, e nient\'altro da ripassare', [solo.T.nuovi, solo.T.concetti], [['somma-10', 'meno-10'], ['somma-10', 'meno-10']])
  uguale('e il bersaglio non arriva mai', solo.T.bersaglio, Infinity)
  uguale('ogni domanda è a mente', solo.prossimoMestiere(), 'mente')
  const misto = tappaDelLimite({ gruppi: [{ tabelline: [7], volte: 4 }], mente: { concetti: ['somma-20'], volte: 1 } })
  uguale('tabelline e calcolo: un pianeta', misto.tipo, 'pianeta')
  const giri = Array.from({ length: 50 }, () => misto.prossimoMestiere())
  uguale('che alterna: quattro tabelline per un conto a mente', giri.filter(x => x === 'mente').length, 10)
  controlla('e il conto a mente ha la sua stazione', misto.Tmente.nuovi[0] === 'somma-20')
  uguale('senza calcolo, sempre tabelline', tappaDelLimite({ tabelline: [3] }).prossimoMestiere(), 'tabelline')
}

riassunto('gli Asteroidi limitati')
