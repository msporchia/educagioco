/* I disegni della festa fatti in codice, pixel per pixel: le zucche intagliate e il cappello da strega.
   Un'emoji in mezzo alla pixel art si vedeva disegnata dal telefono (ed era stata tolta per questo):
   qui ogni carattere è un pixel dello sprite. Il cappello la tela lo disegna da qui, sopra le bestie;
   le zucche diventano pezzi dell'atlante (`node strumenti/sprite/festa.mjs`, poi atlante.py), perché
   si comprano e si posano come ogni decorazione. Vedi docs/fattoria/stagioni.md. */

// '.' è vuoto; le altre lettere sono colori della tavolozza. 'L' è la luce dentro la zucca, che tremola.
export const DISEGNI = {
  zucca: {
    righe: [
      '.....gg....',
      '.....g.....',
      '..ooOOOoo..',
      '.oOOoOoOOo.',
      'oOOOoOoOOOo',
      'oOLLoOoLLOo',
      'oOOOoLoOOOo',
      'oOLoLoLoLOo',
      'oOOLLLLLOOo',
      '.oOOoOoOOo.',
      '..ooooooo..',
    ],
    colori: { g: '#3f6b2a', o: '#b5531a', O: '#e07a24', L: '#ffd34d' },
  },
  // Due zucche, una intagliata e una no: la decorazione più grande.
  zucche_mucchio: {
    righe: [
      '...g........g...',
      '...g........g...',
      '.ooOoo....ooOoo.',
      'oOOoOOo..oOOoOOo',
      'oLLoLLo..oOOoOOo',
      'oOOoOOo..oOOoOOo',
      'oOLLLOo..oOOoOOo',
      'oOOOOOo..oOOoOOo',
      '.ooooo....ooooo.',
    ],
    colori: { g: '#3f6b2a', o: '#b5531a', O: '#e07a24', L: '#ffd34d' },
  },
  cappello_strega: {
    righe: [
      '.......kk..',
      '......kpk..',
      '.....kppk..',
      '....kpppk..',
      '....kpppk..',
      '...kppppk..',
      '...kyyyyk..',
      '.kkpppppkkk',
      'kppppppppppk',
      '.kkkkkkkkkk.',
    ],
    colori: { k: '#1c1426', p: '#5a3c7a', y: '#e8b64c' },
  },
}

// Il disegno con il fondo-centro in (x, y), pixel grandi `px` a schermo. luce va da 0 a 1: la candela.
export function disegnaPixel(ctx, nome, x, y, px, luce = 1) {
  const d = DISEGNI[nome]
  if (!d) return false
  const alto = d.righe.length
  const largo = Math.max(...d.righe.map(r => r.length))
  const x0 = Math.round(x - largo * px / 2), y0 = Math.round(y - alto * px)
  const lato = Math.max(1, Math.round(px))
  for (let j = 0; j < alto; j++) {
    const riga = d.righe[j]
    for (let i = 0; i < riga.length; i++) {
      const c = riga[i]
      if (c === '.') continue
      ctx.fillStyle = c === 'L' ? candela(luce) : d.colori[c]
      ctx.fillRect(x0 + Math.round(i * px), y0 + Math.round(j * px), lato, lato)
    }
  }
  return true
}

// Dal giallo pieno all'arancio scuro: una candela che respira, non una lampadina.
function candela(q) {
  const r = 255, g = Math.round(150 + 100 * q), b = Math.round(40 + 60 * q)
  return `rgb(${r},${g},${b})`
}

export const esisteIlDisegno = nome => !!DISEGNI[nome]
export const larghezzaDi = nome => DISEGNI[nome] ? Math.max(...DISEGNI[nome].righe.map(r => r.length)) : 1
export const NOMI_DEI_DISEGNI = Object.keys(DISEGNI)
