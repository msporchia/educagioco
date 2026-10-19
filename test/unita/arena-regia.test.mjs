/* La regia della sfida e il filo verso il servizio, con un servizio finto in memoria (quello vero fa lo stesso: assegna i
   ruoli, dice `pronti` quando sono in due, gira i messaggi e dice `via` quando uno se ne va). */
import { Regia } from '../../src/giochi/arena/sfida/regia.js'
import { creaStanza, collega, CODICE } from '../../src/giochi/arena/sfida/rete.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

/* un servizio finto: due canali per stanza, consegna subito (o quando si chiama `gira`) */
function servizioFinto() {
  const dentro = []
  const coda = []
  const canale = (regia, nome) => ({
    invia: m => coda.push({ a: nome === 'a' ? 'b' : 'a', m: JSON.parse(JSON.stringify(m)) }),
    chiudi: () => { const altro = nome === 'a' ? dentro[1] : dentro[0]; if (altro) coda.push({ a: nome === 'a' ? 'b' : 'a', m: { t: 'via' } }) },
  })
  return {
    entra(regia) {
      const nome = dentro.length === 0 ? 'a' : 'b'
      dentro.push(regia)
      regia.canale = canale(regia, nome)
      regia.ricevi({ t: 'ciao', ruolo: nome === 'a' ? 'host' : 'ospite' })
      if (dentro.length === 2) { dentro[0].ricevi({ t: 'pronti' }); dentro[1].ricevi({ t: 'pronti' }) }
    },
    gira() { while (coda.length) { const { a, m } = coda.shift(); (a === 'a' ? dentro[0] : dentro[1]).ricevi(m) } },
  }
}

function coppia({ firmaOspite = 'F', terreno = 'lava' } = {}) {
  const s = servizioFinto()
  const host = new Regia({ canale: null, host: { terreno, secondiARisposta: 10 }, firma: 'F', seme: 42 })
  const ospite = new Regia({ canale: null, firma: firmaOspite })
  s.entra(host); s.entra(ospite)
  s.gira()
  return { s, host, ospite }
}

{
  const { s, host, ospite } = coppia()
  uguale('l\'host è l\'host e l\'ospite l\'ospite', host.ruolo + '/' + ospite.ruolo, 'host/ospite')
  uguale('dopo la trattativa tutti e due giocano', host.stato + '/' + ospite.stato, 'gioco/gioco')
  uguale('con lo stesso terreno e lo stesso seme', host.terreno + '/' + ospite.terreno, 'lava/lava')
  uguale('l\'host è `io` e l\'ospite `nem`', host.mio + '/' + ospite.mio, 'io/nem')
  controlla('le monete corrono a un quinto, per tutti e due', Math.abs(host.partita.lati.io.alSecondo - ospite.partita.lati.nem.alSecondo) < 1e-12 && host.partita.lati.io.alSecondo < 0.5)
  for (let i = 0; i < 400; i++) { host.sessione.avanza(0.05); ospite.sessione.avanza(0.05); s.gira() }
  controlla('si gioca: la partita va avanti su tutti e due', host.partita.t > 10 && ospite.partita.t > 10, `${host.partita.t}/${ospite.partita.t}`)
  host.sessione.scegli('costruisci', 'scheletri', 0)
  ospite.sessione.scegli('costruisci', 'guardiano', 0)
  for (let i = 0; i < 100; i++) { host.sessione.avanza(0.05); ospite.sessione.avanza(0.05); s.gira() }
  controlla('le mosse arrivano: ognuno vede la caserma dell\'altro', host.partita.casermeDi('nem').length === 1 && ospite.partita.casermeDi('nem').length === 1 && host.partita.casermeDi('io').length === 1)
  host.chiudi()
  s.gira()
  uguale('se uno se ne va a partita in corso, l\'altro non lo butta fuori subito (potrebbe aver solo finito prima)', ospite.stato, 'gioco')
  ospite.controlla()
  uguale('e dopo qualche secondo senza che la partita finisca, sì', (ospite.viaDa -= 5000, ospite.controlla(), ospite.stato), 'rotta')
  controlla('con una frase da dire', /se n'è andato/.test(ospite.motivo), ospite.motivo)
}
{
  const { host, ospite } = coppia({ firmaOspite: 'G' })
  uguale('versioni diverse: nessuno gioca (host)', host.stato, 'rotta')
  uguale('versioni diverse: nessuno gioca (ospite)', ospite.stato, 'rotta')
  controlla('e si dice cosa fare', /versione diversa/.test(host.motivo) && /versione diversa/.test(ospite.motivo))
}

/* il filo: una creazione di stanza e un collegamento con un WebSocket finto */
{
  const ok = await creaStanza({ servizio: 'http://x', fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ codice: 'KXRNM' }) }) })
  uguale('si crea una stanza e si ha il codice', ok, 'KXRNM')
  controlla('il codice è di 5 lettere', CODICE.test(ok))
  const errore = async fetchImpl => creaStanza({ servizio: 'http://x', fetchImpl }).then(() => '', e => e.message)
  controlla('senza internet si dice che serve', /internet/.test(await errore(async () => { throw new Error('rete') })))
  controlla('troppe stanze si dice', /troppe/.test(await errore(async () => ({ ok: false, status: 429 }))))
  controlla('un servizio che non risponde bene si dice', /non risponde/.test(await errore(async () => ({ ok: false, status: 500 }))))
  controlla('un codice storto dal servizio non passa', /non risponde/.test(await errore(async () => ({ ok: true, status: 200, json: async () => ({ codice: 'xx' }) }))))

  class Finto {
    constructor(url) { this.url = url; this.ev = {}; this.mandati = []; Finto.ultimo = this }
    addEventListener(n, f) { this.ev[n] = f }
    send(x) { this.mandati.push(x) }
    close() { this.ev.close && this.ev.close() }
  }
  const visti = []; let chiuso = null
  const c = collega('KXRNM', { servizio: 'https://s.example', WebSocketImpl: Finto, alMessaggio: m => visti.push(m), allaChiusura: m => { chiuso = m } })
  uguale('l\'indirizzo è wss e ha il codice', Finto.ultimo.url, 'wss://s.example/entra/KXRNM')
  c.invia({ t: 'x' })
  uguale('prima che si apra non si manda niente', Finto.ultimo.mandati.length, 0)
  Finto.ultimo.ev.open()
  c.invia({ t: 'k', h: 3 })
  uguale('aperto, si manda JSON', Finto.ultimo.mandati[0], '{"t":"k","h":3}')
  Finto.ultimo.ev.message({ data: '{"t":"ciao","ruolo":"host"}' })
  Finto.ultimo.ev.message({ data: 'non è json' })
  uguale('si riceve solo quello che è un oggetto', visti.length, 1)
  Finto.ultimo.ev.close()
  uguale('e la chiusura si dice', chiuso, 'chiuso')
  const c2 = collega('ZZZZZ', { servizio: 'https://s.example', WebSocketImpl: Finto, alMessaggio: () => {}, allaChiusura: m => { chiuso = m } })
  Finto.ultimo.ev.error()
  uguale('un codice che non entra si dice', chiuso, 'non entra')
}
{
  // chi finisce prima chiude: l'altro, che ha ancora qualche tick, non deve vedere «se n'è andato»
  const { s, host, ospite } = coppia()
  for (let i = 0; i < 100; i++) { host.sessione.avanza(0.05); ospite.sessione.avanza(0.05); s.gira() }
  ospite.partita.fine = 'vinto'                               // l'ospite è arrivato alla fine
  host.chiudi(); s.gira()
  host.partita.fine = 'vinto'                                 // e anche l'host ci arriva, poco dopo
  ospite.viaDa -= 0; host.controlla(); ospite.controlla()
  controlla('arrivato alla fine, nessuno dei due è «rotto»', ospite.stato === 'gioco' && host.stato === 'gioco')
}
riassunto('arena in due: la regia e il filo')
