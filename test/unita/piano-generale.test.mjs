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
         spostaIn, partiDaCapo, partiParallele, ogniVoce, laSoluzione, soloLaForma, scalaDi }
       from '../../src/views/generale/piano.js'
import { LIVELLI } from '../../src/data/generale.js'

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

/* ---------- 6. il corpo di un ciclo è una fila come le altre ----------
   Da quando il giro non è più un verbo con dentro una lista di punti ma
   un BLOCCO con dentro degli ordini, non serve nessuna funzione sua: le
   vie ci entrano come entrano nei rami di un bivio (`[i, 'corpo', j]`),
   e tutto il resto del file vale già. Questo test lo inchioda. */
{
  const c = { blocco: 'ripeti', corpo: [o('vai', 'a')], finche: { cond: 'vedi' } }
  const p = [c]
  aggiungiIn(p, [0, 'corpo'], o('vai', 'b'))
  uguale('un ordine si aggiunge dentro il ciclo', c.corpo.map(x => x.complemento).join(''), 'ab')
  uguale('e la via ci arriva', ordineIn(p, [0, 'corpo', 1]).complemento, 'b')
  spostaIn(p, [0, 'corpo', 0], 1)
  uguale('dentro il ciclo si sposta come in un ramo',
         c.corpo.map(x => x.complemento).join(''), 'ba')
  togliIn(p, [0, 'corpo', 0])
  uguale('e si toglie', c.corpo.map(x => x.complemento).join(''), 'a')
  const vuoto = [{ blocco: 'ripeti', finche: {} }]
  aggiungiIn(vuoto, [0, 'corpo'], o('vai', 'z'))
  uguale('un ciclo senza corpo se lo fa nascere', vuoto[0].corpo.length, 1)
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

/* ---------- 8. la scala degli aiuti ----------
   Gli ultimi due gradini scrivono nel piano, e quello che scrivono
   viene dalle soluzioni dichiarate dal livello. Due cose vanno provate
   qui, perché sbagliate non si notano finché un bambino non preme quel
   tasto: che la FORMA sia davvero solo la forma (niente bersagli, ma
   tutta la disposizione), e che i livelli che si giocano una soluzione
   da svelare ce l'abbiano. */
{
  const dentro = [o('vai', 'chiave'), o('prendi', 'chiave')]
  const piano = { eroe: [
    o('vai', 'porta'),
    bivio({ cond: 'vedi', complemento: 'orchi' }, [o('vai', 'sotto')], []),
    { blocco: 'ripeti', corpo: dentro, finche: { cond: 'aperta', complemento: 'grata' } },
    quando('libero', o('apri', 'portone')),
    { blocco: 'routine', nome: 'azione 1', corpo: [o('prendi', 'tesoro')] },
    { verbo: 'aspetta', cond: { cond: 'vedi', complemento: 'orco' } },
  ] }
  const forma = soloLaForma(piano)
  uguale('la forma ha le stesse righe della soluzione',
         ogniVoce(forma.eroe).length, ogniVoce(piano.eroe).length)
  controlla('e nessun bersaglio',
            ogniVoce(forma.eroe).every(v => !v.complemento))
  controlla('nessuna domanda già scritta, né nei bivi né nelle uscite',
            ogniVoce(forma.eroe).every(v =>
              (!v.cond || !v.cond.cond) && (!v.finche || !v.finche.cond)))
  uguale('il bivio resta un bivio, coi suoi due rami', forma.eroe[1].blocco, 'condizione')
  uguale('e il ramo del vero tiene il suo ordine', forma.eroe[1].vero.length, 1)
  uguale('il ciclo tiene il suo corpo', forma.eroe[2].corpo.length, 2)
  uguale('e i verbi ci sono tutti', forma.eroe[2].corpo[0].verbo, 'vai')
  /* il nome di un'azione lo sceglie il gioco: riscriverlo sarebbe un
     compito di copiatura, non un pezzo da capire */
  uguale('il nome dell\'azione resta scritto', forma.eroe[4].nome, 'azione 1')

  /* e la forma non tocca il dato da cui viene: il piano del livello è
     lo stesso oggetto che il banco gioca a ogni build */
  uguale('la soluzione di partenza non si sporca', piano.eroe[0].complemento, 'porta')

  const senza = LIVELLI.filter(l => !laSoluzione(l))
  controlla('ogni livello ha una soluzione da svelare, se serve',
            !senza.length,
            'senza: ' + senza.map(l => l.id).join(', ') +
            ' — lì i due gradini grossi degli aiuti non compaiono')
}

/* ---------- 9. la scala degli aiuti ----------
   Una lista mista di stringhe e gradini diventa una scala sola, e la
   via d'uscita c'è sempre: chi non se l'è scritta se la trova in coda.
   È la cosa che, sbagliata, lascia un bambino chiuso dentro un livello
   con un tasto che non fa niente. */
{
  const finti = { soluzioni: [{ nome: 'x', piano: { eroe: [o('vai', 'a')] } }] }

  const vecchio = scalaDi({ ...finti, aiuti: ['uno', 'due'] })
  uguale('le stringhe di ieri restano gradini a parole', vecchio[0].aiuto, 'dice')
  uguale('e in coda arrivano forma e soluzione', vecchio.length, 4)
  uguale('la forma prima', vecchio[2].aiuto, 'forma')
  uguale('e la soluzione ultima', vecchio[3].aiuto, 'svela')

  const misto = scalaDi({ ...finti, aiuti: [
    { aiuto: 'dice', testo: 'guarda dov’è' },
    { aiuto: 'scrive', piano: { eroe: [o('vai', 'a')] } },
    { aiuto: 'dice', testo: 'e adesso passa' },
    { aiuto: 'svela' },
  ] })
  uguale('una scala scritta a mano resta com’è', misto.length, 4)
  uguale('e i gradini restano nell’ordine dichiarato', misto.map(a => a.aiuto).join(' '),
         'dice scrive dice svela')

  /* chi scrive di suo ma si dimentica la fine se la trova in coda: un
     livello non deve poter diventare un vicolo cieco per distrazione */
  const senzaFine = scalaDi({ ...finti, aiuti: [{ aiuto: 'scrive', piano: {} }] })
  uguale('a chi scrive senza svelare, lo svelamento si aggiunge', senzaFine.length, 2)
  uguale('ed è l’ultimo', senzaFine[1].aiuto, 'svela')

  controlla('le parole non costano niente', misto[0].costa === false)
  controlla('quello che scrive nel piano sì', misto[1].costa === true)

  /* un livello senza soluzione dichiarata non promette una via
     d'uscita che non ha */
  uguale('senza soluzione la scala è solo quello che c’è scritto',
         scalaDi({ aiuti: ['uno'] }).length, 1)
}

nota('il piano si regge senza Vue, senza canvas e senza mondo: sono liste e vie')
riassunto('Il piano del generale')
