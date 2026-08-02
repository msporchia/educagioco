/* ═══════════════════════════════════════════════════════════════════
   MOTORE DI APPRENDIMENTO — condiviso da tutti i giochi.

   Un "elemento" è indifferentemente una tabellina (`math:7x8`) o un
   vocabolo (`en:butterfly`): il motore non sa di cosa si tratta.

   Stato per elemento:
     s     forza 0..6      quanto è consolidato
     ok    risposte giuste totali
     err   errori totali
     last  quando è stato incontrato l'ultima volta (ms epoch)
     t     media mobile del tempo di risposta (usata solo dove la
           velocità conta davvero, cioè le tabelline)

   Due idee portanti:

   1. DECADIMENTO NEL TEMPO. L'intervallo di ripasso raddoppia a ogni
      livello di forza. Superata la scadenza la forza *efficace* cala da
      sola: una parola imparata dieci giorni fa non vale quanto una
      imparata ieri, e torna a farsi vedere senza che nessuno la segni
      come sbagliata. È la curva dell'oblio.

   2. DISTANZA MINIMA. Dentro la sessione nessun elemento può ricomparire
      prima di `minGap` altri elementi. Prima le ripetizioni arrivavano a
      raffica: la coda richiamava una parola dopo 3 turni e il campione
      pesato poteva ripescarla subito dopo.
   ═══════════════════════════════════════════════════════════════════ */

const DAY = 86400000;

/* intervalli di ripasso in giorni, uno per livello di forza */
export const IVL = [0.007, 0.03, 0.3, 1, 3, 8, 21];   // ~10 min → 3 settimane
export const MAX_S = IVL.length - 1;

export const SRS = {
  masterS:    4,     // da qui in su l'elemento è "imparato" ed esce dal giro
  gainOk:     1,     // quanto sale la forza a ogni risposta giusta
  lossErr:    2,     // e quanto scende a ogni errore
  minGap:     6,     // elementi diversi prima di poter rivedere lo stesso
  setSize:   10,     // elementi in lavorazione contemporaneamente
  reviewGap: [6, 20],// dopo un errore torna dopo 6 turni, poi dopo 20
  slowMs:  3500,     // oltre questo tempo la risposta è "lenta" (solo mate)
};

export const newItem = () => ({ s: 0, ok: 0, err: 0, last: 0, seen: 0, t: 0 });

/* quando l'elemento andrebbe ripassato */
export const dueAt = it => (it.last || 0) + IVL[Math.min(it.s, MAX_S)] * DAY;

/* quanto è in ritardo, in multipli del proprio intervallo.
   0 = appena scaduto, 1 = scaduto da un intervallo intero, ... */
export function overdue(it, now) {
  if (!it.last) return 1;                       // mai visto: da fare
  const span = IVL[Math.min(it.s, MAX_S)] * DAY;
  return (now - dueAt(it)) / span;
}

/* forza EFFICACE: quella nominale meno il decadimento accumulato */
export function strength(it, now) {
  if (!it.last) return 0;
  const late = Math.max(0, overdue(it, now));
  return Math.max(0, it.s - Math.floor(late / 1.5));
}

export const isMastered = (it, now) => strength(it, now) >= SRS.masterS;

/* Peso di estrazione. Alto = esce spesso.
   Cala con la forza efficace e cresce con il ritardo accumulato. */
export function weight(it, now, opts = {}) {
  const s = strength(it, now);
  const base = Math.max(0.35, (MAX_S + 1) - s * 1.4);
  const late = Math.max(0, overdue(it, now));
  const urgency = 1 + Math.min(2, late * 0.6);          // scaduto da tanto = urgente
  let w = base * urgency;
  // dove la velocità conta (tabelline) una risposta lenta pesa come mezza sbagliata
  if (opts.useTime && it.t > SRS.slowMs) w *= 1.5;
  return w;
}

/* Registra una risposta e aggiorna la forza. */
export function record(it, { correct, ms = 0, now = Date.now() }) {
  it.seen++;
  it.last = now;
  if (correct) {
    it.ok++;
    it.s = Math.min(MAX_S, strength(it, now) + SRS.gainOk);
  } else {
    it.err++;
    it.s = Math.max(0, strength(it, now) - SRS.lossErr);
  }
  if (ms > 0) it.t = it.t ? it.t * 0.55 + ms * 0.45 : ms;
  return it;
}

/* ═══════════ SELEZIONE ═══════════
   Tiene la memoria corta della sessione (ultimi elementi visti) e una
   coda di ripasso per quelli sbagliati. */
export function createPicker({ getItem, useTime = false } = {}) {
  let recent = [];       // ultimi id mostrati, per la distanza minima
  let queue = [];        // ripassi programmati: { id, due }
  let round = 0;

  function schedule(id, delay) {
    if (queue.some(q => q.id === id && q.due > round)) return;
    queue.push({ id, due: round + delay });
  }

  function tooSoon(id) { return recent.includes(id) }

  function pick(pool, now = Date.now()) {
    round++;
    // 1. un ripasso scaduto, se rispetta la distanza minima
    const qi = queue.findIndex(q => q.due <= round && !tooSoon(q.id) && pool.includes(q.id));
    let id = null;
    if (qi >= 0) id = queue.splice(qi, 1)[0].id;

    // 2. altrimenti estrazione pesata, escludendo i troppo recenti
    if (!id) {
      let cand = pool.filter(x => !tooSoon(x));
      if (!cand.length) cand = pool.filter(x => x !== recent[recent.length - 1]);
      if (!cand.length) cand = pool.slice();
      const w = cand.map(x => weight(getItem(x), now, { useTime }));
      let r = Math.random() * w.reduce((a, b) => a + b, 0);
      id = cand[cand.length - 1];
      for (let i = 0; i < cand.length; i++) { r -= w[i]; if (r <= 0) { id = cand[i]; break } }
    }

    recent.push(id);
    if (recent.length > SRS.minGap) recent.shift();
    return id;
  }

  function afterAnswer(id, correct) {
    if (!correct) SRS.reviewGap.forEach(g => schedule(id, g));
  }

  function reset() { recent = []; queue = []; round = 0 }

  return { pick, afterAnswer, reset, get round() { return round } };
}

/* ═══════════ INSIEME ATTIVO ═══════════
   Non si allenano 190 elementi insieme: metà non uscirebbe mai in una
   sessione da 40 domande. Se ne tengono ~10 in lavorazione, e quando uno
   è imparato esce e ne entra uno nuovo. Gli elementi scaduti da ripassare
   rientrano comunque, anche se già "imparati". */
export function activeSet(allIds, getItem, order, now = Date.now(), size = SRS.setSize) {
  const learning = allIds.filter(id => !isMastered(getItem(id), now));
  const due = allIds.filter(id => isMastered(getItem(id), now) && overdue(getItem(id), now) >= 0);
  const chosen = learning
    .sort((a, b) => order(a) - order(b))
    .slice(0, size);
  return { learning: chosen, due };
}
