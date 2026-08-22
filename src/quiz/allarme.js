/* ═══════════════════════════════════════════════════════════════════
   QUANDO UN TIPO DI DOMANDA VA MALE, LO SI DICE A UN GRANDE

   `consiglio.js` sa già dire quando una tipologia è un muro — otto
   risposte almeno, meno di metà giuste — e sapeva dirlo a nessuno: la
   schermata che lo mostrava è sospesa (vedi «Come va» in CLAUDE.md), e
   il conto restava scritto nel profilo senza che lo leggesse nessuno.

   Qui c'è il pezzo che mancava: **il momento in cui si dice**. Non una
   schermata nuova, non un cartello dentro il gioco — un avviso nella
   posta dei grandi (`store/posta.js`), cioè il pallino sul ⚙︎ e il
   nastro in home che dice al bambino di chiamare la mamma o il papà. È
   la stessa strada del codice rimesso a `0000`, ed è nata per questo:
   un fatto capitato sul telefono che un grande deve poter scoprire
   anche se non c'era.

   ── PERCHÉ NON RITOCCA DA SÉ ──────────────────────────────────────
   È la regola scritta in testa a `consiglio.js` e non cambia: un
   pomeriggio storto, un fratello che ha giocato al posto suo, dieci
   risposte a caso per arrivare in fondo, e il gioco «imparerebbe» la
   cosa sbagliata senza che nessuno possa vederlo. Qui si porta un
   numero sotto gli occhi di chi decide — «ne ha sbagliate 7 su 10» — e
   il tasto per ritoccare è quello di sempre, la ✎ della sua riga nel
   quadro dell'età.

   ── E PERCHÉ UNA VOLTA SOLA ───────────────────────────────────────
   Una tipologia che va male non va male una volta: va male per
   settimane. Un avviso per ogni risposta sbagliata sarebbe la posta
   piena di dieci righe uguali, cioè un avviso che non legge più
   nessuno. `avvisaUnaVolta` tiene la memoria di quello che è già stato
   detto, per bambino e per chiave.

   ── COSA SI DICE, E COSA NO ───────────────────────────────────────
   Solo il muro, non il pedaggio. «Le indovina quasi tutte» è vero e
   non è un problema — al massimo è tempo speso su roba facile — e
   metterlo nella stessa posta di «tuo figlio non ci sta capendo
   niente» insegnerebbe a scorrere gli avvisi invece di leggerli.
   ═══════════════════════════════════════════════════════════════════ */

import { MODULI } from './nucleo/registro.js'
import { contoDi, consiglioDa } from './consiglio.js'
import { avvisaUnaVolta } from '../store/posta.js'
import { state, nomeCorrente } from '../store/profile.js'

/* Il nome leggibile di una tipologia: `orto:doppie` → «Le doppie». Lo
   dichiarano i moduli, ed è quello che compare anche nel quadro — così
   un grande ritrova nella riga la stessa parola che ha letto
   nell'avviso. Senza nome non si avvisa affatto: «la chiave orto:doppie
   va male» non è una frase che si possa dare a leggere a qualcuno. */
let nomi = null
export function nomeDelTipo(chiave) {
  if (!nomi) {
    nomi = new Map()
    for (const m of MODULI)
      for (const t of m.tipi || []) nomi.set(t.chiave, t.nome)
  }
  return nomi.get(chiave) || ''
}

/* ── la frase ──
   Pura e a parte, perché è l'unica cosa che un test possa guardare
   senza un archivio: dice **il numero** e non il giudizio, come vuole
   `consiglio.js`, e chiude con la cosa che c'è da fare. */
export function frasePerIlGrande({ chi, nome, detto }) {
  return `${chi}: «${nome}» — ${detto}. ` +
    'Guarda se è roba che a scuola non hanno ancora fatto: in «Come va» ' +
    'trovi la riga con tutti i numeri, e da lì si rimanda o si rende più facile.'
}

/* ── la guardia, chiamata a ogni risposta ──
   Costa un conto su una chiave sola, quindi si può permettere di stare
   sulla strada di ogni domanda. Non aspetta nessuno: chi la chiama
   (`quiz/memoria.js`) non ha niente da fare con la risposta, e una
   scrittura in archivio non deve mai stare fra un bambino e la domanda
   dopo. */
export function guardaComeVa(chiave, { items = state.profile?.items,
                                       chi = nomeCorrente(),
                                       player = state.player } = {}) {
  if (!chiave || !items) return null
  const consiglio = consiglioDa(contoDi([chiave], items))
  /* solo il muro: vedi in testa al file */
  if (!consiglio || consiglio.verso !== -1) return null
  const nome = nomeDelTipo(chiave)
  if (!nome) return null
  const testo = frasePerIlGrande({ chi: chi || 'Chi gioca', nome, detto: consiglio.detto })
  /* la scheda è quella dove si va a fare qualcosa: «Come va», che
     dell'avviso è il seguito naturale — la riga di cui parla sta lì in
     cima, perché l'elenco è ordinato dalla peggiore */
  avvisaUnaVolta(`${player || '?'}:${chiave}`, testo,
                 { testo: 'guarda com\'è andata', scheda: 'comeva' })
    .catch(() => {})
  return testo
}
