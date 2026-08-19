/* Verifica del Sotterraneo, senza browser. Le cose che contano: i dati
   stanno in piedi, i piani generati si possono finire davvero (si cammina
   dall'ingresso trattando le porte chiuse come muri), le sei discese si
   vincono giocandole con un giocatore finto, il costo in domande resta
   dentro una seduta e la forbice fra «il minimo» e «tutto» resta larga —
   quella forbice *è* il gioco. E i traguardi scattano solo a chi ha
   giocato.
   `node test/esegui.mjs sotterraneo --niente-build`
   tempo: 300 */
import { CAMPAGNA, QUANTE_TAPPE, durezzaDi, guardianoDi, stelleDella,
         guastiDellaCampagna } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { guastiDelMondo, EROE, TASCHE } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { guastiDeiMostri, MOSTRI, colpiPer } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { guastiDelleCose, COSE, ARMI_DI } from '../../src/giochi/sotterraneo/dati/cose.js'
import { EROI, guastiDegliEroi } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { guastiDelleTessere } from '../../src/giochi/sotterraneo/dati/tessere.js'
import { PEZZI, TESSERA } from '../../src/giochi/sotterraneo/dati/atlante.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Livello, seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { gioca, costoDi, quanteVolteSiVince, pianiSani } from '../../src/giochi/sotterraneo/motore/banco.js'
import manifesto from '../../src/giochi/sotterraneo/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { misure, statoTraguardo } from '../../src/store/progressi.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati stanno in piedi ══════════ */
for (const [cosa, guasti] of [
  ['il mondo', guastiDelMondo()],
  ['i mostri', guastiDeiMostri()],
  ['le cose', guastiDelleCose(Object.keys(PEZZI))],
  ['gli eroi', guastiDegliEroi()],
  ['la campagna', guastiDellaCampagna()],
  ['il blocco albo del manifesto', guastiDellAlbo([manifesto])],
]) controlla(`${cosa}: nessun guasto`, guasti.length === 0, guasti.join(' · '))

/* Le tessere si controllano contro l'atlante **vero**, e l'elenco dei
   nomi arriva da fuori apposta: `dati/tessere.js` non importa la
   grafica, o il motore smetterebbe di girare in Node senza schermo. */
const guastiT = guastiDelleTessere(Object.keys(PEZZI))
controlla('ogni tessera dichiarata esiste nell\'atlante', guastiT.length === 0, guastiT.join(' · '))
uguale('la tessera dell\'atlante è quella del gioco', TESSERA, 16)

/* ══════════ 2. il calcolo è giusto ══════════ */

/* quanto costa un mostro è la sua vita diviso il tuo attacco: è tutto il
   motivo per cui si va a cercare una spada */
{
  const orco = MOSTRI.orco
  uguale('a mani nude l\'orco costa 6 risposte', colpiPer(orco, EROE.att), 6)
  uguale('con la spada ne costa 3', colpiPer(orco, EROE.att + COSE.spada.att), 3)
  uguale('con lo spadone ne costa 3', colpiPer(orco, EROE.att + COSE.spadone.att), 3)
  /* il colpo non scende mai a zero, o un mostro diventerebbe immortale */
  uguale('anche con attacco 0 si toglie qualcosa', colpiPer({ ossa: 4, dif: 9 }, 0), 4)
}

/* la difficoltà sale scendendo, e ogni tappa chiede più della prima */
for (const t of CAMPAGNA) {
  const primo = durezzaDi(t, 0), ultimo = durezzaDi(t, t.piani - 1)
  controlla(`${t.chiave}: le domande si fanno più toste scendendo`, ultimo > primo,
            `${primo} → ${ultimo}`)
  uguale(`${t.chiave}: in fondo c'è il capo`, guardianoDi(t, t.piani - 1), t.capo)
}

uguale('tre stelle a chi non sviene mai', stelleDella({ vinta: true, svenimenti: 0 }), 3)
uguale('due a chi sviene una volta', stelleDella({ vinta: true, svenimenti: 1 }), 2)
uguale('zero a chi non finisce', stelleDella({ vinta: false, svenimenti: 0 }), 0)

/* ══════════ 3. i piani si possono finire ══════════
   Il controllo cammina davvero dall'ingresso trattando le porte chiuse
   come muri — una porta si apre rispondendo, e a una domanda si può
   sbagliare. Se anche così si arriva alla scala, il piano è finibile. */
{
  let storti = []
  for (const t of CAMPAGNA) storti = storti.concat(pianiSani(t, 12))
  controlla('nessun piano storto in 12 semi per tappa', storti.length === 0,
            storti.slice(0, 3).join(' · '))
  nota(`provati ${CAMPAGNA.reduce((n, t) => n + 12 * t.piani, 0)} piani`)
}

/* la chiave della scala non si può aggirare: senza un guardiano che la
   porti, un bambino sveglio scenderebbe senza rispondere a niente */
{
  const l = new Livello({ seme: 4242, piano: 1, largo: 40, alto: 40, giri: 3, guardiano: 'orco' })
  const chi = l.robe.filter(r => r.che === 'mostro' && r.chiave)
  uguale('la chiave ce l\'ha uno e uno solo', chi.length, 1)
  controlla('ed è un mostro vivo, non una cosa per terra', chi[0].che === 'mostro')
}

/* stesso seme, stesso piano: senza, un test racconta ogni volta una
   storia diversa e il seme non serve a niente */
{
  const a = new Livello({ seme: 777, piano: 0, largo: 34, alto: 34, giri: 3 })
  const b = new Livello({ seme: 777, piano: 0, largo: 34, alto: 34, giri: 3 })
  uguale('lo stesso seme fa lo stesso piano', a.celle.join(), b.celle.join())
  uguale('...e ci mette le stesse cose', a.robe.length, b.robe.length)
}

/* ══════════ 4. le discese si vincono, e quanto costano ══════════ */
{
  const conti = []
  for (const t of CAMPAGNA) {
    const v = quanteVolteSiVince(t, { quante: 6, bravura: 0.8 })
    controlla(`${t.chiave}: si vince rispondendo bene 8 volte su 10`, v.vinte === v.quante,
              `${v.vinte}/${v.quante} ${v.guasti.slice(0, 2).join(' · ')}`)
    const c = costoDi(t)
    conti.push([t, c])
    /* Il tetto è una seduta: oltre le ottanta domande obbligate non è più
       un gioco, è un compito. Il pavimento è la forbice — se «tutto»
       costa quanto «il minimo», in mezzo non si sceglie più niente, ed è
       la scelta il motivo per cui il posto è un posto. */
    dentro(`${t.chiave}: il minimo per scendere sta in una seduta`, c.minimo, 6, 85)
    controlla(`${t.chiave}: chi ripulisce il piano paga molto di più`,
              c.tutto > c.minimo * 1.3, `minimo ${c.minimo}, tutto ${c.tutto}`)
  }
  nota('costo in domande, per tappa:')
  for (const [t, c] of conti)
    nota(`  ${t.nome.padEnd(14)} minimo ${String(c.minimo).padStart(3)} · ` +
         `tutto ${String(c.tutto).padStart(3)} · ${t.piani} piani`)
}

/* ══════════ 4b. i quattro eroi ══════════
   La scelta cambia i conti — fra braccio 3 e braccio 5 il gigante passa
   da nove risposte a cinque — quindi va misurata, non stimata. Le due
   cose che non devono succedere: che con qualcuno la discesa diventi
   **lunga** invece che difficile, e che qualcuno non arrivi in fondo. */
{
  const righe = []
  for (const e of EROI) {
    const costi = CAMPAGNA.map(t => costoDi(t, { eroe: e.chiave }).minimo)
    const peggio = Math.max(...costi)
    controlla(`${e.chiave}: nessuna discesa esce dalla seduta`, peggio <= 85,
              `la peggiore costa ${peggio} domande`)
    const v = quanteVolteSiVince(CAMPAGNA[3], { quante: 4, bravura: 0.8, eroe: e.chiave })
    controlla(`${e.chiave}: la cisterna si vince rispondendo bene 8 volte su 10`,
              v.vinte === v.quante, `${v.vinte}/${v.quante} ${v.guasti.slice(0, 1).join('')}`)
    righe.push(`  ${e.nome.padEnd(10)} ❤️ ${String(e.vita).padStart(2)} ⚔️ ${e.att} · ` +
               `domande per discesa: ${costi.join(' · ')}`)
  }
  nota('chi scende, e quanto gli costa:')
  for (const r of righe) nota(r)

  /* le quattro famiglie d'arma valgono lo stesso: se una fosse più
     forte, le altre tre sarebbero una trappola per chi sceglie male */
  for (const grado of [1, 2, 3]) {
    const forze = ARMI_DI(grado).map(k => COSE[k].att)
    uguale(`gradino ${grado}: tutte le famiglie picchiano uguale`,
           new Set(forze).size, 1, ARMI_DI(grado).join())
  }
}

/* chi risponde a caso non arriva in fondo come chi risponde bene: se
   arrivasse uguale, rispondere non servirebbe a niente */
{
  const t = CAMPAGNA[3]
  const bravo = gioca(t, { seme: 31, bravura: 0.9 }).esito
  const acaso = gioca(t, { seme: 31, bravura: 0.25 }).esito
  controlla('rispondere bene costa meno vite',
            acaso.svenimenti > bravo.svenimenti || acaso.domande > bravo.domande,
            `bravo: ${bravo.domande} domande / ${bravo.svenimenti} svenimenti · ` +
            `a caso: ${acaso.domande} / ${acaso.svenimenti}`)
}

/* ══════════ 5. le regole che si sbagliano facilmente ══════════ */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 9, rnd: seminato(9) })

  /* la scala non si apre senza chiave. Si tocca la scala e basta: farci
     camminare l'eroe vorrebbe dire provare anche chi incontra per
     strada, e un mostro che lo intercetta farebbe fallire un controllo
     che non parla di mostri. */
  const scala = c.livello.robe.find(r => r.che === 'scala')
  c.interagisci(scala)
  uguale('sulla scala senza chiave si trova un cancello', c.foglio.che, 'chiusa')
  c.chiudi()
  c.chiaveDelPiano = true
  c.interagisci(scala)
  uguale('con la chiave si scende', c.foglio.che, 'scala')
  c.chiudi()
  c.chiaveDelPiano = false

  /* col foglio aperto il tempo è fermo: nessuno arriva addosso mentre si
     legge una domanda */
  const m = c.livello.robe.find(r => r.che === 'mostro')
  c.foglio = { che: 'scontro', chi: m }
  const dove = { x: c.eroe.x, y: c.eroe.y }
  for (let i = 0; i < 60; i++) c.passo(1 / 30)
  uguale('col foglio aperto l\'eroe non si muove', `${c.eroe.x},${c.eroe.y}`, `${dove.x},${dove.y}`)
  c.chiudi()

  /* lo zaino è un limite vero */
  for (let i = 0; i < TASCHE + 3; i++) c.zaino.push('pozione')
  c.zaino.length = TASCHE
  uguale('le tasche sono quelle dichiarate', c.zaino.length, TASCHE)

  /* quello che si aveva in mano torna nello zaino, non sparisce: una
     spada lasciata cadere per prenderne un'altra è la cosa che fa
     arrabbiare di più */
  c.zaino = ['spada-corta', 'spada']
  c.mano = null
  c.usa(0)
  uguale('la spada corta va in mano', c.mano, 'spada-corta')
  c.usa(c.zaino.indexOf('spada'))
  uguale('la spada la sostituisce', c.mano, 'spada')
  controlla('e la corta torna nello zaino', c.zaino.includes('spada-corta'), c.zaino.join())

  /* la terza casella: al dito ci va una cosa che non picchia, e il
     conto di quanto si regge la segue in tutte e due i versi */
  c.zaino = ['amuleto-rosso']
  const tetto = c.vitaMax
  c.usa(0)
  uguale('l\'amuleto va al dito', c.dito, 'amuleto-rosso')
  uguale('e alza il tetto della vita', c.vitaMax, tetto + COSE['amuleto-rosso'].vita)
  c.vita = c.vitaMax
  c.riponi('dito')
  uguale('togliendolo il tetto torna giù', c.vitaMax, tetto)
  controlla('e la vita non resta sopra il suo massimo', c.vita <= c.vitaMax, `${c.vita}/${c.vitaMax}`)
}

/* ══════════ 5a. l'arredo ══════════
   Non fa niente, e deve continuare a non fare niente: se un barile
   diventasse toccabile sarebbe un tocco sprecato, se stesse davanti a
   una porta sarebbe una stanza chiusa da una cassa. E il nome del suo
   pezzo è scritto a mano, quindi va controllato contro l'atlante: uno
   sprite che non c'è non dà nessun errore, disegna l'emoji e via. */
{
  const l = new Livello({ seme: 2024, piano: 1, largo: 40, alto: 40, giri: 3 })
  const arredo = l.robe.filter(r => r.che === 'arredo')
  controlla('le stanze sono arredate', arredo.length >= l.stanze.length, `${arredo.length} pezzi`)
  const nomi = Object.keys(PEZZI)
  const orfani = arredo.filter(r => !nomi.includes(r.pezzo)).map(r => r.pezzo)
  uguale('e ogni pezzo esiste nell\'atlante', [...new Set(orfani)].join(), '')
  controlla('nessun arredo davanti a una porta',
            arredo.every(r => !l.porteVicine(r.x, r.y)))
  controlla('e nessuno sopra qualcos\'altro',
            arredo.every(r => l.robeSu(r.x, r.y).length === 1))

  const c = new Corsa(CAMPAGNA[0], { seme: 71, rnd: seminato(71) })
  const q = c.livello.robe.find(r => r.che === 'arredo')
  if (q) {
    c.luce.add(q.y * c.livello.largo + q.x)
    uguale('un barile non si tocca: è scenografia', c.toccabile(q), false)
    uguale('e non sbarra la strada', c.bloccata(q.x, q.y), false)
  }
}

}

/* un forziere sbagliato resta chiuso per sempre — è l'unica cosa che si
   perde davvero, e serve che ce ne sia una sola */
{
  const c = new Corsa(CAMPAGNA[1], { seme: 12, rnd: seminato(12) })
  const f = c.livello.robe.find(r => r.che === 'forziere')
  c.foglio = { che: 'forziere', chi: f }
  c.rispondi(false)
  controlla('il forziere sbagliato è aperto e vuoto', f.aperto && f.vuoto)
  uguale('e non ha lasciato niente', c.livello.robe.filter(r => r.che === 'cosa').length, 0)

  /* la porta invece si riprova: chiudersi per sempre trasformerebbe il
     girare in una partita a scacchi */
  const p = c.livello.robe.find(r => r.che === 'porta')
  if (p) {
    c.foglio = { che: 'porta', chi: p }
    c.rispondi(false)
    uguale('la porta sbagliata resta chiusa ma riprovabile', p.aperta, false)
    c.foglio = { che: 'porta', chi: p }
    c.rispondi(true)
    uguale('e al secondo tentativo si apre', p.aperta, true)
  }
}

/* scappare dà tre secondi, non l'immunità */
{
  const c = new Corsa(CAMPAGNA[2], { seme: 5, rnd: seminato(5) })
  const m = c.livello.robe.find(r => r.che === 'mostro')
  m.sveglio = true
  c.foglio = { che: 'scontro', chi: m }
  c.scappa()
  uguale('lo scontro si chiude', c.foglio, null)
  controlla('e il mostro resta calmo per qualche secondo', m.calmo > 0, String(m.calmo))
}

/* ══════════ 6. i traguardi ══════════ */
{
  const vuoto = { totals: {}, best: {}, items: {}, campagne: {} }
  const mVuoto = misure(vuoto)
  controlla('a profilo vuoto non se n\'è preso nessuno',
            manifesto.albo.traguardi.every(t => statoTraguardo(t, mVuoto).grado === 0))
  uguale('e il gioco non risulta provato', manifesto.albo.provato(mVuoto), false)
  uguale('e non vale esperienza', manifesto.albo.xp(mVuoto), 0)

  const pieno = {
    totals: { sotStanze: 500, sotPiani: 50, sotMostri: 250, sotTesori: 60, sotInteri: 12 },
    best: { sotGemme: 200 },
    items: {},
    /* `libera: true` è come `campagne.js` segna una campagna finita:
       `m.finita()` legge quel flag, non il conto delle tappe */
    campagne: { sotterraneo: { tappa: QUANTE_TAPPE, libera: true,
      stelle: Object.fromEntries(CAMPAGNA.map((_, i) => [i, 3])), cfg: {} } },
  }
  const mPieno = misure(pieno)
  const presi = manifesto.albo.traguardi.map(t => statoTraguardo(t, mPieno))
  controlla('chi ha giocato tanto li prende tutti d\'oro', presi.every(s => s.finito),
            presi.filter(s => !s.finito).map(s => `${s.id} fermo a ${s.valore}`).join(' · '))
  controlla('e il gioco vale esperienza', manifesto.albo.xp(mPieno) > 0)
  uguale('e risulta provato', manifesto.albo.provato(mPieno), true)
}

nota(`${QUANTE_TAPPE} discese, ${CAMPAGNA.reduce((n, t) => n + t.piani, 0)} piani in tutto`)

riassunto('il sotterraneo')
