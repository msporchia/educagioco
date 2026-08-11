/* 4 ─ IL SEGNALE. Nessuno è onnisciente: l'eroe non può sapere che
      l'orco è caduto se non l'ha visto. Glielo deve DIRE il cavaliere —
      ed è il messaggio al posto della variabile globale, cioè come si
      mettono d'accordo davvero due che non si vedono. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

/* ── CHI SA COSA, E PERCHÉ ──
   UN SOLO DIVIETO, E CON LA SUA RAGIONE. L'eroe sa tutto, attaccare
   compreso: il divieto non serviva, la conseguenza sì — con due vite
   contro otto «ci penso io» finisce male, e perderci insegna più di un
   tasto che non c'è. Il cavaliere invece non raccoglie niente, e quella
   è una regola vera: se potesse prendere lui il tesoro basterebbe
   un'unità sola e non ci sarebbe niente da mettere d'accordo — ma
   allora deve dirlo lui perché, e la scusa sta scritta qui accanto. */

/* L'EROE VEDE L'ORCO DA DOV'È (vista 6, più della distanza che li
   separa): qui l'orco è in mezzo alla strada, allo scoperto, e un
   «attacca» che rispondesse «non so dov'è» a qualcuno che sta guardando
   in faccia sembrerebbe un guasto. Che ci vada e ci rimetta la pelle è
   proprio la lezione. */
const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'ladra', emoji: '🦸', vista: 6, vita: 2 })
const cava = chi.nostro('cava', 'il cavaliere', { corpo: 'cavaliere', emoji: '🛡️',
  vista: 12, vita: 6, nonRiesce: { prendi: 'ho le mani occupate: scudo e spada' } })
const orco = chi.orco({ vista: 3, vita: 8,
  fa: [fai.aspettaDiVedere(eroe), fai.attacca(eroe)] })

const tesoro = cose.tesoro()
const viaLibera = cose.segnale('viaLibera', 'via libera', { em: '⚔️', col: '#3fb872' })
const dove = cose.segnaposto()

/* le due corti di sempre, e l'orco in mezzo alla strada. `t1`/`t2`/`t3`
   sono i posti dove può stare il tesoro, `o1`/`o2`/`o3` quelli
   dell'orco: ogni scena ne riempie uno per tipo. */
const CORTI = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|##|..|..|..|t3|t1|##',
  '##|..|..|..|..|..|##|o2|..|..|..|..|##',
  '##|..|EE|..|..|..|..|o1|o3|..|..|..|##',
  '##|..|..|..|..|..|##|..|..|..|..|..|##',
  '##|..|CC|..|..|..|##|..|..|..|..|t2|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
], { EE: eroe, CC: cava, o1: dove, o2: dove, o3: dove,
     t1: dove, t2: dove, t3: dove })

export const ATTESA = livello({
  id: 'attesa', nome: 'Mettetevi d\'accordo', idea: 'Quello che non vedi te lo deve dire qualcuno',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>.",
  racconto: "L'eroe non regge i colpi dell'orco; il cavaliere sì, ma ci mette un po'. E da dov'è l'eroe, quello che succede laggiù non si vede.",
  aiuti: ['Chi parte troppo presto trova l\'orco ancora in piedi.',
          'L\'eroe non vede il cavaliere: da solo non può accorgersi che ha finito.',
          'Quello che uno non può vedere, qualcun altro glielo può dire.'],
  ambiente: 'cortile',

  scena: CORTI,
  segnali: [viaLibera],
  complementi: ['tesoro', 'orchi', 'viaLibera'],
  /* quattro verbi bastano a fare tutto quello che questo livello
     chiede: muoversi, prendere, menare, e mettersi d'accordo. */
  verbi: ['vai', 'prendi', 'attacca', 'suona', 'quando'],
  vince: [se.ha(eroe, tesoro)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: "L'orco ha preso l'eroe.",
  mostraNemici: true,

  varianti: [
    { nome: "l'orco sulla porta", metti: { o1: orco, t1: tesoro } },
    { nome: "l'orco più in alto", metti: { o2: orco, t2: tesoro } },
    { nome: "l'orco più avanti", metti: { o3: orco, t3: tesoro } },
  ],

  par: 4,
  soluzioni: [
    { nome: 'uno suona, l\'altro parte', piano: {
      cava: [fai.attacca('orchi'), fai.suona(viaLibera)],
      eroe: [fai.quando(viaLibera, fai.prendi(tesoro))],
    } },
    /* ADESSO CI SI PUÒ PROVARE, E SI PERDE. Da quando l'eroe sa
       attaccare, «ci penso io» è una mossa scrivibile — e con due vite
       contro otto finisce come deve finire, in tutte e tre le scene. Non
       sta fra le soluzioni: una `fragile` è un piano che a volte regge,
       e questo non regge mai. Che perda sempre è il punto, e lo si
       scopre premendo ▶. */
  ],
})

export default ATTESA
