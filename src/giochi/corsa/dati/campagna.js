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

   ── LE LEVE ──────────────────────────────────────────────────────
     metri        quanto è lunga
     passo/punta  quanto si corre, all'inizio e al massimo
     fraCancelli  ogni quanti metri arriva una scelta
     fraScontri   ogni quanti cancelli arriva un mostro
     truppa       con quanti si parte
     libri        quanto spesso il cancello d'oro entra nella terna
     studio       quanto è tosta la domanda che paga il cancello d'oro
     soglia       la truppa al traguardo che vale la terza stella
     coni         quanti ostacoli fra un cancello e l'altro
     premio       le monete per stella

   ── LE STELLE ────────────────────────────────────────────────────
     ⭐    arrivare in fondo
     ⭐⭐   senza perdere nemmeno uno scontro
     ⭐⭐⭐  e con la truppa oltre `soglia`

   La seconda stella premia esattamente quello che il gioco insegna: un
   mostro si abbatte prima dell'impatto solo se la truppa è grossa, e la
   truppa è grossa solo se i cancelli sono stati scelti bene.

   Finite le nove tappe si apre la **corsa infinita**: non c'è traguardo,
   e il punteggio è quanto lontano si arriva.
   ═══════════════════════════════════════════════════════════════════ */

export const SCALINI = [
  { chiave: 'sentieri', nome: 'I sentieri', icona: '🌿',
    dritta: 'Cancelli semplici, e si impara che il più grosso non vince sempre.' },
  { chiave: 'vialunga', nome: 'La via lunga', icona: '🌉',
    dritta: 'Arrivano le scelte doppie («÷5 +80») e il primo boss.' },
  { chiave: 'cima', nome: 'Verso la cima', icona: '⛰️',
    dritta: 'Tutto insieme: qui la truppa va tenuta grossa, non salvata.' },
]

export const CAMPAGNA = [
  /* ── scalino 1: si impara a scegliere ── */
  { chiave: 'sentiero', nome: 'Il sentiero', veste: 'prato', scalino: 'sentieri',
    metri: 180, passo: 3.0, punta: 3.8, spinta: 0.012, fraCancelli: 21, fraScontri: 3,
    truppa: 10, libri: 0.30, studio: 0.10, soglia: 55, coni: 1, premio: 3,
    racconto: 'Due cancelli e un mostro solo. Guarda i numeri, non le crocette.' },
  { chiave: 'campi', nome: 'I campi gialli', veste: 'grano', scalino: 'sentieri',
    metri: 220, passo: 3.1, punta: 3.9, spinta: 0.012, fraCancelli: 20, fraScontri: 3,
    truppa: 10, libri: 0.32, studio: 0.18, soglia: 90, coni: 1, premio: 3,
    racconto: 'Cinque verdi diventano un rosso: guarda la truppa mentre cresce.' },
  { chiave: 'bosco', nome: 'Il bosco', veste: 'bosco', scalino: 'sentieri',
    metri: 260, passo: 3.2, punta: 4.0, spinta: 0.013, fraCancelli: 20, fraScontri: 3,
    truppa: 12, libri: 0.34, studio: 0.28, soglia: 130, coni: 2, premio: 4,
    racconto: 'Il cancello d\'oro col libro: fermarsi costa tempo, non soldati.' },

  /* ── scalino 2: la scelta si complica ── */
  { chiave: 'ponte', nome: 'Il ponte lungo', veste: 'fiume', scalino: 'vialunga',
    metri: 300, passo: 3.3, punta: 4.2, spinta: 0.014, fraCancelli: 19, fraScontri: 3,
    truppa: 12, libri: 0.34, studio: 0.38, soglia: 180, coni: 2, premio: 5,
    racconto: 'Adesso i cancelli fanno due cose: «÷5 +80» va letto in ordine.' },
  { chiave: 'dune', nome: 'Le dune', veste: 'deserto', scalino: 'vialunga',
    metri: 340, passo: 3.4, punta: 4.3, spinta: 0.014, fraCancelli: 19, fraScontri: 3,
    truppa: 14, libri: 0.36, studio: 0.48, soglia: 240, coni: 2, premio: 5,
    racconto: 'Il primo boss ha il triplo di vita, e davanti a lui si rallenta.' },
  { chiave: 'notte', nome: 'La notte', veste: 'notte', scalino: 'vialunga',
    metri: 380, passo: 3.5, punta: 4.4, spinta: 0.015, fraCancelli: 18, fraScontri: 3,
    truppa: 14, libri: 0.36, studio: 0.58, soglia: 300, coni: 3, premio: 6,
    racconto: 'Al buio i cancelli si leggono lo stesso, i coni un po\' meno.' },

  /* ── scalino 3: tenere la truppa grossa ── */
  { chiave: 'valico', nome: 'Il valico', veste: 'neve', scalino: 'cima',
    metri: 420, passo: 3.6, punta: 4.6, spinta: 0.015, fraCancelli: 18, fraScontri: 3,
    truppa: 16, libri: 0.38, studio: 0.68, soglia: 360, coni: 3, premio: 7,
    racconto: 'Un mostro ogni tre cancelli: sbagliarne uno si sente subito.' },
  { chiave: 'bruciata', nome: 'La terra che brucia', veste: 'lava', scalino: 'cima',
    metri: 460, passo: 3.7, punta: 4.7, spinta: 0.016, fraCancelli: 18, fraScontri: 3,
    truppa: 16, libri: 0.38, studio: 0.78, soglia: 430, coni: 3, premio: 8,
    racconto: 'Qui non basta scegliere bene una volta: bisogna non sbagliarne.' },
  { chiave: 'cima', nome: 'La cima', veste: 'cima', scalino: 'cima',
    metri: 500, passo: 3.8, punta: 4.8, spinta: 0.016, fraCancelli: 17, fraScontri: 3,
    truppa: 18, libri: 0.40, studio: 0.88, soglia: 500, coni: 3, premio: 10,
    racconto: 'Cinquecento metri e due boss. La truppa piena sta a 624.' },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappa = indice =>
  CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]

/* La corsa infinita: non finisce, e il punteggio è quanto lontano si
   arriva. Non è una tappa e non sta nella campagna — è quello che resta
   dopo, quando i cancelli si leggono senza pensarci. */
export const LIBERA = {
  chiave: 'infinita', nome: 'La corsa infinita', veste: 'notte', scalino: null,
  metri: Infinity, passo: 3.4, punta: 5.0, spinta: 0.015, fraCancelli: 18, fraScontri: 3,
  truppa: 12, libri: 0.36, studio: 0.55, soglia: Infinity, coni: 3, premio: 4,
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
    if (!(t.truppa >= 5)) guasti.push(`${dove}: si parte in ${t.truppa}, e un cancello sbagliato cancella la partita`)
    if (!(t.libri > 0 && t.libri <= 0.5))
      guasti.push(`${dove}: il libro esce ${t.libri} volte su una — o non si vede mai, o diventa un pedaggio`)
    if (!(t.studio >= 0 && t.studio <= 1)) guasti.push(`${dove}: studio ${t.studio} non è una manopola da 0 a 1`)
    if (!(t.coni >= 0 && t.coni <= 4)) guasti.push(`${dove}: ${t.coni} coni fra un cancello e l'altro`)
    if (!(t.premio > 0)) guasti.push(`${dove}: premio ${t.premio}`)
    if (Number.isFinite(t.soglia) && !(t.soglia > t.truppa))
      guasti.push(`${dove}: la soglia (${t.soglia}) è sotto la truppa di partenza`)
  }

  /* ── la campagna deve salire, e cambiare vestito ── */
  for (let i = 1; i < campagna.length; i++) {
    const dove = `tappa ${i + 1}`
    if (campagna[i].metri < campagna[i - 1].metri) guasti.push(`${dove}: più corta della precedente`)
    if (campagna[i].studio < campagna[i - 1].studio) guasti.push(`${dove}: le domande sono più facili della tappa prima`)
    if (campagna[i].soglia <= campagna[i - 1].soglia) guasti.push(`${dove}: la terza stella costa meno della tappa prima`)
    if (campagna[i].veste === campagna[i - 1].veste)
      guasti.push(`${dove}: stesso vestito della precedente ("${campagna[i].veste}")`)
    if (campagna[i].fraCancelli > campagna[i - 1].fraCancelli)
      guasti.push(`${dove}: i cancelli sono più radi della tappa prima`)
  }

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
