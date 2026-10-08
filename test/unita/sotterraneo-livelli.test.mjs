/* L'eroe che sale di livello (docs/sotterraneo/livelli.md): l'esperienza
   dei mostri battuti, le soglie, i punti da dare alle quattro
   caratteristiche e la regola del bilanciamento, quanto rende ognuna, le
   classi che partono e crescono diverse, il livello salito a metà
   discesa, la pagina dell'eroe. I mostri grossi e la roba con livello e
   rarità stanno in `unita/sotterraneo-rarita`.
   `node test/esegui.mjs sotterraneo-livelli --niente-build` */
import { CARATTERISTICHE, sogliaDi, livelloDi, quotaDi, espDi, guastiDeiLivelli, VITA_PER_TEMPRA, PUNTI_PER_LIVELLO,
         DOTE_OGNI } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { EROI, eroeDi, guastiDegliEroi } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { CRESCITA_NUOVA, rileggiCrescita, puntiDaDare, dai, stannoInsieme, chiTrattiene, puoiDare, daiTutti,
         caratteristica, crescitaA, SCARTO_AMMESSO } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { Corredo, schedaConLaRoba } from '../../src/giochi/sotterraneo/motore/corredo.js'
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
              ['Forza', 'Tempra', 'Scorza', 'Fortuna'])
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

/* ══════════ 4. le caratteristiche e quanto rendono ══════════ */
{
  for (const e of EROI) {
    const nudo = new Corredo({ eroe: e.chiave })
    uguale(`${e.chiave}: la forza di partenza è il suo braccio`, caratteristica(e, CRESCITA_NUOVA(), 'forza'), e.att)
    uguale(`${e.chiave}: la scorza di partenza vale la sua difesa (due punti per uno)`, Math.floor(caratteristica(e, CRESCITA_NUOVA(), 'scorza') / 2), e.dif)
    uguale(`${e.chiave}: al livello 1 i numeri sono quelli di sempre`, `${nudo.att}/${nudo.dif}/${nudo.vitaConLaRoba}`, `${e.att}/${e.dif}/${e.vita}`)
  }
  const liv = 6, base = { esp: sogliaDi(liv) }
  const con = k => new Corredo({ eroe: 'elfa', crescita: { ...base, [k]: 4 } })
  const zero = new Corredo({ eroe: 'elfa', crescita: base })
  uguale('quattro punti di forza: quattro di attacco', con('forza').att - zero.att, 4)
  uguale('quattro di tempra: dodici di vita', con('tempra').vitaConLaRoba - zero.vitaConLaRoba, 4 * VITA_PER_TEMPRA)
  uguale('quattro di scorza: due di difesa', con('scorza').dif - zero.dif, 2)
  controlla('quattro di fortuna: le gemme valgono di più', con('fortuna').valoreGemme > zero.valoreGemme)
  // le classi crescono diverse: la vita per livello e la dote
  const a5 = n => new Corredo({ eroe: n, crescita: { esp: sogliaDi(1 + DOTE_OGNI) } })
  controlla('salendo, il cavaliere prende più vita del mago', a5('cavaliere').vitaConLaRoba - eroeDi('cavaliere').vita >
            a5('mago').vitaConLaRoba - eroeDi('mago').vita)
  for (const e of EROI)
    uguale(`${e.chiave}: ogni ${DOTE_OGNI} livelli un punto da sé nella sua dote (${e.dote})`,
           caratteristica(e, { esp: sogliaDi(1 + DOTE_OGNI) }, e.dote) - (e.parte[e.dote] || 0), 1)
  stessaLista('le doti non sono tutte uguali', new Set(EROI.map(e => e.dote)).size > 2, true)
  const scheda = schedaConLaRoba('nano', null, { esp: sogliaDi(4) })
  uguale('la scheda delle avventure dice il livello', scheda.livello, 4)
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
  const cr = { esp: sogliaDi(20), forza: 9, tempra: 1, scorza: 1, fortuna: 1 }
  uguale('il decimo punto di forza con le altre a uno no: trattiene la prima delle più basse', chiTrattiene(cr, 'forza'), 'tempra')
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
  const c = new Corredo({ eroe: 'nano', crescita: { esp: sogliaDi(14), forza: 9, tempra: 1, scorza: 1, fortuna: 0 } })
  const car = Object.fromEntries(c.caratteristiche().map(x => [x.chiave, x]))
  controlla('la forza ha il «+» spento: la fortuna è rimasta indietro', car.forza.trattenuta && car.forza.dietro === 'fortuna')
  controlla('e la fortuna lo dice («prima un po\' di questa»)', car.fortuna.indietro && !car.fortuna.trattenuta)
  controlla('la tempra dice prima cosa cambia', car.tempra.cambia.some(x => x.em === '❤️' && x.dopo - x.prima === VITA_PER_TEMPRA))
  controlla('la scorza va a mezzi scudi', car.scorza.cambia.some(x => x.em === '🛡️' && /½/.test(String(x.prima) + String(x.dopo))),
            JSON.stringify(car.scorza.cambia))
  controlla('la fortuna si legge sulle gemme', car.fortuna.cambia.some(x => x.em === '💎'))
  // giù: dare un punto di tempra alza subito vita e tetto
  const d = new Corsa(CAMPAGNA[0], { seme: 2, eroe: 'mago', rnd: seminato(2), crescita: { esp: sogliaDi(3) } })
  const v = d.vita, t = d.vitaMax
  controlla('giù, la tempra alza vita e tetto insieme', d.daiUnPunto('tempra') && d.vita === v + VITA_PER_TEMPRA && d.vitaMax === t + VITA_PER_TEMPRA)
}

riassunto('l\'eroe sale di livello')
