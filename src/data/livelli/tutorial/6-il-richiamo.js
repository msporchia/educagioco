/* 6 ─ IL RUMORE, e CHIUDE IL TUTORIAL. Qui il buco nel piano nemico
      non è un ordine sbagliato: è una REAZIONE. Il carceriere è fatto
      per accorrere — sta scritto nella sua scheda, si legge come un
      ordine — e il passaggio resta scoperto per tutto il tempo che ci
      mette ad andare. Quel tempo è la finestra, e la finestra è il
      livello.

      ── PERCHÉ STA NEL TUTORIAL ──
      Per un pezzo il tutorial finiva alla decisione, e questa era la
      prima prova «per allenarsi». Ma qui non si allena niente di già
      visto: si impara una REGOLA DEL MONDO che nelle cinque prove
      prima non c'è — che il rumore ha un posto, e che chi lo sente ci
      corre. Senza, da qui in avanti metà di quello che succede sullo
      schermo non si spiega: perché la guardia molla il muro, perché
      farsi vedere costa, perché conta DOVE combatti. È il sesto e
      ultimo pezzo del vocabolario, non un esercizio. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

/* UNA UNITÀ SOLA, e il livello ci guadagna. Con due, questa era la
   terza volta di fila che la lezione era «mettetevi d'accordo»; con
   una, resta solo la cosa nuova: il rumore SPOSTA il nemico, e dove lo
   fai decide dove lui non è. La ladra suona, e mentre lui va a vedere
   lei è già dall'altra parte. */
const ladra = chi.nostro('ladra', 'la ladra', { corpo: 'ladra', emoji: '🥷', vista: 2, vita: 1 })
/* non lo si tocca: quarantaquattro punti di vita sono il modo di dire
   «questa strada è chiusa» senza vietarla. Tutto il livello sta
   nell'unica riga della sua scheda: accorre. */
const carce = chi.orco('carce', 'il carceriere', { vista: 2, vita: 44, accorre: 'richiamo',
  fa: [fai.aspettaDiVedere('nostri'), fai.attacca('nostri')] })

const richiamo = cose.segnale('richiamo', 'un rumore', { em: '🔔', col: '#e8a33f' })
const chiave = cose.chiave()
const portone = cose.porta('portone', 'il portone', { chiave: 'chiave' })
const tesoro = cose.tesoro()
const dove = cose.segnaposto()

/* LE MURA — un anello attorno a una sala chiusa, con un portone solo.
   `k1`/`k2`/`k3` sono i posti dove può stare la chiave: sempre lontana
   dal portone, così il punto in cui ti trovi dopo averla raccolta è
   già una scelta. */
const MURA = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|k2|LA|..|..|..|..|..|..|..|..|..|##',
  '##|..|##|##|##|##|##|##|##|##|##|..|##',
  '##|..|##|..|..|..|..|..|..|..|##|..|##',
  '##|..|##|..|..|..|T$|..|..|..|##|..|##',
  '##|..|##|..|..|..|..|..|..|..|##|..|##',
  '##|..|##|##|##|##|p1|##|##|##|##|..|##',
  '##|k1|..|..|..|..|CA|..|..|..|..|k3|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
], { LA: ladra, CA: carce, p1: portone, 'T$': tesoro,
     k1: dove, k2: dove, k3: dove })

export const RICHIAMO = livello({
  id: 'richiamo', nome: 'Il richiamo', idea: 'Fai rumore lontano da dove devi passare',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano alla ladra</b>. Il carceriere non si batte.",
  racconto: "Con quella corazza il carceriere non lo butta giù nessuno, e la ladra cade al primo colpo. Ma lui è fatto in un modo solo, e sta scritto nella sua scheda.",
  aiuti: ['Una scheda si legge come un piano: tocca il carceriere e guarda a cosa reagisce.',
          'Corre dove sente il rumore, e ci mette un pezzo ad andare e tornare.',
          'Il rumore lo puoi fare dove vuoi — ma non dove devi passare tu.'],
  ambiente: 'camminamento',

  scena: MURA,
  segnali: [richiamo],
  /* NIENTE POSTI CON UN NOME: dove fare rumore lo scegli tu, toccando
     la cella. Prima c'era «il torrione di levante» già segnato sulla
     mappa, e la domanda del livello — dove conviene chiamarlo? — era
     già risposta nell'elenco dei bersagli. */
  celle: true,
  complementi: ['chiave', 'portone', 'tesoro', 'orchi', 'richiamo'],
  verbi: ['vai', 'prendi', 'apri', 'suona'],
  vince: [se.ha(ladra, tesoro)],
  perde: [se.caduto(ladra)],
  motivoSconfitta: 'Il carceriere ha preso la ladra.',
  mostraNemici: true,

  /* LA CHIAVE CAMBIA POSTO A OGNI SCENA, e l'ordine resta lo stesso:
     `prendi [la chiave]` la segue dovunque sia. Serve a impedire che il
     piano diventi una fila di coordinate imparate a memoria. */
  varianti: [
    { nome: 'la chiave a mezzogiorno', metti: { k1: chiave } },
    { nome: 'la chiave a due passi', metti: { k2: chiave } },
    { nome: 'la chiave in fondo a levante', metti: { k3: chiave } },
  ],

  par: 4,
  soluzioni: [
    /* QUATTRO ORDINI, e non ce n'è uno di troppo: la chiave sta sempre
       lontana dal portone, quindi il punto in cui ti trovi dopo averla
       raccolta è già un buon posto da cui chiamarlo. Suonare è un
       ordine come gli altri — quello che conta è DOVE ti trova. */
    { nome: 'lo chiama e passa', piano: { ladra: [
      fai.prendi(chiave), fai.suona(richiamo),
      fai.apri(portone), fai.prendi(tesoro),
    ] } },
    /* FRAGILE: e questa è la trappola vera. Andare a chiamarlo vicino
       al portone sembra la mossa furba — «così lo tolgo di lì» — ma il
       carceriere corre DOVE STAI TU, e la strada per tornare al portone
       è la stessa su cui lui sta arrivando. Due volte su tre te lo
       ritrovi addosso; la terza la chiave era così lontana che quando
       arrivi lui è già ripartito. */
    { nome: 'lo chiama proprio lì', fragile: true, piano: { ladra: [
      fai.prendi(chiave), fai.vai('9,7'), fai.suona(richiamo),
      fai.apri(portone), fai.prendi(tesoro),
    ] } },
  ],
})

export default RICHIAMO
