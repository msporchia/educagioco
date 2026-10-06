// La guida del primo livello: cosa dire e cosa indicare, letto da quello che
// c'è a schermo e non da un copione — regge anche chi fa le cose in un altro
// ordine. Pura: si prova in test/unita/costruttore. Il resto (la riga, l'anello)
// è comune a tutti i giochi: giochi/guida.js, docs/core/guida.md.

export const BERSAGLI = {
  aggiungi: '[data-aggiungi="principale"]',
  metti: '[data-cassetta] [data-blocco="metti"]',
  vai: '[data-cassetta] [data-blocco="vai"]',
  via: '[data-azione="via"]',
}

export function guida({ righe = [], cassetta = false, scegliendo = false, problemi = false,
                        inCorso = false, provato = false, cambiato = false, mancano = false }) {
  if (inCorso) return null
  if (cassetta) {
    const ultima = righe[righe.length - 1]
    return ultima && ultima.tipo === 'metti'
      ? { dove: BERSAGLI.vai, testo: 'Tocca «vai»: dopo un mattone il robot deve spostarsi.' }
      : { dove: BERSAGLI.metti, testo: 'Tocca «metti»: il robot posa un mattone sotto i piedi.' }
  }
  if (scegliendo) return { dove: null, testo: 'Scegli qui sotto. Il prossimo mattone va a destra, a un passo.' }
  if (!righe.length) return { dove: BERSAGLI.aggiungi, testo: 'Tocca «＋ aggiungi» qui sotto, e scegli cosa fa il robot.' }
  if (problemi) return { dove: null, testo: 'Tocca la casella che lampeggia, e scegli.' }
  if (!provato || cambiato) return { dove: BERSAGLI.via, testo: 'Premi ▶ Via, e guarda cosa fa il robot.' }
  if (mancano) return { dove: BERSAGLI.aggiungi, testo: 'Il muretto non è finito: aggiungi ancora «metti» e «vai», poi riprova ▶.' }
  return null
}
