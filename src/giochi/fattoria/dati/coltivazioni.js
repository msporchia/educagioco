/* ═══════════════════════════════════════════════════════════════════
   QUELLO CHE SI COLTIVA, E COSA CI SI FA

   Dato puro: nessuna funzione che gioca, nessun `import` di motore o di
   Vue. Le regole stanno in `motore/fattoria.js`, il disegno in `scena/`.

   ── IL FRENO È IL TEMPO, NON IL PREZZO ────────────────────────────
   La fattoria è **l'unico money pit**: le monete si guadagnano facendo
   esercizi negli altri giochi e qui si bruciano. Una catena di
   produzione è la cosa che più rischia di ribaltarlo, quindi due regole
   che non si toccano.

   La prima: **niente si vende**. Grano, mais, mangime sono valuta
   interna e non tornano monete, mai. Il verso è sempre monete → cose. È
   lo stesso motivo per cui sgomberare il bosco costa e non rende
   (`motore/fattoria.js`): una seconda fonte di monete che non passa da
   nessun esercizio farebbe smettere di fare esercizi.

   La seconda: **coltivare costa meno che comprare, ma costa tempo
   vero**. Il mangime prodotto viene sui 3 contro i 5 del cibo comprato,
   e il pastone sui 7 contro 14 — cioè si risparmia circa la metà, non
   l'80%. Il resto del freno lo mette l'orologio: quindici minuti veri
   per un giro di grano, e la capacità installata (quanti campi hai) è
   il tetto di quanto puoi produrre in una sera. Chi vuole dar da
   mangiare *adesso* compra, come ha sempre fatto. Chi ha aspettato
   risparmia. Ed è per questo che il money pit regge: l'attrezzatura —
   il campo, il mulino, i silos — si paga **prima**, in monete grosse, e
   si ripaga in decine di raccolti.

   ── NIENTE MARCISCE. MAI. ─────────────────────────────────────────
   Un campo maturo resta maturo per sempre: se il gioco sta chiuso una
   settimana, al ritorno il grano è lì. È la stessa decisione del fondo
   0,15 di `bisogni.js` — la bestia ha fame ma non muore — applicata al
   raccolto, e per lo stesso motivo: questo posto è il premio per gli
   esercizi fatti altrove, non un altro compito. Un campo che si perde
   se non apri l'app trasforma il premio in un dovere, e il dovere si
   smette. Tutto è **in pausa**, niente è in scadenza.

   Da qui viene anche la regola sulle monete: raccogliere costa, ma chi
   è a zero monete **non perde il raccolto** — il campo resta pronto e
   aspetta il primo esercizio fatto. Vedi `raccogli()` nel motore.

   ── GLI STADI SONO NOMI DI TESSERE ────────────────────────────────
   Ogni coltura dichiara come si vede mano a mano che cresce: una
   tessera per stadio. Erano **ripieghi** — un germoglio generico, un
   mucchio di fieno — in attesa del foglio dei campi a stadi; il foglio
   è arrivato (`sorgenti/gfx/campi.png`) ed è cambiata questa tabella e
   nient'altro, come c'era scritto. La scena disegna il nome che le
   arriva e non sa cosa sia il grano.

   Sette stati per una coltura sono tanti **apposta** — il tempo di
   crescita è vero, e in dieci minuti deve succedere qualcosa a ogni
   occhiata, se no il campo sembra fermo e non ci si torna più. Il primo
   è già visibile (vedi `CRESCE`): un campo appena seminato deve dire di
   essere stato seminato.

   ── E NON SI RIPETONO PIÙ SU OGNI CELLA ───────────────────────────
   *Ribalta la scelta di prima.* Uno stadio si ripeteva su ogni cella del
   piede finché era una tesserina da 16 px: quattro germogli su un campo
   2×2 erano un campo che cresce, uno solo in mezzo era un ciuffo d'erba.
   Adesso uno stadio **è il campo intero**, aiuola compresa, disegnato
   una volta sola sul piede 2×2 — e le piante alte sbordano in su, che è
   il motivo per cui un campo di mais maturo si vede da lontano.
   ═══════════════════════════════════════════════════════════════════ */

/* L'unico import, e va in una direzione sola: dato che guarda dato.
   Serve al controllo in fondo — uno stadio che l'atlante non ha è un
   campo che cresce senza vedersi crescere, e non lo dice nessuno. */
import { PEZZI } from './atlante.js'

/* Un minuto in millisecondi, scritto una volta: i tempi qui sotto sono
   in minuti veri, che è l'unità in cui si ragiona tarandoli. */
export const MINUTO = 60000

/* ── quello che finisce in granaio ────────────────────────────────
   `nome` ed `emoji` sono per chi guarda; `cibo` (facoltativo) dice che
   quella roba, oltre a stare in granaio, si può mettere nella ciotola —
   il legame vero sta in `bisogni.js`, che la pesca da qui.

   `silo` dice **in quale dei due** va a finire, e non è un dettaglio:
   sono due magazzini separati, con due tetti separati, e uno pieno non
   ferma l'altro. Quello che viene dalla terra (compreso ciò che il
   mulino ne ricava) sta nel silo del raccolto; quello che danno le
   bestie sta nel silo della stalla. Il perché sta più giù, dove si
   dichiarano i due silos. */
export const PRODOTTI = {
  /* dai campi */
  grano:   { nome: 'Grano',   emoji: '🌾', silo: 'terra' },
  mais:    { nome: 'Mais',    emoji: '🌽', silo: 'terra' },
  carote:  { nome: 'Carote',  emoji: '🥕', silo: 'terra' },
  zucche:  { nome: 'Zucche',  emoji: '🎃', silo: 'terra' },
  fieno:   { nome: 'Fieno',   emoji: '🌿', silo: 'terra' },
  /* dal mulino */
  mangime: { nome: 'Mangime', emoji: '🥣', silo: 'terra' },
  pastone: { nome: 'Pastone', emoji: '🍲', silo: 'terra' },
  /* dai recinti */
  uova:    { nome: 'Uova',    emoji: '🥚', silo: 'stalla' },
  latte:   { nome: 'Latte',   emoji: '🥛', silo: 'stalla' },
  tartufi: { nome: 'Tartufi', emoji: '🍄', silo: 'stalla' },
  lana:    { nome: 'Lana',    emoji: '🧶', silo: 'stalla' },
}

/* I sette stati di una coltura, scritti una volta: sono i sette
   riquadri del foglio, in fila. Si scrive qui e non riga per riga perché
   il foglio è fatto così per tutte e cinque, e ricopiare sette nomi
   cinque volte è il modo di sbagliarne uno e accorgersene fra un mese.

   **Il primo stato non è più `null`.** Lo era — «appena seminato non si
   vede niente, la terra mossa è già il disegno del campo» — ed era il
   difetto che si vedeva a occhio: per il primo settimo della crescita un
   campo seminato era *identico* a un campo vuoto, quindi non si capiva
   se seminare avesse funzionato. Adesso il primo riquadro sono **i semi
   per terra**, e compaiono nell'istante in cui si semina.

   Quello che resta a raccontare il campo vuoto è il pezzo del catalogo
   (`campo_vuoto`): terra nuda, non lavorata, presa da un'altra riga del
   foglio apposta. Da lì a un'aiuola col bordo e i semi la differenza si
   vede da lontano — è il campo che è stato arato. */
const CRESCE = coltura => Array.from({ length: 7 }, (_, i) => `campo_${coltura}${i}`)

/* ── le colture ───────────────────────────────────────────────────
   `semina` e `raccolta` sono monete, `minuti` è tempo vero, `resa` è
   quanti prodotti escono da un campo. Il rapporto fra le tre cose è
   tutta l'economia: vedi `unita/coltivazioni`, che rifiuta una coltura
   che costa più del cibo che sostituisce. */
/* `liv` è il livello della fattoria a cui la coltura si sblocca
   (`dati/livelli.js`), e **ognuna arriva con la bocca che la mangia**:

     grano   1   e al 3 c'è il mulino che ne fa mangime
     carote  5   insieme alla conigliera, che mangia solo quelle
     mais   10   per il pastone, quando il mulino gira da un pezzo
     erba   12   insieme all'ovile: prima il fieno, poi le pecore
     zucche 26   insieme al porcile, l'unico che le vuole

   Il primo campo ha **una scelta sola**, e non è una limitazione: a
   quattro anni cinque bottoni sono un elenco da leggere, uno è una cosa
   da fare. Una coltura che arriva prima di quello che la consuma
   sarebbe roba che riempie il silo senza servire a niente — che è il
   modo di far sembrare rotto un gioco che funziona. */
export const COLTURE = [
  /* L'erba medica è la più veloce e la meno cara, e non è cibo per
     nessuno: serve ai recinti, che è il modo di dire «prima il fieno,
     poi gli animali» senza scriverlo da nessuna parte. */
  {
    id: 'erba', liv: 12, nome: 'Erba medica', emoji: '🌿',
    semina: 1, raccolta: 1, minuti: 8, resa: 4, da: 'fieno',
    stadi: CRESCE('erba'),
  },
  {
    id: 'grano', liv: 1, nome: 'Grano', emoji: '🌾',
    semina: 2, raccolta: 2, minuti: 10, resa: 3, da: 'grano',
    stadi: CRESCE('grano'),
  },
  {
    id: 'carote', liv: 5, nome: 'Carote', emoji: '🥕',
    semina: 3, raccolta: 2, minuti: 12, resa: 3, da: 'carote',
    stadi: CRESCE('carote'),
  },
  {
    id: 'mais', liv: 10, nome: 'Mais', emoji: '🌽',
    semina: 2, raccolta: 2, minuti: 18, resa: 5, da: 'mais',
    stadi: CRESCE('mais'),
  },
  /* La più lenta e la più cara, e l'unica che i maiali cercano: è la
     coltura che si semina quando si ha già tutto il resto. */
  {
    id: 'zucche', liv: 26, nome: 'Zucche', emoji: '🎃',
    semina: 4, raccolta: 3, minuti: 25, resa: 2, da: 'zucche',
    stadi: CRESCE('zucche'),
  },
]

export const PER_COLTURA = Object.fromEntries(COLTURE.map(c => [c.id, c]))

/* ── le ricette: dove la roba diventa un'altra roba ───────────────
   Una ricetta sta in una **macchina** (`dove`, un id di catalogo): senza
   quell'oggetto in mappa non si può fare, ed è lì il money pit vero —
   il mulino costa più di trenta pappe comprate, e si ripaga solo a chi
   coltiva per giorni.

   Costano anche monete (`costo`), poche: il gesto di far partire una
   macchina è un gesto come seminare.

   ── UN RECINTO È UNA MACCHINA ─────────────────────────────────────
   E non un'altra meccanica. Gli si dà quello che è cresciuto nei campi,
   passa del tempo vero, e rende la sua roba: sono esattamente i verbi
   del mulino — `avvia`, aspetta, `ritira` — quindi il motore è quello
   che c'è già e non c'è niente di nuovo da imparare né da parte di chi
   gioca né da parte di chi legge il codice.

   Quello che un recinto ha di suo è che **si vede in che stato è**: il
   foglio degli animali disegna ogni specie sei volte (calmo, ha fame,
   mangia, contento, dorme, pronto) e il catalogo dice quale pezzo va con
   quale stato. Da lontano, senza aprire niente, si legge se c'è da fare
   qualcosa — che è lo stesso mestiere del 💭 sopra un cane affamato.

   La catena, per intero: campo → granaio → recinto → granaio → ciotola.
   Il verso resta uno solo, e non torna mai indietro in monete. */
export const RICETTE = [
  {
    id: 'mangime', nome: 'Mangime', emoji: '🥣', dove: 'mulino',
    prende: { grano: 3 }, costo: 2, minuti: 5, da: 'mangime', resa: 2,
  },
  {
    id: 'pastone', nome: 'Pastone', emoji: '🍲', dove: 'mulino',
    prende: { mais: 4 }, costo: 4, minuti: 8, da: 'pastone', resa: 1,
  },
  {
    id: 'uova', nome: 'Uova', emoji: '🥚', dove: 'pollaio',
    prende: { grano: 3 }, costo: 2, minuti: 12, da: 'uova', resa: 2,
  },
  {
    id: 'latte', nome: 'Latte', emoji: '🥛', dove: 'stalla',
    prende: { fieno: 6 }, costo: 4, minuti: 20, da: 'latte', resa: 2,
  },
  {
    id: 'lana', nome: 'Lana', emoji: '🧶', dove: 'ovile',
    prende: { fieno: 2 }, costo: 2, minuti: 25, da: 'lana', resa: 1,
  },
  /* Due strade per la stessa lana, e non è una svista: la conigliera
     costa un terzo dell'ovile e ci mette meno, ma mangia carote, che
     sono la coltura di mezzo. Chi ha poche monete e tanta pazienza
     arriva alla copertina lo stesso. */
  {
    id: 'lana_angora', nome: 'Lana d\'angora', emoji: '🧶', dove: 'conigliera',
    prende: { carote: 2 }, costo: 1, minuti: 18, da: 'lana', resa: 1,
  },
  {
    id: 'tartufi', nome: 'Tartufi', emoji: '🍄', dove: 'porcile',
    prende: { zucche: 2 }, costo: 3, minuti: 30, da: 'tartufi', resa: 1,
  },
]

export const PER_RICETTA = Object.fromEntries(RICETTE.map(r => [r.id, r]))

export const ricetteDi = dove => RICETTE.filter(r => r.dove === dove)

/* ── i due silos ──────────────────────────────────────────────────
   *Ribalta la scelta di prima.* C'era un granaio solo, con un tetto
   generoso (trenta) **per ogni prodotto** e un silo che ne aggiungeva
   altri trenta a testa: si comprava un secondo silo e non cambiava
   niente che si potesse vedere, perché quel tetto non lo toccava
   nessuno. Un numero grande che non morde non è un limite, è una riga
   di spiegazione in fondo a un foglio.

   Adesso il magazzino è **piccolo, condiviso e si ingrandisce
   pagando**, come in Hay Day, e sono tre decisioni diverse:

     · **piccolo** — quattro posti, e ci si arriva subito. Serve a non
       far diventare questo posto una contabilità: chi gioca deve avere
       poca roba in mano e spenderla, non tenere scorte.
     · **condiviso** — i quattro posti sono di *tutto quello che sta in
       quel silo*, non di ogni prodotto. Era la cosa che non si capiva:
       «di ogni cosa ce ne stanno 90» è una frase che nessuno sa
       trasformare in «adesso quanto ci sta».
     · **si ingrandisce** — il silo è una struttura sola e si potenzia
       (+2 posti a colpo), e il prezzo raddoppia il passo ogni volta:
       20, 30, 50, 90, 170. I primi due sono un pomeriggio, il quinto è
       una decisione.

   E i silos sono **due, diversi, e servono entrambi**: il rosso tiene
   quello che viene dalla terra, il bianco quello che danno le bestie.
   Non è simmetria per bellezza — è quello che rende il pollaio una
   spesa che ne trascina un'altra, e che tiene la catena leggibile: se
   il raccolto è pieno, le uova entrano lo stesso.

   Chi non ha costruito il silo **non ha capienza affatto**: capienza
   zero, non capienza piccola. Un raccolto senza posto dove finire non
   si raccoglie, e il campo resta pronto ad aspettare (`motore/`). */
export const SILI = {
  terra:  { cosa: 'silo',        nome: 'Silo del raccolto', emoji: '🌾' },
  stalla: { cosa: 'silo_bianco', nome: 'Silo della stalla',  emoji: '🥛' },
}

/* Quanti prodotti tiene un silo appena costruito, e quanti se ne
   aggiungono a ogni ingrandimento.

   LA MISURA È IL CAMPO, NON IL PRODOTTO. Prima erano sei, e sei è la
   resa di **due campi di grano**: chi ne aveva tre trovava il silo
   pieno prima di aver finito il giro dei suoi campi, e il primo gesto
   che imparava era che non si può raccogliere. Un magazzino che sta
   dietro a meno di quello che il prato produce non è un freno, è un
   inciampo — e il freno vero di questa fattoria sono le monete su ogni
   gesto e il tempo di crescita, non il posto dove mettere la roba.

   Dodici regge **quattro campi di grano** (resa 3), o due di mais
   (resa 5) col resto per il mangime che il mulino rimanda dentro allo
   stesso silo. E gli ingrandimenti vanno a quattro e non a due: a due,
   pagare 🪙130 — mezz'ora di esercizi — per mezzo campo in più era una
   spesa che non si sentiva. Quattro è un campo intero, che è l'unità
   con cui chi gioca conta davvero. */
export const SILO_BASE = 12
export const SILO_PIU = 4

/* Quanto ci sta, con gli ingrandimenti fatti. `livello` è quante volte
   è stato ingrandito: zero è appena costruito. */
export const capienza = livello => SILO_BASE + SILO_PIU * Math.max(0, livello | 0)

/* Quanto costa il prossimo ingrandimento: 40, 130, 185, 220, 250, 275…
   — che in tempo di gioco (vedi `CALIBRAZIONE.md`: una moneta sono dieci
   secondi di esercizi) vuol dire 7 minuti il primo, poi mezz'ora, poi
   sempre intorno all'ora.

   *Ribalta la scelta di prima*, che raddoppiava il passo (20, 30, 50,
   90, 170, 330…). Sembrava prudente — «semi-esponenziale, non un ×2
   secco» — ed era la stessa cosa: per arrivare a 28 posti chiedeva
   quarantamila monete, cioè **centoundici ore** di esercizi. Il difetto
   di ragionamento è che una curva esponenziale presume che chi paga
   diventi più ricco a ogni passo, e qui non succede: le monete si
   guadagnano sempre allo stesso ritmo, quindi **lo sforzo riparte da
   zero ogni volta**.

   Logaritmica, invece, dice la cosa giusta: il salto vero è il secondo
   (da 7 minuti a mezz'ora), poi ogni ingrandimento costa più o meno la
   stessa fatica — un'ora — e non arriva mai a costare una settimana.
   Arrotondato a cinque perché un prezzo è una cosa che si legge. */
export const costoIngrandimento = livello =>
  Math.round((40 + 130 * Math.log(1 + Math.max(0, livello | 0))) / 5) * 5

/* In quale silo va a finire un prodotto. Sconosciuto vuol dire nessun
   silo: non ci sta da nessuna parte, che è come si comporta un prodotto
   tolto dalla tabella. */
export const siloDelProdotto = prodotto => (PRODOTTI[prodotto] || {}).silo || null

/* ── COME SI FA UNA ROBA ──────────────────────────────────────────
   Il contrario di `serveA()` (in `dati/bisogni.js`): là si chiede a
   cosa serve quello che hai, qui **come si ottiene quello che non
   hai**. Serve alla ciotola: un tasto spento perché il mangime è finito
   deve poter dire «3 🌾 nel mulino», se no chi gioca sa solo che non
   può, e la catena resta una cosa da indovinare.

   Torna righe di dato, non frasi: il nome della macchina lo sa il
   catalogo, che importa da qui. */
export function comeSiFa(prodotto) {
  const modi = []
  for (const c of COLTURE)
    if (c.da === prodotto)
      modi.push({ che: 'coltura', id: c.id, emoji: c.emoji, nome: c.nome,
                  minuti: c.minuti, resa: c.resa })
  for (const r of RICETTE)
    if (r.da === prodotto)
      modi.push({ che: 'ricetta', dove: r.dove, prende: r.prende,
                  minuti: r.minuti, resa: r.resa, emoji: r.emoji, nome: r.nome })
  return modi
}

/* ── leggere l'orologio ───────────────────────────────────────────
   Quanto è cresciuto qualcosa che è cominciato a `da` e vuole `minuti`.
   Si ferma a 1 e non va oltre: **niente marcisce**, quindi oltre il
   maturo non c'è nessun altro stato.

   Il massimo con zero serve a un orologio che va indietro — succede su
   un telefono a cui si cambia la data, e senza il taglio un campo
   seminato risulterebbe seminato *nel futuro* e non maturerebbe più. */
export function quantoCresciuto(da, minuti, ora = Date.now()) {
  if (!da || !(minuti > 0)) return 1
  return Math.max(0, Math.min(1, (ora - da) / (minuti * MINUTO)))
}

/* Quale stadio mostrare, fra quelli dichiarati. L'ultimo è il maturo, e
   ci si arriva solo a crescita finita: se no un campo al 99% sembrerebbe
   pronto e chi lo tocca troverebbe un tasto spento. */
export function stadioDi(coltura, quanto) {
  const st = (coltura && coltura.stadi) || []
  if (!st.length) return null
  if (quanto >= 1) return st[st.length - 1]
  const q = Math.max(0, Math.min(0.999, quanto))
  return st[Math.floor(q * (st.length - 1))]
}

/* Quanto manca, in minuti interi arrotondati per eccesso: «fra 3 minuti»
   è una cosa che si può dire a un bambino, «fra 154 secondi» no. Zero
   vuol dire pronto. */
export function minutiCheMancano(da, minuti, ora = Date.now()) {
  const q = quantoCresciuto(da, minuti, ora)
  if (q >= 1) return 0
  return Math.max(1, Math.ceil((1 - q) * minuti))
}

export function guastiDelleColture() {
  const g = []
  const visti = new Set()
  for (const c of COLTURE) {
    if (visti.has(c.id)) g.push(`coltura doppia: ${c.id}`)
    visti.add(c.id)
    if (!PRODOTTI[c.da]) g.push(`${c.id}: rende «${c.da}», che non è un prodotto`)
    if (!(c.minuti > 0)) g.push(`${c.id}: tempo impossibile`)
    if (!(c.resa >= 1)) g.push(`${c.id}: non rende niente`)
    if (!(c.semina >= 0) || !(c.raccolta >= 0)) g.push(`${c.id}: prezzo impossibile`)
    /* Un campo che non si vede crescere è un campo che sembra rotto: gli
       stadi devono essere almeno due, seminato e maturo. */
    if (!Array.isArray(c.stadi) || c.stadi.length < 2)
      g.push(`${c.id}: meno di due stadi — la crescita non si vedrebbe`)
    /* Uno stadio che l'atlante non ha è **muto**: `drawImage` con un
       argomento non finito torna senza disegnare e senza lanciare, quindi
       il campo cresce e non si vede crescere, e non c'è niente in
       console. È il motivo per cui i nomi si controllano qui. */
    for (const s of c.stadi || [])
      if (s && !PEZZI[s]) g.push(`${c.id}: lo stadio «${s}» non è nell'atlante`)
  }
  const idRicette = new Set()
  for (const r of RICETTE) {
    if (idRicette.has(r.id)) g.push(`ricetta doppia: ${r.id}`)
    idRicette.add(r.id)
    if (!PRODOTTI[r.da]) g.push(`${r.id}: fa «${r.da}», che non è un prodotto`)
    if (!(r.resa >= 1)) g.push(`${r.id}: non rende niente`)
    if (!(r.minuti > 0)) g.push(`${r.id}: tempo impossibile`)
    for (const k of Object.keys(r.prende || {})) {
      if (!PRODOTTI[k]) g.push(`${r.id}: prende «${k}», che non è un prodotto`)
      if (!(r.prende[k] >= 1)) g.push(`${r.id}: prende una quantità impossibile di ${k}`)
    }
    if (!Object.keys(r.prende || {}).length)
      g.push(`${r.id}: non prende niente — sarebbe una fonte di roba dal nulla`)
  }
  /* Un prodotto senza silo non si potrebbe raccogliere: `quantoCiSta`
     risponderebbe zero per sempre, e a schermo sarebbe un raccolto che
     non entra da nessuna parte senza che niente dica perché. */
  for (const [id, pr] of Object.entries(PRODOTTI))
    if (!SILI[pr.silo]) g.push(`${id}: sta in un silo che non esiste («${pr.silo}»)`)
  if (!(SILO_BASE > 0)) g.push('un silo da zero non tiene niente')
  if (!(SILO_PIU > 0)) g.push('un ingrandimento che non aggiunge niente non si paga')
  /* Il prezzo deve **salire**: uno che scende farebbe convenire
     aspettare, che è il contrario di quello che deve fare. */
  for (let l = 0; l < 6; l++)
    if (!(costoIngrandimento(l + 1) > costoIngrandimento(l)))
      g.push(`l'ingrandimento numero ${l + 2} non costa più del precedente`)
  return g
}
