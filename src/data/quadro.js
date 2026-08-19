/* ═══════════════════════════════════════════════════════════════════
   IL QUADRO DI UN'ETÀ — cosa vede, cosa gli si chiede, cosa gli si dà
   per scontato a un bambino di X anni.

   ── PERCHÉ ESISTE ────────────────────────────────────────────────
   L'età è il numero da cui dipende tutto: quali carte compaiono in
   home, da che tappa comincia una campagna, quali domande arrivano.
   Ma era **un numero muto**. Un grande lo spostava di mezzo anno e non
   succedeva niente di visibile: nessuna carta si muoveva sotto i suoi
   occhi, nessuna riga cambiava. L'unico modo di sapere cosa aveva
   appena fatto era andare nella scheda delle domande, ricordarsi com'era
   prima, e confrontare a memoria.

   Una manopola che non dice cosa fa non è una manopola: è un campo da
   compilare. E il rimedio a cui si era arrivati — quattro carte con
   scritto sopra «prima o seconda», «terza elementare» — spostava il
   problema senza risolverlo: diceva *a chi* è rivolta la scelta, mai
   *cosa cambia* facendola.

   Questo file risponde a quella domanda, e la risponde due volte:
   `quadroDi` dice come stanno le cose a una certa età, e
   `differenzaFra` dice **cosa è cambiato fra una tacca e l'altra** —
   che è quello che si legge davvero, perché nessuno confronta due
   elenchi da duecento righe: si guarda cosa si è mosso.

   ── NON IMPORTA NÉ VUE NÉ LO STORE ───────────────────────────────
   Prende tutto da fuori: l'età, le eccezioni sui giochi e sui saperi,
   e le classi di domande. Le prime tre sono dato puro; le classi no —
   il registro dei moduli gira solo sotto Vite (`import.meta.glob`) — e
   per questo si **iniettano**, esattamente come `nucleo/catalogo.js` si
   fa passare i moduli invece di andarseli a prendere. È l'unico motivo
   per cui `test/unita/quadro` può girare in Node.

   ── E SOPRATTUTTO: DESCRIVE, NON DECIDE ──────────────────────────
   Nessuna regola nasce qui. I confini delle cinque fasce stanno in
   `quiz/nucleo/catalogo.js`, la portata delle tappe in `data/portata.js`,
   le eccezioni di una fascia in `data/partenze.js`. Se questo file
   dicesse una cosa e il gioco ne facesse un'altra sarebbe **peggio di
   non dire niente**, perché un grande deciderebbe guardando un riassunto
   falso. Perciò qui non si somma, non si arrotonda e non si semplifica:
   si chiamano le stesse funzioni che chiama il gioco.
   ═══════════════════════════════════════════════════════════════════ */
import { GIOCHI } from './giochi.js'
import { TAPPE_DEL_GIOCO } from './portata-giochi.js'
import { giocoDaOffrire, arcoDelGioco } from './portata.js'
import { SAPERI, sapereDi } from './saperi.js'
import { PARTENZE, eccezioniPerEta } from './partenze.js'
import { FASCE_ETA, doveCadeCon } from '../quiz/nucleo/catalogo.js'

/* le chiavi spente in una mappa di eccezioni: `{ torri: false }` vuol
   dire spento, l'assenza vuol dire acceso (è il patto di `settings`) */
const spente = mappa => Object.keys(mappa || {}).filter(k => mappa[k] === false)

/* ── COSA VEDE IN HOME ──
   La stessa domanda che fa la home (`giocoAcceso && giocoDaVedere`),
   con i due pezzi presi da fuori invece che dal profilo: l'interruttore
   del grande e la portata.

   `provato: false` è deliberato, e vale sia per un bambino che non
   esiste ancora sia per uno che c'è già: qui si sta mostrando **cosa
   si offrirebbe a chi arriva adesso**, che è quello che l'età decide.
   Un gioco già cominciato non sparisce comunque (`giaProvato` in
   `portata-giochi.js`), ma è una promessa sul profilo vero, non una
   cosa da mescolare a una previsione. */
export const QUI = 'qui'            // ce l'ha in home
export const PASSATO = 'passato'    // troppo facile per lui, ormai
export const AVANTI = 'avanti'      // arriva più avanti
export const SPENTO = 'spento'      // l'ha spento un grande, non l'età

export function giochiDiUnEta ({ eta, giochi = {}, sa = {}, sperimentali = false } = {}) {
  const spenti = spente(sa)
  const off = new Set(spente(giochi))
  /* quello che a quest'età si spegnerebbe da sé: serve a distinguere
     «l'hai spento tu» da «è l'età», che a schermo sono due frasi
     diverse e per un grande sono due cose diversissime */
  const attese = eccezioniPerEta(eta)
  const dEta = new Set(spente(attese.giochi))
  const saDEta = new Set(spente(attese.sa))

  return GIOCHI
    /* i giochi in prova sono un interruttore di casa, non una cosa che
       dipende dall'età: si passa com'è messo, e di partenza è spento
       come per chiunque apra il gioco la prima volta */
    .filter(g => !g.sperimentale || sperimentali)
    .map(g => {
      const arco = arcoDelGioco(TAPPE_DEL_GIOCO[g.chiave] || [])
      const tappe = TAPPE_DEL_GIOCO[g.chiave]
      const inPortata = !tappe || giocoDaOffrire(tappe, { eta, spenti, provato: false })
      /* un gioco fatto tutto di un sapere spento non si accende: è la
         stessa regola di `giocoGiocabile`, non un secondo criterio.

         Ma **di chi è la mano** cambia la frase, e sbagliarla è una
         bugia: il laboratorio delle pozioni è tutto conversioni, e a
         otto anni le conversioni sono spente perché a otto anni a
         scuola non si sono ancora fatte. Dire «l'hai spento tu» a un
         grande che non ha toccato niente lo manda a cercare un
         interruttore che non ha mai premuto. Se il sapere che manca è
         spento **anche nei difetti di quell'età**, è l'età. */
      const mancano = (g.serve || []).filter(x => spenti.includes(x))
      const manca = mancano.length > 0
      const mancaPerEta = manca && mancano.every(x => saDEta.has(x))

      /* ── PERCHÉ NON C'È, DETTO AL GRANDE ──
         «11 giochi» non aiuta a decidere niente. Quello che serve è
         **l'elenco intero con lo stato addosso**: chi c'è, chi il
         bambino ha già passato, chi arriva più avanti. Le prime due
         dicono se si è saliti abbastanza, la terza cosa si
         guadagnerebbe salendo ancora — e si leggono tutte e tre in
         una schermata ferma, senza doversi ricordare com'era la tacca
         di prima.

         `spento` è la quarta e sta a parte: non è l'età ad averlo
         tolto, ed è l'unica di cui il grande è responsabile. Metterla
         in mezzo alle altre gli farebbe credere che basti spostare la
         manopola per farlo tornare. */
      let stato = QUI
      if ((manca && !mancaPerEta) || (off.has(g.chiave) && !dEta.has(g.chiave))) stato = SPENTO
      else if (manca || off.has(g.chiave) || !inPortata) {
        const passato = g.piccoli || (arco && arco.anniA < eta)
        stato = passato ? PASSATO : AVANTI
      }
      return { chiave: g.chiave, nome: g.nome, ico: g.ico, che: g.che, stato,
               da: arco ? arco.anniDa : null, a: arco ? arco.anniA : null }
    })
}

/* ── QUELLO CHE DÀ PER SCONTATO CHE SAPPIA ──
   Detto al positivo, e non è un modo di dire più gentile: è l'unico
   verso in cui la frase serve a qualcosa. «A scuola non l'ha ancora
   fatto: le divisioni» costringe il grande a ricostruire per differenza
   cosa il gioco stia invece dando per buono — cioè le altre ventisette
   cose, che non sono scritte da nessuna parte. Al positivo la lettura è
   diretta: si scorre l'elenco, e **appena ci si legge dentro qualcosa
   che il bambino non sa, si è andati troppo su**. È esattamente il
   gesto per cui la manopola esiste.

   L'ordine non è alfabetico e non è quello di `saperi.js`: sono **i più
   recenti per primi**, cioè quelli che questa età aggiunge rispetto a
   una più piccola. Un elenco che comincia da «i numeri e le quantità»
   direbbe la stessa cosa a quattro anni e a undici; uno che comincia da
   «le divisioni» dice a che punto siamo. */
const DA_QUANDO = new Map(SAPERI.map(s => {
  /* la prima partenza che non lo tiene spento: sotto quell'età il gioco
     non lo dà per scontato */
  const p = PARTENZE.find(x => !x.saperi.includes(s.chiave))
  return [s.chiave, p ? p.anni : Infinity]
}))

export function saperiDiUnEta (sa = {}) {
  const spenti = new Set(spente(sa))
  return SAPERI
    .filter(s => !spenti.has(s.chiave) && s.difetto !== false)
    .map(s => ({ chiave: s.chiave, nome: s.nome, da: DA_QUANDO.get(s.chiave) ?? 0 }))
    .sort((a, b) => b.da - a.da)
}

/* ── E IL QUADRO INTERO ──
   `classi` sono le righe piatte del catalogo (`classiDelModulo` di ogni
   modulo, concatenate). Senza, la metà delle domande resta vuota e il
   resto funziona lo stesso: è il caso di Node, dove il registro non
   esiste, ed è meglio di un errore. */
export function quadroDi ({ eta, giochi = {}, sa = {}, sperimentali = false } = {},
                          { classi = [] } = {}) {
  const spenti = spente(sa)
  const dove = doveCadeCon(eta)

  const righe = classi.map(c => ({
    chiave: c.chiave,
    nome: c.nome,
    modulo: c.nomeModulo,
    icona: c.icona,
    livello: c.livello,
    /* tutto quello che serve a **rigenerare** quella domanda, nella
       forma che vuole `quiz/nucleo/esempi.js`: è il motivo per cui una
       riga di questo elenco si può provare col dito senza che chi la
       mostra sappia niente di moduli e di gradi. Pretendere che il nome
       dica tutto non funziona — «le analogie fra figure» a un grande non
       dice nemmeno che aspetto ha la domanda. */
    sorgente: c.sorgente,
    /* una classe spenta non cade in nessuna fascia: è tolta prima, e
       metterla fra le «troppo facili» direbbe una cosa falsa */
    dove: (c.sa || []).some(s => spenti.includes(s)) || spenti.includes(c.tipo)
      ? 'spenta' : dove(c.livello),
  }))

  /* ── LE DOMANDE, IN QUATTRO GRUPPI COI NOMI DENTRO ──
     Qui c'erano tre conti e una barra: «24 facili · 25 nel segno · 18
     difficili». Sembrava informazione e non lo era — nessun grande
     decide niente sapendo che ce ne sono venticinque, perché il numero
     non dice *quali*, e quali è tutta la domanda.

     Adesso sono quattro elenchi che si aprono, e ognuno risponde a una
     domanda diversa che un grande si fa davvero: cosa sa già e ripassa,
     cosa sta imparando adesso, cosa gli chiediamo un gradino sopra, e
     cosa abbiamo smesso di chiedergli. Le stesse fasce di
     `quiz/nucleo/catalogo.js`, senza confini nuovi: qui si raggruppa e
     si dà un nome, non si decide.

     **Senza doppioni.** La stessa tipologia compare a più gradi — «le
     ore intere» sta al grado 1 e al grado 4 — ed è giusto nel catalogo,
     dove ogni riga è una classe diversa con un suo peso. In un elenco
     da leggere è rumore: si tiene la prima, che è anche la più tosta
     visto che sono in ordine. */
  const senzaDoppioni = elenco => {
    const visti = new Set()
    return elenco.filter(r => !visti.has(r.nome) && visti.add(r.nome))
  }
  const inOrdine = f =>
    senzaDoppioni(righe.filter(r => r.dove === f).sort((a, b) => b.livello - a.livello))

  /* E i doppioni non si tolgono solo **dentro** un gruppo: una
     tipologia che esce a due gradi lontani cade in due gruppi diversi
     — «dove vive questo animale» fra quelle da ripassare e fra quelle
     toste — che è vero e insieme illeggibile: lo stesso nome in due
     elenchi con due etichette opposte fa credere a un errore. Si tiene
     dov'è più utile saperlo, e l'ordine di preferenza è quello: prima
     dove il bambino sta lavorando adesso, poi il gradino sopra, poi il
     ripasso, e per ultimo quello che non gli si chiede più. */
  const ORDINE_GRUPPI = ['medie', 'toste', 'facili', 'sotto']
  const gia = new Set()
  const gruppi = ORDINE_GRUPPI.map(chiave => {
    const righe = inOrdine(chiave).filter(r => !gia.has(r.nome))
    righe.forEach(r => gia.add(r.nome))
    return [chiave, righe]
  })
  const gruppo = chiave => (gruppi.find(([k]) => k === chiave) || [, []])[1]
  return {
    anni: eta,
    /* l'elenco intero, ognuno col suo stato: chi mostra decide se
       aprirlo o riassumerlo, ma il dato è sempre tutto */
    giochi: giochiDiUnEta({ eta, giochi, sa, sperimentali }),
    /* quello che il gioco dà per scontato, i più recenti per primi */
    sa: saperiDiUnEta(sa),
    /* L'ordine è quello in cui si leggono: dal già saputo al non
       ancora, e in fondo quello che non gli si chiede più. Le «troppo
       difficili» non ci sono: sono fuori dalla sua portata e non gli
       arrivano, e un elenco di roba che non vedrà non aiuta a
       decidere niente — quello che serve sapere, cioè che salendo
       arriverebbero, lo dice già la manopola salendo. */
    gruppi: ['facili', 'medie', 'toste', 'sotto'].map(chiave =>
      ({ chiave, righe: gruppo(chiave) })),
    /* ── IL CENSIMENTO GREZZO ──
       Non è quello che si mostra, e i numeri **non combaciano** con la
       lunghezza dei gruppi: qui ogni classe si conta una volta, lì i
       doppioni sono già stati tolti. Serve a un test — che nessuna
       riga si perda per strada — ed è l'unico posto dove si può
       controllare, perché un doppione tolto e una riga persa da fuori
       si somigliano. */
    fasce: FASCE_ETA.map(f => ({ ...f, quante: righe.filter(r => r.dove === f.chiave).length })),
    spente: righe.filter(r => r.dove === 'spenta').length,
    righe,
  }
}

/* ── COSA È CAMBIATO FRA UNA TACCA E L'ALTRA ──
   Il pezzo che rende la manopola una manopola. Non si confrontano due
   elenchi — nessuno lo farebbe — si dice cosa si è mosso: quali carte
   entrano in home e quali escono, e quali domande hanno cambiato
   blocco.

   Le righe che si sono mosse possono essere decine: chi le mostra ne
   prende le prime. Sono già ordinate come arrivano dal catalogo, che
   è per materia e per grado — e per un riassunto va bene, perché il
   punto non è l'elenco completo ma **il fatto che si muove**. */
/* Niente di quello che torna di qui finisce a schermo, ed è
   deliberato (vedi il commento in `components/ManopolaEta.vue`): i sei
   blocchi dicono **come stanno le cose**, non cosa è appena successo.
   Resta perché è l'unico modo che ha un test di dire che la manopola
   *fa* qualcosa, e che lo fa nel verso giusto — crescendo le domande
   scendono di blocco, non salgono. */
export function differenzaFra (prima, dopo) {
  const statoPrima = new Map(prima.giochi.map(x => [x.chiave, x.stato]))

  const dovePrima = new Map(prima.righe.map(r => [r.chiave, r.dove]))
  const mosse = dopo.righe.filter(r => dovePrima.has(r.chiave) && dovePrima.get(r.chiave) !== r.dove)
  const ordine = FASCE_ETA.map(f => f.chiave)
  const salita = r => ordine.indexOf(r.dove) - ordine.indexOf(dovePrima.get(r.chiave))

  return {
    /* Chi ha cambiato stato. Non si mostra come «arriva X» / «non
       compare più Y» — due righe che raccontano il movimento a chi sta
       già guardando l'elenco muoversi — ma serve a un test per sapere
       che la manopola *fa* qualcosa, e resta a disposizione di chi un
       giorno volesse dirlo. */
    cambiati: dopo.giochi.filter(g => statoPrima.get(g.chiave) !== g.stato)
      .map(g => ({ ...g, prima: statoPrima.get(g.chiave) })),
    /* «più facili» vuol dire scese di blocco: la stessa domanda che
       prima era nel segno adesso è roba che sa già fare */
    piuFacili: mosse.filter(r => salita(r) < 0).map(r => ({ ...r, da: dovePrima.get(r.chiave) })),
    piuToste: mosse.filter(r => salita(r) > 0).map(r => ({ ...r, da: dovePrima.get(r.chiave) })),
    /* i saperi si confrontano al positivo come si mostrano: `imparati`
       sono quelli che a questa età si danno per scontati e prima no —
       la riga che dice «attento, da qui in poi supponiamo anche
       questo» — e `dimenticati` il contrario. */
    imparati: dopo.sa.filter(x => !prima.sa.some(y => y.chiave === x.chiave)),
    dimenticati: prima.sa.filter(x => !dopo.sa.some(y => y.chiave === x.chiave)),
  }
}
