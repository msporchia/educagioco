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
  guastiDelMondo, MARGINE, PIAZZOLE_INIZIALI, PRIMA, COSTO_SPOSTARE, chiave,
  LIMITI_VECCHI,
} from '../../src/giochi/fattoria/dati/mondo.js'
import { guastiDelCatalogo, CATALOGO, PER_ID, piedeDi, assettoDi, quantiVersi,
         puoGirare, puoSpecchiare } from '../../src/giochi/fattoria/dati/catalogo.js'
import { VOCI } from '../../src/giochi/fattoria/dati/atlante.js'

/* Se il disegno di questa voce regge il capovolgimento. Sta nel test e
   non nel catalogo perché al gioco non serve saperlo — al gioco serve
   solo la lista dei giri leciti, che è quello che il catalogo rende. */
const ribaltabile = v => {
  const voce = VOCI.find(x => Object.values(x.pose || {}).flat().includes(v.pezzo))
  return v.ribalta != null ? v.ribalta : (voce || {}).ribalta !== false
}
import { guastiDegliOstacoli, OSTACOLI } from '../../src/giochi/fattoria/dati/ostacoli.js'
import { guastiDeiBisogni, CIBI, COCCOLE, cibiPer } from '../../src/giochi/fattoria/dati/bisogni.js'
import { guastiDegliAnimali, famigliaDi, IN_VENDITA } from '../../src/giochi/fattoria/dati/animali.js'
import manifesto from '../../src/giochi/fattoria/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { misure, statoTraguardo } from '../../src/store/progressi.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* Una borsa che tiene davvero il conto, per provare che le monete si
   muovono come devono — `borsaInfinita()` del motore serve a isolare le
   regole di posizione da quelle di prezzo, qui serve il contrario. */
function borsaTracciata(iniziale) {
  let n = iniziale
  return { quante: () => n, paga: c => { n -= c; return true }, saldo: () => n,
           regala: c => { n += c } }
}

/* Una fattoria **cresciuta**: il livello apre le cose a poco a poco
   (`dati/livelli.js`), e quasi tutto quello che si prova qui — posare
   una panchina, spostare una casetta — arriva dal livello 9 in su. Gli
   sblocchi hanno il loro file (`unita/livelli-fattoria`): qui si
   provano posa, prezzi e magazzino, e una fattoria appena nata li
   rifiuterebbe tutti dicendo una cosa vera che non c'entra. */
/* E coi premi **già presi**: da quando i premi di un livello si vanno
   a prendere a mano (`dati/livelli.js`), alzare la spesa apre soltanto
   il diritto di prenderli. Chi qui prova a posare una panchina della
   panchina non deve sapere niente. */
const cresciuta = (opzioni = {}) => {
  const f = new Fattoria(opzioni)
  f.speso = 100000
  return f.reclamaTutto()
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
const guastiB = guastiDeiBisogni()
controlla('i bisogni non hanno guasti', guastiB.length === 0, guastiB.join(' · '))
const guastiA = guastiDegliAnimali()
controlla('gli animali non hanno guasti', guastiA.length === 0, guastiA.join(' · '))

/* Il primo pezzo di terra comprabile, cercato nel mondo di adesso: il
   mondo non è più una costante, quindi non si può scrivere un numero. */
function primaComprabile(f) {
  for (let x = f.limiti.x0; x <= f.limiti.x1; x++)
    for (let y = f.limiti.y0; y <= f.limiti.y1; y++)
      if (f.comprabile(x, y)) return [x, y]
  return null
}

/* ══════════ 2. il calcolo è giusto ══════════ */

/* il pezzo di terra rincara a ogni acquisto */
{
  const f = cresciuta({ borsa: borsaInfinita() })
  const prezzi = []
  for (let i = 0; i < 6; i++) {
    prezzi.push(f.prezzoDellaProssima)
    f.compraPiazzola(...primaComprabile(f))
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
  const f = cresciuta({ borsa: b })
  f.ostacoli = { [chiave(13, 13)]: id }         // un solo ostacolo di prova, dentro casa
  const r = f.sgombra(13, 13)
  controlla(`sgombrare "${id}" riesce`, r.ok)
  uguale(`sgombrare "${id}": costa quello che dice`, r.costo, o.costo)
  uguale(`sgombrare "${id}": il saldo scende del costo, e basta`, b.saldo(), 1000 - o.costo)
  controlla(`sgombrare "${id}" non regala niente`, r.resa === undefined && r.guadagno === undefined)
}

/* non si compra una piazzola che non tocca casa */
{
  const f = cresciuta({ borsa: borsaInfinita() })
  const r = f.compraPiazzola(0, 0)               // angolo lontano dal quadrato di partenza
  uguale('un pezzo di terra staccato da casa non si compra', r.ok, false)
  uguale('e dice perché', r.motivo, 'non-si-tocca')
}

/* non si posa una cosa dove non ci sta: né fuori dal terreno... */
{
  const f = cresciuta({ borsa: borsaInfinita() })
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
  const f = cresciuta({ borsa: borsaInfinita() })
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
  const f = cresciuta({ borsa: borsaInfinita() })
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
  const f = cresciuta({ borsa: borsaInfinita() })
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
  const f = cresciuta({ borsa: b })

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
      const cella = primaComprabile(f)
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
    totals: { fattoriaTerre: 40, fattoriaSgomberi: 60, fattoriaPosati: 130,
              fattoriaRaccolti: 50, fattoriaRitiri: 20 },
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
  const f = cresciuta({ borsa: borsaInfinita() })
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
  const f = cresciuta({ borsa: borsaInfinita() })
  const s = f.posa('staccio', 15, 15).cosa
  controlla('sdraiata occupa le due celle in fila',
            !f.calpestabile(15, 15) && !f.calpestabile(16, 15))
  controlla('e non quella sotto', f.calpestabile(15, 16))

  controlla('si gira', f.gira(s).ok)
  controlla('in piedi occupa le due celle in colonna',
            !f.calpestabile(15, 15) && !f.calpestabile(15, 16))
  controlla('e non più quella accanto', f.calpestabile(16, 15))
}

/* ═══════════ girare per davvero, e rovesciare ═══════════
   La staccionata qui sopra gira perché il foglio ha *due disegni*. Una
   siepe no: il foglio ne ha uno solo, e girarla è un `ctx.rotate` a
   schermo — lecito perché il suo foglietto dichiara che è disegnata a
   piombo dall'alto (`trasforma` in `sorgenti/gfx/Overworld.json`, che
   `atlante.py` porta dentro `VOCI`). Le due strade arrivano allo stesso
   posto, e il motore non deve saperle distinguere: chiede quanti versi
   ha una cosa e li fa scorrere. */
{
  const f = cresciuta({ borsa: borsaInfinita() })
  const siepe = PER_ID.siepe
  /* Due versi e non quattro, ed è la cosa che si sbaglia: una siepe si
     corica ma **non si ribalta**. Ha un filo d'ombra sotto, e a mezzo
     giro ce l'ha in cima — sta a gambe per aria. Uno stagno invece è
     disegnato a piombo davvero e i quattro versi li regge tutti. */
  uguale('la siepe si corica, quindi ha due versi', quantiVersi(siepe), 2)
  uguale('uno stagno è piatto davvero, e ne ha quattro', quantiVersi(PER_ID.stagno), 4)
  uguale('una casa ne ha due, e sono due disegni', quantiVersi(PER_ID.casa), 2)
  uguale('un fienile non gira affatto', quantiVersi(PER_ID.fienile), 1)

  const s = f.posa('siepe', 15, 15).cosa
  stessaLista('sdraiata è larga due e profonda una', piedeDi(s), [2, 1])
  controlla('gira', f.gira(s).ok)
  stessaLista('un quarto di giro le scambia il piede', piedeDi(s), [1, 2])
  controlla('e le celle che blocca lo seguono',
            !f.calpestabile(15, 16) && f.calpestabile(16, 15))
  controlla('gira ancora', f.gira(s).ok)
  uguale('e al secondo giro torna sdraiata, senza passare per il capovolto', s.g, 0)
  stessaLista('col piede di partenza', piedeDi(s), [2, 1])

  /* Il controllo che vale per tutte: nessuna cosa del catalogo deve
     poter arrivare a un mezzo giro se il suo disegno non lo regge. È il
     difetto che nessun altro controllo trova, perché un pezzo capovolto
     è formalmente ineccepibile — solo, è a testa in giù. */
  const capovolte = []
  for (const v of CATALOGO) {
    if (v.vedute || !puoGirare(v)) continue
    const suoi = []
    for (let g = 0; g < quantiVersi(v); g++) suoi.push(assettoDi({ id: v.id, g }).giro)
    if (!ribaltabile(v) && suoi.some(q => q === 2 || q === 3)) capovolte.push(v.id)
    if (new Set(suoi).size !== suoi.length) capovolte.push(v.id + ' (verso doppio)')
  }
  controlla('nessuna cosa che non si ribalta arriva a mezzo giro',
            capovolte.length === 0, capovolte.join(' · '))

  /* Girato non ci sta: si dice di no e si resta com'era. Un rifiuto che
     lascia la cosa girata a metà sarebbe peggio del rifiuto. */
  const stretto = f.posa('siepe', 20, 20).cosa
  f.posa('siepe', 20, 21)
  uguale('la siepe sotto occupa la cella che servirebbe', f.gira(stretto).motivo, 'non-ci-sta')
  uguale('e quella che non ha girato è rimasta com\'era', stretto.g, 0)
}

/* Lo specchio è l'altra metà, e non è la stessa cosa: non tocca
   l'ingombro, quindi non può mai fallire per posto. È quello che
   risolve il fastidio vero — la porta del fienile dal lato sbagliato —
   e per questo lo regge quasi tutto quello che sta in catalogo. */
{
  const f = cresciuta({ borsa: borsaInfinita() })
  const casa = f.posa('fienile', 15, 15).cosa
  const prima = piedeDi(casa)

  controlla('un fienile si rovescia anche se non gira', puoSpecchiare(PER_ID.fienile))
  controlla('e il motore lo fa', f.specchia(casa).ok)
  uguale('adesso è rovesciato', casa.m, 1)
  stessaLista('ma occupa esattamente le stesse celle', piedeDi(casa), prima)
  controlla('premere di nuovo lo rimette com\'era', f.specchia(casa).ok)
  uguale('e non lascia in giro un campo a zero', casa.m, undefined)

  /* L'eccezione, e vale la pena di averla: sul cartello c'è una parola
     dipinta, e allo specchio la parola si legge al contrario. È l'unico
     difetto della specchiatura che non si può guardare e perdonare. */
  controlla('un cartello scritto non si specchia', !puoSpecchiare(PER_ID.cartello_grano))
  const c = f.posa('cartello_grano', 18, 18).cosa
  uguale('e il motore lo rifiuta', f.specchia(c).motivo, 'non-si-specchia')
  uguale('senza scrivergli niente addosso', c.m, undefined)
}

/* Il verso e lo specchio devono sopravvivere a una chiusura del gioco:
   una fattoria sistemata che si riapre tutta dritta è peggio di una che
   non si poteva sistemare. */
{
  const f = cresciuta({ borsa: borsaInfinita() })
  const s = f.posa('siepe', 15, 15).cosa
  f.gira(s); f.specchia(s)
  const dopo = new Fattoria({ dato: JSON.parse(JSON.stringify(f.serializza())) })
  const rilette = dopo.cose.find(c => c.id === 'siepe')
  uguale('il verso torna dal salvataggio', rilette.g, 1)
  uguale('e lo specchio pure', rilette.m, 1)
  const dritta = dopo.cose.find(c => c.id !== 'siepe')
  if (dritta) uguale('chi non è rovesciato non si porta dietro un campo', dritta.m, undefined)
}

/* Il cane con una casa in mezzo alla strada: la aggira, e non c'entra
   mai — prima ci passava dritto attraverso, perché la meta era una
   riga tirata in linea d'aria. */
{
  const f = cresciuta({ borsa: borsaInfinita() })
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
  const f = cresciuta({ borsa: borsaInfinita() })
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
  const f = cresciuta({ borsa: borsaInfinita() })
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
  const f = cresciuta({ borsa: borsaInfinita() })
  controlla('la fontana di prova si posa', f.posa('fontana', 15, 15).ok)   // [3,2]
  const dove = f.cellaLibera(16, 15)
  controlla('chi nasce lì nasce su una cella dove si può stare',
            f.calpestabile(dove.x, dove.y), `${dove.x},${dove.y}`)
}

/* ══════════ 6. il mondo si allarga da sé ══════════
   Non è un mondo infinito e non è un mondo di sette piazzole: la regola
   è che di lato ci siano sempre almeno due pezzi da comprare. Si vede
   solo giocando fino al bordo — cioè mai, a mano. */
{
  const f = cresciuta({ borsa: borsaInfinita() })

  /* Quante piazzole comprabili ci sono oltre ogni lato della terra
     posseduta: il margine di cui parla la regola. */
  const margini = () => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const k of Object.keys(f.piazzole)) {
      const [x, y] = k.split(',').map(Number)
      x0 = Math.min(x0, x); y0 = Math.min(y0, y)
      x1 = Math.max(x1, x); y1 = Math.max(y1, y)
    }
    return [x0 - f.limiti.x0, y0 - f.limiti.y0, f.limiti.x1 - x1, f.limiti.y1 - y1]
  }

  uguale('appena nata, il mondo è quello di sempre: 7×7',
         `${f.limiti.x1 - f.limiti.x0 + 1}×${f.limiti.y1 - f.limiti.y0 + 1}`, '7×7')

  const bosco0 = { ...f.ostacoli }
  let cresciute = 0
  for (let i = 0; i < 40; i++) {
    const cella = primaComprabile(f)
    controlla(`al giro ${i} c'è ancora terra da comprare`, !!cella)
    if (!cella) break
    if (f.compraPiazzola(...cella).cresciuto) cresciute++
    const m = margini()
    controlla(`dopo ${i + 1} acquisti il margine resta di almeno ${MARGINE} per lato`,
              m.every(n => n >= MARGINE), `margini: ${m.join(', ')}`)
  }
  nota(`comprando 40 pezzi il mondo è cresciuto ${cresciute} volte, ` +
       `fino a ${f.limiti.x1 - f.limiti.x0 + 1} piazzole per lato`)
  controlla('comprando verso un lato il mondo è cresciuto davvero', cresciute > 0)

  /* Il bosco già visto non si sposta: crescere semina solo la terra
     nuova. Se rigenerasse tutto, un albero sgomberato ricrescerebbe e
     gli altri cambierebbero posto sotto gli occhi. */
  const spostati = Object.keys(bosco0).filter(k => f.ostacoli[k] !== bosco0[k])
  uguale('crescendo, nessun albero di prima ha cambiato posto o tipo', spostati.length, 0)
  controlla('e nella terra nuova il bosco c\'è', Object.keys(f.ostacoli).length > Object.keys(bosco0).length)

  /* Le coordinate non si rinumerano: crescendo verso l'alto e verso
     sinistra si va sotto zero, ed è la condizione perché il bosco resti
     dov'era. */
  controlla('il mondo cresce anche nel quadrante negativo',
            f.limiti.x0 < 0 || f.limiti.y0 < 0, JSON.stringify(f.limiti))
  const negativa = Object.keys(f.piazzole).map(k => k.split(',').map(Number))
    .find(([x, y]) => x < 0 || y < 0)
  if (negativa) {
    const [px, py] = negativa
    controlla('una piazzola dalle coordinate negative è terra tua a tutti gli effetti',
              f.cellaMia(px * 6 + 1, py * 6 + 1), `piazzola ${px},${py}`)
    uguale('e la cella accanto, oltre il bordo, non lo è',
           f.cellaMia((f.limiti.x0 - 1) * 6, py * 6), false)
  }
}

/* Una fattoria salvata quando il mondo era 7×7 fisso si rilegge, cresce
   e **non si ritrova il bosco ricresciuto** dove era stato sgomberato.
   È il salvataggio di un bambino che ha già giocato: se si rompe qui, si
   rompe una sera dopo aver pubblicato. */
{
  const vecchia = cresciuta({ borsa: borsaInfinita() })
  const dato = vecchia.serializza()
  delete dato.limiti                     // com'era prima che i limiti esistessero

  /* si sgombera un pezzo di bosco, e da lì in poi non deve tornare */
  const sgomberato = Object.keys(dato.ostacoli)[0]
  delete dato.ostacoli[sgomberato]

  const f = cresciuta({ borsa: borsaInfinita(), dato })
  uguale('un salvataggio senza limiti riparte dal mondo di allora',
         JSON.stringify(f.limiti), JSON.stringify(LIMITI_VECCHI))
  uguale('e il bosco sgomberato non è ricresciuto', f.ostacoli[sgomberato], undefined)
  uguale('la terra è quella di prima', Object.keys(f.piazzole).length,
         Object.keys(vecchia.piazzole).length)

  /* comprando, cresce come una fattoria nuova */
  const prima = { ...f.limiti }
  for (let i = 0; i < 4; i++) f.compraPiazzola(...primaComprabile(f))
  controlla('e da lì in poi il mondo cresce come per tutti',
            f.limiti.x1 > prima.x1 || f.limiti.x0 < prima.x0 ||
            f.limiti.y1 > prima.y1 || f.limiti.y0 < prima.y0)
  uguale('il pezzo sgomberato resta sgomberato anche dopo che il mondo è cresciuto',
         f.ostacoli[sgomberato], undefined)
}

/* ══════════ 7. le bestie si spostano, e restano dove le metti ══════════
   È la cosa che si scorda: senza salvare dove sta, quello che la bambina
   aveva chiuso nel recinto se ne esce da solo durante la notte. */
{
  const f = cresciuta({ borsa: borsaInfinita() })
  const chi = 'cane-beagle'
  const r = f.compraBestia(chi, 90, 'Birba', { x: 14, y: 14 })
  controlla('il cane si compra', r.ok)
  uguale('e nasce dove gli è stato detto', `${r.bestia.x},${r.bestia.y}`, '14,14')

  const s = f.spostaBestia(chi, 20, 20)
  controlla('spostarlo riesce', s.ok)
  uguale('e non costa niente: una bestia si sposta da sé, farla pagare sarebbe una beffa',
         s.costo, 0)
  uguale('adesso sta lì', `${f.laBestia(chi).x},${f.laBestia(chi).y}`, '20,20')

  controlla('dentro una casa non ci si posa', f.posa('casa', 24, 24).ok)
  uguale('e infatti spostarlo dentro la casa non riesce', f.spostaBestia(chi, 25, 24).ok, false)
  uguale('ed è rimasto dov\'era', `${f.laBestia(chi).x},${f.laBestia(chi).y}`, '20,20')

  /* riaprendo, il cane è dove l'avevamo lasciato */
  const f2 = new Fattoria({ dato: f.serializza() })
  uguale('salvata e riaperta, la bestia è ancora al suo posto',
         JSON.stringify(f2.dovEra(chi)), JSON.stringify({ x: 20, y: 20 }))

  /* una bestia salvata prima che si potesse spostare non ha coordinate:
     ne prende una buona invece di sparire */
  const antica = new Fattoria({ dato: { ...f.serializza(), bestie: [{ chi, nome: 'Birba' }] } })
  const dove = antica.dovEra(chi)
  controlla('una bestia salvata senza posizione ne trova una dove si può stare',
            antica.calpestabile(dove.x, dove.y), JSON.stringify(dove))
}

/* ══════════ 8. ogni bestia ha i suoi cibi ══════════
   Il tipo di bestia conta: il cibo sbagliato si rifiuta e **non si
   paga**. Un bambino che sbaglia ciotola impara una cosa, non perde
   sedici monete. */
{
  const b = borsaTracciata(200)
  const f = cresciuta({ borsa: b })
  f.compraBestia('pappagallo', 120, 'Coco')
  const saldo = b.saldo()

  const suoi = cibiPer('pappagallo')
  const altrui = CIBI.filter(c => !c.per.includes('pappagallo'))
  controlla('il pappagallo ha almeno due cibi suoi', suoi.length >= 2)

  const no = f.nutri('pappagallo', altrui[0])
  uguale(`il pappagallo rifiuta «${altrui[0].nome}»`, no.ok, false)
  uguale('e dice perché', no.motivo, 'non-gli-piace')
  uguale('e non ha pagato niente', b.saldo(), saldo)

  const primaPancia = f.stato('pappagallo').pancia
  const si = f.nutri('pappagallo', suoi[0])
  controlla(`e mangia «${suoi[0].nome}»`, si.ok)
  uguale('pagandolo', b.saldo(), saldo - suoi[0].prezzo)
  controlla('e la pancia sale', f.stato('pappagallo').pancia > primaPancia)

  /* Nessuna bestia in vendita deve restare senza ciotola: una tabella
     dimenticata a schermo sembra un guasto del gioco. */
  for (const a of IN_VENDITA)
    controlla(`${a.nome} ha dei cibi suoi`, cibiPer(famigliaDi(a.chi)).length >= 2)
}

/* **Ogni gesto costa una monetina**, e nessuno è gratis. *Ribalta la
   regola di prima* («spazzolare resta gratis, chi è a zero deve poter
   comunque toccare il suo cane»): un gesto gratis in mezzo a gesti che
   costano non si legge come un regalo, si legge come quello che si
   preme sempre. La conseguenza è accettata e sta scritta in
   `dati/bisogni.js`: a zero monete col proprio animale non si fa
   niente, e si fa un esercizio. */
{
  const gioca = COCCOLE.find(c => c.id === 'gioca')
  const spazzola = COCCOLE.find(c => c.id === 'spazzola')
  uguale('giocare costa una monetina', gioca.prezzo, 1)
  uguale('e spazzolare pure', spazzola.prezzo, 1)
  controlla('nessuna coccola è gratis', COCCOLE.every(c => c.da || c.prezzo > 0))

  const b = borsaTracciata(1)
  const f = cresciuta({ borsa: borsaInfinita() })
  f.compraBestia('cane-beagle', 90, 'Birba')
  f.stato('cane-beagle').gioco = 0.2
  f.stato('cane-beagle').pelo = 0.2
  f.borsa = b

  const primo = f.coccola('cane-beagle', gioca)
  controlla('con una moneta in tasca si gioca', primo.ok)
  uguale('e la moneta se n\'è andata', b.saldo(), 0)

  f.stato('cane-beagle').gioco = 0.2
  const secondo = f.coccola('cane-beagle', gioca)
  uguale('a zero monete non si gioca più', secondo.ok, false)
  uguale('e dice perché', secondo.motivo, 'poche-monete')
  uguale('e nemmeno spazzolarlo', f.coccola('cane-beagle', spazzola).ok, false)
  /* Ma non si perde niente e non si rompe niente: la bestia sta al
     fondo (0,15) e aspetta il primo esercizio fatto. */
  controlla('la bestia sta comunque sopra il fondo',
            f.stato('cane-beagle').pelo >= 0.15)
}

nota(`la fattoria parte con ${PIAZZOLE_INIZIALI} piazzole, ` +
     `e il mondo tiene ${MARGINE} piazzole di margine per lato`)

riassunto('la fattoria')
