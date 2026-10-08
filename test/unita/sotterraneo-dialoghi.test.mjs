/* I dialoghi della terra di sopra (docs/sotterraneo/dialoghi.md): i testi stanno in
   piedi (pagine corte, voci in ordine, uno per chi sta sulla mappa), cosa si dice
   aprendo secondo la storia e le missioni, le scelte e il loro ordine, la storia che
   cambia andando avanti, il minatore che dice sempre la strada, prendere e consegnare
   detti a voce, e le monete dette quante sono state pagate davvero.
   `node test/esegui.mjs sotterraneo-dialoghi --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { DIALOGHI, guastiDeiDialoghi, ARRIVEDERCI } from '../../src/giochi/sotterraneo/dati/dialoghi.js'
import { MISSIONI, missioneDi } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { MERCANTI } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { PERSONAGGI as DOVE_PERSONAGGI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { apertura, scelte, risposta, dopoLaPresa, dopoLaConsegna, inPagine, strada }
  from '../../src/giochi/sotterraneo/motore/dialoghi.js'
import { PRESA, FATTA, CONSEGNATA } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const tappeAl = n => CAMPAGNA.map((t, i) => ({ ...t, indice: i, aperta: i <= n, fatta: i < n, adesso: i === n }))
const ctx = (n, stati = {}, extra = {}) => ({ stati, tappe: tappeAl(n), abisso: n >= CAMPAGNA.length, eroe: 'cavaliere', roba: null, ...extra })
const testi = pagine => pagine.map(p => p.testo)
const che = s => s.map(x => x.che)

/* ══════════ 1. i testi stanno in piedi ══════════ */
{
  const chi = ['minatore', ...Object.keys(DOVE_PERSONAGGI), ...MERCANTI.map(m => m.chiave)]
  const g = guastiDeiDialoghi(chi)
  controlla('ognuno sulla mappa ha il suo dialogo, a pagine corte e in ordine', !g.length, g.join(' · '))
  uguale('dieci che parlano: il minatore, i sei delle missioni, i tre mercanti', chi.length, 10)
  for (const m of MISSIONI) controlla(`${m.id}: ha la frase del ritorno`, !!m.ritorno)
  // una frase lunga si spezza in pagine di una o due frasi, mai oltre i 120 caratteri quando si può
  const p = inPagine('Uno. Due. Tre? Quattro!')
  stessaLista('quattro frasi brevi: due pagine da due', p, ['Uno. Due.', 'Tre? Quattro!'])
  for (const m of MISSIONI) {
    const pag = inPagine(m.dice)
    controlla(`${m.id}: la richiesta sta in tre pagine al più`, pag.length <= 3, pag.join(' | '))
  }
}

/* ══════════ 2. aprendo: le missioni prima, poi il saluto ══════════ */
{
  // all'inizio il frate ha la Dama Grigia da chiedere: la richiesta, a pagine, e «Ci penso io»
  const a = apertura('eremita', ctx(0))
  controlla('il frate chiede subito il suo favore', a.length && a.every(p => p.missione === 'badessa' && p.fase === 'offre'), JSON.stringify(a))
  stessaLista('le scelte: ci penso io, la storia, arrivederci', che(scelte('eremita', ctx(0))), ['prendi', 'racconta', 'ciao'])
  uguale('e l\'ultima è sempre arrivederci', scelte('eremita', ctx(0)).at(-1).testo, ARRIVEDERCI)
  // presa: ricorda dov'è, con le parole del posto
  const presa = apertura('eremita', ctx(0, { badessa: PRESA }))
  controlla('presa, ricorda dov\'è e a che piano', presa.length === 1 && /cripta dell'altare, al secondo piano/.test(presa[0].testo), testi(presa).join(' | '))
  stessaLista('e allora niente «ci penso io»', che(scelte('eremita', ctx(0, { badessa: PRESA }))), ['racconta', 'ciao'])
  // fatta: se ne accorge, e la scelta è consegnarla
  const fatta = apertura('eremita', ctx(1, { badessa: FATTA }))
  uguale('fatta: si accorge che sei tornato', fatta[0].testo, missioneDi('badessa').ritorno)
  uguale('e la prima scelta è consegnarla', scelte('eremita', ctx(1, { badessa: FATTA }))[0].che, 'consegna')
  // niente da chiedere: il saluto, che cambia con la storia
  const sal = apertura('mugnaio', ctx(0))
  controlla('il mugnaio, senza missioni, saluta', sal.length === 1 && sal[0].dato === 'saluto', JSON.stringify(sal))
  controlla('la ragazza saluta diversa più avanti', apertura('ragazza', ctx(0, { collana: CONSEGNATA, goblin: CONSEGNATA }))[0]?.testo !==
            apertura('ragazza', ctx(5, { collana: CONSEGNATA, goblin: CONSEGNATA }))[0]?.testo)
  // due favori dalla stessa persona: tutte e due le richieste, e una scelta per ognuna col suo nome
  const due = scelte('pescatore', ctx(4)).filter(s => s.che === 'prendi')
  uguale('il pescatore ha due favori: due «ci penso io»', due.length, 2)
  controlla('e ognuno dice quale', due.every(s => s.testo.startsWith('Ci penso io: ')), due.map(s => s.testo).join(' | '))
}

/* ══════════ 3. la storia cambia andando avanti ══════════ */
{
  for (const chi of Object.keys(DIALOGHI)) {
    const viste = new Set()
    for (let n = 0; n <= CAMPAGNA.length; n++) viste.add(testi(risposta(chi, 'racconta', ctx(n))).join(' '))
    controlla(`${chi}: racconta almeno due cose diverse nella storia`, viste.size >= 2, [...viste].join(' ‖ '))
  }
  // il minatore racconta del mostro grosso della prossima discesa, col suo nome
  controlla('alla scalinata il minatore parla di Grumo', testi(risposta('minatore', 'racconta', ctx(1))).join(' ').includes('Grumo'))
  controlla('e finite le sette, dell\'abisso', /fondo/.test(testi(risposta('minatore', 'racconta', ctx(CAMPAGNA.length))).join(' ')))
  // una domanda fatta non torna nello stesso dialogo; arrivederci sì
  stessaLista('chiesta la storia, resta il resto', che(scelte('mugnaio', ctx(0), new Set(['racconta']))), ['ciao'])
}

/* ══════════ 4. il minatore dice sempre la strada ══════════ */
{
  const prima = apertura('minatore', ctx(0), { primaVolta: true })
  controlla('la prima volta si presenta', prima[0].dato == null && /quarant'anni/.test(prima[0].testo), prima[0].testo)
  const dopo = apertura('minatore', ctx(2))
  uguale('poi va dritto alla strada', dopo[0].dato, 'detto')
  controlla('la strada dice la discesa di adesso', dopo[0].testo.startsWith('La torre in rovina:'), dopo[0].testo)
  // chi ti cerca al villaggio, una pagina per chi
  const cerca = strada(ctx(1, { collana: FATTA }))
  controlla('dice chi ti cerca', cerca.some(p => p.dato === 'ti-cerca' && /ragazza del pozzo ti aspetta/.test(p.testo)), testi(cerca).join(' | '))
  // a mani nude lo sa prima di scendere, con la voce del minatore
  const nudo = strada(ctx(1, {}, { roba: { att: 1, dif: 0, mano: null, mancina: null, corpo: null, livello: 2 } }))
  controlla('a mani nude: «passa dal fabbro»', nudo.some(p => p.dato === 'sotto-livello' && /fabbro/.test(p.testo)), testi(nudo).join(' | '))
  // «dove vado adesso?» non c'è finché la strada è appena stata detta: chi lo apre la sente subito
  controlla('aprendo, la strada è già detta', !che(scelte('minatore', ctx(0), new Set(['strada']))).includes('strada'))
  controlla('dopo un\'altra domanda si può chiedere di nuovo', che(scelte('minatore', ctx(0))).includes('strada'))
}

/* ══════════ 5. prendere e consegnare, detti a voce ══════════ */
{
  uguale('presa: lui ringrazia con la sua frase', dopoLaPresa('ragazza', 'collana')[0].testo, DIALOGHI.ragazza.presa)
  // consegnata: il grazie, e quello che si riceve, con le monete pagate davvero
  const dopo = { collana: CONSEGNATA }
  const p = dopoLaConsegna('ragazza', 'collana', { esito: 'consegnata', monete: 0 }, ctx(2, dopo))
  controlla('il grazie, a pagine', p.some(x => x.fase === 'grazie'), JSON.stringify(p))
  uguale('il premio, in una pagina sua', p.find(x => x.dato === 'premio')?.testo, '💎 15')
  // e se adesso ha un altro favore (il goblin), lo chiede subito
  controlla('poi chiede il seguito: Grattanaso', p.some(x => x.missione === 'goblin' && x.fase === 'offre'), testi(p).join(' | '))
  const ros = dopoLaConsegna('mugnaio', 'rosicchione', { esito: 'consegnata', monete: 1 }, ctx(3, { rosicchione: CONSEGNATA }))
  controlla('le monete sono quelle pagate (una, non due)', ros.find(x => x.dato === 'premio').testo.endsWith('🪙 1'), ros.find(x => x.dato === 'premio').testo)
  const pieno = dopoLaConsegna('mugnaio', 'rosicchione', { esito: 'pieno', monete: 0 }, ctx(3, { rosicchione: FATTA }))
  controlla('tasche piene: lo dice lui, e cosa fare', pieno.length === 1 && /tasche piene/.test(pieno[0].testo))
}

/* ══════════ 6. i mercanti: la loro battuta, e la bottega ══════════ */
{
  for (const m of MERCANTI) {
    const a = apertura(m.chiave, ctx(1))
    uguale(`${m.chiave}: saluta con la sua battuta`, a[0]?.testo, m.dice)
    controlla(`${m.chiave}: la prima scelta apre la bottega`, scelte(m.chiave, ctx(1))[0].che === 'bottega')
  }
  controlla('il mercante compra: «ho roba da vendere»', che(scelte('rigattiere', ctx(1))).includes('vendi'))
  nota(MERCANTI.map(m => `${m.nome}: «${m.dice}»`).join(' · '))
}

riassunto('i dialoghi della terra di sopra')
