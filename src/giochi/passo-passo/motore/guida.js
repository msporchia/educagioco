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

// la guida richiamata col ? (docs/core/come-si-gioca.md): lo stesso giro su qualunque livello, finché arriva alla tana.
// Qui la riga si mostra (ha la ✕): le frecce sono tante, quindi solo l'anello, senza manine
export const FRECCE = '.pp-passo[data-freccia]'
export function guidaDelLivello({ vinto = false, fermo = false, ripeti = false, conScatola = false, fila = [], provato = false,
                                  cambiato = false, sbattuto = false, fermoPrima = false }) {
  if (vinto) return { dove: null, fine: true, testo: 'Così si gioca: le frecce in fila, poi ▶. Se sbaglia, cambia la fila.' }
  if (fermo) return null
  if (ripeti && !conScatola) return guidaDelRipeti({})
  if (!fila.length) return { dove: FRECCE, testo: 'Tocca le frecce: ognuna è un passo da quella parte.' }
  if (!provato || cambiato) return { dove: BERSAGLI.via, mano: true, testo: 'Premi ▶ e guarda dove arriva.' }
  if (sbattuto) return { dove: BERSAGLI.togli, mano: true, testo: 'Quella freccia lo fa sbattere: toglila.' }
  if (fermoPrima) return { dove: FRECCE, testo: 'Si è fermato prima della tana: aggiungi altre frecce.' }
  return { dove: FRECCE, testo: 'Non è arrivato alla tana: cambia le frecce e premi ▶ di nuovo.' }
}
