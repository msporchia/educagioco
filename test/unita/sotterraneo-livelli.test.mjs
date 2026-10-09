/* L'eroe che sale di livello (docs/sotterraneo/livelli.md): l'esperienza
   dei mostri battuti, le soglie, i punti da dare alle quattro
   caratteristiche e la regola del bilanciamento, quanto rende ognuna, le
   classi che partono e crescono diverse, il livello salito a metà
   discesa, la pagina dell'eroe. I mostri grossi e la roba con livello e
   rarità stanno in `unita/sotterraneo-rarita`.
   `node test/esegui.mjs sotterraneo-livelli --niente-build` */
import { CARATTERISTICHE, sogliaDi, livelloDi, quotaDi, espDi, guastiDeiLivelli, VITA_PER_TEMPRA, PUNTI_PER_LIVELLO,
         DOTE_OGNI, TEMPRA_PER_DIFESA, SCHIVATA_PER_DESTREZZA, GEMME_PER_RIASSEGNARE } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { EROI, eroeDi, guastiDegliEroi, requisitoDi, REQUISITO_DEL_GRADINO } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { COSE, chiaveDelPezzo, aLivello } from '../../src/giochi/sotterraneo/dati/cose.js'
import { robaAttesa, crescitaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { CRESCITA_NUOVA, rileggiCrescita, puntiDaDare, dai, stannoInsieme, chiTrattiene, puoiDare, daiTutti,
         caratteristica, crescitaA, SCARTO_AMMESSO } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { Corredo, schedaConLaRoba, ROBA_VUOTA } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { cominciata } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati stanno in piedi ══════════ */
{
  const g = [...guastiDeiLivelli(), ...guastiDegliEroi()]
  controlla('i livelli e gli eroi stanno in piedi', !g.length, g.join(' · '))
  stessaLista('quattro caratteristiche coi nomi che un bambino capisce', CARATTERISTICHE.map(c => c.nome),
              ['Forza', 'Destrezza', 'Intelligenza', 'Tempra'])
  uguale('si comincia al livello 1', livelloDi(0), 1)
  uguale('sulla soglia si è al livello nuovo', livelloDi(sogliaDi(5)), 5)
  uguale('un punto prima no', livelloDi(sogliaDi(5) - 1), 4)
  const salti = Array.from({ length: 30 }, (_, n) => sogliaDi(n + 2) - sogliaDi(n + 1))
  controlla('ogni livello costa più del precedente, mai il doppio', salti.every((s, i) => !i || (s > salti[i - 1] && s < salti[i - 1] * 2)),
            salti.join(' '))
  const q = quotaDi(sogliaDi(3) + 10)
  controlla('il globo sa quanto è fatto del livello', q.livello === 3 && q.fatto === 10 && q.quota > 0 && q.quota < 1, JSON.stringify(q))
  nota(`soglie: ${[2, 3, 5, 8, 10, 12, 15, 20].map(n => `${n}→${sogliaDi(n)}`).join(' · ')}`)
}

/* ══════════ 2. l'esperienza viene dai mostri, tanta quanto sono forti ══════════ */
{
  controlla('un orco vale più di un ratto', espDi(MOSTRI.orco, 3) > espDi(MOSTRI.ratto, 3))
  controlla('lo stesso mostro vale di più più giù', espDi(MOSTRI.orco, 9) > espDi(MOSTRI.orco, 3))
  uguale('il mostro grosso tre volte tanto', espDi(MOSTRI.orco, 4, true), 3 * espDi(MOSTRI.orco, 4))
  // battere un mostro in una discesa dà la sua esperienza all'eroe, e nient'altro la dà
  const c = new Corsa(CAMPAGNA[1], { seme: 4, rnd: seminato(4) })
  const m = c.livello.robe.find(r => r.che === 'mostro' && !r.chiave)
  const prima = c.crescita.esp
  c.cade(m)
  uguale('battere un mostro dà la sua esperienza', c.crescita.esp - prima, espDi(MOSTRI[m.tipo], c.livelloQui))
  uguale('e la discesa la conta', c.espPresa, c.crescita.esp - prima)
  const e0 = c.crescita.esp
  c.chiaveDelPiano = true; c.foglio = { che: 'scala' }; c.scendi()
  uguale('un piano nuovo non dà esperienza', c.crescita.esp, e0)
}

/* ══════════ 3. salire di livello ══════════ */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 3, eroe: 'cavaliere', rnd: seminato(3), crescita: { esp: sogliaDi(2) - 1 } })
  c.vita = 5
  const tetto = c.vitaMax
  const m = c.livello.robe.find(r => r.che === 'mostro')
  c.cade(m)
  uguale('si sale di livello battendo un mostro', c.livelloEroe, 2)
  uguale('il cavaliere prende tre punti di vita a livello', c.vitaMax - tetto, eroeDi('cavaliere').vitaPerLivello)
  uguale('e la vita in più arriva subito (non è una pozione: niente piena forma)', c.vita, 5 + eroeDi('cavaliere').vitaPerLivello)
  controlla('la discesa lo festeggia', c.eventi.some(e => e.che === 'livello' && e.livello === 2))
  uguale('un punto da dare', puntiDaDare(c.crescita), PUNTI_PER_LIVELLO)
  const att = c.att
  controlla('dato alla forza, il colpo cresce subito', c.daiUnPunto('forza') && c.att === att + 1)
  uguale('e non ce ne sono altri', c.daiUnPunto('forza'), false)
  // la sosta non tiene la crescita: sta nell'avventura, accanto alla roba, e la ripresa la riceve
  const dato = scrivi(c, 0)
  controlla('la sosta non tiene l\'esperienza (sta nell\'avventura)', !('crescita' in dato) && !('esp' in dato))
  const r = leggi(dato, CAMPAGNA[0], c.roba, [], c.crescita)
  controlla('ripresa con la crescita dell\'avventura, l\'eroe è com\'era', r && r.livelloEroe === 2 && r.att === c.att && r.vitaMax === c.vitaMax,
            r && `${r.livelloEroe} ${r.att}/${c.att} ${r.vitaMax}/${c.vitaMax}`)
  controlla('un\'avventura con esperienza è cominciata', cominciata({ tappa: 0, stelle: {}, crescita: { esp: 3 } }))
}

/* ══════════ 4. le caratteristiche e quanto rendono ══════════
   Forza, destrezza, intelligenza e tempra (9 ottobre 2026: via scorza e fortuna). L'attacco viene dalla
   caratteristica dell'arma in mano; a tutti la forza dà difesa, la destrezza schivata, l'intelligenza energia. */
{
  for (const e of EROI) {
    const nudo = new Corredo({ eroe: e.chiave })
    uguale(`${e.chiave}: al livello 1 i numeri sono quelli di sempre`, `${nudo.att}/${nudo.dif}/${nudo.vitaConLaRoba}`, `${e.att}/${e.dif}/${e.vita}`)
  }
  const liv = 6, base = { esp: sogliaDi(liv) }
  const con = (k, mano = null) => new Corredo({ eroe: 'elfa', crescita: { ...base, [k]: 4 }, roba: { ...ROBA_VUOTA(), mano } })
  const zero = (mano = null) => new Corredo({ eroe: 'elfa', crescita: base, roba: { ...ROBA_VUOTA(), mano } })
  uguale('con la spada, quattro punti di forza: quattro di attacco', con('forza', 'spada').att - zero('spada').att, 4)
  uguale('con l\'arco la forza non tocca l\'attacco', con('forza', 'arco-corto').att - zero('arco-corto').att, 0)
  uguale('con l\'arco, quattro di destrezza: quattro di attacco', con('destrezza', 'arco-corto').att - zero('arco-corto').att, 4)
  uguale('a mani nude conta la caratteristica più alta', con('intelligenza').att, eroeDi('elfa').att + 4)
  uguale('la tempra dà difesa, una ogni tre punti', con('tempra').dif - zero().dif, Math.floor(4 / TEMPRA_PER_DIFESA))
  uguale('la forza no', con('forza').dif - zero().dif, 0)
  uguale('la destrezza fa schivare', con('destrezza').schivata - zero().schivata, 4 * SCHIVATA_PER_DESTREZZA)
  uguale('l\'intelligenza alza l\'energia', con('intelligenza').energiaMax - zero().energiaMax, 4)
  uguale('quattro di tempra: dodici di vita', con('tempra').vitaConLaRoba - zero().vitaConLaRoba, 4 * VITA_PER_TEMPRA)
  uguale('la fortuna non è più una caratteristica: viene solo dai pezzi', zero().fortuna, 0)
  const mago = new Corredo({ eroe: 'mago' }), cavaliere = new Corredo({ eroe: 'cavaliere' })
  controlla('il mago parte con più energia del cavaliere', mago.energiaMax > cavaliere.energiaMax, `${mago.energiaMax} ${cavaliere.energiaMax}`)
  // le classi crescono diverse: la vita per livello e la dote
  const a5 = n => new Corredo({ eroe: n, crescita: { esp: sogliaDi(1 + DOTE_OGNI) } })
  controlla('salendo, il cavaliere prende più vita del mago', a5('cavaliere').vitaConLaRoba - eroeDi('cavaliere').vita >
            a5('mago').vitaConLaRoba - eroeDi('mago').vita)
  for (const e of EROI)
    uguale(`${e.chiave}: ogni ${DOTE_OGNI} livelli un punto da sé nella sua dote (${e.dote})`,
           caratteristica(e, { esp: sogliaDi(1 + DOTE_OGNI) }, e.dote) - (e.parte[e.dote] || 0), 1)
  stessaLista('le doti non sono tutte uguali', new Set(EROI.map(e => e.dote)).size > 1, true)
  const scheda = schedaConLaRoba('nano', null, { esp: sogliaDi(4) })
  uguale('la scheda delle avventure dice il livello', scheda.livello, 4)
  // una crescita di prima (con scorza e fortuna) tiene esperienza e albero, e i punti tornano da dare
  const vecchia = rileggiCrescita({ esp: sogliaDi(6), forza: 3, tempra: 1, scorza: 1, fortuna: 0, albero: { fendente: 1 } }, 'cavaliere')
  controlla('una crescita di prima: i punti tornano da dare', vecchia.forza === 0 && puntiDaDare(vecchia) === 5 && vecchia.albero.fendente === 1,
            JSON.stringify(vecchia))
}

/* ══════════ 4b. i requisiti delle armi (rigidi: sotto non si indossa) ══════════ */
{
  const r = requisitoDi(COSE[chiaveDelPezzo('spadone', 13)])
  controlla('lo spadone vuole forza, tanta quanto il gradino e il livello', r && r.car === 'forza' && r.serve === REQUISITO_DEL_GRADINO[2] + 3, JSON.stringify(r))
  uguale('l\'arco vuole destrezza', requisitoDi(COSE['arco-lungo']).car, 'destrezza')
  uguale('la bacchetta intelligenza', requisitoDi(COSE[chiaveDelPezzo('scettro', 9)]).car, 'intelligenza')
  uguale('uno scudo niente', requisitoDi(COSE['scudo-ferro']), null)
  const debole = new Corredo({ eroe: 'cavaliere', crescita: { esp: sogliaDi(14) }, roba: { ...ROBA_VUOTA(), zaino: [chiaveDelPezzo('spadone', 30)] } })
  controlla('sotto il requisito non si indossa, e si dice perché', !debole.posso(debole.zaino[0]) && /Serve Forza/.test(debole.perchéNo(debole.zaino[0])),
            debole.perchéNo(debole.zaino[0]))
  uguale('la tasca resta piena: non si mette addosso', debole.indossaDallaTasca(0).che, 'niente')
  controlla('ma il bottino resta della classe (la porta)', debole.porta(debole.zaino[0]))
  uguale('il mercante lo propone al livello che si impugna', debole.posso(aLivello('spadone', debole.livelloPortabile('spadone', 30))), true)
  // la storia: la roba attesa a ogni discesa si indossa con la crescita attesa
  const fuori = []
  for (const e of EROI) for (let k = 0; k <= CAMPAGNA.length; k++) {
    const c = new Corredo({ eroe: e.chiave, roba: robaAttesa(e.chiave, k), crescita: crescitaAttesa(e.chiave, k) })
    for (const x of [c.mano, c.mancina].filter(Boolean)) if (!c.posso(x)) fuori.push(`${e.chiave} ${k}: ${x} (${c.perchéNo(x)})`)
    for (const x of c.zaino) if (COSE[x] && COSE[x].dove === 'mano' && !c.posso(x)) fuori.push(`${e.chiave} ${k}: ${x} in tasca`)
  }
  uguale('la roba della storia si indossa con i punti dati come il banco', fuori.join(' · '), '')
}

/* ══════════ 4c. riassegnare si paga in gemme ══════════ */
{
  const c = new Corredo({ eroe: 'nano', crescita: { esp: sogliaDi(6), forza: 3, tempra: 2 }, roba: { ...ROBA_VUOTA(), gemme: 30 } })
  uguale('cinque gemme a punto', c.costoRiassegnare, 5 * GEMME_PER_RIASSEGNARE)
  controlla('si riassegna: i punti tornano da dare, le gemme calano', c.riassegnaPunti() && puntiDaDare(c.crescita) === 5 && c.gemme === 5)
  uguale('niente da riassegnare, niente da pagare', c.riassegnaPunti(), false)
  const povero = new Corredo({ eroe: 'nano', crescita: { esp: sogliaDi(6), forza: 3, tempra: 2 }, roba: { ...ROBA_VUOTA(), gemme: 4 } })
  uguale('senza gemme non si riassegna', povero.riassegnaPunti(), false)
}

/* ══════════ 5. il bilanciamento dei punti (la regola dell'utente) ══════════
   Fra due caratteristiche, contando solo i punti dati: va bene se la
   differenza è al più 8 oppure se la più bassa è almeno la metà della più
   alta. I suoi tre esempi, e la promessa che un «+» acceso c'è sempre. */
{
  uguale('18 e 12 sì', stannoInsieme(18, 12), true)
  uguale('18 e 7 no', stannoInsieme(18, 7), false)
  uguale('50 e 30 sì', stannoInsieme(50, 30), true)
  uguale('al bordo: otto di differenza sì', stannoInsieme(SCARTO_AMMESSO, 0), true)
  uguale('nove no', stannoInsieme(SCARTO_AMMESSO + 1, 0), false)
  const cr = { esp: sogliaDi(20), forza: 9, destrezza: 1, intelligenza: 1, tempra: 1 }
  uguale('il decimo punto di forza con le altre a uno no: trattiene la prima delle più basse', chiTrattiene(cr, 'forza'), 'destrezza')
  uguale('e dai() lo rifiuta', dai(cr, 'forza'), null)
  controlla('alla tempra sì', puoiDare(cr, 'tempra') && dai(cr, 'tempra').tempra === 2)
  // un «+» acceso c'è sempre: diecimila mani di punti dati a caso, finché si può
  let spenti = 0, rotte = 0
  const rnd = seminato(17)
  for (let n = 0; n < 2000; n++) {
    let c = { ...CRESCITA_NUOVA(), esp: sogliaDi(2 + Math.floor(rnd() * 60)) }
    while (puntiDaDare(c) > 0) {
      const accesi = CARATTERISTICHE.map(x => x.chiave).filter(k => puoiDare(c, k))
      if (!accesi.length) { spenti++; break }
      c = dai(c, accesi[Math.floor(rnd() * accesi.length)])
    }
    const v = CARATTERISTICHE.map(x => c[x.chiave])
    for (const a of v) for (const b of v) if (!stannoInsieme(a, b)) rotte++
  }
  uguale('finché ci sono punti, almeno un «+» è acceso', spenti, 0)
  uguale('e la regola non si rompe mai', rotte, 0)
  // il banco (e la misura della storia) li dà rispettando la regola
  for (const e of EROI) {
    const c = crescitaA(e, 40)
    const v = CARATTERISTICHE.map(x => c[x.chiave])
    controlla(`${e.chiave}: al livello 40 il banco ha dato tutti i punti, e in regola`,
              !puntiDaDare(c) && v.every(a => v.every(b => stannoInsieme(a, b))), v.join(' '))
  }
  // un dato storto si rilegge senza più punti di quelli che il livello dà
  const storta = rileggiCrescita({ esp: sogliaDi(3), forza: 50 })
  uguale('più punti del livello si tolgono', storta.forza, 2)
  stessaLista('e un dato rotto è un eroe nuovo', rileggiCrescita('ciao'), CRESCITA_NUOVA())
}

/* ══════════ 6. la pagina dell'eroe ══════════ */
{
  const c = new Corredo({ eroe: 'nano', crescita: { esp: sogliaDi(14), forza: 9, destrezza: 1, intelligenza: 0, tempra: 1 } })
  const car = Object.fromEntries(c.caratteristiche().map(x => [x.chiave, x]))
  controlla('la forza ha il «+» spento: l\'intelligenza è rimasta indietro', car.forza.trattenuta && car.forza.dietro === 'intelligenza')
  controlla('e l\'intelligenza lo dice («prima un po\' di questa»)', car.intelligenza.indietro && !car.intelligenza.trattenuta)
  controlla('la tempra dice prima cosa cambia', car.tempra.cambia.some(x => x.em === '❤️' && x.dopo - x.prima === VITA_PER_TEMPRA))
  controlla('l\'intelligenza dice l\'energia', car.intelligenza.cambia.some(x => x.glifo === 'energia' && x.dopo - x.prima === 1))
  controlla('la destrezza dice la schivata', car.destrezza.cambia.some(x => x.em === '🌀'))
  controlla('ogni caratteristica ha il suo medaglione', c.caratteristiche().every(x => x.glifo && x.tinta))
  // giù: dare un punto di tempra alza subito vita e tetto
  const d = new Corsa(CAMPAGNA[0], { seme: 2, eroe: 'mago', rnd: seminato(2), crescita: { esp: sogliaDi(3) } })
  const v = d.vita, t = d.vitaMax
  controlla('giù, la tempra alza vita e tetto insieme', d.daiUnPunto('tempra') && d.vita === v + VITA_PER_TEMPRA && d.vitaMax === t + VITA_PER_TEMPRA)
}

riassunto('l\'eroe sale di livello')
