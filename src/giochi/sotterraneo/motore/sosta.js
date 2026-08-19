/* ═══════════════════════════════════════════════════════════════════
   LA DISCESA LASCIATA A METÀ

   Una discesa è lunga: tre o quattro piani, quaranta domande, venti
   minuti buoni. Prima, chiudere il gioco voleva dire buttarla via — e
   un bambino il gioco lo chiude sempre, perché si mangia, perché
   suonano alla porta, perché il telefono si spegne. Qui si scrive tutto
   quello che serve a rimetterla in piedi identica, e si rilegge.

   ── IL PIANO NON SI SALVA: SI RIFÀ ────────────────────────────────
   Un piano è **una funzione del seme** (`generaPiano`), quindi celle,
   stanze e corridoi non hanno bisogno di stare in archivio: si
   rigenerano uguali. Quello che invece non si rifà è tutto ciò che è
   *successo* — chi è caduto, cosa si è aperto, cosa sta per terra —
   perché lì di mezzo c'è il caso vero (`rnd`), che nel gioco è
   `Math.random` e non si riavvolge. Perciò le robe si salvano com'è
   messo ognuna: sono qualche decina, sono dato piano, e sono l'unica
   cosa che non si può ricostruire.

   ── I MOSTRI TORNANO AL LORO POSTO ────────────────────────────────
   Chi stava inseguendo si ritrova a casa sua. Non è distrazione: era
   l'alternativa a riaprire il gioco con l'orco addosso e un colpo già
   partito, che è il modo più rapido di far pentire qualcuno di aver
   ripreso. È la stessa regola del risveglio dopo uno svenimento.

   ── SE LA FORMA CAMBIA, SI BUTTA ──────────────────────────────────
   `VERSIONE` sale ogni volta che questo formato cambia, e un
   salvataggio di ieri con una forma di ieri **non si legge**: si
   ricomincia la discesa. Una partita persa è un dispiacere; una partita
   ripresa a metà con dei campi che non tornano è un gioco rotto in un
   modo che nessuno sa spiegare.
   ═══════════════════════════════════════════════════════════════════ */
import { Corsa } from './corsa.js'
import { COSE } from '../dati/cose.js'

/* Sale ogni volta che cambia la forma. La 2 porta i quattro eroi e la
   terza casella addosso: un salvataggio della 1 non sa chi fosse a
   scendere, e non si indovina. */
export const VERSIONE = 2

/* ── il campo `visto` ──
   Duemilaseicento numeri di zero e uno: scritti così sono venti
   chilobyte di JSON per niente. Si contano invece **le lunghezze** dei
   tratti, cominciando dagli spenti: `"120.30.8"` vuol dire centoventi
   celle mai viste, trenta viste, otto no. Una mappa appena cominciata
   sta in dieci numeri. */
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

/* ── quello che si scrive ──
   `tappa` è l'indice nella campagna, non la tappa intera: la tabella
   sta nel codice e cambia con le versioni, l'indice no. */
export function scrivi(corsa, tappa) {
  if (!corsa || corsa.finita) return null
  return {
    v: VERSIONE,
    tappa,
    seme: corsa.seme,
    piano: corsa.piano,
    eroe: corsa.chiEro,
    vita: corsa.vita,
    vitaBase: corsa.vitaBase,
    gemme: corsa.gemme,
    zaino: [...corsa.zaino],
    mano: corsa.mano,
    corpo: corsa.corpo,
    dito: corsa.dito,
    torcia: corsa.torcia,
    chiave: corsa.chiaveDelPiano,
    eroe: { x: corsa.eroe.x, y: corsa.eroe.y },
    guarda: corsa.guarda,
    visto: stringaDi(corsa.visto),
    stanze: [...corsa.stanzeDentro],
    conti: {
      domande: corsa.domande, mostri: corsa.mostriBattuti, tesori: corsa.tesori,
      stanzeViste: corsa.stanzeViste, piani: corsa.pianiFatti,
      svenimenti: corsa.svenimenti, chieste: corsa.contaChieste,
    },
    robe: corsa.livello.robe.map(pulisci),
  }
}

/* Le robe si salvano come sono, meno quello che serviva solo a chi
   correva: dove stava un mostro **in questo istante** (`fx`, `fy`) non
   si riprende, perché riprendendo torna a casa sua. */
function pulisci(r) {
  const { fx, fy, calmo, sveglio, detto, casa, ...resto } = r
  if (casa) { resto.x = casa.x; resto.y = casa.y }
  return resto
}

/* ── quello che si rilegge ──
   Torna una `Corsa` pronta a giocare, o `null` se il salvataggio non si
   può leggere: chi chiama in quel caso comincia una discesa nuova, e
   non deve saperne il perché. */
export function leggi(dato, tappa) {
  if (!dato || dato.v !== VERSIONE || !dato.robe) return null
  try {
    const corsa = new Corsa(tappa, { seme: dato.seme, eroe: dato.eroe })
    corsa.piano = dato.piano || 0
    corsa.nuovoPiano()                     // lo stesso piano di allora, dal seme

    corsa.livello.robe = dato.robe.map(r => ({ ...r }))
    corsa.vitaBase = dato.vitaBase
    corsa.vita = dato.vita
    corsa.gemme = dato.gemme
    /* Quello che non si riconosce più si butta, invece di portarselo
       dietro: un id sparito è una casella che non si può nemmeno
       togliere, e un gioco in cui non si può togliere una cosa che non
       esiste è un gioco fermo. */
    const vera = k => (k && COSE[k] ? k : null)
    corsa.zaino = (dato.zaino || []).filter(k => COSE[k])
    corsa.mano = vera(dato.mano)
    corsa.corpo = vera(dato.corpo)
    corsa.dito = vera(dato.dito)
    corsa.torcia = !!dato.torcia
    corsa.chiaveDelPiano = !!dato.chiave
    corsa.eroe = { x: dato.eroe.x, y: dato.eroe.y }
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
    corsa.contaChieste = c.chieste || 0

    corsa.aggiornaLuce()
    return corsa
  } catch (e) {
    /* un salvataggio storto non porta giù il gioco: si ricomincia. È la
       stessa scelta dell'archivio, che non lancia mai. */
    return null
  }
}

/* Due righe per la carta «riprendi»: cosa si sta lasciando in sospeso.
   Le legge la schermata delle discese, che di `Corsa` non sa niente. */
export function dice(dato, campagna) {
  if (!dato || dato.v !== VERSIONE) return null
  const t = campagna[dato.tappa]
  if (!t) return null
  return {
    tappa: dato.tappa,
    nome: t.nome,
    icona: t.icona,
    piano: (dato.piano || 0) + 1,
    piani: t.piani,
    eroe: dato.eroe,
    vita: dato.vita,
    gemme: dato.gemme,
  }
}
