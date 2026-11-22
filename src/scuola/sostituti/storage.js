// A scuola l'archivio vive in memoria e muore con la pagina: stessi nomi di store/storage.js, nessun disco (docs/scuola/architettura.md).
// Si salvano e si rileggono copie: chi rilegge non deve poter cambiare quello che ha salvato.
const mem = new Map()
const copia = v => (v === undefined ? null : JSON.parse(JSON.stringify(v)))

export const backend = { kind: 'memoria', ready: false }
export async function detectBackend() { backend.ready = true; return backend.kind }
export async function load(chiave) { return mem.has(chiave) ? copia(mem.get(chiave)) : null }
export function save(chiave, valore) { mem.set(chiave, copia(valore)) }
export async function flush() {}
export async function archivioFermo() {}
export async function remove(chiave) { mem.delete(chiave) }
export async function chiavi(prefisso = '') { return [...mem.keys()].filter(k => k.startsWith(prefisso)).sort() }
export async function travasaRipiego() { return 0 }
export const persistenza = { chiesta: false, concessa: null }
export async function chiediPersistenza() { return null }
export function _azzeraPerTest() { mem.clear(); backend.ready = false }
export function _impostaTempiPerTest() {}
