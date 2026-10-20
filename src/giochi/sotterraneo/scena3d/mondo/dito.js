// Il dito sul mondo di sopra (puro). La regola dell'utente: una persona vince sul prato. Il bersaglio di una persona è il suo
// rettangolo a schermo allargato ad almeno 72×96 px; un tocco sul terreno entro una cella e mezza dal suo piede è un tocco su di
// lei. L'ordine: prima le persone, poi i posti (ingressi, pietre, il portale, le grate), poi le cose (cartello, bacheca), poi il
// terreno. Gli elementi HTML sopra la tela (viste/Mondo3d.vue) usano questi rettangoli; la tela, per il tocco che cade fuori.
// docs/sotterraneo/terra-di-sopra.md, «Il mondo in 3D».

export const SCARTO_DITO = 16              // px: sotto, il dito è fermo (docs/core/il-dito.md)
export const PERSONA = { largo: 72, alto: 96 }
export const VICINO_AL_PIEDE = 1.5         // celle: un tocco sul prato qui attorno è un tocco sulla persona
export const PRIORITA = { persona: 0, posto: 1, cosa: 2 }

// il rettangolo di una figura a schermo, dai piedi (px, py) e dalla testa (tx, ty): allargato al minimo, coi piedi dentro
export function rettangoloPersona(px, py, tx, ty, { largo = PERSONA.largo, alto = PERSONA.alto } = {}) {
  const h = Math.max(alto, Math.abs(py - ty) + 16), w = Math.max(largo, h * 0.55)
  const cx = (px + tx) / 2, giu = py + 10
  return { x: cx - w / 2, y: giu - h, w, h }
}
// Le persone vicine a schermo (il villaggio visto intero, dove stanno a tre celle l'una dall'altra) avrebbero i rettangoli uno sopra
// l'altro, e il tocco andrebbe a chi sta sopra nel DOM: due rettangoli che si toccano si dividono a metà fra i due piedi, così ognuno
// prende il suo lato (più stretto dei 72 px, ma di nessun altro). `l`: [{ r, px }] col piede a schermo `px`; cambia i rettangoli
export function spartisciPersone(l) {
  const s = l.filter(q => q.r).sort((a, b) => a.px - b.px)
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
    const a = s[i].r, b = s[j].r
    if (b.x >= a.x + a.w) continue
    if (b.y >= a.y + a.h || a.y >= b.y + b.h) continue
    const m = (s[i].px + s[j].px) / 2
    if (a.x + a.w > m) a.w = Math.max(8, m - a.x)
    if (b.x < m) { b.w = Math.max(8, b.x + b.w - m); b.x = m }
  }
  return l
}
// il rettangolo di un posto: attorno ai punti dati (gli angoli del lotto a terra e la cima), con un margine
export function rettangoloPosto(punti, margine = 8) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const [x, y] of punti) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
  const w = Math.max(56, x1 - x0 + 2 * margine), h = Math.max(56, y1 - y0 + 2 * margine)
  return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h }
}
const dentro = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h

// cosa sta sotto il dito: `bersagli` [{ chiave, tipo: 'persona' | 'posto' | 'cosa', r: { x, y, w, h } }]. Vince la priorità più
// alta, e a pari priorità il centro più vicino
export function sceltaDelTocco(p, bersagli) {
  let meglio = null, voto = Infinity
  for (const b of bersagli) {
    if (!b.r || !dentro(p, b.r)) continue
    const d = Math.hypot(p.x - (b.r.x + b.r.w / 2), p.y - (b.r.y + b.r.h / 2))
    const v = (PRIORITA[b.tipo] ?? 3) * 10000 + d
    if (v < voto) { voto = v; meglio = b }
  }
  return meglio
}
// il tocco sul prato vicino ai piedi di qualcuno: `persone` [{ chiave, piede: { x, y } }], `punto` in celle
export function personaVicina(punto, persone, raggio = VICINO_AL_PIEDE) {
  let meglio = null, d0 = raggio
  for (const q of persone) {
    const d = Math.hypot(punto.x - (q.piede.x + 0.5), punto.z - (q.piede.y + 0.5))
    if (d <= d0) { d0 = d; meglio = q }
  }
  return meglio
}

// dal raggio del dito (origine e verso, nel mondo) al punto del terreno: si cammina lungo il raggio finché si va sotto il suolo
// (`suolo(x, z)`, l'acqua compresa), poi si stringe. Null se il raggio non tocca terra
export function aTerra(o, d, suolo, { lungo = 900, passo = 0.4 } = {}) {
  let a = 0, b = 0
  for (let t = 0; t < lungo; t += passo) { if (o.y + d.y * t < suolo(o.x + d.x * t, o.z + d.z * t)) { b = t; break } a = t }
  if (!b) return null
  for (let i = 0; i < 10; i++) { const t = (a + b) / 2; if (o.y + d.y * t < suolo(o.x + d.x * t, o.z + d.z * t)) b = t; else a = t }
  return { x: o.x + d.x * b, z: o.z + d.z * b }
}
