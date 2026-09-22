/* ═══════════════════════════════════════════════════════════════════
   IL PROSSIMO PASSO — OGNI «NON SI PUÒ» PORTA CON SÉ COSA FARE

   ── LA REGOLA ─────────────────────────────────────────────────────
   In questa fattoria un cartello non dice mai soltanto che una cosa non
   si può. Dice **cosa fare adesso**, e possibilmente porta il tasto per
   farlo. «Non hai abbastanza mangime» è un vicolo cieco; «ti servono 3
   🌾: hai un campo libero, seminaci del grano» è una partita che
   continua.

   Il motivo non è di stile. Un bambino di sei anni davanti a un no non
   ricostruisce una catena di produzione a ritroso: chiude il gioco. Ed
   è **doppiamente vero qui**, perché la fattoria è il posto dove si
   spende quello che si è guadagnato studiando altrove — se il premio si
   inceppa, si smette di guadagnarlo.

   ── COME FUNZIONA ─────────────────────────────────────────────────
   Una domanda sola, `comeAvere(f, prodotto)`, e la risposta risale la
   catena **da sola** finché non trova un passo che si può fare oggi:

     manca il becchime
       → serve il fienile: non ce l'hai     → «compra il fienile 🪙150»
       → ce l'hai ma sta lavorando          → «pronto fra 4 min»
       → ce l'hai ma ha roba da ritirare    → «ritira quello che ha fatto»
       → è libero, ma mancano 3 🌾          → *si richiede la stessa cosa al grano*
           → hai un campo libero            → «seminaci del grano»
           → i campi sono tutti occupati    → «fanne un altro 🪙22»
           → non hai campi                  → «ti serve un campo 🪙22»

   La ricorsione ha un fondo (`giri`) perché una tabella scritta male
   potrebbe avere un anello — il pastone che serve al pastone — e un
   consiglio che si avvita è peggio di nessun consiglio: blocca il
   fotogramma.

   ── COSA TORNA ────────────────────────────────────────────────────
   `{ testo, azione }`. `testo` è una frase intera da mostrare;
   `azione`, se c'è, è quello che il tasto deve fare, in una delle
   quattro forme che `Gioco.vue` sa eseguire:

     { che: 'apri',  cosa, con }         apre il foglio di quella cosa,
                                         già sulla merce `con` se l'ha
     { che: 'compra', voce, prezzo }     apre il baule su quella voce
     { che: 'premio', voce }             apre la pagina dei livelli:
                                         quella cosa è arrivata e
                                         aspetta di essere presa
     { che: 'ingrandisci', famiglia }    allarga quel silo
     null                                c'è solo da aspettare

   Non sa niente di Vue, di monete del profilo o di pixel: riceve la
   fattoria e legge. Gira in Node, e infatti si prova senza browser.
   ═══════════════════════════════════════════════════════════════════ */
import { COLTURE, RICETTE, PRODOTTI, SILI, PROFONDITA } from '../dati/coltivazioni.js'
import { PER_ID, eCampo, macchinaDi } from '../dati/catalogo.js'
import { livelloDelProdotto, livelloDellaVoce } from '../dati/livelli.js'
import { megliaDi } from '../dati/mercato.js'
import { carrettoIn, DAI } from './vicino.js'

/* Quanto in là si risale prima di arrendersi. È `PROFONDITA` di
   `dati/coltivazioni.js`, scritta una volta per i quattro conti che
   risalgono la catena, e non un numero di questo file.

   Lo era: tre più uno finché il pollaio mangiava il grano così com'era,
   poi cinque col fienile in mezzo. Un numero troppo piccolo qui non dà
   nessun errore: dà un consiglio che si ferma a «il becchime si fa in
   fattoria», cioè un vicolo cieco proprio dove il consiglio doveva
   togliere il compito — e con la stoffa a quattro passi dall'erba
   sarebbe successo di nuovo. */
const GIRI = PROFONDITA

/* ── QUANDO SI SCRIVE IL NOME E QUANDO L'EMOJI ────────────────────
   Da quando ogni merce ha **una figura vera** (`dati/coltivazioni.js`,
   campo `pezzo`) l'emoji che le sta scritta accanto è un ripiego, e in
   certi casi non le somiglia affatto: il foraggio è una balla di fieno
   pressata e la sua emoji è un cespo d'insalata. Finché stanno in due
   posti diversi non importa; ma questi consigli compaiono **dentro il
   foglio della macchina**, sotto le caselle che disegnano quella stessa
   merce — e lì un'emoji che non le assomiglia si legge come una seconda
   cosa. «Mi servono le balle di fieno o le insalate?»

   Quindi qui la merce si chiama **per nome**. L'emoji resta dove non c'è
   nessun disegno a contraddirla: le colture (la cassa di carote e la
   carota si somigliano) e le monete. */
const merce = id => roba(id).nome.toLowerCase()

/* ── LE RICETTE CHE ESISTONO **PER CHI GIOCA** ────────────────────
   `RICETTE` è la tabella intera; quella che si può fare adesso è un
   sottoinsieme, perché una ricetta compare col suo livello
   (`dati/coltivazioni.js`, campo `liv`). Consigliarne una che il
   bambino non ha ancora aperto manda a cercare un tasto che nel
   pannello non c'è: «il grano è pieno, usalo nel fienile» detto a chi
   nel fienile ha solo il foraggio di carote. È lo stesso conto che fa
   il pannello di una macchina (`ricetteDi`), e va fatto qui per lo
   stesso motivo. */
const leRicette = f => RICETTE.filter(r => (r.liv || 1) <= f.livello)
/* ── GLI ARTICOLI ─────────────────────────────────────────────────
   «nel mulino», ma «nell'ovile», ma «nella stalla», ma «nello stagno
   delle anatre», ma «nelle arnie». Non è pignoleria da grammatici:
   queste frasi le legge ad alta voce un genitore a un bambino che sta
   imparando a leggere, e «nel ovile» è esattamente il tipo di sbaglio
   che poi si risente ripetuto.

   Stanno qui in tre funzioni sole perché la stessa coda la scrivono in
   quattro posti, e perché quando erano sparse una sapeva il femminile
   e le altre no.

   **Il genere è l'unica cosa che si dichiara** (`la` sulla voce di
   catalogo, vedi lì il perché): il resto è meccanico e si ricava dal
   nome — l'apostrofo davanti a una vocale, lo `lo` davanti alla esse
   impura e alle altre di quella specie, il plurale.

   Il plurale non c'era affatto, e il difetto era in piena vista: «I
   tuoi fienile stanno lavorando». La regola italiana copre tutti i
   nomi di questo catalogo (-a → -e, -io → -i, -o/-e → -i), e chi è
   già plurale lo dice (`plurale: true`, le arnie). */
const vocale = n => /^[aeiou]/i.test(n)
/* La esse impura e compagnia: davanti a queste l'articolo è «lo». Non
   è un caso di scuola — «Stagno delle anatre» sta nel catalogo, e
   diceva «nel stagno». */
const impura = n => /^(s[^aeiouh]|z|gn|pn|ps|x|y)/i.test(n)

const articoloDi = v => {
  const n = (v.nome || '').toLowerCase()
  if (v.plurale) return v.la ? 'le' : vocale(n) || impura(n) ? 'gli' : 'i'
  if (vocale(n)) return "l'"
  return v.la ? 'la' : impura(n) ? 'lo' : 'il'
}
const IN = { il: 'nel', lo: 'nello', la: 'nella', "l'": "nell'", i: 'nei', gli: 'negli', le: 'nelle' }
const stacca = a => a.endsWith("'") ? a : a + ' '

/* «nella sartoria». Vuole **la voce**, non il nome: il genere sta sulla
   voce, e una funzione che prende una stringa si fa chiamare senza. */
export const dentroA = v => {
  if (!v) return ''
  const a = articoloDi(v)
  return stacca(IN[a]) + (v.nome || '').toLowerCase()
}
/* «la sartoria» — per le frasi che cominciano con lei serve la
   maiuscola, e la mette chi scrive la frase (`Su`). */
export const laCosa = v => v ? stacca(articoloDi(v)) + (v.nome || '').toLowerCase() : ''
export const Su = s => s.charAt(0).toUpperCase() + s.slice(1)

/* «le tue sartorie», «i tuoi fienili» — e **si piega solo la prima
   parola**. Mezzo catalogo ha un nome composto («Silo del raccolto»,
   «Stagno delle anatre», «Recinto delle capre») e a piegare l'ultima
   venivano fuori «i tuoi silo del raccolti» e «i tuoi stagno delle
   anatri»: quello che va al plurale è il nome, non il suo
   complemento. */
const unaParola = n =>
  /a$/i.test(n) ? n.replace(/a$/i, 'e')
  : /io$/i.test(n) ? n.replace(/io$/i, 'i')
  : /[oe]$/i.test(n) ? n.replace(/[oe]$/i, 'i')
  : n
const alPlurale = n => n.replace(/^\S+/, unaParola)
export const leTue = v => {
  if (!v) return ''
  const n = (v.nome || '').toLowerCase()
  return `${v.la ? 'le tue' : 'i tuoi'} ${v.plurale ? n : alPlurale(n)}`
}

/* Il verbo che concorda con quello che `laCosa` ha appena scritto.
   «Le arnie ha qualcosa da ritirare» è la frase che esce quando il
   nome è già plurale e il verbo è rimasto al singolare: il dato lo
   sa (`plurale`), quindi si concorda invece di sperare. */
export const concorda = (v, uno, tanti) => (v && v.plurale) ? tanti : uno
const roba = id => PRODOTTI[id] || { nome: id, emoji: '📦' }

/* I campi che ci sono, divisi in quello che a chi consiglia interessa:
   uno libero è un posto dove seminare adesso, uno pronto è un raccolto
   che aspetta, uno che cresce è solo tempo. */
function iCampi(f, ora) {
  const campi = f.cose.filter(eCampo)
  return {
    tutti: campi,
    liberi: campi.filter(c => (f.statoCampo(c, ora) || {}).vuoto),
    pronti: campi.filter(c => (f.statoCampo(c, ora) || {}).pronto),
  }
}

/* Le macchine di un tipo, divise allo stesso modo: ferma vuol dire che
   ci si può mettere qualcosa, pronta che c'è da ritirare. */
function leMacchine(f, quale, ora) {
  const tutte = f.cose.filter(c => macchinaDi(c) === quale)
  return {
    tutte,
    ferme: tutte.filter(c => (f.statoMacchina(c, ora) || {}).ferma),
    pronte: tutte.filter(c => (f.statoMacchina(c, ora) || {}).pronto),
    /* quella che finirà prima: è il numero da dire, non «fra un po'» */
    prima: tutte.map(c => f.statoMacchina(c, ora))
      .filter(s => s && !s.ferma && !s.pronto)
      .sort((a, b) => a.manca - b.manca)[0] || null,
  }
}

/* Quale voce di catalogo comprare per avere una macchina di quel tipo.
   Si guarda il catalogo e non un elenco a parte: un elenco da tenere
   allineato a mano è un elenco che si scosta. */
const vocePerMacchina = quale =>
  Object.values(PER_ID).find(v => v.macchina === quale) || null

const voceCampo = () => Object.values(PER_ID).find(v => v.campo) || null

/* ── COMPRARE UNA COSA, DETTO IN DUE PEZZI ────────────────────────
   `acquisto` risponde se si può e a che prezzo; `costa` scrive la coda
   della frase. Sono separati perché la frase la deve scrivere chi
   conosce il contesto: «ti serve un campo (🪙22)» e «i tuoi campi sono
   occupati: fanne un altro (🪙22)» sono la stessa spesa detta in due
   momenti diversi della partita, e una funzione che le compone tutte e
   due da un prefisso produce l'italiano storto che si legge nei giochi
   tradotti male.

   Un tasto che manda a comprare una cosa che il livello non ha ancora
   aperto sarebbe un tasto rotto: allora niente azione e si dice **a che
   livello arriva**, che è una cosa da desiderare invece che un no.

   E c'è un terzo caso in mezzo ai due, da quando i premi si vanno a
   prendere a mano (`dati/livelli.js`): la cosa **è arrivata** ma nessuno
   l'ha ancora presa, quindi nel baule non c'è. Mandare lì sarebbe di
   nuovo un tasto rotto — e la cosa da fare è a due passi, dietro il
   gettone del livello — quindi si manda dove sta il premio. */
function acquisto(f, voce) {
  if (!voce) return null
  const liv = livelloDellaVoce(voce)
  if (liv > f.livello) return { voce, arriva: liv, prezzo: null, azione: null }
  if (!f.sbloccata(voce.id))
    return { voce, arriva: null, premio: true, prezzo: null,
             azione: { che: 'premio', voce: voce.id } }
  const prezzo = f.quantoCosta(voce.id)
  return { voce, arriva: null, prezzo,
           azione: { che: 'compra', voce: voce.id, prezzo } }
}

const costa = a => a.arriva ? `arriva al livello ${a.arriva}`
  : a.premio ? 'ti aspetta nei premi' : `🪙${a.prezzo}`

/* ── COME SI HA UNA COSA ──────────────────────────────────────────
   La domanda che tutto il resto gira a questo file. `quanti` serve solo
   a scrivere la frase; la strada è la stessa che ne manchi uno o dieci. */
export function comeAvere(f, prodotto, ora = Date.now(), giri = GIRI) {
  const pr = roba(prodotto)
  if (giri <= 0) return { testo: `${pr.emoji} ${pr.nome} si fa in fattoria.`, azione: null }

  /* Prima si guarda se cresce in un campo: è la strada più corta e la
     più facile da capire, e a parità di possibilità è quella da dire. */
  const coltura = COLTURE.find(c => c.da === prodotto)
  if (coltura) {
    const dal = daiCampi(f, coltura, ora)
    if (dal) return dal
  }

  /* Poi le macchine. Più ricette per la stessa roba (la lana esce
     dall'ovile e dalla conigliera) si guardano tutte, e vince la prima
     che si può fare **davvero**: consigliare l'ovile a chi ha solo la
     conigliera manda a spendere il triplo per niente. */
  /* E fra quelle, **prima quella che ha già tutto in granaio**: con due
     fieni in mano e il fienile fermo il consiglio diceva «ti mancano 2
     carote, fanne un campo», perché il foraggio di carote sta prima in
     tabella e un consiglio con un tasto vinceva su quello dopo. Chi ha
     gli ingredienti di una strada non va mandato a comprare per
     l'altra. */
  /* ...e poi **la più economica, e a parità la più svelta**, che è
     l'ordine di `megliaDi` in `dati/mercato.js`. Era l'ordine della
     tabella, e l'albero della stessa merce ne sceglieva un'altra: vedi
     lì perché sono la stessa funzione. */
  const haTutto = r => Object.keys(r.prende || {}).every(k => f.quantoHo(k) >= r.prende[k])
  const ricette = leRicette(f).filter(r => r.da === prodotto).sort(megliaDi(haTutto))
  let ripiego = null
  for (const r of ricette) {
    const dalla = dallaMacchina(f, r, ora, giri)
    if (!dalla) continue
    if (dalla.azione) return dalla
    ripiego = ripiego || dalla
  }
  if (ripiego) return ripiego

  /* Nessuna strada aperta adesso: allora si dice **quando** si aprirà.
     «Non si fa in fattoria» è falso e scoraggia; «arriva al livello 10»
     è vero ed è una cosa da aspettare. */
  const quando = livelloDelProdotto(prodotto)
  if (quando > f.livello && quando < Infinity)
    return { testo: `${pr.emoji} ${pr.nome} arriva al livello ${quando}.`, azione: null }
  return { testo: `${pr.emoji} ${pr.nome} non si fa in fattoria.`, azione: null }
}

/* La strada del campo. L'ordine delle risposte è l'ordine in cui sono
   utili: prima quello che si può fare adesso, poi quello che c'è solo
   da aspettare, poi la spesa. */
function daiCampi(f, coltura, ora) {
  const { tutti, liberi, pronti } = iCampi(f, ora)

  /* Prima di tutto: **dove finirà**. Mandare a seminare chi non ha il
     silo vuol dire mandarlo ad aspettare dieci minuti veri per trovarsi
     davanti un altro no — e quel secondo no arriva quando il lavoro è
     già fatto, che è il momento peggiore in cui possa arrivare. Vale
     solo a campi fermi: se ce n'è già uno pronto, la cosa da dire è
     quella (e `comeFarePosto` dirà il resto). */
  const fam = (PRODOTTI[coltura.da] || {}).silo
  if (fam && !f.eCostruito(fam) && !pronti.length) {
    const a = acquisto(f, Object.values(PER_ID).find(v => v.silo === fam))
    const si = SILI[fam]
    if (a && si)
      return { testo: `Prima ti serve ${laCosa(si)} (${costa(a)}):` +
                      ` è lì che finisce ${coltura.emoji} quando lo raccogli.`,
               azione: a.azione }
  }
  const suo = tutti.filter(c => (f.statoCampo(c, ora) || {}).coltura === coltura)

  /* Ce n'è già uno pronto: la cosa da fare è raccoglierlo, non
     seminarne un altro. */
  const suoPronto = suo.find(c => pronti.includes(c))
  if (suoPronto)
    return { testo: `Hai ${coltura.emoji} pronto in un campo: raccoglilo.`,
             azione: { che: 'apri', cosa: suoPronto } }

  if (liberi.length)
    return { testo: `Hai un campo libero: seminaci ${coltura.emoji} ${coltura.nome.toLowerCase()}` +
                    ` (🪙${coltura.semina}, ${coltura.minuti} min).`,
             azione: { che: 'apri', cosa: liberi[0] } }

  /* Nessun campo libero, ma uno sta crescendo con la roba giusta: c'è
     solo da aspettare, e si dice quanto. */
  const inArrivo = suo.map(c => f.statoCampo(c, ora)).filter(s => s && !s.vuoto && !s.pronto)
    .sort((a, b) => a.manca - b.manca)[0]
  if (inArrivo)
    return { testo: `${coltura.emoji} sta crescendo: pronto fra ${inArrivo.manca} min.`,
             azione: null }

  if ((coltura.liv || 1) > f.livello)
    return { testo: `${coltura.emoji} ${coltura.nome} arriva al livello ${coltura.liv}.`,
             azione: null }

  /* Campi ce ne sono, ma sono tutti occupati da altro: la cosa da fare
     è farne un altro. È il caso che più spesso lasciava fermi — i campi
     ci sono, quindi il gioco non diceva niente, ma nessuno è libero. */
  const a = acquisto(f, voceCampo())
  if (!a) return null
  return { testo: tutti.length
             ? `I tuoi campi sono tutti occupati: fanne un altro (${costa(a)}).`
             : `Ti serve un campo dove seminare (${costa(a)}).`,
           azione: a.azione }
}

/* La strada della macchina, e la ricorsione: se la macchina c'è ed è
   libera ma mancano gli ingredienti, la domanda si sposta **su quelli**
   invece di fermarsi a «non c'è abbastanza roba». */
function dallaMacchina(f, ricetta, ora, giri) {
  const voce = vocePerMacchina(ricetta.dove)
  const { tutte, ferme, pronte, prima } = leMacchine(f, ricetta.dove, ora)

  if (!tutte.length) {
    const a = acquisto(f, voce)
    if (!a) return null
    return { testo: `${ricetta.nome} si fa ${dentroA(voce)},` +
                    ` che non hai (${costa(a)}).`,
             azione: a.azione }
  }

  /* Una che ha già finito: ritirare è gratis e immediato, quindi viene
     prima di qualunque altra cosa. */
  if (pronte.length)
    return { testo: `${Su(laCosa(voce))} ${concorda(voce, 'ha', 'hanno')}` +
                    ' qualcosa da ritirare.',
             azione: { che: 'apri', cosa: pronte[0] } }

  if (ferme.length) {
    /* Libera: manca qualcosa da metterci dentro? Si risale a quello. */
    const manca = Object.keys(ricetta.prende)
      .filter(k => f.quantoHo(k) < ricetta.prende[k])
    if (!manca.length)
      return { testo: `Hai tutto: fai ${ricetta.nome.toLowerCase()}` +
                      ` ${dentroA(voce)}.`,
               azione: { che: 'apri', cosa: ferme[0] } }
    const k = manca[0]
    const quanti = ricetta.prende[k] - f.quantoHo(k)
    const sotto = comeAvere(f, k, ora, giri - 1)
    return { testo: `Ti ${quanti === 1 ? 'manca' : 'mancano'} ${quanti} ${merce(k)}.` +
                    ` ${sotto.testo}`,
             azione: sotto.azione }
  }

  /* Tutte occupate. Due risposte diverse: se ne finisce una presto si
     aspetta, se no se ne fa un'altra — che è la cosa che l'utente
     chiede di proporre invece di lasciare fermi. */
  const quante = tutte.length === 1
    ? `${Su(laCosa(voce))} ${concorda(voce, 'sta', 'stanno')} lavorando`
    : `${Su(leTue(voce))} stanno lavorando`
  if (prima && prima.manca <= 5)
    return { testo: `${quante}: pronto fra ${prima.manca} min.`, azione: null }
  const a = acquisto(f, voce)
  if (!a) return { testo: `${quante}.`, azione: null }
  return { testo: `${quante}${prima ? ` (ancora ${prima.manca} min)` : ''}:` +
                  ` fanne un altro (${costa(a)}).`,
           azione: a.azione }
}

/* ── QUANDO NON C'È POSTO ─────────────────────────────────────────
   L'altra faccia: non «mi manca», ma «non ci sta». Tre risposte
   diverse per tre cose da fare diverse, e sbagliarne una manda a
   spendere per la cosa sbagliata.

   La prima è **usare quello che si ha**, e viene prima della spesa
   apposta: uno scomparto pieno di grano con il mulino fermo non è un
   problema di magazzino, è un mulino da far partire. Chi paga per
   ingrandire il silo in quel momento ha pagato per non aver capito. */
export function comeFarePosto(f, prodotto, ora = Date.now()) {
  const pr = roba(prodotto)
  const fam = pr.silo
  const si = SILI[fam] || SILI.terra

  if (!f.eCostruito(fam)) {
    const a = acquisto(f, Object.values(PER_ID).find(v => v.silo === fam))
    if (!a) return { testo: `${pr.emoji} non ha dove andare.`, azione: null }
    return { testo: `${pr.emoji} non ha dove andare: ti serve` +
                    ` ${laCosa(si)} (${costa(a)}).`,
             azione: a.azione }
  }

  /* Chi consuma questa roba, e può farlo adesso. */
  const usa = leRicette(f).filter(r => (r.prende || {})[prodotto])
  for (const r of usa) {
    if (f.quantoHo(prodotto) < r.prende[prodotto]) continue
    const { ferme } = leMacchine(f, r.dove, ora)
    if (!ferme.length) continue
    const voce = vocePerMacchina(r.dove)
    return { testo: `Lo scomparto ${pr.emoji} è pieno. Usane ${r.prende[prodotto]}` +
                    ` ${dentroA(voce)}: ${r.resa} ${r.nome.toLowerCase()}.`,
             azione: { che: 'apri', cosa: ferme[0] } }
  }

  /* Nessuna macchina lo consuma. Prima di mandare a pagare, il
     carretto: dare via cinque pezzi non costa niente e sblocca subito,
     mentre ingrandire il silo costa monete che chi è in stallo spesso
     non ha — è lo stesso bambino, nello stesso pomeriggio. */
  if (carrettoIn(f) && f.quantoHo(prodotto) >= DAI)
    return { testo: `Lo scomparto ${pr.emoji} è pieno. Danne ${DAI} al vicino:` +
                    ' ti dà qualcos\'altro in cambio, e non costa niente.',
             /* `con`: **quale merce**, non solo dove andare. Il carretto
                si apre in due passi — cosa dai, cosa prendi — e chi ci
                arriva da qui il primo passo l'ha già fatto: è venuto
                perché *quello* è pieno. Aprirlo alla domanda «cosa gli
                dai?» rimette il compito che il consiglio doveva
                togliere, ed è lo stesso motivo per cui il baule aperto
                da un consiglio si apre sulla voce giusta. */
             azione: { che: 'apri', cosa: carrettoIn(f), con: prodotto } }

  /* Nessuno lo consuma adesso: allora sì, si allarga il silo. */
  const costo = f.costoDellIngrandimento(fam)
  return { testo: `Lo scomparto ${pr.emoji} è pieno (${f.capienzaDi(fam)}).` +
                  ` Ingrandisci ${laCosa(si)}: ${costo} monete,` +
                  ' e cresce anche il posto per tutto il resto.',
           azione: { che: 'ingrandisci', famiglia: fam, prezzo: costo } }
}
