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

import { livello, campo, cose, chi, fai, se, reagisce, aiuto } from '../scrivi.js'

/* UNA UNITÀ SOLA, e il livello ci guadagna. Con due, questa era la
   terza volta di fila che la lezione era «mettetevi d'accordo»; con
   una, resta solo la cosa nuova: il rumore SPOSTA il nemico, e dove lo
   fai decide dove lui non è. La ladra suona, e mentre lui va a vedere
   lei è già dall'altra parte. */
const ladra = chi.nostro('ladra', 'la ladra', { corpo: 'ladra', emoji: '🥷', vista: 2, vita: 1 })
/* non lo si tocca: quarantaquattro punti di vita sono il modo di dire
   «questa strada è chiusa» senza vietarla. Tutto il livello sta
   nell'unica riga della sua scheda: accorre. */
/* ⚠ QUI C'ERA `accorre: 'richiamo'`, E DAL TRAVASO NON VOLEVA PIÙ DIRE
   NIENTE. Il motore non legge più quella chiave — chi corre al rumore
   lo dichiara con una REAZIONE, che è dato leggibile nella scheda
   invece di un comportamento cablato (`scrivi.js`, `reagisce`). Il
   livello continuava a scriverla, quindi il carceriere **non accorreva
   più**: restava sul portone, e la ladra gli camminava addosso su tutte
   e tre le scene. Il livello che insegna il rumore era l'unico in cui
   il rumore non faceva niente. */
/* ── E SE TI VEDE, TI PRENDE: ANCHE MENTRE CORRE ──
   Non sta più scritto nel suo piano (`aspetta di vedere, poi attacca`):
   è l'istinto di chiunque stia dall'altra parte, e il motore lo mette in
   testa alle sue reazioni (`conIstinto` in `motore/generale/allestimento.js`)
   — si legge nella scheda come l'altra. E conta PIÙ del rumore. Prima
   no: la corsa verso il rumore lo rendeva cieco, e la soluzione di
   questo livello era chiamarlo e passargli attraverso — lui arrivava
   per la stessa strada che lei faceva al contrario, la guardava in
   faccia a un passo e tirava dritto. Un bambino l'ha visto giocando, e
   aveva ragione lui: una guardia che ti vede e non fa niente non è una
   regola, è un buco. */
const carce = chi.orco('carce', 'il carceriere', { vista: 2, vita: 44,
  reagisce: [reagisce.alRumore('richiamo')] })

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
  id: 'richiamo', nome: 'Il richiamo', impara: 'il rumore', idea: 'Fai rumore lontano da dove devi passare',
  dritta: "Obiettivo: <b>il tesoro deve finire in mano alla ladra</b>. Il carceriere non si batte.",
  racconto: "Con quella corazza il carceriere non lo butta giù nessuno, e se vede la ladra la prende. Ma lui è fatto in un modo solo, e sta scritto nella sua scheda.",
  /* ── LA SCALA, SCRITTA A MANO ──
     Il pezzo che scrive nel piano è la prima metà — prendi la chiave, e
     chiamalo da lontano — e la sua frase dice già la seconda, che è la
     parte in cui sta la lezione: chi arriva lì ha davanti agli occhi
     come si dice «fai rumore», e quello che gli resta da capire è *da
     dove passare*. Dopo il pezzo il gioco mette da sé la forma (con le
     prime tre mosse intere, già pagate) e la soluzione. */
  /* ── LA LEZIONE HA DUE METÀ, E LA SECONDA È NUOVA ──
     Da quando il carceriere ti prende anche mentre corre, chiamarlo non
     basta più: lui arriva **per la strada più corta**, che è la stessa
     che faresti tu per tornare al portone. Quindi lo chiami da una parte
     del giro e passi dall'altra — che è la frase con cui il livello era
     stato raccontato fin dall'inizio, e che adesso è anche vera. */
  aiuti: [
    aiuto.ragiona('Il tesoro sta oltre il portone, e davanti al portone c\'è il carceriere: non si batte, e ti prende appena ti vede. Il portone si passa quando lui non c\'è.'),
    aiuto.ragiona('Tocca il carceriere e leggi la sua scheda come si legge un piano: a cosa reagisce? Se sai cosa lo fa muovere, sai anche come toglierlo da lì.'),
    aiuto.dice('Corre dove sente il rumore, per la strada più corta. E se ti trova su quella strada, ti prende.'),
    aiuto.dice('Il posto da cui fai rumore è una scelta, non il posto dove ti trovi: chiamalo da lontano, da una parte sola del giro.'),
    /* la frase che seguiva il pezzo — «adesso lui arriva di qua, tu
       passa dall'altra» — adesso sta dentro il pezzo: un gradino da
       dieci dopo uno da cinquanta sarebbe una scala che scende */
    aiuto.scrive({ ladra: [fai.prendi('chiave'), fai.vai('3,1'), fai.suona('richiamo')] },
                 'Ecco le prime tre mosse: prendi la chiave, e chiamalo da lassù, lontano dal portone. Adesso lui arriva di qua, dalla parte più corta: tu passa dall\'altra, da una casella del giro che lui non fa.'),
    aiuto.svela(),
  ],
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

  soluzioni: [
    /* SEI ORDINI, e non ce n'è uno di troppo: la chiave, il posto da cui
       chiamarlo, il rumore, il posto da cui passare, il portone, il
       tesoro. I due `vai` sono il livello — chi toglie il primo lo
       chiama da dove capita, chi toglie il secondo gli torna incontro —
       e le caselle le sceglie il bambino: qualunque punto in cima a
       ponente per chiamarlo e qualunque punto del lato di levante per
       passare regge le tre scene, e anche il contrario — chiamarlo in
       cima a levante (9,1) e passare da ponente. Provato: quello che non
       regge è chiamarlo dal mezzo (6,1), dove le due strade sono lunghe
       uguali e non si sa da che parte arriverà. */
    { nome: 'lo chiama da una parte, passa dall\'altra', piano: { ladra: [
      fai.prendi(chiave), fai.vai('3,1'), fai.suona(richiamo),
      fai.vai('11,7'), fai.apri(portone), fai.prendi(tesoro),
    ] } },
    /* FRAGILE: chiamarlo da dove si è appena presa la chiave, e poi
       girare dall'altra parte. Regge solo quando la chiave stava già in
       cima a ponente — le altre due volte il rumore parte dal giro di
       sotto, lui arriva in cinque passi, e dall'altra parte non si fa
       in tempo. Il punto da cui chiamarlo è una scelta, non il posto
       dove ti trovi. */
    { nome: 'lo chiama da dove si trova', fragile: true, piano: { ladra: [
      fai.prendi(chiave), fai.suona(richiamo),
      fai.vai('11,4'), fai.apri(portone), fai.prendi(tesoro),
    ] } },
  ],
})

export default RICHIAMO
