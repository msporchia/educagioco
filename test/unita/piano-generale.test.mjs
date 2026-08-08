/* ═══════════════════════════════════════════════════════════════════
   IL PIANO DEL GENERALE, SENZA BROWSER
     node test/unita/piano-generale.test.mjs

   Come si tiene in piedi la fila di ordini di un'unità: le vie che
   ritrovano una voce, aggiungere, togliere, spostare, i due rami di un
   bivio, e la regola per cui un «quando senti» non sta mai dentro
   niente.

   Era logica sepolta in `GeneraleGame.vue`, e per provarla bisognava
   aprire Chrome: nessuno la provava. Adesso sta in
   `views/generale/piano.js` e non tocca né Vue né un canvas.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, riassunto, nota } from '../aiuto/verifica.mjs'
import { stessaVia, inRamo, listaIn, listaDi, ordineIn, aggiungiIn, togliIn,
         spostaIn, partiDaCapo, partiParallele, puntiDi, togliDalGiro, ogniVoce }
       from '../../src/views/generale/piano.js'

const o = (verbo, complemento) => ({ verbo, complemento })
const quando = (segnale, ...allora) => ({ verbo: 'quando', complemento: segnale, allora })
const bivio = (cond, vero, falso) =>
  ({ blocco: 'condizione', cond, vero: vero || [], falso: falso || [] })

/* ---------- 1. le vie ---------- */
controlla('due vie uguali sono la stessa via', stessaVia([1, 'vero', 0], [1, 'vero', 0]))
controlla('due vie di lunghezza diversa no', !stessaVia([1], [1, 0]))
controlla('una via nulla non è nessuna via', !stessaVia(null, [1]))
controlla('un percorso che finisce con una parola sta in un ramo', inRamo([2, 'falso']))
controlla('uno che finisce con un numero no', !inRamo([2, 1]))

/* ---------- 2. ritrovare una voce ---------- */
{
  const p = [o('vai', 'chiave'),
             bivio({ cond: 'vedi' }, [o('apri', 'porta')], [o('vai', 'casa')]),
             quando('ora', o('vai', 'uscita'))]

  uguale('la lista del main è quella di partenza', listaIn(p, []).length, 3)
  uguale('dentro un ramo si scende con la parola', listaIn(p, [1, 'vero']).length, 1)
  uguale('dentro un ascolto si scende col numero', listaIn(p, [2]).length, 1)
  uguale('la voce in fondo a una via', ordineIn(p, [1, 'vero', 0]).verbo, 'apri')
  uguale('e quella dentro un ascolto', ordineIn(p, [2, 0]).complemento, 'uscita')
  uguale('la lista che contiene una voce', listaDi(p, [1, 'falso', 0]).length, 1)
  /* una via vecchia — la voce che indicava non c'è più — non deve
     esplodere: deve dire che non porta da nessuna parte */
  uguale('una via che non esiste più non porta da nessuna parte', listaIn(p, [9, 'vero']), null)

  /* un ramo che nei dati non c'è si comporta come un ramo vuoto: un
     ramo vuoto è legittimo, un ramo che non esiste no */
  const b = [bivio({ cond: 'vedi' })]
  uguale('un ramo mai toccato è una lista vuota, non un guasto', listaIn(b, [0, 'falso']).length, 0)
}

/* ---------- 3. aggiungere ---------- */
{
  const p = []
  uguale('il primo ordine nasce nel main', JSON.stringify(aggiungiIn(p, [], o('vai', 'x'))), '[0]')
  const v = aggiungiIn(p, [], bivio({ cond: 'vedi' }))
  uguale('e il bivio dopo di lui', JSON.stringify(v), '[1]')
  aggiungiIn(p, [1, 'vero'], o('apri', 'porta'))
  uguale('dentro il ramo del vero ci finisce quello che gli si dice',
         ordineIn(p, [1, 'vero', 0]).verbo, 'apri')
  uguale('e il ramo del falso resta vuoto', listaIn(p, [1, 'falso']).length, 0)

  /* UN «QUANDO SENTI» NON STA MAI DENTRO NIENTE: è un piano che parte
     da capo, e sta accanto agli altri anche se lo aggiungi mentre stai
     scrivendo dentro un ramo */
  const vq = aggiungiIn(p, [1, 'vero'], { verbo: 'quando', complemento: 'ora' })
  uguale('un «quando senti» nasce sempre in cima al piano, mai dentro un ramo',
         JSON.stringify(vq), '[2]')
  uguale('e nasce con la sua lista pronta', listaIn(p, [2]).length, 0)

  /* un percorso che non porta più da nessuna parte non fa scrivere in
     un array di nessuno: si ricade nel main */
  const vp = aggiungiIn(p, [7, 'vero'], o('vai', 'y'))
  uguale('scrivere in un percorso morto ricade nel main', vp.length, 1)
}

/* ---------- 4. il main e i piani paralleli ----------
   Si vedono separati, ma gli indici restano quelli veri: la via di una
   voce non cambia perché a schermo sta altrove. */
{
  const p = [o('vai', 'a'), quando('ora', o('vai', 'b')), o('apri', 'c')]
  uguale('il main sono gli ordini che non sono ascolti', partiDaCapo(p).length, 2)
  uguale('gli ascolti sono i «quando senti»', partiParallele(p).length, 1)
  uguale('e ognuno si porta dietro il suo indice VERO', partiDaCapo(p)[1].i, 2)
  uguale('anche l\'ascolto', partiParallele(p)[0].i, 1)
}

/* ---------- 5. togliere e spostare ---------- */
{
  const p = [o('vai', 'a'), o('vai', 'b'), o('vai', 'c')]
  uguale('togliere torna il percorso della lista', JSON.stringify(togliIn(p, [1])), '[]')
  uguale('e la voce non c\'è più', p.map(x => x.complemento).join(''), 'ac')

  const q = [o('vai', 'a'), o('vai', 'b'), o('vai', 'c')]
  uguale('spostare in giù torna la via nuova', JSON.stringify(spostaIn(q, [0], 1)), '[1]')
  uguale('e l\'ordine è cambiato', q.map(x => x.complemento).join(''), 'bac')
  uguale('spostare oltre il bordo non fa niente', JSON.stringify(spostaIn(q, [0], -1)), '[0]')
  uguale('e la fila resta quella', q.map(x => x.complemento).join(''), 'bac')

  /* dentro un ramo si sposta dentro il ramo: un ordine non esce dalla
     fila in cui sta */
  const r = [bivio({ cond: 'vedi' }, [o('vai', 'a'), o('vai', 'b')])]
  spostaIn(r, [0, 'vero', 0], 1)
  uguale('anche dentro un ramo', listaIn(r, [0, 'vero']).map(x => x.complemento).join(''), 'ba')
}

/* ---------- 6. i punti di un giro ---------- */
{
  uguale('senza punti, il giro è il suo complemento', puntiDi(o('pattuglia', '3,4')).join(''), '3,4')
  const g = { verbo: 'pattuglia', complemento: '1,1', punti: ['1,1', '2,2', '3,3'] }
  uguale('con i punti, sono quelli', puntiDi(g).length, 3)
  controlla('un punto si può togliere', togliDalGiro(g, 0))
  uguale('e il primo punto diventa il complemento', g.complemento, '2,2')
  const solo = { verbo: 'pattuglia', complemento: '1,1', punti: ['1,1'] }
  controlla('l\'ultimo punto no: un giro senza punti non è un giro', !togliDalGiro(solo, 0))
}

/* ---------- 7. camminare su tutto ---------- */
{
  const p = [o('vai', 'a'),
             bivio({ cond: 'vedi' }, [o('apri', 'b')], [bivio({ cond: 'hai' }, [o('vai', 'c')])]),
             quando('ora', o('vai', 'd'), bivio({ cond: 'vedi' }, [o('vai', 'e')]))]
  const tutte = ogniVoce(p)
  uguale('ogni voce, dovunque stia', tutte.length, 9)
  controlla('anche quelle in fondo a un ramo dentro un ascolto',
            tutte.some(x => x.complemento === 'e'))
  controlla('e quelle dentro un bivio dentro un bivio',
            tutte.some(x => x.complemento === 'c'))
}

nota('il piano si regge senza Vue, senza canvas e senza mondo: sono liste e vie')
riassunto('Il piano del generale')
