/* ═══════════════════════════════════════════════════════════════════
   L'EROE — vita, attacco, difesa, e le due formule dello scontro

   Prima di questo file un mostro era un contatore: due risposte giuste
   e cadeva, sempre, in tutte e nove le tappe. Adesso ha vita, attacco e
   difesa, e quanto costa abbatterlo dipende da **come sei messo tu**.

   IL GIRO DI GIOCO CHE QUESTO FILE ESISTE PER TENERE IN PIEDI:
   il mostro grosso lascia l'equipaggiamento buono → con
   l'equipaggiamento buono i mostri cadono in meno scambi → in fondo
   c'è il drago, che senza l'equipaggiamento buono non cade affatto.
   Chi sceglie sempre la strada facile arriva al drago nudo, e lo
   scopre lì. È **il motivo per cui si va a cercare il mostro difficile
   invece di girargli intorno**, ed è tutto il gioco.

   ── PERCHÉ «PIÙ ATTACCO = MENO DOMANDE» QUI VA BENE ──
   Nel castello il numero di esercizi è l'input: una tappa dichiara che
   costa 12 operazioni e tutto il resto si deriva da lì. Qui no, e la
   differenza è voluta. Il dungeon è **intrattenimento con gli esercizi
   dentro**: si scende perché si vuole vedere l'eroe diventare forte, e
   una spada trovata combattendo deve avere il tempo di essere usata —
   se la discesa finisce due stanze dopo, quella spada non è un premio,
   è una notifica. Quindi le discese sono lunghe (tre piani, vedi
   `campagna.js`) e potenziarsi fa risparmiare scambi: nel caso
   peggiore si finisce la campagna prima e si ricomincia più in
   difficile, che è un premio anche quello.

   ── LE DUE FORMULE, E PERCHÉ SONO SOLO DUE ──
   Le legge un bambino di sei anni sopra la barra della vita, quindi
   sono sottrazioni e basta: niente percentuali, niente moltiplicatori,
   niente numeri a virgola.

     rispondi bene  → gli togli   max(1, tuo attacco − sua difesa)
                      e lui ti graffia: GRAFFIO, sempre 1
     rispondi male  → non gli togli niente
                      e lui ti picchia: max(1, suo attacco − tua difesa)

   Ne esce una divisione dei ruoli che si spiega in una riga sola:
   **l'attacco è velocità** (meno scambi per abbattere un mostro), **la
   difesa è l'assicurazione sugli sbagli**. Chi sa rispondere non muore
   quasi mai; chi sbaglia e non ha addosso niente muore in fretta.

   Il graffio è **1 fisso e non lo ferma la difesa**, ed è la sola
   regola del combattimento che non si può schivare: è quella che rende
   una discesa lunga una gestione di risorse invece di una passeggiata,
   ed è il motivo per cui «curati» è una scelta vera davanti a «prendi
   l'oggetto». Se la difesa lo fermasse, un'armatura alta renderebbe i
   piani lunghi gratis e il fuoco da campo tornerebbe a essere il posto
   dove si prende un oggetto e basta.
   ═══════════════════════════════════════════════════════════════════ */

/* Come si comincia la prima volta: tre e tre, che è il numero più
   piccolo con cui la sottrazione dice ancora qualcosa. Con attacco 2 e
   un mostro con difesa 1 si farebbe 1, e il primo potenziamento
   raddoppierebbe il danno: una scala che parte da 1 non si sente
   crescere, sobbalza.

   La vita è alta perché **è il budget di un piano intero**, non di uno
   scontro: un piano sono una decina di stanze, e fra graffi e sbagli se
   ne va quasi tutta prima del fuoco che precede il capo. Tararla
   guardando un mostro solo — «con quaranta punti ne ammazzo otto!» —
   è il modo sbagliato di leggerla: il numero giusto lo dice il banco di
   prova, che gioca la discesa intera. */
export const BASE = { vita: 46, attacco: 3, difesa: 3 }

/* Quanto cresce l'eroe per ogni tappa della campagna già portata a
   casa. È **permanente e si ricava dai dati che il profilo ha già**
   (`campagne.dungeon.tappa`): nessun campo nuovo, nessuna migrazione,
   e un bambino che riapre il gioco dopo un mese si ritrova l'eroe come
   l'aveva lasciato senza che nessuno abbia salvato niente.

   L'attacco cresce più in fretta della difesa apposta: l'attacco deve
   inseguire la vita dei mostri (che cresce forte, vedi `mostri.js`),
   la difesa no — se la difesa tenesse il passo dell'attacco dei
   mostri, sbagliare smetterebbe di costare e la discesa diventerebbe
   una formalità lunga. */
export const CRESCITA = { vita: 6, attacco: 0.7, difesa: 0.5 }

/* Il graffio: quanto ti costa uno scambio anche quando lo vinci. */
export const GRAFFIO = 1

/* ── quanto vale l'eroe adesso ──
   `tappeFatte` sono le tappe della campagna già finite. La crescita è
   una moltiplicazione arrotondata e non una tabella scritta a mano:
   una tabella con nove righe si scorda allineata alla campagna il
   giorno che le tappe diventano dodici. */
export function statisticheBase(tappeFatte = 0) {
  const n = Math.max(0, tappeFatte)
  return {
    vita: BASE.vita + Math.round(CRESCITA.vita * n),
    attacco: BASE.attacco + Math.round(CRESCITA.attacco * n),
    difesa: BASE.difesa + Math.round(CRESCITA.difesa * n),
  }
}

/* ── le due formule ──
   Il minimo di 1 non è una gentilezza: senza, un mostro con difesa
   più alta del tuo attacco sarebbe **immortale**, e un bambino
   resterebbe lì a rispondere giusto guardando una barra che non si
   muove. Un colpo che non fa niente è un guasto, non una difficoltà. */
export const colpoDellEroe = (attacco, difesaMostro) =>
  Math.max(1, Math.round(attacco) - Math.round(difesaMostro))

export const colpoDelMostro = (attaccoMostro, difesaEroe) =>
  Math.max(1, Math.round(attaccoMostro) - Math.round(difesaEroe))

/* Quanti scambi ci vogliono per abbattere questo mostro, come stai
   messo adesso. Serve a tre posti diversi e per tre ragioni diverse —
   il bollino sulla mappa (quanto costa questa strada), il banco di
   prova (quante domande costa davvero una tappa), la riga sotto la
   barra («ancora due colpi») — e sta qui perché sia **lo stesso conto**
   in tutti e tre: se la mappa promettesse tre colpi e lo scontro ne
   chiedesse cinque, il bivio sarebbe una bugia. */
export const scambiPerAbbattere = (vita, attacco, difesaMostro) =>
  Math.max(1, Math.ceil(vita / colpoDellEroe(attacco, difesaMostro)))

/* Quanti sbagli sopravvivi a questo mostro. L'altra faccia del bollino:
   dice se una strada è pericolosa, non solo se è lunga. */
export const sbagliCheReggi = (vita, attaccoMostro, difesaEroe) =>
  Math.floor(vita / colpoDelMostro(attaccoMostro, difesaEroe))

export function guastiDellEroe(base = BASE, crescita = CRESCITA, graffio = GRAFFIO) {
  const guasti = []
  for (const campo of ['vita', 'attacco', 'difesa']) {
    if (!(base[campo] > 0)) guasti.push(`l'eroe comincia con ${campo} ${base[campo]}`)
    if (!(crescita[campo] >= 0)) guasti.push(`${campo} cala andando avanti nella campagna`)
  }
  /* con attacco e difesa sotto 2 la sottrazione non ha spazio per
     dire niente: ogni potenziamento sarebbe un raddoppio */
  if (!(base.attacco >= 2 && base.difesa >= 2))
    guasti.push('attacco e difesa di partenza troppo bassi: la sottrazione non ha scala')
  if (!(crescita.attacco > crescita.difesa))
    guasti.push('la difesa cresce quanto l\'attacco: sbagliare smetterebbe di costare')
  /* il graffio deve esserci — è quello che rende «curati» una scelta —
     ma non può competere con un colpo pieno, o rispondere bene e
     rispondere male costerebbero uguale */
  if (!(graffio >= 1)) guasti.push('senza graffio una discesa lunga non costa niente')
  if (!(graffio < base.attacco)) guasti.push('il graffio è forte quanto un colpo: sbagliare non costa più')
  /* la vita deve reggere una manciata di sbagli fin dalla prima tappa:
     morire al terzo errore in una discesa da tre piani è una punizione,
     non una difficoltà */
  if (!(base.vita >= 6 * graffio)) guasti.push('si comincia con troppa poca vita per un piano intero')
  return guasti
}
