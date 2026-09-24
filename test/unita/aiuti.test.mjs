/* ═══════════════════════════════════════════════════════════════════
   LA SCALA DEGLI AIUTI, SENZA BROWSER
     node test/unita/aiuti.test.mjs

   Il 💡 del Generale, di Passo passo e del costruttore è una scala sola
   (`src/giochi/aiuti.js`): due gradini gratis che fanno ragionare, poi
   gli indizi a 🪙10, poi i gradini che scrivono nel programma a 🪙50 ·
   100 · 200. Qui si prova quello che, sbagliato, non si vede finché un
   bambino non ha pagato:

     1. i prezzi — l'ultimo gradino che scrive costa sempre 200, e la
        scala sale e non scende mai;
     2. il costruttore — ogni livello ha i suoi due gradini gratis, ogni
        gradino che scrive scrive un programma sano, la forma non si
        riprende quello che il pezzo aveva dato, e la soluzione svelata
        **vince davvero**;
     3. Passo passo — la frase che fa ragionare c'è per ogni posto, e i
        pezzi di strada, dalla fila vuota o da una sbagliata, portano a
        casa con la carota e stanno nello zaino.

   Il Generale si prova in `unita/piano-generale` (la sua scala ha i
   gradini scritti nei livelli).
   ═══════════════════════════════════════════════════════════════════ */
import { conIPrezzi, guastiDellaScala, mancano, puoi, chiedeConferma, quantoCostaTutta,
         PREZZI_FINALI, PREZZO_INDIZIO, RAGIONA, INDIZIO, PEZZO, FORMA, SVELA }
  from '../../src/giochi/aiuti.js'
import { LIVELLI } from '../../src/giochi/costruttore/dati/livelli.js'
import { LIBERO } from '../../src/giochi/costruttore/dati/libero.js'
import { istruzioni } from '../../src/giochi/costruttore/dati/scrivi.js'
import { scalaDi as scalaDelCostruttore, applica } from '../../src/giochi/costruttore/motore/aiuti.js'
import { problemi } from '../../src/giochi/costruttore/motore/modifica.js'
import { provaLivello } from '../../src/giochi/costruttore/motore/prova.js'
import { CAMPAGNA } from '../../src/giochi/passo-passo/dati/campagna.js'
import { carteDi } from '../../src/giochi/passo-passo/dati/carte.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { esegui, TANA } from '../../src/giochi/passo-passo/motore/mondo.js'
import { scalaDi as scalaDelConiglio, pensieroDi, dove, pezzoDiStrada }
  from '../../src/giochi/passo-passo/motore/aiuti.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const passo = che => ({ che })
const prezzi = s => conIPrezzi(s).map(p => p.prezzo).join(' ')

/* ══════════ 1. i prezzi ══════════ */
{
  uguale('un gradino che fa ragionare è gratis, un indizio costa dieci',
         prezzi([passo(RAGIONA), passo(INDIZIO)]), `0 ${PREZZO_INDIZIO}`)
  uguale('la soluzione da sola costa duecento', prezzi([passo(RAGIONA), passo(SVELA)]), '0 200')
  uguale('con un gradino prima, cento e duecento', prezzi([passo(FORMA), passo(SVELA)]), '100 200')
  uguale('con due, cinquanta · cento · duecento',
         prezzi([passo(PEZZO), passo(FORMA), passo(SVELA)]), PREZZI_FINALI.join(' '))
  uguale('e con più pezzi, i primi a cinquanta',
         prezzi([passo(PEZZO), passo(PEZZO), passo(FORMA), passo(SVELA)]), '50 50 100 200')

  const buona = [passo(RAGIONA), passo(RAGIONA), passo(INDIZIO), passo(PEZZO), passo(FORMA), passo(SVELA)]
  uguale('una scala scritta bene non ha guasti', guastiDellaScala(buona).join('; '), '')
  uguale('e scenderla tutta costa quello che si legge', quantoCostaTutta(buona), 10 + 50 + 100 + 200)
  controlla('una scala che comincia pagando è un guasto',
            guastiDellaScala([passo(INDIZIO), passo(SVELA)]).length > 0)
  controlla('un indizio dopo un pezzo è una scala che scende',
            guastiDellaScala([passo(RAGIONA), passo(PEZZO), passo(INDIZIO), passo(SVELA)]).length > 0)
  controlla('una scala che scrive e non finisce con la soluzione è un guasto',
            guastiDellaScala([passo(RAGIONA), passo(FORMA)]).length > 0)

  const caro = conIPrezzi([passo(PEZZO), passo(FORMA), passo(SVELA)])
  uguale('senza monete, quanto manca', mancano(30, caro[0]), 20)
  controlla('con le monete giuste si può, senza no', puoi(50, caro[0]) && !puoi(49, caro[0]))
  controlla('dai cinquanta in su ci vuole il secondo tocco',
            chiedeConferma(caro[0]) && !chiedeConferma(conIPrezzi([passo(INDIZIO)])[0]))
}

/* ══════════ 2. il costruttore ══════════ */
const sano = (prog, l) => {
  const ids = [...istruzioni(prog)].map(i => i.id)
  const guai = []
  if (ids.some(x => !x) || ids.length !== new Set(ids).size) guai.push('id doppi o mancanti')
  if ((prog.progetti || []).some(p => !p.id)) guai.push('un progetto senza nome')
  /* quello che resta da scegliere è il punto; tutto il resto è un guasto */
  const pr = problemi(prog, l.ordini[0].lavagnette || {}).filter(x => !/da-scegliere/.test(x.motivo))
  if (pr.length) guai.push(pr.map(x => x.motivo).join(','))
  return guai
}
const dachi = prog => [...istruzioni(prog)].filter(i =>
  !JSON.stringify(i, (k, v) => (['corpo', 'allora', 'altrimenti'].includes(k) ? undefined : v))
    .match(/"vuoto":true|"cond":null|"colore":null/)).length

for (const l of LIVELLI) {
  const scala = scalaDelCostruttore(l)
  const guasti = guastiDellaScala(scala, l.chiave)
  controlla(`«${l.nome}»: la scala comincia gratis, sale e finisce con la soluzione`, !guasti.length, guasti.join('; '))
  uguale(`«${l.nome}»: due gradini che fanno ragionare`, scala.filter(p => p.che === RAGIONA).length, 2)
  /* ogni gradino che scrive, scritto su un programma nuovo, lascia un
     programma che si apre e si modifica: id unici, progetti col nome, e
     nessun problema che non sia «da scegliere» */
  let prog = { principale: [], progetti: JSON.parse(JSON.stringify(l.regalo || [])), lavagnette: [] }
  let date = 0
  for (const p of scala.filter(p => p.programma)) {
    prog = applica(prog, p)
    const guai = sano(prog, l)
    controlla(`«${l.nome}»: il gradino «${p.che}» scrive un programma sano`, !guai.length, guai.join(' · '))
    /* un gradino più caro non dà meno di quello prima */
    const qui = dachi(prog)
    controlla(`«${l.nome}»: il gradino «${p.che}» non si riprende quello che era già stato dato`,
              qui >= date, `${qui} righe intere dopo ${date}`)
    date = qui
  }
  /* e la soluzione svelata vince: la si paga duecento monete */
  controlla(`«${l.nome}»: la soluzione svelata vince tutti gli ordini`, provaLivello(l, prog).vinto)
  controlla(`«${l.nome}»: il pezzo non è già tutta la soluzione`,
            !scala.some(p => p.che === PEZZO) ||
            JSON.stringify(applica(null, scala.find(p => p.che === PEZZO)).principale) !==
            JSON.stringify(applica(null, scala.find(p => p.che === SVELA)).principale) ||
            scala.find(p => p.che === PEZZO).sostituisce === 'progetti')
}
{
  const s = scalaDelCostruttore(LIBERO)
  controlla('nel cantiere libero i consigli sono tutti gratis, e non c\'è niente da svelare',
            s.length > 0 && s.every(p => p.prezzo === 0))
}

/* ══════════ 3. Passo passo ══════════ */
{
  const s = scalaDelConiglio()
  uguale('la scala del coniglio: due gratis, tre carte, due pezzi e la strada',
         s.map(p => p.prezzo).join(' '), '0 0 10 10 10 50 100 200')
  uguale('e non ha guasti', guastiDellaScala(s).join('; '), '')
}
for (const [i, t] of CAMPAGNA.entries()) {
  const liv = Livello.da(t)
  const qui = `tappa ${i + 1} «${t.nome}»`
  const frasi = pensieroDi(liv)
  controlla(`${qui}: ha due frasi che fanno ragionare, brevi`,
            frasi.length === 2 && frasi.every(f => f.length > 20 && f.length <= 230), frasi.join(' | '))
  /* dalla fila vuota, pezzo dopo pezzo: a casa con la carota, e nello zaino */
  let fila = []
  for (const q of [1 / 3, 1 / 2, 1]) {
    const p = pezzoDiStrada(liv, fila, q)
    if (!p) break
    controlla(`${qui}: ogni pezzo scrive almeno una carta`, p.quanti >= 1)
    fila = p.fila
  }
  const r = esegui(liv, fila, { eventi: false })
  controlla(`${qui}: i pezzi portano a casa con la carota`, r.esito === TANA && r.carota)
  if (t.zaino) controlla(`${qui}: e stanno nello zaino`, carteDi(fila) <= t.zaino, `${carteDi(fila)} su ${t.zaino}`)
  uguale(`${qui}: a fila che vince, non c'è più niente da scrivere`, pezzoDiStrada(liv, fila, 1), null)
  uguale(`${qui}: e il 🔎 dice di premere ▶`, (dove(liv, fila) || {}).che, 'via')
  /* da una fila sbagliata la strada intera arriva lo stesso */
  const storta = ['su', 'su', 'sinistra', 'giu']
  const tutta = pezzoDiStrada(liv, storta, 1)
  const r2 = tutta && esegui(liv, tutta.fila, { eventi: false })
  controlla(`${qui}: da una fila sbagliata la strada intera arriva a casa`, !!r2 && r2.esito === TANA)
}
{
  /* il 🔎 dice il posto e non la carta */
  const liv = Livello.da(CAMPAGNA[1])
  const d = dove(liv, [])
  controlla('a fila vuota il 🔎 dice di cominciare, e non dice quale carta',
            d && d.che === 'qui' && d.cursore === 0 && !('mossa' in d))
  const sbagliata = dove(liv, ['destra', 'destra', 'destra'])
  controlla('su una fila sbagliata mette il cursore dove comincia il guaio, e spegne quello che segue',
            sbagliata && sbagliata.che === 'qui' && sbagliata.sospette, JSON.stringify(sbagliata))
}

nota('i prezzi stanno in giochi/aiuti.js: il gioco decide cosa fa un gradino, mai quanto costa')
riassunto('La scala degli aiuti')
