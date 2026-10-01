/* ═══════════════════════════════════════════════════════════════════
   IL LIBRO DELLO SPAGNOLO A MONDI — le storie, senza browser.
   `node test/esegui.mjs spagnolo-libro --niente-build`

   Il gemello di unita/inglese-libro. Tre storie per mondo che crescono coi
   mondi, almeno una a metà isola; le pagine; quale storia apre il libro e
   quale «Un'altra storia»; le storie lette nel profilo; le forme dei verbi
   (juega, jugando, jugué) accettate solo dove una struttura del mondo le
   ammette; la paga di una domanda; chi parla, a battute; le parole della
   storia (le nuove e i cassetti); le domande «chi», «frase» e «ordine»; le
   storie a puntate, che tengono le variabili. Che ogni capitolo stia in piedi
   lo controlla unita/spagnolo-mondi.
   I capitoli li scrivono altri e cambiano: quello che dipende da un capitolo
   preciso (quale storia apre il libro, le puntate, le domande nuove) si prova
   su capitoli scritti qui, nei mondi veri; quello che vale per ogni capitolo
   (quante storie, quante pagine, chi parla) si legge dalla cartella e passa a
   vuoto finché la cartella è vuota. Il progetto è in docs/lingue/libro.md e
   spagnolo-motore.md.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDI, mondoDi, tappaDi } from '../../src/giochi/spagnolo/dati/mondi.js'
import { CHI_PARLA, CHI_DI_CASA } from '../../src/giochi/spagnolo/dati/elenchi.js'
import { pagaDelCapitolo, PAGA_CAPITOLO } from '../../src/giochi/spagnolo/dati/monete.js'
import { flessione, flessa } from '../../src/giochi/spagnolo/motore/flessioni.js'
import { sconosciute, paroleDelLibro, formeDelLibro, flessioniDi, paroleNote, cassettoDi }
  from '../../src/giochi/spagnolo/motore/grafo.js'
import { traduci, chiaveDi, nomeDi, plurale } from '../../src/giochi/spagnolo/motore/lessico.js'
import { PAROLE_ES } from '../../src/data/parole-es.js'
import { racconta, mondiDi, pagineDi, tappaDellaStoria, blocchiDi, eGiusta, paroleDellaStoriaIn,
         paroleDeiCassetti, tiraConFissi, chiaveDelValore, PAROLE_DELLA_STORIA_MAX }
  from '../../src/giochi/spagnolo/motore/libro.js'
import { guastiDelCapitolo, guastiDelleSerie, sorte } from '../../src/giochi/spagnolo/motore/guasti.js'
import { segnaVinta, cosaServe, statoMappa } from '../../src/giochi/spagnolo/motore/mappa.js'
import { storieAperte, storiaAperta, prossimaStoria, unAltraStoria, segnaLetta, lette, inOrdine, cosaServeAlLibro,
         tiraLaStoria, segnaPuntata, puntataDopo, serieDi }
  from '../../src/giochi/spagnolo/motore/storie.js'
import * as F from '../../src/giochi/spagnolo/motore/fila.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/giochi/spagnolo/dati/capitoli')
const titolo = t => console.log('\n' + t)
const CAPITOLI = []
for (const f of readdirSync(CARTELLA).filter(x => x.endsWith('.js')))
  CAPITOLI.push((await import(pathToFileURL(resolve(CARTELLA, f)))).default)
// Una storia tirata e raccontata; se il capitolo non si racconta (una variabile che non c'è) è un guasto, non un crash
const raccontata = (c, v = mondiDi(c)[0], seme = 1) => {
  try { return racconta(c, v, sorte(seme)) } catch (e) { controlla(`${c.id}: si racconta`, false, e.message); return null }
}
const guastiOLancia = c => { try { return guastiDelCapitolo(c).join(' · ') } catch (e) { return e.message } }
const nuovo = () => ({ tappa: 0, libera: false, stelle: {}, cfg: {}, vinte: {} })
const vinciFino = (c, tappaId) => {
  const m = mondoDi(tappaDi(tappaId).mondo)
  for (const t of m.tappe) { segnaVinta(c, t.id, 1); if (t.id === tappaId) break }
}
const vinciMondo = (c, id) => mondoDi(id).tappe.forEach(t => segnaVinta(c, t.id, 1))

// Un capitolo scritto qui: i controlli che vogliono un caso preciso non aspettano i dati veri.
const DOMANDA = { testo: '¿Quién es?', risposta: () => 'Leo', anche: ['Tom', 'Pip'] }
const cap = (id, mondo, altro = {}) => ({ id, mondo, titolo: id, variabili: {}, domande: [DOMANDA],
  frasi: [{ es: 'hola Leo', chi: 'Leo' }], ...altro })

/* ═══════════ 1. tre storie per mondo, che crescono ═══════════ */
titolo('LE STORIE')
{
  const MISURE = { 1: [1, 2], 2: [2, 3], 3: [3, 3], 4: [3, 5], 5: [3, 5], 6: [3, 5] }
  if (!CAPITOLI.length) nota('nessun capitolo ancora: i controlli sulle storie dei mondi passano a vuoto')
  for (const m of MONDI.filter(x => x.tappe.length && CAPITOLI.length)) {
    const qui = CAPITOLI.filter(c => c.mondo === m.id)
    controlla(`${m.id}: almeno tre storie`, qui.length >= 3, qui.map(c => c.id).join(', '))
    // almeno una si apre a metà isola, non con la bandiera
    const meta = qui.filter(c => c.dopo && !tappaDi(c.dopo).bandiera &&
                                 m.tappe.indexOf(m.tappe.find(t => t.id === c.dopo)) < m.tappe.length - 2)
    controlla(`${m.id}: una storia a metà isola`, meta.length >= 1)
    if (m.tappe.some(t => t.frasi))
      controlla(`${m.id}: dopo una tappa di frasi`, meta.some(c => tappaDi(c.dopo).frasi))
    const [min, max] = MISURE[m.anno]
    for (const c of qui) {
      const n = pagineDi(c).length
      controlla(`${c.id}: ${n} pagine (in ${m.id} ${min}–${max})`, n >= min && n <= max)
    }
    nota(`${m.id}: ${inOrdine(qui).map(c => `${c.id} (${pagineDi(c).length} p., ${c.domande.length} d.)`).join(' · ')}`)
  }
  // in quarta e quinta testi veri: 15–25 frasi, 4–6 domande
  for (const c of CAPITOLI.filter(x => mondoDi(x.mondo).anno >= 4)) {
    const r = raccontata(c)
    if (!r) continue
    const frasi = r.righe.map(x => x.es).join(' ').split(/[.!?]+(?=\s|$)/).filter(s => s.trim())
    controlla(`${c.id}: 15–25 frasi`, frasi.length >= 15 && frasi.length <= 25, String(frasi.length))
    controlla(`${c.id}: 4–6 domande`, c.domande.length >= 4 && c.domande.length <= 6)
  }
}

/* ═══════════ 2. le pagine ═══════════ */
titolo('LE PAGINE')
{
  const aPagine = cap('prova-pagine', 'prima', { frasi: undefined, pagine: [[{ es: 'hola Leo', chi: 'Leo' }], [{ es: 'hola Tom', chi: 'Tom' }]] })
  const r = racconta(aPagine, {}, sorte(1))
  uguale('una storia a pagine si racconta a pagine', r.pagine.length, 2)
  uguale('e le righe sono tutte le pagine di seguito', r.righe.length, r.pagine.flat().length)
  uguale('ogni riga sa la sua pagina', r.righe.map(x => x.pagina).join(), '0,1')
  uguale('una storia con le frasi è una pagina sola', racconta(cap('prova-frasi', 'prima'), {}).pagine.length, 1)
  for (const c of CAPITOLI.filter(x => x.pagine)) {
    const v = raccontata(c)
    if (v) uguale(`${c.id}: le righe sono tutte le pagine di seguito`, v.righe.length, v.pagine.flat().length)
  }
  // i controlli nuovi: pagina vuota, dopo sbagliato, pagine e frasi insieme
  const g = altro => guastiDelCapitolo(cap('prova', 'prima', altro)).join(' · ')
  controlla('una pagina vuota è un guasto', /vuota/.test(g({ frasi: undefined, pagine: [[{ es: 'hola Leo', chi: 'Leo' }], []] })))
  controlla('una pagina che a volte resta vuota è un guasto', /a volte resta vuota/.test(g({
    variabili: { x: { fra: [true, false] } }, frasi: undefined,
    pagine: [[{ es: 'hola Leo', chi: 'Leo' }], [{ se: v => v.x, es: 'hola Tom', chi: 'Tom' }]] })))
  controlla('dopo una tappa che non c’è', /non c'è/.test(g({ dopo: 'prima-niente' })))
  controlla('dopo una tappa di un altro mondo', /del mondo seconda/.test(g({ dopo: 'seconda-comida' })))
  controlla('o pagine o frasi', /non tutte e due/.test(g({ pagine: [[{ es: 'hola Leo', chi: 'Leo' }]] })))
  controlla('senza titolo, frasi o domande', /senza titolo/.test(g({ domande: [] })))
  // le parole sono quelle della tappa da cui si apre, non di fine mondo
  controlla('a metà isola «regla» non è ancora nota', /regla/.test(g({ dopo: 'prima-es-un', frasi: [{ es: 'es una regla', forma: 'es-un' }] })))
  uguale('alla fine sì', g({ frasi: [{ es: 'es una regla', forma: 'es-un', chi: null }] }), '')
  uguale('senza dopo, la tappa prima della 🏁', tappaDellaStoria(cap('x', 'prima')), 'prima-numeros')
  controlla('una forma non ancora nota è un guasto', /forma .* non è nota/.test(g({ dopo: 'prima-colores', frasi: [{ es: 'es un perro', forma: 'es-un' }] })))
  controlla('ogni parola toccata dice qualcosa', /toccata non dice niente/.test(g({ frasi: [{ es: 'es un zorp' }] })))
  controlla('una frase storta è un guasto', /sgrammaticata/.test(g({ frasi: [{ es: 'es una perro' }] })))
  // una variabile che non c'è: un guasto detto in parole (oggi guastiDelCapitolo lancia l'eccezione di rendi)
  controlla('una variabile che non c’è è un guasto', /variabile sconosciuta/.test(guastiOLancia(cap('prova', 'prima', { frasi: [{ es: 'es {un:x}' }] }))))
}

/* ═══════════ 2b. chi parla ═══════════ */
titolo('CHI PARLA')
{
  // la narrazione di seguito, le battute a sé, due frasi di fila della stessa persona in una
  const righe = [{ es: 'Tom está aquí.', chi: null }, { es: 'Leo está aquí.', chi: null }, { es: '¡Hola!', chi: 'Tom' },
                 { es: '¿Cómo estás?', chi: 'Tom' }, { es: '¡Bien!', chi: 'Leo' }, { es: 'Ellos juegan.', chi: null }]
  stessaLista('i blocchi di una pagina', blocchiDi(righe).map(b => [b.chi, b.righe.length]),
    [[null, 2], ['Tom', 2], ['Leo', 1], [null, 1]])
  uguale('col nome in italiano', blocchiDi([{ es: '¡Buenas noches!', chi: 'mamma' }])[0].nome, 'La mamma')
  const botta = cap('prova-battute', 'prima', { frasi: [{ es: 'hola', chi: 'Tom' }, { es: 'hola', chi: 'Leo' },
    { es: 'hola', chi: 'Tom' }, { es: 'hola', chi: 'Leo' }] })
  stessaLista('una storia a battute: Tom, Leo, Tom, Leo', racconta(botta, {}, sorte(1)).blocchi[0].map(b => b.chi), ['Tom', 'Leo', 'Tom', 'Leo'])
  for (const c of CAPITOLI)
    controlla(`${c.id}: ha qualcuno che parla`, !!(raccontata(c) || { righe: [] }).righe.some(x => x.chi))
  // chi parla anche da una variabile: nelle storie vere che lo fanno, cambia con la variante
  for (const c of CAPITOLI.filter(x => x.pagine || x.frasi).filter(x => [...(x.frasi || x.pagine.flat())].some(f => typeof f.chi === 'function'))) {
    const nomi = new Set(mondiDi(c).flatMap(v => ((raccontata(c, v) || {}).righe || []).map(x => x.chi).filter(Boolean)))
    controlla(`${c.id}: chi parla dipende dalla variante`, nomi.size >= 2, [...nomi].join())
  }
  const sd = cap('prova-variabile', 'prima', { variabili: { chi: { fra: ['mamma', 'papa'] } },
    frasi: [{ es: 'hola', chi: v => v.chi }] })
  stessaLista('chi dice una frase dipende dalla variabile', mondiDi(sd).map(v => racconta(sd, v, sorte(1)).righe[0].chi).sort(), ['mamma', 'papa'])

  const g = frasi => guastiDelCapitolo(cap('prova', 'prima', { frasi })).join(' · ')
  controlla('chi dev’essere un personaggio', /non è un personaggio/.test(g([{ chi: 'Zorro', es: 'hola' }])))
  controlla('anche quando è una funzione', /non è un personaggio/.test(g([{ chi: () => 'Zorro', es: 'hola' }])))
  controlla('domanda e risposta sono due battute', /due battute/.test(g([{ chi: 'Tom', es: '¿Es un gato? No, es un perro' }])))
  controlla('chi ripete la domanda senza verbo è una battuta sola',
    !/due battute/.test(g([{ chi: 'Tom', es: '¿Pip? No, no es Pip.' }, { chi: 'Leo', es: '¿La pelota? No, no la vi.' }])))
  controlla('narrazione che dice «yo»: manca chi', /manca chi/.test(g([{ es: 'yo soy Leo' }])))
  controlla('narrazione col verbo alla prima persona: manca chi', /manca chi/.test(g([{ es: 'me llamo Leo' }])))
  controlla('narrazione fra virgolette: manca chi', /manca chi/.test(g([{ es: '“hola”' }])))
  controlla('«tú» nella narrazione: manca chi', /manca chi/.test(g([{ es: 'tú eres Leo' }])))
  uguale('una battuta giusta passa', g([{ es: 'es un gato' }, { chi: 'Tom', es: 'soy Tom' }]), '')
}

/* ═══════════ 3. le forme dei verbi ═══════════ */
titolo('LE FORME DEI VERBI')
{
  for (const [base, come, persona, attesa] of [['jugar', 'pres', 'él', 'juega'], ['querer', 'pres', 'yo', 'quiero'],
    ['comer', 'pres', 'nosotros', 'comemos'], ['vivir', 'pres', 'ellos', 'viven'], ['correr', 'ger', 'él', 'corriendo'],
    ['leer', 'ger', 'él', 'leyendo'], ['dormir', 'ger', 'él', 'durmiendo'], ['comer', 'ind', 'él', 'comió'],
    ['jugar', 'ind', 'yo', 'jugué'], ['hacer', 'ind', 'yo', 'hice'], ['ir', 'ind', 'ellos', 'fueron'],
    ['cantar', 'ind', 'yo', 'canté'], ['estar', 'ind', 'él', 'estuvo'], ['decir', 'ind', 'él', 'dijo']])
    uguale(`${base} ${come} ${persona}`, flessione(base, come, persona), attesa)
  uguale('juega viene da jugar', JSON.stringify((({ base, come }) => ({ base, come }))(flessa('juega'))),
         JSON.stringify({ base: 'jugar', come: 'pres' }))
  uguale('«comío» non è niente', flessa('comío'), null)
  uguale('«hací» non è niente', flessa('hací'), null)

  const ammesse = (mondo, tappa) => [paroleDelLibro(mondo, tappa), flessioniDi(formeDelLibro(mondo, tappa))]
  const [n3, f3] = ammesse('terza'), [n4, f4] = ammesse('quarta'), [n6, f6] = ammesse('sesta')
  stessaLista('in terza «ella come» no: il presente dei verbi arriva in quarta', sconosciute('ella come pan', n3, f3), ['come'])
  stessaLista('in quarta sì', sconosciute('ella come pan', n4, f4), [])
  stessaLista('in quarta il gerundio sì', sconosciute('estoy comiendo pan', n4, f4), [])
  stessaLista('in quarta il passato no', sconosciute('ella comió pan', n4, f4), ['comió'])
  stessaLista('nella sesta isola sì', sconosciute('ella comió pan', n6, f6), [])
  stessaLista('la base dev’essere nota: «compró» prima di «comprar» no',
    sconosciute('Leo compró pan', paroleDelLibro('sesta', 'sesta-ayer'), f6), ['compró'])
  stessaLista('dopo sì', sconosciute('Leo compró pan', paroleDelLibro('sesta', 'sesta-hablar'), f6), [])
  stessaLista('«comio» senza accento non è mai giusto', sconosciute('ella comio pan', n6, f6), ['comio'])
  stessaLista('«hací» (regolare sbagliato) non è mai giusto', sconosciute('ayer hací pan', n6, f6), ['hací'])
  stessaLista('senza flessioni come prima', sconosciute('ella come pan', n6), ['come'])
  controlla('le parole delle frasi componibili non cambiano: «comió» non è nota in quarta', !paroleNote('quarta').has('comió'))

  // toccata, una forma flessa dice la sua base
  const t = traduci('comió')
  controlla('«comió» → mangiare', /mangiare/.test(t.it), t.it)
  uguale('e la chiave è quella del verbo', t.chiave, 'verbo-es:comer')
  uguale('anche per lo SRS: «jugué» è verbo-es:jugar', chiaveDi('jugué'), 'verbo-es:jugar')
  uguale('«cocina» resta anche il nome', chiaveDi('cocina'), 'es:cocina')
  controlla('«juega» → giocare', /giocare/.test(traduci('juega').it))
  controlla('«corriendo» → correre', /correre/.test(traduci('corriendo').it))
  controlla('«hizo» → fare', /fare/.test(traduci('hizo').it))
  controlla('«hay» resta quella del glossario', /c’è/.test(traduci('hay').it) && traduci('hay').chiave === null)
}

/* ═══════════ 4. quale storia ═══════════ */
titolo('QUALE STORIA')
{
  // storie scritte qui, nei mondi veri: la regola non cambia col contenuto dei capitoli
  const CAP = [cap('a', 'prima', { dopo: 'prima-es-un' }), cap('b', 'prima', { dopo: 'prima-hola' }), cap('c', 'prima'),
               cap('d', 'seconda', { dopo: 'seconda-gusta' }), cap('e', 'seconda'),
               cap('g', 'quinta', { dopo: 'quinta-voy' }), cap('f', 'sesta', { dopo: 'sesta-ayer' }), cap('h', 'sesta')]
  const c = nuovo()
  uguale('a mappa vuota nessuna storia', storieAperte(CAP, c, {}, 'prima').length, 0)
  vinciFino(c, 'prima-es-un')
  stessaLista('vinta la sua tappa, si apre la prima storia', storieAperte(CAP, c, {}, 'prima').map(x => x.id), ['a'])
  uguale('il libro apre quella', prossimaStoria(CAP, c, {}, 'prima').id, 'a')
  segnaLetta(c, 'a', 100)
  uguale('letta, si segna', lette(c).a, 100)
  uguale('se sono tutte lette, si rilegge la meno recente', prossimaStoria(CAP, c, {}, 'prima').id, 'a')
  uguale('e un’altra storia non c’è', unAltraStoria(CAP, c, {}, 'prima', 'a'), null)

  vinciMondo(c, 'prima')
  const tutte = storieAperte(CAP, c, {}, 'prima')
  uguale('a mondo finito ci sono tutte, in ordine di tappa', tutte.map(x => x.id).join(), 'a,b,c')
  const seconda = prossimaStoria(CAP, c, {}, 'prima')
  controlla('il libro apre la prima non letta', seconda.id === 'b' && !lette(c).b)
  const altra = unAltraStoria(CAP, c, {}, 'prima', seconda.id)
  controlla('«Un’altra storia» è un’altra, non letta', altra && altra.id === 'c')
  // lette tutte quelle della prima: la prossima viene dal mondo aperto più vicino
  for (const x of tutte) segnaLetta(c, x.id, 200 + tutte.indexOf(x))
  vinciFino(c, 'seconda-gusta')
  const fuori = unAltraStoria(CAP, c, {}, 'prima', 'c')
  uguale('tutte lette: una non letta di un altro mondo', fuori && fuori.mondo, 'seconda')
  // niente di non letto: la meno recente del mondo, ma non quella appena letta
  for (const x of storieAperte(CAP, c, {}, 'seconda')) segnaLetta(c, x.id, 900)
  const vecchia = unAltraStoria(CAP, c, {}, 'prima', 'a')
  controlla('niente di nuovo: la meno recente, che non è quella appena letta',
    vecchia && vecchia.mondo === 'prima' && vecchia.id !== 'a', vecchia && vecchia.id)
  uguale('è quella letta da più tempo', vecchia.id, 'b')

  // Sblocca tutti apre tutto, l'età niente
  uguale('sblocca tutti apre le storie', storieAperte(CAP, nuovo(), { tutto: true }, 'sesta').length, 2)
  uguale('a otto anni nessuna storia aperta da sé', storieAperte(CAP, nuovo(), { eta: 8 }, 'prima').length, 0)
  // dieci anni: tutte lette le sue, «Un'altra storia» cerca prima il mondo vicino
  const g = nuovo()
  vinciMondo(g, 'quarta'); vinciMondo(g, 'quinta'); vinciMondo(g, 'sesta')
  for (const x of CAP.filter(x => x.mondo === 'sesta')) segnaLetta(g, x.id, 5)
  uguale('dalla sesta si passa alla quinta, non alla prima',
    (unAltraStoria(CAP, g, { eta: 10 }, 'sesta', 'h') || {}).mondo, 'quinta')

  // il medaglione chiuso dice quale tappa vincere
  const s = cosaServeAlLibro(CAP, 'prima')
  uguale('il libro chiuso dice cosa serve', s, `Si apre quando vinci «${tappaDi('prima-es-un').nome}»`)
  const stato = statoMappa(nuovo(), () => 0)
  const nodo = { tipo: 'libro', id: 'prima', mondo: 'prima' }
  uguale('e il cartiglio lo ripete', cosaServe(stato, nodo, { libro: { serve: s } }), s)

  // le storie vere: ognuna si apre quando la sua tappa è vinta, e non prima
  for (const x of CAPITOLI.filter(y => !(y.puntata > 1))) {
    const k = nuovo()
    controlla(`${x.id}: chiusa a mappa vuota`, !storiaAperta(k, x, {}, CAPITOLI))
    vinciMondo(k, 'prima'); vinciMondo(k, 'seconda'); vinciMondo(k, 'terza'); vinciMondo(k, 'quarta'); vinciMondo(k, 'quinta')
    vinciMondo(k, 'sesta')
    controlla(`${x.id}: aperta a mondi finiti`, storiaAperta(k, x, {}, CAPITOLI))
  }
}

/* ═══════════ 5. la paga ═══════════ */
titolo('LA PAGA')
{
  uguale('una pagina: come prima', pagaDelCapitolo(1), PAGA_CAPITOLO)
  uguale('tre pagine: ancora', pagaDelCapitolo(3), PAGA_CAPITOLO)
  uguale('quattro pagine: una in più', pagaDelCapitolo(4), PAGA_CAPITOLO + 1)
  for (const c of CAPITOLI) {
    const p = pagaDelCapitolo(pagineDi(c).length)
    controlla(`${c.id}: paga intera e fra 4 e 6`, Number.isInteger(p) && p >= 4 && p <= 6, String(p))
  }
}

/* ═══════════ 6. le parole della storia ═══════════ */
titolo('LE PAROLE DELLA STORIA')
{
  // parole prese dai cassetti veri: una di quarta (un nome), una di quinta, nove della prima
  const chiavi = m => cassettoDi(m).chiavi.filter(k => k.startsWith('es:') && !/\s/.test(k)).map(k => k.slice(3))
  const dellaQuarta = chiavi('quarta').find(w => nomeDi(w) && plurale(w) !== w)
  const dellaQuinta = chiavi('quinta')[0]
  const dellaPrima = chiavi('prima')
  controlla('i cassetti di quarta e quinta hanno parole per la prova', !!dellaQuarta && !!dellaQuinta && dellaPrima.length >= 9)
  const quarta = (altro = {}) => cap('prova', 'quarta', altro)
  const storia = quarta({ nuove: [dellaQuinta], frasi: [{ es: `es ${dellaQuarta} ${dellaQuinta}`, chi: null }] })
  const r = racconta(storia, {}, sorte(1))
  controlla('una nuova è parola della storia', r.storia.includes(dellaQuinta), r.storia.join(' '))
  controlla('anche una del cassetto del suo mondo', r.storia.includes(dellaQuarta))
  controlla('una parola nota alla tappa no', !r.storia.includes('perro') && !r.storia.includes('es'))
  const m = paroleDellaStoriaIn(`es ${plurale(dellaQuarta)}`, storia)
  stessaLista('a schermo e la sua base', [...m.entries()].map(([a, b]) => `${a}→${b}`), [`${plurale(dellaQuarta)}→${dellaQuarta}`])
  controlla('i cassetti sono del mondo e di quelli prima', paroleDeiCassetti('quarta').has(dellaQuarta) &&
            paroleDeiCassetti('quarta').has('zorro') && !paroleDeiCassetti('quarta').has(dellaQuinta))

  const g = altro => guastiDelCapitolo(quarta(altro)).join(' · ')
  uguale('una parola del cassetto passa da sola', g({ frasi: [{ es: `es ${dellaQuarta}`, chi: null }] }), '')
  controlla('una del cassetto di un mondo dopo no', new RegExp(dellaQuinta).test(g({ frasi: [{ es: `es ${dellaQuinta}` }] })))
  uguale('una nuova passa', g({ nuove: [dellaQuinta], frasi: [{ es: `es ${dellaQuinta}`, chi: null }] }), '')
  controlla('una parola di una tappa dopo, senza nuove, no', /escuela/.test(g({ frasi: [{ es: 'es una escuela' }] })))
  controlla('una nuova già nota è un guasto', /già nota/.test(g({ nuove: ['perro'], frasi: [{ es: 'es un perro' }] })))
  controlla('una nuova fuori da parole-es.js è un guasto', /non è in parole-es/.test(g({ nuove: ['zorp'], frasi: [{ es: 'es un perro' }] })))
  const diStruttura = PAROLE_ES.find(w => w[3] === 'q')
  if (diStruttura)
    controlla('anche una di struttura, che un cassetto non ha', /non è in parole-es/.test(g({ nuove: [diStruttura[0]], frasi: [{ es: diStruttura[0] }] })))
  controlla('una nuova che non si usa è un guasto', /non si usa mai/.test(g({ nuove: [dellaQuinta], frasi: [{ es: 'es un perro', chi: null }] })))
  controlla(`più di ${PAROLE_DELLA_STORIA_MAX} parole della storia è un guasto`,
    /al massimo 8/.test(guastiDelCapitolo(cap('prova', 'prima', { frasi: [{ es: dellaPrima.slice(0, 9).join(' ') }] })).join(' ')))
  // le nuove stanno in un cassetto: lo SRS le ripassa lì
  controlla('toccata, una nuova dice cosa vuol dire', !!traduci(dellaQuinta).it)
  uguale('e ha la sua chiave SRS', traduci(dellaQuinta).chiave, 'es:' + dellaQuinta)
  // ogni storia nuova le usa, e al massimo otto (lo controlla guastiDelCapitolo su ognuna)
  for (const c of CAPITOLI.filter(x => x.nuove)) nota(`${c.id}: nuove ${c.nuove.join(', ')}`)
}

/* ═══════════ 7. le domande nuove ═══════════ */
titolo('CHI L’HA DETTO, LA FRASE, L’ORDINE')
{
  const storia = {
    id: 'prova-nuove', mondo: 'prima', titolo: 'Prova', variabili: { trova: { fra: ['Tom', 'Leo'] } },
    frasi: [{ id: 'hola', chi: 'Tom', es: 'hola' }, { id: 'adios', chi: 'Leo', es: 'adiós' },
            { id: 'perche', chi: v => v.trova, es: 'gracias' },
            { id: 'bene', chi: 'mamma', es: 'estoy bien' }, { id: 'fine', es: 'es un gato' }],
    domande: [{ tipo: 'chi', frase: 'perche' }, { tipo: 'frase', testo: 'Che cos’è?', frase: 'fine' },
              { tipo: 'ordine', fatti: ['Tom saluta', 'Leo saluta', 'Tom ringrazia', 'La mamma sta bene'] }],
  }
  const r = racconta(storia, { trova: 'Tom' }, sorte(3))
  const chi = r.domande.find(d => d.tipo === 'chi')
  uguale('«chi»: la battuta fra le virgolette', chi.citazione, 'gracias')
  uguale('la giusta è chi la dice nel mondo tirato', chi.giusta, 'Tom')
  controlla('le sbagliate sono gli altri che parlano nella storia',
    chi.opzioni.filter(o => !o.giusta).every(o => ['Leo', 'La mamma'].includes(o.testo)), chi.opzioni.map(o => o.testo).join(', '))
  const iGiusta = chi.opzioni.findIndex(o => o.giusta)
  controlla('si risponde con l’opzione', eGiusta(chi, iGiusta) && !eGiusta(chi, (iGiusta + 1) % chi.opzioni.length))
  uguale('cambiando il mondo cambia chi la dice', racconta(storia, { trova: 'Leo' }, sorte(3)).domande.find(d => d.tipo === 'chi').giusta, 'Leo')
  // in una storia dove parlano in due, le altre dalla gente di casa
  const due = cap('due', 'prima', { frasi: [{ id: 'ciao', chi: 'Tom', es: 'hola' }, { chi: 'Leo', es: 'hola Tom' }],
                                    domande: [{ tipo: 'chi', frase: 'ciao' }] })
  const d2 = racconta(due, {}, sorte(1)).domande[0]
  controlla('pochi che parlano: si pesca dalla gente di casa', d2.opzioni.length === 4 &&
    d2.opzioni.every(o => o.testo === 'Tom' || CHI_DI_CASA.map(k => CHI_PARLA[k]).includes(o.testo)))

  const frase = r.domande.find(d => d.tipo === 'frase')
  uguale('«frase»: la giusta è una riga del racconto', r.righe[frase.giusta].id, 'fine')
  controlla('si risponde toccandola', eGiusta(frase, frase.giusta) && !eGiusta(frase, frase.giusta + 1))
  uguale('e sa in che pagina sta', frase.pagina, r.righe[frase.giusta].pagina)

  const ordine = r.domande.find(d => d.tipo === 'ordine')
  uguale('«ordine»: i fatti nell’ordine scritto', ordine.soluzione[2], 'Tom ringrazia')
  for (let s = 1; s <= 30; s++) {
    const o = racconta(storia, { trova: 'Tom' }, sorte(s)).domande.find(d => d.tipo === 'ordine')
    if (o.tessere.every((t, i) => t.id === i)) { controlla('le tessere non nascono mai in ordine', false, String(s)); break }
  }
  controlla('giusta in fila, sbagliata girata', eGiusta(ordine, [0, 1, 2, 3]) && !eGiusta(ordine, [1, 0, 2, 3]))
  controlla('e non a metà', !eGiusta(ordine, [0, 1, 2]))
  // la fila delle tessere, in sola lettura: si compone e colora le sbagliate come le frasi
  let fila = F.filaVuota(ordine)
  for (const id of [1, 0, 2, 3]) fila = F.metti(ordine, fila, id)
  controlla('la fila è pronta con tutti i fatti', F.pronta(ordine, fila))
  stessaLista('e colora quelli fuori posto', F.sbagliate(ordine, fila), [1, 0])

  // i guasti dei tipi nuovi
  const base = { id: 'prova', mondo: 'prima', titolo: 'Prova', variabili: { x: { fra: [true, false] } } }
  const frasi = [{ id: 'a', chi: 'Tom', es: 'hola' }, { id: 'b', se: v => v.x, es: 'es un perro' },
                 { id: 'c', es: 'es un gato' }, { chi: 'Leo', es: 'hola Tom' }]
  const g = domande => guastiDelCapitolo({ ...base, frasi, domande }).join(' · ')
  uguale('una «frase» e una «chi» giuste passano', g([{ tipo: 'frase', testo: 'Che cos’è?', frase: 'c' },
                                                    { tipo: 'chi', frase: 'a' }]), '')
  controlla('rimando a una frase che non c’è', /non c'è \(z\)/.test(g([{ tipo: 'frase', testo: 'Dov’è?', frase: 'z' }])))
  controlla('rimando a una frase che non si accende', /non si accende/.test(g([{ tipo: 'frase', testo: 'Dov’è?', frase: 'b' }])))
  controlla('«chi» su una frase del narratore', /non è una battuta/.test(g([{ tipo: 'chi', frase: 'c' }])))
  controlla('«frase» senza domanda', /serve il testo/.test(g([{ tipo: 'frase', frase: 'c' }])))
  controlla('«ordine» con due fatti', /ne vanno 3 o 4/.test(g([{ tipo: 'ordine', fatti: ['Uno', 'Due'] }])))
  controlla('«ordine» con due fatti uguali', /due fatti uguali/.test(g([{ tipo: 'ordine', fatti: ['Uno', 'Due', 'Uno'] }])))
  controlla('due frasi con lo stesso id', /due frasi con l'id/.test(guastiDelCapitolo({ ...base,
    frasi: [...frasi, { id: 'c', es: 'es un perro' }], domande: [{ tipo: 'chi', frase: 'a' }] }).join(' ')))
  controlla('un tipo sconosciuto', /tipo sconosciuto/.test(g([{ tipo: 'boh', testo: 'Boh?' }])))
  // la domanda a scelta con due sole risposte (una su due si indovina) è un guasto, il vero/falso no
  controlla('una scelta con due risposte è un guasto', /solo due risposte/.test(g([{ testo: '¿Qué es?', risposta: () => 'Un gato', anche: ['Un perro'] }])))

  // ogni storia di quarta e quinta ha una domanda di tipo nuovo; le nuove, due tipi diversi
  const NUOVI = ['chi', 'frase', 'ordine']
  for (const c of CAPITOLI.filter(x => mondoDi(x.mondo).anno >= 4)) {
    const tipi = new Set(c.domande.map(d => d.tipo).filter(t => NUOVI.includes(t)))
    controlla(`${c.id}: una domanda di tipo nuovo`, tipi.size >= 1)
    if (c.nuove) controlla(`${c.id}: storia nuova, due tipi nuovi`, tipi.size >= 2, [...tipi].join(', '))
  }
}

/* ═══════════ 8. le storie a puntate ═══════════ */
titolo('LE STORIE A PUNTATE')
{
  uguale('le serie vere stanno in piedi', guastiDelleSerie(CAPITOLI).join(' · '), '')
  // tre puntate scritte qui: le variabili si tengono, e il posto del tesoro si tira alla seconda
  const puntata = (n, variabili, altro = {}) => cap(`s${n}`, 'prima', {
    serie: 'prova', puntata: n, variabili, dopo: 'prima-es-un',
    frasi: [...(n > 1 ? [{ riassunto: true, es: 'es un gato' }] : []), { es: 'hola Leo', chi: 'Leo' }], ...altro })
  const nonno = ['mamma', 'papa', 'nonna']
  const p1 = puntata(1, { nonno: { fra: nonno } })
  const p2 = puntata(2, { nonno: { fra: nonno }, dove: { fra: ['casa', 'parque'] } })
  const p3 = puntata(3, { nonno: { fra: nonno }, dove: { fra: ['casa', 'parque'] } })
  const CAP = [p1, p2, p3]
  uguale('una serie giusta passa', guastiDelleSerie(CAP).join(' · '), '')
  stessaLista('in ordine, una puntata dopo l’altra', inOrdine(CAP).map(x => x.puntata), [1, 2, 3])
  // si aprono in fila, anche a chi ha tutto aperto
  const c = nuovo()
  vinciMondo(c, 'prima')
  controlla('la prima si apre con la sua tappa', storiaAperta(c, p1, {}, CAP))
  controlla('la seconda no, finché la prima non è letta', !storiaAperta(c, p2, {}, CAP))
  controlla('nemmeno con «Sblocca tutti»', !storiaAperta(nuovo(), p2, { tutto: true }, CAP))
  // la prima tira le variabili e le salva accanto alle lette
  const v1 = tiraLaStoria(c, p1, sorte(5))
  uguale('salvate per chiave', serieDi(c).prova.valori.nonno, chiaveDelValore(v1.nonno))
  segnaLetta(c, p1.id, 10); segnaPuntata(c, p1)
  uguale('letta, la serie sa fin dove si è arrivati', serieDi(c).prova.fatte, 1)
  uguale('il cartello offre la puntata dopo', (puntataDopo(CAP, c, {}, p1) || {}).id, p2.id)
  const altre = [...CAP, cap('altra', 'prima', { dopo: 'prima-es-un' })]
  controlla('e «Un’altra storia» non è un’altra puntata', (unAltraStoria(altre, c, {}, 'prima', p1.id) || {}).serie !== 'prova')
  // la seconda tiene il nonno, e tira il posto del tesoro
  for (let s = 1; s <= 12; s++) {
    const v2 = tiraLaStoria(c, p2, sorte(s))
    if (v2.nonno !== v1.nonno) { controlla('la puntata 2 ha le stesse variabili', false, `${v2.nonno} ${v1.nonno}`); break }
  }
  const dove = serieDi(c).prova.valori.dove
  controlla('il posto del tesoro si tira alla puntata 2 e si salva', ['"casa"', '"parque"'].includes(dove), dove)
  segnaLetta(c, p2.id, 20); segnaPuntata(c, p2)
  const v3 = tiraLaStoria(c, p3, sorte(9))
  uguale('la puntata 3 trova il tesoro dove diceva la 2', JSON.stringify(v3.dove), dove)
  uguale('con lo stesso nonno', v3.nonno, v1.nonno)
  // rileggerla da capo è un'altra avventura: la prima ritira tutto
  const prima = serieDi(c).prova
  tiraLaStoria(c, p1, sorte(77))
  controlla('la prima puntata riletta ricomincia la serie', serieDi(c).prova !== prima &&
            serieDi(c).prova.fatte === 0 && !('dove' in serieDi(c).prova.valori))
  // un profilo storto non rompe niente
  const storto = { ...nuovo(), serie: 'boh' }
  controlla('una serie storta nel profilo si rifà', tiraLaStoria(storto, p2, sorte(1)).nonno && serieDi(storto).prova)
  // tiraConFissi: i valori già tirati, se ci sono; se no un mondo qualunque
  uguale('fissi rispettati', chiaveDelValore(tiraConFissi(p2, { nonno: '"nonna"' }, sorte(2)).nonno), '"nonna"')
  controlla('fissi impossibili: un mondo qualunque', !!tiraConFissi(p2, { nonno: '"zio"' }, sorte(2)))
  // le variabili degli elenchi si salvano per `es`
  const conElenco = { ...cap('e1', 'prima', { variabili: { a: { da: 'animali' } } }) }
  uguale('un valore di un elenco ha la chiave del suo id o della sua parola', chiaveDelValore({ es: 'perro' }), 'perro')

  // «En el capítulo anterior…»: un blocco a sé, in testa alle puntate dopo la prima
  const r2 = racconta(p2, mondiDi(p2)[0], sorte(1))
  controlla('la puntata 2 comincia col riassunto', r2.blocchi[0][0].riassunto && r2.blocchi[0].length > 1)
  const b = blocchiDi([{ es: 'La otra vez…', chi: null, riassunto: true }, { es: 'El domingo…', chi: null }])
  uguale('il riassunto non si attacca alla narrazione', b.length, 2)
  // i guasti delle serie
  const pezzo = (n, altro = {}) => cap(`s${n}`, 'prima', { serie: 's', puntata: n, variabili: { x: { fra: [1, 2] } },
    frasi: [...(n > 1 ? [{ riassunto: true, es: 'es un gato' }] : []), { es: 'hola Leo', chi: 'Leo' }], ...altro })
  uguale('una serie giusta passa', guastiDelleSerie([pezzo(1), pezzo(2)]).join(' · '), '')
  controlla('una puntata sola', /una puntata sola/.test(guastiDelleSerie([pezzo(1)]).join(' ')))
  controlla('puntate che saltano', /1, 2, 3/.test(guastiDelleSerie([pezzo(1), pezzo(3)]).join(' ')))
  controlla('una variabile che nella puntata dopo non ha lo stesso valore', /non ha «1»/.test(guastiDelleSerie([
    pezzo(1), pezzo(2, { variabili: { x: { fra: [2, 3] } } })]).join(' ')))
  controlla('una puntata dopo la prima senza riassunto',
    /comincia con «Nella puntata prima/.test(guastiDelCapitolo(pezzo(2, { frasi: [{ es: 'hola Leo', chi: 'Leo' }] })).join(' ')))
  controlla('un riassunto nella prima puntata', /sta solo in testa/.test(guastiDelCapitolo(pezzo(1, {
    frasi: [{ riassunto: true, es: 'es un gato' }, { es: 'hola Leo', chi: 'Leo' }] })).join(' ')))
  controlla('puntate in mondi diversi', /mondi diversi/.test(guastiDelleSerie([pezzo(1), pezzo(2, { mondo: 'seconda' })]).join(' ')))
}

riassunto('Il libro dello spagnolo a mondi')
