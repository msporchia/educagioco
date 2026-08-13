/* ═══════════════════════════════════════════════════════════════════
   REGISTRO — le righe che si leggono dopo

   Una riga per ordine, in prima persona, con l'esito a colori:
     fa      ho fatto qualcosa
     aspetto sto aspettando, e dico cosa
     no      non ho potuto, e dico perché
     salto   non toccava a me: sono passato oltre

   ── DUE VERSIONI DI OGNI RIGA, E NON È UN LUSSO ──
   `penso` è quello che l'unità pensa, e nomina le cose: «suono il
   richiamo». `siVede` è quello che si osserva da fuori: «fa un
   segnale». Di un'unità che non comandi ricevi solo la seconda, e solo
   se qualcuno dei tuoi la sta guardando in quel momento. È la regola
   che rende il registro uno strumento per DEDURRE il piano nemico
   invece di leggerlo: se mostrasse il pensiero, il livello dove tutto
   sta nel capire cosa grida la ronda si risolverebbe leggendo.

   ── È UNA CLASSE PERCHÉ TIENE UNO STATO ──
   Le righe uguali di fila non si ripetono: si contano (`n`) e si
   allunga la loro durata. Per farlo bisogna ricordare cosa si è appena
   scritto — e una funzione libera che ricorda è una classe scritta
   male. Qui dentro c'è anche l'unico posto che decide chi ha sbagliato.
   ═══════════════════════════════════════════════════════════════════ */

/* le preposizioni articolate, che nessuna riga deve comporre a mano */
const ALLA = t => (t || '')
  .replace(/\ba la /g, 'alla ').replace(/\ba il /g, 'al ').replace(/\ba l'/g, "all'").replace(/\ba le /g, 'alle ')
  .replace(/\bdi la /g, 'della ').replace(/\bdi il /g, 'del ').replace(/\bdi l'/g, "dell'")
  .replace(/\bda la /g, 'dalla ').replace(/\bda il /g, 'dal ').replace(/\bda l'/g, "dall'")

/* quante righe si tengono: oltre, le più vecchie cadono */
const QUANTE = 400
/* quanto indietro si guarda per capire se questa riga è la ripetizione
   della precedente */
const INDIETRO = 12

export class Registro {
  constructor (mondo) {
    this.mondo = mondo
    this.righe = []
  }

  azzera () { this.righe = [] }

  /* ═══════════ le quattro voci ═══════════ */
  fatto (contesto, azione, penso, siVede) {
    this.scrivi(contesto, azione, 'fa', penso, siVede)
  }

  aspetta (contesto, azione, penso) {
    this.scrivi(contesto, azione, 'aspetto', penso, 'resta fermo')
  }

  /* non si può, ma la fila prosegue */
  nonSiPuo (contesto, azione, penso, siVede) {
    this.scrivi(contesto, azione, 'no', penso, siVede || 'resta fermo')
    this.incolpa(contesto, azione)
  }

  /* non si può, e questo ramo del piano si ferma qui */
  siFerma (contesto, azione, penso) {
    this.scrivi(contesto, azione, 'no', penso, 'si ferma')
    this.incolpa(contesto, azione)
  }

  /* ═══════════ come si scrive una riga ═══════════ */
  scrivi (contesto, azione, esito, penso, siVede) {
    const { mondo, chi } = contesto
    penso = ALLA(penso)
    siVede = ALLA(siVede) || penso
    const visto = this.chiGuarda(chi)
    const dove = this.posto(contesto, azione)

    /* la stessa riga di fila non si ripete: si conta */
    const prima = this.ultimaDi(chi.id)
    if (prima && prima.testo === penso && prima.esito === esito && prima.visto === visto) {
      prima.n++
      prima.tFine = mondo.passi
      return
    }

    this.righe.push({
      passo: mondo.passi, t: mondo.passi, tFine: mondo.passi, n: 1,
      unita: chi.id, fazione: chi.fazione, emoji: chi.emoji,
      esito, testo: penso, fatto: siVede, visto,
      ...dove,
      /* il MOTIVO è la parte che insegna: c'è solo quando qualcosa non è
         andato, e dice perché proprio quello non è andato */
      ...(esito === 'fa' ? {} : { motivo: penso }),
    })
    if (this.righe.length > QUANTE) this.righe.shift()
  }

  ultimaDi (id) {
    for (let k = this.righe.length - 1; k >= 0 && k > this.righe.length - INDIETRO; k--)
      if (this.righe[k].unita === id) return this.righe[k]
    return null
  }

  /* ── DOVE STAVA CHI PARLA ──
     La vista deve poter accendere la riga giusta del piano: il nome
     della fila, l'indice nella fila, e — se sta dentro un ramo — quale
     ramo e a che punto. L'azione porta la sua via addosso, qui la si
     traduce. */
  posto (contesto, azione) {
    const [i, ramo, j] = (azione && azione.via) || []
    return {
      filo: contesto.filo,
      i: i ?? 0,
      ramo: typeof ramo === 'string' ? ramo : null,
      j: typeof ramo === 'string' ? (j ?? null) : null,
    }
  }

  /* chi dei «tuoi» sta guardando questa unità in questo momento */
  chiGuarda (chi) {
    if (chi.fazione === this.mondo.mia) return true
    return this.mondo.vivi().some(z => z.fazione === this.mondo.mia && z.vede(this.mondo, chi))
  }

  /* ── L'ORDINE SU CUI LA VISTA SALTA QUANDO IL PIANO NON REGGE ──
     Si segna solo se è un ordine dei TUOI: mandare il bambino a
     guardare la riga sbagliata di un piano che non ha scritto lui è
     peggio che non mandarlo da nessuna parte. */
  incolpa (contesto, azione) {
    const { mondo, chi } = contesto
    if (mondo.colpevole || chi.fazione !== mondo.mia) return
    mondo.colpevole = { unita: chi.id, ...this.posto(contesto, azione) }
  }

  /* le righe, dalla più vecchia alla più nuova */
  tutte (quante) { return quante ? this.righe.slice(-quante) : this.righe }
  /* l'ultimo intoppo di uno dei tuoi: serve a raccontare come è finita */
  ultimoIntoppo () {
    return [...this.righe].reverse()
      .find(r => r.esito === 'no' && this.mondo.mio(r.unita)) || null
  }
}
