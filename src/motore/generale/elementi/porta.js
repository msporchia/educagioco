import { Elemento } from '../elemento.js'

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
export class Porta extends Elemento {
  get tipo () { return 'porta' }
  get em () { return '🚪' }

  constructor (id, d) {
    super(id, d)
    this.chiave = d.chiave || null
    this.forza = d.forza || 0
    this.rumore = d.rumore || null
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
  }

  azzera () {
    this.aperta = this.iniziale
    this.hafattoRumore = false          // si ricomincia da capo, silenzio compreso
  }

  chiedi (q) {
    if (q === 'aperta') return this.aperta
    return null
  }

  accetta (cmd) { return cmd === 'apri' || cmd === 'chiudi' }

  /* `ctx` porta `{ m, f }`: il mondo (per il rumore e per la mappa che
     cambia) e il filo di chi sta spingendo (per contare le SUE
     spallate — due unità che spingono la stessa porta in fili diversi
     non sommano le forze, ognuna fa il suo conto). */
  ricevi (cmd, chi, ctx) {
    if (cmd === 'chiudi') return this.chiudi(chi, ctx)
    if (cmd !== 'apri') return null
    if (this.aperta) return { esito: 'subito' }
    const N = this.nomeIn(ctx.m)

    /* ── UN COMANDO DI CONGEGNO APRE SEMPRE ──
       Qui non è arrivato nessuno camminando: chi ha pagato il prezzo di
       arrivare è stato chi ha premuto la leva o toccato il totem, non
       questa porta. Chiave, forza e `aMano` restano regole di chi entra
       CAMMINANDO — è proprio per questo che `aMano:false` esiste: dice
       «non così, ci vuole un congegno», e un congegno è quello che sta
       succedendo in questo ramo. */
    if (ctx.congegno) {
      this.aperta = true
      ctx.m.versioneMappa++
      ctx.m.unita.forEach(z => { z._mk = null })
      ctx.m.eventi.push('apre')
      return { esito: 'fatto', dice: `si apre ${N}`, fatto: `si apre ${N}` }
    }

    if (!this.aMano)
      return { esito: 'salta', dice: `${N} non si apre così: ci vuole un congegno`,
               fatto: 'spinge il portone' }

    /* ── SFONDARE COSTA TEMPO, CON O SENZA SERRATURA ──
       Chi ha la chiave non forza niente: apre. Il blocco vero non è «ha
       una serratura»: è «non ho un modo di aprirla comodo» — e questo
       vale tanto per un lucchetto senza chiave in tasca quanto per un
       varco senza nessuna serratura ma troppo pesante per aprirsi da
       sé. Prima `forza` contava SOLO dentro il ramo «c'è una chiave e
       non ce l'ho»: una porta sfondabile ma senza serratura si apriva
       sempre, subito, a chiunque. */
    const haChiave = this.chiave && chi.zaino.includes(this.chiave)
    const bloccata = !haChiave && (this.chiave || this.forza)
    if (bloccata) {
      if (!this.forza)
        return { esito: 'salta',
                 dice: `${N} è chiuso a chiave, e ${this.nomeChiave(ctx.m)} non ce l'ho`,
                 fatto: 'spinge il portone' }
      /* i battiti di spallate non sono un dettaglio di colore — sono la
         FINESTRA: un nemico che entra in un istante non si può fermare
         da nessun posto che non sia la porta stessa; uno che ci mette
         sei battiti si può raggiungere, e girare intorno alle mura
         comincia ad avere senso. */
      const st = ctx.f.st
      st.spinte = (st.spinte || 0) + 1
      st.fermo = 0
      /* e sfondare fa rumore: una spallata a un portone non è più
         silenziosa di una spada. Parte una volta sola — un fracasso che
         si ripete a ogni spinta trascinerebbe mezza mappa avanti e
         indietro, come il grido. */
      if (this.rumore && !this.hafattoRumore) {
        this.hafattoRumore = true
        ctx.m.pendenti.push({ seg: this.rumore, da: chi.id, x: this.x, y: this.y, rumore: true })
        ctx.m.eventi.push('allarme')
        ctx.m.allarmi.push({ x: this.x, y: this.y, seg: this.rumore, da: chi.id })
      }
      if (st.spinte < this.forza)
        return { esito: 'lavora', dice: `sto sfondando ${N}`, fatto: 'spinge il portone' }
    }

    this.aperta = true
    ctx.m.versioneMappa++
    ctx.m.unita.forEach(z => { z._mk = null })
    ctx.m.eventi.push('apre')
    return { esito: 'fatto', dice: `aperto ${N}`, fatto: `apre ${N}` }
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
    if (!this.aperta) return { esito: 'subito' }
    const N = this.nomeIn(ctx.m)
    const qualcuno = ctx.m.unita.some(z => z.viva && z.x === this.x && z.y === this.y)
    if (qualcuno)
      return { esito: 'salta', dice: `c'è qualcuno sulla soglia: ${N} non si chiude`,
               fatto: 'spinge la porta' }
    this.aperta = false
    ctx.m.versioneMappa++
    ctx.m.unita.forEach(z => { z._mk = null })
    ctx.m.eventi.push('apre')
    return { esito: 'fatto', dice: `chiuso ${N}`, fatto: `chiude ${N}` }
  }

  nomeChiave (mondo) { return ((mondo.livello.nomi || {})[this.chiave]) || this.chiave }

  /* i cinque stili sono già dipinti in `grafica/oggetti/porte/`: qui si
     dichiara solo il fatto già deciso, in celle — `apertura` da 0 a 1
     come vuole il pittore unico (`porte/indice.js`). `alone: true`: è
     una cosa che si nomina in un ordine, non arredo dipinto sul
     fondale — l'alone la stacca da un sarcofago o una cassa finta */
  faccia () {
    return [{ che: 'porta', x: this.x, y: this.y, stile: this.stile,
              apertura: this.aperta ? 1 : 0, sigillo: this.sigillo, alone: true }]
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
