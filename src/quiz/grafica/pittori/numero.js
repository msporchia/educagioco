// tre modi di FAR VEDERE una quantità: { che:'pallini', quanti, disposizione, seme }, { che:'linea', da, a, segna, tacche }, { che:'barre', decine, unita }. Colori chiari apposta (fondo blu notte). Il "caso" dei pallini sparsi è deterministico da `seme`, mai Math.random: la stessa scena deve ridisegnarsi identica.
import { seminato } from '../../../grafica/tela.js'

const SCRITTA = '#e8edf7'
const ASSE = '#dbe4fb'
const TACCA = '#93a7d6'
const FRECCIA = '#ffd58a'
const PALLINO = '#7fb7ff'
const LUCE = 'rgba(255,255,255,.5)'
const DECINA = '#6fa8ff'
const UNITA = '#ffd58a'
const VUOTO = 'rgba(255,255,255,.12)'

// faccia del dado: riconoscibile a colpo d'occhio (primo gradino); sparsi vanno contati (secondo)
const C = [26, 50, 74]                    // le tre colonne (e righe) del dado
const DADO = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
  7: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [2, 2]],
  8: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
  9: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
}

// sparsi ma non ammucchiati: griglia abbastanza grande, celle mescolate, mai sovrapposti
function sparsi(quanti, seme) {
  const dado = seminato(seme * 7919 + quanti)
  const colonne = Math.ceil(Math.sqrt(quanti))
  const righe = Math.ceil(quanti / colonne)
  const celle = []
  for (let i = 0; i < colonne * righe; i++) celle.push(i)
  for (let i = celle.length - 1; i > 0; i--) {
    const j = Math.floor(dado() * (i + 1))
    ;[celle[i], celle[j]] = [celle[j], celle[i]]
  }
  // scarto dentro la cella: fa sembrare i pallini buttati lì, ma non tanto da farli toccare (si conterebbero come uno)
  const w = 84 / colonne, h = 84 / righe
  const r = Math.min(11, Math.min(w, h) * 0.32)
  const scarto = Math.max(0, (Math.min(w, h) - 2 * r - 1.5) / 2)
  return celle.slice(0, quanti).map(i => ({
    x: 8 + (i % colonne) * w + w / 2 + (dado() - 0.5) * 2 * scarto,
    y: 8 + Math.floor(i / colonne) * h + h / 2 + (dado() - 0.5) * 2 * scarto,
    r,
  }))
}

export function pallini(p, { quanti = 3, disposizione = 'dado', seme = 1 }) {
  const posti = (disposizione === 'dado' && DADO[quanti])
    ? DADO[quanti].map(([c, r]) => ({ x: C[c], y: C[r], r: 11 }))
    : sparsi(quanti, seme)
  for (const q of posti) {
    p.cerchio(q.x, q.y, q.r, PALLINO)
    p.cerchio(q.x - q.r * 0.3, q.y - q.r * 0.3, q.r * 0.3, LUCE)
  }
}

// solo i due capi e la metà sono scritti (undici numeri a due cifre su una riga stretta non si leggono); le tacche invece ci sono tutte, sono loro che si contano
export function linea(p, { da = 0, a = 10, segna = 0, tacche = 10 }) {
  const x0 = 11, x1 = 89, y = 60
  const dove = v => x0 + (v - da) / (a - da || 1) * (x1 - x0)

  p.linea([{ x: x0 - 5, y }, { x: x1 + 5, y }], ASSE, 2.6)

  const meta = (da + a) / 2
  for (let i = 0; i <= tacche; i++) {
    const x = x0 + (i / tacche) * (x1 - x0)
    const grossa = i === 0 || i === tacche || (tacche % 2 === 0 && i === tacche / 2)
    p.linea([{ x, y: y - (grossa ? 6.5 : 3.5) }, { x, y: y + (grossa ? 6.5 : 3.5) }],
      grossa ? ASSE : TACCA, grossa ? 2.4 : 1.4)
  }

  p.testo(String(da), dove(da), y + 18, SCRITTA, 11)
  p.testo(String(a), dove(a), y + 18, SCRITTA, 11)
  if (Number.isInteger(meta) && a - da >= 20) p.testo(String(meta), dove(meta), y + 18, SCRITTA, 11)

  const x = dove(segna) // freccia con l'asta lunga, si veda da lontano
  p.rett(x - 1.7, y - 30, 3.4, 14, FRECCIA)
  p.figura([[x, y - 7], [x - 6.5, y - 19], [x + 6.5, y - 19]], FRECCIA)
}

// il materiale che si tocca a scuola: la colonna incompleta resta disegnata anche vuota, per far vedere che è una decina non finita
export function barre(p, { decine = 3, unita = 0 }) {
  const colonne = decine + (unita > 0 ? 1 : 0)
  const passo = 84 / Math.max(1, colonne)
  const w = Math.max(4, Math.min(13, passo - 3))
  const h = 5.6, gap = 0.9
  const alto = 10 * h + 9 * gap
  const y0 = 50 - alto / 2

  for (let c = 0; c < colonne; c++) {
    const x = 8 + passo * c + (passo - w) / 2
    const piene = c < decine ? 10 : unita
    for (let k = 0; k < 10; k++) {
      const y = y0 + (9 - k) * (h + gap)
      if (k < piene) p.rett(x, y, w, h, c < decine ? DECINA : UNITA)
      else if (c >= decine) p.rett(x, y, w, h, VUOTO)
    }
  }
}

export const PITTORI_NUMERO = { pallini, linea, barre }
