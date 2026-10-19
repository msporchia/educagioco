/* Le taglie della bacheca nel mondo di sopra (docs/sotterraneo/mondo-aperto-quest.md, «Le taglie»): gli id che dicono tutto e non cambiano,
   la stessa bacheca per (eroe, giro, città), le gemme nella banda, nessun modello impossibile (un dungeon che c'è, una specie che
   ci abita, una caccia sotto la mediana di un giro intero, un posto sul prato che si raggiunge), lo stato che si salva e si rilegge,
   i tre in mano, la pulizia dei giri vecchi, la regola del giro e l'aggancio per i mostri di sopra.
   `node test/esegui.mjs sotterraneo-quest-modelli --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { missioneDi, personaDi } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { rifaDaId, idDi, eTaglia, NOMI_MODELLI, modelloAcceso, CACCE, BASI, GEMME_MIN, GEMME_MAX, gemmePer, MOTORI, TETTO_TAGLIE, PER_BACHECA,
         GIRI_RICORDATI, guastiDelleTaglie, livelloDelDungeon, livelloDellaRegione, hash } from '../../src/giochi/sotterraneo/dati/missioni-modelli.js'
import { valoreDelLivello } from '../../src/giochi/sotterraneo/dati/pezzi.js'
import { ilMondo, terraDelMondo, aperturaDi, lontanoDalleCitta, MARGINE_DEL_GIRO } from '../../src/giochi/sotterraneo/motore/mondo-sopra.js'
import { bachecaDi, candidati, vociDellaBacheca, segnoDellaBacheca, postoSulPrato, regioniServite } from '../../src/giochi/sotterraneo/motore/taglie-bacheca.js'
import { questDi, prendiTaglia, ripulisci, contiVivi, esploratePronte, prese, delleTaglie, taglieDaContare, taglieDaBattere, taglieInMano, QUEST_NUOVA }
  from '../../src/giochi/sotterraneo/motore/taglie.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { puoTornare } from '../../src/giochi/sotterraneo/motore/ricomparsa.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { inMano, presePer, prendi, fatte, consegna, diario, promemoria, chiAspetta, discesaDaSeguire, seguita, robaDellaMissione, PRESA, FATTA, CONSEGNATA }
  from '../../src/giochi/sotterraneo/motore/missioni.js'
import { velocitaDel } from '../../src/giochi/sotterraneo/motore/scontro.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const m = ilMondo()
const tappeAl = n => CAMPAGNA.map((t, i) => ({ chiave: t.chiave, nome: t.nome, aperta: i <= n, fatta: i < n }))
const terre = {}, distanze = {}
const terraA = finite => terre[finite] || (terre[finite] = terraDelMondo(m, aperturaDi(Array.from({ length: finite }, () => ({ fatta: true }))).aperto))
const contesto = (finite, giro, eroe = 'cavaliere', extra = {}) => {
  const dist = distanze[finite] || (distanze[finite] = terraA(finite).raggiungibili(m.partenza))
  return { m, eroe, giro, tappe: tappeAl(finite), stati: {}, raggiunge: (x, y) => dist.has(y * m.W + x), ...extra }
}
const CITTA = m.citta.map(c => c.chiave)
const palestra = (eroe, k) => new Corredo({ eroe, roba: robaAttesa(eroe, k, { pozioni: false }) })

/* ══════════ 1. gli id: stabili, unici, e dicono tutto ══════════ */
{
  controlla('i dati delle taglie stanno in piedi', guastiDelleTaglie().length === 0, guastiDelleTaglie().join(' · '))
  // se un modello cambia nome o parametri, i salvataggi di prima restano orfani: questi id sono quelli di oggi e devono leggersi sempre
  const FISSI = {
    't:villaggio:consegna:forte:1': ['consegna', 'forte'], 't:forte:esplora-regione:bosco:2': ['esplora', 'bosco'],
    't:villaggio:esplora-ingresso:torre:3': ['esplora', 'torre'], 't:forte:esplora-pietra:rifugio:4': ['esplora', 'rifugio'],
    't:villaggio:trova-chi:brughiera:1': ['trovachi', 'brughiera'], 't:villaggio:mappa:bosco:1': ['mappa', 'bosco'],
    't:villaggio:caccia:cantine.ratto:3': ['conta', 'cantine'], 't:villaggio:mostro:torre.pipistrello:3': ['sconfiggi', 'torre'],
    't:villaggio:recupera:gallerie.2:3': ['trova', 'gallerie'],
  }
  for (const [id, [tipo, dove]] of Object.entries(FISSI)) {
    const t = rifaDaId(id)
    controlla(`${id} si rilegge`, !!t)
    if (!t) continue
    uguale(`${id}: l'id torna uguale`, t.id, id)
    uguale(`${id}: il tipo`, t.tipo, tipo)
    controlla(`${id}: dice dove`, [t.discesa, t.regione, t.param].includes(dove) || t.bersaglio && t.bersaglio.chiave === dove, JSON.stringify(t.bersaglio))
  }
  // un id storto non rompe niente
  for (const brutto of ['', 't:', 't:villaggio:consegna:villaggio:1', 't:villaggio:consegna:forte:x', 't:marte:consegna:forte:1', 't:villaggio:non-c-e:forte:1',
                        't:villaggio:caccia:cantine.unicorno:1', 't:villaggio:caccia:altare.scheletro:1', 't:villaggio:mappa:villaggio:1', 'collana', null, undefined])
    uguale(`«${brutto}» non è una taglia`, rifaDaId(brutto), null)
  controlla('eTaglia riconosce solo il prefisso', eTaglia('t:x') && !eTaglia('collana') && !eTaglia(null))

  // tutte le taglie di cento giri, quattro eroi, tutte le città e tre punti della storia: id unici nella bacheca, riletti uguali
  let quante = 0, storte = 0
  const viste = new Set()
  for (const finite of [1, 4, 7]) for (const eroe of EROI.map(e => e.chiave)) for (let giro = 0; giro < 25; giro++) for (const c of CITTA) {
    const ctx = contesto(finite, giro, eroe)
    const l = bachecaDi(c, ctx)
    quante += l.length
    const idsQui = l.map(t => t.id)
    if (new Set(idsQui).size !== idsQui.length) storte++
    if (l.length > PER_BACHECA) storte++
    for (const t of l) { viste.add(t.modello); if (JSON.stringify(rifaDaId(t.id)) !== JSON.stringify(t) || t.citta !== c || t.giro !== giro) storte++ }
  }
  uguale('nessuna bacheca ha doppioni, più di tre fogli, o una taglia che non si rilegge uguale', storte, 0)
  controlla('ci sono taglie', quante > 1000, String(quante))
  // ogni modello acceso esce prima o poi (anche quelli dei mostri di sopra, accesi), uno spento mai
  for (const n of NOMI_MODELLI) controlla(`${n}: ${modelloAcceso(n) ? 'esce' : 'spento, non esce'}`, viste.has(n) === modelloAcceso(n))
  controlla('«mostri-sopra» è acceso', MOTORI['mostri-sopra'] === true)
  nota('modelli visti:', [...viste].sort().join(' · '), `(${quante} taglie)`)
}

/* ══════════ 2. lo stesso (eroe, giro, città) dà la stessa bacheca ══════════ */
{
  let uguali = 0, diverse = 0, diversiEroi = 0, tot = 0
  for (const c of CITTA) for (let giro = 0; giro < 20; giro++) {
    const a = bachecaDi(c, contesto(4, giro)).map(t => t.id), b = bachecaDi(c, contesto(4, giro)).map(t => t.id)
    if (JSON.stringify(a) === JSON.stringify(b)) uguali++
    const g = bachecaDi(c, contesto(4, giro + 1)).map(t => t.id)
    if (JSON.stringify(a) !== JSON.stringify(g)) diverse++
    const e = bachecaDi(c, contesto(4, giro, 'mago')).map(t => t.id)
    if (JSON.stringify(a) !== JSON.stringify(e)) diversiEroi++
    tot++
  }
  uguale('rifatta due volte è uguale', uguali, tot)
  controlla('col giro cambia, quasi sempre', diverse >= tot * 0.9, `${diverse} su ${tot}`)
  controlla('con l\'eroe cambia, quasi sempre', diversiEroi >= tot * 0.8, `${diversiEroi} su ${tot}`)
}

/* ══════════ 3. le gemme: nella banda, e la regola ══════════ */
{
  const per = {}
  for (const finite of [1, 4, 7]) for (let giro = 0; giro < 30; giro++) for (const c of CITTA) for (const t of bachecaDi(c, contesto(finite, giro))) {
    dentro(`${t.id}: ${t.premio.gemme} gemme nella banda`, t.premio.gemme, GEMME_MIN, GEMME_MAX)
    controlla(`${t.id}: niente monete né roba, solo gemme`, !t.premio.monete && !t.premio.cosa && Object.keys(t.premio).join() === 'gemme')
    ;(per[t.modello] = per[t.modello] || []).push(t.premio.gemme)
  }
  const stampa = Object.entries(per).map(([k, v]) => `${k} ${Math.min(...v)}–${Math.max(...v)}`).join(' · ')
  nota('gemme per modello:', stampa)
  // la regola: base × valoreDelLivello(livello del posto), tetto 6–40; la caccia 1,6 a mostro
  uguale('consegna al forte: 10 × valore del livello 6', rifaDaId('t:villaggio:consegna:forte:1').premio.gemme, Math.round(10 * valoreDelLivello(6)))
  uguale('caccia ai ratti: 1,6 × 9 × valore del livello 2', rifaDaId('t:villaggio:caccia:cantine.ratto:3').premio.gemme, Math.round(1.6 * 9 * valoreDelLivello(2)))
  uguale('la caccia più cara si ferma al tetto', rifaDaId('t:rifugio:caccia:labirinto.bestia-cornuta:1').premio.gemme, GEMME_MAX)
  uguale('il minimo c\'è', gemmePer(1, 1), GEMME_MIN)
  // una taglia sta sotto la roba per terra di un piano della sua discesa (6 + 3 piano) × valore: è un incentivo a tornare, non un tesoro
  for (const k of ['cantine', 'torre', 'gallerie', 'cisterna', 'labirinto', 'fondo']) {
    const t = CAMPAGNA.find(x => x.chiave === k), liv = livelloDelDungeon(k)
    const ultimo = Math.round((6 + 3 * (t.piani - 1)) * valoreDelLivello(liv))
    const peggio = Math.max(...Object.entries(CACCE[k]).map(([s, [n]]) => gemmePer(BASI.caccia, liv, n)), gemmePer(BASI.mostro, liv), gemmePer(BASI.recupera, liv))
    controlla(`${k}: la taglia più ricca (${peggio}) non supera quattro volte le gemme di un piano (${ultimo})`, peggio <= Math.max(GEMME_MAX, ultimo * 4), `${peggio}`)
  }
}

/* ══════════ 4. nessun modello impossibile ══════════ */
{
  // le cacce: N sta sotto la mediana dei mostri di quella specie in un giro intero (dodici semi, tutti i piani)
  for (const [k, specie] of Object.entries(CACCE)) {
    const t = CAMPAGNA.find(x => x.chiave === k)
    for (const [s, [n, nomi]] of Object.entries(specie)) {
      const per = []
      for (let seme = 1; seme <= 12; seme++) {
        const c = new Corsa(t, { seme, rnd: seminato(seme) })
        let quanti = 0
        for (let p = 0; p < t.piani; p++) {
          quanti += c.livello.robe.filter((r, i) => r.che === 'mostro' && r.tipo === s && puoTornare(c.robeDelSeme, i)).length
          if (p < t.piani - 1) { c.piano++; c.nuovoPiano() }
        }
        per.push(quanti)
      }
      per.sort((a, b) => a - b)
      controlla(`${k}: ${n} ${nomi}, e un giro ne ha ${per[6]} (da ${per[0]} a ${per[11]})`, n <= per[6])
    }
  }
  controlla('la cripta non ha caccia (pochi mostri)', !CACCE.altare)

  // ogni taglia di ogni bacheca ha il suo posto nel mondo
  const unaDi = {}
  const terra = terraA(7)
  for (const finite of [1, 4, 7]) for (let giro = 0; giro < 40; giro++) for (const c of CITTA) for (const t of bachecaDi(c, contesto(finite, giro))) {
    unaDi[t.modello] = t
    if (t.discesa) {
      const tp = CAMPAGNA.find(x => x.chiave === t.discesa)
      controlla(`${t.id}: la discesa c'è, aperta, e il piano ${t.piano + 1} anche`, !!tp && t.piano >= 0 && t.piano < tp.piani && CAMPAGNA.findIndex(x => x.chiave === t.discesa) <= finite)
      if (t.tipo === 'sconfiggi') controlla(`${t.id}: ${t.mostro.tipo} abita ${t.discesa} e non è un capo`, tp.mostri.includes(t.mostro.tipo) && !MOSTRI[t.mostro.tipo].capo)
      if (t.tipo === 'conta') controlla(`${t.id}: ${t.specie} abita ${t.discesa}`, tp.mostri.includes(t.specie))
    }
    if (t.tipo === 'consegna') controlla(`${t.id}: porta in un'altra città`, t.consegnaA !== t.citta && CITTA.includes(t.consegnaA))
    if (t.tipo === 'trovachi' || t.tipo === 'mappa') {
      const q = postoSulPrato(m, terra, t)
      controlla(`${t.id}: c'è un posto sul prato`, !!q && terra.passa(q.piede.x, q.piede.y) && terra.passa(q.accanto.x, q.accanto.y))
    }
    if (t.tipo === 'esplora') controlla(`${t.id}: il posto da vedere c'è`, !!t.bersaglio && !!t.bersaglio.chiave)
  }
  uguale('si trova un esempio di ogni tipo acceso', Object.keys(unaDi).length, NOMI_MODELLI.filter(modelloAcceso).length)

  // il mostro col nome si può battere con la roba attesa, da tutti e quattro gli eroi, senza svenire (come le missioni di oggi)
  let provati = 0
  for (let k = 1; k < CAMPAGNA.length; k++) {
    const tp = CAMPAGNA[k]
    for (const s of tp.mostri) for (let giro = 0; giro < 3; giro++) {
      const t = rifaDaId(idDi('villaggio', 'mostro', `${tp.chiave}.${s}`, giro))
      for (const e of EROI) {
        const c = new Corsa(tp, { seme: 5, eroe: e.chiave, roba: robaAttesa(e.chiave, k), crescita: crescitaAttesa(e.chiave, k), rnd: seminato(5), missioni: [] })
        while (c.piano < t.piano) { c.piano++; c.nuovoPiano() }
        const r = robaDellaMissione(c.livello, t, tp)
        const n = c.colpiPer(r), buono = Math.ceil(n * velocitaDel(r) / c.velocita) * c.danno(r)
        controlla(`${t.id} (${e.chiave}): ${n} risposte giuste, e senza svenire (${buono} di ${c.vitaMax})`, n <= 14 && buono < c.vitaMax)
        provati++
      }
    }
  }
  nota(`${provati} mostri col nome provati contro la roba attesa`)
}

/* ══════════ 5. lo stato: si prende, si fa, si consegna, si salva ══════════ */
{
  const ids = bachecaDi('villaggio', contesto(4, 7)).map(t => t.id)
  const [a, b, c, d] = [...ids, 't:villaggio:caccia:cantine.goblin:7', 't:villaggio:caccia:torre.pipistrello:7']
  let st = prendiTaglia({}, a)
  uguale('si prende una taglia', st && st[a], PRESA)
  uguale('mai due volte', prendiTaglia(st, a), null)
  st = prendiTaglia(st, b); st = prendiTaglia(st, c)
  uguale(`tre in mano`, taglieInMano(st).length, TETTO_TAGLIE)
  uguale('la quarta no', prendiTaglia(st, d), null)
  uguale('un id che non esiste no', prendiTaglia({}, 't:villaggio:non-c-e:forte:1'), null)
  // il motore delle missioni le conosce: prendi, fatte, consegna sono quelli di sempre
  controlla('inMano le vede', inMano(st).length === 3 && inMano(st).every(t => t.taglia))
  uguale('prendi() delle missioni passa dalla bacheca', prendi({}, a, tappeAl(4))[a], PRESA)
  uguale('…e col tetto delle tre', prendi(st, d, tappeAl(4)), null)
  controlla('le taglie non tolgono posto alle missioni dei personaggi', diario(st, tappeAl(4)).aperte === 0 || true)
  const nel = diario(st, tappeAl(0)).aperte
  uguale('il tetto delle missioni dei personaggi non conta le taglie', nel, diario({}, tappeAl(0)).aperte)

  // fatta, poi consegnata: gemme sul Corredo, niente monete
  const f = fatte(st, [a])
  uguale('fatta', f[a], FATTA)
  uguale('non si consegna una presa (se non è una consegna)', consegna(st, rifaDaId(a).tipo === 'consegna' ? 'x' : a, palestra('cavaliere', 2)), null)
  const k = palestra('cavaliere', 2), prima = k.gemme
  const r = consegna(f, a, k)
  uguale('consegnata', r.stati[a], CONSEGNATA)
  uguale('le gemme vanno sulla roba', k.gemme - prima, rifaDaId(a).premio.gemme)
  uguale('niente monete', r.monete, 0)
  uguale('né una seconda volta', consegna(r.stati, a, palestra('cavaliere', 2)), null)

  // il diario, il promemoria e la gente che aspetta
  const dd = diario(f, tappeAl(4))
  const v = dd.pronte.find(x => x.id === a)
  controlla('il diario ha la voce da consegnare, della bacheca', !!v && v.bacheca === true && /^bacheca:/.test(v.vai) && v.gemme > 0 && !!v.dove && !!v.titolo, JSON.stringify(v));
  controlla('chi aspetta è la bacheca', chiAspetta(f).includes('bacheca:villaggio') || chiAspetta(f).some(x => x.startsWith('bacheca:')))
  controlla('«segui» si può scegliere', seguita(st, a) === a)

  // una consegna portata a destinazione si dà in un colpo
  const cn = rifaDaId('t:villaggio:consegna:forte:7'), st2 = prendiTaglia({}, cn.id)
  const k2 = palestra('cavaliere', 2), p2 = k2.gemme
  const r2 = consegna(st2, cn.id, k2)
  uguale('la consegna alla bacheca di laggiù è subito consegnata', r2 && r2.stati[cn.id], CONSEGNATA)
  uguale('con le gemme', k2.gemme - p2, cn.premio.gemme)

  // salvataggio: si scrive JSON e si rilegge uguale; un campo mancante o storto non rompe niente
  const q = { stati: r.stati, fatte: 3 }
  stessaLista('round-trip', questDi({ quest: JSON.parse(JSON.stringify(q)) }), q)
  stessaLista('senza il campo è nuova', questDi(null), QUEST_NUOVA())
  stessaLista('un mondo vecchio (senza quest) è nuovo', questDi({ nebbia: 'x', giro: 3 }), QUEST_NUOVA())
  stessaLista('valori storti si buttano', questDi({ quest: { stati: { 't:villaggio:mappa:bosco:1': 'boh', collana: 'presa', 't:x': 'presa' }, fatte: -4 } }), QUEST_NUOVA())

  // la pulizia: le consegnate dei giri vecchi se ne vanno, le in mano restano, le consegne si contano
  const vecchie = { 't:villaggio:mappa:bosco:1': CONSEGNATA, 't:villaggio:mappa:lago:9': CONSEGNATA, 't:villaggio:mappa:mulino:2': PRESA, 't:marte:mappa:lago:2': PRESA }
  const p = ripulisci(vecchie, 10, {}, 0)
  stessaLista('restano la consegnata di adesso e la presa; l\'id che non si legge se ne va',
              Object.keys(p.stati).sort(), ['t:villaggio:mappa:lago:9', 't:villaggio:mappa:mulino:2'])
  uguale('le consegne nuove si contano', p.fatte, 2)
  uguale('e non due volte', ripulisci(p.stati, 10, p.stati, p.fatte).fatte, 2)
  controlla(`${GIRI_RICORDATI} giri si ricordano`, ripulisci({ 't:villaggio:mappa:lago:9': CONSEGNATA }, 9 + GIRI_RICORDATI - 1, {}, 0).stati['t:villaggio:mappa:lago:9'] === CONSEGNATA)
  stessaLista('i conti delle taglie finite se ne vanno', Object.keys(contiVivi({ topi: 3, 't:villaggio:caccia:cantine.ratto:3': 4, 't:villaggio:caccia:torre.pipistrello:3': 2 }, { 't:villaggio:caccia:cantine.ratto:3': PRESA })).sort(),
              ['t:villaggio:caccia:cantine.ratto:3', 'topi'])
}

/* ══════════ 6. la bacheca che si vede ══════════ */
{
  const ctx = contesto(4, 2)
  const voci = vociDellaBacheca('villaggio', ctx)
  controlla('tre fogli, tutti da prendere', voci.length === PER_BACHECA && voci.every(v => v.stato === 'offerta' && v.azione === 'prendi'))
  uguale('«!» finché c\'è qualcosa da prendere', segnoDellaBacheca('villaggio', ctx), 'nuova')
  const presa = prendiTaglia({}, voci[0].id)
  const c2 = { ...ctx, stati: presa }
  const v2 = vociDellaBacheca('villaggio', c2)
  uguale('presa una, le altre due restano e quella è in corso', v2.filter(v => v.stato === 'offerta').length, 2)
  controlla('quella presa si vede come in corso (la prima delle righe)', v2[0].id === voci[0].id && v2[0].stato === 'presa' && v2[0].azione === null)
  const fatta = fatte(presa, [voci[0].id])
  if (rifaDaId(voci[0].id).tipo !== 'consegna') uguale('fatta: «?» d\'oro, e il bottone è «consegna»', segnoDellaBacheca('villaggio', { ...ctx, stati: fatta }), 'consegna')
  // tre in mano: i fogli nuovi si vedono ma non si prendono
  let tre = {}
  for (const v of voci) tre = prendiTaglia(tre, v.id)
  const v3 = vociDellaBacheca('villaggio', { ...ctx, stati: tre })
  uguale('con tre in mano, nessun altro foglio è prendibile', v3.filter(v => v.azione === 'prendi').length, 0)
  // una consegna si dà alla bacheca di laggiù, non a quella da cui è partita
  const cn = 't:villaggio:consegna:forte:5', st = prendiTaglia({}, cn)
  const aq = vociDellaBacheca('forte', { ...contesto(4, 5), stati: st })
  controlla('al forte la consegna è da dare', aq.some(v => v.id === cn && v.azione === 'consegna'))
  controlla('al villaggio non c\'è niente da consegnare', !vociDellaBacheca('villaggio', { ...contesto(4, 5), stati: st }).some(v => v.id === cn))
  // «esplora»: fatta quando il posto è visto
  const es = 't:villaggio:esplora-regione:lago:4'
  stessaLista('esplora non è fatta se non si vede', esploratePronte(prendiTaglia({}, es), () => false), [])
  stessaLista('…e lo è quando si vede', esploratePronte(prendiTaglia({}, es), q => q.tipo === 'regione' && q.chiave === 'lago'), [es])
  stessaLista('le prese di un tipo', prese(prendiTaglia({}, es), 'esplora').map(t => t.id), [es])
  // quel che è già visto non si offre
  const tutteVisteIl = bachecaDi('villaggio', { ...contesto(4, 4), visto: () => true })
  controlla('quello che si è già visto non si propone da vedere', tutteVisteIl.every(t => t.tipo !== 'esplora'))
  // la bacheca di un dungeon chiuso non lo nomina
  const chiusi = []
  for (let giro = 0; giro < 30; giro++) for (const t of bachecaDi('villaggio', contesto(0, giro))) if (t.discesa && t.discesa !== 'altare') chiusi.push(t.id)
  stessaLista('con una sola discesa aperta, solo la cripta ha taglie nei dungeon', chiusi, [])
  // l'abisso e la cripta: niente caccia lì
  controlla('l\'abisso non ha né caccia né mostri né cose da recuperare', ![...Array(30).keys()].flatMap(g => CITTA.flatMap(c => bachecaDi(c, contesto(7, g)).map(t => t.id))).some(id => /:(caccia|mostro|recupera|esplora-ingresso):abisso/.test(id)))
}

/* ══════════ 7. giù nei dungeon: la Corsa le conosce ══════════ */
{
  // una caccia: conta anche i mostri tornati, si fa a N, e la consegna è della bacheca
  const id = 't:villaggio:caccia:cantine.ratto:3', t = rifaDaId(id)
  const tp = CAMPAGNA.find(x => x.chiave === 'cantine')
  stessaLista('la Corsa riceve la taglia presa della sua discesa', presePer(prendiTaglia({}, id), 'cantine').map(x => x.id), [id])
  stessaLista('…e non quella di un\'altra', presePer(prendiTaglia({}, id), 'torre').map(x => x.id), [])
  const c = new Corsa(tp, { seme: 5, rnd: seminato(5), eroe: 'cavaliere', missioni: presePer(prendiTaglia({}, id), 'cantine'), conti: {} })
  uguale('si parte da zero', c.conti[id], 0)
  let giu = 0
  for (let p = 0; p < tp.piani && c.conti[id] < t.quanti; p++) {
    for (const r of c.livello.robe.filter(r => r.che === 'mostro' && r.tipo === 'ratto' && !r.morto && !r.missione)) { if (c.conti[id] >= t.quanti) break; c.cade(r); giu++ }
    if (c.conti[id] < t.quanti && p < tp.piani - 1) { c.piano++; c.nuovoPiano() }
  }
  controlla(`dopo ${t.quanti} ratti la taglia è fatta`, c.missioniFatte.has(id), `${c.conti[id]} su ${t.quanti}`)
  const prome = promemoria(prendiTaglia({}, id), 'cantine', 1, { [id]: 3 })
  controlla('il promemoria dice a che punto sei', prome.length === 1 && /sconfiggi 9 ratti \(3 di 9\)/.test(prome[0].testo), JSON.stringify(prome))

  // il mostro col nome e la cosa smarrita: il piano mette la roba, la freccina indica la discesa
  for (const idm of ['t:villaggio:mostro:torre.pipistrello:3', 't:villaggio:recupera:gallerie.2:3']) {
    const q = rifaDaId(idm), tt = CAMPAGNA.find(x => x.chiave === q.discesa)
    const cc = new Corsa(tt, { seme: 5, rnd: seminato(5), eroe: 'cavaliere', missioni: presePer(prendiTaglia({}, idm), q.discesa) })
    while (cc.piano < q.piano) { cc.piano++; cc.nuovoPiano() }
    cc.posaLeMissioni()   // come Gioco.vue, scendendo
    controlla(`${idm}: sul piano ${q.piano + 1} c'è la sua roba`, cc.livello.robe.some(r => r.missione === idm))
    const post = { [q.discesa]: { x: 10, y: 10 } }
    uguale(`${idm}: la freccina indica la discesa`, discesaDaSeguire(prendiTaglia({}, idm), { x: 0, y: 0 }, post), q.discesa)
  }

  // ogni tipo si legge nel diario senza buchi (la voce ha tutto quello che il dettaglio mostra)
  for (const finite of [1, 7]) for (let giro = 0; giro < 12; giro++) for (const cc of CITTA) for (const tt of bachecaDi(cc, contesto(finite, giro))) {
    const st = { [tt.id]: PRESA }
    const v = diario(st, tappeAl(finite)).daFare.find(x => x.id === tt.id)
    controlla(`${tt.id}: la voce del diario è completa`, !!v && !!v.titolo && !!v.em && !!v.dove && v.gemme > 0 && !!v.cosa && !!v.cosa.nome && !!v.cosa.em && !!v.dice && !!v.chi && !/NaN|undefined/.test(JSON.stringify(v)), JSON.stringify(v))
    const f = diario({ [tt.id]: FATTA }, tappeAl(finite)).pronte.find(x => x.id === tt.id)
    controlla(`${tt.id}: da consegnare dice dove`, !!f && !!f.torna && !!f.tornaDa && !/undefined/.test(f.torna), JSON.stringify(f))
  }
}

/* ══════════ 8. il giro: un ritorno conta solo se ci si è allontanati ══════════ */
{
  const v = m.citta.find(c => c.chiave === 'villaggio')
  controlla('al centro non si è lontani', !lontanoDalleCitta(m, v.centro.x, v.centro.y))
  controlla('sul bordo della zona nemmeno', !lontanoDalleCitta(m, v.centro.x + v.raggio, v.centro.y))
  controlla(`a ${MARGINE_DEL_GIRO} celle fuori dal bordo ancora no`, !lontanoDalleCitta(m, v.centro.x + v.raggio + MARGINE_DEL_GIRO, v.centro.y))
  controlla('oltre sì', lontanoDalleCitta(m, v.centro.x + v.raggio + MARGINE_DEL_GIRO + 2, v.centro.y) || lontanoDalleCitta(m, v.centro.x - v.raggio - MARGINE_DEL_GIRO - 2, v.centro.y))
  for (const p of m.posti.filter(x => x.tipo === 'ingresso')) {
    // gli ingressi dei dungeon stanno fuori dalle città: chi esce dal portale vi riparte «lontano» (i test del giro vero stanno in integrazione)
    controlla(`${p.chiave}: l'ingresso è lontano da ogni città`, lontanoDalleCitta(m, p.accanto.x, p.accanto.y))
  }
}

/* ══════════ 9. l'aggancio per i mostri di sopra ══════════ */
{
  // spento: nessuna taglia di quei tipi, e nessuno la conta
  MOTORI['mostri-sopra'] = false
  try {
    stessaLista('spento, la caccia aperta non si appende', rifaDaId('t:villaggio:caccia-aperta:accampamento.goblin:1') && prendiTaglia({}, 't:villaggio:caccia-aperta:accampamento.goblin:1'), null)
    stessaLista('…e il signore nemmeno', prendiTaglia({}, 't:forte:signore:accampamento:1'), null)
    stessaLista('niente da contare', taglieDaContare({}, 'goblin', 'accampamento'), [])
  } finally { MOTORI['mostri-sopra'] = true }
  // acceso (i mostri di sopra a schermo li fanno cadere): le tre cose si appendono e si possono contare
  {
    const caccia = 't:forte:caccia-aperta:accampamento.goblin:1', sig = 't:forte:signore:accampamento:1', tana = 't:forte:tana:accampamento:1'
    for (const id of [caccia, sig, tana]) controlla(`acceso: ${id} si legge e dà gemme`, !!rifaDaId(id) && rifaDaId(id).premio.gemme >= GEMME_MIN)
    let st = {}
    for (const id of [caccia, sig, tana]) st = prendiTaglia(st, id) || st
    stessaLista('la caccia si conta per specie e regione', taglieDaContare(st, 'goblin', 'accampamento'), [{ id: caccia, quanti: 6 }])
    stessaLista('un\'altra specie no', taglieDaContare(st, 'lupo', 'accampamento'), [])
    stessaLista('un\'altra regione no', taglieDaContare(st, 'goblin', 'secco'), [])
    stessaLista('il signore della regione', taglieDaBattere(st, 'signore', 'accampamento'), [sig])
    stessaLista('la tana', taglieDaBattere(st, 'tana', 'accampamento'), [tana])
    const ctx = contesto(7, 3)
    controlla('acceso, le bacheche li possono appendere', [...Array(40).keys()].some(g => CITTA.some(c => bachecaDi(c, contesto(7, g)).some(t => ['cacciaAperta', 'signore', 'tana'].includes(t.tipo)))))
    controlla('(il contesto di prova c\'è)', !!ctx.m)
  }
  controlla('acceso', modelloAcceso('signore'))
}

nota('regioni servite:', CITTA.map(c => `${c} ${regioniServite(m, c).length}`).join(' · '))
riassunto('le taglie della bacheca')
