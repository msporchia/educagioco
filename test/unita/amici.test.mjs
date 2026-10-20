/* Gli amici sul telefono (docs/core/amici.md): l'archivio, i messaggi, il collegamento che si rimette in piedi da solo e il motore
   che sa chi è online e riceve gli inviti. Il servizio è finto; quello vero lo prova servizio/inoltro/prova.mjs. */
import { dati, carica, accendi, mettiOnline, aggiungi, impara, togli, casuale, MAX_AMICI, AMICI_DI_BASE } from '../../src/store/amici.js'
import { leggi, presento, invito, risposta } from '../../src/amici/messaggi.js'
import { Ponte } from '../../src/amici/rete.js'
import { creaCodice, riscattaCodice } from '../../src/amici/rete.js'
import { stato, avvia, ferma, invita, rispondi, diciGioco, DURATA_INVITO } from '../../src/amici/servizio.js'
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
  controlla('un invito ha un gioco e dei dati', leggi(invito('arena', { terreno: 'bosco' }))?.k === 'invito' && leggi({ k: 'invito', gioco: 'arena', dati: [] }) === null && leggi({ k: 'invito', gioco: 'arena' }) === null)
  controlla('una risposta è sì o no, non altro', leggi(risposta(true)).ok === true && leggi({ k: 'risposta', ok: 'sì' }) === null)
  controlla('il resto non si legge', leggi(null) === null && leggi('x') === null && leggi({ k: 'chat', testo: 'ciao' }) === null)
}

/* ── il collegamento ── */
{
  let cambi = 0; const visti = []
  const p = new Ponte({ chiave: K1, id: 'leonardo1', servizio: 'https://s.example', WebSocketImpl: Finto, ritardi: [5, 10, 20], attesaApertura: 40,
                        alMessaggio: m => visti.push(m), alCambio: () => cambi++ })
  p.avvia()
  uguale('l\'indirizzo ha la chiave e chi sono', ultimo().url, `wss://s.example/amici/coppia/${K1}?id=leonardo1`)
  controlla('prima che si apra non si manda niente', p.invia({ k: 'x' }) === false)
  ultimo().apri()
  controlla('aperto, ma l\'amico non c\'è', p.aperto && !p.altro)
  ultimo().ricevi({ t: 'ciao', altro: false }); ultimo().ricevi({ t: 'su' })
  controlla('«su»: l\'amico c\'è', p.altro)
  ultimo().ricevi({ k: 'invito', gioco: 'arena', dati: {} }); ultimo().ricevi('non json'); ultimo().ricevi('5')
  controlla('i messaggi veri passano, i guasti si ignorano', visti.length === 1 && visti[0].k === 'invito')
  controlla('si manda JSON', p.invia({ k: 'ciao' }) && ultimo().mandati[0].k === 'ciao')
  ultimo().ricevi({ t: 'giu' })
  controlla('«giù»: l\'amico non c\'è più', !p.altro)
  const n = Finto.tutti.length
  ultimo().cadi()
  controlla('il collegamento cade: non c\'è più, e nessun errore', !p.aperto && cambi > 0)
  await pausa(30)
  controlla('dopo un po\' ne apre un altro da solo', Finto.tutti.length === n + 1)
  // un collegamento che non si apre mai: si lascia e si riprova
  const n2 = Finto.tutti.length
  await pausa(120)
  controlla('un collegamento che non si apre si lascia e se ne prova un altro', Finto.tutti.length > n2 && Finto.tutti[n2 - 1 + 0] !== undefined)
  p.chiudi()
  const n3 = Finto.tutti.length
  await pausa(60)
  controlla('chiuso, non riprova più', Finto.tutti.length === n3 && !p.aperto)
  // schermo spento: non si riprova
  let acceso = false
  const q = new Ponte({ chiave: K2, id: 'leonardo1', servizio: 'https://s.example', WebSocketImpl: Finto, visibile: () => acceso })
  const n4 = Finto.tutti.length
  q.avvia()
  controlla('a schermo spento non si apre niente', Finto.tutti.length === n4)
  acceso = true; q.riprendi()
  controlla('acceso, si apre subito', Finto.tutti.length === n4 + 1)
  q.chiudi()
  // un WebSocket che lancia: nessun errore, solo un altro tentativo
  class Rotto { constructor() { throw new Error('no') } }
  const r = new Ponte({ chiave: K2, id: 'leonardo1', servizio: 'https://s.example', WebSocketImpl: Rotto, ritardi: [5] })
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
  uguale('acceso: un collegamento per amico', Finto.tutti.length, 2)
  controlla('gli amici sono in lista ma offline, «in attesa» finché non si sa chi sono', stato.amici.length === 2 && stato.amici.every(a => !a.online && a.inAttesa))
  const [w1, w2] = Finto.tutti
  w1.apri(); w1.ricevi({ t: 'ciao', altro: true })
  controlla('quando l\'amico c\'è ci si presenta con il nome', w1.mandati[0]?.k === 'presento' && w1.mandati[0].nome === 'Leonardo' && w1.mandati[0].id === dati.id)
  w1.ricevi({ k: 'presento', id: 'melody001', nome: 'Melody', gioco: null })
  const a1 = stato.amici.find(a => a.chiave === K1)
  controlla('si presenta lui: online, con il nome, e il nome si tiene', a1.online && a1.nome === 'Melody' && dati.amici.find(a => a.chiave === K1).nome === 'Melody')
  controlla('l\'altro non è online', !stato.amici.find(a => a.chiave === K2).online)
  w1.ricevi({ k: 'presento', id: 'melody001', nome: 'Melody', gioco: 'arena' })
  uguale('si vede a cosa sta giocando', stato.amici.find(a => a.chiave === K1).gioco, 'arena')
  w1.ricevi({ t: 'giu' })
  controlla('se esce torna in grigio, ma il nome resta', !stato.amici.find(a => a.chiave === K1).online && stato.amici.find(a => a.chiave === K1).nome === 'Melody')
  w1.ricevi({ t: 'su' }); w1.ricevi({ k: 'presento', id: 'melody001', nome: 'Melody', gioco: null })

  const dati1 = { terreno: 'bosco', secondi: 10, codice: 'KXRNM' }
  w1.ricevi(invito('arena', dati1))
  controlla('un invito arriva con il nome dell\'amico', stato.invito?.nome === 'Melody' && stato.invito.gioco === 'arena' && stato.invito.dati.codice === 'KXRNM')
  w1.ricevi(invito('arena', { ...dati1, codice: 'ZZZZZ' }))
  uguale('uno alla volta: il secondo non lo sostituisce', stato.invito.dati.codice, 'KXRNM')
  const preso = rispondi(true)
  controlla('accettando torna l\'invito, e si risponde sì', preso?.dati.codice === 'KXRNM' && stato.invito === null && w1.mandati.at(-1).k === 'risposta' && w1.mandati.at(-1).ok === true)
  w1.ricevi(invito('arena', dati1))
  controlla('rifiutando non torna niente, e si risponde no', rispondi(false) === null && w1.mandati.at(-1).ok === false)
  w1.ricevi(invito('gioco-che-non-esiste', {})); w1.ricevi(invito('arena', { terreno: 'luna' })); w1.ricevi(invito('arena', { ...dati1, codice: 'abc' }))
  controlla('un invito che non capiamo non si mostra', stato.invito === null)
  w1.ricevi({ k: 'chat', testo: 'ciao' })
  controlla('e una chat non esiste: non si mostra niente', stato.invito === null)

  controlla('si invita un amico online', invita(K1, 'arena', dati1) && w1.mandati.at(-1).k === 'invito' && w1.mandati.at(-1).dati.codice === 'KXRNM')
  controlla('non si invita uno offline', invita(K2, 'arena', dati1) === false)
  controlla('né con dati che non vanno', invita(K1, 'arena', { terreno: 'luna' }) === false)
  w1.ricevi(risposta(false))
  controlla('la sua risposta arriva a chi ha invitato', stato.risposta?.ok === false && stato.risposta.chiave === K1)
  diciGioco('arena')
  uguale('si dice agli amici a cosa si gioca', w1.mandati.at(-1).gioco, 'arena')

  // il cartello scompare da solo
  w1.ricevi(invito('arena', dati1))
  controlla('l\'invito dura trenta secondi', DURATA_INVITO === 30000 && stato.invito !== null)
  ferma()
  controlla('fermo: chiusi i collegamenti e via l\'invito', w1.chiuso && w2.chiuso && stato.invito === null && stato.acceso === false)

  // senza rete: nulla si rompe
  Finto.tutti.length = 0
  avvia({ nome: 'Leonardo', WebSocketImpl: Finto, servizio: 'https://s.example', ritardi: [5] })
  Finto.tutti.forEach(w => w.cadi())
  controlla('senza rete gli amici restano in lista, in grigio, senza errori', stato.amici.length === 2 && stato.amici.every(a => !a.online))
  ferma()
  await mettiOnline(false)
  Finto.tutti.length = 0
  avvia({ nome: 'Leonardo', WebSocketImpl: Finto, servizio: 'https://s.example' })
  controlla('«mi vedono online» spento: nessun collegamento', Finto.tutti.length === 0 && stato.acceso === false)
  await mettiOnline(true); await accendi(false)
}
riassunto('amici: archivio, messaggi, collegamento e motore')
