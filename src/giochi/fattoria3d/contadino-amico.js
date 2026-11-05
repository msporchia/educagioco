// Il contadino nella fattoria in comune: viaggia nello stesso giro delle mosse (comune.js), ma non è una mossa. Una posizione persa
// non conta, arriva la prossima: chi riceve tiene l'ultima e ne segue la strada (docs/fattoria3d/in-comune.md, «I due contadini»).
export const OGNI_PUNTO = 400            // ms fra un punto e l'altro della strada
export const MAX_PUNTI = 10              // la strada di un giro, e poco più: oltre, i punti più vecchi si lasciano
export const SPARISCE = 15000            // ms senza notizie: un giro perso ne costa sei (comune.js)
const ABITO_OGNI = 4                     // giri: l'abito pesa più della strada e cambia di rado
export const GESTI = ['semina', 'falcia', 'abbatti', 'chiama', 'pesca', 'ritira', 'esulta']

const tondo = n => Math.round(n * 10) / 10
const numero = (n, max) => Number.isFinite(n) && Math.abs(n) <= max

/* La strada del mio contadino fra un giro e l'altro: `segna` a ogni punto, `prendi` quando parte il giro */
export class Strada {
  constructor() { this.punti = []; this.ora = null; this.gesto = null; this.corsa = false; this.giri = 0 }

  segna({ x, z, d, r = false, g = null }) {
    const p = [tondo(x), tondo(z)], u = this.punti.at(-1)
    if (!u || u[0] !== p[0] || u[1] !== p[1]) this.punti.push(p)
    if (this.punti.length > MAX_PUNTI) this.punti.shift()
    this.ora = { d: Math.round(d * 100) / 100 }
    this.corsa ||= r; this.gesto = g || this.gesto
  }

  /* il messaggio per l'amico, o null se non si sa ancora dove sono; la strada riparte dall'ultimo punto */
  prendi(abito) {
    if (!this.ora) return null
    const m = { k: 'qui', p: this.punti, d: this.ora.d, ...(this.corsa ? { r: true } : {}), ...(this.gesto ? { g: this.gesto } : {}), ...(this.giri++ % ABITO_OGNI === 0 ? { a: { ...abito } } : {}) }
    this.punti = [this.punti.at(-1)]; this.corsa = false; this.gesto = null
    return m
  }
}

/* un messaggio del contadino arrivato dall'amico: la forma pulita, o null se non è una cosa che sappiamo leggere */
export function quiInForma(m) {
  if (m?.k === 'via') return { k: 'via' }
  if (m?.k !== 'qui' || !Array.isArray(m.p) || !m.p.length || m.p.length > MAX_PUNTI || !numero(m.d, 100)) return null
  if (!m.p.every(c => Array.isArray(c) && c.length === 2 && numero(c[0], 1e5) && numero(c[1], 1e5))) return null
  const l = { k: 'qui', p: m.p, d: m.d, r: m.r === true, g: GESTI.includes(m.g) ? m.g : null, a: null }
  // l'abito: solo nomi brevi di capi; quali esistono lo dice normalizzaAbito, dove si usa
  if (m.a && typeof m.a === 'object' && !Array.isArray(m.a)) {
    const a = Object.entries(m.a).filter(([k, v]) => /^[a-z]{1,16}$/.test(k) && typeof v === 'string' && /^[a-z0-9_-]{1,24}$/i.test(v)).slice(0, 12)
    if (a.length) l.a = Object.fromEntries(a)
  }
  return l
}
