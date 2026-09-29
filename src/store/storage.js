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

/* ---------- il registro del ripiego ----------
   «Il ripiego, quando c'è, è il più recente» è vero SOLO per le chiavi
   che questo stesso codice ci ha scritto e non ha ancora ripulito — non
   per qualunque cosa capiti a stare in localStorage. Un telefono vero può
   avere chiavi lì dentro vecchie di mesi (`profilo:g1`, il roster: nate
   quando IndexedDB falliva prima che questa pulizia esistesse, o
   semplicemente prima che venisse ripulita in tempo), con IndexedDB che
   nel frattempo ha ricevuto scritture più fresche: per quelle vale la
   regola di sempre, vince IndexedDB. Il registro (`__ripiego__`, un
   elenco di chiavi) distingue le due cose: ci entra una chiave quando la
   scrittura per lei cade sul ripiego, ne esce quando una scrittura
   successiva arriva in IndexedDB. Solo chi è dentro si fida ciecamente
   del ripiego. */
const REGISTRO = '__ripiego__';
// chiavi che altri scrivono in localStorage da sé (guide/aiuto.js, il banco di prova): non sono archivio, il travaso non le tocca
const FUORI_ARCHIVIO = new Set(['__probe__', REGISTRO, 'guide-viste']);

function leggiRegistro() {
  try {
    const arr = JSON.parse(localStorage.getItem(REGISTRO) || '[]');
    return Array.isArray(arr) ? arr.filter(k => typeof k === 'string') : [];
  } catch (e) { return [] }
}
function scriviRegistro(arr) { lsSet(REGISTRO, JSON.stringify(arr)) }
function segnaRipiego(k) {
  const arr = leggiRegistro();
  if (!arr.includes(k)) { arr.push(k); scriviRegistro(arr) }
}
function smarcaRipiego(k) {
  const arr = leggiRegistro();
  const i = arr.indexOf(k);
  if (i >= 0) { arr.splice(i, 1); scriviRegistro(arr) }
}
function èRipiego(k) { return leggiRegistro().includes(k) }

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

/* Una chiave nel registro del ripiego è per costruzione la più recente
   (vedi sopra): per lei si guarda PRIMA localStorage, senza aspettare
   IndexedDB. Per tutte le altre vale la regola di sempre — IndexedDB
   prima, localStorage solo come ultima spiaggia se IndexedDB non ha
   proprio niente — perché una chiave in localStorage ma fuori dal
   registro potrebbe essere spazzatura vecchia di mesi, non l'ultima
   scrittura. */
export async function load(key) {
  if (èRipiego(key)) {
    const raw = lsGet(key);
    if (raw != null) { try { return JSON.parse(raw) } catch (e) { /* non era JSON: si prova IndexedDB */ } }
  }
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

/* Una scrittura riuscita in IndexedDB ripulisce il doppione nel ripiego
   E lo toglie dal registro; una caduta sul ripiego lo segna. È quello che
   tiene vero, per le chiavi segnate, «il ripiego è il più recente». */
async function eseguiFlush() {
  const batch = [...pending]; pending.clear();
  for (const [k, v] of batch) {
    const ok = await idbRun('readwrite', s => s.put(v, k));
    if (ok == null) { lsSet(k, JSON.stringify(v)); segnaRipiego(k) }      // ripiego
    else { try { localStorage.removeItem(k) } catch (e) { /* pazienza */ } smarcaRipiego(k) }
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
  smarcaRipiego(key);
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
  viste.delete('__probe__'); viste.delete(REGISTRO);
  return [...viste].filter(k => typeof k === 'string' && k.startsWith(prefisso)).sort();
}

/* ---------- il travaso ----------
   All'avvio, se IndexedDB funziona ma in localStorage sono rimaste
   scritture di ripiego (fatte mentre IndexedDB non rispondeva, magari
   una sessione fa), le sposta lì. Due casi, e non si trattano uguale:

   - **tracciata** (nel registro, `èRipiego`): per costruzione è la più
     recente (vedi la nota su `eseguiFlush`), quindi vince e si sposta
     senza guardare cosa c'è già in IndexedDB — anche sopra a un valore
     che ci fosse già.
   - **non tracciata**: può essere spazzatura vecchia di mesi, di prima
     che questa pulizia esistesse (`profilo:g1`, il roster, scritti
     quando IndexedDB falliva e non si ripuliva mai). Vince IndexedDB, se
     ha già qualcosa per quella chiave: non si tocca né lì né in
     localStorage. Si sposta SOLO per riempire un buco — una chiave che
     in IndexedDB non c'è affatto.

   `load()` concilia già le due copie leggendo con la stessa regola, ma
   non le sposta: senza il travaso il doppione in localStorage
   resterebbe lì per sempre. Torna quante ne ha spostate, solo per i test. */
export async function travasaRipiego() {
  const base = await openDb(TIMEOUT_AVVIO);
  if (!base) return 0;
  let chs;
  try { chs = []; for (let i = 0; i < localStorage.length; i++) chs.push(localStorage.key(i)) }
  catch (e) { return 0 }
  const registro = leggiRegistro();
  let quante = 0;
  for (const k of chs) {
    if (!k || FUORI_ARCHIVIO.has(k)) continue;
    const raw = lsGet(k);
    if (raw == null) continue;
    let valore;
    try { valore = JSON.parse(raw) } catch (e) { continue }

    if (!registro.includes(k)) {
      // non tracciata: si sposta solo se IndexedDB non ha già la sua
      const giaInIdb = await idbRun('readonly', s => s.get(k));
      if (giaInIdb != null && giaInIdb !== true) continue;   // IndexedDB vince: non si tocca niente
    }

    const ok = await idbRun('readwrite', s => s.put(valore, k));
    if (ok != null) {
      try { localStorage.removeItem(k) } catch (e) { /* pazienza */ }
      smarcaRipiego(k);
      quante++;
    }
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
