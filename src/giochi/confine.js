// Il confine fra il campo e il programma, uno per i giochi a due piani
// (il costruttore, il Generale): vedi docs/core/interfaccia.md.
import { ref } from 'vue'

// -1 il programma ha più spazio, 0 pari, 1 il campo ha più spazio.
// Resta per tutta la sessione e vale in tutti e due i giochi: è il
// telefono che è basso, non il livello.
export const posto = ref(0)

const PER = { '-1': 0.55, 0: 1, 1: 1.45 }

// gira in Node, si prova in test/unita/confine: dall'altezza che il campo
// avrebbe da solo a quella col confine spostato, mai più di due terzi
// dello schermo e mai così basso da non vedere più niente
export function altezzaCampo(alta, schermo, dove = posto.value) {
  if (!dove) return alta
  return Math.round(Math.max(90, Math.min(schermo * 0.66, alta * PER[dove])))
}

// Il campo dice se allargarlo lo ingrandisce davvero: il cantiere largo
// quanto lo schermo non cresce, e un ▼ che non fa niente è un tasto rotto.
// Se non serve, il confine abbassato torna a metà.
export const grandeServe = ref(true)
export function grandeUtile(si) {
  grandeServe.value = si
  if (!si && posto.value === 1) posto.value = 0
}

export function sposta(verso) {
  posto.value = Math.max(-1, Math.min(1, posto.value + verso))
}
