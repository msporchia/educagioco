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

// la prima tappa dello zaino, un passo alla volta: 🔁, quante volte, le frecce dentro la scatola, ▶. Prima diceva solo 🔁 e poi
// ▶, e nessuno spiegava il numero e le frecce da mettere dentro (segnalato dall'utente). `scelta`: la scatola di cui sono aperti
// i numeri; `cursore`: dove entra la prossima carta. Null quando la scatola è pronta e già provata
export function guidaDelRipeti({ fermo = false, fila = [], scelta = null, cursore = null, provato = false, cambiato = false }) {
  if (fermo) return null
  const i = fila.findIndex(t => typeof t === 'string' && t.startsWith('ripeti-'))
  if (scelta != null) return { dove: NUMERI, mano: true, testo: 'Tocca un numero: quante volte ripete quello che c\'è dentro.' }
  if (i < 0) return { dove: BERSAGLI.ripeti, mano: true, testo: 'Tocca 🔁: è una scatola che ripete le frecce che ci metti dentro.' }
  if (fila[i] === 'ripeti-N') return { dove: `[data-testa="${i}"]`, mano: true, testo: 'Tocca la N della scatola e scegli quante volte ripete.' }
  if (fila[i + 1] === 'fine') {
    if (cursore === i + 1) return { dove: FRECCE, testo: 'Ora le frecce da ripetere: entrano dentro la scatola.' }
    return { dove: `[data-bocca="${i + 1}"]`, mano: true, testo: 'Tocca il + nella scatola: le frecce che metti lì si ripetono.' }
  }
  if (!provato || cambiato) return { dove: BERSAGLI.via, mano: true, testo: 'Premi ▶: la scatola fa le sue frecce tante volte quante dice il numero.' }
  return null
}
// i numeri della scatola, sotto il campo (viste/Campo.vue)
export const NUMERI = '[data-scelta-volte]'

// la guida richiamata col ? (docs/core/come-si-gioca.md): lo stesso giro su qualunque livello, finché arriva alla tana.
// Qui la riga si mostra (ha la ✕): le frecce sono tante, quindi solo l'anello, senza manine
export const FRECCE = '.pp-passo[data-freccia]'
export function guidaDelLivello({ vinto = false, fermo = false, ripeti = false, conScatola = false, fila = [], provato = false,
                                  cambiato = false, sbattuto = false, fermoPrima = false, scelta = null, cursore = null }) {
  if (vinto) return { dove: null, fine: true, testo: 'Così si gioca: le frecce in fila, poi ▶. Se sbaglia, cambia la fila.' }
  if (fermo) return null
  if (ripeti && !conScatola) return guidaDelRipeti({ scelta })
  if (ripeti) { const r = guidaDelRipeti({ fila, scelta, cursore, provato, cambiato }); if (r) return r }
  if (!fila.length) return { dove: FRECCE, testo: 'Tocca le frecce: ognuna è un passo da quella parte.' }
  if (!provato || cambiato) return { dove: BERSAGLI.via, mano: true, testo: 'Premi ▶ e guarda dove arriva.' }
  if (sbattuto) return { dove: BERSAGLI.togli, mano: true, testo: 'Quella freccia lo fa sbattere: toglila.' }
  if (fermoPrima) return { dove: FRECCE, testo: 'Si è fermato prima della tana: aggiungi altre frecce.' }
  return { dove: FRECCE, testo: 'Non è arrivato alla tana: cambia le frecce e premi ▶ di nuovo.' }
}
