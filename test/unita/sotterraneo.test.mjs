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
    /* ogni stanza sbarrata deve avere **tutti** i suoi varchi chiusi */
    for (const g of new Set(porte.map(r => r.gruppo))) {
      const stanza = l.stanze[g]
      const chiuse = porte.filter(r => r.gruppo === g).length
      sbarrate++
      if (chiuse < stanza.porte.length) storte++
    }
    if (l.serveUnaPorta) tagliati++
  }
  controlla('ogni stanza sbarrata ha tutti i varchi chiusi', storte === 0,
            `${storte} su ${sbarrate}`)
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
