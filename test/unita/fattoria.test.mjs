/* Verifica della Fattoria, senza browser. Le cose che contano: i dati
   stanno in piedi, il calcolo economico è quello giusto (il rincaro della
   terra, il costo secco dello sgombero, il gratis di rimettere una cosa
   dov'era),
   un giocatore finto compra e sgombera finché può senza lasciare il mondo
   incoerente, e i traguardi scattano solo a chi ha davvero giocato.
   `node test/esegui.mjs fattoria --niente-build` */
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import {
  guastiDelMondo, PIAZZOLE, PIAZZOLE_INIZIALI, PRIMA, COSTO_SPOSTARE, chiave,
} from '../../src/giochi/fattoria/dati/mondo.js'
import { guastiDelCatalogo } from '../../src/giochi/fattoria/dati/catalogo.js'
import { guastiDegliOstacoli, OSTACOLI } from '../../src/giochi/fattoria/dati/ostacoli.js'
import manifesto from '../../src/giochi/fattoria/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { misure, statoTraguardo } from '../../src/store/progressi.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* Una borsa che tiene davvero il conto, per provare che le monete si
   muovono come devono — `borsaInfinita()` del motore serve a isolare le
   regole di posizione da quelle di prezzo, qui serve il contrario. */
function borsaTracciata(iniziale) {
  let n = iniziale
  return { quante: () => n, paga: c => { n -= c; return true }, saldo: () => n,
           regala: c => { n += c } }
}

/* ══════════ 1. i dati stanno in piedi ══════════ */
const guastiM = guastiDelMondo()
controlla('il mondo non ha guasti', guastiM.length === 0, guastiM.join(' · '))
const guastiC = guastiDelCatalogo()
controlla('il catalogo non ha guasti', guastiC.length === 0, guastiC.join(' · '))
const guastiO = guastiDegliOstacoli()
controlla('gli ostacoli non hanno guasti', guastiO.length === 0, guastiO.join(' · '))
const guastiAlbo0 = guastiDellAlbo([manifesto])
controlla('il blocco albo del manifesto non ha guasti', guastiAlbo0.length === 0, guastiAlbo0.join(' · '))

/* ══════════ 2. il calcolo è giusto ══════════ */

/* il pezzo di terra rincara a ogni acquisto */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  const prezzi = []
  for (let i = 0; i < 6; i++) {
    prezzi.push(f.prezzoDellaProssima)
    let cella = null
    for (let x = 0; x < PIAZZOLE && !cella; x++)
      for (let y = 0; y < PIAZZOLE && !cella; y++)
        if (f.comprabile(x, y)) cella = [x, y]
    f.compraPiazzola(...cella)
  }
  nota('i primi sei prezzi della terra:', prezzi.join(', '))
  controlla('il prezzo della terra sale a ogni acquisto',
            prezzi.every((p, i) => i === 0 || p > prezzi[i - 1]))
}

/* Sgombrare COSTA E BASTA, per ogni tipo di ostacolo. Non è un dettaglio
   di bilanciamento: qui dentro non si guadagna, e il saldo che sale
   dopo uno sgombero è il segnale che è tornata la seconda fonte di
   monete che abbiamo tolto apposta. Si vedrebbe solo giocando. */
for (const [id, o] of Object.entries(OSTACOLI)) {
  const b = borsaTracciata(1000)
  const f = new Fattoria({ borsa: b })
  f.ostacoli = { [chiave(13, 13)]: id }         // un solo ostacolo di prova, dentro casa
  const r = f.sgombra(13, 13)
  controlla(`sgombrare "${id}" riesce`, r.ok)
  uguale(`sgombrare "${id}": costa quello che dice`, r.costo, o.costo)
  uguale(`sgombrare "${id}": il saldo scende del costo, e basta`, b.saldo(), 1000 - o.costo)
  controlla(`sgombrare "${id}" non regala niente`, r.resa === undefined && r.guadagno === undefined)
}

/* non si compra una piazzola che non tocca casa */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  const r = f.compraPiazzola(0, 0)               // angolo lontano dal quadrato di partenza
  uguale('un pezzo di terra staccato da casa non si compra', r.ok, false)
  uguale('e dice perché', r.motivo, 'non-si-tocca')
}

/* non si posa una cosa dove non ci sta: né fuori dal terreno... */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  const fuori = f.posa('albero', 0, 0)
  uguale('non si posa fuori dal terreno posseduto', fuori.ok, false)
  uguale('e dice perché', fuori.motivo, 'non-ci-sta')

  /* ...né sopra qualcosa che c'è già. La cosa se la mette il test: da
     quando la fattoria parte da un prato **vuoto**, non c'è nessun
     arredo di partenza su cui appoggiarsi. */
  const dove = f.cellaLibera(14, 14)
  const prima = f.posa('casetta', dove.x, dove.y)
  controlla('la casetta di prova si posa', prima.ok)
  const sopra = f.posa('albero', dove.x, dove.y)
  uguale('non si posa sopra qualcosa che c\'è già', sopra.ok, false)
  uguale('e dice perché', sopra.motivo, 'non-ci-sta')
}

/* rimettere una cosa dov'era è gratis, spostarla altrove costa */
{
  const b = borsaTracciata(50)
  const f = new Fattoria({ borsa: borsaInfinita() })
  const dove = f.cellaLibera(14, 14)
  const panchina = f.posa('panchina', dove.x, dove.y).cosa
  f.borsa = b                       // si paga solo da qui in poi
  const x0 = panchina.x, y0 = panchina.y

  const stessoPosto = f.posa('panchina', x0, y0, { sposta: panchina })
  controlla('rimetterla dov\'era riesce', stessoPosto.ok)
  uguale('e non costa niente', stessoPosto.costo, 0)
  uguale('il saldo non si muove', b.saldo(), 50)

  const altrove = f.cellaLibera(x0 + 4, y0)
  const spostata = f.posa('panchina', altrove.x, altrove.y, { sposta: panchina })
  controlla('spostarla altrove riesce', spostata.ok)
  uguale('e costa il prezzo dello spostamento', spostata.costo, COSTO_SPOSTARE)
  uguale('il saldo scende di quel poco', b.saldo(), 50 - COSTO_SPOSTARE)
}

/* quello che si mette via torna in magazzino e da lì si ripiazza gratis */
{
  const b = borsaTracciata(50)
  const f = new Fattoria({ borsa: borsaInfinita() })
  const q = f.cellaLibera(14, 14)
  const barile = f.posa('barile', q.x, q.y).cosa
  f.borsa = b                       // si paga solo da qui in poi

  const via = f.mettiVia(barile)
  controlla('mettere via riesce', via.ok)
  uguale('ora ce n\'è uno in magazzino', f.quantiNe('barile'), 1)
  uguale('e non è più in mappa', f.cose.includes(barile), false)

  const cella = f.cellaLibera(15, 15)
  const dalMagazzino = f.posa('barile', cella.x, cella.y)
  controlla('riposizionarlo dal magazzino riesce', dalMagazzino.ok)
  uguale('a costo zero', dalMagazzino.costo, 0)
  uguale('e viene proprio dal magazzino', dalMagazzino.dalMagazzino, true)
  uguale('il saldo non è cambiato', b.saldo(), 50)
  uguale('il magazzino torna vuoto', f.quantiNe('barile'), 0)
}

/* girare una cosa che non ci starebbe girata la lascia com'era */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  const s0 = f.cellaLibera(14, 14)
  const staccio = f.posa('staccio', s0.x, s0.y).cosa
  const primaG = staccio.g || 0
  /* la staccionata sdraiata è [2,1]; in piedi diventa [1,2] e occupa
     anche la cella sotto — la blocchiamo apposta */
  f.ostacoli[chiave(staccio.x, staccio.y + 1)] = 'sasso'

  const r = f.gira(staccio)
  uguale('girarla dove non ci sta più fallisce', r.ok, false)
  uguale('e l\'orientamento resta quello di prima', staccio.g || 0, primaG)
}

/* ══════════ 3. si gioca davvero ══════════ */
{
  const b = borsaTracciata(300)
  const f = new Fattoria({ borsa: b })

  const primaComprabile = () => {
    for (let x = 0; x < PIAZZOLE; x++)
      for (let y = 0; y < PIAZZOLE; y++)
        if (f.comprabile(x, y)) return [x, y]
    return null
  }
  const primoSgomberabile = () => {
    for (const k in f.ostacoli) {
      const [x, y] = k.split(',').map(Number)
      if (f.cellaMia(x, y) && b.saldo() >= f.ostacoloSotto(x, y).costo) return [x, y]
    }
    return null
  }

  let acquisti = 0, sgomberi = 0, azione = true
  while (azione) {
    azione = false
    if (b.saldo() >= f.prezzoDellaProssima) {
      const cella = primaComprabile()
      if (cella) { f.compraPiazzola(...cella); acquisti++; azione = true }
    }
    const ost = primoSgomberabile()
    if (ost) { f.sgombra(...ost); sgomberi++; azione = true }
  }
  nota(`giocatore finto: ${acquisti} piazzole comprate, ${sgomberi} pezzi di bosco sgomberati, ` +
       `saldo finale ${b.saldo()}`)
  controlla('ha comprato almeno una piazzola', acquisti > 0)
  controlla('ha sgombrato almeno un pezzo di bosco', sgomberi > 0)

  /* Il giocatore finto spende e non incassa mai: da quando sgombrare
     costa e basta, arriva a zero e lì si ferma. Gli si lascia qualche
     moneta apposta, se no la prova qui sotto — che si possa ancora
     posare qualcosa nella terra appena comprata — fallirebbe per il
     motivo sbagliato: non «non ci sta», ma «non ho più una lira». */
  b.regala(200)

  /* prova anche il percorso della posa, dentro la terra appena comprata */
  const nuovaCella = f.cellaLibera(PRIMA * 6 + 1, PRIMA * 6 + 1, 12)
  const posata = f.posa('albero', nuovaCella.x, nuovaCella.y)
  controlla('dopo l\'espansione si può ancora posare qualcosa', posata.ok)

  const sovrapposte = () => {
    for (let i = 0; i < f.cose.length; i++)
      for (let j = i + 1; j < f.cose.length; j++) {
        const a = f.ingombro(f.cose[i]), c = f.ingombro(f.cose[j])
        if (a.x < c.x + c.w && a.x + a.w > c.x && a.y < c.y + c.h && a.y + a.h > c.y) return true
      }
    return false
  }
  const fuoriTerreno = () => f.cose.some(c => {
    const g = f.ingombro(c)
    for (let i = 0; i < g.w; i++) for (let j = 0; j < g.h; j++)
      if (!f.cellaMia(g.x + i, g.y + j)) return true
    return false
  })
  controlla('nessuna cosa si sovrappone a un\'altra', !sovrapposte())
  controlla('nessuna cosa sta fuori dal terreno posseduto', !fuoriTerreno())

  /* serializzare e rileggere dà una fattoria identica */
  const dato = f.serializza()
  const f2 = new Fattoria({ dato })
  uguale('serializzare e rileggere dà la stessa fattoria',
         JSON.stringify(f2.serializza()), JSON.stringify(dato))
}

/* il bosco non è tirato a caso: due fattorie nuove hanno lo stesso bosco */
{
  const fa = new Fattoria()
  const fb = new Fattoria()
  uguale('due fattorie nuove hanno lo stesso bosco negli stessi posti',
         JSON.stringify(fa.ostacoli), JSON.stringify(fb.ostacoli))
}

/* il manifesto racconta la propria home senza esplodere */
controlla('riassunto() regge un profilo senza niente salvato',
          typeof manifesto.riassunto() === 'string')
controlla('riassunto() regge una fattoria salvata per davvero', typeof manifesto.riassunto({
  tappa: 0, libera: false, stelle: {},
  cfg: { stato: new Fattoria().serializza() },
}) === 'string')

/* ══════════ 4. i traguardi scattano ══════════ */
{
  const vuoto = { totals: {}, best: {}, items: {}, campagne: {} }
  const mVuoto = misure(vuoto)
  controlla('a profilo vuoto non se n\'è preso nessuno',
            manifesto.albo.traguardi.every(t => statoTraguardo(t, mVuoto).grado === 0))
  uguale('e il gioco non risulta provato', manifesto.albo.provato(mVuoto), false)
  uguale('e non vale esperienza', manifesto.albo.xp(mVuoto), 0)

  /* un bambino che ha comprato tanta terra, sgombrato tanto bosco e
     sistemato tante cose, ben oltre l'ultima soglia di ogni traguardo */
  const pieno = {
    totals: { fattoriaTerre: 40, fattoriaSgomberi: 60, fattoriaPosati: 130 },
    best: { fattoriaVarieta: 40 },
    items: {}, campagne: {},
  }
  const mPieno = misure(pieno)
  const presi = manifesto.albo.traguardi.map(t => statoTraguardo(t, mPieno))
  controlla('chi ha giocato tanto li prende tutti d\'oro', presi.every(s => s.finito),
            presi.filter(s => !s.finito).map(s => `${s.id} fermo a ${s.valore}`).join(' · '))
  controlla('e il gioco vale esperienza', manifesto.albo.xp(mPieno) > 0)
  controlla('e risulta provato', manifesto.albo.provato(mPieno) === true)
}

nota(`la fattoria parte con ${PIAZZOLE_INIZIALI} piazzole, su ${PIAZZOLE * PIAZZOLE} in tutto il mondo`)

riassunto('la fattoria')
