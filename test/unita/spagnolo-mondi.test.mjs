/* ═══════════════════════════════════════════════════════════════════
   LO SPAGNOLO A MONDI — il motore e i dati, senza browser.
   `node test/esegui.mjs spagnolo-mondi --niente-build`

   Il gemello di unita/inglese-mondi. Un test solo per tutto, anche per
   quello che nascerà: le frasi si leggono da src/giochi/spagnolo/dati/frasi/
   e i capitoli dalla loro cartella, e a ognuno si chiede la stessa cosa —
   una sola risposta giusta per domanda, ogni ramo raggiungibile, nessuna
   trappola uguale alla giusta o a una variante, ogni parola nota nel suo
   mondo, ogni perché sotto i 70 caratteri (motore/guasti.js). E i difetti
   resi impossibili in generale: una tappa di parole ha solo parole del suo
   argomento e le risposte sbagliate vengono da lì; una frase usa solo parole
   note e la struttura della sua tappa; nessuna trappola sgrammaticata per
   caso (una perro, la agua); le frasi ripescate solo dove si ripassano le
   frasi; i verbi flessi solo dalla tappa della loro struttura, e la tessera
   di troppo che contende un buco (juegas accanto a juego).
   Cartelle vuote (nessun capitolo ancora): i controlli sui capitoli passano
   a vuoto. Il progetto è in docs/lingue/spagnolo.md e spagnolo-motore.md.
   La lingua del motore (verbi, generi, concordanza) la prova spagnolo-lingua.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { PAROLE_ES } from '../../src/data/parole-es.js'
import { newItem, record, strength, MAX_S } from '../../src/store/srs.js'
import { MONDI, TAPPE, tappaDi, mondoDi, guastiDeiMondi, CATEGORIE_DI_STRUTTURA, inizioDellAnno }
  from '../../src/giochi/spagnolo/dati/mondi.js'
import { guastiDegliArgomenti, paroleDellArgomento } from '../../src/giochi/spagnolo/dati/argomenti.js'
import { travasa, travasate, quanteVinte } from '../../src/giochi/spagnolo/motore/travaso.js'
import { sgrammaticata, APPOSTA } from '../../src/giochi/spagnolo/motore/grammatica.js'
import { TAPPE_DEL_GIOCO } from '../../src/data/portata-giochi.js'
import { giocoDaOffrire } from '../../src/data/portata.js'
import manifesto from '../../src/giochi/spagnolo/gioco.js'
import { guastiDelleForme, FORME } from '../../src/giochi/spagnolo/dati/forme.js'
import { guastiDegliElenchi } from '../../src/giochi/spagnolo/dati/elenchi.js'
import { TRAPPOLE, GEMELLE } from '../../src/giochi/spagnolo/dati/trappole.js'
import { FRASI, FILE_DELLE_FRASI, fraseDi } from '../../src/giochi/spagnolo/dati/frasi.js'
import { accetta, normalizza, inBella, aSchermo, eDomanda } from '../../src/giochi/spagnolo/motore/testo.js'
import { applica, OPERAZIONI, trappoleDi } from '../../src/giochi/spagnolo/motore/trappole.js'
import { doveSta, cassettoDi, vociDi, frasiDi, paroleNote, flessioniNote, sconosciute }
  from '../../src/giochi/spagnolo/motore/grafo.js'
import { traduci, chiaveDi } from '../../src/giochi/spagnolo/motore/lessico.js'
import { flessione, flessa } from '../../src/giochi/spagnolo/motore/flessioni.js'
import { formatoPerForza, tessereInPiu, costruisci, giudica, contesto, composta, FORMATI_FRASE }
  from '../../src/giochi/spagnolo/motore/formati.js'
import { grado, gradoTappa, ripresa } from '../../src/giochi/spagnolo/motore/grado.js'
import { Tocchi, TOCCHI_GRATIS, domandeCheLPagano, domandaDelTocco } from '../../src/giochi/spagnolo/motore/tocchi.js'
import { segnaVinta, tappaAperta, mondoAperto, cassettoAperto, statoMappa }
  from '../../src/giochi/spagnolo/motore/mappa.js'
import { Sessione } from '../../src/giochi/spagnolo/motore/sessione.js'
import { racconta, mondiDi, NON_SI_SA } from '../../src/giochi/spagnolo/motore/libro.js'
import { guastiDelleFrasi, guastiDelCapitolo, guastiDelleParole, sorte, ordineGiusto }
  from '../../src/giochi/spagnolo/motore/guasti.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/giochi/spagnolo/dati')
const nessuno = (cosa, guasti) => controlla(cosa, guasti.length === 0, guasti.slice(0, 12).join(' · '))
const titolo = t => console.log('\n' + t)
const GIORNO = 86400000

// Una frase scritta qui, per i controlli che vogliono un caso preciso senza
// aspettare i dati veri (che li scrivono altri e cambiano).
const P = (tappa, forma, it, es, altro = {}) =>
  ({ id: 'prova-' + es.replace(/\s+/g, '-'), tappa, forma, it, es, mondo: tappaDi(tappa).mondo, ...altro })
const ctxDi = (f, seme, altre = []) =>
  contesto(f, { tappa: tappaDi(f.tappa), altre, rnd: sorte(seme) })
// una tappa di frasi senza frasi dice «contenuto mancante» una volta sola
const conFrasi = id => {
  const n = FRASI.filter(f => f.tappa === id).length
  controlla(`la tappa ${id} ha frasi (contenuto)`, n > 0, 'dati/frasi/ è vuoto per questa tappa')
  return n > 0
}

/* ═══════════ 1. i dati stanno in piedi ═══════════ */
titolo('DATI')
nessuno('il grafo dei mondi', guastiDeiMondi())
nessuno('gli argomenti', guastiDegliArgomenti())
nessuno('le forme', guastiDelleForme())
nessuno('gli elenchi del libro', guastiDegliElenchi(new Set(PAROLE_ES.map(w => w[0]))))
{
  const file = readdirSync(resolve(CARTELLA, 'frasi')).filter(f => f.endsWith('.js'))
  const presi = []
  for (const f of file) presi.push((await import(pathToFileURL(resolve(CARTELLA, 'frasi', f)))).default)
  for (const [i, p] of presi.entries())
    controlla(`dati/frasi/${file[i]} è in dati/frasi.js`, FILE_DELLE_FRASI.includes(p))
  for (const p of FILE_DELLE_FRASI) controlla(`il file di «${p.mondo}» dice un mondo che c'è`, !!mondoDi(p.mondo))
  // nessuna parola resta fuori: sta in una tappa, in un cassetto o arriva con le forme
  const fuori = PAROLE_ES.filter(w => !doveSta(w[0])).map(w => w[0])
  nessuno('ogni parola di parole-es.js ha un posto', fuori)
  const inCassetto = MONDI.filter(m => m.tappe.length).flatMap(m => cassettoDi(m.id).chiavi)
  controlla('i cassetti dei mondi pronti non sono vuoti', inCassetto.length > 20)
  controlla('i verbi hanno un cassetto', MONDI.some(m => m.verbi && cassettoDi(m.id).chiavi.some(k => k.startsWith('verbo-es:'))))
  nota(`${MONDI.length} mondi · ${TAPPE.length} tappe · ${FRASI.length} frasi · ${inCassetto.length} voci nei cassetti pronti`)
}

/* ═══════════ 2. il testo: gli accenti contano, niente forme contratte ═══════════ */
titolo('TESTO')
{
  controlla('la risposta giusta vale con la maiuscola e il punto', accetta('Es un perro.', { es: 'es un perro' }))
  controlla('con ¿ e ? alla domanda', accetta('¿Qué es?', { es: 'qué es' }))
  controlla('gli accenti contano: él ≠ el', !accetta('el es alto', { es: 'él es alto' }) && accetta('él es alto', { es: 'él es alto' }))
  controlla('qué ≠ que, tú ≠ tu', !accetta('que es', { es: 'qué es' }) && !accetta('tu eres alto', { es: 'tú eres alto' }))
  controlla('al e del sono una parola sola: «a el» non vale', !accetta('voy a el parque', { es: 'voy al parque' }))
  controlla('una variante vale', accetta('tengo hambre', { es: 'tengo mucha hambre', varianti: ['tengo hambre'] }))
  controlla('un’altra frase no', !accetta('es un gato', { es: 'es un perro' }))
  uguale('la normalizzazione tiene gli accenti', normalizza('¡Está AQUÍ!'), 'está aquí')
  uguale('la fila mette maiuscola e ¿ ?', inBella(['dónde', 'está', 'el', 'gato'], { domanda: true }), '¿Dónde está el gato?')
  uguale('l’affermazione a schermo mette il punto', aSchermo('es un perro', false, 'es'), 'Es un perro.')
  uguale('a schermo in spagnolo', aSchermo('cómo estás', true, 'es'), '¿Cómo estás?')
  controlla('la domanda la dice l’italiano', eDomanda({ it: 'come stai?' }) && !eDomanda({ it: 'sto bene' }))
}

/* ═══════════ 3. la tabella delle trappole ═══════════ */
titolo('TRAPPOLE')
{
  const ids = new Set()
  for (const r of TRAPPOLE) {
    controlla(`trappola ${r.id}: id unico`, !ids.has(r.id)); ids.add(r.id)
    controlla(`trappola ${r.id}: operazione nota`, !!OPERAZIONI[r.fa])
    controlla(`trappola ${r.id}: forma nota`, r.forma === null || !!FORME[r.forma])
    for (const f of r.soloForme || []) controlla(`trappola ${r.id}: soloForme ${f} esiste`, !!FORME[f])
    const [giusta, sbagliata] = r.esempio
    const fuori = applica(r, { es: giusta, forma: null }, { domanda: /^¿/.test(giusta), vicine: () => ['gato', 'perro'] })
    const t = fuori.find(x => normalizza(x.es) === normalizza(sbagliata))
    controlla(`trappola ${r.id}: dal suo esempio esce «${sbagliata}»`, !!t, fuori.map(x => x.es).join(' | '))
    if (t) controlla(`trappola ${r.id}: perché sotto i 70`, t.perche.length <= 70 && !/[{}]/.test(t.perche), t.perche)
    // la sgrammaticata per caso è un guasto; per scelta sta in APPOSTA
    if (t && !APPOSTA.has(r.id))
      controlla(`trappola ${r.id}: non sbaglia la concordanza per caso`, !sgrammaticata(sbagliata), sgrammaticata(sbagliata))
  }
  for (const id of APPOSTA) controlla(`APPOSTA nomina una riga che c’è (${id})`, ids.has(id))
  controlla('le gemelle sono parole diverse', GEMELLE.every(g => g.length >= 2 && new Set(g).size === g.length))
}

/* ═══════════ 4. ogni frase, in ogni formato ═══════════ */
titolo('FRASI')
nessuno('tutte le frasi componibili', guastiDelleFrasi())
{
  controlla('ci sono frasi (contenuto)', FRASI.length > 0, 'dati/frasi/ è vuoto')
  const idsViste = new Set()
  for (const f of FRASI) {
    controlla(`${f.id}: id unico`, !idsViste.has(f.id)); idsViste.add(f.id)
    // la trappola mai uguale alla giusta o a una variante, mai senza perché
    for (const t of trappoleDi(f, ctxDi(f, 1, FRASI.filter(x => x.tappa === f.tappa)))) {
      controlla(`${f.id}: la trappola ${t.id} non è la giusta`, !accetta(t.es, f), t.es)
      controlla(`${f.id}: la trappola ${t.id} ha un perché corto`, !!t.perche && t.perche.length <= 70, t.perche)
    }
  }
  uguale('forza 0 → riconosci', formatoPerForza(0), 'riconosci')
  uguale('forza 2 → scegli', formatoPerForza(2), 'scegli')
  uguale('forza 3 → completa', formatoPerForza(3), 'completa')
  uguale('forza 6 → scegli e monta', formatoPerForza(6), 'scegliMonta')
  uguale('due tessere di troppo a 5', tessereInPiu(5, 0), 2)
  uguale('tre a 6', tessereInPiu(6, 3), 3)
  uguale('quattro a 6 con la forma al massimo', tessereInPiu(6, MAX_S), 4)
  {
    // fra le tessere di troppo c'è una gemella di grammatica (soy → eres, es)
    const f = P('seconda-soy', 'ser', 'io sono alta', 'yo soy alta')
    const d = costruisci(f, 'scegliMonta', ctxDi(f, 2), { forza: 6 })
    const inPiu = d.tessere.filter(t => t.id >= d.soluzione.length).map(t => t.testo.toLowerCase())
    const gemelle = new Set(GEMELLE.find(g => g[0] === 'soy'))
    controlla('fra le tessere di troppo c’è una gemella di grammatica (soy → eres, es)',
              inPiu.some(w => gemelle.has(w)), inPiu.join(', '))
  }

  // cosa segna uno sbaglio: la parola vicina sulla parola, la grammatica su frase e forma
  {
    const f = P('prima-animales', 'es-un', 'è un cane', 'es un perro', {
      trappole: [{ es: 'es un gato', it: 'è un gatto', perche: 'perro è il cane, gato è il gatto', parola: 'perro' }] })
    const ctx = ctxDi(f, 3)
    let parola = null, grammatica = null
    for (let s = 1; s <= 12 && !(parola && grammatica); s++) {
      const d = costruisci(f, 'scegli', ctxDi(f, s), { forza: 0 })
      parola = parola || { d, o: d.opzioni.find(o => !o.giusta && o.trappola && o.trappola.pesa === 'parola' && normalizza(o.testo) === 'es un gato') }
      grammatica = grammatica || { d, o: d.opzioni.find(o => !o.giusta && o.trappola && o.trappola.pesa === 'forma') }
      if (!parola.o) parola = null
      if (!grammatica.o) grammatica = null
    }
    if (parola) {
      const es = giudica(f, parola.d, parola.o, { ctx })
      uguale('la parola vicina pesa sulla parola', JSON.stringify(es.registra), JSON.stringify([{ chiave: 'es:perro', correct: false }]))
      controlla('e dice il suo perché', es.perche === 'perro è il cane, gato è il gatto', es.perche)
    } else controlla('la trappola a mano esce in «scegli»', false)
    if (grammatica) {
      const es = giudica(f, grammatica.d, grammatica.o, { ctx })
      controlla('la grammatica pesa su frase e forma',
        es.registra.some(r => r.chiave === 'frase-es:' + f.id && !r.correct) && es.registra.some(r => r.chiave.startsWith('forma-es:') && !r.correct))
      controlla('e porta il «Si fa così»', !!es.siFa)
    } else controlla('una trappola di grammatica esce in «scegli»', false)
    // una frase composta giusta ripassa solo le parole scadute
    const g = P('seconda-gusta', 'me-gusta', 'mi piace il pane', 'me gusta el pan')
    const cg = ctxDi(g, 3)
    const m = costruisci(g, 'monta', cg)
    const es = giudica(g, m, ordineGiusto(m), { ctx: cg, scadutaDi: k => k === 'es:pan' })
    controlla('giusta: frase, forma e le parole scadute',
      es.giusta && es.registra.some(r => r.chiave === 'es:pan' && r.correct) && !es.registra.some(r => r.chiave === 'es:leche'))
    // una fila composta come una trappola dice il perché di quella trappola
    const h = P('prima-es-un', 'es-un', 'è un cane', 'es un perro')
    const ch = ctxDi(h, 4)
    const mh = costruisci(h, 'monta', ch)
    const storta = trappoleDi(h, ch).find(t => {
      const a = t.es.split(' ').sort().join(), b = h.es.split(' ').sort().join()
      return a === b && normalizza(t.es) !== normalizza(h.es)
    })
    if (storta) {
      const ids = storta.es.split(' ').map(w => mh.tessere.find(t => t.testo === w).id)
      const e2 = giudica(h, mh, ids, { ctx: ch })
      controlla('una fila che è una trappola ne dice il perché', !e2.giusta && e2.trappola === storta.id && !!e2.perche, e2.perche)
    } else nota('nessuna trappola di sola riga storta su «es un perro»')
  }

  // ogni formato su ogni frase vera: una sola giusta, e la fila giusta torna
  const guasti = []
  for (const f of FRASI) for (let s = 1; s <= 2; s++) {
    const ctx = ctxDi(f, s * 17 + f.es.length, FRASI.filter(x => x.tappa === f.tappa))
    for (const formato of FORMATI_FRASE) {
      const d = costruisci(f, formato, ctx, { forza: 6 })
      if (d.opzioni) {
        const giuste = d.opzioni.filter(o => o.giusta)
        if (giuste.length !== 1) guasti.push(`${f.id} (${formato}): ${giuste.length} giuste`)
        else if (!giudica(f, d, giuste[0], { ctx }).giusta) guasti.push(`${f.id} (${formato}): la giusta non è giusta`)
        if (formato === 'scegli' && eDomanda(f) && !d.opzioni.every(o => /^¿.*\?$/.test(o.testo)))
          guasti.push(`${f.id} (scegli): le opzioni di una domanda vogliono tutte ¿…?`)
      } else {
        const ids = ordineGiusto(d)
        if (!ids || !accetta(composta(d, ids), f) || !giudica(f, d, ids, { ctx }).giusta)
          guasti.push(`${f.id} (${formato}): la fila giusta non torna`)
      }
    }
  }
  nessuno('una sola risposta giusta in ogni formato di ogni frase', guasti)
}

/* ═══════════ 5. il libro ═══════════ */
titolo('CAPITOLI')
{
  const dir = resolve(CARTELLA, 'capitoli')
  const file = readdirSync(dir).filter(f => f.endsWith('.js'))
  const capitoli = []
  for (const f of file) capitoli.push((await import(pathToFileURL(resolve(dir, f)))).default)
  const ids = new Set()
  for (const c of capitoli) {
    controlla(`capitolo ${c.id}: id unico`, !ids.has(c.id)); ids.add(c.id)
    // un capitolo che fa lanciare l'eccezione (una variabile che non c'è) è un guasto, non la fine del test
    let guasti
    try { guasti = guastiDelCapitolo(c) } catch (e) { guasti = [`capitolo ${c.id}: guastiDelCapitolo lancia «${e.message}»`] }
    nessuno(`capitolo ${c.id}`, guasti)
    nota(`${c.id}: ${mondiDi(c).length} varianti`)
  }
  if (!capitoli.length) nota('nessun capitolo ancora: i controlli sui capitoli passano a vuoto')
  // ogni mondo con le tappe ha il suo libro (quante storie e quanto lunghe: unita/spagnolo-libro)
  if (capitoli.length)
    for (const m of MONDI.filter(x => x.tappe.length))
      controlla(`il mondo ${m.id} ha un capitolo`, capitoli.some(c => c.mondo === m.id))

  // «Non si sa» è la giusta quando il testo non lo dice; le sbagliate sono le versioni non uscite
  const picnic = {
    id: 'prova-non-si-sa', mondo: 'prima', titolo: 'Prova', variabili: { cane: { fra: [true, false] } },
    frasi: [{ es: 'hola', chi: 'Tom' }, { se: v => v.cane, es: 'es un perro' }, { es: 'es un gato' }],
    domande: [{ testo: 'Laura ha un cane?', tipo: 'vf', etichette: ['Sì', 'No'],
                vero: v => (v.cane ? true : null) }],
  }
  const d = cane => racconta(picnic, { cane }, sorte(1)).domande[0]
  uguale('senza la frase del cane: non si sa', d(false).opzioni.find(o => o.giusta).testo, NON_SI_SA)
  uguale('con la frase del cane: sì', d(true).opzioni.find(o => o.giusta).testo, 'Sì')
  uguale('le sbagliate comprendono le versioni non uscite', d(true).opzioni.some(o => o.testo === NON_SI_SA), true)
}

/* ═══════════ 6. il grado, e da dove si riprende ═══════════ */
titolo('GRADO')
{
  const t1 = tappaDi('prima-animales')
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
  const b = tappaDi('prima-bandera')
  const r = ripresa(b, k => (k === 'es:vaca' ? 3 : 1))
  controlla('prima le più deboli, a pari forza le parole', r.voci[0].genere === 'parola' && r.voci[r.voci.length - 1].chiave === 'es:vaca')
  const f1 = FRASI.find(f => f.mondo === 'prima')
  if (f1)
    controlla('ogni voce ha il formato della sua forza',
      r.voci.find(v => v.chiave === 'frase-es:' + f1.id).formato === 'senso')
  else controlla('la 🏁 ha frasi da ripassare (contenuto)', false, 'nessuna frase del primo mondo')
  controlla('una tappa di parole non ha frasi', vociDi(t1).every(k => k.startsWith('es:')))
  controlla('una tappa di frasi non ha parole nuove',
    vociDi(tappaDi('prima-es-un')).every(k => /^(frase-es|forma-es):/.test(k)))
}

/* ═══════════ 7. la mappa ═══════════ */
titolo('MAPPA')
{
  const c = { tappa: 0, libera: false, stelle: {}, cfg: {} }
  controlla('all’inizio si apre solo la prima tappa', tappaAperta(c, 'prima-colores') && !tappaAperta(c, 'prima-animales'))
  controlla('il secondo mondo è chiuso', !mondoAperto(c, 'seconda'))
  controlla('il cassetto è chiuso', !cassettoAperto(c, 'prima'))
  uguale('la prima vittoria è la prima', segnaVinta(c, 'prima-colores', 1), true)
  uguale('la seconda no', segnaVinta(c, 'prima-colores', 2), false)
  controlla('vinta una tappa, si apre la dopo e il cassetto', tappaAperta(c, 'prima-animales') && cassettoAperto(c, 'prima'))
  for (const t of MONDI[0].tappe) segnaVinta(c, t.id)
  controlla('finito il primo mondo, si apre il secondo', mondoAperto(c, 'seconda') && tappaAperta(c, 'seconda-comida'))
  controlla('nessun mondo «in arrivo»: ognuno ha le sue tappe', MONDI.every(m => m.tappe.length > 0))
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
    controlla(`prima del tocco ${i + 1}: gratis, niente da chiedere`, !t.prova('perro').costa)
    const x = t.tocca('perro')
    controlla(`tocco ${i + 1} di una parola nuova: gratis`, x.gratis && t.paga && x.it === 'cane')
    uguale(`e conta come non saputa (${i + 1})`, JSON.stringify(t.correggi([{ chiave: 'es:perro', correct: true }])),
           JSON.stringify([{ chiave: 'es:perro', correct: false }]))
  }
  const t = new Tocchi({ itemDi, ora })
  // prima di un tocco che costa si chiede: provare non segna niente (perros è la stessa voce di perro)
  const p = t.prova('perros')
  controlla('il quarto costerebbe, e provarlo non costa', p.costa && p.volte === TOCCHI_GRATIS && t.paga && t.nonSapute.length === 0)
  const q = domandaDelTocco(p)
  controlla('la domanda dice quante volte, e che non darà monete',
            /3 volte/.test(q.perche) && /non ti darà monete/.test(q.costo) && q.perche.length + q.chiede.length < 90)
  controlla('nel libro è una domanda sola', /Una domanda del libro/.test(domandaDelTocco(p, { libro: true }).costo))
  controlla('il quarto costa: la domanda non paga', !t.tocca('perros').gratis && !t.paga)
  controlla('toccata una volta, ritoccarla non chiede più', !t.prova('perro').costa)
  const forte = itemDi('es:gato')
  for (let i = 0; i < 3; i++) record(forte, { correct: true, now: ora() })
  const t2 = new Tocchi({ itemDi, ora })
  controlla('una parola già nota si chiede subito', t2.prova('gato').costa && /la conosci già/.test(domandaDelTocco(t2.prova('gato')).perche))
  controlla('una parola già nota costa subito', !t2.tocca('gato').gratis)
  const t3 = new Tocchi({ itemDi, ora })
  controlla('le parole di struttura non si chiedono', !t3.prova('es').costa)
  controlla('le parole di struttura sono gratis e non contano', t3.tocca('es').gratis && t3.nonSapute.length === 0)
  controlla('un nome di persona è gratis e non conta', new Tocchi({ itemDi, ora }).tocca('Laura').gratis)
  controlla('la traduzione di al e del', /a \+ il/.test(traduci('al').it) && /di \+ il/.test(traduci('del').it))
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
  const serveLeFrasi = FRASI.filter(f => f.tappa === 'prima-es-un').length > 0
  controlla('«È un cane, è una mucca» ha frasi per la sessione (contenuto)', serveLeFrasi)
  // cinque giorni di fila sulle parole, poi cinque sulle frasi che le usano, sempre giusto
  for (let giorno = 0; giorno < 10; giorno++) {
    const id = giorno < 5 ? 'prima-animales' : 'prima-es-un'
    if (giorno >= 5 && !serveLeFrasi) break
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
  const g = gradoTappa(tappaDi('prima-animales'), k => strength(itemDi(k), adesso))
  controlla('dopo cinque giorni la tappa è salita', g >= 6, `grado ${g}`)
  if (serveLeFrasi) {
    const gf = gradoTappa(tappaDi('prima-es-un'), k => strength(itemDi(k), adesso))
    controlla('e anche quella delle frasi', gf >= 5, `grado ${gf}`)
    controlla('i formati salgono con la forza', formati.has('riconosci') && (formati.has('completa') || formati.has('monta')),
              [...formati].join(', '))
  }
  // una domanda con un tocco a pagamento non paga, anche giusta
  const s = new Sessione({ tappa: tappaDi('prima-animales'), itemDi, ora, rnd: sorte(9) })
  const d = s.prossima()
  itemDi('es:cerdo').tocchi = TOCCHI_GRATIS
  const t2 = new Tocchi({ itemDi, ora })
  t2.tocca('cerdo')
  const es = s.rispondi(d, d.opzioni ? d.opzioni.find(o => o.giusta) : ordineGiusto(d), { tocchi: t2 })
  controlla('giusta ma con un tocco a pagamento: non paga', es.giusta && !es.paga)
  // la 🏁 ripassa tutto il mondo
  const b = new Sessione({ tappa: tappaDi('prima-bandera'), itemDi, ora, rnd: sorte(4) })
  controlla('la bandiera pesca da tutto il mondo', b.pool.some(k => k === 'es:perro') && b.pool.some(k => k === 'es:rojo'))
  const unaDiPrima = FRASI.find(f => f.mondo === 'prima')
  if (unaDiPrima) controlla('e dalle frasi del mondo', b.pool.some(k => k === 'frase-es:' + unaDiPrima.id))
  // il cassetto gioca con le parole di oggi
  const cass = new Sessione({ tappa: cassettoDi('prima'), itemDi, ora, rnd: sorte(5) })
  const dc = cass.prossima()
  controlla('il cassetto fa domande sulle parole', dc && dc.genere === 'parola')
  // dalla quinta niente disegnini: né «che cos'è?» né «ascolta e scegli» con le figure
  const grande = new Sessione({ tappa: tappaDi('prima-animales'), itemDi: k => newItem(), ora, rnd: sorte(6), eta: 10 })
  const conFigure = []
  for (let i = 0; i < 30; i++) { const q = grande.prossima(); if (q && q.figure) conFigure.push(q.formato) }
  uguale('a dieci anni nessuna domanda con le figure', conFigure.join(), '')
  const piccolo = new Sessione({ tappa: tappaDi('prima-animales'), itemDi: k => newItem(), ora, rnd: sorte(6), eta: 7 })
  controlla('a sette sì', Array.from({ length: 10 }, () => piccolo.prossima()).some(q => q && q.figure))
  nota(`${partite} partite giocate, formati visti: ${[...formati].join(', ')}`)
}

/* ═══════════ 10. le parole note ═══════════ */
titolo('PAROLE NOTE')
{
  const note = paroleNote('seconda', 'seconda-comida')
  controlla('al secondo mondo si sanno le parole del primo', note.has('perro') && note.has('rojo') && note.has('lápiz'))
  controlla('ma non quelle delle tappe dopo', !note.has('sombrero'))
  const allaFrase = paroleNote('terza', 'terza-hay')
  controlla('a una tappa di frasi si sanno le parole delle tappe prima', allaFrase.has('cocina') && allaFrase.has('treinta'))
  controlla('ma non quelle che vengono dopo', !allaFrase.has('lunes') && !allaFrase.has('lluvia'))
  controlla('e i mesi, in minuscolo come tutto', paroleNote('terza', 'terza-hoy').has('mayo'))
  controlla('le voci lunghe fanno note i loro pezzi', paroleNote('terza', 'terza-hoy').has('fin') && paroleNote('terza', 'terza-hoy').has('semana'))
  controlla('le categorie di struttura non hanno cassetto', CATEGORIE_DI_STRUTTURA.includes('q'))
  controlla('i nomi dei personaggi si sanno da subito', paroleNote('prima', 'prima-colores').has('laura'))
}

/* ═══════════ 11. i difetti trovati giocando ═══════════ */
titolo('DIFETTI')
{
  // le risposte sbagliate delle domande sulle parole: dall'argomento, mai da tutta la lingua
  nessuno('le domande sulle parole restano nel loro argomento', guastiDelleParole())
  // e nella partita vera, per ogni parola di una tappa piccola
  const items = new Map()
  const itemDi = k => { if (!items.has(k)) items.set(k, newItem()); return items.get(k) }
  const colori = new Set(paroleDellArgomento('colores'))
  const s = new Sessione({ tappa: tappaDi('prima-colores'), itemDi, rnd: sorte(2) })
  // quello che si può vedere di un colore: la parola, l'italiano, l'emoji
  const ammessi = new Set(PAROLE_ES.filter(w => colori.has(w[0])).flatMap(w => [w[0], w[1], w[2]]).filter(Boolean))
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
  controlla('«I colori» sono solo colori', tappaDi('prima-colores').parole.every(p => colori.has(p)))

  // le frasi ripescate dai mondi prima: solo dove si ripassano le frasi
  const vuoto = new Map()
  const nuovo = k => { if (!vuoto.has(k)) vuoto.set(k, newItem()); return vuoto.get(k) }
  const diParole = new Sessione({ tappa: tappaDi('seconda-cuerpo'), itemDi: nuovo, rnd: sorte(1) })
  uguale('una tappa di parole non ripesca frasi', diParole.pool.filter(k => k.startsWith('frase-es:')).join(), '')
  const diFrasi = new Sessione({ tappa: tappaDi('seconda-gusta'), itemDi: nuovo, rnd: sorte(1) })
  const delMondo = (pool, mondo) => pool.filter(k => k.startsWith('frase-es:') && fraseDi(k.slice(9)).mondo === mondo)
  uguale('una forma mai vista (un mondo saltato) non si ripesca', delMondo(diFrasi.pool, 'prima').join(), '')
  // es-un vista un mese fa e calata: quella sì
  if (FRASI.some(f => f.forma === 'es-un')) {
    const calata = new Map([['forma-es:es-un', { ...newItem(), s: 2, last: Date.now() - 30 * 864e5, seen: 3, ok: 3 }]])
    const conCalata = k => { if (!calata.has(k)) calata.set(k, newItem()); return calata.get(k) }
    const ripesca = new Sessione({ tappa: tappaDi('seconda-gusta'), itemDi: conCalata, rnd: sorte(1) })
    const ripescate = delMondo(ripesca.pool, 'prima')
    controlla('una forma vista e poi calata ripesca le sue frasi dai mondi prima',
      ripescate.length > 0 && ripescate.every(k => fraseDi(k.slice(9)).forma === 'es-un'), ripescate.join())
  } else controlla('ci sono frasi di «es-un» da ripescare (contenuto)', false)
  if (FRASI.some(f => f.tappa === 'seconda-gusta')) {
    const chieste = Array.from({ length: 12 }, () => diFrasi.prossima()).filter(Boolean)
    uguale('e non chiede mai parole, anche se non le sa', chieste.filter(q => q.genere !== 'frase').length, 0)
  }

  // la struttura saputa fa salire anche le frasi nuove: in una partita si arriva alle tessere
  if (conFrasi('prima-es-un')) {
    const it2 = new Map()
    const leggi2 = k => { if (!it2.has(k)) it2.set(k, newItem()); return it2.get(k) }
    const scala = new Sessione({ tappa: tappaDi('prima-es-un'), itemDi: leggi2, rnd: sorte(3) })
    const visti = []
    for (let i = 0; i < 14; i++) {
      const q = scala.prossima()
      visti.push(q.formato)
      const es = scala.rispondi(q, q.opzioni ? q.opzioni.find(o => o.giusta) : ordineGiusto(q))
      for (const r of es.registra) record(leggi2(r.chiave), { correct: r.correct, now: Date.now() })
    }
    controlla('in una partita sola, dal «riconosci» alle tessere',
              visti[0] === 'riconosci' && visti.some(f => f === 'completa' || f === 'monta'), visti.join(', '))
    const tuttoAperto = new Sessione({ tappa: tappaDi('prima-es-un'), itemDi: nuovo, rnd: sorte(3), partenza: 2 })
    uguale('con tutto aperto si parte da «scegli»', tuttoAperto.prossima().formato, 'scegli')
  }

  // il controllo sulla concordanza: i casi trovati giocando
  for (const storta of ['tengo una pantalones', 'ella tiene un pelo largo negra', 'es una elefante', 'son dos gato',
                        'me gusta una leche', 'es un pelota', 'ella es alto', 'los lápices negro'])
    controlla(`«${storta}» è sgrammaticata`, !!sgrammaticata(storta))
  for (const dritta of ['tengo pantalones azules', 'ella tiene el pelo largo', 'es una pelota roja', 'son dos gatos',
                        'me gusta la leche', 'hay nieve en enero', 'ellos son un gato y un perro', 'ella es alta'])
    uguale(`«${dritta}» sta in piedi`, sgrammaticata(dritta), null)
}

/* ═══════════ 11b. i verbi flessi e i paragoni ═══════════ */
titolo('VERBI E STRUTTURE')
{
  // ogni struttura dichiarata dall'anno ha la sua tappa di frasi (il libro le sa già dalla prima pagina)
  for (const m of MONDI.filter(x => x.strutture))
    uguale(`${m.id}: ogni struttura dichiarata ha una tappa di frasi`,
      m.strutture.filter(f => !m.tappe.some(t => t.frasi && t.forme.includes(f))).join(), '')
  // il presente arriva con «Io canto», il gerundio con «Che cosa stai facendo?», il passato col passato
  const ignote = (testo, mondo, tappa) => sconosciute(testo, paroleNote(mondo, tappa), flessioniNote(mondo, tappa))
  uguale('«jugué» solo dal pretérito', ignote('ayer jugué', 'sesta', 'sesta-ayer').join(), 'jugué')
  uguale('e lì sì', ignote('ayer jugué', 'sesta', 'sesta-jugue').join(), '')
  uguale('«hice» solo dai verbi che cambiano', ignote('ayer hice una torta', 'sesta', 'sesta-ayer').join(), 'hice')
  uguale('e lì sì', ignote('ayer hice una torta', 'sesta', 'sesta-fui').join(), '')
  uguale('«escuchando» solo dopo il gerundio', ignote('está escuchando música', 'quarta', 'quarta-me-levanto').join(), 'escuchando')
  uguale('e lì sì', ignote('está escuchando música', 'quarta', 'quarta-gerundio').join(), '')
  uguale('un verbo che non c’è non si inventa: «cantaba»', ignote('ayer cantaba', 'sesta', 'sesta-jugue').join(), 'cantaba')
  controlla('le parole delle frasi componibili non cambiano: «jugué» non è nota in quinta', !paroleNote('quinta').has('jugué'))
  // toccate, le forme dicono la loro base
  uguale('«jugué» toccato dice il passato', traduci('jugué').it, 'giocare (al passato)')
  uguale('e la chiave è quella del verbo', traduci('jugué').chiave, 'verbo-es:jugar')
  uguale('anche per lo SRS: «jugando» è verbo-es:jugar', chiaveDi('jugando'), 'verbo-es:jugar')
  uguale('«juegas» → jugar, tú', JSON.stringify([flessa('juegas').base, flessa('juegas').persona]), JSON.stringify(['jugar', 'tú']))
  uguale('jugar al passato, yo: jugué (non jugé)', flessione('jugar', 'ind', 'yo'), 'jugué')
  // le tessere di troppo dei verbi sono le loro forme, e in «completa» contendono un buco
  for (const [f, verbo, gemelle] of [
    [P('quarta-canto', 'presente-ar', 'io canto', 'yo canto'), 'canto', ['cantas', 'canta', 'cantamos', 'cantan', 'cantar']],
    [P('quinta-quiero', 'quiero-puedo', 'io voglio giocare', 'yo quiero jugar'), 'quiero', ['quieres', 'quiere', 'queremos', 'quieren', 'querer']]]) {
    let viste = 0, contese = 0
    for (let s = 1; s <= 8; s++) {
      const ctx = ctxDi(f, s)
      const sm = costruisci(f, 'scegliMonta', ctx, { forza: 6 })
      if (sm.tessere.some(t => t.id >= sm.soluzione.length && gemelle.includes(t.testo))) viste++
      const c = costruisci(f, 'completa', ctx)
      if (c.rivale == null || c.righe[c.rivale].buco !== undefined) contese++
    }
    controlla(`«${f.es}»: accanto a «${verbo}» esce una sua forma`, viste >= 4, `${viste}/8`)
    uguale(`«${f.es}»: in «completa» la tessera di troppo contende un buco`, contese, 8)
  }
  // una trappola rifà il resto della frase: niente due errori in uno
  const tr = (f) => trappoleDi(f, ctxDi(f, 1)).map(t => t.es)
  controlla('la mucca al posto del gatto si porta l’articolo e il colore',
    tr(P('prima-color', 'color-despues', 'è un gatto nero', 'es un gato negro')).includes('es una vaca negra'))
  controlla('una domanda resta una domanda (niente trappole che la girano in affermazione)',
    tr(P('terza-donde', 'esta-en', 'dov’è il gatto?', 'dónde está el gato')).every(e => !/^el gato/.test(e)))
  controlla('«pedo» non esce mai', !tr(P('seconda-tengo', 'tener', 'ho un cane', 'tengo un perro')).concat(
    tr(P('quinta-quiero', 'quiero-puedo', 'voglio giocare', 'quiero jugar'))).some(e => /\bpedo\b/.test(e)))
}

/* ═══════════ 12. l'anno di scuola e l'età ═══════════ */
titolo('ETÀ')
{
  const anni = MONDI.filter(m => m.tappe.length).map(m => m.anno)
  uguale('un mondo per anno di scuola, nell’ordine, e uno dopo', anni.join(','), '1,2,3,4,5,6')
  // i nomi sono posti, mai l'anno: un bambino non deve sentirsi indietro o avanti
  uguale('nessun nome dice l’anno di scuola', MONDI.filter(m => /\b(prima|seconda|terza|quarta|quinta|sesta)\b/i
    .test(m.nome)).map(m => m.nome).join(), '')
  const fuoriAnno = TAPPE.filter(t => t.portata < inizioDellAnno(mondoDi(t.mondo).anno) ||
                                      t.portata >= inizioDellAnno(mondoDi(t.mondo).anno + 1))
  uguale('ogni tappa ha la portata del suo anno', fuoriAnno.map(t => t.id).join(), '')
  // le frasi sono capitoli fra le parole, non un blocco in fondo al mondo
  const inFila = m => Math.max(...m.tappe.filter(t => !t.bandiera).map(t => (t.frasi ? '|' : 'p')).join('')
    .split('|').map(x => x.length))
  const conFrasiM = MONDI.filter(m => m.tappe.some(t => t.frasi))
  uguale('mai più di quattro tappe di parole di fila, dove ci sono le frasi',
         conFrasiM.filter(m => inFila(m) > 4).map(m => m.id).join(), '')
  uguale('e le frasi cominciano entro la quarta tappa',
         conFrasiM.filter(m => m.tappe.findIndex(t => t.frasi) > 3).map(m => m.id).join(), '')
  // i saluti dopo es-un: el, la e la domanda girata li sa già
  const ordine = MONDI[0].tappe.map(t => t.id)
  controlla('«Hola» viene dopo «È un cane, è una mucca»', ordine.indexOf('prima-hola') > ordine.indexOf('prima-es-un'))
  controlla('la carta guarda i mondi, non il gioco di prima', TAPPE_DEL_GIOCO.spagnolo === TAPPE)
  controlla('a sei anni e mezzo lo spagnolo si offre (la prima elementare)', giocoDaOffrire(TAPPE, { eta: 6.5 }))
  // l'età non apre mondi: anche a dieci anni si comincia dalla prima
  const c = { tappa: 0, stelle: {}, cfg: {} }
  uguale('a dieci anni è aperta solo la prima', statoMappa(c, () => 0, { eta: 10 }).filter(m => m.aperto)
    .map(m => m.id).join(), 'prima')
  // chi aveva la quarta aperta per età e ci ha vinto una tappa la ritrova
  const q = { tappa: 0, stelle: {}, cfg: {}, vinte: { 'quarta-dia': 1 } }
  controlla('un mondo con una tappa vinta resta aperto', mondoAperto(q, 'quarta') &&
    tappaAperta(q, 'quarta-hora') && !tappaAperta(q, 'quarta-verbos'))
  controlla('ma non apre il mondo dopo', !mondoAperto(q, 'quinta'))
  controlla('e i mondi prima si fanno in fila', tappaAperta(q, 'prima-colores') && !mondoAperto(q, 'seconda'))
}

/* ═══════════ 13. niente travaso: non c'è una campagna a mondi di prima ═══════════ */
titolo('NIENTE TRAVASO')
{
  const vinte = { 'prima-colores': 5, 'prima-animales': 6, 'vecchia-tappa': 7 }
  uguale('travasate lascia le vinte come sono', JSON.stringify(travasate(vinte)), JSON.stringify(vinte))
  controlla('e non è lo stesso oggetto', travasate(vinte) !== vinte)
  uguale('quanteVinte conta solo le tappe che ci sono', quanteVinte(vinte), 2)
  const c = { tappa: 12, vinte: { ...vinte } }
  controlla('il profilo tiene tappa uguale al conto', travasa(c) && c.tappa === 2)
  controlla('rifatto non cambia più niente', !travasa(c))
  controlla('un profilo senza vinte non si rompe', !travasa({ tappa: 0 }) && !travasa(null))
  controlla('il riassunto della home a profilo vuoto', manifesto.riassunto({}) === `${TAPPE.length} tappe sulla mappa del tesoro`)
  controlla('e dopo una vittoria dice quante e dove',
    new RegExp(`^1 tappa su ${TAPPE.length} · ${MONDI[0].nome}$`).test(manifesto.riassunto({ vinte: { 'prima-colores': 1 } })),
    manifesto.riassunto({ vinte: { 'prima-colores': 1 } }))
}

riassunto('spagnolo a mondi')
