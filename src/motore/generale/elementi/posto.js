import { Elemento } from '../elemento.js'

/* ═══════════════════════════════════════════════════════════════════
   IL POSTO — un punto della mappa con un nome

   Non riceve comandi (nessun verbo accetta 'posto' come non-`vai`) e
   non ha stato da azzerare: sta fermo, ed è tutto.

   ── MA SI FA VEDERE, SE IL LIVELLO GLI DÀ UNA FACCIA ──
   Per un pezzo non disegnava niente: un posto era una cella di prato
   con un nome, e il nome viveva solo nell'elenco dei bersagli. A
   schermo restavano dei riquadri colorati indistinguibili — «l'orto»,
   «la siepe», «la legnaia» erano lo stesso rettangolo verde tre volte,
   e per sapere quale fosse quale bisognava leggere un'etichetta.
   Un posto che ha un nome nella storia è una COSA della storia: la
   legnaia è una catasta di legna, la siepe è un cespuglio. Il livello
   lo dice (`cose.posto('legnaia', 'la legnaia', { pittore: 'legno' })`)
   e da lì in poi si riconosce a occhio, senza nomi da leggere — che è
   la differenza fra una mappa che si guarda e una che si decifra.
   Chi non dichiara niente resta invisibile come prima: un punto di
   arrivo che non è nessuna cosa (il centro del cortile, la soglia) non
   deve inventarsi un oggetto che nella stanza non c'è.
   ═══════════════════════════════════════════════════════════════════ */
export class Posto extends Elemento {
  get tipo () { return 'posto' }
  get em () { return this.d.em || '📍' }

  faccia () {
    const p = this.d.pittore
    if (!p) return []
    /* `strato: -1` come tutte le cose piatte: un cespuglio o una
       catasta stanno sotto ai piedi di chi ci cammina sopra */
    return [{ che: p, x: this.x, y: this.y, strato: this.d.strato ?? -1 }]
  }
}
