/* ═══════════════════════════════════════════════════════════════════
   COME STA ANDANDO — l'elenco, i cuori e l'ordine

   La scheda mette insieme due cose che esistevano già e non si erano
   mai guardate insieme: il conto delle risposte (`store/srs.js`) e il
   catalogo delle domande. Quello che si può sbagliare non è metterle
   insieme, è **cosa si dichiara quando i dati sono pochi** e **in che
   ordine si legge l'elenco** — due regole con dentro una soglia, cioè
   esattamente la roba che non si prova col telefono in mano.

   `node test/esegui.mjs andamento --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { andamentoDi, riassuntoDi, rigaDi, cuoriPer, CUORI }
  from '../../src/quiz/andamento.js'
import { MINIME } from '../../src/quiz/consiglio.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* due classi della stessa tipologia — «le ore intere» al grado 1 e al 4 —
   più altre tre tipologie, ognuna con la sua storia */
const CLASSI = [
  { tipo: 'ora:intere', nome: 'Le ore intere', icona: '🕐', nomeModulo: 'L\'orologio',
    anni: 6, sorgente: { modulo: 'x', grado: 1 }, gruppo: 'orologio', gruppoNome: 'L\'orologio' },
  { tipo: 'ora:intere', nome: 'Le ore intere', icona: '🕐', nomeModulo: 'L\'orologio',
    anni: 8, sorgente: { modulo: 'x', grado: 4 }, gruppo: 'orologio', gruppoNome: 'L\'orologio' },
  { tipo: 'orto:doppie', nome: 'Le doppie', icona: '🅰️', nomeModulo: 'Ortografia', anni: 7 },
  { tipo: 'mat:frazioni', nome: 'Le frazioni', icona: '🔢', nomeModulo: 'Frazioni', anni: 9 },
  { tipo: 'geo:solidi', nome: 'I solidi', icona: '📐', nomeModulo: 'Geometria', anni: 10 },
  /* un modulo vecchio, senza tipologia: non ha un conto suo e non entra */
  { tipo: null, nome: 'Roba di prima', anni: 7 },
]
const ITEMS = {
  'ora:intere': { ok: 18, err: 2, seen: 20, t: 3400, last: 1000 },   // va benissimo
  'orto:doppie': { ok: 3, err: 7, seen: 10, t: 9100, last: 2000 },   // va male
  'mat:frazioni': { ok: 1, err: 2, seen: 3, t: 12000, last: 3000 },  // poche prove
  /* geo:solidi non c'è: mai incontrata */
}

/* ══════════ 1. i cuori ══════════ */
uguale('tutte giuste sono cinque cuori', cuoriPer(1), CUORI)
uguale('metà sono tre', cuoriPer(0.5), 3)
/* zero cuori accanto a un nome si legge «questo bambino non vale
   niente», e non è quello che dice il numero */
uguale('e zero giuste è **un** cuore, mai nessuno', cuoriPer(0), 1)

/* ══════════ 2. una riga sola ══════════ */
{
  const r = rigaDi('ora:intere', CLASSI.slice(0, 2), ITEMS['ora:intere'])
  uguale('il conto è quello della tipologia', r.quante, 20)
  uguale('la quota è giuste su tutte', Math.round(r.quota * 100), 90)
  uguale('cinque cuori', r.cuori, 5)
  uguale('con venti prove il verdetto non è debole', r.poche, false)
  /* due classi, due età: si dice l'intervallo, perché un numero solo
     sarebbe una media che non corrisponde a nessuna domanda vera */
  uguale('l\'età va da', r.da, 6)
  uguale('a', r.a, 8)
  uguale('il tempo è in secondi con un decimale', r.secondi, 3.4)
  controlla('e c\'è da dove rigenerare la domanda', !!r.sorgente)
}
{
  const r = rigaDi('mat:frazioni', [CLASSI[3]], ITEMS['mat:frazioni'])
  uguale('tre prove: il segnale c\'è', r.quante, 3)
  controlla('ma il verdetto è dichiarato debole', r.poche,
            `${r.quante} prove, minime ${MINIME}`)
  uguale('e non è «mai vista»', r.mai, false)
}
{
  const r = rigaDi('geo:solidi', [CLASSI[4]], undefined)
  uguale('quella mai incontrata non ha prove', r.quante, 0)
  uguale('né cuori', r.cuori, 0)
  uguale('e lo dice', r.mai, true)
  uguale('e non si spaccia per debole: è un\'altra cosa', r.poche, false)
}

/* ══════════ 3. l'ordine, che è il contenuto ══════════ */
{
  const e = andamentoDi(CLASSI, ITEMS)
  uguale('le due classi della stessa tipologia sono una riga sola', e.viste.length, 3)
  uguale('la peggiore è in cima', e.viste[0].tipo, 'orto:doppie')
  uguale('la migliore in fondo alle viste', e.viste[2].tipo, 'ora:intere')
  uguale('e la mai incontrata sta in coda a tutto', e.tutte[e.tutte.length - 1].tipo, 'geo:solidi')
  controlla('il modulo senza tipologia resta fuori',
            !e.tutte.some(r => r.nome === 'Roba di prima'))

  /* a parità di quota vince chi ha più prove alle spalle: fra due 50%,
     quello su cui c'è più da dire è quello con venti risposte */
  const pari = andamentoDi(
    [{ tipo: 'a:x', nome: 'A', anni: 7 }, { tipo: 'b:y', nome: 'B', anni: 7 }],
    { 'a:x': { ok: 4, err: 4 }, 'b:y': { ok: 10, err: 10 } })
  uguale('a parità di quota, prima quella con più prove', pari.viste[0].tipo, 'b:y')
}

/* ══════════ 4. il riassunto in cima ══════════ */
{
  const r = riassuntoDi(andamentoDi(CLASSI, ITEMS))
  uguale('tre tipologie incontrate', r.incontrate, 3)
  uguale('una mai vista', r.mai, 1)
  uguale('trentatré risposte in tutto', r.risposte, 33)
  uguale('una che va male', r.male, 1)
  uguale('una che va benissimo', r.bene, 1)
  /* le tre prove delle frazioni non contano né di qua né di là: è il
     senso della soglia, e un riassunto che le contasse direbbe più di
     quello che sa */
  uguale('e quella da tre prove non è contata da nessuna parte',
         r.male + r.bene, 2)
}

nota(`la soglia del verdetto è ${MINIME} risposte, la stessa di consiglio.js`)
riassunto('come sta andando')
