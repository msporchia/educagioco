// I mercanti di sopra: la roba dell'avventuriero (Corredo) davanti a un banco. Ogni mercante pesca il suo
// banco una volta per giro (fra una discesa finita e l'altra) e quello che si compra se ne va; le cose che non
// finiscono (le cure, la torcia) stanno in cima. L'armaiolo e il rigattiere portano la riga della storia con cui
// si entra nella prossima discesa (motore/storia.js). Gira in Node: il giocatore finto ci fa la spesa (banco.js).
// Le regole: docs/sotterraneo/bottega.md, "I mercanti di sopra".
import { Corredo, ABILITA_CONFRONTATE } from './corredo.js'
import { COSE, A_SORTE, pescaMerce, aLivello, chiaveDelPezzo, baseDi } from '../dati/cose.js'
import { ABILITA_DEI_PEZZI, CHIAVI_ABILITA } from '../dati/pezzi.js'
import { mercanteDi, vendeLa, righeDi, profonditaDelBanco, prezzoAvanti, schedaDi } from '../dati/mercanti.js'
import { bancoDelPasso, vetrinaDelPasso, righeAvanti } from './storia.js'

// quanti pezzi, almeno, ha ogni linguetta di un mercante che veste (docs/sotterraneo/bottega.md, «Mai una linguetta
// vuota»), e fin dove si spinge il livello dei pezzi in più per trovarli
export const PEZZI_PER_LINGUETTA = 6
// e quanti pezzi «da meritare» (che richiedono più caratteristica di quella che hai) si vedono, spenti, per linguetta
export const DA_MERITARE = 2
const RIALZO_MASSIMO = 80

export class Bottega extends Corredo {
  // `finite`: discese finite (avanza.tappa). `banchi`: quello che è già stato pescato in questo giro
  // ({ armaiolo: ['spada', …] }, le botteghe dell'avventura); senza, si pesca alla prima apertura
  constructor({ eroe, roba = null, finite = 0, banchi = null, rnd = Math.random, crescita = null } = {}) {
    super({ eroe, roba, crescita })
    this.finite = finite
    this.rnd = rnd
    this.banchi = {}
    for (const [k, v] of Object.entries(banchi || {}))
      if (Array.isArray(v)) this.banchi[k] = this.soloRobaMia(k, v)
  }

  // Un banco pescato prima che si badasse alla famiglia può avere pezzi che l'eroe non porta: non si mostrano.
  // Al loro posto, se c'è, un pezzo della sua famiglia dello stesso gradino (stesso posto, stesso grado d'arma o
  // stessa fascia di prezzo); se no si salta (docs/sotterraneo/bottega.md, «I mercanti di sopra»)
  soloRobaMia(chiave, elenco) {
    const m = mercanteDi(chiave)
    const fascia = c => (c.grado ? `g${c.grado}` : c.prezzo <= 12 ? 'comune' : c.prezzo <= 22 ? 'buono' : 'raro')
    const fuori = elenco.filter(k => COSE[k] && COSE[k].dove && !this.posso(k))
    const resto = elenco.filter(k => !fuori.includes(k))
    for (const k of fuori) {
      const c = COSE[k]
      const sostituto = !m ? null : A_SORTE
        .filter(x => vendeLa(m, x) && !m.sempre.includes(x) && COSE[x].dove === c.dove && this.posso(x) &&
                     fascia(COSE[x]) === fascia(c) && !resto.includes(x) && !this.possiedo(x) &&
                     righeAvanti(this.chiEro, this.finite, x) === 0)
        .sort((a, b) => Math.abs(COSE[a].prezzo - c.prezzo) - Math.abs(COSE[b].prezzo - c.prezzo) || (a < b ? -1 : 1))[0]
      if (sostituto) resto.push(aLivello(sostituto, this.livelloPortabile(sostituto, this.livelloEroe)))
    }
    return resto
  }

  // pescato una volta e scritto (nell'avventura): un banco che cambiasse a ogni apertura sarebbe una slot machine.
  // Quello che si ha già non si offre, come faceva il mercante delle discese, tranne quello che si consuma
  banco(chiave) {
    const m = mercanteDi(chiave)
    if (!m) return null
    if (!this.banchi[chiave]) {
      const ammessa = k => vendeLa(m, k) && !m.sempre.includes(k) && !this.possiedo(k) && this.posso(k)
      this.banchi[chiave] = m.passo
        ? bancoDelPasso(m, this, this.finite, { rnd: this.rnd, ammessa })
        : pescaMerce(profonditaDelBanco(this.finite), {
          quante: righeDi(m, this.finite), rnd: this.rnd, ammessa, tua: k => this.posso(k),
        })
    }
    return { roba: this.banchi[chiave], sempre: m.sempre }
  }

  // le righe sul banco: quelle che non finiscono prima (`sempre`), poi le pescate, poi i pezzi delle righe dopo
  // (`avanti`: quante righe, e quindi di quanto costano di più)
  mercanzia(chiave) {
    const b = this.banco(chiave)
    if (!b) return []
    return [
      ...b.sempre.map(k => ({ chiave: k, sempre: true, avanti: 0 })),
      ...b.roba.map(k => ({ chiave: k, sempre: false, avanti: 0 })),
      ...this.vetrina(chiave).map(v => ({ chiave: v.chiave, sempre: false, avanti: v.avanti })),
    ]
  }

  // quanto costa qui: il prezzo pieno, e di più se il pezzo nella storia viene dopo il passo (sovrapprezzo)
  quantoCosta(k) {
    return prezzoAvanti(super.quantoCosta(k), righeAvanti(this.chiEro, this.finite, k))
  }

  // i pezzi delle righe dopo che il banco non porta: si comprano lo stesso, a un prezzo più alto
  vetrina(chiave) {
    const m = mercanteDi(chiave)
    const b = this.banco(chiave)
    return m && m.passo ? vetrinaDelPasso(m, this, this.finite, { banco: b.roba }) : []
  }

  // roba che non alza nessun numero di quello che si ha addosso non si mostra (resta pescata: il banco non
  // cambia, cambia cosa si vede). Una seconda arma leggera nella mano libera alza il braccio, quindi si vede
  sottoAddosso(k) {
    const c = COSE[k]
    if (!c || !c.dove || !this.posso(k)) return false
    // uno scudo con un'arma a due mani in pugno non si può portare: non migliora niente
    if (c.dove === 'mancina' && this.aDueMani(this.mano)) return true
    // una casella vuota prende tutto, tranne un'arma che picchia meno dei pugni (un arco a chi ha alzato la forza)
    if (!this.casella(c.dove) && c.dove !== 'mano') return false
    const p = this.seLoMetto(k)
    if (!p || !p.prima) return false
    return !ABILITA_CONFRONTATE.some(n => p.dopo[n] > p.prima[n])
  }

  // Quello che la bottega mostra: tutto, tranne il pezzo che non alzerebbe niente di quello che si ha addosso (anche
  // fra i pezzi avanti, che costano di più: un pezzo caro e uguale è una trappola)
  siMostra(k) { return !this.sottoAddosso(k) }

  // Quello che la bottega mette in mostra: il banco e la vetrina di quello che migliora, e per ogni linguetta che
  // veste i pezzi in più perché non resti mai sotto PEZZI_PER_LINGUETTA (`rialzi`)
  mercanziaVista(chiave) {
    const m = mercanteDi(chiave)
    if (!m) return []
    const vista = this.mercanzia(chiave).filter(r => this.siMostra(r.chiave))
    return [...vista, ...this.rialzi(chiave, vista)]
  }

  // I pezzi in più: per ogni linguetta che veste (`dove`) con meno di PEZZI_PER_LINGUETTA pezzi, quelli dello stesso
  // mercante, che l'eroe porta, di livello o rarità più alti di quelli di prima, finché migliorano davvero quello che
  // ha addosso in quel posto (punteggio più alto). Dal meno caro: costano di più delle gemme che ha, e restano
  // spenti col prezzo vero. Non c'è caso: stessa roba addosso, stessi pezzi
  rialzi(chiave, vista = null) {
    const m = mercanteDi(chiave)
    if (!m) return []
    vista = vista || this.mercanzia(chiave).filter(r => this.siMostra(r.chiave))
    const fuori = []
    for (const s of m.schede) {
      if (s.vendi || !s.dove) continue
      const qui = vista.filter(r => COSE[r.chiave].dove && schedaDi(m, r.chiave) === s)
      const manca = PEZZI_PER_LINGUETTA - qui.length
      const visti = new Set(vista.map(r => r.chiave))
      if (manca > 0) fuori.push(...this.rialziDi(m, s, manca, visti))
      fuori.push(...this.daMeritare(m, s, DA_MERITARE, new Set([...visti, ...fuori.map(r => r.chiave)])))
    }
    return fuori
  }

  // I pezzi «da meritare» (l'utente, 9 ottobre): quelli che la classe porta ma che chiedono più caratteristica di quella che
  // ha adesso. Si vedono spenti, col «Serve Forza 15 (hai 10)», e non si comprano: sono quello a cui puntare. Solo quelli più
  // forti di quello che c'è addosso in quel posto, dal meno caro, uno per base e con i rari in testa
  daMeritare(m, scheda, quanti, visti) {
    const valore = c => (c ? (c.att || 0) + (c.dif || 0) + (c.vita || 0) / 3 + (c.fuoco || 0) + (c.rigenera || 0) + (c.schivata || 0) / 8 : 0)
    const addosso = Math.max(0, ...scheda.dove.map(d => valore(COSE[this.casella(d)])))
    const basi = A_SORTE.filter(b => COSE[b].dove && scheda.dove.includes(COSE[b].dove) && vendeLa(m, b) &&
                                     !m.sempre.includes(b) && this.porta(b))
    const L = this.livelloEroe
    const buoni = []
    const prova = k => {
      if (visti.has(k) || this.possiedo(k) || !COSE[k] || this.posso(k) || !this.porta(k) || valore(COSE[k]) <= addosso) return
      visti.add(k)
      buoni.push({ chiave: k, sempre: false, avanti: righeAvanti(this.chiEro, this.finite, k), rialzo: true, meritare: true,
                   costa: this.quantoCosta(k) })
    }
    for (let su = 0; su <= RIALZO_MASSIMO && buoni.length < quanti * 4; su++)
      for (const b of basi) {
        prova(chiaveDelPezzo(b, L + su))
        const possibili = CHIAVI_ABILITA.filter(a => ABILITA_DEI_PEZZI[a].dove.includes(COSE[b].dove))
        if (possibili.length < 3) continue
        const seme = [...b].reduce((x, ch) => x + ch.charCodeAt(0), 0) + su
        const abilita = [possibili[seme % possibili.length], possibili[(seme + 3) % possibili.length]]
        if (new Set(abilita).size === 2) prova(chiaveDelPezzo(b, L + su, 'raro', abilita))
      }
    buoni.sort((a, b) => a.costa - b.costa || (a.chiave < b.chiave ? -1 : 1))
    const presi = [], basiPrese = new Set()
    for (const r of buoni) if (presi.length < quanti && !basiPrese.has(baseDi(r.chiave))) { presi.push(r); basiPrese.add(baseDi(r.chiave)) }
    return presi.map(({ costa, ...r }) => r)
  }

  rialziDi(m, scheda, quanti, visti) {
    const basi = A_SORTE.filter(b => COSE[b].dove && scheda.dove.includes(COSE[b].dove) && vendeLa(m, b) &&
                                     !m.sempre.includes(b) && this.posso(b))
    const L = this.livelloEroe
    const buoni = []
    const prova = k => {
      if (visti.has(k) || this.possiedo(k) || !COSE[k] || !this.posso(k) || !this.siMostra(k)) return
      const conf = this.confronto(k)
      if (!conf || (conf.addosso && !(conf.meglio > 0))) return
      visti.add(k)
      buoni.push({ chiave: k, sempre: false, avanti: righeAvanti(this.chiEro, this.finite, k), rialzo: true,
                   costa: this.quantoCosta(k) })
    }
    // livello dopo livello: il pezzo comune più alto, poi il magico e il raro con le abilità che nascono lì
    for (let su = 0; su <= RIALZO_MASSIMO && buoni.length < quanti + 2; su++)
      for (const b of basi) {
        prova(chiaveDelPezzo(b, L + su))
        // tre varianti per ogni rarità: abilità diverse, così il banco ha scelta (l'utente, 9 ottobre)
        for (const rarita of ['magico', 'raro']) for (let v = 0; v < 3; v++) {
          const possibili = CHIAVI_ABILITA.filter(a => ABILITA_DEI_PEZZI[a].dove.includes(COSE[b].dove))
          const n = rarita === 'magico' ? 1 : 2
          if (possibili.length < n + 1) continue
          const seme = [...b].reduce((x, ch) => x + ch.charCodeAt(0), 0) + su + v * 5
          const abilita = Array.from({ length: n }, (_, i) => possibili[(seme + i * 3) % possibili.length])
          if (new Set(abilita).size === n) prova(chiaveDelPezzo(b, L + su, rarita, abilita))
        }
      }
    // dal meno caro, e prima uno per ogni base diversa
    buoni.sort((a, b) => a.costa - b.costa || (a.chiave < b.chiave ? -1 : 1))
    const presi = [], basiPrese = new Set()
    for (const r of buoni) if (presi.length < quanti && !basiPrese.has(baseDi(r.chiave))) {
      presi.push(r)
      basiPrese.add(baseDi(r.chiave))
    }
    for (const r of buoni) if (presi.length < quanti && !presi.includes(r)) presi.push(r)
    return presi.map(({ costa, ...r }) => r)
  }

  compraDa(chiave, k) {
    const b = this.banco(chiave)
    if (!b) return null
    // un pezzo più avanti non sta nel banco pescato: si compra a parte, e non c'è più perché ora lo si ha
    if (this.vetrina(chiave).some(v => v.chiave === k) || this.rialzi(chiave).some(v => v.chiave === k))
      return this.compra(k, { roba: [], sempre: [k] })
    return this.compra(k, b)
  }

  // compra solo chi lo dice (il rigattiere): gli altri vendono e basta
  vendiA(chiave, i) {
    const m = mercanteDi(chiave)
    return m && m.compra ? this.vendi(i) : null
  }

  // sopra non c'è buio: una torcia comprata aspetta alla cintura, e si accende scendendo (Corsa)
  accendi(k) {
    this.torceInScorta++
    this.dilloDi(k, ` alla cintura · ne hai ${this.quanteNeHo(k)}`)
    return true
  }
}
