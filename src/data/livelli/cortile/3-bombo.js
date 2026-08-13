/* 3 ─ BOMBO, cioè ASPETTA CHE PASSI E POI CORRI.

      Il cane del vicino non morde: **abbaia**, e se abbaia Bibi scappa
      e la partita è persa. Nel motore è una riga sola — `grida:
      'abbaio'` — e da lì il livello si regge in piedi: chi vede un
      estraneo grida, e quel grido è la sconfitta (`perde: [sentito]`).

      ── LE DUE VISTE, CHE SONO IL LIVELLO ──
      Rosa vede lontano, Bombo vede corto. Fra le due misure c'è una
      fascia in cui **lo vedi e lui non vede te**, ed è lì che si sta ad
      aspettare. Non è una regola in più da spiegare: le due schede lo
      dicono, e chi le legge trova il posto giusto.

      Dietro la legnaia quella fascia è tutto il cortile: da lì Rosa
      tiene d'occhio il corridoio fino in fondo, e nessun punto del giro
      di Bombo arriva abbastanza vicino da vederla.

      ── PERCHÉ DUE ATTESE E NON UNA ──
      «Aspetta che non lo vedi» da sola non dice niente: se non lo vedi
      può essere appena sparito di là, o non essere ancora arrivato di
      qua. Le due attese in fila dicono una cosa sola e precisa:

          aspetta che  [vedi Bombo]        ← eccolo, sta passando
          aspetta che  [non vedi Bombo]    ← è andato in fondo: adesso

      È il fronte di salita e quello di discesa, ed è il primo pezzo di
      sincronizzazione vera della campagna: non «quanto tempo», ma «dopo
      quale fatto». La stessa cosa che al totem si impara sul conto —
      fermati su quello che vuoi, non sul numero che hai indovinato.

      ── E BIBI NON C'ENTRA COL CANE ──
      Bombo e Bibi sono tutti e due del cortile: sono di casa, si
      conoscono, e il cane non abbaia alla papera. A schermo è la stessa
      cosa che sono nella stessa schiera, e serve a togliere di mezzo
      l'unico modo di perdere che il bambino non potrebbe controllare —
      la papera che gli passa davanti mentre lo segue. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const rosa = chi.nostro('rosa', 'Rosa', { corpo: 'principessa', emoji: '👧', vista: 7 })

const pane = cose.pane()
/* ── I POSTI HANNO UNA FACCIA, E NON UN'ETICHETTA ──
   Erano tre celle di prato con tre nomi: a schermo, tre riquadri
   identici da distinguere leggendo. Adesso l'orto è un cespuglio,
   la siepe è un cespuglio più fitto e la legnaia è una catasta —
   si riconoscono a occhio, che è quello che serve quando si sceglie
   dove mandare qualcuno. */
const orto = cose.posto('orto', "l'orto", { pittore: 'fungo', em: '🌱' })
const siepe = cose.posto('siepe', 'la siepe', { pittore: 'cespuglio', em: '🌳' })
const legnaia = cose.posto('legnaia', 'la legnaia', { pittore: 'botte', em: '🪵' })

const bibi = chi.terzo('bibi', 'Bibi', { corpo: 'papera', emoji: '🦆', vista: 4, vita: 4,
  schiera: 'cortile', schieraNome: 'quelli del cortile',
  fa: [fai.ripeti([fai.vai(pane)], se.caduto('bibi'))] })

/* ── IL CANE ──
   Non assale e non insegue: cammina e abbaia. Se assalisse, il livello
   diventerebbe una gara di velocità invece di un problema di sguardi.
   `vista: 3` è corta apposta, ed è la metà della misura che conta.
   La sosta in fondo al cortile è la finestra: senza, chi parte al
   momento giusto se lo ritrova addosso lo stesso, e il livello
   diventerebbe una questione di battiti contati — cioè di fortuna. */
const bombo = fa => chi.nemico('bombo', 'Bombo', { corpo: 'lupo', emoji: '🐕',
  vista: 3, vita: 8, grida: 'abbaio',
  schiera: 'cortile', schieraNome: 'quelli del cortile', fa })

/* ── IL GIRO STA TUTTO DI LÀ, ED È LA CHIAVE DEL LIVELLO ──
   Bombo va e viene fra il centro del cortile e il fondo di levante, e
   **non arriva mai dalla parte della legnaia**. Da lì viene che «non lo
   vedo più» vuol dire una cosa sola: è in fondo. Se il suo giro
   arrivasse anche di qua, sparire vorrebbe dire due cose — è andato, o
   sta tornando — e nessuna attesa potrebbe distinguerle: il livello
   diventerebbe fortuna. La sosta in fondo è la finestra per passare. */
const giro = [fai.vai('11,3'), fai.aspettaUnPo(5), fai.vai('5,3')]
/* le tre scene sono lo stesso giro cominciato in tre punti diversi:
   chi conta i momenti indovina una volta su tre */
const bomboDa = quale => bombo([fai.ripeti(
  quale === 0 ? giro
  : quale === 1 ? [fai.vai('5,3'), ...giro]
  : [fai.aspettaUnPo(4), ...giro],
  se.caduto('rosa'))])

const abbaio = cose.segnale('abbaio', 'un abbaio', { em: '🐕', col: '#c9603f' })

/* IL CORTILE — tre fasce. A tramontana la legnaia, dove si sta a
   guardare; in mezzo il corridoio, che è tutto di Bombo; a mezzogiorno
   l'orto. Un varco solo, e sta in mezzo: si attraversa di là o non si
   attraversa. */
const CORTILE = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|P$|LG|BB|..|..|..|..|..|..|..|..|##',
  '##|##|##|##|..|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|..|..|..|..|..|CN|##',
  '##|##|##|##|..|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|..|OR|..|..|..|SP|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
], { 'P$': pane, LG: [legnaia, rosa], BB: bibi, CN: cose.segnaposto(),
     OR: orto, SP: siepe })

export const BOMBO = livello({
  id: 'cortile-bombo', nome: 'Bombo', idea: 'Aspetta che passi, e appena è passato corri',
  dritta: "Obiettivo: <b>Bibi nell'orto, e Rosa dietro la siepe</b>. Se Bombo abbaia, Bibi scappa via.",
  racconto: 'Bombo va su e giù per il cortile e non morde: <b>abbaia</b>, e a Bibi tanto basta. Tocca tutti e due e guarda <b>fin dove vedono</b>: non è la stessa distanza.',
  aiuti: ['Il cane è di casa come Bibi: alla papera non abbaia. Abbaia a te.',
          'C\'è un posto da cui lo vedi passare senza che lui veda te.',
          'Che tu non lo veda può voler dire due cose: che è andato via, o che non è ancora arrivato. Una sola delle due è il momento buono — e per distinguerle bisogna prima averlo visto.'],
  ambiente: 'cortile',

  scena: CORTILE,
  segnali: [abbaio],
  complementi: ['pane', 'orto', 'siepe', 'legnaia', 'bombo', 'bibi'],
  verbi: ['vai', 'prendi', 'posa', 'aspetta'],
  condizioni: [se.vedi('bombo'), se.nonVedi('bombo')],

  /* ── DUE CONDIZIONI, E LA SECONDA È QUELLA CHE INSEGNA ──
     Bibi nell'orto **e Rosa tornata dietro la siepe**. Senza la
     seconda il livello si vincerebbe senza posare niente: la papera
     segue chi ha il pane, quindi le basterebbe che Rosa entrasse
     nell'orto e restasse lì. La papera deve RESTARE, e tu no: da qui
     `posa` smette di essere una comodità e diventa l'unico modo. */
  vince: [se.qui(bibi, orto), se.qui(rosa, siepe)],
  perde: [se.sentito(abbaio)],
  motivoSconfitta: 'Bombo ha abbaiato, e Bibi è scappata via.',
  mostraNemici: true,

  varianti: [
    { nome: 'Bombo viene verso di te', metti: { CN: bomboDa(0) } },
    { nome: 'Bombo è in fondo al cortile', metti: { CN: bomboDa(1) } },
    { nome: 'Bombo si è appena fermato', metti: { CN: bomboDa(2) } },
  ],

  par: 6,
  soluzioni: [
    { nome: 'lo lascio passare', piano: { rosa: [
      fai.prendi(pane),
      fai.aspettaDiVedere('bombo'),
      fai.aspettaChe(se.nonVedi('bombo')),
      fai.vai(orto), fai.posa(pane), fai.vai(siepe),
    ] } },

    /* FRAGILE: i momenti contati. Vince la scena in cui il conto
       casca giusto e perde le altre due — ed è la mossa più naturale
       del mondo per chi ha già visto `aspetta un momento`. */
    { nome: 'conto fino a sei', fragile: true, piano: { rosa: [
      fai.prendi(pane),
      fai.aspettaUnPo(6),
      fai.vai(orto), fai.posa(pane), fai.vai(siepe),
    ] } },
  ],

  verifiche: {
    /* senza sincronizzazione non si passa: è tutta la lezione */
    nonInFila: true,
    ordineConta: [['vai orto', 'posa pane']],
  },
})

export default BOMBO
