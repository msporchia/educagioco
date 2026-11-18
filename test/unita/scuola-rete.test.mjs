/* Il client della scuola (`src/scuola/comune/rete.js`) con un orologio finto, un WebSocket finto e la lezione vera di
   `servizio/inoltro/src/lezione.js` dall'altra parte. Docs: docs/scuola/protocollo.md */
import * as L from '../../servizio/inoltro/src/lezione.js'
import { creaLezione, controllaCodice, apriBambino, apriMaestra, indirizzoScuola, TEMPI } from '../../src/scuola/comune/rete.js'
import { orologioFinto } from '../aiuto/rete-finta.mjs'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const ES = { tipo: 'tabelline', tabelline: [7] }
const orologio = orologioFinto()
const CHIAVE = 'k'.repeat(32)
const HASH = await L.hashChiave(CHIAVE)
const XHASH = await L.hashChiave('x'.repeat(32))        // l'orologio è sincrono: gli hash si preparano prima
const stato = L.nuovaLezione(L.leggiCreazione({ lezione: { id: 'l1', nome: 'T', blocchi: [{ esercizio: ES, passa: { giuste: 5 } }], inTondo: false },
  alunni: [{ id: 'a1', nome: 'Lorenzo' }, { id: 'a2', nome: 'Marta' }] }), 0, HASH)
const fili = new Set()
let giu = new Set()                  // i posti senza rete: niente si apre e niente passa

/* il servizio: la logica vera, e un filo finto con latenza fissa di 20 ms per direzione */
const collegati = () => [...fili].filter(f => f.dentro && !f.sostituito).map(f => ({ ws: f, ruolo: f.ruolo, posto: f.posto }))
const manda = invii => { for (const { a, msg } of invii) a.alTelefono(JSON.stringify(msg)) }
class WebSocketFinto {
  constructor(url) {
    const [, codice, ruolo, q] = url.match(/\/scuola\/([A-Z]{5})\/(bambino|maestra)\?(.*)$/)
    const p = new URLSearchParams(q)
    Object.assign(this, { ruolo, posto: p.get('posto'), ev: {}, stato: 0, dentro: false, buco: false, sostituito: false, ricevuti: [] })
    if (codice !== 'ABCDE') return void orologio.dopo(20, () => this.chiudi(4404))
    fili.add(this)
    orologio.dopo(20, () => {
      if (this.stato !== 0) return
      if (giu.has(this.posto || 'maestra')) return this.chiudi(1006)
      if (ruolo === 'maestra' && !L.chiaveGiusta(stato, p.get('chiave') === CHIAVE ? HASH : XHASH)) return this.chiudi(4403)
      this.stato = 1; this.emetti('open', {})
      let r
      if (ruolo === 'maestra') r = L.entraMaestra(stato, collegati(), this)
      else { r = L.entraBambino(stato, collegati(), this, this.posto); for (const v of r.sostituiti) v.sostituiscimi() }
      this.dentro = true
      manda(r.invii)
    })
  }
  addEventListener(n, f) { (this.ev[n] ||= []).push(f) }
  emetti(n, e) { for (const f of this.ev[n] || []) f(e) }
  alTelefono(testo) { orologio.dopo(20, () => { if (this.stato === 1 && !this.buco) this.emetti('message', { data: testo }) }) }
  chiudi(code) { if (this.stato === 3) return; this.stato = 3; this.emetti('close', { code }) }
  sostituiscimi() { this.sostituito = true; this.chiudi(4000) }
  send(testo) {
    if (this.stato !== 1) throw new Error('non aperto')
    if (this.buco) return
    this.mandati = (this.mandati || 0) + 1
    orologio.dopo(20, () => {
      if (this.buco || !this.dentro) return
      if (testo === '{"t":"ping"}') return this.alTelefono('{"t":"pong"}')
      const c = L.leggiMessaggio(testo, this.recenti || [], orologio.ora())
      if (!c.ok) return this.chiudi(c.codice)
      this.recenti = c.recenti
      const r = this.ruolo === 'maestra' ? L.daMaestra(stato, collegati(), c.dato) : L.daBambino(stato, collegati(), this, this.posto, c.dato)
      manda(r.invii)
    })
  }
  close() { if (this.stato === 3) return; this.dentro = false; this.chiudi(1000); const e = this; if (e.ruolo === 'bambino') manda(L.esceBambino(stato, collegati(), e.posto).invii) }
}
/* il filo cade: il servizio lo sa, il telefono no finché non lo vede chiuso */
const taglia = posto => { for (const f of fili) if (f.posto === posto && f.stato === 1) { f.buco = true; f.dentro = false; manda(L.esceBambino(stato, collegati(), posto).invii); orologio.dopo(20, () => f.chiudi(1006)) } }
const buco = posto => { for (const f of fili) if (f.posto === posto && f.stato === 1) f.buco = true }

const memoria = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), get length() { return m.size }, key: i => [...m.keys()][i], m } }
const base = { servizio: 'http://prova', orologio, WebSocketImpl: WebSocketFinto }
const ris = k => ({ blocco: 0, chiave: 'c' + k, fatto: '7x' + k, data: '' + 7 * k, attesa: '' + 7 * k, giusta: true, ms: 900 })

// la maestra: chiave giusta e sbagliata
const avanti = []
let tuttiRicevuti = null, rifiuto = null, risposteMaestra = [], fasi = [], listaAlunni = null, lineaM = []
const sbagliata = apriMaestra('ABCDE', 'x'.repeat(32), { ...base, suRifiuto: m => { rifiuto = m }, suTutto: () => { rifiuto = 'entrata!' } })
orologio.avanti(500)
uguale('la chiave sbagliata è rifiutata', rifiuto, 'chiave')
orologio.avanti(60000)
controlla('e non ci riprova', rifiuto === 'chiave' && [...fili].filter(f => f.ruolo === 'maestra').length === 1)
const codiceNo = apriMaestra('ZZZZZ', CHIAVE, { ...base, suRifiuto: m => { rifiuto = m } })
orologio.avanti(500)
uguale('un codice che non c\'è: «codice»', rifiuto, 'codice')

const maestra = apriMaestra('ABCDE', CHIAVE, { ...base, suTutto: d => { tuttiRicevuti = d }, suAlunni: a => { listaAlunni = a }, suRisposta: (a, r) => risposteMaestra.push([a, r.n]), suFase: f => fasi.push(f), suAvanti: a => avanti.push(a), suLinea: x => lineaM.push(x) })
orologio.avanti(500)
controlla('la chiave giusta entra e riceve tutto', tuttiRicevuti?.t === 'tutto' && tuttiRicevuti.alunni.length === 2)
stessaLista('la linea dice «su»', lineaM, ['su'])

// un bambino: nome, via, risposte
const mem = memoria()
let stati = [], no = [], linea = []
let b = apriBambino('abcde', { ...base, storage: mem, suStato: s => stati.push(s), suNo: p => no.push(p), suLinea: x => linea.push(x) })
orologio.avanti(500)
uguale('il bambino riceve lo stato appena entrato', stati.at(-1)?.fase, 'attesa')
b.sono('a1')
orologio.avanti(200)
uguale('sceglie il nome e lo stato lo dice', stati.at(-1).io.id, 'a1')
controlla('la maestra lo vede collegato', listaAlunni.find(a => a.id === 'a1').collegato)
const chiaveM = 'scuola:ABCDE'
const salvato = JSON.parse(mem.getItem(chiaveM))
controlla('posto e alunno stanno in localStorage', L.POSTO.test(salvato.posto) && salvato.alunno === 'a1')
// un altro PC non ruba il nome
const memAltro = memoria(); let noAltro = []
const altro = apriBambino('ABCDE', { ...base, storage: memAltro, suNo: p => noAltro.push(p) })
orologio.avanti(500); altro.sono('a1'); orologio.avanti(200)
stessaLista('un altro PC non ruba un nome preso', noAltro, ['preso'])
altro.chiudi()
maestra.via(); orologio.avanti(200)
uguale('la maestra fa partire la lezione: il bambino lo sa', stati.at(-1).fase, 'via')
stessaLista('e la maestra lo sa', fasi, ['via'])
maestra.avanti(); orologio.avanti(200)
uguale('«Avanti tutti»: il bambino lo trova nello stato', stati.at(-1).avanti, 1)
stessaLista('e la maestra lo sa', avanti, [1])

b.rispondi(ris(1)); b.rispondi(ris(2)); orologio.avanti(200)
stessaLista('due risposte: arrivano e la coda si svuota', [risposteMaestra.length, b.inCoda()], [2, 0])
uguale('lo stato del servizio le ha prese', stato.risposte.a1.length, 2)

// la rete cade: le risposte restano in coda e ripartono al rientro, senza contarsi due volte
b.dove(0)
taglia(salvato.posto); orologio.avanti(10)
b.rispondi(ris(3)); b.rispondi(ris(4))
uguale('senza rete la coda tiene le risposte', b.inCoda(), 2)
orologio.avanti(60000)
uguale('al rientro la coda riparte e si svuota', b.inCoda(), 0)
uguale('e ogni risposta è nel servizio una volta sola', stato.risposte.a1.map(r => r.n).join(), '1,2,3,4')
stessaLista('la linea è andata giù e su', linea.slice(0, 3), ['su', 'giu', 'su'])

// una risposta preso-ma-non-saputo: il filo muore dopo l'invio, la conferma si perde, il bambino la rimanda
b.rispondi(ris(5))
orologio.avanti(25)                     // arrivata al servizio, la conferma sta tornando
buco(salvato.posto)                     // ...e si perde
orologio.avanti(45000)                  // 40 s senza niente: il filo è morto, se ne apre un altro
uguale('il servizio l\'ha presa una volta', stato.risposte.a1.filter(r => r.n === 5).length, 1)
uguale('il bambino rimandandola non la duplica, e la coda si svuota', b.inCoda(), 0)
uguale('quattro, cinque risposte, non sei', stato.risposte.a1.length, 5)

// il browser si chiude con risposte non confermate: la coda riparte da `preso`
giu.add(salvato.posto); taglia(salvato.posto); orologio.avanti(100)
b.rispondi(ris(6)); b.rispondi(ris(7)); b.rispondi(ris(8))
b.chiudi()
const dopoChiuso = JSON.parse(mem.getItem(chiaveM))
uguale('la coda è in localStorage', dopoChiuso.coda.length, 3)
giu.clear()
stato.presi[salvato.posto] = 7           // il servizio ne aveva già prese due (il bambino non lo sapeva)
const b2 = apriBambino('ABCDE', { ...base, storage: mem, suStato: s => stati.push(s) })
orologio.avanti(2000)
uguale('si riparte dalla coda salvata: solo quella dopo `preso` va mandata, e si svuota', b2.inCoda(), 0)
uguale('la risposta 8 è arrivata, le 6 e 7 non due volte', stato.risposte.a1.map(r => r.n).join(), '1,2,3,4,5,8')
uguale('la numerazione continua dopo il riavvio', b2.rispondi(ris(9)), 9)
orologio.avanti(200)
uguale('anche la 9', stato.risposte.a1.at(-1).n, 9)

// la coda lunga non supera il ritmo del servizio
{
  const mem2 = memoria(); let noRitmo = []
  const c = apriBambino('ABCDE', { ...base, storage: mem2, suNo: p => noRitmo.push(p), posto: 'postolungo1' })
  orologio.avanti(500); c.sono('a2'); orologio.avanti(200)
  giu.add('postolungo1'); taglia('postolungo1'); orologio.avanti(100)
  for (let k = 1; k <= 60; k++) c.rispondi(ris(k))
  giu.clear(); orologio.avanti(30000)
  stessaLista('sessanta risposte rimandate di fila: tutte prese, nessuna chiusura per il ritmo', [stato.risposte.a2.length, c.inCoda(), noRitmo.length], [60, 0, 0])
  c.chiudi()
}

// le voci vecchie si buttano all'avvio
{
  const mem3 = memoria()
  mem3.setItem('scuola:VECCH', JSON.stringify({ nato: orologio.ora() - 3 * 3600 * 1000 - 1, posto: 'x'.repeat(10), coda: [] }))
  mem3.setItem('scuola:FRESC', JSON.stringify({ nato: orologio.ora() - 1000, posto: 'y'.repeat(10), coda: [] }))
  mem3.setItem('scuola:quaderno', JSON.stringify({ classi: [] }))
  const d = apriBambino('ABCDE', { ...base, storage: mem3 })
  controlla('una voce di più di tre ore si butta, una fresca resta', mem3.getItem('scuola:VECCH') === null && mem3.getItem('scuola:FRESC') !== null)
  controlla('le chiavi `scuola:` che non sono un codice (il quaderno della maestra) non si toccano', mem3.getItem('scuola:quaderno') !== null)
  d.chiudi()
}

// la maestra libera un nome e toglie un nuovo: il PC torna alla lista e non se lo riprende da solo
{
  const memL = memoria(); let st = []
  const g = apriBambino('ABCDE', { ...base, storage: memL, suStato: s => st.push(s), posto: 'postolibe1' })
  maestra.libera('a2')                    // lo tiene il PC della prova sul ritmo
  orologio.avanti(500); g.sono('a2'); orologio.avanti(200)
  uguale('prende il nome', st.at(-1).io?.id, 'a2')
  maestra.libera('a2'); orologio.avanti(500)
  controlla('liberato, torna senza nome e ci resta', st.at(-1).io === null && stato.alunni.find(a => a.id === 'a2').posto === null)
  g.sono({ nome: 'Ospite' }); orologio.avanti(200)
  const nuovo = st.at(-1).io
  controlla('si aggiunge come nuovo', nuovo?.nome === 'Ospite')
  maestra.togli(nuovo.id); orologio.avanti(500)
  controlla('tolto, non si ricrea da solo', st.at(-1).io === null && !stato.alunni.some(a => a.nome === 'Ospite'))
  g.chiudi()
}

// la lezione chiusa: la coda non si rimanda e il bambino lo sa
{
  const mem4 = memoria(); let st = [], n = []
  const e = apriBambino('ABCDE', { ...base, storage: mem4, suStato: s => st.push(s), suNo: p => n.push(p), posto: 'postochiu1' })
  orologio.avanti(500); e.sono('a2'); orologio.avanti(200)
  giu.add('postochiu1'); taglia('postochiu1'); orologio.avanti(100)
  e.rispondi(ris(1))
  maestra.smetti(); orologio.avanti(100)
  giu.clear(); orologio.avanti(30000)
  uguale('rientrato a lezione chiusa vede «chiusa»', st.at(-1).fase, 'chiusa')
  uguale('e la coda si butta senza mandare niente', e.inCoda(), 0)
  uguale('la risposta fuori tempo non è entrata', stato.risposte.a2?.length ?? 0, 60)
  e.chiudi()
}
uguale('la maestra ha saputo che è chiusa', fasi.at(-1), 'chiusa')

// ritardo crescente e linea: senza servizio, riprova da solo
{
  const mem5 = memoria(); const tentativi = []
  const Rotto = class { constructor() { tentativi.push(orologio.ora()); this.ev = {}; orologio.dopo(1, () => (this.ev.close || []).forEach(f => f({ code: 1006 }))) } addEventListener(n, f) { (this.ev[n] ||= []).push(f) } close() {} send() {} }
  const t0 = orologio.ora()
  const f = apriBambino('ABCDE', { ...base, storage: mem5, WebSocketImpl: Rotto, posto: 'postorotto1' })
  orologio.avanti(40000)
  const dist = tentativi.slice(1).map((t, i) => t - tentativi[i])
  stessaLista('i tentativi si fanno più radi: 1, 2, 4, 8 s, poi 10', dist.slice(0, 6).map(x => Math.round(x / 1000)), [1, 2, 4, 8, 10, 10])
  controlla('ma non oltre i 10 s (più il filo)', dist.every(x => x <= TEMPI.ritardoMax + 10))
  f.chiudi()
  const n = tentativi.length; orologio.avanti(60000)
  uguale('dopo chiudi() non riprova', tentativi.length, n)
}

// HTTP
{
  let chiamate = 0
  const f1 = async (u, o) => { chiamate++; if (chiamate < 3) throw new Error('rete'); return { status: 200, json: async () => ({ codice: 'ABCDE', chiave: CHIAVE, scade: 5 }) } }
  const r = await creaLezione({ id: 'l' }, [], { servizio: 'http://prova', fetchImpl: f1 })
  controlla('creaLezione rifà una richiesta persa', chiamate === 3 && r.codice === 'ABCDE' && r.chiave === CHIAVE && r.scade === 5)
  let errore = ''
  await creaLezione({}, [], { servizio: 'http://prova', fetchImpl: async () => { throw new Error('x') }, tentativi: 2 }).catch(e => { errore = e.message })
  controlla('senza rete l\'errore è chiaro', errore.includes('serve internet'))
  await creaLezione({}, [], { servizio: 'http://prova', fetchImpl: async () => ({ status: 429, json: async () => ({}) }) }).catch(e => { errore = e.message })
  controlla('troppe lezioni: lo dice', errore.includes('troppe lezioni'))
  const ris200 = async () => ({ status: 200, json: async () => ({ fase: 'via' }) })
  stessaLista('controllaCodice ok', Object.values(await controllaCodice('abcde', { servizio: 'http://prova', fetchImpl: ris200 })), ['ok', 'via'])
  uguale('controllaCodice no (404)', (await controllaCodice('ABCDE', { servizio: 'http://prova', fetchImpl: async () => ({ status: 404, json: async () => ({}) }) })).esito, 'no')
  uguale('controllaCodice rete', (await controllaCodice('ABCDE', { servizio: 'http://prova', fetchImpl: async () => { throw new Error('x') } })).esito, 'rete')
  uguale('un codice che non ha la forma non chiama nemmeno', (await controllaCodice('ab', { servizio: 'http://prova', fetchImpl: async () => { throw new Error('no') } })).esito, 'no')
  uguale('l\'indirizzo è quello del servizio degli amici', indirizzoScuola(), 'https://sfida.educagioco.workers.dev')
}
maestra.chiudi(); sbagliata.chiudi(); codiceNo.chiudi()
riassunto('scuola-rete')
