// Il segno di ogni tana del mondo di sopra (puro, senza three): quali oggetti stanno attorno al suo cuore, per famiglia di habitat. Dove
// stanno lo decide props-dove.js (passo «le tane»), le forme sono in props-aperto.js; il perché in
// docs/sotterraneo/mondo-3d.md, «La tana». Ogni riga: [tipo, raggio in celle dal cuore, angolo in gradi dal giro della tana, giro],
// dove `giro` è un numero (radianti, più l'angolo della riga), `'tang'` (lungo il cerchio) o `'centro'` (la faccia verso il cuore).

// l'habitat del luogo → la famiglia del segno
export const FAMIGLIA_DI = {
  campi: 'prato', prato: 'prato', frutteto: 'prato', cimitero: 'prato', rovine: 'prato',
  bosco: 'bosco', foresta: 'bosco', secco: 'bosco',
  brughiera: 'brughiera', palude: 'palude', lago: 'palude', ceneri: 'ceneri', monte: 'monte', roccia: 'monte', landa: 'landa',
}
const arco = (tipo, r, da, n, giro) => Array.from({ length: n }, (_, i) => [tipo, r, da + (360 / n) * i, giro])
export const RICETTE = {
  // un focolare spento: cenere e un filo di fumo, il cerchio di sassi, ossa sparse
  prato: [['cenereTana', 0, 0, 0], ...arco('sassiTana', 2.3, 18, 5, 'tang'), ['ossaTana', 1.5, 40, 0.4], ['teschio', 1.7, 150, 0], ['ossaTana', 2.9, 200, 2.1], ['ossaTana', 1.3, 290, 1]],
  // ragnatele e bozzoli fra rami secchi, tutto attorno
  bosco: [...arco('bozzoliTesi', 2.6, 0, 3, 'centro'), ['bozzolo', 1.8, 60, 0], ['bozzolo', 1.7, 200, 0.5], ['ossaTana', 1.4, 300, 0.8]],
  // pietre erette in cerchio, ossa fra l'erica
  brughiera: [...arco('menhir', 2.6, 18, 5, 0), ['ossaTana', 1.2, 0, 0.3], ['ossaTana', 2.0, 54, 1.4], ['teschio', 1.6, 200, 0]],
  // un nido di fango, canne spezzate, pozze
  palude: [['nidoFango', 1.6, 30, 'centro'], ...arco('canneSpezzate', 2.7, 60, 4, 0), ['pozza', 2.0, 200, 0], ['pozza', 2.4, 330, 0.5], ['ossaTana', 1.2, 270, 0.2]],
  // terra bruciata, braci accese, ossa
  ceneri: [['braciTana', 0, 0, 0], ['crepaTana', 1.8, 20, 0], ['crepaTana', 2.0, 200, 0.7], ['ossaTana', 1.4, 110, 0.4], ['ossaTana', 2.4, 300, 1.9], ['trave', 2.6, 60, 0.5], ['trave', 2.6, 250, 2.2], ['rocciaTana', 2.9, 160, 0]],
  // carcasse di bestie e un mucchio di pietre
  monte: [['carcassa', 2.0, 30, 0.6], ['carcassa', 2.5, 210, 2.4], ['mucchio', 2.6, 120, 0], ['cairn', 2.9, 300, 0], ['cairn', 1.9, 330, 0], ['ossaTana', 1.2, 300, 0.9], ['ossaTana', 1.5, 170, 0.2]],
  // croci storte e ossa sulla landa
  landa: [['crepaTana', 0, 0, 0], ...arco('croceStorta', 2.4, 20, 4, 'centro'), ['ossaTana', 1.3, 60, 0.9], ['ossaTana', 1.8, 200, 1.7], ['teschio', 1.9, 130, 0], ['cairn', 2.9, 310, 0]],
}
// in più, per habitat, dove la famiglia non basta
export const IN_PIU = {
  cimitero: [['croceStorta', 3.0, 54, 'centro']],
  rovine: [['macerieTana', 3.0, 54, 0.4]],
}
export const ricettaDi = habitat => {
  const f = FAMIGLIA_DI[habitat]
  return f ? [...RICETTE[f], ...(IN_PIU[habitat] || [])] : null
}

// La macchia di terra smossa attorno al cuore di ogni tana (per il terreno): quanto vale la cella (x, y), da 0 a 1, un cerchio di 3–4
// celle dal bordo storto (il caso è della tana). Vale per tutte le tane della pianta, anche delle zone non caricate: si vede da lontano
const MACCHIE = new WeakMap()
export function forzaDellaTana(m, x, y) {
  let g = MACCHIE.get(m)
  if (!g) {
    g = new Map()
    for (const R of m.regioni) {
      if (!R.tana || !ricettaDi(R.habitat)) continue
      const f1 = (R.tana.x * 7 + R.tana.y * 3) % 6.28, f2 = (R.tana.x * 5 + R.tana.y * 11) % 6.28
      for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
        const d = Math.hypot(i, j), a = Math.atan2(j, i), raggio = 3.7 + 0.5 * Math.sin(a * 3 + f1) + 0.3 * Math.sin(a * 5 + f2)
        if (d >= raggio) continue
        const k = (R.tana.y + j) * m.W + R.tana.x + i, f = 1 - d / raggio
        g.set(k, Math.max(g.get(k) || 0, f))
      }
    }
    MACCHIE.set(m, g)
  }
  return g.get(y * m.W + x) || 0
}
