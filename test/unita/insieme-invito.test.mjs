/* Una sfida nata da un invito (src/insieme/sfida.js, docs/core/insieme.md): l'amico accetta, la partita parte, e il tempo che
   aspetta la risposta (45 s) non la chiude più a metà. Il 31/10 il Sotterraneo 3D in due si chiudeva sempre 45 s dopo l'invito:
   chi invitava mandava «addio» senza che nessuno l'avesse chiesto, lo ha visto `strumenti/telefono.mjs ascolta`. Qui niente
   rete: l'orologio di Node finto, il servizio (gli amici e il tavolo) finto in memoria, l'amico che risponde sempre sì. */
import { mock } from 'node:test'
import { usaSfida } from '../../src/insieme/sfida.js'
import { dati } from '../../src/store/amici.js'
import { avvia, ferma, stato as amiciStato } from '../../src/amici/servizio.js'
import { TERRENI } from '../../src/giochi/arena/dati/regole.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] })
const tregua = () => new Promise(r => setImmediate(r))
async function avanti(ms) { for (let t = 0; t < ms; t += 50) { mock.timers.tick(50); for (let i = 0; i < 3; i++) await tregua() } }

const K = 'k'.repeat(32), CODICE = 'BDWVY'
const mandati = []                       // quello che il telefono ha scritto sul tavolo
let tavolo = null                        // il filo del tavolo, per far arrivare l'amico

// un WebSocket finto: gli amici (presenza) e il tavolo, con l'amico dall'altra parte che dice sempre sì
class Finto extends EventTarget {
  constructor(url) {
    super()
    this.url = url
    this.presenza = url.includes('/amici/presenza')
    if (!this.presenza) tavolo = this
    setTimeout(() => {
      this.dispatchEvent(new Event('open'))
      if (!this.presenza) this.arriva({ t: 'ciao', ruolo: 'host', altro: false, andato: false })
    }, 20)
  }
  arriva(m) { setTimeout(() => this.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify(m) })), 20) }
  send(testo) {
    const m = JSON.parse(testo)
    if (m.t === 'ping') return this.arriva({ t: 'pong' })
    if (this.presenza) {
      if (m.k === 'dichiaro') { this.arriva({ t: 'ciao', presenti: [K] }); this.arriva({ t: 'da', chiave: K, m: { k: 'presento', id: 'melody0001', nome: 'Melody', gioco: null } }) }
      if (m.k === 'a' && m.m?.k === 'invito') { this.arriva({ t: 'da', chiave: K, m: { k: 'risposta', ok: true } }); setTimeout(() => { tavolo.amico = true; tavolo.arriva({ t: 'su' }) }, 500) }
      return
    }
    mandati.push(m)
    if (m.t === 'm' && m.d?.t === 'inizio') this.arriva({ t: 'm', n: 1, a: m.n, d: { t: 'pronto' } })
  }
  close() {}
}
globalThis.WebSocket = Finto
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ codice: CODICE }) })
// l'amico dà notizie ogni secondo, come il battito vero
setInterval(() => tavolo?.amico && tavolo.arriva({ t: 'b', a: mandati.filter(m => m.t === 'm').length }), 1000)

// una partita che non fa niente: conta solo che la sfida resti in piedi
const motore = { passo: 0.05, partita: {}, avanza () {}, applica () {}, valida: () => true, impronta: () => [0], simili: () => true,
  foto: () => ({}), rimetti () {}, fine: () => null, finisci () {} }
const regola = () => ({ versione: 'prova', proponi: s => ({ ...s }), accetta: () => null, crea: () => motore })

Object.assign(dati, { giocatore: 'GIOCATORE', id: 'leonardo01', deciso: true, attivo: true, online: true, amici: [{ id: 'melody0001', nome: 'Melody', chiave: K }] })
avvia({ nome: 'Leonardo', WebSocketImpl: Finto, servizio: 'https://finto' })
await avanti(500)
controlla('l\'amico è online', amiciStato.amici.some(a => a.chiave === K && a.online), JSON.stringify(amiciStato.amici))

let partita = 0
const sfida = usaSfida({ gioco: 'arena', regola, alVia: () => { partita++ }, mostra: () => {} })
sfida.invita(K, {}, { terreno: TERRENI[0], secondi: 10 })
await avanti(3000)
uguale('l\'amico accetta: la partita parte', partita, 1)
uguale('e la sfida è in gioco', sfida.stato.value, 'gioco')
uguale('chi invita non aspetta più nessuno', sfida.invitato.value, '')

await avanti(60000)
controlla('un minuto dopo l\'invito la sfida c\'è ancora', !!sfida.regia.value && sfida.stato.value === 'gioco', sfida.stato.value)
controlla('e nessuno ha detto addio', !mandati.some(m => m.t === 'addio'))
uguale('né c\'è un errore da dire', sfida.messaggio.value, '')

// l'amico che invece non risponde: dopo 45 s si smette di aspettarlo, come prima
const muta = usaSfida({ gioco: 'arena', regola, alVia: () => {}, mostra: () => {} })
Finto.prototype.sendVero = Finto.prototype.send
Finto.prototype.send = function (testo) { if (this.presenza && JSON.parse(testo).m?.k === 'invito') return; return this.sendVero(testo) }
mandati.length = 0
muta.invita(K, {}, { terreno: TERRENI[0], secondi: 10 })
await avanti(10000)
controlla('chi non risponde: si aspetta', muta.invitato.value === 'Melody' && !mandati.some(m => m.t === 'addio'))
await avanti(40000)
controlla('e dopo 45 s si lascia perdere, e lo si dice', !muta.regia.value && /Melody non risponde/.test(muta.messaggio.value), muta.messaggio.value)

sfida.chiudi(); ferma()
mock.timers.reset()
riassunto('una sfida nata da un invito non si chiude da sola')
process.exit(0)
