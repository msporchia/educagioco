/* La tappa di inglese lasciata a metà, senza browser: si scrive, si rilegge
   (passando dal JSON, come nell'archivio) ed è la stessa tappa: giuste,
   errori, monete già prese, la domanda aperta com'era con la sua fila e le
   parole già toccate. Quello che non torna non si legge; una tappa finita
   non si scrive. Vedi docs/lingue/sosta.md.
   `node test/esegui.mjs inglese-sosta --niente-build` */
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'
import { TAPPE, MONDI } from '../../src/giochi/inglese/dati/mondi.js'
import { Sessione } from '../../src/giochi/inglese/motore/sessione.js'
import { Tocchi } from '../../src/giochi/inglese/motore/tocchi.js'
import * as F from '../../src/giochi/inglese/motore/fila.js'
import { FRASI } from '../../src/giochi/inglese/dati/frasi.js'
import { costruisci } from '../../src/giochi/inglese/motore/formati.js'
import { traduci } from '../../src/giochi/inglese/motore/lessico.js'
import { cassettoDi } from '../../src/giochi/inglese/motore/grafo.js'
import { scrivi, leggi, dice, VERSIONE } from '../../src/giochi/inglese/motore/sosta.js'
import { newItem } from '../../src/store/srs.js'

const viaggio = x => JSON.parse(JSON.stringify(x))
const nuovaSessione = (tappa, { presenta = false } = {}) => {
  const items = {}
  const itemDi = k => items[k] || (items[k] = newItem())
  return { s: new Sessione({ tappa, itemDi, presenta }), itemDi }
}
// una risposta giusta, come la darebbe il gioco
const giusta = (s, q) => s.rispondi(q, q.tessere ? F.risposta(componiGiusta(q)) : q.opzioni.find(o => o.giusta))
function componiGiusta(q) {
  const ordine = q.tessere.filter(t => F.postoDi(q, t.id) != null).sort((a, b) => F.postoDi(q, a.id) - F.postoDi(q, b.id))
  return ordine.reduce((fila, t) => F.metti(q, fila, t.id), F.filaVuota(q))
}
const lo = (tappa, extra = {}) => ({ tappa, conti: { monete: 3, chieste: 4, gradoPrima: 2 }, ...extra })
const opzioni = itemDi => ({ itemDi })

/* ---------- 1. una tappa di parole: la domanda aperta torna com'era ---------- */
const parole = TAPPE.find(t => t.parole && t.parole.length && !t.frasi)
{
  const { s, itemDi } = nuovaSessione(parole)
  for (let i = 0; i < 3; i++) giusta(s, s.prossima())
  const q = s.prossima()
  const tocchi = new Tocchi({ itemDi })
  const primaParola = q.domanda.testo
  const dato = viaggio(scrivi({ ...lo(parole), sessione: s, domanda: q, tocchi, fila: [], pagaQui: false, visto: 2.3 }))
  uguale('la versione è scritta', dato.v, VERSIONE)
  uguale('la tappa si ritrova per id', dato.tappa, parole.id)
  const r = leggi(dato, opzioni(itemDi))
  controlla('si rilegge', !!r)
  uguale('le giuste sono quelle', r.sessione.giuste, 3)
  uguale('gli errori sono quelli', r.sessione.errori, 0)
  uguale('il bersaglio è quello (la tappa non si accorcia)', r.sessione.bersaglio, s.bersaglio)
  controlla('la domanda aperta è la stessa, anche nelle risposte sbagliate',
            JSON.stringify(r.aperta) === JSON.stringify(q), primaParola)
  uguale('le monete già prese restano', r.conti.monete, 3)
  uguale('e quelle chieste', r.conti.chieste, 4)
  uguale('il grado di prima resta quello di prima', r.conti.gradoPrima, 2)
  uguale('la domanda non paga più, come l\'aveva lasciata', r.pagaQui, false)
  uguale('il tempo già guardato non si perde', r.visto, 2.3)
  stessaLista('il primo giro riparte da dove era', r.sessione.primoGiro, s.primoGiro)
  controlla('la voce aperta non torna subito dopo la risposta', (() => {
    giusta(r.sessione, r.aperta)
    return r.sessione.prossima().chiave !== q.chiave
  })())
  uguale('una risposta giusta in più dopo la ripresa conta una volta sola', r.sessione.giuste, 4)
}

/* ---------- 2. un tocco che costa si ricorda, e la parola resta «non saputa» ---------- */
{
  const { s, itemDi } = nuovaSessione(parole)
  const q = s.prossima()
  const tocchi = new Tocchi({ itemDi })
  const parola = parole.parole[0]
  const chiave = traduci(parola).chiave
  controlla('la parola di prova ha una chiave', !!chiave, parola)
  itemDi(chiave).tocchi = 3            // i tocchi gratis sono finiti: questo costa
  tocchi.tocca(parola)
  uguale('toccata, la domanda non paga più', tocchi.paga, false)
  const dato = viaggio(scrivi({ ...lo(parole), sessione: s, domanda: q, tocchi, fila: [], pagaQui: tocchi.paga, visto: 0 }))
  const r = leggi(dato, opzioni(itemDi))
  uguale('la parola già toccata si rimette', r.toccate.length, 1)
  const t2 = new Tocchi({ itemDi }); t2.toccate = new Map(r.toccate)
  uguale('e costa ancora', t2.paga, false)
  stessaLista('e resta fra le non sapute', t2.nonSapute, tocchi.nonSapute)
  uguale('toccarla di nuovo non costa un altro tocco', t2.tocca(parola).ancora, true)
}

/* ---------- 3. una tappa di frasi: la presentazione, la pagina, la fila a metà ---------- */
const frasi = TAPPE.find(t => t.frasi && !t.bandiera)
{
  const { s, itemDi } = nuovaSessione(frasi, { presenta: true })
  const p = s.prossima()
  uguale('la tappa di frasi comincia dalla pagina del concetto', p.genere, 'pagina')
  // salvata mentre la pagina è aperta
  let dato = viaggio(scrivi({ ...lo(frasi), sessione: s, domanda: null, pagina: p, tocchi: null, fila: [] }))
  let r = leggi(dato, opzioni(itemDi))
  controlla('la pagina aperta torna', !!r && r.pagina && r.pagina.genere === 'pagina' && !r.aperta)
  uguale('e dopo la pagina non si rifà', r.sessione.paginaFatta, true)
  // una frase da comporre a tessere (i formati salgono con la forza: qui la si costruisce)
  const frase = FRASI.find(f => f.tappa === frasi.id)
  const q = costruisci(frase, 'monta', s.contestoDi(frase), { forza: 6 })
  uguale('poi viene una frase da comporre', q.genere, 'frase')
  const ordine = q.tessere.filter(t => F.postoDi(q, t.id) != null).sort((a, b) => F.postoDi(q, a.id) - F.postoDi(q, b.id))
  const fila = F.metti(q, F.filaVuota(q), ordine[0].id)
  dato = viaggio(scrivi({ ...lo(frasi), sessione: s, domanda: q, tocchi: new Tocchi({ itemDi }), fila, pagaQui: true, visto: 1 }))
  r = leggi(dato, opzioni(itemDi))
  controlla('la frase aperta torna com\'era', JSON.stringify(r.aperta) === JSON.stringify(q))
  stessaLista('con le tessere già messe in fila', r.fila, fila)
  uguale('la presentazione è allo stesso punto', r.sessione.passo, s.passo)
  uguale('e così le giuste sul concetto', r.sessione.giusteQui, s.giusteQui)
  // si risponde giusto alla frase ripresa: il motore la giudica come prima
  const e = r.sessione.rispondi(r.aperta, F.risposta(componiGiusta(r.aperta)))
  uguale('la frase ripresa si giudica giusta', e.giusta, true)
  uguale('e conta una sola giusta', r.sessione.giuste, 1)
  // una fila con un id che non c'è: non torna
  dato = viaggio(scrivi({ ...lo(frasi), sessione: s, domanda: q, tocchi: null, fila: ['nonc\'e'], pagaQui: true }))
  uguale('una fila con una tessera che non esiste non si legge', leggi(dato, opzioni(itemDi)), null)
}

/* ---------- 4. dopo uno sbaglio la pagina in arrivo si salva ---------- */
{
  const { s, itemDi } = nuovaSessione(frasi, { presenta: true })
  s.prossima()
  const p = { genere: 'pagina', concetto: 'x', titolo: 't' }
  const dato = viaggio(scrivi({ ...lo(frasi), sessione: s, domanda: null, pagina: p, tocchi: null, fila: [] }))
  controlla('la pagina in arrivo torna', leggi(dato, opzioni(itemDi)).pagina.titolo === 't')
}

/* ---------- 5. il cassetto si ritrova per mondo ---------- */
{
  const mondo = MONDI.find(m => m.tappe.length)
  const cassetto = cassettoDi(mondo.id)
  const { s, itemDi } = nuovaSessione(cassetto)
  const q = s.prossima()
  const dato = viaggio(scrivi({ ...lo(cassetto), sessione: s, domanda: q, tocchi: null, fila: [], pagaQui: true }))
  uguale('il cassetto si scrive col suo mondo', dato.cassetto, mondo.id)
  const r = leggi(dato, opzioni(itemDi))
  controlla('e si rilegge', !!r && r.tappa.cassetto === true && r.tappa.mondo === mondo.id)
  const d = dice(dato)
  controlla('la carta lo dice', d.cassetto && d.nome.includes('cassetto'), JSON.stringify(d))
}

/* ---------- 6. quello che non torna non si legge ---------- */
{
  const { s, itemDi } = nuovaSessione(parole)
  const q = s.prossima()
  const base = viaggio(scrivi({ ...lo(parole), sessione: s, domanda: q, tocchi: null, fila: [], pagaQui: true }))
  uguale('niente non si legge', leggi(null, opzioni(itemDi)), null)
  uguale('un\'altra versione si butta', leggi({ ...base, v: VERSIONE + 1 }, opzioni(itemDi)), null)
  uguale('una tappa che non c\'è più si butta', leggi({ ...base, tappa: 'non-esiste' }, opzioni(itemDi)), null)
  uguale('un bersaglio storto si butta', leggi({ ...base, bersaglio: 'molti' }, opzioni(itemDi)), null)
  uguale('una voce che non c\'è più si butta', leggi({ ...base, aperta: { ...base.aperta, chiave: 'x:nonc-e' } }, opzioni(itemDi)), null)
  uguale('una domanda senza genere si butta', leggi({ ...base, aperta: { chiave: 'x' } }, opzioni(itemDi)), null)
  uguale('una tappa richiusa dai grandi non si riprende', leggi(base, opzioni(itemDi), { siGioca: () => false }), null)
  controlla('quella buona sì', !!leggi(base, opzioni(itemDi)))
  uguale('dice null a un\'altra versione', dice({ ...base, v: 99 }), null)
  uguale('e null a una tappa che non c\'è', dice({ ...base, tappa: 'non-esiste' }), null)
  const d = dice(base)
  uguale('la carta dice la tappa', d.nome, parole.nome)
  uguale('e a che punto è', `${d.giuste} di ${d.bersaglio}`, `0 di ${s.bersaglio}`)
}

/* ---------- 7. una tappa finita non si scrive ---------- */
{
  const { s } = nuovaSessione(parole)
  s.giuste = s.bersaglio
  uguale('a tappa vinta niente da salvare', scrivi({ ...lo(parole), sessione: s, domanda: null, tocchi: null, fila: [] }), null)
  uguale('senza sessione neanche', scrivi({ tappa: parole, sessione: null, conti: {} }), null)
}

/* ---------- 8. ogni tappa, a metà: scrivi → JSON → leggi → si va avanti ---------- */
{
  let provate = 0
  for (const t of TAPPE) {
    const frasiDa = !!t.frasi
    const { s, itemDi } = nuovaSessione(t, { presenta: frasiDa })
    let q = null
    for (let i = 0; i < 6; i++) {
      q = s.prossima()
      if (!q) break
      if (q.genere === 'pagina') continue
      if (i < 4) giusta(s, q)
    }
    if (!q) continue
    const aperta = q.genere === 'pagina' ? null : q
    const dato = viaggio(scrivi({ ...lo(t), sessione: s, domanda: aperta, pagina: aperta ? null : q,
                                  tocchi: new Tocchi({ itemDi }), fila: aperta && aperta.tessere ? F.filaVuota(aperta) : [],
                                  pagaQui: true, visto: 0 }))
    const r = leggi(dato, opzioni(itemDi))
    controlla(`${t.id}: la tappa a metà si rilegge`, !!r)
    if (!r) continue
    uguale(`${t.id}: le giuste tornano`, r.sessione.giuste, s.giuste)
    const dopo = r.aperta ? (giusta(r.sessione, r.aperta), r.sessione.prossima()) : r.sessione.prossima()
    controlla(`${t.id}: si può andare avanti`, !!dopo || r.sessione.finita)
    provate++
  }
  controlla('le tappe provate sono tutte', provate === TAPPE.length, `${provate} di ${TAPPE.length}`)
}

riassunto('inglese — la tappa lasciata a metà')
