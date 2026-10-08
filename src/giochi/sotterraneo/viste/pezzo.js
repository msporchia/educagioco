// Come si dice un pezzo nella bottega e nello zaino: il gradino (il colore del bordo), che cos'è, i numeri in
// elenco e il confronto con quello che si ha addosso. Sta nelle viste perché sono parole e colori: i numeri li
// dà il motore (seLoMetto in motore/corredo.js). Il perché: docs/sotterraneo/roba.md, "La bottega e lo zaino".

// il gradino si legge dal prezzo, l'unica scala su cui sta tutto il catalogo; le quattro armi col nome proprio
// stanno fuori (non hanno `grado`). Le soglie cadono sui tre gradini delle armi (8, 16, 26)
export const GRADINI = {
  comune: { nome: 'comune', colore: '#c4ccda' },
  buono: { nome: 'buono', colore: '#62b3ff' },
  raro: { nome: 'raro', colore: '#ffd23f' },
  unico: { nome: 'col suo nome', colore: '#ff8f3f' },
}

export function gradinoDi(c) {
  if (!c) return 'comune'
  if (c.dove === 'mano' && !c.grado) return 'unico'
  const p = c.prezzo || 0
  return p <= 12 ? 'comune' : p <= 22 ? 'buono' : 'raro'
}

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
  if (c.usa === 'luce') return 'Torcia'
  if (c.usa === 'porta') return 'Chiave'
  return ''
}

const virgola = n => String(n).replace('.', ',')

// i numeri al posto delle frasi: «⚔️ +4 attacco», non «picchia di più»
export function numeriDi(c) {
  if (!c) return []
  const n = []
  if (c.att) n.push({ em: '⚔️', testo: `+${c.att} attacco` })
  if (c.dif) n.push({ em: '🛡️', testo: `+${c.dif} difesa` })
  if (c.vita) n.push({ em: '❤️', testo: `+${c.vita} vita` })
  if (c.cura) n.push({ em: '❤️', testo: `+${c.cura} vita, subito` })
  if (c.cresce) n.push({ em: '❤️', testo: `+${c.cresce} vita massima` })
  if (c.luce) n.push({ em: '🔥', testo: 'vedi più lontano' })
  if (c.gemme) n.push({ em: '💎', testo: `ogni gemma vale ×${virgola(1 + c.gemme)}` })
  if (c.stanze) n.push({ em: '🔥', testo: `${c.stanze} stanze di luce` })
  if (c.usa === 'porta') n.push({ em: '🗝️', testo: 'apre una porta' })
  return n
}

// `prova` = seLoMetto(): una riga per ogni numero che cambia, col verso (su: verde, giù: rosso)
export function confrontoDi(prova) {
  if (!prova || !prova.prima) return []
  const { prima: a, dopo: b } = prova
  const righe = []
  const riga = (campo, em, x, y, scrivi = v => String(v)) => {
    if (x === y) return
    righe.push({ campo, em, prima: scrivi(x), dopo: scrivi(y), su: y > x })
  }
  riga('att', '⚔️', a.att, b.att)
  riga('dif', '🛡️', a.dif, b.dif)
  riga('vita', '❤️', a.vita, b.vita)
  riga('gemme', '💎', a.gemme, b.gemme, v => `×${virgola(1 + v)}`)
  riga('luce', '🔥', a.luce, b.luce, v => (v ? `+${virgola(v)}` : '0'))
  return righe
}

// Le abilità in riga nel confronto affiancato: l'icona, la parola corta e come si scrive il valore. Una nuova (la
// schivata…) si aggiunge qui e in ABILITA_CONFRONTATE di motore/corredo.js: un test controlla che coincidano.
export const ABILITA = [
  { campo: 'att', em: '⚔️', nome: 'Attacco', scrivi: v => `+${virgola(v)}` },
  { campo: 'dif', em: '🛡️', nome: 'Difesa', scrivi: v => `+${virgola(v)}` },
  { campo: 'vita', em: '❤️', nome: 'Vita', scrivi: v => `+${virgola(v)}` },
  { campo: 'gemme', em: '💎', nome: 'Gemme', scrivi: v => `×${virgola(1 + v)}` },
  { campo: 'luce', em: '🔥', nome: 'Luce', scrivi: v => `+${virgola(v)}` },
]

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
