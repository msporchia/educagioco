// Le scene delle copertine: forme piatte su un viewBox 200×160, colorate col
// `disegno` della copertina, lasciando libero il mezzo per l'icona. Niente
// di giallo in un angolo: sembrava il pallino di una notifica. Vedi
// docs/core/home.md («Le copertine»).
const cerchi = (l, k) => l.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k}"/>`).join('')

export const SCENE = {
  stelle: k => cerchi([[20, 22, 2.6], [48, 60, 1.6], [30, 118, 1.6], [90, 16, 1.6], [124, 30, 2.6], [178, 88, 1.6],
    [150, 132, 1.6], [70, 144, 2.6], [186, 22, 1.6], [10, 80, 1.6], [168, 54, 2.6], [104, 150, 1.6]], '#fff') +
    `<circle cx="30" cy="136" r="16" fill="${k}"/><circle cx="24" cy="130" r="4" fill="#ffffff22"/>`,
  colline: k => `<ellipse cx="40" cy="178" rx="120" ry="62" fill="${k}"/><ellipse cx="180" cy="190" rx="110" ry="58" fill="${k}" opacity=".7"/>`,
  tenda: k => Array.from({ length: 8 }, (_, i) => {
    const f = i % 2 ? '#fff' : k
    return `<rect x="${i * 25}" y="0" width="25" height="30" fill="${f}"/><circle cx="${i * 25 + 12.5}" cy="30" r="12.5" fill="${f}"/>`
  }).join(''),
  bolle: k => cerchi([[24, 130, 12], [46, 96, 7], [30, 60, 5], [172, 120, 14], [156, 74, 8], [180, 40, 5], [100, 24, 6]], k),
  onde: k => `<path d="M0 120 Q25 106 50 120 T100 120 T150 120 T200 120 V160 H0Z" fill="${k}"/>` +
    `<path d="M0 140 Q25 128 50 140 T100 140 T150 140 T200 140 V160 H0Z" fill="#fff" opacity=".35"/>`,
  griglia: k => {
    let s = ''
    for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++)
      if ((i + j) % 2 === 0) s += `<rect x="${i * 24 - 4}" y="${j * 24 - 4}" width="18" height="18" rx="4" fill="${k}"/>`
    return s
  },
  grotta: k => `<path d="M0 0 H200 V160 H160 Q160 70 100 70 Q40 70 40 160 H0Z" fill="${k}"/>` +
    [20, 60, 110, 150, 184].map(x => `<path d="M${x - 8} 0 L${x} 26 L${x + 8} 0Z" fill="${k}"/>`).join(''),
  // il castello: cielo con due nuvole, e le mura merlate in basso
  mura: k => `<ellipse cx="34" cy="28" rx="22" ry="8" fill="#fff" opacity=".5"/><ellipse cx="160" cy="44" rx="18" ry="6" fill="#fff" opacity=".4"/>` +
    `<rect x="0" y="122" width="200" height="38" fill="${k}"/>` +
    Array.from({ length: 7 }, (_, i) => `<rect x="${i * 30 + 2}" y="108" width="18" height="16" fill="${k}"/>`).join(''),
  // Conta: il recinto sul prato
  staccionata: k => `<rect x="0" y="138" width="200" height="22" fill="#8cc66b"/>` +
    `<rect x="0" y="116" width="200" height="6" fill="${k}"/><rect x="0" y="130" width="200" height="6" fill="${k}"/>` +
    Array.from({ length: 8 }, (_, i) => `<path d="M${i * 28 + 4} 146 V106 L${i * 28 + 10} 98 L${i * 28 + 16} 106 V146Z" fill="${k}"/>`).join(''),
  // Passo passo: le caselle del tabellone che girano attorno
  caselle: k => {
    const p = [[6, 132], [32, 132], [58, 132], [84, 132], [110, 132], [136, 132], [162, 132], [6, 106], [6, 80], [174, 106], [174, 80], [174, 54]]
    return p.map(([x, y]) => `<rect x="${x}" y="${y}" width="20" height="20" rx="4" fill="${k}"/>`).join('')
  },
  // il costruttore: le piste della scheda del robot
  circuito: k => ['M0 30 H36 L56 50 H76', 'M200 118 H156 L136 138 H108', 'M24 160 V132 L44 112', 'M176 0 V22 L156 42', 'M0 92 H18 L30 104']
    .map(d => `<path d="${d}" fill="none" stroke="${k}" stroke-width="4" stroke-linejoin="round"/>`).join('') +
    cerchi([[76, 50, 5], [108, 138, 5], [44, 112, 5], [156, 42, 5], [30, 104, 5]], k) +
    `<rect x="150" y="70" width="34" height="22" rx="3" fill="${k}"/>`,
  // Survivors: il bosco di notte
  alberi: k => cerchi([[30, 20, 1.6], [70, 34, 2], [118, 16, 1.6], [150, 30, 1.6], [186, 14, 2]], '#ffffff99') +
    [[8, 70], [30, 50], [52, 64], [148, 58], [170, 44], [192, 66]].map(([x, h]) =>
      `<path d="M${x - 16} 160 L${x} ${160 - h - 40} L${x + 16} 160Z" fill="${k}"/>`).join(''),
}
