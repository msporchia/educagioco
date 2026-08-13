import { Oggetto } from './oggetto.js'
import { ACammino } from '../distanze/a-cammino.js'

/* ═══════════════════════════════════════════════════════════════════
   LA LANTERNA — la luce che porti, o che lasci

   È un `Oggetto` come gli altri — si prende, si posa, sta nello zaino
   — e in più sa fare una cosa che nessun altro oggetto sa fare:
   ILLUMINARE. Non è un interruttore con uno stato «accesa/spenta»: una
   lanterna in gioco è SEMPRE accesa, e quello che cambia è solo DOVE
   sta — addosso a chi la porta, o per terra dove è stata posata.
   `dove()` lo sa già dire (`Oggetto.dove`, qui sotto ne resta solo la
   riga che serve) e `luce()` lo riusa: non c'è una seconda copia della
   stessa domanda.

   ── PERCHÉ UNA CLASSE E NON UN CAMPO `illumina: true` SU OGGETTO ──
   Perché domani ci sarà la torcia a muro, e quella non si prende e non
   si posa: quello che condivide con la lanterna è SOLO «fare luce»,
   non «essere un oggetto». `luce(mondo)` è il contratto minimo — da
   dove e fin dove — e `Mondo.illuminato()` (`mondo.js`) lo chiede a
   TUTTE le cose in `cose`, non solo a questa: aggiungere una torcia
   domani non tocca il mondo, aggiunge un file qui dentro.

   ── IL CERCHIO SI MISURA «A CAMMINO», COME LA VISTA ──
   Non «in linea d'aria» — quella è la misura del suono, che passa i
   muri apposta (`distanze/in-aria.js`): una lanterna in una stanza non
   fa luce nella stanza accanto attraverso il muro. È la STESSA misura
   della vista (`ACammino`, `distanze/a-cammino.js`), e non a caso: è
   quello che rende onesto il `Math.min(vista, tetto)` di `unita.js` —
   si sta confrontando la stessa unità di misura (passi, coi muri che
   allontanano), non un cerchio geometrico con una distanza di
   corridoio.

   ── E RIUSA LA CACHE DELLA BFS ──
   `luce()` non restituisce due coordinate: restituisce COME `da` la
   cosa che porta la luce — sé stessa, o chi la porta — cioè lo stesso
   oggetto che `ACammino.distanza` userebbe per costruire la mappa dei
   passi (`mappaDi`, `mappa.js`). Se la lanterna è in mano a un'unità,
   quella mappa è quasi sempre già in cache per conto della vista di
   quell'unità: non se ne calcola una seconda identica. */
export class Lanterna extends Oggetto {
  constructor (id, d) {
    super(id, d)
    /* quanto lontano fa luce, in passi. Il default è la misura di una
       vista normale (`persona.vista` in `data/livelli/scrivi.js` vale
       4): un cerchio che riempie mezza stanza, non tutto il livello —
       chi scrive un livello lo cambia scrivendo `cose.lanterna('nome',
       { raggio: 5 })`, come per ogni altra opzione di una fabbrica. */
    this.raggio = new ACammino(d.raggio ?? 3)
  }

  /* ── DOVE FA LUCE, ADESSO ──
  dove (mondo) {
    if (!this.preso) return this
    const chi = mondo.perId[this.preso]
    return chi && chi.eInPiedi() ? chi : null
  }

  /* il contratto che `Mondo.illuminato()` chiede a ogni cosa in
     `cose`: da dove e fin dove illumina ADESSO, o `null` se in questo
     momento non fa luce da nessuna parte (chi la portava è caduto, e
     nessuno l'ha ancora raccolta) */
  luce (mondo) {
    const da = this.dove(mondo)
    return da ? { da, raggio: this.raggio } : null
  }
}
