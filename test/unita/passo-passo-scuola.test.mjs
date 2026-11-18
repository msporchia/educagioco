/* PASSO PASSO A SCUOLA

   La maestra sceglie il protagonista e i gradini (la scheda: `valido`, `descrivi`, e le sue liste uguali alle strade
   della campagna); il gioco col `limite` gioca quei livelli in giro, col 💡 solo nei gradini gratis, e racconta ogni ▶
   in testi da 40. Senza limite il giro non c'è: casa. Vedi docs/passo-passo/scuola.md.
   `node test/esegui.mjs passo-passo-scuola --niente-build` */
import { CAMPAGNA, SCALINI } from '../../src/giochi/passo-passo/dati/campagna.js'
import { STRADE } from '../../src/giochi/passo-passo/motore/strade.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { esegui, TANA, FINITA, SBATTE } from '../../src/giochi/passo-passo/motore/mondo.js'
import { tappeDelLimite, dopoNelGiro, scalaAScuola, attesaDi, dataDi, soluzioneDi, PROTAGONISTI, LUNGO }
  from '../../src/giochi/passo-passo/motore/limite.js'
import { guastiDellaScala, RAGIONA } from '../../src/giochi/aiuti.js'
import scheda, { GRADINI, PROTAGONISTI as SCELTE } from '../../src/scuola/giochi/passo-passo/scheda.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const { valido, descrivi } = scheda.tipo

console.log('\nSENZA LIMITE: CASA')
for (const [cosa, l] of [['null', null], ['niente', undefined], ['vuoto', {}], ['nessun gradino', { protagonista: 'coniglio', gradini: [] }],
  ['un protagonista che non c\'è', { protagonista: 'gatto', gradini: ['passi'] }],
  ['gradini di un altro', { protagonista: 'guerriero', gradini: ['ghiaccio'] }]])
  controlla(`${cosa}: nessun giro`, tappeDelLimite(l) === null)

console.log('\nLA SCHEDA È LA CAMPAGNA')
stessaLista('i protagonisti', SCELTE.map(p => p.id), PROTAGONISTI)
for (const p of PROTAGONISTI) {
  const scalini = [...new Set(STRADE[p].map(i => CAMPAGNA[i].scalino))]
  stessaLista(`${p}: i gradini della sua strada, in ordine`, GRADINI[p].map(g => g.chiave), scalini)
  for (const g of GRADINI[p]) {
    uguale(`${p} · ${g.chiave}: i livelli`, g.livelli, STRADE[p].filter(i => CAMPAGNA[i].scalino === g.chiave).length)
    uguale(`${p} · ${g.chiave}: l'icona del gioco`, g.icona, SCALINI.find(s => s.chiave === g.chiave).icona)
  }
}

console.log('\nVALIDO, ANCHE CONTRO UN LINK MANOMESSO')
const base = scheda.tipo.voce.base
controlla('la base è valida', valido(base))
uguale('la base è col coniglio', base.protagonista, 'coniglio')
controlla('il ghiaccio e le buche col coniglio', valido({ tipo: 'passo', protagonista: 'coniglio', gradini: ['ghiaccio', 'buche'] }))
controlla('il ripeti col cane', valido({ tipo: 'passo', protagonista: 'cane', gradini: ['ripeti'] }))
controlla('tutti i gradini del guerriero', valido({ tipo: 'passo', protagonista: 'guerriero', gradini: GRADINI.guerriero.map(g => g.chiave) }))
for (const [cosa, e] of [
  ['null', null], ['una lista', []], ['una stringa', 'passo'], ['un numero', 3],
  ['un altro tipo', { tipo: 'tabelline', protagonista: 'coniglio', gradini: ['passi'] }],
  ['una chiave in più', { ...base, livelli: [0] }],
  ['il campo gioco (lo toglie il catalogo prima)', { ...base, gioco: 'passo-passo' }],
  ['senza protagonista', { tipo: 'passo', gradini: ['passi'] }],
  ['un protagonista che non c\'è', { ...base, protagonista: 'gatto' }],
  ['un protagonista dal prototipo', { ...base, protagonista: 'toString' }],
  ['un protagonista non stringa', { ...base, protagonista: ['coniglio'] }],
  ['senza gradini', { tipo: 'passo', protagonista: 'coniglio' }],
  ['gradini vuoti', { ...base, gradini: [] }],
  ['gradini doppi', { ...base, gradini: ['passi', 'passi'] }],
  ['un gradino che non c\'è', { ...base, gradini: ['lava'] }],
  ['un gradino non stringa', { ...base, gradini: [1] }],
  ['gradini come stringa', { ...base, gradini: 'passi' }],
  ['le pecore col coniglio', { ...base, gradini: ['pecore'] }],
  ['i primi passi col cane', { tipo: 'passo', protagonista: 'cane', gradini: ['passi'] }],
  ['il ripeti col guerriero', { tipo: 'passo', protagonista: 'guerriero', gradini: ['ripeti'] }],
]) controlla(`no: ${cosa}`, valido(e) === false)

console.log('\nDESCRIVI')
uguale('due gradini', descrivi({ tipo: 'passo', protagonista: 'coniglio', gradini: ['buche', 'ghiaccio'] }),
  'Passo passo · il ghiaccio e le buche · col coniglio')
uguale('tre gradini', descrivi({ tipo: 'passo', protagonista: 'cane', gradini: ['se', 'ripeti', 'fino'] }),
  'Passo passo · ripeti N volte, ripeti fino a e il se · col cane')
uguale('tutti', descrivi({ tipo: 'passo', protagonista: 'guerriero', gradini: GRADINI.guerriero.map(g => g.chiave) }),
  'Passo passo · tutti i livelli · col guerriero')

console.log('\nIL GIRO')
{
  const giro = tappeDelLimite({ protagonista: 'coniglio', gradini: ['buche', 'ghiaccio'] })
  uguale('il ghiaccio e le buche: nove livelli', giro.length, 9)
  controlla('solo di quei gradini', giro.every(i => ['ghiaccio', 'buche'].includes(CAMPAGNA[i].scalino)))
  stessaLista('nell\'ordine della strada, dal più facile', giro, STRADE.coniglio.filter(i => giro.includes(i)))
  uguale('il primo è il laghetto', CAMPAGNA[giro[0]].chiave, 'laghetto')
  uguale('dopo il laghetto il sasso che frena', CAMPAGNA[dopoNelGiro(giro, giro[0])].chiave, 'freno')
  uguale('finito l\'ultimo si ricomincia', dopoNelGiro(giro, giro.at(-1)), giro[0])
  stessaLista('l\'ordine dei gradini scelti non conta', tappeDelLimite({ protagonista: 'coniglio', gradini: ['ghiaccio', 'buche'] }), giro)
  const cane = tappeDelLimite({ protagonista: 'cane', gradini: ['ripeti'] })
  controlla('il ripeti col cane: solo le tappe del cane', cane.length === 6 && cane.every(i => STRADE.animale[i] === 'cane'))
  stessaLista('…nell\'ordine della sua strada', cane, STRADE.cane.filter(i => cane.includes(i)))
  for (const p of PROTAGONISTI) {
    const tutti = tappeDelLimite({ protagonista: p, gradini: GRADINI[p].map(g => g.chiave) })
    stessaLista(`${p}: tutti i gradini sono tutta la sua strada`, tutti, STRADE[p])
  }
}

console.log('\nIL 💡 A SCUOLA')
{
  const scala = scalaAScuola()
  controlla('solo i gradini che fanno ragionare', scala.length > 0 && scala.every(p => p.che === RAGIONA))
  controlla('tutti gratis', scala.every(p => p.prezzo === 0))
  stessaLista('cosa chiede il posto, poi dove la fila sbaglia', scala.map(p => p.cosa), ['pensa', 'dove'])
  stessaLista('una scala buona', guastiDellaScala(scala, 'a scuola'), [])
}

console.log('\nI RACCONTI PER LA MAESTRA')
{
  const lunghi = [], perdenti = [], date = []
  for (const t of CAMPAGNA) {
    const liv = Livello.da(t)
    const a = attesaDi(liv)
    if (a.length > LUNGO || `passo:${t.chiave}`.length > LUNGO || t.nome.length > LUNGO) lunghi.push(t.chiave)
    const sol = soluzioneDi(liv)
    const r = esegui(liv, sol, { eventi: false })
    if (r.esito !== TANA) perdenti.push(t.chiave)
    const d = dataDi(liv, sol, r)
    if (d.length > LUNGO) lunghi.push(t.chiave + ' (data)')
    date.push(d)
  }
  controlla('chiave, nome, attesa e data stanno nei 40', !lunghi.length, lunghi.join(', '))
  controlla('la soluzione detta vince', !perdenti.length, perdenti.join(', '))
  const prato = Livello.da(CAMPAGNA[0])
  uguale('il prato: la soluzione', attesaDi(prato), '3 frecce: →→→')
  uguale('il prato vinto', dataDi(prato, ['destra', 'destra', 'destra'], esegui(prato, ['destra', 'destra', 'destra'])), 'a casa con la carota · 3 frecce')
  const sbatte = esegui(prato, ['destra', 'destra', 'giu'])
  uguale('il prato, contro il cespuglio', sbatte.esito, SBATTE)
  uguale('…e com\'è andata', dataDi(prato, ['destra', 'destra', 'giu'], sbatte), 'sbatte alla 3ª freccia')
  const corta = esegui(prato, ['destra'])
  uguale('il prato, una freccia sola', corta.esito, FINITA)
  uguale('…si ferma prima', dataDi(prato, ['destra'], corta), 'si ferma prima · 1 freccia')
  const zaino = Livello.da(CAMPAGNA.find(t => t.chiave === 'viale'))
  controlla('con lo zaino si contano le carte', /^\d+ carte: .*🔁/.test(attesaDi(zaino)), attesaDi(zaino))
  controlla('ogni livello vinto si dice', date.every(d => /^(a casa|il gregge nel recinto|dalla principessa)/.test(d)))
}

riassunto('Passo passo a scuola')
