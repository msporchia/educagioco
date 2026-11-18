/* IL ROBOT A SCUOLA

   La maestra sceglie i capitoli (`{ tipo: 'robot', capitoli: ['cantiere'] }`), il gioco riceve `limite` e gioca in fila
   i loro livelli, finiti ricomincia; gli aiuti sono solo i gradini gratis che fanno ragionare; ogni esecuzione è una
   risposta raccontata in 40 caratteri. Senza limite la fila non c'è e casa resta com'è. Vedi docs/costruttore/scuola.md.
   `node test/esegui.mjs costruttore-scuola --niente-build` */
import scheda, { CAPITOLI_ROBOT } from '../../src/scuola/giochi/robot/scheda.js'
import { valido as validoCatalogo, descrivi as descriviCatalogo, giocoDi, giochiPer, CATALOGO }
  from '../../src/scuola/comune/esercizi.js'
import { filaDelLimite, capitoliDel, dopo, scalaDelLimite, raccontaEsecuzione, LUNGO }
  from '../../src/giochi/costruttore/motore/limite.js'
import { LIVELLI, CAPITOLI } from '../../src/giochi/costruttore/dati/livelli.js'
import { scalaDi } from '../../src/giochi/costruttore/motore/aiuti.js'
import { provaOrdine } from '../../src/giochi/costruttore/motore/prova.js'
import { RAGIONA, scrive } from '../../src/giochi/aiuti.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const { valido, descrivi } = scheda.tipo
const e = capitoli => ({ tipo: 'robot', capitoli })

console.log('\nLA FORMA DELL\'ESERCIZIO')
{
  uguale('la scheda è pronta (la maestra la vede)', scheda.pronto, undefined)
  uguale('il tipo ha l\'id del gioco', scheda.tipo.id, 'robot')
  uguale('nella materia dei giochi di programmare', scheda.tipo.materia, 'programmazione')
  controlla('l\'esercizio di partenza è valido', valido(scheda.tipo.voce.base))
  controlla('ogni capitolo da solo è valido', CAPITOLI.every(c => valido(e([c.chiave]))))
  controlla('tutti insieme è valido', valido(e(CAPITOLI.map(c => c.chiave))))
  uguale('l\'editor conosce tutti i capitoli, coi loro livelli', CAPITOLI_ROBOT.reduce((n, c) => n + c.livelli, 0), LIVELLI.length)
  for (const [cosa, x] of [
    ['null', null], ['una lista', ['cantiere']], ['una stringa', 'robot'], ['un altro tipo', { tipo: 'tabelline', capitoli: ['cantiere'] }],
    ['senza capitoli', { tipo: 'robot' }], ['capitoli vuoti', e([])], ['capitoli non lista', e('cantiere')],
    ['un capitolo che non esiste', e(['cantiere', 'luna'])], ['un doppione', e(['cantiere', 'cantiere'])],
    ['non in ordine', e(['progetti', 'cantiere'])], ['un numero', e([1])], ['un oggetto', e([{ chiave: 'cantiere' }])],
    ['una chiave in più', { tipo: 'robot', capitoli: ['cantiere'], livelli: [0] }],
    ['un prototipo', e(['__proto__'])], ['il nome invece della chiave', e(['Il cantiere'])],
  ]) {
    controlla(`storto (${cosa}): non valido`, valido(x) === false)
    controlla(`storto (${cosa}): non valido neanche nel catalogo`, validoCatalogo(x) === false)
  }
}

console.log('\nNEL CATALOGO DELLA MAESTRA')
{
  const voce = CATALOGO.materie.flatMap(m => m.voci).find(v => v.tipo === 'robot')
  controlla('c\'è la voce del Robot', !!voce)
  uguale('fra le cose da programmare', CATALOGO.materie.find(m => m.voci.includes(voce))?.id, 'programmazione')
  uguale('la voce ha l\'icona del gioco', voce.icona, '🤖')
  const base = e(['cantiere'])
  controlla('valido anche nel catalogo', validoCatalogo(base))
  uguale('si fa nel Robot, anche senza il campo «gioco»', giocoDi(base), 'robot')
  stessaLista('e solo lì (niente schede come ripiego)', giochiPer(base).map(g => g.id), ['robot'])
  controlla('col campo «gioco» giusto resta valido', validoCatalogo({ ...base, gioco: 'robot' }))
  controlla('in un altro gioco no', !validoCatalogo({ ...base, gioco: 'asteroidi' }) && !validoCatalogo({ ...base, gioco: 'schede' }))
  controlla('dentro un insieme no', !validoCatalogo({ tipo: 'insieme', parti: [{ esercizio: base, peso: 'normale' },
    { esercizio: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto' }, peso: 'normale' }] }))
}

console.log('\nDESCRIVI')
{
  uguale('un capitolo', descrivi(e(['cantiere'])), 'Il Robot · il cantiere · 6 livelli')
  uguale('due, uno col nome che ha una «e»', descrivi(e(['cantiere', 'guardare'])), 'Il Robot · il cantiere e «guardare e decidere» · 11 livelli')
  uguale('tre', descrivi(e(['progetti', 'lavagnette', 'pile'])), 'Il Robot · i progetti, le lavagnette e le pile · 14 livelli')
  uguale('dal catalogo è la stessa frase', descriviCatalogo(e(['cantiere'])), descrivi(e(['cantiere'])))
  uguale('uno storto', descrivi(e(['luna'])), 'Esercizio non valido')
}

console.log('\nSENZA LIMITE: CASA')
for (const [cosa, l] of [['null', null], ['niente', undefined], ['vuoto', {}], ['nessun capitolo', { capitoli: [] }],
  ['capitoli che non esistono', { capitoli: ['luna', 3] }]]) controlla(`${cosa}: nessuna fila`, filaDelLimite(l) === null)

console.log('\nLA FILA DEI CAPITOLI SCELTI')
{
  const cantiere = filaDelLimite({ capitoli: ['cantiere'] })
  stessaLista('il cantiere: i suoi livelli, in ordine', cantiere.map(i => LIVELLI[i].chiave),
    LIVELLI.filter(l => l.capitolo === 'cantiere').map(l => l.chiave))
  uguale('si parte dal primo muretto', LIVELLI[cantiere[0]].chiave, 'primo-muretto')
  stessaLista('i capitoli nell\'ordine della campagna, comunque arrivino', capitoliDel({ capitoli: ['pile', 'cantiere'] }), ['cantiere', 'pile'])
  const due = filaDelLimite({ capitoli: ['pile', 'cantiere'] })
  controlla('due capitoli: la fila sale sempre', due.every((n, k) => k === 0 || n > due[k - 1]))
  controlla('e ha solo i loro livelli', due.every(i => ['cantiere', 'pile'].includes(LIVELLI[i].capitolo)))
  uguale('tutti i capitoli: tutti i livelli', filaDelLimite({ capitoli: CAPITOLI.map(c => c.chiave) }).length, LIVELLI.length)
  controlla('nessun livello del limite è il cantiere libero', due.every(i => !LIVELLI[i].libero))

  // il giro: dal primo, livello dopo livello, e finita la fila si ricomincia
  let i = cantiere[0]
  const visti = [i]
  for (let k = 1; k < cantiere.length; k++) {
    const d = dopo(cantiere, i)
    controlla(`dopo il ${k}° non si ricomincia ancora`, !d.daCapo)
    i = d.indice
    visti.push(i)
  }
  stessaLista('il giro passa per tutti, una volta', visti, cantiere)
  const fine = dopo(cantiere, i)
  controlla('dopo l\'ultimo si ricomincia dal primo', fine.daCapo && fine.indice === cantiere[0])
  const solo = filaDelLimite({ capitoli: ['posti'] })
  uguale('un capitolo di due livelli: dopo il secondo, il primo', dopo(solo, solo[1]).indice, solo[0])
}

console.log('\nGLI AIUTI: GRATIS QUELLI CHE FANNO RAGIONARE, GLI ALTRI SPENTI')
for (const l of LIVELLI) {
  const intera = scalaDi(l)
  const s = scalaDelLimite(intera)
  controlla(`«${l.nome}»: solo i gradini che fanno ragionare, tutti gratis`,
    s.length === l.ragiona.length && s.every(p => p.che === RAGIONA && p.prezzo === 0 && !scrive(p)), JSON.stringify(s.map(p => [p.che, p.prezzo])))
  controlla(`«${l.nome}»: gli stessi di casa, nello stesso posto (i gradini presi si contano uguali)`,
    s.every((p, k) => intera[k] === p))
}

console.log('\nLA RISPOSTA: UN\'ESECUZIONE ARRIVATA IN FONDO')
{
  // l'esito come lo dà la regia alla fine: il primo ordine che cade, o vinto sull'ultimo
  const esegui = (l, programma) => {
    for (let k = 0; k < l.ordini.length; k++) {
      const r = provaOrdine(l, k, programma)
      if (r.esito !== 'vinto') return { vinto: false, ordine: k, errore: r.errore, confronto: r.confronto, omino: r.omino, giornata: r.giornata }
    }
    return { vinto: true, ordine: l.ordini.length - 1 }
  }
  const corto = (dove, r) => {
    for (const k of ['fatto', 'data', 'attesa'])
      controlla(`${dove}: ${k} fra 1 e ${LUNGO} caratteri`, typeof r[k] === 'string' && r[k].length > 0 && r[k].length <= LUNGO, JSON.stringify(r))
  }
  let perse = 0
  for (const l of LIVELLI) {
    const v = raccontaEsecuzione(l, esegui(l, l.soluzione))
    corto(`«${l.nome}» vinto`, v)
    controlla(`«${l.nome}» vinto: giusta e chiude il livello`, v.giusta === true && v.ultima === true)
    uguale(`«${l.nome}»: la chiave dice il livello`, v.chiave, `robot:${l.chiave}`)
    uguale(`«${l.nome}» vinto: ha fatto quello che si chiedeva`, v.data, v.attesa)
    for (const f of l.fragili || []) {
      const es = esegui(l, f.programma)
      if (es.vinto) continue
      const r = raccontaEsecuzione(l, es)
      corto(`«${l.nome}», «${f.nome}»`, r)
      controlla(`«${l.nome}», «${f.nome}»: sbagliata e il livello resta aperto`, r.giusta === false && r.ultima === false)
      controlla(`«${l.nome}», «${f.nome}»: dice cosa è successo, non quello che si chiedeva`, r.data !== r.attesa, r.data)
      perse++
    }
  }
  controlla('le mosse ingenue raccontate sono tante', perse > 50, perse)
  const muretto = LIVELLI.find(l => l.chiave === 'primo-muretto')
  const r = raccontaEsecuzione(muretto, { vinto: false, ordine: 0, confronto: { mancano: [1, 2], troppi: [], sbagliati: [] } })
  uguale('il muretto con due mattoni in meno', r.data, 'mancano 2 mattoni')
  uguale('e cosa si chiedeva', r.attesa, 'il disegno')
}

riassunto('il Robot a scuola')
