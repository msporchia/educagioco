/* Passo passo lasciato a metà, senza browser: la fila di ogni livello (sotto
   la chiave) e il sentiero senza fine si scrivono, passano da JSON, e
   riletti sono la stessa partita, coi gradini del 💡 già pagati. Quello
   che non torna non si legge; un posto vuoto non si scrive. Vedi
   docs/passo-passo/sosta.md.
   `node test/esegui.mjs passo-passo-sosta --niente-build` */
import { CAMPAGNA, TAPPE_PICCOLE } from '../../src/giochi/passo-passo/dati/campagna.js'
import { ripeti, apri, FINE } from '../../src/giochi/passo-passo/dati/carte.js'
import { scalaDi } from '../../src/giochi/passo-passo/motore/aiuti.js'
import { generaSentiero, caso } from '../../src/giochi/passo-passo/motore/generatore.js'
import { VERSIONE, scrivi, leggi, dice, scriviFila, leggiFila, scriviSerie, leggiSerie, filaBuona,
         pagatoDa, svelatoDa } from '../../src/giochi/passo-passo/motore/sosta.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const SCALA = scalaDi()
const perArchivio = x => JSON.parse(JSON.stringify(x))
const prato = CAMPAGNA[0]
const conSalti = CAMPAGNA.find(t => t.salti && !t.zaino)
const viale = CAMPAGNA[TAPPE_PICCOLE]           // il primo con lo zaino: il 🔁

/* ══════════ 1. la fila di un livello torna com'era ══════════ */
{
  const fila = [...ripeti(3, 'destra'), apri(null), FINE]
  controlla('la prova parte da una fila con una scatola chiusa e una con la N', filaBuona(fila, viale))
  const scritta = scriviFila({ fila, cursore: 4, presi: 4, carta: '[["destra"],1]' })
  const dato = perArchivio(scrivi({ livelli: { [viale.chiave]: scritta } }))
  uguale('il salvataggio dice la sua versione', dato.v, VERSIONE)
  const riletto = leggi(dato).livelli[viale.chiave]
  uguale('la fila è quella', JSON.stringify(riletto.fila), JSON.stringify(fila))
  uguale('col cursore dov\'era', riletto.cursore, 4)
  uguale('i gradini del 💡 scesi restano: non si ripagano', riletto.presi, 4)
  uguale('e la carta già comprata si riaccende gratis', riletto.carta, '[["destra"],1]')
  controlla('sta in poche centinaia di byte', JSON.stringify(dato).length < 400, JSON.stringify(dato).length)
}

/* ══════════ 2. cosa vuol dire averli pagati ══════════ */
{
  const gratis = SCALA.findIndex(p => p.prezzo > 0)
  controlla('i gradini gratis non contano come pagati', !pagatoDa(gratis))
  controlla('il primo da dieci sì: la stella e la serie lo sanno', pagatoDa(gratis + 1))
  controlla('la strada intera spegne la stella 🧠', svelatoDa(SCALA.length) && !svelatoDa(SCALA.length - 1))
}

/* ══════════ 3. un posto vuoto non si scrive ══════════ */
uguale('una fila vuota senza aiuti non si tiene', scriviFila({ fila: [], cursore: 0, presi: 0 }), null)
controlla('una fila vuota con un aiuto pagato sì', !!scriviFila({ fila: [], cursore: 0, presi: 3 }))
uguale('senza niente da tenere la sosta si toglie', scrivi({ livelli: { prato: null }, sentiero: null }), null)

/* ══════════ 4. quello che non torna non si legge ══════════ */
{
  const buona = scriviFila({ fila: ['destra'], cursore: 1, presi: 0 })
  const leggiUna = (chiave, f) => leggi(perArchivio({ v: VERSIONE, livelli: { [chiave]: f } })).livelli[chiave]
  controlla('la fila si ritrova per chiave', !!leggiUna(prato.chiave, buona))
  uguale('un livello che non c\'è più la perde', leggiUna('non-esiste', buona), undefined)
  uguale('un salto dove i salti non ci sono no',
         leggiUna(prato.chiave, { ...buona, fila: ['salto-destra'] }), undefined)
  controlla('dove ci sono sì', !!leggiFila({ ...buona, fila: ['salto-destra'] }, conSalti))
  uguale('una scatola senza lo zaino no', leggiUna(prato.chiave, { ...buona, fila: ripeti(2, 'destra') }), undefined)
  uguale('una scatola aperta e mai chiusa no',
         leggiFila({ ...buona, fila: [apri(2), 'destra'] }, viale), null)
  uguale('una fila più lunga dello zaino no',
         leggiFila({ ...buona, fila: Array(viale.zaino + 1).fill('destra') }, viale), null)
  uguale('un cursore fuori dalla fila no', leggiUna(prato.chiave, { ...buona, cursore: 4 }), undefined)
  uguale('più gradini di quelli che la scala ha no',
         leggiUna(prato.chiave, { ...buona, presi: SCALA.length + 1 }), undefined)
  uguale('un\'altra versione si butta tutta',
         Object.keys(leggi({ v: VERSIONE + 1, livelli: { [prato.chiave]: buona } }).livelli).length, 0)
  uguale('e anche la spazzatura', JSON.stringify(leggi('boh')), JSON.stringify({ livelli: {}, sentiero: null }))
}

/* ══════════ 5. il sentiero senza fine ══════════ */
const sbloccati = ['salto', 'ghiaccio', 'massi', 'buche', 'cane', 'ripeti', 'fino', 'se']
const seme = 4242
const posto = (n, prima = null) => generaSentiero(n, caso(seme * 1009 + n), { sbloccati, prima })
{
  const p = { ...posto(2), chiave: 'sentiero-2' }
  const s = scriviSerie({ seme, sentieri: 2, serie: 2, prima: p.famiglia, posto: p,
                          fila: { fila: ['destra', 'giu'], cursore: 2, presi: 1, carta: null } })
  const r = leggiSerie(perArchivio(s))
  uguale('il posto è quello di allora, mappa per mappa', JSON.stringify(r.posto.mappa), JSON.stringify(p.mappa))
  uguale('senza la chiave, che si rifà', r.posto.chiave, undefined)
  uguale('con la sua fila', JSON.stringify(r.fila.fila), JSON.stringify(['destra', 'giu']))
  uguale('e la serie aperta: uscire non la chiude', [r.sentieri, r.serie].join(), '2,2')
  const d = dice(perArchivio(scrivi({ sentiero: s })))
  controlla('la mappa dice dove si era', d && /sentiero 3/.test(d.dettaglio) && /2 di fila/.test(d.dettaglio),
            JSON.stringify(d))

  // una fila che non torna su quel posto: il posto resta, la serie anche
  const storta = leggiSerie(perArchivio({ ...s, fila: { fila: ['nuota'], cursore: 1, presi: 0 } }))
  controlla('una fila che non torna si perde, il posto e la serie no',
            storta && storta.fila === null && storta.serie === 2)
  uguale('una serie più lunga dei sentieri fatti non torna', leggiSerie({ ...perArchivio(s), serie: 3 }), null)
  uguale('un posto con una lettera che non c\'è nemmeno',
         leggiSerie({ ...perArchivio(s), posto: { mappa: ['P.Z@'] } }), null)
}
{
  // vinto il posto, il prossimo non è ancora nato: rinasce uguale dal seme
  const s = perArchivio(scriviSerie({ seme, sentieri: 3, serie: 3, prima: 'prato', posto: null }))
  const r = leggiSerie(s)
  controlla('a sentiero vinto si tiene la serie, senza posto', r && r.posto === null && r.serie === 3)
  uguale('e il posto dopo, rifatto dal seme, è lo stesso che sarebbe uscito',
         JSON.stringify(posto(3, r.prima).mappa), JSON.stringify(posto(3, 'prato').mappa))
  uguale('un sentiero appena aperto e non toccato non si scrive',
         scriviSerie({ seme, sentieri: 0, serie: 0, posto: posto(0), fila: { fila: [], presi: 0 } }), null)
  uguale('senza sentiero la mappa non ha niente da dire',
         dice(scrivi({ livelli: { [prato.chiave]: scriviFila({ fila: ['su'], cursore: 1 }) } })), null)
}

riassunto('Passo passo — la fila e il sentiero lasciati a metà')
