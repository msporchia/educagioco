/* 3 ─ LA RONDA. `vai [qualcuno]` non è onnisciente, ci vai solo se
      l'hai visto: ecco perché serve girare. L'orco è entrato da uno dei
      QUATTRO lati e sta in agguato — il suo piano aspetta un segnale
      che nessuno manderà, ed è il primo bug che il bambino legge.
      QUI NON SI COMANDANO GLI ORCHI. Per un pezzo questo livello
      invertiva le parti (i tuoi erano gli orchi, e il buono l'intruso):
      era un'idea buona nel posto sbagliato, perché queste prime prove
      sono il tutorial, e nel tutorial si impara chi si è. Il cavaliere
      difende la principessa, e l'orco fa l'orco.
      Le quattro varianti sono i quattro ingressi: chi si pianta su un
      lato viene fregato dagli altri tre, e non c'è modo di indovinare
      quale — è il livello che sceglie, dopo che tu hai firmato. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const cava = chi.nostro('cava', 'il cavaliere', { corpo: 'cavaliere', emoji: '🛡️', vita: 8 })
/* la principessa è QUALCUNO, non un posto: si disegna come una persona,
   non finisce fra le unità che comandi, e si può attaccare — che è
   quello che l'orco vuole fare.
   IL TEMPO STA TUTTO NELLA PORTA, non in lei. Venti spallate sono un
   giro intero delle mura: chi pattuglia fa in tempo ad arrivare da
   qualunque parte si trovi, e la principessa può reggere quanto regge
   una persona — quattro colpi — invece di diventare un sacco da boxe
   che incassa per quattordici battiti aspettando i soccorsi. */
const principessa = chi.terzo('principessa', 'la principessa',
  { corpo: 'principessa', emoji: '👸', schiera: 'corte', schieraNome: 'la corte',
    vista: 2, vita: 4 })
const fracasso = cose.segnale('fracasso', 'un fracasso', { em: '💥', col: '#e8703f' })

/* `chiave: 'sbarra'` è una chiave che non esiste: nessuno ce l'ha,
   quindi la porta non si apre — si sfonda. `forza` è quante spallate ci
   vogliono, `rumore` il segnale che parte alla prima. */
const sbarrata = (id, nome) =>
  cose.porta(id, nome, { chiave: 'sbarra', forza: 20, rumore: 'fracasso' })
const ponente = sbarrata('ponente', 'la porta di ponente')
const levante = sbarrata('levante', 'la porta di levante')

/* due ordini, e li si legge col 🕵: sfonda quella porta, poi va da lei.
   QUALE porta lo dice la SCENA, non il livello: è l'unica cosa che
   cambia fra una battaglia e l'altra, ed è esattamente quello che non
   puoi sapere prima di firmare. */
const orcoChe = porta => chi.orco(
  { vista: 3, vita: 3, fa: [fai.apri(porta), fai.vai('7,5'), fai.attacca(principessa)] })

/* LA CINTA — mura SOLO attorno alla principessa, e campo aperto tutto
   intorno. Non è una fortezza: è un cortile murato in mezzo a un prato,
   con due porte sbarrate, una a ponente e una a levante.

   Vedere, qui dentro, vuol dire «essere a pochi passi CAMMINANDO»: le
   mura non fermano lo sguardo per magia, lo fermano perché per arrivare
   dall'altra parte bisogna girarci intorno. Chi sta davanti alla porta
   di ponente non sa cosa succede a levante — e le mura esterne sono
   sparite apposta: la domanda non è «come si entra», è «da quale delle
   due».

   `o1`…`o4` sono i QUATTRO POSTI PREPARATI: gli angoli da cui l'orco
   può arrivare. La mappa li segna tutti e quattro come segnaposto, e
   ogni scena ne riempie uno — gli altri tre restano prato. */
const dove = cose.segnaposto()
const CINTA = campo([
  'o4|..|..|..|..|..|..|..|..|..|..|..|..|..|o2',
  '..|..|..|..|..|..|..|@@|..|..|..|..|..|..|..',
  '..|..|..|..|..|..|..|..|..|..|..|..|..|..|..',
  '..|..|..|..|##|##|##|##|##|##|##|..|..|..|..',
  '..|..|..|..|##|..|..|..|..|..|##|..|..|..|..',
  '..|..|..|..|p1|..|..|PR|..|..|p2|..|..|..|..',
  '..|..|..|..|##|..|..|..|..|..|##|..|..|..|..',
  '..|..|..|..|##|##|##|##|##|##|##|..|..|..|..',
  '..|..|..|..|..|..|..|..|..|..|..|..|..|..|..',
  '..|..|..|..|..|..|..|..|..|..|..|..|..|..|..',
  'o1|..|..|..|..|..|..|..|..|..|..|..|..|..|o3',
], { '@@': cava, 'PR': principessa, 'p1': ponente, 'p2': levante,
     o1: dove, o2: dove, o3: dove, o4: dove })

export const RONDA = livello({
  id: 'ronda', nome: 'Il giro delle mura', idea: 'Due porte, e una sola sentinella',
  dritta: "Obiettivo: <b>l'orco non deve arrivare alla principessa</b>.",
  racconto: "Per buttare giù una porta l'orco ci mette venti spallate, e si sente. Da che parte prova <b>cambia a ogni battaglia</b> — e da una porta non si vede l'altra.",
  aiuti: ['Le mura in mezzo tolgono la vista: quello che succede dall\'altra parte lo sai solo andandoci.',
          'Sfondare costa tempo. Non devi essere già lì: devi arrivarci prima che abbia finito.',
          'Fermo in un posto ne copri uno solo. C\'è un ordine che ne copre più di uno, e che si ferma quando dici tu.'],
  ambiente: 'cortile', prove: 4,
  /* il prato non ha un muro attorno, ed è la scena: chiudere anche il
     perimetro farebbe un labirinto, e la domanda del livello non è
     «come si entra» ma «da quale delle due porte» */
  campoAperto: true,

  scena: CINTA,

  celle: true,
  segnali: [fracasso],
  complementi: ['orchi', 'principessa', 'ponente', 'levante', 'fracasso'],
  /* muoversi e menare, e basta: il giro non si chiede qui perché non è
     un verbo — `ripeti` è un BLOCCO, e i blocchi non passano da questa
     lista. (C'era ancora scritto `pattuglia`, che era il verbo di
     quando il ciclo era nascosto dentro un ordine solo: non esiste più,
     e `verbiDi` lo scartava in silenzio.)
     Il fracasso si sente ma non si ascolta ancora: «quando senti» è del
     livello dopo. */
  verbi: ['vai', 'attacca'],
  vince: [se.caduto('orco')],
  perde: [se.caduto('principessa')],
  motivoSconfitta: "L'orco è arrivato alla principessa.",
  mostraNemici: true,

  /* i quattro ingressi: da dove arriva e quale porta sfonda. Chi si
     pianta su un lato ne indovina due su quattro. */
  varianti: [
    { nome: 'da mezzogiorno, e sfonda a ponente', metti: { o1: orcoChe(ponente) } },
    { nome: 'da tramontana, e sfonda a levante', metti: { o2: orcoChe(levante) } },
    { nome: 'da mezzogiorno, e sfonda a levante', metti: { o3: orcoChe(levante) } },
    { nome: 'da tramontana, e sfonda a ponente', metti: { o4: orcoChe(ponente) } },
  ],

  /* IL PAR CONTA QUELLO CHE HAI SCRITTO: il ciclo si vede tutto — il
     blocco e i due «vai» che ha dentro — più l'attacco. */
  par: 4,
  soluzioni: [
    { nome: 'il giro delle due porte', piano: { cava: [
      fai.giro(['2,5', '12,5'], se.vedi('orchi')), fai.attacca('orchi'),
    ] } },
    /* FRAGILE: un giro fatto di UN punto solo è un modo elegante di
       stare fermi. Presidia una porta e vince le due battaglie in cui
       l'orco sceglie quella — nelle altre due lo sente sfondare
       dall'altra parte e non fa in tempo. */
    { nome: 'di guardia a una porta sola', fragile: true, piano: { cava: [
      fai.giro(['2,5'], se.vedi('orchi')), fai.attacca('orchi'),
    ] } },
  ],
})

export default RONDA
