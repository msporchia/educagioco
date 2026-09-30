/* ═══════════════════════════════════════════════════════════════════
   IL LIBRO DELL'INGLESE A MONDI — le storie, senza browser.
   `node test/esegui.mjs inglese-libro`

   Tre storie per mondo che crescono coi mondi, almeno una a metà isola;
   le pagine; quale storia apre il libro e quale «Un'altra storia»; le
   storie lette nel profilo; le forme dei verbi (plays, playing, played,
   went) accettate solo dove una struttura del mondo le ammette; la paga
   di una domanda; chi parla, a battute. Che ogni capitolo stia in piedi
   lo controlla unita/inglese-mondi. Il progetto è in docs/lingue/libro.md.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDI, mondoDi, tappaDi } from '../../src/giochi/inglese/dati/mondi.js'
import { pagaDelCapitolo, PAGA_CAPITOLO } from '../../src/giochi/inglese/dati/monete.js'
import { flessa, flessione } from '../../src/giochi/inglese/motore/flessioni.js'
import { sconosciute, paroleDelLibro, formeDelLibro, flessioniDi, paroleNote } from '../../src/giochi/inglese/motore/grafo.js'
import { traduci, chiaveDi } from '../../src/giochi/inglese/motore/lessico.js'
import { racconta, mondiDi, pagineDi, tappaDellaStoria, blocchiDi } from '../../src/giochi/inglese/motore/libro.js'
import { guastiDelCapitolo, sorte } from '../../src/giochi/inglese/motore/guasti.js'
import { segnaVinta, cosaServe, statoMappa } from '../../src/giochi/inglese/motore/mappa.js'
import { storieAperte, prossimaStoria, unAltraStoria, segnaLetta, lette, inOrdine, cosaServeAlLibro }
  from '../../src/giochi/inglese/motore/storie.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/giochi/inglese/dati/capitoli')
const titolo = t => console.log('\n' + t)
const CAPITOLI = []
for (const f of readdirSync(CARTELLA).filter(x => x.endsWith('.js')))
  CAPITOLI.push((await import(pathToFileURL(resolve(CARTELLA, f)))).default)
const capDi = id => CAPITOLI.find(c => c.id === id)
const nuovo = () => ({ tappa: 0, libera: false, stelle: {}, cfg: {}, vinte: {} })
const vinciFino = (c, tappaId) => {
  const m = mondoDi(tappaDi(tappaId).mondo)
  for (const t of m.tappe) { segnaVinta(c, t.id, 1); if (t.id === tappaId) break }
}
const vinciMondo = (c, id) => mondoDi(id).tappe.forEach(t => segnaVinta(c, t.id, 1))

/* ═══════════ 1. tre storie per mondo, che crescono ═══════════ */
titolo('LE STORIE')
{
  const MISURE = { 1: [1, 2], 2: [2, 3], 3: [3, 3], 4: [3, 5], 5: [3, 5] }
  for (const m of MONDI.filter(x => x.tappe.length)) {
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
    const v = mondiDi(c)[0]
    const frasi = racconta(c, v, sorte(1)).righe.map(r => r.en).join(' ').split(/[.!?]+(?=\s|$)/).filter(s => s.trim())
    controlla(`${c.id}: 15–25 frasi`, frasi.length >= 15 && frasi.length <= 25, String(frasi.length))
    controlla(`${c.id}: 4–6 domande`, c.domande.length >= 4 && c.domande.length <= 6)
  }
}

/* ═══════════ 2. le pagine ═══════════ */
titolo('LE PAGINE')
{
  const c = capDi('il-cane-di-laura')
  const r = racconta(c, mondiDi(c)[0], sorte(1))
  uguale('una storia a pagine si racconta a pagine', r.pagine.length, 2)
  uguale('e le righe sono tutte le pagine di seguito', r.righe.length, r.pagine.flat().length)
  const zaino = capDi('lo-zaino-di-leo')
  uguale('una storia con le frasi è una pagina sola', racconta(zaino, mondiDi(zaino)[0]).pagine.length, 1)
  // i controlli nuovi: pagina vuota, dopo sbagliato, pagine e frasi insieme
  const base = { id: 'prova', mondo: 'prima', titolo: 'Prova', variabili: {},
                 domande: [{ testo: 'Chi è?', risposta: () => 'Leo', anche: ['Tom', 'Pip'] }] }
  const g = cap => guastiDelCapitolo({ ...base, ...cap }).join(' · ')
  controlla('una pagina vuota è un guasto', /vuota/.test(g({ pagine: [[{ en: 'Hello, Leo!' }], []] })))
  controlla('una pagina che a volte resta vuota è un guasto', /a volte resta vuota/.test(g({
    variabili: { x: { fra: [true, false] } },
    pagine: [[{ en: 'Hello, Leo!' }], [{ se: v => v.x, en: 'Hello, Tom!' }]] })))
  controlla('dopo una tappa che non c’è', /non c'è/.test(g({ dopo: 'prima-niente', frasi: [{ en: 'Hello!' }] })))
  controlla('dopo una tappa di un altro mondo', /del mondo seconda/.test(g({ dopo: 'seconda-cibo', frasi: [{ en: 'Hello!' }] })))
  controlla('o pagine o frasi', /non tutte e due/.test(g({ frasi: [{ en: 'Hello!' }], pagine: [[{ en: 'Hello!' }]] })))
  // le parole sono quelle della tappa da cui si apre, non di fine mondo
  controlla('a metà isola «pen» non è ancora nota', /pen/.test(g({ dopo: 'prima-che-cose', frasi: [{ en: 'It is a pen.' }] })))
  uguale('alla fine sì', g({ frasi: [{ en: 'It is a pen.', forma: 'it-is' }] }), '')
  uguale('senza dopo, la tappa prima della 🏁', tappaDellaStoria(zaino), 'prima-quanti')
  controlla('ogni parola toccata dice qualcosa', /toccata non dice niente/.test(g({ frasi: [{ en: 'It is a zorp.' }] })))
}

/* ═══════════ 2b. chi parla ═══════════ */
titolo('CHI PARLA')
{
  // la narrazione di seguito, le battute a sé, due frasi di fila della stessa persona in una
  const righe = [{ en: 'Tom is here.', chi: null }, { en: 'Leo is here.', chi: null }, { en: 'Hello!', chi: 'Tom' },
                 { en: 'How are you?', chi: 'Tom' }, { en: 'Fine!', chi: 'Leo' }, { en: 'They play.', chi: null }]
  stessaLista('i blocchi di una pagina', blocchiDi(righe).map(b => [b.chi, b.righe.length]),
    [[null, 2], ['Tom', 2], ['Leo', 1], [null, 1]])
  uguale('col nome in italiano', blocchiDi([{ en: 'Good night!', chi: 'mamma' }])[0].nome, 'La mamma')
  const r = racconta(capDi('il-gioco-di-tom'), mondiDi(capDi('il-gioco-di-tom'))[0], sorte(1))
  stessaLista('una storia a battute: Tom, Leo, Tom, Leo', r.blocchi[0].map(b => b.chi), ['Tom', 'Leo', 'Tom', 'Leo'])
  controlla('ogni storia ha qualcuno che parla, tranne la gita', CAPITOLI.filter(c => c.id !== 'la-gita-al-castello')
    .every(c => racconta(c, mondiDi(c)[0], sorte(1)).righe.some(x => x.chi)))
  // chi parla anche da una variabile
  const s = capDi('il-sabato-di-tom')
  const nomi = new Set(mondiDi(s).map(v => racconta(s, v, sorte(1)).righe.find(x => x.chi).chi))
  stessaLista('chi dice buonanotte a Tom dipende da chi ha aiutato', [...nomi].sort(), ['mamma', 'papa'])

  const base = { id: 'prova', mondo: 'prima', titolo: 'Prova', variabili: {},
                 domande: [{ testo: 'Chi è?', risposta: () => 'Leo', anche: ['Tom', 'Pip'] }] }
  const g = frasi => guastiDelCapitolo({ ...base, frasi }).join(' · ')
  controlla('chi dev’essere un personaggio', /non è un personaggio/.test(g([{ chi: 'Zorro', en: 'Hello!' }])))
  controlla('anche quando è una funzione', /non è un personaggio/.test(g([{ chi: () => 'Zorro', en: 'Hello!' }])))
  controlla('domanda e risposta sono due battute', /due battute/.test(g([{ chi: 'Tom', en: 'Is it a cat? Yes, it is.' }])))
  controlla('narrazione che dice «I»: manca chi', /manca chi/.test(g([{ en: 'I am Leo.' }])))
  controlla('narrazione fra virgolette: manca chi', /manca chi/.test(g([{ en: '“Hello!”' }])))
  uguale('una battuta giusta passa', g([{ en: 'It is a cat.' }, { chi: 'Tom', en: 'I am Tom.' }]), '')
}

/* ═══════════ 3. le forme dei verbi ═══════════ */
titolo('LE FORME DEI VERBI')
{
  for (const [base, come, attesa] of [['play', 's', 'plays'], ['go', 's', 'goes'], ['wash', 's', 'washes'],
    ['fly', 's', 'flies'], ['run', 'ing', 'running'], ['make', 'ing', 'making'], ['see', 'ing', 'seeing'],
    ['swim', 'ing', 'swimming'], ['dance', 'ed', 'danced'], ['cry', 'ed', 'cried'], ['clap', 'ed', 'clapped'],
    ['play', 'ed', 'played'], ['go', 'ed', null], ['go', 'irr', 'went'], ['listen', 'ing', 'listening']])
    uguale(`${base} + ${come}`, flessione(base, come), attesa)
  uguale('went viene da go', JSON.stringify(flessa('went')), JSON.stringify({ base: 'go', come: 'irr' }))
  uguale('goed non è niente', flessa('goed'), null)
  uguale('swimmed non è niente', flessa('swimmed'), null)

  const ammesse = mondo => [paroleDelLibro(mondo), flessioniDi(formeDelLibro(mondo))]
  const [n3, f3] = ammesse('terza'), [n4, f4] = ammesse('quarta'), [n5, f5] = ammesse('quinta')
  stessaLista('in terza «she swims» no: la s arriva in quarta', sconosciute('she swims', n3, f3), ['swims'])
  stessaLista('in quarta sì', sconosciute('she swims', n4, f4), [])
  stessaLista('in quarta -ing sì', sconosciute('he is running', n4, f4), [])
  stessaLista('in quarta il passato no', sconosciute('he went and played', n4, f4), ['went', 'played'])
  stessaLista('in quinta sì', sconosciute('he went and played', n5, f5), [])
  stessaLista('la base dev’essere nota: «saw» in quinta prima dei verbi che cambiano no',
    sconosciute('he saw', paroleDelLibro('quinta', 'quinta-citta'), f5), ['saw'])
  stessaLista('goed non è mai giusto', sconosciute('he goed', n5, f5), ['goed'])
  stessaLista('senza flessioni come prima', sconosciute('she plays', n5), ['plays'])
  controlla('le parole delle frasi componibili non cambiano', !paroleNote('quarta').has('went'))

  // toccata, una forma flessa dice la sua base
  const t = traduci('went')
  controlla('«went» → andare', /andare/.test(t.it), t.it)
  uguale('e la chiave è quella del verbo', t.chiave, 'verbo:go')
  uguale('anche per lo SRS: «played» è verbo:play', chiaveDi('played'), 'verbo:play')
  uguale('«cooks» resta anche il plurale di cook', chiaveDi('cooks'), 'en:cook')
  controlla('«plays» → giocare', /giocare/.test(traduci('plays').it))
  controlla('«running» → correre', /correre/.test(traduci('running').it))
  controlla('«liked» → piacere', /piacere/.test(traduci('liked').it))
  uguale('«does» resta quella del glossario', traduci('does').it, 'come do, con he, she, it')
}

/* ═══════════ 4. quale storia ═══════════ */
titolo('QUALE STORIA')
{
  const c = nuovo()
  uguale('a mappa vuota nessuna storia', storieAperte(CAPITOLI, c, {}, 'prima').length, 0)
  const meta = inOrdine(CAPITOLI.filter(x => x.mondo === 'prima'))[0]
  vinciFino(c, meta.dopo)
  stessaLista('vinta la sua tappa, si apre la prima storia', storieAperte(CAPITOLI, c, {}, 'prima').map(x => x.id), [meta.id])
  uguale('il libro apre quella', prossimaStoria(CAPITOLI, c, {}, 'prima').id, meta.id)
  segnaLetta(c, meta.id, 100)
  uguale('letta, si segna', lette(c)[meta.id], 100)
  uguale('se sono tutte lette, si rilegge la meno recente', prossimaStoria(CAPITOLI, c, {}, 'prima').id, meta.id)
  uguale('e un’altra storia non c’è', unAltraStoria(CAPITOLI, c, {}, 'prima', meta.id), null)

  vinciMondo(c, 'prima')
  const tutte = storieAperte(CAPITOLI, c, {}, 'prima')
  controlla('a mondo finito ci sono tutte', tutte.length === CAPITOLI.filter(x => x.mondo === 'prima').length)
  const seconda = prossimaStoria(CAPITOLI, c, {}, 'prima')
  controlla('il libro apre la prima non letta', seconda.id !== meta.id && !lette(c)[seconda.id])
  const altra = unAltraStoria(CAPITOLI, c, {}, 'prima', seconda.id)
  controlla('«Un’altra storia» è un’altra, non letta', altra && altra.id !== seconda.id && altra.id !== meta.id)
  // lette tutte quelle della prima: la prossima viene dal mondo aperto più vicino
  for (const x of tutte) segnaLetta(c, x.id, 200 + tutte.indexOf(x))
  vinciFino(c, 'seconda-mi-piace')
  const fuori = unAltraStoria(CAPITOLI, c, {}, 'prima', tutte[tutte.length - 1].id)
  uguale('tutte lette: una non letta di un altro mondo', fuori && fuori.mondo, 'seconda')
  // niente di non letto: la meno recente del mondo, ma non quella appena letta
  for (const x of storieAperte(CAPITOLI, c, {}, 'seconda')) segnaLetta(c, x.id, 900)
  const vecchia = unAltraStoria(CAPITOLI, c, {}, 'prima', meta.id)
  controlla('niente di nuovo: la meno recente, che non è quella appena letta',
    vecchia && vecchia.mondo === 'prima' && vecchia.id !== meta.id, vecchia && vecchia.id)
  uguale('è quella letta da più tempo', vecchia.id, tutte.filter(x => x.id !== meta.id)[0].id)

  // Sblocca tutti e i mondi passati per età aprono tutto
  uguale('sblocca tutti apre le storie', storieAperte(CAPITOLI, nuovo(), { tutto: true }, 'quinta').length,
    CAPITOLI.filter(x => x.mondo === 'quinta').length)
  controlla('a otto anni la prima è passata', storieAperte(CAPITOLI, nuovo(), { eta: 8 }, 'prima').length >= 3)
  uguale('ma la seconda no', storieAperte(CAPITOLI, nuovo(), { eta: 8 }, 'seconda').length, 0)
  // dieci anni: tutte lette le sue, «Un'altra storia» cerca prima il mondo vicino
  const g = nuovo()
  vinciMondo(g, 'quarta'); vinciMondo(g, 'quinta')
  for (const x of CAPITOLI.filter(x => x.mondo === 'quinta')) segnaLetta(g, x.id, 5)
  uguale('dalla quinta si passa alla quarta, non alla prima',
    (unAltraStoria(CAPITOLI, g, { eta: 10 }, 'quinta', 'chi-ha-mangiato-la-torta') || {}).mondo, 'quarta')

  // il medaglione chiuso dice quale tappa vincere
  const s = cosaServeAlLibro(CAPITOLI, 'prima')
  uguale('il libro chiuso dice cosa serve', s, `Si apre quando vinci «${tappaDi(meta.dopo).nome}»`)
  const stato = statoMappa(nuovo(), () => 0)
  const nodo = { tipo: 'libro', id: 'prima', mondo: 'prima' }
  uguale('e il cartiglio lo ripete', cosaServe(stato, nodo, { libro: { serve: s } }), s)
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

riassunto('Il libro dell’inglese a mondi')
