/* SURVIVORS LIMITATO DA FUORI

   A scuola Survivors riceve `limite: { domande }` (il pescatore dell'esercizio) e ogni carta si paga con la domanda dopo
   dell'esercizio; senza limite la carta chiede la domanda di casa col suo prezzo. La risposta va alla maestra già
   raccontata. Vedi docs/survivors/scuola.md.
   `node test/esegui.mjs survivors-scuola --niente-build` */
import { limiteDi, domandaDellaCarta, liberaDelLimite } from '../../src/giochi/survivors/limite.js'
import { LIBERO } from '../../src/giochi/survivors/dati/campagna.js'
import { pescatore, valido, giochiPer, CATALOGO, LUNGO } from '../../src/scuola/comune/esercizi.js'
import { raccontaSurvivors } from '../../src/scuola/giochi/survivors/risposta.js'
import scheda from '../../src/scuola/giochi/survivors/scheda.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

// la scelta di casa, finta: dice con cosa l'hanno chiamata
function casaFinta() {
  const chiamate = []
  return { chiamate, chiedi: x => { chiamate.push(x); return { domanda: { chiave: 'casa' }, modulo: 'casa' } } }
}
const CARTA = { chiave: 'arco', prezzo: 0.4 }

console.log('\nSENZA LIMITE: CASA')
for (const [cosa, l] of [['null', null], ['niente', undefined], ['vuoto', {}], ['domande senza prossima', { domande: {} }]]) {
  controlla(`${cosa}: nessun limite`, limiteDi(l) === null)
  const casa = casaFinta()
  const d = domandaDellaCarta(limiteDi(l), CARTA, 'orologio', casa.chiedi)
  controlla(`${cosa}: la carta chiede la domanda di casa`, d.domanda.chiave === 'casa' && casa.chiamate.length === 1)
  uguale(`${cosa}: col prezzo della carta e il modulo da evitare`, JSON.stringify(casa.chiamate[0]),
    JSON.stringify({ difficolta: 0.4, evita: 'orologio' }))
}

console.log('\nLA TABELLINA DEL 9')
{
  const e = { tipo: 'tabelline', tabelline: [9], modo: 'prodotto', gioco: 'survivors' }
  controlla('l\'esercizio in Survivors è valido', valido(e))
  const lim = limiteDi({ domande: pescatore(e, 7) })
  controlla('il limite c\'è', !!lim)
  const casa = casaFinta()
  const fatte = Array.from({ length: 20 }, () => domandaDellaCarta(lim, CARTA, null, casa.chiedi))
  uguale('la scelta di casa non si chiama mai', casa.chiamate.length, 0)
  controlla('ogni domanda ha la forma della scheda (domanda, pittori, titolo)', fatte.every(x => x.domanda && x.pittori && x.titolo))
  controlla('tutte del 9', fatte.every(x => /^9 × \d+ = \?$/.test(x.domanda.testo)), fatte.map(x => x.domanda.testo).join(', '))
  uguale('dieci fatti diversi nelle prime dieci', new Set(fatte.slice(0, 10).map(x => x.domanda.testo)).size, 10)
}

console.log('\nPIÙ VOCI INSIEME')
{
  const e = { tipo: 'insieme', parti: [
    { esercizio: { tipo: 'tabelline', tabelline: [8], modo: 'prodotto' }, peso: 'tanto' },
    { esercizio: { tipo: 'modulo', modulo: 'orologio', da: 1, a: 3, tipologie: [] }, peso: 'poco' },
  ] }
  controlla('Survivors accetta l\'insieme', giochiPer(e).some(g => g.id === 'survivors'))
  const lim = limiteDi({ domande: pescatore(e, 3) })
  const fatte = Array.from({ length: 25 }, () => domandaDellaCarta(lim, CARTA, null, casaFinta().chiedi))
  const otto = fatte.filter(x => /^8 × \d+ = \?$/.test(x.domanda.testo)).length
  uguale('quattro dell\'8 per ogni orologio', [otto, fatte.length - otto].join(' e '), '20 e 5')
}

console.log('\nLA PARTITA DELLA SCUOLA')
{
  const t = liberaDelLimite(LIBERO)
  uguale('sul prato, che disegnato di ripiego si vede', t.scenario, 'prato')
  uguale('senza fine', t.durata, Infinity)
  const { scenario, ...resto } = t
  const { scenario: notte, ...diCasa } = LIBERO
  uguale('il resto è la Sopravvivenza di casa', JSON.stringify(resto), JSON.stringify(diCasa))
  uguale('e quella di casa resta di notte', notte, 'notte')
}

console.log('\nOGNI VOCE DEL CATALOGO')
{
  const voci = CATALOGO.materie.flatMap(m => m.voci).filter(v => v.tipo === 'tabelline' || v.tipo === 'modulo')
  const no = voci.filter(v => !scheda.accetta(v.base) || !valido({ ...v.base, gioco: 'survivors' }))
  controlla(`le ${voci.length} voci si fanno in Survivors`, !no.length, no.map(v => v.id).join(', '))
  controlla('Survivors è pronto per la maestra, in 2D', scheda.pronto !== false && scheda.tred === false && !!scheda.spiega)
}

console.log('\nLA RISPOSTA ALLA MAESTRA')
{
  const { domanda } = pescatore({ tipo: 'tabelline', tabelline: [9], modo: 'prodotto' }, 5).prossima()
  const sbagliata = (domanda.giusta + 1) % domanda.risposte.length
  const giusta = raccontaSurvivors({ domanda, indice: domanda.giusta, chiave: domanda.chiave, giusto: true, tempo: 2.14 })
  uguale('la chiave delle schede', giusta.chiave, 'tab:prodotto')
  controlla('giusta, chiusa, in millesimi', giusta.giusta === true && giusta.ultima === true && giusta.ms === 2140)
  uguale('il fatto senza «= ?»', giusta.fatto, domanda.testo.replace(' = ?', ''))
  uguale('data e attesa uguali', giusta.data, giusta.attesa)
  const no = raccontaSurvivors({ domanda, indice: sbagliata, chiave: domanda.chiave, giusto: false, tempo: 5 })
  controlla('sbagliata, ma chiusa: la carta non torna', no.giusta === false && no.ultima === true)
  controlla('data diversa dall\'attesa', no.data !== no.attesa)
  const { domanda: lunga } = pescatore({ tipo: 'modulo', modulo: 'capire', da: 1, a: 3, tipologie: [] }, 2).prossima()
  const r = raccontaSurvivors({ domanda: lunga, indice: 0, chiave: lunga.chiave, giusto: false, tempo: 1 })
  controlla(`i tre testi stanno in ${LUNGO} caratteri`, [r.fatto, r.data, r.attesa].every(t => t.length <= LUNGO))
}

riassunto('Survivors a scuola')
