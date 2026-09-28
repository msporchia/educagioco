// Vita, attacco, difesa dell'eroe e le due formule dello scontro: vedi
// COMBATTIMENTO.md (il patto mostri-duri-bottino-migliore, le due formule).

// 3 e 3: il minimo con cui la sottrazione dice ancora qualcosa (con 2/1
// il primo potenziamento raddoppierebbe il danno). La vita è il budget di
// un piano intero, non di uno scontro: tarata dal banco, non a occhio.
export const BASE = { vita: 46, attacco: 3, difesa: 3 }

// crescita permanente per tappa già fatta (da campagne.dungeon.tappa, niente
// migrazione). L'attacco cresce più della difesa: deve inseguire la vita dei
// mostri, la difesa no o sbagliare smetterebbe di costare.
export const CRESCITA = { vita: 6, attacco: 0.7, difesa: 0.5 }

export const GRAFFIO = 1   // quanto costa uno scambio anche quando lo vinci

export function statisticheBase(tappeFatte = 0) {
  const n = Math.max(0, tappeFatte)
  return {
    vita: BASE.vita + Math.round(CRESCITA.vita * n),
    attacco: BASE.attacco + Math.round(CRESCITA.attacco * n),
    difesa: BASE.difesa + Math.round(CRESCITA.difesa * n),
  }
}

// il minimo di 1: senza, un mostro con difesa più alta del tuo attacco sarebbe immortale
export const colpoDellEroe = (attacco, difesaMostro) =>
  Math.max(1, Math.round(attacco) - Math.round(difesaMostro))

export const colpoDelMostro = (attaccoMostro, difesaEroe) =>
  Math.max(1, Math.round(attaccoMostro) - Math.round(difesaEroe))

// stesso conto usato dal bollino sulla mappa, dal banco e dalla riga a schermo:
// se differissero il bivio sarebbe una bugia
export const scambiPerAbbattere = (vita, attacco, difesaMostro) =>
  Math.max(1, Math.ceil(vita / colpoDellEroe(attacco, difesaMostro)))

export const sbagliCheReggi = (vita, attaccoMostro, difesaEroe) =>
  Math.floor(vita / colpoDelMostro(attaccoMostro, difesaEroe))

export function guastiDellEroe(base = BASE, crescita = CRESCITA, graffio = GRAFFIO) {
  const guasti = []
  for (const campo of ['vita', 'attacco', 'difesa']) {
    if (!(base[campo] > 0)) guasti.push(`l'eroe comincia con ${campo} ${base[campo]}`)
    if (!(crescita[campo] >= 0)) guasti.push(`${campo} cala andando avanti nella campagna`)
  }
  if (!(base.attacco >= 2 && base.difesa >= 2))
    guasti.push('attacco e difesa di partenza troppo bassi: la sottrazione non ha scala')
  if (!(crescita.attacco > crescita.difesa))
    guasti.push('la difesa cresce quanto l\'attacco: sbagliare smetterebbe di costare')
  if (!(graffio >= 1)) guasti.push('senza graffio una discesa lunga non costa niente')
  if (!(graffio < base.attacco)) guasti.push('il graffio è forte quanto un colpo: sbagliare non costa più')
  if (!(base.vita >= 6 * graffio)) guasti.push('si comincia con troppa poca vita per un piano intero')
  return guasti
}
