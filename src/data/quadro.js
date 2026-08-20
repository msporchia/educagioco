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
import { finestraDi, anniDelLivello } from '../quiz/nucleo/classi.js'
import { PASSO } from '../quiz/nucleo/modulo.js'

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
  /* ── E QUELLO CHE UN GRANDE HA VOLUTO COMUNQUE ──
     `settings.giochi[k] === true` non si scriveva mai: acceso era
     l'assenza, e `accendiGioco(k, true)` cancellava la voce. Adesso
     quel valore vuol dire una cosa che prima non si poteva dire —
     **tienilo in casa anche se l'età dice di no**. Serve al caso che
     l'età sbaglia: il Dungeon dichiarato dai sette anni e un bambino di
     sei che ci gioca col fratello. Un profilo di ieri non ne ha
     nessuno, quindi non cambia niente per nessuno finché qualcuno non
     lo chiede. */
  const forzati = new Set(Object.keys(giochi || {}).filter(k => giochi[k] === true))
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
      /* ── LO STATO, DATE CERTE ECCEZIONI ──
         Si calcola due volte: una con quelle **di questo bambino** —
         ed è quello che si vede — e una con quelle che **la partenza di
         quest'età scriverebbe adesso**, che è il termine di paragone.
         Erano una sola, e il paragone era «nessuna eccezione»: così un
         gioco spento dalla partenza (Prima e dopo a nove anni, che i
         piccoli li tiene fuori) risultava messo a mano da un grande che
         non aveva toccato niente — e restava ambra anche appena dopo
         aver rimesso tutto ai difetti, che è il momento in cui è più
         evidente che la riga sta mentendo. */
      const statoCon = spentoQui => {
        if ((manca && !mancaPerEta) || (spentoQui && !dEta.has(g.chiave))) return SPENTO
        if (manca || spentoQui || !inPortata)
          return (g.piccoli || (arco && arco.anniA < eta)) ? PASSATO : AVANTI
        return QUI
      }
      let stato = statoCon(off.has(g.chiave))
      /* La forzatura vince sull'età, **non sui saperi spenti**: un
         gioco fatto tutto di conversioni con le conversioni spente non
         diventa giocabile perché qualcuno lo vuole in home — resterebbe
         una carta che apre domande da indovinare. È la stessa riga di
         `giocoGiocabile`, e sbagliarla qui vorrebbe dire prometterne
         una che la home poi non mostra. */
      if (forzati.has(g.chiave) && !manca) stato = QUI

      /* ── E COSA SUCCEDE SCEGLIENDO «COME DICE L'ETÀ» ──
         Non «senza nessuna eccezione», ma **con quelle di quest'età**:
         è la stessa cosa che scrive il tasto che rimette tutto
         (`rimettendoLEta`), quindi le due strade portano allo stesso
         posto. Serve alla tacca, che deve poter rimettere una riga
         com'era senza sapere niente di come ci si è arrivati. */
      const difetto = statoCon(dEta.has(g.chiave))
      /* La posizione della tacca è **rispetto all'atteso**: spegnere
         quello che la partenza di quest'età spegneva già non è una
         scelta di nessuno, ed è la posizione di mezzo — non «non ce
         l'ha». Da qui esce anche l'ambra, che è la stessa domanda
         detta in un altro modo: c'è qualcosa da ritrovare, qui? */
      const attesoSpento = dEta.has(g.chiave)
      /* Solo un `true` scritto per esteso è «ce l'ha comunque»:
         l'assenza non forza niente — il gioco resta in mano alla
         portata — quindi un profilo che non ha l'eccezione attesa non
         sta dicendo nulla, e la tacca lo mostra nel mezzo. Dirlo «ce
         l'ha» sarebbe una bugia visibile: la riga accanto direbbe
         «arriva più avanti». */
      const scelto = forzati.has(g.chiave) ? 'si'
        : (off.has(g.chiave) && !attesoSpento) ? 'no' : 'difetto'
      return { chiave: g.chiave, nome: g.nome, ico: g.ico, che: g.che, stato,
               difetto, scelto, attesoSpento,
               /* il pezzo di scuola senza il quale questo gioco non ha
                  più niente da chiedere: il laboratorio delle pozioni è
                  tutto conversioni. La riga lo scrive al posto della
                  sua descrizione — «spento» senza il perché manda a
                  cercare un interruttore che non è quello. */
               manca: mancano.map(k => sapereDi(k)?.nome || k).join(' e '),
               /* una scelta che coincide con l'atteso non è una scelta:
                  non lascia niente da ritrovare, e colorarla direbbe
                  il falso */
               aMano: scelto !== 'difetto',
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

/* ── E QUELLO CHE A QUEST'ETÀ NON SI DÀ PER SCONTATO ANCORA NIENTE ──
   Un gruppo di sapere è largo: «i numeri e le quantità» va dal colpo
   d'occhio sui pallini ai numeri a tre cifre, «le figure piane» dai
   nomi di quadrato e cerchio agli angoli ottusi. Acceso vuol dire che
   le sue domande non sono state tolte — non che arrivino tutte, perché
   a tagliare è l'età, e taglia fino alla singola tipologia
   (`Modulo.tipiLiberi`).

   Perciò un gruppo che a quest'età non ha **nemmeno una** domanda
   dentro la finestra non si dà per scontato: si sta solo tenendo acceso
   un interruttore che non tocca niente. Elencarlo è la cosa che a
   quattro anni faceva dubitare — «com'è fatto un animale» compariva fra
   le cose date per scontate, e la sua unica domanda è dichiarata otto
   anni.

   Chi non ha domande affatto resta, ed è deliberato: un gruppo che vive
   solo dentro un gioco — le divisioni del castello — non deve sparire,
   perché è l'unica riga che spiega perché quel gioco chiede quello che
   chiede. Il taglio è per «ne ha, ma non ancora qui», non per «non
   ne ha».

   ── E SI TAGLIA SOLO IL TETTO ──
   Il fondo della finestra non c'entra, ed è il verso che si sbaglia
   scrivendolo: a undici anni «leggere le parole» sta sotto — quelle
   domande non gliele chiediamo più perché le indovinerebbe senza
   pensarci — e togliere quel gruppo dall'elenco direbbe l'opposto della
   verità. Sotto la finestra un sapere è dato per scontato **più** che
   mai; è sopra che non lo è ancora. */
export function saperiDiUnEta (sa = {}, { classi = [], eta = null } = {}) {
  const spenti = new Set(spente(sa))
  const finestra = finestraDi(eta)
  /* quali gruppi cita ogni classe, e quali di quelle citazioni non sono
     oltre il tetto: la differenza fra i due insiemi è il taglio */
  const citati = new Set()
  const vivi = new Set()
  for (const c of classi)
    for (const chiave of (c.sa || [])) {
      citati.add(chiave)
      if (!finestra || c.livello <= finestra[1]) vivi.add(chiave)
    }
  return SAPERI
    .filter(s => !spenti.has(s.chiave) && s.difetto !== false)
    .filter(s => !citati.has(s.chiave) || vivi.has(s.chiave))
    .map(s => ({ chiave: s.chiave, nome: s.nome, ico: s.ico, materia: s.materia,
                 da: DA_QUANDO.get(s.chiave) ?? 0 }))
    .sort((a, b) => b.da - a.da)
}

/* ── E IL QUADRO INTERO ──
   `classi` sono le righe piatte del catalogo (`classiDelModulo` di ogni
   modulo, concatenate). Senza, la metà delle domande resta vuota e il
   resto funziona lo stesso: è il caso di Node, dove il registro non
   esiste, ed è meglio di un errore. */
/* ── CHI, IN CASA, PESCA DAVVERO DAI MODULI DI QUIZ ──
   Il difetto che questa funzione ripara è il più costoso che un
   riassunto possa avere: **dire una cosa che non succede**. Da quattro
   a cinque anni e mezzo in casa ci sono Conta gli animali, Prima e dopo
   e la fattoria — e nessuno dei tre passa da `src/quiz/`. I quattro
   blocchi delle domande elencavano lo stesso undici classi, con nomi,
   livelli e tastini per provarle: un genitore le leggeva come «ecco
   cosa gli chiederemo», e non gliele avremmo chieste mai.

   Il primo gioco che le pesca arriva a sei anni, tutto insieme
   (Survivors, il Dungeon, il sotterraneo). Dirlo è utile — è la
   risposta a «cosa si guadagna salendo ancora» — dirlo mentendo no.

   Il conto di *quando* guarda i difetti di ogni età, non le eccezioni
   di questo bambino: è la stessa promessa che fa già `giochiDiUnEta`
   con `provato: false`, cioè «cosa si offrirebbe a chi arriva a
   quell'età». Un grande che ha spento il Dungeon a mano lo vede scritto
   nel blocco dei giochi, dove è la verità sua. */
const PASSO_ETA = 0.5
const MAX_ETA = 12

export function domandeDiUnEta ({ eta, giochi = {}, sa = {}, sperimentali = false } = {}) {
  const chiedono = elenco => elenco
    .filter(g => g.stato === QUI && GIOCHI.some(x => x.chiave === g.chiave && x.quiz))
  const qui = chiedono(giochiDiUnEta({ eta, giochi, sa, sperimentali }))
  if (qui.length) return { chiedono: true, quali: qui.map(g => g.nome), da: null }

  /* nessuno: da che età ne arriverebbe uno. Mezzo anno per volta, come
     si muove la manopola — un'età che la manopola non può fermarsi a
     dire non serve a niente. */
  for (let e = (Number(eta) || 0) + PASSO_ETA; e <= MAX_ETA; e += PASSO_ETA) {
    const suoi = eccezioniPerEta(e)
    const trovati = chiedono(giochiDiUnEta({ eta: e, giochi: suoi.giochi, sa: suoi.sa,
                                             sperimentali }))
    if (trovati.length) return { chiedono: false, quali: trovati.map(g => g.nome), da: e }
  }
  return { chiedono: false, quali: [], da: null }
}

/* ── IL RITOCCO DI UNA RIGA ──
   Un grande può dire «questa per lui è mezzo anno più dura», e la riga
   si sposta di blocco. Vale per una tipologia e per un gruppo di
   sapere, e i due **si sommano**: è la stessa somma che fa già la
   scheda delle domande (`quiz/catalogo.js`), e c'è un solo modo di
   sbagliarla — farla in due posti in due modi.

   Un gradino è mezzo anno di scuola (`PASSO`), e il segno è quello del
   profilo: positivo vuol dire «per lui è più facile», quindi il
   livello scende. */
const ritoccoDi = (c, ritocchi) =>
  (ritocchi[c.tipo] || 0) + (c.sa || []).reduce((n, k) => n + (ritocchi[k] || 0), 0)

export function quadroDi ({ eta, giochi = {}, sa = {}, sperimentali = false,
                            ritocchi = {} } = {},
                          { classi = [] } = {}) {
  const spenti = spente(sa)
  const dove = doveCadeCon(eta)

  const righe = classi.map(c => ({
    chiave: c.chiave,
    nome: c.nome,
    modulo: c.nomeModulo,
    icona: c.icona,
    livello: c.livello,
    /* la stessa cosa in anni: è la lingua in cui un grande giudica —
       nessuno guarda un «54», tutti guardano «otto anni e mezzo» */
    anni: c.anni,
    /* quanto l'ha spostata un grande, e dove è finita: `anni` resta
       **quello che dice la taratura di casa**, `anniOra` è quello che
       vale per questo bambino. Servono tutti e due nello stesso posto:
       la tacca che la sposta parte dal primo e mostra il secondo. */
    ritocco: ritoccoDi(c, ritocchi),
    /* la chiave su cui si scrive un ritocco di questa riga: è la
       tipologia, non la classe — «le ore intere» al grado 1 e al grado 4
       sono la stessa cosa per chi le tara. Chi non ce l'ha (i moduli
       vecchi, che le tipologie non le dichiarano) non si può ritoccare
       da solo, e la ✎ non compare: si sposta il suo pezzo di scuola. */
    tipo: c.tipo || null,
    anniOra: Math.round(anniDelLivello(c.livello - ritoccoDi(c, ritocchi) * PASSO) * 10) / 10,
    /* tutto quello che serve a **rigenerare** quella domanda, nella
       forma che vuole `quiz/nucleo/esempi.js`: è il motivo per cui una
       riga di questo elenco si può provare col dito senza che chi la
       mostra sappia niente di moduli e di gradi. Pretendere che il nome
       dica tutto non funziona — «le analogie fra figure» a un grande non
       dice nemmeno che aspetto ha la domanda. */
    sorgente: c.sorgente,
    /* i pezzi di scuola che questa domanda dà per scontati: è la chiave
       con cui si raggruppa, e senza qui il quadro non saprebbe dire di
       che materia è una classe */
    sa: c.sa || [],
    /* una classe spenta non cade in nessuna fascia: è tolta prima, e
       metterla fra le «troppo facili» direbbe una cosa falsa */
    dove: (c.sa || []).some(s => spenti.includes(s)) || spenti.includes(c.tipo)
      ? 'spenta' : dove(c.livello - ritoccoDi(c, ritocchi) * PASSO),
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
  const ORDINE_GRUPPI = ['medie', 'toste', 'facili', 'sotto', 'spenta']
  const gia = new Set()
  const gruppi = ORDINE_GRUPPI.map(chiave => {
    const righe = inOrdine(chiave).filter(r => !gia.has(r.nome))
    righe.forEach(r => gia.add(r.nome))
    return [chiave, righe]
  })
  const gruppo = chiave => (gruppi.find(([k]) => k === chiave) || [, []])[1]

  /* ── E DENTRO OGNI BLOCCO, I PEZZI DI SCUOLA ──
     Le quattro fasce erano elenchi di classi, e accanto c'era un quinto
     blocco — «dà per scontato che sappia» — fatto di gruppi di sapere.
     Due unità di misura per la stessa roba, e nessuna delle due diceva
     l'altra: guardando «Le figure piane» fra le cose date per scontate
     non si sapeva se volesse dire i nomi delle figure o gli angoli
     ottusi, e guardando «Contare lati e vertici» fra quelle che sta
     imparando non si sapeva che pezzo di scuola fosse.

     Adesso l'unità è una sola. Ogni blocco raccoglie **i gruppi**, e
     dentro un gruppo le sue classi di quella fascia — quindi lo stesso
     gruppo può stare in due blocchi, ed è il punto: le figure piane
     sono roba che sta imparando per due domande e roba tosta per una
     terza. Il ▶ su un gruppo scorre quelle lì e nient'altro.

     IL GRUPPO DI UNA CLASSE È IL PIÙ SPECIFICO che dichiara, con la
     stessa regola della scheda delle domande (`quiz/catalogo.js`): una
     conversione di pesi sta sotto «Metri, litri e chili» e sotto «Le
     conversioni», e quello che il grande ha in mente è quasi sempre il
     più stretto, cioè quello che tiene meno domande. */
  const quanteHa = {}
  for (const c of classi) for (const k of (c.sa || [])) quanteHa[k] = (quanteHa[k] || 0) + 1
  const gruppoDi = sa => (sa || []).slice()
    .sort((x, y) => (quanteHa[x] || 0) - (quanteHa[y] || 0))[0] || null

  const perSapere = (righe, scegli = gruppoDi) => {
    const dentro = new Map()
    for (const r of righe) {
      const chiave = scegli(r.sa) || 'altro'
      if (!dentro.has(chiave)) dentro.set(chiave, [])
      dentro.get(chiave).push(r)
    }
    return [...dentro.entries()]
      .map(([chiave, classi]) => {
        const s = sapereDi(chiave)
        return {
          chiave,
          nome: s?.nome || chiave,
          ico: s?.ico || '•',
          quante: classi.length,
          /* il livello più alto che il gruppo tocca in questa fascia:
             serve a metterlo in fila con gli altri, e a dire quale pezzo
             di quel gruppo si sta guardando */
          livello: Math.max(...classi.map(c => c.livello)),
          /* ── QUELLO CHE SERVE ALLA TACCA ──
             Spostare un pezzo di scuola sposta **tutte le sue domande
             insieme**, e quelle non stanno tutte allo stesso punto: la
             tacca deve poter dire quante attraversano il confine, se no
             direbbe «finisce in Difficili» mentre due su tre restano
             dov'erano. `ritocco` è di quanto l'ha già spostato un
             grande — il numero da cui riparte la tacca aprendosi. */
          livelli: classi.map(c => c.livello),
          ritocco: ritocchi[chiave] || 0,
          spento: spenti.includes(chiave),
          classi,
        }
      })
      /* i più impegnativi per primi, come le classi dentro il gruppo */
      .sort((a, b) => b.livello - a.livello)
  }

  /* ── E IL BLOCCO DI QUELLO CHE È STATO TOLTO ──
     Il gruppo di una riga spenta non è «il più specifico che dichiara»
     ma **quello che l'ha spenta**: se un grande ha tolto «Le figure
     piane», la riga va scritta sotto quel nome — non sotto «Geometria»,
     che è ancora acceso e riaccenderlo non rimetterebbe niente.

     E un pezzo spento che non ha domande resta lo stesso: le divisioni
     vivono dentro il castello e non hanno una classe di quiz, ma se
     sparissero da qui non ci sarebbe nessun posto dove riaccenderle. */
  const spentoDi = sa => (sa || []).find(k => spenti.includes(k)) || null
  const conSpenti = righe => {
    const fila = perSapere(righe, spentoDi)
    const gia = new Set(fila.map(x => x.chiave))
    const nudi = spenti.filter(k => !gia.has(k) && sapereDi(k))
      .map(k => ({ chiave: k, nome: sapereDi(k).nome, ico: sapereDi(k).ico || '•',
                   quante: 0, livello: 0, livelli: [], ritocco: ritocchi[k] || 0,
                   spento: true, classi: [] }))
    return [...fila, ...nudi]
  }
  return {
    anni: eta,
    /* l'elenco intero, ognuno col suo stato: chi mostra decide se
       aprirlo o riassumerlo, ma il dato è sempre tutto */
    giochi: giochiDiUnEta({ eta, giochi, sa, sperimentali }),
    /* quello che il gioco dà per scontato, i più recenti per primi */
    sa: saperiDiUnEta(sa, { classi, eta }),
    /* chi gliele chiede, queste domande — e se in casa non c'è nessuno,
       da che età ne arriva uno */
    domande: domandeDiUnEta({ eta, giochi, sa, sperimentali }),
    /* L'ordine è quello in cui si leggono: dal già saputo al non
       ancora, e in fondo quello che non gli si chiede più. Le «troppo
       difficili» non ci sono: sono fuori dalla sua portata e non gli
       arrivano, e un elenco di roba che non vedrà non aiuta a
       decidere niente — quello che serve sapere, cioè che salendo
       arriverebbero, lo dice già la manopola salendo. */
    gruppi: ['facili', 'medie', 'toste', 'sotto', 'spenta'].map(chiave => {
      const righe = gruppo(chiave)
      const saperi = chiave === 'spenta' ? conSpenti(righe) : perSapere(righe)
      return { chiave, righe, saperi, quante: righe.length }
    }),
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
