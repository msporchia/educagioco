// Il bottino a tono (docs/sotterraneo/rarita.md): quale pezzo cade, a che livello e di che rarità, con quali
// abilità. Il livello è quello del posto o dell'eroe, il più alto dei due («se io sono livello 20 i drop devono
// essere a tono»); la rarità la decidono chi lascia (un mostro, un forziere, un mostro grosso), la profondità e la fortuna.
// Il caso arriva da fuori (`rnd`): la discesa si deve poter rifare identica. Gira in Node.
import { COSE, PEZZI_DI_BASE, chiaveDelPezzo, pescaCosa } from '../dati/cose.js'
import { RARITA, ABILITA_DEI_PEZZI, LEGGENDARI, UNICI } from '../dati/pezzi.js'
import { RARITA_PER_FORTUNA } from '../dati/livelli.js'

// quante volte su cento esce un pezzo magico, raro o leggendario, secondo chi lo lascia (il resto è comune). Il
// grosso lascia di sicuro un raro o meglio; un leggendario è raro davvero: uno ogni due-tre discese girate tutte
export const PROBABILITA = {
  mostro: { magico: 0.22, raro: 0.05, leggendario: 0.004 },
  forziere: { magico: 0.34, raro: 0.1, leggendario: 0.012 },
  grosso: { magico: 0, raro: 1, leggendario: 0.06 },
}
// la profondità alza le rarità piano piano: al livello 40 una volta e mezza
export const PROFONDITA_PER_LIVELLO = 0.0125

// quanto spesso un mostro qualunque lascia un pezzo da mettersi addosso (oltre a quello che si beve): poco, o la
// tabella della storia smetterebbe di dire con che roba si arriva; un po' di più per chi lascia di più
export const pezzoDalMostro = scheda => 0.03 + 0.08 * ((scheda && scheda.droppa) || 0)

// il livello del bottino: quello del posto, o quello dell'eroe se è più alto
export const livelloDelBottino = (posto, eroe) => Math.max(1, Math.round(posto || 1), Math.round(eroe || 1))

export function pescaRarita(chi, { fortuna = 0, livello = 1, rnd = Math.random } = {}) {
  const p = PROBABILITA[chi] || PROBABILITA.mostro
  const spinta = (1 + RARITA_PER_FORTUNA * Math.max(0, fortuna)) * (1 + PROFONDITA_PER_LIVELLO * Math.max(0, livello - 1))
  const t = rnd()
  if (t < p.leggendario * spinta) return 'leggendario'
  if (chi === 'grosso') return 'raro'
  if (t < (p.leggendario + p.raro) * spinta) return 'raro'
  if (t < (p.leggendario + p.raro + p.magico) * spinta) return 'magico'
  return 'comune'
}

// la base: quella di un pezzo che si trova a quel livello (per prezzo, come prima: pescaCosa con la profondità),
// che predilige quello che l'eroe porta
export function pescaBase({ livello = 1, rnd = Math.random, tua = () => true, fra = PEZZI_DI_BASE } = {}) {
  return pescaCosa(fra, { rnd, tua, profondita: Math.min(1, livello / 12) })
}

// le abilità di un pezzo: quelle che nascono nella sua casella, diverse fra loro
export function pescaAbilita(base, quante, rnd = Math.random) {
  const dove = COSE[base] && COSE[base].dove
  const possibili = Object.keys(ABILITA_DEI_PEZZI).filter(a => ABILITA_DEI_PEZZI[a].dove.includes(dove))
  const prese = []
  while (prese.length < quante && possibili.length) prese.push(possibili.splice(Math.floor(rnd() * possibili.length), 1)[0])
  return prese
}

// un leggendario: uno di quelli che l'eroe porta, se ce n'è (gli altri a un terzo, come la roba altrui)
export function pescaLeggendario({ livello = 1, rnd = Math.random, tua = () => true } = {}) {
  const ids = Object.keys(LEGGENDARI)
  const peso = id => (tua(LEGGENDARI[id].base) ? 3 : 1)
  let tiro = rnd() * ids.reduce((n, id) => n + peso(id), 0)
  for (const id of ids) {
    tiro -= peso(id)
    if (tiro <= 0) return chiaveDelPezzo(LEGGENDARI[id].base, livello, 'leggendario', [], id)
  }
  const id = ids[ids.length - 1]
  return chiaveDelPezzo(LEGGENDARI[id].base, livello, 'leggendario', [], id)
}

// Un pezzo nuovo: `chi` lo lascia (mostro, forziere, grosso) al `livello`; `base` per sceglierla (la riga della
// storia, un banco), se no si pesca
export function pezzoNuovo({ livello = 1, chi = 'mostro', fortuna = 0, rnd = Math.random, tua = () => true,
                             base = null, rarita = null } = {}) {
  const r = rarita || pescaRarita(chi, { fortuna, livello, rnd })
  if (r === 'leggendario') return pescaLeggendario({ livello, rnd, tua })
  const b = base || pescaBase({ livello, rnd, tua })
  if (r === 'comune') return chiaveDelPezzo(b, livello)
  const [da, a] = RARITA[r].quante
  const quante = da + Math.floor(rnd() * (a - da + 1))
  const abilita = pescaAbilita(b, quante, rnd)
  return chiaveDelPezzo(b, livello, abilita.length ? r : 'comune', abilita)
}

// il pezzo col nome di un mostro grosso, al livello del bottino
export const pezzoDelGrosso = (id, livello) => (UNICI[id] ? chiaveDelPezzo(UNICI[id].base, livello, 'raro', [], id) : null)

export function guastiDelBottino() {
  const g = []
  for (const [k, p] of Object.entries(PROBABILITA)) {
    const somma = p.magico + p.raro + p.leggendario
    if (k !== 'grosso' && somma > 1) g.push(`${k}: le rarità sommano più di uno`)
    if (k !== 'grosso' && p.leggendario >= p.raro) g.push(`${k}: un leggendario non è più raro di un raro`)
  }
  for (const [id, u] of Object.entries(UNICI)) {
    const b = COSE[u.base]
    if (!b || !b.dove) { g.push(`${id}: la base "${u.base}" non si indossa`); continue }
    if (!u.nome || !(u.abilita || []).length) g.push(`${id}: senza nome o senza abilità`)
    for (const a of u.abilita || []) if (!ABILITA_DEI_PEZZI[a]) g.push(`${id}: l'abilità "${a}" non esiste`)
    if (u.rarita === 'leggendario' && !u.storia) g.push(`${id}: un leggendario senza la sua riga di storia`)
    if (!COSE[chiaveDelPezzo(u.base, 5, u.rarita, [], id)]) g.push(`${id}: la sua chiave non si rilegge`)
  }
  for (const [a, x] of Object.entries(ABILITA_DEI_PEZZI)) {
    if (!x.em || !x.nome || !x.agg || x.agg.length !== 2 || !x.di) g.push(`${a}: senza icona, nome o parole per il nome`)
    if (!x.dove.length) g.push(`${a}: non nasce in nessuna casella`)
    for (let L = 1; L < 80; L += 7) if (!(x.valore(L, 1) > 0)) g.push(`${a}: al livello ${L} vale ${x.valore(L, 1)}`)
  }
  return g
}
