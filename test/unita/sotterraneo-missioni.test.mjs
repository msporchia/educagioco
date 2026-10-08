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
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { avventuraDi } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { sbloccata, sbloccate, offerte, inMano, aperte, cosaDice, segnoDi, chiTiCerca, prendi, fatte, consegna,
         presePer, diario, promemoria, inFrase, daLui, robaDellaMissione, PRESA, FATTA, CONSEGNATA }
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
    const c = new Corsa(CAMPAGNA[k], { seme: 5, eroe, roba: robaAttesa(eroe, k), rnd: seminato(5), missioni: [] })
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
  uguale('la ragazza ha il suo «!»', segnoDi('ragazza', stati, t2), '!')
  uguale('il mugnaio anche', segnoDi('mugnaio', stati, t2), '!')
  uguale('e la guardia', segnoDi('guardia', stati, t2), '!')
  uguale('l\'eremita no: ha già avuto la sua', segnoDi('eremita', stati, t2), null)

  stati = prendi(stati, 'rosicchione', t2)
  controlla('se ne prende una', !!stati && stati.rosicchione === PRESA)
  stati = prendi(stati, 'chiavi', t2)
  controlla('e anche un\'altra: la prima non ferma più le altre', !!stati && stati.chiavi === PRESA && stati.rosicchione === PRESA)
  uguale('il mugnaio ha il punto di domanda', segnoDi('mugnaio', stati, t2), '?')
  uguale('la guardia anche', segnoDi('guardia', stati, t2), '?')
  uguale('la ragazza ha ancora il «!»: il goblin si può prendere', segnoDi('ragazza', stati, t2), '!')
  stati = prendi(stati, 'goblin', t2)
  controlla('con tre in mano', !!stati && inMano(stati).length === 3)
  stessaLista('tre aperte, e la discesa le sa tutte e tre', presePer(stati, 'torre').map(m => m.id).sort(), ['chiavi', 'goblin', 'rosicchione'])
  for (const chi of ['ragazza', 'mugnaio', 'guardia']) uguale(`${chi}: ha il punto di domanda`, segnoDi(chi, stati, t2), '?')
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
  uguale('il segno è «!»: c\'è ancora qualcosa da prendere', segnoDi('pescatore', p, t4), '!')
  p = fatte(prendi(p, 'canna', t4), ['canna'])
  uguale('una fatta e una presa: prima la consegna', cosaDice('pescatore', p, t4).voci[0].fase, 'consegna')
  uguale('il segno è «?»', segnoDi('pescatore', p, t4), '?')
  uguale('e la fase che conta è quella da consegnare', cosaDice('pescatore', p, t4).fase, 'consegna')
  uguale('chi non ha niente saluta', cosaDice('boscaiolo', p, tappeAl(1)).fase, 'saluto')

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
  uguale('e le sue missioni dicono la stessa cosa di prima', segnoDi('ragazza', a.missioni, tappeAl(2)), '?')
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
      const c = new Corsa(CAMPAGNA[k], { seme: 5, eroe: e.chiave, roba: robaAttesa(e.chiave, k), rnd: seminato(5), missioni: [] })
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
  uguale('porta le sue monete', r.monete, 4)
  uguale('e le gemme sulla roba', b.gemme, gemme + 30)
  controlla('le monete non finiscono nella roba', !('monete' in b))
  uguale('una missione senza regalo ne porta zero', consegna({ collana: FATTA }, 'collana', palestra('cavaliere', 1)).monete, 0)
  uguale('a tasche piene la consegna aspetta e le monete con lei', consegna({ rosicchione: FATTA }, 'rosicchione',
         new Corredo({ eroe: 'mago', roba: { ...robaAttesa('mago', 4), dito: 'amuleto-rosso', zaino: new Array(6).fill('pozione') } })).monete, 0)
  uguale('il premio si dice con le monete', premioDetto(missioneDi('zannagrigia').premio), '💎 30 · 🪙 4')
  uguale('o con la roba', premioDetto(missioneDi('chela').premio), 'Anello d\'ambra · 🪙 2')
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
  uguale('al primo piano della torre: Rosicchione sta più giù', pm(ros, 'torre', 1)[0].testo, 'Missione: Rosicchione sta al secondo piano')
  uguale('e il segno è «sopra»', pm(ros, 'torre', 1)[0].dove, 'sopra')
  uguale('sul piano giusto lo dice', pm(ros, 'torre', 2)[0].testo, 'Missione: Rosicchione è su questo piano: cerca il mostro con la corona')
  uguale('oltre quel piano è sfuggito', pm(ros, 'torre', 3)[0].dove, 'oltre')
  uguale('il forziere: la collana è al primo piano', pm({ collana: PRESA }, 'cantine', 1)[0].testo, 'Missione: la collana della nonna è su questo piano: cerca il forziere d\'oro')
  uguale('un piano prima', pm({ chiavi: PRESA }, 'torre', 1)[0].testo, 'Missione: il mazzo di chiavi della torre è al terzo piano')
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

riassunto('l\'albero delle missioni')
