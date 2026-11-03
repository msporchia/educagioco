// Il sesso e l'aspetto dell'eroe (dati/eroi.js) nella forma dell'interfaccia unica (components/personalizza/personalizza-pura.js) e
// ritorno: un posto per scelta, `{ oggetto, forma, colore }`. `-` è «di serie» (il colore o il taglio del modello), che nel salvataggio è null.
// Puro: lo provano le unità (`unita/sotterraneo-personaggio`).
const id = v => (v && v !== '-' ? v : null)

/** Dal salvataggio (sesso, aspetto) ai valori dei quattro posti: chi, pelle, capelli (taglio e colore), barba. */
export function valoriDellAspetto(sesso, aspetto) {
  const a = aspetto || {}
  return {
    chi: { oggetto: sesso, forma: null, colore: null },
    pelle: { oggetto: 'pelle', forma: null, colore: a.pelle || '-' },
    capelli: { oggetto: 'capelli', forma: a.taglio || '-', colore: a.capelli || '-' },
    barba: { oggetto: 'barba', forma: a.barba || '-', colore: null },
  }
}

/** Il contrario: dai valori al sesso e all'aspetto da scrivere (quello che manca resta `sesso`, e l'aspetto di serie). */
export function aspettoDeiValori(stato, sesso) {
  const s = stato || {}, v = k => s[k] || {}
  return {
    sesso: v('chi').oggetto === 'm' || v('chi').oggetto === 'f' ? v('chi').oggetto : sesso,
    aspetto: { pelle: id(v('pelle').colore), capelli: id(v('capelli').colore), taglio: id(v('capelli').forma), barba: id(v('barba').forma) },
  }
}
