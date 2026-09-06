/* ═══════════════════════════════════════════════════════════════════
   GLI ADDOBBI DELLE BESTIE — CAPPELLINI, FIOCCHI, SCIARPE

   Dato puro: nessuna regola, nessun Vue. Chi li compra e chi li mette
   sta in `motore/fattoria.js`, dove sta il resto delle regole; **dove**
   si attaccano lo dice la scheda dell'animale (`dati/animali.js`,
   `AGGANCI`), perché è un fatto del suo disegno e non di questa
   tabella.

   ── PERCHÉ ESISTONO ───────────────────────────────────────────────
   Una bestia comprata si nutre, si spazzola e cammina, e da lì in poi
   è uguale a quella di chiunque altro. Un cappellino no: è **la tua**,
   e si vede da lontano mentre attraversa il prato. È la stessa cosa
   che il nome fa alle parole (`NOMI` in `dati/animali.js`) fatta al
   disegno, ed è la ragione per cui questi si vedono **in fattoria** e
   non dentro una scheda: un vestito che si guarda solo aprendo un
   foglio non lo mette nessuno.

   ── SONO EMOJI, ED È UN PRIMO PASSO DICHIARATO ────────────────────
   Nel dungeon un mostro non è mai un'emoji, e il motivo vale ancora:
   le emoji le disegna il telefono, quindi in mezzo a uno schermo
   dipinto a mano hanno lo stile di Apple, non si tingono dell'ambiente
   e non tremano quando le colpisci. Qui però la cosa da disegnare è
   **un cappello sopra un cane**, non la creatura che fa paura: si
   ridimensiona con lo sprite, si specchia con lui e segue il passo,
   quindi la differenza si vede molto meno — e il prezzo di aspettare un
   foglio di sprite è che gli addobbi non esistono affatto.

   Resta una cosa da rifare quando ci sarà il foglio: una riga può
   dichiarare `pezzo` invece di `emoji`, esattamente come le merci
   (`PRODOTTI` in `dati/coltivazioni.js`), e da lì in poi la scena
   disegna la tessera. Oggi nessuna lo fa.

   ── I PREZZI ──────────────────────────────────────────────────────
   Sono tutti nella fascia **«una cosetta»** di
   [`CALIBRAZIONE.md`](../../../../CALIBRAZIONE.md): da 🪙6 a 🪙24,
   cioè da uno a quattro minuti di esercizi. Non è una spesa che si
   pesa — è quello che si compra col resto delle monete, dopo il campo
   e prima del prossimo recinto — e va tenuta lì: un cappello che
   costasse quanto un pollaio metterebbe una decorazione in concorrenza
   con la catena, e a quel punto o non lo compra nessuno o si smette di
   costruire.

   Un addobbo **si compra una volta e non si consuma**: toglierlo lo
   rimette nel guardaroba, e da lì torna addosso a chi si vuole quante
   volte si vuole. È la stessa regola del baule — niente si perde mai —
   applicata a quello che le bestie indossano.
   ═══════════════════════════════════════════════════════════════════ */
import { AGGANCI_TUTTI, famigliaDi, portaDi } from './animali.js'

/* `dove` è l'aggancio (`dati/animali.js`), `misura` quanto è grande in
   **pixel dello sprite** — l'unità del foglio, non dello schermo, così
   un addobbo resta della stessa taglia a qualunque zoom. Dieci pixel
   sono i due terzi di una testa larga sedici.

   `per` sono le famiglie a cui sta: assente vuol dire **a tutte**. Ce
   n'è una sola che si restringe, ed è quella che rende il campo utile
   invece che teorico. */
export const ADDOBBI = [
  /* ── in testa ── */
  { id: 'fiore',      nome: 'Fiorellino',  emoji: '🌸', prezzo: 6,  dove: 'testa', misura: 8 },
  { id: 'cappellino', nome: 'Cappellino',  emoji: '🧢', prezzo: 12, dove: 'testa', misura: 10 },
  { id: 'cilindro',   nome: 'Cilindro',    emoji: '🎩', prezzo: 18, dove: 'testa', misura: 11 },
  { id: 'corona',     nome: 'Coroncina',   emoji: '👑', prezzo: 24, dove: 'testa', misura: 10 },
  /* ── sul muso ──
     Di spalle non si vedono, e va bene così: l'aggancio `muso` non
     esiste nel verso «su» (`dati/animali.js`), quindi chi disegna li
     salta senza che nessuno debba dirglielo. */
  { id: 'occhialini', nome: 'Occhialini',  emoji: '👓', prezzo: 10, dove: 'muso', misura: 9 },
  { id: 'occhiali',   nome: 'Occhiali da sole', emoji: '🕶️', prezzo: 16, dove: 'muso', misura: 9 },
  /* ── al collo ── */
  { id: 'fiocco',     nome: 'Fiocco',      emoji: '🎀', prezzo: 8,  dove: 'collo', misura: 9 },
  { id: 'sciarpa',    nome: 'Sciarpa',     emoji: '🧣', prezzo: 14, dove: 'collo', misura: 10 },
  /* La campanella è **dei gatti**, come la porta il gatto di ogni casa.
     È l'unica riga che si restringe a una famiglia, e serve a che la
     regola esista davvero: un catalogo in cui tutto sta a tutti non
     avrebbe mai fatto vedere che il campo funziona. */
  { id: 'campanella', nome: 'Campanella',  emoji: '🔔', prezzo: 10, dove: 'collo',
    misura: 8, per: ['gatto'] },
  /* ── sulla schiena ──
     Il pappagallo non ce l'ha (`porta` nella sua scheda): ha le ali. */
  { id: 'mantellina', nome: 'Mantellina',  emoji: '🧥', prezzo: 20, dove: 'schiena', misura: 11 },
  { id: 'zainetto',   nome: 'Zainetto',    emoji: '🎒', prezzo: 22, dove: 'schiena', misura: 10 },
]

export const PER_ID = Object.fromEntries(ADDOBBI.map(a => [a.id, a]))
export const addobbo = id => PER_ID[id] || null

/* Se questo addobbo sta a questa bestia. Due domande e non una: la
   **famiglia** (una campanella al pappagallo no) e l'**aggancio** (una
   mantellina sulla schiena di chi la schiena non ce l'ha). Sono
   separate apposta — la prima è una scelta di gusto scritta qui, la
   seconda è un fatto del disegno scritto di là — e tenerle insieme
   avrebbe voluto dire un elenco di eccezioni per specie da allineare a
   mano per sempre. */
export function staA(id, chi) {
  const a = PER_ID[id]
  if (!a || !chi) return false
  if (a.per && !a.per.includes(famigliaDi(chi))) return false
  return portaDi(chi).includes(a.dove)
}

/* Quelli che si possono comprare per questa bestia, nell'ordine in cui
   si guardano: prima l'aggancio (tutti i cappelli insieme), poi il
   prezzo. Un elenco mescolato si scorre due volte. */
export const addobbiPer = chi =>
  ADDOBBI.filter(a => staA(a.id, chi))
    .slice()
    .sort((x, y) => AGGANCI_TUTTI.indexOf(x.dove) - AGGANCI_TUTTI.indexOf(y.dove) ||
                    x.prezzo - y.prezzo)

/* Quello che una bestia ha addosso, pronto per chi disegna: `portati` è
   la mappa `{ aggancio: id }` che tiene il motore. Esce **la figura e
   la taglia**, non il nome dell'aggancio — il resto (dove cade quel
   punto in ogni verso) lo mette chi conosce l'animale. */
export function addossoA(portati = {}) {
  const fuori = []
  for (const dove of AGGANCI_TUTTI) {
    const a = PER_ID[portati[dove]]
    if (a) fuori.push({ id: a.id, dove, testo: a.emoji, misura: a.misura })
  }
  return fuori
}

export function guastiDegliAddobbi() {
  const g = []
  const visti = new Set()
  for (const a of ADDOBBI) {
    if (visti.has(a.id)) g.push(`id doppio fra gli addobbi: ${a.id}`)
    visti.add(a.id)
    if (!a.nome) g.push(`${a.id}: senza nome`)
    if (!a.emoji && !a.pezzo) g.push(`${a.id}: non si sa come disegnarlo`)
    if (!AGGANCI_TUTTI.includes(a.dove))
      g.push(`${a.id}: l'aggancio «${a.dove}» non esiste`)
    if (!(a.misura > 0)) g.push(`${a.id}: misura impossibile`)
    /* La fascia «una cosetta» di `CALIBRAZIONE.md`: da un minuto a
       cinque di esercizi. Un cappello fuori da lì non è caro o
       economico, è **nella scala sbagliata** — e allora o non lo compra
       nessuno o si smette di costruire la catena per comprarne uno. */
    if (!(a.prezzo >= 6 && a.prezzo <= 30))
      g.push(`${a.id}: 🪙${a.prezzo} è fuori dalla fascia di una cosetta (6–30)`)
  }
  /* Ogni aggancio deve avere qualcosa da metterci: uno slot vuoto in
     una schermata è un buco che non si spiega. */
  for (const dove of AGGANCI_TUTTI)
    if (!ADDOBBI.some(a => a.dove === dove))
      g.push(`sull'aggancio «${dove}» non si può mettere niente`)
  return g
}
