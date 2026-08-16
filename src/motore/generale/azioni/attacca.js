/* ═══════════════════════════════════════════════════════════════════
   ATTACCA — «vagli addosso e mena, finché non cade»

   ── PERCHÉ LA PREDA SI SCEGLIE UNA VOLTA ──
   `attacca [gli orchi]` nomina una schiera, non un orco. Senza memoria
   il bersaglio si ricalcolerebbe a ogni battito, e con due orchi quasi
   equidistanti il personaggio oscillerebbe fra i due senza ammazzarne
   nessuno. Una volta scelta, la preda resta finché sta in piedi.

   ── E CHI COLPISCE NON GUARDA DENTRO CHI LE PRENDE ──
   Non si legge `preda.vita` e non le si scala niente da fuori: le si
   dice `subisci` e lei risponde col resoconto. È dentro `subisci` che
   sta «se le prendo chiamo i miei» — la reazione al colpo è di chi il
   colpo lo incassa, non di chi lo dà.

   ── E LA PORTATA È DELL'ARMA ──
   Non una cella scritta qui: `chi.puoiColpire(...)`. Un arciere con un
   raggio di cinque non chiede di riaprire questo file.

   ── SI MENA ANCHE ALLE COSE ──
   `attacca` prendeva solo unità, e per questo il SABOTAGGIO non era
   scrivibile: «sfonda il tamburo», «butta giù la scala» finivano
   raccontati come «portalo via», che è un'altra storia. Una cosa però
   non è una preda — non scappa, non si ricorda, non ha una vita da
   scalare da fuori — quindi qui non ci si inventa un secondo modo di
   colpire: si torna al tronco comune di `Ordine` e le si dice
   «attacca», come `prendi` le dice «prendi». Cosa voglia dire lo sa
   lei (`Elemento.incassa`), e chi non è rompibile risponde di no.

   ── E SI PUÒ DIRE QUALE ──
   Il `quale` di `Ordine` (`scelte.js`) vale anche qui, ed è quello che
   rende scrivibile un gruppo diviso in due posti: uno dei tuoi va sul
   più vicino, l'altro sul più lontano.
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'
import { Esito } from './esiti.js'

/* le cose a cui si può menare: tutto quello che non cammina */
const eUnaCosa = cosa => cosa.tipo === 'oggetto' || cosa.tipo === 'congegno'

export class Attacca extends Ordine {
  static parola = 'attacca'

  azzera () { super.azzera(); this.preda = null }

  /* ── QUANDO SONO ABBASTANZA VICINO ──
     Per tutti gli altri verbi lo dice la cosa; qui lo dice l'arma, e
     per questo `Attacca` riscrive la domanda invece di ereditarla. Su
     una cosa ferma però l'arma non c'entra: si torna alla regola di
     tutti, che è quella del raggio di presa. */
  aPortata (contesto, cosa) {
    if (eUnaCosa(cosa)) return super.aPortata(contesto, cosa)
    const preda = this.trovaPreda(contesto, cosa)
    return !!preda && contesto.chi.puoiColpire(contesto.mondo, preda)
  }

  /* ── CHI STO ATTACCANDO ──
     Tre strade, e prima stavano srotolate nel corpo principale: ce
     l'ho già; la vedo adesso (e allora è lei); non la vedo, e allora
     non è una preda — è un posto dove andare a guardare, e ci pensa il
     moto di `Ordine`. */
  trovaPreda (contesto, cosa) {
    const { mondo, chi } = contesto
    if (this.preda && !this.preda.eInPiedi()) this.preda = null
    if (this.preda) return this.preda
    const chiunque = mondo.dove(chi, cosa, this.quale)
    if (!chiunque || !chi.vede(mondo, chiunque)) return null
    chi.ricorda(chiunque)
    this.preda = chiunque
    return this.preda
  }

  fa (contesto, cosa) {
    const { mondo, chi } = contesto
    /* una cosa risponde da sé: quanto regge e cosa vuol dire romperla
       lo sa lei, e qui non si legge nessun contatore */
    if (eUnaCosa(cosa)) return contesto.consegna(this, cosa, 'attacca')
    const preda = this.trovaPreda(contesto, cosa)
    /* non c'è più nessuno da attaccare: l'ordine è compiuto */
    if (!preda) return Esito.finitoSubito()

    /* le prende lei, e quello che le succede lo pubblica lei: il colpo
       che si vede, la caduta, e il grido di chi chiama i suoi. Qui si
       racconta solo il proprio gesto. */
    const colpo = preda.subisci(chi.danno, chi, mondo)
    if (colpo.mortale) {
      this.dice(contesto, `${preda.comeSiChiama} è caduto`, `abbatte ${preda.comeSiChiama}`)
      return Esito.finito()
    }
    this.dice(contesto, `colpisco ${preda.comeSiChiama}`, `colpisce ${preda.comeSiChiama}`)
    return Esito.inCorso()
  }

  /* ── E CI SI AVVICINA ALLA PREDA, NON ALLA SCHIERA ──
     Qui sopra c'è scritto da sempre che la preda si sceglie una volta
     sola, e per una ragione precisa: con due orchi quasi equidistanti
     un bersaglio ricalcolato a ogni battito fa oscillare chi li insegue
     fra i due, senza ammazzarne nessuno. Solo che la promessa valeva
     per il colpo e non per il PASSO — camminare era del tronco comune,
     e il tronco comune risolveva di nuovo la schiera ogni volta. Basta
     un pareggio (due orchi a due passi) e si va avanti e indietro
     finché la scena non scade. Da qui in poi, scelta la preda, ci si
     avvicina a lei e a nessun altro. */
  avvicinati (contesto, cosa, scusa) {
    const preda = this.preda
    const suo = preda && contesto.mondo.cose[preda.id]
    return super.avvicinati(contesto, suo || cosa, scusa)
  }

  raccontaIlMoto (cosa, dove) {
    if (eUnaCosa(cosa)) return `vado a rompere ${cosa.nome}`
    return dove.ricordo ? `vado dove ho visto ${cosa.nome}` : `inseguo ${cosa.nome}`
  }
}
