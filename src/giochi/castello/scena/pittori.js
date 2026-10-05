// I pittori del castello: torri e mostri presi dal foglio delle figure,
// accanto a quelli che non sono figure (colpi, piazzole, raggio, bocca:
// grafica/castello/indice.js). Finché il foglio non è decodificato torri
// e mostri non si disegnano: il foglio sta dentro la pagina (un data URL)
// e si decodifica in una frazione di secondo, prima che la prima ondata
// parta — un attimo di campo senza figure costa meno che tenere in piedi
// un secondo castello disegnato a poligoni solo per quell'attimo. Il
// fondale (la carta dipinta) lo fa la pelle, che ha il suo ripiego.
import { PITTORI as SEGNI_E_COLPI, targhe, segnoImmune, corona, statiMostro } from '../../../grafica/castello/indice.js'
import { TORRI, stadioDi } from '../../../data/ops.js'
import { MONDO } from '../../../data/castello.js'
import { COLONNE } from '../../../motore/castello/carta.js'
import { CELLA } from '../dati/vestiti.js'
import { IMMAGINE, PEZZI, CREATURE } from '../dati/figure.js'
import { figuraDi } from './bestiario.js'

export const UNITA = MONDO.W / COLONNE / CELLA

// Il vestito è quello della tappa in corso: lo scrive la pelle
// (`usaVestito`), e lo legge il campo, il nastro e la scheda.
let vestito = 'bosco'
export function usaVestito(nome) { vestito = nome }
export const creaturaDi = bestia => {
  const chi = figuraDi(vestito, bestia)
  return CREATURE.includes(chi) ? chi : CREATURE[0]
}

// le pose dai nomi dei pezzi: mostro:<chi>:<n> è il respiro,
// mostro:<chi>:lato:<n> e …:fronte:<n> i passi
const pose = {}
for (const nome of Object.keys(PEZZI)) {
  const [fam, chi, verso, n] = nome.split(':')
  if (fam !== 'mostro') continue
  const p = (pose[chi] ||= { respiro: [], lato: [], fronte: [] })
  p[n === undefined ? 'respiro' : verso].push(nome)
}

// di lato se va a destra/sinistra, di fronte se scende, il respiro dove i
// passi non ci sono
function serieDi(chi, verso) {
  const p = pose[chi]
  const passi = verso ? p.lato : p.fronte
  if (passi.length) return { serie: passi, passi: true }
  return { serie: p.respiro.length ? p.respiro : p.fronte.length ? p.fronte : p.lato, passi: false }
}

// il ramo conta dallo stadio di mezzo in su; senza ramo (tappe senza rami)
// tiene la sua colonna
export function figuraTorre(tipo, lv, ramo) {
  const aspetto = TORRI[tipo].aspetto
  const stadio = stadioDi(lv)
  const conRamo = `torre:${aspetto}:${stadio}:${stadio ? ramo || '' : ''}`
  return PEZZI[conRamo] ? conRamo : `torre:${aspetto}:${stadio}:`
}

/* ── il foglio ── */
let img = null
let attesa = null
export function caricaFigure() {
  if (attesa) return attesa
  attesa = new Promise((risolvi, rifiuta) => {
    const i = new Image()
    i.onload = () => { img = i; risolvi(i) }
    i.onerror = () => rifiuta(new Error('figure del castello non caricate'))
    i.src = IMMAGINE
  })
  return attesa
}

// una figura col piede in (x, y); `scala` è 1 per tutti tranne il capo e i
// pezzi di chi si è diviso
function figura(ctx, nome, x, y, { specchia = false, scala = 1 } = {}) {
  const [sx, sy, w, h] = PEZZI[nome]
  const lw = w * UNITA * scala, lh = h * UNITA * scala
  if (specchia) {
    ctx.save(); ctx.translate(x, y - lh); ctx.scale(-1, 1)
    ctx.drawImage(img, sx, sy, w, h, -lw / 2, 0, lw, lh); ctx.restore()
  } else ctx.drawImage(img, sx, sy, w, h, x - lw / 2, y - lh, lw, lh)
  return { lw, lh }
}

const PIEDE_TORRE = 22 * UNITA   // sotto il centro della piazzola, così sembra piantata
function torre(p, cosa) {
  if (!img) return
  const { x, y, tipo, lv, ramo, potenziabile, posso } = cosa
  const base = y + PIEDE_TORRE
  p.ellisse(x, base - 1.5 * p.S, 14 * p.S, 4.5 * p.S, '#00000033')
  figura(p.ctx, figuraTorre(tipo, lv, ramo), x, base)
  targhe(p, x, y, lv, potenziabile, posso)
}

const PIEDE_MOSTRO = 8 * UNITA   // un filo sotto la mezzeria, o sembra appeso a metà strada
// i fogli sono disegnati alla misura di un mostro del sotterraneo (grande
// come l'eroe): a misura piena uno scorpione era grande quanto la torre che
// gli spara. A metà misura la strada torna a essere una strada.
const MISURA_MOSTRI = 0.5
function mostro(p, cosa) {
  if (!img) return
  const { x, y, bestia, vita = 1, gelo = 0, vola = false, verso = 0,
          taglia = 1, capo = false, aTerra = false, respinto = 0,
          lampo = 0, male = null, fragile = false } = cosa
  const S = p.S
  const { serie, passi } = serieDi(creaturaDi(bestia), verso)
  // respiro a 5 fotogrammi al secondo, passi a 8; sfasati per posto, così
  // una fila di melme non respira all'unisono
  const n = serie[Math.floor(p.tempo * (passi ? 8 : 5) + x * 0.07 + y * 0.05) % serie.length]
  const piede = y + PIEDE_MOSTRO
  const alto = vola && !aTerra ? -9 * S + Math.sin(p.tempo * 2.6 + x * 0.05) * 2.2 * S : 0
  p.velo(vola ? 0.5 : 1, () => p.ellisse(x, piede - 1 * S, 6 * S * taglia, 2 * S * taglia, '#00000033'))
  const scala = taglia * MISURA_MOSTRI
  if (aTerra) {
    // a terra: stesa di fianco, sbiadita, tre stelline che girano sopra
    // (non è finita, si rialza)
    p.velo(0.55, () => p.in(x, piede - 4 * S, () =>
      figura(p.ctx, n, 0, 0, { scala }), Math.PI / 2))
    const sopra = piede - 4 * S - PEZZI[n][2] * UNITA * scala / 2 - 3 * S
    for (let i = 0; i < 3; i++) {
      const a = p.tempo * 4 + i * 2.09
      p.cerchio(x + Math.cos(a) * 8 * S, sopra + Math.sin(a) * 2.5 * S, 1.6 * S, '#ffe27a')
    }
    return
  }
  // le figure del foglio guardano a destra: chi va a sinistra si specchia
  const { lh } = figura(p.ctx, n, x, piede + alto, { specchia: verso < 0, scala })
  if (gelo > 0) {
    // il gelo: un velo azzurro sul corpo e tre schegge
    const cy = piede + alto - lh * 0.45, r = Math.max(9 * S, lh * 0.45)
    p.velo(0.4, () => p.ellisse(x, cy, r * 0.9, r, '#bfe6ff'))
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * 6.29 + 0.6
      p.figura([[x + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7],
                [x + Math.cos(a + 0.5) * r * 0.95, cy + Math.sin(a + 0.5) * r * 0.95],
                [x + Math.cos(a - 0.3) * r, cy + Math.sin(a - 0.3) * r]], '#e8f7ff')
    }
  }
  statiMostro(p, { x, cy: piede + alto - lh * 0.45, r: Math.max(9 * S, lh * 0.45),
                   lampo, male, fragile, gelo })
  // la barra della vita, ferma anche se il mostro vola (misurata dalla
  // testa senza l'ondeggio)
  const testa = piede + (vola ? -9 * S : 0) - lh
  const sopra = testa - (vola ? 4 : 2.5) * S
  const w = 15 * S * Math.min(taglia, 1.6), q = Math.max(0, Math.min(1, vita))
  p.rett(x - w / 2 - 0.7 * S, sopra - 0.7 * S, w + 1.4 * S, 2.6 * S + 1.4 * S, '#00000055')
  p.rett(x - w / 2, sopra, w * q, 2.6 * S, q > 0.5 ? '#38c172' : q > 0.25 ? '#ffc93c' : '#ff5c7a')
  if (capo) corona(p, x, sopra - 1.5 * S, S)
  segnoImmune(p, x, sopra - (capo ? 8 : 2) * S, respinto)
}

// Ferma o quasi (di fronte se c'è, se no il respiro): la misura la dà il
// fotogramma più grande della serie, così respirando non cambia taglia.
function ritratto(p, cosa) {
  if (!img) return
  const chi = creaturaDi(cosa.bestia)
  const pp = pose[chi]
  const serie = pp.fronte.length ? pp.fronte : pp.respiro.length ? pp.respiro : pp.lato
  const W = Math.max(...serie.map(k => PEZZI[k][2])), H = Math.max(...serie.map(k => PEZZI[k][3]))
  const s = Math.min(p.W, p.H) * 0.94 / Math.max(W, H)
  const [sx, sy, w, h] = PEZZI[serie[Math.floor((p.tempo || 0) * 5) % serie.length]]
  p.ctx.imageSmoothingQuality = 'high'
  p.ctx.drawImage(img, sx, sy, w, h, p.W / 2 - w * s / 2, p.H / 2 + H * s / 2 - h * s, w * s, h * s)
}

// La scala è una per tutte le torri (quella che fa stare la figura più
// grande), non una per figura: se no crescere non si vedrebbe.
let piuGrande = null
function ritrattoTorre(p, cosa) {
  if (!img) return
  if (!piuGrande) {
    const torri = Object.keys(PEZZI).filter(k => k.startsWith('torre:')).map(k => PEZZI[k])
    piuGrande = [Math.max(...torri.map(t => t[2])), Math.max(...torri.map(t => t[3]))]
  }
  const [sx, sy, w, h] = PEZZI[figuraTorre(cosa.tipo, cosa.lv, cosa.ramo)]
  const s = Math.min(p.W * 0.94 / piuGrande[0], p.H * 0.94 / piuGrande[1])
  p.ctx.imageSmoothingQuality = 'high'
  p.ctx.drawImage(img, sx, sy, w, h, p.W / 2 - w * s / 2, p.H * 0.97 - h * s, w * s, h * s)
}

// `pronte` non è un pittore: è la promessa che chi dipinge una volta sola
// (i ritratti) aspetta per ridipingersi a foglio pronto
export const PITTORI = { ...SEGNI_E_COLPI, torre, mostro, ritratto, ritrattoTorre,
                         pronte: () => caricaFigure() }
