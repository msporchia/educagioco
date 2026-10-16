/* I pensieri dell'eroe (docs/sotterraneo/pensieri.md): la tabella sta in piedi, ogni condizione con un caso vero e uno no
   su un Corredo o una Corsa veri, i testi su misura di ogni classe e strada (il tipo d'arma giusto, mai un pezzo che non
   regge, gli accordi), il lessico (niente ordini, niente giudizi sull'oggetto, parole da sei anni), il ritmo e la memoria,
   e quanti pensieri escono in discese vere giocate dal banco.
   `node test/esegui.mjs sotterraneo-pensieri --niente-build`
   tempo: 8 */
import { PENSIERI, PENSIERO, RITMO, SOGLIE, TIPI_ARMA, TIPI_VESTE, SCUDO, GIOIELLI, DIVENTARE, guastiDeiPensieri } from '../../src/giochi/sotterraneo/dati/pensieri.js'
import { situazioneDi, candidati, scegli, ricorda, testoDi, riempi, rileggiMemoria, MEMORIA_NUOVA, entraNelGiro, giroDi,
         stradaDellEroe, conArticolo, questoDi, unoDi } from '../../src/giochi/sotterraneo/motore/pensieri.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { gioca } from '../../src/giochi/sotterraneo/motore/banco.js'
import { robaDellaStrada, crescitaDellaStrada, stradeDi } from '../../src/giochi/sotterraneo/motore/strade.js'
import { conLaStrada } from '../../src/giochi/sotterraneo/motore/abilita.js'
import { crescitaA } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { COSE, aLivello, baseDi } from '../../src/giochi/sotterraneo/dati/cose.js'
import { eroeDi, portaLa } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { PASSO_EROE } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const TUTTI = ['armaiolo', 'incantatrice', 'erborista', 'rigattiere']
const roba = (r = {}) => ({ v: 1, gemme: 0, zaino: [], mano: null, mancina: null, corpo: null, collo: null, dito: null, dito2: null, torcia: 0, torce: 0, ...r })
const sopra = (eroe, r, cr = null, extra = {}) => situazioneDi(new Corredo({ eroe, roba: roba(r), crescita: cr }), { mercanti: TUTTI, ...extra })
const ids = (s, opz) => candidati(s, opz).map(x => x.p.id)
const ha = (s, id, opz) => ids(s, opz).includes(id)
const tutto = []   // ogni testo uscito, per il lessico
const di = (s, id, opz) => { const x = candidati(s, opz).find(c => c.p.id === id); if (!x) return null; const t = testoDi(x.p, x.esito, 0, s.o); tutto.push(t); return t }
const L10 = crescitaA(eroeDi('cavaliere'), 10)
const nuda = cr => ({ ...cr, albero: {} })

/* ══════════ 1. la tabella ══════════ */
{
  const g = guastiDeiPensieri()
  controlla('ogni pensiero ha id, tono, posto, momento, condizione, icona e testi', !g.length, g.join(' · '))
  controlla('almeno venti pensieri', PENSIERI.length >= 20, String(PENSIERI.length))
  controlla('i problemi ci sono, e i consigli sono di più', PENSIERI.filter(p => p.tono === 'problema').length >= 5 &&
            PENSIERI.filter(p => p.tono === 'consiglio').length > PENSIERI.filter(p => p.tono === 'problema').length)
}

/* ══════════ 2. le condizioni, una per una: vero e no ══════════ */
const visti = new Set()
const vero = (id, s, opz) => { const t = di(s, id, opz); if (t) visti.add(id); return controlla(`${id}: vero`, !!t, JSON.stringify(ids(s, opz))) }
const falso = (id, s, cosa, opz) => controlla(`${id}: no, ${cosa}`, !ha(s, id, opz))
{
  // la torcia, giù
  const buio = new Corsa(CAMPAGNA[0], { seme: 5 })
  vero('senza-torcia', situazioneDi(buio), { momento: 'entrata' })
  falso('senza-torcia', situazioneDi(buio), 'non mentre si cammina')
  const conTorcia = new Corsa(CAMPAGNA[0], { seme: 5, roba: roba({ torce: 1 }) })
  falso('senza-torcia', situazioneDi(conTorcia), 'con la torcia accesa', { momento: 'entrata' })
  const scorta = new Corsa(CAMPAGNA[0], { seme: 5, roba: roba({ torce: 2 }) })
  falso('senza-torcia', situazioneDi(scorta), 'con una alla cintura', { momento: 'entrata' })
  conTorcia.torciaResta = 2
  vero('torcia-corta', situazioneDi(conTorcia))
  scorta.torciaResta = 2
  falso('torcia-corta', situazioneDi(scorta), 'con una di scorta')
  conTorcia.torciaResta = 6
  falso('torcia-corta', situazioneDi(conTorcia), 'con tanta luce')
  // sopra, la guaritrice
  vero('torcia-sopra', sopra('cavaliere', { gemme: 20 }))
  falso('torcia-sopra', sopra('cavaliere', { gemme: 20 }, null, { mercanti: [] }), 'se la guaritrice non si è ancora trovata')
  falso('torcia-sopra', sopra('cavaliere', { gemme: 2 }), 'senza gemme')
  falso('torcia-sopra', sopra('cavaliere', { gemme: 20, torce: 1 }), 'con una torcia di scorta')
  uguale('torcia-sopra: quasi finita, l\'altra variante', candidati(sopra('cavaliere', { gemme: 20, torcia: 2 })).find(x => x.p.id === 'torcia-sopra')?.esito.variante, 'corta')

  // l'arma vecchia con tante gemme: il problema chiaro
  const vecchia = sopra('cavaliere', { gemme: 300, mano: 'spada-corta', mancina: 'scudo-legno' }, L10)
  vero('arma-vecchia', vecchia)
  controlla('arma-vecchia: è il primo pensiero, prima dei consigli', candidati(vecchia)[0].p.id === 'arma-vecchia', JSON.stringify(ids(vecchia)))
  falso('arma-vecchia', sopra('cavaliere', { gemme: 3, mano: 'spada-corta' }, L10), 'senza gemme')
  falso('arma-vecchia', sopra('cavaliere', { gemme: 300, mano: aLivello('spada', 10) }, L10), 'con un\'arma del suo livello')
  falso('arma-vecchia', sopra('cavaliere', { gemme: 300, mano: 'spada-corta' }, L10, { mercanti: [] }), 'se il fabbro non si conosce')
  vero('arma-vecchia', situazioneDi(new Corsa(CAMPAGNA[0], { seme: 5, crescita: L10, roba: roba({ gemme: 300, mano: 'spada-corta' }) })))
  uguale('arma-vecchia: a mani vuote, l\'altra variante', candidati(sopra('cavaliere', { gemme: 300 }, L10)).find(x => x.p.id === 'arma-vecchia')?.esito.variante, 'mani')

  vero('veste-vecchia', sopra('cavaliere', { gemme: 300, mano: aLivello('spada', 10), corpo: 'panciotto' }, L10))
  falso('veste-vecchia', sopra('cavaliere', { gemme: 300, corpo: aLivello('corazza', 10) }, L10), 'con una corazza del suo livello')
  vero('mano-libera', sopra('cavaliere', { gemme: 300, mano: aLivello('spada', 10) }, L10))
  falso('mano-libera', sopra('cavaliere', { gemme: 300, mano: aLivello('spadone', 10) }, L10), 'con un\'arma a due mani')
  falso('mano-libera', sopra('cavaliere', { gemme: 300, mano: aLivello('spada', 10), zaino: ['scudo-legno'] }, L10), 'con uno scudo in tasca')
  vero('posto-libero', sopra('cavaliere', { gemme: 300 }, L10))
  uguale('posto-libero: le dita piene, il collo', candidati(sopra('cavaliere', { gemme: 300, dito: 'anello-verde', dito2: 'anello-ambra' }, L10))
    .find(x => x.p.id === 'posto-libero')?.esito.variante, 'collo')
  falso('posto-libero', sopra('cavaliere', { gemme: 300, dito: 'anello-verde', dito2: 'anello-ambra', collo: 'medaglione' }, L10), 'tutto addosso')
  falso('posto-libero', sopra('cavaliere', { gemme: 300, zaino: ['anello-verde'] }, L10), 'con un anello in tasca')
  const piena = { gemme: 300, zaino: ['spada', 'accetta', 'scudo-legno', 'pozione', 'chiave', 'saio'] }
  vero('tasca-in-piu', sopra('cavaliere', piena, L10))
  falso('tasca-in-piu', sopra('cavaliere', { ...piena, gemme: 40 }, L10), 'con poche gemme')

  // lo zaino
  const pronto = sopra('cavaliere', { zaino: [aLivello('spada', 10)], mano: 'spada-corta' }, L10)
  vero('da-mettere', pronto)
  controlla('da-mettere: nomina il pezzo, con l\'articolo', /la spada/.test(di(pronto, 'da-mettere')), di(pronto, 'da-mettere'))
  falso('da-mettere', sopra('cavaliere', { zaino: ['spada-corta'], mano: aLivello('spada', 10), mancina: 'scudo-legno' }, L10), 'se è peggio di quello addosso')
  falso('da-mettere', sopra('cavaliere', { zaino: [aLivello('spada', 14)], mano: 'spada-corta' }, L10), 'se è di un livello che non ha')
  // un arco lungo per l'elfa senza destrezza: la caratteristica che manca
  const cr = { ...crescitaA(eroeDi('elfa'), 12), destrezza: 0 }
  const manca = sopra('elfa', { zaino: [aLivello('balestra', 12)] }, cr)
  vero('manca-caratteristica', manca)
  controlla('manca-caratteristica: dice quale', /destrezza/.test(di(manca, 'manca-caratteristica')) && /tenerla|usare/.test(di(manca, 'manca-caratteristica')), di(manca, 'manca-caratteristica'))
  vero('non-fa-per-me', sopra('mago', { zaino: ['accetta'] }))
  falso('non-fa-per-me', sopra('mago', { zaino: ['verga'] }), 'con una cosa sua')
  const pienaGiu = new Corsa(CAMPAGNA[0], { seme: 5, roba: roba({ zaino: ['spada', 'accetta', 'scudo-legno', 'pozione', 'chiave', 'saio'] }) })
  vero('zaino-pieno', situazioneDi(pienaGiu))
  falso('zaino-pieno', situazioneDi(buio), 'vuoto')
  vero('zaino-al-mercato', sopra('cavaliere', { zaino: ['spada', 'accetta', 'scudo-legno', 'medaglione', 'saio'] }))
  falso('zaino-al-mercato', sopra('cavaliere', { zaino: ['pozione', 'pozione-piccola', 'pozione-blu', 'elisir-toro', 'torcia'] }), 'solo roba da bere')
  // la chiave e la porta vista
  const chiave = new Corsa(CAMPAGNA[1], { seme: 9, roba: roba({ zaino: ['chiave'] }) })
  const porta = chiave.livello.robe.find(r => r.che === 'porta')
  if (porta) {
    falso('chiave-porta', situazioneDi(chiave), 'la porta non si è vista')
    chiave.visto[porta.y * chiave.livello.largo + porta.x] = 1
    vero('chiave-porta', situazioneDi(chiave))
  } else controlla('il piano di prova ha una porta', false)
  vero('elisir', sopra('cavaliere', { zaino: ['elisir-toro'] }))
  falso('elisir', sopra('cavaliere', { zaino: ['pozione'] }), 'con una pozione qualsiasi')

  // crescere
  const punti = crescitaA(eroeDi('cavaliere'), 5)
  const conPunti = { ...punti, forza: 0, tempra: 0, destrezza: 0, intelligenza: 0 }
  vero('punti-eroe', sopra('cavaliere', {}, conPunti))
  falso('punti-eroe', sopra('cavaliere', {}, punti), 'coi punti già dati')
  vero('punti-abilita', sopra('cavaliere', {}, nuda(punti)))
  controlla('punti-abilita: nomina il nodo della sua strada', /«.+»/.test(di(sopra('cavaliere', {}, nuda(punti)), 'punti-abilita')))
  falso('punti-abilita', sopra('cavaliere', {}, conLaStrada(nuda(punti), 'cavaliere')), 'col punto già speso')
  const mago = new Corsa(CAMPAGNA[0], { seme: 5, eroe: 'mago', crescita: { ...crescitaA(eroeDi('mago'), 4), albero: { 'scudo-arcano': 1 } } })
  vero('incanto', situazioneDi(mago))
  controlla('incanto: dice quale', /«Scudo arcano»/.test(di(situazioneDi(mago), 'incanto')), di(situazioneDi(mago), 'incanto'))
  mago.preparaDalCampo('scudo-arcano')
  falso('incanto', situazioneDi(mago), 'con l\'incanto già addosso')

  // le ferite
  const ferito = new Corsa(CAMPAGNA[0], { seme: 5, roba: roba({ zaino: ['pozione'] }) })
  ferito.vita = Math.floor(ferito.vitaMax * SOGLIE.vitaBassa)
  vero('mi-fa-male', situazioneDi(ferito))
  ferito.vita = ferito.vitaMax
  falso('mi-fa-male', situazioneDi(ferito), 'in piena forma')
  const grosso = ferito.livello.robe.find(r => r.che === 'mostro') || {}
  grosso.grosso = grosso.grosso || 'ossuto'; grosso.sveglio = true
  ferito.vita = Math.floor(ferito.vitaMax * 0.6)
  vero('prima-del-grosso', situazioneDi(ferito))
  grosso.sveglio = false
  falso('prima-del-grosso', situazioneDi(ferito), 'col grosso che dorme')
  const senza = new Corsa(CAMPAGNA[0], { seme: 5 })
  senza.vita = 2
  vero('letto-a-casa', situazioneDi(senza))
  vero('letto-a-casa', situazioneDi(senza), { momento: 'entrata' })
  falso('mi-fa-male', situazioneDi(senza), 'senza pozioni (lì è il letto)')
  const fonte = senza.livello.robe.find(r => r.che === 'fonte')
  if (fonte) {
    falso('gorgoglio', situazioneDi(senza), 'la fonte non si è vista')
    senza.visto[fonte.y * senza.livello.largo + fonte.x] = 1
    vero('gorgoglio', situazioneDi(senza))
    fonte.morto = true
    falso('gorgoglio', situazioneDi(senza), 'la fonte già bevuta')
  } else nota('il piano 0 del seme 5 non ha una fonte: «gorgoglio» si prova sotto')
  if (!visti.has('gorgoglio')) for (let seme = 1; seme < 60 && !visti.has('gorgoglio'); seme++) {
    const c = new Corsa(CAMPAGNA[0], { seme }); const f = c.livello.robe.find(r => r.che === 'fonte')
    if (!f) continue
    c.vita = 2; c.visto[f.y * c.livello.largo + f.x] = 1
    vero('gorgoglio', situazioneDi(c))
  }
  const forz = new Corsa(CAMPAGNA[0], { seme: 5 })
  const fz = forz.livello.robe.find(r => r.che === 'forziere' && !r.missione)
  if (fz) { falso('forziere', situazioneDi(forz), 'non visto'); forz.visto[fz.y * forz.livello.largo + fz.x] = 1; vero('forziere', situazioneDi(forz)) }
  for (let seme = 1; seme < 200 && !visti.has('forziere'); seme++) {
    const c = new Corsa(CAMPAGNA[seme % CAMPAGNA.length], { seme }); const f = c.livello.robe.find(r => r.che === 'forziere' && !r.missione)
    if (!f) continue
    c.visto[f.y * c.livello.largo + f.x] = 1
    vero('forziere', situazioneDi(c))
  }
  const blu = new Corsa(CAMPAGNA[0], { seme: 5, eroe: 'mago', roba: roba({ zaino: ['pozione-blu'] }), crescita: { ...crescitaA(eroeDi('mago'), 3), albero: { 'dardo-di-fuoco': 1 } } })
  blu.energia = 1
  vero('senza-magia', situazioneDi(blu))
  blu.energia = blu.energiaMax
  falso('senza-magia', situazioneDi(blu), 'col globo pieno')
  vero('senza-cure', sopra('cavaliere', { gemme: 20 }))
  falso('senza-cure', sopra('cavaliere', { gemme: 20, zaino: ['pozione'] }), 'con una pozione')

  stessaLista('ogni pensiero della tabella si raggiunge', PENSIERI.map(p => p.id).filter(id => !visti.has(id)), [])
}

/* ══════════ 3. su misura: ogni classe e ogni strada ══════════ */
{
  for (const classe of ['cavaliere', 'elfa', 'mago', 'nano']) for (const s of stradeDi(classe)) {
    const nome = `${classe}:${s.chiave}`
    const r = robaDellaStrada(classe, s, 4, { piu: 5 })
    const cr = { ...crescitaDellaStrada(classe, s, 4, 5) }
    const conAlbero = conLaStrada(nuda(cr), classe, s.abilita)
    // un punto dell'albero da spendere, per sentire il prossimo nodo della strada
    const ultimo = Object.keys(conAlbero.albero).find(id => s.abilita.includes(id))
    const albero = { ...conAlbero.albero }
    if (ultimo) { albero[ultimo]--; if (!albero[ultimo]) delete albero[ultimo] }
    const c = new Corredo({ eroe: classe, roba: { ...r, gemme: 900, mano: r.mano ? aLivello(baseDi(r.mano), 1) : null }, crescita: { ...cr, albero } })
    controlla(`${nome}: la strada si riconosce da com'è fatto l'eroe`, stradaDellEroe(c).arma.mani === s.arma.mani && s.arma.famiglie.includes(COSE[c.mano] ? COSE[c.mano].famiglia : s.arma.famiglie[0]),
              stradaDellEroe(c).chiave)
    const si = situazioneDi(c, { mercanti: TUTTI })
    const t = di(si, 'arma-vecchia')
    controlla(`${nome}: con tante gemme e l'arma vecchia, il problema chiaro`, !!t)
    const tipo = si.arma.tipo
    controlla(`${nome}: il tipo d'arma è della sua strada e della sua classe`, !!tipo && s.arma.famiglie.some(f => TIPI_ARMA[`${f}:${s.arma.mani}`] === tipo) &&
              portaLa(eroeDi(classe), COSE[tipo.base]), tipo && tipo.un)
    controlla(`${nome}: e lo regge, al livello che il fabbro gli venderebbe`, c.posso(aLivello(tipo.base, c.livelloPortabile(tipo.base, c.livelloEroe))))
    const altro = candidati(si).find(x => x.p.id === 'arma-vecchia')
    const t2 = testoDi(altro.p, altro.esito, 1, si.o)
    tutto.push(t2)
    controlla(`${nome}: le due varianti nominano l'arma o il tipo`, t.includes(si.arma.questa) && t2.includes(tipo.nuova), `${t} | ${t2}`)
    const fv = di(si, 'veste-vecchia') || ''
    controlla(`${nome}: la veste è quella che la classe porta`, !fv || fv.includes(eroeDi(classe).porta.includes('ferro') ? 'corazza' : 'mantello'), fv)
    const ms = di(si, 'mano-libera')
    controlla(`${nome}: lo scudo solo per le strade che lo vogliono`, !ms || s.mancina === 'scudo', ms)
    const pa = di(si, 'punti-abilita')
    nota(`${nome}: «${t}»${pa ? ` · «${pa}»` : ''}`)
  }
  // l'elfa è una lei
  controlla('l\'elfa si sente pronta, il nano pronto', /pronta/i.test(riempi('pront{o}', {}, situazioneDi(new Corredo({ eroe: 'elfa' })).o)) &&
            /pronto/i.test(riempi('pront{o}', {}, situazioneDi(new Corredo({ eroe: 'nano' })).o)))
  // niente da suggerire: il mago senza intelligenza non regge la bacchetta del suo livello? Il pensiero dell'arma tace
  const debole = new Corredo({ eroe: 'mago', roba: roba({ gemme: 900, mano: 'verga' }), crescita: { ...crescitaA(eroeDi('mago'), 1) } })
  controlla('un eroe al primo livello con l\'arma del primo livello non sente il bisogno di un\'arma', !ha(situazioneDi(debole, { mercanti: TUTTI }), 'arma-vecchia'))
}

/* ══════════ 4. gli accordi ══════════ */
{
  for (const t of [...Object.values(TIPI_ARMA), ...Object.values(TIPI_VESTE), SCUDO, ...Object.values(GIOIELLI)]) {
    controlla(`«${t.un}»: l'articolo è giusto`, t.un.startsWith(unoDi(t.nome, t.genere)), unoDi(t.nome, t.genere))
    if (t.nuova) controlla(`«${t.nuova}»: l'aggettivo si accorda`, t.genere === 'f' ? /nuova/.test(t.nuova) : /nuovo/.test(t.nuova))
    controlla(`«${t.un}»: il pezzo esiste`, !!COSE[t.base])
  }
  stessaLista('gli articoli', ['Spada corta', 'Arco lungo', 'Scudo di legno', 'Mantello', 'Ascia doppia', 'Zanna del drago'].map((n, i) => conArticolo(n, ['f', 'm', 'm', 'm', 'f', 'f'][i])),
              ['la spada corta', 'l\'arco lungo', 'lo scudo di legno', 'il mantello', 'l\'ascia doppia', 'la zanna del drago'])
  stessaLista('i dimostrativi', [questoDi('Spada corta', 'f'), questoDi('Arco lungo', 'm'), questoDi('Scettro', 'm'), questoDi('Ascia', 'f')],
              ['questa spada', 'quest\'arco', 'questo scettro', 'quest\'ascia'])
  uguale('la maiuscola a inizio frase', riempi('{questa_veste} ha visto giorni migliori. {dal} c\'è', { questa_veste: 'questa giubba', dal: 'dal fabbro' }),
         'Questa giubba ha visto giorni migliori. Dal fabbro c\'è')
  for (const v of Object.values(DIVENTARE)) controlla(`«${v}»: si accorda con l'eroe`, !/\{(?!o\})/.test(v))
}

/* ══════════ 5. il lessico: desideri, non ordini; come sta, non com'è l'oggetto ══════════ */
{
  // ogni testo, coi segnaposto riempiti da parole vere (una variante per classe è già in `tutto`)
  const parole = { arma: 'un arco', arma_nuova: 'un arco nuovo', questa: 'quest\'arco', dal: 'dal fabbro', veste: 'una corazza', veste_nuova: 'una corazza nuova',
                   questa_veste: 'questa giubba', cosa: 'la spada corta', lo: 'la', car: 'destrezza', piu: 'più forte', abilita: 'Fendente', incanto: 'Scudo arcano' }
  for (const p of PENSIERI) for (const fila of Array.isArray(p.testi) ? [p.testi] : Object.values(p.testi))
    for (const t of fila) for (const o of ['o', 'a']) tutto.push(riempi(t, parole, o))
  const ORDINI = /\b(compra|comprati|compratelo|vai|va'|andate|devi|dovresti|bisogna|ricordati|ricorda|bevi|bevila|metti|mettiti|indossa|usa|apri|impara|vendi|spendi|torna|prendi|guarda|tocca|scendi|sali|prova)\b/i
  const GIUDIZI = /\b(buon[oaie]?|buonissim\w*|squisit\w*|gustos\w*|sapore|saporit\w*|delizios\w*|appetitos\w*|ottim[oaie])\b/i
  // le parole lunghe ammesse: tutte quelle che un bambino di sei anni sente leggere in una storia (le altre si aggiungono qui, pensandoci)
  const LUNGHE = new Set(['guaritrice', 'incantatrice', 'piacerebbe', 'rimetterebbe', 'tranquillo', 'tranquilla', 'occhiolino', 'abbastanza',
    'avvelenato', 'scintille', 'starebbe', 'sentirei', 'servirebbe', 'stanchezza', 'gorgoglio', 'qualcosa', 'tintinna', 'ammaccato', 'ammaccata',
    'tranquillo', 'spegnendo', 'migliori', 'giorni', 'leggero', 'leggera', 'sapiente', 'destrezza', 'intelligenza', 'incantata', 'arcano',
    'incanto', 'bestione', 'farebbe', 'avessi', 'sarebbe', 'qualche', 'mantello', 'corazza', 'bacchetta', 'spadone', 'misura', 'sicuro',
    'davvero', 'pozione', 'pozioni', 'fortuna', 'robusti', 'robusto', 'robusta', 'proprio', 'bastone', 'magico', 'piccola', 'stretto',
    'nemmeno', 'mercante', 'sembrato', 'giornata', 'prossimo', 'liberata', 'graffio', 'potrei', 'diventare', 'rimettere', 'pensiero',
    'avvelenato', 'aspetta', 'aspetto', 'aspettano', 'pizzica', 'chiusa', 'chiuso', 'lasciato', 'fiammella', 'meglio', 'comoda', 'qualcuno',
    'quassù', 'sentito', 'parlato', 'vorrebbe', 'vorrei', 'servirebbe', 'tremano', 'ginocchia', 'incuriosisce', 'sentirei', 'diventerei',
    'ancora', 'stancο', 'tenerlo', 'tenerla', 'farmene', 'leggero', 'sentirmi', 'arrivare', 'scorta', 'quest\'arco', 'quest\'ascia',
    'pietra', 'Spaccaroccia', 'Stoccata', 'Fendente', 'Dardo', 'avvelenato', 'Lama', 'incantata', 'qualcos\'altro', 'scoppia', 'livido'])
  const lunghe = new Map()
  for (const t of tutto) {
    controlla(`niente ordini: «${t}»`, !ORDINI.test(t))
    controlla(`niente giudizi sull'oggetto: «${t}»`, !GIUDIZI.test(t))
    controlla(`niente segnaposto rimasti: «${t}»`, !/[{}]/.test(t))
    controlla(`corto: «${t}»`, t.length <= 130 && t.split(/\s+/).length <= 24, String(t.length))
    controlla(`comincia con la maiuscola: «${t}»`, /^[A-ZÀ-Ú«]/.test(t))
    // le parole di più di nove lettere fuori dai nomi del gioco (l'albero, la roba: «Spaccaroccia» è un nome) vogliono un posto nella lista
    for (const w of t.replace(/«[^»]*»/g, '').split(/[^a-zA-ZàèéìòùÀ-Ú]+/).filter(w => w.length > 9))
      if (!LUNGHE.has(w) && !LUNGHE.has(w.toLowerCase())) lunghe.set(w, t)
  }
  controlla('le parole lunghe sono tutte nella lista', !lunghe.size, [...lunghe].map(([w, t]) => `${w} (${t})`).join(' · '))
  nota(`${tutto.length} testi letti`)
}

/* ══════════ 6. il ritmo e la memoria ══════════ */
{
  const buio = situazioneDi(new Corsa(CAMPAGNA[0], { seme: 5 }))
  const g = giroDi(0, 5)
  let m = MEMORIA_NUOVA()
  const p = scegli(buio, m, { momento: 'entrata', adesso: 1e9, giro: g })
  uguale('entrando senza torcia: il pensiero della torcia', p && p.id, 'senza-torcia')
  m = ricorda(m, p, { adesso: 1e9 })
  uguale('detto, non torna nello stesso giro', scegli(buio, m, { momento: 'entrata', adesso: 1e9 + 600000, giro: g }), null)
  uguale('né in un altro giro prima di mezz\'ora', scegli(buio, m, { momento: 'entrata', adesso: 1e9 + 10 * 60000, giro: giroDi(0, 6) }), null)
  uguale('dopo mezz\'ora, in un giro nuovo, sì', scegli(buio, m, { momento: 'entrata', adesso: 1e9 + 31 * 60000, giro: giroDi(0, 6) })?.id, 'senza-torcia')
  const t2 = scegli(buio, m, { momento: 'entrata', adesso: 1e9 + 31 * 60000, giro: giroDi(0, 6) }).testo
  controlla('la seconda volta un altro testo', t2 !== p.testo, t2)
  // la memoria passa dalla sosta: riletta da JSON è la stessa
  const riletta = rileggiMemoria(JSON.parse(JSON.stringify(m)))
  uguale('la memoria riletta dalla sosta non ridice', scegli(buio, riletta, { momento: 'entrata', adesso: 1e9 + 1000, giro: g }), null)
  uguale('una memoria storta è vuota', rileggiMemoria({ v: 99, detti: 3 }).nelGiro, 0)
  // la pausa fra due pensieri, il tetto del giro, i problemi che tornano
  const cr = crescitaA(eroeDi('cavaliere'), 10)
  const s = sopra('cavaliere', { gemme: 300, mano: 'spada-corta' }, { ...cr, forza: 0, tempra: 0, destrezza: 0, intelligenza: 0, albero: {} })
  let mm = MEMORIA_NUOVA(), t = 0
  const detti = []
  for (let i = 0; i < 400; i++) {
    t += 10000
    const x = scegli(s, mm, { adesso: t })
    if (x) { detti.push([x.id, t]); mm = ricorda(mm, x, { adesso: t }) }
  }
  controlla('una visita: al più tre pensieri', detti.length <= RITMO.nelGiro, JSON.stringify(detti))
  uguale('il primo è il problema', detti[0] && detti[0][0], 'arma-vecchia')
  controlla('al più due consigli', detti.filter(([id]) => PENSIERO[id].tono === 'consiglio').length <= RITMO.consigliNelGiro)
  controlla('almeno cinquanta secondi fra due pensieri', detti.every(([, a], i) => !i || a - detti[i - 1][1] >= RITMO.pausa))
  controlla('mai due uguali di fila', detti.every(([id], i) => !i || id !== detti[i - 1][0]))
  // il villaggio dopo un'altra discesa è un giro nuovo: il problema torna, i consigli no prima di mezz'ora
  mm = entraNelGiro(mm, giroDi(1, 1))
  const dopo = scegli(s, mm, { adesso: t + RITMO.ripetiProblema })
  uguale('dopo un\'altra discesa il problema torna', dopo && dopo.id, 'arma-vecchia')
  uguale('entrare nella stessa discesa non cambia il giro', JSON.stringify(entraNelGiro(mm, giroDi(1, 1))), JSON.stringify(mm))
}

/* ══════════ 7. discese vere: quanti pensieri escono ══════════ */
{
  const conti = []
  for (const [i, seme] of [[0, 3], [1, 7], [2, 11], [3, 19]]) {
    let m = MEMORIA_NUOVA(), detti = [], ultimoGuardo = -99
    const giro = giroDi(i, seme)
    let primo = true
    const orologio = c => (c.camminati / PASSO_EROE + c.domande * 6)   // secondi di gioco, a occhio: il cammino e le domande
    gioca(CAMPAGNA[i], { seme, come: 'tutto', guarda: c => {
      const ora = orologio(c)
      const momento = primo ? 'entrata' : ora >= RITMO.primoCammino && ora - ultimoGuardo >= RITMO.ogni ? 'cammino' : null
      if (!momento) return
      if (!primo) ultimoGuardo = ora
      primo = false
      const p = scegli(situazioneDi(c), m, { momento, adesso: ora * 1000, giro })
      if (p) { detti.push(p.id); m = ricorda(m, p, { adesso: ora * 1000 }) }
    } })
    conti.push(detti)
    controlla(`discesa ${i}: al più ${RITMO.nelGiro} pensieri`, detti.length <= RITMO.nelGiro, detti.join(','))
    controlla(`discesa ${i}: nessuno due volte di fila`, detti.every((id, k) => !k || id !== detti[k - 1]))
  }
  controlla('in quattro discese i pensieri escono', conti.flat().length >= 2, JSON.stringify(conti))
  nota('pensieri nelle discese giocate dal banco:', conti.map(d => d.join(' → ') || '—').join(' | '))
}

riassunto('i pensieri dell\'eroe')
