// Archivio a tre livelli (IndexedDB -> localStorage -> memoria), non lancia
// mai eccezioni: vedi docs/core/archivio.md.

const DB_NAME = 'giochi-bambini', STORE = 'kv', VERSION = 1;

// Il tempo che si aspetta un'apertura normale (non blocca a lungo: lo usa
// ogni lettura/scrittura durante il gioco, dove restare reattivi conta più
// che aspettare). All'avvio invece si aspetta di più (`TIMEOUT_AVVIO`,
// sotto): concludere troppo presto che IndexedDB non c'è manda un bambino
// vero a «come ti chiami?» (docs/core/archivio.md).
let TIMEOUT_APERTURA = 2500;
let TIMEOUT_AVVIO = 6000;

const mem = new Map();

export const backend = { kind: 'memoria', ready: false };

/* ---------- IndexedDB ----------
   Il timeout NON è definitivo: `indexedDB.open` può rispondere più tardi
   di quanto si sia aspettato (un telefono lento), e quando risponde `db`
   si popola comunque — sono le chiamate SUCCESSIVE a `openDb()` a trovarlo
   già pronto, non quella che nel frattempo ha smesso di aspettare. Ogni
   chiamata registra il proprio ascoltatore con il proprio timeout, così
   una lettura di avvio può permettersi di aspettare più a lungo di una
   fatta a metà partita senza cambiare il comportamento di quest'ultima. */
let db = null;
let statoApertura = null;   // null = non tentata; 'niente' = indexedDB non c'è; 'fallita' = errore/blocco
let ascoltatori = [];

function avviaApertura() {
  if (statoApertura || db) return;
  statoApertura = 'in-corso';
  try {
    if (typeof indexedDB === 'undefined') { statoApertura = 'niente'; return }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      try { req.result.createObjectStore(STORE) } catch (e) { /* già presente */ }
    };
    req.onsuccess = () => {
      db = req.result;
      ascoltatori.splice(0).forEach(f => f(db));
    };
    const arrenditi = () => {
      statoApertura = 'fallita';
      ascoltatori.splice(0).forEach(f => f(null));
    };
    req.onerror = arrenditi;
    req.onblocked = arrenditi;
  } catch (e) { statoApertura = 'fallita' }
}

function openDb(timeout = TIMEOUT_APERTURA) {
  if (db) return Promise.resolve(db);
  avviaApertura();
  if (statoApertura === 'niente' || statoApertura === 'fallita') return Promise.resolve(db);
  return new Promise(resolve => {
    let fatto = false;
    const concludi = v => { if (!fatto) { fatto = true; resolve(v) } };
    ascoltatori.push(concludi);
    // Safari in privata può non rispondere mai: non restiamo appesi. Ma
    // `db` resta vivo per dopo: vedi la nota sopra.
    setTimeout(() => concludi(db), timeout);
  });
}

function idbRun(mode, fn, timeout) {
  return openDb(timeout).then(base => {
    if (!base) return null;
    return new Promise(resolve => {
      try {
        const tx = base.transaction(STORE, mode);
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

/* ---------- la busta: un segno di tempo su ogni scrittura ----------
   Serve a decidere chi vince quando la stessa chiave vive in due posti
   (IndexedDB e il ripiego di localStorage possono raccontare storie
   diverse: IndexedDB lento all'avvio -> scritto su localStorage). Un dato
   di prima di questa busta non ce l'ha: si tratta come «non si sa
   quando», e perde contro qualunque busta vera. `__v`/`__t` e non `v`/`t`
   per non confondersi con un campo vero del profilo (che ha già un `v` di
   suo: la sua versione di migrazione). */
function avvolgi(valore) { return { __v: valore, __t: Date.now() } }
function svolgi(x) {
  if (x && typeof x === 'object' && !Array.isArray(x) && '__v' in x && typeof x.__t === 'number')
    return x;
  return { __v: x, __t: 0 };
}

/* ---------- API ---------- */
export async function detectBackend() {
  // Qui, non altrove: è la lettura di avvio, l'unica per cui vale la pena
  // aspettare più a lungo (vedi TIMEOUT_AVVIO sopra). Una volta che `db` è
  // popolato le chiamate seguenti lo trovano già pronto.
  const base = await openDb(TIMEOUT_AVVIO);
  if (base) { backend.kind = 'IndexedDB'; backend.ready = true; return backend.kind }
  if (lsSet('__probe__', '1')) { backend.kind = 'localStorage'; backend.ready = true; return backend.kind }
  backend.kind = 'memoria'; backend.ready = true;
  return backend.kind;
}

export async function load(key) {
  const fromIdb = await idbRun('readonly', s => s.get(key));
  const daIdb = (fromIdb != null && fromIdb !== true) ? svolgi(fromIdb) : null;
  const raw = lsGet(key);
  let daLs = null;
  if (raw != null) { try { daLs = svolgi(JSON.parse(raw)) } catch (e) { /* ignora */ } }
  // la più recente vince, se ce ne sono due
  if (daIdb && daLs) return (daLs.__t > daIdb.__t ? daLs : daIdb).__v;
  if (daIdb) return daIdb.__v;
  if (daLs) return daLs.__v;
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

// Due `flush()` in corsa non devono poter scrivere una chiave vecchia
// sopra una nuova: `flush()` gira sempre in coda a quello prima (una
// catena di promesse), quindi chi arriva mentre un altro giro sta ancora
// scrivendo aspetta il suo turno invece di intrecciarsi. Il primo giro
// prende `pending` così com'è al momento in cui parte; un `save()`
// arrivato nel frattempo resta per il giro dopo.
let codaFlush = Promise.resolve();

export function flush() {
  clearTimeout(timer); timer = null;
  const giro = codaFlush.then(eseguiFlush);
  // se `eseguiFlush` fallisce non deve incastrare i giri dopo: si logga e si va avanti
  codaFlush = giro.catch(() => {});
  return giro;
}

async function eseguiFlush() {
  const batch = [...pending]; pending.clear();
  for (const [k, v] of batch) {
    const busta = avvolgi(v);
    const ok = await idbRun('readwrite', s => s.put(busta, k));
    if (ok == null) lsSet(k, JSON.stringify(busta));      // ripiego
    else { try { localStorage.removeItem(k) } catch (e) { /* pazienza */ } }
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

// unisce tutti e tre i livelli: possono non raccontare la stessa storia
// (IndexedDB lento all'avvio -> scritto su localStorage), e un giocatore
// di troppo si cancella, uno mancante sembra sparito
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
  viste.delete('__probe__');
  return [...viste].filter(k => typeof k === 'string' && k.startsWith(prefisso)).sort();
}

/* ---------- il travaso ----------
   All'avvio, se IndexedDB funziona ma in localStorage sono rimaste
   scritture di ripiego (fatte mentre IndexedDB non rispondeva, magari
   una sessione fa), le sposta lì: senza, quelle chiavi restano un doppio
   che nessuno concilia finché non si rilegge, e `load()` da solo le
   concilia già leggendo (vince la busta più recente) ma non le sposta.
   Torna quante ne ha spostate, solo per i test. */
export async function travasaRipiego() {
  const base = await openDb(TIMEOUT_AVVIO);
  if (!base) return 0;
  let chs;
  try { chs = []; for (let i = 0; i < localStorage.length; i++) chs.push(localStorage.key(i)) }
  catch (e) { return 0 }
  let quante = 0;
  for (const k of chs) {
    if (!k || k === '__probe__') continue;
    const raw = lsGet(k);
    if (raw == null) continue;
    let daLs;
    try { daLs = svolgi(JSON.parse(raw)) } catch (e) { continue }
    const fromIdb = await idbRun('readonly', s => s.get(k));
    const daIdb = (fromIdb != null && fromIdb !== true) ? svolgi(fromIdb) : null;
    if (daIdb && daIdb.__t >= daLs.__t) { try { localStorage.removeItem(k) } catch (e) {} ; continue }
    const ok = await idbRun('readwrite', s => s.put(daLs, k));
    if (ok != null) { try { localStorage.removeItem(k) } catch (e) { /* pazienza */ } quante++ }
  }
  return quante;
}

/* ---------- persistere l'archivio ----------
   `navigator.storage.persist()`: chiesto una volta sola (non ha senso
   richiederlo a ogni apertura della pagina dei genitori), dove il
   browser lo consente. Senza, su Safari non installato i dati possono
   sparire dopo una settimana senza giocare (docs/core/archivio.md). */
export const persistenza = { chiesta: false, concessa: null };   // null = non si sa / non supportato

export async function chiediPersistenza() {
  if (persistenza.chiesta) return persistenza.concessa;
  persistenza.chiesta = true;
  try {
    if (!navigator?.storage?.persist) return (persistenza.concessa = null);
    persistenza.concessa = await navigator.storage.persist();
  } catch (e) { persistenza.concessa = null }
  return persistenza.concessa;
}

// Solo per i test: rimette l'archivio come alla partenza del processo,
// compreso quello che nessuna `remove()` tocca (lo stato di IndexedDB).
export function _azzeraPerTest() {
  db = null; statoApertura = null; ascoltatori = [];
  mem.clear(); pending.clear();
  clearTimeout(timer); timer = null;
  codaFlush = Promise.resolve();
  backend.kind = 'memoria'; backend.ready = false;
  persistenza.chiesta = false; persistenza.concessa = null;
}

// Solo per i test: i due timeout sono minuti buoni per un telefono vero,
// non per una suite che deve girare in secondi. `null`/`undefined` lascia
// il valore attuale invariato.
export function _impostaTempiPerTest({ apertura, avvio } = {}) {
  if (apertura != null) TIMEOUT_APERTURA = apertura;
  if (avvio != null) TIMEOUT_AVVIO = avvio;
}
