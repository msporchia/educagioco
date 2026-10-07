/* Le quattro avventure del sotterraneo, una per eroe
   (docs/sotterraneo/avventure.md). Ognuno ha la sua roba, le sue discese
   e stelle, la sua nebbia, la sua sosta e il suo abisso; le monete sono
   dell'app, e medaglie, esperienza e home contano il massimo fra gli eroi.
   Qui: le avventure separate, il massimo letto dal resto dell'app (con lo
   store vero e giochi/campagne.js), e il passaggio dei profili di prima,
   quando la roba era una sola per tutti, partendo da profili finti di
   oggi: a inizio, a metà, con la sosta aperta, con l'abisso.
   `node test/esegui.mjs sotterraneo-avventure --niente-build`
   tempo: 30 */
import { CAMPAGNA, QUANTE_TAPPE } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { GEMME_DI_BENTORNATO } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { ROBA_VUOTA, schedaConLaRoba } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { scrivi, leggi, dice } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { avventuraDi, scriviNellAvventura, vintaNellAvventura, ilMassimo, cominciata, passaAlleAvventure,
         AVVENTURA_NUOVA } from '../../src/giochi/sotterraneo/motore/avventure.js'
import manifesto from '../../src/giochi/sotterraneo/gioco.js'
import { misure } from '../../src/store/progressi.js'
import { init, creaGiocatore, state } from '../../src/store/profile.js'
import { progresso, aperta, adesso, completa, ritocca } from '../../src/giochi/campagne.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const CHIAVE = 'sotterraneo'
const copia = o => JSON.parse(JSON.stringify(o))
const somma = st => Object.values(st || {}).reduce((n, s) => n + s, 0)
// quello che il resto dell'app vede di un profilo: medaglie, esperienza, la riga della home
function vistoDaFuori(p) {
  const m = misure(p)
  return {
    xp: manifesto.albo.xp(m), tappe: m.tappeDi(CHIAVE), stelle: m.stelleDi(CHIAVE), finita: m.finita(CHIAVE),
    medaglie: manifesto.albo.traguardi.map(t => `${t.id}:${t.valore(m)}`).join(' '),
    riga: manifesto.riassunto(p.campagne[CHIAVE]),
  }
}
const profiloDi = sot => ({ coins: 512, totals: { sotPiani: 9, sotMostri: 30, sotStanze: 40 },
                            best: { sotFondo: 23 }, items: {}, campagne: { [CHIAVE]: sot } })

/* ══════════ 1. le avventure stanno separate ══════════ */
{
  const c = { tappa: 0, libera: false, stelle: {}, cfg: {} }
  stessaLista('un eroe mai giocato ha un\'avventura nuova', avventuraDi(c, 'mago'), AVVENTURA_NUOVA())
  uguale('e non è cominciata', cominciata(avventuraDi(c, 'mago')), false)
  scriviNellAvventura(c, 'cavaliere', { roba: { ...ROBA_VUOTA(), mano: 'spada', gemme: 30 }, terra: { dove: [3, 4] } })
  vintaNellAvventura(c, 'cavaliere', 0, QUANTE_TAPPE, 3)
  const cav = avventuraDi(c, 'cavaliere'), mago = avventuraDi(c, 'mago')
  uguale('il cavaliere ha la sua spada', cav.roba.mano, 'spada')
  uguale('e la sua discesa vinta', cav.tappa, 1)
  uguale('il mago no: zaino vuoto', mago.roba, undefined)
  uguale('e comincia dalla scalinata', mago.tappa, 0)
  uguale('con la nebbia nuova', mago.terra, undefined)
  uguale('il cavaliere è cominciato', cominciata(cav), true)
  scriviNellAvventura(c, 'mago', { sosta: { v: 3, tappa: 0 } })
  uguale('una discesa a metà basta a cominciarla', cominciata(avventuraDi(c, 'mago')), true)
  scriviNellAvventura(c, 'mago', { sosta: null })
  uguale('la sosta buttata se ne va', 'sosta' in c.cfg.avventure.mago, false)
  uguale('e non tocca quella degli altri', avventuraDi(c, 'cavaliere').roba.mano, 'spada')
  vintaNellAvventura(c, 'cavaliere', 0, QUANTE_TAPPE, 1)
  uguale('rigiocando peggio le stelle non scendono', avventuraDi(c, 'cavaliere').stelle[0], 3)
  controlla('c\'è il posto per le missioni', typeof avventuraDi(c, 'nano').missioni === 'object')

  /* i mercanti pescano per avventura: le discese finite di chi apre il banco */
  const banco = finite => new Bottega({ eroe: 'cavaliere', finite, rnd: seminato(7) }).mercanzia('armaiolo').length
  controlla('chi ha finito più discese trova più roba sul banco', banco(avventuraDi(c, 'cavaliere').tappa + 3) >
            banco(avventuraDi(c, 'mago').tappa), `${banco(3)} contro ${banco(0)}`)
}

/* ══════════ 2. il massimo, con lo store vero ══════════
   Gioco.vue a discesa vinta scrive due conti: quello dell'avventura
   (vintaNellAvventura) e fuori completa(), che tiene il più alto. Qui lo
   stesso giro su un profilo vero, e quello che ne leggono medaglie,
   esperienza e home. */
await init()
await creaGiocatore('Prova', true, 8)   // a otto anni le sei discese sono tutte alla portata
{
  const vinci = (eroe, i, stelle) => {
    ritocca(CHIAVE, c => vintaNellAvventura(c, eroe, i, QUANTE_TAPPE, stelle))
    completa(CHIAVE, i, QUANTE_TAPPE, { stelle })
  }
  const monete = state.profile.coins
  vinci('cavaliere', 0, 3)
  vinci('cavaliere', 1, 2)
  vinci('cavaliere', 2, 2)
  const dopoCav = vistoDaFuori(state.profile)
  uguale('fuori, le discese del cavaliere', dopoCav.tappe, 3)

  vinci('mago', 0, 1)
  stessaLista('il mago che rifà la scalinata non ridà esperienza né medaglie', vistoDaFuori(state.profile), dopoCav)
  uguale('ma la sua avventura va avanti', avventuraDi(progresso(CHIAVE), 'mago').tappa, 1)
  uguale('e il cavaliere resta dov\'era', avventuraDi(progresso(CHIAVE), 'cavaliere').tappa, 3)
  vinci('mago', 1, 3)
  const dopoMago = vistoDaFuori(state.profile)
  uguale('una discesa vinta meglio da un altro alza le stelle di quella discesa', dopoMago.stelle, dopoCav.stelle + 1)
  uguale('ma non le discese', dopoMago.tappe, 3)
  const m = ilMassimo(progresso(CHIAVE))
  uguale('fuori c\'è il massimo fra le avventure: il cursore', progresso(CHIAVE).tappa, m.tappa)
  stessaLista('e le stelle, discesa per discesa', progresso(CHIAVE).stelle, m.stelle)
  uguale('le monete non le tocca nessuno', state.profile.coins, monete)

  /* un eroe nuovo comincia dalla scalinata: il lucchetto guarda la sua avventura */
  const nano = avventuraDi(progresso(CHIAVE), 'nano').tappa
  uguale('al nano la scalinata è la prossima', adesso(CHIAVE, 0, nano), true)
  uguale('e il pozzo è chiuso', aperta(CHIAVE, 1, nano), false)
  uguale('mentre per il cavaliere è aperto', aperta(CHIAVE, 1, avventuraDi(progresso(CHIAVE), 'cavaliere').tappa), true)

  /* finite le sei con uno solo, il gioco è finito; la riga della home dice il fondo più giù di tutti */
  for (let i = 3; i < QUANTE_TAPPE; i++) vinci('cavaliere', i, 1)
  ritocca(CHIAVE, c => scriviNellAvventura(c, 'cavaliere', { abisso: { fondo: 12 } }))
  ritocca(CHIAVE, c => scriviNellAvventura(c, 'mago', { abisso: { fondo: 30 } }))
  uguale('il gioco è finito con un eroe solo', vistoDaFuori(state.profile).finita, 1)
  uguale('l\'abisso è aperto solo a chi le ha finite', avventuraDi(progresso(CHIAVE), 'mago').libera, false)
  controlla('la riga della home dice il fondo più giù fra le avventure',
            manifesto.riassunto(progresso(CHIAVE)).includes('piano più profondo 30'), manifesto.riassunto(progresso(CHIAVE)))
}

/* ══════════ 3. il passaggio dei profili di oggi ══════════
   Tutto quello che c'era va all'avventura dell'eroe scelto per ultimo
   (cfg.eroe), gli altri tre partono da capo. Nessuno perde stelle,
   medaglie, esperienza o monete: fuori il profilo si vede uguale. */
function passa(nome, sot, eroe) {
  const p = profiloDi(sot)
  const prima = copia(p)
  const fuori = vistoDaFuori(p)
  uguale(`${nome}: il passaggio cambia qualcosa`, passaAlleAvventure(p.campagne[CHIAVE]), true)
  stessaLista(`${nome}: da fuori si vede uguale (medaglie, esperienza, riga della home)`, vistoDaFuori(p), fuori)
  uguale(`${nome}: le monete restano`, p.coins, prima.coins)
  const c = p.campagne[CHIAVE]
  uguale(`${nome}: l'avventura aperta è dell'eroe di prima`, c.cfg.eroe, eroe)
  stessaLista(`${nome}: c'è solo la sua`, Object.keys(c.cfg.avventure), [eroe])
  const a = avventuraDi(c, eroe)
  uguale(`${nome}: con le sue discese`, a.tappa, prima.campagne[CHIAVE].tappa)
  stessaLista(`${nome}: e le sue stelle`, a.stelle, prima.campagne[CHIAVE].stelle)
  for (const k of ['roba', 'terra', 'abisso', 'botteghe'])
    uguale(`${nome}: cfg.${k} non sta più fuori`, k in c.cfg, false)
  uguale(`${nome}: e nemmeno la sosta`, 'sosta' in c, false)
  for (const e of EROI.filter(e => e.chiave !== eroe))
    uguale(`${nome}: ${e.chiave} parte da capo`, cominciata(avventuraDi(c, e.chiave)), false)
  uguale(`${nome}: una seconda volta non fa niente`, passaAlleAvventure(c), false)
  return { c, a, prima }
}

{
  const vuoto = { tappa: 0, libera: false, stelle: {}, cfg: {} }
  uguale('un bambino che non ha mai scelto non ha niente da passare', passaAlleAvventure(vuoto), false)
  stessaLista('e il suo record non si tocca', vuoto, { tappa: 0, libera: false, stelle: {}, cfg: {} })
}

/* a inizio: scelto l'eroe, fatti due passi sopra */
{
  const { a } = passa('a inizio', { tappa: 0, libera: false, stelle: {},
    cfg: { eroe: 'elfa', roba: ROBA_VUOTA(), terra: { nebbia: '0'.repeat(384), dove: [9, 40], parlato: true } } }, 'elfa')
  stessaLista('a inizio: la nebbia passa all\'elfa', a.terra.dove, [9, 40])
  stessaLista('a inizio: con lo zaino vuoto', a.roba, ROBA_VUOTA())
}

/* a metà: tre discese, la roba, i banchi già pescati */
{
  const roba = { ...ROBA_VUOTA(), gemme: 44, mano: 'spada', corpo: 'corazza', zaino: ['pozione', 'ascia'] }
  const { a } = passa('a metà', { tappa: 3, libera: false, stelle: { 0: 3, 1: 2, 2: 1 },
    cfg: { eroe: 'nano', roba, terra: { nebbia: 'f'.repeat(384), dove: [17, 41], parlato: true },
           botteghe: { banchi: { armaiolo: ['ascia', 'scudo-ferro'] } } } }, 'nano')
  stessaLista('a metà: la roba passa intera', a.roba, roba)
  uguale('a metà: senza gemme di bentornato (la roba c\'era già)', a.roba.gemme, 44)
  stessaLista('a metà: e i banchi già pescati', a.botteghe.banchi.armaiolo, ['ascia', 'scudo-ferro'])
}

/* con la sosta aperta, cominciata da un altro eroe: la riprende chi ha l'avventura */
{
  const corsa = new Corsa(CAMPAGNA[1], { seme: 9, rnd: seminato(9), eroe: 'mago' })
  corsa.gemme = 21
  corsa.zaino = ['pozione']
  corsa.piano = 1
  corsa.nuovoPiano()
  const sosta = scrivi(corsa, 1)
  const roba = { ...ROBA_VUOTA(), gemme: 21, zaino: ['pozione'] }
  const { a } = passa('con la sosta', { tappa: 1, libera: false, stelle: { 0: 2 }, sosta,
    cfg: { eroe: 'cavaliere', roba } }, 'cavaliere')
  uguale('con la sosta: la discesa a metà passa all\'avventura', a.sosta.tappa, 1)
  uguale('con la sosta: e la riprende il cavaliere', a.sosta.eroe, 'cavaliere')
  const ripresa = leggi(a.sosta, CAMPAGNA[1], 'cavaliere', a.roba)
  controlla('con la sosta: si riprende', !!ripresa)
  uguale('con la sosta: allo stesso piano', ripresa.piano, 1)
  uguale('con la sosta: col cavaliere', ripresa.chiEro, 'cavaliere')
  uguale('con la sosta: e con la roba', ripresa.gemme, 21)
  uguale('con la sosta: la carta in cima la dice', dice(a.sosta, CAMPAGNA).piano, 2)
}

/* con l'abisso: le sei finite e un record */
{
  const stelle = Object.fromEntries(CAMPAGNA.map((_, i) => [i, 3]))
  const { c, a } = passa('con l\'abisso', { tappa: QUANTE_TAPPE, libera: true, stelle,
    cfg: { eroe: 'mago', roba: { ...ROBA_VUOTA(), mano: 'scettro', gemme: 90 }, abisso: { fondo: 23 } } }, 'mago')
  uguale('con l\'abisso: il record passa al mago', a.abisso.fondo, 23)
  uguale('con l\'abisso: e l\'abisso gli resta aperto', a.libera, true)
  controlla('con l\'abisso: la riga della home lo dice ancora', manifesto.riassunto(c).includes('piano più profondo 23'),
            manifesto.riassunto(c))
  uguale('con l\'abisso: gli altri non ce l\'hanno', avventuraDi(c, 'elfa').libera, false)
}

/* da prima che la roba restasse: le gemme di bentornato, solo a chi ha le discese finite */
{
  const { c, a } = passa('da prima della roba', { tappa: 4, libera: false, stelle: { 0: 3, 1: 3, 2: 2, 3: 1 },
    cfg: { eroe: 'elfa' } }, 'elfa')
  uguale('da prima della roba: l\'elfa trova le gemme di bentornato', a.roba.gemme, GEMME_DI_BENTORNATO[4])
  uguale('da prima della roba: gli altri no', somma(EROI.filter(e => e.chiave !== 'elfa')
    .map(e => (avventuraDi(c, e.chiave).roba || {}).gemme || 0)), 0)
}

/* un profilo senza eroe scelto ma con delle discese (prima degli eroi): al cavaliere */
{
  passa('senza eroe', { tappa: 2, libera: false, stelle: { 0: 1, 1: 1 }, cfg: {} }, 'cavaliere')
}

/* la scheda dice i numeri veri: quelli che la discesa userà con la roba addosso, non quelli di base */
{
  const fatta = (eroe, roba) => ({ ...ROBA_VUOTA(), ...roba })
  // quello che la Corsa (la discesa vera) conta appena si scende: lo stesso Corredo, lo stesso `sistemaIlCorredo`
  const inDiscesa = (eroe, roba) => new Corsa(CAMPAGNA[1], { seme: 5, rnd: seminato(5), eroe, roba })
  const casi = [
    ['cavaliere con spadone, corazza e amuleto rosso', 'cavaliere',
     { mano: 'spadone', corpo: 'corazza', dito: 'amuleto-rosso', gemme: 12 }],
    ['cavaliere col pugnale vampiro, lo scudo del leone e il panciotto', 'cavaliere',
     { mano: 'pugnale-vampiro', mancina: 'scudo-leone', corpo: 'panciotto' }],
    ['nano con la bipenne e lo scudo di ferro (a due mani: lo scudo non si regge)', 'nano',
     { mano: 'bipenne', mancina: 'scudo-ferro', corpo: 'corazza' }],
    ['mago con una spada che non impugna', 'mago', { mano: 'spada', corpo: 'manto' }],
  ]
  for (const [nome, eroe, dato] of casi) {
    const roba = fatta(eroe, dato)
    const n = schedaConLaRoba(eroe, roba), c = inDiscesa(eroe, roba)
    uguale(`${nome}: la vita è il massimo della discesa`, n.vita, c.vitaMax)
    uguale(`${nome}: l'attacco è quello della discesa`, n.att, c.att)
    uguale(`${nome}: la difesa è quella della discesa`, n.dif, c.dif)
    uguale(`${nome}: la mano è quella che resta addosso`, n.mano, c.mano)
    uguale(`${nome}: lo scudo anche`, n.mancina, c.mancina)
  }
  // i numeri a mano, perché «uguali alla discesa» non dice che siano più dei numeri di base
  const cav = schedaConLaRoba('cavaliere', fatta('cavaliere', { mano: 'spadone', corpo: 'corazza', dito: 'amuleto-rosso' }))
  stessaLista('cavaliere ben armato: 24 di vita, braccio 7, difesa 3',
              [cav.vita, cav.att, cav.dif], [18 + 6, 3 + 4, 1 + 2])
  const mago = schedaConLaRoba('mago', fatta('mago', { mano: 'spada', corpo: 'manto' }))
  uguale('il mago non impugna la spada: resta addosso solo il manto', `${mago.mano}|${mago.corpo}`, 'null|manto')
  uguale('e il braccio è quello di base', mago.att, EROI.find(e => e.chiave === 'mago').att)
  // un'avventura nuova: lo zaino vuoto, i numeri di base
  for (const e of EROI) {
    const n = schedaConLaRoba(e.chiave, null)
    stessaLista(`${e.chiave} nuovo: vita, braccio e difesa di base`, [n.vita, n.att, n.dif], [e.vita, e.att, e.dif])
    uguale(`${e.chiave} nuovo: niente in mano`, `${n.mano}|${n.mancina}|${n.corpo}`, 'null|null|null')
  }
  // i tratti: la luce e le gemme, scritti come nello zaino
  stessaLista('la spada del ladro dice le gemme', schedaConLaRoba('cavaliere', fatta('cavaliere', { mano: 'spada-del-ladro' })).tratti,
              ['💎 ×1,5'])
  stessaLista('la bipenne solare dice la luce', schedaConLaRoba('cavaliere', fatta('cavaliere', { mano: 'bipenne-solare' })).tratti,
              ['🔥 vedi più lontano'])
  stessaLista('senza tratti non dice niente', schedaConLaRoba('cavaliere', fatta('cavaliere', { mano: 'spada' })).tratti, [])
}

nota(`${EROI.length} avventure, una per eroe`)
riassunto('le avventure del sotterraneo')
