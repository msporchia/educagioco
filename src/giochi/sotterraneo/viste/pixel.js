// Le figure piccole disegnate in codice per la terra di sopra, finché non arrivano gli sprite veri (il prompt 4
// della scheda PROMPT-terra-di-sopra.md): righe di pixel e una tavolozza, che diventano rettangoli di un <svg>
// con `crispEdges`. Un pixel qui vale un pixel dell'eroe (scala 3), così stanno sulla mappa come lui.

// le righe in rettangoli, unendo i pixel uguali di fila: { w, h, rect: [{ x, y, w, c }] }
export function pixel(righe, tavolozza) {
  const rect = []
  righe.forEach((r, y) => {
    for (let x = 0; x < r.length;) {
      const ch = r[x]
      let n = 1
      while (x + n < r.length && r[x + n] === ch) n++
      if (ch !== '.') rect.push({ x, y, w: n, c: tavolozza[ch] })
      x += n
    }
  })
  return { w: righe[0].length, h: righe.length, rect }
}

// il vecchio minatore: elmetto di cuoio con la candela, barba bianca, piccone in spalla
export const MINATORE = pixel([
  '................',
  '.......f........',
  '.......c........',
  '.....kkckk......',
  '....khHHhhk.....',
  '...khhhhhhhk....',
  '...kkkkkkkkk.M..',
  '....kssssk..mMm.',
  '....kesesk...g..',
  '....kSwwSk..g...',
  '...kwwwwwwk.g...',
  '...kwwWwwwkg....',
  '..kbkwwwwkbgk...',
  '..kbbkwwkbbsk...',
  '.kbbbbkkbbbk....',
  '.kbsbbbbbbBk....',
  '.ksskbbbbBkk....',
  '..kk.kppppk.....',
  '.....kpkkpk.....',
  '.....kpk.kpk....',
  '....kook.kook...',
  '....kkkk.kkkk...',
], { k: '#2a1d17', h: '#7a4a2a', H: '#a8703f', c: '#f2e6c8', f: '#ffcf4a', s: '#e0a77c', S: '#c4855e',
     w: '#f1ede4', W: '#c9c3b8', b: '#4f6b8a', B: '#3a4f68', p: '#6a543c', o: '#2e2420', g: '#8a5a32',
     m: '#b8c0c8', M: '#7d8790', e: '#2a1d17' })

// l'armaiolo (dati/mercanti.js): testa rasata, barba nera, grembiule di cuoio, il martello in mano
export const ARMAIOLO = pixel([
  '................',
  '................',
  '.....kkkkk......',
  '....kssssSk.....',
  '....ksssssSk....',
  '....kesseSSk....',
  '....kssssssk....',
  '....kbbssbbk....',
  '.....kbbbbk.....',
  '...kkkkbbkkkk...',
  '..kRRRkkkkRRRk..',
  '..kRRkLLLLkRRk..',
  '..kRRkLLLLkRRkmM',
  '..kssLLLLLLkskMM',
  '...kkLLLLLLkkgk.',
  '....kLLLlLLk.g..',
  '....kLLLLLLk.g..',
  '....kLLLLLLk....',
  '.....kppppk.....',
  '.....kpkkpk.....',
  '....kook.kook...',
  '....kkkk.kkkk...',
], { k: '#241a16', s: '#dca27a', S: '#b97e58', e: '#241a16', b: '#2d2522', R: '#a33b2c', L: '#7a4e2c', l: '#5e3b20', p: '#4a3b2e', o: '#2b211c', m: '#c3c9cf', M: '#8d959c', g: '#8a5a32' })

// l'erborista: cappuccio verde, la boccetta in mano e un mazzetto alla cintura
export const ERBORISTA = pixel([
  '................',
  '......kkkk......',
  '.....kGGGGk.....',
  '....kGGggGGk....',
  '....kGrssrGk....',
  '....kGseseGk....',
  '....kGssssGk....',
  '....kGkSSkGk....',
  '...kGGkkkkGGk...',
  '...kGGwwwwGGk...',
  '..kGGkwwwwkGGk..',
  '..kGGkwwwwkGGkk.',
  '..ksskwwwwksskPk',
  '...kkwVwwVwkkPPk',
  '....kwwwwwwk.kk.',
  '....kGGGGGGk....',
  '....kGGGGGGk....',
  '...kGGGGGGGGk...',
  '...kGGgGGgGGk...',
  '....kkkkkkkk....',
  '.....kok.kok....',
  '.....kkk.kkk....',
], { S: '#c98f6a', k: '#1f2a1c', G: '#4f8a4a', g: '#3b6b38', r: '#c0562e', s: '#eab48c', e: '#1f2a1c', w: '#efe6cf', V: '#7cbf4a', P: '#d24fa0', o: '#3a2a20' })

// il rigattiere: cappellaccio a tesa larga, il sacco in spalla pieno di roba
export const RIGATTIERE = pixel([
  '..................',
  '......kkkk........',
  '.....kHHHHk.......',
  '...kkHHHHHHkk.....',
  '..kHHHHHHHHHHk....',
  '...kkssssskk......',
  '....ksesseks.kk...',
  '....kssssssk.kSSk.',
  '....kSnnnnSk.kSSSk',
  '.....kSSSSk..kSSSk',
  '...kkkCCCCkkkkSSk.',
  '..kCCkCCCCkCCkkSk.',
  '..kCCkCCCCkCCk.kk.',
  '..kssCCCCCCkss....',
  '...kkCCCCCCkk.....',
  '....kCCbbCCk......',
  '....kCCCCCCk......',
  '....kppppppk......',
  '.....kpkkpk.......',
  '.....kpk.kpk......',
  '....kook.kook.....',
  '....kkkk.kkkk.....',
], { k: '#221b16', H: '#5a4632', s: '#d79f78', e: '#221b16', n: '#8a6a52', S: '#b99a6a', C: '#6d5a8a', b: '#a8873f', p: '#4e4234', o: '#2b221c' })

// il lucchetto sopra una discesa chiusa: sobrio, ferro e ottone
export const LUCCHETTO = pixel([
  '...kkkk...',
  '..kmMMmk..',
  '..km..mk..',
  '..km..mk..',
  '.kkkkkkkk.',
  '.kGGGGGgk.',
  '.kGgkkGgk.',
  '.kGGkgGgk.',
  '.kggggggk.',
  '.kkkkkkkk.',
], { k: '#1d1714', m: '#c3c9cf', M: '#8d959c', G: '#e8c547', g: '#b48a1f' })

// un sasso del sentiero, con la vena chiara che luccica; il luccichio è a parte, perché si accende e si spegne
export const SASSO = pixel([
  '.kkk..',
  'kNyNk.',
  'knnynk',
  '.kkkk.',
], { k: '#4d463e', n: '#9a9284', N: '#c9c1b2', y: '#f0cf55' })

export const LUCCICHIO = pixel([
  '..y..',
  '.yYy.',
  'yYYYy',
  '.yYy.',
  '..y..',
], { y: '#f0cf55', Y: '#fff6c2' })
