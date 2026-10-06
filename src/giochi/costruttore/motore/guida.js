// La guida del primo livello: una riga e un dito sull'unica cosa da toccare
// adesso, letta da quello che c'è a schermo e non da un copione — regge anche
// chi fa le cose in un altro ordine. Pura: si prova in test/unita/costruttore.
// Vedi docs/costruttore/linguaggio.md.

// `dove` è il bersaglio che pulsa (stile.css, `.cst[data-guida=…]`), o null
export function guida({ righe = [], cassetta = false, scegliendo = false, problemi = false,
                        inCorso = false, provato = false, cambiato = false, mancano = false }) {
  if (inCorso) return null
  if (cassetta) {
    const ultima = righe[righe.length - 1]
    return ultima && ultima.tipo === 'metti'
      ? { dove: 'vai', testo: 'Tocca «vai»: dopo un mattone il robot deve spostarsi.' }
      : { dove: 'metti', testo: 'Tocca «metti»: il robot posa un mattone sotto i piedi.' }
  }
  if (scegliendo) return { dove: null, testo: 'Scegli qui sotto. Il prossimo mattone va a destra, a un passo.' }
  if (!righe.length) return { dove: 'aggiungi', testo: 'Tocca «＋ aggiungi» qui sotto, e scegli cosa fa il robot.' }
  if (problemi) return { dove: null, testo: 'Tocca la casella che lampeggia, e scegli.' }
  if (!provato || cambiato) return { dove: 'via', testo: 'Premi ▶ Via, e guarda cosa fa il robot.' }
  if (mancano) return { dove: 'aggiungi', testo: 'Il muretto non è finito: aggiungi ancora «metti» e «vai», poi riprova ▶.' }
  return null
}
