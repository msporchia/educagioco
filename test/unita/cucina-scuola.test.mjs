/* LA CUCINA A SCUOLA

   La maestra sceglie da quale a quale livello (la scheda: `valido`, `descrivi`, i livelli e i tratti della cassa uguali
   alle cucine); il gioco col `limite` gioca quei livelli in giro, e racconta alla maestra solo i resti contati dal bambino,
   in testi da 40. Senza limite il giro non c'è: casa. Vedi docs/bancarella/scuola.md.
   `node test/esegui.mjs cucina-scuola --niente-build` */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CUCINE, ricetteDi } from '../../src/data/bancarella-cucine.js'
import { tappaDi, nuovoOrdine } from '../../src/data/bancarella.js'
import { livelliDelLimite, dopoNelGiro, raccontaResto, regolaDi, REGOLE, soldi, A_SCUOLA, LUNGO } from '../../src/motore/bancarella/limite.js'
import scheda, { LIVELLI_CUCINA, TRATTI_CUCINA } from '../../src/scuola/giochi/cucina/scheda.js'
import { valido as validoCatalogo, descrivi as descriviCatalogo, giocoDi, giochiPer, CATALOGO }
  from '../../src/scuola/comune/esercizi.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const { valido, descrivi } = scheda.tipo
const RADICE = resolve(import.meta.dirname, '../..')
const e = (da, a) => ({ tipo: 'cucina', da, a })

console.log('\nSENZA LIMITE: CASA')
for (const [cosa, l] of [['null', null], ['niente', undefined], ['vuoto', {}], ['da zero', { da: 0, a: 3 }],
  ['rovesciato', { da: 5, a: 3 }], ['fino a Cinque minuti', { da: 1, a: CUCINE.length }], ['stringhe', { da: '1', a: '3' }],
  ['a metà', { da: 1.5, a: 3 }], ['senza a', { da: 2 }]])
  controlla(`${cosa}: nessun giro`, livelliDelLimite(l) === null)

console.log('\nLA SCHEDA È LE CUCINE')
uguale('i livelli da scegliere sono tutti tranne Cinque minuti', LIVELLI_CUCINA.length, CUCINE.length - 1)
uguale('lo stesso numero per il gioco', A_SCUOLA, LIVELLI_CUCINA.length)
controlla('Cinque minuti non c\'è', !LIVELLI_CUCINA.some(l => l.nome === CUCINE.at(-1).nome))
controlla('nomi e conti dalle cucine', LIVELLI_CUCINA.every((l, k) => l.nome === CUCINE[k].nome && l.conto === CUCINE[k].conto && l.n === k + 1))
controlla('ogni livello ha i suoi prezzi detti', LIVELLI_CUCINA.every(l => typeof l.prezzi === 'string'))
uguale('i tratti coprono tutti i livelli, in fila', TRATTI_CUCINA.map(t => `${t.da}-${t.a}`).join(' '), '1-6 7-12 13-15 16-19 20-22 23-25 26-28')
controlla('i tratti si toccano senza buchi', TRATTI_CUCINA.every((t, i) => i === 0 || t.da === TRATTI_CUCINA[i - 1].a + 1) &&
  TRATTI_CUCINA.at(-1).a === LIVELLI_CUCINA.length)
uguale('il primo tratto', TRATTI_CUCINA[0].nome, 'La cassa dice il resto · euro tondi')
uguale('il secondo', TRATTI_CUCINA[1].nome, 'Il resto lo conti tu · euro tondi')
controlla('l\'icona della voce è già del gioco', readFileSync(resolve(RADICE, 'src/views/BancarellaGame.vue'), 'utf8').includes(scheda.tipo.voce.icona))

console.log('\nVALIDO, ANCHE CONTRO UN LINK MANOMESSO')
const base = scheda.tipo.voce.base
controlla('la base è valida', valido(base))
controlla('i livelli 7-12', valido(e(7, 12)))
controlla('un livello solo', valido(e(28, 28)))
for (const [cosa, x] of [
  ['null', null], ['una lista', []], ['una stringa', 'cucina'], ['un numero', 3],
  ['un altro tipo', { tipo: 'passo', da: 1, a: 3 }], ['una chiave in più', { ...base, livelli: [1] }],
  ['il campo gioco (lo toglie il catalogo prima)', { ...base, gioco: 'cucina' }],
  ['senza da', { tipo: 'cucina', a: 3 }], ['senza a', { tipo: 'cucina', da: 3 }],
  ['da zero', e(0, 3)], ['negativo', e(-1, 3)], ['rovesciato', e(9, 4)], ['oltre l\'ultimo', e(1, 29)],
  ['Cinque minuti', e(29, 29)], ['stringhe', e('1', '3')], ['decimali', e(1.5, 3)], ['NaN', e(NaN, 3)],
  ['infinito', e(1, Infinity)], ['liste', e([1], [3])],
]) controlla(`no: ${cosa}`, !valido(x))

console.log('\nDESCRIVI')
uguale('i primi', descrivi(e(1, 6)), 'La cucina · livelli 1-6 · il resto lo dice la cassa')
uguale('il resto da contare', descrivi(e(7, 12)), 'La cucina · livelli 7-12 · il resto lo conti tu')
uguale('un livello', descrivi(e(7, 7)), 'La cucina · livello 7 · il resto lo conti tu')
uguale('a cavallo', descrivi(e(5, 8)), 'La cucina · livelli 5-8 · il resto lo dice la cassa, poi il resto lo conti tu')
uguale('gli ultimi', descrivi(e(20, 28)), 'La cucina · livelli 20-28 · totale e resto li conti tu')
uguale('uno storto', descrivi(e(0, 3)), 'Esercizio non valido')

console.log('\nNEL CATALOGO DELLA MAESTRA')
{
  const voce = CATALOGO.materie.flatMap(m => m.voci).find(v => v.tipo === 'cucina')
  controlla('c\'è la voce della cucina', !!voce)
  uguale('in matematica', CATALOGO.materie.find(m => m.voci.includes(voce))?.id, 'matematica')
  controlla('valido anche nel catalogo', validoCatalogo(base))
  uguale('si fa in cucina, anche senza il campo «gioco»', giocoDi(base), 'cucina')
  stessaLista('e solo lì (niente schede come ripiego)', giochiPer(base).map(g => g.id), ['cucina'])
  controlla('col campo «gioco» giusto resta valido', validoCatalogo({ ...base, gioco: 'cucina' }))
  controlla('in un altro gioco no', !validoCatalogo({ ...base, gioco: 'asteroidi' }) && !validoCatalogo({ ...base, gioco: 'schede' }))
  uguale('dal catalogo è la stessa frase', descriviCatalogo(e(7, 12)), descrivi(e(7, 12)))
}

console.log('\nIL GIRO')
stessaLista('i livelli 7-12 sono le cucine 6..11', livelliDelLimite({ da: 7, a: 12 }), [6, 7, 8, 9, 10, 11])
stessaLista('un livello solo', livelliDelLimite({ da: 3, a: 3 }), [2])
{
  const giro = livelliDelLimite({ da: 7, a: 9 })
  uguale('dopo il primo il secondo', dopoNelGiro(giro, 6), 7)
  uguale('finito l\'ultimo si ricomincia', dopoNelGiro(giro, 8), 6)
  uguale('col livello solo si rifà lo stesso', dopoNelGiro([2], 2), 2)
}

console.log('\nLA RISPOSTA ALLA MAESTRA')
{
  const c = { chiediResto: true, chiediTotale: false, paga: 1000, totale: 650, resto: 350, chiave: 'bancarella:mezzi',
              articoli: [{ prezzo: 650 }] }
  const r = raccontaResto(c, { rifiuti: 0, sbaglio: null, dato: 350, ms: 4200.4 })
  uguale('il conto', r.fatto, 'resto su 10 € per 6,50 €')
  uguale('dato', r.data, '3,50 €')
  uguale('atteso', r.attesa, '3,50 €')
  controlla('giusta e chiusa, coi millisecondi tondi', r.giusta === true && r.ultima === true && r.ms === 4200)
  uguale('la chiave della fascia', r.chiave, 'bancarella:mezzi')
  const s = raccontaResto(c, { rifiuti: 1, sbaglio: { cosa: 'resto', cent: 400 }, dato: 350, ms: 9000 })
  controlla('con un rifiuto è sbagliata, ma chiusa', s.giusta === false && s.ultima === true)
  uguale('e dice il primo resto sbagliato', s.data, '4 €')
  controlla('dove la cassa dice il resto: niente', raccontaResto({ ...c, chiediResto: false }, { rifiuti: 0, dato: 350, ms: 1 }) === null)
  const d = { ...c, chiediTotale: true, paga: 2000, totale: 1240, resto: 760, articoli: [{ prezzo: 650 }, { prezzo: 590 }] }
  const t = raccontaResto(d, { rifiuti: 1, sbaglio: { cosa: 'totale', cent: 1250 }, dato: 760, ms: 1 })
  uguale('due piatti: il conto dice la somma', t.fatto, 'resto su 20 € per 6,50 € + 5,90 €')
  uguale('il totale sbagliato', t.data, 'totale 12,50 €')
  uguale('e cosa si aspettava', t.attesa, 'totale 12,40 € · resto 7,60 €')
  uguale('i soldi tondi senza virgola', soldi(500), '5 €')
}

// per ogni livello, tante ordinazioni vere: la risposta c'è solo dove il bambino conta il resto, e sta nei 40
let dette = 0, lunghe = []
for (let k = 0; k < A_SCUOLA; k++) {
  const camp = CUCINE[k], piatti = ricetteDi(camp.ricette)
  for (let n = 0; n < camp.tappe; n++) {
    const T = tappaDi(camp, n)
    for (let i = 0; i < 40; i++) {
      const o = nuovoOrdine(T, piatti)
      const r = raccontaResto(o, { rifiuti: 1, sbaglio: { cosa: o.chiediTotale ? 'totale' : 'resto', cent: o.paga - 1 }, dato: o.resto, ms: 1 })
      if (!T.chiediResto) { if (r) lunghe.push(`livello ${k + 1}: una risposta dove la cassa dice il resto`); continue }
      dette++
      if (!r) { lunghe.push(`livello ${k + 1}: niente risposta`); continue }
      for (const campo of ['fatto', 'data', 'attesa']) if (r[campo].length > LUNGO || r[campo].endsWith('…')) lunghe.push(`livello ${k + 1}: ${r[campo]}`)
      if (!r.chiave.startsWith('bancarella:')) lunghe.push(`livello ${k + 1}: chiave ${r.chiave}`)
    }
  }
}
controlla(`${dette} ordinazioni raccontate, nessuna oltre i ${LUNGO} né dove non si conta`, !lunghe.length, lunghe.slice(0, 5).join('\n     '))
controlla('nei primi sei la cassa dice il resto', CUCINE.slice(0, 6).every(c => !tappaDi(c, 0).chiediResto))
controlla('dal settimo lo conta il bambino', CUCINE.slice(6, A_SCUOLA).every(c => tappaDi(c, 0).chiediResto))

console.log('\nLA DIFFICOLTÀ')
controlla('la scheda dice cosa cambia', !!scheda.difficolta?.facile && !!scheda.difficolta?.difficile)
uguale('facile: cuori', regolaDi({ ...e(1, 6), difficolta: 'facile' }).cuori, 5)
uguale('facile: pazienza', regolaDi({ ...e(1, 6), difficolta: 'facile' }).pazienza, 1.5)
uguale('difficile: cuori', regolaDi({ ...e(1, 6), difficolta: 'difficile' }).cuori, 2)
uguale('difficile: pazienza', regolaDi({ ...e(1, 6), difficolta: 'difficile' }).pazienza, 0.75)
uguale('normale è casa: 3 cuori', regolaDi(e(1, 6)).cuori, 3)
uguale('normale è casa: pazienza intera', regolaDi(e(1, 6)).pazienza, 1)
controlla('normale scritto = senza', regolaDi({ ...e(1, 6), difficolta: 'normale' }) === regolaDi(e(1, 6)))
controlla('senza limite o parola ignota: normale', regolaDi(null) === REGOLE.normale && regolaDi({ difficolta: 'x' }) === REGOLE.normale)
uguale('la difficoltà non cambia il giro', livelliDelLimite({ ...e(7, 9), difficolta: 'facile' }).join(), livelliDelLimite(e(7, 9)).join())
controlla('nel catalogo con la difficoltà', validoCatalogo({ ...e(7, 12), difficolta: 'difficile' }))

riassunto('la cucina a scuola')
