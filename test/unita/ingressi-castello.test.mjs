/* ═══════════════════════════════════════════════════════════════════
   LE TAPPE A DUE INGRESSI

   Tre tappe e la partita libera hanno due strade: due bocche in cima al
   campo, due file di mostri, un castello solo. Non è una mappa più
   grande — è una difesa da dividere, ed è l'unica cosa che il gioco
   chiede quando non ha più operazioni nuove da insegnare.

   Le regole che questo test tiene, e che a occhio non si vedono:

     · le due strade **non si fondono**: arrivano alla stessa porta da
       parti diverse, e fino a lì restano due. Se si unissero prima, si
       difenderebbe il tratto comune e i due ingressi non li
       guarderebbe più nessuno — una mappa a due ingressi giocata come
       se ne avesse uno;
     · le piazzole si spartiscono fra le strade e si occupano **a
       giro**, una per parte: se si riempisse una strada per volta, la
       prima torre difenderebbe metà campo e l'altra metà passerebbe
       senza vedere nessuno;
     · nessuna piazzola finisce addosso a un'altra dove le strade
       convergono;
     · da dove arriva l'ondata si sa **tre ondate prima**, se no
       spostare una torre è una carezza invece che una mossa.
   ═══════════════════════════════════════════════════════════════════ */
import { TAPPE, LIBERA, MONDO, ingressiDi, postiDi,
         PIAZZOLE_PER_INGRESSO } from '../../src/data/castello.js'
import { Percorso } from '../../src/motore/castello/percorso.js'
import { Ondate } from '../../src/motore/castello/ondate.js'
import { creaBattaglia } from '../../src/motore/battaglia.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const doppie = TAPPE.filter(t => ingressiDi(t) > 1)
const misure = { ...MONDO }

controlla('qualche tappa ha due ingressi', doppie.length >= 2)
nota('a due ingressi:', doppie.map(t => t.nome).join(' · '),
     '· e la partita libera:', ingressiDi(LIBERA) > 1 ? 'sì' : 'no')
controlla('anche la partita libera', ingressiDi(LIBERA) > 1)

for (const t of [...doppie, LIBERA]) {
  const p = new Percorso(t.forme, t.posti, misure)
  uguale(`${t.nome}: due strade`, p.quanteVie, 2)

  /* la porta è una sola */
  const fini = p.vie.map(v => v.fine)
  controlla(`${t.nome}: arrivano tutte allo stesso castello`,
            Math.hypot(fini[0].x - fini[1].x, fini[0].y - fini[1].y) < 20)

  /* ma gli ingressi sono due, e lontani */
  const inizi = p.vie.map(v => v.inizio)
  controlla(`${t.nome}: e partono da due bocche diverse`,
            Math.abs(inizi[0].x - inizi[1].x) > MONDO.W * 0.25)

  /* le piazzole: spartite, alternate, e mai una sopra l'altra */
  const perVia = [0, 1].map(k => p.postazioni.filter(q => q.via === k).length)
  controlla(`${t.nome}: piazzole su tutte e due le strade (${perVia.join(' + ')})`,
            perVia.every(n => n >= 2))
  const primeDue = p.postazioni.slice(0, 2).map(q => q.via)
  controlla(`${t.nome}: le prime due torri vanno una per strada`,
            primeDue[0] !== primeDue[1])
  let minima = Infinity
  for (let i = 0; i < p.postazioni.length; i++)
    for (let k = i + 1; k < p.postazioni.length; k++)
      minima = Math.min(minima, Math.hypot(p.postazioni[i].x - p.postazioni[k].x,
                                           p.postazioni[i].y - p.postazioni[k].y))
  dentro(`${t.nome}: nessuna piazzola addosso a un'altra`, minima / MONDO.S, 33, 999)
}

/* ── le piazzole in più ──
   Due strade vogliono dire una difesa divisa in due: se le piazzole
   restassero quelle di una tappa a un ingresso, ogni strada ne avrebbe
   la metà. */
for (const t of doppie) {
  const finta = { ...t, forme: undefined, forma: t.forme[0] }
  uguale(`${t.nome}: ${PIAZZOLE_PER_INGRESSO} piazzole in più per il secondo ingresso`,
         postiDi(t) - postiDi(finta), PIAZZOLE_PER_INGRESSO)
}

/* ── da che parte arrivano ── */
{
  const o = new Ondate(doppie[0])
  const lati = [1, 2, 3, 4, 5, 6].map(n => o.viaDi(n, 2))
  nota('le prime sei ondate entrano da:', lati.map(v => (v < 0 ? 'tutte e due' : v)).join(' · '))
  controlla('si alternano', lati[0] !== lati[1])
  controlla('e ogni terza arriva da tutte e due', lati[2] === -1 && lati[5] === -1)
  uguale('con una strada sola non c\'è niente da scegliere', o.viaDi(7, 1), 0)
}

/* ── il preavviso lo dice prima ── */
{
  const tappa = doppie[0]
  const b = creaBattaglia({ tappa, misure, stato: {} })
  b.inizia()
  const prossime = b.prossime(3)
  uguale('il preavviso arriva a tre ondate', prossime.length, 3)
  controlla('e ognuna dice da che parte',
            prossime.every(p => ['sinistra', 'destra', 'ambo'].includes(p.lato)))
  nota('in arrivo:', prossime.map(p => `${p.nome} da ${p.lato}`).join(' · '))

  /* una tappa a una strada non ha un lato da dire, e non lo inventa */
  const sola = creaBattaglia({ tappa: TAPPE[0], misure, stato: {} })
  sola.inizia()
  controlla('dove la strada è una, il lato non si dice',
            sola.prossime(2).every(p => p.lato === undefined))
}

/* ── i mostri escono dalla bocca giusta ── */
{
  const tappa = doppie[0]
  const b = creaBattaglia({ tappa, misure, stato: {} })
  b.inizia()
  b.costruisci('add', {})
  b.chiamaOnda()
  for (let i = 0; i < 400; i++) b.avanza(0.05)
  const vie = new Set(b.nemici.map(n => n.via))
  controlla('i nemici di un\'ondata sola entrano da una bocca sola',
            b.nemici.length === 0 || vie.size === 1)

  /* e all'ondata che arriva da tutte e due, si dividono */
  const c = creaBattaglia({ tappa, misure, stato: {} })
  c.inizia()
  c.costruisci('add', {})
  // dritti alla terza, che è quella che arriva da tutte e due: chiamarle
  // una per una vorrebbe dire aspettare che il campo si pulisca
  c.nuovaOnda(); c.nuovaOnda(); c.nuovaOnda()
  // e si aspetta che ne siano usciti almeno un paio: escono a intervalli
  for (let i = 0; i < 80; i++) c.avanza(0.05)
  const divise = new Set(c.nemici.map(n => n.via))
  controlla('l\'ondata che entra da tutte e due si divide davvero', divise.size === 2)
  nota('all\'ondata 3 in campo ci sono nemici su', divise.size, 'strade')
}

riassunto('le tappe a due ingressi')
