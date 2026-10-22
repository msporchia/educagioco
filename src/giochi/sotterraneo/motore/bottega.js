// I mercanti di sopra: la roba dell'avventuriero (Corredo) davanti a un banco. Ogni mercante pesca il suo
// banco una volta e quello che si compra se ne va; al giro nuovo (una discesa finita) il banco di chi veste cambia
// poco alla volta (`prepara`: i tre pezzi più deboli via, tre nuovi dentro); le cose che non finiscono (le cure,
// la torcia, l'energia) stanno in cima. L'armaiolo, l'incantatrice e il rigattiere portano la riga della storia con cui
// si entra nella prossima discesa (motore/storia.js). Gira in Node: il giocatore finto ci fa la spesa (banco.js).
// Le regole: docs/sotterraneo/bottega.md.
import { Corredo, ABILITA_CONFRONTATE, ROBA_VUOTA } from './corredo.js'
import { COSE, A_SORTE, COPRICAPI, pescaMerce, aLivello, chiaveDelPezzo, baseDi } from '../dati/cose.js'
import { mercanteDi, vendeLa, righeDi, profonditaDelBanco, prezzoAvanti, schedaDi } from '../dati/mercanti.js'
import { bancoDelPasso, vetrinaDelPasso, delPassoDi, righeAvanti } from './storia.js'
import { pescaAbilita } from './bottino.js'
import { dopoLaMissione } from './missioni.js'
import { LIVELLI_PER_REQUISITO, eroeDi, portaLa } from '../dati/eroi.js'

// quanti pezzi ha ogni linguetta di un mercante che veste quando il banco si riempie (docs/sotterraneo/bottega.md,
// «Dieci pezzi per linguetta»), e fin dove si spinge il livello dei pezzi in più per trovarne che migliorano
export const PEZZI_PER_LINGUETTA = 10
// le basi da cui le linguette che vestono pescano: quelle di sempre e, in coda, i copricapi (li vede solo la loro linguetta, `dove: ['testa']`)
const BASI_DEL_BANCO = [...A_SORTE, ...COPRICAPI]
// sotto questi (comprati, o non più utili al nuovo livello) una linguetta si rimette in piedi anche a metà giro
export const MINIMO_PER_LINGUETTA = 3
// i pezzi che chiedono più caratteristica di quella che hai, per linguetta: si comprano, vanno nello zaino
export const DA_MERITARE = 8
// il tetto di rarità del banco: il magico c'è sempre, i rari solo fra i salti e i sogni (sotto), mai un leggendario
// (quelli sono dei drop)
export const RARI_PER_LINGUETTA = 5
// i salti: pezzi che alzano chiaramente quello che l'eroe ha addosso nel posto (almeno un quarto di quanto vale, e non meno
// di SALTO_MINIMO), di qualche livello sopra, cari; anche con la caratteristica che non ha ancora. I sogni: salti di
// SOGNO_LIVELLI livelli o più sopra, rari, a un prezzo esorbitante, il traguardo per cui risparmiare. Ogni linguetta
// che veste ne ha sempre (docs/sotterraneo/bottega.md, «Salti e sogni»)
export const SALTI_PER_LINGUETTA = 3
export const SOGNI_PER_LINGUETTA = 2
export const SALTI_MINIMI = 2
export const SOGNI_MINIMI = 1
export const SALTO_RELATIVO = 0.25
export const SALTO_MINIMO = 1.5
export const PREZZO_DEL_SOGNO = 2
export const SOGNO_LIVELLI = 8
const SOGNO_SPAZIO = 6
// oltre SOGNO_LIVELLI livelli sopra l'eroe un pezzo per dopo si cerca solo se i pezzi non bastano a riempire
const RIALZO_MASSIMO = 80
// il salto da mettere subito si cerca fino a questi livelli sotto quello dell'eroe
const SALTO_SUBITO_SOTTO = 2
// i pezzi per adesso che ogni linguetta ha (le gemme devono avere dove andare)
export const SUBITO_PER_LINGUETTA = 2
// le abilità a caso provate per ogni livello e rarità, cercando i pezzi per adesso: con due soli tentativi un eroe già forte ne restava senza
const TENTATIVI_SUBITO = 4
// a ogni giro, per ogni linguetta che veste, se ne vanno i più deboli e ne entrano altrettanti nuovi
export const SE_NE_VANNO = 3
// quanti pezzi venduti il rigattiere tiene da parte
export const ULTIMI_VENDUTI = 5
// il traguardo di un'arma sta al più a due punti di caratteristica da quello che l'eroe regge (tosta, non troppo)
const FINESTRA_DEL_TRAGUARDO = 2 * LIVELLI_PER_REQUISITO
const MARGINE_DELLA_SCELTA = 6

// La roba di chi ha già trovato dei pezzi rari al suo livello, uno per posto: per guardare il banco di un eroe che ha il meglio
// che i mercanti gli darebbero (il cheat `#bottega=`, `npm run bottega`, i test)
export function robaRaraDi(eroe, livello, { gemme = 0, rnd = Math.random } = {}) {
  const porta = (dove, ...basi) => basi.find(x => COSE[x].dove === dove && portaLa(eroeDi(eroe), COSE[x]))
  const raro = b => chiaveDelPezzo(b, livello, 'raro', pescaAbilita(b, 2, rnd))
  const mano = porta('mano', 'scettro', 'balestra', 'bipenne', 'spadone', 'spada')
  return { ...ROBA_VUOTA(), gemme, mano: raro(mano), mancina: COSE[mano].mani === 2 ? null : raro('scudo-teschio'),
           corpo: raro(porta('corpo', 'manto', 'corazza', 'panciotto')), collo: raro('amuleto-osso'),
           dito: raro('anello-verde'), dito2: raro('anello-ambra') }
}

// un pezzo che il banco può portare: mai un leggendario, né uno col nome (dei mostri grossi)
export const consentito = k => !!COSE[k] && COSE[k].rarita !== 'leggendario' && !COSE[k].unico

// i pezzi venduti, riletti dall'avventura: [{ k, prezzo }], i più vecchi prima
const leggiVenduti = dato => (Array.isArray(dato) ? dato : [])
  .filter(x => x && typeof x.k === 'string' && COSE[x.k] && Number.isFinite(x.prezzo) && x.prezzo > 0)
  .map(x => ({ k: x.k, prezzo: Math.round(x.prezzo) })).slice(-ULTIMI_VENDUTI)

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
  // in più che stanno in mostra accanto al banco, scritti anch'essi; `ruota`: i mercanti il cui banco deve cambiare
  // al giro nuovo (alGiroNuovo). `venduti`: gli ultimi pezzi che l'eroe ha venduto al rigattiere, [{ k, prezzo }]
  constructor({ eroe, roba = null, finite = 0, banchi = null, scaffali = null, ruota = null, venduti = null,
                giudicato = null, rnd = Math.random, crescita = null, missioni = null, copricapi = false } = {}) {
    super({ eroe, roba, crescita })
    this.copricapi = copricapi   // la linguetta dei copricapi (dati/mercanti.js): solo il 3D la accende
    this.finite = finite
    this.missioni = missioni   // gli stati delle missioni dell'avventura: la pergamena si vende dopo la sua (`dopo`)
    this.rnd = rnd
    this.banchi = {}
    for (const [k, v] of Object.entries(banchi || {}))
      if (Array.isArray(v)) this.banchi[k] = this.soloRobaMia(k, v)
    this.scaffali = {}
    for (const [k, v] of Object.entries(scaffali || {}))
      if (Array.isArray(v) && mercanteDi(k)) this.scaffali[k] = v.filter(x => typeof x === 'string' && consentito(x) && this.porta(x))
    this.ruota = (Array.isArray(ruota) ? ruota : []).filter(mercanteDi)
    // com'era l'eroe l'ultima volta che si è guardato se al banco restava qualcosa per cui risparmiare, per mercante
    this.giudicato = {}
    for (const [k, v] of Object.entries(giudicato || {})) if (mercanteDi(k) && typeof v === 'string') this.giudicato[k] = v
    this.venduti = leggiVenduti(venduti)
  }

  // quello che si scrive nell'avventura (`botteghe`): i banchi e gli scaffali, e chi deve ancora cambiare
  get botteghe() {
    return { banchi: this.banchi, scaffali: this.scaffali, giudicato: this.giudicato,
             ...(this.ruota.length ? { ruota: this.ruota } : {}) }
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
    return { roba: this.banchi[chiave], sempre: this.sempreDi(m) }
  }

  // quello che sta sempre in cima, a quel punto della storia: le cure grandi arrivano dopo qualche discesa (`dalla`)
  sempreDi(m) { return m.sempre.filter(k => (!COSE[k].dalla || COSE[k].dalla <= this.finite) && dopoLaMissione(COSE[k].dopo, this.missioni)) }

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
    return prezzoAvanti(super.quantoCosta(k), righeAvanti(this.chiEro, this.finite, k)) * (this.eDaSogno(k) ? PREZZO_DEL_SOGNO : 1)
  }

  // un pezzo raro di SOGNO_LIVELLI livelli o più sopra l'eroe: costa il doppio (è il traguardo, il prezzo si legge dal livello e non dal confronto)
  eDaSogno(k) {
    const c = COSE[k]
    return !!(c && c.dove && c.rarita === 'raro' && (c.liv || 1) - this.livelloEroe >= SOGNO_LIVELLI)
  }

  // i pezzi delle righe dopo che il banco non porta: si comprano lo stesso, a un prezzo più alto
  vetrina(chiave) {
    const m = mercanteDi(chiave)
    const b = this.banco(chiave)
    return m && m.passo ? vetrinaDelPasso(m, this, this.finite, { banco: b.roba, vende: x => vendeLa(m, x) }) : []
  }

  // roba che non alza nessun numero di quello che si ha addosso non si mostra (resta pescata: il banco non
  // cambia, cambia cosa si vede). Una seconda arma leggera nella mano libera alza il braccio, quindi si vede
  sottoAddosso(k) {
    const c = COSE[k]
    if (!c || !c.dove || !this.porta(k)) return false
    // uno scudo con un'arma a due mani in pugno non si può portare: non migliora niente
    if (c.dove === 'mancina' && this.aDueMani(this.mano)) return true
    // una casella vuota prende tutto, tranne un'arma che picchia meno dei pugni (un arco a chi ha alzato la forza)
    if (this.postoLibero(c.dove) && c.dove !== 'mano') return false
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
    // `ruolo`: «salto» o «sogno» (ruoloDi); in coda a ogni linguetta, i salti e poi i sogni
    const ordine = { salto: 1, sogno: 2 }
    return [...vista, ...this.rialzi(chiave)].map((r, i) => ({ r: { ...r, ruolo: this.ruoloDi(r.chiave) }, i }))
      .sort((a, b) => (ordine[a.r.ruolo] || 0) - (ordine[b.r.ruolo] || 0) || a.i - b.i).map(x => x.r)
  }

  // quanto vale oggi il posto in cui va `dove`: il punteggio dell'eroe con quello che c'è, meno quello senza
  valoreDelPosto(dove) {
    const senza = this.copia()
    senza.metti(dove, null)
    senza.sistemaLeMani()
    return Math.max(0, this.punteggio() - senza.punteggio())
  }

  // «salto» se alza chiaramente quello che l'eroe ha addosso nel posto (un quarto di quanto vale, e almeno SALTO_MINIMO),
  // anche se non ne ha ancora la caratteristica; «sogno» se è un salto di SOGNO_LIVELLI livelli o più sopra; se no null
  ruoloDi(k) {
    const c = COSE[k]
    if (!c || !c.dove || !consentito(k) || !this.porta(k)) return null
    if (c.dove === 'mancina' && this.aDueMani(this.mano)) return null
    const conf = this.confronto(k)
    if (!conf || !(conf.meglio >= Math.max(SALTO_MINIMO, SALTO_RELATIVO * this.valoreDelPosto(conf.dove)))) return null
    return (c.liv || 1) - this.livelloEroe >= SOGNO_LIVELLI ? 'sogno' : 'salto'
  }

  // i pezzi dello scaffale che si vedono adesso: quelli che migliorano ancora qualcosa, e che non si hanno già
  rialzi(chiave) {
    return (this.scaffali[chiave] || [])
      .filter(k => consentito(k) && !this.possiedo(k) && this.siMostra(k))
      .map(k => ({ chiave: k, sempre: false, avanti: righeAvanti(this.chiEro, this.finite, k), rialzo: true,
                   ...(this.posso(k) ? {} : { meritare: true }) }))
  }

  // Il banco di chi veste (armaiolo, incantatrice, rigattiere) pronto per questo giro, scritto in `banchi` e `scaffali`: la prima volta
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
    const schede = m.schede.filter(s => s.dove && !s.vendi && (!s.copricapi || this.copricapi))
    if (!schede.length) return
    const primo = !this.scaffali[chiave]
    if (primo) this.scaffali[chiave] = []
    const ruota = daRuotare && cera
    const passo = ruota ? delPassoDi(m, this, this.finite, { ammessa: this.ammessaDa(m) }) : []
    // l'eroe è cambiato (un livello, un pezzo addosso o nello zaino) da quando si è guardato l'ultima volta?
    const firma = this.firmaDelGiudizio()
    const daGiudicare = !primo && !ruota && this.giudicato[chiave] !== firma
    this.giudicato[chiave] = firma
    for (const s of schede) {
      if (ruota) this.ruotaLa(m, s, passo)
      else {
        this.riempi(m, s, primo ? PEZZI_PER_LINGUETTA : MINIMO_PER_LINGUETTA)
        // non c'è più niente per cui valga la pena risparmiare (è salito il livello, o si è comprato il pezzo): il banco si rinnova
        if (daGiudicare && this.mancaForza(m, s))
          this.ruotaLa(m, s, delPassoDi(m, this, this.finite, { ammessa: this.ammessaDa(m) }))
      }
    }
  }

  // il livello e quello che l'eroe ha addosso e nello zaino: se non cambia, il banco non si rimette in discussione
  firmaDelGiudizio() {
    return [this.livelloEroe, this.mano, this.mancina, this.corpo, this.collo, this.dito, this.dito2, this.testa, ...this.zaino].join('|')
  }

  // Manca il pezzo per cui risparmiare (meno di SALTI_MINIMI pezzi forti, sogni compresi, o di SOGNI_MINIMI sogni in vista) E ce n'è di nuovi da
  // mettere? Se non c'è niente da offrire il banco resta com'è: non si rinnova per niente
  mancaForza(m, scheda) {
    const ruoli = this.vistaQui(m, scheda).map(r => r.ruolo)
    const salti = ruoli.filter(x => x === 'salto').length, sogni = ruoli.filter(x => x === 'sogno').length
    if (salti + sogni >= SALTI_MINIMI && sogni >= SOGNI_MINIMI) return false
    const visti = this.visti(m)
    return (salti + sogni < SALTI_MINIMI && this.pescaForti(m, scheda, 'salto', 1, visti).length > 0) ||
           (sogni < SOGNI_MINIMI && this.pescaForti(m, scheda, 'sogno', 1, visti).length > 0)
  }

  // tutto quello che questo mercante ha già (banco e scaffale): non si pesca due volte
  visti(m, ancora = []) {
    return new Set([...(this.banchi[m.chiave] || []), ...(this.scaffali[m.chiave] || []), ...ancora])
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
    // un giro pieno porta prima i salti e i sogni che mancano (anche oltre la soglia), poi il resto
    const forti = soglia >= PEZZI_PER_LINGUETTA ? this.completaForti(m, scheda, scartati) + this.completaSubito(m, scheda, scartati) : 0
    const qui = this.vistaQui(m, scheda)
    const manca = soglia - qui.length
    if (manca <= 0) return forti
    const nuovi = this.pescaPer(m, scheda, manca, qui, new Set([...qui.map(r => r.chiave), ...this.visti(m, scartati)]))
    // dal meno caro, dentro il gruppo: lo scaffale si legge come un banco
    nuovi.sort((a, b) => this.quantoCosta(a) - this.quantoCosta(b) || (a < b ? -1 : 1))
    this.scaffali[m.chiave].push(...nuovi)
    return forti + nuovi.length
  }

  // Almeno SUBITO_PER_LINGUETTA pezzi che l'eroe indossa subito e che migliorano quello che ha (i salti stanno più su): se la
  // linguetta ne ha meno, i migliori che ci sono al suo livello, di basi diverse prima, comuni o magici o un raro che sia un
  // salto. Torna quanti ne ha messi (zero se non ce n'è)
  completaSubito(m, scheda, scartati = []) {
    const manca = SUBITO_PER_LINGUETTA - this.vistaQui(m, scheda).filter(r => this.posso(r.chiave) && this.valeLaPena(r.chiave)).length
    if (manca <= 0) return 0
    const visti = this.visti(m, scartati)
    const L = this.livelloEroe
    const rari = this.vistaQui(m, scheda).filter(r => COSE[r.chiave].rarita === 'raro').length
    const candidati = []
    for (const b of BASI_DEL_BANCO) {
      if (!(COSE[b].dove && scheda.dove.includes(COSE[b].dove) && vendeLa(m, b) && !m.sempre.includes(b) && this.porta(b))) continue
      for (let l = L; l >= Math.max(1, L - SALTO_SUBITO_SOTTO); l--) {
        for (const rar of ['comune', 'magico', 'raro']) {
          for (let t = 0; t < (rar === 'comune' ? 1 : TENTATIVI_SUBITO); t++) {
            const ab = rar === 'comune' ? [] : pescaAbilita(b, rar === 'raro' ? 2 : 1 + Math.floor(this.rnd() * 2), this.rnd)
            if (rar !== 'comune' && !ab.length) continue
            const k = chiaveDelPezzo(b, l, rar, ab)
            if (visti.has(k) || !this.posso(k) || !this.valeLaPena(k) || (rar === 'raro' && (rari >= RARI_PER_LINGUETTA || this.ruoloDi(k) !== 'salto'))) continue
            candidati.push({ k, b, meglio: this.confronto(k).meglio })
          }
        }
      }
    }
    candidati.sort((x, y) => y.meglio - x.meglio || (x.k < y.k ? -1 : 1))
    const presi = []
    let rariPresi = rari
    const prendi = c => {
      const raro = COSE[c.k].rarita === 'raro'
      if (presi.length >= manca || presi.includes(c) || (raro && rariPresi >= RARI_PER_LINGUETTA)) return
      presi.push(c)
      if (raro) rariPresi++
    }
    for (const c of candidati) if (!presi.some(p => p.b === c.b)) prendi(c)
    for (const c of candidati) prendi(c)
    this.scaffali[m.chiave].push(...presi.map(c => c.k))
    return presi.length
  }

  // Porta la linguetta a SALTI_PER_LINGUETTA salti e SOGNI_PER_LINGUETTA sogni, mettendo sullo scaffale quelli che mancano
  completaForti(m, scheda, scartati = []) {
    const ruoli = this.vistaQui(m, scheda).map(r => r.ruolo)
    const visti = this.visti(m, scartati)
    const salti = this.pescaForti(m, scheda, 'salto', SALTI_PER_LINGUETTA - ruoli.filter(x => x === 'salto').length, visti)
    for (const k of salti) visti.add(k)
    const bisogno = SOGNI_PER_LINGUETTA - ruoli.filter(x => x === 'sogno').length
    const sogni = this.pescaForti(m, scheda, 'sogno', bisogno, visti)
    // il caso può non dare due sogni al primo tentativo: due riprese
    for (let t = 0; t < 2 && sogni.length < bisogno; t++) {
      for (const k of sogni) visti.add(k)
      sogni.push(...this.pescaForti(m, scheda, 'sogno', bisogno - sogni.length, visti))
    }
    this.scaffali[m.chiave].push(...salti, ...sogni)
    return salti.length + sogni.length
  }

  // I candidati di ogni base (fino a quanti+3 basi) con quel ruolo, fra i livelli da..a, aggiunti a `trovati`
  cercaForti(basi, ruolo, quanti, visti, da, a, trovati) {
    const sogno = ruolo === 'sogno'
    for (const b of basi) {
      if (trovati.length >= quanti + 3) break
      const cand = []
      for (let l = da; l <= a; l++) {
        for (const rar of sogno ? ['raro'] : ['comune', 'magico', 'raro']) {
          for (let t = 0; t < (rar === 'comune' ? 1 : 2); t++) {
            const ab = rar === 'comune' ? [] : pescaAbilita(b, rar === 'raro' ? 2 : 1 + Math.floor(this.rnd() * 2), this.rnd)
            if (rar !== 'comune' && !ab.length) continue
            const k = chiaveDelPezzo(b, l, rar, ab)
            if (!visti.has(k) && !this.possiedo(k) && this.ruoloDi(k) === ruolo) cand.push(k)
          }
        }
      }
      const gia = trovati.find(t => t.base === b)
      if (gia) gia.cand.push(...cand)
      else if (cand.length) trovati.push({ base: b, cand })
    }
  }

  // Pezzi forti per la linguetta, di basi diverse (più figure): `salto` di qualche livello sopra (comune, magico o raro: uno a
  // caso fra quelli che alzano chiaramente, e di solito uno solo che l'eroe regge già), `sogno` raro di SOGNO_LIVELLI livelli e
  // più sopra (più su ancora se l'eroe ha già il meglio di quei livelli), il più caro di ogni base. Quello che torna è sempre
  // quel ruolo (ruoloDi)
  pescaForti(m, scheda, ruolo, quanti, visti) {
    if (quanti <= 0) return []
    const basi = BASI_DEL_BANCO.filter(b => COSE[b].dove && scheda.dove.includes(COSE[b].dove) && vendeLa(m, b) &&
                                     !m.sempre.includes(b) && this.porta(b))
    const L = this.livelloEroe
    const sogno = ruolo === 'sogno'
    let [da, a] = sogno ? [L + SOGNO_LIVELLI, L + SOGNO_LIVELLI + SOGNO_SPAZIO] : [L + 1, L + SOGNO_LIVELLI - 1]
    const mescolate = basi.map(b => ({ b, r: this.rnd() })).sort((x, y) => x.r - y.r).map(x => x.b)
    const trovati = []   // [{ base, cand: [k] }]
    // il salto che si mette subito è del livello dell'eroe o sotto: un pezzo si indossa dal suo livello
    const subitoDi = []
    if (!sogno) this.cercaForti(mescolate, ruolo, quanti, visti, Math.max(1, L - SALTO_SUBITO_SOTTO), L, subitoDi)
    const trovatiIn = () => trovati.reduce((n, t) => n + t.cand.length, 0)
    for (let giro = 0; giro < 10 && trovatiIn() < quanti; giro++) {
      if (giro) { da = a + 1; a = da + SOGNO_SPAZIO * giro }
      this.cercaForti(mescolate, ruolo, quanti, visti, da, a, trovati)
      if (!sogno) break
    }
    // altri pezzi delle stesse basi, per quando le basi non bastano (un mago ha poche armi): altri livelli, altre abilità
    const altri = presi => trovati.flatMap(t => t.cand).filter(k => !presi.includes(k))
      .map(k => ({ k, r: this.rnd() })).sort((x, y) => x.r - y.r).map(x => x.k)
    const presi = []
    if (sogno) {
      // il più caro di ogni base (il pezzo da sogno costa: le basi di pregio, al livello più alto), e fra le prime una scelta a caso
      const caro = t => t.cand.reduce((x, y) => (this.quantoCosta(y) > this.quantoCosta(x) ? y : x))
      const top = trovati.map(t => caro(t)).sort((x, y) => this.quantoCosta(y) - this.quantoCosta(x)).slice(0, quanti + 1)
      presi.push(...top.map(k => ({ k, r: this.rnd() })).sort((x, y) => x.r - y.r).slice(0, quanti).map(x => x.k))
    } else {
      // il primo, se si può, uno che l'eroe regge già: il salto che si compra e si mette; poi uno per base
      const uno = t => t.cand[Math.floor(this.rnd() * t.cand.length)]
      const subito = subitoDi.flatMap(t => t.cand.filter(k => this.posso(k)))
      if (subito.length) presi.push(subito.sort((x, y) => this.confronto(y).meglio - this.confronto(x).meglio || (x < y ? -1 : 1))[0])
      for (const t of trovati) if (presi.length < quanti) presi.push(uno(t))
    }
    for (const k of altri(presi)) if (presi.length < quanti) presi.push(k)
    return presi.slice(0, quanti)
  }

  // Un pezzo per questa linguetta: lo porta la classe, non è già lì, e se ha un posto addosso lo alza
  valeLaPena(k) {
    if (!COSE[k] || !COSE[k].dove || !consentito(k) || this.possiedo(k) || !this.porta(k) || !this.siMostra(k)) return false
    const conf = this.confronto(k)
    return !!conf && !(conf.addosso && !(conf.meglio > 0))
  }

  // Pesca `quanti` pezzi nuovi per la linguetta, a tono col livello dell'eroe: comuni e magici (abilità a caso) del
  // livello a cui l'eroe regge l'arma e di quello che ha, e solo se non bastano di più su, livello dopo livello, fino
  // a trovare pezzi che migliorano quello che ha addosso. Mai un raro (stanno nei salti e nei sogni) né un leggendario, e
  // al più DA_MERITARE pezzi che non regge ancora (`qui`: quelli già in vista). Uno per base prima, poi il resto, a caso
  pescaPer(m, scheda, quanti, qui, visti) {
    const basi = BASI_DEL_BANCO.filter(b => COSE[b].dove && scheda.dove.includes(COSE[b].dove) && vendeLa(m, b) &&
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
    let daMeritare = qui.filter(r => !r.ruolo && !this.posso(r.chiave)).length
    for (let su = 0; (su < SOGNO_LIVELLI || (pool.length < quanti && su <= RIALZO_MASSIMO)) && pool.length < quanti + MARGINE_DELLA_SCELTA; su++) {
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
    }
    // il traguardo: per ogni base, il primo livello (poco più su) a cui l'eroe non la regge ancora; gli manca un punto di caratteristica
    for (const b of basi) {
      for (let l = L + 1; l <= L + FINESTRA_DEL_TRAGUARDO; l++) {
        if (this.reggo(aLivello(b, l))) continue
        prova(chiaveDelPezzo(b, l))
        const abilita = pescaAbilita(b, 1 + Math.floor(this.rnd() * 2), this.rnd)
        if (abilita.length) prova(chiaveDelPezzo(b, l, 'magico', abilita))
        break
      }
    }
    // quelli che si indossano subito prima di quelli da tenere per dopo
    const mescolati = pool.map(k => ({ k, r: this.rnd() })).sort((a, b) => (this.posso(b.k) - this.posso(a.k)) || a.r - b.r).map(x => x.k)
    const presi = []
    const basiPrese = new Set()
    const sta = k => this.posso(k) || daMeritare < DA_MERITARE
    const metti = k => {
      presi.push(k)
      basiPrese.add(baseDi(k))
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

  // compra solo chi lo dice (il rigattiere): gli altri vendono e basta. Quello che compra lo tiene da parte, gli ultimi
  // ULTIMI_VENDUTI, al prezzo a cui l'ha pagato: si può riprendere (`riacquistaDa`)
  vendiA(chiave, i) {
    const m = mercanteDi(chiave)
    if (!(m && m.compra)) return null
    const e = this.vendi(i)
    if (e) {
      this.venduti.push({ k: e.cosa, prezzo: e.gemme })
      while (this.venduti.length > ULTIMI_VENDUTI) this.venduti.shift()
    }
    return e
  }

  // le cose da riprendere, dalla più recente: [{ k, prezzo, i }]
  daRiacquistare(chiave) {
    const m = mercanteDi(chiave)
    return m && m.compra ? this.venduti.map((x, i) => ({ ...x, i })).reverse() : []
  }

  // riprende la cosa `i` dei venduti, allo stesso prezzo a cui l'ha pagata il mercante (non al prezzo del banco); come ogni
  // cosa comprata, se è migliore va addosso, se no in tasca; zaino pieno, niente
  riacquistaDa(chiave, i) {
    const m = mercanteDi(chiave)
    const x = m && m.compra ? this.venduti[i] : null
    if (!x) return null
    if (this.gemme < x.prezzo) return { che: 'niente' }
    if (this.nonCiStarebbe(x.k)) { this.dillo(this.perchéNonCiSta(x.k)); return { che: 'pieno' } }
    this.gemme -= x.prezzo
    this.venduti.splice(i, 1)
    return this.prendi(x.k)
  }

  // sopra non c'è buio: una torcia comprata aspetta alla cintura, e si accende scendendo (Corsa)
  accendi(k) {
    this.torceInScorta++
    this.dilloDi(k, ` alla cintura · ne hai ${this.quanteNeHo(k)}`)
    return true
  }
}
