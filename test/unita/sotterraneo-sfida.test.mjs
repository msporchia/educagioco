/* Il sotterraneo in due sulla rete (src/giochi/sotterraneo/sfida/, docs/sotterraneo/in-due.md): le mosse e la proposta che si
   accettano, l'eroe dell'ospite che arriva all'host, partite intere fra due bambini finti su reti cattive (test/aiuto/sfida-finta.mjs),
   e la fotografia: una discesa rimessa da una fotografia va avanti uguale a quella da cui è stata presa.
   `node test/esegui.mjs sotterraneo-sfida --niente-build` */
import { partitaInDue, SCENARI } from '../aiuto/sfida-finta.mjs'
import sotterraneo from '../aiuto/sfide/sotterraneo.mjs'
import { mossaValida, accetta, accettaParte } from '../../src/giochi/sotterraneo/sfida/protocollo.js'
import { motoreDi, discesaDi, eseguiMossa } from '../../src/giochi/sotterraneo/sfida/regia.js'
import { rimettiDa } from '../../src/insieme/grafo.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* il primo punto in cui due stati differiscono, o null; tiene conto dei giri (un mostro nel piano e nello scontro) */
function primaDifferenza(x, y, via = '', visti = new Map()) {
  if (x === y || (Number.isNaN(x) && Number.isNaN(y))) return null
  if (!x || !y || typeof x !== 'object' || typeof y !== 'object') return `${via}: ${JSON.stringify(x)} invece di ${JSON.stringify(y)}`
  if (visti.get(x) === y) return null
  visti.set(x, y)
  if (x instanceof Map || x instanceof Set) {
    const ax = [...x], ay = [...y]
    if (ax.length !== ay.length) return `${via}: ${ax.length} invece di ${ay.length}`
    for (let i = 0; i < ax.length; i++) { const d = primaDifferenza(ax[i], ay[i], `${via}[${i}]`, visti); if (d) return d }
    return null
  }
  for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) { const d = primaDifferenza(x[k], y[k], `${via}.${k}`, visti); if (d) return d }
  return null
}

/* ══════════ 1. cosa si accetta ══════════ */
controlla('una mossa giusta passa', mossaValida(['vai', 3, 4, 1]) && mossaValida(['rispondi', 12, 0]) && mossaValida(['scendi']) && mossaValida(['prepara', 'colpo-forte']))
controlla('una storta no', !mossaValida(['vai', -1, 2, 0]) && !mossaValida(['vola']) && !mossaValida(['rispondi', 1, 2]) &&
  !mossaValida(['scendi', 1]) && !mossaValida('vai') && !mossaValida(['prepara', '<script>']))
uguale('la proposta giusta', accetta({ seme: 5, chiave: 'cantine', difficolta: 'difficile' }), null)
controlla('un posto o una difficoltà che non ci sono, no', accetta({ seme: 5, chiave: 'luna', difficolta: 'facile' }) && accetta({ seme: 5, chiave: 'cantine', difficolta: 'mortale' }))
uguale("l'eroe dell'altro, se è un eroe", accettaParte({ eroe: 'elfa', roba: null, crescita: null, nome: 'Leo' }), null)
controlla('un eroe che non esiste, no', accettaParte({ eroe: 'drago', roba: null, crescita: null, nome: '' }) && accettaParte(null))

/* ══════════ 2. partite intere fra due bambini finti ══════════ */
// la rete cattiva di Castle Battle (unita/arena-sfida): «pessima» tiene la rete spenta fino a un minuto otto volte al minuto, oltre i due
// minuti di posto vuoto che il tavolo concede
const RETE_CATTIVA = { min: 30, max: 350, alMinuto: 1.5, spenta: [2000, 42000], ferma: [1000, 9000] }
const ESEMPIO = { calma: SCENARI.calma, casa: SCENARI.casa, melody: SCENARI.melody, cattiva: RETE_CATTIVA }
let prima = null
for (const [nome, scenario] of Object.entries(ESEMPIO)) for (const seme of [3, 8]) {
  const { host, ospite, guasti, durata } = partitaInDue({ gioco: sotterraneo, seme, scenario, minuti: 30 })
  const ch = host.partita, co = ospite.partita
  const n = Object.values(guasti).reduce((s, x) => s + x, 0)
  if (!prima) prima = { ch, co }
  controlla(`${nome}, seme ${seme}: ${n} guasti di rete e la sfida non si rompe`, host.stato === 'gioco' && ospite.stato === 'gioco', `${host.motivo} | ${ospite.motivo}`)
  controlla(`${nome}, seme ${seme}: la discesa finisce su tutti e due, uguale`, !!host.motore.fine() && host.motore.fine() === ospite.motore.fine() && ch.piano === co.piano,
    `${host.motore.fine()} ${ospite.motore.fine()}, piano ${ch.piano} ${co.piano}`)
  uguale(`${nome}, seme ${seme}: le copie non si sono mai separate`, host.lockstep.riallineamenti + ospite.lockstep.riallineamenti, 0)
  nota(`${nome}, seme ${seme}: ${host.motore.fine()} al piano ${ch.piano + 1} in ${(durata / 60000).toFixed(1)} minuti, ${n} guasti; domande ${ch.persone.map(p => p.domande).join(' e ')}`)
}
{
  const { ch, co } = prima
  uguale("l'host ha l'eroe dell'ospite", ch.persone.map(p => `${p.nome} ${p.chiEro}`).join(', '), 'Leo cavaliere, Melody mago')
  uguale("e l'ospite quello dell'host", co.persone.map(p => `${p.nome} ${p.chiEro}`).join(', '), 'Leo cavaliere, Melody mago')
}
{
  const { host, ospite } = partitaInDue({ gioco: sotterraneo, seme: 4, scenario: SCENARI.calma, minuti: 2, firme: ['A', 'B'] })
  controlla('due versioni diverse non partono', host.stato === 'rotta' && ospite.stato === 'rotta' && /versione/.test(host.motivo), `${host.stato} ${host.motivo}`)
}

/* ══════════ 3. la fotografia ══════════ */
{
  const regola = sotterraneo.regola({ ruolo: 'host' }), regolaB = sotterraneo.regola({ ruolo: 'ospite' })
  const proposta = regola.proponi(sotterraneo.scelte(6))
  const parti = { host: regola.presentati(), ospite: regolaB.presentati() }
  const a = motoreDi(discesaDi(proposta, parti)), b = motoreDi(discesaDi(proposta, parti))
  const ca = a.partita
  // il copione: i bambini finti decidono su `a` e la stessa mossa va a tutti e due (prima la fotografia, poi insieme)
  const mosse = []
  const finto = { lockstep: { k: 0, hoMio: 0 }, partita: ca, scegli: m => { mosse.push(m); return true } }
  let r = 1
  const caso = () => (r = (r * 16807) % 2147483647) / 2147483647
  const gira = (motori, n) => {
    for (let k = 0; k < n && !ca.finita; k++) {
      for (const ruolo of ['host', 'ospite']) {
        mosse.length = 0
        finto._finto = null
        finto.lockstep.k = k + 1; finto.lockstep.hoMio = k
        sotterraneo.muovi(ruolo, finto, caso)
        for (const m of mosse) for (const mo of motori) mo.applica(ruolo, m)
      }
      for (const mo of motori) mo.avanza()
    }
  }
  let fotoNelloScontro = false
  for (let k = 0; k < 4000 && !ca.finita && !fotoNelloScontro; k += 50) { gira([a], 50); fotoNelloScontro = ca.scontroAperto() }
  const foto = a.foto()
  nota(`la fotografia: ${JSON.stringify(foto).length} caratteri, ${fotoNelloScontro ? 'a scontro aperto' : 'fuori dallo scontro'}, al piano ${ca.piano + 1}`)
  b.rimetti(JSON.parse(JSON.stringify(foto)))
  uguale('rimessa dalla fotografia, la stessa impronta', JSON.stringify(b.impronta()), JSON.stringify(a.impronta()))
  controlla('anche a scontro aperto', fotoNelloScontro)
  gira([a, b], 3000)
  uguale('e poi le stesse mosse portano allo stesso punto', JSON.stringify(b.impronta()), JSON.stringify(a.impronta()))
  // valore per valore: l'ordine delle chiavi e chi condivide un dato fisso del gioco (le schede dell'arredo dei piani nati dopo) possono
  // cambiare fra la discesa e quella rimessa, e non cambiano niente
  uguale('fino allo stesso stato, campo per campo', primaDifferenza(rimettiDa(b.foto()), rimettiDa(a.foto())), null)
  uguale('e lo stesso caso', b.foto().caso, a.foto().caso)
  controlla('una mossa sola non rompe niente se arriva fuori tempo', (() => { eseguiMossa(ca, 1, ['rispondi', 99999, 1]); return true })())
}

riassunto('Il sotterraneo in due, sulla rete')
