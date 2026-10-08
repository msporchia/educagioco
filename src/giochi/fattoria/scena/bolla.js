/* Dove stanno i gettoni attorno a una cosa toccata: su un semicerchio sopra, come in Hay Day, sotto se
   in cima non ci sta; quelli che non ci stanno vanno alla pagina dopo (la freccia la mette Gioco.vue).
   Puro: lo usano la tela per disegnarli e Gioco.vue per sapere quale ha preso il dito, e devono dire
   la stessa cosa — vedi docs/fattoria/come-si-tocca.md («I gettoni»). */

// Il diametro di un gettone a schermo: compare solo dopo un tocco, quindi può essere grande (e il
// minimo per un dito, 44 px, resta lontano).
export const LATO_GETTONE = 60
const PASSO = 1.14        // da un centro all'altro lungo l'arco, in gettoni
const MARGINE = 6

// Il raggio più piccolo (la cosa sta dentro l'arco) e il più grande (l'arco sta nello schermo).
function raggi({ raggio, L, lato }) {
  const minimo = Math.max(lato * 1.3, raggio + lato * .62)
  const massimo = Math.max(minimo, (L - 2 * MARGINE - lato) / 2)
  return { minimo, massimo }
}

// Quanti gettoni ci stanno su mezzo cerchio largo quanto lo schermo: oltre, si va a pagina.
export function quantiNeStanno({ raggio = 0, L, lato = LATO_GETTONE }) {
  const { massimo } = raggi({ raggio, L, lato })
  return Math.max(2, Math.floor(Math.PI * massimo / (lato * PASSO)) + 1)
}

// n gettoni attorno a una cosa col centro in (cx, cy) e grande `raggio`, in pixel schermo.
export function disponiGettoni(n, { cx, cy, raggio = 0, L, A, lato = LATO_GETTONE }) {
  if (!n) return { sotto: false, punti: [] }
  const passo = lato * PASSO
  const { minimo, massimo } = raggi({ raggio, L, lato })
  // Pochi gettoni stanno stretti in cima; tanti aprono l'arco fino a mezzo cerchio, poi lo allargano.
  const r = Math.min(massimo, Math.max(minimo, (n - 1) * passo / Math.PI))
  const ampiezza = Math.min(Math.PI, (n - 1) * passo / r)
  // verso -1 è l'arco di sopra, 1 quello di sotto; da sinistra a destra in tutti e due.
  const prova = verso => Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0 : i / (n - 1) - .5
    const ang = verso * Math.PI / 2 - verso * t * ampiezza
    return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r }
  })
  let punti = prova(-1)
  let sotto = false
  if (Math.min(...punti.map(p => p.y)) - lato / 2 < MARGINE) {
    const giu = prova(1)
    // sotto solo se lì ci sta davvero; se no si resta sopra, spinti dentro lo schermo
    if (Math.max(...giu.map(p => p.y)) + lato / 2 <= A - MARGINE) { punti = giu; sotto = true }
  }
  // L'arco si sposta tutto insieme dentro lo schermo: tagliato a metà non si legge.
  const x0 = Math.min(...punti.map(p => p.x)), x1 = Math.max(...punti.map(p => p.x))
  const dx = x0 - lato / 2 < MARGINE ? MARGINE + lato / 2 - x0
    : x1 + lato / 2 > L - MARGINE ? L - MARGINE - lato / 2 - x1 : 0
  const dy = sotto ? 0 : Math.max(0, MARGINE + lato / 2 - Math.min(...punti.map(p => p.y)))
  return { sotto, punti: punti.map(p => ({ x: Math.round(p.x + dx), y: Math.round(p.y + dy) })) }
}

// La fila di una macchina: dischetti in riga sotto di lei, centrati su x e dentro lo schermo.
export const LATO_POSTO = 38
export function disponiFila(n, { x, y, L }) {
  const passo = LATO_POSTO + 8
  const tot = (n - 1) * passo
  const x0 = Math.max(MARGINE + LATO_POSTO / 2,
                      Math.min(L - MARGINE - LATO_POSTO / 2 - tot, x - tot / 2))
  return Array.from({ length: n }, (_, i) => ({ x: Math.round(x0 + i * passo), y: Math.round(y) }))
}

// Il gettone (o il posto) sotto il dito, con un po' di margine: l'indice nella lista, o -1.
export function gettoneSotto(punti, x, y, lato = LATO_GETTONE) {
  let meglio = -1, d = Infinity
  punti.forEach((p, i) => {
    const q = Math.hypot(p.x - x, p.y - y)
    if (q <= lato * 0.62 && q < d) { d = q; meglio = i }
  })
  return meglio
}
