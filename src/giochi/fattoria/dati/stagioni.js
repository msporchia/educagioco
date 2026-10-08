/* Le stagioni della fattoria: neve a Natale, zucche a Halloween (dato puro) — vedi docs/fattoria/stagioni.md.
   Le finestre sono in data locale (getMonth/getDate), non UTC: Natale scavalca l'anno. */
import { caso } from './mondo.js'

// [mese, giorno], estremi compresi; si ritoccano qui e in nessun altro posto.
export const FINESTRE = {
  halloween: { da: [10, 1],  a: [10, 31], nome: 'Halloween', icona: '🎃' },
  natale:    { da: [11, 1],  a: [1, 6],  nome: 'Natale',    icona: '🎄' },
}

const giornoDellAnno = (mese, giorno) => mese * 100 + giorno

// Una finestra con da > a scavalca l'anno: dentro vuol dire dopo l'inizio OPPURE prima della fine.
function dentroLa(nome, data) {
  const f = FINESTRE[nome]
  const n = giornoDellAnno(data.getMonth() + 1, data.getDate())
  const da = giornoDellAnno(...f.da), a = giornoDellAnno(...f.a)
  return da <= a ? (n >= da && n <= a) : (n >= da || n <= a)
}

// Che stagione è, o null per "un giorno qualunque".
export function stagioneDi(data = new Date()) {
  return Object.keys(FINESTRE).find(nome => dentroLa(nome, data)) || null
}

// Il seme di una giornata: cambia a mezzanotte locale.
export function semeDelGiorno(data = new Date()) {
  return data.getFullYear() * 10000 + (data.getMonth() + 1) * 100 + data.getDate()
}

// Una ogni tanto (non un tappeto), ordinate per un caso seminato dal giorno: stesse celle tutto il giorno.
const OGNI = 14, ALMENO = 2, AL_MASSIMO = 12

// In pixel dello sprite, come per i cappelli: resta grande uguale a qualunque zoom.
const MISURA = { terra: 13, tetto: 9, angolo: 10 }

// Gli addobbi di una stagione, già decisi cella per cella: la scena non sa se è una zucca o una stella.
export function addobbiStagionali(stagione, { libere = [], edifici = [], seme = 0 } = {}) {
  if (!stagione || !FINESTRE[stagione]) return []
  const fuori = []
  const ordinate = libere
    .map(([x, y]) => ({ x, y, q: caso(x, y, seme) }))
    .sort((a, b) => a.q - b.q || a.x - b.x || a.y - b.y)
  const quante = Math.min(AL_MASSIMO, Math.max(Math.min(ALMENO, ordinate.length),
    Math.round(ordinate.length / OGNI)))
  // solo le cose alte almeno due celle hanno un tetto: una panchina addobbata è una panchina coperta
  const alti = edifici.filter(e => e.alto >= 2)

  if (stagione === 'halloween') {
    // Le zucche intagliate: qualcuna sparsa sul prato, e una accanto a ogni casa. Disegnate in pixel
    // (scena/pixel-festa.js), non emoji: «disegno» è il nome, «misura» quanti pixel dell'atlante per pixel.
    const libereK = new Set(libere.map(([x, y]) => x + ',' + y))
    const prese = new Set()
    for (const c of ordinate.slice(0, quante)) {
      prese.add(c.x + ',' + c.y)
      fuori.push({ disegno: 'zucca', x: c.x + .5, y: c.y + .9, misura: 1 })
    }
    for (const e of alti) {
      // il lato cambia col giorno, la zucca c'è sempre
      const fianchi = caso(e.x, e.y, seme + 3) < .5
        ? [[e.x - 1, e.y + e.h - 1], [e.x + e.w, e.y + e.h - 1]]
        : [[e.x + e.w, e.y + e.h - 1], [e.x - 1, e.y + e.h - 1]]
      const posto = fianchi.find(([x, y]) => libereK.has(x + ',' + y) && !prese.has(x + ',' + y))
      if (posto) fuori.push({ disegno: 'zucca', x: posto[0] + .5, y: posto[1] + .9, misura: 1 })
    }
  } else if (stagione === 'natale') {
    const libereK = new Set(libere.map(([x, y]) => x + ',' + y))
    for (const e of alti) {
      const q = caso(e.x, e.y, seme + 2)
      const cima = e.y + e.h - e.alto
      fuori.push({ testo: q < .5 ? '⭐' : '🔔', x: e.x + e.w / 2, y: cima + .35,
                   misura: MISURA.tetto })
      // un alberello accanto, sulla prima cella libera a fianco del piede
      const fianchi = [[e.x + e.w, e.y + e.h - 1], [e.x - 1, e.y + e.h - 1]]
      const posto = fianchi.find(([x, y]) => libereK.has(x + ',' + y))
      if (posto && q < .85)
        fuori.push({ testo: '🎄', x: posto[0] + .5, y: posto[1] + .5, misura: MISURA.terra })
    }
  }
  return fuori
}

export function guastiDelleStagioni() {
  const g = []
  for (const [nome, f] of Object.entries(FINESTRE)) {
    for (const [m, d] of [f.da, f.a])
      if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31))
        g.push(`la finestra di ${nome} ha una data impossibile: ${m}/${d}`)
    if (!f.nome || !f.icona) g.push(`la stagione ${nome} non ha nome o icona`)
  }
  // due finestre che si accavallano darebbero una stagione a caso
  const nomi = Object.keys(FINESTRE)
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
    const data = new Date(2026, m - 1, d)
    if (data.getMonth() !== m - 1) continue        // il 31 aprile non esiste
    const dentro = nomi.filter(n => dentroLa(n, data))
    if (dentro.length > 1) { g.push(`${dentro.join(' e ')} si accavallano il ${d}/${m}`); return g }
  }
  return g
}
