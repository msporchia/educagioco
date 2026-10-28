/* Castle Battle in due (docs/arena/multigiocatore.md) col pezzo comune (src/insieme/, docs/core/insieme.md): il lockstep con il
   motore della partita, la trattativa dell'incontro, e partite intere fra due telefoni su una rete finta e cattiva (cadute, fili
   morti, rete spenta, blocchi: test/aiuto/rete-finta.mjs) che devono finire uguali su tutti e due, senza rompersi. */
import { Partita } from '../../src/giochi/arena/motore/partita.js'
import { caso } from '../../src/giochi/arena/motore/banco.js'
import { truppeDelTerreno, TERRENI } from '../../src/giochi/arena/dati/regole.js'
import { CAMPI_UNITA, fotoDi, applicaFoto } from '../../src/giochi/arena/sfida/foto.js'
import { improntaDi, impronteSimili, proponi, accetta, RITMO_MONETE, ritmoPer, mossaValida } from '../../src/giochi/arena/sfida/protocollo.js'
import { motoreDi, regolaArena } from '../../src/giochi/arena/sfida/regia.js'
import { Lockstep } from '../../src/insieme/lockstep.js'
import { Incontro } from '../../src/insieme/incontro.js'
import { creaTavolo, CODICE } from '../../src/insieme/rete.js'
import { orologioFinto, reteFinta } from '../aiuto/rete-finta.mjs'
import { partitaInDue, POSTO } from '../aiuto/sfida-finta.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const TERRENO = 'neve', SEME = 77
const sfida = { truppe: truppeDelTerreno(TERRENO), umano: true, ritmoMonete: 0.5 }
const AZIONI = ['costruisci', 'potenzia', 'miniera', 'ripara', 'castello', 'bomba']
const nuovaPartita = (seme = SEME) => new Partita({ rnd: caso(seme), sfida })
const mossaACaso = (r, p) => {
  const azione = AZIONI[Math.floor(r() * AZIONI.length)]
  if (azione === 'costruisci') return [azione, p.truppeAmmesse[Math.floor(r() * p.truppeAmmesse.length)], Math.floor(r() * 6)]
  if (azione === 'potenzia') return [azione, Math.floor(r() * 6)]
  return [azione]
}

/* ── il lockstep da solo, con un filo che ritarda da `min` a `max` secondi (in ordine, come il canale) ── */
function simula({ secondi = 150, min = 0.06, max = 0.25, seme = 1, guasto = null } = {}) {
  const r = caso(seme)
  const filo = []
  const ultimo = { host: 0, ospite: 0 }
  let ora = 0
  const nuova = ruolo => {
    const s = new Lockstep({ motore: motoreDi(nuovaPartita()), ruolo, invia: d => { const a = ruolo === 'host' ? 'ospite' : 'host'; ultimo[a] = Math.max(ultimo[a], ora + min + r() * (max - min)); filo.push({ quando: ultimo[a], a, d: JSON.parse(JSON.stringify(d)) }) } })
    s.motivo = null
    s.alGuasto = motivo => { s.motivo = motivo }
    return s
  }
  const lati = { host: nuova('host'), ospite: nuova('ospite') }
  const caserme = { io: 0, nem: 0 }                         // le più caserme viste per lato
  for (let t = 0; t < secondi; t += 0.016) {
    ora = t
    for (const l of ['io', 'nem']) caserme[l] = Math.max(caserme[l], lati.host.m.partita.casermeDi(l).length)
    while (filo.length && filo[0].quando <= ora) { const { a, d } = filo.shift(); lati[a].ricevi(d) }
    filo.sort((x, y) => x.quando - y.quando)
    for (const s of Object.values(lati)) {
      s.avanza(0.016)
      if (r() < 0.02) s.scegli(mossaACaso(r, s.m.partita))
    }
    if (guasto && Math.abs(t - guasto.a) < 0.008) lati[guasto.chi].m.partita.lati.io.monete += 500      // una copia si guasta di nascosto
  }
  return { ...lati, caserme }
}

{
  const { host, ospite, caserme } = simula({})
  controlla('150 secondi con una rete lenta: nessuna delle due copie si è separata', !host.rotta && !ospite.rotta && host.riallineamenti === 0, `${host.motivo} / ${ospite.motivo} ${host.riallineamenti}`)
  controlla('le impronte sono state confrontate davvero, a ogni 5 secondi di partita', host.confrontate >= 15 && ospite.confrontate >= 15, `${host.confrontate}/${ospite.confrontate}`)
  controlla('la partita è andata avanti (più di due minuti)', host.m.partita.t > 100 && ospite.m.partita.t > 100, `${host.m.partita.t.toFixed(0)}/${ospite.m.partita.t.toFixed(0)}`)
  controlla('e tutti e due hanno costruito', caserme.io > 0 && caserme.nem > 0, JSON.stringify(caserme))
}
{
  const { host, ospite } = simula({ seme: 5, min: 0.2, max: 0.6 })
  controlla('con la rete molto lenta (fino a 0,6 s) la partita aspetta ma non si separa', !host.rotta && !ospite.rotta && host.m.partita.t > 60, `${host.motivo} / ${ospite.motivo} ${host.m.partita.t}`)
}
{
  const { host, ospite } = simula({ seme: 9, guasto: { chi: 'ospite', a: 40 } })
  controlla('una copia che si guasta di nascosto viene scoperta e riallineata, la sfida non finisce', !host.rotta && !ospite.rotta && host.riallineamenti === 1 && ospite.riallineamenti === 1, `${host.motivo} ${ospite.motivo} ${host.riallineamenti}/${ospite.riallineamenti}`)
  controlla('dopo il riallineamento le impronte tornano a coincidere e la partita va avanti', host.confrontate > 20 && ospite.confrontate > 20 && host.m.partita.t > 100 && !host.riallineo && !ospite.riallineo, `${host.confrontate} ${host.m.partita.t.toFixed(0)}`)
}
{
  // la fotografia porta tutto: ogni campo di un'unità, e il caso (se manca, le copie si separano di nuovo subito)
  const { host } = simula({ seme: 3, secondi: 90 })
  const p = host.m.partita
  const mancano = new Set()
  for (const u of p.unita) for (const c of Object.keys(u)) if (!CAMPI_UNITA.includes(c)) mancano.add(c)
  controlla('la fotografia nomina ogni campo di un\'unità', mancano.size === 0 && p.unita.length > 0, [...mancano].join(','))
  const copia = nuovaPartita()
  applicaFoto(copia, JSON.parse(JSON.stringify(fotoDi(p))))
  controlla('rimessa dalla fotografia, la copia ha la stessa impronta', impronteSimili(improntaDi(copia), improntaDi(p)))
  for (let i = 0; i < 400; i++) { p.avanza(0.05); copia.avanza(0.05) }
  controlla('e da lì le due copie corrono uguali (anche il caso)', JSON.stringify(improntaDi(copia)) === JSON.stringify(improntaDi(p)))
  const vicina = improntaDi(p).map((x, i) => i === 1 ? x + 0.4 : x)
  controlla('uno scarto da ultima cifra non è una separazione', impronteSimili(improntaDi(p), vicina))
  controlla('uno scarto grosso sì', !impronteSimili(improntaDi(p), improntaDi(p).map((x, i) => i === 1 ? x + 500 : x)))
  controlla('e una truppa in più o in meno pure', !impronteSimili(improntaDi(p), improntaDi(p).map((x, i) => i === 11 ? x + 1 : x)))
}
{
  const nuovo = () => { const s = new Lockstep({ motore: motoreDi(nuovaPartita(1)), ruolo: 'host', invia: () => {} }); s.alGuasto = () => {}; return s }
  const s1 = nuovo(); s1.ricevi({ t: 'k', h: 3, c: [] })
  controlla('una promessa che torna indietro nel tempo si rifiuta', s1.rotta !== null)
  const s2 = nuovo(); s2.ricevi({ t: 'k', h: 30, c: [[2, ['costruisci', 'scheletri', 0]]] })
  controlla('una mossa di un tick già promesso si rifiuta', s2.rotta !== null)
  const s3 = nuovo(); s3.ricevi({ t: 'k', h: 30, c: [[20, ['regala-monete']]] })
  controlla('un\'azione che non esiste si rifiuta', s3.rotta !== null)
  const s4 = nuovo(); s4.ricevi({ t: 'k', h: 1e9, c: [] })
  controlla('e una promessa di un futuro lontano', s4.rotta !== null)
  const s5 = nuovo(); s5.ricevi({ t: 'fine', f: 'x'.repeat(50) })
  controlla('e una fine senza senso', s5.rotta !== null)
  controlla('le mosse vere passano, quelle storte no', mossaValida(['costruisci', 'scheletri', 3]) && mossaValida(['bomba']) && !mossaValida(['potenzia', 99]) && !mossaValida([]))
}
{
  uguale('regole valide: si parte', accetta(proponi({ seme: 5, terreno: 'lava' }), { terreni: TERRENI }), null)
  uguale('un terreno che non esiste: no', accetta(proponi({ seme: 5, terreno: 'deserto' }), { terreni: TERRENI }), 'proposta')
  uguale('monete troppo veloci: no', accetta(proponi({ seme: 5, terreno: 'lava', ritmoMonete: RITMO_MONETE.max + 1 }), { terreni: TERRENI }), 'proposta')
  const a = nuovaPartita(1), b = new Partita({ rnd: caso(1), sfida: { ...sfida, ritmoMonete: 1 } })
  controlla('in due le monete sono uguali per tutti e due, e il ritmo lo decide l\'host',
            a.lati.io.alSecondo === a.lati.nem.alSecondo && b.lati.io.alSecondo === 2 * a.lati.io.alSecondo && a.forza.nem === 1)
  uguale('con dieci secondi a risposta le monete corrono a un quinto di quelle del campo fermo', +ritmoPer(10).toFixed(2), 0.2)
  controlla('chi risponde più piano ha monete più lente, chi è più svelto più veloci', ritmoPer(15) < ritmoPer(10) && ritmoPer(10) < ritmoPer(6))
}
{
  // mosse di tutti e due che cadono sullo stesso tick, date nello stesso istante: ogni copia le riceve in un ordine suo
  const filo = []
  const mk = ruolo => new Lockstep({ motore: motoreDi(nuovaPartita()), ruolo, invia: d => filo.push({ a: ruolo === 'host' ? 'ospite' : 'host', d: JSON.parse(JSON.stringify(d)) }) })
  const lati = { host: mk('host'), ospite: mk('ospite') }
  const gira = () => { while (filo.length) { const { a, d } = filo.shift(); lati[a].ricevi(d) } }
  for (let i = 0; i < 20; i++) { lati.host.avanza(0.05); lati.ospite.avanza(0.05); gira() }
  for (const [chi, posto] of [['scheletri', 0], ['guardiano', 1], ['lupi', 2]]) { lati.host.scegli(['costruisci', chi, posto]); lati.ospite.scegli(['costruisci', chi, posto]) }
  for (let i = 0; i < 600; i++) { lati.host.avanza(0.05); lati.ospite.avanza(0.05); gira() }
  controlla('mosse sullo stesso tick da tutti e due: le copie restano uguali', !lati.host.rotta && !lati.ospite.rotta && lati.host.confrontate >= 2 && lati.host.riallineamenti === 0)
  // una copia arriva alla fine prima dell'altra: l'altra chiude uguale
  lati.ospite.m.partita.castelli.find(c => c.lato === 'nem').hp = 0          // solo sull'ospite il suo castello è caduto
  for (let i = 0; i < 10; i++) { lati.host.avanza(0.05); lati.ospite.avanza(0.05); gira() }
  controlla('se una copia finisce prima, l\'altra finisce con lei', !!lati.ospite.m.partita.fine && lati.host.m.partita.fine === lati.ospite.m.partita.fine, `${lati.host.m.partita.fine}/${lati.ospite.m.partita.fine}`)
}

/* ── il tavolo: crearlo ── */
{
  const ok = await creaTavolo({ servizio: 'http://x', fetchImpl: async u => ({ ok: true, status: 200, url: u, json: async () => ({ codice: 'KXRNM' }) }) })
  uguale('si crea un tavolo e si ha il codice', ok, 'KXRNM')
  controlla('il codice è di 5 lettere', CODICE.test(ok))
  const errore = async fetchImpl => creaTavolo({ servizio: 'http://x', fetchImpl }).then(() => '', e => e.message)
  controlla('senza internet si dice che serve', /internet/.test(await errore(async () => { throw new Error('rete') })))
  controlla('troppi tavoli si dice', /troppe/.test(await errore(async () => ({ ok: false, status: 429 }))))
  controlla('un servizio che non risponde bene si dice', /non risponde/.test(await errore(async () => ({ ok: false, status: 500 }))))
  let chiamate = 0
  const dopoUna = await creaTavolo({ servizio: 'http://x', attesa: 20, fetchImpl: (u, { signal }) => (++chiamate === 1
    ? new Promise((_, no) => signal.addEventListener('abort', () => no(new Error('abort'))))
    : Promise.resolve({ ok: true, status: 200, json: async () => ({ codice: 'KXRNM' }) })) })
  controlla('una richiesta di creazione persa si rifà, e il codice arriva', dopoUna === 'KXRNM' && chiamate === 2)
}

/* ── due telefoni veri (quasi): l'incontro, il canale e la rete finta ── */
function incontro({ seme = 1, min = 40, max = 160, firmaOspite = 'F', terreno = 'lava', secondi = 6 } = {}) {
  const orologio = orologioFinto()
  const rete = reteFinta({ orologio, rnd: caso(seme), min, max })
  const codice = rete.nuovo(POSTO.host)
  const opzioni = posto => ({ posto, servizio: 'https://finto', WebSocketImpl: rete.WebSocketImpl, tempo: orologio, ascolta: false })
  const host = new Incontro({ codice, regola: regolaArena({ firma: 'F' }), scelte: { terreno, secondiARisposta: secondi, seme: seme * 13 }, opzioni: opzioni(POSTO.host) })
  orologio.avanti(400)
  const ospite = new Incontro({ codice, regola: regolaArena({ firma: firmaOspite }), opzioni: opzioni(POSTO.ospite) })
  orologio.avanti(1500)
  return { orologio, rete, host, ospite }
}
const piano = console.warn
console.warn = () => {}                                  // la rotta la scrive in console: qui la si legge dallo stato

{
  const { host, ospite } = incontro({ firmaOspite: 'G' })
  uguale('versioni diverse: nessuno gioca', `${host.stato}/${ospite.stato}`, 'rotta/rotta')
  controlla('e si dice cosa fare, a tutti e due', /versione diversa/.test(host.motivo) && /versione diversa/.test(ospite.motivo), `${host.motivo} | ${ospite.motivo}`)
}
{
  const d = incontro({ seme: 2 })
  uguale('stessa versione: dopo la trattativa giocano tutti e due', `${d.host.stato}/${d.ospite.stato}`, 'gioco/gioco')
  uguale('con lo stesso terreno', `${d.host.proposta.terreno}/${d.ospite.proposta.terreno}`, 'lava/lava')
  uguale('chi ha creato è l\'host, chi è entrato l\'ospite', `${d.host.ruolo}/${d.ospite.ruolo}`, 'host/ospite')
  for (let i = 0; i < 300; i++) { d.orologio.avanti(16); d.host.avanza(0.016); d.ospite.avanza(0.016) }
  d.host.chiudi()
  for (let i = 0; i < 300; i++) { d.orologio.avanti(16); d.ospite.avanza(0.016) }
  uguale('se uno esce a partita in corso, l\'altro lo sa subito (non dopo un silenzio)', d.ospite.stato, 'rotta')
  controlla('con una frase da dire', /se n'è andato/.test(d.ospite.motivo), d.ospite.motivo)
}

/* Partite intere su una rete cattiva (test/aiuto/sfida-finta.mjs): l'host costruisce di più (così la partita finisce), tutti e due
   fanno mosse, e un guasto e mezzo al minuto. Alla fine: nessuna rottura, le copie mai separate, se finisce finisce uguale. */
const RETE_CATTIVA = { min: 30, max: 350, alMinuto: 1.5, spenta: [2000, 42000], ferma: [1000, 9000] }
let finite = 0
for (const seme of [21, 22, 23, 24]) {
  const { host, ospite, guasti: visti, linee, rete } = partitaInDue({ seme, scenario: RETE_CATTIVA })
  const n = Object.values(visti).reduce((s, x) => s + x, 0)
  const ph = host.partita, po = ospite.partita
  if (ph?.fine && po?.fine) finite++
  controlla(`seme ${seme}: ${n} guasti di rete (${JSON.stringify(visti)}) e la sfida non si rompe mai`,
            host.stato === 'gioco' && ospite.stato === 'gioco', `${host.stato} ${ospite.stato}; ${host.motivo} | ${ospite.motivo}`)
  controlla(`seme ${seme}: la partita va avanti su tutti e due, alla pari (fino alla fine, o per più di cinque minuti di gioco)`,
            (ph?.fine || ph?.t > 300) && Math.abs(ph.t - po.t) < 2, `${ph?.t.toFixed(0)} s / ${po?.t.toFixed(0)} s`)
  controlla(`seme ${seme}: se finisce, finisce allo stesso modo`, (ph?.fine || null) === (po?.fine || null), `${ph?.fine}/${po?.fine}`)
  controlla(`seme ${seme}: le copie non si sono mai separate (${host.lockstep?.confrontate} impronte confrontate)`, host.lockstep?.riallineamenti === 0 && host.lockstep?.confrontate > 10, `${host.lockstep?.riallineamenti}`)
  controlla(`seme ${seme}: nessun filo chiuso dal servizio per troppi messaggi`, rete.conta.rifiutati === 0, String(rete.conta.rifiutati))
  if (n) controlla(`seme ${seme}: i guasti si sono visti come «linea giù», non come fine`, [...linee].some(l => l !== 'su/su'), [...linee].join(' '))
}
controlla('e la maggior parte delle partite arriva fino alla fine (un castello cade)', finite >= 3, `${finite} su 4`)
console.warn = piano
riassunto('arena in due: il lockstep, l\'incontro e partite intere su una rete cattiva')
