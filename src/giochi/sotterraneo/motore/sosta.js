// La discesa lasciata a metà (docs/sotterraneo/regole.md, "Lasciare a metà"). Il piano non si salva, si
// rifà dal seme; le robe (dove il caso vero è già passato) si salvano com'è messo ognuna. I mostri tornano
// al loro posto, come dopo uno svenimento. Se la forma cambia (VERSIONE sale) un salvataggio vecchio non si
// legge più: si ricomincia — un campo che non torna è un gioco rotto in un modo che nessuno sa spiegare.
import { Corsa } from './corsa.js'
import { rileggiRoba, ROBA_VUOTA, VERSIONE_ROBA } from './corredo.js'
import { gemmeDiBentornato } from '../dati/mercanti.js'
import { COSE, STANZE_TORCIA } from '../dati/cose.js'
import { DI_PARTENZA } from '../dati/eroi.js'
import { INDICE_ABISSO, L_ABISSO } from '../dati/campagna.js'

// la 2 si legge ancora (eccezione voluta): non ha niente che non torni, solo il nome di chi scendeva —
// che sbagliava comunque — e riprende col cavaliere invece di buttare venti minuti di discesa
export const VERSIONE = 3
const LEGGIBILI = [2, VERSIONE]

// `visto`: si contano le lunghezze dei tratti (cominciando dagli spenti), non i 2600 zero/uno per cella:
// "120.30.8" vuol dire 120 celle mai viste, 30 viste, 8 no
export function stringaDi(visto) {
  const pezzi = []
  let quanti = 0, valore = 0
  for (let i = 0; i < visto.length; i++) {
    const v = visto[i] ? 1 : 0
    if (v === valore) { quanti++; continue }
    pezzi.push(quanti)
    valore = v
    quanti = 1
  }
  pezzi.push(quanti)
  return pezzi.join('.')
}

export function vistoDa(stringa, quante) {
  const visto = new Uint8Array(quante)
  if (!stringa) return visto
  let i = 0, valore = 0
  for (const p of stringa.split('.')) {
    const n = Number(p) || 0
    if (valore) for (let k = 0; k < n && i + k < quante; k++) visto[i + k] = 1
    i += n
    valore = valore ? 0 : 1
  }
  return visto
}

// `tappa` è l'indice nella campagna (l'abisso è −1, INDICE_ABISSO: il campo guadagna un valore, non cambia
// significato). Una discesa finita non si salva, tranne l'abisso: là non finisce mai, finisce solo la
// sera, e chi vuole scriverlo comunque lo chiede per nome (`anchePerFinite`)
export function scrivi(corsa, tappa, { anchePerFinite = false } = {}) {
  if (!corsa || (corsa.finita && !anchePerFinite)) return null
  return {
    v: VERSIONE,
    tappa,
    seme: corsa.seme,
    piano: corsa.piano,
    // `eroe` (chi scende) e `dove` (dov'era) erano lo stesso campo: nel letterale la seconda cancellava la
    // prima, e si riprendeva sempre col cavaliere
    eroe: corsa.chiEro,
    vita: corsa.vita,
    vitaBase: corsa.vitaBase,
    gemme: corsa.gemme,
    zaino: [...corsa.zaino],
    mano: corsa.mano,
    mancina: corsa.mancina,   // campo aggiunto: un salvataggio senza si rilegge senza niente in quella mano
    corpo: corsa.corpo,
    dito: corsa.dito,
    // torcia: sempre accesa sì/no; torciaResta/torce sono campi aggiunti (torcia:true di prima si rilegge come piena)
    torcia: corsa.torciaAccesa,
    torciaResta: corsa.torciaResta,
    torce: corsa.torceInScorta,
    chiave: corsa.chiaveDelPiano,
    dove: { x: corsa.eroe.x, y: corsa.eroe.y },
    guarda: corsa.guarda,
    visto: stringaDi(corsa.visto),
    stanze: [...corsa.stanzeDentro],
    conti: {
      domande: corsa.domande, mostri: corsa.mostriBattuti, tesori: corsa.tesori,
      stanzeViste: corsa.stanzeViste, piani: corsa.pianiFatti,
      svenimenti: corsa.svenimenti, chieste: corsa.contaChieste,
      qui: corsa.svenimentiQui,   // spese su QUESTO piano (solo l'abisso); un salvataggio senza riparte da zero
    },
    robe: corsa.livello.robe.map(pulisci),
  }
}

// dove stava un mostro in questo istante (fx, fy) non si riprende: riprendendo torna a casa sua
function pulisci(r) {
  const { fx, fy, calmo, sveglio, detto, casa, ...resto } = r
  if (casa) { resto.x = casa.x; resto.y = casa.y }
  return resto
}

// torna una Corsa pronta a giocare, o null se il salvataggio non si può leggere. `roba`: quella
// dell'avventuriero (cfg.roba), che comanda su quella scritta qui — sopra si può essere passati dai mercanti.
// La copia nella sosta serve solo ai salvataggi di prima che la roba restasse (docs/sotterraneo/regole.md)
export function leggi(dato, tappa, ripiego = DI_PARTENZA, roba = null) {
  if (!dato || !LEGGIBILI.includes(dato.v) || !dato.robe) return null
  try {
    // nella 2 `eroe` portava la cella, non il nome: al posto del cavaliere di sistema si usa il `ripiego`
    const chiEro = typeof dato.eroe === 'string' ? dato.eroe : ripiego
    const dove = dato.dove || (typeof dato.eroe === 'object' ? dato.eroe : null)
    if (!dove) return null
    const corsa = new Corsa(tappa, { seme: dato.seme, eroe: chiEro })
    corsa.piano = dato.piano || 0
    corsa.nuovoPiano()                     // lo stesso piano di allora, dal seme

    corsa.livello.robe = dato.robe.map(r => ({ ...r }))
    corsa.vitaBase = dato.vitaBase
    corsa.vita = dato.vita
    corsa.gemme = dato.gemme
    // quello che non si riconosce più si butta: un id sparito è una casella che non si può nemmeno togliere
    const vera = k => (k && COSE[k] ? k : null)
    corsa.zaino = (dato.zaino || []).filter(k => COSE[k])
    corsa.mano = vera(dato.mano)
    corsa.mancina = vera(dato.mancina)
    corsa.corpo = vera(dato.corpo)
    corsa.dito = vera(dato.dito)
    corsa.torciaResta = dato.torciaResta != null ? dato.torciaResta
      : (dato.torcia ? STANZE_TORCIA : 0)
    corsa.torceInScorta = dato.torce || 0
    if (roba) corsa.indossa(roba)
    corsa.chiaveDelPiano = !!dato.chiave
    corsa.eroe = { x: dove.x, y: dove.y }
    corsa.guarda = dato.guarda || 'dx'
    corsa.visto = vistoDa(dato.visto, corsa.livello.largo * corsa.livello.alto)
    corsa.stanzeDentro = new Set(dato.stanze || [])

    const c = dato.conti || {}
    corsa.domande = c.domande || 0
    corsa.mostriBattuti = c.mostri || 0
    corsa.tesori = c.tesori || 0
    corsa.stanzeViste = c.stanzeViste || 0
    corsa.pianiFatti = c.piani || 0
    corsa.svenimenti = c.svenimenti || 0
    corsa.svenimentiQui = c.qui || 0
    corsa.contaChieste = c.chieste || 0

    corsa.aggiornaLuce()
    corsa.segnaLaStanza()   // riprendere non è entrare in una stanza, o il primo passo consumerebbe torcia
    // un salvataggio d'un mago che rientra con un'ascia in pugno (da prima del limite di classe): va in
    // tasca, o per terra se piene, e lo dice — la versione non sale, la forma è identica
    corsa.sistemaIlCorredo()
    return corsa
  } catch (e) {
    return null   // un salvataggio storto non porta giù il gioco: si ricomincia
  }
}

// la roba di una sosta scritta prima che la roba restasse: chi aveva lasciato una discesa a metà se la ritrova
// sopra (Gioco.vue, la prima volta che legge cfg.roba). null se la sosta non si legge
export function robaDi(dato) {
  if (!dato || !LEGGIBILI.includes(dato.v)) return null
  return rileggiRoba({
    v: VERSIONE_ROBA, gemme: dato.gemme, zaino: dato.zaino,
    mano: dato.mano, mancina: dato.mancina, corpo: dato.corpo, dito: dato.dito,
    torcia: dato.torciaResta != null ? dato.torciaResta : (dato.torcia ? STANZE_TORCIA : 0),
    torce: dato.torce || 0,
  })
}

// La roba dell'avventuriero com'è nel profilo (cfg.roba), o — la prima volta — quella della discesa lasciata
// a metà prima che la roba restasse, più le gemme di bentornato a chi aveva già finito delle discese. Torna
// anche se va scritta (`nuova`): chi legge la prima volta la deve salvare, o il regalo tornerebbe a ogni avvio
export function robaDiCasa({ salvata = null, sosta = null, finite = 0 } = {}) {
  const r = rileggiRoba(salvata)
  if (r) return { roba: r, nuova: false }
  const prima = robaDi(sosta) || ROBA_VUOTA()
  prima.gemme += gemmeDiBentornato(finite)
  return { roba: prima, nuova: true }
}

// due righe per la carta "riprendi": cosa si sta lasciando in sospeso
export function dice(dato, campagna) {
  if (!dato || !LEGGIBILI.includes(dato.v)) return null
  // l'abisso non sta nella campagna: senza questa riga la carta "riprendi" sparirebbe in silenzio
  const t = dato.tappa === INDICE_ABISSO ? L_ABISSO : campagna[dato.tappa]
  if (!t) return null
  return {
    tappa: dato.tappa,
    nome: t.nome,
    icona: t.icona,
    piano: (dato.piano || 0) + 1,
    piani: t.abisso ? null : t.piani,   // l'abisso non lo sa: "piano 23" invece di "piano 23 di …"
    eroe: typeof dato.eroe === 'string' ? dato.eroe : null,
    vita: dato.vita,
    gemme: dato.gemme,
  }
}
