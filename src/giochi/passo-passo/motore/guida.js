// La guida della prima volta: dove mettere il dito, letto da quello che c'è a
// schermo. Chi gioca qui non legge ancora, quindi conta la manina (`mano`); la
// frase serve ai grandi e ai test. Pura: si prova in test/unita/passo-passo.
// Il resto è comune a tutti i giochi: giochi/guida.js, docs/core/guida.md.

export const BERSAGLI = {
  destra: '[data-freccia="destra"]',
  via: '[data-azione="via"]',
  togli: '[data-azione="cancella"]',
  ripeti: '[data-carta="ripeti"]',
}

// il primo prato: una freccia, ▶, e se il coniglio si ferma prima ancora frecce
export function guidaDelPrato({ fila = [], fermo = false, provato = false, cambiato = false,
                               sbattuto = false, fermoPrima = false }) {
  if (fermo) return null
  if (!fila.length) return { dove: BERSAGLI.destra, mano: true, testo: 'Tocca →: il coniglio fa un passo a destra.' }
  if (!provato || cambiato) return { dove: BERSAGLI.via, mano: true, testo: 'Premi ▶ e guarda dove arriva.' }
  if (sbattuto) return { dove: BERSAGLI.togli, mano: true, testo: 'Quella freccia lo fa sbattere: toglila.' }
  if (fermoPrima) return { dove: BERSAGLI.destra, mano: true, testo: 'Si è fermato prima della tana: aggiungi altre frecce.' }
  return null
}

// la prima tappa dello zaino: 🔁, finché nella fila non c'è una scatola
export function guidaDelRipeti({ fermo = false, conScatola = false }) {
  if (fermo || conScatola) return null
  return { dove: BERSAGLI.ripeti, mano: true, testo: 'Tocca 🔁: ripete le frecce che ci metti dentro.' }
}
