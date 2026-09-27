/* ═══════════════════════════════════════════════════════════════════
   IMMUNITÀ, ABILITÀ, IL CAPO E LA FRETTA — le regole nuove del campo

   Quattro cose arrivate insieme, e ognuna ha una promessa da tenere:

     1. **l'immunità è zero**: la torre a cui un mostro è immune non gli
        fa niente — né danno, né veleno, né gelo — e il colpo che
        rimbalza si vede (il segno «immune» sopra la testa);
     2. **le abilità non cambiano l'energia**: chi si divide lascia dei
        pezzi che si spartiscono quello che lui avrebbe pagato, chi si
        rialza paga una volta sola, e le ondate con le abilità arrivano
        in meno ma valgono lo stesso;
     3. **il capo è un'ondata**: uno solo, con la vita di tutta l'ondata
        e un decimo, più lento, e paga come l'ondata intera — se no la
        promessa dei `calcoli` saltava ogni dieci ondate;
     4. **la fretta paga il tempo risparmiato**, anche a ondata in corso,
        e non rompe le ondate: il premio di fine ondata, la moneta e il
        regalo arrivano lo stesso a chi chiama prima.

   Più le regole delle file (`guastiDelleImmunita`) su tutte le tappe:
   il validatore le dice, qui si contano.
   ═══════════════════════════════════════════════════════════════════ */
import { TAPPE, LIBERE, CFG, MONDO, premioDellaFretta, coperturaApertura, APERTURA_COPRE,
         nemiciDiOnda, capiAperti } from '../../src/data/castello.js'
import { MOSTRI, ABILITA, CAPO, IMMUNITA_MAX, immuniDi, feritoDa, gelabile, guastiDelleImmunita,
         vitaEffettiva } from '../../src/data/mostri.js'
import { TORRI } from '../../src/data/ops.js'
import { creaBattaglia } from '../../src/motore/battaglia.js'
import { Nemico } from '../../src/motore/castello/nemico.js'
import { Colpo } from '../../src/motore/castello/colpo.js'
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
}

/* ══════════ 2. le file delle tappe rispettano le regole ══════════ */
for (const t of [...TAPPE, ...LIBERE]) {
  const g = guastiDelleImmunita(t)
  controlla(`${t.nome}: la fila dei mostri è giusta con le immunità`, !g.length, g.join(' · '))
  controlla(`${t.nome}: l'apertura ferisce le prime ${APERTURA_COPRE} ondate`,
            coperturaApertura(t) >= Math.min(APERTURA_COPRE, t.mostri.length * 2),
            `ne copre ${coperturaApertura(t)}`)
}
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
