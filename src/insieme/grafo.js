// La fotografia di uno stato qualunque, per i giochi in due (docs/core/insieme.md, «La fotografia»): un oggetto JSON che si può
// mandare all'altro telefono e da cui si rifà lo stesso stato. Tiene quello che il JSON perde: le Map, i Set, gli array tipizzati,
// le classi (dal nome, in `classi`), e gli oggetti che stanno in due posti (un mostro nel piano e nello scontro restano uno solo).
// Le funzioni non si fotografano: chi ha un caso o un metodo sull'istanza li rimette dopo.
//
//   fotoDi(radice, { classi })  →  { n, r }        rimettiDa(foto, { classi })  →  la radice rifatta
//   `classi`: { Nome: Classe }; un oggetto con un prototipo che non è lì diventa un oggetto semplice

const TIPIZZATI = { Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array }

export function fotoDi(radice, { classi = {} } = {}) {
  const nomi = new Map(Object.entries(classi).map(([nome, C]) => [C.prototype, nome]))
  const visti = new Map()
  const nodi = []
  const giu = v => {
    if (v === null || typeof v === 'boolean' || typeof v === 'string') return v
    if (typeof v === 'number') return Number.isFinite(v) ? v : { $: 'n', v: String(v) }
    if (v === undefined) return { $: 'u' }
    if (typeof v === 'function' || typeof v === 'symbol' || typeof v === 'bigint') return { $: 'u' }
    if (v instanceof WeakMap || v instanceof WeakSet) return { $: 'u' }
    if (visti.has(v)) return { $: 'r', i: visti.get(v) }
    const i = nodi.length
    visti.set(v, i)
    nodi.push(null)
    let nodo
    if (Array.isArray(v)) nodo = { $: 'a', v: v.map(giu) }
    else if (v instanceof Map) nodo = { $: 'm', v: [...v].map(([k, x]) => [giu(k), giu(x)]) }
    else if (v instanceof Set) nodo = { $: 's', v: [...v].map(giu) }
    else if (ArrayBuffer.isView(v)) nodo = { $: 't', c: v.constructor.name, v: Array.from(v) }
    else {
      const p = Object.getPrototypeOf(v)
      const campi = {}
      for (const k of Object.keys(v)) campi[k] = giu(v[k])
      nodo = { $: 'o', v: campi, ...(p && p !== Object.prototype && nomi.has(p) ? { c: nomi.get(p) } : {}) }
    }
    nodi[i] = nodo
    return { $: 'r', i }
  }
  const r = giu(radice)
  return { n: nodi, r }
}

export function rimettiDa(foto, { classi = {} } = {}) {
  const fatti = new Array(foto.n.length)
  // prima i contenitori vuoti (così i riferimenti, anche circolari, trovano già l'oggetto), poi il loro contenuto
  foto.n.forEach((nodo, i) => {
    if (nodo.$ === 'a') fatti[i] = []
    else if (nodo.$ === 'm') fatti[i] = new Map()
    else if (nodo.$ === 's') fatti[i] = new Set()
    else if (nodo.$ === 't') fatti[i] = new (TIPIZZATI[nodo.c] || Float64Array)(nodo.v)
    else fatti[i] = Object.create(nodo.c && classi[nodo.c] ? classi[nodo.c].prototype : Object.prototype)
  })
  const su = v => {
    if (v === null || typeof v !== 'object') return v
    if (v.$ === 'u') return undefined
    if (v.$ === 'n') return Number(v.v)
    if (v.$ === 'r') return fatti[v.i]
    throw new Error('fotografia storta')
  }
  foto.n.forEach((nodo, i) => {
    const x = fatti[i]
    if (nodo.$ === 'a') nodo.v.forEach(v => x.push(su(v)))
    else if (nodo.$ === 'm') nodo.v.forEach(([k, v]) => x.set(su(k), su(v)))
    else if (nodo.$ === 's') nodo.v.forEach(v => x.add(su(v)))
    else if (nodo.$ === 'o') for (const [k, v] of Object.entries(nodo.v)) x[k] = su(v)
  })
  return su(foto.r)
}
