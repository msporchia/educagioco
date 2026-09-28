/* ═══════════════════════════════════════════════════════════════════
   IMMUNITÀ, ABILITÀ, IL CAPO E LA FRETTA — le regole nuove del campo

   Quattro cose arrivate insieme, e ognuna ha una promessa da tenere:

     1. **l'immunità è zero**: la torre a cui un mostro è immune non gli
        fa niente — né danno, né veleno, né gelo — e **non gli spara
        nemmeno**: con solo immuni a tiro resta ferma e pronta. Il segno
        «immune» sopra la testa lo lascia chi viene preso dentro da un
        colpo ad area tirato a un altro;
     2. **le abilità non cambiano l'energia**: chi si divide lascia dei
        pezzi che si spartiscono quello che lui avrebbe pagato, chi si
        rialza paga una volta sola, e le ondate con le abilità arrivano
        in meno ma valgono lo stesso;
     3. **il capo è un'ondata**: uno solo, con la vita di tutta l'ondata
        e un decimo, più lento, e paga come l'ondata intera — se no la
        promessa dei `calcoli` saltava ogni dieci ondate;
     4. **le ondate miste** mescolano due tipi che nessuna torre ferisce
        tutti e due, arrivano dove devono (tardi) e valgono come
        un'ondata normale;
     5. **la fretta paga il tempo risparmiato**, anche a ondata in corso,
        e non rompe le ondate: il premio di fine ondata, la moneta e il
        regalo arrivano lo stesso a chi chiama prima.

   Più le regole delle file (`guastiDelleImmunita`) su tutte le tappe:
   il validatore le dice, qui si contano.
   ═══════════════════════════════════════════════════════════════════ */
import { TAPPE, LIBERE, CFG, MONDO, premioDellaFretta, coperturaApertura, APERTURA_COPRE, APERTURA_CORTA,
         chiaveTappa,
         nemiciDiOnda, capiAperti } from '../../src/data/castello.js'
import { MOSTRI, ABILITA, CAPO, IMMUNITA_MAX, MISTA, immuniDi, feritoDa, gelabile, guastiDelleImmunita,
         guastiDelleMiste, coppieDi, immuniDellOnda, vitaEffettiva } from '../../src/data/mostri.js'
import { TORRI } from '../../src/data/ops.js'
import { creaBattaglia } from '../../src/motore/battaglia.js'
import { Nemico } from '../../src/motore/castello/nemico.js'
import { Colpo } from '../../src/motore/castello/colpo.js'
import { Torre } from '../../src/motore/castello/torre.js'
import { Ondate } from '../../src/motore/castello/ondate.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const ARCIERE = Object.keys(TORRI).find(k => TORRI[k].aspetto === 'arciere')
const MAGICA = Object.keys(TORRI).find(k => TORRI[k].aspetto === 'magica')
const GELO = Object.keys(TORRI).find(k => TORRI[k].gela)
const BOMBE = Object.keys(TORRI).find(k => TORRI[k].aspetto === 'bombe')

/* ══════════ 1. l'immunità è zero ══════════ */
{
  const n = new Nemico({ vita: 100, vel: 0, bestia: 'golem', immune: immuniDi('golem') })
  uguale('il golem è immune a frecce e magia', immuniDi('golem').sort().join(), [ARCIERE, MAGICA].sort().join())
  controlla('una freccia non gli fa niente', n.ferisci(500, ARCIERE) === false && n.vita === 100)
  controlla('e lascia il segno «immune» sopra la testa', n.respinto > 0)
  n.avvelena(50, 3, MAGICA)
  uguale('il veleno di una torre a cui è immune non entra', n.perQuanto, 0)
  controlla('le bombe sì', n.ferisci(30, BOMBE) === false && n.vita === 70)

  const v = new Nemico({ vita: 100, vel: 10, bestia: 'pipistrello', immune: immuniDi('pipistrello') })
  controlla('chi vola non gela', v.gela(2, 0.5, 1, GELO) === false && v.gelo === 0)
  const t = new Nemico({ vita: 100, vel: 10, bestia: 'goblin', immune: immuniDi('goblin') })
  controlla('chi non vola sì', t.gela(2, 0.5, 1, GELO) === true && t.gelo > 0)

  /* a zona: la bomba prende tutti quelli che ci sono sotto, e chi è
     immune se la scrolla di dosso */
  const via = { puntoA: d => ({ x: d, y: 0 }) }
  const sotto = [new Nemico({ d: 0, vita: 50, vel: 0, bestia: 'goblin', immune: immuniDi('goblin') }),
                 new Nemico({ d: 10, vita: 50, vel: 0, bestia: 'arpia', immune: immuniDi('arpia') })]
  const scoppio = new Colpo({ x: 0, y: 0, tx: 5, ty: 0, t: 1, tipo: BOMBE, danno: 20, area: 40 })
  scoppio.impatto(sotto, via)
  controlla('la bomba ferisce il goblin e non l\'arpia', sotto[0].vita === 30 && sotto[1].vita === 50)
  controlla('e l\'arpia, presa dentro, ha il segno «immune»', sotto[1].respinto > 0)

  /* la torre non spreca colpi: con solo immuni a tiro non spara, e la
     ricarica non la consuma — resta pronta per il primo che può ferire */
  const campo = { via, S: 1 }
  const bomba = new Torre({ x: 0, y: 0, tipo: BOMBE })
  const pipi = new Nemico({ d: 10, vita: 50, vel: 0, bestia: 'pipistrello', immune: immuniDi('pipistrello') })
  uguale('con solo un pipistrello a tiro la bomba non spara', bomba.agisci(0.1, { ...campo, nemici: [pipi] }), null)
  controlla('e resta pronta', bomba.ricarica <= 0, `ricarica ${bomba.ricarica}`)
  controlla('e il pipistrello non ha nessun segno addosso', !(pipi.respinto > 0))
  const gob = new Nemico({ d: 5, vita: 50, vel: 0, bestia: 'goblin', immune: immuniDi('goblin') })
  const spari = bomba.agisci(0.01, { ...campo, nemici: [pipi, gob] })
  controlla('arriva un goblin: la bomba spara subito, e a lui',
            !!spari?.colpi?.length && spari.colpi.every(c => c.preso === gob),
            JSON.stringify(spari?.colpi?.map(c => c.preso?.bestia)))
  controlla('anche se il pipistrello è più avanti', pipi.d > gob.d)
  /* il ghiaccio: la folata parte solo se c'è qualcuno da gelare */
  const ghiaccio = new Torre({ x: 0, y: 0, tipo: GELO })
  uguale('con solo chi vola a tiro il ghiaccio non soffia',
         ghiaccio.agisci(0.1, { ...campo, nemici: [pipi] }), null)
  controlla('e resta pronto anche lui', ghiaccio.ricarica <= 0)
  controlla('con un goblin sì', !!ghiaccio.agisci(0.01, { ...campo, nemici: [pipi, gob] }) && gob.gelo > 0)
}

/* ══════════ 2. le file delle tappe rispettano le regole ══════════ */
for (const t of [...TAPPE, ...LIBERE]) {
  const g = guastiDelleImmunita(t)
  controlla(`${t.nome}: la fila dei mostri è giusta con le immunità`, !g.length, g.join(' · '))
  /* le prime otto ondate le feriscono le torri di apertura (o tutte, se
     la tappa è più corta): all'inizio le risorse non bastano per essere
     variegati. Dove non si può, lo dice `APERTURA_CORTA`, col perché —
     e la riga deve dire il vero in tutti e due i versi */
  const serve = Math.min(APERTURA_COPRE, Number.isFinite(t.ondate) ? t.ondate : APERTURA_COPRE)
  const copre = coperturaApertura(t), corta = APERTURA_CORTA[t.chiave || chiaveTappa(t)]
  if (!corta)
    controlla(`${t.nome}: l'apertura ferisce le prime ${serve} ondate`, copre >= serve, `ne copre ${copre}`)
  else {
    controlla(`${t.nome}: è nel registro delle aperture corte, e davvero non arriva a ${serve}`,
              copre < serve, `ne copre ${copre}: togli la riga da APERTURA_CORTA`)
    uguale(`${t.nome}: e il registro dice quante ne copre`, corta.copre, copre)
  }
  /* niente miste e niente capi dentro l'apertura: una mista vuole due
     risposte, un capo un'ondata intera in un corpo solo. Il capo della
     radice è l'eccezione: la tappa ha sette ondate e lui la chiude */
  const O = new Ondate(t)
  for (let o = 1; o <= serve; o++) {
    const b = O.bestiaDi(o)
    controlla(`${t.nome} · ondata ${o}: dentro l'apertura non è mista`, !b.con)
    if (b.capo && !(t.capo && o === t.ondate))
      controlla(`${t.nome} · ondata ${o}: dentro l'apertura non arriva un capo`, false)
  }
}
nota('aperture corte: ' + Object.entries(APERTURA_CORTA).map(([k, v]) => `${k} ${v.copre}/${APERTURA_COPRE}`).join(' · '))
/* nelle libere il capo arriva ogni dieci ondate, ed è chi la fila mette
   lì: almeno due torri lo devono ferire (vedi `capiAperti`) */
for (const l of LIBERE)
  controlla(`${l.nome}: i capi delle ondate tarate li feriscono almeno due torri`, capiAperti(l),
            l.mostri.join(' '))
/* e il profilo di ogni mostro: almeno una torre che ferisce lo tocca, e
   al massimo due che non lo toccano — con tre, fra le quattro torri una
   è il ghiaccio, e il mostro aveva una risposta sola e non si frenava */
for (const [id, m] of Object.entries(MOSTRI)) {
  controlla(`${m.nome}: c'è almeno una torre che lo ferisce`,
            Object.keys(TORRI).some(k => feritoDa(id, k)), immuniDi(id).join())
  controlla(`${m.nome}: è immune al massimo a ${IMMUNITA_MAX} torri`,
            m.immune.length <= IMMUNITA_MAX && immuniDi(id).length <= IMMUNITA_MAX, m.immune.join())
  if (m.vola) controlla(`${m.nome}: vola, quindi le bombe non lo toccano`, m.immune.includes('bombe'))
}
/* i volanti non sono tutti uguali: la seconda immunità cambia con la
   bestia. Il fantasma e il drago, che ne avevano tre, adesso gelano */
{
  const volanti = Object.entries(MOSTRI).filter(([, m]) => m.vola)
  controlla('i volanti non hanno tutti le stesse immunità',
            new Set(volanti.map(([, m]) => [...m.immune].sort().join())).size > 1)
  uguale('il fantasma: niente bombe, niente frecce', immuniDi('fantasma').sort().join(), [ARCIERE, BOMBE].sort().join())
  uguale('il drago: niente bombe, niente magia', immuniDi('drago').sort().join(), [MAGICA, BOMBE].sort().join())
  controlla('e tutti e due il gelo lo sentono', gelabile('fantasma') && gelabile('drago'))
}
nota('immunità: ' + Object.entries(MOSTRI).map(([id, m]) =>
  `${m.nome} ${immuniDi(id).map(k => TORRI[k].emoji).join('')}`).join(' · '))

/* ══════════ 3. dividersi e rialzarsi ══════════ */
const tappaDi = nome => TAPPE.find(t => t.nome === nome)
function campo(tappa) {
  const stato = { cuori: 0, onda: 0, uccisi: 0, torri: 0, energia: 0 }
  const b = creaBattaglia({ tappa, misure: MONDO, stato })
  b.inizia()
  return { b, stato }
}
{
  /* chi si divide: due pezzi da un terzo, che si spartiscono il
     pagamento */
  const { b, stato } = campo({ ...tappaDi('Le fogne'), vite: Array(20).fill(90) })
  const n = new Nemico({ d: 100, vita: 90, vel: 0, bestia: 'slime', abilita: 'dividi', paga: 2, onda: 1 })
  b.nemici.push(n)
  const prima = stato.energia
  n.vita = 0; n.cade(); b.caduto(n)
  b.nemici = b.nemici.filter(x => x.vivo)
  b.nemici.push(...b.nati); b.nati = []
  uguale('lo slime che cade lascia due pezzi', b.nemici.length, ABILITA.dividi.quanti)
  controlla('ognuno con un terzo della sua vita', b.nemici.every(p => Math.abs(p.vitaMax - 30) < 1e-9))
  uguale('e cadere lui non paga niente: pagano i pezzi', stato.energia, prima)
  for (const p of b.nemici) { p.vita = 0; p.cade(); b.caduto(p) }
  uguale('i due pezzi insieme pagano quanto lui', stato.energia - prima, 2 * CFG.perNemico)
  controlla('e un pezzo non si divide ancora', b.nati.length === 0)
}
{
  const n = new Nemico({ vita: 60, vel: 10, bestia: 'scheletro', abilita: 'risorge' })
  controlla('lo scheletro al primo colpo mortale non muore', n.ferisci(100, 'add') === false)
  controlla('resta a terra, e non si può colpire', n.aTerra > 0 && !n.bersaglio && n.vivo)
  const d = n.d
  n.cammina(0.5, 1e9)
  uguale('a terra non cammina', n.d, d)
  n.cammina(ABILITA.risorge.dopo, 1e9)
  controlla('poi si rialza con metà della vita', n.bersaglio && Math.abs(n.vita - 30) < 1e-9)
  controlla('e la seconda volta cade davvero', n.ferisci(100, 'add') === true)
}
/* le ondate con le abilità arrivano in meno, più distanziate, e valgono
   lo stesso */
for (const t of [...TAPPE.filter(x => x.abilita), LIBERE[0]]) {
  const ondate = new Ondate(t)
  for (let o = 1; o <= Math.min(12, Number.isFinite(t.ondate) ? t.ondate : 12); o++) {
    const b = ondate.bestiaDi(o)
    uguale(`${t.nome} · ondata ${o}: l'energia dell'ondata è quella di sempre`,
           Math.round(ondate.quantiDi(o) * ondate.pagaDi(o) * 1000), nemiciDiOnda(o) * 1000)
    if (b.abilita && !b.capo)
      controlla(`${t.nome} · ondata ${o} (${b.nome}): chi ${ABILITA[b.abilita].nome} arriva in meno`,
                ondate.quantiDi(o) < nemiciDiOnda(o))
  }
}
controlla('nel Bosco le abilità sono spente',
          TAPPE.filter(t => t.campagna === 'bosco').every(t => !t.abilita))
controlla('nelle partite libere ci sono sempre', LIBERE.every(l => l.abilita))
nota(`vita vera di chi fa qualcosa: si divide ×${vitaEffettiva('slime').toFixed(2)}, ` +
     `si rialza ×${vitaEffettiva('scheletro').toFixed(2)}`)

/* ══════════ 4. il capo ══════════ */
{
  const l = { ...LIBERE[0], vite: Array(20).fill(50) }
  const ondate = new Ondate(l)
  const o = CAPO.ogni
  controlla(`nella partita libera arriva il capo ogni ${CAPO.ogni} ondate`,
            ondate.eCapo(o) && ondate.eCapo(2 * o) && !ondate.eCapo(o - 1) && !ondate.eCapo(o + 1))
  uguale('il capo è uno solo', ondate.quantiDi(o), 1)
  uguale('con la vita di tutta l\'ondata, e un decimo', Math.round(ondate.vitaDi(o)),
         Math.round(50 * nemiciDiOnda(o) * CAPO.vita))
  uguale('e paga come l\'ondata intera', ondate.pagaDi(o), nemiciDiOnda(o))
  controlla('cammina più piano', ondate.velocitaDi(o) < ondate.velocitaDi(o - 1))
  controlla('e il preavviso lo dice', ondate.prossime(o - 3, 3).some(p => p.capo && p.onda === o))
  const capi = TAPPE.filter(t => t.capo)
  controlla('nella campagna il capo chiude l\'ultima tappa di ogni campagna, e solo quella',
            capi.length === 4 && capi.every(t => new Ondate(t).eCapo(t.ondate) && !new Ondate(t).eCapo(t.ondate - 1)),
            capi.map(t => t.nome).join(', '))
  /* se arriva al castello se ne porta via tre */
  const { b, stato } = campo(l)
  b.torri.push({ agisci: () => null })
  stato.onda = o - 1
  b.nuovaOnda()
  b.generaNemico(); b.daGenerare = 0
  const capo = b.nemici[0]
  controlla('in campo è grande e porta la corona', capo.capo && capo.taglia === CAPO.taglia)
  capo.d = 1e9
  const cuori = stato.cuori
  b.muoviNemici(0.01)
  uguale('arrivato al castello, toglie tre cuori', cuori - stato.cuori, CAPO.cuori)
}

/* ══════════ 4b. le ondate miste ══════════
   Due tipi mescolati nella stessa fila, con immunità che si incastrano:
   una torre sola non basta. Le regole stanno in `data/mostri.js`
   (`coppiaDellOnda`, `guastiDelleMiste`) e il validatore le ripete. */
{
  for (const t of [...TAPPE, ...LIBERE]) {
    const g = guastiDelleMiste(t, Number.isFinite(t.ondate) ? t.ondate : 30)
    controlla(`${t.nome}: le ondate miste rispettano la regola della coppia`, !g.length, g.join(' · '))
  }
  /* dove arrivano: in campagna solo in fondo alle tappe di Mura e
     Palude, una per tappa; prima si impara un tipo alla volta */
  const misteDi = (t, fino) => {
    const o = new Ondate(t), out = []
    for (let k = 1; k <= fino; k++) if (o.bestiaDi(k).con) out.push(k)
    return out
  }
  for (const t of TAPPE) {
    const m = misteDi(t, t.ondate)
    const ultima = t.capo ? t.ondate - 1 : t.ondate
    if (t.miste)
      controlla(`${t.nome}: una mista sola, in fondo (l'ultima${t.capo ? ' prima del capo' : ''}, o quella prima)`,
                m.length === 1 && m[0] >= ultima - 1 && m[0] <= ultima, m.join())
    else uguale(`${t.nome}: nessuna mista (${t.campagna}, ${t.ondate} ondate)`, m.length, 0)
    if (t.miste) controlla(`${t.nome}: solo nelle Mura e nella Palude, e dopo l'apertura`,
                           MISTA.campagne.includes(t.campagna) && t.mista > APERTURA_COPRE)
  }
  /* nella partita infinita: una su cinque dalla decima, mai sul capo */
  for (const l of LIBERE) {
    const m = misteDi(l, 40)
    controlla(`${l.nome}: le miste arrivano dalla decima in poi, una ogni ${MISTA.ogni}`,
              m.length >= 5 && m[0] >= MISTA.da && m.every((o, i) => !i || o - m[i - 1] === MISTA.ogni),
              m.join(' '))
    controlla(`${l.nome}: e mai sull'ondata del capo`, m.every(o => o % CAPO.ogni !== 0))
    controlla(`${l.nome}: e le coppie cambiano`, new Set(m.map(o => {
      const b = new Ondate(l).bestiaDi(o); return b.id + b.con.id })).size > 1)
  }
  /* un'ondata mista vera: la prima della radura grande */
  const l = { ...LIBERE[0], vite: Array(20).fill(50) }
  const ondate = new Ondate(l)
  const o = misteDi(l, 40)[0]
  const b = ondate.bestiaDi(o)
  const sparano = l.torri.filter(k => TORRI[k].danno)
  controlla(`ondata ${o}: nessuna torre ferisce tutti e due`,
            sparano.every(k => !(feritoDa(b.id, k) && feritoDa(b.con.id, k))), `${b.id} + ${b.con.id}`)
  controlla('e almeno due torri feriscono qualcuno',
            sparano.filter(k => feritoDa(b.id, k) || feritoDa(b.con.id, k)).length >= 2)
  uguale('le torri che non toccano nessuno dei due non fanno danno',
         immuniDellOnda(b).filter(k => TORRI[k].danno).length, 0)
  uguale('l\'energia è quella di un\'ondata normale',
         Math.round(ondate.quantiDi(o) * ondate.pagaDi(o) * 1000), nemiciDiOnda(o) * 1000)
  const chi = Array.from({ length: ondate.quantiDi(o) }, (_, k) => ondate.chiEsce(o, k).id)
  const [na, nb] = ondate.perTipoDi(o)
  uguale('metà e metà, contando la folla', [chi.filter(x => x === b.id).length, chi.filter(x => x === b.con.id).length].join(), [na, nb].join())
  controlla('alternati nella fila, non a blocchi', chi.slice(0, 6).join() !== Array(6).fill(chi[0]).join(),
            chi.slice(0, 8).join(' '))
  controlla('il preavviso la annuncia coi due mostri',
            ondate.prossime(o - 2, 3).some(p => p.onda === o && p.con && p.con.id === b.con.id))
  /* e in campo escono tutti e due, ognuno con le sue immunità */
  const { b: bat, stato } = campo(l)
  bat.torri.push({ agisci: () => null })
  stato.onda = o - 1
  bat.nuovaOnda()
  while (bat.daGenerare > 0) { bat.generaNemico(); bat.daGenerare-- }
  const tipi = new Set(bat.nemici.map(n => n.bestia))
  uguale('in campo scendono i due tipi', [...tipi].sort().join(), [b.id, b.con.id].sort().join())
  controlla('ognuno con le sue immunità',
            bat.nemici.every(n => n.immune.join() === immuniDi(n.bestia).join()))
  uguale('quanti ne annuncia', bat.nemici.length, ondate.quantiDi(o))
  /* chi si divide arriva in meno anche mescolato: il corridoio delle mura
     mescola slime e fantasma */
  const corr = TAPPE.find(t => t.nome === 'Il corridoio')
  const oc = new Ondate(corr), bc = oc.bestiaDi(corr.ondate)
  if (bc.con && (bc.abilita === 'dividi' || bc.con.abilita === 'dividi')) {
    const [p1, p2] = oc.perTipoDi(corr.ondate)
    const dividi = bc.abilita === 'dividi' ? p1 : p2, altro = bc.abilita === 'dividi' ? p2 : p1
    controlla(`${corr.nome}: chi si divide arriva in meno anche mescolato`, dividi < altro, `${p1} + ${p2}`)
  }
  nota('tappe delle Mura e della Palude senza mista: ' + TAPPE.filter(t =>
    MISTA.campagne.includes(t.campagna) && !t.miste).map(t => t.nome).join(', '))
  nota('le miste: ' + [...TAPPE.filter(t => t.miste), ...LIBERE].map(t => {
    const O = new Ondate(t)
    const m = misteDi(t, Number.isFinite(t.ondate) ? t.ondate : 20).map(k => {
      const x = O.bestiaDi(k); return `o${k} ${x.nome}+${x.con.nome}` })
    return `${t.nome}: ${m.join(', ')}`
  }).join(' · '))
  controlla('ogni libera ha delle coppie fra cui scegliere', LIBERE.every(x => coppieDi(x).length >= 2))
}

/* ══════════ 5. la fretta ══════════ */
uguale('niente attesa risparmiata, niente premio', premioDellaFretta(0), 0)
controlla('più tempo risparmiato, più premio', premioDellaFretta(40) > premioDellaFretta(15))
uguale('ma con un tetto', premioDellaFretta(1e6), CFG.fretta.tetto)
{
  const t = { ...tappaDi('Il cortile'), vite: Array(20).fill(1e6), attesa: 30 }
  const { b, stato } = campo(t)
  b.costruisci(ARCIERE, {})
  controlla('a campo pulito si può chiamare', b.puoiChiamare() && b.inAttesa())
  const pieno = b.premioFretta()
  b.chiamaOnda()
  controlla('mentre l\'ondata esce dalla bocca, no', !b.puoiChiamare())
  for (let i = 0; i < 60 * 30 && b.daGenerare > 0; i++) b.avanza(1 / 60)
  controlla('uscita tutta, con i mostri ancora in campo, sì', b.puoiChiamare() && b.nemici.length > 0)
  const premio = b.premioFretta()
  controlla('e rende qualcosa', premio > 0, `premio ${premio}, a campo pulito ${pieno}`)
  const prima = stato.energia
  b.chiamaOnda()
  uguale('chiamata: l\'ondata dopo parte', stato.onda, 2)
  uguale('col premio in tasca', stato.energia - prima, premio)
  controlla('e l\'ondata di prima resta aperta finché non se ne va l\'ultimo', b.aperte.has(1) && b.aperte.has(2))
  /* si svuota il campo a mano: tutti via, e le due ondate si chiudono
     ognuna col suo premio */
  for (let i = 0; i < 60 * 40 && b.daGenerare > 0; i++) b.avanza(1 / 60)
  for (const n of b.nemici) { n.vita = 0 }
  const prima2 = stato.energia
  b.avanza(1 / 60); b.avanza(1 / 60)
  controlla('chiuse tutte e due', b.aperte.size === 0)
  controlla('e ognuna ha pagato il suo premio di fine ondata',
            stato.energia - prima2 >= 2 * CFG.fineOnda, `${stato.energia - prima2} ⚡`)
}
{
  /* il regalo della libera ferma la chiamata anche a ondata in corso */
  const l = { ...LIBERE[0], vite: Array(20).fill(1e6), regali: true }
  const { b } = campo(l)
  b.costruisci(ARCIERE, {})
  b.daScegliere = 1
  controlla('con un regalo da scegliere non si chiama niente', !b.puoiChiamare() && !b.chiamaOnda())
}

riassunto('immunità, abilità, capo e fretta')
