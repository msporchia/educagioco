/* ═══════════════════════════════════════════════════════════════════
   IL BLOCCHETTO DEI POTENZIAMENTI — «ho preso otto potenziamenti, e i
   miei arcieri fanno +80%»

   `blocchettoDi` compone il foglio che si apre dal gettone ⬆️ durante
   la partita. Qui si tiene fermo che conti quello che dice: i gradini
   saliti torre per torre, i regali coi loro gradi, e il «+X%» di ogni
   tipo di torre rispetto a una appena costruita — dal modello, lo
   stesso che fa i prezzi.
   ═══════════════════════════════════════════════════════════════════ */
import { blocchettoDi, dpsDi, REGALI } from '../../src/data/castello.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const vuoto = blocchettoDi([], null)
uguale('senza torri e senza regali non c\'è niente', vuoto.totale, 0)
controlla('e niente righe', !vuoto.torri.length && !vuoto.regali.length)

const torri = [{ tipo: 'add', lv: 3 }, { tipo: 'add', lv: 5, ramo: 'cecchino' },
               { tipo: 'div', lv: 1 }, { tipo: 'mul', lv: 2 }]
const b = blocchettoDi(torri, null)
uguale('i gradini sono quelli saliti: 2 + 4 + 0 + 1', b.gradini, 7)
uguale('e senza regali il totale è quello', b.totale, 7)
const arcieri = b.torri.find(t => t.tipo === 'add')
uguale('gli arcieri sono due', arcieri.quante, 2)
uguale('con sei gradini in tutto', arcieri.gradini, 6)
const atteso = ((dpsDi('add', 3) + dpsDi('add', 5, 'cecchino')) / 2 / dpsDi('add', 1) - 1) * 100
uguale('e fanno in media quanto dice il modello, in più di un arciere nuovo',
       arcieri.piu, Math.round(atteso))
uguale('il ramo si dice', arcieri.rami.map(r => `${r.quante} ${r.ramo}`).join(), '1 cecchino')
uguale('una bomba mai salita fa +0%', b.torri.find(t => t.tipo === 'div').piu, 0)
uguale('in fila come le carte delle torri, non come sono state costruite',
       b.torri.map(t => t.tipo).join(), 'add,mul,div')

/* i regali: si contano, si scrivono moltiplicati per i gradi, e gonfiano
   il «+X%» della torre che toccano */
const r = blocchettoDi(torri, { frecce: 2, vista: 1 })
uguale('due regali sulle frecce e uno sulla vista fanno tre', r.regaliPresi, 3)
uguale('e il totale li conta', r.totale, 10)
const frecce = r.regali.find(x => x.id === 'frecce')
uguale('la frase di un regalo preso due volte è moltiplicata', frecce.quanto,
       REGALI.find(x => x.id === 'frecce').per.replace('30', '60'))
controlla('e gli arcieri con le frecce affilate fanno di più',
          r.torri.find(t => t.tipo === 'add').piu > arcieri.piu,
          `${arcieri.piu}% → ${r.torri.find(t => t.tipo === 'add').piu}%`)
uguale('i numeri con la virgola restano all\'italiana',
       blocchettoDi([], { gelo: 3 }).regali[0].quanto, '+1,2 s di gelo e +12% di danno su chi è gelato')
nota(`esempio: ${r.totale} potenziamenti · ` +
     r.torri.map(t => `${t.tipo} ×${t.quante} +${t.piu}%`).join(' · '))

riassunto('il blocchetto dei potenziamenti')
