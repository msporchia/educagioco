/* ═══════════════════════════════════════════════════════════════════
   L'INGLESE A MONDI — il motore e i dati, senza browser.
   `node test/esegui.mjs inglese-mondi`

   Un test solo per tutto, anche per quello che nascerà: le frasi si
   leggono da src/giochi/inglese/dati/frasi/ e i capitoli dalla loro
   cartella, e a ognuno si chiede la stessa cosa — una sola risposta
   giusta per domanda, ogni ramo raggiungibile, nessuna trappola uguale
   alla giusta o a una variante, ogni parola nota nel suo mondo, ogni
   perché sotto i 70 caratteri (src/giochi/inglese/motore/guasti.js).
   Il progetto è in docs/lingue/mondi.md.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { WORDS } from '../../src/data/words.js'
import { newItem, record, strength, MAX_S } from '../../src/store/srs.js'
import { MONDI, TAPPE, tappaDi, guastiDeiMondi, CATEGORIE_DI_STRUTTURA } from '../../src/giochi/inglese/dati/mondi.js'
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
import { segnaVinta, tappaAperta, mondoAperto, cassettoAperto, statoMappa } from '../../src/giochi/inglese/motore/mappa.js'
import { Sessione } from '../../src/giochi/inglese/motore/sessione.js'
import { racconta, mondiDi, NON_SI_SA } from '../../src/giochi/inglese/motore/libro.js'
import { guastiDelleFrasi, guastiDelCapitolo, sorte, ordineGiusto } from '../../src/giochi/inglese/motore/guasti.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/giochi/inglese/dati')
const nessuno = (cosa, guasti) => controlla(cosa, guasti.length === 0, guasti.slice(0, 12).join(' · '))
const titolo = t => console.log('\n' + t)
const GIORNO = 86400000

/* ═══════════ 1. i dati stanno in piedi ═══════════ */
titolo('DATI')
nessuno('il grafo dei mondi', guastiDeiMondi())
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
  const domanda = en => /^(is|are|am|have|has|can|do|does)\b/i.test(en)
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
  const matita = d.opzioni.find(o => o.testo === 'this is a pencil')
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
  for (const m of MONDI.filter(x => x.tappe.length))
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
  const t1 = tappaDi('che-cose-1')
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
  // si riprende dalle più deboli, le parole prima delle frasi
  const r = ripresa(t1, k => (k === 'en:cow' ? 3 : k === 'frase:m-dog' ? 1 : 1))
  controlla('prima le più deboli, a pari forza le parole', r.voci[0].genere === 'parola' && r.voci[r.voci.length - 1].chiave === 'en:cow')
  controlla('ogni voce ha il formato della sua forza',
    r.voci.find(v => v.chiave === 'frase:m-dog').formato === 'senso')
}

/* ═══════════ 7. la mappa ═══════════ */
titolo('MAPPA')
{
  const c = { tappa: 0, libera: false, stelle: {}, cfg: {} }
  controlla('all’inizio si apre solo la prima tappa', tappaAperta(c, 'che-cose-1') && !tappaAperta(c, 'che-cose-2'))
  controlla('il secondo mondo è chiuso', !mondoAperto(c, 'mie-cose'))
  controlla('il cassetto è chiuso', !cassettoAperto(c, 'che-cose'))
  uguale('la prima vittoria è la prima', segnaVinta(c, 'che-cose-1', 1), true)
  uguale('la seconda no', segnaVinta(c, 'che-cose-1', 2), false)
  controlla('vinta una tappa, si apre la dopo e il cassetto', tappaAperta(c, 'che-cose-2') && cassettoAperto(c, 'che-cose'))
  for (const t of MONDI[0].tappe) segnaVinta(c, t.id)
  controlla('finito il primo mondo, si apre il secondo', mondoAperto(c, 'mie-cose') && tappaAperta(c, 'mie-cose-1'))
  controlla('un mondo senza tappe resta chiuso', !mondoAperto(c, 'dove'))
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
  // cinque giorni di fila sulla prima tappa, sempre giusto
  for (let giorno = 0; giorno < 5; giorno++) {
    const s = new Sessione({ tappa: tappaDi('che-cose-1'), itemDi, ora, rnd: sorte(giorno + 1) })
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
  const g = gradoTappa(tappaDi('che-cose-1'), k => strength(itemDi(k), adesso))
  controlla('dopo cinque giorni la tappa è salita', g >= 6, `grado ${g}`)
  controlla('i formati salgono con la forza', formati.has('riconosci') && (formati.has('completa') || formati.has('monta')),
            [...formati].join(', '))
  // una domanda con un tocco a pagamento non paga, anche giusta
  const s = new Sessione({ tappa: tappaDi('che-cose-2'), itemDi, ora, rnd: sorte(9) })
  const d = s.prossima()
  const t = new Tocchi({ itemDi, ora })
  for (let i = 0; i < 5; i++) t.tocca('pig')
  itemDi('en:pig').tocchi = TOCCHI_GRATIS
  const t2 = new Tocchi({ itemDi, ora })
  t2.tocca('pig')
  const es = s.rispondi(d, d.opzioni ? d.opzioni.find(o => o.giusta) : ordineGiusto(d), { tocchi: t2 })
  controlla('giusta ma con un tocco a pagamento: non paga', es.giusta && !es.paga)
  // la 🏁 ripassa tutto il mondo
  const b = new Sessione({ tappa: tappaDi('che-cose-bandiera'), itemDi, ora, rnd: sorte(4) })
  controlla('la bandiera pesca da tutto il mondo', b.pool.some(k => k === 'frase:e-cat-1') && b.pool.some(k => k === 'en:dog'))
  // il cassetto gioca con le parole di oggi
  const cass = new Sessione({ tappa: cassettoDi('che-cose'), itemDi, ora, rnd: sorte(5) })
  const dc = cass.prossima()
  controlla('il cassetto fa domande sulle parole', dc && dc.genere === 'parola')
  nota(`${partite} partite giocate, formati visti: ${[...formati].join(', ')}`)
}

/* ═══════════ 10. le parole note ═══════════ */
titolo('PAROLE NOTE')
{
  const note = paroleNote('mie-cose', 'mie-cose-1')
  controlla('al secondo mondo si sanno le parole del primo', note.has('dog') && note.has('red') && note.has('apple'))
  controlla('ma non quelle delle tappe dopo', !note.has('hat'))
  controlla('le categorie di struttura non hanno cassetto', CATEGORIE_DI_STRUTTURA.includes('q'))
}

riassunto('inglese a mondi')
