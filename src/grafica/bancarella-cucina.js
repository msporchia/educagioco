/* I disegni della cucina, in codice: il fornello con la pentola, il piatto, il
   mazzo di spaghetti. Stringhe SVG. Vedi docs/bancarella/cucina.md. */
const ACQUA = { vuota: '#b9dcef', cuoce: '#9fd0ea', pronta: '#f4e3a1', scotta: '#b98a4e' }

function spaghetti(x, y, largo, colore = '#f2cf6b') {
  let g = ''
  for (let i = 0; i < 5; i++)
    g += `<path d="M${x - largo / 2 + i * largo / 5} ${y}q${largo / 6} ${-8 - i % 2 * 5} ${largo / 3} 0t${largo / 3} 0" fill="none" stroke="${colore}" stroke-width="4" stroke-linecap="round"/>`
  return g
}

/* Scatola 200×170: il piano, la fiamma se c'è qualcosa sul fuoco, la pentola. */
export function disegnaFornello(fase) {
  const accesa = fase === 'cuoce' || fase === 'pronta'
  const fiamma = accesa ? [60, 80, 100, 120, 140].map(x =>
    `<path class="fiamma" d="M${x} 148c-9-9-3-17 0-24c3 7 9 15 0 24z" fill="#ff8a2b"/><path d="M${x} 148c-4-5-1-9 0-12c1 3 4 7 0 12z" fill="#ffd257"/>`).join('') : ''
  return `<rect x="16" y="146" width="168" height="20" rx="6" fill="#4c5056"/><rect x="42" y="140" width="116" height="9" rx="4" fill="#2c2f33"/>${fiamma}` +
    `<rect x="14" y="66" width="16" height="9" rx="4" fill="#6f767d"/><rect x="170" y="66" width="16" height="9" rx="4" fill="#6f767d"/>` +
    `<path d="M28 52h144l-9 76a12 12 0 0 1-12 11H49a12 12 0 0 1-12-11z" fill="#aab3bb"/><path d="M28 52h144l-2 16H30z" fill="#ccd3d9"/>` +
    `<ellipse cx="100" cy="53" rx="72" ry="15" fill="#7f8891"/><ellipse cx="100" cy="55" rx="65" ry="11" fill="${ACQUA[fase]}"/>` +
    (fase === 'vuota' ? '' : spaghetti(100, 57, 84, fase === 'scotta' ? '#8a5a2a' : '#f2cf6b'))
}

export const FIGURA_PASTA = `<rect x="16" y="10" width="68" height="80" rx="9" fill="#2f6fb5"/><rect x="24" y="24" width="52" height="30" rx="5" fill="#fffdf7"/>` +
  [32, 40, 48, 56, 64].map(x => `<path d="M${x} 28v22" stroke="#e8b84a" stroke-width="3" stroke-linecap="round"/>`).join('')

export const FIGURA_PIATTO = cose => `<ellipse cx="60" cy="48" rx="56" ry="34" fill="#dfe3e6"/><ellipse cx="60" cy="44" rx="56" ry="34" fill="#fffdf7"/>` +
  `<ellipse cx="60" cy="44" rx="39" ry="22" fill="#eef1f3"/>` + (cose === 'pasta' ? spaghetti(60, 46, 58) + spaghetti(60, 38, 44) : '')
