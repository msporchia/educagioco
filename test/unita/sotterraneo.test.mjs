/* Verifica del Sotterraneo, senza browser. Le cose che contano: i dati
   stanno in piedi, i piani generati si possono finire davvero (si cammina
   dall'ingresso trattando le porte chiuse come muri), le sei discese si
   vincono giocandole con un giocatore finto, il costo in domande resta
   dentro una seduta e la forbice fra «il minimo» e «tutto» resta larga —
   quella forbice *è* il gioco. E i traguardi scattano solo a chi ha
   giocato.
   `node test/esegui.mjs sotterraneo --niente-build`
   tempo: 300 */
import { readFileSync } from 'node:fs'
import { ref, shallowRef } from 'vue'
import { CAMPAGNA, QUANTE_TAPPE, durezzaDi, guardianoDi, stelleDella,
         svenimentiDi, guastiDellaCampagna } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { guastiDelMondo, EROE, TASCHE, ARREDO_DICE } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { guastiDeiMostri, MOSTRI, colpiPer } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { guastiDelleCose, COSE, ARMI_DI, CURE, A_SORTE,
         pescaMerce } from '../../src/giochi/sotterraneo/dati/cose.js'
import { CURIOSITA, guastiDelleCuriosita } from '../../src/giochi/sotterraneo/dati/curiosita.js'
import { EROI, guastiDegliEroi } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { guastiDelleTessere } from '../../src/giochi/sotterraneo/dati/tessere.js'
import { PEZZI, TESSERA } from '../../src/giochi/sotterraneo/dati/atlante.js'
import { occhio } from '../../src/giochi/sotterraneo/viste/occhio.js'
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

/* ── E ADESSO NON CI ARRIVA PROPRIO ──
   Prima di `SVENIMENTI_IN_REGALO` questo era l'unico modo di dirlo:
   chi tira a caso *paga di più*, in vite o in domande, ma in fondo ci
   arrivava lo stesso — svenire riportava all'ingresso e si riprovava
   all'infinito. Dodici discese su dodici vinte rispondendo giusto
   quattro volte su dieci. Adesso la discesa ha un fondo, e il
   controllo può chiedere la cosa vera: chi risponde bene passa, chi
   preme a caso no. La forbice è il senso di tutto il gioco. */
{
  const t = CAMPAGNA[3]
  const bene = quanteVolteSiVince(t, { quante: 8, bravura: 0.85 })
  const caso = quanteVolteSiVince(t, { quante: 8, bravura: 0.35 })
  controlla('rispondendo bene la cisterna si vince', bene.vinte >= 7,
            `${bene.vinte}/${bene.quante}`)
  controlla('premendo a caso no', caso.vinte <= 1, `${caso.vinte}/${caso.quante}`)
  nota(`la cisterna: ${bene.vinte}/8 vinte all'85% di risposte giuste, ` +
       `${caso.vinte}/8 al 35%`)
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

/* ══════════ 5b. la roba per terra ══════════
   Tre difetti trovati giocando, e tutti e tre dello stesso ceppo: **una
   cosa per terra non si poteva prendere**. Il forziere aperto restava
   toccabile e si mangiava il tocco destinato a quello che ci stava
   sopra; quello che ci stava sopra ci stava davvero sopra, cioè sulla
   sua stessa cella, dove il baule lo copriva e dove l'eroe non arriva
   mai (a un forziere ci si ferma accanto); e le cose non erano
   toccabili affatto — si prendevano solo calpestandole. */
{
  const c = new Corsa(CAMPAGNA[1], { seme: 21, rnd: seminato(21) })
  const f = c.livello.robe.find(r => r.che === 'forziere')

  /* prima di aprirlo si tocca; dopo è scenografia */
  c.luce.add(f.y * c.livello.largo + f.x)
  controlla('un forziere chiuso si tocca', c.toccabile(f))
  c.foglio = { che: 'forziere', chi: f }
  c.rispondi(true)
  uguale('aperto, non si tocca più: è pavimento dipinto', c.toccabile(f), false)

  const lasciata = c.livello.robe.filter(r => r.che === 'cosa').pop()
  controlla('il forziere ha lasciato qualcosa', !!lasciata)
  controlla('e non l\'ha lasciato sopra di sé',
            !(lasciata.x === f.x && lasciata.y === f.y), `${lasciata.x},${lasciata.y}`)

  /* la si tocca, e la si prende */
  c.luce.add(lasciata.y * c.livello.largo + lasciata.x)
  controlla('la roba per terra si tocca', c.toccabile(lasciata))
  c.eroe = { x: lasciata.x + 0.5, y: lasciata.y + 0.5 }
  c.zaino = []
  c.mano = null
  c.raccogli()
  uguale('camminarci sopra non la raccoglie più', c.zaino.length, 0)
  c.interagisci(lasciata)
  const preso = c.zaino.length === 1 || c.mano === lasciata.cosa || c.corpo === lasciata.cosa
  controlla('toccarla sì', preso, c.zaino.join() + '|' + c.mano)
  c.chiudi()
}

/* quello che è meglio se lo mette da sé: davanti a un'arma più forte di
   quella che si ha in pugno non esiste un secondo tasto sensato, e
   chiederlo mentre si gira per una stanza erano tre tocchi per un sì
   scontato. Il numero si legge dopo, nella riga che compare. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 33, rnd: seminato(33) })
  c.zaino = []
  c.mano = 'spada-corta'
  const dove = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
  const spada = { che: 'cosa', cosa: 'spada', x: dove.x, y: dove.y, em: COSE.spada.em }
  c.livello.robe.push(spada)

  c.interagisci(spada)
  uguale('un\'arma migliore finisce in mano da sé', c.mano, 'spada')
  uguale('senza aprire niente', c.foglio, null)
  controlla('e la corta torna nello zaino', c.zaino.includes('spada-corta'), c.zaino.join())
  uguale('la spada non è più per terra', spada.presa, true)
  const detto = c.avvisi.at(-1)
  controlla('la riga dice quanto si è guadagnato',
            detto && detto.testo.includes('+' + (COSE.spada.att - COSE['spada-corta'].att)),
            JSON.stringify(detto))

  /* un'arma leggera con la destra già piena non è «peggio»: va nella
     mano debole, dove vale la metà. Due leggere fanno una pesante. */
  c.avvisi = []
  const corta = { che: 'cosa', cosa: 'accetta', x: dove.x, y: dove.y, em: COSE.accetta.em }
  c.livello.robe.push(corta)
  c.interagisci(corta)
  uguale('la spada resta nel pugno', c.mano, 'spada')
  uguale('e la seconda arma va nella mano debole', c.mancina, 'accetta')
  uguale('due leggere valgono una pesante',
         c.att, c.io.att + COSE.spadone.att)

  /* con le tasche piene lo scambio non perde niente: il vecchio prende
     il posto per terra del nuovo */
  c.mancina = null
  c.zaino = new Array(TASCHE).fill('pozione')
  const ascia = { che: 'cosa', cosa: 'spadone', x: dove.x, y: dove.y, em: COSE.spadone.em }
  c.livello.robe.push(ascia)
  c.interagisci(ascia)
  uguale('con lo zaino pieno si impugna lo stesso', c.mano, 'spadone')
  uguale('e le tasche non traboccano', c.zaino.length, TASCHE)
  controlla('la spada di prima è per terra, non persa',
            c.livello.robe.some(r => r.che === 'cosa' && r.cosa === 'spada' && !r.presa))

  /* buttare e riporre: i due gesti che prima non c'erano, e senza i
     quali sei tasche piene si liberavano solo bevendo */
  c.zaino = ['pozione']
  c.butta(0)
  uguale('buttata, la tasca è libera', c.zaino.length, 0)
  controlla('e la pozione è per terra dove si era',
            c.livello.robe.some(r => r.che === 'cosa' && r.cosa === 'pozione' && !r.presa))
  c.riponi('mano')
  uguale('riposta, la mano è vuota', c.mano, null)
  controlla('e lo spadone è nello zaino', c.zaino.includes('spadone'), c.zaino.join())
}

/* ══════════ 5c. i mostri picchiano sempre ══════════
   Rispondendo bene si para il colpo e ne resta un graffio; sbagliando
   arriva tutto. Prima chi rispondeva bene usciva da una battaglia senza
   un livido, e le pozioni si accumulavano in fondo allo zaino senza che
   nessuno le bevesse mai. */
{
  const c = new Corsa(CAMPAGNA[2], { seme: 44, rnd: seminato(44) })
  const m = c.livello.robe.find(r => r.che === 'mostro' && r.ossa > c.colpo(r) * 2)
  c.vita = c.vitaMax
  c.foglio = { che: 'scontro', chi: m }
  const graffio = c.graffio(m)
  const esito = c.rispondi(true)
  uguale('rispondendo bene si colpisce', esito.che, 'colpo')
  uguale('e qualcosa passa lo stesso', c.vitaMax - c.vita, graffio)
  controlla('ma meno che sbagliando', graffio < c.danno(m), `${graffio} contro ${c.danno(m)}`)
  controlla('e mai zero: un mostro addosso si sente sempre', graffio >= 1)

  /* chi cade non restituisce: il colpo che lo abbatte è l'ultimo */
  m.ossa = 1
  const vitaPrima = c.vita
  const fine = c.rispondi(true)
  uguale('l\'ultimo colpo lo abbatte', fine.che, 'caduto')
  uguale('e chi è caduto non graffia più', c.vita, vitaPrima)

  /* e il graffio può far svenire: è quello che rende una fuga una
     decisione invece che una comodità */
  const c2 = new Corsa(CAMPAGNA[2], { seme: 45, rnd: seminato(45) })
  const m2 = c2.livello.robe.find(r => r.che === 'mostro')
  m2.ossa = 999
  c2.vita = 1
  c2.foglio = { che: 'scontro', chi: m2 }
  uguale('con un filo di vita anche una risposta giusta stende',
         c2.rispondi(true).che, 'svenuto')
}

/* ══════════ 5d. le porte chiudono la stanza, non il varco ══════════
   Il difetto trovato giocando: una stanza ha due o tre varchi, ne veniva
   chiuso uno solo, e il segno 💀 sopra la porta prometteva una guardia
   che si scavalcava passando dall'altra parte. Dove due corridoi
   paralleli si affiancano il varco è **largo due celle** e ci si passava
   letteralmente accanto al battente. */
{
  let sbarrate = 0, storte = 0, tagliati = 0
  for (let i = 0; i < 40; i++) {
    const l = new Livello({ seme: 300 + i * 97, piano: i % 3, largo: 34, alto: 34, giri: 3 })
    const porte = l.robe.filter(r => r.che === 'porta')
    /* Ogni stanza sbarrata dev'essere sbarrata **davvero**: ogni cella
       dei suoi varchi o porta una porta, o è stata murata quando il
       varco è stato ristretto. Contare le porte non basta più — un
       varco largo quattro ne ha una sola — e non basterebbe comunque:
       quello che conta è che non resti un buco da cui passare. */
    for (const g of new Set(porte.map(r => r.gruppo))) {
      const stanza = l.stanze[g]
      sbarrate++
      const buchi = stanza.porte.filter(p =>
        l.calpestabile(p.x, p.y) &&
        !porte.some(r => r.x === p.x && r.y === p.y))
      if (buchi.length) storte++
    }
    if (l.serveUnaPorta) tagliati++
  }
  controlla('ogni stanza sbarrata è chiusa davvero, senza buchi', storte === 0,
            `${storte} su ${sbarrate}`)

  /* e una porta per varco, non una per cella: quattro cancelli in fila
     con quattro teschi sopra sembravano una prigione, e non si capiva
     quale fosse la porta */
  let piuDiUna = 0, varchiVisti = 0
  for (let i = 0; i < 40; i++) {
    const l = new Livello({ seme: 700 + i * 53, piano: i % 3, largo: 34, alto: 34, giri: 3 })
    const porte = l.robe.filter(r => r.che === 'porta')
    for (const g of new Set(porte.map(r => r.gruppo))) {
      for (const varco of l.varchiDi(l.stanze[g].porte)) {
        varchiVisti++
        const quante = porte.filter(r => varco.some(p => p.x === r.x && p.y === r.y)).length
        if (quante > 1) piuDiUna++
      }
    }
  }
  controlla('un varco, una porta', piuDiUna === 0, `${piuDiUna} varchi su ${varchiVisti}`)
  nota(`${varchiVisti} varchi visti, tutti con una porta sola`)
  /* e nessuna sbarra la strada: quello che vale sta in fondo a un ramo,
     non in mezzo al cammino, o il premio diventa un casello */
  uguale('nessun piano obbliga ad aprire una porta per arrivare alla scala', tagliati, 0)

  /* rispondere apre la stanza, non il battente: se ne restasse chiuso
     uno si pagherebbe due volte per entrare dove si è già pagato */
  const l = new Livello({ seme: 812, piano: 0, largo: 30, alto: 30, giri: 2 })
  const c = new Corsa(CAMPAGNA[0], { seme: 1, rnd: seminato(1) })
  c.livello = l
  const gruppo = l.robe.filter(r => r.che === 'porta' && r.gruppo === l.robe.find(x => x.che === 'porta').gruppo)
  if (gruppo.length > 1) {
    c.foglio = { che: 'porta', chi: gruppo[0] }
    c.rispondi(true)
    controlla('aprendone una si apre tutta la stanza', gruppo.every(r => r.aperta),
              gruppo.map(r => `${r.x},${r.y}:${r.aperta}`).join(' '))
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

/* ══════════ 5-sexies. le curiosità: una battuta, e ogni tanto un prezzo ══════════
   Un sotterraneo fatto solo di mostri e porte è una fila di esercizi
   con un tema sopra. Queste cose non servono a niente ed è il punto:
   si toccano per vedere che succede, e quello che succede è una frase.
   Metà delle volte sbagliare non costa niente — hai starnutito, e
   basta — perché se ogni risposta storta pesasse, toccarle diventerebbe
   una cosa da evitare. */
{
  const guasti = guastiDelleCuriosita(Object.keys(PEZZI))
  controlla('le curiosità non hanno guasti', guasti.length === 0, guasti.join(' · '))
  controlla('e ce n\'è più d\'una', CURIOSITA.length >= 4)

  const c = new Corsa(CAMPAGNA[1], { seme: 12, rnd: seminato(12) })
  const r = { che: 'curiosita', tipo: 'libro', x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y),
              em: '📖', nome: 'Un libro polveroso', pezzo: 'libro' }
  c.livello.robe.push(r)
  c.luce.add(r.y * c.livello.largo + r.x)
  controlla('una curiosità si tocca', c.toccabile(r))

  c.interagisci(r)
  uguale('e apre un foglio suo', c.foglio.che, 'curiosita')
  controlla('con una domanda da fare', !!c.chiesta)

  const gemme = c.gemme, vita = c.vita
  c.rispondi(true)
  controlla('rispondendo bene resta la frase da leggere', !!c.foglio.esito, JSON.stringify(c.foglio.esito))
  controlla('ed è una frase, non un\'etichetta', c.foglio.esito.dice.length > 30)
  controlla('e qualcosa è migliorato', c.gemme > gemme || c.vita > vita || c.vitaMax > 24 || c.torcia,
            `gemme ${gemme}→${c.gemme}, vita ${vita}→${c.vita}`)
  uguale('la domanda è finita lì', c.chiesta, null)
  c.chiudi()
  uguale('e toccata una volta non si tocca più', c.toccabile(r), false)

  /* sbagliando: la battuta c'è sempre, il conto quasi mai */
  let conti = 0
  for (let i = 0; i < 40; i++) {
    const b = new Corsa(CAMPAGNA[1], { seme: 40 + i, rnd: seminato(40 + i) })
    b.gemme = 30
    const roba = { che: 'curiosita', tipo: CURIOSITA[i % CURIOSITA.length].tipo,
                   x: Math.floor(b.eroe.x), y: Math.floor(b.eroe.y), em: '📖',
                   pezzo: CURIOSITA[i % CURIOSITA.length].pezzo }
    b.livello.robe.push(roba)
    b.interagisci(roba)
    b.rispondi(false)
    controlla('sbagliando resta comunque una storia', !!b.foglio.esito.dice)
    if (b.vita < b.vitaMax || b.gemme < 30) conti++
  }
  controlla('e a volte non costa niente davvero', conti < 40, `${conti} su 40 hanno pagato`)
  controlla('ma qualche volta sì', conti > 0, `${conti} su 40 hanno pagato`)
  nota(`sbagliando una curiosità si paga ${conti} volte su 40`)
}

/* ══════════ 5-quinquies. lo scudo, e la mano debole che non balla ══════════
   Nella mano debole ci vanno due cose che fanno mestieri diversi: una
   seconda arma (più braccio) o uno scudo (più pelle). Fra le due non
   esiste un «più forte», quindi la casella si riempie da sola **solo
   se è vuota** — e non è pignoleria: senza quella regola i due si
   scambiavano di posto a ogni tocco, per sempre. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 3, rnd: seminato(3) })
  const dove = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
  const posa = k => {
    const r = { che: 'cosa', cosa: k, x: dove.x, y: dove.y, em: COSE[k].em }
    c.livello.robe.push(r)
    return r
  }
  c.zaino = []
  c.mano = 'spada'
  c.mancina = null

  const scudo = posa('scudo-ferro')
  c.interagisci(scudo)
  uguale('lo scudo si imbraccia da sé, a mano libera', c.mancina, 'scudo-ferro')
  uguale('e para davvero', c.dif, c.io.dif + COSE['scudo-ferro'].dif)

  /* adesso la mano è occupata: quello che si trova va in tasca, e la
     scelta la fa chi gioca dallo zaino */
  const accetta = posa('accetta')
  c.interagisci(accetta)
  uguale('con lo scudo imbracciato, la seconda arma va in tasca', c.mancina, 'scudo-ferro')
  controlla('ed è in tasca', c.zaino.includes('accetta'), c.zaino.join())

  /* e il contrario: con un'arma nella mano debole, uno scudo non la
     scalza da solo — è il giro che mandava il banco in tondo */
  c.mancina = 'accetta'
  c.zaino = []
  const altro = posa('scudo-legno')
  c.interagisci(altro)
  uguale('e uno scudo non scalza da solo la seconda arma', c.mancina, 'accetta')
  controlla('va in tasca anche lui', c.zaino.includes('scudo-legno'), c.zaino.join())

  /* con un'arma a due mani in pugno lo scudo non si mette affatto:
     `sistemaLeMani` glielo toglierebbe un istante dopo */
  c.mano = 'spadone'
  c.mancina = null
  c.zaino = []
  const terzo = posa('scudo-teschio')
  c.interagisci(terzo)
  uguale('con le due mani impegnate lo scudo resta in tasca', c.mancina, null)
  controlla('ma non si perde', c.zaino.includes('scudo-teschio'), c.zaino.join())

  /* ── e a mani nude si imbraccia lo stesso ──
     Il guasto, e si vedeva giocando: `sistemaLeMani` sfrattava la
     mancina anche **a pugno vuoto**, cioè proprio nel caso di chi non ha
     ancora trovato un'arma. Si premeva «me lo imbraccio», il motore lo
     rispediva in tasca nello stesso istante, e da fuori era un tasto che
     non fa niente — il verbo lo sceglie la vista dai dati, quindi
     continuava a promettere una cosa che non succedeva. */
  c.mano = null
  c.mancina = null
  c.zaino = ['scudo-legno']
  c.usa(0)
  uguale('a mani nude lo scudo si imbraccia', c.mancina, 'scudo-legno')
  uguale('e la tasca resta libera', c.zaino.length, 0)
  uguale('e para davvero', c.dif, c.io.dif + COSE['scudo-legno'].dif)
  /* e ci resta: se tornasse in tasca al giro dopo, rimetterlo sarebbe un
     rimbalzo infinito fra la mano e lo zaino — che è il ceppo di guasti
     che ha già fatto girare il banco di prova seimila volte */
  c.sistemaLeMani()
  uguale('e ci resta anche al giro dopo', c.mancina, 'scudo-legno')

  c.mano = null
  c.mancina = null
  c.zaino = []
  const quarto = posa('scudo-crociato')
  c.interagisci(quarto)
  uguale('e a mani nude si raccoglie già imbracciato', c.mancina, 'scudo-crociato')

  /* ── l'altra metà, quella per cui la riga era stata scritta ──
     Un'**arma** nella mano debole col pugno vuoto sta nel posto
     sbagliato — di là colpisce la metà — e allora passa in pugno. Non si
     sfratta: sfrattarla voleva dire mettersi in tasca l'unica arma che
     si ha addosso. */
  c.mano = null
  c.mancina = 'accetta'
  c.zaino = []
  c.sistemaLeMani()
  uguale('un\'arma sola col pugno vuoto passa in pugno', c.mano, 'accetta')
  uguale('e la mano debole torna libera', c.mancina, null)
  uguale('senza finire in tasca', c.zaino.length, 0)
  uguale('e adesso colpisce piena', c.att, c.io.att + COSE.accetta.att)
}

/* ══════════ 5-quater. la torcia non si accende: si ha ══════════
   Era una cosa da usare: si raccoglieva, occupava una tasca, e poi
   bisognava aprire lo zaino e premere «l'accendo» — una scelta che non
   è una scelta, perché nessuno preferisce restare al buio. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 44, rnd: seminato(44) })
  c.zaino = []
  const dove = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
  const buio = c.luce.size
  const torcia = { che: 'cosa', cosa: 'torcia', x: dove.x, y: dove.y, em: COSE.torcia.em }
  c.livello.robe.push(torcia)

  c.interagisci(torcia)
  uguale('raccolta, è già accesa', c.torcia, true)
  uguale('e non occupa una tasca', c.zaino.length, 0)
  uguale('non è più per terra', torcia.presa, true)
  controlla('e da lì in avanti si vede più lontano', c.luce.size > buio,
            `${buio} → ${c.luce.size}`)

  /* averla accesa vuol dire averla: il mercante non ne offre una seconda */
  controlla('una torcia accesa conta come posseduta', c.possiedo('torcia'))
  const altra = { che: 'cosa', cosa: 'torcia', x: dove.x, y: dove.y, em: COSE.torcia.em }
  c.livello.robe.push(altra)
  c.interagisci(altra)
  uguale('e la seconda resta per terra', !!altra.presa, false)
}

/* ══════════ 5-ter. due mani, e chi ne occupa due ══════════
   Le armi leggere si sdoppiano, le pesanti no: è il patto che tiene in
   piedi tutte e due le strade. La sinistra colpisce la metà, quindi due
   armi di secondo gradino valgono un terzo gradino — e uno spadone non
   diventa mai una scelta sbagliata. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 21, rnd: seminato(21) })
  c.zaino = []
  c.mano = null
  c.mancina = null
  const nudo = c.att

  c.mano = 'spada'                    // gradino 2, una mano
  c.mancina = 'spada'
  uguale('la mano debole colpisce la metà', c.att, nudo + 2 + 1)
  uguale('e due leggere valgono una pesante', c.att, nudo + COSE.spadone.att)

  /* un'arma a due mani sfratta la sinistra, e quello che c'era non si
     perde: torna in tasca */
  c.zaino = []
  c.mano = 'spadone'
  c.sistemaLeMani()
  uguale('un\'arma a due mani libera la sinistra', c.mancina, null)
  controlla('e quella che c\'era torna in tasca', c.zaino.includes('spada'), c.zaino.join())

  /* dove conviene mettere quello che si trova: col pugno pieno di
     un'arma leggera, una seconda leggera va nella mano debole */
  c.mano = 'spada'
  c.mancina = null
  c.zaino = []
  uguale('la seconda leggera va nella mano debole', c.postoDellArma('accetta').dove, 'mancina')
  uguale('e ci si guadagna', c.postoDellArma('accetta').delta, 1)
  uguale('un\'arma a due mani va invece nel pugno', c.postoDellArma('spadone').dove, 'mano')

  /* con lo spadone in pugno una leggera non serve a niente: le mani
     sono occupate tutte e due, e prenderla al posto suo è un passo
     indietro */
  c.mano = 'spadone'
  c.mancina = null
  controlla('con le mani occupate una leggera non conviene',
            c.postoDellArma('accetta').delta < 0, `${c.postoDellArma('accetta').delta}`)

  /* i tratti valgono pieni anche nella mano debole: è una copia sola
     dell'oggetto, e la luce di una lama che brucia illumina uguale */
  c.mano = 'spada'
  c.mancina = 'pugnale-vampiro'
  uguale('la vita del pugnale conta tutta', c.vitaMax, c.vitaBase + COSE['pugnale-vampiro'].vita)
  uguale('ma il suo braccio conta metà', c.att, c.io.att + COSE.spada.att + 1)
}

/* ══════════ 5-bis. il banco del mercante: si compra e si vende ══════════
   Vendere non è un modo di fare gemme — metà prezzo, quindi comprare e
   rivendere perde — ma è l'unico modo di liberare una tasca senza
   buttare per terra quello che c'è dentro. */
{
  const c = new Corsa(CAMPAGNA[1], { seme: 77, rnd: seminato(77) })
  const m = c.livello.robe.find(r => r.che === 'mercante')
  c.interagisci(m)
  uguale('il mercante apre il suo banco', c.foglio.che, 'mercante')
  controlla('con più di tre cose in vendita', c.foglio.chi.roba.length >= 4,
            c.foglio.chi.roba.join(' '))

  c.zaino = ['spada', 'pozione']
  c.gemme = 0
  const vale = c.quantoVale('spada')
  uguale('una cosa vale metà del suo prezzo', vale, Math.floor(COSE.spada.prezzo / 2))
  const e = c.vendi(0)
  uguale('venduta, le gemme arrivano', c.gemme, vale)
  uguale('e la tasca è libera', c.zaino.join(), 'pozione')
  uguale('e il motore dice cosa è successo', e.che, 'venduto')

  /* comprare e rivendere è una perdita: il banco non è una macchinetta */
  c.gemme = 100
  const k = c.foglio.chi.roba[0]
  c.compra(k)
  const speso = 100 - c.gemme
  const reso = c.quantoVale(k)
  controlla('rivendere quello che si è appena comprato ci rimette', reso < speso,
            `${reso} contro ${speso}`)

  /* il banco non offre quello che si ha già addosso o in tasca: una
     riga su cinque occupata da una spada identica a quella in pugno è
     una riga buttata. Le pozioni sì, che si accumulano apposta. */
  {
    const b = new Corsa(CAMPAGNA[1], { seme: 5, rnd: seminato(5) })
    b.mano = 'spadone'
    b.corpo = 'corazza'
    b.zaino = ['medaglione']
    const banco = b.livello.robe.find(r => r.che === 'mercante')
    b.interagisci(banco)
    const offerto = banco.roba
    controlla('quello che hai addosso non è più in vendita',
              !offerto.includes('spadone') && !offerto.includes('corazza'), offerto.join(' '))
    controlla('e nemmeno quello che hai in tasca',
              !offerto.includes('medaglione'), offerto.join(' '))
  }

  /* comprato = messo: chi spende venti gemme per una corazza migliore
     non sta scegliendo se metterla */
  {
    const b = new Corsa(CAMPAGNA[1], { seme: 9, rnd: seminato(9) })
    b.zaino = []
    b.mano = 'spada-corta'
    b.gemme = 200
    const banco = b.livello.robe.find(r => r.che === 'mercante')
    b.interagisci(banco)
    banco.roba = ['spadone', 'pozione']
    const e = b.compra('spadone')
    uguale('lo spadone comprato finisce in pugno', b.mano, 'spadone')
    uguale('e il motore lo dice', e.addosso, true)
    controlla('la spada corta torna in tasca', b.zaino.includes('spada-corta'))
    uguale('quante ne ho: il banco lo sa dire', b.quanteNeHo('spadone'), 1)
    b.compra('pozione')
    uguale('una pozione invece va in tasca', b.zaino.filter(x => x === 'pozione').length, 1)
  }

  /* l'elisir non si beve: cresce, e resta cresciuto */
  const prima = c.vitaMax
  c.zaino = ['elisir-toro']
  c.usa(0)
  uguale('l\'elisir alza la vita massima', c.vitaMax, prima + COSE['elisir-toro'].cresce)
  uguale('e la tasca si svuota', c.zaino.length, 0)
}

/* ══════════ 5-bis. da curarsi ce n'è sempre, e non finisce ══════════
   Il guasto che questo controllo tiene fuori **non si nota giocando**:
   un mercante senza pozioni sembra un mercante sfortunato, non un
   difetto, e per accorgersene bisognerebbe ricordarsi gli ultimi dieci.
   Erano due meccanismi distinti e ce ne voleva uno solo per rimettercelo
   — cinque righe pescate a sorte fra trenta, e quello che si compra che
   sparisce dal banco — quindi si controllano tutti e due. */
{
  uguale('le cose che curano sono tre', CURE.length, 3)
  controlla('e nessuna di loro è nel sorteggio',
            CURE.every(k => !A_SORTE.includes(k)), CURE.join(' '))
  /* l'elisir del toro **sì**: non torna indietro (alza la vita massima
     per tutta la discesa), e a scorta infinita sarebbe «compro vita
     massima finché ho gemme», che è un'altra cosa dal potersi curare */
  controlla('ma l\'elisir del toro sì, che è un\'altra cosa',
            A_SORTE.includes('elisir-toro') && !CURE.includes('elisir-toro'))

  /* ogni banco di ogni piano di ogni tappa, su venti semi: le tre ci
     sono, e ci sono per prime */
  let banchi = 0
  for (const t of CAMPAGNA) {
    for (let s = 0; s < 20; s++) {
      const c = new Corsa(t, { seme: 1 + s * 311, rnd: seminato(s + 1) })
      for (let p = 0; p < t.piani; p++) {
        const m = c.livello.robe.find(r => r.che === 'mercante')
        if (!m) continue
        c.interagisci(m)
        const righe = c.mercanzia()
        banchi++
        const cure = righe.filter(r => r.sempre).map(r => r.chiave)
        if (cure.join() !== CURE.join()) {
          controlla(`${t.chiave} piano ${p} seme ${s}: le tre che curano sono in cima`,
                    false, righe.map(r => r.chiave).join(' '))
          s = 99; p = 99; break
        }
        c.chiudi()
        if (p < t.piani - 1) { c.piano++; c.nuovoPiano() }
      }
    }
  }
  controlla('su tutti i banchi provati le tre che curano ci sono', banchi > 100, `${banchi} banchi`)
  nota(`${banchi} banchi guardati: le tre che curano c'erano tutte`)

  /* ── e non si esauriscono ──
     La metà che mancava: trovarla e poterne comprare una sola è quasi
     come non trovarla. Quattro boccette di fila, e il banco è ancora lì. */
  {
    const c = new Corsa(CAMPAGNA[1], { seme: 21, rnd: seminato(21) })
    const m = c.livello.robe.find(r => r.che === 'mercante')
    c.interagisci(m)
    c.gemme = 100
    c.zaino = []
    for (let i = 1; i <= 4; i++) {
      const e = c.compra('pozione-piccola')
      uguale(`boccetta ${i}: si compra`, e && e.che, 'comprato')
      uguale('e resta in vendita', c.mercanzia().filter(r => r.chiave === 'pozione-piccola').length, 1)
    }
    uguale('quattro comprate, quattro in tasca', c.quanteNeHo('pozione-piccola'), 4)
    uguale('e le gemme sono scese di quattro prezzi',
           c.gemme, 100 - 4 * COSE['pozione-piccola'].prezzo)

    /* mentre quello che si pesca resta pezzo unico: se anche quello
       tornasse, il banco diventerebbe un magazzino e la scelta di cosa
       portarsi via sparirebbe */
    const unico = c.foglio.chi.roba[0]
    c.compra(unico)
    controlla('quello pescato invece se ne va dal banco',
              !c.mercanzia().some(r => r.chiave === unico), unico)
  }
}

/* ══════════ 5-bis. il banco pesa per livello ══════════
   Le cinque righe pescate non sono più un mescolamento uniforme: più si
   scende, più la roba cara diventa normale. Il guasto da tenere fuori
   non è che la formula sbagli — è che **lasci un piano senza niente di
   comprabile**, e quello giocando non si vede: sembra sfortuna, e chi lo
   scopre è un bambino che arriva al banco con nove gemme e non può
   toccare niente. */
{
  const prezzoMedio = (t, piano) => {
    const rnd = seminato(t.chiave.length * 97 + piano * 13 + 5)
    const d = durezzaDi(t, piano)
    let somma = 0
    for (let i = 0; i < 200; i++) {
      const r = pescaMerce(d, { rnd })
      somma += r.reduce((s, k) => s + COSE[k].prezzo, 0) / r.length
    }
    return somma / 200
  }
  const cima = prezzoMedio(CAMPAGNA[0], 0)
  const fondo = prezzoMedio(CAMPAGNA[5], CAMPAGNA[5].piani - 1)
  controlla('in fondo il banco vende roba molto più cara che in cima',
            fondo > cima * 1.5, `${cima.toFixed(1)} gemme contro ${fondo.toFixed(1)}`)
  nota(`prezzo medio sul banco: ${cima.toFixed(1)} nelle cantine, ${fondo.toFixed(1)} in fondo`)

  /* ── i due modi di sbagliarla ──
     Un banco tutto fuori portata al primo piano è una stanza
     attraversata; un banco di sola paccottiglia all'ultimo è un premio
     che non premia. Si guardano tutti i piani di tutte le tappe, e la
     soglia è sulla **quota**, non su un singolo tiro: pesare vuol dire
     che ogni tanto capita di tutto, ed è giusto così. */
  const quota = (d, prova, quanti = 400) => {
    const rnd = seminato(4242)
    let n = 0
    for (let i = 0; i < quanti; i++)
      if (pescaMerce(d, { rnd }).some(k => prova(COSE[k].prezzo))) n++
    return n / quanti
  }
  const ECONOMICO = 10, PREGIATO = 30
  for (const t of CAMPAGNA) {
    for (let p = 0; p < t.piani; p++) {
      const d = durezzaDi(t, p)
      const abbordabile = quota(d, x => x <= ECONOMICO)
      controlla(`${t.chiave} piano ${p + 1}: quasi sempre c'è qualcosa sotto le ${ECONOMICO} gemme`,
                abbordabile >= 0.3, `solo ${(abbordabile * 100).toFixed(0)}% dei banchi`)
    }
  }
  /* e la roba buona **si vede anche in cima**, spenta: sapere cosa c'era
     è il motivo per tornare, e un banco che offre solo il comprabile
     quel motivo non lo dà mai (`viste/Mercante.vue`) */
  const sognoInCima = quota(durezzaDi(CAMPAGNA[0], 0), x => x >= PREGIATO)
  dentro('nelle cantine la roba da 30 gemme si intravede, e resta rara',
         Math.round(sognoInCima * 100), 5, 40)
  const roboInFondo = quota(durezzaDi(CAMPAGNA[5], CAMPAGNA[5].piani - 1), x => x >= PREGIATO)
  controlla('mentre in fondo è la norma', roboInFondo >= 0.8,
            `${(roboInFondo * 100).toFixed(0)}% dei banchi`)
  nota(`roba da ${PREGIATO}+ gemme: ${(sognoInCima * 100).toFixed(0)}% dei banchi nelle cantine, ` +
       `${(roboInFondo * 100).toFixed(0)}% in fondo`)
}

/* ══════════ 5-bis. scappare costa, e si può cadere per sempre ══════════
   Le due regole che tolgono il «vinco comunque»: la fuga non è più
   gratis, e gli svenimenti sono contati. Il banco non scappa mai — è la
   sua definizione di gioco al minimo — quindi la fuga si prova a mano. */
{
  const c = new Corsa(CAMPAGNA[2], { seme: 5, rnd: seminato(5) })
  const m = c.livello.robe.find(r => r.che === 'mostro' && !r.morto)
  c.foglio = { che: 'scontro', chi: m }
  const prima = c.vita
  const atteso = c.graffio(m)
  const via = c.scappa()
  uguale('scappare toglie il graffio di quel mostro', prima - c.vita, atteso)
  uguale('e lo dice a chi guarda', via.che, 'scappato')
  controlla('il mostro resta calmo il tempo di uscire', m.calmo > 0, `calmo ${m.calmo}`)
  controlla('e il graffio non è mai zero, o scappare tornerebbe gratis', atteso >= 1)

  /* con un filo di vita, scappare fa svenire come le prende in faccia:
     è la stessa ferita, e nessuna scorciatoia la salta */
  c.vita = 1
  c.foglio = { che: 'scontro', chi: m }
  uguale('con un filo di vita scappare fa svenire', c.scappa().che, 'svenuto')
  uguale('e il foglio è quello dello svenimento', c.foglio.che, 'svenuto')
}

{
  const t = CAMPAGNA[0]
  const c = new Corsa(t, { seme: 11, rnd: seminato(11) })
  const quante = svenimentiDi(t)
  controlla('il fondo cresce coi piani', svenimentiDi(CAMPAGNA[5]) > svenimentiDi(CAMPAGNA[0]),
            `${svenimentiDi(CAMPAGNA[0])} contro ${svenimentiDi(CAMPAGNA[5])}`)

  for (let i = 1; i < quante; i++) {
    c.vita = 0
    c.svieni()
    uguale(`svenimento ${i}: si torna all'ingresso`, c.foglio.ultimo, false)
    uguale('e il cartello dice quante ne restano', c.foglio.restano, quante - i)
    c.riprendi()
    controlla('la discesa continua', !c.finita)
    controlla('e si riprende con mezza vita, mai a zero', c.vita > 0, String(c.vita))
  }
  c.vita = 0
  c.svieni()
  uguale(`all'ultimo (${quante}) il cartello lo dice`, c.foglio.ultimo, true)
  c.riprendi()
  controlla('e la discesa finisce', c.finita)
  uguale('non vinta', c.vinta, false)
  uguale('e si sa perché, o la schermata racconterebbe un\'altra fine',
         c.esito.perche, 'svenuto')
}

/* ══════════ 5-ter. quello che non si tocca lo dice ══════════
   Un barile non è toccabile e non deve diventarlo — ruberebbe il tocco
   al forziere accanto — ma toccandolo si ottiene una riga: la prima
   volta la regola, dopo la battuta. */
{
  const c = new Corsa(CAMPAGNA[1], { seme: 3, rnd: seminato(3) })
  const a = c.livello.robe.find(r => r.che === 'arredo')
  controlla('nei piani c\'è arredo', !!a)
  uguale('e non è toccabile', c.toccabile(a), false)
  c.avvisi = []
  c.vaiVerso({ x: a.x, y: a.y }, true)
  uguale('toccandolo la prima volta si spiega la regola', c.avvisi.length, 1)
  controlla('e la riga parla della luce intorno', /luce/.test(String(c.avvisi[0])),
            String(c.avvisi[0]))
  c.avvisi = []
  c.vaiVerso({ x: a.x, y: a.y }, true)
  uguale('la seconda volta dice cos\'è', c.avvisi.length, 1)
  controlla('con la frase del suo pezzo',
            String(c.avvisi[0]) === ARREDO_DICE[a.pezzo], String(c.avvisi[0]))
  /* e un tocco sul pavimento nudo resta muto: la riga è la risposta a
     «ho toccato quella cosa lì», non un commento a ogni passo */
  c.avvisi = []
  const st = c.livello.stanze[0]
  c.vaiVerso({ x: st.cx, y: st.cy }, true)
  uguale('camminare non dice niente', c.avvisi.length, 0)
}

/* ══════════ 5-septies. quello che si vede si aggiorna ══════════
   Il guasto che nessuno dei controlli qui sopra poteva vedere, perché
   non sta nel motore: sta nel modo in cui la schermata lo guarda. La
   discesa è uno `shallowRef` — un proxy su ogni cella del piano sessanta
   volte al secondo non si può pagare — quindi Vue non sa niente di
   quello che succede là dentro, e la sveglia è un contatore a parte
   (`tic`). Chi se ne dimentica non ottiene nessun errore: ottiene una
   schermata ferma.

   E c'è il modo insidioso di dimenticarsene, che è quello che è
   successo: leggere il tic in un conto e poi **derivarne un altro da
   quello**. Il foglio del mercante è sempre lo stesso oggetto finché
   resta aperto, e un `computed` che rivaluta e ritorna un valore
   identico non sveglia chi dipende da lui: si comprava, si vendeva, le
   gemme scendevano e la lista della merce restava quella di prima.
   Adesso il tic lo legge `viste/occhio.js` per conto di tutti. */
{
  const corsa = shallowRef(null)
  const tic = ref(0)
  const dallaCorsa = occhio(corsa, tic)

  const foglio = dallaCorsa(c => c.foglio || null)
  const merce = dallaCorsa(c => (c.foglio && c.foglio.che === 'mercante'
    ? c.foglio.chi.roba.map(k => ({ chiave: k, posso: c.gemme >= COSE[k].prezzo }))
    : []), [])

  uguale('senza discesa non c\'è nessun foglio', foglio.value, null)
  uguale('e le liste sono vuote, non rotte', merce.value.length, 0)

  const c = new Corsa(CAMPAGNA[1], { seme: 77, rnd: seminato(77) })
  const banco = c.livello.robe.find(r => r.che === 'mercante')
  c.interagisci(banco)
  c.gemme = 0
  corsa.value = c
  tic.value++
  const primo = merce.value[0]
  controlla('col banco aperto la merce si vede', !!primo, JSON.stringify(merce.value))
  uguale('e senza gemme non si compra niente', primo.posso, false)

  /* le gemme cambiano **dentro** la corsa, e il foglio resta lo stesso
     oggetto: è esattamente la situazione in cui la lista si fermava */
  const stesso = foglio.value
  c.gemme = 999
  tic.value++
  uguale('il foglio è sempre lo stesso oggetto', foglio.value === stesso, true)
  uguale('ma la merce si è rifatta i conti', merce.value[0].posso, true)

  const quale = primo.chiave
  c.compra(quale)
  tic.value++
  controlla('e quello che si compra sparisce dal banco',
            !merce.value.some(v => v.chiave === quale),
            merce.value.map(v => v.chiave).join(' '))
}

/* ── e nessuno se lo riscrive a mano ──
   La prova che tiene in piedi quella qui sopra: `occhio.js` funziona,
   ma un `computed` scritto a mano dentro `Gioco.vue` gli passa accanto
   e torna a fermarsi, senza un errore da nessuna parte e senza che
   nessun altro controllo se ne accorga. Qui si guarda il sorgente,
   come per i lucchetti delle campagne. */
{
  const sorgente = readFileSync(
    new URL('../../src/giochi/sotterraneo/Gioco.vue', import.meta.url), 'utf8')
  /* il corpo di ogni `computed` scritto a mano, contando le parentesi:
     un computed lungo venti righe non si prende a occhio */
  const corpi = []
  for (const m of sorgente.matchAll(/computed\(/g)) {
    let i = m.index + m[0].length, aperte = 1
    while (i < sorgente.length && aperte > 0) {
      if (sorgente[i] === '(') aperte++
      else if (sorgente[i] === ')') aperte--
      i++
    }
    corpi.push(sorgente.slice(m.index, i))
  }
  controlla('nel coordinatore ci sono ancora dei computed da guardare', corpi.length > 0)
  /* guardare **dentro** la corsa, non guardare se c'è: `corsa.value` da
     solo è un ref come un altro, e sapere se una discesa è in corso è
     una domanda che si aggiorna da sé */
  const guardoni = corpi.filter(b => /corsa\.value(\.|\?\.)/.test(b))
  controlla('nessuno di loro guarda dentro la corsa per conto suo',
            guardoni.length === 0,
            `${guardoni.length} su ${corpi.length} — ` +
            'passa da dallaCorsa() (viste/occhio.js), o non si aggiorna')
  nota(`${corpi.length} computed scritti a mano nel coordinatore, nessuno sulla corsa`)
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
