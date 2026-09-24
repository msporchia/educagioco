/* Verifica del costruttore, senza browser. Le cose che contano:

     1. i dati stanno in piedi (colori, livelli, campagna, albo);
     2. le regole del mondo sono quelle dichiarate — il mattone dov'è il
        robot, mai due nella stessa casella, l'omino che sale uno e cade
        tre — perché un mondo che non si può prevedere non si programma;
     3. l'esecutore fa quello che dice: le misure si calcolano con le
        lavagnette di chi chiama, le lavagnette dell'ordine non si
        scrivono, la ricorsione è vera, e un ripeti infinito si ferma;
     4. **ogni livello si vince** con la sua soluzione su tutti gli
        ordini, e **ogni mossa ingenua ne perde almeno uno** — è questo
        che dice che il livello insegna quello che dichiara;
     5. le modifiche dell'editor non lasciano mai un programma rotto;
     6. i traguardi scattano;
     7. i progetti servono davvero: dove un livello li insegna, la sua
        soluzione srotolata — le chiamate sostituite dal corpo — non sta
        nello zaino, e gli attrezzi entrano chiusi e non si contano.
   `node test/esegui.mjs costruttore` */
import { COLORI, guastiDeiColori } from '../../src/giochi/costruttore/dati/colori.js'
import { LIVELLI, CAPITOLI, guastiDeiLivelli } from '../../src/giochi/costruttore/dati/livelli.js'
import { CAMPAGNA, guastiDellaCampagna, FILE, FILA_ATTUALE, riordina } from '../../src/giochi/costruttore/dati/campagna.js'
import { fai, guarda, confronta, piu, meno, N, tinta, progetto, programma, istruzioni, copia }
  from '../../src/giochi/costruttore/dati/scrivi.js'
import { Mondo, camminaOmino } from '../../src/giochi/costruttore/motore/mondo.js'
import { Esecuzione, TETTO_PILA, fraseDi, PERCHE } from '../../src/giochi/costruttore/motore/esecutore.js'
import { provaLivello } from '../../src/giochi/costruttore/motore/prova.js'
import * as mod from '../../src/giochi/costruttore/motore/modifica.js'
import { conAttrezzi } from '../../src/giochi/costruttore/motore/attrezzi.js'
import { righeDi, righeScritte, srotola, ciSta } from '../../src/giochi/costruttore/motore/zaino.js'
import { torre } from '../../src/giochi/costruttore/dati/attrezzi.js'
import manifesto from '../../src/giochi/costruttore/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { misure, statoTraguardo } from '../../src/store/progressi.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati ══════════ */
for (const [nome, g] of [['colori', guastiDeiColori()], ['livelli', guastiDeiLivelli()],
                         ['campagna', guastiDellaCampagna()], ['albo', guastiDellAlbo([manifesto])]])
  controlla(`${nome}: nessun guasto`, g.length === 0, g.join(' · '))
controlla('almeno venti livelli', LIVELLI.length >= 20, `sono ${LIVELLI.length}`)
uguale('nove capitoli', CAPITOLI.length, 9)
uguale('il «se» arriva subito dopo il cantiere', CAPITOLI[1].chiave, 'guardare')
stessaLista('il porto viene dopo le lavagnette, coi suoi posti; poi le sfide, le giornate, e in fondo le lettere in ordine',
            CAPITOLI.slice(3).map(c => c.chiave), ['lavagnette', 'porto', 'posti', 'sfide', 'giornate', 'ordine'])
controlla('nel porto almeno quattordici sfide, contando le giornate', LIVELLI.filter(l => l.mondo === 'porto').length >= 14)
controlla('la fila di adesso è scritta in FILE: chi aggiunge un livello in mezzo alza la versione',
          LIVELLI.slice(0, FILE[FILA_ATTUALE].length).map(l => l.chiave).join() === FILE[FILA_ATTUALE].join())
/* le lettere del postino sono numeri, e lì i colori non c'entrano */
controlla('e ogni capitolo dopo il primo ha almeno un livello con più di un colore',
          CAPITOLI.slice(1).filter(c => c.chiave !== 'ordine')
            .every(c => LIVELLI.some(l => l.capitolo === c.chiave && l.colori.length > 1)))
controlla('le lettere in ordine usano il confronto fra due numeri, che prima non usava nessuno',
          LIVELLI.filter(l => l.capitolo === 'ordine').every(l => [...istruzioni(l.soluzione)].some(i => i.cond && i.cond.tipo === 'confronta')))
uguale('la campagna è i livelli, in fila', CAMPAGNA.map(t => t.chiave).join(), LIVELLI.map(l => l.chiave).join())
controlla('il gioco è in prova', manifesto.sperimentale === true)

/* ══════════ 2. il mondo: il robot cammina e cade ══════════ */
const esegui = (prog, righe, opz = {}) => {
  const m = Mondo.daMappa(righe, opz)
  const es = new Esecuzione(programma(prog), m, { lavagnette: opz.lavagnette || {} })
  const ultimo = es.finoInFondo()
  return { m, es, ultimo }
}
const fatti = (prog, righe) => {
  const es = new Esecuzione(programma(prog), Mondo.daMappa(righe))
  const tutti = []
  for (let e = es.prossimo(); ; e = es.prossimo()) { tutti.push(e); if (e.tipo === 'fine' || e.tipo === 'errore') break }
  return tutti
}
{
  const r = esegui({ principale: [fai.metti('rosso'), fai.vai('destra', 1), fai.metti('blu')] },
                   ['.....', '@....', '#####'])
  uguale('il mattone va sotto i piedi', r.m.mattoneDi(0, 1), 'rosso')
  uguale('e il secondo un passo più in là: dal primo si scende da soli', r.m.mattoneDi(1, 1), 'blu')
  uguale('e il robot ci sta sopra', `${r.m.robot.x},${r.m.robot.y}`, '1,0')
  uguale('il programma finisce', r.ultimo.tipo, 'fine')

  const parte = Mondo.daMappa(['@...', '....', '....', '####'])
  uguale('il robot parte coi piedi per terra, anche se la mappa lo mette in alto', parte.robot.y, 2)

  const torre = esegui({ principale: [fai.metti('rosso'), fai.metti('rosso'), fai.metti('rosso')] },
                       ['....', '....', '....', '@...', '####'])
  uguale('mettere sotto i piedi è salire: tre mattoni, una torre', [1, 2, 3].filter(y => torre.m.mattoneDi(0, y)).length, 3)
  const testa = esegui({ principale: [fai.metti('rosso'), fai.metti('rosso')] }, ['.', '@', '#'])
  uguale('senza posto sopra la testa non si sale', testa.ultimo.motivo, 'testa')
  controlla('e lo dice con una frase', typeof testa.ultimo.frase === 'string' && testa.ultimo.frase.length > 10)

  const giu = [fai.metti('rosso'), fai.metti('rosso'), fai.vai('destra', 1)]
  const cade = esegui({ principale: giu }, ['...', '...', '@..', '###'])
  uguale('un passo nel vuoto e si cade fino a terra', `${cade.m.robot.x},${cade.m.robot.y}`, '1,2')
  uguale('e la caduta si vede, cella per cella',
         fatti({ principale: giu }, ['...', '...', '@..', '###']).filter(e => e.tipo === 'muovi' && e.come === 'cade').length, 2)

  const sale = esegui({ principale: [fai.vai('destra', 2)] }, ['....', '@.R.', '####'])
  uguale('un gradino alto uno si sale', `${sale.m.robot.x},${sale.m.robot.y}`, '2,0')
  const muro = esegui({ principale: [fai.vai('destra', 2)] }, ['..R.', '@.R.', '####'])
  uguale('un muro alto due ferma il robot', muro.ultimo.motivo, 'muro')

  const acqua = esegui({ principale: [fai.vai('destra', 1)] }, ['@...', '#~##'])
  uguale('nell\'acqua non si cammina', acqua.ultimo.motivo, 'splash')
  const ponte = esegui({ principale: [fai.metti('marrone', 'giu-destra'), fai.vai('destra', 2)] }, ['@...', '#~##'])
  uguale('un mattone in basso a destra è dove andrà il piede: un pezzo di ponte', ponte.m.mattoneDi(1, 1), 'marrone')
  uguale('e ci si cammina sopra', `${ponte.m.robot.x},${ponte.m.robot.y}`, '2,0')
  const lato = esegui({ principale: [fai.metti('marrone', 'giu-sinistra')] }, ['.@.', '###'])
  uguale('in basso a sinistra, sul terreno, non si posa', lato.ultimo.motivo, 'terreno')
  uguale('dove c\'è già un mattone non se ne mette un altro',
         esegui({ principale: [fai.metti('rosso', 'giu-destra')] }, ['@...', '#R..', '####']).ultimo.motivo, 'gia-mattone')

  const fuori = esegui({ principale: [fai.vai('sinistra', 1)] }, ['@..', '###'])
  uguale('fuori dal cantiere non si va', fuori.ultimo.motivo, 'fuori')

  const occhi = esegui({ principale: [
    fai.se(guarda('giu-destra', 'acqua'), [fai.metti('blu', 'giu-destra')], [fai.metti('giallo', 'giu-destra')]),
    fai.se(guarda('sotto', 'terreno'), [fai.metti('rosso')]),
    fai.se(guarda('sopra', 'bordo'), [fai.vai('destra', 1)]),
  ] }, ['...', '...', '@..', '#~#'])
  uguale('«se in basso a destra c\'è l\'acqua», altrimenti…', occhi.m.mattoneDi(1, 3), 'blu')
  uguale('«se sotto i piedi c\'è il terreno»', occhi.m.mattoneDi(0, 2), 'rosso')
  uguale('sopra la testa non c\'è il bordo: il robot resta sulla sua torre', occhi.m.robot.x, 0)

  const enne = esegui({ principale: [fai.ripeti(N(), [fai.metti('rosso')])] }, ['...', '@..', '###'])
  uguale('con una N da scegliere il robot non parte', enne.ultimo.motivo, 'n-da-scegliere')
  const senza = esegui({ principale: [fai.se(null, [])] }, ['@..', '###'])
  uguale('né con una domanda da scegliere', senza.ultimo.motivo, 'condizione-da-scegliere')

  /* i colori: il robot li guarda, un progetto li riceve */
  const pav = esegui({ principale: [fai.ripeti(3, [fai.vai('destra', 1),
    fai.se(guarda('sotto', 'mattone', true, 'rosso'), [fai.metti('giallo')], [fai.metti('verde')])])] },
    ['....', '....', '@RBR', '####'])
  uguale('«se sotto i piedi c\'è un mattone rosso», altrimenti…',
         [1, 2, 3].map(x => pav.m.mattoneDi(x, 1)).join(' '), 'giallo verde giallo')
  const banda = {
    progetti: [progetto('banda', { misure: ['tinta'], tipi: { tinta: 'colore' } }, [fai.metti(tinta('tinta'))])],
    principale: [fai.chiama('banda', 'viola'), fai.vai('destra', 1), fai.chiama('banda', 'sinistra')],
  }
  const b = esegui(banda, ['...', '@..', '###'], { lavagnette: { sinistra: 'verde' } })
  uguale('una misura che è un colore: scritto per esteso, o preso da una lavagnetta dell\'ordine',
         `${b.m.mattoneDi(0, 1)} ${b.m.mattoneDi(1, 1)}`, 'viola verde')
  const scambio = esegui({ principale: [fai.ripeti('sinistra', [])] }, ['@..', '###'], { lavagnette: { sinistra: 'verde' } })
  uguale('un colore dove ci va un numero ferma il robot', scambio.ultimo.motivo, 'non-un-numero')
  const scambio2 = esegui({ principale: [fai.metti(tinta('lungo'))] }, ['...', '@..', '###'], { lavagnette: { lungo: 3 } })
  uguale('e un numero dove ci va un colore', scambio2.ultimo.motivo, 'non-un-colore')
  controlla('e la frase dice quale ci voleva', /qui ci va un colore/.test(scambio2.ultimo.frase), scambio2.ultimo.frase)
}

/* ══════════ 2-bis. l'omino ══════════ */
{
  const prova = righe => camminaOmino(Mondo.daMappa(righe))
  uguale('l\'omino sale un gradino alto uno', prova(['.....', 'P.#.F', '#####']).esito, 'arrivato')
  uguale('un muro alto due lo ferma', prova(['..#..', 'P.#.F', '#####']).esito, 'muro')
  uguale('scende da tre', prova(['P...', '#...', '#...', '#..F', '####']).esito, 'arrivato')
  uguale('da quattro si fa male', prova(['P...', '#...', '#...', '#...', '#..F', '####']).esito, 'caduta')
  uguale('l\'acqua non regge', prova(['P...F', '##~##']).esito, 'splash')
  uguale('un mattone sull\'acqua sì', prova(['P...F', '##M##']).esito, 'arrivato')
}

/* ══════════ 3. l'esecutore ══════════ */
{
  /* le misure si calcolano con le lavagnette di chi chiama, prima di
     aprire la carta */
  const r = esegui({
    lavagnette: ['h'],
    progetti: [progetto('col', { misure: ['alta'] }, [fai.ripeti('alta', [fai.metti('rosso')])])],
    principale: [fai.assegna('h', 2), fai.chiama('col', piu('h', 1)), fai.vai('destra', 1)],
  }, ['...', '...', '...', '...', '@..', '###'])
  uguale('colonna(h + 1) con h = 2 fa tre mattoni',
         [1, 2, 3, 4].filter(y => r.m.mattoneDi(0, y)).length, 3)
  uguale('e un passo dopo il robot è di nuovo a terra', r.m.robot.y, 4)

  const ordine = esegui({ principale: [fai.assegna('lungo', 3)] }, ['@..', '###'], { lavagnette: { lungo: 5 } })
  uguale('le lavagnette dell\'ordine non si scrivono', ordine.ultimo.motivo, 'lavagnetta-ordine')

  const misura = esegui({
    progetti: [progetto('p', { misure: ['a'] }, [fai.assegna('a', 1)])],
    principale: [fai.chiama('p', 2)],
  }, ['@..', '###'])
  uguale('le misure di un progetto non si scrivono', misura.ultimo.motivo, 'misura-fissa')

  const ignota = esegui({ principale: [fai.vai('destra', 'boh')] }, ['@..', '###'])
  uguale('una lavagnetta che non c\'è ferma il robot', ignota.ultimo.motivo, 'lavagnetta-sconosciuta')
  controlla('e la frase la nomina', ignota.ultimo.frase.includes('boh'), ignota.ultimo.frase)

  const neg = esegui({ principale: [fai.vai('destra', meno(1, 3))] }, ['@..', '###'])
  uguale('passi sotto zero: il robot non li fa', neg.ultimo.motivo, 'negativo')

  const infinito = esegui({ principale: [fai.finche(guarda('qui', 'terreno'), [])] }, ['@..', '###'])
  uguale('un «ripeti · smetti quando» che non smette mai si ferma da solo', infinito.ultimo.motivo, 'stanco')

  const pozzo = esegui({
    progetti: [progetto('giu', {}, [fai.chiama('giu')])],
    principale: [fai.chiama('giu')],
  }, ['@..', '###'])
  uguale('un progetto che chiama sé stesso senza fine si ferma anche lui', pozzo.ultimo.motivo, 'pila')

  /* la ricorsione vera: una scala scritta come «scala(n) = colonna(n),
     poi scala(n - 1)» */
  const scala = esegui({
    progetti: [
      progetto('col', { misure: ['alta'] }, [fai.ripeti('alta', [fai.metti('giallo')])]),
      progetto('scala', { misure: ['k'] }, [
        fai.se(confronta('k', '>', 0), [fai.chiama('col', 'k'), fai.vai('destra', 1), fai.chiama('scala', meno('k', 1))])]),
    ],
    principale: [fai.chiama('scala', 3)],
  }, ['....', '....', '....', '....', '@...', '####'])
  uguale('la ricorsione finisce', scala.ultimo.tipo, 'fine')
  stessaLista('e costruisce la scala al contrario: 3, 2, 1',
              [0, 1, 2].map(x => [1, 2, 3, 4].filter(y => scala.m.mattoneDi(x, y)).length), [3, 2, 1])

  /* i fatti, uno per uno: è quello che la vista anima */
  const es = new Esecuzione(programma({ principale: [fai.vai('destra', 2), fai.metti('rosso')] }),
                            Mondo.daMappa(['....', '@...', '####']))
  const tipi = []
  for (let e = es.prossimo(); ; e = es.prossimo()) { tipi.push(e.tipo); if (e.tipo === 'fine' || e.tipo === 'errore') break }
  stessaLista('i fatti di «vai a destra 2, metti»: il mattone, e il robot che ci sale', tipi,
              ['riga', 'muovi', 'muovi', 'riga', 'metti', 'muovi', 'fine'])
  uguale('dopo la fine, la fine', es.prossimo().tipo, 'fine')

  controlla('ogni motivo ha la sua frase',
            Object.keys(PERCHE).every(k => fraseDi({ motivo: k, nome: 'x', quanto: -1, vuole: 1, date: 2 }).length > 10))
  controlla('il tetto della pila è ragionevole', TETTO_PILA >= 20)
}

/* ══════════ 4. i livelli ══════════ */
const TIPI_DEI_BLOCCHI = { vai: 'vai', metti: 'metti', togli: 'togli', ripeti: 'ripeti', finche: 'finche',
                           se: 'se', assegna: 'assegna', chiama: 'progetti',
                           prendi: 'prendi', posa: 'posa', aspetta: 'aspetta', sempre: 'sempre', pausa: 'pausa' }
for (const l of LIVELLI) {
  const s = provaLivello(l, l.soluzione)
  controlla(`«${l.nome}»: la soluzione vince tutti gli ordini`, s.vinto,
            s.esiti.map((e, i) => `${l.ordini[i].nome}: ${e.esito}${e.errore ? ' — ' + e.errore.frase : ''}`).join(' · '))

  /* una mossa ingenua perde un ordine, o non sta nello zaino: tutte e due
     vogliono dire che il livello non si vince senza quello che insegna */
  for (const f of l.fragili || []) {
    const r = provaLivello(l, f.programma)
    controlla(`«${l.nome}»: la mossa «${f.nome}» perde almeno un ordine, o non sta nello zaino`,
              !r.vinto || !ciSta(conAttrezzi(f.programma, l), l.zaino))
  }
  if (l.ordini.length > 1)
    controlla(`«${l.nome}»: con più ordini c'è almeno una mossa ingenua da far perdere`, (l.fragili || []).length > 0)

  /* la soluzione si scrive con la pulsantiera del livello: un blocco
     che il livello non offre è una soluzione che il bambino non può
     scrivere */
  /* chiamare un attrezzo non vuole «progetti» nella cassetta: gli
     attrezzi hanno un gruppo loro, anche dove un progetto non si scrive */
  const attrezzi = new Set((l.attrezzi || []).map(a => a.id))
  const usati = new Set([...istruzioni(l.soluzione)]
    .filter(i => !(i.tipo === 'chiama' && attrezzi.has(i.progetto))).map(i => TIPI_DEI_BLOCCHI[i.tipo]))
  const fuori = [...usati].filter(b => !l.cassetta.includes(b))
  controlla(`«${l.nome}»: la soluzione usa solo i blocchi del livello`, fuori.length === 0, fuori.join(', '))
  /* i colori scritti per esteso; quelli per nome (la «tinta» di una
     misura) si controllano dove arrivano, cioè negli ordini */
  const colori = new Set([...istruzioni(l.soluzione)].filter(i => i.tipo === 'metti' && typeof i.colore === 'string').map(i => i.colore))
  controlla(`«${l.nome}»: e solo i suoi colori`, [...colori].every(c => l.colori.includes(c)), [...colori].join(','))
  const posti = new Set([...istruzioni(l.soluzione)].filter(i => i.tipo === 'metti').map(i => i.dove || 'sotto'))
  controlla(`«${l.nome}»: e solo i posti dei mattoni che offre`,
            [...posti].every(q => (l.posti || ['sotto']).includes(q)), [...posti].join(','))
  const suoi = (l.soluzione.progetti || []).filter(p => !attrezzi.has(p.id))
  if (suoi.some(p => p.misure.length))
    controlla(`«${l.nome}»: le misure ci sono se il livello le offre`, l.misure === true)

  /* ── lo zaino, e i progetti che servono davvero ── */
  const sol = conAttrezzi(l.soluzione, l)
  if (l.zaino) controlla(`«${l.nome}»: la soluzione sta nello zaino`, ciSta(sol, l.zaino), `${righeScritte(sol)} righe su ${l.zaino}`)
  if (suoi.length) {
    const piatta = conAttrezzi(programma(srotola(sol)), l)
    controlla(`«${l.nome}»: srotolata, la soluzione vince ancora (il conto delle righe è onesto)`, provaLivello(l, piatta).vinto)
    /* nei capitoli che insegnano i progetti — e dovunque ci sia uno zaino —
       senza progetti non ci si sta */
    if (l.capitolo === 'progetti' || l.zaino)
      controlla(`«${l.nome}»: insegna i progetti, e senza non ci sta — ha uno zaino più stretto della soluzione srotolata`,
                !!l.zaino && righeScritte(piatta) > l.zaino, `srotolata ${righeScritte(piatta)} righe, zaino ${l.zaino}`)
  }
  const passi = s.esiti.map(e => e.passi)
  nota(`${l.nome}: ${l.ordini.length} ordini, ${passi.join('/')} passi`)
}

/* ══════════ 5. le modifiche ══════════ */
{
  const p = programma({ principale: [fai.vai('destra', 1)] })
  const primo = p.principale[0].id
  const nuovo = mod.rigaNuova('ripeti')
  controlla('un ripeti nuovo nasce con la N, non con un numero di comodo', nuovo.volte.vuoto === true)
  uguale('e la prima cosa da scegliere è quella', mod.primaDaScegliere(nuovo).campo, 'volte')
  const vai = mod.rigaNuova('vai', { verso: 'sinistra' })
  controlla('un vai nuovo ha il verso scelto dalla cassetta, e la N da scegliere', vai.verso === 'sinistra' && vai.quanto.vuoto)
  uguale('una domanda nuova non è scelta', mod.rigaNuova('se').cond, null)
  const r = mod.inserisci(p, { dopo: primo }, nuovo)
  uguale('una riga inserita dopo un\'altra', p.principale[1].id, r)
  const dentro = mod.inserisci(p, { dentro: r }, mod.rigaNuova('metti', { colore: 'verde', dove: 'giu-destra' }))
  uguale('e una dentro il ripeti', p.principale[1].corpo[0].id, dentro)
  uguale('col colore e il posto scelti', `${p.principale[1].corpo[0].colore} ${p.principale[1].corpo[0].dove}`, 'verde giu-destra')
  controlla('la N non scelta è un problema prima di partire', mod.problemi(p).some(g => g.id === r && g.motivo === 'n-da-scegliere'))
  mod.imposta(p, r, 'volte', { n: 3 })
  controlla('scelto il numero, non lo è più', !mod.problemi(p).some(g => g.id === r))
  const ids = [...istruzioni(p)].map(i => i.id)
  uguale('nessun id doppio', new Set(ids).size, ids.length)

  const dup = mod.duplica(p, r)
  const ids2 = [...istruzioni(p)].map(i => i.id)
  uguale('un duplicato ha id tutti nuovi, figli compresi', new Set(ids2).size, ids2.length)
  controlla('e sta subito sotto l\'originale', p.principale[2].id === dup)

  controlla('in fondo non si scende più', mod.sposta(p, dup, +1) === false)
  uguale('e la riga resta dov\'era', p.principale[2].id, dup)
  mod.sposta(p, dup, -1)
  uguale('di uno sì', p.principale[1].id, dup)
  mod.togli(p, dup)
  uguale('togliere porta via la riga coi suoi figli', [...istruzioni(p)].length, 3)

  mod.imposta(p, primo, 'verso', 'su')
  uguale('cambiare una casella', p.principale[0].verso, 'su')

  /* i progetti: aggiungere una misura sistema tutte le chiamate */
  const id = mod.nuovoProgetto(p, { nome: 'torre', icona: '🗼' })
  mod.inserisci(p, {}, mod.rigaNuova('chiama', { progetto: p.progetti[0] }))
  mod.aggiornaProgetto(p, id, { misure: [{ nome: 'alta', da: null }] })
  uguale('una misura nuova dà una casella a ogni chiamata', p.principale.at(-1).argomenti.length, 1)
  mod.inserisci(p, { progetto: id }, fai.ripeti('alta', []))
  mod.aggiornaProgetto(p, id, { misure: [{ nome: 'quanto', da: 'alta' }] })
  uguale('rinominare una misura rinomina anche dove la si usa', p.progetti[0].corpo[0].volte.v, 'quanto')
  mod.togliProgetto(p, id)
  controlla('togliere un progetto toglie le sue chiamate',
            ![...istruzioni(p)].some(i => i.tipo === 'chiama'))

  const colorato = programma({ principale: [fai.metti(tinta('lungo')), fai.ripeti('sinistra', [])] })
  const guaiColori = mod.problemi(colorato, { lungo: 3, sinistra: 'verde' })
  controlla('prima di partire: un numero nella casella di un colore', guaiColori.some(g => g.motivo === 'non-un-colore'))
  controlla('e un colore nella casella di un numero', guaiColori.some(g => g.motivo === 'non-un-numero'))
  const nomi = mod.nomiLeggibili(colorato, null, { lungo: 3, sinistra: 'verde' })
  controlla('le caselle dei numeri offrono i numeri, quelle dei colori i colori',
            nomi.ordine.join() === 'lungo' && nomi.ordineColore.join() === 'sinistra')

  const q = programma({ principale: [fai.vai('destra', 'h'), fai.assegna('lungo', 1)] })
  const guai = mod.problemi(q, ['lungo'])
  controlla('i problemi prima di partire: la lavagnetta che non c\'è', guai.some(g => g.motivo === 'lavagnetta-sconosciuta' && g.nome === 'h'))
  controlla('e quella dell\'ordine che si vorrebbe scrivere', guai.some(g => g.motivo === 'lavagnetta-ordine'))
  mod.nuovaLavagnetta(q, 'h')
  controlla('creata la lavagnetta, il primo problema sparisce', !mod.problemi(q, ['lungo']).some(g => g.nome === 'h'))

  const originale = LIVELLI[0].soluzione
  const presa = copia(originale)
  presa.principale.pop()
  controlla('la copia di un programma non tocca il dato del livello', originale.principale.length === 7)

  /* il porto: il lato lo sceglie la cassetta, e la domanda nasce vuota */
  const prendi = mod.rigaNuova('prendi', { lato: 'su' })
  uguale('un «prendi» nasce col lato scelto dalla cassetta', prendi.lato, 'su')
  uguale('senza lato, la prima cosa da scegliere è quella', mod.primaDaScegliere(mod.rigaNuova('posa')).tipo, 'lato')
  uguale('un «aspetta che» nasce senza domanda', mod.primaDaScegliere(mod.rigaNuova('aspetta')).campo, 'cond')
  controlla('un «ripeti per sempre» non ha niente da scegliere', mod.primaDaScegliere(mod.rigaNuova('sempre')) === null)
  const valore = mod.primaDaScegliere(mod.rigaNuova('assegna', { lavagnette: ['voglio'] }))
  uguale('il valore di una lavagnetta si sceglie nella casella dei valori', valore.tipo, 'valore')
  const porto = programma({ lavagnette: ['voglio'],
    progetti: [progetto('cerca', { misure: ['tinta'], tipi: { tinta: 'colore' } }, [])],
    principale: [fai.chiama('cerca', 'voglio'), fai.se(guarda('su', 'cassa', true, tinta('voglio')), [])] })
  controlla('una lavagnetta del bambino può portare un colore: non è un problema prima di partire',
            !mod.problemi(porto).some(g => g.motivo === 'non-un-colore'), JSON.stringify(mod.problemi(porto)))
  const ignoto = programma({ principale: [fai.se(guarda('su', 'cassa', true, tinta('boh')), [])] })
  controlla('ma un colore per nome che non esiste sì', mod.problemi(ignoto).some(g => g.motivo === 'lavagnetta-sconosciuta' && g.nome === 'boh'))
}

/* ══════════ 5-ter. gli attrezzi e lo zaino ══════════ */
{
  const liv = { attrezzi: [torre()] }
  /* un programma di ieri con una «torre» sua, aperta: l'attrezzo le
     prende il posto (era un regalo, adesso è chiuso) */
  const ieri = programma({ progetti: [{ id: 'torre', nome: 'torre', icona: '🗼', misure: ['alta'], corpo: [fai.metti('blu')] }],
                           principale: [fai.chiama('torre', 3)] })
  const oggi = conAttrezzi(ieri, liv)
  uguale('un attrezzo prende il posto del progetto con lo stesso id', oggi.progetti.filter(p => p.id === 'torre').length, 1)
  controlla('ed è chiuso, con scritto dove lascia il robot', oggi.progetti[0].attrezzo === true && /cima/.test(oggi.progetti[0].finisce))
  uguale('lo zaino conta le righe del bambino e non quelle degli attrezzi', righeScritte(oggi), 1)
  uguale('rimettere gli attrezzi due volte non ne raddoppia nessuno', conAttrezzi(oggi, liv).progetti.length, 1)
  const ids = [...istruzioni(oggi)].map(i => i.id)
  uguale('le righe degli attrezzi hanno id tutti loro', new Set(ids).size, ids.length)
  uguale('un blocco conta la testa e quello che ha dentro', righeDi([fai.ripeti(3, [fai.metti('rosso'), fai.vai('destra', 1)])]), 3)
  const srotolato = srotola(programma({
    progetti: [progetto('col', { misure: ['alta'] }, [fai.ripeti('alta', [fai.metti('rosso')])])],
    principale: [fai.chiama('col', 2), fai.chiama('col', piu('h', 1))], lavagnette: ['h'] }))
  uguale('srotolare mette il corpo al posto della chiamata, con la misura sostituita', srotolato.principale[1].volte.op, '+')
  uguale('e dei progetti del bambino non resta niente', srotolato.progetti.length, 0)
}

/* ══════════ 5-bis. quando la fila cambia ordine ══════════ */
{
  /* un bambino che con la fila di prima aveva vinto il cantiere e i
     tre livelli dei progetti */
  const prima = { tappa: 8, stelle: { 0: 2, 1: 2, 2: 1, 3: 2, 4: 2, 5: 2, 6: 1, 7: 2 } }
  const dopo = riordina(prima, FILE[1])
  const indice = k => CAMPAGNA.findIndex(t => t.chiave === k)
  uguale('le stelle del bosco restano al bosco', dopo.stelle[indice('bosco')], 2)
  uguale('quelle del tempio al tempio', dopo.stelle[indice('tempio')], 1)
  uguale('e la tappa si ferma al primo livello nuovo: la torta', dopo.tappa, indice('torta'))
  controlla('nessuna stella finisce su un livello mai giocato', !dopo.stelle[indice('sui-rossi')])
  uguale('ogni livello della fila vecchia esiste ancora', FILE[1].filter(k => indice(k) < 0).length, 0)
  uguale('una tappa raggiunta senza stelle non torna a zero', riordina({ tappa: 3, stelle: {} }, FILE[1]).tappa, 3)

  /* il porto, arrivato fra le lavagnette e le sfide: chi aveva finito
     tutti e ventidue i livelli del cantiere */
  const tutti = { tappa: 22, stelle: Object.fromEntries(FILE[2].map((_, i) => [i, 2])) }
  const conPorto = riordina(tutti, FILE[2])
  uguale('ogni livello della seconda fila esiste ancora', FILE[2].filter(k => indice(k) < 0).length, 0)
  uguale('le stelle della scacchiera restano alla scacchiera', conPorto.stelle[indice('scacchiera')], 2)
  const nuovo = CAMPAGNA.findIndex(t => !FILE[2].includes(t.chiave))
  uguale('e la tappa si ferma al primo livello che quella fila non aveva', conPorto.tappa, nuovo)
  controlla('nessuna stella sul porto, che non ha mai giocato', !conPorto.stelle[indice('bottega')])

  /* la cinta, arrivata davanti al bosco: chi aveva finito tutta la fila
     3 ritrova le stelle dov'erano, e si ferma alla cinta */
  const fila3 = { tappa: FILE[3].length, stelle: Object.fromEntries(FILE[3].map((_, i) => [i, 2])) }
  const conCinta = riordina(fila3, FILE[3])
  uguale('le stelle del bosco restano al bosco anche con la cinta davanti', conCinta.stelle[indice('bosco')], 2)
  uguale('e la tappa si ferma alla cinta', conCinta.tappa, indice('cinta'))
  controlla('che non ha stelle', !conCinta.stelle[indice('cinta')])
}

/* ══════════ 6. i traguardi ══════════ */
{
  const traguardi = manifesto.albo.traguardi.map(t => ({ ...t, area: manifesto.chiave }))
  const vuoto = { totals: {}, best: {}, items: {}, campagne: {} }
  const mVuoto = misure(vuoto)
  controlla('a profilo vuoto nessun traguardo', traguardi.every(t => statoTraguardo(t, mVuoto).grado === 0))
  uguale('e il gioco non risulta provato', manifesto.albo.provato(mVuoto), false)
  const finito = {
    totals: { coMattoni: 6000 }, best: {}, items: {},
    campagne: { costruttore: { tappa: CAMPAGNA.length, libera: true,
                               stelle: Object.fromEntries(CAMPAGNA.map((_, i) => [i, 2])) } },
  }
  const mFinito = misure(finito)
  const presi = traguardi.map(t => statoTraguardo(t, mFinito))
  controlla('chi finisce tutto li prende tutti', presi.every(s => s.finito),
            presi.filter(s => !s.finito).map(s => `${s.id} fermo a ${s.valore}`).join(' · '))
  controlla('e l\'area vale esperienza', manifesto.albo.xp(mFinito) > 0)
}

nota(`${COLORI.length} colori, ${LIVELLI.length} livelli in ${CAPITOLI.length} capitoli`)
riassunto('costruttore')
