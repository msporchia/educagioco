/* ENGLISH A SCUOLA

   La maestra sceglie un'isola e le sue tappe (la scheda: `valido`, `descrivi`, e le sue isole uguali ai mondi); il gioco
   col `limite` gioca quelle tappe in giro, senza audio, e racconta ogni risposta in testi da 40. Senza limite il giro non
   c'è: casa. Vedi docs/lingue/scuola.md.
   `node test/esegui.mjs inglese-scuola --niente-build` */
import { MONDI, tappaDi, specieDi } from '../../src/giochi/inglese/dati/mondi.js'
import { FRASI } from '../../src/giochi/inglese/dati/frasi.js'
import { newItem, record } from '../../src/store/srs.js'
import { Sessione } from '../../src/giochi/inglese/motore/sessione.js'
import { costruisci, giudica, contesto, FORMATI_FRASE, COMPONI } from '../../src/giochi/inglese/motore/formati.js'
import { sorte, ordineGiusto } from '../../src/giochi/inglese/motore/guasti.js'
import { tappeDelLimite, dopoNelGiro, racconta, corto, LUNGO } from '../../src/giochi/inglese/motore/scuola.js'
import scheda, { ISOLE } from '../../src/scuola/giochi/inglese/scheda.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const { valido, descrivi } = scheda.tipo
const ASCOLTO = ['ascoltoFigura', 'ascoltoIt']

console.log('\nSENZA LIMITE: CASA')
for (const [cosa, l] of [['null', null], ['niente', undefined], ['vuoto', {}], ['nessuna tappa', { isola: 'prima', tappe: [] }],
  ['un\'isola che non c\'è', { isola: 'luna', tappe: ['prima-colori'] }],
  ['tappe di un\'altra isola', { isola: 'seconda', tappe: ['prima-colori'] }],
  ['tappe come stringa', { isola: 'prima', tappe: 'prima-colori' }]])
  controlla(`${cosa}: nessun giro`, tappeDelLimite(l) === null)

console.log('\nLA SCHEDA È LA MAPPA')
stessaLista('le isole', ISOLE.map(i => i.id), MONDI.filter(m => m.tappe.length).map(m => m.id))
for (const i of ISOLE) {
  const m = MONDI.find(x => x.id === i.id)
  stessaLista(`${i.id}: le tappe, in ordine`, i.tappe.map(t => t.id), m.tappe.map(t => t.id))
  uguale(`${i.id}: l'ultima è il ripasso dell'isola`, i.tappe.at(-1).specie, 'bandiera')
  controlla(`${i.id}: le specie sono quelle del gioco`, i.tappe.every(t => t.specie === specieDi(tappaDi(t.id))))
}
uguale("l'icona è quella del gioco", scheda.tipo.voce.icona, '🇬🇧')
uguale('la materia', scheda.tipo.materia, 'inglese')

console.log('\nVALIDO, ANCHE CONTRO UN LINK MANOMESSO')
const base = scheda.tipo.voce.base
controlla('la base è valida', valido(base))
controlla('i colori e gli animali', valido({ tipo: 'inglese', isola: 'prima', tappe: ['prima-colori', 'prima-animali'] }))
controlla("in disordine (si giocano nell'ordine dell'isola)", valido({ tipo: 'inglese', isola: 'prima', tappe: ['prima-animali', 'prima-colori'] }))
controlla("il ripasso dell'isola dei vulcani", valido({ tipo: 'inglese', isola: 'quinta', tappe: ['quinta-bandiera'] }))
controlla('tutte le tappe della sesta', valido({ tipo: 'inglese', isola: 'sesta', tappe: ISOLE.at(-1).tappe.map(t => t.id) }))
for (const [cosa, e] of [
  ['null', null], ['una lista', []], ['una stringa', 'inglese'], ['un numero', 3],
  ['un altro tipo', { ...base, tipo: 'passo' }],
  ['una chiave in più', { ...base, livelli: [0] }],
  ['il campo gioco (lo toglie il catalogo prima)', { ...base, gioco: 'inglese' }],
  ['senza isola', { tipo: 'inglese', tappe: ['prima-colori'] }],
  ['un\'isola che non c\'è', { ...base, isola: 'luna' }],
  ['un\'isola dal prototipo', { ...base, isola: 'toString' }],
  ['un\'isola non stringa', { ...base, isola: ['prima'] }],
  ['senza tappe', { tipo: 'inglese', isola: 'prima' }],
  ['tappe vuote', { ...base, tappe: [] }],
  ['tappe doppie', { ...base, tappe: ['prima-colori', 'prima-colori'] }],
  ['una tappa che non c\'è', { ...base, tappe: ['prima-dinosauri'] }],
  ['una tappa non stringa', { ...base, tappe: [0] }],
  ['tappe come stringa', { ...base, tappe: 'prima-colori' }],
  ['una tappa di un\'altra isola', { ...base, tappe: ['prima-colori', 'seconda-cibo'] }],
  ['il cassetto', { ...base, tappe: ['cassetto:prima'] }],
]) controlla(`no: ${cosa}`, valido(e) === false)

console.log('\nDESCRIVI')
uguale('una tappa', descrivi(base), 'English · Il prato in fiore · «I colori»')
uguale('due, in ordine', descrivi({ tipo: 'inglese', isola: 'prima', tappe: ['prima-animali', 'prima-colori'] }),
  'English · Il prato in fiore · «I colori» e «Gli animali»')
uguale('il ripasso', descrivi({ tipo: 'inglese', isola: 'quinta', tappe: ['quinta-bandiera'] }),
  'English · L’isola dei vulcani · «Il ripasso di tutta l’isola»')
uguale('tutte', descrivi({ tipo: 'inglese', isola: 'quinta', tappe: ISOLE[4].tappe.map(t => t.id) }), 'English · L’isola dei vulcani · tutte le tappe')
uguale('più di tre', descrivi({ tipo: 'inglese', isola: 'prima', tappe: ISOLE[0].tappe.slice(0, 5).map(t => t.id) }),
  'English · Il prato in fiore · 5 tappe')
uguale('storto', descrivi({ tipo: 'inglese' }), 'Esercizio non valido')

console.log('\nIL GIRO')
const giro = tappeDelLimite({ isola: 'prima', tappe: ['prima-bandiera', 'prima-colori', 'prima-che-cose'] })
stessaLista("nell'ordine dell'isola", giro, ['prima-colori', 'prima-che-cose', 'prima-bandiera'])
uguale('dopo la prima, la seconda', dopoNelGiro(giro, 'prima-colori'), 'prima-che-cose')
uguale("finita l'ultima, da capo", dopoNelGiro(giro, 'prima-bandiera'), 'prima-colori')
uguale('una sola: sempre lei', dopoNelGiro(['terza-dove'], 'terza-dove'), 'terza-dove')

console.log('\nCORTO')
uguale('corto resta', corto('Che vuol dire: dog'), 'Che vuol dire: dog')
const lunga = 'Componi: Lui gioca a tennis ogni giorno dopo la scuola.'
const tagliata = corto(lunga)
controlla('lungo: entro 40, coi puntini', tagliata.length <= LUNGO && tagliata.endsWith('…'), tagliata)
controlla('lungo: a una parola intera', lunga.startsWith(tagliata.slice(0, -1) + ' '), tagliata)
const emoji = corto('🐶'.repeat(30))
controlla("una parola sola: senza spezzare un'emoji", emoji.length <= LUNGO && !/[\uD800-\uDBFF]…$/.test(emoji), emoji)

// i tre testi di una risposta: entro i 40, la consegna e la giusta mai vuote, e una giusta dice quello che si aspettava
const guasti = []
function guarda(dove, d, risposta, es) {
  const r = racconta(d, risposta, es)
  for (const k of ['fatto', 'data', 'attesa'])
    if (typeof r[k] !== 'string' || r[k].length > LUNGO) guasti.push(`${dove}: ${k} «${r[k]}»`)
  if (!r.fatto || !r.attesa) guasti.push(`${dove}: vuoto ${JSON.stringify(r)}`)
  if (es.giusta && r.data !== r.attesa) guasti.push(`${dove}: giusta ma «${r.data}» ≠ «${r.attesa}»`)
  return r
}

console.log('\nOGNI FRASE IN OGNI FORMATO')
{
  let n = 0
  for (const f of FRASI) {
    const t = tappaDi(f.tappa)
    for (const formato of FORMATI_FRASE) {
      const ctx = contesto(f, { tappa: t, altre: FRASI.filter(x => x.mondo === f.mondo), rnd: sorte(n + 1) })
      const d = costruisci(f, formato, ctx, { forza: 6 })
      const giusta = COMPONI.has(formato) ? ordineGiusto(d) : d.opzioni.find(o => o.giusta)
      const sbagliata = COMPONI.has(formato) ? [...giusta].reverse() : d.opzioni.find(o => !o.giusta)
      for (const [r, quale] of [[giusta, 'giusta'], [sbagliata, 'sbagliata']]) {
        const es = giudica(f, d, r, { ctx })
        if (quale === 'giusta' && !es.giusta) guasti.push(`${f.id} ${formato}: la giusta non è giusta`)
        guarda(`${f.id} ${formato} ${quale}`, d, r, es)
        n++
      }
    }
  }
  nota(`${n} risposte raccontate su ${FRASI.length} frasi`)
}

console.log('\nOGNI TAPPA, SENZA AUDIO')
{
  const visti = new Set()
  let ascolti = 0
  for (const isola of ISOLE) {
    for (const t of isola.tappe) {
      // un profilo nuovo, come a scuola; qualche risposta sbagliata
      const items = new Map()
      const itemDi = k => { if (!items.has(k)) items.set(k, newItem()); return items.get(k) }
      const tappa = tappaDi(t.id)
      const rnd = sorte(t.id.length * 7 + 1)
      const s = new Sessione({ tappa, itemDi, rnd, haVoce: () => false, presenta: !!tappa.frasi })
      let adesso = Date.now(), turni = 0
      while (!s.finita && turni++ < 300) {
        const d = s.prossima()
        if (!d) { guasti.push(`${t.id}: la partita si ferma`); break }
        if (d.genere === 'pagina') continue
        visti.add(d.formato)
        if (ASCOLTO.includes(d.formato) || (d.domanda && d.domanda.ascolta && !d.domanda.testo)) ascolti++
        const bene = rnd() < 0.8
        const r = d.opzioni ? d.opzioni.find(o => o.giusta === bene) : bene ? ordineGiusto(d) : [...ordineGiusto(d)].reverse()
        const es = s.rispondi(d, r)
        guarda(`${t.id} ${d.formato}`, d, r, es)
        for (const x of es.registra) record(itemDi(x.chiave), { correct: x.correct, now: adesso })
        adesso += 20000
      }
      if (!s.finita) guasti.push(`${t.id}: la tappa non finisce (${s.giuste}/${s.bersaglio})`)
    }
  }
  uguale('nessuna domanda in ascolto', ascolti, 0)
  nota(`formati visti: ${[...visti].join(', ')}`)
  // la prova che serve: con la voce, le domande in ascolto escono
  const items = new Map()
  const itemDi = k => { if (!items.has(k)) items.set(k, { ...newItem(), s: 3, ok: 3, seen: 3, last: Date.now() }); return items.get(k) }
  const conVoce = new Sessione({ tappa: tappaDi('prima-animali'), itemDi, rnd: sorte(3), haVoce: () => true })
  controlla('con la voce sì (la prova vale)', Array.from({ length: 60 }, () => conVoce.prossima()).some(q => q && ASCOLTO.includes(q.formato)))
}

controlla('ogni risposta raccontata bene', !guasti.length, '\n     ' + guasti.slice(0, 12).join('\n     '))

riassunto('English a scuola')
