/* IL SOTTERRANEO LIMITATO DA FUORI

   A scuola il sotterraneo riceve `limite: { domande }` (il pescatore dell'esercizio): ogni cosa che chiede fa la domanda
   dopo dell'esercizio, si scende sempre nella cripta (un'altra a ogni discesa) e nessuna strada porta al villaggio.
   Senza limite le domande sono quelle di casa. Vedi docs/sotterraneo/scuola.md.
   `node test/esegui.mjs sotterraneo-scuola --niente-build` */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { limiteDi, domandaDelLimite, corredoDelLimite, tappaDelLimite, mondoDopoIlLimite, versoIlVillaggio, TAPPA_DEL_LIMITE, LIVELLI_IN_PIU }
  from '../../src/giochi/sotterraneo/limite.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { livelloDella } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { livelloAtteso, robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { scrivi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { tappaDellaSosta } from '../../src/giochi/sotterraneo/motore/rigenera.js'
import { pescatore, valido, CATALOGO, LUNGO } from '../../src/scuola/comune/esercizi.js'
import { raccontaSotterraneo } from '../../src/scuola/giochi/sotterraneo/risposta.js'
import scheda from '../../src/scuola/giochi/sotterraneo/scheda.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const RADICE = resolve(import.meta.dirname, '../..')
function casaFinta() {
  const chiamate = []
  return { chiamate, chiedi: x => { chiamate.push(x); return { domanda: { chiave: 'casa' }, modulo: 'casa' } } }
}
const CHIESTA = { id: 3, che: 'porta', difficolta: 0.2 }

console.log('\nSENZA LIMITE: CASA')
for (const [cosa, l] of [['null', null], ['niente', undefined], ['vuoto', {}], ['domande senza prossima', { domande: {} }]]) {
  controlla(`${cosa}: nessun limite`, limiteDi(l) === null)
  const casa = casaFinta()
  const d = domandaDelLimite(limiteDi(l), CHIESTA, 'orologio', casa.chiedi)
  controlla(`${cosa}: la domanda di casa`, d.domanda.chiave === 'casa' && casa.chiamate.length === 1)
  uguale(`${cosa}: con la difficoltà della discesa e il modulo da evitare`, JSON.stringify(casa.chiamate[0]),
    JSON.stringify({ difficolta: 0.2, evita: 'orologio' }))
}

console.log('\nLE DOMANDE DAL PESCATORE')
{
  const e = { tipo: 'tabelline', tabelline: [9], modo: 'prodotto', gioco: 'sotterraneo' }
  controlla('la tabellina del 9 nel sotterraneo è valida', valido(e))
  const lim = limiteDi({ domande: pescatore(e, 7) })
  const casa = casaFinta()
  const fatte = Array.from({ length: 20 }, () => domandaDelLimite(lim, CHIESTA, null, casa.chiedi))
  uguale('la scelta di casa non si chiama mai', casa.chiamate.length, 0)
  controlla('ogni domanda ha la forma della scheda', fatte.every(x => x.domanda && x.pittori && x.titolo))
  controlla('tutte del 9', fatte.every(x => /^9 × \d+ = \?$/.test(x.domanda.testo)), fatte.map(x => x.domanda.testo).join(', '))
}

console.log('\nLA DISCESA DELLA SCUOLA È LA CRIPTA')
{
  const t = tappaDelLimite('cavaliere', null)
  uguale('la cripta', t.chiave, CAMPAGNA[TAPPA_DEL_LIMITE].chiave)
  uguale('due piani, come nella storia', t.piani, 2)
  controlla('senza potenza: la discesa della storia', !t.potenza && t.delMondo && t.delMondo.storia === true)
  const c = new Corsa(t, { seme: t.seme, rnd: seminato(t.seme), eroe: 'cavaliere' })
  controlla('la corsa finta parte dal primo piano della cripta', c.piano === 0 && c.tappa.chiave === 'altare' && !c.finita)
  uguale('lo stesso mondo, la stessa cripta', tappaDelLimite('cavaliere', null).seme, t.seme)
  const dopo = mondoDopoIlLimite(null)
  const t2 = tappaDelLimite('cavaliere', dopo)
  controlla('finita una discesa, la prossima ha un altro seme', t2.seme !== t.seme && t2.chiave === 'altare' && t2.piani === 2)
  controlla('e un\'altra ancora', tappaDelLimite('cavaliere', mondoDopoIlLimite(dopo)).seme !== t2.seme)
  // la sosta (un blocco dopo l'altro, lo stesso alunno) rifà la stessa cripta
  const s = scrivi(c, TAPPA_DEL_LIMITE)
  const r = tappaDellaSosta(s)
  controlla('la sosta rifà la stessa cripta', r && r.seme === t.seme && r.chiave === 'altare' && r.piani === 2 && !r.potenza)
}

console.log('\nIL CORREDO DELLA PRIMA DISCESA')
for (const e of EROI) {
  const k = corredoDelLimite(e.chiave)
  uguale(`${e.chiave}: ${LIVELLI_IN_PIU} livelli sopra quello atteso`, livelloDella(k.crescita), livelloAtteso(TAPPA_DEL_LIMITE) + LIVELLI_IN_PIU)
  uguale(`${e.chiave}: con la roba attesa per la cripta`, JSON.stringify(k.roba), JSON.stringify(robaAttesa(e.chiave, TAPPA_DEL_LIMITE)))
}

console.log('\nLE USCITE VERSO IL VILLAGGIO')
{
  let portali = 0
  for (const seme of [3, 41, 77]) {
    const t = { ...tappaDelLimite('mago', null), seme }
    const c = new Corsa(t, { seme, rnd: seminato(seme), eroe: 'mago' })
    c.interagisci(c.livello.robe.find(r => r.che === 'scala-su'))
    controlla(`seme ${seme}: la scala che sale dal primo piano porta al villaggio`, versoIlVillaggio(c.foglio))
    c.chiudi()
    const p = c.livello.robe.find(r => r.che === 'portale')
    if (p) { portali++; c.interagisci(p); controlla(`seme ${seme}: il portale porta al villaggio`, versoIlVillaggio(c.foglio)); c.chiudi() }
    // al secondo piano la scala che sale riporta al primo: quella resta aperta
    c.chiaveDelPiano = true
    c.interagisci(c.livello.robe.find(r => r.che === 'scala'))
    c.scendi()
    c.interagisci(c.livello.robe.find(r => r.che === 'scala-su'))
    controlla(`seme ${seme}: dal secondo piano si risale`, c.foglio && c.foglio.che === 'scala-su' && !versoIlVillaggio(c.foglio))
  }
  controlla('almeno una cripta col portale', portali > 0)
  controlla('una porta o niente non portano su', !versoIlVillaggio({ che: 'porta' }) && !versoIlVillaggio(null))

  // nel coordinatore ogni uscita è spenta col limite: i tasti del velo, il cartello di casa, il portale, il gioco in due
  const g = readFileSync(resolve(RADICE, 'src/giochi/sotterraneo/Gioco.vue'), 'utf8')
  const riga = sel => g.split('\n').find(l => l.includes(sel)) || ''
  for (const sel of ['data-azione="eroe-giu"', 'data-azione="lascia-discesa"', 'data-sfida-apri', '<Fine v-if='])
    controlla(`${sel}: spento col limite`, riga(sel).includes('!lim'), riga(sel).trim())
  controlla('il mondo di sopra non si monta col limite', g.includes('<template v-if="(!corsa || sopra) && !lim">'))
  controlla('il portale non sale col limite', /function salgoDalPortale\(\) \{[^}]*\n\s*if \(lim\) return\n/.test(g))
  controlla('la ✕ e il velo non escono col limite', g.includes('if (lim) return togli()'))
  controlla('lascio perdere e cambio eroe no', /\|\| nellAbisso\.value \|\| lim\) return/.test(g) && /c\.finita \|\| lim\) return\n\s*salva/.test(g))
  controlla('fuori dalla discesa c\'è sempre il velo per scendere ancora', g.includes('data-fine-limite') && g.includes('data-azione="scendi-ancora"'))
}

console.log('\nLA SCHEDA PER LA MAESTRA')
{
  const voci = CATALOGO.materie.flatMap(m => m.voci).filter(v => v.tipo === 'tabelline' || v.tipo === 'modulo')
  const fuori = voci.filter(v => !scheda.accetta(v.base)).map(v => v.base.modulo).sort()
  uguale('tutto il catalogo tranne le prime lettere e le sillabe', fuori.join(', '), 'lettere, sillabe')
  const no = voci.filter(v => scheda.accetta(v.base) && !valido({ ...v.base, gioco: 'sotterraneo' }))
  controlla('le altre si fanno nel sotterraneo', !no.length, no.map(v => v.id).join(', '))
  controlla('pronto, in 3D, con la frase per la maestra', scheda.pronto !== false && scheda.tred === true && /terza/.test(scheda.spiega))
}

console.log('\nLA RISPOSTA ALLA MAESTRA')
{
  const { domanda } = pescatore({ tipo: 'tabelline', tabelline: [9], modo: 'prodotto' }, 5).prossima()
  const g = raccontaSotterraneo({ domanda, indice: domanda.giusta, chiave: domanda.chiave, giusto: true, tempo: 2.14 })
  controlla('giusta, chiusa, in millesimi', g.chiave === 'tab:prodotto' && g.giusta === true && g.ultima === true && g.ms === 2140)
  const no = raccontaSotterraneo({ domanda, indice: (domanda.giusta + 1) % domanda.risposte.length, chiave: domanda.chiave, giusto: false, tempo: 5 })
  controlla('sbagliata, ma chiusa: quello che chiedeva ne fa un\'altra', no.giusta === false && no.ultima === true && no.data !== no.attesa)
  controlla(`i tre testi stanno in ${LUNGO} caratteri`, [g.fatto, g.data, g.attesa].every(t => t.length <= LUNGO))
}

riassunto('il sotterraneo a scuola')
