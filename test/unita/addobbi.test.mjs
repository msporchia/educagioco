/* GLI ADDOBBI DELLE BESTIE, SENZA BROWSER

   Le cose che questo file difende, e sono decisioni di prodotto:
     1. **si compra, si mette, si toglie** — e togliere non consuma:
        torna nel guardaroba, come tutto il resto della fattoria dove
        niente si perde mai;
     2. **non si mette un cappello a chi non ha la testa** — chi porta
        cosa lo dice la scheda dell'animale, non un elenco di eccezioni
        per specie tenuto a mano;
     3. **uno slot tiene una cosa sola**, e il secondo cappello cambia
        il primo invece di dire di no;
     4. **i punti di attacco esistono in ogni verso che serve**, se no
        un addobbo comprato non si vede da nessuna parte;
     5. **un salvataggio di ieri si riapre senza rompersi**, e senza
        addobbi fantasma addosso a chi non li può portare.
   `node test/esegui.mjs addobbi --niente-build` */
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import {
  ADDOBBI, PER_ID, addobbiPer, staA, addossoA, guastiDegliAddobbi,
} from '../../src/giochi/fattoria/dati/addobbi.js'
import {
  ANIMALI, AGGANCI, AGGANCI_TUTTI, BOB, portaDi, puntiDi, famigliaDi,
  guastiDegliAnimali,
} from '../../src/giochi/fattoria/dati/animali.js'
import { VERSI, fotogrammi } from '../../src/giochi/fattoria/dati/atlante.js'
import { sogliaDi } from '../../src/giochi/fattoria/dati/livelli.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

function borsaTracciata(iniziale) {
  let n = iniziale
  return { quante: () => n, paga: c => { n -= c; return true }, saldo: () => n,
           svuota: () => { n = 0 } }
}

/* Una fattoria con dentro una bestia: gli addobbi si comprano dalla sua
   scheda, quindi senza bestie non c'è niente da provare. */
function conLaBestia(chi, borsa = borsaInfinita()) {
  const f = new Fattoria({ borsa })
  f.speso = sogliaDi((ANIMALI[chi] || {}).liv || 2)
  f.reclamaTutto()
  const r = f.compraBestia(chi, ANIMALI[chi].prezzo, 'Prova')
  if (!r.ok) throw new Error(`${chi} non si compra: ${r.motivo}`)
  return f
}

/* ══════════ 1. i dati stanno in piedi ══════════ */
{
  const g = guastiDegliAddobbi()
  controlla('gli addobbi non hanno guasti', g.length === 0, g.join(' · '))
  const a = guastiDegliAnimali()
  controlla('e nemmeno gli animali', a.length === 0, a.join(' · '))
  controlla('ce n\'è per ogni aggancio',
            AGGANCI_TUTTI.every(d => ADDOBBI.some(x => x.dove === d)))
}

/* ══════════ 2. i punti di attacco ci sono davvero ══════════
   Un addobbo comprato che non si vede da nessuna parte è un acquisto
   che sembra non aver funzionato: ogni aggancio dichiarato deve avere
   un punto **almeno nel verso di fronte**, che è quello che si guarda
   di più. */
{
  for (const chi of Object.keys(ANIMALI))
    for (const dove of portaDi(chi)) {
      const p = puntiDi(chi, dove)
      controlla(`${chi}: «${dove}» sa dove attaccarsi`, !!p)
      controlla(`${chi}: «${dove}» si vede almeno di fronte`, !!(p && p.giu))
      for (const [verso, xy] of Object.entries(p || {}))
        controlla(`${chi}/${verso}/${dove}: il punto sta dentro il riquadro`,
                  xy[0] >= 0 && xy[0] <= 1 && xy[1] >= 0 && xy[1] <= 1,
                  JSON.stringify(xy))
    }
  /* Di spalle il muso non si vede: è una scelta, e vale la pena che sia
     scritta qui — se un giorno comparisse, gli occhialini finirebbero
     sulla nuca. */
  uguale('di spalle il muso non c\'è', AGGANCI.su.muso, undefined)
  controlla('ma di fronte e di lato sì', !!AGGANCI.giu.muso && !!AGGANCI.lato.muso)
  /* Il bob della camminata ha un valore per **ogni fotogramma** di ogni
     verso: uno più corto lascerebbe il cappello fermo su una parte del
     passo, che è peggio di non muoverlo affatto. */
  const quanti = fotogrammi('cane-bobtail', 'giu')
  for (const v of VERSI)
    uguale(`il bob del verso «${v}» copre tutti i fotogrammi`, BOB[v].length, quanti)
  nota(`${quanti} fotogrammi per verso, bob di fronte ${BOB.giu.join('/')}`)
}

/* ══════════ 3. si compra, si mette, si toglie ══════════ */
{
  const borsa = borsaTracciata(500)
  const f = conLaBestia('cane-bobtail', borsa)
  const dopoIlCane = borsa.saldo()

  uguale('il guardaroba nasce vuoto', Object.keys(f.guardaroba).length, 0)
  const c = f.compraAddobbo('cilindro')
  controlla('un cilindro si compra', c.ok, c.motivo)
  uguale('e si paga', borsa.saldo(), dopoIlCane - PER_ID.cilindro.prezzo)
  uguale('e finisce in guardaroba', f.quantiAddobbi('cilindro'), 1)
  /* Comprare in fattoria è esperienza, come tutto il resto: è il gesto
     che il livello premia (`dati/livelli.js`). */
  controlla('e quello che è costato è esperienza',
            f.speso >= PER_ID.cilindro.prezzo)

  const v = f.vestiBestia('cane-bobtail', 'cilindro')
  controlla('e si mette addosso', v.ok, v.motivo)
  uguale('esce dal guardaroba', f.quantiAddobbi('cilindro'), 0)
  uguale('e sta sulla testa', f.addobbiDi('cane-bobtail').testa, 'cilindro')
  uguale('chi disegna riceve la figura e la taglia',
         JSON.stringify(f.comeEVestita('cane-bobtail')),
         JSON.stringify([{ id: 'cilindro', dove: 'testa', testo: '🎩', misura: 11 }]))

  /* Togliere **non consuma**: torna in guardaroba e si rimette quando
     si vuole. È la regola di tutta la fattoria — niente si perde mai. */
  const t = f.spogliaBestia('cane-bobtail', 'testa')
  controlla('si toglie', t.ok)
  uguale('e torna nel guardaroba', f.quantiAddobbi('cilindro'), 1)
  uguale('senza costare niente', borsa.saldo(), dopoIlCane - PER_ID.cilindro.prezzo)
  uguale('e la bestia non porta più niente',
         f.comeEVestita('cane-bobtail').length, 0)
}

/* Uno slot tiene una cosa sola: il secondo cappello **cambia** il
   primo. Un rifiuto lì sarebbe la risposta giusta a una domanda che
   nessuno ha fatto. */
{
  const f = conLaBestia('cane-bobtail')
  f.compraAddobbo('cilindro'); f.compraAddobbo('cappellino')
  f.vestiBestia('cane-bobtail', 'cilindro')
  const r = f.vestiBestia('cane-bobtail', 'cappellino')
  controlla('il secondo cappello si mette lo stesso', r.ok, r.motivo)
  uguale('e dice quale ha tolto', r.tolto, 'cilindro')
  uguale('quello di prima torna nel guardaroba', f.quantiAddobbi('cilindro'), 1)
  uguale('e in testa c\'è il nuovo', f.addobbiDi('cane-bobtail').testa, 'cappellino')
  uguale('rimetterlo due volte non fa niente',
         f.vestiBestia('cane-bobtail', 'cappellino').motivo, 'gia-addosso')

  /* Agganci diversi convivono: un cappello **e** una sciarpa. */
  f.compraAddobbo('sciarpa')
  controlla('una sciarpa sta insieme al cappello',
            f.vestiBestia('cane-bobtail', 'sciarpa').ok)
  uguale('e la bestia ne porta due', f.comeEVestita('cane-bobtail').length, 2)
  /* L'ordine è quello degli agganci, non quello in cui li hai messi:
     chi disegna li mette in scena sempre uguali. */
  uguale('nell\'ordine degli agganci',
         f.comeEVestita('cane-bobtail').map(a => a.dove).join(' '), 'testa collo')
}

/* ══════════ 4. quello che non gli sta ══════════
   Il controllo che il committente ha chiesto per nome: **non si mette
   un cappello a chi non ha la testa nel catalogo**. Due rifiuti
   diversi, e la differenza conta — uno è il disegno (il pappagallo ha
   le ali, non una schiena), l'altro è il gusto (la campanella è dei
   gatti). */
{
  const f = conLaBestia('pappagallo')
  controlla('il pappagallo non porta niente sulla schiena',
            !portaDi('pappagallo').includes('schiena'))
  const c = f.compraAddobbo('mantellina')
  controlla('la mantellina si compra lo stesso', c.ok)
  const r = f.vestiBestia('pappagallo', 'mantellina')
  uguale('ma addosso al pappagallo non ci va', r.ok, false)
  uguale('e dice perché', r.motivo, 'non-gli-sta')
  uguale('la mantellina resta in guardaroba', f.quantiAddobbi('mantellina'), 1)
  controlla('e nel suo vestiario non compare affatto',
            !addobbiPer('pappagallo').some(a => a.id === 'mantellina'))
  controlla('mentre un cappellino sì',
            addobbiPer('pappagallo').some(a => a.id === 'cappellino'))

  uguale('la campanella è dei gatti', staA('campanella', 'pappagallo'), false)
  uguale('e infatti a un cane non sta', staA('campanella', 'cane-bobtail'), false)
  uguale('mentre al gatto sì', staA('campanella', 'gatto-tuxedo'), true)
  nota(`al pappagallo stanno ${addobbiPer('pappagallo').length} addobbi su ${ADDOBBI.length}`)
}

/* E quello che non hai non si mette: si compra prima. Il motore lo dice
   con la parola giusta, perché «non ce l'hai» si risolve comprando e
   «non gli sta» no. */
{
  const f = conLaBestia('cane-bobtail')
  const r = f.vestiBestia('cane-bobtail', 'fiocco')
  uguale('un addobbo che non hai non si mette', r.ok, false)
  uguale('e dice quanto costa', r.motivo, 'non-ce-lhai')
  uguale('col suo prezzo', r.costo, PER_ID.fiocco.prezzo)

  /* Si svuota **dopo** aver comprato la bestia: quello che si prova qui
     è il prezzo dell'addobbo, non quello del cane. */
  const borsa = borsaTracciata(500)
  const povera = conLaBestia('cane-bobtail', borsa)
  borsa.svuota()
  uguale('e a zero monete non si compra',
         povera.compraAddobbo('fiocco').motivo, 'poche-monete')
  uguale('e non è finito in guardaroba', povera.quantiAddobbi('fiocco'), 0)

  /* Una bestia che non è tua non si veste, e un addobbo che non esiste
     nemmeno: un motore che accetta tutto è un buco, e questo motore lo
     usa anche chi scrive un test. */
  uguale('una bestia che non hai non si veste',
         f.vestiBestia('gatto-nero', 'fiocco').motivo, 'non-e-tua')
  uguale('e un addobbo inventato non esiste',
         f.vestiBestia('cane-bobtail', 'sombrero').motivo, 'non-esiste')
}

/* ══════════ 5. un salvataggio si riapre uguale ══════════ */
{
  const f = conLaBestia('gatto-tuxedo')
  f.compraAddobbo('campanella'); f.compraAddobbo('cilindro')
  f.vestiBestia('gatto-tuxedo', 'campanella')

  const dato = JSON.parse(JSON.stringify(f.serializza()))
  const g = new Fattoria({ borsa: borsaInfinita(), dato })
  uguale('quello che ha addosso si rilegge',
         g.addobbiDi('gatto-tuxedo').collo, 'campanella')
  uguale('e il guardaroba pure', g.quantiAddobbi('cilindro'), 1)

  /* Un salvataggio di ieri non ha né guardaroba né addobbi: si apre
     nudo e non si rompe. */
  delete dato.guardaroba
  for (const b of dato.bestie) delete b.addobbi
  const vecchia = new Fattoria({ borsa: borsaInfinita(), dato })
  uguale('una fattoria di ieri non ha guardaroba',
         Object.keys(vecchia.guardaroba).length, 0)
  uguale('né bestie vestite', vecchia.comeEVestita('gatto-tuxedo').length, 0)

  /* Un addobbo addosso a chi oggi non lo può più portare **torna nel
     guardaroba**, non sparisce: sarebbe una cosa comprata che non si
     vede e non si può togliere. */
  const storto = JSON.parse(JSON.stringify(f.serializza()))
  storto.bestie[0].addobbi = { schiena: 'mantellina', testa: 'sombrero' }
  storto.guardaroba = { ...storto.guardaroba, mantellina: 0 }
  const pulita = new Fattoria({ borsa: borsaInfinita(), dato: storto })
  uguale('un addobbo che non esiste più si butta',
         pulita.addobbiDi('gatto-tuxedo').testa, undefined)
  uguale('ma la mantellina il gatto la porta',
         pulita.addobbiDi('gatto-tuxedo').schiena, 'mantellina')

  const suPappagallo = JSON.parse(JSON.stringify(f.serializza()))
  suPappagallo.bestie = [{ chi: 'pappagallo', nome: 'Coco', x: 20, y: 20,
                           addobbi: { schiena: 'mantellina' } }]
  const senza = new Fattoria({ borsa: borsaInfinita(), dato: suPappagallo })
  uguale('quello che il pappagallo non può portare gli esce di dosso',
         senza.comeEVestita('pappagallo').length, 0)
  uguale('e torna nel guardaroba', senza.quantiAddobbi('mantellina'), 1)
}

/* ══════════ 6. i prezzi stanno nella loro fascia ══════════
   `CALIBRAZIONE.md`: un addobbo è **una cosetta**, da uno a cinque
   minuti di esercizi. Fuori da lì non è caro o economico, è nella scala
   sbagliata — e un cappello che costa quanto un pollaio mette una
   decorazione in concorrenza con la catena. */
{
  const caro = Math.max(...ADDOBBI.map(a => a.prezzo))
  const misero = Math.min(...ADDOBBI.map(a => a.prezzo))
  controlla(`il più caro costa 🪙${caro}, cioè ${(caro / 6).toFixed(1)} minuti di esercizi`,
            caro <= 30)
  controlla(`e il più economico 🪙${misero}`, misero >= 6)
  /* Tutti insieme restano sotto una bestia: vestire non deve costare
     più che avere. */
  const tutti = ADDOBBI.reduce((n, a) => n + a.prezzo, 0)
  const bestia = Math.min(...Object.values(ANIMALI).map(a => a.prezzo))
  controlla(`il guardaroba intero (🪙${tutti}) costa più di una bestia (🪙${bestia})`,
            tutti > bestia)
  nota(`${ADDOBBI.length} addobbi, da 🪙${misero} a 🪙${caro}`)
}

/* E `addossoA` è puro: la stessa mappa dà sempre la stessa lista. */
{
  const uno = addossoA({ testa: 'corona', collo: 'fiocco' })
  uguale('due addobbi diventano due righe', uno.length, 2)
  uguale('nell\'ordine degli agganci', uno.map(a => a.dove).join(' '), 'testa collo')
  uguale('e una mappa vuota non dà niente', addossoA({}).length, 0)
  uguale('e un id inventato si salta', addossoA({ testa: 'sombrero' }).length, 0)
  uguale('la famiglia si ricava dal nome dello sprite',
         famigliaDi('gatto-tuxedo'), 'gatto')
}

riassunto('Gli addobbi delle bestie')
