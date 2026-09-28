/* Il verso contrario di sempre: data una chiave di sapere, trova una
   domanda vera che sparisce se la si spegne — non una frase scritta a
   mano (che invecchia da sola). Gira in Node come classi.js: unita/saperi
   controlla che ogni voce del pannello dei grandi sappia produrre la sua
   domanda. `regole` (finestra dell'età) taglia anche qui, altrimenti un
   grande vedrebbe una domanda che a suo figlio non arriva per anni. */
import { adatta } from './classi.js'

// una sorgente è la terna (modulo, grado, tipologia); i moduli senza tipi la dichiarano grado per grado
export function sorgentiDi(moduli, chiave, regole = null) {
  const fuori = []
  const dentro = (m, g, t) => !regole?.finestra ||
    adatta(t ? m.livelloVistoDelTipo(t, g, regole) : m.livelloVisto(g, [], regole),
           regole.finestra)
  for (const m of moduli) {
    for (let g = 1; g <= m.gradi; g++) {
      if (m.tipi.length) {
        for (const t of m.tipiDi(g))
          if ((t.chiave === chiave || t.sa.includes(chiave)) && dentro(m, g, t))
            fuori.push({ modulo: m, grado: g, tipo: t.chiave, nome: t.nome })
      } else if (m.serve(g).includes(chiave) && dentro(m, g, null)) {
        fuori.push({ modulo: m, grado: g, tipo: null, nome: m.scaletta[g - 1] }) // il sapere è di tutto il grado
      }
    }
  }
  return fuori
}

// il tipo si passa a genera() invece di lasciarlo pescare a chiedi(): qui la tipologia è il punto, non una a caso
export function esempioDa(sorgente, sorte) {
  const { modulo, grado, tipo } = sorgente
  const domanda = tipo ? modulo.genera(grado, sorte, tipo) : modulo.chiedi(grado, sorte)
  return {
    domanda,
    pittori: modulo.pittori,
    modulo: modulo.id,
    titolo: `${modulo.icona} ${modulo.nome}`,
    grado,
    dice: sorgente.nome || modulo.scaletta[grado - 1], // cosa si sta guardando, detto a un grande
  }
}

export function esempioDi(moduli, chiave, sorte, regole = null) {
  const dove = sorgentiDi(moduli, chiave, regole)
  if (!dove.length) return null
  return esempioDa(sorte.uno(dove), sorte)
}
