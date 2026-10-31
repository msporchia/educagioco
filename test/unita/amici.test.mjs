/* Gli amici sul telefono (docs/core/amici.md): l'archivio, i messaggi, il collegamento che si rimette in piedi da solo e il motore
   che sa chi è online e riceve gli inviti. Il servizio è finto; quello vero lo prova servizio/inoltro/prova.mjs. */
import { dati, carica, accendi, mettiOnline, aggiungi, impara, togli, casuale, MAX_AMICI, AMICI_DI_BASE } from '../../src/store/amici.js'
import { leggi, presento, invito, risposta, qui, via } from '../../src/amici/messaggi.js'
import { Ponte } from '../../src/amici/rete.js'
import { creaCodice, riscattaCodice } from '../../src/amici/rete.js'
import { stato, avvia, ferma, invita, rispondi, diciGioco, aggiungiPonte, togliPonte, DURATA_INVITO } from '../../src/amici/servizio.js'
import { chiediIngresso, ingresso } from '../../src/amici/ingresso.js'
import { usaSfida } from '../../src/insieme/sfida.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const pausa = ms => new Promise(r => setTimeout(r, ms))
const K1 = 'a'.repeat(32), K2 = 'b'.repeat(32)

class Finto {
  static tutti = []
  constructor(url) { this.url = url; this.ev = {}; this.mandati = []; Finto.tutti.push(this) }
  addEventListener(n, f) { this.ev[n] = f }
  send(x) { this.mandati.push(JSON.parse(x)) }
  close() { this.chiuso = true }
  apri() { this.ev.open?.() }
  ricevi(o) { this.ev.message?.({ data: typeof o === 'string' ? o : JSON.stringify(o) }) }
  cadi() { this.ev.close?.() }
}
const ultimo = () => Finto.tutti[Finto.tutti.length - 1]

/* ── l'archivio ── */
{
  controlla('di partenza le funzioni online sono spente', AMICI_DI_BASE === false)
  await carica('prova1')
  controlla('un bambino nuovo: spento, non deciso, online, senza amici, con un id suo', dati.attivo === false && dati.deciso === false && dati.online === true && dati.amici.length === 0 && /^[a-z0-9]{16}$/.test(dati.id))
  const id = dati.id
  await accendi(true)
  await carica('prova1')
  controlla('accendere si ricorda, e l\'id resta lo stesso', dati.attivo === true && dati.deciso === true && dati.id === id)
  controlla('un\'amicizia nuova ha solo la chiave', aggiungi(K1) && dati.amici[0].id === null && dati.amici[0].nome === '')
  controlla('la stessa chiave non si aggiunge due volte', aggiungi(K1) === false && dati.amici.length === 1)
  impara(K1, 'melody001', '  Melody  ')
  uguale('il nome dell\'amico si impara, senza spazi', dati.amici[0].nome, 'Melody')
  await carica('prova1')
  controlla('e si ricorda anche dopo, offline', dati.amici[0].nome === 'Melody' && dati.amici[0].id === 'melody001')
  impara(K1, 'melody001', 'Mel')
  uguale('se cambia nome si aggiorna', dati.amici[0].nome, 'Mel')
  controlla('un nome troppo lungo si taglia a venti', (impara(K1, 'melody001', 'x'.repeat(50)), dati.amici[0].nome.length === 20))
  controlla('chi non è un amico non si impara', impara(K2, 'altro0001', 'Boh') === false)
  for (let i = 0; i < MAX_AMICI + 2; i++) aggiungi(casuale(32))
  uguale('al massimo sei amici', dati.amici.length, MAX_AMICI)
  togli(K1)
  controlla('togliere butta l\'amicizia', !dati.amici.some(a => a.chiave === K1))
  await carica('prova2')
  controlla('un altro bambino ha i suoi amici, non quelli di prima', dati.amici.length === 0 && dati.attivo === false)
  await mettiOnline(false); await carica('prova2')
  uguale('«mi vedono online» spento si ricorda', dati.online, false)
  await carica('prova1'); await accendi(false)
}

/* ── i messaggi ── */
{
  uguale('un presento giusto', JSON.stringify(leggi(presento('leonardo1', 'Leonardo', 'arena'))), JSON.stringify({ k: 'presento', id: 'leonardo1', nome: 'Leonardo', gioco: 'arena' }))
  controlla('un id storto non passa', leggi({ k: 'presento', id: 'X', nome: 'a' }) === null)
  controlla('un nome che non è testo non passa', leggi({ k: 'presento', id: 'leonardo1', nome: 5 }) === null)
  controlla('un gioco con simboli diventa «niente»', leggi({ k: 'presento', id: 'leonardo1', nome: 'L', gioco: '<script>' }).gioco === null)
  // il contadino nella fattoria in comune (docs/fattoria3d/in-comune.md)
  const q = leggi(qui({ x: 3.14159, z: -2, d: 1.5, r: true, g: 'falcia', a: { persona: 'contadina', cappello: 'paglia' } }))
  controlla('dove sta il contadino arriva arrotondato, col gesto e l\'abito', q.k === 'qui' && q.x === 3.14 && q.r && q.g === 'falcia' && q.a.cappello === 'paglia')
  controlla('un gesto che non c\'è diventa «niente», un capo con simboli si toglie', leggi({ k: 'qui', x: 1, z: 1, d: 0, g: 'balla', a: { cappello: '<b>' } }).g === null && leggi({ k: 'qui', x: 1, z: 1, d: 0, a: { cappello: '<b>' } }).a === null)
  controlla('un posto che non è un numero non passa', leggi({ k: 'qui', x: 'a', z: 1, d: 0 }) === null && leggi({ k: 'qui', x: 1e9, z: 1, d: 0 }) === null)
  controlla('«via» quando esce', leggi(via())?.k === 'via' && JSON.stringify(qui({ x: 1, z: 2, d: 0 })).length < 80)
  controlla('un invito ha un gioco e dei dati', leggi(invito('arena', { terreno: 'bosco' }))?.k === 'invito' && leggi({ k: 'invito', gioco: 'arena', dati: [] }) === null && leggi({ k: 'invito', gioco: 'arena' }) === null)
  controlla('una risposta è sì o no, non altro', leggi(risposta(true)).ok === true && leggi({ k: 'risposta', ok: 'sì' }) === null)
  controlla('il resto non si legge', leggi(null) === null && leggi('x') === null && leggi({ k: 'chat', testo: 'ciao' }) === null)
}

/* ── il collegamento ── */
{
  let cambi = 0; const visti = []
  let chiavi = [K1]
  const p = new Ponte({ id: 'leonardo1', chiavi: () => chiavi, servizio: 'https://s.example', WebSocketImpl: Finto, ritardi: [5, 10, 20], attesaApertura: 40,
                        alMessaggio: (c, m) => visti.push([c, m]), alCambio: () => cambi++ })
  p.avvia()
  uguale('l\'indirizzo è quello della presenza, uno solo per tutti', ultimo().url, 'wss://s.example/amici/presenza')
  controlla('prima che si apra non si manda niente', p.invia(K1, { k: 'x' }) === false)
  ultimo().apri()
  controlla('aperto, si dichiara chi si è e con quali chiavi', p.aperto && ultimo().mandati[0].k === 'dichiaro' && ultimo().mandati[0].id === 'leonardo1' && ultimo().mandati[0].chiavi[0] === K1)
  ultimo().ricevi({ t: 'ciao', presenti: [], rifiutate: [] })
  controlla('nessun amico c\'è', p.presenti.size === 0)
  ultimo().ricevi({ t: 'su', chiave: K1 })
  controlla('«su»: l\'amico di quella chiave c\'è', p.presenti.has(K1))
  ultimo().ricevi({ t: 'da', chiave: K1, m: { k: 'invito', gioco: 'arena', dati: {} } }); ultimo().ricevi('non json'); ultimo().ricevi('5'); ultimo().ricevi({ t: 'da', chiave: K1, m: 'testo' })
  controlla('i messaggi veri passano con la chiave, i guasti si ignorano', visti.length === 1 && visti[0][0] === K1 && visti[0][1].k === 'invito')
  controlla('si manda a un amico incartando con la sua chiave', p.invia(K1, { k: 'ciao' }) && JSON.stringify(ultimo().mandati.at(-1)) === JSON.stringify({ k: 'a', chiave: K1, m: { k: 'ciao' } }))
  chiavi = [K1, K2]; p.imposta()
  controlla('un\'amicizia in più si dice al servizio, senza riaprire', ultimo().mandati.at(-1).k === 'dichiaro' && ultimo().mandati.at(-1).chiavi.length === 2)
  ultimo().ricevi({ t: 'giu', chiave: K1 })
  controlla('«giù»: l\'amico non c\'è più', !p.presenti.has(K1))
  const n = Finto.tutti.length
  ultimo().cadi()
  controlla('il collegamento cade: non c\'è più, e nessun errore', !p.aperto && cambi > 0)
  await pausa(30)
  controlla('dopo un po\' ne apre un altro da solo', Finto.tutti.length === n + 1)
  const n2 = Finto.tutti.length
  await pausa(120)
  controlla('un collegamento che non si apre si lascia e se ne prova un altro', Finto.tutti.length > n2)
  p.chiudi()
  const n3 = Finto.tutti.length
  await pausa(60)
  controlla('chiuso, non riprova più', Finto.tutti.length === n3 && !p.aperto)
  // schermo spento: non si riprova
  let acceso = false
  const q = new Ponte({ id: 'leonardo1', servizio: 'https://s.example', WebSocketImpl: Finto, visibile: () => acceso })
  const n4 = Finto.tutti.length
  q.avvia()
  controlla('a schermo spento non si apre niente', Finto.tutti.length === n4)
  acceso = true; q.riprendi()
  controlla('acceso, si apre subito', Finto.tutti.length === n4 + 1)
  q.chiudi()
  class Rotto { constructor() { throw new Error('no') } }
  const r = new Ponte({ id: 'leonardo1', servizio: 'https://s.example', WebSocketImpl: Rotto, ritardi: [5] })
  let lanciato = false
  try { r.avvia() } catch { lanciato = true }
  controlla('un WebSocket che si rompe non lancia', !lanciato)
  r.chiudi()
}

/* ── i codici (HTTP finto) ── */
{
  const finto = (stato, corpo) => async () => ({ status: stato, ok: stato < 400, json: async () => corpo })
  const cod = await creaCodice(K1, { servizio: 'http://x', fetchImpl: finto(200, { codice: 'KXRNM', scade: 1 }) })
  uguale('si crea un codice', cod.codice, 'KXRNM')
  const errore = async (f, ...a) => f(...a).then(() => '', e => e.message)
  controlla('senza rete si dice che serve', /internet/.test(await errore(creaCodice, K1, { servizio: 'http://x', tentativi: 2, fetchImpl: async () => { throw new Error('rete') } })))
  controlla('troppi codici si dice', /troppi/.test(await errore(creaCodice, K1, { servizio: 'http://x', fetchImpl: finto(429, {}) })))
  uguale('riscattando si ha la chiave', await riscattaCodice('kxrnm', { servizio: 'http://x', fetchImpl: finto(200, { chiave: K1 }) }), K1)
  controlla('un codice sbagliato si dice', /non c'è|scaduto/.test(await errore(riscattaCodice, 'AAAAA', { servizio: 'http://x', fetchImpl: finto(404, {}) })))
  controlla('troppi tentativi si dice', /minuto/.test(await errore(riscattaCodice, 'AAAAA', { servizio: 'http://x', fetchImpl: finto(429, {}) })))
  let chiamate = 0
  const dopoUna = await creaCodice(K1, { servizio: 'http://x', attesa: 20, fetchImpl: (u, { signal }) => (++chiamate === 1
    ? new Promise((_, no) => signal.addEventListener('abort', () => no(new Error('abort')))) : finto(200, { codice: 'KXRNM', scade: 1 })()) })
  controlla('una richiesta persa si rifà', dopoUna.codice === 'KXRNM' && chiamate === 2)
}

/* ── il motore ── */
{
  await carica('motore1')
  Finto.tutti.length = 0
  avvia({ nome: 'Leonardo', WebSocketImpl: Finto, servizio: 'https://s.example' })
  controlla('spento (i grandi non hanno acceso): nessun collegamento, nessun errore', Finto.tutti.length === 0 && stato.acceso === false && stato.amici.length === 0)
  await accendi(true); aggiungi(K1); aggiungi(K2)
  avvia({ nome: 'Leonardo', WebSocketImpl: Finto, servizio: 'https://s.example', ritardi: [5] })
  uguale('acceso: UN collegamento solo, anche con due amici', Finto.tutti.length, 1)
  controlla('gli amici sono in lista ma offline, «in attesa» finché non si sa chi sono', stato.amici.length === 2 && stato.amici.every(a => !a.online && a.inAttesa))
  const w = Finto.tutti[0]
  w.apri()
  controlla('ci si dichiara con tutte le chiavi', w.mandati[0].k === 'dichiaro' && w.mandati[0].chiavi.length === 2)
  w.ricevi({ t: 'ciao', presenti: [K1], rifiutate: [] })
  const prima = w.mandati.find(m => m.k === 'a' && m.chiave === K1)
  controlla('un amico già c\'è: ci si presenta con il nome, solo a lui', prima?.m.k === 'presento' && prima.m.nome === 'Leonardo' && prima.m.id === dati.id && !w.mandati.some(m => m.k === 'a' && m.chiave === K2))
  w.ricevi({ t: 'da', chiave: K1, m: { k: 'presento', id: 'melody001', nome: 'Melody', gioco: null } })
  const a1 = stato.amici.find(a => a.chiave === K1)
  controlla('si presenta lui: online, con il nome, e il nome si tiene', a1.online && a1.nome === 'Melody' && dati.amici.find(a => a.chiave === K1).nome === 'Melody')
  controlla('l\'altro non è online', !stato.amici.find(a => a.chiave === K2).online)
  w.ricevi({ t: 'da', chiave: K1, m: { k: 'presento', id: 'melody001', nome: 'Melody', gioco: 'arena' } })
  uguale('si vede a cosa sta giocando', stato.amici.find(a => a.chiave === K1).gioco, 'arena')
  w.ricevi({ t: 'giu', chiave: K1 })
  controlla('se esce torna in grigio, ma il nome resta', !stato.amici.find(a => a.chiave === K1).online && stato.amici.find(a => a.chiave === K1).nome === 'Melody')
  w.ricevi({ t: 'su', chiave: K1 })
  controlla('quando rientra ci si ripresenta', w.mandati.filter(m => m.k === 'a' && m.chiave === K1 && m.m.k === 'presento').length === 2)
  w.ricevi({ t: 'da', chiave: K1, m: { k: 'presento', id: 'melody001', nome: 'Melody', gioco: null } })

  const dati1 = { terreno: 'bosco', secondi: 10, codice: 'KXRNM' }
  w.ricevi({ t: 'da', chiave: K1, m: invito('arena', dati1) })
  controlla('un invito arriva con il nome dell\'amico', stato.invito?.nome === 'Melody' && stato.invito.gioco === 'arena' && stato.invito.dati.codice === 'KXRNM' && stato.invito.chiave === K1)
  w.ricevi({ t: 'da', chiave: K1, m: invito('arena', { ...dati1, codice: 'ZZZZZ' }) })
  uguale('uno alla volta: il secondo non lo sostituisce', stato.invito.dati.codice, 'KXRNM')
  const preso = rispondi(true)
  controlla('accettando torna l\'invito, e si risponde sì a quell\'amico', preso?.dati.codice === 'KXRNM' && stato.invito === null && w.mandati.at(-1).chiave === K1 && w.mandati.at(-1).m.ok === true)
  w.ricevi({ t: 'da', chiave: K1, m: invito('arena', dati1) })
  controlla('rifiutando non torna niente, e si risponde no', rispondi(false) === null && w.mandati.at(-1).m.ok === false)
  for (const m of [invito('gioco-che-non-esiste', {}), invito('arena', { terreno: 'luna' }), invito('arena', { ...dati1, codice: 'abc' }), { k: 'chat', testo: 'ciao' }]) w.ricevi({ t: 'da', chiave: K1, m })
  controlla('un invito che non capiamo e una chat non si mostrano', stato.invito === null)

  controlla('si invita un amico online', invita(K1, 'arena', dati1) && w.mandati.at(-1).chiave === K1 && w.mandati.at(-1).m.dati.codice === 'KXRNM')
  controlla('non si invita uno offline', invita(K2, 'arena', dati1) === false)
  controlla('né con dati che non vanno', invita(K1, 'arena', { terreno: 'luna' }) === false)
  w.ricevi({ t: 'da', chiave: K1, m: risposta(false) })
  controlla('la sua risposta arriva a chi ha invitato', stato.risposta?.ok === false && stato.risposta.chiave === K1)
  diciGioco('arena')
  controlla('si dice agli amici a cosa si gioca (a chi c\'è)', w.mandati.at(-1).chiave === K1 && w.mandati.at(-1).m.gioco === 'arena')

  w.ricevi({ t: 'da', chiave: K1, m: invito('arena', dati1) })
  controlla('l\'invito dura trenta secondi', DURATA_INVITO === 30000 && stato.invito !== null)
  // un'amicizia nuova mentre si gioca
  const K3 = 'c'.repeat(32)
  aggiungi(K3); aggiungiPonte()
  controlla('un\'amicizia nuova si dichiara senza riaprire', Finto.tutti.length === 1 && w.mandati.at(-1).k === 'dichiaro' && w.mandati.at(-1).chiavi.includes(K3))
  togli(K3); togliPonte(K3)
  controlla('e una tolta si dice allo stesso modo', !w.mandati.at(-1).chiavi.includes(K3))
  ferma()
  controlla('fermo: chiuso il collegamento e via l\'invito', w.chiuso && stato.invito === null && stato.acceso === false)

  // senza rete: nulla si rompe
  Finto.tutti.length = 0
  avvia({ nome: 'Leonardo', WebSocketImpl: Finto, servizio: 'https://s.example', ritardi: [5] })
  Finto.tutti.forEach(x => x.cadi())
  controlla('senza rete gli amici restano in lista, in grigio, senza errori', stato.amici.length === 2 && stato.amici.every(a => !a.online))
  ferma()
  await mettiOnline(false)
  Finto.tutti.length = 0
  avvia({ nome: 'Leonardo', WebSocketImpl: Finto, servizio: 'https://s.example' })
  controlla('«mi vedono online» spento: nessun collegamento', Finto.tutti.length === 0 && stato.acceso === false)
  await mettiOnline(true); await accendi(false)
}
/* ── «Gioca» dalla lista degli amici: il gioco si apre sulla sala, con l'amico già scelto e senza entrare in nessun tavolo ── */
{
  let mostrata = 0
  const sfida = usaSfida({ gioco: 'arena', regola: () => null, alVia: () => {}, mostra: () => { mostrata++ } })
  chiediIngresso('sotterraneo', { amico: K1 })
  sfida.daInvito()
  controlla('un ingresso di un altro gioco non si tocca', mostrata === 0 && sfida.scelto.value === '' && ingresso.value?.gioco === 'sotterraneo')
  chiediIngresso('arena', { amico: K1 })
  sfida.daInvito()
  controlla('il gioco giusto mostra la sala, con l\'amico scelto', mostrata === 1 && sfida.scelto.value === K1 && ingresso.value === null)
  controlla('e resta sulle scelte: nessun tavolo, nessun codice', sfida.fase.value === 'scelta' && !sfida.regia.value && sfida.codice.value === '')
  sfida.apri()
  controlla('riaperta la sala dal gioco, l\'amico di prima non è più scelto', sfida.scelto.value === '')
}
riassunto('amici: archivio, messaggi, collegamento motore e «Gioca» dalla lista')
