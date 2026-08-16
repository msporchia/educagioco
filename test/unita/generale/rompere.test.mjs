/* ═══════════════════════════════════════════════════════════════════
   ATTACCA SULLE COSE — il sabotaggio, e il dire QUALE
     node test/esegui.mjs rompere --niente-build

   Due cose che mancavano allo stesso verbo, e si provano insieme
   perché sono lo stesso verbo:

     1. `attacca` prendeva solo unità. «Sfonda il tamburo», «butta giù
        la scala» non erano scrivibili, e i capitoli che ci si
        reggevano diventavano altro — il tamburo «portato via» invece
        che rotto. Adesso una cosa a cui il livello scrive addosso una
        `resistenza` si può menare, e quello che le succede lo sa lei
        (`Elemento.incassa`).
     2. `attacca [una schiera]` sceglieva sempre il più vicino, e non
        c'era modo di dire quale. Adesso l'ordine porta un `quale`
        (`motore/generale/scelte.js`), che è un CRITERIO e non un nome:
        «il più lontano» regge tre scene diverse, «quello laggiù» no.

   Le partite si giocano davvero: un livello costruito qui dentro,
   `esegui`, e si guarda chi è rimasto in piedi.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, riassunto } from '../../aiuto/verifica.mjs'
import { livello, campo, cose, chi, fai, se } from '../../../src/data/livelli/scrivi.js'
import { creaMondo, esegui, verbiDi, guaiDi, VERBI } from '../../../src/motore/generale.js'
import { LIVELLI } from '../../../src/data/generale.js'

const gioca = (liv, piano) => esegui(creaMondo(liv, 0), piano)
const detto = e => e.traccia.map(r => r.testo).join(' | ')
/* `resistenza` è un dato del motore che le fabbriche di `scrivi.js` non
   elencano ancora fra le opzioni: qui si stende sopra il biglietto già
   fatto, che è quello che un livello scriverà come opzione il giro
   dopo. La cosa che ne esce è identica. */
const rompibile = (cosa, n) => ({ ...cosa, resistenza: n })

/* ═══════════ 1. il tamburo si sfonda ═══════════ */
{
  const eroe = chi.eroe()
  const tamburo = rompibile(cose.oggetto('tamburo', 'il tamburo', { pittore: 'campana' }), 2)
  const chiave = cose.chiave()

  const LIV = livello({
    id: 'prova-rompi-tamburo', nome: 'Il tamburo', prove: 0,
    scena: campo([
      '##|##|##|##|##|##|##',
      '##|@@|..|..|d1|..|##',
      '##|..|k1|..|..|..|##',
      '##|##|##|##|##|##|##',
    ], { '@@': eroe, 'd1': tamburo, 'k1': chiave }),
    vince: [{ cond: 'rotto', complemento: 'tamburo' }],
  })

  const e = gioca(LIV, { eroe: [fai.attacca(tamburo)] })
  controlla('rompere: si va fin lì e lo si sfascia', e.vinto, e.motivo)
  controlla('rompere: e il viaggio si racconta come quello che è',
            detto(e).includes('vado a rompere il tamburo'), detto(e))
  controlla('rompere: con più resistenza di un colpo ci vuole più di un battito',
            detto(e).includes('sto rompendo'), detto(e))
  controlla('rompere: sfasciare fa fracasso', e.mondo.segnaliMandati.includes('fracasso'),
            e.mondo.segnaliMandati.join(','))

  /* il piano vuoto no, e nemmeno andarci soltanto: è la differenza fra
     «l'ho raggiunto» e «l'ho rotto» */
  controlla('rompere: andarci e basta non rompe niente', !gioca(LIV, { eroe: [fai.vai(tamburo)] }).vinto)

  /* ── e quello che è rotto non si raccoglie ──
     È il senso del sabotaggio: non «portalo via», proprio «non serve
     più a niente». Lo stesso campo, ma la scena non si chiude appena il
     tamburo cede: se no il secondo ordine non lo eseguirebbe nessuno. */
  const ANCORA = livello({ ...LIV, id: 'prova-rompi-ancora', vince: [se.ha(eroe, chiave)] })
  const dopo = gioca(ANCORA, { eroe: [fai.attacca(tamburo), fai.prendi(tamburo), fai.prendi(chiave)] })
  controlla('rompere: quello che è rotto non si raccoglie',
            detto(dopo).includes('non serve più a niente'), detto(dopo))
  controlla('rompere: ma il rifiuto non ferma la fila', dopo.vinto, dopo.motivo)

  /* ── LA CHIAVE NON SI ROMPE ──
     Non perché sia una chiave: perché il livello non le ha scritto
     addosso nessuna `resistenza`. E siccome non lo capisce, non compare
     nemmeno fra i bersagli — un verbo in più in cassetta è una cosa in
     più da escludere prima di trovare quella giusta. */
  const m = creaMondo(LIV, 0)
  uguale('rompere: fra i bersagli di attacca ci sono solo le cose rompibili',
         m.nomi('attacca').filter(k => k !== 'eroe' && k !== 'nostri').join(','), 'tamburo')
  uguale('rompere: e quelli di prendi restano tutti',
         m.nomi('prendi').sort().join(','), 'chiave,tamburo')
  controlla('rompere: un ordine che nomina una cosa che non si rompe viene rifiutato',
            guaiDi(creaMondo(LIV, 0), { eroe: [fai.attacca(chiave)] }).length > 0)

  /* e la scena si rigioca da capo: la rottura non resta appiccicata al
     dato del livello */
  controlla('rompere: rigiocando il tamburo è di nuovo intero',
            gioca(LIV, { eroe: [fai.vai(chiave)] }).mondo.cose.tamburo.rotto === false)
}

/* ═══════════ 2. una leva sabotata non comanda più ═══════════ */
{
  const eroe = chi.eroe()
  const nemico = chi.nemico('bruto', 'il bruto', { vista: 0, sa: ['vai'] })
  const leva = rompibile(cose.leva('leva', 'la leva', { collegata: ['grata'] }), 1)
  const grata = cose.grata('grata', 'la grata', { aMano: false })
  const tesoro = cose.forziere()

  const LIV = livello({
    id: 'prova-rompi-leva', nome: 'La leva', prove: 0,
    scena: campo([
      '##|##|##|##|##|##|##',
      '##|@@|..|L1|..|..|##',
      '##|##|##|g1|##|##|##',
      '##|b1|..|T$|..|..|##',
      '##|##|##|##|##|##|##',
    ], { '@@': eroe, 'L1': leva, 'g1': grata, 'T$': tesoro, 'b1': nemico }),
    vince: [{ cond: 'rotto', complemento: 'leva' }],
  })

  const e = gioca(LIV, { eroe: [fai.attacca(leva)] })
  controlla('rompere: anche un congegno si sfascia', e.vinto, e.motivo)

  /* stessa scena, ma si vince aprendo il forziere: così dopo il
     sabotaggio la partita continua e si vede che la leva è morta */
  const OLTRE = livello({ ...LIV, id: 'prova-rompi-leva-oltre', vince: [se.aperto(tesoro)] })
  const poi = gioca(OLTRE, { eroe: [fai.attacca(leva), fai.premi(leva), fai.apri(tesoro)] })
  controlla('rompere: e una leva rotta non si preme più',
            detto(poi).includes('non si muove più'), detto(poi))
  controlla('rompere: quindi la grata resta chiusa', !poi.mondo.cose.grata.aperta)
  controlla('rompere: e chi è di qua non arriva più al forziere', !poi.vinto, poi.motivo)

  /* senza sabotaggio la leva funziona: è la prova che il livello non
     era rotto di suo */
  const intera = gioca(OLTRE, { eroe: [fai.premi(leva), fai.apri(tesoro)] })
  controlla('rompere: e senza sabotaggio la stessa leva apre la grata', intera.vinto, intera.motivo)
}

/* ═══════════ 3. QUALE di loro ═══════════ */
{
  const bea = chi.nostro('bea', 'Bea', { vista: 9 })
  const vicino = chi.nemico('vicino', "l'orco di qua",
                            { schiera: 'orchi', vista: 0, vita: 1, sa: ['vai'] })
  const lontano = chi.nemico('lontano', "l'orco di là",
                             { schiera: 'orchi', vista: 0, vita: 1, sa: ['vai'] })

  const LIV = livello({
    id: 'prova-quale', nome: 'Quale di loro', prove: 0,
    scena: campo([
      '##|##|##|##|##|##|##|##|##|##',
      '##|bb|..|..|v1|..|..|..|l2|##',
      '##|##|##|##|##|##|##|##|##|##',
    ], { 'bb': bea, 'v1': vicino, 'l2': lontano }),
    /* il gruppo va ripulito ESATTAMENTE dal fondo: quello di qua deve
       restare in piedi. È l'unico modo di dimostrare che il criterio ha
       scelto, invece di indovinare guardando chi è caduto per primo. */
    vince: [{ cond: 'entrambe', fra: [se.caduto(lontano), se.vivo(vicino)] }],
  })

  const senza = gioca(LIV, { bea: [fai.attacca('orchi')] })
  controlla('quale: senza criterio si va sempre sul più vicino', !senza.vinto, senza.motivo)
  controlla('quale: e infatti cade quello di qua', !senza.mondo.perId.vicino.eInPiedi())

  const lontanoPrima = gioca(LIV, { bea: [{ verbo: 'attacca', complemento: 'orchi', quale: 'lontano' }] })
  controlla('quale: «il più lontano» scavalca quello che ha sotto il naso',
            lontanoPrima.vinto, lontanoPrima.motivo)

  const vicinoPrima = gioca(LIV, { bea: [{ verbo: 'attacca', complemento: 'orchi', quale: 'vicino' }] })
  controlla('quale: e «il più vicino» è quello che si faceva già',
            !vicinoPrima.mondo.perId.vicino.eInPiedi())

  /* ── E IL PAREGGIO NON FA PIÙ OSCILLARE NESSUNO ──
     Difetto vecchio, che il criterio ha solo fatto venire a galla: la
     preda si sceglieva una volta per il COLPO ma non per il PASSO, e
     con due bersagli equidistanti chi li inseguiva faceva avanti e
     indietro fra i due finché la scena non scadeva. */
  const PARI = livello({
    id: 'prova-quale-pari', nome: 'Due a pari distanza', prove: 0,
    scena: campo([
      '##|##|##|##|##|##|##|##|##',
      '##|v1|..|..|bb|..|..|l2|##',
      '##|##|##|##|##|##|##|##|##',
    ], { 'bb': bea, 'v1': vicino, 'l2': lontano }),
    vince: [se.caduto('orchi')],
  })
  const pari = gioca(PARI, { bea: [fai.attacca('orchi'), fai.attacca('orchi')] })
  controlla('quale: con due a pari distanza si sceglie e si va, non avanti e indietro',
            pari.vinto, `${pari.motivo} (${pari.passi} passi)`)

  /* un criterio inventato non si esegue in silenzio: lo dice */
  const storto = gioca(LIV, { bea: [{ verbo: 'attacca', complemento: 'orchi', quale: 'quellobello' }] })
  controlla('quale: un criterio che non esiste lo dice invece di fare a caso',
            detto(storto).includes('non so quale scegliere'), detto(storto))
}

/* ═══════════ 4. e il criterio vale per ogni verbo che punta a una schiera ═══════════ */
{
  const bea = chi.nostro('bea', 'Bea', { vista: 9 })
  const qua = chi.terzo('qua', 'la capra di qua', { schiera: 'capre', vista: 0 })
  const la = chi.terzo('la', 'la capra di là', { schiera: 'capre', vista: 0 })

  /* «arrivata» si misura su una cella con un nome: a un'unità ci si
     ferma ACCANTO, quindi il traguardo è la casella davanti a lei */
  const laggiu = cose.posto('laggiu', 'laggiù')

  const LIV = livello({
    id: 'prova-quale-vai', nome: 'Vai dalla più lontana', prove: 0,
    scena: campo([
      '##|##|##|##|##|##|##|##|##|##',
      '##|bb|..|..|q1|..|..|zz|l2|##',
      '##|##|##|##|##|##|##|##|##|##',
    ], { 'bb': bea, 'q1': qua, 'zz': laggiu, 'l2': la }),
    vince: [se.qui(bea, laggiu)],
  })
  const e = gioca(LIV, { bea: [{ verbo: 'vai', complemento: 'capre', quale: 'lontano' }] })
  controlla('quale: sta sul tronco comune, quindi vale anche per «vai»', e.vinto, e.motivo)
  controlla('quale: senza, ci si ferma alla prima', !gioca(LIV, { bea: [fai.vai('capre')] }).vinto)
}

/* ═══════════ 5. e nei livelli di oggi la cassetta non è cambiata di una voce ═══════════
   `attacca` adesso accetta anche gli oggetti e i congegni, e quello è un
   allargamento che si vede a schermo: se il filtro di `Mondo.nomi` non
   tenesse, il verbo comparirebbe in mezzo tutorial — nel livello che
   insegna «prima la chiave, poi il portone» ci sarebbe una spada da
   escludere prima di trovare la risposta. Qui si confronta, livello per
   livello e scena per scena, con le liste di prima. */
{
  /* le liste `accetta` com'erano prima di questo giro */
  const PRIMA = { ...Object.fromEntries(Object.entries(VERBI).map(([v, V]) => [v, V.accetta])),
                  attacca: ['unita', 'fazione'] }
  const scene = liv => ((liv.varianti || []).length ? liv.varianti.map((_, i) => i) : [0])
  const cambiate = []
  for (const liv of LIVELLI)
    for (const iv of scene(liv)) {
      const m = creaMondo(liv, iv)
      for (const v of Object.keys(VERBI)) {
        const adesso = m.nomi(v).join(',')
        const prima = m.nominabili().filter(k => PRIMA[v].includes(m.cose[k].tipo)).join(',')
        if (adesso !== prima) cambiate.push(`${liv.id}/${iv} ${v}: [${prima}] → [${adesso}]`)
      }
    }
  controlla(`rompere: nei ${LIVELLI.length} livelli di oggi la cassetta è identica a prima`,
            !cambiate.length, cambiate.slice(0, 4).join(' ⏐ '))
}

riassunto('rompere')
