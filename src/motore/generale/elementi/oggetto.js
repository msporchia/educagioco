import { Elemento } from '../elemento.js'

/* ═══════════════════════════════════════════════════════════════════
   L'OGGETTO — la cosa da raccogliere

   Non cammina, ma dopo essere stato preso «è dove sta chi lo tiene»:
   `dove()` lo dice, e `laCosa`/`vai [oggetto]` in `generale.js`
   continuano a funzionare senza saperlo — la memoria di dove si è
   visto qualcuno resta un fatto dell'unità, non dell'oggetto.
   ═══════════════════════════════════════════════════════════════════ */
export class Oggetto extends Elemento {
  get tipo () { return 'oggetto' }
  /* l'icona la dichiara l'oggetto: prima erano tutte una chiave, e la
     lanterna del primo capitolo si presentava come un mazzo di chiavi.
     Chi non la dichiara resta una chiave, che è il caso più comune. */
  get em () { return this.d.em || this.d.emoji || '🔑' }

  constructor (id, d) {
    super(id, d)
    /* `nome` è un alias di `id`: il resto del motore lo legge ancora
       così (`m.oggetti.find(z => z.nome === C.id)`) */
    this.nome = id
    this.pittore = d.pittore || null
    this.preso = null
    /* come per la porta: lo decide il motore guardando tutte le
       chiavi insieme, non è un dato del livello */
    this.sigillo = null
  }

  azzera () { this.preso = null }

  dove (mondo) {
    if (!this.preso) return this
    const chi = mondo.perId[this.preso]
    return chi && chi.viva ? chi : null
  }

  accetta (cmd) { return cmd === 'prendi' }

  ricevi (cmd, chi, ctx) {
    if (cmd !== 'prendi') return null
    const N = this.nomeIn(ctx.m)
    if (this.preso === chi.id) return { esito: 'subito' }
    if (this.preso) return { esito: 'salta', dice: `${N} ce l'ha già qualcun altro` }
    this.preso = chi.id
    chi.zaino.push(this.id)
    ctx.m.eventi.push('presa')
    return { esito: 'fatto', dice: `presa ${N}`, fatto: 'raccoglie qualcosa' }
  }

  /* il nome del pittore preferito, in celle: la vista decide ancora lei
     i sinonimi (`ALTRI_NOMI`) e il ripiego se quel pittore non esiste,
     perché quel catalogo sta in `grafica/` e il motore non lo importa
     mai */
  faccia () {
    if (this.preso) return []
    return [{ che: this.pittore || this.nome, x: this.x, y: this.y, sigillo: this.sigillo }]
  }

  scheda () {
    return this.preso ? ['ce l\'ho'] : ['è qui, per terra']
  }
}
