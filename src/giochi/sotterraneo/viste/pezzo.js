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
