/* ═══════════════════════════════════════════════════════════════════
   ARCHIVIO A TRE LIVELLI — non lancia mai eccezioni.

   1. IndexedDB   → capiente, asincrono, sopravvive alla pulizia "cookie"
                    su molti browser. È l'archivio buono.
   2. localStorage→ ripiego se IndexedDB manca o è bloccato.
   3. memoria     → ultimo ripiego. Dentro un'anteprima in iframe sandbox
                    il solo TOCCARE localStorage solleva SecurityError: con
                    l'accesso diretto l'eccezione interrompeva il caricamento
                    del profilo e il gioco partiva senza dati.

   Ogni scrittura è ritardata di qualche centinaio di ms e accorpata, così
   rispondere a una domanda non costa un accesso al disco.
   ═══════════════════════════════════════════════════════════════════ */

const DB_NAME = 'giochi-bambini', STORE = 'kv', VERSION = 1;
const mem = new Map();

export const backend = { kind: 'memoria', ready: false };

/* ---------- IndexedDB ---------- */
let dbPromise = null;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise(resolve => {
    let settled = false;
    const done = v => { if (!settled) { settled = true; resolve(v) } };
    try {
      if (typeof indexedDB === 'undefined') return done(null);
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        try { req.result.createObjectStore(STORE) } catch (e) { /* già presente */ }
      };
      req.onsuccess = () => done(req.result);
      req.onerror = () => done(null);
      req.onblocked = () => done(null);
      // Safari in privata può non rispondere mai: non restiamo appesi
      setTimeout(() => done(null), 2500);
    } catch (e) { done(null) }
  });
  return dbPromise;
}

function idbRun(mode, fn) {
  return openDb().then(db => {
    if (!db) return null;
    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.onerror = () => resolve(null);
        tx.onabort = () => resolve(null);
        req.onsuccess = () => resolve(req.result ?? true);
        req.onerror = () => resolve(null);
      } catch (e) { resolve(null) }
    });
  }).catch(() => null);
}

/* ---------- localStorage ---------- */
function lsGet(k) { try { return localStorage.getItem(k) } catch (e) { return undefined } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true } catch (e) { return false } }

/* ---------- API ---------- */
export async function detectBackend() {
  const db = await openDb();
  if (db) { backend.kind = 'IndexedDB'; backend.ready = true; return backend.kind }
  if (lsSet('__probe__', '1')) { backend.kind = 'localStorage'; backend.ready = true; return backend.kind }
  backend.kind = 'memoria'; backend.ready = true;
  return backend.kind;
}

export async function load(key) {
  const fromIdb = await idbRun('readonly', s => s.get(key));
  if (fromIdb != null && fromIdb !== true) return fromIdb;
  const raw = lsGet(key);
  if (raw != null) { try { return JSON.parse(raw) } catch (e) { /* ignora */ } }
  return mem.has(key) ? mem.get(key) : null;
}

const pending = new Map();
let timer = null;

export function save(key, value) {
  mem.set(key, value);
  pending.set(key, value);
  if (timer) return;
  timer = setTimeout(flush, 350);
}

export async function flush() {
  clearTimeout(timer); timer = null;
  const batch = [...pending]; pending.clear();
  for (const [k, v] of batch) {
    const ok = await idbRun('readwrite', s => s.put(v, k));
    if (ok == null) lsSet(k, JSON.stringify(v));      // ripiego
  }
}

// chiudere la scheda non deve perdere l'ultima risposta
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush() });
  window.addEventListener('pagehide', () => flush());
}

export async function remove(key) {
  mem.delete(key); pending.delete(key);
  await idbRun('readwrite', s => s.delete(key));
  try { localStorage.removeItem(key) } catch (e) { /* ignora */ }
}

/* Quali chiavi ci sono, fra tutte quelle che cominciano per `prefisso`.
   Serve a ricostruire l'elenco dei giocatori da `profilo:*` invece di
   cercare un nome scritto nel codice — che è la ragione per cui questo
   repo può diventare pubblico senza portarsi dietro i nomi dei bambini.

   Guarda tutti e tre i livelli e li unisce, perché non è detto che
   raccontino la stessa storia: se IndexedDB è stato lento all'avvio si
   è scritto su localStorage, e un profilo che sta solo lì è comunque un
   profilo che esiste. Meglio un giocatore di troppo nell'elenco che uno
   in meno: quello di troppo si vede e si cancella, quello mancante
   sembra sparito. */
export async function chiavi(prefisso = '') {
  const viste = new Set();
  const daIdb = await idbRun('readonly', s => s.getAllKeys());
  if (Array.isArray(daIdb)) for (const k of daIdb) viste.add(k);
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k != null) viste.add(k);
    }
  } catch (e) { /* niente localStorage: pazienza */ }
  for (const k of mem.keys()) viste.add(k);
  return [...viste].filter(k => typeof k === 'string' && k.startsWith(prefisso)).sort();
}
