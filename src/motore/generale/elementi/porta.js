import { Elemento } from '../elemento.js'
import { Esito } from '../azioni/esiti.js'
import { AContatto } from '../distanze/a-contatto.js'

/* ═══════════════════════════════════════════════════════════════════
   LA PORTA — cinque modi di essere un varco, e sono le combinazioni
   di tre soli fatti

     chiave   una serratura: senza quella chiave in zaino non si apre
     forza    si può sfondare: `n` battiti di spallate, con o senza
              serratura (prima erano la stessa cosa: `forza` contava
              solo dentro il ramo «hai la chiave? no», quindi una porta
              sfondabile ma senza serratura si apriva sempre, subito —
              il bug che ha aperto questo file)
     aMano    se falso, non si apre camminandoci: qualcun altro deve
              azionare un congegno (il congegno è un'altra tappa, qui
              la porta si limita a rifiutare dicendo perché)

   | genere         | come si dice          |
   |----------------|------------------------|
   | libera         | niente                 |
   | a lucchetto    | `chiave`                |
   | sfondabile     | `forza`, senza `chiave` o insieme |
   | a comando      | `aMano:false`           |

   IL SIGILLO NON SI DICHIARA: SI DERIVA. Il colore lo assegna il
   motore (`assegnaSigilli` in `generale.js`), guardando tutte le porte
   insieme — qui dentro `sigillo` parte `null` e aspetta. */
const SOPRA = new AContatto(0)
const ACCANTO = new AContatto(1)

export class Porta extends Elemento {
  get tipo () { return 'porta' }

  /* ── DA DOVE MI SI TOCCA ──
     Chiusa, dalla cella accanto: sulla mia non ci si può stare, e chi ci
     provasse camminerebbe verso un posto irraggiungibile per sempre.
     Aperta, ci si passa sopra come su qualunque altra cella. Lo dico io
     perché è una cosa mia: chi mi apre non deve sapere che sono una
     porta, e domani un baule o una grata risponderanno diverso. */
  raggioDiPresa () { return this.aperta ? SOPRA : ACCANTO }
  get em () { return '🚪' }

  constructor (id, d) {
    super(id, d)
    this.chiave = d.chiave || null
    this.forza = d.forza || 0
    this.rumore = d.rumore || null
    /* il rumore dell'apertura NORMALE (chiave, a mano, o un congegno):
       `cigolio` per tutte, salvo chi ne dichiara uno suo — serve ai
       livelli con più di una porta a comando nella stessa scena, dove
       «senti un cigolio» deve poter distinguere QUALE porta, e la
       domanda che lo controlla (`Sentito`) oggi guarda solo se quel
       segnale è mai arrivato, non da dove (`domande/sentito.js`). */
    this.cigolio = d.cigolio || 'cigolio'
    this.stile = d.stile || 'legno'
    /* di default una porta si apre camminandoci: solo chi dice
       esplicitamente `aMano: false` chiede il congegno */
    this.aMano = d.aMano !== false
    this.aperta = !!d.aperta
    this.iniziale = this.aperta
    this.hafattoRumore = false
    /* lo decide il motore una volta sola, guardando tutte le porte:
       non è un dato del livello */
    this.sigillo = null
    /* le spallate contate PER CHI SPINGE, non in un numero solo: due
       unità che spingono la stessa porta non devono sommare le forze,
       ognuna fa il suo conto. Prima questo contatore viveva nello
       scratchpad del filo (`ctx.f.st`, sparito con la classe `Azione`
       nuova, che non ne ha più uno); la porta è l'oggetto che dura fra
       un battito e l'altro, quindi è lei a tenerlo, per id di chi
       spinge. */
    this.spinte = {}
  }

  azzera () {
    this.aperta = this.iniziale
    this.hafattoRumore = false          // si ricomincia da capo, silenzio compreso
    this.spinte = {}
  }

  chiedi (q) {
    if (q === 'aperta') return this.aperta
    return null
  }

  accetta (cmd) { return cmd === 'apri' || cmd === 'chiudi' }

  /* `ctx` è il `Contesto` di chi ha camminato fin qui (`ctx.mondo` per
     il rumore e per la mappa che cambia). `chi === null` è il segnale
     di un comando di CONGEGNO: non un'unità arrivata a portata, ma una
     leva o un totem lontani che l'hanno azionata (`Contesto.consegna`
     non passa mai `null`; solo `Partita.comandiDeiCongegni`, che non è
     un file di questa tappa, lo fa). */
  ricevi (cmd, chi, ctx) {
    if (cmd === 'chiudi') return this.chiudi(chi, ctx)
    if (cmd !== 'apri') return null
    if (this.aperta) return { esito: Esito.finitoSubito() }
    const N = this.nomeIn(ctx.mondo)

    /* ── UN COMANDO DI CONGEGNO APRE SEMPRE ──
       Qui non è arrivato nessuno camminando: chi ha pagato il prezzo di
       arrivare è stato chi ha premuto la leva o toccato il totem, non
       questa porta. Chiave, forza e `aMano` restano regole di chi entra
       CAMMINANDO — è proprio per questo che `aMano:false` esiste: dice
       «non così, ci vuole un congegno», e un congegno è quello che sta
       succedendo in questo ramo. */
    if (chi === null) {
      this.aperta = true
      ctx.mondo.versioneMappa++
      ctx.mondo.unita.forEach(z => { z._mk = null })
      this.cigola(ctx, null)
      ctx.mondo.eventi.push('apre')
      return { esito: Esito.finito(), penso: `si apre ${N}`, siVede: `si apre ${N}` }
    }

    /* ── UN RIFIUTO SI SCRIVE ROSSO ──
       `riuscito: false` (vedi `Contesto.consegna`) è il terzo caso fra
       «fatto» e «rotto»: la fila prosegue, ma il registro non racconta
       un'apertura che non è avvenuta. Senza, questa riga finiva verde
       come «ho aperto» e — siccome il `motivo` lo portano solo le righe
       non riuscite — il piano falliva senza lasciare da nessuna parte
       la frase che lo spiega. */
    if (!this.aMano)
      return { esito: Esito.finito(), riuscito: false,
               penso: `${N} non si apre così: ci vuole un congegno`,
               siVede: 'spinge il portone' }

    /* ── SFONDARE COSTA TEMPO, CON O SENZA SERRATURA ──
       Chi ha la chiave non forza niente: apre. Il blocco vero non è «ha
       una serratura»: è «non ho un modo di aprirla comodo» — e questo
       vale tanto per un lucchetto senza chiave in tasca quanto per un
       varco senza nessuna serratura ma troppo pesante per aprirsi da
       sé. Prima `forza` contava SOLO dentro il ramo «c'è una chiave e
       non ce l'ho»: una porta sfondabile ma senza serratura si apriva
       sempre, subito, a chiunque. */
    const haChiave = this.chiave && chi.ha(this.chiave)
    const bloccata = !haChiave && (this.chiave || this.forza)
    if (bloccata) {
      if (!this.forza)
        return { esito: Esito.finito(), riuscito: false,
                 penso: `${N} è chiuso a chiave, e ${this.nomeChiave(ctx.mondo)} non ce l'ho`,
                 siVede: 'spinge il portone' }
      /* i battiti di spallate non sono un dettaglio di colore — sono la
         FINESTRA: un nemico che entra in un istante non si può fermare
         da nessun posto che non sia la porta stessa; uno che ci mette
         sei battiti si può raggiungere, e girare intorno alle mura
         comincia ad avere senso. */
      const spinte = (this.spinte[chi.id] = (this.spinte[chi.id] || 0) + 1)
      /* e sfondare fa rumore: una spallata a un portone non è più
         silenziosa di una spada. Parte una volta sola — un fracasso che
         si ripete a ogni spinta trascinerebbe mezza mappa avanti e
         indietro, come il grido. */
      if (this.rumore && !this.hafattoRumore) {
        this.hafattoRumore = true
        /* il rumore lo fa il MONDO, che sa quanto lontano arriva questo
           segnale: una porta non deve conoscere la coda dei messaggi né
           quanto si sente un fracasso. E parte da DOVE STA LA PORTA, non
           da chi la sta spingendo. */
        ctx.mondo.faiRumore({ id: chi.id, x: this.x, y: this.y }, this.rumore)
        ctx.mondo.eventi.push('allarme')
        ctx.mondo.allarmi.push({ x: this.x, y: this.y, seg: this.rumore, da: chi.id })
      }
      if (spinte < this.forza)
        return { esito: Esito.inCorso(), penso: `sto sfondando ${N}`, siVede: 'spinge il portone' }
    } else {
      /* ── E APRIRSI PIANO FA COMUNQUE RUMORE ──
         Piccolo, non grande: un cigolio, non un fracasso. È quello che
         rende due mosse diverse anche quando la porta si apre allo
         stesso identico modo — chi ha la chiave o cammina non sveglia
         mezzo castello, chi sfonda sì. Solo qui e non nel ramo di sopra:
         quel ramo, se arriva in fondo, ha già fatto rumore col fracasso
         delle spallate — un cigolio in più sarebbe un secondo suono per
         lo stesso gesto. */
      this.cigola(ctx, chi)
    }

    this.aperta = true
    ctx.mondo.versioneMappa++
    ctx.mondo.unita.forEach(z => { z._mk = null })
    ctx.mondo.eventi.push('apre')
    return { esito: Esito.finito(), penso: `aperto ${N}`, siVede: `apre ${N}` }
  }

  /* ── IL CIGOLIO ──
     Il gemello piccolo del fracasso di riga 138: si sente vicino
     (raggio 5 di default, `SEGNALI.cigolio`) e non lontano — ma si
     sente, ed è quello che rende «premi finché senti la grata aprirsi»
     una mossa scrivibile per chi il congegno lo aziona da lontano e la
     porta non la vede. `chi` è chi ha aperto camminando o con la
     chiave; `null` per un congegno — allora il rumore parte dalla porta
     stessa, non da nessuno che ci sia arrivato davanti. */
  cigola (ctx, chi) {
    const mittente = { id: chi ? chi.id : this.id, x: this.x, y: this.y }
    ctx.mondo.faiRumore(mittente, this.cigolio)
    ctx.mondo.eventi.push('allarme')
    ctx.mondo.allarmi.push({ x: this.x, y: this.y, seg: this.cigolio, da: mittente.id })
  }

  /* ── CHIUDERSI DIETRO UNA PORTA ──
     Il gemello di `apri`, ed è la porta a sapere quando si può: non si
     chiude addosso a qualcuno. Chi sta sulla soglia resterebbe murato
     dentro la sua cella, e sarebbe una cosa che succede senza che si
     veda perché.
     Sta qui e non nello switch dei verbi per la stessa ragione di
     `apri`: la serratura, le spallate e adesso anche la soglia sono
     fatti della porta, e un varco nuovo che si chiude in un altro modo
     non deve far crescere il motore. */
  chiudi (chi, ctx) {
    if (!this.aperta) return { esito: Esito.finitoSubito() }
    const N = this.nomeIn(ctx.mondo)
    const qualcuno = ctx.mondo.unita.some(z => z.eInPiedi() && z.x === this.x && z.y === this.y)
    if (qualcuno)
      return { esito: Esito.finito(), riuscito: false,
               penso: `c'è qualcuno sulla soglia: ${N} non si chiude`,
               siVede: 'spinge la porta' }
    this.aperta = false
    ctx.mondo.versioneMappa++
    ctx.mondo.unita.forEach(z => { z._mk = null })
    ctx.mondo.eventi.push('apre')
    return { esito: Esito.finito(), penso: `chiuso ${N}`, siVede: `chiude ${N}` }
  }

  nomeChiave (mondo) { return ((mondo.livello.nomi || {})[this.chiave]) || this.chiave }

  /* i cinque stili sono già dipinti in `grafica/oggetti/porte/`: qui si
     dichiara solo il fatto già deciso, in celle — `apertura` da 0 a 1
     come vuole il pittore unico (`porte/indice.js`). `alone: true`: è
     una cosa che si nomina in un ordine, non arredo dipinto sul
     fondale — l'alone la stacca da un sarcofago o una cassa finta */
  /* ── SI VEDE COM'È FATTA, NON SOLO CHE C'È ──
     `sbarrata` vuol dire «questa non si apre con nessuna chiave: o la
     butti giù, o passi da un'altra parte», e senza il disegno non lo
     dice nessuno. Nasce dal modo normale di scrivere una porta che non
     si apre — dichiararle una chiave che non esiste — che a schermo
     dava una serratura come tutte le altre: un invito a cercare una
     chiave che non c'è. Il sigillo lo mette il mondo solo quando la
     chiave esiste davvero (`sigilli()` in `allestimento.js`), quindi
     qui «ha una serratura ma nessun sigillo» è esattamente il caso da
     dipingere sbarrato. */
  faccia () {
    return [{ che: 'porta', x: this.x, y: this.y, stile: this.stile,
              apertura: this.aperta ? 1 : 0, sigillo: this.sigillo,
              sbarrata: !this.sigillo && !!this.chiave,
              sfondabile: !!this.forza, alone: true }]
  }

  scheda (ctx) {
    const m = ctx && ctx.m
    const righe = [this.aperta ? 'è aperta' : 'è chiusa']
    if (!this.aMano) righe.push('non si apre camminandoci: ci vuole un congegno')
    else if (this.chiave) righe.push(`ci vuole ${m ? this.nomeChiave(m) : this.chiave}`)
    if (this.forza) righe.push(`si può sfondare: ${this.forza} spallate`)
    return righe
  }
}
