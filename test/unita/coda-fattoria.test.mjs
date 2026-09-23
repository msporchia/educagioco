/* ═══════════════════════════════════════════════════════════════════
   LA FILA NELLE MACCHINE, SENZA BROWSER

   Una macchina lavora un pezzo alla volta e ne tiene altri in fila
   (`dati/coda.js`, `docs/fattoria-albero.md` §8.4). Qui si gioca la fila
   per davvero, con l'orologio in mano: si carica, si chiude il gioco e
   si riapre più tardi, si toglie un pezzo, si ritira a silo pieno, si
   rilegge un salvataggio di prima che la fila esistesse.

   Le cose da non rompere, una per blocco:
     · i pezzi escono **in ordine**, uno dopo l'altro, e il secondo parte
       quando il primo finisce — anche a pagina chiusa;
     · togliere un pezzo non partito **rende tutto**, e chi veniva dopo
       si fa avanti;
     · un silo pieno ferma il ritiro, **non la macchina**;
     · un `lavoro` di ieri si legge come una fila di uno;
     · i posti si comprano a 🪙30 · 50 · 80, e non si perdono passando
       dal baule.

   Nessun numero di ricetta è scritto a mano: si legge dalle tabelle.
   `node test/esegui.mjs coda --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'
import { PER_RICETTA, PRODOTTI, MINUTO, SILI } from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { statiDi } from '../../src/giochi/fattoria/dati/catalogo.js'
import { POSTI_DI_PARTENZA, POSTI_MASSIMI, PREZZI_DELLA_FILA, postiDellaFila,
         prezzoDellaFila, guastiDellaFila } from '../../src/giochi/fattoria/dati/coda.js'
import { alberoDi } from '../../src/giochi/fattoria/dati/albero.js'
import { sogliaDi } from '../../src/giochi/fattoria/dati/livelli.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const T0 = 1770000000000            // un'ora qualunque, fissa: niente Date.now()
const fra = minuti => T0 + minuti * MINUTO

const borsaTracciata = iniziale => {
  let n = iniziale
  return { quante: () => n, paga: c => { n -= c; return true }, saldo: () => n }
}

const MANGIME = PER_RICETTA.mangime
const M = MANGIME.minuti
const GRANO = MANGIME.prende.grano

/* Una fattoria cresciuta coi due silos larghi, un mulino e un pollaio.
   Il livello si mette spendendo per finta, e i premi si prendono tutti:
   qui si prova la fila, non gli sblocchi. */
function fattoria(monete = 1000, larghi = 4) {
  const b = borsaTracciata(monete)
  const f = new Fattoria({ borsa: b })
  f.speso = 100000
  f.reclamaTutto()
  const mulino = { i: 901, id: 'mulino', g: 0, x: 14, y: 17 }
  const pollaio = { i: 902, id: 'pollaio', g: 0, x: 20, y: 20 }
  f.cose.push(mulino, pollaio,
    { i: 903, id: SILI.terra.cosa, g: 0, x: 18, y: 14 },
    { i: 904, id: SILI.stalla.cosa, g: 0, x: 20, y: 14 })
  f.silos = { ...f.silos, terra: larghi, stalla: larghi }
  return { f, b, mulino, pollaio }
}

/* ══════════ 1. i numeri della fila stanno in piedi ══════════ */
{
  const g = guastiDellaFila()
  uguale('la fila non ha guasti', g.join(' · '), '')
  uguale('si parte con tre posti', postiDellaFila(0), 3)
  uguale('e si arriva a sei', postiDellaFila(PREZZI_DELLA_FILA.length), POSTI_MASSIMI)
  stessaLista('a 🪙30 · 50 · 80', PREZZI_DELLA_FILA, [30, 50, 80])
  uguale('al tetto non c\'è un prossimo prezzo', prezzoDellaFila(3), null)
  uguale('un numero storto da un salvataggio non regala posti', postiDellaFila(99), POSTI_MASSIMI)
  uguale('né ne toglie', postiDellaFila(-4), POSTI_DI_PARTENZA)
}

/* ══════════ 2. in fila, e in ordine ══════════
   Tre mangimi caricati insieme: la roba e le monete se ne vanno subito,
   come prima all'avvio; il primo parte adesso, gli altri alla fine di
   chi gli sta davanti; il quarto non ci sta. */
{
  const { f, b, mulino } = fattoria()
  f.metti('grano', GRANO * 4)
  const saldo = b.saldo()
  const messi = [0, 1, 2].map(() => f.avvia(mulino, 'mangime', T0))
  controlla('tre pezzi entrano in fila', messi.every(r => r.ok), messi.map(r => r.motivo).join())
  stessaLista('ognuno parte alla fine di chi gli sta davanti',
              messi.map(r => r.da), [T0, fra(M), fra(2 * M)])
  uguale('il primo parte subito, gli altri no', messi.map(r => r.subito).join(), 'true,false,false')
  uguale('la roba se ne va mettendo in fila', f.quantoHo('grano'), GRANO)
  uguale('e le monete pure', b.saldo(), saldo - 3 * MANGIME.costo)

  const pieno = f.avvia(mulino, 'mangime', T0)
  uguale('il quarto non ci sta', pieno.motivo, 'fila-piena')
  uguale('e non prende niente', f.quantoHo('grano'), GRANO)

  const s = f.statoMacchina(mulino, fra(1))
  uguale('uno lavora', !!s.lavora, true)
  uguale('due aspettano', s.inAttesa, 2)
  uguale('nessun posto libero', s.liberi, 0)
  uguale('e la macchina non è libera', s.libera, false)
  uguale('quello che lavora è il primo messo', s.lavora.i, 0)
}

/* ══════════ 3. a pagina chiusa ══════════
   Nessuno tocca niente per un'ora: il tempo si legge dall'ora, e il
   secondo è partito quando il primo ha finito. Lo stesso dopo un giro
   nel salvataggio, che è quello che succede davvero chiudendo il gioco. */
{
  const { f, mulino } = fattoria()
  f.metti('grano', GRANO * 3)
  for (let k = 0; k < 3; k++) f.avvia(mulino, 'mangime', T0)
  const riaperta = new Fattoria({ dato: JSON.parse(JSON.stringify(f.serializza())) })
  const m2 = riaperta.cose.find(c => c.i === mulino.i)

  const dopoUno = riaperta.statoMacchina(m2, fra(M + 1))
  uguale('dopo il primo giro uno è pronto', dopoUno.pronti, 1)
  uguale('e il secondo sta già lavorando', dopoUno.lavora && dopoUno.lavora.i, 1)
  controlla('ed è avanti di un minuto, non fermo a zero',
            dopoUno.lavora.quanto > 0 && dopoUno.lavora.quanto < 1)
  uguale('il terzo aspetta ancora', dopoUno.inAttesa, 1)

  const dopoTutti = riaperta.statoMacchina(m2, fra(3 * M))
  uguale('a tre giri sono pronti tutti e tre', dopoTutti.pronti, 3)
  uguale('e nessuno lavora più', dopoTutti.lavora, null)

  const preso = riaperta.ritira(m2, fra(60))
  controlla('si ritira tutto insieme', preso.ok)
  uguale('tre mangimi nel silo', riaperta.quantoHo('mangime'), 3 * MANGIME.resa)
  uguale('niente resta sulla macchina', preso.restano, 0)
  uguale('e il mulino è di nuovo vuoto', riaperta.statoMacchina(m2, fra(60)).ferma, true)
  uguale('senza la fila nel salvataggio', m2.coda, undefined)
}

/* ══════════ 4. togliere dalla fila rende tutto ══════════ */
{
  const { f, b, mulino } = fattoria()
  f.metti('grano', GRANO * 3)
  for (let k = 0; k < 3; k++) f.avvia(mulino, 'mangime', T0)
  const saldo = b.saldo(), speso = f.speso, grano = f.quantoHo('grano')

  uguale('quello che lavora non si toglie',
         f.togliDallaFila(mulino, 0, fra(1)).motivo, 'sta-lavorando')
  const via = f.togliDallaFila(mulino, 1, fra(1))
  controlla('quello in attesa sì', via.ok, via.motivo)
  uguale('torna il grano', f.quantoHo('grano'), grano + GRANO)
  uguale('tornano le monete', b.saldo(), saldo + MANGIME.costo)
  uguale('e l\'esperienza che avevano dato: mettere e togliere non fa salire',
         f.speso, speso - MANGIME.costo)
  const s = f.statoMacchina(mulino, fra(1))
  uguale('restano due pezzi', s.coda.length, 2)
  uguale('e quello dopo si è fatto avanti: parte alla fine del primo',
         s.coda[1].da, fra(M))
  uguale('si toglie per posto, e il posto non c\'è più',
         f.togliDallaFila(mulino, 5, fra(1)).motivo, 'non-in-fila')

  /* Pronto non si toglie: si ritira. */
  uguale('uno pronto non si toglie', f.togliDallaFila(mulino, 0, fra(M)).motivo, 'e-pronto')

  /* Il livello non scende mai: se mettere in fila l'aveva fatto
     salire, togliere rende le monete ma non lo riporta giù. */
  const { f: g, b: gb, mulino: m } = fattoria()
  const L = g.livello - 1
  g.speso = sogliaDi(L + 1) - MANGIME.costo
  uguale('un soffio sotto il livello dopo', g.livello, L)
  g.metti('grano', GRANO * 2)
  g.avvia(m, 'mangime', T0)
  g.avvia(m, 'mangime', T0)
  uguale('il secondo pezzo in fila fa salire', g.livello, L + 1)
  const prima = gb.saldo()
  g.togliDallaFila(m, 1, fra(1))
  uguale('toglierlo rende le monete', gb.saldo(), prima + MANGIME.costo)
  uguale('ma il livello non torna indietro', g.livello, L + 1)
}

/* ══════════ 5. il silo pieno ferma il ritiro, non la macchina ══════════
   Tre pezzi pronti e posto per uno: se ne prende uno, gli altri
   aspettano sulla macchina. E una macchina coi pronti che non entrano
   continua a lavorare quello che ha in fila. */
{
  const { f, mulino } = fattoria(1000, 0)
  const fam = PRODOTTI.mangime.silo
  const cap = f.capienzaDi(fam)
  f.metti('grano', GRANO * 3)
  for (let k = 0; k < 3; k++) f.avvia(mulino, 'mangime', T0)
  /* il mangime va nel silo della stalla: lo si riempie fin quasi al tetto */
  f.metti('mangime', f.quantoCiSta('mangime') - MANGIME.resa)
  const tutti = fra(3 * M)
  uguale('tre pronti', f.statoMacchina(mulino, tutti).pronti, 3)
  const parziale = f.ritira(mulino, tutti)
  controlla('si ritira quello che ci sta', parziale.ok, parziale.motivo)
  uguale('cioè uno', parziale.quanto, MANGIME.resa)
  uguale('gli altri due restano sulla macchina', parziale.restano, 2)
  uguale('e dice perché', parziale.motivo, 'silo-pieno')
  uguale('il silo è colmo', f.quantoCiSta('mangime'), 0)
  const ancora = f.ritira(mulino, tutti)
  uguale('a silo colmo non si ritira', ancora.ok, false)
  uguale('e il motivo è il silo', ancora.motivo, 'silo-pieno')
  uguale('niente si è perso', f.statoMacchina(mulino, tutti).pronti, 2)

  /* Coi due pronti fermi c'è ancora un posto: si carica, e il pezzo
     nuovo lavora lo stesso. La macchina non si è fermata. */
  f.metti('grano', GRANO)
  const dopo = f.avvia(mulino, 'mangime', tutti)
  controlla('col silo pieno si mette ancora in fila', dopo.ok, dopo.motivo)
  uguale('e parte subito: i pronti non fanno aspettare nessuno', dopo.da, tutti)
  uguale('e finisce', f.statoMacchina(mulino, tutti + M * MINUTO).pronti, 3)
  nota(`silo «${fam}» a zero ingrandimenti: ${cap} posti per merce`)
}

/* ══════════ 6. il salvataggio di prima della fila ══════════
   `lavoro: { ricetta, da }` si legge come una fila di uno: un mulino che
   stava macinando ieri continua a macinare, e niente si perde. */
{
  const { f, mulino } = fattoria()
  const dato = JSON.parse(JSON.stringify(f.serializza()))
  const vecchio = dato.cose.find(c => c.i === mulino.i)
  vecchio.lavoro = { ricetta: 'mangime', da: T0 }
  const g = new Fattoria({ dato })
  const m = g.cose.find(c => c.i === mulino.i)
  uguale('il lavoro di ieri è una fila di uno', m.coda.length, 1)
  uguale('con la sua ricetta', m.coda[0].ricetta, 'mangime')
  uguale('e la sua ora', m.coda[0].da, T0)
  uguale('il nome di prima non resta addosso', m.lavoro, undefined)
  uguale('sta ancora lavorando', !!g.statoMacchina(m, fra(1)).lavora, true)
  const preso = g.ritira(m, fra(M))
  controlla('e finisce, e si ritira', preso.ok, preso.motivo)
  uguale('il mangime è nel silo', g.quantoHo('mangime'), MANGIME.resa)

  /* Una ricetta sparita si scorda, come una coltura sparita. */
  vecchio.lavoro = { ricetta: 'polvere-di-stelle', da: T0 }
  const h = new Fattoria({ dato })
  uguale('una ricetta che non esiste più lascia la macchina vuota',
         h.statoMacchina(h.cose.find(c => c.i === mulino.i), T0).ferma, true)

  /* E la fila di oggi fa il giro intero. */
  f.metti('grano', GRANO * 2)
  f.avvia(mulino, 'mangime', T0)
  f.avvia(mulino, 'mangime', T0)
  f.ingrandisciLaFila(mulino)
  const k = new Fattoria({ dato: JSON.parse(JSON.stringify(f.serializza())) })
  const m3 = k.cose.find(c => c.i === mulino.i)
  stessaLista('la fila si rilegge com\'era', m3.coda.map(p => p.da), [T0, fra(M)])
  uguale('e anche i posti comprati', k.statoMacchina(m3, T0).posti, POSTI_DI_PARTENZA + 1)
}

/* ══════════ 7. ingrandire la fila ══════════ */
{
  const { f, b, mulino } = fattoria(200)
  const pagati = []
  for (let k = 0; k < PREZZI_DELLA_FILA.length; k++) {
    const saldo = b.saldo()
    const r = f.ingrandisciLaFila(mulino)
    controlla(`ingrandimento ${k + 1}`, r.ok, r.motivo)
    pagati.push(saldo - b.saldo())
  }
  stessaLista('si paga 30, 50, 80', pagati, PREZZI_DELLA_FILA)
  uguale('e i posti sono sei', f.statoMacchina(mulino, T0).posti, POSTI_MASSIMI)
  uguale('oltre non si va', f.ingrandisciLaFila(mulino).motivo, 'al-massimo')
  uguale('e il foglio non ha più un prezzo da dire', f.statoMacchina(mulino, T0).prezzoFila, null)

  f.metti('grano', GRANO * POSTI_MASSIMI)
  let dentro = 0
  while (f.avvia(mulino, 'mangime', T0).ok) dentro++
  uguale('ci stanno sei pezzi', dentro, POSTI_MASSIMI)

  /* Per macchina: il secondo mulino nasce coi suoi tre. */
  const altro = { i: 950, id: 'mulino', g: 0, x: 24, y: 24 }
  f.cose.push(altro)
  uguale('un altro mulino ha la fila sua', f.statoMacchina(altro, T0).posti, POSTI_DI_PARTENZA)

  /* Senza monete non si ingrandisce, e non si paga niente. */
  const { f: g, b: poca, mulino: m } = fattoria(10)
  const r = g.ingrandisciLaFila(m)
  uguale('con poche monete no', r.motivo, 'poche-monete')
  uguale('dice quanto costa', r.costo, PREZZI_DELLA_FILA[0])
  uguale('e non ha preso niente', poca.saldo(), 10)
}

/* ══════════ 8. i posti comprati non si perdono passando dal baule ══════════
   Nel baule una macchina è un numero: la fila lunga si tiene da parte e
   torna con la prima che si rimette giù. */
{
  const { f, mulino } = fattoria()
  f.ingrandisciLaFila(mulino)
  f.ingrandisciLaFila(mulino)
  f.metti('grano', GRANO)
  f.avvia(mulino, 'mangime', T0)
  uguale('con roba in fila non si mette via', f.mettiVia(mulino).motivo, 'sta-lavorando')
  f.ritira(mulino, fra(M))
  controlla('vuoto sì', f.mettiVia(mulino).ok)
  const giu = f.posa('mulino', 24, 14)
  controlla('e si rimette giù dal baule', giu.ok && giu.dalMagazzino, giu.motivo)
  uguale('con la sua fila lunga', f.statoMacchina(giu.cosa, T0).posti, POSTI_DI_PARTENZA + 2)
  const g = new Fattoria({ dato: JSON.parse(JSON.stringify(f.serializza())) })
  uguale('e il baule non si ricorda più niente da restituire',
         Object.keys(g.fileRiposte).length, 0)
}

/* ══════════ 9. cosa vede chi disegna ══════════
   La faccia di quello che sta facendo, più il numerino dei pronti. Il
   recinto cambia ritratto come prima, guardando chi lavora adesso. */
{
  const { f, mulino, pollaio } = fattoria()
  f.metti('grano', GRANO * 2)
  f.avvia(mulino, 'mangime', T0)
  f.avvia(mulino, 'mangime', T0)
  const a = f.aspettoDellaCosa(mulino, fra(M + 1))
  uguale('lavorando col primo pronto dice cosa sta facendo', (a.fa || {}).prodotto, 'mangime')
  uguale('e quanti ne sono pronti', a.pronti, 1)
  const fine = f.aspettoDellaCosa(mulino, fra(2 * M))
  uguale('finito tutto, il cestino', fine.fumetto, '🧺')
  uguale('col numero', fine.pronti, 2)

  const uova = PER_RICETTA.uova
  for (const [k, n] of Object.entries(uova.prende)) f.metti(k, n * 2)
  f.avvia(pollaio, 'uova', T0)
  f.avvia(pollaio, 'uova', T0)
  const r = f.aspettoDellaCosa(pollaio, fra(uova.minuti + 0.1 * uova.minuti))
  uguale('un recinto con un uovo pronto e un\'altra pappa davanti sta mangiando',
         r.invece, statiDi(pollaio).mangia)
  uguale('e il cestino dice che c\'è da ritirare', r.fumetto, '🧺')
  uguale('uno', r.pronti, 1)
  uguale('finito tutto, il ritratto del pronto',
         f.aspettoDellaCosa(pollaio, fra(3 * uova.minuti)).invece, statiDi(pollaio).pronto)
}

/* ══════════ 10. l'albero dice quanti ne fa ══════════ */
{
  const { f, mulino } = fattoria()
  f.metti('grano', GRANO * 2)
  f.avvia(mulino, 'mangime', T0)
  f.avvia(mulino, 'mangime', T0)
  const a = alberoDi(f, 'mangime', fra(1))
  uguale('col mulino che ne fa due, la riga lavora', a.via.macchina.stato, 'lavora')
  uguale('e dice quanti', a.via.macchina.ne, 2)
  uguale('e fra quanto esce il primo', a.via.macchina.manca, M - 1)

  /* Pieno di altro: la riga dice che la fila è piena. */
  const { f: g, mulino: m } = fattoria()
  const pastone = PER_RICETTA.pastone
  for (const [k, n] of Object.entries(pastone.prende)) g.metti(k, n * POSTI_DI_PARTENZA)
  while (g.avvia(m, 'pastone', T0).ok);
  const b = alberoDi(g, 'mangime', fra(1))
  uguale('pieno di pastone, per il mangime la fila è piena', b.via.macchina.piena, true)
  uguale('e non ne fa nessuno', b.via.macchina.ne, 0)
}

riassunto('la fila nelle macchine')
