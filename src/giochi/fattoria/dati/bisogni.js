/* ═══════════════════════════════════════════════════════════════════
   COME STA UNA BESTIA, E COSA LE SERVE

   Tre bisogni che calano da soli e tre modi di riempirli. Il dato è qui;
   il conto lo fa il motore, il disegno la scena.

   ── CALANO CON LE ORE VERE, NON COI FOTOGRAMMI ────────────────────
   Se il gioco resta chiuso una settimana, al ritorno il cane ha fame:
   è giusto, ed è quello che rende una bestia una bestia invece di una
   figurina. Ma il fondo è **0,15 e non zero**: non sta mai male, non si
   ammala, non muore. Questo posto è il premio per gli esercizi fatti
   altrove — un animale che ti fa sentire in colpa se non apri l'app lo
   trasformerebbe nell'ennesimo compito, e il compito lo si smette.

   ── OGNI GESTO COSTA UNA MONETINA ─────────────────────────────────
   *Ribalta due volte la stessa regola.* Prima erano gratis tutte e due
   («sono le due cose che un bambino può sempre fare»), poi è diventata
   a pagamento la pallina e gratis la spazzola («nessuno resta con un
   animale che non può toccare»). Adesso **costano una monetina tutte e
   due**, ed è una decisione presa sapendo cosa comporta: chi è a zero
   monete non può fare niente col suo animale finché non fa un
   esercizio.

   Il motivo è che una bestia deve costare qualcosa ogni giorno — se no
   il primo giorno è l'unico che conta — e che un gesto gratis in mezzo
   a gesti che costano non si legge come un regalo: si legge come quello
   che si preme sempre, e gli altri due diventano decorazione. Una
   monetina è dieci secondi di esercizio (`CALIBRAZIONE.md`): è il
   prezzo più piccolo che esista qui dentro, non una tassa.

   ── OGNI BESTIA HA I SUOI CIBI ────────────────────────────────────
   I quattro cibi valevano uguale per tutti e cambiava solo quanto
   riempivano: la bistecca al pappagallo era una scelta come un'altra.
   Adesso ogni cibo dichiara **per chi è** (`per`, le famiglie di
   `dati/animali.js`), e quello sbagliato viene **rifiutato**, non
   pagato meno: un no è una cosa che un bambino vede, mezza barretta in
   meno no. Dentro la famiglia resta la scaletta di sempre — poco caro
   riempie poco, caro riempie tanto ma rende un po' meno al pezzo.

   ── E DUE CIBI CHE NON SI COMPRANO ────────────────────────────────
   Il mangime e il pastone escono dal mulino (`dati/coltivazioni.js`) e
   costano **zero monete**: sono già stati pagati coltivando. Un cibo
   dichiara quindi *o* un `prezzo` in monete *o* un `da`, cioè il
   prodotto che si scala dal granaio — non entrambi, se no non si
   saprebbe cosa si sta spendendo.

   Vanno bene per **tutte** le famiglie, e non è una scorciatoia: un
   mangime per cani, uno per gatti e uno per pappagalli vorrebbero dire
   tre catene di produzione parallele per la stessa mossa, e la fattoria
   diventerebbe un lavoro d'ufficio. Quello che cambia fra le famiglie
   resta la roba buona che si compra — l'osso, il pesce, i semi.

   ── E UNA BESTIA RIMESSA A POSTO PAGA ESPERIENZA ──────────────────
   Quando, dopo un gesto, **tutti e tre** i bisogni stanno nella fascia
   alta — la stessa soglia di «sta benissimo» in `comeSta`, non una
   nuova — la bestia paga esperienza, come fa il mercato consegnando:
   mai monete (`CALIBRAZIONE.md`). Quanto, lo dice il suo prezzo
   (`premioBenessere` in `dati/animali.js`); *se*, lo decide
   `premiaSeStaBene` qui sotto, ed è **una volta per ciclo**: il
   premio non torna finché almeno un bisogno non è risceso sotto la
   fascia «sta bene». Senza quella riga tre coccole da una monetina
   sarebbero una zecca — non di monete, ma di livelli.

   Il ciclo sta nel record della bestia (`premiato`), e si riarma
   **leggendo**, dentro `scendi`: è lì che i bisogni calano, e un
   salvataggio di ieri che non ha il campo si legge come «non ancora
   premiata», che è il verso giusto.
   ═══════════════════════════════════════════════════════════════════ */
/* L'unico import, e va in una direzione sola: dato che guarda dato. Le
   ricette servono a `serveA()`, in fondo al file. Il catalogo invece
   importa **da qui**, quindi da qui non si importa lui: chi mostra le
   cose ci mette il nome della macchina. */
import { RICETTE, PRODOTTI } from './coltivazioni.js'

export const FONDO = 0.15

export const BISOGNI = {
  pancia: { nome: 'Pancia', icona: '🍖', ore: 14, colore: '#e0a33c' },
  pelo:   { nome: 'Pelo',   icona: '🪮', ore: 30, colore: '#7fb4e0' },
  gioco:  { nome: 'Voglia di giocare', icona: '🎾', ore: 20, colore: '#8fcf6f' },
}

export const CHIAVI = Object.keys(BISOGNI)

/* La ciotola. Due cibi per famiglia — uno da poco e uno buono — perché
   con uno solo non c'è nessuna scelta da fare, e con quattro uguali per
   tutti non c'era niente da imparare. Il cibo buono riempie di più ma
   rende un po' meno al pezzo: spendere tanto in una volta è una
   comodità, non la mossa ovvia.

   `per` sono le famiglie di `dati/animali.js` (`cane-beagle` → `cane`).
   Un cibo che non è per te viene rifiutato: vedi `gradisce()`. */
export const CIBI = [
  { id: 'osso',    nome: 'Osso',    emoji: '🦴', prezzo: 5,  quanto: 0.30, per: ['cane'] },
  { id: 'bistecca', nome: 'Bistecca', emoji: '🥩', prezzo: 14, quanto: 0.70, per: ['cane'] },
  { id: 'pesce',   nome: 'Pesce',   emoji: '🐟', prezzo: 5,  quanto: 0.30, per: ['gatto'] },
  { id: 'pate',    nome: 'Paté',    emoji: '🥫', prezzo: 14, quanto: 0.70, per: ['gatto'] },
  { id: 'semi',    nome: 'Semini',  emoji: '🌰', prezzo: 5,  quanto: 0.30, per: ['pappagallo'] },
  { id: 'frutta',  nome: 'Frutta',  emoji: '🍎', prezzo: 14, quanto: 0.70, per: ['pappagallo'] },
  { id: 'carota',  nome: 'Carota',  emoji: '🥕', prezzo: 5,  quanto: 0.30, per: ['coniglio'] },
  { id: 'insalata', nome: 'Insalata', emoji: '🥬', prezzo: 14, quanto: 0.70, per: ['coniglio'] },
  /* quelli che non si comprano: costano zero monete e un pezzo di
     granaio — il perché sta in testa al file. Tre vengono dal mulino,
     tre dai recinti, e la scaletta è la stessa di sempre: il mangime
     riempie poco, il tartufo riempie quasi tutto e costa una catena
     lunga (zucche → porcile → mezz'ora). */
  { id: 'mangime', nome: 'Mangime', emoji: '🥣', prezzo: 0, da: 'mangime',
    quanto: 0.30, per: ['cane', 'gatto', 'pappagallo', 'coniglio'] },
  { id: 'uova', nome: 'Uovo', emoji: '🥚', prezzo: 0, da: 'uova',
    quanto: 0.45, per: ['cane', 'gatto', 'pappagallo'] },
  { id: 'latte', nome: 'Ciotola di latte', emoji: '🥛', prezzo: 0, da: 'latte',
    quanto: 0.55, per: ['cane', 'gatto'] },
  { id: 'pastone', nome: 'Pastone', emoji: '🍲', prezzo: 0, da: 'pastone',
    quanto: 0.70, per: ['cane', 'gatto', 'pappagallo', 'coniglio'] },
  /* La merenda è **la sesta pappa, e la più lunga da fare**: fragole
     e miele, cioè un campo da undici minuti e tutta la catena delle
     api. Sta fra il pastone e il tartufo perché costa quel tanto, e
     vale per tutti e tre apposta — una pappa che riempie 3/4 di pancia
     e la potesse mangiare solo il pappagallo sarebbe una catena da
     cinquanta livelli chiusa dietro una bestia da 🪙120. */
  { id: 'merenda', nome: 'Merenda', emoji: '🥧', prezzo: 0, da: 'merenda',
    quanto: 0.75, per: ['cane', 'gatto', 'pappagallo', 'coniglio'] },
  /* Il pane esce dal panificio, la prima pappa che passa dalla
     dispensa: fra il latte e il pastone, e vale per tutti. */
  { id: 'pane', nome: 'Pane', emoji: '🍞', prezzo: 0, da: 'pane',
    quanto: 0.60, per: ['cane', 'gatto', 'pappagallo', 'coniglio'] },
  /* Il formaggio esce dal caseificio, dove il latte si sdoppia: è la
     pappa più ricca che non chieda un porcile, e **cagliare non costa
     un gesto** — con 🪙1 sarebbe al 78% della stessa pancia comprata,
     dentro la fascia ma sul bordo. */
  { id: 'formaggio', nome: 'Formaggio', emoji: '🧀', prezzo: 0, da: 'formaggio',
    quanto: 0.85, per: ['cane', 'gatto', 'coniglio'] },
  /* Il minestrone è la pappa dell'orto, e l'unica delle quattro della
     cucina che costi abbastanza poco per una ciotola: tre colture
     diverse, cioè tre campi liberi nello stesso momento — che qui è il
     prezzo vero, molto più delle quattro monete. */
  { id: 'minestrone', nome: 'Minestrone', emoji: '🍜', prezzo: 0, da: 'minestrone',
    quanto: 0.50, per: ['cane', 'gatto', 'pappagallo', 'coniglio'] },
  { id: 'tartufi', nome: 'Tartufo', emoji: '🍄', prezzo: 0, da: 'tartufi',
    quanto: 0.90, per: ['cane', 'gatto', 'pappagallo'] },
]

export const cibiPer = famiglia => CIBI.filter(c => c.per.includes(famiglia))
export const gradisce = (cibo, famiglia) => !!cibo && cibo.per.includes(famiglia)
/* Quelli che si comprano con le monete, e sono la maggioranza: serve a
   chi confronta i prezzi fra loro, che col mangime a zero non ha senso. */
export const cibiComprati = CIBI.filter(c => !c.da)

/* La spazzola è gratis, la pallina no: il perché sta in testa al file,
   ed è una decisione presa, non una svista.

   La copertina è la terza, ed è la prima coccola che si paga **col
   granaio** invece che con le monete: stessa forma dei cibi (`da`, e
   niente `prezzo`), e stesso motivo. Serve a dare un mestiere alla
   lana, che è l'unica roba dei recinti che non si mangia, e serve a che
   oltre la ciotola ci sia qualcos'altro da desiderare. */
export const COCCOLE = [
  { id: 'spazzola', bisogno: 'pelo',  nome: 'Spazzolalo',   emoji: '🪮', quanto: 0.5,  prezzo: 1 },
  { id: 'gioca',    bisogno: 'gioco', nome: 'Gioca con lui', emoji: '🎾', quanto: 0.55, prezzo: 1 },
  { id: 'copertina', bisogno: 'pelo', nome: 'Copertina di lana', emoji: '🧶',
    quanto: 0.95, prezzo: 0, da: 'lana' },
  /* ── LA FESTA ────────────────────────────────────────────────────
     La coccola del caseificio, e la ragione per cui la torta non è
     soltanto roba da vendere al banco: è **il compleanno del cane** —
     tre catene che si incontrano in una torta, e la voglia di giocare
     torna piena.

     Riempie **tutto** (1) e non quasi tutto come la copertina: sta in
     fondo a una catena di cinque fasi, e chi ci arriva non deve
     ritrovarsi la barra ancora da finire. */
  { id: 'festa', bisogno: 'gioco', nome: 'Festa con la torta', emoji: '🎂',
    quanto: 1, prezzo: 0, da: 'torta' },
  /* Il bagnetto fa per il pelo quello che la festa fa per il gioco, e
     sta in fondo a una catena ancora più lunga: il colore dai campi, il
     burro dal latte. La spazzola resta il gesto di tutti i giorni, il
     bagnetto è la cosa che si fa quando si è coltivato per una sera. */
  { id: 'bagnetto', bisogno: 'pelo', nome: 'Bagnetto', emoji: '🧼',
    quanto: 1, prezzo: 0, da: 'sapone' },
]

export const nuovo = (ora = Date.now()) =>
  ({ pancia: 0.8, pelo: 0.9, gioco: 0.7, quando: ora })

/* ── UNA FOTOGRAFIA, NON IL RECORD DELLA BESTIA ───────────────────
   Chi mostra i bisogni riceve **una copia dei tre numeri**, mai la
   bestia viva del motore. Sembra un dettaglio e non lo è: è il guasto
   che da fuori si vedeva come *«dai un gomitolo e salgono due stati»*.

   Il foglio della bestia riceveva `mondo.stato(chi)`, che è **sempre lo
   stesso oggetto** — il record dentro `fattoria.bestie` — e Vue non
   ridisegna un figlio quando nessuna delle sue prop è cambiata di
   *identità*. Un gesto pagato col granaio (la copertina di lana, il
   mangime, il pastone: `prezzo: 0`) non muove nemmeno le monete, quindi
   dopo il tocco tutte le prop erano identiche a prima e **la barra
   restava ferma**: il gesto sembrava non fatto. Poi bastava un gesto
   pagato a monete perché il foglio si ridisegnasse, e saltavano su
   **due barre insieme** — quella di adesso e quella di prima. Da fuori
   è un oggetto con doppio effetto; sotto, il motore aveva sempre
   alzato un bisogno solo.

   Una fotografia è un oggetto nuovo a ogni scatto, quindi chi guarda si
   accorge che è cambiata. Tiene solo i tre bisogni: l'orologio, il
   nome e le coordinate sono roba del motore e a chi disegna una barra
   non servono. */
export const foto = b => Object.fromEntries(CHIAVI.map(k => [k, (b || {})[k] ?? 0]))

/* Quanto è calato da `quando` a ora. Chi legge lo stato lo fa scendere
   e riscrive l'orologio: così il calo non dipende da quanto spesso si
   guarda, che è l'errore classico di questi conti. */
export function scendi(b, ora = Date.now()) {
  const ore = Math.max(0, (ora - (b.quando || ora)) / 3600000)
  if (ore > 0.02) {
    for (const k of CHIAVI)
      b[k] = Math.max(FONDO, Math.min(1, (b[k] ?? 0.8) - ore / BISOGNI[k].ore))
    b.quando = ora
  }
  riarma(b)
  return b
}

/* ── LE DUE SOGLIE DI `comeSta`, SCRITTE UNA VOLTA ────────────────
   Sopra `BENISSIMO` si sta benissimo, sopra `BENE` si sta bene. Sono
   le stesse che decidono il premio: tutti e tre sopra la prima lo
   danno, uno solo sotto la seconda lo riarma. Una soglia in più per il
   premio sarebbe una terza fascia che nessuna frase racconta. */
export const BENISSIMO = 0.78
export const BENE = 0.55

export const umore = b => CHIAVI.reduce((s, k) => s + (b[k] ?? 0), 0) / CHIAVI.length
export const haBisogno = b => CHIAVI.some(k => (b[k] ?? 1) < 0.35)

/* Tutti e tre i bisogni nella fascia alta — non la media: una pancia
   piena e un pelo arruffato fanno una media da «sta bene» e una bestia
   che non è a posto. */
export const tuttoAPosto = b => CHIAVI.every(k => ((b || {})[k] ?? 0) > BENISSIMO)

/* Il ciclo si riarma quando **almeno un** bisogno è sceso sotto la
   fascia «sta bene»: da lì in su c'è di nuovo del lavoro da fare, e il
   prossimo «tutto a posto» è di nuovo una notizia. */
export function riarma(b) {
  if (b.premiato && CHIAVI.some(k => (b[k] ?? 0) <= BENE)) b.premiato = false
  return b
}

/* Dopo un gesto: si premia? Torna `true` una volta per ciclo, e segna
   il record. `eraAPosto` è com'era la bestia **prima** del gesto: se
   stava già benissimo il gesto non ha rimesso a posto niente — è il
   caso di un salvataggio di ieri, letto senza `premiato`, con la bestia
   in forma: la prima spazzolata non è un premio da riscuotere. */
export function premiaSeStaBene(b, eraAPosto = false) {
  if (!b || eraAPosto || b.premiato || !tuttoAPosto(b)) return false
  b.premiato = true
  return true
}

/* Le frasi valgono per **tutte** le bestie: un pappagallo che scodinzola
   e porta la pallina era il prezzo di averle scritte pensando al cane. */
export function comeSta(b, nome = 'Sta') {
  const u = umore(b)
  if (u > BENISSIMO) return `${nome} sta benissimo. Ti viene incontro appena ti vede.`
  if (u > BENE) return `${nome} sta bene.`
  if (b.pancia < 0.35) return `${nome} ha fame: guarda te, poi la ciotola.`
  if (b.gioco < 0.35) return `${nome} si annoia: gira in tondo e ti guarda.`
  if (b.pelo < 0.35) return `${nome} ha il pelo tutto arruffato.`
  return `${nome} potrebbe stare meglio.`
}

/* ── A COSA SERVE UNA ROBA DEL SILO ───────────────────────────────
   Premendo il grano dentro un silo si legge chi lo usa. È l'unica cosa
   utile che una riga di scaffale possa dire — «non si vende, serve alle
   macchine» è vero per tutto e quindi non dice niente di *questo*
   prodotto — ed è anche il modo in cui la catena si scopre da dentro:
   chi guarda il fieno legge che ci si fa il latte, e sa cosa comprare.

   Sta qui e non nella vista perché è dato che guarda dato: le ricette,
   la ciotola e le coccole sono tre tabelle diverse, e metterle insieme
   in un componente vorrebbe dire che il prossimo modo di spendere una
   roba non compare in questo elenco senza che nessuno se ne accorga.

   Torna righe già pronte per essere lette, ma **non frasi**: il nome
   della macchina lo sa il catalogo (che importa da qui, quindi da qui
   non si può importare lui) e la frase la compone chi mostra.

   E sono **tre uscite su cinque**: gli addobbi pagati col granaio e gli
   ordini del mercato stanno in tabelle che questo file non può
   importare senza chiudere un anello. Il conto intero lo fa
   `dati/usi.js`, ed è lì che si chiede «a cosa serve» per davvero. */
/* ── I GESTI CHE RIEMPIONO UN BISOGNO ─────────────────────────────
   La scheda di una bestia è fatta di **tre blocchi**, uno per bisogno,
   e dentro ognuno stanno le cose che quel bisogno lo riempiono: sotto
   la pancia la ciotola, sotto il pelo la spazzola e la copertina, sotto
   il gioco la pallina. Era un elenco di cibi e una fila di tasti in
   fondo, e non si capiva quale tasto muovesse quale barretta.

   `famiglia` toglie di mezzo quello che questa bestia rifiuta: era
   mostrato apposta («che un gatto non mangi i semini si impara vedendo
   il semino accanto al pesce»), e la lezione c'era, ma il prezzo era
   una ciotola di dieci tasti di cui sei spenti — su un telefono, sotto
   il dito di chi ha quattro anni. Chi vuole imparare cosa mangia un
   gatto adesso lo legge dove serve: nella riga «gli piace». */
export function gestiPer(bisogno, famiglia = null) {
  if (bisogno === 'pancia')
    return CIBI.filter(c => !famiglia || c.per.includes(famiglia))
      .map(c => ({ che: 'cibo', ...c }))
  return COCCOLE.filter(c => c.bisogno === bisogno).map(c => ({ che: 'coccola', ...c }))
}

export function serveA(prodotto) {
  const usi = []
  for (const r of RICETTE)
    if ((r.prende || {})[prodotto])
      usi.push({ che: 'ricetta', dove: r.dove, quanti: r.prende[prodotto],
                 emoji: r.emoji, nome: r.nome, resa: r.resa, minuti: r.minuti })
  for (const c of CIBI)
    if (c.da === prodotto)
      usi.push({ che: 'cibo', emoji: c.emoji, nome: c.nome, quanto: c.quanto })
  for (const c of COCCOLE)
    if (c.da === prodotto)
      usi.push({ che: 'coccola', emoji: c.emoji, nome: c.nome,
                 bisogno: (BISOGNI[c.bisogno] || {}).nome || c.bisogno })
  return usi
}

export function guastiDeiBisogni() {
  const g = []
  /* «Non serve a niente» si controlla in `dati/usi.js`, che vede anche
     gli addobbi e gli ordini: da qui si vedono tre uscite su cinque. */
  if (!(FONDO > 0)) g.push('il fondo dev\'essere sopra zero: una bestia non sta mai male')
  if (!(BENE < BENISSIMO && BENISSIMO < 1))
    g.push('le due soglie di «come sta» non stanno in ordine: il premio non si riarmerebbe mai')
  /* Una bestia appena comprata **non nasce a posto**: se nascesse già
     sopra la soglia, il primo gesto non avrebbe niente da rimettere a
     posto e il primo premio sarebbe una cosa che non si capisce. */
  if (tuttoAPosto(nuovo()))
    g.push('una bestia appena comprata nasce già a posto: il primo premio sarebbe gratis')
  for (const [k, b] of Object.entries(BISOGNI))
    if (!(b.ore > 0)) g.push(`${k}: ore impossibili`)
  const visti = new Set()
  for (const c of CIBI) {
    if (visti.has(c.id)) g.push(`cibo doppio: ${c.id}`)
    visti.add(c.id)
    /* O si paga in monete o si scala dal granaio, non entrambi: un cibo
       che costa 5 monete **e** un mangime non si saprebbe raccontare, e
       il pannello mostrerebbe un prezzo che è solo metà del vero. */
    if (c.da && c.prezzo) g.push(`${c.id}: costa monete e roba insieme — decidi quale`)
    if (!c.da && !(c.prezzo > 0)) g.push(`${c.id}: prezzo impossibile`)
    if (!(c.quanto > 0 && c.quanto <= 1)) g.push(`${c.id}: riempie una quantità impossibile`)
    if (!Array.isArray(c.per) || !c.per.length)
      g.push(`${c.id}: non è il cibo di nessuno, e nessuno lo mangerà mai`)
  }
  /* Il cibo caro non deve convenire anche al pezzo, se no gli altri non
     li sceglie più nessuno e tanto vale toglierli. Il confronto è
     **dentro la famiglia**: fra la bistecca del cane e i semi del
     pappagallo non c'è nessuna scelta da fare, e paragonarli darebbe un
     guasto che non vuol dire niente. */
  /* Il confronto vale solo fra i cibi **comprati**: il mangime del
     mulino costa zero monete e renderebbe all'infinito al pezzo, cioè
     darebbe un guasto a ogni giro dicendo una cosa vera e inutile — che
     coltivare conviene. Conviene, ed è il punto: costa tempo. */
  for (const famiglia of new Set(CIBI.flatMap(c => c.per))) {
    const suoi = cibiPer(famiglia).filter(c => !c.da)
    for (let i = 1; i < suoi.length; i++)
      if (suoi[i].quanto / suoi[i].prezzo > suoi[i - 1].quanto / suoi[i - 1].prezzo)
        g.push(`${suoi[i].id}: rende più al pezzo di quello prima — gli altri diventano inutili`)
  }
  /* **Un oggetto riempie un bisogno solo**, e si riconosce da un id
     solo. Se lo stesso id stesse in tutte e due le tabelle, il foglio
     della bestia lo mostrerebbe sotto due barre diverse — la stessa
     figura premuta in due posti che fanno due cose — e chi lo tocca non
     saprebbe quale sta muovendo. */
  for (const c of COCCOLE) {
    if (visti.has(c.id)) g.push(`${c.id}: l'id è già di un'altra roba — un oggetto, un bisogno`)
    visti.add(c.id)
    if (!BISOGNI[c.bisogno]) g.push(`${c.id}: riempie un bisogno che non esiste`)
    if (!(c.quanto > 0)) g.push(`${c.id}: non riempie niente`)
    if (!(c.prezzo >= 0)) g.push(`${c.id}: prezzo impossibile`)
    /* Stessa regola dei cibi, e per lo stesso motivo: monete o roba, non
       tutte e due, se no il pannello mostra metà del prezzo vero. */
    if (c.da && c.prezzo) g.push(`${c.id}: costa monete e roba insieme — decidi quale`)
  }
  /* Una carezza gratis ci dev'essere sempre: è quello che tiene in piedi
     la decisione di far pagare il gioco. Chi è a zero monete deve poter
     comunque toccare il suo cane. */
  if (!COCCOLE.some(c => !c.prezzo))
    g.push('nessuna coccola gratis: chi è a zero monete resta con un animale intoccabile')
  return g
}
