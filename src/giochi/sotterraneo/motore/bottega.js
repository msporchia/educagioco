// I mercanti di sopra: la roba dell'avventuriero (Corredo) davanti a un banco. Ogni mercante pesca il suo
// banco una volta per giro (fra una discesa finita e l'altra) e quello che si compra se ne va; le cose che non
// finiscono (le cure, la torcia) stanno in cima. L'armaiolo e il rigattiere portano la riga della storia con cui
// si entra nella prossima discesa (motore/storia.js). Gira in Node: il giocatore finto ci fa la spesa (banco.js).
// Le regole: docs/sotterraneo/bottega.md, "I mercanti di sopra".
import { Corredo, ABILITA_CONFRONTATE } from './corredo.js'
import { COSE, A_SORTE, pescaMerce, aLivello, chiaveDelPezzo, baseDi } from '../dati/cose.js'
import { mercanteDi, vendeLa, righeDi, profonditaDelBanco, prezzoAvanti, schedaDi } from '../dati/mercanti.js'
import { bancoDelPasso, vetrinaDelPasso, delPassoDi, righeAvanti } from './storia.js'
import { pescaAbilita } from './bottino.js'
import { LIVELLI_PER_REQUISITO } from '../dati/eroi.js'

// quanti pezzi ha ogni linguetta di un mercante che veste quando il banco si riempie (docs/sotterraneo/bottega.md,
// «Più scelta»), e fin dove si spinge il livello dei pezzi in più per trovarne che migliorano
export const PEZZI_PER_LINGUETTA = 10
// sotto questi (comprati, o non più utili al nuovo livello) una linguetta si rimette in piedi anche a metà giro
export const MINIMO_PER_LINGUETTA = 3
// i pezzi che chiedono più caratteristica di quella che hai, per linguetta: si comprano, vanno nello zaino
export const DA_MERITARE = 2
// il tetto di rarità del banco: magico sempre, al più un raro per linguetta, mai un leggendario (quelli sono dei drop)
export const RARI_PER_LINGUETTA = 1
// a ogni giro, per ogni linguetta che veste, se ne vanno i più deboli e ne entrano altrettanti nuovi
export const SE_NE_VANNO = 3
const RIALZO_MASSIMO = 80
// il traguardo di un'arma sta al più a due punti di caratteristica da quello che l'eroe regge (tosta, non troppo)
const FINESTRA_DEL_TRAGUARDO = 2 * LIVELLI_PER_REQUISITO
const MARGINE_DELLA_SCELTA = 6

// un pezzo che il banco può portare: mai un leggendario, né uno col nome (dei mostri grossi)
export const consentito = k => !!COSE[k] && COSE[k].rarita !== 'leggendario' && !COSE[k].unico

// Il giro nuovo (finita una discesa): il banco di ogni mercante che ne aveva uno si cambia poco alla volta, la prima
// volta che si riapre (`prepara`). Torna il record `botteghe` dell'avventura con la richiesta, o null se non c'era banco
export function alGiroNuovo(botteghe) {
  const b = botteghe && typeof botteghe === 'object' ? botteghe : null
  const banchi = b && b.banchi && typeof b.banchi === 'object' ? Object.keys(b.banchi) : []
  const ruota = [...new Set([...(b && Array.isArray(b.ruota) ? b.ruota : []), ...banchi])].filter(mercanteDi)
  return ruota.length ? { ...b, ruota } : null
}

export class Bottega extends Corredo {
  // `finite`: discese finite (avanza.tappa). `banchi`: quello che è già stato pescato in questo giro
  // ({ armaiolo: ['spada', …] }, le botteghe dell'avventura); senza, si pesca alla prima apertura. `scaffali`: i pezzi
  // in più che stanno in mostra accanto al banco, scritti anch'essi; `ruota`: i mercanti il cui banco cambia a metà
  // (il giro nuovo, alGiroNuovo)
  constructor({ eroe, roba = null, finite = 0, banchi = null, scaffali = null, ruota = null,
                rnd = Math.random, crescita = null } = {}) {
    super({ eroe, roba, crescita })
    this.finite = finite
    this.rnd = rnd
    this.banchi = {}
    for (const [k, v] of Object.entries(banchi || {}))
      if (Array.isArray(v)) this.banchi[k] = this.soloRobaMia(k, v)
    this.scaffali = {}
    for (const [k, v] of Object.entries(scaffali || {}))
      if (Array.isArray(v) && mercanteDi(k)) this.scaffali[k] = v.filter(x => typeof x === 'string' && consentito(x) && this.porta(x))
    this.ruota = (Array.isArray(ruota) ? ruota : []).filter(mercanteDi)
  }

  // quello che si scrive nell'avventura (`botteghe`): i banchi e gli scaffali, e chi deve ancora cambiare
  get botteghe() {
    return { banchi: this.banchi, scaffali: this.scaffali, ...(this.ruota.length ? { ruota: this.ruota } : {}) }
  }

  // Un banco pescato prima che si badasse alla famiglia può avere pezzi che l'eroe non porta: non si mostrano.
  // Al loro posto, se c'è, un pezzo della sua famiglia dello stesso gradino (stesso posto, stesso grado d'arma o
  // stessa fascia di prezzo); se no si salta (docs/sotterraneo/bottega.md, «I mercanti di sopra»)
  soloRobaMia(chiave, elenco) {
    const m = mercanteDi(chiave)
    const fascia = c => (c.grado ? `g${c.grado}` : c.prezzo <= 12 ? 'comune' : c.prezzo <= 22 ? 'buono' : 'raro')
    const fuori = elenco.filter(k => COSE[k] && COSE[k].dove && !this.porta(k))
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
    if (!c || !c.dove || !this.porta(k)) return false
    // uno scudo con un'arma a due mani in pugno non si può portare: non migliora niente
    if (c.dove === 'mancina' && this.aDueMani(this.mano)) return true
    // una casella vuota prende tutto, tranne un'arma che picchia meno dei pugni (un arco a chi ha alzato la forza)
    if (!this.casella(c.dove) && c.dove !== 'mano') return false
    // un pezzo che si porta ma non si regge ancora (si compra, va nello zaino) si giudica sul punteggio che darebbe
    if (!this.posso(k)) { const conf = this.confronto(k); return !conf || !(conf.meglio > 0) }
    const p = this.seLoMetto(k)
    if (!p || !p.prima) return false
    return !ABILITA_CONFRONTATE.some(n => p.dopo[n] > p.prima[n])
  }

  // Quello che la bottega mostra: tutto, tranne il pezzo che non alzerebbe niente di quello che si ha addosso (anche
  // fra i pezzi avanti, che costano di più: un pezzo caro e uguale è una trappola)
  siMostra(k) { return !this.sottoAddosso(k) }

  // Quello che la bottega mette in mostra: il banco e la vetrina di quello che migliora, e i pezzi in più dello
  // scaffale (le linguette che vestono ne hanno sempre una decina). Il banco di chi veste si prepara qui, una volta
  // per giro (`prepara`): aprirlo di nuovo non lo cambia
  mercanziaVista(chiave) {
    this.prepara(chiave)
    return this.vistaDi(chiave)
  }

  // la vista senza preparare niente: il banco e la vetrina che migliorano, poi lo scaffale (`rialzo`; `meritare`, quelli
  // che si portano ma non si reggono ancora). Mai un leggendario, qualunque strada l'abbia messo qui
  vistaDi(chiave) {
    const m = mercanteDi(chiave)
    if (!m) return []
    const vista = this.mercanzia(chiave).filter(r => (r.sempre || consentito(r.chiave)) && this.siMostra(r.chiave))
    return [...vista, ...this.rialzi(chiave)]
  }

  // i pezzi dello scaffale che si vedono adesso: quelli che migliorano ancora qualcosa, e che non si hanno già
  rialzi(chiave) {
    return (this.scaffali[chiave] || [])
      .filter(k => consentito(k) && !this.possiedo(k) && this.siMostra(k))
      .map(k => ({ chiave: k, sempre: false, avanti: righeAvanti(this.chiEro, this.finite, k), rialzo: true,
                   ...(this.posso(k) ? {} : { meritare: true }) }))
  }

  // Il banco di chi veste (armaiolo, rigattiere) pronto per questo giro, scritto in `banchi` e `scaffali`: la prima volta
  // ogni linguetta si riempie fino a PEZZI_PER_LINGUETTA; al giro nuovo (`ruota`) se ne vanno i più deboli e ne entrano
  // di nuovi, gli altri restano; a metà giro una linguetta non scende sotto MINIMO_PER_LINGUETTA. Si può chiamare
  // quante volte si vuole: dopo la prima non cambia niente. L'erborista, che non veste, si ripesca intero al giro
  prepara(chiave) {
    const m = mercanteDi(chiave)
    if (!m) return
    const daRuotare = this.ruota.includes(chiave)
    if (daRuotare) this.ruota = this.ruota.filter(x => x !== chiave)
    const cera = !!this.banchi[chiave]
    if (daRuotare && cera && !m.passo) delete this.banchi[chiave]
    this.banco(chiave)
    const schede = m.schede.filter(s => s.dove && !s.vendi)
    if (!schede.length) return
    const primo = !this.scaffali[chiave]
    if (primo) this.scaffali[chiave] = []
    const ruota = daRuotare && cera
    const passo = ruota ? delPassoDi(m, this, this.finite, { ammessa: this.ammessaDa(m) }) : []
    for (const s of schede) {
      if (ruota) this.ruotaLa(m, s, passo)
      else this.riempi(m, s, primo ? PEZZI_PER_LINGUETTA : MINIMO_PER_LINGUETTA)
    }
  }

  // quello che un banco può avere: lo vende il mercante, non sta già in cima, non lo hai e l'eroe lo regge
  ammessaDa(m) { return k => vendeLa(m, k) && !m.sempre.includes(k) && !this.possiedo(k) && this.posso(k) }

  // I pezzi di questa linguetta che stanno sul banco pescato o sullo scaffale (il pezzo di una linguetta che veste ha un
  // posto addosso: `dove`)
  stockDella(chiave, scheda) {
    const m = mercanteDi(chiave)
    return [...(this.banchi[chiave] || []), ...(this.scaffali[chiave] || [])]
      .filter(k => COSE[k] && COSE[k].dove && schedaDi(m, k) === scheda)
  }

  // Il giro nuovo di una linguetta: se ne vanno i SE_NE_VANNO più deboli — prima quelli che non migliorano più niente
  // o che hai già, poi quelli che alzano di meno (il punteggio con cui il gioco dice che un pezzo migliora,
  // `confronto().meglio`) — tranne i pezzi del passo della storia; entrano i pezzi del passo nuovo e, fino a
  // SE_NE_VANNO nuovi e a PEZZI_PER_LINGUETTA in vista, pezzi pescati a tono col livello di adesso. Gli altri restano:
  // un pezzo desiderato aspetta
  ruotaLa(m, scheda, passo) {
    const chiave = m.chiave
    const prima = this.stockDella(chiave, scheda)
    const protetti = new Set(passo)
    const grado = k => {
      const conf = this.confronto(k)
      return [!this.siMostra(k) || this.possiedo(k) ? 0 : 1, conf ? conf.meglio : 0]
    }
    const via = prima.filter(k => !protetti.has(k)).map(k => ({ k, g: grado(k) }))
      .sort((a, b) => a.g[0] - b.g[0] || a.g[1] - b.g[1] || (a.k < b.k ? -1 : 1))
      .slice(0, SE_NE_VANNO).map(x => x.k)
    for (const lista of [this.banchi[chiave], this.scaffali[chiave]])
      for (const k of via) { const i = lista.indexOf(k); if (i >= 0) lista.splice(i, 1) }
    const nuoviDelPasso = passo.filter(k => COSE[k].dove && schedaDi(m, k) === scheda && !prima.includes(k))
    this.banchi[chiave].push(...nuoviDelPasso)
    let nuovi = nuoviDelPasso.length + this.riempi(m, scheda, PEZZI_PER_LINGUETTA, via)
    if (nuovi < SE_NE_VANNO) nuovi += this.riempi(m, scheda, this.vistaQui(m, scheda).length + SE_NE_VANNO - nuovi, via)
  }

  // quello che la linguetta mostra adesso (banco, vetrina e scaffale)
  vistaQui(m, scheda) {
    return this.vistaDi(m.chiave).filter(r => COSE[r.chiave].dove && schedaDi(m, r.chiave) === scheda)
  }

  // Porta la linguetta a `soglia` pezzi in vista con pezzi nuovi sullo scaffale; `scartati` non tornano (quelli appena
  // andati via). Torna quanti ne ha messi
  riempi(m, scheda, soglia, scartati = []) {
    const qui = this.vistaQui(m, scheda)
    const manca = soglia - qui.length
    if (manca <= 0) return 0
    const nuovi = this.pescaPer(m, scheda, manca, qui, new Set([...qui.map(r => r.chiave), ...(this.banchi[m.chiave] || []), ...(this.scaffali[m.chiave] || []), ...scartati]))
    // dal meno caro, dentro il gruppo: lo scaffale si legge come un banco
    nuovi.sort((a, b) => this.quantoCosta(a) - this.quantoCosta(b) || (a < b ? -1 : 1))
    this.scaffali[m.chiave].push(...nuovi)
    return nuovi.length
  }

  // Un pezzo per questa linguetta: lo porta la classe, non è già lì, e se ha un posto addosso lo alza
  valeLaPena(k) {
    if (!COSE[k] || !COSE[k].dove || !consentito(k) || this.possiedo(k) || !this.porta(k) || !this.siMostra(k)) return false
    const conf = this.confronto(k)
    return !!conf && !(conf.addosso && !(conf.meglio > 0))
  }

  // Pesca `quanti` pezzi nuovi per la linguetta, a tono col livello dell'eroe: comuni e magici (abilità a caso) del
  // livello a cui l'eroe regge l'arma e di quello che ha, e solo se non bastano di più su, livello dopo livello, fino
  // a trovare pezzi che migliorano quello che ha addosso. Al più un raro per linguetta e al più DA_MERITARE pezzi che
  // non regge ancora (`qui`: quelli già in vista); mai un leggendario. Uno per base prima, poi il resto, a caso
  pescaPer(m, scheda, quanti, qui, visti) {
    const basi = A_SORTE.filter(b => COSE[b].dove && scheda.dove.includes(COSE[b].dove) && vendeLa(m, b) &&
                                     !m.sempre.includes(b) && this.porta(b))
    if (!basi.length) return []
    const L = this.livelloEroe
    const pool = []
    const trovati = new Set(visti)
    const prova = k => {
      if (trovati.has(k) || !this.valeLaPena(k)) return
      trovati.add(k)
      pool.push(k)
    }
    let rari = qui.filter(r => COSE[r.chiave].rarita === 'raro').length
    let daMeritare = qui.filter(r => !this.posso(r.chiave)).length
    for (let su = 0; su <= RIALZO_MASSIMO && pool.length < quanti + MARGINE_DELLA_SCELTA; su++) {
      for (const b of basi) {
        const livelli = su === 0 ? [...new Set([this.livelloPortabile(b, L), L])] : [L + su]
        for (const l of livelli) {
          prova(chiaveDelPezzo(b, l))
          for (let v = 0; v < 2; v++) {
            const abilita = pescaAbilita(b, 1 + Math.floor(this.rnd() * 2), this.rnd)
            if (abilita.length) prova(chiaveDelPezzo(b, l, 'magico', abilita))
          }
        }
      }
      // un raro per passata, di una base a caso: poi la scelta ne tiene al più RARI_PER_LINGUETTA
      if (rari < RARI_PER_LINGUETTA) {
        const b = basi[Math.floor(this.rnd() * basi.length)]
        const abilita = pescaAbilita(b, 2, this.rnd)
        if (abilita.length === 2) prova(chiaveDelPezzo(b, L + su, 'raro', abilita))
      }
    }
    // il traguardo: per ogni base, il primo livello (poco più su) a cui l'eroe non la regge ancora; gli manca un punto di caratteristica
    for (const b of basi) {
      for (let l = L + 1; l <= L + FINESTRA_DEL_TRAGUARDO; l++) {
        if (this.posso(aLivello(b, l))) continue
        prova(chiaveDelPezzo(b, l))
        const abilita = pescaAbilita(b, 1 + Math.floor(this.rnd() * 2), this.rnd)
        if (abilita.length) prova(chiaveDelPezzo(b, l, 'magico', abilita))
        break
      }
    }
    const mescolati = pool.map(k => ({ k, r: this.rnd() })).sort((a, b) => a.r - b.r).map(x => x.k)
    const presi = []
    const basiPrese = new Set()
    const sta = k => (COSE[k].rarita !== 'raro' || rari < RARI_PER_LINGUETTA) && (this.posso(k) || daMeritare < DA_MERITARE)
    const metti = k => {
      presi.push(k)
      basiPrese.add(baseDi(k))
      if (COSE[k].rarita === 'raro') rari++
      if (!this.posso(k)) daMeritare++
    }
    // un pezzo da meritare è il traguardo di una linguetta: uno c'è sempre, se ce n'è
    if (daMeritare === 0) { const k = mescolati.find(x => !this.posso(x) && sta(x)); if (k && quanti > 0) metti(k) }
    for (const k of mescolati) if (presi.length < quanti && !basiPrese.has(baseDi(k)) && sta(k)) metti(k)
    for (const k of mescolati) if (presi.length < quanti && !presi.includes(k) && sta(k)) metti(k)
    return presi
  }

  compraDa(chiave, k) {
    const b = this.banco(chiave)
    if (!b) return null
    // un pezzo più avanti non sta nel banco pescato: si compra a parte, e non c'è più perché ora lo si ha
    if (this.vetrina(chiave).some(v => v.chiave === k)) return this.compra(k, { roba: [], sempre: [k] })
    // uno dello scaffale se ne va comprandolo, come il pescato
    const scaffale = this.scaffali[chiave]
    if (scaffale && scaffale.includes(k) && !b.roba.includes(k)) return this.compra(k, { roba: scaffale, sempre: [] })
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
