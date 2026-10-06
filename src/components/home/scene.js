// Le scene delle copertine: forme piatte su un viewBox 200×160, colorate col
// `disegno` della copertina. Vedi docs/core/home.md («Le copertine»).
export const SCENE = {
  stelle: k => [[20, 22], [48, 60], [30, 120], [90, 18], [120, 48], [178, 92], [150, 130], [70, 140], [186, 20], [10, 80]]
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.6 : 2.6}" fill="#fff"/>`).join('') +
    `<circle cx="162" cy="38" r="20" fill="${k}"/><ellipse cx="162" cy="38" rx="32" ry="7" fill="none" stroke="#ffcf3f" stroke-width="3"/>`,
  colline: k => `<circle cx="164" cy="34" r="15" fill="#ffe066"/><ellipse cx="40" cy="178" rx="120" ry="62" fill="${k}"/>` +
    `<ellipse cx="180" cy="190" rx="110" ry="58" fill="${k}" opacity=".7"/>`,
  tenda: k => Array.from({ length: 8 }, (_, i) => {
    const f = i % 2 ? '#fff' : k
    return `<rect x="${i * 25}" y="0" width="25" height="30" fill="${f}"/><circle cx="${i * 25 + 12.5}" cy="30" r="12.5" fill="${f}"/>`
  }).join(''),
  bolle: k => [[24, 130, 12], [46, 96, 7], [30, 60, 5], [172, 120, 14], [156, 74, 8], [180, 40, 5], [100, 24, 6]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k}"/>`).join(''),
  onde: k => `<path d="M0 120 Q25 106 50 120 T100 120 T150 120 T200 120 V160 H0Z" fill="${k}"/>` +
    `<path d="M0 140 Q25 128 50 140 T100 140 T150 140 T200 140 V160 H0Z" fill="#fff" opacity=".35"/>`,
  griglia: k => {
    let s = ''
    for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++)
      if ((i + j) % 2 === 0) s += `<rect x="${i * 24 - 4}" y="${j * 24 - 4}" width="18" height="18" rx="4" fill="${k}"/>`
    return s
  },
  mattoni: k => {
    let s = ''
    for (let j = 0; j < 7; j++) for (let i = -1; i < 6; i++)
      if (j > 3 || i === -1 || i === 4) s += `<rect x="${i * 40 + (j % 2) * 20}" y="${j * 24}" width="36" height="20" rx="3" fill="${k}"/>`
    return s
  },
  grotta: k => `<path d="M0 0 H200 V160 H160 Q160 70 100 70 Q40 70 40 160 H0Z" fill="${k}"/>` +
    [20, 60, 110, 150, 184].map(x => `<path d="M${x - 8} 0 L${x} 26 L${x + 8} 0Z" fill="${k}"/>`).join(''),
}
