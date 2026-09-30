/* ═══════════════════════════════════════════════════════════════════
   IL LIBRO DELL'INGLESE A MONDI — le storie, senza browser.
   `node test/esegui.mjs inglese-libro`

   Tre storie per mondo che crescono coi mondi, almeno una a metà isola;
   le pagine; quale storia apre il libro e quale «Un'altra storia»; le
   storie lette nel profilo; le forme dei verbi (plays, playing, played,
   went) accettate solo dove una struttura del mondo le ammette; la paga
   di una domanda; chi parla, a battute; le parole della storia (le nuove
   e i cassetti); le domande «chi», «frase» e «ordine»; le storie a
   puntate, che tengono le variabili. Che ogni capitolo stia in piedi lo
   controlla unita/inglese-mondi. Il progetto è in docs/lingue/libro.md.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDI, mondoDi, tappaDi } from '../../src/giochi/inglese/dati/mondi.js'
import { CHI_PARLA, CHI_DI_CASA } from '../../src/giochi/inglese/dati/elenchi.js'
import { pagaDelCapitolo, PAGA_CAPITOLO } from '../../src/giochi/inglese/dati/monete.js'
import { flessa, flessione } from '../../src/giochi/inglese/motore/flessioni.js'
import { sconosciute, paroleDelLibro, formeDelLibro, flessioniDi, paroleNote } from '../../src/giochi/inglese/motore/grafo.js'
import { traduci, chiaveDi } from '../../src/giochi/inglese/motore/lessico.js'
import { racconta, mondiDi, pagineDi, tappaDellaStoria, blocchiDi, domandaIn, eGiusta, paroleDellaStoriaIn,
         paroleDeiCassetti, tiraConFissi, chiaveDelValore, PAROLE_DELLA_STORIA_MAX }
  from '../../src/giochi/inglese/motore/libro.js'
import { guastiDelCapitolo, guastiDelleSerie, sorte } from '../../src/giochi/inglese/motore/guasti.js'
import { segnaVinta, cosaServe, statoMappa } from '../../src/giochi/inglese/motore/mappa.js'
import { storieAperte, storiaAperta, prossimaStoria, unAltraStoria, segnaLetta, lette, inOrdine, cosaServeAlLibro,
         tiraLaStoria, segnaPuntata, puntataDopo, serieDi }
  from '../../src/giochi/inglese/motore/storie.js'
import * as F from '../../src/giochi/inglese/motore/fila.js'

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
  // (tranne le puntate dopo la prima: una serie si legge in fila, sempre)
  uguale('sblocca tutti apre le storie', storieAperte(CAPITOLI, nuovo(), { tutto: true }, 'quinta').length,
    CAPITOLI.filter(x => x.mondo === 'quinta' && !(x.puntata > 1)).length)
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

/* ═══════════ 6. le parole della storia ═══════════ */
titolo('LE PAROLE DELLA STORIA')
{
  const occhiali = capDi('gli-occhiali-della-maestra')
  const r = racconta(occhiali, mondiDi(occhiali)[0], sorte(1))
  controlla('una nuova è parola della storia', r.storia.includes('suddenly'), r.storia.join(' '))
  controlla('anche una del cassetto (glasses, seconda)', r.storia.includes('glasses'))
  controlla('e una forma flessa della sua base (opens)', r.storia.includes('opens'))
  controlla('una parola nota alla tappa no', !r.storia.includes('teacher') && !r.storia.includes('the'))
  const m = paroleDellaStoriaIn('Suddenly she opens the box.', occhiali)
  stessaLista('a schermo e la sua base', [...m.entries()].map(([a, b]) => `${a}→${b}`), ['suddenly→suddenly', 'opens→open'])
  controlla('i cassetti sono del mondo e di quelli prima', paroleDeiCassetti('quarta').has('glasses') &&
            paroleDeiCassetti('quarta').has('fox') && !paroleDeiCassetti('quarta').has('tent'))

  const base = { id: 'prova', mondo: 'quarta', titolo: 'Prova', variabili: {},
                 domande: [{ testo: 'Chi è?', risposta: () => 'Leo', anche: ['Tom', 'Pip'] }] }
  const g = cap => guastiDelCapitolo({ ...base, ...cap }).join(' · ')
  uguale('una parola del cassetto passa da sola', g({ frasi: [{ en: 'Leo has got glasses.', forma: 'has-got' }] }), '')
  controlla('una del cassetto di un mondo dopo no', /tent/.test(g({ frasi: [{ en: 'Leo has got a tent.' }] })))
  uguale('una nuova passa', g({ nuove: ['suddenly'], frasi: [{ en: 'Suddenly Leo runs.', forma: 'terza-s' }] }), '')
  controlla('una parola di una tappa dopo, senza nuove, no', /school/.test(g({ frasi: [{ en: 'Leo runs to school.' }] })))
  controlla('una nuova già nota è un guasto', /già nota/.test(g({ nuove: ['teacher'], frasi: [{ en: 'Leo is a teacher.' }] })))
  controlla('una nuova fuori da words.js è un guasto', /categoria di un mondo/.test(g({ nuove: ['zorp'], frasi: [{ en: 'Leo runs.' }] })))
  controlla('anche una di struttura, che un cassetto non ha', /categoria di un mondo/.test(g({ nuove: ['why'], frasi: [{ en: 'Why?' }] })))
  controlla('una nuova che non si usa è un guasto', /non si usa mai/.test(g({ nuove: ['suddenly'], frasi: [{ en: 'Leo runs.' }] })))
  const nove = 'Leo has got a fox, a bear, a lion, a tiger, a frog, a monkey, a snake, a bee and a crab.'
  controlla(`più di ${PAROLE_DELLA_STORIA_MAX} parole della storia è un guasto`, /al massimo 8/.test(g({ frasi: [{ en: nove }] })))
  // «said» è il passato di say: si usa in quinta, dove c'è il passato, e non in quarta
  const quinta = { ...base, mondo: 'quinta', nuove: ['say'], frasi: [{ en: 'Leo said hello.', forma: 'passato' }] }
  uguale('«said» in quinta, con say fra le nuove', guastiDelCapitolo(quinta).join(' · '), '')
  controlla('in quarta il passato non c’è', /said/.test(g({ nuove: ['say'], frasi: [{ en: 'Leo said hello.' }] })))
  // le nuove stanno in un cassetto: lo SRS le ripassa lì
  controlla('toccata, una nuova dice cosa vuol dire', /improvviso/.test(traduci('suddenly').it))
  uguale('e ha la sua chiave SRS', traduci('suddenly').chiave, 'en:suddenly')
  // ogni storia nuova le usa, e al massimo otto (lo controlla guastiDelCapitolo su ognuna)
  for (const c of CAPITOLI.filter(x => x.nuove))
    nota(`${c.id}: nuove ${c.nuove.join(', ')}`)
}

/* ═══════════ 7. le domande nuove ═══════════ */
titolo('CHI L’HA DETTO, LA FRASE, L’ORDINE')
{
  const occhiali = capDi('gli-occhiali-della-maestra')
  const v = mondiDi(occhiali).find(x => x.trova === 'Tom')
  const r = racconta(occhiali, v, sorte(3))
  const chi = r.domande.find(d => d.tipo === 'chi')
  uguale('«chi»: la battuta fra le virgolette', chi.citazione, 'Look! Your glasses are on your head!')
  uguale('la giusta è chi la dice nel mondo tirato', chi.giusta, 'Tom')
  controlla('le sbagliate sono gli altri che parlano nella storia',
    chi.opzioni.filter(o => !o.giusta).every(o => ['La maestra', 'Leo', 'La mamma'].includes(o.testo)),
    chi.opzioni.map(o => o.testo).join(', '))
  const iGiusta = chi.opzioni.findIndex(o => o.giusta)
  controlla('si risponde con l’opzione', eGiusta(chi, iGiusta) && !eGiusta(chi, (iGiusta + 1) % chi.opzioni.length))
  // in una storia dove parlano in due, le altre dalla gente di casa
  const due = { id: 'due', mondo: 'prima', titolo: 'Due', variabili: {},
                frasi: [{ id: 'ciao', chi: 'Tom', en: 'Hello!' }, { chi: 'Leo', en: 'Hello, Tom!' }],
                domande: [{ tipo: 'chi', frase: 'ciao' }] }
  const d2 = racconta(due, {}, sorte(1)).domande[0]
  controlla('pochi che parlano: si pesca dalla gente di casa', d2.opzioni.length === 4 &&
    d2.opzioni.every(o => o.testo === 'Tom' || CHI_DI_CASA.map(k => CHI_PARLA[k]).includes(o.testo)))

  const frase = r.domande.find(d => d.tipo === 'frase')
  uguale('«frase»: la giusta è una riga del racconto', r.righe[frase.giusta].id, 'perche')
  controlla('si risponde toccandola', eGiusta(frase, frase.giusta) && !eGiusta(frase, frase.giusta + 1))
  uguale('e sa in che pagina sta', frase.pagina, r.righe[frase.giusta].pagina)

  const ordine = r.domande.find(d => d.tipo === 'ordine')
  uguale('«ordine»: i fatti nell’ordine scritto', ordine.soluzione[2], 'Tom ride')
  for (let s = 1; s <= 30; s++) {
    const o = racconta(occhiali, v, sorte(s)).domande.find(d => d.tipo === 'ordine')
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
  const frasi = [{ id: 'a', chi: 'Tom', en: 'Hello!' }, { id: 'b', se: v => v.x, en: 'It is a dog.' },
                 { id: 'c', en: 'It is a cat.' }, { chi: 'Leo', en: 'Hello, Tom!' }]
  const g = domande => guastiDelCapitolo({ ...base, frasi, domande }).join(' · ')
  uguale('una «frase» e una «chi» giuste passano', g([{ tipo: 'frase', testo: 'Che cos’è?', frase: 'c' },
                                                    { tipo: 'chi', frase: 'a' }]), '')
  controlla('rimando a una frase che non c’è', /non c'è \(z\)/.test(g([{ tipo: 'frase', testo: 'Dove?', frase: 'z' }])))
  controlla('rimando a una frase che non si accende', /non si accende/.test(g([{ tipo: 'frase', testo: 'Dove?', frase: 'b' }])))
  controlla('«chi» su una frase del narratore', /non è una battuta/.test(g([{ tipo: 'chi', frase: 'c' }])))
  controlla('«frase» senza domanda', /serve il testo/.test(g([{ tipo: 'frase', frase: 'c' }])))
  controlla('«ordine» con due fatti', /ne vanno 3 o 4/.test(g([{ tipo: 'ordine', fatti: ['Uno', 'Due'] }])))
  controlla('«ordine» con due fatti uguali', /due fatti uguali/.test(g([{ tipo: 'ordine', fatti: ['Uno', 'Due', 'Uno'] }])))
  controlla('due frasi con lo stesso id', /due frasi con l'id/.test(guastiDelCapitolo({ ...base,
    frasi: [...frasi, { id: 'c', en: 'It is a dog.' }], domande: [{ tipo: 'chi', frase: 'a' }] }).join(' ')))
  controlla('un tipo sconosciuto', /tipo sconosciuto/.test(g([{ tipo: 'boh', testo: 'Boh?' }])))

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
  const [p1, p2, p3] = [1, 2, 3].map(n => CAPITOLI.find(x => x.serie === 'la-vecchia-mappa' && x.puntata === n))
  uguale('le serie stanno in piedi', guastiDelleSerie(CAPITOLI).join(' · '), '')
  stessaLista('in ordine, una puntata dopo l’altra', inOrdine(CAPITOLI).filter(x => x.serie).map(x => x.puntata), [1, 2, 3])
  // si aprono in fila, anche a chi ha tutto aperto
  const c = nuovo()
  for (const m of ['prima', 'seconda', 'terza', 'quarta', 'quinta']) vinciMondo(c, m)
  controlla('la prima si apre con la sua tappa', storiaAperta(c, p1, {}, CAPITOLI))
  controlla('la seconda no, finché la prima non è letta', !storiaAperta(c, p2, {}, CAPITOLI))
  controlla('nemmeno con «Sblocca tutti»', !storiaAperta(nuovo(), p2, { tutto: true }, CAPITOLI))
  // la prima tira le variabili e le salva accanto alle lette
  const v1 = tiraLaStoria(c, p1, sorte(5))
  const salvate = { ...serieDi(c)['la-vecchia-mappa'].valori }
  uguale('salvate per chiave', salvate.nonno, v1.nonno.id)
  uguale('anche quelle da un elenco', salvate.mezzo, v1.mezzo.en)
  segnaLetta(c, p1.id, 10); segnaPuntata(c, p1)
  uguale('letta, la serie sa fin dove si è arrivati', serieDi(c)['la-vecchia-mappa'].fatte, 1)
  uguale('il cartello offre la puntata dopo', (puntataDopo(CAPITOLI, c, {}, p1) || {}).id, p2.id)
  controlla('e «Un’altra storia» non è un’altra puntata', (unAltraStoria(CAPITOLI, c, {}, 'quinta', p1.id) || {}).serie !== 'la-vecchia-mappa')
  // la seconda tiene il nonno e il mezzo, e tira il posto del tesoro
  for (let s = 1; s <= 12; s++) {
    const v2 = tiraLaStoria(c, p2, sorte(s))
    if (v2.nonno.id !== v1.nonno.id || v2.mezzo.en !== v1.mezzo.en) {
      controlla('la puntata 2 ha le stesse variabili', false, `${v2.nonno.id} ${v2.mezzo.en}`); break
    }
  }
  const dove = serieDi(c)['la-vecchia-mappa'].valori.dove
  controlla('il posto del tesoro si tira alla puntata 2 e si salva', ['church', 'castle', 'farm'].includes(dove))
  segnaLetta(c, p2.id, 20); segnaPuntata(c, p2)
  const v3 = tiraLaStoria(c, p3, sorte(9))
  uguale('la puntata 3 trova il tesoro dove diceva la 2', v3.dove.en, dove)
  uguale('con lo stesso nonno', v3.nonno.id, v1.nonno.id)
  // rileggerla da capo è un'altra avventura: la prima ritira tutto
  const prima = serieDi(c)['la-vecchia-mappa']
  tiraLaStoria(c, p1, sorte(77))
  controlla('la prima puntata riletta ricomincia la serie', serieDi(c)['la-vecchia-mappa'] !== prima &&
            serieDi(c)['la-vecchia-mappa'].fatte === 0 && !('dove' in serieDi(c)['la-vecchia-mappa'].valori))
  // un profilo storto non rompe niente
  const storto = { ...nuovo(), serie: 'boh' }
  controlla('una serie storta nel profilo si rifà', tiraLaStoria(storto, p2, sorte(1)).nonno && serieDi(storto)['la-vecchia-mappa'])
  // tiraConFissi: i valori già tirati, se ci sono; se no un mondo qualunque
  uguale('fissi rispettati', chiaveDelValore(tiraConFissi(p2, { nonno: 'nonna' }, sorte(2)).nonno), 'nonna')
  controlla('fissi impossibili: un mondo qualunque', !!tiraConFissi(p2, { nonno: 'zio' }, sorte(2)))

  // «Nella puntata prima…»: un blocco a sé, in testa alle puntate dopo la prima
  const r2 = racconta(p2, mondiDi(p2)[0], sorte(1))
  controlla('la puntata 2 comincia col riassunto', r2.blocchi[0][0].riassunto && r2.blocchi[0].length > 1)
  const b = blocchiDi([{ en: 'Last time…', chi: null, riassunto: true }, { en: 'On Sunday…', chi: null }])
  uguale('il riassunto non si attacca alla narrazione', b.length, 2)
  // i guasti delle serie
  const pezzo = (n, altro = {}) => ({ id: `s${n}`, serie: 's', puntata: n, mondo: 'prima', titolo: 'S',
    variabili: { x: { fra: [1, 2] } }, domande: [{ testo: 'Chi è?', risposta: () => 'Leo', anche: ['Tom', 'Pip'] }],
    frasi: [...(n > 1 ? [{ riassunto: true, en: 'It is a cat.' }] : []), { en: 'Hello, Leo!' }], ...altro })
  uguale('una serie giusta passa', guastiDelleSerie([pezzo(1), pezzo(2)]).join(' · '), '')
  controlla('una puntata sola', /una puntata sola/.test(guastiDelleSerie([pezzo(1)]).join(' ')))
  controlla('puntate che saltano', /1, 2, 3/.test(guastiDelleSerie([pezzo(1), pezzo(3)]).join(' ')))
  controlla('una variabile che nella puntata dopo non ha lo stesso valore', /non ha «1»/.test(guastiDelleSerie([
    pezzo(1), pezzo(2, { variabili: { x: { fra: [2, 3] } } })]).join(' ')))
  controlla('una puntata dopo la prima senza riassunto',
    /comincia con «Nella puntata prima/.test(guastiDelCapitolo(pezzo(2, { frasi: [{ en: 'Hello, Leo!' }] })).join(' ')))
  controlla('un riassunto nella prima puntata', /sta solo in testa/.test(guastiDelCapitolo(pezzo(1, {
    frasi: [{ riassunto: true, en: 'It is a cat.' }, { en: 'Hello, Leo!' }] })).join(' ')))
}

riassunto('Il libro dell’inglese a mondi')
