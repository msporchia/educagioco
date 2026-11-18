// Survivors limitato da fuori (docs/survivors/scuola.md): puro, gira in Node. A casa `limite` manca e niente di qui cambia.

// `{ domande }` con `prossima()` (il `pescatore` della scuola), o niente
export const limiteDi = l => (typeof l?.domande?.prossima === 'function' ? l : null)

// la domanda che paga una carta: col limite quella dopo dell'esercizio, a casa la scelta di casa col prezzo della carta
export const domandaDellaCarta = (lim, carta, evita, diCasa) =>
  lim ? lim.domande.prossima() : diCasa({ difficolta: carta.prezzo, evita })

// la partita della scuola: la Sopravvivenza senza fine, ma sul prato. A scuola il terreno è quello disegnato di ripiego
// (senza i fogli del castello) e al buio della notte gli ostacoli piatti non si vedrebbero
export const liberaDelLimite = libero => ({ ...libero, scenario: 'prato' })
