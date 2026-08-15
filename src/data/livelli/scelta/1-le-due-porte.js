/* 1 ─ LE DUE PORTE, cioè IL BIVIO CON I DUE RAMI PIENI. Nel quinto
      tutorial («due strade») un ramo era vuoto: chi non vedeva l'orco
      non doveva scrivere niente, perché la strada di sopra è quella
      che `prendi` prende da sé. Qui invece le due strade chiedono due
      GESTI DIVERSI: di sotto c'è una porta chiusa a chiave, di sopra
      no. Vedere l'orco non basta più a dire cosa fare — dice anche
      QUANTI ordini servono.

      La mappa è la stessa di «due strade» (stessa corte, stesso
      cammino doppio), e non è un caso: il costrutto non cambia, cambia
      SOLO il mondo — una regola alla volta, come vuole la didattica.
      L'unica aggiunta è la porta di sotto e la sua chiave, appoggiata
      nella corte dove si parte.

      ── PERCHÉ LA CHIAVE STA VICINO A CASA, E NON IN FONDO ALLA STRADA ──
      Se la chiave fosse in fondo al camminamento di sotto, prenderla
      richiederebbe comunque attraversare la zona pericolosa quando
      l'orco è di sopra — e la lezione si confonderebbe con quella del
      quarto tutorial (due che si mettono d'accordo). Qui la chiave si
      raccoglie SEMPRE in sicurezza, vicino a dove si parte: quello che
      cambia da un ramo all'altro è solo se serve, non se costa caro
      prenderla.

      ── E LA PORTA CHIUSA NASCONDE L'ORCO DI SOTTO ──
      «Una porta chiusa acceca tutti e due i lati» (mappa.js): finché
      resta chiusa, quello che sta oltre non si vede. Non serve nessuna
      distanza speciale per tenere nascosto l'orco quando sta di sotto —
      la porta stessa lo nasconde, sempre, prima ancora che qualcuno la
      apra. `se.vedi(orchi)` quindi vede l'orco SOLO quando sta di
      sopra: se non lo vede, per esclusione sta di sotto — dietro la
      porta — ed è per questo che si può scegliere di andarci a prendere
      la chiave prima ancora di sapere con certezza cosa c'è oltre. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'ladra', emoji: '🦸', vista: 6, vita: 1 })
/* stessa soglia stretta del quinto tutorial: due passi di vista, e sta
   nel camminamento, non appoggiato alla porta — chi passa dall'altra
   parte è affare di qualcun altro */
const orco = chi.orco({ vista: 2, vita: 9,
  fa: [fai.aspettaDiVedere(eroe), fai.attacca(eroe)] })

const tesoro = cose.tesoro()
/* di sopra non c'è nessuna porta: si cammina e basta, come nel quinto
   tutorial. Resta un `posto` con un nome, solo per potercisi mandare
   con un `vai` esplicito quando è quella la strada giusta. */
const sopra = cose.posto('portaSopra', 'la porta di sopra')
/* di sotto sì: chiusa a chiave, niente spallate. Il `vai` esplicito non
   serve — chi la apre ci cammina da solo, come alla dispensa del primo
   capitolo del cortile */
const chiaveSotto = cose.chiave('chiaveSotto', 'la chiave di sotto')
const sotto = cose.porta('portaSotto', 'la porta di sotto', { chiave: 'chiaveSotto' })
const dove = cose.segnaposto()

const DUE_CORTI = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|##|##|##|##|##|##|##',
  '##|..|EE|..|kc|..|ps|..|oa|..|..|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|t3|##',
  '##|..|..|..|..|..|##|##|##|##|##|t1|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|t2|##',
  '##|..|..|..|..|..|##|##|##|##|##|..|##',
  '##|..|..|..|..|..|pg|..|ob|..|..|..|##',
  '##|..|..|..|..|..|##|##|##|##|##|##|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
], { EE: eroe, ps: sopra, pg: sotto, kc: chiaveSotto,
     oa: dove, ob: dove, t1: dove, t2: dove, t3: dove })

export const LE_DUE_PORTE = livello({
  id: 'scelta-due-porte', nome: 'Le due porte',
  idea: 'Le due strade non chiedono lo stesso lavoro',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. E l'eroe cade al primo colpo.",
  racconto: "L'orco sta a una delle due porte, e <b>cambia a ogni battaglia</b>. La porta di sotto è chiusa a chiave: quella di sopra no.",
  aiuti: ["Guarda prima di scegliere: da qui vedi solo la strada di sopra.",
          "Se non lo vedi, sta dietro la porta chiusa — e quella porta va aperta, non spinta.",
          "La chiave di sotto sta qui vicino, non in fondo alla strada: prenderla è sempre sicuro."],
  ambiente: 'cripta',

  scena: DUE_CORTI,
  complementi: ['portaSopra', 'portaSotto', 'chiaveSotto', 'tesoro', 'orchi'],
  condizioni: [se.vedi('orchi'), se.nonVedi('orchi')],
  verbi: ['vai', 'prendi', 'apri'],
  vince: [se.ha(eroe, tesoro)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: "L'eroe è finito addosso all'orco.",
  mostraNemici: true,

  varianti: [
    { nome: "l'orco sulla strada di sopra", metti: { oa: orco, t1: tesoro } },
    { nome: "l'orco sulla strada di sotto", metti: { ob: orco, t2: tesoro } },
    { nome: "l'orco di sopra, tesoro in alto", metti: { oa: orco, t3: tesoro } },
  ],

  soluzioni: [
    /* se lo vedo di sopra, la strada di sotto è quella buona — ma è
       chiusa: prima la chiave, poi la porta. Se non lo vedo, la strada
       di sopra è già libera e `prendi` ce la porta da sola. */
    { nome: 'guarda, poi scegli', piano: { eroe: [
      fai.bivio(se.vedi('orchi'), [fai.prendi(chiaveSotto), fai.apri(sotto)]),
      fai.prendi(tesoro),
    ] } },

    /* FRAGILE: «passo sempre di là», la mossa che indovina di questa
       campagna. Vince le due scene in cui l'orco sta davvero di sopra
       (di sotto: chiave, porta, tesoro — tre ordini in più del par) e
       nella terza va a sbattere contro l'orco di sotto, perché non ha
       guardato. */
    { nome: 'sempre di sotto, chiave in tasca', fragile: true, piano: { eroe: [
      fai.prendi(chiaveSotto), fai.apri(sotto), fai.prendi(tesoro),
    ] } },
  ],

  verifiche: { nonInFila: true },
})

export default LE_DUE_PORTE
