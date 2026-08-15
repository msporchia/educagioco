/* 5 ─ IL BUIO, E LA LUCE CHE TI FA SCOPRIRE. Due file come nel livello
      dei mestieri, e una regola del mondo nuova — la più
      controintuitiva che il motore sappia fare:

        **la luce che ti fa vedere è la stessa che ti fa scoprire.**

      Al buio (`vistaAlBuio: 1`) tutti vedono un passo, e l'orco nella
      sua garitta non fa eccezione: chi passa in silenzio, al buio, non
      lo scopre. Ma chi porta una lanterna esce dal tetto — e **si vede
      da lontano anche da chi è al buio** (`limiteVista` in
      `motore/generale/unita.js`, la riga che rompe apposta il «se io non
      ti vedo, tu non vedi me»). L'orco, che al buio vede un passo, il
      cavaliere illuminato lo vede da dodici.

      ── E QUINDI LA LANTERNA NON SI PORTA, SI DÀ A QUALCUNO ──
      Sono le due schede a dire chi: il cavaliere è dentro un'armatura e
      le prende senza cadere, la ladra al primo colpo è per terra. La
      lanterna va portata fino alla nicchia — è metà della missione, e
      **si posa**: una cosa in mano non è in nessun posto, ci arriva
      quando la lasci lì (`domande/qui.js`). L'altra metà è il forziere,
      di là dal cunicolo di mezzogiorno, e si fa **al buio**.

      Il livello si vince quando le due file sono state date alle due
      persone giuste. Darle al contrario non è un dettaglio di stile: la
      ladra con la lanterna in mano è la cosa più visibile della grotta.

      ── COSA SI VEDE SULLA MAPPA ──
      Attorno all'orco ci sono due cerchi: quello pieno è quanto vede
      adesso, al buio; quello pallido, largo, è **fin dove ti vede se
      porti la luce**. Sono la stessa regola, disegnata prima di premere
      ▶ invece che scoperta a proprie spese.

      ── UN'AMMISSIONE ──
      Questo livello muove due assi invece di uno (§2 della didattica):
      la regola del buio, e una parola nuova, `posa`. Sta insieme lo
      stesso perché la parola nuova nasce dal bisogno e non dal
      programma: quando hai in mano una cosa che ti fa scoprire, «posala»
      è la domanda che si fa il bambino prima che il gioco gliela
      suggerisca. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

/* la ladra non porta luce e non ne ha bisogno: al buio è quello che la
   rende invisibile — e cade al primo colpo, che è quello che rende la
   lanterna una cosa da NON darle */
const ladra = chi.nostro('ladra', 'la ladra', { corpo: 'ladra', vista: 4, vita: 1 })
/* il cavaliere invece la porta in mano, e diventa il posto più
   luminoso della grotta. Regge le botte: il suo mestiere qui è
   arrivare in fondo mentre gliele danno */
const cavaliere = chi.eroe('cavaliere', 'il cavaliere', { vita: 20 })

/* dodici di vista, e al buio ne vale uno: la differenza fra i due
   numeri È il livello. Sta nella garitta e aspetta di vedere qualcuno,
   e quando lo vede gli va addosso.
   ── E NON SI SCRIVE `reagisce` ──
   `reagisce: [quando.vedi(…)]` si legge meglio e **non fa niente**:
   `Reazione.riconosce` (`motore/generale/reazioni/reazione.js`)
   risponde solo agli eventi `senti`, quindi una reazione a vista non
   scatta mai — compare nella scheda col suo 👁 e resta lì. Con quella
   forma questo livello era muto: la ladra poteva prendersi la lanterna
   e passare davanti alla garitta senza che succedesse niente, cioè la
   lezione non era nemmeno applicata. Due ordini normali sì. */
const orco = chi.orco({ vista: 12, vita: 9,
  fa: [fai.aspettaDiVedere('nostri'), fai.attacca('nostri')] })

const lanterna = cose.lanterna({ raggio: 3 })
const tesoro = cose.forziere()
const nicchia = cose.posto('nicchia', 'la nicchia')

const dove = cose.segnaposto()

/* LA GROTTA — due gallerie che non si toccano: quella di tramontana
   passa davanti alla garitta della guardia e finisce nella nicchia,
   quella di mezzogiorno porta alla sala del forziere. Si sceglie da
   ponente, e non si cambia idea a metà. */
const GROTTA = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|..|..|n1|..|n2|..|n3|..|##',
  '##|..|..|..|..|##|g1|g2|g3|##|##|##|##|##|##',
  '##|LA|..|..|..|##|##|##|##|##|##|##|##|##|##',
  '##|CV|..|..|..|..|..|..|..|..|..|..|..|..|##',
  '##|..|LN|..|..|##|##|##|##|##|..|..|..|..|##',
  '##|..|..|..|..|##|##|##|##|##|..|..|T$|..|##',
  '##|..|..|..|..|##|##|##|##|##|..|..|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
], { LA: ladra, CV: cavaliere, LN: lanterna, 'T$': tesoro,
     g1: dove, g2: dove, g3: dove, n1: dove, n2: dove, n3: dove })

export const BUIO = livello({
  id: 'parole-buio', nome: 'Il buio e la lanterna',
  idea: 'La luce ti fa vedere, e fa vedere te',
  dritta: 'Obiettivo: <b>il forziere aperto, e la lanterna posata nella nicchia</b>.',
  racconto: "Qui dentro non si vede a un passo, e la guardia nella garitta non fa eccezione: al buio non sa che siete arrivati. La lanterna però si vede da lontano — e con lei si vede chi la porta. Dove sta la nicchia, e in che punto della garitta stia la guardia, <b>cambiano a ogni battaglia</b>.",
  aiuti: ['Guarda i due cerchi attorno alla guardia: quello pallido è quanto ti vede se porti la luce.',
          'Tocca le due schede: uno le prende senza cadere, l\'altra no.',
          'Una cosa in mano non è in nessun posto: nella nicchia ci arriva quando la lasci lì.'],
  ambiente: 'grotta', prove: 3,
  vistaAlBuio: 1,

  scena: GROTTA,
  /* le stalagmiti e i cristalli hanno un volume e stanno sulla roccia;
     sul pavimento ci va solo quello che si calpesta — ossa,
     pozzanghere, ragnatele per terra */
  scenografia: [
    { che: 'stalagmite', x: 5, y: 3 }, { che: 'stalagmite', x: 7, y: 6 },
    { che: 'cristallo', x: 9, y: 3 }, { che: 'cristallo', x: 5, y: 6 },
    { che: 'ossa', x: 2, y: 7 }, { che: 'ossa', x: 13, y: 7 },
    { che: 'pozzanghera', x: 3, y: 4, strato: -1 },
    { che: 'ragnatela', x: 1, y: 6, strato: -1 },
  ],

  complementi: ['lanterna', 'nicchia', 'tesoro', 'orchi'],
  verbi: ['vai', 'prendi', 'posa', 'apri'],
  vince: [se.aperto(tesoro), se.qui(lanterna, nicchia)],
  mostraNemici: true,

  varianti: [
    { nome: 'la nicchia subito dopo la garitta, la guardia al primo posto',
      metti: { n1: nicchia, g1: orco } },
    { nome: 'la nicchia in fondo, la guardia in mezzo',
      metti: { n3: nicchia, g2: orco } },
    { nome: 'la nicchia a metà galleria, la guardia in fondo alla garitta',
      metti: { n2: nicchia, g3: orco } },
  ],

  soluzioni: [
    { nome: 'la luce a chi la regge', piano: {
      cavaliere: [fai.prendi(lanterna), fai.vai(nicchia), fai.posa(lanterna)],
      ladra: [fai.apri(tesoro)],
    } },
  ],

  verifiche: {
    /* le due reti che dicono la lezione al banco: senza la lanterna
       metà missione non si fa, e con una fila sola non si vince */
    senza: ['lanterna'],
    serveOgnuno: true,
  },
})

export default BUIO
