// Le creature dipinte: le prende in prestito dal foglio delle figure del
// castello (già nel file unico, non costa un byte) e, per la vespa e il
// fungo, dall'atlante del sotterraneo. Lo scenario cambia la faccia, mai
// il mostro: una melma è sempre lenta e molle, nella neve è rosa.
// Vedi docs/survivors/grafica.md.
import { IMMAGINE, PEZZI as FIGURE } from '../../castello/dati/figure.js'
import { ATLANTE, PEZZI as SOTTO } from '../../sotterraneo/dati/atlante.js'

// mostro di Survivors → figura per scenario (`_` per tutti gli altri);
// `sot:` è un pezzo dell'atlante del sotterraneo
export const BESTIARIO = {
  melma:       { _: 'melma', grotta: 'melma-viola', notte: 'melma-viola', neve: 'melma-rosa', deserto: 'melma-rosa' },
  pipistrello: { _: 'pipistrello', grotta: 'occhio', notte: 'pipistrello-occhio', neve: 'pipistrello-occhio' },
  moscerino:   { _: 'sot:vespa', grotta: 'spirito-fuoco' },
  fungo:       { _: 'sot:fungo', grotta: 'pianta', deserto: 'pianta' },
  ragno:       { _: 'ragno', neve: 'scorpione', deserto: 'scorpione', grotta: 'granchio' },
  spettro:     { _: 'fantasma-azzurro', notte: 'fantasma', grotta: 'teschio-azzurro', neve: 'teschio-azzurro' },
  cinghiale:   { _: 'cinghiale', bosco: 'lupo', notte: 'lupo', grotta: 'bestia-cornuta' },
  roccia:      { _: 'golem-pietra', palude: 'golem', neve: 'tartaruga', deserto: 'tartaruga', grotta: 'golem-magma' },
  colosso:     { _: 'troll', neve: 'golem-ghiaccio', grotta: 'golem-lava', notte: 'ombra', deserto: 'golem' },
}

// chi vola sta sollevato e ha l'ombra piccola
const VOLANO = new Set(['pipistrello', 'pipistrello-occhio', 'occhio', 'fantasma', 'fantasma-azzurro',
  'spirito-fuoco', 'teschio-azzurro', 'sot:vespa'])

// quanto è grande la figura rispetto al cerchio che il motore usa per
// colpire: un po' più del diametro, perché i fogli hanno aria intorno
const GRANDEZZA = 2.7

export const figuraDi = (scenario, tipo) => {
  const b = BESTIARIO[tipo] || BESTIARIO.melma
  return b[scenario] || b._
}

/* ── le pose: respiro, passi di lato, passi di fronte ── */
const POSE = {}
for (const nome of Object.keys(FIGURE)) {
  const [fam, chi, verso, n] = nome.split(':')
  if (fam !== 'mostro') continue
  const p = (POSE[chi] ||= { foglio: 'figure', respiro: [], lato: [], fronte: [] })
  p[n === undefined ? 'respiro' : verso].push(FIGURE[nome])
}
for (const chi of ['vespa', 'fungo']) {
  const serie = Object.keys(SOTTO).filter(k => k.startsWith(`${chi}-fermo-`)).sort().map(k => SOTTO[k])
  if (serie.length) POSE[`sot:${chi}`] = { foglio: 'sotto', respiro: serie, lato: [], fronte: [] }
}
for (const p of Object.values(POSE)) {
  const tutte = [...p.respiro, ...p.lato, ...p.fronte]
  p.area = Math.sqrt(Math.max(...tutte.map(r => r[2])) * Math.max(...tutte.map(r => r[3])))
}
export const esiste = chi => !!POSE[chi]

/* ── i fogli ── */
const fogli = {}
let attesa = null
export function caricaFigure() {
  if (attesa) return attesa
  const uno = (nome, src) => new Promise(risolvi => {
    const i = new Image()
    i.onload = () => { fogli[nome] = i; risolvi() }
    i.onerror = () => risolvi()                  // senza foglio si disegna il ripiego
    i.src = src
  })
  attesa = Promise.all([uno('figure', IMMAGINE), uno('sotto', ATLANTE)])
  return attesa
}
export const figurePronte = () => !!fogli.figure

/* una tela di lavoro per i colori sopra la figura (il lampo bianco della
   botta, l'azzurro del gelo): si colora una copia, non il foglio */
let lavoro = null
function tinta(img, r, colore, quanto) {
  if (!lavoro) lavoro = document.createElement('canvas')
  const [sx, sy, w, h] = r
  if (lavoro.width < w) lavoro.width = w
  if (lavoro.height < h) lavoro.height = h
  const c = lavoro.getContext('2d')
  c.clearRect(0, 0, w, h)
  c.globalCompositeOperation = 'source-over'
  c.globalAlpha = 1
  c.drawImage(img, sx, sy, w, h, 0, 0, w, h)
  c.globalCompositeOperation = 'source-atop'
  c.globalAlpha = quanto
  c.fillStyle = colore
  c.fillRect(0, 0, w, h)
  c.globalAlpha = 1
  c.globalCompositeOperation = 'source-over'
  return lavoro
}

// Quale fotogramma, e come: di lato se va più di traverso che in giù,
// di fronte se scende, il respiro dove i passi non ci sono.
function scegli(p, vx, vy, t) {
  let serie = p.respiro, passi = false
  if (p.lato.length && (Math.abs(vx) > Math.abs(vy) * 0.7 || vy < 0)) { serie = p.lato; passi = true }
  else if (p.fronte.length && vy >= 0) { serie = p.fronte; passi = true }
  if (!serie.length) serie = p.lato.length ? p.lato : p.fronte
  return { r: serie[Math.floor(t * (passi ? 9 : 5)) % serie.length], passi }
}

// La figura di un mostro col centro del cerchio in (x, y). Torna false
// se il foglio non c'è ancora: chi chiama disegna il ripiego.
// `bianco` 0..1 è il lampo della botta, `gelo` 0..1 il velo azzurro,
// `schiaccia` deforma (la morte), `alfa` la sbiadisce.
export function disegnaFigura(ctx, chi, { x, y, r, vx = 0, vy = 1, t = 0, bianco = 0, gelo = 0,
                                         schiaccia = 0, alfa = 1, ombra = true }) {
  const p = POSE[chi]
  const img = p && fogli[p.foglio]
  if (!img) return false
  const { r: rett } = scegli(p, vx, vy, t)
  const vola = VOLANO.has(chi)
  const s = GRANDEZZA * r / p.area
  const w = rett[2] * s, h = rett[3] * s
  const su = vola ? r * 0.9 + Math.sin(t * 2.6) * r * 0.15 : 0
  const piede = y + r * 0.85
  if (ombra) {
    ctx.globalAlpha = alfa * (vola ? 0.18 : 0.28)
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.ellipse(x, piede, Math.min(w * 0.42, r * 1.3) * (vola ? 0.7 : 1), r * 0.32, 0, 0, 6.29)
    ctx.fill()
  }
  ctx.globalAlpha = alfa
  ctx.save()
  ctx.translate(x, piede - su)
  if (vx < 0) ctx.scale(-1, 1)
  if (schiaccia) ctx.scale(1 + schiaccia * 0.6, 1 - schiaccia * 0.75)
  const sorgente = bianco > 0.05 ? tinta(img, rett, '#ffffff', Math.min(1, bianco))
    : gelo > 0 ? tinta(img, rett, '#7fd4ff', 0.45 * gelo) : null
  if (sorgente) ctx.drawImage(sorgente, 0, 0, rett[2], rett[3], -w / 2, -h, w, h)
  else ctx.drawImage(img, rett[0], rett[1], rett[2], rett[3], -w / 2, -h, w, h)
  ctx.restore()
  ctx.globalAlpha = 1
  return { w, h, testa: piede - su - h }
}

/* ── l'eroe: l'elfa del sotterraneo, che corre e respira ──
   È l'ultimo pezzo del vecchio set 0x72: quando arriva un eroe generato
   apposta prende il suo posto qui, e nient'altro cambia */
const EROE = 'elfa'
const serieEroe = posa => Object.keys(SOTTO).filter(k => k.startsWith(`${EROE}-${posa}-`)).sort().map(k => SOTTO[k])
const CORSA = serieEroe('corsa'), FERMO = serieEroe('fermo')
const ALTEZZA_EROE = 46        // in punti di mondo: un filo più alta della melma

// col piede in (x, y); torna false se l'atlante non c'è ancora
export function disegnaEroe(ctx, { x, y, fermo, passi = 0, t = 0, guarda = 1, alfa = 1 }) {
  const img = fogli.sotto
  if (!img || !CORSA.length) return false
  const serie = fermo || !CORSA.length ? FERMO : CORSA
  const r = fermo ? serie[Math.floor(t * 6) % serie.length] : serie[Math.floor(passi / 14) % serie.length]
  const s = ALTEZZA_EROE / r[3]
  const w = r[2] * s, h = r[3] * s
  ctx.globalAlpha = alfa
  ctx.save()
  ctx.translate(x, y)
  if (guarda < 0) ctx.scale(-1, 1)
  ctx.drawImage(img, r[0], r[1], r[2], r[3], -w / 2, -h, w, h)
  ctx.restore()
  ctx.globalAlpha = 1
  return true
}
