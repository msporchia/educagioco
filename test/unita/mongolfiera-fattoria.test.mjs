/* LA MONGOLFIERA DELLA FATTORIA, SENZA BROWSER

   Le cose che questo file difende (`docs/fattoria-albero.md` §8.3):
     1. **si chiede solo roba lavorata e ottenibile adesso** — due fasi
        o più, una merce diversa per fila, controllato a ogni livello
        da quando la mongolfiera arriva;
     2. **le casse restano piccole**: 2–3 per fila, 1–3 pezzi per cassa;
     3. **ogni cassa rende subito**, una fila piena un quarto in più,
        tutto pieno la metà in più e una sorpresa — mai monete;
     4. **la sorpresa è una che non si ha**, finché ce n'è, e non si
        compra da nessun'altra parte;
     5. **«Parti!» a metà non toglie niente**, e il cielo resta vuoto
        un'ora;
     6. **al 66 il pallone è più grande**;
     7. **una fattoria di ieri si riapre senza rompersi**.
   `node test/esegui.mjs mongolfiera --niente-build` */
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import {
  SORPRESE, mongolfieraIn, merciDaCassa, componiLaMongolfiera, aggiornaLaMongolfiera,
  caricaLaCassa, parti, minutiAlProssimo, qualcosaDaCaricare, naveDi, aTerra,
  scegliLaSorpresa,
} from '../../src/giochi/fattoria/motore/mongolfiera.js'
import { merciOrdinabili } from '../../src/giochi/fattoria/motore/mercato.js'
import {
  guastiDellaMongolfiera, FILE, FILE_GRANDE, LIVELLO_GRANDE, CASSE_MIN, CASSE_MAX,
  PEZZI_MIN, PEZZI_MAX, CIELO_VUOTO_MIN, BONUS_FILA, BONUS_TUTTO, fileAl,
} from '../../src/giochi/fattoria/dati/mongolfiera.js'
import { premioDelPezzo } from '../../src/giochi/fattoria/dati/mercato.js'
import { profonditaDi, PRODOTTI } from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { PER_ID, guastiDelCatalogo } from '../../src/giochi/fattoria/dati/catalogo.js'
import { ULTIMO, sogliaDi, premiDi, roba, livelloDellaVoce }
  from '../../src/giochi/fattoria/dati/livelli.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const MINUTO = 60000

/* Una sorte seminabile, come in `unita/mercato`. */
function sorte(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

function borsaTracciata(iniziale) {
  let n = iniziale
  return { quante: () => n, paga: c => { n -= c; return true }, saldo: () => n }
}

/* Una fattoria a un certo livello, coi tre silos e la piazzola della
   mongolfiera in mappa, tutti i premi presi. */
function conLaMongolfiera(livello = 30, borsa = borsaInfinita(), { piazzola = true } = {}) {
  const f = new Fattoria({ borsa })
  f.speso = sogliaDi(livello)
  f.reclamaTutto()
  for (const [id, x, y] of [['silo', 22, 22], ['silo_bianco', 26, 22], ['dispensa', 20, 26]]) {
    if (!f.sbloccata(id)) continue
    const dove = f.cellaLibera(x, y)
    const r = f.posa(id, dove.x, dove.y)
    if (!r.ok) throw new Error(`${id} non si posa: ${r.motivo}`)
  }
  if (piazzola) {
    const dove = f.cellaLibera(14, 14)
    const r = f.posa('mongolfiera', dove.x, dove.y)
    if (!r.ok) throw new Error('la mongolfiera non si posa: ' + r.motivo)
  }
  return f
}

/* Posa una cosa del baule nel primo posto dove ci sta: la
   `cellaLibera` dice dove si può **stare**, non dove entra un piede
   largo tre celle. */
function posaDove(f, id) {
  for (let y = 0; y < 60; y++)
    for (let x = 0; x < 60; x++) {
      const r = f.posa(id, x, y)
      if (r.ok || r.motivo !== 'non-ci-sta') return r
    }
  return { ok: false, motivo: 'nessun-posto' }
}

/* Mette in granaio quello che serve a riempire una cassa. `metti`
   rispetta la capienza: se non ci sta, il test lo deve dire. */
function riempi(f, i, c) {
  const fila = f.mongolfiera.file[i]
  const serve = fila.casse[c].pezzi - f.quantoHo(fila.merce)
  if (serve > 0) f.metti(fila.merce, serve)
}

/* ══════════ 1. i dati stanno in piedi ══════════ */
{
  const g = guastiDellaMongolfiera()
  controlla('la mongolfiera non ha guasti (il tetto compreso)', g.length === 0, g.join(' · '))
  const c = guastiDelCatalogo()
  controlla('il catalogo non ha guasti', c.length === 0, c.join(' · '))
  const v = PER_ID.mongolfiera
  controlla('la mongolfiera è in catalogo', !!v)
  uguale('arriva al livello 25', livelloDellaVoce(v), 25)
  uguale('costa 🪙250', v.prezzo, 250)
  controlla('ed è unica', v.unico === true)
  /* I due disegni sono arrivati (`edifici_4.png`): il pallone e la
     piazzola vuota. Che l'atlante li abbia lo guarda già
     `guastiDelCatalogo`; qui si guarda che siano quelli giusti. */
  uguale('ha il suo disegno', v.pezzo, 'mongolfiera')
  uguale('e anche quello di quando è partita', v.partita && v.partita.pezzo, 'mongolfiera_partita')
  controlla('ed è un premio del livello 25',
            premiDi(25).some(p => p.id === 'mongolfiera'))
}

/* Le otto sorprese: gli id del foglio che verrà, e **nessuna** in
   vendita o fra i premi. */
{
  uguale('le sorprese sono otto', SORPRESE.length, 8)
  const attese = ['fiera_bandierine', 'fiera_giostra', 'fiera_zucchero_filato',
    'fiera_lanterne', 'fiera_barattoli', 'fiera_girasole', 'fiera_spaventapasseri', 'fiera_palco']
  uguale('con gli id del foglio della fiera', SORPRESE.slice().sort().join(' '), attese.sort().join(' '))
  for (const id of SORPRESE)
    controlla(`${id} aspetta il suo disegno`, PER_ID[id].aspetta === id)
  let inPremio = 0
  for (let l = 1; l <= ULTIMO; l++) {
    inPremio += premiDi(l).filter(p => SORPRESE.includes(p.id)).length
    inPremio += roba(l).cose.filter(v => v.fiera).length
  }
  uguale('nessuna sorpresa è un premio di livello', inPremio, 0)
  const f = conLaMongolfiera(40)
  for (const id of SORPRESE) {
    controlla(`${id} non si compra`, !f.compra(id).ok)
    controlla(`e non si posa senza averla`, !f.sbloccata(id))
  }
}

/* ══════════ 2. cosa si chiede ══════════ */
{
  let palloni = 0, storte = 0, mangimi = 0, doppie = 0, fuori = 0, casseFuori = 0, pezziFuori = 0, disuguali = 0
  const viste = new Set()
  for (let liv = 25; liv <= ULTIMO; liv++) {
    const f = conLaMongolfiera(liv)
    const lecite = new Set(merciOrdinabili(f))
    for (let s = 1; s <= 12; s++) {
      const m = componiLaMongolfiera(f, sorte(liv * 100 + s), 1, 0)
      if (!m) continue
      palloni++
      uguale(`livello ${liv}: le file sono ${fileAl(liv)}`, m.file.length,
             Math.min(fileAl(liv), merciDaCassa(f).length))
      const merci = m.file.map(x => x.merce)
      if (new Set(merci).size !== merci.length) doppie++
      for (const x of m.file) {
        viste.add(x.merce)
        if (!(profonditaDi(x.merce) >= 2)) { storte++; if (storte < 3) nota(`al ${liv} è uscito ${x.merce}`) }
        if (PRODOTTI[x.merce].mangime) { mangimi++; if (mangimi < 3) nota(`al ${liv} ha chiesto il mangime ${x.merce}`) }
        if (!lecite.has(x.merce)) fuori++
        if (x.casse.length < CASSE_MIN || x.casse.length > CASSE_MAX) casseFuori++
        for (const c of x.casse) if (c.pezzi < PEZZI_MIN || c.pezzi > PEZZI_MAX) pezziFuori++
        if (new Set(x.casse.map(c => c.pezzi)).size !== 1) disuguali++
      }
    }
  }
  /* Il giorno che arriva, il pallone è già pieno di file: tre merci
     lavorate diverse, e non una fila sola scritta tre volte. */
  dentro('al 25 ci sono merci per tre file', merciDaCassa(conLaMongolfiera(25)).length, FILE, Infinity)
  uguale(`solo merci a due fasi o più (${palloni} palloni)`, storte, 0)
  uguale('e mai il mangime delle bestie: solo prodotti finiti', mangimi, 0)
  uguale('solo merci ottenibili a quel livello', fuori, 0)
  uguale('una merce diversa per fila', doppie, 0)
  uguale(`da ${CASSE_MIN} a ${CASSE_MAX} casse per fila`, casseFuori, 0)
  uguale(`da ${PEZZI_MIN} a ${PEZZI_MAX} pezzi per cassa`, pezziFuori, 0)
  uguale('e le casse di una fila chiedono tutte lo stesso', disuguali, 0)
  controlla('e prima o poi si chiedono tante merci diverse', viste.size >= 20, `${viste.size}`)
  nota(`${viste.size} merci diverse viste nelle casse`)
}

/* ══════════ 3. il premio ══════════ */
{
  const borsa = borsaTracciata(5000)
  const f = conLaMongolfiera(40, borsa)
  const monete = borsa.saldo()
  controlla('posata la piazzola, atterra un pallone', aggiornaLaMongolfiera(f, 1000, sorte(3)))
  controlla('ed è a terra', aTerra(f.mongolfiera))
  uguale('con tre file', f.mongolfiera.file.length, FILE)
  controlla('senza roba non c\'è niente da caricare', !qualcosaDaCaricare(f))
  controlla('e il pallone non ha il fumetto', !(f.aspettoDellaCosa(mongolfieraIn(f), 1000) || {}).fumetto)

  /* Senza roba, caricare non tocca niente. */
  const primaXp = f.guadagnato
  const x0 = f.mongolfiera.file[0]
  const r0 = caricaLaCassa(f, 0, 0, sorte(1))
  controlla('senza la merce una cassa non si carica', !r0.ok && r0.motivo === 'manca-roba')
  uguale('e non si prende niente', f.guadagnato, primaXp)
  controlla('e la cassa resta vuota', !x0.casse[0].piena)

  riempi(f, 0, 0)
  controlla('con la roba in granaio c\'è qualcosa da caricare', qualcosaDaCaricare(f))
  uguale('e il pallone mette il fumetto', (f.aspettoDellaCosa(mongolfieraIn(f), 1000) || {}).fumetto, '📦')

  let totale = 0, sommaCasse = 0
  const file = f.mongolfiera.file
  for (let i = 0; i < file.length; i++) {
    const fila = file[i]
    let suo = 0
    for (let c = 0; c < fila.casse.length; c++) {
      riempi(f, i, c)
      const cassa = fila.casse[c]
      const atteso = Math.round(premioDelPezzo(fila.merce) * cassa.pezzi)
      uguale(`una cassa di ${cassa.pezzi} ${fila.merce} rende il premio dei suoi pezzi`, cassa.xp, atteso)
      const prima = f.guadagnato
      const r = caricaLaCassa(f, i, c, sorte(5))
      controlla('la cassa si carica', r.ok, r.motivo)
      suo += cassa.xp
      const ultimaDellaFila = c === fila.casse.length - 1
      const ultima = ultimaDellaFila && i === file.length - 1
      uguale('il bonus di fila arriva con l\'ultima della fila', r.bonusFila,
             ultimaDellaFila ? Math.round(BONUS_FILA * suo) : 0)
      if (!ultima) uguale('e il bonus del tutto aspetta', r.bonusTutto, 0)
      uguale('l\'esperienza sale subito di quello che dice', f.guadagnato - prima, r.xp)
      totale += r.xp
    }
    sommaCasse += suo
  }
  const ultima = file.length - 1
  controlla('adesso è tutto pieno', naveDi(f).pieno)
  uguale('e tutto pieno ha reso la metà in più delle casse',
         totale - sommaCasse - file.reduce((s, x) =>
           s + Math.round(BONUS_FILA * x.casse.reduce((t, c) => t + c.xp, 0)), 0),
         Math.round(BONUS_TUTTO * sommaCasse))
  uguale('la schermata conta lo stesso totale', naveDi(f).preso, totale)
  uguale('ed era quello promesso', naveDi(f).tuttoIntero, totale)
  uguale('le monete non si toccano mai', borsa.saldo(), monete)
  nota(`un pallone pieno al livello 40: ⭐${totale} (casse ${sommaCasse}), ultima fila ${file[ultima].merce}`)
}

/* ══════════ 4. la sorpresa ══════════ */
{
  /* Si riempie un pallone intero e si guarda cosa arriva nel baule. */
  function riempiTutto(f, seme) {
    let r = null
    f.mongolfiera.file.forEach((fila, i) => fila.casse.forEach((_, c) => {
      riempi(f, i, c)
      r = caricaLaCassa(f, i, c, sorte(seme))
    }))
    return r
  }
  const f = conLaMongolfiera(40)
  aggiornaLaMongolfiera(f, 1000, sorte(7))
  const r = riempiTutto(f, 11)
  controlla('tutto pieno porta una sorpresa', SORPRESE.includes(r.sorpresa), r.sorpresa)
  uguale('e finisce nel baule', f.quantiNe(r.sorpresa), 1)
  controlla('dove si può posare', f.sbloccata(r.sorpresa))
  const posata = posaDove(f, r.sorpresa)
  controlla('e la si posa gratis', posata.ok && posata.costo === 0, posata.motivo)
  uguale('uscendo dal baule', f.quantiNe(r.sorpresa), 0)

  /* Otto palloni pieni di fila: otto sorprese diverse — posate o no,
     quella che si ha non torna finché ne manca una. */
  const g = conLaMongolfiera(40)
  const avute = []
  let ora = 1000
  for (let k = 0; k < SORPRESE.length; k++) {
    aggiornaLaMongolfiera(g, ora, sorte(20 + k))
    const x = riempiTutto(g, 30 + k)
    avute.push(x.sorpresa)
    if (k % 2) {                                   // metà le posa, metà le tiene nel baule
      controlla('una sorpresa si posa', posaDove(g, x.sorpresa).ok)
    }
    parti(g, ora)
    ora += CIELO_VUOTO_MIN * MINUTO
  }
  uguale('otto palloni pieni, otto sorprese diverse', new Set(avute).size, SORPRESE.length)
  /* Poi di nuovo a caso: la nona è una che si ha già. */
  aggiornaLaMongolfiera(g, ora, sorte(99))
  const nona = riempiTutto(g, 99)
  controlla('finita la collezione ne arriva comunque una', SORPRESE.includes(nona.sorpresa))
  /* E la scelta pura: con sette in mano esce l'ottava, qualunque sorte. */
  const h = conLaMongolfiera(40)
  for (const id of SORPRESE.slice(1)) h.magazzino[id] = 1
  let sempre = true
  for (let s = 1; s <= 30; s++) if (scegliLaSorpresa(h, sorte(s)) !== SORPRESE[0]) sempre = false
  controlla('con sette in mano esce sempre l\'ottava', sempre)
}

/* ══════════ 5. la partenza ══════════ */
{
  const f = conLaMongolfiera(40)
  const t0 = 10 * MINUTO
  aggiornaLaMongolfiera(f, t0, sorte(4))
  const n = f.mongolfiera.n
  riempi(f, 0, 0)
  const r = caricaLaCassa(f, 0, 0, sorte(1))
  const preso = f.guadagnato
  const p = parti(f, t0)
  controlla('«Parti!» si preme anche a metà', p.ok)
  uguale('e dice quante casse erano piene', p.piene, 1)
  uguale('il premio della cassa consegnata resta', f.guadagnato, preso)
  controlla('che era quello della cassa', r.xp > 0 && preso >= r.xp)
  controlla('il pallone non è più a terra', !aTerra(f.mongolfiera))
  uguale('e il cielo è vuoto per un\'ora', minutiAlProssimo(f, t0), CIELO_VUOTO_MIN)
  const piazzola = mongolfieraIn(f)
  uguale('la piazzola cambia faccia', (f.aspettoDellaCosa(piazzola, t0) || {}).invece,
         PER_ID.mongolfiera.partita.pezzo)
  controlla('non si riparte due volte', !parti(f, t0).ok)
  controlla('non si carica niente da partita', !caricaLaCassa(f, 0, 1, sorte(1)).ok)
  controlla('a 59 minuti non atterra niente',
            !aggiornaLaMongolfiera(f, t0 + 59 * MINUTO, sorte(2)))
  uguale('e manca un minuto', minutiAlProssimo(f, t0 + 59 * MINUTO), 1)
  controlla('a 60 minuti ne atterra un\'altra',
            aggiornaLaMongolfiera(f, t0 + 60 * MINUTO, sorte(2)))
  uguale('che è un pallone nuovo', f.mongolfiera.n, n + 1)
  controlla('con tutte le casse vuote', f.mongolfiera.file.every(x => x.casse.every(c => !c.piena)))
  controlla('e la piazzola torna a essere un pallone',
            !(f.aspettoDellaCosa(piazzola, t0 + 60 * MINUTO) || {}).invece)
  /* Non scade da solo: un giorno dopo è ancora lì, lo stesso. */
  const stesso = JSON.stringify(f.mongolfiera)
  controlla('un giorno dopo non è cambiato niente',
            !aggiornaLaMongolfiera(f, t0 + 24 * 60 * MINUTO, sorte(3)))
  uguale('è lo stesso pallone', JSON.stringify(f.mongolfiera), stesso)

  /* Senza piazzola in mappa non atterra niente. */
  const senza = conLaMongolfiera(40, borsaInfinita(), { piazzola: false })
  controlla('senza la piazzola non atterra niente', !aggiornaLaMongolfiera(senza, 0, sorte(1)))
  uguale('e il cielo resta com\'era', senza.mongolfiera, null)
}

/* ══════════ 6. la mongolfiera grande ══════════ */
{
  uguale('al 65 le file sono tre', fileAl(LIVELLO_GRANDE - 1), FILE)
  uguale('al 66 sono quattro', fileAl(LIVELLO_GRANDE), FILE_GRANDE)
  const f = conLaMongolfiera(LIVELLO_GRANDE)
  aggiornaLaMongolfiera(f, 0, sorte(8))
  uguale('e il pallone che atterra al 66 ne ha quattro', f.mongolfiera.file.length, FILE_GRANDE)
  const g = conLaMongolfiera(LIVELLO_GRANDE - 1)
  aggiornaLaMongolfiera(g, 0, sorte(8))
  uguale('quello del 65 tre', g.mongolfiera.file.length, FILE)
}

/* ══════════ 7. il salvataggio ══════════ */
{
  const f = conLaMongolfiera(40)
  aggiornaLaMongolfiera(f, 1000, sorte(12))
  riempi(f, 1, 0)
  caricaLaCassa(f, 1, 0, sorte(1))
  const dato = JSON.parse(JSON.stringify(f.serializza()))
  const g = new Fattoria({ borsa: borsaInfinita(), dato })
  uguale('il pallone si rilegge identico', JSON.stringify(g.mongolfiera), JSON.stringify(f.mongolfiera))
  uguale('e l\'esperienza pure', g.guadagnato, f.guadagnato)

  parti(g, 5000)
  const partita = new Fattoria({ borsa: borsaInfinita(),
                                 dato: JSON.parse(JSON.stringify(g.serializza())) })
  uguale('anche partito', JSON.stringify(partita.mongolfiera), JSON.stringify(g.mongolfiera))
  uguale('e sa ancora quanto manca', minutiAlProssimo(partita, 5000), CIELO_VUOTO_MIN)

  /* Una fattoria di ieri: niente mongolfiera nel salvataggio. */
  const vecchio = JSON.parse(JSON.stringify(f.serializza()))
  delete vecchio.mongolfiera
  const v = new Fattoria({ borsa: borsaInfinita(), dato: vecchio })
  uguale('una fattoria di ieri nasce col cielo libero', v.mongolfiera, null)
  controlla('e il primo pallone atterra', aggiornaLaMongolfiera(v, 0, sorte(1)))

  /* Un pallone storto: una merce che non esiste più si scorda, e se
     non resta niente il cielo torna libero. */
  const storto = JSON.parse(JSON.stringify(f.serializza()))
  storto.mongolfiera = { n: 4, nata: 1, file: [{ merce: 'verzatorta', casse: [{ pezzi: 2, xp: 50 }] }] }
  uguale('un pallone di roba che non esiste si butta',
         new Fattoria({ borsa: borsaInfinita(), dato: storto }).mongolfiera, null)
  storto.mongolfiera = { n: 4, nata: 1, file: [
    { merce: 'verzatorta', casse: [{ pezzi: 2, xp: 50 }] },
    { merce: 'pane', casse: [{ pezzi: 9, xp: 30, piena: 'sì' }, null] }] }
  const pulito = new Fattoria({ borsa: borsaInfinita(), dato: storto }).mongolfiera
  uguale('le file buone restano', pulito.file.length, 1)
  uguale('coi pezzi nei limiti', pulito.file[0].casse[0].pezzi, PEZZI_MAX)
  uguale('e una cassa «piena» per scherzo è vuota', pulito.file[0].casse[0].piena, false)

  /* Una sorpresa nel baule si rilegge e si può ancora posare. */
  const s = conLaMongolfiera(40)
  s.magazzino.fiera_giostra = 1
  const riletta = new Fattoria({ borsa: borsaInfinita(),
                                 dato: JSON.parse(JSON.stringify(s.serializza())) })
  uguale('la sorpresa nel baule si rilegge', riletta.quantiNe('fiera_giostra'), 1)
  controlla('e si può ancora posare', riletta.sbloccata('fiera_giostra'))
}

/* E in cima alla scaletta le merci bastano per la mongolfiera grande:
   quattro file di roba diversa, non tre con un buco. */
{
  const merci = merciDaCassa(conLaMongolfiera(ULTIMO))
  dentro('al livello più alto ci sono merci per quattro file', merci.length, FILE_GRANDE, Infinity)
}

riassunto('La mongolfiera della fattoria')
