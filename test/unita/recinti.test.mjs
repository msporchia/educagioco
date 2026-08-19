/* I recinti degli animali da cortile, senza browser e senza aspettare.

   Un recinto **non è una meccanica nuova**: è una macchina come il
   mulino — dài da mangiare, aspetta, ritira — e questo file esiste per
   difendere l'unica cosa che ha di suo, che è **il disegno che cambia da
   sé**. Sei ritratti per specie, e quello giusto lo sceglie il motore
   leggendo l'orologio.

   Perché serva un test dedicato: un ritratto sbagliato è **muto**.
   `drawImage` con un argomento non finito, per specifica, torna senza
   disegnare e senza lanciare, quindi un recinto che sbaglia stato non dà
   nessun errore — sparisce, in un certo momento della giornata e in
   nessun altro. È il tipo di guasto che si scopre giocando, cioè tardi,
   e che chi lo vede racconta come «a volte il pollaio non c'è».

   E difende la catena fino in fondo: il pane della fattoria è che tutto
   quello che esce da qualcosa entra in qualcos'altro, e la lana è il
   primo prodotto che non finisce in una ciotola ma addosso a un cane.
   `node test/esegui.mjs recinti --niente-build` */
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'
import { PER_ID, statiDi } from '../../src/giochi/fattoria/dati/catalogo.js'
import { PEZZI } from '../../src/giochi/fattoria/dati/atlante.js'
import { RICETTE, PER_RICETTA, COLTURE, PRODOTTI, MINUTO, SILI }
  from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { COCCOLE } from '../../src/giochi/fattoria/dati/bisogni.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const T0 = 1770000000000            // un'ora qualunque, fissa: niente Date.now()
const fra = minuti => T0 + minuti * MINUTO

const borsaTracciata = iniziale => {
  let n = iniziale
  return { quante: () => n, paga: c => { n -= c; return true }, saldo: () => n }
}

/* Una fattoria coi due silos già in piedi e già larghi. Senza, la roba
   non entra e non esce — la capienza di un silo che non c'è è zero — e
   ogni prova qui sotto morirebbe sulla stessa riga per un motivo che
   coi recinti non c'entra niente. I silos hanno il loro test, in
   `unita/coltivazioni`. */
function conSilos(f, larghi = 4) {
  /* e **cresciuta**: i recinti si sbloccano coi livelli
     (`dati/livelli.js`), e qui si provano i recinti */
  f.speso = 100000
  f.cose.push({ i: 990, id: SILI.terra.cosa, g: 0, x: 30, y: 30 },
              { i: 991, id: SILI.stalla.cosa, g: 0, x: 33, y: 30 })
  f.silos = { terra: larghi, stalla: larghi }
  return f
}

const RECINTI = Object.values(PER_ID).filter(v => v.stati)
/* Gli stati che il motore può davvero far vedere: in mappa un recinto o
   ha fame, o sta facendo, o è pronto.

   `fame` e `calmo` sono **lo stesso disegno**, ed è voluto: il ritratto
   di chi ha fame era un disegno a parte col fumetto dipinto dentro, e
   quel fumetto non poteva dire il vero — cosa mangia un recinto sta
   nelle ricette, e le ricette cambiano. Adesso il fumetto lo disegna la
   scena con la merce vera, e sotto resta la faccia calma, che nei
   cinque disegni era comunque la stessa. Il conto qui sotto tiene
   perché guarda **quali pezzi escono**, non quanti stati ci sono. */
const IN_MAPPA = ['fame', 'mangia', 'felice', 'dorme', 'pronto']

/* ══════════ 1. i sei ritratti ci sono tutti ══════════ */
controlla('ci sono dei recinti in catalogo', RECINTI.length > 0)

for (const v of RECINTI) {
  stessaLista(`${v.id}: gli stati sono quelli attesi`,
    Object.keys(v.stati).sort(),
    ['calmo', 'dorme', 'fame', 'felice', 'mangia', 'pronto'])
  for (const [quale, pezzo] of Object.entries(v.stati))
    controlla(`${v.id}/${quale} è nell'atlante`, !!PEZZI[pezzo])
  /* Il ritratto del baule dev'essere uno di quelli: se fosse un disegno
     a parte, si comprerebbe una cosa e in mappa ne comparirebbe
     un'altra — e nessuno collegherebbe le due. */
  controlla(`${v.id}: il ritratto del baule è uno dei suoi stati`,
            Object.values(v.stati).includes(v.pezzo))
  controlla(`${v.id}: è una macchina`, !!v.macchina)
  controlla(`${v.id}: ha almeno una ricetta`,
            RICETTE.some(r => r.dove === v.macchina))
  /* Un recinto è largo quattro celle e ne occupa tre: con due, l'ultima
     fila di staccionata resterebbe calpestabile e il cane ci passerebbe
     attraverso — che è il guasto per cui i recinti esistono. */
  uguale(`${v.id}: il piede è 4×3`, v.piede.join('×'), '4×3')
}
nota(`${RECINTI.length} recinti: ${RECINTI.map(v => v.nome.toLowerCase()).join(', ')}`)

/* ══════════ 2. il giro intero, dal pollaio vuoto all'uovo ══════════
   Si gioca per davvero, spostando l'orologio: è l'unico modo di provare
   in un millisecondo una cosa che in gioco dura un quarto d'ora. */
{
  const b = borsaTracciata(1000)
  const f = conSilos(new Fattoria({ borsa: b }))
  const pollaio = { i: 900, id: 'pollaio', g: 0, x: 14, y: 14 }
  f.cose.push(pollaio)

  const r = PER_RICETTA.uova
  uguale('il pollaio fa le uova', r.dove, 'pollaio')
  /* Quello che mangia **non si scrive qui**: le galline hanno mangiato
     grano finché in mezzo alla catena non è arrivato il fienile, e un
     ingrediente cablato in un test lo si scopre rosso mesi dopo per una
     ragione che col pollaio non c'entra. */
  const [mangia, quanto] = Object.entries(r.prende)[0]

  /* fermo, e quindi affamato */
  const a0 = f.aspettoDellaCosa(pollaio, T0)
  uguale('un recinto fermo si vede che ha fame', a0.invece, statiDi(pollaio).fame)
  uguale('e non chiede di raccogliere niente', a0.fumetto, null)
  /* Il fumetto di chi ha fame **non è dipinto dentro lo sprite**: dice
     la merce vera, e la dice il motore. Era un disegno per specie, e
     mucche e pecore che vogliono la stessa cosa la mostravano con due
     figure diverse. */
  uguale('e dice cosa vuole', (a0.vuole || {}).prodotto, mangia)

  /* senza granaio non si parte, e non si paga niente */
  const saldo = b.saldo()
  const niente = f.avvia(pollaio, 'uova', T0)
  uguale('senza mangime non si avvia', niente.ok, false)
  uguale('e dice cosa manca', niente.motivo, 'manca-roba')
  uguale('senza togliere monete', b.saldo(), saldo)

  f.metti(mangia, quanto)
  const via = f.avvia(pollaio, 'uova', T0)
  controlla('col mangime in granaio si parte', via.ok)
  uguale('e il mangime se ne va tutto', f.quantoHo(mangia), 0)

  /* i tre stati del lavoro, in ordine, e ognuno una volta sola */
  const visti = [0.1, 0.5, 0.9].map(q =>
    f.aspettoDellaCosa(pollaio, fra(r.minuti * q)).invece)
  stessaLista('mentre lavora passa da mangia a felice a dorme', visti,
    ['mangia', 'felice', 'dorme'].map(q => statiDi(pollaio)[q]))

  const finito = f.aspettoDellaCosa(pollaio, fra(r.minuti + 1))
  uguale('finito, si vede che è pronto', finito.invece, statiDi(pollaio).pronto)
  uguale('e chiede di essere raccolto', finito.fumetto, '🧺')

  const preso = f.ritira(pollaio, fra(r.minuti + 1))
  controlla('e si ritira', preso.ok)
  uguale('le uova finiscono in granaio', f.quantoHo('uova'), r.resa)
  uguale('e il pollaio torna ad avere fame',
         f.aspettoDellaCosa(pollaio, fra(r.minuti + 2)).invece, statiDi(pollaio).fame)
}

/* ══════════ 3. ogni stato è raggiungibile, per ogni recinto ══════════
   Un ritratto che non si vede mai è un disegno pagato e non usato, e
   soprattutto è il segno che una soglia è scritta storta. Si guarda
   specie per specie perché le ricette hanno tempi diversi, e una soglia
   giusta a dodici minuti può non esserlo a trenta. */
for (const v of RECINTI) {
  const r = RICETTE.find(x => x.dove === v.macchina)
  const b = borsaTracciata(1000)
  const f = conSilos(new Fattoria({ borsa: b }))
  const cosa = { i: 1, id: v.id, g: 0, x: 14, y: 14 }
  f.cose.push(cosa)
  for (const [k, n] of Object.entries(r.prende)) f.metti(k, n)
  controlla(`${v.id}: parte`, f.avvia(cosa, r.id, T0).ok)

  const usciti = new Set()
  /* un giro fitto: si guarda ogni ventesimo del lavoro, così una fascia
     stretta non passa inosservata */
  for (let i = 0; i <= 20; i++)
    usciti.add(f.aspettoDellaCosa(cosa, fra(r.minuti * i / 20)).invece)
  usciti.add(f.aspettoDellaCosa(cosa, fra(r.minuti * 2)).invece)
  /* «fame» si rivede solo dopo aver ritirato: mentre lavora non torna */
  f.ritira(cosa, fra(r.minuti * 2))
  usciti.add(f.aspettoDellaCosa(cosa, fra(r.minuti * 2)).invece)

  stessaLista(`${v.id}: si vedono tutti e cinque gli stati di mappa`,
    [...usciti].sort(), IN_MAPPA.map(q => v.stati[q]).sort())
}

/* ══════════ 4. la lana non si mangia: si mette addosso ══════════
   Il primo prodotto della catena che non passa dalla pancia. Vale come
   prova del giro intero — recinto → granaio → bestia — e come prova che
   una coccola si può pagare con la roba, che è la regola nuova. */
{
  const copertina = COCCOLE.find(c => c.da === 'lana')
  controlla('esiste una coccola che si paga con la lana', !!copertina)
  uguale('e non costa monete', copertina.prezzo, 0)

  const b = borsaTracciata(1000)
  const f = conSilos(new Fattoria({ borsa: b }))
  f.compraBestia('cane-beagle', 90, 'Birba')
  f.stato('cane-beagle').pelo = 0.2
  const saldo = b.saldo()

  const senza = f.coccola('cane-beagle', copertina)
  uguale('senza lana non si fa', senza.ok, false)
  uguale('e dice che manca la roba, non le monete', senza.motivo, 'manca-roba')
  uguale('e il pelo è rimasto dov\'era', f.stato('cane-beagle').pelo, 0.2)

  f.metti('lana', 2)
  const si = f.coccola('cane-beagle', copertina)
  controlla('con la lana in granaio si fa', si.ok)
  uguale('senza spendere monete', b.saldo(), saldo)
  uguale('e il granaio si scala di uno', f.quantoHo('lana'), 1)
  controlla('e il pelo è salito', f.stato('cane-beagle').pelo > 0.2)
}

/* ══════════ 5. un recinto al lavoro non si mette via ══════════
   Stessa regola del campo seminato, e per lo stesso motivo: nel baule
   non c'è posto per una mucca a metà mungitura, e metterlo via vorrebbe
   dire buttare quello che si sta aspettando. */
{
  const f = conSilos(new Fattoria({ borsa: borsaTracciata(1000) }))
  const cosa = { i: 1, id: 'pollaio', g: 0, x: 14, y: 14 }
  f.cose.push(cosa)
  controlla('fermo si mette via', f.mettiVia(cosa).ok)
  f.cose.push(cosa)
  for (const [k, n] of Object.entries(PER_RICETTA.uova.prende)) f.metti(k, n)
  f.avvia(cosa, 'uova', T0)
  const no = f.mettiVia(cosa)
  uguale('al lavoro no', no.ok, false)
  uguale('e dice perché', no.motivo, 'sta-lavorando')
}

/* ══════════ 6. la catena intera: campo → fienile → recinto ══════════
   Il giro che il fienile ha allungato, giocato per davvero e senza
   saltare passaggi: si semina, si raccoglie, si macina, si dà da
   mangiare, si ritira. Prima era campo → recinto, e questo pezzo di
   test non poteva esistere.

   Nessun ingrediente è scritto a mano: si legge dalle ricette. Un test
   che ricopia la tabella prova che la tabella è uguale a sé stessa. */
{
  const f = conSilos(new Fattoria({ borsa: borsaTracciata(1000) }), 6)
  const conigliera = { i: 700, id: 'conigliera', g: 0, x: 14, y: 14 }
  const fienile = { i: 701, id: 'fienile', g: 0, x: 20, y: 14 }
  const campo = { i: 702, id: 'orto', g: 0, x: 26, y: 14 }
  f.cose.push(conigliera, fienile, campo)

  const finale = RICETTE.find(r => r.dove === 'conigliera')
  const [mangime] = Object.keys(finale.prende)
  const mezzo = RICETTE.find(r => r.da === mangime && r.dove === 'fienile')
  controlla('il mangime del recinto lo fa il fienile', !!mezzo)
  const [terra] = Object.keys(mezzo.prende)
  const coltura = COLTURE.find(c => c.da === terra)
  controlla('e quello che il fienile prende cresce in un campo', !!coltura)
  nota(`la catena: ${coltura.emoji} ${coltura.nome} → ${mezzo.emoji} ${mezzo.nome}` +
       ` → ${finale.emoji} ${finale.nome}`)

  /* il campo, quante volte serve per riempire una macinata */
  let quando = T0
  while (f.quantoHo(terra) < mezzo.prende[terra]) {
    controlla('si semina', f.seminaCampo(campo, coltura.id, quando).ok)
    quando += coltura.minuti * MINUTO + 1
    controlla('e si raccoglie', f.raccogli(campo, quando).ok)
  }
  controlla('il fienile parte', f.avvia(fienile, mezzo.id, quando).ok)
  quando += mezzo.minuti * MINUTO + 1
  controlla('e rende il mangime', f.ritira(fienile, quando).ok)
  uguale(`e il mangime è in granaio`, f.quantoHo(mangime), mezzo.resa)

  /* la merce che il recinto aspetta è **quella**, e lo dice al fumetto */
  uguale('il recinto chiede proprio quello che il fienile ha fatto',
         (f.aspettoDellaCosa(conigliera, quando).vuole || {}).prodotto, mangime)

  controlla('il recinto parte', f.avvia(conigliera, finale.id, quando).ok)
  quando += finale.minuti * MINUTO + 1
  controlla('e rende la sua roba', f.ritira(conigliera, quando).ok)
  uguale('che finisce in granaio', f.quantoHo(finale.da), finale.resa)
}

/* ══════════ 7. il fumetto di chi ha fame ══════════
   Non è più dipinto dentro lo sprite: la scena lo disegna, e dentro ci
   mette **una faccia già decisa dal motore**. Un pezzo che l'atlante
   non ha sarebbe muto — `drawImage` torna senza disegnare e senza
   lanciare — quindi il fumetto resterebbe vuoto sopra una bestia che
   ha fame, che è peggio di nessun fumetto. */
for (const v of RECINTI) {
  const f = conSilos(new Fattoria({ borsa: borsaTracciata(1000) }))
  const cosa = { i: 1, id: v.id, g: 0, x: 14, y: 14 }
  f.cose.push(cosa)
  const a = f.aspettoDellaCosa(cosa, T0)
  controlla(`${v.id}: fermo, dice cosa vuole`, !!(a && a.vuole))
  const faccia = (a || {}).vuole || {}
  controlla(`${v.id}: e quella merce esiste`, !!PRODOTTI[faccia.prodotto])
  controlla(`${v.id}: col suo disegno, o almeno con un'emoji`,
            (faccia.pezzo ? !!PEZZI[faccia.pezzo] : !!faccia.testo))
  /* Al lavoro il fumetto non c'è: chiederebbe da mangiare a chi sta
     già mangiando, e sopra la testa ci sono già gli stati del disegno. */
  for (const [k, n] of Object.entries(RICETTE.find(r => r.dove === v.macchina).prende))
    f.metti(k, n)
  f.avvia(cosa, RICETTE.find(r => r.dove === v.macchina).id, T0)
  uguale(`${v.id}: al lavoro non chiede più niente`,
         f.aspettoDellaCosa(cosa, T0 + MINUTO).vuole, null)
}

riassunto('i recinti del cortile')
