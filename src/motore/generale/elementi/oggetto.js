import { Elemento } from '../elemento.js'
import { Esito } from '../azioni/esiti.js'
import { armaDa } from '../arma.js'

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
    /* ⚠ `nome` è ancora un alias di `id`, e non dovrebbe esserlo: erano
       la stessa stringa, e per trovare un oggetto si scriveva
       `oggetti.find(z => z.nome === id)` — cercare per nome una cosa
       che ha una chiave. La chiave è `id`; il nome che si legge in una
       frase («il tesoro») glielo dà il mondo quando censisce le cose.
       Resta finché il motore vecchio (`generale.js`) lo legge così: si
       toglie insieme a lui, e con lui va cambiata la riga di
       `CampoLivello.vue` che usa `o.nome` per scegliere il pittore. */
    this.nome = id
    this.pittore = d.pittore || null
    this.preso = null
    /* come per la porta: lo decide il motore guardando tutte le
       chiavi insieme, non è un dato del livello */
    this.sigillo = null
  }

  azzera () { super.azzera(); this.preso = null }

  dove (mondo) {
    if (!this.preso) return this
    const chi = mondo.perId[this.preso]
    return chi && chi.eInPiedi() ? chi : null
  }

  accetta (cmd) { return super.accetta(cmd) || cmd === 'prendi' || cmd === 'posa' }

  ricevi (cmd, chi, ctx) {
    /* le botte le incassa la classe base: rompere non è un mestiere
       dell'oggetto, è una cosa che si fa a qualunque cosa rompibile */
    const colpo = super.ricevi(cmd, chi, ctx)
    if (colpo) return colpo
    /* ── LASCIARLO DOVE SEI ──
       Non è «buttarlo via»: è metterlo in un posto. L'oggetto prende le
       coordinate di chi lo posa, e da quel momento è una cosa del campo
       come prima — chi passa di lì la trova, e `dove()` torna a dire la
       sua cella invece di seguire uno zaino. */
    if (cmd === 'posa') {
      const N = this.nomeIn(ctx.mondo)
      if (this.preso !== chi.id)
        return { esito: Esito.finito(), riuscito: false, penso: `${N} non ce l'ho` }
      this.x = chi.x
      this.y = chi.y
      this.lascia(ctx.mondo)
      ctx.mondo.eventi.push('presa')
      return { esito: Esito.finito(), penso: `poso ${N}`, siVede: 'posa qualcosa per terra' }
    }
    if (cmd !== 'prendi') return null
    const N = this.nomeIn(ctx.mondo)
    /* ── QUELLO CHE È ROTTO NON SI RACCOGLIE ──
       È il senso stesso del sabotaggio: il tamburo sfondato non si
       porta via e non suona più. Rifiuto, non guasto — chi ci prova
       resta in piedi e la sua fila prosegue. */
    if (this.rotto) return { esito: Esito.finito(), riuscito: false,
                             penso: `${N} è rotto: non serve più a niente` }
    if (this.preso === chi.id) return { esito: Esito.finitoSubito() }
    /* rifiuto, non riuscita: chi ci prova resta in piedi e la fila va
       avanti, ma il registro non deve scrivere in verde una presa che
       non è avvenuta — e col `riuscito: false` la riga si porta dietro
       il motivo, che è quello che si legge dopo per capire */
    if (this.preso) return { esito: Esito.finito(), riuscito: false,
                             penso: `${N} ce l'ha già qualcun altro` }
    /* ── E LE MANI SONO DUE ──
       Il rifiuto arriva a scena avviata e dice perché, come tutti gli
       altri: chi guarda vede il gesto fallire e capisce da sé che
       prima deve liberarsi una mano. È la regola che rende `posa` un
       verbo necessario invece che una cortesia. */
    /* la roba piccola va in tasca e non pesa: le mani restano contate
       solo per quello che si porta davvero a braccia */
    if (this.d.tasca) {
      if (chi.tascheLibere <= 0)
        return { esito: Esito.finito(), riuscito: false,
                 penso: `ho le tasche piene`, siVede: 'si fruga in tasca' }
    } else if (chi.maniLibere <= 0)
      return { esito: Esito.finito(), riuscito: false,
               penso: `ho le mani piene: prima devo posare qualcosa`,
               siVede: 'si guarda le mani' }
    this.passaA(chi)
    ctx.mondo.eventi.push('presa')
    return { esito: Esito.finito(), penso: `presa ${N}`, siVede: 'raccoglie qualcosa' }
  }

  /* ── CHI MI TIENE È SCRITTO DUE VOLTE, E SI SCRIVE QUI ──
     L'oggetto sa chi lo tiene, l'unità sa cosa porta: due copie della
     stessa verità, perché rispondono a due domande diverse — «dove sei»
     (che segue chi ti porta) e «hai la chiave» (che si chiede mille
     volte al battito). Il patto è che si registrino e si
     de-registrino **sempre insieme**, e per non dipendere da chi se ne
     ricorda questi due metodi sono l'unico posto che le tocca. */
  passaA (chi) {
    this.preso = chi.id
    chi.metteInZaino(this.id)
    /* ── E SE È UN'ARMA, DA ADESSO COLPISCE CON QUELLA ──
       Un oggetto che dichiara `arma: { danno: 2 }` cambia quanto fa
       male chi lo tiene. Lo dice qui e non in `prendi`, per la stessa
       ragione per cui lo zaino si scrive qui: **chi cambia mano è
       l'oggetto**, e un verbo che sapesse cosa sono le armi sarebbe un
       verbo che ha imparato un cassetto in più. */
    if (this.d.arma) chi.impugna(this.id, armaDa(this.d.arma))
    if (this.d.tasca) chi.metteInTasca(this.id)
  }

  /* ── E DOVE LO POSI, LÌ RESTA ──
     Qui c'era solo il de-registro dallo zaino, e la cosa tornava libera
     **con le coordinate di partenza**: presa in dispensa e posata in
     cucina, ricompariva in dispensa. `posa` diventava così un verbo che
     non serve a niente — «lascialo dove sei» senza il «dove sei» — e
     con lui cadeva tutta una famiglia di storie: porta la roba di là,
     passa la chiave a chi sa aprire, libera le mani.
     La posizione la dà chi lo lascia, ed è l'unico momento in cui un
     oggetto la cambia da sé: mentre è in mano non ne ha una (`dove()`
     segue chi lo porta), da terra in poi è quella. */
  lascia (mondo) {
    const chi = this.preso && mondo.perId[this.preso]
    if (chi) { chi.togliDaZaino(this.id); this.x = chi.x; this.y = chi.y }
    this.preso = null
  }

  /* il nome del pittore preferito, in celle: la vista decide ancora lei
     i sinonimi (`ALTRI_NOMI`) e il ripiego se quel pittore non esiste,
     perché quel catalogo sta in `grafica/` e il motore non lo importa
     mai. `alone: true`: è una cosa che si nomina in un ordine, non
     arredo dipinto sul fondale */
  faccia () {
    if (this.preso) return []
    return [{ che: this.pittore || this.id, x: this.x, y: this.y, sigillo: this.sigillo,
              rotto: this.rotto, alone: true }]
  }

  scheda () {
    if (this.rotto) return ['è rotto']
    const righe = this.preso ? ['ce l\'ho'] : ['è qui, per terra']
    if (this.rompibile) righe.push(`si può rompere: ${this.resistenza} di danno`)
    return righe
  }
}
