/* Le quattro avventure del sotterraneo, una per eroe
   (docs/sotterraneo/avventure.md). Ognuno ha la sua roba, le sue discese
   e stelle, la sua nebbia, la sua sosta e il suo abisso; le monete sono
   dell'app, e medaglie, esperienza e home contano il massimo fra gli eroi.
   Qui: le avventure separate, il massimo letto dal resto dell'app (con lo
   store vero e giochi/campagne.js), l'azzeramento dei salvataggi di
   prima (da prima delle avventure, e di ieri), «riprendi da qui» in home
   con l'icona ritagliata dalla mappa.
   `node test/esegui.mjs sotterraneo-avventure --niente-build`
   tempo: 30 */
import { CAMPAGNA, QUANTE_TAPPE } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { POSTO_DI, iconaDi } from '../../src/giochi/sotterraneo/dati/terra.js'
import { ICONE } from '../../src/giochi/sotterraneo/dati/terra-icone.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { ROBA_VUOTA, schedaConLaRoba } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { scrivi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { avventuraDi, scriviNellAvventura, vintaNellAvventura, ilMassimo, cominciata, azzeraIlVecchio, ricordaIlFondo, MONDO,
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

/* ══════════ 3. i salvataggi di prima si azzerano ══════════
   Il gioco è cambiato tanto (portale, ripresa esatta, avventure) che i
   salvataggi di prima si buttano: le avventure ripartono da zero per
   tutti. Restano il record di fuori, le medaglie, l'esperienza, le
   monete e i contatori: togliere non abbassa il livello. Una volta sola,
   segnata da `cfg.mondo`. */
function azzera(nome, sot) {
  const p = profiloDi(sot)
  const prima = copia(p)
  const fuori = vistoDaFuori(p)
  uguale(`${nome}: l'azzeramento cambia qualcosa`, azzeraIlVecchio(p.campagne[CHIAVE]), true)
  const c = p.campagne[CHIAVE]
  stessaLista(`${nome}: da fuori si vede uguale (medaglie, esperienza, riga della home)`, vistoDaFuori(p), fuori)
  uguale(`${nome}: le monete restano`, p.coins, prima.coins)
  stessaLista(`${nome}: e i contatori`, [p.totals, p.best], [prima.totals, prima.best])
  stessaLista(`${nome}: il record di fuori non si tocca`, [c.tappa, c.libera, c.stelle],
              [prima.campagne[CHIAVE].tappa, prima.campagne[CHIAVE].libera, prima.campagne[CHIAVE].stelle])
  for (const k of ['avventure', 'roba', 'terra', 'abisso', 'botteghe'])
    uguale(`${nome}: cfg.${k} se ne va`, k in c.cfg, false)
  uguale(`${nome}: e la sosta di prima`, 'sosta' in c, false)
  for (const e of EROI) {
    const a = avventuraDi(c, e.chiave)
    uguale(`${nome}: ${e.chiave} parte da capo`, cominciata(a), false)
    uguale(`${nome}: ${e.chiave} senza nebbia, sosta né abisso`, !!(a.terra || a.sosta || a.abisso), false)
  }
  uguale(`${nome}: la home non ha niente da riprendere`, manifesto.ripresa(c), null)
  uguale(`${nome}: una seconda volta non fa niente`, azzeraIlVecchio(c), false)
  return { c, prima }
}

/* da prima delle avventure: la roba una sola per tutti, la nebbia, l'abisso e una sosta aperta */
{
  const corsa = new Corsa(CAMPAGNA[1], { seme: 9, rnd: seminato(9), eroe: 'mago' })
  const { c } = azzera('da prima delle avventure', { tappa: 6, libera: true, stelle: { 0: 3, 1: 2, 2: 2, 3: 1, 4: 1, 5: 1 },
    sosta: { ...scrivi(corsa, 1), v: 3 },
    cfg: { eroe: 'elfa', roba: { ...ROBA_VUOTA(), gemme: 160, mano: 'spada' }, abisso: { fondo: 23 },
           terra: { nebbia: 'f'.repeat(384), dove: [9, 40], parlato: true }, botteghe: { banchi: {} } } })
  uguale('da prima delle avventure: l\'eroe scelto resta', c.cfg.eroe, 'elfa')
  uguale('da prima delle avventure: l\'abisso si riapre finendo le sei con un eroe', avventuraDi(c, 'elfa').libera, false)
}

/* di ieri: già passato alle avventure, col bentornato in tasca e una sosta della versione di prima */
{
  const { c } = azzera('di ieri', { tappa: 3, libera: false, stelle: { 0: 3, 1: 2, 2: 1 },
    cfg: { eroe: 'nano', avventure: {
      nano: { ...AVVENTURA_NUOVA(), tappa: 3, stelle: { 0: 3, 1: 2, 2: 1 }, roba: { ...ROBA_VUOTA(), gemme: 120 },
              terra: { nebbia: 'f'.repeat(768), dove: [40, 40], parlato: true, divieti: ['botola'] },
              sosta: { v: 3, tappa: 2, robe: [] }, abisso: { fondo: 4 } },
      mago: { ...AVVENTURA_NUOVA(), tappa: 1, stelle: { 0: 1 } } } } })
  uguale('di ieri: le gemme di bentornato non ci sono più', (avventuraDi(c, 'nano').roba || {}).gemme, undefined)
  uguale('di ieri: il nano ricomincia dalla scalinata', avventuraDi(c, 'nano').tappa, 0)
}

/* un eroe che non c'è più non resta scelto: la scelta si ripresenta */
{
  const { c } = azzera('con un eroe sconosciuto', { tappa: 0, libera: false, stelle: {}, cfg: { eroe: 'ladro' } })
  uguale('con un eroe sconosciuto: la scelta si ripresenta', 'eroe' in c.cfg, false)
}

/* un profilo nuovo: si segna e basta, e un'avventura cominciata dopo non si tocca più */
{
  const c = { tappa: 0, libera: false, stelle: {}, cfg: {} }
  uguale('un profilo nuovo si segna', azzeraIlVecchio(c), true)
  uguale('col mondo di adesso', c.cfg.mondo, MONDO)
  scriviNellAvventura(c, 'mago', { roba: { ...ROBA_VUOTA(), gemme: 7 } })
  uguale('e dopo non si azzera più', azzeraIlVecchio(c), false)
  uguale('la roba del mago resta', avventuraDi(c, 'mago').roba.gemme, 7)
}

/* «riprendi da qui» in home: la discesa a metà dell'avventura aperta, col suo posto ritagliato dalla mappa */
{
  const c = { tappa: 2, libera: false, stelle: {}, cfg: {} }
  azzeraIlVecchio(c)
  c.cfg.eroe = 'cavaliere'
  uguale('senza una discesa a metà la home usa la riga di sempre', manifesto.ripresa(c), null)
  const corsa = new Corsa(CAMPAGNA[1], { seme: 9, rnd: seminato(9) })
  corsa.piano = 1
  corsa.nuovoPiano()
  scriviNellAvventura(c, 'cavaliere', { sosta: scrivi(corsa, 1) })
  const r = manifesto.ripresa(c)
  uguale('con una discesa a metà la home dice quale', r && r.dove, `${CAMPAGNA[1].nome} · piano 2 di ${CAMPAGNA[1].piani}`)
  controlla('e mostra il suo posto ritagliato dalla mappa', !!r && r.immagine === ICONE[POSTO_DI[CAMPAGNA[1].chiave]] &&
            r.immagine.startsWith('data:image/webp'))
  c.cfg.eroe = 'mago'
  uguale('la discesa a metà di un altro eroe la si ritrova scegliendolo', manifesto.ripresa(c), null)
}

/* le icone delle discese: una per ogni discesa e per l'abisso, ritagliate dalla mappa, leggere */
{
  for (const k of [...CAMPAGNA.map(t => t.chiave), 'abisso']) {
    const i = iconaDi(k)
    controlla(`${k}: ha la sua icona ritagliata`, typeof i === 'string' && i.startsWith('data:image/webp;base64,'), k)
    controlla(`${k}: leggera (sotto i 10 KB)`, !!i && i.length * 3 / 4 < 10240, i && `${Math.round(i.length * 3 / 4)} byte`)
  }
  uguale('una icona per posto, non di più', Object.keys(ICONE).length, Object.keys(POSTO_DI).length)
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

// il record dell'abisso di prima dell'azzeramento resta nella riga della home (cfg.fondoDiPrima)
{
  const vecchio = { tappa: 6, libera: true, stelle: {}, cfg: { abisso: { fondo: 23 } } }
  uguale('il fondo vecchio si ricorda', ricordaIlFondo(vecchio, 0), true)
  azzeraIlVecchio(vecchio)
  controlla('dopo l\'azzeramento la riga dice ancora il fondo vecchio',
            manifesto.riassunto(vecchio).includes('piano più profondo 23'), manifesto.riassunto(vecchio))
  const giaAzzerato = { tappa: 6, libera: true, stelle: {}, cfg: { mondo: MONDO } }
  uguale('chi era già azzerato lo ritrova dal primato', ricordaIlFondo(giaAzzerato, 17), true)
  controlla('e la riga lo dice', manifesto.riassunto(giaAzzerato).includes('piano più profondo 17'), manifesto.riassunto(giaAzzerato))
  uguale('un primato più basso non lo abbassa', ricordaIlFondo(giaAzzerato, 9), false)
}

nota(`${EROI.length} avventure, una per eroe`)
riassunto('le avventure del sotterraneo')
