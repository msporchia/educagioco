// Lo stop dello scontro quando l'eroe rischia di cadere (docs/sotterraneo/pericolo.md). Una funzione pura: dopo un
// colpo del mostro dice se è il momento di fermarsi un attimo, e per quale ragione. Gira in Node (unita/sotterraneo-pericolo).

// quanti colpi pieni (quelli che arrivano sbagliando) bastano a farlo cadere, perché ci si fermi: due
export const COLPI_PER_CADERE = 2
// o la vita scesa sotto questa quota del massimo, qualunque sia il mostro
export const QUOTA_POCA_VITA = 0.3
// in tutto, in uno scontro: una volta alla prima soglia e, solo se si è scelto di continuare, un'ultima volta
// quando basta un colpo pieno
export const FERMATE_PER_SCONTRO = 2

/* `vita` quella di adesso (dopo il colpo), `male` il colpo pieno del mostro (`Corsa.danno`), `fermate` quante volte
   questo scontro si è già fermato. Torna null (si continua a domandare) oppure la ragione:
   - 'duro'   altri due colpi pieni lo farebbero cadere
   - 'poca'   la vita è sotto il 30% del massimo
   - 'ultimo' (solo alla seconda fermata) un colpo pieno basta a farlo cadere */
export function pericoloDi({ vita, vitaMax, male, fermate = 0 }) {
  if (vita <= 0 || fermate >= FERMATE_PER_SCONTRO) return null
  if (fermate > 0) return vita <= male ? 'ultimo' : null
  if (vita <= COLPI_PER_CADERE * male) return 'duro'
  if (vita < QUOTA_POCA_VITA * vitaMax) return 'poca'
  return null
}

// la frase del riquadro, nel tono del gioco; i numeri stanno sotto, scritti dal riquadro
export const DETTO_DEL_PERICOLO = {
  duro: 'Questo nemico picchia duro.',
  poca: 'Le forze ti abbandonano.',
  ultimo: 'Un altro colpo e cadi.',
}
