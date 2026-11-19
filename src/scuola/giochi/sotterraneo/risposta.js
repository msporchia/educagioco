// Una risposta del sotterraneo (il `risposto` di Domanda.vue con la sua domanda) come la vuole la maestra: docs/scuola/giochi.md
import { racconta } from '../../comune/esercizi.js'

// ogni domanda si chiude con la risposta: sbagliata, la cosa che chiedeva ne fa un'altra
export const raccontaSotterraneo = ({ domanda, indice, chiave, giusto, tempo }) =>
  ({ chiave: chiave || domanda?.chiave || '', giusta: !!giusto, ms: Math.round((tempo || 0) * 1000), ultima: true, ...racconta(domanda, indice) })
