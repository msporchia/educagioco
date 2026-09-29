// La creatura al centro dell'arena: una tela con una figura sola che respira.
// Riceve un nome ('ragno', 'troll'...) e uno stato ('normale'/'colpito'/'ko')
// e disegna — non sa cos'è un punto vita o una domanda. Una tela e non
// un'immagine perché serve in quattro misure, tinta dell'ambiente, e deve
// tremare quando colpita: un PNG farebbe quattro file per nove ambienti.
// La stazza (quante unità di disegno nell'altezza) sta qui e non nel CSS:
// il riquadro CSS resta fisso, la telecamera dentro la tela si arrangia da sé.
import { creaTela } from '../../../grafica/tela.js'
import { creatura, ingombroDi } from '../../../grafica/bestiario/indice.js'

const PITTORI = { creatura }

// unità di disegno nel lato corto del riquadro: più basso, più grossa la
// creatura (una creatura è alta una ventina di unità). Scala stretta apposta:
// l'ingombro allarga comunque chi è largo di suo (ragno, troll), e numeri
// più distanti lasciavano il topo della prima stanza perso nel nero.
export const STAZZE = {
  mostro: 27, grosso: 24, capo: 22, boss: 20,
}

// vince il più grande fra la stazza voluta e l'ingombro minimo per non uscire dai bordi
export const MARGINE = 1.12

export const quantoLargo = (tipo, chi) =>
  Math.max(STAZZE[tipo] || STAZZE.mostro, ingombroDi(chi) * MARGINE)

export class Bestia {
  constructor(tela) {
    this.tela = tela
    this.campo = null
    this.chi = null
    this.stato = 'normale'
    this.unita = STAZZE.mostro
    this.animazione = 0
    this.tempo = 0
  }

  // cambiare `unita` vuol dire rifare la tela: entra nel conto della scala
  vesti(unita) {
    if (this.campo && unita === this.unita) return
    this.unita = unita
    // tetto alto (40): qui la creatura è la schermata, non una macchia sopra una strada come nel castello
    this.campo = creaTela(this.tela, PITTORI, { unita, minimo: 0.5, massimo: 40 })
    this.campo.ridimensiona()
  }

  mostra(chi, stato = 'normale') {
    this.chi = chi
    this.stato = stato
  }

  fotogramma(tempo) {
    if (!this.campo || !this.chi) return
    const { W, H } = this.campo.misure
    // i piedi stanno più in basso del centro: a metà riquadro sembra appesa
    this.campo.disegna([{ che: 'creatura', x: W / 2, y: H * 0.88,
                          chi: this.chi, stato: this.stato }], tempo)
  }

  ridimensiona() {
    if (!this.campo) return
    this.campo.ridimensiona()
    this.fotogramma(this.tempo)
  }

  avvia() {
    if (this.animazione) return
    const giro = ms => {
      this.tempo = ms / 1000
      this.fotogramma(this.tempo)
      this.animazione = requestAnimationFrame(giro)
    }
    this.animazione = requestAnimationFrame(giro)
  }

  ferma() {
    if (this.animazione) cancelAnimationFrame(this.animazione)
    this.animazione = 0
  }
}
