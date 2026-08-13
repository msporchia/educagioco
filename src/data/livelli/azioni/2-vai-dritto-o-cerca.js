/* 2 ─ IL CICLO DENTRO IL BIVIO. Il rovescio del livello prima: lì si
      decideva a ogni tappa di un giro che girava comunque; qui si
      decide UNA volta, all'ingresso, se il giro serve affatto.

      DAL VARCO SI VEDE DRITTO UN NASCONDIGLIO SOLO: se l'orco è
      proprio lì, non serve cercare — ci si va dritti. Se non è lì, non
      vuol dire che non c'è: vuol dire che è in uno dei due nascondigli
      dietro l'angolo, e tocca girare a cercarlo. «Nell'altro ramo si va
      dritti» si legge alla lettera: il ramo del vero è VUOTO, perché
      «attacca» ci arriva da solo — è la stessa mossa di «Due strade».

      ── E UN CICLO NON ENTRA IN UN RAMO, DIRETTAMENTE ──
      Stessa regola del livello prima, letta dall'altro verso: il
      motore rifiuta un ciclo scritto dentro il ramo di un bivio
      («dentro un ciclo non ci va un altro blocco» vale anche al
      contrario). Si scrive il giro come un'AZIONE a sé («cerca») e il
      ramo del falso la richiama con `esegui`: la riga che si legge è
      ❓ lo vedi? → sì: niente, no: ▶️ cerca. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'cavaliere', emoji: '🛡️', vista: 4, vita: 6 })
/* reattivo: se lo vede, l'orco reagisce. Ma non gli va incontro da
   solo — sta di guardia al suo nascondiglio, e finché non lo trovi non
   sa che ci sei. */
const orco = chi.orco({ vista: 3, vita: 3,
  fa: [fai.aspettaDiVedere('eroe'), fai.attacca('eroe')] })
const tesoro = cose.tesoro()
const dove = cose.segnaposto()

/* IL VARCO E LA SALA — dal varco (dove parte l'eroe) si vede dritto il
   nascondiglio «n1», che è vicino e in linea. Gli altri due, «n2» e
   «n3», sono lontani e ai lati opposti della sala: dal varco non si
   vedono, e non si vedono nemmeno fra loro — bisogna passare
   dall'uno all'altro per essere sicuri. Il tesoro sta oltre, al
   sicuro solo quando l'orco, ovunque fosse, è caduto. */
const SALA = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|..|..|..|..|..|n2|..|..|##',
  '##|@@|..|n1|..|..|T$|..|..|..|..|..|..|..|##',
  '##|..|..|..|..|..|..|..|..|..|..|n3|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
], { '@@': eroe, n1: dove, n2: dove, n3: dove, 'T$': tesoro })

export const VAI_DRITTO_O_CERCA = livello({
  id: 'giro-vai-dritto-o-cerca', nome: 'Vai dritto, o cerca',
  idea: "Guarda una volta: se lo vedi, vai dritto — se no, cerca",
  dritta: "Obiettivo: <b>l'orco deve cadere</b>, e il tesoro finire in mano all'eroe.",
  racconto: "Dal varco si vede dritto un solo nascondiglio. Dove sia l'orco davvero <b>cambia a ogni battaglia</b>: a volte è proprio lì, a volte tocca cercarlo più in là.",
  aiuti: ["Guarda subito, dal varco: uno dei tre nascondigli lo vedi da lì.",
          "Se non lo vedi da qui, non è sparito: è in uno degli altri due.",
          "Un ramo può non fare niente: se lo vedi già, non serve altro che colpire."],
  ambiente: 'cripta',

  scena: SALA,
  celle: true,
  complementi: ['orchi', 'tesoro'],
  condizioni: [se.vedi('orchi'), se.nonVedi('orchi')],
  verbi: ['vai', 'attacca', 'prendi', 'esegui'],
  vince: [se.caduto('orco'), se.ha(eroe, tesoro)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: "L'orco ha preso l'eroe.",
  mostraNemici: true,

  varianti: [
    { nome: "l'orco proprio davanti", metti: { n1: orco } },
    { nome: "l'orco al nascondiglio lontano, in alto", metti: { n2: orco } },
    { nome: "l'orco al nascondiglio lontano, in basso", metti: { n3: orco } },
  ],

  /* IL PAR: l'azione «cerca» (il ciclo dentro) più il bivio che la
     richiama, più i due ordini finali — attacca e prendi. */
  par: 8,
  soluzioni: [
    { nome: 'guarda, e solo se serve cerca', piano: { eroe: [
      fai.azione('cerca', [
        fai.ripeti([fai.vai('11,1'), fai.vai('11,3')], se.vedi('orchi')),
      ]),
      fai.bivio(se.vedi('orchi'), [], [fai.esegui('cerca')]),
      fai.attacca('orchi'),
      fai.prendi(tesoro),
    ] } },

    /* FRAGILE: sempre dritto, senza mai guardarsi intorno. Vince
       l'unica battaglia in cui l'orco è già davanti, nelle altre due
       l'eroe non lo trova mai e il tesoro resta sotto minaccia. */
    { nome: 'sempre dritto, senza cercare', fragile: true, piano: { eroe: [
      fai.attacca('orchi'),
      fai.prendi(tesoro),
    ] } },
  ],
})

export default VAI_DRITTO_O_CERCA
