/* ═══════════════════════════════════════════════════════════════════
   LE TAPPE A DUE INGRESSI

   Sette tappe hanno più di una strada: due bocche in cima al campo —
   tre nell'ultima della Palude — altrettante file di mostri, e un
   castello solo. Non è una mappa più
   grande — è una difesa da dividere, ed è l'unica cosa che il gioco
   chiede quando non ha più operazioni nuove da insegnare.

   Le regole che questo test tiene, e che a occhio non si vedono:

     · le strade **non si fondono**: arrivano alla stessa porta da parti
       diverse, e fino a lì restano distinte. Se si unissero prima, si
       difenderebbe il tratto comune e gli ingressi non li guarderebbe
       più nessuno — una mappa a più bocche giocata come se ne avesse
       una;
     · le piazzole si spartiscono fra le strade e si occupano **a
       giro**, una per parte: se si riempisse una strada per volta, la
       prima torre difenderebbe metà campo e l'altra metà passerebbe
       senza vedere nessuno;
     · nessuna piazzola finisce addosso a un'altra dove le strade
       convergono;
     · da dove arriva l'ondata si sa **tre ondate prima**, se no
       spostare una torre è una carezza invece che una mossa.
   ═══════════════════════════════════════════════════════════════════ */
import { TAPPE, LIBERE, MONDO, CFG, ingressiDi, postiDi,
         PIAZZOLE_PER_INGRESSO, firmaEquilibrio } from '../../src/data/castello.js'
import { RACCONTO, LIBERE_RACCONTO } from '../../src/data/campagne-castello.js'
import { Percorso } from '../../src/motore/castello/percorso.js'
import { Ondate } from '../../src/motore/castello/ondate.js'
import { creaBattaglia } from '../../src/motore/battaglia.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const doppie = TAPPE.filter(t => ingressiDi(t) > 1)
const misure = { ...MONDO }

controlla('qualche tappa ha due ingressi', doppie.length >= 2)
nota('a più ingressi:', doppie.map(t => `${t.nome} (${ingressiDi(t)})`).join(' · '))
/* Anche le quattro partite libere, e qui c'era scritto il contrario:
   «la partita libera resta a una strada sola», per paura che con due
   bocche non si tarasse. Adesso ognuna si tara da sola, e le stesse
   regole delle tappe a due bocche — porta unica, piazzole su tutte le
   strade, una per strada le prime — valgono anche per loro. */
/* Tutte tranne una: il bastione è a **una bocca** e si attraversa da
   sé — l'anello vero, provato più sotto. Le due cose insieme non ci
   stanno, e la sua difesa si divide nel tempo invece che nello spazio. */
const libereDoppie = LIBERE.filter(l => !l.incroci)
const anelli = LIBERE.filter(l => l.incroci)
controlla('le partite libere senza anello hanno tutte più di una bocca',
          libereDoppie.every(l => ingressiDi(l) >= 2), LIBERE.map(l => `${l.nome} (${ingressiDi(l)})`).join(' · '))
uguale('e una sola ha l\'anello', anelli.map(l => l.chiave).join(), 'libera-mura')

for (const t of [...doppie, ...libereDoppie]) {
  const p = new Percorso(t.forme, t.posti, misure)
  const quante = p.quanteVie
  controlla(`${t.nome}: più di una strada (${quante})`, quante >= 2)

  /* la porta è una sola, comunque siano tante le strade */
  const fini = p.vie.map(v => v.fine)
  controlla(`${t.nome}: arrivano tutte allo stesso castello`,
            fini.every(f => Math.hypot(f.x - fini[0].x, f.y - fini[0].y) < 20))

  /* Le bocche o sono distinte e distanti, o sono **la stessa**: l'anello
     delle Isole parte da un ingresso solo e si sdoppia dopo. Quello che
     non va bene è la via di mezzo — due bocche a un palmo l'una
     dall'altra, che a schermo si leggono come una sbavata. */
  const inizi = p.vie.map(v => v.inizio.x).sort((a, b) => a - b)
  controlla(`${t.nome}: le bocche sono distanti o sono la stessa`,
            inizi.every((x, i) => i === 0 ||
                                  x - inizi[i - 1] > MONDO.W * 0.2 ||
                                  x - inizi[i - 1] < 2))

  /* le piazzole: spartite, alternate, e mai una sopra l'altra */
  const perVia = p.vie.map((_, k) => p.postazioni.filter(q => q.via === k).length)
  controlla(`${t.nome}: piazzole su tutte le strade (${perVia.join(' + ')})`,
            perVia.every(n => n >= 2))
  const prime = p.postazioni.slice(0, quante).map(q => q.via)
  controlla(`${t.nome}: le prime ${quante} torri vanno una per strada`,
            new Set(prime).size === quante)
  let minima = Infinity
  for (let i = 0; i < p.postazioni.length; i++)
    for (let k = i + 1; k < p.postazioni.length; k++)
      minima = Math.min(minima, Math.hypot(p.postazioni[i].x - p.postazioni[k].x,
                                           p.postazioni[i].y - p.postazioni[k].y))
  dentro(`${t.nome}: nessuna piazzola addosso a un'altra`, minima / MONDO.S, 33, 999)
}

/* ── l'anello vero: un mostro passa due volte dallo stesso punto ──
   Nel bastione la strada scende, fa un cappio e ripassa sopra sé
   stessa. Il motore non sa niente di incroci — un nemico ha un `d`
   scalare e `puntoA(d)` lo mette dove deve stare — quindi la prova è
   tutta geometria: esistono due `d` lontani fra loro (più di un
   raggio) in cui il nemico sta nello stesso punto, e c'è una piazzola
   che li vede tutti e due dentro il raggio dell'arciere. È il regalo
   del terreno, e senza questa prova un ritocco al tracciato lo
   toglierebbe senza che niente diventi rosso. */
for (const t of anelli) {
  const p = new Percorso(t.forme, t.posti, misure)
  uguale(`${t.nome}: una strada sola`, p.quanteVie, 1)
  const via = p.vie[0]
  const passo = 4 * MONDO.S
  const RAGGIO = 92 * MONDO.S             // l'arciere di livello 1 (`data/ops.js`)
  let incrocio = null
  for (let a = 0; a < via.lunghezza && !incrocio; a += passo)
    for (let b = a + RAGGIO; b < via.lunghezza; b += passo) {
      const P = via.puntoA(a), Q = via.puntoA(b)
      if (Math.hypot(P.x - Q.x, P.y - Q.y) < 6 * MONDO.S) { incrocio = { a, b, P }; break }
    }
  controlla(`${t.nome}: la strada ripassa sopra sé stessa`, !!incrocio)
  if (!incrocio) continue
  nota(`${t.nome}: l'incrocio a (${(incrocio.P.x / MONDO.W).toFixed(2)}, ` +
       `${(incrocio.P.y / MONDO.H).toFixed(2)}), a ${(incrocio.a / MONDO.S).toFixed(0)}u ` +
       `e a ${(incrocio.b / MONDO.S).toFixed(0)}u di cammino`)
  controlla(`${t.nome}: con più di un raggio di strada in mezzo`,
            incrocio.b - incrocio.a > RAGGIO)
  /* quante piazzole vedono tutti e due i passaggi: ce ne vuole almeno
     una, e `sbroglia` — che qui gira anche a strada singola — non deve
     averle scostate fuori tiro */
  const vedono = p.postazioni.filter(q => {
    const d = k => Math.hypot(q.x - via.puntoA(k).x, q.y - via.puntoA(k).y)
    return d(incrocio.a) <= RAGGIO && d(incrocio.b) <= RAGGIO
  })
  controlla(`${t.nome}: almeno una piazzola vede tutti e due i passaggi (${vedono.length})`,
            vedono.length >= 1)
  /* e il nemico ci passa davvero due volte: la stessa piazzola lo ha
     nel raggio in due tratti separati del suo cammino */
  const q = vedono[0] || p.postazioni[0]
  let tratti = 0, dentroPrima = false
  for (let d = 0; d <= via.lunghezza; d += passo) {
    const P = via.puntoA(d)
    const dentroOra = Math.hypot(q.x - P.x, q.y - P.y) <= RAGGIO
    if (dentroOra && !dentroPrima) tratti++
    dentroPrima = dentroOra
  }
  controlla(`${t.nome}: da quella piazzola il mostro entra nel raggio due volte (${tratti})`,
            tratti >= 2)
}

/* ── le piazzole in più ──
   Due strade vogliono dire una difesa divisa in due: se le piazzole
   restassero quelle di una tappa a un ingresso, ogni strada ne avrebbe
   la metà. */
for (const t of doppie) {
  const finta = { ...t, forme: undefined, forma: t.forme[0] }
  const extra = (ingressiDi(t) - 1) * PIAZZOLE_PER_INGRESSO
  uguale(`${t.nome}: ${extra} piazzole in più per gli ingressi oltre il primo`,
         postiDi(t) - postiDi(finta), extra)
}

/* ── da che parte arrivano ── */
{
  const t = doppie[0]
  const o = new Ondate(t)
  const lati = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => o.viaDi(n, 2))
  nota('le ondate di', t.nome, 'entrano da:',
       lati.map(v => (v < 0 ? '·tutte·' : v)).join(' '),
       `(insieme dalla ${o.daQuandoInsieme}ª)`)
  controlla('si alternano', lati[0] !== lati[1])
  /* le prime arrivano da una bocca per volta: con la difesa ancora
     bassa, dividerla in due vuol dire perdere per una ragione che non
     si vede */
  controlla('all\'inizio mai da tutte e due insieme',
            lati.slice(0, o.daQuandoInsieme - 1).every(v => v >= 0))
  controlla('poi ogni terza arriva da tutte e due',
            lati.some((v, i) => v === -1 && (i + 1) % 3 === 0))
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
  /* dritti alla prima ondata che arriva da tutte e due — che non è più
     la terza: chiamarle una per una vorrebbe dire aspettare ogni volta
     che il campo si pulisca */
  const quando = c.ondate.daQuandoInsieme
  const insieme = [quando, quando + 1, quando + 2].find(n => c.ondate.viaDi(n, 2) < 0)
  for (let n = 0; n < insieme; n++) c.nuovaOnda()
  // e si aspetta che ne siano usciti almeno un paio: escono a intervalli
  for (let i = 0; i < 80; i++) c.avanza(0.05)
  const divise = new Set(c.nemici.map(n => n.via))
  controlla('l\'ondata che entra da tutte e due si divide davvero', divise.size === 2)
  nota('all\'ondata 3 in campo ci sono nemici su', divise.size, 'strade')
}

/* ── e spostare costa ──
   Finché la strada era una sola era gratis: spostarsi voleva dire
   spostarsi lungo la stessa fila di mostri. Con due ingressi portare la
   torre giusta dalla parte giusta è la mossa che vince, e una mossa che
   vince si paga — poco, ma si paga. La regola sta nel motore, perché il
   prezzo dev'essere lo stesso che la torre l'abbia mossa un dito che
   trascina o un tocco sulla piazzola. */
{
  const b = creaBattaglia({ tappa: doppie[0], misure, stato: {} })
  b.inizia()
  const torre = b.costruisci('add', {})
  const dove = b.liberi()[0]
  const prima = b.tabellone.energia
  controlla('la torre si sposta su una piazzola libera', b.sposta(torre, dove))
  uguale('e costa quello che dice CFG', prima - b.tabellone.energia, CFG.spostamento)
  const posto = b.percorso.postazioni[dove]
  controlla('ed è arrivata davvero', Math.hypot(torre.x - posto.x, torre.y - posto.y) < 1)

  const tasche = b.tabellone.energia
  controlla('rimetterla dov\'è già non costa niente', b.sposta(torre, b.postoDi(torre)))
  uguale('e infatti non paga', b.tabellone.energia, tasche)
  const altra = b.costruisci('add', {})
  controlla('sulla piazzola di un\'altra torre non ci va',
            !b.sposta(torre, b.postoDi(altra)))
  b.tabellone.paga(b.tabellone.energia)      // tasche vuote
  const ferma = { x: torre.x, y: torre.y }
  controlla('e senza energia non si muove', !b.sposta(torre, b.liberi()[0]))
  controlla('resta dov\'era', torre.x === ferma.x && torre.y === ferma.y)
}

/* ── la firma della taratura vede anche queste strade ──
   Le vite dei nemici sono tarate su *quel* tracciato: quanta strada ogni
   torre tiene sotto tiro è il presidio che regge la difficoltà. La firma
   leggeva `forma` e basta, e le sette tappe con `forme` ci finivano come
   `null`: si poteva ridisegnare la palude da cima a fondo senza che
   nessun test chiedesse di ritarare. Si muove un punto vero — le spezzate
   arrivano in `RACCONTO` per riferimento, quindi la mutazione è la
   stessa che vedrebbe il gioco — e si rimette a posto subito dopo. */
for (const chiave of ['forme', 'fronti']) {
  const tappa = RACCONTO.find(t => t.forme && (chiave !== 'fronti' || t.fronti))
  const prima = firmaEquilibrio()
  if (chiave === 'forme') {
    const punto = tappa.forme[0][0]
    const era = punto[1]
    punto[1] = era + 0.01
    controlla('la firma cambia se si sposta un punto di una tappa a più bocche',
              firmaEquilibrio() !== prima, `${tappa.nome}: firma ferma a ${prima}`)
    punto[1] = era
  } else {
    const era = tappa.fronti
    tappa.fronti = era + 0.1
    controlla('la firma cambia se cambiano i fronti dichiarati',
              firmaEquilibrio() !== prima, `${tappa.nome}: firma ferma a ${prima}`)
    tappa.fronti = era
  }
  uguale(`e rimesso a posto torna quella di prima (${chiave})`, firmaEquilibrio(), prima)
}
/* e le libere, che sono tarate come le tappe: ridisegnarne una senza
   ritarare sarebbe lo stesso buco */
{
  const prima = firmaEquilibrio()
  const punto = LIBERE_RACCONTO[0].forme[1][1]
  const era = punto[0]
  punto[0] = era + 0.01
  controlla('la firma cambia se si sposta un punto di una partita libera',
            firmaEquilibrio() !== prima, `firma ferma a ${prima}`)
  punto[0] = era
  uguale('e rimesso a posto torna quella di prima (libera)', firmaEquilibrio(), prima)
}

riassunto('le tappe a due ingressi')
