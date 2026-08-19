/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA — nove tappe in tre scalini

   L'ingresso non è «scegli la difficoltà»: è un percorso. Una tappa è
   **lo stesso motore con altri numeri e un altro vestito** — non c'è una
   riga di codice che sappia distinguere la prima dall'ultima.

   Cosa si vince: **arrivare in fondo con la truppa in piedi**. `metri` è
   tutto quello che serve sapere per capire quanto dura, e cresce piano.

   ── PERCHÉ SI CORRE PIANO ────────────────────────────────────────
   `passo` sono i metri al secondo, e sono **la metà** di quelli del
   prototipo. Non è prudenza: leggere tre cancelli, capire quale conviene
   e spostarsi è una cosa che a sei anni richiede secondi, non decimi. Un
   cancello ogni venti metri a tre metri al secondo fa **sei secondi e
   mezzo** per scegliere — nel prototipo erano meno di due, e in due
   secondi non si calcola: si tira a indovinare.

   `spinta` è quanto si accelera stando in strada, e `punta` è il tetto:
   la corsa cresce, ma non fino a mangiarsi il tempo di pensare.

   ── UN GRADO ALLA VOLTA ──────────────────────────────────────────
   `tetto` è quanto può diventare grande la truppa, e non è una manopola
   di difficoltà: è **quanti gradi si stanno imparando**. Con quattro
   verdi e quattro rossi si arriva a 24; col blu a 124; col giallo a 624.
   Le prime due tappe vivono fra 1 e 24 — numeri che si contano in terra
   con gli occhi — e il grado nuovo arriva quando il precedente è di casa.

   Serve anche a tenere in piedi il gioco: i cancelli moltiplicano, e una
   truppa senza tetto arriva a diecimila in un minuto. A quel punto «×3»
   non è più una domanda di matematica, è una scritta. I soldati di
   troppo non spariscono — corrono al traguardo e diventano monete.

   ── LE LEVE ──────────────────────────────────────────────────────
     metri        quanto è lunga
     passo/punta  quanto si corre, all'inizio e al massimo
     fraCancelli  ogni quanti metri arriva una scelta
     fraScontri   ogni quanti cancelli arriva un mostro
     tetto        quanto può diventare grande la truppa
     truppa       con quanti si parte
     libri        quanto spesso il cancello d'oro entra nella terna
     studio       quanto è tosta la domanda che paga il cancello d'oro
     mira         quanti cancelli migliori servono per la terza stella
     coni         quanti ostacoli fra un cancello e l'altro
     premio       le monete per stella

   ── LE STELLE ────────────────────────────────────────────────────
     ⭐    arrivare in fondo
     ⭐⭐   senza perdere nemmeno uno scontro
     ⭐⭐⭐  e aver scelto il cancello migliore almeno `mira` volte su una

   Le prime due premiano il risultato, la terza premia **il conto**: un
   mostro si abbatte solo se la truppa è grossa, e la truppa è grossa solo
   se i cancelli sono stati letti invece che indovinati. La terza si può
   prendere anche perdendo, perché misura una cosa sola — quante volte hai
   avuto ragione — e quella non dipende dalla fortuna della corsa.

   Finite le nove tappe si apre la **corsa infinita**: non c'è traguardo,
   e il punteggio è quanto lontano si arriva.
   ═══════════════════════════════════════════════════════════════════ */

import { CAMBIO, ORDINI } from './ordini.js'

/* I tetti che i gradi sanno scrivere: 4 (solo verdi), 24 (verdi e
   rossi), 124 (col blu), 624 (col giallo). Una tappa ne sceglie uno, e
   non un numero qualunque — «truppa piena» deve voler dire davvero
   quattro figure per ogni grado in terra. */
export const TETTI = ORDINI.map((_, i) => CAMBIO ** (i + 1) - 1)

export const SCALINI = [
  { chiave: 'sentieri', nome: 'I sentieri', icona: '🌿',
    dritta: 'I cancelli sono facili: si impara a leggerli.' },
  { chiave: 'vialunga', nome: 'La via lunga', icona: '🌉',
    dritta: 'Scelte doppie, e arriva il primo boss.' },
  { chiave: 'cima', nome: 'Verso la cima', icona: '⛰️',
    dritta: 'Tutto insieme: la truppa va tenuta grossa.' },
]

/* `portata` è dove sta la tappa sulla scala 0-100 di `data/portata.js`,
   e dice a chi va offerta. Qui NON c'è `scuola`, ed è una dichiarazione,
   non una dimenticanza: quello che questa campagna insegna non lo dà
   nessuna scuola, quindi la sua testa non si taglia mai per età — le
   prime tappe restano a disposizione anche di chi arriva grande, che
   altrimenti non imparerebbe mai come si gioca. Si taglia solo in alto. */
export const CAMPAGNA = [
  /* ── scalino 1: verdi e rossi, e si impara a scegliere ── */
  { chiave: 'sentiero', nome: 'Il sentiero', veste: 'prato', scalino: 'sentieri',
    portata: 30,
    metri: 170, passo: 3.0, punta: 3.8, spinta: 0.012, fraCancelli: 21, fraScontri: 3,
    tetto: 24, truppa: 5, libri: 0.30, studio: 0.10, mira: 0.55, coni: 1, premio: 3,
    racconto: 'Solo verdi e rossi: guarda i numeri, non i colori.' },
  { chiave: 'campi', nome: 'I campi gialli', veste: 'grano', scalino: 'sentieri',
    portata: 34,
    metri: 210, passo: 3.1, punta: 3.9, spinta: 0.012, fraCancelli: 20, fraScontri: 3,
    tetto: 24, truppa: 5, libri: 0.32, studio: 0.18, mira: 0.60, coni: 1, premio: 3,
    racconto: 'Cinque verdi fanno un rosso. Guardali cambiare.' },
  { chiave: 'bosco', nome: 'Il bosco', veste: 'bosco', scalino: 'sentieri',
    portata: 38,
    metri: 250, passo: 3.2, punta: 4.0, spinta: 0.013, fraCancelli: 20, fraScontri: 3,
    tetto: 124, truppa: 8, libri: 0.34, studio: 0.28, mira: 0.62, coni: 2, premio: 4,
    racconto: "Arriva il blu, e il cancello d'oro col libro." },

  /* ── scalino 2: la scelta si complica ── */
  { chiave: 'ponte', nome: 'Il ponte lungo', veste: 'fiume', scalino: 'vialunga',
    portata: 48,
    metri: 290, passo: 3.3, punta: 4.1, spinta: 0.014, fraCancelli: 19, fraScontri: 3,
    tetto: 124, truppa: 8, libri: 0.34, studio: 0.38, mira: 0.66, coni: 2, premio: 5,
    racconto: 'Un cancello fa due cose: «÷5 +80» si legge in ordine.' },
  { chiave: 'dune', nome: 'Le dune', veste: 'deserto', scalino: 'vialunga',
    portata: 52,
    metri: 330, passo: 3.4, punta: 4.2, spinta: 0.014, fraCancelli: 19, fraScontri: 3,
    tetto: 124, truppa: 10, libri: 0.36, studio: 0.48, mira: 0.70, coni: 2, premio: 5,
    racconto: 'Il primo boss: davanti a lui si rallenta.' },
  { chiave: 'notte', nome: 'La notte', veste: 'notte', scalino: 'vialunga',
    portata: 56,
    metri: 370, passo: 3.5, punta: 4.3, spinta: 0.015, fraCancelli: 18, fraScontri: 3,
    tetto: 624, truppa: 10, libri: 0.36, studio: 0.58, mira: 0.72, coni: 3, premio: 6,
    racconto: 'Arriva il giallo: la truppa piena sta a 624.' },

  /* ── scalino 3: tenere la truppa grossa ── */
  { chiave: 'valico', nome: 'Il valico', veste: 'neve', scalino: 'cima',
    portata: 66,
    metri: 410, passo: 3.6, punta: 4.35, spinta: 0.015, fraCancelli: 18, fraScontri: 3,
    tetto: 624, truppa: 12, libri: 0.38, studio: 0.68, mira: 0.75, coni: 3, premio: 7,
    racconto: 'Un mostro ogni tre cancelli. Non sbagliarne.' },
  { chiave: 'bruciata', nome: 'La terra che brucia', veste: 'lava', scalino: 'cima',
    portata: 70,
    metri: 450, passo: 3.7, punta: 4.4, spinta: 0.016, fraCancelli: 18, fraScontri: 3,
    tetto: 624, truppa: 12, libri: 0.38, studio: 0.78, mira: 0.78, coni: 3, premio: 8,
    racconto: 'Qui non basta sceglierne bene uno.' },
  { chiave: 'cima', nome: 'La cima', veste: 'cima', scalino: 'cima',
    portata: 74,
    metri: 490, passo: 3.8, punta: 4.4, spinta: 0.016, fraCancelli: 18, fraScontri: 3,
    tetto: 624, truppa: 14, libri: 0.40, studio: 0.88, mira: 0.80, coni: 3, premio: 10,
    racconto: 'Quasi cinquecento metri e due boss.' },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappa = indice =>
  CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]

/* La corsa infinita: non finisce, e il punteggio è quanto lontano si
   arriva. Non è una tappa e non sta nella campagna — è quello che resta
   dopo, quando i cancelli si leggono senza pensarci. */
export const LIBERA = {
  chiave: 'infinita', nome: 'La corsa infinita', veste: 'notte', scalino: null,
  metri: Infinity, passo: 3.4, punta: 4.4, spinta: 0.015, fraCancelli: 18, fraScontri: 3,
  tetto: 624, truppa: 12, libri: 0.36, studio: 0.55, mira: 1.1, coni: 3, premio: 4,
  racconto: 'Non finisce: si corre finché la truppa regge.',
}

export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)

/* Quanto dura una tappa, all'incirca: è la prima cosa che un bambino
   vuole sapere prima di dire di sì, e va detta sulla mappa. Si corre
   accelerando, quindi la media sta fra il passo di partenza e la punta —
   più vicina alla punta, perché la punta si raggiunge presto. */
export const secondiCirca = t =>
  Number.isFinite(t.metri) ? Math.round(t.metri / (t.passo * 0.35 + t.punta * 0.65)) : Infinity

export function guastiDellaCampagna(campagna = CAMPAGNA, vesti = null) {
  const guasti = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} ("${t.chiave}")`
    if (viste.has(t.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.racconto) guasti.push(`${dove}: senza nome o senza racconto`)
    if (vesti && !vesti[t.veste]) guasti.push(`${dove}: la veste "${t.veste}" non esiste`)
    if (!SCALINI.some(s => s.chiave === t.scalino)) guasti.push(`${dove}: scalino "${t.scalino}" sconosciuto`)

    /* ── il tempo di pensare, che è il motivo per cui si corre piano ──
       Un cancello ogni `fraCancelli` metri, corso alla punta: sotto i
       quattro secondi non si legge una terna, si tira a indovinare. È il
       difetto che il prototipo aveva per natura, e questo controllo
       esiste perché non torni ritoccando un numero a occhio. */
    const respiro = t.fraCancelli / t.punta
    if (!(respiro >= 4))
      guasti.push(`${dove}: ${respiro.toFixed(1)}s fra un cancello e l'altro alla punta — non si fa in tempo a leggerli`)
    if (!(t.punta > t.passo)) guasti.push(`${dove}: la punta (${t.punta}) non è sopra il passo (${t.passo})`)
    if (!(t.passo >= 2.4 && t.punta <= 5.2))
      guasti.push(`${dove}: si corre da ${t.passo} a ${t.punta} m/s, fuori dalla fascia leggibile`)
    if (!(t.spinta >= 0 && t.spinta <= 0.05)) guasti.push(`${dove}: spinta ${t.spinta}`)

    if (Number.isFinite(t.metri)) {
      const secondi = secondiCirca(t)
      /* il tetto è quanto un bambino regge senza posare il telefono */
      if (!(secondi >= 30 && secondi <= 180))
        guasti.push(`${dove}: ${secondi} secondi non sono una partita per un bambino`)
      const cancelli = t.metri / t.fraCancelli
      if (!(cancelli >= 6))
        guasti.push(`${dove}: solo ${cancelli.toFixed(1)} cancelli — non c'è niente da scegliere`)
    }
    if (!(t.fraScontri >= 2)) guasti.push(`${dove}: un mostro ogni ${t.fraScontri} cancelli è troppo spesso`)
    if (!(t.truppa >= 3)) guasti.push(`${dove}: si parte in ${t.truppa}, e un cancello sbagliato cancella la partita`)
    /* Il tetto è «quanti gradi sto imparando», quindi è per forza il
       massimo che un certo numero di gradi sa scrivere: 4, 24, 124, 624.
       Un tetto a 200 vorrebbe dire una truppa piena che non è piena. */
    if (!TETTI.includes(t.tetto))
      guasti.push(`${dove}: tetto ${t.tetto} — i gradi scrivono ${TETTI.join(', ')}, non altro`)
    if (!(t.truppa < t.tetto / 2))
      guasti.push(`${dove}: si parte in ${t.truppa} con il tetto a ${t.tetto}: non c'è spazio per crescere`)
    if (!(t.libri > 0 && t.libri <= 0.5))
      guasti.push(`${dove}: il libro esce ${t.libri} volte su una — o non si vede mai, o diventa un pedaggio`)
    if (!(t.studio >= 0 && t.studio <= 1)) guasti.push(`${dove}: studio ${t.studio} non è una manopola da 0 a 1`)
    if (!(t.mira > 0.4 && t.mira <= 0.9))
      guasti.push(`${dove}: mira ${t.mira} — sotto il caso (0.33) è regalata, sopra 0.9 la vuole perfetta`)
    if (!(t.coni >= 0 && t.coni <= 4)) guasti.push(`${dove}: ${t.coni} coni fra un cancello e l'altro`)
    if (!(t.premio > 0)) guasti.push(`${dove}: premio ${t.premio}`)
  }

  /* ── la campagna deve salire, e cambiare vestito ── */
  for (let i = 1; i < campagna.length; i++) {
    const dove = `tappa ${i + 1}`
    if (campagna[i].metri < campagna[i - 1].metri) guasti.push(`${dove}: più corta della precedente`)
    if (campagna[i].studio < campagna[i - 1].studio) guasti.push(`${dove}: le domande sono più facili della tappa prima`)
    if (campagna[i].mira <= campagna[i - 1].mira) guasti.push(`${dove}: la terza stella costa meno della tappa prima`)
    if (campagna[i].tetto < campagna[i - 1].tetto) guasti.push(`${dove}: la truppa può diventare meno grande di prima`)
    if (campagna[i].veste === campagna[i - 1].veste)
      guasti.push(`${dove}: stesso vestito della precedente ("${campagna[i].veste}")`)
    if (campagna[i].fraCancelli > campagna[i - 1].fraCancelli)
      guasti.push(`${dove}: i cancelli sono più radi della tappa prima`)
  }
  /* i gradi si presentano uno alla volta: due gradi nuovi in una tappa
     sola sono due cose nuove da capire mentre si corre */
  for (let i = 1; i < campagna.length; i++)
    if (TETTI.indexOf(campagna[i].tetto) - TETTI.indexOf(campagna[i - 1].tetto) > 1)
      guasti.push(`tappa ${i + 1}: la truppa guadagna due gradi in un colpo solo`)

  /* gli scalini arrivano in fila e nessuno resta vuoto */
  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1])) guasti.push('gli scalini non sono in fila')
  for (const s of SCALINI)
    if (!campagna.some(t => t.scalino === s.chiave))
      guasti.push(`lo scalino "${s.chiave}" non ha nemmeno una tappa`)
  /* la prima tappa deve essere davvero la prima: corta, lenta, larga */
  if (campagna[0].metri !== Math.min(...campagna.map(t => t.metri)))
    guasti.push('la prima tappa non è la più corta')
  return guasti
}
