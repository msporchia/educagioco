/* La tappa di Prima e dopo lasciata a metà: si scrive, passa per il JSON
   (com'è nell'archivio), si rilegge, ed è la stessa tappa — le storie fatte,
   gli errori, le ultime proposte e la domanda aperta com'è, anche a metà
   mossa o appena sbagliata. Quello che non torna non si legge, una tappa
   finita non si scrive. Vedi docs/prima-dopo/sosta.md.
   `node test/esegui.mjs prima-dopo-sosta --niente-build` */
import { CAMPAGNA } from '../../src/giochi/prima-dopo/dati/campagna.js'
import { STORIE } from '../../src/giochi/prima-dopo/dati/storie.js'
import { Corsa } from '../../src/giochi/prima-dopo/motore/corsa.js'
import { spiegazione } from '../../src/giochi/prima-dopo/motore/quesito.js'
import { caso } from '../../src/giochi/prima-dopo/motore/banco.js'
import { scrivi, leggi, dice, VERSIONE } from '../../src/giochi/prima-dopo/motore/sosta.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const viaJSON = d => JSON.parse(JSON.stringify(d))
const rileggi = (corsa, extra, opz = { rnd: caso(99) }) => leggi(viaJSON(scrivi(corsa, extra)), opz)

function rispondiGiusto(q) {
  if (q.tipo === 'ordina') { q.sequenza.forEach((_, id) => q.tocca(id)); return }
  if (q.tipo === 'intruso') { q.tocca(q.vignette.find(v => v.intruso).id); return }
  q.tocca(q.corretta)
}
function rispondiSbagliato(q) {
  if (q.tipo === 'ordina') {
    const ordine = q.sequenza.map((_, id) => id)
    ;[ordine[0], ordine[1]] = [ordine[1], ordine[0]]
    ordine.forEach(id => q.tocca(id))
  } else if (q.tipo === 'intruso') q.tocca(q.vignette.find(v => !v.intruso).id)
  else q.tocca(q.opzioni.find(o => !o.giusta).emoji)
}

// tutto quello che la tappa sa, in una riga: due corse uguali hanno la stessa
const firma = c => JSON.stringify({
  tappa: c.tappa.chiave, fatte: c.fatte, errori: c.errori, recenti: c.recenti,
  verbo: c.verbo.chiave, storia: c.quesito.storia.chiave, tipo: c.quesito.tipo,
  esito: c.quesito.esito,
  stato: c.quesito.tipo === 'ordina'
    ? { sparse: c.quesito.sparse, posate: c.quesito.posate }
    : c.quesito.tipo === 'scegli'
      ? { mostrati: c.quesito.mostrati, opzioni: c.quesito.opzioni, scelta: c.quesito.scelta }
      : { vignette: c.quesito.vignette, scelta: c.quesito.scelta },
})

/* ══════════ 1. ogni momento di ogni tappa torna com'era ══════════ */
{
  let provati = 0, storti = []
  for (const [i, tappa] of CAMPAGNA.entries()) {
    for (const seme of [1, 2, 3]) {
      // si gioca la tappa e a ogni storia si fotografa in quattro momenti
      const rnd = caso(seme * 100 + i)
      const c = Corsa.perTappa(tappa, { rnd })
      while (!c.finita) {
        const q = c.quesito
        const extra = { serie: 2, monete: { chiesto: 3, dato: 2 } }
        // la domanda appena comparsa: la corsa vera e la riletta sono la stessa
        const uguali = leggi(viaJSON(scrivi(c, extra)), { rnd: caso(7) })
        if (!uguali || firma(uguali.corsa) !== firma(c))
          storti.push(`${tappa.chiave} storia ${c.fatte}: la domanda appena comparsa cambia`)
        // poi, su una copia, i momenti che si possono lasciare a metà
        for (const m of [0, 1, 2, 3]) {
          const copia = leggi(viaJSON(scrivi(c, extra)), { rnd: caso(7) })
          if (!copia) continue
          const q2 = copia.corsa.quesito
          const eraErrori = copia.corsa.errori
          if (m === 1 && q2.tipo === 'ordina') q2.tocca(q2.sparse[0].id)      // a metà mossa
          if (m === 2) { rispondiSbagliato(q2); copia.corsa.registraErrore() }  // la spiegazione è aperta
          if (m === 3) { rispondiGiusto(q2); copia.corsa.registraSuccesso() }   // giusta, prima del respiro
          if (m === 3 && copia.corsa.finita) continue   // finita: niente da scrivere (sotto)
          const dopo = rileggi(copia.corsa, extra)
          provati++
          if (!dopo || firma(dopo.corsa) !== firma(copia.corsa))
            storti.push(`${tappa.chiave} storia ${c.fatte} momento ${m}: ${dopo ? 'cambia' : 'non rilegge'}`)
          if (m === 2 && dopo && dopo.corsa.errori !== eraErrori + 1)
            storti.push(`${tappa.chiave}: l'errore non resta contato`)
          // una domanda sbagliata riapre la spiegazione di prima
          if (m === 2 && dopo && JSON.stringify(spiegazione(copia.corsa.quesito))
                              !== JSON.stringify(spiegazione(dopo.corsa.quesito)))
            storti.push(`${tappa.chiave}: la spiegazione cambia`)
        }
        // si va avanti davvero nella corsa originale, a volte sbagliando
        if ((c.fatte + seme) % 2 === 0) { rispondiSbagliato(q); c.registraErrore(); c.riprova() }
        rispondiGiusto(c.quesito)
        c.registraSuccesso()
        if (!c.finita) c.avanti()
      }
    }
  }
  controlla(`${provati} momenti di dieci tappe tornano com'erano`, storti.length === 0, storti.slice(0, 5).join(' · '))
}

/* ══════════ 2. quello che si porta dietro ══════════ */
{
  const tappa = CAMPAGNA[4]                 // il buco nel mezzo: una domanda a scelta
  const c = Corsa.perTappa(tappa, { rnd: caso(5) })
  rispondiGiusto(c.quesito); c.registraSuccesso(); c.avanti()
  rispondiSbagliato(c.quesito); c.registraErrore(); c.riprova()
  const r = rileggi(c, { serie: 4, monete: { chiesto: 6, dato: 5 } })
  uguale('le storie fatte restano', r.corsa.fatte, 1)
  uguale('e gli errori', r.corsa.errori, 1)
  uguale('e la serie di storie giuste', r.serie, 4)
  uguale('le monete già prese', JSON.stringify(r.monete), JSON.stringify({ chiesto: 6, dato: 5 }))
  uguale('si ritrova per chiave', r.indice, 4)
  uguale('le stelle sono quelle di prima', r.corsa.stelle, c.stelle)

  // la domanda aperta è la stessa: stessa risposta giusta, stesse opzioni
  uguale('la risposta giusta è la stessa', r.corsa.quesito.corretta, c.quesito.corretta)
  uguale('le opzioni sono le stesse, nello stesso ordine',
         r.corsa.quesito.opzioni.map(o => o.emoji).join(), c.quesito.opzioni.map(o => o.emoji).join())

  // le ultime proposte non si ripescano subito
  const prima = r.corsa.recenti.slice()
  const viste = []
  for (let k = 0; k < 20; k++) { r.corsa.recenti = prima.slice(); viste.push(r.corsa.avanti().storia.chiave) }
  controlla('dopo la ripresa le ultime due storie non tornano', viste.every(k => !prima.includes(k)),
            `recenti ${prima} → ${viste}`)

  // si può giocare fino in fondo con la corsa ripresa
  let giri = 0
  while (!r.corsa.finita && giri++ < 20) {
    rispondiGiusto(r.corsa.quesito); r.corsa.registraSuccesso()
    if (!r.corsa.finita) r.corsa.avanti()
  }
  controlla('la tappa ripresa si finisce', r.corsa.finita && r.corsa.fatte === tappa.quante)
}

/* ══════════ 3. finita, o niente: non si scrive ══════════ */
{
  const c = Corsa.perTappa(CAMPAGNA[0], { rnd: caso(3) })
  uguale('senza corsa non c\'è niente', scrivi(null), null)
  while (!c.finita) { rispondiGiusto(c.quesito); c.registraSuccesso(); if (!c.finita) c.avanti() }
  uguale('una tappa finita non si scrive', scrivi(c), null)
}

/* ══════════ 4. quello che non torna non si legge ══════════ */
{
  const c = Corsa.perTappa(CAMPAGNA[0], { rnd: caso(8) })
  c.quesito.tocca(c.quesito.sparse[0].id)
  const buono = viaJSON(scrivi(c))
  controlla('il salvataggio buono si legge', leggi(buono) !== null)
  const guasto = (cosa, muta, dato = buono) => {
    const d = viaJSON(dato)
    muta(d)
    controlla(`non si legge: ${cosa}`, leggi(d) === null)
  }
  guasto('senza niente', () => {}, null)
  uguale('niente', leggi(null), null)
  uguale('una stringa', leggi('ciao'), null)
  guasto('un\'altra versione', d => { d.v = VERSIONE + 1 })
  guasto('una tappa che non esiste più', d => { d.tappa = 'sparita' })
  guasto('una storia che non esiste più', d => { d.storia = 'sparita' })
  guasto('un verbo che non è della tappa', d => { d.verbo = 'ordina4' })
  guasto('un verbo che non esiste', d => { d.verbo = 'boh' })
  guasto('più storie fatte di quelle della tappa', d => { d.fatte = 99 })
  guasto('storie fatte negative', d => { d.fatte = -1 })
  guasto('errori che non sono un numero', d => { d.errori = 'tanti' })
  guasto('le recenti non sono una lista', d => { d.recenti = 'x' })
  guasto('una domanda di un\'altra forma', d => { d.quesito.tipo = 'intruso' })
  guasto('senza la domanda', d => { delete d.quesito })
  guasto('vignette sparse che non sono una permutazione', d => { d.quesito.sparse = [0, 0, 1] })
  guasto('vignette sparse in meno', d => { d.quesito.sparse = [0, 1] })
  guasto('una vignetta posata due volte', d => { d.quesito.posate = [0, 0, null] })
  guasto('una vignetta che non c\'è', d => { d.quesito.posate = [7, null, null] })

  // le altre due forme
  const scelta = Corsa.perTappa(CAMPAGNA[4], { rnd: caso(2) })
  const bs = viaJSON(scrivi(scelta))
  controlla('anche la domanda a scelta si legge', leggi(bs) !== null)
  guasto('opzioni senza la risposta giusta', d => { d.quesito.opzioni = ['🅰', '🅱', '🆎'] }, bs)
  guasto('un buco nel posto sbagliato', d => { d.quesito.mostrati = [null, ...d.quesito.mostrati.slice(1)] }, bs)
  guasto('una scelta fuori dalle opzioni', d => { d.quesito.scelta = '🅰' }, bs)

  const intruso = Corsa.perTappa(CAMPAGNA[8], { rnd: caso(4) })
  const bi = viaJSON(scrivi(intruso))
  controlla('anche l\'intruso si legge', leggi(bi) !== null)
  guasto('l\'intruso non è quello', d => { d.quesito.intruso = (d.quesito.intruso + 1) % 4 }, bi)
  guasto('una vignetta in più', d => { d.quesito.vignette.push('🅰') }, bi)
  guasto('una scelta che non c\'è', d => { d.quesito.scelta = 9 }, bi)
}

/* ══════════ 5. la tappa si ritrova per chiave ══════════ */
{
  const c = Corsa.perTappa(CAMPAGNA[5], { rnd: caso(6) })
  const dato = viaJSON(scrivi(c))
  const rovesciata = [...CAMPAGNA].reverse()
  const r = leggi(dato, { campagna: rovesciata })
  uguale('con la campagna in un altro ordine la tappa è la stessa', r.corsa.tappa.chiave, CAMPAGNA[5].chiave)
  uguale('e l\'indice è quello nuovo', r.indice, rovesciata.findIndex(t => t.chiave === CAMPAGNA[5].chiave))
  uguale('una storia tolta dal catalogo butta il salvataggio',
         leggi(dato, { storie: STORIE.filter(s => s.chiave !== dato.storia) }), null)
}

/* ══════════ 6. cosa dice la carta ══════════ */
{
  const c = Corsa.perTappa(CAMPAGNA[1], { rnd: caso(1) })
  rispondiGiusto(c.quesito); c.registraSuccesso(); c.avanti()
  const d = dice(viaJSON(scrivi(c)))
  uguale('la carta dice la tappa', d.nome, CAMPAGNA[1].nome)
  uguale('quante storie sono fatte', d.fatte, 1)
  uguale('e quante sono in tutto', d.quante, CAMPAGNA[1].quante)
  uguale('l\'icona', d.icona, CAMPAGNA[1].icona)
  uguale('senza sosta niente carta', dice(null), null)
  uguale('di un\'altra versione niente carta', dice({ v: 99, tappa: 'seme' }), null)
  uguale('una tappa sparita niente carta', dice({ v: VERSIONE, tappa: 'sparita' }), null)
}

riassunto('prima e dopo — la tappa lasciata a metà')
