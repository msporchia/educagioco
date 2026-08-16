/* Verifica della Fattoria, senza browser. Le cose che contano: i dati
   stanno in piedi, il calcolo economico è quello giusto (il rincaro della
   terra, il costo secco dello sgombero, il gratis di rimettere una cosa
   dov'era),
   un giocatore finto compra e sgombera finché può senza lasciare il mondo
   incoerente, e i traguardi scattano solo a chi ha davvero giocato.
   `node test/esegui.mjs fattoria --niente-build` */
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import { Camminatore } from '../../src/giochi/fattoria/motore/camminata.js'
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

/* ══════════ 5. chi cammina non attraversa le case ══════════
   È il genere di guasto che si vede solo a schermo, e tardi: il cane
   che passa dentro il muro non fa niente di sbagliato secondo nessun
   conto, semplicemente non lo si controllava. Qui si controlla la
   cella (`calpestabile`) e la passeggiata vera (`Camminatore`), che
   sono le due metà della stessa cosa.

   Le celle 12..29 sono quelle delle piazzole di partenza, e lì dentro
   il bosco non nasce: quello che c'è in mezzo ce lo mette il test. */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  controlla('la casa di prova si posa', f.posa('casa', 14, 14).ok)   // piede [5,2]

  let dentro = 0
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++)
    if (f.calpestabile(14 + i, 14 + j)) dentro++
  uguale('nessuna cella della casa è calpestabile', dentro, 0)
  controlla('il prato intorno sì', f.calpestabile(13, 14) && f.calpestabile(16, 16))

  /* Quello che il catalogo dichiara `sotto` è terreno, non oggetto: ci
     si cammina sopra, e non ci si posa sopra un'altra cosa. */
  controlla('l\'orto di prova si posa', f.posa('orto', 20, 20).ok)
  controlla('sull\'orto ci si cammina', f.calpestabile(20, 20))
  uguale('ma non ci si posa sopra dell\'altro', f.libera(20, 20, 1, 1), false)

  /* L'acqua non è un oggetto e ferma lo stesso. */
  controlla('l\'acqua si dipinge', f.dipingiAcqua(24, 24).ok)
  uguale('sull\'acqua non si cammina', f.calpestabile(24, 24), false)
  controlla('un ostacolo del bosco ferma anche lui',
            (f.ostacoli[chiave(26, 26)] = 'sasso') && !f.calpestabile(26, 26))
}

/* Una staccionata girata blocca ALTRE celle: l'ingombro va chiesto a
   `piedeDi()`, che sa di che verso è, e non alla voce del catalogo —
   che dice sempre [2,1]. Sbagliando, il cane passa attraverso il palo
   e si ferma su un pezzo di prato che sembra vuoto. */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  const s = f.posa('staccio', 15, 15).cosa
  controlla('sdraiata occupa le due celle in fila',
            !f.calpestabile(15, 15) && !f.calpestabile(16, 15))
  controlla('e non quella sotto', f.calpestabile(15, 16))

  controlla('si gira', f.gira(s).ok)
  controlla('in piedi occupa le due celle in colonna',
            !f.calpestabile(15, 15) && !f.calpestabile(15, 16))
  controlla('e non più quella accanto', f.calpestabile(16, 15))
}

/* Il cane con una casa in mezzo alla strada: la aggira, e non c'entra
   mai — prima ci passava dritto attraverso, perché la meta era una
   riga tirata in linea d'aria. */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  controlla('la casa di traverso si posa', f.posa('casa', 14, 16).ok)   // 14..18 × 16..17
  const buona = (x, y) => f.calpestabile(x, y)
  const cane = new Camminatore(16, 14, { velocita: 3.4 })

  controlla('la strada dall\'altra parte della casa c\'è', cane.vaiA(16, 19, buona))
  let dentro = 0, giri = 0
  while (cane.cammina && giri++ < 400) {
    cane.muovi(0.05, buona)
    const c = cane.cella
    if (!buona(c.x, c.y)) dentro++
  }
  uguale('non ha mai messo il piede dentro la casa', dentro, 0)
  uguale('ed è arrivato dall\'altra parte',
         JSON.stringify(cane.cella), JSON.stringify({ x: 16, y: 19 }))
}

/* Una meta dove non si arriva non fa camminare nessuno dentro i muri:
   si resta fermi. Lo stagno è chiuso, quindi non c'è nemmeno una cella
   accanto a cui accostarsi. */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  for (let x = 20; x <= 22; x++) for (let y = 20; y <= 22; y++) f.dipingiAcqua(x, y)
  const buona = (x, y) => f.calpestabile(x, y)
  const cane = new Camminatore(15, 15, {})
  const partenza = JSON.stringify(cane.cella)

  uguale('una meta chiusa nell\'acqua non si accetta', cane.vaiA(21, 21, buona), false)
  for (let i = 0; i < 40; i++) cane.muovi(0.1, buona)
  uguale('e chi cammina resta dov\'era', JSON.stringify(cane.cella), partenza)

  /* Sul bordo dello stagno invece ci si accosta: chiedere di andare
     sull'acqua non deve sembrare un tocco andato perso. */
  const bordo = new Camminatore(15, 20, {})
  controlla('la riva si raggiunge accostandosi', bordo.vaiA(20, 20, buona))
  for (let i = 0; i < 200 && bordo.cammina; i++) bordo.muovi(0.05, buona)
  controlla('e si finisce su una cella dove si può stare',
            buona(bordo.cella.x, bordo.cella.y))
}

/* Chi vaga per il prato per conto suo si sceglie le mete da sé: la
   regola stava dentro il disegno e conosceva solo «è terra mia». */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  f.posa('casa', 13, 13); f.posa('casa', 13, 17); f.posa('fontana', 20, 15)
  const buona = (x, y) => f.calpestabile(x, y)
  /* il caso arriva da fuori: una passeggiata si rifà identica */
  let seme = 12345
  const sorte = () => { seme = (seme * 1103515245 + 12345) % 2147483648; return seme / 2147483648 }
  const cane = new Camminatore(19, 19, { velocita: 2.4, vaga: 0.4, sorte })

  let male = 0, camminati = 0
  for (let i = 0; i < 600; i++) {
    cane.muovi(0.05, buona)
    if (cane.cammina) camminati++
    const c = cane.cella
    if (!buona(c.x, c.y)) male++
  }
  uguale('chi vaga da sé non finisce mai dentro una casa', male, 0)
  controlla('e vaga davvero, non resta fermo', camminati > 50, `passi: ${camminati}`)
}

/* Non si fa comparire un animale sopra una fontana. */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  controlla('la fontana di prova si posa', f.posa('fontana', 15, 15).ok)   // [3,2]
  const dove = f.cellaLibera(16, 15)
  controlla('chi nasce lì nasce su una cella dove si può stare',
            f.calpestabile(dove.x, dove.y), `${dove.x},${dove.y}`)
}

nota(`la fattoria parte con ${PIAZZOLE_INIZIALI} piazzole, su ${PIAZZOLE * PIAZZOLE} in tutto il mondo`)

riassunto('la fattoria')
