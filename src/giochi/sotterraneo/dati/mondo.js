// Le misure del sotterraneo: dato puro, nessuna funzione che gioca, nessun canvas.
import { ORPELLI } from './orpelli.js'

// 16px: la misura degli eroi di 0x72 ("16×16 DungeonTileset II"), a cui si riducono tutti i fogli generati
export const T = 16                               // la tessera, in pixel
export const SCALA_MIN = 2, SCALA_MAX = 5, SCALA_INIZIALE = 3   // interi: a 2,3 i pixel sarebbero larghi due e altri tre

export const ROCCIA = 0, PAVIMENTO = 1, PORTA = 2
// celle dentro una stanza dove non si cammina e che non sono muro: un relitto (macerie, una statua rotta, un sarcofago: ferma la
// luce come un muro) e l'acqua (non si calpesta ma si vede di là: non ferma la luce). docs/sotterraneo/piani-caverne.md
export const RELITTO = 3, ACQUA = 4

// vita/attacco/difesa di partenza: valgono dentro una discesa e non crescono con le tappe fatte (dati/campagna.js)
export const EROE = { vita: 18, att: 3, dif: 1 }

export const TASCHE = 6   // un limite vero: piene, quello per terra resta per terra
// le tasche in più si comprano con le gemme, una alla volta (l'utente, 9 ottobre: sei sono poche con tutto quello che cade):
// il prezzo cresce in linea retta, mai esponenziale, e c'è un tetto. Stanno nella crescita dell'eroe (`crescita.tasche`)
export const TASCHE_EXTRA_MAX = 8
export const prezzoTasca = extra => 30 * (extra + 1)
// e la forza dà posto (l'utente, 9 ottobre: a un mago la forza non serviva a niente): una tasca ogni tre punti oltre il primo
export const FORZA_PER_TASCA = 3

// la luce è un cono davanti all'eroe (nel verso dell'ultimo passo) e un alone corto attorno; alle spalle è ombra
// (docs/sotterraneo/luce.md). Lunghezze in celle: senza torcia il cono è corto, con la torcia lungo, all'ultima stanza
// della torcia in mezzo; l'alone dietro è quasi niente senza torcia e circa una cella con. La torcia non accende più
// la stanza: allunga il cono, e l'ombra c'è sempre
export const RAGGIO = 3.2, RAGGIO_TORCIA = 6.2, RAGGIO_SGOCCIOLI = 4.4
export const ALONE = 1.5, ALONE_TORCIA = 2.2, ALONE_SGOCCIOLI = 1.8, ALONE_SFUMA = 1   // l'alone sfuma per l'ultima cella
// gradi, da un bordo all'altro: buio resta solo il settore alle spalle (140°), non i fianchi (l'utente, 13 ottobre: «a destra non si
// vede nulla»; l'idea era l'ombra DIETRO l'eroe). L'agguato viene dai 120° dietro, dentro quel buio (motore/scontro.js)
export const APERTURA_CONO = 220
export const SFUMA_CONO = 0.6, SFUMA_ARCO = 0.45   // quanto del cono (in lunghezza, e in apertura) sfuma fino a spegnersi
export const FORZA_MINIMA = 0.22       // sotto questa forza una cella non è in luce: resta ricordo
// un mostro si sveglia quando ti avvicini a meno di SVEGLIA celle nella sua stanza, con la luce o senza: è quasi la
// stanza di prima (la sveglia non dipende dalla luce, o la torcia cambierebbe l'equilibrio); si vede solo in luce
// (docs/sotterraneo/luce.md)
export const SVEGLIA = 7

// il mostro è più lento apposta: scappare deve funzionare sempre, o la stanza è una trappola
export const PASSO_EROE = 5.4, PASSO_MOSTRO = 3.1, PASSO_RIENTRO = 2.2
export const CALMA = 3   // il tempo di uscire dalla stanza, o lo scontro si riaprirebbe nel fotogramma dopo
// un mostro sveglio fuori dalla luce non punta all'eroe ma alle sue spalle: il punto dietro di lui (DIETRO celle), girando
// largo a FIANCO celle finché sta più avanti di ALLA_PAR (docs/sotterraneo/luce.md)
export const DIETRO = 0.5, FIANCO = 2.6, ALLA_PAR = 0.6
// un mostro di lato ma non ancora nel cono dietro punta prima a LARGO_DIETRO celle dietro l'eroe, per non toccarlo dal fianco
export const LARGO_DIETRO = 1.6

// Lo scontro a gruppi (docs/sotterraneo/scontro.md): entrano i mostri vivi entro RAGGIO_SCONTRO celle dall'eroe, nella
// stessa stanza, al più MOSTRI_IN_CAMPO posti (il grosso ne vale due); un colpo di mostro vale COLPO_DEL_MOSTRO per
// (attacco − difesa), almeno 1, qualunque sia la risposta
export const RAGGIO_SCONTRO = 4.5
export const MOSTRI_IN_CAMPO = 6
export const COLPO_DEL_MOSTRO = 1.1

// arredo (barili, casse...): non toccabile, disegnato più spento delle cose che rispondono (scena/tela.js).
// Cosa c'è, dove sta e quanto è epico lo dice dati/orpelli.js; qui resta la frase del generico, quella di chi non
// dichiara lo scenario (le cantine)
export const ARREDO_DICE = Object.fromEntries(ORPELLI.cantine.map(o => [o.pezzo, o.dice]))
export const ARREDO_LA_PRIMA_VOLTA =
  'Questo non si tocca: è arredamento, per questo è più spento.'

export const SORSO = 8, RIPOSO_SCALA = 4, VITA_PER_PIANO = 2

// il bersaglio di una missione (il mostro col nome, il forziere della cosa) si distingue dai suoi simili: più grande,
// con un'aura che pulsa piano di un colore solo suo (lo stesso del punto sulla mappina), e il nome sopra la testa
// quando è in vista (scena/tela.js, docs/sotterraneo/missioni.md)
export const BERSAGLIO = { scala: 1.4, colore: '#ff7ad9', luce: '255,122,217' }

export function guastiDelMondo() {
  const g = []
  if (SCALA_MIN >= SCALA_MAX) g.push('lo zoom non ha spazio fra minimo e massimo')
  if (SCALA_INIZIALE < SCALA_MIN || SCALA_INIZIALE > SCALA_MAX)
    g.push('la scala iniziale sta fuori dai suoi estremi')
  if (PASSO_MOSTRO >= PASSO_EROE)
    g.push('i mostri corrono quanto o più dell\'eroe: scappare non funziona più')
  if (TASCHE < 3) g.push('meno di tre tasche: lo zaino non è una scelta, è un intoppo')
  if (RAGGIO_TORCIA <= RAGGIO) g.push('la torcia non fa vedere più lontano')
  if (ALONE >= RAGGIO || ALONE_TORCIA >= RAGGIO_TORCIA) g.push('l\'alone attorno all\'eroe deve essere più corto del cono')
  if (ALONE_TORCIA <= ALONE) g.push('la torcia non allarga l\'alone')
  if (RAGGIO_SGOCCIOLI <= RAGGIO || RAGGIO_SGOCCIOLI >= RAGGIO_TORCIA) g.push('la torcia agli sgoccioli deve stare fra il buio e la torcia piena')
  return g
}
