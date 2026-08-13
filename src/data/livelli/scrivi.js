/* ═══════════════════════════════════════════════════════════════════
   COME SI SCRIVE UN LIVELLO

   Tre famiglie, tre elenchi che l'editor ti mostra quando scrivi il
   punto:

     cose.*   quello che sta sul campo   (porte, tesori, leve, posti)
     chi.*    chi ci cammina dentro      (i nostri, i nemici, i terzi)
     fai.*    gli ordini e le domande    (vai, prendi, vedi, hai)

   ── perché tre nomi e non trenta import ──
   Perché la lista si vede. Scrivi `cose.` e sai cosa puoi mettere in
   una stanza, senza aprire nessun file. E perché toglie un'ambiguità
   vera: **`porta` in italiano è anche un verbo**, e `cose.porta()` non
   si confonde con niente.

   ── perché fabbriche e non `new` ──
   Un livello resta **dato**: nessuna istanza, nessuno stato. Tre
   ragioni, in ordine di forza:
     · l'editor deve poter **rileggere** un livello, disegnarlo col
       mouse e riscriverlo. Un dato si rilegge; una sequenza di `new`
       si può solo generare;
     · le varianti sono toppe stese sopra il dato;
     · un livello lo importano anche il validatore e l'editor, che non
       hanno il motore.
   Le classi ci sono e fanno il loro mestiere (`motore/generale/
   elementi/`): il `new` lo fa il motore, una volta per partita, a
   partire dal biglietto che queste fabbriche scrivono.

   ── la forma di una chiamata ──
   `fabbrica(id, nome?, opzioni?)` — l'id è la chiave con cui la cosa
   si nomina negli ordini, il nome è come si legge in una frase, e in
   coda le opzioni. Il nome è facoltativo: senza, si usa l'id.

       cose.porta('grata', 'la grata di levante', { chiave: 'rossa', forza: 6 })
       chi.nemico('orco', { corpo: 'orco', vista: 2, fa: [fai.attacca('eroe')] })
   ═══════════════════════════════════════════════════════════════════ */

/* ── I DEFAULT, CHE SONO METÀ DEL PUNTO ──
   Una chiamata scrive **solo quello che ha di suo**. `cose.tesoro()` è
   già l'id `tesoro`, il nome «il tesoro», il forziere per disegnarlo e
   il 💰 per nominarlo: sono le cose che sarebbero uguali nel 99% dei
   livelli, e ripeterle a ogni riga vuol dire solo poterle sbagliare.
   Si scrivono quando sono diverse — `cose.tesoro('bottino', 'il
   bottino dei banditi')` — e non prima.

   Tutti gli argomenti sono facoltativi e si riconoscono dal tipo:
       cose.tesoro()
       cose.tesoro('bottino')
       cose.tesoro('bottino', 'il bottino')
       cose.tesoro({ em: '💎' })
*/
/* ── UNA COSA SI PASSA, NON SI CITA ──
   `prendi(tesoro)` invece di `prendi('tesoro')`: la variabile la
   dichiari una volta e poi la usi, e un refuso diventa un errore
   subito invece di un ordine che non trova niente. Le stringhe restano
   ammesse — servono per riferirsi a qualcosa che sta in un altro file
   — ma non sono più il modo normale. */
export const idDi = x => (x && typeof x === 'object' ? x.id : x)

import { vicino } from './livello.js'
import { NOMI_SUOLI, NOMI_MURI } from '../../grafica/materiali/suoli.js'
import { NOMI_ARREDO } from '../../grafica/oggetti/indice.js'

/* ── LE OPZIONI CHE OGNI GENERE CAPISCE ──
   `livello()` rifiuta da un pezzo le chiavi sconosciute *del livello*;
   qui sotto ci sono quelle di una COSA e di un'UNITÀ, che finora non le
   guardava nessuno. Una chiave che il motore non legge passava liscia e
   non faceva niente, **in silenzio** — ed è così che la sesta prova del
   tutorial è rimasta rotta a lungo: il carceriere era scritto
   `{ accorre: 'richiamo' }`, ma `accorre` non esiste più da quando chi
   corre al rumore si dichiara con `reagisce`. Il livello che insegna
   «il rumore sposta chi lo sente» era l'unico in cui il rumore non
   spostava niente, e il banco poteva solo dire «perde», mai «perché».
   Un refuso come `vede: 4` invece di `vista: 4` fa la stessa fine, e
   lascia un livello tarato a occhio su un nemico cieco.

   ── QUANDO IL MOTORE CAMBIA, QUESTO ELENCO CAMBIA CON LUI ──
   È il suo prezzo, ed è quello giusto da pagare: una chiave tolta dal
   motore e lasciata qui torna a passare in silenzio, ma una chiave
   tolta dal motore e tolta anche da qui fa **esplodere all'import** i
   livelli che la usano ancora — cioè dice subito chi va aggiornato,
   che è esattamente quello che è mancato con `accorre`. */
export const COMUNI = ['id', 'nome', 'genere']
export const OPZIONI = {
  unita: ['corpo', 'emoji', 'vista', 'vita', 'sa', 'nonRiesce', 'fa', 'reagisce',
          'schiera', 'schieraNome', 'parte', 'arma', 'grida', 'zaino', 'mani', 'tasche'],
  porta: ['stile', 'chiave', 'forza', 'aMano', 'aperta', 'rumore', 'cigolio'],
  oggetto: ['pittore', 'em', 'specie', 'raggio', 'arma', 'tasca'],
  leva: ['collegata'],
  totem: ['collegata', 'tacche'],
  segnale: ['em', 'col', 'voce'],
  /* un posto può avere una faccia: la legnaia si disegna come una
     catasta, la siepe come un cespuglio (vedi `elementi/posto.js`) */
  posto: ['pittore', 'em', 'strato'],
  segnaposto: [],
  suolo: [],
  muro: [],
  arredo: [],
}

export function controllaOpzioni (genere, id, opz) {
  const ammesse = OPZIONI[genere]
  if (!ammesse) return                     // genere nuovo: non si inventa una regola
  /* le specifiche PRIMA delle comuni: a parità di distanza `vicino`
     tiene la prima, e «vede» deve suggerire «vista», non «id» */
  const tutte = [...ammesse, ...COMUNI]
  for (const k of Object.keys(opz || {})) {
    if (tutte.includes(k)) continue
    const forse = vicino(k, tutte)
    throw new Error(`${genere} «${id}»: «${k}» non è un'opzione di ${genere}` +
                    (forse ? ` — forse intendevi «${forse}»?` : '') +
                    `\n  quelle che capisce: ${tutte.join(', ')}`)
  }
}

const fabbrica = (genere, fissi = {}) => (...arg) => {
  const testi = arg.filter(a => typeof a === 'string')
  const opz = arg.find(a => a && typeof a === 'object') || {}
  const id = testi[0] || fissi.id
  if (!id) throw new Error(`${genere}: senza id non si può nominare negli ordini`)
  controllaOpzioni(genere, id, opz)
  return { ...fissi, genere, id, nome: testi[1] || opz.nome || fissi.nome || id, ...opz }
}

/* ── LA MAPPA E LA SUA LEGENDA SONO UNA COSA SOLA ──
   Erano due campi del livello, uno accanto all'altro e scorrelati: si
   poteva cambiare la mappa e lasciare indietro la legenda, o togliere
   una voce e non accorgersi che un token era rimasto orfano. Un token
   senza legenda non vuol dire niente — è la stessa cosa detta due
   volte solo se stanno separate.

       scena: campo([
         '##|##|##|##',
         '##|@@|T$|##',
       ], { '@@': eroe, 'T$': tesoro }),

   Una variante ridisegna la stanza e **eredita la legenda** se non ne
   passa una sua: gli attori sono gli stessi, cambia dove stanno. */
export const campo = (righe, legenda) => ({ righe, legenda })

/* ═══════════ cose — quello che sta sul campo ═══════════ */
export const cose = {
  /* un punto con un nome: non si prende e non si apre, ci si va */
  posto: fabbrica('posto'),

  /* un varco. Le tre proprietà si combinano fra loro:
       chiave  senza quella chiave in zaino non si apre
       forza   si sfonda: n battiti di spallate, con o senza serratura
       aMano   se `false`, non si apre camminandoci: serve un congegno
     Lo `stile` è come si vede (legno, ferro, saracinesca, arco,
     pietra) e non cambia niente di come funziona. */
  porta: fabbrica('porta', { id: 'porta', nome: 'la porta', stile: 'legno' }),
  grata: fabbrica('porta', { id: 'grata', nome: 'la grata', stile: 'ferro' }),
  saracinesca: fabbrica('porta', { id: 'saracinesca', nome: 'la saracinesca', stile: 'saracinesca' }),
  botola: fabbrica('porta', { id: 'botola', nome: 'la botola', stile: 'pietra' }),
  /* ── IL TESORO SI APRE, NON SI PRENDE ──
     Ed è **una porta**, per quanto non ci si passi attraverso: le cose
     che si aprono sono una famiglia sola, e questa è la quinta faccia
     della stessa `Porta` — chiave, spallate e `aMano` valgono qui
     esattamente come su un cancello, senza una riga di motore in più.
     Cambia la lezione del primo livello, e in meglio: «prendi il
     tesoro» finiva con un forziere che spariva in tasca, «apri il
     tesoro» finisce con la cassa che si spalanca dove sta.
     `cose.tesoro()` resta, ed è ancora un oggetto da raccogliere: lo
     usano le campagne più avanti, e il giorno che passeranno anche
     loro a questa quella riga si toglie. */
  forziere: fabbrica('porta', { id: 'tesoro', nome: 'il tesoro', stile: 'forziere' }),

  /* le cose da raccogliere. Sono tutte oggetti, ma ognuna sa già come
     si disegna e come si chiama: è quello che toglie di mezzo la
     tabella dei ripieghi («se non lo conosco disegno una chiave»). */
  oggetto: fabbrica('oggetto'),
  tesoro: fabbrica('oggetto', { id: 'tesoro', nome: 'il tesoro', pittore: 'forziere', em: '💰' }),
  /* `tasca: true`: una chiave non occupa una mano. Senza, ogni livello
     con due porte diventa un balletto di «posa la chiave» */
  chiave: fabbrica('oggetto', { id: 'chiave', nome: 'la chiave', pittore: 'chiave',
                                em: '🔑', tasca: true }),
  /* `specie: 'lanterna'` non è per il lettore della mappa (quello
     guarda `genere`, ed è sempre 'oggetto': si prende, si posa): è per
     `allestimento.js`, che sa costruire la classe giusta — una
     `Lanterna` (`motore/generale/elementi/lanterna.js`) invece di un
     `Oggetto` — solo per chi porta questo bollino. `raggio` (in
     celle) è facoltativo: senza, la lanterna illumina come una vista
     normale. */
  lanterna: fabbrica('oggetto', { id: 'lanterna', nome: 'la lanterna', pittore: 'lanterna', em: '🏮',
                                   specie: 'lanterna' }),
  osso: fabbrica('oggetto', { id: 'osso', nome: "l'osso", pittore: 'ossa', em: '🦴' }),
  /* ── LE COSE CHE SI IMPUGNANO ──
     Un oggetto con `arma: { danno: n }` non sta solo nello zaino: chi
     lo raccoglie **colpisce con quello** (`Oggetto.passaA`), e da quel
     momento glielo si vede in mano (`grafica/corpo.js`). È quello che
     permette di raccontare un personaggio disarmato — che si dichiara
     con `arma: { danno: 0 }` nella sua scheda — e di farlo tornare
     pericoloso raccogliendo la sua roba, invece di dirlo e basta. */
  pugnale: fabbrica('oggetto', { id: 'pugnale', nome: 'il pugnale', pittore: 'pugnale',
                                 em: '🗡️', arma: { nome: 'il pugnale', danno: 2 } }),
  spada: fabbrica('oggetto', { id: 'spada', nome: 'la spada', pittore: 'spada',
                               em: '⚔️', arma: { nome: 'la spada', danno: 3 } }),
  pane: fabbrica('oggetto', { id: 'pane', nome: 'il pane', pittore: 'pane', em: '🍞' }),
  corda: fabbrica('oggetto', { id: 'corda', nome: 'la corda', pittore: 'corda', em: '🪢' }),

  /* ── UN POSTO PREPARATO, E PER ORA VUOTO ──
     La mappa segna con `o1`…`o4` i quattro angoli da cui l'orco può
     arrivare, e ogni scena ne riempie uno: gli altri restano prato.
     Si dichiara come tutto il resto — non è «un token che nessuno
     spiega», è **un posto che aspetta qualcuno**, e la differenza si
     vede quando sbagli a scrivere un token: quello resta un errore. */
  segnaposto: fabbrica('segnaposto', { id: 'segnaposto', nome: 'un posto libero' }),

  /* ── QUELLO CHE NON STA SULLA MAPPA ──
     Un segnale non ha una posizione: non si disegna, si dice. Sta
     quindi nella lista `segnali` del livello e non nella legenda — ed
     è il livello a dargli nome, faccia e colore, invece di pescarli da
     una tabella globale che non sapeva niente di questa storia. */
  segnale: fabbrica('segnale', { em: '📣', col: '#8b97b4' }),

  /* i congegni: si premono, e quello che succede lo dice `collegata` */
  leva: fabbrica('leva', { id: 'leva', nome: 'la leva' }),
  /* conta le pressioni, e quando arriva a `tacche` manda il comando */
  totem: fabbrica('totem', { id: 'totem', nome: 'il totem', tacche: 3 }),
}

/* ═══════════ suoli — di che è fatto il pavimento ═══════════
   ── LA MAPPA DICE ANCHE DOV'È IL LASTRICATO ──
   Un livello dichiarava un `ambiente` e quello valeva ovunque: una
   mappa era un posto solo, o tutto cortile o tutto cripta. Ma «porto
   la roba fuori dal castello» è una storia con due posti, e disegnarla
   su un pavimento unico la appiattisce.
   Adesso un token della mappa può dire **di che è fatto il pavimento
   lì**, e si dichiara dove si dichiara tutto il resto — nella legenda,
   accanto a chi ci cammina:

       scena: campo([
         '##|##|##|##|##',
         '##|==|..|,,|##',
         '##|==|@@|,,|##',
       ], { '@@': eroe, '==': suoli.lastre, ',,': suoli.erba }),

   Il token resta pavimento a tutti gli effetti — ci si cammina, il
   motore non sa nemmeno che sia diverso: cambia solo chi lo dipinge
   (`grafica/materiali/suoli.js`). L'ambiente resta ed è quello che
   deve essere: l'aria della stanza, non il suo pavimento. */
export const suoli = Object.fromEntries(NOMI_SUOLI.map(
  nome => [nome, () => ({ genere: 'suolo', id: nome })]))

/* ── E LO STESSO PER LA MURATURA ──
   `muri.legno` al posto di `##` dice «questo muro è di assi»: resta un
   muro a tutti gli effetti — non ci si passa, la vista si ferma — e
   cambia solo di che è fatto. Serve alla stessa storia del pavimento:
   il castello di pietra e il fienile di legno nella stessa mappa. */
export const muri = Object.fromEntries(NOMI_MURI.map(
  nome => [nome, () => ({ genere: 'muro', id: nome })]))

/* ── E L'ARREDO, CHE OCCUPA LA CELLA ──
   Un mobile non è scenografia dipinta: **è un ostacolo**. Si scrive
   qui, come una porta o un'unità, e la cella diventa piena — ci si
   sbatte contro, la vista si ferma, e il disegno dice la verità.
   Prima l'unico modo era metterlo in `scenografia`, che non passa dal
   motore: o lo si disegnava su una casella calpestabile (una bugia) o
   lo si disegnava sopra un muro (un'assurdità). */
export const arredo = Object.fromEntries(NOMI_ARREDO.map(
  nome => [nome, () => ({ genere: 'arredo', id: nome })]))

/* ── E LA CELLA CHE DEVE RESTARE VUOTA ──
   `arredo.niente()` non mette niente: dice che lì **non ci va niente**,
   nemmeno all'arredatore automatico. Serve quando lo spazio libero è
   parte del livello — la piazzola davanti alla porta, il punto dove
   qualcuno si ferma ad aspettare — e le regole strutturali non possono
   saperlo, perché è una cosa che sa solo chi ha scritto la storia.
   È l'ultima parola del livello sull'arredamento, e il motivo per cui
   l'arredamento automatico si può lasciare acceso. */
arredo.niente = () => ({ genere: 'libero', id: 'niente' })

/* ═══════════ chi — le unità ═══════════

   ── l'emoji viene dal corpo ──
   `corpo` dice come si disegna (`grafica/personaggi/`), e da lì esce
   anche la faccina con cui la si nomina negli ordini e nelle frecce di
   chi è fuori campo. Erano due dati da tenere allineati a mano, e la
   seconda volta che si sbagliava nessuno se ne accorgeva. Si scrive
   `emoji` solo quando quel personaggio ha una faccia sua — nelle
   storie ce l'hanno quasi tutti, ed è giusto così: sono qualcuno.

   ── e la vista ──
   È **quante celle vede camminando**: un muro in mezzo toglie la vista
   senza bisogno di tracciare raggi, perché la distanza è quella del
   cammino. Serve per `vai [qualcuno]` (ci vai solo se l'hai visto),
   per `vedi` nelle domande, e per il grido di chi ti scopre. Quattro è
   la misura normale — mezza stanza — e si scrive solo quando è
   particolare: l'orco con `vista: 2` guarda la sua porta e un metro
   più in là no, ed è quello che rende onesto un bivio. */
const CORPI = {
  cavaliere: '🦸', capitano: '🎖️', guardia: '🗡️', ladra: '🥷', mago: '🧙',
  elfo: '🧝', orco: '👹', goblin: '👺', scheletro: '💀',
  gatto: '🐈', lupo: '🐺', orso: '🐻', papera: '🦆',
}

/* ── LA SCHIERA HA UN ID E UN NOME ──
   L'id è la chiave con cui la si nomina in un ordine («attacca gli
   orchi» si scrive `attacca('orchi')`), il nome è come si legge in una
   frase. Erano la stessa stringa, e siccome il nome ha gli spazi la
   chiave diventava `gli-orchi`: nessun ordine la trovava più. */
const persona = (parte, [schiera, comeSiChiama], fissi = {}) => (...arg) => {
  const v = fabbrica('unita', fissi)(...arg)
  return { ...v, parte,
           schiera: v.schiera || schiera,
           schieraNome: v.schieraNome || (v.schiera ? v.schiera : comeSiChiama),
           corpo: v.corpo || 'cavaliere',
           emoji: v.emoji || CORPI[v.corpo || fissi.corpo] || '🙂',
           vista: v.vista ?? 4 }
}

export const chi = {
  nostro: persona('giocatore', ['nostri', 'i nostri']),
  nemico: persona('livello', ['nemici', 'i nemici']),
  /* chi non è né dei tuoi né contro: la principessa da difendere, il
     cane che passa. Lo comanda il livello, ma non è un avversario. */
  terzo: persona('livello', ['altri', 'gli altri']),

  /* i tre che tornano in mezzo tutorial, già vestiti */
  eroe: persona('giocatore', ['nostri', 'i nostri'], { id: 'eroe', nome: "l'eroe", corpo: 'cavaliere' }),
  orco: persona('livello', ['orchi', 'gli orchi'], { id: 'orco', nome: "l'orco", corpo: 'orco' }),
  guardia: persona('livello', ['guardie', 'le guardie'], { id: 'guardia', nome: 'la guardia', corpo: 'guardia' }),
}

/* ═══════════ fai — ordini e domande ═══════════
   Un ordine è verbo + complemento. Prima si scriveva `o('vai', 'x')`,
   e un refuso nel verbo si scopriva giocando: `o('vaii', 'x')` è una
   stringa come un'altra. Qui il verbo è il nome della funzione, quindi
   sbagliarlo è un errore subito. */
const ordine = verbo => cosa => ({ verbo, complemento: idDi(cosa) })
const domanda = (cond, extra = {}) => (cosa, piu = {}) =>
  ({ cond, complemento: idDi(cosa), ...extra, ...piu })

export const fai = {
  vai: ordine('vai'),
  prendi: ordine('prendi'),
  posa: ordine('posa'),
  apri: ordine('apri'),
  chiudi: ordine('chiudi'),
  premi: ordine('premi'),
  attacca: ordine('attacca'),
  suona: ordine('suona'),
  /* ── LE SCORCIATOIE DI SCRITTURA ──
     Nel gioco c'è UN modo di aspettare — `aspetta che [domanda]` — e
     una voce sola in cassetta. Qui restano i nomi comodi per chi
     scrive un livello in JavaScript, e sono zucchero: producono
     esattamente quell'ordine, con la domanda giusta dentro. Chi scrive
     `aspettaDiVedere(orco)` sta scrivendo `aspetta che [vedi l'orco]`. */
  aspetta: cosa => ({ verbo: 'aspetta', cond: { cond: 'aperta', complemento: idDi(cosa) } }),
  aspettaDiVedere: cosa => ({ verbo: 'aspetta', cond: { cond: 'vedi', complemento: idDi(cosa) } }),
  aspettaUnPo: (quanti = 1) => ({ verbo: 'aspetta', cond: { cond: 'passati', n: quanti } }),
  esegui: nome => ({ verbo: 'esegui', complemento: nome }),
  /* parlare a qualcuno in particolare, invece di gridare a chiunque:
     funziona **solo con chi si vede**, se no cadrebbe il principio per
     cui quello che non vedi te lo deve dire qualcuno */
  parla: (a, segnale) => ({ verbo: 'parla', complemento: idDi(segnale), a: idDi(a) }),
  /* arma un ascolto e passa oltre: quando quel segnale arriva parte
     una fila nuova, ed è così che un piano ha due punti d'ingresso */
  quando: (segnale, ...allora) => ({ verbo: 'quando', complemento: idDi(segnale), allora }),
  /* fermarsi finché una cosa che si VEDE non cambia */
  aspettaChe: cond => ({ verbo: 'aspetta', cond }),

  /* ── i blocchi ── */
  bivio: (cond, vero, falso) =>
    ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] }),
  ripeti: (corpo, finche) => ({ blocco: 'ripeti', corpo, finche }),
  giro: (punti, finche) =>
    ({ blocco: 'ripeti', corpo: punti.map(p => ({ verbo: 'vai', complemento: idDi(p) })), finche }),
  azione: (nome, corpo) => ({ blocco: 'routine', nome, corpo }),

}


/* ═══════════ se — le domande ═══════════
   Stanno in un nome loro perché **non sono ordini**: un ordine si fa,
   una domanda si guarda. `se.ha(eroe, tesoro)` si legge come si legge,
   e `vince: [se.ha(eroe, tesoro)]` dice esattamente quello che è. */
export const se = {
  vedi: domanda('vedi'),
  nonVedi: domanda('vedi', { non: true }),
  ha: (chi, cosa) => ({ cond: 'hai', chi: idDi(chi), complemento: idDi(cosa) }),
  nonHa: (chi, cosa) => ({ cond: 'hai', chi: idDi(chi), complemento: idDi(cosa), non: true }),
  qui: (chi, dove) => ({ cond: 'qui', chi: idDi(chi), complemento: idDi(dove) }),
  aperto: domanda('aperta'),
  chiuso: domanda('aperta', { non: true }),
  sentito: domanda('segnale'),
  premuto: domanda('premuto'),
  almeno: (cosa, n) => ({ cond: 'almeno', complemento: idDi(cosa), n }),
  vivo: domanda('vivo'),
  caduto: domanda('vivo', { non: true }),
}

/* ═══════════ quando — le reazioni ═══════════
   ── QUELLO CHE UN PERSONAGGIO FA SENZA CHE NESSUNO GLIELO DICA ──
   Un ordine sta nel piano e lo scrive chi gioca. Una reazione sta nella
   SCHEDA e dice com'è fatto quel personaggio: il carceriere corre al
   rumore perché è un carceriere, non perché qualcuno gliel'ha ordinato.
   La differenza che si vede giocando è una sola: un «quando senti»
   aspetta educatamente che tu sia libero, una reazione **ti interrompe**
   e poi ti restituisce dov'eri.

   Dentro `fai:` ci sono ORDINI NORMALI, gli stessi che scrive il
   bambino. Il motore non sa cosa facciano — sa solo quando farli
   partire. È per questo che la scheda che si apre col dito può mostrare
   la reazione come una fila di ordini invece che come una frase scritta
   a mano da qualche parte: «una scheda si legge come un piano». */
export const quando = {
  senti: (segnale, ...fai) => ({ quando: 'senti', segnale: idDi(segnale), fai: fai.flat() }),
  vedi: (chi, ...fai) => ({ quando: 'vedi', chi: idDi(chi), fai: fai.flat() }),
  colpito: (...fai) => ({ quando: 'colpito', fai: fai.flat() }),
}

/* i due bersagli che un livello non può scrivere prima, perché li
   decide l'evento: dove è partito il rumore, e dove stavi tu quando ti
   ha colto. Diventano celle vere nell'istante in cui la reazione parte,
   quindi nel registro si leggono come qualunque altro `vai`. */
export const dove = {
  hoSentito: 'dove-ho-sentito',
  ero: 'dov-ero',
}

/* ── I PRESET, che NON sono comandi ──
   Sono modi di scrivere in fretta una reazione che torna spesso. Quello
   che producono è **dato**, identico a quello che scriveresti a mano: si
   possono leggere, copiare e cambiare. La differenza con un
   comportamento cablato nel motore è tutta qui — una guardia che corre
   e NON torna si scrive nel livello, non modificando il motore. */
export const reagisce = {
  /* corre dov'è il rumore, si guarda intorno, e torna al suo posto.
     Quel viaggio è la finestra in cui il passaggio resta scoperto: è il
     livello del richiamo, ed è tutto qui dentro. */
  alRumore: (segnale, { sosta = 3, torna = true } = {}) => quando.senti(segnale, [
    fai.vai(dove.hoSentito),
    ...(sosta > 0 ? [fai.aspettaUnPo(sosta)] : []),
    ...(torna ? [fai.vai(dove.ero)] : []),
  ]),
  /* chiama i suoi quando le prende */
  chiedeAiuto: segnale => quando.colpito([fai.suona(segnale)]),
  /* si butta su chi vede: è quello che un nemico fa di suo, e senza
     scriverlo ci si passa davanti senza che succeda niente */
  assale: (chi = 'nostri') => quando.vedi(chi, [fai.attacca(chi)]),
}

export { livello } from './livello.js'
