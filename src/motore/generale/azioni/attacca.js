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
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'
import { Esito } from './esiti.js'

export class Attacca extends Ordine {
  static parola = 'attacca'

  azzera () { super.azzera(); this.preda = null }

  /* ── QUANDO SONO ABBASTANZA VICINO ──
     Per tutti gli altri verbi lo dice la cosa; qui lo dice l'arma, e
     per questo `Attacca` riscrive la domanda invece di ereditarla. */
  aPortata (contesto, cosa) {
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
    const chiunque = mondo.dove(chi, cosa)
    if (!chiunque || !chi.vede(mondo, chiunque)) return null
    chi.ricorda(chiunque)
    this.preda = chiunque
    return this.preda
  }

  fa (contesto, cosa) {
    const { mondo, chi } = contesto
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

  raccontaIlMoto (cosa, dove) {
    return dove.ricordo ? `vado dove ho visto ${cosa.nome}` : `inseguo ${cosa.nome}`
  }
}
