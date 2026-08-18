/* ═══════════════════════════════════════════════════════════════════
   IL LIVELLO DELLA FATTORIA — QUELLO CHE SI APRE SPENDENDO

   ── IL PROBLEMA CHE RISOLVE ───────────────────────────────────────
   Il baule vendeva duecento cose dal primo minuto, in undici linguette.
   Per un bambino che apre la fattoria la prima volta non è ricchezza:
   è **una lista da cui non si sa cosa scegliere**, dove il campo che
   fa partire tutta la catena sta in mezzo a novanta cespugli. E la
   catena — campo, mulino, recinto — non si legge da nessuna parte:
   c'è, ma bisogna indovinarla.

   ── L'ESPERIENZA SONO LE MONETE SPESE QUI ─────────────────────────
   Non i raccolti, non i minuti, non le partite: **le monete spese in
   fattoria**. È la misura giusta per tre motivi.

     · È già la cosa che il gioco vuole. La fattoria è il money pit —
       si guadagna negli altri giochi e si brucia qui — quindi il
       livello premia esattamente il gesto che tiene in piedi tutto.
     · Non si può fare in fretta. Le monete arrivano solo dagli
       esercizi, quindi il livello è **tempo di studio**, riletto: al
       livello 10 ci si arriva con 🪙3000 spesi, cioè otto ore
       (`CALIBRAZIONE.md`).
     · Non si perde e non si punisce. Spendere è sempre un passo
       avanti, anche quando si compra un cespuglio storto: niente di
       quello che si fa qui può far scendere il livello.

   ── SI SBLOCCA, NON SI NASCONDE ───────────────────────────────────
   Quello che non è ancora arrivato **non sta nel baule**, e il posto
   dove si vede è **la pagina dei livelli**: lì c'è cosa hai adesso e
   soprattutto cosa arriva al prossimo. La differenza conta — una voce
   spenta dentro il negozio è un tasto rotto, la stessa voce dentro una
   pagina che dice «al livello 4» è una cosa da desiderare.

   ── DOVE STANNO I NUMERI ──────────────────────────────────────────
   Qui stanno **solo le soglie**. Cosa arriva a ogni livello lo dicono
   le cose stesse (`liv` sulla voce di catalogo, sulla coltura,
   sull'animale, e sulla linguetta del baule): un elenco scritto due
   volte è un elenco che si scosta, e l'anteprima direbbe cose false.
   `roba(liv)` le raccoglie girando le tabelle vere.
   ═══════════════════════════════════════════════════════════════════ */
import { CATEGORIE, CATALOGO } from './catalogo.js'
import { COLTURE } from './coltivazioni.js'
import { ANIMALI } from './animali.js'

/* ── LE SOGLIE ────────────────────────────────────────────────────
   Quanto bisogna aver **speso in tutto** per arrivare a un livello.
   Una formula e non una tabella, così i livelli non finiscono mai: chi
   ha giocato per mesi deve avere ancora un gradino davanti, se no la
   ragione di spendere sparisce proprio a chi ne ha spese di più.

   ── IL PRIMO LIVELLO DURA QUANTO SERVE A IMPARARE ─────────────────
   Il passo minimo (`SOGLIA_B`) è **più alto di tutta l'attrezzatura di
   partenza**, e non è un caso: campo e silo insieme costano 🪙142, e con
   un passo piccolo bastavano loro a far scattare tre livelli di fila —
   si comprava il silo e si sbloccava mezzo baule senza aver ancora
   raccolto niente. Adesso per il livello 2 servono 🪙210: l'attrezzatura,
   un secondo campo e qualche giro di semina e raccolto. Cioè **il
   tempo di capire come gira**, che è la cosa che il primo livello deve
   comprare.

   In tempo di esercizi (🪙6 al minuto, `CALIBRAZIONE.md`): il livello 2
   sono 35 minuti, il 10 sei ore, il 30 quaranta, l'ultimo del catalogo
   centoventisette — spalmate su mesi, che è la scala giusta per un
   posto che si guarda cinque minuti al giorno.

   *Ribalta due volte la scelta di prima.* Erano dieci livelli con le
   soglie scritte a mano, e ogni livello apriva **una linguetta intera**
   del baule: al primo minuto c'erano trentanove piante fra melo,
   topiaria e due tipi di siepe, e dopo tre acquisti si era già al terzo
   livello senza aver fatto niente. Adesso i livelli sono tanti e
   ognuno dà poco. */
export const SOGLIA_A = 8, SOGLIA_B = 200

export const sogliaDi = livello =>
  Math.round((SOGLIA_A * (Math.max(1, livello | 0) - 1) ** 2 +
              SOGLIA_B * (Math.max(1, livello | 0) - 1)) / 10) * 10

export function livelloPer(speso = 0) {
  const s = Math.max(0, speso || 0)
  /* l'inversa della soglia: si risolve invece di scorrere una tabella,
     perché la tabella non c'è */
  const x = (-SOGLIA_B + Math.sqrt(SOGLIA_B ** 2 + 4 * SOGLIA_A * s)) / (2 * SOGLIA_A)
  let liv = 1 + Math.floor(x + 1e-9)
  /* l'arrotondamento a dieci può spostare il confine di qualche moneta:
     si aggiusta guardando la soglia vera */
  while (sogliaDi(liv + 1) <= s) liv++
  while (liv > 1 && sogliaDi(liv) > s) liv--
  return liv
}

/* ── COSA ARRIVA, E QUANDO ────────────────────────────────────────
   **Due o tre decorazioni per livello, mai di più.** Il catalogo ne ha
   quasi duecento, ed è la ricchezza che rende lungo il gioco: date a
   secchiate diventano una lista da cui non si sa cosa scegliere, date a
   gocce sono la ragione per cui si torna. Ordinate per prezzo, quindi
   il vaso da quattro monete arriva subito e la casa sull'albero dopo
   mesi — e le linguette del baule si aprono da sole via via che arriva
   la loro prima voce.

   Quello che **lavora** non segue questa fila: campo e silo del
   raccolto stanno al livello 1 (senza, la catena non comincia), e
   mulino, silo della stalla e i cinque recinti dichiarano il loro `liv`
   nel catalogo, perché lì il momento in cui arrivano è una decisione di
   gioco e non un conto sui prezzi. Stessa cosa per le colture e per le
   bestie. */
export const DECORI_PER_LIVELLO = 3
/* Il livello 1 è **solo la fattoria**: un campo, il silo, due semi.
   Niente da abbellire finché non c'è niente da guardare. */
export const PRIMO_DECORO = 2

const DOVE = Object.fromEntries(
  CATEGORIE.flatMap(c => c.voci.map(v => [v.id, c.chiave])))
export const categoriaDi = id => DOVE[id] || null

const PER_CHIAVE = Object.fromEntries(CATEGORIE.map(c => [c.chiave, c]))
export const zonaDi = id => (PER_CHIAVE[categoriaDi(id)] || {}).zona || 'bello'

/* La fila delle decorazioni: dalla più economica alla più cara. L'id
   spareggia, se no due voci allo stesso prezzo cambierebbero posto fra
   una build e l'altra — e una cosa comprata ieri sparirebbe. */
const FILA = CATALOGO
  .filter(v => !v.liv && zonaDi(v.id) === 'bello')
  .slice()
  .sort((a, b) => a.prezzo - b.prezzo || (a.id < b.id ? -1 : 1))
  .map(v => v.id)

const POSTO = Object.fromEntries(FILA.map((id, i) => [id, i]))

export function livelloDellaVoce(v) {
  if (!v) return 1
  if (v.liv) return Math.max(1, v.liv)
  if (zonaDi(v.id) === 'lavoro') return 1
  const i = POSTO[v.id]
  return i === undefined ? 1 : PRIMO_DECORO + Math.floor(i / DECORI_PER_LIVELLO)
}

/* A che livello si vede comparire una linguetta: quando arriva la sua
   prima voce. Si ricava, non si dichiara — una linguetta che compare
   vuota è uno scaffale con dentro niente. */
export const livelloDellaScheda = c =>
  Math.min(...c.voci.map(livelloDellaVoce))

/* Fin dove arriva la roba dichiarata. Oltre si continua a salire — la
   formula non finisce — ma non c'è più niente di nuovo da aprire, e la
   pagina lo dice invece di promettere. */
export const ULTIMO = Math.max(
  ...CATALOGO.map(livelloDellaVoce),
  ...COLTURE.map(c => c.liv || 1),
  ...Object.values(ANIMALI).map(a => a.liv || 1))

/* ── I NOMI ───────────────────────────────────────────────────────
   Sessanta nomi scritti a mano sarebbero sessanta occasioni di scrivere
   una parola vuota. Quelli che contano si dichiarano — sono i livelli
   in cui arriva qualcosa che cambia il gioco — e tutti gli altri
   prendono **il nome della cosa più bella che portano**, che è vera per
   definizione e non va tenuta allineata a niente. */
export const NOMI = {
  1: 'Il primo campo',
  2: 'Il primo amico',
  3: 'Il mulino',
  4: 'Il silo della stalla',
  5: 'I conigli',
  8: 'Le galline',
  10: 'Il pastone',
  12: 'Le pecore',
  18: 'Le mucche',
  26: 'I maiali',
}

export function nomeDi(livello) {
  const l = Math.max(1, livello | 0)
  if (NOMI[l]) return NOMI[l]
  const r = roba(l)
  if (r.animali.length) return r.animali[0].nome
  if (r.colture.length) return r.colture[0].nome
  /* la più cara: è quella che si guarda per prima aprendo lo scaffale */
  const cara = r.cose.slice().sort((a, b) => b.prezzo - a.prezzo)[0]
  return cara ? cara.nome : `Livello ${l}`
}

/* A che punto si è verso il prossimo, per la barra: quanto manca in
   monete e quanto è fatto in centesimi. */
export function avanzamento(speso = 0) {
  const liv = livelloPer(speso)
  const da = sogliaDi(liv), a = sogliaDi(liv + 1)
  return {
    livello: liv, nome: nomeDi(liv), speso: Math.max(0, speso || 0),
    da, a, manca: Math.max(0, a - (speso || 0)),
    quanto: a > da ? Math.min(1, Math.max(0, ((speso || 0) - da) / (a - da))) : 1,
  }
}

/* Cosa arriva **esattamente** a questo livello: è quello che la pagina
   mostra come anteprima del prossimo, e non è scritto da nessuna parte
   se non nelle tabelle vere. */
export function roba(livello) {
  const l = Math.max(1, livello | 0)
  return {
    /* Una linguetta che si apre per la prima volta è una notizia («si
       apre uno scaffale nuovo»), e le sue voci di quel livello si
       elencano lo stesso: adesso sono due o tre, non novanta. */
    schede: CATEGORIE.filter(c => livelloDellaScheda(c) === l),
    cose: CATALOGO.filter(v => livelloDellaVoce(v) === l),
    colture: COLTURE.filter(c => (c.liv || 1) === l),
    animali: Object.entries(ANIMALI).filter(([, a]) => (a.liv || 1) === l)
      .map(([chi, a]) => ({ chi, ...a })),
  }
}

export const vuoto = r => !r.schede.length && !r.cose.length &&
  !r.colture.length && !r.animali.length

export function guastiDeiLivelli() {
  const g = []
  for (let l = 2; l <= ULTIMO + 2; l++)
    if (!(sogliaDi(l) > sogliaDi(l - 1))) g.push(`la soglia del livello ${l} non sale`)
  for (const l of Object.keys(NOMI))
    if (!(l >= 1 && l <= ULTIMO)) g.push(`c'è un nome per il livello ${l}, che non esiste`)
  /* Il livello si ricava dalla spesa risolvendo la formula: se
     l'inversa e la diretta si scostano, uno spende e non sale — o sale
     senza spendere, che è peggio. */
  for (let l = 1; l <= ULTIMO + 2; l++) {
    if (livelloPer(sogliaDi(l)) !== l) g.push(`chi ha speso la soglia del ${l} non è al ${l}`)
    if (l > 1 && livelloPer(sogliaDi(l) - 1) !== l - 1)
      g.push(`una moneta prima della soglia del ${l} si è già al ${l}`)
  }
  /* Un livello che non porta niente è un livello che a schermo si
     presenta come «hai fatto qualcosa, ecco: niente». */
  for (let l = 1; l <= ULTIMO; l++)
    if (vuoto(roba(l))) g.push(`al livello ${l} non arriva niente`)
  /* E tutto quello che esiste deve arrivare **entro** l'ultimo: una
     voce dichiarata al livello 30 non la vedrebbe nessuno. */
  for (const v of CATALOGO)
    if (livelloDellaVoce(v) > ULTIMO) g.push(`${v.id}: arriva al livello ${livelloDellaVoce(v)}, che non esiste`)
  /* **Due o tre per livello, mai di più**: è la regola che rende lungo
     il gioco, e si rompe da sola il giorno che una linguetta nuova
     dichiara un `liv` a mano per venti voci insieme. */
  for (let l = PRIMO_DECORO; l <= ULTIMO; l++) {
    const quante = roba(l).cose.filter(v => zonaDi(v.id) === 'bello').length
    if (quante > DECORI_PER_LIVELLO)
      g.push(`al livello ${l} arrivano ${quante} decorazioni: sono troppe`)
  }
  /* Ogni linguetta deve aprirsi prima o poi, e con qualcosa dentro. */
  for (const c of CATEGORIE)
    if (!(livelloDellaScheda(c) <= ULTIMO))
      g.push(`la linguetta «${c.chiave}» non si apre mai`)
  for (const c of COLTURE)
    if ((c.liv || 1) > ULTIMO) g.push(`la coltura ${c.id} arriva a un livello che non esiste`)
  /* Al primo livello ci dev'essere di che cominciare la catena: un
     campo, un posto dove metterci il raccolto, e qualcosa da seminare. */
  const primo = CATALOGO.filter(v => livelloDellaVoce(v) === 1)
  if (!primo.some(v => v.campo)) g.push('al livello 1 non c\'è nessun campo: la catena non comincia')
  if (!primo.some(v => v.silo === 'terra')) g.push('al livello 1 non c\'è il silo del raccolto')
  if (!COLTURE.some(c => (c.liv || 1) === 1)) g.push('al livello 1 non c\'è niente da seminare')
  return g
}
