/* ═══════════════════════════════════════════════════════════════════
   L'INGLESE A MONDI — il motore e i dati, senza browser.
   `node test/esegui.mjs inglese-mondi`

   Un test solo per tutto, anche per quello che nascerà: le frasi si
   leggono da src/giochi/inglese/dati/frasi/ e i capitoli dalla loro
   cartella, e a ognuno si chiede la stessa cosa — una sola risposta
   giusta per domanda, ogni ramo raggiungibile, nessuna trappola uguale
   alla giusta o a una variante, ogni parola nota nel suo mondo, ogni
   perché sotto i 70 caratteri (src/giochi/inglese/motore/guasti.js).
   E i difetti trovati giocando, resi impossibili in generale: una tappa
   di parole ha solo parole del suo argomento e le risposte sbagliate
   vengono da lì; una frase usa solo parole note e la struttura della sua
   tappa; nessuna trappola sgrammaticata per caso (a trousers, two dog);
   le frasi ripescate solo dove si ripassano le frasi.
   Il progetto è in docs/lingue/mondi.md.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { WORDS } from '../../src/data/words.js'
import { newItem, record, strength, MAX_S } from '../../src/store/srs.js'
import { MONDI, TAPPE, tappaDi, mondoDi, guastiDeiMondi, CATEGORIE_DI_STRUTTURA, inizioDellAnno }
  from '../../src/giochi/inglese/dati/mondi.js'
import { guastiDegliArgomenti, paroleDellArgomento } from '../../src/giochi/inglese/dati/argomenti.js'
import { TAPPE_DI_PRIMA } from '../../src/giochi/inglese/dati/travaso.js'
import { travasa, travasate, quanteVinte } from '../../src/giochi/inglese/motore/travaso.js'
import { sgrammaticata } from '../../src/giochi/inglese/motore/grammatica.js'
import { TAPPE_DEL_GIOCO } from '../../src/data/portata-giochi.js'
import { giocoDaOffrire } from '../../src/data/portata.js'
import manifesto from '../../src/giochi/inglese/gioco.js'
import { guastiDelleForme, FORME } from '../../src/giochi/inglese/dati/forme.js'
import { guastiDegliElenchi } from '../../src/giochi/inglese/dati/elenchi.js'
import { TRAPPOLE } from '../../src/giochi/inglese/dati/trappole.js'
import { FRASI, FILE_DELLE_FRASI, fraseDi } from '../../src/giochi/inglese/dati/frasi.js'
import { contrai, espandi, accetta, normalizza, inBella } from '../../src/giochi/inglese/motore/testo.js'
import { applica, OPERAZIONI } from '../../src/giochi/inglese/motore/trappole.js'
import { doveSta, cassettoDi, vociDi, paroleNote } from '../../src/giochi/inglese/motore/grafo.js'
import { traduci } from '../../src/giochi/inglese/motore/lessico.js'
import { formatoPerForza, tessereInPiu, costruisci, giudica, contesto } from '../../src/giochi/inglese/motore/formati.js'
import { grado, gradoTappa, ripresa } from '../../src/giochi/inglese/motore/grado.js'
import { Tocchi, TOCCHI_GRATIS, domandeCheLPagano, domandaDelTocco } from '../../src/giochi/inglese/motore/tocchi.js'
import { segnaVinta, tappaAperta, mondoAperto, cassettoAperto, statoMappa, mondoPassato }
  from '../../src/giochi/inglese/motore/mappa.js'
import { Sessione } from '../../src/giochi/inglese/motore/sessione.js'
import { racconta, mondiDi, NON_SI_SA } from '../../src/giochi/inglese/motore/libro.js'
import { guastiDelleFrasi, guastiDelCapitolo, guastiDelleParole, sorte, ordineGiusto }
  from '../../src/giochi/inglese/motore/guasti.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/giochi/inglese/dati')
const nessuno = (cosa, guasti) => controlla(cosa, guasti.length === 0, guasti.slice(0, 12).join(' · '))
const titolo = t => console.log('\n' + t)
const GIORNO = 86400000

/* ═══════════ 1. i dati stanno in piedi ═══════════ */
titolo('DATI')
nessuno('il grafo dei mondi', guastiDeiMondi())
nessuno('gli argomenti', guastiDegliArgomenti())
nessuno('le forme', guastiDelleForme())
nessuno('gli elenchi del libro', guastiDegliElenchi(new Set(WORDS.map(w => w[0]))))
{
  const file = readdirSync(resolve(CARTELLA, 'frasi')).filter(f => f.endsWith('.js'))
  const presi = []
  for (const f of file) presi.push((await import(pathToFileURL(resolve(CARTELLA, 'frasi', f)))).default)
  for (const [i, p] of presi.entries())
    controlla(`dati/frasi/${file[i]} è in dati/frasi.js`, FILE_DELLE_FRASI.includes(p))
  // nessuna parola resta fuori: sta in una tappa, in un cassetto o arriva con le forme
  const fuori = WORDS.filter(w => !doveSta(w[0])).map(w => w[0])
  nessuno('ogni parola di words.js ha un posto', fuori)
  const inCassetto = MONDI.filter(m => m.tappe.length).flatMap(m => cassettoDi(m.id).chiavi)
  controlla('i cassetti dei mondi pronti non sono vuoti', inCassetto.length > 20)
  controlla('i verbi hanno un cassetto', MONDI.some(m => m.verbi && cassettoDi(m.id).chiavi.some(k => k.startsWith('verbo:'))))
  nota(`${MONDI.length} mondi · ${TAPPE.length} tappe · ${FRASI.length} frasi · ${inCassetto.length} voci nei cassetti pronti`)
}

/* ═══════════ 2. forma lunga e contratta ═══════════ */
titolo('CONTRAZIONI')
uguale('it is → it’s', contrai('it is a dog'), 'it’s a dog')
uguale('il not prima del pronome', contrai('it is not a fish'), 'it isn’t a fish')
uguale('in fondo non si contrae', contrai('yes it is'), 'yes it is')
uguale('do not → don’t', contrai('I do not like milk'), 'I don’t like milk')
uguale('have got', contrai('I have not got a coat'), 'I haven’t got a coat')
uguale('he’s got è has', espandi('he’s got a hat').join(' '), 'he has got a hat')
uguale('he’s happy è is', espandi("he's happy").join(' '), 'he is happy')
uguale('can’t', normalizza('I can’t swim'), normalizza('I cannot swim'))
controlla('lunga e contratta valgono tutte e due', accetta('it’s a dog', { en: 'it is a dog' }) && accetta('It is a dog.', { en: 'it is a dog' }))
controlla('una variante vale', accetta('she has got blue eyes', fraseDi('e-blue-eyes')))
controlla('un’altra frase no', !accetta('it is a cat', { en: 'it is a dog' }))
uguale('la fila mette maiuscola e ?', inBella(['is', 'it', 'a', 'dog'], { domanda: true }), 'Is it a dog?')

/* ═══════════ 3. la tabella delle trappole ═══════════ */
titolo('TRAPPOLE')
{
  const ids = new Set()
  const domanda = en => /^(is|are|am|have|has|can|do|does|where|what|how)\b/i.test(en)
  for (const r of TRAPPOLE) {
    controlla(`trappola ${r.id}: id unico`, !ids.has(r.id)); ids.add(r.id)
    controlla(`trappola ${r.id}: operazione nota`, !!OPERAZIONI[r.fa])
    controlla(`trappola ${r.id}: forma nota`, r.forma === null || !!FORME[r.forma])
    const [giusta, sbagliata] = r.esempio
    const fuori = applica(r, { en: giusta, forma: null }, { domanda: domanda(giusta), vicine: () => ['cat', 'dog'] })
    const t = fuori.find(x => x.en === sbagliata)
    controlla(`trappola ${r.id}: dal suo esempio esce «${sbagliata}»`, !!t, fuori.map(x => x.en).join(' | '))
    if (t) controlla(`trappola ${r.id}: perché sotto i 70`, t.perche.length <= 70 && !/[{}]/.test(t.perche), t.perche)
  }
}

/* ═══════════ 4. ogni frase, in ogni formato ═══════════ */
titolo('FRASI')
nessuno('tutte le frasi componibili', guastiDelleFrasi())
{
  uguale('forza 0 → riconosci', formatoPerForza(0), 'riconosci')
  uguale('forza 2 → scegli', formatoPerForza(2), 'scegli')
  uguale('forza 3 → completa', formatoPerForza(3), 'completa')
  uguale('forza 6 → scegli e monta', formatoPerForza(6), 'scegliMonta')
  uguale('una tessera trappola a 5', tessereInPiu(5, 0), 1)
  uguale('due a 6', tessereInPiu(6, 3), 2)
  uguale('tre a 6 con la forma al massimo', tessereInPiu(6, MAX_S), 3)

  // cosa segna uno sbaglio: grammatica su frase e forma, parola vicina sulla parola
  const f = fraseDi('m-pen')
  const ctx = contesto(f, { tappa: tappaDi(f.tappa), altre: FRASI.filter(x => x.tappa === f.tappa), rnd: sorte(3) })
  const d = costruisci(f, 'scegli', ctx)
  const matita = d.opzioni.find(o => o.testo === 'This is a pencil')
  const grammatica = d.opzioni.find(o => !o.giusta && o.trappola && o.trappola.pesa === 'forma')
  if (matita) {
    const es = giudica(f, d, matita, { ctx })
    uguale('la parola vicina pesa sulla parola', JSON.stringify(es.registra), JSON.stringify([{ chiave: 'en:pen', correct: false }]))
    controlla('e dice il suo perché', es.perche === 'pen è la penna, pencil è la matita')
  } else controlla('la trappola a mano esce in «scegli»', false)
  if (grammatica) {
    const es = giudica(f, d, grammatica, { ctx })
    controlla('la grammatica pesa su frase e forma',
      es.registra.some(r => r.chiave === 'frase:m-pen' && !r.correct) && es.registra.some(r => r.chiave.startsWith('forma:') && !r.correct))
    controlla('e porta il «Si fa così»', !!es.siFa)
  }
  // una frase composta giusta ripassa solo le parole scadute
  const m = costruisci(f, 'monta', ctx)
  const es = giudica(f, m, ordineGiusto(m), { ctx, scadutaDi: k => k === 'en:pen' })
  controlla('giusta: frase, forma e le parole scadute',
    es.giusta && es.registra.some(r => r.chiave === 'en:pen' && r.correct) && !es.registra.some(r => r.chiave === 'en:box'))
  // una fila composta come una trappola dice il perché di quella trappola
  const sbagliata = ['is', 'this', 'a', 'pen'].map(w => m.tessere.find(t => t.testo === w).id)
  const es2 = giudica(f, m, sbagliata, { ctx })
  controlla('una fila che è una trappola ne dice il perché', !es2.giusta && es2.trappola === 'gira-affermazione', es2.perche)
}

/* ═══════════ 5. il libro ═══════════ */
titolo('CAPITOLI')
{
  const file = readdirSync(resolve(CARTELLA, 'capitoli')).filter(f => f.endsWith('.js'))
  const capitoli = []
  for (const f of file) capitoli.push((await import(pathToFileURL(resolve(CARTELLA, 'capitoli', f)))).default)
  const ids = new Set()
  for (const c of capitoli) {
    controlla(`capitolo ${c.id}: id unico`, !ids.has(c.id)); ids.add(c.id)
    nessuno(`capitolo ${c.id}`, guastiDelCapitolo(c))
    nota(`${c.id}: ${mondiDi(c).length} varianti`)
  }
  // il libro usa le strutture del mondo: chi ha solo le tappe di parole (quarta, quinta) non l'ha ancora
  for (const m of MONDI.filter(x => x.tappe.some(t => t.frasi)))
    controlla(`il mondo ${m.id} ha un capitolo`, capitoli.some(c => c.mondo === m.id))
  // «Non si sa» è la giusta quando il testo non lo dice
  const picnic = capitoli.find(c => c.id === 'il-picnic')
  if (picnic) {
    const senza = mondiDi(picnic).find(v => !v.cane)
    const con = mondiDi(picnic).find(v => v.cane)
    const d = v => racconta(picnic, v, sorte(1)).domande.find(x => x.testo === 'Laura ha un cane?')
    uguale('senza la frase del cane: non si sa', d(senza).giusta, NON_SI_SA)
    uguale('con la frase del cane: sì', d(con).giusta, 'Sì')
    uguale('le sbagliate sono le versioni non uscite', d(con).opzioni.some(o => o.testo === NON_SI_SA), true)
  }
}

/* ═══════════ 6. il grado, e da dove si riprende ═══════════ */
titolo('GRADO')
{
  const t1 = tappaDi('prima-animali')
  const voci = vociDi(t1)
  uguale('niente saputo: grado 0', gradoTappa(t1, () => 0), 0)
  uguale('tutto imparato: grado 10', gradoTappa(t1, () => 4), 10)
  uguale('metà forza: grado 5', grado(voci, () => 2), 5)
  // il grado cala da solo col tempo, come la forza
  const items = new Map(voci.map(k => [k, newItem()]))
  const t0 = Date.parse('2026-01-01')
  for (let i = 0; i < 4; i++) for (const it of items.values()) record(it, { correct: true, now: t0 + i * 4 * GIORNO })
  const forzaA = ora => k => { const it = items.get(k); return it ? strength(it, ora) : 0 }
  const oggi = gradoTappa(t1, forzaA(t0 + 13 * GIORNO))
  const fraUnAnno = gradoTappa(t1, forzaA(t0 + 400 * GIORNO))
  controlla('il grado cala col tempo', oggi === 10 && fraUnAnno < oggi, `${oggi} → ${fraUnAnno}`)
  // si riprende dalle più deboli, le parole prima delle frasi (alla 🏁, dove ci sono tutte e due)
  const b = tappaDi('prima-bandiera')
  const r = ripresa(b, k => (k === 'en:cow' ? 3 : 1))
  controlla('prima le più deboli, a pari forza le parole', r.voci[0].genere === 'parola' && r.voci[r.voci.length - 1].chiave === 'en:cow')
  controlla('ogni voce ha il formato della sua forza',
    r.voci.find(v => v.chiave === 'frase:m-dog').formato === 'senso')
  controlla('una tappa di parole non ha frasi', vociDi(t1).every(k => k.startsWith('en:')))
  controlla('una tappa di frasi non ha parole nuove',
    vociDi(tappaDi('prima-che-cose')).every(k => /^(frase|forma):/.test(k)))
}

/* ═══════════ 7. la mappa ═══════════ */
titolo('MAPPA')
{
  const c = { tappa: 0, libera: false, stelle: {}, cfg: {} }
  controlla('all’inizio si apre solo la prima tappa', tappaAperta(c, 'prima-colori') && !tappaAperta(c, 'prima-ciao'))
  controlla('il secondo mondo è chiuso', !mondoAperto(c, 'seconda'))
  controlla('il cassetto è chiuso', !cassettoAperto(c, 'prima'))
  uguale('la prima vittoria è la prima', segnaVinta(c, 'prima-colori', 1), true)
  uguale('la seconda no', segnaVinta(c, 'prima-colori', 2), false)
  controlla('vinta una tappa, si apre la dopo e il cassetto', tappaAperta(c, 'prima-ciao') && cassettoAperto(c, 'prima'))
  for (const t of MONDI[0].tappe) segnaVinta(c, t.id)
  controlla('finito il primo mondo, si apre il secondo', mondoAperto(c, 'seconda') && tappaAperta(c, 'seconda-cibo'))
  controlla('un mondo senza tappe resta chiuso', !mondoAperto(c, 'prova-finale'))
  uguale('tappa conta le vinte', c.tappa, MONDI[0].tappe.length)
  const stato = statoMappa(c, () => 0)
  controlla('la mappa ha tutti i mondi', stato.length === MONDI.length && stato[0].finito)
}

/* ═══════════ 8. la parola da toccare ═══════════ */
titolo('TOCCHI')
{
  const items = new Map()
  const itemDi = k => { if (!items.has(k)) items.set(k, newItem()); return items.get(k) }
  const ora = () => Date.parse('2026-05-01')
  for (let i = 0; i < TOCCHI_GRATIS; i++) {
    const t = new Tocchi({ itemDi, ora })
    controlla(`prima del tocco ${i + 1}: gratis, niente da chiedere`, !t.prova('dog').costa)
    const x = t.tocca('dog')
    controlla(`tocco ${i + 1} di una parola nuova: gratis`, x.gratis && t.paga && x.it === 'cane')
    uguale(`e conta come non saputa (${i + 1})`, JSON.stringify(t.correggi([{ chiave: 'en:dog', correct: true }])),
           JSON.stringify([{ chiave: 'en:dog', correct: false }]))
  }
  const t = new Tocchi({ itemDi, ora })
  // prima di un tocco che costa si chiede: provare non segna niente
  const p = t.prova('dogs')
  controlla('il quarto costerebbe, e provarlo non costa', p.costa && p.volte === TOCCHI_GRATIS && t.paga && t.nonSapute.length === 0)
  const q = domandaDelTocco(p)
  controlla('la domanda dice quante volte, e che non darà monete',
            /3 volte/.test(q.perche) && /non ti darà monete/.test(q.costo) && q.perche.length + q.chiede.length < 90)
  controlla('nel libro è una domanda sola', /Una domanda del libro/.test(domandaDelTocco(p, { libro: true }).costo))
  controlla('il quarto costa: la domanda non paga', !t.tocca('dogs').gratis && !t.paga)
  controlla('toccata una volta, ritoccarla non chiede più', !t.prova('dog').costa)
  const forte = itemDi('en:cat')
  for (let i = 0; i < 3; i++) record(forte, { correct: true, now: ora() })
  const t2 = new Tocchi({ itemDi, ora })
  controlla('una parola già nota si chiede subito', t2.prova('cat').costa && /la conosci già/.test(domandaDelTocco(t2.prova('cat')).perche))
  controlla('una parola già nota costa subito', !t2.tocca('cat').gratis)
  const t3 = new Tocchi({ itemDi, ora })
  controlla('le parole di struttura non si chiedono', !t3.prova('is').costa)
  controlla('le parole di struttura sono gratis e non contano', t3.tocca('is').gratis && t3.nonSapute.length === 0)
  controlla('la traduzione di una forma contratta', /non/.test(traduci('don’t').it))
  uguale('nel capitolo un tocco toglie una domanda sola', domandeCheLPagano(3, 1), 2)
  uguale('mai sotto zero', domandeCheLPagano(1, 4), 0)
}

/* ═══════════ 9. la sessione, giocata da un finto bambino ═══════════ */
titolo('SESSIONE')
{
  const items = new Map()
  const itemDi = k => { if (!items.has(k)) items.set(k, newItem()); return items.get(k) }
  let adesso = Date.parse('2026-06-01')
  const ora = () => adesso
  const formati = new Set()
  let partite = 0
  // cinque giorni di fila sulle parole, poi cinque sulle frasi che le usano, sempre giusto
  for (let giorno = 0; giorno < 10; giorno++) {
    const id = giorno < 5 ? 'prima-animali' : 'prima-che-cose'
    const s = new Sessione({ tappa: tappaDi(id), itemDi, ora, rnd: sorte(giorno + 1) })
    let turni = 0
    while (!s.finita && turni++ < 200) {
      const d = s.prossima()
      if (!d) break
      formati.add(d.formato)
      const risposta = d.opzioni ? d.opzioni.find(o => o.giusta) : ordineGiusto(d)
      const es = s.rispondi(d, risposta)
      if (!es.giusta) { controlla('il finto bambino risponde giusto', false, d.formato); break }
      for (const r of es.registra) record(itemDi(r.chiave), { correct: r.correct, now: adesso })
      adesso += 20000
    }
    controlla(`giorno ${giorno + 1}: la tappa finisce`, s.finita, `${s.giuste}/${s.bersaglio}`)
    partite++
    adesso += GIORNO
  }
  const g = gradoTappa(tappaDi('prima-animali'), k => strength(itemDi(k), adesso))
  controlla('dopo cinque giorni la tappa è salita', g >= 6, `grado ${g}`)
  const gf = gradoTappa(tappaDi('prima-che-cose'), k => strength(itemDi(k), adesso))
  controlla('e anche quella delle frasi', gf >= 5, `grado ${gf}`)
  controlla('i formati salgono con la forza', formati.has('riconosci') && (formati.has('completa') || formati.has('monta')),
            [...formati].join(', '))
  // una domanda con un tocco a pagamento non paga, anche giusta
  const s = new Sessione({ tappa: tappaDi('prima-animali'), itemDi, ora, rnd: sorte(9) })
  const d = s.prossima()
  const t = new Tocchi({ itemDi, ora })
  for (let i = 0; i < 5; i++) t.tocca('pig')
  itemDi('en:pig').tocchi = TOCCHI_GRATIS
  const t2 = new Tocchi({ itemDi, ora })
  t2.tocca('pig')
  const es = s.rispondi(d, d.opzioni ? d.opzioni.find(o => o.giusta) : ordineGiusto(d), { tocchi: t2 })
  controlla('giusta ma con un tocco a pagamento: non paga', es.giusta && !es.paga)
  // la 🏁 ripassa tutto il mondo
  const b = new Sessione({ tappa: tappaDi('prima-bandiera'), itemDi, ora, rnd: sorte(4) })
  controlla('la bandiera pesca da tutto il mondo', b.pool.some(k => k === 'frase:e-cat-1') && b.pool.some(k => k === 'en:dog'))
  // il cassetto gioca con le parole di oggi
  const cass = new Sessione({ tappa: cassettoDi('prima'), itemDi, ora, rnd: sorte(5) })
  const dc = cass.prossima()
  controlla('il cassetto fa domande sulle parole', dc && dc.genere === 'parola')
  // dalla quinta niente disegnini: né «che cos'è?» né «ascolta e scegli» con le figure
  const grande = new Sessione({ tappa: tappaDi('prima-animali'), itemDi: k => newItem(), ora, rnd: sorte(6), eta: 10 })
  const conFigure = []
  for (let i = 0; i < 30; i++) { const q = grande.prossima(); if (q && q.figure) conFigure.push(q.formato) }
  uguale('a dieci anni nessuna domanda con le figure', conFigure.join(), '')
  const piccolo = new Sessione({ tappa: tappaDi('prima-animali'), itemDi: k => newItem(), ora, rnd: sorte(6), eta: 7 })
  controlla('a sette sì', Array.from({ length: 10 }, () => piccolo.prossima()).some(q => q && q.figure))
  nota(`${partite} partite giocate, formati visti: ${[...formati].join(', ')}`)
}

/* ═══════════ 10. le parole note ═══════════ */
titolo('PAROLE NOTE')
{
  const note = paroleNote('seconda', 'seconda-cibo')
  controlla('al secondo mondo si sanno le parole del primo', note.has('dog') && note.has('red') && note.has('apple'))
  controlla('ma non quelle delle tappe dopo', !note.has('hat'))
  const allaFrase = paroleNote('terza', 'terza-c-e')
  controlla('a una tappa di frasi si sanno le parole delle tappe prima', allaFrase.has('kitchen') && allaFrase.has('thirty'))
  controlla('ma non quelle che vengono dopo', !allaFrase.has('swim'))
  controlla('e i mesi, in minuscolo come tutto', paroleNote('terza', 'terza-oggi').has('may'))
  controlla('le categorie di struttura non hanno cassetto', CATEGORIE_DI_STRUTTURA.includes('q'))
}

/* ═══════════ 11. i difetti trovati giocando ═══════════ */
titolo('DIFETTI')
{
  // le risposte sbagliate delle domande sulle parole: dall'argomento, mai da tutta la lingua (🔴 fra 🏥🐶📓)
  nessuno('le domande sulle parole restano nel loro argomento', guastiDelleParole())
  // e nella partita vera, per ogni parola di una tappa piccola
  const items = new Map()
  const itemDi = k => { if (!items.has(k)) items.set(k, newItem()); return items.get(k) }
  const colori = new Set(paroleDellArgomento('colori'))
  const s = new Sessione({ tappa: tappaDi('prima-colori'), itemDi, rnd: sorte(2) })
  // quello che si può vedere di un colore: la parola, l'italiano, l'emoji
  const ammessi = new Set(WORDS.filter(w => w[3] === 'c').flatMap(w => [w[0], w[1], w[2]]).filter(Boolean))
  const fuori = []
  for (let i = 0; i < 30; i++) {
    const d = s.prossima()
    if (!d) break
    for (const o of d.opzioni) if (!ammessi.has(o.testo)) fuori.push(o.testo)
    s.rispondi(d, d.opzioni.find(o => o.giusta))
  }
  uguale('«I colori» non mostra figure che non sono colori', fuori.join(' '), '')

  // una tappa di parole ha solo parole del suo argomento
  const miste = TAPPE.filter(t => t.argomento).flatMap(t => {
    const dentro = new Set(paroleDellArgomento(t.argomento))
    return t.parole.filter(p => !dentro.has(p)).map(p => `${t.id}: ${p}`)
  })
  uguale('una tappa di parole ha solo parole del suo argomento', miste.join(', '), '')
  controlla('«I colori» sono solo colori', tappaDi('prima-colori').parole.every(p => colori.has(p)))

  // le frasi ripescate dai mondi prima: solo dove si ripassano le frasi
  const vuoto = new Map()
  const nuovo = k => { if (!vuoto.has(k)) vuoto.set(k, newItem()); return vuoto.get(k) }
  const diParole = new Sessione({ tappa: tappaDi('seconda-corpo'), itemDi: nuovo, rnd: sorte(1) })
  uguale('una tappa di parole non ripesca frasi', diParole.pool.filter(k => k.startsWith('frase:')).join(), '')
  const diFrasi = new Sessione({ tappa: tappaDi('seconda-mi-piace'), itemDi: nuovo, rnd: sorte(1) })
  controlla('una tappa di frasi ripesca quelle dei mondi prima, se la forma è debole',
    diFrasi.pool.some(k => k.startsWith('frase:') && fraseDi(k.slice(6)).mondo === 'prima'))
  controlla('e comincia dalle parole che le sue frasi usano e che non sa ancora',
    diFrasi.primoGiro.length > 0 && diFrasi.primoGiro.every(k => /^(en|verbo):/.test(k)))

  // il controllo sulla grammatica del numero: i casi trovati giocando
  for (const storta of ['I have got a trousers', 'has she got a big hair', 'it is a elephant', 'they are two dog',
                        'I like a milk', 'it is an ball'])
    controlla(`«${storta}» è sgrammaticata`, !!sgrammaticata(storta))
  for (const dritta of ['I have got blue trousers', 'she has got long hair', 'it is an orange ball',
                        'they are two fish', 'I like milk', 'there is snow in January', 'they are a cat and a dog'])
    uguale(`«${dritta}» sta in piedi`, sgrammaticata(dritta), null)
}

/* ═══════════ 12. l'anno di scuola e l'età ═══════════ */
titolo('ETÀ')
{
  const anni = MONDI.filter(m => m.tappe.length).map(m => m.anno)
  uguale('un mondo per anno di scuola, nell’ordine', anni.join(','), '1,2,3,4,5')
  const fuoriAnno = TAPPE.filter(t => t.portata < inizioDellAnno(mondoDi(t.mondo).anno) ||
                                      t.portata >= inizioDellAnno(mondoDi(t.mondo).anno + 1))
  uguale('ogni tappa ha la portata del suo anno', fuoriAnno.map(t => t.id).join(), '')
  // le frasi sono capitoli fra le parole, non un blocco in fondo al mondo
  const inFila = m => Math.max(...m.tappe.filter(t => !t.bandiera).map(t => (t.frasi ? '|' : 'p')).join('')
    .split('|').map(x => x.length))
  const conFrasi = MONDI.filter(m => m.tappe.some(t => t.frasi))
  uguale('mai più di quattro tappe di parole di fila, dove ci sono le frasi',
         conFrasi.filter(m => inFila(m) > 4).map(m => m.id).join(), '')
  uguale('e le frasi cominciano entro la terza tappa',
         conFrasi.filter(m => m.tappe.findIndex(t => t.frasi) > 2).map(m => m.id).join(), '')
  controlla('la carta guarda i mondi, non la campagna di prima', TAPPE_DEL_GIOCO.inglese === TAPPE)
  controlla('a sei anni e mezzo l’inglese si offre (la prima elementare)', giocoDaOffrire(TAPPE, { eta: 6.5 }))
  controlla('a sei anni nessun mondo è passato', MONDI.every(m => !mondoPassato(m.id, 6)))
  controlla('a otto anni la prima è passata, la seconda no', mondoPassato('prima', 8) && !mondoPassato('seconda', 8))
  controlla('a dieci anni anche seconda e terza', mondoPassato('seconda', 10) && mondoPassato('terza', 10) &&
                                                   !mondoPassato('quarta', 10))
  const c = { tappa: 0, stelle: {}, cfg: {} }
  const r8 = { eta: 8 }
  controlla('un mondo passato è aperto tutto, da ripassare', mondoPassato('prima', 8) &&
    tappaAperta(c, 'prima-bandiera', r8) && cassettoAperto(c, 'prima', r8))
  controlla('ma non è vinto', !statoMappa(c, () => 0, r8)[0].finito)
  controlla('e apre il mondo dopo come se fosse finito', mondoAperto(c, 'seconda', r8) &&
    tappaAperta(c, 'seconda-cibo', r8) && !tappaAperta(c, 'seconda-pranzo', r8))
  controlla('senza età non passa niente', !mondoAperto(c, 'seconda', { eta: null }))
  uguale('la mappa lo dice', statoMappa(c, () => 0, r8).filter(m => m.passato).map(m => m.id).join(), 'prima')
}

/* ═══════════ 13. chi aveva vinto le tappe di prima ═══════════ */
titolo('TRAVASO')
{
  const tutte = Object.fromEntries(Object.keys(TAPPE_DI_PRIMA).map((id, i) => [id, 1000 + i]))
  const dopo = travasate(tutte)
  const nate = Object.keys(dopo).filter(id => !TAPPE_DI_PRIMA[id]).sort()
  nota('nascono vinte:', nate.join(' '))
  for (const id of ['prima-animali', 'prima-numeri', 'prima-scuola', 'prima-che-cose', 'prima-colore',
                    'prima-quanti', 'prima-questo', 'seconda-corpo', 'seconda-famiglia', 'seconda-cibo',
                    'seconda-pranzo', 'seconda-vestiti', 'seconda-mi-piace', 'seconda-mio', 'seconda-ho',
                    'seconda-ha'])
    controlla(`${id}: tutto quello che insegna era vinto, nasce vinta`, !!dopo[id])
  for (const id of ['prima-colori', 'prima-giocattoli', 'prima-ciao', 'prima-bandiera', 'seconda-venti',
                    'seconda-come', 'seconda-bandiera', 'terza-casa'])
    controlla(`${id}: dentro c'è qualcosa di nuovo, resta da fare`, !dopo[id])
  // la regola, detta per ogni tappa: nasce vinta se e solo se quello che insegna c'era
  const parole = new Set(Object.values(TAPPE_DI_PRIMA).flatMap(t => t.parole))
  const forme = new Set(Object.values(TAPPE_DI_PRIMA).flatMap(t => t.forme))
  const storte = TAPPE.filter(t => !t.bandiera).filter(t =>
    !!dopo[t.id] !== (t.frasi ? t.forme.every(f => forme.has(f)) : t.parole.every(p => parole.has(p))))
  uguale('la regola vale per ogni tappa', storte.map(t => t.id).join(), '')
  controlla('le vinte di prima restano', Object.keys(TAPPE_DI_PRIMA).every(id => dopo[id]))
  controlla('col giorno della prima vittoria', dopo['prima-animali'] === 1000)
  // una sola tappa vinta: nasce solo quello che insegnava tutto intero
  const poco = travasate({ 'che-cose-1': 5 })
  uguale('con «gli animali facili» e basta non nasce niente', Object.keys(poco).join(), 'che-cose-1')
  const due = travasate({ 'che-cose-1': 5, 'che-cose-2': 6 })
  controlla('con tutte e due le tappe degli animali nascono gli animali e «Che cos’è?»',
    due['prima-animali'] && due['prima-che-cose'] && !due['prima-colori'])
  // sul profilo: si conta solo quello che c'è, e una seconda volta non cambia niente
  const c = { tappa: 12, vinte: { ...tutte } }
  controlla('il travaso cambia il profilo', travasa(c))
  uguale('e conta solo le tappe che ci sono', c.tappa, nate.length)
  controlla('rifatto non cambia più niente', !travasa(c))
  uguale('chi non aveva niente resta com’era', JSON.stringify(travasate({ 'prima-colori': 3 })), '{"prima-colori":3}')
  controlla('il riassunto della home conta già le tappe travasate',
    new RegExp(`^${nate.length} tappe su`).test(manifesto.riassunto({ vinte: tutte })), manifesto.riassunto({ vinte: tutte }))
  uguale('quanteVinte ignora le chiavi di prima', quanteVinte({ 'che-cose-1': 1, 'prima-colori': 2 }), 1)
}

riassunto('inglese a mondi')
