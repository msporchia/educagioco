/* ═══════════════════════════════════════════════════════════════════
   CHI TI ASPETTA — la creatura al centro dell'arena

   Una tela piccola con dentro una figura sola, ferma, che respira.
   Non sa cos'è un punto vita, non sa cos'è una domanda: riceve **un
   nome** — `ragno`, `troll`, `drago` — e uno stato fra 'normale',
   'colpito' e 'ko', e disegna. Chi decide quale creatura tocca è
   `motore/corsa.js`, che pesca dal mazzo dell'ambiente; chi decide
   quando è colpita è `Gioco.vue`.

   ── PERCHÉ UNA TELA E NON UN'IMMAGINE ──
   Perché la stessa creatura serve di quattro misure diverse (un mostro
   normale, uno grosso, un capo, un boss), tinta dell'ambiente in cui
   sta, e deve poter tremare quando la colpisci. Un PNG non fa nessuna
   di queste tre cose senza diventare quattro PNG per nove ambienti.

   ── LA STAZZA È QUI E NON NEL CSS ──
   La misura della figura la decide `unita`: quante unità di disegno
   stanno nell'altezza della tela. Meno unità, più grossa la creatura.
   Il riquadro invece resta sempre lo stesso — è il CSS a dargli il
   posto — così quando in scena entra una domanda e la stanza si
   stringe, non c'è niente da ricalcolare: la telecamera è dentro la
   tela e si arrangia da sé.
   ═══════════════════════════════════════════════════════════════════ */
import { creaTela } from '../../../grafica/tela.js'
import { creatura, ingombroDi } from '../../../grafica/bestiario/indice.js'

const PITTORI = { creatura }

/* Quanto è grosso chi hai davanti, per tipo di stanza. È lo stesso
   ordine che le ossa dichiarano in `dati/mostri.js` — normale, grosso,
   guardiano — più il boss, che è un guardiano ma è **il** guardiano.
   Il numero è **quante unità di disegno entrano nel lato corto del
   riquadro**: più basso, più grossa la creatura. Una creatura è alta
   una ventina di unità, quindi con 27 riempie i tre quarti del
   riquadro e con 20 lo riempie tutto.

   La scala fra le quattro è più stretta di quanto sembri, e apposta:
   chi è largo di suo — il ragno con le zampe, il troll con la clava —
   viene comunque allargato dal suo ingombro, e quello basta a tenere
   le distanze. Numeri più distanti fra loro lasciavano il topo della
   prima stanza sperduto in mezzo a mezzo schermo nero. */
export const STAZZE = {
  mostro: 27, grosso: 24, capo: 22, boss: 20,
}

/* Quanto sta largo il riquadro, per questa creatura in questa stanza.
   La stazza è quella che si vorrebbe; l'ingombro della creatura è il
   minimo che serve perché non esca dai bordi. Vince il più grande dei
   due, e per questo un drago-boss finisce disegnato un filo più
   piccolo di quanto la sua stanza chiederebbe: sta tutto dentro, ali
   comprese, ed è meglio di un boss maestoso di cui si vede la pancia.
   Il pizzico di margine è l'aria che una figura vuole intorno: senza,
   le zampe toccano il bordo e sembra spinta contro un vetro. */
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

  /* la tela si crea quando c'è già un posto dove stare: `unita` entra
     nel conto della scala, quindi cambiarla vuol dire rifare la tela */
  vesti(unita) {
    if (this.campo && unita === this.unita) return
    this.unita = unita
    /* Il tetto alla scala serve al campo del castello, dove un mostro
       ingrandito troppo diventa una macchia sopra la strada. Qui la
       creatura **è** la schermata, e un tetto basso la lasciava
       piccola in mezzo a mezzo schermo vuoto: la misura la decide
       `unita` e nient'altro. */
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
    /* i piedi stanno più in basso del centro, non al centro: una
       creatura disegnata a metà riquadro sembra appesa, e questa è
       l'unica cosa che serve sapere per posarla */
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
