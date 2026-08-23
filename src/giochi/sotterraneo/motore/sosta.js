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
import { DI_PARTENZA } from '../dati/eroi.js'
import { INDICE_ABISSO, L_ABISSO } from '../dati/campagna.js'

/* Sale ogni volta che cambia la forma. La 2 porta i quattro eroi e la
   terza casella addosso: un salvataggio della 1 non sa chi fosse a
   scendere, e non si indovina. La 3 separa **chi** scendeva da **dove**
   era arrivato, che nella 2 finivano nella stessa casella (vedi sotto).

   ── LA 2 SI LEGGE ANCORA, ED È UN'ECCEZIONE VOLUTA ────────────────
   La regola di casa è che una forma vecchia si butta, perché un campo
   che non torna è un gioco rotto in un modo che nessuno sa spiegare.
   Qui però non c'è niente che non torni: la 2 ha tutto tranne il nome
   di chi scendeva, e chi scendeva è esattamente quello che la 2
   sbagliava comunque. Si riprende col cavaliere — cioè come faceva
   prima — invece di buttare venti minuti di discesa a chi aggiorna
   proprio adesso. */
export const VERSIONE = 3
const LEGGIBILI = [2, VERSIONE]

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
   sta nel codice e cambia con le versioni, l'indice no. L'abisso è
   l'indice **−1** (`INDICE_ABISSO`): il campo non cambia significato,
   guadagna un valore — e per questo `VERSIONE` non sale. Un salvataggio
   di ieri porta un indice fra 0 e 5 e si rilegge esattamente come prima.

   ── E UNA DISCESA FINITA NON SI SALVA, TRANNE UNA ─────────────────
   Non c'è più niente da riprendere: è la regola, e vale per le sei
   tappe. L'abisso però **non finisce** — quello che finisce è la sera —
   e quando si risale al fondo degli svenimenti quello che si scrive è
   *il punto da cui si rientra*. Chi lo vuole lo chiede per nome
   (`anchePerFinite`), così la regola resta quella e l'eccezione si
   legge dove viene usata. */
export function scrivi(corsa, tappa, { anchePerFinite = false } = {}) {
  if (!corsa || (corsa.finita && !anchePerFinite)) return null
  return {
    v: VERSIONE,
    tappa,
    seme: corsa.seme,
    piano: corsa.piano,
    /* `eroe` è **chi** scende, `dove` è la cella in cui si era: erano
       tutte e due `eroe`, e in un letterale la seconda cancella la
       prima senza che niente si lamenti. Il gioco riprendeva quindi
       sempre col cavaliere, chiunque avessi scelto — e la mappa delle
       discese, che legge la scelta e non il salvataggio, continuava a
       mostrare il ritratto giusto. */
    eroe: corsa.chiEro,
    vita: corsa.vita,
    vitaBase: corsa.vitaBase,
    gemme: corsa.gemme,
    zaino: [...corsa.zaino],
    mano: corsa.mano,
    /* La mano debole è un campo **aggiunto**, e per questo la versione
       non sale: un salvataggio che non ce l'ha si rilegge senza niente
       in quella mano, che è esattamente com'era il gioco prima. La
       versione sale quando un campo *cambia significato* — quella è la
       cosa che nessuno saprebbe spiegare, non un campo in più con un
       ripiego ovvio. */
    mancina: corsa.mancina,
    corpo: corsa.corpo,
    dito: corsa.dito,
    torcia: corsa.torcia,
    chiave: corsa.chiaveDelPiano,
    dove: { x: corsa.eroe.x, y: corsa.eroe.y },
    guarda: corsa.guarda,
    visto: stringaDi(corsa.visto),
    stanze: [...corsa.stanzeDentro],
    conti: {
      domande: corsa.domande, mostri: corsa.mostriBattuti, tesori: corsa.tesori,
      stanzeViste: corsa.stanzeViste, piani: corsa.pianiFatti,
      svenimenti: corsa.svenimenti, chieste: corsa.contaChieste,
      /* quante occasioni si sono spese **su questo piano**: serve solo
         all'abisso, e un salvataggio che non ce l'ha riparte da zero —
         che è il ripiego ovvio, cioè il motivo per cui la versione non
         sale */
      qui: corsa.svenimentiQui,
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
export function leggi(dato, tappa, ripiego = DI_PARTENZA) {
  if (!dato || !LEGGIBILI.includes(dato.v) || !dato.robe) return null
  try {
    /* Nella 2 `eroe` portava la cella, non il nome: quello che arriva
       qui è un oggetto, e `eroeDi` di un oggetto torna il primo della
       lista. Si dichiara invece di lasciarlo capitare — e al posto del
       cavaliere di sistema si usa il `ripiego` che passa chi chiama,
       cioè l'eroe scelto in casa: è quasi sempre la stessa persona che
       aveva cominciato la discesa. */
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
    /* Quello che non si riconosce più si butta, invece di portarselo
       dietro: un id sparito è una casella che non si può nemmeno
       togliere, e un gioco in cui non si può togliere una cosa che non
       esiste è un gioco fermo. */
    const vera = k => (k && COSE[k] ? k : null)
    corsa.zaino = (dato.zaino || []).filter(k => COSE[k])
    corsa.mano = vera(dato.mano)
    corsa.mancina = vera(dato.mancina)
    corsa.corpo = vera(dato.corpo)
    corsa.dito = vera(dato.dito)
    corsa.torcia = !!dato.torcia
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
    /* ── e quello che allora si portava e adesso no ──
       Il caso vero non è un id sparito (quelli li ha già tolti `vera`):
       è una discesa cominciata **prima** che le classi avessero un
       limite, che rientra con un'ascia in pugno a un mago. Buttarla
       sarebbe rubare, lasciarla addosso sarebbe un gioco che si
       contraddice da solo — quindi va in tasca, o per terra se le
       tasche sono piene, e lo dice. La versione non sale apposta: la
       forma del salvataggio è identica, non c'è nessun campo che non
       torni, e c'è un ripiego ovvio. */
    corsa.sistemaIlCorredo()
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
  if (!dato || !LEGGIBILI.includes(dato.v)) return null
  /* L'abisso non sta nella campagna, quindi `campagna[-1]` è
     `undefined`: senza questa riga la carta «riprendi» **sparirebbe in
     silenzio** invece di dire «l'abisso · piano 23», e venti minuti di
     discesa sembrerebbero buttati. Una riga, e se ci si dimentica non lo
     dice nessuno. */
  const t = dato.tappa === INDICE_ABISSO ? L_ABISSO : campagna[dato.tappa]
  if (!t) return null
  return {
    tappa: dato.tappa,
    nome: t.nome,
    icona: t.icona,
    piano: (dato.piano || 0) + 1,
    /* quanti piani ha in tutto: l'abisso non lo sa, e chi disegna scrive
       «piano 23» invece di «piano 23 di …» */
    piani: t.abisso ? null : t.piani,
    eroe: typeof dato.eroe === 'string' ? dato.eroe : null,
    vita: dato.vita,
    gemme: dato.gemme,
  }
}
