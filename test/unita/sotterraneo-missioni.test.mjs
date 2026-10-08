/* L'albero delle missioni del sotterraneo (docs/sotterraneo/missioni.md): i requisiti e lo sblocco da sole, mai
   più di tre aperte insieme, più missioni prese insieme, il diario e il promemoria, le monete come regalo (col
   conto delle domande in più) e lo stato di prima, che non si rompe. Il giro di una missione dal fumetto al premio
   è in `sotterraneo-storia`; col dito, in `integrazione/sotterraneo-missioni`.
   `node test/esegui.mjs sotterraneo-missioni --niente-build` */
import { CAMPAGNA, QUANTE_TAPPE } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { MISSIONI, PERSONAGGI, TETTO, missioneDi, guastiDelleMissioni, premioDetto, personaDi }
  from '../../src/giochi/sotterraneo/dati/missioni.js'
import { PERSONAGGI as DOVE_PERSONAGGI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { avventuraDi } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { sbloccata, sbloccate, offerte, inMano, aperte, cosaDice, segnoDi, chiTiCerca, prendi, fatte, consegna,
         presePer, diario, promemoria, inFrase, GLIFO, chiAspetta, daLui, robaDellaMissione, rotta, discesaDaSeguire,
         seguita, PRESA, FATTA, CONSEGNATA }
  from '../../src/giochi/sotterraneo/motore/missioni.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

// le tappe di un'avventura col cursore a `n` (n discese finite, la n-esima è quella di adesso)
const tappeAl = n => CAMPAGNA.map((t, i) => ({ chiave: t.chiave, nome: t.nome, aperta: i <= n, fatta: i < n }))
const ids = lista => lista.map(m => m.id)
const palestra = (eroe, k) => new Corredo({ eroe, roba: robaAttesa(eroe, k, { pozioni: false }) })

/* ══════════ 1. i dati stanno in piedi ══════════ */
{
  const g = guastiDelleMissioni(Object.keys(DOVE_PERSONAGGI))
  controlla('le missioni stanno in piedi (requisiti, premi, monete)', !g.length, g.join(' · '))
  uguale('dodici missioni: le nove di prima e tre seguiti', MISSIONI.length, 12)
  controlla('il minatore si nomina anche se non sta fra i personaggi', personaDi('minatore') && personaDi('minatore').nome === 'Il vecchio minatore')

  // un guasto lo vede davvero: un requisito dopo la sua discesa, uno ignoto, un ciclo di sole missioni
  const vera = MISSIONI.find(m => m.id === 'collana')
  const richiede = vera.richiede
  vera.richiede = [{ fatta: 'fondo' }]
  controlla('un requisito che sta dopo la sua discesa è un guasto', guastiDelleMissioni().some(x => /collana.*non è prima/.test(x)))
  vera.richiede = [{ pippo: 1 }]
  controlla('un requisito ignoto è un guasto', guastiDelleMissioni().some(x => /collana.*non conosco/.test(x)))
  vera.richiede = richiede
  uguale('rimesso a posto, nessun guasto', guastiDelleMissioni().length, 0)
}

/* ══════════ 2. l'albero: cosa si sblocca, e quando ══════════ */
{
  const nessuna = {}
  // dalla discesa finita
  controlla('la collana aspetta che la cripta sia finita', !sbloccata(missioneDi('collana'), nessuna, tappeAl(0)))
  controlla('e finita la cripta si sblocca da sola', sbloccata(missioneDi('collana'), nessuna, tappeAl(1)))
  controlla('anche la Badessa, che non aspetta niente, c\'è dall\'inizio', sbloccata(missioneDi('badessa'), nessuna, tappeAl(0)))
  // una discesa chiusa dall'età non apre le sue missioni, anche se il resto c'è
  const chiusa = tappeAl(1).map(t => (t.chiave === 'cantine' ? { ...t, aperta: false } : t))
  controlla('con la discesa chiusa la collana non si sblocca', !sbloccata(missioneDi('collana'), nessuna, chiusa))
  // dalla missione consegnata
  controlla('il goblin aspetta la collana, anche con la torre aperta', !sbloccata(missioneDi('goblin'), { collana: FATTA }, tappeAl(2)))
  controlla('consegnata la collana il goblin si sblocca', sbloccata(missioneDi('goblin'), { collana: CONSEGNATA }, tappeAl(2)))
  controlla('ma non prima che la torre sia aperta', !sbloccata(missioneDi('goblin'), { collana: CONSEGNATA }, tappeAl(1)))
  controlla('il libro aspetta la Badessa', !sbloccata(missioneDi('libro'), {}, tappeAl(3)) && sbloccata(missioneDi('libro'), { badessa: CONSEGNATA }, tappeAl(3)))
  controlla('il sacco aspetta Rosicchione', !sbloccata(missioneDi('sacco'), {}, tappeAl(5)) && sbloccata(missioneDi('sacco'), { rosicchione: CONSEGNATA }, tappeAl(5)))
  controlla('Zannagrigia aspetta la scala sommersa finita', !sbloccata(missioneDi('zannagrigia'), {}, tappeAl(4)) && sbloccata(missioneDi('zannagrigia'), {}, tappeAl(5)))

  // l'offerta cambia da sola quando cambia lo stato, senza che nessuno la chiami
  const t2 = tappeAl(2)
  // chi non ha preso niente alla torre: sbloccate quattro, ma se ne offrono tre, le più vicine alla discesa di adesso
  stessaLista('a stati vuoti, alla torre: quattro sbloccate (il goblin no)', ids(sbloccate({}, t2)).sort(), ['badessa', 'chiavi', 'collana', 'rosicchione'])
  stessaLista('e se ne offrono tre, quelle della torre prima della Badessa', ids(offerte({}, t2)), ['collana', 'rosicchione', 'chiavi'])
  const dopo = { badessa: CONSEGNATA, collana: CONSEGNATA }
  stessaLista('consegnata la collana, alla torre arriva il goblin', ids(sbloccate(dopo, t2)).sort(), ['chiavi', 'goblin', 'rosicchione'])

  // la storia di chi le fa tutte e le consegna subito: ecco l'albero, discesa per discesa
  const giusti = [
    ['badessa'], ['collana'], ['chiavi', 'goblin', 'rosicchione'], ['ascia', 'libro'],
    ['canna', 'chela'], ['sacco', 'zannagrigia'], ['lanterna'],
  ]
  let stati = {}
  for (let n = 0; n < QUANTE_TAPPE; n++) {
    const t = tappeAl(n)
    stessaLista(`all'ingresso della discesa ${n} (${CAMPAGNA[n].chiave}) si sbloccano`, ids(sbloccate(stati, t)).sort(), giusti[n])
    const sono = ids(sbloccate(stati, t)).length
    controlla(`alla discesa ${n}: da una a tre insieme (sono ${sono})`, sono >= 1 && sono <= TETTO)
    controlla(`e sono tutte offerte, nessuna nascosta dal tetto`, offerte(stati, t).length === sono)
    // le prende tutte, le fa nella discesa che le riguarda, risalendo le consegna
    for (const m of offerte(stati, t)) {
      stati = prendi(stati, m.id, t)
      controlla(`${m.id}: si sbloccava prima di scendere nella sua discesa`, CAMPAGNA.findIndex(x => x.chiave === m.discesa) <= n)
    }
    stati = fatte(stati, inMano(stati).map(m => m.id))
    for (const m of inMano(stati)) stati = consegna(stati, m.id, palestra('mago', n)).stati
  }
  uguale('chi le ha fatte tutte le ha consegnate tutte', Object.values(stati).filter(x => x === CONSEGNATA).length, MISSIONI.length)
  uguale('e non resta niente da proporre', aperte(stati, tappeAl(QUANTE_TAPPE)).length, 0)
  nota('l\'albero: ' + giusti.map((l, n) => `${CAMPAGNA[n].chiave}[${l.join(',')}]`).join(' · '))

  // ogni missione si sblocca prima che si entri nella sua discesa, e con la roba attesa è fattibile
  const colpi = (eroe, k, m) => {
    const c = new Corsa(CAMPAGNA[k], { seme: 5, eroe, roba: robaAttesa(eroe, k), crescita: crescitaAttesa(eroe, k), rnd: seminato(5), missioni: [] })
    while (c.piano < m.piano) { c.piano++; c.nuovoPiano() }
    const r = robaDellaMissione(c.livello, m, CAMPAGNA[k])
    return { c, r, colpi: c.colpiPer(r), rispondendoBene: c.colpiPer(r) * c.graffio(r), vita: c.vitaMax }
  }
  for (const m of MISSIONI.filter(x => x.tipo === 'sconfiggi')) {
    const k = CAMPAGNA.findIndex(t => t.chiave === m.discesa)
    for (const e of EROI) {
      const { colpi: n, rispondendoBene, vita } = colpi(e.chiave, k, m)
      controlla(`${m.id} (${e.chiave}): ${n} risposte giuste, e senza svenire (${rispondendoBene} di ${vita})`,
                n <= 14 && rispondendoBene < vita)
    }
  }

  // chi non ne consegna mai una: le sbloccate crescono (qui lo si vede), ma quelle aperte non vanno oltre il tetto
  let pigro = {}, piuAlte = 0
  for (let n = 0; n < QUANTE_TAPPE; n++) {
    const t = tappeAl(n)
    piuAlte = Math.max(piuAlte, ids(sbloccate(pigro, t)).length)
    controlla(`senza consegnare niente, alla discesa ${n} le aperte sono al più ${TETTO} (${aperte(pigro, t).length})`, aperte(pigro, t).length <= TETTO)
  }
  nota(`chi non fa mai niente arriva a ${piuAlte} sbloccate insieme, e ne vede sempre al più ${TETTO}`)
}

/* ══════════ 3. più missioni prese insieme, e il tetto ══════════ */
{
  const t2 = tappeAl(2)
  let stati = { badessa: CONSEGNATA, collana: CONSEGNATA }
  stessaLista('alla torre le tre sono offerte: il goblin, Rosicchione e le chiavi', ids(offerte(stati, t2)), ['goblin', 'rosicchione', 'chiavi'])
  uguale('la ragazza ha il suo «!»', segnoDi('ragazza', stati, t2), 'nuova')
  uguale('il mugnaio anche', segnoDi('mugnaio', stati, t2), 'nuova')
  uguale('e la guardia', segnoDi('guardia', stati, t2), 'nuova')
  uguale('l\'eremita no: ha già avuto la sua', segnoDi('eremita', stati, t2), null)

  stati = prendi(stati, 'rosicchione', t2)
  controlla('se ne prende una', !!stati && stati.rosicchione === PRESA)
  stati = prendi(stati, 'chiavi', t2)
  controlla('e anche un\'altra: la prima non ferma più le altre', !!stati && stati.chiavi === PRESA && stati.rosicchione === PRESA)
  uguale('il mugnaio ha il punto di domanda', segnoDi('mugnaio', stati, t2), 'attesa')
  uguale('la guardia anche', segnoDi('guardia', stati, t2), 'attesa')
  uguale('la ragazza ha ancora il «!»: il goblin si può prendere', segnoDi('ragazza', stati, t2), 'nuova')
  stati = prendi(stati, 'goblin', t2)
  controlla('con tre in mano', !!stati && inMano(stati).length === 3)
  stessaLista('tre aperte, e la discesa le sa tutte e tre', presePer(stati, 'torre').map(m => m.id).sort(), ['chiavi', 'goblin', 'rosicchione'])
  for (const chi of ['ragazza', 'mugnaio', 'guardia']) uguale(`${chi}: ha il punto di domanda`, segnoDi(chi, stati, t2), 'attesa')
  uguale('sulla torre non c\'è altro', prendi(stati, 'ascia', tappeAl(3)), null)

  // il tetto: con tre in mano alla gallerie non si offre altro, finché non se ne consegna una
  const t3 = tappeAl(3)
  const treInMano = stati
  uguale('con tre in mano, la grotta non offre niente', offerte(treInMano, t3).length, 0)
  uguale('né il boscaiolo ha un segno', segnoDi('boscaiolo', stati, t3), null)
  uguale('e prendere l\'ascia non si può', prendi(stati, 'ascia', t3), null)
  stati = fatte(stati, ['rosicchione'])
  uguale('una fatta pesa lo stesso, finché non è consegnata', offerte(stati, t3).length, 0)
  stati = consegna(stati, 'rosicchione', palestra('cavaliere', 2)).stati
  stessaLista('consegnata una, arriva un\'altra (e non di più): a pari discesa il piano più in alto', ids(offerte(stati, t3)), ['libro'])
  uguale('l\'ascia aspetta il suo turno', prendi(stati, 'ascia', t3), null)
  stati = prendi(stati, 'libro', t3)
  controlla('e il libro si prende', !!stati && stati.libro === PRESA)
  // i seguiti sbloccano altro: consegnata Rosicchione, il sacco aspetta soltanto la botola aperta
  controlla('il sacco non è ancora offerto (la botola è chiusa)', !ids(offerte(stati, t3)).includes('sacco'))

  // lo stesso personaggio con due missioni: due voci nel fumetto, una per missione, ognuna con la sua fase
  const t4 = tappeAl(4)
  let p = { badessa: CONSEGNATA, collana: CONSEGNATA }
  stessaLista('il pescatore ha due favori da chiedere', cosaDice('pescatore', p, t4).voci.map(v => v.missione.id + ':' + v.fase).sort(), ['canna:offre', 'chela:offre'])
  p = prendi(p, 'chela', t4)
  stessaLista('presa una, l\'altra resta da dare', cosaDice('pescatore', p, t4).voci.map(v => v.missione.id + ':' + v.fase).sort(), ['canna:offre', 'chela:aspetta'])
  uguale('il segno è «!»: c\'è ancora qualcosa da prendere', segnoDi('pescatore', p, t4), 'nuova')
  p = fatte(prendi(p, 'canna', t4), ['canna'])
  uguale('una fatta e una presa: prima la consegna', cosaDice('pescatore', p, t4).voci[0].fase, 'consegna')
  uguale('il segno è quello della consegna', segnoDi('pescatore', p, t4), 'consegna')
  uguale('e la fase che conta è quella da consegnare', cosaDice('pescatore', p, t4).fase, 'consegna')
  uguale('chi non ha niente saluta', cosaDice('boscaiolo', p, tappeAl(1)).fase, 'saluto')

  // i tre segni: «!» nuova, «?» grigio d'attesa, «?» d'oro da consegnare. Vince la consegna sulla nuova
  const q = { badessa: CONSEGNATA, collana: CONSEGNATA, canna: FATTA }
  uguale('canna fatta e Chela mai presa: la consegna vince sulla missione nuova', segnoDi('pescatore', q, t4), 'consegna')
  uguale('…e la fase che conta è la stessa', cosaDice('pescatore', q, t4).fase, 'consegna')
  uguale('senza la consegna, la nuova', segnoDi('pescatore', { badessa: CONSEGNATA, collana: CONSEGNATA }, t4), 'nuova')
  uguale('solo presa: l\'attesa', segnoDi('pescatore', { badessa: CONSEGNATA, collana: CONSEGNATA, canna: PRESA, chela: PRESA }, t4), 'attesa')
  uguale('chi non ha niente non ha segno', segnoDi('boscaiolo', q, t4), null)
  uguale('il «!» è «!»', GLIFO.nuova, '!')
  uguale('l\'attesa e la consegna sono «?», ma sono due segni', GLIFO.attesa + GLIFO.consegna + (GLIFO.attesa !== GLIFO.consegna ? 'x' : ''), '??')
  stessaLista('chi aspetta una consegna: solo chi ha una missione fatta', chiAspetta(q), ['pescatore'])
  stessaLista('nessuno, se niente è fatto', chiAspetta({ canna: PRESA, collana: CONSEGNATA }), [])
  stessaLista('due missioni fatte di due persone: due', chiAspetta({ canna: FATTA, chiavi: FATTA, rosicchione: FATTA }).sort(), ['guardia', 'mugnaio', 'pescatore'])

  // giù, due missioni nella stessa discesa stanno ognuna nel suo piano
  const c = new Corsa(CAMPAGNA[2], { seme: 9, eroe: 'cavaliere', roba: robaAttesa('cavaliere', 2), rnd: seminato(9),
                                    missioni: presePer(treInMano, 'torre') })
  stessaLista('al primo piano della torre c\'è solo il goblin', c.livello.robe.filter(r => r.missione).map(r => r.missione), ['goblin'])
  const g = c.livello.robe.find(r => r.missione === 'goblin')
  controlla('un goblin col nome, più duro di un goblin', g.tipo === 'goblin' && g.nome === 'Grattanaso, il goblin ladro' && g.ossa > c.livello.mostro('goblin', 0, 0).ossa)
  c.cade(g)
  controlla('battuto, è fatta', c.missioniFatte.has('goblin'))
}

/* ══════════ 4. lo stato di prima non si rompe ══════════
   Prima ne era proposta una sola, ma lo stato poteva avere più missioni prese; e le nove di allora sono ancora
   tutte qui con lo stesso id. */
{
  const t2 = tappeAl(2)
  const vecchio = { badessa: PRESA, collana: PRESA, rosicchione: PRESA, chiavi: FATTA, zannagrigia: PRESA }
  uguale('cinque in mano, anche se il tetto è tre: non se ne perde nessuna', inMano(vecchio).length, 5)
  uguale('e finché sono tante non se ne offre un\'altra', offerte(vecchio, t2).length, 0)
  stessaLista('il diario le mostra tutte e cinque, nell\'ordine della storia', diario(vecchio, t2).inMano.map(v => v.id), ['badessa', 'collana', 'rosicchione', 'chiavi', 'zannagrigia'])
  uguale('la guardia deve consegnare le chiavi', cosaDice('guardia', vecchio, t2).voci.map(v => v.missione.id + ':' + v.fase).join(','), 'chiavi:consegna,zannagrigia:aspetta')
  const r = consegna(vecchio, 'chiavi', palestra('mago', 2))
  uguale('la consegna funziona come prima', r.stati.chiavi, CONSEGNATA)
  uguale('e le altre restano prese', r.stati.collana, PRESA)
  // il minimo vecchio: solo la prima consegnata, cripta fatta
  uguale('uno stato con una sola consegnata non offre il seguito', ids(sbloccate({ badessa: CONSEGNATA }, tappeAl(0))).length, 0)
  stessaLista('e alla scalinata offre la collana', ids(offerte({ badessa: CONSEGNATA }, tappeAl(1))), ['collana'])
  // l'avventura di oggi, letta com'è: `missioni` come mappa di stati, niente di nuovo in più
  const profilo = { cfg: { avventure: { cavaliere: { tappa: 2, stelle: {}, missioni: { badessa: 'consegnata', collana: 'presa' } } } } }
  const a = avventuraDi(profilo, 'cavaliere')
  stessaLista('si legge senza campi nuovi', a.missioni, { badessa: 'consegnata', collana: 'presa' })
  uguale('e le sue missioni dicono la stessa cosa di prima', segnoDi('ragazza', a.missioni, tappeAl(2)), 'attesa')
  // roba inventata nello stato: ignorata
  uguale('un id che non c\'è non fa danno', inMano({ fantasma: PRESA, collana: PRESA }).length, 1)
}

/* ══════════ 5. le monete come regalo: il conto ══════════
   Il regalo vale le domande che la missione chiede in più: per un mostro col nome, i colpi in più di un mostro
   comune di quel piano (con la roba attesa, media dei quattro eroi, intera). Quelle risposte sono già pagate una
   per una, e il regalo le raddoppia: per questo piccolo, e solo dove il conto è misurabile. */
{
  const conto = {}
  for (const m of MISSIONI.filter(x => x.tipo === 'sconfiggi')) {
    const k = CAMPAGNA.findIndex(t => t.chiave === m.discesa)
    let somma = 0
    for (const e of EROI) {
      const c = new Corsa(CAMPAGNA[k], { seme: 5, eroe: e.chiave, roba: robaAttesa(e.chiave, k), crescita: crescitaAttesa(e.chiave, k), rnd: seminato(5), missioni: [] })
      while (c.piano < m.piano) { c.piano++; c.nuovoPiano() }
      somma += c.colpiPer(robaDellaMissione(c.livello, m, CAMPAGNA[k])) - c.colpiPer(c.livello.mostro(m.mostro.tipo, 0, 0))
    }
    conto[m.id] = Math.round(somma / EROI.length)
    uguale(`${m.id}: le monete sono le domande in più (${(somma / EROI.length).toFixed(2)})`, m.premio.monete || 0, conto[m.id])
  }
  nota('monete: ' + Object.entries(conto).map(([k, v]) => `${k} ${v}`).join(' · '))
  controlla('chi non combatte non ha monete', MISSIONI.filter(m => m.tipo === 'trova').every(m => !m.premio.monete))
  controlla('alcune sì e alcune no', MISSIONI.some(m => m.premio.monete) && MISSIONI.some(m => !m.premio.monete))
  controlla('il tetto è un regalo: mai più di una decina', MISSIONI.every(m => (m.premio.monete || 0) <= 10))

  // consegnando, le monete tornano a chi chiama: non toccano la roba
  const b = palestra('cavaliere', 5)
  const gemme = b.gemme
  const r = consegna({ zannagrigia: FATTA }, 'zannagrigia', b)
  uguale('Zannagrigia: consegnata', r.stati.zannagrigia, CONSEGNATA)
  uguale('porta le sue monete', r.monete, 2)
  uguale('e le gemme sulla roba', b.gemme, gemme + 30)
  controlla('le monete non finiscono nella roba', !('monete' in b))
  uguale('una missione senza regalo ne porta zero', consegna({ collana: FATTA }, 'collana', palestra('cavaliere', 1)).monete, 0)
  uguale('a tasche piene la consegna aspetta e le monete con lei', consegna({ rosicchione: FATTA }, 'rosicchione',
         new Corredo({ eroe: 'mago', roba: { ...robaAttesa('mago', 4), dito: 'amuleto-rosso', zaino: new Array(6).fill('pozione') } })).monete, 0)
  uguale('il premio si dice con le monete', premioDetto(missioneDi('zannagrigia').premio), '💎 30 · 🪙 2')
  uguale('o con la roba', premioDetto(missioneDi('chela').premio), 'Anello d\'ambra · 🪙 1')
  uguale('non si consegna due volte', consegna(r.stati, 'zannagrigia', b), null)
  // niente moneta per una risposta sbagliata: il forziere della missione resta chiuso e non fa niente
  const c = new Corsa(CAMPAGNA[1], { seme: 21, eroe: 'cavaliere', roba: robaAttesa('cavaliere', 1), rnd: seminato(21), missioni: [missioneDi('collana')] })
  const f = c.livello.robe.find(x => x.missione === 'collana')
  c.interagisci(f)
  uguale('sbagliando il forziere non è fatto', c.rispondi(false).che !== 'missione' && !c.missioniFatte.has('collana'), true)
}

/* ══════════ 6. il diario e il promemoria ══════════ */
{
  const t3 = tappeAl(3)
  const stati = { badessa: CONSEGNATA, collana: CONSEGNATA, rosicchione: CONSEGNATA, chiavi: FATTA, goblin: PRESA }
  const d = diario(stati, t3)
  stessaLista('da fare: il goblin e le chiavi', d.inMano.map(v => v.id).sort(), ['chiavi', 'goblin'])
  const chiavi = d.inMano.find(v => v.id === 'chiavi')
  uguale('le chiavi sono fatte: si torna dalla guardia', chiavi.tornaDa, 'dalla guardia della torre')
  controlla('con la discesa e il piano', chiavi.dove === 'La torre in rovina' && chiavi.piano === 3 && chiavi.discesa === 'torre')
  controlla('e il premio', chiavi.premio === '💎 20')
  const goblin = d.inMano.find(v => v.id === 'goblin')
  stessaLista('le fatte da consegnare sono a parte, in cima: le chiavi', d.pronte.map(v => v.id), ['chiavi'])
  stessaLista('e le da fare sono le altre: il goblin', d.daFare.map(v => v.id), ['goblin'])
  uguale('la riga dice a chi tornare e cosa si ha', chiavi.torna, 'Torna dalla guardia della torre: hai il mazzo di chiavi della torre')
  uguale('per un mostro: hai battuto', diario({ rosicchione: FATTA }, t3).pronte[0].torna, 'Torna dal mugnaio: hai battuto Rosicchione')
  controlla('il goblin è da battere, con la sua corona e chi lo vuole', goblin.em === '👑' && goblin.chi === 'La ragazza del pozzo' && !goblin.tornaDa)
  stessaLista('ti aspetta il libro dei nomi (l\'ascia è nascosta dal tetto)', d.offerte.map(v => v.id), ['libro'])
  stessaLista('consegnate: la Badessa, la collana, Rosicchione', d.consegnate.map(v => v.id), ['badessa', 'collana', 'rosicchione'])
  uguale('tre aperte, due in mano e due offerte: il tetto ne tiene tre', d.aperte, 3)
  uguale('una è nascosta dal tetto', d.nascoste, 1)
  uguale('il diario sa il tetto', d.tetto, TETTO)
  uguale('un\'avventura nuova ha un diario quasi vuoto: la Badessa e basta',
         JSON.stringify(diario({}, tappeAl(0)).offerte.map(v => v.id)), '["badessa"]')

  // il promemoria in discesa
  const pm = (st, tappa, piano) => promemoria(st, tappa, piano)
  const ros = { rosicchione: PRESA }
  uguale('al primo piano della torre: Rosicchione sta più giù', pm(ros, 'torre', 1)[0].testo, 'Missione: Rosicchione sta al secondo piano: scendi')
  uguale('e il segno è «sopra»', pm(ros, 'torre', 1)[0].dove, 'sopra')
  uguale('sul piano giusto lo dice', pm(ros, 'torre', 2)[0].testo, 'Missione: Rosicchione è su questo piano: cerca il mostro con la corona')
  uguale('oltre quel piano è sfuggito', pm(ros, 'torre', 3)[0].dove, 'oltre')
  uguale('il forziere: la collana è al primo piano', pm({ collana: PRESA }, 'cantine', 1)[0].testo, 'Missione: la collana della nonna è su questo piano: cerca il forziere d\'oro')
  uguale('un piano prima', pm({ chiavi: PRESA }, 'torre', 1)[0].testo, 'Missione: il mazzo di chiavi della torre è al terzo piano: scendi')
  uguale('fatta, ricorda a chi riportarla', pm({ chiavi: FATTA }, 'torre', 3)[0].testo, 'Missione compiuta: il mazzo di chiavi della torre, torna dalla guardia della torre')
  uguale('consegnata, niente', pm({ chiavi: CONSEGNATA }, 'torre', 3).length, 0)
  uguale('di un\'altra discesa, niente', pm(ros, 'cantine', 1).length, 0)
  uguale('due missioni della stessa discesa: due righe nell\'ordine della storia', pm({ rosicchione: PRESA, chiavi: PRESA, goblin: PRESA }, 'torre', 1).map(r => r.id).join(','), 'goblin,rosicchione,chiavi')
  uguale('il goblin al primo piano è «qui»', pm({ goblin: PRESA }, 'torre', 1)[0].dove, 'qui')
  uguale('fuori da una discesa (piano ignoto), sono «sopra»', pm(ros, 'torre', null)[0].dove, 'sopra')

  // le parole
  uguale('«La collana» in mezzo a una frase', inFrase('La collana della nonna'), 'la collana della nonna')
  uguale('«L\'ascia»', inFrase('L\'ascia di mio padre'), 'l\'ascia di mio padre')
  uguale('un nome proprio resta com\'è', inFrase('Rosicchione'), 'Rosicchione')
  uguale('«Chela, il granchio gigante» resta com\'è', inFrase('Chela, il granchio gigante'), 'Chela, il granchio gigante')
  uguale('dalla', daLui('la ragazza del pozzo'), 'dalla ragazza del pozzo')
  uguale('dal', daLui('il mugnaio'), 'dal mugnaio')
  uguale('dall\'', daLui('l\'eremita dell\'altare'), 'dall\'eremita dell\'altare')
}

/* ══════════ 7. il minatore dice chi ti cerca ══════════ */
{
  stessaLista('alla scalinata: l\'eremita e la ragazza hanno un favore, nell\'ordine della storia', chiTiCerca({}, tappeAl(1)),
              ['L\'eremita dell\'altare ha un favore da chiederti.', 'La ragazza del pozzo ha un favore da chiederti.'])
  const presa = chiTiCerca({ collana: PRESA, badessa: CONSEGNATA }, tappeAl(1))
  controlla('presa: dice cosa aspetta', presa.length === 1 && /aspetta ancora: la collana della nonna\./.test(presa[0]), presa.join('|'))
  controlla('fatta: dice che ti aspetta', /ti aspetta/.test(chiTiCerca({ collana: FATTA, badessa: CONSEGNATA }, tappeAl(1))[0]))
  const prima = chiTiCerca({ collana: FATTA }, tappeAl(1))
  controlla('chi ha da consegnare viene prima di chi ha un favore', prima.length === 2 && /ti aspetta/.test(prima[0]) && /favore/.test(prima[1]), prima.join('|'))
  uguale('la lanterna è sua: il minatore non la ripete', chiTiCerca({ badessa: CONSEGNATA, collana: CONSEGNATA, rosicchione: CONSEGNATA, chiavi: CONSEGNATA, goblin: CONSEGNATA, ascia: CONSEGNATA, libro: CONSEGNATA, chela: CONSEGNATA, canna: CONSEGNATA, zannagrigia: CONSEGNATA, sacco: CONSEGNATA }, tappeAl(6)).length, 0)
  uguale('senza niente da dire, niente', chiTiCerca({ badessa: CONSEGNATA }, tappeAl(0)).length, 0)
  const due = chiTiCerca({ badessa: CONSEGNATA, collana: CONSEGNATA }, tappeAl(4))
  controlla('il pescatore ha due favori: lo dice una volta sola', due.some(r => /ha due favori da chiederti/.test(r)), due.join('|'))
}

/* ══════════ 8. la freccina in discesa: da che parte è la missione ══════════
   Il forziere d'oro o il mostro con la corona se sono su questo piano, la scala se sono più giù; la più vicina se
   sono più d'una; niente senza missioni, o se la cosa è già fatta o il piano è passato. Non guarda la nebbia. */
{
  const corsaDi = (chiave, prese, seme = 7) => {
    const c = new Corsa(CAMPAGNA.find(t => t.chiave === chiave), { seme, rnd: seminato(seme), eroe: 'cavaliere',
      roba: robaAttesa('cavaliere', CAMPAGNA.findIndex(t => t.chiave === chiave), { pozioni: false }),
      missioni: presePer(Object.fromEntries(prese.map(id => [id, PRESA])), chiave) })
    return c
  }
  const robaDi = (c, id) => c.livello.robe.find(r => r.missione === id)
  const verso = (c, r) => Math.round(Math.atan2((r.fy != null ? r.fy : r.y + 0.5) - c.eroe.y, (r.fx != null ? r.fx : r.x + 0.5) - c.eroe.x) * 180 / Math.PI)

  // senza missioni, niente freccia; con una presa di un'altra discesa, nemmeno
  uguale('nessuna missione: nessuna freccia', rotta(corsaDi('torre', [])), null)
  uguale('una missione di un\'altra discesa non c\'è nella corsa', rotta(corsaDi('cantine', ['rosicchione'])), null)

  // sul piano giusto: punta alla cosa (il goblin della torre sta al primo piano, il mostro con la corona)
  const g = corsaDi('torre', ['goblin'])
  const r = rotta(g)
  controlla('il mostro col nome è su questo piano: la freccia è «qui»', r && r.verso === 'qui' && r.id === 'goblin', JSON.stringify(r))
  uguale('e guarda proprio lui', r.gradi, verso(g, robaDi(g, 'goblin')))
  uguale('il nome è quello della missione', r.nome, 'Grattanaso, il goblin ladro')
  controlla('la distanza è una distanza', r.distanza > 0)

  // più in basso: punta alla scala che scende, anche se è nel buio
  const ro = corsaDi('torre', ['rosicchione'])   // il ratto sta al secondo piano
  const rs = rotta(ro)
  const scala = ro.livello.robe.find(x => x.che === 'scala')
  controlla('più giù: la freccia è «scala»', rs && rs.verso === 'scala', JSON.stringify(rs))
  uguale('e guarda la scala', rs.gradi, Math.round(Math.atan2(scala.y + 0.5 - ro.eroe.y, scala.x + 0.5 - ro.eroe.x) * 180 / Math.PI))
  uguale('la scala non è stata vista, e la freccia c\'è lo stesso (la nebbia non conta)', ro.visto[scala.y * ro.livello.largo + scala.x], 0)

  // due missioni nella stessa discesa: vince la più vicina
  const due = corsaDi('torre', ['goblin', 'rosicchione', 'chiavi'])
  const d = rotta(due)
  const vicina = ['goblin'].map(id => robaDi(due, id))[0]
  const lontana = due.livello.robe.find(x => x.che === 'scala')
  const dist = o => Math.hypot((o.fx != null ? o.fx : o.x + 0.5) - due.eroe.x, (o.fy != null ? o.fy : o.y + 0.5) - due.eroe.y)
  controlla('con più missioni, la più vicina: ' + d.id, d.id === (dist(vicina) <= dist(lontana) ? 'goblin' : 'rosicchione'), JSON.stringify(d))
  // sposto l'eroe vicino alla scala: adesso la più vicina è quella che punta alla scala
  due.eroe = { x: lontana.x + 0.5, y: lontana.y + 1.5 }
  const d2 = rotta(due)
  controlla('spostando l\'eroe accanto alla scala, vince quella che punta alla scala', d2.verso === 'scala', JSON.stringify(d2))

  // fatta: non c'è più; piano passato: neanche
  g.missioniFatte.add('goblin')
  uguale('la missione fatta non ha freccia', rotta(g), null)
  const sf = corsaDi('torre', ['goblin'])
  sf.piano = 1; sf.nuovoPiano()
  uguale('il piano è passato: sfuggita, nessuna freccia', rotta(sf), null)

  // un forziere d'oro aperto non si indica più
  const col = corsaDi('cantine', ['collana'])
  controlla('il forziere della collana è su questo piano: «qui»', rotta(col) && rotta(col).verso === 'qui', JSON.stringify(rotta(col)))
  robaDi(col, 'collana').aperto = true
  uguale('aperto, la freccia sparisce', rotta(col), null)

  // il testo della riga in cima, per la missione più giù: «scendi»
  uguale('più giù la riga in cima dice «scendi»', promemoria({ rosicchione: PRESA }, 'torre', 1)[0].testo, 'Missione: Rosicchione sta al secondo piano: scendi')
}

/* ══════════ 9. la freccina sulla terra di sopra: verso la discesa ══════════ */
{
  const posti = { altare: { x: 58, y: 9 }, cantine: { x: 10, y: 20 }, torre: { x: 45, y: 9 }, fondo: { x: 60, y: 40 } }
  const io = { x: 52, y: 36 }
  uguale('nessuna missione presa: nessuna freccia', discesaDaSeguire({}, io, posti), null)
  uguale('una offerta e non presa: neanche', discesaDaSeguire({ badessa: undefined }, io, posti), null)
  uguale('la Badessa è presa: la freccia va alla cripta', discesaDaSeguire({ badessa: PRESA }, io, posti), 'altare')
  uguale('con due prese, la discesa più vicina', discesaDaSeguire({ badessa: PRESA, rosicchione: PRESA }, io, posti), 'altare')
  uguale('e dall\'altra parte della mappa, l\'altra', discesaDaSeguire({ badessa: PRESA, rosicchione: PRESA }, { x: 40, y: 8 }, posti), 'torre')
  uguale('due missioni nella stessa discesa: una sola freccia', discesaDaSeguire({ rosicchione: PRESA, chiavi: PRESA }, io, posti), 'torre')
  uguale('una consegna da fare ha la precedenza: niente freccia azzurra', discesaDaSeguire({ badessa: PRESA, collana: FATTA }, io, posti), null)
  uguale('consegnata, una missione non punta più', discesaDaSeguire({ badessa: CONSEGNATA }, io, posti), null)
  uguale('una discesa senza posto sulla mappa non si indica', discesaDaSeguire({ badessa: PRESA }, io, { torre: posti.torre }), null)
}

/* ══════════ 10. la missione che le freccine seguono, scelta nel diario ══════════
   Di difetto la più vicina; con «segui questa» la scelta vince, finché quella missione è presa. Il diario dà a ogni
   voce il dettaglio che si apre toccandola. */
{
  const corsaDi = (chiave, prese, seme = 7) => new Corsa(CAMPAGNA.find(t => t.chiave === chiave), { seme, rnd: seminato(seme),
    eroe: 'cavaliere', roba: robaAttesa('cavaliere', CAMPAGNA.findIndex(t => t.chiave === chiave), { pozioni: false }),
    missioni: presePer(Object.fromEntries(prese.map(id => [id, PRESA])), chiave) })

  // giù: la scelta batte la più vicina, e dove non c'è si torna alla regola di prima
  const due = corsaDi('torre', ['goblin', 'rosicchione'])
  const scala = due.livello.robe.find(x => x.che === 'scala')
  due.eroe = { x: scala.x + 0.5, y: scala.y + 1.5 }   // accanto alla scala: la più vicina è Rosicchione (che punta alla scala)
  uguale('senza scelta, accanto alla scala vince quella che punta alla scala', rotta(due).id, 'rosicchione')
  uguale('scegliendo il goblin, la freccina cambia obiettivo', rotta(due, 'goblin').id, 'goblin')
  uguale('e punta alla cosa, non alla scala', rotta(due, 'goblin').verso, 'qui')
  uguale('scegliendo l\'altra, resta l\'altra', rotta(due, 'rosicchione').id, 'rosicchione')
  uguale('una scelta che non è di questa discesa non conta: vale la più vicina', rotta(due, 'collana').id, 'rosicchione')
  due.missioniFatte.add('goblin')
  uguale('la scelta fatta in questa discesa non punta più: si torna alla più vicina', rotta(due, 'goblin').id, 'rosicchione')

  // sopra: la discesa della scelta, anche se non è la più vicina
  const posti = { altare: { x: 58, y: 9 }, cantine: { x: 10, y: 20 }, torre: { x: 45, y: 9 }, fondo: { x: 60, y: 40 } }
  const io = { x: 52, y: 36 }
  const prese = { badessa: PRESA, rosicchione: PRESA }
  uguale('senza scelta, la discesa più vicina', discesaDaSeguire(prese, { x: 40, y: 8 }, posti), 'torre')
  uguale('scegliendo la Badessa, la freccia azzurra cambia discesa', discesaDaSeguire(prese, { x: 40, y: 8 }, posti, 'badessa'), 'altare')
  uguale('scegliendo Rosicchione, dall\'altra parte', discesaDaSeguire(prese, io, posti, 'rosicchione'), 'torre')
  uguale('la consegna pronta ha ancora la precedenza', discesaDaSeguire({ ...prese, collana: FATTA }, io, posti, 'badessa'), null)
  uguale('una scelta non più presa decade: vale la più vicina', discesaDaSeguire({ badessa: CONSEGNATA, rosicchione: PRESA }, io, posti, 'badessa'), 'torre')
  uguale('una scelta senza posto sulla mappa decade', discesaDaSeguire(prese, io, { torre: posti.torre }, 'badessa'), 'torre')

  // la scelta si ricorda finché la missione è presa, e si azzera quando è fatta o consegnata
  uguale('la scelta di una missione presa vale', seguita({ badessa: PRESA }, 'badessa'), 'badessa')
  uguale('nessuna scelta: niente', seguita({ badessa: PRESA }, null), null)
  uguale('una missione mai presa non si segue', seguita({}, 'badessa'), null)
  uguale('fatta, la scelta decade', seguita({ badessa: FATTA }, 'badessa'), null)
  uguale('e consegnata anche', seguita({ badessa: CONSEGNATA }, 'badessa'), null)
  const ps = consegna({ badessa: FATTA }, 'badessa', palestra('cavaliere', 1))
  uguale('dopo la consegna la scelta è già decaduta', seguita(ps.stati, 'badessa'), null)

  // il diario: ogni voce porta il suo dettaglio
  const t4 = tappeAl(4)
  const stati = { badessa: CONSEGNATA, collana: FATTA, rosicchione: PRESA, chiavi: PRESA }
  const d = diario(stati, t4, 'chiavi')
  uguale('il diario dice quale si segue', d.segui, 'chiavi')
  uguale('e la voce è marcata', d.inMano.filter(v => v.segui).map(v => v.id).join(','), 'chiavi')
  uguale('una scelta non più presa il diario non la segna', diario(stati, t4, 'badessa').segui, null)
  const col = d.inMano.find(v => v.id === 'collana')
  controlla('la fatta non si segue: si porta', !col.seguibile && !col.segui)
  const ros = d.inMano.find(v => v.id === 'rosicchione')
  controlla('Rosicchione: il mostro col nome, la sua faccia e la richiesta del mugnaio',
            ros.cosa.tipo === 'sconfiggi' && ros.cosa.nome === 'Rosicchione' && ros.cosa.sprite === 'ratto' && ros.cosa.em === '🐀'
            && ros.da === 'mugnaio' && /Rosicchione/.test(ros.dice) && ros.seguibile, JSON.stringify(ros.cosa))
  controlla('il premio a pezzi: il gioiello col suo nome e le monete', ros.gemme === 0 && ros.monete === 2
            && ros.regalo && ros.regalo.nome === 'Amuleto azzurro' && ros.regalo.sprite === 'amuleto-azzurro')
  const ch = d.inMano.find(v => v.id === 'chiavi')
  controlla('Le chiavi: una cosa da trovare, in gemme', ch.cosa.tipo === 'trova' && ch.cosa.sprite === null && ch.cosa.em === '🔑'
            && ch.gemme === 20 && ch.regalo === null && ch.monete === 0)
  controlla('la voce dice da chi andare', ch.daChi === 'dalla guardia della torre' && ros.daChi === 'dal mugnaio')
  const fin = d.consegnate.find(v => v.id === 'badessa')
  controlla('la consegnata ha anche il grazie', fin.stato === 'consegnata' && /riposa|dorme/.test(fin.grazie) && fin.dice.length > 20)
  controlla('le offerte hanno il dettaglio ma non si seguono', d.offerte.every(v => v.dice && !v.seguibile && !v.segui))
}

riassunto('l\'albero delle missioni')
