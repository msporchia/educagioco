// Come si dice un pezzo nella bottega, nello zaino e per terra: la rarità (il colore del bordo e dell'aura), che
// cos'è, il livello, i numeri in elenco e il confronto con quello che si ha addosso. Sta nelle viste perché sono
// parole e colori: i numeri li dà il motore (seLoMetto in motore/corredo.js). Il perché:
// docs/sotterraneo/rarita.md e docs/sotterraneo/bottega.md.
import { RARITA } from '../dati/pezzi.js'
import { requisitoDi } from '../dati/eroi.js'
import { CARATTERISTICHE } from '../dati/livelli.js'

// i colori di Diablo: bianco il comune, blu il magico, giallo il raro, arancio-oro il leggendario. Una cosa che si
// consuma (pozioni, torce) non ha rarità e sta nel bianco
export const GRADINI = Object.fromEntries(Object.entries(RARITA).map(([k, r]) => [k, { nome: r.nome, colore: r.colore }]))

export const gradinoDi = c => (c && c.rarita && RARITA[c.rarita] ? c.rarita : 'comune')

const FAMIGLIA = { spade: 'Spada', asce: 'Ascia', archi: 'Arco', bacchette: 'Bacchetta' }

// che cos'è, in due parole: «Spada · a due mani», «Scudo», «Pozione»
export function tipoDi(c) {
  if (!c) return ''
  if (c.dove === 'mano') return `${FAMIGLIA[c.famiglia] || 'Arma'} · ${c.mani === 2 ? 'a due mani' : 'a una mano'}`
  if (c.dove === 'mancina') return 'Scudo'
  if (c.dove === 'corpo') return 'Armatura'
  if (c.dove === 'dito') return 'Gioiello'
  if (c.usa === 'cura') return 'Pozione'
  if (c.usa === 'cresci') return 'Elisir'
  if (c.usa === 'energia') return 'Pozione dell\'energia'
  if (c.usa === 'luce') return 'Torcia'
  if (c.usa === 'porta') return 'Chiave'
  return ''
}

// «Spada · a una mano · livello 7 · magico · Forza 4»: la riga sotto il nome, col requisito dell'arma (dati/eroi.js)
const NOMI_CAR = Object.fromEntries(CARATTERISTICHE.map(x => [x.chiave, x.nome]))
export const requisitoScritto = c => { const r = requisitoDi(c); return r ? `${NOMI_CAR[r.car]} ${r.serve}` : '' }
export const comeEDi = c => [tipoDi(c), c && c.dove ? `livello ${c.liv || 1}` : null, c && c.dove ? GRADINI[gradinoDi(c)].nome : null,
  requisitoScritto(c)].filter(Boolean).join(' · ')

const virgola = n => String(n).replace('.', ',')

// Le abilità in riga nel confronto affiancato e nell'elenco del pannello: l'icona, la parola corta e come si scrive il
// valore. Una nuova si aggiunge qui e in ABILITA_CONFRONTATE di motore/corredo.js: un test controlla che coincidano
export const ABILITA = [
  { campo: 'att', em: '⚔️', nome: 'Attacco', scrivi: v => `+${virgola(v)}`, dice: v => `+${virgola(v)} attacco` },
  { campo: 'dif', em: '🛡️', nome: 'Difesa', scrivi: v => `+${virgola(v)}`, dice: v => `+${virgola(v)} difesa` },
  { campo: 'vita', em: '❤️', nome: 'Vita', scrivi: v => `+${virgola(v)}`, dice: v => `+${virgola(v)} vita` },
  { campo: 'rigenera', em: '💚', nome: 'Rigenera', scrivi: v => `+${virgola(v)}`, dice: v => `+${virgola(v)} vita a ogni mostro battuto` },
  { campo: 'fuoco', em: '🔥', nome: 'Fuoco', scrivi: v => `+${virgola(v)}`, dice: v => `+${virgola(v)} danno di fuoco a ogni colpo: passa anche la difesa` },
  { campo: 'schivata', em: '🌀', nome: 'Schivata', scrivi: v => `${virgola(v)}%`, dice: v => `${virgola(v)} graffi su cento schivati` },
  { campo: 'gemme', em: '💎', nome: 'Gemme', scrivi: v => `×${virgola(Math.round((1 + v) * 100) / 100)}`,
    dice: v => `ogni gemma vale ×${virgola(Math.round((1 + v) * 100) / 100)}` },
  { campo: 'fortuna', em: '🍀', nome: 'Fortuna', scrivi: v => `+${virgola(v)}`, dice: v => `+${virgola(v)} fortuna: roba migliore` },
  { campo: 'pozioni', em: '🧪', nome: 'Pozioni', scrivi: v => `+${virgola(v)}%`, dice: v => `le pozioni curano il ${virgola(v)}% in più` },
  { campo: 'luce', em: '🔦', nome: 'Luce', scrivi: v => `+${virgola(v)}`, dice: () => 'vedi più lontano' },
  { campo: 'torcia', em: '⏳', nome: 'Torcia', scrivi: v => `+${virgola(v)}`, dice: v => `la torcia dura ${virgola(v)} stanze in più` },
]

// i numeri al posto delle frasi: «⚔️ +4 attacco», non «picchia di più»
export function numeriDi(c, { cura = null } = {}) {
  if (!c) return []
  const n = []
  for (const a of ABILITA) if (c[a.campo]) n.push({ em: a.em, testo: a.dice(c[a.campo]), campo: a.campo })
  if (c.cura) n.push({ em: '❤️', testo: `+${cura ?? c.cura} vita, subito` })
  if (c.cresce) n.push({ em: '❤️', testo: `+${c.cresce} vita massima` })
  // la pozione blu ridà l'energia delle abilità, non la vita (l'utente, 9 ottobre: non era classificata)
  if (c.usa === 'energia') n.push({ em: '🔷', testo: `+${c.energia} energia, subito` })
  if (c.stanze) n.push({ em: '🔥', testo: `${c.stanze} stanze di luce` })
  if (c.usa === 'porta') n.push({ em: '🗝️', testo: 'apre una porta' })
  return n
}

// `prova` = seLoMetto(): una riga per ogni numero che cambia, col verso (su: verde, giù: rosso)
export function confrontoDi(prova) {
  if (!prova || !prova.prima) return []
  const { prima: a, dopo: b } = prova
  const righe = []
  for (const x of ABILITA) {
    const p = a[x.campo] || 0, d = b[x.campo] || 0
    if (p === d) continue
    const scrivi = ['att', 'dif', 'vita'].includes(x.campo) ? v => String(v) : v => (v ? x.scrivi(v) : '0')
    righe.push({ campo: x.campo, em: x.em, prima: scrivi(p), dopo: scrivi(d), su: d > p })
  }
  return righe
}

// «lo scudo borchiato», «la spada», «l'ascia», «il manto»: il nome con l'articolo, in mezzo a una frase
export function conArticolo(c) {
  const n = c.nome.toLowerCase()
  if (/^[aeiou]/.test(n)) return `l'${n}`
  if (c.genere === 'f') return `la ${n}`
  return /^(s[^aeiou]|z|gn|ps)/.test(n) ? `lo ${n}` : `il ${n}`
}

// il posto che il pezzo prende, per dire «niente» con l'ombra giusta
export const POSTO = {
  mano: { em: '⚔️', dice: 'nessuna arma' },
  mancina: { em: '🛡️', dice: 'nessuno scudo' },
  corpo: { em: '🦺', dice: 'nessuna armatura' },
  dito: { em: '💍', dice: 'nessun gioiello' },
}

// «meglio in 2, peggio in 1», o «uguale»
export function sintesiDi(meglio, peggio) {
  if (!meglio && !peggio) return 'uguale'
  return [meglio && `meglio in ${meglio}`, peggio && `peggio in ${peggio}`].filter(Boolean).join(', ')
}

// Il confronto affiancato, `prova` = seLoMetto(): a sinistra quello che si ha addosso nel posto (`toglie`, anche due
// pezzi), a destra il pezzo guardato, una riga per ogni abilità che almeno uno dei due ha. «—» dove non ce l'ha.
// `dueMani`: il pezzo prende il posto di arma e scudo insieme. null se non c'è niente da confrontare
export function affiancatoDi(prova, cosa) {
  if (!prova || !prova.cambio) return null
  const { toglie, vecchi, nuovi, dove } = prova.cambio
  const righe = []
  let meglio = 0, peggio = 0
  for (const a of ABILITA) {
    const x = vecchi[a.campo] || 0, y = nuovi[a.campo] || 0
    if (!x && !y) continue
    const verso = y > x ? 'su' : y < x ? 'giu' : 'pari'
    if (verso === 'su') meglio++
    if (verso === 'giu') peggio++
    righe.push({ campo: a.campo, em: a.em, nome: a.nome, vecchio: x ? a.scrivi(x) : '—', nuovo: y ? a.scrivi(y) : '—', verso })
  }
  return {
    toglie, dove, righe, meglio, peggio, sintesi: sintesiDi(meglio, peggio),
    dueMani: !!(cosa && cosa.mani === 2 && toglie.length > 1),
  }
}
