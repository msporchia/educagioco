// I pensieri dell'eroe (docs/sotterraneo/pensieri.md): dalla roba (un Corredo sopra, la Corsa giù) la situazione, dalla
// situazione e dalla memoria il pensiero da dire adesso, o nessuno. Puro: niente Vue, niente DOM, niente orologio suo
// (chi chiama passa `adesso`); gira in Node. La memoria sta nell'avventura (`cfg.avventure[eroe].pensieri`), così una
// discesa ripresa non ridice quello che ha già detto.
import { PENSIERI, RITMO, SOGLIE, TIPI_ARMA, TIPI_VESTE, SCUDO, MERCANTI_DETTI, GENERE_EROE } from '../dati/pensieri.js'
import { COSE, aLivello, livelloDelPezzo } from '../dati/cose.js'
import { CARATTERISTICHE } from '../dati/livelli.js'
import { NODI } from '../dati/abilita.js'
import { stradeDi } from '../dati/strade.js'
import { puntiDaDare, prossimoPunto } from './crescita.js'
import { puntiAbilita, spesiDella, prossimoDellaStrada } from './abilita.js'
import { eCura } from './corredo.js'

export const VERSIONE_PENSIERI = 1
export const MEMORIA_NUOVA = () => ({ v: VERSIONE_PENSIERI, detti: {}, giro: null, nelGiro: 0, consigli: 0, qui: {}, ultimo: null, ultimoGiu: null })

const oggetto = v => !!v && typeof v === 'object' && !Array.isArray(v)
const numero = v => (Number.isFinite(v) ? v : 0)

// la memoria letta dall'avventura: un dato storto, o di un'altra versione, è una memoria vuota (si ridirà qualcosa, niente di più)
export function rileggiMemoria(dato) {
  if (!oggetto(dato) || dato.v !== VERSIONE_PENSIERI) return MEMORIA_NUOVA()
  const detti = {}
  for (const [id, d] of Object.entries(oggetto(dato.detti) ? dato.detti : {}))
    if (oggetto(d) && PENSIERI.some(p => p.id === id)) detti[id] = { t: numero(d.t), n: Math.max(0, Math.floor(numero(d.n))) }
  const qui = {}
  for (const [id, n] of Object.entries(oggetto(dato.qui) ? dato.qui : {})) if (numero(n) > 0) qui[id] = Math.floor(n)
  return {
    v: VERSIONE_PENSIERI, detti, qui,
    giro: typeof dato.giro === 'string' ? dato.giro : null,
    nelGiro: Math.max(0, Math.floor(numero(dato.nelGiro))), consigli: Math.max(0, Math.floor(numero(dato.consigli))),
    ultimo: oggetto(dato.ultimo) && typeof dato.ultimo.id === 'string' ? { id: dato.ultimo.id, t: numero(dato.ultimo.t), giro: dato.ultimo.giro || null } : null,
    ultimoGiu: typeof dato.ultimoGiu === 'string' ? dato.ultimoGiu : null,
  }
}

/* ═══════════ le parole: articoli e accordi ═══════════ */
const VOCALE = /^[aeiouàèéìòù]/i
// davanti a s+consonante, z, gn, ps, x, y, pn il maschile vuole «lo»
const VUOLE_LO = /^(s[^aeiouàèéìòù]|z|gn|ps|pn|x|y)/i
const minuscola = s => s.charAt(0).toLowerCase() + s.slice(1)
// «la spada corta», «l'arco lungo», «lo scudo di legno», «il mantello»
export function conArticolo(nome, genere) {
  const n = minuscola(nome)
  if (VOCALE.test(n)) return `l'${n}`
  if (genere === 'f') return `la ${n}`
  return VUOLE_LO.test(n) ? `lo ${n}` : `il ${n}`
}
// «questa spada», «quest'arco», «questo mantello»: della prima parola del nome, cioè del tipo di pezzo
export function questoDi(nome, genere) {
  const n = minuscola(String(nome).split(' ')[0])
  if (VOCALE.test(n)) return `quest'${n}`
  return `${genere === 'f' ? 'questa' : 'questo'} ${n}`
}
// l'articolo indeterminativo giusto per un nome: il test degli accordi lo confronta con le tabelle di dati/pensieri.js
export function unoDi(nome, genere) {
  if (genere === 'f') return VOCALE.test(nome) ? `un'${nome}` : `una ${nome}`
  return VOCALE.test(nome) ? `un ${nome}` : VUOLE_LO.test(nome) ? `uno ${nome}` : `un ${nome}`
}
const genereDi = k => (COSE[k] && COSE[k].genere === 'f' ? 'f' : 'm')
const dettoDi = k => conArticolo(COSE[k].nome, genereDi(k))

/* ═══════════ la strada dell'eroe ═══════════
   Le strade (dati/strade.js) non sono una scelta nel gioco: si riconoscono da come è fatto l'eroe. L'arma in mano (famiglia e
   mani), lo scudo, i nodi dell'albero che ha preso; a pari merito quella dell'arma che la classe porta per prima */
export function stradaDellEroe(c) {
  const tutte = stradeDi(c.io.chiave)
  if (!tutte.length) return null
  const m = COSE[c.mano] && COSE[c.mano].dove === 'mano' ? COSE[c.mano] : null
  const scudo = !!(COSE[c.mancina] && COSE[c.mancina].dove === 'mancina')
  const albero = Object.keys((c.crescita && c.crescita.albero) || {})
  const prima = (c.io.porta || [])[0]
  let meglio = null, punti = -Infinity
  for (const s of tutte) {
    let p = s.arma.famiglie.includes(prima) ? 0.5 : 0
    if (m) {
      if (s.arma.famiglie.includes(m.famiglia)) p += 4
      if ((m.mani || 1) === s.arma.mani) p += 2
    }
    // le mani vuote non dicono niente della mancina: a mani nude vince la prima strada della classe
    if ((m || scudo) && scudo === (s.mancina === 'scudo')) p += 1
    p += albero.filter(id => s.abilita.includes(id)).length
    if (p > punti) { punti = p; meglio = s }
  }
  return meglio
}

// chi vende cosa (dati/mercanti.js): le bacchette e la stoffa l'incantatrice, il resto il fabbro
const mercanteDelleArmi = famiglia => (famiglia === 'bacchette' ? 'incantatrice' : 'armaiolo')

// il pezzo del tipo `base` che l'eroe porterebbe adesso: al livello più alto fino al suo che regge (i requisiti), o null se non
// lo regge nemmeno al primo (allora non si nomina: mai un pezzo che non può usare)
function pezzoPortabile(c, base) {
  const L = c.livelloPortabile(base, c.livelloEroe)
  const k = aLivello(base, L)
  return c.posso(k) ? { k, L } : null
}

/* La situazione: tutto quello che le condizioni guardano, in numeri, vero/falso e parole già accordate. `c` è un Corredo
   (sopra) o una Corsa (giù: ha `livello`, il piano). `extra`: { mercanti (i mercanti già trovati sopra), vita, vitaMax
   (sopra, dopo il portale) } */
export function situazioneDi(c, extra = {}) {
  const giu = !!c.livello && typeof c.livello === 'object'
  const L = c.livelloEroe
  const io = c.io
  const zaino = c.zaino
  const vita = giu ? c.vita : numero(extra.vita) || c.vitaConLaRoba
  const vitaMax = giu ? c.vitaMax : numero(extra.vitaMax) || c.vitaConLaRoba
  const energiaMax = c.energiaMax
  const energia = giu ? c.energia : energiaMax
  const strada = stradaDellEroe(c)

  // l'arma della strada: la famiglia di quella in mano se la strada la impugna, se no la prima della strada
  const mano = COSE[c.mano] && COSE[c.mano].dove === 'mano' ? COSE[c.mano] : null
  const arma = { k: c.mano || null, tipo: null, vecchia: false, prezzo: Infinity, mercante: null, dal: '', questa: '' }
  if (strada) {
    const fam = mano && strada.arma.famiglie.includes(mano.famiglia) ? mano.famiglia : strada.arma.famiglie[0]
    const tipo = TIPI_ARMA[`${fam}:${strada.arma.mani}`]
    const p = tipo && pezzoPortabile(c, tipo.base)
    if (p) {
      arma.tipo = tipo
      arma.vecchia = !mano || livelloDelPezzo(c.mano) <= p.L - SOGLIE.vecchio
      arma.prezzo = c.quantoCosta(p.k)
      arma.mercante = mercanteDelleArmi(fam)
      arma.dal = MERCANTI_DETTI[arma.mercante].dal
      arma.questa = mano ? questoDi(mano.nome, genereDi(c.mano)) : ''
    }
  }
  // la veste della famiglia che la classe porta (il ferro o la stoffa)
  const fv = (io.porta || []).find(f => TIPI_VESTE[f])
  const veste = { k: c.corpo || null, tipo: null, vecchia: false, prezzo: Infinity, mercante: null, dal: '', questa: '' }
  if (fv) {
    const tipo = TIPI_VESTE[fv], p = pezzoPortabile(c, tipo.base)
    if (p) {
      veste.tipo = tipo
      veste.vecchia = !c.corpo || livelloDelPezzo(c.corpo) <= p.L - SOGLIE.vecchio
      veste.prezzo = c.quantoCosta(p.k)
      veste.mercante = tipo.mercante
      veste.dal = MERCANTI_DETTI[tipo.mercante].dal
      veste.questa = c.corpo && COSE[c.corpo] ? questoDi(COSE[c.corpo].nome, genereDi(c.corpo)) : ''
    }
  }
  // lo scudo: solo per le strade che lo vogliono, con la mano davvero libera e niente scudo in tasca (quello è «da-mettere»)
  const scudoPezzo = pezzoPortabile(c, SCUDO.base)
  const scudo = {
    serve: !!(strada && strada.mancina === 'scudo' && scudoPezzo && c.mancinaLibera() && !zaino.some(k => COSE[k] && COSE[k].dove === 'mancina')),
    prezzo: scudoPezzo ? c.quantoCosta(scudoPezzo.k) : Infinity,
  }

  // lo zaino: un pezzo che adesso va addosso, uno che la classe porta ma a cui manca la caratteristica, uno che non fa per lei
  const pezzi = [...new Set(zaino)].filter(k => COSE[k] && COSE[k].dove)
  const daMettere = pezzi.find(k => c.vaAddosso(k)) || null
  const manca = pezzi.find(k => c.porta(k) && c.livelloBasta(k) && !c.reggo(k) && c.requisito(k))
  const nonPerMe = pezzi.find(k => !c.porta(k)) || null
  const car = manca ? CARATTERISTICHE.find(x => x.chiave === c.requisito(manca).car) : null
  const gioielloInTasca = zaino.some(k => COSE[k] && (COSE[k].dove === 'dito' || COSE[k].dove === 'collo'))

  // crescere: dove andrebbe il prossimo punto e il prossimo nodo seguendo la strada, e l'incanto pronto da lanciare
  const pp = puntiDaDare(c.crescita) > 0 ? prossimoPunto(c.crescita, io, strada ? strada.punti : null) : null
  const pa = puntiAbilita(c.crescita) > 0 ? prossimoDellaStrada(c.crescita, io.chiave, strada ? strada.abilita : null) : null

  const s = {
    luogo: giu ? 'giu' : 'sopra',
    eroe: io.chiave, strada: strada ? strada.chiave : null, o: GENERE_EROE[io.chiave] === 'f' ? 'a' : 'o',
    livello: L, gemme: c.gemme,
    vita, vitaMax, quota: vita / Math.max(1, vitaMax),
    energia, energiaMax, quotaEnergia: energia / Math.max(1, energiaMax),
    torcia: { accesa: c.torciaAccesa, resta: c.torciaResta, scorta: c.torceInScorta },
    cure: zaino.filter(eCura).length,
    pozioneBlu: zaino.some(k => COSE[k] && COSE[k].usa === 'energia'),
    elisir: zaino.some(k => COSE[k] && COSE[k].usa === 'cresci'),
    posti: c.postiUsati(), capienza: c.capienza,
    // quello che il mercante comprerebbe: non le cure (servono), non l'elisir (vale per sempre)
    vendibili: zaino.filter(k => COSE[k] && !COSE[k].usa && c.quantoVale(k) > 0).length,
    puntiEroe: puntiDaDare(c.crescita), puntiAbilita: puntiAbilita(c.crescita), abilitaImparate: spesiDella(c.crescita),
    prossimoPunto: pp, prossimaAbilita: pa && NODI[pa] ? NODI[pa].nome : null,
    arma, veste, scudo,
    daMettere: daMettere ? { k: daMettere, detto: dettoDi(daMettere) } : null,
    mancaCar: manca && car ? { k: manca, detto: dettoDi(manca), lo: genereDi(manca) === 'f' ? 'la' : 'lo', car: minuscola(car.nome) } : null,
    nonPerMe: nonPerMe ? { k: nonPerMe, detto: dettoDi(nonPerMe) } : null,
    liberi: { dito: !gioielloInTasca && (!c.dito || !c.dito2), collo: !gioielloInTasca && !c.collo },
    prezzi: {
      gioiello: c.quantoCosta(aLivello('amuleto-azzurro', Math.max(1, L))),
      torcia: COSE.torcia.prezzo, cura: COSE['pozione-piccola'].prezzo, tasca: c.costoTasca,
    },
    mercanti: new Set(extra.mercanti || []),
    // giù: il piano, le cose viste (`visto`: mai stato è nero), il grosso, gli incanti
    incanto: null, incantiAddosso: 0,
    fonteVista: false, forziereVisto: false, chiaveEPorta: false, grossoSveglio: false,
  }
  if (giu) {
    const liv = c.livello, visto = (x, y) => !!(c.visto && c.visto[y * liv.largo + x])
    const pronto = c.preparabili().find(n => !c.perchéNonPrepari(n.id))
    s.incanto = pronto ? pronto.nome : null
    s.incantiAddosso = c.preparati.length
    for (const r of liv.robe) {
      if (r.che === 'fonte' && !r.morto && visto(r.x, r.y)) s.fonteVista = true
      if (r.che === 'forziere' && !r.aperto && !r.missione && visto(r.x, r.y)) s.forziereVisto = true
      if (r.che === 'porta' && !r.aperta && zaino.includes('chiave') && visto(r.x, r.y)) s.chiaveEPorta = true
      if (r.che === 'mostro' && r.grosso && !r.morto && r.sveglio) s.grossoSveglio = true
    }
  }
  return s
}

// i pensieri veri adesso, in quel posto e in quel momento: prima i problemi, poi i consigli, nell'ordine della tabella.
// [{ p, esito }], dove `esito` è quello che la condizione ha detto ({ variante?, parole?, segno? })
export function candidati(s, { luogo = s.luogo, momento = 'cammino' } = {}) {
  const fuori = []
  for (const p of PENSIERI) {
    if (!p.dove.includes(luogo) || !p.quando.includes(momento)) continue
    const esito = p.se(s)
    if (esito) fuori.push({ p, esito })
  }
  return fuori.sort((a, b) => (a.p.tono === b.p.tono ? 0 : a.p.tono === 'problema' ? -1 : 1))
}

// i segnaposto riempiti (le parole dell'esito e la vocale dell'eroe), e la maiuscola a inizio frase
export function riempi(testo, parole = {}, o = 'o') {
  const tutte = { ...parole, o }
  let t = testo
  for (let i = 0; i < 3 && /\{[a-z_]+\}/.test(t); i++) t = t.replace(/\{([a-z_]+)\}/g, (x, k) => (tutte[k] != null ? tutte[k] : x))
  return t.replace(/(^|[.!?] )([a-zàèéìòù])/g, (x, a, b) => a + b.toUpperCase())
}

// il testo: la fila della variante, e dentro la fila si gira (`n`: quante volte è già stato detto). Mai due uguali di fila
export function testoDi(p, esito = {}, n = 0, o = 'o') {
  const fila = Array.isArray(p.testi) ? p.testi : (p.testi[esito.variante] || Object.values(p.testi)[0])
  return riempi(fila[n % fila.length], esito.parole, o)
}

// il giro di sopra: la visita al villaggio dopo l'ultima discesa (o prima di tutte)
export const giroDiSopra = m => `sopra@${m.ultimoGiu || '-'}`

/* Il pensiero da dire adesso, o null. `adesso`: millisecondi (Date.now()); `giro`: la discesa (`giu:<tappa>:<seme>`), o niente
   sopra. Le regole del ritmo (RITMO, docs/sotterraneo/pensieri.md, «Il ritmo»): al più `nelGiro` pensieri a giro, e di
   questi `consigliNelGiro` consigli; `pausa` fra due pensieri (`pausaEntrata` entrando); un consiglio una volta a giro e
   non prima di `ripetiConsiglio` dall'ultima volta; un problema al più `problemaNelGiro` volte a giro, a `ripetiProblema`
   l'una dall'altra; lo stesso pensiero mai due volte di fila nello stesso giro */
export function scegli(s, memoria, { luogo = s.luogo, momento = 'cammino', adesso = 0, giro = null } = {}) {
  const m = rileggiMemoria(memoria)
  const g = giro || giroDiSopra(m)
  const stesso = m.giro === g
  const nelGiro = stesso ? m.nelGiro : 0, consigli = stesso ? m.consigli : 0, qui = stesso ? m.qui : {}
  if (nelGiro >= RITMO.nelGiro) return null
  if (m.ultimo && adesso - m.ultimo.t < (momento === 'entrata' ? RITMO.pausaEntrata : RITMO.pausa)) return null
  for (const { p, esito } of candidati(s, { luogo, momento })) {
    if (m.ultimo && m.ultimo.id === p.id && m.ultimo.giro === g) continue
    const d = m.detti[p.id]
    if (p.tono === 'consiglio') {
      if (qui[p.id] || consigli >= RITMO.consigliNelGiro) continue
      if (d && adesso - d.t < RITMO.ripetiConsiglio) continue
    } else {
      if ((qui[p.id] || 0) >= RITMO.problemaNelGiro) continue
      if (d && adesso - d.t < RITMO.ripetiProblema) continue
    }
    const segno = esito.segno !== undefined ? esito.segno : (p.segno || null)
    return { id: p.id, tono: p.tono, icona: p.icona, testo: testoDi(p, esito, d ? d.n : 0, s.o), segno, variante: esito.variante || null, giro: g }
  }
  return null
}

// la memoria dopo aver detto `detto` (quello che scegli ha tornato): una copia nuova, da scrivere nell'avventura
export function ricorda(memoria, detto, { adesso = 0 } = {}) {
  const m = rileggiMemoria(memoria)
  const g = detto.giro || giroDiSopra(m)
  const stesso = m.giro === g
  const qui = stesso ? { ...m.qui } : {}
  qui[detto.id] = (qui[detto.id] || 0) + 1
  const prima = m.detti[detto.id]
  return {
    ...m,
    detti: { ...m.detti, [detto.id]: { t: adesso, n: (prima ? prima.n : 0) + 1 } },
    giro: g, qui,
    nelGiro: (stesso ? m.nelGiro : 0) + 1,
    consigli: (stesso ? m.consigli : 0) + (detto.tono === 'consiglio' ? 1 : 0),
    ultimo: { id: detto.id, t: adesso, giro: g },
    ultimoGiu: g.startsWith('giu:') ? g : m.ultimoGiu,
  }
}

// il giro di una discesa: la tappa e il seme (una discesa ripresa dal portale è la stessa; ricominciata, un'altra)
export const giroDi = (tappa, seme) => `giu:${tappa}:${seme}`

// si comincia una discesa: la visita al villaggio dopo di lei sarà un giro nuovo, anche se giù non si è pensato niente.
// Torna la memoria di prima se non cambia niente (una discesa ripresa)
export function entraNelGiro(memoria, giro) {
  const m = rileggiMemoria(memoria)
  return m.ultimoGiu === giro ? m : { ...m, ultimoGiu: giro }
}
