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
import { NOVITA_DI } from '../../src/giochi/sotterraneo/dati/novita.js'
import { PERSONAGGI as DOVE_PERSONAGGI } from '../../src/giochi/sotterraneo/dati/terra-mappa.js'
import { apertura, scelte, risposta, dopoLaPresa, dopoLaConsegna, inPagine, strada, novita, curaDi, mancaA, richiamoDi, dopoLaCura }
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
  uguale('undici che parlano: il minatore, i sei delle missioni, i quattro mercanti', chi.length, 11)
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
  stessaLista('le scelte: ci penso io, le novità, la storia, arrivederci', che(scelte('eremita', ctx(0))), ['prendi', 'novita', 'racconta', 'ciao'])
  uguale('e l\'ultima è sempre arrivederci', scelte('eremita', ctx(0)).at(-1).testo, ARRIVEDERCI)
  // presa: ricorda dov'è, con le parole del posto
  const presa = apertura('eremita', ctx(0, { badessa: PRESA }))
  controlla('presa, ricorda dov\'è e a che piano', presa.length === 1 && /cripta dell'altare, al secondo piano/.test(presa[0].testo), testi(presa).join(' | '))
  stessaLista('e allora niente «ci penso io»', che(scelte('eremita', ctx(0, { badessa: PRESA }))), ['novita', 'racconta', 'ciao'])
  // fatta: se ne accorge, e la scelta è consegnarla
  const fatta = apertura('eremita', ctx(1, { badessa: FATTA }))
  uguale('fatta: si accorge che sei tornato', fatta[0].testo, missioneDi('badessa').ritorno)
  uguale('e la prima scelta è consegnarla', scelte('eremita', ctx(1, { badessa: FATTA }))[0].che, 'consegna')
  // niente da chiedere: il saluto, che cambia con la storia
  const sal = apertura('mugnaio', ctx(0))
  controlla('il mugnaio, senza missioni, saluta', sal.length === 1 && sal[0].dato === 'saluto', JSON.stringify(sal))
  controlla('la ragazza saluta diversa più avanti', apertura('ragazza', ctx(0, { collana: CONSEGNATA, goblin: CONSEGNATA }))[0]?.testo !==
            apertura('ragazza', ctx(5, { collana: CONSEGNATA, goblin: CONSEGNATA }))[0]?.testo)
  // più favori dalla stessa persona: tutti le richieste, e una scelta per ognuna col suo nome
  const due = scelte('pescatore', ctx(4)).filter(s => s.che === 'prendi')
  uguale('il pescatore ha tre favori: tre «ci penso io»', due.length, 3)
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
  stessaLista('chiesta la storia, restano le novità', che(scelte('mugnaio', ctx(0), new Set(['racconta']))), ['novita', 'ciao'])
}

/* ══════════ 4. il minatore dice sempre la strada ══════════ */
{
  const prima = apertura('minatore', ctx(0), { primaVolta: true })
  controlla('la prima volta si presenta', prima[0].dato == null && /quarant'anni/.test(prima[0].testo), prima[0].testo)
  uguale('e dice la missione: le sette porte', prima[2].dato, 'storia')
  uguale('la prima volta la strada non ripete il perché della porta', prima.filter(p => p.dato === 'storia').length, 1)
  const dopo = apertura('minatore', ctx(2))
  uguale('poi va dritto al perché della porta di adesso', dopo[0].dato, 'storia')
  controlla('che è quello della torre', /Fiammetta/.test(dopo[0].testo), dopo[0].testo)
  const detto = dopo.find(p => p.dato === 'detto')
  controlla('e la strada dice la discesa di adesso', detto.testo.startsWith('La torre in rovina:'), detto.testo)
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
  // il quaderno dell'incantatrice già consegnato: qui si guarda il mercante (la missione è sotto)
  const fatto = { quaderno: 'consegnata' }
  for (const m of MERCANTI) {
    const a = apertura(m.chiave, ctx(1, fatto))
    uguale(`${m.chiave}: saluta con la sua battuta`, a[0]?.testo, m.dice)
    controlla(`${m.chiave}: la prima scelta apre la bottega`, scelte(m.chiave, ctx(1, fatto))[0].che === 'bottega')
  }
  controlla('il mercante compra: «ho roba da vendere»', che(scelte('rigattiere', ctx(1))).includes('vendi'))
  uguale('l\'incantatrice apre la bottega con le sue parole', scelte('incantatrice', ctx(1, fatto))[0].testo, 'Fammi vedere la magia')
  // la sua missione: la chiede a voce, «Ci penso io», e la bottega resta lì sotto
  const q = apertura('incantatrice', ctx(0))
  controlla('all\'inizio l\'incantatrice chiede il quaderno', q.some(p => p.missione === 'quaderno' && p.fase === 'offre'), JSON.stringify(q))
  stessaLista('e le scelte: prima «Ci penso io», poi la bottega', che(scelte('incantatrice', ctx(0))).slice(0, 2), ['prendi', 'bottega'])
  nota(MERCANTI.map(m => `${m.nome}: «${m.dice}»`).join(' · '))
}

/* ══════════ 6b. chi cura gratis: la guaritrice la vita, l'incantatrice l'energia ══════════ */
{
  const ferito = { vita: 12, vitaMax: 40, energia: 10, energiaMax: 10 }
  const scarico = { vita: 40, vitaMax: 40, energia: 2, energiaMax: 10 }
  const intero = { vita: 40, vitaMax: 40, energia: 10, energiaMax: 10 }
  uguale('la guaritrice cura la vita', curaDi('erborista').risorsa, 'vita')
  uguale('l\'incantatrice l\'energia', curaDi('incantatrice').risorsa, 'energia')
  controlla('gli altri non curano', ['armaiolo', 'rigattiere', 'minatore', 'ragazza'].every(c => !curaDi(c)))
  uguale('ferito: alla guaritrice mancano 28 punti', mancaA('erborista', ferito), 28)
  uguale('ma l\'energia non è sua', mancaA('incantatrice', ferito), 0)
  uguale('scarico: all\'incantatrice ne mancano 8', mancaA('incantatrice', scarico), 8)
  uguale('senza una discesa a metà non manca niente', mancaA('erborista', null), 0)
  // la domanda c'è sempre; ferito è la prima, in forze sta dopo la bottega
  uguale('ferito: «Curami» prima della bottega', che(scelte('erborista', ctx(1, {}, { forze: ferito }))).slice(0, 2).join(), 'cura,bottega')
  uguale('in forze: la bottega prima, «Curami» dopo', che(scelte('erborista', ctx(1, {}, { forze: intero }))).slice(0, 2).join(), 'bottega,cura')
  uguale('senza discesa a metà c\'è lo stesso', che(scelte('erborista', ctx(1))).includes('cura'), true)
  uguale('le parole sono le sue', scelte('erborista', ctx(1, {}, { forze: ferito })).find(x => x.che === 'cura').testo, 'Curami')
  uguale('e dell\'incantatrice', scelte('incantatrice', ctx(1, {}, { forze: scarico })).find(x => x.che === 'cura').testo, 'Ricaricami')
  controlla('fatta una volta non torna nello stesso dialogo', !che(scelte('erborista', ctx(1, {}, { forze: ferito }), new Set(['cura']))).includes('cura'))
  controlla('Arrivederci resta ultima', che(scelte('erborista', ctx(1, {}, { forze: ferito }))).at(-1) === 'ciao')
  controlla('chi non cura non ha la domanda', !che(scelte('armaiolo', ctx(1, {}, { forze: ferito }))).includes('cura'))
  // curando dice la sua; in forze lo dice, senza far finta
  const cura = dopoLaCura('erborista', 28), gia = dopoLaCura('erborista', 0)
  controlla('curando: le sue frasi, segnate come cura', cura.length >= 1 && cura.every(p => p.dato === 'cura'), JSON.stringify(cura))
  controlla('in forze: «sei già in forze»', gia.length === 1 && gia[0].dato === 'in-forze' && /in forze/.test(gia[0].testo), JSON.stringify(gia))
  // il richiamo sopra la testa c'è solo finché serve
  uguale('ferito la guaritrice chiama', richiamoDi('erborista', ferito), 'Sei ferito. Vieni, ti curo.')
  uguale('in forze tace', richiamoDi('erborista', intero), null)
  uguale('l\'incantatrice chiama per l\'energia', /ricarico/.test(richiamoDi('incantatrice', scarico)), true)
  uguale('e non per la vita', richiamoDi('incantatrice', ferito), null)
  uguale('il fabbro non chiama mai', richiamoDi('armaiolo', ferito), null)
}

/* ══════════ 7. «Novità?»: frasi che ruotano e reagiscono ══════════ */
{
  const chi = ['minatore', ...Object.keys(DOVE_PERSONAGGI), ...MERCANTI.map(m => m.chiave)]
  const roba = livello => ({ att: 5, dif: 5, mano: null, mancina: null, corpo: null, livello })
  // ognuno ha la domanda, dopo la sua cosa e prima della storia
  for (const c of chi) {
    const ch = che(scelte(c, ctx(1)))
    controlla(`${c}: ha «Novità?» prima della storia`, ch.includes('novita') && ch.indexOf('novita') < ch.indexOf('racconta'), ch.join(','))
    uguale(`${c}: e la domanda è quella`, scelte(c, ctx(1)).find(s => s.che === 'novita').testo, 'Novità?')
  }
  // rotazione: chiesta più volte, dice cose diverse, e dopo l'ultima ricomincia; mai un segnaposto rimasto
  for (const c of chi) for (const n of [0, 1, 3, 5, 7]) {
    let visto = null
    const dette = []
    for (let i = 0; i < 12; i++) {
      const r = novita(c, ctx(n, {}, { roba: roba(1 + n) }), visto)
      visto = r.visto
      dette.push(testi(r.pagine).join(' '))
      controlla(`${c}, ${n} finite: la frase ${i} non ha segnaposti`, !/[{}]/.test(dette.at(-1)) && dette.at(-1).length > 10, dette.at(-1))
    }
    controlla(`${c}, ${n} finite: almeno quattro frasi diverse`, new Set(dette).size >= 4, [...new Set(dette)].join(' ‖ '))
    controlla(`${c}, ${n} finite: gira, non resta ferma`, dette[0] !== dette[1] && dette[0] === dette[new Set(dette).size], dette.slice(0, 3).join(' ‖ '))
  }
  // reagiscono a dove si è arrivati: la prima è la notizia fresca, col nome del grosso e della discesa nuova
  const dopoTorre = testi(novita('ragazza', ctx(3), null).pagine).join(' ')
  controlla('finita la torre la ragazza parla di Fiammetta e della grotta', /Fiammetta/.test(dopoTorre) && /grotta della scaletta/.test(dopoTorre), dopoTorre)
  controlla('la guardia, finita la torre, parla della fornace spenta', /fornace è spenta/.test(testi(novita('guardia', ctx(3), null).pagine).join(' ')))
  controlla('prima di scendere: un\'altra notizia', testi(novita('mugnaio', ctx(0), null).pagine).join(' ') !== dopoTorre)
  // un livello raggiunto cambia la pila: si riparte dalla notizia nuova
  const l5 = novita('pescatore', ctx(0, {}, { roba: roba(5) }), null)
  const l1 = novita('pescatore', ctx(0, {}, { roba: roba(1) }), null)
  controlla('con un livello in più c\'è una frase in più: la seconda cambia',
            testi(novita('pescatore', ctx(0, {}, { roba: roba(5) }), l5.visto).pagine).join() !==
            testi(novita('pescatore', ctx(0, {}, { roba: roba(1) }), l1.visto).pagine).join())
  const ancora = novita('pescatore', ctx(0, {}, { roba: roba(10) }), l5.visto)
  uguale('cambiata la situazione si riparte dalla prima', ancora.visto.n, 1)
  // chi finisce le sette dice un'altra cosa
  controlla('finite le sette, la storia è un\'altra', testi(novita('eremita', ctx(CAMPAGNA.length), null).pagine).join() !== testi(novita('eremita', ctx(1), null).pagine).join())
  // la risposta della scelta è la stessa, e ricorda a che punto era
  const r1 = risposta('guardia', 'novita', ctx(1))
  controlla('«Novità?» risponde a pagine con la sua riga', r1.length >= 1 && r1.every(p => p.dato === 'novita'), JSON.stringify(r1))
  const r2 = risposta('guardia', 'novita', { ...ctx(1), novita: { guardia: novita('guardia', ctx(1), null).visto } })
  controlla('e se l\'ha già detta, ne dice un\'altra', testi(r1).join() !== testi(r2).join())
  // nessuna parola da gioco in bocca ai personaggi: il testo vale anche per i piccoli (frasi corte)
  for (const c of chi) for (const r of NOVITA_DI[c].reazioni) for (const p of r.pagine)
    controlla(`${c}: pagina corta («${p.slice(0, 24)}…»)`, p.length <= 110, `${p.length}`)
}

riassunto('i dialoghi della terra di sopra')
