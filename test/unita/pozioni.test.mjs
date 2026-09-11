/* Il laboratorio delle pozioni, senza browser. Le tre cose che contano:
   i dati stanno in piedi (ogni dose di ogni tappa si compone con gli
   attrezzi di quella tappa), il conto degli scalini è giusto in tutti e
   due i versi, e le ventinove tappe si vincono **giocandole davvero**
   col finto giocatore. E la scaletta è quella promessa: nove gradini
   per famiglia, nello stesso ordine, e il conto svolto arriva sempre
   prima della sua versione senza aiuti.
   `node test/esegui.mjs pozioni` */
import { FAMIGLIE, STRUMENTO, INGREDIENTI, VALE, inUnita, scrivi, guastiDelleMisure }
  from '../../src/giochi/pozioni/dati/misure.js'
import { CAMPAGNA, BLOCCHI, ID_GRADINI, GRADINI_PER_FAMIGLIA, guastiDellaCampagna, dosiDellaTappa }
  from '../../src/giochi/pozioni/dati/campagna.js'
import { scalini, componibile, scomponi, verdetto, spiegazione, regola, perche, chiaveDi }
  from '../../src/giochi/pozioni/motore/misura.js'
import { generaRicetta } from '../../src/giochi/pozioni/motore/ricetta.js'
import { Partita } from '../../src/giochi/pozioni/motore/partita.js'
import { gioca, caso, dosaBene, sbadato } from '../../src/giochi/pozioni/motore/banco.js'
import manifesto, { CONVERSIONI } from '../../src/giochi/pozioni/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { statoDellaTappa, PASSATA, AVANTI, IN_PORTATA } from '../../src/data/portata.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati stanno in piedi ══════════ */
const gm = guastiDelleMisure()
controlla('le misure non hanno guasti', gm.length === 0, gm.join(' · '))
const gc = guastiDellaCampagna(componibile, CAMPAGNA, STRUMENTO)
controlla('la campagna non ha guasti', gc.length === 0, gc.join(' · '))
const ga = guastiDellAlbo([manifesto])
controlla('il manifesto non ha guasti', ga.length === 0, ga.join(' · '))
uguale('il manifesto tiene la chiave di sempre', manifesto.chiave, 'pozioni')
controlla('e dichiara che senza conversioni non si gioca',
          manifesto.serve.includes('conversioni') && manifesto.serve.includes('misure'))

uguale('tre famiglie', FAMIGLIE.length, 3)
uguale('nove attrezzi in tutto', Object.keys(STRUMENTO).length, 9)
uguale('la bilancia da cucina arriva a 5 kg', STRUMENTO.cucina.limite, 5000)
uguale('e conta in grammi', STRUMENTO.cucina.unita, 'g')
uguale('quella del mercato conta in etti', STRUMENTO.mercato.unita, 'hg')
uguale('e arriva a 20 kg', STRUMENTO.mercato.limite, 20000)
uguale('il metro a nastro conta in centimetri', STRUMENTO.nastro.unita, 'cm')
uguale('e i suoi pezzi partono da 5 cm', STRUMENTO.nastro.pezzi[0], 50)
controlla('nessun ingrediente è un recipiente',
          !INGREDIENTI.some(i => ['🧪', '🍯', '🫙', '🥛', '🪣', '🧉', '🥃'].includes(i.emoji)))

/* ══════════ 2. la scaletta è quella promessa ══════════ */
uguale('nove gradini per famiglia più due tappe finali',
       CAMPAGNA.length, FAMIGLIE.length * GRADINI_PER_FAMIGLIA + 2)
for (const f of FAMIGLIE) {
  const sue = CAMPAGNA.filter(t => t.famiglie.length === 1 && t.famiglie[0] === f.chiave)
  stessaLista(`${f.chiave}: i gradini in fila`, sue.map(t => t.gradino), ID_GRADINI)
  /* la prima non converte: la dose è già nell'unità dell'attrezzo */
  controlla(`${f.chiave}: il banco non chiede conversioni`,
            sue[0].dosi.every(d => d.unita === f.unita.P) && sue[0].aiuto === 'gioco')
  /* la seconda parla nella grande, e il conto è svolto */
  controlla(`${f.chiave}: al secondo gradino arriva l'unità grande, col conto svolto`,
            sue[1].dosi.every(d => d.unita === f.unita.G) && sue[1].aiuto === 'svolto')
  controlla(`${f.chiave}: interi prima delle virgole`,
            sue[2].dosi.every(d => Number.isInteger(inUnita(d.base, d.unita))) &&
            sue[3].dosi.every(d => !Number.isInteger(inUnita(d.base, d.unita))))
  /* il gradino della bilancia di mezzo: le dosi NON ci stanno sull'attrezzo piccolo */
  controlla(`${f.chiave}: al sesto gradino l'attrezzo piccolo non ci arriva`,
            sue[5].dosi.every(d => !componibile(d.base, f.strumenti.P)) &&
            sue[5].dosi.every(d => componibile(d.base, f.strumenti.M)))
  /* l'ottavo: scritte nella piccola, ci stanno solo sull'attrezzo di mezzo */
  controlla(`${f.chiave}: all'ottavo gradino si sale al contrario`,
            sue[7].dosi.every(d => d.unita === f.unita.P && !componibile(d.base, f.strumenti.P)
                                && componibile(d.base, f.strumenti.M)))
  /* il conto svolto viene sempre prima della versione senza aiuti */
  const ordine = sue.map(t => t.aiuto)
  controlla(`${f.chiave}: ogni «senza aiuti» ha uno «svolto» prima`,
            ordine.every((a, i) => a !== '' || ordine.slice(0, i).includes('svolto')))
  /* non più di un attrezzo nuovo per tappa */
  controlla(`${f.chiave}: mai due attrezzi nuovi nella stessa tappa`,
            sue.every((t, i) => i === 0 || t.strumenti.length - sue[i - 1].strumenti.length <= 1))
}
const ultima = CAMPAGNA[CAMPAGNA.length - 1]
uguale('tre attrezzi per famiglia solo nell\'ultima tappa', ultima.strumenti.length, 9)
controlla('e nelle altre mai più di due', CAMPAGNA.slice(0, -1).every(t => t.taglie.length <= 2))
controlla('la portata sale lungo la fila',
          CAMPAGNA.every((t, i) => !i || t.portata >= CAMPAGNA[i - 1].portata))
uguale('la mappa ha un blocco per famiglia più il calderone', BLOCCHI.length, 4)
uguale('e i blocchi coprono tutte le tappe',
       BLOCCHI.reduce((n, b) => n + b.tappe.length, 0), CAMPAGNA.length)
controlla('a cinque anni il laboratorio è avanti',
          statoDellaTappa(CAMPAGNA[0], { eta: 5 }) === AVANTI)
controlla('a otto anni il banco dei grammi è alla portata',
          statoDellaTappa(CAMPAGNA[0], { eta: 8 }) === IN_PORTATA)
controlla('a undici anni il banco dei grammi è già passato',
          statoDellaTappa(CAMPAGNA[0], { eta: 11 }) === PASSATA)
controlla('ma se le conversioni sono spente torna alla portata',
          statoDellaTappa(CAMPAGNA[1], { eta: 11, spenti: ['conversioni'] }) !== PASSATA)

/* ══════════ 3. il conto degli scalini ══════════ */
uguale('da kg a g sono tre scalini in giù', scalini('kg', 'g'), 3)
uguale('da g a hg sono due in su', scalini('g', 'hg'), -2)
uguale('da m a cm sono due in giù', scalini('m', 'cm'), 2)
uguale('fra unità di famiglie diverse non c\'è scala', scalini('kg', 'cm'), null)
uguale('la regola è scritta dalla grande alla piccola anche al contrario',
       regola('g', 'hg'), '1 hg = 100 g')
uguale('un chilo e mezzo si scrive con la virgola', scrivi(1500, 'kg'), '1,5 kg')
uguale('e in grammi senza', scrivi(1500, 'g'), '1500 g')
uguale('la chiave del motore tiene il verso', chiaveDi('g', 'hg'), 'pozioni:g-hg')
uguale('con la stessa unità non c\'è chiave', chiaveDi('g', 'g'), null)

{
  const s = spiegazione({ unita: 'kg', base: 1500, testo: '1,5 kg' }, 'g')
  uguale('svolto: i passi', s.passi, 'Da kg a g sono 3 scalini in giù')
  uguale('svolto: con la virgola si sposta la virgola', s.come, 'la virgola va a destra di 3 posti')
  stessaLista('svolto: la catena', s.catena, ['1,5', '15', '150', '1500 g'])
  uguale('svolto: il risultato', s.risultato, '1500 g')
}
{
  const s = spiegazione({ unita: 'kg', base: 2000, testo: '2 kg' }, 'g')
  uguale('con un intero si aggiungono gli zeri', s.come, 'aggiungi 3 zeri')
}
{
  const s = spiegazione({ unita: 'g', base: 6000, testo: '6000 g' }, 'hg')
  uguale('al contrario si sale', s.passi, 'Da g a hg sono 2 scalini in su')
  uguale('e gli zeri si tolgono', s.come, 'togli 2 zeri')
  stessaLista('la catena sale uno scalino per volta', s.catena, ['6000', '600', '60 hg'])
}
{
  const s = spiegazione({ unita: 'g', base: 250, testo: '250 g' }, 'hg')
  uguale('se gli zeri non ci sono tutti si sposta la virgola', s.come, 'la virgola va a sinistra di 2 posti')
  uguale('e il risultato ha la virgola', s.risultato, '2,5 hg')
}
{
  const s = spiegazione({ unita: 'cm', base: 300, testo: '30 cm' }, 'cm')
  controlla('stessa unità: niente da convertire', s.uguale === true)
  const r = spiegazione({ unita: 'kg', base: 3000, testo: '3 kg' }, 'g', 'regola')
  uguale('a livello «regola» c\'è solo l\'uguaglianza', r.regola, '1 kg = 1000 g')
  controlla('e niente catena', !r.catena)
  uguale('senza livello, niente', spiegazione({ unita: 'kg', base: 3000 }, 'g', ''), null)
}

/* ══════════ 4. comporre e giudicare ══════════ */
controlla('1500 g ci stanno sulla bilancia da cucina', componibile(1500, STRUMENTO.cucina))
controlla('8 kg no', !componibile(8000, STRUMENTO.cucina))
controlla('ma sulla bilancia del mercato sì', componibile(8000, STRUMENTO.mercato))
controlla('250 g sul mercato no: i pesi sono da un etto', !componibile(250, STRUMENTO.mercato))
stessaLista('1500 g coi meno pesi possibili', scomponi(1500, STRUMENTO.cucina.pezzi), [1000, 500])
stessaLista('80 hg in tre pesi', scomponi(8000, STRUMENTO.mercato.pezzi), [5000, 2000, 1000])
uguale('quello che non si compone torna null', scomponi(30, STRUMENTO.cucina.pezzi), null)
const kg = { unita: 'kg', base: 1000, testo: '1 kg', famiglia: 'massa' }
uguale('un chilo sulla caraffa è la famiglia sbagliata', verdetto(kg, STRUMENTO.caraffa, 0), 'famiglia')
uguale('mille grammi sono giusti', verdetto(kg, STRUMENTO.cucina, 1000), 'giusto')
uguale('dieci etti pure', verdetto(kg, STRUMENTO.mercato, 1000), 'giusto')
uguale('millecento sono troppi', verdetto(kg, STRUMENTO.cucina, 1100), 'troppo')
uguale('novecento pochi', verdetto(kg, STRUMENTO.cucina, 900), 'poco')
controlla('la famiglia sbagliata si spiega col gesto',
          perche(kg, STRUMENTO.caraffa, 'famiglia').includes('si pesa, non si versa'),
          perche(kg, STRUMENTO.caraffa, 'famiglia'))
controlla('un attrezzo troppo piccolo dice fin dove arriva',
          perche({ ...kg, base: 8000, testo: '8 kg' }, STRUMENTO.cucina, 'nonCiSta').includes('5 kg'))

/* ══════════ 5. la ricetta ══════════ */
{
  const rnd = caso(5)
  for (const t of CAMPAGNA) {
    let storte = 0
    for (let i = 0; i < 40; i++) {
      const r = generaRicetta(t, rnd)
      if (r.ingredienti.length !== t.ingredienti) storte++
      if (r.scaffale.length !== t.scelta) storte++
      if (new Set(r.scaffale.map(s => s.nome)).size !== r.scaffale.length) storte++
      if (!r.ingredienti.every(i => i.famiglia === i.dose.famiglia)) storte++
      if (!r.ingredienti.every(i => t.strumenti.some(k => STRUMENTO[k].famiglia === i.famiglia &&
                                                           componibile(i.dose.base, STRUMENTO[k])))) storte++
      const dosi = r.ingredienti.map(i => i.dose.testo)
      if (new Set(dosi).size !== dosi.length) storte++
    }
    if (storte) controlla(`tappa ${t.chiave}: la ricetta è in forma`, false, `${storte} storte`)
  }
  controlla('le ricette di tutte le tappe sono in forma', true)
}

/* ══════════ 6. una partita si comporta ══════════ */
{
  const t = CAMPAGNA[1]                       // «arriva il chilo»: 1..3 kg sulla bilancia dei grammi
  const p = new Partita(t, { rnd: caso(3) })
  uguale('si comincia davanti allo scaffale', p.fase, 'scaffale')
  const ing = p.ricetta.ingredienti[0]
  const altro = p.ricetta.scaffale.find(s => s.nome !== ing.nome)
  const e1 = p.prendi(altro.nome)
  uguale('un distrattore è uno sbaglio detto', e1.tipo, 'sbaglio')
  uguale('e dice che non è nella ricetta', e1.codice, 'ingrediente')
  controlla('finché c\'è un esito non si fa altro', p.prendi(ing.nome) === null)
  p.riprendi()
  controlla('preso l\'ingrediente giusto', p.prendi(ing.nome).ok === true)
  uguale('adesso è in mano', p.fase, 'inMano')
  controlla('il cartello svolto dice il risultato', p.aiuto.livello === 'svolto' && !!p.aiuto.risultato)
  controlla('posato sulla bilancia da cucina', p.posa('cucina').ok === true)
  uguale('si dosa', p.fase, 'dosa')
  controlla('un pezzo che non esiste non entra', p.metti(7) === false)
  p.metti(1000)
  const e2 = p.conferma()
  uguale(`${ing.dose.testo}: con mille grammi ${ing.dose.base === 1000 ? 'è giusto' : 'non basta'}`,
         e2.tipo, ing.dose.base === 1000 ? 'giusto' : 'sbaglio')
  if (e2.tipo === 'sbaglio') {
    controlla('lo sbaglio porta il conto svolto', !!e2.spiegazione && !!e2.spiegazione.risultato)
    controlla('a conto svolto niente va al motore di apprendimento', e2.annota === null)
    p.riprendi()
    uguale('dopo una dose sbagliata l\'attrezzo si svuota e resta', p.messi.length + (p.strumento ? 0 : 1), 0)
    for (const pz of scomponi(ing.dose.base, STRUMENTO.cucina.pezzi)) p.metti(pz)
    uguale('poi si fa giusta', p.conferma().tipo, 'giusto')
  }
  const r = p.riprendi()
  controlla('finito l\'ingrediente si passa avanti', ['nuovoCliente', 'prossimoIngrediente'].includes(r.che))
  uguale('la pozione è contata', p.pozioni, t.ingredienti === 1 ? 1 : 0)
}
{
  /* nella tappa senza aiuti la conversione va al motore di apprendimento */
  const t = CAMPAGNA.find(x => x.chiave === 'massa-virgole')
  const p = new Partita(t, { rnd: caso(9) })
  const ing = p.ricetta.ingredienti[0]
  p.prendi(ing.nome); p.posa('cucina')
  p.metti(50)
  const e = p.conferma()
  uguale('poco', e.codice, 'poco')
  uguale('al primo sbaglio si annota la coppia kg-g come sbagliata',
         JSON.stringify(e.annota), JSON.stringify({ chiave: 'pozioni:kg-g', giusto: false }))
  p.riprendi()
  p.metti(50)
  const e2 = p.conferma()
  controlla('al secondo sbaglio non si annota più', e2.tipo === 'sbaglio' && e2.annota === null)
  p.riprendi()
  for (const pz of scomponi(ing.dose.base, STRUMENTO.cucina.pezzi)) p.metti(pz)
  const e3 = p.conferma()
  controlla('la dose giusta dopo gli sbagli non si annota come saputa', e3.tipo === 'giusto' && e3.annota === null)
  uguale('e non paga', p.monete, 0)
  uguale('gli sbagli della tappa sono due', p.sbagli, 2)
}
{
  /* le stelle: tre senza sbagli, e la tappa non si perde mai */
  const t = CAMPAGNA[0]
  const p = gioca(t, { seme: 4 })
  uguale('una tappa giocata bene vale tre stelle', p.stelle, 3)
  uguale('e paga tre monete a dose', p.monete, dosiDellaTappa(t) * 3)
  uguale('le pozioni sono i clienti', p.pozioni, t.clienti)
  uguale('tutte perfette', p.perfette, t.clienti)
}
{
  /* uno sbadato: ogni sbaglio ha le sue parole, e la tappa finisce lo stesso */
  const t = CAMPAGNA.find(x => x.chiave === 'massa-inverse')
  const p = new Partita(t, { rnd: caso(21) })
  const esiti = sbadato(p)
  controlla('lo sbadato colleziona sbagli diversi',
            new Set(esiti.filter(Boolean).map(e => e.codice)).size >= 2,
            esiti.map(e => e && e.codice).join(','))
  controlla('e ogni sbaglio ha un testo', esiti.every(e => e && e.testo))
  while (!p.finita) dosaBene(p)
  controlla('la tappa finisce comunque', p.finita)
  dentro('con meno stelle', p.stelle, 1, 2)
}

{
  /* la tappa della bilancia del mercato: il consiglio compare prima di
     prendere l'ingrediente, e deve portarsi la dose — a schermo si
     leggeva dall'ingrediente in mano, che lì è ancora null, e la tappa
     crashava all'apertura */
  const t = CAMPAGNA.find(x => x.chiave === 'massa-media')
  const p = new Partita(t, { rnd: caso(2) })
  uguale('davanti allo scaffale non c\'è niente in mano', p.ingrediente, null)
  controlla('ma il cartello c\'è, consiglia l\'attrezzo e porta la dose',
            !!p.aiuto && p.aiuto.consiglia === true && !!p.aiuto.dose && !!p.aiuto.dose.testo,
            JSON.stringify(p.aiuto))
  uguale('e consiglia la bilancia del mercato', p.aiuto.strumento.chiave, 'mercato')
}

/* ══════════ 7. tutte le tappe si vincono davvero ══════════ */
let dosiInTutto = 0
for (const [i, t] of CAMPAGNA.entries()) {
  for (const seme of [1, 2, 3]) {
    try {
      const p = gioca(t, { seme })
      dosiInTutto += p.dosiGiuste
      if (p.stelle !== 3 || p.monete !== dosiDellaTappa(t) * 3)
        controlla(`tappa ${i + 1} (${t.chiave}) seme ${seme}: giocata bene vale tutto`, false,
                  `${p.stelle} stelle, ${p.monete} monete`)
    } catch (e) {
      controlla(`tappa ${i + 1} (${t.chiave}) seme ${seme}: si vince giocandola`, false, e.message)
    }
  }
}
controlla('tutte le tappe si vincono col finto giocatore', true)
nota(`${CAMPAGNA.length} tappe, ${dosiInTutto / 3} dosi giocate in tutto`)

/* ══════════ 8. il manifesto ══════════ */
controlla('le conversioni che il gioco può chiedere sono diciotto', CONVERSIONI.length === 18)
controlla('il traguardo delle tappe arriva fino in fondo',
          manifesto.albo.traguardi.find(t => t.id === 'poz-tappe').soglie.at(-1) === CAMPAGNA.length)
nota('portata', `${CAMPAGNA[0].portata} → ${CAMPAGNA.at(-1).portata}`)

riassunto('il laboratorio delle pozioni')
