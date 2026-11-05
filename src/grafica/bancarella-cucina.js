/* I disegni della cucina, in codice: le stazioni, il piatto, la scatola della
   pasta. Stringhe SVG, scatola 200×170. Vedi docs/bancarella/cucina.md. */
const ACQUA = { vuota: '#b9dcef', cuoce: '#9fd0ea', pronta: '#f4e3a1', scotta: '#b98a4e' }

function spaghetti(x, y, largo, colore = '#f2cf6b') {
  let g = ''
  for (let i = 0; i < 5; i++)
    g += `<path d="M${x - largo / 2 + i * largo / 5} ${y}q${largo / 6} ${-8 - i % 2 * 5} ${largo / 3} 0t${largo / 3} 0" fill="none" stroke="${colore}" stroke-width="4" stroke-linecap="round"/>`
  return g
}

const fuoco = accesa => `<rect x="16" y="146" width="168" height="20" rx="6" fill="#4c5056"/><rect x="42" y="140" width="116" height="9" rx="4" fill="#2c2f33"/>` +
  (accesa ? [60, 80, 100, 120, 140].map(x =>
    `<path class="fiamma" d="M${x} 148c-9-9-3-17 0-24c3 7 9 15 0 24z" fill="#ff8a2b"/><path d="M${x} 148c-4-5-1-9 0-12c1 3 4 7 0 12z" fill="#ffd257"/>`).join('') : '')

function pentola(fase) {
  return fuoco(fase === 'cuoce' || fase === 'pronta') +
    `<rect x="14" y="66" width="16" height="9" rx="4" fill="#6f767d"/><rect x="170" y="66" width="16" height="9" rx="4" fill="#6f767d"/>` +
    `<path d="M28 52h144l-9 76a12 12 0 0 1-12 11H49a12 12 0 0 1-12-11z" fill="#aab3bb"/><path d="M28 52h144l-2 16H30z" fill="#ccd3d9"/>` +
    `<ellipse cx="100" cy="53" rx="72" ry="15" fill="#7f8891"/><ellipse cx="100" cy="55" rx="65" ry="11" fill="${ACQUA[fase]}"/>` +
    (fase === 'vuota' ? '' : spaghetti(100, 57, 84, fase === 'scotta' ? '#8a5a2a' : '#f2cf6b'))
}

const padella = fase => fuoco(fase === 'cuoce' || fase === 'pronta') +
  `<rect x="150" y="96" width="50" height="11" rx="5" fill="#5b3a26"/><ellipse cx="84" cy="112" rx="74" ry="24" fill="#33363a"/>` +
  `<ellipse cx="84" cy="104" rx="74" ry="24" fill="#4a4e54"/><ellipse cx="84" cy="104" rx="62" ry="18" fill="#2c2f33"/>`

const forno = fase => `<rect x="14" y="10" width="172" height="154" rx="12" fill="#8f979e"/><rect x="14" y="10" width="172" height="26" rx="10" fill="#b2b9bf"/>` +
  [44, 100, 156].map(x => `<circle cx="${x}" cy="23" r="7" fill="#4c5056"/>`).join('') +
  `<rect x="32" y="52" width="136" height="96" rx="9" fill="${fase === 'cuoce' || fase === 'pronta' ? '#ffb45c' : fase === 'scotta' ? '#6d3b24' : '#3b3f44'}"/>` +
  `<rect x="32" y="52" width="136" height="96" rx="9" fill="none" stroke="#5f666d" stroke-width="5"/>`

const tagliere = () => `<rect x="12" y="62" width="176" height="96" rx="16" fill="#c99a63"/><rect x="12" y="62" width="176" height="86" rx="16" fill="#dcb27f"/>` +
  `<path d="M34 84h132M34 106h132M34 128h132" stroke="#c99a63" stroke-width="3"/><circle cx="170" cy="78" r="6" fill="#a97b48"/>`

export const disegnaStazione = (nome, fase) =>
  (nome === 'padella' ? padella(fase) : nome === 'forno' ? forno(fase) : nome === 'tagliere' ? tagliere() : pentola(fase))

export const FIGURA_PASTA = `<rect x="16" y="10" width="68" height="80" rx="9" fill="#2f6fb5"/><rect x="24" y="24" width="52" height="30" rx="5" fill="#fffdf7"/>` +
  [32, 40, 48, 56, 64].map(x => `<path d="M${x} 28v22" stroke="#e8b84a" stroke-width="3" stroke-linecap="round"/>`).join('')

export const FIGURA_PIATTO = conPasta => `<ellipse cx="60" cy="48" rx="56" ry="34" fill="#dfe3e6"/><ellipse cx="60" cy="44" rx="56" ry="34" fill="#fffdf7"/>` +
  `<ellipse cx="60" cy="44" rx="39" ry="22" fill="#eef1f3"/>` + (conPasta ? spaghetti(60, 46, 58) + spaghetti(60, 38, 44) : '')
