// Motore di apprendimento condiviso da tutti i giochi: vedi docs/apprendimento/srs.md.
const DAY = 86400000;

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

const intervallo = (it, lentezza = 1) => IVL[Math.min(it.s, MAX_S)] * DAY * lentezza;

export const dueAt = (it, lentezza = 1) => (it.last || 0) + intervallo(it, lentezza);

// in multipli del proprio intervallo: 0 = appena scaduto, 1 = scaduto da un intervallo intero
export function overdue(it, now, lentezza = 1) {
  if (!it.last) return 1;                       // mai visto: da fare
  const span = intervallo(it, lentezza);
  return (now - dueAt(it, lentezza)) / span;
}

// forza EFFICACE: quella nominale meno il decadimento accumulato
export function strength(it, now, lentezza = 1) {
  if (!it.last) return 0;
  const late = Math.max(0, overdue(it, now, lentezza));
  return Math.max(0, it.s - Math.floor(late / 1.5));
}

export const isMastered = (it, now, lentezza = 1) =>
  strength(it, now, lentezza) >= SRS.masterS;

// peso di estrazione: alto = esce spesso; cala con la forza, cresce col ritardo
export function weight(it, now, opts = {}) {
  const lentezza = opts.lentezza || 1;
  const s = strength(it, now, lentezza);
  const base = Math.max(0.35, (MAX_S + 1) - s * 1.4);
  const late = Math.max(0, overdue(it, now, lentezza));
  const urgency = 1 + Math.min(2, late * 0.6);          // scaduto da tanto = urgente
  let w = base * urgency;
  // dove la velocità conta (tabelline) una risposta lenta pesa come mezza sbagliata
  if (opts.useTime && it.t > SRS.slowMs) w *= 1.5;
  return w;
}

export function record(it, { correct, ms = 0, now = Date.now() }) {
  it.seen++;
  it.last = now;
  if (correct) {
    it.ok++;
    it.s = Math.min(MAX_S, strength(it, now) + SRS.gainOk);
  } else {
    it.err++;
    it.s = Math.max(0, strength(it, now) - SRS.lossErr);
    it.errAt = now;   // store/marea.js non tocca lo sbagliato di recente: gli serve la data, non solo `err`
  }
  if (ms > 0) it.t = it.t ? it.t * 0.55 + ms * 0.45 : ms;
  return it;
}

// La selezione: memoria corta della sessione più una coda di ripasso
export function createPicker({ getItem, useTime = false, pausaDopo = 0,
                               lentezza = () => 1 } = {}) {
  let recent = [];       // ultimi id mostrati, per la distanza minima
  let queue = [];        // ripassi programmati: { id, due }
  let round = 0;
  let serie = new Map(); // id -> risposte giuste di fila in questa sessione
  let riposo = new Set();// id già dimostrati sicuri qui: fuori fino a fine sessione

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

    // 2. altrimenti estrazione pesata, escludendo i troppo recenti e chi è a riposo
    if (!id) {
      let cand = pool.filter(x => !tooSoon(x) && !riposo.has(x));
      if (!cand.length) cand = pool.filter(x => !tooSoon(x));
      if (!cand.length) cand = pool.filter(x => x !== recent[recent.length - 1]);
      if (!cand.length) cand = pool.slice();
      const w = cand.map(x => weight(getItem(x), now, { useTime, lentezza: lentezza(x) }));
      let r = Math.random() * w.reduce((a, b) => a + b, 0);
      id = cand[cand.length - 1];
      for (let i = 0; i < cand.length; i++) { r -= w[i]; if (r <= 0) { id = cand[i]; break } }
    }

    recent.push(id);
    if (recent.length > SRS.minGap) recent.shift();
    return id;
  }

  function afterAnswer(id, correct) {
    if (!correct) {
      serie.set(id, 0);
      riposo.delete(id);                     // sbagliato: torna in circolo
      SRS.reviewGap.forEach(g => schedule(id, g));
      return;
    }
    if (!pausaDopo) return;
    const n = (serie.get(id) || 0) + 1;
    serie.set(id, n);
    if (n >= pausaDopo) riposo.add(id);
  }

  function reset() { recent = []; queue = []; round = 0; serie.clear(); riposo.clear() }

  // una domanda scelta FUORI dal picker (il boss degli asteroidi) entra comunque in memoria corta
  function annota(id) {
    recent.push(id)
    if (recent.length > SRS.minGap) recent.shift()
  }

  return { pick, afterAnswer, reset, annota,
           get round() { return round },
           get riposati() { return riposo.size },
           aRiposo: id => riposo.has(id) };
}

// L'insieme attivo: ~10 elementi in lavorazione (non tutti, altrimenti metà
// non uscirebbe mai). `gruppi(id)` fa girare la scelta a turno fra i gruppi
// scelti dal bambino, se no i più facili in assoluto monopolizzano tutto.
export function activeSet(allIds, getItem, order, now = Date.now(),
                          size = SRS.setSize, gruppi = null, lentezza = () => 1) {
  const learning = allIds.filter(id => !isMastered(getItem(id), now, lentezza(id)));
  const due = allIds.filter(id => isMastered(getItem(id), now, lentezza(id)) &&
                                  overdue(getItem(id), now, lentezza(id)) >= 0);
  const ordinati = learning.sort((a, b) => order(a) - order(b));
  if (!gruppi) return { learning: ordinati.slice(0, size), due };

  const code = new Map();                 // gruppo -> elementi, dal più facile
  for (const id of ordinati)
    for (const g of gruppi(id)) {
      if (!code.has(g)) code.set(g, []);
      code.get(g).push(id);
    }
  const scelti = [], presi = new Set();
  let entrato = true;
  while (scelti.length < size && entrato) {
    entrato = false;
    for (const coda of code.values()) {
      if (scelti.length >= size) break;
      while (coda.length && presi.has(coda[0])) coda.shift();
      if (!coda.length) continue;
      const id = coda.shift();
      presi.add(id); scelti.push(id); entrato = true;
    }
  }
  return { learning: scelti, due };
}
