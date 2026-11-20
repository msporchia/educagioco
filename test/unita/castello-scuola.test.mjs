/* DIFENDI IL CASTELLO A SCUOLA

   La maestra sceglie una tappa del regno (`{ tipo: 'castello', tappa: 'bosco/Il sentiero' }`), il gioco riceve `limite`
   e parte in quella tappa; ogni operazione in colonna è una risposta raccontata in 40 caratteri. Senza limite nessuna
   tappa e casa resta com'è. Vedi docs/castello/scuola.md.
   `node test/esegui.mjs castello-scuola --niente-build` */
import scheda, { TAPPE_CASTELLO, CAMPAGNE_CASTELLO, ESEMPI, tappaCastello } from '../../src/scuola/giochi/castello/scheda.js'
import { valido as validoCatalogo, descrivi as descriviCatalogo, giocoDi, giochiPer, CATALOGO }
  from '../../src/scuola/comune/esercizi.js'
import { tappaDelLimite, cuoriDelLimite, CUORI_SCUOLA, raccontaConto, LUNGO } from '../../src/views/castello/limite.js'
import { TAPPE, chiaveTappa, CFG } from '../../src/data/castello.js'
import { Tabellone } from '../../src/motore/castello/tabellone.js'
import { difficoltaDi, valido as validoEsercizio } from '../../src/scuola/comune/esercizi.js'
import { GENERATORI, contoDi, gradoDi } from '../../src/data/ops.js'
import { GIOCHI as GIOCHI_DI_CASA } from '../../src/data/giochi.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const { valido, descrivi } = scheda.tipo
const e = tappa => ({ tipo: 'castello', tappa })

console.log('\nLA FORMA DELL\'ESERCIZIO')
{
  uguale('la scheda è pronta (la maestra la vede)', scheda.pronto, undefined)
  uguale('il tipo ha l\'id del gioco', scheda.tipo.id, 'castello')
  uguale('nella matematica', scheda.tipo.materia, 'matematica')
  controlla('l\'esercizio di partenza è valido', valido(scheda.tipo.voce.base))
  stessaLista('le tappe dell\'editor sono quelle del regno, in ordine, con la chiave delle vite tarate',
    TAPPE_CASTELLO.map(t => t.chiave), TAPPE.map(chiaveTappa))
  controlla('con le loro operazioni e il loro gradino massimo', TAPPE_CASTELLO.every((t, i) =>
    t.cap === TAPPE[i].cap && t.calcoli === TAPPE[i].calcoli && t.torri.join() === TAPPE[i].torri.join()))
  uguale('le campagne le contengono tutte', CAMPAGNE_CASTELLO.reduce((n, c) => n + c.tappe.length, 0), TAPPE.length)
  controlla('ogni tappa da sola è valida', TAPPE_CASTELLO.every(t => valido(e(t.chiave)) && validoCatalogo(e(t.chiave))))
  for (const [cosa, x] of [
    ['null', null], ['una lista', ['bosco/Il sentiero']], ['una stringa', 'castello'],
    ['un altro tipo', { tipo: 'robot', tappa: 'bosco/Il sentiero' }], ['senza tappa', { tipo: 'castello' }],
    ['una tappa che non c\'è', e('bosco/La luna')], ['il nome senza campagna', e('Il sentiero')],
    ['l\'indice', e(0)], ['un oggetto', e({ chiave: 'bosco/Il sentiero' })], ['un prototipo', e('__proto__')],
    ['una chiave in più', { tipo: 'castello', tappa: 'bosco/Il sentiero', torri: ['div'] }],
    ['una partita libera', e('libera-bosco')],
  ]) {
    controlla(`storto (${cosa}): non valido`, valido(x) === false)
    controlla(`storto (${cosa}): non valido neanche nel catalogo`, validoCatalogo(x) === false)
  }
}

console.log('\nNEL CATALOGO DELLA MAESTRA')
{
  const voce = CATALOGO.materie.flatMap(m => m.voci).find(v => v.tipo === 'castello')
  controlla('c\'è la voce del castello', !!voce)
  uguale('in matematica', CATALOGO.materie.find(m => m.voci.includes(voce))?.id, 'matematica')
  uguale('con l\'icona del gioco', voce.icona, GIOCHI_DI_CASA.find(g => g.chiave === 'torri').ico)
  const base = e('bosco/Il sentiero')
  uguale('si fa nel castello, anche senza il campo «gioco»', giocoDi(base), 'castello')
  stessaLista('e solo lì (niente schede come ripiego)', giochiPer(base).map(g => g.id), ['castello'])
  controlla('in un altro gioco no', !validoCatalogo({ ...base, gioco: 'asteroidi' }) && !validoCatalogo({ ...base, gioco: 'schede' }))
  controlla('dentro un insieme no', !validoCatalogo({ tipo: 'insieme', parti: [{ esercizio: base, peso: 'normale' },
    { esercizio: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto' }, peso: 'normale' }] }))
}

console.log('\nDESCRIVI')
{
  uguale('il sentiero', descrivi(e('bosco/Il sentiero')), 'Difendi il castello · Il sentiero · addizioni')
  uguale('il guado del bosco', descrivi(e('bosco/Il guado')), 'Difendi il castello · Il guado (il bosco) · addizioni e sottrazioni')
  uguale('il folto', descrivi(e('bosco/Il folto')), 'Difendi il castello · Il folto · addizioni, sottrazioni e moltiplicazioni')
  uguale('la foce', descrivi(e('palude/La foce')), 'Difendi il castello · La foce · le quattro operazioni')
  uguale('dal catalogo è la stessa frase', descriviCatalogo(e('mura/Il cortile')), descrivi(e('mura/Il cortile')))
  uguale('uno storto', descrivi(e('bosco/La luna')), 'Esercizio non valido')
  stessaLista('per la maestra, fin dove sale', tappaCastello('bosco/Il guado').fino, ['addizioni fino a 247+185', 'sottrazioni fino a 850−75'])
}

console.log('\nGLI ESEMPI SONO LA SCALETTA')
{
  // un esempio ha le stesse cifre, numero per numero, di quello che il generatore dà a quel gradino
  const forma = s => s.split(/[+−×:]/).map(n => n.length).join(',')
  const formaOp = o => (o.numeri || [o.a, o.b]).map(n => String(n).length).join(',')
  for (const [k, esempi] of Object.entries(ESEMPI)) {
    uguale(`${k}: un esempio per gradino`, esempi.length, 10)
    const storti = esempi.flatMap((s, g) => Array.from({ length: 40 }, () => GENERATORI[k](g + 1, 2 + (g % 8)))
      .filter(o => formaOp(o) !== forma(s)).map(o => `${g + 1}: ${s} contro ${formaOp(o)}`)).slice(0, 3)
    controlla(`${k}: ogni esempio ha la forma del suo gradino`, !storti.length, storti.join('; '))
  }
}

console.log('\nSENZA LIMITE: CASA')
for (const [cosa, l] of [['null', null], ['niente', undefined], ['vuoto', {}], ['una stringa', 'bosco/Il sentiero'],
  ['una tappa che non c\'è', { tappa: 'bosco/La luna' }], ['un numero', { tappa: 3 }]]) {
  controlla(`${cosa}: nessuna tappa`, tappaDelLimite(l) === null)
}

console.log('\nLA TAPPA DEL LIMITE')
{
  controlla('ogni tappa scelta è la sua, nella fila del regno', TAPPE.every((t, i) => tappaDelLimite({ tappa: chiaveTappa(t) }) === i))
  uguale('il sentiero è la prima (indice 0, non «niente»)', tappaDelLimite({ tappa: 'bosco/Il sentiero' }), 0)
  controlla('i due guadi sono due tappe', tappaDelLimite({ tappa: 'bosco/Il guado' }) !== tappaDelLimite({ tappa: 'palude/Il guado' }))
  // il profilo della scuola ha tutti i saperi accesi: la torre chiede la sua operazione, al suo gradino
  const tutti = { div: true, mul: true }
  controlla('a scuola nessun ripiego', ['add', 'sub', 'mul', 'div'].every(k => contoDi(k, tutti) === k && gradoDi(k, 7, tutti) === 7))
}

console.log('\nLA RISPOSTA DI UN CONTO')
{
  const add = { tipo: 'add', numeri: [247, 185], a: 247, b: 185, segno: '+', risultato: 432 }
  stessaLista('senza errori', raccontaConto(add, 'op:add', { errori: 0, ms: 4210.6 }),
    { chiave: 'op:add', giusta: true, ms: 4211, ultima: true, fatto: '247+185', data: '432', attesa: '432' })
  const sbagliata = raccontaConto(add, 'op:add', { errori: 2, ms: 9000 })
  controlla('con due errori è sbagliata, e la domanda si chiude lo stesso', !sbagliata.giusta && sbagliata.ultima === true)
  uguale('il dato dice quanti errori', sbagliata.data, '432 · 2 errori')
  uguale('uno solo', raccontaConto(add, 'op:add', { errori: 1 }).data, '432 · 1 errore')
  uguale('tre addendi', raccontaConto({ ...add, numeri: [247, 185, 96], risultato: 528 }, 'op:add').fatto, '247+185+96')
  const div = { tipo: 'div', a: 645, b: 2, segno: ':', risultato: 322, resto: 1 }
  uguale('la divisione col resto', raccontaConto(div, 'op:div').attesa, '322 resto 1')
  uguale('quella esatta', raccontaConto({ tipo: 'div', a: 72, b: 4, segno: ':', risultato: 18, resto: 0 }, 'op:div').attesa, '18')
  uguale('la sottrazione', raccontaConto({ tipo: 'sub', a: 850, b: 75, segno: '−', risultato: 775 }, 'op:sub').fatto, '850−75')
  // ogni gradino di ogni operazione, coi suoi numeri più lunghi, sta nei 40 caratteri
  const lunghi = []
  for (const k of Object.keys(GENERATORI)) {
    for (let g = 1; g <= 10; g++) {
      for (let n = 0; n < 20; n++) {
        const o = GENERATORI[k](g, 9)
        const r = raccontaConto(o, `op:${k}`, { errori: 12, ms: 1 })
        if ([r.fatto, r.data, r.attesa].some(s => s.length > LUNGO) || !r.fatto.includes(o.segno)) lunghi.push(`${k}${g} ${r.fatto}`)
        if (r.attesa !== (k === 'div' && o.resto ? `${o.risultato} resto ${o.resto}` : String(o.risultato))) lunghi.push(`${k}${g} attesa ${r.attesa}`)
      }
    }
  }
  controlla('ogni conto di ogni gradino si racconta nei 40 caratteri, col risultato giusto', !lunghi.length, lunghi.slice(0, 3).join('; '))
}

console.log('\nLA DIFFICOLTÀ')
{
  const t = 'bosco/Il sentiero'
  controlla('la scheda la dichiara, con le due frasi', !!scheda.difficolta?.facile && !!scheda.difficolta?.difficile)
  controlla('Facile e Difficile sono esercizi validi nel catalogo, Normale non si scrive',
    validoEsercizio({ ...e(t), difficolta: 'facile' }) && validoEsercizio({ ...e(t), difficolta: 'difficile' })
    && difficoltaDi(e(t)) === 'normale')
  uguale('Normale (senza difficoltà) lascia i cuori di casa', cuoriDelLimite({ tappa: t }), null)
  uguale('Normale scritto come undefined: uguale', cuoriDelLimite({ tappa: t, difficolta: undefined }), null)
  uguale('Facile: più cuori di casa', cuoriDelLimite({ tappa: t, difficolta: 'facile' }), 8)
  uguale('Difficile: meno cuori di casa', cuoriDelLimite({ tappa: t, difficolta: 'difficile' }), 3)
  controlla('Facile > casa > Difficile', CUORI_SCUOLA.facile > CFG.cuori && CFG.cuori > CUORI_SCUOLA.difficile)
  uguale('a casa (senza limite) niente cuori diversi', cuoriDelLimite(null), null)
  uguale('con una tappa che non c\'è niente', cuoriDelLimite({ tappa: 'bosco/La luna', difficolta: 'facile' }), null)
  const cuori = c => { const s = {}; new Tabellone(s).azzera(40, c); return s.cuori }
  uguale('il tabellone senza cuori dati parte da quelli di casa', cuori(undefined), CFG.cuori)
  uguale('il tabellone con 8 cuori', cuori(8), 8)
}

riassunto('il castello a scuola')
