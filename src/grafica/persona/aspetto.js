// L'aspetto di una persona disegnata in 3D, in comune fra la fattoria (il contadino: `giochi/fattoria3d/dati/abiti.js`) e il sotterraneo
// (gli eroi: `giochi/sotterraneo/scena3d/eroi3d/eroi.js`, docs/sotterraneo/personaggio.md): i toni della pelle e i colori dei capelli.
// Dato puro, senza three: i colori sono numeri 0xRRGGBB, `css` è lo stesso colore per le tele. Una miglioria qui (un tono in più, un
// colore più bello) arriva in entrambi i giochi. `prezzo`: i colori di fantasia si pagano dove un gioco ha un prezzo da chiedere; chi non
// ne ha li dà tutti o li salta (`soloNaturali`). Gli id non si rinominano: stanno nei salvataggi.

const css = c => '#' + c.toString(16).padStart(6, '0')
const con = (o, extra = {}) => ({ ...o, css: css(o.c), ...extra })

export const PELLI = [
  con({ id: 'chiara', nome: 'Chiara', c: 0xf8d8bc }), con({ id: 'dorata', nome: 'Dorata', c: 0xf5c9a2 }),
  con({ id: 'ambra', nome: 'Ambra', c: 0xd9a272 }), con({ id: 'bruna', nome: 'Bruna', c: 0xa8754a }),
  con({ id: 'scura', nome: 'Scura', c: 0x6e4630 }),
]

// il colore dei capelli, senza il taglio: la fattoria lo abbina allo stile (corti, trecce, coda, caschetto), il sotterraneo al modello
export const COLORI_CAPELLI = [
  con({ id: 'castani', nome: 'Castani', c: 0x6b4423 }), con({ id: 'neri', nome: 'Neri', c: 0x2a2220 }),
  con({ id: 'biondi', nome: 'Biondi', c: 0xd8b050 }), con({ id: 'rossi', nome: 'Rossi', c: 0xb8502a }),
  con({ id: 'grigi', nome: 'Grigi', c: 0xb8bcc6 }), con({ id: 'bianchi', nome: 'Bianchi', c: 0xeeeaf2 }),
  con({ id: 'blu', nome: 'Blu', c: 0x3d78d8, fantasia: true }), con({ id: 'verdi', nome: 'Verdi', c: 0x4aa84a, fantasia: true }),
  con({ id: 'rosa', nome: 'Rosa', c: 0xe86f9a, fantasia: true }), con({ id: 'azzurri', nome: 'Azzurri', c: 0x4aa8d8, fantasia: true }),
  con({ id: 'viola', nome: 'Viola', c: 0x8a4aa8, fantasia: true }),
]

export const pelleDi = id => PELLI.find(p => p.id === id) || null
export const capelliDi = id => COLORI_CAPELLI.find(c => c.id === id) || null
export const soloNaturali = () => COLORI_CAPELLI.filter(c => !c.fantasia)

// un colore più scuro o più chiaro dello stesso tono (k < 1 scurisce, k > 1 schiarisce): l'ombra dei capelli, la guancia, il naso
export function sfuma(c, k) {
  const r = Math.min(255, Math.round(((c >> 16) & 255) * k)), g = Math.min(255, Math.round(((c >> 8) & 255) * k)), b = Math.min(255, Math.round((c & 255) * k))
  return (r << 16) | (g << 8) | b
}

export function guastiDellAspetto() {
  const g = []
  for (const [nome, lista] of [['pelle', PELLI], ['capelli', COLORI_CAPELLI]]) {
    const viste = new Set()
    for (const o of lista) {
      if (!/^[a-z]+$/.test(o.id)) g.push(`${nome}/${o.id}: id da minuscole`)
      if (viste.has(o.id)) g.push(`${nome}: due voci "${o.id}"`)
      viste.add(o.id)
      if (!o.nome || !Number.isInteger(o.c) || o.c < 0 || o.c > 0xffffff) g.push(`${nome}/${o.id}: nome o colore storto`)
    }
  }
  return g
}
