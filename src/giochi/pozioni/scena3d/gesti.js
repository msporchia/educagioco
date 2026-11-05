// I gesti del banco: un attrezzo arrivato a bersaglio non fa niente da solo, lo
// muove il dito. Qui si riconosce cosa disegna: punti in pixel, niente three.js
// e niente tempo di parete. Le regole in docs/pozioni/gesti.md.

const SCATTO = 22               // px: tanto bisogna tornare indietro perché sia un colpo
const PASSETTO = 8              // px: sotto, il verso del dito è solo tremolio
const STORTO = 1.4              // rad: una svolta più secca non è un giro, è uno zig-zag
const PIEGA = 70                // px: di lato fin qui, l'attrezzo è piegato del tutto
export const VERSA_DA = 0.55    // quanto va piegato perché esca qualcosa

// `freccia`: il disegno del suggerimento (frecce.js). `quanti`: giri, colpi, secondi di versata
export const GESTI = {
  'mestolo:calderone': { tipo: 'giro', quanti: 2, freccia: 'giro' },
  'pestello:mortaio': { tipo: 'colpi', asse: 'y', quanti: 5, freccia: 'su-giu' },
  'coltello:tagliere': { tipo: 'colpi', asse: 'y', quanti: 5, freccia: 'su-giu' },
  'fiammifero:legna': { tipo: 'colpi', asse: 'x', quanti: 5, freccia: 'lato' },
  'mantice:legna': { tipo: 'colpi', asse: 'y', quanti: 3, freccia: 'su-giu' },
  'roba:grattugia': { tipo: 'colpi', asse: 'y', quanti: 5, freccia: 'su-giu' },
  'bacchetta:calderone': { tipo: 'agita', quanti: 6, freccia: 'agita' },
  'brocca:calderone': { tipo: 'inclina', quanti: 0.9, freccia: 'inclina' },
  'mortaio:calderone': { tipo: 'inclina', quanti: 0.9, freccia: 'inclina' },
  'tagliere:calderone': { tipo: 'inclina', quanti: 0.9, freccia: 'inclina' },
  'sale:calderone': { tipo: 'colpi', asse: 'y', quanti: 3, freccia: 'su-giu' },
  'pepe:calderone': { tipo: 'colpi', asse: 'y', quanti: 3, freccia: 'su-giu' },
  'fiala:calderone': { tipo: 'inclina', quanti: 0.9, freccia: 'inclina' },
}

// avanti e indietro lungo un asse: dice quando il dito torna indietro
function svolte(asse) {
  let estremo = null, verso = 0
  return (x, y) => {
    const v = asse === 'x' ? x : y
    if (estremo === null) { estremo = v; return 0 }
    const d = v - estremo
    if (!verso) { if (Math.abs(d) >= SCATTO / 2) { verso = Math.sign(d); estremo = v } return 0 }
    if (d * verso > 0) { estremo = v; return 0 }
    if (Math.abs(d) < SCATTO) return 0
    const era = verso
    verso = -verso; estremo = v
    return era
  }
}

// giù, cioè y che cresce: il pestello picchia arrivando in fondo, non tornando su
function colpi({ asse, quanti }) {
  const svolta = svolte(asse)
  let n = 0
  return {
    punto(x, y) {
      const s = svolta(x, y), colpo = asse === 'x' ? s !== 0 : s > 0
      if (colpo) n++
      return { colpo }
    },
    get avanzato() { return Math.min(1, n / quanti) },
  }
}

// il dito che scuote, in qualunque direzione
function agita({ quanti }) {
  const lato = svolte('x'), alto = svolte('y')
  let n = 0
  return {
    punto(x, y) {
      const colpo = (lato(x, y) !== 0) | (alto(x, y) !== 0)
      n += colpo
      return { colpo: !!colpo }
    },
    get avanzato() { return Math.min(1, n / quanti) },
  }
}

// si conta quanto gira il verso del dito, non attorno a che cosa: un cerchio storto o
// fuori centro vale uguale, e uno zig-zag si annulla da sé
function giro({ quanti }) {
  let ultimo = null, verso = null, angolo = 0, quarti = 0
  return {
    punto(x, y) {
      if (!ultimo) { ultimo = [x, y]; return { colpo: false } }
      const dx = x - ultimo[0], dy = y - ultimo[1]
      if (Math.hypot(dx, dy) < PASSETTO) return { colpo: false }
      ultimo = [x, y]
      const a = Math.atan2(dy, dx)
      if (verso !== null) {
        const d = Math.atan2(Math.sin(a - verso), Math.cos(a - verso))
        if (Math.abs(d) < STORTO) angolo += d
      }
      verso = a
      const q = Math.floor(Math.abs(angolo) / (Math.PI / 2)), colpo = q > quarti
      quarti = Math.max(quarti, q)
      return { colpo }
    },
    get avanzato() { return Math.min(1, Math.abs(angolo) / (Math.PI * 2 * quanti)) },
  }
}

// di lato si piega, e finché è piegato versa: il tempo arriva da `scorre`
function inclina({ quanti }) {
  let da = null, tempo = 0
  const g = {
    piega: 0,
    punto(x) {
      if (da === null) da = x
      g.piega = Math.max(-1, Math.min(1, (x - da) / PIEGA))
      return { colpo: false }
    },
    scorre(dt) { if (Math.abs(g.piega) >= VERSA_DA) tempo += dt },
    get avanzato() { return Math.min(1, tempo / quanti) },
  }
  return g
}

const TIPI = { colpi, agita, giro, inclina }
export const creaGesto = spec => TIPI[spec.tipo](spec)
