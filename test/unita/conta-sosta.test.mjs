/* La tappa di Conta lasciata a metà: si scrive, si rilegge, ed è la stessa
   tappa — la domanda aperta com'era, le giuste fatte, gli errori che
   fanno le stelle, le monete già prese. Quello che non torna non si legge,
   e una tappa finita non si scrive. Vedi docs/conta/regole.md.
   `node test/esegui.mjs conta-sosta --niente-build` */
import { CAMPAGNA } from '../../src/giochi/conta/dati/campagna.js'
import { Corsa } from '../../src/giochi/conta/motore/corsa.js'
import { rispostaGiocatore, caso } from '../../src/giochi/conta/motore/banco.js'
import { scrivi, leggi, dice, VERSIONE } from '../../src/giochi/conta/motore/sosta.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const viaJson = d => JSON.parse(JSON.stringify(d))
const sbagliata = d => d.modo === 'porta' ? d.n + 1
  : d.opzioni.find(o => !Object.is(o.valore, d.rispostaGiusta)).valore

/* una tappa giocata fino alla domanda `fatte`, con `errori` sbagli */
function aMeta(tappa, fatte, errori, seme = 7) {
  const rnd = caso(seme)
  const c = Corsa.perTappa(tappa, { rnd })
  for (let k = 0; k < errori; k++) c.rispondi(sbagliata(c.domanda))
  while (c.indice < fatte) c.rispondi(rispostaGiocatore(c.domanda, rnd))
  return c
}

/* ══════════ 1. ogni tappa, a metà, torna la stessa ══════════ */
{
  let storte = [], stelle = 0
  for (const [i, tappa] of CAMPAGNA.entries()) {
    for (const fatte of [0, tappa.partite - 1]) {
      const c = aMeta(tappa, fatte, fatte ? 1 : 0, i + 3)
      const dato = viaJson(scrivi(c, { monete: { chiesto: 6, dato: 4 }, serie: 3 }))
      const l = leggi(dato)
      if (!l) { storte.push(`${tappa.chiave}/${fatte}: non si legge`); continue }
      const uguali = l.indice === i && l.corsa.indice === c.indice && l.corsa.errori === c.errori
        && JSON.stringify(viaJson(scrivi(l.corsa, { monete: l.monete, serie: l.serie }))) === JSON.stringify(dato)
      if (!uguali) storte.push(`${tappa.chiave}/${fatte}: non è la stessa`)
      // la specie è l'oggetto del mondo, non un pezzo di testo
      if (!l.corsa.domanda.gruppi.every(g => g.gettoni.every(t => typeof t.specie.emoji === 'string')))
        storte.push(`${tappa.chiave}/${fatte}: specie non rivestite`)
      // e la domanda ripresa si può rispondere davvero, e vale quanto prima
      const prima = c.indice
      if (!l.corsa.rispondi(l.corsa.domanda.rispostaGiusta) || l.corsa.indice !== prima + 1)
        storte.push(`${tappa.chiave}/${fatte}: la giusta non è giusta`)
      stelle++
    }
  }
  controlla('ogni tappa, all\'inizio e all\'ultima domanda, rilegge la stessa', storte.length === 0, storte.join(' · '))
  controlla('e sono tutte quelle della campagna', stelle === CAMPAGNA.length * 2)
}

/* ══════════ 2. uscire non è una mossa ══════════ */
{
  const tappa = CAMPAGNA[2]               // «La cesta»: si portano N gettoni
  const c = aMeta(tappa, 2, 2)
  const l = leggi(viaJson(scrivi(c, { monete: { chiesto: 2, dato: 2 }, serie: 1 })))
  uguale('la domanda aperta è quella, non una più facile',
         JSON.stringify(scrivi(l.corsa, {}).domanda), JSON.stringify(scrivi(c, {}).domanda))
  uguale('gli errori restano, quindi le stelle', l.corsa.errori, 2)
  uguale('le giuste fatte restano', l.corsa.indice, 2)
  while (!l.corsa.finita) l.corsa.rispondi(l.corsa.domanda.rispostaGiusta)
  uguale('con due errori le stelle sono due', l.corsa.stelle, 2)
  uguale('le monete già prese restano nel conto', JSON.stringify(l.monete), JSON.stringify({ chiesto: 2, dato: 2 }))
  uguale('e la serie di fila', l.serie, 1)

  // una risposta sbagliata non fa avanzare, prima come dopo
  const m = leggi(viaJson(scrivi(aMeta(CAMPAGNA[0], 1, 0), {})))
  const giusta = m.corsa.domanda.rispostaGiusta
  m.corsa.rispondi(sbagliata(m.corsa.domanda))
  uguale('dopo la ripresa uno sbaglio non cambia la domanda', m.corsa.domanda.rispostaGiusta, giusta)
}

/* ══════════ 3. una tappa finita non si scrive ══════════ */
{
  const c = aMeta(CAMPAGNA[0], CAMPAGNA[0].partite, 0)
  controlla('la tappa è finita', c.finita)
  uguale('e non lascia sosta', scrivi(c, {}), null)
  uguale('niente corsa, niente sosta', scrivi(null, {}), null)
}

/* ══════════ 4. quello che non torna non si legge ══════════ */
{
  const buono = () => viaJson(scrivi(aMeta(CAMPAGNA[1], 1, 0), {}))
  const guasta = (nome, tocca) => {
    const d = buono(); tocca(d)
    uguale(nome, leggi(d), null)
  }
  controlla('il buono si legge', leggi(buono()) !== null)
  uguale('una versione che non è la nostra', leggi({ ...buono(), v: VERSIONE + 1 }), null)
  uguale('niente', leggi(null), null)
  guasta('una tappa che non esiste più', d => { d.tappa = 'sparita' })
  guasta('più giuste di quante ne chiede la tappa', d => { d.fatte = CAMPAGNA[1].partite })
  guasta('giuste negative', d => { d.fatte = -1 })
  guasta('errori che non sono un numero', d => { d.errori = 'molti' })
  guasta('un verbo che la tappa non fa', d => { d.domanda.verbo = 'unisci' })
  guasta('un verbo che non esiste', d => { d.domanda.verbo = 'boh' })
  guasta('una domanda che non c\'è', d => { delete d.domanda })
  guasta('una specie che il mondo non ha', d => { d.domanda.gruppi[0].gettoni[0].specie = 'drago' })
  guasta('un gettone senza posto', d => { delete d.domanda.gruppi[0].gettoni[0].x })
  guasta('una risposta giusta fuori dalle opzioni', d => { d.domanda.rispostaGiusta = 99 })
  guasta('senza i gruppi', d => { d.domanda.gruppi = [] })
  const porta = viaJson(scrivi(aMeta(CAMPAGNA[2], 0, 0), {}))
  porta.domanda.n = porta.domanda.n + 1
  uguale('un «porta» con i conti che non tornano', leggi(porta), null)
}

/* ══════════ 5. cosa dice la carta ══════════ */
{
  const tappa = CAMPAGNA[3]
  const d = dice(viaJson(scrivi(aMeta(tappa, 2, 0), {})))
  uguale('la carta dice la tappa', d.nome, tappa.nome)
  uguale('e a che domanda si era', `${d.domanda}/${d.di}`, `3/${tappa.partite}`)
  uguale('niente da dire se non si legge', dice({ v: 0 }), null)
}

riassunto('conta — la tappa lasciata a metà')
