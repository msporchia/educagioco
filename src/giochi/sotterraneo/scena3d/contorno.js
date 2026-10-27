// Quello che sta attorno alla scena 3D e non è tre dimensioni: la mappina (la stessa del 2D, scena/minimappa.js, su una tela
// piccola sopra il campo), le feste (la colonna di luce del livello salito, i «+12 ✨» che salgono), i segni sulla tela per le
// prove (`data-eroe`, `data-eroe-schermo`, `data-scala`, come la tela 2D) e la scelta di cosa sta sotto il dito.
import { disegnaMinimappa } from '../scena/minimappa.js'
import { scegli as scegliCosa } from './dito.js'
import { esc } from './etichette.js'

export function creaContorno({ canvas, strato, cam }) {
  const tela = document.createElement('canvas')
  tela.className = 'sot3d-mappina'
  strato.appendChild(tela)
  const g = tela.getContext('2d')
  let L = 0, A = 0, dpr = 1, giro = 0, grandePrima = null
  const p = { x: 0, y: 0 }
  let dati = canvas   // dove si scrivono i segni per le prove
  return {
    // la discesa scaldata prima entra nella pagina (indice.js, `sposta`): la mappina nello strato della pagina, i segni sulla sua tela
    sposta(nuovoStrato, telaDati) { nuovoStrato.appendChild(tela); dati = telaDati },
    misura(l, a) {
      const d = Math.min(2, window.devicePixelRatio || 1)
      if (l === L && a === A && d === dpr) return
      L = l; A = a; dpr = d
      tela.width = Math.round(l * d); tela.height = Math.round(a * d)
      tela.style.width = l + 'px'; tela.style.height = a + 'px'
      grandePrima = null
    },
    // ogni sei fotogrammi (è una misura del visto, non un'animazione), o subito se la mappa grande si apre o si chiude
    // nello scontro (`via`) non c'è: lì in alto a destra sta la fila dei turni, come nel palco del 2D
    mappina(corsa, grande, via = false) {
      const stato = via ? 'via' : grande
      if (stato === grandePrima && (giro++ % 6)) return
      grandePrima = stato
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, L, A)
      if (!via) disegnaMinimappa(g, corsa, L, A, !!grande)
    },
    // le feste chieste da Gioco.vue (come alla tela 2D): `colonne` { x, y, t, colore, segui }, `numerini` { testo, x, y, t }
    feste(lista, numerini, ora, eroe, colonne, etichette) {
      for (let i = lista.length - 1; i >= 0; i--) {
        const c = lista[i], k = (ora - c.t) / 1.6
        if (k >= 1 || k < 0) { if (k >= 1) lista.splice(i, 1); continue }
        const x = c.segui ? eroe.disegnato.x : c.x, z = c.segui ? eroe.disegnato.z : c.y
        if (!c.tinta) c.tinta = `rgb(${c.colore})`
        colonne.metti(x, z, 0.55 + 0.25 * k, 6, c.tinta, Math.sin(Math.PI * Math.min(1, k * 1.4)))
      }
      for (let i = numerini.length - 1; i >= 0; i--) {
        const n = numerini[i], k = (ora - n.t) / 1.1
        if (k >= 1) { numerini.splice(i, 1); continue }
        cam.schermo(n.x, 1.0 + Math.max(0, k) * 0.6, n.y + 0.5, p)
        etichette.metti(p.x, p.y, `n|${n.t}|${n.testo}`, () => `<span class="sot3d-numerino">${esc(n.testo)}</span>`, { numerino: '1' })
      }
    },
    // la cella e il punto dell'eroe scritti sulla tela, solo quando cambiano: servono alla prova col dito
    dataset(corsa, eroe, scala) {
      const d = dati.dataset
      const cella = `${Math.floor(corsa.eroe.x)},${Math.floor(corsa.eroe.y)}`
      cam.schermo(eroe.disegnato.x, 0, eroe.disegnato.z, p)
      const schermo = `${Math.round(p.x)},${Math.round(p.y)}`
      if (d.eroe !== cella) d.eroe = cella
      if (d.eroeSchermo !== schermo) d.eroeSchermo = schermo
      if (d.scala !== String(scala)) d.scala = scala
    },
    scegli(corsa, pt, opz) { return scegliCosa(corsa, cam, pt.x, pt.y, opz) },
    via() { tela.remove() },
  }
}
