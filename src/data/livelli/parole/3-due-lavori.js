/* 3 ─ I FERRI DELLA LADRA. Fin qui un piano era una fila sola. Qui sono
      DUE — una per ogni unità del giocatore — e non si parlano: nessun
      segnale, nessuna attesa scritta. È il parallelismo PRIMA della
      sincronizzazione (§3 della didattica: «il bivio è più semplice del
      ciclo, e il ciclo è enormemente più semplice di due processi che
      si sincronizzano»).

      ── LA STORIA, CHE PRIMA NON C'ERA ──
      Al forte hanno sequestrato alla ladra i suoi ferri — il sacco e i
      pugnali — e li hanno chiusi nel deposito. Ci vanno insieme, lei e
      il cavaliere. E non è una spartizione di comodo: **nessuno dei due
      sa fare la metà dell'altro**, e lo dicono loro.

        · il cavaliere ha **zero mani libere**: in una c'è lo scudo,
          nell'altra la spada, e posarle vuol dire restare indifeso.
          Passa accanto alla roba e non la raccoglie;
        · la ladra pesa quaranta chili. Un portone da sfondare non lo
          smuove, e il coperchio di un forziere nemmeno.

      Era «due unità, due lavori», e la domanda che si faceva chiunque
      lo guardasse era *perché non fa tutto la ladra?* — perché i due
      lavori erano gemelli, e una gemma che il cavaliere «non riesce» a
      raccogliere è una regola che nessuno si beve. Adesso quello che
      lei non può fare è **buttare giù**, e quello che lui non può fare
      è **portare via roba ingombrante**: due frasi che un bambino di
      sei anni trova ovvie prima ancora di provarle.

      Sono `nonRiesce`, non `sa` (`motore/generale/vocabolario.js`): il
      verbo resta in cassetta, l'ordine si scrive, e il rifiuto arriva a
      scena avviata **con la sua ragione detta**. Un divieto muto sembra
      un capriccio del gioco; un ordine che fallisce parlando lascia
      «ah, allora ci deve andare l'altra» — che è tutta la lezione.

      ── E LE DUE FILE SI INCROCIANO SENZA DIRSELO ──
      La roba della ladra sta in fondo, dietro il portone del forte E
      dietro la grata del deposito: due cose che apre solo lui. Lei parte
      lo stesso e arriva davanti a quello che è ancora chiuso, e ci
      resta sopra — **un ordine che non riesce non è un ordine perso**,
      e appena si apre se ne va. A schermo si legge come se si fossero
      messi d'accordo, e non l'ha scritto nessuno: mettersi d'accordo per
      DAVVERO — decidere quando muoversi — vuole i segnali, ed è la
      campagna dopo. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

/* le mani piene sono la stessa riga che il bestiario dà a ogni
   cavaliere (`data/bestiario.js`): qui non è colore, è la regola che fa
   esistere la seconda unità */
/* `mani: 0` non è una regola calata dall'alto: è aritmetica. In una
   mano ha lo scudo, nell'altra la spada, e posarli vorrebbe dire
   restare indifeso — quindi di mani libere non ne ha nessuna, e il
   rifiuto lo dice lui quando ci prova. */
const cavaliere = chi.eroe('cavaliere', 'il cavaliere', { mani: 0,
  nonRiesce: { prendi: 'in una mano ho lo scudo e nell\'altra la spada: se le poso resto indifeso' } })
/* `arma: { danno: 0 }` non è una nota di colore: **le hanno preso i
   pugnali, e senza non fa male a nessuno**. Il disegno la mostra a mani
   vuote finché non se li riprende. */
const ladra = chi.nostro('ladra', 'la ladra', { corpo: 'ladra', arma: { danno: 0 },
  nonRiesce: { apri: 'non lo smuovo nemmeno: peso quaranta chili' } })

/* né il portone né la grata hanno una serratura, e non c'è nessuna
   chiave da nessuna parte: si buttano giù, e ci vuole tempo. È la
   regola del mondo che questo livello aggiunge — **aprire può costare
   tempo** — e quelle spallate sono anche la finestra in cui la ladra
   arriva e aspetta. */
const portone = cose.porta('portone', 'il portone del forte', { forza: 4 })
const grata = cose.grata('grata', 'la grata del deposito', { forza: 3 })
const tesoro = cose.forziere('tesoro', 'il forziere del pedaggio')

/* ── I SUOI PUGNALI, E NON SONO UN OGGETTO COME GLI ALTRI ──
   `arma: { danno: 2 }` vuol dire che chi li raccoglie **colpisce con
   quelli**, e da quel momento glieli si vede in mano
   (`Oggetto.passaA` e `grafica/corpo.js`). È il motivo per cui questo
   livello è una storia e non un esercizio: la ladra parte disarmata —
   si vede, ha le mani vuote — e finisce armata. Il sacco invece è
   ingombrante e basta, ed è quello che il cavaliere non può portare. */
const pugnali = cose.pugnale('pugnali', 'i pugnali della ladra')
const sacco = cose.oggetto('sacco', 'il sacco della ladra', { pittore: 'sacco', em: '🎒' })

/* dove finiscono le cose cambia a ogni battaglia: il piano si firma
   prima di sapere quale tocca, e `prendi` la strada se la trova */
const dove = cose.segnaposto()

/* IL FORTE — il cortile di fuori, il portone, il cortile di dentro col
   forziere del pedaggio, e in fondo il deposito dietro la grata. */
const FORTE = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|##|..|..|..|..|##|s1|..|b1|..|##',
  '##|..|..|..|##|..|..|t1|..|##|..|..|..|..|##',
  '##|CV|..|..|##|..|..|..|..|##|..|..|..|..|##',
  '##|..|..|..|P1|..|..|..|..|GR|..|..|..|..|##',
  '##|LA|..|..|##|..|..|..|..|##|..|..|..|..|##',
  '##|..|..|..|##|..|..|t2|..|##|..|..|..|..|##',
  '##|..|..|..|##|..|..|..|..|##|s2|..|b2|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
], { CV: cavaliere, LA: ladra, P1: portone, GR: grata,
     s1: dove, s2: dove, b1: dove, b2: dove, t1: dove, t2: dove })

export const DUE_LAVORI = livello({
  id: 'parole-due-lavori', nome: 'I ferri della ladra',
  idea: 'Ognuno può fare solo il suo, e lo dice lui',
  dritta: 'Obiettivo: <b>la ladra deve riprendersi il sacco e i suoi pugnali</b>, e il forziere del pedaggio va aperto.',
  racconto: "Al forte hanno sequestrato alla ladra i ferri del mestiere e li hanno chiusi in fondo, nel deposito. Il cavaliere è venuto con lei: <b>quello che è chiuso lo butta giù lui, quello che si prende lo prende lei</b>. Dove abbiano messo la roba <b>cambia a ogni battaglia</b>.",
  aiuti: ['Sono due file separate: quello che scrivi per uno non lo fa anche l\'altra.',
          'Tocca le loro schede: non sanno fare le stesse cose, e ognuno dice perché.',
          'Niente qui ha una serratura. Si sfonda, e ci vuole un po\' — intanto l\'altra può già incamminarsi.'],
  ambiente: 'cripta', prove: 3,

  scena: FORTE,
  /* le torce stanno sui muri dei due varchi, dove l'ingombro è vero; a
     terra solo roba piatta */
  scenografia: [
    { che: 'torcia', x: 4, y: 3 }, { che: 'torcia', x: 4, y: 5 },
    { che: 'torcia', x: 9, y: 3 }, { che: 'torcia', x: 9, y: 5 },
    { che: 'ossa', x: 2, y: 7 }, { che: 'ragnatela', x: 11, y: 3, strato: -1 },
    { che: 'ragnatela', x: 6, y: 1, strato: -1 },
  ],

  /* le caselle si possono indicare, come dappertutto (`celle` è acceso
     di default, vedi `livello.js`): nessuna soluzione di questo livello
     punta una casella nuda, ma «vai lì dietro» dev'essere una cosa
     dicibile — se il dito può indicarla, l'ordine deve poterla dire */
  complementi: ['portone', 'grata', 'tesoro', 'sacco', 'pugnali'],
  verbi: ['vai', 'prendi', 'apri'],
  vince: [se.ha(ladra, sacco), se.ha(ladra, pugnali), se.aperto(tesoro)],

  varianti: [
    { nome: 'il sacco in alto, i pugnali in basso, il forziere in alto',
      metti: { s1: sacco, b2: pugnali, t1: tesoro } },
    { nome: 'il sacco in basso, i pugnali in alto, il forziere in basso',
      metti: { s2: sacco, b1: pugnali, t2: tesoro } },
    { nome: 'sacco e pugnali tutti e due in alto, il forziere in basso',
      metti: { s1: sacco, b1: pugnali, t2: tesoro } },
  ],

  soluzioni: [
    { nome: 'lui sfonda, lei prende', piano: {
      cavaliere: [fai.apri(portone), fai.apri(grata), fai.apri(tesoro)],
      ladra: [fai.prendi(sacco), fai.prendi(pugnali)],
    } },
  ],

  verifiche: {
    /* con una fila sola non si vince: è la domanda «perché mi servono
       due persone?» girata al banco, che la verifica invece di
       lasciarla a chi legge */
    serveOgnuno: true,
  },
})

export default DUE_LAVORI
