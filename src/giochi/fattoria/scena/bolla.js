/* Dove stanno i gettoni attorno a una cosa toccata: ad arco sopra, come in Hay Day, sotto se in cima
   non ci stanno. Puro: lo usano la tela per disegnarli e Gioco.vue per sapere quale ha preso il dito,
   e devono dire la stessa cosa — vedi docs/fattoria/come-si-tocca.md («I gettoni»). */

// Il diametro di un gettone a schermo: 46 px stanno sopra i 44 che chiedono Android e iOS.
export const LATO_GETTONE = 46
// Quanti ne stanno sul primo arco; gli altri vanno su un arco più largo.
const PER_ARCO = 6
const AMPIEZZA_MAX = Math.PI * 0.85
const MARGINE = 6

// sopra/sotto: i centri dei due possibili archi (la cima e il fondo della cosa, in pixel schermo).
export function disponiGettoni(n, { cx, cima, fondo, L, A, lato = LATO_GETTONE }) {
  const archi = []
  for (let i = 0; i < n; i += PER_ARCO) archi.push(Math.min(PER_ARCO, n - i))
  const prova = verso => {
    const punti = []
    archi.forEach((k, a) => {
      // Abbastanza largo che due vicini non si tocchino, mai più stretto di un gettone e mezzo.
      const passo = lato * 1.14
      const ampiezza = Math.min(AMPIEZZA_MAX, (k - 1) * 0.62)
      const r = Math.max(lato * 1.25 + a * lato * 1.12,
                         k > 1 ? passo * (k - 1) / ampiezza : 0)
      for (let i = 0; i < k; i++) {
        const t = k === 1 ? 0 : i / (k - 1) - 0.5
        const ang = (verso < 0 ? -Math.PI / 2 : Math.PI / 2) + t * ampiezza * (verso < 0 ? 1 : -1)
        const y0 = verso < 0 ? cima : fondo
        punti.push({ x: cx + Math.cos(ang) * r, y: y0 + Math.sin(ang) * r * 0.82 })
      }
    })
    return punti
  }
  let punti = prova(-1)
  let sotto = false
  if (punti.some(p => p.y - lato / 2 < MARGINE)) {
    const giu = prova(1)
    // sotto solo se lì ci sta davvero; se no si resta sopra, schiacciati contro il bordo
    if (!giu.some(p => p.y + lato / 2 > A - MARGINE)) { punti = giu; sotto = true }
  }
  // Il gruppo si sposta tutto insieme dentro lo schermo: un arco tagliato a metà non si legge.
  const x0 = Math.min(...punti.map(p => p.x)), x1 = Math.max(...punti.map(p => p.x))
  const dx = x0 - lato / 2 < MARGINE ? MARGINE + lato / 2 - x0
    : x1 + lato / 2 > L - MARGINE ? L - MARGINE - lato / 2 - x1 : 0
  const dy = sotto ? 0 : Math.max(0, MARGINE + lato / 2 - Math.min(...punti.map(p => p.y)))
  return { sotto, punti: punti.map(p => ({ x: Math.round(p.x + dx), y: Math.round(p.y + dy) })) }
}

// Il gettone sotto il dito, con un po' di margine: l'indice nella lista, o -1.
export function gettoneSotto(punti, x, y, lato = LATO_GETTONE) {
  let meglio = -1, d = Infinity
  punti.forEach((p, i) => {
    const q = Math.hypot(p.x - x, p.y - y)
    if (q <= lato * 0.62 && q < d) { d = q; meglio = i }
  })
  return meglio
}
