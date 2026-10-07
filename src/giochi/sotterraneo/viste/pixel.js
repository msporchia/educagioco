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

// il cartello di divieto piantato davanti a una discesa chiusa: un paletto di legno e un disco rosso con la barra
// bianca, come i divieti veri
export const DIVIETO = pixel([
  '....kkkk....',
  '..kkrRRRkk..',
  '.krRRRRRRRk.',
  '.kRRRRRRRRk.',
  'krRRRRRRRRRk',
  'kRwwwwwwwwRk',
  'kRwwwwwwwwRk',
  'kRRRRRRRRRRk',
  '.kRRRRRRRRk.',
  '.kRRRRRRRRk.',
  '..kkRRRRkk..',
  '....kkkk....',
  '....kPpk....',
  '....kPpk....',
  '....kPpk....',
  '....kPpk....',
  '....kPpk....',
  '...kkPpkk...',
  '..kkkkkkkk..',
], { k: '#241812', R: '#c8281e', r: '#ea5a45', w: '#f6efe0', P: '#b27a45', p: '#7d5230' })

/* chi dà le missioni (dati/missioni.js): figure provvisorie come il minatore, finché l'atlante non ha
   `<nome>-fermo-0` (il prompt dei personaggi nella scheda PROMPT-terra-di-sopra.md) */

// la ragazza del pozzo: fazzoletto rosso in testa, le trecce, il grembiule, il secchio in mano
export const RAGAZZA = pixel([
  '................',
  '......kkkk......',
  '.....kRRRRk.....',
  '....kRRrRRRk....',
  '....khssssh.....',
  '...kkhesesh.....',
  '..kh.ksssskh....',
  '..kh..kSSk.hk...',
  '..k..kBBBBk.k...',
  '....kBwwwwBk....',
  '...kBBwwwwBBk...',
  '...ksBwwwwBsk...',
  '...kskwwwwkskk..',
  '....kBwwwwBkMMk.',
  '....kBBBBBBkmmk.',
  '...kBBBBBBBBkk..',
  '...kBBBBBBBBk...',
  '....kkkkkkkk....',
  '.....kss.ssk....',
  '.....kss.ssk....',
  '....kook.kook...',
  '....kkkk.kkkk...',
], { k: '#2a1b1a', R: '#c8352e', r: '#e8645a', h: '#8a5a2b', s: '#eab38c', S: '#c98f6a', e: '#2a1b1a',
     B: '#5a7fb4', w: '#f2ead8', M: '#9aa3ab', m: '#6b737a', o: '#4a3326' })

// il mugnaio: berretto bianco, tutto infarinato, un sacco di farina in spalla
export const MUGNAIO = pixel([
  '................',
  '......kkkk......',
  '.....kWWWWk.....',
  '....kWWWWWWk....',
  '....kkssssk.....',
  '....kseesk..kk..',
  '....kssssk.kTTk.',
  '....ksbbsk.kTTTk',
  '.....kbbk..kTTTk',
  '...kkWWWWkkkTTk.',
  '..kWWkWWWWkWWkk.',
  '..kWWkWWWWkWWk..',
  '..kssWWWWWWkss..',
  '...kkWwWWwWkk...',
  '....kWWWWWWk....',
  '....kWWWWWWk....',
  '....kppppppk....',
  '.....kpkkpk.....',
  '.....kpk.kpk....',
  '.....kpk.kpk....',
  '....kook.kook...',
  '....kkkk.kkkk...',
], { k: '#2b2420', W: '#ebe6da', w: '#c9c2b2', s: '#e3a982', e: '#2b2420', b: '#a8a39a', T: '#d8c79a',
     p: '#7a6a55', o: '#3b2e24' })

// l'eremita dell'altare: saio grigio col cappuccio, la barba lunga, il bastone
export const EREMITA = pixel([
  '..............g.',
  '......kkkk....g.',
  '.....kGGGGk...g.',
  '....kGGggGGk..g.',
  '....kGssssGk..g.',
  '....kGseseGk..g.',
  '....kGwwwwGk..g.',
  '...kGGwwwwGGk.g.',
  '...kGkwwwwkGkkg.',
  '..kGGkwwwwkGGsg.',
  '..kGGGkwwkGGGkg.',
  '..kGGGGkkGGGGkg.',
  '..ksGGGGGGGGk.g.',
  '...kGGGGGGGGk.g.',
  '...kGGGGGGGGk.g.',
  '...kGGGgGGGGk.g.',
  '...kGGGgGGGGk.g.',
  '...kGGGgGGGGk.g.',
  '....kGGgGGGk..g.',
  '....kkkkkkkk..g.',
  '.....kok.kok..g.',
  '.....kkk.kkk..g.',
], { k: '#22201f', G: '#8b8680', g: '#6a6560', s: '#d9a27e', e: '#22201f', w: '#eeeae2', o: '#3a2f27' })

// la guardia della torre: elmo col pennacchio, la cotta di maglia, la lancia
export const GUARDIA = pixel([
  '.....RR.......M.',
  '......R......MmM',
  '.....kkkk.....g.',
  '....kMMMMk....g.',
  '....kMmmMMk...g.',
  '....kssssk....g.',
  '....kseesk....g.',
  '....kssssk....g.',
  '.....kSSk.....g.',
  '...kkCCCCkk...g.',
  '..kCCkCCCCkCCkg.',
  '..kCCkRRRRkCCsk.',
  '..kCCkRRRRkCkkg.',
  '..kssCRRRRCk..g.',
  '...kkCCCCCCk..g.',
  '....kCCbbCCk..g.',
  '....kppppppk..g.',
  '.....kpkkpk...g.',
  '.....kpk.kpk..g.',
  '.....kpk.kpk..g.',
  '....kook.kook.g.',
  '....kkkk.kkkk...',
], { k: '#1f1d22', R: '#a82a2a', M: '#b9c0c6', m: '#7f878e', s: '#dca47c', S: '#ba8460', e: '#1f1d22',
     C: '#8d9399', b: '#6b4a2a', p: '#4b4038', o: '#2a221c', g: '#8a5a32' })

// il pescatore dello stagno: cappellaccio di paglia, la canna sulla spalla col filo che pende
export const PESCATORE = pixel([
  '.............g..',
  '............g.l.',
  '.....kkkkk.g..l.',
  '...kkYYYYYkk..l.',
  '..kYYYyyYYYYk.l.',
  '...kkssssskk..l.',
  '....kseesk.g..l.',
  '....kssssk.g..l.',
  '....kSnnSk.g..L.',
  '...kkBBBBkkg....',
  '..kBBkBBBBkBBk..',
  '..kBBkBBBBkBsk..',
  '..kBBkbbbbkBkk..',
  '..kssBBBBBBk....',
  '...kkBBBBBBk....',
  '....kBBBBBBk....',
  '....kWWWWWWk....',
  '.....kWkkWk.....',
  '.....kWk.kWk....',
  '.....kWk.kWk....',
  '....kook.kook...',
  '....kkkk.kkkk...',
], { k: '#22201c', Y: '#d8b85a', y: '#b8963f', s: '#e0a77c', S: '#c4855e', n: '#8a6a52', e: '#22201c',
     B: '#3f6f8f', b: '#2c5168', W: '#6b6250', o: '#3a2a20', g: '#8a5a32', l: '#d8dde0', L: '#c8352e' })

// il boscaiolo: berretto, camicia a quadri rossi, l'ascia appoggiata alla spalla
export const BOSCAIOLO = pixel([
  '................',
  '......kkkk......',
  '.....kGGGGk.....',
  '....kGGGGGGk....',
  '....kkssssk.....',
  '....ksesesk.MM..',
  '....khsssshkMMM.',
  '....khhhhhhkgM..',
  '.....khhhhk.g...',
  '...kkRrRrRkkg...',
  '..kRrkrRrRkRrkg.',
  '..krRkRrRrkrRsk.',
  '..kRrkrRrRkRkk..',
  '..kssRrRrRrk....',
  '...kkrRrRrRk....',
  '....kRrRrRrk....',
  '....kDDDDDDk....',
  '.....kDkkDk.....',
  '.....kDk.kDk....',
  '.....kDk.kDk....',
  '....kook.kook...',
  '....kkkk.kkkk...',
], { k: '#241a14', G: '#3f6b3a', s: '#dca27a', e: '#241a14', h: '#6a4428', R: '#b8322a', r: '#7a1f1a',
     M: '#b9c0c6', g: '#8a5a32', D: '#3d4a5e', o: '#2b211c' })
