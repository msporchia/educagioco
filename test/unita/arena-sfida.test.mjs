/* Il protocollo della sfida in due (`arena/sfida/protocollo.js`), con un inoltro finto che ritarda i messaggi come farebbe una
   rete da hotspot: due copie della partita, mosse a caso dall'una e dall'altra parte, e le impronte che si confrontano da sole. */
import { Partita } from '../../src/giochi/arena/motore/partita.js'
import { caso } from '../../src/giochi/arena/motore/banco.js'
import { truppeDelTerreno, TERRENI } from '../../src/giochi/arena/dati/regole.js'
import { CAMPI_UNITA, fotoDi, aPezzi, applicaFoto } from '../../src/giochi/arena/sfida/foto.js'
import { Sessione, improntaDi, proponi, accetta, RITMO_MONETE, ritmoPer } from '../../src/giochi/arena/sfida/protocollo.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const TERRENO = 'neve', SEME = 77
const sfida = { truppe: truppeDelTerreno(TERRENO), umano: true, ritmoMonete: 0.5 }
const AZIONI = ['costruisci', 'potenzia', 'miniera', 'ripara', 'castello', 'bomba']

/* due sessioni collegate da un filo che ritarda da `min` a `max` secondi; `secondi` di tempo vero a fette da 16 ms */
function simula({ secondi = 150, min = 0.06, max = 0.25, seme = 1, guasto = null } = {}) {
  const r = caso(seme)
  const filo = []                                           // { quando, a, m }
  const ultimo = { host: 0, ospite: 0 }                      // un WebSocket consegna nell'ordine in cui si manda
  let ora = 0
  const nuova = ruolo => {
    const s = new Sessione({ partita: new Partita({ rnd: caso(SEME), sfida }), ruolo, invia: m => { const a = ruolo === 'host' ? 'ospite' : 'host'; ultimo[a] = Math.max(ultimo[a], ora + min + r() * (max - min)); filo.push({ quando: ultimo[a], a, m: JSON.parse(JSON.stringify(m)) }) } })
    s.motivo = null
    s.alDivergere = motivo => { s.motivo = motivo }
    return s
  }
  const lati = { host: nuova('host'), ospite: nuova('ospite') }
  for (let t = 0; t < secondi; t += 0.016) {
    ora = t
    while (filo.length) {
      let i = -1
      for (let j = 0; j < filo.length; j++) if (filo[j].quando <= ora && (i < 0 || filo[j].quando < filo[i].quando)) i = j
      if (i < 0) break
      const { a, m } = filo.splice(i, 1)[0]
      lati[a].ricevi(m)
    }
    for (const s of Object.values(lati)) {
      s.avanza(0.016)
      if (r() < 0.02 && s.mio) {                            // ogni tanto una mossa
        const azione = AZIONI[Math.floor(r() * AZIONI.length)]
        const id = azione === 'costruisci' ? s.p.truppeAmmesse[Math.floor(r() * s.p.truppeAmmesse.length)] : undefined
        const posto = Math.floor(r() * 6)
        if (azione === 'costruisci') s.scegli(azione, id, posto)
        else if (azione === 'potenzia') s.scegli(azione, posto)
        else s.scegli(azione)
      }
    }
    if (guasto && Math.abs(t - guasto.a) < 0.008) lati[guasto.chi].p.lati.io.monete += 5      // una copia si guasta di nascosto
  }
  return lati
}

{
  const { host, ospite } = simula({})
  controlla('150 secondi con una rete lenta: nessuna delle due copie si è separata', !host.rotta && !ospite.rotta, `${host.motivo} / ${ospite.motivo}`)
  controlla('le impronte sono state confrontate davvero, a ogni 5 secondi di partita', host.confrontate >= 15 && ospite.confrontate >= 15, `${host.confrontate}/${ospite.confrontate}`)
  controlla('la partita è andata avanti (più di due minuti)', host.p.t > 100 && ospite.p.t > 100, `${host.p.t.toFixed(0)}/${ospite.p.t.toFixed(0)}`)
  controlla('e c\'è roba in campo dall\'una e dall\'altra parte', host.p.casermeDi('io').length > 0 && host.p.casermeDi('nem').length > 0)
}
{
  const { host, ospite } = simula({ seme: 5, min: 0.2, max: 0.6 })
  controlla('con la rete molto lenta (fino a mezzo secondo) la partita aspetta ma non si separa', !host.rotta && !ospite.rotta && host.p.t > 40, `${host.motivo} / ${ospite.motivo}`)
}
{
  const { host, ospite } = simula({ seme: 9, guasto: { chi: 'ospite', a: 40 } })
  controlla('una copia che si guasta di nascosto viene scoperta e riallineata, la sfida non finisce', !host.rotta && !ospite.rotta && host.riallineamenti === 1 && ospite.riallineamenti === 1, `${host.motivo} ${ospite.motivo} ${host.riallineamenti}/${ospite.riallineamenti}`)
  controlla('dopo il riallineamento le impronte tornano a coincidere e la partita va avanti', host.confrontate > 20 && ospite.confrontate > 20 && host.p.t > 100 && !host.riallineo && !ospite.riallineo, `${host.confrontate} ${host.p.t.toFixed(0)}`)
}
{
  // la fotografia porta tutto: ogni campo di un'unità, e il caso (se manca, le copie si separano di nuovo subito)
  const { host, ospite } = simula({ seme: 3, secondi: 90 })
  const mancano = new Set()
  for (const u of host.p.unita) for (const c of Object.keys(u)) if (!CAMPI_UNITA.includes(c)) mancano.add(c)
  controlla('la fotografia nomina ogni campo di un\'unità', mancano.size === 0 && host.p.unita.length > 0, [...mancano].join(','))
  const testo = fotoDi(host.p, host.k)
  const pezzi = aPezzi(testo, 1)
  controlla('i pezzi stanno sotto i 512 byte del servizio', pezzi.every(m => JSON.stringify(m).length <= 512), String(Math.max(...pezzi.map(m => JSON.stringify(m).length))))
  const copia = new Partita({ rnd: caso(SEME), sfida })
  const k = applicaFoto(copia, pezzi.map(m => m.d).join(''))
  uguale('rimessa dalla fotografia, la copia ha la stessa impronta', improntaDi(copia), improntaDi(host.p))
  uguale('e lo stesso tick', k, host.k)
  for (let i = 0; i < 400; i++) { host.p.avanza(0.05); copia.avanza(0.05) }
  uguale('e da lì le due copie corrono uguali (anche il caso)', improntaDi(copia), improntaDi(host.p))
  void ospite
}
{
  const s = new Sessione({ partita: new Partita({ rnd: caso(1), sfida }), ruolo: 'host', invia: () => {} })
  let rotta = null
  s.alDivergere = m => { rotta = m }
  s.ricevi({ t: 'k', h: 3, c: [] })
  controlla('un messaggio che torna indietro nel tempo si rifiuta', rotta !== null)
  const s2 = new Sessione({ partita: new Partita({ rnd: caso(1), sfida }), ruolo: 'host', invia: () => {} })
  let rotta2 = null
  s2.alDivergere = m => { rotta2 = m }
  s2.ricevi({ t: 'k', h: 20, c: [[2, 'costruisci', 'scheletri', 0]] })
  controlla('una mossa di un tick già passato si rifiuta', rotta2 !== null)
  const s3 = new Sessione({ partita: new Partita({ rnd: caso(1), sfida }), ruolo: 'host', invia: () => {} })
  let rotta3 = null
  s3.alDivergere = m => { rotta3 = m }
  s3.ricevi({ t: 'k', h: 20, c: [[12, 'regala-monete', null, null]] })
  controlla('un\'azione che non esiste si rifiuta', rotta3 !== null)
  const s4 = new Sessione({ partita: new Partita({ rnd: caso(1), sfida }), ruolo: 'host', invia: () => {} })
  s4.ricevi({ t: 'k', h: 1e9, c: [] })
  controlla('e uno che promette un futuro lontano', s4.rotta !== null)
}
{
  const firma = 'abc', terreni = TERRENI
  const p = proponi({ firma, seme: 5, terreno: 'lava' })
  uguale('regole uguali: si parte', accetta(p, { firma, terreni }).t, 'pronto')
  uguale('regole diverse: no, per versione', accetta(p, { firma: 'xyz', terreni }).motivo, 'versione')
  uguale('un terreno che non esiste: no', accetta(proponi({ firma, seme: 5, terreno: 'deserto' }), { firma, terreni }).t, 'no')
  uguale('monete troppo veloci: no', accetta(proponi({ firma, seme: 5, terreno: 'lava', ritmoMonete: RITMO_MONETE.max + 1 }), { firma, terreni }).t, 'no')
  uguale('un messaggio qualunque non è una proposta', accetta({ t: 'k' }, { firma, terreni }).t, 'no')
}
{
  const a = new Partita({ rnd: caso(1), sfida }), b = new Partita({ rnd: caso(1), sfida: { ...sfida, ritmoMonete: 1 } })
  controlla('in due le monete sono uguali per tutti e due, e il ritmo lo decide l\'host',
            a.lati.io.alSecondo === a.lati.nem.alSecondo && b.lati.io.alSecondo === 2 * a.lati.io.alSecondo && a.forza.nem === 1)
}
{
  uguale('con dieci secondi a risposta le monete corrono a un quinto di quelle del campo fermo', +ritmoPer(10).toFixed(2), 0.2)
  controlla('chi risponde più piano ha monete più lente, chi è più svelto più veloci', ritmoPer(15) < ritmoPer(10) && ritmoPer(10) < ritmoPer(6))
  controlla('ogni ritmo che si può scegliere è accettato', [6, 10, 15, 25].every(t => accetta(proponi({ firma: 'a', seme: 1, terreno: 'neve', ritmoMonete: ritmoPer(t) }), { firma: 'a', terreni: TERRENI }).t === 'pronto'))
}
{
  // mosse di tutti e due che cadono sullo stesso tick, date nello stesso istante: ogni copia le riceve in un ordine suo
  const filo = []
  const mk = ruolo => new Sessione({ partita: new Partita({ rnd: caso(SEME), sfida }), ruolo, invia: m => filo.push({ a: ruolo === 'host' ? 'ospite' : 'host', m: JSON.parse(JSON.stringify(m)) }) })
  const lati = { host: mk('host'), ospite: mk('ospite') }
  const gira = () => { while (filo.length) { const { a, m } = filo.shift(); lati[a].ricevi(m) } }
  for (let i = 0; i < 20; i++) { lati.host.avanza(0.05); lati.ospite.avanza(0.05); gira() }
  for (const [chi, posto] of [['scheletri', 0], ['guardiano', 1], ['lupi', 2]]) { lati.host.scegli('costruisci', chi, posto); lati.ospite.scegli('costruisci', chi, posto) }
  for (let i = 0; i < 600; i++) { lati.host.avanza(0.05); lati.ospite.avanza(0.05); gira() }
  controlla('mosse sullo stesso tick da tutti e due: le copie restano uguali', !lati.host.rotta && !lati.ospite.rotta && lati.host.confrontate >= 2, `${lati.host.motivo} ${lati.ospite.motivo}`)
}
riassunto('arena in due: il protocollo')
