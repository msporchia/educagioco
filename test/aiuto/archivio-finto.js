/* ═══════════════════════════════════════════════════════════════════
   UN INDEXEDDB E UN LOCALSTORAGE FINTI

   Fuori dal browser `indexedDB` e `localStorage` non esistono, quindi
   `store/storage.js` degrada da solo all'archivio in memoria (vedi gli
   altri test). Per provare le due cose che contano solo quando i due
   backend veri esistono — il timeout non definitivo, il travaso, la
   busta col segno di tempo, la corsa fra due `flush()` — serve un
   IndexedDB che risponda quando gli si dice di rispondere, e con il
   ritardo che gli si dice di avere.

   Si finge solo quello che `storage.js` usa davvero: `open()`,
   `transaction().objectStore()` con `get`/`put`/`delete`/`getAllKeys`.
   ═══════════════════════════════════════════════════════════════════ */

// Un `Storage` minimo, sostituto di quello del browser.
export function localStorageFinta() {
  const dati = new Map()
  return {
    getItem: k => (dati.has(k) ? dati.get(k) : null),
    setItem: (k, v) => { dati.set(k, String(v)) },
    removeItem: k => { dati.delete(k) },
    key: i => [...dati.keys()][i] ?? null,
    get length() { return dati.size },
    _dati: dati,   // comodo per ispezionare direttamente nei test
  }
}

/* `ritardoApertura`: quanto ci mette `open()` a rispondere (ms).
   `fallisceApertura`: risponde con un errore invece che con successo.
   `ritardiPut`: un ritardo per ogni `put()`, nell'ordine in cui arrivano
   (il primo scrive per il primo `put`, il secondo per il secondo, …) —
   serve a costruire scenari dove una scrittura più vecchia rischia di
   finire su disco DOPO una più nuova. Quello che manca in lista è 0. */
export function indexedDBFinta({ ritardoApertura = 0, fallisceApertura = false, ritardiPut = [] } = {}) {
  const store = new Map()
  let contatorePut = 0

  function operazione(fn, ritardo = 0) {
    const req = { onsuccess: null, onerror: null, result: undefined }
    setTimeout(() => {
      try { req.result = fn(); req.onsuccess && req.onsuccess() }
      catch (e) { req.onerror && req.onerror() }
    }, ritardo)
    return req
  }

  function creaTransazione() {
    return {
      onerror: null, onabort: null,
      objectStore() {
        return {
          get: k => operazione(() => store.get(k)),
          getAllKeys: () => operazione(() => [...store.keys()]),
          put: (v, k) => operazione(() => { store.set(k, v); return k }, ritardiPut[contatorePut++] ?? 0),
          delete: k => operazione(() => { store.delete(k) }),
        }
      },
    }
  }

  return {
    _store: store,
    open() {
      const req = { onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null, result: null }
      setTimeout(() => {
        if (fallisceApertura) { req.onerror && req.onerror(); return }
        req.result = { createObjectStore() {}, transaction: () => creaTransazione() }
        req.onupgradeneeded && req.onupgradeneeded()
        req.onsuccess && req.onsuccess()
      }, ritardoApertura)
      return req
    },
  }
}

// Un giro a vuoto: aspetta che le microtask già in coda finiscano.
export const unGiro = (ms = 0) => new Promise(r => setTimeout(r, ms))
