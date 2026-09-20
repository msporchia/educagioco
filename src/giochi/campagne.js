/* ═══════════════════════════════════════════════════════════════════
   L'AVANZAMENTO DEI GIOCHI NUOVI — UN POSTO SOLO

   I giochi vecchi hanno ognuno il suo campo nel profilo (`td`, `mate`,
   `calc`, `eng`, `esp`, `mercato`, `lab`, `gen`) e ognuno la sua funzione
   per scriverlo: otto volte la stessa cosa, e ogni gioco nuovo era una
   migrazione in più. Qui i giochi nuovi tengono tutto sotto
   `profile.campagne[<chiave>]`, con una forma sola:

       { tappa: 0, libera: false, stelle: {}, cfg: {} }

     tappa    quante tappe sono state superate = l'indice della prossima
     libera   la campagna è finita: il gioco libero è aperto
     stelle   il PRIMATO per tappa (non la somma): rigiocare non gonfia
     cfg      quello che il bambino ha scelto e va ricordato

   Il record si tiene sempre al meglio: una partita storta non toglie la
   stella già guadagnata. È l'unica regola con cui un bambino va d'accordo.

   Questo file è il solo punto in cui un gioco nuovo tocca il profilo, e i
   giochi lo raggiungono da `Gioco.vue`: se domani il profilo cambia forma
   si cambia qui, e nessun gioco se ne accorge.
   ═══════════════════════════════════════════════════════════════════ */
import { state, persist, flushNow, tappaAperta } from '../store/profile.js'
import { tappaApertaQui } from '../data/portata-giochi.js'
/* tutti i giochi e non solo i nuovi: la partita libera del castello ha un
   record come la corsa infinita, e la tabella li vuole insieme */
import { GIOCHI } from '../data/giochi.js'
import { apriQuaderno, conRisultato, inParole, primatoInParole, dettagliInParole,
         sfideDi, sfidaDi, chiaveSfida }
  from './primati.js'

const VUOTA = () => ({ tappa: 0, libera: false, stelle: {}, cfg: {} })

/* Il record si crea al volo. Un profilo salvato ieri non ha `campagne` e
   non deve avere bisogno di una migrazione per giocare a un gioco che
   ieri non c'era: la forma la mette a posto chi legge. */
export function progresso(chiave) {
  const p = state.profile
  if (!p.campagne || typeof p.campagne !== 'object') p.campagne = {}
  const c = p.campagne[chiave]
  if (!c || typeof c !== 'object') return (p.campagne[chiave] = VUOTA())
  if (typeof c.tappa !== 'number') c.tappa = 0
  if (!c.stelle || typeof c.stelle !== 'object') c.stelle = {}
  if (!c.cfg || typeof c.cfg !== 'object') c.cfg = {}
  return c
}

/* Una tappa è aperta se è la prossima o una già fatta — oppure se i
   genitori hanno tolto i lucchetti a tutto (`tuttoAperto`). La regola sta
   in `profile.js` e passa da lì apposta: quando stava in cinque posti si
   è scollata senza che nessuno se ne accorgesse. */
/* E da quando ogni tappa dice la sua `portata`, il lucchetto guarda
   anche l'età: quello che il bambino ha già passato nasce aperto, quello
   che gli sta troppo avanti resta chiuso. Passa da qui e non dai singoli
   giochi per la stessa ragione di sempre — sette copie della stessa riga
   si scollano. */
export const aperta = (chiave, indice) => tappaApertaQui(chiave, indice, progresso(chiave).tappa)

export const stelleDi = (chiave, indice) => progresso(chiave).stelle[indice] || 0

export const stelleInTutto = chiave =>
  Object.values(progresso(chiave).stelle).reduce((n, s) => n + s, 0)

/* Una tappa portata a casa. `quante` è la lunghezza della campagna: finita
   l'ultima si apre il gioco libero, che non chiude più. */
export function completa(chiave, indice, quante, { stelle = 0 } = {}) {
  const c = progresso(chiave)
  c.tappa = Math.max(c.tappa || 0, indice + 1)
  if (c.tappa >= quante) c.libera = true
  if (stelle > (c.stelle[indice] || 0)) c.stelle[indice] = stelle
  persist()
  flushNow()     // una tappa si vince di rado: non deve perdersi
  return c
}

/* Le scelte del bambino che vanno ricordate fra una sera e l'altra: la
   difficoltà del gioco libero, il tema, quello che sarà. Non sono
   impostazioni dei genitori — quelle stanno in `settings`. */
export const scelta = (chiave, campo, seNiente = null) => {
  const v = progresso(chiave).cfg[campo]
  return v === undefined ? seNiente : v
}

/* Ricominciare un gioco da capo, e **solo quello**: i progressi degli
   altri, le monete e i traguardi restano dove sono. Serve soprattutto
   ai giochi ancora in prova, dove la forma dei dati cambia e ripartire
   puliti è più onesto che portarsi dietro un salvataggio di ieri fatto
   in un altro modo.

   Non rimborsa niente. Sembra duro e non lo è: se restituisse le monete
   spese, ricominciare diventerebbe il modo più rapido di farsele
   ridare — si compra, si azzera, si ricompra. Sta scritto nel cartello
   che chiede conferma, così chi tocca il tasto lo sa prima. */
export function azzeraCampagna(chiave) {
  const p = state.profile
  if (p.campagne) delete p.campagne[chiave]
  persist()
  flushNow()
  return true
}

/* ═══════════ una partita lasciata a metà ═══════════
   Certi giochi durano più di una seduta — una discesa del sotterraneo è
   venti minuti e quaranta domande — e chiuderli voleva dire buttarli
   via. La sosta è **quello che serve a rimettere in piedi la partita di
   ieri sera**, e sta accanto all'avanzamento perché è dello stesso
   genere: roba di questo bambino su questo gioco.

   Il formato lo decide il gioco e questo file non lo guarda mai: qui si
   tiene un oggetto e basta. Chi lo scrive ci mette dentro la sua
   versione e butta quello che non sa più leggere (`motore/sosta.js` nel
   sotterraneo).

   Una sosta per gioco, non una per tappa: due discese a metà in due
   posti diversi sono una cosa che nessun bambino ha in testa, e
   sceglierne una diventerebbe una schermata in più. */
export const sosta = chiave => progresso(chiave).sosta || null

export function salvaSosta(chiave, dato, { subito = false } = {}) {
  const c = progresso(chiave)
  if (!dato) delete c.sosta
  else c.sosta = dato
  persist()
  /* Alla chiusura non basta il salvataggio pigro: la pagina può sparire
     prima che scatti, ed è **proprio il caso** per cui la sosta esiste. */
  if (subito) flushNow()
  return dato
}

export const buttaSosta = chiave => salvaSosta(chiave, null, { subito: true })

export const haGiocato = chiave => {
  const c = state.profile.campagne
  return !!(c && c[chiave])
}

export function ricorda(chiave, campo, valore) {
  progresso(chiave).cfg[campo] = valore
  persist()
  return valore
}

/* ═══════════ i giochi che non finiscono ═══════════
   La corsa infinita e la Sopravvivenza non si vincono: si dura. Quello
   che hanno da dare è **il confronto con sé stessi**, e il conto lo fa
   `giochi/primati.js`, che è puro. Qui c'è solo il pezzo che tocca il
   profilo, che è il mestiere di questo file.

   Il record sta in `campagne[chiave].primato`, accanto a `stelle` — o
   in `campagne[chiave].primati[<sfida>]` per chi di sfide ne ha più
   d'una: il perché (e la lettura del posto vecchio, `cfg.primato`) sta
   scritto in testa a `primati.js`.

   `sfida` è la chiave di una sfida del manifesto (`libera-bosco`), e
   chi ne ha una sola non la passa. Si cerca nel manifesto perché è lì
   che una sfida dice se **eredita** il record di quando era sola: la
   chiave nuda non lo saprebbe. */
const sfidaDelGioco = (chiave, sfida) => {
  const g = GIOCHI.find(x => x.chiave === chiave)
  return sfidaDi(g && g.senzaFine, sfida) || sfida
}

export const primatoDi = (chiave, sfida = null) =>
  apriQuaderno(progresso(chiave), sfidaDelGioco(chiave, sfida))

/* Una partita senza fine è finita. Torna **cosa dire** — è record? di
   quanto? — così il gioco festeggia senza doversi ricordare il numero
   di prima, che è esattamente quello che i due giochi non facevano.

   Si scrive subito (`flushNow`) e non col salvataggio pigro: una
   partita dura minuti, quindi succede di rado, e il momento in cui
   finisce è anche quello in cui un bambino chiude l'app per andare a
   cena. Un record perso lì non torna più. */
export function segnaPrimato(chiave, valore, quando = Date.now(), dettagli = null, sfida = null) {
  const c = progresso(chiave)
  const s = sfidaDelGioco(chiave, sfida)
  const { quaderno, esito } = conRisultato(apriQuaderno(c, s), valore, quando, dettagli)
  const k = chiaveSfida(s)
  if (k) {
    if (!c.primati || typeof c.primati !== 'object') c.primati = {}
    c.primati[k] = quaderno
  } else c.primato = quaderno
  /* il posto vecchio si legge una volta e poi si lascia andare: due
     numeri che dicono la stessa cosa divergono al primo giro. Lo lascia
     andare solo chi lo eredita — una sfida che non ne ha diritto non
     deve buttare il record che un'altra sta per raccogliere. */
  const erede = !k || (s && typeof s === 'object' && s.eredita)
  if (erede && k && c.primato !== undefined) delete c.primato
  if (erede && c.cfg && c.cfg.primato !== undefined) delete c.cfg.primato
  persist()
  flushNow()
  return esito
}

/* ═══════════ i regali della partita libera ═══════════
   Il castello regala un potenziamento ogni cinque ondate della partita
   libera, e **resta per sempre**: sta accanto al record perché è della
   stessa specie — roba di questo bambino su questo gioco, che
   sopravvive alla partita. Il catalogo e i numeri stanno in
   `data/castello.js`; qui c'è solo il pezzo che tocca il profilo.

   La lettura non passa da `progresso()` apposta: quella scrive la voce
   che non c'è, e la mappa del castello legge questo numero ogni volta
   che si apre — non è un motivo per scrivere nel profilo. Un profilo di
   ieri non ha il campo, e parte da zero senza nessuna migrazione. */
export const regaliDi = chiave => {
  const c = (state.profile.campagne || {})[chiave]
  const r = c && c.regali
  return r && typeof r === 'object' ? r : {}
}

/* Un grado in più, e si scrive subito: un regalo si prende ogni cinque
   ondate, cioè di rado, e il momento in cui lo si prende è anche quello
   in cui la partita può finire male. Torna la mappa aggiornata, perché
   chi l'ha chiesto la deve mostrare. */
export function regaloPreso(chiave, id) {
  const c = progresso(chiave)
  if (!c.regali || typeof c.regali !== 'object') c.regali = {}
  c.regali[id] = (c.regali[id] || 0) + 1
  persist()
  flushNow()
  return { ...c.regali }
}

/* ── LA TABELLA DEI RECORD ──
   Una riga per sfida senza fine, per la pagina dei progressi. La
   compone qui e non nella vista perché mettere insieme i manifesti e il
   profilo è roba di store: l'albo è una vetrina e non deve calcolare
   niente.

   Si mostrano solo le sfide **già giocate almeno una volta**: una
   tabella di record vuoti non è un invito, è un elenco di cose che non
   hai fatto — e dove si va a farle lo dice la mappa del gioco, non
   questa pagina. */
export function tabellaDeiPrimati() {
  /* si legge e basta, senza passare da `progresso()`: quella crea la
     voce che non c'è, e una pagina che guarda i record non ha nessun
     motivo di scrivere nel profilo undici campagne mai giocate */
  const tutte = state.profile.campagne || {}
  /* una riga per sfida, non per gioco: il castello ne ha quattro, e
     `id` è quello che distingue le righe fra loro (`torri/libera-bosco`) */
  return GIOCHI.filter(g => g.senzaFine).flatMap(g => sfideDi(g.senzaFine).map(s => {
    const q = apriQuaderno(tutte[g.chiave] || {}, s)
    return {
      id: s.chiave ? `${g.chiave}/${s.chiave}` : g.chiave,
      chiave: g.chiave,
      sfida: s.chiave,
      gioco: g.nome,
      icona: s.icona || g.ico,
      nome: s.nome,
      che: s.che,
      misura: s.misura,
      best: q.best,
      parole: primatoInParole(q, s.misura),
      dettagli: dettagliInParole(q, s),   // «580 mostri · livello 6», o vuoto
      quando: q.quando,
      partite: q.partite,
      /* i risultati più recenti, dal più vecchio al più nuovo: sotto
         forma di barrette si legge da sinistra a destra come il tempo */
      ultime: q.ultime.map(u => ({ ...u, parole: inParole(u.v, s.misura) })).reverse(),
    }
  })).filter(r => r.partite > 0 || r.best > 0)
}
